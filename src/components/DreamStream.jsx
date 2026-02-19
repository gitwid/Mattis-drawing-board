import React, { useState, useEffect } from 'react';
import { Stage, Layer, Line, Text, Rect, Group, Circle } from 'react-konva';
import { FILTER_MODES } from '../utils/constants';
import OverlayShape from './OverlayShape';

const PolyformCharacter = ({ x, y, visible }) => {
    if (!visible) return null;
    return (
        <Group x={x} y={y}>
            <Rect width={30} height={30} fill="#ffd700" rotation={45} shadowBlur={10} />
            <Rect width={20} height={20} x={15} y={-15} fill="#e53935" rotation={20} />
            <Rect width={25} height={25} x={-20} y={10} fill="#039be5" rotation={-10} />
        </Group>
    );
};

const DreamStream = ({ dreams, streamSequence }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [characterPos, setCharacterPos] = useState({ x: -100, y: window.innerHeight / 2 });
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

    const sequence = streamSequence.length > 0 ? streamSequence : dreams.map(d => d.id);

    useEffect(() => {
        if (!isPlaying || sequence.length === 0 || isTransitioning) return;

        const timer = setTimeout(() => {
            triggerTransition();
        }, 4000); // 4 seconds between transitions

        return () => clearTimeout(timer);
    }, [isPlaying, sequence, isTransitioning, currentIndex]);

    const triggerTransition = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        let start = Date.now();
        const duration = 1500; // Slightly slower for better feel
        let swapped = false;

        const animateChar = () => {
            const now = Date.now();
            const p = Math.min((now - start) / duration, 1);

            setCharacterPos({
                x: -100 + (window.innerWidth + 200) * p,
                y: window.innerHeight / 2 + Math.sin(p * Math.PI * 4) * 80
            });

            if (p >= 0.5 && !swapped) {
                // At midpoint, swap the dream exactly once
                setCurrentIndex((prev) => (prev + 1) % sequence.length);
                swapped = true;
            }

            if (p < 1) {
                requestAnimationFrame(animateChar);
            } else {
                setIsTransitioning(false);
                setCharacterPos({ x: -100, y: window.innerHeight / 2 });
            }
        };

        requestAnimationFrame(animateChar);
    };


    if (sequence.length === 0) {
        return (
            <div className="dream-stream-empty">
                <p>Connect boards to start the stream.</p>
            </div>
        );
    }

    const currentDreamId = sequence[currentIndex];
    const currentDream = dreams.find(d => d.id === currentDreamId) || dreams[0];

    return (
        <div className="dream-stream-container">
            <Stage width={stageSize.width} height={stageSize.height}>
                <Layer>
                    <Group opacity={isTransitioning ? 0.6 : 1}>
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

                        {currentDream.overlays && currentDream.overlays.map((overlay) => {
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

                    <PolyformCharacter x={characterPos.x} y={characterPos.y} visible={isTransitioning} />

                    <Text
                        text={`Scene ${currentIndex + 1} / ${sequence.length}`}
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
                <button onClick={triggerTransition} disabled={isTransitioning} style={{ marginLeft: '10px' }}>
                    Next
                </button>
            </div>
        </div>
    );
};

export default DreamStream;
