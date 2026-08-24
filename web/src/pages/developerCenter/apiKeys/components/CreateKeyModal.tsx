import { App, DatePicker, Form, Input, Modal, Select, Typography } from "antd";
import { type JSX, useCallback, useState } from "react";
import { getApiErrorMessage } from "@/utils/request-error";
import type { ApiKeyCreatedResponse, CreateApiKeyRequest } from "../../types";

const { Paragraph } = Typography;

const SCOPE_OPTIONS = [
	{ label: "Chat", value: "chat" },
	{ label: "Knowledge Base", value: "knowledge" },
	{ label: "Model Calls", value: "model" },
	{ label: "Admin", value: "admin" },
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
			message.success("API Key created");
			onSuccess();
		} catch (error) {
			message.error(getApiErrorMessage(error, "Creation failed, please try again"));
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
			<Modal title="API Key Created" open={open} onCancel={handleClose} footer={null} width={520}>
				<div className="space-y-4 py-2">
					<div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
						Copy and store the Key below now. You won't be able to view the full key again after closing.
					</div>
					<div>
						<div className="text-sm text-[var(--muted-foreground)] mb-1">Name</div>
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
			title="Create API Key"
			open={open}
			onCancel={handleClose}
			onOk={handleSubmit}
			okText="Create"
			cancelText="Cancel"
			confirmLoading={loading}
			width={520}
			destroyOnClose
		>
			<Form form={form} layout="vertical" className="pt-2">
				<Form.Item name="name" label="Name" rules={[{ required: true, message: "Enter a Key name" }]}>
					<Input placeholder="e.g. Production calls" maxLength={50} />
				</Form.Item>
				<Form.Item name="scopes" label="Scopes">
					<Select mode="multiple" placeholder="Leave empty for all permissions" options={SCOPE_OPTIONS} allowClear />
				</Form.Item>
				<Form.Item name="rateLimit" label="Rate Limit (per minute)">
					<Input type="number" placeholder="Leave empty to use default limit" min={1} />
				</Form.Item>
				<Form.Item name="expiresAt" label="Expiration">
					<DatePicker className="w-full" placeholder="Leave empty to never expire" showTime />
				</Form.Item>
			</Form>
		</Modal>
	);
};
