// shader.js
//
// 셰이더 소스, 유틸 함수 (createShader / createProgram)

export const VERTEX_SHADER_SOURCE = `#version 300 es
layout (location = 0) in vec2 a_position;

void main() {
    // 교차점 표시할 때 포인트 크기
    gl_PointSize = 10.0;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

uniform vec4 u_color;
out vec4 outColor;

void main() {
    outColor = u_color;
}
`;

export function createShader(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function createProgram(gl, vertSrc, fragSrc) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }

  // 컴파일된 셰이더 객체 삭제 (링크 후 불필요)
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  return prog;
}
