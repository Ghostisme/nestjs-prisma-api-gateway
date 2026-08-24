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
			message.success(`Switched to "${confirmPlan.name}"`);
			setConfirmPlan(null);
		} catch (error) {
			message.error(getApiErrorMessage(error, "Plan change failed"));
		}
	}, [confirmPlan, message]);

	return (
		<div className="space-y-6">
			<h2 className="text-lg font-semibold text-[var(--foreground)]">Subscription Management</h2>

			<CurrentPlanCard subscription={subscription ?? null} loading={subLoading} />

			<div className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]">
				<h3 className="text-base font-medium text-[var(--foreground)] mb-4">Plan Comparison</h3>
				<PlanCompareTable
					plans={plans ?? []}
					currentTier={subscription?.planTier}
					loading={plansLoading}
					onSelect={handleSelectPlan}
				/>
			</div>

			<Modal
				title="Confirm Plan Change"
				open={!!confirmPlan}
				onCancel={() => setConfirmPlan(null)}
				onOk={handleConfirmChange}
				okText="Confirm Change"
				cancelText="Cancel"
			>
				{confirmPlan && (
					<div className="py-2 space-y-2">
						<p>
							Change plan from <strong>{subscription?.planName}</strong> to <strong>{confirmPlan.name}</strong>?
						</p>
						<p className="text-[var(--muted-foreground)] text-sm">
							The change takes effect next billing cycle. Monthly price: ¥{confirmPlan.priceMonthly}.
						</p>
					</div>
				)}
			</Modal>
		</div>
	);
}
