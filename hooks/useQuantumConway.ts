import { useState, useEffect, useRef, useCallback } from 'react';
import type { Grid, GameStats, QuantumCell, ClassicalGrid } from '../types';
import { PATTERNS, type PatternName } from '../utils/patterns';
import { Complex } from '../utils/complex';

// --- Helper Functions ---

const normalizeCell = (cell: QuantumCell): QuantumCell => {
    const norm = Math.sqrt(cell.alpha.abs() ** 2 + cell.beta.abs() ** 2);
    if (norm > 1e-9) {
        return {
            alpha: cell.alpha.mulScalar(1 / norm),
            beta: cell.beta.mulScalar(1 / norm),
        };
    }
    return { alpha: new Complex(1, 0), beta: new Complex(0, 0) };
};

const createEmptyGrid = (size: number): Grid => {
    return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => ({ alpha: new Complex(1, 0), beta: new Complex(0, 0) }))
    );
};

const createRandomGrid = (size: number, aliveProb = 0.2, superpositionProb = 0.3): Grid => {
    return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => {
            const rand = Math.random();
            if (rand < aliveProb) {
                return { alpha: new Complex(0, 0), beta: new Complex(1, 0) }; // Alive
            }
            if (rand < aliveProb + superpositionProb) {
                const alphaRe = Math.sqrt(1 - 0.5);
                const betaRe = Math.sqrt(0.5);
                const phase = Math.random() * 2 * Math.PI;
                return normalizeCell({ alpha: new Complex(alphaRe, 0), beta: Complex.fromPolar(betaRe, phase) }); // Superposition
            }
            return { alpha: new Complex(1, 0), beta: new Complex(0, 0) }; // Dead
        })
    );
};

const MAX_HISTORY_LENGTH = 300;

export const useQuantumConway = () => {
    const [gridSize, setGridSize] = useState(50);
    const [grid, setGrid] = useState<Grid>(() => createRandomGrid(gridSize));
    const [isRunning, setIsRunning] = useState(false);
    const [isToroidal, setIsToroidal] = useState(true);
    const [speed, setSpeed] = useState(100);
    const [decoherenceRate, setDecoherenceRate] = useState(0.005);
    const [hoppingStrength, setHoppingStrength] = useState(0.1);
    const [interactionStrength, setInteractionStrength] = useState(0.05);
    const [stats, setStats] = useState<GameStats>({ generation: 0, expectedPopulation: 0, superpositions: 0, coherence: 0, status: 'Paused' });
    const [statsHistory, setStatsHistory] = useState<GameStats[]>([]);


    const populationHistory = useRef<number[]>([]);
    const animationFrameId = useRef<number | null>(null);
    const rippleAnimationId = useRef<number | null>(null);
    const lastUpdateTime = useRef(0);

    const calculateStats = useCallback((currentGrid: Grid): Omit<GameStats, 'status' | 'generation'> => {
        let expectedPopulation = 0;
        let superpositions = 0;
        for (const row of currentGrid) {
            for (const cell of row) {
                const probAlive = cell.beta.abs() ** 2;
                expectedPopulation += probAlive;
                if (probAlive > 0.05 && probAlive < 0.95) {
                    superpositions++;
                }
            }
        }
        const coherence = superpositions / (gridSize * gridSize);
        return { expectedPopulation, superpositions, coherence };
    }, [gridSize]);

    const runSimulation = useCallback((timestamp: number) => {
        if (!isRunning) return;

        if (timestamp - lastUpdateTime.current >= speed) {
            lastUpdateTime.current = timestamp;

            setGrid(g => {
                const newGrid = g.map(row => row.map(cell => ({ alpha: cell.alpha.copy(), beta: cell.beta.copy() })));
                const dt = 0.5; // Timestep for Hamiltonian evolution

                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        const cell = g[i][j];
                        let neighborProbSum = 0;
                        let hoppingTerm = new Complex(0, 0);
                        let interactionTerm = 0;

                        // --- Calculate Hamiltonian terms from neighbors ---
                        for (let di = -1; di <= 1; di++) {
                            for (let dj = -1; dj <= 1; dj++) {
                                if (di === 0 && dj === 0) continue;
                                let ni = i + di;
                                let nj = j + dj;

                                if (isToroidal) {
                                    ni = (ni + gridSize) % gridSize;
                                    nj = (nj + gridSize) % gridSize;
                                }

                                if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize) {
                                    const neighbor = g[ni][nj];
                                    const neighborProb = neighbor.beta.abs() ** 2;
                                    neighborProbSum += neighborProb;
                                    
                                    hoppingTerm = hoppingTerm.add(neighbor.beta);
                                    
                                    interactionTerm += neighborProb;
                                }
                            }
                        }

                        // --- H_potential: Energy based on Conway's rules ---
                        let potentialEnergy = 0;
                        if (neighborProbSum < 2.0 || neighborProbSum > 3.0) {
                            potentialEnergy = 0.1; // Penalty for being alive
                        } else if (neighborProbSum >= 2.0 && neighborProbSum <= 3.0) {
                            potentialEnergy = -0.1; // Reward for being alive
                        }

                        // --- Combine terms to get d(psi)/dt = -i*H*psi ---
                        const d_alpha = cell.beta.mul(hoppingTerm).mulScalar(-hoppingStrength * dt).mul(Complex.I);
                        
                        const energy_term = (interactionStrength * interactionTerm + potentialEnergy) * dt;
                        const d_beta_energy = cell.beta.mulScalar(energy_term).mul(Complex.I.mulScalar(-1));
                        const d_beta_hopping = cell.alpha.mul(hoppingTerm).mulScalar(hoppingStrength * dt).mul(Complex.I);
                        const d_beta = d_beta_energy.add(d_beta_hopping);

                        // --- Apply changes (Euler step) ---
                        let newCell = newGrid[i][j];
                        newCell.alpha = newCell.alpha.add(d_alpha);
                        newCell.beta = newCell.beta.add(d_beta);
                    }
                }
                
                // --- Normalize and apply decoherence ---
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        newGrid[i][j] = normalizeCell(newGrid[i][j]);

                        if (Math.random() < decoherenceRate) {
                             if (newGrid[i][j].beta.abs() ** 2 > 0.5) {
                                 newGrid[i][j] = { alpha: new Complex(0,0), beta: new Complex(1,0) };
                             } else {
                                 newGrid[i][j] = { alpha: new Complex(1,0), beta: new Complex(0,0) };
                             }
                        }
                    }
                }
                
                setStats(prev => {
                    const newStats = { ...prev, generation: prev.generation + 1 };
                    setStatsHistory(h => [...h, newStats].slice(-MAX_HISTORY_LENGTH));
                    return newStats;
                });
                return newGrid;
            });
        }
        animationFrameId.current = requestAnimationFrame(runSimulation);
    }, [isRunning, speed, gridSize, isToroidal, decoherenceRate, hoppingStrength, interactionStrength]);

    useEffect(() => {
        if (isRunning) {
            lastUpdateTime.current = performance.now();
            animationFrameId.current = requestAnimationFrame(runSimulation);
        } else {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        }
        return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
    }, [isRunning, runSimulation]);

    useEffect(() => { handleReset() }, [gridSize]);

    // FIX: Refactored to improve clarity and resolve a type inference issue with 'status'.
    useEffect(() => {
        const { expectedPopulation, superpositions, coherence } = calculateStats(grid);
        populationHistory.current.push(expectedPopulation);
        if (populationHistory.current.length > 20) populationHistory.current.shift();
        
        let status: GameStats['status'] = isRunning ? 'Running' : 'Paused';
        
        const isExtinct = expectedPopulation < 0.01;
        
        const isStable = !isExtinct && populationHistory.current.length > 15 && (() => {
            const historySlice = populationHistory.current;
            const mean = historySlice.reduce((a,b) => a+b, 0) / historySlice.length;
            const stdDev = Math.sqrt(historySlice.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / historySlice.length);
            return stdDev < 0.1;
        })();

        if (isExtinct) {
            status = 'Extinct';
        } else if (isStable) {
            status = 'Stable';
        }
        
        setStats(prev => ({ ...prev, expectedPopulation, superpositions, coherence, status }));

        if (isRunning && (isExtinct || isStable)) {
            setIsRunning(false);
        }
    }, [grid, isRunning, calculateStats]);

    // --- Control Handlers ---

    const handleRunPause = () => setIsRunning(!isRunning);

    const handleStep = () => {
        if (!isRunning) {
            requestAnimationFrame((t) => runSimulation(t - speed));
        }
    };
    
    const handleReset = () => {
        setGrid(createRandomGrid(gridSize));
        // FIX: Explicitly type initialStats to prevent type widening of the 'status' property.
        const initialStats: GameStats = { generation: 0, expectedPopulation: 0, superpositions: 0, coherence: 0, status: 'Paused' };
        setStats(initialStats);
        setStatsHistory([initialStats]);
        populationHistory.current = [];
        setIsRunning(false);
    };

    // FIX: Updated to fully reset stats and history for consistency.
    const handleClear = () => {
        setGrid(createEmptyGrid(gridSize));
        // FIX: Explicitly type initialStats to prevent type widening of the 'status' property.
        const initialStats: GameStats = { generation: 0, expectedPopulation: 0, superpositions: 0, coherence: 0, status: 'Paused' };
        setStats(initialStats);
        setStatsHistory([initialStats]);
        populationHistory.current = [];
        setIsRunning(false);
    };

    const handlePlacePattern = (patternName: PatternName) => {
        const pattern: ClassicalGrid = PATTERNS[patternName];
        if (!pattern) return;

        const newGrid = createEmptyGrid(gridSize);
        const startX = Math.floor(gridSize / 2 - pattern[0].length / 2);
        const startY = Math.floor(gridSize / 2 - pattern.length / 2);

        for (let i = 0; i < pattern.length; i++) {
            for (let j = 0; j < pattern[i].length; j++) {
                if (i + startY >= 0 && i + startY < gridSize && j + startX >= 0 && j + startX < gridSize) {
                     if (pattern[i][j] === 1) {
                        newGrid[i + startY][j + startX] = { alpha: new Complex(0,0), beta: new Complex(1,0)};
                     } else {
                        newGrid[i + startY][j + startX] = { alpha: new Complex(1,0), beta: new Complex(0,0)};
                     }
                }
            }
        }
        setGrid(newGrid);
        setStatsHistory([]);
        setIsRunning(false);
    };
    
    const killCellAndRipple = (row: number, col: number) => {
        if (rippleAnimationId.current) {
            cancelAnimationFrame(rippleAnimationId.current);
        }

        // Set the initial state with the killed cell
        setGrid(g => {
            const newGrid = g.map((r, i) => r.map((c, j) => {
                if (i === row && j === col) {
                    return { alpha: new Complex(1, 0), beta: new Complex(0, 0) };
                }
                return { alpha: c.alpha.copy(), beta: c.beta.copy() };
            }));
            return newGrid;
        });

        const startTime = performance.now();
        const maxRadius = gridSize * 1.5;
        const waveSpeed = 25; // cells per second
        const waveWidth = 4.0; // width of the wavefront in cells
        const initialAmplitude = Math.PI * 2; // max phase shift
        const decayRate = 0.05;
        const spiralFactor = 1.5; // how much it swirls

        const animateRipple = (timestamp: number) => {
            const elapsedTime = (timestamp - startTime) / 1000;
            const radius = elapsedTime * waveSpeed;

            setGrid(g => {
                const newGrid = g.map(r => r.map(c => ({ alpha: c.alpha.copy(), beta: c.beta.copy() })));
                
                // Optimization: Stop processing when the wave is far outside the grid
                if (radius - waveWidth / 2 > gridSize * Math.sqrt(2)) {
                    if (rippleAnimationId.current) cancelAnimationFrame(rippleAnimationId.current);
                    rippleAnimationId.current = null;
                    return g;
                }

                const currentAmplitude = initialAmplitude * Math.exp(-radius * decayRate);

                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        const distance = Math.sqrt(Math.pow(i - row, 2) + Math.pow(j - col, 2));
                        const distFromWavefront = distance - radius;

                        if (Math.abs(distFromWavefront) < waveWidth / 2) {
                            // Use a cosine profile for a smooth wave shape
                            const waveProfile = Math.cos((distFromWavefront / (waveWidth / 2)) * (Math.PI / 2));
                            const angle = Math.atan2(i - row, j - col);
                            
                            // Combine amplitude, profile, and angle for a spiral effect
                            const phaseShift = currentAmplitude * waveProfile + spiralFactor * angle;
                            
                            const phaseRotator = Complex.fromPolar(1, phaseShift);
                            
                            const cell = newGrid[i][j];
                            cell.beta = cell.beta.mul(phaseRotator);
                            newGrid[i][j] = normalizeCell(cell); // Re-normalize after perturbation
                        }
                    }
                }
                return newGrid;
            });

            if (radius < maxRadius) {
                rippleAnimationId.current = requestAnimationFrame(animateRipple);
            } else {
                rippleAnimationId.current = null;
            }
        };

        rippleAnimationId.current = requestAnimationFrame(animateRipple);
    };
    
    // --- Quantum Operations ---
    
    const applyHadamard = () => {
        setGrid(g => g.map(row => row.map(cell => {
            const invSqrt2 = 1 / Math.sqrt(2);
            const newAlpha = cell.alpha.add(cell.beta).mulScalar(invSqrt2);
            const newBeta = cell.alpha.add(cell.beta.mulScalar(-1)).mulScalar(invSqrt2);
            return { alpha: newAlpha, beta: newBeta };
        })));
        setIsRunning(false);
    };

    const applyMeasurement = () => {
         setGrid(g => g.map(row => row.map(cell => {
             const probAlive = cell.beta.abs() ** 2;
             if (Math.random() < probAlive) {
                 return { alpha: new Complex(0,0), beta: new Complex(1,0) };
             }
             return { alpha: new Complex(1,0), beta: new Complex(0,0) };
         })));
         setIsRunning(false);
    };
    
    return {
        grid,
        isRunning,
        stats,
        statsHistory,
        gridSize,
        setGridSize,
        isToroidal,
        setIsToroidal,
        speed,
        setSpeed,
        decoherenceRate,
        setDecoherenceRate,
        hoppingStrength,
        setHoppingStrength,
        interactionStrength,
        setInteractionStrength,
        handleRunPause,
        handleStep,
        handleReset,
        handleClear,
        handlePlacePattern,
        applyHadamard,
        applyMeasurement,
        killCellAndRipple,
    };
};