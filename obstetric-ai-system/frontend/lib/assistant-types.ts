/**
 * Types partagés pour l'Assistant IA (réponses structurees, chat).
 */

import type { HarvardCitation } from './citations';
import type { TriangulationRow } from './report-generator';

export interface StructuredAIResponse {
  summary: string;
  narrative: string;
  metrics?: { name: string; value: string; threshold?: string; status?: string }[];
  recommendations?: { action: string; level: string }[];
  references: HarvardCitation[];
  patientContext?: { field: string; value: string }[];
  triangulation?: TriangulationRow[];
}
