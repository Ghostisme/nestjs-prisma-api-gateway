import { useQuery } from "@tanstack/react-query";
import { Select } from "antd";
import { type JSX, useMemo } from "react";
import { getPartnerBrandList, type BrandInfoResponse } from "@/api/partnerEnterpriseManagement";
import type { BrandSelectProps } from "./brandSelect.types";

const PARTNER_BRAND_QUERY_KEY = ["partner-brand-options"] as const;

const isValidBrandOption = (
	brand: BrandInfoResponse,
): brand is BrandInfoResponse & { brandId: number; brandName: string } =>
	typeof brand.brandId === "number" &&
	Number.isFinite(brand.brandId) &&
	typeof brand.brandName === "string" &&
	brand.brandName.trim() !== "";

export const useBrandSelectOptions = (queryEnabled = true) => {
	const { data = [], isPending } = useQuery({
		queryKey: PARTNER_BRAND_QUERY_KEY,
		queryFn: getPartnerBrandList,
		enabled: queryEnabled,
	});

	const options = useMemo(
		() =>
			data.filter(isValidBrandOption).map((brand) => ({
				label: brand.brandName,
				value: brand.brandId,
			})),
		[data],
	);

	return {
		options,
		isLoading: isPending,
	};
};

export function BrandSelect({
	queryEnabled = true,
	placeholder = "Select",
	allowClear = true,
	...props
}: BrandSelectProps): JSX.Element {
	const { options, isLoading } = useBrandSelectOptions(queryEnabled);

	return (
		<Select
			placeholder={placeholder}
			options={options}
			loading={isLoading}
			optionFilterProp="label"
			allowClear={allowClear}
			{...props}
		/>
	);
}
