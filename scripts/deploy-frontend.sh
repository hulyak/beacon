#!/bin/bash

# VoiceOps AI - Frontend Deployment Script
# This script deploys the Next.js frontend to Vercel

set -e

echo "🚀 Starting VoiceOps AI frontend deployment..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the voiceops-ai directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the application locally first to catch any build errors
echo "🔨 Building application locally..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update your ElevenLabs agent webhook URLs to point to the deployed frontend"
echo "2. Test the deployed application"
echo "3. Update environment variables if needed using 'vercel env'"
echo ""
echo "🔧 Useful commands:"
echo "  vercel env ls                    # List environment variables"
echo "  vercel env add [name]           # Add environment variable"
echo "  vercel env rm [name]            # Remove environment variable"
echo "  vercel logs                     # View deployment logs"
echo "  vercel domains                  # Manage custom domains"