import { Request, Response } from 'express';
import { z } from 'zod';

// Data integration service for VoiceOps AI
// Implements external system connectivity and data synchronization

interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'database' | 'file' | 'stream';
  connectionConfig: {
    url?: string;
    apiKey?: string;
    database?: string;
    table?: string;
    format?: 'json' | 'csv' | 'xml';
    authentication?: 'none' | 'api_key' | 'oauth' | 'basic';
  };
  syncFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  dataMapping: Record<string, string>; // source field -> target field
  enabled: boolean;
}

interface DataIntegrationRequest {
  action: 'sync_data' | 'validate_source' | 'configure_source' | 'get_status';
  sources?: DataSource[];
  sourceIds?: string[];
  syncOptions?: {
    fullSync?: boolean;
    timeRange?: { start: string; end: string };
    batchSize?: number;
  };
}

const DataIntegrationRequestSchema = z.object({
  action: z.enum(['sync_data', 'validate_source', 'configure_source', 'get_status']),
  sources: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['api', 'database', 'file', 'stream']),
    connectionConfig: z.object({
      url: z.string().optional(),
      apiKey: z.string().optional(),
      database: z.string().optional(),
      table: z.string().optional(),
      format: z.enum(['json', 'csv', 'xml']).optional(),
      authentication: z.enum(['none', 'api_key', 'oauth', 'basic']).optional(),
    }),
    syncFrequency: z.enum(['real_time', 'hourly', 'daily', 'weekly']),
    dataMapping: z.record(z.string()),
    enabled: z.boolean(),
  })).optional(),
  sourceIds: z.array(z.string()).optional(),
  syncOptions: z.object({
    fullSync: z.boolean().optional(),
    timeRange: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    batchSize: z.number().min(1).max(10000).optional(),
  }).optional(),
});

// Mock data sources for demonstration
const MOCK_DATA_SOURCES: DataSource[] = [
  {
    id: 'erp_system',
    name: 'ERP System',
    type: 'api',
    connectionConfig: {
      url: 'https://api.erp-system.com/v1',
      authentication: 'api_key',
      format: 'json',
    },
    syncFrequency: 'hourly',
    dataMapping: {
      'order_id': 'orderId',
      'customer_name': 'customerName',
      'order_date': 'orderDate',
      'total_amount': 'totalAmount',
    },
    enabled: true,
  },
  {
    id: 'warehouse_db',
    name: 'Warehouse Database',
    type: 'database',
    connectionConfig: {
      database: 'warehouse_prod',
      table: 'inventory',
      authentication: 'basic',
    },
    syncFrequency: 'real_time',
    dataMapping: {
      'product_id': 'productId',
      'quantity': 'stockLevel',
      'location': 'warehouseLocation',
      'last_updated': 'lastUpdated',
    },
    enabled: true,
  },
  {
    id: 'supplier_feed',
    name: 'Supplier Data Feed',
    type: 'file',
    connectionConfig: {
      url: 'https://supplier.com/data/daily_feed.csv',
      format: 'csv',
      authentication: 'none',
    },
    syncFrequency: 'daily',
    dataMapping: {
      'supplier_id': 'supplierId',
      'product_code': 'productCode',
      'price': 'unitPrice',
      'availability': 'available',
    },
    enabled: true,
  },
];

// In-memory storage for sync status (in production, use persistent storage)
const syncStatus = new Map<string, any>();
const syncHistory = new Map<string, any[]>();

/**
 * Handle data integration requests
 * Requirement 8.1: Support standard API protocols for supply chain data exchange
 * Requirement 8.3: Maintain data consistency across impact, sustainability, and optimization modules
 * Requirement 8.5: Ensure data accuracy with validation and error handling mechanisms
 */
export const dataIntegration = async (req: Request, res: Response): Promise<void> => {
  try {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Validate request body
    const validationResult = DataIntegrationRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Invalid request format',
        details: validationResult.error.errors,
      });
      return;
    }

    const { action, sources, sourceIds, syncOptions } = validationResult.data;

    let response;
    switch (action) {
      case 'sync_data':
        response = await handleDataSync(sourceIds || [], syncOptions || {});
        break;
      case 'validate_source':
        response = await handleSourceValidation(sources || []);
        break;
      case 'configure_source':
        response = await handleSourceConfiguration(sources || []);
        break;
      case 'get_status':
        response = await handleStatusRequest(sourceIds);
        break;
      default:
        res.status(400).json({ error: 'Invalid action specified' });
        return;
    }

    console.log('Data integration request processed:', {
      action,
      sourceCount: sources?.length || sourceIds?.length || 0,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error in data integration:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Handle data synchronization
 */
async function handleDataSync(sourceIds: string[], syncOptions: any) {
  const targetSources = sourceIds.length > 0 ? 
    MOCK_DATA_SOURCES.filter(source => sourceIds.includes(source.id)) :
    MOCK_DATA_SOURCES.filter(source => source.enabled);

  const syncResults = [];
  const errors = [];

  for (const source of targetSources) {
    try {
      const result = await syncDataSource(source, syncOptions);
      syncResults.push(result);
      
      // Update sync status
      syncStatus.set(source.id, {
        lastSync: new Date().toISOString(),
        status: 'success',
        recordsProcessed: result.recordsProcessed,
        nextSync: calculateNextSync(source.syncFrequency),
      });

      // Add to sync history
      const history = syncHistory.get(source.id) || [];
      history.push({
        timestamp: new Date().toISOString(),
        status: 'success',
        recordsProcessed: result.recordsProcessed,
        duration: result.duration,
      });
      syncHistory.set(source.id, history.slice(-10)); // Keep last 10 entries

    } catch (error) {
      const errorResult = {
        sourceId: source.id,
        sourceName: source.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
      
      errors.push(errorResult);
      
      // Update sync status with error
      syncStatus.set(source.id, {
        lastSync: new Date().toISOString(),
        status: 'error',
        error: errorResult.error,
        nextSync: calculateNextSync(source.syncFrequency),
      });
    }
  }

  return {
    success: true,
    syncResults,
    errors,
    summary: {
      totalSources: targetSources.length,
      successfulSyncs: syncResults.length,
      failedSyncs: errors.length,
      totalRecordsProcessed: syncResults.reduce((sum, result) => sum + result.recordsProcessed, 0),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Sync data from a single source
 */
async function syncDataSource(source: DataSource, syncOptions: any) {
  const startTime = Date.now();
  
  // Simulate data fetching based on source type
  let rawData;
  switch (source.type) {
    case 'api':
      rawData = await fetchApiData(source, syncOptions);
      break;
    case 'database':
      rawData = await fetchDatabaseData(source, syncOptions);
      break;
    case 'file':
      rawData = await fetchFileData(source, syncOptions);
      break;
    case 'stream':
      rawData = await fetchStreamData(source, syncOptions);
      break;
    default:
      throw new Error(`Unsupported source type: ${source.type}`);
  }

  // Transform data using mapping
  const transformedData = transformData(rawData, source.dataMapping);
  
  // Validate data quality
  const validationResults = validateDataQuality(transformedData, source);
  
  // Store data (in production, would store in actual database)
  const recordsProcessed = await storeData(transformedData, source.id);

  const duration = Date.now() - startTime;

  return {
    sourceId: source.id,
    sourceName: source.name,
    status: 'success',
    recordsProcessed,
    duration,
    dataQuality: validationResults,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch data from API source
 */
async function fetchApiData(source: DataSource, syncOptions: any) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  
  const recordCount = syncOptions.fullSync ? 1000 + Math.floor(Math.random() * 4000) : 50 + Math.floor(Math.random() * 200);
  
  return Array.from({ length: recordCount }, (_, i) => ({
    order_id: `ORD-${Date.now()}-${i}`,
    customer_name: `Customer ${i + 1}`,
    order_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    total_amount: Math.round((Math.random() * 1000 + 50) * 100) / 100,
  }));
}

/**
 * Fetch data from database source
 */
async function fetchDatabaseData(source: DataSource, syncOptions: any) {
  // Simulate database query
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  
  const recordCount = syncOptions.fullSync ? 500 + Math.floor(Math.random() * 2000) : 25 + Math.floor(Math.random() * 100);
  
  return Array.from({ length: recordCount }, (_, i) => ({
    product_id: `PROD-${1000 + i}`,
    quantity: Math.floor(Math.random() * 1000),
    location: `Warehouse-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
    last_updated: new Date().toISOString(),
  }));
}

/**
 * Fetch data from file source
 */
async function fetchFileData(source: DataSource, syncOptions: any) {
  // Simulate file download and parsing
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  const recordCount = 100 + Math.floor(Math.random() * 400);
  
  return Array.from({ length: recordCount }, (_, i) => ({
    supplier_id: `SUP-${100 + i}`,
    product_code: `PC-${10000 + i}`,
    price: Math.round((Math.random() * 100 + 10) * 100) / 100,
    availability: Math.random() > 0.1 ? 'available' : 'out_of_stock',
  }));
}

/**
 * Fetch data from stream source
 */
async function fetchStreamData(source: DataSource, syncOptions: any) {
  // Simulate real-time stream processing
  await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
  
  const recordCount = 5 + Math.floor(Math.random() * 15);
  
  return Array.from({ length: recordCount }, (_, i) => ({
    event_id: `EVT-${Date.now()}-${i}`,
    event_type: ['order_created', 'shipment_updated', 'delivery_completed'][Math.floor(Math.random() * 3)],
    timestamp: new Date().toISOString(),
    data: { value: Math.random() * 100 },
  }));
}

/**
 * Transform data using field mapping
 */
function transformData(rawData: any[], mapping: Record<string, string>) {
  return rawData.map(record => {
    const transformed: any = {};
    
    for (const [sourceField, targetField] of Object.entries(mapping)) {
      if (record.hasOwnProperty(sourceField)) {
        transformed[targetField] = record[sourceField];
      }
    }
    
    // Add metadata
    transformed._source_timestamp = new Date().toISOString();
    transformed._record_id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return transformed;
  });
}

/**
 * Validate data quality
 */
function validateDataQuality(data: any[], source: DataSource) {
  const validationResults = {
    totalRecords: data.length,
    validRecords: 0,
    invalidRecords: 0,
    missingFields: 0,
    duplicates: 0,
    qualityScore: 0,
    issues: [] as string[],
  };

  const seenRecords = new Set();
  const requiredFields = Object.values(source.dataMapping);

  for (const record of data) {
    let isValid = true;
    
    // Check for required fields
    for (const field of requiredFields) {
      if (!record.hasOwnProperty(field) || record[field] === null || record[field] === undefined) {
        validationResults.missingFields++;
        isValid = false;
      }
    }
    
    // Check for duplicates (simplified)
    const recordKey = JSON.stringify(record);
    if (seenRecords.has(recordKey)) {
      validationResults.duplicates++;
      isValid = false;
    } else {
      seenRecords.add(recordKey);
    }
    
    if (isValid) {
      validationResults.validRecords++;
    } else {
      validationResults.invalidRecords++;
    }
  }

  // Calculate quality score
  validationResults.qualityScore = validationResults.totalRecords > 0 ? 
    Math.round((validationResults.validRecords / validationResults.totalRecords) * 100) : 0;

  // Generate issues summary
  if (validationResults.missingFields > 0) {
    validationResults.issues.push(`${validationResults.missingFields} records with missing required fields`);
  }
  if (validationResults.duplicates > 0) {
    validationResults.issues.push(`${validationResults.duplicates} duplicate records found`);
  }

  return validationResults;
}

/**
 * Store transformed data
 */
async function storeData(data: any[], sourceId: string): Promise<number> {
  // Simulate data storage
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  
  // In production, would store in actual database/data warehouse
  console.log(`Stored ${data.length} records from source ${sourceId}`);
  
  return data.length;
}

/**
 * Calculate next sync time
 */
function calculateNextSync(frequency: string): string {
  const now = new Date();
  
  switch (frequency) {
    case 'real_time':
      return new Date(now.getTime() + 60 * 1000).toISOString(); // 1 minute
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 1 day
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 1 week
    default:
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // Default to 1 hour
  }
}

/**
 * Handle source validation
 */
async function handleSourceValidation(sources: DataSource[]) {
  const validationResults = [];

  for (const source of sources) {
    try {
      const result = await validateDataSource(source);
      validationResults.push(result);
    } catch (error) {
      validationResults.push({
        sourceId: source.id,
        sourceName: source.name,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return {
    success: true,
    validationResults,
    summary: {
      totalSources: sources.length,
      validSources: validationResults.filter(r => r.isValid).length,
      invalidSources: validationResults.filter(r => !r.isValid).length,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate a single data source
 */
async function validateDataSource(source: DataSource) {
  const validationChecks = [];
  let isValid = true;

  // Check connection configuration
  if (source.type === 'api' && !source.connectionConfig.url) {
    validationChecks.push({ check: 'API URL', status: 'failed', message: 'URL is required for API sources' });
    isValid = false;
  } else {
    validationChecks.push({ check: 'API URL', status: 'passed', message: 'URL is properly configured' });
  }

  // Check authentication
  if (source.connectionConfig.authentication === 'api_key' && !source.connectionConfig.apiKey) {
    validationChecks.push({ check: 'Authentication', status: 'failed', message: 'API key is required' });
    isValid = false;
  } else {
    validationChecks.push({ check: 'Authentication', status: 'passed', message: 'Authentication is properly configured' });
  }

  // Check data mapping
  if (Object.keys(source.dataMapping).length === 0) {
    validationChecks.push({ check: 'Data Mapping', status: 'failed', message: 'At least one field mapping is required' });
    isValid = false;
  } else {
    validationChecks.push({ check: 'Data Mapping', status: 'passed', message: `${Object.keys(source.dataMapping).length} field mappings configured` });
  }

  // Test connection (simulated)
  try {
    await testConnection(source);
    validationChecks.push({ check: 'Connection Test', status: 'passed', message: 'Successfully connected to data source' });
  } catch (error) {
    validationChecks.push({ check: 'Connection Test', status: 'failed', message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    isValid = false;
  }

  return {
    sourceId: source.id,
    sourceName: source.name,
    isValid,
    validationChecks,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Test connection to data source
 */
async function testConnection(source: DataSource): Promise<void> {
  // Simulate connection test
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  
  // Randomly fail some connections for demonstration
  if (Math.random() < 0.1) {
    throw new Error('Connection timeout');
  }
}

/**
 * Handle source configuration
 */
async function handleSourceConfiguration(sources: DataSource[]) {
  const configurationResults = [];

  for (const source of sources) {
    try {
      // In production, would save to persistent storage
      const existingIndex = MOCK_DATA_SOURCES.findIndex(s => s.id === source.id);
      if (existingIndex >= 0) {
        MOCK_DATA_SOURCES[existingIndex] = source;
      } else {
        MOCK_DATA_SOURCES.push(source);
      }

      configurationResults.push({
        sourceId: source.id,
        sourceName: source.name,
        status: 'configured',
        message: 'Source configuration updated successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      configurationResults.push({
        sourceId: source.id,
        sourceName: source.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return {
    success: true,
    configurationResults,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle status request
 */
async function handleStatusRequest(sourceIds?: string[]) {
  const targetSources = sourceIds ? 
    MOCK_DATA_SOURCES.filter(source => sourceIds.includes(source.id)) :
    MOCK_DATA_SOURCES;

  const statusResults = targetSources.map(source => {
    const status = syncStatus.get(source.id);
    const history = syncHistory.get(source.id) || [];

    return {
      sourceId: source.id,
      sourceName: source.name,
      type: source.type,
      enabled: source.enabled,
      syncFrequency: source.syncFrequency,
      lastSync: status?.lastSync || 'Never',
      nextSync: status?.nextSync || calculateNextSync(source.syncFrequency),
      status: status?.status || 'Not synced',
      recordsProcessed: status?.recordsProcessed || 0,
      error: status?.error,
      syncHistory: history.slice(-5), // Last 5 sync attempts
    };
  });

  return {
    success: true,
    sources: statusResults,
    summary: {
      totalSources: targetSources.length,
      enabledSources: targetSources.filter(s => s.enabled).length,
      activeSyncs: statusResults.filter(s => s.status === 'success').length,
      errorSources: statusResults.filter(s => s.status === 'error').length,
    },
    timestamp: new Date().toISOString(),
  };
}

// Health check endpoint
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'healthy',
    service: 'data-integration',
    configuredSources: MOCK_DATA_SOURCES.length,
    enabledSources: MOCK_DATA_SOURCES.filter(s => s.enabled).length,
    activeSyncs: syncStatus.size,
    timestamp: new Date().toISOString(),
  });
};

// Default export for Google Cloud Functions
export default dataIntegration;