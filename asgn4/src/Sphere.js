class Sphere {
  constructor(latBands = 20, lonBands = 20) {
    this.type = "sphere";
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
    this.latBands = latBands;
    this.lonBands = lonBands;

    this.initBuffers();
  }

  initBuffers() {
    const positions = [];
    const normals = [];
    const indices = [];

    for (let lat = 0; lat <= this.latBands; ++lat) {
      const theta = lat * Math.PI / this.latBands - Math.PI / 2;
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      for (let lon = 0; lon <= this.lonBands; ++lon) {
        const phi = lon * 2 * Math.PI / this.lonBands;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        const x = cosTheta * cosPhi;
        const y = sinTheta;
        const z = cosTheta * sinPhi;

        positions.push(x, y, z);
        normals.push(x, y, z); // normal == position for spheres centered at origin
      }
    }

    for (let lat = 0; lat < this.latBands; ++lat) {
      for (let lon = 0; lon < this.lonBands; ++lon) {
        const first = (lat * (this.lonBands + 1)) + lon;
        const second = first + this.lonBands + 1;

        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    this.vertexCount = indices.length;

    // Create and bind position buffer
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Normal buffer
    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    // Index buffer
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  }

  render() {
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniform1f(u_texColorWeight, 0.0); // Not textured

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
  }
}