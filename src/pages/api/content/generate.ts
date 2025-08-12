
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

const prisma = new PrismaClient()

// Import our content generation utilities
import { generateContentForCharacter } from '../../../lib/contentGenerators'
import { checkVoiceConsistency } from '../../../lib/voiceCheck'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    return res.status(401).json({ error: 'User not found' })
  }

  try {
    const { 
      characterId, 
      platform, 
      contentType, 
      prompt, 
      tone,
      targetAudience,
      campaignId,
      includeTrending = false
    } = req.body
    
    if (!characterId || !platform || !contentType) {
      return res.status(400).json({ 
        error: 'Character ID, platform, and content type are required' 
      })
    }

    // Get the character details
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    })

    if (!character) {
      return res.status(404).json({ error: 'Character not found' })
    }

    // Verify campaign access if specified
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      })

      if (!campaign || (campaign.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
        return res.status(403).json({ error: 'Invalid campaign or access denied' })
      }
    }

    // Generate content using our utility function
    const generatedContent = await generateContentForCharacter({
      character,
      platform,
      contentType,
      prompt: prompt || `Create ${contentType.toLowerCase()} content for ${platform}`,
      tone: tone || character.voiceStyle,
      targetAudience: targetAudience || character.targetDemo,
      includeTrending
    })

    // Check voice consistency
    const voiceCheck = checkVoiceConsistency(generatedContent.content, character)

    // Prepare the response
    const result = {
      content: generatedContent.content,
      title: generatedContent.title,
      hashtags: generatedContent.hashtags,
      callToAction: generatedContent.callToAction,
      optimizations: generatedContent.optimizations,
      voiceConsistency: {
        score: voiceCheck.score,
        feedback: voiceCheck.feedback,
        suggestions: voiceCheck.suggestions
      },
      character: {
        id: character.id,
        name: character.name,
        slug: character.slug
      },
      generatedFor: {
        platform,
        contentType,
        targetAudience: targetAudience || character.targetDemo
      },
      metadata: {
        generatedAt: new Date(),
        userId: user.id,
        campaignId: campaignId || null
      }
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Error generating content:', error)
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    })
  }
}
