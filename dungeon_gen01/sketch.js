/*
http://p5js.org/reference/

To load the local image files, need to use a web server. I use Web Server for Chrome. Point it at dungeon_gen01 then
visit http://127.0.0.1:8887/
See https://github.com/processing/p5.js/wiki/Local-server

https://old.reddit.com/r/gamedev/comments/dx95df/cave_generation_using_bsp_and_cellular_automaton/
https://old.reddit.com/r/gamedev/comments/1dlwc4/procedural_dungeon_generation_algorithm_explained/
http://www.roguebasin.com/index.php?title=Basic_BSP_Dungeon_generation
https://www.gridsagegames.com/blog/2014/06/procedural-map-generation/
some thoughts and references
https://github.com/jrheard/voke

nice visualisations:
  drunkards walk
  https://blog.jrheard.com/procedural-dungeon-generation-drunkards-walk-in-clojurescript
  cellular automata
  https://blog.jrheard.com/procedural-dungeon-generation-cellular-automata

A* between two select points
door and exit tiles

*/

let fps = 30;

let gridGraph;

// tile images
let tiles;

function setup() {
  createCanvas(800, 800);
  frameRate(fps);

  tiles = [
    loadImage('tiles/1.png'),
    loadImage('tiles/2.png')
  ];

  gridGraph = new GridGraph(40, 40);
  gridGraph.cellGen()
  // gridGraph.randomlyPlace(0.45);
}

function draw() {
  background(220);
  // image(tiles[0], 0, 0)
  // image(tiles[1], 16, 0)
  // gridGraph.cellularAutomation([5,6,7,8], [4,5,6,7,8])
  gridGraph.draw();
}

function isInArray(value, array) {
    return array.indexOf(value) > -1;
}

class GridGraph {
  constructor(xsize, ysize) {
    this.xsize = xsize;
    this.ysize = ysize;
    this.grid = [];
    for (var i=0; i<xsize; i++) {
      this.grid.push([]);
      for (var j=0; j<ysize; j++) {
        this.grid[i].push(-1);
      }
    }
  }
  draw() {
    var tile;
    for (var i=0; i<this.xsize; i++) {
      for (var j=0; j<this.ysize; j++) {
        tile = this.grid[i][j];
        if (tile > -1) {
          image(
            tiles[tile],
            width/2 + int(i-this.xsize/2)*16,
            height/2 + int(j-this.ysize/2)*16
          );
          // fill(255,0,0,100);
          // noStroke();
          // rect(
          //   width/2 + int(i-this.xsize/2)*16,
          //   height/2 + int(j-this.ysize/2)*16,
          //   16,16
          // )
        }
      }
    }
  }
  cellGen() {
    // generate cells using several iterations of a cellular automation (Conway's Game of Life)
    this.randomlyPlace(0.45);
    for (var i=0; i<5; i++) {
      this.cellularAutomation([5,6,7,8], [4,5,6,7,8])
    }
  }
  randomlyPlace(density) {
    for (var i=0; i<this.xsize; i++) {
      for (var j=0; j<this.ysize; j++) {
        if (Math.random() < density) {
          this.grid[i][j] = 0;
        }
      }
    }
  }
  cellularAutomation(born, survives) {
    var next = [];
    for (var i=0; i<this.xsize; i++) {
      next.push([]);
      for (var j=0; j<this.ysize; j++) {
        next[i].push(0);
      }
    }
    var neighbours, isAlive;
    for (var i=0; i<this.xsize; i++) {
      for (var j=0; j<this.ysize; j++) {

        neighbours = this.countNeighbours(i, j);
        if (this.grid[i][j] > -1) { isAlive = true } else { isAlive = false }

        // fill(0);
        // text(neighbours, width/2 + int(i-this.xsize/2)*16, height/2 + int(j-this.ysize/2)*16 + 16);

        if (!isAlive && isInArray(neighbours, born)) {
          next[i][j] = 1;
        } else if (isAlive && isInArray(neighbours, survives)) {
          next[i][j] = 1;
        } else {
          next[i][j] = 0;
        }

      }
    }
    for (var i=0; i<this.xsize; i++) {
      for (var j=0; j<this.ysize; j++) {
        if (next[i][j] === 1) {
          this.grid[i][j] = 0;
        } else {
          this.grid[i][j] = -1;
        }
      }
    }
  }
  countNeighbours(ix, jx) {
    var count = 0;
    for (var i = ix-1; i <= ix+1; i++) {
      for (var j = jx-1; j <= jx+1; j++) {
        if (i === ix && j === jx) { continue }
        if (i < 0 || i >= this.xsize) { continue }
        if (j < 0 || j >= this.ysize) { continue }
        if (this.grid[i][j] > -1) {
          count++;
        }
      }
    }
    return count;
  }
}
