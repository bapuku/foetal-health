import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeChunksForQuery } from '@/lib/knowledge-retrieval';

const DEFAULT_TOP_K = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { query = '', topK = DEFAULT_TOP_K } = body as { query?: string; topK?: number };
    const q = typeof query === 'string' ? query.trim() : '';
    const k = Math.min(Math.max(1, Number(topK) || DEFAULT_TOP_K), 20);

    const chunks = getKnowledgeChunksForQuery(q || '', k);
    return NextResponse.json({ chunks });
  } catch (err) {
    console.error('Knowledge search error:', err);
    return NextResponse.json({ chunks: [] }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';
  const topK = Number(request.nextUrl.searchParams.get('topK') ?? DEFAULT_TOP_K);
  try {
    const chunks = getKnowledgeChunksForQuery(query, topK);
    return NextResponse.json({ chunks });
  } catch (err) {
    console.error('Knowledge search error:', err);
    return NextResponse.json({ chunks: [] }, { status: 500 });
  }
}
