# DankedIn - Slither.io LinkedIn Style

A web-based snake game inspired by slither.io with a LinkedIn theme. Control your snake (with a LinkedIn profile picture as the head) around the game area, eat likes and smaller snakes to grow, and avoid hitting other snakes' bodies!

## Features

- **LinkedIn-themed gameplay**: Your snake head looks like a LinkedIn profile picture
- **Eat likes**: Collect LinkedIn "likes" scattered around the map to grow
- **AI opponents**: Compete against AI-controlled snakes that will eat likes and chase you
- **Collision mechanics**: If your head hits another snake's body, you die and turn into a pile of likes
- **Growth system**: Your snake grows longer as you eat likes and smaller snakes
- **iPhone frame**: Beautiful iPhone-style rectangle frame with rounded corners

## How to Play

1. Open `index.html` in a web browser
2. Move your mouse (or touch on mobile) to control your snake's direction
3. Eat the blue "likes" scattered around to grow longer
4. Avoid hitting other snakes' bodies - you'll die!
5. Try to eat smaller snakes to grow even bigger
6. The longer you get, the higher your score

## Game Mechanics

- **Movement**: Your snake continuously moves in the direction of your cursor/touch
- **Food**: Eat "likes" (blue thumbs-up icons) to grow your tail
- **AI Snakes**: Computer-controlled snakes that:
  - Eat likes to grow
  - Chase you if they're larger than you
  - Flee from larger snakes
  - Respawn after dying
  
- **Death**: When a snake's head hits another snake's body:
  - The snake dies
  - It disintegrates into a pile of likes proportional to its length
  - Other snakes can eat these likes to grow

## Installation

No installation required! Just open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge).

## Files

- `index.html` - Main HTML structure
- `style.css` - Styling with iPhone frame design
- `game.js` - Core game logic and mechanics
- `README.md` - This file

## Browser Support

Works on all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript features
- CSS3 features

Enjoy playing DankedIn!

