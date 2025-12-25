#!/bin/bash

# Beacon - Frontend Deployment Script
# Voice-First AI Supply Chain Intelligence Platform
# AI Partner Catalyst Hackathon - ElevenLabs + Google Cloud

set -e

# Colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           🔦 BEACON - Frontend Deploy                     ║"
echo "║     Voice-First AI Supply Chain Intelligence             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found.${NC}"
    echo "Please run this script from the voiceops-ai directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Build the application locally first to catch any build errors
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Deploy to Vercel
echo -e "${YELLOW}🌐 Deploying to Vercel...${NC}"
vercel --prod

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           🎉 Deployment Complete!                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}📋 Live Application:${NC}"
echo "   https://beacon-voiceops.vercel.app"
echo ""

echo -e "${CYAN}📋 Required Environment Variables:${NC}"
echo "=================================="
echo "NEXT_PUBLIC_ELEVENLABS_AGENT_ID     - Your ElevenLabs agent ID"
echo "NEXT_PUBLIC_ENABLE_VOICE            - Set to 'true'"
echo "NEXT_PUBLIC_ANALYZE_RISKS_URL       - Cloud Function URL"
echo "NEXT_PUBLIC_RUN_SCENARIO_URL        - Cloud Function URL"
echo "NEXT_PUBLIC_GET_ALERTS_URL          - Cloud Function URL"
echo "NEXT_PUBLIC_GET_METRICS_URL         - Cloud Function URL"
echo "NEXT_PUBLIC_GET_NETWORK_URL         - Cloud Function URL"
echo ""

echo -e "${CYAN}🔧 Useful Vercel Commands:${NC}"
echo "  vercel env ls              - List environment variables"
echo "  vercel env add [name]      - Add environment variable"
echo "  vercel logs                - View deployment logs"
echo "  vercel domains             - Manage custom domains"
echo ""

echo -e "${CYAN}🔦 Beacon is live and ready for voice-first supply chain intelligence!${NC}"
