#!/bin/bash

# VoiceOps - Google Cloud Functions Deployment Script
# This script deploys all three Cloud Functions to Google Cloud

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-""}
REGION=${VERTEX_AI_LOCATION:-"us-central1"}
RUNTIME="nodejs20"

echo -e "${BLUE}🚀 VoiceOps Cloud Functions Deployment${NC}"
echo "=================================="

# Check if PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: GOOGLE_CLOUD_PROJECT environment variable is not set${NC}"
    echo "Please set it with: export GOOGLE_CLOUD_PROJECT=your-project-id"
    exit 1
fi

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
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable eventarc.googleapis.com

# Set up IAM permissions for Cloud Functions
echo -e "${YELLOW}🔐 Setting up IAM permissions...${NC}"

# Get the default compute service account
COMPUTE_SA="${PROJECT_ID}-compute@developer.gserviceaccount.com"

# Grant Vertex AI User role to the compute service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="roles/aiplatform.user" \
    --quiet

# Grant Cloud Functions Invoker role for health checks
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="roles/cloudfunctions.invoker" \
    --quiet

echo -e "${GREEN}✅ IAM permissions configured${NC}"

# Function to deploy a Cloud Function
deploy_function() {
    local function_name=$1
    local source_dir=$2
    local entry_point=$3
    local description=$4
    
    echo -e "${YELLOW}📦 Deploying $function_name...${NC}"
    
    cd "functions/$source_dir"
    
    # Build TypeScript
    echo "  Building TypeScript..."
    npm run build
    
    # Deploy function with enhanced configuration
    gcloud functions deploy $function_name \
        --gen2 \
        --runtime=$RUNTIME \
        --region=$REGION \
        --source=. \
        --entry-point=$entry_point \
        --trigger-http \
        --allow-unauthenticated \
        --memory=1GB \
        --timeout=60s \
        --max-instances=100 \
        --min-instances=0 \
        --concurrency=80 \
        --cpu=1 \
        --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,VERTEX_AI_LOCATION=$REGION,GEMINI_MODEL=gemini-1.5-flash,NODE_ENV=production" \
        --description="$description" \
        --ingress-settings=all \
        --egress-settings=all
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $function_name deployed successfully${NC}"
        
        # Get the function URL
        FUNCTION_URL=$(gcloud functions describe $function_name --region=$REGION --format="value(serviceConfig.uri)")
        echo -e "${BLUE}🔗 Function URL: $FUNCTION_URL${NC}"
        echo ""
    else
        echo -e "${RED}❌ Failed to deploy $function_name${NC}"
        exit 1
    fi
    
    cd ../..
}

# Deploy all functions
echo -e "${BLUE}🚀 Starting deployment...${NC}"
echo ""

deploy_function "voiceops-analyze-risks" "analyze-risks" "analyzeRisks" "VoiceOps Risk Analysis Service"
deploy_function "voiceops-run-scenario" "run-scenario" "runScenario" "VoiceOps Scenario Simulation Service"
deploy_function "voiceops-get-alerts" "get-alerts" "getAlerts" "VoiceOps Alert Management Service"

# Deploy health check function
echo -e "${YELLOW}📦 Deploying health check endpoint...${NC}"

cd functions/health
gcloud functions deploy voiceops-health \
    --gen2 \
    --runtime=$RUNTIME \
    --region=$REGION \
    --source=. \
    --entry-point=health \
    --trigger-http \
    --allow-unauthenticated \
    --memory=256MB \
    --timeout=10s \
    --max-instances=10 \
    --min-instances=0 \
    --concurrency=100 \
    --cpu=0.5 \
    --set-env-vars="NODE_ENV=production" \
    --description="VoiceOps Health Check Service"
cd ../..

echo -e "${GREEN}🎉 All functions deployed successfully!${NC}"
echo ""

# Get all function URLs
echo -e "${BLUE}📋 Function URLs:${NC}"
echo "=================================="

ANALYZE_RISKS_URL=$(gcloud functions describe voiceops-analyze-risks --region=$REGION --format="value(serviceConfig.uri)")
RUN_SCENARIO_URL=$(gcloud functions describe voiceops-run-scenario --region=$REGION --format="value(serviceConfig.uri)")
GET_ALERTS_URL=$(gcloud functions describe voiceops-get-alerts --region=$REGION --format="value(serviceConfig.uri)")
HEALTH_URL=$(gcloud functions describe voiceops-health --region=$REGION --format="value(serviceConfig.uri)")

echo -e "${GREEN}Risk Analysis:${NC} $ANALYZE_RISKS_URL"
echo -e "${GREEN}Run Scenario:${NC} $RUN_SCENARIO_URL"
echo -e "${GREEN}Get Alerts:${NC} $GET_ALERTS_URL"
echo -e "${GREEN}Health Check:${NC} $HEALTH_URL"
echo ""

# Create environment file for frontend
echo -e "${YELLOW}📝 Creating environment file for frontend...${NC}"
cat > .env.production << EOF
# VoiceOps Production Environment Variables
# Generated by deploy-functions.sh on $(date)

# ElevenLabs Configuration
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app

# Google Cloud Functions URLs
NEXT_PUBLIC_ANALYZE_RISKS_URL=$ANALYZE_RISKS_URL
NEXT_PUBLIC_RUN_SCENARIO_URL=$RUN_SCENARIO_URL
NEXT_PUBLIC_GET_ALERTS_URL=$GET_ALERTS_URL
NEXT_PUBLIC_HEALTH_URL=$HEALTH_URL
EOF

echo -e "${GREEN}✅ Environment file created: .env.production${NC}"
echo ""

# Test the functions
echo -e "${YELLOW}🧪 Testing deployed functions...${NC}"

echo "Testing health endpoint..."
if curl -s -f "$HEALTH_URL" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi

echo "Testing analyze-risks endpoint..."
if curl -s -f -X POST "$ANALYZE_RISKS_URL" \
    -H "Content-Type: application/json" \
    -d '{"region": "asia", "category": "all"}' > /dev/null; then
    echo -e "${GREEN}✅ Analyze risks endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️  Analyze risks endpoint may need warm-up${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update your frontend environment variables:"
echo "   - Copy the URLs above to your Vercel environment variables"
echo "   - Or use the generated .env.production file"
echo "2. Configure your ElevenLabs agent with these webhook URLs:"
echo "   - analyze_risks: $ANALYZE_RISKS_URL"
echo "   - run_scenario: $RUN_SCENARIO_URL"
echo "   - get_alerts: $GET_ALERTS_URL"
echo "3. Deploy your frontend to Vercel"
echo "4. Test the complete integration"
echo ""
echo -e "${YELLOW}⚠️  Production checklist:${NC}"
echo "- ✅ Functions deployed with proper IAM permissions"
echo "- ✅ CORS headers configured for cross-origin requests"
echo "- ✅ Health check endpoint available"
echo "- ⚠️  Set up monitoring and alerting"
echo "- ⚠️  Configure custom domain (optional)"
echo "- ⚠️  Set up proper authentication for production (if needed)"
echo "- ⚠️  Review and adjust memory/timeout settings based on usage"
echo ""
echo -e "${BLUE}Monitoring commands:${NC}"
echo "gcloud functions logs read voiceops-analyze-risks --region=$REGION"
echo "gcloud functions logs read voiceops-run-scenario --region=$REGION"
echo "gcloud functions logs read voiceops-get-alerts --region=$REGION"