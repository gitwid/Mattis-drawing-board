import React, { useRef, useEffect, useState } from 'react';
import { Group, Rect, Image, Circle, Line } from 'react-konva';
import useImage from 'use-image';

const GlimpseOverlay = ({ shapeProps, isSelected, onChange }) => {
    const frameCount = useRef(0);
    const [vignetteColor, setVignetteColor] = useState('rgba(255, 255, 255, 0.5)');

    // Oscillating vignette effect
    useEffect(() => {
        if (shapeProps.isCaptured) return;

        let animationId;
        const animate = () => {
            frameCount.current += 1;
            const t = (Math.sin(frameCount.current * 0.05) + 1) / 2; // 0 to 1

            // Colors: Warm White (255,250,240), Soft Blue (200,220,255), Context (255,215,0)
            const r = Math.floor(255 * (1 - t) + 200 * t);
            const g = Math.floor(250 * (1 - t) + 220 * t);
            const b = Math.floor(240 * (1 - t) + 255 * t);

            setVignetteColor(`rgba(${r}, ${g}, ${b}, ${0.3 + 0.2 * Math.sin(frameCount.current * 0.02)})`);
            animationId = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(animationId);
    }, [shapeProps.isCaptured]);

    const getClipFunc = (ctx) => {
        const type = shapeProps.glimpseType || 'rect';
        const w = shapeProps.width;
        const h = shapeProps.height;

        if (type === 'circle') {
            ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2, false);
        } else if (type === 'rect') {
            ctx.rect(0, 0, w, h);
        } else if (shapeProps.points) {
            const points = shapeProps.points;
            ctx.moveTo(points[0], points[1]);
            for (let i = 2; i < points.length; i += 2) {
                ctx.lineTo(points[i], points[i + 1]);
            }
            ctx.closePath();
        }
    };

    const renderShapeVignette = (props) => {
        const type = shapeProps.glimpseType || 'rect';
        const commonProps = {
            ...props,
            fillPriority: "radial-gradient",
            fillRadialGradientStartPoint: { x: shapeProps.width / 2, y: shapeProps.height / 2 },
            fillRadialGradientStartRadius: 0,
            fillRadialGradientEndPoint: { x: shapeProps.width / 2, y: shapeProps.height / 2 },
            fillRadialGradientEndRadius: shapeProps.width / 0.8,
            fillRadialGradientColorStops: [
                0, 'rgba(0,0,0,0)',
                0.7, shapeProps.isCaptured ? shapeProps.persistentVignette : vignetteColor,
                1, shapeProps.isCaptured ? shapeProps.persistentVignette : vignetteColor
            ],
            stroke: shapeProps.isCaptured ? '#eee' : '#fff',
            strokeWidth: 2,
            shadowBlur: shapeProps.isCaptured ? 0 : 20,
            shadowColor: vignetteColor,
            listening: true // Provide a stable hit area to the group
        };

        switch (type) {
            case 'circle':
                return <Circle {...commonProps} radius={shapeProps.width / 2} x={shapeProps.width / 2} y={shapeProps.height / 2} />;
            case 'polygon':
            case 'spline':
                return <Line {...commonProps} points={shapeProps.points} tension={type === 'spline' ? 0.8 : 0} closed />;
            case 'rect':
            default:
                return <Rect {...commonProps} width={shapeProps.width} height={shapeProps.height} />;
        }
    };

    return (
        <Group
            width={shapeProps.width}
            height={shapeProps.height}
            onClick={() => {
                if (!shapeProps.isCaptured) {
                    window.dispatchEvent(new CustomEvent('force-glimpse-capture', { detail: shapeProps.id }));
                }
            }}
            onTap={() => {
                if (!shapeProps.isCaptured) {
                    window.dispatchEvent(new CustomEvent('force-glimpse-capture', { detail: shapeProps.id }));
                }
            }}
        >
            {/* Captured Image (Video feed is handled by external HTML overlay) */}
            {shapeProps.isCaptured && (
                <Group clipFunc={getClipFunc} listening={false}>
                    <CapturedFrame
                        imageUrl={shapeProps.capturedImage}
                        width={shapeProps.width}
                        height={shapeProps.height}
                    />
                </Group>
            )}

            {/* Vignette / Glow Effect - This also acts as the hit area */}
            {renderShapeVignette({ listening: true })}
        </Group>
    );
};

const CapturedFrame = ({ imageUrl, width, height }) => {
    const [img] = useImage(imageUrl);
    return <Image image={img} width={width} height={height} listening={false} />;
};

export default GlimpseOverlay;
