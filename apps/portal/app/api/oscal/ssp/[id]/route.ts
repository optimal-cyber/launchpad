export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), '.oscal-storage');
const HISTORY_DIR = path.join(STORAGE_DIR, 'history');

async function ensureStorageDir() {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true });
  }
  if (!existsSync(HISTORY_DIR)) {
    await mkdir(HISTORY_DIR, { recursive: true });
  }
}

// GET /api/oscal/ssp/[id] - Get SSP document by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureStorageDir();

    // Handle special 'default' id - load from public file
    if (id === 'default') {
      const publicPath = path.join(process.cwd(), 'public', 'eMASS_OSCAL_SSP.json');
      if (existsSync(publicPath)) {
        const data = await readFile(publicPath, 'utf-8');
        return NextResponse.json({ document: JSON.parse(data) });
      }
      return NextResponse.json(
        { error: 'Default SSP document not found' },
        { status: 404 }
      );
    }

    const docPath = path.join(STORAGE_DIR, `${id}.json`);

    if (!existsSync(docPath)) {
      return NextResponse.json(
        { error: 'SSP document not found' },
        { status: 404 }
      );
    }

    const data = await readFile(docPath, 'utf-8');
    return NextResponse.json({ document: JSON.parse(data) });

  } catch (error) {
    console.error('Error reading SSP:', error);
    return NextResponse.json(
      { error: 'Failed to read SSP document' },
      { status: 500 }
    );
  }
}

// PUT /api/oscal/ssp/[id] - Update SSP document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureStorageDir();

    const body = await request.json();
    const { document } = body;

    if (!document) {
      return NextResponse.json(
        { error: 'Document is required' },
        { status: 400 }
      );
    }

    const docPath = path.join(STORAGE_DIR, `${id}.json`);

    // Save current version to history before updating
    if (existsSync(docPath)) {
      const currentData = await readFile(docPath, 'utf-8');
      const historyPath = path.join(HISTORY_DIR, `${id}-${Date.now()}.json`);
      await writeFile(historyPath, currentData);
    }

    // Update document with new last-modified
    const updatedDoc = JSON.parse(JSON.stringify(document));
    if (updatedDoc['system-security-plan']?.metadata) {
      updatedDoc['system-security-plan'].metadata['last-modified'] = new Date().toISOString();
    }

    // Save updated document
    await writeFile(docPath, JSON.stringify(updatedDoc, null, 2));

    // Update index
    const indexPath = path.join(STORAGE_DIR, 'index.json');
    if (existsSync(indexPath)) {
      const indexData = await readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData);

      const docIndex = index.documents.findIndex((d: any) => d.id === id);
      if (docIndex !== -1) {
        const ssp = updatedDoc['system-security-plan'];
        index.documents[docIndex] = {
          ...index.documents[docIndex],
          title: ssp?.metadata?.title || index.documents[docIndex].title,
          lastModified: ssp?.metadata?.['last-modified'],
          version: ssp?.metadata?.version,
          controlCount: ssp?.['control-implementation']?.['implemented-requirements']?.length || 0,
        };
        await writeFile(indexPath, JSON.stringify(index, null, 2));
      }
    }

    return NextResponse.json({
      success: true,
      document: updatedDoc,
      message: 'SSP document updated successfully'
    });

  } catch (error) {
    console.error('Error updating SSP:', error);
    return NextResponse.json(
      { error: 'Failed to update SSP document' },
      { status: 500 }
    );
  }
}

// DELETE /api/oscal/ssp/[id] - Delete SSP document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureStorageDir();

    const docPath = path.join(STORAGE_DIR, `${id}.json`);

    if (!existsSync(docPath)) {
      return NextResponse.json(
        { error: 'SSP document not found' },
        { status: 404 }
      );
    }

    // Delete document file
    await unlink(docPath);

    // Update index
    const indexPath = path.join(STORAGE_DIR, 'index.json');
    if (existsSync(indexPath)) {
      const indexData = await readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData);
      index.documents = index.documents.filter((d: any) => d.id !== id);
      await writeFile(indexPath, JSON.stringify(index, null, 2));
    }

    return NextResponse.json({
      success: true,
      message: 'SSP document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting SSP:', error);
    return NextResponse.json(
      { error: 'Failed to delete SSP document' },
      { status: 500 }
    );
  }
}
