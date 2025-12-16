export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), '.oscal-storage');
const HISTORY_DIR = path.join(STORAGE_DIR, 'history');

async function ensureHistoryDir() {
  if (!existsSync(HISTORY_DIR)) {
    await mkdir(HISTORY_DIR, { recursive: true });
  }
}

// GET /api/oscal/ssp/[id]/history - Get version history for SSP document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureHistoryDir();

    // List all history files for this document
    const files = await readdir(HISTORY_DIR);
    const historyFiles = files
      .filter(f => f.startsWith(`${id}-`) && f.endsWith('.json'))
      .sort((a, b) => {
        // Extract timestamp from filename and sort descending (newest first)
        const timestampA = parseInt(a.replace(`${id}-`, '').replace('.json', ''));
        const timestampB = parseInt(b.replace(`${id}-`, '').replace('.json', ''));
        return timestampB - timestampA;
      });

    const history = await Promise.all(
      historyFiles.slice(0, 50).map(async (filename) => {
        const timestamp = parseInt(filename.replace(`${id}-`, '').replace('.json', ''));
        const filePath = path.join(HISTORY_DIR, filename);

        try {
          const data = await readFile(filePath, 'utf-8');
          const doc = JSON.parse(data);
          const ssp = doc['system-security-plan'];

          return {
            id: filename.replace('.json', ''),
            timestamp: new Date(timestamp).toISOString(),
            version: ssp?.metadata?.version || 'unknown',
            title: ssp?.metadata?.title || 'Untitled',
            controlCount: ssp?.['control-implementation']?.['implemented-requirements']?.length || 0,
          };
        } catch {
          return {
            id: filename.replace('.json', ''),
            timestamp: new Date(timestamp).toISOString(),
            version: 'unknown',
            title: 'Unknown',
            controlCount: 0,
          };
        }
      })
    );

    return NextResponse.json({
      documentId: id,
      history,
      total: historyFiles.length
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version history' },
      { status: 500 }
    );
  }
}
