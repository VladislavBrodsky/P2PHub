import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// #comment: Performance Hack - Custom Lazy Loader for i18n
// Instead of bundling ~400KB of JSON directly into the main JS bundle, 
// we use dynamic imports. This allows Vite to split each language/sector 
// into its own small chunk, loaded only when needed.
const loadResources = async (language: string, namespace: string) => {
    try {
        // Vite supports dynamic imports with template literals
        const resources = await import(`./locales/${language}/${namespace}.json`);
        return resources.default;
    } catch (e) {
        console.error(`[i18n] Failed to load ${language}/${namespace}:`, e);
        return {};
    }
};

const namespaces = ['common', 'dashboard', 'marketing', 'academy', 'pro', 'social', 'cards', 'other'];

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        ns: namespaces,
        defaultNS: 'common',
        debug: import.meta.env.DEV,
        interpolation: {
            escapeValue: false,
        },
        backend: {
            // #comment: custom backend using the lazy loader defined above
            async loadResources(language: string, namespace: string, callback: any) {
                const resources = await loadResources(language, namespace);
                callback(null, resources);
            }
        },
        react: {
            useSuspense: false,
        },
        detection: {
            order: ['querystring', 'localStorage'],
            lookupQuerystring: 'lang',
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        }
    });

// #comment: Manually load the initial language/namespaces to prevent raw key flashing 
// without needing the full i18next-http-backend plugin.
const initLang = localStorage.getItem('i18nextLng') || 'en';
Promise.all(namespaces.map(ns =>
    loadResources(initLang, ns).then(res => i18n.addResourceBundle(initLang, ns, res, true, true))
));


export default i18n;
