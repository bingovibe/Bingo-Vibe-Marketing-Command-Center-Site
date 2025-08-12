
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { getCampaignWithMetrics, getCampaignROI } from '../../../../lib/campaigns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid campaign ID' });
    }

    const [campaign, roiData] = await Promise.all([
      getCampaignWithMetrics(session.user.id, id),
      getCampaignROI(session.user.id, id),
    ]);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.status(200).json({ campaign, roiData });
  } catch (error) {
    console.error('Campaign metrics error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch campaign metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
