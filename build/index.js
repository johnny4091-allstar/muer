var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf, __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
}, __copyProps = (to, from, except, desc) => {
  if (from && typeof from == "object" || typeof from == "function")
    for (let key of __getOwnPropNames(from))
      !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: !0 }) : target,
  mod
)), __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: !0 }), mod);

// app/routes/login.tsx
var require_login = __commonJS({
  "app/routes/login.tsx"() {
    "use strict";
  }
});

// app/routes/join.tsx
var require_join = __commonJS({
  "app/routes/join.tsx"() {
    "use strict";
  }
});

// <stdin>
var stdin_exports = {};
__export(stdin_exports, {
  assets: () => assets_manifest_default,
  assetsBuildDirectory: () => assetsBuildDirectory,
  entry: () => entry,
  future: () => future,
  publicPath: () => publicPath,
  routes: () => routes
});
module.exports = __toCommonJS(stdin_exports);

// app/entry.server.tsx
var entry_server_exports = {};
__export(entry_server_exports, {
  default: () => handleRequest
});
var import_server = require("react-dom/server"), import_react = require("@remix-run/react"), import_jsx_runtime = require("react/jsx-runtime");
function handleRequest(request, responseStatusCode, responseHeaders, remixContext) {
  let markup = (0, import_server.renderToString)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.RemixServer, { context: remixContext, url: request.url })
  );
  return responseHeaders.set("Content-Type", "text/html"), new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders
  });
}

// app/root.tsx
var root_exports = {};
__export(root_exports, {
  default: () => App,
  links: () => links,
  loader: () => loader,
  meta: () => meta
});
var import_solid2 = require("@heroicons/react/20/solid"), import_outline2 = require("@heroicons/react/24/outline"), import_solid3 = require("@heroicons/react/24/solid"), import_node2 = require("@remix-run/node"), import_react8 = require("@remix-run/react");

// app/components/cimage.tsx
var import_react2 = require("react");

// public/fallbackImage.jpg
var fallbackImage_default = "/build/_assets/fallbackImage-KQKY2SFO.jpg";

// app/components/cimage.tsx
var import_jsx_runtime2 = require("react/jsx-runtime"), CImage = ({ src, className, brokenImageCallback, displayPlaceholder, widthLargerThan = 0, heightLargerThan = 0 }) => {
  let [errorLoadingImage, setErrorLoadingImage] = (0, import_react2.useState)(!1), [loaded, setLoaded] = (0, import_react2.useState)(!1);
  (0, import_react2.useEffect)(() => {
    setErrorLoadingImage(!1), setLoaded(!1);
  }, [src]);
  let ref = (0, import_react2.useRef)();
  if (errorLoadingImage)
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("img", { src: fallbackImage_default, alt: "", className });
  let placeholder = displayPlaceholder ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, {});
  return src ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "img",
    {
      ref,
      src,
      className,
      onError: () => {
        console.log("Cannot load image"), brokenImageCallback == null || brokenImageCallback(src), setErrorLoadingImage(!0), setLoaded(!0);
      },
      onLoad: () => {
        var _a, _b;
        if (((_a = ref == null ? void 0 : ref.current) == null ? void 0 : _a.naturalWidth) <= widthLargerThan || ((_b = ref == null ? void 0 : ref.current) == null ? void 0 : _b.naturalHeight) <= heightLargerThan) {
          console.log(`image ${src} does not meet standard`), brokenImageCallback == null || brokenImageCallback(src), setErrorLoadingImage(!0), setLoaded(!0);
          return;
        }
        setLoaded(!0);
      },
      loading: "lazy"
    }
  ) : placeholder;
}, cimage_default = CImage;

// app/root.tsx
var import_react9 = require("react"), import_react_range = require("react-range"), import_react_resizable = require("react-resizable");

// app/components/Player.tsx
var import_react3 = require("react"), import_react_player = __toESM(require("react-player")), import_jsx_runtime3 = require("react/jsx-runtime");
function Player({
  playerRef,
  urls = [],
  playing,
  onStart,
  onBuffer,
  onBufferEnd,
  onReady,
  onProgress,
  onPause,
  onEnded,
  onDuration,
  onVideoError,
  volume = 1
}) {
  let [failedUrls, setFailedUrls] = (0, import_react3.useState)([]), url = urls.find((x) => !failedUrls.some((y) => y == x));
  return (0, import_react3.useEffect)(() => {
    urls.filter((x) => !failedUrls.some((y) => y == x)).length == 0 && onVideoError();
  }, [failedUrls]), url ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    import_react_player.default,
    {
      playsInline: !0,
      ref: playerRef,
      onBuffer,
      onBufferEnd,
      onReady,
      onStart,
      onProgress,
      onPause,
      onEnded,
      playing,
      onDuration,
      onError: (error) => {
        console.log("debug player error", error), console.log("remove", url), setFailedUrls((furls) => furls.concat(url));
      },
      className: "hidden",
      pip: !1,
      url,
      volume
    }
  ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_jsx_runtime3.Fragment, {});
}

// app/root.tsx
var import_jotai = require("jotai"), import_auth_helpers_remix = require("@supabase/auth-helpers-remix");

// app/components/HeartButton.tsx
var import_outline = require("@heroicons/react/24/outline"), import_react6 = require("react");

// app/utils.ts
var import_react4 = require("react"), import_react5 = require("@remix-run/react");
var t = (cond, classNamesTrue, classNamesFalse = "") => cond ? ` ${classNamesTrue} ` : ` ${classNamesFalse} `;

// public/heart.json
var heart_default = { nm: "newScene", ddd: 0, h: 100, w: 100, meta: { g: "@lottiefiles/toolkit-js 0.26.1" }, layers: [{ ty: 4, nm: "Dot14", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -320 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [48], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [30], t: 56 }, { s: [10], t: 78 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [47], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [29], t: 56 }, { s: [9], t: 78 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [2], t: 56 }, { s: [0], t: 70 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.6314, 0.8118, 0.9412], t: 44 }, { s: [0.8196, 0.651, 0.9098], t: 56 }] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 1 }, { ty: 4, nm: "Dot13", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -306.6 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [45], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [20], t: 56 }, { s: [1], t: 89 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [44], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [19], t: 56 }, { s: [0], t: 89 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 56 }, { s: [0], t: 89 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.6588, 0.8, 0.9686], t: 44 }, { s: [0.8196, 0.651, 0.9098], t: 56 }] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 2 }, { ty: 4, nm: "Dot12", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -271.7 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [48], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [30], t: 56 }, { s: [10], t: 78 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [47], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [29], t: 56 }, { s: [9], t: 78 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [2], t: 56 }, { s: [0], t: 70 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [1, 1, 1], t: 44 }, { s: [0.8902, 0.8196, 0.5804], t: 56 }] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 3 }, { ty: 4, nm: "Dot11", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -258.3 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [45], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [20], t: 56 }, { s: [1], t: 89 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [44], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [19], t: 56 }, { s: [0], t: 89 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 56 }, { s: [0], t: 89 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.7804, 0.6196, 0.8902], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [1, 1, 1], t: 56 }, { s: [0.7098, 0.2706, 0.6431], t: 66 }] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 4 }, { ty: 4, nm: "Dot10", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -220.3 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [48], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [30], t: 56 }, { s: [10], t: 78 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [47], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [29], t: 56 }, { s: [9], t: 78 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [2], t: 56 }, { s: [0], t: 70 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.8902, 0.6157, 0.6157], t: 44 }, { s: [0.7882, 0.6, 0.6], t: 56 }] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 5 }, { ty: 4, nm: "Dot9", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -206.9 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [45], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [20], t: 56 }, { s: [1], t: 89 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [44], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [19], t: 56 }, { s: [0], t: 89 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 56 }, { s: [0], t: 89 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.6196, 0.8784, 0.7804], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.7882, 0.6, 0.6], t: 56 }, { s: [0.7098, 0.2706, 0.6431], t: 66 }] } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 2", ix: 4, e: { a: 0, k: 45, ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 0, k: 44, ix: 1 }, m: 1 }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 6 }, { ty: 4, nm: "Dot8", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -168.2 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [48], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [30], t: 56 }, { s: [10], t: 78 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [47], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [29], t: 56 }, { s: [9], t: 78 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [2], t: 56 }, { s: [0], t: 70 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.8588, 0.6196, 0.6784], t: 44 }, { s: [0.3294, 0.6, 0.8], t: 56 }] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 7 }, { ty: 4, nm: "Dot7", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -154.8 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [45], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [20], t: 56 }, { s: [1], t: 89 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [44], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [19], t: 56 }, { s: [0], t: 89 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 56 }, { s: [0], t: 89 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.8902, 0.6, 0.6902], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.3294, 0.6, 0.8], t: 56 }, { s: [0.7098, 0.2706, 0.6431], t: 66 }] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 8 }, { ty: 4, nm: "Dot6", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -117.1 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [48], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [30], t: 56 }, { s: [10], t: 78 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [47], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [29], t: 56 }, { s: [9], t: 78 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [2], t: 56 }, { s: [0], t: 70 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.6196, 0.8196, 0.9608], t: 44 }, { s: [0.702, 0.8392, 0.6588], t: 56 }] } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 2", ix: 4, e: { a: 0, k: 30, ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 0, k: 29, ix: 1 }, m: 1 }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 9 }, { ty: 4, nm: "Dot5", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -103.7 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [45], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [20], t: 56 }, { s: [1], t: 89 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [44], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [19], t: 56 }, { s: [0], t: 89 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 56 }, { s: [0], t: 89 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.7216, 0.851, 0.949], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.702, 0.8392, 0.6706], t: 56 }, { s: [0.7098, 0.2706, 0.6431], t: 66 }] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 10 }, { ty: 4, nm: "Dot4", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -69.3 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [48], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [30], t: 56 }, { s: [10], t: 78 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [47], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [29], t: 56 }, { s: [9], t: 78 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [2], t: 56 }, { s: [0], t: 70 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.9294, 0.5765, 0.5765], t: 44 }, { s: [0.851, 0.6549, 0.6549], t: 56 }] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 11 }, { ty: 4, nm: "Dot3", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -55.9 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [45], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [20], t: 56 }, { s: [1], t: 89 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [44], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [19], t: 56 }, { s: [0], t: 89 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 56 }, { s: [0], t: 89 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.6392, 0.8118, 0.9686], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.851, 0.6549, 0.6549], t: 56 }, { s: [0.7098, 0.2706, 0.6431], t: 66 }] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 12 }, { ty: 4, nm: "Dot2", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: -13.4 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [48], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [30], t: 56 }, { s: [10], t: 78 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [47], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [29], t: 56 }, { s: [9], t: 78 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [2], t: 56 }, { s: [0], t: 70 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.8902, 0.6157, 0.6157], t: 44 }, { s: [0.6314, 0.5098, 0.6196], t: 56 }] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 13 }, { ty: 4, nm: "Dot1", sr: 1, st: -44, op: 90, ip: 44, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !1, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-37.5, -40.5], [-1, 0.5]] } } }, { ty: "tm", bm: 0, hd: !1, nm: "Trim Paths 1", ix: 2, e: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [45], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [20], t: 56 }, { s: [1], t: 89 }], ix: 2 }, o: { a: 0, k: 0, ix: 3 }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [44], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [19], t: 56 }, { s: [0], t: 89 }], ix: 1 }, m: 1 }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 2, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [5], t: 56 }, { s: [0], t: 89 }] }, c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.6196, 0.8784, 0.7804], t: 44 }, { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.8, 0.5216, 0.7608], t: 56 }, { s: [0.7098, 0.2706, 0.6431], t: 66 }] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 14 }, { ty: 4, nm: "C2", sr: 1, st: -47, op: 46, ip: 38, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Ellipse 1", it: [{ ty: "el", bm: 0, hd: !1, nm: "Ellipse Path 1", d: 1, p: { a: 0, k: [0, 0] }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [25.744, 25.744], t: 38 }, { s: [60.744, 60.744], t: 45 }] } }, { ty: "st", bm: 0, hd: !1, nm: "Stroke 1", lc: 1, lj: 1, ml: 4, o: { a: 0, k: 100 }, w: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [23.3], t: 38 }, { s: [1], t: 45 }] }, c: { a: 0, k: [0.8118, 0.5804, 0.9608] } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 15 }, { ty: 4, nm: "C1", sr: 1, st: -46, op: 39, ip: 33, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0, 0] }, s: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [4, 4, 100], t: 33 }, { s: [40, 40, 100], t: 39 }] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, r: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Ellipse 1", it: [{ ty: "el", bm: 0, hd: !1, nm: "Ellipse Path 1", d: 1, p: { a: 0, k: [0, 0] }, s: { a: 0, k: [57.344, 57.344] } }, { ty: "fl", bm: 0, hd: !1, nm: "Fill 1", c: { a: 1, k: [{ o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [0.0627, 0.7255, 0.5059], t: 33 }, { s: [0.8118, 0.5608, 0.9686], t: 39 }] }, r: 2, o: { a: 0, k: 100 } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 16 }, { ty: 4, nm: "H2", sr: 1, st: -46, op: 136, ip: 43, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [2.958, 2.958, 0] }, s: { a: 1, k: [{ o: { x: 0.68, y: 0 }, i: { x: 0.32, y: 1 }, s: [4, 4, 100], t: 43 }, { o: { x: 0.68, y: 0 }, i: { x: 0.32, y: 1 }, s: [48.44, 48.44, 100], t: 54 }, { o: { x: 0.68, y: 0 }, i: { x: 0.32, y: 1 }, s: [37.04, 37.04, 100], t: 70 }, { s: [40, 40, 100], t: 91 }] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50.217, 50.85, 0] }, r: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !0, i: [[4.833, 0], [0, -3.333], [-3.25, 0], [0, 8.333], [3.917, 0], [0, 0]], o: [[-4.833, 0], [0, 7.667], [3.25, 0], [0, -4.5], [-3.917, 0], [0, 0]], v: [[-4.583, -10.167], [-11.25, -2.25], [2.833, 16.083], [17.167, -2.333], [10.167, -10], [2.917, -5.917]] } } }, { ty: "fl", bm: 0, hd: !1, nm: "Fill 1", c: { a: 0, k: [0.1333, 0.7725, 0.3686] }, r: 2, o: { a: 0, k: 100 } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 17 }, { ty: 4, nm: "H1", sr: 1, st: -46, op: 33, ip: 30, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [2.958, 2.958, 0] }, s: { a: 0, k: [40, 40, 100] }, sk: { a: 0, k: 0 }, p: { a: 0, k: [50.217, 50.85, 0] }, r: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, o: { a: 0, k: 100 } }, ef: [], shapes: [{ ty: "gr", bm: 0, hd: !1, nm: "Shape 1", it: [{ ty: "sh", bm: 0, hd: !1, nm: "Path 1", d: 1, ks: { a: 0, k: { c: !0, i: [[4.833, 0], [0, -3.333], [-3.25, 0], [0, 8.333], [3.917, 0], [0, 0]], o: [[-4.833, 0], [0, 7.667], [3.25, 0], [0, -4.5], [-3.917, 0], [0, 0]], v: [[-4.583, -10.167], [-11.25, -2.25], [2.833, 16.083], [17.167, -2.333], [10.167, -10], [2.917, -5.917]] } } }, { ty: "fl", bm: 0, hd: !1, nm: "Fill 1", c: { a: 0, k: [0.6706, 0.7294, 0.7608] }, r: 2, o: { a: 0, k: 100 } }, { ty: "tr", a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, sk: { a: 0, k: 0, ix: 4 }, p: { a: 0, k: [0, 0], ix: 2 }, r: { a: 0, k: 0, ix: 6 }, sa: { a: 0, k: 0, ix: 5 }, o: { a: 0, k: 100, ix: 7 } }] }], ind: 18 }], v: "4.4.26", fr: 60, op: 116, ip: 30, assets: [] };

// app/components/HeartButton.tsx
var import_jsx_runtime4 = require("react/jsx-runtime"), Lottie = (0, import_react6.lazy)(() => import("lottie-react"));
function HeartButton({ playingVideoData, onHeartClick, hearted }) {
  let lottieRef = (0, import_react6.useRef)(), [clickedOnce, setClickedOnce] = (0, import_react6.useState)(!1);
  return (0, import_react6.useEffect)(() => {
    var _a, _b;
    if (!hearted) {
      setClickedOnce(!1);
      return;
    }
    let frame = (_a = lottieRef.current) == null ? void 0 : _a.getDuration(!0);
    (_b = lottieRef.current) == null || _b.goToAndStop(frame, !0);
  }, [playingVideoData.videoId]), /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "w-6 h-6 relative", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      import_outline.HeartIcon,
      {
        className: "peer/hearticon text-neutral-300 cursor-pointer hover:brightness-150" + t(hearted, "opacity-0") + t(!hearted && clickedOnce, "animate-wiggle-more animate-fill-backwards animate-duration-150"),
        onClick: () => {
          onHeartClick == null || onHeartClick({ playingVideoData }), setClickedOnce(!0);
        }
      }
    ),
    hearted && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "div",
      {
        className: `overflow-hidden w-14 h-14 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        -mt-0.5
        scale-125
        peer-hover/hearticon:brightness-150
        pointer-events-none
        `,
        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_react6.Suspense, { fallback: null, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          Lottie,
          {
            lottieRef,
            autoplay: !0,
            loop: !1,
            animationData: heart_default,
            className: `w-32 h-32 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    `
          }
        ) })
      }
    )
  ] });
}

// app/session.server.ts
var import_node = require("@remix-run/node"), import_tiny_invariant = __toESM(require("tiny-invariant"));
(0, import_tiny_invariant.default)(
  process.env.SESSION_SECRET,
  "SESSION_SECRET must be set in your environment variables."
);
var sessionStorage = (0, import_node.createCookieSessionStorage)({
  cookie: {
    name: "__session",
    httpOnly: !0,
    maxAge: 60,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: !0
  }
});
async function getSession(request) {
  let cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}
async function getUser(request) {
}
async function logout(request) {
  let session = await getSession(request);
  return (0, import_node.redirect)("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session)
    }
  });
}

// app/styles/tailwind.css
var tailwind_default = "/build/_assets/tailwind-UZWVC44I.css";

// node_modules/overlayscrollbars/styles/overlayscrollbars.css
var overlayscrollbars_default = "/build/_assets/overlayscrollbars-Q3AJV42M.css";

// app/root.tsx
var import_overlayscrollbars_react = require("overlayscrollbars-react");

// app/components/ItemPlaylist.tsx
var import_react7 = require("@remix-run/react");

// app/components/PlaylistIcon.tsx
var import_solid = require("@heroicons/react/24/solid");
var import_jsx_runtime5 = require("react/jsx-runtime");
function PlaylistIcon({ isHearted, className, iconClassName }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "flex-none bg-neutral-700  shadow-neutral-900/50 flex items-center justify-center" + t(isHearted, "bg-gradient-to-br from-indigo-700 to-teal-100/60") + ` ${className} `, children: isHearted ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_solid.HeartIcon, { className: `text-white ${iconClassName} ` }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_solid.MusicalNoteIcon, { className: `text-white ${iconClassName} ` }) });
}

// app/components/ItemPlaylist.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function ItemPlaylist({ playlist }) {
  let isHearted = playlist.type == "hearted";
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    import_react7.NavLink,
    {
      to: `playlist/${playlist.id}`,
      className: ({ isActive, isPending }) => "flex items-center space-x-2 px-2 py-2 hover:bg-white/2 rounded-lg cursor-pointer" + t(isActive, "bg-white/8"),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          PlaylistIcon,
          {
            className: "rounded shadow-lg shadow-black w-10 h-10",
            isHearted,
            iconClassName: "w-4 h-4"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "space-y-1 line-clamp-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "font-medium text-sm line-clamp-1" + t(isHearted, "text-green-500", "text-white"), children: playlist.name }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-neutral-400 font-medium text-xs line-clamp-1", children: playlist.creator })
        ] })
      ]
    }
  );
}

// app/atoms.tsx
var import_utils4 = require("jotai/utils"), playlistsAtom = (0, import_utils4.atomWithStorage)("playlists", [
  { id: "0000-0000-0000-0000", type: "hearted", videos: [], name: "Liked Songs", creator: "Muer" },
  { id: "0000-0000-0000-0001", type: "normal", videos: [], name: "Playlist #1", creator: "Muer" },
  { id: "0000-0000-0000-0002", type: "normal", videos: [], name: "Playlist #2", creator: "Muer" }
]), playerStateAtom = (0, import_utils4.atomWithStorage)(
  "playerState",
  {
    playing: !1,
    played: 0,
    playedSeconds: 0,
    loaded: 0,
    loadedSeconds: 0,
    buffering: !1,
    duration: void 0,
    progressValues: [0],
    error: !1,
    volume: 1,
    justLoadedFromStorage: !0
  },
  {
    ...(0, import_utils4.createJSONStorage)(() => localStorage),
    getItem: (key, initialValue) => {
      let storedValue = localStorage.getItem(key);
      if (!storedValue)
        return initialValue;
      try {
        let x = JSON.parse(storedValue);
        return x.playing = !1, x.justLoadedFromStorage = !0, x;
      } catch {
        return initialValue;
      }
    }
  }
), playingVideoDataAtom = (0, import_utils4.atomWithStorage)("playingVideoData", null);

// app/root.tsx
var import_jsx_runtime7 = require("react/jsx-runtime"), meta = () => ({ title: "Muer" }), links = () => [{ rel: "stylesheet", href: tailwind_default }, { rel: "stylesheet", href: overlayscrollbars_default }];
async function loader({ request }) {
  let env = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    COMMIT_REF: process.env.COMMIT_REF
  };
  return console.log("debug root loader"), (0, import_node2.json)({
    user: await getUser(request),
    env
  });
}
function App() {
  var _a, _b, _c, _d, _e;
  let { env } = (0, import_react8.useLoaderData)(), [supabase] = (0, import_react9.useState)(
    () => (0, import_auth_helpers_remix.createBrowserClient)(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  ), [playingVideoData, setPlayingVideoData] = (0, import_jotai.useAtom)(playingVideoDataAtom), [playlists, setPlaylists] = (0, import_jotai.useAtom)(playlistsAtom), fetcher = (0, import_react8.useFetcher)(), [fetcherDataShouldUpdateState, setFetcherDataShouldUpdateState] = (0, import_react9.useState)("skip_update");
  (0, import_react9.useEffect)(() => {
    console.log("debug playingVideoData", playingVideoData);
  }, [playingVideoData]), (0, import_react9.useEffect)(() => {
    console.log("debug fetcher.data", fetcher.data);
    let { video } = fetcher.data || {};
    if (!video) {
      console.log("Fetched empty data");
      return;
    }
    if (fetcherDataShouldUpdateState == "skip_update") {
      console.log("Should not update state, fetcher.data could have called effect because user navigated");
      return;
    }
    video.videoId == (playingVideoData == null ? void 0 : playingVideoData.videoId) && (setPlayingVideoData((v) => v ? fetcherDataShouldUpdateState == "update_keep_queue" ? {
      ...video,
      videoThumbnails: v.videoThumbnails,
      recommendedVideos: v.recommendedVideos
    } : {
      ...video,
      videoThumbnails: v.videoThumbnails
    } : video), setPlayerState((p) => ({
      ...p,
      buffering: !1,
      duration: void 0,
      // progressValues: [0],
      error: !1
    })), setFetcherDataShouldUpdateState("skip_update"));
  }, [fetcher.data]), (0, import_react9.useEffect)(() => {
    console.log("debug playlists changed", playlists);
  }, [playlists]);
  let onHeartClick = async ({ playingVideoData: playingVideoData2 }) => {
    var _a2, _b2, _c2, _d2;
    console.log("debug heart clicked", playingVideoData2);
    let heartedPlaylist = playlists.find((x) => x.type == "hearted");
    if (!heartedPlaylist)
      return;
    let hearted = heartedPlaylist.videos.some((video) => video.id == playingVideoData2.videoId), thumbnailUrl = (_b2 = (_a2 = playingVideoData2 == null ? void 0 : playingVideoData2.videoThumbnails) == null ? void 0 : _a2.at(0)) == null ? void 0 : _b2.url, newVideo = {
      id: playingVideoData2.videoId,
      author: ((_c2 = playingVideoData2 == null ? void 0 : playingVideoData2.musicTracks) == null ? void 0 : _c2.at(0).artist) || (playingVideoData2 == null ? void 0 : playingVideoData2.author) || "Unamed Author",
      title: ((_d2 = playingVideoData2 == null ? void 0 : playingVideoData2.musicTracks) == null ? void 0 : _d2.at(0).song) || (playingVideoData2 == null ? void 0 : playingVideoData2.title) || "Unamed Song",
      thumbnailUrl
    };
    heartedPlaylist.videos = hearted ? heartedPlaylist.videos.filter((video) => video.id != playingVideoData2.videoId) : [...heartedPlaylist.videos, newVideo], setPlaylists([...playlists]);
  }, onThumbnailClick = async ({ videoId, thumbnailUrl, title, author }, keepQueue = !1) => {
    if (console.log("clicked", videoId), videoId == (playingVideoData == null ? void 0 : playingVideoData.videoId)) {
      setPlayerState((p) => ({
        ...p,
        playing: !0
      }));
      return;
    }
    setPlayingVideoData((p) => ({
      recommendedVideos: (p == null ? void 0 : p.recommendedVideos) ?? [],
      videoThumbnails: [{
        url: thumbnailUrl
      }],
      title,
      author,
      videoId
    })), setPlayerState((p) => ({
      ...p,
      playing: !0,
      played: 0,
      playedSeconds: 0,
      loaded: 0,
      loadedSeconds: 0,
      buffering: !1,
      duration: void 0,
      progressValues: [0],
      error: !1
    })), fetcher.load(`/videoData/${videoId}`), setFetcherDataShouldUpdateState(keepQueue ? "update_keep_queue" : "update_all");
  }, [playerState, setPlayerState] = (0, import_jotai.useAtom)(playerStateAtom), playerRef = (0, import_react9.useRef)(null), [seekedOnce, setSeekedOnce] = (0, import_react9.useState)(!1), [libraryHeaderShowShadow, setLibraryHeaderShowShadow] = (0, import_react9.useState)(!1), [resizableWidth, setResizableWidth] = (0, import_react9.useState)(80), [isMobile, setIsMobile] = (0, import_react9.useState)(!0);
  return (0, import_react9.useEffect)(() => {
    let _isMobile = window.innerWidth <= 500;
    setIsMobile(_isMobile), _isMobile || setResizableWidth(Math.min(280, window.innerWidth / 3));
  }, []), /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("html", { lang: "en", className: "h-full scrollbar-none", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("head", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react8.Meta, {}),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react8.Links, {})
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("body", { className: "h-full font-inter", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "min-h-full bg-black flex flex-col", children: [
        playerState.error && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "bg-red-800 px-4 py-2 text-white", children: "Cannot play this song, please try another" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex-grow flex mt-2 h-0 mx-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            import_react_resizable.ResizableBox,
            {
              className: "flex",
              onResize: (_, { size }) => setResizableWidth(size.width),
              width: isMobile ? 80 : Math.min(280, window.innerWidth / 3),
              handle: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: `h-full w-2 hover:cursor-e-resize flex-none 
          opacity-0 hover:opacity-100
          transition-opacity relative`, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_solid3.EllipsisVerticalIcon, { className: "absolute w-4 h-4 text-white top-1/2 -translate-x-1" }) }),
              minConstraints: [80, -1],
              resizeHandles: ["e"],
              axis: "x",
              children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                "div",
                {
                  className: `
          overflow-y-hidden 
          
          flex-grow
          flex
          flex-col
          space-y-2
          `,
                  style: { width: resizableWidth + "px" },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "bg-neutral-900 rounded-lg px-6 py-4 flex-none space-y-6", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react8.NavLink, { to: "/", className: ({ isActive, isPending }) => "flex items-center space-x-4 hover:text-white transition-all" + t(isActive, "text-white", "text-neutral-400"), children: ({ isActive, isPending }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
                        isActive ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_solid2.HomeIcon, { className: "w-6 h-6 flex-none" }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_outline2.HomeIcon, { className: "w-6 h-6 flex-none" }),
                        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "font-semibold flex-1 line-clamp-1", children: "Home" })
                      ] }) }),
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react8.NavLink, { to: "/search", className: ({ isActive, isPending }) => "flex items-center  space-x-4 hover:text-white transition-all" + t(isActive, "text-white", "text-neutral-400"), children: ({ isActive, isPending }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
                        isActive ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_solid2.MagnifyingGlassIcon, { className: "w-6 h-6 flex-none" }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_outline2.MagnifyingGlassIcon, { className: "w-6 h-6 flex-none" }),
                        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "font-semibold flex-1 line-clamp-1", children: "Search" })
                      ] }) })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: `bg-neutral-900 rounded-lg flex-1 flex
                flex-col
                overflow-y-hidden 
                `, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center text-neutral-400 space-x-4 px-6 flex-none py-4 " + t(libraryHeaderShowShadow, "shadow-lg shadow-black"), children: [
                        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_solid2.RectangleStackIcon, { className: "w-6 h-6 flex-none" }),
                        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "font-semibold flex-1 line-clamp-1", children: "Your Library" })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                        import_overlayscrollbars_react.OverlayScrollbarsComponent,
                        {
                          defer: !0,
                          element: "div",
                          options: { scrollbars: { autoHide: "leave", autoHideDelay: 0 } },
                          className: "px-2 flex-1 py-2",
                          events: { scroll: (instance, event) => {
                            let { viewport } = instance.elements(), { scrollLeft, scrollTop } = viewport;
                            setLibraryHeaderShowShadow(scrollTop > 0);
                          } },
                          children: playlists.map((playlist) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ItemPlaylist, { playlist }, playlist.id))
                        }
                      )
                    ] })
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            import_overlayscrollbars_react.OverlayScrollbarsComponent,
            {
              defer: !0,
              element: "div",
              options: { scrollbars: { autoHide: "leave", autoHideDelay: 0 } },
              className: `
                bg-neutral-900 
                overflow-y-auto
                overflow-x-hidden
                w-full
                rounded-lg
              `,
              children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react8.Outlet, { context: { supabase, env, onThumbnailClick, playingVideoData } })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex-none bg-black h-20 grid space-x-4  grid-cols-3 sm:grid-cols-9 sm:px-4 overflow-hidden", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "col-span-3 flex space-x-4 items-center px-4 sm:px-0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              cimage_default,
              {
                className: "w-24 aspect-video object-cover rounded-lg flex-none select-none",
                src: (_b = (_a = playingVideoData == null ? void 0 : playingVideoData.videoThumbnails) == null ? void 0 : _a.at(0)) == null ? void 0 : _b.url,
                widthLargerThan: 960,
                heightLargerThan: 640
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex-grow sm:flex-grow-0", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "text-sm text-white font-semibold line-clamp-1 select-none", children: ((_c = playingVideoData == null ? void 0 : playingVideoData.musicTracks) == null ? void 0 : _c.at(0).song) || (playingVideoData == null ? void 0 : playingVideoData.title) || "No Title Playing" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "text-xs text-neutral-400 line-clamp-1 select-none", children: ((_d = playingVideoData == null ? void 0 : playingVideoData.musicTracks) == null ? void 0 : _d.at(0).artist) || (playingVideoData == null ? void 0 : playingVideoData.author) || "Author" })
            ] }),
            playingVideoData && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "flex-none", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(HeartButton, { playingVideoData, onHeartClick, hearted: (_e = playlists.find((x) => x.type == "hearted")) == null ? void 0 : _e.videos.some((video) => video.id == playingVideoData.videoId) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "button",
              {
                className: "sm:hidden" + t(playingVideoData != null, "hover:scale-105", "opacity-70"),
                onClick: () => {
                  playingVideoData != null && setPlayerState((p) => ({ ...p, playing: !p.playing }));
                },
                children: playerState.playing ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_solid3.PauseCircleIcon, { className: "w-10 h-10 text-white" }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_solid3.PlayCircleIcon, { className: "w-10 h-10 text-white" })
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "col-span-3 items-center hidden  sm:flex", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-1 w-full ", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "flex justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center space-x-3", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_solid3.BackwardIcon, { className: "w-6 h-6 text-neutral-400" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                "button",
                {
                  className: ` ${playingVideoData ? "hover:scale-105" : "opacity-70"}`,
                  onClick: () => {
                    playingVideoData != null && setPlayerState((p) => ({ ...p, playing: !p.playing }));
                  },
                  children: playerState.playing ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_solid3.PauseCircleIcon, { className: "w-10 h-10 text-white" }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_solid3.PlayCircleIcon, { className: "w-10 h-10 text-white" })
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_solid3.ForwardIcon, { className: "w-6 h-6 text-neutral-400" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-x-2 mx-auto flex items-center ", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "text-xs text-neutral-400 w-10 text-center select-none", children: new Date(playerState.playedSeconds * 1e3).toISOString().substring(14, 19).replace(/^0/, "") }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                import_react_range.Range,
                {
                  step: 1e-3,
                  min: 0,
                  max: 1,
                  values: playerState.progressValues,
                  onChange: (values) => {
                    setPlayerState((p) => ({
                      ...p,
                      progressValues: values
                    }));
                  },
                  onFinalChange: (values) => {
                    var _a2;
                    setPlayerState((p) => ({
                      ...p,
                      progressValues: values
                    })), (_a2 = playerRef == null ? void 0 : playerRef.current) == null || _a2.seekTo(values[0]);
                  },
                  renderTrack: ({ props, children }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                    "div",
                    {
                      onMouseDown: props.onMouseDown,
                      onTouchStart: props.onTouchStart,
                      className: "w-full py-1 group flex ",
                      style: props.style,
                      children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                        "div",
                        {
                          className: `w-full h-1 rounded-full overflow-hidden bg-white group-hover:bg-green-500 ${playerState.buffering ? "animate-pulse" : ""}`,
                          children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                            "div",
                            {
                              ref: props.ref,
                              style: {
                                background: (0, import_react_range.getTrackBackground)({
                                  values: playerState.progressValues,
                                  colors: [
                                    "transparent",
                                    playerState.buffering ? "#737373" : "#525252"
                                  ],
                                  min: 0,
                                  max: 1
                                })
                              },
                              className: "w-full h-1",
                              children
                            }
                          )
                        }
                      )
                    }
                  ),
                  renderThumb: ({ props, isDragged }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                    "div",
                    {
                      className: "invisible group-hover:visible focus:outline-none h-3 w-3 rounded-full shadow bg-white",
                      ...props,
                      style: {
                        ...props.style,
                        ...isDragged && { visibility: "visible" }
                      }
                    }
                  )
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "text-xs text-neutral-400 w-10 select-none", children: playerState.duration ? `-${new Date((playerState.duration - playerState.playedSeconds) * 1e3).toISOString().substring(14, 19).replace(/^0/, "")}` : "--:--" })
            ] })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "col-span-3 items-center space-x-2 justify-end hidden  sm:flex", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react8.NavLink, { to: "/radio", className: ({ isActive, isPending }) => "relative hover:scale-105" + t(isActive, "text-green-500 active", "text-neutral-400 hover:text-white "), children: ({ isActive, isPending }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_outline2.QueueListIcon, { className: "w-6 h-6 flex-none" }),
              isActive && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "absolute w-full text-center -bottom-4", children: "\u2022" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_outline2.SpeakerWaveIcon, { className: "w-6 h-6 text-neutral-400 flex-none" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "w-1/2 flex-shrink", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              import_react_range.Range,
              {
                step: 1e-3,
                min: 0,
                max: 1,
                values: [playerState.volume],
                onChange: (values) => {
                  setPlayerState((p) => ({
                    ...p,
                    volume: values.at(0)
                  }));
                },
                onFinalChange: (values) => {
                  setPlayerState((p) => ({
                    ...p,
                    volume: values.at(0)
                  }));
                },
                renderTrack: ({ props, children }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "div",
                  {
                    onMouseDown: props.onMouseDown,
                    onTouchStart: props.onTouchStart,
                    className: "w-full py-1 group flex ",
                    style: props.style,
                    children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                      "div",
                      {
                        className: "w-full h-1 rounded-full overflow-hidden bg-white group-hover:bg-green-500",
                        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                          "div",
                          {
                            ref: props.ref,
                            style: {
                              background: (0, import_react_range.getTrackBackground)({
                                values: [playerState.volume],
                                colors: [
                                  "transparent",
                                  "#525252"
                                ],
                                min: 0,
                                max: 1
                              })
                            },
                            className: "w-full h-1",
                            children
                          }
                        )
                      }
                    )
                  }
                ),
                renderThumb: ({ props, isDragged }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "div",
                  {
                    className: "invisible group-hover:visible focus:outline-none h-3 w-3 rounded-full shadow bg-white",
                    ...props,
                    style: {
                      ...props.style,
                      ...isDragged && { visibility: "visible" }
                    }
                  }
                )
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            Player,
            {
              playerRef,
              onVideoError: () => {
                setPlayerState((p) => ({
                  ...p,
                  // playing: true,
                  // played: 0,
                  // playedSeconds: 0,
                  // loaded: 0,
                  // loadedSeconds: 0,
                  error: !0
                }));
              },
              onReady: () => {
                console.log("debug on ready", playerState.played);
              },
              playing: playerState.playing,
              onProgress: ({ played, playedSeconds, loaded, loadedSeconds }) => {
                var _a2;
                if (console.log("debug played 1", played), playerState.justLoadedFromStorage) {
                  (_a2 = playerRef == null ? void 0 : playerRef.current) == null || _a2.seekTo(playerState.played, "fraction"), setPlayerState((p) => ({
                    ...p,
                    justLoadedFromStorage: !1
                  }));
                  return;
                }
                console.log("debug played 2", played), setPlayerState((p) => ({
                  ...p,
                  played,
                  playedSeconds,
                  loaded,
                  loadedSeconds,
                  progressValues: [played]
                }));
              },
              onPause: () => setPlayerState((p) => ({
                ...p,
                playing: !1
              })),
              onQueueEnded: () => {
                var _a2;
                setPlayerState((p) => ({
                  ...p,
                  playing: !1,
                  played: 0,
                  playedSeconds: 0,
                  loaded: 0,
                  loadedSeconds: 0,
                  progressValues: [0]
                })), (_a2 = playerRef == null ? void 0 : playerRef.current) == null || _a2.seekTo(0, "fraction");
              },
              onBuffer: () => {
                console.log("Start buffering"), playerState.playing && setPlayerState((p) => ({
                  ...p,
                  buffering: !0
                }));
              },
              onBufferEnd: () => {
                console.log("Done buffering"), setPlayerState((p) => ({
                  ...p,
                  buffering: !1
                }));
              },
              onDuration: (duration) => {
                console.log("debug duration", duration), setPlayerState((p) => ({
                  ...p,
                  duration
                }));
              },
              urls: [
                `https://www.youtube.com/watch?v=${playingVideoData == null ? void 0 : playingVideoData.videoId}`
              ],
              volume: playerState.volume
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react8.ScrollRestoration, {}),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react8.Scripts, {}),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react8.LiveReload, {})
    ] })
  ] });
}

// app/routes/playlist.$playlistId.tsx
var playlist_playlistId_exports = {};
__export(playlist_playlistId_exports, {
  default: () => PlaylistPage,
  loader: () => loader2
});
var import_solid5 = require("@heroicons/react/20/solid"), import_node3 = require("@remix-run/node"), import_react10 = require("@remix-run/react"), import_jotai2 = require("jotai"), import_zod = require("zod"), import_zodix = require("zodix");

// app/components/PlayButton.tsx
var import_solid4 = require("@heroicons/react/20/solid"), import_jsx_runtime8 = require("react/jsx-runtime");
function PlayButton_default({ className, iconClassName }) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "flex", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "hover:scale-105", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: `  bg-green-500 hover:bg-green-400 rounded-full shadow-lg shadow-neutral-900/50 ${className} `, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_solid4.PlayIcon, { className: `text-black ${iconClassName} ` }) }) }) });
}

// app/components/videoListThumbnail.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
function VideoListThumbnail(props) {
  let { video, active = !1 } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center space-x-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      cimage_default,
      {
        className: `
              hidden
              @xl/playlist:block
              object-cover aspect-video w-32 rounded shadow-lg shadow-neutral-900/50`,
        src: video.thumbnailUrl,
        widthLargerThan: 960,
        heightLargerThan: 640
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "font-medium line-clamp-1" + t(active, "text-green-500", "text-white"), children: video.title }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: " text-neutral-400 font-medium line-clamp-1", children: video.author })
    ] })
  ] });
}

// app/routes/playlist.$playlistId.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
async function loader2({ params }) {
  let { playlistId } = import_zodix.zx.parseParams(params, {
    playlistId: import_zod.z.string().trim().min(1).max(256)
  });
  return (0, import_node3.json)({ playlistId });
}
function PlaylistPage() {
  let loaderData = (0, import_react10.useLoaderData)(), [playlists, setPlaylists] = (0, import_jotai2.useAtom)(playlistsAtom), playlist = playlists.find((x) => x.id == loaderData.playlistId), { onThumbnailClick } = (0, import_react10.useOutletContext)(), isHearted = (playlist == null ? void 0 : playlist.type) == "hearted";
  return playlist ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "@container/playlist", children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-end space-x-4 p-6 pt-16 bg-indigo-700/70 bg-gradient-to-t from-black/50", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        PlaylistIcon,
        {
          className: "shadow-lg shadow-black hidden @xl/playlist:flex h-56 w-56",
          isHearted,
          iconClassName: "w-24 h-24"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "@xl/playlist:space-y-10 space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "space-y-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "text-white text-sm font-bold", children: "Playlist" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "text-white text-3xl font-extrabold @xl/playlist:text-8xl line-clamp-1", children: playlist.name })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-center space-x-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_solid5.MusicalNoteIcon, { className: "w-4 h-4 text-white" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: "text-white text-sm font-medium", children: [
            playlist.videos.length,
            " songs"
          ] })
        ] })
      ] })
    ] }),
    playlist.videos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: `bg-gradient-to-b from-indigo-950/60 bg-no-repeat bg-[length:auto_25vh] 
        px-6 py-6 space-y-6`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(PlayButton_default, { iconClassName: "w-7 h-7 ", className: "p-4" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("table", { className: "w-full border-separate border-spacing-0 ", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("tbody", { children: playlist.videos.map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
        "tr",
        {
          onClick: () => {
            onThumbnailClick({
              videoId: x.id,
              thumbnailUrl: x.thumbnailUrl,
              title: x.title,
              author: x.author
            });
          },
          className: "group/row cursor-pointer transition-all duration-150 ",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("td", { className: "w-8 @xl/playlist:w-16 pl-2 @xl/playlist:pl-6 group-hover/row:bg-white/8 rounded-l-lg text-neutral-400", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "group-hover/row:hidden text-sm @xl/playlist:text-base line-clamp-1", children: i }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "hidden group-hover/row:block text-white", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_solid5.PlayIcon, { className: "w-4 h-4" }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("td", { className: "py-3 pr-2 @xl/playlist:px-3 @xl/playlist:pr-6 group-hover/row:bg-white/8 rounded-r-lg", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(VideoListThumbnail, { video: x }) })
          ]
        },
        x.id
      )) }) })
    ] })
  ] }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "text-red-500", children: "Cannot find this playlist" }) });
}

// app/routes/videoData.$videoId.tsx
var videoData_videoId_exports = {};
__export(videoData_videoId_exports, {
  loader: () => loader3
});
var import_node4 = require("@remix-run/node"), import_zod2 = require("zod"), import_zodix2 = require("zodix");

// app/lib/youtube.server.ts
var YT_API_BASE = "https://www.googleapis.com/youtube/v3";
function getApiKey() {
  let key = process.env.YOUTUBE_API_KEY;
  if (!key)
    throw new Error("YOUTUBE_API_KEY is not set in environment variables");
  return key;
}
function parseDuration(duration) {
  let match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return match ? parseInt(match[1] || "0") * 3600 + parseInt(match[2] || "0") * 60 + parseInt(match[3] || "0") : 0;
}
function normalizeVideoItem(item) {
  var _a;
  let videoId = typeof item.id == "string" ? item.id : ((_a = item.id) == null ? void 0 : _a.videoId) ?? "", snippet = item.snippet ?? {}, statistics = item.statistics ?? {}, contentDetails = item.contentDetails ?? {};
  return {
    videoId,
    title: snippet.title ?? "",
    author: snippet.channelTitle ?? "",
    // Keep the same array shape Muer expects
    videoThumbnails: [
      { url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }
    ],
    description: snippet.description ?? "",
    viewCount: parseInt(statistics.viewCount ?? "0") || 0,
    likeCount: parseInt(statistics.likeCount ?? "0") || 0,
    lengthSeconds: parseDuration(contentDetails.duration ?? ""),
    published: snippet.publishedAt ?? "",
    // Shim so the existing root.tsx title/artist display still works
    musicTracks: [
      {
        song: snippet.title ?? "",
        artist: snippet.channelTitle ?? ""
      }
    ]
  };
}
async function fetchTrending() {
  let params = new URLSearchParams({
    part: "snippet,statistics",
    chart: "mostPopular",
    videoCategoryId: "10",
    // Music
    maxResults: "20",
    key: getApiKey()
  }), res = await fetch(`${YT_API_BASE}/videos?${params}`);
  if (!res.ok)
    throw new Error(`YouTube API error ${res.status}: ${await res.text()}`);
  return ((await res.json()).items ?? []).map(normalizeVideoItem);
}
async function searchVideos(q) {
  let params = new URLSearchParams({
    part: "snippet",
    q,
    type: "video",
    videoCategoryId: "10",
    // Music
    maxResults: "20",
    key: getApiKey()
  }), res = await fetch(`${YT_API_BASE}/search?${params}`);
  if (!res.ok)
    throw new Error(`YouTube API error ${res.status}: ${await res.text()}`);
  return ((await res.json()).items ?? []).map(normalizeVideoItem);
}
async function getVideoDetails(videoId) {
  var _a;
  let params = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    id: videoId,
    key: getApiKey()
  }), res = await fetch(`${YT_API_BASE}/videos?${params}`);
  if (!res.ok)
    throw new Error(`YouTube API error ${res.status}: ${await res.text()}`);
  let item = (_a = (await res.json()).items) == null ? void 0 : _a[0];
  if (!item)
    throw new Error("Video not found");
  return normalizeVideoItem(item);
}
async function getRelatedVideos(videoId) {
  let params = new URLSearchParams({
    part: "snippet",
    relatedToVideoId: videoId,
    type: "video",
    maxResults: "10",
    key: getApiKey()
  }), res = await fetch(`${YT_API_BASE}/search?${params}`);
  return res.ok ? ((await res.json()).items ?? []).map(normalizeVideoItem) : [];
}

// app/routes/videoData.$videoId.tsx
async function loader3({ params }) {
  let { videoId } = import_zodix2.zx.parseParams(params, {
    videoId: import_zod2.z.string().trim().min(1).max(256)
  });
  try {
    let [video, relatedVideos] = await Promise.all([
      getVideoDetails(videoId),
      getRelatedVideos(videoId)
    ]);
    return (0, import_node4.json)({
      video: {
        ...video,
        recommendedVideos: relatedVideos
      }
    });
  } catch (error) {
    return console.error("Error fetching video:", error), (0, import_node4.json)({});
  }
}

// app/routes/auth.callback.tsx
var auth_callback_exports = {};
__export(auth_callback_exports, {
  loader: () => loader4
});
var import_node5 = require("@remix-run/node"), import_auth_helpers_remix2 = require("@supabase/auth-helpers-remix"), loader4 = async ({ request }) => {
  let response = new Response(), code = new URL(request.url).searchParams.get("code");
  return code && await (0, import_auth_helpers_remix2.createServerClient)(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { request, response }
  ).auth.exchangeCodeForSession(code), (0, import_node5.redirect)("/", {
    headers: response.headers
  });
};

// app/routes/logout.tsx
var logout_exports = {};
__export(logout_exports, {
  action: () => action,
  loader: () => loader5
});
var import_node6 = require("@remix-run/node");
var action = async ({ request }) => logout(request);
async function loader5() {
  return (0, import_node6.redirect)("/");
}

// app/routes/search.tsx
var search_exports = {};
__export(search_exports, {
  action: () => action2,
  default: () => SearchPage,
  meta: () => meta2
});
var import_node7 = require("@remix-run/node"), import_react11 = require("@remix-run/react"), import_zodix3 = require("zodix"), import_zod3 = require("zod"), import_react_router = require("react-router"), import_jsx_runtime11 = require("react/jsx-runtime"), meta2 = () => ({ title: "Muer - Search" });
async function action2({ request, params }) {
  let validate_results = await import_zodix3.zx.parseFormSafe(request, {
    q: import_zod3.z.string({
      invalid_type_error: "q is not string",
      required_error: "q is required"
    }).trim().min(1).max(256)
  });
  if (validate_results.success == !1)
    return console.log("error validate form", validate_results.error), (0, import_react_router.json)({
      errors: validate_results.error.errors.map((e) => e.message)
    });
  let url = `/search/${validate_results.data.q}`;
  return (0, import_node7.redirect)(url);
}
function SearchPage() {
  let context = (0, import_react11.useOutletContext)();
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "px-6 py-8", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_react11.Form, { method: "post", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      "input",
      {
        type: "text",
        name: "q",
        className: `
            focus:outline-none
            focus:ring-none
            border-2
            border-white
            border-opacity-0
            focus:border-opacity-100
            bg-white/8 hover:bg-white/12 
            hover:outline hover:outline-1 hover:outline-neutral-600
            shadow shadow-neutral-900/50 text-white px-5 py-3.5 rounded-full
            placeholder:text-neutral-500
            text-xs
            font-medium
            w-80
            `,
        placeholder: "What do you want to listen to?"
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_react11.Outlet, { context })
  ] });
}

// app/routes/search/index.tsx
var search_exports2 = {};
__export(search_exports2, {
  default: () => SearchIndexPage
});
var import_jsx_runtime12 = require("react/jsx-runtime");
function SearchIndexPage() {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", {});
}

// app/routes/search/$q.tsx
var q_exports = {};
__export(q_exports, {
  default: () => SearchPage2,
  loader: () => loader6
});
var import_node8 = require("@remix-run/node"), import_react12 = require("@remix-run/react"), import_zod4 = require("zod"), import_zodix4 = require("zodix");

// app/components/videoThumbnail.tsx
var import_jsx_runtime13 = require("react/jsx-runtime");
function VideoThumbnail({ url, title, author, videoId, onThumbnailClick }) {
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
    "div",
    {
      className: `w-full p-4 bg-white/2 hover:bg-white/8 rounded transition-all duration-150
      cursor-pointer
      group
      `,
      onClick: () => {
        onThumbnailClick({
          videoId,
          thumbnailUrl: url,
          title,
          author
        });
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "relative", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
            cimage_default,
            {
              className: "object-cover aspect-video w-full rounded shadow-lg shadow-neutral-900/50",
              src: url,
              widthLargerThan: 960,
              heightLargerThan: 640
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "absolute bottom-2 right-2", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
            PlayButton_default,
            {
              className: "p-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300",
              iconClassName: "w-6 h-6"
            }
          ) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "pt-4 pb-2", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "text-sm font-semibold text-white line-clamp-2", children: title }) }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "text-sm text-neutral-400 line-clamp-1", children: author })
      ]
    }
  );
}
var videoThumbnail_default = VideoThumbnail;

// app/components/ThumbnailGrid.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
function ThumbnailGrid({ videos, onThumbnailClick }) {
  let thumbnails = videos == null ? void 0 : videos.map((video) => {
    let thumbnailUrl = video.videoThumbnails.find((x) => x.quality == "maxresdefault").url;
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
      videoThumbnail_default,
      {
        onThumbnailClick,
        author: video.author,
        title: video.title,
        url: thumbnailUrl,
        videoId: video.videoId
      },
      video.videoId
    );
  });
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "@container", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "grid grid-cols-1 @lg:grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4 gap-6", children: thumbnails }) });
}

// app/routes/search/$q.tsx
var import_jsx_runtime15 = require("react/jsx-runtime");
async function loader6({ params }) {
  let { q } = import_zodix4.zx.parseParams(params, {
    q: import_zod4.z.string().trim().min(1).max(256)
  });
  try {
    let results = await searchVideos(q);
    return (0, import_node8.json)({ results, q });
  } catch (error) {
    return console.error("Cannot fetch search results:", error), (0, import_node8.json)({ results: [], q, errors: ["Cannot fetch search results"] });
  }
}
function SearchPage2() {
  let { results, q } = (0, import_react12.useLoaderData)(), { onThumbnailClick } = (0, import_react12.useOutletContext)();
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "px-6 py-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "text-white font-bold text-2xl tracking-tight py-6", children: q ? `Results for "${q}"` : "Songs" }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(ThumbnailGrid, { videos: results, onThumbnailClick })
  ] });
}

// app/routes/admin.tsx
var admin_exports = {};
__export(admin_exports, {
  action: () => action3,
  default: () => AdminPage,
  loader: () => loader7
});
var import_node9 = require("@remix-run/node"), import_react13 = require("@remix-run/react"), import_child_process = require("child_process"), import_react14 = require("react"), import_jsx_runtime16 = require("react/jsx-runtime"), adminStorage = (0, import_node9.createCookieSessionStorage)({
  cookie: {
    name: "__admin",
    httpOnly: !0,
    maxAge: 60 * 60 * 24,
    // 24 hours
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET ?? "fallback-secret"],
    secure: !0
  }
});
async function getAdminSession(request) {
  return adminStorage.getSession(request.headers.get("Cookie"));
}
function isAuthenticated(session) {
  return session.get("admin") === !0;
}
async function loader7({ request }) {
  let session = await getAdminSession(request);
  if (!isAuthenticated(session))
    return (0, import_node9.json)({ authenticated: !1, commitHash: "", commitMsg: "", nodeVersion: "", uptime: 0 });
  let commitHash = "unknown", commitMsg = "unknown";
  try {
    commitHash = (0, import_child_process.execSync)("git rev-parse --short HEAD", { cwd: process.cwd() }).toString().trim(), commitMsg = (0, import_child_process.execSync)("git log -1 --format=%s", { cwd: process.cwd() }).toString().trim();
  } catch {
  }
  return (0, import_node9.json)({
    authenticated: !0,
    commitHash,
    commitMsg,
    nodeVersion: process.version,
    uptime: Math.floor(process.uptime())
  });
}
async function action3({ request }) {
  var _a, _b;
  let session = await getAdminSession(request), formData = await request.formData(), intent = String(formData.get("intent") ?? "");
  if (intent === "login") {
    let password = String(formData.get("password") ?? "");
    return password && password === process.env.ADMIN_PASSWORD ? (session.set("admin", !0), (0, import_node9.redirect)("/admin", {
      headers: { "Set-Cookie": await adminStorage.commitSession(session) }
    })) : (0, import_node9.json)({ error: "Invalid password" }, { status: 401 });
  }
  if (!isAuthenticated(session))
    return (0, import_node9.json)({ error: "Unauthorized" }, { status: 403 });
  if (intent === "logout")
    return (0, import_node9.redirect)("/", {
      headers: { "Set-Cookie": await adminStorage.destroySession(session) }
    });
  if (intent === "update") {
    let { writeFileSync } = await import("fs"), { spawn } = await import("child_process"), STATUS_FILE2 = "/tmp/muer-update.json", log = [], writeStatus = (status) => {
      try {
        writeFileSync(STATUS_FILE2, JSON.stringify({ status, log }));
      } catch {
      }
    };
    writeStatus("running");
    let child = spawn(
      "bash",
      [
        "-c",
        [
          `cd ${process.cwd()}`,
          "git pull 2>&1",
          "npm run build:selfhost 2>&1",
          "pm2 restart muer 2>&1 || true"
        ].join(" && ")
      ],
      { detached: !0, stdio: ["ignore", "pipe", "pipe"] }
    );
    return (_a = child.stdout) == null || _a.on("data", (d) => {
      log.push(d.toString()), writeStatus("running");
    }), (_b = child.stderr) == null || _b.on("data", (d) => {
      log.push(d.toString()), writeStatus("running");
    }), child.on("exit", (code) => {
      writeStatus(code === 0 ? "done" : "error");
    }), child.unref(), (0, import_node9.json)({ started: !0 });
  }
  return (0, import_node9.json)({ error: "Unknown intent" }, { status: 400 });
}
function formatUptime(seconds) {
  let h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}
function AdminPage() {
  var _a;
  let data = (0, import_react13.useLoaderData)(), actionData = (0, import_react13.useActionData)(), updateFetcher = (0, import_react13.useFetcher)(), [updateLog, setUpdateLog] = (0, import_react14.useState)([]), [updateStatus, setUpdateStatus] = (0, import_react14.useState)("idle"), pollingRef = (0, import_react14.useRef)(), logBoxRef = (0, import_react14.useRef)(null);
  (0, import_react14.useEffect)(() => {
    var _a2;
    (_a2 = updateFetcher.data) != null && _a2.started && (setUpdateStatus("running"), setUpdateLog([`Starting update\u2026
`]), schedulePoll());
  }, [updateFetcher.data]), (0, import_react14.useEffect)(() => {
    logBoxRef.current && (logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight);
  }, [updateLog]);
  function schedulePoll() {
    pollingRef.current = setTimeout(doPoll, 1500);
  }
  async function doPoll() {
    try {
      let resp = await fetch("/admin/update-status");
      if (!resp.ok) {
        setUpdateLog((l) => [...l, `Waiting for server to respond\u2026
`]), pollingRef.current = setTimeout(doPoll, 3e3);
        return;
      }
      let result = await resp.json();
      setUpdateLog(result.log ?? []), result.status === "running" ? pollingRef.current = setTimeout(doPoll, 1500) : result.status === "done" ? (setUpdateStatus("done"), setUpdateLog((l) => [...l, `
\u2713 Update complete! Server restarted.
`])) : (setUpdateStatus("error"), setUpdateLog((l) => [...l, `
\u2717 Update failed. Check the log above.
`]));
    } catch {
      setUpdateLog((l) => [
        ...l,
        `Server is restarting, waiting\u2026
`
      ]), pollingRef.current = setTimeout(doPoll, 3e3);
    }
  }
  if (!data.authenticated)
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "min-h-screen bg-black flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "bg-neutral-900 rounded-2xl p-8 w-80 shadow-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "flex items-center space-x-3 mb-6", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "w-8 h-8 bg-green-500 rounded-full flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("svg", { className: "w-4 h-4 text-black", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          "path",
          {
            fillRule: "evenodd",
            d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z",
            clipRule: "evenodd"
          }
        ) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h1", { className: "text-white text-xl font-bold", children: "Admin Panel" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_react13.Form, { method: "post", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("input", { type: "hidden", name: "intent", value: "login" }),
        (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "text-red-400 text-sm mb-3 bg-red-400/10 rounded-lg px-3 py-2", children: actionData.error }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          "input",
          {
            type: "password",
            name: "password",
            placeholder: "Password",
            autoFocus: !0,
            className: `w-full bg-neutral-800 text-white rounded-lg px-4 py-2.5 mb-4
                         border border-neutral-700 focus:outline-none focus:border-green-500
                         placeholder-neutral-500 text-sm`
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          "button",
          {
            type: "submit",
            className: `w-full bg-green-500 hover:bg-green-400 text-black font-semibold
                         rounded-full py-2.5 transition-colors text-sm`,
            children: "Sign in"
          }
        )
      ] })
    ] }) });
  let isUpdating = updateStatus === "running";
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "min-h-screen bg-black text-white p-6 sm:p-10", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "max-w-2xl mx-auto", children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "flex items-center justify-between mb-8", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "flex items-center space-x-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-none", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("svg", { className: "w-4 h-4 text-black", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h1", { className: "text-xl font-bold", children: "Admin Panel" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_react13.Form, { method: "post", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("input", { type: "hidden", name: "intent", value: "logout" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          "button",
          {
            type: "submit",
            className: "text-neutral-400 hover:text-white text-sm transition-colors",
            children: "Sign out"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "bg-neutral-900 rounded-xl p-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "text-neutral-500 text-xs mb-1 uppercase tracking-wide", children: "Commit" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "text-white font-mono text-sm font-semibold", children: data.commitHash }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "text-neutral-400 text-xs mt-1 line-clamp-2", children: data.commitMsg })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "bg-neutral-900 rounded-xl p-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "text-neutral-500 text-xs mb-1 uppercase tracking-wide", children: "Node.js" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "text-white font-mono text-sm font-semibold", children: data.nodeVersion })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "bg-neutral-900 rounded-xl p-4 col-span-2 sm:col-span-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "text-neutral-500 text-xs mb-1 uppercase tracking-wide", children: "Uptime" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "text-white font-mono text-sm font-semibold", children: formatUptime(data.uptime) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "bg-neutral-900 rounded-2xl p-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h2", { className: "text-white font-semibold text-lg mb-1", children: "Deploy Update" }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "text-neutral-400 text-sm mb-5", children: "Pulls the latest code from Git, rebuilds the app, and restarts the server automatically. All users will see the update within seconds." }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(updateFetcher.Form, { method: "post", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("input", { type: "hidden", name: "intent", value: "update" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          "button",
          {
            type: "submit",
            disabled: isUpdating,
            className: `
                inline-flex items-center space-x-2 font-semibold rounded-full px-6 py-2.5 text-sm
                transition-all
                ${isUpdating ? "bg-neutral-700 text-neutral-400 cursor-not-allowed" : updateStatus === "done" ? "bg-green-500 hover:bg-green-400 text-black" : updateStatus === "error" ? "bg-red-600 hover:bg-red-500 text-white" : "bg-green-500 hover:bg-green-400 text-black"}
              `,
            children: isUpdating ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_jsx_runtime16.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("svg", { className: "w-4 h-4 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: "Updating\u2026" })
            ] }) : updateStatus === "done" ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: "\u2713 Updated \u2014 Deploy Again" }) : updateStatus === "error" ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: "\u2717 Failed \u2014 Retry" }) : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: "Deploy Update" })
          }
        )
      ] }),
      updateLog.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "mt-5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "text-neutral-500 text-xs mb-2 uppercase tracking-wide", children: "Deployment Log" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          "pre",
          {
            ref: logBoxRef,
            className: `bg-black rounded-xl p-4 text-green-400 text-xs font-mono
                           overflow-auto max-h-72 whitespace-pre-wrap border border-neutral-800`,
            children: updateLog.join("")
          }
        )
      ] }),
      ((_a = updateFetcher.data) == null ? void 0 : _a.error) && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "mt-3 text-red-400 text-sm", children: updateFetcher.data.error })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "mt-6 text-center", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("a", { href: "/", className: "text-neutral-500 hover:text-white text-sm transition-colors", children: "\u2190 Back to app" }) })
  ] }) });
}

// app/routes/admin/update-status.tsx
var update_status_exports = {};
__export(update_status_exports, {
  loader: () => loader8
});
var import_node10 = require("@remix-run/node"), import_fs = require("fs"), STATUS_FILE = "/tmp/muer-update.json";
async function loader8({ request }) {
  try {
    let raw = (0, import_fs.readFileSync)(STATUS_FILE, "utf-8");
    return (0, import_node10.json)(JSON.parse(raw));
  } catch {
    return (0, import_node10.json)({ status: "idle", log: [] });
  }
}

// app/routes/index.tsx
var routes_exports = {};
__export(routes_exports, {
  default: () => IndexPage,
  loader: () => loader9
});
var import_node11 = require("@remix-run/node"), import_react15 = require("@remix-run/react");
var import_jsx_runtime17 = require("react/jsx-runtime");
async function loader9({ request }) {
  try {
    let trendingVideos = await fetchTrending();
    return (0, import_node11.json)({ trendingVideos });
  } catch (error) {
    return console.error("Error fetching trending videos:", error), (0, import_node11.json)({ trendingVideos: [] });
  }
}
function IndexPage() {
  let { trendingVideos } = (0, import_react15.useLoaderData)(), { onThumbnailClick } = (0, import_react15.useOutletContext)();
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "px-6 py-16 bg-gradient-to-b from-violet-950/60 bg-no-repeat bg-[length:auto_50vh]", children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "text-white font-bold text-3xl tracking-tight", children: "Good morning" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "text-white font-bold text-2xl tracking-tight py-6", children: "Trending" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(ThumbnailGrid, { videos: trendingVideos, onThumbnailClick }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "py-16", children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "text-sm text-white font-semibold py-2", children: "Organization" }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "text-sm text-neutral-400 py-2", children: "A modern, music-centric front-end powered by YouTube Music." })
    ] })
  ] });
}

// server-entry-module:@remix-run/dev/server-build
var route11 = __toESM(require_login());

// app/routes/radio.tsx
var radio_exports = {};
__export(radio_exports, {
  default: () => RadioPage
});
var import_solid6 = require("@heroicons/react/20/solid"), import_react16 = require("@remix-run/react");
var import_react17 = require("react");

// public/spectrum.json
var spectrum_default = { nm: "Flow 1", ddd: 0, h: 48, w: 48, meta: { g: "LottieFiles Figma v32" }, layers: [{ ty: 4, nm: "4", sr: 1, st: 0, op: 46.180001796688884, ip: 0, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, sk: { a: 0, k: 0 }, p: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [30, 29], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [30, 29], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [30, 24], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [30, 24], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [30, 29], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [30, 29], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [30, 25], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [30, 25], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [30, 29], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [30, 29], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [30, 29], t: 45.15000179526396 }, { s: [30, 29], t: 45.180001796688884 }] }, r: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [0], t: 45.15000179526396 }, { s: [0], t: 45.180001796688884 }] }, sa: { a: 0, k: 0 }, o: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [100], t: 45.15000179526396 }, { s: [100], t: 45.180001796688884 }] } }, ef: [], shapes: [{ ty: "sh", bm: 0, hd: !1, nm: "", d: 1, ks: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -6], [1.5, -6], [1.5, 6], [-1.5, 6]] }], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -6], [1.5, -6], [1.5, 6], [-1.5, 6]] }], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -5], [1.5, -5], [1.5, 5], [-1.5, 5]] }], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -5], [1.5, -5], [1.5, 5], [-1.5, 5]] }], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 45.15000179526396 }, { s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 45.180001796688884 }] } }, { ty: "fl", bm: 0, hd: !1, nm: "", c: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 45.15000179526396 }, { s: [0.1333, 0.7725, 0.3686], t: 45.180001796688884 }] }, r: 2, o: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [100], t: 45.15000179526396 }, { s: [100], t: 45.180001796688884 }] } }, { ty: "rc", bm: 0, hd: !1, nm: "", d: 1, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 0 }, s: { a: 0, k: [48, 48] } }, { ty: "fl", bm: 0, hd: !1, nm: "", c: { a: 0, k: [0, 0, 0] }, r: 2, o: { a: 0, k: 0 } }], ind: 1 }, { ty: 4, nm: "3", sr: 1, st: 0, op: 46.180001796688884, ip: 0, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, sk: { a: 0, k: 0 }, p: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [26, 29], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [26, 29], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [26, 29], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [26, 29], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [26, 24], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [26, 24], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [26, 27], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [26, 27], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [26, 29], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [26, 29], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [26, 29], t: 45.15000179526396 }, { s: [26, 29], t: 45.180001796688884 }] }, r: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [0], t: 45.15000179526396 }, { s: [0], t: 45.180001796688884 }] }, sa: { a: 0, k: 0 }, o: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [100], t: 45.15000179526396 }, { s: [100], t: 45.180001796688884 }] } }, ef: [], shapes: [{ ty: "sh", bm: 0, hd: !1, nm: "", d: 1, ks: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -6], [1.5, -6], [1.5, 6], [-1.5, 6]] }], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -6], [1.5, -6], [1.5, 6], [-1.5, 6]] }], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -3], [1.5, -3], [1.5, 3], [-1.5, 3]] }], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -3], [1.5, -3], [1.5, 3], [-1.5, 3]] }], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 45.15000179526396 }, { s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 45.180001796688884 }] } }, { ty: "fl", bm: 0, hd: !1, nm: "", c: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 45.15000179526396 }, { s: [0.1333, 0.7725, 0.3686], t: 45.180001796688884 }] }, r: 2, o: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [100], t: 45.15000179526396 }, { s: [100], t: 45.180001796688884 }] } }, { ty: "rc", bm: 0, hd: !1, nm: "", d: 1, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 0 }, s: { a: 0, k: [48, 48] } }, { ty: "fl", bm: 0, hd: !1, nm: "", c: { a: 0, k: [0, 0, 0] }, r: 2, o: { a: 0, k: 0 } }], ind: 2 }, { ty: 4, nm: "2", sr: 1, st: 0, op: 46.180001796688884, ip: 0, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, sk: { a: 0, k: 0 }, p: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [22, 29], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [22, 29], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [22, 26], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [22, 26], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [22, 29], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [22, 29], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [22, 29], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [22, 29], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [22, 26], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [22, 26], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [22, 29], t: 45.15000179526396 }, { s: [22, 29], t: 45.180001796688884 }] }, r: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [0], t: 45.15000179526396 }, { s: [0], t: 45.180001796688884 }] }, sa: { a: 0, k: 0 }, o: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [100], t: 45.15000179526396 }, { s: [100], t: 45.180001796688884 }] } }, ef: [], shapes: [{ ty: "sh", bm: 0, hd: !1, nm: "", d: 1, ks: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -4], [1.5, -4], [1.5, 4], [-1.5, 4]] }], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -4], [1.5, -4], [1.5, 4], [-1.5, 4]] }], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -4], [1.5, -4], [1.5, 4], [-1.5, 4]] }], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -4], [1.5, -4], [1.5, 4], [-1.5, 4]] }], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 45.15000179526396 }, { s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 45.180001796688884 }] } }, { ty: "fl", bm: 0, hd: !1, nm: "", c: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 45.15000179526396 }, { s: [0.1333, 0.7725, 0.3686], t: 45.180001796688884 }] }, r: 2, o: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [100], t: 45.15000179526396 }, { s: [100], t: 45.180001796688884 }] } }, { ty: "rc", bm: 0, hd: !1, nm: "", d: 1, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 0 }, s: { a: 0, k: [48, 48] } }, { ty: "fl", bm: 0, hd: !1, nm: "", c: { a: 0, k: [0, 0, 0] }, r: 2, o: { a: 0, k: 0 } }], ind: 3 }, { ty: 4, nm: "1", sr: 1, st: 0, op: 46.180001796688884, ip: 0, hd: !1, ddd: 0, bm: 0, hasMask: !1, ao: 0, ks: { a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, sk: { a: 0, k: 0 }, p: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [18, 29], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [18, 29], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [18, 29], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [18, 29], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [18, 24], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [18, 24], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [18, 26], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [18, 26], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [18, 24], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [18, 24], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [18, 29], t: 45.15000179526396 }, { s: [18, 29], t: 45.180001796688884 }] }, r: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [0], t: 45.15000179526396 }, { s: [0], t: 45.180001796688884 }] }, sa: { a: 0, k: 0 }, o: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [100], t: 45.15000179526396 }, { s: [100], t: 45.180001796688884 }] } }, ef: [], shapes: [{ ty: "sh", bm: 0, hd: !1, nm: "", d: 1, ks: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -6], [1.5, -6], [1.5, 6], [-1.5, 6]] }], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -6], [1.5, -6], [1.5, 6], [-1.5, 6]] }], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -4], [1.5, -4], [1.5, 4], [-1.5, 4]] }], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -4], [1.5, -4], [1.5, 4], [-1.5, 4]] }], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -6], [1.5, -6], [1.5, 6], [-1.5, 6]] }], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -6], [1.5, -6], [1.5, 6], [-1.5, 6]] }], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 45.15000179526396 }, { s: [{ c: !0, i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]] }], t: 45.180001796688884 }] } }, { ty: "fl", bm: 0, hd: !1, nm: "", c: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [0.1333, 0.7725, 0.3686], t: 45.15000179526396 }, { s: [0.1333, 0.7725, 0.3686], t: 45.180001796688884 }] }, r: 2, o: { a: 1, k: [{ o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 0.03000000142492354 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.030000359052792 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 9.060000360477716 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.060000718105584 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 18.090000719530508 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.090001077158377 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 27.1200010785833 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.12000143621117 }, { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 }, s: [100], t: 36.15000143763609 }, { o: { x: 0, y: 0 }, i: { x: 1, y: 1 }, s: [100], t: 45.15000179526396 }, { s: [100], t: 45.180001796688884 }] } }, { ty: "rc", bm: 0, hd: !1, nm: "", d: 1, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 0 }, s: { a: 0, k: [48, 48] } }, { ty: "fl", bm: 0, hd: !1, nm: "", c: { a: 0, k: [0, 0, 0] }, r: 2, o: { a: 0, k: 0 } }], ind: 4 }], v: "5.7.0", fr: 30, op: 45.180001796688884, ip: 0, assets: [] };

// app/routes/radio.tsx
var import_jsx_runtime18 = require("react/jsx-runtime"), Lottie2 = (0, import_react17.lazy)(() => import("lottie-react"));
function RadioPage() {
  var _a, _b, _c, _d;
  let { onThumbnailClick, playingVideoData } = (0, import_react16.useOutletContext)(), thumbnailUrl = ((_b = (_a = playingVideoData == null ? void 0 : playingVideoData.videoThumbnails) == null ? void 0 : _a.find((x) => x.quality == "maxresdefault")) == null ? void 0 : _b.url) || ((_d = (_c = playingVideoData == null ? void 0 : playingVideoData.videoThumbnails) == null ? void 0 : _c.at(0)) == null ? void 0 : _d.url), currentPosition = (playingVideoData == null ? void 0 : playingVideoData.recommendedVideos.findIndex((x) => x.videoId == playingVideoData.videoId)) ?? 0, upcomingVideos = playingVideoData == null ? void 0 : playingVideoData.recommendedVideos.slice(currentPosition + 1);
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "p-6 pt-16 @container/playlist", children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { className: "font-bold text-2xl text-white my-6", children: "Radio" }),
    upcomingVideos ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "space-y-8", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { className: "font-semibold text-neutral-400 line-clamp-1", children: "Now playing" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("table", { className: "w-full border-separate border-spacing-0 ", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("tbody", { children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
          "tr",
          {
            onClick: () => {
              onThumbnailClick({
                videoId: playingVideoData.videoId,
                title: playingVideoData.title,
                author: playingVideoData.author,
                thumbnailUrl
              });
            },
            className: "group/row cursor-pointer transition-all duration-150 ",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("td", { className: "w-16 pl-6 group-hover/row:bg-white/8 rounded-l-lg text-green-500", children: [
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "group-hover/row:hidden w-8 h-8 overflow-hidden relative", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_react17.Suspense, { fallback: null, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                  Lottie2,
                  {
                    autoplay: !0,
                    loop: !0,
                    animationData: spectrum_default,
                    className: "w-16 h-16 absolute -top-4 -left-4"
                  }
                ) }) }),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "hidden group-hover/row:flex text-white w-8 h-8  items-center justify-end", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_solid6.PlayIcon, { className: "w-4 h-4" }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("td", { className: "p-3 pr-6 group-hover/row:bg-white/8 rounded-r-lg", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                VideoListThumbnail,
                {
                  active: !0,
                  video: {
                    id: playingVideoData.videoId,
                    title: playingVideoData.title,
                    author: playingVideoData.author,
                    thumbnailUrl
                  }
                }
              ) })
            ]
          }
        ) }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { className: "font-semibold text-neutral-400 line-clamp-1", children: "Coming up" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("table", { className: "w-full border-separate border-spacing-0 ", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("tbody", { children: upcomingVideos.map((x, i) => {
          let thumbnailUrl2 = x.videoThumbnails.find((x2) => x2.quality == "maxresdefault").url, video = {
            id: x.videoId,
            title: x.title,
            author: x.author,
            thumbnailUrl: thumbnailUrl2
          };
          return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
            "tr",
            {
              onClick: () => {
                onThumbnailClick({
                  videoId: x.videoId,
                  title: x.title,
                  author: x.author,
                  thumbnailUrl: thumbnailUrl2
                }, !0);
              },
              className: "group/row cursor-pointer transition-all duration-150 ",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("td", { className: "w-16 pl-6 group-hover/row:bg-white/8 rounded-l-lg text-neutral-400", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "group-hover/row:hidden w-8 h-8 flex items-center justify-end", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { children: 2 + i }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "hidden group-hover/row:flex text-white w-8 h-8  items-center justify-end", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_solid6.PlayIcon, { className: "w-4 h-4" }) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("td", { className: "p-3 pr-6 group-hover/row:bg-white/8 rounded-r-lg", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(VideoListThumbnail, { video }) })
              ]
            },
            x.videoId
          );
        }) }) })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { className: "text-white", children: "..." })
  ] });
}

// server-entry-module:@remix-run/dev/server-build
var route13 = __toESM(require_join());

// server-assets-manifest:@remix-run/dev/assets-manifest
var assets_manifest_default = { entry: { module: "/build/entry.client-74UZU4C7.js", imports: ["/build/_shared/chunk-OTD7IDZ2.js", "/build/_shared/chunk-ODWPOTB2.js", "/build/_shared/chunk-EGUFTJK4.js", "/build/_shared/chunk-EUXZ3SXT.js", "/build/_shared/chunk-G5WX4PPA.js"] }, routes: { root: { id: "root", parentId: void 0, path: "", index: void 0, caseSensitive: void 0, module: "/build/root-5VHNGOR7.js", imports: ["/build/_shared/chunk-SGV2E553.js", "/build/_shared/chunk-2HJJ5UVI.js", "/build/_shared/chunk-UKNWMHVW.js", "/build/_shared/chunk-5TRFQBKG.js"], hasAction: !1, hasLoader: !0, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/admin": { id: "routes/admin", parentId: "root", path: "admin", index: void 0, caseSensitive: void 0, module: "/build/routes/admin-ZFXCGM37.js", imports: ["/build/_shared/chunk-S65AG5BZ.js"], hasAction: !0, hasLoader: !0, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/admin/update-status": { id: "routes/admin/update-status", parentId: "routes/admin", path: "update-status", index: void 0, caseSensitive: void 0, module: "/build/routes/admin/update-status-IUBNCVYC.js", imports: void 0, hasAction: !1, hasLoader: !0, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/auth.callback": { id: "routes/auth.callback", parentId: "root", path: "auth/callback", index: void 0, caseSensitive: void 0, module: "/build/routes/auth.callback-AGR54CDW.js", imports: void 0, hasAction: !1, hasLoader: !0, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/index": { id: "routes/index", parentId: "root", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/index-3WHSQALF.js", imports: ["/build/_shared/chunk-2ISNDPMP.js", "/build/_shared/chunk-YKNBNEUI.js"], hasAction: !1, hasLoader: !0, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/join": { id: "routes/join", parentId: "root", path: "join", index: void 0, caseSensitive: void 0, module: "/build/routes/join-H7TW5SQN.js", imports: void 0, hasAction: !1, hasLoader: !1, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/login": { id: "routes/login", parentId: "root", path: "login", index: void 0, caseSensitive: void 0, module: "/build/routes/login-3KKR5BET.js", imports: void 0, hasAction: !1, hasLoader: !1, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/logout": { id: "routes/logout", parentId: "root", path: "logout", index: void 0, caseSensitive: void 0, module: "/build/routes/logout-MWX2H6AO.js", imports: void 0, hasAction: !0, hasLoader: !0, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/playlist.$playlistId": { id: "routes/playlist.$playlistId", parentId: "root", path: "playlist/:playlistId", index: void 0, caseSensitive: void 0, module: "/build/routes/playlist.$playlistId-GOE6YWK7.js", imports: ["/build/_shared/chunk-YKNBNEUI.js", "/build/_shared/chunk-GFFET7T4.js", "/build/_shared/chunk-CRFSZCGE.js"], hasAction: !1, hasLoader: !0, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/radio": { id: "routes/radio", parentId: "root", path: "radio", index: void 0, caseSensitive: void 0, module: "/build/routes/radio-LJP73XO2.js", imports: ["/build/_shared/chunk-GFFET7T4.js"], hasAction: !1, hasLoader: !1, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/search": { id: "routes/search", parentId: "root", path: "search", index: void 0, caseSensitive: void 0, module: "/build/routes/search-SQMFL4LA.js", imports: ["/build/_shared/chunk-CRFSZCGE.js"], hasAction: !0, hasLoader: !1, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/search/$q": { id: "routes/search/$q", parentId: "routes/search", path: ":q", index: void 0, caseSensitive: void 0, module: "/build/routes/search/$q-7VRTZ53Z.js", imports: ["/build/_shared/chunk-2ISNDPMP.js", "/build/_shared/chunk-YKNBNEUI.js", "/build/_shared/chunk-UKNWMHVW.js", "/build/_shared/chunk-5TRFQBKG.js"], hasAction: !1, hasLoader: !0, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/search/index": { id: "routes/search/index", parentId: "routes/search", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/search/index-46E23YFZ.js", imports: void 0, hasAction: !1, hasLoader: !1, hasCatchBoundary: !1, hasErrorBoundary: !1 }, "routes/videoData.$videoId": { id: "routes/videoData.$videoId", parentId: "root", path: "videoData/:videoId", index: void 0, caseSensitive: void 0, module: "/build/routes/videoData.$videoId-KY2GBUCG.js", imports: void 0, hasAction: !1, hasLoader: !0, hasCatchBoundary: !1, hasErrorBoundary: !1 } }, version: "93bcd64d", hmr: void 0, url: "/build/manifest-93BCD64D.js" };

// server-entry-module:@remix-run/dev/server-build
var assetsBuildDirectory = "public/build", future = { v2_dev: !1, unstable_postcss: !1, unstable_tailwind: !1, v2_errorBoundary: !1, v2_headers: !1, v2_meta: !1, v2_normalizeFormMethod: !1, v2_routeConvention: !1 }, publicPath = "/build/", entry = { module: entry_server_exports }, routes = {
  root: {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: root_exports
  },
  "routes/playlist.$playlistId": {
    id: "routes/playlist.$playlistId",
    parentId: "root",
    path: "playlist/:playlistId",
    index: void 0,
    caseSensitive: void 0,
    module: playlist_playlistId_exports
  },
  "routes/videoData.$videoId": {
    id: "routes/videoData.$videoId",
    parentId: "root",
    path: "videoData/:videoId",
    index: void 0,
    caseSensitive: void 0,
    module: videoData_videoId_exports
  },
  "routes/auth.callback": {
    id: "routes/auth.callback",
    parentId: "root",
    path: "auth/callback",
    index: void 0,
    caseSensitive: void 0,
    module: auth_callback_exports
  },
  "routes/logout": {
    id: "routes/logout",
    parentId: "root",
    path: "logout",
    index: void 0,
    caseSensitive: void 0,
    module: logout_exports
  },
  "routes/search": {
    id: "routes/search",
    parentId: "root",
    path: "search",
    index: void 0,
    caseSensitive: void 0,
    module: search_exports
  },
  "routes/search/index": {
    id: "routes/search/index",
    parentId: "routes/search",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: search_exports2
  },
  "routes/search/$q": {
    id: "routes/search/$q",
    parentId: "routes/search",
    path: ":q",
    index: void 0,
    caseSensitive: void 0,
    module: q_exports
  },
  "routes/admin": {
    id: "routes/admin",
    parentId: "root",
    path: "admin",
    index: void 0,
    caseSensitive: void 0,
    module: admin_exports
  },
  "routes/admin/update-status": {
    id: "routes/admin/update-status",
    parentId: "routes/admin",
    path: "update-status",
    index: void 0,
    caseSensitive: void 0,
    module: update_status_exports
  },
  "routes/index": {
    id: "routes/index",
    parentId: "root",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: routes_exports
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "login",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/radio": {
    id: "routes/radio",
    parentId: "root",
    path: "radio",
    index: void 0,
    caseSensitive: void 0,
    module: radio_exports
  },
  "routes/join": {
    id: "routes/join",
    parentId: "root",
    path: "join",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  assets,
  assetsBuildDirectory,
  entry,
  future,
  publicPath,
  routes
});
