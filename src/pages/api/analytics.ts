
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

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { timeframe = '30d', platform, campaignId } = req.query

    // Calculate date range
    const now = new Date()
    const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 30
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    // Build where clause for posts
    const postWhere: any = { 
      userId: user.id,
      publishedAt: { gte: startDate }
    }
    
    if (platform && typeof platform === 'string') postWhere.platform = platform as any
    if (campaignId && typeof campaignId === 'string') postWhere.campaignId = campaignId

    // Get posts with metrics
    const posts = await prisma.post.findMany({
      where: postWhere,
      include: {
        metrics: {
          orderBy: { recordedAt: 'desc' },
          take: 1
        },
        character: {
          select: { name: true, slug: true }
        },
        campaign: {
          select: { name: true, id: true }
        }
      }
    })

    // Calculate overall metrics
    const totalMetrics = posts.reduce((acc, post) => {
      const latestMetrics = post.metrics[0] || {}
      
      return {
        views: acc.views + (latestMetrics.views || 0),
        likes: acc.likes + (latestMetrics.likes || 0),
        comments: acc.comments + (latestMetrics.comments || 0),
        shares: acc.shares + (latestMetrics.shares || 0),
        clicks: acc.clicks + (latestMetrics.clicks || 0),
        conversions: acc.conversions + (latestMetrics.conversions || 0),
        reach: acc.reach + (latestMetrics.reach || 0),
        impressions: acc.impressions + (latestMetrics.impressions || 0)
      }
    }, {
      views: 0, likes: 0, comments: 0, shares: 0, 
      clicks: 0, conversions: 0, reach: 0, impressions: 0
    })

    // Calculate engagement rate
    const engagementRate = totalMetrics.impressions > 0 
      ? ((totalMetrics.likes + totalMetrics.comments + totalMetrics.shares) / totalMetrics.impressions) * 100 
      : 0

    // Platform breakdown
    const platformMetrics = posts.reduce((acc, post) => {
      const platform = post.platform
      const metrics = post.metrics[0] || {}
      
      if (!acc[platform]) {
        acc[platform] = { views: 0, likes: 0, comments: 0, shares: 0, posts: 0 }
      }
      
      acc[platform].views += metrics.views || 0
      acc[platform].likes += metrics.likes || 0
      acc[platform].comments += metrics.comments || 0
      acc[platform].shares += metrics.shares || 0
      acc[platform].posts += 1
      
      return acc
    }, {} as Record<string, any>)

    // Character performance
    const characterMetrics = posts.reduce((acc, post) => {
      if (!post.character) return acc
      
      const character = post.character.name
      const metrics = post.metrics[0] || {}
      
      if (!acc[character]) {
        acc[character] = { views: 0, likes: 0, comments: 0, shares: 0, posts: 0 }
      }
      
      acc[character].views += metrics.views || 0
      acc[character].likes += metrics.likes || 0
      acc[character].comments += metrics.comments || 0
      acc[character].shares += metrics.shares || 0
      acc[character].posts += 1
      
      return acc
    }, {} as Record<string, any>)

    // Top performing posts
    const topPosts = posts
      .map(post => ({
        id: post.id,
        title: post.title,
        platform: post.platform,
        character: post.character?.name,
        campaign: post.campaign?.name,
        publishedAt: post.publishedAt,
        metrics: post.metrics[0] || {},
        engagementScore: post.metrics[0] 
          ? (post.metrics[0].likes + post.metrics[0].comments + post.metrics[0].shares)
          : 0
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10)

    // Time-based metrics (daily for last 30 days)
    const dailyMetrics = await prisma.postMetric.groupBy({
      by: ['recordedAt'],
      where: {
        post: {
          userId: user.id,
          ...(platform && typeof platform === 'string' && { platform: platform as any }),
          ...(campaignId && typeof campaignId === 'string' && { campaignId })
        },
        recordedAt: { gte: startDate }
      },
      _sum: {
        views: true,
        likes: true,
        comments: true,
        shares: true,
        clicks: true,
        conversions: true
      },
      orderBy: {
        recordedAt: 'asc'
      }
    })

    const analytics = {
      overview: {
        totalPosts: posts.length,
        ...totalMetrics,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        conversionRate: totalMetrics.clicks > 0 ? parseFloat(((totalMetrics.conversions / totalMetrics.clicks) * 100).toFixed(2)) : 0
      },
      platforms: platformMetrics,
      characters: characterMetrics,
      topPosts,
      timeline: dailyMetrics.map(day => ({
        date: day.recordedAt,
        views: day._sum?.views || 0,
        likes: day._sum?.likes || 0,
        comments: day._sum?.comments || 0,
        shares: day._sum?.shares || 0,
        clicks: day._sum?.clicks || 0,
        conversions: day._sum?.conversions || 0
      }))
    }
    
    res.status(200).json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
}
