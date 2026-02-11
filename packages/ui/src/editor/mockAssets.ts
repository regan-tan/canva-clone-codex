import { AssetItem } from "./types";

const BASE_ASSETS: AssetItem[] = [
  { id: "icon-star", kind: "icons", label: "Star", keywords: ["favorite", "rating"] },
  { id: "icon-heart", kind: "icons", label: "Heart", keywords: ["love", "social"] },
  { id: "shape-circle", kind: "shapes", label: "Circle", keywords: ["geometry", "round"] },
  { id: "shape-triangle", kind: "shapes", label: "Triangle", keywords: ["geometry", "polygon"] },
  { id: "template-title", kind: "text-templates", label: "Title + Subtitle", keywords: ["headline", "intro"] },
  { id: "template-quote", kind: "text-templates", label: "Quote Card", keywords: ["testimonial", "statement"] },
];

function createStockImage(index: number): AssetItem {
  const width = 320;
  const height = 240;
  const query = ["workspace", "branding", "design", "abstract"][index % 4];

  return {
    id: `stock-${index}`,
    kind: "images",
    label: `Stock ${index + 1}`,
    keywords: ["stock", "placeholder", query],
    thumbnail: `https://picsum.photos/seed/${query}-${index}/${width}/${height}`,
  };
}

export function getAssetCatalog(stockCount = 12): AssetItem[] {
  const stock = Array.from({ length: stockCount }, (_, index) => createStockImage(index));
  return [...BASE_ASSETS, ...stock];
}
