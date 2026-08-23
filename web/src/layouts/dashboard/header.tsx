import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
// import { Icon } from "@/components/icon";
import { useSettings } from "@/store/settingStore";
// import { Button } from "@/ui/button";
import { cn } from "@/utils";
import AccountDropdown from "../components/account-dropdown";
import BreadCrumb from "../components/bread-crumb";
import { DownloadCenter } from "../components/download-center";
import { StorageInfo } from "../components/storage-info";
import { UploadCenter } from "../components/upload-center";

// import NoticeButton from "../components/notice";

// import SearchBar from "../components/search-bar";

// import SettingButton from "../components/setting-button";

interface HeaderProps {
	leftSlot?: ReactNode;
}

export default function Header({ leftSlot }: HeaderProps) {
	const { breadCrumb } = useSettings();
	return (
		<header
			data-slot="slash-layout-header"
			className={cn(
				"sticky top-0 left-0 right-0 z-app-bar z-10",
				"flex items-center justify-between px-2 grow-0 shrink-0",
				"bg-background/60 backdrop-blur-xl",
				"h-[var(--layout-header-height)]",
			)}
		>
			<div className="flex items-center">
				{leftSlot}

				<div className="hidden! md:block ml-4">{breadCrumb && <BreadCrumb />}</div>
			</div>

			<div className="flex items-center gap-3">
				{/* <SearchBar /> */}
				{/* <Button
					variant="ghost"
					size="icon"
					className="rounded-full"
					onClick={() => window.open("https://github.com/d3george/slash-admin")}
				>
					<Icon icon="mdi:github" size={24} />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="rounded-full"
					onClick={() => window.open("https://discord.gg/fXemAXVNDa")}
				>
					<Icon icon="carbon:logo-discord" size={24} />
				</Button> */}
				{/* <NoticeButton /> */}
				{/* <SettingButton /> */}
				<StorageInfo />
				<AuthGuard check={LMX_ADMIN_PERMISSIONS.global_upload}>
					<UploadCenter />
				</AuthGuard>
				<AuthGuard check={LMX_ADMIN_PERMISSIONS.global_download}>
					<DownloadCenter />
				</AuthGuard>
				<AccountDropdown />
			</div>
		</header>
	);
}
