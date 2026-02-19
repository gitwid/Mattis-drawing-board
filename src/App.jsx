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
    const [hasCameraPermission, setHasCameraPermission] = useState(false);

    // Check for camera permission on mount
    React.useEffect(() => {
        const checkCamera = async () => {
            try {
                // Request access immediately to show/hide the feature
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // We got it, so we can stop it for now
                stream.getTracks().forEach(track => track.stop());
                setHasCameraPermission(true);
            } catch (err) {
                console.log('Camera access denied or not available');
                setHasCameraPermission(false);
            }
        };
        checkCamera();
    }, []);

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

        // Force any uncaptured glimpses to capture themselves
        window.dispatchEvent(new Event('force-glimpse-capture'));

        // Short delay to allow glimpses to update their state if they were just capturing
        setTimeout(() => {
            // Re-check state if needed, but since captureData uses state closure, it needs 
            // the state that INCLUDES the captured image. 
            // Actually, we can use the functional update pattern or just use the current state.
            // But if Glimpse calls onChange synchronously, the next render will have it. Let's wait a tick.
            captureData();
            // Clear canvas after capture to allow fresh drawing
            setLines([]);
            setOverlays([]);
        }, 50);
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

    const addGlimpse = () => {
        const id = uuidv4();
        const w = window.innerWidth;
        const h = window.innerHeight;
        const size = Math.min(w, h, 400) * 0.8;
        const x = w / 2 - size / 2;
        const y = h / 2 - size / 2;

        const types = ['rect', 'circle', 'polygon', 'spline'];
        const type = types[Math.floor(Math.random() * types.length)];

        let shapeData = {
            id,
            x, y,
            width: size,
            height: size,
            type: 'glimpse', // Routing type
            glimpseType: type, // Use the randomized shape
            stroke: '#fff',
            strokeWidth: 2,
            filterMode: 'normal',
            isCaptured: false,
            capturedImage: null
        };

        if (type === 'polygon') {
            const sides = 3 + Math.floor(Math.random() * 4);
            const points = [];
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2;
                points.push(Math.cos(angle) * (size / 2) + (size / 2));
                points.push(Math.sin(angle) * (size / 2) + (size / 2));
            }
            shapeData.points = points;
        } else if (type === 'spline') {
            const steps = 8 + Math.floor(Math.random() * 4);
            const points = [];
            const centerX = size / 2;
            const centerY = size / 2;
            for (let i = 0; i < steps; i++) {
                const angle = (i / steps) * Math.PI * 2;
                const dist = (size / 4) + Math.random() * (size / 4);
                points.push(centerX + Math.cos(angle) * dist);
                points.push(centerY + Math.sin(angle) * dist);
            }
            shapeData.points = points;
            shapeData.tension = 0.8;
            shapeData.closed = true;
        } else if (type === 'circle') {
            shapeData.radius = size / 2;
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

            <div className="build-deployment-info">
                pages-build-deployment #{import.meta.env.VITE_GITHUB_RUN_NUMBER || 'dev'}
            </div>

            {mode === 'draw' && (
                <>
                    <DrawingCanvas
                        lines={lines} setLines={setLines}
                        overlays={overlays} setOverlays={setOverlays}
                        selectedColor={selectedColor}
                        onCapture={handleCaptureDream}
                    />
                    <ColorPalette selectedColor={selectedColor} onSelectColor={setSelectedColor} />

                    <div className="bottom-controls-bar">
                        <div className="button-side left-side">
                            {hasCameraPermission && (
                                <button className="add-glimpse-btn shadow-fab" onClick={addGlimpse} aria-label="Add Glimpse">
                                    + Glimpse
                                </button>
                            )}
                        </div>

                        <DreamCamera onCapture={handleCaptureDream} />

                        <div className="button-side right-side">
                            <button className="add-overlay-btn shadow-fab" onClick={addOverlay} aria-label="Add Frame">
                                + Frame
                            </button>
                        </div>
                    </div>
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
