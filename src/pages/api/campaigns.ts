
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
        const { status } = req.query

        const where: any = { userId: user.id }
        if (status) where.status = status

        const campaigns = await prisma.campaign.findMany({
          where,
          include: {
            drafts: {
              include: {
                character: true
              }
            },
            posts: {
              include: {
                character: true,
                metrics: true
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
          },
          orderBy: { updatedAt: 'desc' }
        })
        
        res.status(200).json(campaigns)
      } catch (error) {
        console.error('Error fetching campaigns:', error)
        res.status(500).json({ error: 'Failed to fetch campaigns' })
      }
      break

    case 'POST':
      try {
        const { name, description, budget, startDate, endDate } = req.body
        
        if (!name) {
          return res.status(400).json({ error: 'Campaign name is required' })
        }

        const campaign = await prisma.campaign.create({
          data: {
            name,
            description: description || null,
            budget: budget ? parseFloat(budget) : null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            userId: user.id,
            status: 'PLANNING'
          },
          include: {
            _count: {
              select: {
                drafts: true,
                posts: true,
                influencers: true
              }
            }
          }
        })

        res.status(201).json(campaign)
      } catch (error) {
        console.error('Error creating campaign:', error)
        res.status(500).json({ error: 'Failed to create campaign' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
