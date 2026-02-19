import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    if (!files.length) {
      return NextResponse.json({ error: 'No files' }, { status: 400 });
    }

    const results: { name: string; extractedText: string; type: string; size: number }[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const name = file.name;
      const type = file.type || '';
      const size = file.size;
      let extractedText = '';

      const ext = name.split('.').pop()?.toLowerCase();
      const isText = type.startsWith('text/') || ['txt', 'csv', 'json', 'ris', 'enw', 'xml'].includes(ext || '');
      const isPdf = type === 'application/pdf' || ext === 'pdf';

      if (isText) {
        extractedText = buffer.toString('utf-8').slice(0, 100_000);
      } else if (isPdf) {
        extractedText = `[PDF: ${name} - contenu non extrait côté serveur dans cette version. Le fichier peut être utilisé comme référence par l’utilisateur.]`;
      } else {
        extractedText = `[Fichier binaire: ${name}, ${type}, ${size} octets]`;
      }

      results.push({ name, extractedText, type, size });
    }

    return NextResponse.json({ files: results });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
