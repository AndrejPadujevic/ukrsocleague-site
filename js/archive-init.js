/**
 * Динамічний архів статей.
 * Re-runnable (SPA-safe): call window.ArchiveInit.run() after content swaps.
 * Depends on js/archive-data.js (window.USL_ARCHIVE, loaded lazily if needed).
 */
(function() {
    'use strict';

    function ensureData(cb) {
        if (window.USL_ARCHIVE) { cb(window.USL_ARCHIVE); return; }
        var s = document.createElement('script');
        s.src = 'js/archive-data.js';
        s.onload = function() { cb(window.USL_ARCHIVE || []); };
        s.onerror = function() { cb([]); };
        document.head.appendChild(s);
    }

    window.ArchiveInit = {
        run: function() {
            var grid = document.getElementById('archive-grid');
            if (!grid) return;

            var filters = document.getElementById('archive-filters');
            var searchInput = document.getElementById('archive-search');
            var emptyMsg = document.getElementById('archive-empty');
            var activeTag = 'Всі';

            // Idempotency: clear previously built controls
            if (filters) filters.innerHTML = '';

            function matches(article) {
                if (activeTag !== 'Всі' && article.tag !== activeTag) return false;
                var q = searchInput.value.trim().toLowerCase();
                if (!q) return true;
                var haystack = (article.title + ' ' + (article.description || '') + ' ' + (article.tag || '') + ' ' + (article.date || '')).toLowerCase();
                return haystack.indexOf(q) !== -1;
            }

            function render() {
                grid.innerHTML = '';
                var articles = window.USL_ARCHIVE || [];
                var visible = articles.filter(matches);
                visible.forEach(function(a) {
                    var card = document.createElement('article');
                    card.className = 'news-card';

                    var link = document.createElement('a');
                    link.href = a.url;
                    link.className = 'news-link';

                    var imageDiv = document.createElement('div');
                    imageDiv.className = 'news-image';
                    var pic = document.createElement('picture');
                    var src = document.createElement('source');
                    src.type = 'image/webp';
                    src.srcset = a.image.replace(/\.(png|jpe?g)$/i, '.webp');
                    pic.appendChild(src);
                    var img = document.createElement('img');
                    img.src = a.image;
                    img.alt = a.title;
                    img.loading = 'lazy';
                    pic.appendChild(img);
                    imageDiv.appendChild(pic);

                    var overlay = document.createElement('div');
                    overlay.className = 'news-overlay';
                    var badge = document.createElement('span');
                    badge.className = 'news-badge';
                    badge.textContent = a.tag || 'Стаття';
                    overlay.appendChild(badge);
                    imageDiv.appendChild(overlay);

                    var content = document.createElement('div');
                    content.className = 'news-content';
                    var h3 = document.createElement('h3');
                    h3.textContent = a.title;
                    var p = document.createElement('p');
                    p.textContent = a.description || '';
                    var date = document.createElement('span');
                    date.className = 'news-date';
                    date.textContent = a.date || '';
                    content.appendChild(h3);
                    content.appendChild(p);
                    content.appendChild(date);

                    link.appendChild(imageDiv);
                    link.appendChild(content);
                    card.appendChild(link);
                    grid.appendChild(card);
                });

                if (emptyMsg) emptyMsg.style.display = visible.length ? 'none' : 'block';
            }

            ensureData(function() {
                if (!filters) { render(); return; }

                var tags = [];
                (window.USL_ARCHIVE || []).forEach(function(a) {
                    if (a.tag && tags.indexOf(a.tag) === -1) tags.push(a.tag);
                });

                var filterLabels = ['Всі'].concat(tags);
                filterLabels.forEach(function(tag) {
                    var btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'archive-filter-btn' + (tag === activeTag ? ' active' : '');
                    btn.textContent = tag;
                    btn.dataset.tag = tag;
                    btn.addEventListener('click', function() {
                        activeTag = tag;
                        document.querySelectorAll('.archive-filter-btn').forEach(function(b) {
                            b.classList.toggle('active', b === btn);
                        });
                        render();
                    });
                    filters.appendChild(btn);
                });

                if (searchInput) searchInput.addEventListener('input', render);
                render();
            });
        }
    };

    // Auto-init on normal (MPA) page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { window.ArchiveInit.run(); });
    } else {
        window.ArchiveInit.run();
    }
})();
