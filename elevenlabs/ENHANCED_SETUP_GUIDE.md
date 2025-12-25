# Enhanced ElevenLabs Agent Setup Guide - Version 2.0

This guide covers the setup and deployment of the enhanced Beacon voice agent with comprehensive supply chain analytics capabilities.

## Overview

The enhanced Beacon agent now includes 7 analytical tools providing end-to-end supply chain intelligence:

- **Risk Analysis** - Regional and categorical risk assessment
- **Scenario Simulation** - What-if disruption testing
- **Alert Management** - Active notification monitoring
- **Impact Assessment** - Financial and operational impact analysis (NEW)
- **AI Explainability** - Reasoning and confidence scoring (NEW)
- **Sustainability Tracking** - Environmental impact monitoring (NEW)
- **ROI Optimization** - Multi-criteria strategy analysis (NEW)

## Prerequisites

1. **ElevenLabs Account** with Conversational AI access
2. **Google Cloud Project** with Cloud Functions enabled
3. **Deployed Cloud Functions** for all 7 analytical services
4. **Webhook URLs** configured and accessible

## Configuration Files

### 1. Agent Configuration (`agent-config.json`)

The main agent configuration includes:
- Enhanced system prompt with 7 tools
- Updated voice settings and conversation config
- Comprehensive tool definitions with parameters
- Webhook URL placeholders for Cloud Functions

### 2. Tools Configuration (`tools-config.json`)

Standalone tools configuration for easy management:
- All 7 tools with detailed parameter schemas
- Webhook URL configurations
- Usage examples and descriptions

### 3. System Prompt (`system-prompt.md`)

Enhanced system prompt documentation:
- Detailed tool descriptions and usage patterns
- Enhanced example interactions
- Cross-functional integration guidelines
- Version 2.0 behavioral updates

## Deployment Steps

### Step 1: Deploy Cloud Functions

Ensure all Cloud Functions are deployed and accessible:

```bash
# Deploy Impact Assessment Functions
cd voiceops-ai/functions/impact-assessment
npm run deploy

# Deploy Explainability Functions  
cd ../explainability
npm run deploy

# Deploy Sustainability Functions
cd ../sustainability
npm run deploy

# Deploy ROI Optimization Functions
cd ../roi-optimization
npm run deploy
```

### Step 2: Update Webhook URLs

Replace `CLOUD_FUNCTION_URL` placeholders in both configuration files with your actual Cloud Function URLs:

```json
{
  "webhook_url": "https://us-central1-your-project.cloudfunctions.net/voiceops-impact-assessment"
}
```

Required webhook endpoints:
- `voiceops-analyze-risks`
- `voiceops-run-scenario`
- `voiceops-get-alerts`
- `voiceops-impact-assessment` (NEW)
- `voiceops-explainability` (NEW)
- `voiceops-sustainability` (NEW)
- `voiceops-roi-optimization` (NEW)

### Step 3: Configure ElevenLabs Agent

1. **Create New Agent** in ElevenLabs dashboard
2. **Import Configuration** from `agent-config.json`
3. **Update Webhook URLs** with your deployed Cloud Function endpoints
4. **Test Voice Settings** and adjust if needed
5. **Validate Tool Configurations** ensure all parameters are correct

### Step 4: Test Enhanced Capabilities

Test each new analytical capability:

#### Impact Assessment Testing
```
"What's the financial impact of a supplier failure in Asia?"
"How would a port closure affect our deliveries?"
"Calculate the cost of this disruption."
```

#### AI Explainability Testing
```
"Why do you recommend this strategy?"
"How did you calculate that ROI?"
"Explain your reasoning for this recommendation."
```

#### Sustainability Testing
```
"What's our carbon footprint?"
"Show me green alternatives for transportation."
"How can we reduce our environmental impact?"
```

#### ROI Optimization Testing
```
"What's the ROI of supplier diversification?"
"Compare these mitigation strategies."
"Optimize our supply chain approach."
```

## Enhanced Features

### Cross-Functional Analysis

The enhanced agent can now perform integrated analyses:

```
User: "Analyze the risks in Asia"
Agent: "Asia shows high risk at 78%... Should I also assess the financial impact and sustainability implications?"

User: "Yes, do a comprehensive analysis"
Agent: [Calls multiple tools for integrated insights]
```

### Explainable AI

All recommendations now include reasoning:

```
User: "Why rail transport?"
Agent: "Based on 3 factors: 30% lower emissions, 15% cost reduction, 92% reliability. Confidence: 87%"
```

### Sustainability Integration

Environmental considerations are woven throughout:

```
User: "What's the best mitigation strategy?"
Agent: "Strategy A has highest ROI but Strategy B reduces carbon footprint by 25%. Want sustainability analysis?"
```

## Configuration Options

### Voice Settings

Optimized for analytical conversations:
- **Stability**: 0.5 (balanced)
- **Similarity Boost**: 0.8 (consistent voice)
- **Style**: 0.2 (professional tone)
- **Speaker Boost**: Enabled

### Conversation Settings

Enhanced for complex analytical discussions:
- **Turn Detection**: Server VAD with 800ms silence
- **Think Before Speaking**: Enabled for complex calculations
- **Responsiveness**: 0.8 (balanced speed/accuracy)
- **Timeout**: 15 seconds for complex analyses

### Tool Parameters

Each tool includes comprehensive parameter validation:
- **Required Parameters**: Clearly defined
- **Optional Parameters**: With sensible defaults
- **Enum Values**: Constrained to valid options
- **Descriptions**: Detailed usage guidance

## Troubleshooting

### Common Issues

1. **Webhook Timeouts**
   - Increase timeout settings for complex analyses
   - Implement proper error handling in Cloud Functions

2. **Parameter Validation Errors**
   - Check enum values match exactly
   - Ensure required parameters are provided

3. **Cross-Tool Integration**
   - Verify all Cloud Functions are deployed
   - Test individual tools before integration

### Monitoring

Monitor enhanced capabilities:
- **Tool Usage Patterns**: Which tools are used most
- **Response Times**: Complex analyses may take longer
- **Error Rates**: Track failures by tool type
- **User Satisfaction**: Feedback on new capabilities

## Version History

### Version 2.0 (Current)
- Added 4 new analytical tools
- Enhanced system prompt with cross-functional integration
- Improved explainability and reasoning
- Sustainability focus throughout
- ROI optimization capabilities

### Version 1.0 (Previous)
- Basic risk analysis, scenario simulation, alert management
- 3 core tools
- Simple system prompt

## Support

For issues with the enhanced configuration:
1. Check Cloud Function deployment status
2. Verify webhook URL accessibility
3. Test individual tools before integration
4. Review ElevenLabs agent logs for errors

## Next Steps

After successful deployment:
1. **Train Users** on new capabilities
2. **Monitor Usage** patterns and performance
3. **Gather Feedback** on enhanced features
4. **Iterate** based on user needs
5. **Expand** with additional analytical tools as needed

The enhanced Beacon agent provides comprehensive supply chain intelligence through natural voice interactions, enabling data-driven decision making across risk, impact, sustainability, and optimization domains.