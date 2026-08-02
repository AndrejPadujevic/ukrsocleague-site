/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Dynamic articles: load latest 5 articles from Supabase
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

    // Load latest articles
    function loadLatestArticles() {
        if (!supabase) {
            console.log('Supabase not configured, using static articles');
            return;
        }

        var newsGrid = document.querySelector('.news-grid');
        if (!newsGrid) return;

        supabase
            .from('articles')
            .select('*')
            .eq('published', true)
            .order('created_at', { ascending: false })
            .limit(5)
            .then(function(result) {
                if (result.error) {
                    console.error('Error loading articles:', result.error);
                    return;
                }

                var articles = result.data;
                if (articles.length === 0) return;

                var html = articles.map(function(article, index) {
                    var isNew = index < 2;
                    var isFeatured = index === 0;
                    var imageUrl = article.image_url || 'pictures/preview.jpg';
                    var imageWebp = imageUrl.replace(/\.(jpg|png)$/i, '.webp');
                    
                    return '<article class="news-card' + (isFeatured ? ' featured' : '') + '">' +
                        '<a href="/article/' + escapeHtml(article.slug) + '.htm" class="news-link">' +
                        '<div class="news-image">' +
                        '<picture>' +
                        '<source type="image/webp" srcset="' + escapeHtml(imageWebp) + '">' +
                        '<img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(article.title) + '" loading="lazy">' +
                        '</picture>' +
                        (isNew ? '<div class="news-overlay"><span class="news-badge">НОВЕ</span></div>' : '') +
                        '</div>' +
                        '<div class="news-content">' +
                        '<h3>' + escapeHtml(article.title) + '</h3>' +
                        '<p>' + escapeHtml(article.description || '') + '</p>' +
                        '<span class="news-date">' + formatDate(article.created_at) + '</span>' +
                        '</div>' +
                        '</a>' +
                        '</article>';
                }).join('');

                newsGrid.innerHTML = html;
            });
    }

    // Initialize
    function init() {
        // Only run on homepage
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') return;

        initSupabase();
        
        // Wait for Supabase client to load
        if (window.supabase) {
            loadLatestArticles();
        } else {
            // Load Supabase from CDN if not available
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = function() {
                initSupabase();
                loadLatestArticles();
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
