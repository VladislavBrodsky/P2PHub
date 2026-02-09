import {registerRoute as workbox_routing_registerRoute} from '/Users/grandmaestro/Documents/P2PHub/frontend/node_modules/workbox-routing/registerRoute.mjs';
import {ExpirationPlugin as workbox_expiration_ExpirationPlugin} from '/Users/grandmaestro/Documents/P2PHub/frontend/node_modules/workbox-expiration/ExpirationPlugin.mjs';
import {CacheableResponsePlugin as workbox_cacheable_response_CacheableResponsePlugin} from '/Users/grandmaestro/Documents/P2PHub/frontend/node_modules/workbox-cacheable-response/CacheableResponsePlugin.mjs';
import {CacheFirst as workbox_strategies_CacheFirst} from '/Users/grandmaestro/Documents/P2PHub/frontend/node_modules/workbox-strategies/CacheFirst.mjs';
import {StaleWhileRevalidate as workbox_strategies_StaleWhileRevalidate} from '/Users/grandmaestro/Documents/P2PHub/frontend/node_modules/workbox-strategies/StaleWhileRevalidate.mjs';
import {clientsClaim as workbox_core_clientsClaim} from '/Users/grandmaestro/Documents/P2PHub/frontend/node_modules/workbox-core/clientsClaim.mjs';
import {precacheAndRoute as workbox_precaching_precacheAndRoute} from '/Users/grandmaestro/Documents/P2PHub/frontend/node_modules/workbox-precaching/precacheAndRoute.mjs';
import {cleanupOutdatedCaches as workbox_precaching_cleanupOutdatedCaches} from '/Users/grandmaestro/Documents/P2PHub/frontend/node_modules/workbox-precaching/cleanupOutdatedCaches.mjs';
import {NavigationRoute as workbox_routing_NavigationRoute} from '/Users/grandmaestro/Documents/P2PHub/frontend/node_modules/workbox-routing/NavigationRoute.mjs';
import {createHandlerBoundToURL as workbox_precaching_createHandlerBoundToURL} from '/Users/grandmaestro/Documents/P2PHub/frontend/node_modules/workbox-precaching/createHandlerBoundToURL.mjs';/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */








self.skipWaiting();

workbox_core_clientsClaim();


/**
 * The precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
workbox_precaching_precacheAndRoute([
  {
    "url": "viral-invite.jpg",
    "revision": "e639f8663b2130116ea8a80034cf3dc4"
  },
  {
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  },
  {
    "url": "logo.png",
    "revision": "6243235c167e3216ecbd1aded611ffa8"
  },
  {
    "url": "index.html",
    "revision": "95d83f29f36626e05d8913b526f601a2"
  },
  {
    "url": "assets/vendor-ui-CXSRfGBo.js",
    "revision": null
  },
  {
    "url": "assets/vendor-react-CtJdQpFW.js",
    "revision": null
  },
  {
    "url": "assets/vendor-charts-D1z4mYTR.js",
    "revision": null
  },
  {
    "url": "assets/user-plus-D3dyITyq.js",
    "revision": null
  },
  {
    "url": "assets/trending-up-CScVYyMB.js",
    "revision": null
  },
  {
    "url": "assets/star-RW17R2Yo.js",
    "revision": null
  },
  {
    "url": "assets/shield-DtnOcjlv.js",
    "revision": null
  },
  {
    "url": "assets/send-BG7XoaoW.js",
    "revision": null
  },
  {
    "url": "assets/lock-Cz6328Rj.js",
    "revision": null
  },
  {
    "url": "assets/loader-2-BLwQF2oy.js",
    "revision": null
  },
  {
    "url": "assets/index-x9nnWagY.css",
    "revision": null
  },
  {
    "url": "assets/index-CRbOi8-q.js",
    "revision": null
  },
  {
    "url": "assets/arrow-right-CZ0_0NAz.js",
    "revision": null
  },
  {
    "url": "assets/Trans-DBCzhsqi.js",
    "revision": null
  },
  {
    "url": "assets/Subscription--cc6s1he.js",
    "revision": null
  },
  {
    "url": "assets/Referral-IN6FZovM.js",
    "revision": null
  },
  {
    "url": "assets/ListSkeleton-DTU39VMM.js",
    "revision": null
  },
  {
    "url": "assets/Leaderboard-eKa8wg14.js",
    "revision": null
  },
  {
    "url": "assets/Dashboard-Cwsfc000.js",
    "revision": null
  },
  {
    "url": "assets/Community-DglmqEML.js",
    "revision": null
  },
  {
    "url": "assets/Cards-R7uUchkC.js",
    "revision": null
  },
  {
    "url": "logo.png",
    "revision": "c32578dfb13f8c26c1a7be5f83569ddf"
  },
  {
    "url": "manifest.webmanifest",
    "revision": "87f0d6158f3990e1aa71116edfbf459d"
  }
], {});
workbox_precaching_cleanupOutdatedCaches();
workbox_routing_registerRoute(new workbox_routing_NavigationRoute(workbox_precaching_createHandlerBoundToURL("index.html")));


workbox_routing_registerRoute(/^https:\/\/images\.unsplash\.com\/.*/i, new workbox_strategies_CacheFirst({ "cacheName":"unsplash-images", plugins: [new workbox_expiration_ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 2592000 }), new workbox_cacheable_response_CacheableResponsePlugin({ statuses: [ 0, 200 ] })] }), 'GET');
workbox_routing_registerRoute(/^https:\/\/telegram\.org\/js\/.*/i, new workbox_strategies_StaleWhileRevalidate({ "cacheName":"telegram-scripts", plugins: [] }), 'GET');




