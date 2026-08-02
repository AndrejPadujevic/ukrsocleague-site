/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Article renderer: fetch article by slug from Supabase and render Markdown as HTML
 */
(function() {
    'use strict';

    var supabase = null;

    // Initialize Supabase
    function initSupabase() {
        if (!window.USL_CONFIG || !window.USL_CONFIG.SUPABASE_URL || !window.USL_CONFIG.SUPABASE_ANON_KEY) {
            console.error('Supabase not configured');
            return null;
        }

        if (window.supabase) {
            supabase = window.supabase.createClient(
                window.USL_CONFIG.SUPABASE_URL,
                window.USL_CONFIG.SUPABASE_ANON_KEY
            );
        } else {
            console.error('Supabase client not loaded');
        }
        return supabase;
    }

    // Format date
    function formatDate(dateStr) {
        var date = new Date(dateStr);
        return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Escape HTML
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Get slug from URL
    function getSlugFromUrl() {
        var path = window.location.pathname;
        var match = path.match(/\/article\/([^\/]+)\.htm/);
        return match ? match[1] : null;
    }

    // Render article
    function renderArticle() {
        if (!supabase) {
            showError('Supabase не налаштовано');
            return;
        }

        var slug = getSlugFromUrl();
        if (!slug) {
            showError('Невірний URL статті');
            return;
        }

        supabase
            .from('articles')
            .select('*')
            .eq('slug', slug)
            .eq('published', true)
            .single()
            .then(function(result) {
                if (result.error || !result.data) {
                    showError('Статтю не знайдено');
                    return;
                }

                var article = result.data;
                
                // Update meta tags
                document.title = escapeHtml(article.title) + ' | Українська Соціалістична Ліга';
                document.querySelector('meta[name="description"]').setAttribute('content', escapeHtml(article.description || ''));
                document.querySelector('meta[property="og:title"]').setAttribute('content', escapeHtml(article.title));
                document.querySelector('meta[property="og:description"]').setAttribute('content', escapeHtml(article.description || ''));
                document.querySelector('meta[property="og:image"]').setAttribute('content', escapeHtml(article.image_url || 'https://ukrsocleague.org/pictures/preview.jpg'));
                document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href);
                document.querySelector('meta[name="twitter:title"]').setAttribute('content', escapeHtml(article.title));
                document.querySelector('meta[name="twitter:description"]').setAttribute('content', escapeHtml(article.description || ''));

                // Render article content
                var articleContent = document.getElementById('article-content');
                var imageUrl = article.image_url || 'pictures/preview.jpg';
                var imageWebp = imageUrl.replace(/\.(jpg|png)$/i, '.webp');
                var markdownHtml = window.marked ? window.marked.parse(article.content) : article.content;

                var html = '' +
                    '<div class="article-header-simple">' +
                    (article.tag ? '<span class="tag">' + escapeHtml(article.tag) + '</span>' : '') +
                    '<div class="article-meta">' +
                    '<span>Опубліковано: ' + formatDate(article.created_at) + '</span>' +
                    (article.reading_minutes ? ' • <span>' + article.reading_minutes + ' хв читання</span>' : '') +
                    '</div>' +
                    '</div>' +
                    '<h1>' + escapeHtml(article.title) + '</h1>' +
                    (article.image_url ? '<div class="article-image-container"><picture><source type="image/webp" srcset="' + escapeHtml(imageWebp) + '"><img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(article.title) + '"></picture></div>' : '') +
                    '<div class="article-body">' + markdownHtml + '</div>';

                articleContent.innerHTML = html;

                // Hide loading, show content
                document.getElementById('article-loading').style.display = 'none';
                articleContent.style.display = 'block';

                // Initialize reader.js for progress bar
                if (window.Reader && window.Reader.init) {
                    window.Reader.init();
                }
            });
    }

    // Show error
    function showError(message) {
        document.getElementById('article-loading').style.display = 'none';
        var errorDiv = document.getElementById('article-error');
        errorDiv.querySelector('p').textContent = message;
        errorDiv.style.display = 'block';
    }

    // Initialize
    function init() {
        initSupabase();

        // Wait for Supabase client to load
        if (window.supabase) {
            renderArticle();
        } else {
            // Load Supabase from CDN if not available
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = function() {
                initSupabase();
                renderArticle();
            };
            document.head.appendChild(script);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
