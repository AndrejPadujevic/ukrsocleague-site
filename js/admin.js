/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Admin panel: password protection + article CRUD with Markdown
 */
(function() {
    'use strict';

    var ADMIN_PASSWORD = 'usl2026'; // Change this in production
    var SESSION_KEY = 'usl-admin-session';
    var supabase = null;

    // Check session
    function isLoggedIn() {
        try {
            return localStorage.getItem(SESSION_KEY) === 'true';
        } catch (e) {
            return false;
        }
    }

    // Login
    function login(password) {
        if (password === ADMIN_PASSWORD) {
            try {
                localStorage.setItem(SESSION_KEY, 'true');
            } catch (e) {}
            showDashboard();
            return true;
        }
        return false;
    }

    // Logout
    function logout() {
        try {
            localStorage.removeItem(SESSION_KEY);
        } catch (e) {}
        showLogin();
    }

    // Show login screen
    function showLogin() {
        document.getElementById('admin-login').style.display = 'block';
        document.getElementById('admin-dashboard').style.display = 'none';
    }

    // Show dashboard
    function showDashboard() {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        loadArticles();
    }

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

    // Load articles from Supabase
    function loadArticles() {
        if (!supabase) {
            document.getElementById('articles-list').innerHTML = '<p class="error">Supabase не налаштовано</p>';
            return;
        }

        supabase
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false })
            .then(function(result) {
                if (result.error) {
                    document.getElementById('articles-list').innerHTML = '<p class="error">Помилка завантаження: ' + result.error.message + '</p>';
                    return;
                }

                var articles = result.data;
                if (articles.length === 0) {
                    document.getElementById('articles-list').innerHTML = '<p>НEMA статей</p>';
                    return;
                }

                var html = articles.map(function(article) {
                    return '<div class="admin-article-item" data-id="' + article.id + '">' +
                        '<div class="article-info">' +
                        '<h3>' + escapeHtml(article.title) + '</h3>' +
                        '<p class="article-meta">Slug: ' + escapeHtml(article.slug) + ' | ' +
                        'Статус: ' + (article.published ? 'Опубліковано' : 'Чернетка') + ' | ' +
                        formatDate(article.created_at) + '</p>' +
                        '</div>' +
                        '<div class="article-actions">' +
                        '<button class="btn-edit" data-id="' + article.id + '">Редагувати</button>' +
                        '<button class="btn-delete" data-id="' + article.id + '">Видалити</button>' +
                        '</div>' +
                        '</div>';
                }).join('');

                document.getElementById('articles-list').innerHTML = html;

                // Add event listeners
                document.querySelectorAll('.btn-edit').forEach(function(btn) {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        editArticle(parseInt(this.getAttribute('data-id')));
                    });
                });

                document.querySelectorAll('.btn-delete').forEach(function(btn) {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        deleteArticle(parseInt(this.getAttribute('data-id')));
                    });
                });
            });
    }

    // Edit article
    function editArticle(id) {
        if (!supabase) return;

        supabase
            .from('articles')
            .select('*')
            .eq('id', id)
            .single()
            .then(function(result) {
                if (result.error) {
                    alert('Помилка завантаження: ' + result.error.message);
                    return;
                }

                var article = result.data;
                document.getElementById('form-title').textContent = 'Редагувати статтю';
                document.getElementById('article-id').value = article.id;
                document.getElementById('article-title').value = article.title;
                document.getElementById('article-slug').value = article.slug;
                document.getElementById('article-description').value = article.description || '';
                document.getElementById('article-tag').value = article.tag || '';
                document.getElementById('article-image').value = article.image_url || '';
                document.getElementById('article-reading').value = article.reading_minutes || '';
                document.getElementById('article-content').value = article.content;

                // Scroll to form
                document.querySelector('.admin-form-section').scrollIntoView({ behavior: 'smooth' });
            });
    }

    // Delete article
    function deleteArticle(id) {
        if (!confirm('Ви впевнені, що хочете видалити цю статтю?')) return;
        if (!supabase) return;

        supabase
            .from('articles')
            .delete()
            .eq('id', id)
            .then(function(result) {
                if (result.error) {
                    alert('Помилка видалення: ' + result.error.message);
                    return;
                }
                loadArticles();
            });
    }

    // Save article
    function saveArticle(e) {
        e.preventDefault();
        if (!supabase) {
            alert('Supabase не налаштовано');
            return;
        }

        var id = document.getElementById('article-id').value;
        var article = {
            title: document.getElementById('article-title').value,
            slug: document.getElementById('article-slug').value,
            description: document.getElementById('article-description').value,
            tag: document.getElementById('article-tag').value,
            image_url: document.getElementById('article-image').value,
            reading_minutes: parseInt(document.getElementById('article-reading').value) || null,
            content: document.getElementById('article-content').value,
            updated_at: new Date().toISOString()
        };

        var promise;
        if (id) {
            // Update
            promise = supabase.from('articles').update(article).eq('id', parseInt(id));
        } else {
            // Insert
            article.published = true;
            promise = supabase.from('articles').insert([article]);
        }

        promise.then(function(result) {
            if (result.error) {
                alert('Помилка збереження: ' + result.error.message);
                return;
            }
            resetForm();
            loadArticles();
        });
    }

    // Reset form
    function resetForm() {
        document.getElementById('form-title').textContent = 'Нова стаття';
        document.getElementById('article-form').reset();
        document.getElementById('article-id').value = '';
    }

    // Helper: escape HTML
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper: format date
    function formatDate(dateStr) {
        var date = new Date(dateStr);
        return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Initialize
    function init() {
        initSupabase();

        // Login form
        document.getElementById('login-form').addEventListener('submit', function(e) {
            e.preventDefault();
            var password = document.getElementById('admin-password').value;
            if (!login(password)) {
                document.getElementById('login-error').textContent = 'Невірний пароль';
            } else {
                document.getElementById('login-error').textContent = '';
                document.getElementById('admin-password').value = '';
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', logout);

        // Article form
        document.getElementById('article-form').addEventListener('submit', saveArticle);
        document.getElementById('cancel-btn').addEventListener('click', resetForm);

        // Check login state
        if (isLoggedIn()) {
            showDashboard();
        } else {
            showLogin();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
