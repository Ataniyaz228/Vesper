"use client";

import React, { useEffect, useRef } from 'react';

interface SonicWaveformProps {
    rgb?: { r: number; g: number; b: number };
    isPlaying?: boolean;
}

export const SonicWaveformCanvas = ({ rgb = { r: 0, g: 255, b: 192 }, isPlaying = true }: SonicWaveformProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
        let time = 0;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        const draw = () => {
            // Fade out previous frame to create motion blur trail effect
            ctx.fillStyle = 'rgba(4, 4, 5, 0.15)'; // Match Vesper dark background
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const lineCount = 45; // Reduced slightly for minimalism
            const segmentCount = 80;
            const height = canvas.height / 2;
            
            for (let i = 0; i < lineCount; i++) {
                ctx.beginPath();
                const progress = i / lineCount;
                const colorIntensity = Math.sin(progress * Math.PI);
                
                // Use the passed RGB color
                ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${colorIntensity * 0.4})`;
                ctx.lineWidth = 1.2;

                for (let j = 0; j < segmentCount + 1; j++) {
                    const x = (j / segmentCount) * canvas.width;
                    
                    // Mouse influence
                    const distToMouse = Math.hypot(x - mouse.x, height - mouse.y);
                    const mouseEffect = Math.max(0, 1 - distToMouse / 500);

                    // Wave calculation - dynamic speed based on playing state
                    const speed = isPlaying ? time : time * 0.1;
                    
                    const noise = Math.sin(j * 0.1 + speed + i * 0.2) * 20;
                    // Slightly more chaotic spike if playing, smooth if paused
                    const spikeAmt = isPlaying ? 50 : 15;
                    const spike = Math.cos(j * 0.2 + speed + i * 0.1) * Math.sin(j * 0.05 + speed) * spikeAmt;
                    const y = height + noise + spike * (1 + mouseEffect * 2.5);
                    
                    if (j === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }

            // Only advance time fast if playing
            time += isPlaying ? 0.015 : 0.002;
            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (event: MouseEvent) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        };

        // Initial setup
        resizeCanvas();
        draw();

        // Listeners
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [rgb.r, rgb.g, rgb.b, isPlaying]);

    // Use absolute positioning with negative z-index so it stays perfectly behind everything
    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 z-0 w-full h-full mix-blend-screen pointer-events-none" 
            style={{ opacity: 0.6 }}
        />
    );
};
