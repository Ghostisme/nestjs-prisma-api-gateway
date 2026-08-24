import { Icon } from "@/components/icon";
import { useOccupySize } from "@/store/appStore";

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = 1024 * 1024;
const BYTES_PER_GB = 1024 * 1024 * 1024;

function toGB(size: string): string {
	const trimmed = size.trim();
	const match = trimmed.match(/^([\d.]+)\s*([KMGT]?B?)$/i);
	if (!match) {
		const num = Number(trimmed);
		if (!Number.isNaN(num) && num >= 0) {
			return (num / BYTES_PER_GB).toFixed(2);
		}
		return trimmed;
	}

	const value = Number(match[1]);
	const unit = (match[2] || "B").toUpperCase().replace(/^B$/, "");

	let bytes: number;
	switch (unit) {
		case "KB":
			bytes = value * BYTES_PER_KB;
			break;
		case "MB":
			bytes = value * BYTES_PER_MB;
			break;
		case "GB":
			bytes = value * BYTES_PER_GB;
			break;
		case "TB":
			bytes = value * BYTES_PER_GB * 1024;
			break;
		default:
			bytes = value;
	}

	return (bytes / BYTES_PER_GB).toFixed(2);
}

const gradientBorderStyle: React.CSSProperties = {
	position: "relative",
	display: "flex",
	gap: "4px",
	alignItems: "center",
	height: "32px",
	padding: "6px 14px",
	margin: "0 5px",
	borderRadius: "8px",
};

const gradientBorderBeforeStyle: React.CSSProperties = {
	content: '""',
	position: "absolute",
	inset: 0,
	padding: "1px",
	background: "#DDDDDD",
	borderRadius: "8px",
	WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
	WebkitMaskComposite: "xor",
	maskComposite: "exclude",
	pointerEvents: "none",
};

export function StorageInfo() {
	const occupySize = useOccupySize();

	if (!occupySize) return null;

	return (
		<div style={gradientBorderStyle}>
			<div style={gradientBorderBeforeStyle} />
			<span className="relative flex items-center justify-center w-[10px] h-[10px] rounded-full bg-[#bae697]">
				<span className="w-[6px] h-[6px] rounded-full bg-[#00b42a]" />
			</span>
			<span>Used</span>
			<span className="text-sm">
				<span className="text-[#00B42A]">{toGB(occupySize)}</span>
				<span className="text-[#00B42A] dark:text-white">GB</span>
			</span>
			<Icon icon="material-symbols:storage" className="text-[var(--app-text-secondary)]" />
		</div>
	);
}
