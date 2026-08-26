/**
 * Article page widgets: breadcrumbs, share buttons, related articles.
 * Re-runnable (SPA-safe): call window.ArticleWidgets.init() after content swaps.
 * Depends on js/archive-data.js (loaded lazily for related articles).
 */
(function() {
    'use strict';

    window.ArticleWidgets = {
        init: function() {
            var main = document.querySelector('main.article-page article, main.article-page .article-content-simple');
            if (!main) return;

            var isArticleDir = /\/articles\//.test(window.location.pathname);
            var BASE = isArticleDir ? '../' : '';
            var pageUrl = window.location.href.split('#')[0].split('?')[0];
            var titleEl = document.querySelector('main.article-page h1, .page-title-container h1, h1');
            var title = titleEl ? titleEl.textContent.trim() : document.title;

            function fediverseUrl() {
                var cfg = window.USL_CONFIG || {};
                var inst = cfg.FEDIVERSE_INSTANCE || 'https://social.noleron.com';
                return inst.replace(/\/$/, '') + '/share?text=' + encodeURIComponent(title + '\n\n' + pageUrl);
            }

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
                { cls: 'share-telegram', href: 'https://t.me/share/url?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(title), text: '<svg class="share-icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.47l-1.97 9.28c-.15.67-.54.83-1.09.52l-3.02-2.22-1.46 1.4c-.16.16-.3.3-.61.3l.22-3.05 5.55-5.01c.24-.22-.05-.33-.37-.14L8.68 13.3l-2.97-.93c-.65-.2-.66-.65.14-.96l11.6-4.47c.54-.2 1.01.13.83.96l-.33.57z"/></svg>' },
                { cls: 'share-facebook', href: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl), text: '<svg class="share-icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>' },
                { cls: 'share-twitter', href: 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(title), text: '<svg class="share-icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
                { cls: 'share-fediverse', href: fediverseUrl(), text: '<svg class="share-icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.327 8.566c0-4.339-2.843-5.61-2.843-5.61-1.433-.658-3.894-.935-6.451-.956h-.063c-2.557.021-5.016.298-6.45.956 0 0-2.843 1.272-2.843 5.61 0 .993-.019 2.181.012 3.441.103 4.243.778 8.425 4.701 9.463 1.809.479 3.362.579 4.612.51 2.268-.126 3.541-.809 3.541-.809l-.075-1.646s-1.621.511-3.441.449c-1.804-.062-3.707-.194-3.999-2.409a4.523 4.523 0 01-.04-.621s1.77.432 4.014.535c1.372.063 2.658-.08 3.965-.236 2.506-.299 4.688-1.843 4.962-3.254.434-2.223.398-5.424.398-5.424zm-3.353 5.59h-2.081V9.057c0-1.075-.452-1.62-1.357-1.62-1 0-1.501.647-1.501 1.927v2.791h-2.069V9.364c0-1.28-.501-1.927-1.502-1.927-.904 0-1.357.546-1.357 1.62v5.099H6.026V8.903c0-1.074.273-1.927.823-2.558.566-.631 1.307-.955 2.228-.955 1.065 0 1.872.41 2.405 1.228l.518.869.519-.869c.533-.818 1.34-1.228 2.405-1.228.92 0 1.662.324 2.228.955.549.631.822 1.484.822 2.558v5.253z"/></svg>' }
            ];
            links.forEach(function(l) {
                var a = document.createElement('a');
                a.className = 'share-btn ' + l.cls;
                a.href = l.href;
                a.target = '_blank';
                a.rel = 'noopener';
                a.innerHTML = l.text;
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

            // Bookmark toggle in the share row
            if (window.Bookmarks) {
                main.appendChild(window.Bookmarks.button(window.Bookmarks.currentArticleItem()));
            }

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
