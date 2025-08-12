
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
        const campaign = await prisma.campaign.findUnique({
          where: { id: id as string },
          include: {
            drafts: {
              include: {
                character: true,
                approvals: true
              }
            },
            posts: {
              include: {
                character: true,
                metrics: {
                  orderBy: { recordedAt: 'desc' },
                  take: 1
                }
              }
            },
            influencers: true,
            events: true,
            _count: {
              select: {
                drafts: true,
                posts: true,
                influencers: true
              }
            }
          }
        })

        if (!campaign) {
          return res.status(404).json({ error: 'Campaign not found' })
        }

        if (campaign.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        // Calculate campaign metrics
        const totalViews = campaign.posts.reduce((sum, post) => {
          const latestMetrics = post.metrics[0]
          return sum + (latestMetrics?.views || 0)
        }, 0)

        const totalEngagement = campaign.posts.reduce((sum, post) => {
          const latestMetrics = post.metrics[0]
          return sum + (latestMetrics?.likes || 0) + (latestMetrics?.comments || 0) + (latestMetrics?.shares || 0)
        }, 0)

        const campaignWithMetrics = {
          ...campaign,
          metrics: {
            totalViews,
            totalEngagement,
            postsCount: campaign.posts.length,
            draftsCount: campaign.drafts.length,
            influencersCount: campaign.influencers.length
          }
        }

        res.status(200).json(campaignWithMetrics)
      } catch (error) {
        console.error('Error fetching campaign:', error)
        res.status(500).json({ error: 'Failed to fetch campaign' })
      }
      break

    case 'PUT':
      try {
        const { name, description, budget, startDate, endDate, status } = req.body

        const existingCampaign = await prisma.campaign.findUnique({
          where: { id: id as string }
        })

        if (!existingCampaign) {
          return res.status(404).json({ error: 'Campaign not found' })
        }

        if (existingCampaign.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        const updatedCampaign = await prisma.campaign.update({
          where: { id: id as string },
          data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
            ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
            ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
            ...(status && { status })
          },
          include: {
            drafts: true,
            posts: true,
            influencers: true,
            events: true,
            _count: {
              select: {
                drafts: true,
                posts: true,
                influencers: true
              }
            }
          }
        })

        res.status(200).json(updatedCampaign)
      } catch (error) {
        console.error('Error updating campaign:', error)
        res.status(500).json({ error: 'Failed to update campaign' })
      }
      break

    case 'DELETE':
      try {
        const existingCampaign = await prisma.campaign.findUnique({
          where: { id: id as string }
        })

        if (!existingCampaign) {
          return res.status(404).json({ error: 'Campaign not found' })
        }

        if (existingCampaign.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        await prisma.campaign.delete({
          where: { id: id as string }
        })

        res.status(204).end()
      } catch (error) {
        console.error('Error deleting campaign:', error)
        res.status(500).json({ error: 'Failed to delete campaign' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
