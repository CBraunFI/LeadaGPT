const { Client } = require('pg');

async function checkAdminTable() {
  const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Verbunden mit Datenbank\n');

    // Check if Admin table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'Admin'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Admin-Tabelle existiert');

      // Count admins
      const countResult = await client.query('SELECT COUNT(*) FROM "Admin"');
      console.log(`   Anzahl Admins: ${countResult.rows[0].count}\n`);

      // List admins
      const admins = await client.query('SELECT id, email, name, role, "isActive" FROM "Admin"');
      console.log('📋 Admin-Nutzer:');
      admins.rows.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.name}) - ${admin.role} - ${admin.isActive ? 'Aktiv' : 'Inaktiv'}`);
      });
    } else {
      console.log('❌ Admin-Tabelle existiert NICHT');
      console.log('   → Prisma-Migration muss noch durchgeführt werden');
      console.log('   → Das passiert automatisch beim nächsten Render-Deploy\n');
    }

    // Check other important tables
    console.log('\n🔍 Weitere Tabellen:');
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`   Anzahl Tabellen: ${tables.rows.length}`);
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await client.end();
  }
}

checkAdminTable().catch(console.error);
