import { useImperativeHandle } from "react";
import type { ConfigListRes } from "@/api/directorAIAgent/types.ts";
import type { Props as P } from "@/pages/directorAIAgent/generateScript/carBuyingScene.tsx";
import { usePreferences, useSellingPoint, useStaffing, useVideoDuration } from "../hooks";
import { Preferences, SellingPoint, Staffing, VideoDuration } from "./index.ts";

export default ({
	max,
	config: { personConfig, shootingScene, purchaseScenarios, broadcastStyle, policyTrigger, productSeeding },
	ref,
}: Props) => {
	const staffOpts = useStaffing({
		max: 5,
		defaultRole: personConfig,
	});
	const sceneOpts = useSellingPoint({
		max,
		title: "拍摄场景",
		defaultTags: shootingScene.map((tag) => ({ label: tag, value: tag })),
	});
	// 用车场景
	const purchaseScenariosOpts = useSellingPoint({
		max: 3,
		title: "用车场景",
		defaultTags: purchaseScenarios.map((tag) => ({ label: tag, value: tag })),
	});
	const styleOpts = useSellingPoint({
		max,
		title: "口播风格",
		defaultTags: broadcastStyle.map((tag) => ({ label: tag, value: tag })),
	});
	const preferencesOpts = usePreferences({
		title: "创作偏好",
		policy: policyTrigger,
		product: productSeeding,
	});
	const videoDurationOpts = useVideoDuration({ title: "视频时长" });
	useImperativeHandle(ref, () => ({
		validate() {
			return {
				presentationRole: staffOpts.data,
				shootingLocation: sceneOpts.data,
				purchaseScenarios: purchaseScenariosOpts.data,
				broadcastStyle: styleOpts.data,
				taskType: preferencesOpts.data.map(({ type, factor }) => ({
					type,
					factor,
				})),
				videoDuration: videoDurationOpts.data,
			};
		},
	}));
	return (
		<>
			<Staffing {...staffOpts} />
			<SellingPoint {...sceneOpts} />
			<SellingPoint {...purchaseScenariosOpts} />
			<SellingPoint {...styleOpts} />
			<Preferences {...preferencesOpts} />
			<VideoDuration {...videoDurationOpts} />
		</>
	);
};

export interface Props extends P {
	config: ConfigListRes;
}
