// TASK 1
//  vertex shader:
/**
  vec3 translation = vec3(0, -0.5, 0); 

  gl_Position = u_projection * u_modelView
    * vec4(a_position + translation, 1);
 */


// TASK 2
//   2-1 vertex shader:
//     remove previous translation

//   2-2 main.js > renderQuad
sceneMatrix = matrixMultiply(sceneMatrix, makeTranslationMatrix(0, -0.5, 0));


// TASK 3
sceneMatrix = matrixMultiply(sceneMatrix, makeScaleMatrix(0.5, 0.5, 1));

// TASK 4
sceneMatrix = matrixMultiply(sceneMatrix, makeXRotationMatrix(convertDegreeToRadians(45)));

// TASK 5
viewMatrix = lookAt(0,3,5,  //eye
                    0,0,0,  // origin
                    0,1,0); // up

// TASK 6
projectionMatrix = makeOrthographicProjectionMatrix(-0.5, 0.5, -0.5, 0.5, 0, 10);

// TASK 7
projectionMatrix = makePerspectiveProjectionMatrix(fieldOfViewInRadians, canvasWidth/canvasHeight, 1, 10);

// TASK 8
//  8-1 main.js > init
      initCubeBuffer();
//  8-2 main.js > render
      renderRobot(sceneMatrix, viewMatrix);
//  8-3 main.js > renderRobot
      renderCube();


// TASK 9
sceneMatrix = matrixMultiply(sceneMatrix, makeYRotationMatrix(convertDegreeToRadians(animatedAngle)));

// TASK 10
// see solution