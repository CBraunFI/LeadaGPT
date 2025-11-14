import bcrypt from 'bcrypt';

/**
 * Simple script to generate a password hash for admin creation
 * Usage: npx ts-node src/scripts/generateAdminPassword.ts
 */

const password = process.argv[2] || 'Admin123!';

async function generateHash() {
  console.log('\n🔒 Passwort-Hash Generator für Admin-Nutzer\n');
  console.log('Passwort:', password);

  const hash = await bcrypt.hash(password, 10);

  console.log('\nGenerierter Hash:');
  console.log(hash);

  console.log('\n📋 SQL-Befehl zum Anlegen des Admin-Nutzers:');
  console.log('(Führen Sie dies in Ihrer Render PostgreSQL-Datenbank aus)\n');

  const sql = `INSERT INTO "Admin" (id, email, "passwordHash", name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@leada.de',
  '${hash}',
  'System Administrator',
  'superadmin',
  true,
  NOW(),
  NOW()
);`;

  console.log(sql);

  console.log('\n✅ Nach dem Ausführen können Sie sich einloggen mit:');
  console.log('   Email: admin@leada.de');
  console.log('   Passwort:', password);
  console.log('\n🌐 Admin-Login URLs:');
  console.log('   Produktion: https://leadagpt-frontend.onrender.com/admin/login');
  console.log('   Lokal: http://localhost:5173/admin/login');
  console.log('\n⚠️  WICHTIG: Ändern Sie das Passwort nach dem ersten Login!\n');
}

generateHash().catch(console.error);
