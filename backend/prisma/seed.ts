import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample themenpakete
  const themenpakete = [
    {
      title: 'Konstruktives Feedback geben',
      description:
        'Lernen Sie, wie Sie Feedback so formulieren, dass es motiviert und weiterbringt. Entwickeln Sie Ihre Feedbackkultur.',
      category: 'Kommunikation',
      duration: 14,
      unitsPerDay: 2,
    },
    {
      title: 'Konflikte im Team lösen',
      description:
        'Konflikte professionell lösen und als Mediator zwischen Teammitgliedern agieren. Praxisnahe Techniken für den Arbeitsalltag.',
      category: 'Konfliktmanagement',
      duration: 14,
      unitsPerDay: 2,
    },
    {
      title: 'Effektiv delegieren',
      description:
        'Lernen Sie, Aufgaben strategisch zu delegieren, Mitarbeiter zu entwickeln und sich auf Ihre wichtigsten Führungsaufgaben zu konzentrieren.',
      category: 'Delegation',
      duration: 14,
      unitsPerDay: 2,
    },
    {
      title: 'Mitarbeiter motivieren',
      description:
        'Verstehen Sie, was Ihre Mitarbeiter antreibt und lernen Sie praxiserprobte Methoden, um intrinsische Motivation zu fördern.',
      category: 'Motivation',
      duration: 14,
      unitsPerDay: 2,
    },
    {
      title: 'Schwierige Gespräche führen',
      description:
        'Meistern Sie herausfordernde Mitarbeitergespräche - von Kritik über Kündigungen bis zu Leistungsproblemen.',
      category: 'Kommunikation',
      duration: 14,
      unitsPerDay: 2,
    },
    {
      title: 'Agile Führung',
      description:
        'Führen Sie in agilen Umgebungen erfolgreich. Scrum, Kanban und moderne Führungsansätze für dynamische Teams.',
      category: 'Agilität',
      duration: 14,
      unitsPerDay: 2,
    },
    {
      title: 'Resilienz aufbauen',
      description:
        'Stärken Sie Ihre psychische Widerstandskraft und lernen Sie, mit Stress und Herausforderungen umzugehen.',
      category: 'Persönlichkeitsentwicklung',
      duration: 14,
      unitsPerDay: 2,
    },
    {
      title: 'Effektives Zeitmanagement',
      description:
        'Optimieren Sie Ihre Zeit, setzen Sie Prioritäten richtig und erreichen Sie mehr mit weniger Stress.',
      category: 'Produktivität',
      duration: 14,
      unitsPerDay: 2,
    },
    {
      title: 'Design Thinking für Führungskräfte',
      description:
        'Innovative Problemlösungen entwickeln mit der Design-Thinking-Methode. Praxisnah und umsetzbar.',
      category: 'Innovation',
      duration: 14,
      unitsPerDay: 2,
    },
    {
      title: 'Remote Teams führen',
      description:
        'Erfolgreiche Führung verteilter Teams. Kommunikation, Vertrauen und Produktivität im Home-Office.',
      category: 'Remote Leadership',
      duration: 14,
      unitsPerDay: 2,
    },
    {
      title: 'Change Management',
      description:
        'Veränderungsprozesse erfolgreich gestalten und Ihr Team durch Transformationen führen.',
      category: 'Veränderung',
      duration: 14,
      unitsPerDay: 2,
    },
    {
      title: 'Strategisches Denken entwickeln',
      description:
        'Erweitern Sie Ihren strategischen Horizont und treffen Sie bessere langfristige Entscheidungen.',
      category: 'Strategie',
      duration: 14,
      unitsPerDay: 2,
    },
  ];

  for (const tp of themenpakete) {
    await prisma.themenPaket.create({
      data: tp,
    });
    console.log(`✅ Created themenpaket: ${tp.title}`);
  }

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
