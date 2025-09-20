import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto'; // This import handles all registrations
import type { ChartOptions } from 'chart.js';
import type { ExcitationDataPoint, SystemMetrics } from '../types';

interface ExcitationDisplayProps {
  data: ExcitationDataPoint[];
  metrics: SystemMetrics;
}

export const ExcitationDisplay: React.FC<ExcitationDisplayProps> = ({ data, metrics }) => {
  const chartData = {
    labels: data.map(d => d.t.toFixed(2)),
    datasets: [
      {
        label: '|Ψ₀| (Ground)',
        data: data.map(d => d.psi0),
        borderColor: '#38bdf8', // light blue
        backgroundColor: 'rgba(56, 189, 248, 0.2)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
      },
      {
        label: '|Ψ₁| (Excited)',
        data: data.map(d => d.psi1),
        borderColor: '#facc15', // yellow
        backgroundColor: 'rgba(250, 204, 21, 0.2)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 0 // Disable internal animation, we control it from the hook
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af', font: { size: 8 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: { display: true, text: 'Time', color: '#9ca3af', font: {size: 10} }
      },
      y: {
        min: 0,
        max: 1,
        ticks: { color: '#9ca3af', font: { size: 8 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: { display: true, text: 'Amplitude', color: '#9ca3af', font: {size: 10} }
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#d1d5db', font: { size: 9 } },
      },
    },
  };

  return (
    <div className="w-full h-full flex flex-col">
        <div className="flex-grow min-h-0">
            <Line options={options} data={chartData} />
        </div>
        <div className="text-xs space-y-1 mt-2 flex-shrink-0">
            <p>Fidelity: <span className="text-white">{(metrics.fidelity_avg * 100).toFixed(2)}%</span></p>
            <p>QBER est: <span className="text-white">{(metrics.qber_estimated * 100).toFixed(2)}%</span></p>
        </div>
    </div>
  );
};