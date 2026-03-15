import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium text-sm transition-all duration-200",
                    "glass-panel hover:bg-white/10 active:scale-95",
                    "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
                    className
                )}
                {...props}
            >
                {children}
            </button>
        );
    }
);
GlassButton.displayName = "GlassButton";
