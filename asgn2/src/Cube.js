class Cube{
  constructor(){
    this.type ="cube";
    //this.position = [0.0,0.0,0.0];
    this.color = [1.0,1.0,1.0,1.0];
    //this.size = 5.0;
    //this.segments = 10;
    this.matrix = new Matrix4();
  }

  render() {
    const baseColor = this.color;
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
    const faces = [
      {
        // Front face (fully lit)
        colorMult: 1.0,
        triangles: [
          [0, 0, 0], [1, 1, 0], [1, 0, 0],
          [0, 0, 0], [0, 1, 0], [1, 1, 0],
        ],
      },
      {
        // Back face (dimmed)
        colorMult: 0.8,
        triangles: [
          [0, 0, 1], [1, 0, 1], [1, 1, 1],
          [0, 0, 1], [1, 1, 1], [0, 1, 1],
        ],
      },
      {
        // Top face
        colorMult: 0.9,
        triangles: [
          [0, 1, 0], [0, 1, 1], [1, 1, 1],
          [0, 1, 0], [1, 1, 1], [1, 1, 0],
        ],
      },
      {
        // Bottom face (darker)
        colorMult: 0.6,
        triangles: [
          [0, 0, 0], [1, 0, 0], [1, 0, 1],
          [0, 0, 0], [1, 0, 1], [0, 0, 1],
        ],
      },
      {
        // Left face
        colorMult: 0.7,
        triangles: [
          [0, 0, 0], [0, 0, 1], [0, 1, 1],
          [0, 0, 0], [0, 1, 1], [0, 1, 0],
        ],
      },
      {
        // Right face (slightly brighter)
        colorMult: 0.95,
        triangles: [
          [1, 0, 0], [1, 1, 0], [1, 1, 1],
          [1, 0, 0], [1, 1, 1], [1, 0, 1],
        ],
      },
    ];
  
    for (const face of faces) {
      const c = face.colorMult;
      gl.uniform4f(u_FragColor, baseColor[0] * c, baseColor[1] * c, baseColor[2] * c, baseColor[3]);
  
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
