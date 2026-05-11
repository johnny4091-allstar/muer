"use client";

import type { XtreamChannel, XtreamCategory } from "@/lib/types";

interface ChannelListProps {
  categories: XtreamCategory[];
  channels: XtreamChannel[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  onChannelSelect: (channel: XtreamChannel) => void;
  activeChannelId?: number;
  favorites: Set<string>;
  onToggleFavorite: (channel: XtreamChannel) => void;
}

export function ChannelList({
  categories,
  channels,
  selectedCategory,
  onCategoryChange,
  onChannelSelect,
  activeChannelId,
  favorites,
  onToggleFavorite,
}: ChannelListProps) {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Category sidebar */}
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

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto">
        {channels.map((ch) => (
          <div
            key={ch.stream_id}
            onClick={() => onChannelSelect(ch)}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors group ${
              activeChannelId === ch.stream_id ? "bg-primary/20 border-l-2 border-primary" : "hover:bg-accent"
            }`}
          >
            {ch.stream_icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ch.stream_icon} alt="" className="w-7 h-7 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="w-7 h-7 bg-muted rounded flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground truncate">{ch.name}</p>
              <p className="text-xs text-muted-foreground">{ch.num}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(ch); }}
              className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${favorites.has(String(ch.stream_id)) ? "text-yellow-400 opacity-100" : "text-muted-foreground"}`}
            >
              {favorites.has(String(ch.stream_id)) ? "★" : "☆"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
