import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return available HubSpot object types
    // These are the standard CRM objects supported by HubSpot
    const objectTypes = [
      { id: 'deals', label: 'Deals', description: 'Sales pipeline opportunities' },
      { id: 'contacts', label: 'Contacts', description: 'Individual people in your CRM' },
      { id: 'companies', label: 'Companies', description: 'Organizations in your CRM' },
    ];

    return NextResponse.json({ objectTypes });
  } catch (error) {
    console.error('[HubSpot Object Types API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch object types' },
      { status: 500 }
    );
  }
}
