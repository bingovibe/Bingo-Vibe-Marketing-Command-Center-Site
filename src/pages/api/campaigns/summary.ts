
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getCampaignPerformanceSummary } from '../../../lib/campaigns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const summary = await getCampaignPerformanceSummary(session.user.id);
    res.status(200).json(summary);
  } catch (error) {
    console.error('Campaign summary error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch campaign summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
