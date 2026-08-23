export interface Result<T = unknown> {
	code: number;
	msg: string;
	data: T;
}
