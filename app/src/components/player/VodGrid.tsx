"use client";

import type { XtreamVod, XtreamCategory } from "@/lib/types";

interface VodGridProps {
  categories: XtreamCategory[];
  streams: XtreamVod[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  onSelect: (vod: XtreamVod) => void;
  favorites: Set<string>;
  onToggleFavorite: (vod: XtreamVod) => void;
}

export function VodGrid({
  categories,
  streams,
  selectedCategory,
  onCategoryChange,
  onSelect,
  favorites,
  onToggleFavorite,
}: VodGridProps) {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-36 flex-shrink-0 border-r border-border overflow-y-auto">
        <div
          onClick={() => onCategoryChange("")}
          className={`px-3 py-2 text-xs cursor-pointer transition-colors ${!selectedCategory ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
        >
          All
        </div>
        {categories.map((cat) => (
          <div
            key={cat.category_id}
            onClick={() => onCategoryChange(cat.category_id)}
            className={`px-3 py-2 text-xs cursor-pointer transition-colors truncate ${selectedCategory === cat.category_id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
          >
            {cat.category_name}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-4 gap-3">
          {streams.map((vod) => (
            <div
              key={vod.stream_id}
              onClick={() => onSelect(vod)}
              className="cursor-pointer group"
            >
              <div className="relative aspect-[2/3] bg-muted rounded overflow-hidden mb-1">
                {vod.stream_icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vod.stream_icon} alt={vod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(vod); }}
                  className="absolute top-1 right-1 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {favorites.has(String(vod.stream_id)) ? "★" : "☆"}
                </button>
              </div>
              <p className="text-xs text-foreground truncate">{vod.name}</p>
              {vod.rating && <p className="text-xs text-muted-foreground">★ {vod.rating}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
