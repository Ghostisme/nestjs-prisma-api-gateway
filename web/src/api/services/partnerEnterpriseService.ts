import bffClient from "@/api/bffClient";
import type {
	PartnerEnterpriseRecord,
	PartnerEnterpriseDetail,
	PartnerEnterpriseFormData,
	PartnerUserFormData,
	BrandOption,
} from "@/pages/partnerEnterprise/types";

interface PageResult {
	records: PartnerEnterpriseRecord[];
	total: number;
}

const getPartnerPage = async (params?: Record<string, unknown>): Promise<PageResult> => {
	return bffClient.post<PageResult>("/lumax/v1/partners/page", params ?? {});
};

const getPartnerDetail = async (id: number): Promise<PartnerEnterpriseDetail> => {
	return bffClient.get<PartnerEnterpriseDetail>(`/lumax/v1/partners/${id}`);
};

const getBrandOptions = async (): Promise<BrandOption[]> => {
	return bffClient.get<BrandOption[]>("/lumax/v1/partners/brands");
};

const createPartner = async (data: PartnerEnterpriseFormData): Promise<void> => {
	await bffClient.post("/lumax/v1/partners", data);
};

const updatePartner = async (id: number, data: PartnerEnterpriseFormData): Promise<void> => {
	await bffClient.put(`/lumax/v1/partners/${id}`, data);
};

const enablePartner = async (id: number): Promise<void> => {
	await bffClient.put(`/lumax/v1/partners/${id}/enable`);
};

const disablePartner = async (id: number): Promise<void> => {
	await bffClient.put(`/lumax/v1/partners/${id}/disable`);
};

const deletePartner = async (id: number): Promise<void> => {
	await bffClient.delete(`/lumax/v1/partners/${id}`);
};

const createPartnerUser = async (partnerId: number, data: PartnerUserFormData): Promise<void> => {
	await bffClient.post(`/lumax/v1/partners/${partnerId}/users`, data);
};

export default {
	getPartnerPage,
	getPartnerDetail,
	getBrandOptions,
	createPartner,
	updatePartner,
	enablePartner,
	disablePartner,
	deletePartner,
	createPartnerUser,
};
