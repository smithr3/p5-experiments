// TODO: blocks - picked up, dropped
// nicer inv kinematics


let fps = 30;
let controller;
let arm0;
let arm1;
let maxLength;
let ground;

let dbgText;

function setup() {
  // 800 x 400 (double width to make room for each "sub-canvas")
  createCanvas(400, 400);
  frameRate(fps);

  noSmooth();

  controller = new Controller();

  arm0 = new Arm(50);
  arm1 = new Arm(25);
  maxLength = arm0.length + arm1.length;
  minLength = arm0.length - arm1.length

  ground = height - 100;

}

function draw() {
  background(200);
  stroke(200,0,0);
  noFill();
  ellipse(width/2,ground, 2*maxLength);
  ellipse(width/2,ground, 2*minLength);
  stroke(0);
  line(0, ground, width, ground);
  noStroke();
  fill(0);
  text(dbgText, 5, 20);

  target = controller.update();

  var x = target.x;
  var y = target.y;
  var d = dist(0, 0, x, y);
  if (d > maxLength) {
    // not 100 because this prevents rounding errors that pushes (x,y) out of reach
    x *= 0.9999*maxLength/d;
    y *= 0.9999*maxLength/d;
  } else if (d < minLength) {
    // not 100 because this prevents rounding errors that pushes (x,y) out of reach
    x *= 1.001*minLength/d;
    y *= 1.001*minLength/d;
  }

  var a2 = getAngle2(x, y, arm0.length, arm1.length);
  var a1 = getAngle1(x, y, arm0.length, arm1.length, a2);
  // console.log(int(degrees(a1)), int(degrees(a2)))

  arm0.rot = a1;
  arm1.rot = a2;

  drawArm(arm0, width/2, ground, 0);
  drawArm(arm1, arm0.end.x, arm0.end.y, arm0.rot);
}

function Controller() {
  this.index = 0; // program counter
  this.steps = 30; // steps for interpolation
  this.i = 0; // step for interpolation
  this.current = {x:0, y:0};
  this.previous = {x:0, y:0};
  this.commands = [
    {x:40,y:40,act:'grab'},
    // {x:0,y:40,act:null},
    {x:-60,y:0,act:'place'}
  ];
  this.finished = false;
}
Controller.prototype.update = function() {
  if (this.finished) {
    return this.current;
  }
  dbgText = this.index + '\n' + int(this.i/this.steps*10)/10;
  this.current.x = lerp(this.previous.x, this.commands[this.index].x, this.i/this.steps);
  this.current.y = lerp(this.previous.y, this.commands[this.index].y, this.i/this.steps);
  this.i++;
  // if finished motion, move onto the next command
  if (this.i > this.steps) {
    this.previous.x = this.current.x;
    this.previous.y = this.current.y;
    this.i = 0;
    var act = this.commands[this.index].act;
    if (act == 'grab') {
      this.commands[this.index].y -= 5;
    } else if (act == 'place') {
      // end program if tower is 6 blocks tall
      if (this.commands[this.index].y >= 5*6) {
        this.finished = true;
      } else {
        this.commands[this.index].y += 5;
      }
    }
    this.index++;
    if (this.index >= this.commands.length) {
      this.index = 0;
    }
  }
  return this.current;
}

function Arm(length) {
  this.length = length;
  this.rot = 0; // rotation in own frame, radians
  this.end; // end point coords in frame 0, set by drawArm
}

function drawArm(arm, x, y, r) {
  // TODO: make method of Arm()
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
