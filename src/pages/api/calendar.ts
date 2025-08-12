
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
        const { startDate, endDate, eventType, campaignId } = req.query

        let where: any = {}
        
        // Date range filter
        if (startDate || endDate) {
          where.startDate = {}
          if (startDate) where.startDate.gte = new Date(startDate as string)
          if (endDate) where.startDate.lte = new Date(endDate as string)
        }

        if (eventType) where.eventType = eventType
        if (campaignId) {
          // Verify user has access to campaign
          const campaign = await prisma.campaign.findFirst({
            where: { 
              id: campaignId as string,
              userId: user.id 
            }
          })
          
          if (campaign || user.role === 'ADMIN' || user.role === 'MANAGER') {
            where.campaignId = campaignId
          } else {
            return res.status(403).json({ error: 'Access denied to campaign' })
          }
        }

        // If not admin/manager, only show events for user's campaigns
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && !campaignId) {
          where.OR = [
            { campaignId: null }, // General events
            { campaign: { userId: user.id } } // User's campaign events
          ]
        }

        const events = await prisma.calendarEvent.findMany({
          where,
          include: {
            campaign: {
              select: { id: true, name: true, userId: true }
            }
          },
          orderBy: { startDate: 'asc' }
        })
        
        res.status(200).json(events)
      } catch (error) {
        console.error('Error fetching calendar events:', error)
        res.status(500).json({ error: 'Failed to fetch calendar events' })
      }
      break

    case 'POST':
      try {
        const { 
          title, 
          description, 
          eventType, 
          startDate, 
          endDate, 
          isRecurring, 
          recurringPattern, 
          campaignId 
        } = req.body
        
        if (!title || !eventType || !startDate) {
          return res.status(400).json({ error: 'Title, event type, and start date are required' })
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

        const event = await prisma.calendarEvent.create({
          data: {
            title,
            description: description || null,
            eventType,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            isRecurring: isRecurring || false,
            recurringPattern: recurringPattern || null,
            campaignId: campaignId || null
          },
          include: {
            campaign: {
              select: { id: true, name: true }
            }
          }
        })

        res.status(201).json(event)
      } catch (error) {
        console.error('Error creating calendar event:', error)
        res.status(500).json({ error: 'Failed to create calendar event' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
