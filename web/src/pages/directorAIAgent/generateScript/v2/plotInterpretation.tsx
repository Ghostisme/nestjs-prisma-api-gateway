import { useImperativeHandle } from "react";
import type { Props } from "@/pages/directorAIAgent/generateScript/v2/realOralBroadcast.tsx";
import { usePreferences, useSellingPoint, useStaffing, useVideoDuration } from "../hooks";
import { Preferences, SellingPoint, Staffing, VideoDuration } from "./index.ts";

export default ({
	max,
	config: { personConfig, shootingScene, plotRhythm, policyTrigger, productSeeding },
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
	const rhythmOpts = useSellingPoint({
		max,
		title: "剧情节奏",
		defaultTags: plotRhythm.map((tag) => ({ label: tag, value: tag })),
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
				plotRhythm: rhythmOpts.data,
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
			<SellingPoint {...rhythmOpts} />
			<Preferences {...preferencesOpts} />
			<VideoDuration {...videoDurationOpts} />
		</>
	);
};
