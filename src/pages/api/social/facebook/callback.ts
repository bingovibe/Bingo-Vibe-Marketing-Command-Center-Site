
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { facebookAPI } from '../../../../lib/social/facebook';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Authorization code is required' });
      }

      // Exchange code for access token
      const tokenData = await facebookAPI.getAccessToken(code);
      
      // Get long-lived token
      const longLivedToken = await facebookAPI.getLongLivedToken(tokenData.access_token);
      
      // Get user info
      const userInfo = await facebookAPI.getUserInfo(longLivedToken.access_token);

      // Get user pages
      const pages = await facebookAPI.getUserPages(longLivedToken.access_token);

      // Store connection in database
      await prisma.socialConnection.upsert({
        where: {
          userId_platform: {
            userId: session.user.id,
            platform: 'FACEBOOK',
          },
        },
        update: {
          accessToken: longLivedToken.access_token,
          tokenExpiry: longLivedToken.expires_in ? new Date(Date.now() + longLivedToken.expires_in * 1000) : null,
          platformUserId: userInfo.id,
          platformUsername: userInfo.name,
          isActive: true,
          metadata: { pages },
        },
        create: {
          userId: session.user.id,
          platform: 'FACEBOOK',
          accessToken: longLivedToken.access_token,
          tokenExpiry: longLivedToken.expires_in ? new Date(Date.now() + longLivedToken.expires_in * 1000) : null,
          platformUserId: userInfo.id,
          platformUsername: userInfo.name,
          isActive: true,
          metadata: { pages },
        },
      });

      res.status(200).json({ 
        message: 'Facebook account connected successfully',
        user: userInfo,
        pages 
      });
    } catch (error) {
      console.error('Facebook callback error:', error);
      res.status(500).json({ 
        message: 'Failed to connect Facebook account',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
