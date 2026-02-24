import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// #comment: Performance Hack - Custom Lazy Loader for i18n
// Instead of bundling ~400KB of JSON directly into the main JS bundle, 
// we use dynamic imports. This allows Vite to split each language/sector 
// into its own small chunk, loaded only when needed.
const namespaces = ['common', 'dashboard', 'marketing', 'academy', 'pro', 'social', 'cards', 'other'];

const loadResources = async (language: string, namespace: string) => {
    const parts = language.split('-');
    const shortLang = parts[0];

    // Ordered list of locales to try: full (en-US), base (en), fallback (en)
    const localesToTry = Array.from(new Set([language, shortLang, 'en']));

    for (const locale of localesToTry) {
        try {
            const resources = await import(`./locales/${locale}/${namespace}.json`);
            // Vite 5: JSON imports often return the object directly, but we keep .default for safety
            return resources.default || resources;
        } catch (e) {
            // Continue to next fallback
            continue;
        }
    }
    return {};
};

const initLang = localStorage.getItem('i18nextLng') || 'en';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        ns: namespaces,
        defaultNS: 'common',
        fallbackNS: 'common',
        debug: import.meta.env.DEV,
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: true,
            bindI18n: 'languageChanged loaded',
            bindI18nStore: 'added removed',
        },
        detection: {
            order: ['querystring', 'localStorage'],
            lookupQuerystring: 'lang',
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        }
    });

// #comment: Parallel Resource Injection - Pre-populates i18next to avoid "key-as-value" flicker during hydration
const initializeI18n = async (lang?: string) => {
    const currentLang = lang || i18n.language || initLang;
    const baseLang = currentLang.split('-')[0];

    // Load all namespaces for the current language in parallel
    await Promise.all(
        namespaces.map(async (ns) => {
            const res = await loadResources(currentLang, ns);
            i18n.addResourceBundle(currentLang, ns, res, true, true);
            // Also seed the base language to handle fallback correctly if we are on a dialect
            if (baseLang !== currentLang) {
                i18n.addResourceBundle(baseLang, ns, res, true, true);
            }
        })
    );
};

// Listen for language changes and load resources dynamically
i18n.on('languageChanged', (lang) => {
    initializeI18n(lang).catch(console.error);
});

// Start initialization immediately
initializeI18n().catch(console.error);

export default i18n;
export { loadResources, initializeI18n };
