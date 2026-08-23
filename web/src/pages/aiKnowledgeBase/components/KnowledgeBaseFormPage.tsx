import { useQuery } from "@tanstack/react-query";
import { Button, Form, Input, message, Spin, Tag, Upload } from "antd";
import { type JSX, useCallback, useState } from "react";
import { Icon } from "@/components/icon";
import aiKnowledgeBaseService from "@/api/services/aiKnowledgeBaseService";
import type { KnowledgeBaseFormData } from "../types";

const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 5;
const MAX_DESC_LENGTH = 300;

interface KnowledgeBaseFormPageProps {
	knowledgeBaseId: string | null;
	onBack: () => void;
	onSuccess: () => void;
}

export default function KnowledgeBaseFormPage({
	knowledgeBaseId,
	onBack,
	onSuccess,
}: KnowledgeBaseFormPageProps): JSX.Element {
	const [form] = Form.useForm<KnowledgeBaseFormData>();
	const [loading, setLoading] = useState(false);
	const [tagInput, setTagInput] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const isEdit = knowledgeBaseId !== null;

	const { isPending: detailLoading } = useQuery({
		queryKey: ["knowledge-base-detail", knowledgeBaseId],
		queryFn: async () => {
			if (!knowledgeBaseId) return null;
			const detail = await aiKnowledgeBaseService.getKnowledgeBaseDetail(knowledgeBaseId);
			form.setFieldsValue({
				name: detail.name,
				description: detail.description,
			});
			setTags(detail.tags.map((t) => t.tagName));
			return detail;
		},
		enabled: isEdit,
	});

	const handleAddTag = useCallback(() => {
		const trimmed = tagInput.trim();
		if (!trimmed) return;
		if (tags.length >= MAX_TAGS) {
			message.warning(`最多添加${MAX_TAGS}个标签`);
			return;
		}
		if (trimmed.length > MAX_TAG_LENGTH) {
			message.warning(`标签最多${MAX_TAG_LENGTH}个字`);
			return;
		}
		if (tags.includes(trimmed)) {
			message.warning("标签已存在");
			return;
		}
		setTags((prev) => [...prev, trimmed]);
		setTagInput("");
	}, [tagInput, tags]);

	const handleRemoveTag = useCallback((tag: string) => {
		setTags((prev) => prev.filter((t) => t !== tag));
	}, []);

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			const formData: KnowledgeBaseFormData = {
				...values,
				tags,
			};
			if (isEdit) {
				await aiKnowledgeBaseService.updateKnowledgeBase(knowledgeBaseId, formData);
				message.success("编辑成功");
			} else {
				await aiKnowledgeBaseService.createKnowledgeBase(formData);
				message.success("创建成功");
			}
			onSuccess();
		} catch {
			/* validation error */
		} finally {
			setLoading(false);
		}
	};

	if (isEdit && detailLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Spin size="large" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3 mb-6">
				<Button
					type="text"
					icon={<Icon icon="ph:arrow-left" size={18} />}
					onClick={onBack}
					className="flex items-center"
				>
					返回
				</Button>
				<h2 className="text-lg font-semibold m-0">{isEdit ? "编辑知识库" : "创建新知识库"}</h2>
			</div>

			<div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
				<div className="mb-6">
					<h3 className="text-base font-semibold flex items-center gap-2 mb-6">
						<span className="inline-block w-1 h-4 rounded bg-primary" />
						基本信息
					</h3>
				</div>

				<Form form={form} layout="vertical" autoComplete="off" className="max-w-2xl">
					<Form.Item
						name="name"
						label={<span className="font-semibold">知识库名称</span>}
						rules={[{ required: true, message: "请输入知识库名称" }]}
					>
						<Input placeholder="请输入知识库名称" maxLength={50} />
					</Form.Item>

					<Form.Item
						name="description"
						label={
							<span className="font-semibold">
								知识库描述
								<span className="text-primary ml-2 font-normal text-xs">（需要描述知识库包含的内容与用途）</span>
							</span>
						}
						rules={[{ required: true, message: "请输入知识库描述" }]}
					>
						<Input.TextArea
							placeholder={`请输入知识库描述（最多可输入${MAX_DESC_LENGTH}字）`}
							maxLength={MAX_DESC_LENGTH}
							showCount
							rows={5}
						/>
					</Form.Item>

					<Form.Item
						label={
							<span className="font-semibold">
								知识库标签
								<span className="text-primary ml-2 font-normal text-xs">（最多添加{MAX_TAGS}个）</span>
							</span>
						}
					>
						<div className="flex items-center gap-2 flex-wrap">
							{tags.map((tag) => (
								<Tag key={tag} closable onClose={() => handleRemoveTag(tag)} className="text-sm py-0.5">
									{tag}
								</Tag>
							))}
							{tags.length < MAX_TAGS && (
								<div className="flex gap-2">
									<Input
										value={tagInput}
										onChange={(e) => setTagInput(e.target.value)}
										placeholder={`请输入标签内容,最多输入${MAX_TAG_LENGTH}个字`}
										maxLength={MAX_TAG_LENGTH}
										className="w-56"
										onPressEnter={handleAddTag}
									/>
									<Button type="primary" size="small" onClick={handleAddTag}>
										添加下一个
									</Button>
								</div>
							)}
						</div>
					</Form.Item>
				</Form>

				<div className="mt-8">
					<h3 className="text-base font-semibold flex items-center gap-2 mb-6">
						<span className="inline-block w-1 h-4 rounded bg-primary" />
						知识库文档管理
					</h3>

					<Upload.Dragger multiple accept=".docx,.pdf,.xlsx,.txt" beforeUpload={() => false} className="rounded-lg">
						<div className="py-4">
							<p className="text-base font-medium text-primary mb-2">点击上传文件</p>
							<p className="text-xs text-[var(--muted-foreground)]">支持批量上传,单个文件不超过50MB</p>
							<p className="text-xs text-[var(--muted-foreground)]">支持Docx,Pdf,Xlsx,TXT</p>
						</div>
					</Upload.Dragger>
				</div>

				<div className="flex justify-end mt-8 gap-3">
					<Button onClick={onBack}>取消</Button>
					<Button type="primary" loading={loading} onClick={handleSubmit}>
						{isEdit ? "保存" : "创建"}
					</Button>
				</div>
			</div>
		</div>
	);
}
