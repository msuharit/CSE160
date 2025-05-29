class Cube {
  constructor() {
    this.type = "cube";
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
    this.textureNum = null; // use TEXTURE_METAL or TEXTURE_SKY
  }

  render() {
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    if (this.textureNum !== null) {
      this.renderTextured();
    } else {
      this.renderColored();
    }
  }

  renderColored() {
    Cube.initColoredBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.coloredBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniform1f(u_texColorWeight, 0.0);
    gl.drawArrays(gl.TRIANGLES, 0, Cube.coloredVertexCount);
  }

  renderTextured() {
    Cube.initTexturedBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.texturedBuffer);
    const FSIZE = Float32Array.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(a_UV);

    // Normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniform1f(u_texColorWeight, 1.0);

    gl.activeTexture(gl.TEXTURE0);
    const selectedTexture = this.textureNum === TEXTURE_METAL ? g_metalTexture : g_skyTexture;
    gl.bindTexture(gl.TEXTURE_2D, selectedTexture);
    gl.uniform1i(u_Sampler, 0);

    gl.drawArrays(gl.TRIANGLES, 0, Cube.texturedVertexCount);
  }

  static initColoredBuffer() {
    if (Cube.coloredBuffer) return;
    const faces = Cube.faces;
    const vertices = [];
    for (const face of faces) {
      for (let tri of face.triangles) {
        vertices.push(...tri);
      }
    }
    Cube.coloredVertexCount = vertices.length / 3;
    Cube.coloredBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.coloredBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  }

  static initTexturedBuffer() {
    if (Cube.texturedBuffer && Cube.normalBuffer) return;

    const vertices = [
      // x, y, z, u, v
      0, 0, 0, 0, 0,  1, 1, 0, 1, 1,  1, 0, 0, 1, 0,
      0, 0, 0, 0, 0,  0, 1, 0, 0, 1,  1, 1, 0, 1, 1,

      0, 0, 1, 0, 0,  1, 0, 1, 1, 0,  1, 1, 1, 1, 1,
      0, 0, 1, 0, 0,  1, 1, 1, 1, 1,  0, 1, 1, 0, 1,

      0, 1, 0, 0, 0,  0, 1, 1, 0, 1,  1, 1, 1, 1, 1,
      0, 1, 0, 0, 0,  1, 1, 1, 1, 1,  1, 1, 0, 1, 0,

      0, 0, 0, 0, 0,  1, 0, 0, 1, 0,  1, 0, 1, 1, 1,
      0, 0, 0, 0, 0,  1, 0, 1, 1, 1,  0, 0, 1, 0, 1,

      0, 0, 0, 0, 0,  0, 0, 1, 1, 0,  0, 1, 1, 1, 1,
      0, 0, 0, 0, 0,  0, 1, 1, 1, 1,  0, 1, 0, 0, 1,

      1, 0, 0, 0, 0,  1, 1, 0, 0, 1,  1, 1, 1, 1, 1,
      1, 0, 0, 0, 0,  1, 1, 1, 1, 1,  1, 0, 1, 1, 0,
    ];

    Cube.texturedVertexCount = vertices.length / 5;

    const positions = [];
    const normals = [];

    for (let i = 0; i < vertices.length; i += 15) {
      const p1 = [vertices[i],     vertices[i+1],  vertices[i+2]];
      const p2 = [vertices[i+5],   vertices[i+6],  vertices[i+7]];
      const p3 = [vertices[i+10],  vertices[i+11], vertices[i+12]];

      const u = [
        p2[0] - p1[0],
        p2[1] - p1[1],
        p2[2] - p1[2]
      ];
      const v = [
        p3[0] - p1[0],
        p3[1] - p1[1],
        p3[2] - p1[2]
      ];

      const normal = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
      ];

      // Normalize
      const len = Math.sqrt(normal[0]**2 + normal[1]**2 + normal[2]**2);
      normal[0] /= len;
      normal[1] /= len;
      normal[2] /= len;

      // Push 3 times for 3 vertices of the triangle
      for (let j = 0; j < 3; j++) {
        positions.push(
          vertices[i + j*5],
          vertices[i + j*5 + 1],
          vertices[i + j*5 + 2],
          vertices[i + j*5 + 3],
          vertices[i + j*5 + 4]
        );
        normals.push(...normal);
      }
    }

    // Final buffers
    Cube.texturedBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.texturedBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    Cube.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  }
}

Cube.faces = [
  { triangles: [[0, 0, 0], [1, 1, 0], [1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
  { triangles: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { triangles: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [0, 1, 0], [1, 1, 1], [1, 1, 0]] },
  { triangles: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { triangles: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 0, 0], [0, 1, 1], [0, 1, 0]] },
  { triangles: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 0], [1, 1, 1], [1, 0, 1]] },
];