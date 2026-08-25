/**
 * 演示管理页的假数据（仅 AUTH_MOCK=true 时经 DemoAdminController 返回）。
 *
 * 目的：让 portfolio 演示站的后台“看起来在运转”——用户/角色/部门/合作企业列表
 * 有像样的内容，而非空表格。字段名与前端表格列严格对齐（见各页 columns 定义），
 * 否则列会显示空白。
 *
 * ⚠️ 各页 status 语义并不统一（前端逐页自定义映射），务必按注释取值：
 *   - 用户页：0=启用, 1=禁用（与 BasicStatus 相反）
 *   - 角色页：0=禁用, 1=启用（与 BasicStatus 一致）
 *   - 合作企业页：0=Enabled, 1=Disabled
 */

/** 可用智能体：登录后 AgentSelect 下拉展示，label=agentName、value=agentCode。 */
export const DEMO_AGENTS = [
  {
    id: 1,
    agentCode: 1001,
    agentName: '智能客服助手',
    agentIntro: '7×24 多轮对话客服，支持知识库检索与工单转接',
    agentLogo: '',
    aiCapabilityCode: 1,
    selected: 1,
  },
  {
    id: 2,
    agentCode: 1002,
    agentName: '营销文案生成',
    agentIntro: '按品牌调性批量生成小红书/公众号文案',
    agentLogo: '',
    aiCapabilityCode: 2,
    selected: 0,
  },
  {
    id: 3,
    agentCode: 1003,
    agentName: '数据分析师',
    agentIntro: '自然语言查询业务数据并生成图表洞察',
    agentLogo: '',
    aiCapabilityCode: 3,
    selected: 0,
  },
];

/**
 * 用户管理列表记录。
 * 列：userId / name / username / deptList(所属部门,取deptName拼接) /
 *     roleList(所属角色) / phone / email / status(0启用1禁用) / createTime。
 */
export const DEMO_USERS = [
  {
    userId: 1,
    username: 'admin',
    name: '李智',
    phone: '13800138000',
    email: 'admin@lumax.demo',
    headImg: '',
    status: 0,
    createTime: '2025-03-12 09:24:11',
    deptList: [{ deptId: '1', deptName: '技术部' }],
    roleList: [{ roleId: '1', roleName: '超级管理员', status: 1 }],
    postList: [{ postId: '1', postName: '技术负责人' }],
  },
  {
    userId: 2,
    username: 'zhangwei',
    name: '张伟',
    phone: '13700137001',
    email: 'zhangwei@lumax.demo',
    headImg: '',
    status: 0,
    createTime: '2025-04-02 14:10:33',
    deptList: [{ deptId: '2', deptName: '产品部' }],
    roleList: [{ roleId: '2', roleName: '运营', status: 1 }],
    postList: [{ postId: '2', postName: '产品经理' }],
  },
  {
    userId: 3,
    username: 'lina',
    name: '李娜',
    phone: '13600136002',
    email: 'lina@lumax.demo',
    headImg: '',
    status: 0,
    createTime: '2025-04-18 11:02:47',
    deptList: [{ deptId: '3', deptName: '市场部' }],
    roleList: [{ roleId: '3', roleName: '普通成员', status: 1 }],
    postList: [{ postId: '3', postName: '市场专员' }],
  },
  {
    userId: 4,
    username: 'wangfang',
    name: '王芳',
    phone: '13500135003',
    email: 'wangfang@lumax.demo',
    headImg: '',
    status: 1, // 禁用（演示不同状态）
    createTime: '2025-05-06 16:41:09',
    deptList: [{ deptId: '2', deptName: '产品部' }],
    roleList: [{ roleId: '3', roleName: '普通成员', status: 1 }],
    postList: [{ postId: '4', postName: '设计师' }],
  },
  {
    userId: 5,
    username: 'chenjie',
    name: '陈杰',
    phone: '13400134004',
    email: 'chenjie@lumax.demo',
    headImg: '',
    status: 0,
    createTime: '2025-06-21 08:55:20',
    deptList: [{ deptId: '1', deptName: '技术部' }],
    roleList: [{ roleId: '2', roleName: '运营', status: 1 }],
    postList: [{ postId: '5', postName: '后端工程师' }],
  },
];

/**
 * 角色管理列表记录。
 * 列：roleId / roleName / roleDesc / status(0禁用1启用) / createTime。
 */
export const DEMO_ROLES = [
  {
    roleId: 1,
    roleName: '超级管理员',
    roleDesc: '拥有系统全部权限，可管理用户、角色、部门与租户',
    status: 1,
    createTime: '2025-03-01 10:00:00',
  },
  {
    roleId: 2,
    roleName: '运营',
    roleDesc: '负责日常内容运营与数据查看，无系统配置权限',
    status: 1,
    createTime: '2025-03-05 10:00:00',
  },
  {
    roleId: 3,
    roleName: '普通成员',
    roleDesc: '仅可使用 AI 能力与查看个人数据',
    status: 1,
    createTime: '2025-03-08 10:00:00',
  },
  {
    roleId: 4,
    roleName: '访客',
    roleDesc: '只读演示角色，已停用',
    status: 0,
    createTime: '2025-03-10 10:00:00',
  },
];

/**
 * 部门管理列表记录。
 * 列：deptId / deptName / deptLeader / leaderPhone / userCount / updateTime。
 */
export const DEMO_DEPARTMENTS = [
  {
    deptId: 1,
    deptIdName: 'TECH',
    deptName: '技术部',
    deptLeader: '李智',
    leaderPhone: '13800138000',
    sortOrder: 1,
    userCount: 12,
    updateTime: '2025-06-20 09:00:00',
  },
  {
    deptId: 2,
    deptIdName: 'PRODUCT',
    deptName: '产品部',
    deptLeader: '张伟',
    leaderPhone: '13700137001',
    sortOrder: 2,
    userCount: 6,
    updateTime: '2025-06-18 09:00:00',
  },
  {
    deptId: 3,
    deptIdName: 'MARKET',
    deptName: '市场部',
    deptLeader: '李娜',
    leaderPhone: '13600136002',
    sortOrder: 3,
    userCount: 4,
    updateTime: '2025-06-15 09:00:00',
  },
];

/**
 * 合作企业（租户）列表记录 —— 类型 TenantPageVO。
 * 列：id / brandName / name / userNumber(字符串!) / status(0启用1禁用) / joinTime。
 */
export const DEMO_PARTNERS = [
  {
    id: 1,
    brandId: 101,
    brandName: '星云科技',
    name: '星云科技有限公司',
    userNumber: '38',
    status: 0,
    joinTime: '2025-02-11 10:20:00',
  },
  {
    id: 2,
    brandId: 102,
    brandName: '蓝海传媒',
    name: '蓝海文化传媒集团',
    userNumber: '21',
    status: 0,
    joinTime: '2025-03-27 15:05:00',
  },
  {
    id: 3,
    brandId: 103,
    brandName: '云图教育',
    name: '云图在线教育科技',
    userNumber: '15',
    status: 1, // 停用（演示不同状态）
    joinTime: '2025-05-09 11:48:00',
  },
];
