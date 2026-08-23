import { cn } from "@/utils";
import { NavLink } from "react-router";
// import { Icon } from "../icon";
import { GLOBAL_CONFIG } from "@/global-config";
import { urlJoin } from "@/utils";
interface Props {
	size?: number | string;
	className?: string;
}
function Logo({ size = 50, className }: Props) {
	// console.log(size, "icon的大小");
	return (
		<NavLink to="/" className={cn(className)}>
			{/* <Icon icon="local:ic-logo-badge" size={size} color="var(--colors-palette-primary-default)" /> */}
			{/* <Icon
        icon="local:ic-logo"
        size={size}
        color="var(--colors-palette-primary-default)"
      /> */}
			<img src={urlJoin(GLOBAL_CONFIG.publicPath, "logo.png")} alt="" width={size} height={size} />
		</NavLink>
	);
}

export default Logo;
