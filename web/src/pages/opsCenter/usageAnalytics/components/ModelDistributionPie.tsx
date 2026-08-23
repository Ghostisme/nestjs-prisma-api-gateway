import type { JSX } from "react";
import { Chart, useChart } from "@/components/chart";
import type { ModelDistribution } from "../../types";

interface ModelDistributionPieProps {
	data: ModelDistribution[];
}

export default function ModelDistributionPie({ data }: ModelDistributionPieProps): JSX.Element {
	const options = useChart({
		chart: { type: "donut" },
		labels: data.map((d) => d.modelName),
		legend: {
			show: true,
			position: "bottom",
			horizontalAlign: "center",
			markers: { shape: "circle" },
		},
		plotOptions: {
			pie: {
				donut: {
					size: "72%",
					labels: {
						show: true,
						total: {
							show: true,
							label: "总计",
							formatter: () => data.reduce((s, d) => s + d.tokensTotal, 0).toLocaleString(),
						},
					},
				},
			},
		},
		tooltip: {
			y: { formatter: (val: number) => `${val.toLocaleString()} tokens` },
		},
	});

	return <Chart type="donut" height={340} options={options} series={data.map((d) => d.tokensTotal)} />;
}
