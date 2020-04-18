/*

Colourful rockets.

Interesting behaviour:
    Difference between weighting fitness with path smoothness
        Perhaps good for optimising once performance already good
        Does make getting stuck in local maxima more likely as change is resisted
        What about penalising direction changing vs rewarding path straightness?
    Mutation rates and new population strategy
        Extreme elitism
        Extreme random
    Getting stuck in local maxima

    To try:
        Different species taking different routes
        Time heuristic - alter earlier alleles less as generations go on or fitness increases
            Emphasise application specific

Todo:
    2 simulations with different initial settings at once

Upgrades to template:
    Is focused
    Graphs handling negative data
    Separate populations

*/


// all unitialised variables are set in reset_all()
var config = configs[0];
var obstacle_layout = obstacle_layouts[0];

var fps = 30;

var UI_WIDTH = 120;

var BOUNDARY_MIN_X = UI_WIDTH;
var BOUNDARY_MAX_X = 0;
var BOUNDARY_MIN_Y = 0;
var BOUNDARY_MAX_Y = 0;

var START_X;
var START_Y;

var N_POPULATIONS;
// per popluation
var N_INITIAL_SPECIES;
var N_ROCKETS;
var N_TOTAL_ROCKETS;
var populations;
var dead_rockets;
var obstacles;

var ROCKET_SPEED;
var ROCKET_TURN_SPEED;

var TOTAL_TICKS; // per sim
var TICKS_PER_ALLELE;

var sim_speed = 1;
var MAX_SIM_SPEED = 15;
var SLOW_AT_SIM_START = true;

var avg_fitness_history;
var best_fitness_history;
var worst_fitness_history;

var all_hues_history; // array of arrays

// for caculating dt of frame
// deltaTime is supposed to be a system variable that I would prefer to use
// https://p5js.org/reference/#/p5/deltaTime
var t_prev_frame = 0;
var dt = 0;

var sim_ticks; // resets every generation
var generation;

var first_gen_call;

var START_FINE_OPTIMISATIONS;
var ALLOWED_SPECIES_DIFF;

var SIMULATE = 1;
var GENETICS = 2;
var IDLE     = 3;
var sim_state;

var trail_buffer;


function setup() {
    createCanvas(600, 800).parent('canvas-holder');
    frameRate(fps);

    BOUNDARY_MAX_X = width;
    BOUNDARY_MAX_Y = height;

    START_X = width/2 + UI_WIDTH/2;
    START_Y = height - 50;

    reset_all();
}


function draw() {
    dt = (millis() - t_prev_frame)/1000;
    t_prev_frame = millis();

    if (!focused) {
        return;
    }

    if (sim_state === SIMULATE) {
        do_simulation(dt);
    } else if (sim_state === GENETICS) {
        do_genetics(dt);
    }
}

/************************************************************************
MISC FUNCTIONS
************************************************************************/

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
    } else if (keyCode === LEFT_ARROW) {
        sim_speed = 1;
        override_browser_behaviour = true;
    } else if (keyCode === RIGHT_ARROW) {
        sim_speed = MAX_SIM_SPEED;
        override_browser_behaviour = true;
    }
    sim_speed = constrain(sim_speed, 1, MAX_SIM_SPEED);

    if (keyCode === ENTER) {
        SLOW_AT_SIM_START = !SLOW_AT_SIM_START;
    }

    if (override_browser_behaviour) { return false }
    else { return true }
}

function set_config(name) {
    for (var i = 0; i < configs.length; i++) {
        if (configs[i].name === name) {
            config = configs[i];
        }
    }
    reset_all();
}

function set_obstacles(name) {
    for (var i = 0; i < obstacle_layouts.length; i++) {
        if (obstacle_layouts[i].name === name) {
            obstacle_layout = obstacle_layouts[i];
        }
    }
    reset_all();
}

function reset_all() {
    N_POPULATIONS     = config.N_POPULATIONS;
    N_INITIAL_SPECIES = config.N_INITIAL_SPECIES;  // per popluation
    N_ROCKETS         = config.N_ROCKETS;          // per popluation
    N_TOTAL_ROCKETS   = N_ROCKETS * N_POPULATIONS;
    populations  = [];
    dead_rockets = 0;
    obstacles    = [];

    ROCKET_SPEED      = getWithDefault(config.ROCKET_SPEED, 100);
    ROCKET_TURN_SPEED = getWithDefault(config.ROCKET_TURN_SPEED, 0.07);

    TOTAL_TICKS      = getWithDefault(config.TOTAL_TICKS, 200);
    TICKS_PER_ALLELE = getWithDefault(config.TICKS_PER_ALLELE, 2);

    START_FINE_OPTIMISATIONS = getWithDefault(config.START_FINE_OPTIMISATIONS, 100);
    ALLOWED_SPECIES_DIFF = getWithDefault(config.ALLOWED_SPECIES_DIFF, 20);

    sim_speed = 1;
    MAX_SIM_SPEED = 15;
    SLOW_AT_SIM_START = true;

    sim_state = SIMULATE;

    avg_fitness_history = [];
    best_fitness_history = [];
    worst_fitness_history = [];

    all_hues_history = [];

    sim_ticks = 0; // resets every generation
    generation = 0;

    first_gen_call = true;

    trail_buffer = createGraphics(width,height);

    // Generate initial individuals as copies of a few initial species

    var species = [];
    var dna, hue;
    for (var j = 0; j < N_POPULATIONS; j++) {
        species.push([]);
        for (var i = 0; i < N_INITIAL_SPECIES; i++) {
            dna = new Chromosome();
            hue = random_int(0, 255);
            species[j].push({dna:dna, hue:hue});
        }
    }

    var s, r;
    var rockets;
    for (var j = 0; j < N_POPULATIONS; j++) {
        rockets = []
        for (var i = 0; i < N_ROCKETS; i++) {
            s = species[j][floor(i*N_INITIAL_SPECIES/N_ROCKETS)];
            r = new Rocket();
            r.dna = s.dna;
            r.col_h = s.hue;
            rockets.push(r);
        }
        populations.push(rockets)
    }

    // All random individuals

    // var v, r, hue;
    // for (var i = 0; i < N_ROCKETS; i++) {
    //     dna = new Chromosome();
    //     rockets.push(new Rocket(dna))
    // }

    var x, y, w, h;
    for (var i = 0; i < obstacle_layout.obstacles.length; i+=4) {
        x = width/2 + UI_WIDTH/2 + obstacle_layout.obstacles[i];
        y = height - obstacle_layout.obstacles[i+1];
        w = obstacle_layout.obstacles[i+2];
        h = obstacle_layout.obstacles[i+3];
        obstacles.push(new Obstacle(x,y,w,h))
    }
}

function getWithDefault(maybe_value, default_value) {
    if (typeof(maybe_value) === 'undefined') {
        return default_value;
    }
    return maybe_value;
}

/************************************************************************
CORE CODE
************************************************************************/

function do_simulation(dt) {
    if (first_gen_call) {
        background(0);
    } else {
        noStroke();
        fill(0,0,0,255);
        // clear main area
        rect(UI_WIDTH, 0, width - UI_WIDTH, height);
        // clear text area
        fill(0);
        rect(0, 0, UI_WIDTH, 45);
    }

    var loops = sim_speed;
    if (SLOW_AT_SIM_START) {
        var p_done = (N_TOTAL_ROCKETS - dead_rockets) / N_TOTAL_ROCKETS;
        loops = constrain(sim_speed * map(p_done, 0.2, 0.8, 1, 0), 1, sim_speed);
        loops = floor(loops);
    }

    var do_draw;
    for (var i = 0; i < loops; i++) {
        do_draw = false;
        if (i == loops - 1) { do_draw=true }
        if (i % 2 == 0) { do_draw=true }
        simulate(dt, do_draw);
    }

    noStroke();
    fill(100);
    textAlign(LEFT, BOTTOM);
    text('fps: '+nf(1/dt, 1, 1), 5, 15);
    text('config: '+config.name, 60, 15);
    text('alive: '+str(N_TOTAL_ROCKETS-dead_rockets), 5, 30);
    text('gen: '+generation, 60, 30);
    text('tick: '+sim_ticks, 60, 45);
    textAlign(RIGHT);
    text(sim_speed+'x', width-5, 15);
    text(loops+'x', width-5, 30);

    if (generation > START_FINE_OPTIMISATIONS) {
        textAlign(LEFT);
        text('FINE TUNING HEURISTICS ACTIVE', width/2, 15);
    }


    // graphs that only update after each generation
    if (first_gen_call) {
        first_gen_call = false;
        draw_all_dna(5, 50, 100, 150);
        draw_lines(
          [avg_fitness_history, best_fitness_history, worst_fitness_history],
          [color(255), color(0,255,0), color(255,0,0)],
          5, 205, 100, 100
        );
        draw_stacked_histogram(
          all_hues_history,
          5, 310, 100, 100
        )
    }

    if (sim_ticks > TOTAL_TICKS || dead_rockets >= N_TOTAL_ROCKETS) {
        sim_state = GENETICS;
        first_gen_call = true;
        // resetting sim for after genetics done
        sim_ticks = 0;
        dead_rockets = 0;
    }

}

function do_genetics(dt) {
    // resetMatrix();
    // background(0);
    // fill(100);
    // textAlign(LEFT);
    // text('doing genetics...', 5, 15);


    // sim_state = IDLE;
    sim_state = SIMULATE;
    generation++;

    // weight fitness by smoothness of path

    var r, c;
    var rockets;
    for (var k = 0; k < populations.length; k++) {
        rockets = populations[k];
        for (var i = 0; i < rockets.length; i++) {
            c = 0;
            r = rockets[i];

            // penalise direction changing
            if (generation > START_FINE_OPTIMISATIONS) {
                for (var j = 1; j < r.dna.n; j++) {
                    if (r.dna.alleles[j] != r.dna.alleles[j-1]) {
                        c++;
                    }
                }
                r.fitness *= 1/c;
            }


            // reward straight
            // for (var j = 0; j < r.dna.n; j++) {
            //     if (r.dna.alleles[j] === 0) {
            //         c++;
            //     }
            // }
            // r.fitness *= c;

            }
    }

    // sort by fitness, and calc average fitness

    var top_per = 0.3;
    var sum_f = 0, sum_r = 0, sum_v = 0;
    var f, r, v;
    var all_f = [], all_hues = [];
    var rockets;

    for (var j = 0; j < populations.length; j++) {
        rockets = populations[j];
        rockets.sort(function(a, b) { return b.fitness - a.fitness });
        for (var i = 0; i < rockets.length; i++) {
            f = rockets[i].fitness;
            sum_f += f;
            all_f.push(f);
            // text(nf(f, 1, 1), 5, 30+i*13);

            all_hues.push(rockets[i].col_h)
            // average attributes of most fit individuals (top_per%)
            // if (i < top_per*rockets.length) {
                //   r = rockets[i].r;
                //   v = rockets[i].v;
                //   sum_r += r;
                //   sum_v += v;
                // }
            }
    }

    avg_fitness_history.push(sum_f/N_TOTAL_ROCKETS);
    best_fitness_history.push(max(all_f));
    worst_fitness_history.push(min(all_f));
    // avg_radius_history.push(sum_r/(top_per*N_TOTAL_ROCKETS));
    // avg_speed_history.push(sum_v/(top_per*N_TOTAL_ROCKETS));
    all_hues_history.push(all_hues);

    var new_rockets;

    var allowed_species_diff = ALLOWED_SPECIES_DIFF;

    var s;
    for (var i = 0; i < populations.length; i++) {
        new_rockets = [];
        rockets = populations[i];

        if (generation > START_FINE_OPTIMISATIONS) {
            choose_parents(0.02, 0.8, 0.001, new_rockets, rockets);
            choose_parents(0.1, 1, 0.005, new_rockets, rockets);
        } else {
            for (var j = 0; j < config.strategy.length; j++) {
                s = config.strategy[j];
                choose_parents(s.p0, s.p1, s.m, new_rockets, rockets);
            }
        }

        populations[i] = new_rockets;
    }


}

function simulate(dt, do_draw) {
    sim_ticks++;

    if (do_draw) {
        // tint(255,10);
        trail_buffer.fill(0, 10);
        trail_buffer.rect(UI_WIDTH, 0, width-UI_WIDTH, height);
        image(trail_buffer, 0, 0);
    }

    for (var i = 0; i < obstacles.length; i++) {
        if (do_draw) { obstacles[i].draw(); }
    }

    var rockets;
    for (var j = 0; j < populations.length; j++) {
        rockets = populations[j];
        for (var i = 0; i < rockets.length; i++) {
            rockets[i].move(dt);
            if (do_draw) { rockets[i].draw(); }
        }
    }


}

/************************************************************************
GENETICS
************************************************************************/

function choose_parents(p0, p1, mutation_chance, new_rockets, rockets) {
    // cross top p0% with each other until have p1% of a new population
    var a, b;
    while (new_rockets.length < p1*N_ROCKETS) {
        a = rockets[random_int(0, floor(p0*N_ROCKETS))];
        b = rockets[random_int(0, floor(p0*N_ROCKETS))];
        if (abs(a.col_h - b.col_h) < ALLOWED_SPECIES_DIFF) {
            new_rockets.push(mutate(crossover(a, b), mutation_chance));
        }
    }
}

function crossover(a, b) {
    // 'a' and 'b' are rockets

    var new_dna = new Chromosome();
    var crossover_pt = random_int(1, new_dna.n - 1);
    for (var i=0; i<new_dna.n; i++) {
        if (i < crossover_pt) {
            new_dna.alleles[i] = a.dna.alleles[i];
        } else {
            new_dna.alleles[i] = b.dna.alleles[i];
        }
    }
    // for (var i=0; i<new_dna.n; i++) {
    //     if (random() < 0.5) {
    //         new_dna.alleles[i] = a.dna.alleles[i];
    //     } else {
    //         new_dna.alleles[i] = b.dna.alleles[i];
    //     }
    // }

    var child = new Rocket();
    child.dna = new_dna;
    child.col_h = (a.col_h + b.col_h) / 2;
    return child;
}

function mutate(r, chance) {
    // 'p' is a rocket

    var k;
    for (var i=0; i<r.dna.n; i++) {
        k = map(
            i, 0, r.dna.n,
            constrain(map(generation, START_FINE_OPTIMISATIONS/2, START_FINE_OPTIMISATIONS, 1, 0.1), 0.1, 1),
            1
        );
        if (random() < chance*k) {
            r.dna.alleles[i] = random([-1, 0, 1]);
            r.col_h = constrain(r.col_h + random([-5, 5]), 0, 255);
        }
    }

    return r;
}

/************************************************************************
GRAPHING
************************************************************************/

function draw_all_dna(x, y, w, h) {
    resetMatrix();
    stroke(50);
    strokeWeight(3);
    rect(x, y, w, h);

    var rockets = populations[0];

    // chromosome height and allele width
    var ch = h / N_TOTAL_ROCKETS;
    var aw = w / rockets[0].dna.n;

    noStroke();
    for (var k = 0; k < populations.length; k++) {
        rockets = populations[k];
        for (var i=0; i<rockets.length; i++) {
            for (var j=0; j<rockets[i].dna.n; j++) {
                if (rockets[i].dna.alleles[j] == -1) { fill(0)   }
                if (rockets[i].dna.alleles[j] ==  0) { fill(125) }
                if (rockets[i].dna.alleles[j] ==  1) { fill(255) }
                rect(
                    x + j*aw,
                    y + (i+k*N_ROCKETS)*ch,
                    aw, ch
                );
            }
        }

    }
    for (var k = 0; k < populations.length - 1; k++) {
        fill(255);
        rect(x, y + ((k+1)*N_ROCKETS)*ch, w, 1);
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
    // if (data_max < data_min || data_max < 0 || data_min < 0) {
    //     alert('data not positive')
    // }

    strokeWeight(2);

    for (var i = 0; i < datas.length; i++) {
        data = datas[i];
        stroke(cols[i]);
        for (var j = 0; j < data.length - 1; j++) {
            d0 = data[j];
            d1 = data[j+1];
            line(
                x + j/(data.length-1) * w,
                y + h - (abs(abs(data_min)-abs(d0)))/(data_max-data_min) * h,
                x + (j+1)/(data.length-1) * w,
                y + h - (abs(abs(data_min)-abs(d1)))/(data_max-data_min) * h
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

/************************************************************************
CLASSES
************************************************************************/

class Rocket {
    constructor() {
        this.x = START_X;
        this.y = START_Y;

        this.speed     = ROCKET_SPEED;
        this.turnSpeed = ROCKET_TURN_SPEED;

        this.heading = 0; // radians, turn direction
        this.angle   = 0; // radians, actual current angle

        this.dead = false;
        this.fitness = 0;

        this.col_h = random_int(0, 255);
        this.col_s = 255;
        this.col_b = 255;

        this.dna = new Chromosome();
    }

    make_col() {
        if (this.dead) {
          this.col_s = 160;
        }
        colorMode(HSB, 255);
        var c = color(this.col_h, this.col_s, this.col_b);
        colorMode(RGB, 255);
        return c;
    }

    kill() {
        dead_rockets++;
        this.dead = true;
        this.col_s = 100;
        this.col_b = 100;
    }

    move(dt) {
        if (this.dead) {return}

        this.heading = this.dna.getInstruction(sim_ticks);
        this.angle += this.turnSpeed*this.heading;
        this.x += dt*this.speed*sin(this.angle);
        this.y -= dt*this.speed*cos(this.angle); // '-=' so heading=0 is up page

        this.fitness = height - this.y;

        // boundary collisions
        if (this.x - 10 < BOUNDARY_MIN_X) {
            this.kill();
            this.x = BOUNDARY_MIN_X + 10;
        } else if (this.x > BOUNDARY_MAX_X) {
            this.kill();
            this.x = BOUNDARY_MAX_X;
        }

        if (this.y < BOUNDARY_MIN_Y) {
            this.kill();
            this.y = BOUNDARY_MIN_Y;
        } else if (this.y > BOUNDARY_MAX_Y) {
            this.kill();
            this.y = BOUNDARY_MAX_Y;
        }

        // obstacle collisions
        for (var i = 0; i < obstacles.length; i++) {
            if (this.collide(obstacles[i])) {
                this.kill();
            }
        }

    }

    collide(o) {
      // o = obstacle
      // true if collision with given obstacle
      var r = 5;
      if (this.x+r > (o.x-o.w/2) && this.x-r < (o.x+o.w/2)) {
        if (this.y+r > (o.y-o.h/2) && this.y-r < (o.y+o.h/2)) {
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
        if (this.dead) {
            stroke(100);
        } else {
            stroke(255);
        }
        strokeWeight(0);
        fill(this.make_col());
        // order of transforms matters
        translate(this.x, this.y);
        rotate(this.angle);
        triangle(-4,2,0,-7,4,2);
        resetMatrix();

        // only draw trails if alive
        if (this.dead) {return}

        // trail_buffer.noStroke();
        // this.col_s = 50;
        // trail_buffer.fill(255);
        // this.col_s = 255;
        // trail_buffer.translate(this.x, this.y);
        // trail_buffer.rotate(this.angle);
        // trail_buffer.triangle(-4,2,0,-7,4,2);

        trail_buffer.noStroke();
        this.col_s = 100;
        this.col_b = 200;
        trail_buffer.fill(this.make_col());
        this.col_s = 255;
        this.col_b = 255;
        trail_buffer.circle(this.x, this.y, 2);
    }
}

class Chromosome {
    constructor() {
        this.n = ceil(TOTAL_TICKS/TICKS_PER_ALLELE);
        this.alleles = [];
        for (var i=0; i<this.n; i++) {
            this.alleles.push(random([-1,0,1]));
        }
    }
    getInstruction(ticks) {
        if (ticks >= TOTAL_TICKS) {
            return this.alleles[this.n-1]; // last allele
        } else {
            return this.alleles[floor(ticks/TICKS_PER_ALLELE)];
        }
    }
}

class Obstacle {
  constructor(x, y, w, h) {
    this.x = x; // center point x
    this.y = y; // center point y
    this.w = w;
    this.h = h;
  }
  draw() {
    resetMatrix();
    noStroke();
    fill(150);
    rect(this.x-this.w/2,this.y-this.h/2,this.w,this.h);
  }
}
