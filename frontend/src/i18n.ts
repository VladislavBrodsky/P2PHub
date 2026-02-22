import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// #comment: Performance Hack - Custom Lazy Loader for i18n
// Instead of bundling ~400KB of JSON directly into the main JS bundle, 
// we use dynamic imports. This allows Vite to split each language/sector 
// into its own small chunk, loaded only when needed.
const loadResources = async (language: string, namespace: string) => {
    // Normalize language: 'en-US' -> 'en'
    const shortLang = language.split('-')[0];
    try {
        // Try the specific language first
        let resources;
        try {
            resources = await import(`./locales/${language}/${namespace}.json`);
        } catch (e) {
            // Fallback to short language if different
            if (shortLang !== language) {
                resources = await import(`./locales/${shortLang}/${namespace}.json`);
            } else {
                throw e;
            }
        }
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
        fallbackNS: namespaces, // #comment: Allow components to find keys across any namespace
        debug: import.meta.env.DEV,
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: true, // #comment: Enable Suspense to prevent raw key flashing
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

// #comment: Custom backend plugin-like logic to handle lazy loading with Suspense support
const rawLang = localStorage.getItem('i18nextLng') || 'en';
const initLang = rawLang.split('-')[0];

// Pre-load all namespaces for the initial language to satisfy Suspense
namespaces.forEach(ns => {
    loadResources(initLang, ns).then(res => {
        i18n.addResourceBundle(initLang, ns, res, true, true);
    });
});

export default i18n;
