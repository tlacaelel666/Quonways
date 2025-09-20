import React from 'react';
import type { GameStats } from '../types';

interface StatsPanelProps {
    stats: GameStats;
}

const StatItem: React.FC<{ label: string; value: string | number; valueColor?: string }> = ({ label, value, valueColor = 'text-white' }) => (
    <div className="flex items-center gap-2 text-sm px-4 whitespace-nowrap">
        <span className="text-gray-400">{label}:</span>
        <span className={`font-mono font-bold ${valueColor}`}>{value}</span>
    </div>
);

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
    
    const getStatusColor = () => {
        switch (stats.status) {
            case 'Running': return 'text-green-400';
            case 'Paused': return 'text-yellow-400';
            case 'Stable': return 'text-blue-400';
            case 'Extinct': return 'text-red-400';
            default: return 'text-white';
        }
    };
    
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-400/20 rounded-full p-2 flex flex-row items-center justify-center divide-x divide-cyan-400/20">
            <StatItem label="Generation" value={stats.generation} />
            <StatItem label="Population" value={stats.expectedPopulation.toFixed(2)} />
            <StatItem label="Superpositions" value={stats.superpositions} />
            <StatItem label="Coherence" value={`${(stats.coherence * 100).toFixed(1)}%`} />
            <StatItem label="Status" value={stats.status} valueColor={getStatusColor()} />
        </div>
    );
};
