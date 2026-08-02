/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Votes: up/down on articles and on comments.
 * Re-runnable (SPA-safe): call window.Votes.init() after content swaps.
 * Requires login to vote (see js/supabase-client.js).
 */
(function() {
    'use strict';

    function currentSlug() {
        var m = window.location.pathname.match(/\/([^/]+)\.html?$/i);
        return m ? m[1] : '';
    }

    function btn(cls, vote, label) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'vote-btn ' + cls;
        b.setAttribute('data-vote', String(vote));
        b.setAttribute('aria-label', label);
        b.textContent = cls.indexOf('up') !== -1 ? '\u25B2' : '\u25BC';
        return b;
    }

    /* ---- article vote block ---- */
    function articleBlock() {
        var slug = currentSlug();
        var main = document.querySelector('main.article-page article, main.article-page .article-content-simple');
        if (!slug || !main) return;

        var old = document.getElementById('article-vote-box');
        if (old && old.parentNode) old.parentNode.removeChild(old);

        var box = document.createElement('div');
        box.className = 'vote-box';
        box.id = 'article-vote-box';

        var up = btn('vote-up', 1, 'Голосувати за');
        var score = document.createElement('span');
        score.className = 'vote-score';
        score.textContent = '\u2013';
        var down = btn('vote-down', -1, 'Голосувати проти');
        var caption = document.createElement('span');
        caption.className = 'vote-caption';
        caption.textContent = 'Чи корисна ця стаття?';

        box.appendChild(up);
        box.appendChild(score);
        box.appendChild(down);
        box.appendChild(caption);

        var related = main.querySelector('.related-articles');
        if (related && related.parentNode === main) {
            main.insertBefore(box, related);
        } else {
            main.appendChild(box);
        }

        var myVote = 0;

        function applyMy(v) {
            myVote = v || 0;
            up.classList.toggle('voted', myVote === 1);
            down.classList.toggle('voted', myVote === -1);
        }

        function refresh() {
            window.SB.articleScores(slug).then(function(rows) {
                var row = rows && rows[0];
                score.textContent = row ? String(row.score) : '0';
            }).catch(function() {});
            window.SB.articleVote(slug).then(function(v) {
                applyMy(v ? v.vote : 0);
            }).catch(function() {});
        }

        function cast(v) {
            if (!window.SB.user()) {
                window.SB.requireLogin(function() { cast(v); });
                return;
            }
            if (myVote === v) {
                window.SB.clearArticleVote(slug).then(refresh).catch(refresh);
            } else {
                window.SB.setArticleVote(slug, v).then(refresh).catch(refresh);
            }
        }

        up.addEventListener('click', function() { cast(1); });
        down.addEventListener('click', function() { cast(-1); });

        window.SB.ready(function() {
            if (window.SB.isConfigured()) refresh();
        });
    }

    /* ---- comment vote control ---- */
    function commentControl(commentId) {
        var wrap = document.createElement('span');
        wrap.className = 'comment-vote';

        var up = document.createElement('button');
        up.type = 'button';
        up.className = 'comment-vote-btn up';
        up.setAttribute('aria-label', 'За');
        up.textContent = '\u25B2';

        var score = document.createElement('span');
        score.className = 'comment-vote-score';
        score.textContent = '\u2013';

        var down = document.createElement('button');
        down.type = 'button';
        down.className = 'comment-vote-btn down';
        down.setAttribute('aria-label', 'Проти');
        down.textContent = '\u25BC';

        wrap.appendChild(up);
        wrap.appendChild(score);
        wrap.appendChild(down);

        var my = 0;

        function applyMy(v) {
            my = v || 0;
            up.classList.toggle('voted', my === 1);
            down.classList.toggle('voted', my === -1);
        }

        function refresh() {
            window.SB.commentScores([commentId]).then(function(rows) {
                var row = rows && rows[0];
                score.textContent = row ? String(row.score) : '0';
            }).catch(function() {});
            window.SB.commentVote(commentId).then(function(v) {
                if (v) applyMy(v.vote);
            }).catch(function() {});
        }

        function cast(v) {
            if (!window.SB.user()) {
                window.SB.requireLogin(function() { cast(v); });
                return;
            }
            if (my === v) {
                window.SB.clearCommentVote(commentId).then(refresh).catch(refresh);
            } else {
                window.SB.setCommentVote(commentId, v).then(refresh).catch(refresh);
            }
        }

        up.addEventListener('click', function() { cast(1); });
        down.addEventListener('click', function() { cast(-1); });

        window.SB.ready(function() {
            if (window.SB.isConfigured()) refresh();
        });

        return wrap;
    }

    window.Votes = {
        init: articleBlock,
        commentControl: commentControl
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', articleBlock);
    } else {
        articleBlock();
    }
})();
