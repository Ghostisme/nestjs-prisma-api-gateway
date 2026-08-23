import { Form, Input, Modal, Select, Spin, Upload } from "antd";
import type { JSX } from "react";
import { Icon } from "@/components/icon";
import { requiredWithTrim } from "@/utils/formRules";
import { useBrandForm } from "../hooks/useBrandForm";
import type { CreateFormModalProps, FormValues } from "../types/create-form-modal.types";

const { TextArea } = Input;

export const CreateFormModal = ({
	isModalOpen,
	onClose,
	type = "create",
	initialValues,
	onSuccess,
}: CreateFormModalProps): JSX.Element => {
	const {
		form,
		isSubmitting,
		isFetchingDetails,
		isUploading,
		brandLogoUrl,
		handleSubmit,
		beforeUpload,
		handleBrandLogoRequest,
		handleUploadChange,
		// getFileListFromEvent,
		subBrandOptions,
		isFetchingSubBrands,
	} = useBrandForm({ isModalOpen, type, initialValues, onSuccess, onClose });

	return (
		<Modal
			title={type === "create" ? "新建品牌" : "编辑品牌"}
			closable={{ "aria-label": "Custom Close Button" }}
			open={isModalOpen}
			onOk={handleSubmit}
			onCancel={onClose}
			confirmLoading={isSubmitting}
		>
			<Spin spinning={isFetchingDetails}>
				<Form
					form={form}
					name="brandForm"
					labelCol={{ span: 5 }}
					wrapperCol={{ span: 16 }}
					style={{ maxWidth: 600 }}
					autoComplete="off"
				>
					<Form.Item<FormValues> name="brandName" label="品牌名称" rules={[requiredWithTrim("请输入品牌名称")]}>
						<Input placeholder="请输入品牌名称" />
					</Form.Item>

					{/* <Form.Item
						label="品牌Logo"
						name="brandLogo"
						valuePropName="fileList"
						getValueFromEvent={getFileListFromEvent}
						rules={[{ required: true, message: "请上传品牌Logo" }]}
						extra={<p className="text-[#999] text-sm">请上传 .PNG/.JPG 格式图片，建议图片尺寸400*400px，限制为5mb</p>}
					>
						<Upload<FormValues>
							accept=".png,.jpg"
							name="avatar"
							listType="picture-card"
							className="avatar-uploader"
							showUploadList={false}
							customRequest={handleBrandLogoRequest}
							beforeUpload={beforeUpload}
							onChange={handleUploadChange}
						>
							{brandLogoUrl ? (
								<img draggable={false} src={brandLogoUrl} alt="品牌Logo" style={{ width: "100%" }} />
							) : (
								<button style={{ border: 0, background: "none" }} type="button">
									{isUploading ? <Icon icon="eos-icons:bubble-loading" /> : <Icon size={15} icon="tdesign:upload" />}
									<div className="text-sm" style={{ marginTop: 8 }}>
										点击上传
									</div>
								</button>
							)}
						</Upload>
					</Form.Item> */}
					<Form.Item
						label="品牌Logo"
						name="brandLogo"
						rules={[{ required: true, message: "请上传品牌Logo" }]}
						extra={<p className="text-[#999] text-sm">请上传 .PNG/.JPG 格式图片，建议图片尺寸400*400px，限制为5mb</p>}
					>
						<Input type="hidden" />
						<Upload
							accept=".png,.jpg"
							name="avatar"
							listType="picture-card"
							className="avatar-uploader"
							showUploadList={false}
							customRequest={handleBrandLogoRequest}
							beforeUpload={beforeUpload}
							onChange={handleUploadChange}
						>
							{brandLogoUrl ? (
								<img draggable={false} src={brandLogoUrl} alt="品牌Logo" className="w-full h-full object-contain" />
							) : (
								<button style={{ border: 0, background: "none" }} type="button">
									{isUploading ? <Icon icon="eos-icons:bubble-loading" /> : <Icon size={15} icon="tdesign:upload" />}
									<div className="text-sm" style={{ marginTop: 8 }}>
										点击上传
									</div>
								</button>
							)}
						</Upload>
					</Form.Item>

					<Form.Item<FormValues>
						name="subBrandId"
						label="关联品牌"
						rules={[{ required: true, message: "请选择关联品牌" }]}
					>
						<Select
							style={{ width: "100%" }}
							placeholder="请选择关联品牌"
							loading={isFetchingSubBrands}
							options={subBrandOptions}
							mode="multiple"
							allowClear
							showSearch
							optionFilterProp="label"
						/>
					</Form.Item>

					<Form.Item<FormValues> name="brandIntro" label="品牌描述">
						<TextArea placeholder="请输入品牌描述" autoSize={{ minRows: 3, maxRows: 12 }} style={{ resize: "none" }} />
					</Form.Item>
				</Form>
			</Spin>
		</Modal>
	);
};
