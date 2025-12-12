"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    provider: string;
    loading?: boolean;
}

export default function SocialButton({
    icon,
    provider,
    loading,
    className,
    ...props
}: SocialButtonProps) {
    return (
        <button
            type="button"
            disabled={loading}
            className={cn(
                "relative w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-zinc-200 transition-all active:scale-[0.98]",
                loading && "opacity-70 cursor-not-allowed",
                className
            )}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
                    <span>Continue with {provider}</span>
                </>
            )}
        </button>
    );
}
