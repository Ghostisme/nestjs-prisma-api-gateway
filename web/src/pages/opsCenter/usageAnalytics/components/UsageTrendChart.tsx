import type { JSX } from "react";
import { Chart, useChart } from "@/components/chart";
import type { UsageTrend } from "../../types";

interface UsageTrendChartProps {
	data: UsageTrend[];
}

export default function UsageTrendChart({ data }: UsageTrendChartProps): JSX.Element {
	const options = useChart({
		chart: { type: "area" },
		xaxis: {
			categories: data.map((d) => d.date),
		},
		stroke: { curve: "smooth", width: 2.5 },
		colors: ["var(--colors-palette-info-default)", "var(--colors-palette-error-default)"],
		fill: {
			type: "gradient",
			gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 100] },
		},
		legend: {
			show: true,
			position: "top",
			horizontalAlign: "right",
			markers: { shape: "circle" },
		},
		tooltip: {
			y: { formatter: (val: number) => val.toLocaleString() },
		},
	});

	return (
		<Chart
			type="area"
			height={320}
			options={options}
			series={[
				{ name: "输入 Token", data: data.map((d) => d.tokensIn) },
				{ name: "输出 Token", data: data.map((d) => d.tokensOut) },
			]}
		/>
	);
}
