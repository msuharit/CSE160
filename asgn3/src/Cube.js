class Cube {
  constructor() {
    this.type = "cube";
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureEnabled = false;
  }

render() {
  // console.log("Cube render called. textureEnabled:", this.textureEnabled);

  gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

  if (this.textureEnabled) {
    //console.log("renderTextured path triggered");
    this.renderTextured();
  } else {
    //console.log("renderColored path triggered");
    this.renderColored();
  }
}

renderTextured() {
  if (!g_texture) {
    console.warn("Texture not ready yet");
    return;
  }

  // Initialize shared static buffer once
  if (!Cube.vertexBuffer) {
    //console.log("Creating and caching textured cube buffer");

    Cube.vertexBuffer = gl.createBuffer();
    Cube.vertexBufferData = new Float32Array([
      // Format: x, y, z, u, v
      // Front face
      0, 0, 0,   0, 0,
      1, 1, 0,   1, 1,
      1, 0, 0,   1, 0,

      0, 0, 0,   0, 0,
      0, 1, 0,   0, 1,
      1, 1, 0,   1, 1,

      // Back face
      0, 0, 1,   0, 0,
      1, 0, 1,   1, 0,
      1, 1, 1,   1, 1,

      0, 0, 1,   0, 0,
      1, 1, 1,   1, 1,
      0, 1, 1,   0, 1,

      // Top face
      0, 1, 0,   0, 0,
      0, 1, 1,   0, 1,
      1, 1, 1,   1, 1,

      0, 1, 0,   0, 0,
      1, 1, 1,   1, 1,
      1, 1, 0,   1, 0,

      // Bottom face
      0, 0, 0,   0, 0,
      1, 0, 0,   1, 0,
      1, 0, 1,   1, 1,

      0, 0, 0,   0, 0,
      1, 0, 1,   1, 1,
      0, 0, 1,   0, 1,

      // Left face
      0, 0, 0,   0, 0,
      0, 0, 1,   1, 0,
      0, 1, 1,   1, 1,

      0, 0, 0,   0, 0,
      0, 1, 1,   1, 1,
      0, 1, 0,   0, 1,

      // Right face
      1, 0, 0,   0, 0,
      1, 1, 0,   0, 1,
      1, 1, 1,   1, 1,

      1, 0, 0,   0, 0,
      1, 1, 1,   1, 1,
      1, 0, 1,   1, 0,
    ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Cube.vertexBufferData, gl.STATIC_DRAW);
  } else {
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);
  }

  const FSIZE = Float32Array.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
  gl.enableVertexAttribArray(a_UV);

  gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  gl.uniform4f(u_FragColor, ...this.color);
  gl.uniform1f(u_texColorWeight, 1.0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, g_texture);
  gl.uniform1i(u_Sampler, 0);

  gl.drawArrays(gl.TRIANGLES, 0, Cube.vertexBufferData.length / 5);
}

  renderColored() {
    const baseColor = this.color;
    for (const face of Cube.faces) {
      const c = face.colorMult;
      gl.uniform4f(u_FragColor, baseColor[0] * c, baseColor[1] * c, baseColor[2] * c, baseColor[3]);
      gl.uniform1f(u_texColorWeight, 0.0); // No texture

      for (let i = 0; i < face.triangles.length; i += 3) {
        drawTriangle3D([
          ...face.triangles[i],
          ...face.triangles[i + 1],
          ...face.triangles[i + 2],
        ]);
      }
    }
  }
}

Cube.faces = [
  {
    colorMult: 1.0,
    triangles: [
      [0, 0, 0], [1, 1, 0], [1, 0, 0],
      [0, 0, 0], [0, 1, 0], [1, 1, 0],
    ],
  },
  {
    colorMult: 0.8,
    triangles: [
      [0, 0, 1], [1, 0, 1], [1, 1, 1],
      [0, 0, 1], [1, 1, 1], [0, 1, 1],
    ],
  },
  {
    colorMult: 0.9,
    triangles: [
      [0, 1, 0], [0, 1, 1], [1, 1, 1],
      [0, 1, 0], [1, 1, 1], [1, 1, 0],
    ],
  },
  {
    colorMult: 0.6,
    triangles: [
      [0, 0, 0], [1, 0, 0], [1, 0, 1],
      [0, 0, 0], [1, 0, 1], [0, 0, 1],
    ],
  },
  {
    colorMult: 0.7,
    triangles: [
      [0, 0, 0], [0, 0, 1], [0, 1, 1],
      [0, 0, 0], [0, 1, 1], [0, 1, 0],
    ],
  },
  {
    colorMult: 0.95,
    triangles: [
      [1, 0, 0], [1, 1, 0], [1, 1, 1],
      [1, 0, 0], [1, 1, 1], [1, 0, 1],
    ],
  },
];