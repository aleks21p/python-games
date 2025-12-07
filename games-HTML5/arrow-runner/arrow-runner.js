
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
  // Spec: base 40px, height 52px, isosceles triangle pointing right
  function makeArrowPoly(x, y, angle){
    const baseW = Math.round(40 * scale);
    const height = Math.round(52 * scale);
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
    baseVx: 300, // base speed for the level
    alive: true,
    freezeTime: 0,
    angle: 0 // rotation angle in radians
  };

  // Trail system
  const trail = [];
  const MAX_TRAIL_LENGTH = 30;
  
  // Level state
  let levelWidth = 2500; // Will be set per level
  let levelComplete = false;
  
  // Speed scaling
  let gameStartTime = 0;
  let lastSpeedIncreaseTime = 0;

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
    const bigSpikeBase = Math.round(64 * scale); // big spike: double width
    const bigSpikeHeight = Math.round(H/2 - thickness); // half the vertical level
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
    function addBigSpikeFloor(atX){
      objs.push({type:'tri',x:atX,y:H-thickness,w:bigSpikeBase,h:bigSpikeHeight,side:'floor',color:'#FF0000'});
    }
    function addBigSpikeCeil(atX){
      objs.push({type:'tri',x:atX,y:thickness,w:bigSpikeBase,h:bigSpikeHeight,side:'ceiling',color:'#FF0000'});
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

    // LEVEL 1 – WINDING HORIZONTAL PATH (300 px/s)
    if(n===1){
      player.vx = 300;
      player.baseVx = 300;
      levelWidth = 12000;
      
      // Section 1: Upper corridor - NO OVERLAPS
      addSpikeRowCeil(400, 2);
      addBigSpikeCeil(500);
      addBlock(580, H*0.25);
      addSpikeRowCeil(720, 3);
      addBlock(850, H*0.28);
      addBlinkingSpike(1000, 'ceiling', 2.0);
      addSpikeRowCeil(1100, 2);
      addBlock(1180, H*0.26);
      addBigSpikeCeil(1320);
      addSpikeRowCeil(1400, 2);
      addBlock(1500, H*0.27);
      
      // Section 2: Mid-lower corridor - NO OVERLAPS
      addSpikeRowFloor(1650, 3);
      addBlock(1770, H*0.65);
      addSpikeRowCeil(1920, 2);
      addBigSpikeFloor(2000);
      addBigSpikeCeil(2080);
      addBlock(2180, H*0.68);
      addSpikeRowFloor(2330, 2);
      addBlinkingSpike(2450, 'floor', 1.8);
      addSpikeRowCeil(2550, 3);
      addBlock(2680, H*0.63);
      addSpikeRowFloor(2820, 3);
      addMovingWall(2950, H*0.15, 35);
      addBigSpikeCeil(3080);
      
      // Section 3: Lower corridor - NO OVERLAPS
      addSpikeRowCeil(3220, 2);
      addBlock(3300, H*0.75);
      addSpikeRowFloor(3450, 3);
      addBigSpikeCeil(3580);
      addBigSpikeFloor(3660);
      addBlock(3750, H*0.73);
      addSpikeRowCeil(3900, 3);
      addBlinkingSpike(4030, 'ceiling', 2.1);
      addBlock(4150, H*0.76);
      addSpikeRowFloor(4280, 2);
      addMovingWall(4380, H*0.5, 40);
      addBigSpikeCeil(4500);
      addSpikeRowCeil(4600, 2);
      
      // Section 4: Mid corridor - NO OVERLAPS
      addSpikeRowFloor(4750, 3);
      addBlock(4880, H*0.55);
      addSpikeRowCeil(5020, 2);
      addBigSpikeFloor(5100);
      addBigSpikeCeil(5180);
      addDashPad(5270, 'floor');
      addBlock(5400, H*0.53);
      addSpikeRowFloor(5550, 2);
      addBlinkingSpike(5650, 'floor', 1.9);
      addSpikeRowCeil(5750, 3);
      addBlock(5880, H*0.57);
      addMovingWall(6020, H*0.15, 40);
      addBigSpikeFloor(6150);
      addSpikeRowFloor(6230, 2);
      
      // Section 5: Upper-mid corridor - NO OVERLAPS
      addSpikeRowCeil(6380, 3);
      addBlock(6520, H*0.35);
      addSpikeRowFloor(6660, 2);
      addBigSpikeCeil(6750);
      addBlock(6840, H*0.33);
      addSpikeRowCeil(6980, 4);
      addLaser(7100, H*0.55, H*0.2, 120, true);
      addBigSpikeFloor(7180);
      addBlock(7270, H*0.37);
      addSpikeRowFloor(7410, 3);
      addBlinkingSpike(7550, 'ceiling', 2.0);
      addSpikeRowCeil(7670, 2);
      addBlock(7780, H*0.34);
      addMovingWall(7920, H*0.65, 45);
      addBigSpikeCeil(8050);
      
      // Section 6: Mid-lower corridor - NO OVERLAPS
      addSpikeRowFloor(8200, 4);
      addBlock(8340, H*0.6);
      addSpikeRowCeil(8490, 3);
      addBigSpikeFloor(8620);
      addBigSpikeCeil(8700);
      addBlock(8810, H*0.62);
      addMovingWall(8950, H*0.35, 50);
      addSpikeRowFloor(9080, 3);
      addBlinkingSpike(9210, 'floor', 1.7);
      addSpikeRowCeil(9330, 2);
      addBlock(9440, H*0.58);
      addBigSpikeFloor(9570);
      addMovingWall(9680, H*0.15, 45);
      
      // Section 7: Lower corridor - NO OVERLAPS
      addSpikeRowCeil(9820, 3);
      addBlock(9950, H*0.72);
      addSpikeRowFloor(10100, 2);
      addBigSpikeCeil(10190);
      addBigSpikeFloor(10270);
      addBlock(10370, H*0.74);
      addSpikeRowCeil(10510, 2);
      addLaser(10620, H*0.4, H*0.25, 140, true);
      addSpikeRowFloor(10740, 3);
      addBlinkingSpike(10870, 'ceiling', 1.8);
      addBlock(10990, H*0.71);
      addSpikeRowCeil(11130, 2);
      addBlinkingSpike(11250, 'floor', 2.0);
      
      addGoal(levelWidth - 200);
    }
    // LEVEL 2 – BITE CORRIDOR (340 px/s) - NO CAMPING, NO OVERLAPS
    else if(n===2){
      player.vx = 340;
      player.baseVx = 340;
      levelWidth = 6500;
      
      // Section 1: Opening gauntlet
      addSpikeRowCeil(400, 3);
      addBlock(530, H*0.25);
      addSpikeRowFloor(650, 4);
      addBigSpikeCeil(780);
      addBlock(870, H*0.6);
      addBigSpikeFloor(980);
      addSpikeRowCeil(1060, 3);
      addBlock(1190, H*0.35);
      addSpikeRowFloor(1320, 2);
      
      // Section 2: Laser combo
      addLaser(1480, H*0.2, H*0.25, 150, true);
      addSpikeRowFloor(1580, 4);
      addBlock(1730, H*0.5);
      addSpikeRowCeil(1860, 3);
      addBigSpikeCeil(1990);
      addBigSpikeFloor(2070);
      addBlock(2200, H*0.38);
      addMovingWall(2330, H*0.55, 45);
      
      // Section 3: Dense spikes
      addSpikeRowCeil(2500, 5);
      addBlock(2660, H*0.32);
      addSpikeRowFloor(2790, 4);
      addBigSpikeCeil(2920);
      addBlinkingSpike(3050, 'ceiling', 2.0);
      addBlock(3180, H*0.68);
      addSpikeRowFloor(3310, 5);
      addBigSpikeFloor(3470);
      addSpikeRowCeil(3550, 3);
      addBlinkingSpike(3680, 'floor', 1.8);
      
      // Section 4: Moving walls
      addMovingWall(3820, H*0.25, 60);
      addSpikeRowFloor(3990, 4);
      addBlock(4140, H*0.5);
      addSpikeRowCeil(4270, 3);
      addBigSpikeCeil(4390);
      addBigSpikeFloor(4470);
      addMovingWall(4600, H*0.6, 55);
      addSpikeRowCeil(4770, 2);
      addBlock(4890, H*0.35);
      
      // Section 5: Dash gauntlet
      addDashPad(5030, 'floor');
      addSpikeRowCeil(5150, 6);
      addBlock(5340, H*0.42);
      addSpikeRowFloor(5470, 5);
      addBigSpikeCeil(5630);
      addBigSpikeFloor(5710);
      addBlock(5840, H*0.58);
      addSpikeRowCeil(5970, 3);
      addSpikeRowFloor(6090, 4);
      addBlock(6240, H*0.36);
      
      addGoal(levelWidth - 200);
    }
    // LEVEL 3 – FLOATING GEOMETRY (380 px/s) - NO CAMPING, NO OVERLAPS
    else if(n===3){
      player.vx = 380;
      player.baseVx = 380;
      levelWidth = 7000;
      
      // Section 1: Opening
      addBlock(500, H*0.3);
      addSpikeRowFloor(630, 4);
      addSpikeRowCeil(780, 3);
      addBigSpikeCeil(910);
      addBlock(1020, H*0.65);
      addBigSpikeFloor(1150);
      addBlock(1230, H*0.38);
      addSpikeRowCeil(1360, 4);
      addSpikeRowFloor(1510, 3);
      addBlock(1640, H*0.55);
      
      // Section 2: Laser section
      addLaser(1780, H*0.2, H*0.28, 120, true);
      addSpikeRowFloor(1900, 5);
      addBigSpikeCeil(2060);
      addBlock(2170, H*0.45);
      addBigSpikeFloor(2300);
      addSpikeRowCeil(2380, 3);
      addBlock(2510, H*0.62);
      addMovingWall(2650, H*0.35, 50);
      
      // Section 3: Bounce section
      addBouncePad(2820);
      addSpikeRowCeil(2940, 6);
      addBigSpikeCeil(3130);
      addBlock(3240, H*0.28);
      addSpikeRowFloor(3370, 4);
      addBigSpikeFloor(3520);
      addBlock(3630, H*0.72);
      addBlinkingSpike(3760, 'ceiling', 1.9);
      addBlock(3890, H*0.42);
      addBlinkingSpike(4020, 'floor', 2.1);
      
      // Section 4: Laser grid
      addLaser(4160, H*0.25, H*0.3, 140, true);
      addSpikeRowCeil(4280, 5);
      addBlock(4440, H*0.58);
      addSpikeRowFloor(4570, 4);
      addLaser(4700, H*0.45, H*0.3, 130, true);
      addBigSpikeCeil(4820);
      addBigSpikeFloor(4900);
      addBlock(5030, H*0.35);
      addSpikeRowCeil(5160, 3);
      addSpikeRowFloor(5290, 5);
      addBlock(5450, H*0.68);
      
      // Section 5: Dash section
      addDashPad(5590, 'floor');
      addSpikeRowCeil(5710, 7);
      addBlock(5900, H*0.38);
      addSpikeRowFloor(6030, 6);
      addBigSpikeCeil(6190);
      addBigSpikeFloor(6270);
      addBlock(6400, H*0.62);
      addSpikeRowCeil(6530, 4);
      addMovingWall(6650, H*0.25, 60);
      
      addGoal(levelWidth - 200);
    }
    // LEVEL 4 – THE TEETH (430 px/s) - NO CAMPING, NO OVERLAPS
    else if(n===4){
      player.vx = 430;
      player.baseVx = 430;
      levelWidth = 7500;
      
      // Section 1
      addSpikeRowCeil(500, 5);
      addBlock(660, H*0.42);
      addSpikeRowFloor(790, 6);
      addBigSpikeCeil(950);
      addBigSpikeFloor(1030);
      addBlock(1140, H*0.58);
      addSpikeRowCeil(1270, 5);
      addBlock(1420, H*0.38);
      
      // Section 2
      addSpikeRowFloor(1570, 7);
      addBlock(1750, H*0.62);
      addSpikeRowCeil(1880, 6);
      addBigSpikeFloor(2010);
      addBigSpikeCeil(2090);
      addBlock(2210, H*0.45);
      addMovingWall(2350, H*0.3, 55);
      addSpikeRowFloor(2520, 5);
      addBlock(2670, H*0.55);
      
      // Section 3
      addLaser(2810, H*0.25, H*0.3, 170, true);
      addSpikeRowCeil(2930, 8);
      addBlock(3110, H*0.48);
      addSpikeRowFloor(3240, 7);
      addBigSpikeCeil(3400);
      addBigSpikeFloor(3480);
      addBlock(3600, H*0.52);
      addSpikeRowCeil(3730, 6);
      addBlock(3880, H*0.38);
      
      // Section 4
      addDashPad(4020, 'floor');
      addSpikeRowCeil(4140, 10);
      addBlock(4350, H*0.42);
      addSpikeRowFloor(4480, 9);
      addBigSpikeCeil(4660);
      addBigSpikeFloor(4740);
      addBlock(4870, H*0.58);
      addSpikeRowCeil(5000, 7);
      addBlock(5160, H*0.45);
      
      // Section 5
      addBouncePad(5310);
      addSpikeRowCeil(5440, 11);
      addBlock(5650, H*0.32);
      addSpikeRowFloor(5780, 10);
      addBigSpikeCeil(5980);
      addBigSpikeFloor(6060);
      addBlock(6190, H*0.68);
      addSpikeRowCeil(6320, 8);
      addBlock(6480, H*0.42);
      
      // Section 6
      addLaser(6620, H*0.25, H*0.35, 200, true);
      addSpikeRowFloor(6740, 12);
      addBlock(6960, H*0.52);
      addSpikeRowCeil(7090, 11);
      addBigSpikeFloor(7310);
      addBlinkingSpike(7440, 'ceiling', 2.8);
      addBlock(7570, H*0.48);
      
      addGoal(levelWidth - 200);
    }
    // LEVEL 5 – CRUSH CORRIDOR (510 px/s) - NO CAMPING, NO OVERLAPS
    else if(n===5){
      player.vx = 510;
      player.baseVx = 510;
      levelWidth = 8000;
      
      // Section 1
      addLaser(500, H*0.22, H*0.3, 200, true);
      addSpikeRowCeil(620, 8);
      addBlock(820, H*0.45);
      addSpikeRowFloor(950, 7);
      addBigSpikeCeil(1120);
      addBigSpikeFloor(1200);
      addBlock(1330, H*0.55);
      addSpikeRowCeil(1460, 6);
      addBlock(1610, H*0.42);
      
      // Section 2
      addSpikeRowFloor(1750, 9);
      addMovingWall(1930, H*0.3, 50);
      addBlock(2090, H*0.5);
      addSpikeRowCeil(2220, 8);
      addBigSpikeCeil(2400);
      addBigSpikeFloor(2480);
      addBlock(2610, H*0.65);
      addSpikeRowFloor(2740, 7);
      addBlock(2900, H*0.35);
      
      // Section 3
      addDashPad(3050, 'floor');
      addSpikeRowCeil(3170, 12);
      addBlock(3420, H*0.42);
      addSpikeRowFloor(3550, 11);
      addBigSpikeCeil(3750);
      addBigSpikeFloor(3830);
      addBlock(3960, H*0.58);
      addSpikeRowCeil(4090, 9);
      addBlock(4270, H*0.45);
      
      // Section 4
      addDashPad(4420, 'ceiling');
      addSpikeRowFloor(4540, 13);
      addBlock(4780, H*0.62);
      addSpikeRowCeil(4910, 12);
      addBigSpikeFloor(5110);
      addBigSpikeCeil(5190);
      addBlock(5320, H*0.38);
      addSpikeRowFloor(5450, 10);
      addBlock(5630, H*0.55);
      
      // Section 5
      addMovingWall(5780, H*0.25, 75);
      addSpikeRowCeil(5950, 14);
      addBlock(6200, H*0.48);
      addSpikeRowFloor(6330, 13);
      addBigSpikeCeil(6540);
      addBigSpikeFloor(6620);
      addBlock(6750, H*0.52);
      addSpikeRowCeil(6880, 11);
      addBlock(7050, H*0.38);
      
      // Section 6
      addLaser(7200, H*0.25, H*0.35, 210, true);
      addSpikeRowFloor(7330, 15);
      addBlock(7600, H*0.52);
      addSpikeRowCeil(7730, 14);
      addBlinkingSpike(7900, 'ceiling', 3.0);
      addBlock(8030, H*0.48);
      
      addGoal(levelWidth - 200);
    }
    // LEVEL 6 – FINAL GAUNTLET (560 px/s) - NO CAMPING, NO OVERLAPS
    else if(n===6){
      player.vx = 560;
      player.baseVx = 560;
      levelWidth = 9000;
      
      // Section 1
      addSpikeRowCeil(500, 7);
      addBlock(710, H*0.42);
      addSpikeRowFloor(840, 8);
      addBigSpikeCeil(1040);
      addBlock(1150, H*0.58);
      addBigSpikeFloor(1280);
      addSpikeRowCeil(1360, 6);
      addBlock(1510, H*0.38);
      addMovingWall(1660, H*0.3, 55);
      
      // Section 2
      addLaser(1840, H*0.25, H*0.35, 190, true);
      addSpikeRowFloor(1960, 9);
      addBlock(2170, H*0.48);
      addSpikeRowCeil(2300, 8);
      addBigSpikeFloor(2500);
      addBigSpikeCeil(2580);
      addBlock(2710, H*0.52);
      addSpikeRowFloor(2840, 7);
      addBlock(3010, H*0.42);
      
      // Section 3
      addDashPad(3160, 'floor');
      addSpikeRowCeil(3280, 14);
      addBlock(3570, H*0.38);
      addSpikeRowFloor(3700, 13);
      addBigSpikeCeil(3940);
      addBigSpikeFloor(4020);
      addBlock(4150, H*0.62);
      addSpikeRowCeil(4280, 11);
      addBlock(4470, H*0.45);
      
      // Section 4
      addDashPad(4620, 'ceiling');
      addSpikeRowFloor(4740, 15);
      addBlock(5010, H*0.68);
      addSpikeRowCeil(5140, 14);
      addBigSpikeFloor(5380);
      addBigSpikeCeil(5460);
      addBlock(5590, H*0.32);
      addSpikeRowFloor(5720, 12);
      addBlock(5920, H*0.55);
      
      // Section 5
      addMovingWall(6080, H*0.25, 80);
      addSpikeRowCeil(6250, 16);
      addBlock(6530, H*0.42);
      addSpikeRowFloor(6660, 15);
      addBigSpikeCeil(6910);
      addMovingWall(7040, H*0.6, 75);
      addBigSpikeFloor(7170);
      addBlock(7300, H*0.58);
      addSpikeRowCeil(7430, 13);
      addBlock(7640, H*0.38);
      
      // Section 6
      addBouncePad(7790);
      addLaser(7910, H*0.25, H*0.4, 220, true);
      addSpikeRowCeil(8030, 18);
      addBlock(8370, H*0.32);
      addSpikeRowFloor(8500, 17);
      addBigSpikeCeil(8780);
      addBlinkingSpike(8910, 'ceiling', 3.5);
      addBlock(9040, H*0.68);
      
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
      // === PROGRESSIVE DIFFICULTY ===
      // Increase speed by 10% every 10 seconds
      const currentTime = performance.now();
      if(gameStartTime === 0) gameStartTime = currentTime;
      
      const timeElapsed = (currentTime - gameStartTime) / 1000; // in seconds
      const speedIncreaseInterval = 10; // seconds
      
      if(timeElapsed - lastSpeedIncreaseTime >= speedIncreaseInterval){
        player.vx = player.baseVx * Math.pow(1.1, Math.floor(timeElapsed / speedIncreaseInterval));
        lastSpeedIncreaseTime = Math.floor(timeElapsed / speedIncreaseInterval) * speedIncreaseInterval;
      }
      
      // === TAP-TO-FLIP MECHANIC ===
      // Arrow moves at constant vertical speed, either up or down
      // Single tap flips direction instantly
      // No gravity or acceleration - uniform motion
      
      if(isMovingUp){
        // Moving upward at constant speed
        // Screen coords: negative Y = up
        player.y -= physics.verticalSpeed * dt;
        player.angle = -Math.PI / 4; // Tilt up 45 degrees
      } else {
        // Moving downward at constant speed
        // Screen coords: positive Y = down
        player.y += physics.verticalSpeed * dt;
        player.angle = Math.PI / 4; // Tilt down 45 degrees
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
    player.y = H/2; 
    player.alive = true; 
    player.vx = player.baseVx; // Reset to base speed
    isMovingUp = true; 
    player.angle = -Math.PI/8; 
    trail.length = 0; 
    levelComplete = false; 
    obstacles = makeLevel(currentLevel);
    
    // Reset speed scaling timers
    gameStartTime = 0;
    lastSpeedIncreaseTime = 0;
  }

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
        
        // Outer glow
        ctx.shadowColor = 'rgba(255,23,68,0.8)';
        ctx.shadowBlur = Math.round(12 * scale);
        
        // Main spike fill
        ctx.fillStyle = o.color || '#FF1744';
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
        ctx.closePath(); 
        ctx.fill();
        
        // Dark outline for depth
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = Math.round(2 * scale);
        ctx.stroke();
      } else if(o.type==='blinkSpike'){
        if(o.visible){
          const baseW = o.w; const h = o.h;
          
          // Pulsing glow effect
          const pulseIntensity = 0.6 + Math.sin(Date.now() / 200) * 0.4;
          ctx.shadowColor = `rgba(255,215,0,${pulseIntensity})`;
          ctx.shadowBlur = Math.round(15 * scale);
          
          ctx.fillStyle = o.color || '#FFD700';
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
          ctx.closePath(); 
          ctx.fill();
          
          // Outline
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = Math.round(2 * scale);
          ctx.stroke();
        }
      } else if(o.type==='rect'){
        // Block with gradient for volume
        const gradient = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
        const baseColor = o.color || '#5E35B1';
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(0.5, baseColor);
        gradient.addColorStop(1, '#3d2470'); // Darker bottom
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(94,53,177,0.6)';
        ctx.shadowBlur = Math.round(8 * scale);
        ctx.fillRect(o.x, o.y, o.w, o.h);
        
        // Top highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(o.x, o.y, o.w, Math.round(4 * scale));
        
        // Dark outline
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = Math.round(2 * scale);
        ctx.strokeRect(o.x, o.y, o.w, o.h);
      } else if(o.type==='movingWall'){
        // Moving wall with animated pulse
        const pulseSize = Math.sin(Date.now() / 300) * 3 * scale;
        
        const gradient = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
        gradient.addColorStop(0, '#2979FF');
        gradient.addColorStop(0.5, '#1565C0');
        gradient.addColorStop(1, '#2979FF');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(41,121,255,0.8)';
        ctx.shadowBlur = Math.round(15 * scale) + pulseSize;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        
        // Inner lines for tech look
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = Math.round(2 * scale);
        for(let i = 1; i < 4; i++){
          ctx.beginPath();
          ctx.moveTo(o.x, o.y + (o.h / 4) * i);
          ctx.lineTo(o.x + o.w, o.y + (o.h / 4) * i);
          ctx.stroke();
        }
      } else if(o.type==='dashPad'){
        // Dash pad with animated stripes
        const stripePulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
        
        ctx.fillStyle = o.color || '#FFEA00';
        ctx.shadowColor = `rgba(255,234,0,${stripePulse})`;
        ctx.shadowBlur = Math.round(18 * scale);
        ctx.fillRect(o.x, o.y, o.w, o.h);
        
        // Diagonal stripes
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        const stripeWidth = Math.round(8 * scale);
        for(let i = -o.h; i < o.w; i += stripeWidth * 2){
          ctx.beginPath();
          ctx.moveTo(o.x + i, o.y + o.h);
          ctx.lineTo(o.x + i + o.h, o.y);
          ctx.lineTo(o.x + i + o.h + stripeWidth, o.y);
          ctx.lineTo(o.x + i + stripeWidth, o.y + o.h);
          ctx.closePath();
          ctx.fill();
        }
        
        // Draw arrows on dash pad
        ctx.fillStyle = '#000';
        const arrowY = o.y + o.h/2;
        const arrowSize = Math.round(8 * scale);
        for(let i=0; i<3; i++){
          const arrowX = o.x + o.w * (0.2 + i*0.3);
          ctx.beginPath();
          ctx.moveTo(arrowX + arrowSize, arrowY);
          ctx.lineTo(arrowX - arrowSize/2, arrowY - arrowSize/2);
          ctx.lineTo(arrowX - arrowSize/2, arrowY + arrowSize/2);
          ctx.closePath();
          ctx.fill();
        }
      } else if(o.type==='laser'){
        // Pulsing laser beam
        const laserPulse = Math.sin(Date.now() / 100) * 0.4 + 0.6;
        
        ctx.fillStyle = o.color || '#E91E63';
        ctx.shadowColor = `rgba(233,30,99,${laserPulse})`;
        ctx.shadowBlur = Math.round(20 * scale);
        ctx.fillRect(o.x, o.y, o.w, o.h);
        
        // Inner bright core
        ctx.shadowBlur = 0;
        const coreW = o.vertical ? o.w * 0.3 : o.w;
        const coreH = o.vertical ? o.h : o.h * 0.3;
        const coreX = o.vertical ? o.x + o.w * 0.35 : o.x;
        const coreY = o.vertical ? o.y : o.y + o.h * 0.35;
        
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(coreX, coreY, coreW, coreH);
      } else if(o.type==='bouncePad'){
        // Bounce pad with spring effect
        const bouncePhase = Math.abs(Math.sin(Date.now() / 400));
        const squish = 1 - bouncePhase * 0.2;
        
        ctx.save();
        ctx.translate(o.x + o.w/2, o.y + o.h);
        ctx.scale(1, squish);
        
        ctx.fillStyle = o.color || '#FF9800';
        ctx.shadowColor = 'rgba(255,152,0,0.7)';
        ctx.shadowBlur = Math.round(12 * scale);
        ctx.beginPath();
        ctx.arc(0, -o.h, o.w/2, Math.PI, 0);
        ctx.lineTo(o.w/2, 0);
        ctx.lineTo(-o.w/2, 0);
        ctx.closePath();
        ctx.fill();
        
        // Spring coils
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = Math.round(3 * scale);
        const coils = 3;
        for(let i = 0; i < coils; i++){
          const y = (-o.h * 0.6) + (i * o.h * 0.3);
          ctx.beginPath();
          ctx.arc(-o.w/4, y, o.w/6, 0, Math.PI);
          ctx.stroke();
        }
        
        ctx.restore();
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
    
    // Draw trail BEHIND the arrow - white glowing shadow
    for(let i = 0; i < trail.length; i++){
      const t = trail[i];
      const opacity = (i / trail.length) * 0.8; // Fade from 0 to 0.8
      const size = (i / trail.length); // Grow from 0 to 1
      
      // Offset position to come from behind (left side of arrow)
      const offsetDistance = (1 - size) * 30 * scale; // Earlier trail positions offset more
      
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      
      // Strong white glow
      ctx.shadowColor = `rgba(255,255,255,${opacity})`;
      ctx.shadowBlur = Math.round(25 * scale * size);
      ctx.fillStyle = `rgba(255,255,255,${opacity * 0.7})`;
      
      // Triangle for trail - proportional to arrow size, offset behind
      const trailBase = 40 * scale * size * 0.8;
      const trailHeight = 52 * scale * size * 0.8;
      ctx.beginPath();
      ctx.moveTo(trailHeight/2 - offsetDistance, 0);
      ctx.lineTo(-trailHeight/2 - offsetDistance, -trailBase/2);
      ctx.lineTo(-trailHeight/2 - offsetDistance, trailBase/2);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
    
    // Draw player arrow (spec: base 40px, height 52px, neon cyan with glow)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    const baseW = Math.round(40 * scale);
    const height = Math.round(52 * scale);
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
  const levelDisplay = document.getElementById('levelDisplay');
  const prevLevelBtn = document.getElementById('prevLevel');
  const nextLevelBtn = document.getElementById('nextLevel');
  const startLevelBtn = document.getElementById('startLevel');
  const restartOverlay = document.getElementById('restartOverlay');
  const previewCanvas = document.getElementById('previewCanvas');
  const previewCtx = previewCanvas.getContext('2d');

  let gameState = 'mainMenu'; // 'mainMenu' | 'levelSelect' | 'playing' | 'paused'
  let unlockedLevels = 6; // All levels unlocked for now
  let selectedLevel = 1; // Currently selected level in menu
  
  // Draw level preview
  function drawLevelPreview(levelNum){
    const pw = previewCanvas.width;
    const ph = previewCanvas.height;
    const previewScale = ph / H;
    
    previewCtx.clearRect(0, 0, pw, ph);
    previewCtx.fillStyle = '#030306';
    previewCtx.fillRect(0, 0, pw, ph);
    
    // Create temporary obstacles for this level
    const tempObstacles = [];
    const tempThickness = 40 * previewScale;
    const tempSpikeBase = 32 * previewScale;
    const tempSpikeHeight = 48 * previewScale;
    const tempBigSpikeBase = 64 * previewScale;
    const tempBigSpikeHeight = (ph/2 - tempThickness);
    const tempBlockW = 128 * previewScale;
    const tempBlockH = 32 * previewScale;
    
    // Draw first 600px worth of level obstacles (scaled to preview)
    const previewRange = 1200; // Show first 1200px of level
    const previewLevel = makeLevel(levelNum);
    
    // Draw floor and ceiling
    previewCtx.fillStyle = '#121212';
    previewCtx.fillRect(0, 0, pw, tempThickness);
    previewCtx.fillStyle = '#0f1724';
    previewCtx.fillRect(0, ph - tempThickness, pw, tempThickness);
    
    for(const o of previewLevel){
      if(o.x > previewRange) continue;
      const px = (o.x / previewRange) * pw;
      
      if(o.type === 'tri'){
        const w = (o.w / scale) * previewScale;
        const h = (o.h / scale) * previewScale;
        
        previewCtx.fillStyle = o.color || '#FF1744';
        previewCtx.beginPath();
        if(o.side === 'floor'){
          previewCtx.moveTo(px + w/2, ph - tempThickness - h);
          previewCtx.lineTo(px, ph - tempThickness);
          previewCtx.lineTo(px + w, ph - tempThickness);
        } else {
          previewCtx.moveTo(px + w/2, tempThickness + h);
          previewCtx.lineTo(px, tempThickness);
          previewCtx.lineTo(px + w, tempThickness);
        }
        previewCtx.closePath();
        previewCtx.fill();
      } else if(o.type === 'rect'){
        const w = (o.w / scale) * previewScale;
        const h = (o.h / scale) * previewScale;
        const y = (o.y / scale) * previewScale;
        previewCtx.fillStyle = o.color || '#5E35B1';
        previewCtx.fillRect(px, y, w, h);
      }
    }
    
    // Draw difficulty indicator
    previewCtx.fillStyle = '#00F5FF';
    previewCtx.font = 'bold 16px Montserrat, sans-serif';
    previewCtx.textAlign = 'right';
    const speeds = [300, 340, 380, 430, 510, 560];
    const lengths = [12000, 6500, 7000, 7500, 8000, 9000];
    previewCtx.fillText(`Speed: ${speeds[levelNum-1]} px/s`, pw - 10, 25);
    previewCtx.fillText(`Length: ${lengths[levelNum-1]} px`, pw - 10, 45);
  }
  
  // Update level display and arrow states
  function updateLevelDisplay(){
    levelDisplay.textContent = `LVL ${selectedLevel}`;
    prevLevelBtn.disabled = selectedLevel <= 1;
    nextLevelBtn.disabled = selectedLevel >= unlockedLevels;
    drawLevelPreview(selectedLevel);
  }
  
  // Arrow navigation handlers
  prevLevelBtn.addEventListener('click', ()=>{
    if(selectedLevel > 1){
      selectedLevel--;
      updateLevelDisplay();
    }
  });
  
  nextLevelBtn.addEventListener('click', ()=>{
    if(selectedLevel < unlockedLevels){
      selectedLevel++;
      updateLevelDisplay();
    }
  });
  
  // Start button handler
  startLevelBtn.addEventListener('click', ()=>{
    selectLevel(selectedLevel);
  });
  
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

  // Main Menu → Level Select
  document.getElementById('startArrow').addEventListener('click', ()=>{
    if(gameState !== 'mainMenu') return;
    gameState = 'levelSelect';
    
    // Reset to level 1
    selectedLevel = 1;
    updateLevelDisplay();
    
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
    
    // Fade to black and start game
    levelSelect.style.opacity = '0';
    flashEl.style.background = '#000';
    flashEl.style.transition = 'opacity 0.3s ease';
    flashEl.style.opacity = '1';
    
    setTimeout(()=>{
      levelSelect.classList.remove('active','show');
      levelSelect.style.display = 'none';
      
      // Start game
      resetLevel();
      running = true;
      inputActive = true;
      hud.classList.add('active');
      
      // Fade in
      setTimeout(()=>{
        flashEl.style.opacity = '0';
        flashEl.style.background = '#fff';
      }, 50);
    }, 300);
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
