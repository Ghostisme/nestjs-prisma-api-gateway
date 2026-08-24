import { Icon } from "@/components/icon";
import type { ConversationViewInfo } from "../../types";
import type { JSX } from "react";

interface ConversationInfoCardProps {
	info: ConversationViewInfo;
}

interface InfoItemProps {
	label: string;
	value: string | number;
	highlight?: boolean;
	icon?: string;
}

const InfoItem = ({ label, value, highlight, icon }: InfoItemProps): JSX.Element => (
	<div className="flex items-center gap-2">
		{icon && <Icon icon={icon} size={16} color="var(--colors-palette-primary-default)" />}
		<span className="text-xs text-[var(--muted-foreground)]">{label}</span>
		<span
			className={`text-sm font-semibold ${
				highlight ? "text-[var(--colors-palette-primary-default)]" : "text-[var(--foreground)]"
			}`}
		>
			{value}
		</span>
	</div>
);

export const ConversationInfoCard = ({ info }: ConversationInfoCardProps): JSX.Element => {
	return (
		<div className="rounded-xl bg-[var(--card)] shadow-sm border border-[var(--border)] overflow-hidden">
			<div
				className="px-6 py-3 border-b border-[var(--border)]"
				style={{
					background: "linear-gradient(135deg, var(--colors-palette-primary-lighter) 0%, var(--card) 100%)",
				}}
			>
				<div className="flex items-center gap-2">
					<div className="w-1 h-5 rounded-full" style={{ background: "var(--colors-palette-primary-default)" }} />
					<h3 className="text-base font-bold text-[var(--foreground)]">Basic Info</h3>
				</div>
			</div>

			<div className="px-6 py-4 space-y-4">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3">
					<InfoItem icon="lucide:message-square" label="Title" value={info.dialogTitle} highlight />
					<InfoItem icon="lucide:cpu" label="Model" value={info.model} highlight />
					<InfoItem icon="lucide:bot" label="Agent" value={info.agent} highlight />
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
					<StatMini label="Total Messages" value={`${info.totalMessages}`} />
					<StatMini label="User Messages" value={`${info.userMessages}`} />
					<StatMini label="Agent Messages" value={`${info.agentMessages}`} />
					<StatMini label="Satisfaction" value={info.userSatisfaction} accent />
					<StatMini label="Duration" value={info.duration} />
					<StatMini label="Tokens" value={info.consumeToken.toLocaleString()} />
				</div>

				<div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-[var(--muted-foreground)]">
					<span>
						<Icon icon="lucide:clock" size={13} className="mr-1 inline-block align-middle" />
						Started <strong className="text-[var(--foreground)] ml-1">{info.startTime}</strong>
					</span>
					<span>
						<Icon icon="lucide:clock" size={13} className="mr-1 inline-block align-middle" />
						Ended <strong className="text-[var(--foreground)] ml-1">{info.endTime}</strong>
					</span>
					<span>
						<Icon icon="lucide:zap" size={13} className="mr-1 inline-block align-middle" />
						Avg Response <strong className="text-[var(--foreground)] ml-1">{info.avgResponseTime}</strong>
					</span>
				</div>
			</div>
		</div>
	);
};

interface StatMiniProps {
	label: string;
	value: string;
	accent?: boolean;
}

const StatMini = ({ label, value, accent }: StatMiniProps): JSX.Element => (
	<div className="rounded-lg bg-[var(--accent)] px-3 py-2.5 text-center">
		<div className="text-[11px] text-[var(--muted-foreground)] mb-0.5">{label}</div>
		<div
			className={`text-sm font-bold ${
				accent ? "text-[var(--colors-palette-primary-default)]" : "text-[var(--foreground)]"
			}`}
		>
			{value}
		</div>
	</div>
);
