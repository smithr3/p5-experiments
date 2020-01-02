// http://p5js.org/reference/

let fps = 30;
let width = 500;
let height = 800;

let duration = 350; // frames
let frameCount = 0;

let rockets = [];
let obstacles = [];
let deadRockets = 0;

let generation = 0;
let last_avg_fitness = 0;
let last_best_fitness = 0;

// for caculating dt of frame
let t_frame = 0;
let dt = 0;

function setup() {
  createCanvas(width, height);
  frameRate(fps);

  for (var i=0; i<80; i++) {
    rockets.push(new Rocket(width/2, height-20));
  }
  obstacles.push(new Obstacle(width/2, height-200, 20, 150));
  obstacles.push(new Obstacle(width/2 - 100, height-300, 50, 50));
  obstacles.push(new Obstacle(width/2 + 100, height-300, 50, 50));
  obstacles.push(new Obstacle(width/2 - 100, height-100, 50, 50));
  obstacles.push(new Obstacle(width/2 + 100, height-100, 50, 50));
  obstacles.push(new Obstacle(width/2 - 50, height-400, 70, 90));
  obstacles.push(new Obstacle(width/2 + 50, height-400, 70, 90));
  obstacles.push(new Obstacle(width/2 - 70, height-550, 50, 100));
  obstacles.push(new Obstacle(width/2 + 70, height-550, 50, 100));
  obstacles.push(new Obstacle(width/2, height-600, 20, 50));

  // boundaries
  obstacles.push(new Obstacle(0, height/2, 50, height+2));
  obstacles.push(new Obstacle(width, height/2, 50, height+2));
  obstacles.push(new Obstacle(width/2, -26, width, 50));
  obstacles.push(new Obstacle(width/2, height+26, width, 50));
}

function draw() {
  dt = (millis() - t_frame)/1000;
  t_frame = millis();

  background(200);
  noStroke();
  fill(0);
  textSize(16);
  text('generation: '+str(generation), 40, 20);
  text('frame: '+str(frameCount), 40, 40);
  text('dead/rockets: ('+str(deadRockets)+','+str(rockets.length)+')', 40, 60);
  text('last fitness: '+int(last_avg_fitness)+', '+int(last_best_fitness), 40, 80);
  text('fps: '+nf(1/dt, 1, 1), 40, 100);

  for (var i=0; i<obstacles.length; i++) {
    obstacles[i].draw();
  }

  // deltaTime is supposed to be a system variable that I would prefer to use
  // https://p5js.org/reference/#/p5/deltaTime
  for (var i=0; i<rockets.length; i++) {
    // draw all chromosomes
    for (var j=0; j<rockets[i].dna.n; j++) {
      resetMatrix();
      if (rockets[i].dna.alleles[j] == -1) {stroke(255,0,0)}
      if (rockets[i].dna.alleles[j] == 0) {stroke(0)}
      if (rockets[i].dna.alleles[j] == 1) {stroke(0,0,255)}
      point(width-150+j*2, 10+i*2);
      point(width-150+j*2, 11+i*2);
      point(width-151+j*2, 10+i*2);
      point(width-151+j*2, 11+i*2);
    }
    // update and collisions
    rockets[i].update(dt);
    for (var j=0; j<obstacles.length; j++) {
      if (!rockets[i].dead && rockets[i].collide(obstacles[j])) {
        deadRockets += 1;
      }
    }
    rockets[i].draw();
  }


  if (deadRockets >= rockets.length || frameCount > duration) {
    // GENETIC ALGORITHM HERE
    // calculate fitness
    let sum = 0;
    for (var i=0; i<rockets.length; i++) {
      // rockets[i].fitness = height - rockets[i].y;
      // print(rockets[i].fitness);
      sum += rockets[i].fitness;
    }
    print(sum);
    print(rockets.length);
    last_avg_fitness = sum/rockets.length;
    // sort by fitness
    rockets.sort(function(a, b) {
      return b.fitness - a.fitness;
    })
    last_best_fitness = rockets[0].fitness;
    console.log(rockets);
    // grab top 20% fittest
    let m1 = ceil(rockets.length*0.4);
    let m2 = m1*2;
    let rocketsNextGen = [];
    // grab top 20% and breed until have 20% of pop
    while (rocketsNextGen.length < m1) {
      let i = round(random(0,m1));
      let j = round(random(0,m1));
      if (i != j) {
        rocketsNextGen.push(breed(rockets[i], rockets[j]));
      }
    }
    // randomly pair them to breed new rockets to replace bottom 20%
    // grab next 20% and breed them until reach max pop
    while (rocketsNextGen.length < rockets.length) {
      let i = round(random(m1,m2));
      let j = round(random(m1,m2));
      if (i != j) {
        rocketsNextGen.push(breed(rockets[i], rockets[j]));
      }
    }
    // remaining rockets "killed" (just not used for breeding)
    rockets = rocketsNextGen;
    frameCount = 0;
    deadRockets = 0;
    generation += 1;
  } else {
    frameCount += 1;
  }
}

class Rocket {
  constructor(x, y) {
    // start position on canvas
    this.start_x = x;
    this.start_y = y;
    this.x = x;
    this.y = y;

    this.speed = 50;
    this.turnSpeed = 0.05;

    this.heading = 0; // radians, turn direction
    this.angle = 0; // radians, actual current angle

    this.dead = false;
    this.fitness = 0;

    this.dna = new Chromosome(duration, 10)
  }
  reset() {
    this.x = this.start_x;
    this.y = this.start_y;
    this.heading = 0;
    this.angle = 0;
    this.dead = false;
  }
  update(dt) {
    if (this.dead) {return}

    this.heading = this.dna.getInstruction(frameCount);
    this.angle += this.turnSpeed*this.heading;
    this.x += dt*this.speed*sin(this.angle);
    this.y -= dt*this.speed*cos(this.angle); // -= so heading=0 is up page

    this.fitness = height - this.y;
  }
  collide(o) {
    // o = obstacle
    // true if collision with given obstacle
    if (this.x > (o.x-o.w/2) && this.x < (o.x+o.w/2)) {
      if (this.y > (o.y-o.h/2) && this.y < (o.y+o.h/2)) {
        this.dead = true;
        return true;
      }
    }
    return false;
  }
  draw() {
    resetMatrix();
    // noStroke();
    // fill(0);
    // text(str(int(this.fitness)),this.x, this.y);
    stroke(0);
    fill(255);
    // order of transforms matters
    translate(this.x, this.y);
    rotate(this.angle);
    triangle(-4,2,0,-7,4,2)
  }
}

class Chromosome {
  constructor(duration, size) {
    // duration in frames of Chromosome
    // duration in frames of a single allele (instruction)
    this.n = ceil(duration/size);
    this.duration = duration; // saved to easily create new child dna
    this.size = size;
    this.alleles = [];
    for (var i=0; i<this.n; i++) {
      this.alleles.push(random([-1,0,1]));
    }
  }
  getInstruction(frameCount) {
    if (frameCount >= this.duration) {
      return this.alleles[this.n-1]; // last allele
    } else {
      return this.alleles[floor(frameCount/this.size)];
    }
  }
}

function breed(a, b) {
  // breed rockets a and b
  let childDNA = new Chromosome(a.dna.duration, a.dna.size);
  for (var i=0; i<childDNA.n; i++) {
    if (random() < 0.2) {
      childDNA.alleles[i] = random([-1, 0, 1]);
    } else {
      childDNA.alleles[i] = random([b.dna.alleles[i], a.dna.alleles[i]]);
    }
  }
  let child = new Rocket(a.start_x, a.start_y);
  child.dna = childDNA;
  return child;
}

class Obstacle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  draw() {
    resetMatrix();
    stroke(50);
    fill(150);
    rect(this.x-this.w/2,this.y-this.h/2,this.w,this.h);
  }
}
