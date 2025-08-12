
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
        const post = await prisma.post.findUnique({
          where: { id: id as string },
          include: {
            character: true,
            campaign: true,
            metrics: {
              orderBy: { recordedAt: 'desc' }
            }
          }
        })

        if (!post) {
          return res.status(404).json({ error: 'Post not found' })
        }

        if (post.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        res.status(200).json(post)
      } catch (error) {
        console.error('Error fetching post:', error)
        res.status(500).json({ error: 'Failed to fetch post' })
      }
      break

    case 'PUT':
      try {
        const { title, content, platform, contentType, characterId, campaignId, scheduledAt, status } = req.body

        const existingPost = await prisma.post.findUnique({
          where: { id: id as string }
        })

        if (!existingPost) {
          return res.status(404).json({ error: 'Post not found' })
        }

        if (existingPost.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        const updatedPost = await prisma.post.update({
          where: { id: id as string },
          data: {
            ...(title && { title }),
            ...(content && { content }),
            ...(platform && { platform }),
            ...(contentType && { contentType }),
            ...(characterId !== undefined && { characterId }),
            ...(campaignId !== undefined && { campaignId }),
            ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
            ...(status && { status }),
            ...(status === 'PUBLISHED' && !existingPost.publishedAt && { publishedAt: new Date() })
          },
          include: {
            character: true,
            campaign: true,
            metrics: true
          }
        })

        res.status(200).json(updatedPost)
      } catch (error) {
        console.error('Error updating post:', error)
        res.status(500).json({ error: 'Failed to update post' })
      }
      break

    case 'DELETE':
      try {
        const existingPost = await prisma.post.findUnique({
          where: { id: id as string }
        })

        if (!existingPost) {
          return res.status(404).json({ error: 'Post not found' })
        }

        if (existingPost.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        await prisma.post.delete({
          where: { id: id as string }
        })

        res.status(204).end()
      } catch (error) {
        console.error('Error deleting post:', error)
        res.status(500).json({ error: 'Failed to delete post' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
