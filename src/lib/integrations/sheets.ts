// Google Sheets Integration Service
// Handles authentication and data fetching from Google Sheets

export interface GoogleSheetsConfig {
  // Service Account authentication (recommended for server-side)
  serviceAccountEmail?: string;
  privateKey?: string;

  // OR OAuth2 authentication
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;

  // Default spreadsheet to use
  defaultSpreadsheetId?: string;
}

export interface SheetData {
  range: string;
  values: string[][];
}

export class GoogleSheetsClient {
  private config: GoogleSheetsConfig;
  private baseUrl = 'https://sheets.googleapis.com/v4';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
  }

  // Get access token using service account or refresh token
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    if (this.config.privateKey && this.config.serviceAccountEmail) {
      // Service Account authentication using JWT
      return this.getServiceAccountToken();
    } else if (this.config.refreshToken && this.config.clientId && this.config.clientSecret) {
      // OAuth2 refresh token flow
      return this.refreshOAuthToken();
    }

    throw new Error('No valid authentication configuration provided');
  }

  // Get token using service account JWT
  private async getServiceAccountToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hour

    // Create JWT header and claims
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const claims = {
      iss: this.config.serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: expiry,
    };

    // Sign JWT (simplified - in production use a proper JWT library)
    const jwt = await this.createSignedJWT(header, claims);

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error_description: response.statusText }));
      throw new Error(`Failed to get service account token: ${error.error_description || response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return this.accessToken!;
  }

  // Create a signed JWT for service account auth
  private async createSignedJWT(header: object, claims: object): Promise<string> {
    // Base64URL encode header and claims
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedClaims = this.base64UrlEncode(JSON.stringify(claims));
    const signatureInput = `${encodedHeader}.${encodedClaims}`;

    // Import the private key and sign
    const privateKey = this.config.privateKey!
      .replace(/\\n/g, '\n')
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');

    const binaryKey = Uint8Array.from(atob(privateKey), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    );

    const encodedSignature = this.base64UrlEncode(
      String.fromCharCode(...new Uint8Array(signature))
    );

    return `${signatureInput}.${encodedSignature}`;
  }

  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // Refresh OAuth2 token
  private async refreshOAuthToken(): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        refresh_token: this.config.refreshToken!,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error_description: response.statusText }));
      throw new Error(`Failed to refresh OAuth token: ${error.error_description || response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return this.accessToken!;
  }

  // Make authenticated request to Google Sheets API
  private async makeRequest(endpoint: string): Promise<any> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Google Sheets API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  // Test the connection
  async testConnection(): Promise<boolean> {
    try {
      // Try to get access token - this validates credentials
      await this.getAccessToken();

      // If we have a default spreadsheet, try to access it
      if (this.config.defaultSpreadsheetId) {
        await this.getSpreadsheetInfo(this.config.defaultSpreadsheetId);
      }

      return true;
    } catch (error) {
      console.error('Google Sheets connection test failed:', error);
      return false;
    }
  }

  // Get spreadsheet metadata
  async getSpreadsheetInfo(spreadsheetId: string): Promise<{
    title: string;
    sheets: { title: string; sheetId: number }[];
  }> {
    const data = await this.makeRequest(
      `/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`
    );

    return {
      title: data.properties.title,
      sheets: data.sheets.map((sheet: any) => ({
        title: sheet.properties.title,
        sheetId: sheet.properties.sheetId,
      })),
    };
  }

  // Read data from a range
  async getRange(spreadsheetId: string, range: string): Promise<string[][]> {
    const encodedRange = encodeURIComponent(range);
    const data = await this.makeRequest(
      `/spreadsheets/${spreadsheetId}/values/${encodedRange}`
    );

    return data.values || [];
  }

  // Read multiple ranges
  async getBatchRanges(spreadsheetId: string, ranges: string[]): Promise<SheetData[]> {
    const encodedRanges = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
    const data = await this.makeRequest(
      `/spreadsheets/${spreadsheetId}/values:batchGet?${encodedRanges}`
    );

    return (data.valueRanges || []).map((vr: any) => ({
      range: vr.range,
      values: vr.values || [],
    }));
  }

  // Get a specific cell value
  async getCellValue(spreadsheetId: string, sheetName: string, cell: string): Promise<string | null> {
    const range = `${sheetName}!${cell}`;
    const values = await this.getRange(spreadsheetId, range);
    return values[0]?.[0] || null;
  }

  // Execute query with aggregation for metric syncing
  async executeQueryWithAggregation(
    spreadsheetId: string,
    range: string,
    aggregationMethod: 'sum' | 'count' | 'average' | 'max' | 'min',
    valueColumnIndex: number = 0,
    hasHeaderRow: boolean = true
  ): Promise<number> {
    const values = await this.getRange(spreadsheetId, range);

    if (values.length === 0) {
      return 0;
    }

    // Skip header row if specified
    const dataRows = hasHeaderRow ? values.slice(1) : values;

    if (aggregationMethod === 'count') {
      return dataRows.length;
    }

    // Extract numeric values from the specified column
    const numericValues: number[] = [];
    dataRows.forEach((row) => {
      const cellValue = row[valueColumnIndex];
      if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
        // Remove currency symbols, commas, and parse
        const cleanValue = String(cellValue).replace(/[$,]/g, '').trim();
        const parsed = parseFloat(cleanValue);
        if (!isNaN(parsed)) {
          numericValues.push(parsed);
        }
      }
    });

    if (numericValues.length === 0) {
      return 0;
    }

    switch (aggregationMethod) {
      case 'sum':
        return numericValues.reduce((acc, val) => acc + val, 0);
      case 'average':
        return numericValues.reduce((acc, val) => acc + val, 0) / numericValues.length;
      case 'max':
        return Math.max(...numericValues);
      case 'min':
        return Math.min(...numericValues);
      default:
        return 0;
    }
  }

  // Find rows matching criteria
  async findRows(
    spreadsheetId: string,
    range: string,
    filterColumn: number,
    filterValue: string,
    hasHeaderRow: boolean = true
  ): Promise<string[][]> {
    const values = await this.getRange(spreadsheetId, range);

    if (values.length === 0) {
      return [];
    }

    const dataRows = hasHeaderRow ? values.slice(1) : values;

    return dataRows.filter((row) => {
      const cellValue = row[filterColumn];
      return cellValue !== undefined && String(cellValue).toLowerCase() === filterValue.toLowerCase();
    });
  }
}

// Helper function to create Google Sheets client from config
export function createGoogleSheetsClient(config: GoogleSheetsConfig): GoogleSheetsClient {
  return new GoogleSheetsClient(config);
}
