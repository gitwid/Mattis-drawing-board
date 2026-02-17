import React, { useState, useEffect } from 'react';
import { Stage, Layer, Line, Group, Rect, Text } from 'react-konva';
import { FILTER_MODES } from '../utils/constants';

const DreamBoard = ({ dreams }) => {
    const [stageSize, setStageSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

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
    const MARGIN = 20;
    const TILE_WIDTH = (stageSize.width - MARGIN * (COLS + 1)) / COLS;
    const SCALE = TILE_WIDTH / window.innerWidth; // Scale factor based on original screen width
    const TILE_HEIGHT = window.innerHeight * SCALE;

    return (
        <div className="dream-board-container">
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                draggable // Allow panning the board
            >
                <Layer>
                    {/* Background for the board */}
                    <Rect width={stageSize.width} height={stageSize.height} fill="#fdfaf6" />

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
                                clipX={0} clipY={0} clipWidth={window.innerWidth} clipHeight={window.innerHeight} // Clip to frame
                            >
                                {/* Frame background */}
                                <Rect
                                    width={window.innerWidth}
                                    height={window.innerHeight}
                                    fill="#fff"
                                    stroke="#e0e0e0"
                                    strokeWidth={5 / SCALE} // Maintain visible border
                                    shadowBlur={10}
                                    shadowOpacity={0.1}
                                />

                                {/* The Dream Drawing */}
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
                                        <Group key={overlay.id}>
                                            {/* Magic Lens Effect */}
                                            {filter.name !== 'normal' && (
                                                <Rect
                                                    x={overlay.x}
                                                    y={overlay.y}
                                                    width={overlay.width}
                                                    height={overlay.height}
                                                    fill={filter.fill}
                                                    globalCompositeOperation={filter.op}
                                                    opacity={filter.name === 'emotion' ? 0.5 : 1}
                                                />
                                            )}
                                            {/* Frame Frame */}
                                            <Rect
                                                x={overlay.x}
                                                y={overlay.y}
                                                width={overlay.width}
                                                height={overlay.height}
                                                stroke={filter.stroke}
                                                strokeWidth={overlay.strokeWidth || 5}
                                            />
                                        </Group>
                                    );
                                })}
                            </Group>
                        );
                    })}
                </Layer>
            </Stage>
        </div>
    );
};

export default DreamBoard;
