# Matti's Drawing Board

A minimalist, interactive drawing application designed with a "dream" capture system and "Gorogoa-style" spatial overlays.

## Features

- **🎨 Free-hand Drawing**: Smooth, responsive drawing engine optimized for both stylus and touch.
- **✨ Elemental Color Pots**: Palette inspired by basic elements: Fire, Water, Earth, Air, Spirit, and Void.
- **📸 Dream Capture**: Snapshot your creations instantly. Take any canvas state and save it to your spatial collection.
- **🖼️ spatial Dream Board**: A grid view of all captured "dreams," allowing you to see your creative progression in one view.
- **🔄 Dream Stream**: An automated, sequential playback of your dreams to relive the sequence of your work.
- **🌀 Swirl & Save**: A magical "clear" animation that swirls your current work away as it saves it to the sequencer.
- **🪟 Logic Gate Overlays**: Draggable, resizable frames that act as "lenses" or "portals," changing the meaning of what's beneath them:
    - **Invert**: Flips the color logic.
    - **Emotion**: Warm, soft, nostalgic filter.
    - **Interference**: Glitchy, exclusion-based "logic gate."

## Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Canvas Engine**: [react-konva](https://konvajs.org/docs/react/index.html)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Minimalist & Accessible)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gitwid/Mattis-drawing-board.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Mattis-drawing-board
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Accessing on Network
To access the board from another device on the same network:
```bash
npm run dev -- --host
```

## How to Use

1. **Draw**: Click and drag on the main canvas.
2. **Colors**: Use the elemental pots on the right to switch brushes.
3. **Frames**: Add a "Logic Gate" using the **+ Frame** button. Move and resize it to highlight areas of your drawing.
4. **Transform**: Double-click any frame to cycle through logic filters.
5. **Capture**: Click the Camera icon to save your current view to the Dream Board.
6. **Clear**: Click the **×** button to trigger the swirl animation and start fresh.

---
*Created with love for Matti's creative journey.*
