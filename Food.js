class Food extends GameObject {
  constructor(x, y, type) {
    super(x, y, 40, 40);
    this.name = 'Food';
    this.type = type || '🍖';
    this.timer = 0;
    this.startY = y;
  }
  update(dt) {
    this.timer += dt;
    this.y = this.startY + this.timer * 80;
    if (this.timer > 1.5) this.alive = false;
  }
  draw(ctx) {
    ctx.font = '36px sans-serif';
    ctx.globalAlpha = Math.max(0, 1 - this.timer / 1.5);
    ctx.fillText(this.type, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}
