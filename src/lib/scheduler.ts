
import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

export class PostScheduler {
  private static jobs: Map<string, cron.ScheduledTask> = new Map()

  static async schedulePost(postId: string, scheduledDate: Date) {
    try {
      // Create cron expression from date
      const cronExpression = this.dateToCron(scheduledDate)
      
      // Cancel existing job if any
      if (this.jobs.has(postId)) {
        this.jobs.get(postId)?.stop()
        this.jobs.delete(postId)
      }

      // Create new scheduled job
      const task = cron.schedule(cronExpression, async () => {
        await this.publishPost(postId)
        this.jobs.delete(postId)
      }, {
        scheduled: false
      })

      this.jobs.set(postId, task)
      task.start()

      console.log(`Post ${postId} scheduled for ${scheduledDate}`)
      return true
    } catch (error) {
      console.error('Error scheduling post:', error)
      return false
    }
  }

  static async cancelScheduledPost(postId: string) {
    try {
      if (this.jobs.has(postId)) {
        this.jobs.get(postId)?.stop()
        this.jobs.delete(postId)
        
        // Update post status in database
        await prisma.post.update({
          where: { id: postId },
          data: { status: 'CANCELLED' }
        })

        console.log(`Cancelled scheduled post ${postId}`)
        return true
      }
      return false
    } catch (error) {
      console.error('Error cancelling scheduled post:', error)
      return false
    }
  }

  private static async publishPost(postId: string) {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { 
          user: true,
          character: true,
          campaign: true
        }
      })

      if (!post) {
        console.error(`Post ${postId} not found`)
        return
      }

      // Update post status to published
      await prisma.post.update({
        where: { id: postId },
        data: { 
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      })

      // Here you would integrate with actual social media APIs
      // For now, we'll just simulate the posting
      console.log(`Published post: ${post.title} on ${post.platform}`)

      // Send notification to user
      await this.notifyUser(post.user.email, post)

      // Initialize metrics tracking
      await prisma.postMetric.create({
        data: {
          postId: post.id,
          views: 0,
          likes: 0,
          shares: 0,
          comments: 0,
          clicks: 0,
          conversions: 0,
          reach: 0,
          impressions: 0
        }
      })

    } catch (error) {
      console.error('Error publishing post:', error)
      
      // Update post status to failed
      await prisma.post.update({
        where: { id: postId },
        data: { status: 'FAILED' }
      }).catch(console.error)
    }
  }

  private static async notifyUser(email: string, post: any) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Post Published Successfully - Bingo Vibe MCC',
        html: `
          <h2>Your post has been published!</h2>
          <p><strong>Title:</strong> ${post.title}</p>
          <p><strong>Platform:</strong> ${post.platform}</p>
          <p><strong>Character:</strong> ${post.character?.name || 'None'}</p>
          <p><strong>Published:</strong> ${new Date().toLocaleString()}</p>
          <p>View your analytics in the <a href="${process.env.APP_URL}/dashboard">Marketing Command Center</a></p>
        `
      }

      await transporter.sendMail(mailOptions)
      console.log(`Notification sent to ${email}`)
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  private static dateToCron(date: Date): string {
    const minute = date.getMinutes()
    const hour = date.getHours()
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    // Format: minute hour day month year
    return `${minute} ${hour} ${day} ${month} *`
  }

  static async getScheduledPosts(userId: string) {
    try {
      return await prisma.post.findMany({
        where: {
          userId,
          status: 'SCHEDULED',
          scheduledAt: {
            gt: new Date()
          }
        },
        include: {
          character: true,
          campaign: true
        },
        orderBy: {
          scheduledAt: 'asc'
        }
      })
    } catch (error) {
      console.error('Error getting scheduled posts:', error)
      return []
    }
  }

  static async initializeScheduler() {
    try {
      // Get all scheduled posts that haven't been published yet
      const scheduledPosts = await prisma.post.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            gt: new Date()
          }
        }
      })

      // Schedule each post
      for (const post of scheduledPosts) {
        if (post.scheduledAt) {
          await this.schedulePost(post.id, post.scheduledAt)
        }
      }

      console.log(`Initialized scheduler with ${scheduledPosts.length} posts`)
    } catch (error) {
      console.error('Error initializing scheduler:', error)
    }
  }

  // Optimal posting times for different platforms
  static getOptimalTimes(platform: string): string[] {
    const times = {
      'TIKTOK': ['09:00', '18:00', '19:00'],
      'INSTAGRAM': ['11:00', '14:00', '17:00'],
      'FACEBOOK': ['13:00', '15:00', '16:00'],
      'YOUTUBE': ['14:00', '20:00', '21:00']
    }

    return times[platform as keyof typeof times] || times.INSTAGRAM
  }
}

// Initialize scheduler on startup
PostScheduler.initializeScheduler()

// Export the function that the API endpoint expects
export interface PublishResult {
  success: boolean
  platformPostId?: string
  error?: string
}

export async function publishToSocialMedia(post: any): Promise<PublishResult> {
  try {
    // For now, this is a mock implementation
    // In a real application, you would integrate with actual social media APIs
    // like Facebook Graph API, Instagram Basic Display API, TikTok API, YouTube Data API, etc.
    
    const delay = Math.random() * 1000 + 500; // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Simulate different success rates for different platforms
    const successRates = {
      'TIKTOK': 0.95,
      'INSTAGRAM': 0.92,
      'FACEBOOK': 0.96,
      'YOUTUBE': 0.88
    }
    
    const platform = post.platform.toUpperCase()
    const successRate = successRates[platform as keyof typeof successRates] || 0.90
    const isSuccess = Math.random() < successRate
    
    if (isSuccess) {
      // Generate a mock platform post ID
      const platformPostId = `${platform.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      console.log(`Successfully published post "${post.title}" to ${post.platform}`)
      console.log(`Platform Post ID: ${platformPostId}`)
      
      return {
        success: true,
        platformPostId
      }
    } else {
      // Simulate various failure reasons
      const errors = [
        'Rate limit exceeded',
        'Invalid access token',
        'Content violates community guidelines',
        'Network timeout',
        'Platform API temporarily unavailable'
      ]
      
      const error = errors[Math.floor(Math.random() * errors.length)]
      
      console.error(`Failed to publish post "${post.title}" to ${post.platform}: ${error}`)
      
      return {
        success: false,
        error
      }
    }
    
  } catch (error) {
    console.error('Error in publishToSocialMedia:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Helper function to get platform-specific posting requirements
export function getPlatformRequirements(platform: string) {
  const requirements = {
    'TIKTOK': {
      maxLength: 150,
      maxHashtags: 5,
      supportedFormats: ['VIDEO'],
      optimalTimes: ['18:00-21:00']
    },
    'INSTAGRAM': {
      maxLength: 2200,
      maxHashtags: 30,
      supportedFormats: ['IMAGE', 'VIDEO', 'STORY', 'REEL'],
      optimalTimes: ['11:00-13:00', '17:00-19:00']
    },
    'FACEBOOK': {
      maxLength: 63206,
      maxHashtags: 10,
      supportedFormats: ['TEXT', 'IMAGE', 'VIDEO'],
      optimalTimes: ['13:00-16:00']
    },
    'YOUTUBE': {
      maxLength: 5000,
      maxHashtags: 15,
      supportedFormats: ['VIDEO'],
      optimalTimes: ['14:00-16:00', '20:00-22:00']
    }
  }
  
  return requirements[platform.toUpperCase() as keyof typeof requirements] || requirements['FACEBOOK']
}
