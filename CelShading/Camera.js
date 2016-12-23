/**
 * Simplified camera encapsulating the camera's position plus an x, y, and z axis, 
 * which are denoted here as right, up, and back, respectively.
 * The camera is not allowed to roll, so the camera's
 * x-axis is always perpendicular to the world's up vector (world y-axis).  The turnLeft
 * and turnRight operations rotate about an axis through the camera's center that
 * is parallel to the world up vector.  By default the camera is located
 * at (0, 0, 5) and its x, y, and z axes are the same as the world x, y, and z
 * (i.e., the camera is looking down the negative z-axis toward the origin).
 * 
 * There are methods for calculating a view and projection matrix from the camera's
 * state.  Applications typically request these matrices frequently (many times per
 * frame) so we keep a cached copy of each one and only recalculate when necessary.
 * (See getProjection, setAspect, and setFovy for an example.)
 * 
 */
var Camera = function(fovy, aspect)
{
  // by default we are at (0, 0, 5) looking along the world's negative z-axis
  
  // camera x-axis
  this.right = new Vector3([1, 0, 0]);
  
  // camera y-axis
  this.up = new Vector3([0, 1, 0]);
  
  // camera z-axis
  this.back = new Vector3([0, 0, 1]);
  
  // camera position
  this.position = new Vector3([0, 0, 5]);
  
  // cached copies of view matrix and projection matrix
  // (initialized to some appropriate defaults):
  
  // view matrix is always the inverse of camera's translation * rotation
  // (initial rotation is the identity, so this is easy to initialize)
  this.viewMatrix = new Matrix4().setTranslate(0, 0, -5);
  this.viewStale = false;

  // projection matrix
  this.aspect = aspect || 1.0;
  this.fovy = fovy || 30.0;
  this.zNear = 0.1;
  this.zFar = 1000;

  this.projectionMatrix = new Matrix4().setPerspective(this.fovy, this.aspect, this.zNear, this.zFar);
  this.projectionStale = false;
}

/**
 * Returns the view matrix for this camera.
 */
Camera.prototype.getView = function()
{
  if (this.viewStale) this.recalculateView();
  return this.viewMatrix;
}

/**
 * Returns the projection matrix for this camera.
 */
Camera.prototype.getProjection = function()
{
  if (this.projectionStale) this.recalculateProjection();
  return this.projectionMatrix;
}

/**
 * Sets the aspect ratio.
 */
Camera.prototype.setAspectRatio = function(aspect)
{
  this.aspect = aspect;
  this.projectionStale = true;
}

/**
 * Gets the aspect ratio.
 */
Camera.prototype.getAspectRatio = function()
{
  return this.aspect;
}

/**
 * Sets the field of view.
 */
Camera.prototype.setFovy = function(degrees)
{
  this.fovy = degrees;
  this.projectionStale = true;
}

/**
 * Gets the field of view.
 */
Camera.prototype.getFovy = function()
{
  return this.fovy;
}

/**
 * Sets the near plane.
 */
Camera.prototype.setNearPlane = function(zNear)
{
  this.zNear = zNear;
  this.projectionStale = true;
}

/**
 * Gets the near plane.
 */
Camera.prototype.getNearPlane = function()
{
  return this.zNear;
}

/**
 * Sets the far plane.
 */
Camera.prototype.setFarPlane = function(zFar)
{
  this.zFar = zFar;
  this.projectionStale = true;
}

/**
 * Gets the far plane.
 */
Camera.prototype.getFarPlane = function()
{
  return this.zFar;
}


/**
 * Moves the camera along its negative z-axis by the given amount.
 */
Camera.prototype.moveForward = function(distance)
{
  // position += distance * (-back)
  for (var i = 0; i < 3; ++i)
  {
    this.position.elements[i] -= distance * this.back.elements[i];
  }
  this.viewStale = true;
}

/**
 * Moves the camera along its positive z-axis by the given amount.
 */
Camera.prototype.moveBack = function(distance)
{
  this.moveForward(-distance);
}

/**
 * Moves the camera along its positive x-axis by the given amount.
 */
Camera.prototype.moveRight = function(distance)
{
  // position += distance * (right)
  for (var i = 0; i < 3; ++i)
  {
    this.position.elements[i] += distance * this.right.elements[i];
  }
  this.viewStale = true;
}

/**
 * Moves the camera along its negative x-axis by the given amount.
 */
Camera.prototype.moveLeft = function(distance)
{
  this.moveRight(-distance);
}

/**
 * Moves the camera along its own up vector by the given amount.
 */
Camera.prototype.moveUp = function(distance)
{
  // position += distance * (up)
  for (var i = 0; i < 3; ++i)
  {
    this.position.elements[i] += distance * this.up.elements[i];
  }
  this.viewStale = true;
}

/**
 * Moves the camera opposite its up vector by the given amount.
 */
Camera.prototype.moveDown = function(distance)
{
  this.moveUp(-distance);
}

/**
 * Rotates the camera counterclockwise about an axis through its center 
 * that is parallel to the world y-axis.
 */
Camera.prototype.turnLeft = function(degrees)
{
  var r = new Matrix4().setRotate(degrees, 0, 1, 0);
  this.right = r.multiplyVector3(this.right);
  this.up = r.multiplyVector3(this.up);
  this.back = r.multiplyVector3(this.back);
  this.viewStale = true;
}

/**
 * Rotates the camera clockwise about an axis through its center 
 * that is parallel to the world y-axis.
 */
Camera.prototype.turnRight = function(degrees)
{
  this.turnLeft(-degrees);
}

/**
 * Rotates the camera counterclockwise about its x-axis.
 */
Camera.prototype.lookUp = function(degrees)
{
  var r = new Matrix4().setRotate(degrees, this.right.elements[0], this.right.elements[1], this.right.elements[2]);
  this.up = r.multiplyVector3(this.up);
  this.back = r.multiplyVector3(this.back);
  this.viewStale = true;
}

/**
 * Rotates the camera clockwise about its x-axis.
 */
Camera.prototype.lookDown = function(degrees)
{
  this.lookUp(-degrees);
}

/**
 * Moves the camera the given number of degrees along a great circle.
 * The axis of rotation is parallel to the camera's x-axis and intersects
 * the camera's negative z-axis the given distance in front of the camera.
 * (This operation is equivalent to a moveForward, lookDown
 * and then moveBack.
 */
Camera.prototype.orbitUp = function(degrees, distance)
{
  this.moveForward(distance);
  this.lookDown(degrees);
  this.moveBack(distance);
}

/**
 * Moves the camera the given number of degrees along a great circle.
 * The axis of rotation is parallel to the camera's x-axis and intersects
 * the camera's negative z-axis the given distance in front of the camera.
 * (This operation is equivalent to a moveForward, lookUp
 * and then moveBack.
 */
Camera.prototype.orbitDown = function(degrees, distance)
{
  this.orbitUp(-degrees, distance);
}


/**
 * Moves the camera the given number of degrees around a circle of latitude.
 * The axis of rotation is parallel to the world up vector and intersects the
 * camera's negative z-axis the given distance in front of the camera.
 * (This operation is equivalent to a moveForward, turnLeft, and moveBack.)
 */
Camera.prototype.orbitRight = function(degrees, distance)
{
  this.moveForward(distance);
  this.turnLeft(degrees);
  this.moveBack(distance);
}

/**
 * Moves the camera the given number of degrees around a circle of latitude.
 * The axis of rotation is parallel to the world up vector and intersects the
 * camera's negative z-axis the given distance in front of the camera.
 * (This operation is equivalent to a moveForward, turnRight, and moveBack.)
 */
Camera.prototype.orbitLeft = function(degrees, distance)
{
  this.orbitRight(-degrees, distance);
}

/**
 * Orients the camera at its current location to look at the given position.
 */
Camera.prototype.lookAt = function(x, y, z)
{
  var eyeX = this.position.elements[0];
  var eyeY = this.position.elements[1];
  var eyeZ = this.position.elements[2];
  var centerX = x;
  var centerY = y;
  var centerZ = z;
  var upX = 0;
  var upY = 1;
  var upZ = 0;
  
  // cut and paste code from Matrix4 setLookAt function
  
  var fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;

  fx = centerX - eyeX;
  fy = centerY - eyeY;
  fz = centerZ - eyeZ;

  // Normalize f.
  rlf = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
  fx *= rlf;
  fy *= rlf;
  fz *= rlf;

  // Calculate cross product of f and up.
  sx = fy * upZ - fz * upY;
  sy = fz * upX - fx * upZ;
  sz = fx * upY - fy * upX;

  // Normalize s.
  rls = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
  sx *= rls;
  sy *= rls;
  sz *= rls;

  // Calculate cross product of s and f.
  ux = sy * fz - sz * fy;
  uy = sz * fx - sx * fz;
  uz = sx * fy - sy * fx;

  // End cut and paste
  
  this.right = new Vector3([sx, sy, sz]);
  this.up = new Vector3([ux, uy, uz]);
  this.back = new Vector3([-fx, -fy, -fz]);
  this.viewStale = true;
}

/**
 * Sets this camera's position.
 */
Camera.prototype.setPosition = function(x, y, z)
{
  this.position = new Vector3([x, y, z]);
}

/**
 * Gets this camera's position.
 */
Camera.prototype.getPosition = function()
{
  return this.position;
}


/**
 * Recalculate the view matrix from the current position and axes.
 */
Camera.prototype.recalculateView = function()
{
  // adapted from Matrix4 setLookAt
  
  // right, up, and back become the *rows* of the matrix 
  // (the inverse is the transpose)
  var e = this.viewMatrix.elements;
  e[0] = this.right.elements[0];  // sx
  e[1] = this.up.elements[0];     // ux
  e[2] = this.back.elements[0];   // -fx;
  e[3] = 0;

  e[4] = this.right.elements[1];  // sy
  e[5] = this.up.elements[1];     // uy
  e[6] = this.back.elements[1];   // -fy;
  e[7] = 0;

  e[8] = this.right.elements[2];  // sz
  e[9] = this.up.elements[2];     // uz
  e[10] = this.back.elements[2];  // -fz;
  e[11] = 0;

  e[12] = 0;
  e[13] = 0;
  e[14] = 0;
  e[15] = 1;

  // Multiply on right by the inverse of the translation to camera position
  this.viewMatrix.translate(-this.position.elements[0], -this.position.elements[1],-this.position.elements[2]);
  this.viewStale = false;
}

/**
 * Recalculate the projection matrix from the current field of view and
 * aspect ratio.
 */
Camera.prototype.recalculateProjection = function()
{
  this.projectionMatrix = new Matrix4().setPerspective(this.fovy, this.aspect, this.zNear, this.zFar);
  this.projectionStale = false;
}

Camera.prototype.keyControl = function(ch)
{
  var e = this.position.elements; // returns Vector3
  var distance = Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);

  switch (ch)
  {
  // camera controls
  case 'w':
    this.moveForward(0.1);
    return true;
  case 'a':
    this.moveLeft(0.1);
    return true;
  case 's':
    this.moveBack(0.1);
    return true;
  case 'd':
    this.moveRight(0.1);
    return true;
  case 'r':
    this.moveUp(0.1);
    return true;
  case 'f':
    this.moveDown(0.1);
    return true;
  case 'j':
    this.turnLeft(5);
    return true;
  case 'l':
    this.turnRight(5);
    return true;
  case 'i':
    this.lookUp(5);
    return true;
  case 'k':
    this.lookDown(5);
    return true;
  case 'O':
    this.lookAt(0, 0, 0);
    return true;
  case 'o':
    this.setPosition(0, 0, 0);
    return true;
  case 'S':
    var fovy = this.getFovy();
    fovy = Math.min(80, fovy + 5);
    this.setFovy(fovy);
    return true;
  case 'W':
    var fovy = this.getFovy();
    fovy = Math.max(5, fovy - 5);
    this.setFovy(fovy);
    return true;

    // alternates for arrow keys
  case 'J':
    this.orbitLeft(5, distance)
    return true;
  case 'L':
    this.orbitRight(5, distance)  
    return true;
  case 'I':
    this.orbitUp(5, distance)      
    return true;
  case 'K':
    this.orbitDown(5, distance)  
    return true;
  }
  return false;
}
