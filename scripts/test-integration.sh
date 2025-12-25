#!/bin/bash

# VoiceOps - ElevenLabs Integration Test Script
# This script tests the integration between ElevenLabs and Cloud Functions

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

echo -e "${BLUE}🧪 VoiceOps ElevenLabs Integration Test${NC}"
echo "======================================="

# Check if PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: GOOGLE_CLOUD_PROJECT environment variable is not set${NC}"
    echo "Please set it with: export GOOGLE_CLOUD_PROJECT=your-project-id"
    exit 1
fi

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo ""

# Function URLs (these will be set after deployment)
ANALYZE_RISKS_URL=""
RUN_SCENARIO_URL=""
GET_ALERTS_URL=""

# Check if functions are deployed
echo -e "${YELLOW}🔍 Checking deployed functions...${NC}"

if command -v gcloud &> /dev/null; then
    # Try to get function URLs
    ANALYZE_RISKS_URL=$(gcloud functions describe voiceops-analyze-risks --region=$REGION --format="value(serviceConfig.uri)" 2>/dev/null || echo "")
    RUN_SCENARIO_URL=$(gcloud functions describe voiceops-run-scenario --region=$REGION --format="value(serviceConfig.uri)" 2>/dev/null || echo "")
    GET_ALERTS_URL=$(gcloud functions describe voiceops-get-alerts --region=$REGION --format="value(serviceConfig.uri)" 2>/dev/null || echo "")
fi

# If functions not deployed, use local URLs for testing
if [ -z "$ANALYZE_RISKS_URL" ]; then
    echo -e "${YELLOW}⚠️  Functions not deployed. Using local URLs for testing.${NC}"
    ANALYZE_RISKS_URL="http://localhost:8080"
    RUN_SCENARIO_URL="http://localhost:8081"
    GET_ALERTS_URL="http://localhost:8082"
else
    echo -e "${GREEN}✅ Functions found:${NC}"
    echo "  Risk Analysis: $ANALYZE_RISKS_URL"
    echo "  Run Scenario: $RUN_SCENARIO_URL"
    echo "  Get Alerts: $GET_ALERTS_URL"
fi

echo ""

# Test function to make HTTP requests
test_endpoint() {
    local name=$1
    local url=$2
    local method=$3
    local data=$4
    local expected_status=${5:-200}
    
    echo -e "${YELLOW}🧪 Testing $name...${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url" || echo -e "\n000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url" || echo -e "\n000")
    fi
    
    # Split response and status code
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $name: HTTP $status${NC}"
        
        # Try to parse JSON and show key fields
        if command -v jq &> /dev/null; then
            echo "$body" | jq -C . 2>/dev/null | head -10 || echo "$body" | head -3
        else
            echo "$body" | head -3
        fi
        echo ""
        return 0
    else
        echo -e "${RED}❌ $name: HTTP $status (expected $expected_status)${NC}"
        echo "$body" | head -5
        echo ""
        return 1
    fi
}

# Test health endpoints first
echo -e "${BLUE}🏥 Testing Health Endpoints${NC}"
echo "============================"

test_endpoint "Risk Analysis Health" "${ANALYZE_RISKS_URL}-health" "GET" ""
test_endpoint "Run Scenario Health" "${RUN_SCENARIO_URL}-health" "GET" ""
test_endpoint "Get Alerts Health" "${GET_ALERTS_URL}-health" "GET" ""

# Test main endpoints with ElevenLabs-style payloads
echo -e "${BLUE}🎯 Testing Main Endpoints${NC}"
echo "=========================="

# Test 1: Risk Analysis (simulating ElevenLabs webhook call)
echo -e "${YELLOW}Test 1: Risk Analysis${NC}"
risk_payload='{
  "region": "asia",
  "category": "logistics"
}'

test_endpoint "Risk Analysis" "$ANALYZE_RISKS_URL" "POST" "$risk_payload"

# Test 2: Scenario Simulation
echo -e "${YELLOW}Test 2: Scenario Simulation${NC}"
scenario_payload='{
  "scenarioType": "supplier_failure",
  "region": "asia",
  "severity": "moderate"
}'

test_endpoint "Scenario Simulation" "$RUN_SCENARIO_URL" "POST" "$scenario_payload"

# Test 3: Get Alerts
echo -e "${YELLOW}Test 3: Get Alerts${NC}"
alerts_payload='{
  "priority": "critical",
  "limit": 5
}'

test_endpoint "Get Alerts" "$GET_ALERTS_URL" "POST" "$alerts_payload"

# Test error handling
echo -e "${BLUE}🚨 Testing Error Handling${NC}"
echo "========================="

# Test invalid region
echo -e "${YELLOW}Test 4: Invalid Region${NC}"
invalid_region_payload='{
  "region": "invalid_region"
}'

test_endpoint "Invalid Region" "$ANALYZE_RISKS_URL" "POST" "$invalid_region_payload" 400

# Test invalid scenario type
echo -e "${YELLOW}Test 5: Invalid Scenario Type${NC}"
invalid_scenario_payload='{
  "scenarioType": "invalid_scenario"
}'

test_endpoint "Invalid Scenario Type" "$RUN_SCENARIO_URL" "POST" "$invalid_scenario_payload" 400

# Test missing required fields
echo -e "${YELLOW}Test 6: Missing Required Fields${NC}"
empty_payload='{}'

test_endpoint "Missing Required Fields" "$ANALYZE_RISKS_URL" "POST" "$empty_payload" 400

# Test CORS
echo -e "${BLUE}🌐 Testing CORS${NC}"
echo "==============="

echo -e "${YELLOW}Test 7: CORS Preflight${NC}"
test_endpoint "CORS Preflight" "$ANALYZE_RISKS_URL" "OPTIONS" "" 204

# Performance test
echo -e "${BLUE}⚡ Performance Test${NC}"
echo "=================="

echo -e "${YELLOW}Test 8: Response Time${NC}"
start_time=$(date +%s%N)

test_endpoint "Performance Test" "$ANALYZE_RISKS_URL" "POST" "$risk_payload" >/dev/null 2>&1

end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

if [ $duration -lt 5000 ]; then
    echo -e "${GREEN}✅ Response time: ${duration}ms (< 5s)${NC}"
else
    echo -e "${YELLOW}⚠️  Response time: ${duration}ms (> 5s)${NC}"
fi

echo ""

# ElevenLabs Integration Test
echo -e "${BLUE}🎤 ElevenLabs Integration Simulation${NC}"
echo "===================================="

echo -e "${YELLOW}Simulating ElevenLabs webhook calls...${NC}"

# Simulate the exact payload structure ElevenLabs would send
elevenlabs_risk_payload='{
  "region": "europe",
  "category": "all"
}'

elevenlabs_scenario_payload='{
  "scenarioType": "port_closure",
  "region": "europe",
  "severity": "severe"
}'

elevenlabs_alerts_payload='{
  "priority": "high",
  "limit": 10
}'

echo -e "${BLUE}📊 ElevenLabs Test Results:${NC}"

# Test all three tools as ElevenLabs would call them
test_endpoint "ElevenLabs Risk Analysis" "$ANALYZE_RISKS_URL" "POST" "$elevenlabs_risk_payload"
test_endpoint "ElevenLabs Scenario Simulation" "$RUN_SCENARIO_URL" "POST" "$elevenlabs_scenario_payload"
test_endpoint "ElevenLabs Alert Retrieval" "$GET_ALERTS_URL" "POST" "$elevenlabs_alerts_payload"

# Summary
echo -e "${BLUE}📋 Test Summary${NC}"
echo "==============="

echo -e "${GREEN}✅ Health checks passed${NC}"
echo -e "${GREEN}✅ Main endpoints functional${NC}"
echo -e "${GREEN}✅ Error handling working${NC}"
echo -e "${GREEN}✅ CORS configured${NC}"
echo -e "${GREEN}✅ ElevenLabs integration ready${NC}"

echo ""
echo -e "${BLUE}🎯 Next Steps:${NC}"
echo "1. Configure ElevenLabs agent with these webhook URLs:"
echo "   - Risk Analysis: $ANALYZE_RISKS_URL"
echo "   - Run Scenario: $RUN_SCENARIO_URL"
echo "   - Get Alerts: $GET_ALERTS_URL"
echo ""
echo "2. Test the agent with these sample phrases:"
echo "   - 'What are the current risks in Europe?'"
echo "   - 'Run a port closure scenario in Asia'"
echo "   - 'Show me high priority alerts'"
echo ""
echo "3. Verify responses include:"
echo "   - Specific percentages and data points"
echo "   - Regional information"
echo "   - Actionable recommendations"
echo "   - Responses under 3 sentences"

echo ""
echo -e "${GREEN}🎉 Integration test completed!${NC}"