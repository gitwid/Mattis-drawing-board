import React, { useRef, useEffect } from 'react';
import { Rect, Circle, Line, Transformer, Group, Text } from 'react-konva';
import { FILTER_MODES } from '../utils/constants';
import GlimpseOverlay from './GlimpseOverlay';

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

    const renderShape = (props) => {
        const type = shapeProps.type || 'rect';
        switch (type) {
            case 'glimpse':
                return (
                    <GlimpseOverlay
                        shapeProps={shapeProps}
                        isSelected={isSelected}
                        onChange={onChange}
                        {...props}
                    />
                );
            case 'circle':
                return <Circle {...props} radius={shapeProps.radius || 100} x={(shapeProps.radius || 100)} y={(shapeProps.radius || 100)} />;
            case 'polygon':
                return <Line {...props} points={shapeProps.points} closed />;
            case 'spline':
                return <Line {...props} points={shapeProps.points} tension={shapeProps.tension || 0.5} closed={shapeProps.closed || false} />;
            case 'rect':
            default:
                return <Rect {...props} width={shapeProps.width} height={shapeProps.height} />;
        }
    };

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
                onClick={(e) => {
                    // If it's an uncaptured glimpse, capture takes precedence over selection
                    if (shapeProps.type === 'glimpse' && !shapeProps.isCaptured) return;
                    onSelect();
                }}
                onTap={(e) => {
                    if (shapeProps.type === 'glimpse' && !shapeProps.isCaptured) return;
                    onSelect();
                }}
                onDblClick={handleDoubleTap}
                onDblTap={handleDoubleTap}
            >
                {/* The Magic Lens Effect */}
                {currentFilter.name !== 'normal' && renderShape({
                    fill: currentFilter.fill,
                    globalCompositeOperation: currentFilter.op,
                    opacity: currentFilter.name === 'emotion' ? 0.5 : 1
                })}

                {/* The Frame Frame */}
                {renderShape({
                    ref: shapeRef,
                    stroke: currentFilter.stroke,
                    strokeWidth: shapeProps.strokeWidth || 5
                })}

                {/* Mode Label (Humorous Hint) */}
                {currentFilter.name !== 'normal' && (
                    <Text
                        text={currentFilter.label}
                        x={shapeProps.type === 'circle' ? shapeProps.radius : 5}
                        y={shapeProps.type === 'circle' ? shapeProps.radius : 5}
                        fontSize={24}
                        fill={currentFilter.stroke}
                        opacity={0.8}
                    />
                )}

                {/* Invisible hit area */}
                {renderShape({
                    fill: "transparent"
                })}
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
                    rotateEnabled={true}
                />
            )}
        </>
    );
};

export default Overlay;
