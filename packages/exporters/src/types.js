/**
 * @typedef {{id:string,width:number,height:number,elements:Array<any>}} Page
 * @typedef {{id:string,title:string,pages:Page[]}} DocumentModel
 */

export const SUPPORTED_FORMATS = ['pdf', 'pptx', 'png', 'jpg'];

export function assertDocument(document) {
  if (!document || !Array.isArray(document.pages)) {
    throw new Error('Invalid document model: pages are required');
  }
}
