/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * GDPR Cookie Consent Banner
 * Loads GA only after user consent.
 */
(function() {
    'use strict';

    var CONSENT_KEY = 'usl_cookie_consent';
    var CONSENT_VERSION = '1.0';
    var GA_ID = 'G-GFGJF79SNG';

    function getConsent() {
        try {
            var data = JSON.parse(localStorage.getItem(CONSENT_KEY));
            if (data && data.version === CONSENT_VERSION) {
                return data;
            }
        } catch (e) {}
        return null;
    }

    function setConsent(preferences) {
        var data = {
            version: CONSENT_VERSION,
            timestamp: Date.now(),
            necessary: true,
            analytics: preferences.analytics || false,
            marketing: preferences.marketing || false
        };
        localStorage.setItem(CONSENT_KEY, JSON.stringify(data));

        applyConsent(data);

        var banner = document.getElementById('cookie-consent');
        if (banner) {
            banner.classList.add('hiding');
            setTimeout(function() { banner.remove(); }, 300);
        }

        window.dispatchEvent(new CustomEvent('cookieConsent', { detail: data }));
    }

    function loadGA() {
        if (window._gaLoaded) return;
        window._gaLoaded = true;

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        window.gtag = gtag;

        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);

        gtag('js', new Date());
        gtag('config', GA_ID, { anonymize_ip: true });
    }

    function applyConsent(data) {
        window.USLConsent = data;
        if (data.analytics) {
            loadGA();
        }
    }

    function createBanner() {
        if (getConsent()) return;

        var banner = document.createElement('div');
        banner.id = 'cookie-consent';
        banner.className = 'cookie-consent';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Згода на використання файлів cookie');
        banner.innerHTML =
            '<div class="cookie-consent-content">' +
                '<div class="cookie-consent-text">' +
                    '<h3>Файли cookie</h3>' +
                    '<p>Цей сайт використовує файли cookie для забезпечення роботи сайту та аналітики. Ви можете обрати, які cookie дозволити.</p>' +
                '</div>' +
                '<div class="cookie-consent-options">' +
                    '<label class="cookie-option">' +
                        '<input type="checkbox" checked disabled> ' +
                        '<span>Необхідні</span>' +
                    '</label>' +
                    '<label class="cookie-option">' +
                        '<input type="checkbox" id="cookie-analytics" checked> ' +
                        '<span>Аналітика</span>' +
                    '</label>' +
                '</div>' +
                '<div class="cookie-consent-actions">' +
                    '<button type="button" class="cookie-btn cookie-btn-accept" id="cookie-accept">Прийняти всі</button>' +
                    '<button type="button" class="cookie-btn cookie-btn-save" id="cookie-save">Зберегти</button>' +
                    '<button type="button" class="cookie-btn cookie-btn-reject" id="cookie-reject">Лише необхідні</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(banner);

        document.getElementById('cookie-accept').addEventListener('click', function() {
            setConsent({ analytics: true, marketing: true });
        });
        document.getElementById('cookie-save').addEventListener('click', function() {
            var analytics = document.getElementById('cookie-analytics').checked;
            setConsent({ analytics: analytics, marketing: false });
        });
        document.getElementById('cookie-reject').addEventListener('click', function() {
            setConsent({ analytics: false, marketing: false });
        });
    }

    var consent = getConsent();
    if (consent) {
        applyConsent(consent);
    } else {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createBanner);
        } else {
            createBanner();
        }
    }
})();
