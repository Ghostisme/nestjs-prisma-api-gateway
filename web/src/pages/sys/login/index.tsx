// import PlaceholderImg from "@/assets/images/background/placeholder.svg";
import PlaceholderImg from "@/assets/images/login/bg-img.png";
import TopRightBg from "@/assets/images/login/top-right-bg.png";
import { GLOBAL_CONFIG } from "@/global-config";
import { cn } from "@/utils";
import { useUserToken } from "@/store/userStore";
import { Navigate } from "react-router";
import LoginForm from "./login-form";
import style from "./login-form.module.css";
import { LoginProvider } from "./providers/login-provider";
// import QrCodeFrom from "./qrcode-form";
// import RegisterForm from "./register-form";
// import ResetForm from "./reset-form";
// import LoginBg from "@/assets/svg/login/bg.svg";

function LoginPage() {
	const token = useUserToken();

	if (token.accessToken) {
		return <Navigate to={GLOBAL_CONFIG.defaultRoute} replace />;
	}

	return (
		<div
			className={cn("relative flex min-h-svh bg-background", style.loginRoot)}
		>
			<div className="relative hidden bg-background-paper lg:block flex-1">
				<img
					src={PlaceholderImg}
					alt="placeholder img"
					className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.5] dark:grayscale"
				/>
			</div>
			<div className="flex flex-col gap-4 p-6 md:p-10 w-full lg:w-[30.52%] transition-[width] duration-300 ease-in-out">
				{/* <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium cursor-pointer">
            <Logo size={28} />
            <span>{GLOBAL_CONFIG.appName}</span>
          </div>
        </div> */}
				<img
					className="absolute top-0 right-0 w-[207px] h-[207px] hidden lg:block"
					src={TopRightBg}
					alt="Login background"
				/>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-96.5 ">
						<LoginProvider>
							<LoginForm />
							{/* <MobileForm />
              <QrCodeFrom />
              <RegisterForm />
              <ResetForm /> */}
						</LoginProvider>
					</div>
				</div>
			</div>

			{/* <div className="absolute right-2 top-0 flex flex-row">
				<SettingButton />
			</div> */}
		</div>
	);
}
export default LoginPage;
