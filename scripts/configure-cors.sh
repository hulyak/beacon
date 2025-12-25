#!/bin/bash

# VoiceOps AI - CORS Configuration Script
# This script configures CORS policies for Cloud Functions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 VoiceOps AI CORS Configuration${NC}"
echo "=================================="

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-""}
REGION=${VERTEX_AI_LOCATION:-"us-central1"}

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: GOOGLE_CLOUD_PROJECT environment variable is not set${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo ""

# Function names
FUNCTIONS=(
    "voiceops-analyze-risks"
    "voiceops-run-scenario"
    "voiceops-get-alerts"
    "voiceops-health"
)

# Allowed origins (add your domains here)
ALLOWED_ORIGINS=(
    "http://localhost:3000"
    "https://voiceops-ai.vercel.app"
    "https://*.vercel.app"
    "https://api.elevenlabs.io"
)

echo -e "${YELLOW}🌐 Configuring CORS for Cloud Functions...${NC}"

for function_name in "${FUNCTIONS[@]}"; do
    echo -e "${YELLOW}📦 Configuring CORS for $function_name...${NC}"
    
    # Check if function exists
    if ! gcloud functions describe "$function_name" --region="$REGION" --quiet > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Function $function_name not found, skipping...${NC}"
        continue
    fi
    
    # Update function with CORS environment variables
    gcloud functions deploy "$function_name" \
        --region="$REGION" \
        --update-env-vars="CORS_ORIGINS=$(IFS=,; echo "${ALLOWED_ORIGINS[*]}")" \
        --quiet
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ CORS configured for $function_name${NC}"
    else
        echo -e "${RED}❌ Failed to configure CORS for $function_name${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 CORS configuration completed!${NC}"
echo ""
echo -e "${BLUE}📋 Configured Origins:${NC}"
for origin in "${ALLOWED_ORIGINS[@]}"; do
    echo "  - $origin"
done
echo ""
echo -e "${YELLOW}⚠️  Note:${NC}"
echo "CORS is handled in the function code. This script sets environment variables"
echo "that the functions use to determine allowed origins."
echo ""
echo -e "${BLUE}To add more origins:${NC}"
echo "1. Edit this script and add to ALLOWED_ORIGINS array"
echo "2. Run this script again"
echo "3. Or manually update function environment variables"