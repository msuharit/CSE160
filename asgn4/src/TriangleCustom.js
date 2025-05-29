class TriangleCustom {
  constructor(p1, p2, p3) {
    this.type = "triangleCustom";
    this.vertices = [...p1, ...p2, ...p3]; // [x1, y1, x2, y2, x3, y3]
    this.color = [1.0, 1.0, 1.0, 1.0]; // Default white
  }

  render() {
    // Set the color
    gl.uniform4f(u_FragColor, ...this.color);

    // Draw the triangle using the provided vertices
    drawTriangle(this.vertices);
  }
}