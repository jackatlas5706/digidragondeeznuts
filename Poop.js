class Poop extends GameObject {
  constructor(x, y) {
    super(x, y, 40, 40);
    this.name = 'Poop';
    this.timer = 0;
  }
  update(dt) { this.timer += dt; }
  draw(ctx) {
    ctx.font = '36px sans-serif';
    ctx.fillText('💩', this.x, this.y + 35);
  }
}
