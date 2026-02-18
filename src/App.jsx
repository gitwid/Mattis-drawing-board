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
        const newDream = {
            id: uuidv4(),
            lines: [...lines],
            overlays: [...overlays], // Capture overlays too!
            timestamp: Date.now(),
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
            // Random spline (NURBS-like)
            shapeData.points = [
                20, 100,
                60, 20,
                140, 180,
                180, 100
            ];
            shapeData.tension = 0.5;
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
