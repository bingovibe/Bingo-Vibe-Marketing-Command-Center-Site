
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { sendInfluencerOutreach } from '../../../lib/email';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const {
        influencerIds,
        campaignId,
        templateId,
        subject,
        message,
        scheduledFor,
        sendImmediately = false,
      } = req.body;

      if (!influencerIds || !Array.isArray(influencerIds) || influencerIds.length === 0) {
        return res.status(400).json({ message: 'Influencer IDs are required' });
      }

      if (!subject || !message) {
        return res.status(400).json({ message: 'Subject and message are required' });
      }

      // Get influencers
      const influencers = await prisma.influencer.findMany({
        where: {
          id: { in: influencerIds },
          userId: session.user.id,
          isBlacklisted: false,
        },
      });

      if (influencers.length === 0) {
        return res.status(404).json({ message: 'No valid influencers found' });
      }

      // Get campaign name if provided
      let campaignName = 'New Collaboration Opportunity';
      if (campaignId) {
        const campaign = await prisma.campaign.findFirst({
          where: { id: campaignId, userId: session.user.id },
        });
        if (campaign) {
          campaignName = campaign.name;
        }
      }

      const outreachEmails = [];

      // Create outreach records and send emails
      for (const influencer of influencers) {
        try {
          // Replace variables in message
          const personalizedMessage = message
            .replace(/\{name\}/g, influencer.name)
            .replace(/\{handle\}/g, influencer.handle)
            .replace(/\{platform\}/g, influencer.platform)
            .replace(/\{followers\}/g, influencer.followerCount.toLocaleString());

          const personalizedSubject = subject
            .replace(/\{name\}/g, influencer.name)
            .replace(/\{handle\}/g, influencer.handle)
            .replace(/\{campaign\}/g, campaignName);

          // Create outreach record
          const outreachEmail = await prisma.outreachEmail.create({
            data: {
              influencerId: influencer.id,
              campaignId,
              templateId,
              subject: personalizedSubject,
              message: personalizedMessage,
              status: sendImmediately ? 'SENT' : 'PENDING',
              sentAt: sendImmediately ? new Date() : null,
              scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
              userId: session.user.id,
            },
            include: {
              influencer: {
                select: { name: true, email: true },
              },
            },
          });

          // Send email immediately if requested
          if (sendImmediately) {
            try {
              await sendInfluencerOutreach(
                influencer.email,
                influencer.name,
                campaignName,
                personalizedMessage
              );

              // Update lastContactDate
              await prisma.influencer.update({
                where: { id: influencer.id },
                data: { lastContactDate: new Date() },
              });
            } catch (emailError) {
              console.error(`Failed to send email to ${influencer.email}:`, emailError);
              
              // Update status to indicate failure
              await prisma.outreachEmail.update({
                where: { id: outreachEmail.id },
                data: { status: 'PENDING' }, // Reset to pending so it can be retried
              });
            }
          }

          outreachEmails.push(outreachEmail);
        } catch (error) {
          console.error(`Failed to process outreach for influencer ${influencer.id}:`, error);
        }
      }

      res.status(201).json({
        message: `Outreach ${sendImmediately ? 'sent' : 'scheduled'} to ${outreachEmails.length} influencers`,
        outreachEmails,
      });
    } catch (error) {
      console.error('Failed to create outreach:', error);
      res.status(500).json({ 
        message: 'Failed to create outreach',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'GET') {
    try {
      const { 
        status, 
        campaignId, 
        influencerId, 
        limit = '50', 
        offset = '0' 
      } = req.query;

      const filters: any = {
        userId: session.user.id,
      };

      if (status) filters.status = status;
      if (campaignId) filters.campaignId = campaignId;
      if (influencerId) filters.influencerId = influencerId;

      const outreachEmails = await prisma.outreachEmail.findMany({
        where: filters,
        include: {
          influencer: {
            select: {
              id: true,
              name: true,
              email: true,
              platform: true,
              handle: true,
              followerCount: true,
            },
          },
          campaign: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      });

      const total = await prisma.outreachEmail.count({ where: filters });

      res.status(200).json({ outreachEmails, total });
    } catch (error) {
      console.error('Failed to fetch outreach emails:', error);
      res.status(500).json({ 
        message: 'Failed to fetch outreach emails',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
