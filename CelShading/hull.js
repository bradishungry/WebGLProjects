// Cel shading a model with inverse hull and post processing methods. There
// might not be as much code here as some other topic implementations, but
// implementing this in WebGL forced me to understand framebuffers, depth maps,
// storing RGBA values, two pass rendering (and by extention a lot of
// information on defered rendering and shading), blending, and some other graphics
// fundementals. Using OpenGL 4 would make this much more effecient with
// different render targets, however it really isn't too costly in WebGL at the
// moment.

// size of the fbo
var OFFSCREEN_WIDTH = 1024;
var OFFSCREEN_HEIGHT = 1024;

var theModel;

// same as the model but flipped normals

// This actually is not necessary. I implemented this with just the Guilty Gear
// Xrd graphics analysis video, but I misunderstood what they did to implement
// it, as they said they used a second set of polygons and I believe they just
// rendered the original twice.
// I originally was multiplying the normals by the normal matrix and if I
// used negative normals it ended up correct (for some reason), but you can just
// use the regular normals and expand according to them with one model.
var invertModel;

// Quad that we draw to the screen
var planeModel;

var modelFilename;

// if a filename is given, that will be use by the loader
// to initialize 'theModel'
//modelFilename = "../models/bunny_cylindrical_tex.obj";

modelFilename = "../models/teapot.obj";


// I reccommend trying this one, it shows many of the drawbacks and things to
// consider when implementing cel shading
//theModel = getModelData(new THREE.BoxGeometry(1, 1, 1));

//theModel = getModelData(new THREE.SphereGeometry(1))
//theModel = getModelData(new THREE.SphereGeometry(1, 48, 24));
//theModel = getModelData(new THREE.TorusKnotGeometry(1, .4, 128, 16), false);
//invertModel = getModelData(new THREE.TorusKnotGeometry(1, .4, 128, 16), true);


//var imageFilename = "../images/check64.png";
//var imageFilename = "../images/check64border.png";
//var imageFilename = "../images/metal.jpg";
//var imageFilename = "../images/brick.png";
var imageFilename = "../images/marble.png";
//var imageFilename = "../images/steve.png";
//var imageFilename = "../images/tarnish.jpg";

// given an instance of THREE.Geometry, returns an object
// containing raw data for vertices and normal vectors.
function getModelData(geom, invert)
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

      if(invert === true){
      var fn = -(face.normal);
      } else {
      var fn = face.normal;
      }
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

   }

   // texture coords
   //each element is an array of three Vector2
   var uvs = geom.faceVertexUvs[ 0 ];
   var texCoordArray = [];
   for (var a = 0; a < uvs.length; ++a)
   {
      for (var i = 0; i < 3; ++i)
      {
         var uv = uvs[a][i];
         texCoordArray.push(uv.x);
         texCoordArray.push(uv.y);
      }
   }

   return {
      numVertices: count,
      vertices: new Float32Array(verticesArray),
      normals: new Float32Array(normalsArray),
      vertexNormals: new Float32Array(vertexNormalsArray),
      reflectedNormals: new Float32Array(reflectedNormalsArray),
      texCoords: new Float32Array(texCoordArray)
   };
}

//Code for initializing FBO borrowed directly from teal book example (see chapter 10)
//Returns a handle to the FBO, with an added attribute called 'texture' which is the
//associated texture.  Depends on the two constants OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT.
function initFramebufferObject(gl) {
   var framebuffer, texture, depthBuffer;

   //Define the error handling function
   var error = function() {
      if (framebuffer) gl.deleteFramebuffer(framebuffer);
      if (texture) gl.deleteTexture(texture);
      if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
      return null;
   }

   //Create a frame buffer object (FBO)
   framebuffer = gl.createFramebuffer();
   if (!framebuffer) {
      console.log('Failed to create frame buffer object');
      return error();
   }

   //Create a texture object and set its size and parameters
   texture = gl.createTexture(); // Create a texture object
   if (!texture) {
      console.log('Failed to create texture object');
      return error();
   }
   gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the object to target
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   framebuffer.texture = texture; // Store the texture object

   //Create a renderbuffer object and Set its size and parameters
   depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
   if (!depthBuffer) {
      console.log('Failed to create renderbuffer object');
      return error();
   }
   gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
   gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

   //Attach the texture and the renderbuffer object to the FBO
   gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
   gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

   //Check if FBO is configured correctly
   var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
   if (gl.FRAMEBUFFER_COMPLETE !== e) {
      console.log('Frame buffer object is incomplete: ' + e.toString());
      return error();
   }

   //Unbind the buffer object
   gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   gl.bindTexture(gl.TEXTURE_2D, null);
   gl.bindRenderbuffer(gl.RENDERBUFFER, null);

   return framebuffer;
}


function makeNormalMatrixElements(model, view)
{
   var n = new Matrix4(view).multiply(model);
   n.transpose();
   n.invert();
   n = n.elements;
   return new Float32Array([
      n[0], n[1], n[2],
      n[4], n[5], n[6],
      n[8], n[9], n[10] ]);
}

// A few global variables...

// light and material properties, remember this is column major

// generic white light
var lightPropElements = new Float32Array([
   0.2, 0.2, 0.2,
   0.7, 0.7, 0.7,
   0.7, 0.7, 0.7
]);

// shiny brass
var matPropElements = new Float32Array([
   0.33, 0.22, 0.03,
   0.78, 0.57, 0.11,
   0.99, 0.91, 0.81
]);

var shininess = 28.0;

// the OpenGL context
var gl;

var sobel;
var hull;
//the framebuffer and associated texture
var fbo;

//the depthbuffer
var dbo;

// our model data
var theModel;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexNormalBuffer;
var texCoordBuffer;

var vertexBufferPlane;
var texCoordBufferPlane;

//handle to the texture object on the GPU
var textureHandle;

// handle to the compiled shader program on the GPU
var lightingShader;
var textureShader;
var depthShader;
var outlineShader;

// transformation matrices
var model = new Matrix4();
var modelScale = new Matrix4();

var axis = 'y';
var paused = false;

//instead of view and projection matrices, use a Camera
var camera = new Camera(30, 1.0);

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
   if (camera.keyControl(ch))
   {

      return;
   }

   switch(ch)
   {
      case ' ':
         paused = !paused;
         break;
      case 'x':
         axis = 'x';
         break;
      case 'y':
         axis = 'y';
         break;
      case 'z':
         axis = 'z';
         break;
      case 'o':
         model.setIdentity();
         axis = 'x';
         break;

         // experiment with texture parameters
      case '1':
         gl.bindTexture(gl.TEXTURE_2D, textureHandle);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         break;
      case '2':
         gl.bindTexture(gl.TEXTURE_2D, textureHandle);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         break;
      case '3':
         gl.bindTexture(gl.TEXTURE_2D, textureHandle);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
         break;
      case '4':
         gl.bindTexture(gl.TEXTURE_2D, textureHandle);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
         break;
      case '5':
         gl.bindTexture(gl.TEXTURE_2D, textureHandle);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
         break;

      case 'm':
               sobel = true;
               hull = false;
               break;
            case 'n':
               sobel = false;
               hull = true;
               break;



      default:
         return;
   }
}

//Function to take a rendered scene and store the depth information in a shaders
//RGB values
function drawDepth()
{

   var view = camera.getView();
   var projection = camera.getProjection();

   gl.bindFramebuffer(gl.FRAMEBUFFER, dbo ); //Write to depth framebuffer
   gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
   gl.clearColor(1.0, 1.0, 1.0, 0.0);

   //gl.enable(gl.DEPTH_TEST);

   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   // bind the shader
   gl.useProgram(depthShader);

   // get the index for the a_Position attribute defined in the vertex shader
   var positionIndex = gl.getAttribLocation(depthShader, 'a_Position');
   if (positionIndex < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
   }

   // "enable" the a_position attribute
   gl.enableVertexAttribArray(positionIndex);

   // bind buffers for points
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);

   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   // set uniform in shader for projection * view * model transformation
   var loc = gl.getUniformLocation(depthShader, "model");
   var current = new Matrix4(model).multiply(modelScale);
   gl.uniformMatrix4fv(loc, false, current.elements);
   loc = gl.getUniformLocation(depthShader, "view");
   gl.uniformMatrix4fv(loc, false, view.elements);
   loc = gl.getUniformLocation(depthShader, "projection");
   gl.uniformMatrix4fv(loc, false, projection.elements);

   // draw to depth framebuffer
   gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);

   gl.disableVertexAttribArray(positionIndex);
   gl.useProgram(null);



}


//Function to draw the model to a framebuffer
function drawModel(shader, invert)
{
   var view = camera.getView();
   var projection = camera.getProjection();


   gl.bindFramebuffer(gl.FRAMEBUFFER, fbo );
   gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
   gl.clearColor(0.0, 1.0, 1.0, 0.0);

   //gl.enable(gl.DEPTH_TEST);

   // clear the framebuffer
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   // bind the shader
   gl.useProgram(shader);

   // get the index for the a_Position attribute defined in the vertex shader
   var positionIndex = gl.getAttribLocation(shader, 'a_Position');
   if (positionIndex < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
   }

   var normalIndex = gl.getAttribLocation(shader, 'a_Normal');
   if (normalIndex < 0) {
      console.log('Failed to get the storage location of a_Normal');
      return;
   }

   if(invert === false){
   var texCoordIndex = gl.getAttribLocation(shader, 'a_TexCoord');
   if (texCoordIndex < 0) {
      console.log('Failed to get the storage location of a_TexCoord');
      return;
   }
   }

   // "enable" the a_position attribute
   gl.enableVertexAttribArray(positionIndex);
   gl.enableVertexAttribArray(normalIndex);
   if(invert === false){
   gl.enableVertexAttribArray(texCoordIndex);
   }
   // bind buffers for points
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
   gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
   if(invert === false){
   gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
   gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   // set uniform in shader for projection * view * model transformation
   var loc = gl.getUniformLocation(shader, "model");
   var current = new Matrix4(model).multiply(modelScale);
   gl.uniformMatrix4fv(loc, false, current.elements);
   loc = gl.getUniformLocation(shader, "view");
   gl.uniformMatrix4fv(loc, false, view.elements);
   loc = gl.getUniformLocation(shader, "projection");
   gl.uniformMatrix4fv(loc, false, projection.elements);
   loc = gl.getUniformLocation(shader, "normalMatrix");
   gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(model, view));

   if(invert === false){
   loc = gl.getUniformLocation(shader, "lightPosition");
   gl.uniform4f(loc, 2.0, 4.0, 2.0, 1.0);

   // light and material properties
   loc = gl.getUniformLocation(shader, "lightProperties");
   gl.uniformMatrix3fv(loc, false, lightPropElements);
   loc = gl.getUniformLocation(shader, "materialProperties");
   gl.uniformMatrix3fv(loc, false, matPropElements);
   loc = gl.getUniformLocation(shader, "shininess");
   gl.uniform1f(loc, shininess);

   // need to choose a texture unit, then bind the texture to TEXTURE_2D for that unit
   var textureUnit = 1;
   gl.activeTexture(gl.TEXTURE0 + textureUnit);
   gl.bindTexture(gl.TEXTURE_2D, textureHandle);
   loc = gl.getUniformLocation(shader, "sampler");
   gl.uniform1i(loc, textureUnit);

   loc = gl.getUniformLocation(shader, "textureSize");
   gl.uniform1f(loc, OFFSCREEN_WIDTH);
   }

   // draw to framebuffer
   gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);
   gl.disableVertexAttribArray(positionIndex);
   gl.disableVertexAttribArray(normalIndex);
   gl.useProgram(null);

}

//Function to draw outline with Sobel shader, using packed depth data
function drawOutline(){
   // Render depth to framebuffer
   drawDepth();

   // Blend because alpha values in webgl are dumb
   gl.enable(gl.BLEND);
   gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

   // Disable depth because rendering to a quad
   gl.disable(gl.DEPTH_TEST);

   gl.bindFramebuffer(gl.FRAMEBUFFER, null );
   //gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);  // Set a viewport for FBO

   gl.useProgram(outlineShader);

   // get the index for the a_Position attribute defined in the vertex shader
   var positionIndex = gl.getAttribLocation(outlineShader, 'a_Position');
   if (positionIndex < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
   }

   var texCoordIndex = gl.getAttribLocation(outlineShader, 'a_TexCoord0');
   if (texCoordIndex < 0) {
      console.log('Failed to get the storage location of a_TexCoord');
      return;
   }

   // "enable" the a_position attribute
   gl.enableVertexAttribArray(positionIndex);
   gl.enableVertexAttribArray(texCoordIndex);
   console.log("s");


   // bind buffers
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferPlane);
   gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferPlane);
   gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, null);


   var textureUnit = 2;
   gl.activeTexture(gl.TEXTURE0 + textureUnit);
   gl.bindTexture(gl.TEXTURE_2D, dbo.texture);
   gl.generateMipmap(gl.TEXTURE_2D);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

   // Track size to calculate pixel size
   var loc = gl.getUniformLocation(outlineShader, "size");
   gl.uniform2f(loc, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

   loc = gl.getUniformLocation(outlineShader, "depthTexture");
   gl.uniform1i(loc, textureUnit);

   // draw to screen filling quad
   gl.drawArrays(gl.TRIANGLES, 0, planeModel.numVertices);
   gl.disableVertexAttribArray(positionIndex);
   gl.disableVertexAttribArray(texCoordIndex);

   // Be sure to reset everything you changed
   gl.enable(gl.DEPTH_TEST);
   gl.disable(gl.BLEND);

   gl.useProgram(null);

}


// code to actually render our geometry
function draw(invert)
{
   // Because the hull was implemented rather quickly, there is probably a
   // better way to do the render than just using a boolean.

   // Cull faces because they aren't needed
   gl.enable(gl.CULL_FACE);
   gl.cullFace(gl.BACK);

   // Draw to framebuffer
   if(invert === false){
      drawModel(lightingShader, invert);
   }

   if(invert === true){
      drawModel(invertShader, invert);
   }
   gl.enable(gl.BLEND);
   gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

   // Again, drawing to a quad
   gl.disable(gl.DEPTH_TEST);

   gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   //gl.viewport(0, 0, 1024, 1024);
   //gl.clearColor(0.0, 0.0, 0.0, 0.0);

   //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   // bind the shader
   gl.useProgram(textureShader);

   // get the index for the a_Position attribute defined in the vertex shader
   var positionIndex = gl.getAttribLocation(textureShader, 'a_Position');
   if (positionIndex < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
   }

   var texCoordIndex = gl.getAttribLocation(textureShader, 'a_TexCoord');
   if (texCoordIndex < 0) {
      console.log('Failed to get the storage location of a_TexCoord');
      return;
   }

   // "enable" the a_position attribute
   gl.enableVertexAttribArray(positionIndex);
   gl.enableVertexAttribArray(texCoordIndex);


   // bind buffers
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferPlane);
   gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferPlane);
   gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   var view = camera.getView();
   var projection = camera.getProjection();

   // bind framebuffer texture to get shape on quad
   var textureUnit = 0;
   gl.activeTexture(gl.TEXTURE0 + textureUnit);
   gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
   gl.generateMipmap(gl.TEXTURE_2D);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);


   loc = gl.getUniformLocation(textureShader, "sampler");
   gl.uniform1i(loc, textureUnit);

   // draw
   gl.drawArrays(gl.TRIANGLES, 0, planeModel.numVertices);
   gl.disable(gl.CULL_FACE);
   gl.disableVertexAttribArray(positionIndex);
   gl.disableVertexAttribArray(texCoordIndex);
   gl.disable(gl.BLEND);

   gl.enable(gl.DEPTH_TEST);
   gl.useProgram(null);

}



//entry point when page is loaded.  Wait for image to load before proceeding
function main() {
   var image = new Image();
   image.onload = function() {
      // chain the next function
      loadModel(image);
   };

   // starts loading the image asynchronously
   image.src = imageFilename;
}

//after loading texture image, load a model
function loadModel(image)
{
   // only do this if we were given a filename to use
   if (modelFilename)
   {

      var callback = function(loadedModel, materials)
      {
         // assume only one object in the .obj file
         var child = loadedModel.children[0];

         var geometry = child.geometry;
         theModel = new Object();
         theModel.numVertices = geometry.getAttribute('position').array.length /
            geometry.getAttribute('position').itemSize;
         theModel.vertices = geometry.getAttribute('position').array;
         theModel.vertexNormals = geometry.getAttribute('normal').array;
         theModel.texCoords = geometry.getAttribute('uv').array;
         invertModel = new Object();
         invertModel.numVertices = geometry.getAttribute('position').array.length /
            geometry.getAttribute('position').itemSize;
         invertModel.vertices = geometry.getAttribute('position').array;
         invertModel.vertexNormals = geometry.getAttribute('normal').array;
         invertModel.texCoords = geometry.getAttribute('uv').array;

         // set a scale so it's roughly one unit in diameter
         geometry.computeBoundingSphere();
         var scale = 1 / geometry.boundingSphere.radius;
         modelScale = new Matrix4().setScale(scale, scale, scale);

         // chain the next function...
         startForReal(image);
      };

      // load the model file asynchronously
      var objLoader = new THREE.OBJLoader();
      objLoader.load(modelFilename, callback, function(){}, function(){ console.log("fail") });
   }
   else
   {
      startForReal(image);
   }

}

// entry point when page is loaded
function startForReal(image) {

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
   sobel = false;
   hull = true;


   // create the framebuffer object and associated texture
   fbo = initFramebufferObject(gl);
   // framebuffer for depth
   dbo = initFramebufferObject(gl);

   // load and compile the shader pair, using utility from the teal book
   var vshaderSource = document.getElementById('vertexLightingShader').textContent;
   var fshaderSource = document.getElementById('fragmentLightingShader').textContent;
   if (!initShaders(gl, vshaderSource, fshaderSource)) {
      console.log('Failed to intialize shaders.');
      return;
   }
   lightingShader = gl.program;
   gl.useProgram(null);

   var vshaderSource = document.getElementById('vertexTextureShader').textContent;
   var fshaderSource = document.getElementById('fragmentTextureShader').textContent;
   if (!initShaders(gl, vshaderSource, fshaderSource)) {
      console.log('Failed to intialize shaders.');
      return;
   }
   textureShader = gl.program;
   gl.useProgram(null);

   //Depth
   var vshaderSource = document.getElementById('vertexDbShader').textContent;
   var fshaderSource = document.getElementById('fragmentDbShader').textContent;
   if(!initShaders(gl, vshaderSource, fshaderSource)){
      console.log('Failed to initShaders.');
      return;
   }
   depthShader = gl.program;
   gl.useProgram(null);

   //Outline
   var vshaderSource = document.getElementById('outlineVertexShader').textContent;
   var fshaderSource = document.getElementById('outlineFragShader').textContent;
   if(!initShaders(gl, vshaderSource, fshaderSource)){
      console.log('Failed to initShaders.');
      return;
   }
   outlineShader = gl.program;
   gl.useProgram(null);

   //Outline
   var vshaderSource = document.getElementById('invertVertexShader').textContent;
   var fshaderSource = document.getElementById('invertFragShader').textContent;
   if(!initShaders(gl, vshaderSource, fshaderSource)){
      console.log('Failed to initShaders.');
      return;
   }
   invertShader = gl.program;
   gl.useProgram(null);



   // buffer for vertex positions for triangles
   vertexBuffer = gl.createBuffer();
   if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, theModel.vertices, gl.STATIC_DRAW);

   // buffer for normals
   vertexNormalBuffer = gl.createBuffer();
   if (!vertexNormalBuffer) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, theModel.vertexNormals, gl.STATIC_DRAW);


   // buffer for tex coords
   texCoordBuffer = gl.createBuffer();
   if (!texCoordBuffer) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, theModel.texCoords, gl.STATIC_DRAW);


   //Quads to fill screen
   planeModel = getModelData(new THREE.PlaneGeometry(2, 2));

   // buffer for vertex positions for triangles
   vertexBufferPlane = gl.createBuffer();
   if (!vertexBufferPlane) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferPlane);
   gl.bufferData(gl.ARRAY_BUFFER, planeModel.vertices, gl.STATIC_DRAW);

   texCoordBufferPlane = gl.createBuffer();
   if (!texCoordBufferPlane) {
      console.log('Failed to create the buffer object');
      return;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferPlane);
   gl.bufferData(gl.ARRAY_BUFFER, planeModel.texCoords, gl.STATIC_DRAW);

   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   // ask the GPU to create a texture object
   textureHandle = gl.createTexture();

   // choose a texture unit to use during setup, defaults to zero
   // (can use a different one when drawing)
   // max value is MAX_COMBINED_TEXTURE_IMAGE_UNITS
   gl.activeTexture(gl.TEXTURE0);

   // bind the texture
   gl.bindTexture(gl.TEXTURE_2D, textureHandle);

   // load the image bytes to the currently bound texture, flipping the vertical
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

   // texture parameters are stored with the texture
   gl.generateMipmap(gl.TEXTURE_2D);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

   // specify a fill color for clearing the framebuffer
   gl.clearColor(0.0, 0.2, 0.2, 1.0);

   gl.enable(gl.DEPTH_TEST);

   camera.orbitUp(0, 0.0);
   camera.orbitRight(0, 0.0);

   // define an animation loop
   var animate = function() {
      // Render flipped model to framebuffer
      // Render framebuffer to quad and draw
      // Render model to framebuffer
      // Render framebuffer to quad and draw
      if(hull === true){
      draw(true);
      draw(false);
      }

      // Render model to framebuffer
      // Render framebuffer to quad and draw on screen
      // Render drawn depth data to framebuffer and pack data
      // Unpack data and calculate outlines, draw this to quad and screen
      if(sobel === true){
      draw(false);
      drawOutline();
      }

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
