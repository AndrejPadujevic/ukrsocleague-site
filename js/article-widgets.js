/**
 * Article page widgets: breadcrumbs, share buttons, related articles.
 * Re-runnable (SPA-safe): call window.ArticleWidgets.init() after content swaps.
 * Depends on js/archive-data.js (loaded lazily for related articles).
 */
(function() {
    'use strict';

    window.ArticleWidgets = {
        init: function() {
            var main = document.querySelector('main.article-page article');
            if (!main) return;

            var isArticleDir = /\/articles\//.test(window.location.pathname);
            var BASE = isArticleDir ? '../' : '';
            var pageUrl = window.location.href.split('#')[0].split('?')[0];
            var titleEl = document.querySelector('h1');
            var title = titleEl ? titleEl.textContent.trim() : document.title;

            // ---- Idempotency: remove previously injected widgets ----
            var oldCrumbs = document.querySelector('.breadcrumbs');
            if (oldCrumbs && oldCrumbs.parentNode) oldCrumbs.parentNode.removeChild(oldCrumbs);

            ['.share-buttons', '.related-articles'].forEach(function(sel) {
                var old = main.querySelector(sel);
                if (old && old.parentNode) old.parentNode.removeChild(old);
            });

            function sep(text) {
                var s = document.createElement('span');
                s.className = 'crumb-sep';
                s.textContent = text;
                return s;
            }

            // ---- Breadcrumbs ----
            var header = document.getElementById('site-header');
            if (header && header.parentNode && !document.querySelector('.breadcrumbs')) {
                var crumbs = document.createElement('nav');
                crumbs.className = 'breadcrumbs';
                crumbs.setAttribute('aria-label', 'Хлібні крихти');
                var home = document.createElement('a');
                home.href = BASE + 'index.html';
                home.textContent = 'Головна';
                crumbs.appendChild(home);
                crumbs.appendChild(sep('›'));
                var archive = document.createElement('a');
                archive.href = BASE + 'archive.htm';
                archive.textContent = 'Архів';
                crumbs.appendChild(archive);
                crumbs.appendChild(sep('›'));
                var current = document.createElement('span');
                current.className = 'crumb-current';
                current.textContent = title;
                crumbs.appendChild(current);
                header.parentNode.insertBefore(crumbs, header.nextSibling);
            }

            // ---- Share buttons ----
            var share = document.createElement('div');
            share.className = 'share-buttons';

            var label = document.createElement('span');
            label.className = 'share-label';
            label.textContent = 'Поширити:';
            share.appendChild(label);

            var links = [
                { cls: 'share-telegram', href: 'https://t.me/share/url?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(title), text: 'Telegram' },
                { cls: 'share-facebook', href: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl), text: 'Facebook' },
                { cls: 'share-twitter', href: 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(title), text: 'X' }
            ];
            links.forEach(function(l) {
                var a = document.createElement('a');
                a.className = 'share-btn ' + l.cls;
                a.href = l.href;
                a.target = '_blank';
                a.rel = 'noopener';
                a.textContent = l.text;
                share.appendChild(a);
            });

            var copy = document.createElement('button');
            copy.type = 'button';
            copy.className = 'share-btn share-copy';
            copy.id = 'share-copy';
            copy.title = 'Копіювати посилання';
            copy.textContent = 'Копіювати';
            share.appendChild(copy);
            main.appendChild(share);

            copy.addEventListener('click', function() {
                function done(ok) {
                    copy.textContent = ok ? 'Скопійовано!' : 'Помилка';
                    setTimeout(function() { copy.textContent = 'Копіювати'; }, 2000);
                }
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(pageUrl).then(function() { done(true); }, function() { done(false); });
                } else {
                    var ta = document.createElement('textarea');
                    ta.value = pageUrl;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    try { done(document.execCommand('copy')); } catch (e) { done(false); }
                    document.body.removeChild(ta);
                }
            });

            // ---- Related articles ----
            function loadArchive(cb) {
                if (window.USL_ARCHIVE) { cb(window.USL_ARCHIVE); return; }
                var s = document.createElement('script');
                s.src = BASE + 'js/archive-data.js';
                s.onload = function() { cb(window.USL_ARCHIVE || []); };
                s.onerror = function() { cb([]); };
                document.head.appendChild(s);
            }

            loadArchive(function(archive) {
                if (!archive.length) return;
                var currentPath = window.location.pathname.split('/').pop();
                var current = null;
                archive.forEach(function(a) {
                    if (!current && a.url.split('/').pop() === currentPath) current = a;
                });
                if (!current) return;

                var related = archive.filter(function(a) {
                    return a !== current && a.tag === current.tag;
                });
                if (related.length < 3) {
                    archive.forEach(function(a) {
                        if (a !== current && related.indexOf(a) === -1 && related.length < 3) related.push(a);
                    });
                }
                related = related.slice(0, 3);
                if (!related.length) return;

                var box = document.createElement('div');
                box.className = 'related-articles';

                var h = document.createElement('h3');
                h.className = 'related-title';
                h.textContent = 'ЧИТАЙТЕ ТАКОЖ';
                box.appendChild(h);

                var list = document.createElement('div');
                list.className = 'related-grid';
                related.forEach(function(a) {
                    var card = document.createElement('a');
                    card.href = BASE + a.url;
                    card.className = 'related-card';

                    var tag = document.createElement('span');
                    tag.className = 'related-tag';
                    tag.textContent = a.tag;

                    var t = document.createElement('h4');
                    t.textContent = a.title;

                    var d = document.createElement('span');
                    d.className = 'related-date';
                    d.textContent = a.date;

                    card.appendChild(tag);
                    card.appendChild(t);
                    card.appendChild(d);
                    list.appendChild(card);
                });
                box.appendChild(list);
                main.appendChild(box);
            });
        }
    };

    // Auto-init on normal (MPA) page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { window.ArticleWidgets.init(); });
    } else {
        window.ArticleWidgets.init();
    }
})();
