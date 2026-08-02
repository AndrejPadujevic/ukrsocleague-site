/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Bookmarks / read-later: localStorage, offline-first, per-device.
 */
(function() {
    'use strict';

    var KEY = 'usl-bookmarks';

    function all() {
        try {
            var raw = localStorage.getItem(KEY);
            var arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch (e) { return []; }
    }

    function save(list) {
        try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('usl-bookmarks')); } catch (e) {}
    }

    function isSaved(url) {
        return all().some(function(b) { return b.url === url; });
    }

    function toggle(item) {
        var list = all();
        var idx = -1;
        list.forEach(function(b, i) { if (b.url === item.url) idx = i; });
        if (idx === -1) {
            list.unshift({ url: item.url, title: item.title || item.url, tag: item.tag || '', date: item.date || '', added: Date.now() });
        } else {
            list.splice(idx, 1);
        }
        save(list);
        return idx === -1;
    }

    function currentArticleItem() {
        var url = window.location.pathname;
        var slug = url.split('/').pop().replace(/\.html?$/i, '');
        var meta = { title: '', tag: '', date: '' };
        if (window.USL_ARCHIVE) {
            window.USL_ARCHIVE.forEach(function(a) {
                if (!meta.title && a.url && a.url.split('/').pop().replace(/\.html?$/i, '') === slug) {
                    meta.title = a.title; meta.tag = a.tag; meta.date = a.date;
                }
            });
        }
        if (!meta.title) {
            var h1 = document.querySelector('main.article-page h1');
            meta.title = h1 ? h1.textContent.trim() : slug;
        }
        return { url: url, title: meta.title, tag: meta.tag, date: meta.date };
    }

    function button(item) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'bookmark-btn';
        b.dataset.bookmarkUrl = item.url;
        b.setAttribute('aria-pressed', isSaved(item.url) ? 'true' : 'false');
        b.title = 'Зберегти в закладки';
        b.textContent = isSaved(item.url) ? '\u2605' : '\u2606';
        b.addEventListener('click', function() {
            var saved = toggle(item);
            b.textContent = saved ? '\u2605' : '\u2606';
            b.setAttribute('aria-pressed', saved ? 'true' : 'false');
        });
        return b;
    }

    function renderInto(container) {
        container.innerHTML = '';
        var items = all();
        if (!items.length) {
            var empty = document.createElement('p');
            empty.className = 'bookmarks-empty';
            empty.textContent = 'Закладок поки немає. Натискайте \u2606 на статтях, щоб зберегти їх тут.';
            container.appendChild(empty);
            return;
        }
        var list = document.createElement('div');
        list.className = 'bookmarks-list';
        items.forEach(function(b) {
            var row = document.createElement('div');
            row.className = 'bookmark-row';
            var a = document.createElement('a');
            a.href = b.url;
            a.className = 'bookmark-link';
            var t = document.createElement('span');
            t.className = 'bookmark-title';
            t.textContent = b.title;
            a.appendChild(t);
            if (b.date) {
                var d = document.createElement('span');
                d.className = 'bookmark-date';
                d.textContent = b.date;
                a.appendChild(d);
            }
            var rm = document.createElement('button');
            rm.type = 'button';
            rm.className = 'bookmark-remove';
            rm.textContent = '\u00d7';
            rm.setAttribute('aria-label', 'Видалити з закладок');
            rm.addEventListener('click', function() {
                var l = all();
                var i = -1;
                l.forEach(function(x, j) { if (x.url === b.url) i = j; });
                if (i !== -1) l.splice(i, 1);
                save(l);
                renderInto(container);
            });
            row.appendChild(a);
            row.appendChild(rm);
            list.appendChild(row);
        });
        container.appendChild(list);
    }

    window.Bookmarks = {
        all: all,
        isSaved: isSaved,
        toggle: toggle,
        button: button,
        currentArticleItem: currentArticleItem,
        renderInto: renderInto
    };
})();
