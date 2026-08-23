import { Tooltip } from "antd";
import dayjs from "dayjs";
import logo from "@/assets/images/directorAIAgent/logo.png";
import {
	PresentationFormBadge,
	TaskTypeBadge,
} from "@/pages/directorAIAgent/scriptLibraryManagement/components/index.ts";

export default ({ title, creatorName, createTime, taskType, presentationForm }: Record<string, any>) => (
	<div className={"text-left"}>
		<div className={"flex items-center gap-[5px]"}>
			<img src={logo} alt="" className={"w-[20px]"} />
			<Tooltip title={title}>
				<div
					className={
						"flex-[0.95] overflow-hidden whitespace-nowrap text-ellipsis text-[#1D2129] text-[16px] font-semibold"
					}
				>
					{title}
				</div>
			</Tooltip>
		</div>
		<div className={"flex items-center gap-[5px] text-[#86909C] text-[14px]"}>
			{creatorName}
			<span>于</span>
			{createTime ? dayjs(createTime).format("YYYY-MM-DD HH:mm:ss") : ""}
			<span>创建</span>
		</div>
		<div className={"flex items-center gap-[5px]"}>
			<TaskTypeBadge task={taskType} />
			<PresentationFormBadge presentation={presentationForm} />
		</div>
	</div>
);
