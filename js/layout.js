/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Shared layout: injects red banner, main nav, side menu and footer
 * into every page. One place to edit for all global chrome changes.
 *
 * Usage:
 *   <div id="site-header" data-slogan="СЛОГАН_ПРАВОРУЧ" data-active="home"></div>
 *   ... page content ...
 *   <div id="site-footer"></div>
 *   <script src="js/layout.js"></script>
 *
 * data-active: home | views | history | manifest | archive
 */
(function() {
    'use strict';

    var headerEl = document.getElementById('site-header');
    var footerEl = document.getElementById('site-footer');
    if (!headerEl || !footerEl) return;

    // Base path for pages inside /articles/
    var isArticleDir = /\/articles\//.test(window.location.pathname);
    var BASE = isArticleDir ? '../' : '';
    var SLOGAN = headerEl.getAttribute('data-slogan') || 'УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА';
    var ACTIVE = headerEl.getAttribute('data-active') || '';
    var SLOGAN_LEFT = 'РОБІТНИКИ ВСІХ КРАЇН, ЄДНАЙТЕСЯ!';

    function articleRef(file) {
        return isArticleDir ? file : 'articles/' + file;
    }

    var navLinks = [
        { key: 'home', label: 'ГОЛОВНА', href: '/index.html' },
        { key: 'views', label: 'ПОГЛЯДИ', href: '/articles/views.htm' },
        { key: 'history', label: 'ІСТОРІЯ', href: '/history.htm' },
        { key: 'manifest', label: 'МАНІФЕСТ', href: '/manifest.htm' },
        { key: 'archive', label: 'АРХІВ', href: '/archive.htm' }
    ];

    function navHtml() {
        return navLinks.map(function(item) {
            var cls = 'nav-item' + (item.key === ACTIVE ? ' active' : '');
            return '<a href="' + item.href + '" class="' + cls + '" data-nav-key="' + item.key + '">' + item.label + '</a>';
        }).join('\n            ');
    }

    function sideMenuHtml() {
        var items = [
            { href: '/index.html', label: 'Головна' },
            { href: '/articles/views.htm', label: 'Наші погляди' },
            { href: '/history.htm', label: 'Історія' },
            { href: '/manifest.htm', label: 'Маніфест' },
            { href: '/archive.htm', label: 'Архів' },
            { href: 'https://www.youtube.com/@ukr_soc_league', label: 'УСЛ в YouTube' },
            { href: 'https://tradeunion.org.ua/', label: 'Профспілка "Захист Праці"' },
            { href: '/articles/lis_msl_isl.htm', label: 'Міжнародна Соціалістична Ліга' }
        ];
        var html = items.map(function(item) {
            return '<a href="' + item.href + '" class="side-nav-item">' + item.label + '</a>';
        }).join('\n            ');
        var tools = [
            { key: 'search', label: 'Пошук по сайту' },
            { key: 'bookmarks', label: 'Закладки' }
        ];
        var toolHtml = tools.map(function(t) {
            return '<button type="button" class="side-tool-btn" data-tool="' + t.key + '">' + t.label + '</button>';
        }).join('\n            ');
        return '' +
            '        <div class="side-menu-header">\n' +
            '            <h3>МЕНЮ</h3>\n' +
            '            <button id="close-menu" class="close-btn">&times;</button>\n' +
            '        </div>\n' +
            '        <div class="side-menu-content">\n' +
            '            ' + html + '\n' +
            '            <div class="side-menu-tools">\n' +
            '                ' + toolHtml + '\n' +
            '            </div>\n' +
            '            <div class="side-theme"></div>\n' +
            '            <div class="side-menu-contact">\n' +
            '                <a href="mailto:azura@noleron.com" class="side-contact-link"><svg class="side-icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg> azura@noleron.com</a>\n' +
            '                <a href="https://social.noleron.com/@ukrsocleague" class="side-contact-link"><svg class="side-icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.327 8.566c0-4.339-2.843-5.61-2.843-5.61-1.433-.658-3.894-.935-6.451-.956h-.063c-2.557.021-5.016.298-6.45.956 0 0-2.843 1.272-2.843 5.61 0 .993-.019 2.181.012 3.441.103 4.243.778 8.425 4.701 9.463 1.809.479 3.362.579 4.612.51 2.268-.126 3.541-.809 3.541-.809l-.075-1.646s-1.621.511-3.441.449c-1.804-.062-3.707-.194-3.999-2.409a4.523 4.523 0 01-.04-.621s1.77.432 4.014.535c1.372.063 2.658-.08 3.965-.236 2.506-.299 4.688-1.843 4.962-3.254.434-2.223.398-5.424.398-5.424zm-3.353 5.59h-2.081V9.057c0-1.075-.452-1.62-1.357-1.62-1 0-1.501.647-1.501 1.927v2.791h-2.069V9.364c0-1.28-.501-1.927-1.502-1.927-.904 0-1.357.546-1.357 1.62v5.099H6.026V8.903c0-1.074.273-1.927.823-2.558.566-.631 1.307-.955 2.228-.955 1.065 0 1.872.41 2.405 1.228l.518.869.519-.869c.533-.818 1.34-1.228 2.405-1.228.92 0 1.662.324 2.228.955.549.631.822 1.484.822 2.558v5.253z"/></svg> Fediverse</a>\n' +
            '            </div>\n' +
            '        </div>';
    }

    function footerHtml() {
        return '' +
            '    <div class="footer-content">\n' +
            '        <div class="footer-left">\n' +
            '            <div class="footer-logo">\n' +
            '                <picture>\n' +
            '                    <source type="image/webp" srcset="' + BASE + 'pictures/logo-256.webp">\n' +
            '                    <img src="' + BASE + 'pictures/logo-256.png" alt="УСЛ" class="footer-logo-img">\n' +
            '                </picture>\n' +
            '            </div>\n' +
            '            <div class="footer-text">\n' +
            '                <p>Українська Соціалістична Ліга</p>\n' +
            '                <p>Солідарність назавжди!</p>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '        <div class="footer-center">\n' +
            '            <h4>КОНТАКТИ</h4>\n' +
            '            <div class="footer-contact">\n' +
            '                <a href="mailto:azura@noleron.com" class="footer-contact-link"><svg class="footer-icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg> azura@noleron.com</a>\n' +
            '                <a href="https://social.noleron.com/@ukrsocleague" class="footer-contact-link"><svg class="footer-icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.327 8.566c0-4.339-2.843-5.61-2.843-5.61-1.433-.658-3.894-.935-6.451-.956h-.063c-2.557.021-5.016.298-6.45.956 0 0-2.843 1.272-2.843 5.61 0 .993-.019 2.181.012 3.441.103 4.243.778 8.425 4.701 9.463 1.809.479 3.362.579 4.612.51 2.268-.126 3.541-.809 3.541-.809l-.075-1.646s-1.621.511-3.441.449c-1.804-.062-3.707-.194-3.999-2.409a4.523 4.523 0 01-.04-.621s1.77.432 4.014.535c1.372.063 2.658-.08 3.965-.236 2.506-.299 4.688-1.843 4.962-3.254.434-2.223.398-5.424.398-5.424zm-3.353 5.59h-2.081V9.057c0-1.075-.452-1.62-1.357-1.62-1 0-1.501.647-1.501 1.927v2.791h-2.069V9.364c0-1.28-.501-1.927-1.502-1.927-.904 0-1.357.546-1.357 1.62v5.099H6.026V8.903c0-1.074.273-1.927.823-2.558.566-.631 1.307-.955 2.228-.955 1.065 0 1.872.41 2.405 1.228l.518.869.519-.869c.533-.818 1.34-1.228 2.405-1.228.92 0 1.662.324 2.228.955.549.631.822 1.484.822 2.558v5.253z"/></svg> Fediverse</a>\n' +
            '                <a href="https://t.me/ukrsocLeague" class="footer-contact-link"><svg class="footer-icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.47l-1.97 9.28c-.15.67-.54.83-1.09.52l-3.02-2.22-1.46 1.4c-.16.16-.3.3-.61.3l.22-3.05 5.55-5.01c.24-.22-.05-.33-.37-.14L8.68 13.3l-2.97-.93c-.65-.2-.66-.65.14-.96l11.6-4.47c.54-.2 1.01.13.83.96l-.33.57z"/></svg> Telegram</a>\n' +
            '                <a href="https://substack.com/@ukrsocleague" class="footer-contact-link"><svg class="footer-icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/></svg> Substack</a>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '        <div class="footer-right">\n' +
            '            <h4>ПАРТНЕРИ</h4>\n' +
            '            <div class="footer-partners">\n' +
            '                <a href="https://tradeunion.org.ua/" class="partner-link">Профспілка "Захист Праці"</a>\n' +
            '                <a href="https://www.youtube.com/@ukr_soc_league" class="partner-link">УСЛ в YouTube</a>\n' +
            '                <a href="/articles/lis_msl_isl.htm" class="partner-link">Міжнародна Соціалістична Ліга</a>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '    <div class="footer-newsletter">\n' +
            '        <form class="newsletter-form" novalidate>\n' +
            '            <label class="newsletter-label" for="newsletter-email">Розсилка УСЛ</label>\n' +
            '            <div class="newsletter-row">\n' +
            '                <input type="email" id="newsletter-email" class="newsletter-email" placeholder="email@example.com" autocomplete="email" required>\n' +
            '                <button type="submit" class="newsletter-submit">Підписатися</button>\n' +
            '            </div>\n' +
            '            <input type="text" class="newsletter-hp" tabindex="-1" autocomplete="off" aria-hidden="true">\n' +
            '            <p class="newsletter-msg" role="status"></p>\n' +
            '        </form>\n' +
            '    </div>\n' +
            '    <div class="footer-bottom">\n' +
            '        <p>&copy; 2026 Українська Соціалістична Ліга. Всі права захищені.</p>\n' +
            '        <p class="footer-slogan">' + SLOGAN_LEFT + '</p>\n' +
            '        <div class="footer-theme"></div>\n' +
            '    </div>';
    }

    // Skip link (accessibility) - first element in body
    if (!document.querySelector('.skip-link')) {
        var skip = document.createElement('a');
        skip.className = 'skip-link';
        skip.href = '#main-content';
        skip.textContent = 'Перейти до вмісту';
        document.body.insertBefore(skip, document.body.firstChild);
    }

    // Idempotent injection guard (app-shell navigation never re-injects chrome)
    var alreadyInjected = headerEl.querySelector('.red-banner') && footerEl.querySelector('.main-footer');

    if (!alreadyInjected) {
        // Header: red banner + main nav + side menu
        headerEl.innerHTML =
            '    <div class="red-banner">\n' +
            '        <div class="banner-text">\n' +
            '            <span class="slogan-left">' + SLOGAN_LEFT + '</span>\n' +
            '            <div class="logo-container">\n' +
            '                <img src="' + BASE + 'pictures/logo_w.png" alt="УСЛ" class="main-logo">\n' +
            '            </div>\n' +
            '            <span class="slogan-right">' + SLOGAN + '</span>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '\n' +
            '    <nav class="main-nav">\n' +
            '        <div class="nav-container">\n' +
            '            ' + navHtml() + '\n' +
            '            <button type="button" class="nav-search-btn" id="nav-search-btn" aria-label="Пошук по сайту">Пошук</button>\n' +
            '            <div class="nav-theme"></div>\n' +
            '            <button type="button" class="nav-item dropdown-toggle" aria-expanded="false" aria-controls="side-menu">МЕНЮ ▼</button>\n' +
            '        </div>\n' +
            '    </nav>\n' +
            '\n' +
            '    <div id="side-overlay" class="side-overlay"></div>\n' +
            '\n' +
            '    <div id="side-menu" class="side-menu">\n' +
            '        ' + sideMenuHtml() + '\n' +
            '    </div>';

        // Footer: main footer + scroll-to-top
        footerEl.innerHTML =
            '    <footer class="main-footer">\n' +
            '        ' + footerHtml() + '\n' +
            '    </footer>\n' +
            '\n' +
            '    <button id="scroll-to-top" class="scroll-to-top" title="Вгору" aria-label="Прокрутити вгору">↑</button>';
    }

    // Export path helpers for app-nav.js (and others)
    window.USLPath = {
        isArticle: isArticleDir,
        base: BASE,
        article: articleRef
    };

    // ---- Behaviour (side menu, mobile nav, scroll-to-top) ----
    var dropdownToggle = document.querySelector('.dropdown-toggle');
    var sideMenu = document.getElementById('side-menu');
    var sideOverlay = document.getElementById('side-overlay');
    var closeMenuBtn = document.getElementById('close-menu');

    function closeSideMenu() {
        if (sideMenu) sideMenu.classList.remove('open');
        if (sideOverlay) sideOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (dropdownToggle && sideMenu) {
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            sideMenu.classList.add('open');
            sideOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeSideMenu);
    }

    if (sideOverlay) {
        sideOverlay.addEventListener('click', closeSideMenu);
    }

    document.addEventListener('click', function(e) {
        if (sideMenu && !sideMenu.contains(e.target) &&
            dropdownToggle && !dropdownToggle.contains(e.target) &&
            e.target !== dropdownToggle) {
            closeSideMenu();
        }
    });

    function updateMobileNavigation() {
        var navItems = document.querySelectorAll('.nav-item:not(.dropdown-toggle)');
        var isMobileView = window.innerWidth <= 768;
        navItems.forEach(function(item) {
            item.style.display = isMobileView ? 'none' : '';
        });
    }

    updateMobileNavigation();

    var resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            updateMobileNavigation();
            if (window.innerWidth > 768) {
                closeSideMenu();
            }
        }, 250);
    });

    var scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', function() {
            scrollToTopBtn.style.display = window.pageYOffset > 300 ? 'block' : 'none';
        });
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Webapp tool buttons (search, bookmarks) — wired lazily in case a module loads later
    document.addEventListener('click', function(e) {
        var toolBtn = e.target && e.target.closest ? e.target.closest('.side-tool-btn') : null;
        if (toolBtn) {
            if (toolBtn.dataset.tool === 'search' && window.SiteSearch) window.SiteSearch.open();
            if (toolBtn.dataset.tool === 'bookmarks' && window.SiteSearch) window.SiteSearch.openBookmarks();
            return;
        }
        if (e.target && e.target.closest && e.target.closest('#nav-search-btn') && window.SiteSearch) {
            window.SiteSearch.open();
        }
    });

    // Load the webapp feature modules, then the app-shell layer
    ['config.js', 'supabase-client.js', 'theme.js', 'bookmarks.js', 'reader.js', 'search.js', 'engagement.js', 'votes.js', 'comments.js', 'article-widgets.js', 'translate.js', 'consent.js'].forEach(function(file) {
        if (!document.querySelector('script[data-webapp="' + file + '"]')) {
            var s = document.createElement('script');
            s.src = BASE + 'js/' + file;
            s.setAttribute('data-webapp', file);
            s.async = false;
            document.body.appendChild(s);
        }
    });

    // Load the app-shell layer (tab bar, SPA navigation, service worker, install prompt)
    if (!document.querySelector('script[data-app-nav]')) {
        var appNav = document.createElement('script');
        appNav.src = BASE + 'js/app-nav.js';
        appNav.setAttribute('data-app-nav', '');
        appNav.async = false;
        document.body.appendChild(appNav);
    }
})();
