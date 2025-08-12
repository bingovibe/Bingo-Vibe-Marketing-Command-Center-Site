
#!/bin/bash

# Bingo Vibe Marketing Command Center - Vercel Deployment Setup Script
# Run this script after deploying to Vercel to set up the database

echo "🚀 Setting up Bingo Vibe Marketing Command Center on Vercel..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema to Vercel Postgres
echo "🗃️ Setting up database schema..."
npx prisma db push --force-reset

# Seed the database
echo "🌱 Seeding database with initial data..."
npm run seed

echo "✅ Vercel setup complete!"
echo ""
echo "🔗 Your Marketing Command Center is ready!"
echo "📧 Default admin login: admin@bingovibe.info / admin123"
echo "⚠️  Remember to change the admin password after first login!"
echo ""
echo "🎯 Next steps:"
echo "1. Test all API endpoints"
echo "2. Configure custom domain (if applicable)"
echo "3. Update admin credentials"
echo "4. Test SMTP email functionality"
