import { App, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { type JSX, useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiKeyService from "@/api/services/apiKeyService";
import { getApiErrorMessage } from "@/utils/request-error";
import type { ApiKeyCreatedResponse, CreateApiKeyRequest } from "../types";
import { ApiKeyTable } from "./components/ApiKeyTable";
import { CreateKeyModal } from "./components/CreateKeyModal";

export default function ApiKeysPage(): JSX.Element {
	const { message } = App.useApp();
	const queryClient = useQueryClient();
	const [createModalOpen, setCreateModalOpen] = useState(false);

	const { data: keyList, isLoading } = useQuery({
		queryKey: ["api-keys"],
		queryFn: () => apiKeyService.list(),
	});

	const revokeMutation = useMutation({
		mutationFn: (id: number) => apiKeyService.revoke(id),
		onSuccess: () => {
			message.success("Revoked");
			queryClient.invalidateQueries({ queryKey: ["api-keys"] });
		},
		onError: (error) => message.error(getApiErrorMessage(error, "Revoke failed")),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => apiKeyService.remove(id),
		onSuccess: () => {
			message.success("Deleted");
			queryClient.invalidateQueries({ queryKey: ["api-keys"] });
		},
		onError: (error) => message.error(getApiErrorMessage(error, "Delete failed")),
	});

	const handleCreateSubmit = useCallback(async (values: CreateApiKeyRequest): Promise<ApiKeyCreatedResponse> => {
		return apiKeyService.create(values);
	}, []);

	const handleCreateSuccess = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["api-keys"] });
	}, [queryClient]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold text-[var(--foreground)]">API Key Management</h2>
				<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
					Create API Key
				</Button>
			</div>

			<div className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]">
				<ApiKeyTable
					dataSource={keyList ?? []}
					loading={isLoading}
					onRevoke={(id) => revokeMutation.mutate(id)}
					onDelete={(id) => deleteMutation.mutate(id)}
				/>
			</div>

			<CreateKeyModal
				open={createModalOpen}
				onClose={() => setCreateModalOpen(false)}
				onSubmit={handleCreateSubmit}
				onSuccess={handleCreateSuccess}
			/>
		</div>
	);
}
