import React from 'react';
import { COLORS } from '../utils/constants';

const ColorPalette = ({ selectedColor, onSelectColor }) => {
    return (
        <div className="color-palette">
            {COLORS.map((color) => (
                <button
                    key={color.name}
                    className={`color-pot ${selectedColor === color.hex ? 'selected' : ''}`}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => onSelectColor(color.hex)}
                    aria-label={color.name}
                    title={color.name}
                />
            ))}
        </div>
    );
};

export default ColorPalette;
