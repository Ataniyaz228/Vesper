import { useState, useEffect } from "react";
import { FastAverageColor } from "fast-average-color";

export const useAmbientColor = (imageUrl?: string) => {
    const [colors, setColors] = useState<{ primary: string; secondary: string }>({
        // Default fallback colors matching globals.css
        primary: "oklch(0.2 0.05 250)",
        secondary: "oklch(0.1 0.05 280)",
    });

    useEffect(() => {
        if (!imageUrl) return;

        let ignore = false;
        const fac = new FastAverageColor();
        const img = new Image();

        // CRITICAL: Prevent tainted canvas CORS errors from Spotify's external CDN
        img.crossOrigin = "anonymous";
        img.src = imageUrl;

        img.onload = async () => {
            try {
                // Extract dominant color for primary theme presence
                // Extract simple average color for a supportive, slightly shifted hue
                const [dominant, average] = await Promise.all([
                    fac.getColorAsync(img, { algorithm: "dominant" }),
                    fac.getColorAsync(img, { algorithm: "simple" }),
                ]);

                if (!ignore) {
                    setColors({
                        primary: dominant.hex,
                        secondary: average.hex,
                    });
                }
            } catch (error) {
                console.error("Failed to extract colors:", error);
            }
        };

        return () => {
            ignore = true;
            fac.destroy();
        };
    }, [imageUrl]);

    return colors;
};
