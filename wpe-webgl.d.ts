declare module "wpe-webgl" {

	export interface InitOptions {
		width?: number,
		height?: number,
		fullscreen?: boolean,
		title?: string
	}

	export function init(options?: InitOptions): WebGLRenderingContext;
	export function nextFrame(swapBuffer?: boolean): void;
}
