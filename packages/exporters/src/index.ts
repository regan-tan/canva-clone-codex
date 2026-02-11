export type ExportFormat = 'pdf' | 'pptx' | 'png' | 'jpg';

export function serializeExport(format: ExportFormat, documentId: string) {
  return {
    format,
    documentId,
    queuedAt: new Date().toISOString()
  };
}
