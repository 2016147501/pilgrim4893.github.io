import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
// 사각뿔 로드 (Homework05 폴더 내 squarePyramid.js)
import { SquarePyramid } from './squarePyramid.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

let shader;
let startTime;
let lastFrameTime;
let isInitialized = false;

// 행렬들
let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create(); // 사각뿔에 적용할 모델 변환 (회전 없음 → 항등행렬)

// 카메라 이동 관련
const cameraCircleRadius = 3.0;     // x,z에서 원운동 반지름
const cameraCircleSpeed = 90.0;     // x,z 회전 속도(도/초)
const cameraHeightSpeed = 45.0;     // y 높이 변동 속도(도/초)

// 도형들
let pyramid;  // 사각뿔
let axes;     // 좌표축

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    main().then(success => {
        if (!success) {
            console.log('프로그램 초기화 실패');
            return;
        }
        isInitialized = true;
    }).catch(err => {
        console.error('프로그램 오류:', err);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2를 지원하지 않는 브라우저입니다.');
        return false;
    }

    // (1) 캔버스 크기 700×700
    canvas.width = 700;
    canvas.height = 700;

    // 화면 비율 맞추기
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // 배경색
    gl.clearColor(0.7, 0.8, 0.9, 1.0);
    return true;
}

async function initShader() {
    // 셰이더 파일 비동기 로드
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000.0; // 초 단위
    const elapsedTime = (currentTime - startTime) / 1000.0;
    lastFrameTime = currentTime;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // (6) 사각뿔 고정 (회전 없음 → modelMatrix를 매 프레임 항등행렬로 세팅)
    mat4.identity(modelMatrix);

    // (4) 카메라 위치 계산
    // x,z: 3 반지름 원, 속도 = 90deg/sec
    let angle = cameraCircleSpeed * elapsedTime; // 단위: 도
    let rad = glMatrix.toRadian(angle);
    let camX = cameraCircleRadius * Math.sin(rad);
    let camZ = cameraCircleRadius * Math.cos(rad);

    // y: 0 ~ 10 반복 (sin을 이용), 속도 = 45deg/sec
    let angleY = cameraHeightSpeed * elapsedTime; // 단위: 도
    let radY = glMatrix.toRadian(angleY);
    // sin(radY)는 -1~+1, 이를 0~10 범위로 맞추기 → (sin+1)*5
    let camY = (Math.sin(radY) + 1.0) * 5.0;

    // 뷰 행렬
    mat4.lookAt(
        viewMatrix,
        vec3.fromValues(camX, camY, camZ), // 카메라 위치
        vec3.fromValues(0, 0, 0),          // 원점(사각뿔 중심)을 바라봄
        vec3.fromValues(0, 1, 0)           // 상방 벡터
    );

    // 셰이더 세팅
    shader.use();
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);

    // 사각뿔 그리기
    pyramid.draw(shader);

    // 좌표축 그리기 (축 길이를 보기 좋게 1.8 등으로)
    axes.draw(viewMatrix, projMatrix);

    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }
        await initShader();

        // 투영 행렬 설정 (원근 투영)
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),             // 시야각 60도
            canvas.width / canvas.height,      // 종횡비
            0.1,                               // near
            100.0                              // far
        );

        // 사각뿔 및 좌표축 생성
        pyramid = new SquarePyramid(gl);
        axes = new Axes(gl, 1.8);

        // 시작 시간 기록
        startTime = lastFrameTime = Date.now();

        // 렌더링 시작
        requestAnimationFrame(render);
        return true;
    } catch (err) {
        console.error(err);
        alert('초기화 중 오류 발생');
        return false;
    }
}
