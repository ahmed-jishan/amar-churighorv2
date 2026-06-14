import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/adminConfig';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const db = getAdminDb();
    const snapshot = await db.collection('visitor_sessions')
      .orderBy('sessionStart', 'desc')
      .limit(Math.min(limit, 1000))
      .get();

    const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('[/api/admin/analytics/sessions] error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
