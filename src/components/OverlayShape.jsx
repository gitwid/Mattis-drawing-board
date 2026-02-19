import React from 'react';
import { Line, Rect, Circle } from 'react-konva';

/**
 * Reusable component to render different dream overlay shapes.
 */
const OverlayShape = ({ overlay, ...props }) => {
    const type = overlay.type || 'rect';

    switch (type) {
        case 'circle':
            return (
                <Circle
                    {...props}
                    radius={overlay.radius || 100}
                    x={overlay.radius || 100}
                    y={overlay.radius || 100}
                />
            );
        case 'polygon':
            return <Line {...props} points={overlay.points} closed />;
        case 'spline':
            return (
                <Line
                    {...props}
                    points={overlay.points}
                    tension={overlay.tension || 0.5}
                    closed={overlay.closed || false}
                />
            );
        case 'rect':
        default:
            return <Rect {...props} width={overlay.width} height={overlay.height} />;
    }
};

export default OverlayShape;
