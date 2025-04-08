#version 300 es
layout(location = 0) in vec3 aPosition;

uniform mat4 uModelMatrix;

void main() {
    // 모델 변환 행렬 적용 후 clip space로 변환
    gl_Position = uModelMatrix * vec4(aPosition, 1.0);
}
