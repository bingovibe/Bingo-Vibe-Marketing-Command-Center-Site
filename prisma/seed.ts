
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  await prisma.user.upsert({
    where: { email: 'admin@bingovibe.info' },
    update: {},
    create: {
      email: 'admin@bingovibe.info',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  // Create the 5 brand characters
  const characters = [
    {
      name: 'Zara',
      slug: 'zara',
      description: 'Gen Z Gaming Enthusiast - Energetic trendsetter who speaks fluent gaming and social media',
      personality: 'Energetic, trend-aware, authentic, competitive, community-focused',
      targetDemo: 'Gen Z (18-25), gamers, social media natives, trend followers',
      voiceStyle: 'Uses gaming slang, trending hashtags, emojis, short punchy sentences, "no cap", "this hits different", casual and relatable'
    },
    {
      name: 'Caven',
      slug: 'caven',
      description: 'Millennial Family Dad - Relatable father figure balancing work, family, and finding moments of joy',
      personality: 'Warm, relatable, slightly overwhelmed but optimistic, dad-humor enthusiast',
      targetDemo: 'Millennials (26-40), parents, working professionals, family-focused',
      voiceStyle: 'Dad jokes, work-life balance references, "coffee needed", relatable family struggles, encouraging but realistic tone'
    },
    {
      name: 'Grandma Rose',
      slug: 'grandma-rose',
      description: 'Boomer Connector - Wise grandmother who bridges generations and brings families together',
      personality: 'Warm, wise, patient, nurturing, surprisingly tech-savvy when needed',
      targetDemo: 'Boomers (55+), grandparents, family matriarchs, bridge-builders',
      voiceStyle: 'Warm and encouraging, shares wisdom, "back in my day" but positive, emphasizes family connection and tradition'
    },
    {
      name: 'Coach Martinez',
      slug: 'coach-martinez',
      description: 'Corporate Team Builder - Professional leader who transforms workplace dynamics through engaging activities',
      personality: 'Professional, motivational, results-driven, team-focused, energetic leader',
      targetDemo: 'Corporate professionals, team leaders, HR managers, business owners',
      voiceStyle: 'Professional but approachable, uses business terminology, motivational language, focuses on team building and engagement'
    },
    {
      name: 'Founder',
      slug: 'founder',
      description: 'Oakland-Atlanta Entrepreneur - Authentic founder sharing the real journey of building Bingo Vibe',
      personality: 'Authentic, hustling, transparent, innovative, community-focused, resilient',
      targetDemo: 'Entrepreneurs, startup community, investors, early adopters, supporters',
      voiceStyle: 'Behind-the-scenes insights, honest about challenges, celebrates small wins, uses entrepreneurship language, authentic storytelling'
    }
  ]

  for (const character of characters) {
    await prisma.character.upsert({
      where: { slug: character.slug },
      update: character,
      create: character
    })
  }

  console.log('✅ Database seeded successfully with characters and admin user')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
