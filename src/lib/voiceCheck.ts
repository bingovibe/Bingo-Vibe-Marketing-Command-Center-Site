
export interface VoiceAnalysis {
  score: number
  issues: string[]
  suggestions: string[]
  character: string
}

interface VoiceRequirement {
  type: string
  description: string
  suggestion: string
}

export class VoiceChecker {
  static analyzeContent(content: string, characterSlug: string): VoiceAnalysis {
    const rules = this.getVoiceRules(characterSlug)
    let score = 100
    const issues: string[] = []
    const suggestions: string[] = []

    // Check for required elements
    rules.required.forEach((requirement: VoiceRequirement) => {
      if (!this.checkRequirement(content, requirement)) {
        score -= 15
        issues.push(`Missing ${requirement.type}: ${requirement.description}`)
        suggestions.push(requirement.suggestion)
      }
    })

    // Check for forbidden elements
    rules.forbidden.forEach((forbidden: VoiceRequirement) => {
      if (this.checkRequirement(content, forbidden)) {
        score -= 10
        issues.push(`Avoid ${forbidden.type}: ${forbidden.description}`)
        suggestions.push(forbidden.suggestion)
      }
    })

    // Check tone consistency
    const toneScore = this.analyzeTone(content, characterSlug)
    score = Math.max(0, score + toneScore - 100)

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
      character: characterSlug
    }
  }

  private static getVoiceRules(characterSlug: string) {
    const rules: Record<string, any> = {
      'zara': {
        required: [
          { type: 'slang', description: 'Gen Z language', suggestion: 'Use phrases like "no cap", "hits different", "slaps", "fire"' },
          { type: 'emoji', description: 'Relevant emojis', suggestion: 'Add gaming/fire/trendy emojis' },
          { type: 'energy', description: 'High energy tone', suggestion: 'Use exclamation points and energetic language' }
        ],
        forbidden: [
          { type: 'formal', description: 'Overly formal language', suggestion: 'Keep it casual and conversational' },
          { type: 'outdated', description: 'Outdated references', suggestion: 'Use current trends and references' }
        ]
      },
      'caven': {
        required: [
          { type: 'relatable', description: 'Dad/parent perspective', suggestion: 'Include family or parenting context' },
          { type: 'humor', description: 'Gentle humor', suggestion: 'Add some dad humor or self-deprecating jokes' },
          { type: 'practical', description: 'Practical benefits', suggestion: 'Mention real benefits for families' }
        ],
        forbidden: [
          { type: 'immature', description: 'Childish language', suggestion: 'Keep tone mature but approachable' }
        ]
      },
      'grandma-rose': {
        required: [
          { type: 'warm', description: 'Warm, nurturing tone', suggestion: 'Use caring, encouraging language' },
          { type: 'wisdom', description: 'Life experience perspective', suggestion: 'Share gentle wisdom or comparisons to past experiences' },
          { type: 'connection', description: 'Focus on relationships', suggestion: 'Emphasize bringing people together' }
        ],
        forbidden: [
          { type: 'slang', description: 'Heavy slang use', suggestion: 'Use more traditional, clear language' },
          { type: 'negative', description: 'Negative tone', suggestion: 'Keep positive and encouraging' }
        ]
      },
      'coach-martinez': {
        required: [
          { type: 'professional', description: 'Professional tone', suggestion: 'Use business-appropriate language' },
          { type: 'results', description: 'Focus on outcomes', suggestion: 'Mention measurable benefits and results' },
          { type: 'leadership', description: 'Leadership perspective', suggestion: 'Include team management insights' }
        ],
        forbidden: [
          { type: 'casual', description: 'Too casual', suggestion: 'Maintain professional demeanor' }
        ]
      },
      'founder': {
        required: [
          { type: 'authentic', description: 'Personal, authentic voice', suggestion: 'Share genuine experiences and insights' },
          { type: 'vision', description: 'Forward-thinking perspective', suggestion: 'Include vision for the future or innovation' },
          { type: 'community', description: 'Community focus', suggestion: 'Emphasize bringing people together' }
        ],
        forbidden: [
          { type: 'corporate', description: 'Corporate speak', suggestion: 'Keep it personal and authentic' }
        ]
      }
    }

    return rules[characterSlug] || rules['founder']
  }

  private static checkRequirement(content: string, requirement: any): boolean {
    const contentLower = content.toLowerCase()
    
    switch (requirement.type) {
      case 'slang':
        return /\b(no cap|hits different|slaps|fire|vibes|periodt|deadass)\b/.test(contentLower)
      case 'emoji':
        return /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/u.test(content)
      case 'energy':
        return content.includes('!') || /\b(amazing|awesome|incredible|fantastic)\b/.test(contentLower)
      case 'relatable':
        return /\b(family|kids|parents|dad|mom|home)\b/.test(contentLower)
      case 'humor':
        return /\b(lol|haha|funny|joke)\b/.test(contentLower) || content.includes('😂') || content.includes('😄')
      case 'practical':
        return /\b(easy|simple|convenient|helpful|useful|benefits)\b/.test(contentLower)
      case 'warm':
        return /\b(love|wonderful|sweet|dear|lovely|heartwarming)\b/.test(contentLower)
      case 'wisdom':
        return /\b(experience|learned|remember|back in|used to|tradition)\b/.test(contentLower)
      case 'connection':
        return /\b(together|family|generations|connect|bond|unite)\b/.test(contentLower)
      case 'professional':
        return /\b(team|business|corporate|professional|leadership|management)\b/.test(contentLower)
      case 'results':
        return /\b(results|success|effective|improve|increase|outcome)\b/.test(contentLower)
      case 'leadership':
        return /\b(lead|manage|guide|inspire|motivate|coach)\b/.test(contentLower)
      case 'authentic':
        return /\b(I|my|personal|experience|journey|story)\b/.test(contentLower)
      case 'vision':
        return /\b(future|innovation|building|creating|vision|dream)\b/.test(contentLower)
      case 'community':
        return /\b(community|people|together|connection|bring|unite)\b/.test(contentLower)
      case 'formal':
        return /\b(therefore|furthermore|consequently|nevertheless)\b/.test(contentLower)
      case 'outdated':
        return /\b(groovy|rad|totally|tubular)\b/.test(contentLower)
      case 'immature':
        return /\b(poopy|silly|dumb|stupid)\b/.test(contentLower)
      case 'negative':
        return /\b(hate|awful|terrible|worst|sucks)\b/.test(contentLower)
      case 'casual':
        return /\b(yo|sup|dude|bro|whatever)\b/.test(contentLower)
      case 'corporate':
        return /\b(synergy|leverage|optimize|streamline|paradigm)\b/.test(contentLower)
      default:
        return false
    }
  }

  private static analyzeTone(content: string, characterSlug: string): number {
    // Simple tone analysis - would be more sophisticated in production
    const wordCount = content.split(/\s+/).length
    let toneScore = 0

    // Adjust based on character expectations
    if (characterSlug === 'zara' && content.includes('!')) toneScore += 10
    if (characterSlug === 'grandma-rose' && /\b(love|wonderful|sweet)\b/.test(content.toLowerCase())) toneScore += 10
    if (characterSlug === 'coach-martinez' && /\b(team|professional)\b/.test(content.toLowerCase())) toneScore += 10

    // Length considerations
    if (wordCount < 10) toneScore -= 5
    if (wordCount > 100 && characterSlug === 'zara') toneScore -= 5

    return toneScore
  }
}

// Export the function that the API endpoint expects
export interface VoiceCheckResult {
  score: number
  feedback: string
  suggestions: string[]
}

export function checkVoiceConsistency(content: string, character: any): VoiceCheckResult {
  const analysis = VoiceChecker.analyzeContent(content, character.slug)
  
  let feedback = ''
  if (analysis.score >= 80) {
    feedback = 'Excellent voice consistency! This content perfectly matches the character\'s style.'
  } else if (analysis.score >= 60) {
    feedback = 'Good voice consistency with some minor adjustments needed.'
  } else if (analysis.score >= 40) {
    feedback = 'Moderate voice consistency. Several adjustments recommended.'
  } else {
    feedback = 'Voice consistency needs significant improvement.'
  }
  
  return {
    score: analysis.score,
    feedback: feedback,
    suggestions: analysis.suggestions
  }
}
