const db = require('../src/config/db');

async function inspectPolicies() {
  try {
    const res = await db.query(`
      SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'appointments';
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectPolicies();
