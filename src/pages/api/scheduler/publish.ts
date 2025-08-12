
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { publishToSocialMedia } from '../../../lib/scheduler'

const prisma = new PrismaClient()

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
    const { postId } = req.body
    
    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' })
    }

    // Get the post with all related data
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        character: true,
        campaign: true,
        user: true
      }
    })

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Verify user has permission to publish this post
    if (post.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check if post is already published
    if (post.status === 'PUBLISHED') {
      return res.status(400).json({ error: 'Post is already published' })
    }

    // Check if post is scheduled for the future
    if (post.scheduledAt && post.scheduledAt > new Date()) {
      return res.status(400).json({ error: 'Cannot publish future-scheduled post manually' })
    }

    try {
      // Attempt to publish to social media platform
      const publishResult = await publishToSocialMedia(post)

      if (publishResult.success) {
        // Update post status to published
        const updatedPost = await prisma.post.update({
          where: { id: postId },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date()
          },
          include: {
            character: true,
            campaign: true
          }
        })

        // Create initial metrics record
        await prisma.postMetric.create({
          data: {
            postId: postId,
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            clicks: 0,
            conversions: 0,
            reach: 0,
            impressions: 0
          }
        })

        res.status(200).json({
          success: true,
          post: updatedPost,
          publishResult: {
            platform: post.platform,
            platformPostId: publishResult.platformPostId,
            publishedAt: updatedPost.publishedAt
          }
        })
      } else {
        // Update post status to failed
        await prisma.post.update({
          where: { id: postId },
          data: { status: 'FAILED' }
        })

        res.status(400).json({
          success: false,
          error: 'Failed to publish to social media',
          details: publishResult.error
        })
      }
    } catch (publishError) {
      console.error('Publishing error:', publishError)
      
      // Update post status to failed
      await prisma.post.update({
        where: { id: postId },
        data: { status: 'FAILED' }
      })

      res.status(500).json({
        success: false,
        error: 'Publishing failed due to system error',
        details: process.env.NODE_ENV === 'development' ? (publishError instanceof Error ? publishError.message : String(publishError)) : undefined
      })
    }

  } catch (error) {
    console.error('Error in publish endpoint:', error)
    res.status(500).json({ 
      error: 'Failed to publish post',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    })
  }
}
