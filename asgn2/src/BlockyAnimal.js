// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  uniform mat4 u_ModelMatrix; 
  uniform mat4 u_GlobalRotateMatrix; 

  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position; 
    gl_PointSize = u_Size;
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor; // uniform
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

//global variables

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let g_cameraAngleX = 0;
let g_isTailAnimating = false;
let g_isWalking = false;
let g_legWalkTime = 0;
let g_legLiftAngle = 0;
// tentacle
let g_isTentacleAnimating = false;
let g_tentacleTime = 0;
let g_tentacleAngle = 0;
let g_tentacleExtend = 0;
// mouse
let g_mouseDown = false;
let g_lastMouseX = null;
let g_lastMouseY = null;



function setUpWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true})
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);

}

function connectVarToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
}

//globals related to ui elements
let g_globalAngle = 0;
let g_upperLegAngle = 85; // was 75
let g_midLegAngle = 45;   // was 35
let g_footAngle = 15;     // was 30
let g_tailAngle1 = 0;
let g_tailAngle2 = 0;
let g_tailAngle3 = 0;

//set up actions for html ui elements
function addActionsForHtmlUI(){

  document.getElementById('upperLegSlider').addEventListener('input', function() {
    g_upperLegAngle = this.value;
    renderAllShapes();
  });

  document.getElementById('midLegSlider').addEventListener('input', function() {
    g_midLegAngle = this.value;
    renderAllShapes();
  });

  document.getElementById('footSlider').addEventListener('input', function() {
    g_footAngle = this.value;
    renderAllShapes();
  });

  document.getElementById('toggleTail').onclick = () => {
    g_isTailAnimating = !g_isTailAnimating;
  };
  
  document.getElementById('toggleWalk').onclick = () => {
    g_isWalking = !g_isWalking;
  };

}

function main() {
  // Set up canvas and WebGL context
  setUpWebGL();
  // Set up GLSL shader and connect variables
  connectVarToGLSL();
  // Hook up UI elements
  addActionsForHtmlUI();

  // === MOUSE DRAG ROTATION ===
  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) {
      g_isTentacleAnimating = !g_isTentacleAnimating; // toggle tentacle animation
    } else {
      g_mouseDown = true;
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
    }
  };

  canvas.onmouseup = function() {
    g_mouseDown = false;
  };

  canvas.onmousemove = function(ev) {
    if (g_mouseDown) {
      const deltaX = ev.clientX - g_lastMouseX;
      const deltaY = ev.clientY - g_lastMouseY;

      g_globalAngle += deltaX * 0.5;
      g_cameraAngleX += deltaY * 0.5;
      g_cameraAngleX = Math.max(-90, Math.min(90, g_cameraAngleX)); // clamp X rotation

      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;

      renderAllShapes();
    }
  };

  // Set background color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Set initial global angle from slider
  // Initial render
  renderAllShapes();
  tick();
}

const tan = [0.82, 0.71, 0.55, 1.0]; // soft tan color
const tanDarker = [0.65, 0.56, 0.43, 1.0];  // alternate, darker tan

function renderLeg(baseMatrix, upperAngle, midAngle, footAngle, liftOffset = 0) {
  baseMatrix.translate(0, liftOffset, 0);

  const tan = [0.82, 0.71, 0.55, 1.0];

  const upper = new Cube();
  upper.color = tanDarker;
  upper.matrix = new Matrix4(baseMatrix);
  upper.matrix.rotate(upperAngle, 0, 0, 1);
  upper.matrix.scale(0.2, 0.6, 0.2);
  upper.render();

  const mid = new Cube();
  mid.color = tan;
  mid.matrix = new Matrix4(upper.matrix);
  mid.matrix.translate(0, 1.0, 0);
  mid.matrix.translate(0, -0.3, 0);
  mid.matrix.rotate(midAngle, 0, 0, 1);
  mid.matrix.scale(1, 0.8, 1);
  mid.render();

  const foot = new Cube();
  foot.color = tanDarker;
  foot.matrix = new Matrix4(mid.matrix);
  foot.matrix.translate(0, 1.0, 0);
  foot.matrix.translate(0, -0.1, 0);
  foot.matrix.rotate(g_footAngle, 0, 0, 1);
  foot.matrix.scale(1, 0.7, 1);
  foot.render();
}

function renderAllShapes() {
  const globalRotMat = new Matrix4()
  .rotate(g_cameraAngleX, 1, 0, 0)   // up/down tilt only
  .rotate(g_globalAngle, 0, 1, 0);   // left/right spin

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // === Body ===
  const body = new Cube();
  body.color = tan;
  body.matrix.translate(-0.3, -0.5, 0.0);
  body.matrix.scale(0.6, 0.15, 0.4);
  body.render();

  const legAttachY = 0;
  const legZOffsets = [0.75, 0.0, .25]; // more spaced

  const walkSpeed = 0.05; // Slower than 0.1

legZOffsets.forEach((zOffset, i) => {
  const phase = g_legWalkTime * walkSpeed + i;

  // Animate joint angles if walking
// Animate joint angles if walking
const upperAngle = g_isWalking ? 90 + Math.sin(phase) * 15 : g_upperLegAngle;
const midAngle   = g_isWalking ? 45 + Math.sin(phase + 0.5) * 10 : g_midLegAngle;
const footAngle  = g_isWalking ? 15 + Math.sin(phase + 1.0) * 10 : g_footAngle;
  const liftY = g_isWalking  ? Math.max(0, -Math.sin(phase)) * 0.05 : 0;

  // Left leg
  const left = new Matrix4(body.matrix);
  left.translate(.25, legAttachY, zOffset);
  renderLeg(left, upperAngle, midAngle, footAngle, liftY);

  // Right leg
  const right = new Matrix4(body.matrix);
  right.translate(0.75, legAttachY, zOffset);
  right.scale(-1, 1, 1);
  renderLeg(right, upperAngle, midAngle, footAngle, liftY);
});




  let tailBody = new Cube();
  tailBody.color = tanDarker;
  tailBody.matrix = new Matrix4(body.matrix);
  tailBody.matrix.translate(0.4, .75, 0.25);           // top-middle of the body
  tailBody.matrix.scale(0.2, 0.5, 0.5);              // skinny and long
  tailBody.render();

  // === Tail Segment 1 ===
  let tail1 = new Cube();
  tail1.color = tan;
  tail1.matrix = new Matrix4(body.matrix);
  tail1.matrix.translate(0.4, .75, 0.25);           // base of tail
  tail1.matrix.rotate(g_tailAngle1, 0, 1, 0);        // wag from base
  tail1.matrix.translate(0, 0, 0.5);                 // extend outward
  tail1.matrix.scale(0.2, 0.3, 0.6);
  tail1.render();

  // === Tail Segment 2 ===
  let tail2 = new Cube();
  tail2.color = tanDarker;
  tail2.matrix = new Matrix4(tail1.matrix);
  tail2.matrix.rotate(g_tailAngle2, 0, 1, 0);        // wag from new joint
  tail2.matrix.translate(0, 0, 0.5);                 // extend again
  tail2.matrix.scale(1, 1, 1);
  tail2.render();

  // === Tail Segment 3 ===
  let tail3 = new Cube();
  tail3.color = tan;
  tail3.matrix = new Matrix4(tail2.matrix);
  tail3.matrix.rotate(g_tailAngle3, 0, 1, 0);        // final wag
  tail3.matrix.translate(0, 0, 0.5);
  tail3.render();

    // === Single Tentacle ===
    const tentacle = new Cylinder();
    tentacle.color = [0.9, 0.4, 0.5, 1.0]; // tongue pink
  
    // Animation: gentle wiggle + extend
    const angle = Math.sin(g_tentacleTime * 0.05) * 10; // side wiggle
    const length = Math.abs(Math.sin(g_tentacleTime * 0.03)) * 0.3 + 0.2; // extend/retract
  
    tentacle.matrix.translate(0.0, -0.4, 0.25); // base position
    tentacle.matrix.rotate(180, 1, 0, 0);      // point downward
    tentacle.matrix.rotate(angle, 0, 0, 1);    // wiggle
    tentacle.matrix.scale(0.05, length, 0.05); // shape and extension
    tentacle.render();
}

let g_tailTime = 0;

function updateAnimationAngles() {
  if (g_isTailAnimating) {
    g_tailTime += 1;
    g_tailAngle1 = Math.sin(g_tailTime * 0.05) * 20;
    g_tailAngle2 = Math.sin(g_tailTime * 0.05 + 0.5) * 15;
    g_tailAngle3 = Math.sin(g_tailTime * 0.05 + 1.0) * 10;
  }

  if (g_isWalking) {
    g_legWalkTime += 1;
    g_legLiftAngle = -Math.sin(g_legWalkTime * 0.1) * 20;
  }
  if (g_isTentacleAnimating) {
    g_tentacleTime += 1;
  }
}

let g_lastFrameTime = performance.now();
let g_lastFpsUpdateTime = performance.now();
let g_fpsSamples = [];

function tick() {
  const now = performance.now();
  const delta = now - g_lastFrameTime;
  g_lastFrameTime = now;

  const currentFPS = 1000 / delta;
  g_fpsSamples.push(currentFPS);

  // Keep only recent 30 samples
  if (g_fpsSamples.length > 30) {
    g_fpsSamples.shift();
  }

  // Only update FPS display every 500ms
  if (now - g_lastFpsUpdateTime >= 500) {
    const avgFPS = g_fpsSamples.reduce((sum, fps) => sum + fps, 0) / g_fpsSamples.length;
    document.getElementById('fpsCounter').innerText = `FPS: ${avgFPS.toFixed(1)}`;
    g_lastFpsUpdateTime = now;
  }

  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}