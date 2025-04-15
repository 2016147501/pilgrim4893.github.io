#version 300 es
precision mediump float;

layout(location=0) in vec3 aPos;     // position
layout(location=1) in vec4 aColor;   // color
layout(location=2) in vec3 aNormal;  // normal
layout(location=3) in vec2 aTexCoord;

out vec4 vColor;  // 프래그먼트 셰이더로 넘길 색상

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

void main(void){
    gl_Position = u_projection * u_view * u_model * vec4(aPos, 1.0);
    vColor = aColor; // 조명 계산 안 할 경우, 그대로 전달
}
