import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Overlay from './Overlay';

const DrawingCanvas = ({ lines, setLines, overlays, setOverlays, selectedColor, onCapture }) => {
    const [stageSize, setStageSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [selectedOverlayId, setSelectedOverlayId] = useState(null);
    const isDrawing = useRef(false);
    const startPoint = useRef(null);

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
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            setSelectedOverlayId(null);

            isDrawing.current = true;
            const pos = e.target.getStage().getPointerPosition();
            startPoint.current = pos;

            setLines(prevLines => [...prevLines, {
                tool: 'pen',
                points: [pos.x, pos.y],
                color: selectedColor,
                strokeWidth: 5
            }]);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing.current) {
            return;
        }
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

        setLines(prevLines => {
            if (prevLines.length === 0) return prevLines;

            const newLines = [...prevLines];
            const lastLineIndex = newLines.length - 1;
            const lastLine = { ...newLines[lastLineIndex] };

            lastLine.points = lastLine.points.concat([point.x, point.y]);
            newLines[lastLineIndex] = lastLine;

            return newLines;
        });

        // Check for lasso-loop closure
        if (startPoint.current && lines.length > 0) {
            const dist = Math.sqrt(
                Math.pow(point.x - startPoint.current.x, 2) +
                Math.pow(point.y - startPoint.current.y, 2)
            );

            // If the line is long enough and we return to start
            if (lines[lines.length - 1].points.length > 20 && dist < 15) {
                // Flash or some feedback could go here
            }
        }
    };

    const [isSwirling, setIsSwirling] = useState(false);

    const handleMouseUp = (e) => {
        if (!isDrawing.current) return;

        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

        if (startPoint.current) {
            const dist = Math.sqrt(
                Math.pow(point.x - startPoint.current.x, 2) +
                Math.pow(point.y - startPoint.current.y, 2)
            );

            // If a loop was closed, trigger swirl animation then capture
            if (lines.length > 0 && lines[lines.length - 1].points.length > 20 && dist < 35) {
                triggerSwirl();
                return;
            }
        }

        isDrawing.current = false;
        startPoint.current = null;
    };

    const triggerSwirl = () => {
        setIsSwirling(true);
        isDrawing.current = false;

        // Calculate center of the lasso (average position)
        const lastLine = lines[lines.length - 1];
        let sumX = 0, sumY = 0;
        for (let i = 0; i < lastLine.points.length; i += 2) {
            sumX += lastLine.points[i];
            sumY += lastLine.points[i + 1];
        }
        const centerX = sumX / (lastLine.points.length / 2);
        const centerY = sumY / (lastLine.points.length / 2);

        let start = Date.now();
        const duration = 800;

        const animateSwirl = () => {
            const now = Date.now();
            const p = Math.min((now - start) / duration, 1);

            // Transform all lines points towards center with a spiral
            setLines(prevLines => prevLines.map(line => {
                const newPoints = [];
                for (let i = 0; i < line.points.length; i += 2) {
                    const x = line.points[i];
                    const y = line.points[i + 1];

                    const dx = x - centerX;
                    const dy = y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);

                    // Spiral: rotate and move towards center
                    const spiralAngle = angle + p * Math.PI * 2;
                    const newDist = dist * (1 - p);

                    newPoints.push(centerX + Math.cos(spiralAngle) * newDist);
                    newPoints.push(centerY + Math.sin(spiralAngle) * newDist);
                }
                return { ...line, points: newPoints };
            }));

            if (p < 1) {
                requestAnimationFrame(animateSwirl);
            } else {
                setIsSwirling(false);
                startPoint.current = null;
                // Wait a tiny bit for the visual to vanish
                setTimeout(() => {
                    onCapture();
                }, 100);
            }
        };

        requestAnimationFrame(animateSwirl);
    };

    const handleOverlayChange = (newAttrs, i) => {
        const newOverlays = [...overlays];
        newOverlays[i] = newAttrs;
        setOverlays(newOverlays);
    };

    return (
        <div className="drawing-canvas-container">
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            >
                <Layer>
                    {lines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke={line.color}
                            strokeWidth={line.strokeWidth}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation={
                                line.tool === 'eraser' ? 'destination-out' : 'source-over'
                            }
                        />
                    ))}

                    {overlays && overlays.map((rect, i) => (
                        <Overlay
                            key={rect.id}
                            shapeProps={rect}
                            isSelected={rect.id === selectedOverlayId}
                            onSelect={() => {
                                setSelectedOverlayId(rect.id);
                            }}
                            onChange={(newAttrs) => handleOverlayChange(newAttrs, i)}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
};

export default DrawingCanvas;
