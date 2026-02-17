import React, { useRef, useEffect } from 'react';
import { Rect, Transformer, Group, Text } from 'react-konva';
import { FILTER_MODES } from '../utils/constants';

const Overlay = ({ shapeProps, isSelected, onSelect, onChange }) => {
    const shapeRef = useRef();
    const trRef = useRef();

    useEffect(() => {
        if (isSelected && trRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    const handleDoubleTap = () => {
        // Cycle through modes
        const currentModeIndex = FILTER_MODES.findIndex(m => m.name === (shapeProps.filterMode || 'normal'));
        const nextModeIndex = (currentModeIndex + 1) % FILTER_MODES.length;
        const nextMode = FILTER_MODES[nextModeIndex];

        onChange({
            ...shapeProps,
            filterMode: nextMode.name
        });
    };

    const currentFilter = FILTER_MODES.find(m => m.name === (shapeProps.filterMode || 'normal')) || FILTER_MODES[0];

    return (
        <>
            <Group
                draggable
                x={shapeProps.x}
                y={shapeProps.y}
                onDragEnd={(e) => {
                    onChange({
                        ...shapeProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onClick={onSelect}
                onTap={onSelect}
                onDblClick={handleDoubleTap}
                onDblTap={handleDoubleTap}
            >
                {/* The Magic Lens Effect */}
                {currentFilter.name !== 'normal' && (
                    <Rect
                        width={shapeProps.width}
                        height={shapeProps.height}
                        fill={currentFilter.fill}
                        globalCompositeOperation={currentFilter.op}
                        opacity={currentFilter.name === 'emotion' ? 0.5 : 1}
                    />
                )}

                {/* The Frame Frame */}
                <Rect
                    ref={shapeRef}
                    width={shapeProps.width}
                    height={shapeProps.height}
                    stroke={currentFilter.stroke}
                    strokeWidth={shapeProps.strokeWidth || 5}
                />

                {/* Mode Label (Humorous Hint) */}
                {currentFilter.name !== 'normal' && (
                    <Text
                        text={currentFilter.label}
                        x={5}
                        y={5}
                        fontSize={24}
                        fill={currentFilter.stroke}
                        opacity={0.8}
                    />
                )}

                {/* Invisible hit area */}
                <Rect
                    width={shapeProps.width}
                    height={shapeProps.height}
                    fill="transparent"
                />
            </Group>

            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                    rotateEnabled={false}
                />
            )}
        </>
    );
};

export default Overlay;
