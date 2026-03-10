class Particle extends GameObject {
  constructor(x, y, color, vx, vy) {
    super(x, y, 6, 6);
    this.name = 'Particle';
    this.color = color;
    this.vx = vx; this.vy = vy;
    this.life = 1;
    this.maxLife = 1;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 200 * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }
  draw(ctx) {
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}
