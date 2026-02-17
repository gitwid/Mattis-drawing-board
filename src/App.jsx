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
    const [isSwirling, setIsSwirling] = useState(false);

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
    };

    const handleClear = () => {
        // Trigger Swirl Animation
        setIsSwirling(true);

        // Auto-save if not empty
        if (lines.length > 0 || overlays.length > 0) {
            captureData();
        }

        // After animation, clear and reset
        setTimeout(() => {
            setLines([]);
            setOverlays([]);
            setIsSwirling(false);
        }, 1000); // 1s matches animation duration
    };

    const addOverlay = () => {
        const newOverlay = {
            id: uuidv4(),
            x: window.innerWidth / 2 - 100,
            y: window.innerHeight / 2 - 100,
            width: 200,
            height: 200,
            stroke: '#000',
            strokeWidth: 5,
            filterMode: 'normal',
        };
        setOverlays([...overlays, newOverlay]);
    };

    return (
        <div className={`app-container ${isSwirling ? 'swirling' : ''}`}>
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
                    />
                    <DreamCamera onCapture={handleCaptureDream} />

                    <ColorPalette selectedColor={selectedColor} onSelectColor={setSelectedColor} />

                    <button className="clear-btn" onClick={handleClear} aria-label="New Sheet (Swirl)">
                        ×
                    </button>

                    <button className="add-overlay-btn" onClick={addOverlay} aria-label="Add Frame">
                        + Frame
                    </button>
                </>
            )}

            {mode === 'board' && (
                <DreamBoard dreams={dreams} />
            )}

            {mode === 'stream' && (
                <DreamStream dreams={dreams} />
            )}
        </div>
    )
}

export default App;
