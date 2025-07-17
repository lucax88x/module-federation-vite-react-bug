import { loadRemote } from "@module-federation/runtime";
import {
	type Component,
	type PropsWithChildren,
	type ReactElement,
	Suspense,
	useEffect,
	useState,
} from "react";

export const LazyComponent = ({
	loading,
	scope,
	module,
	render,
}: PropsWithChildren<{
	// this is allowed ONLY if you preload it!
	loading: ReactElement | null;
	scope: string;
	module: string;
	render: (component: Component) => ReactElement;
}>) => {
	const ctx = `[lazy-component ${scope}/${module}]`;
	const Component = useDynamicImport({
		module,
		scope,
	});

	const renderContent = () => {
		switch (Component) {
			case "error":
				return <span>ERROR!</span>;
			case "loading":
				return loading;
			case undefined:
				console.error(`${ctx} is undefined`);
				return null;
			default:
				return render(Component);
		}
	};

	return <Suspense fallback={loading}>{renderContent()}</Suspense>;
};

function useDynamicImport({
	module,
	scope,
}: {
	scope: string;
	module: string;
}) {
	const [component, setComponent] = useState<Component | "loading" | "error">(
		"loading",
	);

	useEffect(() => {
		if (!module || !scope) return;

		const loadComponent = async () => {
			const ctx = `[lazy-import ${scope}/${module}]`;
			// console.info(`${ctx} Loading`);
			try {
				const result = await loadRemote(`${scope}/${module}`);

				const { default: Component } = result as {
					default: Component;
				};

				if (!Component) {
					console.error(
						`${ctx} got undefined, probably missing export default`,
					);
					setComponent("error");
				} else {
					setComponent(() => Component);
				}
			} catch (error) {
				console.error(`${ctx} Error loading remote`, error);
				setComponent("error");
			}
		};

		loadComponent();
	}, [module, scope]);

	return component;
}
