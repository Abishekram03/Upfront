const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_XpQag0NjqD7M@ep-dark-moon-b2i14svk-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require'
});

(async () => {
  try {
    const updateRes = await pool.query(`
      UPDATE workspaces 
      SET onboarding_completed = TRUE, onboarding_step = 'completed'
      WHERE EXISTS (SELECT 1 FROM sites WHERE sites.workspace_id = workspaces.id OR sites.user_id = workspaces.owner_id)
         OR plan_tier != 'free'
         OR EXISTS (SELECT 1 FROM subscriptions WHERE subscriptions.workspace_id = workspaces.id);
    `);
    console.log('Updated workspaces count:', updateRes.rowCount);
    const rows = await pool.query('SELECT id, name, owner_id, onboarding_completed, onboarding_step, plan_tier FROM workspaces');
    console.log('Workspaces state in DB:');
    rows.rows.forEach(r => console.log(`  ${r.name} (${r.id}) -> completed=${r.onboarding_completed}, step=${r.onboarding_step}, plan=${r.plan_tier}`));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
})();
