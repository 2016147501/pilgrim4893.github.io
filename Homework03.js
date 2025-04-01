import { 
    VERTEX_SHADER_SOURCE,
    FRAGMENT_SHADER_SOURCE,
    createProgram,
  } from './shader.js';
  
  // =========== 전역 ===========
  const glCanvas = document.getElementById('glCanvas');
  const overlayCanvas = document.getElementById('overlayCanvas');
  const gl = glCanvas.getContext('webgl2');
  
  let program;
  let vao;
  
  // 버퍼
  let tempBuffer; 
  let circleBuffer;
  let lineBuffer;
  let intersectionBuffer;
  let axesBuffer;    // 축 그리기용
  
  // 원
  let circleCenter = null;
  let circleRadius = 0;
  let circleFinalized = false;
  let circleVertices = [];
  
  // 선분
  let isDrawingLine = false;
  let linePoints = [];  // [x1, y1, x2, y2]
  
  // 교차점
  let intersectionPoints = [];
  
  // 화면에 표시할 정보 문자열
  let circleInfo = "";
  let lineInfo = "";
  let intersectionInfo = "";
  
  // 초기화
  function initWebGL() {
    if (!gl) {
      alert("WebGL2 not supported");
      throw new Error("WebGL2 not supported");
    }
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
  }
  
  function initProgram() {
    program = createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
    if (!program) throw new Error("Failed to create shader program");
  }
  
  function initBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
  
    tempBuffer = gl.createBuffer();
    circleBuffer = gl.createBuffer();
    lineBuffer = gl.createBuffer();
    intersectionBuffer = gl.createBuffer();
    axesBuffer = gl.createBuffer();
  
    gl.bindVertexArray(null);
  }
  
  function main() {
    initWebGL();
    initProgram();
    initBuffers();
    setupAxesData();
  
    setupMouseEvents();
  
    circleInfo = "Drag mouse to draw circle...";
    lineInfo = "";
    intersectionInfo = "";
  
    render();
  }
  
  // 축 데이터: 중심에서 ±300 px => NDC로 ±(300/350)=±0.857
  const axisLen = 300;
  const canvasHalf = 350;
  const ndcVal = axisLen / canvasHalf; // 약 0.857
  
  function setupAxesData() {
    // x축 (2점) + y축 (2점) 합쳐서 4점
    const arr = new Float32Array([
      -ndcVal, 0,   ndcVal, 0, 
      0, -ndcVal,   0, ndcVal
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, axesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
  }
  
  // 마우스 입력
  function setupMouseEvents() {
    glCanvas.addEventListener("mousedown", onMouseDown);
    glCanvas.addEventListener("mousemove", onMouseMove);
    glCanvas.addEventListener("mouseup", onMouseUp);
  }
  
  function getCanvasPos(evt) {
    const rect = glCanvas.getBoundingClientRect();
    return [ evt.clientX - rect.left, evt.clientY - rect.top ];
  }
  
  function toGL(x, y) {
    return [
      (x / glCanvas.width)*2 - 1,
      -((y / glCanvas.height)*2 - 1)
    ];
  }
  
  function onMouseDown(e) {
    e.preventDefault(); e.stopPropagation();
    const [px, py] = getCanvasPos(e);
    const glPos = toGL(px, py);
  
    if (!circleFinalized) {
      // 원 드래그 시작
      circleCenter = glPos;
      circleRadius = 0;
    } else if (linePoints.length === 0) {
      // 선분 드래그 시작
      linePoints = [glPos[0], glPos[1], 0, 0];
      isDrawingLine = true;
    }
    render();
  }
  
  function onMouseMove(e) {
    const [px, py] = getCanvasPos(e);
    const glPos = toGL(px, py);
  
    // 원 드래그 중
    if (!circleFinalized && circleCenter) {
      const dx = glPos[0] - circleCenter[0];
      const dy = glPos[1] - circleCenter[1];
      circleRadius = Math.sqrt(dx*dx + dy*dy);
      render();
    }
    // 선분 드래그 중
    else if (isDrawingLine && linePoints.length===4) {
      linePoints[2] = glPos[0];
      linePoints[3] = glPos[1];
      render();
    }
  }
  
  function onMouseUp(e) {
    const [px, py] = getCanvasPos(e);
    const glPos = toGL(px, py);
  
    // 원 확정
    if (!circleFinalized && circleCenter) {
      circleFinalized = true;
      buildCircleVertices();
      circleInfo = `Circle: center (${circleCenter[0].toFixed(2)},${circleCenter[1].toFixed(2)}) radius = ${circleRadius.toFixed(2)}`;
    }
    // 선분 확정
    else if (isDrawingLine && linePoints.length===4) {
      isDrawingLine = false;
      linePoints[2] = glPos[0];
      linePoints[3] = glPos[1];
      lineInfo = `Line segment: (${linePoints[0].toFixed(2)},${linePoints[1].toFixed(2)}) ~ (${linePoints[2].toFixed(2)},${linePoints[3].toFixed(2)})`;
  
      computeIntersection();
    }
    render();
  }
  
  // 원 정점
  function buildCircleVertices() {
    const seg = 60;
    circleVertices = [];
    for (let i=0; i<seg; i++){
      const theta = (2*Math.PI*i)/seg;
      const x = circleCenter[0] + circleRadius*Math.cos(theta);
      const y = circleCenter[1] + circleRadius*Math.sin(theta);
      circleVertices.push(x, y);
    }
  }
  
  // 교차점 계산 (한 줄로 출력)
  function computeIntersection() {
    intersectionPoints = [];
    intersectionInfo = "";
  
    const [cx, cy] = circleCenter;
    const r = circleRadius;
    const [x1,y1, x2,y2] = linePoints;
    const dx = x2 - x1;
    const dy = y2 - y1;
  
    const A = dx*dx + dy*dy;
    const B = 2*(dx*(x1-cx) + dy*(y1-cy));
    const C = (x1-cx)*(x1-cx) + (y1-cy)*(y1-cy) - r*r;
    const D = B*B - 4*A*C;
  
    if (D < 0) {
      intersectionInfo = "No intersection";
      return;
    }
  
    const sqrtD = Math.sqrt(D);
    const t1 = (-B + sqrtD)/(2*A);
    const t2 = (-B - sqrtD)/(2*A);
  
    let validTs = [];
    if (t1>=0 && t1<=1) validTs.push(t1);
    if (t2>=0 && t2<=1 && Math.abs(t1 - t2)>1e-9) validTs.push(t2);
  
    for (let t of validTs){
      const ix = x1 + dx*t;
      const iy = y1 + dy*t;
      intersectionPoints.push(ix, iy);
    }
  
    if (intersectionPoints.length === 0) {
      intersectionInfo = "No intersection";
    }
    else if (intersectionPoints.length === 2) {
      // 1개 교차점 => 2 floats
      intersectionInfo = `Intersection Points: 1 Point 1: (${intersectionPoints[0].toFixed(2)},${intersectionPoints[1].toFixed(2)})`;
    }
    else if (intersectionPoints.length === 4) {
      // 2개 교차점 => 4 floats
      const x1_ = intersectionPoints[0].toFixed(2);
      const y1_ = intersectionPoints[1].toFixed(2);
      const x2_ = intersectionPoints[2].toFixed(2);
      const y2_ = intersectionPoints[3].toFixed(2);
   
      intersectionInfo = `Intersection Points: 2 Point 1: (${x1_},${y1_}) Point 2: (${x2_},${y2_})`;
    }
  }
  
  // 렌더
  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
  
    const aPosLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPosLoc);
    const uColorLoc = gl.getUniformLocation(program, "u_color");
  
    // 1) 축 그리기 (x=빨강, y=초록)
    gl.bindBuffer(gl.ARRAY_BUFFER, axesBuffer);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);
  
    // x축 2점 => 빨강
    gl.uniform4f(uColorLoc, 1.0, 0.0, 0.0, 1.0);
    gl.drawArrays(gl.LINES, 0, 2);
  
    // y축 2점 => 초록
    gl.uniform4f(uColorLoc, 0.0, 1.0, 0.0, 1.0);
    gl.drawArrays(gl.LINES, 2, 2);
  
    // 2) 임시 원(드래그 중, 회색)
    if (!circleFinalized && circleCenter) {
      const tempVerts = buildTempCircle(circleCenter, circleRadius, 60);
      gl.bindBuffer(gl.ARRAY_BUFFER, tempBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tempVerts), gl.STATIC_DRAW);
      gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);
  
      gl.uniform4f(uColorLoc, 0.5, 0.5, 0.5, 1.0);
      gl.drawArrays(gl.LINE_LOOP, 0, tempVerts.length/2);
    }
  
    // 3) 확정된 원(보라색)
    if (circleFinalized && circleVertices.length>0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);
      gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);
  
      // 보라색 => (1.0, 0.0, 1.0, 1.0)
      gl.uniform4f(uColorLoc, 1.0, 0.0, 1.0, 1.0);
      gl.drawArrays(gl.LINE_LOOP, 0, circleVertices.length/2);
    }
  
    // 4) 임시 선(드래그 중, 회색)
    if (isDrawingLine && linePoints.length===4) {
      gl.bindBuffer(gl.ARRAY_BUFFER, tempBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(linePoints), gl.STATIC_DRAW);
      gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);
  
      gl.uniform4f(uColorLoc, 0.5, 0.5, 0.5, 1.0);
      gl.drawArrays(gl.LINES, 0, 2);
    }
  
    // 5) 확정된 선(회색)
    if (!isDrawingLine && linePoints.length===4) {
      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(linePoints), gl.STATIC_DRAW);
      gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);
  
      // 직선 => 회색 (0.5, 0.5, 0.5, 1.0) 해도 되고,
      // 완전 흰색(1,1,1)보다 약간 어두운 (0.7,0.7,0.7) 등 원하는 값
      gl.uniform4f(uColorLoc, 0.5, 0.5, 0.5, 1.0);
      gl.drawArrays(gl.LINES, 0, 2);
    }
  
    // 6) 교차점(노란색)
    if (intersectionPoints.length>0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, intersectionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(intersectionPoints), gl.STATIC_DRAW);
      gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);
  
      // 노란색 => (1.0, 1.0, 0.0, 1.0)
      gl.uniform4f(uColorLoc, 1.0, 1.0, 0.0, 1.0);
      gl.drawArrays(gl.POINTS, 0, intersectionPoints.length/2);
    }
  
    // 7) overlayCanvas에 텍스트 표시
    drawOverlayText();
  }
  
  // 드래그 중 원
  function buildTempCircle(center, radius, segs){
    let arr = [];
    for (let i=0; i<segs; i++){
      const theta = (2*Math.PI*i)/segs;
      const x = center[0] + radius*Math.cos(theta);
      const y = center[1] + radius*Math.sin(theta);
      arr.push(x,y);
    }
    return arr;
  }
  
  // overlayCanvas에 info
  function drawOverlayText() {
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "white";
  
    let y = 20;
    if (circleInfo) {
      ctx.fillText(circleInfo, 10, y);
      y += 20;
    }
    if (lineInfo) {
      ctx.fillText(lineInfo, 10, y);
      y += 20;
    }
    if (intersectionInfo) {
      ctx.fillText(intersectionInfo, 10, y);
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => main());
  