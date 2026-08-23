import { Button as AntButton } from "antd";
import { Loader2 } from "lucide-react";
import type { ReactElement } from "react";
import type { LoginTenantSelectProps } from "./LoginTenantSelect.types";
import { ReturnButton } from "./ReturnButton";

const isTenantDisabled = (status?: number): boolean => status === 1;

export function LoginTenantSelect({
	options,
	selectedTenantId,
	loading,
	onBack,
	onConfirm,
	onSelect,
}: LoginTenantSelectProps): ReactElement {
	return (
		<div className="flex h-full flex-col gap-5 py-2">
			<div className="-ml-3 w-fit">
				<ReturnButton onClick={onBack} />
			</div>

			<div className="space-y-2">
				<h2 className="text-base font-semibold leading-none text-foreground">Select your organization</h2>
			</div>

			<div className="flex-1 space-y-3 overflow-y-auto pr-1">
				{options.map((option) => {
					const tenantId = option.tenantId;
					const disabled = !tenantId || isTenantDisabled(option.status);
					const isSelected = tenantId === selectedTenantId;

					return (
						<AntButton
							key={tenantId ?? option.tenantCode ?? option.tenantName}
							type={isSelected ? "primary" : "default"}
							color={isSelected ? "primary" : undefined}
							variant={isSelected ? "outlined" : "outlined"}
							block
							disabled={disabled}
							className={`h-10 rounded-xl text-sm font-medium shadow-none ${
								isSelected ? "" : "text-[#2F6BFF] hover:!text-[#2F6BFF]"
							} ${disabled ? "opacity-55" : ""}`}
							onClick={() => {
								if (!tenantId || disabled) return;
								onSelect(tenantId);
							}}
						>
							{option.tenantName || option.tenantCode || "Unnamed organization"}
							{disabled ? " (disabled)" : ""}
						</AntButton>
					);
				})}
			</div>

			<AntButton
				type="primary"
				block
				className="mt-2 h-11 rounded-xl px-8 text-sm font-medium shadow-sm"
				disabled={!selectedTenantId}
				onClick={onConfirm}
			>
				{loading && <Loader2 className="mr-2 inline-block animate-spin" />}
				Confirm
			</AntButton>
		</div>
	);
}
