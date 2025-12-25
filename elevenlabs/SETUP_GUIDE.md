# ElevenLabs Beacon Agent Setup Guide

This guide walks you through setting up the Beacon conversational AI agent in ElevenLabs.

## Prerequisites

1. **ElevenLabs Account**: Sign up at [elevenlabs.io](https://elevenlabs.io)
2. **Deployed Cloud Functions**: Complete the backend deployment first
3. **Function URLs**: Have your Google Cloud Function URLs ready

## Step 1: Create New Conversational AI Agent

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Click **"Create Agent"** → **"Blank Agent"**
3. Name your agent: **"Beacon"**

## Step 2: Configure Basic Settings

### **Agent Information**
- **Name**: Beacon
- **Description**: Voice-powered supply chain intelligence assistant
- **Language**: English (US)

### **Language Model**
- **Select**: Gemini 2.5 Flash
- **Temperature**: 0.3 (for consistent, professional responses)

### **Voice Settings**
- **Voice**: Choose a professional, clear voice (recommended: Adam or Antoni)
- **Stability**: 0.5
- **Similarity Boost**: 0.8
- **Style**: 0.2
- **Speaker Boost**: Enabled

## Step 3: Add System Prompt

Copy the entire content from `system-prompt.md` and paste it into the **System Prompt** field in the ElevenLabs dashboard.

## Step 4: Configure Tools/Webhooks

### **Tool 1: analyze_risks**

**Name**: `analyze_risks`

**Description**: 
```
Analyze supply chain risks for a specific region or category. Use this when the user asks about risks, threats, vulnerabilities, supply chain health, current situation, or wants to understand risk levels in any geographic area.
```

**Parameters Schema**:
```json
{
  "type": "object",
  "properties": {
    "region": {
      "type": "string",
      "enum": ["asia", "europe", "north_america", "south_america", "global"],
      "description": "Geographic region to analyze. Choose 'global' for worldwide analysis or when region is not specified."
    },
    "category": {
      "type": "string",
      "enum": ["logistics", "supplier", "geopolitical", "weather", "demand", "all"],
      "description": "Risk category to focus on. Use 'all' for comprehensive analysis or when category is not specified."
    }
  },
  "required": ["region"]
}
```

**Webhook URL**: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/voiceops-analyze-risks`

### **Tool 2: run_scenario**

**Name**: `run_scenario`

**Description**: 
```
Run a what-if scenario simulation to test supply chain resilience and contingency plans. Use this when the user wants to simulate disruptions, test scenarios, explore hypothetical situations, or understand potential impacts of supply chain events.
```

**Parameters Schema**:
```json
{
  "type": "object",
  "properties": {
    "scenarioType": {
      "type": "string",
      "enum": ["supplier_failure", "port_closure", "demand_surge", "natural_disaster", "transportation_disruption"],
      "description": "Type of scenario to simulate: supplier_failure (supplier goes offline), port_closure (major port closes), demand_surge (unexpected demand increase), natural_disaster (earthquake, hurricane, etc.), transportation_disruption (strikes, fuel shortages, etc.)"
    },
    "region": {
      "type": "string",
      "enum": ["asia", "europe", "north_america", "south_america"],
      "description": "Region where the scenario occurs. Default to 'asia' if not specified by user."
    },
    "severity": {
      "type": "string",
      "enum": ["minor", "moderate", "severe", "catastrophic"],
      "description": "Severity level of the scenario. Use 'moderate' as default if not specified by user."
    }
  },
  "required": ["scenarioType"]
}
```

**Webhook URL**: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/voiceops-run-scenario`

### **Tool 3: get_alerts**

**Name**: `get_alerts`

**Description**: 
```
Get active supply chain alerts and notifications. Use this when the user asks about alerts, notifications, urgent issues, critical problems, what needs attention, or wants to know about current supply chain disruptions.
```

**Parameters Schema**:
```json
{
  "type": "object",
  "properties": {
    "priority": {
      "type": "string",
      "enum": ["all", "high", "critical"],
      "description": "Filter alerts by priority level. Use 'critical' for most urgent issues, 'high' for important issues, or 'all' for comprehensive view."
    },
    "limit": {
      "type": "number",
      "minimum": 1,
      "maximum": 20,
      "description": "Maximum number of alerts to return. Default to 10 if not specified."
    },
    "region": {
      "type": "string",
      "enum": ["asia", "europe", "north_america", "south_america"],
      "description": "Filter alerts by geographic region. Omit to get alerts from all regions."
    }
  }
}
```

**Webhook URL**: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/voiceops-get-alerts`

## Step 5: Configure Conversation Settings

### **Turn Detection**
- **Type**: Server VAD (Voice Activity Detection)
- **Threshold**: 0.5
- **Prefix Padding**: 300ms
- **Silence Duration**: 800ms

### **Agent Behavior**
- **Think Before Speaking**: Enabled
- **Interruption Threshold**: 100ms
- **Responsiveness**: 0.8
- **LLM WebSocket Timeout**: 15000ms

## Step 6: Test Your Agent

1. **Save** your agent configuration
2. Click **"Test Agent"** in the ElevenLabs dashboard
3. Try these test phrases:
   - "What are the current risks in Asia?"
   - "Run a supplier failure scenario"
   - "Show me critical alerts"
   - "What's the supply chain situation in Europe?"

## Step 7: Get Your Agent ID

1. After saving, copy your **Agent ID** from the URL or agent settings
2. Add it to your frontend `.env.local` file:
   ```
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
   ```

## Step 8: Update Frontend Environment

Update your frontend environment variables with the correct URLs:

```bash
# .env.local
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# These should match your deployed Cloud Functions
NEXT_PUBLIC_ANALYZE_RISKS_URL=https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/voiceops-analyze-risks
NEXT_PUBLIC_RUN_SCENARIO_URL=https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/voiceops-run-scenario
NEXT_PUBLIC_GET_ALERTS_URL=https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/voiceops-get-alerts
```

## Troubleshooting

### **Agent Not Responding**
- Check that all webhook URLs are correct and accessible
- Verify your Cloud Functions are deployed and healthy
- Test webhook URLs directly with curl or Postman

### **Tools Not Working**
- Ensure parameter schemas match exactly
- Check Cloud Function logs for errors
- Verify CORS is properly configured

### **Voice Quality Issues**
- Adjust voice settings (stability, similarity boost)
- Try different voices
- Check microphone permissions in browser

### **Response Too Slow**
- Increase LLM WebSocket timeout
- Optimize Cloud Function performance
- Check network connectivity

## Testing Checklist

- [ ] Agent responds to voice input
- [ ] Risk analysis tool works ("What are risks in Asia?")
- [ ] Scenario simulation tool works ("Run a port closure scenario")
- [ ] Alert retrieval tool works ("Show me critical alerts")
- [ ] Agent stays in character and provides specific data
- [ ] Responses are under 3 sentences
- [ ] Agent suggests follow-up questions
- [ ] Error handling works when tools fail

## Production Considerations

### **Security**
- Implement proper authentication for webhook endpoints
- Use HTTPS for all webhook URLs
- Consider rate limiting and API keys

### **Monitoring**
- Set up logging for all tool calls
- Monitor webhook response times
- Track conversation success rates

### **Performance**
- Optimize Cloud Function cold starts
- Implement response caching where appropriate
- Monitor and adjust timeout settings

## Support

If you encounter issues:

1. **Check Cloud Function logs** in Google Cloud Console
2. **Test webhooks directly** with curl or Postman
3. **Review ElevenLabs agent logs** in the dashboard
4. **Verify environment variables** are set correctly

## Example Test Conversation

**User**: "Hi Beacon, what's the current supply chain situation?"

**Expected Response**: "Hello! I'm Beacon, your supply chain intelligence assistant. To give you the most relevant insights, which region would you like me to analyze - Asia, Europe, North America, or would you prefer a global overview?"

**User**: "Show me risks in Asia"

**Expected Response**: "Asia currently shows elevated risk at 72%, primarily due to port congestion in Shanghai and semiconductor supply constraints. The Shanghai port situation is critical with 2-3 week delays expected. Would you like me to run a scenario simulation for alternative routing options?"

This confirms your agent is working correctly and using the tools properly!