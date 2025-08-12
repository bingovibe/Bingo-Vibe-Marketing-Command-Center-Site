
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { 
        platform, 
        minFollowers, 
        maxFollowers, 
        minEngagement, 
        niche, 
        search,
        limit = '50',
        offset = '0'
      } = req.query;

      const filters: any = {
        userId: session.user.id,
        isBlacklisted: false,
      };

      // Platform filter
      if (platform && platform !== 'all') {
        filters.platform = platform;
      }

      // Follower count filters
      if (minFollowers || maxFollowers) {
        filters.followerCount = {};
        if (minFollowers) filters.followerCount.gte = parseInt(minFollowers as string);
        if (maxFollowers) filters.followerCount.lte = parseInt(maxFollowers as string);
      }

      // Engagement rate filter
      if (minEngagement) {
        filters.engagementRate = { gte: parseFloat(minEngagement as string) };
      }

      // Niche filter
      if (niche) {
        filters.niche = { contains: niche, mode: 'insensitive' };
      }

      // Search filter
      if (search) {
        filters.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { handle: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const influencers = await prisma.influencer.findMany({
        where: filters,
        include: {
          _count: {
            select: {
              outreachEmails: true,
            },
          },
        },
        orderBy: [
          { rating: 'desc' },
          { followerCount: 'desc' },
        ],
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      });

      const total = await prisma.influencer.count({ where: filters });

      res.status(200).json({ influencers, total });
    } catch (error) {
      console.error('Failed to fetch influencers:', error);
      res.status(500).json({ 
        message: 'Failed to fetch influencers',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        name,
        email,
        platform,
        handle,
        followerCount,
        engagementRate,
        niche,
        location,
        contactInfo,
        tags,
        notes,
      } = req.body;

      if (!name || !email || !platform || !handle) {
        return res.status(400).json({ 
          message: 'Name, email, platform, and handle are required' 
        });
      }

      const influencer = await prisma.influencer.create({
        data: {
          name,
          email,
          platform,
          handle,
          followerCount: followerCount || 0,
          engagementRate: engagementRate || 0,
          niche,
          location,
          contactInfo,
          tags: tags || [],
          notes,
          userId: session.user.id,
        },
        include: {
          _count: {
            select: {
              outreachEmails: true,
            },
          },
        },
      });

      res.status(201).json({ influencer });
    } catch (error) {
      console.error('Failed to create influencer:', error);
      
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return res.status(409).json({ 
          message: 'An influencer with this email already exists' 
        });
      }

      res.status(500).json({ 
        message: 'Failed to create influencer',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
