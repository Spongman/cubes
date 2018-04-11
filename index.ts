
import webgl = require('wpe-webgl');
import { mat4, glMatrix, vec3 } from 'gl-matrix';


let options = { width: 1920, height: 1080, fullscreen: true };
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
gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);


let vertexColorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

let pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix")!;
let mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix")!;

gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
gl.enable(gl.BLEND);
gl.disable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);



let pMatrix: mat4 = mat4.create();
let mvMatrix: mat4 = mat4.create();

mat4.perspective(pMatrix, 45, options.width / options.height, 0.1, 20.0);

let vertices: number[] = [];
let colors: number[] = [];

enum Axis { X, Y, Z }

class Cube {

	public left: Cube | null = null;
	public right: Cube | null = null;
	public negative: Boolean;
	public color: number[] = [];

	constructor(public timeStart: number, public timeEnd: number, public axis: Axis) {
		this.negative = Math.random() < 0.5;
		this.color.push(
			Math.random() * .4 + .3,
			Math.random() * .4 + .3,
			Math.random() * .4 + .3
		);
	}

	render(time: number, alpha: number, x: number, y: number, z: number, dx: number, dy: number, dz: number):Cube|null {

		var fraction = (time - this.timeStart) / (this.timeEnd - this.timeStart);
		if (fraction > 1)
			fraction = 1;

		var myAlpha = alpha;
		if (fraction < 0.1) {
			myAlpha *= fraction / 0.1;
		} else if (fraction > 0.9) {
			myAlpha *= (1 - fraction) / 0.1;
		}

		if (this.negative)
			fraction = 1 - fraction;

		if (!this.left && Math.random() < (1 - fraction) * (1 - fraction) / 20)
			this.left = new Cube(time, time + 5000, (this.axis + 1 + Math.floor(Math.random() * 2)) % 3 as Axis);

		if (!this.right && Math.random() < fraction * fraction / 20)
			this.right = new Cube(time, time + 5000, (this.axis + 1 + Math.floor(Math.random() * 2)) % 3 as Axis);

		switch (this.axis) {
			case Axis.X:
				var dxf = dx * fraction;
				var x2 = x + dxf;
				if (this.left)
					this.left = this.left.render(time, alpha, x, y, z, dxf, dy, dz);
				if (this.right)
					this.right = this.right.render(time, alpha, x2, y, z, dx - dxf, dy, dz);

				vertices.push(
					x2, y, z,
					x2, y + dy, z,
					x2, y, z + dz,
					x2, y, z + dz,
					x2, y + dy, z,
					x2, y + dy, z + dz
				);
				break;
			case Axis.Y:
				var dyf = dy * fraction;
				var y2 = y + dyf;
				if (this.left)
					this.left = this.left.render(time, alpha, x, y, z, dx, dyf, dz);
				if (this.right)
					this.right = this.right.render(time, alpha, x, y2, z, dx, dy - dyf, dz);

				vertices.push(
					x, y, z,
					x + dx, y, z,
					x, y, z + dz,
					x, y, z + dz,
					x + dx, y, z,
					x + dx, y, z + dz
				);
				break;
			case Axis.Z:
				var dzf = dz * fraction;
				var z2 = z + dzf;
				if (this.left)
					this.left = this.left.render(time, alpha, x, y, z, dx, dy, dzf);
				if (this.right)
					this.right = this.right.render(time, alpha, x, y, z2, dx, dy, dz - dzf);

				vertices.push(
					x, y, z,
					x + dx, y, z,
					x, y + dy, z,
					x, y + dy, z,
					x + dx, y, z,
					x + dx, y + dy, z
				);
				break;
		}

		var r = this.color[0];
		var g = this.color[1];
		var b = this.color[2];
		colors.push(
			r, g, b, alpha,
			r, g, b, alpha,
			r, g, b, alpha,
			r, g, b, alpha,
			r, g, b, alpha,
			r, g, b, alpha,
		);

		if (time < this.timeEnd)
			return this;

		return this.negative ? this.right : this.left;
	}
}

var now = Date.now();

var cube: Cube|null = null;

console.log('foo');

while (true) {
	var timeNow = Date.now();

	gl.clearColor(0, 0.0, 0.0, 0.0);

	// Set the viewport
	gl.viewport(0, 0, options.width, options.height);

	// Clear the color buffer
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Do other GL-related stuff here.

	mat4.lookAt(mvMatrix, vec3.fromValues(-1, 2, 3), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

	mat4.rotateX(mvMatrix, mvMatrix,timeNow / 5000);
	mat4.rotateY(mvMatrix, mvMatrix,timeNow / 6123.34);
	mat4.rotateZ(mvMatrix, mvMatrix,timeNow / 7892.12);

	gl.uniformMatrix4fv(pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);


	vertices.length = 0;
	colors.length = 0;

	if (!cube)
		cube = new Cube(timeNow, timeNow + 5000, Axis.X);
	cube = cube.render(timeNow, 0.4, -1.5, -1.5, -1.5, 3, 3, 3);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

	webgl.nextFrame(true /* Use false to prevent buffer swapping */);
}
