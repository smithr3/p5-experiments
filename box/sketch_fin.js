// http://p5js.org/reference/

let fps = 30;
let box;
let GROUND_Y = 180;
let GRAVITY = 1000;

function setup() {
  createCanvas(500, 200);
  frameRate(fps);
  box = new Box(10, 0, GROUND_Y-30, 0);
}

function draw() {
  var target = mouseX
  if (target < 0 || target > width || mouseY < 0 || mouseY > height) {
    target = width/2;
  }
  box.control(target);
  box.update(1/fps);

  background(200);
  stroke(200,0,0);
  line(target, 0, target, height);
  stroke(0);
  if (box.isOnGround()) {
    fill(255,220,220);
  } else {
    fill(255);
  }
  rect(int(box.x) - 5, box.y-10, 10, 10);
  line(0, GROUND_Y, width, GROUND_Y);
}

function mouseClicked() {
  box.tryJump();
}
function keyPressed() {
  // spacebar
  if (keyCode == 32) {
    box.tryJump();
  }
}

// ES6 CLASSES
class Box {
  constructor(x, xd, y, yd) {
    this.y = y;
    this.x = x;
    this.xd = xd;
    this.yd = yd;
    this.f = 0;
  }
  update(dt) {
    var fr;

    // update first then check if hit ground
    this.yd += GRAVITY*dt;
    this.y += this.yd*dt;

    if (this.y >= GROUND_Y) {
      fr = -0.1*this.xd;
      this.y = GROUND_Y;
      this.yd = 0;
    } else {
      fr = 0;
    }

    this.xd += this.f*dt + fr;
    this.x += this.xd*dt;
  }
  control(target) {
    if (this.isOnGround()) {
      this.f = (target - this.x)*7;
    } else {
      this.f = 0;
    }
  }
  isOnGround() {
    return this.y >= GROUND_Y
  }
  tryJump() {
    if (box.isOnGround()) {
      box.yd -= 400;
    }
  }
}
