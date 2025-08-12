
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

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid influencer ID' });
  }

  if (req.method === 'GET') {
    try {
      const influencer = await prisma.influencer.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
        include: {
          outreachEmails: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              campaign: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: {
              outreachEmails: true,
            },
          },
        },
      });

      if (!influencer) {
        return res.status(404).json({ message: 'Influencer not found' });
      }

      res.status(200).json({ influencer });
    } catch (error) {
      console.error('Failed to fetch influencer:', error);
      res.status(500).json({ 
        message: 'Failed to fetch influencer',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'PUT') {
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
        rating,
        isBlacklisted,
      } = req.body;

      const influencer = await prisma.influencer.update({
        where: {
          id,
          userId: session.user.id,
        },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(platform && { platform }),
          ...(handle && { handle }),
          ...(followerCount !== undefined && { followerCount }),
          ...(engagementRate !== undefined && { engagementRate }),
          ...(niche !== undefined && { niche }),
          ...(location !== undefined && { location }),
          ...(contactInfo !== undefined && { contactInfo }),
          ...(tags !== undefined && { tags }),
          ...(notes !== undefined && { notes }),
          ...(rating !== undefined && { rating }),
          ...(isBlacklisted !== undefined && { isBlacklisted }),
        },
        include: {
          _count: {
            select: {
              outreachEmails: true,
            },
          },
        },
      });

      res.status(200).json({ influencer });
    } catch (error) {
      console.error('Failed to update influencer:', error);
      res.status(500).json({ 
        message: 'Failed to update influencer',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.influencer.delete({
        where: {
          id,
          userId: session.user.id,
        },
      });

      res.status(200).json({ message: 'Influencer deleted successfully' });
    } catch (error) {
      console.error('Failed to delete influencer:', error);
      res.status(500).json({ 
        message: 'Failed to delete influencer',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
