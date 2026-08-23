import { useRef } from "react";

export default <V>(handler: Handler<V>, delay: number = 250) => {
	const timer = useRef<number>(void 0);
	return (...args: any[]) =>
		new Promise((resolve) => {
			clearTimeout(timer.current);
			timer.current = setTimeout(() => resolve(handler(...args)), delay);
		});
};

type Handler<V> = (...args: any[]) => V;
