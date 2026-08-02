-- ============================================
-- УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
-- Webapp: comments, votes, feedback, subscribers
-- Run once in Supabase → SQL Editor.
-- ============================================

-- ---------- PROFILES ----------
create table public.profiles (
    id uuid primary key references auth.users on delete cascade,
    display_name text,
    created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- COMMENTS ----------
create table public.comments (
    id bigserial primary key,
    article_slug text not null,
    user_id uuid not null references auth.users on delete cascade,
    parent_id bigint references public.comments(id) on delete cascade,
    author_name text,
    body text not null check (length(body) between 1 and 2000),
    status text not null default 'published' check (status in ('published', 'hidden')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index comments_article_idx on public.comments (article_slug, created_at);
create index comments_parent_idx on public.comments (parent_id);
alter table public.comments enable row level security;
create policy comments_select_public on public.comments for select using (status = 'published');
create policy comments_select_own_hidden on public.comments for select using (auth.uid() = user_id);
create policy comments_insert_auth on public.comments for insert with check (auth.uid() = user_id);
create policy comments_update_own on public.comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy comments_delete_own on public.comments for delete using (auth.uid() = user_id);

-- ---------- ARTICLE VOTES ----------
create table public.article_votes (
    article_slug text not null,
    user_id uuid not null references auth.users on delete cascade,
    vote smallint not null check (vote in (-1, 1)),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (article_slug, user_id)
);
alter table public.article_votes enable row level security;
create policy article_votes_select_own on public.article_votes for select using (auth.uid() = user_id);
create policy article_votes_insert_own on public.article_votes for insert with check (auth.uid() = user_id);
create policy article_votes_update_own on public.article_votes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy article_votes_delete_own on public.article_votes for delete using (auth.uid() = user_id);

-- ---------- COMMENT VOTES ----------
create table public.comment_votes (
    comment_id bigint not null references public.comments(id) on delete cascade,
    user_id uuid not null references auth.users on delete cascade,
    vote smallint not null check (vote in (-1, 1)),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (comment_id, user_id)
);
alter table public.comment_votes enable row level security;
create policy comment_votes_select_own on public.comment_votes for select using (auth.uid() = user_id);
create policy comment_votes_insert_own on public.comment_votes for insert with check (auth.uid() = user_id);
create policy comment_votes_update_own on public.comment_votes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy comment_votes_delete_own on public.comment_votes for delete using (auth.uid() = user_id);

-- ---------- SCORE VIEWS (public aggregates) ----------
create or replace view public.article_scores
as select
    article_slug,
    count(*) filter (where vote = 1) as upvotes,
    count(*) filter (where vote = -1) as downvotes,
    coalesce(sum(vote), 0) as score,
    count(*) as total
from public.article_votes
group by article_slug;
grant select on public.article_scores to anon, authenticated;

create or replace view public.comment_scores
as select
    comment_id,
    count(*) filter (where vote = 1) as upvotes,
    count(*) filter (where vote = -1) as downvotes,
    coalesce(sum(vote), 0) as score,
    count(*) as total
from public.comment_votes
group by comment_id;
grant select on public.comment_scores to anon, authenticated;

-- ---------- FEEDBACK (anonymous) ----------
create table public.feedback (
    id bigserial primary key,
    article_slug text,
    kind text not null default 'other' check (kind in ('error', 'suggestion', 'other')),
    message text not null check (length(message) between 1 and 2000),
    contact text,
    created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
create policy feedback_insert_anon on public.feedback for insert with check (true);

-- ---------- SUBSCRIBERS (newsletter) ----------
create table public.subscribers (
    id bigserial primary key,
    email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    created_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
create policy subscribers_insert_anon on public.subscribers for insert with check (true);

-- ---------- ARTICLES (dynamic markdown content) ----------
create table public.articles (
    id bigserial primary key,
    slug text not null unique,
    title text not null,
    description text,
    content text not null, -- markdown content
    tag text,
    image_url text,
    reading_minutes int,
    published boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index articles_slug_idx on public.articles (slug);
create index articles_published_idx on public.articles (published, created_at desc);
alter table public.articles enable row level security;
create policy articles_select_public on public.articles for select using (published = true);
create policy articles_select_all on public.articles for select using (true);
create policy articles_insert_admin on public.articles for insert with check (true);
create policy articles_update_admin on public.articles for update using (true) with check (true);
create policy articles_delete_admin on public.articles for delete using (true);
