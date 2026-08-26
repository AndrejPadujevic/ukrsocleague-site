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
    var DB_META_STORE = 'meta';
    var DB_VERSION = 2;
    var overlay = null;
    var memory = null;
    var building = null;

    var STOP_WORDS = new Set([
        'і', 'в', 'на', 'що', 'який', 'це', 'та', 'не', 'але', 'як',
        'за', 'він', 'вона', 'воно', 'вони', 'ми', 'ви', 'я', 'то',
        'бути', 'мати', 'цей', 'той', 'свій', 'їхній', 'наш', 'ваш',
        'один', 'більше', 'менше', 'може', 'треба', 'тут', 'там',
        'де', 'коли', 'чому', 'бо', 'або', 'ні', 'так', 'ось',
        'лише', 'навіть', 'вже', 'ще', 'тільки', 'також', 'дуже',
        'якраз', 'саме', 'отже', 'проте', 'однак', 'зате', 'тобто',
        'тоді', 'зараз', 'потім', 'перед', 'після', 'між', 'через',
        'без', 'для', 'до', 'від', 'під', 'над', 'при', 'й',
        'його', 'її', 'їх', 'йому', 'їй', 'ним', 'нею', 'ними',
        'нього', 'ній', 'них', 'цього', 'цій', 'ці', 'ціх',
        'які', 'яких', 'якого', 'якій', 'яку', 'тим', 'того',
        'тій', 'ту', 'ті', 'тіх', 'себе', 'собі', 'собою',
        'такий', 'така', 'таке', 'такі', 'якось', 'десь', 'кудись',
        'звідки', 'звідкіля', 'скільки', 'чий', 'чия', 'чие', 'чьї'
    ]);

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

    function fingerprint(archive) {
        if (!archive.length) return '';
        return archive.length + ':' + archive[0].url + ':' + archive[archive.length - 1].url;
    }

    /* ---- IndexedDB helpers ---- */
    function idbOpen() {
        return new Promise(function(resolve, reject) {
            if (!window.indexedDB) { reject(new Error('no idb')); return; }
            var req = window.indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function() {
                var db = req.result;
                if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'url' });
                if (!db.objectStoreNames.contains(DB_META_STORE)) db.createObjectStore(DB_META_STORE, { keyPath: 'key' });
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

    function idbGetMeta(db, key) {
        return new Promise(function(resolve) {
            var tx = db.transaction(DB_META_STORE, 'readonly');
            var req = tx.objectStore(DB_META_STORE).get(key);
            req.onsuccess = function() { resolve(req.result ? req.result.value : null); };
            req.onerror = function() { resolve(null); };
        });
    }

    function idbPutMeta(db, key, value) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(DB_META_STORE, 'readwrite');
            tx.objectStore(DB_META_STORE).put({ key: key, value: value });
            tx.oncomplete = function() { resolve(); };
            tx.onerror = function() { reject(tx.error); };
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

    function stripNoise(doc) {
        var cloned = doc.cloneNode(true);
        var remove = cloned.querySelectorAll('script, style, nav, footer, header, .page-header, .article-header-simple, .article-widgets, .article-footer, #site-header, #site-footer, .skip-link');
        remove.forEach(function(el) { el.remove(); });
        return cloned;
    }

    function extractText(html) {
        try {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var cleaned = stripNoise(doc);
            var article = cleaned.querySelector('article') ||
                          cleaned.querySelector('main .article-content') ||
                          cleaned.querySelector('main');
            var text = (article ? article.textContent : '') || '';
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
                archive.forEach(function(a, idx) {
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
                            text: txt,
                            idx: idx
                        });
                        done++;
                        if (done === archive.length) {
                            persist(items, archive).then(function() { resolve(items); }, function() { resolve(items); });
                        }
                    });
                });
            });
        });
        return building;
    }

    function persist(items, archive) {
        return idbOpen().then(function(db) {
            return idbPutAll(db, items).then(function() {
                return idbPutMeta(db, 'fingerprint', fingerprint(archive));
            }).then(function() {
                db.close();
            });
        }).catch(function() {});
    }

    function loadIndex() {
        if (memory) return Promise.resolve(memory);
        return idbOpen().then(function(db) {
            return idbGetMeta(db, 'fingerprint').then(function(storedFp) {
                return idbAll(db).then(function(items) {
                    db.close();
                    return { items: items, fp: storedFp };
                });
            });
        }).then(function(result) {
            return new Promise(function(resolve) {
                ensureData(function(archive) {
                    var currentFp = fingerprint(archive);
                    if (result.fp === currentFp && result.items.length) {
                        memory = result.items;
                        resolve(memory);
                    } else {
                        buildIndex().then(function(items) { resolve(items); });
                    }
                });
            });
        }).catch(function() {
            return buildIndex();
        });
    }

    function isWordBoundary(text, idx, len) {
        if (idx > 0 && /\w/.test(text[idx - 1])) return false;
        var end = idx + len;
        if (end < text.length && /\w/.test(text[end])) return false;
        return true;
    }

    function score(doc, tokens) {
        var s = 0;
        var tl = doc.title.toLowerCase();
        var tagl = doc.tag.toLowerCase();
        var dl = (doc.description || '').toLowerCase();
        var body = doc.text.toLowerCase();
        tokens.forEach(function(t) {
            if (tl.indexOf(t) !== -1) {
                s += 10;
                var tIdx = tl.indexOf(t);
                if (isWordBoundary(tl, tIdx, t.length)) s += 5;
            }
            if (tagl.indexOf(t) !== -1) s += 6;
            if (dl.indexOf(t) !== -1) {
                s += 4;
                var dIdx = dl.indexOf(t);
                if (isWordBoundary(dl, dIdx, t.length)) s += 2;
            }
            var idx = 0;
            var count = 0;
            while (count < 5 && (idx = body.indexOf(t, idx)) !== -1) {
                count++;
                if (isWordBoundary(body, idx, t.length)) s += 2;
                else s += 1;
                idx += t.length;
            }
            var bodyWords = body.split(/\s+/);
            for (var w = 0; w < bodyWords.length; w++) {
                if (bodyWords[w].indexOf(t) === 0 && bodyWords[w].length > t.length) {
                    s += 3;
                    break;
                }
            }
        });
        var maxIdx = 21;
        s += Math.max(0, (maxIdx - (doc.idx || 0)) * 0.3);
        return s;
    }

    function highlight(text, tokens) {
        if (!tokens.length) return esc(text);
        var lower = text.toLowerCase();
        var segments = [];
        var pos = 0;
        while (pos < text.length) {
            var bestIdx = -1;
            var bestLen = 0;
            tokens.forEach(function(t) {
                var found = lower.indexOf(t, pos);
                if (found !== -1 && (bestIdx === -1 || found < bestIdx)) {
                    bestIdx = found;
                    bestLen = t.length;
                }
            });
            if (bestIdx === -1) {
                segments.push(esc(text.slice(pos)));
                break;
            }
            if (bestIdx > pos) segments.push(esc(text.slice(pos, bestIdx)));
            segments.push('<mark>' + esc(text.slice(bestIdx, bestIdx + bestLen)) + '</mark>');
            pos = bestIdx + bestLen;
        }
        return segments.join('');
    }

    function snippet(doc, tokens) {
        var body = doc.text || '';
        var low = body.toLowerCase();
        var bestIdx = -1;
        var bestToken = '';
        tokens.forEach(function(t) {
            var found = low.indexOf(t);
            if (found !== -1 && (bestIdx === -1 || found < bestIdx)) {
                bestIdx = found;
                bestToken = t;
            }
        });
        if (bestIdx !== -1) {
            var start = Math.max(0, bestIdx - 80);
            var end = Math.min(body.length, bestIdx + 140);
            var chunk = body.slice(start, end).trim();
            var prefix = start > 0 ? '…' : '';
            var suffix = end < body.length ? '…' : '';
            return prefix + highlight(chunk, tokens) + suffix;
        }
        return esc((doc.description || '').slice(0, 180));
    }

    function runSearch(q, docs) {
        var tokens = q.toLowerCase().split(/\s+/).filter(function(t) {
            return t.length >= 1 && !STOP_WORDS.has(t);
        });
        if (!tokens.length) return [];
        var scored = docs.map(function(d) { return { d: d, s: score(d, tokens) }; })
            .filter(function(x) { return x.s > 0; })
            .sort(function(a, b) { return b.s - a.s; })
            .slice(0, 20);
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
            box.innerHTML = '<p class="search-status">Локальний пошук недоступний.</p>' + webFallbackHTML(q);
        });
    }

    function renderResults(items, q, box) {
        box.innerHTML = '';
        if (!items.length) {
            box.innerHTML = '<p class="search-status">Нічого не знайдено за запитом «' + esc(q) + '».</p>' + webFallbackHTML(q);
            return;
        }
        var tokens = q.toLowerCase().split(/\s+/).filter(function(t) {
            return t.length >= 1 && !STOP_WORDS.has(t);
        });
        var list = document.createElement('div');
        list.className = 'search-results-list';
        items.forEach(function(d) {
            var a = document.createElement('a');
            a.href = currentBase() + d.url;
            a.className = 'search-result';
            a.setAttribute('role', 'option');
            var title = document.createElement('span');
            title.className = 'search-result-title';
            title.innerHTML = highlight(d.title, tokens);
            a.appendChild(title);
            if (d.tag || d.date || d.minutes) {
                var meta = document.createElement('span');
                meta.className = 'search-result-meta';
                meta.textContent = [d.tag, d.date, d.minutes ? '\u2248' + d.minutes + ' хв' : ''].filter(Boolean).join(' · ');
                a.appendChild(meta);
            }
            var snip = document.createElement('span');
            snip.className = 'search-result-snippet';
            snip.innerHTML = snippet(d, tokens);
            a.appendChild(snip);
            list.appendChild(a);
        });
        box.appendChild(list);
    }

    function webFallbackHTML(q) {
        var eq = encodeURIComponent('site:ukrsocleague.org ' + q);
        return '<div class="search-fallback">' +
            '<p class="search-fallback-label">Спробувати на зовнішньому пошуку:</p>' +
            '<div class="search-fallback-links">' +
            '<a class="search-fallback-btn" href="https://www.google.com/search?q=' + eq + '" target="_blank" rel="noopener">Google</a>' +
            '<a class="search-fallback-btn" href="https://duckduckgo.com/?q=' + eq + '" target="_blank" rel="noopener">DuckDuckGo</a>' +
            '<a class="search-fallback-btn" href="https://www.bing.com/search?q=' + eq + '" target="_blank" rel="noopener">Bing</a>' +
            '</div></div>';
    }

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            open('search');
        }
    });

    window.SiteSearch = {
        open: function() { open('search'); },
        openBookmarks: function() { open('bookmarks'); },
        close: close,
        warm: function() { loadIndex(); }
    };
})();
