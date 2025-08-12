
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const { id } = req.query

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
        const draft = await prisma.draft.findUnique({
          where: { id: id as string },
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
          }
        })

        if (!draft) {
          return res.status(404).json({ error: 'Draft not found' })
        }

        if (draft.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        res.status(200).json(draft)
      } catch (error) {
        console.error('Error fetching draft:', error)
        res.status(500).json({ error: 'Failed to fetch draft' })
      }
      break

    case 'PUT':
      try {
        const { title, content, platform, contentType, characterId, campaignId, scheduledAt, status } = req.body

        const existingDraft = await prisma.draft.findUnique({
          where: { id: id as string }
        })

        if (!existingDraft) {
          return res.status(404).json({ error: 'Draft not found' })
        }

        if (existingDraft.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        const updatedDraft = await prisma.draft.update({
          where: { id: id as string },
          data: {
            ...(title && { title }),
            ...(content && { content }),
            ...(platform && { platform }),
            ...(contentType && { contentType }),
            ...(characterId !== undefined && { characterId }),
            ...(campaignId !== undefined && { campaignId }),
            ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
            ...(status && { status })
          },
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
          }
        })

        res.status(200).json(updatedDraft)
      } catch (error) {
        console.error('Error updating draft:', error)
        res.status(500).json({ error: 'Failed to update draft' })
      }
      break

    case 'DELETE':
      try {
        const existingDraft = await prisma.draft.findUnique({
          where: { id: id as string }
        })

        if (!existingDraft) {
          return res.status(404).json({ error: 'Draft not found' })
        }

        if (existingDraft.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        await prisma.draft.delete({
          where: { id: id as string }
        })

        res.status(204).end()
      } catch (error) {
        console.error('Error deleting draft:', error)
        res.status(500).json({ error: 'Failed to delete draft' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
