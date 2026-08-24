import CyanBlur from "@/assets/images/background/cyan-blur.png";
import RedBlur from "@/assets/images/background/red-blur.png";
import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { ScrollArea } from "@/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Text } from "@/ui/typography";
import { Button } from "antd";
import { useCallback, type CSSProperties, useEffect, useState } from "react";
import { getMessagePageApi, markAllReadApi, markReadApi } from "@/api/app";
import { useNavigate } from "react-router";

interface MessageItem {
	content?: string;
	createBy?: number;
	id?: number;
	jumpable?: boolean;
	messageType?: string;
	pagePath?: string;
	readFlag?: number;
	receiveTime?: string;
	receiveUserId?: number;
	title?: string;
	[property: string]: any;
}

export default function NoticeButton() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [count, setCount] = useState(0);

	const fetchUnreadCount = useCallback(async () => {
		try {
			const res: any = await getMessagePageApi({
				page: 1,
				size: 1,
				readFlag: 0,
			});
			if (res) {
				setCount(res.total || 0);
			}
		} catch (error) {
			console.error(error);
		}
	}, []);

	useEffect(() => {
		fetchUnreadCount();
	}, [fetchUnreadCount]);

	// const handleSendMessage = async () => {
	//   try {
	//     await sendMessageApi({
	//       messageType: "NOTICE",
	//       // @ts-ignore
	//       receiveUserId: "2018866955864342500",
	//       templateCode: "TEST_MSG",
	//       templateParams: { key: "test" },
	//     });
	//     fetchUnreadCount();
	//   } catch (error) {
	//     console.error(error);
	//   }
	// };

	const style: CSSProperties = {
		backdropFilter: "blur(20px)",
		backgroundImage: `url("${CyanBlur}"), url("${RedBlur}")`,
		backgroundRepeat: "no-repeat, no-repeat",
		backgroundPosition: "right top, left bottom",
		backgroundSize: "50%, 50%",
	};

	return (
		<>
			<div className="relative" onClick={() => setDrawerOpen(true)}>
				<Button className="rounded-full" onClick={() => setDrawerOpen(true)} type="text">
					<Icon icon="solar:bell-bing-bold-duotone" size={24} />
				</Button>
				<Badge variant="destructive" shape="circle" className="absolute -right-2 -top-2">
					{count}
				</Badge>
			</div>
			<Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
				<SheetContent side="right" className="sm:max-w-md p-0 [&>button]:hidden flex flex-col" style={style}>
					<SheetHeader className="flex flex-row items-center justify-between p-4 h-16 shrink-0">
						<SheetTitle>Notifications</SheetTitle>
						{/* <Button onClick={handleSendMessage} size="small">
              发送测试消息
            </Button> */}
						<Button
							className="rounded-full"
							type="text"
							onClick={() => {
								setDrawerOpen(false);
							}}
						>
							<Icon icon="material-symbols:close-rounded" size={20} />
						</Button>
					</SheetHeader>
					<div className="px-4 flex-1 overflow-hidden">
						<NoticeTab onRefresh={fetchUnreadCount} />
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}

function NoticeTab({ onRefresh }: { onRefresh: () => void }) {
	const navigate = useNavigate();
	const [list, setList] = useState<MessageItem[]>([]);

	const fetchData = useCallback(async () => {
		try {
			const res: any = await getMessagePageApi({
				page: 1,
				size: 100,
				// @ts-ignore
				readFlag: undefined,
			});
			if (res?.records) {
				setList(res.records);
			}
		} catch (error) {
			console.error(error);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleMarkAllRead = async () => {
		try {
			await markAllReadApi();
			await fetchData();
			onRefresh();
		} catch (error) {
			console.error(error);
		}
	};

	const handleItemClick = async (item: MessageItem) => {
		try {
			if (item.readFlag === 0) {
				if (item.id) {
					await markReadApi(item.id);
				}
				await fetchData();
				onRefresh();
			}
			if (item.jumpable && item.pagePath) {
				navigate(item.pagePath);
			}
		} catch (error) {
			console.error(error);
		}
	};

	const unreadNotifications = list.filter((item) => item.readFlag === 0);
	const readNotifications = list.filter((item) => item.readFlag === 1);
	const allNotifications = list;

	const renderNotification = (notification: MessageItem) => {
		return (
			<div
				key={notification.id}
				onClick={() => handleItemClick(notification)}
				className="flex items-start space-x-3 py-4 border-b border-border last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 transition-colors"
			>
				<div className="relative pt-1.5 w-2">
					{notification.readFlag === 0 && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between mb-1">
						<Text variant="subTitle2" className="font-semibold truncate pr-4">
							{notification.title}
						</Text>
					</div>
					<Text variant="caption" color="secondary" className="line-clamp-2">
						{notification.content}
					</Text>
					<Text variant="caption" color="secondary" className="shrink-0">
						{notification.receiveTime}
					</Text>
				</div>
			</div>
		);
	};

	return (
		<Tabs defaultValue="all" className="w-full h-full flex flex-col">
			<div className="flex">
				<TabsList className="gap-2 flex-1 flex justify-between items-center shrink-0">
					<TabsTrigger value="all" className="flex items-center gap-1">
						<span>All</span>
						{allNotifications.length === 0 ? null : <Badge variant="default">{allNotifications.length}</Badge>}
					</TabsTrigger>
					<TabsTrigger value="unread" className="flex items-center gap-1">
						<span>Unread</span>
						{unreadNotifications.length === 0 ? null : <Badge variant="info">{unreadNotifications.length}</Badge>}
					</TabsTrigger>
					<TabsTrigger value="read" className="flex items-center gap-1">
						<span>Read</span>
						{readNotifications.length === 0 ? null : <Badge variant="success">{readNotifications.length}</Badge>}
					</TabsTrigger>
				</TabsList>
				<Button type="text" onClick={handleMarkAllRead}>
					Mark all read
				</Button>
			</div>

			<TabsContent value="all" className="flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					<div className="space-y-0">{allNotifications.map(renderNotification)}</div>
				</ScrollArea>
			</TabsContent>

			<TabsContent value="unread" className="flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					<div className="space-y-0">{unreadNotifications.map(renderNotification)}</div>
				</ScrollArea>
			</TabsContent>

			<TabsContent value="read" className="flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					<div className="space-y-0">{readNotifications.map(renderNotification)}</div>
				</ScrollArea>
			</TabsContent>
		</Tabs>
	);
}
