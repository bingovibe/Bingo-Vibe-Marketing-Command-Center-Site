
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { 
  sendContentApprovalNeeded,
  sendContentApproved,
  sendCampaignAlert,
  sendInfluencerOutreach 
} from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { type, data } = req.body;
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;

    switch (type) {
      case 'content_approval_needed':
        await sendContentApprovalNeeded(
          data.to,
          data.contentTitle,
          `${baseUrl}/approvals/${data.contentId}`
        );
        break;

      case 'content_approved':
        await sendContentApproved(
          data.to,
          data.contentTitle,
          `${baseUrl}/content/${data.contentId}`
        );
        break;

      case 'campaign_alert':
        await sendCampaignAlert(
          data.to,
          data.campaignName,
          data.message,
          `${baseUrl}/campaigns/${data.campaignId}`
        );
        break;

      case 'influencer_outreach':
        await sendInfluencerOutreach(
          data.to,
          data.influencerName,
          data.campaignName,
          data.message
        );
        break;

      default:
        return res.status(400).json({ message: 'Invalid notification type' });
    }

    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Notification failed:', error);
    res.status(500).json({ 
      message: 'Failed to send notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
