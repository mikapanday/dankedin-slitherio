// Game Configuration
const CONFIG = {
    FPS: 60,
    FOOD_COUNT: 150,  // Increased density of likes on the ground
    AI_SNAKE_COUNT: 15,  // Increased spawn rate
    MIN_AI_SNAKE_LENGTH: 1,
    MAX_AI_SNAKE_LENGTH: 200,
    SNAKE_SPEED: 2,
    AI_SPEED: 1.5,
    INVINCIBILITY_DURATION: 3000,  // 3 seconds of invincibility for player
    FOOD_SIZE: 12,  // Base size (will be randomized per food)
    FOOD_SIZE_MIN: 10,  // Minimum random size
    FOOD_SIZE_MAX: 20,  // Maximum random size
    SNAKE_SEGMENT_SIZE: 23,  // 90% larger (12 * 1.9)
    HEAD_SIZE: 30,  // 90% larger (16 * 1.9)
    COLLISION_DISTANCE: 19,  // 90% larger (10 * 1.9)
    WORLD_WIDTH: 5000,  // Large world space
    WORLD_HEIGHT: 5000,
};

// Canvas Setup
let canvas;
let ctx;
let overlay;
let startOverlay;
let scoreElement;

function initializeCanvas() {
    canvas = document.getElementById('gameCanvas');
    overlay = document.getElementById('gameOverlay');
    startOverlay = document.getElementById('startOverlay');
    scoreElement = document.getElementById('score');
    
    if (!canvas) {
        console.error('Canvas element not found!');
        return false;
    }
    
    if (!overlay) {
        console.error('Game overlay element not found!');
        return false;
    }
    
    if (!startOverlay) {
        console.error('Start overlay element not found!');
        return false;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2d context!');
        return false;
    }
    
    return true;
}

// Camera System
const camera = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    
    update(playerX, playerY) {
        // Center camera on player
        this.x = playerX - this.width / 2;
        this.y = playerY - this.height / 2;
        
        // Clamp camera to world bounds
        this.x = Math.max(0, Math.min(CONFIG.WORLD_WIDTH - this.width, this.x));
        this.y = Math.max(0, Math.min(CONFIG.WORLD_HEIGHT - this.height, this.y));
    },
    
    // Convert world coordinates to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    },
    
    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    },
    
    // Check if a world position is visible on screen
    isVisible(worldX, worldY, radius = 0) {
        return worldX + radius >= this.x &&
               worldX - radius <= this.x + this.width &&
               worldY + radius >= this.y &&
               worldY - radius <= this.y + this.height;
    }
};

// Update camera dimensions
function updateCameraSize() {
    if (canvas) {
        camera.width = canvas.width;
        camera.height = canvas.height;
    }
}

function resizeCanvas() {
    if (!canvas) return;
    
    const header = document.querySelector('.game-header');
    if (!header) return;
    
    const headerHeight = header.offsetHeight;
    const width = canvas.offsetWidth || 359;
    const height = (canvas.offsetHeight || 700) - headerHeight;
    
    canvas.width = width;
    canvas.height = height;
    
    updateCameraSize();
}

updateCameraSize();

// Utility Functions
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function randomColor() {
    const colors = [
        '#0077b5', // LinkedIn blue
        '#ff4500', // Orange
        '#32cd32', // Green
        '#ff1493', // Pink
        '#9400d3', // Purple
        '#ffd700', // Gold
        '#00ced1', // Turquoise
        '#ff6347', // Tomato
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function randomName() {
    const names = [
        'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams',
        'Alex Brown', 'Emily Davis', 'Chris Miller', 'Lisa Wilson',
        'David Lee', 'Amy Chen', 'Ryan Taylor', 'Jessica Martinez',
        'Kevin Anderson', 'Michelle Garcia', 'Daniel Rodriguez', 'Ashley Martinez',
    ];
    return names[Math.floor(Math.random() * names.length)];
}

// Food (Likes) Class
class Food {
    constructor(x = null, y = null) {
        this.x = x !== null ? x : Math.random() * CONFIG.WORLD_WIDTH;
        this.y = y !== null ? y : Math.random() * CONFIG.WORLD_HEIGHT;
        // Random size between min and max
        this.size = CONFIG.FOOD_SIZE_MIN + Math.random() * (CONFIG.FOOD_SIZE_MAX - CONFIG.FOOD_SIZE_MIN);
        this.pulse = 0;
    }

    draw() {
        // Only draw if visible on screen
        if (!camera.isVisible(this.x, this.y, this.size)) return;
        
        const screenPos = camera.worldToScreen(this.x, this.y);
        this.pulse += 0.1;
        const pulseSize = this.size + Math.sin(this.pulse) * 2;
        
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        
        // Try to use image if available
        if (likeButtonImage && likeButtonImage.complete && likeButtonImage.naturalWidth > 0) {
            // Draw image
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0, 119, 181, 0.3)';
            
            const imageSize = pulseSize;
            ctx.drawImage(
                likeButtonImage,
                -imageSize / 2,
                -imageSize / 2,
                imageSize,
                imageSize
            );
            
            ctx.shadowBlur = 0;
        } else {
            // Fallback: Draw LinkedIn thumbs-up like button
            const scale = pulseSize / CONFIG.FOOD_SIZE;
            
            // Add a subtle glow
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0, 119, 181, 0.3)';
            
            // Draw the thumbs-up icon (LinkedIn style)
            ctx.fillStyle = '#0077b5'; // LinkedIn blue
            ctx.beginPath();
            
            // Thumb shape
            // Upper rounded part of thumb
            ctx.arc(0, -pulseSize * 0.3, pulseSize * 0.35, Math.PI * 0.3, Math.PI * 0.7, false);
            
            // Left side of thumb
            ctx.lineTo(-pulseSize * 0.4, pulseSize * 0.1);
            ctx.quadraticCurveTo(-pulseSize * 0.45, pulseSize * 0.3, -pulseSize * 0.4, pulseSize * 0.5);
            ctx.lineTo(-pulseSize * 0.25, pulseSize * 0.7);
            
            // Bottom curve of thumb
            ctx.quadraticCurveTo(-pulseSize * 0.15, pulseSize * 0.75, 0, pulseSize * 0.7);
            
            // Right side of thumb
            ctx.quadraticCurveTo(pulseSize * 0.15, pulseSize * 0.75, pulseSize * 0.25, pulseSize * 0.7);
            ctx.lineTo(pulseSize * 0.4, pulseSize * 0.5);
            ctx.quadraticCurveTo(pulseSize * 0.45, pulseSize * 0.3, pulseSize * 0.4, pulseSize * 0.1);
            
            ctx.closePath();
            ctx.fill();
            
            // Draw the hand/wrist part (bottom)
            ctx.beginPath();
            ctx.arc(0, pulseSize * 0.65, pulseSize * 0.25, Math.PI * 0.2, Math.PI * 0.8, false);
            ctx.lineTo(-pulseSize * 0.2, pulseSize * 0.85);
            ctx.lineTo(pulseSize * 0.2, pulseSize * 0.85);
            ctx.closePath();
            ctx.fill();
            
            // Add highlight on thumb for dimension
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(pulseSize * 0.15, -pulseSize * 0.15, pulseSize * 0.2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }

    checkCollision(x, y, radius) {
        return distance(this.x, this.y, x, y) < radius + this.size;
    }
}

// Snake Class
class Snake {
    constructor(x, y, isPlayer = false) {
        this.segments = [];
        this.isPlayer = isPlayer;
        this.isDead = false;
        this.color = isPlayer ? '#0077b5' : randomColor();
        this.name = isPlayer ? 'You' : randomName();
        // Invincibility for player on spawn
        this.invincible = isPlayer;
        this.invincibilityStartTime = isPlayer ? Date.now() : 0;
        // Assign a random profile image (will be null if images haven't loaded yet)
        // For AI snakes, respect max 2 duplicates rule
        if (isPlayer) {
            this.profileImage = getRandomProfileImage([], false);
        } else {
            const excludeList = []; // Will be updated later if player has an image
            this.profileImage = getRandomProfileImage(excludeList, true, 1);
        }
        
        // If no image assigned but images exist, try to get one
        if (!this.profileImage && profileImages.length > 0) {
            if (isPlayer) {
                this.profileImage = getRandomProfileImage([], false);
            } else {
                this.profileImage = getRandomProfileImage([], true, 1);
            }
        }
        
        // Initialize snake with a few segments (world coordinates)
        const initialLength = isPlayer ? 5 : Math.floor(Math.random() * (CONFIG.MAX_AI_SNAKE_LENGTH - CONFIG.MIN_AI_SNAKE_LENGTH + 1)) + CONFIG.MIN_AI_SNAKE_LENGTH;
        // Use base segment size for initial spacing
        const baseSpacing = CONFIG.SNAKE_SEGMENT_SIZE;
        for (let i = 0; i < initialLength; i++) {
            this.segments.push({
                x: x - i * baseSpacing,
                y: y
            });
        }
        
        // Ensure snake spawns within world bounds
        const head = this.getHead();
        this.segments[0].x = Math.max(50, Math.min(CONFIG.WORLD_WIDTH - 50, head.x));
        this.segments[0].y = Math.max(50, Math.min(CONFIG.WORLD_HEIGHT - 50, head.y));
        
        this.angle = 0;
        this.targetAngle = 0;
        // Base speed (will be adjusted based on length)
        this.baseSpeed = isPlayer ? CONFIG.SNAKE_SPEED : CONFIG.AI_SPEED;
        this.speed = this.baseSpeed;
    }

    getHead() {
        return this.segments[0];
    }

    getLength() {
        return this.segments.length;
    }

    update(mouseX, mouseY, foods, allSnakes) {
        if (this.isDead) return;

        const head = this.getHead();
        
        // Update invincibility timer for player
        if (this.isPlayer && this.invincible) {
            const elapsed = Date.now() - this.invincibilityStartTime;
            if (elapsed >= CONFIG.INVINCIBILITY_DURATION) {
                this.invincible = false;
            }
        }
        
        // Calculate speed based on snake length
        // Smaller snakes are faster, larger snakes are slower
        const length = this.segments.length;
        const baseLength = 5;
        
        // Speed formula: smaller = faster, larger = slower
        // Minimum speed is 30% of base speed (for very large snakes)
        // Maximum speed is 100% of base speed (for small snakes)
        // Speed decreases smoothly as length increases
        const maxLength = 200; // Reference point for maximum length
        const speedReduction = Math.min(0.7, (length - baseLength) / maxLength);
        const lengthFactor = Math.max(0.3, 1 - speedReduction);
        this.speed = this.baseSpeed * lengthFactor;

        if (this.isPlayer) {
            // Player follows mouse/cursor (convert screen to world coordinates)
            if (mouseX !== null && mouseY !== null) {
                const worldMouse = camera.screenToWorld(mouseX, mouseY);
                this.targetAngle = Math.atan2(worldMouse.y - head.y, worldMouse.x - head.x);
            }
        } else {
            // AI behavior
            this.updateAI(foods, allSnakes);
        }

        // Smooth angle interpolation
        let angleDiff = this.targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.angle += angleDiff * 0.1;

        // Move snake (world coordinates)
        const newHead = {
            x: head.x + Math.cos(this.angle) * this.speed,
            y: head.y + Math.sin(this.angle) * this.speed
        };

        // Wrap around world
        if (newHead.x < 0) newHead.x = CONFIG.WORLD_WIDTH;
        if (newHead.x > CONFIG.WORLD_WIDTH) newHead.x = 0;
        if (newHead.y < 0) newHead.y = CONFIG.WORLD_HEIGHT;
        if (newHead.y > CONFIG.WORLD_HEIGHT) newHead.y = 0;

        this.segments.unshift(newHead);
        this.segments.pop();
    }

    updateAI(foods, allSnakes) {
        const head = this.getHead();
        let targetX = head.x;
        let targetY = head.y;

        // Find closest food
        let closestFood = null;
        let closestDistance = Infinity;

        foods.forEach(food => {
            const dist = distance(head.x, head.y, food.x, food.y);
            if (dist < closestDistance) {
                closestDistance = dist;
                closestFood = food;
            }
        });

        // AI decision making
        if (this.getLength() < 15) {
            // Smaller snakes prioritize food
            if (closestFood) {
                targetX = closestFood.x;
                targetY = closestFood.y;
            }
        } else {
            // Larger snakes can chase player
            const playerSnake = allSnakes.find(s => s.isPlayer && !s.isDead);
            if (playerSnake && playerSnake.getLength() < this.getLength() * 0.8) {
                // Chase player if they're smaller
                const playerHead = playerSnake.getHead();
                targetX = playerHead.x;
                targetY = playerHead.y;
            } else if (closestFood) {
                // Otherwise eat food
                targetX = closestFood.x;
                targetY = closestFood.y;
            }
        }

        // Avoid other snakes (especially larger ones)
        allSnakes.forEach(snake => {
            if (snake === this || snake.isDead) return;
            
            const snakeHead = snake.getHead();
            const dist = distance(head.x, head.y, snakeHead.x, snakeHead.y);
            
            if (dist < 100 && snake.getLength() > this.getLength()) {
                // Flee from larger snakes
                const angle = Math.atan2(head.y - snakeHead.y, head.x - snakeHead.x);
                targetX = head.x + Math.cos(angle) * 150;
                targetY = head.y + Math.sin(angle) * 150;
            }
        });

        this.targetAngle = Math.atan2(targetY - head.y, targetX - head.x);
    }

    grow(amount = 1) {
        // Simply add segments at the tail position - no stretching animation
        const tail = this.segments[this.segments.length - 1];
        for (let i = 0; i < amount; i++) {
            this.segments.push({ ...tail });
        }
    }

    checkCollision(otherSnake) {
        if (this.isDead || otherSnake.isDead) return false;
        if (this === otherSnake) return false;
        
        // If this snake is invincible, it can't die from collisions
        if (this.invincible) return false;
        
        // If other snake is invincible, this snake can't kill it
        if (otherSnake.invincible) return false;

        const thisHead = this.getHead();
        
        // Calculate collision distance based on other snake's scaled size
        const baseLength = 5;
        const maxScale = 3;
        const otherSnakeScale = Math.min(1 + (otherSnake.segments.length - baseLength) / 30, maxScale);
        const scaledCollisionDistance = CONFIG.COLLISION_DISTANCE * otherSnakeScale;
        
        // Check collision with other snake's body (skip head)
        for (let i = 1; i < otherSnake.segments.length; i++) {
            const segment = otherSnake.segments[i];
            if (distance(thisHead.x, thisHead.y, segment.x, segment.y) < scaledCollisionDistance) {
                return true;
            }
        }

        return false;
    }

    die() {
        this.isDead = true;
    }

    draw() {
        if (this.isDead) return;

        const head = this.getHead();
        
        // Calculate flashing effect for invincible player
        // Flashes slowly and tapers off until solid
        let flashAlpha = 1.0;
        if (this.isPlayer && this.invincible) {
            const elapsed = Date.now() - this.invincibilityStartTime;
            const progress = elapsed / CONFIG.INVINCIBILITY_DURATION; // 0 to 1
            
            // Slow flash speed that gets slower as time progresses
            const baseFlashSpeed = 200; // Slower base speed
            const flashSpeed = baseFlashSpeed * (1 + progress * 2); // Gets slower over time
            
            // Flash intensity tapers off (reduces over time)
            const maxFlashIntensity = 0.7; // Maximum flash intensity at start
            const minFlashIntensity = 0.1; // Minimum flash intensity at end
            const flashIntensity = maxFlashIntensity * (1 - progress) + minFlashIntensity * progress;
            
            // Base alpha increases over time (tapering to solid)
            const baseAlpha = 0.3 + progress * 0.7; // Goes from 0.3 to 1.0
            
            // Apply slow flashing that tapers off
            const flash = Math.sin(elapsed / flashSpeed) * flashIntensity;
            flashAlpha = baseAlpha + flash; // Tapers from flashing to solid
            
            // Clamp to valid range
            flashAlpha = Math.max(0.3, Math.min(1.0, flashAlpha));
        }
        
        // Calculate size scaling based on snake length
        // Snake grows in width as it gets longer, with a maximum scale cap
        // Width increases more frequently (faster scaling)
        const baseLength = 5; // Starting length
        const maxScale = 3; // Maximum width multiplier
        const lengthScale = Math.min(1 + (this.segments.length - baseLength) / 15, maxScale); // Faster width growth (was /30, now /15)
        
        // Only draw if head is visible (with margin for long snakes, accounting for scaling)
        const scaledHeadSize = CONFIG.HEAD_SIZE * lengthScale;
        if (!camera.isVisible(head.x, head.y, scaledHeadSize * 3)) return;
        
        // Draw body segments
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const segment = this.segments[i];
            
            // Calculate base segment size with length scaling
            const baseSegmentSize = CONFIG.SNAKE_SEGMENT_SIZE * lengthScale;
            
            // Skip drawing segments outside view (use scaled size for visibility check)
            if (!camera.isVisible(segment.x, segment.y, baseSegmentSize)) continue;
            
            const screenSegment = camera.worldToScreen(segment.x, segment.y);
            const progress = i / this.segments.length;
            // Size varies from tail (smaller) to head (larger), all scaled by length
            const size = baseSegmentSize * (0.7 + progress * 0.3);

            ctx.fillStyle = this.color;
            // Apply invincibility flash effect to body segments
            const segmentAlpha = (0.3 + progress * 0.7) * flashAlpha;
            ctx.globalAlpha = segmentAlpha;
            ctx.beginPath();
            ctx.arc(screenSegment.x, screenSegment.y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Draw head
        const screenHead = camera.worldToScreen(head.x, head.y);
        ctx.save();
        ctx.translate(screenHead.x, screenHead.y);
        ctx.rotate(this.angle);

        // Draw LinkedIn profile picture (circular)
        // Use the already calculated scaledHeadSize
        const headSize = scaledHeadSize;
        
        // Apply invincibility flash effect to head
        ctx.globalAlpha = flashAlpha;
        
        // Shadow/glow effect
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        
        // Outer ring (LinkedIn blue border)
        ctx.beginPath();
        ctx.arc(0, 0, headSize / 2 + 1, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // White background circle
        ctx.beginPath();
        ctx.arc(0, 0, headSize / 2 - 1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Inner colored circle (profile background)
        ctx.beginPath();
        ctx.arc(0, 0, headSize / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Draw profile image if available, otherwise draw initial letter
        // Check if profile image exists and is loaded
        const hasValidImage = this.profileImage && 
                              this.profileImage.complete && 
                              this.profileImage.naturalWidth > 0 && 
                              this.profileImage.naturalHeight > 0;
        
        // If we have profile images but this snake doesn't have one, try to get one
        if (!hasValidImage && profileImages.length > 0 && !this.profileImage) {
            if (this.isPlayer) {
                const usedByAI = getUsedProfileImages();
                this.profileImage = getRandomProfileImage(usedByAI, false);
            } else {
                const excludeList = playerSnake && playerSnake.profileImage ? [playerSnake.profileImage] : [];
                this.profileImage = getRandomProfileImage(excludeList, true, 1);
            }
        }
        
        if (hasValidImage || (this.profileImage && this.profileImage.complete && this.profileImage.naturalWidth > 0)) {
            // Create circular clipping path for profile picture
            const radius = headSize / 2 - 2;
            
            // Save context state before clipping
            ctx.save();
            
            // Create circular clipping path
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.clip();
            
            // Draw the profile image to fill the circle
            // Calculate size to ensure it covers the circle completely
            const imageSize = radius * 2;
            ctx.drawImage(
                this.profileImage,
                -imageSize / 2,
                -imageSize / 2,
                imageSize,
                imageSize
            );
            
            // Restore context to remove clipping path
            ctx.restore();
            
            // Draw a subtle border around the circle for better definition
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            // Fallback: Draw initial letter (only if no profile images are available at all)
            // If profile images exist but this snake doesn't have one, try to get one
            if (profileImages.length > 0 && !this.profileImage) {
                if (this.isPlayer) {
                    const usedByAI = getUsedProfileImages();
                    this.profileImage = getRandomProfileImage(usedByAI, false);
                } else {
                    const excludeList = playerSnake && playerSnake.profileImage ? [playerSnake.profileImage] : [];
                    this.profileImage = getRandomProfileImage(excludeList, true, 1);
                }
                // If we just got an image, try drawing it (but it might not be loaded yet)
                if (this.profileImage && this.profileImage.complete && this.profileImage.naturalWidth > 0) {
                    const radius = headSize / 2 - 2;
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, 0, Math.PI * 2);
                    ctx.clip();
                    const imageSize = radius * 2;
                    ctx.drawImage(
                        this.profileImage,
                        -imageSize / 2,
                        -imageSize / 2,
                        imageSize,
                        imageSize
                    );
                    ctx.restore();
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else {
                    // Image not ready yet, show letter temporarily
                    ctx.globalAlpha = flashAlpha;
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `bold ${headSize * 0.5}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const initial = this.name.charAt(0).toUpperCase();
                    ctx.fillText(initial, 0, 0);
                }
            } else {
                // No profile images available, show letter
                ctx.globalAlpha = flashAlpha;
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${headSize * 0.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const initial = this.name.charAt(0).toUpperCase();
                ctx.fillText(initial, 0, 0);
            }
        }
        
        // Reset alpha after drawing head (in all cases)
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // Draw name above head (optional, for player)
        if (this.isPlayer) {
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, 0, -headSize);
        }
    }
}

// Image loading for like button
let likeButtonImage = null;
let imageLoadAttempted = false;

// Profile images array
let profileImages = [];
let profileImagesLoaded = false;
let profileImageLoadAttempted = false;

// Load profile images from assets/images/profiles/
// Tries numbered files (1.png, 2.png, etc.) and common naming patterns
function loadProfileImages() {
    if (profileImageLoadAttempted) return;
    profileImageLoadAttempted = true;
    
    // Common image extensions
    const extensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
    
    // Try to load profile images - tries numbered files first (1.png, 2.png, etc.)
    // Also tries: profile1.png, linkedin1.png, linkedin-profile-1.png, user1.png, img1.png, avatar1.png
    const namePatterns = ['', 'profile', 'linkedin', 'linkedin-profile-', 'user', 'img', 'avatar'];
    const maxNumber = 50; // Try up to number 50
    
    let loadedCount = 0;
    let currentPattern = 0;
    let currentNumber = 1;
    let currentExt = 0;
    
    const tryLoadNext = () => {
        if (currentPattern >= namePatterns.length) {
            profileImagesLoaded = true;
            console.log(`Finished loading. Total profile images: ${profileImages.length}`);
            // Final assignment to any snakes that still don't have images
            assignProfileImagesToSnakes();
            return;
        }
        
        if (currentNumber > maxNumber) {
            currentPattern++;
            currentNumber = 1;
            currentExt = 0;
            if (currentPattern < namePatterns.length) {
                tryLoadNext();
            } else {
                profileImagesLoaded = true;
                console.log(`Finished loading. Total profile images: ${profileImages.length}`);
                // Final assignment to any snakes that still don't have images
                assignProfileImagesToSnakes();
            }
            return;
        }
        
        const img = new Image();
        const prefix = namePatterns[currentPattern] ? namePatterns[currentPattern] : '';
        const number = currentNumber;
        const ext = extensions[currentExt];
        // Handle patterns with dashes (like "linkedin-profile-")
        const imagePath = `assets/images/profiles/${prefix}${number}${ext}`;
        
        img.onload = function() {
            profileImages.push(img);
            loadedCount++;
            console.log(`Loaded profile image: ${imagePath} (Total: ${profileImages.length})`);
            
            // Immediately assign images to existing snakes that don't have one
            if (playerSnake && !playerSnake.profileImage) {
                // Get images used by AI to ensure player gets unique image
                const usedByAI = getUsedProfileImages();
                playerSnake.profileImage = getRandomProfileImage(usedByAI, false);
                console.log('Assigned profile image to player snake');
            }
            aiSnakes.forEach(snake => {
                if (!snake.profileImage && profileImages.length > 0) {
                    // AI snakes can share images (max 1 duplicate), but exclude player's image
                    const excludeList = playerSnake && playerSnake.profileImage ? [playerSnake.profileImage] : [];
                    snake.profileImage = getRandomProfileImage(excludeList, true, 1);
                }
            });
            
            // Try next extension for same file
            currentExt++;
            if (currentExt >= extensions.length) {
                currentExt = 0;
                currentNumber++;
            }
            tryLoadNext();
        };
        
        img.onerror = function() {
            // Try next extension
            currentExt++;
            if (currentExt >= extensions.length) {
                currentExt = 0;
                currentNumber++;
            }
            tryLoadNext();
        };
        
        img.src = imagePath;
    };
    
    // Start loading
    tryLoadNext();
}

// Get count of how many times each profile image is used by AI snakes
function getProfileImageUsageCount() {
    const usageCount = new Map();
    aiSnakes.forEach(snake => {
        if (snake.profileImage) {
            const count = usageCount.get(snake.profileImage) || 0;
            usageCount.set(snake.profileImage, count + 1);
        }
    });
    return usageCount;
}

// Get a random profile image, optionally excluding certain images
// Also respects the max 1 duplicate rule for AI snakes (reduced from 2)
function getRandomProfileImage(excludeImages = [], forAI = false, maxDuplicates = 1) {
    if (profileImages.length === 0) {
        // If no images loaded yet, return null (will use letter fallback)
        return null;
    }
    
    // Filter out excluded images
    let availableImages = profileImages.filter(img => !excludeImages.includes(img));
    
    // If this is for an AI snake, also filter out images that are already used 2 times
    if (forAI) {
        const usageCount = getProfileImageUsageCount();
        availableImages = availableImages.filter(img => {
            const count = usageCount.get(img) || 0;
            return count < maxDuplicates;
        });
    }
    
    if (availableImages.length === 0) {
        // If all images are excluded or at max duplicates, return a random one anyway
        // (shouldn't happen with enough images, but fallback to prevent errors)
        const randomIndex = Math.floor(Math.random() * profileImages.length);
        return profileImages[randomIndex];
    }
    
    // Return a random image from available images
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    return availableImages[randomIndex];
}

// Get all profile images currently used by AI snakes
function getUsedProfileImages() {
    const usedImages = [];
    aiSnakes.forEach(snake => {
        if (snake.profileImage && !usedImages.includes(snake.profileImage)) {
            usedImages.push(snake.profileImage);
        }
    });
    return usedImages;
}

// Assign profile images to all snakes that don't have one
function assignProfileImagesToSnakes() {
    if (profileImages.length === 0) return;
    
    // Get images already used by AI snakes
    const usedByAI = getUsedProfileImages();
    
    // Assign to player snake if it doesn't have one
    // Make sure player gets a unique image not used by AI
    if (playerSnake && !playerSnake.profileImage) {
        playerSnake.profileImage = getRandomProfileImage(usedByAI, false);
    } else if (playerSnake && playerSnake.profileImage && usedByAI.includes(playerSnake.profileImage)) {
        // If player's image is being used by AI, get a new unique one
        const excludeList = [playerSnake.profileImage, ...usedByAI];
        playerSnake.profileImage = getRandomProfileImage(excludeList, false);
    }
    
    // Assign to all AI snakes that don't have one
    aiSnakes.forEach(snake => {
        if (!snake.profileImage) {
            // AI snakes can share images (max 1 duplicate), but exclude player's image
            const excludeList = playerSnake && playerSnake.profileImage ? [playerSnake.profileImage] : [];
            snake.profileImage = getRandomProfileImage(excludeList, true, 1);
        } else if (playerSnake && playerSnake.profileImage && snake.profileImage === playerSnake.profileImage) {
            // If this AI snake is using player's image, get a new one
            const excludeList = [playerSnake.profileImage];
            snake.profileImage = getRandomProfileImage(excludeList, true, 1);
        }
    });
}

function loadLikeButtonImage() {
    if (imageLoadAttempted) return;
    imageLoadAttempted = true;
    
    likeButtonImage = new Image();
    likeButtonImage.onload = function() {
        console.log('Like button image loaded successfully from:', likeButtonImage.src);
    };
    likeButtonImage.onerror = function() {
        console.log('Like button image not found. Trying different extensions...');
        // Try different extensions
        const extensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
        const baseName = 'assets/images/linkedin-like';
        let currentExtensionIndex = 0;
        
        const tryNextExtension = () => {
            if (currentExtensionIndex < extensions.length) {
                likeButtonImage.src = baseName + extensions[currentExtensionIndex];
                currentExtensionIndex++;
            } else {
                console.log('LinkedIn like image not found with any extension. Using drawn version.');
                likeButtonImage = null;
            }
        };
        
        likeButtonImage.onerror = tryNextExtension;
        tryNextExtension();
    };
    
    // Try to load the linkedin-like image with common extensions
    // Will try: linkedin-like.png, linkedin-like.jpg, linkedin-like.svg, etc.
    likeButtonImage.src = 'assets/images/linkedin-like.png';
}

// Game State
let playerSnake;
let aiSnakes = [];
let foods = [];
let mouseX = null;
let mouseY = null;
let gameRunning = false;
let gameLoopInterval = null;

// Initialize Game
function initGame() {
    if (!canvas || !ctx) {
        console.error('Canvas not initialized!');
        return;
    }
    
    // Clear previous state
    aiSnakes = [];
    foods = [];
    
    // Ensure canvas is properly sized
    resizeCanvas();
    
    // Ensure camera is properly sized
    updateCameraSize();
    
    // Create player snake first at center of world
    const startX = CONFIG.WORLD_WIDTH / 2;
    const startY = CONFIG.WORLD_HEIGHT / 2;
    playerSnake = new Snake(startX, startY, true);
    
    // Initialize camera on player
    camera.update(startX, startY);
    
    // Create AI snakes (in world space)
    for (let i = 0; i < CONFIG.AI_SNAKE_COUNT; i++) {
        let x = Math.random() * CONFIG.WORLD_WIDTH;
        let y = Math.random() * CONFIG.WORLD_HEIGHT;
        // Make sure AI snakes don't spawn on top of player
        const playerHead = playerSnake.getHead();
        if (distance(x, y, playerHead.x, playerHead.y) < 200) {
            const angle = Math.random() * Math.PI * 2;
            x = playerHead.x + Math.cos(angle) * 200;
            y = playerHead.y + Math.sin(angle) * 200;
            x = Math.max(50, Math.min(CONFIG.WORLD_WIDTH - 50, x));
            y = Math.max(50, Math.min(CONFIG.WORLD_HEIGHT - 50, y));
        }
        const aiSnake = new Snake(x, y, false);
        // Ensure AI snake doesn't use player's profile image and respects max 1 duplicate
        if (playerSnake.profileImage && aiSnake.profileImage === playerSnake.profileImage) {
            const excludeList = [playerSnake.profileImage];
            aiSnake.profileImage = getRandomProfileImage(excludeList, true, 1);
        } else {
            // Re-assign to ensure max 1 duplicate rule is respected
            const excludeList = playerSnake.profileImage ? [playerSnake.profileImage] : [];
            aiSnake.profileImage = getRandomProfileImage(excludeList, true, 1);
        }
        aiSnakes.push(aiSnake);
    }
    
    // Final check: Ensure player has a unique profile image not used by AI
    if (profileImages.length > 0) {
        const usedByAI = getUsedProfileImages();
        if (!playerSnake.profileImage || usedByAI.includes(playerSnake.profileImage)) {
            playerSnake.profileImage = getRandomProfileImage(usedByAI, false);
        }
    }
    
    // Create food (in world space)
    for (let i = 0; i < CONFIG.FOOD_COUNT; i++) {
        foods.push(new Food());
    }
    
    gameRunning = true;
    if (overlay) {
        overlay.classList.remove('active');
    }
    if (startOverlay) {
        startOverlay.classList.add('hidden');
    }
    if (scoreElement) {
        scoreElement.textContent = playerSnake.getLength();
    }
}

// Setup event listeners
function setupEventListeners() {
    if (!canvas) return;
    
    // Mouse/Cursor tracking
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
        mouseX = null;
        mouseY = null;
    });

    // Touch support
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouseX = touch.clientX - rect.left;
        mouseY = touch.clientY - rect.top;
    });
    
    window.addEventListener('resize', resizeCanvas);
}

// Game Loop
function gameLoop() {
    if (!gameRunning || !canvas || !ctx) return;
    if (canvas.width === 0 || canvas.height === 0) {
        resizeCanvas();
        return;
    }
    if (!playerSnake) return;

    // Clear canvas with background color
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update camera to follow player
    if (!playerSnake.isDead) {
        const playerHead = playerSnake.getHead();
        camera.update(playerHead.x, playerHead.y);
    }

    // Draw grid background (subtle) - relative to camera
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    const gridSize = 50;
    const startGridX = Math.floor(camera.x / gridSize) * gridSize;
    const startGridY = Math.floor(camera.y / gridSize) * gridSize;
    
    for (let x = startGridX; x < camera.x + canvas.width; x += gridSize) {
        const screenX = x - camera.x;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvas.height);
        ctx.stroke();
    }
    for (let y = startGridY; y < camera.y + canvas.height; y += gridSize) {
        const screenY = y - camera.y;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvas.width, screenY);
        ctx.stroke();
    }

    const allSnakes = [playerSnake, ...aiSnakes].filter(s => !s.isDead);

    // Update player snake
    if (!playerSnake.isDead) {
        playerSnake.update(mouseX, mouseY, foods, allSnakes);
    }

    // Update AI snakes
    aiSnakes.forEach(snake => {
        if (!snake.isDead) {
            snake.update(null, null, foods, allSnakes);
        }
    });

    // Check food collisions
    foods = foods.filter(food => {
        let eaten = false;

        // Check player collision
        if (!playerSnake.isDead) {
            const head = playerSnake.getHead();
            // Use scaled head size for collision detection
            const baseLength = 5;
            const maxScale = 3;
            const playerScale = Math.min(1 + (playerSnake.segments.length - baseLength) / 30, maxScale);
            const scaledHeadSize = CONFIG.HEAD_SIZE * playerScale;
            if (food.checkCollision(head.x, head.y, scaledHeadSize / 2)) {
                // Grow less frequently (smaller height increase per like)
                // Base growth of 2-3 segments, plus small bonus based on food size
                const baseGrowth = 2;
                const sizeBonus = Math.floor(food.size / 8);
                const growthAmount = baseGrowth + sizeBonus; // Grows by 2-3 segments per like
                playerSnake.grow(growthAmount);
                eaten = true;
                if (scoreElement) {
                    scoreElement.textContent = playerSnake.getLength();
                }
            }
        }

        // Check AI collisions
        if (!eaten) {
            aiSnakes.forEach(snake => {
                if (!snake.isDead && !eaten) {
                    const head = snake.getHead();
                    // Use scaled head size for collision detection
                    const baseLength = 5;
                    const maxScale = 3;
                    const snakeScale = Math.min(1 + (snake.segments.length - baseLength) / 30, maxScale);
                    const scaledHeadSize = CONFIG.HEAD_SIZE * snakeScale;
                    if (food.checkCollision(head.x, head.y, scaledHeadSize / 2)) {
                        // AI snakes also grow less frequently
                        const baseGrowth = 2;
                        const sizeBonus = Math.floor(food.size / 8);
                        const growthAmount = baseGrowth + sizeBonus; // Grows by 2-3 segments per like
                        snake.grow(growthAmount);
                        eaten = true;
                    }
                }
            });
        }

        return !eaten;
    });

    // Maintain food count (spawn new food in world space)
    while (foods.length < CONFIG.FOOD_COUNT) {
        // Spawn food near visible area but in world space
        const spawnX = camera.x + Math.random() * camera.width;
        const spawnY = camera.y + Math.random() * camera.height;
        foods.push(new Food(
            Math.max(50, Math.min(CONFIG.WORLD_WIDTH - 50, spawnX)),
            Math.max(50, Math.min(CONFIG.WORLD_HEIGHT - 50, spawnY))
        ));
    }

    // Check collisions between snakes
    const deadSnakes = [];
    allSnakes.forEach(snake => {
        if (snake.isDead) return;

        allSnakes.forEach(otherSnake => {
            if (snake.checkCollision(otherSnake)) {
                // Snake hit another snake's body
                if (!snake.isDead) {
                    snake.die();
                    deadSnakes.push(snake);
                    
                    // Spawn food from dead snake in the shape of the snake's body
                    // Reduced density: spawn food at fewer segments
                    const segmentSpacing = Math.max(2, Math.floor(snake.segments.length / 15)); // Spawn food every few segments
                    const foodCount = Math.min(snake.segments.length, Math.max(3, Math.floor(snake.getLength() / 3))); // Reduced density
                    
                    // Spawn food along the snake's body shape
                    for (let i = 0; i < snake.segments.length; i += segmentSpacing) {
                        const segment = snake.segments[i];
                        // Add some randomness to make it look more natural
                        const offsetX = (Math.random() - 0.5) * 10;
                        const offsetY = (Math.random() - 0.5) * 10;
                        const foodX = segment.x + offsetX;
                        const foodY = segment.y + offsetY;
                        
                        // Make sure food spawns within world bounds
                        const clampedX = Math.max(CONFIG.FOOD_SIZE_MAX, Math.min(CONFIG.WORLD_WIDTH - CONFIG.FOOD_SIZE_MAX, foodX));
                        const clampedY = Math.max(CONFIG.FOOD_SIZE_MAX, Math.min(CONFIG.WORLD_HEIGHT - CONFIG.FOOD_SIZE_MAX, foodY));
                        
                        const food = new Food(clampedX, clampedY);
                        foods.push(food);
                    }

                    // Check if player died
                    if (snake.isPlayer) {
                        gameOver();
                    }
                }
            }
        });
    });

    // Draw everything
    foods.forEach(food => food.draw());
    allSnakes.forEach(snake => snake.draw());

    // Respawn dead AI snakes after a delay
    deadSnakes.forEach(deadSnake => {
        if (!deadSnake.isPlayer) {
            setTimeout(() => {
                if (aiSnakes.length < CONFIG.AI_SNAKE_COUNT && gameRunning) {
                    let x = Math.random() * CONFIG.WORLD_WIDTH;
                    let y = Math.random() * CONFIG.WORLD_HEIGHT;
                    // Make sure new snake doesn't spawn on top of player
                    const playerHead = playerSnake.getHead();
                    const minDistance = 200;
                    if (distance(x, y, playerHead.x, playerHead.y) < minDistance) {
                        const angle = Math.random() * Math.PI * 2;
                        x = playerHead.x + Math.cos(angle) * minDistance;
                        y = playerHead.y + Math.sin(angle) * minDistance;
                        x = Math.max(50, Math.min(CONFIG.WORLD_WIDTH - 50, x));
                        y = Math.max(50, Math.min(CONFIG.WORLD_HEIGHT - 50, y));
                    }
                    const newSnake = new Snake(x, y, false);
                    // Ensure new AI snake doesn't use player's profile image and respects max 1 duplicate
                    const excludeList = playerSnake && playerSnake.profileImage ? [playerSnake.profileImage] : [];
                    newSnake.profileImage = getRandomProfileImage(excludeList, true, 1);
                    aiSnakes.push(newSnake);
                }
            }, 3000);
        }
    });

    // Remove dead AI snakes from array
    aiSnakes = aiSnakes.filter(snake => !snake.isDead || snake.isPlayer);
}

function gameOver() {
    gameRunning = false;
    const finalScoreEl = document.getElementById('finalScore');
    if (finalScoreEl && playerSnake) {
        finalScoreEl.textContent = playerSnake.getLength();
    }
    if (overlay) {
        overlay.classList.add('active');
    }
}

function restartGame() {
    // Hide game over overlay
    if (overlay) {
        overlay.classList.remove('active');
    }
    // Reinitialize the game
    initGame();
}

// Make restartGame globally available
window.restartGame = restartGame;

// Start game from button click
function startGameFromButton() {
    if (startOverlay) {
        startOverlay.classList.add('hidden');
    }
    
    // Wait a bit for images to start loading, then initialize game
    // Images will continue loading in background and be assigned as they load
    setTimeout(() => {
        // Initialize the game
        initGame();
        
        // Start game loop only if it hasn't started yet
        if (!gameLoopInterval) {
            gameLoopInterval = setInterval(gameLoop, 1000 / CONFIG.FPS);
        }
    }, 100); // Small delay to let image loading start
}

// Make startGameFromButton globally available
window.startGameFromButton = startGameFromButton;

// Initialize game when DOM is ready
function startGame() {
    if (!initializeCanvas()) {
        console.error('Failed to initialize canvas!');
        return;
    }
    
    // Load like button image
    loadLikeButtonImage();
    
    // Load profile images
    loadProfileImages();
    
    // Setup event listeners
    setupEventListeners();
    
    // Ensure canvas is properly sized
    resizeCanvas();
    
    // Start overlay should be visible by default (no need to add class, it's already visible in CSS)
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    // DOM is already ready
    startGame();
}
