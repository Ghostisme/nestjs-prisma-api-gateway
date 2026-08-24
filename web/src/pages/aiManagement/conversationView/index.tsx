import { Button, Spin } from "antd";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/icon";
import { useRouter, useSearchParams } from "@/routes/hooks";
import aiManagementService from "@/api/services/aiManagementService";
import { ConversationInfoCard } from "./components/ConversationInfoCard";
import { BannedWordDetection } from "./components/BannedWordDetection";
import { ChatMessageList } from "./components/ChatMessageList";
import type { JSX } from "react";

export default function ConversationViewPage(): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();
	const dialogId = searchParams.get("dialogId") ?? "unknown";

	const { data, isLoading } = useQuery({
		queryKey: ["conversation-view", dialogId],
		queryFn: () => aiManagementService.getConversationView(dialogId),
	});

	return (
		<Spin spinning={isLoading}>
			<div className="space-y-5">
				{/* Back Button */}
				<div className="flex items-center gap-3">
					<Button
						type="text"
						icon={<Icon icon="lucide:arrow-left" size={18} />}
						onClick={() => router.back()}
						className="flex items-center gap-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
					>
						Back
					</Button>
					<div className="h-4 w-px bg-[var(--border)]" />
					<h2 className="text-lg font-bold text-[var(--foreground)]">Conversation Details</h2>
					{data?.info.dialogTitle && (
						<span className="text-sm text-[var(--muted-foreground)]">— {data.info.dialogTitle}</span>
					)}
				</div>

				{/* Basic Info */}
				{data?.info && <ConversationInfoCard info={data.info} />}

				{/* Banned Word Detection */}
				{data?.bannedWordHits !== undefined && <BannedWordDetection hits={data.bannedWordHits} />}

				{/* Chat Messages */}
				{data?.messages && <ChatMessageList messages={data.messages} />}
			</div>
		</Spin>
	);
}
