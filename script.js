/*
  Johan Karlsson (DonKarlssonSan)
  Read about flow fields in by blog post:
  https://codepen.io/DonKarlssonSan/post/particles-in-simplex-noise-flow-field
*/

let canvas;
let ctx;
let field;
let w, h;
let size;
let columns;
let rows;
let zoom;

function setup() {
  size = 20;
  canvas = document.querySelector("#canvas");
  ctx = canvas.getContext("2d");
  reset();
  window.addEventListener("resize", reset);  
}

function initField() {
  field = new Array(columns);
  for(let x = 0; x < columns; x++) {
    field[x] = new Array(columns);
    for(let y = 0; y < rows; y++) {
      field[x][y] = 0;
    }
  }
}

function calculateField(now) {
  for(let x = 0; x < columns; x++) {
    for(let y = 0; y < rows; y++) {
      let angle = noise.simplex3(x/zoom, y/zoom, now / 1500) * Math.PI * 2;
      field[x][y] = angle;
    }
  }
}

function reset() {
  zoom = Math.random() * 90 + 20;
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  ctx.strokeStyle = "white";
  noise.seed(Math.random());
  columns = Math.floor(w / size) + 2;
  rows = Math.floor(h / size) + 2;
  initField();
}

function draw(now) {
  requestAnimationFrame(draw);
  calculateField(now);
  clear();
  drawField();
}

function clear() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, w, h);
}

function drawField() {
  for(let x = 0; x < columns; x++) {
    for(let y = 0; y < rows; y++) {
      let angle = field[x][y];
      ctx.beginPath();
      let x1 = x*size;
      let y1 = y*size;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + Math.cos(angle)*size*1.5, y1 + Math.sin(angle)*size*1.5);
      ctx.stroke();
    }
  }
}

setup();
draw(1);