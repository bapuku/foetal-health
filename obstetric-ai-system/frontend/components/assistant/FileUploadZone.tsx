'use client';

import { useState, useCallback } from 'react';

export interface UploadedFileInfo {
  file: File;
  id: string;
}

interface FileUploadZoneProps {
  files: UploadedFileInfo[];
  onFilesChange: (files: UploadedFileInfo[]) => void;
  disabled?: boolean;
}

function getFileIcon(type: string, name: string): 'document' | 'image' | 'data' {
  const t = type.toLowerCase();
  const n = name.toLowerCase();
  if (t.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|dicom)$/.test(n)) return 'image';
  if (/\.(csv|json|xlsx?|ris|enw)$/.test(n) || t.includes('sheet') || t.includes('csv')) return 'data';
  return 'document';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function FileUploadZone({ files, onFilesChange, disabled }: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const list = Array.from(newFiles);
      const added: UploadedFileInfo[] = list.map((file) => ({
        file,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }));
      onFilesChange([...files, ...added]);
    },
    [files, onFilesChange]
  );

  const removeFile = useCallback(
    (id: string) => {
      onFilesChange(files.filter((f) => f.id !== id));
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [disabled, addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      if (input.files?.length) addFiles(input.files);
      input.value = '';
    },
    [addFiles]
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500">Fichiers pour RAG (tous types)</p>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
        } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          type="file"
          multiple
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
          id="assistant-file-upload"
          accept="*/*"
        />
        <label htmlFor="assistant-file-upload" className="cursor-pointer">
          <svg
            className="mx-auto h-10 w-10 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="mt-1 text-xs text-slate-600">Glissez des fichiers ou cliquez pour parcourir</p>
          <p className="text-xs text-slate-400">PDF, images, CSV, DICOM, .ris, .txt, etc.</p>
        </label>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map(({ file, id }) => {
            const iconType = getFileIcon(file.type, file.name);
            return (
              <li
                key={id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {iconType === 'image' && (
                  <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                )}
                {iconType === 'data' && (
                  <svg className="h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                )}
                {iconType === 'document' && (
                  <svg className="h-5 w-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-slate-800" title={file.name}>{file.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(file.size)} · {file.type || 'Fichier'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(id)}
                  disabled={disabled}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                  aria-label="Supprimer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
