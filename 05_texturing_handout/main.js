/**
 * Created by Clemens Birklbauer on 22.02.2016.
 */
'use strict';

/**
 * the OpenGL context
 * @type {WebGLRenderingContext}
 */
var gl = null;


//scene graph nodes
var root = null;
var rootnofloor = null;
var rotateLight;
var rotateNode;

//textures
var renderTargetColorTexture;
var renderTargetDepthTexture;
var floorTexture;

//framebuffer variables
var renderTargetFramebuffer;
var framebufferWidth = 512;
var framebufferHeight = 512;

//Camera
var camera = null;
var cameraPos = vec3.create(); // used by the camera
var cameraCenter = vec3.create(); // used by the camera

// time in last render step
var previousTime = 0;


//load the required resources using a utility function
loadResources({
  vs: 'shader/texture.vs.glsl',
  fs: 'shader/texture.fs.glsl',
  vs_single: 'shader/single.vs.glsl',
  fs_single: 'shader/single.fs.glsl',
  floortexture: 'models/lava.jpg',
  model: 'models/C-3PO.obj'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  render(0);
});

function init(resources) {
  //create a GL context
  gl = createContext();

  //setup camera
  const cameraStartPos = vec3.fromValues(0, 1, -15);
  camera = new UserControlledCamera(gl.canvas, cameraStartPos);
  camera.control.enabled = true;

  //init textures
  initTextures(resources);
  //TASK 5: call init function for framebuffer
  //initRenderToTexture();

  gl.enable(gl.DEPTH_TEST);

  //create scenegraph
  root = createSceneGraph(gl, resources);

  //create scenegraph without floor and simple shader
  rootnofloor = new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single));
  rootnofloor.append(rotateNode); //reuse model part
}

function createSceneGraph(gl, resources) {
  //create scenegraph
  const root = new ShaderSGNode(createProgram(gl, resources.vs, resources.fs));

  //light debug helper function
  function createLightSphere() {
    return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [
      new RenderSGNode(makeSphere(.2, 10, 10))
    ]);
  }

  {
    //initialize light
    let light = new LightSGNode(); //use now framework implementation of light node
    light.ambient = [0.2, 0.2, 0.2, 1];
    light.diffuse = [0.8, 0.8, 0.8, 1];
    light.specular = [1, 1, 1, 1];
    light.position = [0, 0, 0];

    rotateLight = new TransformationSGNode(mat4.create());
    let translateLight = new TransformationSGNode(glm.translate(0, 2, 2)); //translating the light is the same as setting the light position

    rotateLight.append(translateLight);
    translateLight.append(light);
    translateLight.append(createLightSphere()); //add sphere for debugging: since we use 0,0,0 as our light position the sphere is at the same position as the light source
    root.append(rotateLight);
  }

  {
    //initialize C3PO
    let c3po = new MaterialSGNode([ //use now framework implementation of material node
      new RenderSGNode(resources.model)
    ]);
    //gold
    c3po.ambient = [0.24725, 0.1995, 0.0745, 1];
    c3po.diffuse = [0.75164, 0.60648, 0.22648, 1];
    c3po.specular = [0.628281, 0.555802, 0.366065, 1];
    c3po.shininess = 0.4;

    rotateNode = new TransformationSGNode(mat4.create(), [
      new TransformationSGNode(glm.translate(0, -1.5, 0), [
        c3po
      ])
    ]);
    root.append(rotateNode);
  }

  {
    //TASK 5: switch to color texture of framebuffer
    //TASK 1: apply TextureSGNode to floor (similar to MaterialSGNode)

    //initialize floor
    let floor = new MaterialSGNode(
      new RenderSGNode(makeFloor())
    );

    //dark
    floor.ambient = [0, 0, 0, 1];
    floor.diffuse = [0.1, 0.1, 0.1, 1];
    floor.specular = [0.5, 0.5, 0.5, 1];
    floor.shininess = 50.0;

    root.append(new TransformationSGNode(glm.transform({ translate: [0, -1.5, 0], rotateX: -90, scale: 3 }), [
      floor
    ]));
  }

  return root;
}

function initTextures(resources) {
  //create texture object
  floorTexture = gl.createTexture();
  //select a texture unit
  gl.activeTexture(gl.TEXTURE0);
  //bind texture to active texture unit
  gl.bindTexture(gl.TEXTURE_2D, floorTexture);
  //set sampling parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  //TASK 4: change texture sampling behaviour
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  //upload texture data
  gl.texImage2D(gl.TEXTURE_2D, //texture unit target == texture type
    0, //level of detail level (default 0)
    gl.RGBA, //internal format of the data in memory
    gl.RGBA, //image format (should match internal format)
    gl.UNSIGNED_BYTE, //image data type
    resources.floortexture); //actual image data
  //clean up/unbind texture
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function initRenderToTexture() {
  //check if depth texture extension is supported
  var depthTextureExt = gl.getExtension("WEBGL_depth_texture");
  if (!depthTextureExt) { alert('No depth texture support!!!'); return; }

  //general setup
  gl.activeTexture(gl.TEXTURE0);

  //create framebuffer
  renderTargetFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, renderTargetFramebuffer);

  //TASK 5: Setup color and depth texture and bind them to the framebuffer
  //create color texture (see initTextures, but use extended version of texImage2D explained in slides)
  //variable name: renderTargetColorTexture; format: gl.RGBA; image data type: gl.UNSIGNED_BYTE
  /*gl.texImage2D(
    ?, //texture unit target == texture type
    ?, //level of detail level (default 0)
    ?, //internal format of the data in memory
    ?, //texture width
    ?, //texture height
    ?, //border (enable (1) or disable (0) setting a border color for clamping)
    ?, //image format (should match internal format)
    ?, //image data type
    ?); //actual image data (null if texture should be empty)*/

  //create depth texture
  //variable name: renderTargetDepthTexture; format: gl.DEPTH_COMPONENT; image data type: gl.UNSIGNED_SHORT

  //attach textures to framebuffer

  //check if framebuffer was created successfully
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) { alert('Framebuffer incomplete!'); }

  //clean up
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function makeFloor() {
  var floor = makeRect(2, 2);
  //TASK 3: adapt texture coordinates
  floor.texture = [0, 0, 1, 0, 1, 1, 0, 1];
  return floor;
}

function renderToTexture(timeInMilliseconds) {
  //TASK 5: Render C3PO to framebuffer/texture
  //bind framebuffer (to draw scene into texture)

  //setup viewport

  //setup context and camera matrices

  //render scenegraph

  //disable framebuffer (to render to screen again)

}

function render(timeInMilliseconds) {
  checkForWindowResize(gl);

  //render different scene to texture
  renderToTexture(timeInMilliseconds);

  //setup viewport
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //setup context and camera matrices
  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0, 1, -10], [0, 0, 0], [0, 1, 0]);

  const deltaTime = timeInMilliseconds - previousTime;
  previousTime = timeInMilliseconds;

  //update animations
  rotateNode.matrix = glm.rotateY(timeInMilliseconds * -0.01);
  rotateLight.matrix = glm.rotateY(timeInMilliseconds * 0.05);

  // Move and apply camera
  camera.update(deltaTime);
  camera.render(context);

  //render scenegraph
  root.render(context);

  //animate
  requestAnimationFrame(render);
}

//a scene graph node for setting texture parameters
class TextureSGNode extends SGNode {
  constructor(texture, textureunit, children) {
    super(children);
    this.texture = texture;
    this.textureunit = textureunit;
  }

  render(context) {
    //tell shader to use our texture; alternatively we could use two phong shaders: one with and one without texturing support
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_enableObjectTexture'), 1);

    //set shader parameters
    //TASK 1: set texture unit to sampler in shader

    //activate/select texture unit and bind texture
    //TASK 1: activate/select texture unit and bind texture

    //render children
    super.render(context);

    //clean up
    //TASK 1: activate/select texture unit and bind null

    //disable texturing in shader
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_enableObjectTexture'), 0);
  }
}
