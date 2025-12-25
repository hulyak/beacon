// Performance Optimization System
// Requirement 7.3: Sub-second latency for critical metrics
// Requirement 8.2: Voice response times under 10 seconds
// Requirement: Optimize visualization rendering across device types

interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  renderTime: number;
  cacheHitRate: number;
}

interface OptimizationConfig {
  enableCaching: boolean;
  cacheSize: number;
  enableCompression: boolean;
  enableLazyLoading: boolean;
  maxConcurrentRequests: number;
  requestTimeout: number;
  enableServiceWorker: boolean;
}

class PerformanceOptimizer {
  private metrics: PerformanceMetrics[] = [];
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private config: OptimizationConfig;
  private requestQueue: Array<{ id: string; priority: number; execute: () => Promise<any> }> = [];
  private activeRequests = 0;

  constructor() {
    this.config = {
      enableCaching: true,
      cacheSize: 100,
      enableCompression: true,
      enableLazyLoading: true,
      maxConcurrentRequests: 5,
      requestTimeout: 8000, // 8 seconds
      enableServiceWorker: true
    };
  }

  /**
   * Optimize API request with caching and queue management
   */
  async optimizeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      ttl?: number; // Time to live in milliseconds
      priority?: number; // 1-10, higher is more important
      bypassCache?: boolean;
    } = {}
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      // Check cache first
      if (this.config.enableCaching && !options.bypassCache) {
        const cached = this.getCachedData(key);
        if (cached) {
          this.recordMetrics({
            responseTime: performance.now() - startTime,
            memoryUsage: this.getMemoryUsage(),
            cpuUsage: 0, // Cache hit, no CPU usage
            networkLatency: 0,
            renderTime: 0,
            cacheHitRate: 1
          });
          return cached;
        }
      }

      // Queue management for concurrent requests
      if (this.activeRequests >= this.config.maxConcurrentRequests) {
        await this.queueRequest(key, requestFn, options.priority || 5);
      }

      this.activeRequests++;
      
      // Execute request with timeout
      const result = await Promise.race([
        requestFn(),
        this.createTimeoutPromise(this.config.requestTimeout)
      ]);

      // Cache the result
      if (this.config.enableCaching) {
        this.setCachedData(key, result, options.ttl || 300000); // 5 minutes default
      }

      this.recordMetrics({
        responseTime: performance.now() - startTime,
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: this.getCPUUsage(),
        networkLatency: performance.now() - startTime,
        renderTime: 0,
        cacheHitRate: 0
      });

      return result;

    } catch (error) {
      console.error('Request optimization error:', error);
      throw error;
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  /**
   * Optimize component rendering with lazy loading and memoization
   */
  optimizeComponentRender<T>(
    componentId: string,
    renderFn: () => T,
    dependencies: any[] = []
  ): T {
    const startTime = performance.now();
    
    try {
      // Check if component should be lazy loaded
      if (this.config.enableLazyLoading && !this.isComponentVisible(componentId)) {
        return null as T; // Return placeholder or null for off-screen components
      }

      const result = renderFn();
      
      this.recordMetrics({
        responseTime: 0,
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: this.getCPUUsage(),
        networkLatency: 0,
        renderTime: performance.now() - startTime,
        cacheHitRate: 0
      });

      return result;
    } catch (error) {
      console.error('Component render optimization error:', error);
      throw error;
    }
  }

  /**
   * Optimize data visualization rendering
   */
  optimizeVisualization(
    chartType: string,
    dataSize: number,
    deviceType: 'desktop' | 'tablet' | 'mobile'
  ): {
    shouldSample: boolean;
    sampleSize: number;
    useWebGL: boolean;
    enableAnimations: boolean;
    updateInterval: number;
  } {
    const isMobile = deviceType === 'mobile';
    const isTablet = deviceType === 'tablet';
    
    // Adjust based on data size and device capabilities
    let sampleSize = dataSize;
    let shouldSample = false;
    
    if (isMobile && dataSize > 100) {
      shouldSample = true;
      sampleSize = 50;
    } else if (isTablet && dataSize > 500) {
      shouldSample = true;
      sampleSize = 200;
    } else if (dataSize > 1000) {
      shouldSample = true;
      sampleSize = 500;
    }

    return {
      shouldSample,
      sampleSize,
      useWebGL: !isMobile && dataSize > 1000,
      enableAnimations: !isMobile || dataSize < 100,
      updateInterval: isMobile ? 5000 : 2000 // Slower updates on mobile
    };
  }

  /**
   * Monitor and report performance metrics
   */
  getPerformanceReport(): {
    averageResponseTime: number;
    averageMemoryUsage: number;
    averageCPUUsage: number;
    cacheEfficiency: number;
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageResponseTime: 0,
        averageMemoryUsage: 0,
        averageCPUUsage: 0,
        cacheEfficiency: 0,
        recommendations: ['No performance data available yet']
      };
    }

    const avgResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / this.metrics.length;
    const avgMemoryUsage = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length;
    const avgCPUUsage = this.metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / this.metrics.length;
    const cacheEfficiency = this.metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / this.metrics.length;

    const recommendations: string[] = [];
    
    if (avgResponseTime > 5000) {
      recommendations.push('Consider enabling request caching to improve response times');
    }
    
    if (avgMemoryUsage > 100) {
      recommendations.push('Memory usage is high - consider implementing data pagination');
    }
    
    if (cacheEfficiency < 0.3) {
      recommendations.push('Cache hit rate is low - review caching strategy');
    }
    
    if (avgCPUUsage > 80) {
      recommendations.push('High CPU usage detected - consider optimizing calculations');
    }

    return {
      averageResponseTime: Math.round(avgResponseTime),
      averageMemoryUsage: Math.round(avgMemoryUsage),
      averageCPUUsage: Math.round(avgCPUUsage),
      cacheEfficiency: Math.round(cacheEfficiency * 100) / 100,
      recommendations
    };
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    // Manage cache size
    if (this.cache.size >= this.config.cacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async queueRequest(
    key: string,
    requestFn: () => Promise<any>,
    priority: number
  ): Promise<void> {
    return new Promise((resolve) => {
      this.requestQueue.push({
        id: key,
        priority,
        execute: async () => {
          const result = await requestFn();
          resolve(result);
          return result;
        }
      });
      
      // Sort queue by priority
      this.requestQueue.sort((a, b) => b.priority - a.priority);
    });
  }

  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0 || this.activeRequests >= this.config.maxConcurrentRequests) {
      return;
    }

    const nextRequest = this.requestQueue.shift();
    if (nextRequest) {
      this.activeRequests++;
      try {
        await nextRequest.execute();
      } finally {
        this.activeRequests--;
        this.processQueue(); // Process next in queue
      }
    }
  }

  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  private isComponentVisible(componentId: string): boolean {
    // In a real implementation, this would use Intersection Observer
    // For now, assume all components are visible
    return true;
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private getCPUUsage(): number {
    // Simplified CPU usage estimation based on recent metrics
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length === 0) return 0;
    
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    return Math.min(100, avgResponseTime / 100); // Rough estimation
  }

  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Clear performance cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update optimization configuration
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

export default performanceOptimizer;