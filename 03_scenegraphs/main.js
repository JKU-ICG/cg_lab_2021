/**
 * Created by Marc Streit on 01.04.2016.
 */

/**
 * the OpenGL context
 * @type {WebGLRenderingContext}
 */
var gl = null;
/**
 * our shader program
 * @type {WebGLProgram}
 */
var shaderProgram = null;

var canvasWidth = 800;
var canvasHeight = 800;
var aspectRatio = canvasWidth / canvasHeight;

//rendering context
var context;

//camera and projection settings
var animatedAngle = 0;
var fieldOfViewInRadians = convertDegreeToRadians(30);

var robotTransformationNode;
var headTransformationNode;

//links to buffer stored on the GPU
var quadVertexBuffer, quadColorBuffer;
var cubeVertexBuffer, cubeColorBuffer, cubeIndexBuffer;

var quadVertices = new Float32Array([
    -1.0, -1.0,
    1.0, -1.0,
    -1.0, 1.0,
    -1.0, 1.0,
    1.0, -1.0,
    1.0, 1.0]);

var quadColors = new Float32Array([
    1, 0, 0, 1,
    0, 1, 0, 1,
    0, 0, 1, 1,
    0, 0, 1, 1,
    0, 1, 0, 1,
    0, 0, 0, 1]);

var s = 0.3; //size of cube
var cubeVertices = new Float32Array([
   -s,-s,-s, s,-s,-s, s, s,-s, -s, s,-s,
   -s,-s, s, s,-s, s, s, s, s, -s, s, s,
   -s,-s,-s, -s, s,-s, -s, s, s, -s,-s, s,
   s,-s,-s, s, s,-s, s, s, s, s,-s, s,
   -s,-s,-s, -s,-s, s, s,-s, s, s,-s,-s,
   -s, s,-s, -s, s, s, s, s, s, s, s,-s,
]);

var cubeColors = new Float32Array([
   0,1,1, 0,1,1, 0,1,1, 0,1,1,
   1,0,1, 1,0,1, 1,0,1, 1,0,1,
   1,0,0, 1,0,0, 1,0,0, 1,0,0,
   0,0,1, 0,0,1, 0,0,1, 0,0,1,
   1,1,0, 1,1,0, 1,1,0, 1,1,0,
   0,1,0, 0,1,0, 0,1,0, 0,1,0
]);

var cubeIndices =  new Float32Array([
   0,1,2, 0,2,3,
   4,5,6, 4,6,7,
   8,9,10, 8,10,11,
   12,13,14, 12,14,15,
   16,17,18, 16,18,19,
   20,21,22, 20,22,23
]);

//load the shader resources using a utility function
loadResources({
  vs: 'shader/simple.vs.glsl',
  fs: 'shader/simple.fs.glsl',
  //TASK 5-3
  staticcolorvs: 'shader/static_color.vs.glsl'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  //render one frame
  render(0);
});

/**
 * initializes OpenGL context, compile shader, and load buffers
 */
function init(resources) {

  //create a GL context
  gl = createContext(canvasWidth, canvasHeight);

  //in WebGL / OpenGL3 we have to create and use our own shaders for the programmable pipeline
  //create the shader program
  shaderProgram = createProgram(gl, resources.vs, resources.fs);

  //set buffers for quad
  initQuadBuffer();
  //set buffers for cube
  initCubeBuffer();

  //create scenegraph
  rootNode = new SceneGraphNode();

  //TASK 3-1
  var quadTransformationMatrix = glm.rotateX(90);
  quadTransformationMatrix = mat4.multiply(mat4.create(), quadTransformationMatrix, glm.translate(0.0,-0.5,0));
  quadTransformationMatrix = mat4.multiply(mat4.create(), quadTransformationMatrix, glm.scale(0.5,0.5,1));

  //TASK 3-2
  var transformationNode = new TransformationSceneGraphNode(quadTransformationMatrix);
  rootNode.append(transformationNode);

  //TASK 5-4
  var staticColorShaderNode = new ShaderSceneGraphNode(createProgram(gl, resources.staticcolorvs, resources.fs));
  transformationNode.append(staticColorShaderNode);

  //TASK 2-2
  var quadNode = new QuadRenderNode();
  staticColorShaderNode.append(quadNode);

  createRobot(rootNode, resources);

  //TASK 4-2
  //var cubeNode = new CubeRenderNode();
  //rootNode.append(cubeNode);
}

function initQuadBuffer() {

  //create buffer for vertices
  quadVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBuffer);
  //copy data to GPU
  gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

  //same for the color
  quadColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadColors, gl.STATIC_DRAW);
}

function initCubeBuffer() {

  cubeVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

  cubeColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);

  cubeIndexBuffer = gl.createBuffer ();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
}

function createRobot(rootNode, resources) {

  //TASK 6-1

  //transformations of whole body
  var robotTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.rotateY(animatedAngle/2));
  robotTransformationMatrix = mat4.multiply(mat4.create(), robotTransformationMatrix, glm.translate(0.3,0.9,0));
  robotTransformationNode = new TransformationSceneGraphNode(robotTransformationMatrix);
  rootNode.append(robotTransformationNode);

  //body
  cubeNode = new CubeRenderNode();
  robotTransformationNode.append(cubeNode);

  //transformation of head
  var headTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.rotateY(animatedAngle));
  headTransformationMatrix = mat4.multiply(mat4.create(), headTransformationMatrix, glm.translate(0.0,0.4,0));
  headTransformationMatrix = mat4.multiply(mat4.create(), headTransformationMatrix, glm.scale(0.4,0.33,0.5));
  headTransformationNode = new TransformationSceneGraphNode(headTransformationMatrix);
  robotTransformationNode.append(headTransformationNode);

  //head
  var staticColorShaderNode = new ShaderSceneGraphNode(createProgram(gl, resources.staticcolorvs, resources.fs));
  cubeNode = new CubeRenderNode(1.0);
  staticColorShaderNode.append(cubeNode);
  headTransformationNode.append(staticColorShaderNode);

  //transformation of left leg
  var leftLegTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(0.16,-0.6,0));
  leftLegTransformationMatrix = mat4.multiply(mat4.create(), leftLegTransformationMatrix, glm.scale(0.2,1,1));
  var leftLegTransformationNode = new TransformationSceneGraphNode(leftLegTransformationMatrix);
  robotTransformationNode.append(leftLegTransformationNode);

  //left leg
  cubeNode = new CubeRenderNode();
  leftLegTransformationNode.append(cubeNode);

  //transformation of right leg
  var rightLegTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(-0.16,-0.6,0));
  rightLegTransformationMatrix = mat4.multiply(mat4.create(), rightLegTransformationMatrix, glm.scale(0.2,1,1));
  var rightLegtTransformationNode = new TransformationSceneGraphNode(rightLegTransformationMatrix);
  robotTransformationNode.append(rightLegtTransformationNode);

  //right leg
  cubeNode = new CubeRenderNode();
  rightLegtTransformationNode.append(cubeNode);
}

/**
 * render one frame
 */
function render(timeInMilliseconds) {

  //set background color to light gray
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //TASK 0-1
  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);

  //TASK 1-1
  gl.enable(gl.BLEND);
  //TASK 1-2
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  //activate this shader program
  gl.useProgram(shaderProgram);

  //TASK 6-2
  //update transformation of robot for rotation animation
  var robotTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.rotateY(animatedAngle/2));
  robotTransformationMatrix = mat4.multiply(mat4.create(), robotTransformationMatrix, glm.translate(0.3,0.9,0));
  robotTransformationNode.setMatrix(robotTransformationMatrix);

  var headTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.rotateY(animatedAngle));
  headTransformationMatrix = mat4.multiply(mat4.create(), headTransformationMatrix, glm.translate(0.0,0.4,0));
  headTransformationMatrix = mat4.multiply(mat4.create(), headTransformationMatrix, glm.scale(0.4,0.33,0.5));
  headTransformationNode.setMatrix(headTransformationMatrix);

  context = createSceneGraphContext(gl, shaderProgram);

  rootNode.render(context);

  //TASK 2-0 comment renderQuad & renderRobot out:
  // renderQuad(context.sceneMatrix, context.viewMatrix);
  // renderRobot(context.sceneMatrix, context.viewMatrix);

  //request another render call as soon as possible
  requestAnimationFrame(render);

  //animate based on elapsed time
  animatedAngle = timeInMilliseconds/10;
}

function renderCube() {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
}

function setUpModelViewMatrix(sceneMatrix, viewMatrix) {
  var modelViewMatrix = mat4.multiply(mat4.create(), viewMatrix, sceneMatrix);
  gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_modelView'), false, modelViewMatrix);
}

/**
 * returns a new rendering context
 * @param gl the gl context
 * @param shader the shader program
 * @returns {ISceneGraphContext}
 */
function createSceneGraphContext(gl, shader) {

  //create a default projection matrix
  projectionMatrix = mat4.perspective(mat4.create(), fieldOfViewInRadians, aspectRatio, 0.01, 10);
  gl.uniformMatrix4fv(gl.getUniformLocation(shader, 'u_projection'), false, projectionMatrix);

  return {
    gl: gl,
    sceneMatrix: mat4.create(),
    viewMatrix: calculateViewMatrix(),
    projectionMatrix: projectionMatrix,
    shader: shader
  };
}

function calculateViewMatrix() {
  //compute the camera's matrix
  var eye = [0,3,5];
  var center = [0,0,0];
  var up = [0,1,0];
  viewMatrix = mat4.lookAt(mat4.create(), eye, center, up);
  return viewMatrix;
}

/**
 * base node of the scenegraph
 */
class SceneGraphNode {

  constructor() {
    this.children = [];
  }

  /**
   * appends a new child to this node
   * @param child the child to append
   * @returns {SceneGraphNode} the child
   */
  append(child) {
    this.children.push(child);
    return child;
  }

  /**
   * removes a child from this node
   * @param child
   * @returns {boolean} whether the operation was successful
   */
  remove(child) {
    var i = this.children.indexOf(child);
    if (i >= 0) {
      this.children.splice(i, 1);
    }
    return i >= 0;
  };

  /**
   * render method to render this scengraph
   * @param context
   */
  render(context) {

    //render all children
    this.children.forEach(function (c) {
      return c.render(context);
    });
  };
}

/**
 * a quad node that renders floor plane
 */
class QuadRenderNode extends SceneGraphNode {

  render(context) {


    //TASK 2-1

    //setting the model view and projection for the shader
    setUpModelViewMatrix(context.sceneMatrix, context.viewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_projection'), false, context.projectionMatrix);


    var positionLocation = gl.getAttribLocation(context.shader, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    var colorLocation = gl.getAttribLocation(context.shader, 'a_color');
    gl.bindBuffer(gl.ARRAY_BUFFER, quadColorBuffer);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);

    //set alpha value for blending
    //TASK 1-3
    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_alpha'), 1);

    // draw the bound data as 6 vertices = 2 triangles starting at index 0
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    //render children
    super.render(context);
  }
}

//TASK 4-1
/**
 * a cube node that renders a cube at its local origin
 */
class CubeRenderNode extends SceneGraphNode {

  alpha;

  constructor(alpha=0.5) {
    super();
    this.alpha = alpha;
  }

  render(context) {

    //setting the model view and projection for the shader
    setUpModelViewMatrix(context.sceneMatrix, context.viewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_projection'), false, context.projectionMatrix);


    var positionLocation = gl.getAttribLocation(context.shader, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false,0,0) ;
    gl.enableVertexAttribArray(positionLocation);

    var colorLocation = gl.getAttribLocation(context.shader, 'a_color');
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false,0,0) ;
    gl.enableVertexAttribArray(colorLocation);

    //set alpha value for blending
    //TASK 1-3
    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_alpha'), this.alpha);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

    //render children
    super.render(context);
  }
}

//TASK 3-0
/**
 * a transformation node, i.e applied a transformation matrix to its successors
 */
class TransformationSceneGraphNode extends SceneGraphNode { //compare with TransformationSGNode in framework.js
  /**
   * the matrix to apply
   * @param matrix
   */
  constructor(matrix) {
    super();
    this.matrix = matrix || mat4.create();
  }

  render(context) {
    //backup previous one
    var previous = context.sceneMatrix;
    //set current world matrix by multiplying it
    if (previous === null) {
      context.sceneMatrix = mat4.clone(this.matrix);
    }
    else {
      context.sceneMatrix = mat4.multiply(mat4.create(), previous, this.matrix);
    }

    //render children
    super.render(context);
    //restore backup
    context.sceneMatrix = previous;
  }

  setMatrix(matrix) {
    this.matrix = matrix;
  }
}

/**
 * a shader node sets a specific shader for the successors
 */
class ShaderSceneGraphNode extends SceneGraphNode { //compare with ShaderSGNode in framework.js
  /**
   * constructs a new shader node with the given shader program
   * @param shader the shader program to use
   */
  constructor(shader) {
    super();
    this.shader = shader;
  }

  render(context) {
    //backup prevoius one
    var backup = context.shader;
    //set current shader
    context.shader = this.shader;
    //activate the shader
    context.gl.useProgram(this.shader);
    //render children
    super.render(context);
    //restore backup
    context.shader = backup;
    //activate the shader
    context.gl.useProgram(backup);
  }
};

function convertDegreeToRadians(degree) {
  return degree * Math.PI / 180
}
