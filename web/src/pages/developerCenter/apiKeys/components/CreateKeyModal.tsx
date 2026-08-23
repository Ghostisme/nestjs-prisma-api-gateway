import { App, DatePicker, Form, Input, Modal, Select, Typography } from "antd";
import { type JSX, useCallback, useState } from "react";
import { getApiErrorMessage } from "@/utils/request-error";
import type { ApiKeyCreatedResponse, CreateApiKeyRequest } from "../../types";

const { Paragraph } = Typography;

const SCOPE_OPTIONS = [
	{ label: "对话", value: "chat" },
	{ label: "知识库", value: "knowledge" },
	{ label: "模型调用", value: "model" },
	{ label: "管理", value: "admin" },
];

interface CreateKeyModalProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (values: CreateApiKeyRequest) => Promise<ApiKeyCreatedResponse>;
	onSuccess: () => void;
}

export const CreateKeyModal = ({ open, onClose, onSubmit, onSuccess }: CreateKeyModalProps): JSX.Element => {
	const { message } = App.useApp();
	const [form] = Form.useForm<CreateApiKeyRequest>();
	const [loading, setLoading] = useState(false);
	const [createdKey, setCreatedKey] = useState<ApiKeyCreatedResponse | null>(null);

	const handleSubmit = useCallback(async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			const resp = await onSubmit(values);
			setCreatedKey(resp);
			message.success("API Key 创建成功");
			onSuccess();
		} catch (error) {
			message.error(getApiErrorMessage(error, "创建失败，请重试"));
		} finally {
			setLoading(false);
		}
	}, [form, onSubmit, onSuccess, message]);

	const handleClose = useCallback(() => {
		setCreatedKey(null);
		form.resetFields();
		onClose();
	}, [form, onClose]);

	if (createdKey) {
		return (
			<Modal title="API Key 已创建" open={open} onCancel={handleClose} footer={null} width={520}>
				<div className="space-y-4 py-2">
					<div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
						请立即复制并妥善保管以下 Key，关闭后将无法再次查看完整密钥。
					</div>
					<div>
						<div className="text-sm text-[var(--muted-foreground)] mb-1">名称</div>
						<div className="font-medium">{createdKey.name}</div>
					</div>
					<div>
						<div className="text-sm text-[var(--muted-foreground)] mb-1">API Key</div>
						<Paragraph copyable={{ text: createdKey.key }} className="font-mono text-base mb-0 break-all">
							{createdKey.key}
						</Paragraph>
					</div>
				</div>
			</Modal>
		);
	}

	return (
		<Modal
			title="创建 API Key"
			open={open}
			onCancel={handleClose}
			onOk={handleSubmit}
			okText="创建"
			cancelText="取消"
			confirmLoading={loading}
			width={520}
			destroyOnClose
		>
			<Form form={form} layout="vertical" className="pt-2">
				<Form.Item name="name" label="名称" rules={[{ required: true, message: "请输入 Key 名称" }]}>
					<Input placeholder="例如：生产环境调用" maxLength={50} />
				</Form.Item>
				<Form.Item name="scopes" label="权限范围">
					<Select mode="multiple" placeholder="不选则默认全部权限" options={SCOPE_OPTIONS} allowClear />
				</Form.Item>
				<Form.Item name="rateLimit" label="速率限制（次/分钟）">
					<Input type="number" placeholder="留空则使用默认限制" min={1} />
				</Form.Item>
				<Form.Item name="expiresAt" label="过期时间">
					<DatePicker className="w-full" placeholder="不选则永不过期" showTime />
				</Form.Item>
			</Form>
		</Modal>
	);
};
