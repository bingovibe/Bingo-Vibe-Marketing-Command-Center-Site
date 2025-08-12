
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
        const { status, draftId } = req.query

        let where: any = {}
        
        // If user is not admin/manager, only show approvals for their drafts or approvals they need to review
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          where = {
            OR: [
              { draft: { userId: user.id } }, // Their own drafts
              { reviewerId: user.id } // Approvals assigned to them
            ]
          }
        }

        if (status) where.status = status
        if (draftId) where.draftId = draftId

        const approvals = await prisma.contentApproval.findMany({
          where,
          include: {
            draft: {
              include: {
                user: {
                  select: { id: true, username: true, email: true }
                },
                character: {
                  select: { name: true, slug: true }
                },
                campaign: {
                  select: { name: true, id: true }
                }
              }
            },
            reviewer: {
              select: { id: true, username: true, email: true }
            }
          },
          orderBy: { updatedAt: 'desc' }
        })
        
        res.status(200).json(approvals)
      } catch (error) {
        console.error('Error fetching approvals:', error)
        res.status(500).json({ error: 'Failed to fetch approvals' })
      }
      break

    case 'POST':
      try {
        const { draftId, reviewerId, notes } = req.body
        
        if (!draftId || !reviewerId) {
          return res.status(400).json({ error: 'Draft ID and reviewer ID are required' })
        }

        // Verify draft exists and user has permission
        const draft = await prisma.draft.findUnique({
          where: { id: draftId }
        })

        if (!draft) {
          return res.status(404).json({ error: 'Draft not found' })
        }

        if (draft.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        // Verify reviewer exists and has appropriate role
        const reviewer = await prisma.user.findUnique({
          where: { id: reviewerId }
        })

        if (!reviewer || (reviewer.role !== 'ADMIN' && reviewer.role !== 'MANAGER')) {
          return res.status(400).json({ error: 'Invalid reviewer - must be admin or manager' })
        }

        // Check if approval already exists
        const existingApproval = await prisma.contentApproval.findFirst({
          where: { draftId, reviewerId }
        })

        if (existingApproval) {
          return res.status(409).json({ error: 'Approval request already exists' })
        }

        const approval = await prisma.contentApproval.create({
          data: {
            draftId,
            reviewerId,
            notes: notes || null,
            status: 'PENDING'
          },
          include: {
            draft: {
              include: {
                user: {
                  select: { id: true, username: true, email: true }
                },
                character: true,
                campaign: true
              }
            },
            reviewer: {
              select: { id: true, username: true, email: true }
            }
          }
        })

        // Update draft status to REVIEW
        await prisma.draft.update({
          where: { id: draftId },
          data: { status: 'REVIEW' }
        })

        res.status(201).json(approval)
      } catch (error) {
        console.error('Error creating approval:', error)
        res.status(500).json({ error: 'Failed to create approval' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
