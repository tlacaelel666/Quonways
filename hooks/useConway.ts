import { useState, useEffect, useRef, useCallback } from 'react';
// FIX: Changed Grid to ClassicalGrid to match the classical implementation of this hook.
import type { ClassicalGrid, GameStats } from '../types';
import { PATTERNS, type PatternName } from '../utils/patterns';

// FIX: Return ClassicalGrid for a classical Conway implementation.
const createEmptyGrid = (size: number): ClassicalGrid => {
    return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
};

// FIX: Return ClassicalGrid for a classical Conway implementation.
const createRandomGrid = (size: number, density = 0.3): ClassicalGrid => {
    return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => (Math.random() < density ? 1 : 0))
    );
};

export const useConway = () => {
    const [gridSize, setGridSize] = useState(50);
    // FIX: Use ClassicalGrid state for this classical implementation.
    const [grid, setGrid] = useState<ClassicalGrid>(() => createRandomGrid(gridSize));
    const [isRunning, setIsRunning] = useState(false);
    const [isToroidal, setIsToroidal] = useState(true);
    const [speed, setSpeed] = useState(100); // ms delay
    // FIX: Aligned state with GameStats type.
    const [stats, setStats] = useState<GameStats>({ generation: 0, expectedPopulation: 0, status: 'Paused', superpositions: 0, coherence: 0 });

    const populationHistory = useRef<number[]>([]);
    const animationFrameId = useRef<number | null>(null);
    const lastUpdateTime = useRef(0);

    // FIX: Use ClassicalGrid for the grid parameter.
    const calculatePopulation = useCallback((currentGrid: ClassicalGrid): number => {
        return currentGrid.reduce((sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell, 0), 0);
    }, []);

    const runSimulation = useCallback((timestamp: number) => {
        // FIX: Removed `if (!isRunning) return;` guard to allow single-step execution.
        if (timestamp - lastUpdateTime.current >= speed) {
            lastUpdateTime.current = timestamp;

            setGrid(g => {
                const newGrid = createEmptyGrid(gridSize);
                let population = 0;
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        let neighbors = 0;
                        for (let di = -1; di <= 1; di++) {
                            for (let dj = -1; dj <= 1; dj++) {
                                if (di === 0 && dj === 0) continue;
                                let ni = i + di;
                                let nj = j + dj;

                                if (isToroidal) {
                                    ni = (ni + gridSize) % gridSize;
                                    nj = (nj + gridSize) % gridSize;
                                    neighbors += g[ni][nj];
                                } else if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize) {
                                    neighbors += g[ni][nj];
                                }
                            }
                        }

                        if (g[i][j] === 1 && (neighbors === 2 || neighbors === 3)) {
                            newGrid[i][j] = 1;
                        } else if (g[i][j] === 0 && neighbors === 3) {
                            newGrid[i][j] = 1;
                        }
                        population += newGrid[i][j];
                    }
                }
                
                populationHistory.current.push(population);
                if (populationHistory.current.length > 10) {
                    populationHistory.current.shift();
                }

                // FIX: Use `expectedPopulation` to match GameStats type.
                setStats(prev => ({ ...prev, generation: prev.generation + 1, expectedPopulation: population }));
                return newGrid;
            });
        }
        // FIX: Moved isRunning check here to only schedule next frame if running.
        if (isRunning) {
            animationFrameId.current = requestAnimationFrame(runSimulation);
        }
    }, [isRunning, speed, gridSize, isToroidal]);

     useEffect(() => {
        if (isRunning) {
            lastUpdateTime.current = performance.now();
            animationFrameId.current = requestAnimationFrame(runSimulation);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isRunning, runSimulation]);

    useEffect(() => {
        handleReset();
    }, [gridSize]);

    useEffect(() => {
        const population = calculatePopulation(grid);
        const history = populationHistory.current;
        let status: GameStats['status'] = isRunning ? 'Running' : 'Paused';
        
        if (population === 0) {
            status = 'Extinct';
            if (isRunning) setIsRunning(false);
        } else if (history.length > 5 && history.every(p => p === population)) {
            status = 'Stable';
            if (isRunning) setIsRunning(false);
        }
        
        // FIX: Use `expectedPopulation` to match GameStats type.
        setStats(prev => ({...prev, expectedPopulation: population, status }));

    }, [grid, isRunning, calculatePopulation]);


    const handleRunPause = () => setIsRunning(!isRunning);

    const handleStep = () => {
        // FIX: Fixed step logic to correctly call simulation once.
        if (!isRunning) {
            requestAnimationFrame(runSimulation);
        }
    };
    
    const handleReset = () => {
        setGrid(createRandomGrid(gridSize));
        // FIX: Use `expectedPopulation` and initialize other stats properties.
        setStats({ generation: 0, expectedPopulation: 0, status: 'Paused', superpositions: 0, coherence: 0 });
        populationHistory.current = [];
        setIsRunning(false);
    };

    const handleClear = () => {
        setGrid(createEmptyGrid(gridSize));
        // FIX: Use `expectedPopulation` and initialize other stats properties.
        setStats({ generation: 0, expectedPopulation: 0, status: 'Paused', superpositions: 0, coherence: 0 });
        populationHistory.current = [];
        setIsRunning(false);
    }

    const handlePlacePattern = (patternName: PatternName) => {
        const pattern = PATTERNS[patternName];
        const newGrid = createEmptyGrid(gridSize);
        
        if (!pattern) return;

        const startX = Math.floor(gridSize / 2 - pattern[0].length / 2);
        const startY = Math.floor(gridSize / 2 - pattern.length / 2);

        for (let i = 0; i < pattern.length; i++) {
            for (let j = 0; j < pattern[i].length; j++) {
                if (i + startY >= 0 && i + startY < gridSize && j + startX >= 0 && j + startX < gridSize) {
                     newGrid[i + startY][j + startX] = pattern[i][j];
                }
            }
        }
        setGrid(newGrid);
        setIsRunning(false);
        // FIX: Use `expectedPopulation` and initialize other stats properties.
        setStats({ generation: 0, expectedPopulation: calculatePopulation(newGrid), status: 'Paused', superpositions: 0, coherence: 0 });
    };

    const toggleCell = (row: number, col: number) => {
        if (isRunning) return;
        setGrid(g => {
            const newGrid = g.map(r => [...r]);
            newGrid[row][col] = g[row][col] ? 0 : 1;
            return newGrid;
        });
    };

    return {
        grid,
        isRunning,
        stats,
        gridSize,
        setGridSize,
        isToroidal,
        setIsToroidal,
        speed,
        setSpeed,
        toggleCell,
        handleRunPause,
        handleStep,
        handleReset,
        handleClear,
        handlePlacePattern,
    };
};