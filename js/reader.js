/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Reader utilities: top reading-progress bar + "~X хв" reading time.
 * Re-runnable (SPA-safe): call window.Reader.init() after content swaps.
 */
(function() {
    'use strict';

    var bar = null;
    var ticking = false;

    function ensureBar() {
        if (bar) return bar;
        bar = document.createElement('div');
        bar.className = 'reading-progress';
        bar.id = 'reading-progress';
        bar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(bar);
        return bar;
    }

    function update() {
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        var pct = max > 0 ? Math.min(100, (window.pageYOffset / max) * 100) : 0;
        bar.style.width = pct.toFixed(1) + '%';
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function() {
            update();
            ticking = false;
        });
    }

    function readingTime() {
        var main = document.querySelector('main.article-page article, main.article-page .article-content-simple');
        if (!main) return null;
        var h1 = document.querySelector('main.article-page h1, .page-title-container h1');
        if (!h1) return null;
        // Don't add reading time on main page (homepage)
        if (document.body.classList.contains('home-page') || window.location.pathname === '/' || window.location.pathname === '/index.html') return null;
        var words = (main.textContent || '').split(/\s+/).filter(function(w) { return w.length > 1; }).length;
        var minutes = Math.max(1, Math.round(words / 180));
        var span = h1.querySelector('.reading-time');
        if (!span) {
            span = document.createElement('span');
            span.className = 'reading-time';
            h1.appendChild(span);
        }
        span.textContent = '\u2248' + minutes + ' \u0445\u0432 \u0447\u0438\u0442\u0430\u043d\u043d\u044f';
    }

    window.Reader = {
        init: function() {
            var el = ensureBar();
            var isArticle = !!document.querySelector('main.article-page article, main.article-page .article-content-simple');
            if (!isArticle) { el.style.display = 'none'; return; }
            el.style.display = 'block';
            update();
            readingTime();
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.Reader.init);
    } else {
        window.Reader.init();
    }
})();
