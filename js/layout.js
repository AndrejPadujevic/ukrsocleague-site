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
        { key: 'home', label: 'ГОЛОВНА', href: BASE + 'index.html' },
        { key: 'views', label: 'ПОГЛЯДИ', href: articleRef('views.htm') },
        { key: 'history', label: 'ІСТОРІЯ', href: BASE + 'history.htm' },
        { key: 'manifest', label: 'МАНІФЕСТ', href: BASE + 'manifest.htm' },
        { key: 'archive', label: 'АРХІВ', href: BASE + 'archive.htm' }
    ];

    function navHtml() {
        return navLinks.map(function(item) {
            var cls = 'nav-item' + (item.key === ACTIVE ? ' active' : '');
            return '<a href="' + item.href + '" class="' + cls + '" data-nav-key="' + item.key + '">' + item.label + '</a>';
        }).join('\n            ');
    }

    function sideMenuHtml() {
        var items = [
            { href: BASE + 'index.html', label: 'Головна' },
            { href: articleRef('views.htm'), label: 'Наші погляди' },
            { href: BASE + 'history.htm', label: 'Історія' },
            { href: BASE + 'manifest.htm', label: 'Маніфест' },
            { href: BASE + 'archive.htm', label: 'Архів' },
            { href: 'https://www.youtube.com/@ukr_soc_league', label: 'УСЛ в YouTube' },
            { href: 'https://tradeunion.org.ua/', label: 'Профспілка "Захист Праці"' },
            { href: articleRef('lis_msl_isl.htm'), label: 'Міжнародна Соціалістична Ліга' }
        ];
        var html = items.map(function(item) {
            return '<a href="' + item.href + '" class="side-nav-item">' + item.label + '</a>';
        }).join('\n            ');
        return '' +
            '        <div class="side-menu-header">\n' +
            '            <h3>МЕНЮ</h3>\n' +
            '            <button id="close-menu" class="close-btn">&times;</button>\n' +
            '        </div>\n' +
            '        <div class="side-menu-content">\n' +
            '            ' + html + '\n' +
            '            <div class="side-menu-contact">\n' +
            '                <a href="mailto:azura@noleron.com" class="side-contact-link">azura@noleron.com</a>\n' +
            '                <a href="https://social.noleron.com/@ukrsocleague" class="side-contact-link">Fediverse</a>\n' +
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
            '                <a href="mailto:azura@noleron.com" class="footer-contact-link">azura@noleron.com</a>\n' +
            '                <a href="https://social.noleron.com/@ukrsocleague" class="footer-contact-link">Fediverse</a>\n' +
            '                <a href="https://t.me/ukrsocLeague" class="footer-contact-link">Telegram</a>\n' +
            '                <a href="https://substack.com/@ukrsocleague" class="footer-contact-link">Substack</a>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '        <div class="footer-right">\n' +
            '            <h4>ПАРТНЕРИ</h4>\n' +
            '            <div class="footer-partners">\n' +
            '                <a href="https://tradeunion.org.ua/" class="partner-link">Профспілка "Захист Праці"</a>\n' +
            '                <a href="https://www.youtube.com/@ukr_soc_league" class="partner-link">УСЛ в YouTube</a>\n' +
            '                <a href="' + articleRef('lis_msl_isl.htm') + '" class="partner-link">Міжнародна Соціалістична Ліга</a>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '    <div class="footer-bottom">\n' +
            '        <p>&copy; 2026 Українська Соціалістична Ліга. Всі права захищені.</p>\n' +
            '        <p class="footer-slogan">' + SLOGAN_LEFT + '</p>\n' +
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
            '            <a href="#" class="nav-item dropdown-toggle">МЕНЮ ▼</a>\n' +
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
            '    <button id="scroll-to-top" class="scroll-to-top" title="Вгору">↑</button>';
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

    // Load the app-shell layer (tab bar, SPA navigation, service worker, install prompt)
    if (!document.querySelector('script[data-app-nav]')) {
        var appNav = document.createElement('script');
        appNav.src = BASE + 'js/app-nav.js';
        appNav.setAttribute('data-app-nav', '');
        appNav.defer = true;
        document.body.appendChild(appNav);
    }
})();
