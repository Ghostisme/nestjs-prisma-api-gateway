/** 合作企业记录 */
export interface PartnerEnterpriseRecord {
	partnerId: number;
	brandName: string;
	partnerName: string;
	userCount: number;
	status: number;
	joinTime: string;
}

/** 合作企业详情 */
export interface PartnerEnterpriseDetail {
	partnerId: number;
	brandId: number;
	brandName: string;
	partnerName: string;
	contactPerson: string;
	contactPhone: string;
	productFunctions: string[];
	backendModules: string[];
	aiFunctions: number[];
	userCount: number;
	status: number;
	joinTime: string;
}

/** 合作企业创建/编辑表单 */
export interface PartnerEnterpriseFormData {
	brandId?: number;
	name: string;
	principal: string;
	phone: string;
	businessList: string[];
	backendModules: number[];
	aiCodeList: number[];
	status: number;
}

/** 合作企业用户创建表单 */
export interface PartnerUserFormData {
	username: string;
	password: string;
	confirmPassword: string;
	name: string;
	email?: string;
	phone?: string;
	status: number;
	tenantId: number;
}

/** 品牌选项 */
export interface BrandOption {
	brandId: number;
	brandName: string;
}
