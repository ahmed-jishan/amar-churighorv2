import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/adminConfig';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ pageViews: [] });

    const db = getAdminDb();
    const snapshot = await db.collection('page_views')
      .where('sessionId', '==', sessionId)
      .orderBy('timestamp', 'asc')
      .limit(500)
      .get();

    const pageViews = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ pageViews });
  } catch (err) {
    console.error('[/api/admin/analytics/pageviews] error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
