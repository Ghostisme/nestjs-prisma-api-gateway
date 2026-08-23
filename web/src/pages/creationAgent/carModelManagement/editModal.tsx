import { Form, Input, Modal, Select, message } from "antd";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createCarModel, updateCarModel } from "@/api/creationAgent";

export default ({ visible, data, onClose, onRefresh }: Props) => {
	const [form] = Form.useForm();
	const [submitting, setSubmitting] = useState(false);

	const onFinish = async (values: Record<string, any>) => {
		try {
			setSubmitting(true);
			const payload = {
				modelName: values.modelName,
				coverImageUrl: values.coverImageUrl?.[0]?.url || values.coverImageUrl?.[0]?.response?.url || "",
				sellingPoints: values.sellingPoints || [],
				promotionPolicies: values.promotionPolicies || [],
			};

			if (data?.id) {
				await updateCarModel({ id: data.id, ...payload });
				toast.success("编辑成功");
			} else {
				await createCarModel(payload);
				toast.success("添加成功");
			}
			onRefresh();
			onClose();
		} catch (error) {
			console.error("Save error:", error);
			message.error("保存失败");
		} finally {
			setSubmitting(false);
		}
	};

	useEffect(() => {
		if (visible) {
			if (data && Object.keys(data).length) {
				form.setFieldsValue({
					modelName: data.modelName || data.model,
					sellingPoints: data.sellingPoints?.map((t: any) => t.name || t) || [],
					promotionPolicies:
						data.promotionPolicies?.map((t: any) => t.name || t) || data.policies?.map((t: any) => t.name || t) || [],
					coverImageUrl:
						data.coverImageUrl || data.cover
							? [
									{
										uid: "-1",
										name: "cover.png",
										status: "done",
										url: data.coverImageUrl || data.cover,
									},
								]
							: [],
				});
			} else {
				form.resetFields();
			}
		}
	}, [visible, data, form]);

	return (
		<Modal
			open={visible}
			destroyOnHidden
			width={564}
			onCancel={onClose}
			title={data?.id ? "编辑" : "新增"}
			onOk={() => form.submit()}
			confirmLoading={submitting}
		>
			<Form form={form} autoComplete={"off"} layout={"vertical"} onFinish={onFinish}>
				<Form.Item label={"车型名称"} name={"modelName"} rules={[{ required: true, message: "车型名称不能为空" }]}>
					<Input placeholder="请输入车型名称" />
				</Form.Item>

				<Form.Item label={"车型卖点"} name={"sellingPoints"} rules={[{ required: true, message: "车型卖点不能为空" }]}>
					<Select mode="tags" placeholder="请输入车型卖点，输入后按回车" tokenSeparators={[","]} />
				</Form.Item>

				<Form.Item
					label={"优惠政策"}
					name={"promotionPolicies"}
					rules={[{ required: true, message: "优惠政策不能为空" }]}
				>
					<Select mode="tags" placeholder="请输入优惠政策，输入后按回车" tokenSeparators={[","]} />
				</Form.Item>

				{/* <Form.Item label={"PNG封面"} name={"coverImageUrl"} valuePropName="fileList" getValueFromEvent={normFile}>
					<Upload listType="picture-card" maxCount={1} beforeUpload={() => false} accept="image/png">
						<div>
							<Icon icon="mdi:plus" size={24} color="#86909C" />
							<div className="mt-2 text-[#86909C]">上传封面</div>
						</div>
					</Upload>
				</Form.Item> */}
			</Form>
		</Modal>
	);
};

interface Props {
	visible: boolean;
	data: Record<string, any>;
	onClose(): void;
	onRefresh(): void;
	getBrandSeriesContent?(record: Record<string, any>): string;
}
