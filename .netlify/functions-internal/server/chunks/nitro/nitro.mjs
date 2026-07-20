import { GoogleGenAI, Type } from '@google/genai';
import { mkdir, writeFile as writeFile$1, readFile as readFile$1 } from 'node:fs/promises';
import path, { resolve, dirname, join } from 'node:path';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { View, Text, Page, Document } from '@react-pdf/primitives';
import { Buffer as Buffer$2 } from 'buffer';
import FontStore from '@react-pdf/font';
import renderPDF from '@react-pdf/render';
import PDFDocument from '@react-pdf/pdfkit';
import layoutDocument from '@react-pdf/layout';
import { upperFirst } from '@react-pdf/fns';
import Reconciler from '@react-pdf/reconciler';
import { Readable } from 'node:stream';
import Stripe from 'stripe';
import pg from 'pg';
import nodeCrypto, { createHash } from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { Buffer as Buffer$1 } from 'node:buffer';
import { promises, existsSync } from 'node:fs';

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
const ENC_SLASH_RE = /%2f/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode$1(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode$1(text.replace(ENC_SLASH_RE, "%252F"));
}
function decodeQueryKey(text) {
  return decode$1(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode$1(text.replace(PLUS_RE, " "));
}

function parseQuery(parametersString = "") {
  const object = /* @__PURE__ */ Object.create(null);
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map(
      (_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`
    ).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}

const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
const PROTOCOL_SCRIPT_RE = /^[\s\0]*(blob|data|javascript|vbscript):$/i;
const TRAILING_SLASH_RE = /\/$|\/\?|\/#/;
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function isScriptProtocol(protocol) {
  return !!protocol && PROTOCOL_SCRIPT_RE.test(protocol);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/");
  }
  return TRAILING_SLASH_RE.test(input);
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
  if (!hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
  }
  const [s0, ...s] = path.split("?");
  const cleanPath = s0.endsWith("/") ? s0.slice(0, -1) : s0;
  return (cleanPath || "/") + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/") ? input : input + "/";
  }
  if (hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
    if (!path) {
      return fragment;
    }
  }
  const [s0, ...s] = path.split("?");
  return s0 + "/" + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    const nextChar = input[_base.length];
    if (!nextChar || nextChar === "/" || nextChar === "?") {
      return input;
    }
  }
  return joinURL(_base, input);
}
function withoutBase(input, base) {
  if (isEmptyURL(base)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (!input.startsWith(_base)) {
    return input;
  }
  const nextChar = input[_base.length];
  if (nextChar && nextChar !== "/" && nextChar !== "?") {
    return input;
  }
  const trimmed = input.slice(_base.length).replace(/^\/+/, "");
  return "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery$1(input) {
  return parseQuery(parseURL(input).search);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
function joinRelativeURL(..._input) {
  const JOIN_SEGMENT_SPLIT_RE = /\/(?!\/)/;
  const input = _input.filter(Boolean);
  const segments = [];
  let segmentsDepth = 0;
  for (const i of input) {
    if (!i || i === "/") {
      continue;
    }
    for (const [sindex, s] of i.split(JOIN_SEGMENT_SPLIT_RE).entries()) {
      if (!s || s === ".") {
        continue;
      }
      if (s === "..") {
        if (segments.length === 1 && hasProtocol(segments[0])) {
          continue;
        }
        segments.pop();
        segmentsDepth--;
        continue;
      }
      if (sindex === 1 && segments[segments.length - 1]?.endsWith(":/")) {
        segments[segments.length - 1] += "/" + s;
        continue;
      }
      segments.push(s);
      segmentsDepth++;
    }
  }
  let url = segments.join("/");
  if (segmentsDepth >= 0) {
    if (input[0]?.startsWith("/") && !url.startsWith("/")) {
      url = "/" + url;
    } else if (input[0]?.startsWith("./") && !url.startsWith("./")) {
      url = "./" + url;
    }
  } else {
    url = "../".repeat(-1 * segmentsDepth) + url;
  }
  if (input[input.length - 1]?.endsWith("/") && !url.endsWith("/")) {
    url += "/";
  }
  return url;
}

const protocolRelative = Symbol.for("ufo:protocolRelative");
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path = path.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

const NullObject = /* @__PURE__ */ (() => {
  const C = function() {
  };
  C.prototype = /* @__PURE__ */ Object.create(null);
  return C;
})();
function parse$1(str, options) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }
  const obj = new NullObject();
  const opt = {};
  const dec = opt.decode || decode;
  let index = 0;
  while (index < str.length) {
    const eqIdx = str.indexOf("=", index);
    if (eqIdx === -1) {
      break;
    }
    let endIdx = str.indexOf(";", index);
    if (endIdx === -1) {
      endIdx = str.length;
    } else if (endIdx < eqIdx) {
      index = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }
    const key = str.slice(index, eqIdx).trim();
    if (opt?.filter && !opt?.filter(key)) {
      index = endIdx + 1;
      continue;
    }
    if (void 0 === obj[key]) {
      let val = str.slice(eqIdx + 1, endIdx).trim();
      if (val.codePointAt(0) === 34) {
        val = val.slice(1, -1);
      }
      obj[key] = tryDecode(val, dec);
    }
    index = endIdx + 1;
  }
  return obj;
}
function decode(str) {
  return str.includes("%") ? decodeURIComponent(str) : str;
}
function tryDecode(str, decode2) {
  try {
    return decode2(str);
  } catch {
    return str;
  }
}

const fieldContentRegExp = /^[\u0009\u0020-\u007E\u0080-\u00FF]+$/;
function serialize$1(name, value, options) {
  const opt = options || {};
  const enc = opt.encode || encodeURIComponent;
  if (typeof enc !== "function") {
    throw new TypeError("option encode is invalid");
  }
  if (!fieldContentRegExp.test(name)) {
    throw new TypeError("argument name is invalid");
  }
  const encodedValue = enc(value);
  if (encodedValue && !fieldContentRegExp.test(encodedValue)) {
    throw new TypeError("argument val is invalid");
  }
  let str = name + "=" + encodedValue;
  if (void 0 !== opt.maxAge && opt.maxAge !== null) {
    const maxAge = opt.maxAge - 0;
    if (Number.isNaN(maxAge) || !Number.isFinite(maxAge)) {
      throw new TypeError("option maxAge is invalid");
    }
    str += "; Max-Age=" + Math.floor(maxAge);
  }
  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError("option domain is invalid");
    }
    str += "; Domain=" + opt.domain;
  }
  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError("option path is invalid");
    }
    str += "; Path=" + opt.path;
  }
  if (opt.expires) {
    if (!isDate(opt.expires) || Number.isNaN(opt.expires.valueOf())) {
      throw new TypeError("option expires is invalid");
    }
    str += "; Expires=" + opt.expires.toUTCString();
  }
  if (opt.httpOnly) {
    str += "; HttpOnly";
  }
  if (opt.secure) {
    str += "; Secure";
  }
  if (opt.priority) {
    const priority = typeof opt.priority === "string" ? opt.priority.toLowerCase() : opt.priority;
    switch (priority) {
      case "low": {
        str += "; Priority=Low";
        break;
      }
      case "medium": {
        str += "; Priority=Medium";
        break;
      }
      case "high": {
        str += "; Priority=High";
        break;
      }
      default: {
        throw new TypeError("option priority is invalid");
      }
    }
  }
  if (opt.sameSite) {
    const sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
    switch (sameSite) {
      case true: {
        str += "; SameSite=Strict";
        break;
      }
      case "lax": {
        str += "; SameSite=Lax";
        break;
      }
      case "strict": {
        str += "; SameSite=Strict";
        break;
      }
      case "none": {
        str += "; SameSite=None";
        break;
      }
      default: {
        throw new TypeError("option sameSite is invalid");
      }
    }
  }
  if (opt.partitioned) {
    str += "; Partitioned";
  }
  return str;
}
function isDate(val) {
  return Object.prototype.toString.call(val) === "[object Date]" || val instanceof Date;
}

function parseSetCookie(setCookieValue, options) {
  const parts = (setCookieValue || "").split(";").filter((str) => typeof str === "string" && !!str.trim());
  const nameValuePairStr = parts.shift() || "";
  const parsed = _parseNameValuePair(nameValuePairStr);
  const name = parsed.name;
  let value = parsed.value;
  try {
    value = options?.decode === false ? value : (options?.decode || decodeURIComponent)(value);
  } catch {
  }
  const cookie = {
    name,
    value
  };
  for (const part of parts) {
    const sides = part.split("=");
    const partKey = (sides.shift() || "").trimStart().toLowerCase();
    const partValue = sides.join("=");
    switch (partKey) {
      case "expires": {
        cookie.expires = new Date(partValue);
        break;
      }
      case "max-age": {
        cookie.maxAge = Number.parseInt(partValue, 10);
        break;
      }
      case "secure": {
        cookie.secure = true;
        break;
      }
      case "httponly": {
        cookie.httpOnly = true;
        break;
      }
      case "samesite": {
        cookie.sameSite = partValue;
        break;
      }
      default: {
        cookie[partKey] = partValue;
      }
    }
  }
  return cookie;
}
function _parseNameValuePair(nameValuePairStr) {
  let name = "";
  let value = "";
  const nameValueArr = nameValuePairStr.split("=");
  if (nameValueArr.length > 1) {
    name = nameValueArr.shift();
    value = nameValueArr.join("=");
  } else {
    value = nameValuePairStr;
  }
  return { name, value };
}

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode === void 0) {
      if (node && node.placeholderChildren.length > 1) {
        const remaining = sections.length - i;
        node = node.placeholderChildren.find((c) => c.maxDepth === remaining) || null;
      } else {
        node = node.placeholderChildren[0] || null;
      }
      if (!node) {
        break;
      }
      if (node.paramName) {
        params[node.paramName] = section;
      }
      paramsFound = true;
    } else {
      node = nextNode;
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  const matchedNodes = [node];
  for (const section of sections) {
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildren.push(childNode);
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(
          3
          /* "**:" */
        ) || "_";
        isStaticRoute = false;
      }
      matchedNodes.push(childNode);
      node = childNode;
    }
  }
  for (const [depth, node2] of matchedNodes.entries()) {
    node2.maxDepth = Math.max(matchedNodes.length - depth, node2.maxDepth || 0);
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections.at(-1) || "";
    node.data = null;
    if (Object.keys(node.children).length === 0 && node.parent) {
      node.parent.children.delete(lastSection);
      node.parent.wildcardChildNode = null;
      node.parent.placeholderChildren = [];
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    maxDepth: 0,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildren: []
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table, router.ctx.options.strictTrailingSlash);
}
function _createMatcher(table, strictTrailingSlash) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table, strictTrailingSlash)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table, strictTrailingSlash) {
  if (strictTrailingSlash !== true && path.endsWith("/")) {
    path = path.slice(0, -1) || "/";
  }
  const matches = [];
  for (const [key, value] of _sortRoutesMap(table.wildcard)) {
    if (path === key || path.startsWith(key + "/")) {
      matches.push(value);
    }
  }
  for (const [key, value] of _sortRoutesMap(table.dynamic)) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.slice(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _sortRoutesMap(m) {
  return [...m.entries()].sort((a, b) => a[0].length - b[0].length);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        if (node.data) {
          table.static.set(path, node.data);
        }
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}

function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = { ...defaults };
  for (const key of Object.keys(baseObject)) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
const defu = createDefu();
const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

const subtle = nodeCrypto.webcrypto?.subtle || {};
const randomUUID = () => {
  return nodeCrypto.randomUUID();
};
const getRandomValues = (array) => {
  return nodeCrypto.webcrypto.getRandomValues(array);
};
const _crypto = {
  randomUUID,
  getRandomValues,
  subtle
};

// src/utils.ts
var alphabetByEncoding = {};
var alphabetByValue = Array.from({ length: 64 });
for (let i = 0, start = "A".charCodeAt(0), limit = "Z".charCodeAt(0); i + start <= limit; i++) {
  const char = String.fromCharCode(i + start);
  alphabetByEncoding[char] = i;
  alphabetByValue[i] = char;
}
for (let i = 0, start = "a".charCodeAt(0), limit = "z".charCodeAt(0); i + start <= limit; i++) {
  const char = String.fromCharCode(i + start);
  const index = i + 26;
  alphabetByEncoding[char] = index;
  alphabetByValue[index] = char;
}
for (let i = 0; i < 10; i++) {
  alphabetByEncoding[i.toString(10)] = i + 52;
  const char = i.toString(10);
  const index = i + 52;
  alphabetByEncoding[char] = index;
  alphabetByValue[index] = char;
}
alphabetByEncoding["-"] = 62;
alphabetByValue[62] = "-";
alphabetByEncoding["_"] = 63;
alphabetByValue[63] = "_";
var bitsPerLetter = 6;
var bitsPerByte = 8;
var maxLetterValue = 63;
var stringToBuffer = (value) => {
  return new TextEncoder().encode(value);
};
var bufferToString = (value) => {
  return new TextDecoder().decode(value);
};
var base64urlDecode = (_input) => {
  const input = _input + "=".repeat((4 - _input.length % 4) % 4);
  let totalByteLength = input.length / 4 * 3;
  if (input.endsWith("==")) {
    totalByteLength -= 2;
  } else if (input.endsWith("=")) {
    totalByteLength--;
  }
  const out = new ArrayBuffer(totalByteLength);
  const dataView = new DataView(out);
  for (let i = 0; i < input.length; i += 4) {
    let bits = 0;
    let bitLength = 0;
    for (let j = i, limit = i + 3; j <= limit; j++) {
      if (input[j] === "=") {
        bits >>= bitsPerLetter;
      } else {
        if (!(input[j] in alphabetByEncoding)) {
          throw new TypeError(`Invalid character ${input[j]} in base64 string.`);
        }
        bits |= alphabetByEncoding[input[j]] << (limit - j) * bitsPerLetter;
        bitLength += bitsPerLetter;
      }
    }
    const chunkOffset = i / 4 * 3;
    bits >>= bitLength % bitsPerByte;
    const byteLength = Math.floor(bitLength / bitsPerByte);
    for (let k = 0; k < byteLength; k++) {
      const offset = (byteLength - k - 1) * bitsPerByte;
      dataView.setUint8(chunkOffset + k, (bits & 255 << offset) >> offset);
    }
  }
  return new Uint8Array(out);
};
var base64urlEncode = (_input) => {
  const input = typeof _input === "string" ? stringToBuffer(_input) : _input;
  let str = "";
  for (let i = 0; i < input.length; i += 3) {
    let bits = 0;
    let bitLength = 0;
    for (let j = i, limit = Math.min(i + 3, input.length); j < limit; j++) {
      bits |= input[j] << (limit - j - 1) * bitsPerByte;
      bitLength += bitsPerByte;
    }
    const bitClusterCount = Math.ceil(bitLength / bitsPerLetter);
    bits <<= bitClusterCount * bitsPerLetter - bitLength;
    for (let k = 1; k <= bitClusterCount; k++) {
      const offset = (bitClusterCount - k) * bitsPerLetter;
      str += alphabetByValue[(bits & maxLetterValue << offset) >> offset];
    }
  }
  return str;
};

// src/index.ts
var defaults = {
  encryption: { saltBits: 256, algorithm: "aes-256-cbc", iterations: 1, minPasswordlength: 32 },
  integrity: { saltBits: 256, algorithm: "sha256", iterations: 1, minPasswordlength: 32 },
  ttl: 0,
  timestampSkewSec: 60,
  localtimeOffsetMsec: 0
};
var clone = (options) => ({
  ...options,
  encryption: { ...options.encryption },
  integrity: { ...options.integrity }
});
var algorithms = {
  "aes-128-ctr": { keyBits: 128, ivBits: 128, name: "AES-CTR" },
  "aes-256-cbc": { keyBits: 256, ivBits: 128, name: "AES-CBC" },
  sha256: { keyBits: 256, name: "SHA-256" }
};
var macPrefix = "Fe26.2";
var randomBytes = (_crypto, size) => {
  const bytes = new Uint8Array(size);
  _crypto.getRandomValues(bytes);
  return bytes;
};
var randomBits = (_crypto, bits) => {
  if (bits < 1)
    throw new Error("Invalid random bits count");
  const bytes = Math.ceil(bits / 8);
  return randomBytes(_crypto, bytes);
};
var pbkdf2 = async (_crypto, password, salt, iterations, keyLength, hash) => {
  const passwordBuffer = stringToBuffer(password);
  const importedKey = await _crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const saltBuffer = stringToBuffer(salt);
  const params = { name: "PBKDF2", hash, salt: saltBuffer, iterations };
  const derivation = await _crypto.subtle.deriveBits(params, importedKey, keyLength * 8);
  return derivation;
};
var generateKey = async (_crypto, password, options) => {
  var _a;
  if (!(password == null ? void 0 : password.length))
    throw new Error("Empty password");
  if (options == null || typeof options !== "object")
    throw new Error("Bad options");
  if (!(options.algorithm in algorithms))
    throw new Error(`Unknown algorithm: ${options.algorithm}`);
  const algorithm = algorithms[options.algorithm];
  const result = {};
  const hmac = (_a = options.hmac) != null ? _a : false;
  const id = hmac ? { name: "HMAC", hash: algorithm.name } : { name: algorithm.name };
  const usage = hmac ? ["sign", "verify"] : ["encrypt", "decrypt"];
  if (typeof password === "string") {
    if (password.length < options.minPasswordlength)
      throw new Error(
        `Password string too short (min ${options.minPasswordlength} characters required)`
      );
    let { salt = "" } = options;
    if (!salt) {
      const { saltBits = 0 } = options;
      if (!saltBits)
        throw new Error("Missing salt and saltBits options");
      const randomSalt = randomBits(_crypto, saltBits);
      salt = [...new Uint8Array(randomSalt)].map((x) => x.toString(16).padStart(2, "0")).join("");
    }
    const derivedKey = await pbkdf2(
      _crypto,
      password,
      salt,
      options.iterations,
      algorithm.keyBits / 8,
      "SHA-1"
    );
    const importedEncryptionKey = await _crypto.subtle.importKey(
      "raw",
      derivedKey,
      id,
      false,
      usage
    );
    result.key = importedEncryptionKey;
    result.salt = salt;
  } else {
    if (password.length < algorithm.keyBits / 8)
      throw new Error("Key buffer (password) too small");
    result.key = await _crypto.subtle.importKey("raw", password, id, false, usage);
    result.salt = "";
  }
  if (options.iv)
    result.iv = options.iv;
  else if ("ivBits" in algorithm)
    result.iv = randomBits(_crypto, algorithm.ivBits);
  return result;
};
var getEncryptParams = (algorithm, key, data) => {
  return [
    algorithm === "aes-128-ctr" ? { name: "AES-CTR", counter: key.iv, length: 128 } : { name: "AES-CBC", iv: key.iv },
    key.key,
    typeof data === "string" ? stringToBuffer(data) : data
  ];
};
var encrypt = async (_crypto, password, options, data) => {
  const key = await generateKey(_crypto, password, options);
  const encrypted = await _crypto.subtle.encrypt(...getEncryptParams(options.algorithm, key, data));
  return { encrypted: new Uint8Array(encrypted), key };
};
var decrypt = async (_crypto, password, options, data) => {
  const key = await generateKey(_crypto, password, options);
  const decrypted = await _crypto.subtle.decrypt(...getEncryptParams(options.algorithm, key, data));
  return bufferToString(new Uint8Array(decrypted));
};
var hmacWithPassword = async (_crypto, password, options, data) => {
  const key = await generateKey(_crypto, password, { ...options, hmac: true });
  const textBuffer = stringToBuffer(data);
  const signed = await _crypto.subtle.sign({ name: "HMAC" }, key.key, textBuffer);
  const digest = base64urlEncode(new Uint8Array(signed));
  return { digest, salt: key.salt };
};
var normalizePassword = (password) => {
  if (typeof password === "string" || password instanceof Uint8Array)
    return { encryption: password, integrity: password };
  if ("secret" in password)
    return { id: password.id, encryption: password.secret, integrity: password.secret };
  return { id: password.id, encryption: password.encryption, integrity: password.integrity };
};
var seal = async (_crypto, object, password, options) => {
  if (!password)
    throw new Error("Empty password");
  const opts = clone(options);
  const now = Date.now() + (opts.localtimeOffsetMsec || 0);
  const objectString = JSON.stringify(object);
  const pass = normalizePassword(password);
  const { id = "", encryption, integrity } = pass;
  if (id && !/^\w+$/.test(id))
    throw new Error("Invalid password id");
  const { encrypted, key } = await encrypt(_crypto, encryption, opts.encryption, objectString);
  const encryptedB64 = base64urlEncode(new Uint8Array(encrypted));
  const iv = base64urlEncode(key.iv);
  const expiration = opts.ttl ? now + opts.ttl : "";
  const macBaseString = `${macPrefix}*${id}*${key.salt}*${iv}*${encryptedB64}*${expiration}`;
  const mac = await hmacWithPassword(_crypto, integrity, opts.integrity, macBaseString);
  const sealed = `${macBaseString}*${mac.salt}*${mac.digest}`;
  return sealed;
};
var fixedTimeComparison = (a, b) => {
  let mismatch = a.length === b.length ? 0 : 1;
  if (mismatch)
    b = a;
  for (let i = 0; i < a.length; i += 1)
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
};
var unseal = async (_crypto, sealed, password, options) => {
  if (!password)
    throw new Error("Empty password");
  const opts = clone(options);
  const now = Date.now() + (opts.localtimeOffsetMsec || 0);
  const parts = sealed.split("*");
  if (parts.length !== 8)
    throw new Error("Incorrect number of sealed components");
  const prefix = parts[0];
  let passwordId = parts[1];
  const encryptionSalt = parts[2];
  const encryptionIv = parts[3];
  const encryptedB64 = parts[4];
  const expiration = parts[5];
  const hmacSalt = parts[6];
  const hmac = parts[7];
  const macBaseString = `${prefix}*${passwordId}*${encryptionSalt}*${encryptionIv}*${encryptedB64}*${expiration}`;
  if (macPrefix !== prefix)
    throw new Error("Wrong mac prefix");
  if (expiration) {
    if (!/^\d+$/.test(expiration))
      throw new Error("Invalid expiration");
    const exp = Number.parseInt(expiration, 10);
    if (exp <= now - opts.timestampSkewSec * 1e3)
      throw new Error("Expired seal");
  }
  let pass = "";
  passwordId = passwordId || "default";
  if (typeof password === "string" || password instanceof Uint8Array)
    pass = password;
  else if (passwordId in password) {
    pass = password[passwordId];
  } else {
    throw new Error(`Cannot find password: ${passwordId}`);
  }
  pass = normalizePassword(pass);
  const macOptions = opts.integrity;
  macOptions.salt = hmacSalt;
  const mac = await hmacWithPassword(_crypto, pass.integrity, macOptions, macBaseString);
  if (!fixedTimeComparison(mac.digest, hmac))
    throw new Error("Bad hmac value");
  const encrypted = base64urlDecode(encryptedB64);
  const decryptOptions = opts.encryption;
  decryptOptions.salt = encryptionSalt;
  decryptOptions.iv = base64urlDecode(encryptionIv);
  const decrypted = await decrypt(_crypto, pass.encryption, decryptOptions, encrypted);
  if (decrypted)
    return JSON.parse(decrypted);
  return null;
};

function o(n){throw new Error(`${n} is not implemented yet!`)}let i$1 = class i extends EventEmitter{__unenv__={};readableEncoding=null;readableEnded=true;readableFlowing=false;readableHighWaterMark=0;readableLength=0;readableObjectMode=false;readableAborted=false;readableDidRead=false;closed=false;errored=null;readable=false;destroyed=false;static from(e,t){return new i(t)}constructor(e){super();}_read(e){}read(e){}setEncoding(e){return this}pause(){return this}resume(){return this}isPaused(){return  true}unpipe(e){return this}unshift(e,t){}wrap(e){return this}push(e,t){return  false}_destroy(e,t){this.removeAllListeners();}destroy(e){return this.destroyed=true,this._destroy(e),this}pipe(e,t){return {}}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return this.destroy(),Promise.resolve()}async*[Symbol.asyncIterator](){throw o("Readable.asyncIterator")}iterator(e){throw o("Readable.iterator")}map(e,t){throw o("Readable.map")}filter(e,t){throw o("Readable.filter")}forEach(e,t){throw o("Readable.forEach")}reduce(e,t,r){throw o("Readable.reduce")}find(e,t){throw o("Readable.find")}findIndex(e,t){throw o("Readable.findIndex")}some(e,t){throw o("Readable.some")}toArray(e){throw o("Readable.toArray")}every(e,t){throw o("Readable.every")}flatMap(e,t){throw o("Readable.flatMap")}drop(e,t){throw o("Readable.drop")}take(e,t){throw o("Readable.take")}asIndexedPairs(e){throw o("Readable.asIndexedPairs")}};let l$1 = class l extends EventEmitter{__unenv__={};writable=true;writableEnded=false;writableFinished=false;writableHighWaterMark=0;writableLength=0;writableObjectMode=false;writableCorked=0;closed=false;errored=null;writableNeedDrain=false;writableAborted=false;destroyed=false;_data;_encoding="utf8";constructor(e){super();}pipe(e,t){return {}}_write(e,t,r){if(this.writableEnded){r&&r();return}if(this._data===void 0)this._data=e;else {const s=typeof this._data=="string"?Buffer$1.from(this._data,this._encoding||t||"utf8"):this._data,a=typeof e=="string"?Buffer$1.from(e,t||this._encoding||"utf8"):e;this._data=Buffer$1.concat([s,a]);}this._encoding=t,r&&r();}_writev(e,t){}_destroy(e,t){}_final(e){}write(e,t,r){const s=typeof t=="string"?this._encoding:"utf8",a=typeof t=="function"?t:typeof r=="function"?r:void 0;return this._write(e,s,a),true}setDefaultEncoding(e){return this}end(e,t,r){const s=typeof e=="function"?e:typeof t=="function"?t:typeof r=="function"?r:void 0;if(this.writableEnded)return s&&s(),this;const a=e===s?void 0:e;if(a){const u=t===s?void 0:t;this.write(a,u,s);}return this.writableEnded=true,this.writableFinished=true,this.emit("close"),this.emit("finish"),this}cork(){}uncork(){}destroy(e){return this.destroyed=true,delete this._data,this.removeAllListeners(),this}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return Promise.resolve()}};const c=class{allowHalfOpen=true;_destroy;constructor(e=new i$1,t=new l$1){Object.assign(this,e),Object.assign(this,t),this._destroy=m(e._destroy,t._destroy);}};function _(){return Object.assign(c.prototype,i$1.prototype),Object.assign(c.prototype,l$1.prototype),c}function m(...n){return function(...e){for(const t of n)t(...e);}}const g=_();class A extends g{__unenv__={};bufferSize=0;bytesRead=0;bytesWritten=0;connecting=false;destroyed=false;pending=false;localAddress="";localPort=0;remoteAddress="";remoteFamily="";remotePort=0;autoSelectFamilyAttemptedAddresses=[];readyState="readOnly";constructor(e){super();}write(e,t,r){return  false}connect(e,t,r){return this}end(e,t,r){return this}setEncoding(e){return this}pause(){return this}resume(){return this}setTimeout(e,t){return this}setNoDelay(e){return this}setKeepAlive(e,t){return this}address(){return {}}unref(){return this}ref(){return this}destroySoon(){this.destroy();}resetAndDestroy(){const e=new Error("ERR_SOCKET_CLOSED");return e.code="ERR_SOCKET_CLOSED",this.destroy(e),this}}class y extends i$1{aborted=false;httpVersion="1.1";httpVersionMajor=1;httpVersionMinor=1;complete=true;connection;socket;headers={};trailers={};method="GET";url="/";statusCode=200;statusMessage="";closed=false;errored=null;readable=false;constructor(e){super(),this.socket=this.connection=e||new A;}get rawHeaders(){const e=this.headers,t=[];for(const r in e)if(Array.isArray(e[r]))for(const s of e[r])t.push(r,s);else t.push(r,e[r]);return t}get rawTrailers(){return []}setTimeout(e,t){return this}get headersDistinct(){return p(this.headers)}get trailersDistinct(){return p(this.trailers)}}function p(n){const e={};for(const[t,r]of Object.entries(n))t&&(e[t]=(Array.isArray(r)?r:[r]).filter(Boolean));return e}class w extends l$1{statusCode=200;statusMessage="";upgrading=false;chunkedEncoding=false;shouldKeepAlive=false;useChunkedEncodingByDefault=false;sendDate=false;finished=false;headersSent=false;strictContentLength=false;connection=null;socket=null;req;_headers={};constructor(e){super(),this.req=e;}assignSocket(e){e._httpMessage=this,this.socket=e,this.connection=e,this.emit("socket",e),this._flush();}_flush(){this.flushHeaders();}detachSocket(e){}writeContinue(e){}writeHead(e,t,r){e&&(this.statusCode=e),typeof t=="string"&&(this.statusMessage=t,t=void 0);const s=r||t;if(s&&!Array.isArray(s))for(const a in s)this.setHeader(a,s[a]);return this.headersSent=true,this}writeProcessing(){}setTimeout(e,t){return this}appendHeader(e,t){e=e.toLowerCase();const r=this._headers[e],s=[...Array.isArray(r)?r:[r],...Array.isArray(t)?t:[t]].filter(Boolean);return this._headers[e]=s.length>1?s:s[0],this}setHeader(e,t){return this._headers[e.toLowerCase()]=t,this}setHeaders(e){for(const[t,r]of Object.entries(e))this.setHeader(t,r);return this}getHeader(e){return this._headers[e.toLowerCase()]}getHeaders(){return this._headers}getHeaderNames(){return Object.keys(this._headers)}hasHeader(e){return e.toLowerCase()in this._headers}removeHeader(e){delete this._headers[e.toLowerCase()];}addTrailers(e){}flushHeaders(){}writeEarlyHints(e,t){typeof t=="function"&&t();}}const E=(()=>{const n=function(){};return n.prototype=Object.create(null),n})();function R(n={}){const e=new E,t=Array.isArray(n)||H(n)?n:Object.entries(n);for(const[r,s]of t)if(s){if(e[r]===void 0){e[r]=s;continue}e[r]=[...Array.isArray(e[r])?e[r]:[e[r]],...Array.isArray(s)?s:[s]];}return e}function H(n){return typeof n?.entries=="function"}function v(n={}){if(n instanceof Headers)return n;const e=new Headers;for(const[t,r]of Object.entries(n))if(r!==void 0){if(Array.isArray(r)){for(const s of r)e.append(t,String(s));continue}e.set(t,String(r));}return e}const S$1=new Set([101,204,205,304]);async function b(n,e){const t=new y,r=new w(t);t.url=e.url?.toString()||"/";let s;if(!t.url.startsWith("/")){const d=new URL(t.url);s=d.host,t.url=d.pathname+d.search+d.hash;}t.method=e.method||"GET",t.headers=R(e.headers||{}),t.headers.host||(t.headers.host=e.host||s||"localhost"),t.connection.encrypted=t.connection.encrypted||e.protocol==="https",t.body=e.body||null,t.__unenv__=e.context,await n(t,r);let a=r._data;(S$1.has(r.statusCode)||t.method.toUpperCase()==="HEAD")&&(a=null,delete r._headers["content-length"]);const u={status:r.statusCode,statusText:r.statusMessage,headers:r._headers,body:a};return t.destroy(),r.destroy(),u}async function C(n,e,t={}){try{const r=await b(n,{url:e,...t});return new Response(r.body,{status:r.status,statusText:r.statusText,headers:v(r.headers)})}catch(r){return new Response(r.toString(),{status:Number.parseInt(r.statusCode||r.code)||500,statusText:r.statusText})}}

function hasProp(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

class H3Error extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage;
  data;
  cause;
  constructor(message, opts = {}) {
    super(message, opts);
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
function createError$1(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError(error) ? error : createError$1(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}

function parse(multipartBodyBuffer, boundary) {
  let lastline = "";
  let state = 0 /* INIT */;
  let buffer = [];
  const allParts = [];
  let currentPartHeaders = [];
  for (let i = 0; i < multipartBodyBuffer.length; i++) {
    const prevByte = i > 0 ? multipartBodyBuffer[i - 1] : null;
    const currByte = multipartBodyBuffer[i];
    const newLineChar = currByte === 10 || currByte === 13;
    if (!newLineChar) {
      lastline += String.fromCodePoint(currByte);
    }
    const newLineDetected = currByte === 10 && prevByte === 13;
    if (0 /* INIT */ === state && newLineDetected) {
      if ("--" + boundary === lastline) {
        state = 1 /* READING_HEADERS */;
      }
      lastline = "";
    } else if (1 /* READING_HEADERS */ === state && newLineDetected) {
      if (lastline.length > 0) {
        const i2 = lastline.indexOf(":");
        if (i2 > 0) {
          const name = lastline.slice(0, i2).toLowerCase();
          const value = lastline.slice(i2 + 1).trim();
          currentPartHeaders.push([name, value]);
        }
      } else {
        state = 2 /* READING_DATA */;
        buffer = [];
      }
      lastline = "";
    } else if (2 /* READING_DATA */ === state) {
      if (lastline.length > boundary.length + 4) {
        lastline = "";
      }
      if ("--" + boundary === lastline) {
        const j = buffer.length - lastline.length;
        const part = buffer.slice(0, j - 1);
        allParts.push(process$1(part, currentPartHeaders));
        buffer = [];
        currentPartHeaders = [];
        lastline = "";
        state = 3 /* READING_PART_SEPARATOR */;
      } else {
        buffer.push(currByte);
      }
      if (newLineDetected) {
        lastline = "";
      }
    } else if (3 /* READING_PART_SEPARATOR */ === state && newLineDetected) {
      state = 1 /* READING_HEADERS */;
    }
  }
  return allParts;
}
function process$1(data, headers) {
  const dataObj = {};
  const contentDispositionHeader = headers.find((h) => h[0] === "content-disposition")?.[1] || "";
  for (const i of contentDispositionHeader.split(";")) {
    const s = i.split("=");
    if (s.length !== 2) {
      continue;
    }
    const key = (s[0] || "").trim();
    if (key === "name" || key === "filename") {
      const _value = (s[1] || "").trim().replace(/"/g, "");
      dataObj[key] = Buffer.from(_value, "latin1").toString("utf8");
    }
  }
  const contentType = headers.find((h) => h[0] === "content-type")?.[1] || "";
  if (contentType) {
    dataObj.type = contentType;
  }
  dataObj.data = Buffer.from(data);
  return dataObj;
}

function getQuery(event) {
  return getQuery$1(event.path || "");
}
function getRouterParams(event, opts = {}) {
  let params = event.context.params || {};
  if (opts.decode) {
    params = { ...params };
    for (const key in params) {
      params[key] = decode$1(params[key]);
    }
  }
  return params;
}
function getRouterParam(event, name, opts = {}) {
  const params = getRouterParams(event, opts);
  return params[name];
}
function isMethod(event, expected, allowHead) {
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod(event, expected, allowHead) {
  if (!isMethod(event, expected)) {
    throw createError$1({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader(event, name) {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}
const getHeader = getRequestHeader;
function getRequestHost(event, opts = {}) {
  if (opts.xForwardedHost) {
    const _header = event.node.req.headers["x-forwarded-host"];
    const xForwardedHost = (_header || "").split(",").shift()?.trim();
    if (xForwardedHost) {
      return xForwardedHost;
    }
  }
  return event.node.req.headers.host || "localhost";
}
function getRequestProtocol(event, opts = {}) {
  if (opts.xForwardedProto !== false && event.node.req.headers["x-forwarded-proto"] === "https") {
    return "https";
  }
  return event.node.req.connection?.encrypted ? "https" : "http";
}
function getRequestURL(event, opts = {}) {
  const host = getRequestHost(event, opts);
  const protocol = getRequestProtocol(event, opts);
  const path = (event.node.req.originalUrl || event.path).replace(
    /^[/\\]+/g,
    "/"
  );
  return new URL(path, `${protocol}://${host}`);
}

const RawBodySymbol = Symbol.for("h3RawBody");
const ParsedBodySymbol = Symbol.for("h3ParsedBody");
const PayloadMethods$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody(event, encoding = "utf8") {
  assertMethod(event, PayloadMethods$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      if (_resolved instanceof URLSearchParams) {
        return Buffer.from(_resolved.toString());
      }
      if (_resolved instanceof FormData) {
        return new Response(_resolved).bytes().then((uint8arr) => Buffer.from(uint8arr));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !/\bchunked\b/i.test(
    String(event.node.req.headers["transfer-encoding"] ?? "")
  )) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
async function readBody(event, options = {}) {
  const request = event.node.req;
  if (hasProp(request, ParsedBodySymbol)) {
    return request[ParsedBodySymbol];
  }
  const contentType = request.headers["content-type"] || "";
  const body = await readRawBody(event);
  let parsed;
  if (contentType === "application/json") {
    parsed = _parseJSON(body, options.strict ?? true);
  } else if (contentType.startsWith("application/x-www-form-urlencoded")) {
    parsed = _parseURLEncodedBody(body);
  } else if (contentType.startsWith("text/")) {
    parsed = body;
  } else {
    parsed = _parseJSON(body, options.strict ?? false);
  }
  request[ParsedBodySymbol] = parsed;
  return parsed;
}
async function readMultipartFormData(event) {
  const contentType = getRequestHeader(event, "content-type");
  if (!contentType || !contentType.startsWith("multipart/form-data")) {
    return;
  }
  const boundary = contentType.match(/boundary=([^;]*)(;|$)/i)?.[1];
  if (!boundary) {
    return;
  }
  const body = await readRawBody(event, false);
  if (!body) {
    return;
  }
  return parse(body, boundary);
}
function getRequestWebStream(event) {
  if (!PayloadMethods$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody(event, false);
        if (_rawBody) {
          controller.enqueue(_rawBody);
        }
        controller.close();
      }
    });
  }
  return new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}
function _parseJSON(body = "", strict) {
  if (!body) {
    return void 0;
  }
  try {
    return destr(body, { strict });
  } catch {
    throw createError$1({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid JSON body"
    });
  }
}
function _parseURLEncodedBody(body) {
  const form = new URLSearchParams(body);
  const parsedForm = /* @__PURE__ */ Object.create(null);
  for (const [key, value] of form.entries()) {
    if (hasProp(parsedForm, key)) {
      if (!Array.isArray(parsedForm[key])) {
        parsedForm[key] = [parsedForm[key]];
      }
      parsedForm[key].push(value);
    } else {
      parsedForm[key] = value;
    }
  }
  return parsedForm;
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    if (!event.handled) {
      event.node.res.end();
    }
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}

function getDistinctCookieKey(name, opts) {
  return [name, opts.domain || "", opts.path || "/"].join(";");
}

function parseCookies(event) {
  return parse$1(event.node.req.headers.cookie || "");
}
function getCookie(event, name) {
  return parseCookies(event)[name];
}
function setCookie(event, name, value, serializeOptions = {}) {
  if (!serializeOptions.path) {
    serializeOptions = { path: "/", ...serializeOptions };
  }
  const newCookie = serialize$1(name, value, serializeOptions);
  const currentCookies = splitCookiesString(
    event.node.res.getHeader("set-cookie")
  );
  if (currentCookies.length === 0) {
    event.node.res.setHeader("set-cookie", newCookie);
    return;
  }
  const newCookieKey = getDistinctCookieKey(name, serializeOptions);
  event.node.res.removeHeader("set-cookie");
  for (const cookie of currentCookies) {
    const parsed = parseSetCookie(cookie);
    const key = getDistinctCookieKey(parsed.name, parsed);
    if (key === newCookieKey) {
      continue;
    }
    event.node.res.appendHeader("set-cookie", cookie);
  }
  event.node.res.appendHeader("set-cookie", newCookie);
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start));
    }
  }
  return cookiesStrings;
}

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function sendNoContent(event, code) {
  if (event.handled) {
    return;
  }
  if (!code && event.node.res.statusCode !== 200) {
    code = event.node.res.statusCode;
  }
  const _code = sanitizeStatusCode(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}
function getResponseStatus(event) {
  return event.node.res.statusCode;
}
function getResponseStatusText(event) {
  return event.node.res.statusMessage;
}
function defaultContentType(event, type) {
  if (type && event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(
      name,
      value
    );
  }
}
const setHeaders = setResponseHeaders;
function setResponseHeader(event, name, value) {
  event.node.res.setHeader(name, value);
}
const setHeader = setResponseHeader;
function appendResponseHeader$1(event, name, value) {
  let current = event.node.res.getHeader(name);
  if (!current) {
    event.node.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.node.res.setHeader(name, [...current, value]);
}
function isStream(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (typeof data.pipe === "function") {
    if (typeof data._read === "function") {
      return true;
    }
    if (typeof data.abort === "function") {
      return true;
    }
  }
  if (typeof data.pipeTo === "function") {
    return true;
  }
  return false;
}
function isWebResponse(data) {
  return typeof Response !== "undefined" && data instanceof Response;
}
function sendStream(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream(event, response.body);
}

const PayloadMethods = /* @__PURE__ */ new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "accept-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host",
  "accept"
]);
async function proxyRequest(event, target, opts = {}) {
  let body;
  let duplex;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = getRequestWebStream(event);
      duplex = "half";
    } else {
      body = await readRawBody(event, false).catch(() => void 0);
    }
  }
  const method = opts.fetchOptions?.method || event.method;
  const fetchHeaders = mergeHeaders$1(
    getProxyRequestHeaders(event, { host: target.startsWith("/") }),
    opts.fetchOptions?.headers,
    opts.headers
  );
  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders
    }
  });
}
async function sendProxy(event, target, opts = {}) {
  let response;
  try {
    response = await _getFetch(opts.fetch)(target, {
      headers: opts.headers,
      ignoreResponseError: true,
      // make $ofetch.raw transparent
      ...opts.fetchOptions
    });
  } catch (error) {
    throw createError$1({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: error
    });
  }
  event.node.res.statusCode = sanitizeStatusCode(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString(value));
      continue;
    }
    event.node.res.setHeader(key, value);
  }
  if (cookies.length > 0) {
    event.node.res.setHeader(
      "set-cookie",
      cookies.map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      })
    );
  }
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }
  if (response._data !== void 0) {
    return response._data;
  }
  if (event.handled) {
    return;
  }
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }
  if (response.body) {
    for await (const chunk of response.body) {
      event.node.res.write(chunk);
    }
  }
  return event.node.res.end();
}
function getProxyRequestHeaders(event, opts) {
  const headers = /* @__PURE__ */ Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name) || name === "host" && opts?.host) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}
function fetchWithEvent(event, req, init, options) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event, {
        host: typeof req === "string" && req.startsWith("/")
      }),
      ...init?.headers
    }
  });
}
function _getFetch(_fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}
function rewriteCookieProperty(header, map, property) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
function mergeHeaders$1(defaults, ...inputs) {
  const _inputs = inputs.filter(Boolean);
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    const entries = Array.isArray(input) ? input : typeof input.entries === "function" ? input.entries() : Object.entries(input);
    for (const [key, value] of entries) {
      if (value !== void 0) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

const getSessionPromise = Symbol("getSession");
const DEFAULT_NAME = "h3";
const DEFAULT_COOKIE = {
  path: "/",
  secure: true,
  httpOnly: true
};
async function useSession(event, config) {
  const sessionName = config.name || DEFAULT_NAME;
  await getSession(event, config);
  const sessionManager = {
    get id() {
      return event.context.sessions?.[sessionName]?.id;
    },
    get data() {
      return event.context.sessions?.[sessionName]?.data || {};
    },
    update: async (update) => {
      if (!isEvent(event)) {
        throw new Error("[h3] Cannot update read-only session.");
      }
      await updateSession(event, config, update);
      return sessionManager;
    },
    clear: () => {
      if (!isEvent(event)) {
        throw new Error("[h3] Cannot clear read-only session.");
      }
      clearSession(event, config);
      return Promise.resolve(sessionManager);
    }
  };
  return sessionManager;
}
async function getSession(event, config) {
  const sessionName = config.name || DEFAULT_NAME;
  if (!event.context.sessions) {
    event.context.sessions = /* @__PURE__ */ Object.create(null);
  }
  const existingSession = event.context.sessions[sessionName];
  if (existingSession) {
    return existingSession[getSessionPromise] || existingSession;
  }
  const session = {
    id: "",
    createdAt: 0,
    data: /* @__PURE__ */ Object.create(null)
  };
  event.context.sessions[sessionName] = session;
  let sealedSession;
  if (config.sessionHeader !== false) {
    const headerName = typeof config.sessionHeader === "string" ? config.sessionHeader.toLowerCase() : `x-${sessionName.toLowerCase()}-session`;
    const headerValue = _getReqHeader(event, headerName);
    if (typeof headerValue === "string") {
      sealedSession = headerValue;
    }
  }
  if (!sealedSession) {
    const cookieHeader = _getReqHeader(event, "cookie");
    if (cookieHeader) {
      sealedSession = parse$1(cookieHeader + "")[sessionName];
    }
  }
  if (sealedSession) {
    const promise = unsealSession(event, config, sealedSession).catch(() => {
    }).then((unsealed) => {
      Object.assign(session, unsealed);
      delete event.context.sessions[sessionName][getSessionPromise];
      return session;
    });
    event.context.sessions[sessionName][getSessionPromise] = promise;
    await promise;
  }
  if (!session.id) {
    if (!isEvent(event)) {
      throw new Error(
        "Cannot initialize a new session. Make sure using `useSession(event)` in main handler."
      );
    }
    session.id = config.generateId?.() ?? (config.crypto || _crypto).randomUUID();
    session.createdAt = Date.now();
    await updateSession(event, config);
  }
  return session;
}
function _getReqHeader(event, name) {
  if (event.node) {
    return event.node?.req.headers[name];
  }
  if (event.request) {
    return event.request.headers?.get(name);
  }
  if (event.headers) {
    return event.headers.get(name);
  }
}
async function updateSession(event, config, update) {
  const sessionName = config.name || DEFAULT_NAME;
  const session = event.context.sessions?.[sessionName] || await getSession(event, config);
  if (typeof update === "function") {
    update = update(session.data);
  }
  if (update) {
    Object.assign(session.data, update);
  }
  if (config.cookie !== false) {
    const sealed = await sealSession(event, config);
    setCookie(event, sessionName, sealed, {
      ...DEFAULT_COOKIE,
      expires: config.maxAge ? new Date(session.createdAt + config.maxAge * 1e3) : void 0,
      ...config.cookie
    });
  }
  return session;
}
async function sealSession(event, config) {
  const sessionName = config.name || DEFAULT_NAME;
  const session = event.context.sessions?.[sessionName] || await getSession(event, config);
  const sealed = await seal(
    config.crypto || _crypto,
    session,
    config.password,
    {
      ...defaults,
      ttl: config.maxAge ? config.maxAge * 1e3 : 0,
      ...config.seal
    }
  );
  return sealed;
}
async function unsealSession(_event, config, sealed) {
  const unsealed = await unseal(
    config.crypto || _crypto,
    sealed,
    config.password,
    {
      ...defaults,
      ttl: config.maxAge ? config.maxAge * 1e3 : 0,
      ...config.seal
    }
  );
  if (config.maxAge) {
    const age = Date.now() - (unsealed.createdAt || Number.NEGATIVE_INFINITY);
    if (age > config.maxAge * 1e3) {
      throw new Error("Session expired!");
    }
  }
  return unsealed;
}
function clearSession(event, config) {
  const sessionName = config.name || DEFAULT_NAME;
  if (event.context.sessions?.[sessionName]) {
    delete event.context.sessions[sessionName];
  }
  setCookie(event, sessionName, "", {
    ...DEFAULT_COOKIE,
    ...config.cookie
  });
  return Promise.resolve();
}

class H3Event {
  "__is_event__" = true;
  // Context
  node;
  // Node
  web;
  // Web
  context = {};
  // Shared
  // Request
  _method;
  _path;
  _headers;
  _requestBody;
  // Response
  _handled = false;
  // Hooks
  _onBeforeResponseCalled;
  _onAfterResponseCalled;
  constructor(req, res) {
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. */
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. */
  get res() {
    return this.node.res;
  }
}
function isEvent(input) {
  return hasProp(input, "__is_event__");
}
function createEvent(req, res) {
  return new H3Event(req, res);
}
function _normalizeNodeHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler(handler) {
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  const _hooks = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.__resolve__ = handler.handler.__resolve__;
  _handler.__websocket__ = handler.websocket;
  return _handler;
}
function _normalizeArray(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler = defineEventHandler;
function isEventHandler(input) {
  return hasProp(input, "__is_handler__");
}
function toEventHandler(input, _, _route) {
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler2 = r.default || r;
        if (typeof handler2 !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler2
          );
        }
        _resolved = { handler: toEventHandler(r.default || r) };
        return _resolved;
      });
    }
    return _promise;
  };
  const handler = eventHandler((event) => {
    if (_resolved) {
      return _resolved.handler(event);
    }
    return resolveHandler().then((r) => r.handler(event));
  });
  handler.__resolve__ = resolveHandler;
  return handler;
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const resolve = createResolver(stack);
  handler.__resolve__ = resolve;
  const getWebsocket = cachedFn(() => websocketOptions(resolve, options));
  const app = {
    // @ts-expect-error
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    resolve,
    handler,
    stack,
    options,
    get websocket() {
      return getWebsocket();
    }
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(normalizeLayer({ ...arg2, handler: arg1 }));
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const _rawReqUrl = event.node.req.url || "/";
    const _reqPath = _decodePath(event._path || _rawReqUrl);
    event._path = _reqPath;
    const _needsRawUrl = _reqPath !== _rawReqUrl;
    let _layerPath;
    if (options.onRequest) {
      await options.onRequest(event);
    }
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!_reqPath.startsWith(layer.route)) {
          continue;
        }
        _layerPath = _reqPath.slice(layer.route.length) || "/";
      } else {
        _layerPath = _reqPath;
      }
      if (layer.match && !layer.match(_layerPath, event)) {
        continue;
      }
      event._path = _layerPath;
      event.node.req.url = _needsRawUrl ? layer.route.length > 1 ? _rawReqUrl.slice(layer.route.length) || "/" : _rawReqUrl : _layerPath;
      const val = await layer.handler(event);
      const _body = val === void 0 ? void 0 : await val;
      if (_body !== void 0) {
        const _response = { body: _body };
        if (options.onBeforeResponse) {
          event._onBeforeResponseCalled = true;
          await options.onBeforeResponse(event, _response);
        }
        await handleHandlerResponse(event, _response.body, spacing);
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, _response);
        }
        return;
      }
      if (event.handled) {
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, void 0);
        }
        return;
      }
    }
    if (!event.handled) {
      throw createError$1({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`
      });
    }
    if (options.onAfterResponse) {
      event._onAfterResponseCalled = true;
      await options.onAfterResponse(event, void 0);
    }
  });
}
function createResolver(stack) {
  return async (path) => {
    let _layerPath;
    for (const layer of stack) {
      if (layer.route === "/" && !layer.handler.__resolve__) {
        continue;
      }
      if (!path.startsWith(layer.route)) {
        continue;
      }
      _layerPath = path.slice(layer.route.length) || "/";
      if (layer.match && !layer.match(_layerPath, void 0)) {
        continue;
      }
      let res = { route: layer.route, handler: layer.handler };
      if (res.handler.__resolve__) {
        const _res = await res.handler.__resolve__(_layerPath);
        if (!_res) {
          continue;
        }
        res = {
          ...res,
          ..._res,
          route: joinURL(res.route || "/", _res.route || "/")
        };
      }
      return res;
    }
  };
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function handleHandlerResponse(event, val, jsonSpace) {
  if (val === null) {
    return sendNoContent(event);
  }
  if (val) {
    if (isWebResponse(val)) {
      return sendWebResponse(event, val);
    }
    if (isStream(val)) {
      return sendStream(event, val);
    }
    if (val.buffer) {
      return send(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$1(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send(event, val, MIMES.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send(event, JSON.stringify(val, void 0, jsonSpace), MIMES.json);
  }
  if (valType === "bigint") {
    return send(event, val.toString(), MIMES.json);
  }
  throw createError$1({
    statusCode: 500,
    statusMessage: `[h3] Cannot send ${valType} as response.`
  });
}
function cachedFn(fn) {
  let cache;
  return () => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
}
function _decodePath(url) {
  const qIndex = url.indexOf("?");
  const path = qIndex === -1 ? url : url.slice(0, qIndex);
  const query = qIndex === -1 ? "" : url.slice(qIndex);
  const decodedPath = path.includes("%25") ? decodePath(path.replace(/%25/g, "%2525")) : decodePath(path);
  return decodedPath + query;
}
function websocketOptions(evResolver, appOptions) {
  return {
    ...appOptions.websocket,
    async resolve(info) {
      const url = info.request?.url || info.url || "/";
      const { pathname } = typeof url === "string" ? parseURL(url) : url;
      const resolved = await evResolver(pathname);
      return resolved?.handler?.__websocket__ || {};
    }
  };
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  let _matcher;
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  const matchHandler = (path = "/", method = "get") => {
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      return {
        error: createError$1({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${path || "/"}.`
        })
      };
    }
    let handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      const _matches = _matcher.matchAll(path).reverse();
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }
    if (!handler) {
      return {
        error: createError$1({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`
        })
      };
    }
    return { matched, handler };
  };
  const isPreemptive = opts.preemptive || opts.preemtive;
  router.handler = eventHandler((event) => {
    const match = matchHandler(
      event.path,
      event.method.toLowerCase()
    );
    if ("error" in match) {
      if (isPreemptive) {
        throw match.error;
      } else {
        return;
      }
    }
    event.context.matchedRoute = match.matched;
    const params = match.matched.params || {};
    event.context.params = params;
    return Promise.resolve(match.handler(event)).then((res) => {
      if (res === void 0 && isPreemptive) {
        return null;
      }
      return res;
    });
  });
  router.handler.__resolve__ = async (path) => {
    path = withLeadingSlash(path);
    const match = matchHandler(path);
    if ("error" in match) {
      return;
    }
    let res = {
      route: match.matched.path,
      handler: match.handler
    };
    if (match.handler.__resolve__) {
      const _res = await match.handler.__resolve__(path);
      if (!_res) {
        return;
      }
      res = { ...res, ..._res };
    }
    return res;
  };
  return router;
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError$1(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      setResponseStatus(event, error.statusCode, error.statusMessage);
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event.handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      if (app.options.onBeforeResponse && !event._onBeforeResponseCalled) {
        await app.options.onBeforeResponse(event, { body: error });
      }
      await sendError(event, error, !!app.options.debug);
      if (app.options.onAfterResponse && !event._onAfterResponseCalled) {
        await app.options.onAfterResponse(event, { body: error });
      }
    }
  };
  return toNodeHandle;
}

function flatHooks$1(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks$1(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask$1 = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller$1(hooks, args) {
  const name = args.shift();
  const task = createTask$1(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller$1(hooks, args) {
  const name = args.shift();
  const task = createTask$1(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith$1(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

let Hookable$1 = class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks$1(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks$1(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller$1, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller$1, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith$1(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith$1(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith$1(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
};
function createHooks$1() {
  return new Hookable$1();
}

const s$1=globalThis.Headers,i=globalThis.AbortController,l=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

class FetchError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}

const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  if (value instanceof FormData || value instanceof URLSearchParams) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (contentType === "text/event-stream") {
    return "stream";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function resolveFetchOptions(request, input, defaults, Headers) {
  const headers = mergeHeaders(
    input?.headers ?? request?.headers,
    defaults?.headers,
    Headers
  );
  let query;
  if (defaults?.query || defaults?.params || input?.params || input?.query) {
    query = {
      ...defaults?.params,
      ...defaults?.query,
      ...input?.params,
      ...input?.query
    };
  }
  return {
    ...defaults,
    ...input,
    query,
    params: query,
    headers
  };
}
function mergeHeaders(input, defaults, Headers) {
  if (!defaults) {
    return new Headers(input);
  }
  const headers = new Headers(defaults);
  if (input) {
    for (const [key, value] of Symbol.iterator in input || Array.isArray(input) ? input : new Headers(input)) {
      headers.set(key, value);
    }
  }
  return headers;
}
async function callHooks$1(context, hooks) {
  if (hooks) {
    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        await hook(context);
      }
    } else {
      await hooks(context);
    }
  }
}

const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early (Experimental)
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  // Gateway Timeout
]);
const nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch(globalOptions = {}) {
  const {
    fetch = globalThis.fetch,
    Headers = globalThis.Headers,
    AbortController = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = typeof context.options.retryDelay === "function" ? context.options.retryDelay(context) : context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: resolveFetchOptions(
        _request,
        _options,
        globalOptions.defaults,
        Headers
      ),
      response: void 0,
      error: void 0
    };
    if (context.options.method) {
      context.options.method = context.options.method.toUpperCase();
    }
    if (context.options.onRequest) {
      await callHooks$1(context, context.options.onRequest);
      if (!(context.options.headers instanceof Headers)) {
        context.options.headers = new Headers(
          context.options.headers || {}
          /* compat */
        );
      }
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query) {
        context.request = withQuery(context.request, context.options.query);
        delete context.options.query;
      }
      if ("query" in context.options) {
        delete context.options.query;
      }
      if ("params" in context.options) {
        delete context.options.params;
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        const contentType = context.options.headers.get("content-type");
        if (typeof context.options.body !== "string") {
          context.options.body = contentType === "application/x-www-form-urlencoded" ? new URLSearchParams(
            context.options.body
          ).toString() : JSON.stringify(context.options.body);
        }
        if (!contentType) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    let abortTimeout;
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      abortTimeout = setTimeout(() => {
        const error = new Error(
          "[TimeoutError]: The operation was aborted due to timeout"
        );
        error.name = "TimeoutError";
        error.code = 23;
        controller.abort(error);
      }, context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await callHooks$1(
          context,
          context.options.onRequestError
        );
      }
      return await onError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }
    const hasBody = (context.response.body || // https://github.com/unjs/ofetch/issues/324
    // https://github.com/unjs/ofetch/issues/294
    // https://github.com/JakeChampion/fetch/issues/1454
    context.response._bodyInit) && !nullBodyResponses.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body || context.response._bodyInit;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await callHooks$1(
        context,
        context.options.onResponse
      );
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await callHooks$1(
          context,
          context.options.onResponseError
        );
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r = await $fetchRaw(request, options);
    return r._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch(...args);
  $fetch.create = (defaultOptions = {}, customGlobalOptions = {}) => createFetch({
    ...globalOptions,
    ...customGlobalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...customGlobalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return l;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return l(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch$1 = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
const Headers$1 = globalThis.Headers || s$1;
const AbortController = globalThis.AbortController || i;
const ofetch = createFetch({ fetch: fetch$1, Headers: Headers$1, AbortController });
const $fetch$1 = ofetch;

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}

const storageKeyProperties = [
  "has",
  "hasItem",
  "get",
  "getItem",
  "getItemRaw",
  "set",
  "setItem",
  "setItemRaw",
  "del",
  "remove",
  "removeItem",
  "getMeta",
  "setMeta",
  "removeMeta",
  "getKeys",
  "clear",
  "mount",
  "unmount"
];
function prefixStorage(storage, base) {
  base = normalizeBaseKey(base);
  if (!base) {
    return storage;
  }
  const nsStorage = { ...storage };
  for (const property of storageKeyProperties) {
    nsStorage[property] = (key = "", ...args) => (
      // @ts-ignore
      storage[property](base + key, ...args)
    );
  }
  nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key2) => key2.slice(base.length)));
  nsStorage.keys = nsStorage.getKeys;
  nsStorage.getItems = async (items, commonOptions) => {
    const prefixedItems = items.map(
      (item) => typeof item === "string" ? base + item : { ...item, key: base + item.key }
    );
    const results = await storage.getItems(prefixedItems, commonOptions);
    return results.map((entry) => ({
      key: entry.key.slice(base.length),
      value: entry.value
    }));
  };
  nsStorage.setItems = async (items, commonOptions) => {
    const prefixedItems = items.map((item) => ({
      key: base + item.key,
      value: item.value,
      options: item.options
    }));
    return storage.setItems(prefixedItems, commonOptions);
  };
  return nsStorage;
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey$1(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const _assets = {

};

const normalizeKey = function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
};

const assets = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

function defineDriver(factory) {
  return factory;
}
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError);
  }
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname(path));
  return promises.writeFile(path, data, encoding);
}
function readFile(path, encoding) {
  return promises.readFile(path, encoding).catch(ignoreNotfound);
}
function unlink(path) {
  return promises.unlink(path).catch(ignoreNotfound);
}
function readdir(dir) {
  return promises.readdir(dir, { withFileTypes: true }).catch(ignoreNotfound).then((r) => r || []);
}
async function ensuredir(dir) {
  if (existsSync(dir)) {
    return;
  }
  await ensuredir(dirname(dir)).catch(ignoreExists);
  await promises.mkdir(dir).catch(ignoreExists);
}
async function readdirRecursive(dir, ignore, maxDepth) {
  if (ignore && ignore(dir)) {
    return [];
  }
  const entries = await readdir(dir);
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        if (maxDepth === void 0 || maxDepth > 0) {
          const dirFiles = await readdirRecursive(
            entryPath,
            ignore,
            maxDepth === void 0 ? void 0 : maxDepth - 1
          );
          files.push(...dirFiles.map((f) => entry.name + "/" + f));
        }
      } else {
        if (!(ignore && ignore(entry.name))) {
          files.push(entry.name);
        }
      }
    })
  );
  return files;
}
async function rmRecursive(dir) {
  const entries = await readdir(dir);
  await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        return rmRecursive(entryPath).then(() => promises.rmdir(entryPath));
      } else {
        return promises.unlink(entryPath);
      }
    })
  );
}

const PATH_TRAVERSE_RE = /\.\.:|\.\.$/;
const DRIVER_NAME = "fs-lite";
const unstorage_47drivers_47fs_45lite = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  opts.base = resolve(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    flags: {
      maxDepth: true
    },
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys(_base, topts) {
      return readdirRecursive(r("."), opts.ignore, topts?.maxDepth);
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    }
  };
});

const storage = createStorage({});

storage.mount('/assets', assets);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"./.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const e=globalThis.process?.getBuiltinModule?.("crypto")?.hash,r="sha256",s="base64url";function digest(t){if(e)return e(r,t,s);const o=createHash(r).update(t);return globalThis.process?.versions?.webcontainer?o.digest().toString(s):o.digest(s)}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

function klona(x) {
	if (typeof x !== 'object') return x;

	var k, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor();
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k]);
				}
			}
		} else {
			tmp = {}; // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					});
				} else {
					tmp[k] = klona(x[k]);
				}
			}
		}
		return tmp;
	}

	if (str === '[object Array]') {
		k = x.length;
		for (tmp=Array(k); k--;) {
			tmp[k] = klona(x[k]);
		}
		return tmp;
	}

	if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
		return tmp;
	}

	if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
		return tmp;
	}

	if (str === '[object Date]') {
		return new Date(+x);
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
		tmp.lastIndex = x.lastIndex;
		return tmp;
	}

	if (str === '[object DataView]') {
		return new x.constructor( klona(x.buffer) );
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0);
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x);
	}

	return x;
}

const inlineAppConfig = {
  "nuxt": {}
};



const appConfig = defuFn(inlineAppConfig);

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return void 0;
  }
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner) : "";
}
function snakeCase(str) {
  return kebabCase(str || "", "_");
}

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "buildId": "69d0c3b8-2b01-41a7-8133-b6246d8964f7",
    "buildAssetsDir": "/_nuxt/",
    "cdnURL": ""
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {
      "/__nuxt_error": {
        "cache": false
      },
      "/_nuxt/builds/meta/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      },
      "/_nuxt/builds/**": {
        "headers": {
          "cache-control": "public, max-age=1, immutable"
        }
      },
      "/_nuxt/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      }
    }
  },
  "public": {
    "appName": "JobFlow AI",
    "apiBackend": "nuxt",
    "auth": {
      "loadStrategy": "server-first"
    }
  },
  "geminiApiKey": "",
  "geminiModel": "gemini-2.0-flash",
  "databaseUrl": "postgresql://scraper:scraper@localhost:5432/job_scraper",
  "ollamaBaseUrl": "http://localhost:11434",
  "ollamaModel": "gemma4:e4b",
  "ollamaFallbackModels": "llama3.2:latest",
  "stripeSecretKey": "",
  "stripeWebhookSecret": "",
  "stripePriceProMonthly": "",
  "appUrl": "http://localhost:3000",
  "adminEmails": "",
  "resendApiKey": "",
  "contactFromEmail": "",
  "apiProxyTarget": "http://127.0.0.1:8000",
  "session": {
    "name": "nuxt-session",
    "password": "jobflow-dev-session-password-change-me-32chars",
    "cookie": {
      "sameSite": "lax"
    }
  },
  "hash": {
    "scrypt": {}
  },
  "webauthn": {
    "register": {},
    "authenticate": {}
  },
  "oauth": {
    "gitea": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": "",
      "baseURL": ""
    },
    "box": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": "",
      "scope": []
    },
    "github": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "gitlab": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": "",
      "baseURL": "https://gitlab.com"
    },
    "spotify": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "google": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "twitch": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "auth0": {
      "clientId": "",
      "clientSecret": "",
      "domain": "",
      "audience": "",
      "redirectURL": ""
    },
    "workos": {
      "clientId": "",
      "clientSecret": "",
      "connectionId": "",
      "screenHint": "",
      "redirectURL": ""
    },
    "microsoft": {
      "clientId": "",
      "clientSecret": "",
      "tenant": "",
      "scope": [],
      "authorizationURL": "",
      "tokenURL": "",
      "userURL": "",
      "redirectURL": ""
    },
    "azureb2c": {
      "clientId": "",
      "policy": "",
      "tenant": "",
      "scope": [],
      "authorizationURL": "",
      "tokenURL": "",
      "userURL": "",
      "redirectURL": ""
    },
    "discord": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "battledotnet": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "bluesky": {
      "clientMetadataFilename": "",
      "clientName": "",
      "clientUri": "",
      "logoUri": "",
      "policyUri": "",
      "tosUri": "",
      "scope": [
        "atproto"
      ],
      "grantTypes": [
        "authorization_code"
      ],
      "responseTypes": [
        "code"
      ],
      "applicationType": "web",
      "redirectUris": "",
      "dpopBoundAccessTokens": true,
      "tokenEndpointAuthMethod": "none"
    },
    "keycloak": {
      "clientId": "",
      "clientSecret": "",
      "serverUrl": "",
      "serverUrlInternal": "",
      "realm": "",
      "redirectURL": ""
    },
    "linear": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "linkedin": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "cognito": {
      "clientId": "",
      "clientSecret": "",
      "region": "",
      "userPoolId": "",
      "redirectURL": ""
    },
    "facebook": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "instagram": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "paypal": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "steam": {
      "apiKey": "",
      "redirectURL": ""
    },
    "x": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "xsuaa": {
      "clientId": "",
      "clientSecret": "",
      "domain": "",
      "redirectURL": ""
    },
    "vk": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "yandex": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "tiktok": {
      "clientKey": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "dropbox": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "polar": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "zitadel": {
      "clientId": "",
      "clientSecret": "",
      "domain": "",
      "redirectURL": ""
    },
    "authentik": {
      "clientId": "",
      "clientSecret": "",
      "domain": "",
      "redirectURL": ""
    },
    "seznam": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "strava": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "hubspot": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "line": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "atlassian": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "apple": {
      "teamId": "",
      "keyId": "",
      "privateKey": "",
      "redirectURL": "",
      "clientId": ""
    },
    "kick": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": ""
    },
    "livechat": {
      "clientId": "",
      "clientSecret": ""
    },
    "salesforce": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": "",
      "baseURL": "",
      "scope": ""
    },
    "slack": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": "",
      "scope": ""
    },
    "heroku": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": "",
      "scope": ""
    },
    "roblox": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": "",
      "scope": ""
    },
    "okta": {
      "clientId": "",
      "clientSecret": "",
      "domain": "",
      "audience": "",
      "scope": [],
      "redirectURL": ""
    },
    "ory": {
      "clientId": "",
      "clientSecret": "",
      "sdkURL": "",
      "redirectURL": "",
      "scope": [],
      "authorizationURL": "",
      "tokenURL": "",
      "userURL": ""
    },
    "shopifyCustomer": {
      "shopDomain": "",
      "clientId": "",
      "redirectURL": "",
      "scope": []
    },
    "oidc": {
      "clientId": "",
      "clientSecret": "",
      "openidConfig": "",
      "redirectURL": "",
      "scope": []
    },
    "osu": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": "",
      "scope": []
    },
    "riotgames": {
      "clientId": "",
      "clientSecret": "",
      "redirectURL": "",
      "scope": []
    }
  }
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  applyEnv(runtimeConfig, envOptions);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
_deepFreeze(klona(appConfig));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
const defaultNamespace = _globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());

getContext("nitro-app", {
  asyncContext: false,
  AsyncLocalStorage: void 0
});

function isPathInScope(pathname, base) {
  let canonical;
  try {
    const pre = pathname.replace(/%2f/gi, "/").replace(/%5c/gi, "\\");
    canonical = new URL(pre, "http://_").pathname;
  } catch {
    return false;
  }
  return !base || canonical === base || canonical.startsWith(base + "/");
}

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter$1({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          if (!isPathInScope(event.path.split("?")[0], strpBase)) {
            throw createError$1({ statusCode: 400 });
          }
          targetPath = withoutBase(targetPath, strpBase);
        } else if (targetPath.startsWith("//")) {
          targetPath = targetPath.replace(/^\/+/, "/");
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          if (!isPathInScope(event.path.split("?")[0], strpBase)) {
            throw createError$1({ statusCode: 400 });
          }
          targetPath = withoutBase(targetPath, strpBase);
        } else if (targetPath.startsWith("//")) {
          targetPath = targetPath.replace(/^\/+/, "/");
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function isJsonRequest(event) {
  if (hasReqHeader(event, "accept", "text/html")) {
    return false;
  }
  return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function hasReqHeader(event, name, includes) {
  const value = getRequestHeader(event, name);
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}
function normalizeError(error, isDev) {
  const cwd = typeof process.cwd === "function" ? process.cwd() : "/";
  const stack = (error.unhandled || error.fatal) ? [] : (error.stack || "").split("\n").splice(1).filter((line) => line.includes("at ")).map((line) => {
    const text = line.replace(cwd + "/", "./").replace("webpack:/", "").replace("file://", "").trim();
    return {
      text,
      internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
    };
  });
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage ?? (statusCode === 404 ? "Not Found" : "");
  const message = error.unhandled ? "internal server error" : error.message || error.toString();
  return {
    stack,
    statusCode,
    statusMessage,
    message
  };
}

const errorHandler$0 = (async function errorhandler(error, event) {
  const { stack, statusCode, statusMessage, message } = normalizeError(error);
  const errorObject = {
    url: event.path,
    statusCode,
    statusMessage,
    message,
    stack: "",
    // TODO: check and validate error.data for serialisation into query
    data: error.data
  };
  if (error.unhandled || error.fatal) {
    const tags = [
      "[nuxt]",
      "[request error]",
      error.unhandled && "[unhandled]",
      error.fatal && "[fatal]",
      Number(errorObject.statusCode) !== 200 && `[${errorObject.statusCode}]`
    ].filter(Boolean).join(" ");
    console.error(tags, (error.message || error.toString() || "internal server error") + "\n" + stack.map((l) => "  " + l.text).join("  \n"));
  }
  if (event.handled) {
    return;
  }
  setResponseStatus(event, errorObject.statusCode !== 200 && errorObject.statusCode || 500, errorObject.statusMessage);
  if (isJsonRequest(event)) {
    setResponseHeader(event, "Content-Type", "application/json");
    return send(event, JSON.stringify(errorObject));
  }
  const reqHeaders = getRequestHeaders(event);
  const isRenderingError = event.path.startsWith("/__nuxt_error") || !!reqHeaders["x-nuxt-error"];
  const res = isRenderingError ? null : await useNitroApp().localFetch(
    withQuery(joinURL(useRuntimeConfig(event).app.baseURL, "/__nuxt_error"), errorObject),
    {
      headers: { ...reqHeaders, "x-nuxt-error": "true" },
      redirect: "manual"
    }
  ).catch(() => null);
  if (!res) {
    const { template } = await import('../_/error-500.mjs');
    if (event.handled) {
      return;
    }
    setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
    return send(event, template(errorObject));
  }
  const html = await res.text();
  if (event.handled) {
    return;
  }
  for (const [header, value] of res.headers.entries()) {
    setResponseHeader(event, header, value);
  }
  setResponseStatus(event, res.status && res.status !== 200 ? res.status : void 0, res.statusText);
  return send(event, html);
});

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$1 = defineNitroErrorHandler(
  function defaultNitroErrorHandler(error, event) {
    const res = defaultHandler(error, event);
    setResponseHeaders(event, res.headers);
    setResponseStatus(event, res.status, res.statusText);
    return send(event, JSON.stringify(res.body, null, 2));
  }
);
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.method}] ${url}
`, error);
  }
  const headers = {
    "content-type": "application/json",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  setResponseStatus(event, statusCode, statusMessage);
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    statusCode,
    statusMessage,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}

const errorHandlers = [errorHandler$0, errorHandler$1];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const _qzPhPIA8_mweVrzpgHe8DRF80Z8qDUmOPeXJdPQXF94 = defineNitroPlugin((nitroApp) => {
  if (process.env.NUXT_OAUTH_FACEBOOK_CLIENT_ID && process.env.NUXT_OAUTH_FACEBOOK_CLIENT_SECRET || process.env.NUXT_OAUTH_INSTAGRAM_CLIENT_ID && process.env.NUXT_OAUTH_INSTAGRAM_CLIENT_SECRET) {
    nitroApp.hooks.hook("render:html", (html) => {
      html.head.unshift(`
      <script>
        if (window.location.hash === "#_=_"){
          history.replaceState
              ? history.replaceState(null, null, window.location.href.split("#")[0])
              : window.location.hash = "";
        }
      <\/script>
    `);
    });
  }
});

const plugins = [
  _qzPhPIA8_mweVrzpgHe8DRF80Z8qDUmOPeXJdPQXF94
];

const FASTAPI_PREFIXES = ["/api/health", "/api/auth", "/api/jobs", "/api/saas"];
function shouldProxyToFastapi(pathname) {
  if (!pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/api/_auth")) return false;
  if (pathname.startsWith("/api/pdf")) return false;
  return FASTAPI_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
function resolveBackend(config) {
  const fromConfig = String(config.public.apiBackend || "").trim().toLowerCase();
  const fromEnv = String(process.env.NUXT_PUBLIC_API_BACKEND || "").trim().toLowerCase();
  return fromConfig || fromEnv || "nuxt";
}
function hopByHopHeaders() {
  return /* @__PURE__ */ new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length"
  ]);
}
const _Dt1_Vf = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  if (resolveBackend(config) !== "fastapi") return;
  const url = getRequestURL(event);
  const pathname = url.pathname;
  if (!shouldProxyToFastapi(pathname)) return;
  const targetBase = String(
    config.apiProxyTarget || process.env.NUXT_API_PROXY_TARGET || "http://127.0.0.1:8000"
  ).replace(/\/$/, "");
  const target = `${targetBase}${pathname}${url.search}`;
  try {
    const skip = hopByHopHeaders();
    const incoming = getRequestHeaders(event);
    const headers = {};
    for (const [key, value] of Object.entries(incoming)) {
      if (!value || skip.has(key.toLowerCase())) continue;
      headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
    }
    const cookie = getHeader(event, "cookie");
    if (cookie) headers.cookie = cookie;
    const method = event.method || "GET";
    const body = method === "GET" || method === "HEAD" ? void 0 : await readRawBody(event, false);
    const upstream = await fetch(target, {
      method,
      headers,
      body,
      redirect: "manual"
    });
    setResponseStatus(event, upstream.status, upstream.statusText);
    const anyHeaders = upstream.headers;
    const setCookies = typeof anyHeaders.getSetCookie === "function" ? anyHeaders.getSetCookie() : [];
    if (setCookies.length) {
      for (const c of setCookies) {
        appendResponseHeader(event, "set-cookie", c);
      }
    } else {
      const single = upstream.headers.get("set-cookie");
      if (single) appendResponseHeader(event, "set-cookie", single);
    }
    for (const [key, value] of upstream.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower === "set-cookie" || skip.has(lower)) continue;
      setResponseHeader(event, key, value);
    }
    if (pathname.startsWith("/api/auth")) {
      setResponseHeader(event, "cache-control", "no-store");
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    return send(event, buf);
  } catch (error) {
    console.error("[api-backend] FastAPI proxy failed:", targetBase, pathname, error);
    throw createError$1({
      statusCode: 502,
      statusMessage: `FastAPI proxy failed (${targetBase}). Is uvicorn running on port 8000?`
    });
  }
});
function appendResponseHeader(event, name, value) {
  const existing = event.node.res.getHeader(name);
  if (!existing) {
    setResponseHeader(event, name, value);
    return;
  }
  const list = Array.isArray(existing) ? existing.map(String) : [String(existing)];
  list.push(value);
  setResponseHeader(event, name, list);
}

function flatHooks(configHooks, hooks = {}, parentName) {
	for (const key in configHooks) {
		const subHook = configHooks[key];
		const name = parentName ? `${parentName}:${key}` : key;
		if (typeof subHook === "object" && subHook !== null) flatHooks(subHook, hooks, name);
		else if (typeof subHook === "function") hooks[name] = subHook;
	}
	return hooks;
}
const createTask = /* @__PURE__ */ (() => {
	if (console.createTask) return console.createTask;
	const defaultTask = { run: (fn) => fn() };
	return () => defaultTask;
})();
function callHooks(hooks, args, startIndex, task) {
	for (let i = startIndex; i < hooks.length; i += 1) try {
		const result = task ? task.run(() => hooks[i](...args)) : hooks[i](...args);
		if (result && typeof result.then === "function") return Promise.resolve(result).then(() => callHooks(hooks, args, i + 1, task));
	} catch (error) {
		return Promise.reject(error);
	}
}
function serialTaskCaller(hooks, args, name) {
	if (hooks.length > 0) return callHooks(hooks, args, 0, createTask(name));
}
function parallelTaskCaller(hooks, args, name) {
	if (hooks.length > 0) {
		const task = createTask(name);
		return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
	}
}
function callEachWith(callbacks, arg0) {
	for (const callback of [...callbacks]) callback(arg0);
}
var Hookable = class {
	_hooks;
	_before;
	_after;
	_deprecatedHooks;
	_deprecatedMessages;
	constructor() {
		this._hooks = {};
		this._before = void 0;
		this._after = void 0;
		this._deprecatedMessages = void 0;
		this._deprecatedHooks = {};
		this.hook = this.hook.bind(this);
		this.callHook = this.callHook.bind(this);
		this.callHookWith = this.callHookWith.bind(this);
	}
	hook(name, function_, options = {}) {
		if (!name || typeof function_ !== "function") return () => {};
		const originalName = name;
		let dep;
		while (this._deprecatedHooks[name]) {
			dep = this._deprecatedHooks[name];
			name = dep.to;
		}
		if (dep && !options.allowDeprecated) {
			let message = dep.message;
			if (!message) message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
			if (!this._deprecatedMessages) this._deprecatedMessages = /* @__PURE__ */ new Set();
			if (!this._deprecatedMessages.has(message)) {
				console.warn(message);
				this._deprecatedMessages.add(message);
			}
		}
		if (!function_.name) try {
			Object.defineProperty(function_, "name", {
				get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
				configurable: true
			});
		} catch {}
		this._hooks[name] = this._hooks[name] || [];
		this._hooks[name].push(function_);
		return () => {
			if (function_) {
				this.removeHook(name, function_);
				function_ = void 0;
			}
		};
	}
	hookOnce(name, function_) {
		let _unreg;
		let _function = (...arguments_) => {
			if (typeof _unreg === "function") _unreg();
			_unreg = void 0;
			_function = void 0;
			return function_(...arguments_);
		};
		_unreg = this.hook(name, _function);
		return _unreg;
	}
	removeHook(name, function_) {
		const hooks = this._hooks[name];
		if (hooks) {
			const index = hooks.indexOf(function_);
			if (index !== -1) hooks.splice(index, 1);
			if (hooks.length === 0) this._hooks[name] = void 0;
		}
	}
	clearHook(name) {
		this._hooks[name] = void 0;
	}
	deprecateHook(name, deprecated) {
		this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
		const _hooks = this._hooks[name] || [];
		this._hooks[name] = void 0;
		for (const hook of _hooks) this.hook(name, hook);
	}
	deprecateHooks(deprecatedHooks) {
		for (const name in deprecatedHooks) this.deprecateHook(name, deprecatedHooks[name]);
	}
	addHooks(configHooks) {
		const hooks = flatHooks(configHooks);
		const removeFns = Object.keys(hooks).map((key) => this.hook(key, hooks[key]));
		return () => {
			for (const unreg of removeFns) unreg();
			removeFns.length = 0;
		};
	}
	removeHooks(configHooks) {
		const hooks = flatHooks(configHooks);
		for (const key in hooks) this.removeHook(key, hooks[key]);
	}
	removeAllHooks() {
		this._hooks = {};
	}
	callHook(name, ...args) {
		return this.callHookWith(serialTaskCaller, name, args);
	}
	callHookParallel(name, ...args) {
		return this.callHookWith(parallelTaskCaller, name, args);
	}
	callHookWith(caller, name, args) {
		const event = this._before || this._after ? {
			name,
			args,
			context: {}
		} : void 0;
		if (this._before) callEachWith(this._before, event);
		const result = caller(this._hooks[name] ? [...this._hooks[name]] : [], args, name);
		if (result instanceof Promise) return result.finally(() => {
			if (this._after && event) callEachWith(this._after, event);
		});
		if (this._after && event) callEachWith(this._after, event);
		return result;
	}
	beforeEach(function_) {
		this._before = this._before || [];
		this._before.push(function_);
		return () => {
			if (this._before !== void 0) {
				const index = this._before.indexOf(function_);
				if (index !== -1) this._before.splice(index, 1);
			}
		};
	}
	afterEach(function_) {
		this._after = this._after || [];
		this._after.push(function_);
		return () => {
			if (this._after !== void 0) {
				const index = this._after.indexOf(function_);
				if (index !== -1) this._after.splice(index, 1);
			}
		};
	}
};
function createHooks() {
	return new Hookable();
}

function defineNitroPlugin(def) {
  return def;
}

function defineRenderHandler(render) {
  const runtimeConfig = useRuntimeConfig();
  return eventHandler(async (event) => {
    const nitroApp = useNitroApp();
    const ctx = { event, render, response: void 0 };
    await nitroApp.hooks.callHook("render:before", ctx);
    if (!ctx.response) {
      if (event.path === `${runtimeConfig.app.baseURL}favicon.ico`) {
        setResponseHeader(event, "Content-Type", "image/x-icon");
        return send(
          event,
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        );
      }
      ctx.response = await ctx.render(event);
      if (!ctx.response) {
        const _currentStatus = getResponseStatus(event);
        setResponseStatus(event, _currentStatus === 200 ? 500 : _currentStatus);
        return send(
          event,
          "No response returned from render handler: " + event.path
        );
      }
    }
    await nitroApp.hooks.callHook("render:response", ctx.response, ctx);
    if (ctx.response.headers) {
      setResponseHeaders(event, ctx.response.headers);
    }
    if (ctx.response.statusCode || ctx.response.statusMessage) {
      setResponseStatus(
        event,
        ctx.response.statusCode,
        ctx.response.statusMessage
      );
    }
    return ctx.response.body;
  });
}

function baseURL() {
  return useRuntimeConfig().app.baseURL;
}
function buildAssetsDir() {
  return useRuntimeConfig().app.buildAssetsDir;
}
function buildAssetsURL(...path) {
  return joinRelativeURL(publicAssetsURL(), buildAssetsDir(), ...path);
}
function publicAssetsURL(...path) {
  const app = useRuntimeConfig().app;
  const publicBase = app.cdnURL || app.baseURL;
  return path.length ? joinRelativeURL(publicBase, ...path) : publicBase;
}

const FALLBACK_MODELS = [
  "gemini-3.1-pro-preview"
];
function getGeminiModels(primary) {
  return [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
}
function normalizeJobs(raw, sourceUrl) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => !!item && typeof item === "object").map((item) => ({
    title: String(item.title || "").trim(),
    company: item.company ? String(item.company).trim() : void 0,
    location: String(item.location || "Unknown").trim(),
    salaryMin: typeof item.salaryMin === "number" ? item.salaryMin : void 0,
    salaryMax: typeof item.salaryMax === "number" ? item.salaryMax : void 0,
    currency: item.currency ? String(item.currency).trim() : void 0,
    url: resolveJobUrl(String(item.url || "").trim(), sourceUrl),
    description: item.description ? String(item.description).trim() : void 0,
    descriptionSource: item.description ? "listing" : void 0
  })).filter((job) => job.title && job.url);
}
function resolveJobUrl(url, sourceUrl) {
  if (!url) return sourceUrl;
  if (url.startsWith("http")) return url;
  try {
    return new URL(url, sourceUrl).href;
  } catch {
    return sourceUrl;
  }
}
function formatGeminiError(error) {
  var _a, _b, _c, _d;
  if (!error || typeof error !== "object") {
    return "Gemini request failed. Please try again.";
  }
  const err = error;
  const nested = (_a = err.error) == null ? void 0 : _a.message;
  if (nested) {
    if (((_b = err.error) == null ? void 0 : _b.code) === 503 || ((_c = err.error) == null ? void 0 : _c.status) === "UNAVAILABLE") {
      return "Gemini is temporarily overloaded. Wait a moment and try again.";
    }
    return nested;
  }
  if (err.message) {
    try {
      const parsed = JSON.parse(err.message);
      if ((_d = parsed.error) == null ? void 0 : _d.message) return parsed.error.message;
    } catch {
      return err.message;
    }
    return err.message;
  }
  return "Gemini request failed. Please try again.";
}

async function ollamaChat(options) {
  const config = useRuntimeConfig();
  const baseUrl = String(config.ollamaBaseUrl || "http://localhost:11434").replace(/\/$/, "");
  const primary = options.model || String(config.ollamaModel || "gemma4:e4b");
  const fallbacks = String(config.ollamaFallbackModels || "llama3.2:latest").split(",").map((m) => m.trim()).filter(Boolean);
  const models = [primary, ...fallbacks.filter((m) => m !== primary)];
  let lastError;
  for (const model of models) {
    try {
      return await chatOnce(baseUrl, model, options);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Ollama model ${model} failed:`, message);
      if (!/not found|pull|404|does not exist/i.test(message) && models.length === 1) {
        throw error;
      }
    }
  }
  if (lastError && typeof lastError === "object" && "statusCode" in lastError) {
    throw lastError;
  }
  throw createError$1({
    statusCode: 503,
    statusMessage: lastError instanceof Error ? lastError.message : `No usable Ollama model. Tried: ${models.join(", ")}`
  });
}
async function chatOnce(baseUrl, model, options) {
  var _a, _b, _c;
  let response;
  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        format: options.format,
        options: {
          temperature: (_a = options.temperature) != null ? _a : 0.4
        },
        messages: options.messages
      })
    });
  } catch (error) {
    throw createError$1({
      statusCode: 503,
      statusMessage: error instanceof Error ? `Ollama is unreachable at ${baseUrl}. Start Ollama and pull model ${model}. (${error.message})` : `Ollama is unreachable at ${baseUrl}.`
    });
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw createError$1({
      statusCode: 503,
      statusMessage: `Ollama error for ${model} (${response.status}): ${body.slice(0, 300) || response.statusText}`
    });
  }
  const data = await response.json();
  const content = (_c = (_b = data.message) == null ? void 0 : _b.content) == null ? void 0 : _c.trim();
  if (!content) {
    throw createError$1({
      statusCode: 502,
      statusMessage: `Ollama model ${model} returned an empty response`
    });
  }
  return content;
}
function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced == null ? void 0 : fenced[1]) {
      return JSON.parse(fenced[1].trim());
    }
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw createError$1({
      statusCode: 502,
      statusMessage: "Could not parse JSON from Ollama response"
    });
  }
}

function isGeminiQuotaOrUnavailableError(error) {
  const message = formatGeminiError(error).toLowerCase();
  const raw = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message || "") : String(error || "");
  const haystack = `${message}
${raw}`.toLowerCase();
  return haystack.includes("quota") || haystack.includes("rate limit") || haystack.includes("rate-limit") || haystack.includes("resource_exhausted") || haystack.includes("too many requests") || haystack.includes("exceeded your current quota") || haystack.includes("unavailable") || haystack.includes("high demand") || /\b429\b/.test(haystack) || /\b503\b/.test(haystack);
}
async function ollamaJsonPrompt(input) {
  var _a;
  const content = await ollamaChat({
    format: "json",
    temperature: (_a = input.temperature) != null ? _a : 0.3,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user }
    ]
  });
  return parseJsonObject(content);
}

const EMPTY_CANDIDATE_PROFILE = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  summary: "",
  skills: [],
  experiences: [],
  projects: [],
  education: ""
};
function formatCandidateContactLine(profile) {
  const parts = [
    profile.location,
    profile.email,
    profile.phone,
    profile.linkedin,
    profile.website
  ].map((part) => part == null ? void 0 : part.trim()).filter(Boolean);
  return parts.join(" \xB7 ");
}
function hasUsableIdentity(profile) {
  var _a, _b, _c;
  return Boolean(((_a = profile == null ? void 0 : profile.fullName) == null ? void 0 : _a.trim()) && (((_b = profile.email) == null ? void 0 : _b.trim()) || ((_c = profile.phone) == null ? void 0 : _c.trim())));
}
function stampCandidateIdentity(markdown, profile) {
  var _a, _b, _c, _d;
  if (!(markdown == null ? void 0 : markdown.trim()) || !((_a = profile == null ? void 0 : profile.fullName) == null ? void 0 : _a.trim())) return markdown;
  const name = profile.fullName.trim();
  const contact = formatCandidateContactLine(profile);
  let text = markdown;
  text = text.replace(/\bJordan Ellis\b/gi, name).replace(/jordan\.ellis@email\.com/gi, profile.email || "").replace(/\(415\)\s*555-0142/g, profile.phone || "").replace(/linkedin\.com\/in\/jordanellis/gi, profile.linkedin || profile.website || "").replace(/github\.com\/jordanellis/gi, profile.website || "").replace(/San Francisco,\s*CA(?=\s*·|\s*$|,)/gi, profile.location || "San Francisco, CA").replace(/\bNorthline Systems\b/gi, ((_b = profile.experiences[0]) == null ? void 0 : _b.company) || "Northline Systems").replace(/\bCascade Labs\b/gi, ((_c = profile.experiences[1]) == null ? void 0 : _c.company) || ((_d = profile.experiences[0]) == null ? void 0 : _d.company) || "Cascade Labs").replace(/\[FULL NAME\]/gi, name).replace(/\[EMAIL\]/gi, profile.email || "[EMAIL]").replace(/\[PHONE\]/gi, profile.phone || "[PHONE]").replace(/\[LOCATION\]/gi, profile.location || "[LOCATION]");
  const lines = text.split("\n");
  let nameIdx = lines.findIndex((line) => /^#\s+/.test(line.trim()));
  if (nameIdx < 0) {
    lines.unshift(`# ${name}`);
    if (contact) lines.splice(1, 0, contact);
    text = lines.join("\n");
  } else {
    const rest = lines[nameIdx].replace(/^#\s+/, "").trim();
    if (rest.includes("|")) {
      const titlePart = rest.split("|").slice(1).join("|").trim();
      lines[nameIdx] = `# ${name}${titlePart ? ` | ${titlePart}` : ""}`;
    } else if (!/^#\s+/.test(lines[nameIdx]) || !lines[nameIdx].includes(name)) {
      lines[nameIdx] = `# ${name}`;
    } else {
      lines[nameIdx] = `# ${name}`;
    }
    if (contact) {
      let contactIdx = -1;
      for (let i = nameIdx; i < Math.min(lines.length, nameIdx + 8); i++) {
        const line = lines[i] || "";
        if (/@/.test(line) || /\d{3}.*\d{3}/.test(line) || /linkedin\.com/i.test(line) || /·/.test(line)) {
          contactIdx = i;
          break;
        }
      }
      if (contactIdx >= 0) lines[contactIdx] = contact;
      else lines.splice(nameIdx + 1, 0, contact);
    }
    text = lines.join("\n");
  }
  text = text.replace(
    /(Sincerely|Best regards|Kind regards|Respectfully),?\s*\n+[^\n]+/i,
    `$1,
${name}`
  );
  return text;
}
function normalizeCandidateProfile(input = {}) {
  var _a, _b;
  const skills = ((_a = input.skills) == null ? void 0 : _a.length) ? input.skills.map((s) => String(s).trim()).filter(Boolean) : String(input.skillsText || "").split(/[,·|;]/).map((s) => s.trim()).filter(Boolean);
  let experiences = (input.experiences || []).map((exp) => ({
    company: String(exp.company || "").trim(),
    title: String(exp.title || "").trim(),
    location: String(exp.location || "").trim(),
    startDate: String(exp.startDate || "").trim(),
    endDate: String(exp.endDate || "").trim(),
    bullets: ensureBullets(exp.bullets || [])
  })).filter((exp) => exp.company || exp.title || exp.bullets.length);
  if (!experiences.length && ((_b = input.experienceText) == null ? void 0 : _b.trim())) {
    experiences = parseExperienceText(input.experienceText);
  }
  return {
    fullName: String(input.fullName || "").trim(),
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    location: String(input.location || "").trim(),
    linkedin: String(input.linkedin || "").trim(),
    website: String(input.website || "").trim(),
    summary: String(input.summary || "").trim(),
    skills,
    experiences,
    projects: (input.projects || []).map((p) => ({
      name: String(p.name || "").trim(),
      bullets: ensureBullets(p.bullets || [])
    })).filter((p) => p.name || p.bullets.length),
    education: String(input.education || "").trim()
  };
}
function parseExperienceText(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const experiences = [];
  let current = null;
  for (const line of lines) {
    const cleaned = line.replace(/^[-*•]\s*/, "").trim();
    if (/^[-*•]/.test(line) && current) {
      current.bullets.push(cleaned);
      continue;
    }
    if (/[,|–-]/.test(line) || /\(\d{4}/.test(line) || /\b(present|current)\b/i.test(line)) {
      if (current && (current.company || current.title || current.bullets.length)) {
        experiences.push(current);
      }
      const dateMatch = line.match(/\(([^)]+)\)\s*$/);
      const withoutDates = line.replace(/\(([^)]+)\)\s*$/, "").trim();
      const parts = withoutDates.split(/[,|–-]/).map((p) => p.trim()).filter(Boolean);
      const dateParts = ((dateMatch == null ? void 0 : dateMatch[1]) || "").split(/[–—,to-]+/).map((p) => p.trim());
      current = {
        company: parts[0] || "Employer",
        title: parts.slice(1).join(", ") || "Role",
        location: "",
        startDate: dateParts[0] || "",
        endDate: dateParts[1] || "",
        bullets: []
      };
      continue;
    }
    if (!current) {
      current = {
        company: "Your experience",
        title: "Role",
        location: "",
        startDate: "",
        endDate: "",
        bullets: [cleaned]
      };
    } else {
      current.bullets.push(cleaned);
    }
  }
  if (current && (current.company || current.title || current.bullets.length)) {
    experiences.push(current);
  }
  return experiences.map((exp) => ({
    ...exp,
    bullets: ensureBullets(exp.bullets.length ? exp.bullets : ["Contributed to team goals"])
  }));
}
function ensureBullets(items) {
  return items.map(
    (item) => String(item || "").replace(/^[-*•\d.)\s]+/, "").trim()
  ).filter(Boolean);
}
function enforceExperienceBullets(markdown) {
  const lines = markdown.split("\n");
  const out = [];
  let inExperience = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    if (/^##\s+/.test(trimmed) || /^\*\*[^*]*(experience|employment|work history)/i.test(trimmed)) {
      inExperience = /experience|work history|employment|leadership experience|engineering experience/i.test(
        lower
      );
      out.push(line);
      continue;
    }
    if (/^#\s+/.test(trimmed) && !/^##/.test(trimmed)) {
      inExperience = false;
      out.push(line);
      continue;
    }
    if (inExperience && trimmed && !/^#{1,3}\s/.test(trimmed) && !trimmed.startsWith("*") && !trimmed.startsWith("-") && !trimmed.startsWith("**") && !/^(dear |sincerely|hiring manager|duties)/i.test(trimmed)) {
      if (trimmed.length > 140 && /[.;]/.test(trimmed)) {
        const parts = trimmed.split(/(?<=[.;])\s+/).map((p) => p.trim()).filter(Boolean);
        for (const part of parts) {
          out.push(`- ${part.replace(/^[-*•]\s*/, "")}`);
        }
      } else {
        out.push(`- ${trimmed.replace(/^[-*•]\s*/, "")}`);
      }
      continue;
    }
    if (inExperience && /^[-*•]\s+/.test(trimmed)) {
      out.push(`- ${trimmed.replace(/^[-*•]\s*/, "")}`);
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

const SECTION_ALIASES = {
  profile: "summary",
  about: "summary",
  summary: "summary",
  "professional summary": "summary",
  "technical skills": "skills",
  skills: "skills",
  "core competencies": "skills",
  toolkit: "skills",
  "professional experience": "experience",
  experience: "experience",
  "work experience": "experience",
  "work history": "experience",
  employment: "experience",
  projects: "projects",
  "selected projects": "projects",
  "personal projects": "projects",
  education: "education",
  certifications: "other",
  "additional information": "other",
  awards: "other"
};
function normalizeSectionKey(line) {
  const cleaned = line.replace(/^#{1,3}\s+/, "").replace(/^\*+|\*+$/g, "").replace(/[:\-–—]+\s*$/, "").trim();
  if (!cleaned || cleaned.length > 60) return null;
  const lower = cleaned.toLowerCase();
  if (SECTION_ALIASES[lower]) return SECTION_ALIASES[lower];
  const isAllCaps = cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned) && cleaned.split(/\s+/).length <= 5 && !/[•@]/.test(cleaned);
  if (isAllCaps && SECTION_ALIASES[lower]) return SECTION_ALIASES[lower];
  for (const [alias, key] of Object.entries(SECTION_ALIASES)) {
    if (lower === alias || lower.startsWith(`${alias} `)) return key;
  }
  return null;
}
function isSectionHeading(line) {
  return normalizeSectionKey(line) !== null;
}
function hasDateSignal(line) {
  return /\b(19|20)\d{2}\b/.test(line) || /\b(present|current|heute)\b/i.test(line);
}
function isRoleHeader(line) {
  if (!line || /^[-*•]/.test(line) || isSectionHeading(line)) return false;
  if (line.length > 160) return false;
  if (!hasDateSignal(line)) return false;
  if (!/[,|–—\-]/.test(line) && !/\b(remote|hybrid|onsite)\b/i.test(line)) return false;
  if (line.length > 110 && !/\b(19|20)\d{2}\b/.test(line)) return false;
  return true;
}
function parseRoleHeader(line) {
  const cleaned = line.replace(/^#{1,3}\s+/, "").replace(/\*+/g, "").trim();
  const locationMatch = cleaned.match(/\|\s*([^|]+)\s*$/);
  const location = ((locationMatch == null ? void 0 : locationMatch[1]) || "").trim();
  const withoutLocation = cleaned.replace(/\|\s*[^|]+$/, "").trim();
  const dateMatch = withoutLocation.match(
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4})\s*[–—\-to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4}|Present|Current)/i
  ) || withoutLocation.match(/\(([^)]+)\)\s*$/);
  let startDate = "";
  let endDate = "";
  let withoutDates = withoutLocation;
  if (dateMatch) {
    if (dateMatch[1] && dateMatch[2] && !dateMatch[0].startsWith("(")) {
      startDate = dateMatch[1].trim();
      endDate = dateMatch[2].trim();
      withoutDates = withoutLocation.replace(dateMatch[0], "").trim();
    } else {
      const parts2 = String(dateMatch[1] || dateMatch[0] || "").replace(/[()]/g, "").split(/[–,to—\-]+/i).map((p) => p.trim()).filter(Boolean);
      startDate = parts2[0] || "";
      endDate = parts2[1] || "";
      withoutDates = withoutLocation.replace(/\(([^)]+)\)\s*$/, "").replace(dateMatch[0], "").trim();
    }
  }
  const parts = withoutDates.split(/[,|]/).map((p) => p.trim()).filter(Boolean);
  let title = "";
  let company = "";
  if (parts.length >= 2) {
    const firstLooksLikeTitle = /\b(engineer|developer|manager|lead|designer|analyst|consultant|intern|director|architect|founder|specialist)\b/i.test(
      parts[0]
    );
    if (firstLooksLikeTitle) {
      title = parts[0];
      company = parts.slice(1).join(", ");
    } else {
      company = parts[0];
      title = parts.slice(1).join(", ");
    }
  } else {
    title = parts[0] || "Role";
    company = "Employer";
  }
  return {
    company,
    title,
    location,
    startDate,
    endDate,
    bullets: []
  };
}
function extractCandidateProfileHeuristic(resumeText) {
  const text = resumeText.trim();
  if (!text) return { ...EMPTY_CANDIDATE_PROFILE };
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, " ").trim()).filter(Boolean);
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){1,2}\d{2,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{2,4})?/
  );
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/i);
  const websiteMatch = text.match(
    /(?:https?:\/\/)(?:www\.)?(?!linkedin\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[^\s]*)?/i
  );
  let fullName = "";
  const labeled = text.match(
    /(?:^|\n)\s*(?:full\s*)?name\s*[:\-]\s*([A-Za-z][A-Za-z .'-]{1,60})/i
  );
  if (labeled == null ? void 0 : labeled[1]) fullName = labeled[1].trim();
  if (!fullName) {
    fullName = lines.find((line) => {
      const cleaned = line.split(/[|·•]/)[0].trim();
      if (cleaned.length < 3 || cleaned.length > 70) return false;
      if (/@|http|linkedin|phone|email|summary|experience|education|skills|profile|curriculum|resume|cv\b|portfolio/i.test(
        cleaned
      )) {
        return false;
      }
      if (/\d{5,}/.test(cleaned)) return false;
      const words = cleaned.split(/\s+/).filter(Boolean);
      if (words.length < 2 || words.length > 6) return false;
      return /^[\p{L}][\p{L} .'-]*$/u.test(cleaned);
    }) || "";
    fullName = fullName.split(/[|·•]/)[0].trim();
  }
  if (!fullName) {
    const caps = lines.slice(0, 5).find((line) => {
      const words = line.split(/\s+/);
      return words.length >= 2 && words.length <= 5 && line === line.toUpperCase() && /^[A-Z][A-Z .'-]+$/.test(line) && !/RESUME|CURRICULUM|CV|PROFILE/.test(line);
    });
    if (caps) {
      fullName = caps.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  const location = lines.find((line) => {
    if (/@/.test(line) || /linkedin/i.test(line) || line.length > 90) return false;
    if (line === fullName) return false;
    return /\b(Street|St\.|Road|Rd\.|Avenue|Ave\.|City|State|Province|Country|Remote|Germany|UK|USA)\b/i.test(
      line
    ) || /,\s*[A-Z]{2}\b/.test(line) || /\b(London|Berlin|Hamburg|Paris|Lagos|Nairobi|Accra|Cairo|Dubai|Toronto|New York|San Francisco|Los Angeles|Chicago|Austin|Seattle|Boston|Amsterdam|Madrid|Rome|Sydney|Singapore|Abuja|Port Harcourt|Johannesburg|Cape Town)\b/i.test(
      line
    ) || /[A-Za-z]+,\s*[A-Za-z]+/.test(line) && !/@/.test(line) && line.split(/\s+/).length <= 8;
  }) || "";
  const experiences = extractExperiencesHeuristic(text);
  const projects = extractProjectsHeuristic(text);
  const skills = extractSkillsHeuristic(text);
  const education = extractEducationHeuristic(text);
  const summary = extractSummaryHeuristic(text);
  return normalizeCandidateProfile({
    fullName,
    email: (emailMatch == null ? void 0 : emailMatch[0]) || "",
    phone: ((phoneMatch == null ? void 0 : phoneMatch[0]) || "").trim(),
    location: location.replace(/^location\s*[:\-]\s*/i, "").trim(),
    linkedin: (linkedinMatch == null ? void 0 : linkedinMatch[0]) || "",
    website: (websiteMatch == null ? void 0 : websiteMatch[0]) || "",
    summary,
    skills,
    experiences,
    projects,
    education
  });
}
function extractExperiencesHeuristic(resumeText) {
  const lines = resumeText.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, " ").trim()).filter(Boolean);
  const experiences = [];
  let inExperience = false;
  let current = null;
  const flush = () => {
    if (current && (current.company || current.title || current.bullets.length)) {
      experiences.push({
        ...current,
        bullets: ensureBullets(
          current.bullets.length ? current.bullets : ["Contributed to team delivery goals"]
        )
      });
    }
    current = null;
  };
  for (const line of lines) {
    const section = normalizeSectionKey(line);
    if (section) {
      if (section === "experience") {
        inExperience = true;
        flush();
        continue;
      }
      if (inExperience) {
        flush();
        inExperience = false;
      }
      continue;
    }
    if (!inExperience) continue;
    if (/^[-*•]/.test(line)) {
      if (!current) {
        current = {
          company: "Employer",
          title: "Role",
          location: "",
          startDate: "",
          endDate: "",
          bullets: []
        };
      }
      current.bullets.push(line.replace(/^[-*•]\s*/, "").trim());
      continue;
    }
    if (isRoleHeader(line)) {
      flush();
      current = parseRoleHeader(line);
      continue;
    }
    if (current && line && current.bullets.length) {
      const last = current.bullets[current.bullets.length - 1];
      if (last.length < 280 && !/^[A-Z][a-z]+ [A-Z]/.test(line)) {
        current.bullets[current.bullets.length - 1] = `${last} ${line}`.trim();
        continue;
      }
    }
  }
  flush();
  return experiences.slice(0, 12);
}
function extractProjectsHeuristic(resumeText) {
  const lines = resumeText.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, " ").trim()).filter(Boolean);
  const projects = [];
  let inProjects = false;
  let current = null;
  const flush = () => {
    if (current && (current.name || current.bullets.length)) {
      projects.push({
        name: current.name || "Project",
        bullets: ensureBullets(
          current.bullets.length ? current.bullets : ["Delivered a scoped personal/professional project"]
        )
      });
    }
    current = null;
  };
  for (const line of lines) {
    const section = normalizeSectionKey(line);
    if (section) {
      if (section === "projects") {
        inProjects = true;
        flush();
        continue;
      }
      if (inProjects) {
        flush();
        inProjects = false;
      }
      continue;
    }
    if (!inProjects) continue;
    if (/^[-*•]/.test(line)) {
      if (!current) {
        current = { name: "Project", bullets: [] };
      }
      current.bullets.push(line.replace(/^[-*•]\s*/, "").trim());
      continue;
    }
    if (isRoleHeader(line)) {
      flush();
      const parsed = parseRoleHeader(line);
      current = {
        name: [parsed.company, parsed.title].filter(Boolean).join(" \u2014 ") || line,
        bullets: []
      };
      continue;
    }
    if (current && line && current.bullets.length) {
      const last = current.bullets[current.bullets.length - 1];
      current.bullets[current.bullets.length - 1] = `${last} ${line}`.trim();
      continue;
    }
    if (!current && line && !/^[-*•]/.test(line)) {
      current = { name: line.replace(/^#{1,3}\s+/, "").trim(), bullets: [] };
    }
  }
  flush();
  return projects.slice(0, 10);
}
function extractSkillsHeuristic(text) {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, " ").trim()).filter(Boolean);
  const collected = [];
  let inSkills = false;
  const skillCategories = /^(languages|frontend(\s+technologies)?|backend(\s+technologies)?|cloud(\s*&\s*devops)?|devops|testing(\s*&\s*tools)?|tools|ai assisted tool|frameworks|libraries)$/i;
  for (const line of lines) {
    const section = normalizeSectionKey(line);
    if (section === "skills") {
      inSkills = true;
      continue;
    }
    if (section && section !== "skills" && section !== "other") {
      inSkills = false;
      continue;
    }
    if (!inSkills) continue;
    if (skillCategories.test(line)) continue;
    const parts = line.replace(/^[-*•]\s*/, "").split(/[·|,;/]/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 48);
    collected.push(...parts);
  }
  return [...new Set(collected)].slice(0, 18);
}
function extractEducationHeuristic(text) {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, " ").trim()).filter(Boolean);
  const block = [];
  let inEdu = false;
  for (const line of lines) {
    const section = normalizeSectionKey(line);
    if (section) {
      if (section === "education") {
        inEdu = true;
        continue;
      }
      if (inEdu) break;
      continue;
    }
    if (inEdu) block.push(line);
  }
  return block.slice(0, 6).join("\n");
}
function extractSummaryHeuristic(text) {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, " ").trim()).filter(Boolean);
  const block = [];
  let inSummary = false;
  for (const line of lines) {
    const section = normalizeSectionKey(line);
    if (section) {
      if (section === "summary") {
        inSummary = true;
        continue;
      }
      if (inSummary) break;
      continue;
    }
    if (inSummary) block.push(line.replace(/^[-*•]\s*/, ""));
  }
  return block.join(" ").slice(0, 700);
}
function resolveCandidateProfileSync(input) {
  var _a;
  const fromForm = normalizeCandidateProfile(input.candidateProfile || {});
  if ((_a = input.resumeText) == null ? void 0 : _a.trim()) {
    const extracted = extractCandidateProfileHeuristic(input.resumeText);
    const merged = mergeProfiles(extracted, fromForm.fullName ? fromForm : null);
    if (!merged.fullName.trim()) {
      const firstLine = input.resumeText.split(/\r?\n/).map((l) => l.replace(/^#+\s*/, "").trim()).find((l) => l.length >= 3 && l.length <= 80 && !/@/.test(l) && !/^https?:/i.test(l)) || "";
      if (firstLine) merged.fullName = firstLine.split(/[|·•]/)[0].trim();
    }
    return merged;
  }
  return fromForm;
}
function mergeProfiles(base, override) {
  var _a, _b, _c;
  if (!override) return base;
  return normalizeCandidateProfile({
    fullName: override.fullName || base.fullName,
    email: override.email || base.email,
    phone: override.phone || base.phone,
    location: override.location || base.location,
    linkedin: override.linkedin || base.linkedin,
    website: override.website || base.website,
    summary: override.summary || base.summary,
    skills: ((_a = override.skills) == null ? void 0 : _a.length) ? override.skills : base.skills,
    experiences: ((_b = override.experiences) == null ? void 0 : _b.length) ? override.experiences : base.experiences,
    projects: ((_c = override.projects) == null ? void 0 : _c.length) ? override.projects : base.projects,
    education: override.education || base.education
  });
}

const CV_FORMATS = [
  {
    id: "classic-professional",
    name: "Classic Professional",
    description: "Traditional single-column CV with summary, skills, experience, education.",
    bestFor: "Most corporate roles"
  },
  {
    id: "modern-compact",
    name: "Modern Compact",
    description: "Tighter spacing and short bullets for recruiters who skim fast.",
    bestFor: "High-volume applications"
  },
  {
    id: "executive-leadership",
    name: "Executive Leadership",
    description: "Leadership narrative, scope of ownership, and org-level outcomes.",
    bestFor: "Senior and director roles"
  },
  {
    id: "technical-engineer",
    name: "Technical Engineer",
    description: "Skills matrix, systems, stack depth, and delivery metrics.",
    bestFor: "Software and platform roles"
  },
  {
    id: "product-strategy",
    name: "Product Strategy",
    description: "Discovery, roadmap impact, stakeholder work, and shipped outcomes.",
    bestFor: "Product management"
  },
  {
    id: "data-insights",
    name: "Data & Insights",
    description: "Analytics tools, experiment design, and decision impact.",
    bestFor: "Data analyst / scientist roles"
  },
  {
    id: "design-craft",
    name: "Design Craft",
    description: "Portfolio-forward with process, tools, and product collaboration.",
    bestFor: "Design and UX roles"
  },
  {
    id: "research-academic",
    name: "Research Academic",
    description: "Publications, methods, teaching, and research contributions.",
    bestFor: "Research and academic posts"
  },
  {
    id: "startup-generalist",
    name: "Startup Generalist",
    description: "Breadth, ownership, speed, and wearing multiple hats.",
    bestFor: "Early-stage startups"
  },
  {
    id: "impact-first",
    name: "Impact First",
    description: "Leads with quantified wins before role chronology.",
    bestFor: "Results-driven hiring teams"
  },
  {
    id: "federal-plain",
    name: "Federal Plain",
    description: "Clean, conservative wording with clear duties and keywords.",
    bestFor: "Government and formal orgs"
  },
  {
    id: "hybrid-skills-left",
    name: "Hybrid Skills Spotlight",
    description: "Skills and tools listed prominently, then experience detail.",
    bestFor: "Specialist IC roles"
  },
  {
    id: "the-corporate",
    name: "The Corporate",
    description: "Header with strong color block, structured full-width sections, and side-by-side core skills & education.",
    bestFor: "Corporate, finance, and traditional corporate leadership roles"
  },
  {
    id: "the-executive",
    name: "The Executive",
    description: "Centered bold header with a two-column layout separating skills, education, and credentials from experience.",
    bestFor: "SVP, Director, and high-level executive positions"
  },
  {
    id: "the-strategist",
    name: "The Strategist",
    description: "Asymmetrical design featuring a prominent left sidebar with profile image placeholder, contacts, and core expertise.",
    bestFor: "Consulting, strategic planning, and advisory roles"
  },
  {
    id: "the-creative-director",
    name: "The Creative Director",
    description: "Asymmetric teal sidebar with large display header, Awards, and timeline layout.",
    bestFor: "Creative, design, advertising, and marketing leadership"
  },
  {
    id: "the-partner",
    name: "The Partner",
    description: "Centered header with dual horizontal line accents and a traditional elegant serif layout.",
    bestFor: "Legal, consulting partners, and advisory roles"
  },
  {
    id: "the-innovator",
    name: "The Innovator",
    description: "Dark-themed cyberpunk neon design featuring green border glow panels.",
    bestFor: "Creative tech, startup founders, and game development"
  },
  {
    id: "the-digital-nomad",
    name: "The Digital Nomad",
    description: "50/50 vertical split screen with a bold dark sidebar profile and white experience canvas.",
    bestFor: "Remote designers, freelance architects, and digital nomads"
  },
  {
    id: "the-social-media-pro",
    name: "The Social Media Pro",
    description: "Vibrant geometric gradient top banner, rounded profile picture overlap, and modern social accents.",
    bestFor: "Social media, digital marketing, content creators, and PR pros"
  },
  {
    id: "the-brand-architect",
    name: "The Brand Architect",
    description: "Architectural monogram background layout with asymmetric layout details.",
    bestFor: "Brand strategists, art directors, and luxury market designers"
  },
  {
    id: "the-typographer",
    name: "The Typographer",
    description: "Typography-first editorial layout with bold black lines and large tight headings.",
    bestFor: "Editorial designers, copywriters, and print journalists"
  },
  {
    id: "the-researcher",
    name: "The Researcher",
    description: "Traditional academic CV prioritizing academic appointments, publication lists, and methods.",
    bestFor: "Postdocs, researchers, professors, and academic fellows"
  },
  {
    id: "the-engineer",
    name: "The Engineer",
    description: "Dedicated sidebar for tech stack, code highlights, and distribution architecture.",
    bestFor: "Systems engineers, network architects, and platform developers"
  },
  {
    id: "the-distinguished",
    name: "The Distinguished",
    description: "Traditional serif design with top color line accent and custom bibliography notes.",
    bestFor: "Distinguished specialists, executives, and senior advisors"
  },
  {
    id: "the-researcher-updated",
    name: "The Researcher (Updated)",
    description: "Cleaned-up version of the traditional academic CV layout with improved grid spacing.",
    bestFor: "Medical researchers, scientists, and senior academic staff"
  }
];
function getCvFormat(id) {
  return CV_FORMATS.find((f) => f.id === id) || CV_FORMATS[0];
}
const CV_FORMAT_PREVIEW_CONTEXT = {
  title: "Software Engineer",
  company: "Northline Systems",
  keywords: ["TypeScript", "APIs", "ownership"],
  requiredSkills: ["TypeScript", "Node.js", "PostgreSQL", "System Design"],
  preferredSkills: ["React", "AWS"],
  responsibilities: [
    "Own end-to-end delivery for customer-facing features",
    "Improve reliability with clearer runbooks and ownership",
    "Partner with product and design on scoped releases"
  ],
  tone: "professional",
  seniority: "mid-level"
};
function buildCvFormatPreview(formatId) {
  return buildCvByFormat(formatId, CV_FORMAT_PREVIEW_CONTEXT);
}
function replaceEmDashes(text) {
  return text.replace(/\u2014/g, ",").replace(/\u2013/g, ",").replace(/—/g, ",").replace(/–/g, ",").replace(/-{2,}/g, ",").replace(/\s*,\s*/g, ", ").replace(/,\s*,+/g, ",").replace(/^\s*,\s*/gm, "").replace(/\s+,/g, ",");
}
function buildCvByFormat(formatId, analysis, profile) {
  var _a, _b, _c, _d, _e, _f;
  const format = getCvFormat(formatId);
  const skills = unique$1([
    ...(profile == null ? void 0 : profile.skills) || [],
    ...analysis.requiredSkills,
    ...analysis.preferredSkills,
    ...analysis.keywords
  ]).slice(0, 14);
  const skillLine = skills.length > 0 ? skills.join(" \xB7 ") : "TypeScript \xB7 Node.js \xB7 PostgreSQL \xB7 API Design \xB7 Collaboration \xB7 Ownership";
  const bullets = (analysis.responsibilities.length ? analysis.responsibilities : [
    "Owned end-to-end delivery for features used by thousands of weekly active users",
    "Reduced average incident recovery time by 28% through clearer runbooks and ownership",
    "Partnered with design and product to ship scoped releases every two weeks"
  ]).slice(0, 5).map((item) => `- ${toMetricBullet(item)}`).join("\n");
  const name = ((_a = profile == null ? void 0 : profile.fullName) == null ? void 0 : _a.trim()) || "Jordan Ellis";
  const contact = profile && formatCandidateContactLine(profile) || "San Francisco, CA \xB7 jordan.ellis@email.com \xB7 (415) 555-0142 \xB7 linkedin.com/in/jordanellis";
  const title = analysis.title;
  const company = analysis.company;
  const website = ((_b = profile == null ? void 0 : profile.website) == null ? void 0 : _b.trim()) || ((_c = profile == null ? void 0 : profile.linkedin) == null ? void 0 : _c.trim()) || "";
  const summaryText = ((_d = profile == null ? void 0 : profile.summary) == null ? void 0 : _d.trim()) || `${cap(analysis.seniority)} professional focused on ${title.toLowerCase()} work. Clear communicator with ownership of outcomes and measurable delivery quality. Seeking to contribute to **${company}** in ${skills.slice(0, 3).join(", ") || "core product work"}.`;
  const educationText = ((_e = profile == null ? void 0 : profile.education) == null ? void 0 : _e.trim()) || "### B.S., Computer Science, University of California, Santa Cruz\n*Santa Cruz, CA \xB7 2019*\n- Coursework: Distributed Systems, Databases, Human-Computer Interaction";
  const experienceBlock = buildExperienceMarkdown(profile, title, bullets);
  const projectsBlock = buildProjectsMarkdown(profile);
  if ((_f = profile == null ? void 0 : profile.fullName) == null ? void 0 : _f.trim()) {
    return replaceEmDashes(buildPersonalizedCv(format.id, {
      name,
      contact,
      title,
      skillLine,
      skills,
      summaryText,
      educationText,
      experienceBlock,
      projectsBlock,
      website,
      analysis
    }));
  }
  const builders = {
    "classic-professional": () => `# ${name}
${title}
${contact} \xB7 github.com/jordanellis

## Professional Summary
${cap(analysis.seniority)} professional focused on ${title.toLowerCase()} work. Clear communicator seeking to contribute to **${company}**.

## Core Competencies
${skillLine}

## Professional Experience
### Northline Systems, ${title}
*San Francisco, CA \xB7 Jan 2022 \u2013 Present*
${bullets}

## Education
### B.S., Computer Science, University of California, Santa Cruz
*Santa Cruz, CA*
`,
    "modern-compact": () => `# ${name} | ${title}
${contact}

**Summary:** ${summaryText}

**Skills:** ${skillLine}

**Experience**
### Northline Systems, ${title} (${bullets.split("\n")[0]})
`,
    "executive-leadership": () => `# ${name}
${title} | Leadership Profile
${contact}

## Executive Summary
${summaryText}

## Leadership Competencies
${skillLine}

## Selected Leadership Experience
### Northline Systems, ${title}
${bullets}
`,
    "technical-engineer": () => `# ${name}
${title}
${contact}

## Technical Summary
${summaryText}

## Technical Skills
${skillLine}

## Engineering Experience
### Northline Systems, ${title}
${bullets}
`,
    "product-strategy": () => `# ${name}
${title}
${contact}

## Product Summary
${summaryText}

## Core Experience
### Northline Systems, ${title}
${bullets}
`,
    "data-insights": () => `# ${name}
${title}
${contact}

## Data Summary
${summaryText}

## Analytical Experience
### Northline Systems, ${title}
${bullets}
`,
    "design-craft": () => `# ${name}
${title}
${contact}

## Design Philosophy
${summaryText}

## Craft Experience
### Northline Systems, ${title}
${bullets}
`,
    "research-academic": () => `# ${name}
${title}
${contact}

## Research Profile
${summaryText}

## Academic Experience
### Northline Systems, ${title}
${bullets}
`,
    "startup-generalist": () => `# ${name}
${title}
${contact}

## Startup Narrative
${summaryText}

## Execution Experience
### Northline Systems, ${title}
${bullets}
`,
    "impact-first": () => `# ${name}
${title}
${contact}

## Selected Impact
- Quantified win based on ${skills[0] || "core engineering"} deliverables

## Experience Timeline
### Northline Systems, ${title}
${bullets}
`,
    "federal-plain": () => `# ${name}
${title}
${contact}

## Summary
${summaryText}

## Skills
${skills.map((s) => `- ${s}`).join("\n")}

## Work Experience
### Northline Systems, ${title}
${bullets}
`,
    "hybrid-skills-left": () => `# ${name}
${title}
${contact}

## Skills Spotlight
${skills.map((s) => `- ${s}`).join("\n")}

## Professional Experience
### Northline Systems, ${title}
${bullets}
`,
    "the-corporate": () => `# ${name}
${title}
${contact}

## Professional Profile
${summaryText}

## Core Competencies & Education
### Core Competencies
${skillLine}

### Education
${educationText}

## Professional Experience
### Northline Systems, ${title}
*San Francisco, CA \xB7 Jan 2022 \u2013 Present*
${bullets}
`,
    "the-executive": () => `# ${name}
${title} | Executive Profile
${contact}

## Core Expertise
${skillLine}

## Education & Credentials
${educationText}

- Credentials: CFA Charterholder \xB7 Six Sigma Black Belt

## Professional Experience
### Northline Systems, ${title}
*San Francisco, CA \xB7 Jan 2022 \u2013 Present*
${bullets}

## Leadership & Impact
Served as a board member and mentor, delivering financial literacy programs.
`,
    "the-strategist": () => `# ${name}
${title} | Strategic Profile
${contact}

## Core Expertise
${skillLine}

## Education & Credentials
${educationText}

- Credentials: PMP \xB7 CSM

## Strategist Profile
${summaryText}

## Professional Experience
### Northline Systems, ${title}
*San Francisco, CA \xB7 Jan 2022 \u2013 Present*
${bullets}
`,
    "the-creative-director": () => `# ${name}
${title} | Creative Director Profile
${contact}

## Creative Director Profile
${summaryText}

## Recognition
- Red Dot Design Award 2022
- Awwwards Site of the Year 2021

## Professional Experience
### Northline Systems, dots
*2022 \u2014 PRESENT*
${bullets}
`,
    "the-partner": () => `# ${name}
${title}
${contact}

## Executive Profile
${summaryText}

## Professional Experience
### Northline Systems, ${title}
*2022 \u2014 PRESENT*
${bullets}

## Education
${educationText}

## Core Expertise
${skillLine}
`,
    "the-innovator": () => `# ${name}
${title}
${contact}

## Innovator Profile
${summaryText}

## Professional Experience
### Northline Systems, ${title}
${bullets}

## Skills & Technologies
${skillLine}
`,
    "the-digital-nomad": () => `# ${name}
${title}
${contact}

## Nomad Profile
${summaryText}

## Skills
${skillLine}

## Experience
### Northline Systems, ${title}
${bullets}
`,
    "the-social-media-pro": () => `# ${name}
${title}
${contact}

## Social Media Profile
${summaryText}

## Core Competencies
${skillLine}

## Professional Experience
### Northline Systems, ${title}
${bullets}
`,
    "the-brand-architect": () => `# ${name}
${title}
${contact}

## Brand Profile
${summaryText}

## Experience
### Northline Systems, ${title}
${bullets}
`,
    "the-typographer": () => `# ${name}
${title}
${contact}

## Editorial Profile
${summaryText}

## Professional Experience
### Northline Systems, ${title}
${bullets}
`,
    "the-researcher": () => `# ${name}
${title}
${contact}

## Research Profile
${summaryText}

## Academic Appointments
### Northline Systems, ${title}
${bullets}
`,
    "the-engineer": () => `# ${name}
${title}
${contact}

## System Profile
${summaryText}

## Stack & Tools
${skillLine}

## Engineering Experience
### Northline Systems, ${title}
${bullets}
`,
    "the-distinguished": () => `# ${name}
${title}
${contact}

## Distinguished Profile
${summaryText}

## Experience
### Northline Systems, ${title}
${bullets}
`,
    "the-researcher-updated": () => `# ${name}
${title}
${contact}

## Research Profile
${summaryText}

## Academic Appointments
### Northline Systems, ${title}
${bullets}
`
  };
  const build = builders[format.id] || builders["classic-professional"];
  return replaceEmDashes(build());
}
function buildRichCoverLetter(analysis, formatId, profile) {
  var _a, _b, _c;
  const format = getCvFormat(formatId);
  const company = analysis.company || "your organization";
  const name = ((_a = profile == null ? void 0 : profile.fullName) == null ? void 0 : _a.trim()) || "Jordan Ellis";
  const contact = profile && formatCandidateContactLine(profile) || "San Francisco, CA \xB7 jordan.ellis@email.com \xB7 (415) 555-0142 \xB7 linkedin.com/in/jordanellis";
  const skills = ((profile == null ? void 0 : profile.skills) || []).slice(0, 4).join(", ") || analysis.requiredSkills.slice(0, 4).join(", ") || analysis.keywords.slice(0, 4).join(", ") || analysis.title;
  const proofBullets = (((_c = (_b = profile == null ? void 0 : profile.experiences) == null ? void 0 : _b[0]) == null ? void 0 : _c.bullets) || analysis.responsibilities || []).slice(0, 3).map((b) => b.replace(/^[-*•]\s*/, ""));
  const focus = proofBullets[0] || analysis.responsibilities[0] || `the priorities described for the ${analysis.title} role`;
  const today = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const proofParagraph = proofBullets.length ? `In recent roles I have ${proofBullets.join("; ")}. Those results map directly to what ${company} needs for this posting.` : `In my current work I have focused on shipping in small increments, measuring what changed, and keeping stakeholders aligned with written decisions and named owners. I bring the same discipline to ${format.bestFor.toLowerCase()}: prioritize what moves the needle, document the decision, then follow through.`;
  return replaceEmDashes(`# ${name}
${contact}

${today}

Hiring Manager
${company}

Dear Hiring Manager,

I am writing to apply for the **${analysis.title}** position at ${company}. Your posting stood out because it emphasizes ${focus.toLowerCase()}, which aligns with the problems I have owned recently and the kind of impact I want to keep delivering. I am looking for a team where clear priorities, honest tradeoffs, and measurable outcomes matter more than slogans.

${proofParagraph}

I am particularly strong in ${skills}. Day to day, I translate ambiguous requests into scoped plans, surface risks early, and keep quality visible in production. I prefer short feedback loops, readable systems, and collaboration that respects both craft and deadlines. When requirements shift, I renegotiate scope rather than silently overpromising.

What draws me to ${company} is the chance to contribute where my experience can shorten ramp-up time and raise the quality bar for the ${analysis.title} seat. In the first 90 days I would expect to learn the team\u2019s operating cadence, map the highest-leverage gaps against this posting, and deliver a few concrete wins that make the next quarter easier, not just busier.

Thank you for considering my application. I would welcome a conversation about the role, the team\u2019s current challenges, and how my background can help. I can adjust to your interview schedule and am happy to share additional work samples on request.

Sincerely,
${name}
`);
}
function buildExperienceMarkdown(profile, fallbackTitle, fallbackBullets) {
  var _a;
  if ((_a = profile == null ? void 0 : profile.experiences) == null ? void 0 : _a.length) {
    return profile.experiences.map((exp) => {
      var _a2;
      const heading = `### ${[exp.title, exp.company].filter(Boolean).join(", ") || fallbackTitle}`;
      const dates = [exp.startDate, exp.endDate || "Present"].filter(Boolean).join(" \u2013 ");
      const meta = [exp.location, dates].filter(Boolean).join(" \xB7 ");
      const bullets = (((_a2 = exp.bullets) == null ? void 0 : _a2.length) ? exp.bullets : ["Contributed to team delivery goals"]).map((b) => `- ${b.replace(/^[-*•]\s*/, "")}`).join("\n");
      return `${heading}
${meta ? `*${meta}*
` : ""}${bullets}`;
    }).join("\n\n");
  }
  return `### Prior Employer, ${fallbackTitle}
*Location \xB7 Recent years*
${fallbackBullets}`;
}
function buildProjectsMarkdown(profile) {
  var _a;
  if (!((_a = profile == null ? void 0 : profile.projects) == null ? void 0 : _a.length)) return "";
  return profile.projects.map((project) => {
    var _a2;
    const bullets = (((_a2 = project.bullets) == null ? void 0 : _a2.length) ? project.bullets : ["Delivered a scoped project"]).map((b) => `- ${b.replace(/^[-*•]\s*/, "")}`).join("\n");
    return `### ${project.name}
${bullets}`;
  }).join("\n\n");
}
function withProjectsSection(experienceBlock, projectsBlock) {
  if (!projectsBlock.trim()) return experienceBlock;
  return `${experienceBlock}

## Projects
${projectsBlock}`;
}
function buildPersonalizedCv(formatId, ctx) {
  const {
    name,
    contact,
    title,
    skillLine,
    skills,
    summaryText,
    educationText,
    experienceBlock,
    projectsBlock,
    website,
    analysis
  } = ctx;
  const experienceWithProjects = withProjectsSection(experienceBlock, projectsBlock);
  switch (formatId) {
    case "modern-compact":
      return `# ${name} | ${title}
${contact}

**Summary:** ${summaryText}

**Skills:** ${skillLine}

**Experience**
${experienceWithProjects}

**Education:** ${educationText.replace(/^###\s*/, "").split("\n")[0]}
`;
    case "executive-leadership":
      return `# ${name}
${title} | Leadership Profile
${contact}

## Executive Summary
${summaryText}

## Leadership Competencies
${skillLine}

## Selected Leadership Experience
${experienceWithProjects}

## Education
${educationText}
`;
    case "technical-engineer":
      return `# ${name}
${title}
${contact}${website ? ` \xB7 ${website}` : ""}

## Technical Summary
${summaryText}

## Technical Skills
**Core:** ${skillLine}

## Engineering Experience
${experienceWithProjects}

## Education
${educationText}
`;
    case "impact-first":
      return `# ${name}
${title}
${contact}

## Selected Impact
${(ctx.analysis.responsibilities.slice(0, 3).length ? analysis.responsibilities.slice(0, 3) : skills.slice(0, 3)).map((r) => `- ${toMetricBullet(r)}`).join("\n")}

## Skills
${skillLine}

## Experience Timeline
${experienceWithProjects}

## Education
${educationText}
`;
    case "federal-plain":
      return `# ${name}
${title}
${contact}

## Summary
${summaryText}

## Skills
${skills.map((s) => `- ${s}`).join("\n") || "- Communication\n- Analysis\n- Documentation"}

## Work Experience
${experienceWithProjects}

## Education
${educationText}
`;
    case "hybrid-skills-left":
      return `# ${name}
${title}
${contact}

## Skills Spotlight
${skills.map((s) => `- ${s}`).join("\n") || "- Collaboration\n- Delivery\n- Communication"}

## Professional Experience
${experienceWithProjects}

## Education
${educationText}
`;
    case "the-corporate":
      return `# ${name}
${title}
${contact}

## Professional Profile
${summaryText}

## Core Competencies & Education
### Core Competencies
${skillLine}

### Education
${educationText}

## Professional Experience
${experienceWithProjects}
`;
    case "the-executive":
      return `# ${name}
${title} | Executive Profile
${contact}

## Core Expertise
${skillLine}

## Education & Credentials
${educationText}

- Credentials: CFA Charterholder \xB7 Six Sigma Black Belt

## Professional Experience
${experienceWithProjects}

## Leadership & Impact
Served as a board member and mentor, delivering financial and technical literacy programs to underserved communities, and acting as a keynote speaker at national forums.
`;
    case "the-strategist":
      return `# ${name}
${title} | Strategic Profile
${contact}

## Core Expertise
${skillLine}

## Education & Credentials
${educationText}

- Credentials: Project Management Professional (PMP) \xB7 Certified Scrum Master (CSM)

## Strategist Profile
${summaryText}

## Professional Experience
${experienceWithProjects}

## Leadership & Impact
Recognized as a thought leader in SaaS business models. Frequently invited panelist at national technology conferences and board advisor to growth-stage startups.
`;
    case "the-creative-director":
      return `# ${name}
${title} | Creative Director Profile
${contact}

## Creative Director Profile
${summaryText}

## Recognition
- Red Dot Design Award 2022
- Awwwards Site of the Year 2021

## Professional Experience
${experienceWithProjects}
`;
    case "the-partner":
      return `# ${name}
${title}
${contact}

## Executive Profile
${summaryText}

## Professional Experience
${experienceWithProjects}

## Education
${educationText}

## Core Expertise
${skillLine}
`;
    case "the-innovator":
      return `# ${name}
${title}
${contact}

## Innovator Profile
${summaryText}

## Professional Experience
${experienceWithProjects}

## Skills & Technologies
${skillLine}
`;
    case "the-digital-nomad":
      return `# ${name}
${title}
${contact}

## Nomad Profile
${summaryText}

## Skills
${skillLine}

## Experience
${experienceWithProjects}
`;
    case "the-social-media-pro":
      return `# ${name}
${title}
${contact}

## Social Media Profile
${summaryText}

## Core Competencies
${skillLine}

## Professional Experience
${experienceWithProjects}
`;
    case "the-brand-architect":
      return `# ${name}
${title}
${contact}

## Brand Profile
${summaryText}

## Experience
${experienceWithProjects}
`;
    case "the-typographer":
      return `# ${name}
${title}
${contact}

## Editorial Profile
${summaryText}

## Professional Experience
${experienceWithProjects}
`;
    case "the-researcher":
      return `# ${name}
${title}
${contact}

## Research Profile
${summaryText}

## Academic Appointments
${experienceWithProjects}
`;
    case "the-engineer":
      return `# ${name}
${title}
${contact}

## System Profile
${summaryText}

## Stack & Tools
${skillLine}

## Engineering Experience
${experienceWithProjects}
`;
    case "the-distinguished":
      return `# ${name}
${title}
${contact}

## Distinguished Profile
${summaryText}

## Experience
${experienceWithProjects}
`;
    case "the-researcher-updated":
      return `# ${name}
${title}
${contact}

## Research Profile
${summaryText}

## Academic Appointments
${experienceWithProjects}
`;
    default:
      return `# ${name}
${title}
${contact}${website ? ` \xB7 ${website}` : ""}

## Professional Summary
${summaryText}

## Core Competencies
${skillLine}

## Professional Experience
${experienceWithProjects}

## Education
${educationText}
`;
  }
}
function toMetricBullet(raw) {
  const cleaned = replaceEmDashes(raw.replace(/^[-*•\d.\s]+/, "").trim());
  if (/improved|reduced|increased|grew|cut|saved|shipped|owned|led|built|designed/i.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return `Delivered ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}, measured against an agreed success metric`;
}
function cap(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function unique$1(values) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!value.trim() || seen.has(key)) continue;
    seen.add(key);
    out.push(value.trim());
  }
  return out;
}

const PROFESSIONAL_RESUME_STRUCTURE = `
Use this exact Markdown structure (headings and order). Never use em dashes. Use commas instead.

# FULL NAME
Target Role Title
City, ST \xB7 email@domain.com \xB7 (555) 555-0100 \xB7 linkedin.com/in/handle \xB7 portfolio-or-github

## Professional Summary
2 to 3 sentences. Role target, years of relevant experience, strongest domains, and one proof point with a metric. No buzzwords.

## Core Competencies
Skills separated by middle dots on one line (8 to 14 skills max).

## Professional Experience
Include EVERY role from the source resume (do not drop older jobs). Most recent first.
### Company Name, Job Title
*City, ST \xB7 Mon YYYY \u2013 Present (or Mon YYYY)*
- Start each bullet with a strong verb
- Include a metric where honest (%, time saved, users, revenue, latency, uptime)
- Prefer 3 to 6 bullets per role
- CRITICAL: Every duty/achievement under Professional Experience must be a Markdown bullet starting with "- ". Never write experience as paragraphs.

### Earlier Company, Job Title
*City, ST \xB7 Mon YYYY \u2013 Mon YYYY*
- 2 to 5 bullets

## Projects
Include EVERY project from the source resume (omit this section only if the source has none).
### Project Name
- What was built, stack, and impact (2 to 4 bullets each)

## Education
### Degree, Field, University
*City, ST \xB7 Year*
- Optional honors / relevant coursework (1 line)

## Additional Information
Languages, certifications, awards \u2014 keep facts from the source.
`.trim();
const PROFESSIONAL_COVER_LETTER_STRUCTURE = `
Use this exact Markdown structure. Never use em dashes. Use commas instead.
Write 4 to 5 rich paragraphs:

# FULL NAME
City, ST \xB7 email@domain.com \xB7 (555) 555-0100 \xB7 linkedin.com/in/handle

[Today's date as Month DD, YYYY]

Hiring Manager
Company Name

Dear Hiring Manager,

Paragraph 1, Opening: State the exact role title and company. Explain why this posting fits, with one concrete strength.

Paragraph 2, Proof: Specific achievements with metrics mapped to the posting. Concrete and honest.

Paragraph 3, Working style: How you collaborate, communicate, and deliver. Tie to the team's likely needs.

Paragraph 4, Motivation: Why this company/role, and what you want to contribute in the first 90 days.

Paragraph 5, Close: Thank them, invite a conversation, offer scheduling flexibility.

Sincerely,
Full Name
`.trim();
function buildProfessionalResumeSample(analysis, formatId, profile) {
  return buildCvByFormat(formatId, analysis, profile);
}
function buildProfessionalCoverLetterSample(analysis, formatId, profile) {
  return buildRichCoverLetter(analysis, formatId, profile);
}

function hasScrapeTarget(target) {
  var _a, _b, _c;
  if (!target) return false;
  return Boolean(
    ((_a = target.jobTitle) == null ? void 0 : _a.trim()) || ((_b = target.resumeText) == null ? void 0 : _b.trim()) || ((_c = target.coverLetterText) == null ? void 0 : _c.trim())
  );
}
function buildScrapeTargetPrompt(target) {
  var _a, _b, _c;
  if (!hasScrapeTarget(target)) return "";
  const parts = [];
  if ((_a = target.jobTitle) == null ? void 0 : _a.trim()) {
    parts.push(`Target job title / role: "${target.jobTitle.trim()}".`);
  }
  if ((_b = target.resumeText) == null ? void 0 : _b.trim()) {
    parts.push(
      `Candidate resume (match seniority, skills, and domain):
${target.resumeText.trim().slice(0, 6e3)}`
    );
  }
  if ((_c = target.coverLetterText) == null ? void 0 : _c.trim()) {
    parts.push(
      `Cover letter signals (role/industry intent):
${target.coverLetterText.trim().slice(0, 3e3)}`
    );
  }
  return `

CANDIDATE TARGETING \u2014 prioritize openings related to the candidate. Prefer strongly related roles first. Still include borderline matches if few related roles exist, but deprioritize clearly unrelated titles (e.g. sales-only when the candidate is engineering).
${parts.join("\n\n")}`;
}
const JOB_ARRAY_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      company: { type: Type.STRING },
      location: { type: Type.STRING },
      salaryMin: { type: Type.NUMBER },
      salaryMax: { type: Type.NUMBER },
      currency: { type: Type.STRING },
      url: { type: Type.STRING },
      description: {
        type: Type.STRING,
        description: "Full job description text from the page when available (responsibilities, requirements, benefits). Prefer the complete posting over a short summary."
      }
    },
    required: ["title", "location", "url"]
  }
};
const TAILORED_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    resume: {
      type: Type.STRING,
      description: "Complete tailored resume in Markdown with EVERY work role and EVERY project from the source resume."
    },
    coverLetter: {
      type: Type.STRING,
      description: "Tailored cover letter in Markdown grounded in specific roles/projects from the source."
    }
  },
  required: ["resume", "coverLetter"]
};
function createGeminiClient(apiKey) {
  if (!apiKey) {
    throw createError$1({
      statusCode: 500,
      statusMessage: "GEMINI_API_KEY is missing. Add it to .env and restart the server."
    });
  }
  if (apiKey.startsWith("ya29.")) {
    throw createError$1({
      statusCode: 500,
      statusMessage: "GEMINI_API_KEY appears to be an OAuth access token. Use an AI Studio API key instead."
    });
  }
  return new GoogleGenAI({ apiKey });
}
async function generateWithModels(ai, models, generate, ollamaFallback) {
  let lastError;
  let sawQuota = false;
  for (const model of models) {
    try {
      return await generate(model);
    } catch (error) {
      lastError = error;
      const message = formatGeminiError(error);
      console.warn(`Gemini model ${model} failed:`, message);
      if (isGeminiQuotaOrUnavailableError(error)) {
        sawQuota = true;
      }
    }
  }
  if (ollamaFallback && (sawQuota || lastError)) {
    console.warn("Gemini unavailable/quota exceeded \u2014 using configured fallback");
    try {
      return await ollamaFallback();
    } catch (ollamaError) {
      console.warn("Ollama fallback failed:", ollamaError);
      throw createError$1({
        statusCode: 503,
        statusMessage: `${formatGeminiError(lastError)} Ollama fallback also failed: ${ollamaError instanceof Error ? ollamaError.message : String(ollamaError)}`
      });
    }
  }
  throw createError$1({
    statusCode: 503,
    statusMessage: formatGeminiError(lastError)
  });
}
async function extractJobsFromHtml(ai, models, html, url, target) {
  const targeting = buildScrapeTargetPrompt(target);
  const response = await generateWithModels(
    ai,
    models,
    (model) => ai.models.generateContent({
      model,
      contents: `You are a job extraction API. Extract job postings from the following HTML.
Return roles with title, location, and application URL.
The source URL is ${url}.
${targeting || "Return every role you can find."}

HTML:
${html}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: JOB_ARRAY_SCHEMA
      }
    }),
    async () => {
      const parsed = await ollamaJsonPrompt({
        system: 'Extract job postings from HTML. Return JSON as {"jobs":[...]} where each job has title, location, url, and optional company, salaryMin, salaryMax, currency, description. Prefer roles matching any candidate targeting instructions.',
        user: `Source URL: ${url}${targeting}

HTML:
${html.slice(0, 5e4)}`
      });
      const jobs = Array.isArray(parsed) ? parsed : Array.isArray(parsed.jobs) ? parsed.jobs : [];
      return { text: JSON.stringify(jobs) };
    }
  );
  return normalizeJobs(parseJsonArray(response.text || "[]"), url);
}
async function searchJobsForUrl(ai, models, url, reason, target) {
  const targeting = buildScrapeTargetPrompt(target);
  const response = await generateWithModels(
    ai,
    models,
    (model) => ai.models.generateContent({
      model,
      contents: `You are a job extraction API. We could not extract jobs from the source page (${reason}).
Use Google Search to find current job postings for the company or careers page associated with: ${url}
${targeting}

Return ONLY a valid JSON array. Each item must include: title, location, url, and optionally company, salaryMin, salaryMax, currency (prefer EUR/\u20AC when European), description.
Do not wrap the JSON in markdown fences.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    }),
    async () => {
      const parsed = await ollamaJsonPrompt({
        system: 'Infer likely current job openings for a company from the careers URL and your knowledge. Return JSON {"jobs":[{"title","location","url","company","description"}]}. Prefer roles matching any candidate targeting. If unsure, return an empty jobs array.',
        user: `Careers URL: ${url}
Reason page failed: ${reason}${targeting}
Return up to 10 plausible openings with absolute application URLs when possible.`
      });
      const jobs = Array.isArray(parsed) ? parsed : Array.isArray(parsed.jobs) ? parsed.jobs : [];
      return { text: JSON.stringify(jobs) };
    }
  );
  return normalizeJobs(parseJsonArray(response.text || "[]"), url);
}
async function filterJobsByTarget(ai, models, jobs, target) {
  if (!hasScrapeTarget(target) || jobs.length === 0) return jobs;
  if (jobs.length <= 2) return jobs;
  const targeting = buildScrapeTargetPrompt(target);
  const catalog = jobs.map(
    (j, i) => `${i}. ${j.title} | ${j.company || "Unknown"} | ${j.location} | ${(j.description || "").slice(0, 280)}`
  ).join("\n");
  try {
    const response = await generateWithModels(
      ai,
      models,
      (model) => ai.models.generateContent({
        model,
        contents: `You filter job listings for relevance to a candidate.
${targeting}

Return JSON: {"indexes":[number,...]} \u2014 0-based indexes of RELATED jobs from the list below, best matches first.
Include a role if it is a reasonable fit for skills/seniority/domain or the target title. Exclude clearly unrelated roles.
If almost everything is unrelated, still return the closest 1\u20133 indexes.

Jobs:
${catalog}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              indexes: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
              }
            },
            required: ["indexes"]
          }
        }
      }),
      async () => {
        const parsed2 = await ollamaJsonPrompt({
          system: 'Filter job list indexes for candidate relevance. Return JSON {"indexes":[0,2,...]} best first.',
          user: `${targeting}

Jobs:
${catalog}`
        });
        return { text: JSON.stringify(parsed2) };
      }
    );
    const parsed = JSON.parse(response.text || "{}");
    const indexes = Array.isArray(parsed.indexes) ? parsed.indexes.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 0 && n < jobs.length) : [];
    const unique = [...new Set(indexes)];
    if (unique.length === 0) return jobs;
    return unique.map((i) => jobs[i]).filter(Boolean);
  } catch (error) {
    console.warn("Job relevance filter failed \u2014 returning unfiltered list:", formatGeminiError(error));
    return jobs;
  }
}
async function tailorApplicationMaterials(ai, models, job, resumeText, coverLetterText, cvFormatId, candidateProfile) {
  const format = getCvFormat(cvFormatId);
  const profile = resolveCandidateProfileSync({
    resumeText,
    candidateProfile
  });
  const identityBlock = hasUsableIdentity(profile) ? `Use this identity exactly:
Name: ${profile.fullName}
Email: ${profile.email}
Phone: ${profile.phone}
Location: ${profile.location}
LinkedIn: ${profile.linkedin || ""}
Website: ${profile.website || ""}
Resume H1 and cover-letter signature MUST be "${profile.fullName}". Never use Jordan Ellis or other sample names.` : "Copy name, email, phone, and location exactly from the uploaded resume. Never invent sample contact details.";
  const prompt = `Write a tailored resume and cover letter in Markdown JSON {"resume":"...","coverLetter":"..."}.

CV format: ${format.name} \u2014 ${format.description}
${identityBlock}

Rules:
- Never use em dashes; use commas.
- Include EVERY work experience role and EVERY project from the source resume. Do not omit older jobs or projects.
- Add a ## Projects section when projects exist in the source.
- Work experience MUST use "-" bullet points (3\u20136 per role). Never paragraph experience.
- Cover letter: 4\u20135 short paragraphs grounded in specific roles/projects, signed with the real name.
- Do not invent employers, degrees, or skills not in the source materials.
- Keep formatting clean and presentable (clear headings, bullets, short lines).

Resume outline:
${PROFESSIONAL_RESUME_STRUCTURE}

Cover letter outline:
${PROFESSIONAL_COVER_LETTER_STRUCTURE}

Job:
Title: ${job.title}
Company: ${job.company || "Unknown"}
Location: ${job.location || "Unknown"}
Description:
${(job.description || "Not provided").slice(0, 8e3)}

${resumeText ? `Candidate resume (source of truth \u2014 preserve ALL roles and projects):
${resumeText.slice(0, 28e3)}` : hasUsableIdentity(profile) ? `Candidate profile JSON:
${JSON.stringify(profile).slice(0, 8e3)}` : "No resume provided \u2014 use clear [PLACEHOLDERS] for missing facts."}

${coverLetterText ? `Existing cover letter to adapt:
${coverLetterText.slice(0, 8e3)}` : "Write a new cover letter."}`;
  try {
    const response = await generateWithModels(
      ai,
      models.slice(0, 2),
      (model) => ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: TAILORED_SCHEMA,
          temperature: 0.4,
          maxOutputTokens: 12288
        }
      })
    );
    const parsed = JSON.parse(response.text || "{}");
    return finalizeTailored(parsed, profile);
  } catch (error) {
    console.warn("Gemini tailor failed \u2014 using deterministic profile template:", formatGeminiError(error));
    return buildDeterministicTailored(job, format.id, profile, resumeText);
  }
}
function finalizeTailored(parsed, profile) {
  return {
    resume: stampCandidateIdentity(
      enforceExperienceBullets(replaceEmDashes(parsed.resume || "")),
      profile
    ),
    coverLetter: stampCandidateIdentity(replaceEmDashes(parsed.coverLetter || ""), profile)
  };
}
function buildDeterministicTailored(job, formatId, profile, resumeText) {
  var _a, _b, _c;
  const analysis = {
    title: job.title,
    company: job.company || "Hiring Company",
    keywords: [],
    requiredSkills: profile.skills.slice(0, 8),
    preferredSkills: [],
    responsibilities: ((_b = (_a = profile.experiences[0]) == null ? void 0 : _a.bullets) == null ? void 0 : _b.slice(0, 4)) || [],
    tone: "professional",
    seniority: "mid-level"
  };
  const safeProfile = {
    ...profile,
    fullName: profile.fullName || ((_c = resumeText == null ? void 0 : resumeText.split(/\n/).map((l) => l.replace(/^#+\s*/, "").trim()).find((l) => l.length > 2 && !/@/.test(l))) == null ? void 0 : _c.split(/[|·]/)[0].trim()) || "Candidate"
  };
  const resume = stampCandidateIdentity(
    enforceExperienceBullets(
      replaceEmDashes(buildProfessionalResumeSample(analysis, formatId, safeProfile))
    ),
    safeProfile
  );
  const coverLetter = stampCandidateIdentity(
    replaceEmDashes(buildProfessionalCoverLetterSample(analysis, formatId, safeProfile)),
    safeProfile
  );
  return { resume, coverLetter };
}
function parseJsonArray(text) {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced == null ? void 0 : fenced[1]) {
      try {
        const parsed = JSON.parse(fenced[1].trim());
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    const start = trimmed.indexOf("[");
    const end = trimmed.lastIndexOf("]");
    if (start !== -1 && end > start) {
      try {
        const parsed = JSON.parse(trimmed.slice(start, end + 1));
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAX_HTML_LENGTH = 1e5;
async function fetchPageHtml(url) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      }
    });
    const html = await response.text();
    return {
      html,
      isError: !response.ok,
      statusText: `${response.status} ${response.statusText}`.trim(),
      status: response.status,
      finalUrl: response.url || url
    };
  } catch (error) {
    return {
      html: "",
      isError: true,
      statusText: error instanceof Error ? error.message : "Unknown fetch error",
      status: 0,
      finalUrl: url
    };
  }
}
function cleanHtmlForExtraction(html, sourceUrl) {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, img, video, iframe, footer, header, nav").remove();
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && !href.startsWith("http")) {
      try {
        $(el).attr("href", new URL(href, sourceUrl).href);
      } catch {
      }
    }
  });
  return ($("body").html() || "").slice(0, MAX_HTML_LENGTH);
}
function cleanHtmlForApplicationForm(html, sourceUrl) {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, img, video, iframe").remove();
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && !href.startsWith("http")) {
      try {
        $(el).attr("href", new URL(href, sourceUrl).href);
      } catch {
      }
    }
  });
  const formParts = [];
  $('form, [role="form"], .application, .application-form, #application, .job-application').each(
    (_, el) => {
      formParts.push($.html(el) || "");
    }
  );
  $('label, legend, fieldset, input, textarea, select, button[type="submit"]').each((_, el) => {
    var _a;
    const tag = (_a = el.tagName) == null ? void 0 : _a.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || tag === "label" || tag === "legend") {
      formParts.push($.html(el) || "");
    }
  });
  const combined = formParts.join("\n");
  if (combined.length > 500) {
    return combined.slice(0, MAX_HTML_LENGTH);
  }
  return ($("body").html() || "").slice(0, MAX_HTML_LENGTH);
}
function shouldUseSearchFallback(isError2, cleanedHtml, status) {
  if (isError2 || status >= 400) return true;
  if (cleanedHtml.length < 100) return true;
  const lower = cleanedHtml.toLowerCase();
  const looksLikeShell = !lower.includes("job") && !lower.includes("career") && !lower.includes("opening") && !lower.includes("position");
  return looksLikeShell;
}

const QUESTIONS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    notes: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          type: {
            type: Type.STRING,
            description: "text | textarea | select | radio | checkbox | boolean | number | url | email | file | unknown"
          },
          required: { type: Type.BOOLEAN },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          helpText: { type: Type.STRING },
          section: { type: Type.STRING }
        },
        required: ["id", "label", "type"]
      }
    }
  },
  required: ["questions"]
};
const ANSWERS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    answers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          answer: { type: Type.STRING },
          notes: {
            type: Type.STRING,
            description: "Short tip for the candidate about this answer"
          }
        },
        required: ["id", "answer"]
      }
    }
  },
  required: ["answers"]
};
async function extractApplicationForm(ai, models, job) {
  const { html, isError, status, statusText, finalUrl } = await fetchPageHtml(job.url);
  let questions = [];
  let notes;
  let title;
  let extractedFrom = "inferred";
  if (!isError && status < 400 && html) {
    const cleaned = cleanHtmlForApplicationForm(html, finalUrl);
    const fromHtml = await extractQuestionsFromHtml(ai, models, cleaned, job, finalUrl);
    questions = fromHtml.questions;
    notes = fromHtml.notes;
    title = fromHtml.title;
    if (questions.length > 0) extractedFrom = "html";
  } else {
    notes = `Could not load application page (${statusText}). Inferring likely screening questions from the job posting.`;
  }
  if (questions.length < 3) {
    const inferred = await inferQuestionsFromJob(ai, models, job);
    const existing = new Set(questions.map((q) => q.label.toLowerCase()));
    const extras = inferred.questions.filter((q) => !existing.has(q.label.toLowerCase()));
    const hadHtmlQuestions = questions.length > 0;
    questions = [...questions, ...extras];
    extractedFrom = hadHtmlQuestions ? "mixed" : "inferred";
    if (inferred.notes) {
      notes = [notes, inferred.notes].filter(Boolean).join(" ");
    }
  }
  return {
    sourceUrl: job.url,
    finalUrl,
    title: title || job.title,
    questions: questions.map((q, i) => ({
      ...q,
      id: q.id || `q-${i + 1}`,
      answer: q.answer || ""
    })),
    notes,
    extractedFrom
  };
}
async function answerApplicationQuestions(ai, models, job, questions, resumeText, coverLetterText) {
  if (!questions.length) return [];
  const profile = resolveCandidateProfileSync({ resumeText });
  const prefilled = autofillFromProfile(questions, profile);
  try {
    const response = await generateWithModels(
      ai,
      models,
      (model) => ai.models.generateContent({
        model,
        contents: `You are an application-form autofill assistant.
Fill EVERY question with a ready-to-paste answer. Do not leave answers blank.

Rules:
1) Contact fields (name, email, phone, location, LinkedIn, portfolio, GitHub): use exact values from the resume/profile.
2) Yes/no, boolean, select, radio: choose the best matching option from the provided options when present.
3) File uploads: write a short instruction (e.g. "Upload tailored resume PDF").
4) TECHNICAL / coding / system-design / experience questions: write concrete 4\u20138 sentence answers grounded in real roles, projects, tools, and outcomes from the resume. Prefer specifics (company names, stack, metrics) over generic fluff. Never invent employers or projects not in the resume.
5) Motivation / why this company: 3\u20135 honest sentences tied to the job description and the candidate's background.
6) Salary / compensation: give a reasonable range note or "Open to discussion based on total compensation" if unknown.
7) Work authorization / notice period / relocation: answer honestly from the resume when possible; otherwise a clear placeholder the candidate can edit.
8) Never use em dashes; use commas.

Candidate identity:
Name: ${profile.fullName || "(from resume)"}
Email: ${profile.email || ""}
Phone: ${profile.phone || ""}
Location: ${profile.location || ""}
LinkedIn: ${profile.linkedin || ""}
Website: ${profile.website || ""}
Skills: ${(profile.skills || []).slice(0, 16).join(", ")}
Roles: ${profile.experiences.map((e) => `${e.title} at ${e.company}`).slice(0, 6).join("; ")}
Projects: ${(profile.projects || []).map((p) => p.name).slice(0, 6).join("; ")}

Job:
Title: ${job.title}
Company: ${job.company || "Unknown"}
Location: ${job.location}
Description:
${(job.description || "").slice(0, 1e4)}

Resume (source of truth):
${(resumeText || "Not provided").slice(0, 2e4)}

Cover letter:
${(coverLetterText || "Not provided").slice(0, 6e3)}

Questions JSON (return an answer for every id):
${JSON.stringify(
          prefilled.map((q) => ({
            id: q.id,
            label: q.label,
            type: q.type,
            required: q.required,
            options: q.options,
            helpText: q.helpText,
            section: q.section,
            suggestedAnswer: q.answer || void 0
          }))
        )}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: ANSWERS_SCHEMA,
          temperature: 0.35,
          maxOutputTokens: 12288
        }
      }),
      async () => {
        const parsed2 = await ollamaJsonPrompt({
          system: 'Answer every job application question honestly from the resume. Technical questions need concrete examples. Return JSON {"answers":[{"id","answer","notes"}]}.',
          user: `Job: ${job.title} at ${job.company || "Unknown"}
Description: ${(job.description || "").slice(0, 8e3)}
Resume: ${(resumeText || "Not provided").slice(0, 12e3)}
Cover letter: ${(coverLetterText || "Not provided").slice(0, 4e3)}
Profile: ${JSON.stringify({
            name: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            location: profile.location,
            skills: profile.skills,
            experiences: profile.experiences.slice(0, 4),
            projects: (profile.projects || []).slice(0, 4)
          })}
Questions: ${JSON.stringify(prefilled.map((q) => ({ id: q.id, label: q.label, type: q.type, options: q.options })))}`
        });
        return { text: JSON.stringify(parsed2) };
      }
    );
    const parsed = JSON.parse(response.text || '{"answers":[]}');
    const byId = new Map((parsed.answers || []).map((a) => [a.id, a]));
    const merged = prefilled.map((q) => {
      const hit = byId.get(q.id);
      const answer = ((hit == null ? void 0 : hit.answer) || q.answer || "").trim();
      return {
        ...q,
        answer,
        notes: (hit == null ? void 0 : hit.notes) || q.notes
      };
    });
    return autofillFromProfile(merged, profile, resumeText, { onlyEmpty: true });
  } catch (error) {
    console.warn(
      "Application answer generation failed \u2014 using profile autofill fallback:",
      formatGeminiError(error)
    );
    return buildFallbackAnswers(prefilled, job, profile, resumeText);
  }
}
function autofillFromProfile(questions, profile, resumeText, options) {
  const onlyEmpty = Boolean(options == null ? void 0 : options.onlyEmpty);
  return questions.map((q) => {
    var _a;
    if (onlyEmpty && ((_a = q.answer) == null ? void 0 : _a.trim())) return q;
    const label = `${q.label} ${q.helpText || ""} ${q.section || ""}`.toLowerCase();
    const kind = classifyField(label, q.type);
    let answer = q.answer || "";
    switch (kind) {
      case "fullName":
        answer = profile.fullName || answer;
        break;
      case "firstName":
        answer = profile.fullName.split(/\s+/)[0] || answer;
        break;
      case "lastName":
        answer = profile.fullName.split(/\s+/).slice(1).join(" ") || answer;
        break;
      case "email":
        answer = profile.email || answer;
        break;
      case "phone":
        answer = profile.phone || answer;
        break;
      case "location":
        answer = profile.location || answer;
        break;
      case "linkedin":
        answer = profile.linkedin || answer;
        break;
      case "website":
        answer = profile.website || profile.linkedin || answer;
        break;
      case "summary":
        answer = profile.summary || answer;
        break;
      case "skills":
        answer = profile.skills.join(", ") || answer;
        break;
      case "fileResume":
        answer = "Upload your tailored resume / CV PDF";
        break;
      case "fileCover":
        answer = "Upload your tailored cover letter PDF";
        break;
      case "booleanYes":
        answer = pickOption(q.options, ["yes", "true", "authorized", "willing"]) || "Yes";
        break;
      case "booleanNo":
        answer = pickOption(q.options, ["no", "false"]) || "No";
        break;
    }
    return { ...q, answer: answer || q.answer || "" };
  });
}
function buildFallbackAnswers(questions, job, profile, resumeText) {
  var _a;
  const filled = autofillFromProfile(questions, profile, resumeText, { onlyEmpty: false });
  const proof = profile.experiences[0] && `${profile.experiences[0].title} at ${profile.experiences[0].company}: ${(profile.experiences[0].bullets[0] || "").slice(0, 220)}`;
  const projectProof = ((_a = profile.projects) == null ? void 0 : _a[0]) && `${profile.projects[0].name}: ${(profile.projects[0].bullets[0] || "").slice(0, 180)}`;
  return filled.map((q) => {
    var _a2;
    if ((_a2 = q.answer) == null ? void 0 : _a2.trim()) return q;
    const label = q.label.toLowerCase();
    const isTechnical = /tech|stack|architect|system|design|coding|algorithm|cloud|kubernetes|api|database|experience|project|challenge|accomplish|skill|framework|language|devops|frontend|backend|full.?stack/i.test(
      label
    );
    if (isTechnical) {
      const parts = [
        proof ? `In my recent role as ${proof}` : null,
        projectProof ? `I also worked on ${projectProof}` : null,
        profile.skills.length ? `Relevant tools from my background include ${profile.skills.slice(0, 8).join(", ")}.` : null,
        `I am ready to apply this experience to the ${job.title} role at ${job.company || "your company"}.`
      ].filter(Boolean);
      return {
        ...q,
        answer: parts.join(" "),
        notes: "Fallback answer from your CV \u2014 edit before submitting."
      };
    }
    if (/why|motivat|interest|join|company|role|position/i.test(label)) {
      return {
        ...q,
        answer: `I am applying for the ${job.title} role because it aligns with my experience as ${profile.experiences[0] ? `${profile.experiences[0].title} at ${profile.experiences[0].company}` : "a software engineer"}. I want to contribute where ${profile.skills.slice(0, 4).join(", ") || "my stack"} can help ${job.company || "the team"} ship reliable product outcomes.`,
        notes: "Fallback motivation answer from your CV \u2014 edit before submitting."
      };
    }
    return {
      ...q,
      answer: q.answer || "",
      notes: q.notes || "Could not auto-answer this field \u2014 fill manually."
    };
  });
}
function classifyField(label, type) {
  if (type === "email" || /\bemail\b|e-mail/.test(label)) return "email";
  if (type === "url" && /linkedin/.test(label)) return "linkedin";
  if (/linkedin/.test(label)) return "linkedin";
  if (/portfolio|github|website|personal site|url/.test(label)) return "website";
  if (/\bphone\b|mobile|tel\b|whatsapp/.test(label)) return "phone";
  if (/first name|given name|vorname/.test(label)) return "firstName";
  if (/last name|surname|family name|nachname/.test(label)) return "lastName";
  if (/full name|^name$|legal name|candidate name|your name/.test(label) || /\bname\b/.test(label) && !/company|file|user/.test(label))
    return "fullName";
  if (/city|location|address|where do you (live|reside)|based in|country/.test(label)) return "location";
  if (/summary|about you|tell us about|bio|profile/.test(label) && type === "textarea") return "summary";
  if (/skills|technologies|tech stack|tools you/.test(label) && type !== "textarea") return "skills";
  if (type === "file" || /upload|attach/.test(label)) {
    if (/cover/.test(label)) return "fileCover";
    return "fileResume";
  }
  if (type === "boolean" || /authorized to work|work authorization|visa|sponsorship|willing to relocate|remote ok/.test(label)) {
    if (/sponsor|visa|require.*visa/.test(label) && /need|require|do you need/.test(label)) return "booleanNo";
    return "booleanYes";
  }
  return "other";
}
function pickOption(options, needles) {
  if (!(options == null ? void 0 : options.length)) return "";
  const lowerNeedles = needles.map((n) => n.toLowerCase());
  const hit = options.find((opt) => lowerNeedles.some((n) => opt.toLowerCase().includes(n)));
  return hit || "";
}
async function extractQuestionsFromHtml(ai, models, html, job, url) {
  const response = await generateWithModels(
    ai,
    models,
    (model) => ai.models.generateContent({
      model,
      contents: `Extract EVERY application form field / screening question from this careers application HTML.
Include personal fields (name, email, phone, LinkedIn, portfolio), demographic/EEO if present, and especially technical or open-ended questions.
Use stable ids like html-1, html-2.
Ignore cookie banners and navigation.
Job: ${job.title} at ${job.company || "unknown"} \u2014 ${url}

HTML:
${html.slice(0, 9e4)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: QUESTIONS_SCHEMA
      }
    }),
    async () => {
      const parsed2 = await ollamaJsonPrompt({
        system: 'Extract application form questions from HTML. Return JSON {"title","notes","questions":[{"id","label","type","required","options","helpText","section"}]}.',
        user: `Job: ${job.title} at ${job.company || "unknown"} \u2014 ${url}

HTML:
${html.slice(0, 5e4)}`
      });
      return { text: JSON.stringify(parsed2) };
    }
  );
  const parsed = JSON.parse(response.text || '{"questions":[]}');
  return {
    title: parsed.title,
    notes: parsed.notes,
    questions: normalizeQuestions(parsed.questions || [], "html")
  };
}
async function inferQuestionsFromJob(ai, models, job) {
  const response = await generateWithModels(
    ai,
    models,
    (model) => ai.models.generateContent({
      model,
      contents: `The application form HTML was incomplete or JavaScript-rendered.
Infer the likely application / screening questions a candidate will see for this role on a modern ATS (Greenhouse, Lever, Workday, Ashby).
Include:
- standard contact fields (full name, email, phone, location, LinkedIn, portfolio/GitHub)
- resume/cover letter uploads
- work authorization / relocation if relevant
- 5\u201310 technical or role-specific screening questions grounded in the job description (stack, systems, past projects, debugging, collaboration)
Use ids like inferred-1, inferred-2.

Job:
Title: ${job.title}
Company: ${job.company || "Unknown"}
Location: ${job.location}
URL: ${job.url}
Description:
${(job.description || "").slice(0, 12e3)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: QUESTIONS_SCHEMA
      }
    }),
    async () => {
      const parsed2 = await ollamaJsonPrompt({
        system: 'Infer ATS application questions for a role. Return JSON {"notes","questions":[{"id","label","type","required","options","section"}]}.',
        user: `Title: ${job.title}
Company: ${job.company || "Unknown"}
Location: ${job.location}
URL: ${job.url}
Description:
${(job.description || "").slice(0, 8e3)}`
      });
      return { text: JSON.stringify(parsed2) };
    }
  );
  const parsed = JSON.parse(response.text || '{"questions":[]}');
  return {
    notes: parsed.notes || "Some questions were inferred because the live form may be JavaScript-rendered. Verify against the company site before submitting.",
    questions: normalizeQuestions(parsed.questions || [], "inferred")
  };
}
function normalizeQuestions(questions, prefix) {
  return questions.filter((q) => {
    var _a;
    return (_a = q == null ? void 0 : q.label) == null ? void 0 : _a.trim();
  }).map((q, i) => ({
    id: String(q.id || `${prefix}-${i + 1}`),
    label: String(q.label).trim(),
    type: q.type || "textarea",
    required: !!q.required,
    options: Array.isArray(q.options) ? q.options.map(String).filter(Boolean) : void 0,
    helpText: q.helpText ? String(q.helpText) : void 0,
    section: q.section ? String(q.section) : void 0,
    answer: ""
  }));
}

const NUXT_MIGRATIONS = [
  {
    id: "001_initial.sql",
    sql: `-- 001_initial: baseline JobFlow schema (idempotent)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  final_url TEXT,
  used_search BOOLEAN NOT NULL DEFAULT FALSE,
  source_status TEXT,
  job_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrape_run_id UUID REFERENCES scrape_runs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT NOT NULL DEFAULT 'Unknown',
  salary_min NUMERIC,
  salary_max NUMERIC,
  currency TEXT,
  url TEXT NOT NULL,
  description TEXT,
  description_source TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS jobs_url_unique ON jobs (url);

CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type TEXT NOT NULL CHECK (doc_type IN ('resume', 'cover_letter')),
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  content_text TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_documents_type_idx
  ON user_documents (doc_type, updated_at DESC);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro')),
  credits_remaining INTEGER NOT NULL DEFAULT 10,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Heal older DBs that created users before role existed (must run before role index/constraint)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_stripe_customer_idx ON users (stripe_customer_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS credit_ledger_user_idx
  ON credit_ledger (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_slug TEXT NOT NULL,
  profile_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portfolios_user_idx
  ON portfolios (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS portfolio_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  body TEXT NOT NULL,
  delivered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portfolio_messages_portfolio_idx
  ON portfolio_messages (portfolio_id, created_at DESC);
`
  },
  {
    id: "002_jobs_user_id.sql",
    sql: `-- Tie scraped jobs (and scrape runs) to the logged-in user.
-- Unique URL is per-user so two accounts can scrape the same listing.

ALTER TABLE scrape_runs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS scrape_runs_user_idx
  ON scrape_runs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS jobs_user_idx
  ON jobs (user_id, updated_at DESC);

-- Replace global URL uniqueness with per-user uniqueness.
DROP INDEX IF EXISTS jobs_url_unique;

-- Orphan rows (pre-migration) cannot satisfy a NOT NULL + unique constraint;
-- remove them so every remaining job belongs to a user going forward.
DELETE FROM jobs WHERE user_id IS NULL;
DELETE FROM scrape_runs WHERE user_id IS NULL;

ALTER TABLE jobs
  ALTER COLUMN user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS jobs_user_url_unique
  ON jobs (user_id, url);
`
  }
];

function checksum(sql) {
  return createHash("sha256").update(sql, "utf8").digest("hex");
}
async function migrate(client) {
  const migrations = [...NUXT_MIGRATIONS].sort((a, b) => a.id.localeCompare(b.id));
  if (!migrations.length) {
    throw new Error("No Nuxt migrations embedded. Run: node scripts/embed-migrations.cjs");
  }
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const existing = await client.query(
    `SELECT id, checksum FROM schema_migrations`
  );
  const applied = new Map(existing.rows.map((row) => [row.id, row.checksum]));
  const appliedNow = [];
  for (const { id: migrationId, sql } of migrations) {
    const digest = checksum(sql);
    if (applied.has(migrationId)) {
      if (applied.get(migrationId) !== digest) {
        console.warn(
          `[migrate] ${migrationId} checksum changed after apply. Add a new numbered migration instead of editing applied files.`
        );
      }
      continue;
    }
    console.info(`[migrate] Applying ${migrationId}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO schema_migrations (id, checksum)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = NOW()`,
        [migrationId, digest]
      );
      await client.query("COMMIT");
      appliedNow.push(migrationId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
  if (appliedNow.length) {
    console.info(`[migrate] Applied: ${appliedNow.join(", ")}`);
  }
  return appliedNow;
}

const { Pool } = pg;
const FREE_CREDITS = 10;
const PRO_CREDITS = 150;
let pool = null;
let schemaReady = false;
function getPool() {
  if (!pool) {
    const config = useRuntimeConfig();
    let connectionString = String(config.databaseUrl || process.env.DATABASE_URL || "").replace(/([?&])channel_binding=require&?/gi, "$1").replace(/[?&]$/, "");
    if (!connectionString) {
      throw createError$1({
        statusCode: 503,
        statusMessage: "DATABASE_URL is not configured"
      });
    }
    const needsSsl = /sslmode=require/i.test(connectionString) || /neon\.tech/i.test(connectionString) || process.env.NETLIFY === "true";
    pool = new Pool({
      connectionString,
      // Neon cold start from Netlify can exceed 3s
      connectionTimeoutMillis: 15e3,
      max: 3,
      min: 0,
      idleTimeoutMillis: 5e3,
      allowExitOnIdle: true,
      ssl: needsSsl ? { rejectUnauthorized: false } : void 0
    });
  }
  return pool;
}
async function ensureSchema() {
  if (schemaReady) return;
  const client = await getPool().connect();
  try {
    await migrate(client);
    schemaReady = true;
  } catch (error) {
    console.error("[ensureSchema] migration failed:", error);
    throw createError$1({
      statusCode: 503,
      statusMessage: error instanceof Error ? `Database schema unavailable: ${error.message}` : "Database schema unavailable"
    });
  } finally {
    client.release();
  }
}
async function query(text, params) {
  await ensureSchema();
  return getPool().query(text, params);
}
function isDatabaseError(error) {
  if (!error || typeof error !== "object") return false;
  const code = error.code;
  return code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT" || code === "57P01" || code === "3D000";
}
function mapUser(row) {
  var _a;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    planTier: row.plan_tier === "pro" ? "pro" : "free",
    role: row.role === "admin" ? "admin" : "user",
    creditsRemaining: Number((_a = row.credits_remaining) != null ? _a : 0),
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function isAdminEmail(email) {
  const config = useRuntimeConfig();
  const raw = String(config.adminEmails || "");
  if (!raw.trim()) return false;
  const allowed = raw.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.toLowerCase().trim());
}
async function getUserById(id) {
  const result = await query(`SELECT * FROM users WHERE id = $1`, [id]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}
async function getUserByEmail(email) {
  const result = await query(`SELECT * FROM users WHERE email = $1`, [
    email.toLowerCase().trim()
  ]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}
async function getUserByStripeCustomerId(customerId) {
  const result = await query(`SELECT * FROM users WHERE stripe_customer_id = $1`, [
    customerId
  ]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}
async function createUser(input) {
  var _a;
  const email = input.email.toLowerCase().trim();
  const role = input.role || (isAdminEmail(email) ? "admin" : "user");
  const result = await query(
    `INSERT INTO users (email, password_hash, plan_tier, role, credits_remaining)
     VALUES ($1, $2, 'free', $3, $4)
     RETURNING *`,
    [email, input.passwordHash, role, (_a = input.creditsRemaining) != null ? _a : FREE_CREDITS]
  );
  return mapUser(result.rows[0]);
}
async function setUserRole(userId, role) {
  const result = await query(
    `UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [userId, role]
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}
async function syncAdminRole(user) {
  if (user.role === "admin") return user;
  if (!isAdminEmail(user.email)) return user;
  const updated = await setUserRole(user.id, "admin");
  return updated || user;
}
async function syncProCredits(user) {
  if (user.planTier !== "pro") return user;
  if (user.creditsRemaining >= PRO_CREDITS) return user;
  const needsHeal = user.creditsRemaining <= 0 || !user.stripeCustomerId && user.creditsRemaining <= FREE_CREDITS;
  if (!needsHeal) return user;
  const updated = await setPlanAndCredits(user.id, "pro", PRO_CREDITS, "pro_credits_heal");
  return updated || user;
}
async function getCreditsRemaining(userId) {
  var _a, _b;
  const result = await query(
    `SELECT credits_remaining FROM users WHERE id = $1`,
    [userId]
  );
  return (_b = (_a = result.rows[0]) == null ? void 0 : _a.credits_remaining) != null ? _b : 0;
}
async function decrementCreditAtomic(userId, cost = 1, reason = "ai_usage") {
  const client = await getPool().connect();
  try {
    await ensureSchema();
    await client.query("BEGIN");
    const updated = await client.query(
      `UPDATE users
       SET credits_remaining = credits_remaining - $2,
           updated_at = NOW()
       WHERE id = $1 AND credits_remaining >= $2
       RETURNING *`,
      [userId, cost]
    );
    if (!updated.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query(
      `INSERT INTO credit_ledger (user_id, delta, reason) VALUES ($1, $2, $3)`,
      [userId, -cost, reason]
    );
    await client.query("COMMIT");
    const mapped = mapUser(updated.rows[0]);
    try {
      const { invalidateAuthUserCache } = await Promise.resolve().then(function () { return auth; });
      invalidateAuthUserCache(userId);
    } catch {
    }
    return mapped;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function setPlanAndCredits(userId, planTier, credits, reason) {
  const client = await getPool().connect();
  try {
    await ensureSchema();
    await client.query("BEGIN");
    const current = await client.query(
      `SELECT credits_remaining FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    if (!current.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    const prev = current.rows[0].credits_remaining;
    const updated = await client.query(
      `UPDATE users
       SET plan_tier = $2,
           credits_remaining = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, planTier, credits]
    );
    await client.query(
      `INSERT INTO credit_ledger (user_id, delta, reason) VALUES ($1, $2, $3)`,
      [userId, credits - prev, reason]
    );
    await client.query("COMMIT");
    try {
      const { invalidateAuthUserCache } = await Promise.resolve().then(function () { return auth; });
      invalidateAuthUserCache(userId);
    } catch {
    }
    return mapUser(updated.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function setStripeCustomerId(userId, customerId) {
  await query(
    `UPDATE users SET stripe_customer_id = $2, updated_at = NOW() WHERE id = $1`,
    [userId, customerId]
  );
}
async function setStripeSubscriptionId(userId, subscriptionId) {
  await query(
    `UPDATE users SET stripe_subscription_id = $2, updated_at = NOW() WHERE id = $1`,
    [userId, subscriptionId]
  );
}
function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    planTier: user.planTier,
    role: user.role,
    creditsRemaining: user.creditsRemaining
  };
}

const USER_CACHE_TTL_MS = 2e4;
const userCache = /* @__PURE__ */ new Map();
function invalidateAuthUserCache(userId) {
  if (!userId) {
    userCache.clear();
    return;
  }
  userCache.delete(userId);
}
function cacheUser(user) {
  userCache.set(user.id, { user, expires: Date.now() + USER_CACHE_TTL_MS });
  return user;
}
function getCachedUser(userId) {
  const hit = userCache.get(userId);
  if (!hit) return null;
  if (Date.now() >= hit.expires) {
    userCache.delete(userId);
    return null;
  }
  return hit.user;
}
async function getSessionUser(event) {
  const session = await getUserSession(event);
  const user = session == null ? void 0 : session.user;
  if (!(user == null ? void 0 : user.id) || !(user == null ? void 0 : user.email)) return null;
  return user;
}
async function getFastapiSessionUser(event) {
  var _a, _b;
  const cookie = getCookie(event, "jobflow_session");
  if (!cookie) return null;
  const config = useRuntimeConfig();
  const target = String(config.apiProxyTarget || process.env.NUXT_API_PROXY_TARGET || "http://127.0.0.1:8000").replace(
    /\/$/,
    ""
  );
  const cookieHeader = getRequestHeader(event, "cookie") || `jobflow_session=${cookie}`;
  try {
    const me = await $fetch(`${target}/api/auth/me`, {
      headers: { cookie: cookieHeader }
    });
    if (!((_a = me == null ? void 0 : me.user) == null ? void 0 : _a.id) || !((_b = me == null ? void 0 : me.user) == null ? void 0 : _b.email)) return null;
    return { id: me.user.id, email: me.user.email };
  } catch {
    return null;
  }
}
async function requireUser(event) {
  let sessionUser = await getSessionUser(event);
  if (!sessionUser) {
    sessionUser = await getFastapiSessionUser(event);
  }
  if (!sessionUser) {
    throw createError$1({ statusCode: 401, statusMessage: "Authentication required" });
  }
  let user = getCachedUser(sessionUser.id);
  if (!user) {
    user = await getUserById(sessionUser.id);
    if (!user) {
      await clearUserSession(event).catch(() => void 0);
      throw createError$1({ statusCode: 401, statusMessage: "Authentication required" });
    }
    user = await syncAdminRole(user);
    user = await syncProCredits(user);
    cacheUser(user);
  }
  event.context.user = user;
  return user;
}
async function requireAdmin(event) {
  const user = await requireUser(event);
  if (user.role !== "admin") {
    throw createError$1({ statusCode: 403, statusMessage: "Admin access required" });
  }
  return user;
}
async function setAuthSession(event, user) {
  cacheUser(user);
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email
    }
  });
  return toPublicUser(user);
}

const auth = /*#__PURE__*/Object.freeze({
  __proto__: null,
  getSessionUser: getSessionUser,
  invalidateAuthUserCache: invalidateAuthUserCache,
  requireAdmin: requireAdmin,
  requireUser: requireUser,
  setAuthSession: setAuthSession
});

const MODEL_PDF_TAILOR = "gemini-3.1-pro-preview";
const MODEL_FLASH_LITE = "gemini-3.1-pro-preview";
const DOCUMENTS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    resume: {
      type: Type.STRING,
      description: "Complete tailored resume in Markdown including ALL work roles and ALL projects from the source"
    },
    coverLetter: {
      type: Type.STRING,
      description: "Tailored cover letter in Markdown grounded in the source resume"
    }
  },
  required: ["resume", "coverLetter"]
};
const JOB_SIGNALS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    company: { type: Type.STRING },
    requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    preferredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
    seniority: { type: Type.STRING },
    tone: { type: Type.STRING }
  },
  required: ["title", "requiredSkills", "keywords", "responsibilities"]
};
function createDocumentAiClient(apiKey) {
  if (!apiKey) {
    throw createError$1({
      statusCode: 500,
      statusMessage: "GEMINI_API_KEY is missing. Add it to .env and restart the server."
    });
  }
  if (apiKey.startsWith("ya29.")) {
    throw createError$1({
      statusCode: 500,
      statusMessage: "GEMINI_API_KEY appears to be an OAuth access token. Use an AI Studio API key instead."
    });
  }
  return new GoogleGenAI({ apiKey });
}
async function generateFromPdfResume(input) {
  var _a;
  const prompt = `You are an expert resume and cover-letter writer.

Compare the attached PDF resume${input.coverLetterPdfBuffer ? " and cover letter PDF" : ""} with the target job description.
Produce a RICH, complete Markdown resume and a tailored Markdown cover letter.

CRITICAL completeness rules (do not skip):
- Include EVERY work experience / employment role from the source resume. Do not drop older jobs.
- Include EVERY project from the source resume (create a ## Projects section if any projects exist).
- Keep education, certifications, skills, languages, and awards from the source.
- Reorder or rephrase bullets to match the job, but do not omit roles or projects.
- For each role: keep company, title, dates/location, and 3\u20136 Markdown bullets starting with "- ".
- For each project: name + 2\u20134 bullets of what was built and impact.
- Preserve the candidate's real name, email, phone, location, LinkedIn from the PDF. Never invent sample names.
- Cover letter: 4\u20135 human paragraphs grounded in specific roles/projects from the resume. Avoid robotic AI words (delve, testament, leverage, passionate, synergy, cutting-edge, thrilled, seamlessly).
- Never use em dashes; use commas.
- Do not fabricate employers, degrees, or metrics not supported by the source.
- Return JSON only with keys resume and coverLetter.

Target job description:
${input.jobDescription.slice(0, 14e3)}`;
  const contents = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "application/pdf",
        data: input.pdfBuffer.toString("base64")
      }
    }
  ];
  if ((_a = input.coverLetterPdfBuffer) == null ? void 0 : _a.length) {
    contents.push({
      text: "Additional source: the candidate's existing cover letter PDF (adapt tone and reuse truthful claims; do not invent)."
    });
    contents.push({
      inlineData: {
        mimeType: "application/pdf",
        data: input.coverLetterPdfBuffer.toString("base64")
      }
    });
  }
  try {
    const response = await input.ai.models.generateContent({
      model: MODEL_PDF_TAILOR,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: DOCUMENTS_SCHEMA,
        temperature: 0.3,
        maxOutputTokens: 16384
      }
    });
    return parseDocumentPair(response.text || "{}");
  } catch (error) {
    throw createError$1({
      statusCode: 502,
      statusMessage: `PDF document generation failed: ${formatGeminiError(error)}`
    });
  }
}
async function generateFromJobDescriptionOnly(input) {
  let signals;
  try {
    const response = await input.ai.models.generateContent({
      model: MODEL_FLASH_LITE,
      contents: `Analyze this job description. Return JSON with:
title, company, requiredSkills (array), preferredSkills (array), keywords (array),
responsibilities (array of concrete duties), seniority, tone.

Job description:
${input.jobDescription.slice(0, 12e3)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: JOB_SIGNALS_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    });
    signals = normalizeSignals(JSON.parse(response.text || "{}"));
  } catch (error) {
    throw createError$1({
      statusCode: 502,
      statusMessage: `Job analysis failed: ${formatGeminiError(error)}`
    });
  }
  const placeholderProfile = {
    fullName: "[Your Full Name]",
    email: "[your.email@example.com]",
    phone: "[Your Phone]",
    location: "[City, Country]",
    linkedin: "[linkedin.com/in/you]",
    website: "",
    summary: "",
    skills: unique([
      ...signals.requiredSkills,
      ...signals.preferredSkills,
      ...signals.keywords
    ]).slice(0, 12),
    experiences: [
      {
        company: "[Most Recent Company]",
        title: signals.title || "[Your Title]",
        location: "[City]",
        startDate: "20XX",
        endDate: "Present",
        bullets: (signals.responsibilities.length ? signals.responsibilities : [
          "Delivered scoped releases on a two-week cadence with clear owners and success metrics",
          "Improved a core workflow that reduced handoff delays by roughly 25%",
          "Partnered with design and stakeholders to ship features used by thousands of weekly users"
        ]).slice(0, 5).map((item) => item.replace(/^[-*•]\s*/, ""))
      },
      {
        company: "[Earlier Company]",
        title: "[Earlier Role]",
        location: "[City]",
        startDate: "20XX",
        endDate: "20XX",
        bullets: [
          "Owned end-to-end delivery for a customer-facing initiative with measurable outcomes",
          "Wrote clear docs and runbooks that shortened onboarding for new teammates"
        ]
      }
    ],
    education: "### [Degree], [Field], [University]\n*[City] \xB7 [Year]*"
  };
  const analysis = {
    title: signals.title,
    company: signals.company || "Hiring Company",
    keywords: signals.keywords,
    requiredSkills: signals.requiredSkills,
    preferredSkills: signals.preferredSkills,
    responsibilities: signals.responsibilities,
    tone: signals.tone || "professional, direct, metrics-focused",
    seniority: signals.seniority || "mid-level"
  };
  const resume = enforceExperienceBullets(
    replaceEmDashes(buildProfessionalResumeSample(analysis, "classic-professional", placeholderProfile))
  );
  const coverLetter = replaceEmDashes(
    buildProfessionalCoverLetterSample(analysis, "classic-professional", placeholderProfile)
  );
  return { resume, coverLetter };
}
function parseDocumentPair(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (!(fenced == null ? void 0 : fenced[1])) {
      throw createError$1({
        statusCode: 502,
        statusMessage: "Model returned invalid JSON for resume/cover letter."
      });
    }
    parsed = JSON.parse(fenced[1].trim());
  }
  const resume = replaceEmDashes(String(parsed.resume || "").trim());
  const coverLetter = replaceEmDashes(String(parsed.coverLetter || "").trim());
  if (!resume || !coverLetter) {
    throw createError$1({
      statusCode: 502,
      statusMessage: "Model response missing resume or coverLetter fields."
    });
  }
  return {
    resume: enforceExperienceBullets(resume),
    coverLetter
  };
}
function normalizeSignals(raw) {
  const asList = (value) => Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];
  return {
    title: String(raw.title || "Target Role").trim() || "Target Role",
    company: String(raw.company || "Hiring Company").trim() || "Hiring Company",
    requiredSkills: asList(raw.requiredSkills),
    preferredSkills: asList(raw.preferredSkills),
    keywords: asList(raw.keywords),
    responsibilities: asList(raw.responsibilities),
    seniority: String(raw.seniority || "mid-level").trim(),
    tone: String(raw.tone || "professional").trim()
  };
}
function unique(values) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!value.trim() || seen.has(key)) continue;
    seen.add(key);
    out.push(value.trim());
  }
  return out;
}

const ALLOWED_MIME = /* @__PURE__ */ new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown"
]);
const DATA_DIR = path.join(process.cwd(), ".data");
const DOCS_META_PATH = path.join(DATA_DIR, "documents.json");
async function extractTextFromUpload(buffer, mimeType, filename) {
  const lower = filename.toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    const pdfParse = await loadPdfParse();
    const parsed = await pdfParse(buffer);
    return cleanExtractedText(parsed.text || "");
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return cleanExtractedText(result.value);
  }
  if (mimeType.startsWith("text/") || lower.endsWith(".txt") || lower.endsWith(".md")) {
    return cleanExtractedText(buffer.toString("utf8"));
  }
  throw createError$1({
    statusCode: 400,
    statusMessage: "Unsupported file type. Upload PDF, DOCX, or TXT."
  });
}
function assertAllowedUpload(mimeType, filename) {
  const lower = filename.toLowerCase();
  const ok = ALLOWED_MIME.has(mimeType) || lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".txt") || lower.endsWith(".md");
  if (!ok) {
    throw createError$1({
      statusCode: 400,
      statusMessage: "Unsupported file type. Upload PDF, DOCX, or TXT."
    });
  }
}
async function saveUserDocument(input) {
  const uploadsDir = path.join(process.cwd(), "uploads", input.docType);
  await mkdir(uploadsDir, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });
  const safeName = input.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = path.join(uploadsDir, `${Date.now()}-${safeName}`);
  await writeFile$1(storagePath, input.buffer);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const localDoc = {
    id: crypto.randomUUID(),
    docType: input.docType,
    originalName: input.originalName,
    mimeType: input.mimeType,
    contentText: input.contentText,
    storagePath,
    createdAt: now,
    updatedAt: now
  };
  await saveLocalDocument(localDoc);
  try {
    const result = await query(
      `INSERT INTO user_documents (doc_type, original_name, mime_type, content_text, storage_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.docType,
        input.originalName,
        input.mimeType,
        input.contentText,
        storagePath
      ]
    );
    return mapDocument(result.rows[0]);
  } catch (error) {
    console.warn(
      "Postgres unavailable \u2014 document saved locally only:",
      error instanceof Error ? error.message : error
    );
    return localDoc;
  }
}
async function getLatestDocuments() {
  try {
    const result = await query(
      `SELECT DISTINCT ON (doc_type) *
       FROM user_documents
       ORDER BY doc_type, updated_at DESC`
    );
    const docs = result.rows.map(mapDocument);
    return {
      resume: docs.find((d) => d.docType === "resume") || null,
      coverLetter: docs.find((d) => d.docType === "cover_letter") || null
    };
  } catch (error) {
    console.warn(
      "Postgres unavailable \u2014 loading documents from local store:",
      error instanceof Error ? error.message : error
    );
    return loadLocalDocuments();
  }
}
async function saveLocalDocument(doc) {
  const current = await loadLocalDocuments();
  const next = {
    resume: doc.docType === "resume" ? doc : current.resume,
    coverLetter: doc.docType === "cover_letter" ? doc : current.coverLetter
  };
  await writeFile$1(DOCS_META_PATH, JSON.stringify(next, null, 2), "utf8");
}
async function deleteUserDocument(docType) {
  const current = await loadLocalDocuments();
  const existing = docType === "resume" ? current.resume : current.coverLetter;
  const next = {
    resume: docType === "resume" ? null : current.resume,
    coverLetter: docType === "cover_letter" ? null : current.coverLetter
  };
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile$1(DOCS_META_PATH, JSON.stringify(next, null, 2), "utf8");
  try {
    await query(`DELETE FROM user_documents WHERE doc_type = $1`, [docType]);
  } catch (error) {
    console.warn(
      "Postgres unavailable \u2014 document removed from local store only:",
      error instanceof Error ? error.message : error
    );
  }
  return { removed: Boolean(existing), docType };
}
async function loadLocalDocuments() {
  try {
    const raw = await readFile$1(DOCS_META_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      resume: parsed.resume || null,
      coverLetter: parsed.coverLetter || null
    };
  } catch {
    return { resume: null, coverLetter: null };
  }
}
async function loadPdfParse() {
  const mod = await import('pdf-parse');
  const pdfParse = mod.default || mod;
  return pdfParse;
}
function mapDocument(row) {
  return {
    id: row.id,
    docType: row.doc_type,
    originalName: row.original_name,
    mimeType: row.mime_type,
    contentText: row.content_text,
    storagePath: row.storage_path || void 0,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}
function cleanExtractedText(text) {
  return text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

async function sendEmail(input) {
  const config = useRuntimeConfig();
  const apiKey = config.resendApiKey || process.env.RESEND_API_KEY;
  const from = config.contactFromEmail || process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn("[email] RESEND_API_KEY / CONTACT_FROM_EMAIL not set \u2014 email not sent");
    return { sent: false, reason: "email_not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...input.replyTo ? { reply_to: input.replyTo } : {}
      })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(`[email] Resend failed (${res.status}): ${detail.slice(0, 300)}`);
      return { sent: false, reason: `provider_error_${res.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.warn("[email] send threw:", error instanceof Error ? error.message : error);
    return { sent: false, reason: "network_error" };
  }
}

const DESCRIPTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: "The complete job description copied from the page: responsibilities, requirements, benefits, and other posted details. Preserve structure with newlines."
    },
    title: { type: Type.STRING },
    location: { type: Type.STRING },
    company: { type: Type.STRING },
    salaryMin: { type: Type.NUMBER },
    salaryMax: { type: Type.NUMBER },
    currency: { type: Type.STRING }
  },
  required: ["description"]
};
const MAX_DETAIL_PAGES = 12;
const CONCURRENCY = 3;
async function enrichJobsWithFullDescriptions(ai, models, jobs, listingUrl) {
  const targets = jobs.slice(0, MAX_DETAIL_PAGES);
  const enriched = [];
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((job) => enrichSingleJob(ai, models, job, listingUrl))
    );
    enriched.push(...results);
  }
  if (jobs.length > MAX_DETAIL_PAGES) {
    enriched.push(
      ...jobs.slice(MAX_DETAIL_PAGES).map((job) => ({
        ...job,
        descriptionSource: job.description ? "listing" : void 0
      }))
    );
  }
  return enriched;
}
async function enrichSingleJob(ai, models, job, listingUrl) {
  var _a, _b, _c, _d, _e, _f;
  if (!job.url || job.url === listingUrl) {
    return {
      ...job,
      descriptionSource: job.description ? "listing" : void 0
    };
  }
  try {
    const { html, isError, status } = await fetchPageHtml(job.url);
    if (isError || status >= 400 || !html) {
      return {
        ...job,
        descriptionSource: job.description ? "listing" : void 0
      };
    }
    const cleaned = cleanHtmlForExtraction(html, job.url);
    if (cleaned.length < 200) {
      return {
        ...job,
        descriptionSource: job.description ? "listing" : void 0
      };
    }
    const details = await extractFullDescription(ai, models, cleaned, job);
    const description = ((_a = details.description) == null ? void 0 : _a.trim()) || job.description;
    return {
      ...job,
      title: ((_b = details.title) == null ? void 0 : _b.trim()) || job.title,
      company: ((_c = details.company) == null ? void 0 : _c.trim()) || job.company,
      location: ((_d = details.location) == null ? void 0 : _d.trim()) || job.location,
      salaryMin: (_e = details.salaryMin) != null ? _e : job.salaryMin,
      salaryMax: (_f = details.salaryMax) != null ? _f : job.salaryMax,
      currency: details.currency || job.currency,
      description,
      descriptionSource: description ? "detail_page" : job.description ? "listing" : void 0
    };
  } catch (error) {
    console.warn(`Failed to enrich ${job.url}:`, formatGeminiError(error));
    return {
      ...job,
      descriptionSource: job.description ? "listing" : void 0
    };
  }
}
async function extractFullDescription(ai, models, html, job) {
  const response = await generateWithModels(
    ai,
    models,
    (model) => ai.models.generateContent({
      model,
      contents: `Extract the FULL job posting content from this HTML for the role "${job.title}".
Include the complete description as it appears on the careers page: about the role, responsibilities, qualifications/requirements, preferred skills, benefits, and any other posted sections.
Do not summarize. Preserve readable paragraph breaks.
If salary is present, include numeric salaryMin/salaryMax and currency.

HTML:
${html.slice(0, 9e4)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: DESCRIPTION_SCHEMA
      }
    }),
    async () => {
      const parsed = await ollamaJsonPrompt({
        system: "Extract the full job description from HTML. Return JSON with description, title, location, company, salaryMin, salaryMax, currency.",
        user: `Role: ${job.title}

HTML:
${html.slice(0, 5e4)}`
      });
      return { text: JSON.stringify(parsed) };
    }
  );
  return JSON.parse(response.text || "{}");
}

async function createScrapeRun(input) {
  const result = await query(
    `INSERT INTO scrape_runs (user_id, source_url, final_url, used_search, source_status, job_count)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      input.userId,
      input.sourceUrl,
      input.finalUrl,
      input.usedSearch,
      input.sourceStatus,
      input.jobCount
    ]
  );
  return result.rows[0].id;
}
async function upsertJobs(jobs, scrapeRunId, sourceUrl, userId) {
  var _a, _b;
  const saved = [];
  for (const job of jobs) {
    const result = await query(
      `INSERT INTO jobs (
         user_id, scrape_run_id, title, company, location, salary_min, salary_max,
         currency, url, description, description_source, source_url, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW())
       ON CONFLICT (user_id, url) DO UPDATE SET
         scrape_run_id = EXCLUDED.scrape_run_id,
         title = EXCLUDED.title,
         company = COALESCE(EXCLUDED.company, jobs.company),
         location = EXCLUDED.location,
         salary_min = COALESCE(EXCLUDED.salary_min, jobs.salary_min),
         salary_max = COALESCE(EXCLUDED.salary_max, jobs.salary_max),
         currency = COALESCE(EXCLUDED.currency, jobs.currency),
         description = CASE
           WHEN EXCLUDED.description IS NOT NULL AND LENGTH(EXCLUDED.description) >= COALESCE(LENGTH(jobs.description), 0)
           THEN EXCLUDED.description
           ELSE COALESCE(jobs.description, EXCLUDED.description)
         END,
         description_source = COALESCE(EXCLUDED.description_source, jobs.description_source),
         source_url = EXCLUDED.source_url,
         updated_at = NOW()
       RETURNING *`,
      [
        userId,
        scrapeRunId,
        job.title,
        job.company || null,
        job.location,
        (_a = job.salaryMin) != null ? _a : null,
        (_b = job.salaryMax) != null ? _b : null,
        job.currency || null,
        job.url,
        job.description || null,
        job.descriptionSource || null,
        sourceUrl
      ]
    );
    const row = result.rows[0];
    saved.push(mapJobRow(row));
  }
  return saved;
}
async function listRecentJobs(userId, limit = 100) {
  const result = await query(
    `SELECT * FROM jobs
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows.map(mapJobRow);
}
async function getJobById(id, userId) {
  const result = await query(`SELECT * FROM jobs WHERE id = $1 AND user_id = $2`, [id, userId]);
  return result.rows[0] ? mapJobRow(result.rows[0]) : null;
}
async function deleteJob(input) {
  if (input.id) {
    const result = await query(`DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING id`, [
      input.id,
      input.userId
    ]);
    return (result.rowCount || 0) > 0;
  }
  if (input.url) {
    const result = await query(`DELETE FROM jobs WHERE url = $1 AND user_id = $2 RETURNING id`, [
      input.url,
      input.userId
    ]);
    return (result.rowCount || 0) > 0;
  }
  return false;
}
function mapJobRow(row) {
  return {
    id: row.id,
    userId: row.user_id || void 0,
    title: row.title,
    company: row.company || void 0,
    location: row.location,
    salaryMin: row.salary_min ? Number(row.salary_min) : void 0,
    salaryMax: row.salary_max ? Number(row.salary_max) : void 0,
    currency: row.currency || void 0,
    url: row.url,
    description: row.description || void 0,
    descriptionSource: row.description_source || void 0,
    sourceUrl: row.source_url || void 0,
    scrapeRunId: row.scrape_run_id || void 0
  };
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var react = {exports: {}};

var react_production = {};

/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"),
  REACT_PORTAL_TYPE = Symbol.for("react.portal"),
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
  REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"),
  REACT_PROFILER_TYPE = Symbol.for("react.profiler"),
  REACT_CONSUMER_TYPE = Symbol.for("react.consumer"),
  REACT_CONTEXT_TYPE = Symbol.for("react.context"),
  REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"),
  REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"),
  REACT_MEMO_TYPE = Symbol.for("react.memo"),
  REACT_LAZY_TYPE = Symbol.for("react.lazy"),
  REACT_ACTIVITY_TYPE = Symbol.for("react.activity"),
  MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
function getIteratorFn(maybeIterable) {
  if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
  maybeIterable =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable["@@iterator"];
  return "function" === typeof maybeIterable ? maybeIterable : null;
}
var ReactNoopUpdateQueue = {
    isMounted: function () {
      return false;
    },
    enqueueForceUpdate: function () {},
    enqueueReplaceState: function () {},
    enqueueSetState: function () {}
  },
  assign = Object.assign,
  emptyObject = {};
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}
Component.prototype.isReactComponent = {};
Component.prototype.setState = function (partialState, callback) {
  if (
    "object" !== typeof partialState &&
    "function" !== typeof partialState &&
    null != partialState
  )
    throw Error(
      "takes an object of state variables to update or a function which returns an object of state variables."
    );
  this.updater.enqueueSetState(this, partialState, callback, "setState");
};
Component.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
};
function ComponentDummy() {}
ComponentDummy.prototype = Component.prototype;
function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}
var pureComponentPrototype = (PureComponent.prototype = new ComponentDummy());
pureComponentPrototype.constructor = PureComponent;
assign(pureComponentPrototype, Component.prototype);
pureComponentPrototype.isPureReactComponent = true;
var isArrayImpl = Array.isArray;
function noop() {}
var ReactSharedInternals = { H: null, A: null, T: null, S: null },
  hasOwnProperty = Object.prototype.hasOwnProperty;
function ReactElement(type, key, props) {
  var refProp = props.ref;
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type: type,
    key: key,
    ref: void 0 !== refProp ? refProp : null,
    props: props
  };
}
function cloneAndReplaceKey(oldElement, newKey) {
  return ReactElement(oldElement.type, newKey, oldElement.props);
}
function isValidElement(object) {
  return (
    "object" === typeof object &&
    null !== object &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
function escape(key) {
  var escaperLookup = { "=": "=0", ":": "=2" };
  return (
    "$" +
    key.replace(/[=:]/g, function (match) {
      return escaperLookup[match];
    })
  );
}
var userProvidedKeyEscapeRegex = /\/+/g;
function getElementKey(element, index) {
  return "object" === typeof element && null !== element && null != element.key
    ? escape("" + element.key)
    : index.toString(36);
}
function resolveThenable(thenable) {
  switch (thenable.status) {
    case "fulfilled":
      return thenable.value;
    case "rejected":
      throw thenable.reason;
    default:
      switch (
        ("string" === typeof thenable.status
          ? thenable.then(noop, noop)
          : ((thenable.status = "pending"),
            thenable.then(
              function (fulfilledValue) {
                "pending" === thenable.status &&
                  ((thenable.status = "fulfilled"),
                  (thenable.value = fulfilledValue));
              },
              function (error) {
                "pending" === thenable.status &&
                  ((thenable.status = "rejected"), (thenable.reason = error));
              }
            )),
        thenable.status)
      ) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw thenable.reason;
      }
  }
  throw thenable;
}
function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
  var type = typeof children;
  if ("undefined" === type || "boolean" === type) children = null;
  var invokeCallback = false;
  if (null === children) invokeCallback = true;
  else
    switch (type) {
      case "bigint":
      case "string":
      case "number":
        invokeCallback = true;
        break;
      case "object":
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
            break;
          case REACT_LAZY_TYPE:
            return (
              (invokeCallback = children._init),
              mapIntoArray(
                invokeCallback(children._payload),
                array,
                escapedPrefix,
                nameSoFar,
                callback
              )
            );
        }
    }
  if (invokeCallback)
    return (
      (callback = callback(children)),
      (invokeCallback =
        "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar),
      isArrayImpl(callback)
        ? ((escapedPrefix = ""),
          null != invokeCallback &&
            (escapedPrefix =
              invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"),
          mapIntoArray(callback, array, escapedPrefix, "", function (c) {
            return c;
          }))
        : null != callback &&
          (isValidElement(callback) &&
            (callback = cloneAndReplaceKey(
              callback,
              escapedPrefix +
                (null == callback.key ||
                (children && children.key === callback.key)
                  ? ""
                  : ("" + callback.key).replace(
                      userProvidedKeyEscapeRegex,
                      "$&/"
                    ) + "/") +
                invokeCallback
            )),
          array.push(callback)),
      1
    );
  invokeCallback = 0;
  var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
  if (isArrayImpl(children))
    for (var i = 0; i < children.length; i++)
      (nameSoFar = children[i]),
        (type = nextNamePrefix + getElementKey(nameSoFar, i)),
        (invokeCallback += mapIntoArray(
          nameSoFar,
          array,
          escapedPrefix,
          type,
          callback
        ));
  else if (((i = getIteratorFn(children)), "function" === typeof i))
    for (
      children = i.call(children), i = 0;
      !(nameSoFar = children.next()).done;

    )
      (nameSoFar = nameSoFar.value),
        (type = nextNamePrefix + getElementKey(nameSoFar, i++)),
        (invokeCallback += mapIntoArray(
          nameSoFar,
          array,
          escapedPrefix,
          type,
          callback
        ));
  else if ("object" === type) {
    if ("function" === typeof children.then)
      return mapIntoArray(
        resolveThenable(children),
        array,
        escapedPrefix,
        nameSoFar,
        callback
      );
    array = String(children);
    throw Error(
      "Objects are not valid as a React child (found: " +
        ("[object Object]" === array
          ? "object with keys {" + Object.keys(children).join(", ") + "}"
          : array) +
        "). If you meant to render a collection of children, use an array instead."
    );
  }
  return invokeCallback;
}
function mapChildren(children, func, context) {
  if (null == children) return children;
  var result = [],
    count = 0;
  mapIntoArray(children, result, "", "", function (child) {
    return func.call(context, child, count++);
  });
  return result;
}
function lazyInitializer(payload) {
  if (-1 === payload._status) {
    var ctor = payload._result;
    ctor = ctor();
    ctor.then(
      function (moduleObject) {
        if (0 === payload._status || -1 === payload._status)
          (payload._status = 1), (payload._result = moduleObject);
      },
      function (error) {
        if (0 === payload._status || -1 === payload._status)
          (payload._status = 2), (payload._result = error);
      }
    );
    -1 === payload._status && ((payload._status = 0), (payload._result = ctor));
  }
  if (1 === payload._status) return payload._result.default;
  throw payload._result;
}
var reportGlobalError =
    "function" === typeof reportError
      ? reportError
      : function (error) {
          if (
            "object" === typeof process &&
            "function" === typeof process.emit
          ) {
            process.emit("uncaughtException", error);
            return;
          }
          console.error(error);
        },
  Children = {
    map: mapChildren,
    forEach: function (children, forEachFunc, forEachContext) {
      mapChildren(
        children,
        function () {
          forEachFunc.apply(this, arguments);
        },
        forEachContext
      );
    },
    count: function (children) {
      var n = 0;
      mapChildren(children, function () {
        n++;
      });
      return n;
    },
    toArray: function (children) {
      return (
        mapChildren(children, function (child) {
          return child;
        }) || []
      );
    },
    only: function (children) {
      if (!isValidElement(children))
        throw Error(
          "React.Children.only expected to receive a single React element child."
        );
      return children;
    }
  };
react_production.Activity = REACT_ACTIVITY_TYPE;
react_production.Children = Children;
react_production.Component = Component;
react_production.Fragment = REACT_FRAGMENT_TYPE;
react_production.Profiler = REACT_PROFILER_TYPE;
react_production.PureComponent = PureComponent;
react_production.StrictMode = REACT_STRICT_MODE_TYPE;
react_production.Suspense = REACT_SUSPENSE_TYPE;
react_production.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
  ReactSharedInternals;
react_production.__COMPILER_RUNTIME = {
  __proto__: null,
  c: function (size) {
    return ReactSharedInternals.H.useMemoCache(size);
  }
};
react_production.cache = function (fn) {
  return function () {
    return fn.apply(null, arguments);
  };
};
react_production.cacheSignal = function () {
  return null;
};
react_production.cloneElement = function (element, config, children) {
  if (null === element || void 0 === element)
    throw Error(
      "The argument must be a React element, but you passed " + element + "."
    );
  var props = assign({}, element.props),
    key = element.key;
  if (null != config)
    for (propName in (void 0 !== config.key && (key = "" + config.key), config))
      !hasOwnProperty.call(config, propName) ||
        "key" === propName ||
        "__self" === propName ||
        "__source" === propName ||
        ("ref" === propName && void 0 === config.ref) ||
        (props[propName] = config[propName]);
  var propName = arguments.length - 2;
  if (1 === propName) props.children = children;
  else if (1 < propName) {
    for (var childArray = Array(propName), i = 0; i < propName; i++)
      childArray[i] = arguments[i + 2];
    props.children = childArray;
  }
  return ReactElement(element.type, key, props);
};
react_production.createContext = function (defaultValue) {
  defaultValue = {
    $$typeof: REACT_CONTEXT_TYPE,
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    _threadCount: 0,
    Provider: null,
    Consumer: null
  };
  defaultValue.Provider = defaultValue;
  defaultValue.Consumer = {
    $$typeof: REACT_CONSUMER_TYPE,
    _context: defaultValue
  };
  return defaultValue;
};
react_production.createElement = function (type, config, children) {
  var propName,
    props = {},
    key = null;
  if (null != config)
    for (propName in (void 0 !== config.key && (key = "" + config.key), config))
      hasOwnProperty.call(config, propName) &&
        "key" !== propName &&
        "__self" !== propName &&
        "__source" !== propName &&
        (props[propName] = config[propName]);
  var childrenLength = arguments.length - 2;
  if (1 === childrenLength) props.children = children;
  else if (1 < childrenLength) {
    for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++)
      childArray[i] = arguments[i + 2];
    props.children = childArray;
  }
  if (type && type.defaultProps)
    for (propName in ((childrenLength = type.defaultProps), childrenLength))
      void 0 === props[propName] &&
        (props[propName] = childrenLength[propName]);
  return ReactElement(type, key, props);
};
react_production.createRef = function () {
  return { current: null };
};
react_production.forwardRef = function (render) {
  return { $$typeof: REACT_FORWARD_REF_TYPE, render: render };
};
react_production.isValidElement = isValidElement;
react_production.lazy = function (ctor) {
  return {
    $$typeof: REACT_LAZY_TYPE,
    _payload: { _status: -1, _result: ctor },
    _init: lazyInitializer
  };
};
react_production.memo = function (type, compare) {
  return {
    $$typeof: REACT_MEMO_TYPE,
    type: type,
    compare: void 0 === compare ? null : compare
  };
};
react_production.startTransition = function (scope) {
  var prevTransition = ReactSharedInternals.T,
    currentTransition = {};
  ReactSharedInternals.T = currentTransition;
  try {
    var returnValue = scope(),
      onStartTransitionFinish = ReactSharedInternals.S;
    null !== onStartTransitionFinish &&
      onStartTransitionFinish(currentTransition, returnValue);
    "object" === typeof returnValue &&
      null !== returnValue &&
      "function" === typeof returnValue.then &&
      returnValue.then(noop, reportGlobalError);
  } catch (error) {
    reportGlobalError(error);
  } finally {
    null !== prevTransition &&
      null !== currentTransition.types &&
      (prevTransition.types = currentTransition.types),
      (ReactSharedInternals.T = prevTransition);
  }
};
react_production.unstable_useCacheRefresh = function () {
  return ReactSharedInternals.H.useCacheRefresh();
};
react_production.use = function (usable) {
  return ReactSharedInternals.H.use(usable);
};
react_production.useActionState = function (action, initialState, permalink) {
  return ReactSharedInternals.H.useActionState(action, initialState, permalink);
};
react_production.useCallback = function (callback, deps) {
  return ReactSharedInternals.H.useCallback(callback, deps);
};
react_production.useContext = function (Context) {
  return ReactSharedInternals.H.useContext(Context);
};
react_production.useDebugValue = function () {};
react_production.useDeferredValue = function (value, initialValue) {
  return ReactSharedInternals.H.useDeferredValue(value, initialValue);
};
react_production.useEffect = function (create, deps) {
  return ReactSharedInternals.H.useEffect(create, deps);
};
react_production.useEffectEvent = function (callback) {
  return ReactSharedInternals.H.useEffectEvent(callback);
};
react_production.useId = function () {
  return ReactSharedInternals.H.useId();
};
react_production.useImperativeHandle = function (ref, create, deps) {
  return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
};
react_production.useInsertionEffect = function (create, deps) {
  return ReactSharedInternals.H.useInsertionEffect(create, deps);
};
react_production.useLayoutEffect = function (create, deps) {
  return ReactSharedInternals.H.useLayoutEffect(create, deps);
};
react_production.useMemo = function (create, deps) {
  return ReactSharedInternals.H.useMemo(create, deps);
};
react_production.useOptimistic = function (passthrough, reducer) {
  return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
};
react_production.useReducer = function (reducer, initialArg, init) {
  return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
};
react_production.useRef = function (initialValue) {
  return ReactSharedInternals.H.useRef(initialValue);
};
react_production.useState = function (initialState) {
  return ReactSharedInternals.H.useState(initialState);
};
react_production.useSyncExternalStore = function (
  subscribe,
  getSnapshot,
  getServerSnapshot
) {
  return ReactSharedInternals.H.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
};
react_production.useTransition = function () {
  return ReactSharedInternals.H.useTransition();
};
react_production.version = "19.2.7";

{
  react.exports = react_production;
}

var reactExports = react.exports;
const React = /*@__PURE__*/getDefaultExportFromCjs(reactExports);

const omitNils = object => Object.fromEntries(Object.entries(object).filter(_ref => {
  let [, value] = _ref;
  return value !== undefined;
}));

const createInstance = (type, _ref) => {
  let {
    style,
    children,
    ...props
  } = _ref;
  return {
    type,
    box: {},
    style: style || {},
    props: props || {},
    children: []
  };
};
const createTextInstance = text => ({
  type: 'TEXT_INSTANCE',
  value: text
});
const appendChild = (parent, child) => {
  const isParentText = parent.type === 'TEXT' || parent.type === 'LINK' || parent.type === 'TSPAN' || parent.type === 'NOTE';
  const isChildTextInstance = child.type === 'TEXT_INSTANCE';
  const isOrphanTextInstance = isChildTextInstance && !isParentText;

  // Ignore orphan text instances.
  // Caused by cases such as <>{name && <Text>{name}</Text>}</>
  if (isOrphanTextInstance) {
    console.warn(`Invalid '${child.value}' string child outside <Text> component`);
    return;
  }
  parent.children.push(child);
};
const appendChildToContainer = (parentInstance, child) => {
  if (parentInstance.type === 'ROOT') {
    parentInstance.document = child;
  } else {
    appendChild(parentInstance, child);
  }
};
const insertBefore = (parentInstance, child, beforeChild) => {
  var _parentInstance$child;
  const index = (_parentInstance$child = parentInstance.children) === null || _parentInstance$child === void 0 ? void 0 : _parentInstance$child.indexOf(beforeChild);
  if (index === undefined) return;
  if (index !== -1 && child) parentInstance.children.splice(index, 0, child);
};
const removeChild = (parentInstance, child) => {
  var _parentInstance$child2;
  const index = (_parentInstance$child2 = parentInstance.children) === null || _parentInstance$child2 === void 0 ? void 0 : _parentInstance$child2.indexOf(child);
  if (index === undefined) return;
  if (index !== -1) parentInstance.children.splice(index, 1);
};
const removeChildFromContainer = (parentInstance, child) => {
  var _parentInstance$child3;
  const index = (_parentInstance$child3 = parentInstance.children) === null || _parentInstance$child3 === void 0 ? void 0 : _parentInstance$child3.indexOf(child);
  if (index === undefined) return;
  if (index !== -1) parentInstance.children.splice(index, 1);
};
const commitTextUpdate = (textInstance, oldText, newText) => {
  textInstance.value = newText;
};
const commitUpdate = (instance, updatePayload, type, oldProps, newProps) => {
  const {
    style,
    ...props
  } = newProps;
  instance.props = props;
  instance.style = style;
};
const createRenderer = _ref2 => {
  let {
    onChange = () => {}
  } = _ref2;
  return Reconciler({
    appendChild,
    appendChildToContainer,
    commitTextUpdate,
    commitUpdate,
    createInstance,
    createTextInstance,
    insertBefore,
    removeChild,
    removeChildFromContainer,
    resetAfterCommit: onChange
  });
};
const fontStore = new FontStore();

// We must keep a single renderer instance, otherwise React will complain
let renderer;

// The pdf instance acts as an event emitter for DOM usage.
// We only want to trigger an update when PDF content changes
const events = {};
const pdf = initialValue => {
  const onChange = () => {
    var _events$change;
    const listeners = ((_events$change = events.change) === null || _events$change === void 0 ? void 0 : _events$change.slice()) || [];
    for (let i = 0; i < listeners.length; i += 1) listeners[i]();
  };
  const container = {
    type: 'ROOT',
    document: null
  };
  renderer = renderer || createRenderer({
    onChange
  });
  const mountNode = renderer.createContainer(container);
  const updateContainer = (doc, callback) => {
    renderer.updateContainer(doc, mountNode, null, callback);
  };
  if (initialValue) updateContainer(initialValue);
  const render = async function (compress) {
    if (compress === void 0) {
      compress = true;
    }
    const props = container.document.props || {};
    const {
      pdfVersion,
      language,
      pageLayout,
      pageMode,
      title,
      author,
      subject,
      keywords,
      creator = 'react-pdf',
      producer = 'react-pdf',
      creationDate = new Date(),
      modificationDate,
      ownerPassword,
      userPassword,
      permissions
    } = props;
    const ctx = new PDFDocument({
      compress,
      pdfVersion,
      lang: language,
      displayTitle: true,
      autoFirstPage: false,
      ownerPassword,
      userPassword,
      permissions,
      pageLayout,
      info: omitNils({
        Title: title,
        Author: author,
        Subject: subject,
        Keywords: keywords,
        Creator: creator,
        Producer: producer,
        CreationDate: creationDate,
        ModificationDate: modificationDate
      })
    });
    if (pageMode) {
      ctx._root.data.PageMode = upperFirst(pageMode);
    }
    const layout = await layoutDocument(container.document, fontStore);
    const fileStream = renderPDF(ctx, layout);
    return {
      layout,
      fileStream
    };
  };
  const callOnRender = function (params) {
    if (params === void 0) {
      params = {};
    }
    if (container.document.props.onRender) {
      container.document.props.onRender(params);
    }
  };
  const toBlob = async () => {
    const chunks = [];
    const {
      layout: _INTERNAL__LAYOUT__DATA_,
      fileStream: instance
    } = await render();
    return new Promise((resolve, reject) => {
      instance.on('data', chunk => {
        chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
      });
      instance.on('end', () => {
        try {
          const blob = new Blob(chunks, {
            type: 'application/pdf'
          });
          callOnRender({
            blob,
            _INTERNAL__LAYOUT__DATA_
          });
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  // TODO: rename this method to `toStream` in next major release, because it return stream not a buffer
  const toBuffer = async () => {
    const {
      layout: _INTERNAL__LAYOUT__DATA_,
      fileStream
    } = await render();
    callOnRender({
      _INTERNAL__LAYOUT__DATA_
    });
    return fileStream;
  };

  /*
   * TODO: remove this method in next major release. it is buggy
   * see
   * - https://github.com/diegomura/react-pdf/issues/2112
   * - https://github.com/diegomura/react-pdf/issues/2095
   */
  const toString = async () => {
    let result = '';
    const {
      fileStream: instance
    } = await render(false); // For some reason, when rendering to string if compress=true the document is blank

    return new Promise((resolve, reject) => {
      try {
        instance.on('data', buffer => {
          result += buffer;
        });
        instance.on('end', () => {
          callOnRender();
          resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  };
  const on = (event, listener) => {
    if (!events[event]) events[event] = [];
    events[event].push(listener);
  };
  const removeListener = (event, listener) => {
    if (!events[event]) return;
    const idx = events[event].indexOf(listener);
    if (idx > -1) events[event].splice(idx, 1);
  };
  return {
    on,
    container,
    toBlob,
    toBuffer,
    toString,
    removeListener,
    updateContainer
  };
};
const StyleSheet = {
  create: s => s
};

/**
 * @param {React.ReactElement} element
 * @returns {Promise<NodeJS.ReadableStream>}
 */
const renderToStream = async element => {
  const instance = pdf(element);
  const stream = await instance.toBuffer();
  return stream;
};

/**
 * @param {React.ReactElement} element
 * @returns {Promise<Buffer>}
 */
const renderToBuffer = element => renderToStream(element).then(stream => new Promise((resolve, reject) => {
  const chunks = [];
  stream.on('data', chunk => chunks.push(chunk));
  stream.on('end', () => resolve(Buffer$2.concat(chunks)));
  stream.on('error', error => reject(error));
}));

function stripHtmlToPlain(html) {
  if (!html) return "";
  return String(html).replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}
function htmlToBlocks(html) {
  if (!html) return [];
  const source = String(html);
  const blocks = [];
  const liMatches = [...source.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];
  if (liMatches.length) {
    for (const match of liMatches) {
      const text = stripHtmlToPlain(match[1]);
      if (text) blocks.push({ type: "bullet", text });
    }
    if (blocks.length) return blocks;
  }
  const paragraphs = stripHtmlToPlain(source).split(/\n+/).map((line) => line.replace(/^[-*•●▪◦]\s+/, "").trim()).filter(Boolean);
  for (const line of paragraphs) {
    blocks.push({
      type: /^[-*•]/.test(line) ? "bullet" : "paragraph",
      text: line.replace(/^[-*•]\s+/, "")
    });
  }
  return blocks;
}
function formatDateRange(start, end, isCurrent) {
  const fmt = (value) => {
    if (!value) return "";
    const d = /* @__PURE__ */ new Date(`${value}-01`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  const left = fmt(start);
  const right = isCurrent ? "Present" : fmt(end);
  if (left && right) return `${left} \u2013 ${right}`;
  return left || right || "";
}

const DEFAULT_SECTIONS_ORDER = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "achievements"
];
const SECTION_LABELS = {
  summary: "Summary",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  skills: "Skills",
  achievements: "Achievements"
};
function customSectionKey(id) {
  return `custom:${id}`;
}
function isCustomSectionId(id) {
  return id.startsWith("custom:");
}
function parseCustomSectionId(id) {
  if (!isCustomSectionId(id)) return null;
  return id.slice("custom:".length);
}
function sectionLabel(id, customSections = []) {
  if (isCustomSectionId(id)) {
    const customId = parseCustomSectionId(id);
    const found = customSections.find((s) => s.id === customId);
    return (found == null ? void 0 : found.title) || "Custom";
  }
  return SECTION_LABELS[id] || id;
}
function resolveTemplateSlug(data) {
  return String(data.templateSlug || data.templateId || "the-distinguished").trim() || "the-distinguished";
}
function normalizeSectionsOrder(order, customSections = []) {
  const customKeys = customSections.map((s) => customSectionKey(s.id));
  const allowed = /* @__PURE__ */ new Set([...DEFAULT_SECTIONS_ORDER, ...customKeys]);
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const raw of order || []) {
    const id = String(raw || "").trim();
    if (!id || !allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  for (const id of DEFAULT_SECTIONS_ORDER) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  for (const id of customKeys) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}
function withLayoutState(data) {
  const templateSlug = resolveTemplateSlug(data);
  return {
    ...data,
    templateId: data.templateId || templateSlug,
    templateSlug,
    sectionsOrder: normalizeSectionsOrder(data.sectionsOrder, data.customSections || [])
  };
}

const pagePadding = {
  top: 28,
  bottom: 28,
  left: 36,
  right: 36
};
const colors$1 = {
  ink: "#0f172a",
  muted: "#475569",
  soft: "#64748b",
  line: "#e2e8f0",
  brand: "#006a61",
  paper: "#ffffff",
  sidebar: "#006a61",
  sidebarText: "#ffffff",
  sidebarMuted: "#ccfbf1",
  chipBg: "#f8fafc",
  techChipBorder: "#5eead4",
  techChipBg: "#0f766e"
};
const pageStyle = {
  paddingTop: pagePadding.top,
  paddingBottom: pagePadding.bottom,
  paddingLeft: pagePadding.left,
  paddingRight: pagePadding.right,
  fontFamily: "Helvetica",
  fontSize: 10,
  color: colors$1.ink,
  backgroundColor: colors$1.paper
};
const styles = {
  page: pageStyle,
  h1: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.4,
    color: colors$1.ink,
    marginBottom: 4
  },
  h2: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors$1.brand,
    marginBottom: 6,
    marginTop: 10,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors$1.line
  },
  subtitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors$1.brand,
    marginBottom: 4
  },
  muted: {
    fontSize: 9,
    color: colors$1.muted,
    marginBottom: 1
  },
  body: {
    fontSize: 9.5,
    lineHeight: 1.35,
    color: colors$1.ink
  },
  section: {
    marginBottom: 2
  },
  atom: {
    marginBottom: 8
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8
  },
  itemTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: colors$1.ink,
    marginBottom: 1
  },
  itemMeta: {
    fontSize: 9,
    color: colors$1.brand,
    marginBottom: 3
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
    paddingRight: 4
  },
  bulletGlyph: {
    width: 10,
    fontSize: 9,
    color: colors$1.soft
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.4,
    color: colors$1.ink
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  chip: {
    borderWidth: 1,
    borderColor: colors$1.line,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 8,
    color: colors$1.ink,
    backgroundColor: colors$1.chipBg
  },
  contactLine: {
    fontSize: 8.5,
    color: colors$1.muted,
    marginBottom: 2
  },
  techPage: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors$1.ink,
    backgroundColor: colors$1.paper,
    paddingTop: pagePadding.top,
    paddingBottom: pagePadding.bottom
  },
  techSidebar: {
    width: "32%",
    backgroundColor: colors$1.sidebar,
    color: colors$1.sidebarText,
    paddingLeft: 22,
    paddingRight: 18
  },
  techMain: {
    width: "68%",
    paddingLeft: 24,
    paddingRight: 28
  },
  techName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors$1.sidebarText,
    textTransform: "uppercase",
    marginBottom: 6,
    lineHeight: 1.15
  },
  techRole: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors$1.sidebarMuted,
    marginBottom: 18
  },
  techHeading: {
    fontSize: 8,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    color: colors$1.sidebarMuted,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.25)",
    paddingBottom: 3,
    marginBottom: 6,
    marginTop: 10
  },
  techText: {
    fontSize: 8.5,
    color: colors$1.sidebarText,
    marginBottom: 4,
    lineHeight: 1.35
  },
  techChip: {
    borderWidth: 1,
    borderColor: colors$1.techChipBorder,
    backgroundColor: colors$1.techChipBg,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 5,
    marginRight: 4
  },
  techChipText: {
    fontSize: 7.5,
    color: colors$1.sidebarText
  },
  modernSplit: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18
  },
  modernLeft: {
    width: "34%"
  },
  modernRight: {
    width: "66%",
    borderLeftWidth: 1,
    borderLeftColor: colors$1.line,
    paddingLeft: 14
  }
};

const colors = colors$1;
const baseStyles = StyleSheet.create(styles);

function createCoverLetterPdfDocument(data, coverLetter) {
  const letter = coverLetter || data.coverLetter;
  const p = data.personalInfo;
  const content = (letter == null ? void 0 : letter.content) || "";
  const blocks = htmlToBlocks(content);
  const plainFallback = stripHtmlToPlain(content);
  const bodyChildren = blocks.length > 0 ? blocks.map((block, index) => {
    if (block.type === "bullet") {
      return React.createElement(
        View,
        { key: `lb-${index}`, style: baseStyles.bulletRow, wrap: false },
        React.createElement(Text, { style: baseStyles.bulletGlyph }, "\u2022"),
        React.createElement(Text, { style: baseStyles.bulletText }, block.text)
      );
    }
    return React.createElement(
      Text,
      {
        key: `lp-${index}`,
        style: [baseStyles.body, { marginBottom: 8 }],
        wrap: false
      },
      block.text
    );
  }) : [
    React.createElement(
      Text,
      { key: "plain", style: [baseStyles.body, { lineHeight: 1.55 }] },
      plainFallback || " "
    )
  ];
  const page = React.createElement(
    Page,
    { size: "A4", style: baseStyles.page, wrap: true },
    React.createElement(
      View,
      { wrap: false, style: { marginBottom: 24 } },
      React.createElement(Text, { style: baseStyles.h1 }, p.fullName || data.name || "Cover Letter"),
      p.jobTitle ? React.createElement(Text, { style: baseStyles.subtitle }, p.jobTitle) : null,
      React.createElement(
        Text,
        { style: baseStyles.contactLine },
        [p.email, p.phone, p.location].filter(Boolean).join("  \xB7  ")
      )
    ),
    (letter == null ? void 0 : letter.companyName) || (letter == null ? void 0 : letter.hiringManager) ? React.createElement(
      View,
      { wrap: false, style: { marginBottom: 16 } },
      (letter == null ? void 0 : letter.hiringManager) ? React.createElement(Text, { style: baseStyles.body }, letter.hiringManager) : null,
      (letter == null ? void 0 : letter.companyName) ? React.createElement(Text, {
        style: [baseStyles.body, { color: colors.brand, marginBottom: 8 }]
      }, letter.companyName) : null
    ) : null,
    React.createElement(View, { style: { marginTop: 4 } }, ...bodyChildren)
  );
  return React.createElement(
    Document,
    {
      title: `${p.fullName || "Cover"} Cover Letter`,
      author: p.fullName || "Candidate"
    },
    page
  );
}

const DEFAULT_THEME = {
  brand: "#006a61",
  ink: "#0f172a",
  muted: "#475569",
  sidebar: "#006a61",
  sidebarText: "#ffffff",
  sidebarMuted: "#ccfbf1",
  paper: "#ffffff",
  accent: "#006a61"
};
const PROFILES = {
  "the-distinguished": {
    slug: "the-distinguished",
    variety: "modern",
    theme: { ...DEFAULT_THEME, brand: "#1e3a5f", accent: "#1e3a5f" }
  },
  "the-corporate": {
    slug: "the-corporate",
    variety: "minimal",
    theme: { ...DEFAULT_THEME, brand: "#0f172a", accent: "#1e293b", ink: "#0f172a" }
  },
  "the-executive": {
    slug: "the-executive",
    variety: "modern",
    theme: { ...DEFAULT_THEME, brand: "#0f172a", accent: "#334155" }
  },
  "the-partner": {
    slug: "the-partner",
    variety: "minimal",
    theme: { ...DEFAULT_THEME, brand: "#1c1917", accent: "#44403c" }
  },
  "the-innovator": {
    slug: "the-innovator",
    variety: "tech",
    sidebarSide: "right",
    theme: {
      ...DEFAULT_THEME,
      dark: true,
      brand: "#22d3ee",
      ink: "#e2e8f0",
      muted: "#94a3b8",
      sidebar: "#020617",
      sidebarText: "#f8fafc",
      sidebarMuted: "#67e8f9",
      paper: "#0f172a",
      accent: "#22d3ee"
    }
  },
  "the-digital-nomad": {
    slug: "the-digital-nomad",
    variety: "tech",
    sidebarSide: "left",
    theme: {
      ...DEFAULT_THEME,
      brand: "#0f172a",
      sidebar: "#0f172a",
      sidebarText: "#f8fafc",
      sidebarMuted: "#94a3b8",
      accent: "#38bdf8"
    }
  },
  "the-social-media-pro": {
    slug: "the-social-media-pro",
    variety: "modern",
    theme: { ...DEFAULT_THEME, brand: "#7c3aed", accent: "#a855f7" }
  },
  "the-creative-director": {
    slug: "the-creative-director",
    variety: "tech",
    sidebarSide: "left",
    theme: {
      ...DEFAULT_THEME,
      brand: "#0f766e",
      sidebar: "#0f766e",
      sidebarText: "#ffffff",
      sidebarMuted: "#99f6e4",
      accent: "#14b8a6"
    }
  },
  "the-brand-architect": {
    slug: "the-brand-architect",
    variety: "minimal",
    theme: { ...DEFAULT_THEME, brand: "#18181b", accent: "#27272a" }
  },
  "the-typographer": {
    slug: "the-typographer",
    variety: "modern",
    theme: { ...DEFAULT_THEME, brand: "#111827", accent: "#111827" }
  },
  "the-strategist": {
    slug: "the-strategist",
    variety: "tech",
    sidebarSide: "left",
    theme: {
      ...DEFAULT_THEME,
      brand: "#334155",
      sidebar: "#f1f5f9",
      sidebarText: "#0f172a",
      sidebarMuted: "#64748b",
      accent: "#0f172a"
    }
  },
  "the-engineer": {
    slug: "the-engineer",
    variety: "tech",
    sidebarSide: "right",
    theme: {
      ...DEFAULT_THEME,
      brand: "#0369a1",
      sidebar: "#e0f2fe",
      sidebarText: "#0c4a6e",
      sidebarMuted: "#0369a1",
      accent: "#0284c7"
    }
  },
  "the-researcher": {
    slug: "the-researcher",
    variety: "minimal",
    theme: { ...DEFAULT_THEME, brand: "#1e3a5f", accent: "#1e3a5f" }
  },
  "the-researcher-updated": {
    slug: "the-researcher-updated",
    variety: "minimal",
    theme: { ...DEFAULT_THEME, brand: "#1e3a5f", accent: "#1e3a5f" }
  }
};
function getPdfTemplateProfile(templateSlug) {
  const slug = String(templateSlug).trim() || "the-distinguished";
  if (PROFILES[slug]) return PROFILES[slug];
  const id = slug.toLowerCase();
  if (id.includes("creative-director")) return { ...PROFILES["the-creative-director"], slug };
  if (id.includes("digital-nomad")) return { ...PROFILES["the-digital-nomad"], slug };
  if (id.includes("strategist")) return { ...PROFILES["the-strategist"], slug };
  if (id.includes("innovator")) return { ...PROFILES["the-innovator"], slug };
  if (id.includes("engineer")) return { ...PROFILES["the-engineer"], slug };
  if (id.includes("executive") || id.includes("typographer") || id.includes("social-media")) {
    return { ...PROFILES["the-executive"], slug };
  }
  if (id.includes("corporate")) return { ...PROFILES["the-corporate"], slug };
  if (id.includes("distinguished")) return { ...PROFILES["the-distinguished"], slug };
  return { ...PROFILES["the-distinguished"], slug };
}

function sx(...parts) {
  return parts.filter(Boolean);
}
const S = StyleSheet.create(styles);
function themed(theme) {
  return {
    page: { ...S.page, color: theme.ink, backgroundColor: theme.paper },
    h1: { ...S.h1, color: theme.ink },
    h2: { ...S.h2, color: theme.brand, borderBottomColor: `${theme.accent}33` },
    subtitle: { ...S.subtitle, color: theme.brand },
    body: { ...S.body, color: theme.ink },
    muted: { ...S.muted, color: theme.muted },
    itemTitle: { ...S.itemTitle, color: theme.ink },
    itemMeta: { ...S.itemMeta, color: theme.brand },
    contactLine: { ...S.contactLine, color: theme.muted },
    techPage: { ...S.techPage, color: theme.ink, backgroundColor: theme.paper },
    techSidebar: { ...S.techSidebar, backgroundColor: theme.sidebar, color: theme.sidebarText },
    techMain: { ...S.techMain, backgroundColor: theme.paper },
    techName: { ...S.techName, color: theme.sidebarText },
    techRole: { ...S.techRole, color: theme.sidebarMuted },
    techHeading: {
      ...S.techHeading,
      color: theme.sidebarMuted,
      borderBottomColor: `${theme.sidebarMuted}55`
    },
    techText: { ...S.techText, color: theme.sidebarText },
    modernRight: { ...S.modernRight, borderLeftColor: `${theme.accent}44` }
  };
}
function Blocks({ html, light = false, theme }) {
  const blocks = htmlToBlocks(html);
  return React.createElement(
    View,
    null,
    ...blocks.map((block, index) => {
      if (block.type === "bullet") {
        return React.createElement(
          View,
          { key: `b-${index}`, style: S.bulletRow, wrap: false },
          React.createElement(Text, {
            style: sx(S.bulletGlyph, light && { color: theme.sidebarMuted })
          }, "\u2022"),
          React.createElement(Text, {
            style: sx(S.bulletText, { color: light ? theme.sidebarText : theme.ink })
          }, block.text)
        );
      }
      return React.createElement(
        Text,
        {
          key: `p-${index}`,
          style: sx(S.body, { marginBottom: 4, color: light ? theme.sidebarText : theme.ink })
        },
        block.text
      );
    })
  );
}
function ExperienceList({ data, theme, t }) {
  var _a;
  if (!((_a = data.experience) == null ? void 0 : _a.length)) return null;
  return React.createElement(
    View,
    null,
    ...data.experience.map(
      (job) => React.createElement(
        View,
        { key: job.id, style: S.atom },
        // Keep title/company together; allow description bullets to paginate.
        React.createElement(
          View,
          { wrap: false },
          React.createElement(
            View,
            { style: S.rowBetween },
            React.createElement(Text, { style: t.itemTitle }, job.title || "Role"),
            React.createElement(Text, { style: t.muted }, formatDateRange(job.startDate, job.endDate, job.isCurrent))
          ),
          React.createElement(Text, { style: t.itemMeta }, [job.company, job.location].filter(Boolean).join(" \xB7 "))
        ),
        React.createElement(Blocks, { html: job.description, theme })
      )
    )
  );
}
function EducationList({
  data,
  theme,
  t,
  light = false
}) {
  var _a;
  if (!((_a = data.education) == null ? void 0 : _a.length)) return null;
  return React.createElement(
    View,
    null,
    ...data.education.map(
      (edu) => React.createElement(
        View,
        { key: edu.id, style: S.atom },
        React.createElement(Text, {
          style: sx(t.itemTitle, light && { color: theme.sidebarText, fontSize: 9 })
        }, edu.degree || "Degree"),
        React.createElement(Text, {
          style: sx(t.muted, light && { color: theme.sidebarMuted })
        }, [edu.school, edu.graduationDate].filter(Boolean).join(", ")),
        edu.description ? React.createElement(Text, {
          style: sx(t.body, light && { color: theme.sidebarText })
        }, stripHtmlToPlain(edu.description)) : null
      )
    )
  );
}
function ProjectsList({ data, theme, t }) {
  var _a;
  if (!((_a = data.projects) == null ? void 0 : _a.length)) return null;
  return React.createElement(
    View,
    null,
    ...data.projects.map(
      (project) => React.createElement(
        View,
        { key: project.id, style: S.atom },
        React.createElement(
          View,
          { wrap: false },
          React.createElement(Text, { style: t.itemTitle }, project.title || "Project"),
          project.organization ? React.createElement(Text, { style: t.itemMeta }, project.organization) : null
        ),
        React.createElement(Blocks, { html: project.description, theme })
      )
    )
  );
}
function AchievementsList({ data, theme, t }) {
  var _a;
  if (!((_a = data.achievements) == null ? void 0 : _a.length)) return null;
  return React.createElement(
    View,
    null,
    ...data.achievements.map(
      (item) => React.createElement(
        View,
        { key: item.id, style: S.atom },
        React.createElement(Text, { style: t.itemTitle }, item.title || "Achievement"),
        item.issuer || item.date ? React.createElement(Text, { style: t.itemMeta }, [item.issuer, item.date].filter(Boolean).join(" \xB7 ")) : null,
        React.createElement(Blocks, { html: item.description, theme })
      )
    )
  );
}
function SkillsChips({ data, theme, tech = false }) {
  var _a;
  if (!((_a = data.skills) == null ? void 0 : _a.length)) return null;
  if (tech) {
    return React.createElement(
      View,
      { style: { flexDirection: "row", flexWrap: "wrap" } },
      ...data.skills.map(
        (skill) => React.createElement(
          View,
          {
            key: skill.id,
            wrap: false,
            style: {
              ...S.techChip,
              borderColor: theme.sidebarMuted,
              backgroundColor: theme.sidebar
            }
          },
          React.createElement(Text, { style: { ...S.techChipText, color: theme.sidebarText } }, skill.name)
        )
      )
    );
  }
  return React.createElement(
    View,
    { style: S.chipRow },
    ...data.skills.map(
      (skill) => React.createElement(
        Text,
        {
          key: skill.id,
          wrap: false,
          style: { ...S.chip, color: theme.ink, borderColor: `${theme.accent}55` }
        },
        skill.name
      )
    )
  );
}
function hasSectionContent(data, id) {
  var _a, _b, _c, _d, _e, _f, _g;
  switch (id) {
    case "summary":
      return Boolean(stripHtmlToPlain((_a = data.personalInfo) == null ? void 0 : _a.summary));
    case "experience":
      return Boolean((_b = data.experience) == null ? void 0 : _b.length);
    case "projects":
      return Boolean((_c = data.projects) == null ? void 0 : _c.length);
    case "education":
      return Boolean((_d = data.education) == null ? void 0 : _d.length);
    case "skills":
      return Boolean((_e = data.skills) == null ? void 0 : _e.length);
    case "achievements":
      return Boolean((_f = data.achievements) == null ? void 0 : _f.length);
    default: {
      const customId = parseCustomSectionId(id);
      const section = (data.customSections || []).find((s) => s.id === customId);
      return Boolean(section && (((_g = section.items) == null ? void 0 : _g.length) || section.title));
    }
  }
}
function renderOrderedSection(data, id, theme, t, options = {}) {
  if (!hasSectionContent(data, id)) return null;
  switch (id) {
    case "summary":
      return React.createElement(
        View,
        { key: id, wrap: false, style: S.section },
        React.createElement(Text, { style: t.h2 }, options.heading || "Summary"),
        React.createElement(Text, { style: t.body }, stripHtmlToPlain(data.personalInfo.summary))
      );
    case "experience":
      return React.createElement(
        View,
        { key: id, style: S.section },
        React.createElement(Text, { style: t.h2 }, options.heading || "Experience"),
        React.createElement(ExperienceList, { data, theme, t })
      );
    case "projects":
      return React.createElement(
        View,
        { key: id, style: S.section },
        React.createElement(Text, { style: t.h2 }, options.heading || "Projects"),
        React.createElement(ProjectsList, { data, theme, t })
      );
    case "education":
      return React.createElement(
        View,
        { key: id, style: S.section },
        React.createElement(Text, { style: options.techLight ? t.techHeading : t.h2 }, options.heading || "Education"),
        React.createElement(EducationList, { data, theme, t, light: options.techLight })
      );
    case "skills":
      return React.createElement(
        View,
        { key: id, wrap: false, style: S.section },
        React.createElement(Text, { style: options.techLight ? t.techHeading : t.h2 }, options.heading || "Skills"),
        options.listSkills ? React.createElement(
          View,
          null,
          ...data.skills.map(
            (skill) => React.createElement(
              Text,
              { key: skill.id, style: sx(t.body, { marginBottom: 3 }), wrap: false },
              `\u2022 ${skill.name}`
            )
          )
        ) : React.createElement(SkillsChips, { data, theme, tech: options.techLight })
      );
    case "achievements":
      return React.createElement(
        View,
        { key: id, style: S.section },
        React.createElement(Text, { style: t.h2 }, options.heading || "Achievements"),
        React.createElement(AchievementsList, { data, theme, t })
      );
    default: {
      const customId = parseCustomSectionId(id);
      const section = (data.customSections || []).find((s) => s.id === customId);
      if (!section) return null;
      return React.createElement(
        View,
        { key: id, style: S.section },
        React.createElement(Text, { style: t.h2 }, section.title || "Custom"),
        ...section.items.map(
          (item) => React.createElement(
            View,
            { key: item.id, style: S.atom },
            React.createElement(Text, { style: t.itemTitle }, item.title),
            item.subtitle ? React.createElement(Text, { style: t.itemMeta }, item.subtitle) : null,
            React.createElement(Blocks, { html: item.description, theme })
          )
        )
      );
    }
  }
}
function HeaderBlock({
  data,
  t,
  centered = false
}) {
  const p = data.personalInfo;
  return React.createElement(
    View,
    {
      wrap: false,
      style: centered ? { marginBottom: 10, alignItems: "center" } : { marginBottom: 8 }
    },
    React.createElement(Text, { style: sx(t.h1, centered && { textAlign: "center" }) }, p.fullName || data.name || "Resume"),
    p.jobTitle ? React.createElement(Text, { style: sx(t.subtitle, centered && { textAlign: "center" }) }, p.jobTitle) : null,
    centered ? React.createElement(
      Text,
      { style: sx(t.contactLine, { textAlign: "center" }) },
      [p.email, p.phone, p.location, p.linkedin].filter(Boolean).join("  |  ")
    ) : React.createElement(
      View,
      null,
      ...[p.email, p.phone, p.location, p.linkedin || p.portfolio || p.github].filter(Boolean).map((line, i) => React.createElement(Text, { key: `c-${i}`, style: t.contactLine }, String(line)))
    )
  );
}
function MinimalResume({
  data,
  order,
  theme,
  t
}) {
  return React.createElement(
    Page,
    { size: "A4", style: t.page, wrap: true },
    React.createElement(HeaderBlock, { data, t }),
    ...order.map((id) => renderOrderedSection(data, id, theme, t)).filter(Boolean)
  );
}
function ModernResume({
  data,
  order,
  theme,
  t
}) {
  const leftIds = order.filter((id) => id === "education" || id === "skills");
  const rightIds = order.filter((id) => id !== "education" && id !== "skills");
  return React.createElement(
    Page,
    { size: "A4", style: t.page, wrap: true },
    React.createElement(HeaderBlock, { data, t, centered: true }),
    React.createElement(
      View,
      { style: { position: "relative" } },
      React.createElement(
        View,
        {
          style: [
            S.modernLeft,
            {
              position: "absolute",
              top: 0,
              left: 0,
              paddingRight: 18
            }
          ]
        },
        ...leftIds.map((id) => renderOrderedSection(data, id, theme, t, { listSkills: id === "skills" })).filter(Boolean)
      ),
      React.createElement(
        View,
        {
          style: [
            t.modernRight,
            {
              marginLeft: "34%",
              minHeight: 100
              // Ensure the right column takes up space even if empty on page 1
            }
          ]
        },
        ...rightIds.map(
          (id) => renderOrderedSection(data, id, theme, t, {
            heading: id === "summary" ? "Executive Summary" : void 0
          })
        ).filter(Boolean)
      )
    )
  );
}
function TechResume({
  data,
  order,
  theme,
  t,
  sidebarSide = "left"
}) {
  const p = data.personalInfo;
  const sideIds = order.filter((id) => id === "skills" || id === "education");
  const mainIds = order.filter((id) => id !== "skills" && id !== "education");
  const sidebar = React.createElement(
    View,
    {
      style: [
        t.techSidebar,
        {
          position: "absolute",
          top: t.techPage.paddingTop,
          left: sidebarSide === "left" ? 0 : "68%"
        }
      ]
    },
    React.createElement(Text, { style: t.techName }, p.fullName || data.name || "Resume"),
    p.jobTitle ? React.createElement(Text, { style: t.techRole }, p.jobTitle) : null,
    React.createElement(Text, { style: t.techHeading }, "Contact"),
    ...[p.email, p.phone, p.location, p.linkedin || p.portfolio || p.github].filter(Boolean).map((line, i) => React.createElement(Text, { key: `sc-${i}`, style: t.techText }, String(line))),
    ...sideIds.map((id) => renderOrderedSection(data, id, theme, t, { techLight: true })).filter(Boolean)
  );
  const main = React.createElement(
    View,
    {
      style: [
        t.techMain,
        {
          marginLeft: sidebarSide === "left" ? "32%" : 0,
          marginRight: sidebarSide === "right" ? "32%" : 0
        }
      ]
    },
    ...mainIds.map(
      (id) => renderOrderedSection(data, id, theme, t, {
        heading: id === "summary" ? "Profile" : void 0
      })
    ).filter(Boolean)
  );
  return React.createElement(
    Page,
    { size: "A4", style: t.techPage, wrap: true },
    React.createElement(View, {
      fixed: true,
      style: {
        position: "absolute",
        top: -t.techPage.paddingTop,
        bottom: -t.techPage.paddingBottom,
        left: sidebarSide === "left" ? 0 : "68%",
        width: "32%",
        backgroundColor: t.techSidebar.backgroundColor,
        zIndex: -1
      }
    }),
    React.createElement(View, {
      fixed: true,
      style: {
        position: "absolute",
        top: -t.techPage.paddingTop,
        bottom: -t.techPage.paddingBottom,
        left: sidebarSide === "left" ? "32%" : 0,
        width: "68%",
        backgroundColor: t.techMain.backgroundColor,
        zIndex: -1
      }
    }),
    sidebar,
    main
  );
}
function createResumePdfDocument(raw) {
  const data = withLayoutState(raw);
  const templateSlug = resolveTemplateSlug(data);
  const profile = getPdfTemplateProfile(templateSlug);
  const order = normalizeSectionsOrder(data.sectionsOrder, data.customSections || []);
  const t = themed(profile.theme);
  const theme = profile.theme;
  let page;
  if (profile.variety === "tech") {
    page = React.createElement(TechResume, {
      data,
      order,
      theme,
      t,
      sidebarSide: profile.sidebarSide || "left"
    });
  } else if (profile.variety === "modern") {
    page = React.createElement(ModernResume, { data, order, theme, t });
  } else {
    page = React.createElement(MinimalResume, { data, order, theme, t });
  }
  return React.createElement(
    Document,
    {
      title: `${data.personalInfo.fullName || data.name || "Resume"}`,
      author: data.personalInfo.fullName || "Candidate"
    },
    page
  );
}

async function renderPdfToBuffer(document) {
  const result = await renderToBuffer(document);
  if (Buffer.isBuffer(result)) return result;
  if (result instanceof Uint8Array) return Buffer.from(result);
  if (result instanceof ArrayBuffer) return Buffer.from(result);
  return Buffer.from(result);
}
async function renderPdfToNodeStream(document) {
  const webStream = await renderToStream(document);
  if (typeof (webStream == null ? void 0 : webStream.pipe) === "function") {
    return webStream;
  }
  return Readable.fromWeb(webStream);
}

const SYSTEM_PROMPT = `You are a portfolio-building API. You receive the raw text of a CV or cover letter and return a single, strictly-valid JSON object describing a digital portfolio.

Return ONLY JSON (no markdown fences) matching exactly this shape:
{
  "full_name": string,
  "professional_bio": string,        // 2-4 sentence first-person summary
  "email": string,                   // if present in the document, else ""
  "phone": string,                   // if present, else ""
  "location": string,                // city/region if present, else ""
  "website": string,                 // personal site if present, else ""
  "linkedin": string,                // LinkedIn URL or handle if present, else ""
  "github": string,                  // GitHub URL or handle if present, else ""
  "formatted_projects": [            // real projects/roles from the document, most impressive first
    { "title": string, "description": string, "tech_stack": string[], "url": string }
  ],
  "core_skills": string[]            // 6-15 concise skills
}

Rules:
- Use only facts present in the document. Never invent employers, titles, metrics, or contact details.
- If a contact field is missing, use an empty string.
- If the name is unclear, use "Candidate".
- Never use em dashes; use commas.
- tech_stack must be an array of short strings (may be empty).
- url on projects may be empty when no link exists.`;
function buildPrompt(documentText) {
  return `${SYSTEM_PROMPT}

Build the portfolio JSON from the following document text:

"""
${documentText.slice(0, 24e3)}
"""`;
}
function extractJsonObject(raw) {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced == null ? void 0 : fenced[1]) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
      }
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw createError$1({ statusCode: 502, statusMessage: "AI response was not valid JSON" });
  }
}
function normalizeProfileData(input) {
  const obj = input != null ? input : {};
  const projects = Array.isArray(obj.formatted_projects) ? obj.formatted_projects.slice(0, 12).map((p) => {
    const project = p != null ? p : {};
    const url = String(project.url || "").trim();
    return {
      title: String(project.title || "Untitled Project"),
      description: String(project.description || ""),
      tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack.map(String).slice(0, 20) : [],
      ...url ? { url } : {}
    };
  }) : [];
  const optional = (key) => {
    const value = String(obj[key] || "").trim();
    return value || void 0;
  };
  return {
    full_name: String(obj.full_name || "Candidate"),
    professional_bio: String(obj.professional_bio || ""),
    formatted_projects: projects,
    core_skills: Array.isArray(obj.core_skills) ? obj.core_skills.map(String).slice(0, 20) : [],
    email: optional("email"),
    phone: optional("phone"),
    location: optional("location"),
    website: optional("website"),
    linkedin: optional("linkedin"),
    github: optional("github")
  };
}
async function generatePortfolioFromText(documentText) {
  const config = useRuntimeConfig();
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || "";
  const ai = createGeminiClient(apiKey);
  const models = [config.geminiModel || "gemini-2.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"];
  const response = await generateWithModels(
    ai,
    models,
    (model) => ai.models.generateContent({
      model,
      contents: buildPrompt(documentText),
      config: { temperature: 0.4, responseMimeType: "application/json" }
    })
  );
  return normalizeProfileData(extractJsonObject(response.text || "{}"));
}

const optionalString = (v) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : void 0;
};
function sanitizeProfileData(input) {
  var _a, _b, _c, _d;
  const obj = input != null ? input : {};
  const projects = Array.isArray(obj.formatted_projects) ? obj.formatted_projects.slice(0, 24).map((p) => {
    const project = p != null ? p : {};
    return {
      title: String(project.title || "").slice(0, 200),
      description: String(project.description || "").slice(0, 2e3),
      tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack.map((t) => String(t).slice(0, 60)).filter(Boolean).slice(0, 30) : [],
      url: optionalString(project.url)
    };
  }) : [];
  const customSections = Array.isArray(obj.custom_sections) ? obj.custom_sections.slice(0, 12).map((c, i) => {
    const cs = c != null ? c : {};
    const id = optionalString(cs.id) || `custom-${i + 1}`;
    return {
      id,
      title: String(cs.title || "").slice(0, 120),
      content: String(cs.content || "").slice(0, 4e3)
    };
  }) : [];
  const sectionOrder = Array.isArray(obj.section_order) ? obj.section_order.map((s) => String(s)).filter(Boolean).slice(0, 40) : void 0;
  const sectionTitles = obj.section_titles;
  const buttonTexts = obj.button_texts;
  return {
    full_name: String(obj.full_name || "Candidate").slice(0, 160),
    professional_bio: String(obj.professional_bio || "").slice(0, 4e3),
    formatted_projects: projects,
    core_skills: Array.isArray(obj.core_skills) ? obj.core_skills.map((s) => String(s).slice(0, 60)).filter(Boolean).slice(0, 40) : [],
    email: optionalString(obj.email),
    phone: optionalString(obj.phone),
    location: optionalString(obj.location),
    website: optionalString(obj.website) || ((_a = obj.website) == null ? void 0 : _a.url) ? obj.website : void 0,
    linkedin: optionalString(obj.linkedin) || ((_b = obj.linkedin) == null ? void 0 : _b.url) ? obj.linkedin : void 0,
    github: optionalString(obj.github) || ((_c = obj.github) == null ? void 0 : _c.url) ? obj.github : void 0,
    resume: optionalString(obj.resume) || ((_d = obj.resume) == null ? void 0 : _d.url) ? obj.resume : void 0,
    theme_color: optionalString(obj.theme_color),
    section_titles: sectionTitles ? {
      projects: optionalString(sectionTitles.projects),
      skills: optionalString(sectionTitles.skills),
      profile: optionalString(sectionTitles.profile)
    } : void 0,
    button_texts: buttonTexts ? {
      hero_cta: optionalString(buttonTexts.hero_cta),
      contact_cta: optionalString(buttonTexts.contact_cta),
      nav_projects: optionalString(buttonTexts.nav_projects),
      nav_skills: optionalString(buttonTexts.nav_skills),
      nav_contact: optionalString(buttonTexts.nav_contact)
    } : void 0,
    ...customSections.length ? { custom_sections: customSections } : {},
    ...sectionOrder ? { section_order: sectionOrder } : {}
  };
}
function mapPortfolio(row) {
  return {
    id: row.id,
    userId: row.user_id,
    templateSlug: row.template_slug,
    // pg returns JSONB already parsed; guard against string just in case.
    profileData: typeof row.profile_data === "string" ? JSON.parse(row.profile_data) : row.profile_data,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)
  };
}
async function createPortfolio(input) {
  const result = await query(
    `INSERT INTO portfolios (user_id, template_slug, profile_data)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.userId, input.templateSlug, JSON.stringify(input.profileData)]
  );
  return mapPortfolio(result.rows[0]);
}
async function listPortfoliosByUser(userId) {
  const result = await query(
    `SELECT * FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows.map(mapPortfolio);
}
async function getPortfolioForUser(id, userId) {
  const result = await query(
    `SELECT * FROM portfolios WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] ? mapPortfolio(result.rows[0]) : null;
}
async function updatePortfolioForUser(id, userId, input) {
  const result = await query(
    `UPDATE portfolios
     SET template_slug = $3, profile_data = $4
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, input.templateSlug, JSON.stringify(input.profileData)]
  );
  return result.rows[0] ? mapPortfolio(result.rows[0]) : null;
}
async function deletePortfolioForUser(id, userId) {
  var _a;
  const result = await query(`DELETE FROM portfolios WHERE id = $1 AND user_id = $2`, [
    id,
    userId
  ]);
  return ((_a = result.rowCount) != null ? _a : 0) > 0;
}

let stripe = null;
function getStripe() {
  if (stripe) return stripe;
  const config = useRuntimeConfig();
  const key = config.stripeSecretKey;
  if (!key) {
    throw createError$1({
      statusCode: 500,
      statusMessage: "Stripe is not configured (STRIPE_SECRET_KEY missing)"
    });
  }
  stripe = new Stripe(key, {
    apiVersion: "2026-06-24.dahlia"
  });
  return stripe;
}

function withCredits(handler, options = {}) {
  var _a, _b, _c, _d, _e;
  const cost = (_a = options.cost) != null ? _a : 1;
  const reason = (_b = options.reason) != null ? _b : "ai_usage";
  const requirePro = (_c = options.requirePro) != null ? _c : false;
  const proMessage = (_d = options.proMessage) != null ? _d : "A Pro subscription is required to use AI features. Upgrade on the pricing page.";
  const insufficientCreditsMessage = (_e = options.insufficientCreditsMessage) != null ? _e : "Insufficient credits. Upgrade your plan to continue.";
  return defineEventHandler(async (event) => {
    const user = await requireUser(event);
    event.context.user = user;
    if (user.role === "admin") {
      return handler(event);
    }
    if (requirePro && user.planTier !== "pro") {
      throw createError$1({
        statusCode: 403,
        statusMessage: proMessage
      });
    }
    const credits = await getCreditsRemaining(user.id);
    if (credits < cost) {
      throw createError$1({
        statusCode: 403,
        statusMessage: insufficientCreditsMessage
      });
    }
    const result = await handler(event);
    const updated = await decrementCreditAtomic(user.id, cost, reason);
    if (!updated) {
      console.warn(`[withCredits] Failed to decrement credits for user ${user.id}`);
    } else {
      event.context.user = updated;
      setHeader(event, "x-credits-remaining", String(updated.creditsRemaining));
    }
    return result;
  });
}

const sessionHooks = createHooks();
async function getUserSession(event) {
  const session = await _useSession(event);
  return {
    ...session.data,
    id: session.id
  };
}
async function setUserSession(event, data, config) {
  const session = await _useSession(event, config);
  await session.update(defu(data, session.data));
  return session.data;
}
async function clearUserSession(event, config) {
  const session = await _useSession(event, config);
  await sessionHooks.callHookParallel("clear", session.data, event);
  await session.clear();
  return true;
}
let sessionConfig;
function _useSession(event, config = {}) {
  if (!sessionConfig) {
    const runtimeConfig = useRuntimeConfig(isEvent(event) ? event : void 0);
    const envSessionPassword = `${runtimeConfig.nitro?.envPrefix || "NUXT_"}SESSION_PASSWORD`;
    sessionConfig = defu({ password: process.env[envSessionPassword] }, runtimeConfig.session);
    if (!sessionConfig.password) {
      console.error(`[nuxt-auth-utils] ${envSessionPassword} environment variable or runtimeConfig.session.password was not set.`);
    }
  }
  const finalConfig = defu(config, sessionConfig);
  return useSession(event, finalConfig);
}

const _YYYIQ6 = eventHandler(async (event) => {
  await clearUserSession(event);
  return { loggedOut: true };
});

const ___9__1 = eventHandler(async (event) => {
  const session = await getUserSession(event);
  if (Object.keys(session).length > 0) {
    await sessionHooks.callHookParallel("fetch", session, event);
  }
  const { secure, ...data } = session;
  return data;
});

const _lazy_vm6fQz = () => import('../routes/api/ai/ats-check.post.mjs');
const _lazy_znIrYj = () => import('../routes/api/ai/ats-fix.post.mjs');
const _lazy_tDEo8t = () => import('../routes/api/ai/enhance-description.post.mjs');
const _lazy_FlmfLP = () => import('../routes/api/ai/generate-cover-letter.post.mjs');
const _lazy__iq1Kh = () => import('../routes/api/ai/parse-resume.post.mjs');
const _lazy_3F_f1s = () => import('../routes/api/ai/translate.post.mjs');
const _lazy_XRktNY = () => import('../routes/api/application/answer.post.mjs');
const _lazy_F3iaHt = () => import('../routes/api/application/extract.post.mjs');
const _lazy_2Na6bp = () => import('../routes/api/apply.post.mjs');
const _lazy_2djfZ5 = () => import('../routes/api/auth/login.post.mjs');
const _lazy_54aupL = () => import('../routes/api/auth/logout.post.mjs');
const _lazy_MefoMV = () => import('../routes/api/auth/me.get.mjs');
const _lazy_IHzbiI = () => import('../routes/api/auth/register.post.mjs');
const _lazy_na1y_1 = () => import('../routes/api/billing/checkout.post.mjs');
const _lazy_Y7AF3I = () => import('../routes/api/billing/portal.post.mjs');
const _lazy_zCaBRb = () => import('../routes/api/billing/webhook.post.mjs');
const _lazy_ORtd6u = () => import('../routes/api/builder/documents.get.mjs');
const _lazy_iGF1xq = () => import('../routes/api/builder/documents/_id_.delete.mjs');
const _lazy_llREi6 = () => import('../routes/api/builder/resume.post.mjs');
const _lazy_yHRsKW = () => import('../routes/api/builder/resume/_id_.get.mjs');
const _lazy_dRZzPk = () => import('../routes/api/builder/resume/_id_.put.mjs');
const _lazy_AA53j0 = () => import('../routes/api/documents.delete.mjs');
const _lazy_J2LNDS = () => import('../routes/api/documents.get.mjs');
const _lazy_KznSU8 = () => import('../routes/api/documents.post.mjs');
const _lazy_miVwYd = () => import('../routes/api/documents/text.post.mjs');
const _lazy_0mR0of = () => import('../routes/api/health.get.mjs');
const _lazy_vce0qQ = () => import('../routes/api/jobs/_id_.delete.mjs');
const _lazy_QM8L3p = () => import('../routes/api/jobs/_id_.get.mjs');
const _lazy_t3L4T3 = () => import('../routes/api/index.get.mjs');
const _lazy_BAYXeZ = () => import('../routes/api/pdf/download.post.mjs');
const _lazy_UATxqT = () => import('../routes/api/portfolio/_id_.delete.mjs');
const _lazy_WzBYrf = () => import('../routes/api/portfolio/_id_.get.mjs');
const _lazy_WM8CnT = () => import('../routes/api/portfolio/_id_.put.mjs');
const _lazy_qFSVG6 = () => import('../routes/api/portfolio/_id/contact.post.mjs');
const _lazy_Y9EHir = () => import('../routes/api/portfolio/generate.post.mjs');
const _lazy_DFzWe_ = () => import('../routes/api/index2.get.mjs');
const _lazy_LDtmgQ = () => import('../routes/api/portfolio/public/_id_.get.mjs');
const _lazy_yS6RIN = () => import('../routes/api/portfolio/save.post.mjs');
const _lazy_sQsJ3J = () => import('../routes/api/saas/credits.get.mjs');
const _lazy_7ms73F = () => import('../routes/api/scrape.post.mjs');
const _lazy_ynl6kq = () => import('../routes/api/tailor.post.mjs');
const _lazy_yDJI4L = () => import('../routes/renderer.mjs');

const handlers = [
  { route: '', handler: _Dt1_Vf, lazy: false, middleware: true, method: undefined },
  { route: '/api/ai/ats-check', handler: _lazy_vm6fQz, lazy: true, middleware: false, method: "post" },
  { route: '/api/ai/ats-fix', handler: _lazy_znIrYj, lazy: true, middleware: false, method: "post" },
  { route: '/api/ai/enhance-description', handler: _lazy_tDEo8t, lazy: true, middleware: false, method: "post" },
  { route: '/api/ai/generate-cover-letter', handler: _lazy_FlmfLP, lazy: true, middleware: false, method: "post" },
  { route: '/api/ai/parse-resume', handler: _lazy__iq1Kh, lazy: true, middleware: false, method: "post" },
  { route: '/api/ai/translate', handler: _lazy_3F_f1s, lazy: true, middleware: false, method: "post" },
  { route: '/api/application/answer', handler: _lazy_XRktNY, lazy: true, middleware: false, method: "post" },
  { route: '/api/application/extract', handler: _lazy_F3iaHt, lazy: true, middleware: false, method: "post" },
  { route: '/api/apply', handler: _lazy_2Na6bp, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/login', handler: _lazy_2djfZ5, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/logout', handler: _lazy_54aupL, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/me', handler: _lazy_MefoMV, lazy: true, middleware: false, method: "get" },
  { route: '/api/auth/register', handler: _lazy_IHzbiI, lazy: true, middleware: false, method: "post" },
  { route: '/api/billing/checkout', handler: _lazy_na1y_1, lazy: true, middleware: false, method: "post" },
  { route: '/api/billing/portal', handler: _lazy_Y7AF3I, lazy: true, middleware: false, method: "post" },
  { route: '/api/billing/webhook', handler: _lazy_zCaBRb, lazy: true, middleware: false, method: "post" },
  { route: '/api/builder/documents', handler: _lazy_ORtd6u, lazy: true, middleware: false, method: "get" },
  { route: '/api/builder/documents/:id', handler: _lazy_iGF1xq, lazy: true, middleware: false, method: "delete" },
  { route: '/api/builder/resume', handler: _lazy_llREi6, lazy: true, middleware: false, method: "post" },
  { route: '/api/builder/resume/:id', handler: _lazy_yHRsKW, lazy: true, middleware: false, method: "get" },
  { route: '/api/builder/resume/:id', handler: _lazy_dRZzPk, lazy: true, middleware: false, method: "put" },
  { route: '/api/documents', handler: _lazy_AA53j0, lazy: true, middleware: false, method: "delete" },
  { route: '/api/documents', handler: _lazy_J2LNDS, lazy: true, middleware: false, method: "get" },
  { route: '/api/documents', handler: _lazy_KznSU8, lazy: true, middleware: false, method: "post" },
  { route: '/api/documents/text', handler: _lazy_miVwYd, lazy: true, middleware: false, method: "post" },
  { route: '/api/health', handler: _lazy_0mR0of, lazy: true, middleware: false, method: "get" },
  { route: '/api/jobs/:id', handler: _lazy_vce0qQ, lazy: true, middleware: false, method: "delete" },
  { route: '/api/jobs/:id', handler: _lazy_QM8L3p, lazy: true, middleware: false, method: "get" },
  { route: '/api/jobs', handler: _lazy_t3L4T3, lazy: true, middleware: false, method: "get" },
  { route: '/api/pdf/download', handler: _lazy_BAYXeZ, lazy: true, middleware: false, method: "post" },
  { route: '/api/portfolio/:id', handler: _lazy_UATxqT, lazy: true, middleware: false, method: "delete" },
  { route: '/api/portfolio/:id', handler: _lazy_WzBYrf, lazy: true, middleware: false, method: "get" },
  { route: '/api/portfolio/:id', handler: _lazy_WM8CnT, lazy: true, middleware: false, method: "put" },
  { route: '/api/portfolio/:id/contact', handler: _lazy_qFSVG6, lazy: true, middleware: false, method: "post" },
  { route: '/api/portfolio/generate', handler: _lazy_Y9EHir, lazy: true, middleware: false, method: "post" },
  { route: '/api/portfolio', handler: _lazy_DFzWe_, lazy: true, middleware: false, method: "get" },
  { route: '/api/portfolio/public/:id', handler: _lazy_LDtmgQ, lazy: true, middleware: false, method: "get" },
  { route: '/api/portfolio/save', handler: _lazy_yS6RIN, lazy: true, middleware: false, method: "post" },
  { route: '/api/saas/credits', handler: _lazy_sQsJ3J, lazy: true, middleware: false, method: "get" },
  { route: '/api/scrape', handler: _lazy_7ms73F, lazy: true, middleware: false, method: "post" },
  { route: '/api/tailor', handler: _lazy_ynl6kq, lazy: true, middleware: false, method: "post" },
  { route: '/__nuxt_error', handler: _lazy_yDJI4L, lazy: true, middleware: false, method: undefined },
  { route: '/api/_auth/session', handler: _YYYIQ6, lazy: false, middleware: false, method: "delete" },
  { route: '/api/_auth/session', handler: ___9__1, lazy: false, middleware: false, method: "get" },
  { route: '/**', handler: _lazy_yDJI4L, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks$1();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp$1.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => b(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return C(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp$1 = createNitroApp();
function useNitroApp() {
  return nitroApp$1;
}
runNitroPlugins(nitroApp$1);

const nitroApp = useNitroApp();
const handler = async (req) => {
  const url = new URL(req.url);
  const relativeUrl = `${url.pathname}${url.search}`;
  const r = await nitroApp.localCall({
    url: relativeUrl,
    headers: req.headers,
    method: req.method,
    body: req.body
  });
  const headers = normalizeResponseHeaders({
    ...getCacheHeaders(url.pathname),
    ...r.headers
  });
  return new Response(r.body, {
    status: r.status,
    headers
  });
};
const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;
function normalizeResponseHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of Object.entries(headers)) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else if (header !== void 0) {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}
function getCacheHeaders(url) {
  const { isr } = getRouteRulesForPath(url);
  if (isr) {
    const maxAge = typeof isr === "number" ? isr : ONE_YEAR_IN_SECONDS;
    const revalidateDirective = typeof isr === "number" ? `stale-while-revalidate=${ONE_YEAR_IN_SECONDS}` : "must-revalidate";
    return {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Netlify-CDN-Cache-Control": `public, max-age=${maxAge}, ${revalidateDirective}, durable`
    };
  }
  return {};
}

export { updatePortfolioForUser as $, readRawBody as A, getUserByStripeCustomerId as B, getUserById as C, setPlanAndCredits as D, setStripeSubscriptionId as E, FREE_CREDITS as F, query as G, getRouterParam as H, getQuery as I, deleteUserDocument as J, assertAllowedUpload as K, extractTextFromUpload as L, saveUserDocument as M, replaceEmDashes as N, deleteJob as O, PRO_CREDITS as P, listRecentJobs as Q, withLayoutState as R, createCoverLetterPdfDocument as S, createResumePdfDocument as T, setHeader as U, renderPdfToNodeStream as V, sendStream as W, renderPdfToBuffer as X, deletePortfolioForUser as Y, getPortfolioForUser as Z, sanitizeProfileData as _, createGeminiClient as a, sendEmail as a0, generatePortfolioFromText as a1, listPortfoliosByUser as a2, createPortfolio as a3, hasScrapeTarget as a4, fetchPageHtml as a5, cleanHtmlForExtraction as a6, shouldUseSearchFallback as a7, searchJobsForUrl as a8, extractJobsFromHtml as a9, createHooks$1 as aA, toRouteMatcher as aB, createRouter$1 as aC, defu as aD, parseQuery as aE, withTrailingSlash as aF, withoutTrailingSlash as aG, getCvFormat as aH, buildCvFormatPreview as aI, CV_FORMATS as aJ, resolveTemplateSlug as aK, normalizeSectionsOrder as aL, DEFAULT_SECTIONS_ORDER as aM, sectionLabel as aN, getRequestURL as aO, EMPTY_CANDIDATE_PROFILE as aP, handler as aQ, filterJobsByTarget as aa, enrichJobsWithFullDescriptions as ab, createScrapeRun as ac, upsertJobs as ad, normalizeCandidateProfile as ae, resolveCandidateProfileSync as af, hasUsableIdentity as ag, tailorApplicationMaterials as ah, stampCandidateIdentity as ai, enforceExperienceBullets as aj, defineRenderHandler as ak, buildAssetsURL as al, publicAssetsURL as am, getRouteRules as an, getResponseStatusText as ao, getResponseStatus as ap, useNitroApp as aq, withQuery as ar, hasProtocol as as, isScriptProtocol as at, joinURL as au, sanitizeStatusCode as av, appendResponseHeader$1 as aw, getContext as ax, $fetch$1 as ay, baseURL as az, getLatestDocuments as b, createError$1 as c, answerApplicationQuestions as d, getGeminiModels as e, extractApplicationForm as f, getJobById as g, readMultipartFormData as h, createDocumentAiClient as i, generateFromPdfResume as j, generateFromJobDescriptionOnly as k, defineEventHandler as l, getUserByEmail as m, setAuthSession as n, clearUserSession as o, requireUser as p, createUser as q, readBody as r, syncAdminRole as s, toPublicUser as t, useRuntimeConfig as u, isDatabaseError as v, withCredits as w, getStripe as x, setStripeCustomerId as y, getHeader as z };
//# sourceMappingURL=nitro.mjs.map
