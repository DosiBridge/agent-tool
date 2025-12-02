/**
 * Thinking indicator component - shows status and active tools
 * Similar to ChatGPT's thinking/answering indicator
 */

"use client";

import { useStore } from "@/lib/store";
import { Loader2, Sparkles, Wrench, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThinkingIndicator() {
  const streamingStatus = useStore((state) => state.streamingStatus);
  const activeTools = useStore((state) => state.activeTools);
  const isStreaming = useStore((state) => state.isStreaming);

  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    if (!isStreaming || !streamingStatus) {
      setDisplayText("");
      return;
    }

    switch (streamingStatus) {
      case "thinking":
        setDisplayText("Thinking...");
        break;
      case "tool_calling":
        if (activeTools.length > 0) {
          setDisplayText(`Using ${activeTools[activeTools.length - 1]}...`);
        } else {
          setDisplayText("Using tools...");
        }
        break;
      case "answering":
        setDisplayText("Answering...");
        break;
      default:
        setDisplayText("");
    }
  }, [streamingStatus, activeTools, isStreaming]);

  if (!isStreaming || !streamingStatus) {
    return null;
  }

  const getIcon = () => {
    switch (streamingStatus) {
      case "thinking":
        return <Sparkles className="w-4 h-4 text-[var(--green)]" />;
      case "tool_calling":
        return <Wrench className="w-4 h-4 text-[var(--green)]" />;
      case "answering":
        return <MessageSquare className="w-4 h-4 text-[var(--green)]" />;
      default:
        return <Loader2 className="w-4 h-4 text-[var(--green)] animate-spin" />;
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-elevated)]/50 backdrop-blur-sm rounded-lg border border-[var(--border)] mb-2 animate-fade-in">
      <div className="shrink-0">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
          {displayText}
        </div>
        {streamingStatus === "tool_calling" && activeTools.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {activeTools.map((tool, index) => (
              <span
                key={`${tool}-${index}`}
                className="text-xs px-2 py-0.5 bg-[var(--green)]/10 text-[var(--green)] rounded-full border border-[var(--green)]/20"
              >
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
