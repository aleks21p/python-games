
(function(){
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let W, H, scale;
  function resize(){
    const rect = canvas.getBoundingClientRect();
    W = canvas.width = Math.floor(rect.width);
    H = canvas.height = Math.floor(rect.height);
    scale = W / 900; // base scale
  }
  window.addEventListener('resize', resize);
  resize();

  // Game constants (tuned to spec)
  const LEVELS = 6;
  let currentLevel = 1;
  let running = false;

  // Player (arrow) visual geometry (scaled and rotated)
  // Spec: base 48px, height 64px, isosceles triangle pointing right
  function makeArrowPoly(x, y, angle){
    const baseW = Math.round(48 * scale);
    const height = Math.round(64 * scale);
    const halfH = height / 2;
    
    // Triangle points relative to center (before rotation)
    const points = [
      {x: halfH, y: 0}, // tip (right)
      {x: -halfH, y: -baseW/2}, // top-left
      {x: -halfH, y: baseW/2}  // bottom-left
    ];
    
    // Rotate points
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotated = points.map(p => ({
      x: x + p.x * cos - p.y * sin,
      y: y + p.x * sin + p.y * cos
    }));
    
    return rotated;
  }

  // Player state
  const player = {
    x: 140,
    y: 300,
    vy: 0,
    vx: 300, // horizontal px/s (set per level)
    alive: true,
    freezeTime: 0,
    angle: 0 // rotation angle in radians
  };

  // Trail system
  const trail = [];
  const MAX_TRAIL_LENGTH = 15;
  
  // Level state
  let levelWidth = 2500; // Will be set per level
  let levelComplete = false;

  // Physics (tap-to-flip mode)
  const physics = {
    verticalSpeed: 200, // constant vertical speed px/s
    horizontalSpeed: 300 // constant horizontal speed px/s
  };

  // Controls - Tap to Flip
  // Single click/tap flips vertical direction
  // Arrow continuously moves up or down until next tap
  let isMovingUp = true; // direction flag
  let inputActive = false; // disable during menus, enable during gameplay

  function flipDirection() {
    if (!inputActive) return;
    isMovingUp = !isMovingUp;
  }

  window.addEventListener('keydown', e=>{ 
    if ((e.code==='Space' || e.key===' ' || e.code==='KeyK') && inputActive) { 
      flipDirection();
      e.preventDefault(); 
    } 
  });
  
  canvas.addEventListener('pointerdown', (e)=>{ 
    if(inputActive) {
      flipDirection();
      e.preventDefault();
    }
  });

  // Flash overlay
  const flashEl = document.getElementById('flash');
  function flash(ms){
    flashEl.style.transition = 'none';
    flashEl.style.opacity = '1';
    setTimeout(()=>{ flashEl.style.transition = `opacity ${ms}ms ease`; flashEl.style.opacity = '0'; }, 20);
  }

  // Level obstacles
  // We'll define obstacles as polygons (triangles for spikes, rects for walls)
  function tri(x,y,w,h){ return {type:'tri',x,y,w,h}; }
  function rect(x,y,w,h){ return {type:'rect',x,y,w,h}; }

  // Generates level data per exact spec
  function makeLevel(n){
    const objs = [];
    const thickness = Math.round(40 * scale); // floor/ceiling thickness
    const spikeBase = Math.round(32 * scale); // spec: 32px
    const spikeHeight = Math.round(48 * scale); // spec: 48px
    const blockW = Math.round(128 * scale); // spec: 128px
    const blockH = Math.round(32 * scale); // spec: 32px
    const movingWallSize = Math.round(128 * scale); // spec: 128×128
    const laserWidth = Math.round(16 * scale);
    const dashPadW = Math.round(100 * scale);
    const dashPadH = Math.round(20 * scale);

    function addSpikeRowFloor(atX, count){
      for(let i=0;i<count;i++){
        objs.push({type:'tri',x:atX + i*spikeBase,y:H-thickness,w:spikeBase,h:spikeHeight,side:'floor',color:'#FF1744'});
      }
    }
    function addSpikeRowCeil(atX, count){
      for(let i=0;i<count;i++){
        objs.push({type:'tri',x:atX + i*spikeBase,y:thickness,w:spikeBase,h:spikeHeight,side:'ceiling',color:'#FF1744'});
      }
    }
    function addBlock(x,y,color='#5E35B1'){ objs.push({type:'rect',x,y,w:blockW,h:blockH,color}); }
    function addMovingWall(x,y,amp){
      objs.push({type:'movingWall',x0:x,y:y,x,w:movingWallSize,h:movingWallSize,amp,t:0,color:'#2979FF'});
    }
    function addBlinkingSpike(atX, side, freq = 2.0){
      objs.push({type:'blinkSpike', x:atX, y: side==='floor' ? H-thickness : thickness, w:spikeBase, h:spikeHeight, side, blinkFreq:freq, blinkPhase:0, visible:true,color:'#FFD700'});
    }
    function addDashPad(atX, side='floor'){
      const y = side === 'floor' ? H - thickness - dashPadH : thickness;
      objs.push({type:'dashPad', x:atX, y, w:dashPadW, h:dashPadH, side, color:'#FFEA00'});
    }
    function addLaser(x, startY, length, moveSpeed, vertical=true){
      objs.push({type:'laser', x, y:startY, x0:x, y0:startY, w:vertical?laserWidth:length, h:vertical?length:laserWidth, moveSpeed, moveOffset:0, vertical, color:'#E91E63'});
    }
    function addBouncePad(atX){
      objs.push({type:'bouncePad', x:atX, y:H-thickness-Math.round(30*scale), w:Math.round(80*scale), h:Math.round(30*scale), color:'#FF9800'});
    }
    function addGoal(atX){
      objs.push({type:'goal', x:atX, y:0, w:Math.round(80*scale), h:H});
    }

    // LEVEL 1 – INTRO TUNNEL (300 px/s)
    if(n===1){
      player.vx = 300;
      levelWidth = 4500;
      
      // Opening spike patterns
      addSpikeRowCeil(600, 3);
      addSpikeRowFloor(900, 4);
      addSpikeRowCeil(1300, 2);
      
      // First dash pad
      addDashPad(1600, 'floor');
      
      // Rhythm pattern: 3 spike groups
      for(let i=0; i<3; i++){
        addSpikeRowCeil(2000 + i*400, 2);
        addSpikeRowFloor(2100 + i*400, 2);
      }
      
      // Floating blocks
      addBlock(2800, H*0.4);
      addBlock(3000, H*0.6);
      
      // Blinking section
      addBlinkingSpike(3300, 'floor', 1.5);
      addBlinkingSpike(3350, 'ceiling', 1.5);
      
      // Final dash to goal
      addDashPad(3700, 'floor');
      addSpikeRowFloor(3900, 5);
      
      addGoal(levelWidth - 200);
    }
    // LEVEL 2 – BITE CORRIDOR (340 px/s)
    else if(n===2){
      player.vx = 340;
      levelWidth = 5000;
      
      // Alternating spike waves
      for(let i=0;i<8;i++){
        if(i%2===0) addSpikeRowCeil(700+i*spikeBase*4, 2);
        else addSpikeRowFloor(700+i*spikeBase*4, 2);
      }
      
      // Moving laser section
      addLaser(1400, H*0.3, H*0.4, 150, true);
      
      // Block maze
      addBlock(1800, H*0.25);
      addBlock(2000, H*0.55);
      addBlock(2200, H*0.35);
      addBlock(2400, H*0.65);
      
      // Dash pad boost
      addDashPad(2700, 'floor');
      
      // Blinking rhythm section
      for(let i=0; i<4; i++){
        addBlinkingSpike(3000 + i*150, i%2===0?'ceiling':'floor', 2.0);
      }
      
      // Moving walls
      addMovingWall(3600, H/2-movingWallSize/2, 70);
      
      // Final spike gauntlet
      addSpikeRowCeil(4000, 6);
      addSpikeRowFloor(4100, 6);
      
      addGoal(levelWidth - 200);
    }
    // LEVEL 3 – FLOATING GEOMETRY (380 px/s)
    else if(n===3){
      player.vx = 380;
      levelWidth = 5500;
      
      // Opening blocks
      addBlock(600, H*0.3);
      addBlock(900, H*0.5);
      addBlock(1200, H*0.4);
      
      // Bounce pad section
      addBouncePad(1500);
      addBlock(1650, H*0.2);
      
      // Laser maze
      addLaser(1900, H*0.2, H*0.3, 120, true);
      addLaser(2100, H*0.5, H*0.3, 140, true);
      
      // Dash and spike combo
      addDashPad(2400, 'floor');
      addSpikeRowCeil(2600, 4);
      addSpikeRowFloor(2700, 4);
      
      // Blinking corridor
      for(let i=0; i<6; i++){
        addBlinkingSpike(3000 + i*100, i%2===0?'floor':'ceiling', 1.8);
      }
      
      // Moving walls sequence
      addMovingWall(3700, H/2-movingWallSize/2, 80);
      addMovingWall(4000, H/2-movingWallSize/2, 90);
      
      // Final blocks
      addBlock(4400, H*0.35);
      addBlock(4600, H*0.65);
      
      addGoal(levelWidth - 200);
    }
    // LEVEL 4 – THE TEETH (430 px/s)
    else if(n===4){
      player.vx = 430;
      levelWidth = 6000;
      
      // Dense spike opening
      addSpikeRowCeil(600, 5);
      addSpikeRowFloor(700, 6);
      addSpikeRowCeil(900, 8);
      addSpikeRowFloor(1000, 7);
      
      // First dash escape
      addDashPad(1400, 'floor');
      
      // Laser grid
      addLaser(1700, H*0.2, H*0.25, 180, true);
      addLaser(1900, H*0.55, H*0.25, 160, true);
      addLaser(2100, H*0.3, H*0.3, 200, true);
      
      // Block obstacles
      addBlock(2400, H*0.3);
      addBlock(2600, H*0.6);
      addBlock(2800, H*0.4);
      
      // Bounce section
      addBouncePad(3100);
      addSpikeRowCeil(3250, 8);
      
      // Blinking spike rhythm
      for(let i=0; i<8; i++){
        addBlinkingSpike(3600 + i*80, i%3===0?'ceiling':'floor', 2.5);
      }
      
      // Moving wall corridor
      addMovingWall(4200, H/2-movingWallSize/2, 75);
      addMovingWall(4500, H/2-movingWallSize/2, 85);
      addMovingWall(4800, H/2-movingWallSize/2, 65);
      
      // Final spike teeth
      addSpikeRowCeil(5200, 10);
      addSpikeRowFloor(5300, 10);
      
      addGoal(levelWidth - 200);
    }
    // LEVEL 5 – CRUSH CORRIDOR (510 px/s)
    else if(n===5){
      player.vx = 510;
      levelWidth = 6500;
      
      // Opening laser sequence
      addLaser(600, H*0.2, H*0.3, 200, true);
      addLaser(800, H*0.5, H*0.3, 220, true);
      addLaser(1000, H*0.25, H*0.35, 190, true);
      
      // Spike rhythm patterns
      for(let i=0; i<5; i++){
        addSpikeRowCeil(1400 + i*200, 3);
        addSpikeRowFloor(1500 + i*200, 3);
      }
      
      // Dash boost chain
      addDashPad(2500, 'floor');
      addDashPad(2800, 'ceiling');
      
      // Moving wall gauntlet
      addMovingWall(3100, H/2-movingWallSize/2, 80);
      addMovingWall(3400, H/2-movingWallSize/2, 90);
      addMovingWall(3700, H/2-movingWallSize/2, 70);
      addMovingWall(4000, H/2-movingWallSize/2, 95);
      
      // Blinking spike maze
      for(let i=0; i<10; i++){
        addBlinkingSpike(4400 + i*100, i%2===0?'floor':'ceiling', 3.0);
      }
      
      // Block platforms
      addBlock(5200, H*0.3);
      addBlock(5400, H*0.6);
      addBouncePad(5600);
      
      // Final laser + spike combo
      addLaser(5800, H*0.4, H*0.2, 250, true);
      addSpikeRowFloor(6000, 8);
      
      addGoal(levelWidth - 200);
    }
    // LEVEL 6 – FINAL GAUNTLET (560 px/s)
    else if(n===6){
      player.vx = 560;
      levelWidth = 7500;
      
      // Massive spike opening
      for(let i=0;i<10;i++){
        if(i%2===0) { 
          addSpikeRowCeil(600+i*blockW*0.8, 4); 
          addBlock(650+i*blockW*0.8, H*0.35); 
        } else { 
          addSpikeRowFloor(600+i*blockW*0.8, 4); 
          addBlock(650+i*blockW*0.8, H*0.65); 
        }
      }
      
      // Laser grid section
      for(let i=0; i<5; i++){
        addLaser(2000 + i*250, H*0.2 + (i%3)*H*0.2, H*0.25, 180 + i*20, true);
      }
      
      // Dash pad sequence
      addDashPad(3200, 'floor');
      addDashPad(3500, 'ceiling');
      addDashPad(3800, 'floor');
      
      // Moving wall chaos
      addMovingWall(4000, H/2-movingWallSize/2, 64);
      addMovingWall(4300, H/2-movingWallSize/2, 96);
      addMovingWall(4600, H/2-movingWallSize/2, 78);
      addMovingWall(4900, H/2-movingWallSize/2, 88);
      
      // Blinking spike rhythm finale
      for(let i=0; i<12; i++){
        addBlinkingSpike(5300 + i*80, i%3===0?'ceiling':(i%3===1?'floor':'ceiling'), 2.0 + (i%3)*0.5);
      }
      
      // Bounce pad platforming
      addBouncePad(6000);
      addBlock(6150, H*0.2);
      addBouncePad(6300);
      addSpikeRowCeil(6400, 10);
      
      // Final laser + spike gauntlet
      addLaser(6600, H*0.3, H*0.4, 280, true);
      addLaser(6800, H*0.2, H*0.3, 260, true);
      addSpikeRowFloor(7000, 12);
      addSpikeRowCeil(7100, 12);
      
      addGoal(levelWidth - 200);
    }

    // Floor and ceiling slabs
    objs.push({type:'slab',x:-1000,y:0,w:10000,h:thickness,which:'ceiling'});
    objs.push({type:'slab',x:-1000,y:H-thickness,w:10000,h:thickness,which:'floor'});
    return objs;
  }

  let obstacles = makeLevel(currentLevel);

  // Collision helpers
  function pointInTriangle(px,py, a,b,c){
    const area = (p,q,r)=> (q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
    const w1 = area({x:px,y:py}, b, c);
    const w2 = area({x:px,y:py}, c, a);
    const w3 = area({x:px,y:py}, a, b);
    const sameSigns = (x,y)=> (x>=0 && y>=0) || (x<=0 && y<=0);
    return sameSigns(w1,w2) && sameSigns(w2,w3);
  }
  function rectTriCollision(r, triPts){
    // Check if any tri point is inside rect or any rect corner inside triangle
    for(const p of triPts){ if(p.x>=r.x && p.x<=r.x+r.w && p.y>=r.y && p.y<=r.y+r.h) return true; }
    // rect corners
    const corners = [{x:r.x,y:r.y},{x:r.x+r.w,y:r.y},{x:r.x,y:r.y+r.h},{x:r.x+r.w,y:r.y+r.h}];
    for(const c of corners) if(pointInTriangle(c.x,c.y, triPts[0],triPts[1],triPts[2])) return true;
    return false;
  }

  // Update loop
  let last = performance.now();
  let gameTime = 0;
  function update(now){
    const dt = Math.min((now-last)/1000, 0.033);
    last = now;
    gameTime += dt;
    
    if(player.freezeTime > 0){
      player.freezeTime -= dt;
      draw();
      requestAnimationFrame(update);
      return;
    }

    if(running && player.alive){
      // === TAP-TO-FLIP MECHANIC ===
      // Arrow moves at constant vertical speed, either up or down
      // Single tap flips direction instantly
      // No gravity or acceleration - uniform motion
      
      if(isMovingUp){
        // Moving upward at constant speed
        // Screen coords: negative Y = up
        player.y -= physics.verticalSpeed * dt;
        player.angle = -Math.PI / 8; // Tilt up (about -22.5 degrees)
      } else {
        // Moving downward at constant speed
        // Screen coords: positive Y = down
        player.y += physics.verticalSpeed * dt;
        player.angle = Math.PI / 8; // Tilt down (about +22.5 degrees)
      }

      // Add position to trail
      trail.push({x: player.x, y: player.y, angle: player.angle});
      if(trail.length > MAX_TRAIL_LENGTH) trail.shift();
      
      // Horizontal movement: shift world left
      const shift = player.vx * dt;
      for(const o of obstacles){
        if(o.type==='movingWall'){
          // Sine oscillation (spec: 64-96px amplitude)
          o.t += dt * 2; // oscillation speed
          o.x = o.x0 + Math.sin(o.t) * o.amp;
        }
        if(o.type==='blinkSpike'){
          // Update blinking animation
          o.blinkPhase += dt * o.blinkFreq;
          o.visible = Math.floor(o.blinkPhase) % 2 === 0; // Blink on/off
        }
        if(o.type==='laser'){
          // Oscillating lasers
          o.moveOffset += dt * o.moveSpeed;
          if(o.vertical){
            o.y = o.y0 + Math.sin(o.moveOffset / 100) * 100 * scale;
          } else {
            o.x = o.x0 + Math.sin(o.moveOffset / 100) * 100 * scale;
          }
        }
        o.x -= shift;
      }

      // Check if reached goal
      const goal = obstacles.find(o => o.type === 'goal');
      if(goal && player.x >= goal.x && !levelComplete){
        levelComplete = true;
        completeLevel();
      }
      
      // Check dash pads for speed boost
      for(const o of obstacles){
        if(o.type === 'dashPad'){
          const inPad = player.x >= o.x && player.x <= o.x + o.w && player.y >= o.y && player.y <= o.y + o.h;
          if(inPad && !o.activated){
            o.activated = true;
            player.vx *= 1.5; // Speed boost
            setTimeout(() => { player.vx /= 1.5; o.activated = false; }, 800);
          }
        }
      }

      // Collisions (exact polygon checks)
      const poly = makeArrowPoly(player.x, player.y, player.angle);
      for(const o of obstacles){
        if(o.type==='tri'){
          // Spike triangles: pointing up from floor or down from ceiling
          const triPts = (o.side==='floor') ?
            [{x:o.x + o.w/2, y:o.y - o.h}, {x:o.x, y:o.y}, {x:o.x + o.w, y:o.y}] :
            [{x:o.x + o.w/2, y:o.y + o.h}, {x:o.x, y:o.y}, {x:o.x + o.w, y:o.y}];
          // Check if any player point is in triangle
          for(const pp of poly){ if(pointInTriangle(pp.x,pp.y, triPts[0],triPts[1],triPts[2])) { die(); break; } }
          // Check if any triangle point is in player bounds
          const pr = {x:Math.min(...poly.map(p=>p.x)), y:Math.min(...poly.map(p=>p.y)), w:Math.max(...poly.map(p=>p.x))-Math.min(...poly.map(p=>p.x)), h:Math.max(...poly.map(p=>p.y))-Math.min(...poly.map(p=>p.y))};
          for(const tp of triPts){ if(tp.x>=pr.x && tp.x<=pr.x+pr.w && tp.y>=pr.y && tp.y<=pr.y+pr.h) { die(); break; } }
        } else if(o.type==='blinkSpike' && o.visible){
          // Blinking spikes only hurt when visible
          const triPts = (o.side==='floor') ?
            [{x:o.x + o.w/2, y:o.y - o.h}, {x:o.x, y:o.y}, {x:o.x + o.w, y:o.y}] :
            [{x:o.x + o.w/2, y:o.y + o.h}, {x:o.x, y:o.y}, {x:o.x + o.w, y:o.y}];
          for(const pp of poly){ if(pointInTriangle(pp.x,pp.y, triPts[0],triPts[1],triPts[2])) { die(); break; } }
          const pr = {x:Math.min(...poly.map(p=>p.x)), y:Math.min(...poly.map(p=>p.y)), w:Math.max(...poly.map(p=>p.x))-Math.min(...poly.map(p=>p.x)), h:Math.max(...poly.map(p=>p.y))-Math.min(...poly.map(p=>p.y))};
          for(const tp of triPts){ if(tp.x>=pr.x && tp.x<=pr.x+pr.w && tp.y>=pr.y && tp.y<=pr.y+pr.h) { die(); break; } }
        } else if(o.type==='rect' || o.type==='slab' || o.type==='movingWall' || o.type==='laser'){
          const r = {x:o.x, y:o.y, w:o.w, h:o.h};
          for(const pp of poly){ if(pp.x>=r.x && pp.x<=r.x+r.w && pp.y>=r.y && pp.y<=r.y+r.h) { die(); break; } }
        }
        if(!player.alive) break;
      }

      // clamp player y into screen
      if(player.y < 6) player.y = 6;
      if(player.y > H-6) player.y = H-6;
    }
    draw();
    requestAnimationFrame(update);
  }

  // Minimal death SFX (Web Audio API)
  let audioCtx;
  function playDeathSound(){
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  }

  function die(){
    if(!player.alive) return;
    player.alive = false;
    running = false;
    inputActive = false;
    player.freezeTime = 0.08; // freeze 80ms
    playDeathSound();
    // Flash white at 50% opacity
    flashEl.style.transition = 'none';
    flashEl.style.opacity = '0.5';
    flashEl.style.background = '#ffffff';
    setTimeout(()=>{ flashEl.style.transition = 'opacity 120ms ease'; flashEl.style.opacity = '0'; }, 20);
    
    // Show restart button after a short delay
    setTimeout(()=>{ 
      showRestartButton();
    }, 300);
  }
  
  function completeLevel(){
    running = false;
    inputActive = false;
    
    // Flash green
    flashEl.style.transition = 'none';
    flashEl.style.opacity = '0.4';
    flashEl.style.background = '#9ae6b4';
    setTimeout(()=>{ flashEl.style.transition = 'opacity 300ms ease'; flashEl.style.opacity = '0'; }, 20);
    
    // Show completion message
    setTimeout(()=>{
      if(currentLevel < LEVELS){
        // Go to next level
        currentLevel++;
        resetLevel();
        running = true;
        inputActive = true;
      } else {
        // Completed all levels - return to menu
        gameState = 'mainMenu';
        hud.classList.remove('active');
        mainMenu.style.display = 'flex';
        setTimeout(()=>{
          mainMenu.classList.add('active');
          mainMenu.style.opacity = '1';
        }, 20);
      }
    }, 800);
  }

  function resetLevel(){
    player.y = H/2; player.alive = true; isMovingUp = true; player.angle = -Math.PI/8; trail.length = 0; levelComplete = false; obstacles = makeLevel(currentLevel); }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // background (flat dark)
    ctx.fillStyle = '#030306'; ctx.fillRect(0,0,W,H);
    // draw slabs (ceiling/floor)
    for(const o of obstacles){
      if(o.type==='slab'){
        ctx.fillStyle = '#121212'; if(o.which==='floor') ctx.fillStyle = '#0f1724';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    }
    // Draw obstacles
    for(const o of obstacles){
      if(o.type==='tri'){
        const baseW = o.w; const h = o.h;
        ctx.fillStyle = o.color || '#FF1744';
        ctx.shadowColor = 'rgba(255,23,68,0.6)';
        ctx.shadowBlur = Math.round(8 * scale);
        ctx.beginPath();
        if(o.side==='floor'){
          ctx.moveTo(o.x + baseW/2, o.y - h);
          ctx.lineTo(o.x, o.y);
          ctx.lineTo(o.x + baseW, o.y);
        } else {
          ctx.moveTo(o.x + baseW/2, o.y + h);
          ctx.lineTo(o.x, o.y);
          ctx.lineTo(o.x + baseW, o.y);
        }
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
      } else if(o.type==='blinkSpike'){
        if(o.visible){
          const baseW = o.w; const h = o.h;
          ctx.fillStyle = o.color || '#FFD700';
          ctx.shadowColor = 'rgba(255,215,0,0.6)';
          ctx.shadowBlur = Math.round(8 * scale);
          ctx.beginPath();
          if(o.side==='floor'){
            ctx.moveTo(o.x + baseW/2, o.y - h);
            ctx.lineTo(o.x, o.y);
            ctx.lineTo(o.x + baseW, o.y);
          } else {
            ctx.moveTo(o.x + baseW/2, o.y + h);
            ctx.lineTo(o.x, o.y);
            ctx.lineTo(o.x + baseW, o.y);
          }
          ctx.closePath(); ctx.fill();
          ctx.shadowBlur = 0;
        }
      } else if(o.type==='rect'){
        ctx.fillStyle = o.color || '#5E35B1';
        ctx.shadowColor = 'rgba(94,53,177,0.5)';
        ctx.shadowBlur = Math.round(6 * scale);
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.shadowBlur = 0;
      } else if(o.type==='movingWall'){
        ctx.fillStyle = o.color || '#2979FF';
        ctx.shadowColor = 'rgba(41,121,255,0.6)';
        ctx.shadowBlur = Math.round(10 * scale);
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.shadowBlur = 0;
      } else if(o.type==='dashPad'){
        ctx.fillStyle = o.color || '#FFEA00';
        ctx.shadowColor = 'rgba(255,234,0,0.7)';
        ctx.shadowBlur = Math.round(12 * scale);
        ctx.fillRect(o.x, o.y, o.w, o.h);
        // Draw arrows on dash pad
        ctx.fillStyle = '#000';
        const arrowY = o.y + o.h/2;
        for(let i=0; i<2; i++){
          const arrowX = o.x + o.w * (0.3 + i*0.4);
          ctx.beginPath();
          ctx.moveTo(arrowX + 10*scale, arrowY);
          ctx.lineTo(arrowX - 5*scale, arrowY - 5*scale);
          ctx.lineTo(arrowX - 5*scale, arrowY + 5*scale);
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if(o.type==='laser'){
        ctx.fillStyle = o.color || '#E91E63';
        ctx.shadowColor = 'rgba(233,30,99,0.8)';
        ctx.shadowBlur = Math.round(15 * scale);
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.shadowBlur = 0;
      } else if(o.type==='bouncePad'){
        ctx.fillStyle = o.color || '#FF9800';
        ctx.shadowColor = 'rgba(255,152,0,0.7)';
        ctx.shadowBlur = Math.round(10 * scale);
        ctx.beginPath();
        ctx.arc(o.x + o.w/2, o.y, o.w/2, Math.PI, 0);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.lineTo(o.x, o.y + o.h);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if(o.type==='goal'){
        // Goal finish line - green gradient
        const gradient = ctx.createLinearGradient(o.x, 0, o.x + o.w, 0);
        gradient.addColorStop(0, 'rgba(154,230,180,0.3)');
        gradient.addColorStop(0.5, 'rgba(154,230,180,0.8)');
        gradient.addColorStop(1, 'rgba(154,230,180,0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        
        // Draw checkered pattern
        ctx.fillStyle = '#9ae6b4';
        const checkSize = Math.round(20 * scale);
        for(let y = 0; y < o.h; y += checkSize){
          for(let x = 0; x < o.w; x += checkSize){
            if((Math.floor(x/checkSize) + Math.floor(y/checkSize)) % 2 === 0){
              ctx.fillRect(o.x + x, y, checkSize, checkSize);
            }
          }
        }
      }
    }
    
    // Draw trail
    for(let i = 0; i < trail.length; i++){
      const t = trail[i];
      const opacity = (i / trail.length) * 0.4; // Fade from 0 to 0.4
      const size = (i / trail.length) * scale; // Grow from 0 to scale
      
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      
      ctx.shadowColor = `rgba(0,245,255,${opacity * 0.8})`;
      ctx.shadowBlur = Math.round(8 * size);
      ctx.fillStyle = `rgba(0,245,255,${opacity})`;
      
      // Small triangle for trail
      const trailSize = 24 * size;
      const trailHeight = 32 * size;
      ctx.beginPath();
      ctx.moveTo(trailHeight/2, 0);
      ctx.lineTo(-trailHeight/2, -trailSize/2);
      ctx.lineTo(-trailHeight/2, trailSize/2);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
    
    // Draw player arrow (spec: base 48px, height 64px, neon cyan with glow)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    const baseW = Math.round(48 * scale);
    const height = Math.round(64 * scale);
    const halfH = height / 2;
    
    ctx.shadowColor = 'rgba(0,245,255,0.6)';
    ctx.shadowBlur = Math.round(12 * scale);
    ctx.fillStyle = '#00F5FF';
    ctx.beginPath();
    ctx.moveTo(halfH, 0); // tip (right)
    ctx.lineTo(-halfH, -baseW/2); // top-left
    ctx.lineTo(-halfH, baseW/2); // bottom-left
    ctx.closePath();
    ctx.fill();
    
    // Optional outline (2-3px black)
    ctx.lineWidth = Math.max(2, Math.round(2.5 * scale));
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.moveTo(halfH, 0);
    ctx.lineTo(-halfH, -baseW/2);
    ctx.lineTo(-halfH, baseW/2);
    ctx.closePath();
    ctx.stroke();
    
    ctx.restore();

    // HUD: tiny progress bar
    if(running){
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(12,12,160,8);
      const progress = Math.min(1, player.x / levelWidth);
      ctx.fillStyle = '#9ae6b4'; ctx.fillRect(12,12, progress * 160, 8);
    }
  }

  // === MENU SYSTEM ===
  const mainMenu = document.getElementById('mainMenu');
  const levelSelect = document.getElementById('levelSelect');
  const pauseMenu = document.getElementById('pauseMenu');
  const hud = document.getElementById('hud');
  const levelGrid = document.getElementById('levelGrid');
  const restartOverlay = document.getElementById('restartOverlay');

  let gameState = 'mainMenu'; // 'mainMenu' | 'levelSelect' | 'playing' | 'paused'
  let unlockedLevels = 6; // All levels unlocked for now
  
  // Show restart button on death
  function showRestartButton(){
    restartOverlay.classList.add('active');
  }
  
  function hideRestartButton(){
    restartOverlay.classList.remove('active');
  }
  
  // Restart button click handler
  document.getElementById('restartDeath').addEventListener('click', ()=>{
    hideRestartButton();
    resetLevel();
    running = true;
    inputActive = true;
  });

  // Build level grid
  for(let i=1;i<=LEVELS;i++){
    const btn = document.createElement('button');
    btn.className = 'level-button';
    btn.textContent = i;
    if(i > unlockedLevels) btn.classList.add('locked');
    btn.onclick = ()=> {
      if(i <= unlockedLevels) selectLevel(i);
    };
    levelGrid.appendChild(btn);
  }

  // Main Menu → Level Select
  document.getElementById('startArrow').addEventListener('click', ()=>{
    if(gameState !== 'mainMenu') return;
    gameState = 'levelSelect';
    
    // Animate: arrow expands and slides up
    const arrow = document.getElementById('startArrow');
    arrow.style.transition = 'transform 0.25s ease-out, opacity 0.2s ease';
    arrow.style.transform = 'translate(-50%, -200%) scale(1.3)';
    arrow.style.opacity = '0';
    
    // Fade out main menu
    setTimeout(()=>{
      mainMenu.style.opacity = '0';
      setTimeout(()=>{
        mainMenu.classList.remove('active');
        mainMenu.style.display = 'none';
        
        // Slide in level select
        levelSelect.style.display = 'flex';
        setTimeout(()=>{
          levelSelect.classList.add('active','show');
        }, 20);
      }, 300);
    }, 100);
  });

  // Level Select → Main Menu (back button)
  document.getElementById('backToMain').addEventListener('click', ()=>{
    if(gameState !== 'levelSelect') return;
    gameState = 'mainMenu';
    
    levelSelect.classList.remove('show');
    setTimeout(()=>{
      levelSelect.classList.remove('active');
      levelSelect.style.display = 'none';
      
      // Reset and show main menu
      const arrow = document.getElementById('startArrow');
      arrow.style.transition = 'none';
      arrow.style.transform = 'translate(-50%,-50%) scale(1)';
      arrow.style.opacity = '1';
      mainMenu.style.display = 'flex';
      setTimeout(()=>{
        mainMenu.classList.add('active');
        mainMenu.style.opacity = '1';
      }, 20);
    }, 350);
  });

  // Select level and start game
  function selectLevel(n){
    currentLevel = n;
    gameState = 'playing';
    isMovingUp = true; // reset to moving up
    
    // Animate: selected level expands, others fade
    const buttons = levelGrid.querySelectorAll('.level-button');
    buttons.forEach((btn,i)=>{
      if(i+1 === n){
        btn.style.transition = 'transform 0.3s ease, opacity 0.25s ease';
        btn.style.transform = 'scale(1.12)';
      } else {
        btn.style.opacity = '0.3';
      }
    });
    
    // Fade to black and start game
    setTimeout(()=>{
      levelSelect.style.opacity = '0';
      flashEl.style.background = '#000';
      flashEl.style.transition = 'opacity 0.3s ease';
      flashEl.style.opacity = '1';
      
      setTimeout(()=>{
        levelSelect.classList.remove('active','show');
        levelSelect.style.display = 'none';
        
        // Reset level select state
        buttons.forEach(btn=>{
          btn.style.transform = '';
          btn.style.opacity = '';
          btn.style.transition = '';
        });
        
        // Start game
        resetLevel();
        running = true;
        inputActive = true;
        hud.classList.add('active');
        
        // Fade in
        setTimeout(()=>{
          flashEl.style.opacity = '0';
          flashEl.style.background = '#fff';
        }, 100);
      }, 300);
    }, 400);
  }

  // Pause handling
  document.getElementById('pauseIcon').addEventListener('click', ()=>{
    if(gameState === 'playing') pauseGame();
  });

  window.addEventListener('keydown', e=>{
    if(e.key === 'Escape' && gameState === 'playing') pauseGame();
  });

  function pauseGame(){
    if(!running) return;
    gameState = 'paused';
    running = false;
    isHolding = false;
    inputActive = false;
    pauseMenu.style.display = 'flex';
    setTimeout(()=> pauseMenu.classList.add('active'), 20);
  }

  document.getElementById('resumeBtn').addEventListener('click', ()=>{
    if(gameState !== 'paused') return;
    gameState = 'playing';
    running = true;
    inputActive = true;
    isHolding = false;
    pauseMenu.style.opacity = '0';
    setTimeout(()=>{
      pauseMenu.classList.remove('active');
      pauseMenu.style.display = 'none';
      pauseMenu.style.opacity = '1';
    }, 200);
  });

  document.getElementById('restartBtn').addEventListener('click', ()=>{
    if(gameState !== 'paused') return;
    pauseMenu.style.opacity = '0';
    setTimeout(()=>{
      pauseMenu.classList.remove('active');
      pauseMenu.style.display = 'none';
      pauseMenu.style.opacity = '1';
      gameState = 'playing';
      inputActive = true;
      isHolding = false;
      resetLevel();
      running = true;
    }, 200);
  });

  document.getElementById('exitBtn').addEventListener('click', ()=>{
    if(gameState !== 'paused') return;
    pauseMenu.style.opacity = '0';
    setTimeout(()=>{
      pauseMenu.classList.remove('active');
      pauseMenu.style.display = 'none';
      pauseMenu.style.opacity = '1';
      hud.classList.remove('active');
      
      // Return to main menu
      gameState = 'mainMenu';
      running = false;
      inputActive = false;
      isHolding = false;
      const arrow = document.getElementById('startArrow');
      arrow.style.transition = 'none';
      arrow.style.transform = 'translate(-50%,-50%) scale(1)';
      arrow.style.opacity = '1';
      mainMenu.style.display = 'flex';
      setTimeout(()=>{
        mainMenu.classList.add('active');
        mainMenu.style.opacity = '1';
      }, 20);
    }, 200);
  });

  // start the loop
  requestAnimationFrame(update);
})();
