/**
 * Basic perspective camera built on CS336Object.  Defaults
 * to position (0, 0, 5).  In normal usage a camera is never
 * scaled or rolled, that is, the x-axis is always parallel to 
 * the world x-z plane.  This means that you normally don't ever 
 * directly call rotate operations on a camera; instead use
 * turnLeft, turnRight, lookUp, and lookDown.
 */
var Camera = function(fovy, aspect)
{
  CS336Object.call(this);
  
  this.setPosition(0, 0, 5);
  
  // projection matrix
  this.aspect = aspect || 1.0;
  this.fovy = fovy || 30.0;
  this.zNear = 0.1;
  this.zFar = 1000;

  // cached copies of view matrix and projection matrix
  // (this is just to avoid recalculation at every frame)
  
  // view matrix is always the inverse of camera's translation * rotation
  // (initial rotation is the identity, so this is easy to initialize)
  this.viewMatrix = new Matrix4().setTranslate(0, 0, -5);
  this.projectionMatrix = new Matrix4().setPerspective(this.fovy, this.aspect, this.zNear, this.zFar);

  // flag to indicate whether projection need recalculation
  this.projectionNeedsUpdate = false;
};

Camera.prototype = Object.create(CS336Object.prototype);

/**
 * Returns the view matrix for this camera.
 */
Camera.prototype.getView = function()
{ 
  if (this.matrixNeedsUpdate)
  {
    // we don't need the matrix, but this clears the needs update flag
    // and keeps everything consistent
    this.getMatrix();
    
    this.viewMatrix = new Matrix4(this.rotation);
    var e = this.rotation.elements;
    var v = this.viewMatrix.elements;
    v[1] = e[4];
    v[4] = e[1];
    v[2] = e[8];
    v[8] = e[2];
    v[6] = e[9];
    v[9] = e[6];
    var p = this.position.elements;
    this.viewMatrix.translate(-p[0], -p[1], -p[2]);
  }
  return this.viewMatrix;
};


/**
 * Returns the projection matrix for this camera.
 */
Camera.prototype.getProjection = function()
{
  this.projectionMatrix = new Matrix4().setPerspective(this.fovy, this.aspect, this.zNear, this.zFar);
  return this.projectionMatrix;
};

/**
 * Performs a counterclockwise rotation about this object's
 * x-axis.
 */
Camera.prototype.lookUp = function(degrees)
{
   this.rotateX(degrees); 
};

/**
 * Performs a clockwise rotation about this object's
 * x-axis.
 */
Camera.prototype.lookDown = function(degrees)
{
  this.lookUp(-degrees);
};

/**
 * Sets the aspect ratio.
 */
Camera.prototype.setAspectRatio = function(aspect)
{
  this.aspect = aspect;
  this.projectionNeedsUpdate = true;
};

/**
 * Gets the aspect ratio.
 */
Camera.prototype.getAspectRatio = function()
{
  return this.aspect;
};

/**
 * Sets the field of view.
 */
Camera.prototype.setFovy = function(degrees)
{
  this.fovy = degrees;
  this.projectionNeedsUpdate = true;
};

/**
 * Gets the field of view.
 */
Camera.prototype.getFovy = function()
{
  return this.fovy;
};

/**
 * Sets the near plane.
 */
Camera.prototype.setNearPlane = function(zNear)
{
  this.zNear = zNear;
  this.projectionNeedsUpdate = true;
};

/**
 * Gets the near plane.
 */
Camera.prototype.getNearPlane = function()
{
  return this.zNear;
};

/**
 * Sets the far plane.
 */
Camera.prototype.setFarPlane = function(zFar)
{
  this.zFar = zFar;
  this.projectionNeedsUpdate = true;
};

/**
 * Gets the far plane.
 */
Camera.prototype.getFarPlane = function()
{
  return this.zFar;
};

