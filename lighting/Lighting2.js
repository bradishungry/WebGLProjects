//
// Lighting, continued.  Here we add a function to take a
// model created by three.js and extract the data for
// vertices and normals, so we can load it directly to the GPU.  This
// is just to have some models to play with besides the cube.
//
// This js file can be loaded with any of the following html files,
// each of which uses a different shader pair.  See comments for explanation.
// (Lighting2.html, Lighting2a.html, Lighting2b.html, Lighting2c.html)
//
// Edit main() to choose a model and to select face normals or vertex normals.
//
// Note you will need the three.js library.  Check the path in the html file.
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
         //	     nx = vertexNormalsArray[index];
         //	      ny = vertexNormalsArray[index + 1];
         //	      nz = vertexNormalsArray[index + 2];
         //	      vx = normalsArray[index];
         //	      vy = normalsArray[index + 1];
         //	      vz = normalsArray[index + 2];

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

// Creates data for vertices, colors, and normal vectors for
// a unit cube.  Return value is an object with three attributes
// vertices, colors, and normals, each referring to a Float32Array.
// (Note this is a "self-invoking" anonymous function.)
function makeCube()
{
   // vertices of cube
   var rawVertices = new Float32Array([
      -0.5, -0.5, 0.5,
      0.5, -0.5, 0.5,
      0.5, 0.5, 0.5,
      -0.5, 0.5, 0.5,
      -0.5, -0.5, -0.5,
      0.5, -0.5, -0.5,
      0.5, 0.5, -0.5,
      -0.5, 0.5, -0.5]);

   var rawColors = new Float32Array([
      1.0, 0.0, 0.0, 1.0,  // red
      0.0, 1.0, 0.0, 1.0,  // green
      0.0, 0.0, 1.0, 1.0,  // blue
      1.0, 1.0, 0.0, 1.0,  // yellow
      1.0, 0.0, 1.0, 1.0,  // magenta
      0.0, 1.0, 1.0, 1.0,  // cyan
   ]);

   var rawNormals = new Float32Array([
      0, 0, 1,
      1, 0, 0,
      0, 0, -1,
      -1, 0, 0,
      0, 1, 0,
      0, -1, 0 ]);


   var indices = new Uint16Array([
      0, 1, 2, 0, 2, 3,  // z face
      1, 5, 6, 1, 6, 2,  // +x face
      5, 4, 7, 5, 7, 6,  // -z face
      4, 0, 3, 4, 3, 7,  // -x face
      3, 2, 6, 3, 6, 7,  // + y face
      4, 5, 1, 4, 1, 0   // -y face
   ]);

   var verticesArray = [];
   var colorsArray = [];
   var normalsArray = [];
   for (var i = 0; i < 36; ++i)
   {
      // for each of the 36 vertices...
      var face = Math.floor(i / 6);
      var index = indices[i];

      // (x, y, z): three numbers for each point
      for (var j = 0; j < 3; ++j)
      {
         verticesArray.push(rawVertices[3 * index + j]);
      }

      // (r, g, b, a): four numbers for each point
      for (var j = 0; j < 4; ++j)
      {
         colorsArray.push(rawColors[4 * face + j]);
      }

      // three numbers for each point
      for (var j = 0; j < 3; ++j)
      {
         normalsArray.push(rawNormals[3 * face + j]);
      }
   }

   return {
      numVertices: 36,
      vertices: new Float32Array(verticesArray),
      colors: new Float32Array(colorsArray),
      normals: new Float32Array(normalsArray)
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

// A few global variables...

// the OpenGL context
var gl;

// our model data
var theModel;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexNormalBuffer;

var axisBuffer;
var axisColorBuffer;

// handle to the compiled shader program on the GPU
var lightingShader;
var colorShader;

// transformation matrices
var model = new Matrix4();

var axis = 'x';
var paused = false;

//view matrix
// One strategy is to identify a transformation to our camera frame,
// then invert it.  Here we use the inverse of
// rotate(30, 0, 1, 0) * rotateX(-45) * Translate(0, 0, 5)
var view = new Matrix4().translate(0, 0, -5).rotate(45, 1, 0, 0).rotate(-30, 0, 1, 0);

// Alternatively use the LookAt function, specifying the view (eye) point,
// a point at which to look, and a direction for "up".
// Approximate view point for above is (1.77, 3.54, 3.06)
//var view = new Matrix4().setLookAt(
//		1.77, 3.54, 3.06,   // eye
//		0, 0, 0,            // at - looking at the origin
//		0, 1, 0);           // up vector - y axis


// For projection we can use an orthographic projection, specifying
// the clipping volume explicitly
//var projection = new Matrix4().setOrtho(-1.5, 1.5, -1, 1, 4, 6)

// Or, use a perspective projection specified with a
// field of view, an aspect ratio, and distance to near and far
// clipping planes
// Here use aspect ratio 3/2 corresponding to canvas size 600 x 400
var projection = new Matrix4().setPerspective(30, 1.5, 0.1, 1000);

// Or, here is the same perspective projection, using the Frustum function
// a 30 degree field of view with near plane at 4 corresponds
// view plane height of  4 * tan(15) = 1.07
//var projection = new Matrix4().setFrustum(-1.5 * 1.07, 1.5 * 1.07, -1.07, 1.07, 4, 6);


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

//handler for key press events will choose which axis to
// rotate around
function handleKeyPress(event)
{
   var ch = getChar(event);
   switch(ch)
   {
      case ' ':
         paused = !paused;
         break;
      case 'x':
         //m.setRotate(15, 1, 0, 0);
         axis = 'x';
         break;
      case 'y':
         axis = 'y';
         //m.setRotate(15, 0, 1, 0);
         break;
      case 'z':
         axis = 'z';
         //m.setRotate(15, 0, 0, 1);
         break;
      case 'o':
         model.setIdentity();
         axis = 'x';
         break;
      default:
         return;
   }
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

   loc = gl.getUniformLocation(lightingShader, "lightPosition");
   gl.uniform4f(loc, 2.0, 4.0, 2.0, 1.0);

   gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);

   gl.disableVertexAttribArray(positionIndex);
   gl.disableVertexAttribArray(normalIndex);


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

   // basic sphere
   //theModel = getModelData(new THREE.SphereGeometry(1));

   // sphere with more faces
   //theModel = getModelData(new THREE.SphereGeometry(1, 48, 24));

   // torus knot
   theModel = getModelData(new THREE.TorusKnotGeometry(1, .4, 128, 16));

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
