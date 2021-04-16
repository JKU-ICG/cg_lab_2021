/**
 * Created by Samuel Gratzl on 08.02.2016.
 */

/**
 * the OpenGL context
 * @type {WebGLRenderingContext}
 */
var gl = null;

var root = null; // scenegraph root node  
var rotateLight, rotateLight2, rotateNode;

//Camera
var camera = null;
var cameraPos = vec3.create(); // used by the camera
var cameraCenter = vec3.create(); // used by the camera

//load the shader resources using a utility function
loadResources({
  vs: 'shader/phong.vs.glsl',
  fs: 'shader/phong.fs.glsl',
  vs_single: 'shader/single.vs.glsl',
  fs_single: 'shader/single.fs.glsl',
  model: 'models/C-3PO.obj'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  render(0);
});

function init(resources) {
  //create a GL context
  gl = createContext();

  //setup camera
  cameraStartPos = vec3.fromValues(0, 1, -20);
  camera = new UserControlledCamera(gl.canvas, cameraStartPos);
  camera.control.enabled = true;

  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);

  root = createSceneGraph(gl, resources);
}

function createSceneGraph(gl, resources) {
  //create scenegraph
  const root = new ShaderSGNode(createProgram(gl, resources.vs, resources.fs));

  function createLightSphere() {
    return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [
      new RenderSGNode(makeSphere(.2,10,10))
    ]);
  }

  {
    //TASK 3-6 create white light node at [0, 2, 2]
    let light = new LightNode();
    light.ambient = [.5, .5, .5, 1];
    light.diffuse = [1, 1, 1, 1];
    light.specular = [1, 1, 1, 1];
    light.position = [0, 2, 2];
    light.append(createLightSphere());
    //TASK 4-1 animated light using rotateLight transformation node
    rotateLight = new TransformationSGNode(mat4.create(), [
        light
    ]);
    root.append(rotateLight);
  }


  {
    //TASK 5-1 create red light node at [2, 0.2, 0]
    let light2 = new LightNode();
    light2.uniform = 'u_light2';
    light2.ambient = [0, 0, 0, 1];
    light2.diffuse = [1, 0, 0, 1];
    light2.specular = [1, 0, 0, 1];
    light2.position = [2, -0.5, 0];
    light2.append(createLightSphere());
    rotateLight2 = new TransformationSGNode(mat4.create(), [
        light2
    ]);
    root.append(rotateLight2);

    light2Animation = new Animation(rotateLight2, [
      { matrix: progress => mat4.rotateY(mat4.create(), mat4.translate(mat4.create(), mat4.create(), [0, 0, 0]), glm.deg2rad(-360 * progress)), duration: 3000 },
    ],
    true);
    light2Animation.start();
  }

  {
    //TASK 2-4 wrap with material node
    let c3po = new MaterialNode([
      new RenderSGNode(resources.model)
    ]);
    //gold
    c3po.ambient = [0.24725, 0.1995, 0.0745, 1];
    c3po.diffuse = [0.75164, 0.60648, 0.22648, 1];
    c3po.specular = [0.628281, 0.555802, 0.366065, 1];
    c3po.shininess = 50;

    rotateNode = new TransformationSGNode(mat4.create(), [
      new TransformationSGNode(glm.translate(0,-1.5, 0),  [
        c3po
      ])
    ]);
    root.append(rotateNode);
  }

  {
    //TASK 2-5 wrap with material node
    let floor = new MaterialNode([
      new RenderSGNode(makeRect(2, 2))
    ]);

    //dark
    floor.ambient = [0, 0, 0, 1];
    floor.diffuse = [0.1, 0.1, 0.1, 1];
    floor.specular = [0.5, 0.5, 0.5, 1];
    floor.shininess = 3;

    root.append(new TransformationSGNode(glm.transform({ translate: [0,-1.5,0], rotateX: -90, scale: 3}), [
      floor
    ]));
  }

  return root;
}


// time in last render step
var previousTime = 0;


function render(timeInMilliseconds) {
  checkForWindowResize(gl);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  //set background color to light gray
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0,1,-10], [0,0,0], [0,1,0]);

  var deltaTime = timeInMilliseconds - previousTime;
  previousTime = timeInMilliseconds;

  rotateNode.matrix = glm.rotateY(timeInMilliseconds*-0.01);

  //TASK 4-2 enable light rotation
  rotateLight.matrix = glm.rotateY(timeInMilliseconds*0.05);
  //TASK 5-2 enable light rotation
  light2Animation.update(deltaTime);

  // Move and apply camera
  camera.update(deltaTime);
  camera.render(context);

  root.render(context);

  //animate
  requestAnimationFrame(render);
}

/**
 * a material node contains the material properties for the underlying models
 * 
 * Please use the identical MaterialSGNode in your project (see framework.js)
 */
class MaterialNode extends SGNode {

  constructor(children) {
    super(children);
    this.ambient = [0.2, 0.2, 0.2, 1.0]; //r, g, b, alpha
    this.diffuse = [0.8, 0.8, 0.8, 1.0];
    this.specular = [0, 0, 0, 1];
    this.emission = [0, 0, 0, 1];
    this.shininess = 0.0;
    this.uniform = 'u_material';
  }

  setMaterialUniforms(context) {
    const gl = context.gl,
      shader = context.shader;

    //TASK 2-3 set uniforms
    //hint setting a structure element using the dot notation, e.g. u_material.test
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.ambient'), this.ambient);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.diffuse'), this.diffuse);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.specular'), this.specular);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.emission'), this.emission);
    gl.uniform1f(gl.getUniformLocation(shader, this.uniform+'.shininess'), this.shininess);
  }

  render(context) {
    this.setMaterialUniforms(context);

    //render children
    super.render(context);
  }
}

/**
 * a light node represents a light including light position and light properties (ambient, diffuse, specular)
 * the light position will be transformed according to the current model view matrix
 * 
 * Please use the identical LightSGNode in your project (see framework.js)
 */
class LightNode extends TransformationSGNode {

  constructor(position, children) {
    super(null, children);
    this.position = position || [0, 0, 0];
    this.ambient = [0, 0, 0, 1];
    this.diffuse = [1, 1, 1, 1];
    this.specular = [1, 1, 1, 1];
    //uniform name
    this.uniform = 'u_light';
  }

  /**
   * computes the absolute light position in world coordinates
   */
  computeLightPosition(context) {
    //transform with the current model view matrix
    const modelViewMatrix = mat4.multiply(mat4.create(), context.viewMatrix, context.sceneMatrix);
    const pos = [this.position[0], this.position[1],this.position[2], 1];
    return vec4.transformMat4(vec4.create(), pos, modelViewMatrix);
  }

  setLightUniforms(context) {
    const gl = context.gl,
      shader = context.shader,
      position = this.computeLightPosition(context);

    //TASK 3-5 set uniforms
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.ambient'), this.ambient);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.diffuse'), this.diffuse);
    gl.uniform4fv(gl.getUniformLocation(shader, this.uniform+'.specular'), this.specular);

    gl.uniform3f(gl.getUniformLocation(shader, this.uniform+'Pos'), position[0], position[1], position[2]);
  }

  render(context) {
    this.setLightUniforms(context);

    //since this a transformation node update the matrix according to my position
    this.matrix = glm.translate(this.position[0], this.position[1], this.position[2]);

    //render children
    super.render(context);
  }
}
