"use client";

import { usePathname } from "next/navigation";
import { GlobalAudioPlayer } from "@/components/player/GlobalAudioPlayer";
import { FullScreenPlayer } from "@/components/player/FullScreenPlayer";
import { HiddenYouTubePlayer } from "@/components/player/HiddenYouTubePlayer";
import { QueuePanel } from "@/components/player/QueuePanel";
import { Sidebar } from "@/components/layout/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/layout/PageTransition";
import { MagneticCursor } from "@/components/ui/MagneticCursor";
import { MobileNav } from "@/components/layout/MobileNav";

const AUTH_ROUTES = ["/login", "/register"];

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuth = AUTH_ROUTES.some((r) => pathname.startsWith(r));

    if (isAuth) {
        // Auth pages: isolated scrollable container — no sidebar, no player
        return (
            <div className="h-screen overflow-y-auto">
                {children}
            </div>
        );
    }

    return (
        <>
            <HiddenYouTubePlayer />

            <div className="flex h-screen w-full relative z-10 overflow-hidden">
                <Sidebar />
                <main className="
                    flex-1 overflow-y-auto scroll-smooth relative z-10
                    h-screen
                    md:h-[calc(100vh-3rem)] md:my-6 md:mr-6 md:rounded-[40px]
                    pb-[calc(140px+env(safe-area-inset-bottom))]
                    md:pb-44
                ">
                    <div className="max-w-7xl mx-auto w-full h-full relative">
                        <ErrorBoundary>
                            <PageTransition>
                                {children}
                            </PageTransition>
                        </ErrorBoundary>
                    </div>
                </main>
            </div>

            <GlobalAudioPlayer />
            <FullScreenPlayer />
            <QueuePanel />
            <MobileNav />

            <div className="hidden md:block">
                <MagneticCursor />
            </div>
        </>
    );
}
