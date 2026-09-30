const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_XpQag0NjqD7M@ep-dark-moon-b2i14svk-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require'
});

(async () => {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
    console.log('Existing tables:', res.rows.map(r => r.table_name));

    // Check columns of subscriptions
    const subCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subscriptions' ORDER BY ordinal_position;");
    console.log('\nSubscriptions columns:', subCols.rows);

    // Check columns of billing_events
    const beCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'billing_events' ORDER BY ordinal_position;");
    console.log('\nbilling_events columns:', beCols.rows);

    // Check columns of workspaces
    const wsCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workspaces' ORDER BY ordinal_position;");
    console.log('\nworkspaces columns:', wsCols.rows);
  } catch(err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
})();
