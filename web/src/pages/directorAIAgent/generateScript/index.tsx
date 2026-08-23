import { Modal } from "antd";
import { useMemo, useRef } from "react";
import { useMount } from "react-use";
import { toast } from "sonner";
import { applyScript, configList } from "@/api/directorAIAgent";
import type { ConfigListRes } from "@/api/directorAIAgent/types";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Icon } from "@/components/icon";
import { useReactive } from "@/hooks";
import { useEquity } from "@/pages/directorAIAgent/generateScript/hooks";
import {
	AiScript,
	Equity,
	ExpertsVisitTheStore,
	LocalLife,
	ModelSellingPoints,
	PlotInterpretation,
	RealOralBroadcast,
	TestimonyInterview,
} from "@/pages/directorAIAgent/generateScript/v2";
import { Type, tabs } from "@/pages/directorAIAgent/generateScript/v2/const.ts";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import { Btn, Card } from "./components";
import HorizontalCardTabs from "./components/HorizontalCardTabs";
// import { fmtScriptSaveRequest } from "./fmtScriptSaveRequest";

export default () => {
	const [, contextHolder] = Modal.useModal();
	const { ids, sessionIds, isLoading, tab, configs, advancedOpen, $refs, $action } = useReactive<State>({
		ids: [],
		sessionIds: [],
		isLoading: false,
		tab: tabs[0],
		configs: [],
		advancedOpen: false,
	});
	const Component = useMemo(
		() =>
			({
				[Type.RealOralBroadcast]: RealOralBroadcast,
				[Type.TestimonyInterview]: TestimonyInterview,
				[Type.PlotInterpretation]: PlotInterpretation,
				[Type.ExpertsVisitTheStore]: ExpertsVisitTheStore,
				[Type.LocalLife]: LocalLife,
				[Type.OriginalPersona]: ExpertsVisitTheStore,
			})[tab],
		[tab],
	);
	const config = configs[0];

	const equityOpts = useEquity("专属权益");
	const modelSellingPointsRef = useRef<ComponentRef | null>(null);
	const componentRefRef = useRef<ComponentRef | null>(null);
	const normalizeIds = (value: unknown[]) =>
		value.flatMap((it) => (Array.isArray(it) ? it : [it])).filter((it): it is number => typeof it === "number");
	const onChangeIds = (id: number, nId: number) => {
		const normalizedIds = normalizeIds(ids);
		const normalizedSessionIds = normalizeIds(sessionIds);
		const nextIds = normalizedIds.map((it) => (it === id ? nId : it));

		// 如果 id 没找到（可能是新插入的数据），默认把它追加到最前面
		if (!normalizedIds.includes(id)) {
			nextIds.unshift(nId);
		}

		$refs.ids = nextIds;
		if (normalizedSessionIds.includes(id)) {
			$refs.sessionIds = normalizedSessionIds.map((it) => (it === id ? nId : it));
		}
	};
	const onSubmit = async () => {
		if (!equityOpts.data.length) {
			return toast.error("请选择至少一个专属权益");
		}
		const modelParams = await modelSellingPointsRef.current?.validate();
		const componentParams = await componentRefRef.current?.validate();
		const policyOffers = equityOpts.data.map(({ label: code, content: description }) => ({
			code,
			description,
		}));
		// const payload = {
		// 	...modelParams,
		// 	...componentParams,
		// 	policyOffers,
		// 	broadcastStyle: Array.isArray(componentParams?.broadcastStyle)
		// 		? componentParams.broadcastStyle[0] || ""
		// 		: componentParams?.broadcastStyle,
		// };
		const payload = {
			...modelParams,
			...componentParams,
			policyOffers,
			presentationForm: tab,
			interviewCoreDimension: Array.isArray(componentParams?.interviewCoreDimension)
				? componentParams.interviewCoreDimension[0] || ""
				: componentParams?.interviewCoreDimension,
			broadcastStyle: Array.isArray(componentParams?.broadcastStyle)
				? componentParams.broadcastStyle[0] || ""
				: componentParams?.broadcastStyle,
			plotRhythm: Array.isArray(componentParams?.plotRhythm)
				? componentParams.plotRhythm[0] || ""
				: componentParams?.plotRhythm,
		};

		// const fmtPayload = fmtScriptSaveRequest(payload);
		const fmtPayload = payload;

		try {
			const newIds = normalizeIds(await applyScript(fmtPayload));
			const nextIds = [...newIds, ...normalizeIds(ids)];
			const nextSessionIds = [...newIds, ...normalizeIds(sessionIds)];
			return $action({
				isLoading: true,
				ids: nextIds,
				sessionIds: nextSessionIds,
			});
		} catch {
			toast.error("提交参数格式错误或提交失败");
			return $action({
				isLoading: false,
			});
		}
	};
	useMount(async () => {
		try {
			const res = await configList();
			$refs.configs = res;
		} catch {
			$refs.configs = [];
			toast.error("获取高级设置配置失败");
		}
	});
	return (
		<>
			<div className={"flex gap-[24px] h-[calc(100vh-115px)]"}>
				<div className={"flex-1 overflow-y-auto rounded-[8px] flex  flex-col gap-[20px]"}>
					<ModelSellingPoints max={5} ref={modelSellingPointsRef} />
					<Card>
						<Equity {...equityOpts} />
					</Card>
					<Card>
						{/* Segmented tabs 放到外面，不在 Card 内 */}
						{/* <Segmented
              options={tabs}
              onChange={(value) => {
                $refs.tab = value;
              }}
              className={"mb-4!"}
              block
            /> */}
						<HorizontalCardTabs
							tab={tab}
							onChange={(value) => {
								if (value === tab) {
									return;
								}
								$refs.tab = value as Type;
								equityOpts.onChange([]);
							}}
						/>
						{/* 折叠面板，标题为"高级设置"，里面放对应模板的配置内容 */}
						{/* <Collapse
              items={[
                {
                  key: "advanced",
                  label: "高级设置",
                  children: config && (
                    <Component max={5} config={config} ref={componentRefRef} />
                  ),
                },
              ]}
            /> */}
						<div className="bg-[#F8FAFF] rounded-[8px] p-[16px] mt-[4px]">
							<div
								className="flex items-center justify-between cursor-pointer text-[14px] text-[#4E5969] font-medium"
								onClick={() => {
									$refs.advancedOpen = !advancedOpen;
								}}
							>
								<div className="flex items-center gap-[6px]">
									<Icon icon="mdi:cog-outline" size={18} color="#86909C" />
									高级设置
								</div>
								<Icon icon={advancedOpen ? "teenyicons:up-solid" : "teenyicons:down-solid"} size={10} color="#86909C" />
							</div>
							{/* {advancedOpen && config && (
                <div className="mt-[16px]">
                  <Component max={5} config={config} ref={componentRefRef} />
                </div>
              )} */}
							<div className={advancedOpen ? "mt-[16px]" : "hidden"}>
								{config && <Component max={1} config={config} ref={componentRefRef} />}
							</div>
						</div>
					</Card>
					{/* <Card title={"模板选择"} collapse>
						<Segmented
							options={tabs}
							onChange={(value) => {
								$refs.tab = value;
							}}
							className={"[&_.ant-segmented-item-selected]:bg-white!"}
							block
						/>
						{config && <Component max={5} config={config} ref={componentRefRef} />}
					</Card> */}
					<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
						<Btn isLoading={isLoading} onSubmit={onSubmit} />
					</AuthGuard>
				</div>
				<div className={"flex-1 bg-white overflow-y-auto rounded-[8px] p-[20px] flex flex-col gap-[20px]"}>
					<AiScript
						ids={ids}
						delay={3000}
						onChangeLoading={() => {
							$refs.isLoading = false;
						}}
						onChangeIds={onChangeIds}
					/>
				</div>
			</div>
			{contextHolder}
		</>
	);
};

interface ComponentRef {
	validate(): any;
}
interface State {
	ids: number[];
	sessionIds: number[];
	isLoading: boolean;
	tab: Type;
	configs: ConfigListRes[];
	advancedOpen: boolean;
}
