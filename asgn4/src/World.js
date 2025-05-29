let canvas;
let gl;

let a_Position, a_UV, a_Normal;
let u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix, u_ViewMatrix, u_ProjectionMatrix, u_Sampler, u_texColorWeight, u_UseNormal;

let camera;
let g_yaw = 0;
let g_pitch = 0;
let g_cameraAngleX = 0;
let g_globalAngle = 0;
let g_mouseDown = false;
let g_lastMouseX = null;
let g_lastMouseY = null;
let g_showNormals = false;
let g_lightPos = [2.0, 2.0, 2.0];
let g_lightAngle = 0; // for animation
let g_lightRadius = 5; // distance from center
let u_LightColor, u_CameraPos;
let g_lightColor = [1.0, 1.0, 1.0]; //  white
let g_lightAnimating = true; // toggle light animation
let g_useLighting = true; // default lighting ON
let u_UseLighting; 
let u_LightDirection, u_SpotlightAngle;
let g_spotlightPos = [0.0, 5.0, 0.0];
let g_spotlightAngle = 0;
let g_spotlightRadius = 5;
let g_useSpotlight = false;



let g_sphere, g_testCube, g_skyCube;

const TEXTURE_METAL = 0;
const TEXTURE_SKY = 1;
let g_metalTexture = null;
let g_skyTexture = null;


// VERTEX SHADER
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;

  varying vec2 v_UV;
  varying vec3 v_NormalDir;
  varying vec3 v_LightDir;
  varying vec3 v_ViewDir;
  varying vec3 v_SpotDir;


  uniform mat4 u_ModelMatrix; 
  uniform mat4 u_GlobalRotateMatrix; 
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform vec3 u_LightPos;
  uniform vec3 u_CameraPos;
  uniform bool u_UseNormal;
  uniform vec3 u_LightDirection;



  void main() {
    mat4 modelView = u_ViewMatrix * u_ModelMatrix;
    vec4 worldPos = u_ModelMatrix * a_Position;
    
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * worldPos;

    v_UV = a_UV;

    vec3 worldNormal = normalize(mat3(u_ModelMatrix) * a_Normal);
    v_NormalDir = worldNormal;

    v_LightDir = normalize(u_LightPos - vec3(worldPos));
    v_ViewDir = normalize(u_CameraPos - vec3(worldPos));
    v_SpotDir = normalize(-u_LightDirection);  // Spotlight direction (inverse because light "shines" in this dir)

  }
`;

// FRAGMENT SHADER
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_NormalDir;
  varying vec3 v_LightDir;
  varying vec3 v_ViewDir;
  varying vec3 v_SpotDir;


  uniform sampler2D u_Sampler;
  uniform float u_texColorWeight;
  uniform vec4 u_FragColor;
  uniform vec3 u_LightColor;
  uniform bool u_UseNormal;
  uniform bool u_UseLighting;
  uniform float u_SpotlightAngle;   // in radians

  void main() {
  if (u_UseNormal) {
    gl_FragColor = vec4(normalize(v_NormalDir) * 0.5 + 0.5, 1.0);
    return;
  }

  vec4 texColor = texture2D(u_Sampler, v_UV);
  vec4 baseColor = mix(u_FragColor, texColor, u_texColorWeight);

  if (!u_UseLighting) {
    gl_FragColor = baseColor;
    return;
  }

  vec3 N = normalize(v_NormalDir);
  vec3 L = normalize(v_LightDir);
  vec3 V = normalize(v_ViewDir);
  vec3 R = reflect(-L, N);

  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(R, V), 0.0), 32.0);
  float ambient = 0.2;

  // Spotlight intensity
  float theta = dot(normalize(v_LightDir), v_SpotDir);
  float epsilon = 0.1;
  float spotFactor = smoothstep(cos(u_SpotlightAngle), cos(u_SpotlightAngle) + epsilon, theta);

  // Final lighting with spotlight factor
  vec3 finalColor = baseColor.rgb * ambient;
  if (theta > cos(u_SpotlightAngle)) {
    finalColor += baseColor.rgb * diff * spotFactor + u_LightColor * spec * spotFactor;
  }
  gl_FragColor = vec4(finalColor, baseColor.a);
}
`;


// INITIALIZATION
function setUpWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
}

function connectVarToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  u_UseNormal = gl.getUniformLocation(gl.program, 'u_UseNormal');
  u_LightPos = gl.getUniformLocation(gl.program, 'u_LightPos');
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_CameraPos = gl.getUniformLocation(gl.program, 'u_CameraPos');
  u_UseLighting = gl.getUniformLocation(gl.program, 'u_UseLighting');
  u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  u_SpotlightAngle = gl.getUniformLocation(gl.program, 'u_SpotlightAngle');
}

function initTextures(callback) {
  let loaded = 0;
  const tryFinish = () => { if (++loaded === 2) callback(); };

  const metalImage = new Image();
  metalImage.onload = function () {
    g_metalTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, g_metalTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, metalImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    tryFinish();
  };
  metalImage.src = 'metal.png';

  const skyImage = new Image();
  skyImage.onload = function () {
    g_skyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, g_skyTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, skyImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    tryFinish();
  };
  skyImage.src = 'sky.jpg';
}

let g_swordMesh = null;
let g_swordBuffers = null;

function main() {
  setUpWebGL();
  fetch('Sword.obj')
  .then(response => response.text())
  .then(objText => {
    g_swordMesh = new OBJ.Mesh(objText);
    OBJ.initMeshBuffers(gl, g_swordMesh);
    g_swordBuffers = g_swordMesh;
    renderAllShapes();
  });
  connectVarToGLSL();

  camera = new Camera();
  const forward = new Vector3(camera.at.elements).sub(camera.eye);
  g_yaw = Math.atan2(forward.elements[0], forward.elements[2]) * 180 / Math.PI;
  g_pitch = Math.asin(forward.elements[1]) * 180 / Math.PI;

  // Initialize reusable objects
  g_testCube = new Cube();
  g_testCube.color = [1.0, 0.5, 0.2, 1.0];
  g_testCube.matrix.translate(0, 0, -2);

  g_sphere = new Sphere(30, 30);
  g_sphere.color = [0.2, 1.0, 0.2, 1.0];
  g_sphere.matrix.translate(2, 0, 0);

  g_skyCube = new Cube();
  g_skyCube.textureNum = TEXTURE_SKY;
  g_skyCube.matrix.setTranslate(-50, -50, -50);
  g_skyCube.matrix.scale(100, 100, 100);
  g_skyCube.color = [1.0, 1.0, 1.0, 1.0];

  const spotlightSlider = document.getElementById('spotlightX');
  const spotlightLabel = document.getElementById('spotlightXVal');

  spotlightSlider.oninput = function (e) {
    const val = parseFloat(e.target.value);

    // Clamp to safe domain [-1, 1]
    const clamped = Math.max(-1, Math.min(1, val / g_spotlightRadius));
    g_spotlightAngle = Math.asin(clamped) * 180 / Math.PI;

    g_spotlightPos[0] = val;
    spotlightLabel.innerText = val.toFixed(1);
    renderAllShapes();
  };

  document.getElementById('toggleNormals').onclick = () => {
    g_showNormals = !g_showNormals;
    renderAllShapes();
  };

  document.getElementById('toggleLightAnim').onclick = () => {
    g_lightAnimating = !g_lightAnimating;
  };

  const radiusSlider = document.getElementById('lightRadius');
  const radiusLabel = document.getElementById('lightRadiusVal');

  radiusSlider.oninput = function (e) {
    if (!g_lightAnimating) {
      g_lightAngle = parseFloat(e.target.value);
      renderAllShapes();
    }
    radiusLabel.innerText = e.target.value;
  };

  document.getElementById('lightColorPicker').oninput = (e) => {
    const hex = e.target.value;
    const bigint = parseInt(hex.slice(1), 16);
    g_lightColor = [
      ((bigint >> 16) & 255) / 255,
      ((bigint >> 8) & 255) / 255,
      (bigint & 255) / 255
    ];
  };

  document.getElementById('toggleLighting').onclick = () => {
    g_useLighting = !g_useLighting;
    renderAllShapes();
  };

  document.getElementById('toggleLightMode').onclick = () => {
    g_useSpotlight = !g_useSpotlight;
    renderAllShapes();
  };

  initTextures(() => {
    renderAllShapes();
    tick();
  });

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  document.getElementById('togglePointerLock').onclick = () => {
    canvas.requestPointerLock();
  };

  document.addEventListener('pointerlockchange', () => {
    const isLocked = document.pointerLockElement === canvas;
    if (isLocked) document.addEventListener('mousemove', onMouseMoveWhileLocked);
    else document.removeEventListener('mousemove', onMouseMoveWhileLocked);
  });

  canvas.onmousedown = ev => {
    g_mouseDown = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };
  canvas.onmouseup = () => g_mouseDown = false;

  canvas.onmousemove = ev => {
    if (g_mouseDown) {
      const deltaX = ev.clientX - g_lastMouseX;
      const deltaY = ev.clientY - g_lastMouseY;

      g_globalAngle += deltaX * 0.5;
      g_cameraAngleX += deltaY * 0.5;
      g_cameraAngleX = Math.max(-90, Math.min(90, g_cameraAngleX));

      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;

      renderAllShapes();
    }
  };

  document.onkeydown = ev => {
    switch (ev.key) {
      case 'w': case 'W': camera.moveForward(); break;
      case 's': case 'S': camera.moveBackward(); break;
      case 'a': case 'A': camera.moveLeft(); break;
      case 'd': case 'D': camera.moveRight(); break;
      case 'q': case 'Q': camera.panLeft(); break;
      case 'e': case 'E': camera.panRight(); break;
    }
    renderAllShapes();
  };
}

function onMouseMoveWhileLocked(event) {
  const sensitivity = 0.1;
  g_yaw += event.movementX * sensitivity;
  g_pitch -= event.movementY * sensitivity;
  g_pitch = Math.max(-89, Math.min(89, g_pitch));
  camera.updateLookDirection(g_yaw, g_pitch);
  renderAllShapes();
}

function drawCrab() {
  const tan = [0.82, 0.71, 0.55, 1.0];
  const tanDarker = [0.65, 0.56, 0.43, 1.0];

  const body = new Cube();
  body.color = tan;
  body.matrix.setTranslate(-0.3, -0.5, 0.0);
  body.matrix.scale(0.6, 0.15, 0.4);
  body.render();

  const renderLeg = (baseMatrix, upperAngle, midAngle, footAngle) => {
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
    mid.matrix.rotate(midAngle, 0, 0, 1);
    mid.matrix.scale(1, 0.8, 1);
    mid.render();

    const foot = new Cube();
    foot.color = tanDarker;
    foot.matrix = new Matrix4(mid.matrix);
    foot.matrix.translate(0, 1.0, 0);
    foot.matrix.rotate(footAngle, 0, 0, 1);
    foot.matrix.scale(1, 0.7, 1);
    foot.render();
  };

  const zOffsets = [0.75, 0.0, 0.25];
  zOffsets.forEach((zOffset, i) => {
    const upper = 85;
    const mid = 45;
    const foot = 15;

    const left = new Matrix4(body.matrix);
    left.translate(.25, 0, zOffset);
    renderLeg(left, upper, mid, foot);

    const right = new Matrix4(body.matrix);
    right.translate(0.75, 0, zOffset);
    right.scale(-1, 1, 1);
    renderLeg(right, upper, mid, foot);
  });

  const tailBase = new Cube();
  tailBase.color = tanDarker;
  tailBase.matrix = new Matrix4(body.matrix);
  tailBase.matrix.translate(0.4, 0.75, 0.25);
  tailBase.matrix.scale(0.2, 0.5, 0.5);
  tailBase.render();

  const tail1 = new Cube();
  tail1.color = tan;
  tail1.matrix = new Matrix4(body.matrix);
  tail1.matrix.translate(0.4, 0.75, 0.25);
  tail1.matrix.translate(0, 0, 0.5);
  tail1.matrix.scale(0.2, 0.3, 0.6);
  tail1.render();

  const tail2 = new Cube();
  tail2.color = tanDarker;
  tail2.matrix = new Matrix4(tail1.matrix);
  tail2.matrix.translate(0, 0, 0.5);
  tail2.render();

  const tail3 = new Cube();
  tail3.color = tan;
  tail3.matrix = new Matrix4(tail2.matrix);
  tail3.matrix.translate(0, 0, 0.5);
  tail3.render();

  
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  
  gl.uniform3f(u_CameraPos, ...camera.eye.elements);
  gl.uniform3f(u_LightColor, ...g_lightColor);
  gl.uniform1i(u_UseLighting, g_useLighting ? 1 : 0);
  if (g_useSpotlight) {
    gl.uniform3f(u_LightPos, ...g_spotlightPos);
    gl.uniform3f(u_LightDirection, 0.0, -1.0, 0.0); // Fixed downward
  } else {
    gl.uniform3f(u_LightPos, ...g_lightPos);
    const lightDir = [
      -g_lightPos[0],
      -g_lightPos[1],
      -g_lightPos[2]
    ];
    const len = Math.sqrt(lightDir[0] ** 2 + lightDir[1] ** 2 + lightDir[2] ** 2);
    const normLightDir = lightDir.map(c => c / len);
    gl.uniform3f(u_LightDirection, ...normLightDir);
  }
  gl.uniform1f(u_SpotlightAngle, Math.PI / 8);    // ~22.5 degree cone

  const globalRotMat = new Matrix4()
    .rotate(g_cameraAngleX, 1, 0, 0)
    .rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  const lightCube = new Cube();
  lightCube.color = [1.0, 1.0, 0.0, 1.0]; // Yellow light
  lightCube.matrix.setTranslate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  lightCube.matrix.scale(.5, .5, .5);
  lightCube.render();

  const spotlightCube = new Cube();
  spotlightCube.color = [1.0, 0.0, 1.0, 1.0]; // Magenta for spotlight
  spotlightCube.matrix.setTranslate(g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]);
  spotlightCube.matrix.scale(0.3, 0.3, 0.3);
  spotlightCube.render();
  
  // Sky
  gl.uniform1i(u_UseNormal, 0);
  g_skyCube.render();

  // Rest
  gl.uniform1i(u_UseNormal, g_showNormals ? 1 : 0);
  g_testCube.render();
  g_sphere.render();

  //crab
  drawCrab();

  //draw sword obj
  if (g_swordBuffers) {
    gl.bindBuffer(gl.ARRAY_BUFFER, g_swordBuffers.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, g_swordBuffers.normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.bindBuffer(gl.ARRAY_BUFFER, g_swordBuffers.textureBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_swordBuffers.indexBuffer); // ✅ Fix

    const modelMatrix = new Matrix4();
    modelMatrix.translate(0, 0, 0);
    modelMatrix.scale(0.1, 0.1, 0.1);
    modelMatrix.rotate(90, 1, 0, 0); // Rotate 90° around X axis (like tipping forward)

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    gl.uniform4f(u_FragColor, 0.8, 0.8, 0.8, 1.0);       // default color
    gl.uniform1f(u_texColorWeight, 0.0);                 // no texture

    gl.drawElements(gl.TRIANGLES, g_swordBuffers.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }

}

let g_lastFrameTime = performance.now();
let g_lastFpsUpdateTime = performance.now();
let g_fpsSamples = [];

// UPDATE LIGHT POSITION BASED ON ANIMATION TOGGLE
function tick() {
  const now = performance.now();
  const delta = now - g_lastFrameTime;
  g_lastFrameTime = now;

  const currentFPS = 1000 / delta;
  g_fpsSamples.push(currentFPS);
  if (g_fpsSamples.length > 30) g_fpsSamples.shift();

  if (now - g_lastFpsUpdateTime >= 500) {
    const avgFPS = g_fpsSamples.reduce((sum, fps) => sum + fps, 0) / g_fpsSamples.length;
    document.getElementById('fpsCounter').innerText = `FPS: ${avgFPS.toFixed(1)}`;
    g_lastFpsUpdateTime = now;
  }

  if (g_lightAnimating) g_lightAngle += 1;
  const rad = g_lightAngle * Math.PI / 180;
  g_lightPos[0] = g_lightRadius * Math.cos(rad);
  g_lightPos[1] = 2.0;
  g_lightPos[2] = g_lightRadius * Math.sin(rad);

  g_spotlightPos[0] = g_spotlightRadius * Math.sin(g_spotlightAngle * Math.PI / 180);
  g_spotlightPos[1] = 5.0;
  g_spotlightPos[2] = 0.0;

  renderAllShapes();
  requestAnimationFrame(tick);
}