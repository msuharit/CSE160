// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program


var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix; 
  uniform mat4 u_GlobalRotateMatrix; 
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;  // pass UV to fragment shader
  }
`;

var FSHADER_SOURCE = `
precision mediump float;
varying vec2 v_UV;
uniform sampler2D u_Sampler;
uniform float u_texColorWeight;
uniform vec4 u_FragColor;

void main() {
  vec4 texColor = texture2D(u_Sampler, v_UV);
  gl_FragColor = mix(u_FragColor, texColor, u_texColorWeight);
}
`;

//global variables

let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let g_cameraAngleX = 0;
let u_Sampler;
let camera;

//texture
const TEXTURE_METAL = 0;
const TEXTURE_SKY = 1;
let g_metalTexture = null;
let g_skyTexture = null;


// tail and leg
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

let g_yaw = 0;   // left/right
let g_pitch = 0; // up/down



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
  gl.disable(gl.CULL_FACE);   // ✅ Disable face culling so inside of cube is visible

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

  // // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
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

  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');

  if (!u_Sampler || !u_texColorWeight) {
    console.log('Failed to get sampler or tex weight uniform');
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');

  if (!u_ViewMatrix || !u_ProjectionMatrix) {
    console.log('Failed to get the storage location of view/projection matrix');
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

  document.getElementById('togglePointerLock').onclick = () => {
    canvas.requestPointerLock();
  };
}

function initTextures(callback) {
  let loaded = 0;

  const tryFinish = () => {
    loaded++;
    if (loaded === 2) {
      console.log("✅ Textures fully loaded");
      callback(); // safe to build cubes now
    }
  };

  const metalImage = new Image();
  
  metalImage.onload = function () {
    g_metalTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, g_metalTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, metalImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    tryFinish(); // 🔁 signals readiness
    console.log("✅ g_metalTexture loaded:", g_metalTexture);
  };
  metalImage.src = 'metal.png';

  const skyImage = new Image();
  skyImage.onload = function () {
    g_skyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, g_skyTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, skyImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    tryFinish(); // 🔁 signals readiness
  };
  skyImage.src = 'sky.jpg';
}

function main() {
  // Set up canvas and WebGL context
  setUpWebGL();
  // Set up GLSL shader and connect variables
  connectVarToGLSL();
  // Hook up UI elements
  addActionsForHtmlUI();

  //console.log("Cube class defined?", Cube);
  //console.log("Cube.prototype.render =", Cube.prototype.render.toString());
  camera = new Camera();

  const forward = new Vector3(camera.at.elements).sub(camera.eye);
  g_yaw = Math.atan2(forward.elements[0], forward.elements[2]) * 180 / Math.PI;
  g_pitch = Math.asin(forward.elements[1]) * 180 / Math.PI;



  initTextures(() => {
    g_wallCubes = [];
    renderAllShapes();
    buildHallway(16,7,-8,0); // or any length you want
    buildHallway(16,-10,-8,0); // or any length you want
    buildHallway(16,-8,-7,90); // or any length you want
    buildHallway(16,-8,10,90); // or any length you want
    tick()
  });
  

  // Set background color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  document.addEventListener('pointerlockchange', () => {
  const isLocked = document.pointerLockElement === canvas;
  if (isLocked) {
      document.addEventListener('mousemove', onMouseMoveWhileLocked);
    } else {
      document.removeEventListener('mousemove', onMouseMoveWhileLocked);
    }
  });

  // camera stuff
    document.onkeydown = function(ev) {
    switch (ev.key) {
      case 'w':
      case 'W':
        camera.moveForward();
        break;
      case 's':
      case 'S':
        camera.moveBackward();
        break;
      case 'a':
      case 'A':
        camera.moveLeft();
        break;
      case 'd':
      case 'D':
        camera.moveRight();
        break;
      case 'q':
      case 'Q':
        camera.panLeft();
        break;
      case 'e':
      case 'E':
        camera.panRight();
        break;
      case 'f': addBlock(); break;  // add block
      case 'g': deleteBlock(); break; // remove block
    }
    renderAllShapes(); // Make sure to re-render
  };

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
}

function onMouseMoveWhileLocked(event) {
  const sensitivity = 0.1;
  g_yaw += event.movementX * sensitivity;
  g_pitch -= event.movementY * sensitivity;

  // Clamp pitch to prevent flipping
  g_pitch = Math.max(-89, Math.min(89, g_pitch));

  camera.updateLookDirection(g_yaw, g_pitch);
  renderAllShapes();
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

let g_wallCubes = [];

function buildHallway(length = 10, startX = 0, startZ = 0, rotationDeg = 0) {
  const base = -0.5;
  const transform = new Matrix4();
  transform.translate(startX, 0, startZ);
  transform.rotate(rotationDeg, 0, 1, 0);

  for (let z = 0; z < length; z++) {
    for (let y = 0; y < 2; y++) {
      let leftWall = new Cube();
      leftWall.textureNum = TEXTURE_METAL;
      let leftMatrix = new Matrix4();
      leftMatrix.translate(0, y + base, z);
      leftWall.matrix = new Matrix4(transform).multiply(leftMatrix);
      g_wallCubes.push(leftWall);

      let rightWall = new Cube();
      rightWall.textureNum = TEXTURE_METAL;
      let rightMatrix = new Matrix4();
      rightMatrix.translate(2, y + base, z);
      rightWall.matrix = new Matrix4(transform).multiply(rightMatrix);
      g_wallCubes.push(rightWall);
    }

    let roof = new Cube();
    roof.textureNum = TEXTURE_METAL;
    let roofMatrix = new Matrix4();
    roofMatrix.translate(0, 2 + base, z);
    roofMatrix.scale(3, 1, 1);
    roof.matrix = new Matrix4(transform).multiply(roofMatrix);
    g_wallCubes.push(roof);
  }
}

function renderAllShapes() {

  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  const globalRotMat = new Matrix4()
  .rotate(g_cameraAngleX, 1, 0, 0)   // up/down tilt only
  .rotate(g_globalAngle, 0, 1, 0);   // left/right spin

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // ground 
  const ground = new Cube();
  ground.color = [0.3, 0.8, 0.3, 1.0];  // green
  ground.matrix.translate(-10, -1, -10);   // move it down
  ground.matrix.scale(20, 0.5, 20);   // flatten it
  ground.render();
  // skybox
  const sky = new Cube();
  sky.textureNum = TEXTURE_SKY
  sky.matrix.setTranslate(-50, -50, -50);
  sky.matrix.scale(100, 100, 100);
  sky.color = [1.0, 1.0, 1.0, 1.0];
  sky.render();

  for (let cube of g_wallCubes) {
    cube.render();
  }

  //placed/deleted blocks
  for (let b of g_blocks) {
    const cube = new Cube();
    cube.color = [0.8, 0.5, 0.2, 1]; // example color
    cube.matrix.translate(b.x, b.y, b.z);
    cube.render();
  }
    
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

// blocks

let g_blocks = [];

function getBlockCoordsInFront(dist = 1.0) {
  const dir = new Vector3(camera.at.elements);
  dir.sub(camera.eye);        // get forward direction
  dir.normalize();            // make it unit length
  dir.mul(dist);              // scale it

  const target = new Vector3(camera.eye.elements);
  target.add(dir);            // point in front

  const x = Math.floor(target.elements[0] + 0.5);
  const y = Math.floor(camera.eye.elements[1] + 0.5);
  const z = Math.floor(target.elements[2] + 0.5);

  return { x, y, z };
}

function addBlock() {
  const { x, y, z } = getBlockCoordsInFront();
  for (let b of g_blocks) {
    if (b.x === x && b.y === y && b.z === z) return; // already placed
  }
  g_blocks.push({ x, y, z });
}

function deleteBlock() {
  const { x, y, z } = getBlockCoordsInFront();
  for (let i = 0; i < g_blocks.length; i++) {
    const b = g_blocks[i];
    if (b.x === x && b.y === y && b.z === z) {
      g_blocks.splice(i, 1);
      return;
    }
  }
}

let g_tailTime = 0;

function updateAnimationAngles(deltaTime) {
  const seconds = deltaTime / 1000;

  if (g_isTailAnimating) {
    g_tailTime += seconds;
    g_tailAngle1 = Math.sin(g_tailTime * 2) * 20;
    g_tailAngle2 = Math.sin(g_tailTime * 2 + 0.5) * 15;
    g_tailAngle3 = Math.sin(g_tailTime * 2 + 1.0) * 10;
  }

  if (g_isWalking) {
    g_legWalkTime += seconds;
    g_legLiftAngle = -Math.sin(g_legWalkTime * 4) * 20;
  }

  if (g_isTentacleAnimating) {
    g_tentacleTime += seconds;
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

  // Limit FPS samples
  if (g_fpsSamples.length > 30) g_fpsSamples.shift();

  if (now - g_lastFpsUpdateTime >= 500) {
    const avgFPS = g_fpsSamples.reduce((sum, fps) => sum + fps, 0) / g_fpsSamples.length;
    document.getElementById('fpsCounter').innerText = `FPS: ${avgFPS.toFixed(1)}`;
    g_lastFpsUpdateTime = now;
  }

  // 👇 pass delta to animation
  updateAnimationAngles(delta);
  renderAllShapes();
  requestAnimationFrame(tick);
}