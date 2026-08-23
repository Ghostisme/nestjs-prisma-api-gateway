import { App, Modal } from "antd";
import { type JSX, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import subscriptionService from "@/api/services/subscriptionService";
import { getApiErrorMessage } from "@/utils/request-error";
import type { PlanConfig } from "../types";
import { CurrentPlanCard } from "./components/CurrentPlanCard";
import { PlanCompareTable } from "./components/PlanCompareTable";

export default function SubscriptionPage(): JSX.Element {
	const { message } = App.useApp();
	const [confirmPlan, setConfirmPlan] = useState<PlanConfig | null>(null);

	const { data: subscription, isLoading: subLoading } = useQuery({
		queryKey: ["subscription-info"],
		queryFn: () => subscriptionService.getCurrent(),
	});

	const { data: plans, isLoading: plansLoading } = useQuery({
		queryKey: ["plan-list"],
		queryFn: () => subscriptionService.getPlans(),
	});

	const handleSelectPlan = useCallback((plan: PlanConfig) => {
		setConfirmPlan(plan);
	}, []);

	const handleConfirmChange = useCallback(async () => {
		if (!confirmPlan) return;
		try {
			await subscriptionService.changePlan({ planTier: confirmPlan.tier });
			message.success(`已切换至「${confirmPlan.name}」`);
			setConfirmPlan(null);
		} catch (error) {
			message.error(getApiErrorMessage(error, "套餐变更失败"));
		}
	}, [confirmPlan, message]);

	return (
		<div className="space-y-6">
			<h2 className="text-lg font-semibold text-[var(--foreground)]">订阅管理</h2>

			<CurrentPlanCard subscription={subscription ?? null} loading={subLoading} />

			<div className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]">
				<h3 className="text-base font-medium text-[var(--foreground)] mb-4">套餐对比</h3>
				<PlanCompareTable
					plans={plans ?? []}
					currentTier={subscription?.planTier}
					loading={plansLoading}
					onSelect={handleSelectPlan}
				/>
			</div>

			<Modal
				title="确认变更套餐"
				open={!!confirmPlan}
				onCancel={() => setConfirmPlan(null)}
				onOk={handleConfirmChange}
				okText="确认变更"
				cancelText="取消"
			>
				{confirmPlan && (
					<div className="py-2 space-y-2">
						<p>
							确认将套餐从 <strong>{subscription?.planName}</strong> 变更为 <strong>{confirmPlan.name}</strong>？
						</p>
						<p className="text-[var(--muted-foreground)] text-sm">
							变更后将在下个计费周期生效，月费为 ¥{confirmPlan.priceMonthly}。
						</p>
					</div>
				)}
			</Modal>
		</div>
	);
}
