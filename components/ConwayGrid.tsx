import React, { useRef, useEffect, useState } from 'react';
import type { Grid, ViewMode } from '../types';

interface ConwayGridProps {
    grid: Grid;
    onClickCell: (row: number, col: number) => void;
    isRunning: boolean;
    viewMode: ViewMode;
    aliveColor: string;
    deadColor: string;
    gridColor: string;
    decoherenceRate: number;
}

// --- Color Utility Functions ---

// Parses a hex color string (#RRGGBB) into an [r, g, b] array.
const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
};

// Linearly interpolates between two colors.
const lerpColor = (color1: [number, number, number], color2: [number, number, number], factor: number): string => {
    const r = Math.round(color1[0] + factor * (color2[0] - color1[0]));
    const g = Math.round(color1[1] + factor * (color2[1] - color1[1]));
    const b = Math.round(color1[2] + factor * (color2[2] - color1[2]));
    return `rgb(${r},${g},${b})`;
};

// Converts HSL color values to an RGB string.
const hslToRgbString = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { [r, g, b] = [c, x, 0]; } 
    else if (60 <= h && h < 120) { [r, g, b] = [x, c, 0]; } 
    else if (120 <= h && h < 180) { [r, g, b] = [0, c, x]; } 
    else if (180 <= h && h < 240) { [r, g, b] = [0, x, c]; } 
    else if (240 <= h && h < 300) { [r, g, b] = [x, 0, c]; } 
    else if (300 <= h && h < 360) { [r, g, b] = [c, 0, x]; }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return `rgb(${r},${g},${b})`;
};


export const ConwayGrid: React.FC<ConwayGridProps> = ({ grid, onClickCell, isRunning, viewMode, aliveColor, deadColor, gridColor, decoherenceRate }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const [viewTransform, setViewTransform] = useState({ zoom: 1, offset: { x: 0, y: 0 } });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
    const clickStartPos = useRef({ x: 0, y: 0 });

    const gridSize = grid.length;
    const aliveRgb = hexToRgb(aliveColor);
    const deadRgb = hexToRgb(deadColor);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d', { alpha: false });
        if (!context || !canvas || !containerRef.current) return;
        
        const dpr = window.devicePixelRatio || 1;

        const drawGrid = () => {
            const size = parseFloat(canvas.style.width) || canvas.width / dpr;
            if(!size) return;

            context.fillStyle = deadColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            context.save();
            context.translate(viewTransform.offset.x, viewTransform.offset.y);
            context.scale(viewTransform.zoom, viewTransform.zoom);
            
            const cellSize = size / gridSize;
            const viewMinX = -viewTransform.offset.x / viewTransform.zoom;
            const viewMinY = -viewTransform.offset.y / viewTransform.zoom;
            const viewMaxX = (size - viewTransform.offset.x) / viewTransform.zoom;
            const viewMaxY = (size - viewTransform.offset.y) / viewTransform.zoom;

            const startCol = Math.max(0, Math.floor(viewMinX / cellSize));
            const endCol = Math.min(gridSize, Math.ceil(viewMaxX / cellSize));
            const startRow = Math.max(0, Math.floor(viewMinY / cellSize));
            const endRow = Math.min(gridSize, Math.ceil(viewMaxY / cellSize));

            for (let row = startRow; row < endRow; row++) {
                for (let col = startCol; col < endCol; col++) {
                    const cell = grid[row][col];
                    const probabilityAlive = cell.beta.abs() ** 2;

                    if (viewMode === 'probability') {
                         context.fillStyle = lerpColor(deadRgb, aliveRgb, probabilityAlive);
                    } else { // 'phase' view
                        const phaseAngle = cell.beta.angle();
                        const hue = (phaseAngle + Math.PI) / (2 * Math.PI) * 360;
                        const saturation = 90;
                        const lightness = Math.max(10, 50 * probabilityAlive);
                        context.fillStyle = hslToRgbString(hue, saturation, lightness);
                    }
                    context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                }
            }
            context.restore();

            const scaledCellSize = cellSize * viewTransform.zoom;
            if (scaledCellSize > 5) {
                context.strokeStyle = gridColor;
                context.lineWidth = 1; // Always 1 pixel on the scaled canvas
                context.beginPath();
                for (let i = startCol; i <= endCol; i++) {
                    const x = Math.round(i * scaledCellSize + viewTransform.offset.x * dpr) / dpr;
                    context.moveTo(x, 0);
                    context.lineTo(x, size);
                }
                for (let i = startRow; i <= endRow; i++) {
                    const y = Math.round(i * scaledCellSize + viewTransform.offset.y * dpr) / dpr;
                    context.moveTo(0, y);
                    context.lineTo(size, y);
                }
                context.stroke();
            }
        };

        const renderLoop = () => {
            drawGrid();
            animationFrameId.current = requestAnimationFrame(renderLoop);
        };
        
        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            const size = Math.min(width, height);
            if (canvas) {
                canvas.width = size * dpr;
                canvas.height = size * dpr;
                canvas.style.width = `${size}px`;
                canvas.style.height = `${size}px`;
                context.scale(dpr, dpr);
            }
        });
        resizeObserver.observe(containerRef.current);
        
        renderLoop();

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            resizeObserver.disconnect();
        };
    }, [grid, gridSize, viewMode, aliveColor, deadColor, gridColor, aliveRgb, deadRgb, viewTransform, decoherenceRate]);


    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
        setIsPanning(true);
        panStartRef.current = {
            x: event.clientX,
            y: event.clientY,
            offsetX: viewTransform.offset.x,
            offsetY: viewTransform.offset.y,
        };
        clickStartPos.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isPanning) return;
        const dx = event.clientX - panStartRef.current.x;
        const dy = event.clientY - panStartRef.current.y;
        setViewTransform(prev => ({
            ...prev,
            offset: {
                x: panStartRef.current.offsetX + dx,
                y: panStartRef.current.offsetY + dy
            }
        }));
    };

    const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
        setIsPanning(false);

        const dx = event.clientX - clickStartPos.current.x;
        const dy = event.clientY - clickStartPos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) { // It's a click, not a drag
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const canvasSize = rect.width;
            
            // Transform screen coordinates to grid coordinates
            const x = (event.clientX - rect.left - viewTransform.offset.x) / viewTransform.zoom;
            const y = (event.clientY - rect.top - viewTransform.offset.y) / viewTransform.zoom;
            
            const cellSize = canvasSize / gridSize;
            const col = Math.floor(x / cellSize);
            const row = Math.floor(y / cellSize);

            if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
                onClickCell(row, col);
            }
        }
    };
    
    const handleMouseLeave = () => {
        setIsPanning(false);
    };

    const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const scroll = event.deltaY < 0 ? 1.1 : 0.9;
        
        setViewTransform(prev => {
            const newZoom = Math.max(0.2, Math.min(prev.zoom * scroll, 20));
            const oldZoom = prev.zoom;
            const oldOffset = prev.offset;

            const newOffsetX = mouseX - (mouseX - oldOffset.x) * (newZoom / oldZoom);
            const newOffsetY = mouseY - (mouseY - oldOffset.y) * (newZoom / oldZoom);
            return { zoom: newZoom, offset: { x: newOffsetX, y: newOffsetY } };
        });
    };

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center" style={{ touchAction: 'none' }}>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
                className={isPanning ? 'cursor-grabbing' : 'cursor-grab'}
                aria-label="Conway's Game of Life Grid"
            />
        </div>
    );
};