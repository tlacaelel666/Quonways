import React, { useState } from 'react';
import { useQuantumConway } from './hooks/useQuantumConway';
import { ConwayGrid } from './components/ConwayGrid';
import { Controls } from './components/Controls';
import { StatsPanel } from './components/StatsPanel';
import { SettingsIcon, ChartBarIcon, TerminalIcon, ChevronDownIcon, ChevronUpIcon } from './components/Icons';
import type { ViewMode } from './types';
import { MonitoringPanel } from './components/MonitoringPanel';
import { CommandTerminal } from './components/CommandTerminal';
import { useCommandInterface } from './hooks/useCommandInterface';
import { useIonizer } from './hooks/useAutomaton';

export const App: React.FC = () => {
    const {
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
    } = useQuantumConway();

    const { 
        packet, 
        startProcess, 
        resetProcess,
        status: ionizerStatus 
    } = useIonizer();

    // UI State
    const [viewMode, setViewMode] = useState<ViewMode>('probability');
    const [aliveColor, setAliveColor] = useState('#22d3ee');
    const [deadColor, setDeadColor] = useState('#111827');
    const [gridColor, setGridColor] = useState('#1f2937');
    
    const [showSettings, setShowSettings] = useState(true);
    const [showMonitoring, setShowMonitoring] = useState(true);
    const [showTerminal, setShowTerminal] = useState(false);
    const [isPacketDetailsOpen, setIsPacketDetailsOpen] = useState(true);
    const [ionizerMessage, setIonizerMessage] = useState('HELLO QUANTUM WORLD');


    const { history: terminalHistory, submitCommand } = useCommandInterface({
        stats,
        handleReset,
        handleClear,
        handleRunPause,
    });

    const handleIonizerSubmit = () => {
        if (ionizerMessage.trim()) {
            startProcess(ionizerMessage.trim().toUpperCase());
        }
    }


    return (
        <main className="bg-gray-900 text-white h-screen w-screen flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 bg-gray-900/50 backdrop-blur-sm z-20 flex items-center justify-between p-2 border-b border-cyan-400/20">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-cyan-400">Quantum Game of Life</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>View:</span>
                        <button onClick={() => setViewMode('probability')} className={`px-2 py-1 rounded ${viewMode === 'probability' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Probability</button>
                        <button onClick={() => setViewMode('phase')} className={`px-2 py-1 rounded ${viewMode === 'phase' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Phase</button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <StatsPanel stats={stats} />
                    <button onClick={() => setShowTerminal(!showTerminal)} className={`p-2 rounded-md ${showTerminal ? 'bg-cyan-600' : 'bg-gray-700'} hover:bg-cyan-600/50`} title="Toggle Terminal"><TerminalIcon /></button>
                    <button onClick={() => setShowMonitoring(!showMonitoring)} className={`p-2 rounded-md ${showMonitoring ? 'bg-cyan-600' : 'bg-gray-700'} hover:bg-cyan-600/50`} title="Toggle Monitor"><ChartBarIcon /></button>
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-md ${showSettings ? 'bg-cyan-600' : 'bg-gray-700'} hover:bg-cyan-600/50`} title="Toggle Settings"><SettingsIcon /></button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 min-h-0">
                {/* Settings Panel */}
                <aside className={`flex-shrink-0 bg-gray-900/50 backdrop-blur-sm z-10 transition-all duration-300 overflow-y-auto ${showSettings ? 'w-80 p-2' : 'w-0'}`}>
                    {showSettings && (
                        <div className="flex flex-col gap-4">
                            <Controls
                                isRunning={isRunning}
                                gridSize={gridSize}
                                isToroidal={isToroidal}
                                speed={speed}
                                decoherenceRate={decoherenceRate}
                                hoppingStrength={hoppingStrength}
                                interactionStrength={interactionStrength}
                                onRunPause={handleRunPause}
                                onStep={handleStep}
                                onReset={handleReset}
                                onClear={handleClear}
                                onPlacePattern={handlePlacePattern}
                                onGridSizeChange={setGridSize}
                                onIsToroidalChange={setIsToroidal}
                                onSpeedChange={setSpeed}
                                onDecoherenceChange={setDecoherenceRate}
                                onHoppingStrengthChange={setHoppingStrength}
                                onInteractionStrengthChange={setInteractionStrength}
                                onApplyHadamard={applyHadamard}
                                onApplyMeasurement={applyMeasurement}
                                aliveColor={aliveColor}
                                deadColor={deadColor}
                                gridColor={gridColor}
                                onAliveColorChange={setAliveColor}
                                onDeadColorChange={setDeadColor}
                                onGridColorChange={setGridColor}
                            />

                            <hr className="border-cyan-400/20 my-2" />
                            
                            {/* Quantum Ionizer Section */}
                            <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4 flex flex-col gap-4">
                                 <h2 className="text-xl font-bold text-cyan-400 text-center">Quantum Ionizer</h2>
                                 <div>
                                     <label className="block text-sm font-medium text-gray-400 mb-1">Message to Encode</label>
                                     <textarea 
                                        value={ionizerMessage}
                                        onChange={(e) => setIonizerMessage(e.target.value)}
                                        rows={2}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Enter message..."
                                        disabled={ionizerStatus !== 'IDLE'}
                                     />
                                 </div>
                                  <div className="grid grid-cols-2 gap-2">
                                     <button onClick={handleIonizerSubmit} disabled={ionizerStatus !== 'IDLE' || !ionizerMessage.trim()} className="flex-1 bg-purple-800/70 hover:bg-purple-600/70 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold p-2 rounded-md transition-colors">
                                        Process
                                     </button>
                                      <button onClick={resetProcess} disabled={ionizerStatus === 'IDLE'} className="flex-1 bg-gray-700 hover:bg-cyan-600/50 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold p-2 rounded-md transition-colors">
                                        Reset
                                     </button>
                                  </div>
                            </div>
                            
                            {/* Quantum Packet Details Section */}
                            {packet && (
                                <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4 flex flex-col gap-2">
                                    <button onClick={() => setIsPacketDetailsOpen(!isPacketDetailsOpen)} className="w-full flex items-center justify-between text-lg font-bold text-cyan-400/80">
                                        <h3>Quantum Packet Details</h3>
                                        {isPacketDetailsOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                    </button>
                                    {isPacketDetailsOpen && (
                                        <div className="text-xs text-gray-300 space-y-2 mt-2">
                                            <p><span className="font-bold text-gray-400">ID:</span> <span className="font-mono">{packet.id}</span></p>
                                            <p><span className="font-bold text-gray-400">Message:</span> "{packet.originalMessage}"</p>
                                            <p className="font-bold text-gray-400 border-b border-gray-600 pb-1">Encoded Characters:</p>
                                            <div className="max-h-48 overflow-y-auto pr-2 space-y-1">
                                                {packet.characters.map(char => (
                                                    <div key={char.id} className="grid grid-cols-3 gap-2 items-center font-mono bg-gray-900/50 p-1 rounded">
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: char.isotope.color }}></span>
                                                            <span className="font-bold text-lg text-white">'{char.char}'</span>
                                                        </span>
                                                        <span className="text-cyan-300">{char.isotope.name}</span>
                                                        <span className="text-right text-purple-300">{char.morse}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    )}
                </aside>

                {/* Grid and Panels */}
                <div className="flex-1 flex flex-col relative">
                    <div className="flex-1 p-4">
                        <ConwayGrid
                            grid={grid}
                            onClickCell={killCellAndRipple}
                            isRunning={isRunning}
                            viewMode={viewMode}
                            aliveColor={aliveColor}
                            deadColor={deadColor}
                            gridColor={gridColor}
                            decoherenceRate={decoherenceRate}
                        />
                    </div>
                    
                    {/* Monitoring Panel */}
                    <div className={`flex-shrink-0 p-4 pt-0 transition-all duration-300 ${showMonitoring ? 'h-64' : 'h-0 opacity-0 pointer-events-none'}`}>
                       {showMonitoring && <MonitoringPanel history={statsHistory} />}
                    </div>

                    {/* Command Terminal */}
                     <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${showTerminal ? 'h-1/3' : 'h-0 opacity-0 pointer-events-none'}`}>
                        {showTerminal && <CommandTerminal history={terminalHistory} onSubmit={submitCommand} />}
                    </div>

                </div>
            </div>
        </main>
    );
};