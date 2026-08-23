export type UserManagementRecord = {
	userId: number;
	username: string;
	name: string;
	// deptId: number;
	// roleId: number;
	phone: string;
	email: string;
	headImg: string;
	createTime: string;
	status: number;
	deptList: DeptInfo[];
	roleList: RoleInfo[];
	postList: PostInfo[];
};

export interface DeptInfo {
	deptId: string;
	deptName: string;
}

export interface RoleInfo {
	roleId: string;
	roleName: string;
	status: number;
}

export interface PostInfo {
	postId: string;
	postName: string;
}
