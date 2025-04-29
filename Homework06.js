/*--------------------------------------------------------------
Homework06.js
- 정팔면체(Regular Octahedron)에 sunrise.jpg 텍스처를 입히고
- Arcball로 회전시키는 프로그램
--------------------------------------------------------------*/
import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { RegularOctahedron } from './regularOctahedron.js';
import { Arcball } from '../util/arcball.js';
import { loadTexture } from '../util/texture.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

let shader;
let isInitialized = false;
let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();

// Axes helper
const axes = new Axes(gl, 1.5);

// Load the texture (sunrise.jpg)
const texture = loadTexture(gl, true, './sunrise.jpg');

// Regular Octahedron
const octahedron = new RegularOctahedron(gl);

// Arcball setup
const arcball = new Arcball(canvas, 5.0, { rotation: 2.0, zoom: 0.0005 });

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('Program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('Program terminated with error:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 not supported');
        return false;
    }
    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    gl.enable(gl.DEPTH_TEST);
    return true;
}

async function initShader() {
    const vsSource = await readShaderFile('shVert.glsl');
    const fsSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vsSource, fsSource);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    viewMatrix = arcball.getViewMatrix();

    shader.use();
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    shader.setInt('u_texture', 0);

    octahedron.draw(shader);
    axes.draw(viewMatrix, projMatrix);

    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        await initShader();

        mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -3));
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),
            canvas.width / canvas.height,
            0.1,
            100.0
        );

        requestAnimationFrame(render);
        return true;

    } catch (error) {
        console.error('Initialization failed:', error);
        alert('Failed to initialize program');
        return false;
    }
}
