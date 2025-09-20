import { Complex } from './utils/complex';

export type QuantumCell = {
    alpha: Complex; // Amplitude for |0⟩ (dead)
    beta: Complex;  // Amplitude for |1⟩ (alive)
};

export type Grid = QuantumCell[][];
export type ClassicalGrid = (0 | 1)[][];

export interface GameStats {
    generation: number;
    expectedPopulation: number;
    superpositions: number;
    coherence: number;
    status: 'Running' | 'Paused' | 'Stable' | 'Extinct';
}

export type ViewMode = 'probability' | 'phase';

// --- Added types for useAutomaton ---

export interface Isotope {
    name: string;
    color: string;
}

export interface EncodedChar {
    id: string;
    char: string;
    morse: string;
    quantumState: string;
    isotope: Isotope;
    phase: number;
}

export interface QuantumPacket {
    id: string;
    timestamp: number;
    originalMessage: string;
    characters: EncodedChar[];
}

export type ProcessStatus = 'IDLE' | 'IONIZING' | 'TRANSDUCING' | 'AWAITING_AI' | 'COMPLETE';

export interface SystemMetrics {
    cycle: number;
    temperature_mk: number;
    decoherence_t2_us: number;
    qber_estimated: number;
    fidelity_avg: number;
}

export interface ExcitationDataPoint {
    t: number;
    psi0: number;
    psi1: number;
}

export interface ExcitationResult {
    success: boolean;
    data: ExcitationDataPoint[];
}