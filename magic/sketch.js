let hat;
let cards = [];
let bunnies = [];
let wands = [];

let score = 0;
let multiplier = 1;
let multiplierEndsAt = 0;

let gameState = 'play';
let confetti = [];
let nextWandAt;

const replayBtn = { x: 0, y: 0, w: 180, h: 46 };

function setup() {
  createCanvas(420, 680);
  textFont('Georgia');
  resetGame();
}

function resetGame() {
  hat = new Hat();
  cards = [];
  bunnies = [];
  wands = [];
  confetti = [];
  score = 0;
  multiplier = 1;
  multiplierEndsAt = 0;
  gameState = 'play';
  nextWandAt = millis() + 120000;
}

function draw() {
  background(18, 10, 28);
  drawStageGlow();
  if (gameState === 'play') playLoop(); else winScreen();
}

function playLoop() {
  if (frameCount % 36 === 0) cards.push(new Card(random(30, width - 30), -30));
  if (frameCount % 60 === 0 && random() < 0.08) bunnies.push(new Bunny(random(30, width - 30), -40));
  if (millis() >= nextWandAt) { wands.push(new Wand(random(36, width - 36), -40)); nextWandAt += 120000; }
  if (multiplier === 2 && frameCount > multiplierEndsAt) multiplier = 1;

  updateAndDrawArray(cards, (o, i) => {
    if (o.hits(hat)) { score += 1 * multiplier; cards.splice(i, 1); }
    else if (o.y - o.h / 2 > height) cards.splice(i, 1);
  });

  updateAndDrawArray(bunnies, (o, i) => {
    if (o.hits(hat)) { multiplier = 2; multiplierEndsAt = frameCount + 8 * 60; bunnies.splice(i, 1); }
    else if (o.y - o.h / 2 > height) bunnies.splice(i, 1);
  });

  updateAndDrawArray(wands, (o, i) => {
    if (o.hits(hat)) { triggerWin(); wands.splice(i, 1); }
    else if (o.y - o.h / 2 > height) wands.splice(i, 1);
  });

  hat.move();
  hat.show();
  drawScore();
  if (multiplier === 2) drawMultiplierBadge();
}

function triggerWin() {
  gameState = 'win';
  for (let i = 0; i < 140; i++) confetti.push(new Confetti(random(width), random(-200, -10)));
}

function winScreen() {
  for (let i = confetti.length - 1; i >= 0; i--) {
    confetti[i].update();
    confetti[i].show();
    if (confetti[i].y > height + 20) confetti.splice(i, 1);
  }
  push();
  noStroke();
  fill(0, 160);
  rect(0, 0, width, height);
  pop();
  push();
  textAlign(CENTER, CENTER);
  noStroke();
  fill(255);
  textSize(36);
  text('✨ You Win! ✨', width / 2, height * 0.32);
  textSize(22);
  fill(255, 230);
  text(`Total Score: ${score}`, width / 2, height * 0.42);
  pop();
  replayBtn.x = width / 2 - 90;
  replayBtn.y = height * 0.52;
  push();
  rectMode(CORNER);
  noStroke();
  fill(255, 220, 70);
  rect(replayBtn.x, replayBtn.y, replayBtn.w, replayBtn.h, 10);
  fill(20);
  textAlign(CENTER, CENTER);
  textSize(18);
  text('Replay', width / 2, replayBtn.y + replayBtn.h / 2 + 1);
  pop();
}

function mousePressed() {
  if (gameState === 'win') {
    if (mouseX >= replayBtn.x && mouseX <= replayBtn.x + replayBtn.w && mouseY >= replayBtn.y && mouseY <= replayBtn.y + replayBtn.h) resetGame();
  }
}

function updateAndDrawArray(arr, onEach) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const o = arr[i];
    o.update();
    o.show();
    onEach(o, i);
  }
}

function drawScore() {
  push();
  noStroke();
  fill(255, 240);
  textSize(18);
  textAlign(RIGHT, TOP);
  text(`Score: ${score}`, width - 12, 10);
  pop();
}

function drawMultiplierBadge() {
  const secsLeft = max(0, Math.ceil((multiplierEndsAt - frameCount) / 60));
  push();
  textAlign(RIGHT, TOP);
  noStroke();
  fill(255, 200, 60);
  rectMode(CORNER);
  rect(width - 160, 36, 150, 26, 8);
  fill(20);
  textSize(14);
  text(`2× Magic! ${secsLeft}s`, width - 12, 40);
  pop();
}

function drawStageGlow() {
  push();
  noStroke();
  for (let r = 400; r > 0; r -= 40) {
    fill(80, 20, 140, map(r, 400, 0, 10, 120));
    ellipse(width / 2, height * 0.2, r * 1.5, r);
  }
  pop();
}

class Hat {
  constructor() {
    this.x = width / 2;
    this.y = height - 70;
    this.crownW = 100;
    this.crownH = 70;
    this.brimW = 170;
    this.brimH = 18;
    this.speed = 6.2;
    this.wall = 10;
  }
  move() {
    if (keyIsDown(LEFT_ARROW)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW)) this.x += this.speed;
    this.x = constrain(this.x, this.brimW / 2, width - this.brimW / 2);
  }
  show() {
    push();
    rectMode(CENTER);
    translate(this.x, this.y);
    fill(40); // darker brim
    rect(0, -this.crownH / 2 - this.brimH / 2, this.brimW, this.brimH, 8);
    fill(60); // darker crown walls
    rect(0, 0, this.crownW, this.crownH, 10);
    fill(200, 30, 40); // ribbon at crown base
    rect(0, -this.crownH / 2 + 6, this.crownW * 1.05, 12, 6);
    pop();
  }
  catchRect() {
    const innerW = this.crownW - 2 * this.wall;
    const innerH = this.crownH - 2 * this.wall;
    const x = this.x - innerW / 2;
    const y = this.y - innerH / 2;
    return { x, y, w: innerW, h: innerH };
  }
}

class Card {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 34;
    this.h = 48;
    this.speed = random(2.2, 3.8);
    const suits = ['♠', '♥', '♦', '♣'];
    this.suit = random(suits);
    this.red = (this.suit === '♥' || this.suit === '♦');
    this.angle = random(-0.1, 0.1);
    this.spin = random(-0.003, 0.003);
  }
  update() {
    this.y += this.speed;
    this.angle += this.spin;
  }
  show() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    rectMode(CENTER);
    stroke(240);
    fill(255);
    rect(0, 0, this.w, this.h, 6);
    noStroke();
    fill(this.red ? color(210, 40, 40) : color(20));
    textAlign(CENTER, CENTER);
    textSize(18);
    text(this.suit, 0, 0);
    pop();
  }
  hits(hat) {
    const r = hat.catchRect();
    return aabbVsAabb(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h, r.x, r.y, r.w, r.h);
  }
}

class Bunny {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 34;
    this.h = 44;
    this.speed = random(2.6, 3.4);
    this.bob = random(1000);
  }
  update() {
    this.y += this.speed;
    this.bob += 0.05;
    this.x += sin(this.bob) * 0.6;
  }
  show() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(245);
    ellipse(0, 6, this.w, this.h * 0.7);
    ellipse(-8, -18, 12, 26);
    ellipse(8, -18, 12, 26);
    fill(255, 140, 160);
    ellipse(-8, -18, 6, 16);
    ellipse(8, -18, 6, 16);
    fill(20);
    ellipse(-6, 2, 4, 4);
    ellipse(6, 2, 4, 4);
    fill(255, 110, 130);
    triangle(-2, 8, 2, 8, 0, 12);
    noFill();
    stroke(255, 220);
    strokeWeight(1);
    circle(0, 6, 40);
    pop();
  }
  hits(hat) {
    const r = hat.catchRect();
    return aabbVsAabb(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h, r.x, r.y, r.w, r.h);
  }
}

class Wand {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 12;
    this.h = 60;
    this.speed = random(2.6, 3.2);
    this.angle = random(-0.06, 0.06);
    this.spin = random(-0.002, 0.002);
  }
  update() {
    this.y += this.speed;
    this.angle += this.spin;
  }
  show() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    rectMode(CENTER);
    noStroke();
    fill(30);
    rect(0, 10, this.w * 0.7, this.h * 0.8, 4);
    fill(240);
    rect(0, -this.h * 0.22, this.w * 0.8, this.h * 0.22, 4);
    translate(0, -this.h * 0.46);
    drawStar(0, 0, 5, 10, 5);
    pop();
  }
  hits(hat) {
    const r = hat.catchRect();
    return aabbVsAabb(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h, r.x, r.y, r.w, r.h);
  }
}

class Confetti {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1.5, 1.5);
    this.vy = random(1.5, 3.4);
    this.sz = random(4, 8);
    this.spin = random(-0.2, 0.2);
    this.angle = random(TWO_PI);
    this.col = [color(255, 90, 90), color(255, 210, 70), color(100, 200, 255), color(160, 255, 140), color(230, 170, 255)][floor(random(5))];
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.spin;
    this.vy += 0.02;
  }
  show() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    noStroke();
    fill(this.col);
    rectMode(CENTER);
    rect(0, 0, this.sz, this.sz * 0.6, 2);
    pop();
  }
}

function aabbVsAabb(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(x1 + w1 < x2 || x1 > x2 + w2 || y1 + h1 < y2 || y1 > y2 + h2);
}

function drawStar(x, y, r1, r2, n) {
  let angle = TWO_PI / n, half = angle / 2.0;
  push();
  translate(x, y);
  beginShape();
  fill(255, 220, 90);
  noStroke();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = cos(a) * r2, sy = sin(a) * r2; vertex(sx, sy);
    sx = cos(a + half) * r1; sy = sin(a + half) * r1; vertex(sx, sy);
  }
  endShape(CLOSE);
  pop();
}
