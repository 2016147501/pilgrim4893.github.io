#version 300 es

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aColor;

out vec3 vColor;

// 이동량 (dx, dy)를 uniform으로 받아서 정점 위치를 이동
uniform float dx;
uniform float dy;

void main() {
    gl_Position = vec4(aPos.x + dx, aPos.y + dy, aPos.z, 1.0);
    vColor = aColor;
}