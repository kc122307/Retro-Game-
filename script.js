 // Game variables
    let score = 0;
    let lives = 3;
    let level = 1;
    let gameRunning = false;
    let asteroids = [];
    let bullets = [];
    let stars = [];
    let powerUps = [];
    let gameSpeed = 1;
    let lastAsteroidTime = 0;
    let lastPowerUpTime = 0;
    let rocketPos = { x: 280, y: 350 };
    let keys = {};
    let rocketTilt = 0;
    let isShooting = false;
    let shootCooldown = 0;
    let powerUpActive = false;
    let powerUpTimer = 0;
    
    // Sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // DOM Elements
    const game = document.getElementById('game');
    const rocketElement = document.getElementById('rocket');
    const thrusterElement = document.querySelector('.thruster');
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const levelElement = document.getElementById('level');
    const gameOverElement = document.getElementById('game-over');
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');
    const starLayer1 = document.getElementById('star-layer-1');
    const starLayer2 = document.getElementById('star-layer-2');
    const starLayer3 = document.getElementById('star-layer-3');
    
    // Sound functions
    function playSound(type) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch(type) {
        case 'shoot':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
        case 'explosion':
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'powerUp':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
          oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
        case 'levelUp':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
          oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.2);
          oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'gameover':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 1);
          gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 1);
          break;
      }
    }
    
    // Generate stars for parallax background effect
    function createStars() {
      // Clear existing stars
      while (starLayer1.firstChild) {
        starLayer1.removeChild(starLayer1.firstChild);
      }
      while (starLayer2.firstChild) {
        starLayer2.removeChild(starLayer2.firstChild);
      }
      while (starLayer3.firstChild) {
        starLayer3.removeChild(starLayer3.firstChild);
      }
      
      stars = [];
      
      // Create stars for each layer
      for (let i = 0; i < 20; i++) {
        createStarInLayer(starLayer1, 0.2);
      }
      
      for (let i = 0; i < 15; i++) {
        createStarInLayer(starLayer2, 0.5);
      }
      
      for (let i = 0; i < 10; i++) {
        createStarInLayer(starLayer3, 0.8);
      }
    }
    
    function createStarInLayer(layer, speed) {
      const star = document.createElement('div');
      star.className = 'star';
      
      // Randomize star appearance
      const size = Math.random() * 2 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 600}px`;
      star.style.top = `${Math.random() * 400}px`;
      star.style.opacity = Math.random() * 0.8 + 0.2;
      
      // Add subtle glow to brighter stars
      if (size > 2) {
        star.style.boxShadow = '0 0 3px #fff';
      }
      
      layer.appendChild(star);
      
      stars.push({
        element: star,
        speed: speed,
        layer: layer
      });
    }
    
    // Create a new asteroid
    function createAsteroid() {
      const size = Math.random() * 20 + 15;
      const asteroid = document.createElement('div');
      asteroid.className = 'asteroid';
      asteroid.style.width = `${size}px`;
      asteroid.style.height = `${size}px`;
      asteroid.style.left = `${Math.random() * (600 - size)}px`;
      asteroid.style.top = `${-size}px`;
      
      // Add texture and variation to asteroids
      const brightness = Math.floor(Math.random() * 50) + 50;
      asteroid.style.backgroundColor = `rgb(${brightness}, ${brightness}, ${brightness})`;
      asteroid.style.boxShadow = `0 0 ${Math.random() * 5 + 5}px rgba(255, 255, 255, 0.5)`;
      
      // Create crater-like effect
      if (size > 25) {
        const craterCount = Math.floor(Math.random() * 3) + 1;
        asteroid.style.backgroundImage = `radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, rgba(0,0,0,0.8) ${craterCount}px, transparent ${craterCount + 5}px)`;
      }
      
      game.appendChild(asteroid);
      
      return {
        element: asteroid,
        x: parseFloat(asteroid.style.left),
        y: parseFloat(asteroid.style.top),
        size: size,
        speed: Math.random() * 2 + 1 * gameSpeed,
        rotation: 0,
        rotationSpeed: Math.random() * 2 - 1
      };
    }
    
    // Create a power-up
    function createPowerUp() {
      const powerUp = document.createElement('div');
      powerUp.className = 'power-up';
      powerUp.style.left = `${Math.random() * 560}px`;
      powerUp.style.top = `${-20}px`;
      game.appendChild(powerUp);
      
      return {
        element: powerUp,
        x: parseFloat(powerUp.style.left),
        y: parseFloat(powerUp.style.top),
        speed: 1.5,
        type: 'rapidFire'
      };
    }
    
    // Create a bullet
    function createBullet() {
      if (shootCooldown > 0) return;
      
      // Double fire when power-up is active
      if (powerUpActive) {
        // Left bullet
        const bulletLeft = document.createElement('div');
        bulletLeft.className = 'bullet';
        bulletLeft.style.left = `${rocketPos.x + 5}px`;
        bulletLeft.style.top = `${rocketPos.y - 10}px`;
        bulletLeft.style.backgroundColor = '#0ff';
        bulletLeft.style.filter = 'drop-shadow(0 0 5px #0ff)';
        game.appendChild(bulletLeft);
        
        bullets.push({
          element: bulletLeft,
          x: rocketPos.x + 5,
          y: rocketPos.y - 10,
          speed: 6
        });
        
        // Right bullet
        const bulletRight = document.createElement('div');
        bulletRight.className = 'bullet';
        bulletRight.style.left = `${rocketPos.x + 21}px`;
        bulletRight.style.top = `${rocketPos.y - 10}px`;
        bulletRight.style.backgroundColor = '#0ff';
        bulletRight.style.filter = 'drop-shadow(0 0 5px #0ff)';
        game.appendChild(bulletRight);
        
        bullets.push({
          element: bulletRight,
          x: rocketPos.x + 21,
          y: rocketPos.y - 10,
          speed: 6
        });
      } else {
        // Regular single bullet
        const bullet = document.createElement('div');
        bullet.className = 'bullet';
        bullet.style.left = `${rocketPos.x + 13}px`;
        bullet.style.top = `${rocketPos.y - 10}px`;
        game.appendChild(bullet);
        
        bullets.push({
          element: bullet,
          x: rocketPos.x + 13,
          y: rocketPos.y - 10,
          speed: 6
        });
      }
      
      // Add shooting cooldown (faster when power-up is active)
      shootCooldown = powerUpActive ? 5 : 10;
      
      // Play shooting sound
      playSound('shoot');
    }
    
    // Create explosion effect
    function createExplosion(x, y, size = 1) {
      const explosion = document.createElement('div');
      explosion.className = 'explosion';
      explosion.style.left = `${x - 20 * size}px`;
      explosion.style.top = `${y - 20 * size}px`;
      explosion.style.width = `${40 * size}px`;
      explosion.style.height = `${40 * size}px`;
      game.appendChild(explosion);
      
      // Create smaller particle explosions
      for (let i = 0; i < 3; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion';
        particle.style.width = `${10 * size}px`;
        particle.style.height = `${10 * size}px`;
        particle.style.left = `${x - 5 + Math.random() * 30 - 15}px`;
        particle.style.top = `${y - 5 + Math.random() * 30 - 15}px`;
        particle.style.opacity = '0.7';
        game.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
          if (game.contains(particle)) {
            game.removeChild(particle);
          }
        }, 500);
      }
      
      // Play explosion sound
      playSound('explosion');
      
      // Remove explosion after animation completes
      setTimeout(() => {
        if (game.contains(explosion)) {
          game.removeChild(explosion);
        }
      }, 500);
    }
    
    // Level up function
    function levelUp() {
      level++;
      levelElement.textContent = `LEVEL: ${level}`;
      gameSpeed += 0.2;
      
      // Play level up sound
      playSound('levelUp');
      
      // Visual effect for level up
      game.style.animation = 'levelTransition 1s';
      setTimeout(() => {
        game.style.animation = '';
      }, 1000);
    }
    
    // Check collisions between objects
    function checkCollisions() {
      // Bullets and asteroids
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = asteroids.length - 1; j >= 0; j--) {
          const asteroid = asteroids[j];
          
          // Check if bullet hits asteroid
          if (
            bullet.x < asteroid.x + asteroid.size &&
            bullet.x + 4 > asteroid.x &&
            bullet.y < asteroid.y + asteroid.size &&
            bullet.y + 10 > asteroid.y
          ) {
            // Collision detected
            createExplosion(asteroid.x + asteroid.size/2, asteroid.y + asteroid.size/2, asteroid.size / 30);
            
            if (asteroid.element.parentNode) {
              game.removeChild(asteroid.element);
            }
            if (bullet.element.parentNode) {
              game.removeChild(bullet.element);
            }
            asteroids.splice(j, 1);
            bullets.splice(i, 1);
            
            // Update score
            score += 10;
            scoreElement.textContent = `SCORE: ${score}`;
            
            // Level up every 100 points
            if (score % 100 === 0) {
              levelUp();
            }
            
            break;
          }
        }
      }
      
      // Rocket and asteroids
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        
        // Check if asteroid hits rocket
        if (
          rocketPos.x < asteroid.x + asteroid.size &&
          rocketPos.x + 30 > asteroid.x &&
          rocketPos.y < asteroid.y + asteroid.size &&
          rocketPos.y + 40 > asteroid.y
        ) {
          // Collision detected
          createExplosion(rocketPos.x + 15, rocketPos.y + 20, 1.5);
          
          if (asteroid.element.parentNode) {
            game.removeChild(asteroid.element);
          }
          asteroids.splice(i, 1);
          
          lives--;
          livesElement.textContent = `LIVES: ${lives}`;
          
          // Screen shake effect
          game.style.animation = 'none';
          setTimeout(() => {
            game.style.animation = 'shake 0.5s';
          }, 10);
          
          if (lives <= 0) {
            endGame();
          }
        }
      }
      
      // Rocket and power-ups
      for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        // Check if power-up hits rocket
        if (
          rocketPos.x < powerUp.x + 20 &&
          rocketPos.x + 30 > powerUp.x &&
          rocketPos.y < powerUp.y + 20 &&
          rocketPos.y + 40 > powerUp.y
        ) {
          // Collect power-up
          if (powerUp.element.parentNode) {
            game.removeChild(powerUp.element);
          }
          powerUps.splice(i, 1);
          
          // Apply power-up effect
          activatePowerUp(powerUp.type);
          
          // Play power-up sound
          playSound('powerUp');
        }
      }
    }
    
    // Activate power-up
    function activatePowerUp(type) {
      powerUpActive = true;
      powerUpTimer = 600; // 10 seconds at 60 fps
      
      // Visual feedback
      rocketElement.style.filter = 'drop-shadow(0 0 8px #0ff)';
      
      // Display power-up message
      const powerUpMsg = document.createElement('div');
      powerUpMsg.textContent = 'DOUBLE FIRE!';
      powerUpMsg.style.position = 'absolute';
      powerUpMsg.style.top = '150px';
      powerUpMsg.style.left = '50%';
      powerUpMsg.style.transform = 'translateX(-50%)';
      powerUpMsg.style.color = '#0ff';
      powerUpMsg.style.fontSize = '24px';
      powerUpMsg.style.textShadow = '0 0 10px #0ff';
      powerUpMsg.style.animation = 'textPulse 0.5s infinite alternate';
      powerUpMsg.style.zIndex = '150';
      game.appendChild(powerUpMsg);
      
      // Remove message after 2 seconds
      setTimeout(() => {
        if (powerUpMsg.parentNode) {
          game.removeChild(powerUpMsg);
        }
      }, 2000);
    }
    
    // Update game state
    function update() {
      if (!gameRunning) return;
      
      // Power-up timer
      if (powerUpActive) {
        powerUpTimer--;
        
        // Power-up expiration warning when 3 seconds remain
        if (powerUpTimer === 180) {
          rocketElement.style.animation = 'textPulse 0.5s infinite alternate';
        }
        
        if (powerUpTimer <= 0) {
          powerUpActive = false;
          rocketElement.style.filter = 'drop-shadow(0 0 5px #f55)';
          rocketElement.style.animation = '';
        }
      }
      
      // Shooting cooldown
      if (shootCooldown > 0) {
        shootCooldown--;
      }
      
      // Update thruster position
      thrusterElement.style.left = `${rocketPos.x + 10}px`;
      thrusterElement.style.top = `${rocketPos.y + 40}px`;
      
      // Move stars for parallax background effect
      stars.forEach(star => {
        const rect = star.element.getBoundingClientRect();
        const parentRect = star.layer.getBoundingClientRect();
        
        // Calculate position relative to parent
        let y = rect.top - parentRect.top + star.speed;
        
        if (y > 400) {
          y = -2;
          star.element.style.left = `${Math.random() * 600}px`;
        }
        
        star.element.style.top = `${y}px`;
      });
      
      // Move rocket based on key presses
      if (keys['ArrowLeft'] && rocketPos.x > 0) {
        rocketPos.x -= 5;
        rocketTilt = Math.max(rocketTilt - 0.5, -15);
      } else if (keys['ArrowRight'] && rocketPos.x < 570) {
        rocketPos.x += 5;
        rocketTilt = Math.min(rocketTilt + 0.5, 15);
      } else {
        // Return to center when no keys pressed
        if (rocketTilt > 0) {
          rocketTilt = Math.max(0, rocketTilt - 1);
        } else if (rocketTilt < 0) {
          rocketTilt = Math.min(0, rocketTilt + 1);
        }
      }
      
      // Apply rocket tilt
      rocketElement.style.transform = `rotate(${rocketTilt}deg)`;
      rocketElement.style.left = `${rocketPos.x}px`;
      
      // Create new asteroids periodically
      const currentTime = Date.now();
      if (currentTime - lastAsteroidTime > 1000 / gameSpeed) {
        asteroids.push(createAsteroid());
        lastAsteroidTime = currentTime;
      }
      
      // Create power-up occasionally (increased spawn rate for testing)
      if (currentTime - lastPowerUpTime > 10000 && Math.random() < 0.01) {
        powerUps.push(createPowerUp());
        lastPowerUpTime = currentTime;
      }
      
      // Auto-shooting when spacebar is held down
      if (keys[' '] && gameRunning) {
        createBullet();
      }
      
      // Move asteroids
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        asteroid.y += asteroid.speed;
        asteroid.rotation += asteroid.rotationSpeed;
        asteroid.element.style.top = `${asteroid.y}px`;
        asteroid.element.style.transform = `rotate(${asteroid.rotation}deg)`;
        
        // Remove asteroids that go off screen
        if (asteroid.y > 400) {
          if (asteroid.element.parentNode) {
            game.removeChild(asteroid.element);
          }
          asteroids.splice(i, 1);
        }
      }
      
      // Move power-ups
      for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.y += powerUp.speed;
        powerUp.element.style.top = `${powerUp.y}px`;
        
        // Remove power-ups that go off screen
        if (powerUp.y > 400) {
          if (powerUp.element.parentNode) {
            game.removeChild(powerUp.element);
          }
          powerUps.splice(i, 1);
        }
      }
      
      // Move bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed;
        bullet.element.style.top = `${bullet.y}px`;
        
        // Remove bullets that go off screen
        if (bullet.y < -10) {
          if (bullet.element.parentNode) {
            game.removeChild(bullet.element);
          }
          bullets.splice(i, 1);
        }
      }
      
      checkCollisions();
      requestAnimationFrame(update);
    }
    
    // End the game
    function endGame() {
      gameRunning = false;
      gameOverElement.style.display = 'block';
      
      // Play game over sound
      playSound('gameover');
      
      // Show start screen after 3 seconds
      setTimeout(() => {
        resetGame();
        startScreen.style.display = 'flex';
        gameOverElement.style.display = 'none';
      }, 3000);
    }
    
    // Reset game state
    function resetGame() {
      // Clear all game objects
      asteroids.forEach(asteroid => {
        if (asteroid.element.parentNode) {
          game.removeChild(asteroid.element);
        }
      });
      
      bullets.forEach(bullet => {
        if (bullet.element.parentNode) {
          game.removeChild(bullet.element);
        }
      });
      
      powerUps.forEach(powerUp => {
        if (powerUp.element.parentNode) {
          game.removeChild(powerUp.element);
        }
      });
      
      asteroids = [];
      bullets = [];
      powerUps = [];
      
      // Reset game variables
      score = 0;
      lives = 3;
      level = 1;
      gameSpeed = 1;
      rocketPos = { x: 280, y: 350 };
      rocketTilt = 0;
      rocketElement.style.transform = 'rotate(0deg)';
      rocketElement.style.left = `${rocketPos.x}px`;
      rocketElement.style.filter = 'drop-shadow(0 0 5px #f55)';
      
      // Update display
      scoreElement.textContent = `SCORE: ${score}`;
      livesElement.textContent = `LIVES: ${lives}`;
      levelElement.textContent = `LEVEL: ${level}`;
    }
    
    // Start the game
    function startGame() {
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      startScreen.style.display = 'none';
      gameRunning = true;
      
      // Fade-in transition
      game.style.opacity = 0;
      let opacity = 0;
      const fadeIn = setInterval(() => {
        opacity += 0.1;
        game.style.opacity = opacity;
        if (opacity >= 1) {
          clearInterval(fadeIn);
        }
      }, 50);
      
      update();
    }
    
    // Event listeners
    window.addEventListener('keydown', e => {
      keys[e.key] = true;
      
      // Prevent scrolling with spacebar
      if (e.key === ' ') {
        e.preventDefault();
      }
    });
    
    window.addEventListener('keyup', e => {
      keys[e.key] = false;
    });
    
    startButton.addEventListener('click', startGame);
    
    // Random CRT flicker effect
    setInterval(() => {
      const flicker = document.getElementById('crt-flicker');
      flicker.style.opacity = Math.random() < 0.1 ? 0.05 : 0;
    }, 100);
    
    // Initialize the game
    createStars();
    
    // Add screen shake animation
    const styleSheet = document.createElement('style');
    styleSheet.innerText = `
      @keyframes shake {
        0% { transform: translate(0, 0); }
        10% { transform: translate(-5px, -5px); }
        20% { transform: translate(5px, 5px); }
        30% { transform: translate(-5px, 5px); }
        40% { transform: translate(5px, -5px); }
        50% { transform: translate(-5px, 0); }
        60% { transform: translate(5px, 0); }
        70% { transform: translate(0, 5px); }
        80% { transform: translate(0, -5px); }
        90% { transform: translate(-2px, 2px); }
        100% { transform: translate(0, 0); }
      }
    `;
    document.head.appendChild(styleSheet);