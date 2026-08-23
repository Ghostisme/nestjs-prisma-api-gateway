/** 知识库状态 */
export type KnowledgeBaseStatus = "active" | "disabled";

/** 知识库摘要统计 */
export interface KnowledgeBaseOverview {
	totalBases: number;
	totalDocuments: number;
	totalReferences: number;
}

/** 知识库标签 */
export interface KnowledgeBaseTag {
	tagId: string;
	tagName: string;
}

/** 知识库卡片数据 */
export interface KnowledgeBaseItem {
	id: string;
	name: string;
	description: string;
	tags: KnowledgeBaseTag[];
	documentCount: number;
	referenceCount: number;
	status: KnowledgeBaseStatus;
	updatedAt: string;
}

/** 知识库列表响应 */
export interface KnowledgeBaseListData {
	overview: KnowledgeBaseOverview;
	items: KnowledgeBaseItem[];
	total: number;
}

/** 知识库文档 */
export interface KnowledgeBaseDocument {
	docId: string;
	fileName: string;
	fileSize: number;
	fileType: string;
	uploadTime: string;
	status: "processing" | "completed" | "failed";
}

/** 知识库创建/编辑表单 */
export interface KnowledgeBaseFormData {
	name: string;
	description: string;
	tags: string[];
}

/** 知识库详情 */
export interface KnowledgeBaseDetail {
	id: string;
	name: string;
	description: string;
	tags: KnowledgeBaseTag[];
	documents: KnowledgeBaseDocument[];
	documentCount: number;
	referenceCount: number;
	status: KnowledgeBaseStatus;
	createdAt: string;
	updatedAt: string;
}
