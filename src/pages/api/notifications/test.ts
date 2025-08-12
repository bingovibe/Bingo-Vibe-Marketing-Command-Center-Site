
import { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ message: 'Missing required fields: to, subject, message' });
    }

    await sendEmail({
      to,
      subject: `Test: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Test Email from Bingo Vibe MCC</h2>
          <p>${message}</p>
          <p style="color: #6b7280; font-size: 14px;">
            Sent at: ${new Date().toLocaleString()}<br/>
            This is a test message from the Bingo Vibe Marketing Command Center.
          </p>
        </div>
      `,
      text: `Test Email: ${message}\n\nSent at: ${new Date().toLocaleString()}`,
    });

    res.status(200).json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email failed:', error);
    res.status(500).json({ 
      message: 'Failed to send test email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
