import React, { useState, useEffect, useRef } from 'react';
import { Group, Rect, Image } from 'react-konva';
import useImage from 'use-image';

const GlimpseOverlay = ({ shapeProps, isSelected, onChange }) => {
    const videoRef = useRef(null);
    const [videoElement, setVideoElement] = useState(null);
    const [vignetteColor, setVignetteColor] = useState('rgba(255, 255, 255, 0.5)');
    const frameCount = useRef(0);

    // Shutter sound
    const shutterSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

    useEffect(() => {
        if (shapeProps.isCaptured) return;

        const startVideo = async () => {
            try {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                const constraints = {
                    video: {
                        facingMode: isMobile ? 'environment' : 'user',
                        width: { ideal: 640 },
                        height: { ideal: 640 }
                    }
                };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                setVideoElement(video);
                videoRef.current = video;
            } catch (err) {
                console.error("Glimpse video error:", err);
            }
        };

        startVideo();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [shapeProps.isCaptured]);

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

    const handleCapture = () => {
        if (shapeProps.isCaptured || !videoElement) return;

        const capturedImage = canvas.toDataURL('image/png');

        // Finalize vignette color to context
        const persistentVignette = vignetteColor;

        // Stay in focus for a brief moment (800ms) before transitioning to regular frame
        setTimeout(() => {
            // Stop stream
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }

            onChange({
                ...shapeProps,
                isCaptured: true,
                capturedImage: capturedImage,
                persistentVignette: persistentVignette
            });
        }, 800);
    };

    return (
        <Group
            x={shapeProps.x}
            y={shapeProps.y}
            width={shapeProps.width}
            height={shapeProps.height}
            onClick={handleCapture}
            onTap={handleCapture}
        >
            {/* Video or Captured Image */}
            <Image
                image={shapeProps.isCaptured ? null : videoElement}
                width={shapeProps.width}
                height={shapeProps.height}
                fill={shapeProps.isCaptured ? `url(${shapeProps.capturedImage})` : undefined}
                listening={false}
            />
            {shapeProps.isCaptured && (
                <CapturedFrame
                    imageUrl={shapeProps.capturedImage}
                    width={shapeProps.width}
                    height={shapeProps.height}
                />
            )}

            {/* Vignette / Glow Effect */}
            <Rect
                width={shapeProps.width}
                height={shapeProps.height}
                fillPriority="radial-gradient"
                fillRadialGradientStartPoint={{ x: shapeProps.width / 2, y: shapeProps.height / 2 }}
                fillRadialGradientStartRadius={0}
                fillRadialGradientEndPoint={{ x: shapeProps.width / 2, y: shapeProps.height / 2 }}
                fillRadialGradientEndRadius={shapeProps.width / 0.8}
                fillRadialGradientColorStops={[
                    0, 'rgba(0,0,0,0)',
                    0.7, shapeProps.isCaptured ? shapeProps.persistentVignette : vignetteColor,
                    1, shapeProps.isCaptured ? shapeProps.persistentVignette : vignetteColor
                ]}
                stroke={shapeProps.isCaptured ? '#eee' : '#fff'}
                strokeWidth={2}
                shadowBlur={shapeProps.isCaptured ? 0 : 20}
                shadowColor={vignetteColor}
                listening={false}
            />
        </Group>
    );
};

const CapturedFrame = ({ imageUrl, width, height }) => {
    const [img] = useImage(imageUrl);
    return <Image image={img} width={width} height={height} />;
};

export default GlimpseOverlay;
