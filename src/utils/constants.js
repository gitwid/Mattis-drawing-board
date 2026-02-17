export const COLORS = [
    { name: 'Fire', hex: '#e53935' },
    { name: 'Water', hex: '#039be5' },
    { name: 'Earth', hex: '#43a047' },
    { name: 'Air', hex: '#fdd835' }, // Yellow/Gold
    { name: 'Spirit', hex: '#8e24aa' }, // Purple
    { name: 'Void', hex: '#2c2c2c' }, // Ink/Black
];

export const FILTER_MODES = [
    { name: 'normal', label: '', fill: 'transparent', op: 'source-over', stroke: '#000' },
    { name: 'invert', label: '?', fill: '#fff', op: 'difference', stroke: '#fff' },
    { name: 'emotion', label: '♥', fill: '#f4a460', op: 'multiply', stroke: '#f4a460' }, // Sandy/Warm
    { name: 'interference', label: '⚡', fill: '#00ffeb', op: 'exclusion', stroke: '#00ffeb' }, // Cyan/Glitch
];
