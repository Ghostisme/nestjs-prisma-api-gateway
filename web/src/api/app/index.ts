import apiClient from "../apiClient";

const Path = "/xdbdt";

/**
 * 分页查询消息
 * /message/page
 */
export const getMessagePageApi = (data: {
	page: number; // 页码
	size: number; // 每页数量
	readFlag: number; // 消息状态(0未读 1已读), 为空表示全部
}) => apiClient.post(`${Path}/message/page`, data);

/**
 * 全部标记已读
 * /message/read/all
 */
export const markAllReadApi = () => apiClient.post(`${Path}/message/read/all`);

/**
 * 单条消息标记已读
 * /message/read/{id}
 */
export const markReadApi = (id: number) => apiClient.post(`${Path}/message/read/${id}`);

/**
 * 查询当前用户未读消息
 * /message/unread
 * data:{
 *  hasNew:boolean 是否有新消息
 *  unreadCount:number 未读消息数量
 * }
 */
export const getUnreadCountApi = () => apiClient.post(`${Path}/message/unread`);

/**
 * 发送消息
 * /message/send
 */
export const sendMessageApi = (data: {
	/**
	 * 创建人 id
	 */
	createBy?: number;
	/**
	 * 是否支持跳转
	 */
	jumpable?: boolean;
	/**
	 * 消息类型
	 */
	messageType: string;
	/**
	 * 前端页面路径
	 */
	pagePath?: string;
	/**
	 * 接收人ID
	 */
	receiveUserId: number;
	/**
	 * 消息模版编码
	 */
	templateCode: string;
	/**
	 * 消息模版占位符参数
	 */
	templateParams?: { key?: string };
	/**
	 * 租户 id
	 */
	tenantId?: number;
	/**
	 * 更新人 id
	 */
	updateBy?: number;
}) => apiClient.post(`${Path}/message/send`, data);
