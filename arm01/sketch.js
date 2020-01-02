// http://p5js.org/reference/
// https://stackoverflow.com/questions/37240287/can-i-create-multiple-canvas-elements-on-same-page-using-p5js

let fps = 30;
let arm0;
let arm1;
let floor;

function setup() {
  // 800 x 400 (double width to make room for each "sub-canvas")
  createCanvas(400, 400);
  frameRate(fps);

  noSmooth();

  arm0 = new Arm(30);
  arm1 = new Arm(15);

  ground = height - 100;

}

function draw() {
  background(200);
  stroke(200,0,0);
  noFill();
  ellipse(width/2,ground,200);
  stroke(0);
  line(0, ground, width, ground);

  var x = mouseX - width/2;
  var y = ground - mouseY;
  var d = dist(0, 0, x, y);
  if (d > 100) {
    // not 100 because this prevents rounding errors that pushes (x,y) out of reach
    x *= 99.99/d;
    y *= 99.99/d;
  }

  var s = '('+int(mouseX)+','+int(mouseY)+') ('+int(x)+','+int(y)+')';
  noStroke();
  fill(0);
  text(s, mouseX+8, mouseY-8);

  var a2 = getAngle2(x, y, arm0.length, arm1.length);
  var a1 = getAngle1(x, y, arm0.length, arm1.length, a2);
  // console.log(int(degrees(a1)), int(degrees(a2)))

  arm0.rot = a1;
  arm1.rot = a2;

  drawArm(arm0, width/2, ground, 0);
  drawArm(arm1, arm0.end.x, arm0.end.y, arm0.rot);
}

function Arm(rot) {
  this.length = 50;
  this.rot = radians(rot); // rotation in own frame
  this.end; // set by drawArm, is end point coords in frame 0
}

function drawArm(arm, x, y, r) {
  var x2 = x + arm.length*cos(arm.rot + r);
  var y2 = y - arm.length*sin(arm.rot + r);
  arm.end = new p5.Vector(x2,y2);
  fill(255);
  stroke(0);
  line(x, y, x2, y2);
  ellipse(x, y, 10);
  ellipse(x2, y2, 10);
}

function getAngle2(x, y, l1, l2) {
  var num = pow(x,2) + pow(y,2) - pow(l1,2) - pow(l2,2);
  var den = 2*l1*l2;
  if (x<0) {
    return acos(num/den);
  } else {
    return -acos(num/den);
  }
}

function getAngle1(x, y, l1, l2, a2) {

  var a = atan(y/x);
  var b = atan( (l2*sin(a2)) / (l1 + l2*cos(a2)) );
  if (x < 0) {
    return PI + a - b;
  } else {
    return a - b;
  }
}
