/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Google Translate integration with custom UI.
 * Supports: en, de, fr, es, it, pt, nl, pl, cs, sv, da, fi, el, hu, ro, sk, bg, hr, sl, lt, lv, et, ga, mt, eo
 */
(function() {
    'use strict';

    var LANGUAGES = [
        { code: 'en', name: 'English' },
        { code: 'de', name: 'Deutsch' },
        { code: 'fr', name: 'Français' },
        { code: 'es', name: 'Español' },
        { code: 'it', name: 'Italiano' },
        { code: 'pt', name: 'Português' },
        { code: 'nl', name: 'Nederlands' },
        { code: 'pl', name: 'Polski' },
        { code: 'cs', name: 'Čeština' },
        { code: 'sv', name: 'Svenska' },
        { code: 'da', name: 'Dansk' },
        { code: 'fi', name: 'Suomi' },
        { code: 'el', name: 'Ελληνικά' },
        { code: 'hu', name: 'Magyar' },
        { code: 'ro', name: 'Română' },
        { code: 'sk', name: 'Slovenčina' },
        { code: 'bg', name: 'Български' },
        { code: 'hr', name: 'Hrvatski' },
        { code: 'sl', name: 'Slovenščina' },
        { code: 'lt', name: 'Lietuvių' },
        { code: 'lv', name: 'Latviešu' },
        { code: 'et', name: 'Eesti' },
        { code: 'ga', name: 'Gaeilge' },
        { code: 'mt', name: 'Malti' },
        { code: 'eo', name: 'Esperanto' }
    ];

    var currentLang = '';

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }

    function setCookie(name, value, days) {
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + value + expires + '; path=/; SameSite=Lax';
    }

    function getCurrentLang() {
        var cookie = getCookie('googtrans');
        if (cookie && cookie !== '' && cookie !== '/uk') {
            return cookie.replace('/uk', '');
        }
        return '';
    }

    function translatePage(lang) {
        if (lang === currentLang) return;

        if (lang === '') {
            // Reset to original language
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.ukrsocleague.org';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=ukrsocleague.org';
            window.location.reload();
            return;
        }

        currentLang = lang;
        setCookie('googtrans', '/' + lang, 365);

        // Trigger Google Translate
        var select = document.querySelector('#google_translate_element select');
        if (select) {
            select.value = lang;
            select.dispatchEvent(new Event('change'));
        } else {
            // Google Translate not loaded yet, reload to apply
            window.location.reload();
        }

        updateButtonLabel(lang);
        closeDropdown();
    }

    function updateButtonLabel(lang) {
        var label = document.querySelector('.translate-btn-label');
        if (!label) return;

        if (lang === '') {
            label.textContent = 'UA';
        } else {
            var langObj = LANGUAGES.find(function(l) { return l.code === lang; });
            label.textContent = langObj ? langObj.name.substring(0, 2).toUpperCase() : lang.toUpperCase();
        }
    }

    function createSwitcherUI() {
        // Add hidden Google Translate container
        var container = document.createElement('div');
        container.id = 'google_translate_element';
        container.style.display = 'none';
        document.body.appendChild(container);

        // Create custom switcher button
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'translate-btn';
        btn.setAttribute('aria-label', 'Переклад сторінки');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-haspopup', 'listbox');
        btn.innerHTML = '<span class="translate-btn-icon">🌐</span><span class="translate-btn-label">UA</span><span class="translate-btn-arrow">▾</span>';

        // Create dropdown
        var dropdown = document.createElement('div');
        dropdown.className = 'translate-dropdown';
        dropdown.setAttribute('role', 'listbox');
        dropdown.setAttribute('aria-label', 'Оберіть мову');

        var originalOption = document.createElement('button');
        originalOption.type = 'button';
        originalOption.className = 'translate-option' + (currentLang === '' ? ' active' : '');
        originalOption.setAttribute('role', 'option');
        originalOption.setAttribute('data-lang', '');
        originalOption.innerHTML = '<span class="lang-name">Українська</span>';
        dropdown.appendChild(originalOption);

        LANGUAGES.forEach(function(lang) {
            var option = document.createElement('button');
            option.type = 'button';
            option.className = 'translate-option' + (currentLang === lang.code ? ' active' : '');
            option.setAttribute('role', 'option');
            option.setAttribute('data-lang', lang.code);
            option.innerHTML = '<span class="lang-name">' + lang.name + '</span><span class="lang-code">' + lang.code.toUpperCase() + '</span>';
            dropdown.appendChild(option);
        });

        var wrapper = document.createElement('div');
        wrapper.className = 'translate-wrapper';
        wrapper.appendChild(btn);
        wrapper.appendChild(dropdown);

        // Toggle dropdown
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = dropdown.classList.contains('open');
            if (isOpen) {
                closeDropdown();
            } else {
                dropdown.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });

        // Handle language selection
        dropdown.addEventListener('click', function(e) {
            var option = e.target.closest('.translate-option');
            if (option) {
                var lang = option.getAttribute('data-lang');
                translatePage(lang);
            }
        });

        // Close on outside click
        document.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target)) {
                closeDropdown();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeDropdown();
            }
        });

        return wrapper;
    }

    function closeDropdown() {
        var dropdown = document.querySelector('.translate-dropdown');
        var btn = document.querySelector('.translate-btn');
        if (dropdown) dropdown.classList.remove('open');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function initGoogleTranslate() {
        window.googleTranslateElementInit = function() {
            new google.translate.TranslateElement({
                pageLanguage: 'uk',
                includedLanguages: LANGUAGES.map(function(l) { return l.code; }).join(','),
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
        };

        // Load Google Translate script
        var script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.head.appendChild(script);
    }

    // Initialize when DOM is ready
    function init() {
        currentLang = getCurrentLang();
        var switcher = createSwitcherUI();

        // Add to nav container
        var navContainer = document.querySelector('.nav-container');
        if (navContainer) {
            navContainer.appendChild(switcher);
        } else {
            // Nav not ready yet, wait for layout.js
            var observer = new MutationObserver(function(mutations) {
                var nc = document.querySelector('.nav-container');
                if (nc) {
                    nc.appendChild(switcher);
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        updateButtonLabel(currentLang);
        initGoogleTranslate();
    }

    window.SiteTranslate = {
        getLang: getCurrentLang
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
