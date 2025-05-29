class Cylinder {
    constructor(segments = 20) {
      this.type = "cylinder";
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.segments = segments;
    }
  
    render() {
      const angleStep = (2 * Math.PI) / this.segments;
      let verts = [];
  
      for (let i = 0; i < this.segments; i++) {
        const angle1 = i * angleStep;
        const angle2 = (i + 1) * angleStep;
  
        const x1 = Math.cos(angle1) * 0.5;
        const z1 = Math.sin(angle1) * 0.5;
        const x2 = Math.cos(angle2) * 0.5;
        const z2 = Math.sin(angle2) * 0.5;
  
        // === Bottom cap
        verts.push(
          0, 0, 0,
          x1, 0, z1,
          x2, 0, z2
        );
  
        // === Top cap
        verts.push(
          0, 1, 0,
          x2, 1, z2,
          x1, 1, z1
        );
  
        // === Side wall (2 triangles per quad)
        verts.push(
          x1, 0, z1,
          x2, 0, z2,
          x1, 1, z1,
  
          x2, 0, z2,
          x2, 1, z2,
          x1, 1, z1
        );
      }
  
      gl.uniform4f(u_FragColor, ...this.color);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      drawTriangle3D(verts.flat());
    }
  }