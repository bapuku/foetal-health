import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prometheusUrl = process.env.PROMETHEUS_URL || process.env.NEXT_PUBLIC_PROMETHEUS_URL;
    let services: { name: string; status: string; latencyMs?: number; requestsPerMin?: number }[] = [
      { name: 'CTG Monitor', status: 'up', latencyMs: 12, requestsPerMin: 42 },
      { name: 'Apgar', status: 'up', latencyMs: 8, requestsPerMin: 18 },
      { name: 'FHIR Client', status: 'up', latencyMs: 45, requestsPerMin: 120 },
      { name: 'Frontend', status: 'up', latencyMs: 5, requestsPerMin: 200 },
    ];

    if (prometheusUrl) {
      try {
        const res = await fetch(`${prometheusUrl}/api/v1/query?query=up`, { next: { revalidate: 0 } });
        if (res.ok) {
          const data = await res.json();
          if (data?.data?.result) {
            services = data.data.result.slice(0, 10).map((r: { metric: { job?: string }; value: [number, string] }) => ({
              name: r.metric?.job || 'service',
              status: r.value?.[1] === '1' ? 'up' : 'down',
            }));
          }
        }
      } catch {
        // keep default mock
      }
    }

    return NextResponse.json({
      services,
      grafanaUrl: process.env.NEXT_PUBLIC_GRAFANA_URL || null,
      prometheusUrl: process.env.NEXT_PUBLIC_PROMETHEUS_URL || null,
      logsUrl: process.env.NEXT_PUBLIC_LOGS_URL || null,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Observability unavailable' }, { status: 500 });
  }
}
