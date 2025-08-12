
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
        const { postId } = req.query

        if (!postId) {
          return res.status(400).json({ error: 'Post ID is required' })
        }

        // Verify user has access to this post
        const post = await prisma.post.findUnique({
          where: { id: postId as string }
        })

        if (!post) {
          return res.status(404).json({ error: 'Post not found' })
        }

        if (post.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        const metrics = await prisma.postMetric.findMany({
          where: { postId: postId as string },
          orderBy: { recordedAt: 'desc' }
        })
        
        res.status(200).json(metrics)
      } catch (error) {
        console.error('Error fetching metrics:', error)
        res.status(500).json({ error: 'Failed to fetch metrics' })
      }
      break

    case 'POST':
      try {
        const { 
          postId, 
          views, 
          likes, 
          comments, 
          shares, 
          clicks, 
          conversions, 
          reach, 
          impressions 
        } = req.body
        
        if (!postId) {
          return res.status(400).json({ error: 'Post ID is required' })
        }

        // Verify user has access to this post
        const post = await prisma.post.findUnique({
          where: { id: postId }
        })

        if (!post) {
          return res.status(404).json({ error: 'Post not found' })
        }

        if (post.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return res.status(403).json({ error: 'Access denied' })
        }

        const metric = await prisma.postMetric.create({
          data: {
            postId,
            views: views || 0,
            likes: likes || 0,
            comments: comments || 0,
            shares: shares || 0,
            clicks: clicks || 0,
            conversions: conversions || 0,
            reach: reach || 0,
            impressions: impressions || 0
          }
        })

        res.status(201).json(metric)
      } catch (error) {
        console.error('Error creating metric:', error)
        res.status(500).json({ error: 'Failed to create metric' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
