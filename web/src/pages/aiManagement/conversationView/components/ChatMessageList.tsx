import { Button, Input, Tooltip } from "antd";
import { type JSX, useCallback, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import type { ConversationMessage } from "../../types";

function extractText(raw: string): string {
	if (!raw) return "";
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) {
			return parsed
				.filter((p: { type?: string; text?: string }) => p.type === "text" && p.text)
				.map((p: { text: string }) => p.text)
				.join("\n")
				.trim();
		}
	} catch {
		// not JSON
	}
	return raw;
}

interface ChatMessageListProps {
	messages: ConversationMessage[];
}

export const ChatMessageList = ({ messages }: ChatMessageListProps): JSX.Element => {
	const [searchVisible, setSearchVisible] = useState(false);
	const [searchText, setSearchText] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);

	const filteredMessages = useMemo(() => {
		if (!searchText.trim()) return messages;
		return messages.filter((m) => extractText(m.content).toLowerCase().includes(searchText.toLowerCase()));
	}, [messages, searchText]);

	const handleExport = useCallback(() => {
		const text = messages
			.map((m) => `[${m.timestamp}] ${m.role === "user" ? "用户" : "AI"}: ${extractText(m.content)}`)
			.join("\n\n");
		const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "对话记录.txt";
		a.click();
		URL.revokeObjectURL(url);
	}, [messages]);

	return (
		<div className="rounded-xl bg-[var(--card)] shadow-sm border border-[var(--border)] overflow-hidden">
			{/* Header */}
			<div className="px-6 py-3 border-b border-[var(--border)] flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-1 h-5 rounded-full" style={{ background: "var(--colors-palette-primary-default)" }} />
					<h3 className="text-base font-bold text-[var(--foreground)]">对话内容</h3>
					<span className="text-xs text-[var(--muted-foreground)] ml-1">共 {messages.length} 条消息</span>
				</div>

				<div className="flex items-center gap-2">
					{searchVisible && (
						<Input
							placeholder="搜索对话内容..."
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							allowClear
							prefix={<Icon icon="lucide:search" size={14} />}
							className="w-56"
							size="small"
						/>
					)}
					<Tooltip title="搜索对话内容">
						<Button
							type={searchVisible ? "primary" : "default"}
							size="small"
							icon={<Icon icon="lucide:search" size={14} />}
							onClick={() => {
								setSearchVisible(!searchVisible);
								if (searchVisible) setSearchText("");
							}}
						>
							搜索对话内容
						</Button>
					</Tooltip>
					<Tooltip title="导出对话内容">
						<Button size="small" icon={<Icon icon="lucide:download" size={14} />} onClick={handleExport}>
							导出对话内容
						</Button>
					</Tooltip>
				</div>
			</div>

			{/* Chat Messages */}
			<div
				ref={containerRef}
				className="px-6 py-5 space-y-6 max-h-[600px] overflow-y-auto"
				style={{ background: "var(--colors-background-default)" }}
			>
				{filteredMessages.map((msg) => (
					<ChatBubble key={msg.id} message={msg} searchText={searchText} />
				))}

				{filteredMessages.length === 0 && searchText && (
					<div className="text-center text-sm text-[var(--muted-foreground)] py-10">未找到匹配的对话内容</div>
				)}
			</div>
		</div>
	);
};

interface ChatBubbleProps {
	message: ConversationMessage;
	searchText: string;
}

const ChatBubble = ({ message, searchText }: ChatBubbleProps): JSX.Element => {
	const isUser = message.role === "user";

	const highlightText = useCallback(
		(text: string): JSX.Element => {
			if (!searchText.trim()) return <>{text}</>;
			const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
			const parts = text.split(regex);
			return (
				<>
					{parts.map((part) =>
						regex.test(part) ? (
							<mark key={`${part}`} className="bg-yellow-200 text-inherit rounded px-0.5">
								{part}
							</mark>
						) : (
							<span key={`${part}`}>{part}</span>
						),
					)}
				</>
			);
		},
		[searchText],
	);

	const renderContent = useCallback(
		(content: string): JSX.Element => {
			const lines = content.split("\n");
			return (
				<div className="space-y-1.5">
					{lines.map((line) => (
						<div key={`${line}`} className="leading-relaxed">
							{highlightText(line)}
						</div>
					))}
				</div>
			);
		},
		[highlightText],
	);

	return (
		<div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
			{/* Avatar */}
			<div
				className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
					isUser
						? "bg-gradient-to-br from-[var(--colors-palette-primary-light)] to-[var(--colors-palette-primary-default)]"
						: "bg-gradient-to-br from-[var(--colors-palette-success-light)] to-[var(--colors-palette-success-default)]"
				}`}
			>
				<Icon icon={isUser ? "lucide:user" : "lucide:bot"} size={18} color="white" />
			</div>

			{/* Content */}
			<div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
				{/* Meta */}
				<div className={`flex items-center gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
					<span className="text-xs font-semibold text-[var(--foreground)]">{isUser ? "用户" : "AI"}</span>
					<span className="text-[11px] text-[var(--muted-foreground)]">{message.timestamp}</span>
					{message.isBannedContent && (
						<span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[var(--colors-palette-error-default)]">
							<Icon icon="lucide:shield-alert" size={12} />
							违禁内容
						</span>
					)}
				</div>

				{/* Bubble */}
				<div
					className={`rounded-2xl px-4 py-3 text-sm shadow-sm transition-all ${
						message.isBannedContent
							? "bg-[var(--colors-palette-error-lighter)] border-2 border-[var(--colors-palette-error-light)] text-[var(--foreground)]"
							: isUser
								? "bg-[var(--colors-palette-primary-default)] text-white"
								: "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
					}`}
					style={!message.isBannedContent && !isUser ? { boxShadow: "0 1px 3px rgba(0,0,0,0.04)" } : undefined}
				>
					{renderContent(extractText(message.content))}
				</div>
			</div>
		</div>
	);
};
