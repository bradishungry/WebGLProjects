//
// Lighting, continued. Same as Lighting2.js except we define
// a 3x3 matrix for material properties and a 3x3 matrix for light
// properties that are passed to the fragment shader as uniforms.
//
// Edit the light/material matrices in the global variables to experiment.
// Edit main to choose a model and select face normals or vertex normals.
//


// given an instance of THREE.Geometry, returns an object
// containing raw data for vertices and normal vectors.
function getModelData(geom)
{
   var verticesArray = [];
   var normalsArray = [];
   var vertexNormalsArray = [];
   var reflectedNormalsArray = [];
   var count = 0;
   for (var f = 0; f < geom.faces.length; ++f)
   {
      var face = geom.faces[f];
      var v = geom.vertices[face.a];
      verticesArray.push(v.x);
      verticesArray.push(v.y);
      verticesArray.push(v.z);

      v = geom.vertices[face.b];
      verticesArray.push(v.x);
      verticesArray.push(v.y);
      verticesArray.push(v.z);

      v = geom.vertices[face.c];
      verticesArray.push(v.x);
      verticesArray.push(v.y);
      verticesArray.push(v.z);
      count += 3;

      var fn = face.normal;
      for (var i = 0; i < 3; ++i)
      {
         normalsArray.push(fn.x);
         normalsArray.push(fn.y);
         normalsArray.push(fn.z);
      }

      for (var i = 0; i < 3; ++i)
      {
         var vn = face.vertexNormals[i];
         vertexNormalsArray.push(vn.x);
         vertexNormalsArray.push(vn.y);
         vertexNormalsArray.push(vn.z);
      }

      for (var i = 0; i < 3; ++i)
      {
         var index = (count * 3 - 9) + 3 * i;
         vx = vertexNormalsArray[index];
         vy = vertexNormalsArray[index + 1];
         vz = vertexNormalsArray[index + 2];
         nx = normalsArray[index];
         ny = normalsArray[index + 1];
         nz = normalsArray[index + 2];
         //       nx = vertexNormalsArray[index];
         //        ny = vertexNormalsArray[index + 1];
         //        nz = vertexNormalsArray[index + 2];
         //        vx = normalsArray[index];
         //        vy = normalsArray[index + 1];
         //        vz = normalsArray[index + 2];

         var dot = vx * nx + vy * ny + vz * nz;
         rx = 2 * dot * nx - vx;
         ry = 2 * dot * ny - vy;
         rz = 2 * dot * nz - vz;
         reflectedNormalsArray.push(rx);
         reflectedNormalsArray.push(ry);
         reflectedNormalsArray.push(rz);
      }
   }

   console.log(count);
   return {
      numVertices: count,
      vertices: new Float32Array(verticesArray),
      normals: new Float32Array(normalsArray),
      vertexNormals: new Float32Array(vertexNormalsArray),
      reflectedNormals: new Float32Array(reflectedNormalsArray)
   };
}


//Returns elements of the transpose of the inverse of the modelview matrix.
function makeNormalMatrixElements(model, view)
{
   var n = new Matrix4(view).multiply(model);
   n.invert();
   n.transpose();

   // take just the upper-left 3x3 submatrix
   n = n.elements;
   return new Float32Array([
      n[0], n[1], n[2],
      n[4], n[5], n[6],
      n[8], n[9], n[10] ]);
}


var axisVertices = new Float32Array([
   0.0, 0.0, 0.0,
   1.5, 0.0, 0.0,
   0.0, 0.0, 0.0,
   0.0, 1.5, 0.0,
   0.0, 0.0, 0.0,
   0.0, 0.0, 1.5]);

var axisColors = new Float32Array([
   1.0, 0.0, 0.0, 1.0,
   1.0, 0.0, 0.0, 1.0,
   0.0, 1.0, 0.0, 1.0,
   0.0, 1.0, 0.0, 1.0,
   0.0, 0.0, 1.0, 1.0,
   0.0, 0.0, 1.0, 1.0]);

var lightAxisVertices = new Float32Array([
   0.0, 0.0, 0.0,
   0.0, 0.0, -10.0]);

var lightAxisColors = new Float32Array([
   1.0, 1.0, 0.0, 1.0,
   1.0, 1.0, 0.0, 1.0, ]);
// A few global variables...

// light and material properties, remember this is column major

// generic white light
var lightPropElements = new Float32Array([
   0.2, 0.2, 0.2,
   0.7, 0.7, 0.7,
   0.7, 0.7, 0.7
]);

// blue light with red specular highlights (because we can)
//var lightPropElements = new Float32Array([
//0.2, 0.2, 0.2,
//0.0, 0.0, 0.7,
//0.7, 0.0, 0.0
//]);

// shiny green plastic
//var matPropElements = new Float32Array([
//0.3, 0.3, 0.3,
//0.0, 0.8, 0.0,
//0.8, 0.8, 0.8
//]);
//var shininess = 30;

// shiny brass
//var matPropElements = new Float32Array([
//0.33, 0.22, 0.03,
//0.78, 0.57, 0.11,
//0.99, 0.91, 0.81
//]);
//var shininess = 28.0;

// very fake looking white, useful for testing lights
var matPropElements = new Float32Array([
   1, 1, 1,
   1, 1, 1,
   1, 1, 1
]);
var shininess = 20.0;
var s = 5.0;

// clay or terracotta
//var matPropElements = new Float32Array([
//0.75, 0.38, 0.26,
//0.75, 0.38, 0.26,
//0.25, 0.20, 0.15 // weak specular highlight similar to diffuse color
//]);
//var shininess = 10.0;

// the OpenGL context
var gl;

// our model data
var theModel;
var planeModel;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexNormalBuffer;

var vertexBufferPlane;
var vertexNormalBufferPlane;

var axisBuffer;
var axisColorBuffer;

var lightAxisBuffer;
var lightAxisColorBuffer;

// handle to the compiled shader program on the GPU
var lightingShader;
var colorShader;
var solidShader;

// transformation matrices
var model = new Matrix4();

var axis = 'x';
var paused = false;

// light position and direction, initially looking straight down y axis
var theObject = new CS336Object();
theObject.setPosition(0, 4, 0);
theObject.rotateX(-90);

//view matrix
var view = new Matrix4().setLookAt(
   1.77, 3.54, 3.06,   // eye
   0, 0, 0,            // at - looking at the origin
   0, 1, 0);           // up vector - y axis

var projection = new Matrix4().setPerspective(40, 1.5, 0.1, 1000);


//translate keypress events to strings
//from http://javascript.info/tutorial/keyboard-events
function getChar(event) {
   if (event.which == null) {
      return String.fromCharCode(event.keyCode) // IE
   } else if (event.which!=0 && event.charCode!=0) {
      return String.fromCharCode(event.which)   // the rest
   } else {
      return null // special key
   }
}



function handleKeyPress(event)
{
   var ch = getChar(event);

   // distance from origin
   var e = theObject.position.elements; // returns Vector3
   var distance = Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);

   switch (ch)
   {
         // shininess exponent
      case 't':
         shininess += 1;
         console.log("exponent: " + shininess);
         break;
      case 'T':
         shininess -= 1;
         console.log("exponent: " + shininess);
         break;

      case 'c':
         s += 1;
         console.log("exponent: " + s);
         break;
      case 'C':
         s -= 1;
         console.log("exponent: " + s);
         break;

         // pause rotation
      case ' ':
         paused = !paused;
         break;

         // motion controls for light
      case 'w':
         theObject.moveForward(0.1);
         break;
      case 'a':
         theObject.moveLeft(0.1);
         break;
      case 's':
         theObject.moveBack(0.1);
         break;
      case 'd':
         theObject.moveRight(0.1);
         break;
      case 'r':
         theObject.moveUp(0.1);
         break;
      case 'f':
         theObject.moveDown(0.1);
         break;
      case 'j':
         theObject.turnLeft(5);
         break;
      case 'l':
         theObject.turnRight(5);
         break;
      case 'i':
         //theObject.lookUp(5);
         theObject.rotateX(5)
         break;
      case 'k':
         //theObject.lookDown(5);
         theObject.rotateX(-5);
         break;
      case 'O':
         theObject.lookAt(0, 0, 0);
         break;

         // alternates for arrow keys
      case 'J':
         theObject.orbitRight(5, distance);
         break;
      case 'L':
         theObject.orbitLeft(5, distance);
         break;
      case 'I':
         theObject.orbitDown(5, distance);
         break;
      case 'K':
         theObject.orbitUp(5, distance);
         break;

         // axis rotations
      case 'y':
         theObject.rotateY(5);
         break;
      case 'Y':
         theObject.rotateY(-5);
         break;
      case 'z':
         theObject.rotateZ(5);
         break;
      case 'Z':
         theObject.rotateZ(-5);
         break;
      case 'x':
         theObject.rotateX(5); // same as look up
         break;
      case 'X':
         theObject.rotateX(-5); // same as look down
         break;

   }
   var lightPosition = theObject.position.elements;
   console.log("Light position " + lightPosition);
   var lightDirection = [
      -theObject.rotation.elements[9],
      -theObject.rotation.elements[10],
      -theObject.rotation.elements[11]];
   console.log("Light direction " + lightDirection);

}


// code to actually render our geometry
function draw()
{
   // clear the framebuffer
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

   // bind the shader
   gl.useProgram(lightingShader);

   // get the index for the a_Position attribute defined in the vertex shader
   var positionIndex = gl.getAttribLocation(lightingShader, 'a_Position');
   if (positionIndex < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
   }

   var normalIndex = gl.getAttribLocation(lightingShader, 'a_Normal');
   if (normalIndex < 0) {
      console.log('Failed to get the storage location of a_Normal');
      return;
   }

   // "enable" the a_position attribute
   gl.enableVertexAttribArray(positionIndex);
   gl.enableVertexAttribArray(normalIndex);

   // bind buffers for points
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
   gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   // set uniform in shader for projection * view * model transformation
   var loc = gl.getUniformLocation(lightingShader, "model");
   gl.uniformMatrix4fv(loc, false, model.elements);
   loc = gl.getUniformLocation(lightingShader, "view");
   gl.uniformMatrix4fv(loc, false, view.elements);
   loc = gl.getUniformLocation(lightingShader, "projection");
   gl.uniformMatrix4fv(loc, false, projection.elements);
   loc = gl.getUniformLocation(lightingShader, "normalMatrix");
   gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(model, view));

   // set light position
   var lp = theObject.position.elements;
   loc = gl.getUniformLocation(lightingShader, "lightPosition");
   gl.uniform4f(loc, lp[0], lp[1], lp[2], 1.0);

   // light and material properties
   loc = gl.getUniformLocation(lightingShader, "lightProperties");
   gl.uniformMatrix3fv(loc, false, lightPropElements);

   loc = gl.getUniformLocation(lightingShader, "D");
   gl.uniform4f(loc, -theObject.rotation.elements[8],
      -theObject.rotation.elements[9],
      -theObject.rotation.elements[10],
      -theObject.rotation.elements[11]);

   loc = gl.getUniformLocation(lightingShader, "materialProperties");
   gl.uniformMatrix3fv(loc, false, matPropElements);
   loc = gl.getUniformLocation(lightingShader, "shininess");
   gl.uniform1f(loc, shininess);
   loc = gl.getUniformLocation(lightingShader, "s");
   gl.uniform1f(loc, s);

   gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);

   // draw the plane
   // bind buffers
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferPlane);
   gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBufferPlane);
   gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   // rotate to be parallel to x-z plane and translate 'planeLocation' units down
   var planeLocation = 2;
   var planeModelMatrix = new Matrix4().translate(0, -planeLocation, 0).rotate(-90, 1, 0, 0);
   loc = gl.getUniformLocation(lightingShader, "model");
   gl.uniformMatrix4fv(loc, false, planeModelMatrix.elements);
   loc = gl.getUniformLocation(lightingShader, "normalMatrix");
   gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(planeModelMatrix, view));

   // draw plane
   gl.drawArrays(gl.TRIANGLES, 0, planeModel.numVertices);

   gl.disableVertexAttribArray(positionIndex);
   gl.disableVertexAttribArray(normalIndex);


   // draw the flat shadow using the "solid" shader
   gl.useProgram(solidShader);

   // get the index for the a_Position attribute defined in the vertex shader
   var positionIndex = gl.getAttribLocation(solidShader, 'a_Position');
   if (positionIndex < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
   }
   // "enable" the a_position attribute
   gl.enableVertexAttribArray(positionIndex);

   // bind buffer for points for cube
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);

   // get coords of light's current position, which will be center of projection
   var tx = theObject.position.elements[0];
   var ty = theObject.position.elements[1];
   var tz = theObject.position.elements[2];

   // d is total distance from center of projection to plane, so -d will be the
   // y-coordinate of the plane when center of projection is translated to origin
   var d = ty + planeLocation - .01; // make sure shadow is slightly above plane
   var shadowProjection = new Matrix4();
   shadowProjection.elements[7] = 1 / -d;
   shadowProjection.elements[15] = 0;

   // for this matrix to work, center of projection has to be at origin,
   // so use AMA' pattern to translate to origin
   shadowProjection = new Matrix4().translate(tx, ty, tz).multiply(shadowProjection).translate(-tx, -ty, -tz);

   loc = gl.getUniformLocation(solidShader, "color");
   gl.uniform4f(loc, 0.2, 0.2, 0.2, 1.0); // gray shadow

   // apply the cube's current model transformation, then apply the shadow projection
   // to get the "shadow", then apply the usual view and projection for the scene
   loc = gl.getUniformLocation(solidShader, "transform");
   transform = new Matrix4().multiply(projection).multiply(view).multiply(shadowProjection).multiply(model);
   gl.uniformMatrix4fv(loc, false, transform.elements);

   gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);

   gl.disableVertexAttribArray(positionIndex);

   // now draw axes
   // bind the shader
   gl.useProgram(colorShader);

   // get the index for the a_Position attribute defined in the vertex shader
   positionIndex = gl.getAttribLocation(colorShader, 'a_Position');
   if (positionIndex < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
   }

   var colorIndex = gl.getAttribLocation(colorShader, 'a_Color');
   if (colorIndex < 0) {
      console.log('Failed to get the storage location of a_Normal');
      return;
   }

   // "enable" the a_position attribute
   gl.enableVertexAttribArray(positionIndex);
   gl.enableVertexAttribArray(colorIndex);

   // draw axes (not transformed by model transformation)
   gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
   gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
   gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   // set transformation to projection * view only
   loc = gl.getUniformLocation(colorShader, "transform");
   transform = new Matrix4().multiply(projection).multiply(view);
   gl.uniformMatrix4fv(loc, false, transform.elements);

   // draw axes
   gl.drawArrays(gl.LINES, 0, 6);

   // draw a line representing light direction
   // draw axes (not transformed by model transformation)
   gl.bindBuffer(gl.ARRAY_BUFFER, lightAxisBuffer);
   gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, lightAxisColorBuffer);
   gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   // set transformation to be transformation of the light object
   loc = gl.getUniformLocation(colorShader, "transform");
   transform = new Matrix4().multiply(projection).multiply(view).multiply(theObject.getMatrix());
   gl.uniformMatrix4fv(loc, false, transform.elements);

   // draw line
   gl.drawArrays(gl.LINES, 0, 2);


   // unbind shader and "disable" the attribute indices
   // (not really necessary when there is only one shader)
   gl.disableVertexAttribArray(positionIndex);
   gl.disableVertexAttribArray(colorIndex);
   gl.useProgram(null);

}

// entry point when page is loaded
function main() {

   // basically this function does setup that "should" only have to be done once,
   // while draw() does things that have to be repeated each time the canvas is
   // redrawn

   // retrieve <canvas> element
   var canvas = document.getElementById('theCanvas');

   // key handler
   window.onkeypress = handleKeyPress;

   // get the rendering context for WebGL, using the utility from the teal book
   gl = getWebGLContext(canvas, false);
   if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
   }

   // load and compile the shader pair, using utility from the teal book
   var vshaderSource = document.getElementById('vertexColorShader').textContent;
   var fshaderSource = document.getElementById('fragmentColorShader').textContent;
   if (!initShaders(gl, vshaderSource, fshaderSource)) {
      console.log('Failed to intialize shaders.');
      return;
   }
   colorShader = gl.program;
   gl.useProgram(null);

   // load and compile the shader pair, using utility from the teal book
   var vshaderSource = document.getElementById('vertexLightingShader').textContent;
   var fshaderSource = document.getElementById('fragmentLightingShader').textContent;
   if (!initShaders(gl, vshaderSource, fshaderSource)) {
      console.log('Failed to intialize shaders.');
      return;
   }
   lightingShader = gl.program;
   gl.useProgram(null);

   // load and compile the shader pair, using utility from the teal book
   var vshaderSource = document.getElementById('vertexSolidShader').textContent;
   var fshaderSource = document.getElementById('fragmentSolidShader').textContent;
   if (!initShaders(gl, vshaderSource, fshaderSource)) {
      console.log('Failed to intialize shaders.');
      return;
   }
   solidShader = gl.program;
   gl.useProgram(null);


   // cube
   theModel = getModelData(new THREE.BoxGeometry(1, 1, 1))

   // basic sphere
   //theModel = getModelData(new THREE.SphereGeometry(1))

   // sphere with more faces
   //theModel = getModelData(new THREE.SphereGeometry(1, 48, 24));

   // torus knot
   //theModel = getModelData(new THREE.TorusKnotGeometry(1, .4, 128, 16));


   // buffer for vertex positions for triangles
   vertexBuffer = gl.createBuffer();
   if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, theModel.vertices, gl.STATIC_DRAW);

   // buffer for vertex normals
   vertexNormalBuffer = gl.createBuffer();
   if (!vertexNormalBuffer) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);

   // choose face normals, vertex normals, or wacky normals
   //gl.bufferData(gl.ARRAY_BUFFER, theModel.normals, gl.STATIC_DRAW);
   gl.bufferData(gl.ARRAY_BUFFER, theModel.vertexNormals, gl.STATIC_DRAW);
   //gl.bufferData(gl.ARRAY_BUFFER, theModel.reflectedNormals, gl.STATIC_DRAW);

   // plane for "floor"
   planeModel = getModelData(new THREE.PlaneGeometry(5, 5));

   // buffer for vertex positions for triangles
   vertexBufferPlane = gl.createBuffer();
   if (!vertexBufferPlane) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferPlane);
   gl.bufferData(gl.ARRAY_BUFFER, planeModel.vertices, gl.STATIC_DRAW);

   // buffer for vertex normals
   vertexNormalBufferPlane = gl.createBuffer();
   if (!vertexNormalBufferPlane) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBufferPlane);

   // choose face normals, vertex normals, or wacky normals
   gl.bufferData(gl.ARRAY_BUFFER, planeModel.normals, gl.STATIC_DRAW);

   // axes
   axisBuffer = gl.createBuffer();
   if (!axisBuffer) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, axisVertices, gl.STATIC_DRAW);

   // buffer for axis colors
   axisColorBuffer = gl.createBuffer();
   if (!axisColorBuffer) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, axisColors, gl.STATIC_DRAW);

   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   // draw an axis showing light direction
   lightAxisBuffer = gl.createBuffer();
   if (!lightAxisBuffer) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, lightAxisBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, lightAxisVertices, gl.STATIC_DRAW);

   // buffer for axis colors
   lightAxisColorBuffer = gl.createBuffer();
   if (!lightAxisColorBuffer) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, lightAxisColorBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, lightAxisColors, gl.STATIC_DRAW);

   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   // specify a fill color for clearing the framebuffer
   gl.clearColor(0.0, 0.2, 0.2, 1.0);

   gl.enable(gl.DEPTH_TEST);

   // define an animation loop
   var animate = function() {
      draw();

      // increase the rotation by some amount, depending on the axis chosen
      var increment = 0.5;
      if (!paused)
      {
         switch(axis)
         {
            case 'x':
               model = new Matrix4().setRotate(increment, 1, 0, 0).multiply(model);
               axis = 'x';
               break;
            case 'y':
               axis = 'y';
               model = new Matrix4().setRotate(increment, 0, 1, 0).multiply(model);
               break;
            case 'z':
               axis = 'z';
               model = new Matrix4().setRotate(increment, 0, 0, 1).multiply(model);
               break;
            default:
         }
      }

      // request that the browser calls animate() again "as soon as it can"
      requestAnimationFrame(animate, canvas);
   };

   // start drawing!
   animate();


}
