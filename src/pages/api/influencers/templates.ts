
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default templates
const defaultTemplates = [
  {
    name: 'Initial Collaboration',
    subject: 'Collaboration Opportunity with {campaign}',
    message: `Hi {name},

I hope this message finds you well! I've been following your content on {platform} (@{handle}) and I'm really impressed with your work.

We have an exciting collaboration opportunity with our upcoming campaign "{campaign}" that I think would be a great fit for your audience of {followers} followers.

We'd love to discuss how we can work together to create authentic content that resonates with your community while achieving our marketing goals.

Would you be interested in learning more about this opportunity? I'd be happy to share more details and discuss potential compensation.

Looking forward to hearing from you!

Best regards,
Bingo Vibe Marketing Team`,
    variables: ['name', 'platform', 'handle', 'followers', 'campaign'],
    isDefault: true,
  },
  {
    name: 'Follow-up Email',
    subject: 'Following up on our collaboration opportunity',
    message: `Hi {name},

I wanted to follow up on my previous email about our collaboration opportunity for the "{campaign}" campaign.

I understand you're probably busy, but I'd love to hear your thoughts when you have a moment. This partnership could be a great way to:

- Showcase your creativity to your {followers} followers
- Earn compensation for your authentic content
- Be part of an exciting brand campaign

If you're interested or have any questions, please don't hesitate to reach out. We're flexible and can work around your schedule and creative style.

Thanks for your time!

Best regards,
Bingo Vibe Marketing Team`,
    variables: ['name', 'campaign', 'followers'],
    isDefault: true,
  },
  {
    name: 'Event Invitation',
    subject: 'Exclusive invitation: {campaign}',
    message: `Hi {name},

We're hosting an exclusive event for the "{campaign}" campaign and would love to have you join us!

As a respected creator in the {platform} community with {followers} followers, your presence would add tremendous value to this gathering.

Event details:
- Date: [TO BE CONFIRMED]
- Location: [TO BE CONFIRMED] 
- What to expect: Networking, content creation opportunities, and exclusive previews

This is a great opportunity to:
- Connect with other creators
- Get first access to our new campaign
- Create unique content for your audience
- Collaborate with our team

Are you interested in attending? I'd be happy to send more details!

Looking forward to your response.

Best regards,
Bingo Vibe Marketing Team`,
    variables: ['name', 'campaign', 'platform', 'followers'],
    isDefault: true,
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const templates = await prisma.outreachTemplate.findMany({
        where: { userId: session.user.id },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      // If no templates exist, create default ones
      if (templates.length === 0) {
        const createdTemplates = await Promise.all(
          defaultTemplates.map(template =>
            prisma.outreachTemplate.create({
              data: {
                ...template,
                userId: session.user.id,
              },
            })
          )
        );
        
        return res.status(200).json({ templates: createdTemplates });
      }

      res.status(200).json({ templates });
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      res.status(500).json({ 
        message: 'Failed to fetch templates',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, subject, message, variables } = req.body;

      if (!name || !subject || !message) {
        return res.status(400).json({ 
          message: 'Name, subject, and message are required' 
        });
      }

      const template = await prisma.outreachTemplate.create({
        data: {
          name,
          subject,
          message,
          variables: variables || [],
          userId: session.user.id,
        },
      });

      res.status(201).json({ template });
    } catch (error) {
      console.error('Failed to create template:', error);
      res.status(500).json({ 
        message: 'Failed to create template',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
