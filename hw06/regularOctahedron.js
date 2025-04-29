const root2 = Math.SQRT2;

export class RegularOctahedron {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // Initializing data
        this.vertices = new Float32Array([
            // top front face
            0.0,  root2 / 2, 0.0, -0.5, 0.0,  0.5,  0.5, 0.0,  0.5,
            // top right face
            0.0,  root2 / 2, 0.0,  0.5, 0.0,  0.5,  0.5, 0.0, -0.5,
            // top back face
            0.0,  root2 / 2, 0.0,  0.5, 0.0, -0.5, -0.5, 0.0, -0.5,
            // top left face
            0.0,  root2 / 2, 0.0, -0.5, 0.0, -0.5, -0.5, 0.0,  0.5,
            // bottom front face
            0.0, -root2 / 2, 0.0, -0.5, 0.0,  0.5,  0.5, 0.0,  0.5,
            // bottom right face
            0.0, -root2 / 2, 0.0,  0.5, 0.0,  0.5,  0.5, 0.0, -0.5,
            // bottom back face
            0.0, -root2 / 2, 0.0,  0.5, 0.0, -0.5, -0.5, 0.0, -0.5,
            // bottom left face
            0.0, -root2 / 2, 0.0, -0.5, 0.0, -0.5, -0.5, 0.0,  0.5
        ]);

        this.texCoords = new Float32Array([
            // top front face
            1 / 8, 1.0, 0 / 4, 0.5, 1 / 4, 0.5,
            // top right face
            3 / 8, 1.0, 1 / 4, 0.5, 2 / 4, 0.5,
            // top back face
            5 / 8, 1.0, 2 / 4, 0.5, 3 / 4, 0.5,
            // top left face
            7 / 8, 1.0, 3 / 4, 0.5, 4 / 4, 0.5,
            // top front face
            1 / 8, 0.0, 0 / 4, 0.5, 1 / 4, 0.5,
            // top right face
            3 / 8, 0.0, 1 / 4, 0.5, 2 / 4, 0.5,
            // top back face
            5 / 8, 0.0, 2 / 4, 0.5, 3 / 4, 0.5,
            // top left face
            7 / 8, 0.0, 3 / 4, 0.5, 4 / 4, 0.5
        ]);

        this.indices = new Uint16Array([
            // top front face
            0, 1, 2,
            // top right face
            3, 4, 5,
            // top back face
            6, 7, 8,
            // top left face
            9, 10, 11,
             // top front face
            12, 13, 14,
             // top right face
            15, 16, 17,
             // top back face
            18, 19, 20,
             // top left face
            21, 22, 23
        ]);

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;

        // 버퍼 크기 계산
        const vSize = this.vertices.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + tSize;

        gl.bindVertexArray(this.vao);

        // VBO에 데이터 복사
        // gl.bufferSubData(target, offset, data): target buffer의 
        //     offset 위치부터 data를 copy (즉, data를 buffer의 일부에만 copy)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.texCoords);

        // EBO에 인덱스 데이터 복사
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // vertex attributes 설정
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);  // position
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize);  // texCoord

        // vertex attributes 활성화
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(3);

        // 버퍼 바인딩 해제
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    updateNormals() {
        const gl = this.gl;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {

        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
} 
