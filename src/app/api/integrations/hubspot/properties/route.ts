import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHubSpotClient } from '@/lib/integrations/hubspot';

// Simple in-memory cache with 15-minute TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Fallback properties if API fails
const FALLBACK_PROPERTIES: Record<string, any[]> = {
  deals: [
    { name: 'dealname', label: 'Deal Name', type: 'string', fieldType: 'text' },
    { name: 'amount', label: 'Amount', type: 'number', fieldType: 'number' },
    { name: 'dealstage', label: 'Deal Stage', type: 'enumeration', fieldType: 'select', options: [
      { label: 'Appointment Scheduled', value: 'appointmentscheduled' },
      { label: 'Qualified to Buy', value: 'qualifiedtobuy' },
      { label: 'Presentation Scheduled', value: 'presentationscheduled' },
      { label: 'Decision Maker Bought-In', value: 'decisionmakerboughtin' },
      { label: 'Contract Sent', value: 'contractsent' },
      { label: 'Closed Won', value: 'closedwon' },
      { label: 'Closed Lost', value: 'closedlost' },
    ]},
    { name: 'closedate', label: 'Close Date', type: 'date', fieldType: 'date' },
    { name: 'createdate', label: 'Create Date', type: 'date', fieldType: 'date' },
    { name: 'pipeline', label: 'Pipeline', type: 'enumeration', fieldType: 'select' },
  ],
  contacts: [
    { name: 'firstname', label: 'First Name', type: 'string', fieldType: 'text' },
    { name: 'lastname', label: 'Last Name', type: 'string', fieldType: 'text' },
    { name: 'email', label: 'Email', type: 'string', fieldType: 'text' },
    { name: 'createdate', label: 'Create Date', type: 'date', fieldType: 'date' },
    { name: 'lifecyclestage', label: 'Lifecycle Stage', type: 'enumeration', fieldType: 'select', options: [
      { label: 'Subscriber', value: 'subscriber' },
      { label: 'Lead', value: 'lead' },
      { label: 'Marketing Qualified Lead', value: 'marketingqualifiedlead' },
      { label: 'Sales Qualified Lead', value: 'salesqualifiedlead' },
      { label: 'Opportunity', value: 'opportunity' },
      { label: 'Customer', value: 'customer' },
    ]},
  ],
  companies: [
    { name: 'name', label: 'Company Name', type: 'string', fieldType: 'text' },
    { name: 'domain', label: 'Domain', type: 'string', fieldType: 'text' },
    { name: 'industry', label: 'Industry', type: 'string', fieldType: 'text' },
    { name: 'createdate', label: 'Create Date', type: 'date', fieldType: 'date' },
    { name: 'numberofemployees', label: 'Number of Employees', type: 'number', fieldType: 'number' },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const objectType = searchParams.get('objectType') || 'deals';

    // Check cache first
    const cacheKey = `properties:${objectType}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[HubSpot Properties API] Using cached properties for ${objectType}`);
      return NextResponse.json({ properties: cached.data, cached: true });
    }

    // Get HubSpot integration config
    const supabase = await createClient();
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'hubspot')
      .eq('is_active', true)
      .single();

    if (!integration) {
      console.log('[HubSpot Properties API] No active HubSpot integration, using fallback');
      return NextResponse.json({ properties: FALLBACK_PROPERTIES[objectType] || [], cached: false });
    }

    // Fetch properties from HubSpot API
    const client = createHubSpotClient(integration.config);

    try {
      const response = await (client as any).makeRequest(`/crm/v3/properties/${objectType}`);

      // Transform HubSpot properties to our format
      const properties = (response.results || []).map((prop: any) => {
        // Determine type from HubSpot's type field
        let type: 'string' | 'number' | 'date' | 'enumeration' = 'string';
        if (prop.type === 'number') type = 'number';
        else if (prop.type === 'date' || prop.type === 'datetime') type = 'date';
        else if (prop.type === 'enumeration') type = 'enumeration';

        const transformed: any = {
          name: prop.name,
          label: prop.label,
          type,
          fieldType: prop.fieldType || 'text',
        };

        // Add options for enumeration fields
        if (type === 'enumeration' && prop.options && prop.options.length > 0) {
          transformed.options = prop.options.map((opt: any) => ({
            label: opt.label,
            value: opt.value,
          }));
        } else if (type === 'enumeration') {
          // If enumeration has no options from API, try to use fallback options
          const fallbackProperty = FALLBACK_PROPERTIES[objectType]?.find(
            (fp: any) => fp.name === prop.name
          );
          if (fallbackProperty && fallbackProperty.options) {
            transformed.options = fallbackProperty.options;
            console.log(`[HubSpot Properties API] Using fallback options for ${prop.name}`);
          } else {
            transformed.options = [];
          }
        }

        return transformed;
      });

      // Cache the result
      cache.set(cacheKey, { data: properties, timestamp: Date.now() });
      console.log(`[HubSpot Properties API] Fetched ${properties.length} properties for ${objectType}`);

      return NextResponse.json({ properties, cached: false });
    } catch (apiError: any) {
      console.error('[HubSpot Properties API] Error fetching from HubSpot:', apiError.message);
      // Return fallback properties if API call fails
      return NextResponse.json({
        properties: FALLBACK_PROPERTIES[objectType] || [],
        cached: false,
        error: 'Using fallback properties due to API error'
      });
    }
  } catch (error) {
    console.error('[HubSpot Properties API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}
