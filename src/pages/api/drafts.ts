
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
        const drafts = await prisma.draft.findMany({
          where: { userId: user.id },
          include: {
            character: true,
            campaign: true,
            approvals: {
              include: {
                reviewer: {
                  select: { id: true, username: true, email: true }
                }
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        })
        
        res.status(200).json(drafts)
      } catch (error) {
        console.error('Error fetching drafts:', error)
        res.status(500).json({ error: 'Failed to fetch drafts' })
      }
      break

    case 'POST':
      try {
        const { title, content, platform, contentType, characterId, campaignId, scheduledAt } = req.body
        
        if (!title || !content || !platform || !contentType) {
          return res.status(400).json({ error: 'Missing required fields' })
        }

        const draft = await prisma.draft.create({
          data: {
            title,
            content,
            platform,
            contentType,
            userId: user.id,
            characterId: characterId || null,
            campaignId: campaignId || null,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            status: 'DRAFT'
          },
          include: {
            character: true,
            campaign: true
          }
        })

        res.status(201).json(draft)
      } catch (error) {
        console.error('Error creating draft:', error)
        res.status(500).json({ error: 'Failed to create draft' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
