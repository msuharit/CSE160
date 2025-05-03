function drawMaze() {
    const wallColor = [0.2, 0.2, 0.2, 1.0]; // dark gray
  
    function wall(x1, y1, x2, y2) {
      const r1 = new TriangleCustom([x1, y1], [x2, y1], [x1, y2]);
      const r2 = new TriangleCustom([x2, y1], [x2, y2], [x1, y2]);
      r1.color = wallColor;
      r2.color = wallColor;
      g_shapesList.push(r1, r2);
    }
  
    // Draw top wall (above path)
    wall(-1, 1, 1, 0.3);
  
    // Draw bottom wall (below path)
    wall(-1, -0.3, 1, -1);
  
    renderAllShapes();
}