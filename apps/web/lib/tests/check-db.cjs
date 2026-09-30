const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_XpQag0NjqD7M@ep-dark-moon-b2i14svk-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require'
});

(async () => {
  try {
    // Step 1: Add plan_tier column if missing
    console.log('=== Step 1: Adding plan_tier column ===');
    await pool.query(`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(50) NOT NULL DEFAULT 'free'`);
    console.log('✅ plan_tier column added/verified');

    // Step 2: Verify columns exist now
    console.log('\n=== Step 2: Verify workspaces columns ===');
    const cols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workspaces' ORDER BY ordinal_position"
    );
    cols.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ')'));

    // Step 3: Show current workspaces with plan_tier
    console.log('\n=== Step 3: Workspaces with plan_tier ===');
    const ws = await pool.query('SELECT id, name, plan_tier FROM workspaces');
    ws.rows.forEach(r => console.log('  ' + r.name + ' -> plan_tier=' + r.plan_tier));

    // Step 4: Show subscriptions
    console.log('\n=== Step 4: Subscriptions ===');
    const subs = await pool.query('SELECT * FROM subscriptions');
    if (subs.rows.length === 0) {
      console.log('  (empty - no subscriptions yet, this is expected before first checkout)');
    } else {
      subs.rows.forEach(r => console.log('  workspace=' + r.workspace_id + ' plan=' + r.plan + ' status=' + r.status));
    }

    console.log('\n✅ Database is now ready for billing!');
  } catch(e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
})();
