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
      title: 'Konfliktklärung & Mediation',
      description:
        'Konflikte professionell lösen und als Mediator zwischen Teammitgliedern agieren. Praxisnahe Techniken für den Arbeitsalltag.',
      category: 'Konfliktmanagement',
      duration: 14,
      unitsPerDay: 2,
    },
    {
      title: 'OKRs erfolgreich einführen',
      description:
        'Objectives and Key Results (OKRs) verstehen, implementieren und für Ihr Team nutzen. Von der Theorie zur Praxis.',
      category: 'Strategie',
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
  ];

  for (const tp of themenpakete) {
    const themenpaket = await prisma.themenPaket.create({
      data: tp,
    });

    // Create sample learning units
    for (let day = 1; day <= 14; day++) {
      for (let unit = 1; unit <= 2; unit++) {
        await prisma.learningUnit.create({
          data: {
            themenPaketId: themenpaket.id,
            day,
            unitNumber: unit,
            title: `${tp.title} - Tag ${day}, Einheit ${unit}`,
            content: `Dies ist eine Beispiel-Lerneinheit für "${tp.title}".

In dieser Einheit lernen Sie wichtige Konzepte und praktische Anwendungen. Die Inhalte sind speziell für Führungskräfte konzipiert und direkt im Arbeitsalltag einsetzbar.

Kernpunkte dieser Einheit:
• Theoretisches Fundament verstehen
• Praktische Anwendungsbeispiele kennenlernen
• Tools und Techniken erproben
• Best Practices aus der Praxis

Diese Einheit bereitet Sie optimal auf die nächsten Schritte vor.`,
            reflectionTask: `Reflexionsaufgabe zu Tag ${day}, Einheit ${unit}:

Denken Sie über folgende Fragen nach:
1. Wie können Sie die heutigen Erkenntnisse in Ihrem Team umsetzen?
2. Welche Herausforderungen sehen Sie bei der Implementierung?
3. Was ist Ihr erster konkreter Schritt?

Notieren Sie Ihre Gedanken und teilen Sie sie gerne mit Leada GPT.`,
            order: (day - 1) * 2 + unit,
          },
        });
      }
    }

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
