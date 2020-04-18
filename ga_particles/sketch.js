/*

Particle attributes:
  speed
  radius
  hue

  chromosome = speed, radius, hue
  crossover takes random mix of speed/radius, hue is always averaged
  mutation uses normal dist to vary speed/radius

Simulation control:
  initial parameters
    - n particles
    - energy use
    - energy penalty for size (size^penalty)
    - energy reward for bounce
    - generate with species
  run x generations

  scatter of alive particles, radius vs speed
  vs generation
    - avg speed attribute
    - avg radius attribute
    - species population

Species:
  set groups of initial individuals to be share attributes with unique colour (a species)
  change hue by crossover of RGB of parents


Todo:
  boids
    - turn speed (requires energy)
    - max acceleration and velocity
    - aggression, perception
    - forage aggression
  grid sim
    - ap/ad, mr/armour, health
    - veg/meat, veg boosts ap, meat boosts ad
    - environment: various hazards and food types
  rockets v2
    - simplify existing, test it can work
    - implement actual crossover
    - multiple pathways (faster and harder, easier and slower)
  trace an image
  push a fluid sim into a pattern
  shoot balls into a shape or letter (projectile motion and or collisions)
    - if not collisions with each other, then collisions with obstacles that are in the way

*/

var fps = 30;

var N_INITIAL_SPECIES = 3;
var N_PARTICLES = 60;
var particles = []
var dead_particles = []
var generation = 0;

var BOUNDARY_MIN_X = 120;
var BOUNDARY_MAX_X = 0;
var BOUNDARY_MIN_Y = 0;
var BOUNDARY_MAX_Y = 0;

var MIN_SPEED = 400;
var MAX_SPEED = 600;
var MIN_RADIUS = 5;
var MAX_RADIUS = 25;

var BOUNCE_REWARD = 10;
var EAT_REWARD = 100;

var SLOW_AT_SIM_START = true;
var sim_speed = 5;
var MAX_SIM_SPEED = 15;

// for caculating dt of frame
// deltaTime is supposed to be a system variable that I would prefer to use
// https://p5js.org/reference/#/p5/deltaTime
var t_frame = 0;
var dt = 0;

var avg_fitness_history = [];
var best_fitness_history = [];
var worst_fitness_history = [];

var avg_radius_history = [];
var avg_speed_history = [];

var all_hues_history = []; // array of arrays

var first_gen_call = true;

// var scatter_data = [];
// var scatter_options = {
//     width: 400,
//     height: 400,
//     showLine: false,
//     showPoint: true,
//     axisX: {
//         showGrid: false,
//         showLabel: false
//     }
// };

var SIMULATE = 1;
var GENETICS = 2;
var IDLE     = 3;
var sim_state = SIMULATE;

function setup() {
  createCanvas(800, 600).parent('canvas-holder');
  frameRate(fps);

  BOUNDARY_MAX_X = width;
  BOUNDARY_MAX_Y = height;

  var species = [];
  var v, r, hue;
  for (var i = 0; i < N_INITIAL_SPECIES; i++) {
    v = random(MIN_SPEED, MAX_SPEED);
    r = random(MIN_RADIUS, MAX_RADIUS);
    hue = random(0, 255);
    species.push({v:v, r:r, hue:hue});
  }

  var s;
  for (var i = 0; i < N_PARTICLES; i++) {
    s = random(species);
    particles.push(new Particle(s.v, s.r, s.hue))
  }

  // var v, r, hue;
  // for (var i = 0; i < N_PARTICLES; i++) {
  //   v = random(MIN_SPEED, MAX_SPEED);
  //   r = random(MIN_RADIUS, MAX_RADIUS);
  //   hue = random(0, 255);
  //   particles.push(new Particle(v, r, hue))
  //   scatter_data.push({v:v, r:r})
  // }

}



function draw() {
  dt = (millis() - t_frame)/1000;
  t_frame = millis();

  if (sim_state === SIMULATE) {
    do_simulation(dt);
  } else if (sim_state === GENETICS) {
    do_genetics();
  }

  // var data = {
  //   series: [
  //     scatter_data
  //   ]
  // };
  //
  // new Chartist.Line('.ct-chart', scatter_data, scatter_options);

}

function random_int(min, max) {
    // integers, remove + 1 and floor for floats
    return floor(random() * (max - min + 1) ) + min;
}

function keyPressed() {
  var override_browser_behaviour = false;

  if (keyCode === UP_ARROW) {
    sim_speed++;
    override_browser_behaviour = true;
  } else if (keyCode === DOWN_ARROW) {
    sim_speed--;
    override_browser_behaviour = true;
  }
  sim_speed = constrain(sim_speed, 1, MAX_SIM_SPEED);

  if (keyCode === ENTER) {
    SLOW_AT_SIM_START = !SLOW_AT_SIM_START;
  }

  if (override_browser_behaviour) { return false }
  else { return true }
}


function do_simulation(dt) {
  if (first_gen_call) {
    background(0);
  } else {
    noStroke();
    fill(0);
    // clear main area
    rect(120, 0, width - 120, height);
    // clear text area
    rect(0, 0, 120, 40);
  }

  var loops = sim_speed;
  if (SLOW_AT_SIM_START) {
    var p_done = particles.length / N_PARTICLES;
    loops = constrain(sim_speed * map(p_done, 0.2, 0.8, 1, 0), 1, sim_speed);
    loops = floor(loops);
  }

  var do_draw = false;
  for (var i = 0; i < loops; i++) {
    if (i == loops - 1) { do_draw=true }
    if (!do_draw) {}
    simulate(dt, do_draw);
  }

  noStroke();
  fill(100);
  textAlign(LEFT, BOTTOM);
  text('fps: '+nf(1/dt, 1, 1), 5, 15);
  text('alive: '+particles.length, 5, 30);
  text('gen: '+generation, 60, 30);
  textAlign(RIGHT);
  text(sim_speed+'x', width-5, 15);
  text(loops+'x', width-5, 30);

  draw_scatter(5, 37, 100, 100);

  if (first_gen_call) {
    first_gen_call = false;
    draw_lines(
      [avg_fitness_history, best_fitness_history, worst_fitness_history],
      [color(255), color(0,255,0), color(255,0,0)],
      5, 147, 100, 100
    );
    draw_line(
      avg_radius_history,
      color(255, 0, 0), true,
      5, 257, 100, 100
    );
    draw_line(
      avg_speed_history,
      color(0, 255, 0), false,
      5, 257, 100, 100
    );
    draw_stacked_histogram(
      // [[1,2,4,5,10], [10,20,40,50,100]],
      all_hues_history,
      5, 367, 100, 100
    )
  }

  if (particles.length === 0) {
    sim_state = GENETICS;
    first_gen_call = true;
  }

}

function do_genetics(dt) {
  // background(0);
  // fill(100);
  // text('doing genetics...', 5, 15);


  // sim_state = IDLE;
  sim_state = SIMULATE;
  generation++;
  // only doing up front so new particles generate within correct boundaries
  if (BOUNDARY_MAX_X - BOUNDARY_MIN_X > 300) {
    BOUNDARY_MIN_X += 5;
    BOUNDARY_MAX_X -= 5;
  }
  if (BOUNDARY_MAX_Y - BOUNDARY_MIN_Y > 300) {
    BOUNDARY_MIN_Y += 5;
    BOUNDARY_MAX_Y -= 5;
  }

  // sort by fitness, and calc average fitness
  var top_per = 0.3;
  var sum_f = 0, sum_r = 0, sum_v = 0;
  var f, r, v;
  var all_f = [], all_hues = [];
  dead_particles.sort(function(a, b) { return b.lifetime - a.lifetime });
  for (var i = 0; i < dead_particles.length; i++) {
    f = dead_particles[i].lifetime;
    sum_f += f; all_f.push(f);
    all_hues.push(dead_particles[i].col_h)
    // text(nf(f, 1, 1), 5, 30+i*13);
    // average attributes of most fit individuals (top_per%)
    if (i < top_per*dead_particles.length) {
      r = dead_particles[i].r;
      v = dead_particles[i].v;
      sum_r += r;
      sum_v += v;
    }
  }
  avg_fitness_history.push(sum_f/N_PARTICLES);
  best_fitness_history.push(max(all_f));
  worst_fitness_history.push(min(all_f));
  avg_radius_history.push(sum_r/(top_per*N_PARTICLES));
  avg_speed_history.push(sum_v/(top_per*N_PARTICLES));
  all_hues_history.push(all_hues);

  // cross top p% with each other
  var p = 0.5;
  var a, b;
  while (particles.length < p*N_PARTICLES) {
    a = dead_particles[random_int(0, floor(p*N_PARTICLES))];
    b = dead_particles[random_int(0, floor(p*N_PARTICLES))];
    particles.push(mutate(crossover(a, b)));
  }
  // cross any 2 with each other until have full population again
  while (particles.length < N_PARTICLES) {
    a = dead_particles[random_int(0, N_PARTICLES-1)];
    b = dead_particles[random_int(0, N_PARTICLES-1)];
    particles.push(mutate(crossover(a, b)));
  }

  dead_particles = [];


}

function crossover(a, b) {
  // 'a' and 'b' are particles
  var p0 = random();
  var p1 = random();
  var v = p0*a.v + (1-p0)*b.v;
  var r = p1*a.r + (1-p1)*b.r;
  var hue = (a.col_h + b.col_h) / 2;
  return new Particle(v, r, hue);
}

function mutate(p) {
  // 'p' is a particle
  var v = constrain(randomGaussian(p.v, (MAX_SPEED-MIN_SPEED)/3), MIN_SPEED, MAX_SPEED);
  var r = constrain(randomGaussian(p.r, (MAX_RADIUS-MIN_RADIUS)/3), MIN_RADIUS, MAX_RADIUS);
  var hue = constrain(round(randomGaussian(p.col_h,20)), 0, 255);
  return new Particle(v, r, hue);
}


function simulate(dt, do_draw) {

  // draw dead first so they appear under alive particles
  if (do_draw) {
    for (var i = 0; i < dead_particles.length; i++) {
      dead_particles[i].draw();
    }
  }

  for (var i = 0; i < particles.length; i++) {
    particles[i].move(dt);
    if (do_draw) { particles[i].draw(); }
  }

  // collisions
  var pi, pj, d;
  for (var i = 0; i < particles.length; i++) {
    for (var j = 0; j < particles.length; j++) {

      if (i == j) {continue}

      pi = particles[i];
      pj = particles[j];

      d = pi.pos.dist(pj.pos)

      // collision has occured
      if (d < pi.r + pj.r) {
        if (pi.r < pj.r) {
          pi.kill();
          pj.eat();
        } else if (pj.r < pi.r) {
          pj.kill();
          pi.eat();
        }
      }

    }
  }

  // find new dead particles
  for (var i = particles.length - 1; i >= 0; i--) {
    if (particles[i].dead) {
      dead_particles.push(particles[i]);
      particles.splice(i, 1);
    }
  }

}


function draw_scatter(x, y, w, h) {
  noStroke();
  fill(50);
  rect(x, y, w, h);

  stroke(255);
  line(x+0.5*w, y, x+0.5*w, y+h);
  line(x, y+0.5*h, x+w, y+0.5*h);
  noStroke();
  fill(255);
  textAlign(LEFT, TOP);
  text('r', x+0.5*w+3, y);
  text('v', x+3, y+0.5*h+3);

  noStroke();
  var p, v, r;
  var pv, pr;
  var radius = 3;
  for (var i = 0; i < particles.length; i++) {
    v = particles[i].v;
    r = particles[i].r;
    pv = (v-MIN_SPEED)/(MAX_SPEED-MIN_SPEED);
    pr = (r-MIN_RADIUS)/(MAX_RADIUS-MIN_RADIUS);
    pv = map(pv, 0, 1, 0.05, 0.95);
    pr = map(pr, 0, 1, 0.05, 0.95);
    fill(particles[i].col);
    circle(
      x + pv*w,
      y + h - pr*h,
      radius
    );
  }
}

function draw_lines(datas, cols, x, y, w, h) {
  if (datas.length != cols.length) {alert('mismatched data/col length!')}

  noStroke();
  fill(50);
  rect(x, y, w, h);

  if (datas[0].length < 2) {
    return;
  }

  var data;
  var datas_min = [];
  var datas_max = [];

  for (var i = 0; i < datas.length; i++) {
    data = datas[i];
    datas_min.push(min(data));
    datas_max.push(max(data));
  }

  var data_min = min(datas_min);
  var data_max = max(datas_max);
  var d0, d1;

  // todo: handle negative data as well
  if (data_max < data_min || data_max < 0 || data_min < 0) {
    alert('data not positive')
  }

  for (var i = 0; i < datas.length; i++) {
    data = datas[i];
    stroke(cols[i]);
    for (var j = 0; j < data.length - 1; j++) {
      d0 = data[j];
      d1 = data[j+1];
      line(
        x + j/(data.length-1) * w,
        y + h - (d0-data_min)/(data_max-data_min) * h,
        x + (j+1)/(data.length-1) * w,
        y + h - (d1-data_min)/(data_max-data_min) * h
      );
    }
  }

}

function draw_line(data, col, draw_bg, x, y, w, h) {
  if (draw_bg) {
    noStroke();
    fill(50);
    rect(x, y, w, h);
  }

  if (data.length < 2) {
    return;
  }

  var data_min = min(data);
  var data_max = max(data);
  var d0, d1;

  // todo: handle negative data as well
  if (data_max < data_min || data_max < 0 || data_min < 0) {
    alert('data not positive')
  }

  stroke(col);
  for (var i = 0; i < data.length; i++) {
    d0 = data[i];
    d1 = data[i+1];
    line(
      x + i/(data.length-1) * w,
      y + h - (d0-data_min)/(data_max-data_min) * h,
      x + (i+1)/(data.length-1) * w,
      y + h - (d1-data_min)/(data_max-data_min) * h
    );
  }

}

function draw_stacked_histogram(datas, x, y, w, h) {
  // a stacked percentage histogram

  // not actually using bins since it looks good without them as a nearly smooth gradient
  // var bins = N_INITIAL_SPECIES;

  noStroke();

  if (datas.length > 20) {
    datas = datas.slice(datas.length-20);
  }

  var col_width = w / datas.length;
  if (datas.length < 5) {
    col_width = w / 5;
  }

  var data, bin_size, v, sum, yc;
  for (var i = 0; i < datas.length; i++) {

    data = datas[i];
    data.sort(function(a,b){return a-b}); // .sort() sorts as strings by default
    // bin_size = (max(data) - min(data))/bins;
    sum = 0;
    for (var j = 0; j < data.length; j++) {
      sum += data[j];
    }

    yc = 0;
    for (var j = 0; j < data.length; j++) {
      v = data[j];
      colorMode(HSB, 255);
      fill(color(v, 255, 255));
      colorMode(RGB, 255);
      rect(
        x + col_width*i,
        y + h - v/sum * h - yc,
        col_width + 1, // + 1 to remove gaps between rects
        v/sum * h + 1 // + 1 to remove gaps between rects
      );
      yc += v/sum * h
    }

  }
}


class Particle {
  constructor(v, r, hue) {
    this.pos = createVector(random(BOUNDARY_MIN_X, BOUNDARY_MAX_X), random(BOUNDARY_MIN_Y, BOUNDARY_MAX_Y))
    this.v = v;
    this.angle = random(0, 2*PI);

    this.r = r;
    this.col_h = hue;
    this.col_s = 255;
    this.col_b = 255;
    this.col = this.make_color();

    this.use = 0.000002;
    this.energy = 300;
    this.dead = false;

    this.lifetime = 0;

    // Needed because simulating multiple times for fast-forward and only drawing a flash on one of those frames
    // does not usually place the flash correctly.
    this.draw_flash = false;
  }

  make_color() {
    if (this.dead) {
      this.col_s = 160;
    }
    colorMode(HSB, 255);
    var c = color(this.col_h, this.col_s, this.col_b);
    colorMode(RGB, 255);
    return c;
  }

  move(dt) {
    if (this.dead) {return}

    this.lifetime += dt;

    this.energy -= dt * pow(this.r, 2) * this.use * pow(this.v, 2);
    if (this.energy < 0) {
      this.kill();
      return;
    }

    var prev_pos = this.pos.copy();
    this.pos.add(
      dt * this.v / this.r * cos(this.angle),
      dt * this.v / this.r * sin(this.angle)
    );

    if (this.pos.y - this.r < BOUNDARY_MIN_Y) {
      this.pos.set(this.pos.x, BOUNDARY_MIN_Y+this.r);
      this.angle *= -1;
      this.energy += BOUNCE_REWARD*this.v/500;
    } else if (this.pos.y + this.r > BOUNDARY_MAX_Y) {
      this.pos.set(this.pos.x, BOUNDARY_MAX_Y - this.r)
      this.angle *= -1;
      this.energy += BOUNCE_REWARD*this.v/500;
    }

    if (this.pos.x - this.r < BOUNDARY_MIN_X) {
      this.pos.set(BOUNDARY_MIN_X + this.r, this.pos.y);
      this.angle -= PI;
      this.angle *= -1;
      this.energy += BOUNCE_REWARD*this.v/500;
    } else if (this.pos.x + this.r > BOUNDARY_MAX_X) {
      this.pos.set(BOUNDARY_MAX_X - this.r, this.pos.y)
      this.angle -= PI;
      this.angle *= -1;
      this.energy += BOUNCE_REWARD*this.v/500;
    }

  }

  kill() {
    this.dead = true;
    this.energy = 0;
  }

  eat() {
    if (this.dead) {return}
    this.energy += EAT_REWARD;
    this.draw_flash = true;
    // draw flash
    noStroke();
    fill(255);
    circle(this.pos.x, this.pos.y, this.r);
  }

  draw() {
    // lazy fix for sometimes dead particles not dimming, I think due to energy being added after eating or collision for one tick
    // if (this.dead) { this.energy = 0 }

    noStroke();
    var col = 255;
    if (!this.draw_flash) {
      this.col_b = this.energy + 30;
      this.col = this.make_color();
      col = this.col;
    }
    fill(col);
    circle(this.pos.x, this.pos.y, this.r);
    this.draw_flash = false;
  }
}
