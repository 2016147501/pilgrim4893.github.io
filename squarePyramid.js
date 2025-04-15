export class SquarePyramid {
    constructor(gl) {
        this.gl = gl;

        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // 예시: 빨강/초록/파랑/노랑 옆면 + 회색(bottom)
        this.vertices = new Float32Array([
            // side face #1
             0,1,0,   0.5,0,0.5,   -0.5,0,0.5,
            // side face #2
             0,1,0,  -0.5,0,0.5,   -0.5,0,-0.5,
            // side face #3
             0,1,0,  -0.5,0,-0.5,   0.5,0,-0.5,
            // side face #4
             0,1,0,   0.5,0,-0.5,   0.5,0,0.5,
            // bottom face
             0.5,0,0.5,  -0.5,0,0.5,  -0.5,0,-0.5,   0.5,0,-0.5
        ]);

        // RGBA 색상 (face별로 3정점, bottom 4정점)
        this.colors = new Float32Array([
            // side #1 (빨강)
            1,0,0,1,  1,0,0,1,  1,0,0,1,
            // side #2 (초록)
            0,1,0,1,  0,1,0,1,  0,1,0,1,
            // side #3 (파랑)
            0,0,1,1,  0,0,1,1,  0,0,1,1,
            // side #4 (노랑)
            1,1,0,1,  1,1,0,1,  1,1,0,1,
            // bottom (회색 4정점)
            0.6,0.6,0.6,1,  0.6,0.6,0.6,1,  0.6,0.6,0.6,1,  0.6,0.6,0.6,1
        ]);

        // 법선 (면 단위로 대략 설정)
        this.normals = new Float32Array([
            // side #1
             0,0,1,   0,0,1,   0,0,1,
            // side #2
            -1,0,0,  -1,0,0,  -1,0,0,
            // side #3
             0,0,-1,  0,0,-1,  0,0,-1,
            // side #4
             1,0,0,   1,0,0,   1,0,0,
            // bottom face
             0,-1,0,   0,-1,0,   0,-1,0,   0,-1,0
        ]);

        // 텍스처 좌표(필요 없으면 0으로만 채워도 상관 없음)
        this.texCoords = new Float32Array([
            // side #1
            0,1,  1,0,  0,0,
            // side #2
            0,1,  1,0,  0,0,
            // side #3
            0,1,  1,0,  0,0,
            // side #4
            0,1,  1,0,  0,0,
            // bottom(4정점)
            0,0,  1,0,  1,1,  0,1
        ]);

        // 인덱스
        this.indices = new Uint16Array([
            // side #1
            0,1,2,
            // side #2
            3,4,5,
            // side #3
            6,7,8,
            // side #4
            9,10,11,
            // bottom
            12,13,14,  12,14,15
        ]);

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);

        // 각 배열의 byteLength
        const vSize = this.vertices.byteLength;
        const cSize = this.colors.byteLength;
        const nSize = this.normals.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + cSize + nSize + tSize;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);

        // (1) vertices → (2) colors → (3) normals → (4) texCoords 순서로 복사
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + cSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + cSize + nSize, this.texCoords);

        // EBO
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // vertexAttribPointer: (location, size, type, normalize, stride, offset)
        // layout(location=0) → aPosition (vec3)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        // layout(location=1) → aColor (vec4)
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, vSize);
        gl.enableVertexAttribArray(1);

        // layout(location=2) → aNormal (vec3)
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, vSize + cSize);
        gl.enableVertexAttribArray(2);

        // layout(location=3) → aTexCoord (vec2)
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + cSize + nSize);
        gl.enableVertexAttribArray(3);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }
}
