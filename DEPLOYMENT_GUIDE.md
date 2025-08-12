
# Bingo Vibe Marketing Command Center - Vercel Deployment Guide

Complete step-by-step instructions for deploying your Marketing Command Center to Vercel with custom domain support.

## 📋 Prerequisites

- [Vercel account](https://vercel.com/signup) (free tier works)
- [GitHub repository](https://github.com) with your project code
- Custom domain name (optional)
- Access to your domain's DNS settings (if using custom domain)

## 🚀 Part 1: Prepare Your Project

### Step 1: Upload Project to GitHub

1. Create a new GitHub repository
2. Upload/push your project files (make sure to exclude node_modules, .next, etc.)
3. Ensure all files from this deployment package are included

### Step 2: Clean Project Structure

Your project should have this structure:
```
bingo-vibe-mcc/
├── src/
├── prisma/
├── public/
├── scripts/
├── package.json
├── vercel.json
├── next.config.production.ts
├── .env.production.example
└── DEPLOYMENT_GUIDE.md
```

## 🔧 Part 2: Deploy to Vercel

### Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project

### Step 2: Configure Build Settings

1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: Leave as `.` (root)
3. **Build Command**: `npx prisma generate && npm run build`
4. **Install Command**: `npm install`
5. Click "Deploy"

## 🗄️ Part 3: Set Up Vercel PostgreSQL Database

### Important: Vercel PostgreSQL is now powered by Neon

Vercel has transitioned all PostgreSQL databases to use Neon's native integration, offering better features like database branching, instant restores, and improved scaling.

### Step 1: Add PostgreSQL Integration

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database** or **Connect Database**
3. Under "Create New" tab, select **PostgreSQL** (powered by Neon)
4. Choose region closest to your users (recommended: `us-east-1` for best performance)
5. Name your database and click **Create**

### Step 2: Automatic Environment Variable Setup

Vercel automatically injects these environment variables into your project:
- `POSTGRES_URL` - Direct connection (for migrations and admin tasks)
- `POSTGRES_PRISMA_URL` - Connection pooled URL (recommended for app queries)
- `POSTGRES_URL_NON_POOLING` - Direct connection without pooling

### Step 3: Access Neon Console (Optional)

1. In your Vercel Storage tab, click **Open in Neon**
2. This gives you access to advanced features like:
   - Database branching for development workflows
   - Instant database restores
   - Advanced monitoring and analytics
   - Read replicas (Pro plans)

## ⚙️ Part 4: Configure Environment Variables

### Step 1: Add Environment Variables in Vercel

**Important:** Environment variable changes only apply to NEW deployments. After adding/updating variables, you must redeploy your application.

Go to your project → **Settings** → **Environment Variables** and add:

```bash
# Database
DATABASE_URL=postgres://default:YOUR_PASSWORD@YOUR_HOST.postgres.vercel-storage.com:5432/verceldb?sslmode=require

# NextAuth
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://your-project.vercel.app

# SMTP (Email)
SMTP_HOST=mail.bingovibe.info
SMTP_PORT=465
SMTP_USER=agents@bingovibe.info
SMTP_PASS=^cx&^c12^b]2

# App Configuration
APP_URL=https://your-project.vercel.app
```

### Step 2: Generate NextAuth Secret

Visit [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) to generate a secure secret.

### Step 3: Update URLs

Replace `your-project.vercel.app` with your actual Vercel deployment URL.

## 🗃️ Part 5: Initialize Database

### Step 1: Redeploy with Environment Variables

1. After adding environment variables, trigger a new deployment
2. Go to **Deployments** tab → click **Redeploy** on the latest deployment

### Step 2: Set Up Database Schema

Option A - Using Vercel CLI (Recommended):
```bash
# Install Vercel CLI
npm install -g vercel

# Login to your Vercel account
vercel login

# Link to your project
vercel link

# Run database setup
vercel env pull .env.production
npx prisma generate
npx prisma db push
npm run seed
```

Option B - Using Vercel Function URL:
1. Create a temporary API endpoint for database setup
2. Visit `https://your-project.vercel.app/api/setup-db` to initialize
3. Remove the setup endpoint after use

## 🌐 Part 6: Custom Domain Setup (Optional)

### Step 1: Add Domain in Vercel

1. Go to your project → **Settings** → **Domains**
2. Add your custom domain (e.g., `marketing.yourdomain.com`)
3. Vercel will show DNS configuration required

### Step 2: Configure DNS

Add these DNS records in your domain provider:

**For subdomain (marketing.yourdomain.com):**
- Type: `CNAME`
- Name: `marketing`
- Value: `cname.vercel-dns.com`

**For root/apex domain (yourdomain.com):**
- Type: `A`
- Name: `@` or leave blank
- Value: `76.76.21.21`

**Alternative: Use Vercel Nameservers (Recommended for advanced features)**
If you want full DNS control and wildcard domain support:
1. In your domain registrar, change nameservers to:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
2. Manage all DNS records through Vercel dashboard
3. This enables wildcard domains (*.yourdomain.com) if needed

### Step 3: Update Environment Variables

Update these variables with your custom domain:
```bash
NEXTAUTH_URL=https://marketing.yourdomain.com
APP_URL=https://marketing.yourdomain.com
```

Redeploy after updating environment variables.

## ✅ Part 7: Verify Deployment

### Step 1: Test Core Functionality

1. **Access Dashboard**: Visit your deployment URL
2. **Login Test**: Use admin credentials:
   - Email: `admin@bingovibe.info`
   - Password: `admin123`
3. **Change Admin Password**: Go to Settings → Update credentials

### Step 2: Test API Endpoints

Check these critical endpoints:
- `GET /api/users/me` - User authentication
- `POST /api/content/generate` - Content generation
- `GET /api/campaigns` - Campaign management
- `POST /api/influencers` - Influencer management

### Step 3: Test Features

- ✅ User login/logout
- ✅ Dashboard loading
- ✅ Content creation
- ✅ Campaign management
- ✅ Influencer database
- ✅ Calendar functionality
- ✅ Email templates
- ✅ Analytics dashboard

## 🔧 Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`
**Solution**: 
- Verify DATABASE_URL is correctly formatted
- Ensure database is created and accessible
- Check Vercel PostgreSQL status

### Build Failures

**Error**: `Prisma client not generated`
**Solution**:
- Update build command: `npx prisma generate && npm run build`
- Ensure Prisma is in dependencies, not devDependencies

### Authentication Issues  

**Error**: `NEXTAUTH_URL mismatch`
**Solution**:
- Ensure NEXTAUTH_URL matches your deployment URL exactly
- Include `https://` protocol
- No trailing slash

### SMTP/Email Issues

**Error**: Email sending fails
**Solution**:
- Verify SMTP credentials are correct
- Check if Vercel allows outbound SMTP (port 465)
- Consider using Vercel's email service for production

## 🔒 Security Checklist

- [ ] Changed default admin password
- [ ] Generated secure NEXTAUTH_SECRET
- [ ] Updated all placeholder URLs
- [ ] Verified SMTP credentials are secure
- [ ] Enabled HTTPS (automatic with Vercel)
- [ ] Set up proper environment variable scoping

## 🚀 Production Recommendations

1. **Monitor Performance**: Use Vercel Analytics
2. **Set up Alerts**: Configure error monitoring
3. **Regular Backups**: Export database periodically  
4. **Update Dependencies**: Keep packages current
5. **Scale Planning**: Monitor usage for plan upgrades

## 📞 Support Information

**Default Admin Credentials** (Change after first login):
- Email: `admin@bingovibe.info`
- Password: `admin123`

**Built-in Features**:
- 5 Brand Characters (Zara, Caven, Grandma Rose, Coach Martinez, Founder)
- 18 API Endpoints
- Full campaign management
- Influencer outreach system
- Content scheduling
- Analytics dashboard

---

## 📝 Quick Reference Commands

```bash
# Redeploy
vercel --prod

# Check logs
vercel logs

# Environment variables
vercel env ls

# Database reset (careful!)
npx prisma db push --force-reset
npm run seed
```

---

**Deployment completed successfully!** 🎉

Your Bingo Vibe Marketing Command Center is now live and ready for action.
