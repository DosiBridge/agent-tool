/**
 * Command palette component (Cmd/Ctrl + K)
 */
"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "./Modal";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
  category?: string;
}

export interface CommandPaletteProps {
  items: CommandItem[];
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({
  items,
  isOpen,
  onClose,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const searchableText = [
      item.label,
      item.description,
      ...(item.keywords || []),
    ]
      .join(" ")
      .toLowerCase();
    return searchableText.includes(query);
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (filteredItems.length > 0) {
      setSelectedIndex(0);
    }
  }, [searchQuery, filteredItems.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredItems.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSelect = (item: CommandItem) => {
    item.action();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeOnClickOutside={true}
      showCloseButton={false}
      alignment="top"
      className="bg-zinc-950/90 backdrop-blur-xl border-zinc-800 shadow-2xl overflow-hidden"
    >
      <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
        {/* Search Input */}
        <div className="relative border-b border-zinc-800/50">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full pl-12 pr-12 py-4 bg-transparent border-none text-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-0"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p className="text-sm">No commands found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category} className="mb-2">
                  <div className="px-3 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="space-y-0.5">
                    {categoryItems.map((item, index) => {
                      const globalIndex = filteredItems.indexOf(item);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-md text-left transition-all",
                            isSelected
                              ? "bg-indigo-600 text-white shadow-md"
                              : "text-zinc-300 hover:bg-zinc-800/50"
                          )}
                        >
                          {item.icon && (
                            <div className={cn(
                              "shrink-0 w-8 h-8 flex items-center justify-center rounded-md",
                              isSelected ? "bg-indigo-500/30 text-white" : "bg-zinc-800 text-zinc-400"
                            )}>
                              {item.icon}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={cn("font-medium text-sm", isSelected ? "text-white" : "text-zinc-200")}>
                              {item.label}
                            </div>
                            {item.description && (
                              <div
                                className={cn(
                                  "text-xs mt-0.5 truncate",
                                  isSelected
                                    ? "text-indigo-200"
                                    : "text-zinc-500"
                                )}
                              >
                                {item.description}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="shrink-0 text-xs text-indigo-200 opacity-80">
                              Enter
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-end gap-4 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="flex gap-0.5">
              <kbd className="min-w-[16px] h-4 flex items-center justify-center bg-zinc-800 rounded border border-zinc-700 font-sans">↑</kbd>
              <kbd className="min-w-[16px] h-4 flex items-center justify-center bg-zinc-800 rounded border border-zinc-700 font-sans">↓</kbd>
            </span>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="h-4 px-1.5 flex items-center justify-center bg-zinc-800 rounded border border-zinc-700 font-sans">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="h-4 px-1.5 flex items-center justify-center bg-zinc-800 rounded border border-zinc-700 font-sans">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
