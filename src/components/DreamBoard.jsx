import React, { useState, useEffect } from 'react';
import { Stage, Layer, Line, Group, Rect, Text, Circle } from 'react-konva';
import { FILTER_MODES } from '../utils/constants';

const DreamBoard = ({ dreams, metaPaths, setMetaPaths, setStreamSequence }) => {
    const [stageSize, setStageSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [isDrawing, setIsDrawing] = useState(false);
    const stageRef = React.useRef(null);

    const renderOverlayShape = (overlay, props) => {
        const type = overlay.type || 'rect';
        switch (type) {
            case 'circle':
                return <Circle {...props} radius={overlay.radius || 100} x={(overlay.radius || 100)} y={(overlay.radius || 100)} />;
            case 'polygon':
                return <Line {...props} points={overlay.points} closed />;
            case 'spline':
                return <Line {...props} points={overlay.points} tension={overlay.tension || 0.5} closed={false} />;
            case 'rect':
            default:
                return <Rect {...props} width={overlay.width} height={overlay.height} />;
        }
    };

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

    // Simple grid layout logic
    const COLS = 3;
    const MARGIN = 40;
    const TILE_WIDTH = (stageSize.width - MARGIN * (COLS + 1)) / COLS;
    const SCALE = TILE_WIDTH / window.innerWidth;
    const TILE_HEIGHT = window.innerHeight * SCALE;

    const handleMouseDown = (e) => {
        // Only draw if we're not dragging the stage (or maybe middle click for drag)
        // For simplicity, let's say drawing starts if we touch/click
        setIsDrawing(true);
        const pos = e.target.getStage().getPointerPosition();
        // Convert to absolute coordinates relative to stage layer
        const stage = e.target.getStage();
        const transform = stage.getAbsoluteTransform().copy().invert();
        const pt = transform.point(pos);

        setMetaPaths([...metaPaths, { points: [pt.x, pt.y] }]);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        const transform = stage.getAbsoluteTransform().copy().invert();
        const pt = transform.point(pos);

        const lastPath = metaPaths[metaPaths.length - 1];
        const newPoints = [...lastPath.points, pt.x, pt.y];

        const newPaths = [...metaPaths];
        newPaths[metaPaths.length - 1] = { ...lastPath, points: newPoints };
        setMetaPaths(newPaths);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        updateSequence();
    };

    const updateSequence = () => {
        // Calculate which dreams are touched by the paths
        const sequenceSet = new Set();
        const orderedSequence = [];

        metaPaths.forEach(path => {
            const points = path.points;
            for (let i = 0; i < points.length; i += 2) {
                const px = points[i];
                const py = points[i + 1];

                dreams.forEach((dream, dreamIndex) => {
                    const col = dreamIndex % COLS;
                    const row = Math.floor(dreamIndex / COLS);
                    const dx = MARGIN + col * (TILE_WIDTH + MARGIN);
                    const dy = MARGIN + row * (TILE_HEIGHT + MARGIN);

                    if (px >= dx && px <= dx + TILE_WIDTH && py >= dy && py <= dy + TILE_HEIGHT) {
                        if (!sequenceSet.has(dream.id)) {
                            sequenceSet.add(dream.id);
                            orderedSequence.push(dream.id);
                        }
                    }
                });
            }
        });

        setStreamSequence(orderedSequence);
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
                ref={stageRef}
            >
                <Layer>
                    <Rect width={stageSize.width * 2} height={stageSize.height * 2} x={-stageSize.width} y={-stageSize.height} fill="#fdfaf6" />

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

                    {dreams.map((dream, index) => {
                        const col = index % COLS;
                        const row = Math.floor(index / COLS);
                        const x = MARGIN + col * (TILE_WIDTH + MARGIN);
                        const y = MARGIN + row * (TILE_HEIGHT + MARGIN);

                        return (
                            <Group
                                key={dream.id}
                                x={x}
                                y={y}
                                scaleX={SCALE}
                                scaleY={SCALE}
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
                                            {filter.name !== 'normal' && renderOverlayShape(overlay, {
                                                fill: filter.fill,
                                                globalCompositeOperation: filter.op,
                                                opacity: filter.name === 'emotion' ? 0.5 : 1
                                            })}
                                            {renderOverlayShape(overlay, {
                                                stroke: filter.stroke,
                                                strokeWidth: overlay.strokeWidth || 5
                                            })}
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

            <div className="board-instructions">
                Connect the boards with the Pen of Connectivity to build your Dream Stream.
            </div>

            <button className="clear-board-btn" onClick={() => { setMetaPaths([]); setStreamSequence([]); }}>
                Reset Flow
            </button>
        </div>
    );
};

export default DreamBoard;
