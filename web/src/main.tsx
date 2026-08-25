import "./global.css";
import "./theme/theme.css";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import App from "./App";
import { registerLocalIcons } from "./components/icon";
import { GLOBAL_CONFIG } from "./global-config";
import ErrorBoundary from "./routes/components/error-boundary";
import { routesSection } from "./routes/sections";
import "@wangeditor/editor/dist/css/style.css";

/**
 * Paint the theme attributes on <html> BEFORE React's first render.
 *
 * All theme CSS variables are scoped under `:root[data-theme-mode=…]` /
 * `[data-color-palette=…]` (see theme.css.ts). Those attributes are otherwise
 * only set inside ThemeProvider's useEffect, which runs *after* the first
 * paint — so the initial frame has no theme vars at all and renders with no
 * background/text colors (the "washed-out, not-dark" first screen).
 *
 * Reading the persisted setting synchronously here (falling back to the store's
 * default dark theme) removes that flash of unstyled content. ThemeProvider
 * still owns all subsequent updates.
 */
function applyInitialThemeAttributes(): void {
	// Defaults must mirror settingStore's initial state.
	let themeMode = "dark";
	let colorPalette = "default";
	try {
		// zustand persist shape: { state: { settings: {...} }, version }
		const raw = localStorage.getItem("settings");
		const settings = raw ? JSON.parse(raw)?.state?.settings : null;
		if (settings?.themeMode) themeMode = settings.themeMode;
		if (settings?.themeColorPresets) colorPalette = settings.themeColorPresets;
	} catch {
		// Corrupt/absent storage → keep defaults.
	}
	const root = document.documentElement;
	root.setAttribute("data-theme-mode", themeMode);
	root.setAttribute("data-color-palette", colorPalette);
}

applyInitialThemeAttributes();

await registerLocalIcons();

const router = createBrowserRouter(
	[
		{
			Component: () => (
				<App>
					<Outlet />
				</App>
			),
			errorElement: <ErrorBoundary />,
			children: routesSection,
		},
	],
	{
		basename: GLOBAL_CONFIG.publicPath,
	},
);

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<RouterProvider router={router} />);
