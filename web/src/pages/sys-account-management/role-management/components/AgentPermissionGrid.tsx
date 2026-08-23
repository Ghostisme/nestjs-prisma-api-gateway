import { Checkbox, Empty, Tabs } from "antd";
import { type JSX, useCallback, useEffect, useMemo, useState } from "react";
import type { TenantAiAgentGroupVO, TenantAiAgentVO } from "@/api/services/roleManagementService";
import Icon from "@/components/icon/icon";

const getAgentCode = (agent: TenantAiAgentVO): number | null => {
	return typeof agent.agentCode === "number" ? agent.agentCode : null;
};

export const getGroupTabKey = (group: TenantAiAgentGroupVO, index: number): string => {
	if (group.aiEnCode) return group.aiEnCode;
	if (typeof group.aiCode === "number") return String(group.aiCode);
	if (group.name) return group.name;
	return `agent-group-${index}`;
};

function AgentLogo({ agentLogo, agentName }: Pick<TenantAiAgentVO, "agentLogo" | "agentName">): JSX.Element {
	const [hasLoadError, setHasLoadError] = useState(false);
	const logoUrl = typeof agentLogo === "string" ? agentLogo.trim() : "";

	if (logoUrl && !hasLoadError) {
		return (
			<img
				src={logoUrl}
				alt={agentName || "Agent图标"}
				className="h-10 w-10 rounded-lg object-cover"
				onError={() => setHasLoadError(true)}
			/>
		);
	}

	return (
		<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
			<Icon icon="ph:robot" size={22} className="text-primary" />
		</div>
	);
}

interface AgentPermissionGridProps {
	groups: TenantAiAgentGroupVO[];
	selectedAgentCodesByGroup: Record<string, number[]>;
	onChange: (selectedAgentCodesByGroup: Record<string, number[]>) => void;
}

export default function AgentPermissionGrid({
	groups,
	selectedAgentCodesByGroup,
	onChange,
}: AgentPermissionGridProps): JSX.Element {
	const [activeKey, setActiveKey] = useState<string>();
	const tabKeys = useMemo(() => groups.map((group, index) => getGroupTabKey(group, index)), [groups]);

	useEffect(() => {
		if (tabKeys.length === 0) {
			setActiveKey(undefined);
			return;
		}
		setActiveKey((currentKey) => (currentKey && tabKeys.includes(currentKey) ? currentKey : tabKeys[0]));
	}, [tabKeys]);

	const handleToggle = useCallback(
		(groupKey: string, agentCode: number) => {
			const next = new Set(selectedAgentCodesByGroup[groupKey] ?? []);
			if (next.has(agentCode)) {
				next.delete(agentCode);
			} else {
				next.add(agentCode);
			}
			onChange({
				...selectedAgentCodesByGroup,
				[groupKey]: Array.from(next),
			});
		},
		[selectedAgentCodesByGroup, onChange],
	);

	const tabItems = useMemo(
		() =>
			groups.map((group, index) => {
				const groupKey = getGroupTabKey(group, index);
				const selectedSet = new Set(selectedAgentCodesByGroup[groupKey] ?? []);

				return {
					key: groupKey,
					label: group.name || "未命名分组",
					children: (
						<div className="grid grid-cols-3 gap-4 p-2">
							{group.agentList?.length ? (
								group.agentList.map((agent, agentIndex) => {
									const agentCode = getAgentCode(agent);
									if (agentCode === null) return null;
									const checked = selectedSet.has(agentCode);
									return (
										<div
											key={agent.id ?? agent.agentCode ?? `${group.aiCode}-${agentIndex}`}
											className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
												checked ? "border-primary bg-primary/5" : "border-border bg-card"
											}`}
											onClick={() => handleToggle(groupKey, agentCode)}
										>
											<Checkbox
												checked={checked}
												className="absolute top-3 right-3"
												onClick={(e) => e.stopPropagation()}
												onChange={() => handleToggle(groupKey, agentCode)}
											/>
											<div className="flex items-center gap-3 mb-2">
												<AgentLogo agentLogo={agent.agentLogo} agentName={agent.agentName} />
												<span className="text-sm font-semibold">{agent.agentName || "未命名Agent"}</span>
											</div>
											<p className="text-xs text-muted-foreground leading-relaxed">
												<span className="font-medium text-foreground">Agent介绍：</span>
												{agent.agentIntro ?? "--"}
											</p>
										</div>
									);
								})
							) : (
								<div className="col-span-3 py-8">
									<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无Agent数据" />
								</div>
							)}
						</div>
					),
				};
			}),
		[groups, selectedAgentCodesByGroup, handleToggle],
	);

	if (tabItems.length === 0) {
		return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无Agent权限数据" />;
	}

	return <Tabs activeKey={activeKey} items={tabItems} className="agent-permission-tabs" onChange={setActiveKey} />;
}
