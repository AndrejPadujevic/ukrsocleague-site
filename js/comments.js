/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Comments: threaded (1 level), login required to post.
 * Re-runnable (SPA-safe): call window.Comments.init() after content swaps.
 */
(function() {
    'use strict';

    function currentSlug() {
        var m = window.location.pathname.match(/\/([^/]+)\.html?$/i);
        return m ? m[1] : '';
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function fmtDate(iso) {
        try {
            var d = new Date(iso);
            return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) { return ''; }
    }

    function buildForm(section, slug, list, load) {
        var form = document.createElement('div');
        form.className = 'comment-form';
        form.id = 'comment-form';

        var user = window.SB.user();
        if (!user) {
            var loginBtn = document.createElement('button');
            loginBtn.type = 'button';
            loginBtn.className = 'comment-login-btn';
            loginBtn.textContent = 'Увійти, щоб коментувати';
            loginBtn.addEventListener('click', function() {
                window.SB.requireLogin(function() {
                    var old = document.getElementById('comment-form');
                    if (old && old.parentNode) old.parentNode.removeChild(old);
                    buildForm(section, slug, list, load);
                    load();
                });
            });
            form.appendChild(loginBtn);
        } else {
            var name = document.createElement('input');
            name.type = 'text';
            name.className = 'comment-name-input';
            name.placeholder = 'Ваше ім\u2019я (необов\u2019язково)';
            name.maxLength = 60;
            name.value = localStorage.getItem('usl-comment-name') || '';

            var ta = document.createElement('textarea');
            ta.className = 'comment-textarea';
            ta.placeholder = 'Напишіть коментар…';
            ta.maxLength = 2000;
            ta.rows = 3;

            var row = document.createElement('div');
            row.className = 'comment-form-row';
            var submit = document.createElement('button');
            submit.type = 'button';
            submit.className = 'comment-submit';
            submit.textContent = 'Коментувати';
            row.appendChild(submit);

            form.appendChild(name);
            form.appendChild(ta);
            form.appendChild(row);

            function submitComment() {
                var body = ta.value.trim();
                if (!body) { ta.focus(); return; }
                var author = name.value.trim();
                if (author) localStorage.setItem('usl-comment-name', author);
                submit.disabled = true;
                submit.textContent = 'Надсилаємо…';
                window.SB.addComment(slug, body, null, author || null).then(function() {
                    ta.value = '';
                    submit.disabled = false;
                    submit.textContent = 'Коментувати';
                    load();
                }).catch(function() {
                    submit.disabled = false;
                    submit.textContent = 'Помилка — спробуйте ще';
                });
            }
            submit.addEventListener('click', submitComment);
            ta.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment();
            });
        }
        section.appendChild(form);
    }

    function commentItem(c, list, slug, load) {
        var art = document.createElement('article');
        art.className = 'comment-item';
        if (c.parent_id) art.classList.add('comment-reply');
        art.dataset.commentId = String(c.id);

        var meta = document.createElement('div');
        meta.className = 'comment-meta';
        var author = document.createElement('span');
        author.className = 'comment-author';
        author.textContent = c.author_name || '\u0410\u043d\u043e\u043d\u0456\u043c';
        var date = document.createElement('span');
        date.className = 'comment-date';
        date.textContent = fmtDate(c.created_at);
        meta.appendChild(author);
        meta.appendChild(date);

        var body = document.createElement('div');
        body.className = 'comment-body';
        body.textContent = c.body;

        var actions = document.createElement('div');
        actions.className = 'comment-actions';
        actions.appendChild(window.Votes.commentControl(c.id));

        var user = window.SB.user();
        var isOwn = user && user.id === c.user_id;

        if (!c.parent_id) {
            var reply = document.createElement('button');
            reply.type = 'button';
            reply.className = 'comment-reply-btn';
            reply.textContent = 'Відповісти';
            reply.addEventListener('click', function() {
                var existing = art.querySelector('.comment-reply-form');
                if (existing) { existing.parentNode.removeChild(existing); return; }
                var rf = document.createElement('div');
                rf.className = 'comment-reply-form';
                var ta = document.createElement('textarea');
                ta.className = 'comment-textarea';
                ta.maxLength = 2000;
                ta.rows = 2;
                ta.placeholder = 'Відповідь…';
                var send = document.createElement('button');
                send.type = 'button';
                send.className = 'comment-submit';
                send.textContent = 'Відповісти';
                send.addEventListener('click', function() {
                    var txt = ta.value.trim();
                    if (!txt) return;
                    if (!window.SB.user()) { window.SB.requireLogin(function() { sendReply(); }); return; }
                    send.disabled = true;
                    window.SB.addComment(slug, txt, c.id, localStorage.getItem('usl-comment-name') || null).then(function() {
                        load();
                    }).catch(function() { send.disabled = false; });
                });
                rf.appendChild(ta);
                rf.appendChild(send);
                actions.appendChild(rf);
            });
            actions.appendChild(reply);
        }

        if (isOwn) {
            var del = document.createElement('button');
            del.type = 'button';
            del.className = 'comment-del-btn';
            del.textContent = 'Видалити';
            del.addEventListener('click', function() {
                window.SB.deleteComment(c.id).then(load).catch(function() {});
            });
            actions.appendChild(del);
        }

        art.appendChild(meta);
        art.appendChild(body);
        art.appendChild(actions);
        list.appendChild(art);
    }

    function render(rows, list, slug, reloadFn) {
        list.innerHTML = '';
        if (!rows || !rows.length) {
            var empty = document.createElement('p');
            empty.className = 'comments-empty';
            empty.textContent = 'Поки що немає коментарів. Будьте першим!';
            list.appendChild(empty);
            return;
        }
        var children = {};
        rows.forEach(function(c) {
            if (c.parent_id) {
                (children[c.parent_id] = children[c.parent_id] || []).push(c);
            }
        });
        var count = document.getElementById('comments-count');
        if (count) count.textContent = ' (' + rows.length + ')';
        rows.forEach(function(c) {
            if (c.parent_id) return;
            commentItem(c, list, slug, reloadFn);
            (children[c.id] || []).forEach(function(ch) {
                commentItem(ch, list, slug, reloadFn);
            });
        });
    }

    function load(slug, list) {
        window.SB.ready(function() {
            if (!window.SB.isConfigured()) {
                list.innerHTML = '<p class="comments-empty">Коментарі недоступні.</p>';
                return;
            }
            window.SB.listComments(slug).then(function(rows) {
                render(rows, list, slug, function() { load(slug, list); });
            }).catch(function() {
                list.innerHTML = '<p class="comments-empty">Не вдалося завантажити коментарі.</p>';
            });
        });
    }

    window.Comments = {
        init: function() {
            var slug = currentSlug();
            var main = document.querySelector('main.article-page article, main.article-page .article-content-simple');
            if (!slug || !main) return;

            var old = document.getElementById('comments-section');
            if (old && old.parentNode) old.parentNode.removeChild(old);

            var section = document.createElement('section');
            section.className = 'comments-section';
            section.id = 'comments-section';

            var title = document.createElement('h3');
            title.className = 'comments-title';
            title.textContent = 'КОМЕНТАРІ';
            var count = document.createElement('span');
            count.className = 'comments-count';
            count.id = 'comments-count';
            title.appendChild(count);
            section.appendChild(title);

            var list = document.createElement('div');
            list.className = 'comments-list';
            list.id = 'comments-list';
            section.appendChild(list);
            main.appendChild(section);

            function doLoad() { load(slug, list); }
            buildForm(section, slug, list, doLoad);
            doLoad();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.Comments.init);
    } else {
        window.Comments.init();
    }
})();
