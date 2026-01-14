// HubSpot Integration Service
// Handles authentication, data fetching, and syncing with HubSpot CRM

export interface HubSpotConfig {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientSecret?: string;
  portalId?: string;
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount: string;
    closedate: string;
    dealstage: string;
    pipeline: string;
    [key: string]: string;
  };
}

export interface HubSpotCompany {
  id: string;
  properties: {
    name: string;
    domain: string;
    industry: string;
    [key: string]: string;
  };
}

export class HubSpotClient {
  private config: HubSpotConfig;
  private baseUrl = 'https://api.hubapi.com';

  constructor(config: HubSpotConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Use access token if available, otherwise fall back to API key
    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    } else if (this.config.apiKey) {
      // API key goes in query params for HubSpot
      const url = new URL(`${this.baseUrl}${endpoint}`);
      url.searchParams.append('hapikey', this.config.apiKey);
      endpoint = url.pathname + url.search;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`HubSpot API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // Test the connection
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/crm/v3/objects/contacts?limit=1');
      return true;
    } catch (error) {
      console.error('HubSpot connection test failed:', error);
      return false;
    }
  }

  // Fetch all deals
  async getDeals(filters?: {
    pipelineId?: string;
    dealstage?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<HubSpotDeal[]> {
    const params = new URLSearchParams();
    params.append('limit', '100');
    params.append('properties', 'dealname,amount,closedate,dealstage,pipeline,createdate');

    if (filters?.dealstage) {
      params.append('filterGroups[0].filters[0].propertyName', 'dealstage');
      params.append('filterGroups[0].filters[0].operator', 'EQ');
      params.append('filterGroups[0].filters[0].value', filters.dealstage);
    }

    const response = await this.makeRequest(`/crm/v3/objects/deals?${params.toString()}`);
    return response.results || [];
  }

  // Get deal metrics for revenue tracking
  async getDealMetrics(startDate: Date, endDate: Date): Promise<{
    totalRevenue: number;
    closedWonDeals: number;
    averageDealSize: number;
    pipelineValue: number;
  }> {
    const deals = await this.getDeals();

    let totalRevenue = 0;
    let closedWonDeals = 0;
    let pipelineValue = 0;

    deals.forEach((deal) => {
      const amount = parseFloat(deal.properties.amount || '0');
      const closeDate = new Date(deal.properties.closedate);

      if (deal.properties.dealstage === 'closedwon' && closeDate >= startDate && closeDate <= endDate) {
        totalRevenue += amount;
        closedWonDeals += 1;
      } else if (deal.properties.dealstage !== 'closedwon' && deal.properties.dealstage !== 'closedlost') {
        pipelineValue += amount;
      }
    });

    return {
      totalRevenue,
      closedWonDeals,
      averageDealSize: closedWonDeals > 0 ? totalRevenue / closedWonDeals : 0,
      pipelineValue,
    };
  }

  // Fetch companies
  async getCompanies(limit: number = 100): Promise<HubSpotCompany[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('properties', 'name,domain,industry,createdate');

    const response = await this.makeRequest(`/crm/v3/objects/companies?${params.toString()}`);
    return response.results || [];
  }

  // Get new leads/contacts for a time period
  async getNewLeads(startDate: Date, endDate: Date): Promise<number> {
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    const params = new URLSearchParams();
    params.append('limit', '100');
    params.append('properties', 'createdate');

    const response = await this.makeRequest(`/crm/v3/objects/contacts?${params.toString()}`);
    const contacts = response.results || [];

    return contacts.filter((contact: any) => {
      const createDate = new Date(contact.properties.createdate).getTime();
      return createDate >= startTimestamp && createDate <= endTimestamp;
    }).length;
  }

  // Get pipeline stages for configuration
  async getPipelines(): Promise<any[]> {
    const response = await this.makeRequest('/crm/v3/pipelines/deals');
    return response.results || [];
  }

  // Execute custom search query with aggregation
  async executeQueryWithAggregation(
    objectType: 'deals' | 'contacts' | 'companies',
    filterCriteria: Record<string, any>,
    aggregationMethod: 'sum' | 'count' | 'average' | 'max' | 'min',
    valueField?: string
  ): Promise<number> {
    // Build search request
    const searchBody: any = {
      limit: 100,
      properties: valueField ? [valueField] : [],
      filterGroups: []
    };

    // Convert filter criteria to HubSpot filter format
    const filters: any[] = [];
    Object.entries(filterCriteria).forEach(([propertyName, criteria]) => {
      if (typeof criteria === 'object' && criteria !== null) {
        // Handle operators like { gte: "2024-01-01" } or { neq: ["value1", "value2"] }
        Object.entries(criteria).forEach(([operator, value]) => {
          // If value is an array, create multiple filters (for NEQ, etc.)
          if (Array.isArray(value)) {
            value.forEach((v) => {
              filters.push({
                propertyName,
                operator: operator.toUpperCase(),
                value: v
              });
            });
          } else {
            filters.push({
              propertyName,
              operator: operator.toUpperCase(),
              value
            });
          }
        });
      } else {
        // Simple equality
        filters.push({
          propertyName,
          operator: 'EQ',
          value: criteria
        });
      }
    });

    if (filters.length > 0) {
      searchBody.filterGroups.push({ filters });
    }

    // Fetch all results (handling pagination)
    let allResults: any[] = [];
    let hasMore = true;
    let after: string | undefined;

    while (hasMore && allResults.length < 10000) { // Safety limit
      if (after) {
        searchBody.after = after;
      }

      const response = await this.makeRequest(
        `/crm/v3/objects/${objectType}/search`,
        {
          method: 'POST',
          body: JSON.stringify(searchBody)
        }
      );

      allResults = allResults.concat(response.results || []);
      hasMore = response.paging?.next !== undefined;
      after = response.paging?.next?.after;
    }

    // Apply aggregation
    if (aggregationMethod === 'count') {
      return allResults.length;
    }

    if (!valueField) {
      throw new Error('valueField is required for aggregation methods other than count');
    }

    // Extract values
    const values: number[] = [];
    allResults.forEach((obj) => {
      const value = obj.properties?.[valueField];
      if (typeof value === 'number') {
        values.push(value);
      } else if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          values.push(parsed);
        }
      }
    });

    if (values.length === 0) {
      return 0;
    }

    switch (aggregationMethod) {
      case 'sum':
        return values.reduce((acc, val) => acc + val, 0);
      case 'average':
        return values.reduce((acc, val) => acc + val, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return 0;
    }
  }
}

// Helper function to create HubSpot client from config
export function createHubSpotClient(config: HubSpotConfig): HubSpotClient {
  return new HubSpotClient(config);
}
