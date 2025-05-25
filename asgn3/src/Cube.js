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

    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniform1f(u_texColorWeight, 1.0); // fully use texture

    // Bind correct texture unit
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
    if (Cube.texturedBuffer) return;
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
    Cube.texturedBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.texturedBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
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