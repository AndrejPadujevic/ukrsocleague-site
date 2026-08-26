/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Supabase client layer + login modal.
 * Loads @supabase/supabase-js from CDN lazily (skipped if window.supabase
 * is already present, e.g. test stubs) and exposes window.SB.
 * If config is empty the app runs fully static — all features degrade.
 */
(function() {
    'use strict';

    function getCfg() {
        return window.USL_CONFIG || {};
    }
    var SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

    var state = { client: null, pending: [], failed: false };

    function fire() {
        var list = state.pending.slice();
        state.pending = [];
        list.forEach(function(cb) { try { cb(state.client); } catch (e) {} });
    }

    function buildClient() {
        var cfg = getCfg();
        if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return null;
        if (!window.supabase || !window.supabase.createClient) return null;
        try {
            return window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
        } catch (e) {
            return null;
        }
    }

    function init() {
        var c = buildClient();
        if (c) { state.client = c; fire(); return; }
        if (state.failed) { fire(); return; }
        var s = document.createElement('script');
        s.src = SCRIPT_SRC;
        s.async = true;
        s.onload = function() {
            var c2 = buildClient();
            if (c2) state.client = c2;
            fire();
        };
        s.onerror = function() {
            state.failed = true;
            fire();
        };
        document.head.appendChild(s);
    }

    /* ---- login modal ---- */
    function openLogin(cb) {
        var modal = document.getElementById('login-modal');
        if (!modal) modal = buildLoginModal();
        var email = modal.querySelector('#login-email');
        var status = modal.querySelector('.login-status');
        var submit = modal.querySelector('#login-submit');
        if (email) email.value = '';
        if (status) status.textContent = '';
        modal.classList.add('open');
        if (email) setTimeout(function() { email.focus(); }, 50);

        if (submit) {
            var doLogin = function() {
                var val = email ? email.value.trim() : '';
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) {
                    if (status) status.textContent = 'Введіть коректну email-адресу.';
                    return;
                }
                if (status) status.textContent = 'Надсилаємо…';
                window.SB.login(val).then(function() {
                    if (status) status.textContent = 'Перевірте пошту — посилання для входу надіслано.';
                    if (cb) setTimeout(cb, 50);
                }).catch(function() {
                    if (status) status.textContent = 'Помилка входу. Спробуйте пізніше.';
                });
            };
            submit.onclick = doLogin;
            var input = email;
            if (input) input.onkeydown = function(e) { if (e.key === 'Enter') doLogin(); };
        }
    }

    function closeLogin() {
        var modal = document.getElementById('login-modal');
        if (modal) modal.classList.remove('open');
    }

    function buildLoginModal() {
        var m = document.createElement('div');
        m.className = 'login-modal';
        m.id = 'login-modal';
        m.setAttribute('role', 'dialog');
        m.setAttribute('aria-modal', 'true');
        m.innerHTML =
            '<div class="login-modal-box">' +
            '  <button type="button" class="login-close" id="login-close" aria-label="Закрити">&times;</button>' +
            '  <h3>Увійти</h3>' +
            '  <p class="login-hint">Введіть email — надішлемо посилання для входу. Потрібно для коментування та голосування.</p>' +
            '  <input type="email" id="login-email" placeholder="email@example.com" autocomplete="email">' +
            '  <button type="button" id="login-submit" class="login-submit">Надіслати посилання</button>' +
            '  <p class="login-status" role="status"></p>' +
            '</div>';
        m.addEventListener('click', function(e) {
            if (e.target === m) closeLogin();
        });
        m.querySelector('#login-close').addEventListener('click', closeLogin);
        document.body.appendChild(m);
        return m;
    }

    /* ---- public API ---- */
    window.SB = {
        isConfigured: function() {
            var cfg = getCfg();
            return !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
        },
        ready: function(cb) {
            if (state.client) { cb(state.client); return; }
            state.pending.push(cb);
        },
        client: function() { return state.client; },

        user: function() {
            var c = state.client;
            if (!c) return null;
            try {
                var session = c.auth.getSession();
                if (session && typeof session.then === 'function') {
                    session.then(function(result) {
                        window.SB._currentUser = result && result.data && result.data.session && result.data.session.user || null;
                    });
                    return window.SB._currentUser || null;
                }
                if (session && session.data && session.data.session && session.data.session.user) return session.data.session.user;
            } catch (e) {}
            return null;
        },

        login: function(email) {
            return new Promise(function(resolve, reject) {
                window.SB.ready(function(c) {
                    if (!c) { reject(new Error('not configured')); return; }
                    var dest = window.location.href.split('#')[0];
                    c.auth.signInWithOtp({
                        email: email,
                        options: { emailRedirectTo: dest }
                    }).then(function(r) {
                        if (r.error) reject(r.error); else resolve(r);
                    });
                });
            });
        },

        logout: function() {
            return new Promise(function(resolve) {
                window.SB.ready(function(c) { if (c) c.auth.signOut(); resolve(); });
            });
        },

        requireLogin: function(cb) {
            var u = window.SB.user();
            if (u) { cb(u); return; }
            openLogin(function() {
                // Wait briefly for the session callback; caller refreshes itself.
                window.SB.onAuth(function() {
                    var u2 = window.SB.user();
                    if (u2) cb(u2);
                });
            });
        },

        _authCallbacks: [],
        onAuth: function(cb) {
            var c = state.client;
            if (c) {
                var sub = c.auth.onAuthStateChange(function() {
                    try { cb(); } catch (e) {}
                });
                window.SB._authCallbacks.push(sub);
            } else {
                window.SB._authCallbacks.push(cb);
            }
        },

        /* ---- data access (wrapped for testability) ---- */
        articleScores: function(slug) {
            return window.SB._q('article_scores', 'article_slug', slug);
        },
        allScores: function() {
            return new Promise(function(resolve, reject) {
                window.SB.ready(function(c) {
                    if (!c) { resolve([]); return; }
                    c.from('article_scores').select('*').then(function(r) {
                        if (r.error) reject(r.error); else resolve(r.data || []);
                    });
                });
            });
        },
        articleVote: function(slug) {
            return window.SB._row('article_votes', 'article_slug', slug);
        },
        setArticleVote: function(slug, vote) {
            return window.SB._upsert('article_votes', { article_slug: slug, vote: vote });
        },
        clearArticleVote: function(slug) {
            return window.SB._delete('article_votes', 'article_slug', slug);
        },
        commentScores: function(ids) {
            return window.SB._qIn('comment_scores', 'comment_id', ids);
        },
        listComments: function(slug) {
            return window.SB._list('comments', 'article_slug', slug);
        },
        addComment: function(slug, body, parentId, authorName) {
            var row = { article_slug: slug, body: body, author_name: authorName || null };
            if (parentId) row.parent_id = parentId;
            return window.SB._insert('comments', row);
        },
        deleteComment: function(id) {
            return window.SB._delete('comments', 'id', id);
        },
        commentVote: function(commentId) {
            return window.SB._row('comment_votes', 'comment_id', commentId);
        },
        setCommentVote: function(commentId, vote) {
            return window.SB._upsert('comment_votes', { comment_id: commentId, vote: vote });
        },
        clearCommentVote: function(commentId) {
            return window.SB._delete('comment_votes', 'comment_id', commentId);
        },
        subscribe: function(email) {
            return window.SB._insert('subscribers', { email: email });
        },
        sendFeedback: function(data) {
            return window.SB._insert('feedback', data);
        },

        /* ---- low-level helpers (supabase-js query builder) ---- */
        _q: function(table, col, val) {
            return new Promise(function(resolve, reject) {
                window.SB.ready(function(c) {
                    if (!c) { resolve([]); return; }
                    c.from(table).select('*').eq(col, val).then(function(r) {
                        if (r.error) reject(r.error); else resolve(r.data || []);
                    });
                });
            });
        },
        _qIn: function(table, col, vals) {
            return new Promise(function(resolve, reject) {
                if (!vals || !vals.length) { resolve([]); return; }
                window.SB.ready(function(c) {
                    if (!c) { resolve([]); return; }
                    c.from(table).select('*').in(col, vals).then(function(r) {
                        if (r.error) reject(r.error); else resolve(r.data || []);
                    });
                });
            });
        },
        _list: function(table, col, val) {
            return new Promise(function(resolve, reject) {
                window.SB.ready(function(c) {
                    if (!c) { resolve([]); return; }
                    c.from(table).select('*').eq(col, val).order('created_at', { ascending: true }).then(function(r) {
                        if (r.error) reject(r.error); else resolve(r.data || []);
                    });
                });
            });
        },
        _row: function(table, col, val) {
            return new Promise(function(resolve, reject) {
                window.SB.ready(function(c) {
                    if (!c) { resolve(null); return; }
                    c.from(table).select('*').eq(col, val).maybeSingle().then(function(r) {
                        if (r.error) reject(r.error); else resolve(r.data || null);
                    });
                });
            });
        },
        _upsert: function(table, row) {
            return new Promise(function(resolve, reject) {
                window.SB.ready(function(c) {
                    if (!c) { reject(new Error('not configured')); return; }
                    c.from(table).upsert(row, { onConflict: undefined }).then(function(r) {
                        if (r.error) reject(r.error); else resolve(r.data || []);
                    });
                });
            });
        },
        _insert: function(table, row) {
            return new Promise(function(resolve, reject) {
                window.SB.ready(function(c) {
                    if (!c) { reject(new Error('not configured')); return; }
                    c.from(table).insert(row).then(function(r) {
                        if (r.error) reject(r.error); else resolve(r.data || []);
                    });
                });
            });
        },
        _delete: function(table, col, val) {
            return new Promise(function(resolve, reject) {
                window.SB.ready(function(c) {
                    if (!c) { resolve(null); return; }
                    c.from(table).delete().eq(col, val).then(function(r) {
                        if (r.error) reject(r.error); else resolve(r.data || []);
                    });
                });
            });
        }
    };

    init();
})();
