
import nodemailer from 'nodemailer';

// Email configuration using the provided SMTP credentials
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'agents@bingovibe.info',
    pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '',
  },
  from: process.env.SMTP_FROM || 'agents@bingovibe.info',
};

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransporter(emailConfig);
};

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

// Send email utility function
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: emailConfig.from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Email templates
export const emailTemplates = {
  contentApprovalNeeded: (contentTitle: string, reviewUrl: string) => ({
    subject: `Content Approval Needed: ${contentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Content Approval Required</h2>
        <p>A new piece of content is ready for your review:</p>
        <h3 style="color: #1f2937;">${contentTitle}</h3>
        <p>Please review and approve or request changes:</p>
        <a href="${reviewUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Review Content</a>
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from Bingo Vibe Marketing Command Center.</p>
      </div>
    `,
    text: `Content Approval Needed: ${contentTitle}\n\nA new piece of content is ready for your review. Please visit: ${reviewUrl}`,
  }),

  contentApproved: (contentTitle: string, publishUrl: string) => ({
    subject: `Content Approved: ${contentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Content Approved ✓</h2>
        <p>Your content has been approved and is ready for publishing:</p>
        <h3 style="color: #1f2937;">${contentTitle}</h3>
        <a href="${publishUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">View Content</a>
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from Bingo Vibe Marketing Command Center.</p>
      </div>
    `,
    text: `Content Approved: ${contentTitle}\n\nYour content has been approved and is ready for publishing. View at: ${publishUrl}`,
  }),

  campaignAlert: (campaignName: string, message: string, dashboardUrl: string) => ({
    subject: `Campaign Alert: ${campaignName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Campaign Alert</h2>
        <p><strong>Campaign:</strong> ${campaignName}</p>
        <p>${message}</p>
        <a href="${dashboardUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">View Dashboard</a>
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from Bingo Vibe Marketing Command Center.</p>
      </div>
    `,
    text: `Campaign Alert: ${campaignName}\n\n${message}\n\nView dashboard: ${dashboardUrl}`,
  }),

  influencerOutreach: (influencerName: string, campaignName: string, customMessage: string) => ({
    subject: `Collaboration Opportunity: ${campaignName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Collaboration Opportunity</h2>
        <p>Hello ${influencerName},</p>
        <p>We'd love to collaborate with you on our upcoming campaign: <strong>${campaignName}</strong></p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${customMessage}
        </div>
        <p>We're excited about the possibility of working together and would love to discuss this opportunity further.</p>
        <p>Best regards,<br/>Bingo Vibe Marketing Team</p>
      </div>
    `,
    text: `Hello ${influencerName},\n\nWe'd love to collaborate with you on our upcoming campaign: ${campaignName}\n\n${customMessage}\n\nBest regards,\nBingo Vibe Marketing Team`,
  }),
};

// System notification emails
export const sendContentApprovalNeeded = async (
  to: string,
  contentTitle: string,
  reviewUrl: string
) => {
  const template = emailTemplates.contentApprovalNeeded(contentTitle, reviewUrl);
  await sendEmail({ to, ...template });
};

export const sendContentApproved = async (
  to: string,
  contentTitle: string,
  publishUrl: string
) => {
  const template = emailTemplates.contentApproved(contentTitle, publishUrl);
  await sendEmail({ to, ...template });
};

export const sendCampaignAlert = async (
  to: string,
  campaignName: string,
  message: string,
  dashboardUrl: string
) => {
  const template = emailTemplates.campaignAlert(campaignName, message, dashboardUrl);
  await sendEmail({ to, ...template });
};

export const sendInfluencerOutreach = async (
  to: string,
  influencerName: string,
  campaignName: string,
  customMessage: string
) => {
  const template = emailTemplates.influencerOutreach(influencerName, campaignName, customMessage);
  await sendEmail({ to, ...template });
};
