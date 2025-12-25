/**
 * Web Researcher Agent
 * Specializes in gathering real-time intelligence from web sources using Tavily
 */

import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { GeminiClient } from '../shared/gemini-client';
import {
  getTavilyClient,
  isTavilyConfigured,
  WebRisk,
  NewsItem,
  GeopoliticalAlert,
  TavilyClient,
} from '../shared/tavily-client';
import { Region } from '../shared/types';

interface WebResearchResult {
  region?: string;
  supplier?: string;
  risks: WebRisk[];
  news: NewsItem[];
  geopoliticalAlerts: GeopoliticalAlert[];
  summary: string;
  dataFreshness: string;
  sources: string[];
}

export class WebResearcherAgent extends BaseAgent {
  readonly name = 'web-researcher';
  readonly description = 'Gathers real-time supply chain intelligence from web sources';
  readonly capabilities = [
    'web_search',
    'news_monitoring',
    'geopolitical_scanning',
    'supplier_tracking',
    'real_time_alerts',
  ];

  readonly systemPrompt = `You are a Supply Chain Intelligence Researcher. Your role is to:
1. Monitor real-time news and events affecting supply chains
2. Track supplier activities and market changes
3. Identify emerging geopolitical risks
4. Synthesize information from multiple web sources
5. Provide actionable intelligence summaries

Guidelines:
- Focus on recent, credible news sources
- Distinguish between confirmed reports and speculation
- Highlight time-sensitive information
- Provide source attribution for key claims
- Flag high-impact developments requiring immediate attention`;

  private tavilyClient: TavilyClient | null = null;

  constructor(geminiClient: GeminiClient) {
    super(geminiClient);
    if (isTavilyConfigured()) {
      try {
        this.tavilyClient = getTavilyClient();
      } catch {
        // Tavily not configured, will use fallback
      }
    }
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();

    // Validate input
    const validation = this.validateInput(input);
    if (!validation.valid) {
      return this.createErrorOutput(validation.errors.join('; '), startTime);
    }

    try {
      // Extract parameters
      const region = input.parameters?.region as Region;
      const supplier = input.parameters?.supplier as string;
      const searchType = input.parameters?.searchType as string || 'comprehensive';

      let risks: WebRisk[] = [];
      let news: NewsItem[] = [];
      let geopoliticalAlerts: GeopoliticalAlert[] = [];
      const sources = new Set<string>();
      let dataFreshness = 'Unknown';

      if (this.tavilyClient) {
        // Perform web research based on parameters
        if (region) {
          // Search for risks in the region
          const regionRisks = await this.tavilyClient.searchRisks(region);
          risks.push(...regionRisks);
          regionRisks.forEach((r) => sources.add(r.source));

          // Search for port disruptions if logistics-focused
          if (searchType === 'logistics' || searchType === 'comprehensive') {
            const portRisks = await this.tavilyClient.searchPortDisruptions(region);
            risks.push(...portRisks);
            portRisks.forEach((r) => sources.add(r.source));
          }

          // Scan for geopolitical risks
          if (searchType === 'geopolitical' || searchType === 'comprehensive') {
            geopoliticalAlerts = await this.tavilyClient.scanGeopolitical([region]);
            geopoliticalAlerts.forEach((a) => sources.add(a.source));
          }

          // Weather risks
          if (searchType === 'weather' || searchType === 'comprehensive') {
            const weatherRisks = await this.tavilyClient.searchWeatherRisks(region);
            risks.push(...weatherRisks);
            weatherRisks.forEach((r) => sources.add(r.source));
          }
        }

        // Supplier-specific research
        if (supplier) {
          news = await this.tavilyClient.getSupplierNews(supplier);
          news.forEach((n) => sources.add(n.source));
        }

        // If no specific parameters, do a global scan
        if (!region && !supplier) {
          const globalAlerts = await this.tavilyClient.scanGeopolitical([
            'asia',
            'europe',
            'north_america',
          ]);
          geopoliticalAlerts.push(...globalAlerts);
          globalAlerts.forEach((a) => sources.add(a.source));
        }

        dataFreshness = 'Real-time (last 24-48 hours)';
      } else {
        // Fallback when Tavily is not configured
        risks = this.getFallbackRisks(region);
        geopoliticalAlerts = this.getFallbackGeopoliticalAlerts();
        dataFreshness = 'Cached/simulated data';
        sources.add('beacon-internal');
      }

      // Deduplicate risks
      risks = this.deduplicateRisks(risks);

      // Generate AI summary
      const summary = await this.generateSummary(
        input.query,
        risks,
        news,
        geopoliticalAlerts
      );

      const result: WebResearchResult = {
        region: region || undefined,
        supplier: supplier || undefined,
        risks,
        news,
        geopoliticalAlerts,
        summary,
        dataFreshness,
        sources: Array.from(sources),
      };

      // Calculate confidence based on data quality
      const confidence = this.calculateConfidence(
        this.tavilyClient !== null,
        risks.length,
        news.length,
        geopoliticalAlerts.length
      );

      return this.createSuccessOutput(result, confidence, startTime, {
        reasoning: `Gathered intelligence from ${sources.size} sources. Found ${risks.length} risks, ${news.length} news items, ${geopoliticalAlerts.length} geopolitical alerts.`,
        suggestedFollowUp: this.generateFollowUpSuggestions(region, supplier, risks),
      });
    } catch (error) {
      return this.createErrorOutput(
        error instanceof Error ? error : 'Web research failed',
        startTime
      );
    }
  }

  /**
   * Generate AI-powered summary of research findings
   */
  private async generateSummary(
    query: string,
    risks: WebRisk[],
    news: NewsItem[],
    alerts: GeopoliticalAlert[]
  ): Promise<string> {
    if (risks.length === 0 && news.length === 0 && alerts.length === 0) {
      return 'No significant supply chain developments found in recent web sources.';
    }

    const context = `
Query: ${query}

Risk Findings (${risks.length} total):
${risks
  .slice(0, 3)
  .map((r) => `- ${r.title} [${r.severity}]: ${r.summary}`)
  .join('\n')}

News Items (${news.length} total):
${news
  .slice(0, 3)
  .map((n) => `- ${n.title} [${n.sentiment}]: ${n.summary}`)
  .join('\n')}

Geopolitical Alerts (${alerts.length} total):
${alerts
  .slice(0, 3)
  .map((a) => `- ${a.title} [${a.severity}]: ${a.summary}`)
  .join('\n')}
`;

    try {
      const summary = await this.callGemini(
        `Summarize the following web research findings in 2-3 concise sentences, highlighting the most important developments:\n\n${context}`
      );
      return summary;
    } catch {
      // Generate manual summary as fallback
      const criticalRisks = risks.filter((r) => r.severity === 'critical' || r.severity === 'high');
      const criticalAlerts = alerts.filter((a) => a.severity === 'critical' || a.severity === 'high');

      if (criticalRisks.length > 0 || criticalAlerts.length > 0) {
        return `Found ${criticalRisks.length} high-priority risks and ${criticalAlerts.length} critical geopolitical alerts requiring attention.`;
      }

      return `Monitoring ${risks.length} supply chain risks and ${alerts.length} geopolitical developments. No critical issues detected.`;
    }
  }

  /**
   * Deduplicate risks by similarity
   */
  private deduplicateRisks(risks: WebRisk[]): WebRisk[] {
    const seen = new Map<string, WebRisk>();

    for (const risk of risks) {
      // Create a key based on normalized title
      const key = risk.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);

      if (!seen.has(key)) {
        seen.set(key, risk);
      } else {
        // Keep the one with higher severity
        const existing = seen.get(key)!;
        const severityOrder = ['low', 'medium', 'high', 'critical'];
        if (severityOrder.indexOf(risk.severity) > severityOrder.indexOf(existing.severity)) {
          seen.set(key, risk);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Calculate confidence based on data quality
   */
  private calculateConfidence(
    hasTavily: boolean,
    riskCount: number,
    newsCount: number,
    alertCount: number
  ): number {
    let confidence = 40; // Base confidence

    if (hasTavily) confidence += 30;
    if (riskCount > 0) confidence += 10;
    if (newsCount > 0) confidence += 10;
    if (alertCount > 0) confidence += 5;

    return Math.min(confidence, 95);
  }

  /**
   * Generate follow-up suggestions
   */
  private generateFollowUpSuggestions(
    region: Region | undefined,
    supplier: string | undefined,
    risks: WebRisk[]
  ): string[] {
    const suggestions: string[] = [];

    if (region) {
      suggestions.push(`Run risk analysis for ${region}`);
      suggestions.push(`Simulate a scenario in ${region}`);
    }

    if (supplier) {
      suggestions.push(`Identify alternative suppliers`);
    }

    const criticalRisks = risks.filter((r) => r.severity === 'critical');
    if (criticalRisks.length > 0) {
      suggestions.push(`Get strategic advice on: ${criticalRisks[0].title}`);
    }

    suggestions.push('Set up continuous monitoring alerts');

    return suggestions.slice(0, 3);
  }

  /**
   * Fallback risks when Tavily is not available
   */
  private getFallbackRisks(region: Region | undefined): WebRisk[] {
    const regionName = region || 'global';
    return [
      {
        id: 'fallback_1',
        title: `Supply chain monitoring active for ${regionName}`,
        summary:
          'Real-time web intelligence service not configured. Using internal monitoring data.',
        source: 'beacon-internal',
        url: '',
        region: regionName,
        category: 'logistics',
        severity: 'low',
        confidence: 50,
      },
    ];
  }

  /**
   * Fallback geopolitical alerts
   */
  private getFallbackGeopoliticalAlerts(): GeopoliticalAlert[] {
    return [
      {
        id: 'fallback_geo_1',
        title: 'Geopolitical monitoring active',
        summary:
          'Configure Tavily API for real-time geopolitical intelligence. Using baseline monitoring.',
        regions: ['Global'],
        severity: 'low',
        source: 'beacon-internal',
        url: '',
      },
    ];
  }
}
