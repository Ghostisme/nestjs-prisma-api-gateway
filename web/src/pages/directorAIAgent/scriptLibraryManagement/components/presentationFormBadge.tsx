import { PRESENTATION_FORM_MAP, type PresentationForm } from "@/pages/directorAIAgent/scriptLibraryManagement/const.ts";
import { cn } from "@/utils";
import { Icon } from "@/components/icon";

export default ({ presentation }: Props) => {
	const opts = Object.values(PRESENTATION_FORM_MAP).find(({ name }) => name === presentation);
	if (!opts) {
		return null;
	}
	return (
		<div className={cn("px-[4px] py-[2px] flex items-center gap-[4px] text-[12px]  rounded-[4px]", opts.className)}>
			<Icon icon={opts.icon} className="size-[12px]" />
			{opts.name}
		</div>
	);
};

interface Props {
	presentation: PresentationForm;
}
