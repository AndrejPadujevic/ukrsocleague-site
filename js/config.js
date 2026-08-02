/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Webapp configuration.
 *
 * Setup (once):
 *   1. Create a free Supabase project: https://supabase.com
 *   2. Open SQL Editor and run db/migrations/0001_init.sql
 *   3. Settings → API: copy "Project URL" and the "anon public" key
 *      (never use the service_role key here — it must stay secret).
 *   4. Leave SUPABASE_URL empty to disable all interactive features.
 */
window.USL_CONFIG = {
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    // Instance used by the "Поширити" (Fediverse/Mastodon) button
    FEDIVERSE_INSTANCE: 'https://social.noleron.com'
};
