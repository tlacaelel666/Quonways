import React, { useState, useRef, useEffect } from 'react';

interface CommandTerminalProps {
    history: string[];
    onSubmit: (command: string) => void;
}

export const CommandTerminal: React.FC<CommandTerminalProps> = ({ history, onSubmit }) => {
    const [input, setInput] = useState('');
    const endOfHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(input);
        setInput('');
    };

    return (
        <div className="bg-black/80 backdrop-blur-sm border border-green-400/20 rounded-lg p-4 font-mono text-green-400 text-sm flex flex-col h-full">
            <div className="flex-grow overflow-y-auto pr-2">
                {history.map((line, index) => (
                    <p key={index} className={line.startsWith('>') ? 'text-cyan-400' : ''}>{line}</p>
                ))}
                <div ref={endOfHistoryRef} />
            </div>
            <form onSubmit={handleFormSubmit} className="flex gap-2 mt-2 flex-shrink-0">
                <span className="text-cyan-400">&gt;</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="bg-transparent border-none focus:outline-none w-full text-green-400"
                    autoFocus
                />
            </form>
        </div>
    );
};
