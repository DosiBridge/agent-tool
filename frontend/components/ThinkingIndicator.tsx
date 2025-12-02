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
  const streamingStartTime = useStore((state) => state.streamingStartTime);

  const [displayText, setDisplayText] = useState("");
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);

  // Update elapsed time
  useEffect(() => {
    if (!isStreaming || !streamingStartTime) {
      setElapsedTime(null);
      return;
    }

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - streamingStartTime) / 1000);
      setElapsedTime(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming, streamingStartTime]);

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
        return <Sparkles className="w-4 h-4 text-[var(--green)] animate-pulse" />;
      case "tool_calling":
        return <Wrench className="w-4 h-4 text-[var(--green)] animate-pulse" />;
      case "answering":
        return <MessageSquare className="w-4 h-4 text-[var(--green)]" />;
      default:
        return <Loader2 className="w-4 h-4 text-[var(--green)] animate-spin" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-1 sm:px-2 mb-3 sm:mb-4">
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--surface-elevated)]/80 backdrop-blur-md rounded-xl border border-[var(--border)] shadow-sm animate-fade-in">
        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--green)]/10">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-[var(--text-primary)] truncate">
              {displayText}
            </div>
            {elapsedTime !== null && elapsedTime > 0 && (
              <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                ({elapsedTime}s)
              </span>
            )}
          </div>
          {streamingStatus === "tool_calling" && activeTools.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {activeTools.map((tool, index) => (
                <span
                  key={`${tool}-${index}`}
                  className="text-xs px-2 py-1 bg-[var(--green)]/10 text-[var(--green)] rounded-full border border-[var(--green)]/20 font-medium"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Progress indicator */}
        <div className="shrink-0 w-16 h-1 bg-[var(--border)]/50 rounded-full overflow-hidden">
          <div
            className={`h-full bg-[var(--green)] transition-all duration-300 ${
              streamingStatus === "answering" ? "w-full" : "w-1/3"
            } ${
              streamingStatus === "thinking" || streamingStatus === "tool_calling"
                ? "animate-pulse"
                : ""
            }`}
          />
        </div>
      </div>
    </div>
  );
}
