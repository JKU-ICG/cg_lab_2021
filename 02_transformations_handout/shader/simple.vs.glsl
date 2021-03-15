/**
 * as simple vertex shader setting the position of a vertex
 * Original file created by Samuel Gratzl on 08.02.2016.
 */

// the position of the point
attribute vec3 a_position;

//the color of the point
attribute vec3 a_color;

varying vec3 v_color;

uniform mat4 u_modelView;
uniform mat4 u_projection;

//like a C program main is the main function
void main() {

  //TASK 1 and TASK 2-1

  gl_Position = u_projection * u_modelView
    * vec4(a_position, 1);

  //just copy the input color to the output varying color
  v_color = a_color;
}
