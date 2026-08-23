import { Modal } from "antd";
import { useEffect, useState } from "react";
import { getSubBrandList } from "@/api/brand/library";
import type { BrandInfo, SubBrandItem } from "@/api/brand/types";
import { useRequestFileHost } from "@/store/appStore";
import { buildMaterialFileUrl } from "@/utils/materialFileUrl";

interface BrandDetailModalProps {
	open: boolean;
	onClose: () => void;
	item: BrandInfo | undefined;
}

export const BrandDetailModal = ({ open, onClose, item }: BrandDetailModalProps) => {
	const fileHost = useRequestFileHost();
	const [detailData, setDetailData] = useState<BrandInfo>();
	const [subBrandList, setSubBrandList] = useState<SubBrandItem[]>([]);

	const fetchSubBrandList = async () => {
		try {
			const res = await getSubBrandList();
			console.log(res, "获取车系车型数据");
			if (res) {
				setSubBrandList(res);
			}
		} catch (error) {
			console.log(error, "获取车系车型数据");
		}
	};

	useEffect(() => {
		if (open && item?.brandId) {
			setDetailData(item);
			fetchSubBrandList();
		} else {
			setDetailData(undefined);
		}
	}, [open, item]);

	const subBrandName = (detailData: BrandInfo) => {
		// const info = subBrandList.find(
		//   (item) => item.brandId === +detailData.subBrandNames,
		// );
		const ids = detailData.subBrandNames?.split(",").map((id) => +id.trim()) ?? [];
		const matched = ids.map((id) => subBrandList.find((item) => item.brandId === id)).filter(Boolean);

		if (matched.length === 0) return "-";
		return matched.map((info) => `${info?.brandName ?? ""}-${info?.subBrandName ?? ""}`).join("、");
		// return `${info?.brandName ?? "-"}-${info?.subBrandName}`;
	};

	const detailList = (detailData: BrandInfo) => {
		return (
			<div>
				<div className="flex items-center gap-2">
					<div className="w-0 h-3 border-[#165DFF] border-2 rounded-2xl"></div>
					<div className="text-[16px]">基本信息</div>
				</div>
				<div className="flex items-center justify-between gap-2 p-4">
					<div className="text-[#86909C] text-sm w-20">品牌名称</div>
					<div className="flex-1">{detailData.brandName}</div>
				</div>
				<div className="flex items-center justify-between gap-2 p-4">
					<div className="text-[#86909C] text-sm w-20">品牌Logo</div>
					<div className="flex-1">
						{/* <Avatar
              shape="square"
              className="w-full h-full object-cover"
              size={80}
              src={buildMaterialFileUrl(fileHost, detailData.brandLogo)}
            /> */}
						<img
							className="w-25 h-25 object-contain"
							src={buildMaterialFileUrl(fileHost, detailData.brandLogo)}
							alt="品牌Logo"
						/>
					</div>
				</div>
				<div className="flex items-center justify-between gap-2 p-4">
					<div className="text-[#86909C] text-sm w-20">关联品牌</div>
					<div className="flex-1">{subBrandName(detailData)}</div>
				</div>
				<div className="flex items-center justify-between gap-2 p-4">
					<div className="text-[#86909C] text-sm w-20">品牌描述</div>
					<div className="flex-1">{detailData.brandIntro || "-"}</div>
				</div>
			</div>
		);
	};

	return (
		<Modal
			title=""
			closable={{ "aria-label": "Custom Close Button" }}
			open={open}
			onOk={onClose}
			onCancel={onClose}
			footer={null}
		>
			{detailData ? detailList(detailData) : <div className="p-4 text-center">加载中...</div>}
		</Modal>
	);
};
