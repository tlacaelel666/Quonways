import React from 'react';
import type { QuantumPacket, EncodedChar, ProcessStatus } from '../types';

interface IonizerDisplayProps {
  packet: QuantumPacket | null;
  status: ProcessStatus;
  binaryString: string;
  onClick: () => void;
  disabled: boolean;
}

const Particle: React.FC<{ char: EncodedChar; index: number }> = ({ char, index }) => {
  const animationDuration = 5 + Math.random() * 5; // 5-10s
  const angle = (index / 12) * Math.PI * 2 + (Math.random() - 0.5);
  const color = char.isotope.color;

  return (
    <div
      className="absolute w-20 h-20"
      style={{
        animation: `radiate ${animationDuration}s ${index * 0.1}s ease-out forwards`,
        transform: `rotate(${angle}rad)`,
      }}
    >
      <div
        key={char.id}
        className="w-3 h-3 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 15px 1px ${color}`,
        }}
      ></div>
    </div>
  );
};

const PulseStream: React.FC<{ binaryString: string }> = ({ binaryString }) => {
    return (
        <div className="absolute top-1/2 left-1/2 w-1/2 h-10 -translate-y-1/2">
            {binaryString.split('').map((bit, index) => {
                if (bit === '0') return null;
                const delay = index * 0.01;
                return (
                    <div
                        key={index}
                        className="absolute w-1 h-3 bg-purple-400 rounded-full"
                        style={{
                            animation: `pulse-travel 1s ${delay}s linear forwards`,
                            boxShadow: '0 0 10px 2px #c084fc',
                            opacity: 0,
                        }}
                    />
                );
            })}
        </div>
    );
};


export const IonizerDisplay: React.FC<IonizerDisplayProps> = ({ packet, status, binaryString, onClick, disabled }) => {
  const isIonizing = status === 'IONIZING';
  const isTransducing = status === 'TRANSDUCING' || status === 'AWAITING_AI' || status === 'COMPLETE';

  const getCoreStatusText = () => {
    if (disabled && status === 'IDLE') return 'Enter Message';
    if (status === 'IDLE') return 'Initiate';
    if (status === 'COMPLETE') return 'Reset';
    if (status === 'IONIZING') return 'Ionizing';
    if (status === 'TRANSDUCING') return 'Transducing';
    if (status === 'AWAITING_AI') return 'Transmitting';
    return 'Processing';
  };

  return (
    <div 
      className={`relative w-full h-full flex items-center justify-center overflow-hidden transition-all duration-300 group ${!disabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Central Emitter */}
      <div className={`w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center shadow-2xl border-2 border-cyan-500/50 z-10 transition-all duration-300 ${!disabled ? 'group-hover:scale-110 group-hover:border-cyan-400' : ''}`}>
        <div 
          className={`w-20 h-20 rounded-full transition-all duration-300 flex items-center justify-center text-center text-sm font-bold ${isIonizing || isTransducing ? 'bg-cyan-400 animate-pulse text-black' : 'bg-gray-700 text-cyan-400/70'}`}
          style={{ boxShadow: isIonizing || isTransducing ? '0 0 25px 8px #06b6d4' : (!disabled ? '0 0 15px 2px #0891b2' : 'none') }}
        >
          <span>{getCoreStatusText()}</span>
        </div>
      </div>

      {/* Radiating Particles */}
      {isIonizing && packet && packet.characters.map((char, index) => (
        <Particle key={char.id} char={char} index={index} />
      ))}

      {/* Pulse Stream */}
      {isTransducing && <PulseStream binaryString={binaryString} />}
      
      {/* CSS for animation */}
      <style>{`
        @keyframes radiate {
          0% {
            transform: rotate(0) translateX(60px) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(0) translateX(min(15vw, 250px)) scale(0);
            opacity: 0;
          }
        }
        @keyframes pulse-travel {
            0% {
                transform: translateX(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateX(min(12vw, 200px));
                opacity: 0;
            }
        }
      `}</style>
    </div>
  );
};