
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnalyticsMetrics {
  totalPosts: number;
  totalViews: number;
  totalEngagement: number;
  totalReach: number;
  engagementRate: number;
  averageViews: number;
  topPerformingPosts: Array<{
    id: string;
    title: string;
    platform: string;
    views: number;
    engagement: number;
    publishedAt: Date;
  }>;
  platformBreakdown: Array<{
    platform: string;
    posts: number;
    views: number;
    engagement: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    views: number;
    engagement: number;
    posts: number;
  }>;
  campaignMetrics: Array<{
    id: string;
    name: string;
    posts: number;
    views: number;
    engagement: number;
    roi: number;
  }>;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Get overall analytics metrics
export async function getAnalyticsMetrics(
  userId: string,
  dateRange?: DateRange
): Promise<AnalyticsMetrics> {
  const whereClause = {
    userId,
    status: 'PUBLISHED' as const,
    ...(dateRange && {
      publishedAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    }),
  };

  // Get all published posts with metrics
  const posts = await prisma.post.findMany({
    where: whereClause,
    include: {
      campaign: true,
      metrics: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
  });

  // Calculate aggregate metrics
  const totalPosts = posts.length;
  const totalViews = posts.reduce((sum, post) => {
    const latestMetric = post.metrics[post.metrics.length - 1];
    return sum + (latestMetric?.views || 0);
  }, 0);
  const totalEngagement = posts.reduce((sum, post) => {
    const latestMetric = post.metrics[post.metrics.length - 1];
    return sum + ((latestMetric?.likes || 0) + (latestMetric?.shares || 0) + (latestMetric?.comments || 0));
  }, 0);
  const totalReach = posts.reduce((sum, post) => {
    const latestMetric = post.metrics[post.metrics.length - 1];
    return sum + (latestMetric?.reach || 0);
  }, 0);
  const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
  const averageViews = totalPosts > 0 ? totalViews / totalPosts : 0;

  // Top performing posts
  const topPerformingPosts = posts
    .sort((a, b) => {
      const aLatestMetric = a.metrics[a.metrics.length - 1];
      const bLatestMetric = b.metrics[b.metrics.length - 1];
      const aEngagement = (aLatestMetric?.likes || 0) + (aLatestMetric?.shares || 0) + (aLatestMetric?.comments || 0);
      const bEngagement = (bLatestMetric?.likes || 0) + (bLatestMetric?.shares || 0) + (bLatestMetric?.comments || 0);
      return bEngagement - aEngagement;
    })
    .slice(0, 10)
    .map(post => {
      const latestMetric = post.metrics[post.metrics.length - 1];
      return {
        id: post.id,
        title: post.title,
        platform: post.platform,
        views: latestMetric?.views || 0,
        engagement: (latestMetric?.likes || 0) + (latestMetric?.shares || 0) + (latestMetric?.comments || 0),
        publishedAt: post.publishedAt || new Date(),
      };
    });

  // Platform breakdown
  const platformStats = posts.reduce((acc, post) => {
    const platform = post.platform;
    if (!acc[platform]) {
      acc[platform] = { posts: 0, views: 0, engagement: 0 };
    }
    const latestMetric = post.metrics[post.metrics.length - 1];
    acc[platform].posts += 1;
    acc[platform].views += latestMetric?.views || 0;
    acc[platform].engagement += (latestMetric?.likes || 0) + (latestMetric?.shares || 0) + (latestMetric?.comments || 0);
    return acc;
  }, {} as Record<string, { posts: number; views: number; engagement: number }>);

  const platformBreakdown = Object.entries(platformStats).map(([platform, stats]) => ({
    platform,
    ...stats,
  }));

  // Time series data (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const timeSeriesData = await generateTimeSeriesData(userId, thirtyDaysAgo, new Date());

  // Campaign metrics
  const campaignMetrics = await getCampaignAnalytics(userId, dateRange);

  return {
    totalPosts,
    totalViews,
    totalEngagement,
    totalReach,
    engagementRate,
    averageViews,
    topPerformingPosts,
    platformBreakdown,
    timeSeriesData,
    campaignMetrics,
  };
}

// Generate time series data for charts
async function generateTimeSeriesData(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: string; views: number; engagement: number; posts: number }>> {
  const posts = await prisma.post.findMany({
    where: {
      userId,
      status: 'PUBLISHED',
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Group by date
  const dateMap = new Map();
  
  // Initialize all dates in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dateMap.set(dateStr, { date: dateStr, views: 0, engagement: 0, posts: 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Aggregate data by date
  posts.forEach(post => {
    if (post.publishedAt) {
      const dateStr = post.publishedAt.toISOString().split('T')[0];
      const dayData = dateMap.get(dateStr);
      if (dayData) {
        dayData.views += post.views || 0;
        dayData.engagement += post.engagement || 0;
        dayData.posts += 1;
      }
    }
  });

  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// Get campaign-specific analytics
async function getCampaignAnalytics(
  userId: string,
  dateRange?: DateRange
): Promise<Array<{
  id: string;
  name: string;
  posts: number;
  views: number;
  engagement: number;
  roi: number;
}>> {
  const whereClause = {
    userId,
    ...(dateRange && {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    }),
  };

  const campaigns = await prisma.campaign.findMany({
    where: whereClause,
    include: {
      posts: {
        where: { status: 'PUBLISHED' },
      },
    },
  });

  return campaigns.map(campaign => {
    const posts = campaign.posts.length;
    const views = campaign.posts.reduce((sum, post) => sum + (post.views || 0), 0);
    const engagement = campaign.posts.reduce((sum, post) => sum + (post.engagement || 0), 0);
    
    // Calculate ROI (simplified calculation)
    const spend = campaign.budget || 0;
    const revenue = engagement * 0.01; // Placeholder calculation
    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

    return {
      id: campaign.id,
      name: campaign.name,
      posts,
      views,
      engagement,
      roi,
    };
  });
}

// Get platform-specific metrics
export async function getPlatformMetrics(
  userId: string,
  platform: string,
  dateRange?: DateRange
): Promise<{
  totalPosts: number;
  totalViews: number;
  totalEngagement: number;
  averageEngagementRate: number;
  bestPostingTimes: Array<{ hour: number; engagement: number }>;
  contentTypeBreakdown: Array<{ type: string; posts: number; avgEngagement: number }>;
}> {
  const whereClause = {
    userId,
    platform,
    status: 'PUBLISHED' as const,
    ...(dateRange && {
      publishedAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    }),
  };

  const posts = await prisma.post.findMany({
    where: whereClause,
  });

  const totalPosts = posts.length;
  const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
  const totalEngagement = posts.reduce((sum, post) => sum + (post.engagement || 0), 0);
  const averageEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

  // Best posting times (aggregate by hour)
  const hourlyEngagement = posts.reduce((acc, post) => {
    if (post.publishedAt) {
      const hour = post.publishedAt.getHours();
      if (!acc[hour]) acc[hour] = { total: 0, count: 0 };
      acc[hour].total += post.engagement || 0;
      acc[hour].count += 1;
    }
    return acc;
  }, {} as Record<number, { total: number; count: number }>);

  const bestPostingTimes = Object.entries(hourlyEngagement)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      engagement: data.count > 0 ? data.total / data.count : 0,
    }))
    .sort((a, b) => b.engagement - a.engagement);

  // Content type breakdown
  const typeBreakdown = posts.reduce((acc, post) => {
    const type = post.contentType || 'Unknown';
    if (!acc[type]) acc[type] = { total: 0, count: 0 };
    acc[type].total += post.engagement || 0;
    acc[type].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const contentTypeBreakdown = Object.entries(typeBreakdown)
    .map(([type, data]) => ({
      type,
      posts: data.count,
      avgEngagement: data.count > 0 ? data.total / data.count : 0,
    }));

  return {
    totalPosts,
    totalViews,
    totalEngagement,
    averageEngagementRate,
    bestPostingTimes,
    contentTypeBreakdown,
  };
}

// Get real-time metrics (for dashboard)
export async function getRealTimeMetrics(userId: string): Promise<{
  todayViews: number;
  todayEngagement: number;
  todayPosts: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  activeCampaigns: number;
  scheduledPosts: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Today's metrics
  const todayPosts = await prisma.post.findMany({
    where: {
      userId,
      status: 'PUBLISHED',
      publishedAt: { gte: today },
    },
  });

  const todayViews = todayPosts.reduce((sum, post) => sum + (post.views || 0), 0);
  const todayEngagement = todayPosts.reduce((sum, post) => sum + (post.engagement || 0), 0);

  // Weekly growth calculation
  const thisWeekPosts = await prisma.post.findMany({
    where: {
      userId,
      status: 'PUBLISHED',
      publishedAt: { gte: weekAgo },
    },
  });

  const lastWeekPosts = await prisma.post.findMany({
    where: {
      userId,
      status: 'PUBLISHED',
      publishedAt: {
        gte: new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
        lt: weekAgo,
      },
    },
  });

  const thisWeekEngagement = thisWeekPosts.reduce((sum, post) => sum + (post.engagement || 0), 0);
  const lastWeekEngagement = lastWeekPosts.reduce((sum, post) => sum + (post.engagement || 0), 0);
  const weeklyGrowth = lastWeekEngagement > 0 
    ? ((thisWeekEngagement - lastWeekEngagement) / lastWeekEngagement) * 100 
    : 0;

  // Monthly growth calculation
  const thisMonthPosts = await prisma.post.findMany({
    where: {
      userId,
      status: 'PUBLISHED',
      publishedAt: { gte: monthAgo },
    },
  });

  const lastMonthStart = new Date(monthAgo);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  
  const lastMonthPosts = await prisma.post.findMany({
    where: {
      userId,
      status: 'PUBLISHED',
      publishedAt: {
        gte: lastMonthStart,
        lt: monthAgo,
      },
    },
  });

  const thisMonthEngagement = thisMonthPosts.reduce((sum, post) => sum + (post.engagement || 0), 0);
  const lastMonthEngagement = lastMonthPosts.reduce((sum, post) => sum + (post.engagement || 0), 0);
  const monthlyGrowth = lastMonthEngagement > 0 
    ? ((thisMonthEngagement - lastMonthEngagement) / lastMonthEngagement) * 100 
    : 0;

  // Active campaigns
  const activeCampaigns = await prisma.campaign.count({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  // Scheduled posts
  const scheduledPosts = await prisma.post.count({
    where: {
      userId,
      status: 'SCHEDULED',
    },
  });

  return {
    todayViews,
    todayEngagement,
    todayPosts: todayPosts.length,
    weeklyGrowth,
    monthlyGrowth,
    activeCampaigns,
    scheduledPosts,
  };
}
