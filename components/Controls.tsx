import React from 'react';
import type { PatternName } from '../utils/patterns';
import { PlayIcon, PauseIcon, StepIcon, ResetIcon, ClearIcon, MeasureIcon, HadamardIcon } from './Icons';
import { PATTERNS } from '../utils/patterns';

interface ControlsProps {
    isRunning: boolean;
    gridSize: number;
    isToroidal: boolean;
    speed: number;
    decoherenceRate: number;
    hoppingStrength: number;
    interactionStrength: number;
    onRunPause: () => void;
    onStep: () => void;
    onReset: () => void;
    onClear: () => void;
    onPlacePattern: (patternName: PatternName) => void;
    onGridSizeChange: (size: number) => void;
    onIsToroidalChange: (isToroidal: boolean) => void;
    onSpeedChange: (speed: number) => void;
    onDecoherenceChange: (rate: number) => void;
    onHoppingStrengthChange: (strength: number) => void;
    onInteractionStrengthChange: (strength: number) => void;
    onApplyHadamard: () => void;
    onApplyMeasurement: () => void;
    aliveColor: string;
    deadColor: string;
    gridColor: string;
    onAliveColorChange: (color: string) => void;
    onDeadColorChange: (color: string) => void;
    onGridColorChange: (color: string) => void;
}

const patternOptions = Object.keys(PATTERNS);

const ControlButton: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean; title: string; className?: string; }> = 
({ onClick, children, disabled = false, title, className = '' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`flex-1 bg-gray-700 hover:bg-cyan-600/50 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold p-2 rounded-md transition-colors flex items-center justify-center gap-2 ${className}`}
    >
        {children}
    </button>
);

const LabeledSelect: React.FC<{ label: string; value: any; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; }> =
({ label, value, onChange, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
            {children}
        </select>
    </div>
);

const LabeledSlider: React.FC<{ label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void, displayValue?: string }> =
({ label, value, min, max, step, onChange, displayValue }) => (
     <div>
         <label className="block text-sm font-medium text-gray-400 mb-1">
            {label} ({displayValue ?? value})
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

const ColorInput: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = 
({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-400">{label}</label>
        <input 
            type="color" 
            value={value}
            onChange={onChange}
            className="p-1 h-8 w-14 block bg-gray-700 border border-gray-600 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none"
        />
    </div>
);

export const Controls: React.FC<ControlsProps> = (props) => {
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-cyan-400 text-center">Controls</h2>
            
            <div className="grid grid-cols-2 gap-2">
                <ControlButton onClick={props.onRunPause} title={props.isRunning ? 'Pause' : 'Play'}>
                    {props.isRunning ? <PauseIcon /> : <PlayIcon />}
                    <span>{props.isRunning ? 'Pause' : 'Play'}</span>
                </ControlButton>
                 <ControlButton onClick={props.onStep} disabled={props.isRunning} title="Next Step">
                    <StepIcon />
                    <span>Step</span>
                </ControlButton>
                <ControlButton onClick={props.onReset} title="Randomize Grid">
                    <ResetIcon />
                    <span>Reset</span>
                </ControlButton>
                <ControlButton onClick={props.onClear} title="Clear Grid">
                    <ClearIcon />
                    <span>Clear</span>
                </ControlButton>
            </div>

            <hr className="border-cyan-400/20" />
             <h3 className="text-lg font-bold text-cyan-400/80 text-center -mb-2">Quantum Operations</h3>
             <div className="grid grid-cols-2 gap-2">
                 <ControlButton onClick={props.onApplyMeasurement} title="Collapse all cells to classical states" className="bg-purple-800/70 hover:bg-purple-600/70"><MeasureIcon/><span>Measure</span></ControlButton>
                 <ControlButton onClick={props.onApplyHadamard} title="Apply Hadamard gate to all cells (create superposition)" className="bg-purple-800/70 hover:bg-purple-600/70"><HadamardIcon/><span>Hadamard</span></ControlButton>
            </div>
            
            <hr className="border-cyan-400/20" />
            <h3 className="text-lg font-bold text-cyan-400/80 text-center -mb-2">Settings</h3>

            <LabeledSelect label="Patterns" value="" onChange={(e) => props.onPlacePattern(e.target.value as PatternName)}>
                 <option value="" disabled>Place a classical pattern...</option>
                 {patternOptions.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1).replace(/_/g, ' ')}</option>)}
            </LabeledSelect>

            <LabeledSelect label="Grid Size" value={props.gridSize} onChange={(e) => props.onGridSizeChange(Number(e.target.value))}>
                <option value={25}>Small (25x25)</option>
                <option value={50}>Medium (50x50)</option>
                <option value={100}>Large (100x100)</option>
                <option value={150}>X-Large (150x150)</option>
            </LabeledSelect>
            
            <LabeledSlider label="Speed" value={props.speed} min={10} max={500} step={10} onChange={props.onSpeedChange} displayValue={`${props.speed}ms`} />

            <div className="flex items-center justify-between">
                <label htmlFor="toroidal-toggle" className="text-sm font-medium text-gray-400">
                    Toroidal Grid (Wrap)
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="toroidal-toggle" checked={props.isToroidal} onChange={(e) => props.onIsToroidalChange(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
            </div>
            
             <hr className="border-cyan-400/20" />
            <h3 className="text-lg font-bold text-cyan-400/80 text-center -mb-2">Quantum Physics</h3>
             <LabeledSlider label="Decoherence Rate" value={props.decoherenceRate} min={0} max={0.1} step={0.001} onChange={props.onDecoherenceChange} />
             <LabeledSlider label="Hopping Strength (t)" value={props.hoppingStrength} min={0} max={0.5} step={0.01} onChange={props.onHoppingStrengthChange} />
             <LabeledSlider label="Interaction Strength (V)" value={props.interactionStrength} min={-0.2} max={0.2} step={0.01} onChange={props.onInteractionStrengthChange} />


             <hr className="border-cyan-400/20" />
            <h3 className="text-lg font-bold text-cyan-400/80 text-center -mb-2">Appearance</h3>
            
            <ColorInput label="Alive Color (100%)" value={props.aliveColor} onChange={(e) => props.onAliveColorChange(e.target.value)} />
            <ColorInput label="Dead Color (0%)" value={props.deadColor} onChange={(e) => props.onDeadColorChange(e.target.value)} />
            <ColorInput label="Grid Color" value={props.gridColor} onChange={(e) => props.onGridColorChange(e.target.value)} />
        </div>
    );
};