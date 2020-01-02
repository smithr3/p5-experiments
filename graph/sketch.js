// http://p5js.org/reference/

let fps = 30;

let n = 10;
let nodes = [];
let springs = [];

let used = []; // makes sure every node gets a connection
let connections = {}; // makes sure no duplicate connections/springs between nodes

function setup() {
  createCanvas(800, 800);
  frameRate(fps);
  // create nodes
  for (var i = 0; i < n; i++) {
    nodes.push(
      new Node(i, random(100,700), random(100,700))
    )
    connections[i] = [];
  }
  // create random connections
  for (var i = 0; i < nodes.length; i++) {
    for (var j = 0; j < nodes.length; j++) {
      if (i==j) {
        continue;
      }
      // if node not used yet then make a strong connection, otherwise have a small chance to make additional connections
      if (Math.random() < (0.5/n) || !inArray(i, used)) {
        if (!inArray(j, connections[i])) {
          used.push(i);
          connections[i].push(j);
          connections[j].push(i);
          springs.push(
            new Spring(true, nodes[i], nodes[j])
          )
        }
      // make a weak connection between every node pair that don't already have a strong connection
      } else if (!inArray(j, connections[i])) {
        // a weak connection doesn't count as used
        connections[i].push(j);
        connections[j].push(i);
        springs.push(
          new Spring(false, nodes[i], nodes[j])
        )
      }
    }
  }
}

function draw() {
  background(240);
  for (var i = 0; i < springs.length; i++) {
    var spring = springs[i];
    spring.contract();
    spring.draw();
  }
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].draw();
    // override movement due to spring contraction and just set to mouse position
    if (nodes[i].selected) {
      nodes[i].x = mouseX;
      nodes[i].y = mouseY;
    }
  }
}

function mousePressed() {
  // select a node if mouse within radius
  var node;
  var v1, v2;
  for (var i = 0; i < nodes.length; i++) {
    node = nodes[i];
    v1 = new p5.Vector(mouseX, mouseY);
    v2 = new p5.Vector(node.x, node.y);
    if (p5.Vector.dist(v1, v2) < node.r) {
      node.selected = true;
    }
  }
}

function mouseReleased() {
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].selected = false;
  }
}

function inArray(value, array) {
  return array.indexOf(value) > -1;
}

// ES6 CLASSES
class Node {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.r = 20;
    this.selected = false;
  }
  draw() {
    strokeWeight(1);
    stroke(0);
    fill(255);
    ellipse(this.x,this.y,this.r);
    noStroke();
    fill(0);
    text(this.id, this.x-3, this.y+3);
  }
}

class Spring {
  constructor(isStrong, node1, node2) {
    this.isStrong = isStrong;
    this.node1 = node1;
    this.node2 = node2;
    this.natural = 100; // natural/resting spring length
    this.k = 0.1; // spring stiffness
    this.dist = 0;
    if (isStrong) {
      console.log('spring '+this.node1.id+' '+this.node2.id);
    }
  }
  contract() {
    // calculate distance from natural length
    this.distFromNatural = abs(this.node1.x-this.node2.x) + abs(this.node1.y-this.node2.y);
    this.distFromNatural -= this.natural;
    // move each node along the vector joining them
    var n1 = new p5.Vector(this.node1.x, this.node1.y);
    var n2 = new p5.Vector(this.node2.x, this.node2.y);
    var n1n2 = p5.Vector.sub(n2, n1);
    var n2n1 = p5.Vector.sub(n1, n2);
    if (this.isStrong) {
      var k = this.k;
      if (this.distFromNatural > 0) {
        k *= this.distFromNatural
      }
    } else {
      var k = this.k/20;
      if (this.distFromNatural > 0) {
        k *= 1/this.distFromNatural;
      }
    }
    if (this.distFromNatural < 0) {
      k *= abs(this.distFromNatural*this.distFromNatural);
    }
    n1n2.normalize(); n1n2.mult(this.distFromNatural*k/1000.0);
    n2n1.normalize(); n2n1.mult(this.distFromNatural*k/1000.0);
    this.node1.x += n1n2.x;
    this.node1.y += n1n2.y;
    this.node2.x += n2n1.x;
    this.node2.y += n2n1.y;
  }
  draw() {
    var k; // amount of black
    if (this.isStrong) {
      k = 0;
      strokeWeight(2);
    } else {
      k = 230;
      strokeWeight(0);
    }
    // if (this.distFromNatural < -5) {
    //   stroke(
    //     // map(this.distFromNatural, 0, -10, k, 255),
    //     255,
    //     0,
    //     0
    //   );
    // } else {
    //   stroke(k);
    // }
    stroke(k);
    line(
      this.node1.x,
      this.node1.y,
      this.node2.x,
      this.node2.y,
    )
    // noStroke();
    // fill(0);
    // text(round(spring.distFromNatural), (spring.node1.x+spring.node2.x)/2, (spring.node1.y+spring.node2.y)/2);
  }
}
