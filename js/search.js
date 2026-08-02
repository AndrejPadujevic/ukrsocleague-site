/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Site search: full-text overlay over all articles.
 * Builds an offline index once (IndexedDB) by fetching each article page.
 * Also hosts the bookmarks panel.
 */
(function() {
    'use strict';

    var DB_NAME = 'usl-search';
    var DB_STORE = 'pages';
    var DB_VERSION = 'usl-v1';
    var overlay = null;
    var memory = null;
    var building = null;

    function currentBase() {
        return /\/articles\//.test(window.location.pathname) ? '../' : '';
    }

    function ensureData(cb) {
        if (window.USL_ARCHIVE) { cb(window.USL_ARCHIVE); return; }
        var s = document.createElement('script');
        s.src = currentBase() + 'js/archive-data.js';
        s.onload = function() { cb(window.USL_ARCHIVE || []); };
        s.onerror = function() { cb([]); };
        document.head.appendChild(s);
    }

    /* ---- IndexedDB helpers ---- */
    function idbOpen() {
        return new Promise(function(resolve, reject) {
            if (!window.indexedDB) { reject(new Error('no idb')); return; }
            var req = window.indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = function() {
                var db = req.result;
                if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'url' });
            };
            req.onsuccess = function() { resolve(req.result); };
            req.onerror = function() { reject(req.error); };
        });
    }

    function idbAll(db) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(DB_STORE, 'readonly');
            var req = tx.objectStore(DB_STORE).getAll();
            req.onsuccess = function() { resolve(req.result || []); };
            req.onerror = function() { reject(req.error); };
        });
    }

    function idbPutAll(db, items) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(DB_STORE, 'readwrite');
            var store = tx.objectStore(DB_STORE);
            store.clear();
            items.forEach(function(i) { store.put(i); });
            tx.oncomplete = function() { resolve(); };
            tx.onerror = function() { reject(tx.error); };
        });
    }

    function extractText(html) {
        try {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var article = doc.querySelector('main.article-page article') || doc.querySelector('main, #main-content');
            var text = (article ? article.textContent : doc.body.textContent) || '';
            return text.replace(/\s+/g, ' ').trim();
        } catch (e) { return ''; }
    }

    function buildIndex() {
        if (building) return building;
        building = new Promise(function(resolve) {
            ensureData(function(archive) {
                if (!archive.length) { resolve([]); return; }
                var items = [];
                var done = 0;
                archive.forEach(function(a) {
                    var url = currentBase() + a.url;
                    fetch(url, { credentials: 'same-origin' }).then(function(r) {
                        return r.ok ? r.text() : '';
                    }).catch(function() { return ''; }).then(function(html) {
                        var txt = extractText(html);
                        if (!txt) {
                            txt = [a.title, a.description, a.tag, a.date].filter(Boolean).join(' ');
                        }
                        items.push({
                            url: a.url,
                            title: a.title || '',
                            tag: a.tag || '',
                            date: a.date || '',
                            minutes: a.minutes || 0,
                            description: a.description || '',
                            text: txt
                        });
                        done++;
                        if (done === archive.length) {
                            persist(items).then(function() { resolve(items); }, function() { resolve(items); });
                        }
                    });
                });
            });
        });
        return building;
    }

    function persist(items) {
        return idbOpen().then(function(db) {
            return idbPutAll(db, items).then(function() {
                db.close();
                var meta = document.createElement('div');
                meta.id = 'usl-search-version';
                meta.style.display = 'none';
                document.head.appendChild(meta);
            });
        }).catch(function() {});
    }

    function loadIndex() {
        if (memory) return Promise.resolve(memory);
        return idbOpen().then(function(db) {
            return idbAll(db).then(function(items) {
                db.close();
                memory = items;
                return items;
            });
        }).catch(function() {
            return buildIndex();
        });
    }

    function score(doc, tokens) {
        var s = 0;
        var tl = doc.title.toLowerCase();
        var tagl = doc.tag.toLowerCase();
        var dl = (doc.description || '').toLowerCase();
        var body = doc.text.toLowerCase();
        tokens.forEach(function(t) {
            if (tl.indexOf(t) !== -1) s += 5;
            if (tagl.indexOf(t) !== -1) s += 3;
            if (dl.indexOf(t) !== -1) s += 2;
            var idx = 0;
            var count = 0;
            while (count < 5 && (idx = body.indexOf(t, idx)) !== -1) { count++; idx += t.length; }
            s += count;
        });
        return s;
    }

    function snippet(doc, tokens) {
        var body = doc.text || '';
        var low = body.toLowerCase();
        for (var i = 0; i < tokens.length; i++) {
            var idx = low.indexOf(tokens[i]);
            if (idx === -1) continue;
            var start = Math.max(0, idx - 60);
            var end = Math.min(body.length, idx + 120);
            return (start > 0 ? '…' : '') + body.slice(start, end).trim() + (end < body.length ? '…' : '');
        }
        return (doc.description || '').slice(0, 160);
    }

    function runSearch(q, docs) {
        var tokens = q.toLowerCase().split(/\s+/).filter(function(t) { return t.length > 1; });
        if (!tokens.length) return [];
        var scored = docs.map(function(d) { return { d: d, s: score(d, tokens) }; })
            .filter(function(x) { return x.s > 0; })
            .sort(function(a, b) { return b.s - a.s; })
            .slice(0, 12);
        return scored.map(function(x) { return x.d; });
    }

    /* ---- overlay ---- */
    function ensureOverlay() {
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.className = 'search-overlay';
        overlay.id = 'search-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML =
            '<div class="search-box">' +
            '  <div class="search-head">' +
            '    <button type="button" class="search-tab active" data-tab="search">Пошук</button>' +
            '    <button type="button" class="search-tab" data-tab="bookmarks">Закладки</button>' +
            '    <button type="button" class="search-close" id="search-close" aria-label="Закрити">&times;</button>' +
            '  </div>' +
            '  <input type="search" id="search-input" class="search-input" placeholder="Пошук по статтях…" autocomplete="off" aria-label="Пошук">' +
            '  <div id="search-results" class="search-results" role="listbox"></div>' +
            '  <div id="bookmarks-panel" class="bookmarks-panel" hidden></div>' +
            '</div>';
        document.body.appendChild(overlay);

        overlay.querySelector('#search-close').addEventListener('click', close);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

        overlay.querySelectorAll('.search-tab').forEach(function(t) {
            t.addEventListener('click', function() {
                overlay.querySelectorAll('.search-tab').forEach(function(x) { x.classList.remove('active'); });
                t.classList.add('active');
                switchTab(t.dataset.tab);
            });
        });

        var input = overlay.querySelector('#search-input');
        var debounce = null;
        input.addEventListener('input', function() {
            clearTimeout(debounce);
            debounce = setTimeout(function() { doSearch(input.value.trim()); }, 180);
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') close();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') close();
        });

        window.addEventListener('usl-bookmarks', function() {
            if (overlay.getAttribute('aria-hidden') === 'false' &&
                overlay.querySelector('.search-tab.active').dataset.tab === 'bookmarks') {
                renderBookmarks();
            }
        });

        return overlay;
    }

    function switchTab(tab) {
        var results = overlay.querySelector('#search-results');
        var bookmarks = overlay.querySelector('#bookmarks-panel');
        if (tab === 'bookmarks') {
            results.hidden = true;
            bookmarks.hidden = false;
            renderBookmarks();
        } else {
            results.hidden = false;
            bookmarks.hidden = true;
            doSearch(overlay.querySelector('#search-input').value.trim());
        }
    }

    function renderBookmarks() {
        window.Bookmarks.renderInto(overlay.querySelector('#bookmarks-panel'));
    }

    function open(tab) {
        var ov = ensureOverlay();
        ov.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (tab === 'bookmarks') {
            ov.querySelectorAll('.search-tab').forEach(function(t) {
                t.classList.toggle('active', t.dataset.tab === 'bookmarks');
            });
            switchTab('bookmarks');
        } else {
            ov.querySelectorAll('.search-tab').forEach(function(t) {
                t.classList.toggle('active', t.dataset.tab === 'search');
            });
            var input = ov.querySelector('#search-input');
            input.value = '';
            setTimeout(function() { input.focus(); }, 30);
            switchTab('search');
        }
    }

    function close() {
        if (!overlay) return;
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function doSearch(q) {
        var box = overlay.querySelector('#search-results');
        if (!q) { box.innerHTML = ''; return; }
        box.innerHTML = '<p class="search-status">Шукаємо…</p>';
        loadIndex().then(function(docs) {
            var found = runSearch(q, docs);
            renderResults(found, q, box);
        }).catch(function() {
            box.innerHTML = '<p class="search-status">Пошук недоступний.</p>';
        });
    }

    function renderResults(items, q, box) {
        box.innerHTML = '';
        if (!items.length) {
            box.innerHTML = '<p class="search-status">Нічого не знайдено за запитом «' + esc(q) + '».</p>';
            return;
        }
        var list = document.createElement('div');
        list.className = 'search-results-list';
        items.forEach(function(d) {
            var a = document.createElement('a');
            a.href = currentBase() + d.url;
            a.className = 'search-result';
            var title = document.createElement('span');
            title.className = 'search-result-title';
            title.textContent = d.title;
            a.appendChild(title);
            if (d.tag || d.date || d.minutes) {
                var meta = document.createElement('span');
                meta.className = 'search-result-meta';
                meta.textContent = [d.tag, d.date, d.minutes ? '\u2248' + d.minutes + ' хв' : ''].filter(Boolean).join(' · ');
                a.appendChild(meta);
            }
            var snip = document.createElement('span');
            snip.className = 'search-result-snippet';
            snip.textContent = snippet(d, q.toLowerCase().split(/\s+/).filter(function(t) { return t.length > 1; }));
            a.appendChild(snip);
            list.appendChild(a);
        });
        box.appendChild(list);
    }

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    window.SiteSearch = {
        open: function() { open('search'); },
        openBookmarks: function() { open('bookmarks'); },
        close: close,
        warm: function() { loadIndex(); }
    };
})();
