import bffClient from "@/api/bffClient";

const subscriptionService = {
	getCurrent: () => bffClient.get("/lumax/v1/subscription/current"),
	getPlans: () => bffClient.get("/lumax/v1/subscription/plans"),
	changePlan: (data: { planTier: string; tokenLimitMonthly?: number; concurrentLimit?: number }) =>
		bffClient.post("/lumax/v1/subscription/change-plan", data),
	updatePlanStatus: (planId: number, status: string) =>
		bffClient.put(`/lumax/v1/subscription/plans/${planId}/status`, { status }),
};

export default subscriptionService;
