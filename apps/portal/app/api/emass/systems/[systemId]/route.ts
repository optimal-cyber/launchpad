import { NextRequest, NextResponse } from 'next/server';
import { EmassClient } from '@/lib/emass';

export const dynamic = 'force-dynamic';

function getEmassConfig() {
  const baseUrl = process.env.EMASS_BASE_URL || process.env.NEXT_PUBLIC_EMASS_BASE_URL;
  const apiKey = process.env.EMASS_API_KEY;
  const userId = process.env.EMASS_USER_ID;
  const userUid = process.env.EMASS_USER_UID;

  if (!baseUrl || !apiKey) {
    throw new Error('eMASS configuration missing');
  }

  return { baseUrl, apiKey, userId, userUid };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { systemId: string } }
) {
  try {
    const config = getEmassConfig();
    const client = new EmassClient(config);
    
    const systemId = parseInt(params.systemId);
    const system = await client.getSystem(systemId);
    
    return NextResponse.json({
      success: true,
      data: system,
    });
  } catch (error: any) {
    console.error('Error fetching eMASS system:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch system',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { systemId: string } }
) {
  try {
    const config = getEmassConfig();
    const client = new EmassClient(config);
    
    const systemId = parseInt(params.systemId);
    const body = await request.json();
    const system = await client.updateSystem(systemId, body);
    
    return NextResponse.json({
      success: true,
      data: system,
    });
  } catch (error: any) {
    console.error('Error updating eMASS system:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update system',
      },
      { status: 500 }
    );
  }
}

