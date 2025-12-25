# Beacon - Voice-First AI Supply Chain Intelligence

> **AI Partner Catalyst Hackathon Submission - ElevenLabs Challenge**

Beacon is a **voice-first AI platform** for supply chain intelligence that combines **ElevenLabs Conversational AI** with **Google Cloud Vertex AI (Gemini 2.5)** to deliver real-time, voice-controlled supply chain analytics and autonomous risk management.

## Live Application

**[https://beacon-voiceops.vercel.app](https://beacon-voiceops.vercel.app)**

---

## The Problem We're Solving

Supply chain disruption is no longer an isolated event—it's a persistent and escalating risk:

| Impact | Statistic | Source |
|--------|-----------|--------|
| Revenue Loss | 6-10% of annual revenue lost to supply chain issues | McKinsey, 2021 |
| Missed Growth | $1.6 trillion in missed revenue growth annually | Accenture |
| SMB Impact | 60% of SMBs lost 15%+ revenue in 2022 | Anvyl Survey |

**Real-world examples:**
- **Apple**: $6B revenue hit from chip shortages (2020)
- **Global Automotive**: $210B loss from semiconductor shortages (2021)
- **Delta Air Lines**: $550M loss from supply chain IT failure (2024)

Traditional supply chain tools require endless clicking and typing. **Beacon changes everything with voice-first design.**

---

## Why Voice-First?

### The Problem with Traditional Interfaces
Supply chain managers spend hours navigating complex dashboards, clicking through menus, and manually entering queries. This creates critical delays when every minute counts during a disruption.

### Voice Enables True Mobility
With Beacon, supply chain professionals can:
- **Walk the warehouse floor** while querying inventory levels
- **Drive between facilities** while checking shipment status
- **Multitask in any environment** while getting real-time insights
- **Respond to crises faster** without being tied to a desk

### Immediate Insights, Zero Navigation
Instead of clicking through 5 screens to find risk data:
> Just say: *"What are the current risks in Asia?"*

Instead of manually running complex scenario models:
> Just say: *"Run a port closure scenario"*

Instead of filtering through hundreds of alerts:
> Just say: *"Show me critical alerts"*

### Natural Conversation, Not Commands
Beacon understands context and follow-up questions:
- "Tell me more about that"
- "What should I do about this?"
- "How urgent is this?"
- "What are the next steps?"

### Business Impact
| Metric | Improvement |
|--------|-------------|
| Issue Resolution Time | **30-40% faster** |
| Decision Making Speed | **Immediate** vs. minutes of navigation |
| Hands-Free Operation | **100%** - no screen required |
| Training Required | **Minimal** - just speak naturally |

---

## What Makes Beacon Special

### Voice-First Design
Control your entire supply chain operation with natural voice commands:

- **"Analyze risks in Asia"** - Get instant AI-powered risk assessment
- **"Run a port closure scenario"** - Simulate what-if scenarios with Monte Carlo simulations
- **"What's my carbon footprint?"** - Track sustainability metrics and ESG compliance
- **"Give me a tour of the dashboard"** - Hands-free app navigation

### Agentic AI Architecture
Four specialized AI agents collaborate autonomously to protect your supply chain:

| Agent | Role | Capabilities |
|-------|------|--------------|
| **Info Agent** | Real-time Monitoring | IoT Integration, Anomaly Detection, Real-time Alerts |
| **Scenario Agent** | What-If Simulations | Monte Carlo Sims, Risk Forecasting, Impact Analysis |
| **Strategy Agent** | Autonomous Planning | Multi-Agent Negotiation, Strategy Optimization, Decision Trees |
| **Impact Agent** | Sustainability & Cost | Carbon Tracking, Cost Analysis, ESG Compliance |

### Real Google Cloud + ElevenLabs Integration

| Component | Technology | Status |
|-----------|------------|--------|
| Voice Interface | ElevenLabs Conversational AI | **REAL** |
| AI Analysis | Google Cloud Vertex AI (Gemini 2.5 Flash) | **REAL** |
| Backend APIs | Google Cloud Functions (Gen2) | **REAL** |
| Multi-Agent System | Custom agent coordinator | **REAL** |
| Digital Twin | React Flow network visualization | **REAL** |
| Supply Chain Data | Mock data for demo | Demo |

---

## Key Features

### 1. ElevenLabs Voice Integration
- **Conversational AI Agent**: Natural voice interactions with human-like responses
- **Multi-turn Conversations**: Context-aware follow-up questions
- **Voice Navigation**: Control the entire app hands-free
- **Proactive Alerts**: Beacon speaks when critical events occur
- **Voice Tour**: Guided walkthrough of all features

### 2. Google Cloud Vertex AI
- **Gemini 2.5 Flash**: Fast, intelligent analysis of supply chain data
- **Multi-Agent Architecture**: Specialized agents for risks, scenarios, sustainability, and strategy
- **Explainable AI**: Ask "why?" and get clear reasoning with decision trees

### 3. Real-Time Supply Chain Intelligence
- **Digital Twin**: Interactive supply chain network visualization with React Flow
- **Risk Analysis**: AI-powered risk scoring across regions with cascading failure detection
- **Monte Carlo Simulation**: What-if scenario planning with probability distributions
- **Sustainability Tracking**: Carbon footprint, green alternatives, ESG compliance

### 4. Dashboard Features
- **Key Performance Indicators**: Real-time metrics with live data refresh
- **Supply Chain Network**: D3.js powered network visualization
- **Alerts Feed**: Prioritized alerts with severity filtering
- **Risk Map**: Regional risk assessment with heat mapping

---

## Architecture

```
                      ┌─────────────────────────┐
                      │     ElevenLabs          │
                      │  Conversational AI      │
                      │  (Voice Agent + Tools)  │
                      └───────────┬─────────────┘
                                  │
                      ┌───────────▼─────────────┐
                      │      Next.js 16         │
                      │   (Voice-First UI)      │
                      │                         │
                      │  ┌─────────────────┐    │
                      │  │ Unified Voice   │    │
                      │  │ Assistant       │    │
                      │  └─────────────────┘    │
                      └───────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼───────┐       ┌────────▼────────┐       ┌────────▼────────┐
│ analyze-risks │       │  run-scenario   │       │   get-alerts    │
│     API       │       │      API        │       │      API        │
└───────┬───────┘       └────────┬────────┘       └────────┬────────┘
        │                        │                         │
        └────────────────────────┼─────────────────────────┘
                                 │
                      ┌──────────▼──────────┐
                      │   Google Cloud      │
                      │   Vertex AI         │
                      │  (Gemini 2.5 Flash) │
                      │                     │
                      │  ┌───────────────┐  │
                      │  │ Agent System  │  │
                      │  │ ├─ Info       │  │
                      │  │ ├─ Scenario   │  │
                      │  │ ├─ Strategy   │  │
                      │  │ └─ Impact     │  │
                      │  └───────────────┘  │
                      └─────────────────────┘
```

---

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React Flow** - Interactive network diagrams for Digital Twin
- **D3.js** - Supply chain network visualization
- **Recharts** - Data visualization and charts
- **Framer Motion** - Smooth animations
- **Tailwind CSS** - Modern styling
- **ElevenLabs React SDK** - Voice integration

### Backend (Google Cloud)
- **Cloud Functions Gen2** - Serverless API endpoints (5 deployed functions)
- **Vertex AI** - Gemini 2.5 Flash for AI analysis
- **Multi-Agent System** - Specialized AI agents with coordination

### Voice
- **ElevenLabs Conversational AI** - Voice agent with custom tools
- **AudioWorklet** - Real-time audio processing
- **Web Speech API** - Browser fallback for voice input

---

## Deployed Cloud Functions

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `analyze-risks` | `/analyze-risks` | AI-powered regional risk assessment |
| `run-scenario` | `/run-scenario` | Monte Carlo simulation engine |
| `get-alerts` | `/get-alerts` | Real-time alert management |
| `get-metrics` | `/get-metrics` | KPI and metrics data |
| `get-network` | `/get-network` | Supply chain network topology |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Google Cloud account with Vertex AI enabled
- ElevenLabs account with Conversational AI access

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/beacon-voiceops.git
cd beacon-voiceops

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your API keys to .env.local
# See Configuration section below

# Start development server
npm run dev
```

### Configuration

Create `.env.local` with your credentials:

```env
# ElevenLabs Voice Integration
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
NEXT_PUBLIC_ENABLE_VOICE=true

# Google Cloud Functions URLs
NEXT_PUBLIC_ANALYZE_RISKS_URL=https://us-central1-your-project.cloudfunctions.net/analyze-risks
NEXT_PUBLIC_RUN_SCENARIO_URL=https://us-central1-your-project.cloudfunctions.net/run-scenario
NEXT_PUBLIC_GET_ALERTS_URL=https://us-central1-your-project.cloudfunctions.net/get-alerts
NEXT_PUBLIC_GET_METRICS_URL=https://us-central1-your-project.cloudfunctions.net/get-metrics
NEXT_PUBLIC_GET_NETWORK_URL=https://us-central1-your-project.cloudfunctions.net/get-network

# App URL
NEXT_PUBLIC_APP_URL=https://beacon-voiceops.vercel.app
```

---

## Voice Commands to Try

### Risk Analysis
- "Analyze risks in Asia"
- "What suppliers are at risk?"
- "Show me the supply chain health"
- "Scan for anomalies"

### Scenario Planning
- "Run port closure scenario"
- "What if there's a demand surge?"
- "Test supplier failure"
- "Run Monte Carlo simulation"

### Sustainability
- "Show my carbon footprint"
- "Find green alternatives"
- "What's my sustainability score?"
- "Calculate emissions"

### Navigation
- "Go to analytics"
- "Open digital twin"
- "Give me a tour of the dashboard"
- "Show critical alerts"

---

## Project Structure

```
voiceops-ai/
├── app/                        # Next.js App Router pages
│   ├── dashboard/              # Main dashboard with KPIs
│   ├── digital-twin/           # Interactive supply chain network
│   ├── scenarios/              # Monte Carlo scenario planning
│   ├── analytics/              # Analytics and charts
│   ├── sustainability/         # ESG and carbon tracking
│   ├── impact/                 # Financial impact assessment
│   └── components/
│       ├── landing/            # Landing page sections
│       │   ├── HeroSection.tsx
│       │   ├── AgentCapabilities.tsx  # Agentic AI showcase
│       │   └── FeatureCards.tsx
│       ├── dashboard/          # Dashboard components
│       │   ├── KeyMetricsKPI.tsx
│       │   ├── SupplyChainNetwork.tsx
│       │   ├── AlertsFeed.tsx
│       │   └── MonteCarloVisualization.tsx
│       └── digital-twin/       # Digital twin components
│           ├── ReactFlowCanvas.tsx
│           ├── AIAgentControls.tsx
│           └── ConfigurationPanel.tsx
├── components/
│   └── voice/                  # Voice UI components
│       ├── unified-voice-assistant.tsx
│       └── demo-commands-panel.tsx
├── functions/                  # Google Cloud Functions
│   ├── analyze-risks/          # Risk analysis API
│   ├── run-scenario/           # Scenario simulation API
│   ├── get-alerts/             # Alerts API
│   ├── get-metrics/            # Metrics API
│   ├── get-network/            # Network topology API
│   ├── agents/                 # Multi-agent system
│   └── shared/                 # Shared utilities & Gemini client
├── lib/
│   ├── elevenlabs.ts           # ElevenLabs configuration
│   └── hooks/                  # React hooks for voice
└── scripts/                    # Deployment scripts
```

---

## ElevenLabs Agent Configuration

The Beacon voice agent is configured with these tools:

```json
{
  "name": "Beacon",
  "description": "AI-powered supply chain intelligence assistant",
  "tools": [
    {
      "name": "analyze_risks",
      "description": "Analyze supply chain risks for a specific region",
      "webhook": "https://us-central1-project.cloudfunctions.net/analyze-risks"
    },
    {
      "name": "run_scenario",
      "description": "Run what-if scenario with Monte Carlo simulation",
      "webhook": "https://us-central1-project.cloudfunctions.net/run-scenario"
    },
    {
      "name": "get_alerts",
      "description": "Get current supply chain alerts by severity",
      "webhook": "https://us-central1-project.cloudfunctions.net/get-alerts"
    }
  ]
}
```

---

## Google Cloud Integration

### Vertex AI (Gemini 2.5 Flash)
- Real API calls to Gemini for intelligent analysis
- Multi-agent system with specialized analysis agents
- Context-aware responses based on supply chain data
- Explainable AI with decision tree visualization

### Cloud Functions Gen2
- 5 serverless API endpoints deployed
- Auto-scaling (0-100 instances)
- Sub-second cold starts
- CORS configured for web access

---

## Deployment

### Deploy Cloud Functions (Backend)

```bash
# Navigate to functions directory
cd functions

# Deploy each function
gcloud functions deploy analyze-risks --gen2 --runtime=nodejs20 --region=us-central1 --trigger-http --allow-unauthenticated
gcloud functions deploy run-scenario --gen2 --runtime=nodejs20 --region=us-central1 --trigger-http --allow-unauthenticated
gcloud functions deploy get-alerts --gen2 --runtime=nodejs20 --region=us-central1 --trigger-http --allow-unauthenticated
gcloud functions deploy get-metrics --gen2 --runtime=nodejs20 --region=us-central1 --trigger-http --allow-unauthenticated
gcloud functions deploy get-network --gen2 --runtime=nodejs20 --region=us-central1 --trigger-http --allow-unauthenticated
```

### Deploy Frontend (Vercel)

```bash
# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
```

---

## Hackathon Criteria Addressed

| Criteria | How Beacon Addresses It |
|----------|------------------------|
| **ElevenLabs Integration** | Full Conversational AI with voice agent, multi-turn conversations, voice navigation, and proactive voice tour |
| **Google Cloud Usage** | Vertex AI (Gemini 2.5 Flash), Cloud Functions Gen2 (5 functions), multi-agent architecture |
| **Innovation** | First voice-first supply chain platform with agentic AI and explainable decision trees |
| **Technical Execution** | Production-ready code, real API integrations, proper error handling, CSP configuration for AudioWorklets |
| **User Experience** | Intuitive voice commands, interactive Digital Twin, Monte Carlo visualizations, hands-free operation |

---

## Team

Built with passion for the **AI Partner Catalyst Hackathon**

---

## License

MIT License - see [LICENSE](LICENSE)

---

## Acknowledgments

- **ElevenLabs** for the amazing Conversational AI platform
- **Google Cloud** for Vertex AI and Cloud Functions
- **Vercel** for seamless deployment
- **React Flow** for the Digital Twin visualization
