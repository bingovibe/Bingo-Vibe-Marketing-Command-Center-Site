
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface MetricsSummary {
  totalPosts: number
  totalCampaigns: number
  avgEngagementRate: number
  totalReach: number
  platformBreakdown: Record<string, number>
  characterBreakdown: Record<string, number>
  trendsData: Array<{ date: string; engagement: number; reach: number }>
}

export class MetricsService {
  static async getDashboardMetrics(userId: string): Promise<MetricsSummary> {
    try {
      // Get total posts
      const totalPosts = await prisma.post.count({
        where: { userId }
      })

      // Get total campaigns
      const totalCampaigns = await prisma.campaign.count({
        where: { userId }
      })

      // Get platform breakdown
      const platformPosts = await prisma.post.groupBy({
        by: ['platform'],
        where: { userId },
        _count: { id: true }
      })

      const platformBreakdown: Record<string, number> = {}
      platformPosts.forEach(p => {
        platformBreakdown[p.platform] = p._count.id
      })

      // Get character breakdown
      const characterPosts = await prisma.post.groupBy({
        by: ['characterId'],
        where: { 
          userId,
          characterId: { not: null }
        },
        _count: { id: true }
      })

      const characterBreakdown: Record<string, number> = {}
      for (const cp of characterPosts) {
        if (cp.characterId) {
          const character = await prisma.character.findUnique({
            where: { id: cp.characterId }
          })
          if (character) {
            characterBreakdown[character.name] = cp._count.id
          }
        }
      }

      // Get average engagement rate (mock calculation)
      const postMetrics = await prisma.postMetric.findMany({
        where: {
          post: { userId }
        }
      })

      let avgEngagementRate = 0
      let totalReach = 0

      if (postMetrics.length > 0) {
        const totalEngagements = postMetrics.reduce((sum, m) => 
          sum + m.likes + m.comments + m.shares, 0)
        totalReach = postMetrics.reduce((sum, m) => sum + m.reach, 0)
        const totalImpressions = postMetrics.reduce((sum, m) => sum + m.impressions, 0)
        
        avgEngagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0
      }

      // Generate trends data (mock data for now)
      const trendsData = this.generateTrendsData()

      return {
        totalPosts,
        totalCampaigns,
        avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
        totalReach,
        platformBreakdown,
        characterBreakdown,
        trendsData
      }
    } catch (error) {
      console.error('Error getting dashboard metrics:', error)
      // Return mock data as fallback
      return this.getMockMetrics()
    }
  }

  static async getCampaignMetrics(campaignId: string) {
    try {
      const posts = await prisma.post.findMany({
        where: { campaignId },
        include: { metrics: true }
      })

      const metrics = {
        totalPosts: posts.length,
        totalReach: posts.reduce((sum, p) => sum + p.metrics.reduce((ms, m) => ms + m.reach, 0), 0),
        totalEngagement: posts.reduce((sum, p) => 
          sum + p.metrics.reduce((ms, m) => ms + m.likes + m.comments + m.shares, 0), 0),
        totalClicks: posts.reduce((sum, p) => sum + p.metrics.reduce((ms, m) => ms + m.clicks, 0), 0),
        totalConversions: posts.reduce((sum, p) => sum + p.metrics.reduce((ms, m) => ms + m.conversions, 0), 0)
      }

      return metrics
    } catch (error) {
      console.error('Error getting campaign metrics:', error)
      return {
        totalPosts: 0,
        totalReach: 0,
        totalEngagement: 0,
        totalClicks: 0,
        totalConversions: 0
      }
    }
  }

  static async getInfluencerMetrics() {
    try {
      const influencers = await prisma.influencerOutreach.findMany()
      
      const metrics = {
        totalInfluencers: influencers.length,
        contacted: influencers.filter(i => i.status === 'SENT').length,
        responded: influencers.filter(i => i.status === 'RESPONDED').length,
        collaborating: influencers.filter(i => i.status === 'COLLABORATION').length,
        averageFollowers: influencers.reduce((sum, i) => sum + (i.followersCount || 0), 0) / influencers.length || 0,
        averageEngagement: influencers.reduce((sum, i) => sum + (i.engagementRate?.toNumber() || 0), 0) / influencers.length || 0
      }

      return metrics
    } catch (error) {
      console.error('Error getting influencer metrics:', error)
      return {
        totalInfluencers: 0,
        contacted: 0,
        responded: 0,
        collaborating: 0,
        averageFollowers: 0,
        averageEngagement: 0
      }
    }
  }

  private static generateTrendsData() {
    const data = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      data.push({
        date: date.toISOString().split('T')[0],
        engagement: Math.floor(Math.random() * 1000) + 500,
        reach: Math.floor(Math.random() * 5000) + 2000
      })
    }
    
    return data
  }

  private static getMockMetrics(): MetricsSummary {
    return {
      totalPosts: 24,
      totalCampaigns: 3,
      avgEngagementRate: 8.4,
      totalReach: 12500,
      platformBreakdown: {
        'TIKTOK': 8,
        'INSTAGRAM': 7,
        'FACEBOOK': 5,
        'YOUTUBE': 4
      },
      characterBreakdown: {
        'Zara': 6,
        'Caven': 5,
        'Grandma Rose': 4,
        'Coach Martinez': 5,
        'Founder': 4
      },
      trendsData: this.generateTrendsData()
    }
  }
}
