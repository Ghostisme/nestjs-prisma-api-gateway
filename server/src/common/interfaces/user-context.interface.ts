export interface UserContext {
  tenantId: number;
  userId: number;
  username: string;
  nickname?: string;
  deptId?: number;
  deptName?: string;
  roles: string[];
  permissions: string[];
}
