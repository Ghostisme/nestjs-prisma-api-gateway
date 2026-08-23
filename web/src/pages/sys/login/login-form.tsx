import { Button as AntButton, Checkbox, Tabs, type TabsProps } from "antd";
import { Loader2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { type Control, type FieldValues, type Path, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
// import { Button } from "@/ui/button";
import { getFeishuCodeApi, getLoginCodeImageApi } from "@/api/login";
import userService, { type LoginTenantOptionVO, type SignInReq } from "@/api/services/userService";
import { initSettingInfo } from "@/bootstrap/initSettingInfo";
import { GLOBAL_CONFIG } from "@/global-config";
import { useSignIn } from "@/store/userStore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { cn } from "@/utils";
import { encryptPassword } from "@/utils/crypto";
import { getApiErrorMessage } from "@/utils/request-error";
import { LoginTenantSelect } from "./components/LoginTenantSelect";
import style from "./login-form.module.css";
import { LoginStateEnum, useLoginStateContext } from "./providers/login-provider";

// --- Hooks ---

function useCountdown(initialCount = 60) {
	const [countdown, setCountdown] = useState(0);

	useEffect(() => {
		if (countdown <= 0) return;
		const timer = setInterval(() => {
			setCountdown((prev) => prev - 1);
		}, 1000);
		return () => clearInterval(timer);
	}, [countdown]);

	const startCountdown = () => setCountdown(initialCount);

	return { countdown, startCountdown };
}

function useLoginSubmit(signIn: (data: SignInReq) => Promise<any>, refresh?: () => void) {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleLogin = async (values: SignInReq) => {
		setLoading(true);
		try {
			await signIn(values);
			await initSettingInfo();
			navigate(GLOBAL_CONFIG.defaultRoute, { replace: true });
			toast.success("Signed in", {
				closeButton: true,
			});
		} catch (error) {
			console.log(error);
			refresh?.();
			setLoading(false);
		}
	};

	return { loading, handleLogin };
}

// --- Components ---

function BaseFormItem<T extends FieldValues>({
	control,
	name,
	label,
	rules,
	renderContent,
}: {
	control: Control<T>;
	name: Path<T>;
	label: string;
	rules?: object;
	renderContent: (field: any) => ReactNode;
}) {
	return (
		<FormField
			control={control}
			name={name}
			rules={rules || { required: `Please enter ${label}` }}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<FormControl>{renderContent(field)}</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

function SmsCodeItem({
	control,
	countdown,
	onGetCode,
}: {
	control: Control<any>;
	countdown: number;
	onGetCode: () => void;
}) {
	return (
		<BaseFormItem
			control={control}
			name="feishuCode"
			label=""
			renderContent={(field) => (
				<div className="relative">
					<Input placeholder="SMS code" {...field} className="pr-32" />
					<AntButton type="text" disabled={countdown > 0} onClick={onGetCode} className={style.codeBtn}>
						{countdown > 0 ? `${countdown}s` : "Get code"}
					</AntButton>
				</div>
			)}
		/>
	);
}

function RememberMe({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
	return (
		<div className="flex flex-row justify-between">
			<div className="flex items-center space-x-2">
				<Checkbox id="remember" checked={value} onChange={(e) => onChange(e.target.checked)}>
					Remember me
				</Checkbox>
			</div>
		</div>
	);
}

function ImageCode({ imageCode, refresh }: { imageCode: string; refresh: () => void }) {
	if (!imageCode) return null;
	return <img src={imageCode} alt="captcha" className="h-[36px] cursor-pointer" onClick={refresh} />;
}

function useImageCode() {
	const [imageCode, setImageCode] = useState<string>("");
	const [randomStr, setRandomStr] = useState<string>("");

	const getLoginCode = useCallback(async () => {
		const newRandomStr = uuidv4();
		setRandomStr(newRandomStr);
		try {
			const data = await getLoginCodeImageApi({ randomStr: newRandomStr });
			setImageCode(data?.imageBase64 || "");
		} catch (error) {
			console.error(error);
		}
	}, []);

	useEffect(() => {
		getLoginCode();
	}, [getLoginCode]);

	return { imageCode, randomStr, refresh: getLoginCode };
}

function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
	return (
		<AntButton
			type="primary"
			htmlType="submit"
			className={cn("h-11 w-full rounded-xl text-sm font-medium", style.submitBtn)}
		>
			{loading && <Loader2 className="animate-spin mr-2" />}
			{children}
		</AntButton>
	);
}

const getDefaultTenantId = (options: LoginTenantOptionVO[]): number | undefined =>
	options.find((option) => option.tenantId && option.status !== 1)?.tenantId;

const buildPasswordLoginPayload = (values: SignInReq, randomStr: string): SignInReq => ({
	...values,
	mobile: values.username || "",
	password: encryptPassword(values.password || ""),
	randomStr,
});

// --- Forms ---

function AccountForm({
	imageCode,
	randomStr,
	refresh,
	remember,
	setRemember,
	onTenantSelectionVisibleChange,
}: {
	imageCode: string;
	randomStr: string;
	refresh: () => void;
	remember: boolean;
	setRemember: (value: boolean) => void;
	onTenantSelectionVisibleChange: (visible: boolean) => void;
}) {
	const signIn = useSignIn();
	const [preLoginLoading, setPreLoginLoading] = useState(false);
	const [tenantOptions, setTenantOptions] = useState<LoginTenantOptionVO[]>([]);
	const [selectedTenantId, setSelectedTenantId] = useState<number>();
	const [pendingLoginValues, setPendingLoginValues] = useState<SignInReq | null>(null);

	const form = useForm<SignInReq>({
		defaultValues: {
			username: localStorage.getItem("remember_username") || "",
			password: localStorage.getItem("remember_password") || "",
			code: "",
			grant_type: "password",
		},
	});

	const resetTenantSelection = () => {
		setTenantOptions([]);
		setSelectedTenantId(undefined);
		setPendingLoginValues(null);
	};

	useEffect(() => {
		onTenantSelectionVisibleChange(tenantOptions.length > 0);

		return () => {
			onTenantSelectionVisibleChange(false);
		};
	}, [onTenantSelectionVisibleChange, tenantOptions.length]);

	const { loading, handleLogin } = useLoginSubmit(
		async (values) => {
			if (remember) {
				localStorage.setItem("remember_username", values.username);
			} else {
				localStorage.removeItem("remember_username");
				localStorage.removeItem("remember_password");
				localStorage.removeItem("remember_mobile");
			}
			return signIn(values);
		},
		() => {
			refresh();
			form.setValue("code", "");
			resetTenantSelection();
		},
	);

	const handlePreLogin = async (values: SignInReq) => {
		const nextLoginValues = buildPasswordLoginPayload(values, randomStr);

		setPreLoginLoading(true);
		try {
			const userInfo = await userService.preLogin({
				grantType: "password",
				password: nextLoginValues.password || "",
				username: values.username,
			});
			const options = userInfo.tenantOptions ?? [];
			if (!options.length) {
				toast.error("No available organization", {
					closeButton: true,
				});
				return;
			}

			// 只有一个可选企业时，直接使用该 tenantId 完成登录，避免用户再额外选择一次。
			if (options.length === 1) {
				const tenantId = getDefaultTenantId(options);
				if (!tenantId) {
					toast.error("This organization is unavailable, please contact your admin", {
						closeButton: true,
					});
					return;
				}

				await handleLogin({
					...nextLoginValues,
					tenantId,
				});
				return;
			}

			setPendingLoginValues(nextLoginValues);
			setTenantOptions(options);
			setSelectedTenantId(getDefaultTenantId(options));
		} catch (error) {
			toast.error(getApiErrorMessage(error, "Sign-in failed"), {
				closeButton: true,
			});
		} finally {
			setPreLoginLoading(false);
		}
	};

	const handleTenantBack = () => {
		resetTenantSelection();
	};

	const handleTenantConfirm = async () => {
		if (!selectedTenantId) {
			toast.error("Please select an organization", {
				closeButton: true,
			});
			return;
		}
		if (!pendingLoginValues) {
			toast.error("Session expired, please sign in again", {
				closeButton: true,
			});
			resetTenantSelection();
			return;
		}

		await handleLogin({
			...pendingLoginValues,
			tenantId: selectedTenantId,
		});
	};

	if (tenantOptions.length > 0) {
		return (
			<LoginTenantSelect
				options={tenantOptions}
				selectedTenantId={selectedTenantId}
				loading={loading}
				onBack={handleTenantBack}
				onConfirm={handleTenantConfirm}
				onSelect={(tenantId) => setSelectedTenantId(tenantId)}
			/>
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handlePreLogin)} className="space-y-4 pt-4">
				<BaseFormItem
					control={form.control}
					name="username"
					label=""
					renderContent={(field) => <Input placeholder="Phone number" {...field} />}
				/>
				<BaseFormItem
					control={form.control}
					name="password"
					label=""
					renderContent={(field) => (
						<Input type="password" placeholder="Password" {...field} suppressHydrationWarning />
					)}
				/>
				<BaseFormItem
					control={form.control}
					name="code"
					label=""
					renderContent={(field) => (
						<div className="flex items-center gap-[5px]">
							<Input placeholder="Captcha" {...field} />
							<ImageCode imageCode={imageCode} refresh={refresh} />
						</div>
					)}
				/>
				<RememberMe value={remember} onChange={setRemember} />
				<SubmitButton loading={preLoginLoading}>Sign in</SubmitButton>
			</form>
		</Form>
	);
}

function FeishuForm({
	imageCode,
	randomStr,
	refresh,
	remember,
	setRemember,
}: {
	imageCode: string;
	randomStr: string;
	refresh: () => void;
	remember: boolean;
	setRemember: (value: boolean) => void;
}) {
	const { countdown, startCountdown } = useCountdown();
	const signIn = useSignIn();

	const form = useForm<SignInReq>({
		defaultValues: {
			username: "",
			password: "",
			mobile: localStorage.getItem("remember_mobile") || "",
			code: "",
			feishuCode: "",
			grant_type: "feishu_code",
		},
	});

	const { loading, handleLogin } = useLoginSubmit(
		async (values) => {
			if (remember) {
				localStorage.setItem("remember_mobile", values.mobile?.toString() || "");
			} else {
				localStorage.removeItem("remember_mobile");
				localStorage.removeItem("remember_username");
				localStorage.removeItem("remember_password");
			}
			// 确保 grant_type 正确
			return signIn({
				...values,
				grant_type: "feishu_code",
				randomStr,
			});
		},
		() => {
			refresh();
			form.setValue("code", "");
		},
	);

	const getSmsCode = async () => {
		const mobile = form.getValues("mobile");
		// const code = form.getValues("code");
		if (!mobile) {
			form.setError("mobile", { message: "Please enter your phone number" });
			return;
		}

		try {
			await getFeishuCodeApi({ mobile: mobile });
			toast.success("Code sent");
			startCountdown();
		} catch (error) {
			console.log(error);
			// refresh();
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4 pt-4">
				<BaseFormItem
					control={form.control}
					name="mobile"
					label=""
					renderContent={(field) => <Input placeholder="Phone number" {...field} />}
				/>
				<SmsCodeItem control={form.control} countdown={countdown} onGetCode={getSmsCode} />

				<BaseFormItem
					control={form.control}
					name="code"
					label=""
					renderContent={(field) => (
						<div className="flex items-center gap-[5px]">
							<Input placeholder="Captcha" {...field} />
							<ImageCode imageCode={imageCode} refresh={refresh} />
						</div>
					)}
				/>

				<RememberMe value={remember} onChange={setRemember} />
				<SubmitButton loading={loading}>Sign in</SubmitButton>
			</form>
		</Form>
	);
}

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
	const { loginState, setLoginState } = useLoginStateContext();
	const [activeKey, setActiveKey] = useState("feishu");
	const { imageCode, randomStr, refresh } = useImageCode();
	const [remember, setRemember] = useState(false);
	const [isTenantSelectionVisible, setIsTenantSelectionVisible] = useState(false);

	useEffect(() => {
		if (
			(localStorage.getItem("remember_username") && localStorage.getItem("remember_password")) ||
			localStorage.getItem("remember_mobile")
		) {
			setRemember(true);
		}
	}, []);

	if (loginState !== LoginStateEnum.LOGIN) return null;

	const items: TabsProps["items"] = [
		{
			key: "feishu",
			label: "SMS Code",
			children: (
				<FeishuForm
					imageCode={imageCode}
					randomStr={randomStr}
					refresh={refresh}
					remember={remember}
					setRemember={setRemember}
				/>
			),
		},
		{
			key: "account",
			label: "Password",
			children: (
				<AccountForm
					imageCode={imageCode}
					randomStr={randomStr}
					refresh={refresh}
					remember={remember}
					setRemember={setRemember}
					onTenantSelectionVisibleChange={setIsTenantSelectionVisible}
				/>
			),
		},
	];

	const handleTabChange = (key: string) => {
		if (key === "mobile") {
			setLoginState(LoginStateEnum.MOBILE);
			return;
		}
		if (key === "qrcode") {
			setLoginState(LoginStateEnum.QR_CODE);
			return;
		}
		setActiveKey(key);
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<div className="flex flex-col  gap-2 text-left">
				<h1 className="text-4xl font-bold">Welcome to Lumax</h1>
				{/* <p className="text-balance text-sm text-muted-foreground">
          输入您的账号登录到您的账户
        </p> */}
			</div>

			<div className={cn(style.authPanel, isTenantSelectionVisible && style.authCard)}>
				<Tabs
					activeKey={activeKey}
					// items={items.filter((item) => item.key !== "account")}
					items={items}
					onChange={handleTabChange}
					className={cn("w-full", style.authTabs, isTenantSelectionVisible && style.tenantSelectionTabs)}
					tabBarStyle={isTenantSelectionVisible ? { display: "none" } : undefined}
				/>
			</div>
		</div>
	);
}

export default LoginForm;
