import { Button, Input, Popconfirm } from "antd";
import { Icon } from "@/components/icon";
import type { CommunityInfo } from "@/api/brand/types";
import { useEffect } from "react";

interface BrandListIdsProps {
	value?: CommunityInfo[];
	onChange?: (value: CommunityInfo[]) => void;
}

const getUid = () => Math.random().toString(36).slice(2);

export const BrandListIds = ({ value = [], onChange }: BrandListIdsProps) => {
	// 确保至少有一个输入框
	const list = value.length > 0 ? value : [{ regionName: "", community: "", uid: getUid() }];

	useEffect(() => {
		// 如果有数据没有 uid，则补全
		if (value.some((item) => !item.uid)) {
			const newValue = value.map((item) => (item.uid ? item : { ...item, uid: getUid() }));
			onChange?.(newValue);
		}
	}, [value, onChange]);

	const triggerChange = (newList: CommunityInfo[]) => {
		onChange?.(newList);
	};

	const handleChange = (index: number, field: keyof CommunityInfo, newValue: string) => {
		const newList = [...list];
		newList[index] = { ...newList[index], [field]: newValue };
		triggerChange(newList);
	};

	const removeChange = (index: number) => {
		const newList = [...list];
		newList.splice(index, 1);
		// 如果删完了，自动补一个空项
		if (newList.length === 0) {
			newList.push({ regionName: "", community: "", uid: getUid() });
		}
		triggerChange(newList);
	};

	const keyDownChange = (index: number, e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault(); // 防止触发表单提交
			if (index === list.length - 1) {
				const newList = [...list, { regionName: "", community: "", uid: getUid() }];
				triggerChange(newList);
			}
		}
	};

	return (
		<div className="flex flex-col gap-2">
			{list.map((item, idx) => (
				<div key={item.uid || idx} className="flex items-center gap-2">
					<Input
						value={item.regionName}
						onChange={(e) => handleChange(idx, "regionName", e.target.value)}
						onKeyDown={(e) => keyDownChange(idx, e)}
						placeholder="请输入大区名称"
					/>
					<Input
						value={item.community}
						onChange={(e) => handleChange(idx, "community", e.target.value)}
						onKeyDown={(e) => keyDownChange(idx, e)}
						placeholder="请输入小区名称"
					/>
					{list.length > 1 && (
						<Popconfirm title="确认删除吗？" onConfirm={() => removeChange(idx)} okText="确认" cancelText="取消">
							<div className="cursor-pointer hover:text-red-500">
								<Icon icon="material-symbols:delete-outline-rounded" size={16} />
							</div>
						</Popconfirm>
					)}
				</div>
			))}
			<div>
				<Button
					className="px-0!"
					type="link"
					onClick={() => triggerChange([...list, { regionName: "", community: "", uid: getUid() }])}
				>
					<Icon icon="material-symbols:add-rounded" size={16}></Icon>
					添加
				</Button>
			</div>
		</div>
	);
};
