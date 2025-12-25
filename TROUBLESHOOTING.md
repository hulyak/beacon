# Beacon - Troubleshooting Guide

> Voice-First AI Supply Chain Intelligence Platform

This guide helps you diagnose and resolve common issues with Beacon.

## 🚨 Quick Diagnostics

### System Health Check
Run these commands to check system status:

```bash
# Check frontend build
npm run build

# Test Cloud Functions
curl -X POST https://your-region-your-project.cloudfunctions.net/voiceops-health

# Check environment variables
cat .env.local

# Verify gcloud configuration
gcloud config list
gcloud auth list
```

### Service Status URLs
- **Frontend**: https://your-app.vercel.app
- **Health Check**: https://your-region-your-project.cloudfunctions.net/voiceops-health
- **ElevenLabs Status**: https://status.elevenlabs.io/

---

## 🎤 Voice Interaction Issues

### Issue: Microphone Not Working

#### Symptoms
- Microphone button stays gray/inactive
- "Permission denied" errors
- No voice activation

#### Diagnosis
```bash
# Check if running on HTTPS (required for microphone)
echo $NEXT_PUBLIC_APP_URL

# Check browser console for permission errors
# Open browser dev tools > Console
```

#### Solutions

**1. Browser Permissions**
- Chrome: Settings > Privacy and Security > Site Settings > Microphone
- Firefox: Preferences > Privacy & Security > Permissions > Microphone
- Safari: Preferences > Websites > Microphone

**2. HTTPS Requirement**
```bash
# Ensure app URL uses HTTPS
# Local development: use ngrok or similar
npx ngrok http 3000
```

**3. Browser Compatibility**
- Use Chrome or Edge (recommended)
- Update browser to latest version
- Disable browser extensions that might block microphone

**4. System Permissions**
- macOS: System Preferences > Security & Privacy > Microphone
- Windows: Settings > Privacy > Microphone
- Linux: Check PulseAudio/ALSA settings

### Issue: Voice Recognition Inaccurate

#### Symptoms
- Speech not recognized correctly
- Partial transcriptions
- Wrong commands executed

#### Diagnosis
```javascript
// Check ElevenLabs connection in browser console
console.log('ElevenLabs Agent ID:', process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID);
```

#### Solutions

**1. Audio Quality**
- Use external microphone if possible
- Reduce background noise
- Speak clearly and at normal pace
- Ensure stable internet connection

**2. ElevenLabs Configuration**
- Verify agent ID is correct
- Check agent language settings
- Test with ElevenLabs dashboard
- Review agent training data

**3. Network Issues**
- Check WebSocket connection stability
- Test with different network
- Verify firewall settings

### Issue: No Voice Response

#### Symptoms
- Speech recognized but no audio response
- Text response shown but no voice
- Silent responses

#### Diagnosis
```bash
# Check ElevenLabs agent configuration
curl -X GET "https://api.elevenlabs.io/v1/convai/conversations/get_signed_url?agent_id=YOUR_AGENT_ID" \
  -H "xi-api-key: YOUR_API_KEY"

# Check webhook connectivity
curl -X POST https://your-region-your-project.cloudfunctions.net/voiceops-analyze-risks \
  -H "Content-Type: application/json" \
  -d '{"region": "asia", "category": "all"}'
```

#### Solutions

**1. ElevenLabs Configuration**
- Verify webhook URLs in agent settings
- Check agent voice settings
- Test webhooks in ElevenLabs dashboard
- Verify API key permissions

**2. Audio Settings**
- Check browser audio permissions
- Verify system volume settings
- Test with headphones
- Check for audio conflicts

**3. Network Connectivity**
- Verify webhook URLs are accessible
- Check CORS configuration
- Test with different network
- Review firewall rules

---

## 🌐 Backend Service Issues

### Issue: Cloud Functions Not Responding

#### Symptoms
- 500 Internal Server Error
- Timeout errors
- "Function not found" errors

#### Diagnosis
```bash
# Check function deployment status
gcloud functions list --regions=us-central1

# Check function logs
gcloud functions logs read voiceops-analyze-risks --limit=50

# Test function directly
curl -X POST https://your-region-your-project.cloudfunctions.net/voiceops-analyze-risks \
  -H "Content-Type: application/json" \
  -d '{"region": "asia", "category": "all"}'
```

#### Solutions

**1. Deployment Issues**
```bash
# Redeploy functions
./scripts/deploy-functions.sh

# Check deployment status
gcloud functions describe voiceops-analyze-risks --region=us-central1
```

**2. Permission Issues**
```bash
# Check IAM permissions
gcloud projects get-iam-policy $GOOGLE_CLOUD_PROJECT

# Grant required permissions
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member="serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

**3. API Enablement**
```bash
# Enable required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Issue: Vertex AI Errors

#### Symptoms
- "AI service unavailable" errors
- Quota exceeded errors
- Authentication failures

#### Diagnosis
```bash
# Check Vertex AI API status
gcloud services list --enabled --filter="name:aiplatform.googleapis.com"

# Check quota usage
gcloud compute project-info describe --project=$GOOGLE_CLOUD_PROJECT

# Test Vertex AI directly
gcloud ai models list --region=us-central1
```

#### Solutions

**1. API Configuration**
```bash
# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com

# Set correct project
gcloud config set project $GOOGLE_CLOUD_PROJECT
```

**2. Authentication**
```bash
# Check authentication
gcloud auth list

# Re-authenticate if needed
gcloud auth login
gcloud auth application-default login
```

**3. Quota Issues**
- Check Google Cloud Console > IAM & Admin > Quotas
- Request quota increase if needed
- Monitor usage in Cloud Monitoring

### Issue: CORS Errors

#### Symptoms
- "Access-Control-Allow-Origin" errors
- Cross-origin request blocked
- OPTIONS preflight failures

#### Diagnosis
```bash
# Test CORS headers
curl -X OPTIONS https://your-region-your-project.cloudfunctions.net/voiceops-analyze-risks \
  -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

#### Solutions

**1. Update CORS Configuration**
```bash
# Run CORS configuration script
./scripts/configure-cors.sh
```

**2. Manual CORS Fix**
```bash
# Update function with CORS environment variables
gcloud functions deploy voiceops-analyze-risks \
  --region=us-central1 \
  --update-env-vars="CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000"
```

**3. Verify Origins**
- Check that frontend URL matches CORS origins
- Ensure HTTPS is used in production
- Verify subdomain configurations

---

## 🖥️ Frontend Issues

### Issue: Application Won't Load

#### Symptoms
- White screen
- Build errors
- JavaScript errors in console

#### Diagnosis
```bash
# Check build locally
npm run build

# Check environment variables
cat .env.local

# Check browser console for errors
# Open dev tools > Console
```

#### Solutions

**1. Build Issues**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

**2. Environment Variables**
```bash
# Verify all required variables are set
grep -E "^NEXT_PUBLIC_" .env.local

# Update missing variables
./scripts/setup-environment.sh
```

**3. Dependency Issues**
```bash
# Update dependencies
npm update

# Check for conflicts
npm ls
```

### Issue: Vercel Deployment Fails

#### Symptoms
- Build failures on Vercel
- Environment variable errors
- Deployment timeouts

#### Diagnosis
```bash
# Check Vercel logs
vercel logs

# Test build locally
npm run build

# Check environment variables
vercel env ls
```

#### Solutions

**1. Environment Variables**
```bash
# Set missing environment variables
vercel env add NEXT_PUBLIC_ELEVENLABS_AGENT_ID
vercel env add NEXT_PUBLIC_ANALYZE_RISKS_URL
# ... add all required variables
```

**2. Build Configuration**
```bash
# Check vercel.json configuration
cat vercel.json

# Redeploy
vercel --prod
```

**3. Dependencies**
```bash
# Check package.json
npm audit
npm audit fix

# Update Node.js version in vercel.json if needed
```

---

## 🔧 ElevenLabs Integration Issues

### Issue: Agent Not Responding

#### Symptoms
- No response from ElevenLabs
- Webhook timeouts
- Agent configuration errors

#### Diagnosis
```bash
# Test webhook connectivity
curl -X POST https://your-region-your-project.cloudfunctions.net/voiceops-analyze-risks \
  -H "Content-Type: application/json" \
  -d '{"region": "asia", "category": "all"}'

# Check ElevenLabs agent status in dashboard
```

#### Solutions

**1. Webhook Configuration**
- Verify webhook URLs in ElevenLabs dashboard
- Ensure URLs are publicly accessible
- Test webhooks using ElevenLabs testing interface

**2. Agent Configuration**
- Check agent ID is correct
- Verify system prompt is properly configured
- Ensure tools are properly defined
- Test agent in ElevenLabs dashboard

**3. API Key Issues**
- Verify API key is valid
- Check API key permissions
- Regenerate API key if needed

### Issue: Tool Calls Failing

#### Symptoms
- Agent doesn't use tools
- Tool parameter errors
- Webhook call failures

#### Diagnosis
```bash
# Check function logs for webhook calls
gcloud functions logs read voiceops-analyze-risks --limit=20

# Test tool parameters manually
curl -X POST https://your-region-your-project.cloudfunctions.net/voiceops-analyze-risks \
  -H "Content-Type: application/json" \
  -d '{"region": "invalid_region"}'
```

#### Solutions

**1. Tool Configuration**
- Verify tool definitions in ElevenLabs dashboard
- Check parameter schemas match function expectations
- Test each tool individually

**2. Parameter Validation**
- Review function input validation
- Check for required vs optional parameters
- Verify enum values match

**3. Error Handling**
- Check function error responses
- Ensure proper HTTP status codes
- Review error message formatting

---

## 📊 Performance Issues

### Issue: Slow Response Times

#### Symptoms
- Voice responses take >10 seconds
- Function timeouts
- Poor user experience

#### Diagnosis
```bash
# Check function performance
gcloud functions logs read voiceops-analyze-risks --limit=10

# Monitor function metrics
gcloud logging read "resource.type=cloud_function" --limit=50

# Test response times
time curl -X POST https://your-region-your-project.cloudfunctions.net/voiceops-analyze-risks \
  -H "Content-Type: application/json" \
  -d '{"region": "asia", "category": "all"}'
```

#### Solutions

**1. Function Optimization**
```bash
# Increase function memory
gcloud functions deploy voiceops-analyze-risks \
  --memory=1GB \
  --timeout=60s
```

**2. Cold Start Mitigation**
- Implement function warming
- Use minimum instances for critical functions
- Optimize initialization code

**3. Caching**
- Implement response caching
- Use Cloud Memorystore for frequent queries
- Cache Vertex AI responses

### Issue: High Costs

#### Symptoms
- Unexpected billing charges
- High function invocation counts
- Excessive Vertex AI usage

#### Diagnosis
```bash
# Check function invocations
gcloud functions logs read voiceops-analyze-risks --limit=100 | grep "Function execution"

# Monitor billing
gcloud billing accounts list
```

#### Solutions

**1. Usage Optimization**
- Implement request caching
- Add rate limiting
- Optimize function memory allocation
- Use appropriate Vertex AI models

**2. Monitoring**
- Set up billing alerts
- Monitor function metrics
- Track API usage patterns

**3. Cost Controls**
- Set function concurrency limits
- Implement usage quotas
- Use cheaper regions where possible

---

## 🔍 Debugging Tools

### Logging Commands

```bash
# Frontend logs (Vercel)
vercel logs --follow

# Cloud Function logs
gcloud functions logs read voiceops-analyze-risks --limit=50
gcloud functions logs tail voiceops-analyze-risks

# System logs
gcloud logging read "resource.type=cloud_function" --limit=50
```

### Testing Commands

```bash
# Test health endpoints
curl https://your-region-your-project.cloudfunctions.net/voiceops-health

# Test with sample data
curl -X POST https://your-region-your-project.cloudfunctions.net/voiceops-analyze-risks \
  -H "Content-Type: application/json" \
  -d '{"region": "asia", "category": "all"}'

# Test ElevenLabs connectivity
curl -X GET "https://api.elevenlabs.io/v1/user" \
  -H "xi-api-key: YOUR_API_KEY"
```

### Monitoring Tools

```bash
# Function metrics
gcloud functions describe voiceops-analyze-risks --region=us-central1

# Project status
gcloud services list --enabled

# Billing information
gcloud billing accounts list
```

---

## 📞 Getting Help

### Self-Service Resources
1. **Check logs first** - Most issues show up in logs
2. **Test individual components** - Isolate the problem
3. **Review configuration** - Verify all settings
4. **Check service status** - External service issues

### Documentation Links
- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [Google Cloud Functions](https://cloud.google.com/functions/docs)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Vercel Documentation](https://vercel.com/docs)

### Common Solutions Summary

| Issue | Quick Fix |
|-------|-----------|
| Microphone not working | Check HTTPS and browser permissions |
| No voice response | Verify ElevenLabs webhook URLs |
| Function errors | Check logs and redeploy |
| CORS errors | Run `./scripts/configure-cors.sh` |
| Build failures | Clear cache and reinstall dependencies |
| Slow responses | Increase function memory |
| High costs | Implement caching and rate limiting |

### Emergency Contacts
- **ElevenLabs Support**: support@elevenlabs.io
- **Google Cloud Support**: Through Cloud Console
- **Vercel Support**: Through Vercel Dashboard

---

**Remember**: Most issues can be resolved by checking logs, verifying configuration, and testing individual components. Start with the simplest solutions first!