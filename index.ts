
declare interface WebGLRenderingContext {
	viewportWidth: number;
	viewportHeight: number;
}

import webgl = require('wpe-webgl');
import { mat4, glMatrix, vec3 } from 'gl-matrix';


let options = { width: 1280, height: 720 };
let gl = webgl.init(options);


import fs = require('fs');


function compileShader(shaderScript: string, type: number) {
	let shader = gl.createShader(type)!;
	gl.shaderSource(shader, shaderScript);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw gl.getShaderInfoLog(shader);
	}

	return shader;
}

function compileProgram(vsSrc: string, fsSrc: string) {

	let shaderProgram = gl.createProgram()!;
	gl.attachShader(shaderProgram, compileShader(vsSrc, gl.VERTEX_SHADER));
	gl.attachShader(shaderProgram, compileShader(fsSrc, gl.FRAGMENT_SHADER));
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.error("Could not initialise shaders");
		console.error('gl.VALIDATE_STATUS', gl.getProgramParameter(shaderProgram, gl.VALIDATE_STATUS));
		console.error('gl.getError()', gl.getError());
		if (gl.getProgramInfoLog(shaderProgram) !== '') {
			console.warn('Warning: gl.getProgramInfoLog()', gl.getProgramInfoLog(shaderProgram));
		}
	}

	gl.useProgram(shaderProgram);
	return shaderProgram;
}

let shaderProgram = compileProgram(
	fs.readFileSync(__dirname + "/shaders/shader-vs.glsl", { encoding: 'utf8' }),
	fs.readFileSync(__dirname + "/shaders/shader-fs.glsl", { encoding: 'utf8' })
);


let vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
gl.enableVertexAttribArray(vertexPositionAttribute);

let vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
gl.enableVertexAttribArray(vertexColorAttribute);


let vertexPositionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
	-1, -1, -1,
	-1, 1, -1,
	1, -1, -1,

	1, -1, -1,
	-1, 1, -1,
	1, 1, -1,

]), gl.STATIC_DRAW);
gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);


let vertexColorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
	1, 0, 0, .1,
	1, 1, 0, .1,
	1, 0, 1, .1,

	1, 0, 1, .1,
	1, 1, 0, .1,
	1, 1, 1, .1,
	
]), gl.STATIC_DRAW);
gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

let pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix")!;
let mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix")!;


gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
gl.enable(gl.BLEND);
gl.disable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);




let pMatrix: mat4 = mat4.create();
let mvMatrix: mat4 = mat4.create();

mat4.perspective(pMatrix, 45, options.width / options.height, 0.1, 100.0);
mat4.lookAt(mvMatrix, vec3.fromValues(0, 0, 4), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

while (true) {
	gl.clearColor(0, 0.0, 0.0, 0.0);

	// Set the viewport
	gl.viewport(0, 0, 1280, 720);

	// Clear the color buffer
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Do other GL-related stuff here.

    gl.uniformMatrix4fv(pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	webgl.nextFrame(true /* Use false to prevent buffer swapping */);
}
