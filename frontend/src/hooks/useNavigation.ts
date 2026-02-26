/**
 * useNavigation — A hook that provides a type-safe navigation helper.
 *
 * Wraps the `nav-tab` CustomEvent dispatch so components don't need to know
 * about the underlying event bus mechanics. Use with ROUTES constants.
 *
 * Usage:
 *   const { navigateTo } = useNavigation();
 *   navigateTo(ROUTES.PRO);
 */
export function useNavigation() {
    const navigateTo = (tab: string) => {
        window.dispatchEvent(new CustomEvent('nav-tab', { detail: tab }));
    };

    return { navigateTo };
}
