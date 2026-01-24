import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
    noPadding?: boolean;
    metadata?: string;
    metadataPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, hoverEffect = true, noPadding = false, metadata, metadataPosition = 'top-right' }, ref) => {

        const metadataPosClasses = {
            'top-right': 'top-4 right-6',
            'top-left': 'top-4 left-6',
            'bottom-right': 'bottom-4 right-6',
            'bottom-left': 'bottom-4 left-6',
        };

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                whileHover={hoverEffect ? { scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 25 } } : undefined}
                className={cn(
                    "relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl",
                    !noPadding && "p-6",
                    className
                )}
            >
                {/* Noise Texture Overlay */}
                <div className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('/noise.svg')" }}></div>

                {/* Top Gradient Border Highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50"></div>

                {/* Content */}
                <div className="relative z-10 h-full">
                    {metadata && (
                        <div className={`absolute ${metadataPosClasses[metadataPosition]} text-[10px] uppercase tracking-widest text-white/20 font-mono pointer-events-none select-none`}>
                            {metadata}
                        </div>
                    )}
                    {children}
                </div>

                {/* Subtle Bottom Refraction */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-30"></div>
            </motion.div>
        );
    }
);

GlassCard.displayName = "GlassCard";
