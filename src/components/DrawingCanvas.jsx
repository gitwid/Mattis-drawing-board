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

    const handleMouseUp = (e) => {
        if (!isDrawing.current) return;

        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

        if (startPoint.current) {
            const dist = Math.sqrt(
                Math.pow(point.x - startPoint.current.x, 2) +
                Math.pow(point.y - startPoint.current.y, 2)
            );

            // If a loop was closed, trigger capture
            if (lines[lines.length - 1].points.length > 20 && dist < 30) {
                onCapture();
            }
        }

        isDrawing.current = false;
        startPoint.current = null;
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
