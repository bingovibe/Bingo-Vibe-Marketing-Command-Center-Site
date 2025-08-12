
import { Character } from '@prisma/client'

export interface ContentTemplate {
  title: string
  content: string
  hashtags: string[]
  callToAction: string
}

export class ContentGenerator {
  static generateForCharacter(
    character: Character,
    platform: string,
    contentType: string,
    topic?: string
  ): ContentTemplate {
    const templates = this.getTemplatesForCharacter(character.slug)
    const platformTemplates = templates[platform.toLowerCase()] || templates.default
    
    const baseTemplate = platformTemplates[Math.floor(Math.random() * platformTemplates.length)]
    
    return {
      title: this.generateTitle(character, platform, topic),
      content: this.personalizeContent(baseTemplate.content, character, topic),
      hashtags: this.generateHashtags(platform, character.slug, topic),
      callToAction: this.generateCTA(platform, character.slug)
    }
  }

  private static getTemplatesForCharacter(characterSlug: string) {
    const templates: Record<string, any> = {
      'zara': {
        tiktok: [
          { content: "POV: You found the perfect bingo game that actually slaps 🔥 477 TRILLION different boards?! The math is mathing 📊 Who's ready to get competitive? 🎮" },
          { content: "This bingo game really hits different when you can customize EVERYTHING ✨ Entry fees, host controls, infinite variety... we love to see it! 💯" }
        ],
        instagram: [
          { content: "Okay but this bingo game is actually fire 🔥 Perfect for when you want something fun but not too intense. The vibes are immaculate ✨" }
        ],
        default: [
          { content: "This bingo game is actually amazing! Perfect mix of classic and modern gaming. The customization options are incredible!" }
        ]
      },
      'caven': {
        facebook: [
          { content: "Finally found a game the whole family can enjoy! From my 8-year-old to my parents, everyone had a blast. The premium upgrade is worth every penny for the extra features." }
        ],
        instagram: [
          { content: "Family game night just got an upgrade! This bingo game keeps everyone engaged without the usual chaos. Dad win! 🏆" }
        ],
        default: [
          { content: "Perfect family game! Easy to learn, fun for all ages, and the host controls make it easy to manage with kids." }
        ]
      },
      'grandma-rose': {
        facebook: [
          { content: "What a delightful way to bring the generations together! My grandchildren taught me to play online, and now it's our weekly tradition. Technology can be wonderful when it connects us." }
        ],
        default: [
          { content: "Such a lovely game that brings families together. Reminds me of the old church bingo nights, but with a modern twist that even the grandkids enjoy!" }
        ]
      },
      'coach-martinez': {
        linkedin: [
          { content: "Impressive team-building tool! Used this for our quarterly meeting icebreaker. The engagement was off the charts, and it sparked great conversations afterward. Highly recommend for corporate events." }
        ],
        default: [
          { content: "Excellent for team building and corporate events. The customization options allow you to tailor the experience perfectly for your group." }
        ]
      },
      'founder': {
        default: [
          { content: "Building something that brings people together has been the most rewarding journey. Seeing families, friends, and colleagues connect over our game never gets old. 477 trillion possibilities and counting!" }
        ]
      }
    }

    return templates[characterSlug] || templates.default
  }

  private static generateTitle(character: Character, platform: string, topic?: string): string {
    const titles = {
      zara: [`${topic || 'Bingo'} hits different 🔥`, `This ${topic || 'game'} is actually fire ✨`],
      caven: [`Perfect ${topic || 'family game'} night solution!`, `${topic || 'Game'} night success story`],
      'grandma-rose': [`Bringing families together with ${topic || 'bingo'}`, `Sweet ${topic || 'gaming'} memories`],
      'coach-martinez': [`${topic || 'Team building'} game changer`, `Professional ${topic || 'engagement'} tool`],
      founder: [`Building ${topic || 'connections'} one game at a time`, `The story behind ${topic || 'Bingo Vibe'}`]
    }

    const characterTitles = titles[character.slug as keyof typeof titles] || titles.founder
    return characterTitles[Math.floor(Math.random() * characterTitles.length)]
  }

  private static personalizeContent(baseContent: string, character: Character, topic?: string): string {
    // Simple placeholder replacement
    return baseContent
      .replace(/\{topic\}/g, topic || 'bingo')
      .replace(/\{character\}/g, character.name)
  }

  private static generateHashtags(platform: string, characterSlug: string, topic?: string): string[] {
    const baseHashtags = ['#BingoVibe', '#FamilyFun', '#GameNight']
    const characterHashtags = {
      zara: ['#Gaming', '#GenZ', '#Trending', '#Viral'],
      caven: ['#FamilyTime', '#DadLife', '#Parenting', '#FamilyGames'],
      'grandma-rose': ['#Family', '#Generations', '#Tradition', '#Connection'],
      'coach-martinez': ['#TeamBuilding', '#Corporate', '#Leadership', '#Engagement'],
      founder: ['#Entrepreneurship', '#Startup', '#Innovation', '#Community']
    }

    const platformHashtags = {
      tiktok: ['#TikTokMadeMeBuyIt', '#ForYou', '#Fyp'],
      instagram: ['#InstaGood', '#Fun', '#Share'],
      facebook: ['#Community', '#Social'],
      youtube: ['#Subscribe', '#Gaming', '#Tutorial']
    }

    return [
      ...baseHashtags,
      ...(characterHashtags[characterSlug as keyof typeof characterHashtags] || []),
      ...(platformHashtags[platform.toLowerCase() as keyof typeof platformHashtags] || [])
    ].slice(0, 8) // Limit to 8 hashtags
  }

  private static generateCTA(platform: string, characterSlug: string): string {
    const ctas = {
      tiktok: ["Try it now! Link in bio 🔗", "Tag someone who needs this! 👇"],
      instagram: ["Swipe up to play! ⬆️", "Link in bio! 🔗"],
      facebook: ["Try Bingo Vibe today!", "Share with your family!"],
      youtube: ["Subscribe for more gaming content!", "Try the game linked below!"]
    }

    const platformCtas = ctas[platform.toLowerCase() as keyof typeof ctas] || ctas.facebook
    return platformCtas[Math.floor(Math.random() * platformCtas.length)]
  }

  static generateBingoContent(scenario: string): ContentTemplate {
    const scenarios = {
      'family-night': {
        title: 'Perfect Family Game Night',
        content: 'Discovered the secret to a successful family game night: Bingo Vibe! With 477 trillion unique boards, no two games are the same. The kids love the excitement, parents appreciate the simplicity, and grandparents feel right at home. Premium features like custom entry fees (1-10 points) make it even more engaging!',
        hashtags: ['#FamilyNight', '#BingoVibe', '#FamilyFun', '#GameNight', '#AllAges'],
        callToAction: 'Start your family tradition at bingovibe.app!'
      },
      'corporate-team': {
        title: 'Team Building Revolution',
        content: 'Just used Bingo Vibe for our corporate team building session - game changer! The host controls make it perfect for managing large groups, and the infinite board variety kept everyone engaged. Even our remote team members joined in seamlessly.',
        hashtags: ['#TeamBuilding', '#Corporate', '#BingoVibe', '#EmployeeEngagement', '#RemoteTeam'],
        callToAction: 'Elevate your next team event at bingovibe.app!'
      }
    }

    return scenarios[scenario as keyof typeof scenarios] || scenarios['family-night']
  }
}

// Export the function that the API endpoint expects
export interface ContentGenerationOptions {
  character: Character
  platform: string
  contentType: string
  prompt: string
  tone?: string
  targetAudience?: string
  includeTrending?: boolean
}

export interface GeneratedContentResult {
  content: string
  title: string
  hashtags: string[]
  callToAction: string
  optimizations: {
    platform: string
    contentType: string
    estimatedReach?: number
    bestTimeToPost?: string
  }
}

export async function generateContentForCharacter(options: ContentGenerationOptions): Promise<GeneratedContentResult> {
  const { character, platform, contentType, prompt, tone, targetAudience, includeTrending } = options
  
  // Generate base content using existing ContentGenerator
  const baseContent = ContentGenerator.generateForCharacter(character, platform, contentType, prompt)
  
  // Add platform-specific optimizations
  const optimizations = generatePlatformOptimizations(platform, contentType)
  
  // Add trending elements if requested
  if (includeTrending) {
    baseContent.hashtags = [...baseContent.hashtags, ...getTrendingHashtags(platform)]
  }
  
  return {
    content: baseContent.content,
    title: baseContent.title,
    hashtags: baseContent.hashtags,
    callToAction: baseContent.callToAction,
    optimizations
  }
}

function generatePlatformOptimizations(platform: string, contentType: string) {
  const optimizations: Record<string, any> = {
    'TIKTOK': {
      platform: 'TikTok',
      contentType,
      estimatedReach: Math.floor(Math.random() * 10000) + 1000,
      bestTimeToPost: '6-9 PM',
      tips: ['Use trending sounds', 'Keep it under 60 seconds', 'Hook viewers in first 3 seconds']
    },
    'INSTAGRAM': {
      platform: 'Instagram',
      contentType,
      estimatedReach: Math.floor(Math.random() * 5000) + 500,
      bestTimeToPost: '11 AM - 1 PM, 5-7 PM',
      tips: ['Use high-quality visuals', 'Optimize for mobile', 'Include story polls']
    },
    'YOUTUBE': {
      platform: 'YouTube',
      contentType,
      estimatedReach: Math.floor(Math.random() * 2000) + 100,
      bestTimeToPost: '2-4 PM, 6-9 PM',
      tips: ['Optimize title for SEO', 'Create compelling thumbnail', 'Add chapters']
    },
    'FACEBOOK': {
      platform: 'Facebook',
      contentType,
      estimatedReach: Math.floor(Math.random() * 3000) + 200,
      bestTimeToPost: '9 AM, 1-3 PM',
      tips: ['Focus on community building', 'Use native video', 'Encourage comments']
    }
  }
  
  return optimizations[platform.toUpperCase()] || optimizations['FACEBOOK']
}

function getTrendingHashtags(platform: string): string[] {
  const trending: Record<string, string[]> = {
    'TIKTOK': ['#ForYou', '#Viral', '#Trending', '#MustTry'],
    'INSTAGRAM': ['#Trending', '#Viral', '#MustSee', '#ShareThis'],
    'YOUTUBE': ['#Trending', '#MustWatch', '#ShareThis'],
    'FACEBOOK': ['#Trending', '#ShareWithFriends', '#MustTry']
  }
  
  return trending[platform.toUpperCase()] || trending['FACEBOOK']
}
