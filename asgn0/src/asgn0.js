let ctx;
let canvas;
function main() {  
  // Retrieve <canvas> element
  canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  ctx = canvas.getContext('2d');

  // make black background
  clearCanvas();
    //ctx.fillStyle = 'black'
    //ctx.fillRect(0,0,canvas.width,canvas.height)

  // instantiate vector v1
    //var x = 2.25;
    //var y = 2.25;
    //var origin = 0;

    //var v1 = new Vector3( [x,y, origin]);

    //drawVector(v1,'red')

  

  // Draw a blue rectangle
    //ctx.fillStyle = 'rgba(0, 0, 255, 1.0)'; // Set color to blue
    //ctx.fillRect(120, 10, 150, 150);        // Fill a rectangle with the color
}

function clearCanvas(){
  ctx.fillStyle = 'black'
  ctx.fillRect(0,0,canvas.width,canvas.height)
}

// draw vector of 400x400  canvas in center ie 200x200
function drawVector(v,color) {
  ctx.strokeStyle = color;

  // scale v1 coordinates by 20
  var xScaled = v.elements[0] * 20;
  var yScaled = v.elements[1] * 20;
  
  const xCenter = 200;
  const yCenter = 200;
  ctx.beginPath();
  ctx.moveTo(xCenter,yCenter);
  ctx.lineTo(xCenter + xScaled,yCenter - yScaled)
  ctx.stroke();
}

// whenever you click the draw button
function handleDrawEvent(){
  //clear the canvas
   // cover everything back to black
  clearCanvas()
  
  // read values from text boxes for v1 and v2
  var x1 = parseFloat(document.getElementById('xCord').value);
  var y1 = parseFloat(document.getElementById('yCord').value);

  var x2 = parseFloat(document.getElementById('xCord2').value);
  var y2 = parseFloat(document.getElementById('yCord2').value);


  var v1 = new Vector3([x1,y1, 0]);
  var v2 = new Vector3([x2,y2, 0]);

  // call drawVector(v1,'red')
  drawVector(v1,'red');
  drawVector(v2,'blue');
}

function handleDrawOperationEvent(){
  //clear the canvas
  clearCanvas()

  // read values from v1 and draw v1 red
  var x1 = parseFloat(document.getElementById('xCord').value);
  var y1 = parseFloat(document.getElementById('yCord').value);
  var v1 = new Vector3([x1,y1, 0]);
  drawVector(v1,'red');

  // read values from v2 and draw v2 blue
  var x2 = parseFloat(document.getElementById('xCord2').value);
  var y2 = parseFloat(document.getElementById('yCord2').value);
  var v2 = new Vector3([x2,y2, 0]);
  drawVector(v2,'blue');

  // read value of selector calling respective functions
  var scalar = parseFloat(document.getElementById('scalar').value);
  var operation = document.getElementById('operation').value;
  var v3, v4;


  if (operation == 'add'){
    v3 = new Vector3(v1.elements);
    v3.add(v2);
    drawVector(v3,'green')

  } else if (operation == 'sub'){
    v3 = new Vector3(v1.elements);
    v3.sub(v2);
    drawVector(v3,'green')
    
  } else if (operation == 'mul'){
    v3 = new Vector3(v1.elements);
    v4 = new Vector3(v2.elements);
    v3.mul(scalar);
    v4.mul(scalar)
    drawVector(v3,'green')
    drawVector(v4,'green')

  } else if (operation == 'div'){
    v3 = new Vector3(v1.elements);
    v4 = new Vector3(v2.elements);
    v3.div(scalar);
    v4.div(scalar)
    drawVector(v3,'green')
    drawVector(v4,'green')

  } else if (operation == 'mag'){
    console.log("Magnitude v1: " + v1.magnitude())
    console.log("Magnitude v1: " + v2.magnitude())
  } else if (operation == 'norm'){
    v3 = new Vector3(v1.elements);
    v4 = new Vector3(v2.elements);
    v3.normalize();
    v4.normalize();
    drawVector(v3,'green')
    drawVector(v4,'green')
  } else if (operation == 'angle'){
    angleBetween(v1,v2)
  } else if (operation == 'area'){
    areaTriangle(v1,v2);
  }
}

function angleBetween(v1,v2){
  // dot(v1,v2) == ||v1|| * ||v2|| * cos(angle)
  // === 
  // cos^-1[ dot(v1,v2) / (||v1|| * ||v2||) ] = angle
  // therefore angle = cos&-1[ dot(v1,v2) / (||v1|| * ||v2||) ]
  var dot = Vector3.dot(v1,v2)
  var mag1 = v1.magnitude();
  var mag2 = v2.magnitude();
  if (mag1 == 0 || mag2 == 0) {
    console.log("no angle possible")
    return;
  }

  var angle = Math.acos( dot / (mag1 * mag2))
  var degAngle = angle * (180 / Math.PI)

  console.log("Angle: " + degAngle)
}

function areaTriangle(v1,v2){
  // ||v1 * v2|| == area of parallelogram the vectors span
  // therefore if we halve the parallelogram we get 2 triangles

  // get v1 * v2
  var cross = Vector3.cross(v1,v2);
  // get ||v1 * v2|| == parallogram 
  var parallelogramArea = cross.magnitude();
  // halve it to get the triangleArea
  var triangleArea = 0.5 * parallelogramArea;

  console.log("Area of the triangle: " + triangleArea);
}