import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enMarketing from './locales/en/marketing.json';
import enAcademy from './locales/en/academy.json';
import enPro from './locales/en/pro.json';
import enSocial from './locales/en/social.json';
import enCards from './locales/en/cards.json';
import enOther from './locales/en/other.json';

import ruCommon from './locales/ru/common.json';
import ruDashboard from './locales/ru/dashboard.json';
import ruMarketing from './locales/ru/marketing.json';
import ruAcademy from './locales/ru/academy.json';
import ruPro from './locales/ru/pro.json';
import ruSocial from './locales/ru/social.json';
import ruCards from './locales/ru/cards.json';
import ruOther from './locales/ru/other.json';



const deepMerge = (target: any, source: any) => {
    if (Array.isArray(source)) return source;
    if (source instanceof Object && target instanceof Object && !Array.isArray(target)) {
        const output = { ...target };
        Object.keys(source).forEach(key => {
            if (source[key] instanceof Object) {
                if (!(key in target)) {
                    output[key] = source[key];
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                output[key] = source[key];
            }
        });
        return output;
    }
    return source;
};

const en = [
    enCommon, enDashboard, enMarketing, enAcademy, enPro, enCards, enOther, enSocial
].reduce((acc: any, curr: any) => deepMerge(acc, curr), {} as any);

const ru = [
    ruCommon, ruDashboard, ruMarketing, ruAcademy, ruPro, ruCards, ruOther, ruSocial
].reduce((acc: any, curr: any) => deepMerge(acc, curr), {} as any);

// Ensure a default language is written to localStorage if the user hasn't
// explicitly chosen one yet. This prevents auto-detection from Telegram's
// system locale (e.g. Russian) overriding the app's default English UI.
if (typeof window !== 'undefined' && !localStorage.getItem('i18nextLng')) {
    localStorage.setItem('i18nextLng', 'en');
}

i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        resources: {
            en: { translation: en },
            ru: { translation: ru }
        },
        fallbackLng: 'en',
        debug: import.meta.env.DEV,

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },

        detection: {
            // Only use explicit user preference from localStorage or querystring.
            // Do NOT use 'navigator' — Telegram's system locale would override
            // the app's English default and cause blog content to load in Russian.
            order: ['querystring', 'localStorage'],
            // keys or params to lookup language from
            lookupQuerystring: 'lang',
            lookupLocalStorage: 'i18nextLng',
            // cache user language on
            caches: ['localStorage'],
        }
    });

export default i18n;
