const { Client } = require('pg');
const bcrypt = require('bcrypt');

/**
 * Script to create admin user directly in PostgreSQL database
 * Usage: node src/scripts/createAdminProduction.js <DATABASE_URL>
 */

const adminData = {
  email: 'admin@leada.de',
  password: 'IhrSicheresPasswort2024!',
  name: 'System Administrator',
  role: 'superadmin',
};

async function createAdmin() {
  const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

  if (!databaseUrl || !databaseUrl.startsWith('postgres')) {
    console.error('\n❌ Fehler: Keine gültige PostgreSQL DATABASE_URL angegeben!\n');
    console.log('Verwendung:');
    console.log('  node src/scripts/createAdminProduction.js "postgresql://user:password@host/db"\n');
    console.log('Oder setzen Sie die DATABASE_URL Umgebungsvariable.\n');
    process.exit(1);
  }

  console.log('\n🔧 Verbinde mit Datenbank...\n');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false, // Für Render.com
    },
  });

  try {
    await client.connect();
    console.log('✅ Verbindung hergestellt\n');

    // Check if Admin table exists
    console.log('🔍 Prüfe Admin-Tabelle...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'Admin'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Admin-Tabelle existiert nicht!');
      console.log('   Führen Sie zuerst die Prisma-Migration auf Render aus.');
      console.log('   Das sollte automatisch beim nächsten Deploy passieren.\n');
      process.exit(1);
    }

    // Check if admin already exists
    console.log('🔍 Prüfe ob Admin bereits existiert...');
    const existingAdmin = await client.query(
      'SELECT * FROM "Admin" WHERE email = $1',
      [adminData.email]
    );

    if (existingAdmin.rows.length > 0) {
      console.log(`\n❌ Admin mit Email "${adminData.email}" existiert bereits!`);
      console.log(`   ID: ${existingAdmin.rows[0].id}`);
      console.log(`   Name: ${existingAdmin.rows[0].name}`);
      console.log(`   Rolle: ${existingAdmin.rows[0].role}\n`);
      process.exit(0);
    }

    // Hash password
    console.log('🔒 Verschlüssele Passwort...');
    const passwordHash = await bcrypt.hash(adminData.password, 10);

    // Insert admin
    console.log('💾 Lege Admin-Nutzer an...');
    const result = await client.query(
      `INSERT INTO "Admin" (id, email, "passwordHash", name, role, "isActive", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
       RETURNING *`,
      [adminData.email, passwordHash, adminData.name, adminData.role]
    );

    const admin = result.rows[0];

    console.log('\n✅ Admin-Nutzer erfolgreich erstellt!\n');
    console.log('📋 Login-Daten:');
    console.log('   Email:', admin.email);
    console.log('   Passwort:', adminData.password);
    console.log('   Name:', admin.name);
    console.log('   Rolle:', admin.role);
    console.log('   Admin-ID:', admin.id);
    console.log('\n🌐 Admin-Login:');
    console.log('   Lokal: http://localhost:5173/admin/login');
    console.log('   Produktion: https://leadagpt-frontend.onrender.com/admin/login');
    console.log('\n⚠️  WICHTIG: Ändern Sie das Passwort nach dem ersten Login!\n');

  } catch (error) {
    console.error('\n❌ Fehler:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdmin().catch(console.error);
