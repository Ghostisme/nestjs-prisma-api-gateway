type TabItem = {
	label?: string;
	name?: string;
	value?: string | number;
};

type AppTabsProps = {
	items: TabItem[];
	active: number;
	bg?: boolean;
	onChange: (index: number) => void;
};

export function AppTabs({ items, active, onChange }: AppTabsProps) {
	return (
		<div className="inline-flex items-center gap-1 rounded-[8px] bg-[#F5F5F5] p-1">
			{items.map((item, index) => (
				<button
					key={`${item.value ?? index}`}
					type="button"
					className={`inline-flex cursor-pointer items-center rounded-md px-3 py-1.5 text-sm transition-colors text-[#86909C] ${
						active === index
							? "bg-[#165DFF] font-medium text-white shadow-sm"
							: "text-muted-foreground hover:text-foreground"
					}`}
					onClick={() => onChange(index)}
				>
					{item.label ?? item.name}
				</button>
			))}
		</div>
	);
}
