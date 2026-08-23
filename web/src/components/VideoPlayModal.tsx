/** 视频预览弹窗：对应 xdwx-admin AppVideoPlay.vue */

import { Modal } from "antd";

const MODAL_WIDTH = 800;
const EMPTY_VTT_TRACK = "data:text/vtt;charset=utf-8,WEBVTT";

export interface VideoPlayModalProps {
	open: boolean;
	onClose: () => void;
	url: string;
	title?: string;
}

export function VideoPlayModal({ open, onClose, url, title = "视频预览" }: VideoPlayModalProps) {
	return (
		<Modal
			title={title}
			open={open}
			onCancel={onClose}
			footer={null}
			width={MODAL_WIDTH}
			destroyOnHidden
			centered
			styles={{
				body: { padding: 0, backgroundColor: "#000" },
				header: { borderBottom: "1px solid var(--ant-color-border-secondary)", marginRight: 0, padding: "15px 20px" },
			}}
		>
			<div
				className="flex min-h-[300px] w-full items-center justify-center bg-black"
				style={{ backgroundColor: "#000" }}
			>
				{open && url ? (
					<video
						src={url}
						controls
						autoPlay
						className="block w-full max-h-[70vh] outline-none"
						style={{ objectFit: "contain" }}
					>
						<track kind="captions" src={EMPTY_VTT_TRACK} srcLang="zh-CN" label="中文字幕" default />
						您的浏览器不支持视频播放
					</video>
				) : null}
			</div>
		</Modal>
	);
}
