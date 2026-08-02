/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Manual dark/light theme toggle. Overrides prefers-color-scheme when set.
 * Uses the existing body.dark-mode-preferred class (see js/device-detection.js).
 */
(function() {
    'use strict';

    var KEY = 'usl-theme';

    function pref() {
        try {
            var v = localStorage.getItem(KEY);
            return v === 'dark' || v === 'light' || v === 'auto' ? v : 'auto';
        } catch (e) { return 'auto'; }
    }

    function setPref(v) {
        try { localStorage.setItem(KEY, v); } catch (e) {}
    }

    function systemDark() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function apply() {
        var body = document.body;
        var p = pref();
        if (p === 'dark') body.classList.add('dark-mode-preferred');
        else if (p === 'light') body.classList.remove('dark-mode-preferred');
        else if (systemDark()) body.classList.add('dark-mode-preferred');
        else body.classList.remove('dark-mode-preferred');
    }

    function button() {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'theme-toggle';
        sync(b);
        b.addEventListener('click', function() {
            var p = pref();
            var next = p === 'dark' ? 'light' : 'dark';
            setPref(next);
            apply();
            sync(b);
        });
        return b;
    }

    function sync(b) {
        var dark = pref() === 'dark';
        b.setAttribute('aria-pressed', dark ? 'true' : 'false');
        b.textContent = dark ? '\u2600 Світла тема' : '\u263E Темна тема';
    }

    function mountButtons() {
        document.querySelectorAll('.side-theme, .footer-theme').forEach(function(c) {
            if (c.querySelector('.theme-toggle')) return;
            c.appendChild(button());
        });
    }

    window.USLTheme = {
        pref: pref,
        apply: apply,
        isManual: function() { return pref() !== 'auto'; },
        button: button
    };

    function boot() {
        apply();
        mountButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
