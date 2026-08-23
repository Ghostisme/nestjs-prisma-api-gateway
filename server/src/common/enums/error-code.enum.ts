export enum ErrorCode {
  SUCCESS = 0,
  FAIL = 1,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  TOKEN_EXPIRED = 424,

  // 10100 ~ 10199: Token / 配额
  QUOTA_INSUFFICIENT = 10101,
  QUOTA_ALREADY_UNLIMITED = 10102,
  QUOTA_DECREASE_EXCEEDS = 10103,

  // 10200 ~ 10299: 对话
  CONVERSATION_NOT_FOUND = 10201,
  CONVERSATION_ALREADY_ENDED = 10202,

  // 10300 ~ 10399: 反馈
  FEEDBACK_DUPLICATE = 10301,

  // 10400 ~ 10499: 违禁词
  BANNED_WORD_EXISTS = 10401,
  BANNED_WORD_CATEGORY_NOT_FOUND = 10402,

  // 10500 ~ 10599: 知识库
  KNOWLEDGE_BASE_NOT_FOUND = 10501,
  KNOWLEDGE_BASE_DISABLED = 10502,
  DOCUMENT_UPLOAD_FAILED = 10503,

  // 10600 ~ 10699: 合作企业
  PARTNER_NOT_FOUND = 10601,
  PARTNER_NAME_EXISTS = 10602,
  PARTNER_HAS_USERS = 10603,

  // 10700 ~ 10799: 字典
  DICT_TYPE_NOT_FOUND = 10701,

  // 11000 ~ 11099: LLM 模型
  LLM_MODEL_NOT_FOUND = 11001,
  LLM_MODEL_CODE_EXISTS = 11002,
  LLM_MODEL_DISABLED = 11003,

  // 10800 ~ 10899: 文件
  FILE_UPLOAD_FAILED = 10801,
  FILE_DOWNLOAD_FAILED = 10802,

  // 10900 ~ 10999: 用户
  USER_NOT_FOUND = 10901,
  USER_ALREADY_EXISTS = 10902,

  // 11100 ~ 11199: API Key
  API_KEY_NOT_FOUND = 11101,
  API_KEY_ALREADY_REVOKED = 11102,
  API_KEY_EXPIRED = 11103,
  API_KEY_LIMIT_EXCEEDED = 11104,

  // 11200 ~ 11299: 订阅
  SUBSCRIPTION_NOT_FOUND = 11201,
  PLAN_NOT_FOUND = 11202,
  PLAN_CHANGE_NOT_ALLOWED = 11203,

  // 11300 ~ 11399: Agent 监控
  AGENT_RUN_NOT_FOUND = 11301,
}

export const ErrorMessage: Record<number, string> = {
  [ErrorCode.SUCCESS]: '操作成功',
  [ErrorCode.FAIL]: '操作失败，请稍后重试',
  [ErrorCode.UNAUTHORIZED]: '未登录或登录已过期，请重新登录',
  [ErrorCode.FORBIDDEN]: '无权限访问该资源',
  [ErrorCode.NOT_FOUND]: '请求的资源不存在',
  [ErrorCode.TOKEN_EXPIRED]: '登录凭证已过期，请重新登录',

  [ErrorCode.QUOTA_INSUFFICIENT]: 'Token 配额不足，请联系管理员增加配额',
  [ErrorCode.QUOTA_ALREADY_UNLIMITED]: '该用户配额已是不限制状态',
  [ErrorCode.QUOTA_DECREASE_EXCEEDS]: '减少后的配额不能低于已使用量',

  [ErrorCode.CONVERSATION_NOT_FOUND]: '对话记录不存在',
  [ErrorCode.CONVERSATION_ALREADY_ENDED]: '该对话已结束',

  [ErrorCode.FEEDBACK_DUPLICATE]: '您已对该消息提交过反馈',

  [ErrorCode.BANNED_WORD_EXISTS]: '该违禁词已存在',
  [ErrorCode.BANNED_WORD_CATEGORY_NOT_FOUND]: '违禁词类型不存在',

  [ErrorCode.KNOWLEDGE_BASE_NOT_FOUND]: '知识库不存在',
  [ErrorCode.KNOWLEDGE_BASE_DISABLED]: '知识库已被禁用',
  [ErrorCode.DOCUMENT_UPLOAD_FAILED]: '文档上传失败',

  [ErrorCode.PARTNER_NOT_FOUND]: '合作企业不存在',
  [ErrorCode.PARTNER_NAME_EXISTS]: '合作企业名称已存在',
  [ErrorCode.PARTNER_HAS_USERS]: '该企业下存在关联用户，无法删除',

  [ErrorCode.DICT_TYPE_NOT_FOUND]: '字典类型不存在',

  [ErrorCode.FILE_UPLOAD_FAILED]: '文件上传失败',
  [ErrorCode.FILE_DOWNLOAD_FAILED]: '文件下载失败',

  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.USER_ALREADY_EXISTS]: '用户已存在',

  [ErrorCode.LLM_MODEL_NOT_FOUND]: 'LLM 模型不存在',
  [ErrorCode.LLM_MODEL_CODE_EXISTS]: '模型编码已存在',
  [ErrorCode.LLM_MODEL_DISABLED]: '该模型已被禁用',

  [ErrorCode.API_KEY_NOT_FOUND]: 'API Key 不存在',
  [ErrorCode.API_KEY_ALREADY_REVOKED]: 'API Key 已被吊销',
  [ErrorCode.API_KEY_EXPIRED]: 'API Key 已过期',
  [ErrorCode.API_KEY_LIMIT_EXCEEDED]: 'API Key 数量已达上限',

  [ErrorCode.SUBSCRIPTION_NOT_FOUND]: '订阅信息不存在',
  [ErrorCode.PLAN_NOT_FOUND]: '套餐不存在',
  [ErrorCode.PLAN_CHANGE_NOT_ALLOWED]: '当前状态不允许变更套餐',

  [ErrorCode.AGENT_RUN_NOT_FOUND]: 'Agent 执行记录不存在',
};
