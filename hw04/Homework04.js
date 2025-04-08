import { Shader } from './shader.js';
import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

// 전역 변수
let gl;
let shader;              // 사각형/축 그리기용 셰이더
let vaoSquare, vaoAxes;  // 정사각형/축용 VAO
let uModelMatrixLoc, uColorLoc;

let startTime = 0;

// 메인 함수
async function main() {
  const canvas = document.getElementById('webgl-canvas');
  gl = canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL2가 지원되지 않습니다!');
    return;
  }

  // 뷰포트와 배경 설정
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // 셰이더 소스: 버텍스 / 프래그먼트
  const vertexSource = `#version 300 es
  layout(location = 0) in vec3 aPosition;
  uniform mat4 uModelMatrix;
  void main() {
      // 클립 공간으로 변환
      gl_Position = uModelMatrix * vec4(aPosition, 1.0);
  }`;

  const fragmentSource = `#version 300 es
  precision mediump float;
  uniform vec4 uColor;
  out vec4 fragColor;
  void main() {
      fragColor = uColor;
  }`;

  // 셰이더 초기화
  shader = new Shader(gl, vertexSource, fragmentSource);
  shader.use();

  // uniform 위치 얻기
  uModelMatrixLoc = gl.getUniformLocation(shader.program, 'uModelMatrix');
  uColorLoc       = gl.getUniformLocation(shader.program, 'uColor');

  // 정사각형(Edge=1.0) VAO 생성
  vaoSquare = createSquareVAO();

  // x축, y축 그리기용 VAO 생성
  vaoAxes = createAxesVAO();

  startTime = performance.now();
  requestAnimationFrame(render);
}

// 정사각형(Edge length = 1.0) VAO: 실제 좌표 -0.5 ~ +0.5
function createSquareVAO() {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vertices = new Float32Array([
    -0.5, -0.5, 0.0,
     0.5, -0.5, 0.0,
    -0.5,  0.5, 0.0,
    -0.5,  0.5, 0.0,
     0.5, -0.5, 0.0,
     0.5,  0.5, 0.0,
  ]);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  gl.bindVertexArray(null);
  return vao;
}

// 축(axes) VAO 생성: x축(-1~+1), y축(-1~+1)
function createAxesVAO() {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // 아래는 (x축 2점, y축 2점) 총 4개의 vertex
  // X축: (-1,0,0) -> (1,0,0), Y축: (0,-1,0) -> (0,1,0)
  const axisVertices = new Float32Array([
    // x-axis
    -1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
    // y-axis
     0.0, -1.0,  0.0,
     0.0,  1.0,  0.0
  ]);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, axisVertices, gl.STATIC_DRAW);

  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  gl.bindVertexArray(null);
  return vao;
}

// 매 프레임마다 호출
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  const currentTime = performance.now();
  const elapsedSec = (currentTime - startTime) * 0.001;

  shader.use();

  // ---------------------------------------------
  // 1) x축(빨간색), y축(초록색) 그리기
  {
    const identity = mat4.create(); // 단위행렬

    // VAO 바인딩
    gl.bindVertexArray(vaoAxes);

    // x축 (-1~+1)
    gl.uniformMatrix4fv(uModelMatrixLoc, false, identity);
    gl.uniform4fv(uColorLoc, [1.0, 0.0, 0.0, 1.0]); // Red
    gl.drawArrays(gl.LINES, 0, 2); // 앞의 2개 정점이 x축

    // y축 (-1~+1)
    gl.uniformMatrix4fv(uModelMatrixLoc, false, identity);
    gl.uniform4fv(uColorLoc, [0.0, 1.0, 0.0, 1.0]); // Green
    gl.drawArrays(gl.LINES, 2, 2); // 뒤의 2개 정점이 y축

    gl.bindVertexArray(null);
  }

  // ---------------------------------------------
  // 2) Sun: 원점(0,0), Edge=0.2, 자전 45deg/sec, 빨간색
  {
    const modelMatrix = mat4.create();

    // scale 0.2
    mat4.scale(modelMatrix, modelMatrix, [0.2, 0.2, 1.0]);
    // 자전
    const sunSpinDeg = 45.0 * elapsedSec;
    mat4.rotateZ(modelMatrix, modelMatrix, degToRad(sunSpinDeg));

    gl.uniformMatrix4fv(uModelMatrixLoc, false, modelMatrix);
    gl.uniform4fv(uColorLoc, [1.0, 0.0, 0.0, 1.0]); // Red

    gl.bindVertexArray(vaoSquare);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  // ---------------------------------------------
  // 3) Earth: Edge=0.1, 자전 180deg/sec, 공전(반지름 0.7) 30deg/sec, 청록색
  {
    const modelMatrix = mat4.create();

    // 공전
    const earthOrbitDeg = 30.0 * elapsedSec;
    mat4.rotateZ(modelMatrix, modelMatrix, degToRad(earthOrbitDeg));
    mat4.translate(modelMatrix, modelMatrix, [0.7, 0.0, 0.0]);

    // 자전
    const earthSpinDeg = 180.0 * elapsedSec;
    mat4.rotateZ(modelMatrix, modelMatrix, degToRad(earthSpinDeg));

    // 크기
    mat4.scale(modelMatrix, modelMatrix, [0.1, 0.1, 1.0]);

    gl.uniformMatrix4fv(uModelMatrixLoc, false, modelMatrix);
    gl.uniform4fv(uColorLoc, [0.0, 1.0, 1.0, 1.0]); // Cyan

    gl.bindVertexArray(vaoSquare);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  // ---------------------------------------------
  // 4) Moon: Edge=0.05, 자전 180deg/sec, Earth 중심 반지름 0.2, 공전 360deg/sec, 노란색
  {
    const modelMatrix = mat4.create();

    // Earth 주위 공전(30 deg/sec)
    const earthOrbitDeg = 30.0 * elapsedSec;
    mat4.rotateZ(modelMatrix, modelMatrix, degToRad(earthOrbitDeg));
    mat4.translate(modelMatrix, modelMatrix, [0.7, 0.0, 0.0]);

    // Moon 공전(360 deg/sec)
    const moonOrbitDeg = 360.0 * elapsedSec;
    mat4.rotateZ(modelMatrix, modelMatrix, degToRad(moonOrbitDeg));
    mat4.translate(modelMatrix, modelMatrix, [0.2, 0.0, 0.0]);

    // Moon 자전(180 deg/sec)
    const moonSpinDeg = 180.0 * elapsedSec;
    mat4.rotateZ(modelMatrix, modelMatrix, degToRad(moonSpinDeg));

    // 크기 0.05
    mat4.scale(modelMatrix, modelMatrix, [0.05, 0.05, 1.0]);

    gl.uniformMatrix4fv(uModelMatrixLoc, false, modelMatrix);
    gl.uniform4fv(uColorLoc, [1.0, 1.0, 0.0, 1.0]); // Yellow

    gl.bindVertexArray(vaoSquare);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  requestAnimationFrame(render);
}

// 각도(deg) -> 라디안(rad)
function degToRad(deg) {
  return (Math.PI / 180) * deg;
}

window.addEventListener('load', main);
