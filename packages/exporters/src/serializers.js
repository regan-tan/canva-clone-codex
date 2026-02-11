import { assertDocument } from './types.js';

function normalizeElement(element) {
  return {
    id: element.id,
    type: element.type,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation ?? 0,
    opacity: element.opacity ?? 1,
    text: element.text,
    style: element.style,
    src: element.src,
    vectorPath: element.vectorPath,
  };
}

function normalizePage(page) {
  return {
    id: page.id,
    width: page.width,
    height: page.height,
    elements: page.elements.map(normalizeElement),
  };
}

export function serializeToPdf(document) {
  assertDocument(document);
  return {
    format: 'pdf',
    specVersion: 1,
    documentId: document.id,
    title: document.title,
    renderMode: 'layout-preserving',
    pages: document.pages.map((page, index) => ({
      pageNumber: index + 1,
      ...normalizePage(page),
      commands: page.elements.map((element) => ({
        op: 'place',
        payload: normalizeElement(element),
      })),
    })),
  };
}

export function serializeToPptx(document) {
  assertDocument(document);
  return {
    format: 'pptx',
    specVersion: 1,
    documentId: document.id,
    slideCount: document.pages.length,
    slides: document.pages.map((page, index) => ({
      slideIndex: index,
      pageId: page.id,
      size: { width: page.width, height: page.height },
      objects: page.elements.map((element) => ({
        placement: {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          rotation: element.rotation ?? 0,
        },
        content: normalizeElement(element),
      })),
    })),
  };
}

export function serializeToRaster(document, format, dpi = 300) {
  assertDocument(document);
  return {
    format,
    specVersion: 1,
    documentId: document.id,
    rasterization: {
      dpi,
      mode: 'high-resolution-per-page',
    },
    pages: document.pages.map((page, index) => ({
      pageNumber: index + 1,
      sourcePageId: page.id,
      width: page.width,
      height: page.height,
      elements: page.elements.map(normalizeElement),
    })),
  };
}

export function serializeDocument(document, format) {
  switch (format) {
    case 'pdf':
      return serializeToPdf(document);
    case 'pptx':
      return serializeToPptx(document);
    case 'png':
    case 'jpg':
      return serializeToRaster(document, format);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
