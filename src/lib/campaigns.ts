
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CampaignWithMetrics {
  id: string;
  name: string;
  description?: string;
  status: string;
  budget?: number;
  spent?: number;
  revenue?: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Calculated metrics
  roi: number;
  remainingBudget: number;
  daysRemaining?: number;
  totalPosts: number;
  totalViews: number;
  totalEngagement: number;
  averageEngagementRate: number;
  outreachCount: number;
  collaborationCount: number;
  
  // Related data
  posts: Array<{
    id: string;
    title: string;
    platform: string;
    views?: number;
    engagement?: number;
    publishedAt?: Date;
  }>;
}

export interface CampaignROIData {
  campaignId: string;
  totalSpent: number;
  estimatedRevenue: number;
  actualRevenue: number;
  roi: number;
  costPerEngagement: number;
  costPerView: number;
  engagementValue: number;
  conversionRate: number;
  breakdown: {
    contentCreation: number;
    influencerPayments: number;
    adSpend: number;
    other: number;
  };
}

// Get campaign with comprehensive metrics
export async function getCampaignWithMetrics(
  userId: string, 
  campaignId: string
): Promise<CampaignWithMetrics | null> {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      userId,
    },
    include: {
      posts: {
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          platform: true,
          views: true,
          engagement: true,
          publishedAt: true,
        },
      },
      outreachEmails: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!campaign) return null;

  // Calculate metrics
  const totalPosts = campaign.posts.length;
  const totalViews = campaign.posts.reduce((sum, post) => sum + (post.views || 0), 0);
  const totalEngagement = campaign.posts.reduce((sum, post) => sum + (post.engagement || 0), 0);
  const averageEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
  
  const outreachCount = campaign.outreachEmails.length;
  const collaborationCount = campaign.outreachEmails.filter(
    outreach => outreach.status === 'COLLABORATED'
  ).length;

  // Budget calculations
  const budget = Number(campaign.budget) || 0;
  const spent = 0; // TODO: Implement actual spending tracking
  const revenue = totalEngagement * 0.01; // Simplified revenue calculation
  const roi = budget > 0 ? ((revenue - spent) / budget) * 100 : 0;
  const remainingBudget = budget - spent;

  // Days remaining
  let daysRemaining: number | undefined;
  if (campaign.endDate) {
    const now = new Date();
    const endDate = new Date(campaign.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    ...campaign,
    budget,
    spent,
    revenue,
    roi,
    remainingBudget,
    daysRemaining,
    totalPosts,
    totalViews,
    totalEngagement,
    averageEngagementRate,
    outreachCount,
    collaborationCount,
    posts: campaign.posts,
  };
}

// Get all campaigns with basic metrics
export async function getCampaignsWithMetrics(userId: string): Promise<CampaignWithMetrics[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    include: {
      posts: {
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          platform: true,
          views: true,
          engagement: true,
          publishedAt: true,
        },
      },
      outreachEmails: {
        select: {
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return campaigns.map(campaign => {
    const totalPosts = campaign.posts.length;
    const totalViews = campaign.posts.reduce((sum, post) => sum + (post.views || 0), 0);
    const totalEngagement = campaign.posts.reduce((sum, post) => sum + (post.engagement || 0), 0);
    const averageEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
    
    const outreachCount = campaign.outreachEmails.length;
    const collaborationCount = campaign.outreachEmails.filter(
      outreach => outreach.status === 'COLLABORATED'
    ).length;

    const budget = Number(campaign.budget) || 0;
    const spent = 0; // TODO: Implement actual spending tracking
    const revenue = totalEngagement * 0.01; // Simplified revenue calculation
    const roi = budget > 0 ? ((revenue - spent) / budget) * 100 : 0;
    const remainingBudget = budget - spent;

    let daysRemaining: number | undefined;
    if (campaign.endDate) {
      const now = new Date();
      const endDate = new Date(campaign.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      ...campaign,
      budget,
      spent,
      revenue,
      roi,
      remainingBudget,
      daysRemaining,
      totalPosts,
      totalViews,
      totalEngagement,
      averageEngagementRate,
      outreachCount,
      collaborationCount,
      posts: campaign.posts,
    };
  });
}

// Calculate detailed ROI data for a campaign
export async function getCampaignROI(
  userId: string, 
  campaignId: string
): Promise<CampaignROIData | null> {
  const campaign = await getCampaignWithMetrics(userId, campaignId);
  if (!campaign) return null;

  const totalSpent = campaign.spent || 0;
  const estimatedRevenue = campaign.totalEngagement * 0.01; // $0.01 per engagement
  const actualRevenue = campaign.revenue || 0;
  const roi = totalSpent > 0 ? ((actualRevenue - totalSpent) / totalSpent) * 100 : 0;
  
  const costPerEngagement = campaign.totalEngagement > 0 ? totalSpent / campaign.totalEngagement : 0;
  const costPerView = campaign.totalViews > 0 ? totalSpent / campaign.totalViews : 0;
  const engagementValue = estimatedRevenue;
  const conversionRate = campaign.totalViews > 0 ? (campaign.totalEngagement / campaign.totalViews) * 100 : 0;

  // Simplified spending breakdown
  const breakdown = {
    contentCreation: totalSpent * 0.4,
    influencerPayments: totalSpent * 0.3,
    adSpend: totalSpent * 0.2,
    other: totalSpent * 0.1,
  };

  return {
    campaignId,
    totalSpent,
    estimatedRevenue,
    actualRevenue,
    roi,
    costPerEngagement,
    costPerView,
    engagementValue,
    conversionRate,
    breakdown,
  };
}

// Update campaign budget and spending
export async function updateCampaignFinancials(
  userId: string,
  campaignId: string,
  data: {
    budget?: number;
    spent?: number;
    revenue?: number;
  }
) {
  return await prisma.campaign.update({
    where: {
      id: campaignId,
      userId,
    },
    data: {
      ...(data.budget !== undefined && { budget: data.budget }),
      // Note: spent and revenue would need to be added to the Campaign model
      // For now, we'll track these in metadata or separate tables
    },
  });
}

// Get campaign performance summary
export async function getCampaignPerformanceSummary(userId: string) {
  const campaigns = await getCampaignsWithMetrics(userId);
  
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const overallROI = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;
  
  const topPerformingCampaigns = campaigns
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5);

  return {
    totalCampaigns,
    activeCampaigns,
    totalBudget,
    totalSpent,
    totalRevenue,
    overallROI,
    remainingBudget: totalBudget - totalSpent,
    topPerformingCampaigns,
  };
}
