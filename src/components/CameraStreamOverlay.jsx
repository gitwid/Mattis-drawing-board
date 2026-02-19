import React, { useEffect, useRef, useState } from 'react';

const CameraStreamOverlay = ({ activeGlimpse, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    // Setup Video Stream
    useEffect(() => {
        if (!activeGlimpse || activeGlimpse.isCaptured) return;

        const startVideo = async () => {
            try {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: isMobile ? 'environment' : 'user',
                        width: { ideal: 640 },
                        height: { ideal: 640 }
                    }
                });

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(console.error);
                }
            } catch (err) {
                console.error("HTML Camera Stream error:", err);
            }
        };

        startVideo();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // Only restart stream if glimpse actually fully unmounts/remounts (handled by parent)

    // Global listener for Capture Event
    useEffect(() => {
        const onForceCapture = (e) => {
            const targetId = e.detail; // If triggered by clicking a specific shape
            const shouldCapture = !targetId || targetId === activeGlimpse?.id;

            if (shouldCapture && activeGlimpse && !activeGlimpse.isCaptured && videoRef.current && isReady) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                const vW = video.videoWidth || 640;
                const vH = video.videoHeight || 640;

                canvas.width = vW;
                canvas.height = vH;

                if (!video.videoWidth) {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, vW, vH);
                } else {
                    ctx.drawImage(video, 0, 0, vW, vH);
                }

                const capturedImage = canvas.toDataURL('image/png');
                onCapture(activeGlimpse.id, capturedImage);
            }
        };

        window.addEventListener('force-glimpse-capture', onForceCapture);
        return () => window.removeEventListener('force-glimpse-capture', onForceCapture);
    }, [activeGlimpse, isReady, onCapture]);

    if (!activeGlimpse || activeGlimpse.isCaptured) return null;

    // Derived style to accurately track Konva shape node
    // Konva shape default is x,y at top-left.
    const x = activeGlimpse.x || 0;
    const y = activeGlimpse.y || 0;
    const width = activeGlimpse.width || 200;
    const height = activeGlimpse.height || 200;
    const scaleX = activeGlimpse.scaleX || 1;
    const scaleY = activeGlimpse.scaleY || 1;
    const rotation = activeGlimpse.rotation || 0;

    // Convert Konva points to CSS clip-path polygon
    let clipPath = 'none';
    if (activeGlimpse.glimpseType === 'circle') {
        clipPath = 'circle(50% at 50% 50%)';
    } else if (activeGlimpse.glimpseType === 'polygon' || activeGlimpse.glimpseType === 'spline') {
        if (activeGlimpse.points && activeGlimpse.points.length >= 6) {
            const pts = [];
            // Konva points are relative to x,y usually, wait... For polygon in shape it's drawn with line.
            // If they are local coordinates (which they are, based on addGlimpse doing Math.cos * size/2 + size/2)
            for (let i = 0; i < activeGlimpse.points.length; i += 2) {
                const px = (activeGlimpse.points[i] / width) * 100;
                const py = (activeGlimpse.points[i + 1] / height) * 100;
                pts.push(`${px}% ${py}%`);
            }
            clipPath = `polygon(${pts.join(', ')})`;
        }
    }

    return (
        <>
            <video
                ref={videoRef}
                playsInline
                muted
                onLoadedMetadata={() => setIsReady(true)}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`,
                    transformOrigin: 'top left',
                    objectFit: 'cover',
                    clipPath: clipPath,
                    pointerEvents: 'none', // Critical: Let Konva handle clicks/drags underneath
                    zIndex: 10 // Behind UI controls (like the Camera Button at z-index 100), but over Konva Canvas 
                }}
            />
            {/* Hidden canvas for capturing the video frame pixel data */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
    );
};

export default CameraStreamOverlay;
