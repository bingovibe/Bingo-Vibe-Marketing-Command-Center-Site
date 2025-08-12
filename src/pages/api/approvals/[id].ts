
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
        const approval = await prisma.contentApproval.findUnique({
          where: { id: id as string },
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

        if (!approval) {
          return res.status(404).json({ error: 'Approval not found' })
        }

        // Check access permissions
        const canAccess = approval.draft.userId === user.id || 
                         approval.reviewerId === user.id || 
                         user.role === 'ADMIN' || 
                         user.role === 'MANAGER'

        if (!canAccess) {
          return res.status(403).json({ error: 'Access denied' })
        }

        res.status(200).json(approval)
      } catch (error) {
        console.error('Error fetching approval:', error)
        res.status(500).json({ error: 'Failed to fetch approval' })
      }
      break

    case 'PUT':
      try {
        const { status, notes } = req.body

        if (!status || !['APPROVED', 'REJECTED', 'REVISION_NEEDED'].includes(status)) {
          return res.status(400).json({ error: 'Valid status is required' })
        }

        const existingApproval = await prisma.contentApproval.findUnique({
          where: { id: id as string },
          include: {
            draft: true
          }
        })

        if (!existingApproval) {
          return res.status(404).json({ error: 'Approval not found' })
        }

        // Only the assigned reviewer can update the approval
        if (existingApproval.reviewerId !== user.id && user.role !== 'ADMIN') {
          return res.status(403).json({ error: 'Only the assigned reviewer can update this approval' })
        }

        // Update the approval
        const updatedApproval = await prisma.contentApproval.update({
          where: { id: id as string },
          data: {
            status,
            notes: notes || null
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

        // Update the draft status based on approval
        let draftStatus: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED'
        switch (status) {
          case 'APPROVED':
            draftStatus = 'APPROVED'
            break
          case 'REJECTED':
            draftStatus = 'REJECTED'
            break
          case 'REVISION_NEEDED':
            draftStatus = 'DRAFT'
            break
          default:
            draftStatus = 'REVIEW'
        }

        await prisma.draft.update({
          where: { id: existingApproval.draftId },
          data: { status: draftStatus }
        })

        res.status(200).json(updatedApproval)
      } catch (error) {
        console.error('Error updating approval:', error)
        res.status(500).json({ error: 'Failed to update approval' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'PUT'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
