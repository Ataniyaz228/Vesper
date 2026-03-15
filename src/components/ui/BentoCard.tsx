import React from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    artist: string;
    imageUrl: string;
    onClick?: () => void;
}

export const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
    ({ className, title, artist, imageUrl, onClick, ...props }, ref) => {
        return (
            <div
                ref={ref}
                onClick={onClick}
                className={cn(
                    "group relative flex flex-col overflow-hidden rounded-[24px] cursor-pointer transition-all duration-300",
                    "bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 active:scale-95",
                    className
                )}
                {...props}
            >
                <div className="aspect-square relative w-full overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />
                    {/* Subtle bottom shadow overlay to ensure text readability if overlaid */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl">
                            <Play className="w-6 h-6 text-white ml-1 fill-white" />
                        </div>
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-1">
                    <h4 className="text-base font-bold text-white tracking-tight truncate">
                        {title}
                    </h4>
                    <p className="text-sm text-white/50 truncate font-medium">
                        {artist}
                    </p>
                </div>
            </div>
        );
    }
);
BentoCard.displayName = "BentoCard";
