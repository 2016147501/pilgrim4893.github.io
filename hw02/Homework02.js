import { resizeAspectRatio, setupText } from './util.js';
import { Shader, readShaderFile } from './shader.js';


// 전역 변수
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

let shader = null;  // 셰이더 프로그램 (Shader 클래스 이용)
let vao = null;     // 정사각형 그릴 때 쓸 VAO

// 정사각형 이동량 (dx, dy)
let dx = 0.0;
let dy = 0.0;

// Arrow Key 1회당 이동량
const STEP = 0.01;

// 사각형 반지름(0.1) → 중심은 ±0.9 범위로 clamp
const HALF_SIZE = 0.1;
const MIN_POS = -1.0 + HALF_SIZE; // -0.9
const MAX_POS =  1.0 - HALF_SIZE; //  0.9

// 1. WebGL 초기 설정
function initWebGL() {
  if (!gl) {
    console.error('WebGL 2를 지원하지 않는 브라우저입니다.');
    return false;
  }

  // 캔버스 기본 크기 600x600
  canvas.width = 600;
  canvas.height = 600;

  // 브라우저 창 크기 변경 시 항상 1:1 비율로 유지
  resizeAspectRatio(gl, canvas);

  // Viewport 설정
  gl.viewport(0, 0, canvas.width, canvas.height);

  // 배경색 (검정)
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  return true;
}

// 2. 셰이더 프로그램 초기화 (비동기)
async function initShader() {
  // 외부 파일에서 셰이더 소스 로드
  // shVert.glsl / shFrag.glsl
  const vertSrc = await readShaderFile('shVert.glsl');
  const fragSrc = await readShaderFile('shFrag.glsl');

  // Shader 객체 생성
  shader = new Shader(gl, vertSrc, fragSrc);
}

// 3. 정사각형(VAO) 설정 (TRIANGLE_FAN, 인덱스 없이)
function setupBuffers() {
  const vertices = new Float32Array([
    //   x,    y,    z,    r,   g,   b
     0.1, -0.1,  0.0,   1.0, 0.0, 0.0, // 오른쪽 아래 (빨강)
    -0.1, -0.1,  0.0,   1.0, 0.0, 0.0, // 왼쪽 아래   (빨강)
    -0.1,  0.1,  0.0,   1.0, 0.0, 0.0, // 왼쪽 위     (빨강)
     0.1,  0.1,  0.0,   1.0, 0.0, 0.0  // 오른쪽 위   (빨강)
  ]);

  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // Vertex Buffer
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // aPos attribute (location=0) → vec3
  shader.setAttribPointer(
    'aPos', 
    3, 
    gl.FLOAT, 
    false, 
    6 * Float32Array.BYTES_PER_ELEMENT, 
    0
  );

  // aColor attribute (location=1) → vec3
  shader.setAttribPointer(
    'aColor', 
    3, 
    gl.FLOAT, 
    false, 
    6 * Float32Array.BYTES_PER_ELEMENT, 
    3 * Float32Array.BYTES_PER_ELEMENT
  );
}

// 4. 그리기 (매 프레임마다 호출됨)
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  shader.use();

  // 정사각형 이동량을 uniform으로 전달
  shader.setFloat('dx', dx);
  shader.setFloat('dy', dy);

  // 정사각형 그리기
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  // 다음 프레임 예약
  requestAnimationFrame(render);
}

// 5. 키보드(화살표 키) 이벤트: dx, dy 갱신
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowUp':
      dy += STEP;
      if (dy > MAX_POS) dy = MAX_POS;
      break;
    case 'ArrowDown':
      dy -= STEP;
      if (dy < MIN_POS) dy = MIN_POS;
      break;
    case 'ArrowLeft':
      dx -= STEP;
      if (dx < MIN_POS) dx = MIN_POS;
      break;
    case 'ArrowRight':
      dx += STEP;
      if (dx > MAX_POS) dx = MAX_POS;
      break;
    default:
      break;
  }
});

// 6. main() 함수 (비동기) - 프로그램 전체 실행
async function main() {
  try {
    // (1) WebGL 초기화
    if (!initWebGL()) {
      throw new Error('WebGL 초기화 실패');
    }

    // (2) 셰이더 초기화
    await initShader();

    // (3) 버퍼/VAO 셋업
    setupBuffers();

    // (4) 안내 문구
    setupText(canvas, "Use arrow keys to move the rectangle", 1);

    // (5) 렌더링 시작
    render();

    return true;
  } catch (err) {
    console.error('Failed to initialize program:', err);
    alert('프로그램 초기화에 실패했습니다.');
    return false;
  }
}

// 7. main() 실행
main().then(success => {
  if (!success) {
    console.log('프로그램 종료');
  }
}).catch(err => {
  console.error('프로그램 실행 중 오류 발생:', err);
});
