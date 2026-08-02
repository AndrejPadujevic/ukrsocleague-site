/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Engagement: newsletter signup (footer) + anonymous feedback widget.
 * Re-runnable (SPA-safe): call window.Engagement.init() after content swaps.
 */
(function() {
    'use strict';

    function bindNewsletter() {
        var form = document.querySelector('.newsletter-form');
        if (!form || form.dataset.bound) return;
        form.dataset.bound = '1';
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var hp = form.querySelector('.newsletter-hp');
            if (hp && hp.value) return;
            var email = form.querySelector('.newsletter-email');
            var msg = form.querySelector('.newsletter-msg');
            var btn = form.querySelector('.newsletter-submit');
            var val = email ? email.value.trim() : '';
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) {
                if (msg) { msg.textContent = 'Введіть коректну email-адресу.'; msg.className = 'newsletter-msg error'; }
                return;
            }
            if (btn) { btn.disabled = true; btn.textContent = 'Надсилаємо…'; }
            window.SB.subscribe(val).then(function() {
                if (email) email.value = '';
                if (msg) { msg.textContent = 'Дякуємо! Ви підписані на розсилку УСЛ.'; msg.className = 'newsletter-msg ok'; }
            }).catch(function() {
                if (msg) { msg.textContent = 'Не вдалося підписатися. Спробуйте пізніше.'; msg.className = 'newsletter-msg error'; }
            }).finally(function() {
                if (btn) { btn.disabled = false; btn.textContent = 'Підписатися'; }
            });
        });
    }

    function feedbackWidget() {
        var main = document.querySelector('main.article-page article, main.article-page .article-content-simple');
        if (!main) return;
        var old = document.getElementById('feedback-widget');
        if (old && old.parentNode) old.parentNode.removeChild(old);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'feedback-widget';
        btn.className = 'feedback-btn';
        btn.textContent = 'Повідомити про помилку';
        main.appendChild(btn);

        btn.addEventListener('click', function() {
            var modal = document.getElementById('feedback-modal');
            if (!modal) modal = buildFeedbackModal();
            modal.classList.add('open');
            var msg = modal.querySelector('.feedback-msg');
            if (msg) { msg.textContent = ''; msg.className = 'feedback-msg'; }
            var kind = modal.querySelector('#feedback-kind');
            if (kind) kind.value = 'other';
            var ta = modal.querySelector('#feedback-message');
            if (ta) ta.value = '';
        });
    }

    function buildFeedbackModal() {
        var m = document.createElement('div');
        m.className = 'login-modal feedback-modal';
        m.id = 'feedback-modal';
        m.setAttribute('role', 'dialog');
        m.setAttribute('aria-modal', 'true');
        m.innerHTML =
            '<div class="login-modal-box">' +
            '  <button type="button" class="login-close" id="feedback-close" aria-label="Закрити">&times;</button>' +
            '  <h3>Повідомлення</h3>' +
            '  <select id="feedback-kind" class="feedback-kind">' +
            '    <option value="error">Помилка на сторінці</option>' +
            '    <option value="suggestion">Пропозиція</option>' +
            '    <option value="other">Інше</option>' +
            '  </select>' +
            '  <textarea id="feedback-message" class="feedback-message" rows="4" maxlength="2000" placeholder="Ваше повідомлення…"></textarea>' +
            '  <input type="email" id="feedback-contact" class="feedback-contact" placeholder="Email для відповіді (необов’язково)">' +
            '  <button type="button" id="feedback-send" class="login-submit">Надіслати</button>' +
            '  <p class="feedback-msg" role="status"></p>' +
            '</div>';
        m.addEventListener('click', function(e) { if (e.target === m) closeFeedback(); });
        m.querySelector('#feedback-close').addEventListener('click', closeFeedback);
        m.querySelector('#feedback-send').addEventListener('click', function() {
            var slug = (window.location.pathname.match(/\/([^/]+)\.html?$/i) || [])[1] || '';
            var kind = m.querySelector('#feedback-kind').value;
            var message = m.querySelector('#feedback-message').value.trim();
            var contact = m.querySelector('#feedback-contact').value.trim();
            var msg = m.querySelector('.feedback-msg');
            if (!message) { if (msg) msg.textContent = 'Напишіть повідомлення.'; return; }
            var btn = m.querySelector('#feedback-send');
            btn.disabled = true;
            window.SB.sendFeedback({ article_slug: slug, kind: kind, message: message, contact: contact || null })
                .then(function() {
                    if (msg) { msg.textContent = 'Дякуємо! Повідомлення надіслано.'; msg.className = 'feedback-msg ok'; }
                    m.querySelector('#feedback-message').value = '';
                    m.querySelector('#feedback-contact').value = '';
                })
                .catch(function() {
                    if (msg) { msg.textContent = 'Не вдалося надіслати. Спробуйте пізніше.'; msg.className = 'feedback-msg error'; }
                })
                .finally(function() { btn.disabled = false; });
        });
        document.body.appendChild(m);
        return m;
    }

    function closeFeedback() {
        var m = document.getElementById('feedback-modal');
        if (m) m.classList.remove('open');
    }

    window.Engagement = {
        init: function() {
            bindNewsletter();
            feedbackWidget();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.Engagement.init);
    } else {
        window.Engagement.init();
    }
})();
