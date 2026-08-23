import { Icon } from "@/components/icon";
import { MODEL_TYPE_ICON_MAP, ModelType } from "@/pages/directorAIAgent/scriptLibraryManagement/const.ts";

export default ({ type, size = 20, color = "#4D6BFE" }: Props) => {
	const url = MODEL_TYPE_ICON_MAP[type];
	switch (type) {
		case ModelType.DOUBAO:
			return (
				<img src={url} className={"object-cover"} style={{ width: `${size}px`, height: `${size}px` }} alt="豆包模型" />
			);
		case ModelType.DEEPSEEK:
			return <Icon icon={url} size={size} color={color} />;
		default:
			return "-";
	}
};

interface Props {
	type: ModelType;
	size?: number;
	color?: string;
}
