import { NextResponse } from 'next/server';
import { initializeDb } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    await initializeDb();

    // Auto-sync API keys from environment variables (Render env group)
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}/api/env-sync`, { method: 'POST' });
    } catch {
      // Non-critical: env sync failure doesn't block initialization
    }

    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
} 