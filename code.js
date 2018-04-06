function Color(r, g, b) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.toString = function () {
    return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
  }
}
function randInt(min, max) {
  return (Math.random() * (max-min) + min) | 0;
}
function randomColor() {
  return new Color(randInt(0,255), randInt(0,255), randInt(0,255));
}
function randomPastelColor() {
  return new Color(randInt(200,255), randInt(200,255), randInt(200,255));
}
function Position(x,y) {
  this.x = x;
  this.y = y;
}
function positionEqual(a, b) {
  return a.x == b.x && a.y == b.y;
}
function positionAdd(a, b) {
  return new Position(a.x + b.x, a.y + b.y);
}
function positionClampToBoard(state, a) {
  a.x = Math.max(0, Math.min(a.x, state.boardWidth - 1));
  a.y = Math.max(0, Math.min(a.y, state.boardHeight - 1));
  return a;
}
function randomPosition(state, position) {
  return new Position(randInt(0, state.boardWidth), randInt(0, state.boardHeight));
}
function randomEmptyPosition(state) {
  var pos = randomPosition(state);
  while(isOccupied(state, pos)) {
   pos = randomPosition(state);
  }
  return pos;
}
function setState(state) {
  var CANVAS_WIDTH = 500;
  var CANVAS_HEIGHT = CANVAS_WIDTH;
  var BOARD_WIDTH = 40;
  var BOARD_HEIGHT = 40;
  state.canvasWidth = CANVAS_WIDTH;
  state.canvasHeight = CANVAS_HEIGHT;
  state.boardWidth = BOARD_WIDTH;
  state.boardHeight = BOARD_HEIGHT;
  state.squareSize = CANVAS_WIDTH/BOARD_WIDTH;
  state.timeOfLastStep = 0;
  state.backgroundColor = randomPastelColor().toString();
  state.cursorPosition = new Position(BOARD_WIDTH/2, BOARD_HEIGHT/2);
  state.inputs = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
  };
  return state;
}
function drawAtPosition(ctx, state, pos) {
  ctx.strokeRect(pos.x * state.squareSize, pos.y * state.squareSize,
      state.squareSize, state.squareSize);
}
function draw(ctx, state) {
  // background
  ctx.fillStyle = state.backgroundColor;
  ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  drawAtPosition(ctx, state, state.cursorPosition);
}
function step(state) {
}
function init() {
  var canvas = document.getElementById('main_canvas');
  var ctx = canvas.getContext('2d');
  var state = {};
  var state = setState(state);
  console.log(state);
  document.addEventListener('keydown', (event) => {
    const keyName = event.key;
    var LEFT = new Position(-1, 0);
    var RIGHT = new Position(1, 0);
    var UP = new Position(0, -1);
    var DOWN = new Position(0, 1);
    var keyCodeToVector = {
      "ArrowLeft": LEFT,
      "ArrowRight": RIGHT,
      "ArrowUp": UP,
      "ArrowDown": DOWN,
    };
    if (Object.keys(keyCodeToVector).includes(keyName)) {
      state.inputs[keyName] = true;
      // finish
      state.cursorPosition = positionAdd(state.cursorPosition, keyCodeToVector[keyName]);
      positionClampToBoard(state, state.cursorPosition);
      event.preventDefault();
    }
  })
  animate(ctx, state);
};
function animate(ctx, state) {
  window.requestAnimationFrame(function (ts) {
    if (ts - state.timeOfLastStep > 16) {
      step(state);
      state.timeOfLastStep = ts;
      draw(ctx, state);
    }
    animate(ctx, state);
  });
}
