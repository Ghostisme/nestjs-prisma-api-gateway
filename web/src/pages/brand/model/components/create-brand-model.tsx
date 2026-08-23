import { Modal, Form, Radio, Select, message } from "antd";
import { useEffect, useState } from "react";
import { postBrandModelSaveApi, postCarModelListApi } from "@/api/brand/model";
import { postBrandGetAllBrandInfoApi } from "@/api/brand/library";

export interface CreateBrandForm {
	/**
	 * 品牌ID
	 */
	brandId: number;
	/**
	 * 车型名称（指定车型必填）
	 */
	modelName?: string;
	/**
	 * 车型类型：1-指定车型，2-全国，3-区域
	 */
	modelType: number;
	/**
	 * 指定车型ID
	 */
	specificModelId?: number;
}

interface CreateBrandModelProps {
	open: boolean;
	onCancel: () => void;
	onOk: () => void;
	initialValues?: Partial<CreateBrandForm>;
}

export const CreateBrandModel = ({ open, onCancel, onOk, initialValues }: CreateBrandModelProps) => {
	const [form] = Form.useForm();
	const modelType = Form.useWatch("modelType", form);
	const brandId = Form.useWatch("brandId", form);
	const [modelOptions, setModelOptions] = useState<any[]>([]);
	const [brandOptions, setBrandOptions] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (open) {
			form.resetFields();
			if (initialValues) {
				form.setFieldsValue(initialValues);
			}
			// 获取品牌列表
			postBrandGetAllBrandInfoApi().then((res: any) => {
				const data = res?.data || res;
				if (Array.isArray(data)) {
					setBrandOptions(
						data.map((item: any) => ({
							label: item.brandName,
							value: item.brandId,
						})),
					);
				}
			});
		}
	}, [open, initialValues, form]);

	// 监听品牌和类型变化，获取指定车型列表
	useEffect(() => {
		if (open && modelType === 1 && brandId) {
			setModelOptions([]); // 清空旧数据
			form.setFieldValue("specificModelId", undefined); // 重置选中项

			const brandOption = brandOptions.find((opt) => opt.value === brandId);
			const brandName = brandOption?.label;

			if (brandName) {
				postCarModelListApi({ brandName, page: 1, size: 100 }).then((res: any) => {
					const data = res?.data || res;
					if (Array.isArray(data)) {
						setModelOptions(
							data.map((item: any) => ({
								label: item.carName,
								value: item.carId,
								original: item,
							})),
						);
					}
				});
			}
		}
	}, [open, modelType, brandId, brandOptions, form]);

	const isEditMode = !!initialValues?.brandId;

	const handleOk = () => {
		form
			.validateFields()
			.then(async (values) => {
				setLoading(true);
				try {
					const submitData: any = {
						...values,
					};

					if (values.modelType === 1) {
						// 指定车型：带上id和名称
						const selectedModel = modelOptions.find((opt) => opt.value === values.specificModelId);
						if (selectedModel) {
							submitData.id = selectedModel.value;
							submitData.modelName = selectedModel.label;
						}
						// 移除辅助字段
						delete submitData.specificModelId;
					} else {
						// 非指定车型：移除 specificModelId
						delete submitData.specificModelId;
					}

					await postBrandModelSaveApi(submitData);
					message.success("保存成功");
					onOk();
				} catch (error) {
					console.error(error);
				} finally {
					setLoading(false);
				}
			})
			.catch((info) => {
				console.log("Validate Failed:", info);
			});
	};

	return (
		<Modal title="新建品牌车型" open={open} onCancel={onCancel} onOk={handleOk} confirmLoading={loading}>
			<Form
				form={form}
				name="basic"
				labelCol={{ span: 5 }}
				wrapperCol={{ span: 19 }}
				style={{ maxWidth: 600 }}
				initialValues={{ remember: true }}
				autoComplete="off"
			>
				<Form.Item<CreateBrandForm>
					label="品牌"
					name="brandId"
					rules={[
						{
							required: true,
							message: "请选择品牌!",
						},
					]}
				>
					{/* 选择品牌 - 如果有初始值(从添加车型进来)则禁用 */}
					<Select options={brandOptions} disabled={isEditMode} placeholder="请选择品牌" />
				</Form.Item>

				<Form.Item<CreateBrandForm>
					label="车型类型"
					name="modelType"
					rules={[{ required: true, message: "请选择车型类型!" }]}
				>
					<Radio.Group>
						<Radio value={1}>指定车型</Radio>
						<Radio value={2}>全国</Radio>
						<Radio value={3}>区域</Radio>
					</Radio.Group>
				</Form.Item>

				{modelType === 1 && (
					<Form.Item<CreateBrandForm>
						label="指定车型"
						name="specificModelId"
						rules={[{ required: true, message: "请选择指定车型!" }]}
					>
						<Select
							options={modelOptions}
							placeholder="请选择车型"
							showSearch
							filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
						/>
					</Form.Item>
				)}
			</Form>
		</Modal>
	);
};
