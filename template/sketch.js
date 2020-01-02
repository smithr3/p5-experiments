// http://p5js.org/reference/

let fps = 30;

// let box = new BoxMass(10, 10);
let box;

function setup() {
  createCanvas(500, 200);
  frameRate(fps);
  katex.render("c = \\pm\\sqrt{a^2 + b^2}", document.getElementById('katex'), {
      throwOnError: false
  });
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
    this.x = x;
    this.xd = vel;
    this.f = 0;
  }
  update(dt) {
    var fr = -0.1*this.xd;
    this.xd += this.f*dt + fr;
    this.x += this.xd*dt;
  }
  control(target) {
    this.f = (target - this.x)*5;
  }
}

// OLD METHOD FOR CLASSES
function BoxMass(x, vel) {
  this.x = x;
  this.xd = vel;
  this.f = 0;
}
BoxMass.prototype.update = function(dt) {
  var fr = -0.1*this.xd;
  this.xd += this.f*dt + fr;
  this.x += this.xd*dt;
};
BoxMass.prototype.setForce = function(f) {
  this.f = f;
};
BoxMass.prototype.control = function(target) {
  this.f = (target - this.x)*5;
};
