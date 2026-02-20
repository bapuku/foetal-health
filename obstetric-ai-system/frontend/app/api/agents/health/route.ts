import { NextResponse } from 'next/server';

/**
 * Server-side health check proxy for all agents.
 * In Docker, the frontend container can reach agents by service name (e.g. ctg-monitor:8000).
 * In local dev, agents run on localhost:PORT.
 * The browser calls GET /api/agents/health and gets back statuses for all agents.
 */

const AGENTS = [
  { name: 'CTG Monitor', service: 'ctg-monitor', port: 8000, healthPath: '/health' },
  { name: 'Apgar Transition', service: 'apgar-transition', port: 8001, healthPath: '/health' },
  { name: 'Symbolic Reasoning', service: 'symbolic-reasoning', port: 8002, healthPath: '/health' },
  { name: 'Polygraph Verifier', service: 'polygraph-verifier', port: 8003, healthPath: '/health' },
  { name: 'Bishop Partogram', service: 'bishop-partogram', port: 8004, healthPath: '/health' },
  { name: 'RCIU Risk', service: 'rciu-risk', port: 8005, healthPath: '/health' },
  { name: 'Quantum Optimizer', service: 'quantum-optimizer', port: 8006, healthPath: '/health' },
  { name: 'Mother-Baby Risk', service: 'mother-baby-risk', port: 8007, healthPath: '/health' },
  { name: 'Clinical Narrative', service: 'clinical-narrative', port: 8008, healthPath: '/health' },
  { name: 'User Engagement', service: 'user-engagement', port: 8009, healthPath: '/health' },
  { name: 'Prenatal Follow-up', service: 'prenatal-followup', port: 8010, healthPath: '/health' },
];

function agentBaseUrl(service: string, port: number): string {
  if (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV) {
    return `http://${service}:${port}`;
  }
  return `http://localhost:${port}`;
}

export async function GET() {
  const results = await Promise.all(
    AGENTS.map(async (agent) => {
      const url = `${agentBaseUrl(agent.service, agent.port)}${agent.healthPath}`;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3000), cache: 'no-store' });
        return { name: agent.name, port: agent.port, status: res.ok ? 'up' as const : 'down' as const };
      } catch {
        return { name: agent.name, port: agent.port, status: 'down' as const };
      }
    }),
  );
  return NextResponse.json({ agents: results });
}
