import { useMemo, useState } from "react";
import { AssetItem, AssetKind } from "./types";

const FILTERS: Array<{ label: string; value: AssetKind | "all" }> = [
  { label: "All", value: "all" },
  { label: "Icons", value: "icons" },
  { label: "Shapes", value: "shapes" },
  { label: "Images", value: "images" },
  { label: "Text templates", value: "text-templates" },
];

type AssetPanelProps = {
  assets: AssetItem[];
  onPickAsset?: (asset: AssetItem) => void;
};

export function AssetPanel({ assets, onPickAsset }: AssetPanelProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]["value"]>("all");

  const visibleAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return assets.filter((asset) => {
      const filterMatch = activeFilter === "all" || asset.kind === activeFilter;
      if (!filterMatch) return false;
      if (!normalizedQuery) return true;

      return (
        asset.label.toLowerCase().includes(normalizedQuery) ||
        asset.keywords.some((keyword) => keyword.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [activeFilter, assets, query]);

  return (
    <aside className="editor-left-panel">
      <h2>Assets</h2>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search assets"
        aria-label="Search assets"
      />
      <div className="asset-filters">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={activeFilter === filter.value ? "active" : ""}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <ul className="asset-grid" aria-label="Asset list">
        {visibleAssets.map((asset) => (
          <li key={asset.id}>
            <button type="button" onClick={() => onPickAsset?.(asset)}>
              {asset.thumbnail ? <img src={asset.thumbnail} alt={asset.label} loading="lazy" /> : null}
              <span>{asset.label}</span>
              <small>{asset.kind}</small>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
