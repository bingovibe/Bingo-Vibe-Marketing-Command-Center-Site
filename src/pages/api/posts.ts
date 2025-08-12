
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  switch (req.method) {
    case 'GET':
      try {
        const { status, platform, limit = '50' } = req.query

        const where: any = { userId: user.id }
        if (status) where.status = status
        if (platform) where.platform = platform

        const posts = await prisma.post.findMany({
          where,
          include: {
            character: true,
            campaign: true,
            metrics: true
          },
          orderBy: [
            { scheduledAt: 'desc' },
            { publishedAt: 'desc' },
            { createdAt: 'desc' }
          ],
          take: parseInt(limit as string)
        })
        
        res.status(200).json(posts)
      } catch (error) {
        console.error('Error fetching posts:', error)
        res.status(500).json({ error: 'Failed to fetch posts' })
      }
      break

    case 'POST':
      try {
        const { title, content, platform, contentType, characterId, campaignId, scheduledAt, draftId } = req.body
        
        if (!title || !content || !platform || !contentType) {
          return res.status(400).json({ error: 'Missing required fields' })
        }

        const post = await prisma.post.create({
          data: {
            title,
            content,
            platform,
            contentType,
            userId: user.id,
            characterId: characterId || null,
            campaignId: campaignId || null,
            draftId: draftId || null,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            status: scheduledAt ? 'SCHEDULED' : 'PUBLISHED',
            publishedAt: !scheduledAt ? new Date() : null
          },
          include: {
            character: true,
            campaign: true,
            metrics: true
          }
        })

        // If this post was created from a draft, update the draft status
        if (draftId) {
          await prisma.draft.update({
            where: { id: draftId },
            data: { status: 'PUBLISHED' }
          })
        }

        res.status(201).json(post)
      } catch (error) {
        console.error('Error creating post:', error)
        res.status(500).json({ error: 'Failed to create post' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
