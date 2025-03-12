// Modified_HelloWindow.js

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set the canvas size to 500 x 500 when first run
canvas.width = 500;
canvas.height = 500;

// WebGL settings: background color, etc.
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.SCISSOR_TEST);

// Start rendering
render();

// Keep the canvas in a square shape on window resize
window.addEventListener('resize', WindowResize);

// Rendering function
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Divide the canvas into half width and half height
    const halfWidth = canvas.width / 2;
    const halfHeight = canvas.height / 2;

    // Top-left (Red)
    gl.viewport(0, halfHeight, halfWidth, halfHeight);
    gl.scissor(0, halfHeight, halfWidth, halfHeight);
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Top-right (Green)
    gl.viewport(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.scissor(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Bottom-left (Blue)
    gl.viewport(0, 0, halfWidth, halfHeight);
    gl.scissor(0, 0, halfWidth, halfHeight);
    gl.clearColor(0.0, 0.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Bottom-right (Yellow)
    gl.viewport(halfWidth, 0, halfWidth, halfHeight);
    gl.scissor(halfWidth, 0, halfWidth, halfHeight);
    gl.clearColor(1.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

// Resize event handler: keep the canvas as a square 
function WindowResize() {
    const minSize = Math.min(window.innerWidth, window.innerHeight);
    canvas.width = minSize;
    canvas.height = minSize;
    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
}