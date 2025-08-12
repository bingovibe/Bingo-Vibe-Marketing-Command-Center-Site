
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
        const event = await prisma.calendarEvent.findUnique({
          where: { id: id as string },
          include: {
            campaign: {
              select: { id: true, name: true, userId: true }
            }
          }
        })

        if (!event) {
          return res.status(404).json({ error: 'Calendar event not found' })
        }

        // Check access permissions
        if (event.campaign && event.campaign.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        res.status(200).json(event)
      } catch (error) {
        console.error('Error fetching calendar event:', error)
        res.status(500).json({ error: 'Failed to fetch calendar event' })
      }
      break

    case 'PUT':
      try {
        const { 
          title, 
          description, 
          eventType, 
          startDate, 
          endDate, 
          isRecurring, 
          recurringPattern 
        } = req.body

        const existingEvent = await prisma.calendarEvent.findUnique({
          where: { id: id as string },
          include: {
            campaign: {
              select: { userId: true }
            }
          }
        })

        if (!existingEvent) {
          return res.status(404).json({ error: 'Calendar event not found' })
        }

        // Check access permissions
        if (existingEvent.campaign && existingEvent.campaign.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        const updatedEvent = await prisma.calendarEvent.update({
          where: { id: id as string },
          data: {
            ...(title && { title }),
            ...(description !== undefined && { description }),
            ...(eventType && { eventType }),
            ...(startDate && { startDate: new Date(startDate) }),
            ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
            ...(isRecurring !== undefined && { isRecurring }),
            ...(recurringPattern !== undefined && { recurringPattern })
          },
          include: {
            campaign: {
              select: { id: true, name: true }
            }
          }
        })

        res.status(200).json(updatedEvent)
      } catch (error) {
        console.error('Error updating calendar event:', error)
        res.status(500).json({ error: 'Failed to update calendar event' })
      }
      break

    case 'DELETE':
      try {
        const existingEvent = await prisma.calendarEvent.findUnique({
          where: { id: id as string },
          include: {
            campaign: {
              select: { userId: true }
            }
          }
        })

        if (!existingEvent) {
          return res.status(404).json({ error: 'Calendar event not found' })
        }

        // Check access permissions
        if (existingEvent.campaign && existingEvent.campaign.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        await prisma.calendarEvent.delete({
          where: { id: id as string }
        })

        res.status(204).end()
      } catch (error) {
        console.error('Error deleting calendar event:', error)
        res.status(500).json({ error: 'Failed to delete calendar event' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
