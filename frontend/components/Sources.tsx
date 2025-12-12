/**
 * Component to display RAG sources as a grid of cards
 */

"use client";

import { FileText, Link as LinkIcon, ExternalLink, ChevronDown } from "lucide-react";
import { useState } from "react";

interface Source {
    title: string;
    url?: string;
}

interface SourcesProps {
    sources: Source[];
}

export default function Sources({ sources }: SourcesProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!sources || sources.length === 0) return null;

    return (
        <div className="w-full max-w-4xl mt-2 mb-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--text-primary)]/80 transition-colors mb-2 select-none"
            >
                <span>Used {sources.length} source{sources.length !== 1 ? 's' : ''}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </button>

            {isExpanded && (
                <div className="grid grid-cols-1 gap-1 animate-in slide-in-from-top-2 duration-200 fade-in-0">
                    {sources.map((source, idx) => (
                        <a
                            key={idx}
                            href={source.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-all duration-200 group no-underline text-left select-none"
                        >
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded bg-[var(--surface-elevated)] border border-[var(--border)] group-hover:border-[var(--green)]/30">
                                {source.url ? (
                                    <LinkIcon className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-[var(--green)] transition-colors" />
                                ) : (
                                    <FileText className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-[var(--green)] transition-colors" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-[var(--text-primary)] truncate group-hover:text-[var(--green)] transition-colors">
                                    {source.title}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
