import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { simulateExcitationDynamics } from '../utils/excitationSolver';
import type { SystemMetrics, Isotope, EncodedChar, QuantumPacket, ProcessStatus, ExcitationDataPoint, ExcitationResult } from '../types';

// Data constants
const ISOTOPE_DATA: { [key: string]: Isotope } = {
    'U235':   { name: 'Uranium-235',   color: '#22c55e' },
    'U238':   { name: 'Uranium-238',   color: '#166534' },
    'Pu239':  { name: 'Plutonium-239', color: '#ef4444' },
    'Pu238':  { name: 'Plutonium-238', color: '#991b1b' },
    'Th232':  { name: 'Thorium-232',   color: '#a1a1aa' },
    'Sr90':   { name: 'Strontium-90',  color: '#60a5fa' },
    'Co60':   { name: 'Cobalt-60',     color: '#6366f1' },
    'Cm244':  { name: 'Curium-244',    color: '#a855f7' },
    'Po210':  { name: 'Polonium-210',  color: '#2dd4bf' },
    'Am241':  { name: 'Americium-241', color: '#ec4899' },
    'Cf252':  { name: 'Californium-252',color: '#facc15' },
    'Tc99m':  { name: 'Technetium-99m', color: '#22d3ee' },
    'vacuum': { name: 'Vacuum State',  color: '#374151' },
};

const MORSE_QUANTUM_MAP: { [key: string]: { morse: string; quantum: string; isotope: string; phase: number; } } = {
    'A': { morse: '.-',   quantum: '|0⟩|1⟩',       isotope: 'Sr90',  phase: 0 },
    'B': { morse: '-...', quantum: '|1⟩|0⟩|0⟩|0⟩', isotope: 'Co60',  phase: Math.PI / 4 },
    'C': { morse: '-.-.', quantum: '|1⟩|0⟩|1⟩|0⟩', isotope: 'Pu238', phase: Math.PI / 2 },
    'D': { morse: '-..',  quantum: '|1⟩|0⟩|0⟩',    isotope: 'U235',  phase: Math.PI / 3 },
    'E': { morse: '.',    quantum: '|0⟩',          isotope: 'Tc99m', phase: 0 },
    'F': { morse: '..-.', quantum: '|0⟩|0⟩|1⟩|0⟩', isotope: 'Am241', phase: Math.PI / 6 },
    'G': { morse: '--.',  quantum: '|1⟩|1⟩|0⟩',    isotope: 'Cm244', phase: Math.PI / 5 },
    'H': { morse: '....', quantum: '|0⟩|0⟩|0⟩|0⟩', isotope: 'Po210', phase: 0 },
    'I': { morse: '..',   quantum: '|0⟩|0⟩',       isotope: 'Sr90',  phase: Math.PI / 8 },
    'J': { morse: '.---', quantum: '|0⟩|1⟩|1⟩|1⟩', isotope: 'U238',  phase: Math.PI / 7 },
    'K': { morse: '-.-',  quantum: '|1⟩|0⟩|1⟩',    isotope: 'Pu239', phase: Math.PI / 4 },
    'L': { morse: '.-..', quantum: '|0⟩|1⟩|0⟩|0⟩', isotope: 'Th232', phase: Math.PI / 3 },
    'M': { morse: '--',   quantum: '|1⟩|1⟩',       isotope: 'Cf252', phase: Math.PI / 2 },
    'N': { morse: '-.',   quantum: '|1⟩|0⟩',       isotope: 'Co60',  phase: Math.PI / 6 },
    'O': { morse: '---',  quantum: '|1⟩|1⟩|1⟩',    isotope: 'U235',  phase: 2 * Math.PI / 3 },
    'P': { morse: '.--.', quantum: '|0⟩|1⟩|1⟩|0⟩', isotope: 'Am241', phase: Math.PI / 5 },
    'Q': { morse: '--.-', quantum: '|1⟩|1⟩|0⟩|1⟩', isotope: 'Pu238', phase: 3 * Math.PI / 4 },
    'R': { morse: '.-.',  quantum: '|0⟩|1⟩|0⟩',    isotope: 'Sr90',  phase: Math.PI / 4 },
    'S': { morse: '...',  quantum: '|0⟩|0⟩|0⟩',    isotope: 'Tc99m', phase: 0 },
    'T': { morse: '-',    quantum: '|1⟩',          isotope: 'Co60',  phase: Math.PI },
    'U': { morse: '..-',  quantum: '|0⟩|0⟩|1⟩',    isotope: 'U238',  phase: Math.PI / 3 },
    'V': { morse: '...-', quantum: '|0⟩|0⟩|0⟩|1⟩', isotope: 'Cm244', phase: Math.PI / 7 },
    'W': { morse: '.--',  quantum: '|0⟩|1⟩|1⟩',    isotope: 'Pu239', phase: 2 * Math.PI / 3 },
    'X': { morse: '-..-', quantum: '|1⟩|0⟩|0⟩|1⟩', isotope: 'Po210', phase: 3 * Math.PI / 5 },
    'Y': { morse: '-.--', quantum: '|1⟩|0⟩|1⟩|1⟩', isotope: 'Cf252', phase: 4 * Math.PI / 5 },
    'Z': { morse: '--..', quantum: '|1⟩|1⟩|0⟩|0⟩', isotope: 'Th232', phase: Math.PI / 2 },
    '0': { morse: '-----', quantum: '|00000⟩', isotope: 'U235', phase: 0 },
    '1': { morse: '.----', quantum: '|00001⟩', isotope: 'Pu239', phase: Math.PI / 5 },
    '2': { morse: '..---', quantum: '|00011⟩', isotope: 'Th232', phase: 2 * Math.PI / 5 },
    '3': { morse: '...--', quantum: '|00111⟩', isotope: 'U238', phase: 3 * Math.PI / 5 },
    '4': { morse: '....-', quantum: '|01111⟩', isotope: 'Am241', phase: 4 * Math.PI / 5 },
    '5': { morse: '.....', quantum: '|11111⟩', isotope: 'Sr90', phase: Math.PI },
    '6': { morse: '-....', quantum: '|11110⟩', isotope: 'Co60', phase: 6 * Math.PI / 5 },
    '7': { morse: '--...', quantum: '|11100⟩', isotope: 'Cm244', phase: 7 * Math.PI / 5 },
    '8': { morse: '---..', quantum: '|11000⟩', isotope: 'Po210', phase: 8 * Math.PI / 5 },
    '9': { morse: '----.', quantum: '|10000⟩', isotope: 'Cf252', phase: 9 * Math.PI / 5 },
    ' ': { morse: '/', quantum: '⊗', isotope: 'vacuum', phase: 0 },
};

const INITIAL_METRICS: SystemMetrics = {
  cycle: 0,
  temperature_mk: 15.0,
  decoherence_t2_us: 100.0,
  qber_estimated: 0,
  fidelity_avg: 0,
};

export const useIonizer = () => {
  const [status, setStatus] = useState<ProcessStatus>('IDLE');
  const [log, setLog] = useState<string[]>([]);
  const [packet, setPacket] = useState<QuantumPacket | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics>(INITIAL_METRICS);
  const [morseString, setMorseString] = useState('');
  const [binaryString, setBinaryString] = useState('');
  const [excitationData, setExcitationData] = useState<ExcitationDataPoint[]>([]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);


  const animationFrameRef = useRef<number | null>(null);
  const simulationResultsRef = useRef<ExcitationResult | null>(null);

  const getAiResponse = async (message: string, binary: string) => {
    setLog(prev => [...prev, '[AI] Preparing instructions for AI Core...']);
    setLog(prev => [...prev, '[AI] Receiving transmission...']);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `You are a Quantum AI Core System codenamed 'BiMO'. You have just received a transmission. Original message: "${message}". Transduced BiMoType binary sequence: "${binary.slice(0, 200)}...". Acknowledge the instruction and provide a concise, futuristic response based on the message content.`;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      setLog(prev => [...prev, '[AI] Response received from AI Core.']);
      setLog(prev => [...prev, `[AI-RESPONSE] ${response.text}`]);

    } catch (error) {
      console.error("Gemini API error:", error);
      const errorMessage = 'Critical Error: AI Core link severed. Check quantum entanglement capacitor.';
      setLog(prev => [...prev, `[ERROR] ${errorMessage}`]);
      setLog(prev => [...prev, `[AI-RESPONSE] ${errorMessage}`]);
    } finally {
      setStatus('COMPLETE');
    }
  };

  const startProcess = useCallback((messageToEncode: string) => {
    if (status !== 'IDLE' || !messageToEncode) return;
    
    // Stage 0: Excitation Simulation
    setLog(['[SYS] Pumping quantum dot core...']);
    setStatus('IONIZING');
    setExcitationData([]);

    simulationResultsRef.current = simulateExcitationDynamics();
    const fullSimData = simulationResultsRef.current.data;
    const simDuration = fullSimData[fullSimData.length - 1].t;
    const animStartTime = performance.now();
    const animDuration = 2000; // 2 seconds for the chart animation

    const animateChart = () => {
        const elapsedTime = performance.now() - animStartTime;
        const progress = Math.min(elapsedTime / animDuration, 1);
        const currentSimTime = progress * simDuration;
        
        const displayData = fullSimData.filter(d => d.t <= currentSimTime);
        setExcitationData(displayData);

        if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animateChart);
        } else {
            // End of Excitation, calculate metrics from final state
            const finalState = fullSimData[fullSimData.length - 1];
            const fidelity = finalState.psi1; // Prob amplitude of |1>
            const qber = 1 - fidelity; // Prob of being in |0>

            setMetrics(prev => ({
                ...prev,
                fidelity_avg: fidelity,
                qber_estimated: qber,
                cycle: prev.cycle + 1,
            }));
            setLog(prev => [...prev, `[OK] Core coherence achieved. Fidelity: ${(fidelity * 100).toFixed(2)}%`]);
            
            // Proceed to Ionization
            startIonization(messageToEncode);
        }
    }
    animationFrameRef.current = requestAnimationFrame(animateChart);


  }, [status]);

  const startIonization = (message: string) => {
    setLog(prev => [...prev, '[SYS] Initiating quantum ionization...']);
    const encodedChars: EncodedChar[] = [];
    const finalPacket: QuantumPacket = { id: `BiMO-${Date.now()}`, timestamp: Date.now(), originalMessage: message, characters: encodedChars };
    setPacket(finalPacket);
    let charIndex = 0;

    const processChar = () => {
      if (charIndex >= message.length) {
        setLog(prev => [...prev, `[OK] Quantum packet generated: ${finalPacket.id}`]);
        
        setTimeout(() => {
            // Stage 2: Transduction
            setStatus('TRANSDUCING');
            setLog(prev => [...prev, '[SYS] Transducing packet to Morse/Binary...']);
            
            const morse = finalPacket.characters.map(c => c.morse).join(' ');
            setMorseString(morse);

            const binary = morse.split('').map(c => {
                if (c === '.') return '1';
                if (c === '-') return '111';
                if (c === ' ') return '000'; // Word separator
                return '0'; // Symbol separator
            }).join('') || '0';
            setBinaryString(binary);
            setLog(prev => [...prev, '[OK] Binary stream generated.']);

            // Generate the access key
            const key = `BIMO-KEY-${finalPacket.timestamp.toString().slice(-4)}-${finalPacket.characters.length}-${binary.slice(5, 15)}`;
            setGeneratedKey(key);
            setLog(prev => [...prev, `[SEC] Access key generated: ${key}`]);

            // Stage 3: AI Instruction
            setTimeout(() => {
                setStatus('AWAITING_AI');
                getAiResponse(message, binary);
            }, 3000); // Wait for bus animation
        }, 500);
        return;
      }

      const char = message[charIndex];
      const mapping = MORSE_QUANTUM_MAP[char];

      if (mapping) {
        const isotopeInfo = ISOTOPE_DATA[mapping.isotope];
        const newChar: EncodedChar = { id: `${char}-${charIndex}-${Date.now()}`, char, morse: mapping.morse, quantumState: mapping.quantum, isotope: isotopeInfo, phase: mapping.phase };
        encodedChars.push(newChar);
        setPacket({ ...finalPacket, characters: [...encodedChars] });
        if (mapping.isotope !== 'vacuum') {
            setLog(prev => [...prev, `[${char}]->${isotopeInfo.name}`]);
        }
      } else {
        setLog(prev => [...prev, `[${char}]->Unknown symbol. Skip.`]);
      }

      charIndex++;
      setTimeout(processChar, 100);
    };
    
    setTimeout(processChar, 100);
  }


  const resetProcess = useCallback(() => {
    setStatus('IDLE');
    setLog([]);
    setPacket(null);
    setMorseString('');
    setBinaryString('');
    setGeneratedKey(null);
    setExcitationData([]);
    simulationResultsRef.current = null;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  return {
    status,
    log,
    packet,
    metrics,
    morseString,
    binaryString,
    excitationData,
    generatedKey,
    startProcess,
    resetProcess,
  };
};