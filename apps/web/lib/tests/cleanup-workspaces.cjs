const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_XpQag0NjqD7M@ep-dark-moon-b2i14svk-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require'
});

(async () => {
  try {
    const res = await pool.query("DELETE FROM workspaces WHERE id = 'e0cf3394-b44d-4bc7-abe0-aeae4d2f5e94'");
    console.log('Deleted rows:', res.rowCount);
    const ws = await pool.query("SELECT id, name, owner_id, plan_tier FROM workspaces");
    console.log('Current Workspaces:', ws.rows);
  } catch(err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
})();
