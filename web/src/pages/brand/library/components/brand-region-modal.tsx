import { Modal, message, Table } from "antd";
import { useEffect, useState } from "react";
import { postBrandGetRegionsByBrandIdApi } from "@/api/brand/library";
import { getApiErrorMessage } from "@/utils/request-error";

// import type { BrandRow } from "../types";
// import type { BrandInfo } from "@/api/brand/types";

interface CommunityInfoVO {
	communityId?: number;
	communityName?: string;
	[property: string]: any;
}

interface BrandRegionDetailVO {
	communityInfos?: CommunityInfoVO[];
	joinTime?: string;
	regionId?: number;
	regionName?: string;
	[property: string]: any;
}

interface RegionTableItem {
	regionId?: number;
	regionName?: string;
	communityId?: number;
	communityName?: string;
	joinTime?: string;
}

interface BrandRegionModalProps {
	open: boolean;
	onClose: () => void;
	brandId: number | undefined;
}

export const BrandRegionModal = ({ open, onClose, brandId }: BrandRegionModalProps) => {
	const [detailData, setDetailData] = useState<BrandRegionDetailVO[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (open && brandId) {
			setLoading(true);
			postBrandGetRegionsByBrandIdApi({ brandId })
				.then((res: any) => {
					setDetailData(res?.data || res || []);
				})
				.catch((err) => {
					console.error(err);
					message.error(getApiErrorMessage(err, "Failed to load details"));
				})
				.finally(() => {
					setLoading(false);
				});
		} else {
			setDetailData([]);
		}
	}, [open, brandId]);

	const dataSource: RegionTableItem[] =
		detailData?.flatMap((region): RegionTableItem[] => {
			if (!region.communityInfos || region.communityInfos.length === 0) {
				return [
					{
						regionId: region.regionId,
						regionName: region.regionName,
						communityId: undefined,
						communityName: undefined,
						joinTime: region.joinTime,
					},
				];
			}
			return region.communityInfos.map((community) => ({
				regionId: region.regionId,
				regionName: region.regionName,
				communityId: community.communityId,
				communityName: community.communityName,
				joinTime: region.joinTime,
			}));
		}) || [];

	const columns = [
		{
			title: "Region ID",
			dataIndex: "regionId",
			key: "regionId",
			// width: 100,
		},
		{
			title: "Region Name",
			dataIndex: "regionName",
			key: "regionName",
			// width: 150,
		},
		{
			title: "Community Name",
			dataIndex: "communityName",
			key: "communityName",
			render: (text: string) => text || "-",
		},
		{
			title: "Join Time",
			dataIndex: "joinTime",
			key: "joinTime",
			// width: 180,
			render: (text: string) => text || "-",
		},
	];

	return (
		<Modal
			title="Regions"
			closable={{ "aria-label": "Custom Close Button" }}
			open={open}
			onCancel={onClose}
			footer={null}
			width={800}
		>
			<Table<RegionTableItem>
				loading={loading}
				dataSource={dataSource}
				columns={columns}
				pagination={false}
				rowKey={(record) => `${record.regionId}-${record.communityId || "empty"}`}
				scroll={{ y: 500 }}
			/>
		</Modal>
	);
};
