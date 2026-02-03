import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createHubSpotClient } from '@/lib/integrations/hubspot';

// GET - Fetch deals from HubSpot with optional filters
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const pipeline = searchParams.get('pipeline') || 'default';
  const quarterOnly = searchParams.get('quarterOnly') === 'true';
  const excludeClosed = searchParams.get('excludeClosed') !== 'false'; // Default true

  // Get the HubSpot integration
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('*')
    .eq('type', 'hubspot')
    .eq('is_active', true)
    .single();

  if (integrationError || !integration) {
    return NextResponse.json(
      { error: 'HubSpot integration not found or not active' },
      { status: 404 }
    );
  }

  try {
    const client = createHubSpotClient(integration.config);

    // Build filter criteria
    const filters: any[] = [
      { propertyName: 'pipeline', operator: 'EQ', value: pipeline }
    ];

    // Exclude closed deals
    if (excludeClosed) {
      filters.push({ propertyName: 'dealstage', operator: 'NEQ', value: 'closedwon' });
      filters.push({ propertyName: 'dealstage', operator: 'NEQ', value: 'closedlost' });
    }

    // Filter by current quarter
    if (quarterOnly) {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
      const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);

      const formatDate = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Format end-of-day to include full last day of quarter
      const formatEndOfDay = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T23:59:59.999Z`;

      filters.push({ propertyName: 'closedate', operator: 'GTE', value: formatDate(quarterStart) });
      filters.push({ propertyName: 'closedate', operator: 'LTE', value: formatEndOfDay(quarterEnd) });
    }

    // Search for deals
    const searchBody = {
      limit: 100,
      properties: ['dealname', 'amount', 'closedate', 'dealstage', 'pipeline', 'createdate', 'hs_lastmodifieddate'],
      filterGroups: [{ filters }],
      sorts: [{ propertyName: 'amount', direction: 'DESCENDING' }]
    };

    // Use the private makeRequest method via a workaround - call the search endpoint
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HubSpot API error:', errorText);
      return NextResponse.json(
        { error: `HubSpot API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const deals = data.results || [];

    // Calculate totals
    const totalAmount = deals.reduce((sum: number, deal: any) => {
      return sum + parseFloat(deal.properties?.amount || '0');
    }, 0);

    // Format deals for response
    const formattedDeals = deals.map((deal: any) => ({
      id: deal.id,
      name: deal.properties?.dealname || 'Unnamed Deal',
      amount: parseFloat(deal.properties?.amount || '0'),
      amountFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(parseFloat(deal.properties?.amount || '0')),
      closeDate: deal.properties?.closedate,
      stage: deal.properties?.dealstage,
      pipeline: deal.properties?.pipeline,
      createdAt: deal.properties?.createdate,
      lastModified: deal.properties?.hs_lastmodifieddate
    }));

    return NextResponse.json({
      success: true,
      filters: {
        pipeline,
        quarterOnly,
        excludeClosed
      },
      summary: {
        dealCount: deals.length,
        totalAmount,
        totalAmountFormatted: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(totalAmount)
      },
      deals: formattedDeals
    });

  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: `Failed to fetch deals: ${error.message}` },
      { status: 500 }
    );
  }
}
