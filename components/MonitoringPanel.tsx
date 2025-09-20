import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import type { ChartOptions } from 'chart.js';
import type { GameStats } from '../types';
import { ChartBarIcon } from './Icons';

interface MonitoringPanelProps {
  history: GameStats[];
}

export const MonitoringPanel: React.FC<MonitoringPanelProps> = ({ history }) => {
  const chartData = {
    labels: history.map(s => s.generation),
    datasets: [
      {
        label: 'Population',
        data: history.map(s => s.expectedPopulation),
        borderColor: '#22d3ee', // Cyan
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Superpositions',
        data: history.map(s => s.superpositions),
        borderColor: '#a855f7', // Purple
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Coherence',
        data: history.map(s => s.coherence * 100),
        borderColor: '#facc15', // Yellow
        backgroundColor: 'rgba(250, 204, 21, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        yAxisID: 'yPercentage',
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 200,
    },
    scales: {
      x: {
        type: 'linear',
        ticks: { color: '#9ca3af', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: { display: true, text: 'Generation', color: '#9ca3af', font: { size: 12 } },
      },
      y: {
        type: 'linear',
        position: 'left',
        ticks: { color: '#9ca3af', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: { display: true, text: 'Count', color: '#9ca3af', font: { size: 12 } },
      },
      yPercentage: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 100,
        ticks: { 
            color: '#facc15', 
            font: { size: 10 },
            callback: value => `${value}%`
        },
        grid: { drawOnChartArea: false }, // only show the grid for the main y-axis
        title: { display: true, text: 'Coherence', color: '#facc15', font: { size: 12 } },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#d1d5db', font: { size: 12 } },
      },
      tooltip: {
          mode: 'index',
          intersect: false,
      }
    },
    interaction: {
        mode: 'index',
        intersect: false,
    },
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4 flex flex-col gap-2 h-64">
        <h2 className="text-lg font-bold text-cyan-400 text-center flex items-center justify-center gap-2">
            <ChartBarIcon />
            <span>System Monitor</span>
        </h2>
        <div className="flex-grow min-h-0">
             <Line options={options} data={chartData} />
        </div>
    </div>
  );
};
