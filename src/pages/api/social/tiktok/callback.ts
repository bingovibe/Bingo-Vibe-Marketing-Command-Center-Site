
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { tiktokAPI } from '../../../../lib/social/tiktok';
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
      const tokenData = await tiktokAPI.getAccessToken(code);
      
      // Get user info
      const userInfo = await tiktokAPI.getUserInfo(tokenData.access_token);

      // Store connection in database
      await prisma.socialConnection.upsert({
        where: {
          userId_platform: {
            userId: session.user.id,
            platform: 'TIKTOK',
          },
        },
        update: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          platformUserId: userInfo.open_id,
          platformUsername: userInfo.display_name,
          isActive: true,
        },
        create: {
          userId: session.user.id,
          platform: 'TIKTOK',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          platformUserId: userInfo.open_id,
          platformUsername: userInfo.display_name,
          isActive: true,
        },
      });

      res.status(200).json({ 
        message: 'TikTok account connected successfully',
        user: userInfo 
      });
    } catch (error) {
      console.error('TikTok callback error:', error);
      res.status(500).json({ 
        message: 'Failed to connect TikTok account',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
