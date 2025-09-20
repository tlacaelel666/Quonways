import React from 'react';
import { OpticalBusIcon } from './Icons';

export const OpticalBusDisplay: React.FC = () => {
    return (
        <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-2">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2 text-cyan-400 absolute top-2 left-2">
                <OpticalBusIcon />
                <span>OPTICAL BUS</span>
            </h3>
            <svg width="100%" height="100%" viewBox="0 0 200 200" className="absolute">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {/* Static Paths */}
                <path d="M100,100 C 50,200 0,100 50,0" stroke="#083344" strokeWidth="1" fill="none" />
                <path d="M100,100 C 150,0 200,100 150,200" stroke="#083344" strokeWidth="1" fill="none" />
                 <path d="M100,100 C 200,50 100,0 0,50" stroke="#083344" strokeWidth="1" fill="none" />
                <path d="M100,100 C 0,150 100,200 200,150" stroke="#083344" strokeWidth="1" fill="none" />


                {/* Animated Paths */}
                <path id="bus-path-1" d="M100,100 C 50,200 0,100 50,0" stroke="#22d3ee" strokeWidth="1.5" fill="none" filter="url(#glow)" />
                <path id="bus-path-2" d="M100,100 C 150,0 200,100 150,200" stroke="#a855f7" strokeWidth="1.5" fill="none" filter="url(#glow)" />
                 <path id="bus-path-3" d="M100,100 C 200,50 100,0 0,50" stroke="#facc15" strokeWidth="1.5" fill="none" filter="url(#glow)" />
                <path id="bus-path-4" d="M100,100 C 0,150 100,200 200,150" stroke="#60a5fa" strokeWidth="1.5" fill="none" filter="url(#glow)" />
            </svg>
            <span className="z-10 text-xs text-cyan-400/70 animate-pulse">Transducing...</span>
            <style>{`
                #bus-path-1, #bus-path-2, #bus-path-3, #bus-path-4 {
                    stroke-dasharray: 20 280; /* dash length, gap length */
                    animation: bus-flow 2s linear infinite;
                }
                #bus-path-2 { animation-delay: 0.5s; }
                #bus-path-3 { animation-delay: 1.0s; }
                #bus-path-4 { animation-delay: 1.5s; }

                @keyframes bus-flow {
                    from {
                        stroke-dashoffset: 300;
                    }
                    to {
                        stroke-dashoffset: 0;
                    }
                }
            `}</style>
        </div>
    )
}
