class Dragon extends GameObject {
  constructor(x, y) {
    super(x, y, 300, 300);
    this.name = 'Dragon';
    this.hunger = 50;
    this.thirst = 50;
    this.happiness = 50;
    this.energy = 80;
    this.cleanliness = 80;
    this.health = 100;
    this.weight = 20;
    this.discipline = 50;
    this.experience = 0;
    this.level = 1;
    this.age = 0;
    this.sleeping = false;
    this.sick = false;
    
    const personalities = ['Energetic', 'Lazy', 'Gluttonous', 'Smart', 'Shy'];
    this.personality = personalities[Math.floor(Math.random() * personalities.length)];
    const foods = ['🍖', '🥩', '🍗', '🐟'];
    this.favoriteFood = foods[Math.floor(Math.random() * foods.length)];
    
    this.bobTime = 0;
    this.eyeBlink = 0;
    this.blinkTimer = 0;
    this.emotion = 'happy';
    this.emotionTimer = 0;
    this.breathTimer = 0;
    this.wingAngle = 0;
    this.scale = 1;

    // Evolution
    this.element = 'Base'; // Base, Fire, Water, Electric, Dark, Light
    this.stage = 'Baby'; // Baby, Teen, Adult, Elder
  }

  update(dt) {
    this.age += dt;
    this.bobTime += dt;
    this.breathTimer += dt;
    this.wingAngle = Math.sin(this.bobTime * (this.element === 'Electric' ? 4 : 2)) * 0.3;

    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.eyeBlink = 1;
      this.blinkTimer = 2 + Math.random() * 3;
      setTimeout(() => this.eyeBlink = 0, 150);
    }

    if (this.emotionTimer > 0) this.emotionTimer -= dt;
    else if (this.sleeping) this.emotion = 'sleeping';
    else if (this.sick) this.emotion = 'sick';
    else if (this.happiness > 60) this.emotion = 'happy';
    else this.emotion = 'sad';

    const isNight = window.game && (window.game.dayTime < 6 || window.game.dayTime > 18);
    
    let hungerRate = 0.5, energyRate = 0.5, happyRate = 0.5;
    if (this.personality === 'Gluttonous') hungerRate = 0.8;
    if (this.personality === 'Lazy') { energyRate = 0.2; happyRate = 0.6; }
    if (this.personality === 'Energetic') { energyRate = 0.8; hungerRate = 0.6; }

    if (!this.sleeping) {
      this.hunger = Math.max(0, this.hunger - dt * hungerRate);
      this.thirst = Math.max(0, this.thirst - dt * 0.8);
      this.happiness = Math.max(0, this.happiness - dt * happyRate);
      this.energy = Math.max(0, this.energy - dt * (isNight ? 1.5 : energyRate));
      this.cleanliness = Math.max(0, this.cleanliness - dt * 0.5);
      this.discipline = Math.max(0, this.discipline - dt * 0.1);
    } else {
      this.energy = Math.min(100, this.energy + dt * 2.0);
      this.hunger = Math.max(0, this.hunger - dt * 1.5);
    }

    if (this.hunger < 10 || this.thirst < 10 || this.cleanliness < 10 || this.weight > 80 || this.weight < 2) this.sick = true;
    
    // Weight consequences
    if (this.weight > 70) this.energy = Math.max(0, this.energy - dt * 0.5); // Fatter means less energy
    if (this.weight < 5) this.health = Math.max(0, this.health - dt * 1.0); // Starving
    if (this.sick) this.health = Math.max(0, this.health - dt * 4.0);
    else this.health = Math.min(100, this.health + dt * 0.2);

    if (this.experience >= this.level * 100) {
      this.experience -= this.level * 100;
      this.level++;
      this.checkEvolution();
    }
    
    // Smooth scaling
    let targetScale = 1.5;
    if (this.stage === 'Teen') targetScale = 2.0;
    if (this.stage === 'Adult') targetScale = 2.6;
    if (this.stage === 'Elder') targetScale = 3.2;
    if (this.stage === 'Mythic') targetScale = 4.0;
    this.scale += (targetScale - this.scale) * dt * 2;

    // Mythic stage passive rewards
    if (this.stage === 'Mythic') {
      this.health = Math.min(100, this.health + dt * 0.5);
      this.energy = Math.min(100, this.energy + dt * 0.5);
      if (Math.random() < 0.05 && window.game) {
        window.game.particles.push(new Particle(this.x + (Math.random()-0.5)*150, this.y - 50 + (Math.random()-0.5)*150, this.element));
      }
    }
  }

  checkEvolution() {
    if (this.level >= 3 && this.stage === 'Baby') {
      this.stage = 'Teen';
      if (this.happiness < 30) this.element = 'Dark';
      else if (this.happiness > 80 && this.cleanliness > 80) this.element = 'Light';
      else if (this.energy > 80) this.element = 'Electric';
      else if (this.cleanliness > 70) this.element = 'Water';
      else if (this.hunger > 70) this.element = 'Fire';
      else this.element = 'Earth';
    } else if (this.level >= 6 && this.stage === 'Teen') {
      this.stage = 'Adult';
      if (this.element === 'Fire' && this.discipline > 70) this.element = 'Magma';
      else if (this.element === 'Water' && this.happiness > 70) this.element = 'Ice';
      else if (this.element === 'Earth' && this.cleanliness > 70) this.element = 'Nature';
      else if (this.element === 'Electric' && this.energy > 70) this.element = 'Storm';
      else if (this.element === 'Dark' && this.discipline < 30) this.element = 'Void';
      else if (this.element === 'Light' && this.happiness > 90) this.element = 'Holy';
    } else if (this.level >= 10 && this.stage === 'Adult') {
      this.stage = 'Elder';
      if (this.element === 'Magma') this.element = 'Inferno';
      else if (this.element === 'Ice') this.element = 'Leviathan';
      else if (this.element === 'Nature') this.element = 'Gaia';
      else if (this.element === 'Storm') this.element = 'Plasma';
      else if (this.element === 'Void') this.element = 'Abyss';
      else if (this.element === 'Holy') this.element = 'Celestial';
    } else if (this.level >= 15 && this.stage === 'Elder') {
      this.stage = 'Mythic';
      if (this.element === 'Inferno' && this.energy > 80) this.element = 'Supernova';
      else if (this.element === 'Leviathan' && this.cleanliness > 80) this.element = 'Tsunami';
      else if (this.element === 'Gaia' && this.happiness > 80) this.element = 'WorldTree';
      else if (this.element === 'Plasma' && this.discipline > 80) this.element = 'Singularity';
      else if (this.element === 'Abyss' && this.happiness < 30) this.element = 'Chaos';
      else if (this.element === 'Celestial' && this.happiness > 90) this.element = 'Divine';
    }
  }

  getPalette() {
    const p = {
      Base: { body1: '#3daa6e', body2: '#1a5c32', belly1: '#c8e8c0', belly2: '#8bc88a', spike: '#daa520', wing1: 'rgba(168,216,160,0.8)', wing2: 'rgba(100,180,120,0.6)', eye: '#c75000' },
      Earth: { body1: '#8b5a2b', body2: '#5c3a21', belly1: '#d2b48c', belly2: '#a0522d', spike: '#228b22', wing1: 'rgba(139,90,43,0.8)', wing2: 'rgba(85,107,47,0.6)', eye: '#8fbc8f' },
      Fire: { body1: '#cc0000', body2: '#800000', belly1: '#ff9933', belly2: '#cc6600', spike: '#ffcc00', wing1: 'rgba(255,153,51,0.8)', wing2: 'rgba(204,0,0,0.6)', eye: '#ffff00' },
      Water: { body1: '#0066cc', body2: '#003366', belly1: '#99ccff', belly2: '#3399ff', spike: '#00ffff', wing1: 'rgba(153,204,255,0.8)', wing2: 'rgba(0,102,204,0.6)', eye: '#00ffff' },
      Electric: { body1: '#ffcc00', body2: '#b38f00', belly1: '#ffffcc', belly2: '#e6b800', spike: '#9933ff', wing1: 'rgba(255,255,102,0.8)', wing2: 'rgba(153,51,255,0.6)', eye: '#cc00ff' },
      Dark: { body1: '#262626', body2: '#0d0d0d', belly1: '#660066', belly2: '#330033', spike: '#ff0000', wing1: 'rgba(102,0,102,0.8)', wing2: 'rgba(26,26,26,0.9)', eye: '#ff0000' },
      Light: { body1: '#ffffff', body2: '#e6e6e6', belly1: '#ffffcc', belly2: '#ffea00', spike: '#ffea00', wing1: 'rgba(255,255,255,0.9)', wing2: 'rgba(255,234,0,0.7)', eye: '#00ccff' },
      Magma: { body1: '#ff3300', body2: '#990000', belly1: '#ffb366', belly2: '#cc3300', spike: '#ff6600', wing1: 'rgba(255,102,0,0.8)', wing2: 'rgba(153,0,0,0.6)', eye: '#ffcc00' },
      Inferno: { body1: '#ff0066', body2: '#660000', belly1: '#ffcc99', belly2: '#ff3300', spike: '#ffffff', wing1: 'rgba(255,51,153,0.8)', wing2: 'rgba(255,102,0,0.6)', eye: '#ffffff' },
      Ice: { body1: '#e6ffff', body2: '#66ccff', belly1: '#ffffff', belly2: '#b3e6ff', spike: '#0066cc', wing1: 'rgba(230,255,255,0.8)', wing2: 'rgba(102,204,255,0.6)', eye: '#0033cc' },
      Leviathan: { body1: '#000066', body2: '#000033', belly1: '#0033cc', belly2: '#000099', spike: '#00ffff', wing1: 'rgba(0,51,204,0.8)', wing2: 'rgba(0,255,255,0.6)', eye: '#00ffff' },
      Nature: { body1: '#33cc33', body2: '#006600', belly1: '#99ff99', belly2: '#339933', spike: '#ff3399', wing1: 'rgba(153,255,153,0.8)', wing2: 'rgba(0,153,0,0.6)', eye: '#ff0066' },
      Gaia: { body1: '#00ff00', body2: '#003300', belly1: '#ccffcc', belly2: '#009900', spike: '#ffff00', wing1: 'rgba(204,255,204,0.8)', wing2: 'rgba(51,204,51,0.6)', eye: '#ffffff' },
      Storm: { body1: '#9999ff', body2: '#333399', belly1: '#ccccff', belly2: '#6666cc', spike: '#ffff00', wing1: 'rgba(153,153,255,0.8)', wing2: 'rgba(51,51,153,0.6)', eye: '#ffff00' },
      Plasma: { body1: '#ff00ff', body2: '#660066', belly1: '#ff99ff', belly2: '#cc00cc', spike: '#00ffff', wing1: 'rgba(255,51,255,0.8)', wing2: 'rgba(0,255,255,0.6)', eye: '#00ffff' },
      Void: { body1: '#000000', body2: '#1a001a', belly1: '#330033', belly2: '#1a001a', spike: '#800080', wing1: 'rgba(0,0,0,0.8)', wing2: 'rgba(77,0,77,0.6)', eye: '#800080' },
      Abyss: { body1: '#0a0a0a', body2: '#000000', belly1: '#4d004d', belly2: '#1a001a', spike: '#ff00ff', wing1: 'rgba(26,0,26,0.8)', wing2: 'rgba(255,0,255,0.6)', eye: '#ff00ff' },
      Holy: { body1: '#ffffcc', body2: '#cccc00', belly1: '#ffffff', belly2: '#ffff99', spike: '#ffcc00', wing1: 'rgba(255,255,204,0.8)', wing2: 'rgba(204,204,0,0.6)', eye: '#ffcc00' },
      Celestial: { body1: '#ffffff', body2: '#e6f2ff', belly1: '#ffffff', belly2: '#cce6ff', spike: '#00ccff', wing1: 'rgba(255,255,255,0.8)', wing2: 'rgba(0,204,255,0.6)', eye: '#ffffff' },
      Supernova: { body1: '#ff0000', body2: '#ff9900', belly1: '#ffffcc', belly2: '#ffcc00', spike: '#ffffff', wing1: 'rgba(255,255,0,0.9)', wing2: 'rgba(255,100,0,0.8)', eye: '#ffffff' },
      Tsunami: { body1: '#001133', body2: '#004488', belly1: '#66ccff', belly2: '#0088cc', spike: '#00ffff', wing1: 'rgba(0,255,255,0.8)', wing2: 'rgba(0,100,255,0.6)', eye: '#00ffff' },
      WorldTree: { body1: '#1a3300', body2: '#336600', belly1: '#99ff33', belly2: '#66cc00', spike: '#ff33cc', wing1: 'rgba(150,255,100,0.8)', wing2: 'rgba(50,150,50,0.6)', eye: '#ff99ff' },
      Singularity: { body1: '#000000', body2: '#330066', belly1: '#9900ff', belly2: '#6600cc', spike: '#00ffff', wing1: 'rgba(150,0,255,0.8)', wing2: 'rgba(50,0,150,0.6)', eye: '#00ffff' },
      Chaos: { body1: '#1a0000', body2: '#330000', belly1: '#cc0000', belly2: '#800000', spike: '#ff0000', wing1: 'rgba(255,0,0,0.8)', wing2: 'rgba(100,0,0,0.6)', eye: '#ff0000' },
      Divine: { body1: '#ffffff', body2: '#ffffcc', belly1: '#ffffff', belly2: '#ffffee', spike: '#ffcc00', wing1: 'rgba(255,255,255,0.9)', wing2: 'rgba(255,255,200,0.8)', eye: '#ffcc00' }
    };
    return p[this.element] || p.Base;
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const bobY = this.y + this.height / 2 + Math.sin(this.bobTime * (this.sleeping ? 0.8 : 1.5)) * 8;
    const s = this.scale;
    const pal = this.getPalette();

    ctx.save();
    ctx.translate(cx, bobY);
    ctx.scale(s, s);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 115, 90, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aura for Elder/Light/Dark/Mythic/advanced elements
    if (this.stage === 'Elder' || this.stage === 'Mythic' || ['Light','Dark','Holy','Celestial','Void','Abyss','Inferno','Leviathan','Gaia','Plasma','Supernova','Tsunami','WorldTree','Singularity','Chaos','Divine'].includes(this.element)) {
        const auraSize = (this.stage === 'Mythic' ? 150 : 120) + Math.sin(this.bobTime * 3) * 10;
        const auraGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, auraSize);
        if (this.element === 'Light') {
            auraGrad.addColorStop(0, 'rgba(255,255,200,0.4)');
            auraGrad.addColorStop(1, 'rgba(255,255,255,0)');
        } else if (this.element === 'Dark') {
            auraGrad.addColorStop(0, 'rgba(100,0,100,0.4)');
            auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
        } else if (this.element === 'Electric') {
            auraGrad.addColorStop(0, 'rgba(255,255,0,0.3)');
            auraGrad.addColorStop(1, 'rgba(255,255,0,0)');
        } else if (this.element === 'Fire') {
            auraGrad.addColorStop(0, 'rgba(255,100,0,0.3)');
            auraGrad.addColorStop(1, 'rgba(255,0,0,0)');
        } else if (this.element === 'Water') {
            auraGrad.addColorStop(0, 'rgba(0,200,255,0.3)');
            auraGrad.addColorStop(1, 'rgba(0,100,255,0)');
        } else {
            auraGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
            auraGrad.addColorStop(1, 'rgba(255,255,255,0)');
        }
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Wings
    if (this.stage !== 'Baby') {
      this.drawWing(ctx, -1, pal);
      this.drawWing(ctx, 1, pal);
    }

    // Tail
    ctx.strokeStyle = pal.body2; 
    ctx.lineWidth = 18; 
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(30, 80);
    const tx = 110 + Math.sin(this.bobTime * 2) * 20;
    const ty = 70 + Math.cos(this.bobTime * 2) * 10;
    
    if (this.stage === 'Elder') {
        ctx.quadraticCurveTo(100, 120, tx + 20, ty + 10);
    } else {
        ctx.quadraticCurveTo(80, 100, tx, ty);
    }
    ctx.stroke();
    
    // Tail spikes
    ctx.fillStyle = pal.spike;
    const spikeCount = this.stage === 'Elder' ? 5 : (this.stage === 'Adult' ? 4 : 3);
    for(let i=1; i<=spikeCount; i++) {
        const t = i/(spikeCount+1);
        const sx = 30 * (1-t) + tx * t;
        const sy = 80 * (1-t) + ty * t - 10;
        ctx.beginPath();
        ctx.moveTo(sx - 5, sy + 5);
        ctx.lineTo(sx, sy - 15 - (this.stage==='Elder'?5:0));
        ctx.lineTo(sx + 5, sy + 5);
        ctx.fill();
    }

    // Tail tip based on element
    this.drawTailTip(ctx, tx, ty, pal);

    // Weight affects body size
    const wRatio = Math.max(0.5, Math.min(1.8, this.weight / 25));
    const bodyW = 70 * wRatio;
    const bellyW = 45 * wRatio;

    // Body Base
    const bodyGrad = ctx.createRadialGradient(-10, 10, 10, 0, 30, 80);
    bodyGrad.addColorStop(0, pal.body1);
    bodyGrad.addColorStop(1, pal.body2);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 35, bodyW, 85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    const bellyGrad = ctx.createLinearGradient(0, -10, 0, 100);
    bellyGrad.addColorStop(0, pal.belly1);
    bellyGrad.addColorStop(1, pal.belly2);
    ctx.fillStyle = bellyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 45, bellyW, 65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly stripes (Plates)
    ctx.strokeStyle = pal.body2;
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-30 + i*2.5, 5 + i * 16);
      ctx.quadraticCurveTo(0, 15 + i * 16, 30 - i*2.5, 5 + i * 16);
      ctx.stroke();
      
      // Highlight on plates
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-25 + i*2.5, 2 + i * 16);
      ctx.quadraticCurveTo(0, 12 + i * 16, 25 - i*2.5, 2 + i * 16);
      ctx.stroke();
    }

    // Body Scales Pattern (detailed)
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for(let i=0; i<8; i++) {
        for(let j=0; j<4; j++) {
            ctx.beginPath();
            ctx.arc(-bodyW*0.8 + j*12 + (i%2)*8, -10 + i*14, 3, 0, Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bodyW*0.8 - j*12 - (i%2)*8, -10 + i*14, 3, 0, Math.PI);
            ctx.fill();
        }
    }

    // Back Spikes
    ctx.fillStyle = pal.spike;
    const backSpikes = this.stage === 'Elder' ? 6 : (this.stage === 'Adult' ? 5 : 4);
    for(let i=0; i<backSpikes; i++) {
        const size = this.stage === 'Elder' ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(-65 + i*4, -10 + i*18);
        ctx.lineTo(-85 + i*7 * size, -15 + i*18);
        ctx.lineTo(-60 + i*5, 0 + i*18);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(65 - i*4, -10 + i*18);
        ctx.lineTo(85 - i*7 * size, -15 + i*18);
        ctx.lineTo(60 - i*5, 0 + i*18);
        ctx.fill();
    }

    // Head Base
    const headGrad = ctx.createRadialGradient(-10, -65, 10, 0, -55, 50);
    headGrad.addColorStop(0, pal.body1);
    headGrad.addColorStop(1, pal.body2);
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, -60, 55, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, -75, 30, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    if (this.stage !== 'Baby') {
        const hornGrad = ctx.createLinearGradient(0, -80, 0, -160);
        hornGrad.addColorStop(0, pal.spike);
        hornGrad.addColorStop(1, pal.belly1);
        ctx.fillStyle = hornGrad;
        
        let hornLen = -120;
        if (this.stage === 'Adult') hornLen = -150;
        if (this.stage === 'Elder') hornLen = -180;
        
        for (let side of [-1, 1]) {
          ctx.beginPath();
          if (this.element === 'Electric') {
              // Jagged horns
              ctx.moveTo(side * 25, -95);
              ctx.lineTo(side * 45, -110);
              ctx.lineTo(side * 35, -120);
              ctx.lineTo(side * 50, hornLen);
              ctx.lineTo(side * 20, -115);
              ctx.lineTo(side * 15, -95);
          } else if (this.element === 'Water') {
              // Swept back smooth horns
              ctx.moveTo(side * 25, -95);
              ctx.quadraticCurveTo(side * 60, -100, side * 70, hornLen + 20);
              ctx.quadraticCurveTo(side * 30, -120, side * 15, -95);
          } else {
              // Standard curved
              ctx.moveTo(side * 25, -95);
              ctx.quadraticCurveTo(side * 45, -110, side * 40, hornLen);
              ctx.quadraticCurveTo(side * 15, -110, side * 15, -95);
          }
          ctx.fill();
          
          // Horn ridges (if normal)
          if (this.element !== 'Water' && this.element !== 'Electric') {
              ctx.strokeStyle = 'rgba(0,0,0,0.2)';
              ctx.lineWidth = 2;
              for(let r=1; r<= (this.stage==='Elder'?5:3); r++) {
                  ctx.beginPath();
                  ctx.moveTo(side * 22, -95 - r*12);
                  ctx.lineTo(side * 35, -100 - r*12);
                  ctx.stroke();
              }
          }
        }
    }

    // Ears/Fins
    ctx.fillStyle = pal.body2;
    for (let side of [-1, 1]) {
        if (this.element === 'Water') {
            // Fin-like ears
            ctx.beginPath();
            ctx.moveTo(side * 50, -65);
            ctx.quadraticCurveTo(side * 80, -80, side * 90, -50);
            ctx.quadraticCurveTo(side * 70, -40, side * 52, -45);
            ctx.fill();
            ctx.fillStyle = pal.wing1;
            ctx.beginPath();
            ctx.moveTo(side * 52, -62);
            ctx.quadraticCurveTo(side * 75, -70, side * 80, -52);
            ctx.quadraticCurveTo(side * 65, -45, side * 54, -48);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(side * 50, -65);
            ctx.lineTo(side * 75, -75);
            ctx.lineTo(side * 52, -45);
            ctx.fill();
            ctx.fillStyle = pal.belly1;
            ctx.beginPath();
            ctx.moveTo(side * 52, -62);
            ctx.lineTo(side * 70, -71);
            ctx.lineTo(side * 54, -48);
            ctx.fill();
        }
        ctx.fillStyle = pal.body2;
    }

    // Nostrils
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(-14, -42, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(14, -42, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    // Nostril flares
    ctx.strokeStyle = pal.body1;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-14, -42, 7, Math.PI, Math.PI*1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(14, -42, 7, Math.PI*1.5, Math.PI*2); ctx.stroke();

    // Smoke from nostrils when sick
    if (this.sick) {
      ctx.fillStyle = 'rgba(100,100,100,0.4)';
      for (let i = 0; i < 4; i++) {
        const sy = -45 - i * 15 - Math.sin(this.bobTime * 3 + i) * 8;
        ctx.beginPath(); ctx.arc(-14 + Math.sin(this.bobTime + i) * 6, sy, 6 - i, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(14 + Math.sin(this.bobTime + i + 1) * 6, sy, 6 - i, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Eyes
    if (this.sleeping) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 22 - 12, -65); 
        ctx.quadraticCurveTo(side * 22, -58, side * 22 + 12, -65);
        ctx.stroke();
      }
      // Zzz
      ctx.fillStyle = '#aaf'; ctx.font = 'bold 24px sans-serif';
      ctx.fillText('Z', 45, -85 + Math.sin(this.bobTime * 2) * 5);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('z', 65, -100 + Math.sin(this.bobTime * 2 + 1) * 5);
    } else {
      for (let side of [-1, 1]) {
        // Eye socket shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(side * 22, -62, 18, 16, 0, 0, Math.PI * 2); ctx.fill();
        
        // Eye white (or glow for some elements)
        if (this.element === 'Dark' || this.element === 'Light') {
            ctx.fillStyle = pal.eye;
            ctx.shadowColor = pal.eye;
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
        }
        
        ctx.beginPath(); ctx.ellipse(side * 22, -62, 15, this.eyeBlink ? 2 : 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; // reset
        
        if (!this.eyeBlink) {
          if (this.element !== 'Dark' && this.element !== 'Light') {
              // Iris
              ctx.fillStyle = pal.eye;
              ctx.beginPath(); ctx.arc(side * 22, -62, 8, 0, Math.PI * 2); ctx.fill();
              // Pupil (slit)
              ctx.fillStyle = '#000';
              ctx.beginPath(); ctx.ellipse(side * 22, -62, 3, 7, 0, 0, Math.PI * 2); ctx.fill();
          } else if (this.element === 'Dark') {
              // Slit pupil only
              ctx.fillStyle = '#000';
              ctx.beginPath(); ctx.ellipse(side * 22, -62, 2, 8, 0, 0, Math.PI * 2); ctx.fill();
          }
          // Highlights
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(side * 22 + 4, -66, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(side * 22 - 3, -58, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        // Eyebrow
        ctx.strokeStyle = pal.body2;
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (this.emotion === 'sad' || this.emotion === 'sick') {
            ctx.moveTo(side * 22 - 14, -74); ctx.lineTo(side * 22 + 14, -80);
        } else if (this.emotion === 'playing' || this.element === 'Dark') {
            ctx.moveTo(side * 22 - 14, -80); ctx.lineTo(side * 22 + 14, -74);
        } else {
            ctx.moveTo(side * 22 - 14, -78); ctx.quadraticCurveTo(side * 22, -82, side * 22 + 14, -78);
        }
        ctx.stroke();
      }
    }

    // Mouth
    ctx.strokeStyle = pal.body2; 
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    if (this.emotion === 'happy' || this.emotion === 'eating') {
      ctx.beginPath(); ctx.arc(0, -45, 20, 0.2, Math.PI - 0.2); ctx.stroke();
      // Cheek blushes
      ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
      ctx.beginPath(); ctx.ellipse(-32, -45, 10, 6, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(32, -45, 10, 6, 0, 0, Math.PI*2); ctx.fill();
    } else if (this.emotion === 'sad' || this.emotion === 'sick') {
      ctx.beginPath(); ctx.arc(0, -30, 15, Math.PI + 0.3, -0.3); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-12, -38); ctx.lineTo(12, -38); ctx.stroke();
      // Fangs
      if (this.stage !== 'Baby') {
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.moveTo(-8, -38); ctx.lineTo(-5, -30); ctx.lineTo(-2, -38); ctx.fill();
          ctx.beginPath(); ctx.moveTo(8, -38); ctx.lineTo(5, -30); ctx.lineTo(2, -38); ctx.fill();
      }
    }

    // Fire/Element breath when playing
    if (this.emotion === 'playing') {
      const breathLen = 60 + Math.sin(this.bobTime * 20) * 30;
      const grad = ctx.createRadialGradient(0, -40, 5, 0, -40 - breathLen/2, breathLen);
      
      if (this.element === 'Water') {
          grad.addColorStop(0, '#fff'); grad.addColorStop(0.2, '#00ffff'); grad.addColorStop(1, 'rgba(0,100,255,0)');
      } else if (this.element === 'Electric') {
          grad.addColorStop(0, '#fff'); grad.addColorStop(0.2, '#ffff00'); grad.addColorStop(1, 'rgba(200,0,255,0)');
      } else if (this.element === 'Dark') {
          grad.addColorStop(0, '#000'); grad.addColorStop(0.2, '#ff0000'); grad.addColorStop(1, 'rgba(100,0,100,0)');
      } else {
          grad.addColorStop(0, '#fff'); grad.addColorStop(0.2, '#ffeb3b'); grad.addColorStop(0.6, '#ff4500'); grad.addColorStop(1, 'rgba(255,0,0,0)');
      }
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-20, -40); 
      ctx.quadraticCurveTo(-35, -40 - breathLen/2, 0, -40 - breathLen); 
      ctx.quadraticCurveTo(35, -40 - breathLen/2, 20, -40);
      ctx.fill();
    }

    // Feet
    for (let side of [-1, 1]) {
      // Leg
      ctx.fillStyle = pal.body2;
      ctx.beginPath(); ctx.ellipse(side * 35, 100, 24, 20, 0, 0, Math.PI * 2); ctx.fill();
      
      // Foot
      const footGrad = ctx.createLinearGradient(side*35, 100, side*35, 120);
      footGrad.addColorStop(0, pal.body1); footGrad.addColorStop(1, pal.body2);
      ctx.fillStyle = footGrad;
      ctx.beginPath(); ctx.ellipse(side * 35, 115, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
      
      // Claws
      ctx.fillStyle = pal.spike;
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath(); 
        ctx.moveTo(side * 35 + c * 12 - 5, 122);
        ctx.lineTo(side * 35 + c * 12, 134);
        ctx.lineTo(side * 35 + c * 12 + 5, 122);
        ctx.fill();
      }
    }

    // Arms
    for (let side of [-1, 1]) {
        ctx.fillStyle = pal.body1;
        ctx.beginPath();
        const armY = 15 + Math.sin(this.bobTime * 2) * 3;
        ctx.ellipse(side * 42, armY, 14, 24, side * 0.5, 0, Math.PI * 2);
        ctx.fill();
        // Arm Claws
        ctx.fillStyle = pal.spike;
        for (let c = -1; c <= 1; c++) {
            ctx.beginPath();
            ctx.moveTo(side * 42 + c * 6 - 3, armY + 20);
            ctx.lineTo(side * 42 + c * 6, armY + 30);
            ctx.lineTo(side * 42 + c * 6 + 3, armY + 20);
            ctx.fill();
        }
    }

    ctx.restore();
  }

  drawTailTip(ctx, tx, ty, pal) {
      ctx.fillStyle = pal.spike;
      ctx.beginPath();
      if (this.element === 'Fire') {
          // Flame tail
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(tx - 15, ty - 20, tx, ty - 30);
          ctx.quadraticCurveTo(tx + 15, ty - 20, tx, ty);
      } else if (this.element === 'Water') {
          // Fin tail
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(tx - 20, ty - 10, tx - 10, ty - 25);
          ctx.lineTo(tx, ty - 15);
          ctx.lineTo(tx + 10, ty - 25);
          ctx.quadraticCurveTo(tx + 20, ty - 10, tx, ty);
      } else if (this.element === 'Electric') {
          // Lightning bolt tail
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx - 15, ty - 15);
          ctx.lineTo(tx - 5, ty - 15);
          ctx.lineTo(tx - 10, ty - 30);
          ctx.lineTo(tx + 15, ty - 10);
          ctx.lineTo(tx + 5, ty - 10);
      } else if (this.element === 'Dark') {
          // Scythe tail
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(tx - 20, ty - 10, tx - 5, ty - 35);
          ctx.quadraticCurveTo(tx, ty - 15, tx + 15, ty - 5);
      } else {
          // Standard spade
          ctx.moveTo(tx, ty - 15); 
          ctx.lineTo(tx + 20, ty); 
          ctx.lineTo(tx, ty + 15);
          ctx.lineTo(tx - 5, ty);
      }
      ctx.fill();
  }

  drawWing(ctx, side, pal) {
    ctx.save();
    ctx.translate(side * 60, -10);
    
    let wAngle = this.wingAngle;
    if (this.stage === 'Elder') wAngle *= 1.5;
    ctx.rotate(side * wAngle);
    
    // Wing scaling based on stage
    let wScale = 1;
    if (this.stage === 'Teen') wScale = 0.6;
    if (this.stage === 'Elder') wScale = 1.4;
    if (this.stage === 'Mythic') wScale = 1.8;
    ctx.scale(wScale, wScale);
    
    // Wing bone
    ctx.fillStyle = pal.body2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    
    if (this.element === 'Electric') {
        // Jagged bones
        ctx.lineTo(side * 40, -40);
        ctx.lineTo(side * 80, -30);
        ctx.lineTo(side * 120, -60);
        ctx.lineTo(side * 100, 0);
        ctx.lineTo(side * 50, 20);
    } else {
        ctx.quadraticCurveTo(side * 80, -80, side * 120, -30);
        ctx.quadraticCurveTo(side * 80, 20, 0, 25);
    }
    ctx.fill();
    
    // Wing membrane
    const wingGrad = ctx.createLinearGradient(0, 0, side * 120, 0);
    wingGrad.addColorStop(0, pal.wing1);
    wingGrad.addColorStop(1, pal.wing2);
    ctx.fillStyle = wingGrad;
    
    ctx.beginPath();
    ctx.moveTo(0, 10);
    
    if (this.element === 'Water') {
        // Fin-like webbing
        ctx.quadraticCurveTo(side * 40, -40, side * 110, -20);
        ctx.quadraticCurveTo(side * 90, 10, side * 100, 40);
        ctx.quadraticCurveTo(side * 50, 20, side * 40, 50);
        ctx.quadraticCurveTo(side * 20, 20, 0, 25);
    } else if (this.element === 'Dark') {
        // Bat wings (tattered)
        ctx.quadraticCurveTo(side * 60, -60, side * 115, -25);
        ctx.quadraticCurveTo(side * 90, -5, side * 105, 15);
        ctx.quadraticCurveTo(side * 70, 5, side * 85, 30);
        ctx.quadraticCurveTo(side * 40, 10, side * 50, 40);
        ctx.quadraticCurveTo(side * 20, 15, 0, 25);
    } else if (this.element === 'Light') {
        // Feathered shape simulation
        ctx.quadraticCurveTo(side * 60, -60, side * 120, -30);
        for(let f=0; f<5; f++) {
            ctx.quadraticCurveTo(side * (100 - f*20), 10 + f*10, side * (90 - f*20), 30 + f*5);
        }
        ctx.lineTo(0, 25);
    } else {
        // Standard dragon wings
        ctx.quadraticCurveTo(side * 60, -60, side * 110, -20);
        ctx.quadraticCurveTo(side * 90, 5, side * 100, 35);
        ctx.quadraticCurveTo(side * 50, 15, side * 45, 45);
        ctx.quadraticCurveTo(side * 20, 20, 0, 25);
    }
    ctx.fill();
    
    // Membrane veins
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    if (this.element === 'Dark') ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(side * 40, -20); ctx.lineTo(side * 95, 35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(side * 20, -5); ctx.lineTo(side * 45, 45); ctx.stroke();

    ctx.restore();
  }

  setEmotion(e, dur) {
    this.emotion = e; this.emotionTimer = dur || 2;
  }
}
