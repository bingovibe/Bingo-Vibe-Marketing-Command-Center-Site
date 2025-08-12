
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const connections = await prisma.socialConnection.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          platform: true,
          platformUsername: true,
          isActive: true,
          tokenExpiry: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
        },
      });

      res.status(200).json({ connections });
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      res.status(500).json({ 
        message: 'Failed to fetch social connections',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { connectionId } = req.body;
      
      if (!connectionId) {
        return res.status(400).json({ message: 'Connection ID is required' });
      }

      await prisma.socialConnection.delete({
        where: {
          id: connectionId,
          userId: session.user.id, // Ensure user can only delete their own connections
        },
      });

      res.status(200).json({ message: 'Connection removed successfully' });
    } catch (error) {
      console.error('Failed to remove connection:', error);
      res.status(500).json({ 
        message: 'Failed to remove social connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'PUT') {
    try {
      const { connectionId, isActive } = req.body;
      
      if (!connectionId) {
        return res.status(400).json({ message: 'Connection ID is required' });
      }

      const connection = await prisma.socialConnection.update({
        where: {
          id: connectionId,
          userId: session.user.id, // Ensure user can only update their own connections
        },
        data: { isActive: isActive ?? true },
        select: {
          id: true,
          platform: true,
          platformUsername: true,
          isActive: true,
          tokenExpiry: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(200).json({ message: 'Connection updated successfully', connection });
    } catch (error) {
      console.error('Failed to update connection:', error);
      res.status(500).json({ 
        message: 'Failed to update social connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
