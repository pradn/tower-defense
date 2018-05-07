function assert(condition, message) {
  if (!condition) {
      message = message || "Assertion failed";
      if (typeof Error !== "undefined") {
          throw new Error(message);
      }
      throw message; // Fallback
  }
}
function drawAtVec2D(ctx, state, pos) {
  ctx.strokeRect(pos.x * state.squareSize, pos.y * state.squareSize,
    state.squareSize, state.squareSize);
}
function fillAtVec2D(ctx, state, pos, size) {
  ctx.fillRect(pos.x * state.squareSize + (state.squareSize - size)/2, pos.y * state.squareSize + (state.squareSize - size)/2,
    size, size);
}
class Color {
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.toString = function () {
      return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
    }
  }
  static randomPastelColor() {
    return new Color(randInt(200,255), randInt(200,255), randInt(200,255));
  }
}
function randInt(min, max) {
  return (Math.random() * (max-min) + min) | 0;
}
function randElement(arr) {
  return arr[randInt(0, arr.length)];
}
function randomColor() {
  return new Color(randInt(0,255), randInt(0,255), randInt(0,255));
}
class Vec2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  clone() {
    return new Vec2D(this.x, this.y);
  }
  equal(b) {
    return this.x == b.x && this.y == b.y;
  }
  add(b) {
    this.x += b.x;
    this.y += b.y;
    return this;
  }
  clampToBoard(board) {
    this.x = Math.max(0, Math.min(this.x, board.width - 1));
    this.y = Math.max(0, Math.min(this.y, board.height - 1));
    return this;
  }
  // unused
  static random(board) {
    return new Vec2D(randInt(0, board.width), randInt(0, board.height));
  }
}
var LEFT = new Vec2D(-1, 0);
var RIGHT = new Vec2D(1, 0);
var UP = new Vec2D(0, -1);
var DOWN = new Vec2D(0, 1);
class Array2D {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = [];
    for (let i = 0; i < width; i++) {
      let arr = [];
      for (let j = 0; j < height; j++) {
        arr.push(null);
      }
      this.data.push(arr);
    }
  }
  validIndices(i, j) {
    return i >= 0 && i < this.width &&
           j >= 0 && j < this.height;
  }
  occupied(i, j) {
    assert(this.validIndices(i, j));
    return this.data[i][j] != null;
  }
  put(i, j, obj) {
    assert(this.validIndices(i, j));
    assert(!this.occupied(i, j));
    this.data[i][j] = obj;
  }
  move(i, j, direction) {
    assert(this.validIndices(i, j));
    let loc = new Vec2D(i, j);
    let newLoc = loc.add(direction);
    this.put(newLoc.x, newLoc.y, this.get(i, j));
    this.data[i][j] = null;
  }
  remove(i, j) {
    assert(this.validIndices(i, j));
    let tmp = this.data[i][j];
    this.data[i][j] = null;
    return tmp;
  }
  get(i, j) {
    assert(this.validIndices(i, j));
    assert(this.occupied(i, j));
    return this.data[i][j];
  }
  forEach(fn) {
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        if (this.occupied(i, j)) {
          fn(this.data[i][j], i, j);
        }
      }
    }
  }
  forAdjacent(i, j, num, fn) {
    for (let a = -num; a <= num; a++) {
      for (let b = -num; b <= num; b++) {
        let x = i + a;
        let y = j + b;
        if (this.validIndices(x,y)) {
          fn(this.data[x][y], x, y);
        }
      } 
    }
  }
}
class Enemy {
  constructor(state, stage, guides, life, moveInterval) {
    this.state = state;
    this.stage = stage;
    this.location = guides[0].location.clone();
    this.maxLife = life;
    this.life = life;
    this.moveInterval = moveInterval;
    this.guides = guides;
    this.guideIndex = 0;
    this.time = 0;
  }
  step(i, j) {
    if (this.time % this.moveInterval == 0) {
      this.advance(i, j);
    }
    this.time++;
  }
  remove() {
    this.stage.remove(this.location.x, this.location.y);
  }
  // todo: use i and j
  advance(i, j) {
    let moveDirection = this.guides[this.guideIndex].direction
    let newLoc = this.location.clone().add(moveDirection);
    if (this.stage.occupied(newLoc.x, newLoc.y)) {
      return;
    }
    this.stage.move(this.location.x, this.location.y, moveDirection);
    this.location.add(moveDirection);
    if (this.guideIndex < this.guides.length - 1 &&
      this.location.equal(this.guides[this.guideIndex + 1].location)) {
      this.guideIndex++;
    }
    if (this.location.equal(this.guides[this.guides.length - 1].location)) {
      this.life = 0;
      this.state.lost = true;
      this.remove();
    }
  }
  receiveAttack(damage) {
    this.life -= damage;
    if (this.life < 0) {
      this.state.score += this.maxLife;
      this.remove();
    }
  }
  draw(ctx, state) {
    let ratio = this.life / this.maxLife;
    ctx.fillStyle = "rgb(" + (ratio * 255 | 0) + ",0,0)"; 
    fillAtVec2D(ctx, state, this.location, state.squareSize/2);
  }
}
class TowerSpec {
  constructor(color, cost, attackInterval, attackDamage, range, effect) {
    this.color = color;
    this.cost = cost;
    this.attackInterval = attackInterval;
    this.attackDamage = attackDamage;
    this.range = range;
    this.effect;
  }
  static random() {
    return randElement(TowerSpec.specs);
  }
}
TowerSpec.specs = [
  new TowerSpec("blue", 50, /*attackInterval=*/3, /*attackDamage=*/3, /*attackRange=*/2, /*effect=*/""),
  new TowerSpec("yellow", 60, /*attackInterval=*/2, /*attackDamage=*/3, /*attackRange=*/2, /*effect=*/""),
  new TowerSpec("green", 80, /*attackInterval=*/4, /*attackDamage=*/7, /*attackRange=*/2, /*effect=*/""),
  new TowerSpec("orange", 110, /*attackInterval=*/4, /*attackDamage=*/10, /*attackRange=*/1, /*effect=*/""),
];
class Tower {
  constructor(stage, towerSpec) {
    this.stage = stage;
    this.towerSpec = towerSpec;
    this.time = 0;
  }
  step(i, j) {
    if (this.time % this.towerSpec.attackInterval == 0) {
      this.attack(i, j);
    }
    this.time++;
  }
  attackInRange(i, j, range, damage) {
    this.stage.forAdjacent(i, j, range, (obj, x, y) => {
      if (this.stage.occupied(x, y) && obj instanceof Enemy) {
        obj.receiveAttack(damage);
      }
    })
  }
  attack(i, j) {
    // less damage far away
    for (let r = 1; r <= this.towerSpec.range; r++) {
      this.attackInRange(i, j, r, this.towerSpec.attackDamage/this.towerSpec.range);
    }
  }
  draw(ctx, state, i, j) {
    ctx.fillStyle = this.towerSpec.color;
    fillAtVec2D(ctx, state,  new Vec2D(i, j), state.squareSize/2);
  }
}
class Trajectory {
  constructor(location, direction) {
    this.location = location;
    this.direction = direction;
  }
  clone() {
    return new Trajectory(this.location.clone(), this.direction);
  }
}
class Spawner {
  constructor(state, stage, guides) {
    this.state = state;
    this.stage = stage;
    this.guides = guides;
    this.time = 0;
    this.spawnInterval = 10;
    this.difficultyIncreaseInterval = this.spawnInterval * 10;
  }
  spawnEnemy() {
    let health = 10 + 5 * this.time / (this.difficultyIncreaseInterval);
    let newEnemy = new Enemy(this.state, this.stage, this.guides, health, 2);
    if (!this.stage.occupied(newEnemy.location.x, newEnemy.location.y)) {
      this.stage.put(newEnemy.location.x, newEnemy.location.y, newEnemy);
    }
  }
  step() {
    if (this.time % this.spawnInterval == 0) {
      this.spawnEnemy();
    }
    this.time++;
  }
}
class Level {
  constructor(state) {
    this.width = 20;
    this.height = 20;
    this.guides = [ new Trajectory(new Vec2D(0, 15), RIGHT),
      new Trajectory(new Vec2D(5, 15), UP),
      new Trajectory(new Vec2D(5, 5), RIGHT),
      new Trajectory(new Vec2D(15, 5), DOWN),
      new Trajectory(new Vec2D(15, 15), RIGHT),
      new Trajectory(new Vec2D(19, 15), RIGHT) ];
    this.spawner = (state, stage, guides) => {
      return new Spawner(state, stage, guides);
    }
    this.paints = Level.generatePaints(this.width, this.height, this.guides);
    this.canBuildSquares = Level.canBuildSquares(this.paints);
  }
  static generatePaints(width, height, guides) {
    let paints = new Array2D(width, height);
    let tracerStage = new Array2D(width, height);
    let fakeState = { lost: false, score: 0 };
    // todo: factor out Guides following logic
    let tracer = new Enemy(fakeState, tracerStage, guides, 1, 1);
    tracerStage.put(tracer.location.x, tracer.location.y, tracer);
    while (tracer.life > 0) {
      tracer.advance();
      paints.remove(tracer.location.x, tracer.location.y);
      paints.put(tracer.location.x, tracer.location.y, "path");
      paints.forAdjacent(tracer.location.x, tracer.location.y, 2, 
                                (adjLoc, x, y) => {
        if (!paints.occupied(x, y)) {
          paints.put(x, y, "canBuild");
        }
      })
    }
    return paints;
  }
  static canBuildSquares(paints) {
    var squares = [];
    paints.forEach((x, i, j) => {
      if (x == "canBuild") {
        squares.push(new Vec2D(i, j));
      }
    });
    return squares;
  }
}
class Board {
  constructor(state, level, buildOrder) {
    this.state = state;
    this.currentBuild = 0;    
    this.buildOrder = buildOrder;
    this.width = level.width;
    this.height = level.height;
    this.stage = new Array2D(level.width, level.height);
    //todo: use sparse 2d array to make lookups fast
    this.guides = level.guides;
    this.paints = level.paints;
    this.canBuildSquares = level.canBuildSquares;
    this.spawner = level.spawner(this.state, this.stage, this.guides);
  }
  buildTower(build) {
    this.state.money -= build.towerSpec.cost;
    this.stage.put(build.location.x, build.location.y, new Tower(this.stage, build.towerSpec));
  }
  canBuild(build) {
    let loc = build.location;
    return !this.stage.occupied(loc.x, loc.y) &&
        this.paints.occupied(loc.x, loc.y) &&
        this.paints.get(loc.x, loc.y) == "canBuild" &&
        this.state.money >= build.towerSpec.cost;
  }
  step() {
    this.state.money += 1;

    if (this.currentBuild < this.buildOrder.builds.length) {
      let build = this.buildOrder.builds[this.currentBuild];
      if (this.canBuild(build)) {
        this.buildTower(build);
        this.currentBuild++;
      }
    }
    
    this.spawner.step();
    this.stage.forEach((obj, i, j) => {
      obj.step(i, j);
    });
  }
}
function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
}
class Build {
  constructor(loc, towerSpec) {
    this.location = loc;
    this.towerSpec = towerSpec;
  }
  static random(level) {
    let randomLoc = randElement(level.canBuildSquares).clone();
    return new Build(randomLoc, TowerSpec.random());
  }
}
class BuildOrder {
  constructor(buildOrder) {
    this.builds = buildOrder;
    this.score = 0;
  }
  /*static random(level) {
    let buildOrder = [];
    for(let i = 0; i < 161; i++) {
      buildOrder.push(Build.random(level));
    }
    return new BuildOrder(buildOrder);
  }*/
  static empty() {
    return new BuildOrder([]);
  }
  static random(level) {
    let buildOrder = [];
    let canBuild = level.canBuildSquares;
    for(let i = 0; i < canBuild.length; i++) {
      buildOrder.push(new Build(canBuild[i], TowerSpec.random()));
    }
    shuffle(buildOrder);
    return new BuildOrder(buildOrder);
  }
  mutate(level) {
    let newBuildOrder = [];
    for (let i = 0; i < this.builds.length; i++) {
      let r = randInt(0, 200);
      if (r < 5) {
        newBuildOrder.push(Build.random(level));
      } else if (r < 10) {
        newBuildOrder.push(Build.random(level));
        newBuildOrder.push(this.builds[i]);
      } else if (r < 15) {
        //delete
      }else {
        newBuildOrder.push(this.builds[i]);
      }
    }
    return new BuildOrder(newBuildOrder);
  }
  crossOver(other) {
    let copyTil = randInt(0, this.builds.length);
    let newBuildOrder = [];
    for (let i = 0; i < copyTil; i++) {
      newBuildOrder.push(this.builds[i]);
    }
    let copyFrom = randInt(0, other.length);
    for (let i = copyFrom; i < other.length; i++) {
      newBuildOrder.push(other.builds[i]);
    }
    return new BuildOrder(newBuildOrder);
  }
}
function setState(state, level, buildOrder) {
  var CANVAS_WIDTH = 500;
  var CANVAS_HEIGHT = CANVAS_WIDTH;
  state.canvasWidth = CANVAS_WIDTH;
  state.canvasHeight = CANVAS_HEIGHT;
  state.score = 0;
  state.money = 100;
  state.lost = false;
  state.board = new Board(state, level, buildOrder);
  state.squareSize = CANVAS_WIDTH/state.board.width;
  state.stepInterval = 1000/10;
  state.timeOfLastStep = 0;
  state.drawInterval = 1000/60;
  state.timeOfLastDraw = 0;
  state.backgroundColor = Color.randomPastelColor().toString();
  state.cursorLocation = new Vec2D(state.board.width/2, state.board.height/2);
  state.inputs = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
  };
}
function draw(ctx, state) {
  ctx.fillStyle = state.backgroundColor;
  ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

  let board = state.board;

  board.paints.forEach((obj, i, j) => {
    ctx.fillStyle = obj == "path" ? "white" : "pink"; 
    fillAtVec2D(ctx, state, new Vec2D(i, j), state.squareSize);
  });

  board.stage.forEach((obj, i, j) => {
    obj.draw(ctx, state, i, j);
  });

  ctx.strokeStyle = "green";
  ctx.lineWidth = 2;
  drawAtVec2D(ctx, state, board.guides[0].location, state.squareSize);

  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  drawAtVec2D(ctx, state, board.guides[board.guides.length - 1].location, state.squareSize);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  drawAtVec2D(ctx, state, state.cursorLocation);
}
class GeneticAlg {
  constructor(level) {
    this.level = level;
    this.pool = [];
    for (let i = 0; i < 100; i++) {
      let buildOrder = BuildOrder.random(this.level);
      this.pool.push(buildOrder);
    }
    this.bestScore = 0;
    this.bestState = {};
  }
  runOnce() {
    let buildOrder = BuildOrder.random(this.level);
    this.runOrder(buildOrder);
  }
  runPool() {
    this.pool.forEach((buildOrder) => {
      this.runOrder(buildOrder);
    });
  }
  runAlg() {
    this.runPool();
    //console.log(this.pool);
    this.pool.sort((a, b) => {
      if (a.score < b.score) {
        return 1;
      } else if (a.score > b.score) {
        return -1;
      }
      return 0;
    })
    //console.log(this.pool);
    for (let i = this.pool.length * 1/4; i < this.pool.length * 1/2; i++) {
      this.pool[i] = BuildOrder.random(this.level);
    }
    for (let i = this.pool.length * 1/2; i < this.pool.length * 3/4; i++) {
      let first = this.pool[randInt(0, this.pool.length/4)];
      let second = this.pool[randInt(0, this.pool.length/4)];
      this.pool[i] = first.crossOver(second);
    }
    for (let i = this.pool.length * 3/4; i < this.pool.length; i++) {
      let skewedElite = (Math.random() * Math.random() * this.pool.length/4) | 0;
      this.pool[i] = this.pool[skewedElite].mutate(this.level);
    }
  }
  runOrder(buildOrder) {
    //console.log("ran one order");
    let state = {};
    setState(state, this.level, buildOrder);
    let i = 0;
    while (!state.lost && i <= 100000) {
      state.board.step();
      if (i > 100000) {
        console.log(buildOrder);
        console.log("reached limit");
        break;
      }
      i++;
    }
    if (this.bestScore == 0 || this.bestScore < state.score) {
      this.bestScore = state.score;
      this.bestState = state;
      console.log("best score " + this.bestScore);
    }
    buildOrder.score = state.score;
    return state.score;
  }
}
function keyHandler(state, event) {
  const keyName = event.key;
  var keyCodeToVector = {
    "ArrowLeft": LEFT,
    "ArrowRight": RIGHT,
    "ArrowUp": UP,
    "ArrowDown": DOWN,
  };
  if (Object.keys(keyCodeToVector).includes(keyName)) {
    state.inputs[keyName] = true;
    state.cursorLocation.add(keyCodeToVector[keyName]);
    state.cursorLocation.clampToBoard(state.board);
    event.preventDefault();
  } else if (keyName == "x") {
    state.board.buildTower(new Build(state.cursorLocation, TowerSpec.specs[0]));
  }
}
function init() {
  var canvas = document.getElementById('main_canvas');
  var ctx = canvas.getContext('2d');
  let level = new Level();
  let state = {};
  if (false) {
    let genAlg = new GeneticAlg(level);
    console.log("done");
    //genAlg.runPool();
    //animate(ctx, state);
    for (let i = 0; i < 10000; i++) {
      genAlg.runAlg();  
      state = genAlg.bestState;
      console.log("finished run (" + i + "): best score " + genAlg.bestScore); 
      draw(ctx, state);
      document.getElementById('can2').src = canvas.toDataURL("image/png");
    }
    return;
  } else {
    let buildOrder = BuildOrder.empty();
    setState(state, level, buildOrder);
    document.addEventListener('keydown', (event) => {
      keyHandler(state, event);
    })
    animate(ctx, state);
  }
};
function animate(ctx, state) {
  window.requestAnimationFrame(function (ts) {
    if (ts - state.timeOfLastStep > state.stepInterval) {
      if (!state.lost) {
        state.board.step();
      }
      state.timeOfLastStep = ts;
    }
    if (ts - state.timeOfLastDraw > state.drawInterval) {
      draw(ctx, state);
      state.timeOfLastDraw = ts;
    }
    
    animate(ctx, state);
  });
}
