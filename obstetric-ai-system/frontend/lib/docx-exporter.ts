/**
 * Export du rapport medical au format DOCX (Word).
 * Utilise la librairie docx pour generer un document structure.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
} from 'docx';
import type { ReportData } from './report-generator';
import { formatHarvard } from './citations';

const singleBorder = { style: BorderStyle.SINGLE, size: 1 };
const tableBorders = {
  top: singleBorder,
  bottom: singleBorder,
  left: singleBorder,
  right: singleBorder,
  insideHorizontal: singleBorder,
  insideVertical: singleBorder,
};

function heading(
  text: string,
  level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2
): Paragraph {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 },
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 120 },
  });
}

function tableRow(cells: string[], header = false): TableRow {
  return new TableRow({
    children: cells.map(
      (c) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: c, bold: header, size: header ? 22 : 20 })],
            }),
          ],
        })
    ),
  });
}

export async function exportReportToDocx(report: ReportData): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      text: 'Rapport clinique structure',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    })
  );
  children.push(bodyParagraph(`ID patient (anonymise) : ${report.patientIdAnonymized}`));
  children.push(bodyParagraph(`Date : ${report.date}`));
  children.push(bodyParagraph(`Auteurs IA : ${report.authorIa}`));
  children.push(bodyParagraph(`Validateur : ${report.authorValidator}`));
  children.push(new Paragraph({ text: '', spacing: { after: 120 } }));

  children.push(heading('1. Resume executif'));
  children.push(bodyParagraph(report.executiveSummary));

  if (report.narrativeSections?.situationClinique) {
    children.push(heading('2. Situation clinique'));
    children.push(bodyParagraph(report.narrativeSections.situationClinique));
  }

  const dataSectionNum = report.narrativeSections ? '3' : '2';
  children.push(heading(`${dataSectionNum}. Donnees cliniques`));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: [
        tableRow(['Parametre', 'Valeur'], true),
        ...report.clinicalData.map((r) => tableRow([r.label, `${r.value} ${(r.unit ?? '').trim()}`])),
      ],
    })
  );
  children.push(new Paragraph({ text: '', spacing: { after: 120 } }));

  const multiNum = report.narrativeSections ? '4' : '3';
  children.push(heading(`${multiNum}. Analyse multi-agent`));
  if (report.narrativeSections?.analyseMultiAgent) {
    children.push(bodyParagraph(report.narrativeSections.analyseMultiAgent));
  }
  report.multiAgentAnalysis.forEach((a) => {
    children.push(
      bodyParagraph(`${a.agent} : ${a.result}${a.reference ? ` (${a.reference})` : ''}`)
    );
  });

  const triNum = report.narrativeSections ? '5' : '4';
  children.push(heading(`${triNum}. Triangulation systematique`));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: [
        tableRow(['Parametre', 'Agent CTG', 'Agent Apgar', 'FHIR', 'Guidelines', 'Convergence'], true),
        ...report.triangulation.map((r) =>
          tableRow([r.parameter, r.agentCtg, r.agentApgar, r.fhir, r.guidelines, r.convergence])
        ),
      ],
    })
  );
  children.push(new Paragraph({ text: '', spacing: { after: 120 } }));

  const classNum = report.narrativeSections ? '6' : '5';
  children.push(heading(`${classNum}. Classification et risques`));
  if (report.narrativeSections?.classificationRisques) {
    children.push(bodyParagraph(report.narrativeSections.classificationRisques));
  }
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: [
        tableRow(['Nom', 'Valeur', 'IC 95%', 'Niveau'], true),
        ...report.classificationRisks.map((r) =>
          tableRow([r.name, r.value, r.ic95 ?? '-', r.level ?? '-'])
        ),
      ],
    })
  );
  children.push(new Paragraph({ text: '', spacing: { after: 120 } }));

  const explNum = report.narrativeSections ? '7' : '6';
  children.push(heading(`${explNum}. Explicabilite`));
  if (report.narrativeSections?.explicabilite) {
    children.push(bodyParagraph(report.narrativeSections.explicabilite));
  }
  report.explicability.forEach((e) => {
    children.push(bodyParagraph(`${e.method} : ${e.summary}`));
  });

  const recNum = report.narrativeSections ? '8' : '7';
  children.push(heading(`${recNum}. Recommandations`));
  if (report.narrativeSections?.recommandations) {
    children.push(bodyParagraph(report.narrativeSections.recommandations));
  }
  report.recommendations.forEach((r) => {
    children.push(bodyParagraph(`${r.action} (${r.level})`));
  });

  if (report.narrativeSections?.planNeonatal) {
    children.push(heading('9. Plan de soins neonataux'));
    children.push(bodyParagraph(report.narrativeSections.planNeonatal));
  }

  const refNum = report.narrativeSections ? '10' : '8';
  children.push(heading(`${refNum}. Sources et audit`));
  report.references.forEach((c) => {
    children.push(bodyParagraph(formatHarvard(c)));
  });

  children.push(new Paragraph({ text: '', spacing: { after: 240 } }));
  children.push(
    bodyParagraph('Annexes : trace CTG, ressources FHIR et audit log disponibles sur demande.')
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export function downloadDocx(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
