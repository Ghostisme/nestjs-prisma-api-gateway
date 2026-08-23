import policy_detonation from "@/assets/images/directorAIAgent/policy_detonation.png";
import product_seeding from "@/assets/images/directorAIAgent/product_seeding.png";
import { useReactive } from "@/hooks";

export default ({ title, policy = 0.5, product = 0.5 }: Props) => {
	const policyFactor = Number.isFinite(policy) ? policy : 0.5;
	const productFactor = Number.isFinite(product) ? product : 0.5;
	const { data, $refs } = useReactive<State>({
		data: [
			{ icon: policy_detonation, label: "政策引爆", factor: policyFactor, type: "policy_detonation" },
			{ icon: product_seeding, label: "产品种草", factor: productFactor, type: "product_seeding" },
		],
	});
	const onChange = (i: number, value: number) => {
		value = Number(value.toFixed(1));
		$refs.data.forEach((it, j) => {
			it.factor = j === i ? value : Number((1 - value).toFixed(1));
		});
	};
	return {
		title,
		data,
		onChange,
	};
};

interface Props {
	title: string;
	policy?: number;
	product?: number;
}
export interface State {
	data: {
		icon: string;
		label: string;
		factor: number;
		type: string;
	}[];
}
