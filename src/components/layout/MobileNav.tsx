"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV = [
    { name: "Home",     href: "/",        icon: Home },
    { name: "Discover", href: "/discover", icon: Compass },
    { name: "Library",  href: "/library",  icon: Library },
    { name: "Vesper",   href: "/vesper",   icon: Sparkles },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            {/* Frosted glass bar */}
            <div className="bg-[#0a0a0c]/90 backdrop-blur-2xl border-t border-white/[0.06]">
                <div className="flex items-center h-16 px-2">
                    {NAV.map(({ name, href, icon: Icon }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className="relative flex flex-col items-center gap-1 flex-1 py-2"
                            >
                                <div className="relative flex items-center justify-center">
                                    {active && (
                                        <motion.div
                                            layoutId="mobile-nav-pill"
                                            className="absolute inset-0 -m-2 w-10 h-10 rounded-xl bg-white/[0.08]"
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                    <Icon
                                        className={cn(
                                            "w-5 h-5 relative z-10 transition-colors duration-200",
                                            active ? "text-white" : "text-white/30"
                                        )}
                                    />
                                </div>
                                <span
                                    className={cn(
                                        "text-[10px] font-semibold tracking-wide transition-colors duration-200",
                                        active ? "text-white" : "text-white/25"
                                    )}
                                >
                                    {name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
