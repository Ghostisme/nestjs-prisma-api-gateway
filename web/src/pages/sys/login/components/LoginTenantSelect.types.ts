import type { LoginTenantOptionVO } from "@/api/services/userService";

export interface LoginTenantSelectProps {
	options: LoginTenantOptionVO[];
	selectedTenantId?: number;
	loading: boolean;
	onBack: () => void;
	onConfirm: () => void;
	onSelect: (tenantId: number) => void;
}
