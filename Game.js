class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.entities = [];
    this.scrollX = 0; this.scrollY = 0;
    this.lastTime = 0;
    this.poopTimer = 0;
    this.gameOver = false;
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({ x: Math.random() * 2560, y: Math.random() * 600, s: Math.random() * 3 + 1, b: Math.random() });
    }
    this.setup();
  }

  async setup() {
    this.dragon = new Dragon(1130 + (Math.random() * 400 - 200), 500);
    this.entities = [this.dragon];
    this.gameOver = false;
    this.poopTimer = 15 + Math.random() * 20;
    this.dayTime = 8; // Start at 8 AM
    this.coins = 0;
    this.lastSaveTime = 0;
    
    if (window.SaveData && await SaveData.isAvailable()) {
      const saved = await SaveData.get('dragonGameSave');
      if (saved) {
        Object.assign(this.dragon, saved.dragon);
        this.coins = saved.coins || 0;
        this.dayTime = saved.dayTime || 8;
      }
    }

    this.remoteDragons = {};
    if (typeof Multiplayer !== 'undefined') {
      await Multiplayer.connect();
      Multiplayer.onPlayerJoin(player => {
        const rd = new Dragon(player.x || 1130, player.y || 500);
        Object.assign(rd, player);
        this.remoteDragons[player.id] = rd;
      });
      Multiplayer.onPlayerLeave(id => {
        delete this.remoteDragons[id];
      });
      Multiplayer.on('playerUpdate', data => {
        if (this.remoteDragons[data.id]) {
            const rd = this.remoteDragons[data.id];
            rd.targetX = data.x;
            rd.targetY = data.y;
            rd.element = data.element || rd.element;
            rd.stage = data.stage || rd.stage;
            rd.scale = data.scale || rd.scale;
            rd.level = data.level || rd.level;
            rd.emotion = data.emotion || rd.emotion;
            rd.health = data.health || rd.health;
            rd.bobTime = data.bobTime || rd.bobTime;
        }
      });
      Multiplayer.onMessage('attack', data => {
         if (data.targetId === Multiplayer.getMyId()) {
             this.dragon.health -= data.damage;
             this.spawnParticles(this.dragon.x + 150, this.dragon.y + 150, '#ff0000', 30);
             this.dragon.setEmotion('sad', 2);
         }
      });
    }
  }

  feedDragon() {
    if (this.gameOver || this.dragon.sleeping) return;
    const d = this.dragon;
    if (d.discipline < 20 && Math.random() < 0.3) return; // Refuses to eat
    d.hunger = Math.min(100, d.hunger + 40);
    d.weight += 2;
    d.cleanliness = Math.max(0, d.cleanliness - 5);
    d.setEmotion('eating', 2);
    const foods = ['🍖', '🥩', '🍗', '🐟'];
    const chosenFood = foods[Math.floor(Math.random() * foods.length)];
    if (chosenFood === d.favoriteFood) {
        d.happiness = Math.min(100, d.happiness + 20);
        this.spawnParticles(d.x + 150, d.y + 100, '#ff69b4', 10);
    }
    const f = new Food(d.x + 120 + Math.random() * 60, d.y - 40, chosenFood);
    this.entities.push(f);
    this.spawnParticles(d.x + 150, d.y + 100, '#ff6b35', 6);
  }

  explore() {
    if (this.gameOver || this.dragon.sleeping) return;
    const d = this.dragon;
    if (d.energy < 30) return;
    d.energy -= 30;
    d.happiness = Math.min(100, d.happiness + 20);
    const foundCoins = Math.floor(Math.random() * 50);
    this.coins += foundCoins;
    d.setEmotion('playing', 3);
    this.spawnParticles(d.x + 150, d.y + 100, '#00ff00', 20);
  }

  drinkDragon() {
    if (this.gameOver || this.dragon.sleeping) return;
    const d = this.dragon;
    d.thirst = Math.min(100, d.thirst + 40);
    d.weight += 0.5;
    d.setEmotion('eating', 1.5);
    const f = new Food(d.x + 120 + Math.random() * 60, d.y - 40, '💧');
    this.entities.push(f);
    this.spawnParticles(d.x + 150, d.y + 100, '#00bfff', 6);
  }

  playWithDragon() {
    if (this.gameOver || this.dragon.sleeping) return;
    const d = this.dragon;
    if (d.energy < 10) return;
    if (d.discipline < 20 && Math.random() < 0.3) return; // Refuses to play
    d.happiness = Math.min(100, d.happiness + 40);
    d.weight = Math.max(5, d.weight - 1);
    d.energy = Math.max(0, d.energy - 10);
    d.experience += 20;
    const earned = 10 + Math.floor(Math.random() * 15);
    this.coins += earned;
    d.setEmotion('playing', 2.5);
    this.spawnParticles(d.x + 150, d.y + 80, '#ffd700', 12);
    
    // Visual coin feedback
    const c = new Particle(d.x + 150, d.y - 20, '#ffff00', 0, -50);
    c.life = 2;
    this.entities.push(c);
  }

  toggleSleep() {
    if (this.gameOver) return;
    this.dragon.sleeping = !this.dragon.sleeping;
  }

  cleanDragon() {
    if (this.gameOver) return;
    this.dragon.cleanliness = Math.min(100, this.dragon.cleanliness + 30);
    // Remove poops
    this.entities = this.entities.filter(e => !(e instanceof Poop));
    this.spawnParticles(this.dragon.x + 150, this.dragon.y + 150, '#87ceeb', 10);
  }

  healDragon() {
    if (this.gameOver || this.dragon.sleeping) return;
    if (this.dragon.sick) {
      this.dragon.sick = false;
      this.dragon.health = Math.min(100, this.dragon.health + 20);
      this.spawnParticles(this.dragon.x + 150, this.dragon.y + 150, '#ffb6c1', 20);
    }
  }

  switchTab(tabId) {
    document.querySelectorAll('.tabBtn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active-tab'));
    
    document.querySelector(`.tabBtn[onclick="game.switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active-tab');
  }

  buyItem(itemId, cost) {
    if (this.gameOver || this.coins < cost) {
      this.spawnParticles(this.dragon.x + 150, this.dragon.y + 100, '#888888', 5);
      return;
    }
    
    this.coins -= cost;
    const d = this.dragon;
    
    if (itemId === 'premium_food') {
      d.hunger = 100;
      d.weight += 3;
      d.setEmotion('eating', 3);
      this.entities.push(new Food(d.x + 150, d.y - 40, '🍖'));
      this.spawnParticles(d.x + 150, d.y + 100, '#ffd700', 20);
    } else if (itemId === 'toy') {
      d.happiness = 100;
      d.setEmotion('playing', 3);
      this.entities.push(new Food(d.x + 150, d.y - 40, '🧸'));
      this.spawnParticles(d.x + 150, d.y + 100, '#ff69b4', 20);
    } else if (itemId === 'medicine') {
      d.health = 100;
      d.sick = false;
      d.setEmotion('happy', 3);
      this.entities.push(new Food(d.x + 150, d.y - 40, '💊'));
      this.spawnParticles(d.x + 150, d.y + 100, '#00ff00', 20);
    } else if (itemId.startsWith('room_')) {
      this.currentRoom = itemId;
      this.spawnParticles(d.x + 150, d.y + 100, '#ffffff', 30);
    }
  }

  trainDragon() {
    if (this.gameOver || this.dragon.sleeping) return;
    const d = this.dragon;
    if (d.energy < 20 || d.hunger < 15) return;
    d.energy = Math.max(0, d.energy - 20);
    d.hunger = Math.max(0, d.hunger - 10);
    d.weight = Math.max(5, d.weight - 2);
    d.discipline = Math.min(100, d.discipline + 15);
    d.experience += 25;
    d.happiness = Math.min(100, d.happiness + 10);
    this.coins += 15 + Math.floor(Math.random() * 10);
    d.setEmotion('playing', 2);
    this.spawnParticles(d.x + 150, d.y, '#ff4500', 15);
  }

  battle() {
    if (this.gameOver || this.dragon.sleeping) return;
    if (typeof Multiplayer === 'undefined' || !Multiplayer.isConnected()) {
        this.spawnParticles(this.dragon.x + 150, this.dragon.y + 150, '#888', 10);
        return;
    }
    
    const otherIds = Object.keys(this.remoteDragons);
    if (otherIds.length === 0) {
        this.spawnParticles(this.dragon.x + 150, this.dragon.y + 150, '#888', 10);
        return;
    }
    
    const targetId = otherIds[Math.floor(Math.random() * otherIds.length)];
    const damage = 10 + (this.dragon.level * 2) + Math.random() * 10;
    
    Multiplayer.sendMessage('attack', { targetId, damage });
    
    this.dragon.energy = Math.max(0, this.dragon.energy - 10);
    this.dragon.setEmotion('playing', 2);
    this.spawnParticles(this.dragon.x + 150, this.dragon.y + 150, '#ffcc00', 30);
    this.coins += 25;
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const p = new Particle(x, y, color, (Math.random() - 0.5) * 200, -Math.random() * 200);
      this.entities.push(p);
    }
  }

  screenToWorld(cx, cy) { return { x: cx + this.scrollX, y: cy + this.scrollY }; }
  worldToScreen(wx, wy) { return { x: wx - this.scrollX, y: wy - this.scrollY }; }

  getObjectAt(cx, cy) {
    const w = this.screenToWorld(cx, cy);
    for (const e of this.entities) {
      const b = e.getBounds();
      if (w.x >= b.x && w.x <= b.x + b.width && w.y >= b.y && w.y <= b.y + b.height) return e;
    }
    return null;
  }

  update(dt) {
    if (dt > 0.1) dt = 0.1;
    if (this.gameOver) return;

    this.dayTime += dt * 0.5; // 1 hour = 2 real seconds
    if (this.dayTime >= 24) this.dayTime -= 24;

    // Poop timer
    this.poopTimer -= dt;
    if (this.poopTimer <= 0) {
      this.poopTimer = 5 + Math.random() * 10;
      const p = new Poop(this.dragon.x + Math.random() * 200, this.dragon.y + 260 + Math.random() * 40);
      this.entities.push(p);
      this.dragon.cleanliness = Math.max(0, this.dragon.cleanliness - 15);
    }

    for (const e of this.entities) e.update(dt);
    this.entities = this.entities.filter(e => e.alive);

    for (const id in this.remoteDragons) {
        const rd = this.remoteDragons[id];
        if (rd.targetX !== undefined) {
            rd.x += (rd.targetX - rd.x) * 10 * dt;
            rd.y += (rd.targetY - rd.y) * 10 * dt;
        }
    }

    if (typeof Multiplayer !== 'undefined' && Multiplayer.isConnected()) {
        Multiplayer.sendUpdate({
            x: this.dragon.x,
            y: this.dragon.y,
            element: this.dragon.element,
            stage: this.dragon.stage,
            scale: this.dragon.scale,
            level: this.dragon.level,
            emotion: this.dragon.emotion,
            health: this.dragon.health,
            bobTime: this.dragon.bobTime
        });
    }

    if (this.dragon.health <= 0) this.gameOver = true;

    // Auto-save every 5 seconds
    this.lastSaveTime = (this.lastSaveTime || 0) + dt;
    if (this.lastSaveTime > 5 && window.SaveData) {
      this.lastSaveTime = 0;
      SaveData.set('dragonGameSave', {
        dragon: this.dragon,
        coins: this.coins,
        dayTime: this.dayTime
      });
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;

    // Sky gradient
    const isNight = this.dayTime < 6 || this.dayTime > 18;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (isNight) {
      skyGrad.addColorStop(0, '#0a0a2e');
      skyGrad.addColorStop(0.5, '#1a1a4e');
      skyGrad.addColorStop(1, '#2d1b4e');
    } else {
      skyGrad.addColorStop(0, '#4a90e2');
      skyGrad.addColorStop(0.5, '#87ceeb');
      skyGrad.addColorStop(1, '#e0f6ff');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    const t = Date.now() / 1000;
    if (isNight) {
      for (const s of this.stars) {
        ctx.globalAlpha = 0.4 + Math.sin(t * 2 + s.b * 10) * 0.3;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Moon/Sun
    if (isNight) {
      ctx.fillStyle = '#ffe4b5';
      ctx.beginPath(); ctx.arc(2100, 200, 80, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0a0a2e';
      ctx.beginPath(); ctx.arc(2130, 185, 70, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(2100, 200, 80, 0, Math.PI * 2); ctx.fill();
    }

    // Ground
    const grd = ctx.createLinearGradient(0, h - 400, 0, h);
    grd.addColorStop(0, '#2d5a1e'); grd.addColorStop(1, '#1a3a10');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(0, h - 300);
    for (let x = 0; x <= w; x += 100) {
      ctx.lineTo(x, h - 300 + Math.sin(x * 0.01) * 30);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

    // Cave/nest area
    if (this.currentRoom === 'room_neon') {
        ctx.fillStyle = '#110022';
        ctx.beginPath(); ctx.ellipse(1280, h - 250, 350, 200, 0, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 5; ctx.stroke();
    } else if (this.currentRoom === 'room_nature') {
        ctx.fillStyle = '#003311';
        ctx.beginPath(); ctx.ellipse(1280, h - 250, 350, 200, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#005522';
        ctx.beginPath(); ctx.ellipse(1280, h - 250, 320, 170, 0, Math.PI, 0); ctx.fill();
    } else {
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.ellipse(1280, h - 250, 350, 200, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath(); ctx.ellipse(1280, h - 250, 320, 170, 0, Math.PI, 0); ctx.fill();
    }

    // Nest
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(1280, h - 260, 200, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#654321'; ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(1280 + Math.cos(a) * 150, h - 260);
      ctx.lineTo(1280 + Math.cos(a + 0.3) * 200, h - 270);
      ctx.stroke();
    }

    // Entities
    ctx.save();
    ctx.translate(-this.scrollX, -this.scrollY);
    for (const e of this.entities) e.draw(ctx);
    
    for (const id in this.remoteDragons) {
        ctx.globalAlpha = 0.8;
        this.remoteDragons[id].draw(ctx);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Player ${id.substring(0,4)}`, this.remoteDragons[id].x + 150, this.remoteDragons[id].y - 50);
        ctx.textAlign = 'left';
    }
    ctx.restore();

    // HUD
    this.drawHUD(ctx);
    this.updateUI();

    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff4444'; ctx.font = 'bold 80px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Your Dragon Has Perished...', w / 2, h / 2 - 40);
      ctx.fillStyle = '#ffd700'; ctx.font = '40px sans-serif';
      ctx.fillText(`Reached Level ${this.dragon.level} | Lived ${Math.floor(this.dragon.age)}s`, w / 2, h / 2 + 40);
      ctx.fillText('Refresh to try again', w / 2, h / 2 + 100);
      ctx.textAlign = 'left';
    }
  }

  updateUI() {
    const d = this.dragon;
    if (document.getElementById('stat-level')) {
      document.getElementById('stat-level').innerText = `Level: ${d.level} (${d.stage} ${d.element})`;
      document.getElementById('stat-exp').innerText = `EXP: ${Math.floor(d.experience)} / ${d.level * 100}`;
      document.getElementById('stat-age').innerText = `Age: ${Math.floor(d.age)} days | Personality: ${d.personality} | Fav Food: ${d.favoriteFood}`;
      document.getElementById('stat-weight').innerText = `Weight: ${Math.floor(d.weight)} lbs`;
      document.getElementById('stat-discipline').innerText = `Discipline: ${Math.floor(d.discipline)}%`;
      document.getElementById('stat-happiness').innerText = `Happiness: ${Math.floor(d.happiness)}%`;
      document.getElementById('stat-health').innerText = `Health: ${Math.floor(d.health)}%`;
      document.getElementById('shop-coins').innerText = Math.floor(this.coins);
    }
  }

  drawHUD(ctx) {
    const d = this.dragon;
    const bx = 60, by = 40, bw = 280, bh = 32, gap = 44;
    const stats = [
      { label: '🍖 Hunger', val: d.hunger, color: '#ff6b35' },
      { label: '💧 Thirst', val: d.thirst, color: '#00bfff' },
      { label: '😊 Happy', val: d.happiness, color: '#ffd700' },
      { label: '⚡ Energy', val: d.energy, color: '#32cd32' },
      { label: '✨ Clean', val: d.cleanliness, color: '#87ceeb' },
      { label: '⚖️ Weight', val: d.weight, color: '#dda0dd' },
      { label: '🎓 Discip.', val: d.discipline, color: '#9370db' },
      { label: '❤️ Health', val: d.health, color: '#ff4444' },
    ];

    // Background panel
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2;
    const panelH = stats.length * gap + 100;
    ctx.beginPath();
    ctx.roundRect(bx - 20, by - 15, bw + 40, panelH, 16);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`🐉 Lv.${d.level} ${d.element !== 'Base' ? d.element : ''} ${d.stage} Dragon`, bx, by + 20);
    ctx.font = '16px sans-serif'; ctx.fillStyle = '#aaa';
    ctx.fillText(`EXP: ${d.experience}/${d.level * 100}  |  Age: ${Math.floor(d.age)}s  |  Time: ${Math.floor(this.dayTime)}:00  |  Gotchi Points: 💰 ${this.coins || 0}`, bx, by + 45);
    ctx.fillStyle = '#ffb6c1'; ctx.font = '14px sans-serif';
    ctx.fillText('Shop: 50 💰 for Golden Apple (Max Stats) | Play/Train to earn 💰', bx, by + panelH - 15);
    if (d.sleeping) { ctx.fillStyle = '#aaf'; ctx.fillText('💤 Sleeping...', bx + 180, by + 20); }
    if (d.sick) { ctx.fillStyle = '#f44'; ctx.fillText('🤒 Sick!', bx + 180, by + 45); }

    stats.forEach((s, i) => {
      const y = by + 65 + i * gap;
      ctx.fillStyle = '#ccc'; ctx.font = '20px sans-serif';
      ctx.fillText(s.label, bx, y + 4);
      // Bar bg
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.roundRect(bx + 100, y - 12, bw - 100, bh, 8); ctx.fill();
      // Bar fill
      const fw = (bw - 100) * (s.val / 100);
      ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.roundRect(bx + 100, y - 12, Math.max(0, fw), bh, 8); ctx.fill();
      // Value
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif';
      ctx.fillText(Math.floor(s.val), bx + 100 + (bw - 100) / 2 - 10, y + 10);
    });
  }

  start() {
    const loop = (ts) => {
      const dt = (ts - this.lastTime) / 1000;
      this.lastTime = ts;
      this.update(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
