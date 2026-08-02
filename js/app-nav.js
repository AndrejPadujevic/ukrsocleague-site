/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * App shell layer: bottom tab bar, SPA-style navigation, service worker,
 * install prompt and head meta enhancements. Loaded dynamically by layout.js.
 *
 * Depends on window.USLPath (exported by layout.js).
 */
(function() {
    'use strict';

    if (window.USLAppNav) return;
    window.USLAppNav = true;

    var PATH = window.USLPath || { isArticle: /\/articles\//.test(location.pathname), base: '', article: function(f) { return f; } };
    var BASE = PATH.base;
    var supportsSPA = window.fetch && window.DOMParser && window.history && history.pushState;

    /* ============================================
       HEAD META ENHANCEMENTS (PWA)
       ============================================ */
    function ensureMeta(name, content) {
        var m = document.querySelector('meta[name="' + name + '"]');
        if (m) { m.setAttribute('content', content); return; }
        m = document.createElement('meta');
        m.setAttribute('name', name);
        m.setAttribute('content', content);
        document.head.appendChild(m);
    }

    function ensureViewportFit() {
        var vp = document.querySelector('meta[name="viewport"]');
        if (!vp) return;
        var c = vp.getAttribute('content') || '';
        if (c.indexOf('viewport-fit') === -1) {
            vp.setAttribute('content', c.trim() + (c ? ', ' : '') + 'viewport-fit=cover');
        }
    }

    ensureViewportFit();
    ensureMeta('mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-title', 'УСЛ');

    // Head icon/manifest links are page-relative in the static HTML; after SPA
    // navigation into /articles/ they would re-resolve to /articles/... and 404.
    // Normalize them to root-absolute paths.
    function fixRelativeHead() {
        document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"], link[rel="apple-touch-icon-precomposed"]').forEach(function(l) {
            var href = l.getAttribute('href');
            if (!href) return;
            if (/^(https?:)?\/\//.test(href) || href.charAt(0) === '/') return;
            l.setAttribute('href', '/' + href.replace(/^(\.\.\/)+/, '').replace(/^\.\//, ''));
        });
    }
    fixRelativeHead();

    /* ============================================
       AUTO-DETECT MODE (Website vs Webapp Mode)
       ============================================ */
    function isStandalonePWA() {
        return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
               (window.navigator && window.navigator.standalone);
    }

    function applyMode() {
        var isWebapp = isStandalonePWA() || window.innerWidth <= 768;
        document.body.classList.toggle('mode-webapp', isWebapp);
        document.body.classList.toggle('mode-website', !isWebapp);
    }

    applyMode();

    /* ============================================
       BOTTOM TAB BAR
       ============================================ */
    function icon(path) {
        return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
    }

    var TAB_ICONS = {
        home: icon('<path d="M3 11l9-8 9 8"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>'),
        views: icon('<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'),
        history: icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
        manifest: icon('<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
        archive: icon('<path d="M3 7h7l2 2h9v11H3z"/>')
    };

    var TAB_LINKS = [
        { key: 'home', label: 'Головна', href: '/index.html' },
        { key: 'views', label: 'Погляди', href: '/articles/views.htm' },
        { key: 'history', label: 'Історія', href: '/history.htm' },
        { key: 'manifest', label: 'Маніфест', href: '/manifest.htm' },
        { key: 'archive', label: 'Архів', href: '/archive.htm' }
    ];

    function activeKey() {
        var h = document.getElementById('site-header');
        return (h && h.getAttribute('data-active')) || '';
    }

    var tabbar = document.createElement('nav');
    tabbar.className = 'app-tabbar';
    tabbar.id = 'app-tabbar';
    tabbar.setAttribute('aria-label', 'Основна навігація');
    tabbar.innerHTML = TAB_LINKS.map(function(t) {
        return '<a class="app-tab" href="' + t.href + '" data-tab="' + t.key + '" aria-label="' + t.label + '">' +
            '<span class="app-tab-icon">' + TAB_ICONS[t.key] + '</span>' +
            '<span class="app-tab-label">' + t.label + '</span>' +
            '</a>';
    }).join('');
    document.body.appendChild(tabbar);

    /* ---- Hide on scroll down / show on scroll up ---- */
    var lastScrollY = window.pageYOffset || 0;
    var scrollTicking = false;
    window.addEventListener('scroll', function() {
        if (scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(function() {
            var y = window.pageYOffset || 0;
            if (y > lastScrollY && y > 80) tabbar.classList.add('app-tabbar-hidden');
            else tabbar.classList.remove('app-tabbar-hidden');
            lastScrollY = y;
            scrollTicking = false;
        });
    }, { passive: true });

    /* ============================================
       SERVICE WORKER REGISTRATION
       ============================================ */
    if ('serviceWorker' in navigator) {
        var secure = window.location.protocol === 'https:' ||
                     window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';
        if (secure) {
            navigator.serviceWorker.register(BASE + 'sw.js').catch(function() {});
        }
    }

    /* ============================================
       SPA-STYLE NAVIGATION
       ============================================ */
    function isInternalLink(a) {
        if (!a || a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-ignore-spa')) return false;
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 || href.indexOf('javascript:') === 0) return false;
        var url;
        try { url = new URL(a.href, window.location.href); } catch (e) { return false; }
        if (url.origin !== window.location.origin) return false;
        var path = url.pathname;
        if (!/(\.(htm|html)$)/.test(path) && path.charAt(path.length - 1) !== '/') return false;
        return true;
    }

    var scrollMap = {};
    var scrollTimer;

    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function() { scrollMap[location.href] = window.pageYOffset || 0; }, 150);
    }, { passive: true });

    function currentBase() {
        return /\/articles\//.test(window.location.pathname) ? '../' : '';
    }

    function loadScript(src, cb) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = function() { cb(); };
        s.onerror = function() { cb(); };
        document.head.appendChild(s);
    }

    function runPageInit() {
        var base = currentBase();
        var hasArchive = document.getElementById('archive-grid');
        var isArticle = !!document.querySelector('main.article-page article, main.article-page .article-content-simple');
        if (hasArchive) {
            if (window.ArchiveInit) window.ArchiveInit.run();
            else loadScript(base + 'js/archive-init.js', function() { if (window.ArchiveInit) window.ArchiveInit.run(); });
        }
        if (isArticle) {
            if (window.ArticleWidgets) window.ArticleWidgets.init();
            else loadScript(base + 'js/article-widgets.js', function() { if (window.ArticleWidgets) window.ArticleWidgets.init(); });
        }
        // Webapp widgets (loaded globally via layout.js)
        if (window.Votes) window.Votes.init();
        if (window.Comments) window.Comments.init();
        if (window.Engagement) window.Engagement.init();
        if (window.Reader) window.Reader.init();
    }

    function markActive() {
        var header = document.getElementById('site-header');
        var key = header ? (header.getAttribute('data-active') || '') : '';
        // Article detail pages belong to the archive section
        if (!key) key = 'archive';
        document.querySelectorAll('.nav-item, .app-tab').forEach(function(a) {
            if (a.classList.contains('dropdown-toggle')) return;
            var k = a.getAttribute('data-tab') || a.getAttribute('data-nav-key');
            if (!k) return;
            a.classList.toggle('active', k === key);
        });
    }

    function updateHeader(slogan) {
        var el = document.querySelector('.slogan-right');
        if (el && slogan) el.textContent = slogan;
    }

    function swapContent(doc, url, opts) {
        var newMain = doc.querySelector('main#main-content, #main-content');
        if (!newMain) throw new Error('no main content');
        var oldMain = document.querySelector('main#main-content, #main-content');
        if (!oldMain) throw new Error('no current main');

        var newHeader = doc.getElementById('site-header');
        var slogan = newHeader ? newHeader.getAttribute('data-slogan') : '';
        var active = newHeader ? newHeader.getAttribute('data-active') : '';
        var header = document.getElementById('site-header');
        if (header) {
            if (slogan) header.setAttribute('data-slogan', slogan);
            header.setAttribute('data-active', active || '');
        }

        var scrollTop = opts && opts.scrollTop;
        oldMain.className = newMain.className;
        oldMain.innerHTML = newMain.innerHTML;
        if (document.title !== doc.title) document.title = doc.title;

        fixRelativeHead();

        // Breadcrumbs live outside <main> (after the header) and would linger
        // on non-article pages; clear them, re-run will re-add if needed.
        var crumbs = document.querySelector('.breadcrumbs');
        if (crumbs && crumbs.parentNode) crumbs.parentNode.removeChild(crumbs);

        updateHeader(slogan);
        markActive();
        runPageInit();

        if (opts && opts.push) {
            history.pushState({ url: url.href, t: Date.now() }, '', url.href);
            scrollMap[url.href] = 0;
        }
        if (typeof scrollTop === 'number') {
            window.scrollTo(0, scrollTop);
        } else {
            window.scrollTo(0, 0);
        }
    }

    function navigate(url, opts) {
        return fetch(url.href, { credentials: 'same-origin' }).then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        }).then(function(html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            swapContent(doc, url, opts);
        }).catch(function() {
            window.location.href = url.href;
        });
    }

    document.addEventListener('click', function(e) {
        if (!supportsSPA) return;
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target && e.target.closest ? e.target.closest('a') : null;
        if (!a || !isInternalLink(a)) return;
        var url;
        try { url = new URL(a.href, window.location.href); } catch (err) { return; }
        if (url.href === window.location.href) return;
        e.preventDefault();
        navigate(url, { push: true });
    });

    window.addEventListener('popstate', function(e) {
        if (!supportsSPA) return;
        var url;
        try { url = new URL(window.location.href); } catch (err) { return; }
        var back = e.state && e.state.url;
        if (back && back !== window.location.href) return; // stale state
        navigate(url, { push: false, scrollTop: scrollMap[url.href] || 0 });
    });

    /* ============================================
       INSTALL PROMPT
       ============================================ */
    var deferredPrompt = null;

    function isMobileView() {
        return window.innerWidth <= 768;
    }

    function buildInstallUI() {
        var wrap = document.createElement('div');
        wrap.className = 'app-install';
        wrap.id = 'app-install';
        wrap.innerHTML =
            '<div class="app-install-inner">' +
            '  <span class="app-install-text">Встановити застосунок УСЛ</span>' +
            '  <button type="button" id="app-install-btn" class="app-install-btn">Встановити</button>' +
            '  <button type="button" id="app-install-close" class="app-install-close" aria-label="Закрити">&times;</button>' +
            '</div>';
        document.body.appendChild(wrap);

        var dismissed = localStorage.getItem('usl-install-dismissed') === '1';

        function showGuide() {
            var guide = document.createElement('div');
            guide.className = 'install-guide';
            guide.id = 'install-guide';
            guide.setAttribute('role', 'dialog');
            guide.setAttribute('aria-modal', 'true');
            guide.innerHTML =
                '<div class="install-guide-box">' +
                '  <h3>Встановити застосунок</h3>' +
                '  <ol>' +
                '    <li>Натисніть кнопку «Поділитися» <strong>⎋</strong> у браузері.</li>' +
                '    <li>Оберіть «На головний екран» (Add to Home Screen).</li>' +
                '    <li>Відкривайте УСЛ як застосунок.</li>' +
                '  </ol>' +
                '  <button type="button" class="app-install-btn" id="install-guide-close">Зрозуміло</button>' +
                '</div>';
            document.body.appendChild(guide);
            document.getElementById('install-guide-close').addEventListener('click', function() { guide.parentNode.removeChild(guide); });
        }

        function maybeShow() {
            var shouldShow = isMobileView() && !dismissed;
            wrap.style.display = shouldShow ? 'block' : 'none';
        }

        window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            deferredPrompt = e;
            maybeShow();
        });

        window.addEventListener('appinstalled', function() {
            deferredPrompt = null;
            localStorage.setItem('usl-install-dismissed', '1');
            wrap.style.display = 'none';
        });

        document.getElementById('app-install-btn').addEventListener('click', function() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(function() {
                    deferredPrompt = null;
                    localStorage.setItem('usl-install-dismissed', '1');
                    wrap.style.display = 'none';
                });
            } else {
                showGuide();
            }
        });

        document.getElementById('app-install-close').addEventListener('click', function() {
            localStorage.setItem('usl-install-dismissed', '1');
            wrap.style.display = 'none';
        });

        window.addEventListener('resize', maybeShow);
        maybeShow();
    }

    if (isMobileView()) buildInstallUI();

    /* ---- active state on first load ---- */
    markActive();
})();
