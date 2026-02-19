import React, { useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Group, Rect, Text, Circle } from 'react-konva';
import { FILTER_MODES } from '../utils/constants';
import OverlayShape from './OverlayShape';

const DreamBoard = ({ dreams, setDreams, metaPaths, setMetaPaths, setStreamSequence }) => {
    const [stageSize, setStageSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [isDrawing, setIsDrawing] = useState(false);
    const [interactionMode, setInteractionMode] = useState('move'); // 'move' or 'connect'
    const stageRef = React.useRef(null);

    // Simple grid layout logic for background/reference if needed
    const COLS = 3;
    const MARGIN = 40;
    const TILE_WIDTH = (stageSize.width - MARGIN * (COLS + 1)) / COLS;
    const SCALE = TILE_WIDTH / window.innerWidth;
    const TILE_HEIGHT = window.innerHeight * SCALE;

    useEffect(() => {
        const handleResize = () => {
            setStageSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMouseDown = (e) => {
        if (interactionMode !== 'connect') return;
        setIsDrawing(true);
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        const transform = stage.getAbsoluteTransform().copy().invert();
        const pt = transform.point(pos);

        setMetaPaths(prev => [...prev, { points: [pt.x, pt.y] }]);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || interactionMode !== 'connect') return;
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return;

        const transform = stage.getAbsoluteTransform().copy().invert();
        const pt = transform.point(pos);

        setMetaPaths(prev => {
            if (prev.length === 0) return prev;
            const lastPath = prev[prev.length - 1];
            const newPoints = [...lastPath.points, pt.x, pt.y];
            const newPaths = [...prev];
            newPaths[prev.length - 1] = { ...lastPath, points: newPoints };
            return newPaths;
        });
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const updateSequence = useCallback(() => {
        const sequenceSet = new Set();
        const orderedSequence = [];

        metaPaths.forEach(path => {
            const points = path.points;
            for (let i = 0; i < points.length; i += 2) {
                const px = points[i];
                const py = points[i + 1];

                dreams.forEach((dream) => {
                    const x = dream.x || 0;
                    const y = dream.y || 0;

                    // Hit detection: Check if the Pen path tip is inside a board
                    // TILE_WIDTH and TILE_HEIGHT represent the scaled board size
                    if (px >= x - 5 && px <= x + TILE_WIDTH + 5 &&
                        py >= y - 5 && py <= y + TILE_HEIGHT + 5) {
                        if (!sequenceSet.has(dream.id)) {
                            sequenceSet.add(dream.id);
                            orderedSequence.push(dream.id);
                        }
                    }
                });
            }
        });

        if (orderedSequence.length > 0) {
            setStreamSequence(orderedSequence);
        }
    }, [dreams, metaPaths, TILE_WIDTH, TILE_HEIGHT, setStreamSequence]);

    // Reactively update the sequence whenever the boards move or the connections change
    useEffect(() => {
        updateSequence();
    }, [dreams, metaPaths, updateSequence]);

    const handleDragEnd = (e, id) => {
        const newX = e.target.x();
        const newY = e.target.y();
        setDreams(prev => prev.map(d => d.id === id ? { ...d, x: newX, y: newY } : d));
    };

    return (
        <div className="dream-board-container">
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                draggable={!isDrawing}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                ref={stageRef}
            >
                <Layer>
                    {/* The Background */}
                    <Rect width={stageSize.width * 5} height={stageSize.height * 5} x={-stageSize.width * 2} y={-stageSize.height * 2} fill="#fdfaf6" />

                    {dreams.length === 0 && (
                        <Text
                            text="Capture your dreams to see them here."
                            x={stageSize.width / 2}
                            y={stageSize.height / 2}
                            offsetX={150}
                            fontSize={20}
                            fill="#aaa"
                        />
                    )}

                    {dreams.map((dream) => {
                        return (
                            <Group
                                key={dream.id}
                                x={dream.x}
                                y={dream.y}
                                scaleX={SCALE}
                                scaleY={SCALE}
                                draggable={interactionMode === 'move'}
                                onDragEnd={(e) => handleDragEnd(e, dream.id)}
                                clipX={0} clipY={0} clipWidth={window.innerWidth} clipHeight={window.innerHeight}
                            >
                                <Rect
                                    width={window.innerWidth}
                                    height={window.innerHeight}
                                    fill="#fff"
                                    stroke="#e0e0e0"
                                    strokeWidth={2 / SCALE}
                                    shadowBlur={10}
                                    shadowOpacity={0.05}
                                />
                                {dream.lines.map((line, i) => (
                                    <Line
                                        key={i}
                                        points={line.points}
                                        stroke={line.color}
                                        strokeWidth={line.strokeWidth}
                                        tension={0.5}
                                        lineCap="round"
                                        lineJoin="round"
                                    />
                                ))}
                                {/* The Overlays */}
                                {dream.overlays && dream.overlays.map((overlay) => {
                                    const filter = FILTER_MODES.find(m => m.name === (overlay.filterMode || 'normal')) || FILTER_MODES[0];
                                    return (
                                        <Group key={overlay.id} x={overlay.x} y={overlay.y}>
                                            {filter.name !== 'normal' && (
                                                <OverlayShape
                                                    overlay={overlay}
                                                    fill={filter.fill}
                                                    globalCompositeOperation={filter.op}
                                                    opacity={filter.name === 'emotion' ? 0.5 : 1}
                                                />
                                            )}
                                            <OverlayShape
                                                overlay={overlay}
                                                stroke={filter.stroke}
                                                strokeWidth={overlay.strokeWidth || 5}
                                            />
                                        </Group>
                                    );
                                })}
                            </Group>
                        );
                    })}

                    {/* The Pen of Connectivity */}
                    {metaPaths.map((path, i) => (
                        <Line
                            key={i}
                            points={path.points}
                            stroke="#ffd700" // Golden Connectivity
                            strokeWidth={3}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            shadowBlur={10}
                            shadowColor="#ffd700"
                        />
                    ))}
                </Layer>
            </Stage>

            <div className="board-instructions mobile-bottom">
                {interactionMode === 'move' ? 'Position your boards.' : 'Connect the boards with the Pen of Connectivity.'}
            </div>

            <div className="board-controls">
                <button
                    className={`interaction-toggle-btn ${interactionMode === 'connect' ? 'active' : ''}`}
                    onClick={() => setInteractionMode(interactionMode === 'move' ? 'connect' : 'move')}
                    title={interactionMode === 'move' ? 'Switch to Connect' : 'Switch to Move'}
                >
                    {interactionMode === 'move' ? '🖊️' : '🤚'}
                </button>

                <button className="clear-board-btn-v2" onClick={() => { setMetaPaths([]); setStreamSequence([]); }}>
                    Reset Flow
                </button>
            </div>
        </div>
    );
};

export default DreamBoard;
