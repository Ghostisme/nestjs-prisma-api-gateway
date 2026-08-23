import userService from "@/api/services/userService";
import { Button } from "@/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ReturnButton } from "./components/ReturnButton";
import { LoginStateEnum, useLoginStateContext } from "./providers/login-provider";

function RegisterForm() {
	const { loginState, backToLogin } = useLoginStateContext();

	const signUpMutation = useMutation({
		mutationFn: userService.signup,
	});

	const form = useForm({
		defaultValues: {
			username: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	const onFinish = async (values: any) => {
		console.log("Received values of form: ", values);
		await signUpMutation.mutateAsync(values);
		backToLogin();
	};

	if (loginState !== LoginStateEnum.REGISTER) return null;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onFinish)} className="space-y-4">
				<div className="flex flex-col items-center gap-2 text-center">
					<h1 className="text-2xl font-bold">注册</h1>
				</div>

				<FormField
					control={form.control}
					name="username"
					rules={{ required: "请输入账号" }}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input placeholder="账号" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="email"
					rules={{ required: "请输入邮箱" }}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input placeholder="邮箱" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="password"
					rules={{ required: "请输入密码" }}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input type="password" placeholder="密码" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="confirmPassword"
					rules={{
						required: "请输入确认密码",
						validate: (value) => value === form.getValues("password") || "两次输入密码不一致",
					}}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input type="password" placeholder="确认密码" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" className="w-full">
					注册
				</Button>

				<div className="mb-2 text-xs text-gray">
					<span>注册即我同意</span>
					<a href="./" className="text-sm underline! text-primary!">
						{" 服务条款 "}
					</a>
					{" & "}
					<a href="./" className="text-sm underline! text-primary!">
						{" 隐私政策 "}
					</a>
				</div>

				<ReturnButton onClick={backToLogin} />
			</form>
		</Form>
	);
}

export default RegisterForm;
