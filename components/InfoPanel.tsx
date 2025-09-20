import React from 'react';

const InfoPanel: React.FC = () => {
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4">
            <h2 className="text-xl font-bold text-cyan-400 text-center">Info Panel</h2>
            <p className="text-sm text-gray-400 mt-2">This is a placeholder for the info panel, which provides context or instructions for the application.</p>
        </div>
    );
};

export default InfoPanel;
