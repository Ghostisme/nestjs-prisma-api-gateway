import { Button, Form, Input, Modal, message, Radio, Select, Switch } from "antd";
import { useEffect, useState } from "react";
import type { TagRecord, TagSaveParams } from "@/api/services/tagService";
import tagService from "@/api/services/tagService";
import { requiredWithTrim } from "@/utils/formRules";
import { getApiErrorMessage } from "@/utils/request-error";
import { SCOPE_TYPE_OPTIONS } from "../types";

export interface TagFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData: TagRecord | null;
	onSuccess?: () => void;
}

interface TagFormValues {
	name: string;
	required: boolean;
	scopeType: number;
	subTagNames: string[];
}

export default function TagFormModal({ open, onOpenChange, initialData, onSuccess }: TagFormModalProps) {
	const [form] = Form.useForm<TagFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = !!initialData;

	useEffect(() => {
		if (!open) return;
		if (initialData) {
			form.setFieldsValue({
				name: initialData.name,
				required: initialData.required,
				scopeType: initialData.scopeType,
				// subTagNames: initialData.subTags?.map((t) => t.name).join(",") ?? "",
				subTagNames: initialData.subTags?.map((t) => t.name) ?? [],
			});
		} else {
			form.resetFields();
			form.setFieldsValue({ scopeType: 1, required: false });
		}
	}, [open, initialData, form]);

	const handleOk = () => form.submit();

	const onFinish = async (values: TagFormValues) => {
		// const subTagNames = values.subTagNames
		//   .split(/[,，\n]/)
		//   .map((s) => s.trim())
		//   .filter(Boolean);
		const subTagNames = values.subTagNames.map((s) => s.trim()).filter(Boolean);

		if (subTagNames.length === 0) {
			message.warning("请输入至少一个标签内容");
			return;
		}

		const payload: TagSaveParams = {
			name: values.name,
			required: values.required,
			scopeType: values.scopeType,
			subTagNames: subTagNames,
		};

		try {
			setLoading(true);
			if (isEdit && initialData) {
				await tagService.updateTag({ ...payload, id: initialData.id });
				message.success("修改成功");
			} else {
				await tagService.createTag(payload);
				message.success("创建成功");
			}
			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			message.error(getApiErrorMessage(error, isEdit ? "修改失败" : "创建失败"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title={isEdit ? "编辑标签" : "新建标签"}
			open={open}
			onCancel={() => onOpenChange(false)}
			destroyOnHidden
			width={520}
			footer={[
				<Button key="cancel" onClick={() => onOpenChange(false)}>
					取消
				</Button>,
				<Button key="submit" type="primary" loading={loading} onClick={handleOk}>
					确定
				</Button>,
			]}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ style: { width: 100 } }}
				wrapperCol={{ style: { flex: 1 } }}
				onFinish={onFinish}
				autoComplete="off"
				initialValues={{ scopeType: 1, required: false }}
				className="mt-6"
			>
				<div className="flex gap-4">
					<Form.Item name="scopeType" label="应用范围" rules={[{ required: true, message: "请选择应用范围" }]}>
						<Radio.Group
							options={SCOPE_TYPE_OPTIONS.map((opt) => ({
								label: opt.label,
								value: opt.value,
							}))}
						/>
					</Form.Item>
					<Form.Item name="required" label="是否必填" valuePropName="checked">
						<Switch />
					</Form.Item>
				</div>

				<Form.Item name="name" label="标签标题" rules={[requiredWithTrim("请输入标签标题")]}>
					<Input placeholder="请输入标签标题" />
				</Form.Item>

				{/* <Form.Item
          name="subTagNames"
          label="标签内容"
          rules={[{ required: true, message: "请输入标签内容" }]}
          extra="多个标签用逗号分隔"
        >
          <Input.TextArea
            rows={4}
            placeholder="请输入标签内容，多个标签用逗号分隔"
          />
        </Form.Item> */}
				<Form.Item
					name="subTagNames"
					label="标签内容"
					rules={[{ required: true, message: "请输入标签内容" }]}
					validateTrigger="onChange"
				>
					<Select
						mode="tags"
						placeholder="输入后按回车添加标签"
						tokenSeparators={[",", "，"]}
						open={false}
						suffixIcon={null}
						onSearch={(val) => {
							if (val) {
								form.setFields([{ name: "subTagNames", errors: [] }]);
							}
						}}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
}
