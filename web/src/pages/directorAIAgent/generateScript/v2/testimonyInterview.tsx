import { useImperativeHandle } from "react";
import type { Props } from "@/pages/directorAIAgent/generateScript/v2/realOralBroadcast.tsx";
import { usePreferences, useSellingPoint, useStaffing, useVideoDuration } from "../hooks";
import { Preferences, SellingPoint, Staffing, VideoDuration } from "./index.ts";

export default ({
	max,
	config: { personConfig, interviewDimension, shootingScene, policyTrigger, productSeeding },
	ref,
}: Props) => {
	const staffOpts = useStaffing({
		max: 5,
		defaultRole: personConfig,
	});
	const dimensionOpts = useSellingPoint({
		max,
		title: "采访核心维度",
		defaultTags: interviewDimension?.map((tag) => ({ label: tag, value: tag })),
	});
	const sceneOpts = useSellingPoint({
		max,
		title: "拍摄场景",
		defaultTags: shootingScene?.map((tag) => ({ label: tag, value: tag })),
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
				interviewCoreDimension: dimensionOpts.data,
				shootingLocation: sceneOpts.data,
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
			<SellingPoint {...dimensionOpts} />
			<SellingPoint {...sceneOpts} />
			<Preferences {...preferencesOpts} />
			<VideoDuration {...videoDurationOpts} />
		</>
	);
};
