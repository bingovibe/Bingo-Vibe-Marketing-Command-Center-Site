
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
        const { status, platform, campaignId } = req.query

        const where: any = {}
        if (status) where.status = status
        if (platform) where.platform = platform
        if (campaignId) where.campaignId = campaignId

        const influencers = await prisma.influencerOutreach.findMany({
          where,
          include: {
            campaign: {
              select: { id: true, name: true, status: true }
            }
          },
          orderBy: { updatedAt: 'desc' }
        })
        
        res.status(200).json(influencers)
      } catch (error) {
        console.error('Error fetching influencers:', error)
        res.status(500).json({ error: 'Failed to fetch influencers' })
      }
      break

    case 'POST':
      try {
        const { influencer, platform, email, followersCount, engagementRate, notes, campaignId } = req.body
        
        if (!influencer || !platform) {
          return res.status(400).json({ error: 'Influencer name and platform are required' })
        }

        // Verify campaign belongs to user if specified
        if (campaignId) {
          const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId }
          })

          if (!campaign || (campaign.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
            return res.status(403).json({ error: 'Invalid campaign or access denied' })
          }
        }

        const outreach = await prisma.influencerOutreach.create({
          data: {
            influencer,
            platform,
            email: email || null,
            followersCount: followersCount ? parseInt(followersCount) : null,
            engagementRate: engagementRate ? parseFloat(engagementRate) : null,
            notes: notes || null,
            campaignId: campaignId || null,
            status: 'PENDING'
          },
          include: {
            campaign: {
              select: { id: true, name: true, status: true }
            }
          }
        })

        res.status(201).json(outreach)
      } catch (error) {
        console.error('Error creating influencer outreach:', error)
        res.status(500).json({ error: 'Failed to create influencer outreach' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
