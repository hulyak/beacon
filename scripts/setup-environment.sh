#!/bin/bash

# VoiceOps AI - Environment Setup Script
# This script sets up the development and production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 VoiceOps AI Environment Setup${NC}"
echo "================================="

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    echo -n -e "${YELLOW}$prompt${NC}"
    if [ -n "$default" ]; then
        echo -n " (default: $default)"
    fi
    echo -n ": "
    
    read input
    if [ -z "$input" ] && [ -n "$default" ]; then
        input="$default"
    fi
    
    eval "$var_name='$input'"
}

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local already exists${NC}"
    echo -n "Do you want to overwrite it? (y/N): "
    read overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Exiting without changes."
        exit 0
    fi
fi

echo -e "${BLUE}📋 Please provide the following configuration:${NC}"
echo ""

# ElevenLabs Configuration
echo -e "${BLUE}ElevenLabs Configuration:${NC}"
prompt_with_default "ElevenLabs Agent ID" "" "ELEVENLABS_AGENT_ID"

if [ -z "$ELEVENLABS_AGENT_ID" ]; then
    echo -e "${RED}❌ ElevenLabs Agent ID is required${NC}"
    echo "Please create an agent at https://elevenlabs.io/app/conversational-ai"
    exit 1
fi

# Application Configuration
echo ""
echo -e "${BLUE}Application Configuration:${NC}"
prompt_with_default "Application URL" "http://localhost:3000" "APP_URL"

# Google Cloud Configuration
echo ""
echo -e "${BLUE}Google Cloud Configuration:${NC}"
prompt_with_default "Google Cloud Project ID" "" "GOOGLE_CLOUD_PROJECT"
prompt_with_default "Vertex AI Location" "us-central1" "VERTEX_AI_LOCATION"

if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo -e "${RED}❌ Google Cloud Project ID is required${NC}"
    echo "Please create a project at https://console.cloud.google.com/"
    exit 1
fi

# Check if this is for production
echo ""
echo -n -e "${YELLOW}Is this for production deployment? (y/N): ${NC}"
read is_production

if [ "$is_production" = "y" ] || [ "$is_production" = "Y" ]; then
    echo ""
    echo -e "${BLUE}Production Configuration:${NC}"
    prompt_with_default "Production App URL (Vercel)" "https://voiceops-ai.vercel.app" "PROD_APP_URL"
    
    # Check if functions are deployed
    echo ""
    echo -e "${YELLOW}📡 Checking for deployed Cloud Functions...${NC}"
    
    if gcloud functions describe voiceops-analyze-risks --region="$VERTEX_AI_LOCATION" --quiet > /dev/null 2>&1; then
        ANALYZE_RISKS_URL=$(gcloud functions describe voiceops-analyze-risks --region="$VERTEX_AI_LOCATION" --format="value(serviceConfig.uri)")
        echo -e "${GREEN}✅ Found analyze-risks function${NC}"
    else
        echo -e "${YELLOW}⚠️  analyze-risks function not found${NC}"
        prompt_with_default "Analyze Risks Function URL" "" "ANALYZE_RISKS_URL"
    fi
    
    if gcloud functions describe voiceops-run-scenario --region="$VERTEX_AI_LOCATION" --quiet > /dev/null 2>&1; then
        RUN_SCENARIO_URL=$(gcloud functions describe voiceops-run-scenario --region="$VERTEX_AI_LOCATION" --format="value(serviceConfig.uri)")
        echo -e "${GREEN}✅ Found run-scenario function${NC}"
    else
        echo -e "${YELLOW}⚠️  run-scenario function not found${NC}"
        prompt_with_default "Run Scenario Function URL" "" "RUN_SCENARIO_URL"
    fi
    
    if gcloud functions describe voiceops-get-alerts --region="$VERTEX_AI_LOCATION" --quiet > /dev/null 2>&1; then
        GET_ALERTS_URL=$(gcloud functions describe voiceops-get-alerts --region="$VERTEX_AI_LOCATION" --format="value(serviceConfig.uri)")
        echo -e "${GREEN}✅ Found get-alerts function${NC}"
    else
        echo -e "${YELLOW}⚠️  get-alerts function not found${NC}"
        prompt_with_default "Get Alerts Function URL" "" "GET_ALERTS_URL"
    fi
    
    APP_URL="$PROD_APP_URL"
else
    # Development URLs
    ANALYZE_RISKS_URL="http://localhost:8080"
    RUN_SCENARIO_URL="http://localhost:8081"
    GET_ALERTS_URL="http://localhost:8082"
fi

# Create .env.local file
echo ""
echo -e "${YELLOW}📝 Creating .env.local file...${NC}"

cat > .env.local << EOF
# VoiceOps AI Environment Configuration
# Generated on $(date)

# ElevenLabs Configuration
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=$ELEVENLABS_AGENT_ID

# Application Configuration
NEXT_PUBLIC_APP_URL=$APP_URL

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT
VERTEX_AI_LOCATION=$VERTEX_AI_LOCATION

# Google Cloud Functions URLs
NEXT_PUBLIC_ANALYZE_RISKS_URL=$ANALYZE_RISKS_URL
NEXT_PUBLIC_RUN_SCENARIO_URL=$RUN_SCENARIO_URL
NEXT_PUBLIC_GET_ALERTS_URL=$GET_ALERTS_URL

# Development Configuration
NODE_ENV=${NODE_ENV:-development}
EOF

echo -e "${GREEN}✅ .env.local created successfully${NC}"

# Create .env.example if it doesn't exist
if [ ! -f ".env.local.example" ]; then
    echo -e "${YELLOW}📝 Creating .env.local.example file...${NC}"
    
    cat > .env.local.example << EOF
# VoiceOps AI Environment Configuration Example
# Copy this file to .env.local and fill in your values

# ElevenLabs Configuration
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
VERTEX_AI_LOCATION=us-central1

# Google Cloud Functions URLs (development)
NEXT_PUBLIC_ANALYZE_RISKS_URL=http://localhost:8080
NEXT_PUBLIC_RUN_SCENARIO_URL=http://localhost:8081
NEXT_PUBLIC_GET_ALERTS_URL=http://localhost:8082

# Development Configuration
NODE_ENV=development
EOF
    
    echo -e "${GREEN}✅ .env.local.example created${NC}"
fi

# Validate configuration
echo ""
echo -e "${YELLOW}🔍 Validating configuration...${NC}"

# Check if gcloud is configured
if ! gcloud config get-value project > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  gcloud not configured. Setting project...${NC}"
    gcloud config set project "$GOOGLE_CLOUD_PROJECT"
fi

# Check if required APIs are enabled (only if gcloud is authenticated)
if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Checking required APIs..."
    
    REQUIRED_APIS=(
        "cloudfunctions.googleapis.com"
        "aiplatform.googleapis.com"
        "cloudbuild.googleapis.com"
    )
    
    for api in "${REQUIRED_APIS[@]}"; do
        if gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
            echo -e "${GREEN}✅ $api enabled${NC}"
        else
            echo -e "${YELLOW}⚠️  $api not enabled${NC}"
            echo "Run: gcloud services enable $api"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Not authenticated with gcloud. Run 'gcloud auth login' to check API status${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Environment setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo "  ElevenLabs Agent ID: $ELEVENLABS_AGENT_ID"
echo "  App URL: $APP_URL"
echo "  Google Cloud Project: $GOOGLE_CLOUD_PROJECT"
echo "  Vertex AI Location: $VERTEX_AI_LOCATION"
echo ""
echo -e "${BLUE}Next steps:${NC}"
if [ "$is_production" = "y" ] || [ "$is_production" = "Y" ]; then
    echo "1. Deploy Cloud Functions: ./scripts/deploy-functions.sh"
    echo "2. Deploy Frontend: ./scripts/deploy-frontend.sh"
    echo "3. Configure ElevenLabs agent with webhook URLs"
    echo "4. Test the complete integration"
else
    echo "1. Start local development: npm run dev"
    echo "2. Test Cloud Functions locally (if needed)"
    echo "3. Configure ElevenLabs agent for development"
fi
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "- Keep your .env.local file secure and never commit it to git"
echo "- Update ElevenLabs agent configuration with the correct URLs"
echo "- Test all integrations before going live"