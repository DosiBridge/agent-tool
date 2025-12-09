"use client";
import React from "react";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { IconHome, IconInfoCircle, IconMail, IconFileText } from "@tabler/icons-react";
import { Book, Code, FileText, Layers, Terminal, Zap } from "lucide-react";

export default function DocsPage() {
    const navItems = [
        {
            name: "Home",
            link: "/",
            icon: <IconHome className="h-4 w-4 text-neutral-500 dark:text-white" />,
        },
        {
            name: "About",
            link: "/#about",
            icon: <IconInfoCircle className="h-4 w-4 text-neutral-500 dark:text-white" />,
        },
        {
            name: "Features",
            link: "/#features",
            icon: <IconFileText className="h-4 w-4 text-neutral-500 dark:text-white" />,
        },
        {
            name: "Docs",
            link: "/docs",
            icon: <IconFileText className="h-4 w-4 text-neutral-500 dark:text-white" />,
        },
        {
            name: "Contact",
            link: "/#contact",
            icon: <IconMail className="h-4 w-4 text-neutral-500 dark:text-white" />,
        },
    ];

    return (
        <div className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative">
            <FloatingNav navItems={navItems} />

            <div className="pt-24 sm:pt-28 md:pt-32 px-4 sm:px-6 max-w-5xl mx-auto text-white pb-12 sm:pb-16 md:pb-20">
                <div className="mb-8 sm:mb-12 md:mb-16 text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 px-4">
                        Documentation
                    </h1>
                    <p className="text-neutral-300 max-w-2xl mx-auto text-sm sm:text-base md:text-lg px-4">
                        Learn how to integrate, configure, and maximize the potential of your AI Agent.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                    {[
                        {
                            title: "Getting Started",
                            icon: <Zap className="w-6 h-6 text-yellow-400" />,
                            content: "Quick start guide to setting up your environment and running your first agent workflow."
                        },
                        {
                            title: "Architecture",
                            icon: <Layers className="w-6 h-6 text-blue-400" />,
                            content: "Deep dive into the RAG pipeline, WebSocket communication, and agent orchestration."
                        },
                        {
                            title: "API Reference",
                            icon: <Code className="w-6 h-6 text-green-400" />,
                            content: "Complete endpoint documentation for REST APIs and WebSocket events."
                        },
                        {
                            title: "MCP Tools",
                            icon: <Terminal className="w-6 h-6 text-purple-400" />,
                            content: "How to connect external tools using the Model Context Protocol standard."
                        },
                        {
                            title: "Knowledge Base",
                            icon: <Book className="w-6 h-6 text-red-400" />,
                            content: "Best practices for preparing and uploading documents for RAG analysis."
                        },
                        {
                            title: "Workflows",
                            icon: <FileText className="w-6 h-6 text-cyan-400" />,
                            content: "Creating and managing complex multi-step agent workflows."
                        }
                    ].map((item, i) => (
                        <div key={i} className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                                <div className="p-1.5 sm:p-2 rounded-lg bg-black/50 border border-white/10 group-hover:border-white/20 transition-colors flex-shrink-0">
                                    {item.icon}
                                </div>
                                <h2 className="text-lg sm:text-xl font-semibold">{item.title}</h2>
                            </div>
                            <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                                {item.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
