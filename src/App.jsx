import React, { useState } from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import DreamCamera from './components/DreamCamera';
import DreamBoard from './components/DreamBoard';
import DreamStream from './components/DreamStream';
import ColorPalette from './components/ColorPalette';
import { v4 as uuidv4 } from 'uuid';

function App() {
    const [lines, setLines] = useState([]);
    const [overlays, setOverlays] = useState([]);
    const [dreams, setDreams] = useState([]);
    const [mode, setMode] = useState('draw'); // 'draw', 'board', 'stream'
    const [selectedColor, setSelectedColor] = useState('#2c2c2c'); // Default Ink
    const [metaPaths, setMetaPaths] = useState([]);
    const [streamSequence, setStreamSequence] = useState([]);

    // Helper to actually save data
    const captureData = () => {
        // Calculate a default grid position based on current count
        const COLS = 3;
        const MARGIN = 40;
        const TILE_WIDTH = (window.innerWidth - MARGIN * (COLS + 1)) / COLS;
        const index = dreams.length;
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        const x = MARGIN + col * (TILE_WIDTH + MARGIN);
        const y = MARGIN + row * (TILE_WIDTH + MARGIN); // Use TILE_WIDTH for simple square grid or aspect ratio

        const newDream = {
            id: uuidv4(),
            lines: [...lines],
            overlays: [...overlays],
            timestamp: Date.now(),
            x: x,
            y: y
        };
        setDreams(prev => [...prev, newDream]);
    };

    const handleCaptureDream = () => {
        if (lines.length === 0 && overlays.length === 0) return;
        captureData();
        // Clear canvas after capture to allow fresh drawing
        setLines([]);
        setOverlays([]);
    };

    const addOverlay = () => {
        const types = ['rect', 'circle', 'polygon', 'spline'];
        const type = types[Math.floor(Math.random() * types.length)];
        const id = uuidv4();
        const x = window.innerWidth / 2 - 100;
        const y = window.innerHeight / 2 - 100;
        const width = 200;
        const height = 200;

        let shapeData = {
            id,
            x, y,
            width, height,
            type,
            stroke: '#000',
            strokeWidth: 5,
            filterMode: 'normal',
        };

        if (type === 'polygon') {
            // Random polygon (3 to 6 sides)
            const sides = 3 + Math.floor(Math.random() * 4);
            const points = [];
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2;
                points.push(Math.cos(angle) * 100 + 100);
                points.push(Math.sin(angle) * 100 + 100);
            }
            shapeData.points = points;
        } else if (type === 'spline') {
            // Random amorphous blob (NURBS-style closed spline)
            const steps = 8 + Math.floor(Math.random() * 4);
            const points = [];
            const centerX = 100;
            const centerY = 100;
            for (let i = 0; i < steps; i++) {
                const angle = (i / steps) * Math.PI * 2;
                const dist = 60 + Math.random() * 40;
                points.push(centerX + Math.cos(angle) * dist);
                points.push(centerY + Math.sin(angle) * dist);
            }
            shapeData.points = points;
            shapeData.tension = 0.8;
            shapeData.closed = true;
        } else if (type === 'circle') {
            shapeData.radius = 100;
        }

        setOverlays([...overlays, shapeData]);
    };

    return (
        <div className="app-container">
            <div className="mode-toggle">
                <button onClick={() => setMode('draw')} className={mode === 'draw' ? 'active' : ''}>Draw</button>
                <button onClick={() => setMode('board')} className={mode === 'board' ? 'active' : ''}>Board ({dreams.length})</button>
                <button onClick={() => setMode('stream')} className={mode === 'stream' ? 'active' : ''}>Stream</button>
            </div>

            {mode === 'draw' && (
                <>
                    <DrawingCanvas
                        lines={lines} setLines={setLines}
                        overlays={overlays} setOverlays={setOverlays}
                        selectedColor={selectedColor}
                        onCapture={handleCaptureDream}
                    />
                    <DreamCamera onCapture={handleCaptureDream} />

                    <ColorPalette selectedColor={selectedColor} onSelectColor={setSelectedColor} />

                    <button className="add-overlay-btn" onClick={addOverlay} aria-label="Add Frame">
                        + Frame
                    </button>
                </>
            )}

            {mode === 'board' && (
                <DreamBoard
                    dreams={dreams}
                    setDreams={setDreams}
                    metaPaths={metaPaths}
                    setMetaPaths={setMetaPaths}
                    setStreamSequence={setStreamSequence}
                />
            )}

            {mode === 'stream' && (
                <DreamStream
                    dreams={dreams}
                    streamSequence={streamSequence}
                />
            )}
        </div>
    )
}

export default App;
