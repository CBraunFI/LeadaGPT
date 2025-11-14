import bcrypt from 'bcrypt';
import prisma from '../config/database';

/**
 * Script to create the first admin user
 * Usage: npx ts-node src/scripts/createAdmin.ts
 */

async function createAdmin() {
  console.log('🔧 Admin-Nutzer erstellen...\n');

  // Admin-Daten - BITTE ANPASSEN!
  const adminData = {
    email: 'admin@leada.de',
    password: 'Admin123!', // Bitte ändern Sie dieses Passwort!
    name: 'System Administrator',
    role: 'superadmin' as const, // 'admin' oder 'superadmin'
  };

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminData.email },
    });

    if (existingAdmin) {
      console.log(`❌ Admin mit Email "${adminData.email}" existiert bereits!`);
      console.log(`   Admin-ID: ${existingAdmin.id}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Rolle: ${existingAdmin.role}`);
      console.log(`   Erstellt am: ${existingAdmin.createdAt}`);
      return;
    }

    // Hash the password
    console.log('🔒 Passwort wird verschlüsselt...');
    const passwordHash = await bcrypt.hash(adminData.password, 10);

    // Create admin user
    console.log('💾 Admin-Nutzer wird angelegt...');
    const admin = await prisma.admin.create({
      data: {
        email: adminData.email,
        passwordHash: passwordHash,
        name: adminData.name,
        role: adminData.role,
        isActive: true,
      },
    });

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
    console.log('\n⚠️  WICHTIG: Ändern Sie das Passwort nach dem ersten Login!');

  } catch (error) {
    console.error('\n❌ Fehler beim Erstellen des Admin-Nutzers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin()
  .then(() => {
    console.log('\n✨ Script beendet');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fehler:', error);
    process.exit(1);
  });
