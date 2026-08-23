// export interface BrandRow {
// 	brandId: number;
// 	brandName: string;
// 	brandLogo: string;
// 	regionCount: number;
// 	pmoId?: number;
// 	pmoName: string;
// 	specialistId?: number;
// 	specialistName: string;
// 	brandStatus: number;
// 	createTime: string;
// 	updateTime: string;
// }

// export interface CreateForm {
// 	brandName: string;
// 	regionIds: number[];
// 	brandLogo: any;
// 	brandIntro: string;
// 	specialistId: number;
// 	specialistName: string;
// 	pmoId: number;
// 	pmoName: string;
// }

export interface BrandLog {
	createByName?: string;
	createTime?: string;
	operationContent?: string;
}
