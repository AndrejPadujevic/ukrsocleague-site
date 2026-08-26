/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Theme system: auto, light, dark, black, contrast-light, contrast-dark
 * Body classes: dark-mode-preferred, black-mode, contrast-mode
 */
(function() {
    'use strict';

    var KEY = 'usl-theme';
    var THEMES = [
        { id: 'auto',          label: 'Автоматично', icon: '◑' },
        { id: 'light',         label: 'Світла',      icon: '☀' },
        { id: 'dark',          label: 'Темна',       icon: '☾' },
        { id: 'black',         label: 'Чорна (AMOLED)', icon: '●' },
        { id: 'contrast-light', label: 'Контрастна світла', icon: '⊞' },
        { id: 'contrast-dark',  label: 'Контрастна темна', icon: '⊞' }
    ];

    function pref() {
        try {
            var v = localStorage.getItem(KEY);
            if (THEMES.some(function(t) { return t.id === v; })) return v;
            return 'auto';
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
        var isDark, isBlack, isContrast;

        body.classList.remove('dark-mode-preferred', 'black-mode', 'contrast-mode');

        if (p === 'auto') {
            isDark = systemDark();
            isBlack = false;
            isContrast = false;
        } else if (p === 'dark') {
            isDark = true; isBlack = false; isContrast = false;
        } else if (p === 'black') {
            isDark = true; isBlack = true; isContrast = false;
        } else if (p === 'contrast-light') {
            isDark = false; isBlack = false; isContrast = true;
        } else if (p === 'contrast-dark') {
            isDark = true; isBlack = false; isContrast = true;
        } else {
            isDark = false; isBlack = false; isContrast = false;
        }

        if (isDark) body.classList.add('dark-mode-preferred');
        if (isBlack) body.classList.add('black-mode');
        if (isContrast) body.classList.add('contrast-mode');
    }

    function currentLabel() {
        var p = pref();
        for (var i = 0; i < THEMES.length; i++) {
            if (THEMES[i].id === p) return THEMES[i].icon + ' ' + THEMES[i].label;
        }
        return '◑ Автоматично';
    }

    function createDropdown() {
        var wrapper = document.createElement('div');
        wrapper.className = 'theme-dropdown-wrapper';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'theme-toggle';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-haspopup', 'listbox');
        btn.setAttribute('aria-label', 'Тема оформлення');
        btn.textContent = currentLabel();

        var dropdown = document.createElement('div');
        dropdown.className = 'theme-dropdown';
        dropdown.setAttribute('role', 'listbox');
        dropdown.setAttribute('aria-label', 'Оберіть тему');

        THEMES.forEach(function(theme) {
            var opt = document.createElement('button');
            opt.type = 'button';
            opt.className = 'theme-option' + (pref() === theme.id ? ' active' : '');
            opt.setAttribute('role', 'option');
            opt.setAttribute('data-theme', theme.id);
            opt.innerHTML = '<span class="theme-option-icon">' + theme.icon + '</span><span class="theme-option-label">' + theme.label + '</span>';
            dropdown.appendChild(opt);
        });

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = dropdown.classList.contains('open');
            if (isOpen) {
                dropdown.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            } else {
                dropdown.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });

        dropdown.addEventListener('click', function(e) {
            var opt = e.target.closest('.theme-option');
            if (opt) {
                var themeId = opt.getAttribute('data-theme');
                setPref(themeId);
                apply();
                syncDropdown(dropdown, btn);
                dropdown.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target)) {
                dropdown.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dropdown.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            }
        });

        wrapper.appendChild(btn);
        wrapper.appendChild(dropdown);
        return wrapper;
    }

    function syncDropdown(dropdown, btn) {
        var p = pref();
        dropdown.querySelectorAll('.theme-option').forEach(function(opt) {
            opt.classList.toggle('active', opt.getAttribute('data-theme') === p);
        });
        btn.textContent = currentLabel();
    }

    function mountDropdowns() {
        document.querySelectorAll('.side-theme, .footer-theme').forEach(function(c) {
            if (c.querySelector('.theme-dropdown-wrapper')) return;
            c.appendChild(createDropdown());
        });
    }

    window.USLTheme = {
        pref: pref,
        apply: apply,
        isManual: function() { return pref() !== 'auto'; },
        THEMES: THEMES
    };

    function boot() {
        apply();
        mountDropdowns();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
