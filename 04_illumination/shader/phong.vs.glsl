/**
 * a phong shader implementation
 * Created by Samuel Gratzl on 29.02.2016.
 */
attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

//TASK 3-3 light position as uniform
//vec3 lightPos = vec3(0, -2, 2);
uniform vec3 u_lightPos;
//TASK 5-3 second light source
uniform vec3 u_light2Pos;

//output of this shader
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying vec3 v_light2Vec;

void main() {
	vec4 eyePosition = u_modelView * vec4(a_position,1);

  v_normalVec = u_normalMatrix * a_normal;

  v_eyeVec = -eyePosition.xyz;
	//TASK 3-4 light position as uniform
	v_lightVec = u_lightPos - eyePosition.xyz;
	//TASK 5-4 second light source position
	v_light2Vec = u_light2Pos - eyePosition.xyz;

	gl_Position = u_projection * eyePosition;
}
