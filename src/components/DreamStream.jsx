import React, { useState, useEffect } from 'react';
import { Stage, Layer, Line, Text, Rect, Group } from 'react-konva';
import { FILTER_MODES } from '../utils/constants';

const DreamStream = ({ dreams }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
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

    useEffect(() => {
        if (!isPlaying || dreams.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % dreams.length);
        }, 2000); // 2 seconds per frame

        return () => clearInterval(interval);
    }, [isPlaying, dreams]);

    if (dreams.length === 0) {
        return (
            <div className="dream-stream-empty">
                <p>No dreams to stream yet.</p>
            </div>
        );
    }

    const currentDream = dreams[currentIndex];

    return (
        <div className="dream-stream-container">
            <Stage
                width={stageSize.width}
                height={stageSize.height}
            >
                <Layer>
                    {/* The Dream Drawing */}
                    {currentDream.lines.map((line, i) => (
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
                    {currentDream.overlays && currentDream.overlays.map((overlay) => {
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

                    {/* Simple Overlay UI for controls */}
                    <Text
                        text={`${currentIndex + 1} / ${dreams.length}`}
                        x={20}
                        y={stageSize.height - 40}
                        fontSize={16}
                        fill="#aaa"
                    />
                </Layer>
            </Stage>

            <div className="stream-controls">
                <button onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
            </div>
        </div>
    );
};

export default DreamStream;
