import { NextRequest, NextResponse } from 'next/server';
import { EmassClient } from '@/lib/emass';

export const dynamic = 'force-dynamic';

// Get eMASS configuration from environment variables
function getEmassConfig() {
  const baseUrl = process.env.EMASS_BASE_URL || process.env.NEXT_PUBLIC_EMASS_BASE_URL;
  const apiKey = process.env.EMASS_API_KEY;
  const userId = process.env.EMASS_USER_ID;
  const userUid = process.env.EMASS_USER_UID;

  if (!baseUrl || !apiKey) {
    throw new Error('eMASS configuration missing. Please set EMASS_BASE_URL and EMASS_API_KEY environment variables.');
  }

  return { baseUrl, apiKey, userId, userUid };
}

export async function GET(request: NextRequest) {
  try {
    const config = getEmassConfig();
    const client = new EmassClient(config);
    
    const systems = await client.getSystems();
    
    return NextResponse.json({
      success: true,
      data: systems,
      count: systems.length,
    });
  } catch (error: any) {
    console.error('Error fetching eMASS systems:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch systems',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = getEmassConfig();
    const client = new EmassClient(config);
    
    const body = await request.json();
    const system = await client.createSystem(body);
    
    return NextResponse.json({
      success: true,
      data: system,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating eMASS system:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create system',
      },
      { status: 500 }
    );
  }
}


