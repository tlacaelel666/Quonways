import { useState, useCallback } from 'react';
import type { GameStats } from '../types';

interface CommandInterfaceProps {
    stats: GameStats;
    handleReset: () => void;
    handleClear: () => void;
    handleRunPause: () => void;
}

export const useCommandInterface = ({ stats, handleReset, handleClear, handleRunPause }: CommandInterfaceProps) => {
    const [history, setHistory] = useState<string[]>(['> Quantum System CLI. Type "help" for commands.']);
    
    // Extraer las propiedades primitivas que necesitamos
    const { generation, expectedPopulation, superpositions, coherence, status } = stats;
    
    const submitCommand = useCallback((cmd: string) => {
        const command = cmd.toLowerCase().trim();
        let newHistory = [...history, `> ${cmd}`];

        switch (command) {
            case 'help':
                newHistory.push('Available commands: help, status, reset, clear, run, pause');
                break;
            case 'status':
                newHistory.push(`- Generation: ${generation}`);
                newHistory.push(`- Population: ${expectedPopulation.toFixed(2)}`);
                newHistory.push(`- Superpositions: ${superpositions}`);
                newHistory.push(`- Coherence: ${(coherence * 100).toFixed(1)}%`);
                newHistory.push(`- Status: ${status}`);
                break;
            case 'reset':
                handleReset();
                newHistory.push('System state randomized.');
                break;
            case 'clear':
                handleClear();
                newHistory.push('Grid cleared.');
                break;
            case 'run':
                handleRunPause();
                newHistory.push('Simulation started.');
                break;
            case 'pause':
                handleRunPause();
                newHistory.push('Simulation paused.');
                break;
            case 'cls':
                newHistory = ['> Quantum System CLI. Type "help" for commands.'];
                break;
            default:
                if(command) newHistory.push(`Error: Command "${cmd}" not recognized.`);
                break;
        }

        setHistory(newHistory);
    }, [generation, expectedPopulation, superpositions, coherence, status, history, handleReset, handleClear, handleRunPause]);

    return { history, submitCommand };
};