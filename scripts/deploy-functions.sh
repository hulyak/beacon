#!/bin/bash

# Beacon - Google Cloud Functions Deployment Script
# Voice-First AI Supply Chain Intelligence Platform
# AI Partner Catalyst Hackathon - ElevenLabs + Google Cloud

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"divine-bruin-482109-m8"}
REGION=${VERTEX_AI_LOCATION:-"us-central1"}
RUNTIME="nodejs20"

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           🔦 BEACON - Cloud Functions Deploy              ║"
echo "║     Voice-First AI Supply Chain Intelligence             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Runtime: $RUNTIME"
echo ""

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Error: Not authenticated with gcloud${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo -e "${YELLOW}🔧 Setting project to $PROJECT_ID...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudfunctions.googleapis.com --quiet
gcloud services enable aiplatform.googleapis.com --quiet
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet

echo -e "${GREEN}✅ APIs enabled${NC}"
echo ""

# Deploy functions from the deploy directory
echo -e "${BLUE}🚀 Deploying Cloud Functions...${NC}"
echo ""

DEPLOY_DIR="functions/deploy"

# Array of functions to deploy
declare -a FUNCTIONS=("analyze-risks" "run-scenario" "get-alerts" "get-metrics" "get-network")

for func in "${FUNCTIONS[@]}"; do
    echo -e "${YELLOW}📦 Deploying $func...${NC}"

    if [ -d "$DEPLOY_DIR/$func" ]; then
        gcloud functions deploy $func \
            --gen2 \
            --runtime=$RUNTIME \
            --region=$REGION \
            --source="$DEPLOY_DIR/$func" \
            --entry-point=handler \
            --trigger-http \
            --allow-unauthenticated \
            --memory=512MB \
            --timeout=60s \
            --max-instances=100 \
            --min-instances=0 \
            --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,VERTEX_AI_LOCATION=$REGION" \
            --quiet

        echo -e "${GREEN}✅ $func deployed${NC}"
    else
        echo -e "${RED}❌ Directory not found: $DEPLOY_DIR/$func${NC}"
    fi
    echo ""
done

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           🎉 Deployment Complete!                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Get all function URLs
echo -e "${BLUE}📋 Deployed Function URLs:${NC}"
echo "=================================="

BASE_URL="https://$REGION-$PROJECT_ID.cloudfunctions.net"

echo -e "${GREEN}analyze-risks:${NC}  $BASE_URL/analyze-risks"
echo -e "${GREEN}run-scenario:${NC}   $BASE_URL/run-scenario"
echo -e "${GREEN}get-alerts:${NC}     $BASE_URL/get-alerts"
echo -e "${GREEN}get-metrics:${NC}    $BASE_URL/get-metrics"
echo -e "${GREEN}get-network:${NC}    $BASE_URL/get-network"
echo ""

echo -e "${BLUE}📝 Environment Variables for Vercel:${NC}"
echo "=================================="
echo "NEXT_PUBLIC_ANALYZE_RISKS_URL=$BASE_URL/analyze-risks"
echo "NEXT_PUBLIC_RUN_SCENARIO_URL=$BASE_URL/run-scenario"
echo "NEXT_PUBLIC_GET_ALERTS_URL=$BASE_URL/get-alerts"
echo "NEXT_PUBLIC_GET_METRICS_URL=$BASE_URL/get-metrics"
echo "NEXT_PUBLIC_GET_NETWORK_URL=$BASE_URL/get-network"
echo ""

echo -e "${CYAN}🔦 Beacon is ready for voice-first supply chain intelligence!${NC}"
