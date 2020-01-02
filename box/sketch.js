// http://p5js.org/reference/

let fps = 30;
let box;

function setup() {
  createCanvas(500, 200);
  frameRate(fps);
  box = new Box(10, 10);
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
  rect(int(box.x) - 5, 100, 10, 10);
  line(0, 110, width, 110);
}

// ES6 CLASSES
class Box {
  constructor(x, vel) {
    this.x = x;       // position
    this.xd = vel;    // velocity
    this.f = 0;       // force acting on box
  }
  update(dt) {

  }
  control(target) {

  }
}
