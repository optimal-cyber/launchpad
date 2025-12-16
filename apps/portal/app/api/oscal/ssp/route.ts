export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Storage directory for SSP documents
const STORAGE_DIR = path.join(process.cwd(), '.oscal-storage');

// Ensure storage directory exists
async function ensureStorageDir() {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true });
  }
}

// Generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// GET /api/oscal/ssp - List all SSP documents
export async function GET() {
  try {
    await ensureStorageDir();

    const indexPath = path.join(STORAGE_DIR, 'index.json');

    if (!existsSync(indexPath)) {
      // Return empty list if no index exists
      return NextResponse.json({ ssps: [] });
    }

    const indexData = await readFile(indexPath, 'utf-8');
    const index = JSON.parse(indexData);

    return NextResponse.json({ ssps: index.documents || [] });
  } catch (error) {
    console.error('Error listing SSPs:', error);
    return NextResponse.json(
      { error: 'Failed to list SSP documents' },
      { status: 500 }
    );
  }
}

// POST /api/oscal/ssp - Create new SSP document
export async function POST(request: NextRequest) {
  try {
    await ensureStorageDir();

    const body = await request.json();
    const { title, template } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const id = generateUUID();
    const now = new Date().toISOString();

    // Create new SSP document
    const newSSP = {
      'system-security-plan': {
        uuid: id,
        metadata: {
          title,
          'last-modified': now,
          version: '1.0.0',
          'oscal-version': '1.1.3',
          props: [
            {
              name: 'marking',
              value: 'CONTROLLED UNCLASSIFIED INFORMATION'
            }
          ],
          roles: [],
          locations: [],
          parties: [],
        },
        'import-profile': {
          href: '#default-profile'
        },
        'system-characteristics': {
          'system-ids': [{ id: generateUUID() }],
          'system-name': title,
          'system-name-short': '',
          description: '',
          props: [],
        },
        'control-implementation': {
          description: '',
          'implemented-requirements': [],
        },
      },
    };

    // Save document
    const docPath = path.join(STORAGE_DIR, `${id}.json`);
    await writeFile(docPath, JSON.stringify(newSSP, null, 2));

    // Update index
    const indexPath = path.join(STORAGE_DIR, 'index.json');
    let index = { documents: [] as any[] };

    if (existsSync(indexPath)) {
      const indexData = await readFile(indexPath, 'utf-8');
      index = JSON.parse(indexData);
    }

    index.documents.push({
      id,
      title,
      lastModified: now,
      version: '1.0.0',
      controlCount: 0,
    });

    await writeFile(indexPath, JSON.stringify(index, null, 2));

    return NextResponse.json({
      id,
      document: newSSP,
      message: 'SSP document created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating SSP:', error);
    return NextResponse.json(
      { error: 'Failed to create SSP document' },
      { status: 500 }
    );
  }
}
