function Ms(e){let t=Object.values(e).filter((i)=>typeof i==="number");return Object.entries(e).filter(([i,r])=>t.indexOf(+i)===-1).map(([i,r])=>r)}function Ac(e,t="|"){return e.map((n)=>Ic(n)).join(t)}function ws(e,t){if(typeof t==="bigint")return t.toString();return t}class df{constructor(e){this._getter=e,this._value=void 0}get value(){let e=this._getter;if(e!==void 0)this._value=e(),this._getter=void 0;return this._value}}function Po(e){return new df(e)}function pf(e){return e===null||e===void 0}function Lo(e){let t=e.startsWith("^")?1:0,n=e.endsWith("$")?e.length-1:e.length;return e.slice(t,n)}function mf(e,t){let n=e/t,i=Math.round(n),r=4*Number.EPSILON*Math.max(Math.abs(n),1);if(Math.abs(n-i)<r)return 0;return n-i}function Cn(e,t,n){Object.defineProperty(e,t,{value:n,writable:!0,enumerable:!0,configurable:!0})}function No(e){let t=Object.getOwnPropertyDescriptor(e,"shape");return t?.get?t.get.raw:t?.value}function ui(e){return No(e._zod.def)??e._zod.def.shape}function gf(e,t,n){Object.defineProperty(e,t,{get(){let i=n();return Cn(this,t,i),i},enumerable:!0,configurable:!0})}function _f(e,t,n){if(t in e)Cn(e,t,n);else e[t]=n}function sr(e,t,n,i){let r=ui(t);for(let s of n){let o=Object.getOwnPropertyDescriptor(r,s);if(!o.enumerable)continue;if(o.get)gf(e,s,()=>{let a=t._zod.def.shape[s];return i?i(a,s):a});else _f(e,s,i?i(o.value,s):o.value)}}function vv(e,t){for(let n of Reflect.ownKeys(t)){let i=Object.getOwnPropertyDescriptor(t,n);if(!i.enumerable)continue;if(i.get)gf(e,n,()=>t[n]);else _f(e,n,i.value)}}function cn(...e){let t={};for(let n of e){let i=Object.getOwnPropertyDescriptors(n);Object.assign(t,i)}return Object.defineProperties({},t)}function xf(e){return JSON.stringify(e)}function vf(e){return e.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")}var Rc="captureStackTrace"in Error?Error.captureStackTrace:(...e)=>{};function Ss(e){return typeof e==="object"&&e!==null&&!Array.isArray(e)}var yf=Po(()=>{if(Kt.jitless)return!1;if(typeof navigator<"u"&&navigator?.userAgent?.includes("Cloudflare"))return!1;try{return new Function(""),!0}catch(e){return!1}});function or(e){if(Ss(e)===!1)return!1;let t=e.constructor;if(t===void 0)return!0;if(typeof t!=="function")return!0;let n=t.prototype;if(Ss(n)===!1)return!1;if(Object.prototype.hasOwnProperty.call(n,"isPrototypeOf")===!1)return!1;return!0}function Cc(e){if(or(e))return{...e};if(Array.isArray(e))return[...e];if(e instanceof Map)return new Map(e);if(e instanceof Set)return new Set(e);return e}var bf=new Set(["string","number","symbol"]);function Li(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Wn(e,t,n){let i=new e._zod.constr(t??e._zod.def);if(!t||n?.parent)i._zod.parent=e;return i}function Te(e){let t=e;if(!t)return{};if(typeof t==="string")return{error:()=>t};if(t?.message!==void 0){if(t?.error!==void 0)throw Error("Cannot specify both `message` and `error` params");t.error=t.message}if(delete t.message,typeof t.error==="string")return{...t,error:()=>t.error};return t}function Ic(e){if(typeof e==="bigint")return e.toString()+"n";if(typeof e==="string")return`"${e}"`;return`${e}`}function Sf(e){return Object.keys(e).filter((t)=>e[t]._zod.optin!==void 0&&e[t]._zod.optout==="optional")}var Do=(()=>({safeint:[Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],int32:[-2147483648,2147483647],uint32:[0,4294967295],float32:[-340282346638528860000000000000000000000,340282346638528860000000000000000000000],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]}))(),Pc={int64:[BigInt("-9223372036854775808"),BigInt("9223372036854775807")],uint64:[BigInt(0),BigInt("18446744073709551615")]};function yv(e,t){let n=e._zod.def,i=n.checks;if(i&&i.length>0)throw Error(".pick() cannot be used on object schemas containing refinements");let s={};return sr(s,e,Oo(e,t)),Wn(e,cn(n,{shape:s,checks:[]}))}function Oo(e,t){let n=ui(e),i=[];for(let r of Reflect.ownKeys(t)){if(!Object.getOwnPropertyDescriptor(n,r)?.enumerable)throw Error(`Unrecognized key: "${String(r)}"`);if(t[r])i.push(r)}return i}function bv(e,t){let n=e._zod.def,i=n.checks;if(i&&i.length>0)throw Error(".omit() cannot be used on object schemas containing refinements");let s=new Set(Oo(e,t)),o={};return sr(o,e,Reflect.ownKeys(ui(e)).filter((a)=>!s.has(a))),Wn(e,cn(n,{shape:o,checks:[]}))}function Sv(e,t){if(!or(t))throw Error("Invalid input to extend: expected a plain object");let n=e._zod.def.checks;if(n&&n.length>0){let r=ui(e);for(let s of Reflect.ownKeys(t))if(Object.getOwnPropertyDescriptor(r,s)!==void 0)throw Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.")}return Wn(e,cn(e._zod.def,{shape:Mf(e,t)}))}function Mf(e,t){let n={};return sr(n,e,Reflect.ownKeys(ui(e))),vv(n,t),n}function Mv(e,t){if(!or(t))throw Error("Invalid input to safeExtend: expected a plain object");return Wn(e,cn(e._zod.def,{shape:Mf(e,t)}))}function wv(e,t){if(!t?._zod?.def)throw Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");if(e._zod.def.checks?.length)throw Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");let n={};sr(n,e,Reflect.ownKeys(ui(e))),sr(n,t,Reflect.ownKeys(ui(t)));let i=cn(e._zod.def,{shape:n,get catchall(){return t._zod.def.catchall},checks:t._zod.def.checks??[]});return Wn(e,i)}function wf(e,t,n,i="partial"){let s=t._zod.def.checks;if(s&&s.length>0)throw Error(`.${i}() cannot be used on object schemas containing refinements`);let a=n?new Set(Oo(t,n)):void 0,c={};return sr(c,t,Reflect.ownKeys(ui(t)),e&&((l,u)=>a&&!a.has(u)?l:new e({type:"optional",innerType:l}))),Wn(t,cn(t._zod.def,{shape:c,checks:[]}))}function Tv(e,t,n){let i=n?new Set(Oo(t,n)):void 0,r={};return sr(r,t,Reflect.ownKeys(ui(t)),(s,o)=>i&&!i.has(o)?s:new e({type:"nonoptional",innerType:s})),Wn(t,cn(t._zod.def,{shape:r}))}function Zn(e,t=0){if(e.aborted===!0)return!0;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue!==!0)return!0;return!1}function Tf(e,t=0){if(e.aborted===!0)return!0;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue===!1)return!0;return!1}function fi(e,t){return t.map((n)=>{var i;return(i=n).path??(i.path=[]),n.path.unshift(e),n})}function bs(e){return typeof e==="string"?e:e?.message}function Lc(e,t,n){var i;for(let r=t;r<e.length;r++)(i=e[r]).schema??(i.schema=n)}function Xn(e,t,n){var i;let r=e.inst?._zod?.traits;if(r?.has("$ZodType"))if(r.has("$ZodCheck"))(i=e).schema??(i.schema=e.inst);else e.schema=e.inst;let s=e.schema!==e.inst?e.schema?._zod.def?.error:void 0,o=e.message?e.message:bs(e.inst?._zod.def?.error?.(e))??bs(s?.(e))??bs(t?.error?.(e))??bs(n.customError?.(e))??bs(n.localeError?.(e))??"Invalid input",a={};for(let c of Object.keys(e)){if(c==="inst"||c==="schema"||c==="continue"||c==="input"||c==="__proto__")continue;a[c]=e[c]}if(a.path??(a.path=[]),a.message=o,t?.reportInput)a.input=e.input;return a}var Ev=/[\uD800-\uDBFF]/;function Uo(e){let t=e.length;if(!Ev.test(e))return t;let n=t;for(let i=0;i<t-1;i++)if((e.charCodeAt(i)&64512)===55296&&(e.charCodeAt(i+1)&64512)===56320)n--,i++;return n}function Fo(e){if(Array.isArray(e))return"array";if(typeof e==="string")return"string";return"unknown"}function Ef(e){let t=typeof e;switch(t){case"number":return Number.isNaN(e)?"nan":"number";case"object":{if(e===null)return"null";if(Array.isArray(e))return"array";let n=e;if(n&&Object.getPrototypeOf(n)!==Object.prototype&&"constructor"in n&&n.constructor)return n.constructor.name}}return t}function ar(...e){let[t,n,i]=e;if(typeof t==="string")return{message:t,code:"custom",input:n,inst:i};return{...t}}function Af(e,t){for(let n in t){let i=Object.getOwnPropertyDescriptor(t,n);if(i.get)Object.defineProperty(e,n,{...i,enumerable:!1});else ff(e,n,i.value)}for(let n of Object.getOwnPropertySymbols(t))ff(e,n,t[n])}function hi(e,t,n,i=!0){return Object.defineProperty(e,t,{configurable:!0,writable:!0,enumerable:i,value:n}),n}function Nc(e,t,n){return hi(e,t,n,!1)}function Rf(e,t){for(let n in e){let i=e[n];Object.defineProperty(t,n,{configurable:!0,enumerable:!0,get(){return hi(this,n,i(this))},set(r){hi(this,n,r)}})}return t}function ff(e,t,n){Object.defineProperty(e,t,{configurable:!0,get(){return this==null?n:hi(this,t,n.bind(this))},set(i){hi(this,t,i)}})}function Av(e,t){let n=Object.getPrototypeOf(e);return t in n?void 0:n}var Ec,Pi=!1,Rv={configurable:!0,get(){Pi=!0;return}};function nt(e,t,n){let i=Object.getPrototypeOf(e._zod);if(t in i&&Ec!==e._zod){Ec=void 0;return}Ec=e._zod,Object.defineProperty(i,t,{configurable:!0,get(){Object.defineProperty(this,t,Rv);let r=Pi;Pi=!1;try{let s=n(this);if(Pi)delete this[t];else Object.defineProperty(this,t,{configurable:!0,writable:!0,value:s});return Pi=Pi||r,s}catch(s){throw delete this[t],Pi=Pi||r,s}},set(r){Object.defineProperty(this,t,{configurable:!0,writable:!0,value:r})}})}function Cv(e,t,n,i){let r=Av(e,t);if(!r)return;Object.defineProperty(r,t,{configurable:!0,get(){let s={configurable:!0,writable:!0,enumerable:i,value:void 0};return Object.defineProperty(this,t,s),s.value=n(this),Object.defineProperty(this,t,s),s.value},set(s){Object.defineProperty(this,t,{configurable:!0,writable:!0,enumerable:i,value:s})}})}var Iv="~constantCatch";function Cf(e){let t=()=>e;return t[Iv]=!0,t}var If;var Dc={value:void 0,enumerable:!1},Pf="captureStackTrace"in Error?Error:null;function Pv(e){let t=Pf;if(t){let n=t.stackTraceLimit;if(typeof n==="number"){try{t.stackTraceLimit=0}catch{return Pf=null,new e}try{return new e}finally{t.stackTraceLimit=n}}}return new e}function q(e,t,n,i){let r={};function s(f){this.def=f,this.constr=h,this.traits=new Set}s.prototype=r;let o=n,a=o&&new WeakSet;function c(f,d){if(!f._zod){Dc.value=new s(d);try{Object.defineProperty(f,"_zod",Dc)}finally{Dc.value=void 0}}if(f._zod.traits.has(e))return;if(f._zod.traits.add(e),t(f,d),a){let x=Object.getPrototypeOf(f),p=f._zod.constr.prototype,g=x;while(g&&g!==p)g=Object.getPrototypeOf(g);let A=g??x;if(!a.has(A))a.add(A),Af(A,o)}let m=h.prototype;for(let x in m){if(!Object.prototype.hasOwnProperty.call(m,x))continue;if(!(x in f))f[x]=m[x].bind(f)}}let l=i?.Parent??Object;class u extends l{}Object.defineProperty(u,"name",{value:e});function h(f){let d=i?.Parent?Pv(u):this;c(d,f);let m=d._zod.deferred;if(m){for(let p of m)p();d._zod.deferred=void 0}let x=globalThis.__zod_globalConfig?.postProcessor;if(x)x(d);return d}return Object.defineProperty(h,"init",{value:c}),Object.defineProperty(h,Symbol.hasInstance,{value:(f)=>{if(i?.Parent&&f instanceof i.Parent)return!0;return f?._zod?.traits?.has(e)}}),Object.defineProperty(h,"name",{value:e}),h}class qn extends Error{constructor(){super("Encountered Promise during synchronous parse. Use .parseAsync() instead.")}}class Ts extends Error{constructor(e){super(`Encountered unidirectional transform during encode: ${e}`);this.name="ZodEncodeError"}}(If=globalThis).__zod_globalConfig??(If.__zod_globalConfig={});var Kt=globalThis.__zod_globalConfig;function ln(e){if(e)Object.assign(Kt,e);return Kt}function Lv(){let e=this._zod;return e.message??(e.message=JSON.stringify(e.def,ws,2)),e.message}function Nv(e){this._zod.message=e}var Dv={get:Lv,set:Nv,enumerable:!0,configurable:!0},Uc={value:void 0,enumerable:!1},Lf=new WeakSet([Object.prototype,Error.prototype]),Nf=(e,t)=>{e.name="$ZodError",Uc.value=t,Object.defineProperty(e,"issues",Uc),Uc.value=void 0,Object.defineProperty(e,"message",Dv);let n=Object.getPrototypeOf(e);if(!Lf.has(n))Lf.add(n),Object.defineProperty(n,"toString",{configurable:!0,enumerable:!1,get(){let i=()=>this.message;return Object.defineProperty(this,"toString",{value:i,configurable:!0,writable:!0}),i},set(i){Object.defineProperty(this,"toString",{value:i,configurable:!0,writable:!0})}})},Df=q("$ZodError",Nf),d1=q("$ZodError",Nf,void 0,{Parent:Error});function Ov(e,t,n){if(!Object.prototype.hasOwnProperty.call(e,t))if(t==="__proto__")Object.defineProperty(e,t,{value:n(),writable:!0,enumerable:!0,configurable:!0});else e[t]=n();return e[t]}function Of(e,t=(n)=>n.message){let n={},i=[];for(let r of e.issues)if(r.path.length>0)Ov(n,r.path[0],()=>[]).push(t(r));else i.push(t(r));return{formErrors:i,fieldErrors:n}}function Uf(e,t=(n)=>n.message){let n={_errors:[]},i=(r,s=[])=>{for(let o of r.issues)if(o.code==="invalid_union"&&o.errors.length)o.errors.map((a)=>i({issues:a},[...s,...o.path]));else if(o.code==="invalid_key")i({issues:o.issues},[...s,...o.path]);else if(o.code==="invalid_element")i({issues:o.issues},[...s,...o.path]);else{let a=[...s,...o.path];if(a.length===0)n._errors.push(t(o));else{let c=n,l=0;while(l<a.length){let u=a[l],h=l===a.length-1;if(u==="_errors"){if(h)c._errors.push(t(o));l++;continue}if(!Object.prototype.hasOwnProperty.call(c,u))Object.defineProperty(c,u,{value:{_errors:[]},enumerable:!0,writable:!0,configurable:!0});let f=c[u];if(h)f._errors.push(t(o));c=f,l++}}}};return i(e),n}function zo(e,t){return{callee:t?.callee??e,Err:t?.Err}}var ko=(e)=>{let t=(n,i,r,s)=>{let o=r?{...r,async:!1}:{async:!1},a=n._zod.run({value:i,issues:[]},o);if(a instanceof Promise)throw new qn;if(a.issues.length){let c=new(s?.Err??e)(a.issues.map((l)=>Xn(l,o,ln())));throw Rc(c,s?.callee??t),c}return a.value};return t};var Bo=(e)=>{let t=async(n,i,r,s)=>{let o=r?{...r,async:!0}:{async:!0},a=n._zod.run({value:i,issues:[]},o);if(a instanceof Promise)a=await a;if(a.issues.length){let c=new(s?.Err??e)(a.issues.map((l)=>Xn(l,o,ln())));throw Rc(c,s?.callee??t),c}return a.value};return t};var Go=(e)=>(t,n,i)=>{let r=i?{...i,async:!1}:{async:!1},s=t._zod.run({value:n,issues:[]},r);if(s instanceof Promise)throw new qn;return s.issues.length?Ff(e,s.issues,r):{success:!0,data:s.value}};function Ff(e,t,n){let i;return{success:!1,get error(){if(!i)i=new e(t.map((r)=>Xn(r,n,ln()))),t=void 0,n=void 0;return i},set error(r){i=r,t=void 0,n=void 0}}}var Ho=(e)=>async(t,n,i)=>{let r=i?{...i,async:!0}:{async:!0},s=t._zod.run({value:n,issues:[]},r);if(s instanceof Promise)s=await s;return s.issues.length?Ff(e,s.issues,r):{success:!0,data:s.value}};var Uv=Symbol.for("zod.compile.invalid"),Fv=Symbol.for("zod.compile.fallback"),Fc=(e,t,n)=>{let i=e._zod.bag.validator;if(i!==void 0){if(i(t)!==Uv)return!0;if(i.definite===!0&&n===void 0)return!1}return zv(e,t,n)};function zv(e,t,n){let i=n?{...n,async:!1,abortEarly:!0}:{async:!1,abortEarly:!0},r=e._zod.bag.fallbackRun,s;if(r)i[Fv]=!0,s=r({value:t,issues:[]},i);else s=e._zod.run({value:t,issues:[]},i);if(s instanceof Promise)throw new qn;return s.issues.length===0}var zc=async(e,t,n)=>{let i=n?{...n,async:!0,abortEarly:!0}:{async:!0,abortEarly:!0},r=e._zod.run({value:t,issues:[]},i);if(r instanceof Promise)r=await r;return r.issues.length===0},zf=(e)=>{let t=ko(e),n=(i,r,s,o)=>{let a=s?{...s,direction:"backward"}:{direction:"backward"};return t(i,r,a,zo(n,o))};return n};var kf=(e)=>{let t=ko(e),n=(i,r,s,o)=>t(i,r,s,zo(n,o));return n};var Bf=(e)=>{let t=Bo(e),n=async(i,r,s,o)=>{let a=s?{...s,direction:"backward"}:{direction:"backward"};return await t(i,r,a,zo(n,o))};return n};var Gf=(e)=>{let t=Bo(e),n=async(i,r,s,o)=>await t(i,r,s,zo(n,o));return n};var Hf=(e)=>(t,n,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return Go(e)(t,n,r)};var Vf=(e)=>(t,n,i)=>Go(e)(t,n,i);var $f=(e)=>async(t,n,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return Ho(e)(t,n,r)};var Wf=(e)=>async(t,n,i)=>Ho(e)(t,n,i);var Zf=/^[cC][0-9a-z]{6,}$/,Xf=/^[0-9a-z]+$/,qf=/^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/,Yf=/^[0-9a-vA-V]{20}$/,jf=/^[A-Za-z0-9]{27}$/,Jf=/^[a-zA-Z0-9_-]{21}$/;function Kf(e){return new RegExp(`^[a-zA-Z0-9_-]{${e}}$`)}var Qf=/^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;var ed=/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,Bc=(e)=>{if(!e)return/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`)};var td=/^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;var kv="^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$";function nd(){return new RegExp(kv,"u")}var id=/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,rd=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;var sd=/^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,od=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,ad=/^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,cd=/^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;var ld=/^https?$/,ud=/^\+[1-9]\d{6,14}$/;var hd="(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))";function Bv(e){return new RegExp(`^${e}$`)}var fd=Bv(hd);function kc(e){return typeof e.precision==="number"?e.precision===-1?"(?:[01]\\d|2[0-3]):[0-5]\\d":e.precision===0?"(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d":`(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d\\.\\d{${e.precision}}`:e.seconds?"(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?":"(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?"}function dd(e){return new RegExp(`^${kc(e)}$`)}function pd(e){let t=["Z"];if(e.offset)t.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");let n=`${kc({precision:e.precision,seconds:!0})}(?:${t.join("|")})`,i=e.local?`${n}|${kc({precision:e.precision})}`:n;return new RegExp(`^${hd}T(?:${i})$`)}var md=/^[\s\S]{0,}$/;var Gc=/^-?\d+$/,Es=/^-?\d+(?:\.\d+)?$/,gd=/^(?:true|false)$/i;var _d=/^[^A-Z]*$/,xd=/^[^a-z]*$/;var kt=q("$ZodCheck",(e,t)=>{var n;e._zod??(e._zod={}),e._zod.def=t,(n=e._zod).onattach??(n.onattach=[])});var Hc=(e)=>{let t=e.value;return!pf(t)&&t.length!==void 0},Vo={number:"number",bigint:"bigint",object:"date"},Vc=q("$ZodCheckLessThan",(e,t)=>{kt.init(e,t);let n=Vo[typeof t.value];e._zod.check=(i)=>{if(t.inclusive?i.value<=t.value:i.value<t.value)return;i.issues.push({origin:Vo[typeof i.value]??n,code:"too_big",maximum:typeof t.value==="object"?t.value.getTime():t.value,input:i.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),$c=q("$ZodCheckGreaterThan",(e,t)=>{kt.init(e,t);let n=Vo[typeof t.value];e._zod.check=(i)=>{if(t.inclusive?i.value>=t.value:i.value>t.value)return;i.issues.push({origin:Vo[typeof i.value]??n,code:"too_small",minimum:typeof t.value==="object"?t.value.getTime():t.value,input:i.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),vd=q("$ZodCheckMultipleOf",(e,t)=>{kt.init(e,t),e._zod.check=(n)=>{if(typeof n.value!==typeof t.value)throw Error("Cannot mix number and bigint in multiple_of check.");if(typeof n.value==="bigint"?t.value!==BigInt(0)&&n.value%t.value===BigInt(0):mf(n.value,t.value)===0)return;n.issues.push({origin:typeof n.value,code:"not_multiple_of",divisor:t.value,input:n.value,inst:e,continue:!t.abort})}}),yd=q("$ZodCheckNumberFormat",(e,t)=>{kt.init(e,t),t.format=t.format||"float64";let n=t.format?.includes("int"),i=n?"int":"number",[r,s]=Do[t.format];e._zod.check=(o)=>{let a=o.value;if(n){if(!Number.isInteger(a)){o.issues.push({expected:i,format:t.format,code:"invalid_type",continue:!1,input:a,inst:e});return}if(!Number.isSafeInteger(a)){if(a>0)o.issues.push({input:a,code:"too_big",maximum:Number.MAX_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:i,inclusive:!0,continue:!t.abort});else o.issues.push({input:a,code:"too_small",minimum:Number.MIN_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:i,inclusive:!0,continue:!t.abort});return}}if(a<r)o.issues.push({origin:"number",input:a,code:"too_small",minimum:r,inclusive:!0,inst:e,continue:!t.abort});if(a>s)o.issues.push({origin:"number",input:a,code:"too_big",maximum:s,inclusive:!0,inst:e,continue:!t.abort})}});var bd=q("$ZodCheckMaxLength",(e,t)=>{var n;kt.init(e,t),(n=e._zod.def).when??(n.when=Hc),e._zod.check=(i)=>{let r=i.value,s=r.length;if((typeof r==="string"&&s>t.maximum?Uo(r):s)<=t.maximum)return;let a=Fo(r);i.issues.push({origin:a,code:"too_big",maximum:t.maximum,inclusive:!0,input:r,inst:e,continue:!t.abort})}}),Sd=q("$ZodCheckMinLength",(e,t)=>{var n;kt.init(e,t),(n=e._zod.def).when??(n.when=Hc),e._zod.check=(i)=>{let r=i.value,s=r.length;if((typeof r==="string"&&s>=t.minimum&&s<t.minimum*2?Uo(r):s)>=t.minimum)return;let a=Fo(r);i.issues.push({origin:a,code:"too_small",minimum:t.minimum,inclusive:!0,input:r,inst:e,continue:!t.abort})}}),Md=q("$ZodCheckLengthEquals",(e,t)=>{var n;kt.init(e,t),(n=e._zod.def).when??(n.when=Hc),e._zod.check=(i)=>{let r=i.value,s=r.length,o=typeof r==="string"&&s>=t.length&&s<=t.length*2?Uo(r):s;if(o===t.length)return;let a=Fo(r),c=o>t.length;i.issues.push({origin:a,...c?{code:"too_big",maximum:t.length}:{code:"too_small",minimum:t.length},inclusive:!0,exact:!0,input:i.value,inst:e,continue:!t.abort})}}),Rs=q("$ZodCheckStringFormat",(e,t)=>{var n,i;if(kt.init(e,t),t.pattern)(n=e._zod).check??(n.check=(r)=>{if(t.pattern.lastIndex=0,t.pattern.test(r.value))return;r.issues.push({origin:"string",code:"invalid_format",format:t.format,input:r.value,...t.pattern?{pattern:t.pattern.toString()}:{},inst:e,continue:!t.abort})});else(i=e._zod).check??(i.check=()=>{})}),wd=q("$ZodCheckRegex",(e,t)=>{Rs.init(e,t),e._zod.check=(n)=>{if(t.pattern.lastIndex=0,t.pattern.test(n.value))return;n.issues.push({origin:"string",code:"invalid_format",format:"regex",input:n.value,pattern:t.pattern.toString(),inst:e,continue:!t.abort})}}),Td=q("$ZodCheckLowerCase",(e,t)=>{t.pattern??(t.pattern=_d),Rs.init(e,t)}),Ed=q("$ZodCheckUpperCase",(e,t)=>{t.pattern??(t.pattern=xd),Rs.init(e,t)}),Ad=q("$ZodCheckIncludes",(e,t)=>{kt.init(e,t);let n=Li(t.includes),i=new RegExp(typeof t.position==="number"?`^.{${t.position},}${n}`:n);t.pattern=i,e._zod.check=(r)=>{if(r.value.includes(t.includes,t.position))return;r.issues.push({origin:"string",code:"invalid_format",format:"includes",includes:t.includes,input:r.value,inst:e,continue:!t.abort})}}),Rd=q("$ZodCheckStartsWith",(e,t)=>{kt.init(e,t);let n=new RegExp(`^${Li(t.prefix)}.*`);t.pattern??(t.pattern=n),e._zod.check=(i)=>{if(i.value.startsWith(t.prefix))return;i.issues.push({origin:"string",code:"invalid_format",format:"starts_with",prefix:t.prefix,input:i.value,inst:e,continue:!t.abort})}}),Cd=q("$ZodCheckEndsWith",(e,t)=>{kt.init(e,t);let n=new RegExp(`.*${Li(t.suffix)}$`);t.pattern??(t.pattern=n),e._zod.check=(i)=>{if(i.value.endsWith(t.suffix))return;i.issues.push({origin:"string",code:"invalid_format",format:"ends_with",suffix:t.suffix,input:i.value,inst:e,continue:!t.abort})}});var Id=q("$ZodCheckOverwrite",(e,t)=>{kt.init(e,t),e._zod.check=(n)=>{n.value=t.tx(n.value)}});class Wc{constructor(e=[],t={}){this.content=[],this.indent=0,this.args=e,this.closed=t}indented(e){this.indent+=1;try{e(this)}finally{this.indent-=1}}write(e){if(typeof e==="function"){e(this,{execution:"sync"}),e(this,{execution:"async"});return}let n=e.split(`
`).filter((s)=>s),i=Math.min(...n.map((s)=>s.length-s.trimStart().length)),r=n.map((s)=>s.slice(i)).map((s)=>" ".repeat(this.indent*2)+s);for(let s of r)this.content.push(s)}compile(){let e=Function,t=this?.content??[""];return new e(...Object.keys(this.closed),`return function (${this.args.join(", ")}) {
${t.join(`
`)}
};`)(...Object.values(this.closed))}}var Ld={major:4,minor:6,patch:2};var _t=q("$ZodType",(e,t)=>{var n;e??(e={}),e._zod.def=t,e._zod.bag=e._zod.bag||{},e._zod.version=Ld;let i=e._zod.def.checks,r=e._zod.traits.has("$ZodCheck")?[e,...i??[]]:i?.length?[...i]:[];for(let s of r)for(let o of s._zod.onattach)o(e);if(r.length===0)(n=e._zod).deferred??(n.deferred=[]),e._zod.deferred?.push(()=>{e._zod.run=e._zod.parse});else{let s=(a,c,l)=>{if(a.memo)return a;let u=Zn(a),h;for(let f of c){if(f._zod.def.when){if(Tf(a))continue;if(!f._zod.def.when(a))continue}else if(u)continue;let d=a.issues.length,m=f._zod.check(a);if(m instanceof Promise&&l?.async===!1)throw new qn;if(h||m instanceof Promise)h=(h??Promise.resolve()).then(async()=>{if(await m,a.issues.length===d)return;if(Lc(a.issues,d,e),!u)u=Zn(a,d)});else{if(a.issues.length===d)continue;if(Lc(a.issues,d,e),!u)u=Zn(a,d)}}if(h)return h.then(()=>a);return a},o=(a,c,l)=>{if(Zn(a))return a.aborted=!0,a;let u=s(c,r,l);if(u instanceof Promise){if(l.async===!1)throw new qn;return u.then((h)=>e._zod.parse(h,l))}return e._zod.parse(u,l)};e._zod.run=(a,c)=>{if(c.skipChecks)return e._zod.parse(a,c);if(c.direction==="backward"){let u=e._zod.parse({value:a.value,issues:[]},{...c,skipChecks:!0});if(u instanceof Promise)return u.then((h)=>o(h,a,c));return o(u,a,c)}let l=e._zod.parse(a,c);if(l instanceof Promise){if(c.async===!1)throw new qn;return l.then((u)=>s(u,r,c))}return s(l,r,c)}}},{get "~standard"(){return Nc(this,"~standard",Xc(this))},set "~standard"(e){hi(this,"~standard",e)}}),Vd=(e,t)=>e.issues.length?{issues:e.issues.map((n)=>Xn(n,t,ln()))}:{value:e.value};async function Gv(e,t){let n={async:!0};return Vd(await e._zod.run({value:t,issues:[]},n),n)}function Xc(e){return{validate:(t)=>{let n={async:!1};try{let i=e._zod.run({value:t,issues:[]},n);if(!(i instanceof Promise))return Vd(i,n)}catch(i){}return Gv(e,t)},vendor:"zod",version:1}}var Zo=q("$ZodString",(e,t)=>{_t.init(e,t),e._zod.pattern=t.pattern??md,e._zod.parse=(n,i)=>{if(t.coerce)try{n.value=String(n.value)}catch(r){}if(typeof n.value==="string")return n;return n.issues.push({expected:"string",code:"invalid_type",input:n.value,inst:e}),n}}),xt=q("$ZodStringFormat",(e,t)=>{Rs.init(e,t),Zo.init(e,t)}),$d=q("$ZodGUID",(e,t)=>{t.pattern??(t.pattern=ed),xt.init(e,t)}),Wd=q("$ZodUUID",(e,t)=>{if(t.version){let i={v1:1,v2:2,v3:3,v4:4,v5:5,v6:6,v7:7,v8:8}[t.version];if(i===void 0)throw Error(`Invalid UUID version: "${t.version}"`);t.pattern??(t.pattern=Bc(i))}else t.pattern??(t.pattern=Bc());xt.init(e,t)}),Zd=q("$ZodEmail",(e,t)=>{t.pattern??(t.pattern=td),xt.init(e,t)}),Xd=1,qd=2;function Hv(e,t){if(!t.normalize&&t.protocol?.source===ld.source&&!/^https?:\/\//i.test(e))return Xd;try{return new URL(e)}catch{return qd}}var Vv=/[\t\n\r]/g;function $v(e){return e.replace(Vv,"")}function Wv(e,t){return t.lastIndex=0,t.test(e.hostname)}function Zv(e,t){return t.lastIndex=0,t.test(e.protocol.endsWith(":")?e.protocol.slice(0,-1):e.protocol)}var Yd=q("$ZodURL",(e,t)=>{xt.init(e,t),e._zod.check=(n)=>{try{let i=n.value.trim(),r=Hv(i,t);if(r===Xd){n.issues.push({code:"invalid_format",format:"url",note:"Invalid URL format",input:n.value,inst:e,continue:!t.abort});return}if(r===qd){n.issues.push({code:"invalid_format",format:"url",input:n.value,inst:e,continue:!t.abort});return}if(t.hostname&&!Wv(r,t.hostname))n.issues.push({code:"invalid_format",format:"url",note:"Invalid hostname",pattern:t.hostname.source,input:n.value,inst:e,continue:!t.abort});if(t.protocol&&!Zv(r,t.protocol))n.issues.push({code:"invalid_format",format:"url",note:"Invalid protocol",pattern:t.protocol.source,input:n.value,inst:e,continue:!t.abort});n.value=t.normalize?r.href:$v(i);return}catch(i){n.issues.push({code:"invalid_format",format:"url",input:n.value,inst:e,continue:!t.abort})}}}),jd=q("$ZodEmoji",(e,t)=>{t.pattern??(t.pattern=nd()),xt.init(e,t)}),Jd=q("$ZodNanoID",(e,t)=>{if(t.length!==void 0&&(!Number.isInteger(t.length)||t.length<1))throw Error(`Invalid nanoid length: ${t.length}`);t.pattern??(t.pattern=t.length===void 0?Jf:Kf(t.length)),xt.init(e,t)}),Kd=q("$ZodCUID",(e,t)=>{t.pattern??(t.pattern=Zf),xt.init(e,t)}),Qd=q("$ZodCUID2",(e,t)=>{t.pattern??(t.pattern=Xf),xt.init(e,t)}),ep=q("$ZodULID",(e,t)=>{t.pattern??(t.pattern=qf),xt.init(e,t)}),tp=q("$ZodXID",(e,t)=>{t.pattern??(t.pattern=Yf),xt.init(e,t)}),np=q("$ZodKSUID",(e,t)=>{t.pattern??(t.pattern=jf),xt.init(e,t)}),ip=q("$ZodISODateTime",(e,t)=>{t.pattern??(t.pattern=pd(t)),xt.init(e,t)}),rp=q("$ZodISODate",(e,t)=>{t.pattern??(t.pattern=fd),xt.init(e,t)}),sp=q("$ZodISOTime",(e,t)=>{t.pattern??(t.pattern=dd(t)),xt.init(e,t)}),op=q("$ZodISODuration",(e,t)=>{t.pattern??(t.pattern=Qf),xt.init(e,t)}),ap=q("$ZodIPv4",(e,t)=>{t.pattern??(t.pattern=id),xt.init(e,t)}),Xv=/^[0-9a-fA-F:.]+$/;function cp(e){if(!Xv.test(e))return!1;try{return new URL(`http://[${e}]`),!0}catch{return!1}}var lp=q("$ZodIPv6",(e,t)=>{t.pattern??(t.pattern=rd),xt.init(e,t),e._zod.check=(n)=>{if(!cp(n.value))n.issues.push({code:"invalid_format",format:"ipv6",input:n.value,inst:e,continue:!t.abort})}});var up=q("$ZodCIDRv4",(e,t)=>{t.pattern??(t.pattern=sd),xt.init(e,t)});function qv(e){let t=e.split("/");if(t.length!==2)return!1;let[n,i]=t;if(!i)return!1;let r=Number(i);if(`${r}`!==i)return!1;if(r<0||r>128)return!1;return cp(n)}var hp=q("$ZodCIDRv6",(e,t)=>{t.pattern??(t.pattern=od),xt.init(e,t),e._zod.check=(n)=>{if(!qv(n.value))n.issues.push({code:"invalid_format",format:"cidrv6",input:n.value,inst:e,continue:!t.abort})}});function fp(e){if(e==="")return!0;if(/\s/.test(e))return!1;if(e.length%4!==0)return!1;try{return atob(e),!0}catch{return!1}}var qc=/^[0-9a-zA-Z+/]*={0,2}$/,dp=q("$ZodBase64",(e,t)=>{t.pattern??(t.pattern=qc),xt.init(e,t),e._zod.check=(n)=>{if(fp(n.value))return;n.issues.push({code:"invalid_format",format:"base64",input:n.value,inst:e,continue:!t.abort})}}),Xo=/^[A-Za-z0-9_-]*$/;function Yv(e){if(!Xo.test(e))return!1;let t=e.replace(/[-_]/g,(i)=>i==="-"?"+":"/"),n=t.padEnd(Math.ceil(t.length/4)*4,"=");return fp(n)}var pp=q("$ZodBase64URL",(e,t)=>{t.pattern??(t.pattern=Xo),xt.init(e,t),e._zod.check=(n)=>{if(Yv(n.value))return;n.issues.push({code:"invalid_format",format:"base64url",input:n.value,inst:e,continue:!t.abort})}}),mp=q("$ZodE164",(e,t)=>{t.pattern??(t.pattern=ud),xt.init(e,t)});function jv(e,t=null){try{let n=e.split(".");if(n.length!==3)return!1;let[i]=n;if(!i)return!1;let r=JSON.parse(atob(i));if("typ"in r&&r?.typ!=="JWT")return!1;if(!r.alg)return!1;if(t&&(!("alg"in r)||r.alg!==t))return!1;return!0}catch{return!1}}var gp=q("$ZodJWT",(e,t)=>{xt.init(e,t),e._zod.check=(n)=>{if(jv(n.value,t.alg))return;n.issues.push({code:"invalid_format",format:"jwt",input:n.value,inst:e,continue:!t.abort})}});var Yc=q("$ZodNumber",(e,t)=>{_t.init(e,t),e._zod.pattern=Es,e._zod.parse=(n,i)=>{if(t.coerce)try{n.value=Number(n.value)}catch(o){}let r=n.value;if(typeof r==="number"&&!Number.isNaN(r)&&Number.isFinite(r))return n;let s=typeof r==="number"?Number.isNaN(r)?"NaN":!Number.isFinite(r)?String(r):void 0:void 0;return n.issues.push({expected:"number",code:"invalid_type",input:r,inst:e,...s?{received:s}:{}}),n}}),_p=q("$ZodNumberFormat",(e,t)=>{yd.init(e,t),Yc.init(e,t)}),xp=q("$ZodBoolean",(e,t)=>{_t.init(e,t),e._zod.pattern=gd,e._zod.parse=(n,i)=>{if(t.coerce)try{n.value=Boolean(n.value)}catch(s){}let r=n.value;if(typeof r==="boolean")return n;return n.issues.push({expected:"boolean",code:"invalid_type",input:r,inst:e}),n}});var vp=q("$ZodUnknown",(e,t)=>{_t.init(e,t),e._zod.parse=(n)=>n}),yp=q("$ZodNever",(e,t)=>{_t.init(e,t),e._zod.parse=(n,i)=>(n.issues.push({expected:"never",code:"invalid_type",input:n.value,inst:e}),n)});function Nd(e,t,n){if(e.issues.length)t.issues.push(...fi(n,e.issues));t.value[n]=e.value}var bp=q("$ZodArray",(e,t)=>{_t.init(e,t);let n=Kt.memoizer;n?.attach(e),e._zod.parse=(i,r)=>{let s=i.value;if(!Array.isArray(s))return i.issues.push({expected:"array",code:"invalid_type",input:s,inst:e}),i;i.value=n?n.alloc(e,i,Array(s.length),r):Array(s.length);let o=[],a=r?.abortEarly;for(let c=0;c<s.length;c++){let l=s[c],u=t.element._zod.run({value:l,issues:[]},r);if(u instanceof Promise)o.push(u.then((h)=>Nd(h,i,c)));else if(Nd(u,i,c),a&&u.issues.length!==0&&Zn(u))break}if(o.length)return Promise.all(o).then(()=>i);return i}});function Wo(e,t,n,i,r,s){let o=n in i,a=s==="optional";if(!o&&a&&r==="optional")return;if(e.issues.length){if(r!==void 0&&a&&!o)return;t.issues.push(...fi(n,e.issues))}if(!o&&r===void 0){if(!e.issues.length)t.issues.push({code:"invalid_type",expected:"nonoptional",input:void 0,path:[n]});return}if(e.value===void 0){if(o||r==="defaulted"&&!a)t.value[n]=void 0}else t.value[n]=e.value}var Jv=[];function Sp(e){let t=Object.keys(e.shape),n=Object.getOwnPropertySymbols(e.shape),i=n.length?n:Jv,r=i.length?[...t,...i]:t;for(let o of r)if(!e.shape?.[o]?._zod?.traits?.has("$ZodType"))throw Error(`Invalid element at key "${String(o)}": expected a Zod schema`);let s=Sf(e.shape);return{...e,allKeys:r,symbolKeys:i,keySet:new Set(t),numKeys:t.length,optionalKeys:new Set(s)}}function Mp(e,t,n,i,r,s,o){let a=[],c=r.keySet,l=r.catchall._zod,u=l.def.type,{optin:h,optout:f}=l,d=0;for(let m in t){if(o&&n.issues.length!==d){if(Zn(n,d))break;d=n.issues.length}if(c.has(m))continue;if(m==="__proto__"){if(u==="never")a.push(m);continue}if(u==="never"){a.push(m);continue}let x=l.run({value:t[m],issues:[]},i);if(x instanceof Promise)e.push(x.then((p)=>Wo(p,n,m,t,h,f)));else Wo(x,n,m,t,h,f)}if(a.length)n.issues.push({code:"unrecognized_keys",keys:a,input:t,inst:s,continue:!0});if(!e.length)return n;return Promise.all(e).then(()=>n)}var Kv=q("$ZodObject",(e,t)=>{_t.init(e,t);let n=Object.getOwnPropertyDescriptor(t,"shape"),i=n?.get?n.get.raw:t.shape??{};if(i){let l=()=>{let u={...i};return Object.defineProperty(t,"shape",{value:u}),l.raw=u,u};l.raw=i,Object.defineProperty(t,"shape",{get:l})}let r=Po(()=>Sp(t));nt(e,"propValues",(l)=>{let u=l.def.shape,h={};for(let f in u){let d=u[f]._zod;if(d.values){if(!Object.prototype.hasOwnProperty.call(h,f))Cn(h,f,new Set);for(let m of d.values)h[f].add(m);if(d.optin!==void 0)h[f].add(void 0)}}return h});let s=Ss,o=t.catchall,a,c=Kt.memoizer;c?.attach(e),e._zod.parse=(l,u)=>{a??(a=r.value);let h=l.value;if(!s(h))return l.issues.push({expected:"object",code:"invalid_type",input:h,inst:e}),l;l.value=c?c.alloc(e,l,{},u):{};let f=[],d=a.shape,m=u?.abortEarly,x=l.issues.length;for(let p of a.allKeys){if(m&&l.issues.length!==x){if(Zn(l,x))break;x=l.issues.length}if(p==="__proto__")continue;let g=d[p],A=g._zod.optin,E=g._zod.optout,y=g._zod.run({value:h[p],issues:[]},u);if(y instanceof Promise)f.push(y.then((w)=>Wo(w,l,p,h,A,E)));else Wo(y,l,p,h,A,E)}if(!o)return f.length?Promise.all(f).then(()=>l):l;return Mp(f,h,l,u,r.value,e,m===!0)}}),wp=q("$ZodObjectJIT",(e,t)=>{Kv.init(e,t);let n=e._zod.parse,i=Po(()=>Sp(t)),r=Kt.memoizer,s=(d)=>{let m=i.value,x=m.symbolKeys,p=new Wc(["payload","ctx"],{shape:d,inst:e,memo:r,syms:x}),g=(w)=>`shape[${w}]._zod.run({ value: input[${w}], issues: [] }, ctx)`,A=(w,T)=>`
          let ${w}_ab = false;
          for (let i = 0; i < ${w}.issues.length; i++) {
            const iss = ${w}.issues[i];
            iss.path = iss.path ? [${T}, ...iss.path] : [${T}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${w}_ab = true;
          }
          if (${w}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;p.write("const input = payload.value;");let E=Object.create(null),y=0;for(let w of m.allKeys)E[w]=`key_${y++}`;p.write(r?"const newResult = memo.alloc(inst, payload, {}, ctx);":"const newResult = {};");for(let w of m.allKeys){if(w==="__proto__")continue;let T=E[w],R=typeof w==="symbol"?`syms[${x.indexOf(w)}]`:xf(w),_=`${R} in input`,S=d[w],U=S?._zod?.optin,C=U!==void 0,z=S?._zod?.optout==="optional";if(p.write(`const ${T} = ${g(R)};`),C&&z){let j=U==="optional"?`${T}_present`:`${T}.value !== undefined || ${T}_present`;p.write(`
        const ${T}_present = ${_};
        if (!${T}.issues.length || ${T}_present) {
          if (${T}.issues.length) {${A(T,R)}
          }

          if (${j}) {
            newResult[${R}] = ${T}.value;
          }
        }

      `)}else if(!C)p.write(`
        const ${T}_present = ${_};
        if (${T}.issues.length) {${A(T,R)}
        }
        if (!${T}_present && !${T}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${R}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${T}_present) {
          newResult[${R}] = ${T}.value;
        }

      `);else if(p.write(`
        if (${T}.issues.length) {${A(T,R)}
        }
      `),U==="defaulted")p.write(`newResult[${R}] = ${T}.value;`);else p.write(`
        if (${T}.value !== undefined || ${_}) {
          newResult[${R}] = ${T}.value;
        }
      `)}return p.write("payload.value = newResult;"),p.write("return payload;"),p.compile()},o,a=Ss,c=!Kt.jitless,u=c&&yf.value,h=t.catchall,f;e._zod.parse=(d,m)=>{f??(f=i.value);let x=d.value;if(!a(x))return d.issues.push({expected:"object",code:"invalid_type",input:x,inst:e}),d;if(c&&u&&m?.async===!1&&m.jitless!==!0){if(!o)o=s(t.shape);if(d=o(d,m),!h)return d;return Mp([],x,d,m,f,e,m?.abortEarly===!0)}return n(d,m)}});function Dd(e,t,n,i){for(let s of e)if(s.issues.length===0)return t.value=s.value,t;let r=e.filter((s)=>!Zn(s));if(r.length===1)return t.value=r[0].value,r[0];return t.issues.push({code:"invalid_union",input:t.value,inst:n,errors:e.map((s)=>s.issues.map((o)=>Xn(o,i,ln())))}),t}var Tp=q("$ZodUnion",(e,t)=>{_t.init(e,t),nt(e,"optin",(i)=>i.def.options.some((r)=>r._zod.optin==="defaulted")?"defaulted":i.def.options.some((r)=>r._zod.optin!==void 0)?"optional":void 0),nt(e,"optout",(i)=>i.def.options.some((r)=>r._zod.optout==="optional")?"optional":void 0),nt(e,"values",(i)=>{if(i.def.options.every((r)=>r._zod.values))return new Set(i.def.options.flatMap((r)=>Array.from(r._zod.values)));return}),nt(e,"pattern",(i)=>{if(i.def.options.every((r)=>r._zod.pattern)){let r=i.def.options.map((s)=>s._zod.pattern);return new RegExp(`^(${r.map((s)=>Lo(s.source)).join("|")})$`)}return});let n=t.options.length===1?t.options[0]._zod.run:null;e._zod.parse=(i,r)=>{if(n)return n(i,r);let s=!1,o=[];for(let a of t.options){let c=a._zod.run({value:i.value,issues:[]},r);if(c instanceof Promise)o.push(c),s=!0;else{if(c.issues.length===0)return c;o.push(c)}}if(!s)return Dd(o,i,e,r);return Promise.all(o).then((a)=>Dd(a,i,e,r))}});var Ep=q("$ZodIntersection",(e,t)=>{_t.init(e,t),e._zod.parse=(n,i)=>{let r=n.value,s=t.left._zod.run({value:r,issues:[]},i),o=t.right._zod.run({value:r,issues:[]},i);if(s instanceof Promise||o instanceof Promise)return Promise.all([s,o]).then(([c,l])=>Od(n,c,l));return Od(n,s,o)}});function Zc(e,t){if(e===t)return{valid:!0,data:e};if(e instanceof Date&&t instanceof Date&&+e===+t)return{valid:!0,data:e};if(or(e)&&or(t)){let n=Object.keys(t),i=Object.keys(e).filter((s)=>n.indexOf(s)!==-1),r={...e,...t};if(Object.prototype.hasOwnProperty.call(r,"__proto__"))delete r.__proto__;for(let s of i){if(s==="__proto__")continue;let o=Zc(e[s],t[s]);if(!o.valid)return{valid:!1,mergeErrorPath:[s,...o.mergeErrorPath]};r[s]=o.data}return{valid:!0,data:r}}if(Array.isArray(e)&&Array.isArray(t)){if(e.length!==t.length)return{valid:!1,mergeErrorPath:[]};let n=[];for(let i=0;i<e.length;i++){let r=e[i],s=t[i],o=Zc(r,s);if(!o.valid)return{valid:!1,mergeErrorPath:[i,...o.mergeErrorPath]};n.push(o.data)}return{valid:!0,data:n}}return{valid:!1,mergeErrorPath:[]}}function Od(e,t,n){let i=new Map,r,s=new Map,o=(l,u)=>{let h;if(l.code==="unrecognized_keys"&&!l.path?.length)r??(r=l),h=l.keys;else if(l.code==="invalid_key"&&l.origin==="record"&&l.path?.length===1){let f=String(l.path[0]);if(!s.has(f))s.set(f,l);h=[f]}else return!1;for(let f of h){if(!i.has(f))i.set(f,{});i.get(f)[u]=!0}return!0};for(let l of t.issues)if(!o(l,"l"))e.issues.push(l);for(let l of n.issues)if(!o(l,"r"))e.issues.push(l);let a=[...i].filter(([,l])=>l.l&&l.r).map(([l])=>l);if(a.length){let l=r?a.filter((u)=>r.keys.includes(u)):[];if(l.length)e.issues.push({...r,keys:l});for(let u of a)if(!l.includes(u)&&s.has(u))e.issues.push(s.get(u))}let c=Zc(t.value,n.value);if(!c.valid){if(Zn(e))return e;throw Error(`Unmergable intersection. Error path: ${JSON.stringify(c.mergeErrorPath)}`)}return e.value=c.data,e}var Ap=q("$ZodRecord",(e,t)=>{_t.init(e,t);let n=Kt.memoizer;n?.attach(e),e._zod.parse=(i,r)=>{let s=i.value;if(!or(s))return i.issues.push({expected:"record",code:"invalid_type",input:s,inst:e}),i;let o=[],a=t.keyType._zod.values;if(a&&!t.partial){i.value=n?n.alloc(e,i,{},r):{};let c=new Set;for(let u of a)if(typeof u==="string"||typeof u==="number"||typeof u==="symbol"){if(c.add(typeof u==="number"?u.toString():u),u==="__proto__")continue;let h=t.keyType._zod.run({value:u,issues:[]},r);if(h instanceof Promise)throw Error("Async schemas not supported in object keys currently");if(h.issues.length){i.issues.push({code:"invalid_key",origin:"record",issues:h.issues.map((m)=>Xn(m,r,ln())),input:u,path:[u],inst:e});continue}let f=h.value;if(f==="__proto__")continue;let d=t.valueType._zod.run({value:s[u],issues:[]},r);if(d instanceof Promise)o.push(d.then((m)=>{if(m.issues.length)i.issues.push(...fi(u,m.issues));i.value[f]=m.value}));else{if(d.issues.length)i.issues.push(...fi(u,d.issues));i.value[f]=d.value}}let l;for(let u in s)if(!c.has(u))if(t.mode==="loose"){if(u==="__proto__")continue;i.value[u]=s[u]}else l=l??[],l.push(u);if(l&&l.length>0)i.issues.push({code:"unrecognized_keys",input:s,inst:e,keys:l,continue:!0})}else{i.value=n?n.alloc(e,i,{},r):{};let c;for(let l of Reflect.ownKeys(s)){if(l==="__proto__")continue;if(!Object.prototype.propertyIsEnumerable.call(s,l))continue;let u=t.keyType._zod.run({value:l,issues:[]},r);if(u instanceof Promise)throw Error("Async schemas not supported in object keys currently");if(typeof l==="string"&&Es.test(l)&&u.issues.length){let m=t.keyType._zod.run({value:Number(l),issues:[]},r);if(m instanceof Promise)throw Error("Async schemas not supported in object keys currently");if(m.issues.length===0)u=m}if(u.issues.length){if(t.mode==="loose")i.value[l]=s[l];else if(a)c=c??[],c.push(l);else i.issues.push({code:"invalid_key",origin:"record",issues:u.issues.map((m)=>Xn(m,r,ln())),input:l,path:[l],inst:e});continue}let f=u.value;if(f==="__proto__")continue;let d=t.valueType._zod.run({value:s[l],issues:[]},r);if(d instanceof Promise)o.push(d.then((m)=>{if(m.issues.length)i.issues.push(...fi(l,m.issues));i.value[f]=m.value}));else{if(d.issues.length)i.issues.push(...fi(l,d.issues));i.value[f]=d.value}}if(c&&c.length>0)i.issues.push({code:"unrecognized_keys",input:s,inst:e,keys:c,continue:!0})}if(o.length)return Promise.all(o).then(()=>i);return i}});var Rp=q("$ZodEnum",(e,t)=>{_t.init(e,t);let n=Ms(t.entries),i=new Set(n);e._zod.values=i,nt(e,"pattern",(r)=>{let s=Ms(r.def.entries).filter((o)=>bf.has(typeof o));return new RegExp(s.length?`^(${s.map((o)=>Li(o.toString())).join("|")})$`:"^[^\\s\\S]$")}),e._zod.parse=(r,s)=>{let o=r.value;if(i.has(o))return r;return r.issues.push({code:"invalid_value",values:n,input:o,inst:e}),r}}),Cp=q("$ZodLiteral",(e,t)=>{_t.init(e,t);let n=new Set(t.values);e._zod.values=n,nt(e,"pattern",(i)=>{let r=i.def.values;return new RegExp(r.length?`^(${r.map((s)=>typeof s==="string"?Li(s):s?Li(s.toString()):String(s)).join("|")})$`:"^[^\\s\\S]$")}),e._zod.parse=(i,r)=>{let s=i.value;if(n.has(s))return i;return i.issues.push({code:"invalid_value",values:t.values,input:s,inst:e}),i}});var Ip=q("$ZodTransform",(e,t)=>{_t.init(e,t),e._zod.optin="optional",Kt.memoizer?.guard(e),e._zod.parse=(n,i)=>{if(i.direction==="backward")throw new Ts(e.constructor.name);let r=t.transform(n.value,n);if(i.async)return(r instanceof Promise?r:Promise.resolve(r)).then((o)=>(n.value=o,n));if(r instanceof Promise)throw new qn;return n.value=r,n}});function Ud(e,t){return e.value=t.issues.length?void 0:t.value,e}var jc=q("$ZodOptional",(e,t)=>{_t.init(e,t),nt(e,"optin",(n)=>n.def.innerType._zod.optin==="defaulted"?"defaulted":"optional"),e._zod.optout="optional",nt(e,"values",(n)=>{let i=n.def.innerType._zod.values;return i?new Set([...i,void 0]):void 0}),nt(e,"pattern",(n)=>{let i=n.def.innerType._zod.pattern;return i?new RegExp(`^(${Lo(i.source)})?$`):void 0}),e._zod.parse=(n,i)=>{if(n.value===void 0){if(t.innerType._zod.optin!=="defaulted")return n;let r=t.innerType._zod.run({value:n.value,issues:[]},i);if(r instanceof Promise)return r.then((s)=>Ud(n,s));return Ud(n,r)}return t.innerType._zod.run(n,i)}}),Pp=q("$ZodExactOptional",(e,t)=>{jc.init(e,t),nt(e,"values",(n)=>n.def.innerType._zod.values),nt(e,"pattern",(n)=>n.def.innerType._zod.pattern),e._zod.parse=(n,i)=>t.innerType._zod.run(n,i)}),Lp=q("$ZodNullable",(e,t)=>{_t.init(e,t),nt(e,"optin",(n)=>n.def.innerType._zod.optin),nt(e,"optout",(n)=>n.def.innerType._zod.optout),nt(e,"pattern",(n)=>{let i=n.def.innerType._zod.pattern;return i?new RegExp(`^(${Lo(i.source)}|null)$`):void 0}),nt(e,"values",(n)=>n.def.innerType._zod.values?new Set([...n.def.innerType._zod.values,null]):void 0),e._zod.parse=(n,i)=>{if(n.value===null)return n;return t.innerType._zod.run(n,i)}}),Np=q("$ZodDefault",(e,t)=>{_t.init(e,t),e._zod.optin="defaulted",nt(e,"values",(n)=>n.def.innerType._zod.values),e._zod.parse=(n,i)=>{if(i.direction==="backward")return t.innerType._zod.run(n,i);if(n.value===void 0)return n.value=t.defaultValue,n;let r=t.innerType._zod.run(n,i);if(r instanceof Promise)return r.then((s)=>Fd(s,t));return Fd(r,t)}});function Fd(e,t){if(e.value===void 0)e.value=t.defaultValue;return e}var Dp=q("$ZodPrefault",(e,t)=>{_t.init(e,t),e._zod.optin="defaulted",nt(e,"values",(n)=>n.def.innerType._zod.values),e._zod.parse=(n,i)=>{if(i.direction==="backward")return t.innerType._zod.run(n,i);if(n.value===void 0)n.value=t.defaultValue;return t.innerType._zod.run(n,i)}}),Op=q("$ZodNonOptional",(e,t)=>{_t.init(e,t),nt(e,"values",(n)=>{let i=n.def.innerType._zod.values;return i?new Set([...i].filter((r)=>r!==void 0)):void 0}),e._zod.parse=(n,i)=>{let r=t.innerType._zod.run(n,i);if(r instanceof Promise)return r.then((s)=>zd(s,e));return zd(r,e)}});function zd(e,t){if(!e.issues.length&&e.value===void 0)e.issues.push({code:"invalid_type",expected:"nonoptional",input:e.value,inst:t});return e}function kd(e,t,n,i){if(!t.issues.length){if(e.value=t.value,t.memo)e.memo=!0;return e}return e.value=n.catchValue({...t,value:e.value,error:{issues:t.issues.map((r)=>Xn(r,i,ln()))},input:e.value}),e}var Up=q("$ZodCatch",(e,t)=>{_t.init(e,t),nt(e,"optin",(n)=>n.def.innerType._zod.optin==="defaulted"?"defaulted":"optional"),nt(e,"optout",(n)=>n.def.innerType._zod.optout),nt(e,"values",(n)=>n.def.innerType._zod.values),e._zod.parse=(n,i)=>{if(i.direction==="backward")return t.innerType._zod.run(n,i);let r=t.innerType._zod.run({value:n.value,issues:[]},i);if(r instanceof Promise)return r.then((s)=>kd(n,s,t,i));return kd(n,r,t,i)}});var Fp=q("$ZodPipe",(e,t)=>{_t.init(e,t),nt(e,"values",(n)=>n.def.in._zod.values),nt(e,"optin",(n)=>n.def.in._zod.optin),nt(e,"optout",(n)=>n.def.out._zod.optout),nt(e,"propValues",(n)=>n.def.in._zod.propValues),e._zod.parse=(n,i)=>{if(i.direction==="backward"){let s=t.out._zod.run(n,i);if(s instanceof Promise)return s.then((o)=>$o(o,t.in,i));return $o(s,t.in,i)}let r=t.in._zod.run(n,i);if(r instanceof Promise)return r.then((s)=>$o(s,t.out,i));return $o(r,t.out,i)}});function $o(e,t,n){if(e.issues.some((i)=>i.code!=="unrecognized_keys"))return e.aborted=!0,e;return t._zod.run({value:e.value,issues:e.issues},n)}var zp=q("$ZodReadonly",(e,t)=>{_t.init(e,t),nt(e,"propValues",(n)=>n.def.innerType._zod.propValues),nt(e,"values",(n)=>n.def.innerType._zod.values),nt(e,"optin",(n)=>n.def.innerType?._zod?.optin),nt(e,"optout",(n)=>n.def.innerType?._zod?.optout),e._zod.parse=(n,i)=>{if(i.direction==="backward")return t.innerType._zod.run(n,i);let r=t.innerType._zod.run(n,i);if(r instanceof Promise)return r.then(Bd);return Bd(r)}});function Bd(e){if(!e.memo)e.value=Object.freeze(e.value);return e}var kp=q("$ZodCustom",(e,t)=>{kt.init(e,t),_t.init(e,t),e._zod.parse=(n,i)=>n,e._zod.check=(n)=>{let i=n.value,r=t.fn(i);if(r instanceof Promise)return r.then((s)=>Gd(s,n,i,e));Gd(r,n,i,e);return}});function Gd(e,t,n,i){if(!e){let r={code:"custom",input:n,inst:i,path:[...i._zod.def.path??[]],continue:!i._zod.def.abort};if(i._zod.def.params)r.params=i._zod.def.params;t.issues.push(ar(r))}}function Hd(e,t,n){if(e.issues.length)t.issues.push(...fi(n,e.issues))}var Qv=q("$ZodProperties",(e,t)=>{_t.init(e,t),kt.init(e,t);let n=Kt.memoizer;n?.attach(e);let i,r=(s,o)=>{i??(i=Reflect.ownKeys(t.shape).map((l)=>[l,t.shape[l]]));let a=s.value,c;for(let[l,u]of i){let h=u._zod.run({value:a[l],issues:[]},o);if(h instanceof Promise)c??(c=[]),c.push(h.then((f)=>Hd(f,s,l)));else Hd(h,s,l)}if(c)return Promise.all(c).then(()=>{return});return};e._zod.parse=(s,o)=>{let a=s.value;if(a===null||typeof a!=="object"&&typeof a!=="function")return s.issues.push({expected:"object",code:"invalid_type",input:a,inst:e}),s;if(o.direction==="backward")o={...o,direction:"forward"};if(n)n.alloc(e,s,a,o);let c=r(s,o);return c instanceof Promise?c.then(()=>s):s},e._zod.check=(s)=>{if(s.value==null){s.issues.push({expected:"object",code:"invalid_type",input:s.value,inst:e});return}return r(s,{})}},{*[Symbol.iterator](){yield this}});class Gp extends Error{constructor(){super("Cannot parse a reference cycle that closes through a transform");this.name="ZodCyclicError"}}var Kc="~memo",Bp=[];function Hp(e){return e!==null&&(typeof e==="object"||typeof e==="function")}function Jc(e){return e.map((t)=>t.path?{...t,path:t.path.slice()}:{...t})}var Vp=new WeakMap,Cs=0,jo=1,Is=2;function Jo(e,t,n){let i=Vp.get(e);if(i!==void 0)return i?Is:Cs;if(t.has(e))return Is;t.add(e);let r=Cs,s=(u)=>{if(r!==Is&&u?._zod){let h=Jo(u,t,n);if(h>r)r=h}},o=(u,h)=>{let f=Cs;for(let d of Reflect.ownKeys(u)){let m=Object.getOwnPropertyDescriptor(u,d);if(h&&!m.enumerable)continue;let x=m.get?jo:m.value?._zod?Jo(m.value,t,n):Cs;if(x>f)f=x}return f},a=(u)=>{if(u>r)r=u},c=e._zod.def,l=c.type;switch(l){case"object":{let u=No(c);a(u?o(u,!0):jo),s(c.catchall);break}case"properties":a(o(c.shape,!1));break;case"array":s(c.element);break;case"tuple":for(let u of c.items)s(u);s(c.rest);break;case"record":case"map":s(c.keyType),s(c.valueType);break;case"set":s(c.valueType);break;case"union":for(let u of c.options)s(u);break;case"intersection":s(c.left),s(c.right);break;case"optional":case"nullable":case"default":case"prefault":case"catch":case"readonly":case"nonoptional":case"promise":case"success":s(c.innerType);break;case"pipe":s(c.in),s(c.out);break;case"function":s(c.input),s(c.output);break;case"lazy":{let u=c._cachedInner??(n?e._zod.innerType:void 0);a(u?Jo(u,t,!1):jo);break}case"template_literal":case"string":case"number":case"int":case"boolean":case"bigint":case"symbol":case"undefined":case"null":case"void":case"never":case"any":case"unknown":case"date":case"nan":case"enum":case"literal":case"file":case"transform":case"custom":break;default:for(let u in c){let h=Object.getOwnPropertyDescriptor(c,u);if(!h||h.get)continue;let f=h.value;if(!f||typeof f!=="object")continue;if(f._zod)s(f);else if(Array.isArray(f))for(let d of f)s(d)}}return t.delete(e),ey(e,r)}function ey(e,t){if(t!==jo)Vp.set(e,t===Is);return t}function ty(e,t){let n=e.buckets.get(t);if(!n)n=new WeakMap,e.buckets.set(t,n);return n}var qo,Yo=[],ny={alloc(e,t,n){let i=qo;if(!i)return n;qo=void 0;let r={value:n,issues:null};return i.set(t.value,r),Yo.push(r),n},guard(e){var t;(t=e._zod).deferred??(t.deferred=[]),e._zod.deferred.push(()=>{let n=e._zod.parse,i=(r,s)=>{if(s.direction!=="backward"&&iy(s,r.value))throw new Gp;return n(r,s)};if(e._zod.parse=i,e._zod.run===n)e._zod.run=i})},attach(e){var t;let n,i=!1,r,s;(t=e._zod).deferred??(t.deferred=[]),e._zod.deferred.push(()=>{let o=e._zod.parse,a=(c,l)=>{if(n===void 0){let g=Jo(e,new Set,!1);if(g===Cs){if(e._zod.parse=o,e._zod.run===a)e._zod.run=o;return o(c,l)}if(g===Is||i)n=!0;else i=!0}let u=c.value;if(!Hp(u))return o(c,l);let h=l[Kc];if(!h)h={buckets:new WeakMap,backEdges:void 0},l[Kc]=h;let f;if(r===l)f=s;else f=ty(h,e),r=l,s=f;let d=f.get(u);if(d){if(c.value=d.value,d.issues){if(d.issues.length)c.issues.push(...Jc(d.issues))}else c.memo=!0,h.backEdges??(h.backEdges=new WeakSet),h.backEdges.add(d.value);return c}qo=f;let m=Yo.length,x=o(c,l);qo=void 0;let p=Yo.length>m?Yo.pop():void 0;if(x instanceof Promise)return x.then((g)=>{if(p)p.issues=g.issues.length?Jc(g.issues):Bp;return g});if(p)p.issues=x.issues.length?Jc(x.issues):Bp;return x};if(e._zod.parse=a,e._zod.run===o)e._zod.run=a})}};function $p(){return ny}function iy(e,t){let n=e[Kc]?.backEdges;return n!==void 0&&Hp(t)&&n.has(t)}var ry=()=>{let e={string:{unit:"characters",verb:"to have"},file:{unit:"bytes",verb:"to have"},array:{unit:"items",verb:"to have"},set:{unit:"items",verb:"to have"},map:{unit:"entries",verb:"to have"}};function t(s){return e[s]??null}let n={regex:"input",email:"email address",url:"URL",emoji:"emoji",uuid:"UUID",uuidv4:"UUIDv4",uuidv6:"UUIDv6",nanoid:"nanoid",guid:"GUID",cuid:"cuid",cuid2:"cuid2",ulid:"ULID",xid:"XID",ksuid:"KSUID",datetime:"ISO datetime",date:"ISO date",time:"ISO time",duration:"ISO duration",ipv4:"IPv4 address",ipv6:"IPv6 address",mac:"MAC address",cidrv4:"IPv4 range",cidrv6:"IPv6 range",base64:"base64-encoded string",base64url:"base64url-encoded string",json_string:"JSON string",e164:"E.164 number",credit_card:"credit card number",iban:"IBAN",jwt:"JWT",template_literal:"input"},i={nan:"NaN"};function r(s,o){if(s==="number"&&typeof o==="number"&&!Number.isFinite(o))return String(o);return i[s]??s}return(s)=>{switch(s.code){case"invalid_type":{let o=r(s.expected),a=Ef(s.input),c=r(a,s.input);return`Invalid input: expected ${o}, received ${c}`}case"invalid_value":if(s.values.length===1)return`Invalid input: expected ${Ic(s.values[0])}`;return`Invalid option: expected one of ${Ac(s.values,"|")}`;case"too_big":{let o=s.exact?"exactly ":s.inclusive?"<=":"<",a=t(s.origin);if(a)return`Too big: expected ${s.origin??"value"} to have ${o}${s.maximum.toString()} ${a.unit??"elements"}`;return`Too big: expected ${s.origin??"value"} to be ${o}${s.maximum.toString()}`}case"too_small":{let o=s.exact?"exactly ":s.inclusive?">=":">",a=t(s.origin);if(a)return`Too small: expected ${s.origin} to have ${o}${s.minimum.toString()} ${a.unit}`;return`Too small: expected ${s.origin} to be ${o}${s.minimum.toString()}`}case"invalid_format":{let o=s;if(o.format==="starts_with")return`Invalid string: must start with "${o.prefix}"`;if(o.format==="ends_with")return`Invalid string: must end with "${o.suffix}"`;if(o.format==="includes")return`Invalid string: must include "${o.includes}"`;if(o.format==="regex")return`Invalid string: must match pattern ${o.pattern}`;return`Invalid ${n[o.format]??s.format}`}case"not_multiple_of":return`Invalid number: must be a multiple of ${s.divisor}`;case"unrecognized_keys":return`Unrecognized key${s.keys.length>1?"s":""}: ${Ac(s.keys,", ")}`;case"invalid_key":return`Invalid key in ${s.origin}`;case"invalid_union":if(s.options&&Array.isArray(s.options)&&s.options.length>0)return`Invalid discriminator value. Expected ${s.options.map((a)=>`'${a}'`).join(" | ")}`;if(s.inclusive===!1)return"Invalid input: more than one option matched";return"Invalid input";case"invalid_element":return`Invalid value in ${s.origin}`;default:return"Invalid input"}}};function Qc(){return{localeError:ry()}}var Wp;class Zp{constructor(){this._map=new WeakMap,this._idmap=new Map}add(e,...t){let n=t[0];if(this._map.set(e,n),n&&typeof n==="object"&&"id"in n)this._idmap.set(n.id,e);return this}clear(){return this._map=new WeakMap,this._idmap=new Map,this}remove(e){let t=this._map.get(e);if(t&&typeof t==="object"&&"id"in t)this._idmap.delete(t.id);return this._map.delete(e),this}get(e){let t=e._zod.parent;if(t){let n={...this.get(t)??{}};delete n.id;let i={...n,...this._map.get(e)};return Object.keys(i).length?i:void 0}return this._map.get(e)}has(e){return this._map.has(e)}}function sy(){return new Zp}(Wp=globalThis).__zod_globalRegistry??(Wp.__zod_globalRegistry=sy());var cr=globalThis.__zod_globalRegistry;function Xp(e,t){return new e({type:"string",...Te(t)})}function qp(e,t){return new e({type:"string",format:"email",check:"string_format",abort:!1,...Te(t)})}function Yp(e,t){return new e({type:"string",format:"guid",check:"string_format",abort:!1,...Te(t)})}function jp(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,...Te(t)})}function Jp(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v4",...Te(t)})}function Kp(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v6",...Te(t)})}function Qp(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v7",...Te(t)})}function em(e,t){return new e({type:"string",format:"url",check:"string_format",abort:!1,...Te(t)})}function tm(e,t){return new e({type:"string",format:"emoji",check:"string_format",abort:!1,...Te(t)})}function nm(e,t){return new e({type:"string",format:"nanoid",check:"string_format",abort:!1,...Te(t)})}function im(e,t){return new e({type:"string",format:"cuid",check:"string_format",abort:!1,...Te(t)})}function rm(e,t){return new e({type:"string",format:"cuid2",check:"string_format",abort:!1,...Te(t)})}function sm(e,t){return new e({type:"string",format:"ulid",check:"string_format",abort:!1,...Te(t)})}function om(e,t){return new e({type:"string",format:"xid",check:"string_format",abort:!1,...Te(t)})}function am(e,t){return new e({type:"string",format:"ksuid",check:"string_format",abort:!1,...Te(t)})}function cm(e,t){return new e({type:"string",format:"ipv4",check:"string_format",abort:!1,...Te(t)})}function lm(e,t){return new e({type:"string",format:"ipv6",check:"string_format",abort:!1,...Te(t)})}function um(e,t){return new e({type:"string",format:"cidrv4",check:"string_format",abort:!1,...Te(t)})}function hm(e,t){return new e({type:"string",format:"cidrv6",check:"string_format",abort:!1,...Te(t)})}function fm(e,t){return new e({type:"string",format:"base64",check:"string_format",abort:!1,...Te(t)})}function dm(e,t){return new e({type:"string",format:"base64url",check:"string_format",abort:!1,...Te(t)})}function pm(e,t){return new e({type:"string",format:"e164",check:"string_format",abort:!1,...Te(t)})}function mm(e,t){return new e({type:"string",format:"jwt",check:"string_format",abort:!1,...Te(t)})}function gm(e,t){return new e({type:"string",format:"datetime",check:"string_format",offset:!1,local:!1,precision:null,...Te(t)})}function _m(e,t){return new e({type:"string",format:"date",check:"string_format",...Te(t)})}function xm(e,t){return new e({type:"string",format:"time",check:"string_format",precision:null,...Te(t)})}function vm(e,t){return new e({type:"string",format:"duration",check:"string_format",...Te(t)})}function ym(e,t){return new e({type:"number",checks:[],...Te(t)})}function bm(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"safeint",...Te(t)})}function Sm(e,t){return new e({type:"boolean",...Te(t)})}function Mm(e){return new e({type:"unknown"})}function wm(e,t){return new e({type:"never",...Te(t)})}function Ko(e,t){return new Vc({check:"less_than",...Te(t),value:e,inclusive:!1})}function Ps(e,t){return new Vc({check:"less_than",...Te(t),value:e,inclusive:!0})}function Qo(e,t){return new $c({check:"greater_than",...Te(t),value:e,inclusive:!1})}function Ls(e,t){return new $c({check:"greater_than",...Te(t),value:e,inclusive:!0})}function ea(e,t){return new vd({check:"multiple_of",...Te(t),value:e})}function ta(e,t){return new bd({check:"max_length",...Te(t),maximum:e})}function Nr(e,t){return new Sd({check:"min_length",...Te(t),minimum:e})}function na(e,t){return new Md({check:"length_equals",...Te(t),length:e})}function el(e,t){return new wd({check:"string_format",format:"regex",...Te(t),pattern:e})}function tl(e){return new Td({check:"string_format",format:"lowercase",...Te(e)})}function nl(e){return new Ed({check:"string_format",format:"uppercase",...Te(e)})}function il(e,t){return new Ad({check:"string_format",format:"includes",...Te(t),includes:e})}function rl(e,t){return new Rd({check:"string_format",format:"starts_with",...Te(t),prefix:e})}function sl(e,t){return new Cd({check:"string_format",format:"ends_with",...Te(t),suffix:e})}function Ni(e){return new Id({check:"overwrite",tx:e})}function ol(e){return Ni((t)=>t.normalize(e))}function al(){return Ni((e)=>e.trim())}function cl(){return Ni((e)=>e.toLowerCase())}function ll(){return Ni((e)=>e.toUpperCase())}function ul(){return Ni((e)=>vf(e))}function Tm(e,t,n){return new e({type:"array",element:t,...Te(n)})}function Em(e,t,n){return new e({type:"custom",check:"custom",fn:t,...Te(n)})}function Am(e,t){let n=oy((i)=>(i.addIssue=(r)=>{if(typeof r==="string")i.issues.push(ar(r,i.value,n._zod.def));else{let s=r;if(s.fatal)s.continue=!1;if(s.code??(s.code="custom"),!("input"in s))s.input=i.value;s.inst??(s.inst=n),s.continue??(s.continue=!n._zod.def.abort),i.issues.push(ar(s))}},e(i.value,i)),t);return n}function oy(e,t){let n=new kt({check:"custom",...Te(t)});return n._zod.check=e,n}function Ns(e,...t){for(let n of t)for(let i of Reflect.ownKeys(n))if(Object.prototype.propertyIsEnumerable.call(n,i))Cn(e,i,n[i]);return e}function fl(e){let t=e?.target??"draft-2020-12";if(t==="draft-4")t="draft-04";if(t==="draft-7")t="draft-07";return{processors:e.processors??{},metadataRegistry:e?.metadata??cr,target:t,unrepresentable:e?.unrepresentable??"throw",override:e?.override??(()=>{}),io:e?.io??"output",counter:0,seen:new Map,sharedDefsExtractedFor:void 0,sharedEmitDoneFor:void 0,cycles:e?.cycles??"ref",reused:e?.reused??"inline",intersections:[],deferred:[],external:e?.external??void 0}}function di(e,t,n,i,r){let s=typeof t.unrepresentable==="function"?t.unrepresentable({zodSchema:e,path:i.path,message:r}):t.unrepresentable;if(s==="any")return!1;if(s===void 0||s==="throw")throw Error(r);return Object.assign(n,s),!0}function At(e,t,n={path:[],schemaPath:[]}){var i;let r=e._zod.def,s=t.seen.get(e);if(s){if(s.count++,n.schemaPath.includes(e))s.cycle=n.path;return s.schema}let o={schema:{},count:1,cycle:void 0,path:n.path};t.seen.set(e,o),t.sharedDefsExtractedFor=void 0,t.sharedEmitDoneFor=void 0;let a=e._zod.toJSONSchema?.();if(a)o.schema=a;else{let u={...n,schemaPath:[...n.schemaPath,e],path:n.path};if(e._zod.processJSONSchema)e._zod.processJSONSchema(t,o.schema,u);else{let f=o.schema,d=t.processors[r.type];if(!d)throw Error(`[toJSONSchema]: Non-representable type encountered: ${r.type}`);d(e,t,f,u)}let h=e._zod.parent;if(h){if(!o.ref)o.ref=h;At(h,t,u),t.seen.get(h).isParent=!0}}let c=t.metadataRegistry.get(e);if(c)Ns(o.schema,c);if(t.io==="input"&&Zt(e))delete o.schema.examples,delete o.schema.default;if(t.io==="input"&&"_prefault"in o.schema)(i=o.schema).default??(i.default=o.schema._prefault);return delete o.schema._prefault,t.seen.get(e).schema}function Rm(e){return e.replace(/~/g,"~0").replace(/\//g,"~1")}function dl(e,t){let n=e.seen.get(t);if(!n)throw Error("Unprocessed schema. This is a bug in Zod.");if(e.external&&e.sharedDefsExtractedFor===e.external)return;let i=new Map;for(let o of e.seen.entries()){let a=e.metadataRegistry.get(o[0])?.id;if(a){let c=i.get(a);if(c&&c!==o[0])throw Error(`Duplicate schema id "${a}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);i.set(a,o[0])}}let r=(o)=>{let a=e.target==="draft-2020-12"?"$defs":"definitions";if(e.external){let h=e.external.registry.get(o[0])?.id,f=e.external.uri??((m)=>m);if(h)return{ref:f(h)};let d=o[1].defId??o[1].schema.id??`schema${e.counter++}`;return o[1].defId=d,{defId:d,ref:`${f("__shared")}#/${a}/${Rm(d)}`}}let c="#",l=`${c}/${a}/`;if(o[1]===n&&!o[1].schema.id)return{ref:c};let u=o[1].schema.id??`__schema${e.counter++}`;return{defId:u,ref:l+Rm(u)}},s=(o)=>{if(o[1].schema.$ref)return;let a=o[1],{ref:c,defId:l}=r(o);if(a.def={...a.schema},l)a.defId=l;let u=a.schema;for(let h in u)delete u[h];u.$ref=c};if(e.cycles==="throw")for(let o of e.seen.entries()){let a=o[1];if(a.cycle)throw Error(`Cycle detected: #/${a.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`)}for(let o of e.seen.entries()){let a=o[1];if(t===o[0]){s(o);continue}if(e.external){let l=e.external.registry.get(o[0])?.id;if(t!==o[0]&&l){s(o);continue}}if(e.metadataRegistry.get(o[0])?.id){s(o);continue}if(a.cycle){s(o);continue}if(a.count>1){if(e.reused==="ref")s(o)}}if(e.external)e.sharedDefsExtractedFor=e.external}function Pm(e){let t=e.anyOf;if(!Array.isArray(t)||t.length===0||e.type!==void 0)return;let n=[];for(let i of t){if(!i||typeof i!=="object")return;Pm(i);let r=Object.keys(i);if(r.length!==1||r[0]!=="type")return;let s=i.type;for(let o of Array.isArray(s)?s:[s]){if(typeof o!=="string")return;if(!n.includes(o))n.push(o)}}delete e.anyOf,e.type=n.length===1?n[0]:n}var Lm=new Set(["type","properties","required","additionalProperties"]),Cm=["oneOf","anyOf"];function Im(e){let t=e.additionalProperties;if(t===void 0||t===!1||typeof t!=="object"||t===null)return null;return Object.keys(t).length?t:null}function hl(e){let t=[];for(let s of e){if(typeof s!=="object"||s.type!=="object")return null;for(let o in s)if(!Lm.has(o))return null;t.push(s)}let n={},i=new Set;for(let s of t){for(let o in s.properties){if(Object.prototype.hasOwnProperty.call(n,o))continue;let a=[];for(let l of t){let u=l.properties?.[o]??Im(l);if(u===null||u===void 0)continue;if(!a.some((h)=>JSON.stringify(h)===JSON.stringify(u)))a.push(u)}let c=a.length===1?a[0]:hl(a)??{allOf:a};Cn(n,o,c)}for(let o of s.required??[])i.add(o)}let r={type:"object",properties:n};if(i.size)r.required=[...i];if(t.every((s)=>s.additionalProperties===!1))r.additionalProperties=!1;else{let s=[];for(let o of t){let a=Im(o);if(a&&!s.some((c)=>JSON.stringify(c)===JSON.stringify(a)))s.push(a)}if(s.length===1)r.additionalProperties=s[0];else if(s.length>1)r.additionalProperties={allOf:s}}return r}function ay(e){let t=e.allOf;if(!Array.isArray(t)||t.length<2)return;for(let r of Lm)if(r in e)return;let n=t.filter((r)=>Cm.some((s)=>Array.isArray(r[s]))),i=null;if(!n.length)i=hl(t);else{let r=n[0],s=Cm.find((c)=>Array.isArray(r[c]));if(Object.keys(r).length!==1)return;let o=t.filter((c)=>c!==r),a=r[s].map((c)=>hl([...o,c]));if(a.some((c)=>!c))return;i={[s]:a}}if(!i)return;delete e.allOf,Ns(e,i)}function pl(e,t){let n=e.seen.get(t);if(!n)throw Error("Unprocessed schema. This is a bug in Zod.");let i=(a)=>{let c=e.seen.get(a);if(c.ref===null)return;let l=c.def??c.schema,u={...l},h=c.ref;if(c.ref=null,h){i(h);let d=e.seen.get(h),m=d.schema;if(m.$ref&&(e.target==="draft-07"||e.target==="draft-04"||e.target==="openapi-3.0"))l.allOf=l.allOf??[],l.allOf.push(m);else Ns(l,m);if(Ns(l,u),a._zod.parent===h)for(let p in l){if(p==="$ref"||p==="allOf")continue;if(!(p in u))delete l[p]}if(m.$ref&&d.def)for(let p in l){if(p==="$ref"||p==="allOf")continue;if(p in d.def&&JSON.stringify(l[p])===JSON.stringify(d.def[p]))delete l[p]}}let f=a._zod.parent;if(f&&f!==h){i(f);let d=e.seen.get(f);if(d?.schema.$ref){if(l.$ref=d.schema.$ref,d.def)for(let m in l){if(m==="$ref"||m==="allOf")continue;if(m in d.def&&JSON.stringify(l[m])===JSON.stringify(d.def[m]))delete l[m]}}}e.override({zodSchema:a,jsonSchema:l,path:c.path??[]})};if(!e.external||e.sharedEmitDoneFor!==e.external){for(let a of[...e.seen.entries()].reverse())i(a[0]);if(e.target!=="openapi-3.0")for(let a of e.seen.entries())Pm(a[1].def??a[1].schema);for(let a of e.deferred)a();if(e.intersections.length){let a=new Map;for(let c of e.seen.values())for(let l of[c.schema,c.def]){let u=l?.allOf;if(!Array.isArray(u))continue;let h=a.get(u);if(h)h.push(l);else a.set(u,[l])}for(let c of e.intersections)for(let l of a.get(c)??[])ay(l)}}let r={};if(e.target==="draft-2020-12")r.$schema="https://json-schema.org/draft/2020-12/schema";else if(e.target==="draft-07")r.$schema="http://json-schema.org/draft-07/schema#";else if(e.target==="draft-04")r.$schema="http://json-schema.org/draft-04/schema#";else if(e.target==="openapi-3.0");if(e.external?.uri){let a=e.external.registry.get(t)?.id;if(!a)throw Error("Schema is missing an `id` property");r.$id=e.external.uri(a)}Ns(r,n.defId?n.schema:n.def??n.schema);let s=e.metadataRegistry.get(t)?.id;if(s!==void 0&&r.id===s)delete r.id;let o=e.external?.defs??{};if(!e.external||e.sharedEmitDoneFor!==e.external)for(let a of e.seen.entries()){let c=a[1];if(c.def&&c.defId){if(c.def.id===c.defId)delete c.def.id;Cn(o,c.defId,c.def)}}if(e.external)e.sharedEmitDoneFor=e.external;if(e.external);else if(Object.keys(o).length>0)if(e.target==="draft-2020-12")r.$defs=o;else r.definitions=o;try{let a=JSON.parse(JSON.stringify(r));return Object.defineProperty(a,"~standard",{value:{...t["~standard"],jsonSchema:{input:Ds(t,"input",e.processors),output:Ds(t,"output",e.processors)}},enumerable:!1,writable:!1}),a}catch(a){throw Error("Error converting schema to JSON.")}}function Zt(e,t){let n=t??{seen:new Set};if(n.seen.has(e))return!1;n.seen.add(e);let i=e._zod.def;if(i.type==="transform")return!0;if(i.type==="array")return Zt(i.element,n);if(i.type==="set")return Zt(i.valueType,n);if(i.type==="lazy")return Zt(i.getter(),n);if(i.type==="promise"||i.type==="optional"||i.type==="nonoptional"||i.type==="nullable"||i.type==="readonly"||i.type==="default"||i.type==="prefault"||i.type==="catch")return Zt(i.innerType,n);if(i.type==="intersection")return Zt(i.left,n)||Zt(i.right,n);if(i.type==="record"||i.type==="map")return Zt(i.keyType,n)||Zt(i.valueType,n);if(i.type==="pipe"){if(e._zod.traits.has("$ZodCodec"))return!0;return Zt(i.in,n)||Zt(i.out,n)}if(i.type==="object"){for(let r in i.shape)if(Zt(i.shape[r],n))return!0;return!1}if(i.type==="union"){for(let r of i.options)if(Zt(r,n))return!0;return!1}if(i.type==="tuple"){for(let r of i.items)if(Zt(r,n))return!0;if(i.rest&&Zt(i.rest,n))return!0;return!1}return!1}var Nm=(e,t={})=>(n)=>{let i=fl({...n,processors:t});return At(e,i),dl(i,e),pl(i,e)},Ds=(e,t,n={})=>(i)=>{let{libraryOptions:r,target:s}=i??{},o=fl({...r??{},target:s,io:t,processors:n});return At(e,o),dl(o,e),pl(o,e)};var Dr=(e,t,n)=>{if(e[t]===void 0||n>e[t])e[t]=n},Or=(e,t,n)=>{if(e[t]===void 0||n<e[t])e[t]=n},Dm=(e,t)=>{Dr(e,"minimum",t),Or(e,"maximum",t)},zm=(e,t)=>{if(e.multipleOf??(e.multipleOf=[]),!e.multipleOf.includes(t))e.multipleOf.push(t)},km=(e,t)=>{e.patterns??(e.patterns=new Set),e.patterns.add(t)},Bm=(e,t)=>{e.mime=e.mime?e.mime.filter((n)=>t.includes(n)):[...t]},Gm=(e,t)=>{if(e.format=t,t.includes("int"))e.isInt=!0},Om=(e,t)=>Dr(e,"minimum",t.minimum),Um=(e,t)=>Or(e,"maximum",t.maximum),Fm=(e)=>(t,n)=>{Gm(t,n.format);let[i,r]=e[n.format];Dr(t,"minimum",i),Or(t,"maximum",r)},cy={greater_than:(e,t)=>Dr(e,t.inclusive?"minimum":"exclusiveMinimum",t.value),less_than:(e,t)=>Or(e,t.inclusive?"maximum":"exclusiveMaximum",t.value),multiple_of:(e,t)=>zm(e,t.value),number_format:Fm(Do),bigint_format:Fm(Pc),min_length:Om,max_length:Um,length_equals:(e,t)=>Dm(e,t.length),min_size:Om,max_size:Um,size_equals:(e,t)=>Dm(e,t.size),string_format:(e,t)=>{if(Gm(e,t.format),t.pattern)km(e,t.pattern);if(t.format==="base64"||t.format==="base64url")e.contentEncoding=t.format;if(t.local||t.precision===-1)e.laxFormat=!0},mime_type:(e,t)=>Bm(e,t.mime)};function Sn(e){let t={},n=e._zod.def,i=e._zod.traits.has("$ZodCheck")?[e,...n.checks??[]]:n.checks??[];for(let s of i)cy[s._zod.def.check]?.(t,s._zod.def);let r=e._zod.bag;if(r.minimum!==void 0)Dr(t,"minimum",r.minimum);if(r.exclusiveMinimum!==void 0)Dr(t,"exclusiveMinimum",r.exclusiveMinimum);if(r.maximum!==void 0)Or(t,"maximum",r.maximum);if(r.exclusiveMaximum!==void 0)Or(t,"exclusiveMaximum",r.exclusiveMaximum);if(r.multipleOf!==void 0)zm(t,r.multipleOf);if(r.format!==void 0){if(t.format??(t.format=r.format),r.format.includes("int"))t.isInt=!0}if(r.mime)Bm(t,r.mime);for(let s of r.patterns??[])km(t,s);return t}var ly={guid:"uuid",url:"uri",datetime:"date-time",json_string:"json-string",regex:""},uy=new Map([[qc,ad],[Xo,cd]]),Hm=(e)=>uy.get(e)??e,Vm=(e,t,n,i)=>{let r=n;r.type="string";let{minimum:s,maximum:o,format:a,patterns:c,contentEncoding:l,laxFormat:u}=Sn(e);if(typeof s==="number")r.minLength=s;if(typeof o==="number")r.maxLength=o;if(a){if(r.format=ly[a]??a,r.format==="")delete r.format;if(a==="time"||u)delete r.format}if(l)r.contentEncoding=l;if(c&&c.size>0){let h=[...c].map(Hm);if(h.length===1)r.pattern=h[0].source;else if(h.length>1)r.allOf=[...h.map((f)=>({...t.target==="draft-07"||t.target==="draft-04"||t.target==="openapi-3.0"?{type:"string"}:{},pattern:f.source}))]}},$m=(e,t,n,i)=>{let r=n,{minimum:s,maximum:o,multipleOf:a,exclusiveMaximum:c,exclusiveMinimum:l,isInt:u}=Sn(e);r.type=u?"integer":"number";let h=typeof l==="number"&&l>=(s??Number.NEGATIVE_INFINITY),f=typeof c==="number"&&c<=(o??Number.POSITIVE_INFINITY),d=t.target==="draft-04"||t.target==="openapi-3.0";if(h)if(d)r.minimum=l,r.exclusiveMinimum=!0;else r.exclusiveMinimum=l;else if(typeof s==="number")r.minimum=s;if(f)if(d)r.maximum=c,r.exclusiveMaximum=!0;else r.exclusiveMaximum=c;else if(typeof o==="number")r.maximum=o;if(a){let m=new Set;for(let g of a)if(Number.isFinite(g)&&g!==0)m.add(Math.abs(g));else di(e,t,r,i,`A multipleOf divisor of ${g} cannot be represented in JSON Schema`);let[x,...p]=m;if(x!==void 0)r.multipleOf=x;if(p.length)r.allOf=[...r.allOf??[],...p.map((g)=>({multipleOf:g}))]}},Wm=(e,t,n,i)=>{n.type="boolean"};var Zm=(e,t,n,i)=>{n.not={}};var Xm=(e,t,n,i)=>{};var qm=(e,t,n,i)=>{let r=e._zod.def,s=Ms(r.entries);if(s.length===0){n.not={};return}if(s.every((o)=>typeof o==="number"))n.type="number";if(s.every((o)=>typeof o==="string"))n.type="string";n.enum=s},Ym=(e,t,n,i)=>{let r=e._zod.def;if(r.values.length===0){n.not={};return}let s=[];for(let o of r.values)if(o===void 0){if(di(e,t,n,i,"Literal `undefined` cannot be represented in JSON Schema"))return}else if(typeof o==="bigint"){if(di(e,t,n,i,"BigInt literals cannot be represented in JSON Schema"))return;s.push(Number(o))}else s.push(o);if(s.length===0);else if(s.length===1){let o=s[0];if(n.type=o===null?"null":typeof o,t.target==="draft-04"||t.target==="openapi-3.0")n.enum=[o];else n.const=o}else{if(s.every((o)=>typeof o==="number"))n.type="number";if(s.every((o)=>typeof o==="string"))n.type="string";if(s.every((o)=>typeof o==="boolean"))n.type="boolean";if(s.every((o)=>o===null))n.type="null";n.enum=s}};var jm=(e,t,n,i)=>{di(e,t,n,i,"Custom types cannot be represented in JSON Schema")};var Jm=(e,t,n,i)=>{di(e,t,n,i,"Transforms cannot be represented in JSON Schema")};var Km=(e,t,n,i)=>{let r=n,s=e._zod.def,{minimum:o,maximum:a}=Sn(e);if(typeof o==="number")r.minItems=o;if(typeof a==="number")r.maxItems=a;r.type="array",r.items=At(s.element,t,{...i,path:[...i.path,"items"]})};function ia(e){let t=e._zod.def;if(t.type==="pipe"&&t.in._zod.traits.has("$ZodTransform"))return ia(t.out);if(t.type==="catch")return ia(t.innerType);return e._zod.optin}var Qm=(e,t,n,i)=>{let r=n,s=e._zod.def,o=s.shape;if(Object.getOwnPropertySymbols(o).length&&di(e,t,r,i,"Symbol keys cannot be represented in JSON Schema"))return;r.type="object",r.properties={};for(let u in o)Cn(r.properties,u,At(o[u],t,{...i,path:[...i.path,"properties",u]}));let c=new Set(Object.keys(o)),l=new Set([...c].filter((u)=>{let h=s.shape[u];if(t.io==="input")return ia(h)===void 0;else return h._zod.optout===void 0}));if(l.size>0)r.required=Array.from(l);if(s.catchall?._zod.def.type==="never")r.additionalProperties=!1;else if(!s.catchall){if(t.io==="output")r.additionalProperties=!1}else if(s.catchall)r.additionalProperties=At(s.catchall,t,{...i,path:[...i.path,"additionalProperties"]})};var eg=(e,t,n,i)=>{let r=e._zod.def,s=r.inclusive===!1,o=r.options.map((a,c)=>At(a,t,{...i,path:[...i.path,s?"oneOf":"anyOf",c]}));if(s)n.oneOf=o;else n.anyOf=o},tg=(e,t,n,i)=>{let r=e._zod.def,s=At(r.left,t,{...i,path:[...i.path,"allOf",0]}),o=At(r.right,t,{...i,path:[...i.path,"allOf",1]}),a=(l)=>("allOf"in l)&&Object.keys(l).length===1,c=[...a(s)?s.allOf:[s],...a(o)?o.allOf:[o]];n.allOf=c,t.intersections.push(c)};function ml(e,t,n){if(t.$ref){if(n.has(t))return t;n.add(t);let m=e.get(t)?.def;if(!m)return t;let x=ml(e,m,n);return x===m?t:x}for(let m of["anyOf","oneOf"]){let x=t[m];if(!Array.isArray(x))continue;let p=x.map((g)=>ml(e,g,n));if(p.some((g,A)=>g!==x[A]))t={...t,[m]:p}}let i=Array.isArray(t.type)?t.type:[t.type],r=!i.includes("string")&&i.some((m)=>m==="number"||m==="integer"),s=t.enum??(t.const!==void 0?[t.const]:void 0);if(!r&&!s?.some((m)=>typeof m==="number"))return t;let{minimum:o,maximum:a,exclusiveMinimum:c,exclusiveMaximum:l,multipleOf:u,format:h,id:f,...d}=t;if(d.enum)d.enum=d.enum.map((m)=>typeof m==="number"?String(m):m);else if(typeof d.const==="number")d.const=String(d.const);if(!r)return d;if(d.type="string",!s)d.pattern=(i.includes("number")?Es:Gc).source;return d}var gl=new WeakMap;function hy(e){let t=new Map;for(let i of e.seen.values())if(i.def&&!t.has(i.schema))t.set(i.schema,i);let n=new Map;for(let i of gl.get(e)??[]){let r=e.seen.get(i),s=(r?.def??r?.schema)?.propertyNames;if(!s||s===!0||n.has(s))continue;let o=ml(t,s,new Set);if(o!==s)n.set(s,o)}if(!n.size)return;for(let i of e.seen.values())for(let r of[i.schema,i.def]){let s=r&&n.get(r.propertyNames);if(s)r.propertyNames=s}}var ng=(e,t,n,i)=>{let r=n,s=e._zod.def;r.type="object";let o=s.keyType,a=Sn(o).patterns;if(s.mode==="loose"&&a&&a.size>0){let u=At(s.valueType,t,{...i,path:[...i.path,"patternProperties","*"]});r.patternProperties={};for(let h of a)Cn(r.patternProperties,Hm(h).source,u)}else{if(t.target==="draft-07"||t.target==="draft-2020-12"){r.propertyNames=At(s.keyType,t,{...i,path:[...i.path,"propertyNames"]});let u=gl.get(t);if(!u)u=[],gl.set(t,u),t.deferred.push(()=>hy(t));u.push(e)}r.additionalProperties=At(s.valueType,t,{...i,path:[...i.path,"additionalProperties"]})}let c=o._zod.values,l=t.io==="input"&&ia(s.valueType)!==void 0;if(c&&!s.partial&&!l){let u=[...c].filter((h)=>typeof h==="string"||typeof h==="number");if(u.length>0)r.required=u.map(String)}},ig=(e,t,n,i)=>{let r=e._zod.def,s=At(r.innerType,t,i),o=t.seen.get(e);if(t.target==="openapi-3.0")o.ref=r.innerType,n.nullable=!0;else n.anyOf=[s,{type:"null"}]},rg=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType},_l=Symbol();function sg(e,t,n,i,r){let s=!1,o=JSON.stringify(e,(a,c)=>{if(typeof c!=="bigint")return c;return s=!0,null});if(!s)return JSON.parse(o);return di(t,n,i,r,"BigInt defaults cannot be represented in JSON Schema"),_l}var og=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType;let o=sg(r.defaultValue,e,t,n,i);if(o!==_l)n.default=o},ag=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);if(s.ref=r.innerType,t.io!=="input")return;let o=sg(r.defaultValue,e,t,n,i);if(o!==_l)n._prefault=o},cg=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType;let o;try{o=r.catchValue(void 0)}catch{di(e,t,n,i,"Dynamic catch values are not supported in JSON Schema");return}n.default=o},lg=(e,t,n,i)=>{let r=e._zod.def,s=r.in._zod.traits.has("$ZodTransform"),o=t.io==="input"?s?r.out:r.in:r.out;At(o,t,i);let a=t.seen.get(e);a.ref=o},ug=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType,n.readOnly=!0};var xl=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType};var hg=new WeakSet([Object.prototype,Error.prototype]);function ra(e,t,n){Object.defineProperty(e,t,{configurable:!0,enumerable:!1,get(){let i=n(this);return Object.defineProperty(this,t,{value:i,configurable:!0,writable:!0}),i},set(i){Object.defineProperty(this,t,{value:i,configurable:!0,writable:!0})}})}var xy=(e,t)=>{Df.init(e,t),e.name="ZodError";let n=Object.getPrototypeOf(e);if(hg.has(n))return;hg.add(n),ra(n,"format",(i)=>(r)=>Uf(i,r)),ra(n,"flatten",(i)=>(r)=>Of(i,r)),ra(n,"addIssue",(i)=>(r)=>{i.issues.push(r),i.message=JSON.stringify(i.issues,ws,2)}),ra(n,"addIssues",(i)=>(r)=>{i.issues.push(...r),i.message=JSON.stringify(i.issues,ws,2)}),Object.defineProperty(n,"isEmpty",{configurable:!0,enumerable:!1,get(){return this.issues.length===0}})};var un=q("ZodError",xy,void 0,{Parent:Error});var fg=ko(un),dg=Bo(un),pg=Go(un),mg=Ho(un),gg=zf(un),_g=kf(un),xg=Bf(un),vg=Gf(un),yg=Hf(un),bg=Vf(un),Sg=$f(un),Mg=Wf(un);function yy(){if(!Kt.localeError)ln(Qc())}function oa(){if(!Kt.memoizer)ln({memoizer:$p()})}var vt=q("ZodType",(e,t)=>(yy(),_t.init(e,t),e.def=t,e.type=t.type,e),{check(...e){let t=this.def;return this.clone(cn(t,{checks:[...t.checks??[],...e.map((n)=>typeof n==="function"?{_zod:{check:n,def:{check:"custom"},onattach:[]}}:n)]}),{parent:!0})},with(...e){return this.check(...e)},clone(e,t){return Wn(this,e,t)},brand(){return this},register(e,t){return e.add(this,t),this},refine(e,t){return this.check(yb(e,t))},superRefine(e,t){return this.check(bb(e,t))},overwrite(e){return this.check(Ni(e))},optional(){return Eg(this)},exactOptional(){return ab(this)},nullable(){return Ag(this)},nullish(){return Eg(Ag(this))},nonoptional(e){return db(this,e)},array(){return aa(this)},or(e){return eb([this,e])},and(e){return nb(this,e)},transform(e){return Rg(this,ob(e))},default(e){return ub(this,e)},prefault(e){return fb(this,e)},catch(e){return mb(this,e)},pipe(e){return Rg(this,e)},readonly(){return xb(this)},describe(e){let t=this.clone();return cr.add(t,{description:e}),t},meta(...e){if(e.length===0)return cr.get(this);let t=this.clone();return cr.add(t,e[0]),t},isOptional(){return this.safeParse(void 0).success},isNullable(){return this.safeParse(null).success},apply(e,...t){return t.length===0?e(this):e(this,...t)},get "~standard"(){return Nc(this,"~standard",{...Xc(this),jsonSchema:{input:Ds(this,"input"),output:Ds(this,"output")}})},set "~standard"(e){hi(this,"~standard",e)},parse:function e(t,n){return fg(this,t,n,{callee:e})},parseAsync:async function e(t,n){return await dg(this,t,n,{callee:e})},safeParse(e,t){return pg(this,e,t)},async safeParseAsync(e,t){return mg(this,e,t)},get spa(){return this?.safeParseAsync},set spa(e){hi(this,"spa",e)},validate(e,t){return Fc(this,e,t)},validateAsync(e,t){return zc(this,e,t)},encode:function e(t,n){return gg(this,t,n,{callee:e})},decode:function e(t,n){return _g(this,t,n,{callee:e})},encodeAsync:async function e(t,n){return await xg(this,t,n,{callee:e})},decodeAsync:async function e(t,n){return await vg(this,t,n,{callee:e})},safeEncode(e,t){return yg(this,e,t)},safeDecode(e,t){return bg(this,e,t)},async safeEncodeAsync(e,t){return Sg(this,e,t)},async safeDecodeAsync(e,t){return Mg(this,e,t)},toJSONSchema(e){return Nm(this,{})(e)},get description(){return cr.get(this)?.description},get _def(){return this._zod.def}}),Cg=q("_ZodString",(e,t)=>{Zo.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Vm(e,n,i,r)},Rf({format:(e)=>Sn(e).format??null,minLength:(e)=>Sn(e).minimum??null,maxLength:(e)=>Sn(e).maximum??null},{regex(...e){return this.check(el(...e))},includes(...e){return this.check(il(...e))},startsWith(...e){return this.check(rl(...e))},endsWith(...e){return this.check(sl(...e))},min(...e){return this.check(Nr(...e))},max(...e){return this.check(ta(...e))},length(...e){return this.check(na(...e))},nonempty(...e){return this.check(Nr(1,...e))},lowercase(e){return this.check(tl(e))},uppercase(e){return this.check(nl(e))},trim(){return this.check(al())},normalize(...e){return this.check(ol(...e))},toLowerCase(){return this.check(cl())},toUpperCase(){return this.check(ll())},slugify(){return this.check(ul())}})),by=q("ZodString",(e,t)=>{Zo.init(e,t),Cg.init(e,t)},{email(e){return this.check(qp(Ey,e))},url(e){return this.check(em(Ry,e))},jwt(e){return this.check(mm(Vy,e))},emoji(e){return this.check(tm(Cy,e))},guid(e){return this.check(Yp(Ay,e))},uuid(e){return this.check(jp(sa,e))},uuidv4(e){return this.check(Jp(sa,e))},uuidv6(e){return this.check(Kp(sa,e))},uuidv7(e){return this.check(Qp(sa,e))},nanoid(e){return this.check(nm(Iy,e))},cuid(e){return this.check(im(Py,e))},cuid2(e){return this.check(rm(Ly,e))},ulid(e){return this.check(sm(Ny,e))},base64(e){return this.check(fm(By,e))},base64url(e){return this.check(dm(Gy,e))},xid(e){return this.check(om(Dy,e))},ksuid(e){return this.check(am(Oy,e))},ipv4(e){return this.check(cm(Uy,e))},ipv6(e){return this.check(lm(Fy,e))},cidrv4(e){return this.check(um(zy,e))},cidrv6(e){return this.check(hm(ky,e))},e164(e){return this.check(pm(Hy,e))},datetime(e){return this.check(gm(Sy,e))},date(e){return this.check(_m(My,e))},time(e){return this.check(xm(wy,e))},duration(e){return this.check(vm(Ty,e))}});function Xt(e){return Xp(by,e)}var yt=q("ZodStringFormat",(e,t)=>{xt.init(e,t),Cg.init(e,t)}),Sy=q("ZodISODateTime",(e,t)=>{ip.init(e,t),yt.init(e,t)}),My=q("ZodISODate",(e,t)=>{rp.init(e,t),yt.init(e,t)}),wy=q("ZodISOTime",(e,t)=>{sp.init(e,t),yt.init(e,t)}),Ty=q("ZodISODuration",(e,t)=>{op.init(e,t),yt.init(e,t)}),Ey=q("ZodEmail",(e,t)=>{Zd.init(e,t),yt.init(e,t)});var Ay=q("ZodGUID",(e,t)=>{$d.init(e,t),yt.init(e,t)});var sa=q("ZodUUID",(e,t)=>{Wd.init(e,t),yt.init(e,t)});var Ry=q("ZodURL",(e,t)=>{Yd.init(e,t),yt.init(e,t)});var Cy=q("ZodEmoji",(e,t)=>{jd.init(e,t),yt.init(e,t)});var Iy=q("ZodNanoID",(e,t)=>{Jd.init(e,t),yt.init(e,t)});var Py=q("ZodCUID",(e,t)=>{Kd.init(e,t),yt.init(e,t)});var Ly=q("ZodCUID2",(e,t)=>{Qd.init(e,t),yt.init(e,t)});var Ny=q("ZodULID",(e,t)=>{ep.init(e,t),yt.init(e,t)});var Dy=q("ZodXID",(e,t)=>{tp.init(e,t),yt.init(e,t)});var Oy=q("ZodKSUID",(e,t)=>{np.init(e,t),yt.init(e,t)});var Uy=q("ZodIPv4",(e,t)=>{ap.init(e,t),yt.init(e,t)});var Fy=q("ZodIPv6",(e,t)=>{lp.init(e,t),yt.init(e,t)});var zy=q("ZodCIDRv4",(e,t)=>{up.init(e,t),yt.init(e,t)});var ky=q("ZodCIDRv6",(e,t)=>{hp.init(e,t),yt.init(e,t)});var By=q("ZodBase64",(e,t)=>{dp.init(e,t),yt.init(e,t)});var Gy=q("ZodBase64URL",(e,t)=>{pp.init(e,t),yt.init(e,t)});var Hy=q("ZodE164",(e,t)=>{mp.init(e,t),yt.init(e,t)});var Vy=q("ZodJWT",(e,t)=>{gp.init(e,t),yt.init(e,t)});var Ig=q("ZodNumber",(e,t)=>{Yc.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>$m(e,n,i,r),e.isFinite=!0},Rf({minValue:(e)=>{let{minimum:t,exclusiveMinimum:n}=Sn(e);return Math.max(t??Number.NEGATIVE_INFINITY,n??Number.NEGATIVE_INFINITY)},maxValue:(e)=>{let{maximum:t,exclusiveMaximum:n}=Sn(e);return Math.min(t??Number.POSITIVE_INFINITY,n??Number.POSITIVE_INFINITY)},isInt:(e)=>{let{isInt:t,multipleOf:n}=Sn(e);return!!t||!!n?.some(Number.isSafeInteger)},format:(e)=>Sn(e).format??null},{gt(e,t){return this.check(Qo(e,t))},gte(e,t){return this.check(Ls(e,t))},min(e,t){return this.check(Ls(e,t))},lt(e,t){return this.check(Ko(e,t))},lte(e,t){return this.check(Ps(e,t))},max(e,t){return this.check(Ps(e,t))},int(e){return this.check(wg(e))},safe(e){return this.check(wg(e))},positive(e){return this.check(Qo(0,e))},nonnegative(e){return this.check(Ls(0,e))},negative(e){return this.check(Ko(0,e))},nonpositive(e){return this.check(Ps(0,e))},multipleOf(e,t){return this.check(ea(e,t))},step(e,t){return this.check(ea(e,t))},finite(){return this}}));function $y(e){return ym(Ig,e)}var Wy=q("ZodNumberFormat",(e,t)=>{_p.init(e,t),Ig.init(e,t)});function wg(e){return bm(Wy,e)}var Zy=q("ZodBoolean",(e,t)=>{xp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Wm(e,n,i,r)});function Xy(e){return Sm(Zy,e)}var qy=q("ZodUnknown",(e,t)=>{vp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Xm(e,n,i,r)});function lr(){return Mm(qy)}var Yy=q("ZodNever",(e,t)=>{yp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Zm(e,n,i,r)});function jy(e){return wm(Yy,e)}var Jy=q("ZodArray",(e,t)=>{oa(),bp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Km(e,n,i,r),e.element=t.element},{min(e,t){return this.check(Nr(e,t))},nonempty(e){return this.check(Nr(1,e))},max(e,t){return this.check(ta(e,t))},length(e,t){return this.check(na(e,t))},unwrap(){return this.element}});function aa(e,t){return Tm(Jy,e,t)}var Ky=q("ZodObject",(e,t)=>{oa(),wp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Qm(e,n,i,r),Cv(e,"shape",(n)=>n._zod.def.shape,!1)},{keyof(){return Lg(Object.keys(this._zod.def.shape))},catchall(e){return this.clone(cn(this._zod.def,{catchall:e}))},passthrough(){return this.clone(cn(this._zod.def,{catchall:lr()}))},loose(){return this.clone(cn(this._zod.def,{catchall:lr()}))},strict(){return this.clone(cn(this._zod.def,{catchall:jy()}))},strip(){return this.clone(cn(this._zod.def,{catchall:void 0}))},extend(e){return Sv(this,e)},safeExtend(e){return Mv(this,e)},merge(e){return wv(this,e)},pick(e){return yv(this,e)},omit(e){return bv(this,e)},partial(...e){return wf(Ng,this,e[0])},exactPartial(...e){return wf(Dg,this,e[0],"exactPartial")},required(...e){return Tv(Og,this,e[0])}});function Os(e,t){let n={type:"object",shape:e??{},...Te(t)};return new Ky(n)}var Qy=q("ZodUnion",(e,t)=>{Tp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>eg(e,n,i,r),e.options=t.options});function eb(e,t){return new Qy({type:"union",options:e,...Te(t)})}var tb=q("ZodIntersection",(e,t)=>{Ep.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>tg(e,n,i,r)});function nb(e,t){return new tb({type:"intersection",left:e,right:t})}var Tg=q("ZodRecord",(e,t)=>{oa(),Ap.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>ng(e,n,i,r),e.keyType=t.keyType,e.valueType=t.valueType});function Pg(e,t,n){if(!t||!t._zod)return new Tg({type:"record",keyType:Xt(),valueType:e,...Te(t)});return new Tg({type:"record",keyType:e,valueType:t,...Te(n)})}var yl=q("ZodEnum",(e,t)=>{Rp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(i,r,s)=>qm(e,i,r,s),e.enum=t.entries,e.options=[...e._zod.values];let n=new Set(Object.keys(t.entries));e.extract=(i,r)=>{let s={};for(let o of i)if(n.has(o))s[o]=t.entries[o];else throw Error(`Key ${o} not found in enum`);return new yl({...t,checks:[],...Te(r),entries:s})},e.exclude=(i,r)=>{let s={...t.entries};for(let o of i)if(n.has(o))delete s[o];else throw Error(`Key ${o} not found in enum`);return new yl({...t,checks:[],...Te(r),entries:s})}});function Lg(e,t){let n=Array.isArray(e)?Object.fromEntries(e.map((i)=>[i,i])):e;return new yl({type:"enum",entries:n,...Te(t)})}var ib=q("ZodLiteral",(e,t)=>{Cp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Ym(e,n,i,r),e.values=new Set(t.values),Object.defineProperty(e,"value",{get(){if(t.values.length>1)throw Error("This schema contains multiple valid literal values. Use `.values` instead.");return t.values[0]}})});function rb(e,t){return new ib({type:"literal",values:Array.isArray(e)?e:[e],...Te(t)})}var sb=q("ZodTransform",(e,t)=>{oa(),Ip.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Jm(e,n,i,r),e._zod.parse=(n,i)=>{if(i.direction==="backward")throw new Ts(e.constructor.name);n.addIssue=(s)=>{if(typeof s==="string")n.issues.push(ar(s,n.value,t));else{let o=s;if(o.fatal)o.continue=!1;if(o.code??(o.code="custom"),!("input"in o))o.input=n.value;o.inst??(o.inst=e),n.issues.push(ar(o))}};let r=t.transform(n.value,n);if(r instanceof Promise)return r.then((s)=>(n.value=s,n));return n.value=r,n}});function ob(e){return new sb({type:"transform",transform:e})}var Ng=q("ZodOptional",(e,t)=>{jc.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>xl(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function Eg(e){return new Ng({type:"optional",innerType:e})}var Dg=q("ZodExactOptional",(e,t)=>{Pp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>xl(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function ab(e){return new Dg({type:"optional",innerType:e})}var cb=q("ZodNullable",(e,t)=>{Lp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>ig(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function Ag(e){return new cb({type:"nullable",innerType:e})}var lb=q("ZodDefault",(e,t)=>{Np.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>og(e,n,i,r),e.unwrap=()=>e._zod.def.innerType,e.removeDefault=e.unwrap});function ub(e,t){return new lb({type:"default",innerType:e,get defaultValue(){return typeof t==="function"?t():Cc(t)}})}var hb=q("ZodPrefault",(e,t)=>{Dp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>ag(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function fb(e,t){return new hb({type:"prefault",innerType:e,get defaultValue(){return typeof t==="function"?t():Cc(t)}})}var Og=q("ZodNonOptional",(e,t)=>{Op.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>rg(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function db(e,t){return new Og({type:"nonoptional",innerType:e,...Te(t)})}var pb=q("ZodCatch",(e,t)=>{Up.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>cg(e,n,i,r),e.unwrap=()=>e._zod.def.innerType,e.removeCatch=e.unwrap});function mb(e,t){return new pb({type:"catch",innerType:e,catchValue:typeof t==="function"?t:Cf(t)})}var gb=q("ZodPipe",(e,t)=>{Fp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>lg(e,n,i,r),e.in=t.in,e.out=t.out});function Rg(e,t){return new gb({type:"pipe",in:e,out:t})}var _b=q("ZodReadonly",(e,t)=>{zp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>ug(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function xb(e){return new _b({type:"readonly",innerType:e})}var vb=q("ZodCustom",(e,t)=>{kp.init(e,t),vt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>jm(e,n,i,r)});function yb(e,t={}){return Em(vb,e,t)}function bb(e,t){return Am(e,t)}/*!
fflate - fast JavaScript compression/decompression
<https://101arrowz.github.io/fflate>
Licensed under MIT. https://github.com/101arrowz/fflate/blob/master/LICENSE
version 0.8.2
*/var bt=Uint8Array,hn=Uint16Array,Pl=Int32Array,ca=new bt([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),la=new bt([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Tl=new bt([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Hg=function(e,t){var n=new hn(31);for(var i=0;i<31;++i)n[i]=t+=1<<e[i-1];var r=new Pl(n[30]);for(var i=1;i<30;++i)for(var s=n[i];s<n[i+1];++s)r[s]=s-n[i]<<5|i;return{b:n,r}},Vg=Hg(ca,2),{b:$g,r:El}=Vg;$g[28]=258,El[258]=28;var Wg=Hg(la,0),{b:Mb,r:Ug}=Wg,Al=new hn(32768);for(je=0;je<32768;++je)Yn=(je&43690)>>1|(je&21845)<<1,Yn=(Yn&52428)>>2|(Yn&13107)<<2,Yn=(Yn&61680)>>4|(Yn&3855)<<4,Al[je]=((Yn&65280)>>8|(Yn&255)<<8)>>1;var Yn,je,Jn=function(e,t,n){var i=e.length,r=0,s=new hn(t);for(;r<i;++r)if(e[r])++s[e[r]-1];var o=new hn(t);for(r=1;r<t;++r)o[r]=o[r-1]+s[r-1]<<1;var a;if(n){a=new hn(1<<t);var c=15-t;for(r=0;r<i;++r)if(e[r]){var l=r<<4|e[r],u=t-e[r],h=o[e[r]-1]++<<u;for(var f=h|(1<<u)-1;h<=f;++h)a[Al[h]>>c]=l}}else{a=new hn(i);for(r=0;r<i;++r)if(e[r])a[r]=Al[o[e[r]-1]++]>>15-e[r]}return a},Di=new bt(288);for(je=0;je<144;++je)Di[je]=8;var je;for(je=144;je<256;++je)Di[je]=9;var je;for(je=256;je<280;++je)Di[je]=7;var je;for(je=280;je<288;++je)Di[je]=8;var je,zs=new bt(32);for(je=0;je<32;++je)zs[je]=5;var je,wb=Jn(Di,9,0),Tb=Jn(Di,9,1),Eb=Jn(zs,5,0),Ab=Jn(zs,5,1),bl=function(e){var t=e[0];for(var n=1;n<e.length;++n)if(e[n]>t)t=e[n];return t},Pn=function(e,t,n){var i=t/8|0;return(e[i]|e[i+1]<<8)>>(t&7)&n},Sl=function(e,t){var n=t/8|0;return(e[n]|e[n+1]<<8|e[n+2]<<16)>>(t&7)},Ll=function(e){return(e+7)/8|0},ks=function(e,t,n){if(t==null||t<0)t=0;if(n==null||n>e.length)n=e.length;return new bt(e.subarray(t,n))};var Rb=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],Qt=function(e,t,n){var i=Error(t||Rb[e]);if(i.code=e,Error.captureStackTrace)Error.captureStackTrace(i,Qt);if(!n)throw i;return i},Cb=function(e,t,n,i){var r=e.length,s=i?i.length:0;if(!r||t.f&&!t.l)return n||new bt(0);var o=!n,a=o||t.i!=2,c=t.i;if(o)n=new bt(r*3);var l=function(Ue){var ke=n.length;if(Ue>ke){var Ke=new bt(Math.max(ke*2,Ue));Ke.set(n),n=Ke}},u=t.f||0,h=t.p||0,f=t.b||0,{l:d,d:m,m:x,n:p}=t,g=r*8;do{if(!d){u=Pn(e,h,1);var A=Pn(e,h+1,3);if(h+=3,!A){var E=Ll(h)+4,y=e[E-4]|e[E-3]<<8,w=E+y;if(w>r){if(c)Qt(0);break}if(a)l(f+y);n.set(e.subarray(E,w),f),t.b=f+=y,t.p=h=w*8,t.f=u;continue}else if(A==1)d=Tb,m=Ab,x=9,p=5;else if(A==2){var T=Pn(e,h,31)+257,R=Pn(e,h+10,15)+4,_=T+Pn(e,h+5,31)+1;h+=14;var S=new bt(_),U=new bt(19);for(var C=0;C<R;++C)U[Tl[C]]=Pn(e,h+C*3,7);h+=R*3;var z=bl(U),j=(1<<z)-1,F=Jn(U,z,1);for(var C=0;C<_;){var H=F[Pn(e,h,j)];h+=H&15;var E=H>>4;if(E<16)S[C++]=E;else{var V=0,O=0;if(E==16)O=3+Pn(e,h,3),h+=2,V=S[C-1];else if(E==17)O=3+Pn(e,h,7),h+=3;else if(E==18)O=11+Pn(e,h,127),h+=7;while(O--)S[C++]=V}}var K=S.subarray(0,T),Q=S.subarray(T);x=bl(K),p=bl(Q),d=Jn(K,x,1),m=Jn(Q,p,1)}else Qt(1);if(h>g){if(c)Qt(0);break}}if(a)l(f+131072);var se=(1<<x)-1,me=(1<<p)-1,_e=h;for(;;_e=h){var V=d[Sl(e,h)&se],qe=V>>4;if(h+=V&15,h>g){if(c)Qt(0);break}if(!V)Qt(2);if(qe<256)n[f++]=qe;else if(qe==256){_e=h,d=null;break}else{var Ge=qe-254;if(qe>264){var C=qe-257,Z=ca[C];Ge=Pn(e,h,(1<<Z)-1)+$g[C],h+=Z}var ne=m[Sl(e,h)&me],fe=ne>>4;if(!ne)Qt(3);h+=ne&15;var Q=Mb[fe];if(fe>3){var Z=la[fe];Q+=Sl(e,h)&(1<<Z)-1,h+=Z}if(h>g){if(c)Qt(0);break}if(a)l(f+131072);var de=f+Ge;if(f<Q){var Re=s-Q,Ze=Math.min(Q,de);if(Re+f<0)Qt(3);for(;f<Ze;++f)n[f]=i[Re+f]}for(;f<de;++f)n[f]=n[f-Q]}}if(t.l=d,t.p=_e,t.b=f,t.f=u,d)u=1,t.m=x,t.d=m,t.n=p}while(!u);return f!=n.length&&o?ks(n,0,f):n.subarray(0,f)},pi=function(e,t,n){n<<=t&7;var i=t/8|0;e[i]|=n,e[i+1]|=n>>8},Us=function(e,t,n){n<<=t&7;var i=t/8|0;e[i]|=n,e[i+1]|=n>>8,e[i+2]|=n>>16},Ml=function(e,t){var n=[];for(var i=0;i<e.length;++i)if(e[i])n.push({s:i,f:e[i]});var r=n.length,s=n.slice();if(!r)return{t:Xg,l:0};if(r==1){var o=new bt(n[0].s+1);return o[n[0].s]=1,{t:o,l:1}}n.sort(function(w,T){return w.f-T.f}),n.push({s:-1,f:25001});var a=n[0],c=n[1],l=0,u=1,h=2;n[0]={s:-1,f:a.f+c.f,l:a,r:c};while(u!=r-1)a=n[n[l].f<n[h].f?l++:h++],c=n[l!=u&&n[l].f<n[h].f?l++:h++],n[u++]={s:-1,f:a.f+c.f,l:a,r:c};var f=s[0].s;for(var i=1;i<r;++i)if(s[i].s>f)f=s[i].s;var d=new hn(f+1),m=Rl(n[u-1],d,0);if(m>t){var i=0,x=0,p=m-t,g=1<<p;s.sort(function(T,R){return d[R.s]-d[T.s]||T.f-R.f});for(;i<r;++i){var A=s[i].s;if(d[A]>t)x+=g-(1<<m-d[A]),d[A]=t;else break}x>>=p;while(x>0){var E=s[i].s;if(d[E]<t)x-=1<<t-d[E]++-1;else++i}for(;i>=0&&x;--i){var y=s[i].s;if(d[y]==t)--d[y],++x}m=t}return{t:new bt(d),l:m}},Rl=function(e,t,n){return e.s==-1?Math.max(Rl(e.l,t,n+1),Rl(e.r,t,n+1)):t[e.s]=n},Fg=function(e){var t=e.length;while(t&&!e[--t]);var n=new hn(++t),i=0,r=e[0],s=1,o=function(c){n[i++]=c};for(var a=1;a<=t;++a)if(e[a]==r&&a!=t)++s;else{if(!r&&s>2){for(;s>138;s-=138)o(32754);if(s>2)o(s>10?s-11<<5|28690:s-3<<5|12305),s=0}else if(s>3){o(r),--s;for(;s>6;s-=6)o(8304);if(s>2)o(s-3<<5|8208),s=0}while(s--)o(r);s=1,r=e[a]}return{c:n.subarray(0,i),n:t}},Fs=function(e,t){var n=0;for(var i=0;i<t.length;++i)n+=e[i]*t[i];return n},Zg=function(e,t,n){var i=n.length,r=Ll(t+2);e[r]=i&255,e[r+1]=i>>8,e[r+2]=e[r]^255,e[r+3]=e[r+1]^255;for(var s=0;s<i;++s)e[r+s+4]=n[s];return(r+4+i)*8},zg=function(e,t,n,i,r,s,o,a,c,l,u){pi(t,u++,n),++r[256];var h=Ml(r,15),{t:f,l:d}=h,m=Ml(s,15),{t:x,l:p}=m,g=Fg(f),{c:A,n:E}=g,y=Fg(x),{c:w,n:T}=y,R=new hn(19);for(var _=0;_<A.length;++_)++R[A[_]&31];for(var _=0;_<w.length;++_)++R[w[_]&31];var S=Ml(R,7),{t:U,l:C}=S,z=19;for(;z>4&&!U[Tl[z-1]];--z);var j=l+5<<3,F=Fs(r,Di)+Fs(s,zs)+o,H=Fs(r,f)+Fs(s,x)+o+14+3*z+Fs(R,U)+2*R[16]+3*R[17]+7*R[18];if(c>=0&&j<=F&&j<=H)return Zg(t,u,e.subarray(c,c+l));var V,O,K,Q;if(pi(t,u,1+(H<F)),u+=2,H<F){V=Jn(f,d,0),O=f,K=Jn(x,p,0),Q=x;var se=Jn(U,C,0);pi(t,u,E-257),pi(t,u+5,T-1),pi(t,u+10,z-4),u+=14;for(var _=0;_<z;++_)pi(t,u+3*_,U[Tl[_]]);u+=3*z;var me=[A,w];for(var _e=0;_e<2;++_e){var qe=me[_e];for(var _=0;_<qe.length;++_){var Ge=qe[_]&31;if(pi(t,u,se[Ge]),u+=U[Ge],Ge>15)pi(t,u,qe[_]>>5&127),u+=qe[_]>>12}}}else V=wb,O=Di,K=Eb,Q=zs;for(var _=0;_<a;++_){var Z=i[_];if(Z>255){var Ge=Z>>18&31;if(Us(t,u,V[Ge+257]),u+=O[Ge+257],Ge>7)pi(t,u,Z>>23&31),u+=ca[Ge];var ne=Z&31;if(Us(t,u,K[ne]),u+=Q[ne],ne>3)Us(t,u,Z>>5&8191),u+=la[ne]}else Us(t,u,V[Z]),u+=O[Z]}return Us(t,u,V[256]),u+O[256]},Ib=new Pl([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),Xg=new bt(0),Pb=function(e,t,n,i,r,s){var o=s.z||e.length,a=new bt(i+o+5*(1+Math.ceil(o/7000))+r),c=a.subarray(i,a.length-r),l=s.l,u=(s.r||0)&7;if(t){if(u)c[0]=s.r>>3;var h=Ib[t-1],f=h>>13,d=h&8191,m=(1<<n)-1,x=s.p||new hn(32768),p=s.h||new hn(m+1),g=Math.ceil(n/3),A=2*g,E=function(Ye){return(e[Ye]^e[Ye+1]<<g^e[Ye+2]<<A)&m},y=new Pl(25000),w=new hn(288),T=new hn(32),R=0,_=0,S=s.i||0,U=0,C=s.w||0,z=0;for(;S+2<o;++S){var j=E(S),F=S&32767,H=p[j];if(x[F]=H,p[j]=F,C<=S){var V=o-S;if((R>7000||U>24576)&&(V>423||!l)){u=zg(e,c,0,y,w,T,_,U,z,S-z,u),U=R=_=0,z=S;for(var O=0;O<286;++O)w[O]=0;for(var O=0;O<30;++O)T[O]=0}var K=2,Q=0,se=d,me=F-H&32767;if(V>2&&j==E(S-me)){var _e=Math.min(f,V)-1,qe=Math.min(32767,S),Ge=Math.min(258,V);while(me<=qe&&--se&&F!=H){if(e[S+K]==e[S+K-me]){var Z=0;for(;Z<Ge&&e[S+Z]==e[S+Z-me];++Z);if(Z>K){if(K=Z,Q=me,Z>_e)break;var ne=Math.min(me,Z-2),fe=0;for(var O=0;O<ne;++O){var de=S-me+O&32767,Re=x[de],Ze=de-Re&32767;if(Ze>fe)fe=Ze,H=de}}}F=H,H=x[F],me+=F-H&32767}}if(Q){y[U++]=268435456|El[K]<<18|Ug[Q];var Ue=El[K]&31,ke=Ug[Q]&31;_+=ca[Ue]+la[ke],++w[257+Ue],++T[ke],C=S+K,++R}else y[U++]=e[S],++w[e[S]]}}for(S=Math.max(S,C);S<o;++S)y[U++]=e[S],++w[e[S]];if(u=zg(e,c,l,y,w,T,_,U,z,S-z,u),!l)s.r=u&7|c[u/8|0]<<3,u-=7,s.h=p,s.p=x,s.i=S,s.w=C}else{for(var S=s.w||0;S<o+l;S+=65535){var Ke=S+65535;if(Ke>=o)c[u/8|0]=l,Ke=o;u=Zg(c,u+1,e.subarray(S,Ke))}s.i=o}return ks(a,0,i+Ll(u)+r)},Lb=function(){var e=new Int32Array(256);for(var t=0;t<256;++t){var n=t,i=9;while(--i)n=(n&1&&-306674912)^n>>>1;e[t]=n}return e}(),Nb=function(){var e=-1;return{p:function(t){var n=e;for(var i=0;i<t.length;++i)n=Lb[n&255^t[i]]^n>>>8;e=n},d:function(){return~e}}};var Db=function(e,t,n,i,r){if(!r){if(r={l:1},t.dictionary){var s=t.dictionary.subarray(-32768),o=new bt(s.length+e.length);o.set(s),o.set(e,s.length),e=o,r.w=s.length}}return Pb(e,t.level==null?6:t.level,t.mem==null?r.l?Math.ceil(Math.max(8,Math.min(13,Math.log(e.length)))*1.5):20:12+t.mem,n,i,r)},qg=function(e,t){var n={};for(var i in e)n[i]=e[i];for(var i in t)n[i]=t[i];return n};var jn=function(e,t){return e[t]|e[t+1]<<8},Ln=function(e,t){return(e[t]|e[t+1]<<8|e[t+2]<<16|e[t+3]<<24)>>>0},wl=function(e,t){return Ln(e,t)+Ln(e,t+4)*4294967296},$t=function(e,t,n){for(;n;++t)e[t]=n,n>>>=8};function Ob(e,t){return Db(e,t||{},0,0)}function Ub(e,t){return Cb(e,{i:2},t&&t.out,t&&t.dictionary)}var Yg=function(e,t,n,i){for(var r in e){var s=e[r],o=t+r,a=i;if(Array.isArray(s))a=qg(i,s[1]),s=s[0];if(s instanceof bt)n[o]=[s,a];else n[o+="/"]=[new bt(0),a],Yg(s,o,n,i)}},kg=typeof TextEncoder<"u"&&new TextEncoder,Cl=typeof TextDecoder<"u"&&new TextDecoder,Fb=0;try{Cl.decode(Xg,{stream:!0}),Fb=1}catch(e){}var zb=function(e){for(var t="",n=0;;){var i=e[n++],r=(i>127)+(i>223)+(i>239);if(n+r>e.length)return{s:t,r:ks(e,n-1)};if(!r)t+=String.fromCharCode(i);else if(r==3)i=((i&15)<<18|(e[n++]&63)<<12|(e[n++]&63)<<6|e[n++]&63)-65536,t+=String.fromCharCode(55296|i>>10,56320|i&1023);else if(r&1)t+=String.fromCharCode((i&31)<<6|e[n++]&63);else t+=String.fromCharCode((i&15)<<12|(e[n++]&63)<<6|e[n++]&63)}};function Bg(e,t){if(t){var n=new bt(e.length);for(var i=0;i<e.length;++i)n[i]=e.charCodeAt(i);return n}if(kg)return kg.encode(e);var r=e.length,s=new bt(e.length+(e.length>>1)),o=0,a=function(u){s[o++]=u};for(var i=0;i<r;++i){if(o+5>s.length){var c=new bt(o+8+(r-i<<1));c.set(s),s=c}var l=e.charCodeAt(i);if(l<128||t)a(l);else if(l<2048)a(192|l>>6),a(128|l&63);else if(l>55295&&l<57344)l=65536+(l&1047552)|e.charCodeAt(++i)&1023,a(240|l>>18),a(128|l>>12&63),a(128|l>>6&63),a(128|l&63);else a(224|l>>12),a(128|l>>6&63),a(128|l&63)}return ks(s,0,o)}function kb(e,t){if(t){var n="";for(var i=0;i<e.length;i+=16384)n+=String.fromCharCode.apply(null,e.subarray(i,i+16384));return n}else if(Cl)return Cl.decode(e);else{var r=zb(e),{s,r:n}=r;if(n.length)Qt(8);return s}}var Bb=function(e,t){return t+30+jn(e,t+26)+jn(e,t+28)},Gb=function(e,t,n){var i=jn(e,t+28),r=kb(e.subarray(t+46,t+46+i),!(jn(e,t+8)&2048)),s=t+46+i,o=Ln(e,t+20),a=n&&o==4294967295?Hb(e,s):[o,Ln(e,t+24),Ln(e,t+42)],c=a[0],l=a[1],u=a[2];return[jn(e,t+10),c,l,r,s+jn(e,t+30)+jn(e,t+32),u]},Hb=function(e,t){for(;jn(e,t)!=1;t+=4+jn(e,t+2));return[wl(e,t+12),wl(e,t+4),wl(e,t+20)]},Il=function(e){var t=0;if(e)for(var n in e){var i=e[n].length;if(i>65535)Qt(9);t+=i+4}return t},Gg=function(e,t,n,i,r,s,o,a){var c=i.length,l=n.extra,u=a&&a.length,h=Il(l);if($t(e,t,o!=null?33639248:67324752),t+=4,o!=null)e[t++]=20,e[t++]=n.os;e[t]=20,t+=2,e[t++]=n.flag<<1|(s<0&&8),e[t++]=r&&8,e[t++]=n.compression&255,e[t++]=n.compression>>8;var f=new Date(n.mtime==null?Date.now():n.mtime),d=f.getFullYear()-1980;if(d<0||d>119)Qt(10);if($t(e,t,d<<25|f.getMonth()+1<<21|f.getDate()<<16|f.getHours()<<11|f.getMinutes()<<5|f.getSeconds()>>1),t+=4,s!=-1)$t(e,t,n.crc),$t(e,t+4,s<0?-s-2:s),$t(e,t+8,n.size);if($t(e,t+12,c),$t(e,t+14,h),t+=16,o!=null)$t(e,t,u),$t(e,t+6,n.attrs),$t(e,t+10,o),t+=14;if(e.set(i,t),t+=c,h)for(var m in l){var x=l[m],p=x.length;$t(e,t,+m),$t(e,t+2,p),e.set(x,t+4),t+=4+p}if(u)e.set(a,t),t+=u;return t},Vb=function(e,t,n,i,r){$t(e,t,101010256),$t(e,t+8,n),$t(e,t+10,n),$t(e,t+12,i),$t(e,t+16,r)};function jg(e,t){if(!t)t={};var n={},i=[];Yg(e,"",n,t);var r=0,s=0;for(var o in n){var a=n[o],c=a[0],l=a[1],u=l.level==0?0:8,h=Bg(o),f=h.length,d=l.comment,m=d&&Bg(d),x=m&&m.length,p=Il(l.extra);if(f>65535)Qt(11);var g=u?Ob(c,l):c,A=g.length,E=Nb();E.p(c),i.push(qg(l,{size:c.length,crc:E.d(),c:g,f:h,m,u:f!=o.length||m&&d.length!=x,o:r,compression:u})),r+=30+f+p+A,s+=76+2*(f+p)+(x||0)+A}var y=new bt(s+22),w=r,T=s-r;for(var R=0;R<i.length;++R){var h=i[R];Gg(y,h.o,h,h.f,h.u,h.c.length);var _=30+h.f.length+Il(h.extra);y.set(h.c,h.o+_),Gg(y,r,h,h.f,h.u,h.c.length,h.o,h.m),r+=16+_+(h.m?h.m.length:0)}return Vb(y,r,i.length,T,w),y}function Jg(e,t){var n={},i=e.length-22;for(;Ln(e,i)!=101010256;--i)if(!i||e.length-i>65558)Qt(13);var r=jn(e,i+8);if(!r)return{};var s=Ln(e,i+16),o=s==4294967295||r==65535;if(o){var a=Ln(e,i-12);if(o=Ln(e,a)==101075792,o)r=Ln(e,a+32),s=Ln(e,a+48)}var c=t&&t.filter;for(var l=0;l<r;++l){var u=Gb(e,s,o),h=u[0],f=u[1],d=u[2],m=u[3],x=u[4],p=u[5],g=Bb(e,p);if(s=x,!c||c({name:m,size:f,originalSize:d,compression:h}))if(!h)n[m]=ks(e,g,g+f);else if(h==8)n[m]=Ub(e.subarray(g,g+f),{out:new bt(d)});else Qt(14,"unknown compression type "+h)}return n}var mi=67108864,Nl=Xt().regex(/^[a-z][a-z0-9_-]{0,79}$/),$b=Xt().regex(/^sha256:[a-f0-9]{64}$/),Kg=Os({version:rb("kiln.asset.v1"),assetId:Nl,revisionId:Nl,parentRevision:Nl.optional(),name:Xt().min(1).max(200),tags:aa(Xt().max(80)).max(30),createdAt:Xt().datetime(),description:Xt().max(4000).optional(),brief:Xt().max(8000).optional(),attribution:Os({model:Xt().max(200).optional(),harness:Xt().max(200).optional(),author:Xt().max(200).optional()}).optional(),editable:Xy(),files:Pg(Xt(),Os({sha256:$b,bytes:$y().int().nonnegative().max(mi)})),build:Os({engine:Xt(),options:Pg(Xt(),lr()),warnings:aa(Xt()),integration:lr().optional(),qa:lr().optional(),dependencies:aa(lr()).optional(),rebuild:Lg(["engine-required","external-dependencies-required"])}).optional(),preview:Os({fidelity:lr().optional(),error:Xt().optional()}).optional()}),Wb=new Set(["asset.glb","source.kiln.js","preview.png"]);function Qg(e){let t=Kg.parse(e.manifest),n=Object.keys(e.files);if(n.length!==Object.keys(t.files).length||!n.includes("asset.glb"))throw Error("Asset file inventory mismatch");let i=0;for(let r of n){if(!Wb.has(r)||!t.files[r]||t.files[r].bytes!==e.files[r].length)throw Error("Invalid asset file inventory");i+=e.files[r].length}if(i>mi||t.editable!==n.includes("source.kiln.js"))throw Error("Invalid asset size or source inventory");if((e.files["source.kiln.js"]?.length??0)>1048576)throw Error("Source exceeds 1 MiB");Dl(e.files["asset.glb"])}function Dl(e){if(e.length<20||e.length>mi)throw Error("Invalid GLB size");let t=new DataView(e.buffer,e.byteOffset,e.byteLength);if(t.getUint32(0,!0)!==1179937895||t.getUint32(4,!0)!==2||t.getUint32(8,!0)!==e.length||t.getUint32(16,!0)!==1313821514)throw Error("Invalid GLB header");let n=20+t.getUint32(12,!0);if(n>e.length)throw Error("Invalid GLB JSON length");let i=JSON.parse(new TextDecoder().decode(e.subarray(20,n)));for(let r of[...i.buffers??[],...i.images??[]])if(r.uri&&!String(r.uri).startsWith("data:"))throw Error("GLB must embed its resources")}function Ol(e){if(!e.length||e.length>100)throw Error("Bundle requires 1..100 revisions");let t={},n=0;for(let i of e){Qg(i);let r=`${i.manifest.assetId}/${i.manifest.revisionId}/`;if(t[`${r}manifest.json`])throw Error("Duplicate bundle revision");t[`${r}manifest.json`]=new TextEncoder().encode(JSON.stringify(i.manifest,null,2));for(let[s,o]of Object.entries(i.files))t[r+s]=o}for(let i of Object.values(t))n+=i.length;if(n>mi)throw Error("Bundle exceeds 64 MiB");return jg(t,{level:0})}function e_(e){if(e.length>mi+1048576)throw Error("Bundle exceeds 64 MiB");let t=0,n=0,i=Jg(e,{filter:(o)=>{if(t+=o.originalSize,n++,t>mi||n>400||!/^[a-z][a-z0-9_-]{0,79}\/[a-z][a-z0-9_-]{0,79}\/(manifest\.json|asset\.glb|source\.kiln\.js|preview\.png)$/.test(o.name))throw Error("Unsafe or oversized asset bundle");return!0}}),r=[],s=new Set;for(let[o,a]of Object.entries(i)){if(!o.endsWith("/manifest.json"))continue;if(a.length>1048576)throw Error("Manifest exceeds 1 MiB");let c=Kg.parse(JSON.parse(new TextDecoder().decode(a))),l=`${c.assetId}/${c.revisionId}/`;if(o!==`${l}manifest.json`)throw Error("Bundle identity mismatch");let u={manifest:c,files:{}};s.add(o);for(let h of Object.keys(c.files)){if(!i[l+h])throw Error("Bundle file missing");u.files[h]=i[l+h],s.add(l+h)}Qg(u),r.push(u)}if(!r.length||s.size!==Object.keys(i).length)throw Error("Incomplete asset bundle");return r}var F_="185",Gi={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Hi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},z_=0,lu=1,k_=2;var Js=1,B_=2,es=3,Vi=0,jt=1,Tn=2,ni=0,Ks=1,uu=2,hu=3,fu=4,G_=5;var ts=100,H_=101,V_=102,$_=103,W_=104,Z_=200,X_=201,q_=202,Y_=203,j_=204,J_=205,K_=206,Q_=207,e0=208,t0=209,n0=210,i0=211,r0=212,s0=213,o0=214,a0=0,c0=1,l0=2,du=3,u0=4,h0=5,f0=6,d0=7,p0=0,m0=1,g0=2,kn=0,pu=1,mu=2,gu=3,Qs=4,_u=5,xu=6,vu=7;var ns=301,_r=302,za=303,ka=304,eo=306,is=1000,rs=1001,Ba=1002,Bn=1003,Ga=1004;var xr=1005;var Ht=1006,ss=1007;var ii=1008;var Gn=1009,_0=1010,x0=1011,to=1012,yu=1013,$i=1014,Mi=1015,wi=1016,bu=1017,Su=1018,os=1020,v0=35902,y0=35899,b0=1021,S0=1022,ri=1023,vr=1026,yr=1027,M0=1028,Mu=1029,br=1030,wu=1031;var Tu=1033,Ha=33776,Va=33777,$a=33778,Wa=33779,Eu=35840,Au=35841,Ru=35842,Cu=35843,Iu=36196,Pu=37492,Lu=37496,Nu=37488,Du=37489,Za=37490,Ou=37491,Uu=37808,Fu=37809,zu=37810,ku=37811,Bu=37812,Gu=37813,Hu=37814,Vu=37815,$u=37816,Wu=37817,Zu=37818,Xu=37819,qu=37820,Yu=37821,ju=36492,Ju=36494,Ku=36495,Qu=36283,eh=36284,Xa=36285,th=36286;var nh=2300,qa=2301;var ih=0,no=1,as=2;var rh=0,w0=1,Sr="",Wi="srgb",pn="srgb-linear",sh="linear",ht="srgb";var T0=512,E0=513,A0=514,Ya=515,R0=516,C0=517,ja=518,I0=519;var oh="300 es",ah=2000;function Zb(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function Xb(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Jr(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function P0(){let e=Jr("canvas");return e.style.display="block",e}var t_={},Kr=null;function js(...e){let t="THREE."+e.shift();if(Kr)Kr("log",t,...e);else console.log(t,...e)}function L0(e){let t=e[0];if(typeof t==="string"&&t.startsWith("TSL:")){let n=e[1];if(n&&n.isStackTrace)e[0]+=" "+n.getLocation();else e[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return e}function Me(...e){e=L0(e);let t="THREE."+e.shift();if(Kr)Kr("warn",t,...e);else{let n=e[0];if(n&&n.isStackTrace)console.warn(n.getError(t));else console.warn(t,...e)}}function Ne(...e){e=L0(e);let t="THREE."+e.shift();if(Kr)Kr("error",t,...e);else{let n=e[0];if(n&&n.isStackTrace)console.error(n.getError(t));else console.error(t,...e)}}function pr(...e){let t=e.join(" ");if(t in t_)return;t_[t]=!0,Me(...e)}function N0(e,t,n){return new Promise(function(i,r){function s(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:r();break;case e.TIMEOUT_EXPIRED:setTimeout(s,n);break;default:i()}}setTimeout(s,n)})}var D0={[0]:1,[2]:6,[4]:7,[3]:5,[1]:0,[6]:2,[7]:4,[5]:3};class Hn{addEventListener(e,t){if(this._listeners===void 0)this._listeners={};let n=this._listeners;if(n[e]===void 0)n[e]=[];if(n[e].indexOf(t)===-1)n[e].push(t)}hasEventListener(e,t){let n=this._listeners;if(n===void 0)return!1;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let i=n[e];if(i!==void 0){let r=i.indexOf(t);if(r!==-1)i.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let i=n.slice(0);for(let r=0,s=i.length;r<s;r++)i[r].call(this,e);e.target=null}}}var qt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],n_=1234567,qs=Math.PI/180,mr=180/Math.PI;function zn(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(qt[e&255]+qt[e>>8&255]+qt[e>>16&255]+qt[e>>24&255]+"-"+qt[t&255]+qt[t>>8&255]+"-"+qt[t>>16&15|64]+qt[t>>24&255]+"-"+qt[n&63|128]+qt[n>>8&255]+"-"+qt[n>>16&255]+qt[n>>24&255]+qt[i&255]+qt[i>>8&255]+qt[i>>16&255]+qt[i>>24&255]).toLowerCase()}function We(e,t,n){return Math.max(t,Math.min(n,e))}function ch(e,t){return(e%t+t)%t}function qb(e,t,n,i,r){return i+(e-t)*(r-i)/(n-t)}function Yb(e,t,n){if(e!==t)return(n-e)/(t-e);else return 0}function Ys(e,t,n){return(1-n)*e+n*t}function jb(e,t,n,i){return Ys(e,t,1-Math.exp(-n*i))}function Jb(e,t=1){return t-Math.abs(ch(e,t*2)-t)}function Kb(e,t,n){if(e<=t)return 0;if(e>=n)return 1;return e=(e-t)/(n-t),e*e*(3-2*e)}function Qb(e,t,n){if(e<=t)return 0;if(e>=n)return 1;return e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10)}function eS(e,t){return e+Math.floor(Math.random()*(t-e+1))}function tS(e,t){return e+Math.random()*(t-e)}function nS(e){return e*(0.5-Math.random())}function iS(e){if(e!==void 0)n_=e;let t=n_+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function rS(e){return e*qs}function sS(e){return e*mr}function oS(e){return(e&e-1)===0&&e!==0}function aS(e){return Math.pow(2,Math.ceil(Math.log(e)/Math.LN2))}function cS(e){return Math.pow(2,Math.floor(Math.log(e)/Math.LN2))}function lS(e,t,n,i,r){let{cos:s,sin:o}=Math,a=s(n/2),c=o(n/2),l=s((t+i)/2),u=o((t+i)/2),h=s((t-i)/2),f=o((t-i)/2),d=s((i-t)/2),m=o((i-t)/2);switch(r){case"XYX":e.set(a*u,c*h,c*f,a*l);break;case"YZY":e.set(c*f,a*u,c*h,a*l);break;case"ZXZ":e.set(c*h,c*f,a*u,a*l);break;case"XZX":e.set(a*u,c*m,c*d,a*l);break;case"YXY":e.set(c*d,a*u,c*m,a*l);break;case"ZYZ":e.set(c*m,c*d,a*u,a*l);break;default:Me("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Fn(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error("THREE.MathUtils: Invalid component type.")}}function rt(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error("THREE.MathUtils: Invalid component type.")}}var io={DEG2RAD:qs,RAD2DEG:mr,generateUUID:zn,clamp:We,euclideanModulo:ch,mapLinear:qb,inverseLerp:Yb,lerp:Ys,damp:jb,pingpong:Jb,smoothstep:Kb,smootherstep:Qb,randInt:eS,randFloat:tS,randFloatSpread:nS,seededRandom:iS,degToRad:rS,radToDeg:sS,isPowerOfTwo:oS,ceilPowerOfTwo:aS,floorPowerOfTwo:cS,setQuaternionFromProperEuler:lS,normalize:rt,denormalize:Fn};class Ie{static{Ie.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,s=this.y-e.y;return this.x=r*n-s*i+e.x,this.y=r*i+s*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Gt{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,s,o){let a=n[i+0],c=n[i+1],l=n[i+2],u=n[i+3],h=r[s+0],f=r[s+1],d=r[s+2],m=r[s+3];if(u!==m||a!==h||c!==f||l!==d){let x=a*h+c*f+l*d+u*m;if(x<0)h=-h,f=-f,d=-d,m=-m,x=-x;let p=1-o;if(x<0.9995){let g=Math.acos(x),A=Math.sin(g);p=Math.sin(p*g)/A,o=Math.sin(o*g)/A,a=a*p+h*o,c=c*p+f*o,l=l*p+d*o,u=u*p+m*o}else{a=a*p+h*o,c=c*p+f*o,l=l*p+d*o,u=u*p+m*o;let g=1/Math.sqrt(a*a+c*c+l*l+u*u);a*=g,c*=g,l*=g,u*=g}}e[t]=a,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,r,s){let o=n[i],a=n[i+1],c=n[i+2],l=n[i+3],u=r[s],h=r[s+1],f=r[s+2],d=r[s+3];return e[t]=o*d+l*u+a*f-c*h,e[t+1]=a*d+l*h+c*u-o*f,e[t+2]=c*d+l*f+o*h-a*u,e[t+3]=l*d-o*u-a*h-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let{_x:n,_y:i,_z:r,_order:s}=e,{cos:o,sin:a}=Math,c=o(n/2),l=o(i/2),u=o(r/2),h=a(n/2),f=a(i/2),d=a(r/2);switch(s){case"XYZ":this._x=h*l*u+c*f*d,this._y=c*f*u-h*l*d,this._z=c*l*d+h*f*u,this._w=c*l*u-h*f*d;break;case"YXZ":this._x=h*l*u+c*f*d,this._y=c*f*u-h*l*d,this._z=c*l*d-h*f*u,this._w=c*l*u+h*f*d;break;case"ZXY":this._x=h*l*u-c*f*d,this._y=c*f*u+h*l*d,this._z=c*l*d+h*f*u,this._w=c*l*u-h*f*d;break;case"ZYX":this._x=h*l*u-c*f*d,this._y=c*f*u+h*l*d,this._z=c*l*d-h*f*u,this._w=c*l*u+h*f*d;break;case"YZX":this._x=h*l*u+c*f*d,this._y=c*f*u+h*l*d,this._z=c*l*d-h*f*u,this._w=c*l*u-h*f*d;break;case"XZY":this._x=h*l*u-c*f*d,this._y=c*f*u-h*l*d,this._z=c*l*d+h*f*u,this._w=c*l*u+h*f*d;break;default:Me("Quaternion: .setFromEuler() encountered an unknown order: "+s)}if(t===!0)this._onChangeCallback();return this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],r=t[8],s=t[1],o=t[5],a=t[9],c=t[2],l=t[6],u=t[10],h=n+o+u;if(h>0){let f=0.5/Math.sqrt(h+1);this._w=0.25/f,this._x=(l-a)*f,this._y=(r-c)*f,this._z=(s-i)*f}else if(n>o&&n>u){let f=2*Math.sqrt(1+n-o-u);this._w=(l-a)/f,this._x=0.25*f,this._y=(i+s)/f,this._z=(r+c)/f}else if(o>u){let f=2*Math.sqrt(1+o-n-u);this._w=(r-c)/f,this._x=(i+s)/f,this._y=0.25*f,this._z=(a+l)/f}else{let f=2*Math.sqrt(1+u-n-o);this._w=(s-i)/f,this._x=(r+c)/f,this._y=(a+l)/f,this._z=0.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;if(n<0.00000001)if(n=0,Math.abs(e.x)>Math.abs(e.z))this._x=-e.y,this._y=e.x,this._z=0,this._w=n;else this._x=0,this._y=-e.z,this._z=e.y,this._w=n;else this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n;return this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(We(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();if(e===0)this._x=0,this._y=0,this._z=0,this._w=1;else e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e;return this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let{_x:n,_y:i,_z:r,_w:s}=e,{_x:o,_y:a,_z:c,_w:l}=t;return this._x=n*l+s*o+i*c-r*a,this._y=i*l+s*a+r*o-n*c,this._z=r*l+s*c+n*a-i*o,this._w=s*l-n*o-i*a-r*c,this._onChangeCallback(),this}slerp(e,t){let{_x:n,_y:i,_z:r,_w:s}=e,o=this.dot(e);if(o<0)n=-n,i=-i,r=-r,s=-s,o=-o;let a=1-t;if(o<0.9995){let c=Math.acos(o),l=Math.sin(c);a=Math.sin(a*c)/l,t=Math.sin(t*c)/l,this._x=this._x*a+n*t,this._y=this._y*a+i*t,this._z=this._z*a+r*t,this._w=this._w*a+s*t,this._onChangeCallback()}else this._x=this._x*a+n*t,this._y=this._y*a+i*t,this._z=this._z*a+r*t,this._w=this._w*a+s*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class N{static{N.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){if(n===void 0)n=this.z;return this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(i_.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(i_.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=e.elements,s=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*s,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*s,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*s,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,{x:r,y:s,z:o,w:a}=e,c=2*(s*i-o*n),l=2*(o*t-r*i),u=2*(r*n-s*t);return this.x=t+a*c+s*u-o*l,this.y=n+a*l+o*c-r*u,this.z=i+a*u+r*l-s*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let{x:n,y:i,z:r}=e,{x:s,y:o,z:a}=t;return this.x=i*a-r*o,this.y=r*s-n*a,this.z=n*o-i*s,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Ul.copy(this).projectOnVector(e),this.sub(Ul)}reflect(e){return this.sub(Ul.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}var Ul=new N,i_=new Gt;class Oe{static{Oe.prototype.isMatrix3=!0}constructor(e,t,n,i,r,s,o,a,c){if(this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0)this.set(e,t,n,i,r,s,o,a,c)}set(e,t,n,i,r,s,o,a,c){let l=this.elements;return l[0]=e,l[1]=i,l[2]=o,l[3]=t,l[4]=r,l[5]=a,l[6]=n,l[7]=s,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,s=n[0],o=n[3],a=n[6],c=n[1],l=n[4],u=n[7],h=n[2],f=n[5],d=n[8],m=i[0],x=i[3],p=i[6],g=i[1],A=i[4],E=i[7],y=i[2],w=i[5],T=i[8];return r[0]=s*m+o*g+a*y,r[3]=s*x+o*A+a*w,r[6]=s*p+o*E+a*T,r[1]=c*m+l*g+u*y,r[4]=c*x+l*A+u*w,r[7]=c*p+l*E+u*T,r[2]=h*m+f*g+d*y,r[5]=h*x+f*A+d*w,r[8]=h*p+f*E+d*T,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],s=e[4],o=e[5],a=e[6],c=e[7],l=e[8];return t*s*l-t*o*c-n*r*l+n*o*a+i*r*c-i*s*a}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],s=e[4],o=e[5],a=e[6],c=e[7],l=e[8],u=l*s-o*c,h=o*a-l*r,f=c*r-s*a,d=t*u+n*h+i*f;if(d===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/d;return e[0]=u*m,e[1]=(i*c-l*n)*m,e[2]=(o*n-i*s)*m,e[3]=h*m,e[4]=(l*t-i*a)*m,e[5]=(i*r-o*t)*m,e[6]=f*m,e[7]=(n*a-c*t)*m,e[8]=(s*t-n*r)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,s,o){let a=Math.cos(r),c=Math.sin(r);return this.set(n*a,n*c,-n*(a*s+c*o)+s+e,-i*c,i*a,-i*(-c*s+a*o)+o+t,0,0,1),this}scale(e,t){return pr("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Fl.makeScale(e,t)),this}rotate(e){return pr("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Fl.makeRotation(-e)),this}translate(e,t){return pr("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Fl.makeTranslation(e,t)),this}makeTranslation(e,t){if(e.isVector2)this.set(1,0,e.x,0,1,e.y,0,0,1);else this.set(1,0,e,0,1,t,0,0,1);return this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}var Fl=new Oe,r_=new Oe().set(0.4123908,0.3575843,0.1804808,0.212639,0.7151687,0.0721923,0.0193308,0.1191948,0.9505322),s_=new Oe().set(3.2409699,-1.5373832,-0.4986108,-0.9692436,1.8759675,0.0415551,0.0556301,-0.203977,1.0569715);function uS(){let e={enabled:!0,workingColorSpace:"srgb-linear",spaces:{},convert:function(r,s,o){if(this.enabled===!1||s===o||!s||!o)return r;if(this.spaces[s].transfer==="srgb")r.r=Si(r.r),r.g=Si(r.g),r.b=Si(r.b);if(this.spaces[s].primaries!==this.spaces[o].primaries)r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ);if(this.spaces[o].transfer==="srgb")r.r=jr(r.r),r.g=jr(r.g),r.b=jr(r.b);return r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){if(r==="")return"linear";return this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return pr("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),e.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return pr("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),e.colorSpaceToWorking(r,s)}},t=[0.64,0.33,0.3,0.6,0.15,0.06],n=[0.2126,0.7152,0.0722],i=[0.3127,0.329];return e.define({["srgb-linear"]:{primaries:t,whitePoint:i,transfer:"linear",toXYZ:r_,fromXYZ:s_,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:"srgb"},outputColorSpaceConfig:{drawingBufferColorSpace:"srgb"}},["srgb"]:{primaries:t,whitePoint:i,transfer:"srgb",toXYZ:r_,fromXYZ:s_,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:"srgb"}}}),e}var $e=uS();function Si(e){return e<0.04045?e*0.0773993808:Math.pow(e*0.9478672986+0.0521327014,2.4)}function jr(e){return e<0.0031308?e*12.92:1.055*Math.pow(e,0.41666)-0.055}var Ur;class lh{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src))return e.src;if(typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{if(Ur===void 0)Ur=Jr("canvas");Ur.width=e.width,Ur.height=e.height;let i=Ur.getContext("2d");if(e instanceof ImageData)i.putImageData(e,0,0);else i.drawImage(e,0,0,e.width,e.height);n=Ur}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Jr("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let s=0;s<r.length;s++)r[s]=Si(r[s]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)if(t instanceof Uint8Array||t instanceof Uint8ClampedArray)t[n]=Math.floor(Si(t[n]/255)*255);else t[n]=Si(t[n]);return{data:t,width:e.width,height:e.height}}else return Me("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}var hS=0;class ro{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:hS++}),this.uuid=zn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;if(typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement)e.set(t.videoWidth,t.videoHeight,0);else if(typeof VideoFrame<"u"&&t instanceof VideoFrame)e.set(t.displayWidth,t.displayHeight,0);else if(t!==null)e.set(t.width,t.height,t.depth||0);else e.set(0,0,0);return e}set needsUpdate(e){if(e===!0)this.version++}toJSON(e){let t=e===void 0||typeof e==="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let s=0,o=i.length;s<o;s++)if(i[s].isDataTexture)r.push(zl(i[s].image));else r.push(zl(i[s]))}else r=zl(i);n.url=r}if(!t)e.images[this.uuid]=n;return n}}function zl(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap)return lh.getDataURL(e);else if(e.data)return{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name};else return Me("Texture: Unable to serialize Texture."),{}}var fS=0,kl=new N;class wt extends Hn{constructor(e=wt.DEFAULT_IMAGE,t=wt.DEFAULT_MAPPING,n=1001,i=1001,r=1006,s=1008,o=1023,a=1009,c=wt.DEFAULT_ANISOTROPY,l=""){super();this.isTexture=!0,Object.defineProperty(this,"id",{value:fS++}),this.uuid=zn(),this.name="",this.source=new ro(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=s,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=a,this.offset=new Ie(0,0),this.repeat=new Ie(1,1),this.center=new Ie(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Oe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=l,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=e&&e.depth&&e.depth>1?!0:!1,this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(kl).x}get height(){return this.source.getSize(kl).y}get depth(){return this.source.getSize(kl).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){Me(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){Me(`Texture.setValues(): property '${t}' does not exist.`);continue}if(i&&n&&(i.isVector2&&n.isVector2))i.copy(n);else if(i&&n&&(i.isVector3&&n.isVector3))i.copy(n);else if(i&&n&&(i.isMatrix3&&n.isMatrix3))i.copy(n);else this[t]=n}}toJSON(e){let t=e===void 0||typeof e==="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};if(Object.keys(this.userData).length>0)n.userData=this.userData;if(!t)e.textures[this.uuid]=n;return n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case 1000:e.x=e.x-Math.floor(e.x);break;case 1001:e.x=e.x<0?0:1;break;case 1002:if(Math.abs(Math.floor(e.x)%2)===1)e.x=Math.ceil(e.x)-e.x;else e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case 1000:e.y=e.y-Math.floor(e.y);break;case 1001:e.y=e.y<0?0:1;break;case 1002:if(Math.abs(Math.floor(e.y)%2)===1)e.y=Math.ceil(e.y)-e.y;else e.y=e.y-Math.floor(e.y);break}if(this.flipY)e.y=1-e.y;return e}set needsUpdate(e){if(e===!0)this.version++,this.source.needsUpdate=!0}set needsPMREMUpdate(e){if(e===!0)this.pmremVersion++}}wt.DEFAULT_IMAGE=null;wt.DEFAULT_MAPPING=300;wt.DEFAULT_ANISOTROPY=1;class st{static{st.prototype.isVector4=!0}constructor(e=0,t=0,n=0,i=1){this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=this.w,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*i+s[12]*r,this.y=s[1]*t+s[5]*n+s[9]*i+s[13]*r,this.z=s[2]*t+s[6]*n+s[10]*i+s[14]*r,this.w=s[3]*t+s[7]*n+s[11]*i+s[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);if(t<0.0001)this.x=1,this.y=0,this.z=0;else this.x=e.x/t,this.y=e.y/t,this.z=e.z/t;return this}setAxisAngleFromRotationMatrix(e){let t,n,i,r,s=0.01,o=0.1,a=e.elements,c=a[0],l=a[4],u=a[8],h=a[1],f=a[5],d=a[9],m=a[2],x=a[6],p=a[10];if(Math.abs(l-h)<0.01&&Math.abs(u-m)<0.01&&Math.abs(d-x)<0.01){if(Math.abs(l+h)<0.1&&Math.abs(u+m)<0.1&&Math.abs(d+x)<0.1&&Math.abs(c+f+p-3)<0.1)return this.set(1,0,0,0),this;t=Math.PI;let A=(c+1)/2,E=(f+1)/2,y=(p+1)/2,w=(l+h)/4,T=(u+m)/4,R=(d+x)/4;if(A>E&&A>y)if(A<0.01)n=0,i=0.707106781,r=0.707106781;else n=Math.sqrt(A),i=w/n,r=T/n;else if(E>y)if(E<0.01)n=0.707106781,i=0,r=0.707106781;else i=Math.sqrt(E),n=w/i,r=R/i;else if(y<0.01)n=0.707106781,i=0.707106781,r=0;else r=Math.sqrt(y),n=T/r,i=R/r;return this.set(n,i,r,t),this}let g=Math.sqrt((x-d)*(x-d)+(u-m)*(u-m)+(h-l)*(h-l));if(Math.abs(g)<0.001)g=1;return this.x=(x-d)/g,this.y=(u-m)/g,this.z=(h-l)/g,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this.w=We(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this.w=We(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class uh extends Hn{constructor(e=1,t=1,n={}){super();n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new st(0,0,e,t),this.scissorTest=!1,this.viewport=new st(0,0,e,t),this.textures=[];let i={width:e,height:t,depth:n.depth},r=new wt(i),s=n.count;for(let o=0;o<s;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:1006,generateMipmaps:!1,flipY:!1,internalFormat:null};if(e.mapping!==void 0)t.mapping=e.mapping;if(e.wrapS!==void 0)t.wrapS=e.wrapS;if(e.wrapT!==void 0)t.wrapT=e.wrapT;if(e.wrapR!==void 0)t.wrapR=e.wrapR;if(e.magFilter!==void 0)t.magFilter=e.magFilter;if(e.minFilter!==void 0)t.minFilter=e.minFilter;if(e.format!==void 0)t.format=e.format;if(e.type!==void 0)t.type=e.type;if(e.anisotropy!==void 0)t.anisotropy=e.anisotropy;if(e.colorSpace!==void 0)t.colorSpace=e.colorSpace;if(e.flipY!==void 0)t.flipY=e.flipY;if(e.generateMipmaps!==void 0)t.generateMipmaps=e.generateMipmaps;if(e.internalFormat!==void 0)t.internalFormat=e.internalFormat;for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){if(this._depthTexture!==null)this._depthTexture.renderTarget=null;if(e!==null)e.renderTarget=this;this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)if(this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isData3DTexture!==!0)this.textures[i].isArrayTexture=this.textures[i].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let i=Object.assign({},e.textures[t].image);this.textures[t].source=new ro(i)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null)this.depthTexture=e.depthTexture.clone();return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class En extends uh{constructor(e=1,t=1,n={}){super(e,t,n);this.isWebGLRenderTarget=!0}}class Ja extends wt{constructor(e=null,t=1,n=1,i=1){super(null);this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class hh extends wt{constructor(e=null,t=1,n=1,i=1){super(null);this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class ze{static{ze.prototype.isMatrix4=!0}constructor(e,t,n,i,r,s,o,a,c,l,u,h,f,d,m,x){if(this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0)this.set(e,t,n,i,r,s,o,a,c,l,u,h,f,d,m,x)}set(e,t,n,i,r,s,o,a,c,l,u,h,f,d,m,x){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=i,p[1]=r,p[5]=s,p[9]=o,p[13]=a,p[2]=c,p[6]=l,p[10]=u,p[14]=h,p[3]=f,p[7]=d,p[11]=m,p[15]=x,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ze().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){if(this.determinantAffine()===0)return e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this;return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,i=1/Fr.setFromMatrixColumn(e,0).length(),r=1/Fr.setFromMatrixColumn(e,1).length(),s=1/Fr.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*s,t[9]=n[9]*s,t[10]=n[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,{x:n,y:i,z:r}=e,s=Math.cos(n),o=Math.sin(n),a=Math.cos(i),c=Math.sin(i),l=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let h=s*l,f=s*u,d=o*l,m=o*u;t[0]=a*l,t[4]=-a*u,t[8]=c,t[1]=f+d*c,t[5]=h-m*c,t[9]=-o*a,t[2]=m-h*c,t[6]=d+f*c,t[10]=s*a}else if(e.order==="YXZ"){let h=a*l,f=a*u,d=c*l,m=c*u;t[0]=h+m*o,t[4]=d*o-f,t[8]=s*c,t[1]=s*u,t[5]=s*l,t[9]=-o,t[2]=f*o-d,t[6]=m+h*o,t[10]=s*a}else if(e.order==="ZXY"){let h=a*l,f=a*u,d=c*l,m=c*u;t[0]=h-m*o,t[4]=-s*u,t[8]=d+f*o,t[1]=f+d*o,t[5]=s*l,t[9]=m-h*o,t[2]=-s*c,t[6]=o,t[10]=s*a}else if(e.order==="ZYX"){let h=s*l,f=s*u,d=o*l,m=o*u;t[0]=a*l,t[4]=d*c-f,t[8]=h*c+m,t[1]=a*u,t[5]=m*c+h,t[9]=f*c-d,t[2]=-c,t[6]=o*a,t[10]=s*a}else if(e.order==="YZX"){let h=s*a,f=s*c,d=o*a,m=o*c;t[0]=a*l,t[4]=m-h*u,t[8]=d*u+f,t[1]=u,t[5]=s*l,t[9]=-o*l,t[2]=-c*l,t[6]=f*u+d,t[10]=h-m*u}else if(e.order==="XZY"){let h=s*a,f=s*c,d=o*a,m=o*c;t[0]=a*l,t[4]=-u,t[8]=c*l,t[1]=h*u+m,t[5]=s*l,t[9]=f*u-d,t[2]=d*u-f,t[6]=o*l,t[10]=m*u+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(dS,e,pS)}lookAt(e,t,n){let i=this.elements;if(fn.subVectors(e,t),fn.lengthSq()===0)fn.z=1;if(fn.normalize(),Oi.crossVectors(n,fn),Oi.lengthSq()===0){if(Math.abs(n.z)===1)fn.x+=0.0001;else fn.z+=0.0001;fn.normalize(),Oi.crossVectors(n,fn)}return Oi.normalize(),ua.crossVectors(fn,Oi),i[0]=Oi.x,i[4]=ua.x,i[8]=fn.x,i[1]=Oi.y,i[5]=ua.y,i[9]=fn.y,i[2]=Oi.z,i[6]=ua.z,i[10]=fn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,s=n[0],o=n[4],a=n[8],c=n[12],l=n[1],u=n[5],h=n[9],f=n[13],d=n[2],m=n[6],x=n[10],p=n[14],g=n[3],A=n[7],E=n[11],y=n[15],w=i[0],T=i[4],R=i[8],_=i[12],S=i[1],U=i[5],C=i[9],z=i[13],j=i[2],F=i[6],H=i[10],V=i[14],O=i[3],K=i[7],Q=i[11],se=i[15];return r[0]=s*w+o*S+a*j+c*O,r[4]=s*T+o*U+a*F+c*K,r[8]=s*R+o*C+a*H+c*Q,r[12]=s*_+o*z+a*V+c*se,r[1]=l*w+u*S+h*j+f*O,r[5]=l*T+u*U+h*F+f*K,r[9]=l*R+u*C+h*H+f*Q,r[13]=l*_+u*z+h*V+f*se,r[2]=d*w+m*S+x*j+p*O,r[6]=d*T+m*U+x*F+p*K,r[10]=d*R+m*C+x*H+p*Q,r[14]=d*_+m*z+x*V+p*se,r[3]=g*w+A*S+E*j+y*O,r[7]=g*T+A*U+E*F+y*K,r[11]=g*R+A*C+E*H+y*Q,r[15]=g*_+A*z+E*V+y*se,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],s=e[1],o=e[5],a=e[9],c=e[13],l=e[2],u=e[6],h=e[10],f=e[14],d=e[3],m=e[7],x=e[11],p=e[15],g=a*f-c*h,A=o*f-c*u,E=o*h-a*u,y=s*f-c*l,w=s*h-a*l,T=s*u-o*l;return t*(m*g-x*A+p*E)-n*(d*g-x*y+p*w)+i*(d*A-m*y+p*T)-r*(d*E-m*w+x*T)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[1],s=e[5],o=e[9],a=e[2],c=e[6],l=e[10];return t*(s*l-o*c)-n*(r*l-o*a)+i*(r*c-s*a)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;if(e.isVector3)i[12]=e.x,i[13]=e.y,i[14]=e.z;else i[12]=e,i[13]=t,i[14]=n;return this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],s=e[4],o=e[5],a=e[6],c=e[7],l=e[8],u=e[9],h=e[10],f=e[11],d=e[12],m=e[13],x=e[14],p=e[15],g=t*o-n*s,A=t*a-i*s,E=t*c-r*s,y=n*a-i*o,w=n*c-r*o,T=i*c-r*a,R=l*m-u*d,_=l*x-h*d,S=l*p-f*d,U=u*x-h*m,C=u*p-f*m,z=h*p-f*x,j=g*z-A*C+E*U+y*S-w*_+T*R;if(j===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let F=1/j;return e[0]=(o*z-a*C+c*U)*F,e[1]=(i*C-n*z-r*U)*F,e[2]=(m*T-x*w+p*y)*F,e[3]=(h*w-u*T-f*y)*F,e[4]=(a*S-s*z-c*_)*F,e[5]=(t*z-i*S+r*_)*F,e[6]=(x*E-d*T-p*A)*F,e[7]=(l*T-h*E+f*A)*F,e[8]=(s*C-o*S+c*R)*F,e[9]=(n*S-t*C-r*R)*F,e[10]=(d*w-m*E+p*g)*F,e[11]=(u*E-l*w-f*g)*F,e[12]=(o*_-s*U-a*R)*F,e[13]=(t*U-n*_+i*R)*F,e[14]=(m*A-d*y-x*g)*F,e[15]=(l*y-u*A+h*g)*F,this}scale(e){let t=this.elements,{x:n,y:i,z:r}=e;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){if(e.isVector3)this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1);else this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1);return this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),r=1-n,{x:s,y:o,z:a}=e,c=r*s,l=r*o;return this.set(c*s+n,c*o-i*a,c*a+i*o,0,c*o+i*a,l*o+n,l*a-i*s,0,c*a-i*o,l*a+i*s,r*a*a+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,s){return this.set(1,n,r,0,e,1,s,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,{_x:r,_y:s,_z:o,_w:a}=t,c=r+r,l=s+s,u=o+o,h=r*c,f=r*l,d=r*u,m=s*l,x=s*u,p=o*u,g=a*c,A=a*l,E=a*u,{x:y,y:w,z:T}=n;return i[0]=(1-(m+p))*y,i[1]=(f+E)*y,i[2]=(d-A)*y,i[3]=0,i[4]=(f-E)*w,i[5]=(1-(h+p))*w,i[6]=(x+g)*w,i[7]=0,i[8]=(d+A)*T,i[9]=(x-g)*T,i[10]=(1-(h+m))*T,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements;e.x=i[12],e.y=i[13],e.z=i[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let s=Fr.set(i[0],i[1],i[2]).length(),o=Fr.set(i[4],i[5],i[6]).length(),a=Fr.set(i[8],i[9],i[10]).length();if(r<0)s=-s;Nn.copy(this);let c=1/s,l=1/o,u=1/a;return Nn.elements[0]*=c,Nn.elements[1]*=c,Nn.elements[2]*=c,Nn.elements[4]*=l,Nn.elements[5]*=l,Nn.elements[6]*=l,Nn.elements[8]*=u,Nn.elements[9]*=u,Nn.elements[10]*=u,t.setFromRotationMatrix(Nn),n.x=s,n.y=o,n.z=a,this}makePerspective(e,t,n,i,r,s,o=2000,a=!1){let c=this.elements,l=2*r/(t-e),u=2*r/(n-i),h=(t+e)/(t-e),f=(n+i)/(n-i),d,m;if(a)d=r/(s-r),m=s*r/(s-r);else if(o===2000)d=-(s+r)/(s-r),m=-2*s*r/(s-r);else if(o===2001)d=-s/(s-r),m=-s*r/(s-r);else throw Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=l,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=d,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,i,r,s,o=2000,a=!1){let c=this.elements,l=2/(t-e),u=2/(n-i),h=-(t+e)/(t-e),f=-(n+i)/(n-i),d,m;if(a)d=1/(s-r),m=s/(s-r);else if(o===2000)d=-2/(s-r),m=-(s+r)/(s-r);else if(o===2001)d=-1/(s-r),m=-r/(s-r);else throw Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=d,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}var Fr=new N,Nn=new ze,dS=new N(0,0,0),pS=new N(1,1,1),Oi=new N,ua=new N,fn=new N,o_=new ze,a_=new Gt;class ti{constructor(e=0,t=0,n=0,i=ti.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,r=i[0],s=i[4],o=i[8],a=i[1],c=i[5],l=i[9],u=i[2],h=i[6],f=i[10];switch(t){case"XYZ":if(this._y=Math.asin(We(o,-1,1)),Math.abs(o)<0.9999999)this._x=Math.atan2(-l,f),this._z=Math.atan2(-s,r);else this._x=Math.atan2(h,c),this._z=0;break;case"YXZ":if(this._x=Math.asin(-We(l,-1,1)),Math.abs(l)<0.9999999)this._y=Math.atan2(o,f),this._z=Math.atan2(a,c);else this._y=Math.atan2(-u,r),this._z=0;break;case"ZXY":if(this._x=Math.asin(We(h,-1,1)),Math.abs(h)<0.9999999)this._y=Math.atan2(-u,f),this._z=Math.atan2(-s,c);else this._y=0,this._z=Math.atan2(a,r);break;case"ZYX":if(this._y=Math.asin(-We(u,-1,1)),Math.abs(u)<0.9999999)this._x=Math.atan2(h,f),this._z=Math.atan2(a,r);else this._x=0,this._z=Math.atan2(-s,c);break;case"YZX":if(this._z=Math.asin(We(a,-1,1)),Math.abs(a)<0.9999999)this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,r);else this._x=0,this._y=Math.atan2(o,f);break;case"XZY":if(this._z=Math.asin(-We(s,-1,1)),Math.abs(s)<0.9999999)this._x=Math.atan2(h,c),this._y=Math.atan2(o,r);else this._x=Math.atan2(-l,f),this._y=0;break;default:Me("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}if(this._order=t,n===!0)this._onChangeCallback();return this}setFromQuaternion(e,t,n){return o_.makeRotationFromQuaternion(e),this.setFromRotationMatrix(o_,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return a_.setFromEuler(this),this.setFromQuaternion(a_,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){if(this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0)this._order=e[3];return this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ti.DEFAULT_ORDER="XYZ";class Ka{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}var mS=0,c_=new N,zr=new Gt,gi=new ze,ha=new N,Bs=new N,gS=new N,_S=new Gt,l_=new N(1,0,0),u_=new N(0,1,0),h_=new N(0,0,1),f_={type:"added"},xS={type:"removed"},kr={type:"childadded",child:null},Bl={type:"childremoved",child:null};class at extends Hn{constructor(){super();this.isObject3D=!0,Object.defineProperty(this,"id",{value:mS++}),this.uuid=zn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=at.DEFAULT_UP.clone();let e=new N,t=new ti,n=new Gt,i=new N(1,1,1);function r(){n.setFromEuler(t,!1)}function s(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new ze},normalMatrix:{value:new Oe}}),this.matrix=new ze,this.matrixWorld=new ze,this.matrixAutoUpdate=at.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=at.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ka,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){if(this.matrixAutoUpdate)this.updateMatrix();this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return zr.setFromAxisAngle(e,t),this.quaternion.multiply(zr),this}rotateOnWorldAxis(e,t){return zr.setFromAxisAngle(e,t),this.quaternion.premultiply(zr),this}rotateX(e){return this.rotateOnAxis(l_,e)}rotateY(e){return this.rotateOnAxis(u_,e)}rotateZ(e){return this.rotateOnAxis(h_,e)}translateOnAxis(e,t){return c_.copy(e).applyQuaternion(this.quaternion),this.position.add(c_.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(l_,e)}translateY(e){return this.translateOnAxis(u_,e)}translateZ(e){return this.translateOnAxis(h_,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(gi.copy(this.matrixWorld).invert())}lookAt(e,t,n){if(e.isVector3)ha.copy(e);else ha.set(e,t,n);let i=this.parent;if(this.updateWorldMatrix(!0,!1),Bs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight)gi.lookAt(Bs,ha,this.up);else gi.lookAt(ha,Bs,this.up);if(this.quaternion.setFromRotationMatrix(gi),i)gi.extractRotation(i.matrixWorld),zr.setFromRotationMatrix(gi),this.quaternion.premultiply(zr.invert())}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}if(e===this)return Ne("Object3D.add: object can't be added as a child of itself.",e),this;if(e&&e.isObject3D)e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(f_),kr.child=e,this.dispatchEvent(kr),kr.child=null;else Ne("Object3D.add: object not an instance of THREE.Object3D.",e);return this}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);if(t!==-1)e.parent=null,this.children.splice(t,1),e.dispatchEvent(xS),Bl.child=e,this.dispatchEvent(Bl),Bl.child=null;return this}removeFromParent(){let e=this.parent;if(e!==null)e.remove(this);return this}clear(){return this.remove(...this.children)}attach(e){if(this.updateWorldMatrix(!0,!1),gi.copy(this.matrixWorld).invert(),e.parent!==null)e.parent.updateWorldMatrix(!0,!1),gi.multiply(e.parent.matrixWorld);return e.applyMatrix4(gi),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(f_),kr.child=e,this.dispatchEvent(kr),kr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let s=this.children[n].getObjectByProperty(e,t);if(s!==void 0)return s}return}getObjectsByProperty(e,t,n=[]){if(this[e]===t)n.push(this);let i=this.children;for(let r=0,s=i.length;r<s;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Bs,e,gS),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Bs,_S,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;if(t!==null)e(t),t.traverseAncestors(e)}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let{x:t,y:n,z:i}=e,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*i,r[13]+=n-r[1]*t-r[5]*n-r[9]*i,r[14]+=i-r[2]*t-r[6]*n-r[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldNeedsUpdate||e){if(this.matrixWorldAutoUpdate===!0)if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);this.matrixWorldNeedsUpdate=!1,e=!0}let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let i=this.parent;if(e===!0&&i!==null)i.updateWorldMatrix(!0,!1);if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldNeedsUpdate||n){if(this.matrixWorldAutoUpdate===!0)if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);this.matrixWorldNeedsUpdate=!1,n=!0}if(t===!0){let r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==="string",n={};if(t)e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"};let i={};if(i.uuid=this.uuid,i.type=this.type,this.name!=="")i.name=this.name;if(this.castShadow===!0)i.castShadow=!0;if(this.receiveShadow===!0)i.receiveShadow=!0;if(this.visible===!1)i.visible=!1;if(this.frustumCulled===!1)i.frustumCulled=!1;if(this.renderOrder!==0)i.renderOrder=this.renderOrder;if(this.static!==!1)i.static=this.static;if(Object.keys(this.userData).length>0)i.userData=this.userData;if(i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null)i.pivot=this.pivot.toArray();if(this.matrixAutoUpdate===!1)i.matrixAutoUpdate=!1;if(this.morphTargetDictionary!==void 0)i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary);if(this.morphTargetInfluences!==void 0)i.morphTargetInfluences=this.morphTargetInfluences.slice();if(this.isInstancedMesh){if(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null)i.instanceColor=this.instanceColor.toJSON()}if(this.isBatchedMesh){if(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map((o)=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map((o)=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null)i.colorsTexture=this._colorsTexture.toJSON(e);if(this.boundingSphere!==null)i.boundingSphere=this.boundingSphere.toJSON();if(this.boundingBox!==null)i.boundingBox=this.boundingBox.toJSON()}function r(o,a){if(o[a.uuid]===void 0)o[a.uuid]=a.toJSON(e);return a.uuid}if(this.isScene){if(this.background){if(this.background.isColor)i.background=this.background.toJSON();else if(this.background.isTexture)i.background=this.background.toJSON(e).uuid}if(this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0)i.environment=this.environment.toJSON(e).uuid}else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let a=o.shapes;if(Array.isArray(a))for(let c=0,l=a.length;c<l;c++){let u=a[c];r(e.shapes,u)}else r(e.shapes,a)}}if(this.isSkinnedMesh){if(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0)r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid}if(this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let a=0,c=this.material.length;a<c;a++)o.push(r(e.materials,this.material[a]));i.material=o}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){let a=this.animations[o];i.animations.push(r(e.animations,a))}}if(t){let o=s(e.geometries),a=s(e.materials),c=s(e.textures),l=s(e.images),u=s(e.shapes),h=s(e.skeletons),f=s(e.animations),d=s(e.nodes);if(o.length>0)n.geometries=o;if(a.length>0)n.materials=a;if(c.length>0)n.textures=c;if(l.length>0)n.images=l;if(u.length>0)n.shapes=u;if(h.length>0)n.skeletons=h;if(f.length>0)n.animations=f;if(d.length>0)n.nodes=d}return n.object=i,n;function s(o){let a=[];for(let c in o){let l=o[c];delete l.metadata,a.push(l)}return a}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}}at.DEFAULT_UP=new N(0,1,0);at.DEFAULT_MATRIX_AUTO_UPDATE=!0;at.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Qn extends at{constructor(){super();this.isGroup=!0,this.type="Group"}}var vS={type:"move"};class so{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){if(this._hand===null)this._hand=new Qn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1};return this._hand}getTargetRaySpace(){if(this._targetRay===null)this._targetRay=new Qn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new N,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new N;return this._targetRay}getGripSpace(){if(this._grip===null)this._grip=new Qn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new N,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new N,this._grip.eventsEnabled=!1;return this._grip}dispatchEvent(e){if(this._targetRay!==null)this._targetRay.dispatchEvent(e);if(this._grip!==null)this._grip.dispatchEvent(e);if(this._hand!==null)this._hand.dispatchEvent(e);return this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){if(this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null)this._targetRay.visible=!1;if(this._grip!==null)this._grip.visible=!1;if(this._hand!==null)this._hand.visible=!1;return this}update(e,t,n){let i=null,r=null,s=null,o=this._targetRay,a=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){s=!0;for(let m of e.hand.values()){let x=t.getJointPose(m,n),p=this._getHandJoint(c,m);if(x!==null)p.matrix.fromArray(x.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=x.radius;p.visible=x!==null}let l=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],h=l.position.distanceTo(u.position),f=0.02,d=0.005;if(c.inputState.pinching&&h>f+d)c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this});else if(!c.inputState.pinching&&h<=f-d)c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this})}else if(a!==null&&e.gripSpace){if(r=t.getPose(e.gripSpace,n),r!==null){if(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity)a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity);else a.hasLinearVelocity=!1;if(r.angularVelocity)a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity);else a.hasAngularVelocity=!1;if(a.eventsEnabled)a.dispatchEvent({type:"gripUpdated",data:e,target:this})}}if(o!==null){if(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null)i=r;if(i!==null){if(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity)o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity);else o.hasLinearVelocity=!1;if(i.angularVelocity)o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity);else o.hasAngularVelocity=!1;this.dispatchEvent(vS)}}}if(o!==null)o.visible=i!==null;if(a!==null)a.visible=r!==null;if(c!==null)c.visible=s!==null;return this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Qn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}var O0={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ui={h:0,s:0,l:0},fa={h:0,s:0,l:0};function Gl(e,t,n){if(n<0)n+=1;if(n>1)n-=1;if(n<0.16666666666666666)return e+(t-e)*6*n;if(n<0.5)return t;if(n<0.6666666666666666)return e+(t-e)*6*(0.6666666666666666-n);return e}class Le{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;if(i&&i.isColor)this.copy(i);else if(typeof i==="number")this.setHex(i);else if(typeof i==="string")this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t="srgb"){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,$e.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=$e.workingColorSpace){return this.r=e,this.g=t,this.b=n,$e.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=$e.workingColorSpace){if(e=ch(e,1),t=We(t,0,1),n=We(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=0.5?n*(1+t):n+t-n*t,s=2*n-r;this.r=Gl(s,r,e+0.3333333333333333),this.g=Gl(s,r,e),this.b=Gl(s,r,e-0.3333333333333333)}return $e.colorSpaceToWorking(this,i),this}setStyle(e,t="srgb"){function n(r){if(r===void 0)return;if(parseFloat(r)<1)Me("Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,s=i[1],o=i[2];switch(s){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Me("Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=i[1],s=r.length;if(s===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);else if(s===6)return this.setHex(parseInt(r,16),t);else Me("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t="srgb"){let n=O0[e.toLowerCase()];if(n!==void 0)this.setHex(n,t);else Me("Color: Unknown color "+e);return this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Si(e.r),this.g=Si(e.g),this.b=Si(e.b),this}copyLinearToSRGB(e){return this.r=jr(e.r),this.g=jr(e.g),this.b=jr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e="srgb"){return $e.workingToColorSpace(Yt.copy(this),e),Math.round(We(Yt.r*255,0,255))*65536+Math.round(We(Yt.g*255,0,255))*256+Math.round(We(Yt.b*255,0,255))}getHexString(e="srgb"){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=$e.workingColorSpace){$e.workingToColorSpace(Yt.copy(this),t);let{r:n,g:i,b:r}=Yt,s=Math.max(n,i,r),o=Math.min(n,i,r),a,c,l=(o+s)/2;if(o===s)a=0,c=0;else{let u=s-o;switch(c=l<=0.5?u/(s+o):u/(2-s-o),s){case n:a=(i-r)/u+(i<r?6:0);break;case i:a=(r-n)/u+2;break;case r:a=(n-i)/u+4;break}a/=6}return e.h=a,e.s=c,e.l=l,e}getRGB(e,t=$e.workingColorSpace){return $e.workingToColorSpace(Yt.copy(this),t),e.r=Yt.r,e.g=Yt.g,e.b=Yt.b,e}getStyle(e="srgb"){$e.workingToColorSpace(Yt.copy(this),e);let{r:t,g:n,b:i}=Yt;if(e!=="srgb")return`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`;return`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(Ui),this.setHSL(Ui.h+e,Ui.s+t,Ui.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Ui),e.getHSL(fa);let n=Ys(Ui.h,fa.h,t),i=Ys(Ui.s,fa.s,t),r=Ys(Ui.l,fa.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}var Yt=new Le;Le.NAMES=O0;class cs extends at{constructor(){super();if(this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ti,this.environmentIntensity=1,this.environmentRotation=new ti,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){if(super.copy(e,t),e.background!==null)this.background=e.background.clone();if(e.environment!==null)this.environment=e.environment.clone();if(e.fog!==null)this.fog=e.fog.clone();if(this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null)this.overrideMaterial=e.overrideMaterial.clone();return this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);if(this.fog!==null)t.object.fog=this.fog.toJSON();if(this.backgroundBlurriness>0)t.object.backgroundBlurriness=this.backgroundBlurriness;if(this.backgroundIntensity!==1)t.object.backgroundIntensity=this.backgroundIntensity;if(t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1)t.object.environmentIntensity=this.environmentIntensity;return t.object.environmentRotation=this.environmentRotation.toArray(),t}}var Dn=new N,_i=new N,Hl=new N,xi=new N,Br=new N,Gr=new N,d_=new N,Vl=new N,$l=new N,Wl=new N,Zl=new st,Xl=new st,ql=new st;class wn{constructor(e=new N,t=new N,n=new N){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Dn.subVectors(e,t),i.cross(Dn);let r=i.lengthSq();if(r>0)return i.multiplyScalar(1/Math.sqrt(r));return i.set(0,0,0)}static getBarycoord(e,t,n,i,r){Dn.subVectors(i,t),_i.subVectors(n,t),Hl.subVectors(e,t);let s=Dn.dot(Dn),o=Dn.dot(_i),a=Dn.dot(Hl),c=_i.dot(_i),l=_i.dot(Hl),u=s*c-o*o;if(u===0)return r.set(0,0,0),null;let h=1/u,f=(c*a-o*l)*h,d=(s*l-o*a)*h;return r.set(1-f-d,d,f)}static containsPoint(e,t,n,i){if(this.getBarycoord(e,t,n,i,xi)===null)return!1;return xi.x>=0&&xi.y>=0&&xi.x+xi.y<=1}static getInterpolation(e,t,n,i,r,s,o,a){if(this.getBarycoord(e,t,n,i,xi)===null){if(a.x=0,a.y=0,"z"in a)a.z=0;if("w"in a)a.w=0;return null}return a.setScalar(0),a.addScaledVector(r,xi.x),a.addScaledVector(s,xi.y),a.addScaledVector(o,xi.z),a}static getInterpolatedAttribute(e,t,n,i,r,s){return Zl.setScalar(0),Xl.setScalar(0),ql.setScalar(0),Zl.fromBufferAttribute(e,t),Xl.fromBufferAttribute(e,n),ql.fromBufferAttribute(e,i),s.setScalar(0),s.addScaledVector(Zl,r.x),s.addScaledVector(Xl,r.y),s.addScaledVector(ql,r.z),s}static isFrontFacing(e,t,n,i){return Dn.subVectors(n,t),_i.subVectors(e,t),Dn.cross(_i).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Dn.subVectors(this.c,this.b),_i.subVectors(this.a,this.b),Dn.cross(_i).length()*0.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(0.3333333333333333)}getNormal(e){return wn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return wn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,r){return wn.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return wn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return wn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,r=this.c,s,o;Br.subVectors(i,n),Gr.subVectors(r,n),Vl.subVectors(e,n);let a=Br.dot(Vl),c=Gr.dot(Vl);if(a<=0&&c<=0)return t.copy(n);$l.subVectors(e,i);let l=Br.dot($l),u=Gr.dot($l);if(l>=0&&u<=l)return t.copy(i);let h=a*u-l*c;if(h<=0&&a>=0&&l<=0)return s=a/(a-l),t.copy(n).addScaledVector(Br,s);Wl.subVectors(e,r);let f=Br.dot(Wl),d=Gr.dot(Wl);if(d>=0&&f<=d)return t.copy(r);let m=f*c-a*d;if(m<=0&&c>=0&&d<=0)return o=c/(c-d),t.copy(n).addScaledVector(Gr,o);let x=l*d-f*u;if(x<=0&&u-l>=0&&f-d>=0)return d_.subVectors(r,i),o=(u-l)/(u-l+(f-d)),t.copy(i).addScaledVector(d_,o);let p=1/(x+m+h);return s=m*p,o=h*p,t.copy(n).addScaledVector(Br,s).addScaledVector(Gr,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class tn{constructor(e=new N(1/0,1/0,1/0),t=new N(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(On.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(On.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=On.copy(t).multiplyScalar(0.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(0.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let s=0,o=r.count;s<o;s++){if(e.isMesh===!0)e.getVertexPosition(s,On);else On.fromBufferAttribute(r,s);On.applyMatrix4(e.matrixWorld),this.expandByPoint(On)}else{if(e.boundingBox!==void 0){if(e.boundingBox===null)e.computeBoundingBox();da.copy(e.boundingBox)}else{if(n.boundingBox===null)n.computeBoundingBox();da.copy(n.boundingBox)}da.applyMatrix4(e.matrixWorld),this.union(da)}}let i=e.children;for(let r=0,s=i.length;r<s;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,On),On.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;if(e.normal.x>0)t=e.normal.x*this.min.x,n=e.normal.x*this.max.x;else t=e.normal.x*this.max.x,n=e.normal.x*this.min.x;if(e.normal.y>0)t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y;else t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y;if(e.normal.z>0)t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z;else t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z;return t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Gs),pa.subVectors(this.max,Gs),Hr.subVectors(e.a,Gs),Vr.subVectors(e.b,Gs),$r.subVectors(e.c,Gs),Fi.subVectors(Vr,Hr),zi.subVectors($r,Vr),ur.subVectors(Hr,$r);let t=[0,-Fi.z,Fi.y,0,-zi.z,zi.y,0,-ur.z,ur.y,Fi.z,0,-Fi.x,zi.z,0,-zi.x,ur.z,0,-ur.x,-Fi.y,Fi.x,0,-zi.y,zi.x,0,-ur.y,ur.x,0];if(!Yl(t,Hr,Vr,$r,pa))return!1;if(t=[1,0,0,0,1,0,0,0,1],!Yl(t,Hr,Vr,$r,pa))return!1;return ma.crossVectors(Fi,zi),t=[ma.x,ma.y,ma.z],Yl(t,Hr,Vr,$r,pa)}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,On).distanceTo(e)}getBoundingSphere(e){if(this.isEmpty())e.makeEmpty();else this.getCenter(e.center),e.radius=this.getSize(On).length()*0.5;return e}intersect(e){if(this.min.max(e.min),this.max.min(e.max),this.isEmpty())this.makeEmpty();return this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){if(this.isEmpty())return this;return vi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),vi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),vi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),vi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),vi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),vi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),vi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),vi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(vi),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}var vi=[new N,new N,new N,new N,new N,new N,new N,new N],On=new N,da=new tn,Hr=new N,Vr=new N,$r=new N,Fi=new N,zi=new N,ur=new N,Gs=new N,pa=new N,ma=new N,hr=new N;function Yl(e,t,n,i,r){for(let s=0,o=e.length-3;s<=o;s+=3){hr.fromArray(e,s);let a=r.x*Math.abs(hr.x)+r.y*Math.abs(hr.y)+r.z*Math.abs(hr.z),c=t.dot(hr),l=n.dot(hr),u=i.dot(hr);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}var It=new N,ga=new Ie,yS=0;class Nt extends Hn{constructor(e,t,n=!1){super();if(Array.isArray(e))throw TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:yS++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(e){if(e===!0)this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)ga.fromBufferAttribute(this,t),ga.applyMatrix3(e),this.setXY(t,ga.x,ga.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyMatrix3(e),this.setXYZ(t,It.x,It.y,It.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyMatrix4(e),this.setXYZ(t,It.x,It.y,It.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyNormalMatrix(e),this.setXYZ(t,It.x,It.y,It.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.transformDirection(e),this.setXYZ(t,It.x,It.y,It.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];if(this.normalized)n=Fn(n,this.array);return n}setComponent(e,t,n){if(this.normalized)n=rt(n,this.array);return this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];if(this.normalized)t=Fn(t,this.array);return t}setX(e,t){if(this.normalized)t=rt(t,this.array);return this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];if(this.normalized)t=Fn(t,this.array);return t}setY(e,t){if(this.normalized)t=rt(t,this.array);return this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];if(this.normalized)t=Fn(t,this.array);return t}setZ(e,t){if(this.normalized)t=rt(t,this.array);return this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];if(this.normalized)t=Fn(t,this.array);return t}setW(e,t){if(this.normalized)t=rt(t,this.array);return this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){if(e*=this.itemSize,this.normalized)t=rt(t,this.array),n=rt(n,this.array);return this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){if(e*=this.itemSize,this.normalized)t=rt(t,this.array),n=rt(n,this.array),i=rt(i,this.array);return this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){if(e*=this.itemSize,this.normalized)t=rt(t,this.array),n=rt(n,this.array),i=rt(i,this.array),r=rt(r,this.array);return this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};if(this.name!=="")e.name=this.name;if(this.usage!==35044)e.usage=this.usage;return e}dispose(){this.dispatchEvent({type:"dispose"})}}class Qa extends Nt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class ec extends Nt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class rn extends Nt{constructor(e,t,n){super(new Float32Array(e),t,n)}}var bS=new tn,Hs=new N,jl=new N;class mn{constructor(e=new N,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;if(t!==void 0)n.copy(t);else bS.setFromPoints(e).getCenter(n);let i=0;for(let r=0,s=e.length;r<s;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);if(t.copy(e),n>this.radius*this.radius)t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center);return t}getBoundingBox(e){if(this.isEmpty())return e.makeEmpty(),e;return e.set(this.center,this.center),e.expandByScalar(this.radius),e}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Hs.subVectors(e,this.center);let t=Hs.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=(n-this.radius)*0.5;this.center.addScaledVector(Hs,i/n),this.radius+=i}return this}union(e){if(e.isEmpty())return this;if(this.isEmpty())return this.copy(e),this;if(this.center.equals(e.center)===!0)this.radius=Math.max(this.radius,e.radius);else jl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Hs.copy(e.center).add(jl)),this.expandByPoint(Hs.copy(e.center).sub(jl));return this}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}var SS=0,Mn=new ze,Jl=new at,Wr=new N,dn=new tn,Vs=new tn,Bt=new N;class nn extends Hn{constructor(){super();this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:SS++}),this.uuid=zn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){if(Array.isArray(e))this.index=new((Zb(e))?ec:Qa)(e,1);else this.index=e;return this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;if(t!==void 0)t.applyMatrix4(e),t.needsUpdate=!0;let n=this.attributes.normal;if(n!==void 0){let r=new Oe().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;if(i!==void 0)i.transformDirection(e),i.needsUpdate=!0;if(this.boundingBox!==null)this.computeBoundingBox();if(this.boundingSphere!==null)this.computeBoundingSphere();return this._transformed=!0,this}applyQuaternion(e){return Mn.makeRotationFromQuaternion(e),this.applyMatrix4(Mn),this}rotateX(e){return Mn.makeRotationX(e),this.applyMatrix4(Mn),this}rotateY(e){return Mn.makeRotationY(e),this.applyMatrix4(Mn),this}rotateZ(e){return Mn.makeRotationZ(e),this.applyMatrix4(Mn),this}translate(e,t,n){return Mn.makeTranslation(e,t,n),this.applyMatrix4(Mn),this}scale(e,t,n){return Mn.makeScale(e,t,n),this.applyMatrix4(Mn),this}lookAt(e){return Jl.lookAt(e),Jl.updateMatrix(),this.applyMatrix4(Jl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Wr).negate(),this.translate(Wr.x,Wr.y,Wr.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let i=0,r=e.length;i<r;i++){let s=e[i];n.push(s.x,s.y,s.z||0)}this.setAttribute("position",new rn(n,3))}else{let n=Math.min(e.length,t.count);for(let i=0;i<n;i++){let r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}if(e.length>t.count)Me("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.");t.needsUpdate=!0}return this}computeBoundingBox(){if(this.boundingBox===null)this.boundingBox=new tn;let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ne("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new N(-1/0,-1/0,-1/0),new N(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let r=t[n];if(dn.setFromBufferAttribute(r),this.morphTargetsRelative)Bt.addVectors(this.boundingBox.min,dn.min),this.boundingBox.expandByPoint(Bt),Bt.addVectors(this.boundingBox.max,dn.max),this.boundingBox.expandByPoint(Bt);else this.boundingBox.expandByPoint(dn.min),this.boundingBox.expandByPoint(dn.max)}}else this.boundingBox.makeEmpty();if(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))Ne('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){if(this.boundingSphere===null)this.boundingSphere=new mn;let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ne("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new N,1/0);return}if(e){let n=this.boundingSphere.center;if(dn.setFromBufferAttribute(e),t)for(let r=0,s=t.length;r<s;r++){let o=t[r];if(Vs.setFromBufferAttribute(o),this.morphTargetsRelative)Bt.addVectors(dn.min,Vs.min),dn.expandByPoint(Bt),Bt.addVectors(dn.max,Vs.max),dn.expandByPoint(Bt);else dn.expandByPoint(Vs.min),dn.expandByPoint(Vs.max)}dn.getCenter(n);let i=0;for(let r=0,s=e.count;r<s;r++)Bt.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(Bt));if(t)for(let r=0,s=t.length;r<s;r++){let o=t[r],a=this.morphTargetsRelative;for(let c=0,l=o.count;c<l;c++){if(Bt.fromBufferAttribute(o,c),a)Wr.fromBufferAttribute(e,c),Bt.add(Wr);i=Math.max(i,n.distanceToSquared(Bt))}}if(this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius))Ne('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Ne("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let{position:n,normal:i,uv:r}=t,s=this.getAttribute("tangent");if(s===void 0||s.count!==n.count)s=new Nt(new Float32Array(4*n.count),4),this.setAttribute("tangent",s);let o=[],a=[];for(let R=0;R<n.count;R++)o[R]=new N,a[R]=new N;let c=new N,l=new N,u=new N,h=new Ie,f=new Ie,d=new Ie,m=new N,x=new N;function p(R,_,S){c.fromBufferAttribute(n,R),l.fromBufferAttribute(n,_),u.fromBufferAttribute(n,S),h.fromBufferAttribute(r,R),f.fromBufferAttribute(r,_),d.fromBufferAttribute(r,S),l.sub(c),u.sub(c),f.sub(h),d.sub(h);let U=1/(f.x*d.y-d.x*f.y);if(!isFinite(U))return;m.copy(l).multiplyScalar(d.y).addScaledVector(u,-f.y).multiplyScalar(U),x.copy(u).multiplyScalar(f.x).addScaledVector(l,-d.x).multiplyScalar(U),o[R].add(m),o[_].add(m),o[S].add(m),a[R].add(x),a[_].add(x),a[S].add(x)}let g=this.groups;if(g.length===0)g=[{start:0,count:e.count}];for(let R=0,_=g.length;R<_;++R){let S=g[R],{start:U,count:C}=S;for(let z=U,j=U+C;z<j;z+=3)p(e.getX(z+0),e.getX(z+1),e.getX(z+2))}let A=new N,E=new N,y=new N,w=new N;function T(R){y.fromBufferAttribute(i,R),w.copy(y);let _=o[R];A.copy(_),A.sub(y.multiplyScalar(y.dot(_))).normalize(),E.crossVectors(w,_);let U=E.dot(a[R])<0?-1:1;s.setXYZW(R,A.x,A.y,A.z,U)}for(let R=0,_=g.length;R<_;++R){let S=g[R],{start:U,count:C}=S;for(let z=U,j=U+C;z<j;z+=3)T(e.getX(z+0)),T(e.getX(z+1)),T(e.getX(z+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new Nt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let h=0,f=n.count;h<f;h++)n.setXYZ(h,0,0,0);let i=new N,r=new N,s=new N,o=new N,a=new N,c=new N,l=new N,u=new N;if(e)for(let h=0,f=e.count;h<f;h+=3){let d=e.getX(h+0),m=e.getX(h+1),x=e.getX(h+2);i.fromBufferAttribute(t,d),r.fromBufferAttribute(t,m),s.fromBufferAttribute(t,x),l.subVectors(s,r),u.subVectors(i,r),l.cross(u),o.fromBufferAttribute(n,d),a.fromBufferAttribute(n,m),c.fromBufferAttribute(n,x),o.add(l),a.add(l),c.add(l),n.setXYZ(d,o.x,o.y,o.z),n.setXYZ(m,a.x,a.y,a.z),n.setXYZ(x,c.x,c.y,c.z)}else for(let h=0,f=t.count;h<f;h+=3)i.fromBufferAttribute(t,h+0),r.fromBufferAttribute(t,h+1),s.fromBufferAttribute(t,h+2),l.subVectors(s,r),u.subVectors(i,r),l.cross(u),n.setXYZ(h+0,l.x,l.y,l.z),n.setXYZ(h+1,l.x,l.y,l.z),n.setXYZ(h+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Bt.fromBufferAttribute(e,t),Bt.normalize(),e.setXYZ(t,Bt.x,Bt.y,Bt.z)}toNonIndexed(){function e(o,a){let{array:c,itemSize:l,normalized:u}=o,h=new c.constructor(a.length*l),f=0,d=0;for(let m=0,x=a.length;m<x;m++){if(o.isInterleavedBufferAttribute)f=a[m]*o.data.stride+o.offset;else f=a[m]*l;for(let p=0;p<l;p++)h[d++]=c[f++]}return new Nt(h,l,u)}if(this.index===null)return Me("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new nn,n=this.index.array,i=this.attributes;for(let o in i){let a=i[o],c=e(a,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let a=[],c=r[o];for(let l=0,u=c.length;l<u;l++){let h=c[l],f=e(h,n);a.push(f)}t.morphAttributes[o]=a}t.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;for(let o=0,a=s.length;o<a;o++){let c=s[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!=="")e.name=this.name;if(Object.keys(this.userData).length>0)e.userData=this.userData;if(this.parameters!==void 0&&this._transformed!==!0){let a=this.parameters;for(let c in a)if(a[c]!==void 0)e[c]=a[c];return e}e.data={attributes:{}};let t=this.index;if(t!==null)e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)};let n=this.attributes;for(let a in n){let c=n[a];e.data.attributes[a]=c.toJSON(e.data)}let i={},r=!1;for(let a in this.morphAttributes){let c=this.morphAttributes[a],l=[];for(let u=0,h=c.length;u<h;u++){let f=c[u];l.push(f.toJSON(e.data))}if(l.length>0)i[a]=l,r=!0}if(r)e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;if(s.length>0)e.data.groups=JSON.parse(JSON.stringify(s));let o=this.boundingSphere;if(o!==null)e.data.boundingSphere=o.toJSON();return e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;if(n!==null)this.setIndex(n.clone());let i=e.attributes;for(let c in i){let l=i[c];this.setAttribute(c,l.clone(t))}let r=e.morphAttributes;for(let c in r){let l=[],u=r[c];for(let h=0,f=u.length;h<f;h++)l.push(u[h].clone(t));this.morphAttributes[c]=l}this.morphTargetsRelative=e.morphTargetsRelative;let s=e.groups;for(let c=0,l=s.length;c<l;c++){let u=s[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;if(o!==null)this.boundingBox=o.clone();let a=e.boundingSphere;if(a!==null)this.boundingSphere=a.clone();return this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class oo{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=35044,this.updateRanges=[],this.version=0,this.uuid=zn()}onUploadCallback(){}set needsUpdate(e){if(e===!0)this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,r=this.stride;i<r;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){if(e.arrayBuffers===void 0)e.arrayBuffers={};if(this.array.buffer._uuid===void 0)this.array.buffer._uuid=zn();if(e.arrayBuffers[this.array.buffer._uuid]===void 0)e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer;let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){if(e.arrayBuffers===void 0)e.arrayBuffers={};if(this.array.buffer._uuid===void 0)this.array.buffer._uuid=zn();if(e.arrayBuffers[this.array.buffer._uuid]===void 0)e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer));return{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}var en=new N;class ls{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)en.fromBufferAttribute(this,t),en.applyMatrix4(e),this.setXYZ(t,en.x,en.y,en.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)en.fromBufferAttribute(this,t),en.applyNormalMatrix(e),this.setXYZ(t,en.x,en.y,en.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)en.fromBufferAttribute(this,t),en.transformDirection(e),this.setXYZ(t,en.x,en.y,en.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];if(this.normalized)n=Fn(n,this.array);return n}setComponent(e,t,n){if(this.normalized)n=rt(n,this.array);return this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){if(this.normalized)t=rt(t,this.array);return this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){if(this.normalized)t=rt(t,this.array);return this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){if(this.normalized)t=rt(t,this.array);return this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){if(this.normalized)t=rt(t,this.array);return this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];if(this.normalized)t=Fn(t,this.array);return t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];if(this.normalized)t=Fn(t,this.array);return t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];if(this.normalized)t=Fn(t,this.array);return t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];if(this.normalized)t=Fn(t,this.array);return t}setXY(e,t,n){if(e=e*this.data.stride+this.offset,this.normalized)t=rt(t,this.array),n=rt(n,this.array);return this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){if(e=e*this.data.stride+this.offset,this.normalized)t=rt(t,this.array),n=rt(n,this.array),i=rt(i,this.array);return this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,r){if(e=e*this.data.stride+this.offset,this.normalized)t=rt(t,this.array),n=rt(n,this.array),i=rt(i,this.array),r=rt(r,this.array);return this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=r,this}clone(e){if(e===void 0){js("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return new Nt(new this.array.constructor(t),this.itemSize,this.normalized)}else{if(e.interleavedBuffers===void 0)e.interleavedBuffers={};if(e.interleavedBuffers[this.data.uuid]===void 0)e.interleavedBuffers[this.data.uuid]=this.data.clone(e);return new ls(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}}toJSON(e){if(e===void 0){js("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else{if(e.interleavedBuffers===void 0)e.interleavedBuffers={};if(e.interleavedBuffers[this.data.uuid]===void 0)e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e);return{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}}var MS=0;class sn extends Hn{constructor(){super();this.isMaterial=!0,Object.defineProperty(this,"id",{value:MS++}),this.uuid=zn(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Le(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){if(this._alphaTest>0!==e>0)this.version++;this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e===void 0)return;for(let t in e){let n=e[t];if(n===void 0){Me(`Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){Me(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}if(i&&i.isColor)i.set(n);else if(i&&i.isVector2&&(n&&n.isVector2)||i&&i.isEuler&&(n&&n.isEuler)||i&&i.isVector3&&(n&&n.isVector3))i.copy(n);else this[t]=n}}toJSON(e){let t=e===void 0||typeof e==="string";if(t)e={textures:{},images:{}};let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};if(n.uuid=this.uuid,n.type=this.type,this.name!=="")n.name=this.name;if(this.color&&this.color.isColor)n.color=this.color.getHex();if(this.roughness!==void 0)n.roughness=this.roughness;if(this.metalness!==void 0)n.metalness=this.metalness;if(this.sheen!==void 0)n.sheen=this.sheen;if(this.sheenColor&&this.sheenColor.isColor)n.sheenColor=this.sheenColor.getHex();if(this.sheenRoughness!==void 0)n.sheenRoughness=this.sheenRoughness;if(this.emissive&&this.emissive.isColor)n.emissive=this.emissive.getHex();if(this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1)n.emissiveIntensity=this.emissiveIntensity;if(this.specular&&this.specular.isColor)n.specular=this.specular.getHex();if(this.specularIntensity!==void 0)n.specularIntensity=this.specularIntensity;if(this.specularColor&&this.specularColor.isColor)n.specularColor=this.specularColor.getHex();if(this.shininess!==void 0)n.shininess=this.shininess;if(this.clearcoat!==void 0)n.clearcoat=this.clearcoat;if(this.clearcoatRoughness!==void 0)n.clearcoatRoughness=this.clearcoatRoughness;if(this.clearcoatMap&&this.clearcoatMap.isTexture)n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid;if(this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture)n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid;if(this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture)n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray();if(this.sheenColorMap&&this.sheenColorMap.isTexture)n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid;if(this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture)n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid;if(this.dispersion!==void 0)n.dispersion=this.dispersion;if(this.iridescence!==void 0)n.iridescence=this.iridescence;if(this.iridescenceIOR!==void 0)n.iridescenceIOR=this.iridescenceIOR;if(this.iridescenceThicknessRange!==void 0)n.iridescenceThicknessRange=this.iridescenceThicknessRange;if(this.iridescenceMap&&this.iridescenceMap.isTexture)n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid;if(this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture)n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid;if(this.anisotropy!==void 0)n.anisotropy=this.anisotropy;if(this.anisotropyRotation!==void 0)n.anisotropyRotation=this.anisotropyRotation;if(this.anisotropyMap&&this.anisotropyMap.isTexture)n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid;if(this.map&&this.map.isTexture)n.map=this.map.toJSON(e).uuid;if(this.matcap&&this.matcap.isTexture)n.matcap=this.matcap.toJSON(e).uuid;if(this.alphaMap&&this.alphaMap.isTexture)n.alphaMap=this.alphaMap.toJSON(e).uuid;if(this.lightMap&&this.lightMap.isTexture)n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity;if(this.aoMap&&this.aoMap.isTexture)n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity;if(this.bumpMap&&this.bumpMap.isTexture)n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale;if(this.normalMap&&this.normalMap.isTexture)n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray();if(this.displacementMap&&this.displacementMap.isTexture)n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias;if(this.roughnessMap&&this.roughnessMap.isTexture)n.roughnessMap=this.roughnessMap.toJSON(e).uuid;if(this.metalnessMap&&this.metalnessMap.isTexture)n.metalnessMap=this.metalnessMap.toJSON(e).uuid;if(this.emissiveMap&&this.emissiveMap.isTexture)n.emissiveMap=this.emissiveMap.toJSON(e).uuid;if(this.specularMap&&this.specularMap.isTexture)n.specularMap=this.specularMap.toJSON(e).uuid;if(this.specularIntensityMap&&this.specularIntensityMap.isTexture)n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid;if(this.specularColorMap&&this.specularColorMap.isTexture)n.specularColorMap=this.specularColorMap.toJSON(e).uuid;if(this.envMap&&this.envMap.isTexture){if(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0)n.combine=this.combine}if(this.envMapRotation!==void 0)n.envMapRotation=this.envMapRotation.toArray();if(this.envMapIntensity!==void 0)n.envMapIntensity=this.envMapIntensity;if(this.reflectivity!==void 0)n.reflectivity=this.reflectivity;if(this.refractionRatio!==void 0)n.refractionRatio=this.refractionRatio;if(this.gradientMap&&this.gradientMap.isTexture)n.gradientMap=this.gradientMap.toJSON(e).uuid;if(this.transmission!==void 0)n.transmission=this.transmission;if(this.transmissionMap&&this.transmissionMap.isTexture)n.transmissionMap=this.transmissionMap.toJSON(e).uuid;if(this.thickness!==void 0)n.thickness=this.thickness;if(this.thicknessMap&&this.thicknessMap.isTexture)n.thicknessMap=this.thicknessMap.toJSON(e).uuid;if(this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0)n.attenuationDistance=this.attenuationDistance;if(this.attenuationColor!==void 0)n.attenuationColor=this.attenuationColor.getHex();if(this.size!==void 0)n.size=this.size;if(this.shadowSide!==null)n.shadowSide=this.shadowSide;if(this.sizeAttenuation!==void 0)n.sizeAttenuation=this.sizeAttenuation;if(this.blending!==1)n.blending=this.blending;if(this.side!==0)n.side=this.side;if(this.vertexColors===!0)n.vertexColors=!0;if(this.opacity<1)n.opacity=this.opacity;if(this.transparent===!0)n.transparent=!0;if(this.blendSrc!==204)n.blendSrc=this.blendSrc;if(this.blendDst!==205)n.blendDst=this.blendDst;if(this.blendEquation!==100)n.blendEquation=this.blendEquation;if(this.blendSrcAlpha!==null)n.blendSrcAlpha=this.blendSrcAlpha;if(this.blendDstAlpha!==null)n.blendDstAlpha=this.blendDstAlpha;if(this.blendEquationAlpha!==null)n.blendEquationAlpha=this.blendEquationAlpha;if(this.blendColor&&this.blendColor.isColor)n.blendColor=this.blendColor.getHex();if(this.blendAlpha!==0)n.blendAlpha=this.blendAlpha;if(this.depthFunc!==3)n.depthFunc=this.depthFunc;if(this.depthTest===!1)n.depthTest=this.depthTest;if(this.depthWrite===!1)n.depthWrite=this.depthWrite;if(this.colorWrite===!1)n.colorWrite=this.colorWrite;if(this.stencilWriteMask!==255)n.stencilWriteMask=this.stencilWriteMask;if(this.stencilFunc!==519)n.stencilFunc=this.stencilFunc;if(this.stencilRef!==0)n.stencilRef=this.stencilRef;if(this.stencilFuncMask!==255)n.stencilFuncMask=this.stencilFuncMask;if(this.stencilFail!==7680)n.stencilFail=this.stencilFail;if(this.stencilZFail!==7680)n.stencilZFail=this.stencilZFail;if(this.stencilZPass!==7680)n.stencilZPass=this.stencilZPass;if(this.stencilWrite===!0)n.stencilWrite=this.stencilWrite;if(this.rotation!==void 0&&this.rotation!==0)n.rotation=this.rotation;if(this.polygonOffset===!0)n.polygonOffset=!0;if(this.polygonOffsetFactor!==0)n.polygonOffsetFactor=this.polygonOffsetFactor;if(this.polygonOffsetUnits!==0)n.polygonOffsetUnits=this.polygonOffsetUnits;if(this.linewidth!==void 0&&this.linewidth!==1)n.linewidth=this.linewidth;if(this.dashSize!==void 0)n.dashSize=this.dashSize;if(this.gapSize!==void 0)n.gapSize=this.gapSize;if(this.scale!==void 0)n.scale=this.scale;if(this.dithering===!0)n.dithering=!0;if(this.alphaTest>0)n.alphaTest=this.alphaTest;if(this.alphaHash===!0)n.alphaHash=!0;if(this.alphaToCoverage===!0)n.alphaToCoverage=!0;if(this.premultipliedAlpha===!0)n.premultipliedAlpha=!0;if(this.forceSinglePass===!0)n.forceSinglePass=!0;if(this.allowOverride===!1)n.allowOverride=!1;if(this.wireframe===!0)n.wireframe=!0;if(this.wireframeLinewidth>1)n.wireframeLinewidth=this.wireframeLinewidth;if(this.wireframeLinecap!=="round")n.wireframeLinecap=this.wireframeLinecap;if(this.wireframeLinejoin!=="round")n.wireframeLinejoin=this.wireframeLinejoin;if(this.flatShading===!0)n.flatShading=!0;if(this.visible===!1)n.visible=!1;if(this.toneMapped===!1)n.toneMapped=!1;if(this.fog===!1)n.fog=!1;if(Object.keys(this.userData).length>0)n.userData=this.userData;function i(r){let s=[];for(let o in r){let a=r[o];delete a.metadata,s.push(a)}return s}if(t){let r=i(e.textures),s=i(e.images);if(r.length>0)n.textures=r;if(s.length>0)n.images=s}return n}fromJSON(e,t){if(e.uuid!==void 0)this.uuid=e.uuid;if(e.name!==void 0)this.name=e.name;if(e.color!==void 0&&this.color!==void 0)this.color.setHex(e.color);if(e.roughness!==void 0)this.roughness=e.roughness;if(e.metalness!==void 0)this.metalness=e.metalness;if(e.sheen!==void 0)this.sheen=e.sheen;if(e.sheenColor!==void 0)this.sheenColor=new Le().setHex(e.sheenColor);if(e.sheenRoughness!==void 0)this.sheenRoughness=e.sheenRoughness;if(e.emissive!==void 0&&this.emissive!==void 0)this.emissive.setHex(e.emissive);if(e.specular!==void 0&&this.specular!==void 0)this.specular.setHex(e.specular);if(e.specularIntensity!==void 0)this.specularIntensity=e.specularIntensity;if(e.specularColor!==void 0&&this.specularColor!==void 0)this.specularColor.setHex(e.specularColor);if(e.shininess!==void 0)this.shininess=e.shininess;if(e.clearcoat!==void 0)this.clearcoat=e.clearcoat;if(e.clearcoatRoughness!==void 0)this.clearcoatRoughness=e.clearcoatRoughness;if(e.dispersion!==void 0)this.dispersion=e.dispersion;if(e.iridescence!==void 0)this.iridescence=e.iridescence;if(e.iridescenceIOR!==void 0)this.iridescenceIOR=e.iridescenceIOR;if(e.iridescenceThicknessRange!==void 0)this.iridescenceThicknessRange=e.iridescenceThicknessRange;if(e.transmission!==void 0)this.transmission=e.transmission;if(e.thickness!==void 0)this.thickness=e.thickness;if(e.attenuationDistance!==void 0)this.attenuationDistance=e.attenuationDistance;if(e.attenuationColor!==void 0&&this.attenuationColor!==void 0)this.attenuationColor.setHex(e.attenuationColor);if(e.anisotropy!==void 0)this.anisotropy=e.anisotropy;if(e.anisotropyRotation!==void 0)this.anisotropyRotation=e.anisotropyRotation;if(e.fog!==void 0)this.fog=e.fog;if(e.flatShading!==void 0)this.flatShading=e.flatShading;if(e.blending!==void 0)this.blending=e.blending;if(e.combine!==void 0)this.combine=e.combine;if(e.side!==void 0)this.side=e.side;if(e.shadowSide!==void 0)this.shadowSide=e.shadowSide;if(e.opacity!==void 0)this.opacity=e.opacity;if(e.transparent!==void 0)this.transparent=e.transparent;if(e.alphaTest!==void 0)this.alphaTest=e.alphaTest;if(e.alphaHash!==void 0)this.alphaHash=e.alphaHash;if(e.depthFunc!==void 0)this.depthFunc=e.depthFunc;if(e.depthTest!==void 0)this.depthTest=e.depthTest;if(e.depthWrite!==void 0)this.depthWrite=e.depthWrite;if(e.colorWrite!==void 0)this.colorWrite=e.colorWrite;if(e.blendSrc!==void 0)this.blendSrc=e.blendSrc;if(e.blendDst!==void 0)this.blendDst=e.blendDst;if(e.blendEquation!==void 0)this.blendEquation=e.blendEquation;if(e.blendSrcAlpha!==void 0)this.blendSrcAlpha=e.blendSrcAlpha;if(e.blendDstAlpha!==void 0)this.blendDstAlpha=e.blendDstAlpha;if(e.blendEquationAlpha!==void 0)this.blendEquationAlpha=e.blendEquationAlpha;if(e.blendColor!==void 0&&this.blendColor!==void 0)this.blendColor.setHex(e.blendColor);if(e.blendAlpha!==void 0)this.blendAlpha=e.blendAlpha;if(e.stencilWriteMask!==void 0)this.stencilWriteMask=e.stencilWriteMask;if(e.stencilFunc!==void 0)this.stencilFunc=e.stencilFunc;if(e.stencilRef!==void 0)this.stencilRef=e.stencilRef;if(e.stencilFuncMask!==void 0)this.stencilFuncMask=e.stencilFuncMask;if(e.stencilFail!==void 0)this.stencilFail=e.stencilFail;if(e.stencilZFail!==void 0)this.stencilZFail=e.stencilZFail;if(e.stencilZPass!==void 0)this.stencilZPass=e.stencilZPass;if(e.stencilWrite!==void 0)this.stencilWrite=e.stencilWrite;if(e.wireframe!==void 0)this.wireframe=e.wireframe;if(e.wireframeLinewidth!==void 0)this.wireframeLinewidth=e.wireframeLinewidth;if(e.wireframeLinecap!==void 0)this.wireframeLinecap=e.wireframeLinecap;if(e.wireframeLinejoin!==void 0)this.wireframeLinejoin=e.wireframeLinejoin;if(e.rotation!==void 0)this.rotation=e.rotation;if(e.linewidth!==void 0)this.linewidth=e.linewidth;if(e.dashSize!==void 0)this.dashSize=e.dashSize;if(e.gapSize!==void 0)this.gapSize=e.gapSize;if(e.scale!==void 0)this.scale=e.scale;if(e.polygonOffset!==void 0)this.polygonOffset=e.polygonOffset;if(e.polygonOffsetFactor!==void 0)this.polygonOffsetFactor=e.polygonOffsetFactor;if(e.polygonOffsetUnits!==void 0)this.polygonOffsetUnits=e.polygonOffsetUnits;if(e.dithering!==void 0)this.dithering=e.dithering;if(e.alphaToCoverage!==void 0)this.alphaToCoverage=e.alphaToCoverage;if(e.premultipliedAlpha!==void 0)this.premultipliedAlpha=e.premultipliedAlpha;if(e.forceSinglePass!==void 0)this.forceSinglePass=e.forceSinglePass;if(e.allowOverride!==void 0)this.allowOverride=e.allowOverride;if(e.visible!==void 0)this.visible=e.visible;if(e.toneMapped!==void 0)this.toneMapped=e.toneMapped;if(e.userData!==void 0)this.userData=e.userData;if(e.vertexColors!==void 0)if(typeof e.vertexColors==="number")this.vertexColors=e.vertexColors>0;else this.vertexColors=e.vertexColors;if(e.size!==void 0)this.size=e.size;if(e.sizeAttenuation!==void 0)this.sizeAttenuation=e.sizeAttenuation;if(e.map!==void 0)this.map=t[e.map]||null;if(e.matcap!==void 0)this.matcap=t[e.matcap]||null;if(e.alphaMap!==void 0)this.alphaMap=t[e.alphaMap]||null;if(e.bumpMap!==void 0)this.bumpMap=t[e.bumpMap]||null;if(e.bumpScale!==void 0)this.bumpScale=e.bumpScale;if(e.normalMap!==void 0)this.normalMap=t[e.normalMap]||null;if(e.normalMapType!==void 0)this.normalMapType=e.normalMapType;if(e.normalScale!==void 0){let n=e.normalScale;if(Array.isArray(n)===!1)n=[n,n];this.normalScale=new Ie().fromArray(n)}if(e.displacementMap!==void 0)this.displacementMap=t[e.displacementMap]||null;if(e.displacementScale!==void 0)this.displacementScale=e.displacementScale;if(e.displacementBias!==void 0)this.displacementBias=e.displacementBias;if(e.roughnessMap!==void 0)this.roughnessMap=t[e.roughnessMap]||null;if(e.metalnessMap!==void 0)this.metalnessMap=t[e.metalnessMap]||null;if(e.emissiveMap!==void 0)this.emissiveMap=t[e.emissiveMap]||null;if(e.emissiveIntensity!==void 0)this.emissiveIntensity=e.emissiveIntensity;if(e.specularMap!==void 0)this.specularMap=t[e.specularMap]||null;if(e.specularIntensityMap!==void 0)this.specularIntensityMap=t[e.specularIntensityMap]||null;if(e.specularColorMap!==void 0)this.specularColorMap=t[e.specularColorMap]||null;if(e.envMap!==void 0)this.envMap=t[e.envMap]||null;if(e.envMapRotation!==void 0)this.envMapRotation.fromArray(e.envMapRotation);if(e.envMapIntensity!==void 0)this.envMapIntensity=e.envMapIntensity;if(e.reflectivity!==void 0)this.reflectivity=e.reflectivity;if(e.refractionRatio!==void 0)this.refractionRatio=e.refractionRatio;if(e.lightMap!==void 0)this.lightMap=t[e.lightMap]||null;if(e.lightMapIntensity!==void 0)this.lightMapIntensity=e.lightMapIntensity;if(e.aoMap!==void 0)this.aoMap=t[e.aoMap]||null;if(e.aoMapIntensity!==void 0)this.aoMapIntensity=e.aoMapIntensity;if(e.gradientMap!==void 0)this.gradientMap=t[e.gradientMap]||null;if(e.clearcoatMap!==void 0)this.clearcoatMap=t[e.clearcoatMap]||null;if(e.clearcoatRoughnessMap!==void 0)this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null;if(e.clearcoatNormalMap!==void 0)this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null;if(e.clearcoatNormalScale!==void 0)this.clearcoatNormalScale=new Ie().fromArray(e.clearcoatNormalScale);if(e.iridescenceMap!==void 0)this.iridescenceMap=t[e.iridescenceMap]||null;if(e.iridescenceThicknessMap!==void 0)this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null;if(e.transmissionMap!==void 0)this.transmissionMap=t[e.transmissionMap]||null;if(e.thicknessMap!==void 0)this.thicknessMap=t[e.thicknessMap]||null;if(e.anisotropyMap!==void 0)this.anisotropyMap=t[e.anisotropyMap]||null;if(e.sheenColorMap!==void 0)this.sheenColorMap=t[e.sheenColorMap]||null;if(e.sheenRoughnessMap!==void 0)this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null;return this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){if(e===!0)this.version++}}var yi=new N,Kl=new N,_a=new N,ki=new N,Ql=new N,xa=new N,eu=new N;class Zi{constructor(e=new N,t=new N(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,yi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);if(n<0)return t.copy(this.origin);return t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=yi.subVectors(e,this.origin).dot(this.direction);if(t<0)return this.origin.distanceToSquared(e);return yi.copy(this.origin).addScaledVector(this.direction,t),yi.distanceToSquared(e)}distanceSqToSegment(e,t,n,i){Kl.copy(e).add(t).multiplyScalar(0.5),_a.copy(t).sub(e).normalize(),ki.copy(this.origin).sub(Kl);let r=e.distanceTo(t)*0.5,s=-this.direction.dot(_a),o=ki.dot(this.direction),a=-ki.dot(_a),c=ki.lengthSq(),l=Math.abs(1-s*s),u,h,f,d;if(l>0)if(u=s*a-o,h=s*o-a,d=r*l,u>=0)if(h>=-d)if(h<=d){let m=1/l;u*=m,h*=m,f=u*(u+s*h+2*o)+h*(s*u+h+2*a)+c}else h=r,u=Math.max(0,-(s*h+o)),f=-u*u+h*(h+2*a)+c;else h=-r,u=Math.max(0,-(s*h+o)),f=-u*u+h*(h+2*a)+c;else if(h<=-d)u=Math.max(0,-(-s*r+o)),h=u>0?-r:Math.min(Math.max(-r,-a),r),f=-u*u+h*(h+2*a)+c;else if(h<=d)u=0,h=Math.min(Math.max(-r,-a),r),f=h*(h+2*a)+c;else u=Math.max(0,-(s*r+o)),h=u>0?r:Math.min(Math.max(-r,-a),r),f=-u*u+h*(h+2*a)+c;else h=s>0?-r:r,u=Math.max(0,-(s*h+o)),f=-u*u+h*(h+2*a)+c;if(n)n.copy(this.origin).addScaledVector(this.direction,u);if(i)i.copy(Kl).addScaledVector(_a,h);return f}intersectSphere(e,t){yi.subVectors(e.center,this.origin);let n=yi.dot(this.direction),i=yi.dot(yi)-n*n,r=e.radius*e.radius;if(i>r)return null;let s=Math.sqrt(r-i),o=n-s,a=n+s;if(a<0)return null;if(o<0)return this.at(a,t);return this.at(o,t)}intersectsSphere(e){if(e.radius<0)return!1;return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0){if(e.distanceToPoint(this.origin)===0)return 0;return null}let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);if(n===null)return null;return this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);if(t===0)return!0;if(e.normal.dot(this.direction)*t<0)return!0;return!1}intersectBox(e,t){let n,i,r,s,o,a,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,h=this.origin;if(c>=0)n=(e.min.x-h.x)*c,i=(e.max.x-h.x)*c;else n=(e.max.x-h.x)*c,i=(e.min.x-h.x)*c;if(l>=0)r=(e.min.y-h.y)*l,s=(e.max.y-h.y)*l;else r=(e.max.y-h.y)*l,s=(e.min.y-h.y)*l;if(n>s||r>i)return null;if(r>n||isNaN(n))n=r;if(s<i||isNaN(i))i=s;if(u>=0)o=(e.min.z-h.z)*u,a=(e.max.z-h.z)*u;else o=(e.max.z-h.z)*u,a=(e.min.z-h.z)*u;if(n>a||o>i)return null;if(o>n||n!==n)n=o;if(a<i||i!==i)i=a;if(i<0)return null;return this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,yi)!==null}intersectTriangle(e,t,n,i,r){Ql.subVectors(t,e),xa.subVectors(n,e),eu.crossVectors(Ql,xa);let s=this.direction.dot(eu),o;if(s>0){if(i)return null;o=1}else if(s<0)o=-1,s=-s;else return null;ki.subVectors(this.origin,e);let a=o*this.direction.dot(xa.crossVectors(ki,xa));if(a<0)return null;let c=o*this.direction.dot(Ql.cross(ki));if(c<0)return null;if(a+c>s)return null;let l=-o*ki.dot(eu);if(l<0)return null;return this.at(l/s,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class si extends sn{constructor(e){super();this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ti,this.combine=0,this.reflectivity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}var p_=new ze,fr=new Zi,va=new mn,m_=new N,ya=new N,ba=new N,Sa=new N,tu=new N,Ma=new N,g_=new N,wa=new N;class pt extends at{constructor(e=new nn,t=new si){super();this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){if(super.copy(e,t),e.morphTargetInfluences!==void 0)this.morphTargetInfluences=e.morphTargetInfluences.slice();if(e.morphTargetDictionary!==void 0)this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary);return this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,s=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let o=this.morphTargetInfluences;if(r&&o){Ma.set(0,0,0);for(let a=0,c=r.length;a<c;a++){let l=o[a],u=r[a];if(l===0)continue;if(tu.fromBufferAttribute(u,e),s)Ma.addScaledVector(tu,l);else Ma.addScaledVector(tu.sub(t),l)}t.add(Ma)}return t}raycast(e,t){let n=this.geometry,i=this.material,r=this.matrixWorld;if(i===void 0)return;if(n.boundingSphere===null)n.computeBoundingSphere();if(va.copy(n.boundingSphere),va.applyMatrix4(r),fr.copy(e.ray).recast(e.near),va.containsPoint(fr.origin)===!1){if(fr.intersectSphere(va,m_)===null)return;if(fr.origin.distanceToSquared(m_)>(e.far-e.near)**2)return}if(p_.copy(r).invert(),fr.copy(e.ray).applyMatrix4(p_),n.boundingBox!==null){if(fr.intersectsBox(n.boundingBox)===!1)return}this._computeIntersections(e,t,fr)}_computeIntersections(e,t,n){let i,r=this.geometry,s=this.material,o=r.index,a=r.attributes.position,c=r.attributes.uv,l=r.attributes.uv1,u=r.attributes.normal,{groups:h,drawRange:f}=r;if(o!==null)if(Array.isArray(s))for(let d=0,m=h.length;d<m;d++){let x=h[d],p=s[x.materialIndex],g=Math.max(x.start,f.start),A=Math.min(o.count,Math.min(x.start+x.count,f.start+f.count));for(let E=g,y=A;E<y;E+=3){let w=o.getX(E),T=o.getX(E+1),R=o.getX(E+2);if(i=Ta(this,p,e,n,c,l,u,w,T,R),i)i.faceIndex=Math.floor(E/3),i.face.materialIndex=x.materialIndex,t.push(i)}}else{let d=Math.max(0,f.start),m=Math.min(o.count,f.start+f.count);for(let x=d,p=m;x<p;x+=3){let g=o.getX(x),A=o.getX(x+1),E=o.getX(x+2);if(i=Ta(this,s,e,n,c,l,u,g,A,E),i)i.faceIndex=Math.floor(x/3),t.push(i)}}else if(a!==void 0)if(Array.isArray(s))for(let d=0,m=h.length;d<m;d++){let x=h[d],p=s[x.materialIndex],g=Math.max(x.start,f.start),A=Math.min(a.count,Math.min(x.start+x.count,f.start+f.count));for(let E=g,y=A;E<y;E+=3){let w=E,T=E+1,R=E+2;if(i=Ta(this,p,e,n,c,l,u,w,T,R),i)i.faceIndex=Math.floor(E/3),i.face.materialIndex=x.materialIndex,t.push(i)}}else{let d=Math.max(0,f.start),m=Math.min(a.count,f.start+f.count);for(let x=d,p=m;x<p;x+=3){let g=x,A=x+1,E=x+2;if(i=Ta(this,s,e,n,c,l,u,g,A,E),i)i.faceIndex=Math.floor(x/3),t.push(i)}}}}function wS(e,t,n,i,r,s,o,a){let c;if(t.side===1)c=i.intersectTriangle(o,s,r,!0,a);else c=i.intersectTriangle(r,s,o,t.side===0,a);if(c===null)return null;wa.copy(a),wa.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(wa);if(l<n.near||l>n.far)return null;return{distance:l,point:wa.clone(),object:e}}function Ta(e,t,n,i,r,s,o,a,c,l){e.getVertexPosition(a,ya),e.getVertexPosition(c,ba),e.getVertexPosition(l,Sa);let u=wS(e,t,n,i,ya,ba,Sa,g_);if(u){let h=new N;if(wn.getBarycoord(g_,ya,ba,Sa,h),r)u.uv=wn.getInterpolatedAttribute(r,a,c,l,h,new Ie);if(s)u.uv1=wn.getInterpolatedAttribute(s,a,c,l,h,new Ie);if(o){if(u.normal=wn.getInterpolatedAttribute(o,a,c,l,h,new N),u.normal.dot(i.direction)>0)u.normal.multiplyScalar(-1)}let f={a,b:c,c:l,normal:new N,materialIndex:0};wn.getNormal(ya,ba,Sa,f.normal),u.face=f,u.barycoord=h}return u}var $s=new st,__=new st,x_=new st,TS=new st,v_=new ze,Ea=new N,nu=new mn,y_=new ze,iu=new Zi;class tc extends pt{constructor(e,t){super(e,t);this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode="attached",this.bindMatrix=new ze,this.bindMatrixInverse=new ze,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;if(this.boundingBox===null)this.boundingBox=new tn;this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Ea),this.boundingBox.expandByPoint(Ea)}computeBoundingSphere(){let e=this.geometry;if(this.boundingSphere===null)this.boundingSphere=new mn;this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Ea),this.boundingSphere.expandByPoint(Ea)}copy(e,t){if(super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null)this.boundingBox=e.boundingBox.clone();if(e.boundingSphere!==null)this.boundingSphere=e.boundingSphere.clone();return this}raycast(e,t){let n=this.material,i=this.matrixWorld;if(n===void 0)return;if(this.boundingSphere===null)this.computeBoundingSphere();if(nu.copy(this.boundingSphere),nu.applyMatrix4(i),e.ray.intersectsSphere(nu)===!1)return;if(y_.copy(i).invert(),iu.copy(e.ray).applyMatrix4(y_),this.boundingBox!==null){if(iu.intersectsBox(this.boundingBox)===!1)return}this._computeIntersections(e,t,iu)}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){if(this.skeleton=e,t===void 0)this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld;this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new st,t=this.geometry.attributes.skinWeight;for(let n=0,i=t.count;n<i;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();if(r!==1/0)e.multiplyScalar(r);else e.set(1,0,0,0);t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){if(super.updateMatrixWorld(e),this.bindMode==="attached")this.bindMatrixInverse.copy(this.matrixWorld).invert();else if(this.bindMode==="detached")this.bindMatrixInverse.copy(this.bindMatrix).invert();else Me("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,i=this.geometry;if(__.fromBufferAttribute(i.attributes.skinIndex,e),x_.fromBufferAttribute(i.attributes.skinWeight,e),t.isVector4)$s.copy(t),t.set(0,0,0,0);else $s.set(...t,1),t.set(0,0,0);$s.applyMatrix4(this.bindMatrix);for(let r=0;r<4;r++){let s=x_.getComponent(r);if(s!==0){let o=__.getComponent(r);v_.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),t.addScaledVector(TS.copy($s).applyMatrix4(v_),s)}}if(t.isVector4)t.w=$s.w;return t.applyMatrix4(this.bindMatrixInverse)}}class ao extends at{constructor(){super();this.isBone=!0,this.type="Bone"}}class co extends wt{constructor(e=null,t=1,n=1,i,r,s,o,a,c=1003,l=1003,u,h){super(null,s,o,a,c,l,i,r,u,h);this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}var b_=new ze,ES=new ze;class lo{constructor(e=[],t=[]){this.uuid=zn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){Me("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new ze)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let n=new ze;if(this.bones[e])n.copy(this.bones[e].matrixWorld).invert();this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];if(n)n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];if(n){if(n.parent&&n.parent.isBone)n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld);else n.matrix.copy(n.matrixWorld);n.matrix.decompose(n.position,n.quaternion,n.scale)}}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let r=0,s=e.length;r<s;r++){let o=e[r]?e[r].matrixWorld:ES;b_.multiplyMatrices(o,t[r]),b_.toArray(n,r*16)}if(i!==null)i.needsUpdate=!0}clone(){return new lo(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new co(t,e,e,1023,1015);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let i=this.bones[t];if(i.name===e)return i}return}dispose(){if(this.boneTexture!==null)this.boneTexture.dispose(),this.boneTexture=null}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,i=e.bones.length;n<i;n++){let r=e.bones[n],s=t[r];if(s===void 0)Me("Skeleton: No bone found with UUID:",r),s=new ao;this.bones.push(s),this.boneInverses.push(new ze().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let i=0,r=t.length;i<r;i++){let s=t[i];e.bones.push(s.uuid);let o=n[i];e.boneInverses.push(o.toArray())}return e}}class gr extends Nt{constructor(e,t,n,i=1){super(e,t,n);this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}var Zr=new ze,S_=new ze,Aa=[],M_=new tn,AS=new ze,Ws=new pt,Zs=new mn;class us extends pt{constructor(e,t,n){super(e,t);this.isInstancedMesh=!0,this.instanceMatrix=new gr(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,AS)}computeBoundingBox(){let e=this.geometry,t=this.count;if(this.boundingBox===null)this.boundingBox=new tn;if(e.boundingBox===null)e.computeBoundingBox();this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Zr),M_.copy(e.boundingBox).applyMatrix4(Zr),this.boundingBox.union(M_)}computeBoundingSphere(){let e=this.geometry,t=this.count;if(this.boundingSphere===null)this.boundingSphere=new mn;if(e.boundingSphere===null)e.computeBoundingSphere();this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Zr),Zs.copy(e.boundingSphere).applyMatrix4(Zr),this.boundingSphere.union(Zs)}copy(e,t){if(super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null)this.morphTexture=e.morphTexture.clone();if(e.instanceColor!==null)this.instanceColor=e.instanceColor.clone();if(this.count=e.count,e.boundingBox!==null)this.boundingBox=e.boundingBox.clone();if(e.boundingSphere!==null)this.boundingSphere=e.boundingSphere.clone();return this}getColorAt(e,t){if(this.instanceColor===null)return t.setRGB(1,1,1);else return t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,s=e*r+1;for(let o=0;o<n.length;o++)n[o]=i[s+o]}raycast(e,t){let n=this.matrixWorld,i=this.count;if(Ws.geometry=this.geometry,Ws.material=this.material,Ws.material===void 0)return;if(this.boundingSphere===null)this.computeBoundingSphere();if(Zs.copy(this.boundingSphere),Zs.applyMatrix4(n),e.ray.intersectsSphere(Zs)===!1)return;for(let r=0;r<i;r++){this.getMatrixAt(r,Zr),S_.multiplyMatrices(n,Zr),Ws.matrixWorld=S_,Ws.raycast(e,Aa);for(let s=0,o=Aa.length;s<o;s++){let a=Aa[s];a.instanceId=r,a.object=this,t.push(a)}Aa.length=0}}setColorAt(e,t){if(this.instanceColor===null)this.instanceColor=new gr(new Float32Array(this.instanceMatrix.count*3).fill(1),3);return t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,i=n.length+1;if(this.morphTexture===null)this.morphTexture=new co(new Float32Array(i*this.count),i,this.count,1028,1015);let r=this.morphTexture.source.data.data,s=0;for(let c=0;c<n.length;c++)s+=n[c];let o=this.geometry.morphTargetsRelative?1:1-s,a=i*e;return r[a]=o,r.set(n,a+1),this}updateMorphTargets(){}dispose(){if(this.dispatchEvent({type:"dispose"}),this.morphTexture!==null)this.morphTexture.dispose(),this.morphTexture=null}}var ru=new N,RS=new N,CS=new Oe;class Un{constructor(e=new N(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=ru.subVectors(n,t).cross(RS.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let i=e.delta(ru),r=this.normal.dot(i);if(r===0){if(this.distanceToPoint(e.start)===0)return t.copy(e.start);return null}let s=-(e.start.dot(this.normal)+this.constant)/r;if(n===!0&&(s<0||s>1))return null;return t.copy(e.start).addScaledVector(i,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||CS.getNormalMatrix(e),i=this.coplanarPoint(ru).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}var dr=new mn,IS=new Ie(0.5,0.5),Ra=new N;class uo{constructor(e=new Un,t=new Un,n=new Un,i=new Un,r=new Un,s=new Un){this.planes=[e,t,n,i,r,s]}set(e,t,n,i,r,s){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(s),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=2000,n=!1){let i=this.planes,r=e.elements,s=r[0],o=r[1],a=r[2],c=r[3],l=r[4],u=r[5],h=r[6],f=r[7],d=r[8],m=r[9],x=r[10],p=r[11],g=r[12],A=r[13],E=r[14],y=r[15];if(i[0].setComponents(c-s,f-l,p-d,y-g).normalize(),i[1].setComponents(c+s,f+l,p+d,y+g).normalize(),i[2].setComponents(c+o,f+u,p+m,y+A).normalize(),i[3].setComponents(c-o,f-u,p-m,y-A).normalize(),n)i[4].setComponents(a,h,x,E).normalize(),i[5].setComponents(c-a,f-h,p-x,y-E).normalize();else if(i[4].setComponents(c-a,f-h,p-x,y-E).normalize(),t===2000)i[5].setComponents(c+a,f+h,p+x,y+E).normalize();else if(t===2001)i[5].setComponents(a,h,x,E).normalize();else throw Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0){if(e.boundingSphere===null)e.computeBoundingSphere();dr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld)}else{let t=e.geometry;if(t.boundingSphere===null)t.computeBoundingSphere();dr.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(dr)}intersectsSprite(e){dr.center.set(0,0,0);let t=IS.distanceTo(e.center);return dr.radius=0.7071067811865476+t,dr.applyMatrix4(e.matrixWorld),this.intersectsSphere(dr)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(Ra.x=i.normal.x>0?e.max.x:e.min.x,Ra.y=i.normal.y>0?e.max.y:e.min.y,Ra.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(Ra)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class ho extends sn{constructor(e){super();this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Le(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}var Ua=new N,Fa=new N,w_=new ze,Xs=new Zi,Ca=new mn,su=new N,T_=new N;class Xi extends at{constructor(e=new nn,t=new ho){super();this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let i=1,r=t.count;i<r;i++)Ua.fromBufferAttribute(t,i-1),Fa.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=Ua.distanceTo(Fa);e.setAttribute("lineDistance",new rn(n,1))}else Me("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Line.threshold,s=n.drawRange;if(n.boundingSphere===null)n.computeBoundingSphere();if(Ca.copy(n.boundingSphere),Ca.applyMatrix4(i),Ca.radius+=r,e.ray.intersectsSphere(Ca)===!1)return;w_.copy(i).invert(),Xs.copy(e.ray).applyMatrix4(w_);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),a=o*o,c=this.isLineSegments?2:1,l=n.index,h=n.attributes.position;if(l!==null){let f=Math.max(0,s.start),d=Math.min(l.count,s.start+s.count);for(let m=f,x=d-1;m<x;m+=c){let p=l.getX(m),g=l.getX(m+1),A=Ia(this,e,Xs,a,p,g,m);if(A)t.push(A)}if(this.isLineLoop){let m=l.getX(d-1),x=l.getX(f),p=Ia(this,e,Xs,a,m,x,d-1);if(p)t.push(p)}}else{let f=Math.max(0,s.start),d=Math.min(h.count,s.start+s.count);for(let m=f,x=d-1;m<x;m+=c){let p=Ia(this,e,Xs,a,m,m+1,m);if(p)t.push(p)}if(this.isLineLoop){let m=Ia(this,e,Xs,a,d-1,f,d-1);if(m)t.push(m)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function Ia(e,t,n,i,r,s,o){let a=e.geometry.attributes.position;if(Ua.fromBufferAttribute(a,r),Fa.fromBufferAttribute(a,s),n.distanceSqToSegment(Ua,Fa,su,T_)>i)return;su.applyMatrix4(e.matrixWorld);let l=t.ray.origin.distanceTo(su);if(l<t.near||l>t.far)return;return{distance:l,point:T_.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var E_=new N,A_=new N;class nc extends Xi{constructor(e,t){super(e,t);this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let i=0,r=t.count;i<r;i+=2)E_.fromBufferAttribute(t,i),A_.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+E_.distanceTo(A_);e.setAttribute("lineDistance",new rn(n,1))}else Me("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class ic extends Xi{constructor(e,t){super(e,t);this.isLineLoop=!0,this.type="LineLoop"}}class fo extends sn{constructor(e){super();this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Le(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}var R_=new ze,cu=new Zi,Pa=new mn,La=new N;class hs extends at{constructor(e=new nn,t=new fo){super();this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Points.threshold,s=n.drawRange;if(n.boundingSphere===null)n.computeBoundingSphere();if(Pa.copy(n.boundingSphere),Pa.applyMatrix4(i),Pa.radius+=r,e.ray.intersectsSphere(Pa)===!1)return;R_.copy(i).invert(),cu.copy(e.ray).applyMatrix4(R_);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),a=o*o,c=n.index,u=n.attributes.position;if(c!==null){let h=Math.max(0,s.start),f=Math.min(c.count,s.start+s.count);for(let d=h,m=f;d<m;d++){let x=c.getX(d);La.fromBufferAttribute(u,x),C_(La,x,a,i,e,t,this)}}else{let h=Math.max(0,s.start),f=Math.min(u.count,s.start+s.count);for(let d=h,m=f;d<m;d++)La.fromBufferAttribute(u,d),C_(La,d,a,i,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function C_(e,t,n,i,r,s,o){let a=cu.distanceSqToPoint(e);if(a<n){let c=new N;cu.closestPointToPoint(e,c),c.applyMatrix4(i);let l=r.ray.origin.distanceTo(c);if(l<r.near||l>r.far)return;s.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class rc extends wt{constructor(e=[],t=301,n,i,r,s,o,a,c,l){super(e,t,n,i,r,s,o,a,c,l);this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class qi extends wt{constructor(e,t,n=1014,i,r,s,o=1003,a=1003,c,l=1026,u=1){if(l!==1026&&l!==1027)throw Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let h={width:e,height:t,depth:u};super(h,i,r,s,o,a,l,n,c);this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new ro(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);if(this.compareFunction!==null)t.compareFunction=this.compareFunction;return t}}class fh extends qi{constructor(e,t=1014,n=301,i,r,s=1003,o=1003,a,c=1026){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,i,r,s,o,a,c);this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class sc extends wt{constructor(e=null){super();this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Yi extends nn{constructor(e=1,t=1,n=1,i=1,r=1,s=1){super();this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:s};let o=this;i=Math.floor(i),r=Math.floor(r),s=Math.floor(s);let a=[],c=[],l=[],u=[],h=0,f=0;d("z","y","x",-1,-1,n,t,e,s,r,0),d("z","y","x",1,-1,n,t,-e,s,r,1),d("x","z","y",1,1,e,n,t,i,s,2),d("x","z","y",1,-1,e,n,-t,i,s,3),d("x","y","z",1,-1,e,t,n,i,r,4),d("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(a),this.setAttribute("position",new rn(c,3)),this.setAttribute("normal",new rn(l,3)),this.setAttribute("uv",new rn(u,2));function d(m,x,p,g,A,E,y,w,T,R,_){let S=E/T,U=y/R,C=E/2,z=y/2,j=w/2,F=T+1,H=R+1,V=0,O=0,K=new N;for(let Q=0;Q<H;Q++){let se=Q*U-z;for(let me=0;me<F;me++){let _e=me*S-C;K[m]=_e*g,K[x]=se*A,K[p]=j,c.push(K.x,K.y,K.z),K[m]=0,K[x]=0,K[p]=w>0?1:-1,l.push(K.x,K.y,K.z),u.push(me/T),u.push(1-Q/R),V+=1}}for(let Q=0;Q<R;Q++)for(let se=0;se<T;se++){let me=h+se+F*Q,_e=h+se+F*(Q+1),qe=h+(se+1)+F*(Q+1),Ge=h+(se+1)+F*Q;a.push(me,_e,Ge),a.push(_e,qe,Ge),O+=6}o.addGroup(f,O,_),f+=O,h+=V}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Yi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class po extends nn{constructor(e=1,t=1,n=1,i=1){super();this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let r=e/2,s=t/2,o=Math.floor(n),a=Math.floor(i),c=o+1,l=a+1,u=e/o,h=t/a,f=[],d=[],m=[],x=[];for(let p=0;p<l;p++){let g=p*h-s;for(let A=0;A<c;A++){let E=A*u-r;d.push(E,-g,0),m.push(0,0,1),x.push(A/o),x.push(1-p/a)}}for(let p=0;p<a;p++)for(let g=0;g<o;g++){let A=g+c*p,E=g+c*(p+1),y=g+1+c*(p+1),w=g+1+c*p;f.push(A,E,w),f.push(E,y,w)}this.setIndex(f),this.setAttribute("position",new rn(d,3)),this.setAttribute("normal",new rn(m,3)),this.setAttribute("uv",new rn(x,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new po(e.width,e.height,e.widthSegments,e.heightSegments)}}function Mr(e){let t={};for(let n in e){t[n]={};for(let i in e[n]){let r=e[n][i];if(I_(r))if(r.isRenderTargetTexture)Me("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[n][i]=null;else t[n][i]=r.clone();else if(Array.isArray(r))if(I_(r[0])){let s=[];for(let o=0,a=r.length;o<a;o++)s[o]=r[o].clone();t[n][i]=s}else t[n][i]=r.slice();else t[n][i]=r}}return t}function Jt(e){let t={};for(let n=0;n<e.length;n++){let i=Mr(e[n]);for(let r in i)t[r]=i[r]}return t}function I_(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function PS(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function dh(e){let t=e.getRenderTarget();if(t===null)return e.outputColorSpace;if(t.isXRRenderTarget===!0)return t.texture.colorSpace;return $e.workingColorSpace}var U0={clone:Mr,merge:Jt},LS=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,NS=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class An extends sn{constructor(e){super();if(this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=LS,this.fragmentShader=NS,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0)this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Mr(e.uniforms),this.uniformsGroups=PS(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let s=this.uniforms[i].value;if(s&&s.isTexture)t.uniforms[i]={type:"t",value:s.toJSON(e).uuid};else if(s&&s.isColor)t.uniforms[i]={type:"c",value:s.getHex()};else if(s&&s.isVector2)t.uniforms[i]={type:"v2",value:s.toArray()};else if(s&&s.isVector3)t.uniforms[i]={type:"v3",value:s.toArray()};else if(s&&s.isVector4)t.uniforms[i]={type:"v4",value:s.toArray()};else if(s&&s.isMatrix3)t.uniforms[i]={type:"m3",value:s.toArray()};else if(s&&s.isMatrix4)t.uniforms[i]={type:"m4",value:s.toArray()};else t.uniforms[i]={value:s}}if(Object.keys(this.defines).length>0)t.defines=this.defines;t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)if(this.extensions[i]===!0)n[i]=!0;if(Object.keys(n).length>0)t.extensions=n;return t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let i=e.uniforms[n];switch(this.uniforms[n]={},i.type){case"t":this.uniforms[n].value=t[i.value]||null;break;case"c":this.uniforms[n].value=new Le().setHex(i.value);break;case"v2":this.uniforms[n].value=new Ie().fromArray(i.value);break;case"v3":this.uniforms[n].value=new N().fromArray(i.value);break;case"v4":this.uniforms[n].value=new st().fromArray(i.value);break;case"m3":this.uniforms[n].value=new Oe().fromArray(i.value);break;case"m4":this.uniforms[n].value=new ze().fromArray(i.value);break;default:this.uniforms[n].value=i.value}}if(e.defines!==void 0)this.defines=e.defines;if(e.vertexShader!==void 0)this.vertexShader=e.vertexShader;if(e.fragmentShader!==void 0)this.fragmentShader=e.fragmentShader;if(e.glslVersion!==void 0)this.glslVersion=e.glslVersion;if(e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];if(e.lights!==void 0)this.lights=e.lights;if(e.clipping!==void 0)this.clipping=e.clipping;return this}}class ph extends An{constructor(e){super(e);this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Ti extends sn{constructor(e){super();this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Le(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new Ie(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ti,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class gn extends Ti{constructor(e){super();this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new Ie(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return We(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+0.4*t)/(1-0.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Le(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Le(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Le(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){if(this._anisotropy>0!==e>0)this.version++;this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){if(this._clearcoat>0!==e>0)this.version++;this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){if(this._iridescence>0!==e>0)this.version++;this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){if(this._dispersion>0!==e>0)this.version++;this._dispersion=e}get sheen(){return this._sheen}set sheen(e){if(this._sheen>0!==e>0)this.version++;this._sheen=e}get transmission(){return this._transmission}set transmission(e){if(this._transmission>0!==e>0)this.version++;this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}class oc extends sn{constructor(e){super();this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new Ie(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ti,this.combine=0,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class mh extends sn{constructor(e){super();this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class gh extends sn{constructor(e){super();this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}function Na(e,t){if(!e||e.constructor===t)return e;if(typeof t.BYTES_PER_ELEMENT==="number")return new t(e);return Array.prototype.slice.call(e)}function DS(e){function t(r,s){return e[r]-e[s]}let n=e.length,i=Array(n);for(let r=0;r!==n;++r)i[r]=r;return i.sort(t),i}function P_(e,t,n){let i=e.length,r=new e.constructor(i);for(let s=0,o=0;o!==i;++s){let a=n[s]*t;for(let c=0;c!==t;++c)r[o++]=e[a+c]}return r}function OS(e,t,n,i){let r=1,s=e[0];while(s!==void 0&&s[i]===void 0)s=e[r++];if(s===void 0)return;let o=s[i];if(o===void 0)return;if(Array.isArray(o))do{if(o=s[i],o!==void 0)t.push(s.time),n.push(...o);s=e[r++]}while(s!==void 0);else if(o.toArray!==void 0)do{if(o=s[i],o!==void 0)t.push(s.time),o.toArray(n,n.length);s=e[r++]}while(s!==void 0);else do{if(o=s[i],o!==void 0)t.push(s.time),n.push(o);s=e[r++]}while(s!==void 0)}class Ei{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],r=t[n-1];e:{t:{let s;n:{i:if(!(e<i)){for(let o=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=t[++n],e<i)break t}s=t.length;break n}if(!(e>=r)){let o=t[1];if(e<o)n=2,r=o;for(let a=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(i=r,r=t[--n-1],e>=r)break t}s=n,n=0;break n}break e}while(n<s){let o=n+s>>>1;if(e<t[o])s=o;else n=o+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let s=0;s!==i;++s)t[s]=n[r+s];return t}interpolate_(){throw Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}}class _h extends Ei{constructor(e,t,n,i){super(e,t,n,i);this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:2400,endingEnd:2400}}intervalChanged_(e,t,n){let i=this.parameterPositions,r=e-2,s=e+1,o=i[r],a=i[s];if(o===void 0)switch(this.getSettings_().endingStart){case 2401:r=e,o=2*t-n;break;case 2402:r=i.length-2,o=t+i[r]-i[r+1];break;default:r=e,o=n}if(a===void 0)switch(this.getSettings_().endingEnd){case 2401:s=e,a=2*n-t;break;case 2402:s=1,a=n+i[1]-i[0];break;default:s=e-1,a=t}let c=(n-t)*0.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(a-n),this._offsetPrev=r*l,this._offsetNext=s*l}interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,c=a-o,l=this._offsetPrev,u=this._offsetNext,h=this._weightPrev,f=this._weightNext,d=(n-t)/(i-t),m=d*d,x=m*d,p=-h*x+2*h*m-h*d,g=(1+h)*x+(-1.5-2*h)*m+(-0.5+h)*d+1,A=(-1-f)*x+(1.5+f)*m+0.5*d,E=f*x-f*m;for(let y=0;y!==o;++y)r[y]=p*s[l+y]+g*s[c+y]+A*s[a+y]+E*s[u+y];return r}}class ac extends Ei{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,c=a-o,l=(n-t)/(i-t),u=1-l;for(let h=0;h!==o;++h)r[h]=s[c+h]*u+s[a+h]*l;return r}}class xh extends Ei{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}}class vh extends Ei{interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,c=a-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let d=(n-t)/(i-t),m=1-d;for(let x=0;x!==o;++x)r[x]=s[c+x]*m+s[a+x]*d;return r}let h=o*2,f=e-1;for(let d=0;d!==o;++d){let m=s[c+d],x=s[a+d],p=f*h+d*2,g=u[p],A=u[p+1],E=e*h+d*2,y=l[E],w=l[E+1],T=(n-t)/(i-t),R,_,S,U,C;for(let z=0;z<8;z++){R=T*T,_=R*T,S=1-T,U=S*S,C=U*S;let F=C*t+3*U*T*g+3*S*R*y+_*i-n;if(Math.abs(F)<0.0000000001)break;let H=3*U*(g-t)+6*S*T*(y-g)+3*R*(i-y);if(Math.abs(H)<0.0000000001)break;T=T-F/H,T=Math.max(0,Math.min(1,T))}r[d]=C*m+3*U*T*A+3*S*R*w+_*x}return r}}class _n{constructor(e,t,n,i){if(e===void 0)throw Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Na(t,this.TimeBufferType),this.values=Na(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Na(e.times,Array),values:Na(e.values,Array)};let i=e.getInterpolation();if(i!==e.DefaultInterpolation)n.interpolation=i}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new xh(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new ac(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new _h(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new vh(this.times,this.values,this.getValueSize(),e);if(this.settings)t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents;return t}setInterpolation(e){let t;switch(e){case 2300:t=this.InterpolantFactoryMethodDiscrete;break;case 2301:t=this.InterpolantFactoryMethodLinear;break;case 2302:t=this.InterpolantFactoryMethodSmooth;break;case 2303:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(n);return Me("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return 2300;case this.InterpolantFactoryMethodLinear:return 2301;case this.InterpolantFactoryMethodSmooth:return 2302;case this.InterpolantFactoryMethodBezier:return 2303}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){let n=this.times,i=n.length,r=0,s=i-1;while(r!==i&&n[r]<e)++r;while(s!==-1&&n[s]>t)--s;if(++s,r!==0||s!==i){if(r>=s)s=Math.max(s,1),r=s-1;let o=this.getValueSize();this.times=n.slice(r,s),this.values=this.values.slice(r*o,s*o)}return this}validate(){let e=!0,t=this.getValueSize();if(t-Math.floor(t)!==0)Ne("KeyframeTrack: Invalid value size in track.",this),e=!1;let n=this.times,i=this.values,r=n.length;if(r===0)Ne("KeyframeTrack: Track is empty.",this),e=!1;let s=null;for(let o=0;o!==r;o++){let a=n[o];if(typeof a==="number"&&isNaN(a)){Ne("KeyframeTrack: Time is not a valid number.",this,o,a),e=!1;break}if(s!==null&&s>a){Ne("KeyframeTrack: Out of order keys.",this,o,a,s),e=!1;break}s=a}if(i!==void 0){if(Xb(i))for(let o=0,a=i.length;o!==a;++o){let c=i[o];if(isNaN(c)){Ne("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===2302,r=e.length-1,s=1;for(let o=1;o<r;++o){let a=!1,c=e[o],l=e[o+1];if(c!==l&&(o!==1||c!==e[0]))if(!i){let u=o*n,h=u-n,f=u+n;for(let d=0;d!==n;++d){let m=t[u+d];if(m!==t[h+d]||m!==t[f+d]){a=!0;break}}}else a=!0;if(a){if(o!==s){e[s]=e[o];let u=o*n,h=s*n;for(let f=0;f!==n;++f)t[h+f]=t[u+f]}++s}}if(r>0){e[s]=e[r];for(let o=r*n,a=s*n,c=0;c!==n;++c)t[a+c]=t[o+c];++s}if(s!==e.length)this.times=e.slice(0,s),this.values=t.slice(0,s*n);else this.times=e,this.values=t;return this}clone(){let e=this.times.slice(),t=this.values.slice(),i=new this.constructor(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}}_n.prototype.ValueTypeName="";_n.prototype.TimeBufferType=Float32Array;_n.prototype.ValueBufferType=Float32Array;_n.prototype.DefaultInterpolation=2301;class ji extends _n{constructor(e,t,n){super(e,t,n)}}ji.prototype.ValueTypeName="bool";ji.prototype.ValueBufferType=Array;ji.prototype.DefaultInterpolation=2300;ji.prototype.InterpolantFactoryMethodLinear=void 0;ji.prototype.InterpolantFactoryMethodSmooth=void 0;class cc extends _n{constructor(e,t,n,i){super(e,t,n,i)}}cc.prototype.ValueTypeName="color";class Ji extends _n{constructor(e,t,n,i){super(e,t,n,i)}}Ji.prototype.ValueTypeName="number";class yh extends Ei{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=(n-t)/(i-t),c=e*o;for(let l=c+o;c!==l;c+=4)Gt.slerpFlat(r,0,s,c-o,s,c,a);return r}}class Ki extends _n{constructor(e,t,n,i){super(e,t,n,i)}InterpolantFactoryMethodLinear(e){return new yh(this.times,this.values,this.getValueSize(),e)}}Ki.prototype.ValueTypeName="quaternion";Ki.prototype.InterpolantFactoryMethodSmooth=void 0;class Qi extends _n{constructor(e,t,n){super(e,t,n)}}Qi.prototype.ValueTypeName="string";Qi.prototype.ValueBufferType=Array;Qi.prototype.DefaultInterpolation=2300;Qi.prototype.InterpolantFactoryMethodLinear=void 0;Qi.prototype.InterpolantFactoryMethodSmooth=void 0;class wr extends _n{constructor(e,t,n,i){super(e,t,n,i)}}wr.prototype.ValueTypeName="vector";class Qr{constructor(e="",t=-1,n=[],i=2500){if(this.name=e,this.tracks=n,this.duration=t,this.blendMode=i,this.uuid=zn(),this.userData={},this.duration<0)this.resetDuration()}static parse(e){let t=[],n=e.tracks,i=1/(e.fps||1);for(let s=0,o=n.length;s!==o;++s)t.push(FS(n[s]).scale(i));let r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){let t=[],n=e.tracks,i={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,s=n.length;r!==s;++r)t.push(_n.toJSON(n[r]));return i}static CreateFromMorphTargetSequence(e,t,n,i){let r=t.length,s=[];for(let o=0;o<r;o++){let a=[],c=[];a.push((o+r-1)%r,o,(o+1)%r),c.push(0,1,0);let l=DS(a);if(a=P_(a,1,l),c=P_(c,1,l),!i&&a[0]===0)a.push(r),c.push(c[0]);s.push(new Ji(".morphTargetInfluences["+t[o].name+"]",a,c).scale(1/n))}return new this(e,-1,s)}static findByName(e,t){let n=e;if(!Array.isArray(e)){let i=e;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===t)return n[i];return null}static CreateClipsFromMorphTargetSequences(e,t,n){let i={},r=/^([\w-]*?)([\d]+)$/;for(let o=0,a=e.length;o<a;o++){let c=e[o],l=c.name.match(r);if(l&&l.length>1){let u=l[1],h=i[u];if(!h)i[u]=h=[];h.push(c)}}let s=[];for(let o in i)s.push(this.CreateFromMorphTargetSequence(o,i[o],t,n));return s}resetDuration(){let e=this.tracks,t=0;for(let n=0,i=e.length;n!==i;++n){let r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let n=0;n<this.tracks.length;n++)e.push(this.tracks[n].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}}function US(e){switch(e.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Ji;case"vector":case"vector2":case"vector3":case"vector4":return wr;case"color":return cc;case"quaternion":return Ki;case"bool":case"boolean":return ji;case"string":return Qi}throw Error("THREE.KeyframeTrack: Unsupported typeName: "+e)}function FS(e){if(e.type===void 0)throw Error("THREE.KeyframeTrack: track type undefined, can not parse");let t=US(e.type);if(e.times===void 0){let n=[],i=[];OS(e.keys,n,i,"value"),e.times=n,e.values=i}if(t.parse!==void 0)return t.parse(e);else return new t(e.name,e.times,e.values,e.interpolation)}var ei={enabled:!1,files:{},add:function(e,t){if(this.enabled===!1)return;if(L_(e))return;this.files[e]=t},get:function(e){if(this.enabled===!1)return;if(L_(e))return;return this.files[e]},remove:function(e){delete this.files[e]},clear:function(){this.files={}}};function L_(e){try{let t=e.slice(e.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch(t){return!1}}class mo{constructor(e,t,n){let i=this,r=!1,s=0,o=0,a=void 0,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(l){if(o++,r===!1){if(i.onStart!==void 0)i.onStart(l,s,o)}r=!0},this.itemEnd=function(l){if(s++,i.onProgress!==void 0)i.onProgress(l,s,o);if(s===o){if(r=!1,i.onLoad!==void 0)i.onLoad()}},this.itemError=function(l){if(i.onError!==void 0)i.onError(l)},this.resolveURL=function(l){if(l=l.normalize("NFC"),a)return a(l);return l},this.setURLModifier=function(l){return a=l,this},this.addHandler=function(l,u){return c.push(l,u),this},this.removeHandler=function(l){let u=c.indexOf(l);if(u!==-1)c.splice(u,2);return this},this.getHandler=function(l){for(let u=0,h=c.length;u<h;u+=2){let f=c[u],d=c[u+1];if(f.global)f.lastIndex=0;if(f.test(l))return d}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){if(!this._abortController)this._abortController=new AbortController;return this._abortController}}var F0=new mo;class Ai{constructor(e){if(this.manager=e!==void 0?e:F0,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}Ai.DEFAULT_MATERIAL_NAME="__DEFAULT";var bi={};class z0 extends Error{constructor(e,t){super(e);this.response=t}}class go extends Ai{constructor(e){super(e);this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,i){if(e===void 0)e="";if(this.path!==void 0)e=this.path+e;e=this.manager.resolveURL(e);let r=ei.get(`file:${e}`);if(r!==void 0){this.manager.itemStart(e),setTimeout(()=>{if(t)t(r);this.manager.itemEnd(e)},0);return}if(bi[e]!==void 0){bi[e].push({onLoad:t,onProgress:n,onError:i});return}bi[e]=[],bi[e].push({onLoad:t,onProgress:n,onError:i});let s=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any==="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,a=this.responseType;fetch(s).then((c)=>{if(c.status===200||c.status===0){if(c.status===0)Me("FileLoader: HTTP Status 0 received.");if(typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let l=bi[e],u=c.body.getReader(),h=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),f=h?parseInt(h):0,d=f!==0,m=0,x=new ReadableStream({start(p){g();function g(){u.read().then(({done:A,value:E})=>{if(A)p.close();else{m+=E.byteLength;let y=new ProgressEvent("progress",{lengthComputable:d,loaded:m,total:f});for(let w=0,T=l.length;w<T;w++){let R=l[w];if(R.onProgress)R.onProgress(y)}p.enqueue(E),g()}},(A)=>{p.error(A)})}}});return new Response(x)}else throw new z0(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then((c)=>{switch(a){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then((l)=>new DOMParser().parseFromString(l,o));case"json":return c.json();default:if(o==="")return c.text();else{let u=/charset="?([^;"\s]*)"?/i.exec(o),h=u&&u[1]?u[1].toLowerCase():void 0,f=new TextDecoder(h);return c.arrayBuffer().then((d)=>f.decode(d))}}}).then((c)=>{ei.add(`file:${e}`,c);let l=bi[e];delete bi[e];for(let u=0,h=l.length;u<h;u++){let f=l[u];if(f.onLoad)f.onLoad(c)}}).catch((c)=>{let l=bi[e];if(l===void 0)throw this.manager.itemError(e),c;delete bi[e];for(let u=0,h=l.length;u<h;u++){let f=l[u];if(f.onError)f.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}var Xr=new WeakMap;class bh extends Ai{constructor(e){super(e)}load(e,t,n,i){if(this.path!==void 0)e=this.path+e;e=this.manager.resolveURL(e);let r=this,s=ei.get(`image:${e}`);if(s!==void 0){if(s.complete===!0)r.manager.itemStart(e),setTimeout(function(){if(t)t(s);r.manager.itemEnd(e)},0);else{let u=Xr.get(s);if(u===void 0)u=[],Xr.set(s,u);u.push({onLoad:t,onError:i})}return s}let o=Jr("img");function a(){if(l(),t)t(this);let u=Xr.get(this)||[];for(let h=0;h<u.length;h++){let f=u[h];if(f.onLoad)f.onLoad(this)}Xr.delete(this),r.manager.itemEnd(e)}function c(u){if(l(),i)i(u);ei.remove(`image:${e}`);let h=Xr.get(this)||[];for(let f=0;f<h.length;f++){let d=h[f];if(d.onError)d.onError(u)}Xr.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function l(){o.removeEventListener("load",a,!1),o.removeEventListener("error",c,!1)}if(o.addEventListener("load",a,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"){if(this.crossOrigin!==void 0)o.crossOrigin=this.crossOrigin}return ei.add(`image:${e}`,o),r.manager.itemStart(e),o.src=e,o}}class lc extends Ai{constructor(e){super(e)}load(e,t,n,i){let r=new wt,s=new bh(this.manager);return s.setCrossOrigin(this.crossOrigin),s.setPath(this.path),s.load(e,function(o){if(r.image=o,r.needsUpdate=!0,t!==void 0)t(r)},n,i),r}}class fs extends at{constructor(e,t=1){super();this.isLight=!0,this.type="Light",this.color=new Le(e),this.intensity=t}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}class uc extends fs{constructor(e,t,n){super(e,n);this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(at.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Le(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}}var ou=new ze,N_=new N,D_=new N;class hc{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ie(512,512),this.mapType=1009,this.map=null,this.mapPass=null,this.matrix=new ze,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new uo,this._frameExtents=new Ie(1,1),this._viewportCount=1,this._viewports=[new st(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;if(N_.setFromMatrixPosition(e.matrixWorld),t.position.copy(N_),D_.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(D_),t.updateMatrixWorld(),ou.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ou,t.coordinateSystem,t.reversedDepth),t.coordinateSystem===2001||t.reversedDepth)n.set(0.5,0,0,0.5,0,0.5,0,0.5,0,0,1,0,0,0,0,1);else n.set(0.5,0,0,0.5,0,0.5,0,0.5,0,0,0.5,0.5,0,0,0,1);n.multiply(ou)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){if(this.map)this.map.dispose();if(this.mapPass)this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};if(this.intensity!==1)e.intensity=this.intensity;if(this.bias!==0)e.bias=this.bias;if(this.normalBias!==0)e.normalBias=this.normalBias;if(this.radius!==1)e.radius=this.radius;if(this.mapSize.x!==512||this.mapSize.y!==512)e.mapSize=this.mapSize.toArray();return e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}var Da=new N,Oa=new Gt,Kn=new N;class fc extends at{constructor(){super();this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ze,this.projectionMatrix=new ze,this.projectionMatrixInverse=new ze,this.coordinateSystem=2000,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){if(super.updateMatrixWorld(e),this.matrixWorld.decompose(Da,Oa,Kn),Kn.x===1&&Kn.y===1&&Kn.z===1)this.matrixWorldInverse.copy(this.matrixWorld).invert();else this.matrixWorldInverse.compose(Da,Oa,Kn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){if(super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Da,Oa,Kn),Kn.x===1&&Kn.y===1&&Kn.z===1)this.matrixWorldInverse.copy(this.matrixWorld).invert();else this.matrixWorldInverse.compose(Da,Oa,Kn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}var Bi=new N,O_=new Ie,U_=new Ie;class Lt extends fc{constructor(e=50,t=1,n=0.1,i=2000){super();this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=0.5*this.getFilmHeight()/e;this.fov=mr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(qs*0.5*this.fov);return 0.5*this.getFilmHeight()/e}getEffectiveFOV(){return mr*2*Math.atan(Math.tan(qs*0.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Bi.set(-1,-1,0.5).applyMatrix4(this.projectionMatrixInverse),t.set(Bi.x,Bi.y).multiplyScalar(-e/Bi.z),Bi.set(1,1,0.5).applyMatrix4(this.projectionMatrixInverse),n.set(Bi.x,Bi.y).multiplyScalar(-e/Bi.z)}getViewSize(e,t){return this.getViewBounds(e,O_,U_),t.subVectors(U_,O_)}setViewOffset(e,t,n,i,r,s){if(this.aspect=e/t,this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(qs*0.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-0.5*i,s=this.view;if(this.view!==null&&this.view.enabled){let{fullWidth:a,fullHeight:c}=s;r+=s.offsetX*i/a,t-=s.offsetY*n/c,i*=s.width/a,n*=s.height/c}let o=this.filmOffset;if(o!==0)r+=e*o/this.getFilmWidth();this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);if(t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null)t.object.view=Object.assign({},this.view);return t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class k0 extends hc{constructor(){super(new Lt(50,1,0.5,500));this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=mr*2*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;if(n!==t.fov||i!==t.aspect||r!==t.far)t.fov=n,t.aspect=i,t.far=r,t.updateProjectionMatrix();super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class dc extends fs{constructor(e,t,n=0,i=Math.PI/3,r=0,s=2){super(e,t);this.isSpotLight=!0,this.type="SpotLight",this.position.copy(at.DEFAULT_UP),this.updateMatrix(),this.target=new at,this.distance=n,this.angle=i,this.penumbra=r,this.decay=s,this.map=null,this.shadow=new k0}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);if(t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture)t.object.map=this.map.toJSON(e).uuid;return t.object.shadow=this.shadow.toJSON(),t}}class B0 extends hc{constructor(){super(new Lt(90,1,0.5,500));this.isPointLightShadow=!0}}class ds extends fs{constructor(e,t,n=0,i=2){super(e,t);this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new B0}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}}class Tr extends fc{constructor(e=-1,t=1,n=1,i=-1,r=0.1,s=2000){super();this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,s){if(this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-e,s=n+e,o=i+t,a=i-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,l=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,s=r+c*this.view.width,o-=l*this.view.offsetY,a=o-l*this.view.height}this.projectionMatrix.makeOrthographic(r,s,o,a,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);if(t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null)t.object.view=Object.assign({},this.view);return t}}class G0 extends hc{constructor(){super(new Tr(-5,5,5,-5,0.5,500));this.isDirectionalLightShadow=!0}}class ps extends fs{constructor(e,t){super(e,t);this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(at.DEFAULT_UP),this.updateMatrix(),this.target=new at,this.shadow=new G0}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}}class er{static extractUrlBase(e){let t=e.lastIndexOf("/");if(t===-1)return"./";return e.slice(0,t+1)}static resolveURL(e,t){if(typeof e!=="string"||e==="")return"";if(/^https?:\/\//i.test(t)&&/^\//.test(e))t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1");if(/^(https?:)?\/\//i.test(e))return e;if(/^data:.*,.*$/i.test(e))return e;if(/^blob:.*$/i.test(e))return e;return t+e}}var au=new WeakMap;class pc extends Ai{constructor(e){super(e);if(this.isImageBitmapLoader=!0,typeof createImageBitmap>"u")Me("ImageBitmapLoader: createImageBitmap() not supported.");if(typeof fetch>"u")Me("ImageBitmapLoader: fetch() not supported.");this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,i){if(e===void 0)e="";if(this.path!==void 0)e=this.path+e;e=this.manager.resolveURL(e);let r=this,s=ei.get(`image-bitmap:${e}`);if(s!==void 0){if(r.manager.itemStart(e),s.then){s.then((c)=>{if(au.has(s)===!0){if(i)i(au.get(s));r.manager.itemError(e),r.manager.itemEnd(e)}else{if(t)t(c);r.manager.itemEnd(e)}});return}setTimeout(function(){if(t)t(s);r.manager.itemEnd(e)},0);return}let o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader,o.signal=typeof AbortSignal.any==="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let a=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(c){if(ei.add(`image-bitmap:${e}`,c),t)t(c);r.manager.itemEnd(e)}).catch(function(c){if(i)i(c);au.set(a,c),ei.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});ei.add(`image-bitmap:${e}`,a),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}var qr=-90,Yr=1;class Sh extends at{constructor(e,t,n){super();this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new Lt(qr,Yr,e,t);i.layers=this.layers,this.add(i);let r=new Lt(qr,Yr,e,t);r.layers=this.layers,this.add(r);let s=new Lt(qr,Yr,e,t);s.layers=this.layers,this.add(s);let o=new Lt(qr,Yr,e,t);o.layers=this.layers,this.add(o);let a=new Lt(qr,Yr,e,t);a.layers=this.layers,this.add(a);let c=new Lt(qr,Yr,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,r,s,o,a]=t;for(let c of t)this.remove(c);if(e===2000)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),a.up.set(0,1,0),a.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),a.up.set(0,-1,0),a.lookAt(0,0,-1);else throw Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){if(this.parent===null)this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;if(this.coordinateSystem!==e.coordinateSystem)this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem();let[r,s,o,a,c,l]=this.children,u=e.getRenderTarget(),h=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),d=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let x=!1;if(e.isWebGLRenderer===!0)x=e.state.buffers.depth.getReversed();else x=e.reversedDepthBuffer;if(e.setRenderTarget(n,0,i),x&&e.autoClear===!1)e.clearDepth();if(e.render(t,r),e.setRenderTarget(n,1,i),x&&e.autoClear===!1)e.clearDepth();if(e.render(t,s),e.setRenderTarget(n,2,i),x&&e.autoClear===!1)e.clearDepth();if(e.render(t,o),e.setRenderTarget(n,3,i),x&&e.autoClear===!1)e.clearDepth();if(e.render(t,a),e.setRenderTarget(n,4,i),x&&e.autoClear===!1)e.clearDepth();if(e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,i),x&&e.autoClear===!1)e.clearDepth();e.render(t,l),e.setRenderTarget(u,h,f),e.xr.enabled=d,n.texture.needsPMREMUpdate=!0}}class Mh extends Lt{constructor(e=[]){super();this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class wh{constructor(e,t,n){this.binding=e,this.valueSize=n;let i,r,s;switch(t){case"quaternion":i=this._slerp,r=this._slerpAdditive,s=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case"string":case"bool":i=this._select,r=this._select,s=this._setAdditiveIdentityOther,this.buffer=Array(n*5);break;default:i=this._lerp,r=this._lerpAdditive,s=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=i,this._mixBufferRegionAdditive=r,this._setIdentity=s,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(e,t){let n=this.buffer,i=this.valueSize,r=e*i+i,s=this.cumulativeWeight;if(s===0){for(let o=0;o!==i;++o)n[r+o]=n[o];s=t}else{s+=t;let o=t/s;this._mixBufferRegion(n,r,0,o,i)}this.cumulativeWeight=s}accumulateAdditive(e){let t=this.buffer,n=this.valueSize,i=n*this._addIndex;if(this.cumulativeWeightAdditive===0)this._setIdentity();this._mixBufferRegionAdditive(t,i,0,e,n),this.cumulativeWeightAdditive+=e}apply(e){let t=this.valueSize,n=this.buffer,i=e*t+t,r=this.cumulativeWeight,s=this.cumulativeWeightAdditive,o=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,r<1){let a=t*this._origIndex;this._mixBufferRegion(n,i,a,1-r,t)}if(s>0)this._mixBufferRegionAdditive(n,i,this._addIndex*t,1,t);for(let a=t,c=t+t;a!==c;++a)if(n[a]!==n[a+t]){o.setValue(n,i);break}}saveOriginalState(){let e=this.binding,t=this.buffer,n=this.valueSize,i=n*this._origIndex;e.getValue(t,i);for(let r=n,s=i;r!==s;++r)t[r]=t[i+r%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){let e=this.valueSize*3;this.binding.setValue(this.buffer,e)}_setAdditiveIdentityNumeric(){let e=this._addIndex*this.valueSize,t=e+this.valueSize;for(let n=e;n<t;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){let e=this._origIndex*this.valueSize,t=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[t+n]=this.buffer[e+n]}_select(e,t,n,i,r){if(i>=0.5)for(let s=0;s!==r;++s)e[t+s]=e[n+s]}_slerp(e,t,n,i){Gt.slerpFlat(e,t,e,t,e,n,i)}_slerpAdditive(e,t,n,i,r){let s=this._workIndex*r;Gt.multiplyQuaternionsFlat(e,s,e,t,e,n),Gt.slerpFlat(e,t,e,t,e,s,i)}_lerp(e,t,n,i,r){let s=1-i;for(let o=0;o!==r;++o){let a=t+o;e[a]=e[a]*s+e[n+o]*i}}_lerpAdditive(e,t,n,i,r){for(let s=0;s!==r;++s){let o=t+s;e[o]=e[o]+e[n+s]*i}}}var Th="\\[\\]\\.:\\/",zS=new RegExp("["+Th+"]","g"),Eh="[^"+Th+"]",kS="[^"+Th.replace("\\.","")+"]",BS=/((?:WC+[\/:])*)/.source.replace("WC",Eh),GS=/(WCOD+)?/.source.replace("WCOD",kS),HS=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Eh),VS=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Eh),$S=new RegExp("^"+BS+GS+HS+VS+"$"),WS=["material","materials","bones","map"];class H0{constructor(e,t,n){let i=n||tt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];if(i!==void 0)i.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}}class tt{constructor(e,t,n){this.path=t,this.parsedPath=n||tt.parseTrackName(t),this.node=tt.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){if(!(e&&e.isAnimationObjectGroup))return new tt(e,t,n);else return new tt.Composite(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(zS,"")}static parseTrackName(e){let t=$S.exec(e);if(t===null)throw Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);if(WS.indexOf(r)!==-1)n.nodeName=n.nodeName.substring(0,i),n.objectName=r}if(n.propertyName===null||n.propertyName.length===0)throw Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let s=0;s<r.length;s++){let o=r[s];if(o.name===t||o.uuid===t)return o;let a=n(o.children);if(a)return a}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,{objectName:n,propertyName:i,propertyIndex:r}=t;if(!e)e=tt.findNode(this.rootNode,t.nodeName),this.node=e;if(this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Me("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){Ne("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Ne("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Ne("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let l=0;l<e.length;l++)if(e[l].name===c){c=l;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Ne("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Ne("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Ne("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){Ne("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let s=e[i];if(s===void 0){let c=t.nodeName;Ne("PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e);return}let o=this.Versioning.None;if(this.targetObject=e,e.isMaterial===!0)o=this.Versioning.NeedsUpdate;else if(e.isObject3D===!0)o=this.Versioning.MatrixWorldNeedsUpdate;let a=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){Ne("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Ne("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}if(e.morphTargetDictionary[r]!==void 0)r=e.morphTargetDictionary[r]}a=this.BindingType.ArrayElement,this.resolvedProperty=s,this.propertyIndex=r}else if(s.fromArray!==void 0&&s.toArray!==void 0)a=this.BindingType.HasFromToArray,this.resolvedProperty=s;else if(Array.isArray(s))a=this.BindingType.EntireArray,this.resolvedProperty=s;else this.propertyName=i;this.getValue=this.GetterByBindingType[a],this.setValue=this.SetterByBindingTypeAndVersioning[a][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}tt.Composite=H0;tt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};tt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};tt.prototype.GetterByBindingType=[tt.prototype._getValue_direct,tt.prototype._getValue_array,tt.prototype._getValue_arrayElement,tt.prototype._getValue_toArray];tt.prototype.SetterByBindingTypeAndVersioning=[[tt.prototype._setValue_direct,tt.prototype._setValue_direct_setNeedsUpdate,tt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[tt.prototype._setValue_array,tt.prototype._setValue_array_setNeedsUpdate,tt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[tt.prototype._setValue_arrayElement,tt.prototype._setValue_arrayElement_setNeedsUpdate,tt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[tt.prototype._setValue_fromArray,tt.prototype._setValue_fromArray_setNeedsUpdate,tt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class Ah{constructor(e,t,n=null,i=t.blendMode){this._mixer=e,this._clip=t,this._localRoot=n,this.blendMode=i;let r=t.tracks,s=r.length,o=Array(s),a={endingStart:2400,endingEnd:2400};for(let c=0;c!==s;++c){let l=r[c].createInterpolant(null);o[c]=l,l.settings=a}this._interpolantSettings=a,this._interpolants=o,this._propertyBindings=Array(s),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._restoreTimeScale=null,this._weightInterpolant=null,this.loop=2201,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(e){return this._startTime=e,this}setLoop(e,t){return this.loop=e,this.repetitions=t,this}setEffectiveWeight(e){return this.weight=e,this._effectiveWeight=this.enabled?e:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(e){return this._scheduleFading(e,0,1)}fadeOut(e){return this._scheduleFading(e,1,0)}crossFadeFrom(e,t,n=!1){if(e.fadeOut(t),this.fadeIn(t),n===!0){let i=this._clip.duration,r=e._clip.duration,s=r/i,o=i/r;e._restoreTimeScale=e.timeScale,this._restoreTimeScale=this.timeScale,e.warp(1,s,t),this.warp(o,1,t)}return this}crossFadeTo(e,t,n=!1){return e.crossFadeFrom(this,t,n)}stopFading(){let e=this._weightInterpolant;if(e!==null)this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(e);return this}setEffectiveTimeScale(e){return this.timeScale=e,this._effectiveTimeScale=this.paused?0:e,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(e){return this.timeScale=this._clip.duration/e,this.stopWarping()}syncWith(e){return this.time=e.time,this.timeScale=e.timeScale,this.stopWarping()}halt(e){return this.warp(this._effectiveTimeScale,0,e)}warp(e,t,n){let i=this._mixer,r=i.time,s=this.timeScale,o=this._timeScaleInterpolant;if(o===null)o=i._lendControlInterpolant(),this._timeScaleInterpolant=o;let a=o.parameterPositions,c=o.sampleValues;return a[0]=r,a[1]=r+n,c[0]=e/s,c[1]=t/s,this}stopWarping(){let e=this._timeScaleInterpolant;if(e!==null)this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(e);return this._restoreTimeScale=null,this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(e,t,n,i){if(!this.enabled){this._updateWeight(e);return}let r=this._startTime;if(r!==null){let a=(e-r)*n;if(a<0||n===0)t=0;else this._startTime=null,t=n*a}t*=this._updateTimeScale(e);let s=this._updateTime(t),o=this._updateWeight(e);if(o>0){let a=this._interpolants,c=this._propertyBindings;switch(this.blendMode){case 2501:for(let l=0,u=a.length;l!==u;++l)a[l].evaluate(s),c[l].accumulateAdditive(o);break;case 2500:default:for(let l=0,u=a.length;l!==u;++l)a[l].evaluate(s),c[l].accumulate(i,o)}}}_updateWeight(e){let t=0;if(this.enabled){t=this.weight;let n=this._weightInterpolant;if(n!==null){let i=n.evaluate(e)[0];if(t*=i,e>n.parameterPositions[1]){if(this.stopFading(),i===0)this.enabled=!1}}}return this._effectiveWeight=t,t}_updateTimeScale(e){let t=0;if(!this.paused){t=this.timeScale;let n=this._timeScaleInterpolant;if(n!==null){let i=n.evaluate(e)[0];if(t*=i,e>n.parameterPositions[1]){if(t===0)this.paused=!0;else{if(this._restoreTimeScale!==null)t=this._restoreTimeScale;this.timeScale=t}this.stopWarping()}}}return this._effectiveTimeScale=t,t}_updateTime(e){let t=this._clip.duration,n=this.loop,i=this.time+e,r=this._loopCount,s=n===2202;if(e===0){if(r===-1)return i;return s&&(r&1)===1?t-i:i}if(n===2200){if(r===-1)this._loopCount=0,this._setEndings(!0,!0,!1);e:{if(i>=t)i=t;else if(i<0)i=0;else{this.time=i;break e}if(this.clampWhenFinished)this.paused=!0;else this.enabled=!1;this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:e<0?-1:1})}}else{if(r===-1)if(e>=0)r=0,this._setEndings(!0,this.repetitions===0,s);else this._setEndings(this.repetitions===0,!0,s);if(i>=t||i<0){let o=Math.floor(i/t);i-=t*o,r+=Math.abs(o);let a=this.repetitions-r;if(a<=0){if(this.clampWhenFinished)this.paused=!0;else this.enabled=!1;i=e>0?t:0,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:e>0?1:-1})}else{if(a===1){let c=e<0;this._setEndings(c,!c,s)}else this._setEndings(!1,!1,s);this._loopCount=r,this.time=i,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:o})}}else this._loopCount=r,this.time=i;if(s&&(r&1)===1)return t-i}return i}_setEndings(e,t,n){let i=this._interpolantSettings;if(n)i.endingStart=2401,i.endingEnd=2401;else{if(e)i.endingStart=this.zeroSlopeAtStart?2401:2400;else i.endingStart=2402;if(t)i.endingEnd=this.zeroSlopeAtEnd?2401:2400;else i.endingEnd=2402}}_scheduleFading(e,t,n){let i=this._mixer,r=i.time,s=this._weightInterpolant;if(s===null)s=i._lendControlInterpolant(),this._weightInterpolant=s;let o=s.parameterPositions,a=s.sampleValues;return o[0]=r,a[0]=t,o[1]=r+e,a[1]=n,this}}var ZS=new Float32Array(1);class mc extends Hn{constructor(e){super();if(this._root=e,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1,typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}_bindAction(e,t){let n=e._localRoot||this._root,i=e._clip.tracks,r=i.length,{_propertyBindings:s,_interpolants:o}=e,a=n.uuid,c=this._bindingsByRootAndName,l=c[a];if(l===void 0)l={},c[a]=l;for(let u=0;u!==r;++u){let h=i[u],f=h.name,d=l[f];if(d!==void 0)++d.referenceCount,s[u]=d;else{if(d=s[u],d!==void 0){if(d._cacheIndex===null)++d.referenceCount,this._addInactiveBinding(d,a,f);continue}let m=t&&t._propertyBindings[u].binding.parsedPath;d=new wh(tt.create(n,f,m),h.ValueTypeName,h.getValueSize()),++d.referenceCount,this._addInactiveBinding(d,a,f),s[u]=d}o[u].resultBuffer=d.buffer}}_activateAction(e){if(!this._isActiveAction(e)){if(e._cacheIndex===null){let n=(e._localRoot||this._root).uuid,i=e._clip.uuid,r=this._actionsByClip[i];this._bindAction(e,r&&r.knownActions[0]),this._addInactiveAction(e,i,n)}let t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){let r=t[n];if(r.useCount++===0)this._lendBinding(r),r.saveOriginalState()}this._lendAction(e)}}_deactivateAction(e){if(this._isActiveAction(e)){let t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){let r=t[n];if(--r.useCount===0)r.restoreOriginalState(),this._takeBackBinding(r)}this._takeBackAction(e)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;let e=this;this.stats={actions:{get total(){return e._actions.length},get inUse(){return e._nActiveActions}},bindings:{get total(){return e._bindings.length},get inUse(){return e._nActiveBindings}},controlInterpolants:{get total(){return e._controlInterpolants.length},get inUse(){return e._nActiveControlInterpolants}}}}_isActiveAction(e){let t=e._cacheIndex;return t!==null&&t<this._nActiveActions}_addInactiveAction(e,t,n){let i=this._actions,r=this._actionsByClip,s=r[t];if(s===void 0)s={knownActions:[e],actionByRoot:{}},e._byClipCacheIndex=0,r[t]=s;else{let o=s.knownActions;e._byClipCacheIndex=o.length,o.push(e)}e._cacheIndex=i.length,i.push(e),s.actionByRoot[n]=e}_removeInactiveAction(e){let t=this._actions,n=t[t.length-1],i=e._cacheIndex;n._cacheIndex=i,t[i]=n,t.pop(),e._cacheIndex=null;let r=e._clip.uuid,s=this._actionsByClip,o=s[r],a=o.knownActions,c=a[a.length-1],l=e._byClipCacheIndex;c._byClipCacheIndex=l,a[l]=c,a.pop(),e._byClipCacheIndex=null;let u=o.actionByRoot,h=(e._localRoot||this._root).uuid;if(delete u[h],a.length===0)delete s[r];this._removeInactiveBindingsForAction(e)}_removeInactiveBindingsForAction(e){let t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){let r=t[n];if(--r.referenceCount===0)this._removeInactiveBinding(r)}}_lendAction(e){let t=this._actions,n=e._cacheIndex,i=this._nActiveActions++,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_takeBackAction(e){let t=this._actions,n=e._cacheIndex,i=--this._nActiveActions,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_addInactiveBinding(e,t,n){let i=this._bindingsByRootAndName,r=this._bindings,s=i[t];if(s===void 0)s={},i[t]=s;s[n]=e,e._cacheIndex=r.length,r.push(e)}_removeInactiveBinding(e){let t=this._bindings,n=e.binding,i=n.rootNode.uuid,r=n.path,s=this._bindingsByRootAndName,o=s[i],a=t[t.length-1],c=e._cacheIndex;if(a._cacheIndex=c,t[c]=a,t.pop(),delete o[r],Object.keys(o).length===0)delete s[i]}_lendBinding(e){let t=this._bindings,n=e._cacheIndex,i=this._nActiveBindings++,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_takeBackBinding(e){let t=this._bindings,n=e._cacheIndex,i=--this._nActiveBindings,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_lendControlInterpolant(){let e=this._controlInterpolants,t=this._nActiveControlInterpolants++,n=e[t];if(n===void 0)n=new ac(new Float32Array(2),new Float32Array(2),1,ZS),n.__cacheIndex=t,e[t]=n;return n}_takeBackControlInterpolant(e){let t=this._controlInterpolants,n=e.__cacheIndex,i=--this._nActiveControlInterpolants,r=t[i];e.__cacheIndex=i,t[i]=e,r.__cacheIndex=n,t[n]=r}clipAction(e,t,n){let i=t||this._root,r=i.uuid,s=typeof e==="string"?Qr.findByName(i,e):e,o=s!==null?s.uuid:e,a=this._actionsByClip[o],c=null;if(n===void 0)if(s!==null)n=s.blendMode;else n=2500;if(a!==void 0){let u=a.actionByRoot[r];if(u!==void 0&&u.blendMode===n)return u;if(c=a.knownActions[0],s===null)s=c._clip}if(s===null)return null;let l=new Ah(this,s,t,n);return this._bindAction(l,c),this._addInactiveAction(l,o,r),l}existingAction(e,t){let n=t||this._root,i=n.uuid,r=typeof e==="string"?Qr.findByName(n,e):e,s=r?r.uuid:e,o=this._actionsByClip[s];if(o!==void 0)return o.actionByRoot[i]||null;return null}stopAllAction(){let e=this._actions,t=this._nActiveActions;for(let n=t-1;n>=0;--n)e[n].stop();return this}update(e){e*=this.timeScale;let t=this._actions,n=this._nActiveActions,i=this.time+=e,r=Math.sign(e),s=this._accuIndex^=1;for(let c=0;c!==n;++c)t[c]._update(i,e,r,s);let o=this._bindings,a=this._nActiveBindings;for(let c=0;c!==a;++c)o[c].apply(s);return this}setTime(e){this.time=0;for(let t=0;t<this._actions.length;t++)this._actions[t].time=0;return this.update(e)}getRoot(){return this._root}uncacheClip(e){let t=this._actions,n=e.uuid,i=this._actionsByClip,r=i[n];if(r!==void 0){let s=r.knownActions;for(let o=0,a=s.length;o!==a;++o){let c=s[o];this._deactivateAction(c);let l=c._cacheIndex,u=t[t.length-1];c._cacheIndex=null,c._byClipCacheIndex=null,u._cacheIndex=l,t[l]=u,t.pop(),this._removeInactiveBindingsForAction(c)}delete i[n]}}uncacheRoot(e){let t=e.uuid,n=this._actionsByClip;for(let s in n){let o=n[s].actionByRoot,a=o[t];if(a!==void 0)this._deactivateAction(a),this._removeInactiveAction(a)}let i=this._bindingsByRootAndName,r=i[t];if(r!==void 0)for(let s in r){let o=r[s];o.restoreOriginalState(),this._removeInactiveBinding(o)}}uncacheAction(e,t){let n=this.existingAction(e,t);if(n!==null)this._deactivateAction(n),this._removeInactiveAction(n)}}class _o{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=We(this.phi,0.000001,Math.PI-0.000001),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){if(this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0)this.theta=0,this.phi=0;else this.theta=Math.atan2(e,n),this.phi=Math.acos(We(t/this.radius,-1,1));return this}clone(){return new this.constructor().copy(this)}}class Rh{static{Rh.prototype.isMatrix2=!0}constructor(e,t,n,i){if(this.elements=[1,0,0,1],e!==void 0)this.set(e,t,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,i){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=i,this}}class gc extends Hn{constructor(e,t=null){super();this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){Me("Controls: connect() now requires an element.");return}if(this.domElement!==null)this.disconnect();this.domElement=e}disconnect(){}dispose(){}update(){}}function Ch(e,t,n,i){let r=XS(i);switch(n){case 1021:return e*t;case 1028:return e*t/r.components*r.byteLength;case 1029:return e*t/r.components*r.byteLength;case 1030:return e*t*2/r.components*r.byteLength;case 1031:return e*t*2/r.components*r.byteLength;case 1022:return e*t*3/r.components*r.byteLength;case 1023:return e*t*4/r.components*r.byteLength;case 1033:return e*t*4/r.components*r.byteLength;case 33776:case 33777:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case 33778:case 33779:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case 35841:case 35843:return Math.max(e,16)*Math.max(t,8)/4;case 35840:case 35842:return Math.max(e,8)*Math.max(t,8)/2;case 36196:case 37492:case 37488:case 37489:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case 37496:case 37490:case 37491:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case 37808:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case 37809:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case 37810:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case 37811:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case 37812:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case 37813:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case 37814:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case 37815:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case 37816:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case 37817:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case 37818:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case 37819:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case 37820:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case 37821:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case 36492:case 36494:case 36495:return Math.ceil(e/4)*Math.ceil(t/4)*16;case 36283:case 36284:return Math.ceil(e/4)*Math.ceil(t/4)*8;case 36285:case 36286:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function XS(e){switch(e){case 1009:case 1010:return{byteLength:1,components:1};case 1012:case 1011:case 1016:return{byteLength:2,components:1};case 1017:case 1018:return{byteLength:2,components:4};case 1014:case 1013:case 1015:return{byteLength:4,components:1};case 35902:case 35899:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}if(typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}}));if(typeof window<"u")if(window.__THREE__)Me("WARNING: Multiple instances of Three.js being imported.");else window.__THREE__="185";function hx(){let e=null,t=!1,n=null,i=null;function r(s,o){n(s,o),i=e.requestAnimationFrame(r)}return{start:function(){if(t===!0)return;if(n===null)return;if(e===null)return;i=e.requestAnimationFrame(r),t=!0},stop:function(){if(e!==null)e.cancelAnimationFrame(i);t=!1},setAnimationLoop:function(s){n=s},setContext:function(s){e=s}}}function qS(e){let t=new WeakMap;function n(a,c){let{array:l,usage:u}=a,h=l.byteLength,f=e.createBuffer();e.bindBuffer(c,f),e.bufferData(c,l,u),a.onUploadCallback();let d;if(l instanceof Float32Array)d=e.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)d=e.HALF_FLOAT;else if(l instanceof Uint16Array)if(a.isFloat16BufferAttribute)d=e.HALF_FLOAT;else d=e.UNSIGNED_SHORT;else if(l instanceof Int16Array)d=e.SHORT;else if(l instanceof Uint32Array)d=e.UNSIGNED_INT;else if(l instanceof Int32Array)d=e.INT;else if(l instanceof Int8Array)d=e.BYTE;else if(l instanceof Uint8Array)d=e.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)d=e.UNSIGNED_BYTE;else throw Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:f,type:d,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:h}}function i(a,c,l){let{array:u,updateRanges:h}=c;if(e.bindBuffer(l,a),h.length===0)e.bufferSubData(l,0,u);else{h.sort((d,m)=>d.start-m.start);let f=0;for(let d=1;d<h.length;d++){let m=h[f],x=h[d];if(x.start<=m.start+m.count+1)m.count=Math.max(m.count,x.start+x.count-m.start);else++f,h[f]=x}h.length=f+1;for(let d=0,m=h.length;d<m;d++){let x=h[d];e.bufferSubData(l,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(a){if(a.isInterleavedBufferAttribute)a=a.data;return t.get(a)}function s(a){if(a.isInterleavedBufferAttribute)a=a.data;let c=t.get(a);if(c)e.deleteBuffer(c.buffer),t.delete(a)}function o(a,c){if(a.isInterleavedBufferAttribute)a=a.data;if(a.isGLBufferAttribute){let u=t.get(a);if(!u||u.version<a.version)t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=t.get(a);if(l===void 0)t.set(a,n(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,a,c),l.version=a.version}}return{get:r,remove:s,update:o}}var YS=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,jS=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,JS=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,KS=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,QS=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,eM=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,tM=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,nM=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,iM=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,rM=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,sM=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,oM=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,aM=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,cM=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,lM=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,uM=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,hM=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,fM=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,dM=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,pM=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,mM=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,gM=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,_M=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,xM=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,vM=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,yM=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,bM=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,SM=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,MM=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,wM=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,TM="gl_FragColor = linearToOutputTexel( gl_FragColor );",EM=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,AM=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,RM=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,CM=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,IM=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,PM=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,LM=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,NM=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,DM=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,OM=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,UM=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,FM=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,zM=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,kM=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,BM=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,GM=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,HM=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,VM=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,$M=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,WM=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ZM=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,XM=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,qM=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,YM=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,jM=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,JM=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,KM=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,QM=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ew=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,tw=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,nw=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,iw=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,rw=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,sw=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ow=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,aw=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,cw=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,lw=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,uw=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,hw=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,fw=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,dw=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,pw=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,mw=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,gw=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,_w=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,xw=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,vw=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,yw=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,bw=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Sw=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Mw=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,ww=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Tw=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ew=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Aw=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Rw=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Cw=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Iw=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Pw=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Lw=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Nw=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Dw=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Ow=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Uw=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Fw=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,zw=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,kw=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Bw=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Gw=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Hw=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Vw=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,$w=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Ww=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Zw=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Xw=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,qw=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Yw=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,jw=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Jw=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Kw=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Qw=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,eT=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,tT=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,nT=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,iT=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`;var rT=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,sT=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,oT=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,aT=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,cT=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,lT=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,uT=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hT=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,fT=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,dT=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,pT=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,mT=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,gT=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,_T=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xT=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vT=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,yT=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bT=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ST=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,MT=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,wT=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,TT=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ET=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,AT=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,RT=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,He={alphahash_fragment:YS,alphahash_pars_fragment:jS,alphamap_fragment:JS,alphamap_pars_fragment:KS,alphatest_fragment:QS,alphatest_pars_fragment:eM,aomap_fragment:tM,aomap_pars_fragment:nM,batching_pars_vertex:iM,batching_vertex:rM,begin_vertex:sM,beginnormal_vertex:oM,bsdfs:aM,iridescence_fragment:cM,bumpmap_pars_fragment:lM,clipping_planes_fragment:uM,clipping_planes_pars_fragment:hM,clipping_planes_pars_vertex:fM,clipping_planes_vertex:dM,color_fragment:pM,color_pars_fragment:mM,color_pars_vertex:gM,color_vertex:_M,common:xM,cube_uv_reflection_fragment:vM,defaultnormal_vertex:yM,displacementmap_pars_vertex:bM,displacementmap_vertex:SM,emissivemap_fragment:MM,emissivemap_pars_fragment:wM,colorspace_fragment:TM,colorspace_pars_fragment:EM,envmap_fragment:AM,envmap_common_pars_fragment:RM,envmap_pars_fragment:CM,envmap_pars_vertex:IM,envmap_physical_pars_fragment:GM,envmap_vertex:PM,fog_vertex:LM,fog_pars_vertex:NM,fog_fragment:DM,fog_pars_fragment:OM,gradientmap_pars_fragment:UM,lightmap_pars_fragment:FM,lights_lambert_fragment:zM,lights_lambert_pars_fragment:kM,lights_pars_begin:BM,lights_toon_fragment:HM,lights_toon_pars_fragment:VM,lights_phong_fragment:$M,lights_phong_pars_fragment:WM,lights_physical_fragment:ZM,lights_physical_pars_fragment:XM,lights_fragment_begin:qM,lights_fragment_maps:YM,lights_fragment_end:jM,lightprobes_pars_fragment:JM,logdepthbuf_fragment:KM,logdepthbuf_pars_fragment:QM,logdepthbuf_pars_vertex:ew,logdepthbuf_vertex:tw,map_fragment:nw,map_pars_fragment:iw,map_particle_fragment:rw,map_particle_pars_fragment:sw,metalnessmap_fragment:ow,metalnessmap_pars_fragment:aw,morphinstance_vertex:cw,morphcolor_vertex:lw,morphnormal_vertex:uw,morphtarget_pars_vertex:hw,morphtarget_vertex:fw,normal_fragment_begin:dw,normal_fragment_maps:pw,normal_pars_fragment:mw,normal_pars_vertex:gw,normal_vertex:_w,normalmap_pars_fragment:xw,clearcoat_normal_fragment_begin:vw,clearcoat_normal_fragment_maps:yw,clearcoat_pars_fragment:bw,iridescence_pars_fragment:Sw,opaque_fragment:Mw,packing:ww,premultiplied_alpha_fragment:Tw,project_vertex:Ew,dithering_fragment:Aw,dithering_pars_fragment:Rw,roughnessmap_fragment:Cw,roughnessmap_pars_fragment:Iw,shadowmap_pars_fragment:Pw,shadowmap_pars_vertex:Lw,shadowmap_vertex:Nw,shadowmask_pars_fragment:Dw,skinbase_vertex:Ow,skinning_pars_vertex:Uw,skinning_vertex:Fw,skinnormal_vertex:zw,specularmap_fragment:kw,specularmap_pars_fragment:Bw,tonemapping_fragment:Gw,tonemapping_pars_fragment:Hw,transmission_fragment:Vw,transmission_pars_fragment:$w,uv_pars_fragment:Ww,uv_pars_vertex:Zw,uv_vertex:Xw,worldpos_vertex:qw,background_vert:Yw,background_frag:jw,backgroundCube_vert:Jw,backgroundCube_frag:Kw,cube_vert:Qw,cube_frag:eT,depth_vert:tT,depth_frag:nT,distance_vert:iT,distance_frag:rT,equirect_vert:sT,equirect_frag:oT,linedashed_vert:aT,linedashed_frag:cT,meshbasic_vert:lT,meshbasic_frag:uT,meshlambert_vert:hT,meshlambert_frag:fT,meshmatcap_vert:dT,meshmatcap_frag:pT,meshnormal_vert:mT,meshnormal_frag:gT,meshphong_vert:_T,meshphong_frag:xT,meshphysical_vert:vT,meshphysical_frag:yT,meshtoon_vert:bT,meshtoon_frag:ST,points_vert:MT,points_frag:wT,shadow_vert:TT,shadow_frag:ET,sprite_vert:AT,sprite_frag:RT},he={common:{diffuse:{value:new Le(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Oe},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Oe}},envmap:{envMap:{value:null},envMapRotation:{value:new Oe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:0.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Oe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Oe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Oe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Oe},normalScale:{value:new Ie(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Oe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Oe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Oe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Oe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:0.00025},fogNear:{value:1},fogFar:{value:2000},fogColor:{value:new Le(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new N},probesMax:{value:new N},probesResolution:{value:new N}},points:{diffuse:{value:new Le(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0},uvTransform:{value:new Oe}},sprite:{diffuse:{value:new Le(16777215)},opacity:{value:1},center:{value:new Ie(0.5,0.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Oe},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0}}},ai={basic:{uniforms:Jt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.fog]),vertexShader:He.meshbasic_vert,fragmentShader:He.meshbasic_frag},lambert:{uniforms:Jt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Le(0)},envMapIntensity:{value:1}}]),vertexShader:He.meshlambert_vert,fragmentShader:He.meshlambert_frag},phong:{uniforms:Jt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Le(0)},specular:{value:new Le(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:He.meshphong_vert,fragmentShader:He.meshphong_frag},standard:{uniforms:Jt([he.common,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.roughnessmap,he.metalnessmap,he.fog,he.lights,{emissive:{value:new Le(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag},toon:{uniforms:Jt([he.common,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.gradientmap,he.fog,he.lights,{emissive:{value:new Le(0)}}]),vertexShader:He.meshtoon_vert,fragmentShader:He.meshtoon_frag},matcap:{uniforms:Jt([he.common,he.bumpmap,he.normalmap,he.displacementmap,he.fog,{matcap:{value:null}}]),vertexShader:He.meshmatcap_vert,fragmentShader:He.meshmatcap_frag},points:{uniforms:Jt([he.points,he.fog]),vertexShader:He.points_vert,fragmentShader:He.points_frag},dashed:{uniforms:Jt([he.common,he.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:He.linedashed_vert,fragmentShader:He.linedashed_frag},depth:{uniforms:Jt([he.common,he.displacementmap]),vertexShader:He.depth_vert,fragmentShader:He.depth_frag},normal:{uniforms:Jt([he.common,he.bumpmap,he.normalmap,he.displacementmap,{opacity:{value:1}}]),vertexShader:He.meshnormal_vert,fragmentShader:He.meshnormal_frag},sprite:{uniforms:Jt([he.sprite,he.fog]),vertexShader:He.sprite_vert,fragmentShader:He.sprite_frag},background:{uniforms:{uvTransform:{value:new Oe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:He.background_vert,fragmentShader:He.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Oe}},vertexShader:He.backgroundCube_vert,fragmentShader:He.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:He.cube_vert,fragmentShader:He.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:He.equirect_vert,fragmentShader:He.equirect_frag},distance:{uniforms:Jt([he.common,he.displacementmap,{referencePosition:{value:new N},nearDistance:{value:1},farDistance:{value:1000}}]),vertexShader:He.distance_vert,fragmentShader:He.distance_frag},shadow:{uniforms:Jt([he.lights,he.fog,{color:{value:new Le(0)},opacity:{value:1}}]),vertexShader:He.shadow_vert,fragmentShader:He.shadow_frag}};ai.physical={uniforms:Jt([ai.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Oe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Oe},clearcoatNormalScale:{value:new Ie(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Oe},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Oe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Oe},sheen:{value:0},sheenColor:{value:new Le(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Oe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Oe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Oe},transmissionSamplerSize:{value:new Ie},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Oe},attenuationDistance:{value:0},attenuationColor:{value:new Le(0)},specularColor:{value:new Le(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Oe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Oe},anisotropyVector:{value:new Ie},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Oe}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag};var _c={r:0,b:0,g:0},CT=new ze,fx=new Oe;fx.set(-1,0,0,0,1,0,0,0,1);function IT(e,t,n,i,r,s){let o=new Le(0),a=r===!0?0:1,c,l,u=null,h=0,f=null;function d(A){let E=A.isScene===!0?A.background:null;if(E&&E.isTexture){let y=A.backgroundBlurriness>0;E=t.get(E,y)}return E}function m(A){let E=!1,y=d(A);if(y===null)p(o,a);else if(y&&y.isColor)p(y,1),E=!0;let w=e.xr.getEnvironmentBlendMode();if(w==="additive")n.buffers.color.setClear(0,0,0,1,s);else if(w==="alpha-blend")n.buffers.color.setClear(0,0,0,0,s);if(e.autoClear||E)n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil)}function x(A,E){let y=d(E);if(y&&(y.isCubeTexture||y.mapping===eo)){if(l===void 0)l=new pt(new Yi(1,1,1),new An({name:"BackgroundCubeMaterial",uniforms:Mr(ai.backgroundCube.uniforms),vertexShader:ai.backgroundCube.vertexShader,fragmentShader:ai.backgroundCube.fragmentShader,side:jt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(w,T,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l);if(l.material.uniforms.envMap.value=y,l.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(CT.makeRotationFromEuler(E.backgroundRotation)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1)l.material.uniforms.backgroundRotation.value.premultiply(fx);if(l.material.toneMapped=$e.getTransfer(y.colorSpace)!==ht,u!==y||h!==y.version||f!==e.toneMapping)l.material.needsUpdate=!0,u=y,h=y.version,f=e.toneMapping;l.layers.enableAll(),A.unshift(l,l.geometry,l.material,0,0,null)}else if(y&&y.isTexture){if(c===void 0)c=new pt(new po(2,2),new An({name:"BackgroundMaterial",uniforms:Mr(ai.background.uniforms),vertexShader:ai.background.vertexShader,fragmentShader:ai.background.fragmentShader,side:Vi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c);if(c.material.uniforms.t2D.value=y,c.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,c.material.toneMapped=$e.getTransfer(y.colorSpace)!==ht,y.matrixAutoUpdate===!0)y.updateMatrix();if(c.material.uniforms.uvTransform.value.copy(y.matrix),u!==y||h!==y.version||f!==e.toneMapping)c.material.needsUpdate=!0,u=y,h=y.version,f=e.toneMapping;c.layers.enableAll(),A.unshift(c,c.geometry,c.material,0,0,null)}}function p(A,E){A.getRGB(_c,dh(e)),n.buffers.color.setClear(_c.r,_c.g,_c.b,E,s)}function g(){if(l!==void 0)l.geometry.dispose(),l.material.dispose(),l=void 0;if(c!==void 0)c.geometry.dispose(),c.material.dispose(),c=void 0}return{getClearColor:function(){return o},setClearColor:function(A,E=1){o.set(A),a=E,p(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(A){a=A,p(o,a)},render:m,addToRenderList:x,dispose:g}}function PT(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},r=f(null),s=r,o=!1;function a(C,z,j,F,H){let V=!1,O=h(C,F,j,z);if(s!==O)s=O,l(s.object);if(V=d(C,F,j,H),V)m(C,F,j,H);if(H!==null)t.update(H,e.ELEMENT_ARRAY_BUFFER);if(V||o){if(o=!1,y(C,z,j,F),H!==null)e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(H).buffer)}}function c(){return e.createVertexArray()}function l(C){return e.bindVertexArray(C)}function u(C){return e.deleteVertexArray(C)}function h(C,z,j,F){let H=F.wireframe===!0,V=i[z.id];if(V===void 0)V={},i[z.id]=V;let O=C.isInstancedMesh===!0?C.id:0,K=V[O];if(K===void 0)K={},V[O]=K;let Q=K[j.id];if(Q===void 0)Q={},K[j.id]=Q;let se=Q[H];if(se===void 0)se=f(c()),Q[H]=se;return se}function f(C){let z=[],j=[],F=[];for(let H=0;H<n;H++)z[H]=0,j[H]=0,F[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:z,enabledAttributes:j,attributeDivisors:F,object:C,attributes:{},index:null}}function d(C,z,j,F){let H=s.attributes,V=z.attributes,O=0,K=j.getAttributes();for(let Q in K)if(K[Q].location>=0){let me=H[Q],_e=V[Q];if(_e===void 0){if(Q==="instanceMatrix"&&C.instanceMatrix)_e=C.instanceMatrix;if(Q==="instanceColor"&&C.instanceColor)_e=C.instanceColor}if(me===void 0)return!0;if(me.attribute!==_e)return!0;if(_e&&me.data!==_e.data)return!0;O++}if(s.attributesNum!==O)return!0;if(s.index!==F)return!0;return!1}function m(C,z,j,F){let H={},V=z.attributes,O=0,K=j.getAttributes();for(let Q in K)if(K[Q].location>=0){let me=V[Q];if(me===void 0){if(Q==="instanceMatrix"&&C.instanceMatrix)me=C.instanceMatrix;if(Q==="instanceColor"&&C.instanceColor)me=C.instanceColor}let _e={};if(_e.attribute=me,me&&me.data)_e.data=me.data;H[Q]=_e,O++}s.attributes=H,s.attributesNum=O,s.index=F}function x(){let C=s.newAttributes;for(let z=0,j=C.length;z<j;z++)C[z]=0}function p(C){g(C,0)}function g(C,z){let j=s.newAttributes,F=s.enabledAttributes,H=s.attributeDivisors;if(j[C]=1,F[C]===0)e.enableVertexAttribArray(C),F[C]=1;if(H[C]!==z)e.vertexAttribDivisor(C,z),H[C]=z}function A(){let C=s.newAttributes,z=s.enabledAttributes;for(let j=0,F=z.length;j<F;j++)if(z[j]!==C[j])e.disableVertexAttribArray(j),z[j]=0}function E(C,z,j,F,H,V,O){if(O===!0)e.vertexAttribIPointer(C,z,j,H,V);else e.vertexAttribPointer(C,z,j,F,H,V)}function y(C,z,j,F){x();let H=F.attributes,V=j.getAttributes(),O=z.defaultAttributeValues;for(let K in V){let Q=V[K];if(Q.location>=0){let se=H[K];if(se===void 0){if(K==="instanceMatrix"&&C.instanceMatrix)se=C.instanceMatrix;if(K==="instanceColor"&&C.instanceColor)se=C.instanceColor}if(se!==void 0){let me=se.normalized,_e=se.itemSize,qe=t.get(se);if(qe===void 0)continue;let{buffer:Ge,type:Z,bytesPerElement:ne}=qe,fe=Z===e.INT||Z===e.UNSIGNED_INT||se.gpuType===yu;if(se.isInterleavedBufferAttribute){let de=se.data,Re=de.stride,Ze=se.offset;if(de.isInstancedInterleavedBuffer){for(let Ue=0;Ue<Q.locationSize;Ue++)g(Q.location+Ue,de.meshPerAttribute);if(C.isInstancedMesh!==!0&&F._maxInstanceCount===void 0)F._maxInstanceCount=de.meshPerAttribute*de.count}else for(let Ue=0;Ue<Q.locationSize;Ue++)p(Q.location+Ue);e.bindBuffer(e.ARRAY_BUFFER,Ge);for(let Ue=0;Ue<Q.locationSize;Ue++)E(Q.location+Ue,_e/Q.locationSize,Z,me,Re*ne,(Ze+_e/Q.locationSize*Ue)*ne,fe)}else{if(se.isInstancedBufferAttribute){for(let de=0;de<Q.locationSize;de++)g(Q.location+de,se.meshPerAttribute);if(C.isInstancedMesh!==!0&&F._maxInstanceCount===void 0)F._maxInstanceCount=se.meshPerAttribute*se.count}else for(let de=0;de<Q.locationSize;de++)p(Q.location+de);e.bindBuffer(e.ARRAY_BUFFER,Ge);for(let de=0;de<Q.locationSize;de++)E(Q.location+de,_e/Q.locationSize,Z,me,_e*ne,_e/Q.locationSize*de*ne,fe)}}else if(O!==void 0){let me=O[K];if(me!==void 0)switch(me.length){case 2:e.vertexAttrib2fv(Q.location,me);break;case 3:e.vertexAttrib3fv(Q.location,me);break;case 4:e.vertexAttrib4fv(Q.location,me);break;default:e.vertexAttrib1fv(Q.location,me)}}}}A()}function w(){S();for(let C in i){let z=i[C];for(let j in z){let F=z[j];for(let H in F){let V=F[H];for(let O in V)u(V[O].object),delete V[O];delete F[H]}}delete i[C]}}function T(C){if(i[C.id]===void 0)return;let z=i[C.id];for(let j in z){let F=z[j];for(let H in F){let V=F[H];for(let O in V)u(V[O].object),delete V[O];delete F[H]}}delete i[C.id]}function R(C){for(let z in i){let j=i[z];for(let F in j){let H=j[F];if(H[C.id]===void 0)continue;let V=H[C.id];for(let O in V)u(V[O].object),delete V[O];delete H[C.id]}}}function _(C){for(let z in i){let j=i[z],F=C.isInstancedMesh===!0?C.id:0,H=j[F];if(H===void 0)continue;for(let V in H){let O=H[V];for(let K in O)u(O[K].object),delete O[K];delete H[V]}if(delete j[F],Object.keys(j).length===0)delete i[z]}}function S(){if(U(),o=!0,s===r)return;s=r,l(s.object)}function U(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:S,resetDefaultState:U,dispose:w,releaseStatesOfGeometry:T,releaseStatesOfObject:_,releaseStatesOfProgram:R,initAttributes:x,enableAttribute:p,disableUnusedAttributes:A}}function LT(e,t,n){let i;function r(c){i=c}function s(c,l){e.drawArrays(i,c,l),n.update(l,i,1)}function o(c,l,u){if(u===0)return;e.drawArraysInstanced(i,c,l,u),n.update(l,i,u)}function a(c,l,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,l,0,u);let f=0;for(let d=0;d<u;d++)f+=l[d];n.update(f,i,1)}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a}function NT(e,t,n,i){let r;function s(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===!0){let R=t.get("EXT_texture_filter_anisotropic");r=e.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(R){if(R!==ri&&i.convert(R)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))return!1;return!0}function a(R){let _=R===wi&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));if(R!==Gn&&i.convert(R)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==Mi&&!_)return!1;return!0}function c(R){if(R==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";R="mediump"}if(R==="mediump"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0)return"mediump"}return"lowp"}let l=n.precision!==void 0?n.precision:"highp",u=c(l);if(u!==l)Me("WebGLRenderer:",l,"not supported, using",u,"instead."),l=u;let h=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has("EXT_clip_control");if(n.reversedDepthBuffer===!0&&f===!1)Me("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let d=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=e.getParameter(e.MAX_TEXTURE_SIZE),p=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),g=e.getParameter(e.MAX_VERTEX_ATTRIBS),A=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),E=e.getParameter(e.MAX_VARYING_VECTORS),y=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),w=e.getParameter(e.MAX_SAMPLES),T=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:h,reversedDepthBuffer:f,maxTextures:d,maxVertexTextures:m,maxTextureSize:x,maxCubemapSize:p,maxAttributes:g,maxVertexUniforms:A,maxVaryings:E,maxFragmentUniforms:y,maxSamples:w,samples:T}}function DT(e){let t=this,n=null,i=0,r=!1,s=!1,o=new Un,a=new Oe,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(h,f){let d=h.length!==0||f||i!==0||r;return r=f,i=h.length,d},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(h,f){n=u(h,f,0)},this.setState=function(h,f,d){let{clippingPlanes:m,clipIntersection:x,clipShadows:p}=h,g=e.get(h);if(!r||m===null||m.length===0||s&&!p)if(s)u(null);else l();else{let A=s?0:i,E=A*4,y=g.clippingState||null;c.value=y,y=u(m,f,E,d);for(let w=0;w!==E;++w)y[w]=n[w];g.clippingState=y,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=A}};function l(){if(c.value!==n)c.value=n,c.needsUpdate=i>0;t.numPlanes=i,t.numIntersection=0}function u(h,f,d,m){let x=h!==null?h.length:0,p=null;if(x!==0){if(p=c.value,m!==!0||p===null){let g=d+x*4,A=f.matrixWorldInverse;if(a.getNormalMatrix(A),p===null||p.length<g)p=new Float32Array(g);for(let E=0,y=d;E!==x;++E,y+=4)o.copy(h[E]).applyMatrix4(A,a),o.normal.toArray(p,y),p[y+3]=o.constant}c.value=p,c.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,p}}var tr=4,V0=[0.125,0.215,0.35,0.446,0.526,0.582],Er=20,OT=256,xo=new Tr,$0=new Le,Ih=null,Ph=0,Lh=0,Nh=!1,UT=new N;class So{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=0.1,i=100,r={}){let{size:s=256,position:o=UT}=r;Ih=this._renderer.getRenderTarget(),Ph=this._renderer.getActiveCubeFace(),Lh=this._renderer.getActiveMipmapLevel(),Nh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);let a=this._allocateTargets();if(a.depthBuffer=!0,this._sceneToCubeUV(e,n,i,a,o),t>0)this._blur(a,0,0,t);return this._applyPMREM(a),this._cleanup(a),a}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){if(this._cubemapMaterial===null)this._cubemapMaterial=X0(),this._compileMaterial(this._cubemapMaterial)}compileEquirectangularShader(){if(this._equirectMaterial===null)this._equirectMaterial=Z0(),this._compileMaterial(this._equirectMaterial)}dispose(){if(this._dispose(),this._cubemapMaterial!==null)this._cubemapMaterial.dispose();if(this._equirectMaterial!==null)this._equirectMaterial.dispose();if(this._backgroundBox!==null)this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){if(this._blurMaterial!==null)this._blurMaterial.dispose();if(this._ggxMaterial!==null)this._ggxMaterial.dispose();if(this._pingPongRenderTarget!==null)this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Ih,Ph,Lh),this._renderer.xr.enabled=Nh,e.scissorTest=!1,ms(e,0,0,e.width,e.height)}_fromTexture(e,t){if(e.mapping===ns||e.mapping===_r)this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width);else this._setSize(e.image.width/4);Ih=this._renderer.getRenderTarget(),Ph=this._renderer.getActiveCubeFace(),Lh=this._renderer.getActiveMipmapLevel(),Nh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Ht,minFilter:Ht,generateMipmaps:!1,type:wi,format:ri,colorSpace:pn,depthBuffer:!1},i=W0(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){if(this._pingPongRenderTarget!==null)this._dispose();this._pingPongRenderTarget=W0(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=FT(r)),this._blurMaterial=kT(r,e,t),this._ggxMaterial=zT(r,e,t)}return i}_compileMaterial(e){let t=new pt(new nn,e);this._renderer.compile(t,xo)}_sceneToCubeUV(e,t,n,i,r){let a=new Lt(90,1,t,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],u=this._renderer,{autoClear:h,toneMapping:f}=u;if(u.getClearColor($0),u.toneMapping=kn,u.autoClear=!1,u.state.buffers.depth.getReversed())u.setRenderTarget(i),u.clearDepth(),u.setRenderTarget(null);if(this._backgroundBox===null)this._backgroundBox=new pt(new Yi,new si({name:"PMREM.Background",side:jt,depthWrite:!1,depthTest:!1}));let m=this._backgroundBox,x=m.material,p=!1,g=e.background;if(g){if(g.isColor)x.color.copy(g),e.background=null,p=!0}else x.color.copy($0),p=!0;for(let A=0;A<6;A++){let E=A%3;if(E===0)a.up.set(0,c[A],0),a.position.set(r.x,r.y,r.z),a.lookAt(r.x+l[A],r.y,r.z);else if(E===1)a.up.set(0,0,c[A]),a.position.set(r.x,r.y,r.z),a.lookAt(r.x,r.y+l[A],r.z);else a.up.set(0,c[A],0),a.position.set(r.x,r.y,r.z),a.lookAt(r.x,r.y,r.z+l[A]);let y=this._cubeSize;if(ms(i,E*y,A>2?y:0,y,y),u.setRenderTarget(i),p)u.render(m,a);u.render(e,a)}u.toneMapping=f,u.autoClear=h,e.background=g}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===ns||e.mapping===_r;if(i){if(this._cubemapMaterial===null)this._cubemapMaterial=X0();this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1}else if(this._equirectMaterial===null)this._equirectMaterial=Z0();let r=i?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=r;let o=r.uniforms;o.envMap.value=e;let a=this._cubeSize;ms(t,0,0,3*a,2*a),n.setRenderTarget(t),n.render(s,xo)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let i=this._lodMeshes.length;for(let r=1;r<i;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){let i=this._renderer,r=this._pingPongRenderTarget,s=this._ggxMaterial,o=this._lodMeshes[n];o.material=s;let a=s.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l),h=0+c*1.25,f=u*h,{_lodMax:d}=this,m=this._sizeLods[n],x=3*m*(n>d-tr?n-d+tr:0),p=4*(this._cubeSize-m);a.envMap.value=e.texture,a.roughness.value=f,a.mipInt.value=d-t,ms(r,x,p,3*m,2*m),i.setRenderTarget(r),i.render(o,xo),a.envMap.value=r.texture,a.roughness.value=0,a.mipInt.value=d-n,ms(e,x,p,3*m,2*m),i.setRenderTarget(e),i.render(o,xo)}_blur(e,t,n,i,r){let s=this._pingPongRenderTarget;this._halfBlur(e,s,t,n,i,"latitudinal",r),this._halfBlur(s,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,s,o){let a=this._renderer,c=this._blurMaterial;if(s!=="latitudinal"&&s!=="longitudinal")Ne("blur direction must be either latitudinal or longitudinal!");let l=3,u=this._lodMeshes[i];u.material=c;let h=c.uniforms,f=this._sizeLods[n]-1,d=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*Er-1),m=r/d,x=isFinite(r)?1+Math.floor(l*m):Er;if(x>Er)Me(`sigmaRadians, ${r}, is too large and will clip, as it requested ${x} samples when the maximum is set to ${Er}`);let p=[],g=0;for(let T=0;T<Er;++T){let R=T/m,_=Math.exp(-R*R/2);if(p.push(_),T===0)g+=_;else if(T<x)g+=2*_}for(let T=0;T<p.length;T++)p[T]=p[T]/g;if(h.envMap.value=e.texture,h.samples.value=x,h.weights.value=p,h.latitudinal.value=s==="latitudinal",o)h.poleAxis.value=o;let{_lodMax:A}=this;h.dTheta.value=d,h.mipInt.value=A-n;let E=this._sizeLods[i],y=3*E*(i>A-tr?i-A+tr:0),w=4*(this._cubeSize-E);ms(t,y,w,3*E,2*E),a.setRenderTarget(t),a.render(u,xo)}}function FT(e){let t=[],n=[],i=[],r=e,s=e-tr+1+V0.length;for(let o=0;o<s;o++){let a=Math.pow(2,r);t.push(a);let c=1/a;if(o>e-tr)c=V0[o-e+tr-1];else if(o===0)c=0;n.push(c);let l=1/(a-2),u=-l,h=1+l,f=[u,u,h,u,h,h,u,u,h,h,u,h],d=6,m=6,x=3,p=2,g=1,A=new Float32Array(x*m*d),E=new Float32Array(p*m*d),y=new Float32Array(g*m*d);for(let T=0;T<d;T++){let R=T%3*2/3-1,_=T>2?0:-1,S=[R,_,0,R+0.6666666666666666,_,0,R+0.6666666666666666,_+1,0,R,_,0,R+0.6666666666666666,_+1,0,R,_+1,0];A.set(S,x*m*T),E.set(f,p*m*T);let U=[T,T,T,T,T,T];y.set(U,g*m*T)}let w=new nn;if(w.setAttribute("position",new Nt(A,x)),w.setAttribute("uv",new Nt(E,p)),w.setAttribute("faceIndex",new Nt(y,g)),i.push(new pt(w,null)),r>tr)r--}return{lodMeshes:i,sizeLods:t,sigmas:n}}function W0(e,t,n){let i=new En(e,t,n);return i.texture.mapping=eo,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function ms(e,t,n,i,r){e.viewport.set(t,n,i,r),e.scissor.set(t,n,i,r)}function zT(e,t,n){return new An({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:OT,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:vc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:ni,depthTest:!1,depthWrite:!1})}function kT(e,t,n){let i=new Float32Array(Er),r=new N(0,1,0);return new An({name:"SphericalGaussianBlur",defines:{n:Er,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:vc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:ni,depthTest:!1,depthWrite:!1})}function Z0(){return new An({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:vc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:ni,depthTest:!1,depthWrite:!1})}function X0(){return new An({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:vc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ni,depthTest:!1,depthWrite:!1})}function vc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class zh extends En{constructor(e=1,t={}){super(e,e,t);this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new rc(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new Yi(5,5,5),r=new An({name:"CubemapFromEquirect",uniforms:Mr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:jt,blending:ni});r.uniforms.tEquirect.value=t;let s=new pt(i,r),o=t.minFilter;if(t.minFilter===ii)t.minFilter=Ht;return new Sh(1,10,this).update(e,s),t.minFilter=o,s.geometry.dispose(),s.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){let r=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,n,i);e.setRenderTarget(r)}}function BT(e){let t=new WeakMap,n=new WeakMap,i=null;function r(f,d=!1){if(f===null||f===void 0)return null;if(d)return o(f);return s(f)}function s(f){if(f&&f.isTexture){let d=f.mapping;if(d===za||d===ka)if(t.has(f)){let m=t.get(f).texture;return a(m,f.mapping)}else{let m=f.image;if(m&&m.height>0){let x=new zh(m.height);return x.fromEquirectangularTexture(e,f),t.set(f,x),f.addEventListener("dispose",l),a(x.texture,f.mapping)}else return null}}return f}function o(f){if(f&&f.isTexture){let d=f.mapping,m=d===za||d===ka,x=d===ns||d===_r;if(m||x){let p=n.get(f),g=p!==void 0?p.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==g){if(i===null)i=new So(e);return p=m?i.fromEquirectangular(f,p):i.fromCubemap(f,p),p.texture.pmremVersion=f.pmremVersion,n.set(f,p),p.texture}else if(p!==void 0)return p.texture;else{let A=f.image;if(m&&A&&A.height>0||x&&A&&c(A)){if(i===null)i=new So(e);return p=m?i.fromEquirectangular(f):i.fromCubemap(f),p.texture.pmremVersion=f.pmremVersion,n.set(f,p),f.addEventListener("dispose",u),p.texture}else return null}}}return f}function a(f,d){if(d===za)f.mapping=ns;else if(d===ka)f.mapping=_r;return f}function c(f){let d=0,m=6;for(let x=0;x<m;x++)if(f[x]!==void 0)d++;return d===m}function l(f){let d=f.target;d.removeEventListener("dispose",l);let m=t.get(d);if(m!==void 0)t.delete(d),m.dispose()}function u(f){let d=f.target;d.removeEventListener("dispose",u);let m=n.get(d);if(m!==void 0)n.delete(d),m.dispose()}function h(){if(t=new WeakMap,n=new WeakMap,i!==null)i.dispose(),i=null}return{get:r,dispose:h}}function GT(e){let t={};function n(i){if(t[i]!==void 0)return t[i];let r=e.getExtension(i);return t[i]=r,r}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){let r=n(i);if(r===null)pr("WebGLRenderer: "+i+" extension not supported.");return r}}}function HT(e,t,n,i){let r={},s=new WeakMap;function o(h){let f=h.target;if(f.index!==null)t.remove(f.index);for(let m in f.attributes)t.remove(f.attributes[m]);f.removeEventListener("dispose",o),delete r[f.id];let d=s.get(f);if(d)t.remove(d),s.delete(f);if(i.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0)delete f._maxInstanceCount;n.memory.geometries--}function a(h,f){if(r[f.id]===!0)return f;return f.addEventListener("dispose",o),r[f.id]=!0,n.memory.geometries++,f}function c(h){let f=h.attributes;for(let d in f)t.update(f[d],e.ARRAY_BUFFER)}function l(h){let f=[],d=h.index,m=h.attributes.position,x=0;if(m===void 0)return;if(d!==null){let A=d.array;x=d.version;for(let E=0,y=A.length;E<y;E+=3){let w=A[E+0],T=A[E+1],R=A[E+2];f.push(w,T,T,R,R,w)}}else{let A=m.array;x=m.version;for(let E=0,y=A.length/3-1;E<y;E+=3){let w=E+0,T=E+1,R=E+2;f.push(w,T,T,R,R,w)}}let p=new(m.count>=65535?ec:Qa)(f,1);p.version=x;let g=s.get(h);if(g)t.remove(g);s.set(h,p)}function u(h){let f=s.get(h);if(f){let d=h.index;if(d!==null){if(f.version<d.version)l(h)}}else l(h);return s.get(h)}return{get:a,update:c,getWireframeAttribute:u}}function VT(e,t,n){let i;function r(h){i=h}let s,o;function a(h){s=h.type,o=h.bytesPerElement}function c(h,f){e.drawElements(i,f,s,h*o),n.update(f,i,1)}function l(h,f,d){if(d===0)return;e.drawElementsInstanced(i,f,s,h*o,d),n.update(f,i,d)}function u(h,f,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,s,h,0,d);let x=0;for(let p=0;p<d;p++)x+=f[p];n.update(x,i,1)}this.setMode=r,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function $T(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(n.calls++,o){case e.TRIANGLES:n.triangles+=a*(s/3);break;case e.LINES:n.lines+=a*(s/2);break;case e.LINE_STRIP:n.lines+=a*(s-1);break;case e.LINE_LOOP:n.lines+=a*s;break;case e.POINTS:n.points+=a*s;break;default:Ne("WebGLInfo: Unknown draw mode:",o);break}}function r(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:r,update:i}}function WT(e,t,n){let i=new WeakMap,r=new st;function s(o,a,c){let l=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0,f=i.get(a);if(f===void 0||f.count!==h){let S=function(){R.dispose(),i.delete(a),a.removeEventListener("dispose",S)};if(f!==void 0)f.texture.dispose();let d=a.morphAttributes.position!==void 0,m=a.morphAttributes.normal!==void 0,x=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],g=a.morphAttributes.normal||[],A=a.morphAttributes.color||[],E=0;if(d===!0)E=1;if(m===!0)E=2;if(x===!0)E=3;let y=a.attributes.position.count*E,w=1;if(y>t.maxTextureSize)w=Math.ceil(y/t.maxTextureSize),y=t.maxTextureSize;let T=new Float32Array(y*w*4*h),R=new Ja(T,y,w,h);R.type=Mi,R.needsUpdate=!0;let _=E*4;for(let U=0;U<h;U++){let C=p[U],z=g[U],j=A[U],F=y*w*4*U;for(let H=0;H<C.count;H++){let V=H*_;if(d===!0)r.fromBufferAttribute(C,H),T[F+V+0]=r.x,T[F+V+1]=r.y,T[F+V+2]=r.z,T[F+V+3]=0;if(m===!0)r.fromBufferAttribute(z,H),T[F+V+4]=r.x,T[F+V+5]=r.y,T[F+V+6]=r.z,T[F+V+7]=0;if(x===!0)r.fromBufferAttribute(j,H),T[F+V+8]=r.x,T[F+V+9]=r.y,T[F+V+10]=r.z,T[F+V+11]=j.itemSize===4?r.w:1}}f={count:h,texture:R,size:new Ie(y,w)},i.set(a,f),a.addEventListener("dispose",S)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(e,"morphTexture",o.morphTexture,n);else{let d=0;for(let x=0;x<l.length;x++)d+=l[x];let m=a.morphTargetsRelative?1:1-d;c.getUniforms().setValue(e,"morphTargetBaseInfluence",m),c.getUniforms().setValue(e,"morphTargetInfluences",l)}c.getUniforms().setValue(e,"morphTargetsTexture",f.texture,n),c.getUniforms().setValue(e,"morphTargetsTextureSize",f.size)}return{update:s}}function ZT(e,t,n,i,r){let s=new WeakMap;function o(l){let u=r.render.frame,h=l.geometry,f=t.get(l,h);if(s.get(f)!==u)t.update(f),s.set(f,u);if(l.isInstancedMesh){if(l.hasEventListener("dispose",c)===!1)l.addEventListener("dispose",c);if(s.get(l)!==u){if(n.update(l.instanceMatrix,e.ARRAY_BUFFER),l.instanceColor!==null)n.update(l.instanceColor,e.ARRAY_BUFFER);s.set(l,u)}}if(l.isSkinnedMesh){let d=l.skeleton;if(s.get(d)!==u)d.update(),s.set(d,u)}return f}function a(){s=new WeakMap}function c(l){let u=l.target;if(u.removeEventListener("dispose",c),i.releaseStatesOfObject(u),n.remove(u.instanceMatrix),u.instanceColor!==null)n.remove(u.instanceColor)}return{update:o,dispose:a}}var XT={[pu]:"LINEAR_TONE_MAPPING",[mu]:"REINHARD_TONE_MAPPING",[gu]:"CINEON_TONE_MAPPING",[Qs]:"ACES_FILMIC_TONE_MAPPING",[xu]:"AGX_TONE_MAPPING",[vu]:"NEUTRAL_TONE_MAPPING",[_u]:"CUSTOM_TONE_MAPPING"};function qT(e,t,n,i,r,s){let o=new En(t,n,{type:e,depthBuffer:r,stencilBuffer:s,samples:i?4:0,depthTexture:r?new qi(t,n):void 0}),a=new En(t,n,{type:wi,depthBuffer:!1,stencilBuffer:!1}),c=new nn;c.setAttribute("position",new rn([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new rn([0,2,0,0,2,0],2));let l=new ph({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),u=new pt(c,l),h=new Tr(-1,1,1,-1,0,1),f=null,d=null,m=!1,x,p=null,g=[],A=!1;this.setSize=function(E,y){o.setSize(E,y),a.setSize(E,y);for(let w=0;w<g.length;w++){let T=g[w];if(T.setSize)T.setSize(E,y)}},this.setEffects=function(E){g=E,A=g.length>0&&g[0].isRenderPass===!0;let{width:y,height:w}=o;for(let T=0;T<g.length;T++){let R=g[T];if(R.setSize)R.setSize(y,w)}},this.begin=function(E,y){if(m)return!1;if(E.toneMapping===kn&&g.length===0)return!1;if(p=y,y!==null){let{width:w,height:T}=y;if(o.width!==w||o.height!==T)this.setSize(w,T)}if(A===!1)E.setRenderTarget(o);return x=E.toneMapping,E.toneMapping=kn,!0},this.hasRenderPass=function(){return A},this.end=function(E,y){E.toneMapping=x,m=!0;let w=o,T=a;for(let R=0;R<g.length;R++){let _=g[R];if(_.enabled===!1)continue;if(_.render(E,T,w,y),_.needsSwap!==!1){let S=w;w=T,T=S}}if(f!==E.outputColorSpace||d!==E.toneMapping){if(f=E.outputColorSpace,d=E.toneMapping,l.defines={},$e.getTransfer(f)===ht)l.defines.SRGB_TRANSFER="";let R=XT[d];if(R)l.defines[R]="";l.needsUpdate=!0}l.uniforms.tDiffuse.value=w.texture,E.setRenderTarget(p),E.render(u,h),p=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){if(o.depthTexture)o.depthTexture.dispose();o.dispose(),a.dispose(),c.dispose(),l.dispose()}}var dx=new wt,Uh=new qi(1,1),px=new Ja,mx=new hh,gx=new rc,q0=[],Y0=[],j0=new Float32Array(16),J0=new Float32Array(9),K0=new Float32Array(4);function gs(e,t,n){let i=e[0];if(i<=0||i>0)return e;let r=t*n,s=q0[r];if(s===void 0)s=new Float32Array(r),q0[r]=s;if(t!==0){i.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=n,e[o].toArray(s,a)}return s}function Dt(e,t){if(e.length!==t.length)return!1;for(let n=0,i=e.length;n<i;n++)if(e[n]!==t[n])return!1;return!0}function Ot(e,t){for(let n=0,i=t.length;n<i;n++)e[n]=t[n]}function yc(e,t){let n=Y0[t];if(n===void 0)n=new Int32Array(t),Y0[t]=n;for(let i=0;i!==t;++i)n[i]=e.allocateTextureUnit();return n}function YT(e,t){let n=this.cache;if(n[0]===t)return;e.uniform1f(this.addr,t),n[0]=t}function jT(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y)e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y}else{if(Dt(n,t))return;e.uniform2fv(this.addr,t),Ot(n,t)}}function JT(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z}else if(t.r!==void 0){if(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b}else{if(Dt(n,t))return;e.uniform3fv(this.addr,t),Ot(n,t)}}function KT(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w}else{if(Dt(n,t))return;e.uniform4fv(this.addr,t),Ot(n,t)}}function QT(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(Dt(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Ot(n,t)}else{if(Dt(n,i))return;K0.set(i),e.uniformMatrix2fv(this.addr,!1,K0),Ot(n,i)}}function eE(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(Dt(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Ot(n,t)}else{if(Dt(n,i))return;J0.set(i),e.uniformMatrix3fv(this.addr,!1,J0),Ot(n,i)}}function tE(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(Dt(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Ot(n,t)}else{if(Dt(n,i))return;j0.set(i),e.uniformMatrix4fv(this.addr,!1,j0),Ot(n,i)}}function nE(e,t){let n=this.cache;if(n[0]===t)return;e.uniform1i(this.addr,t),n[0]=t}function iE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y)e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y}else{if(Dt(n,t))return;e.uniform2iv(this.addr,t),Ot(n,t)}}function rE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z}else{if(Dt(n,t))return;e.uniform3iv(this.addr,t),Ot(n,t)}}function sE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w}else{if(Dt(n,t))return;e.uniform4iv(this.addr,t),Ot(n,t)}}function oE(e,t){let n=this.cache;if(n[0]===t)return;e.uniform1ui(this.addr,t),n[0]=t}function aE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y)e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y}else{if(Dt(n,t))return;e.uniform2uiv(this.addr,t),Ot(n,t)}}function cE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z}else{if(Dt(n,t))return;e.uniform3uiv(this.addr,t),Ot(n,t)}}function lE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w}else{if(Dt(n,t))return;e.uniform4uiv(this.addr,t),Ot(n,t)}}function uE(e,t,n){let i=this.cache,r=n.allocateTextureUnit();if(i[0]!==r)e.uniform1i(this.addr,r),i[0]=r;let s;if(this.type===e.SAMPLER_2D_SHADOW)Uh.compareFunction=n.isReversedDepthBuffer()?ja:Ya,s=Uh;else s=dx;n.setTexture2D(t||s,r)}function hE(e,t,n){let i=this.cache,r=n.allocateTextureUnit();if(i[0]!==r)e.uniform1i(this.addr,r),i[0]=r;n.setTexture3D(t||mx,r)}function fE(e,t,n){let i=this.cache,r=n.allocateTextureUnit();if(i[0]!==r)e.uniform1i(this.addr,r),i[0]=r;n.setTextureCube(t||gx,r)}function dE(e,t,n){let i=this.cache,r=n.allocateTextureUnit();if(i[0]!==r)e.uniform1i(this.addr,r),i[0]=r;n.setTexture2DArray(t||px,r)}function pE(e){switch(e){case 5126:return YT;case 35664:return jT;case 35665:return JT;case 35666:return KT;case 35674:return QT;case 35675:return eE;case 35676:return tE;case 5124:case 35670:return nE;case 35667:case 35671:return iE;case 35668:case 35672:return rE;case 35669:case 35673:return sE;case 5125:return oE;case 36294:return aE;case 36295:return cE;case 36296:return lE;case 35678:case 36198:case 36298:case 36306:case 35682:return uE;case 35679:case 36299:case 36307:return hE;case 35680:case 36300:case 36308:case 36293:return fE;case 36289:case 36303:case 36311:case 36292:return dE}}function mE(e,t){e.uniform1fv(this.addr,t)}function gE(e,t){let n=gs(t,this.size,2);e.uniform2fv(this.addr,n)}function _E(e,t){let n=gs(t,this.size,3);e.uniform3fv(this.addr,n)}function xE(e,t){let n=gs(t,this.size,4);e.uniform4fv(this.addr,n)}function vE(e,t){let n=gs(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function yE(e,t){let n=gs(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function bE(e,t){let n=gs(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function SE(e,t){e.uniform1iv(this.addr,t)}function ME(e,t){e.uniform2iv(this.addr,t)}function wE(e,t){e.uniform3iv(this.addr,t)}function TE(e,t){e.uniform4iv(this.addr,t)}function EE(e,t){e.uniform1uiv(this.addr,t)}function AE(e,t){e.uniform2uiv(this.addr,t)}function RE(e,t){e.uniform3uiv(this.addr,t)}function CE(e,t){e.uniform4uiv(this.addr,t)}function IE(e,t,n){let i=this.cache,r=t.length,s=yc(n,r);if(!Dt(i,s))e.uniform1iv(this.addr,s),Ot(i,s);let o;if(this.type===e.SAMPLER_2D_SHADOW)o=Uh;else o=dx;for(let a=0;a!==r;++a)n.setTexture2D(t[a]||o,s[a])}function PE(e,t,n){let i=this.cache,r=t.length,s=yc(n,r);if(!Dt(i,s))e.uniform1iv(this.addr,s),Ot(i,s);for(let o=0;o!==r;++o)n.setTexture3D(t[o]||mx,s[o])}function LE(e,t,n){let i=this.cache,r=t.length,s=yc(n,r);if(!Dt(i,s))e.uniform1iv(this.addr,s),Ot(i,s);for(let o=0;o!==r;++o)n.setTextureCube(t[o]||gx,s[o])}function NE(e,t,n){let i=this.cache,r=t.length,s=yc(n,r);if(!Dt(i,s))e.uniform1iv(this.addr,s),Ot(i,s);for(let o=0;o!==r;++o)n.setTexture2DArray(t[o]||px,s[o])}function DE(e){switch(e){case 5126:return mE;case 35664:return gE;case 35665:return _E;case 35666:return xE;case 35674:return vE;case 35675:return yE;case 35676:return bE;case 5124:case 35670:return SE;case 35667:case 35671:return ME;case 35668:case 35672:return wE;case 35669:case 35673:return TE;case 5125:return EE;case 36294:return AE;case 36295:return RE;case 36296:return CE;case 35678:case 36198:case 36298:case 36306:case 35682:return IE;case 35679:case 36299:case 36307:return PE;case 35680:case 36300:case 36308:case 36293:return LE;case 36289:case 36303:case 36311:case 36292:return NE}}class _x{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=pE(t.type)}}class xx{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=DE(t.type)}}class vx{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let r=0,s=i.length;r!==s;++r){let o=i[r];o.setValue(e,t[o.id],n)}}}var Dh=/(\w+)(\])?(\[|\.)?/g;function Q0(e,t){e.seq.push(t),e.map[t.id]=t}function OE(e,t,n){let i=e.name,r=i.length;Dh.lastIndex=0;while(!0){let s=Dh.exec(i),o=Dh.lastIndex,a=s[1],c=s[2]==="]",l=s[3];if(c)a=a|0;if(l===void 0||l==="["&&o+2===r){Q0(n,l===void 0?new _x(a,e,t):new xx(a,e,t));break}else{let h=n.map[a];if(h===void 0)h=new vx(a),Q0(n,h);n=h}}}class bo{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let o=e.getActiveUniform(t,s),a=e.getUniformLocation(t,o.name);OE(o,a,this)}let i=[],r=[];for(let s of this.seq)if(s.type===e.SAMPLER_2D_SHADOW||s.type===e.SAMPLER_CUBE_SHADOW||s.type===e.SAMPLER_2D_ARRAY_SHADOW)i.push(s);else r.push(s);if(i.length>0)this.seq=i.concat(r)}setValue(e,t,n,i){let r=this.map[t];if(r!==void 0)r.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];if(i!==void 0)this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,s=t.length;r!==s;++r){let o=t[r],a=n[o.id];if(a.needsUpdate!==!1)o.setValue(e,a.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,r=e.length;i!==r;++i){let s=e[i];if(s.id in t)n.push(s)}return n}}function ex(e,t,n){let i=e.createShader(t);return e.shaderSource(i,n),e.compileShader(i),i}var UE=37297,FE=0;function zE(e,t){let n=e.split(`
`),i=[],r=Math.max(t-6,0),s=Math.min(t+6,n.length);for(let o=r;o<s;o++){let a=o+1;i.push(`${a===t?">":" "} ${a}: ${n[o]}`)}return i.join(`
`)}var tx=new Oe;function kE(e){$e._getMatrix(tx,$e.workingColorSpace,e);let t=`mat3( ${tx.elements.map((n)=>n.toFixed(4))} )`;switch($e.getTransfer(e)){case sh:return[t,"LinearTransferOETF"];case ht:return[t,"sRGBTransferOETF"];default:return Me("WebGLProgram: Unsupported color space: ",e),[t,"LinearTransferOETF"]}}function nx(e,t,n){let i=e.getShaderParameter(t,e.COMPILE_STATUS),s=(e.getShaderInfoLog(t)||"").trim();if(i&&s==="")return"";let o=/ERROR: 0:(\d+)/.exec(s);if(o){let a=parseInt(o[1]);return n.toUpperCase()+`

`+s+`

`+zE(e.getShaderSource(t),a)}else return s}function BE(e,t){let n=kE(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,"}"].join(`
`)}var GE={[pu]:"Linear",[mu]:"Reinhard",[gu]:"Cineon",[Qs]:"ACESFilmic",[xu]:"AgX",[vu]:"Neutral",[_u]:"Custom"};function HE(e,t){let n=GE[t];if(n===void 0)return Me("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }";return"vec3 "+e+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}var xc=new N;function VE(){$e.getLuminanceCoefficients(xc);let e=xc.x.toFixed(4),t=xc.y.toFixed(4),n=xc.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${n} );`,"\treturn dot( weights, rgb );","}"].join(`
`)}function $E(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(yo).join(`
`)}function WE(e){let t=[];for(let n in e){let i=e[n];if(i===!1)continue;t.push("#define "+n+" "+i)}return t.join(`
`)}function ZE(e,t){let n={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let s=e.getActiveAttrib(t,r),o=s.name,a=1;if(s.type===e.FLOAT_MAT2)a=2;if(s.type===e.FLOAT_MAT3)a=3;if(s.type===e.FLOAT_MAT4)a=4;n[o]={type:s.type,location:e.getAttribLocation(t,o),locationSize:a}}return n}function yo(e){return e!==""}function ix(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function rx(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var XE=/^[ \t]*#include +<([\w\d./]+)>/gm;function Fh(e){return e.replace(XE,YE)}var qE=new Map;function YE(e,t){let n=He[t];if(n===void 0){let i=qE.get(t);if(i!==void 0)n=He[i],Me('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Fh(n)}var jE=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function sx(e){return e.replace(jE,JE)}function JE(e,t,n,i){let r="";for(let s=parseInt(t);s<parseInt(n);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function ox(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;if(e.precision==="highp")t+=`
#define HIGH_PRECISION`;else if(e.precision==="mediump")t+=`
#define MEDIUM_PRECISION`;else if(e.precision==="lowp")t+=`
#define LOW_PRECISION`;return t}var KE={[Js]:"SHADOWMAP_TYPE_PCF",[es]:"SHADOWMAP_TYPE_VSM"};function QE(e){return KE[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var eA={[ns]:"ENVMAP_TYPE_CUBE",[_r]:"ENVMAP_TYPE_CUBE",[eo]:"ENVMAP_TYPE_CUBE_UV"};function tA(e){if(e.envMap===!1)return"ENVMAP_TYPE_CUBE";return eA[e.envMapMode]||"ENVMAP_TYPE_CUBE"}var nA={[_r]:"ENVMAP_MODE_REFRACTION"};function iA(e){if(e.envMap===!1)return"ENVMAP_MODE_REFLECTION";return nA[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}var rA={[p0]:"ENVMAP_BLENDING_MULTIPLY",[m0]:"ENVMAP_BLENDING_MIX",[g0]:"ENVMAP_BLENDING_ADD"};function sA(e){if(e.envMap===!1)return"ENVMAP_BLENDING_NONE";return rA[e.combine]||"ENVMAP_BLENDING_NONE"}function oA(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,n),112)),texelHeight:i,maxMip:n}}function aA(e,t,n,i){let r=e.getContext(),{defines:s,vertexShader:o,fragmentShader:a}=n,c=QE(n),l=tA(n),u=iA(n),h=sA(n),f=oA(n),d=$E(n),m=WE(s),x=r.createProgram(),p,g,A=n.glslVersion?"#version "+n.glslVersion+`
`:"";if(n.isRawShaderMaterial){if(p=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m].filter(yo).join(`
`),p.length>0)p+=`
`;if(g=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m].filter(yo).join(`
`),g.length>0)g+=`
`}else p=[ox(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+u:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","\tattribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","\tattribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","\tuniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","\tattribute vec2 uv1;","#endif","#ifdef USE_UV2","\tattribute vec2 uv2;","#endif","#ifdef USE_UV3","\tattribute vec2 uv3;","#endif","#ifdef USE_TANGENT","\tattribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","\tattribute vec4 color;","#elif defined( USE_COLOR )","\tattribute vec3 color;","#endif","#ifdef USE_SKINNING","\tattribute vec4 skinIndex;","\tattribute vec4 skinWeight;","#endif",`
`].filter(yo).join(`
`),g=[ox(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+l:"",n.envMap?"#define "+u:"",n.envMap?"#define "+h:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==kn?"#define TONE_MAPPING":"",n.toneMapping!==kn?He.tonemapping_pars_fragment:"",n.toneMapping!==kn?HE("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",He.colorspace_pars_fragment,BE("linearToOutputTexel",n.outputColorSpace),VE(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(yo).join(`
`);if(o=Fh(o),o=ix(o,n),o=rx(o,n),a=Fh(a),a=ix(a,n),a=rx(a,n),o=sx(o),a=sx(a),n.isRawShaderMaterial!==!0)A=`#version 300 es
`,p=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,g=["#define varying in",n.glslVersion===oh?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===oh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g;let E=A+p+o,y=A+g+a,w=ex(r,r.VERTEX_SHADER,E),T=ex(r,r.FRAGMENT_SHADER,y);if(r.attachShader(x,w),r.attachShader(x,T),n.index0AttributeName!==void 0)r.bindAttribLocation(x,0,n.index0AttributeName);else if(n.hasPositionAttribute===!0)r.bindAttribLocation(x,0,"position");r.linkProgram(x);function R(C){if(e.debug.checkShaderErrors){let z=r.getProgramInfoLog(x)||"",j=r.getShaderInfoLog(w)||"",F=r.getShaderInfoLog(T)||"",H=z.trim(),V=j.trim(),O=F.trim(),K=!0,Q=!0;if(r.getProgramParameter(x,r.LINK_STATUS)===!1)if(K=!1,typeof e.debug.onShaderError==="function")e.debug.onShaderError(r,x,w,T);else{let se=nx(r,w,"vertex"),me=nx(r,T,"fragment");Ne("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(x,r.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+H+`
`+se+`
`+me)}else if(H!=="")Me("WebGLProgram: Program Info Log:",H);else if(V===""||O==="")Q=!1;if(Q)C.diagnostics={runnable:K,programLog:H,vertexShader:{log:V,prefix:p},fragmentShader:{log:O,prefix:g}}}r.deleteShader(w),r.deleteShader(T),_=new bo(r,x),S=ZE(r,x)}let _;this.getUniforms=function(){if(_===void 0)R(this);return _};let S;this.getAttributes=function(){if(S===void 0)R(this);return S};let U=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){if(U===!1)U=r.getProgramParameter(x,UE);return U},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(x),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=FE++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=w,this.fragmentShader=T,this}var cA=0;class yx{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let i=this._getShaderCacheForMaterial(e);if(i.has(t)===!1)i.add(t),t.usedTimes++;if(i.has(n)===!1)i.add(n),n.usedTimes++;return this}remove(e){let t=this.materialCache.get(e);for(let n of t)if(n.usedTimes--,n.usedTimes===0)this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);if(n===void 0)n=new Set,t.set(e,n);return n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);if(n===void 0)n=new bx(e),t.set(e,n);return n}}class bx{constructor(e){this.id=cA++,this.code=e,this.usedTimes=0}}function lA(e){return e===br||e===Za||e===Xa}function uA(e,t,n,i,r,s){let o=new Ka,a=new yx,c=new Set,l=[],u=new Map,{logarithmicDepthBuffer:h,precision:f}=i,d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(_){if(c.add(_),_===0)return"uv";return`uv${_}`}function x(_,S,U,C,z,j){let F=C.fog,H=z.geometry,V=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?C.environment:null,O=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,K=t.get(_.envMap||V,O),Q=!!K&&K.mapping===eo?K.image.height:null,se=d[_.type];if(_.precision!==null){if(f=i.getMaxPrecision(_.precision),f!==_.precision)Me("WebGLProgram.getParameters:",_.precision,"not supported, using",f,"instead.")}let me=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,_e=me!==void 0?me.length:0,qe=0;if(H.morphAttributes.position!==void 0)qe=1;if(H.morphAttributes.normal!==void 0)qe=2;if(H.morphAttributes.color!==void 0)qe=3;let Ge,Z,ne,fe;if(se){let Fe=ai[se];Ge=Fe.vertexShader,Z=Fe.fragmentShader}else{Ge=_.vertexShader,Z=_.fragmentShader;let Fe=a.getVertexShaderStage(_),St=a.getFragmentShaderStage(_);a.update(_,Fe,St),ne=Fe.id,fe=St.id}let de=e.getRenderTarget(),Re=e.state.buffers.depth.getReversed(),Ze=z.isInstancedMesh===!0,Ue=z.isBatchedMesh===!0,ke=!!_.map,Ke=!!_.matcap,Ye=!!K,Je=!!_.aoMap,Ft=!!_.lightMap,vn=!!_.bumpMap&&_.wireframe===!1,mt=!!_.normalMap,Vt=!!_.displacementMap,zt=!!_.emissiveMap,Pt=!!_.metalnessMap,L=!!_.roughnessMap,yn=_.anisotropy>0,it=_.clearcoat>0,gt=_.dispersion>0,M=_.iridescence>0,v=_.sheen>0,I=_.transmission>0,W=yn&&!!_.anisotropyMap,te=it&&!!_.clearcoatMap,ie=it&&!!_.clearcoatNormalMap,le=it&&!!_.clearcoatRoughnessMap,X=M&&!!_.iridescenceMap,J=M&&!!_.iridescenceThicknessMap,xe=v&&!!_.sheenColorMap,we=v&&!!_.sheenRoughnessMap,ue=!!_.specularMap,re=!!_.specularColorMap,Ce=!!_.specularIntensityMap,Pe=I&&!!_.transmissionMap,et=I&&!!_.thicknessMap,P=!!_.gradientMap,oe=!!_.alphaMap,Y=_.alphaTest>0,ae=!!_.alphaHash,ve=!!_.extensions,ee=kn;if(_.toneMapped){if(de===null||de.isXRRenderTarget===!0)ee=e.toneMapping}let ce={shaderID:se,shaderType:_.type,shaderName:_.name,vertexShader:Ge,fragmentShader:Z,defines:_.defines,customVertexShaderID:ne,customFragmentShaderID:fe,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:f,batching:Ue,batchingColor:Ue&&z._colorsTexture!==null,instancing:Ze,instancingColor:Ze&&z.instanceColor!==null,instancingMorph:Ze&&z.morphTexture!==null,outputColorSpace:de===null?e.outputColorSpace:de.isXRRenderTarget===!0?de.texture.colorSpace:$e.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:ke,matcap:Ke,envMap:Ye,envMapMode:Ye&&K.mapping,envMapCubeUVHeight:Q,aoMap:Je,lightMap:Ft,bumpMap:vn,normalMap:mt,displacementMap:Vt,emissiveMap:zt,normalMapObjectSpace:mt&&_.normalMapType===w0,normalMapTangentSpace:mt&&_.normalMapType===rh,packedNormalMap:mt&&_.normalMapType===rh&&lA(_.normalMap.format),metalnessMap:Pt,roughnessMap:L,anisotropy:yn,anisotropyMap:W,clearcoat:it,clearcoatMap:te,clearcoatNormalMap:ie,clearcoatRoughnessMap:le,dispersion:gt,iridescence:M,iridescenceMap:X,iridescenceThicknessMap:J,sheen:v,sheenColorMap:xe,sheenRoughnessMap:we,specularMap:ue,specularColorMap:re,specularIntensityMap:Ce,transmission:I,transmissionMap:Pe,thicknessMap:et,gradientMap:P,opaque:_.transparent===!1&&_.blending===Ks&&_.alphaToCoverage===!1,alphaMap:oe,alphaTest:Y,alphaHash:ae,combine:_.combine,mapUv:ke&&m(_.map.channel),aoMapUv:Je&&m(_.aoMap.channel),lightMapUv:Ft&&m(_.lightMap.channel),bumpMapUv:vn&&m(_.bumpMap.channel),normalMapUv:mt&&m(_.normalMap.channel),displacementMapUv:Vt&&m(_.displacementMap.channel),emissiveMapUv:zt&&m(_.emissiveMap.channel),metalnessMapUv:Pt&&m(_.metalnessMap.channel),roughnessMapUv:L&&m(_.roughnessMap.channel),anisotropyMapUv:W&&m(_.anisotropyMap.channel),clearcoatMapUv:te&&m(_.clearcoatMap.channel),clearcoatNormalMapUv:ie&&m(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:le&&m(_.clearcoatRoughnessMap.channel),iridescenceMapUv:X&&m(_.iridescenceMap.channel),iridescenceThicknessMapUv:J&&m(_.iridescenceThicknessMap.channel),sheenColorMapUv:xe&&m(_.sheenColorMap.channel),sheenRoughnessMapUv:we&&m(_.sheenRoughnessMap.channel),specularMapUv:ue&&m(_.specularMap.channel),specularColorMapUv:re&&m(_.specularColorMap.channel),specularIntensityMapUv:Ce&&m(_.specularIntensityMap.channel),transmissionMapUv:Pe&&m(_.transmissionMap.channel),thicknessMapUv:et&&m(_.thicknessMap.channel),alphaMapUv:oe&&m(_.alphaMap.channel),vertexTangents:!!H.attributes.tangent&&(mt||yn),vertexNormals:!!H.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,pointsUvs:z.isPoints===!0&&!!H.attributes.uv&&(ke||oe),fog:!!F,useFog:_.fog===!0,fogExp2:!!F&&F.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||H.attributes.normal===void 0&&mt===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:Re,skinning:z.isSkinnedMesh===!0,hasPositionAttribute:H.attributes.position!==void 0,morphTargets:H.morphAttributes.position!==void 0,morphNormals:H.morphAttributes.normal!==void 0,morphColors:H.morphAttributes.color!==void 0,morphTargetsCount:_e,morphTextureStride:qe,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numLightProbeGrids:j.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:_.dithering,shadowMapEnabled:e.shadowMap.enabled&&U.length>0,shadowMapType:e.shadowMap.type,toneMapping:ee,decodeVideoTexture:ke&&_.map.isVideoTexture===!0&&$e.getTransfer(_.map.colorSpace)===ht,decodeVideoTextureEmissive:zt&&_.emissiveMap.isVideoTexture===!0&&$e.getTransfer(_.emissiveMap.colorSpace)===ht,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Tn,flipSided:_.side===jt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:ve&&_.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ve&&_.extensions.multiDraw===!0||Ue)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return ce.vertexUv1s=c.has(1),ce.vertexUv2s=c.has(2),ce.vertexUv3s=c.has(3),c.clear(),ce}function p(_){let S=[];if(_.shaderID)S.push(_.shaderID);else S.push(_.customVertexShaderID),S.push(_.customFragmentShaderID);if(_.defines!==void 0)for(let U in _.defines)S.push(U),S.push(_.defines[U]);if(_.isRawShaderMaterial===!1)g(S,_),A(S,_),S.push(e.outputColorSpace);return S.push(_.customProgramCacheKey),S.join()}function g(_,S){_.push(S.precision),_.push(S.outputColorSpace),_.push(S.envMapMode),_.push(S.envMapCubeUVHeight),_.push(S.mapUv),_.push(S.alphaMapUv),_.push(S.lightMapUv),_.push(S.aoMapUv),_.push(S.bumpMapUv),_.push(S.normalMapUv),_.push(S.displacementMapUv),_.push(S.emissiveMapUv),_.push(S.metalnessMapUv),_.push(S.roughnessMapUv),_.push(S.anisotropyMapUv),_.push(S.clearcoatMapUv),_.push(S.clearcoatNormalMapUv),_.push(S.clearcoatRoughnessMapUv),_.push(S.iridescenceMapUv),_.push(S.iridescenceThicknessMapUv),_.push(S.sheenColorMapUv),_.push(S.sheenRoughnessMapUv),_.push(S.specularMapUv),_.push(S.specularColorMapUv),_.push(S.specularIntensityMapUv),_.push(S.transmissionMapUv),_.push(S.thicknessMapUv),_.push(S.combine),_.push(S.fogExp2),_.push(S.sizeAttenuation),_.push(S.morphTargetsCount),_.push(S.morphAttributeCount),_.push(S.numDirLights),_.push(S.numPointLights),_.push(S.numSpotLights),_.push(S.numSpotLightMaps),_.push(S.numHemiLights),_.push(S.numRectAreaLights),_.push(S.numDirLightShadows),_.push(S.numPointLightShadows),_.push(S.numSpotLightShadows),_.push(S.numSpotLightShadowsWithMaps),_.push(S.numLightProbes),_.push(S.shadowMapType),_.push(S.toneMapping),_.push(S.numClippingPlanes),_.push(S.numClipIntersection),_.push(S.depthPacking)}function A(_,S){if(o.disableAll(),S.instancing)o.enable(0);if(S.instancingColor)o.enable(1);if(S.instancingMorph)o.enable(2);if(S.matcap)o.enable(3);if(S.envMap)o.enable(4);if(S.normalMapObjectSpace)o.enable(5);if(S.normalMapTangentSpace)o.enable(6);if(S.clearcoat)o.enable(7);if(S.iridescence)o.enable(8);if(S.alphaTest)o.enable(9);if(S.vertexColors)o.enable(10);if(S.vertexAlphas)o.enable(11);if(S.vertexUv1s)o.enable(12);if(S.vertexUv2s)o.enable(13);if(S.vertexUv3s)o.enable(14);if(S.vertexTangents)o.enable(15);if(S.anisotropy)o.enable(16);if(S.alphaHash)o.enable(17);if(S.batching)o.enable(18);if(S.dispersion)o.enable(19);if(S.batchingColor)o.enable(20);if(S.gradientMap)o.enable(21);if(S.packedNormalMap)o.enable(22);if(S.vertexNormals)o.enable(23);if(_.push(o.mask),o.disableAll(),S.fog)o.enable(0);if(S.useFog)o.enable(1);if(S.flatShading)o.enable(2);if(S.logarithmicDepthBuffer)o.enable(3);if(S.reversedDepthBuffer)o.enable(4);if(S.skinning)o.enable(5);if(S.morphTargets)o.enable(6);if(S.morphNormals)o.enable(7);if(S.morphColors)o.enable(8);if(S.premultipliedAlpha)o.enable(9);if(S.shadowMapEnabled)o.enable(10);if(S.doubleSided)o.enable(11);if(S.flipSided)o.enable(12);if(S.useDepthPacking)o.enable(13);if(S.dithering)o.enable(14);if(S.transmission)o.enable(15);if(S.sheen)o.enable(16);if(S.opaque)o.enable(17);if(S.pointsUvs)o.enable(18);if(S.decodeVideoTexture)o.enable(19);if(S.decodeVideoTextureEmissive)o.enable(20);if(S.alphaToCoverage)o.enable(21);if(S.numLightProbeGrids>0)o.enable(22);if(S.hasPositionAttribute)o.enable(23);_.push(o.mask)}function E(_){let S=d[_.type],U;if(S){let C=ai[S];U=U0.clone(C.uniforms)}else U=_.uniforms;return U}function y(_,S){let U=u.get(S);if(U!==void 0)++U.usedTimes;else U=new aA(e,S,_,r),l.push(U),u.set(S,U);return U}function w(_){if(--_.usedTimes===0){let S=l.indexOf(_);l[S]=l[l.length-1],l.pop(),u.delete(_.cacheKey),_.destroy()}}function T(_){a.remove(_)}function R(){a.dispose()}return{getParameters:x,getProgramCacheKey:p,getUniforms:E,acquireProgram:y,releaseProgram:w,releaseShaderCache:T,programs:l,dispose:R}}function hA(){let e=new WeakMap;function t(o){return e.has(o)}function n(o){let a=e.get(o);if(a===void 0)a={},e.set(o,a);return a}function i(o){e.delete(o)}function r(o,a,c){e.get(o)[a]=c}function s(){e=new WeakMap}return{has:t,get:n,remove:i,update:r,dispose:s}}function fA(e,t){if(e.groupOrder!==t.groupOrder)return e.groupOrder-t.groupOrder;else if(e.renderOrder!==t.renderOrder)return e.renderOrder-t.renderOrder;else if(e.material.id!==t.material.id)return e.material.id-t.material.id;else if(e.materialVariant!==t.materialVariant)return e.materialVariant-t.materialVariant;else if(e.z!==t.z)return e.z-t.z;else return e.id-t.id}function ax(e,t){if(e.groupOrder!==t.groupOrder)return e.groupOrder-t.groupOrder;else if(e.renderOrder!==t.renderOrder)return e.renderOrder-t.renderOrder;else if(e.z!==t.z)return t.z-e.z;else return e.id-t.id}function cx(){let e=[],t=0,n=[],i=[],r=[];function s(){t=0,n.length=0,i.length=0,r.length=0}function o(f){let d=0;if(f.isInstancedMesh)d+=2;if(f.isSkinnedMesh)d+=1;return d}function a(f,d,m,x,p,g){let A=e[t];if(A===void 0)A={id:f.id,object:f,geometry:d,material:m,materialVariant:o(f),groupOrder:x,renderOrder:f.renderOrder,z:p,group:g},e[t]=A;else A.id=f.id,A.object=f,A.geometry=d,A.material=m,A.materialVariant=o(f),A.groupOrder=x,A.renderOrder=f.renderOrder,A.z=p,A.group=g;return t++,A}function c(f,d,m,x,p,g){let A=a(f,d,m,x,p,g);if(m.transmission>0)i.push(A);else if(m.transparent===!0)r.push(A);else n.push(A)}function l(f,d,m,x,p,g){let A=a(f,d,m,x,p,g);if(m.transmission>0)i.unshift(A);else if(m.transparent===!0)r.unshift(A);else n.unshift(A)}function u(f,d,m){if(n.length>1)n.sort(f||fA);if(i.length>1)i.sort(d||ax);if(r.length>1)r.sort(d||ax);if(m)n.reverse(),i.reverse(),r.reverse()}function h(){for(let f=t,d=e.length;f<d;f++){let m=e[f];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:n,transmissive:i,transparent:r,init:s,push:c,unshift:l,finish:h,sort:u}}function dA(){let e=new WeakMap;function t(i,r){let s=e.get(i),o;if(s===void 0)o=new cx,e.set(i,[o]);else if(r>=s.length)o=new cx,s.push(o);else o=s[r];return o}function n(){e=new WeakMap}return{get:t,dispose:n}}function pA(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"DirectionalLight":n={direction:new N,color:new Le};break;case"SpotLight":n={position:new N,direction:new N,color:new Le,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new N,color:new Le,distance:0,decay:0};break;case"HemisphereLight":n={direction:new N,skyColor:new Le,groundColor:new Le};break;case"RectAreaLight":n={color:new Le,position:new N,halfWidth:new N,halfHeight:new N};break}return e[t.id]=n,n}}}function mA(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ie};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ie};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ie,shadowCameraNear:1,shadowCameraFar:1000};break}return e[t.id]=n,n}}}var gA=0;function _A(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function xA(e){let t=new pA,n=mA(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new N);let r=new N,s=new ze,o=new ze;function a(l){let u=0,h=0,f=0;for(let S=0;S<9;S++)i.probe[S].set(0,0,0);let d=0,m=0,x=0,p=0,g=0,A=0,E=0,y=0,w=0,T=0,R=0;l.sort(_A);for(let S=0,U=l.length;S<U;S++){let C=l[S],{color:z,intensity:j,distance:F}=C,H=null;if(C.shadow&&C.shadow.map)if(C.shadow.map.texture.format===br)H=C.shadow.map.texture;else H=C.shadow.map.depthTexture||C.shadow.map.texture;if(C.isAmbientLight)u+=z.r*j,h+=z.g*j,f+=z.b*j;else if(C.isLightProbe){for(let V=0;V<9;V++)i.probe[V].addScaledVector(C.sh.coefficients[V],j);R++}else if(C.isDirectionalLight){let V=t.get(C);if(V.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){let O=C.shadow,K=n.get(C);K.shadowIntensity=O.intensity,K.shadowBias=O.bias,K.shadowNormalBias=O.normalBias,K.shadowRadius=O.radius,K.shadowMapSize=O.mapSize,i.directionalShadow[d]=K,i.directionalShadowMap[d]=H,i.directionalShadowMatrix[d]=C.shadow.matrix,A++}i.directional[d]=V,d++}else if(C.isSpotLight){let V=t.get(C);V.position.setFromMatrixPosition(C.matrixWorld),V.color.copy(z).multiplyScalar(j),V.distance=F,V.coneCos=Math.cos(C.angle),V.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),V.decay=C.decay,i.spot[x]=V;let O=C.shadow;if(C.map){if(i.spotLightMap[w]=C.map,w++,O.updateMatrices(C),C.castShadow)T++}if(i.spotLightMatrix[x]=O.matrix,C.castShadow){let K=n.get(C);K.shadowIntensity=O.intensity,K.shadowBias=O.bias,K.shadowNormalBias=O.normalBias,K.shadowRadius=O.radius,K.shadowMapSize=O.mapSize,i.spotShadow[x]=K,i.spotShadowMap[x]=H,y++}x++}else if(C.isRectAreaLight){let V=t.get(C);V.color.copy(z).multiplyScalar(j),V.halfWidth.set(C.width*0.5,0,0),V.halfHeight.set(0,C.height*0.5,0),i.rectArea[p]=V,p++}else if(C.isPointLight){let V=t.get(C);if(V.color.copy(C.color).multiplyScalar(C.intensity),V.distance=C.distance,V.decay=C.decay,C.castShadow){let O=C.shadow,K=n.get(C);K.shadowIntensity=O.intensity,K.shadowBias=O.bias,K.shadowNormalBias=O.normalBias,K.shadowRadius=O.radius,K.shadowMapSize=O.mapSize,K.shadowCameraNear=O.camera.near,K.shadowCameraFar=O.camera.far,i.pointShadow[m]=K,i.pointShadowMap[m]=H,i.pointShadowMatrix[m]=C.shadow.matrix,E++}i.point[m]=V,m++}else if(C.isHemisphereLight){let V=t.get(C);V.skyColor.copy(C.color).multiplyScalar(j),V.groundColor.copy(C.groundColor).multiplyScalar(j),i.hemi[g]=V,g++}}if(p>0)if(e.has("OES_texture_float_linear")===!0)i.rectAreaLTC1=he.LTC_FLOAT_1,i.rectAreaLTC2=he.LTC_FLOAT_2;else i.rectAreaLTC1=he.LTC_HALF_1,i.rectAreaLTC2=he.LTC_HALF_2;i.ambient[0]=u,i.ambient[1]=h,i.ambient[2]=f;let _=i.hash;if(_.directionalLength!==d||_.pointLength!==m||_.spotLength!==x||_.rectAreaLength!==p||_.hemiLength!==g||_.numDirectionalShadows!==A||_.numPointShadows!==E||_.numSpotShadows!==y||_.numSpotMaps!==w||_.numLightProbes!==R)i.directional.length=d,i.spot.length=x,i.rectArea.length=p,i.point.length=m,i.hemi.length=g,i.directionalShadow.length=A,i.directionalShadowMap.length=A,i.pointShadow.length=E,i.pointShadowMap.length=E,i.spotShadow.length=y,i.spotShadowMap.length=y,i.directionalShadowMatrix.length=A,i.pointShadowMatrix.length=E,i.spotLightMatrix.length=y+w-T,i.spotLightMap.length=w,i.numSpotLightShadowsWithMaps=T,i.numLightProbes=R,_.directionalLength=d,_.pointLength=m,_.spotLength=x,_.rectAreaLength=p,_.hemiLength=g,_.numDirectionalShadows=A,_.numPointShadows=E,_.numSpotShadows=y,_.numSpotMaps=w,_.numLightProbes=R,i.version=gA++}function c(l,u){let h=0,f=0,d=0,m=0,x=0,p=u.matrixWorldInverse;for(let g=0,A=l.length;g<A;g++){let E=l[g];if(E.isDirectionalLight){let y=i.directional[h];y.direction.setFromMatrixPosition(E.matrixWorld),r.setFromMatrixPosition(E.target.matrixWorld),y.direction.sub(r),y.direction.transformDirection(p),h++}else if(E.isSpotLight){let y=i.spot[d];y.position.setFromMatrixPosition(E.matrixWorld),y.position.applyMatrix4(p),y.direction.setFromMatrixPosition(E.matrixWorld),r.setFromMatrixPosition(E.target.matrixWorld),y.direction.sub(r),y.direction.transformDirection(p),d++}else if(E.isRectAreaLight){let y=i.rectArea[m];y.position.setFromMatrixPosition(E.matrixWorld),y.position.applyMatrix4(p),o.identity(),s.copy(E.matrixWorld),s.premultiply(p),o.extractRotation(s),y.halfWidth.set(E.width*0.5,0,0),y.halfHeight.set(0,E.height*0.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),m++}else if(E.isPointLight){let y=i.point[f];y.position.setFromMatrixPosition(E.matrixWorld),y.position.applyMatrix4(p),f++}else if(E.isHemisphereLight){let y=i.hemi[x];y.direction.setFromMatrixPosition(E.matrixWorld),y.direction.transformDirection(p),x++}}}return{setup:a,setupView:c,state:i}}function lx(e){let t=new xA(e),n=[],i=[],r=[];function s(f){h.camera=f,n.length=0,i.length=0,r.length=0}function o(f){n.push(f)}function a(f){i.push(f)}function c(f){r.push(f)}function l(){t.setup(n)}function u(f){t.setupView(n,f)}let h={lightsArray:n,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:h,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:a,pushLightProbeGrid:c}}function vA(e){let t=new WeakMap;function n(r,s=0){let o=t.get(r),a;if(o===void 0)a=new lx(e),t.set(r,[a]);else if(s>=o.length)a=new lx(e),o.push(a);else a=o[s];return a}function i(){t=new WeakMap}return{get:n,dispose:i}}var yA=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,bA=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,SA=[new N(1,0,0),new N(-1,0,0),new N(0,1,0),new N(0,-1,0),new N(0,0,1),new N(0,0,-1)],MA=[new N(0,-1,0),new N(0,-1,0),new N(0,0,1),new N(0,0,-1),new N(0,-1,0),new N(0,-1,0)],ux=new ze,vo=new N,Oh=new N;function wA(e,t,n){let i=new uo,r=new Ie,s=new Ie,o=new st,a=new mh,c=new gh,l={},u=n.maxTextureSize,h={[Vi]:jt,[jt]:Vi,[Tn]:Tn},f=new An({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ie},radius:{value:4}},vertexShader:yA,fragmentShader:bA}),d=f.clone();d.defines.HORIZONTAL_PASS=1;let m=new nn;m.setAttribute("position",new Nt(new Float32Array([-1,-1,0.5,3,-1,0.5,-1,3,0.5]),3));let x=new pt(m,f),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Js;let g=this.type;this.render=function(T,R,_){if(p.enabled===!1)return;if(p.autoUpdate===!1&&p.needsUpdate===!1)return;if(T.length===0)return;if(this.type===B_)Me("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=Js;let S=e.getRenderTarget(),U=e.getActiveCubeFace(),C=e.getActiveMipmapLevel(),z=e.state;if(z.setBlending(ni),z.buffers.depth.getReversed()===!0)z.buffers.color.setClear(0,0,0,0);else z.buffers.color.setClear(1,1,1,1);z.buffers.depth.setTest(!0),z.setScissorTest(!1);let j=g!==this.type;if(j)R.traverse(function(F){if(F.material)if(Array.isArray(F.material))F.material.forEach((H)=>H.needsUpdate=!0);else F.material.needsUpdate=!0});for(let F=0,H=T.length;F<H;F++){let V=T[F],O=V.shadow;if(O===void 0){Me("WebGLShadowMap:",V,"has no shadow.");continue}if(O.autoUpdate===!1&&O.needsUpdate===!1)continue;r.copy(O.mapSize);let K=O.getFrameExtents();if(r.multiply(K),s.copy(O.mapSize),r.x>u||r.y>u){if(r.x>u)s.x=Math.floor(u/K.x),r.x=s.x*K.x,O.mapSize.x=s.x;if(r.y>u)s.y=Math.floor(u/K.y),r.y=s.y*K.y,O.mapSize.y=s.y}let Q=e.state.buffers.depth.getReversed();if(O.camera._reversedDepth=Q,O.map===null||j===!0){if(O.map!==null){if(O.map.depthTexture!==null)O.map.depthTexture.dispose(),O.map.depthTexture=null;O.map.dispose()}if(this.type===es){if(V.isPointLight){Me("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}O.map=new En(r.x,r.y,{format:br,type:wi,minFilter:Ht,magFilter:Ht,generateMipmaps:!1}),O.map.texture.name=V.name+".shadowMap",O.map.depthTexture=new qi(r.x,r.y,Mi),O.map.depthTexture.name=V.name+".shadowMapDepth",O.map.depthTexture.format=vr,O.map.depthTexture.compareFunction=null,O.map.depthTexture.minFilter=Bn,O.map.depthTexture.magFilter=Bn}else{if(V.isPointLight)O.map=new zh(r.x),O.map.depthTexture=new fh(r.x,$i);else O.map=new En(r.x,r.y),O.map.depthTexture=new qi(r.x,r.y,$i);if(O.map.depthTexture.name=V.name+".shadowMap",O.map.depthTexture.format=vr,this.type===Js)O.map.depthTexture.compareFunction=Q?ja:Ya,O.map.depthTexture.minFilter=Ht,O.map.depthTexture.magFilter=Ht;else O.map.depthTexture.compareFunction=null,O.map.depthTexture.minFilter=Bn,O.map.depthTexture.magFilter=Bn}O.camera.updateProjectionMatrix()}let se=O.map.isWebGLCubeRenderTarget?6:1;for(let me=0;me<se;me++){if(O.map.isWebGLCubeRenderTarget)e.setRenderTarget(O.map,me),e.clear();else{if(me===0)e.setRenderTarget(O.map),e.clear();let _e=O.getViewport(me);o.set(s.x*_e.x,s.y*_e.y,s.x*_e.z,s.y*_e.w),z.viewport(o)}if(V.isPointLight){let{camera:_e,matrix:qe}=O,Ge=V.distance||_e.far;if(Ge!==_e.far)_e.far=Ge,_e.updateProjectionMatrix();vo.setFromMatrixPosition(V.matrixWorld),_e.position.copy(vo),Oh.copy(_e.position),Oh.add(SA[me]),_e.up.copy(MA[me]),_e.lookAt(Oh),_e.updateMatrixWorld(),qe.makeTranslation(-vo.x,-vo.y,-vo.z),ux.multiplyMatrices(_e.projectionMatrix,_e.matrixWorldInverse),O._frustum.setFromProjectionMatrix(ux,_e.coordinateSystem,_e.reversedDepth)}else O.updateMatrices(V);i=O.getFrustum(),y(R,_,O.camera,V,this.type)}if(O.isPointLightShadow!==!0&&this.type===es)A(O,_);O.needsUpdate=!1}g=this.type,p.needsUpdate=!1,e.setRenderTarget(S,U,C)};function A(T,R){let _=t.update(x);if(f.defines.VSM_SAMPLES!==T.blurSamples)f.defines.VSM_SAMPLES=T.blurSamples,d.defines.VSM_SAMPLES=T.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0;if(T.mapPass===null)T.mapPass=new En(r.x,r.y,{format:br,type:wi});f.uniforms.shadow_pass.value=T.map.depthTexture,f.uniforms.resolution.value=T.mapSize,f.uniforms.radius.value=T.radius,e.setRenderTarget(T.mapPass),e.clear(),e.renderBufferDirect(R,null,_,f,x,null),d.uniforms.shadow_pass.value=T.mapPass.texture,d.uniforms.resolution.value=T.mapSize,d.uniforms.radius.value=T.radius,e.setRenderTarget(T.map),e.clear(),e.renderBufferDirect(R,null,_,d,x,null)}function E(T,R,_,S){let U=null,C=_.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(C!==void 0)U=C;else if(U=_.isPointLight===!0?c:a,e.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){let z=U.uuid,j=R.uuid,F=l[z];if(F===void 0)F={},l[z]=F;let H=F[j];if(H===void 0)H=U.clone(),F[j]=H,R.addEventListener("dispose",w);U=H}if(U.visible=R.visible,U.wireframe=R.wireframe,S===es)U.side=R.shadowSide!==null?R.shadowSide:R.side;else U.side=R.shadowSide!==null?R.shadowSide:h[R.side];if(U.alphaMap=R.alphaMap,U.alphaTest=R.alphaToCoverage===!0?0.5:R.alphaTest,U.map=R.map,U.clipShadows=R.clipShadows,U.clippingPlanes=R.clippingPlanes,U.clipIntersection=R.clipIntersection,U.displacementMap=R.displacementMap,U.displacementScale=R.displacementScale,U.displacementBias=R.displacementBias,U.wireframeLinewidth=R.wireframeLinewidth,U.linewidth=R.linewidth,_.isPointLight===!0&&U.isMeshDistanceMaterial===!0){let z=e.properties.get(U);z.light=_}return U}function y(T,R,_,S,U){if(T.visible===!1)return;if(T.layers.test(R.layers)&&(T.isMesh||T.isLine||T.isPoints)){if((T.castShadow||T.receiveShadow&&U===es)&&(!T.frustumCulled||i.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,T.matrixWorld);let j=t.update(T),F=T.material;if(Array.isArray(F)){let H=j.groups;for(let V=0,O=H.length;V<O;V++){let K=H[V],Q=F[K.materialIndex];if(Q&&Q.visible){let se=E(T,Q,S,U);T.onBeforeShadow(e,T,R,_,j,se,K),e.renderBufferDirect(_,null,j,se,T,K),T.onAfterShadow(e,T,R,_,j,se,K)}}}else if(F.visible){let H=E(T,F,S,U);T.onBeforeShadow(e,T,R,_,j,H,null),e.renderBufferDirect(_,null,j,H,T,null),T.onAfterShadow(e,T,R,_,j,H,null)}}}let z=T.children;for(let j=0,F=z.length;j<F;j++)y(z[j],R,_,S,U)}function w(T){T.target.removeEventListener("dispose",w);for(let _ in l){let S=l[_],U=T.target.uuid;if(U in S)S[U].dispose(),delete S[U]}}}function TA(e,t){function n(){let P=!1,oe=new st,Y=null,ae=new st(0,0,0,0);return{setMask:function(ve){if(Y!==ve&&!P)e.colorMask(ve,ve,ve,ve),Y=ve},setLocked:function(ve){P=ve},setClear:function(ve,ee,ce,Fe,St){if(St===!0)ve*=Fe,ee*=Fe,ce*=Fe;if(oe.set(ve,ee,ce,Fe),ae.equals(oe)===!1)e.clearColor(ve,ee,ce,Fe),ae.copy(oe)},reset:function(){P=!1,Y=null,ae.set(-1,0,0,0)}}}function i(){let P=!1,oe=!1,Y=null,ae=null,ve=null;return{setReversed:function(ee){if(oe!==ee){let ce=t.get("EXT_clip_control");if(ee)ce.clipControlEXT(ce.LOWER_LEFT_EXT,ce.ZERO_TO_ONE_EXT);else ce.clipControlEXT(ce.LOWER_LEFT_EXT,ce.NEGATIVE_ONE_TO_ONE_EXT);oe=ee;let Fe=ve;ve=null,this.setClear(Fe)}},getReversed:function(){return oe},setTest:function(ee){if(ee)de(e.DEPTH_TEST);else Re(e.DEPTH_TEST)},setMask:function(ee){if(Y!==ee&&!P)e.depthMask(ee),Y=ee},setFunc:function(ee){if(oe)ee=D0[ee];if(ae!==ee){switch(ee){case a0:e.depthFunc(e.NEVER);break;case c0:e.depthFunc(e.ALWAYS);break;case l0:e.depthFunc(e.LESS);break;case du:e.depthFunc(e.LEQUAL);break;case u0:e.depthFunc(e.EQUAL);break;case h0:e.depthFunc(e.GEQUAL);break;case f0:e.depthFunc(e.GREATER);break;case d0:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}ae=ee}},setLocked:function(ee){P=ee},setClear:function(ee){if(ve!==ee){if(ve=ee,oe)ee=1-ee;e.clearDepth(ee)}},reset:function(){P=!1,Y=null,ae=null,ve=null,oe=!1}}}function r(){let P=!1,oe=null,Y=null,ae=null,ve=null,ee=null,ce=null,Fe=null,St=null;return{setTest:function(ft){if(!P)if(ft)de(e.STENCIL_TEST);else Re(e.STENCIL_TEST)},setMask:function(ft){if(oe!==ft&&!P)e.stencilMask(ft),oe=ft},setFunc:function(ft,Vn,li){if(Y!==ft||ae!==Vn||ve!==li)e.stencilFunc(ft,Vn,li),Y=ft,ae=Vn,ve=li},setOp:function(ft,Vn,li){if(ee!==ft||ce!==Vn||Fe!==li)e.stencilOp(ft,Vn,li),ee=ft,ce=Vn,Fe=li},setLocked:function(ft){P=ft},setClear:function(ft){if(St!==ft)e.clearStencil(ft),St=ft},reset:function(){P=!1,oe=null,Y=null,ae=null,ve=null,ee=null,ce=null,Fe=null,St=null}}}let s=new n,o=new i,a=new r,c=new WeakMap,l=new WeakMap,u={},h={},f={},d=new WeakMap,m=[],x=null,p=!1,g=null,A=null,E=null,y=null,w=null,T=null,R=null,_=new Le(0,0,0),S=0,U=!1,C=null,z=null,j=null,F=null,H=null,V=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),O=!1,K=0,Q=e.getParameter(e.VERSION);if(Q.indexOf("WebGL")!==-1)K=parseFloat(/^WebGL (\d)/.exec(Q)[1]),O=K>=1;else if(Q.indexOf("OpenGL ES")!==-1)K=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),O=K>=2;let se=null,me={},_e=e.getParameter(e.SCISSOR_BOX),qe=e.getParameter(e.VIEWPORT),Ge=new st().fromArray(_e),Z=new st().fromArray(qe);function ne(P,oe,Y,ae){let ve=new Uint8Array(4),ee=e.createTexture();e.bindTexture(P,ee),e.texParameteri(P,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(P,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let ce=0;ce<Y;ce++)if(P===e.TEXTURE_3D||P===e.TEXTURE_2D_ARRAY)e.texImage3D(oe,0,e.RGBA,1,1,ae,0,e.RGBA,e.UNSIGNED_BYTE,ve);else e.texImage2D(oe+ce,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,ve);return ee}let fe={};fe[e.TEXTURE_2D]=ne(e.TEXTURE_2D,e.TEXTURE_2D,1),fe[e.TEXTURE_CUBE_MAP]=ne(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),fe[e.TEXTURE_2D_ARRAY]=ne(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),fe[e.TEXTURE_3D]=ne(e.TEXTURE_3D,e.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),de(e.DEPTH_TEST),o.setFunc(du),vn(!1),mt(lu),de(e.CULL_FACE),Je(ni);function de(P){if(u[P]!==!0)e.enable(P),u[P]=!0}function Re(P){if(u[P]!==!1)e.disable(P),u[P]=!1}function Ze(P,oe){if(f[P]!==oe){if(e.bindFramebuffer(P,oe),f[P]=oe,P===e.DRAW_FRAMEBUFFER)f[e.FRAMEBUFFER]=oe;if(P===e.FRAMEBUFFER)f[e.DRAW_FRAMEBUFFER]=oe;return!0}return!1}function Ue(P,oe){let Y=m,ae=!1;if(P){if(Y=d.get(oe),Y===void 0)Y=[],d.set(oe,Y);let ve=P.textures;if(Y.length!==ve.length||Y[0]!==e.COLOR_ATTACHMENT0){for(let ee=0,ce=ve.length;ee<ce;ee++)Y[ee]=e.COLOR_ATTACHMENT0+ee;Y.length=ve.length,ae=!0}}else if(Y[0]!==e.BACK)Y[0]=e.BACK,ae=!0;if(ae)e.drawBuffers(Y)}function ke(P){if(x!==P)return e.useProgram(P),x=P,!0;return!1}let Ke={[ts]:e.FUNC_ADD,[H_]:e.FUNC_SUBTRACT,[V_]:e.FUNC_REVERSE_SUBTRACT};Ke[$_]=e.MIN,Ke[W_]=e.MAX;let Ye={[Z_]:e.ZERO,[X_]:e.ONE,[q_]:e.SRC_COLOR,[j_]:e.SRC_ALPHA,[n0]:e.SRC_ALPHA_SATURATE,[e0]:e.DST_COLOR,[K_]:e.DST_ALPHA,[Y_]:e.ONE_MINUS_SRC_COLOR,[J_]:e.ONE_MINUS_SRC_ALPHA,[t0]:e.ONE_MINUS_DST_COLOR,[Q_]:e.ONE_MINUS_DST_ALPHA,[i0]:e.CONSTANT_COLOR,[r0]:e.ONE_MINUS_CONSTANT_COLOR,[s0]:e.CONSTANT_ALPHA,[o0]:e.ONE_MINUS_CONSTANT_ALPHA};function Je(P,oe,Y,ae,ve,ee,ce,Fe,St,ft){if(P===ni){if(p===!0)Re(e.BLEND),p=!1;return}if(p===!1)de(e.BLEND),p=!0;if(P!==G_){if(P!==g||ft!==U){if(A!==ts||w!==ts)e.blendEquation(e.FUNC_ADD),A=ts,w=ts;if(ft)switch(P){case Ks:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case uu:e.blendFunc(e.ONE,e.ONE);break;case hu:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case fu:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:Ne("WebGLState: Invalid blending: ",P);break}else switch(P){case Ks:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case uu:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case hu:Ne("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case fu:Ne("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ne("WebGLState: Invalid blending: ",P);break}E=null,y=null,T=null,R=null,_.set(0,0,0),S=0,g=P,U=ft}return}if(ve=ve||oe,ee=ee||Y,ce=ce||ae,oe!==A||ve!==w)e.blendEquationSeparate(Ke[oe],Ke[ve]),A=oe,w=ve;if(Y!==E||ae!==y||ee!==T||ce!==R)e.blendFuncSeparate(Ye[Y],Ye[ae],Ye[ee],Ye[ce]),E=Y,y=ae,T=ee,R=ce;if(Fe.equals(_)===!1||St!==S)e.blendColor(Fe.r,Fe.g,Fe.b,St),_.copy(Fe),S=St;g=P,U=!1}function Ft(P,oe){P.side===Tn?Re(e.CULL_FACE):de(e.CULL_FACE);let Y=P.side===jt;if(oe)Y=!Y;vn(Y),P.blending===Ks&&P.transparent===!1?Je(ni):Je(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),o.setFunc(P.depthFunc),o.setTest(P.depthTest),o.setMask(P.depthWrite),s.setMask(P.colorWrite);let ae=P.stencilWrite;if(a.setTest(ae),ae)a.setMask(P.stencilWriteMask),a.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),a.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass);zt(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?de(e.SAMPLE_ALPHA_TO_COVERAGE):Re(e.SAMPLE_ALPHA_TO_COVERAGE)}function vn(P){if(C!==P){if(P)e.frontFace(e.CW);else e.frontFace(e.CCW);C=P}}function mt(P){if(P!==z_){if(de(e.CULL_FACE),P!==z)if(P===lu)e.cullFace(e.BACK);else if(P===k_)e.cullFace(e.FRONT);else e.cullFace(e.FRONT_AND_BACK)}else Re(e.CULL_FACE);z=P}function Vt(P){if(P!==j){if(O)e.lineWidth(P);j=P}}function zt(P,oe,Y){if(P){if(de(e.POLYGON_OFFSET_FILL),F!==oe||H!==Y){if(F=oe,H=Y,o.getReversed())oe=-oe;e.polygonOffset(oe,Y)}}else Re(e.POLYGON_OFFSET_FILL)}function Pt(P){if(P)de(e.SCISSOR_TEST);else Re(e.SCISSOR_TEST)}function L(P){if(P===void 0)P=e.TEXTURE0+V-1;if(se!==P)e.activeTexture(P),se=P}function yn(P,oe,Y){if(Y===void 0)if(se===null)Y=e.TEXTURE0+V-1;else Y=se;let ae=me[Y];if(ae===void 0)ae={type:void 0,texture:void 0},me[Y]=ae;if(ae.type!==P||ae.texture!==oe){if(se!==Y)e.activeTexture(Y),se=Y;e.bindTexture(P,oe||fe[P]),ae.type=P,ae.texture=oe}}function it(){let P=me[se];if(P!==void 0&&P.type!==void 0)e.bindTexture(P.type,null),P.type=void 0,P.texture=void 0}function gt(){try{e.compressedTexImage2D(...arguments)}catch(P){Ne("WebGLState:",P)}}function M(){try{e.compressedTexImage3D(...arguments)}catch(P){Ne("WebGLState:",P)}}function v(){try{e.texSubImage2D(...arguments)}catch(P){Ne("WebGLState:",P)}}function I(){try{e.texSubImage3D(...arguments)}catch(P){Ne("WebGLState:",P)}}function W(){try{e.compressedTexSubImage2D(...arguments)}catch(P){Ne("WebGLState:",P)}}function te(){try{e.compressedTexSubImage3D(...arguments)}catch(P){Ne("WebGLState:",P)}}function ie(){try{e.texStorage2D(...arguments)}catch(P){Ne("WebGLState:",P)}}function le(){try{e.texStorage3D(...arguments)}catch(P){Ne("WebGLState:",P)}}function X(){try{e.texImage2D(...arguments)}catch(P){Ne("WebGLState:",P)}}function J(){try{e.texImage3D(...arguments)}catch(P){Ne("WebGLState:",P)}}function xe(P){if(h[P]!==void 0)return h[P];else return e.getParameter(P)}function we(P,oe){if(h[P]!==oe)e.pixelStorei(P,oe),h[P]=oe}function ue(P){if(Ge.equals(P)===!1)e.scissor(P.x,P.y,P.z,P.w),Ge.copy(P)}function re(P){if(Z.equals(P)===!1)e.viewport(P.x,P.y,P.z,P.w),Z.copy(P)}function Ce(P,oe){let Y=l.get(oe);if(Y===void 0)Y=new WeakMap,l.set(oe,Y);let ae=Y.get(P);if(ae===void 0)ae=e.getUniformBlockIndex(oe,P.name),Y.set(P,ae)}function Pe(P,oe){let ae=l.get(oe).get(P);if(c.get(oe)!==ae)e.uniformBlockBinding(oe,ae,P.__bindingPointIndex),c.set(oe,ae)}function et(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},h={},se=null,me={},f={},d=new WeakMap,m=[],x=null,p=!1,g=null,A=null,E=null,y=null,w=null,T=null,R=null,_=new Le(0,0,0),S=0,U=!1,C=null,z=null,j=null,F=null,H=null,Ge.set(0,0,e.canvas.width,e.canvas.height),Z.set(0,0,e.canvas.width,e.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:de,disable:Re,bindFramebuffer:Ze,drawBuffers:Ue,useProgram:ke,setBlending:Je,setMaterial:Ft,setFlipSided:vn,setCullFace:mt,setLineWidth:Vt,setPolygonOffset:zt,setScissorTest:Pt,activeTexture:L,bindTexture:yn,unbindTexture:it,compressedTexImage2D:gt,compressedTexImage3D:M,texImage2D:X,texImage3D:J,pixelStorei:we,getParameter:xe,updateUBOMapping:Ce,uniformBlockBinding:Pe,texStorage2D:ie,texStorage3D:le,texSubImage2D:v,texSubImage3D:I,compressedTexSubImage2D:W,compressedTexSubImage3D:te,scissor:ue,viewport:re,reset:et}}function EA(e,t,n,i,r,s,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Ie,u=new WeakMap,h=new Set,f,d=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch(M){}function x(M,v){return m?new OffscreenCanvas(M,v):Jr("canvas")}function p(M,v,I){let W=1,te=gt(M);if(te.width>I||te.height>I)W=I/Math.max(te.width,te.height);if(W<1)if(typeof HTMLImageElement<"u"&&M instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&M instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&M instanceof ImageBitmap||typeof VideoFrame<"u"&&M instanceof VideoFrame){let ie=Math.floor(W*te.width),le=Math.floor(W*te.height);if(f===void 0)f=x(ie,le);let X=v?x(ie,le):f;return X.width=ie,X.height=le,X.getContext("2d").drawImage(M,0,0,ie,le),Me("WebGLRenderer: Texture has been resized from ("+te.width+"x"+te.height+") to ("+ie+"x"+le+")."),X}else{if("data"in M)Me("WebGLRenderer: Image in DataTexture is too big ("+te.width+"x"+te.height+").");return M}return M}function g(M){return M.generateMipmaps}function A(M){e.generateMipmap(M)}function E(M){if(M.isWebGLCubeRenderTarget)return e.TEXTURE_CUBE_MAP;if(M.isWebGL3DRenderTarget)return e.TEXTURE_3D;if(M.isWebGLArrayRenderTarget||M.isCompressedArrayTexture)return e.TEXTURE_2D_ARRAY;return e.TEXTURE_2D}function y(M,v,I,W,te,ie=!1){if(M!==null){if(e[M]!==void 0)return e[M];Me("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+M+"'")}let le;if(W){if(le=t.get("EXT_texture_norm16"),!le)Me("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension")}let X=v;if(v===e.RED){if(I===e.FLOAT)X=e.R32F;if(I===e.HALF_FLOAT)X=e.R16F;if(I===e.UNSIGNED_BYTE)X=e.R8;if(I===e.UNSIGNED_SHORT&&le)X=le.R16_EXT;if(I===e.SHORT&&le)X=le.R16_SNORM_EXT}if(v===e.RED_INTEGER){if(I===e.UNSIGNED_BYTE)X=e.R8UI;if(I===e.UNSIGNED_SHORT)X=e.R16UI;if(I===e.UNSIGNED_INT)X=e.R32UI;if(I===e.BYTE)X=e.R8I;if(I===e.SHORT)X=e.R16I;if(I===e.INT)X=e.R32I}if(v===e.RG){if(I===e.FLOAT)X=e.RG32F;if(I===e.HALF_FLOAT)X=e.RG16F;if(I===e.UNSIGNED_BYTE)X=e.RG8;if(I===e.UNSIGNED_SHORT&&le)X=le.RG16_EXT;if(I===e.SHORT&&le)X=le.RG16_SNORM_EXT}if(v===e.RG_INTEGER){if(I===e.UNSIGNED_BYTE)X=e.RG8UI;if(I===e.UNSIGNED_SHORT)X=e.RG16UI;if(I===e.UNSIGNED_INT)X=e.RG32UI;if(I===e.BYTE)X=e.RG8I;if(I===e.SHORT)X=e.RG16I;if(I===e.INT)X=e.RG32I}if(v===e.RGB_INTEGER){if(I===e.UNSIGNED_BYTE)X=e.RGB8UI;if(I===e.UNSIGNED_SHORT)X=e.RGB16UI;if(I===e.UNSIGNED_INT)X=e.RGB32UI;if(I===e.BYTE)X=e.RGB8I;if(I===e.SHORT)X=e.RGB16I;if(I===e.INT)X=e.RGB32I}if(v===e.RGBA_INTEGER){if(I===e.UNSIGNED_BYTE)X=e.RGBA8UI;if(I===e.UNSIGNED_SHORT)X=e.RGBA16UI;if(I===e.UNSIGNED_INT)X=e.RGBA32UI;if(I===e.BYTE)X=e.RGBA8I;if(I===e.SHORT)X=e.RGBA16I;if(I===e.INT)X=e.RGBA32I}if(v===e.RGB){if(I===e.UNSIGNED_SHORT&&le)X=le.RGB16_EXT;if(I===e.SHORT&&le)X=le.RGB16_SNORM_EXT;if(I===e.UNSIGNED_INT_5_9_9_9_REV)X=e.RGB9_E5;if(I===e.UNSIGNED_INT_10F_11F_11F_REV)X=e.R11F_G11F_B10F}if(v===e.RGBA){let J=ie?sh:$e.getTransfer(te);if(I===e.FLOAT)X=e.RGBA32F;if(I===e.HALF_FLOAT)X=e.RGBA16F;if(I===e.UNSIGNED_BYTE)X=J===ht?e.SRGB8_ALPHA8:e.RGBA8;if(I===e.UNSIGNED_SHORT&&le)X=le.RGBA16_EXT;if(I===e.SHORT&&le)X=le.RGBA16_SNORM_EXT;if(I===e.UNSIGNED_SHORT_4_4_4_4)X=e.RGBA4;if(I===e.UNSIGNED_SHORT_5_5_5_1)X=e.RGB5_A1}if(X===e.R16F||X===e.R32F||X===e.RG16F||X===e.RG32F||X===e.RGBA16F||X===e.RGBA32F)t.get("EXT_color_buffer_float");return X}function w(M,v){let I;if(M){if(v===null||v===$i||v===os)I=e.DEPTH24_STENCIL8;else if(v===Mi)I=e.DEPTH32F_STENCIL8;else if(v===to)I=e.DEPTH24_STENCIL8,Me("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")}else if(v===null||v===$i||v===os)I=e.DEPTH_COMPONENT24;else if(v===Mi)I=e.DEPTH_COMPONENT32F;else if(v===to)I=e.DEPTH_COMPONENT16;return I}function T(M,v){if(g(M)===!0||M.isFramebufferTexture&&M.minFilter!==Bn&&M.minFilter!==Ht)return Math.log2(Math.max(v.width,v.height))+1;else if(M.mipmaps!==void 0&&M.mipmaps.length>0)return M.mipmaps.length;else if(M.isCompressedTexture&&Array.isArray(M.image))return v.mipmaps.length;else return 1}function R(M){let v=M.target;if(v.removeEventListener("dispose",R),S(v),v.isVideoTexture)u.delete(v);if(v.isHTMLTexture)h.delete(v)}function _(M){let v=M.target;v.removeEventListener("dispose",_),C(v)}function S(M){let v=i.get(M);if(v.__webglInit===void 0)return;let I=M.source,W=d.get(I);if(W){let te=W[v.__cacheKey];if(te.usedTimes--,te.usedTimes===0)U(M);if(Object.keys(W).length===0)d.delete(I)}i.remove(M)}function U(M){let v=i.get(M);e.deleteTexture(v.__webglTexture);let I=M.source,W=d.get(I);delete W[v.__cacheKey],o.memory.textures--}function C(M){let v=i.get(M);if(M.depthTexture)M.depthTexture.dispose(),i.remove(M.depthTexture);if(M.isWebGLCubeRenderTarget)for(let W=0;W<6;W++){if(Array.isArray(v.__webglFramebuffer[W]))for(let te=0;te<v.__webglFramebuffer[W].length;te++)e.deleteFramebuffer(v.__webglFramebuffer[W][te]);else e.deleteFramebuffer(v.__webglFramebuffer[W]);if(v.__webglDepthbuffer)e.deleteRenderbuffer(v.__webglDepthbuffer[W])}else{if(Array.isArray(v.__webglFramebuffer))for(let W=0;W<v.__webglFramebuffer.length;W++)e.deleteFramebuffer(v.__webglFramebuffer[W]);else e.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer)e.deleteRenderbuffer(v.__webglDepthbuffer);if(v.__webglMultisampledFramebuffer)e.deleteFramebuffer(v.__webglMultisampledFramebuffer);if(v.__webglColorRenderbuffer){for(let W=0;W<v.__webglColorRenderbuffer.length;W++)if(v.__webglColorRenderbuffer[W])e.deleteRenderbuffer(v.__webglColorRenderbuffer[W])}if(v.__webglDepthRenderbuffer)e.deleteRenderbuffer(v.__webglDepthRenderbuffer)}let I=M.textures;for(let W=0,te=I.length;W<te;W++){let ie=i.get(I[W]);if(ie.__webglTexture)e.deleteTexture(ie.__webglTexture),o.memory.textures--;i.remove(I[W])}i.remove(M)}let z=0;function j(){z=0}function F(){return z}function H(M){z=M}function V(){let M=z;if(M>=r.maxTextures)Me("WebGLTextures: Trying to use "+M+" texture units while this GPU supports only "+r.maxTextures);return z+=1,M}function O(M){let v=[];return v.push(M.wrapS),v.push(M.wrapT),v.push(M.wrapR||0),v.push(M.magFilter),v.push(M.minFilter),v.push(M.anisotropy),v.push(M.internalFormat),v.push(M.format),v.push(M.type),v.push(M.generateMipmaps),v.push(M.premultiplyAlpha),v.push(M.flipY),v.push(M.unpackAlignment),v.push(M.colorSpace),v.join()}function K(M,v){let I=i.get(M);if(M.isVideoTexture)yn(M);if(M.isRenderTargetTexture===!1&&M.isExternalTexture!==!0&&M.version>0&&I.__version!==M.version){let W=M.image;if(W===null)Me("WebGLRenderer: Texture marked for update but no image data found.");else if(W.complete===!1)Me("WebGLRenderer: Texture marked for update but image is incomplete");else{Re(I,M,v);return}}else if(M.isExternalTexture)I.__webglTexture=M.sourceTexture?M.sourceTexture:null;n.bindTexture(e.TEXTURE_2D,I.__webglTexture,e.TEXTURE0+v)}function Q(M,v){let I=i.get(M);if(M.isRenderTargetTexture===!1&&M.version>0&&I.__version!==M.version){Re(I,M,v);return}else if(M.isExternalTexture)I.__webglTexture=M.sourceTexture?M.sourceTexture:null;n.bindTexture(e.TEXTURE_2D_ARRAY,I.__webglTexture,e.TEXTURE0+v)}function se(M,v){let I=i.get(M);if(M.isRenderTargetTexture===!1&&M.version>0&&I.__version!==M.version){Re(I,M,v);return}n.bindTexture(e.TEXTURE_3D,I.__webglTexture,e.TEXTURE0+v)}function me(M,v){let I=i.get(M);if(M.isCubeDepthTexture!==!0&&M.version>0&&I.__version!==M.version){Ze(I,M,v);return}n.bindTexture(e.TEXTURE_CUBE_MAP,I.__webglTexture,e.TEXTURE0+v)}let _e={[is]:e.REPEAT,[rs]:e.CLAMP_TO_EDGE,[Ba]:e.MIRRORED_REPEAT},qe={[Bn]:e.NEAREST,[Ga]:e.NEAREST_MIPMAP_NEAREST,[xr]:e.NEAREST_MIPMAP_LINEAR,[Ht]:e.LINEAR,[ss]:e.LINEAR_MIPMAP_NEAREST,[ii]:e.LINEAR_MIPMAP_LINEAR},Ge={[T0]:e.NEVER,[I0]:e.ALWAYS,[E0]:e.LESS,[Ya]:e.LEQUAL,[A0]:e.EQUAL,[ja]:e.GEQUAL,[R0]:e.GREATER,[C0]:e.NOTEQUAL};function Z(M,v){if(v.type===Mi&&t.has("OES_texture_float_linear")===!1&&(v.magFilter===Ht||v.magFilter===ss||v.magFilter===xr||v.magFilter===ii||v.minFilter===Ht||v.minFilter===ss||v.minFilter===xr||v.minFilter===ii))Me("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.");if(e.texParameteri(M,e.TEXTURE_WRAP_S,_e[v.wrapS]),e.texParameteri(M,e.TEXTURE_WRAP_T,_e[v.wrapT]),M===e.TEXTURE_3D||M===e.TEXTURE_2D_ARRAY)e.texParameteri(M,e.TEXTURE_WRAP_R,_e[v.wrapR]);if(e.texParameteri(M,e.TEXTURE_MAG_FILTER,qe[v.magFilter]),e.texParameteri(M,e.TEXTURE_MIN_FILTER,qe[v.minFilter]),v.compareFunction)e.texParameteri(M,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(M,e.TEXTURE_COMPARE_FUNC,Ge[v.compareFunction]);if(t.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===Bn)return;if(v.minFilter!==xr&&v.minFilter!==ii)return;if(v.type===Mi&&t.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||i.get(v).__currentAnisotropy){let I=t.get("EXT_texture_filter_anisotropic");e.texParameterf(M,I.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,r.getMaxAnisotropy())),i.get(v).__currentAnisotropy=v.anisotropy}}}function ne(M,v){let I=!1;if(M.__webglInit===void 0)M.__webglInit=!0,v.addEventListener("dispose",R);let W=v.source,te=d.get(W);if(te===void 0)te={},d.set(W,te);let ie=O(v);if(ie!==M.__cacheKey){if(te[ie]===void 0)te[ie]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,I=!0;te[ie].usedTimes++;let le=te[M.__cacheKey];if(le!==void 0){if(te[M.__cacheKey].usedTimes--,le.usedTimes===0)U(v)}M.__cacheKey=ie,M.__webglTexture=te[ie].texture}return I}function fe(M,v,I){return Math.floor(Math.floor(M/I)/v)}function de(M,v,I,W){let ie=M.updateRanges;if(ie.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,v.width,v.height,I,W,v.data);else{ie.sort((we,ue)=>we.start-ue.start);let le=0;for(let we=1;we<ie.length;we++){let ue=ie[le],re=ie[we],Ce=ue.start+ue.count,Pe=fe(re.start,v.width,4),et=fe(ue.start,v.width,4);if(re.start<=Ce+1&&Pe===et&&fe(re.start+re.count-1,v.width,4)===Pe)ue.count=Math.max(ue.count,re.start+re.count-ue.start);else++le,ie[le]=re}ie.length=le+1;let X=n.getParameter(e.UNPACK_ROW_LENGTH),J=n.getParameter(e.UNPACK_SKIP_PIXELS),xe=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,v.width);for(let we=0,ue=ie.length;we<ue;we++){let re=ie[we],Ce=Math.floor(re.start/4),Pe=Math.ceil(re.count/4),et=Ce%v.width,P=Math.floor(Ce/v.width),oe=Pe,Y=1;n.pixelStorei(e.UNPACK_SKIP_PIXELS,et),n.pixelStorei(e.UNPACK_SKIP_ROWS,P),n.texSubImage2D(e.TEXTURE_2D,0,et,P,oe,1,I,W,v.data)}M.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,X),n.pixelStorei(e.UNPACK_SKIP_PIXELS,J),n.pixelStorei(e.UNPACK_SKIP_ROWS,xe)}}function Re(M,v,I){let W=e.TEXTURE_2D;if(v.isDataArrayTexture||v.isCompressedArrayTexture)W=e.TEXTURE_2D_ARRAY;if(v.isData3DTexture)W=e.TEXTURE_3D;let te=ne(M,v),ie=v.source;n.bindTexture(W,M.__webglTexture,e.TEXTURE0+I);let le=i.get(ie);if(ie.version!==le.__version||te===!0){if(n.activeTexture(e.TEXTURE0+I),(typeof ImageBitmap<"u"&&v.image instanceof ImageBitmap)===!1){let Y=$e.getPrimaries($e.workingColorSpace),ae=v.colorSpace===Sr?null:$e.getPrimaries(v.colorSpace),ve=v.colorSpace===Sr||Y===ae?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,ve)}n.pixelStorei(e.UNPACK_ALIGNMENT,v.unpackAlignment);let J=p(v.image,!1,r.maxTextureSize);J=it(v,J);let xe=s.convert(v.format,v.colorSpace),we=s.convert(v.type),ue=y(v.internalFormat,xe,we,v.normalized,v.colorSpace,v.isVideoTexture);Z(W,v);let re,Ce=v.mipmaps,Pe=v.isVideoTexture!==!0,et=le.__version===void 0||te===!0,P=ie.dataReady,oe=T(v,J);if(v.isDepthTexture){if(ue=w(v.format===yr,v.type),et)if(Pe)n.texStorage2D(e.TEXTURE_2D,1,ue,J.width,J.height);else n.texImage2D(e.TEXTURE_2D,0,ue,J.width,J.height,0,xe,we,null)}else if(v.isDataTexture)if(Ce.length>0){if(Pe&&et)n.texStorage2D(e.TEXTURE_2D,oe,ue,Ce[0].width,Ce[0].height);for(let Y=0,ae=Ce.length;Y<ae;Y++)if(re=Ce[Y],Pe){if(P)n.texSubImage2D(e.TEXTURE_2D,Y,0,0,re.width,re.height,xe,we,re.data)}else n.texImage2D(e.TEXTURE_2D,Y,ue,re.width,re.height,0,xe,we,re.data);v.generateMipmaps=!1}else if(Pe){if(et)n.texStorage2D(e.TEXTURE_2D,oe,ue,J.width,J.height);if(P)de(v,J,xe,we)}else n.texImage2D(e.TEXTURE_2D,0,ue,J.width,J.height,0,xe,we,J.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){if(Pe&&et)n.texStorage3D(e.TEXTURE_2D_ARRAY,oe,ue,Ce[0].width,Ce[0].height,J.depth);for(let Y=0,ae=Ce.length;Y<ae;Y++)if(re=Ce[Y],v.format!==ri)if(xe!==null)if(Pe){if(P)if(v.layerUpdates.size>0){let ve=Ch(re.width,re.height,v.format,v.type);for(let ee of v.layerUpdates){let ce=re.data.subarray(ee*ve/re.data.BYTES_PER_ELEMENT,(ee+1)*ve/re.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Y,0,0,ee,re.width,re.height,1,xe,ce)}v.clearLayerUpdates()}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Y,0,0,0,re.width,re.height,J.depth,xe,re.data)}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,Y,ue,re.width,re.height,J.depth,0,re.data,0,0);else Me("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(Pe){if(P)n.texSubImage3D(e.TEXTURE_2D_ARRAY,Y,0,0,0,re.width,re.height,J.depth,xe,we,re.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,Y,ue,re.width,re.height,J.depth,0,xe,we,re.data)}else{if(Pe&&et)n.texStorage2D(e.TEXTURE_2D,oe,ue,Ce[0].width,Ce[0].height);for(let Y=0,ae=Ce.length;Y<ae;Y++)if(re=Ce[Y],v.format!==ri)if(xe!==null)if(Pe){if(P)n.compressedTexSubImage2D(e.TEXTURE_2D,Y,0,0,re.width,re.height,xe,re.data)}else n.compressedTexImage2D(e.TEXTURE_2D,Y,ue,re.width,re.height,0,re.data);else Me("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(Pe){if(P)n.texSubImage2D(e.TEXTURE_2D,Y,0,0,re.width,re.height,xe,we,re.data)}else n.texImage2D(e.TEXTURE_2D,Y,ue,re.width,re.height,0,xe,we,re.data)}else if(v.isDataArrayTexture)if(Pe){if(et)n.texStorage3D(e.TEXTURE_2D_ARRAY,oe,ue,J.width,J.height,J.depth);if(P)if(v.layerUpdates.size>0){let Y=Ch(J.width,J.height,v.format,v.type);for(let ae of v.layerUpdates){let ve=J.data.subarray(ae*Y/J.data.BYTES_PER_ELEMENT,(ae+1)*Y/J.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,ae,J.width,J.height,1,xe,we,ve)}v.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,J.width,J.height,J.depth,xe,we,J.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,ue,J.width,J.height,J.depth,0,xe,we,J.data);else if(v.isData3DTexture)if(Pe){if(et)n.texStorage3D(e.TEXTURE_3D,oe,ue,J.width,J.height,J.depth);if(P)n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,J.width,J.height,J.depth,xe,we,J.data)}else n.texImage3D(e.TEXTURE_3D,0,ue,J.width,J.height,J.depth,0,xe,we,J.data);else if(v.isFramebufferTexture){if(et)if(Pe)n.texStorage2D(e.TEXTURE_2D,oe,ue,J.width,J.height);else{let Y=J.width,ae=J.height;for(let ve=0;ve<oe;ve++)n.texImage2D(e.TEXTURE_2D,ve,ue,Y,ae,0,xe,we,null),Y>>=1,ae>>=1}}else if(v.isHTMLTexture){if("texElementImage2D"in e){let Y=e.canvas;if(!Y.hasAttribute("layoutsubtree"))Y.setAttribute("layoutsubtree","true");if(J.parentNode!==Y){Y.appendChild(J),h.add(v),Y.onpaint=(ae)=>{let ve=ae.changedElements;for(let ee of h)if(ve.includes(ee.image))ee.needsUpdate=!0},Y.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,J);else{let{RGBA:ve,RGBA:ee,UNSIGNED_BYTE:ce}=e;e.texElementImage2D(e.TEXTURE_2D,0,ve,ee,ce,J)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(Ce.length>0){if(Pe&&et){let Y=gt(Ce[0]);n.texStorage2D(e.TEXTURE_2D,oe,ue,Y.width,Y.height)}for(let Y=0,ae=Ce.length;Y<ae;Y++)if(re=Ce[Y],Pe){if(P)n.texSubImage2D(e.TEXTURE_2D,Y,0,0,xe,we,re)}else n.texImage2D(e.TEXTURE_2D,Y,ue,xe,we,re);v.generateMipmaps=!1}else if(Pe){if(et){let Y=gt(J);n.texStorage2D(e.TEXTURE_2D,oe,ue,Y.width,Y.height)}if(P)n.texSubImage2D(e.TEXTURE_2D,0,0,0,xe,we,J)}else n.texImage2D(e.TEXTURE_2D,0,ue,xe,we,J);if(g(v))A(W);if(le.__version=ie.version,v.onUpdate)v.onUpdate(v)}M.__version=v.version}function Ze(M,v,I){if(v.image.length!==6)return;let W=ne(M,v),te=v.source;n.bindTexture(e.TEXTURE_CUBE_MAP,M.__webglTexture,e.TEXTURE0+I);let ie=i.get(te);if(te.version!==ie.__version||W===!0){n.activeTexture(e.TEXTURE0+I);let le=$e.getPrimaries($e.workingColorSpace),X=v.colorSpace===Sr?null:$e.getPrimaries(v.colorSpace),J=v.colorSpace===Sr||le===X?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,J);let xe=v.isCompressedTexture||v.image[0].isCompressedTexture,we=v.image[0]&&v.image[0].isDataTexture,ue=[];for(let ee=0;ee<6;ee++){if(!xe&&!we)ue[ee]=p(v.image[ee],!0,r.maxCubemapSize);else ue[ee]=we?v.image[ee].image:v.image[ee];ue[ee]=it(v,ue[ee])}let re=ue[0],Ce=s.convert(v.format,v.colorSpace),Pe=s.convert(v.type),et=y(v.internalFormat,Ce,Pe,v.normalized,v.colorSpace),P=v.isVideoTexture!==!0,oe=ie.__version===void 0||W===!0,Y=te.dataReady,ae=T(v,re);Z(e.TEXTURE_CUBE_MAP,v);let ve;if(xe){if(P&&oe)n.texStorage2D(e.TEXTURE_CUBE_MAP,ae,et,re.width,re.height);for(let ee=0;ee<6;ee++){ve=ue[ee].mipmaps;for(let ce=0;ce<ve.length;ce++){let Fe=ve[ce];if(v.format!==ri)if(Ce!==null)if(P){if(Y)n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce,0,0,Fe.width,Fe.height,Ce,Fe.data)}else n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce,et,Fe.width,Fe.height,0,Fe.data);else Me("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()");else if(P){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce,0,0,Fe.width,Fe.height,Ce,Pe,Fe.data)}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce,et,Fe.width,Fe.height,0,Ce,Pe,Fe.data)}}}else{if(ve=v.mipmaps,P&&oe){if(ve.length>0)ae++;let ee=gt(ue[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,ae,et,ee.width,ee.height)}for(let ee=0;ee<6;ee++)if(we){if(P){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,ue[ee].width,ue[ee].height,Ce,Pe,ue[ee].data)}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,et,ue[ee].width,ue[ee].height,0,Ce,Pe,ue[ee].data);for(let ce=0;ce<ve.length;ce++){let St=ve[ce].image[ee].image;if(P){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce+1,0,0,St.width,St.height,Ce,Pe,St.data)}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce+1,et,St.width,St.height,0,Ce,Pe,St.data)}}else{if(P){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,Ce,Pe,ue[ee])}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,et,Ce,Pe,ue[ee]);for(let ce=0;ce<ve.length;ce++){let Fe=ve[ce];if(P){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce+1,0,0,Ce,Pe,Fe.image[ee])}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce+1,et,Ce,Pe,Fe.image[ee])}}}if(g(v))A(e.TEXTURE_CUBE_MAP);if(ie.__version=te.version,v.onUpdate)v.onUpdate(v)}M.__version=v.version}function Ue(M,v,I,W,te,ie){let le=s.convert(I.format,I.colorSpace),X=s.convert(I.type),J=y(I.internalFormat,le,X,I.normalized,I.colorSpace),xe=i.get(v),we=i.get(I);if(we.__renderTarget=v,!xe.__hasExternalTextures){let ue=Math.max(1,v.width>>ie),re=Math.max(1,v.height>>ie);if(te===e.TEXTURE_3D||te===e.TEXTURE_2D_ARRAY)n.texImage3D(te,ie,J,ue,re,v.depth,0,le,X,null);else n.texImage2D(te,ie,J,ue,re,0,le,X,null)}if(n.bindFramebuffer(e.FRAMEBUFFER,M),L(v))a.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,W,te,we.__webglTexture,0,Pt(v));else if(te===e.TEXTURE_2D||te>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&te<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)e.framebufferTexture2D(e.FRAMEBUFFER,W,te,we.__webglTexture,ie);n.bindFramebuffer(e.FRAMEBUFFER,null)}function ke(M,v,I){if(e.bindRenderbuffer(e.RENDERBUFFER,M),v.depthBuffer){let W=v.depthTexture,te=W&&W.isDepthTexture?W.type:null,ie=w(v.stencilBuffer,te),le=v.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(L(v))a.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Pt(v),ie,v.width,v.height);else if(I)e.renderbufferStorageMultisample(e.RENDERBUFFER,Pt(v),ie,v.width,v.height);else e.renderbufferStorage(e.RENDERBUFFER,ie,v.width,v.height);e.framebufferRenderbuffer(e.FRAMEBUFFER,le,e.RENDERBUFFER,M)}else{let W=v.textures;for(let te=0;te<W.length;te++){let ie=W[te],le=s.convert(ie.format,ie.colorSpace),X=s.convert(ie.type),J=y(ie.internalFormat,le,X,ie.normalized,ie.colorSpace);if(L(v))a.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Pt(v),J,v.width,v.height);else if(I)e.renderbufferStorageMultisample(e.RENDERBUFFER,Pt(v),J,v.width,v.height);else e.renderbufferStorage(e.RENDERBUFFER,J,v.width,v.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Ke(M,v,I){let W=v.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,M),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let te=i.get(v.depthTexture);if(te.__renderTarget=v,!te.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0;if(W){if(te.__webglInit===void 0)te.__webglInit=!0,v.depthTexture.addEventListener("dispose",R);if(te.__webglTexture===void 0){te.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,te.__webglTexture),Z(e.TEXTURE_CUBE_MAP,v.depthTexture);let xe=s.convert(v.depthTexture.format),we=s.convert(v.depthTexture.type),ue;if(v.depthTexture.format===vr)ue=e.DEPTH_COMPONENT24;else if(v.depthTexture.format===yr)ue=e.DEPTH24_STENCIL8;for(let re=0;re<6;re++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+re,0,ue,v.width,v.height,0,xe,we,null)}}else K(v.depthTexture,0);let ie=te.__webglTexture,le=Pt(v),X=W?e.TEXTURE_CUBE_MAP_POSITIVE_X+I:e.TEXTURE_2D,J=v.depthTexture.format===yr?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(v.depthTexture.format===vr)if(L(v))a.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,J,X,ie,0,le);else e.framebufferTexture2D(e.FRAMEBUFFER,J,X,ie,0);else if(v.depthTexture.format===yr)if(L(v))a.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,J,X,ie,0,le);else e.framebufferTexture2D(e.FRAMEBUFFER,J,X,ie,0);else throw Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ye(M){let v=i.get(M),I=M.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==M.depthTexture){let W=M.depthTexture;if(v.__depthDisposeCallback)v.__depthDisposeCallback();if(W){let te=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,W.removeEventListener("dispose",te)};W.addEventListener("dispose",te),v.__depthDisposeCallback=te}v.__boundDepthTexture=W}if(M.depthTexture&&!v.__autoAllocateDepthBuffer)if(I)for(let W=0;W<6;W++)Ke(v.__webglFramebuffer[W],M,W);else{let W=M.texture.mipmaps;if(W&&W.length>0)Ke(v.__webglFramebuffer[0],M,0);else Ke(v.__webglFramebuffer,M,0)}else if(I){v.__webglDepthbuffer=[];for(let W=0;W<6;W++)if(n.bindFramebuffer(e.FRAMEBUFFER,v.__webglFramebuffer[W]),v.__webglDepthbuffer[W]===void 0)v.__webglDepthbuffer[W]=e.createRenderbuffer(),ke(v.__webglDepthbuffer[W],M,!1);else{let te=M.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ie=v.__webglDepthbuffer[W];e.bindRenderbuffer(e.RENDERBUFFER,ie),e.framebufferRenderbuffer(e.FRAMEBUFFER,te,e.RENDERBUFFER,ie)}}else{let W=M.texture.mipmaps;if(W&&W.length>0)n.bindFramebuffer(e.FRAMEBUFFER,v.__webglFramebuffer[0]);else n.bindFramebuffer(e.FRAMEBUFFER,v.__webglFramebuffer);if(v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=e.createRenderbuffer(),ke(v.__webglDepthbuffer,M,!1);else{let te=M.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ie=v.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,ie),e.framebufferRenderbuffer(e.FRAMEBUFFER,te,e.RENDERBUFFER,ie)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function Je(M,v,I){let W=i.get(M);if(v!==void 0)Ue(W.__webglFramebuffer,M,M.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0);if(I!==void 0)Ye(M)}function Ft(M){let v=M.texture,I=i.get(M),W=i.get(v);M.addEventListener("dispose",_);let te=M.textures,ie=M.isWebGLCubeRenderTarget===!0,le=te.length>1;if(!le){if(W.__webglTexture===void 0)W.__webglTexture=e.createTexture();W.__version=v.version,o.memory.textures++}if(ie){I.__webglFramebuffer=[];for(let X=0;X<6;X++)if(v.mipmaps&&v.mipmaps.length>0){I.__webglFramebuffer[X]=[];for(let J=0;J<v.mipmaps.length;J++)I.__webglFramebuffer[X][J]=e.createFramebuffer()}else I.__webglFramebuffer[X]=e.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){I.__webglFramebuffer=[];for(let X=0;X<v.mipmaps.length;X++)I.__webglFramebuffer[X]=e.createFramebuffer()}else I.__webglFramebuffer=e.createFramebuffer();if(le)for(let X=0,J=te.length;X<J;X++){let xe=i.get(te[X]);if(xe.__webglTexture===void 0)xe.__webglTexture=e.createTexture(),o.memory.textures++}if(M.samples>0&&L(M)===!1){I.__webglMultisampledFramebuffer=e.createFramebuffer(),I.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,I.__webglMultisampledFramebuffer);for(let X=0;X<te.length;X++){let J=te[X];I.__webglColorRenderbuffer[X]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,I.__webglColorRenderbuffer[X]);let xe=s.convert(J.format,J.colorSpace),we=s.convert(J.type),ue=y(J.internalFormat,xe,we,J.normalized,J.colorSpace,M.isXRRenderTarget===!0),re=Pt(M);e.renderbufferStorageMultisample(e.RENDERBUFFER,re,ue,M.width,M.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+X,e.RENDERBUFFER,I.__webglColorRenderbuffer[X])}if(e.bindRenderbuffer(e.RENDERBUFFER,null),M.depthBuffer)I.__webglDepthRenderbuffer=e.createRenderbuffer(),ke(I.__webglDepthRenderbuffer,M,!0);n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(ie){n.bindTexture(e.TEXTURE_CUBE_MAP,W.__webglTexture),Z(e.TEXTURE_CUBE_MAP,v);for(let X=0;X<6;X++)if(v.mipmaps&&v.mipmaps.length>0)for(let J=0;J<v.mipmaps.length;J++)Ue(I.__webglFramebuffer[X][J],M,v,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+X,J);else Ue(I.__webglFramebuffer[X],M,v,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+X,0);if(g(v))A(e.TEXTURE_CUBE_MAP);n.unbindTexture()}else if(le){for(let X=0,J=te.length;X<J;X++){let xe=te[X],we=i.get(xe),ue=e.TEXTURE_2D;if(M.isWebGL3DRenderTarget||M.isWebGLArrayRenderTarget)ue=M.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY;if(n.bindTexture(ue,we.__webglTexture),Z(ue,xe),Ue(I.__webglFramebuffer,M,xe,e.COLOR_ATTACHMENT0+X,ue,0),g(xe))A(ue)}n.unbindTexture()}else{let X=e.TEXTURE_2D;if(M.isWebGL3DRenderTarget||M.isWebGLArrayRenderTarget)X=M.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY;if(n.bindTexture(X,W.__webglTexture),Z(X,v),v.mipmaps&&v.mipmaps.length>0)for(let J=0;J<v.mipmaps.length;J++)Ue(I.__webglFramebuffer[J],M,v,e.COLOR_ATTACHMENT0,X,J);else Ue(I.__webglFramebuffer,M,v,e.COLOR_ATTACHMENT0,X,0);if(g(v))A(X);n.unbindTexture()}if(M.depthBuffer)Ye(M)}function vn(M){let v=M.textures;for(let I=0,W=v.length;I<W;I++){let te=v[I];if(g(te)){let ie=E(M),le=i.get(te).__webglTexture;n.bindTexture(ie,le),A(ie),n.unbindTexture()}}}let mt=[],Vt=[];function zt(M){if(M.samples>0){if(L(M)===!1){let{textures:v,width:I,height:W}=M,te=e.COLOR_BUFFER_BIT,ie=M.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,le=i.get(M),X=v.length>1;if(X)for(let xe=0;xe<v.length;xe++)n.bindFramebuffer(e.FRAMEBUFFER,le.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+xe,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,le.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+xe,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,le.__webglMultisampledFramebuffer);let J=M.texture.mipmaps;if(J&&J.length>0)n.bindFramebuffer(e.DRAW_FRAMEBUFFER,le.__webglFramebuffer[0]);else n.bindFramebuffer(e.DRAW_FRAMEBUFFER,le.__webglFramebuffer);for(let xe=0;xe<v.length;xe++){if(M.resolveDepthBuffer){if(M.depthBuffer)te|=e.DEPTH_BUFFER_BIT;if(M.stencilBuffer&&M.resolveStencilBuffer)te|=e.STENCIL_BUFFER_BIT}if(X){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,le.__webglColorRenderbuffer[xe]);let we=i.get(v[xe]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,we,0)}if(e.blitFramebuffer(0,0,I,W,0,0,I,W,te,e.NEAREST),c===!0){if(mt.length=0,Vt.length=0,mt.push(e.COLOR_ATTACHMENT0+xe),M.depthBuffer&&M.resolveDepthBuffer===!1)mt.push(ie),Vt.push(ie),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,Vt);e.invalidateFramebuffer(e.READ_FRAMEBUFFER,mt)}}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),X)for(let xe=0;xe<v.length;xe++){n.bindFramebuffer(e.FRAMEBUFFER,le.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+xe,e.RENDERBUFFER,le.__webglColorRenderbuffer[xe]);let we=i.get(v[xe]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,le.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+xe,e.TEXTURE_2D,we,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,le.__webglMultisampledFramebuffer)}else if(M.depthBuffer&&M.resolveDepthBuffer===!1&&c){let v=M.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[v])}}}function Pt(M){return Math.min(r.maxSamples,M.samples)}function L(M){let v=i.get(M);return M.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function yn(M){let v=o.render.frame;if(u.get(M)!==v)u.set(M,v),M.update()}function it(M,v){let{colorSpace:I,format:W,type:te}=M;if(M.isCompressedTexture===!0||M.isVideoTexture===!0)return v;if(I!==pn&&I!==Sr)if($e.getTransfer(I)===ht){if(W!==ri||te!==Gn)Me("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.")}else Ne("WebGLTextures: Unsupported texture color space:",I);return v}function gt(M){if(typeof HTMLImageElement<"u"&&M instanceof HTMLImageElement)l.width=M.naturalWidth||M.width,l.height=M.naturalHeight||M.height;else if(typeof VideoFrame<"u"&&M instanceof VideoFrame)l.width=M.displayWidth,l.height=M.displayHeight;else l.width=M.width,l.height=M.height;return l}this.allocateTextureUnit=V,this.resetTextureUnits=j,this.getTextureUnits=F,this.setTextureUnits=H,this.setTexture2D=K,this.setTexture2DArray=Q,this.setTexture3D=se,this.setTextureCube=me,this.rebindTextures=Je,this.setupRenderTarget=Ft,this.updateRenderTargetMipmap=vn,this.updateMultisampleRenderTarget=zt,this.setupDepthRenderbuffer=Ye,this.setupFrameBufferTexture=Ue,this.useMultisampledRTT=L,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function AA(e,t){function n(i,r=Sr){let s,o=$e.getTransfer(r);if(i===Gn)return e.UNSIGNED_BYTE;if(i===bu)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Su)return e.UNSIGNED_SHORT_5_5_5_1;if(i===v0)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===y0)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===_0)return e.BYTE;if(i===x0)return e.SHORT;if(i===to)return e.UNSIGNED_SHORT;if(i===yu)return e.INT;if(i===$i)return e.UNSIGNED_INT;if(i===Mi)return e.FLOAT;if(i===wi)return e.HALF_FLOAT;if(i===b0)return e.ALPHA;if(i===S0)return e.RGB;if(i===ri)return e.RGBA;if(i===vr)return e.DEPTH_COMPONENT;if(i===yr)return e.DEPTH_STENCIL;if(i===M0)return e.RED;if(i===Mu)return e.RED_INTEGER;if(i===br)return e.RG;if(i===wu)return e.RG_INTEGER;if(i===Tu)return e.RGBA_INTEGER;if(i===Ha||i===Va||i===$a||i===Wa)if(o===ht)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===Ha)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Va)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===$a)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Wa)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===Ha)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Va)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===$a)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Wa)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Eu||i===Au||i===Ru||i===Cu)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Eu)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Au)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Ru)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Cu)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Iu||i===Pu||i===Lu||i===Nu||i===Du||i===Za||i===Ou)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Iu||i===Pu)return o===ht?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Lu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===Nu)return s.COMPRESSED_R11_EAC;if(i===Du)return s.COMPRESSED_SIGNED_R11_EAC;if(i===Za)return s.COMPRESSED_RG11_EAC;if(i===Ou)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Uu||i===Fu||i===zu||i===ku||i===Bu||i===Gu||i===Hu||i===Vu||i===$u||i===Wu||i===Zu||i===Xu||i===qu||i===Yu)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Uu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Fu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===zu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===ku)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Bu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Gu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Hu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Vu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===$u)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Wu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Zu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Xu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===qu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Yu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===ju||i===Ju||i===Ku)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(i===ju)return o===ht?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Ju)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Ku)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Qu||i===eh||i===Xa||i===th)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(i===Qu)return s.COMPRESSED_RED_RGTC1_EXT;if(i===eh)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Xa)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===th)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;if(i===os)return e.UNSIGNED_INT_24_8;return e[i]!==void 0?e[i]:null}return{convert:n}}var RA=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,CA=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Sx{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new sc(e.texture);if(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)this.depthNear=e.depthNear,this.depthFar=e.depthFar;this.texture=n}}getMesh(e){if(this.texture!==null){if(this.mesh===null){let t=e.cameras[0].viewport,n=new An({vertexShader:RA,fragmentShader:CA,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new pt(new po(20,20),n)}}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Mx extends Hn{constructor(e,t){super();let n=this,i=null,r=1,s=null,o="local-floor",a=1,c=null,l=null,u=null,h=null,f=null,d=null,m=typeof XRWebGLBinding<"u",x=new Sx,p={},g=t.getContextAttributes(),A=null,E=null,y=[],w=[],T=new Ie,R=null,_=new Lt;_.viewport=new st;let S=new Lt;S.viewport=new st;let U=[_,S],C=new Mh,z=null,j=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let ne=y[Z];if(ne===void 0)ne=new so,y[Z]=ne;return ne.getTargetRaySpace()},this.getControllerGrip=function(Z){let ne=y[Z];if(ne===void 0)ne=new so,y[Z]=ne;return ne.getGripSpace()},this.getHand=function(Z){let ne=y[Z];if(ne===void 0)ne=new so,y[Z]=ne;return ne.getHandSpace()};function F(Z){let ne=w.indexOf(Z.inputSource);if(ne===-1)return;let fe=y[ne];if(fe!==void 0)fe.update(Z.inputSource,Z.frame,c||s),fe.dispatchEvent({type:Z.type,data:Z.inputSource})}function H(){i.removeEventListener("select",F),i.removeEventListener("selectstart",F),i.removeEventListener("selectend",F),i.removeEventListener("squeeze",F),i.removeEventListener("squeezestart",F),i.removeEventListener("squeezeend",F),i.removeEventListener("end",H),i.removeEventListener("inputsourceschange",V);for(let Z=0;Z<y.length;Z++){let ne=w[Z];if(ne===null)continue;w[Z]=null,y[Z].disconnect(ne)}z=null,j=null,x.reset();for(let Z in p)delete p[Z];e.setRenderTarget(A),f=null,h=null,u=null,i=null,E=null,Ge.stop(),n.isPresenting=!1,e.setPixelRatio(R),e.setSize(T.width,T.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){if(r=Z,n.isPresenting===!0)Me("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){if(o=Z,n.isPresenting===!0)Me("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||s},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return h!==null?h:f},this.getBinding=function(){if(u===null&&m)u=new XRWebGLBinding(i,t);return u},this.getFrame=function(){return d},this.getSession=function(){return i},this.setSession=async function(Z){if(i=Z,i!==null){if(A=e.getRenderTarget(),i.addEventListener("select",F),i.addEventListener("selectstart",F),i.addEventListener("selectend",F),i.addEventListener("squeeze",F),i.addEventListener("squeezestart",F),i.addEventListener("squeezeend",F),i.addEventListener("end",H),i.addEventListener("inputsourceschange",V),g.xrCompatible!==!0)await t.makeXRCompatible();if(R=e.getPixelRatio(),e.getSize(T),!(m&&("createProjectionLayer"in XRWebGLBinding.prototype))){let fe={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(i,t,fe),i.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),E=new En(f.framebufferWidth,f.framebufferHeight,{format:ri,type:Gn,colorSpace:e.outputColorSpace,stencilBuffer:g.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}else{let fe=null,de=null,Re=null;if(g.depth)Re=g.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,fe=g.stencil?yr:vr,de=g.stencil?os:$i;let Ze={colorFormat:t.RGBA8,depthFormat:Re,scaleFactor:r};u=this.getBinding(),h=u.createProjectionLayer(Ze),i.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),E=new En(h.textureWidth,h.textureHeight,{format:ri,type:Gn,depthTexture:new qi(h.textureWidth,h.textureHeight,de,void 0,void 0,void 0,void 0,void 0,void 0,fe),stencilBuffer:g.stencil,colorSpace:e.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}E.isXRRenderTarget=!0,this.setFoveation(a),c=null,s=await i.requestReferenceSpace(o),Ge.setContext(i),Ge.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function V(Z){for(let ne=0;ne<Z.removed.length;ne++){let fe=Z.removed[ne],de=w.indexOf(fe);if(de>=0)w[de]=null,y[de].disconnect(fe)}for(let ne=0;ne<Z.added.length;ne++){let fe=Z.added[ne],de=w.indexOf(fe);if(de===-1){for(let Ze=0;Ze<y.length;Ze++)if(Ze>=w.length){w.push(fe),de=Ze;break}else if(w[Ze]===null){w[Ze]=fe,de=Ze;break}if(de===-1)break}let Re=y[de];if(Re)Re.connect(fe)}}let O=new N,K=new N;function Q(Z,ne,fe){O.setFromMatrixPosition(ne.matrixWorld),K.setFromMatrixPosition(fe.matrixWorld);let de=O.distanceTo(K),Re=ne.projectionMatrix.elements,Ze=fe.projectionMatrix.elements,Ue=Re[14]/(Re[10]-1),ke=Re[14]/(Re[10]+1),Ke=(Re[9]+1)/Re[5],Ye=(Re[9]-1)/Re[5],Je=(Re[8]-1)/Re[0],Ft=(Ze[8]+1)/Ze[0],vn=Ue*Je,mt=Ue*Ft,Vt=de/(-Je+Ft),zt=Vt*-Je;if(ne.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(zt),Z.translateZ(Vt),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),Re[10]===-1)Z.projectionMatrix.copy(ne.projectionMatrix),Z.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{let Pt=Ue+Vt,L=ke+Vt,yn=vn-zt,it=mt+(de-zt),gt=Ke*ke/L*Pt,M=Ye*ke/L*Pt;Z.projectionMatrix.makePerspective(yn,it,gt,M,Pt,L),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function se(Z,ne){if(ne===null)Z.matrixWorld.copy(Z.matrix);else Z.matrixWorld.multiplyMatrices(ne.matrixWorld,Z.matrix);Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(i===null)return;let{near:ne,far:fe}=Z;if(x.texture!==null){if(x.depthNear>0)ne=x.depthNear;if(x.depthFar>0)fe=x.depthFar}if(C.near=S.near=_.near=ne,C.far=S.far=_.far=fe,z!==C.near||j!==C.far)i.updateRenderState({depthNear:C.near,depthFar:C.far}),z=C.near,j=C.far;C.layers.mask=Z.layers.mask|6,_.layers.mask=C.layers.mask&-5,S.layers.mask=C.layers.mask&-3;let de=Z.parent,Re=C.cameras;se(C,de);for(let Ze=0;Ze<Re.length;Ze++)se(Re[Ze],de);if(Re.length===2)Q(C,_,S);else C.projectionMatrix.copy(_.projectionMatrix);me(Z,C,de)};function me(Z,ne,fe){if(fe===null)Z.matrix.copy(ne.matrixWorld);else Z.matrix.copy(fe.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(ne.matrixWorld);if(Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(ne.projectionMatrix),Z.projectionMatrixInverse.copy(ne.projectionMatrixInverse),Z.isPerspectiveCamera)Z.fov=mr*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1}this.getCamera=function(){return C},this.getFoveation=function(){if(h===null&&f===null)return;return a},this.setFoveation=function(Z){if(a=Z,h!==null)h.fixedFoveation=Z;if(f!==null&&f.fixedFoveation!==void 0)f.fixedFoveation=Z},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(C)},this.getCameraTexture=function(Z){return p[Z]};let _e=null;function qe(Z,ne){if(l=ne.getViewerPose(c||s),d=ne,l!==null){let fe=l.views;if(f!==null)e.setRenderTargetFramebuffer(E,f.framebuffer),e.setRenderTarget(E);let de=!1;if(fe.length!==C.cameras.length)C.cameras.length=0,de=!0;for(let ke=0;ke<fe.length;ke++){let Ke=fe[ke],Ye=null;if(f!==null)Ye=f.getViewport(Ke);else{let Ft=u.getViewSubImage(h,Ke);if(Ye=Ft.viewport,ke===0)e.setRenderTargetTextures(E,Ft.colorTexture,Ft.depthStencilTexture),e.setRenderTarget(E)}let Je=U[ke];if(Je===void 0)Je=new Lt,Je.layers.enable(ke),Je.viewport=new st,U[ke]=Je;if(Je.matrix.fromArray(Ke.transform.matrix),Je.matrix.decompose(Je.position,Je.quaternion,Je.scale),Je.projectionMatrix.fromArray(Ke.projectionMatrix),Je.projectionMatrixInverse.copy(Je.projectionMatrix).invert(),Je.viewport.set(Ye.x,Ye.y,Ye.width,Ye.height),ke===0)C.matrix.copy(Je.matrix),C.matrix.decompose(C.position,C.quaternion,C.scale);if(de===!0)C.cameras.push(Je)}let Re=i.enabledFeatures;if(Re&&Re.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&m){u=n.getBinding();let ke=u.getDepthInformation(fe[0]);if(ke&&ke.isValid&&ke.texture)x.init(ke,i.renderState)}if(Re&&Re.includes("camera-access")&&m){e.state.unbindTexture(),u=n.getBinding();for(let ke=0;ke<fe.length;ke++){let Ke=fe[ke].camera;if(Ke){let Ye=p[Ke];if(!Ye)Ye=new sc,p[Ke]=Ye;let Je=u.getCameraImage(Ke);Ye.sourceTexture=Je}}}}for(let fe=0;fe<y.length;fe++){let de=w[fe],Re=y[fe];if(de!==null&&Re!==void 0)Re.update(de,ne,c||s)}if(_e)_e(Z,ne);if(ne.detectedPlanes)n.dispatchEvent({type:"planesdetected",data:ne});d=null}let Ge=new hx;Ge.setAnimationLoop(qe),this.setAnimationLoop=function(Z){_e=Z},this.dispose=function(){}}}var IA=new ze,wx=new Oe;wx.set(-1,0,0,0,1,0,0,0,1);function PA(e,t){function n(p,g){if(p.matrixAutoUpdate===!0)p.updateMatrix();g.value.copy(p.matrix)}function i(p,g){if(g.color.getRGB(p.fogColor.value,dh(e)),g.isFog)p.fogNear.value=g.near,p.fogFar.value=g.far;else if(g.isFogExp2)p.fogDensity.value=g.density}function r(p,g,A,E,y){if(g.isNodeMaterial)g.uniformsNeedUpdate=!1;else if(g.isMeshBasicMaterial)s(p,g);else if(g.isMeshLambertMaterial){if(s(p,g),g.envMap)p.envMapIntensity.value=g.envMapIntensity}else if(g.isMeshToonMaterial)s(p,g),h(p,g);else if(g.isMeshPhongMaterial){if(s(p,g),u(p,g),g.envMap)p.envMapIntensity.value=g.envMapIntensity}else if(g.isMeshStandardMaterial){if(s(p,g),f(p,g),g.isMeshPhysicalMaterial)d(p,g,y)}else if(g.isMeshMatcapMaterial)s(p,g),m(p,g);else if(g.isMeshDepthMaterial)s(p,g);else if(g.isMeshDistanceMaterial)s(p,g),x(p,g);else if(g.isMeshNormalMaterial)s(p,g);else if(g.isLineBasicMaterial){if(o(p,g),g.isLineDashedMaterial)a(p,g)}else if(g.isPointsMaterial)c(p,g,A,E);else if(g.isSpriteMaterial)l(p,g);else if(g.isShadowMaterial)p.color.value.copy(g.color),p.opacity.value=g.opacity;else if(g.isShaderMaterial)g.uniformsNeedUpdate=!1}function s(p,g){if(p.opacity.value=g.opacity,g.color)p.diffuse.value.copy(g.color);if(g.emissive)p.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity);if(g.map)p.map.value=g.map,n(g.map,p.mapTransform);if(g.alphaMap)p.alphaMap.value=g.alphaMap,n(g.alphaMap,p.alphaMapTransform);if(g.bumpMap){if(p.bumpMap.value=g.bumpMap,n(g.bumpMap,p.bumpMapTransform),p.bumpScale.value=g.bumpScale,g.side===jt)p.bumpScale.value*=-1}if(g.normalMap){if(p.normalMap.value=g.normalMap,n(g.normalMap,p.normalMapTransform),p.normalScale.value.copy(g.normalScale),g.side===jt)p.normalScale.value.negate()}if(g.displacementMap)p.displacementMap.value=g.displacementMap,n(g.displacementMap,p.displacementMapTransform),p.displacementScale.value=g.displacementScale,p.displacementBias.value=g.displacementBias;if(g.emissiveMap)p.emissiveMap.value=g.emissiveMap,n(g.emissiveMap,p.emissiveMapTransform);if(g.specularMap)p.specularMap.value=g.specularMap,n(g.specularMap,p.specularMapTransform);if(g.alphaTest>0)p.alphaTest.value=g.alphaTest;let A=t.get(g),{envMap:E,envMapRotation:y}=A;if(E){if(p.envMap.value=E,p.envMapRotation.value.setFromMatrix4(IA.makeRotationFromEuler(y)).transpose(),E.isCubeTexture&&E.isRenderTargetTexture===!1)p.envMapRotation.value.premultiply(wx);p.reflectivity.value=g.reflectivity,p.ior.value=g.ior,p.refractionRatio.value=g.refractionRatio}if(g.lightMap)p.lightMap.value=g.lightMap,p.lightMapIntensity.value=g.lightMapIntensity,n(g.lightMap,p.lightMapTransform);if(g.aoMap)p.aoMap.value=g.aoMap,p.aoMapIntensity.value=g.aoMapIntensity,n(g.aoMap,p.aoMapTransform)}function o(p,g){if(p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,g.map)p.map.value=g.map,n(g.map,p.mapTransform)}function a(p,g){p.dashSize.value=g.dashSize,p.totalSize.value=g.dashSize+g.gapSize,p.scale.value=g.scale}function c(p,g,A,E){if(p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.size.value=g.size*A,p.scale.value=E*0.5,g.map)p.map.value=g.map,n(g.map,p.uvTransform);if(g.alphaMap)p.alphaMap.value=g.alphaMap,n(g.alphaMap,p.alphaMapTransform);if(g.alphaTest>0)p.alphaTest.value=g.alphaTest}function l(p,g){if(p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.rotation.value=g.rotation,g.map)p.map.value=g.map,n(g.map,p.mapTransform);if(g.alphaMap)p.alphaMap.value=g.alphaMap,n(g.alphaMap,p.alphaMapTransform);if(g.alphaTest>0)p.alphaTest.value=g.alphaTest}function u(p,g){p.specular.value.copy(g.specular),p.shininess.value=Math.max(g.shininess,0.0001)}function h(p,g){if(g.gradientMap)p.gradientMap.value=g.gradientMap}function f(p,g){if(p.metalness.value=g.metalness,g.metalnessMap)p.metalnessMap.value=g.metalnessMap,n(g.metalnessMap,p.metalnessMapTransform);if(p.roughness.value=g.roughness,g.roughnessMap)p.roughnessMap.value=g.roughnessMap,n(g.roughnessMap,p.roughnessMapTransform);if(g.envMap)p.envMapIntensity.value=g.envMapIntensity}function d(p,g,A){if(p.ior.value=g.ior,g.sheen>0){if(p.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),p.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap)p.sheenColorMap.value=g.sheenColorMap,n(g.sheenColorMap,p.sheenColorMapTransform);if(g.sheenRoughnessMap)p.sheenRoughnessMap.value=g.sheenRoughnessMap,n(g.sheenRoughnessMap,p.sheenRoughnessMapTransform)}if(g.clearcoat>0){if(p.clearcoat.value=g.clearcoat,p.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap)p.clearcoatMap.value=g.clearcoatMap,n(g.clearcoatMap,p.clearcoatMapTransform);if(g.clearcoatRoughnessMap)p.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,n(g.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform);if(g.clearcoatNormalMap){if(p.clearcoatNormalMap.value=g.clearcoatNormalMap,n(g.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===jt)p.clearcoatNormalScale.value.negate()}}if(g.dispersion>0)p.dispersion.value=g.dispersion;if(g.iridescence>0){if(p.iridescence.value=g.iridescence,p.iridescenceIOR.value=g.iridescenceIOR,p.iridescenceThicknessMinimum.value=g.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=g.iridescenceThicknessRange[1],g.iridescenceMap)p.iridescenceMap.value=g.iridescenceMap,n(g.iridescenceMap,p.iridescenceMapTransform);if(g.iridescenceThicknessMap)p.iridescenceThicknessMap.value=g.iridescenceThicknessMap,n(g.iridescenceThicknessMap,p.iridescenceThicknessMapTransform)}if(g.transmission>0){if(p.transmission.value=g.transmission,p.transmissionSamplerMap.value=A.texture,p.transmissionSamplerSize.value.set(A.width,A.height),g.transmissionMap)p.transmissionMap.value=g.transmissionMap,n(g.transmissionMap,p.transmissionMapTransform);if(p.thickness.value=g.thickness,g.thicknessMap)p.thicknessMap.value=g.thicknessMap,n(g.thicknessMap,p.thicknessMapTransform);p.attenuationDistance.value=g.attenuationDistance,p.attenuationColor.value.copy(g.attenuationColor)}if(g.anisotropy>0){if(p.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap)p.anisotropyMap.value=g.anisotropyMap,n(g.anisotropyMap,p.anisotropyMapTransform)}if(p.specularIntensity.value=g.specularIntensity,p.specularColor.value.copy(g.specularColor),g.specularColorMap)p.specularColorMap.value=g.specularColorMap,n(g.specularColorMap,p.specularColorMapTransform);if(g.specularIntensityMap)p.specularIntensityMap.value=g.specularIntensityMap,n(g.specularIntensityMap,p.specularIntensityMapTransform)}function m(p,g){if(g.matcap)p.matcap.value=g.matcap}function x(p,g){let A=t.get(g).light;p.referencePosition.value.setFromMatrixPosition(A.matrixWorld),p.nearDistance.value=A.shadow.camera.near,p.farDistance.value=A.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function LA(e,t,n,i){let r={},s={},o=[],a=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(y,w){let T=w.program;i.uniformBlockBinding(y,T)}function l(y,w){let T=r[y.id];if(T===void 0)p(y),T=u(y),r[y.id]=T,y.addEventListener("dispose",A);let R=w.program;i.updateUBOMapping(y,R);let _=t.render.frame;if(s[y.id]!==_)f(y),s[y.id]=_}function u(y){let w=h();y.__bindingPointIndex=w;let T=e.createBuffer(),{__size:R,usage:_}=y;return e.bindBuffer(e.UNIFORM_BUFFER,T),e.bufferData(e.UNIFORM_BUFFER,R,_),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,w,T),T}function h(){for(let y=0;y<a;y++)if(o.indexOf(y)===-1)return o.push(y),y;return Ne("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(y){let w=r[y.id],{uniforms:T,__cache:R}=y;e.bindBuffer(e.UNIFORM_BUFFER,w);for(let _=0,S=T.length;_<S;_++){let U=T[_];if(Array.isArray(U))for(let C=0,z=U.length;C<z;C++)d(U[C],_,C,R);else d(U,_,0,R)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function d(y,w,T,R){if(x(y,w,T,R)===!0){let{__offset:_,value:S}=y;if(Array.isArray(S)){let U=0;for(let C=0;C<S.length;C++){let z=S[C],j=g(z);if(m(z,y.__data,U),typeof z!=="number"&&typeof z!=="boolean"&&!z.isMatrix3&&!ArrayBuffer.isView(z))U+=j.storage/Float32Array.BYTES_PER_ELEMENT}}else m(S,y.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,_,y.__data)}}function m(y,w,T){if(typeof y==="number"||typeof y==="boolean")w[0]=y;else if(y.isMatrix3)w[0]=y.elements[0],w[1]=y.elements[1],w[2]=y.elements[2],w[3]=0,w[4]=y.elements[3],w[5]=y.elements[4],w[6]=y.elements[5],w[7]=0,w[8]=y.elements[6],w[9]=y.elements[7],w[10]=y.elements[8],w[11]=0;else if(ArrayBuffer.isView(y))w.set(new y.constructor(y.buffer,y.byteOffset,w.length));else y.toArray(w,T)}function x(y,w,T,R){let _=y.value,S=w+"_"+T;if(R[S]===void 0){if(typeof _==="number"||typeof _==="boolean")R[S]=_;else if(ArrayBuffer.isView(_))R[S]=_.slice();else R[S]=_.clone();return!0}else{let U=R[S];if(typeof _==="number"||typeof _==="boolean"){if(U!==_)return R[S]=_,!0}else if(ArrayBuffer.isView(_))return!0;else if(U.equals(_)===!1)return U.copy(_),!0}return!1}function p(y){let w=y.uniforms,T=0,R=16;for(let S=0,U=w.length;S<U;S++){let C=Array.isArray(w[S])?w[S]:[w[S]];for(let z=0,j=C.length;z<j;z++){let F=C[z],H=Array.isArray(F.value)?F.value:[F.value];for(let V=0,O=H.length;V<O;V++){let K=H[V],Q=g(K),se=T%R,me=se%Q.boundary,_e=se+me;if(T+=me,_e!==0&&R-_e<Q.storage)T+=R-_e;F.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),F.__offset=T,T+=Q.storage}}}let _=T%R;if(_>0)T+=R-_;return y.__size=T,y.__cache={},this}function g(y){let w={boundary:0,storage:0};if(typeof y==="number"||typeof y==="boolean")w.boundary=4,w.storage=4;else if(y.isVector2)w.boundary=8,w.storage=8;else if(y.isVector3||y.isColor)w.boundary=16,w.storage=12;else if(y.isVector4)w.boundary=16,w.storage=16;else if(y.isMatrix3)w.boundary=48,w.storage=48;else if(y.isMatrix4)w.boundary=64,w.storage=64;else if(y.isTexture)Me("WebGLRenderer: Texture samplers can not be part of an uniforms group.");else if(ArrayBuffer.isView(y))w.boundary=16,w.storage=y.byteLength;else Me("WebGLRenderer: Unsupported uniform value type.",y);return w}function A(y){let w=y.target;w.removeEventListener("dispose",A);let T=o.indexOf(w.__bindingPointIndex);o.splice(T,1),e.deleteBuffer(r[w.id]),delete r[w.id],delete s[w.id]}function E(){for(let y in r)e.deleteBuffer(r[y]);o=[],r={},s={}}return{bind:c,update:l,dispose:E}}var NA=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),oi=null;function DA(){if(oi===null)oi=new co(NA,16,16,br,wi),oi.name="DFG_LUT",oi.minFilter=Ht,oi.magFilter=Ht,oi.wrapS=rs,oi.wrapT=rs,oi.generateMipmaps=!1,oi.needsUpdate=!0;return oi}class kh{constructor(e={}){let{canvas:t=P0(),context:n=null,depth:i=!0,stencil:r=!1,alpha:s=!1,antialias:o=!1,premultipliedAlpha:a=!0,preserveDrawingBuffer:c=!1,powerPreference:l="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:h=!1,outputBufferType:f=Gn}=e;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=s;let m=f,x=new Set([Tu,wu,Mu]),p=new Set([Gn,$i,to,os,bu,Su]),g=new Uint32Array(4),A=new Int32Array(4),E=new N,y=null,w=null,T=[],R=[],_=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=kn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let S=this,U=!1,C=null,z=null,j=null,F=null;this._outputColorSpace=Wi;let H=0,V=0,O=null,K=-1,Q=null,se=new st,me=new st,_e=null,qe=new Le(0),Ge=0,{width:Z,height:ne}=t,fe=1,de=null,Re=null,Ze=new st(0,0,Z,ne),Ue=new st(0,0,Z,ne),ke=!1,Ke=new uo,Ye=!1,Je=!1,Ft=new ze,vn=new N,mt=new st,Vt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},zt=!1;function Pt(){return O===null?fe:1}let L=n;function yn(b,D){return t.getContext(b,D)}try{let b={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:a,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if("setAttribute"in t)t.setAttribute("data-engine",`three.js r${F_}`);if(t.addEventListener("webglcontextlost",Fe,!1),t.addEventListener("webglcontextrestored",St,!1),t.addEventListener("webglcontextcreationerror",ft,!1),L===null){if(L=yn("webgl2",b),L===null)if(yn("webgl2"))throw Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.");else throw Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(b){throw Ne("WebGLRenderer: "+b.message),b}let it,gt,M,v,I,W,te,ie,le,X,J,xe,we,ue,re,Ce,Pe,et,P,oe,Y,ae,ve;function ee(){if(it=new GT(L),it.init(),Y=new AA(L,it),gt=new NT(L,it,e,Y),M=new TA(L,it),gt.reversedDepthBuffer&&h)M.buffers.depth.setReversed(!0);z=L.createFramebuffer(),j=L.createFramebuffer(),F=L.createFramebuffer(),v=new $T(L),I=new hA,W=new EA(L,it,M,I,gt,Y,v),te=new BT(S),ie=new qS(L),ae=new PT(L,ie),le=new HT(L,ie,v,ae),X=new ZT(L,le,ie,ae,v),et=new WT(L,gt,W),re=new DT(I),J=new uA(S,te,it,gt,ae,re),xe=new PA(S,I),we=new dA,ue=new vA(it),Pe=new IT(S,te,M,X,d,a),Ce=new wA(S,X,gt),ve=new LA(L,v,gt,M),P=new LT(L,it,v),oe=new VT(L,it,v),v.programs=J.programs,S.capabilities=gt,S.extensions=it,S.properties=I,S.renderLists=we,S.shadowMap=Ce,S.state=M,S.info=v}if(ee(),m!==Gn)_=new qT(m,t.width,t.height,o,i,r);let ce=new Mx(S,L);this.xr=ce,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){let b=it.get("WEBGL_lose_context");if(b)b.loseContext()},this.forceContextRestore=function(){let b=it.get("WEBGL_lose_context");if(b)b.restoreContext()},this.getPixelRatio=function(){return fe},this.setPixelRatio=function(b){if(b===void 0)return;fe=b,this.setSize(Z,ne,!1)},this.getSize=function(b){return b.set(Z,ne)},this.setSize=function(b,D,G=!0){if(ce.isPresenting){Me("WebGLRenderer: Can't change size while VR device is presenting.");return}if(Z=b,ne=D,t.width=Math.floor(b*fe),t.height=Math.floor(D*fe),G===!0)t.style.width=b+"px",t.style.height=D+"px";if(_!==null)_.setSize(t.width,t.height);this.setViewport(0,0,b,D)},this.getDrawingBufferSize=function(b){return b.set(Z*fe,ne*fe).floor()},this.setDrawingBufferSize=function(b,D,G){Z=b,ne=D,fe=G,t.width=Math.floor(b*G),t.height=Math.floor(D*G),this.setViewport(0,0,b,D)},this.setEffects=function(b){if(m===Gn){Ne("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let D=0;D<b.length;D++)if(b[D].isOutputPass===!0){Me("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}_.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(se)},this.getViewport=function(b){return b.copy(Ze)},this.setViewport=function(b,D,G,k){if(b.isVector4)Ze.set(b.x,b.y,b.z,b.w);else Ze.set(b,D,G,k);M.viewport(se.copy(Ze).multiplyScalar(fe).round())},this.getScissor=function(b){return b.copy(Ue)},this.setScissor=function(b,D,G,k){if(b.isVector4)Ue.set(b.x,b.y,b.z,b.w);else Ue.set(b,D,G,k);M.scissor(me.copy(Ue).multiplyScalar(fe).round())},this.getScissorTest=function(){return ke},this.setScissorTest=function(b){M.setScissorTest(ke=b)},this.setOpaqueSort=function(b){de=b},this.setTransparentSort=function(b){Re=b},this.getClearColor=function(b){return b.copy(Pe.getClearColor())},this.setClearColor=function(){Pe.setClearColor(...arguments)},this.getClearAlpha=function(){return Pe.getClearAlpha()},this.setClearAlpha=function(){Pe.setClearAlpha(...arguments)},this.clear=function(b=!0,D=!0,G=!0){let k=0;if(b){let B=!1;if(O!==null){let ge=O.texture.format;B=x.has(ge)}if(B){let ge=O.texture.type,be=p.has(ge),pe=Pe.getClearColor(),Se=Pe.getClearAlpha(),{r:Ee,g:Be,b:Ve}=pe;if(be)g[0]=Ee,g[1]=Be,g[2]=Ve,g[3]=Se,L.clearBufferuiv(L.COLOR,0,g);else A[0]=Ee,A[1]=Be,A[2]=Ve,A[3]=Se,L.clearBufferiv(L.COLOR,0,A)}else k|=L.COLOR_BUFFER_BIT}if(D)k|=L.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0);if(G)k|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295);if(k!==0)L.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),C=b},this.dispose=function(){t.removeEventListener("webglcontextlost",Fe,!1),t.removeEventListener("webglcontextrestored",St,!1),t.removeEventListener("webglcontextcreationerror",ft,!1),Pe.dispose(),we.dispose(),ue.dispose(),I.dispose(),te.dispose(),X.dispose(),ae.dispose(),ve.dispose(),J.dispose(),ce.dispose(),ce.removeEventListener("sessionstart",rf),ce.removeEventListener("sessionend",sf),rr.stop()};function Fe(b){b.preventDefault(),js("WebGLRenderer: Context Lost."),U=!0}function St(){js("WebGLRenderer: Context Restored."),U=!1;let b=v.autoReset,D=Ce.enabled,G=Ce.autoUpdate,k=Ce.needsUpdate,B=Ce.type;ee(),v.autoReset=b,Ce.enabled=D,Ce.autoUpdate=G,Ce.needsUpdate=k,Ce.type=B}function ft(b){Ne("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function Vn(b){let D=b.target;D.removeEventListener("dispose",Vn),li(D)}function li(b){dv(b),I.remove(b)}function dv(b){let D=I.get(b).programs;if(D!==void 0){if(D.forEach(function(G){J.releaseProgram(G)}),b.isShaderMaterial)J.releaseShaderCache(b)}}this.renderBufferDirect=function(b,D,G,k,B,ge){if(D===null)D=Vt;let be=B.isMesh&&B.matrixWorld.determinantAffine()<0,pe=gv(b,D,G,k,B);M.setMaterial(k,be);let Se=G.index,Ee=1;if(k.wireframe===!0){if(Se=le.getWireframeAttribute(G),Se===void 0)return;Ee=2}let Be=G.drawRange,Ve=G.attributes.position,Ae=Be.start*Ee,ot=(Be.start+Be.count)*Ee;if(ge!==null)Ae=Math.max(Ae,ge.start*Ee),ot=Math.min(ot,(ge.start+ge.count)*Ee);if(Se!==null)Ae=Math.max(Ae,0),ot=Math.min(ot,Se.count);else if(Ve!==void 0&&Ve!==null)Ae=Math.max(Ae,0),ot=Math.min(ot,Ve.count);let Tt=ot-Ae;if(Tt<0||Tt===1/0)return;ae.setup(B,k,pe,G,Se);let Mt,lt=P;if(Se!==null)Mt=ie.get(Se),lt=oe,lt.setIndex(Mt);if(B.isMesh)if(k.wireframe===!0)M.setLineWidth(k.wireframeLinewidth*Pt()),lt.setMode(L.LINES);else lt.setMode(L.TRIANGLES);else if(B.isLine){let Wt=k.linewidth;if(Wt===void 0)Wt=1;if(M.setLineWidth(Wt*Pt()),B.isLineSegments)lt.setMode(L.LINES);else if(B.isLineLoop)lt.setMode(L.LINE_LOOP);else lt.setMode(L.LINE_STRIP)}else if(B.isPoints)lt.setMode(L.POINTS);else if(B.isSprite)lt.setMode(L.TRIANGLES);if(B.isBatchedMesh)if(!it.get("WEBGL_multi_draw")){let{_multiDrawStarts:Wt,_multiDrawCounts:ye,_multiDrawCount:an}=B,Qe=Se?ie.get(Se).bytesPerElement:1,bn=I.get(k).currentProgram.getUniforms();for(let $n=0;$n<an;$n++)bn.setValue(L,"_gl_DrawID",$n),lt.render(Wt[$n]/Qe,ye[$n])}else lt.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else if(B.isInstancedMesh)lt.renderInstances(Ae,Tt,B.count);else if(G.isInstancedBufferGeometry){let Wt=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,ye=Math.min(G.instanceCount,Wt);lt.renderInstances(Ae,Tt,ye)}else lt.render(Ae,Tt)};function nf(b,D,G){if(b.transparent===!0&&b.side===Tn&&b.forceSinglePass===!1)b.side=jt,b.needsUpdate=!0,Io(b,D,G),b.side=Vi,b.needsUpdate=!0,Io(b,D,G),b.side=Tn;else Io(b,D,G)}this.compile=function(b,D,G=null){if(G===null)G=b;if(w=ue.get(G),w.init(D),R.push(w),G.traverseVisible(function(B){if(B.isLight&&B.layers.test(D.layers)){if(w.pushLight(B),B.castShadow)w.pushShadow(B)}}),b!==G)b.traverseVisible(function(B){if(B.isLight&&B.layers.test(D.layers)){if(w.pushLight(B),B.castShadow)w.pushShadow(B)}});w.setupLights();let k=new Set;return b.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let ge=B.material;if(ge)if(Array.isArray(ge))for(let be=0;be<ge.length;be++){let pe=ge[be];nf(pe,G,B),k.add(pe)}else nf(ge,G,B),k.add(ge)}),w=R.pop(),k},this.compileAsync=function(b,D,G=null){let k=this.compile(b,D,G);return new Promise((B)=>{function ge(){if(k.forEach(function(be){if(I.get(be).currentProgram.isReady())k.delete(be)}),k.size===0){B(b);return}setTimeout(ge,10)}if(it.get("KHR_parallel_shader_compile")!==null)ge();else setTimeout(ge,10)})};let wc=null;function pv(b){if(wc)wc(b)}function rf(){rr.stop()}function sf(){rr.start()}let rr=new hx;if(rr.setAnimationLoop(pv),typeof self<"u")rr.setContext(self);this.setAnimationLoop=function(b){wc=b,ce.setAnimationLoop(b),b===null?rr.stop():rr.start()},ce.addEventListener("sessionstart",rf),ce.addEventListener("sessionend",sf),this.render=function(b,D){if(D!==void 0&&D.isCamera!==!0){Ne("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(U===!0)return;if(C!==null)C.renderStart(b,D);let G=ce.enabled===!0&&ce.isPresenting===!0,k=_!==null&&(O===null||G)&&_.begin(S,O);if(b.matrixWorldAutoUpdate===!0)b.updateMatrixWorld();if(D.parent===null&&D.matrixWorldAutoUpdate===!0)D.updateMatrixWorld();if(ce.enabled===!0&&ce.isPresenting===!0&&(_===null||_.isCompositing()===!1)){if(ce.cameraAutoUpdate===!0)ce.updateCamera(D);D=ce.getCamera()}if(b.isScene===!0)b.onBeforeRender(S,b,D,O);if(w=ue.get(b,R.length),w.init(D),w.state.textureUnits=W.getTextureUnits(),R.push(w),Ft.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),Ke.setFromProjectionMatrix(Ft,ah,D.reversedDepth),Je=this.localClippingEnabled,Ye=re.init(this.clippingPlanes,Je),y=we.get(b,T.length),y.init(),T.push(y),ce.enabled===!0&&ce.isPresenting===!0){let be=S.xr.getDepthSensingMesh();if(be!==null)Tc(be,D,-1/0,S.sortObjects)}if(Tc(b,D,0,S.sortObjects),y.finish(),S.sortObjects===!0)y.sort(de,Re,D.reversedDepth);if(zt=ce.enabled===!1||ce.isPresenting===!1||ce.hasDepthSensing()===!1,zt)Pe.addToRenderList(y,b);if(this.info.render.frame++,this.info.autoReset===!0)this.info.reset();if(Ye===!0)re.beginShadows();let B=w.state.shadowsArray;if(Ce.render(B,b,D),Ye===!0)re.endShadows();if((k&&_.hasRenderPass())===!1){let be=y.opaque,pe=y.transmissive;if(w.setupLights(),D.isArrayCamera){let Se=D.cameras;if(pe.length>0)for(let Ee=0,Be=Se.length;Ee<Be;Ee++){let Ve=Se[Ee];af(be,pe,b,Ve)}if(zt)Pe.render(b);for(let Ee=0,Be=Se.length;Ee<Be;Ee++){let Ve=Se[Ee];of(y,b,Ve,Ve.viewport)}}else{if(pe.length>0)af(be,pe,b,D);if(zt)Pe.render(b);of(y,b,D)}}if(O!==null&&V===0)W.updateMultisampleRenderTarget(O),W.updateRenderTargetMipmap(O);if(k)_.end(S);if(b.isScene===!0)b.onAfterRender(S,b,D);if(ae.resetDefaultState(),K=-1,Q=null,R.pop(),R.length>0){if(w=R[R.length-1],W.setTextureUnits(w.state.textureUnits),Ye===!0)re.setGlobalState(S.clippingPlanes,w.state.camera)}else w=null;if(T.pop(),T.length>0)y=T[T.length-1];else y=null;if(C!==null)C.renderEnd()};function Tc(b,D,G,k){if(b.visible===!1)return;if(b.layers.test(D.layers)){if(b.isGroup)G=b.renderOrder;else if(b.isLOD){if(b.autoUpdate===!0)b.update(D)}else if(b.isLightProbeGrid)w.pushLightProbeGrid(b);else if(b.isLight){if(w.pushLight(b),b.castShadow)w.pushShadow(b)}else if(b.isSprite){if(!b.frustumCulled||Ke.intersectsSprite(b)){if(k)mt.setFromMatrixPosition(b.matrixWorld).applyMatrix4(Ft);let be=X.update(b),pe=b.material;if(pe.visible)y.push(b,be,pe,G,mt.z,null)}}else if(b.isMesh||b.isLine||b.isPoints){if(!b.frustumCulled||Ke.intersectsObject(b)){let be=X.update(b),pe=b.material;if(k){if(b.boundingSphere!==void 0){if(b.boundingSphere===null)b.computeBoundingSphere();mt.copy(b.boundingSphere.center)}else{if(be.boundingSphere===null)be.computeBoundingSphere();mt.copy(be.boundingSphere.center)}mt.applyMatrix4(b.matrixWorld).applyMatrix4(Ft)}if(Array.isArray(pe)){let Se=be.groups;for(let Ee=0,Be=Se.length;Ee<Be;Ee++){let Ve=Se[Ee],Ae=pe[Ve.materialIndex];if(Ae&&Ae.visible)y.push(b,be,Ae,G,mt.z,Ve)}}else if(pe.visible)y.push(b,be,pe,G,mt.z,null)}}}let ge=b.children;for(let be=0,pe=ge.length;be<pe;be++)Tc(ge[be],D,G,k)}function of(b,D,G,k){let{opaque:B,transmissive:ge,transparent:be}=b;if(w.setupLightsView(G),Ye===!0)re.setGlobalState(S.clippingPlanes,G);if(k)M.viewport(se.copy(k));if(B.length>0)Co(B,D,G);if(ge.length>0)Co(ge,D,G);if(be.length>0)Co(be,D,G);M.buffers.depth.setTest(!0),M.buffers.depth.setMask(!0),M.buffers.color.setMask(!0),M.setPolygonOffset(!1)}function af(b,D,G,k){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[k.id]===void 0){let Ae=it.has("EXT_color_buffer_half_float")||it.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[k.id]=new En(1,1,{generateMipmaps:!0,type:Ae?wi:Gn,minFilter:ii,samples:Math.max(4,gt.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:$e.workingColorSpace})}let ge=w.state.transmissionRenderTarget[k.id],be=k.viewport||se;ge.setSize(be.z*S.transmissionResolutionScale,be.w*S.transmissionResolutionScale);let pe=S.getRenderTarget(),Se=S.getActiveCubeFace(),Ee=S.getActiveMipmapLevel();if(S.setRenderTarget(ge),S.getClearColor(qe),Ge=S.getClearAlpha(),Ge<1)S.setClearColor(16777215,0.5);if(S.clear(),zt)Pe.render(G);let Be=S.toneMapping;S.toneMapping=kn;let Ve=k.viewport;if(k.viewport!==void 0)k.viewport=void 0;if(w.setupLightsView(k),Ye===!0)re.setGlobalState(S.clippingPlanes,k);if(Co(b,G,k),W.updateMultisampleRenderTarget(ge),W.updateRenderTargetMipmap(ge),it.has("WEBGL_multisampled_render_to_texture")===!1){let Ae=!1;for(let ot=0,Tt=D.length;ot<Tt;ot++){let Mt=D[ot],{object:lt,geometry:Wt,material:ye,group:an}=Mt;if(ye.side===Tn&&lt.layers.test(k.layers)){let Qe=ye.side;ye.side=jt,ye.needsUpdate=!0,cf(lt,G,k,Wt,ye,an),ye.side=Qe,ye.needsUpdate=!0,Ae=!0}}if(Ae===!0)W.updateMultisampleRenderTarget(ge),W.updateRenderTargetMipmap(ge)}if(S.setRenderTarget(pe,Se,Ee),S.setClearColor(qe,Ge),Ve!==void 0)k.viewport=Ve;S.toneMapping=Be}function Co(b,D,G){let k=D.isScene===!0?D.overrideMaterial:null;for(let B=0,ge=b.length;B<ge;B++){let be=b[B],{object:pe,geometry:Se,group:Ee}=be,Be=be.material;if(Be.allowOverride===!0&&k!==null)Be=k;if(pe.layers.test(G.layers))cf(pe,D,G,Se,Be,Ee)}}function cf(b,D,G,k,B,ge){if(b.onBeforeRender(S,D,G,k,B,ge),b.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),B.onBeforeRender(S,D,G,k,b,ge),B.transparent===!0&&B.side===Tn&&B.forceSinglePass===!1)B.side=jt,B.needsUpdate=!0,S.renderBufferDirect(G,D,k,B,b,ge),B.side=Vi,B.needsUpdate=!0,S.renderBufferDirect(G,D,k,B,b,ge),B.side=Tn;else S.renderBufferDirect(G,D,k,B,b,ge);b.onAfterRender(S,D,G,k,B,ge)}function Io(b,D,G){if(D.isScene!==!0)D=Vt;let k=I.get(b),B=w.state.lights,ge=w.state.shadowsArray,be=B.state.version,pe=J.getParameters(b,B.state,ge,D,G,w.state.lightProbeGridArray),Se=J.getProgramCacheKey(pe),Ee=k.programs;k.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?D.environment:null,k.fog=D.fog;let Be=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;if(k.envMap=te.get(b.envMap||k.environment,Be),k.envMapRotation=k.environment!==null&&b.envMap===null?D.environmentRotation:b.envMapRotation,Ee===void 0)b.addEventListener("dispose",Vn),Ee=new Map,k.programs=Ee;let Ve=Ee.get(Se);if(Ve!==void 0){if(k.currentProgram===Ve&&k.lightsStateVersion===be)return uf(b,pe),Ve}else{if(pe.uniforms=J.getUniforms(b),C!==null&&b.isNodeMaterial)C.build(b,G,pe);b.onBeforeCompile(pe,S),Ve=J.acquireProgram(pe,Se),Ee.set(Se,Ve),k.uniforms=pe.uniforms}let Ae=k.uniforms;if(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)Ae.clippingPlanes=re.uniform;if(uf(b,pe),k.needsLights=xv(b),k.lightsStateVersion=be,k.needsLights)Ae.ambientLightColor.value=B.state.ambient,Ae.lightProbe.value=B.state.probe,Ae.directionalLights.value=B.state.directional,Ae.directionalLightShadows.value=B.state.directionalShadow,Ae.spotLights.value=B.state.spot,Ae.spotLightShadows.value=B.state.spotShadow,Ae.rectAreaLights.value=B.state.rectArea,Ae.ltc_1.value=B.state.rectAreaLTC1,Ae.ltc_2.value=B.state.rectAreaLTC2,Ae.pointLights.value=B.state.point,Ae.pointLightShadows.value=B.state.pointShadow,Ae.hemisphereLights.value=B.state.hemi,Ae.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Ae.spotLightMatrix.value=B.state.spotLightMatrix,Ae.spotLightMap.value=B.state.spotLightMap,Ae.pointShadowMatrix.value=B.state.pointShadowMatrix;return k.lightProbeGrid=w.state.lightProbeGridArray.length>0,k.currentProgram=Ve,k.uniformsList=null,Ve}function lf(b){if(b.uniformsList===null){let D=b.currentProgram.getUniforms();b.uniformsList=bo.seqWithValue(D.seq,b.uniforms)}return b.uniformsList}function uf(b,D){let G=I.get(b);G.outputColorSpace=D.outputColorSpace,G.batching=D.batching,G.batchingColor=D.batchingColor,G.instancing=D.instancing,G.instancingColor=D.instancingColor,G.instancingMorph=D.instancingMorph,G.skinning=D.skinning,G.morphTargets=D.morphTargets,G.morphNormals=D.morphNormals,G.morphColors=D.morphColors,G.morphTargetsCount=D.morphTargetsCount,G.numClippingPlanes=D.numClippingPlanes,G.numIntersection=D.numClipIntersection,G.vertexAlphas=D.vertexAlphas,G.vertexTangents=D.vertexTangents,G.toneMapping=D.toneMapping}function mv(b,D){if(b.length===0)return null;if(b.length===1)return b[0].texture!==null?b[0]:null;E.setFromMatrixPosition(D.matrixWorld);for(let G=0,k=b.length;G<k;G++){let B=b[G];if(B.texture!==null&&B.boundingBox.containsPoint(E))return B}return null}function gv(b,D,G,k,B){if(D.isScene!==!0)D=Vt;W.resetTextureUnits();let ge=D.fog,be=k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial?D.environment:null,pe=O===null?S.outputColorSpace:O.isXRRenderTarget===!0?O.texture.colorSpace:$e.workingColorSpace,Se=k.isMeshStandardMaterial||k.isMeshLambertMaterial&&!k.envMap||k.isMeshPhongMaterial&&!k.envMap,Ee=te.get(k.envMap||be,Se),Be=k.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Ve=!!G.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),Ae=!!G.morphAttributes.position,ot=!!G.morphAttributes.normal,Tt=!!G.morphAttributes.color,Mt=kn;if(k.toneMapped){if(O===null||O.isXRRenderTarget===!0)Mt=S.toneMapping}let lt=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,Wt=lt!==void 0?lt.length:0,ye=I.get(k),an=w.state.lights;if(Ye===!0){if(Je===!0||b!==Q){let dt=b===Q&&k.id===K;re.setState(k,b,dt)}}let Qe=!1;if(k.version===ye.__version){if(ye.needsLights&&ye.lightsStateVersion!==an.state.version)Qe=!0;else if(ye.outputColorSpace!==pe)Qe=!0;else if(B.isBatchedMesh&&ye.batching===!1)Qe=!0;else if(!B.isBatchedMesh&&ye.batching===!0)Qe=!0;else if(B.isBatchedMesh&&ye.batchingColor===!0&&B.colorTexture===null)Qe=!0;else if(B.isBatchedMesh&&ye.batchingColor===!1&&B.colorTexture!==null)Qe=!0;else if(B.isInstancedMesh&&ye.instancing===!1)Qe=!0;else if(!B.isInstancedMesh&&ye.instancing===!0)Qe=!0;else if(B.isSkinnedMesh&&ye.skinning===!1)Qe=!0;else if(!B.isSkinnedMesh&&ye.skinning===!0)Qe=!0;else if(B.isInstancedMesh&&ye.instancingColor===!0&&B.instanceColor===null)Qe=!0;else if(B.isInstancedMesh&&ye.instancingColor===!1&&B.instanceColor!==null)Qe=!0;else if(B.isInstancedMesh&&ye.instancingMorph===!0&&B.morphTexture===null)Qe=!0;else if(B.isInstancedMesh&&ye.instancingMorph===!1&&B.morphTexture!==null)Qe=!0;else if(ye.envMap!==Ee)Qe=!0;else if(k.fog===!0&&ye.fog!==ge)Qe=!0;else if(ye.numClippingPlanes!==void 0&&(ye.numClippingPlanes!==re.numPlanes||ye.numIntersection!==re.numIntersection))Qe=!0;else if(ye.vertexAlphas!==Be)Qe=!0;else if(ye.vertexTangents!==Ve)Qe=!0;else if(ye.morphTargets!==Ae)Qe=!0;else if(ye.morphNormals!==ot)Qe=!0;else if(ye.morphColors!==Tt)Qe=!0;else if(ye.toneMapping!==Mt)Qe=!0;else if(ye.morphTargetsCount!==Wt)Qe=!0;else if(!!ye.lightProbeGrid!==w.state.lightProbeGridArray.length>0)Qe=!0}else Qe=!0,ye.__version=k.version;let bn=ye.currentProgram;if(Qe===!0){if(bn=Io(k,D,B),C&&k.isNodeMaterial)C.onUpdateProgram(k,bn,ye)}let $n=!1,Ri=!1,Pr=!1,ut=bn.getUniforms(),Et=ye.uniforms;if(M.useProgram(bn.program))$n=!0,Ri=!0,Pr=!0;if(k.id!==K)K=k.id,Ri=!0;if(ye.needsLights){let dt=mv(w.state.lightProbeGridArray,B);if(ye.lightProbeGrid!==dt)ye.lightProbeGrid=dt,Ri=!0}if($n||Q!==b){if(M.buffers.depth.getReversed()&&b.reversedDepth!==!0)b._reversedDepth=!0,b.updateProjectionMatrix();ut.setValue(L,"projectionMatrix",b.projectionMatrix),ut.setValue(L,"viewMatrix",b.matrixWorldInverse);let Ii=ut.map.cameraPosition;if(Ii!==void 0)Ii.setValue(L,vn.setFromMatrixPosition(b.matrixWorld));if(gt.logarithmicDepthBuffer)ut.setValue(L,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2));if(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)ut.setValue(L,"isOrthographic",b.isOrthographicCamera===!0);if(Q!==b)Q=b,Ri=!0,Pr=!0}if(ye.needsLights){if(an.state.directionalShadowMap.length>0)ut.setValue(L,"directionalShadowMap",an.state.directionalShadowMap,W);if(an.state.spotShadowMap.length>0)ut.setValue(L,"spotShadowMap",an.state.spotShadowMap,W);if(an.state.pointShadowMap.length>0)ut.setValue(L,"pointShadowMap",an.state.pointShadowMap,W)}if(B.isSkinnedMesh){ut.setOptional(L,B,"bindMatrix"),ut.setOptional(L,B,"bindMatrixInverse");let dt=B.skeleton;if(dt){if(dt.boneTexture===null)dt.computeBoneTexture();ut.setValue(L,"boneTexture",dt.boneTexture,W)}}if(B.isBatchedMesh){if(ut.setOptional(L,B,"batchingTexture"),ut.setValue(L,"batchingTexture",B._matricesTexture,W),ut.setOptional(L,B,"batchingIdTexture"),ut.setValue(L,"batchingIdTexture",B._indirectTexture,W),ut.setOptional(L,B,"batchingColorTexture"),B._colorsTexture!==null)ut.setValue(L,"batchingColorTexture",B._colorsTexture,W)}let Ci=G.morphAttributes;if(Ci.position!==void 0||Ci.normal!==void 0||Ci.color!==void 0)et.update(B,G,bn);if(Ri||ye.receiveShadow!==B.receiveShadow)ye.receiveShadow=B.receiveShadow,ut.setValue(L,"receiveShadow",B.receiveShadow);if((k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial)&&k.envMap===null&&D.environment!==null)Et.envMapIntensity.value=D.environmentIntensity;if(Et.dfgLUT!==void 0)Et.dfgLUT.value=DA();if(Ri){if(ut.setValue(L,"toneMappingExposure",S.toneMappingExposure),ye.needsLights)_v(Et,Pr);if(ge&&k.fog===!0)xe.refreshFogUniforms(Et,ge);if(xe.refreshMaterialUniforms(Et,k,fe,ne,w.state.transmissionRenderTarget[b.id]),ye.needsLights&&ye.lightProbeGrid){let dt=ye.lightProbeGrid;Et.probesSH.value=dt.texture,Et.probesMin.value.copy(dt.boundingBox.min),Et.probesMax.value.copy(dt.boundingBox.max),Et.probesResolution.value.copy(dt.resolution)}bo.upload(L,lf(ye),Et,W)}if(k.isShaderMaterial&&k.uniformsNeedUpdate===!0)bo.upload(L,lf(ye),Et,W),k.uniformsNeedUpdate=!1;if(k.isSpriteMaterial)ut.setValue(L,"center",B.center);if(ut.setValue(L,"modelViewMatrix",B.modelViewMatrix),ut.setValue(L,"normalMatrix",B.normalMatrix),ut.setValue(L,"modelMatrix",B.matrixWorld),k.uniformsGroups!==void 0){let dt=k.uniformsGroups;for(let Ii=0,Lr=dt.length;Ii<Lr;Ii++){let hf=dt[Ii];ve.update(hf,bn),ve.bind(hf,bn)}}return bn}function _v(b,D){b.ambientLightColor.needsUpdate=D,b.lightProbe.needsUpdate=D,b.directionalLights.needsUpdate=D,b.directionalLightShadows.needsUpdate=D,b.pointLights.needsUpdate=D,b.pointLightShadows.needsUpdate=D,b.spotLights.needsUpdate=D,b.spotLightShadows.needsUpdate=D,b.rectAreaLights.needsUpdate=D,b.hemisphereLights.needsUpdate=D}function xv(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}if(this.getActiveCubeFace=function(){return H},this.getActiveMipmapLevel=function(){return V},this.getRenderTarget=function(){return O},this.setRenderTargetTextures=function(b,D,G){let k=I.get(b);if(k.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,k.__autoAllocateDepthBuffer===!1)k.__useRenderToTexture=!1;I.get(b.texture).__webglTexture=D,I.get(b.depthTexture).__webglTexture=k.__autoAllocateDepthBuffer?void 0:G,k.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,D){let G=I.get(b);G.__webglFramebuffer=D,G.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(b,D=0,G=0){O=b,H=D,V=G;let k=null,B=!1,ge=!1;if(b){let pe=I.get(b);if(pe.__useDefaultFramebuffer!==void 0){M.bindFramebuffer(L.FRAMEBUFFER,pe.__webglFramebuffer),se.copy(b.viewport),me.copy(b.scissor),_e=b.scissorTest,M.viewport(se),M.scissor(me),M.setScissorTest(_e),K=-1;return}else if(pe.__webglFramebuffer===void 0)W.setupRenderTarget(b);else if(pe.__hasExternalTextures)W.rebindTextures(b,I.get(b.texture).__webglTexture,I.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){let Be=b.depthTexture;if(pe.__boundDepthTexture!==Be){if(Be!==null&&I.has(Be)&&(b.width!==Be.image.width||b.height!==Be.image.height))throw Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");W.setupDepthRenderbuffer(b)}}let Se=b.texture;if(Se.isData3DTexture||Se.isDataArrayTexture||Se.isCompressedArrayTexture)ge=!0;let Ee=I.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget){if(Array.isArray(Ee[D]))k=Ee[D][G];else k=Ee[D];B=!0}else if(b.samples>0&&W.useMultisampledRTT(b)===!1)k=I.get(b).__webglMultisampledFramebuffer;else if(Array.isArray(Ee))k=Ee[G];else k=Ee;se.copy(b.viewport),me.copy(b.scissor),_e=b.scissorTest}else se.copy(Ze).multiplyScalar(fe).floor(),me.copy(Ue).multiplyScalar(fe).floor(),_e=ke;if(G!==0)k=z;if(M.bindFramebuffer(L.FRAMEBUFFER,k))M.drawBuffers(b,k);if(M.viewport(se),M.scissor(me),M.setScissorTest(_e),B){let pe=I.get(b.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+D,pe.__webglTexture,G)}else if(ge){let pe=D;for(let Se=0;Se<b.textures.length;Se++){let Ee=I.get(b.textures[Se]);L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0+Se,Ee.__webglTexture,G,pe)}}else if(b!==null&&G!==0){let pe=I.get(b.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,pe.__webglTexture,G)}K=-1},this.readRenderTargetPixels=function(b,D,G,k,B,ge,be,pe=0){if(!(b&&b.isWebGLRenderTarget)){Ne("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Se=I.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&be!==void 0)Se=Se[be];if(Se){M.bindFramebuffer(L.FRAMEBUFFER,Se);try{let Ee=b.textures[pe],{format:Be,type:Ve}=Ee;if(b.textures.length>1)L.readBuffer(L.COLOR_ATTACHMENT0+pe);if(!gt.textureFormatReadable(Be)){Ne("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!gt.textureTypeReadable(Ve)){Ne("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}if(D>=0&&D<=b.width-k&&(G>=0&&G<=b.height-B))L.readPixels(D,G,k,B,Y.convert(Be),Y.convert(Ve),ge)}finally{let Ee=O!==null?I.get(O).__webglFramebuffer:null;M.bindFramebuffer(L.FRAMEBUFFER,Ee)}}},this.readRenderTargetPixelsAsync=async function(b,D,G,k,B,ge,be,pe=0){if(!(b&&b.isWebGLRenderTarget))throw Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Se=I.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&be!==void 0)Se=Se[be];if(Se)if(D>=0&&D<=b.width-k&&(G>=0&&G<=b.height-B)){M.bindFramebuffer(L.FRAMEBUFFER,Se);let Ee=b.textures[pe],{format:Be,type:Ve}=Ee;if(b.textures.length>1)L.readBuffer(L.COLOR_ATTACHMENT0+pe);if(!gt.textureFormatReadable(Be))throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!gt.textureTypeReadable(Ve))throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ae=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,Ae),L.bufferData(L.PIXEL_PACK_BUFFER,ge.byteLength,L.STREAM_READ),L.readPixels(D,G,k,B,Y.convert(Be),Y.convert(Ve),0);let ot=O!==null?I.get(O).__webglFramebuffer:null;M.bindFramebuffer(L.FRAMEBUFFER,ot);let Tt=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await N0(L,Tt,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,Ae),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,ge),L.deleteBuffer(Ae),L.deleteSync(Tt),ge}else throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,D=null,G=0){let k=Math.pow(2,-G),B=Math.floor(b.image.width*k),ge=Math.floor(b.image.height*k),be=D!==null?D.x:0,pe=D!==null?D.y:0;W.setTexture2D(b,0),L.copyTexSubImage2D(L.TEXTURE_2D,G,0,0,be,pe,B,ge),M.unbindTexture()},this.copyTextureToTexture=function(b,D,G=null,k=null,B=0,ge=0){let be,pe,Se,Ee,Be,Ve,Ae,ot,Tt,Mt=b.isCompressedTexture?b.mipmaps[ge]:b.image;if(G!==null)be=G.max.x-G.min.x,pe=G.max.y-G.min.y,Se=G.isBox3?G.max.z-G.min.z:1,Ee=G.min.x,Be=G.min.y,Ve=G.isBox3?G.min.z:0;else{let Et=Math.pow(2,-B);if(be=Math.floor(Mt.width*Et),pe=Math.floor(Mt.height*Et),b.isDataArrayTexture)Se=Mt.depth;else if(b.isData3DTexture)Se=Math.floor(Mt.depth*Et);else Se=1;Ee=0,Be=0,Ve=0}if(k!==null)Ae=k.x,ot=k.y,Tt=k.z;else Ae=0,ot=0,Tt=0;let lt=Y.convert(D.format),Wt=Y.convert(D.type),ye;if(D.isData3DTexture)W.setTexture3D(D,0),ye=L.TEXTURE_3D;else if(D.isDataArrayTexture||D.isCompressedArrayTexture)W.setTexture2DArray(D,0),ye=L.TEXTURE_2D_ARRAY;else W.setTexture2D(D,0),ye=L.TEXTURE_2D;M.activeTexture(L.TEXTURE0),M.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,D.flipY),M.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),M.pixelStorei(L.UNPACK_ALIGNMENT,D.unpackAlignment);let an=M.getParameter(L.UNPACK_ROW_LENGTH),Qe=M.getParameter(L.UNPACK_IMAGE_HEIGHT),bn=M.getParameter(L.UNPACK_SKIP_PIXELS),$n=M.getParameter(L.UNPACK_SKIP_ROWS),Ri=M.getParameter(L.UNPACK_SKIP_IMAGES);M.pixelStorei(L.UNPACK_ROW_LENGTH,Mt.width),M.pixelStorei(L.UNPACK_IMAGE_HEIGHT,Mt.height),M.pixelStorei(L.UNPACK_SKIP_PIXELS,Ee),M.pixelStorei(L.UNPACK_SKIP_ROWS,Be),M.pixelStorei(L.UNPACK_SKIP_IMAGES,Ve);let Pr=b.isDataArrayTexture||b.isData3DTexture,ut=D.isDataArrayTexture||D.isData3DTexture;if(b.isDepthTexture){let Et=I.get(b),Ci=I.get(D),dt=I.get(Et.__renderTarget),Ii=I.get(Ci.__renderTarget);M.bindFramebuffer(L.READ_FRAMEBUFFER,dt.__webglFramebuffer),M.bindFramebuffer(L.DRAW_FRAMEBUFFER,Ii.__webglFramebuffer);for(let Lr=0;Lr<Se;Lr++){if(Pr)L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,I.get(b).__webglTexture,B,Ve+Lr),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,I.get(D).__webglTexture,ge,Tt+Lr);L.blitFramebuffer(Ee,Be,be,pe,Ae,ot,be,pe,L.DEPTH_BUFFER_BIT,L.NEAREST)}M.bindFramebuffer(L.READ_FRAMEBUFFER,null),M.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(B!==0||b.isRenderTargetTexture||I.has(b)){let Et=I.get(b),Ci=I.get(D);M.bindFramebuffer(L.READ_FRAMEBUFFER,j),M.bindFramebuffer(L.DRAW_FRAMEBUFFER,F);for(let dt=0;dt<Se;dt++){if(Pr)L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Et.__webglTexture,B,Ve+dt);else L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,Et.__webglTexture,B);if(ut)L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Ci.__webglTexture,ge,Tt+dt);else L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,Ci.__webglTexture,ge);if(B!==0)L.blitFramebuffer(Ee,Be,be,pe,Ae,ot,be,pe,L.COLOR_BUFFER_BIT,L.NEAREST);else if(ut)L.copyTexSubImage3D(ye,ge,Ae,ot,Tt+dt,Ee,Be,be,pe);else L.copyTexSubImage2D(ye,ge,Ae,ot,Ee,Be,be,pe)}M.bindFramebuffer(L.READ_FRAMEBUFFER,null),M.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(ut)if(b.isDataTexture||b.isData3DTexture)L.texSubImage3D(ye,ge,Ae,ot,Tt,be,pe,Se,lt,Wt,Mt.data);else if(D.isCompressedArrayTexture)L.compressedTexSubImage3D(ye,ge,Ae,ot,Tt,be,pe,Se,lt,Mt.data);else L.texSubImage3D(ye,ge,Ae,ot,Tt,be,pe,Se,lt,Wt,Mt);else if(b.isDataTexture)L.texSubImage2D(L.TEXTURE_2D,ge,Ae,ot,be,pe,lt,Wt,Mt.data);else if(b.isCompressedTexture)L.compressedTexSubImage2D(L.TEXTURE_2D,ge,Ae,ot,Mt.width,Mt.height,lt,Mt.data);else L.texSubImage2D(L.TEXTURE_2D,ge,Ae,ot,be,pe,lt,Wt,Mt);if(M.pixelStorei(L.UNPACK_ROW_LENGTH,an),M.pixelStorei(L.UNPACK_IMAGE_HEIGHT,Qe),M.pixelStorei(L.UNPACK_SKIP_PIXELS,bn),M.pixelStorei(L.UNPACK_SKIP_ROWS,$n),M.pixelStorei(L.UNPACK_SKIP_IMAGES,Ri),ge===0&&D.generateMipmaps)L.generateMipmap(ye);M.unbindTexture()},this.initRenderTarget=function(b){if(I.get(b).__webglFramebuffer===void 0)W.setupRenderTarget(b)},this.initTexture=function(b){if(b.isCubeTexture)W.setTextureCube(b,0);else if(b.isData3DTexture)W.setTexture3D(b,0);else if(b.isDataArrayTexture||b.isCompressedArrayTexture)W.setTexture2DArray(b,0);else W.setTexture2D(b,0);M.unbindTexture()},this.resetState=function(){H=0,V=0,O=null,M.reset(),ae.reset()},typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ah}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=$e._getDrawingBufferColorSpace(e),t.unpackColorSpace=$e._getUnpackColorSpace()}}function Bh(e,t){if(t===ih)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),e;if(t===as||t===no){let n=e.getIndex();if(n===null){let o=[],a=e.getAttribute("position");if(a!==void 0){for(let c=0;c<a.count;c++)o.push(c);e.setIndex(o),n=e.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),e}let i=n.count-2,r=[];if(t===as)for(let o=1;o<=i;o++)r.push(n.getX(0)),r.push(n.getX(o)),r.push(n.getX(o+1));else for(let o=0;o<i;o++)if(o%2===0)r.push(n.getX(o)),r.push(n.getX(o+1)),r.push(n.getX(o+2));else r.push(n.getX(o+2)),r.push(n.getX(o+1)),r.push(n.getX(o));if(r.length/3!==i)console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let s=e.clone();return s.setIndex(r),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",t),e}function Tx(e){let t=new Map,n=new Map,i=e.clone();return Ex(e,i,function(r,s){t.set(s,r),n.set(r,s)}),i.traverse(function(r){if(!r.isSkinnedMesh)return;let s=r,o=t.get(r),a=o.skeleton.bones;s.skeleton=o.skeleton.clone(),s.bindMatrix.copy(o.bindMatrix),s.skeleton.bones=a.map(function(c){return n.get(c)}),s.bind(s.skeleton,s.bindMatrix)}),i}function Ex(e,t,n){n(e,t);for(let i=0;i<e.children.length;i++)Ex(e.children[i],t.children[i],n)}class Xh extends Ai{constructor(e){super(e);this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Dx(t)}),this.register(function(t){return new Ox(t)}),this.register(function(t){return new $x(t)}),this.register(function(t){return new Wx(t)}),this.register(function(t){return new Zx(t)}),this.register(function(t){return new Fx(t)}),this.register(function(t){return new zx(t)}),this.register(function(t){return new kx(t)}),this.register(function(t){return new Bx(t)}),this.register(function(t){return new Nx(t)}),this.register(function(t){return new Gx(t)}),this.register(function(t){return new Ux(t)}),this.register(function(t){return new Vx(t)}),this.register(function(t){return new Hx(t)}),this.register(function(t){return new Px(t)}),this.register(function(t){return new $h(t,Xe.EXT_MESHOPT_COMPRESSION)}),this.register(function(t){return new $h(t,Xe.KHR_MESHOPT_COMPRESSION)}),this.register(function(t){return new Xx(t)})}load(e,t,n,i){let r=this,s;if(this.resourcePath!=="")s=this.resourcePath;else if(this.path!==""){let c=er.extractUrlBase(e);s=er.resolveURL(c,this.path)}else s=er.extractUrlBase(e);this.manager.itemStart(e);let o=function(c){if(i)i(c);else console.error(c);r.manager.itemError(e),r.manager.itemEnd(e)},a=new go(this.manager);a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(c){try{r.parse(c,s,function(l){t(l),r.manager.itemEnd(e)},o)}catch(l){o(l)}},n,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){if(this.pluginCallbacks.indexOf(e)===-1)this.pluginCallbacks.push(e);return this}unregister(e){if(this.pluginCallbacks.indexOf(e)!==-1)this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1);return this}parse(e,t,n,i){let r,s={},o={},a=new TextDecoder;if(typeof e==="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(a.decode(new Uint8Array(e,0,4))===qx){try{s[Xe.KHR_BINARY_GLTF]=new Yx(e)}catch(u){if(i)i(u);return}r=JSON.parse(s[Xe.KHR_BINARY_GLTF].content)}else r=JSON.parse(a.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){if(i)i(Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let c=new ev(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let l=0;l<this.pluginCallbacks.length;l++){let u=this.pluginCallbacks[l](c);if(!u.name)console.error("THREE.GLTFLoader: Invalid plugin found: missing name");o[u.name]=u,s[u.name]=!0}if(r.extensionsUsed)for(let l=0;l<r.extensionsUsed.length;++l){let u=r.extensionsUsed[l],h=r.extensionsRequired||[];switch(u){case Xe.KHR_MATERIALS_UNLIT:s[u]=new Lx;break;case Xe.KHR_DRACO_MESH_COMPRESSION:s[u]=new jx(r,this.dracoLoader);break;case Xe.KHR_TEXTURE_TRANSFORM:s[u]=new Jx;break;case Xe.KHR_MESH_QUANTIZATION:s[u]=new Kx;break;default:if(h.indexOf(u)>=0&&o[u]===void 0)console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(s),c.setPlugins(o),c.parse(n,i)}parseAsync(e,t){let n=this;return new Promise(function(i,r){n.parse(e,t,i,r)})}}function UA(){let e={};return{get:function(t){return e[t]},add:function(t,n){e[t]=n},remove:function(t){delete e[t]},removeAll:function(){e={}}}}function Rt(e,t,n){let i=e.json.materials[t];if(i.extensions&&i.extensions[n])return i.extensions[n];return null}var Xe={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class Px{constructor(e){this.parser=e,this.name=Xe.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let n=0,i=t.length;n<i;n++){let r=t[n];if(r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0)e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,n="light:"+e,i=t.cache.get(n);if(i)return i;let r=t.json,a=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e],c,l=new Le(16777215);if(a.color!==void 0)l.setRGB(a.color[0],a.color[1],a.color[2],pn);let u=a.range!==void 0?a.range:0;switch(a.type){case"directional":c=new ps(l),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new ds(l),c.distance=u;break;case"spot":c=new dc(l),c.distance=u,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,c.angle=a.spot.outerConeAngle,c.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}if(c.position.set(0,0,0),ci(c,a),a.intensity!==void 0)c.intensity=a.intensity;return c.name=t.createUniqueName(a.name||"light_"+e),i=Promise.resolve(c),t.cache.add(n,i),i}getDependency(e,t){if(e!=="light")return;return this._loadLight(t)}createNodeAttachment(e){let t=this,n=this.parser,r=n.json.nodes[e],o=(r.extensions&&r.extensions[this.name]||{}).light;if(o===void 0)return null;return this._loadLight(o).then(function(a){return n._getNodeRef(t.cache,o,a)})}}class Lx{constructor(){this.name=Xe.KHR_MATERIALS_UNLIT}getMaterialType(){return si}extendParams(e,t,n){let i=[];e.color=new Le(1,1,1),e.opacity=1;let r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){let s=r.baseColorFactor;e.color.setRGB(s[0],s[1],s[2],pn),e.opacity=s[3]}if(r.baseColorTexture!==void 0)i.push(n.assignTexture(e,"map",r.baseColorTexture,Wi))}return Promise.all(i)}}class Nx{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();if(n.emissiveStrength!==void 0)t.emissiveIntensity=n.emissiveStrength;return Promise.resolve()}}class Dx{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?gn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(n.clearcoatFactor!==void 0)t.clearcoat=n.clearcoatFactor;if(n.clearcoatTexture!==void 0)i.push(this.parser.assignTexture(t,"clearcoatMap",n.clearcoatTexture));if(n.clearcoatRoughnessFactor!==void 0)t.clearcoatRoughness=n.clearcoatRoughnessFactor;if(n.clearcoatRoughnessTexture!==void 0)i.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",n.clearcoatRoughnessTexture));if(n.clearcoatNormalTexture!==void 0){if(i.push(this.parser.assignTexture(t,"clearcoatNormalMap",n.clearcoatNormalTexture)),n.clearcoatNormalTexture.scale!==void 0){let r=n.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new Ie(r,r)}}return Promise.all(i)}}class Ox{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_DISPERSION}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?gn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();return t.dispersion=n.dispersion!==void 0?n.dispersion:0,Promise.resolve()}}class Ux{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?gn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(n.iridescenceFactor!==void 0)t.iridescence=n.iridescenceFactor;if(n.iridescenceTexture!==void 0)i.push(this.parser.assignTexture(t,"iridescenceMap",n.iridescenceTexture));if(n.iridescenceIor!==void 0)t.iridescenceIOR=n.iridescenceIor;if(t.iridescenceThicknessRange===void 0)t.iridescenceThicknessRange=[100,400];if(n.iridescenceThicknessMinimum!==void 0)t.iridescenceThicknessRange[0]=n.iridescenceThicknessMinimum;if(n.iridescenceThicknessMaximum!==void 0)t.iridescenceThicknessRange[1]=n.iridescenceThicknessMaximum;if(n.iridescenceThicknessTexture!==void 0)i.push(this.parser.assignTexture(t,"iridescenceThicknessMap",n.iridescenceThicknessTexture));return Promise.all(i)}}class Fx{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_SHEEN}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?gn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(t.sheenColor=new Le(0,0,0),t.sheenRoughness=0,t.sheen=1,n.sheenColorFactor!==void 0){let r=n.sheenColorFactor;t.sheenColor.setRGB(r[0],r[1],r[2],pn)}if(n.sheenRoughnessFactor!==void 0)t.sheenRoughness=n.sheenRoughnessFactor;if(n.sheenColorTexture!==void 0)i.push(this.parser.assignTexture(t,"sheenColorMap",n.sheenColorTexture,Wi));if(n.sheenRoughnessTexture!==void 0)i.push(this.parser.assignTexture(t,"sheenRoughnessMap",n.sheenRoughnessTexture));return Promise.all(i)}}class zx{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?gn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(n.transmissionFactor!==void 0)t.transmission=n.transmissionFactor;if(n.transmissionTexture!==void 0)i.push(this.parser.assignTexture(t,"transmissionMap",n.transmissionTexture));return Promise.all(i)}}class kx{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_VOLUME}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?gn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(t.thickness=n.thicknessFactor!==void 0?n.thicknessFactor:0,n.thicknessTexture!==void 0)i.push(this.parser.assignTexture(t,"thicknessMap",n.thicknessTexture));t.attenuationDistance=n.attenuationDistance||1/0;let r=n.attenuationColor||[1,1,1];return t.attenuationColor=new Le().setRGB(r[0],r[1],r[2],pn),Promise.all(i)}}class Bx{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_IOR}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?gn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();if(t.ior=n.ior!==void 0?n.ior:1.5,t.ior===0)t.ior=1000;return Promise.resolve()}}class Gx{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_SPECULAR}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?gn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(t.specularIntensity=n.specularFactor!==void 0?n.specularFactor:1,n.specularTexture!==void 0)i.push(this.parser.assignTexture(t,"specularIntensityMap",n.specularTexture));let r=n.specularColorFactor||[1,1,1];if(t.specularColor=new Le().setRGB(r[0],r[1],r[2],pn),n.specularColorTexture!==void 0)i.push(this.parser.assignTexture(t,"specularColorMap",n.specularColorTexture,Wi));return Promise.all(i)}}class Hx{constructor(e){this.parser=e,this.name=Xe.EXT_MATERIALS_BUMP}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?gn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(t.bumpScale=n.bumpFactor!==void 0?n.bumpFactor:1,n.bumpTexture!==void 0)i.push(this.parser.assignTexture(t,"bumpMap",n.bumpTexture));return Promise.all(i)}}class Vx{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?gn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(n.anisotropyStrength!==void 0)t.anisotropy=n.anisotropyStrength;if(n.anisotropyRotation!==void 0)t.anisotropyRotation=n.anisotropyRotation;if(n.anisotropyTexture!==void 0)i.push(this.parser.assignTexture(t,"anisotropyMap",n.anisotropyTexture));return Promise.all(i)}}class $x{constructor(e){this.parser=e,this.name=Xe.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,n=t.json,i=n.textures[e];if(!i.extensions||!i.extensions[this.name])return null;let r=i.extensions[this.name],s=t.options.ktx2Loader;if(!s)if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");else return null;return t.loadTextureImage(e,r.source,s)}}class Wx{constructor(e){this.parser=e,this.name=Xe.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;let s=r.extensions[t],o=i.images[s.source],a=n.textureLoader;if(o.uri){let c=n.options.manager.getHandler(o.uri);if(c!==null)a=c}return n.loadTextureImage(e,s.source,a)}}class Zx{constructor(e){this.parser=e,this.name=Xe.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;let s=r.extensions[t],o=i.images[s.source],a=n.textureLoader;if(o.uri){let c=n.options.manager.getHandler(o.uri);if(c!==null)a=c}return n.loadTextureImage(e,s.source,a)}}class $h{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){let t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){let i=n.extensions[this.name],r=this.parser.getDependency("buffer",i.buffer),s=this.parser.options.meshoptDecoder;if(!s||!s.supported)if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");else return null;return r.then(function(o){let a=i.byteOffset||0,c=i.byteLength||0,{count:l,byteStride:u}=i,h=new Uint8Array(o,a,c);if(s.decodeGltfBufferAsync)return s.decodeGltfBufferAsync(l,u,h,i.mode,i.filter).then(function(f){return f.buffer});else return s.ready.then(function(){let f=new ArrayBuffer(l*u);return s.decodeGltfBuffer(new Uint8Array(f),l,u,h,i.mode,i.filter),f})})}else return null}}class Xx{constructor(e){this.name=Xe.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;let i=t.meshes[n.mesh];for(let c of i.primitives)if(c.mode!==Rn.TRIANGLES&&c.mode!==Rn.TRIANGLE_STRIP&&c.mode!==Rn.TRIANGLE_FAN&&c.mode!==void 0)return null;let s=n.extensions[this.name].attributes,o=[],a={};for(let c in s)o.push(this.parser.getDependency("accessor",s[c]).then((l)=>(a[c]=l,a[c])));if(o.length<1)return null;return o.push(this.parser.createNodeMesh(e)),Promise.all(o).then((c)=>{let l=c.pop(),u=l.isGroup?l.children:[l],h=c[0].count,f=[];for(let d of u){let m=new ze,x=new N,p=new Gt,g=new N(1,1,1),A=new us(d.geometry,d.material,h);for(let E=0;E<h;E++){if(a.TRANSLATION)x.fromBufferAttribute(a.TRANSLATION,E);if(a.ROTATION)p.fromBufferAttribute(a.ROTATION,E);if(a.SCALE)g.fromBufferAttribute(a.SCALE,E);A.setMatrixAt(E,m.compose(x,p,g))}for(let E in a)if(E==="_COLOR_0"){let y=a[E];A.instanceColor=new gr(y.array,y.itemSize,y.normalized)}else if(E!=="TRANSLATION"&&E!=="ROTATION"&&E!=="SCALE")d.geometry.setAttribute(E,a[E]);at.prototype.copy.call(A,d),this.parser.assignFinalMaterial(A),f.push(A)}if(l.isGroup)return l.clear(),l.add(...f),l;return f[0]})}}var qx="glTF",Mo=12,Ax={JSON:1313821514,BIN:5130562};class Yx{constructor(e){this.name=Xe.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,Mo),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==qx)throw Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");else if(this.header.version<2)throw Error("THREE.GLTFLoader: Legacy binary file detected.");let i=this.header.length-Mo,r=new DataView(e,Mo),s=0;while(s<i){let o=r.getUint32(s,!0);s+=4;let a=r.getUint32(s,!0);if(s+=4,a===Ax.JSON){let c=new Uint8Array(e,Mo+s,o);this.content=n.decode(c)}else if(a===Ax.BIN){let c=Mo+s;this.body=e.slice(c,c+o)}s+=o}if(this.content===null)throw Error("THREE.GLTFLoader: JSON content not found.")}}class jx{constructor(e,t){if(!t)throw Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Xe.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let n=this.json,i=this.dracoLoader,r=e.extensions[this.name].bufferView,s=e.extensions[this.name].attributes,o={},a={},c={};for(let l in s){let u=Wh[l]||l.toLowerCase();o[u]=s[l]}for(let l in e.attributes){let u=Wh[l]||l.toLowerCase();if(s[l]!==void 0){let h=n.accessors[e.attributes[l]],f=_s[h.componentType];c[u]=f.name,a[u]=h.normalized===!0}}return t.getDependency("bufferView",r).then(function(l){return new Promise(function(u,h){i.decodeDracoFile(l,function(f){for(let d in f.attributes){let m=f.attributes[d],x=a[d];if(x!==void 0)m.normalized=x}u(f)},o,c,pn,h)})})}}class Jx{constructor(){this.name=Xe.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){if((t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0)return e;if(e=e.clone(),t.texCoord!==void 0)e.channel=t.texCoord;if(t.offset!==void 0)e.offset.fromArray(t.offset);if(t.rotation!==void 0)e.rotation=t.rotation;if(t.scale!==void 0)e.repeat.fromArray(t.scale);return e.needsUpdate=!0,e}}class Kx{constructor(){this.name=Xe.KHR_MESH_QUANTIZATION}}class qh extends Ei{constructor(e,t,n,i){super(e,t,n,i)}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i*3+i;for(let s=0;s!==i;s++)t[s]=n[r+s];return t}interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=o*2,c=o*3,l=i-t,u=(n-t)/l,h=u*u,f=h*u,d=e*c,m=d-c,x=-2*f+3*h,p=f-h,g=1-x,A=p-h+u;for(let E=0;E!==o;E++){let y=s[m+E+o],w=s[m+E+a]*l,T=s[d+E+o],R=s[d+E]*l;r[E]=g*y+A*w+x*T+p*R}return r}}var FA=new Gt;class Qx extends qh{interpolate_(e,t,n,i){let r=super.interpolate_(e,t,n,i);return FA.fromArray(r).normalize().toArray(r),r}}var Rn={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},_s={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Rx={9728:Bn,9729:Ht,9984:Ga,9985:ss,9986:xr,9987:ii},Cx={33071:rs,33648:Ba,10497:is},Gh={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Wh={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},nr={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},zA={CUBICSPLINE:void 0,LINEAR:qa,STEP:nh},Hh={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function kA(e){if(e.DefaultMaterial===void 0)e.DefaultMaterial=new Ti({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Vi});return e.DefaultMaterial}function Ar(e,t,n){for(let i in n.extensions)if(e[i]===void 0)t.userData.gltfExtensions=t.userData.gltfExtensions||{},t.userData.gltfExtensions[i]=n.extensions[i]}function ci(e,t){if(t.extras!==void 0)if(typeof t.extras==="object")Object.assign(e.userData,t.extras);else console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+t.extras)}function BA(e,t,n){let i=!1,r=!1,s=!1;for(let l=0,u=t.length;l<u;l++){let h=t[l];if(h.POSITION!==void 0)i=!0;if(h.NORMAL!==void 0)r=!0;if(h.COLOR_0!==void 0)s=!0;if(i&&r&&s)break}if(!i&&!r&&!s)return Promise.resolve(e);let o=[],a=[],c=[];for(let l=0,u=t.length;l<u;l++){let h=t[l];if(i){let f=h.POSITION!==void 0?n.getDependency("accessor",h.POSITION):e.attributes.position;o.push(f)}if(r){let f=h.NORMAL!==void 0?n.getDependency("accessor",h.NORMAL):e.attributes.normal;a.push(f)}if(s){let f=h.COLOR_0!==void 0?n.getDependency("accessor",h.COLOR_0):e.attributes.color;c.push(f)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c)]).then(function(l){let u=l[0],h=l[1],f=l[2];if(i)e.morphAttributes.position=u;if(r)e.morphAttributes.normal=h;if(s)e.morphAttributes.color=f;return e.morphTargetsRelative=!0,e})}function GA(e,t){if(e.updateMorphTargets(),t.weights!==void 0)for(let n=0,i=t.weights.length;n<i;n++)e.morphTargetInfluences[n]=t.weights[n];if(t.extras&&Array.isArray(t.extras.targetNames)){let n=t.extras.targetNames;if(e.morphTargetInfluences.length===n.length){e.morphTargetDictionary={};for(let i=0,r=n.length;i<r;i++)e.morphTargetDictionary[n[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function HA(e){let t,n=e.extensions&&e.extensions[Xe.KHR_DRACO_MESH_COMPRESSION];if(n)t="draco:"+n.bufferView+":"+n.indices+":"+Vh(n.attributes);else t=e.indices+":"+Vh(e.attributes)+":"+e.mode;if(e.targets!==void 0)for(let i=0,r=e.targets.length;i<r;i++)t+=":"+Vh(e.targets[i]);return t}function Vh(e){let t="",n=Object.keys(e).sort();for(let i=0,r=n.length;i<r;i++)t+=n[i]+":"+e[n[i]]+";";return t}function Zh(e){switch(e){case Int8Array:return 0.007874015748031496;case Uint8Array:return 0.00392156862745098;case Int16Array:return 0.00003051850947599719;case Uint16Array:return 0.000015259021896696422;default:throw Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function VA(e){if(e.search(/\.jpe?g($|\?)/i)>0||e.search(/^data\:image\/jpeg/)===0)return"image/jpeg";if(e.search(/\.webp($|\?)/i)>0||e.search(/^data\:image\/webp/)===0)return"image/webp";if(e.search(/\.ktx2($|\?)/i)>0||e.search(/^data\:image\/ktx2/)===0)return"image/ktx2";return"image/png"}var $A=new ze;class ev{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new UA,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,r=!1,s=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){let o=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(o)===!0;let a=o.match(/Version\/(\d+)/);i=n&&a?parseInt(a[1],10):-1,r=o.indexOf("Firefox")>-1,s=r?o.match(/Firefox\/([0-9]+)\./)[1]:-1}if(typeof createImageBitmap>"u"||n&&i<17||r&&s<98)this.textureLoader=new lc(this.options.manager);else this.textureLoader=new pc(this.options.manager);if(this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new go(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials")this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let n=this,i=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(s){return s._markDefs&&s._markDefs()}),Promise.all(this._invokeAll(function(s){return s.beforeRoot&&s.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(s){let o={scene:s[0][i.scene||0],scenes:s[0],animations:s[1],cameras:s[2],asset:i.asset,parser:n,userData:{}};return Ar(r,o,i),ci(o,i),Promise.all(n._invokeAll(function(a){return a.afterRoot&&a.afterRoot(o)})).then(function(){for(let a of o.scenes)a.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let i=0,r=t.length;i<r;i++){let s=t[i].joints;for(let o=0,a=s.length;o<a;o++)e[s[o]].isBone=!0}for(let i=0,r=e.length;i<r;i++){let s=e[i];if(s.mesh!==void 0){if(this._addNodeRef(this.meshCache,s.mesh),s.skin!==void 0)n[s.mesh].isSkinnedMesh=!0}if(s.camera!==void 0)this._addNodeRef(this.cameraCache,s.camera)}}_addNodeRef(e,t){if(t===void 0)return;if(e.refs[t]===void 0)e.refs[t]=e.uses[t]=0;e.refs[t]++}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;let i=n.clone(),r=(s,o)=>{let a=this.associations.get(s);if(a!=null)this.associations.set(o,a);for(let[c,l]of s.children.entries())r(l,o.children[c])};return r(n,i),i.name+="_instance_"+e.uses[t]++,i}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){let i=e(t[n]);if(i)return i}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let n=[];for(let i=0;i<t.length;i++){let r=e(t[i]);if(r)n.push(r)}return n}getDependency(e,t){let n=e+":"+t,i=this.cache.get(n);if(!i){switch(e){case"scene":i=this.loadScene(t);break;case"node":i=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":i=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":i=this.loadAccessor(t);break;case"bufferView":i=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":i=this.loadBuffer(t);break;case"material":i=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":i=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":i=this.loadSkin(t);break;case"animation":i=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":i=this.loadCamera(t);break;default:if(i=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!i)throw Error("Unknown type: "+e);break}this.cache.add(n,i)}return i}getDependencies(e){let t=this.cache.get(e);if(!t){let n=this,i=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(i.map(function(r,s){return n.getDependency(e,s)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[Xe.KHR_BINARY_GLTF].body);let i=this.options;return new Promise(function(r,s){n.load(er.resolveURL(t.uri,i.path),r,void 0,function(){s(Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){let i=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+i)})}loadAccessor(e){let t=this,n=this.json,i=this.json.accessors[e];if(i.bufferView===void 0&&i.sparse===void 0){let s=Gh[i.type],o=_s[i.componentType],a=i.normalized===!0,c=new o(i.count*s);return Promise.resolve(new Nt(c,s,a))}let r=[];if(i.bufferView!==void 0)r.push(this.getDependency("bufferView",i.bufferView));else r.push(null);if(i.sparse!==void 0)r.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",i.sparse.values.bufferView));return Promise.all(r).then(function(s){let o=s[0],a=Gh[i.type],c=_s[i.componentType],l=c.BYTES_PER_ELEMENT,u=l*a,h=i.byteOffset||0,f=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,d=i.normalized===!0,m,x;if(f&&f!==u){let p=Math.floor(h/f),g="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+p+":"+i.count,A=t.cache.get(g);if(!A)m=new c(o,p*f,i.count*f/l),A=new oo(m,f/l),t.cache.add(g,A);x=new ls(A,a,h%f/l,d)}else{if(o===null)m=new c(i.count*a);else m=new c(o,h,i.count*a);x=new Nt(m,a,d)}if(i.sparse!==void 0){let p=Gh.SCALAR,g=_s[i.sparse.indices.componentType],A=i.sparse.indices.byteOffset||0,E=i.sparse.values.byteOffset||0,y=new g(s[1],A,i.sparse.count*p),w=new c(s[2],E,i.sparse.count*a);if(o!==null)x=new Nt(x.array.slice(),x.itemSize,x.normalized);x.normalized=!1;for(let T=0,R=y.length;T<R;T++){let _=y[T];if(x.setX(_,w[T*a]),a>=2)x.setY(_,w[T*a+1]);if(a>=3)x.setZ(_,w[T*a+2]);if(a>=4)x.setW(_,w[T*a+3]);if(a>=5)throw Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}x.normalized=d}return x})}loadTexture(e){let t=this.json,n=this.options,r=t.textures[e].source,s=t.images[r],o=this.textureLoader;if(s.uri){let a=n.manager.getHandler(s.uri);if(a!==null)o=a}return this.loadTextureImage(e,r,o)}loadTextureImage(e,t,n){let i=this,r=this.json,s=r.textures[e],o=r.images[t],a=(o.uri||o.bufferView)+":"+s.sampler;if(this.textureCache[a])return this.textureCache[a];let c=this.loadImageSource(t,n).then(function(l){if(l.flipY=!1,l.name=s.name||o.name||"",l.name===""&&typeof o.uri==="string"&&o.uri.startsWith("data:image/")===!1)l.name=o.uri;let h=(r.samplers||{})[s.sampler]||{};return l.magFilter=Rx[h.magFilter]||Ht,l.minFilter=Rx[h.minFilter]||ii,l.wrapS=Cx[h.wrapS]||is,l.wrapT=Cx[h.wrapT]||is,l.generateMipmaps=!l.isCompressedTexture&&l.minFilter!==Bn&&l.minFilter!==Ht,i.associations.set(l,{textures:e}),l}).catch(function(){return null});return this.textureCache[a]=c,c}loadImageSource(e,t){let n=this,i=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then((u)=>u.clone());let s=i.images[e],o=self.URL||self.webkitURL,a=s.uri||"",c=!1;if(s.bufferView!==void 0)a=n.getDependency("bufferView",s.bufferView).then(function(u){c=!0;let h=new Blob([u],{type:s.mimeType});return a=o.createObjectURL(h),a});else if(s.uri===void 0)throw Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let l=Promise.resolve(a).then(function(u){return new Promise(function(h,f){let d=h;if(t.isImageBitmapLoader===!0)d=function(m){let x=new wt(m);x.needsUpdate=!0,h(x)};t.load(er.resolveURL(u,r.path),d,void 0,f)})}).then(function(u){if(c===!0)o.revokeObjectURL(a);return ci(u,s),u.userData.mimeType=s.mimeType||VA(s.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",a),u});return this.sourceCache[e]=l,l}assignTexture(e,t,n,i){let r=this;return this.getDependency("texture",n.index).then(function(s){if(!s)return null;if(n.texCoord!==void 0&&n.texCoord>0)s=s.clone(),s.channel=n.texCoord;if(r.extensions[Xe.KHR_TEXTURE_TRANSFORM]){let o=n.extensions!==void 0?n.extensions[Xe.KHR_TEXTURE_TRANSFORM]:void 0;if(o){let a=r.associations.get(s);s=r.extensions[Xe.KHR_TEXTURE_TRANSFORM].extendTexture(s,o),r.associations.set(s,a)}}if(i!==void 0)s.colorSpace=i;return e[t]=s,s})}assignFinalMaterial(e){let{geometry:t,material:n}=e,i=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,s=t.attributes.normal===void 0;if(e.isPoints){let o="PointsMaterial:"+n.uuid,a=this.cache.get(o);if(!a)a=new fo,sn.prototype.copy.call(a,n),a.color.copy(n.color),a.map=n.map,a.sizeAttenuation=!1,this.cache.add(o,a);n=a}else if(e.isLine){let o="LineBasicMaterial:"+n.uuid,a=this.cache.get(o);if(!a)a=new ho,sn.prototype.copy.call(a,n),a.color.copy(n.color),a.map=n.map,this.cache.add(o,a);n=a}if(i||r||s){let o="ClonedMaterial:"+n.uuid+":";if(i)o+="derivative-tangents:";if(r)o+="vertex-colors:";if(s)o+="flat-shading:";let a=this.cache.get(o);if(!a){if(a=n.clone(),r)a.vertexColors=!0;if(s)a.flatShading=!0;if(i){if(a.normalScale)a.normalScale.y*=-1;if(a.clearcoatNormalScale)a.clearcoatNormalScale.y*=-1}this.cache.add(o,a),this.associations.set(a,this.associations.get(n))}n=a}e.material=n}getMaterialType(){return Ti}loadMaterial(e){let t=this,n=this.json,i=this.extensions,r=n.materials[e],s,o={},a=r.extensions||{},c=[];if(a[Xe.KHR_MATERIALS_UNLIT]){let u=i[Xe.KHR_MATERIALS_UNLIT];s=u.getMaterialType(),c.push(u.extendParams(o,r,t))}else{let u=r.pbrMetallicRoughness||{};if(o.color=new Le(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){let h=u.baseColorFactor;o.color.setRGB(h[0],h[1],h[2],pn),o.opacity=h[3]}if(u.baseColorTexture!==void 0)c.push(t.assignTexture(o,"map",u.baseColorTexture,Wi));if(o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0)c.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture));s=this._invokeOne(function(h){return h.getMaterialType&&h.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(h){return h.extendMaterialParams&&h.extendMaterialParams(e,o)})))}if(r.doubleSided===!0)o.side=Tn;let l=r.alphaMode||Hh.OPAQUE;if(l===Hh.BLEND)o.transparent=!0,o.depthWrite=!1;else if(o.transparent=!1,l===Hh.MASK)o.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:0.5;if(r.normalTexture!==void 0&&s!==si){if(c.push(t.assignTexture(o,"normalMap",r.normalTexture)),o.normalScale=new Ie(1,1),r.normalTexture.scale!==void 0){let u=r.normalTexture.scale;o.normalScale.set(u,u)}}if(r.occlusionTexture!==void 0&&s!==si){if(c.push(t.assignTexture(o,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0)o.aoMapIntensity=r.occlusionTexture.strength}if(r.emissiveFactor!==void 0&&s!==si){let u=r.emissiveFactor;o.emissive=new Le().setRGB(u[0],u[1],u[2],pn)}if(r.emissiveTexture!==void 0&&s!==si)c.push(t.assignTexture(o,"emissiveMap",r.emissiveTexture,Wi));return Promise.all(c).then(function(){let u=new s(o);if(r.name)u.name=r.name;if(ci(u,r),t.associations.set(u,{materials:e}),r.extensions)Ar(i,u,r);return u})}createUniqueName(e){let t=tt.sanitizeNodeName(e||"");if(t in this.nodeNamesUsed)return t+"_"+ ++this.nodeNamesUsed[t];else return this.nodeNamesUsed[t]=0,t}loadGeometries(e){let t=this,n=this.extensions,i=this.primitiveCache;function r(o){return n[Xe.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(a){return Ix(a,o,t)})}let s=[];for(let o=0,a=e.length;o<a;o++){let c=e[o],l=HA(c),u=i[l];if(u)s.push(u.promise);else{let h;if(c.extensions&&c.extensions[Xe.KHR_DRACO_MESH_COMPRESSION])h=r(c);else h=Ix(new nn,c,t);i[l]={primitive:c,promise:h},s.push(h)}}return Promise.all(s)}loadMesh(e){let t=this,n=this.json,i=this.extensions,r=n.meshes[e],s=r.primitives,o=[];for(let a=0,c=s.length;a<c;a++){let l=s[a].material===void 0?kA(this.cache):this.getDependency("material",s[a].material);o.push(l)}return o.push(t.loadGeometries(s)),Promise.all(o).then(function(a){let c=a.slice(0,a.length-1),l=a[a.length-1],u=[];for(let f=0,d=l.length;f<d;f++){let m=l[f],x=s[f],p,g=c[f];if(x.mode===Rn.TRIANGLES||x.mode===Rn.TRIANGLE_STRIP||x.mode===Rn.TRIANGLE_FAN||x.mode===void 0){if(p=r.isSkinnedMesh===!0?new tc(m,g):new pt(m,g),p.isSkinnedMesh===!0)p.normalizeSkinWeights();if(x.mode===Rn.TRIANGLE_STRIP)p.geometry=Bh(p.geometry,no);else if(x.mode===Rn.TRIANGLE_FAN)p.geometry=Bh(p.geometry,as)}else if(x.mode===Rn.LINES)p=new nc(m,g);else if(x.mode===Rn.LINE_STRIP)p=new Xi(m,g);else if(x.mode===Rn.LINE_LOOP)p=new ic(m,g);else if(x.mode===Rn.POINTS)p=new hs(m,g);else throw Error("THREE.GLTFLoader: Primitive mode unsupported: "+x.mode);if(Object.keys(p.geometry.morphAttributes).length>0)GA(p,r);if(p.name=t.createUniqueName(r.name||"mesh_"+e),ci(p,r),x.extensions)Ar(i,p,x);t.assignFinalMaterial(p),u.push(p)}for(let f=0,d=u.length;f<d;f++)t.associations.set(u[f],{meshes:e,primitives:f});if(u.length===1){if(r.extensions)Ar(i,u[0],r);return u[0]}let h=new Qn;if(r.extensions)Ar(i,h,r);t.associations.set(h,{meshes:e});for(let f=0,d=u.length;f<d;f++)h.add(u[f]);return h})}loadCamera(e){let t,n=this.json.cameras[e],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}if(n.type==="perspective")t=new Lt(io.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2000000);else if(n.type==="orthographic")t=new Tr(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar);if(n.name)t.name=this.createUniqueName(n.name);return ci(t,n),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],n=[];for(let i=0,r=t.joints.length;i<r;i++)n.push(this._loadNodeShallow(t.joints[i]));if(t.inverseBindMatrices!==void 0)n.push(this.getDependency("accessor",t.inverseBindMatrices));else n.push(null);return Promise.all(n).then(function(i){let r=i.pop(),s=i,o=[],a=[];for(let c=0,l=s.length;c<l;c++){let u=s[c];if(u){o.push(u);let h=new ze;if(r!==null)h.fromArray(r.array,c*16);a.push(h)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new lo(o,a)})}loadAnimation(e){let t=this.json,n=this,i=t.animations[e],r=i.name?i.name:"animation_"+e,s=[],o=[],a=[],c=[],l=[];for(let u=0,h=i.channels.length;u<h;u++){let f=i.channels[u],d=i.samplers[f.sampler],m=f.target,x=m.node,p=i.parameters!==void 0?i.parameters[d.input]:d.input,g=i.parameters!==void 0?i.parameters[d.output]:d.output;if(m.node===void 0)continue;s.push(this.getDependency("node",x)),o.push(this.getDependency("accessor",p)),a.push(this.getDependency("accessor",g)),c.push(d),l.push(m)}return Promise.all([Promise.all(s),Promise.all(o),Promise.all(a),Promise.all(c),Promise.all(l)]).then(function(u){let h=u[0],f=u[1],d=u[2],m=u[3],x=u[4],p=[];for(let A=0,E=h.length;A<E;A++){let y=h[A],w=f[A],T=d[A],R=m[A],_=x[A];if(y===void 0)continue;if(y.updateMatrix)y.updateMatrix();let S=n._createAnimationTracks(y,w,T,R,_);if(S)for(let U=0;U<S.length;U++)p.push(S[U])}let g=new Qr(r,void 0,p);return ci(g,i),g})}createNodeMesh(e){let t=this.json,n=this,i=t.nodes[e];if(i.mesh===void 0)return null;return n.getDependency("mesh",i.mesh).then(function(r){let s=n._getNodeRef(n.meshCache,i.mesh,r);if(i.weights!==void 0)s.traverse(function(o){if(!o.isMesh)return;for(let a=0,c=i.weights.length;a<c;a++)o.morphTargetInfluences[a]=i.weights[a]});return s})}loadNode(e){let t=this.json,n=this,i=t.nodes[e],r=n._loadNodeShallow(e),s=[],o=i.children||[];for(let c=0,l=o.length;c<l;c++)s.push(n.getDependency("node",o[c]));let a=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([r,Promise.all(s),a]).then(function(c){let l=c[0],u=c[1],h=c[2];if(h!==null)l.traverse(function(f){if(!f.isSkinnedMesh)return;f.bind(h,$A)});for(let f=0,d=u.length;f<d;f++)l.add(u[f]);if(l.userData.pivot!==void 0&&u.length>0){let f=l.userData.pivot,d=u[0];l.pivot=new N().fromArray(f),l.position.x-=f[0],l.position.y-=f[1],l.position.z-=f[2],d.position.set(0,0,0),delete l.userData.pivot}return l})}_loadNodeShallow(e){let t=this.json,n=this.extensions,i=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let r=t.nodes[e],s=r.name?i.createUniqueName(r.name):"",o=[],a=i._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});if(a)o.push(a);if(r.camera!==void 0)o.push(i.getDependency("camera",r.camera).then(function(c){return i._getNodeRef(i.cameraCache,r.camera,c)}));return i._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let l;if(r.isBone===!0)l=new ao;else if(c.length>1)l=new Qn;else if(c.length===1)l=c[0];else l=new at;if(l!==c[0])for(let u=0,h=c.length;u<h;u++)l.add(c[u]);if(r.name)l.userData.name=r.name,l.name=s;if(ci(l,r),r.extensions)Ar(n,l,r);if(r.matrix!==void 0){let u=new ze;u.fromArray(r.matrix),l.applyMatrix4(u)}else{if(r.translation!==void 0)l.position.fromArray(r.translation);if(r.rotation!==void 0)l.quaternion.fromArray(r.rotation);if(r.scale!==void 0)l.scale.fromArray(r.scale)}if(!i.associations.has(l))i.associations.set(l,{});else if(r.mesh!==void 0&&i.meshCache.refs[r.mesh]>1){let u=i.associations.get(l);i.associations.set(l,{...u})}return i.associations.get(l).nodes=e,l}),this.nodeCache[e]}loadScene(e){let t=this.extensions,n=this.json.scenes[e],i=this,r=new Qn;if(n.name)r.name=i.createUniqueName(n.name);if(ci(r,n),n.extensions)Ar(t,r,n);let s=n.nodes||[],o=[];for(let a=0,c=s.length;a<c;a++)o.push(i.getDependency("node",s[a]));return Promise.all(o).then(function(a){for(let l=0,u=a.length;l<u;l++){let h=a[l];if(h.parent!==null)r.add(Tx(h));else r.add(h)}let c=(l)=>{let u=new Map;for(let[h,f]of i.associations)if(h instanceof sn||h instanceof wt)u.set(h,f);return l.traverse((h)=>{let f=i.associations.get(h);if(f!=null)u.set(h,f)}),u};return i.associations=c(r),r})}_createAnimationTracks(e,t,n,i,r){let s=[],o=e.name?e.name:e.uuid,a=[];function c(f){if(f.morphTargetInfluences)a.push(f.name?f.name:f.uuid)}if(nr[r.path]===nr.weights){if(c(e),e.isGroup)e.children.forEach(c)}else a.push(o);let l;switch(nr[r.path]){case nr.weights:l=Ji;break;case nr.rotation:l=Ki;break;case nr.translation:case nr.scale:l=wr;break;default:switch(n.itemSize){case 1:l=Ji;break;case 2:case 3:default:l=wr;break}break}let u=i.interpolation!==void 0?zA[i.interpolation]:qa,h=this._getArrayFromAccessor(n);for(let f=0,d=a.length;f<d;f++){let m=new l(a[f]+"."+nr[r.path],t.array,h,u);if(i.interpolation==="CUBICSPLINE")this._createCubicSplineTrackInterpolant(m);s.push(m)}return s}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let n=Zh(t.constructor),i=new Float32Array(t.length);for(let r=0,s=t.length;r<s;r++)i[r]=t[r]*n;t=i}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){return new(this instanceof Ki?Qx:qh)(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function WA(e,t,n){let i=t.attributes,r=new tn;if(i.POSITION!==void 0){let a=n.json.accessors[i.POSITION],{min:c,max:l}=a;if(c!==void 0&&l!==void 0){if(r.set(new N(c[0],c[1],c[2]),new N(l[0],l[1],l[2])),a.normalized){let u=Zh(_s[a.componentType]);r.min.multiplyScalar(u),r.max.multiplyScalar(u)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let s=t.targets;if(s!==void 0){let a=new N,c=new N;for(let l=0,u=s.length;l<u;l++){let h=s[l];if(h.POSITION!==void 0){let f=n.json.accessors[h.POSITION],{min:d,max:m}=f;if(d!==void 0&&m!==void 0){if(c.setX(Math.max(Math.abs(d[0]),Math.abs(m[0]))),c.setY(Math.max(Math.abs(d[1]),Math.abs(m[1]))),c.setZ(Math.max(Math.abs(d[2]),Math.abs(m[2]))),f.normalized){let x=Zh(_s[f.componentType]);c.multiplyScalar(x)}a.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}r.expandByVector(a)}e.boundingBox=r;let o=new mn;r.getCenter(o.center),o.radius=r.min.distanceTo(r.max)/2,e.boundingSphere=o}function Ix(e,t,n){let i=t.attributes,r=[];function s(o,a){return n.getDependency("accessor",o).then(function(c){e.setAttribute(a,c)})}for(let o in i){let a=Wh[o]||o.toLowerCase();if(a in e.attributes)continue;r.push(s(i[o],a))}if(t.indices!==void 0&&!e.index){let o=n.getDependency("accessor",t.indices).then(function(a){e.setIndex(a)});r.push(o)}if($e.workingColorSpace!==pn&&"COLOR_0"in i)console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${$e.workingColorSpace}" not supported.`);return ci(e,t),WA(e,t,n),Promise.all(r).then(function(){return t.targets!==void 0?BA(e,t.targets,n):e})}var tv={type:"change"},jh={type:"start"},iv={type:"end"},bc=new Zi,nv=new Un,ZA=Math.cos(70*io.DEG2RAD),Ut=new N,on=2*Math.PI,ct={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Yh=0.000001;class Jh extends gc{constructor(e,t=null){super(e,t);if(this.state=ct.NONE,this.target=new N,this.cursor=new N,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=0.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Gi.ROTATE,MIDDLE:Gi.DOLLY,RIGHT:Gi.PAN},this.touches={ONE:Hi.ROTATE,TWO:Hi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new N,this._lastQuaternion=new Gt,this._lastTargetPosition=new N,this._quat=new Gt().setFromUnitVectors(e.up,new N(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new _o,this._sphericalDelta=new _o,this._scale=1,this._panOffset=new N,this._rotateStart=new Ie,this._rotateEnd=new Ie,this._rotateDelta=new Ie,this._panStart=new Ie,this._panEnd=new Ie,this._panDelta=new Ie,this._dollyStart=new Ie,this._dollyEnd=new Ie,this._dollyDelta=new Ie,this._dollyDirection=new N,this._mouse=new Ie,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=qA.bind(this),this._onPointerDown=XA.bind(this),this._onPointerUp=YA.bind(this),this._onContextMenu=n1.bind(this),this._onMouseWheel=KA.bind(this),this._onKeyDown=QA.bind(this),this._onTouchStart=e1.bind(this),this._onTouchMove=t1.bind(this),this._onMouseDown=jA.bind(this),this._onMouseMove=JA.bind(this),this._interceptControlDown=i1.bind(this),this._interceptControlUp=r1.bind(this),this.domElement!==null)this.connect(this.domElement);this.update()}set cursorStyle(e){if(this._cursorStyle=e,e==="grab")this.domElement.style.cursor="grab";else this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction=""}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){if(this._domElementKeyEvents!==null)this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(tv),this.update(),this.state=ct.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;if(Ut.copy(t).sub(this.target),Ut.applyQuaternion(this._quat),this._spherical.setFromVector3(Ut),this.autoRotate&&this.state===ct.NONE)this._rotateLeft(this._getAutoRotationAngle(e));if(this.enableDamping)this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor;else this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi;let n=this.minAzimuthAngle,i=this.maxAzimuthAngle;if(isFinite(n)&&isFinite(i)){if(n<-Math.PI)n+=on;else if(n>Math.PI)n-=on;if(i<-Math.PI)i+=on;else if(i>Math.PI)i-=on;if(n<=i)this._spherical.theta=Math.max(n,Math.min(i,this._spherical.theta));else this._spherical.theta=this._spherical.theta>(n+i)/2?Math.max(n,this._spherical.theta):Math.min(i,this._spherical.theta)}if(this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0)this.target.addScaledVector(this._panOffset,this.dampingFactor);else this.target.add(this._panOffset);this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let s=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=s!=this._spherical.radius}if(Ut.setFromSpherical(this._spherical),Ut.applyQuaternion(this._quatInverse),t.copy(this.target).add(Ut),this.object.lookAt(this.target),this.enableDamping===!0)this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor);else this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0);if(this.zoomToCursor&&this._performCursorZoom){let s=null;if(this.object.isPerspectiveCamera){let o=Ut.length();s=this._clampDistance(o*this._scale);let a=o-s;this.object.position.addScaledVector(this._dollyDirection,a),this.object.updateMatrixWorld(),r=!!a}else if(this.object.isOrthographicCamera){let o=new N(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=a!==this.object.zoom;let c=new N(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),s=Ut.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;if(s!==null)if(this.screenSpacePanning)this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(s).add(this.object.position);else if(bc.origin.copy(this.object.position),bc.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(bc.direction))<ZA)this.object.lookAt(this.target);else nv.setFromNormalAndCoplanarPoint(this.object.up,this.target),bc.intersectPlane(nv,this.target)}else if(this.object.isOrthographicCamera){let s=this.object.zoom;if(this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),s!==this.object.zoom)this.object.updateProjectionMatrix(),r=!0}if(this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Yh||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Yh||this._lastTargetPosition.distanceToSquared(this.target)>Yh)return this.dispatchEvent(tv),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0;return!1}_getAutoRotationAngle(e){if(e!==null)return on/60*this.autoRotateSpeed*e;else return on/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*0.01);return Math.pow(0.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Ut.setFromMatrixColumn(t,0),Ut.multiplyScalar(-e),this._panOffset.add(Ut)}_panUp(e,t){if(this.screenSpacePanning===!0)Ut.setFromMatrixColumn(t,1);else Ut.setFromMatrixColumn(t,0),Ut.crossVectors(this.object.up,Ut);Ut.multiplyScalar(e),this._panOffset.add(Ut)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let i=this.object.position;Ut.copy(i).sub(this.target);let r=Ut.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else if(this.object.isOrthographicCamera)this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix);else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1}_dollyOut(e){if(this.object.isPerspectiveCamera||this.object.isOrthographicCamera)this._scale/=e;else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1}_dollyIn(e){if(this.object.isPerspectiveCamera||this.object.isOrthographicCamera)this._scale*=e;else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),i=e-n.left,r=t-n.top,{width:s,height:o}=n;this._mouse.x=i/s*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(on*this._rotateDelta.x/t.clientHeight),this._rotateUp(on*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){if(this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0)this._dollyOut(this._getZoomScale(this._dollyDelta.y));else if(this._dollyDelta.y<0)this._dollyIn(this._getZoomScale(this._dollyDelta.y));this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){if(this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0)this._dollyIn(this._getZoomScale(e.deltaY));else if(e.deltaY>0)this._dollyOut(this._getZoomScale(e.deltaY));this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate)this._rotateUp(on*this.keyRotateSpeed/this.domElement.clientHeight)}else if(this.enablePan)this._pan(0,this.keyPanSpeed);t=!0;break;case this.keys.BOTTOM:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate)this._rotateUp(-on*this.keyRotateSpeed/this.domElement.clientHeight)}else if(this.enablePan)this._pan(0,-this.keyPanSpeed);t=!0;break;case this.keys.LEFT:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate)this._rotateLeft(on*this.keyRotateSpeed/this.domElement.clientHeight)}else if(this.enablePan)this._pan(this.keyPanSpeed,0);t=!0;break;case this.keys.RIGHT:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate)this._rotateLeft(-on*this.keyRotateSpeed/this.domElement.clientHeight)}else if(this.enablePan)this._pan(-this.keyPanSpeed,0);t=!0;break}if(t)e.preventDefault(),this.update()}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=0.5*(e.pageX+t.x),i=0.5*(e.pageY+t.y);this._rotateStart.set(n,i)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=0.5*(e.pageX+t.x),i=0.5*(e.pageY+t.y);this._panStart.set(n,i)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){if(this.enableZoom)this._handleTouchStartDolly(e);if(this.enablePan)this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){if(this.enableZoom)this._handleTouchStartDolly(e);if(this.enableRotate)this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),i=0.5*(e.pageX+n.x),r=0.5*(e.pageY+n.y);this._rotateEnd.set(i,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(on*this._rotateDelta.x/t.clientHeight),this._rotateUp(on*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=0.5*(e.pageX+t.x),i=0.5*(e.pageY+t.y);this._panEnd.set(n,i)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let s=(e.pageX+t.x)*0.5,o=(e.pageY+t.y)*0.5;this._updateZoomParameters(s,o)}_handleTouchMoveDollyPan(e){if(this.enableZoom)this._handleTouchMoveDolly(e);if(this.enablePan)this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){if(this.enableZoom)this._handleTouchMoveDolly(e);if(this.enableRotate)this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];if(t===void 0)t=new Ie,this._pointerPositions[e.pointerId]=t;t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}if(e.ctrlKey&&!this._controlActive)n.deltaY*=10;return n}}function XA(e){if(this.enabled===!1)return;if(this._pointers.length===0)this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp);if(this._isTrackingPointer(e))return;if(this._addPointer(e),e.pointerType==="touch")this._onTouchStart(e);else this._onMouseDown(e);if(this._cursorStyle==="grab")this.domElement.style.cursor="grabbing"}function qA(e){if(this.enabled===!1)return;if(e.pointerType==="touch")this._onTouchMove(e);else this._onMouseMove(e)}function YA(e){switch(this._removePointer(e),this._pointers.length){case 0:if(this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(iv),this.state=ct.NONE,this._cursorStyle==="grab")this.domElement.style.cursor="grab";break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y});break}}function jA(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Gi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=ct.DOLLY;break;case Gi.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=ct.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=ct.ROTATE}break;case Gi.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=ct.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=ct.PAN}break;default:this.state=ct.NONE}if(this.state!==ct.NONE)this.dispatchEvent(jh)}function JA(e){switch(this.state){case ct.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case ct.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case ct.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e);break}}function KA(e){if(this.enabled===!1||this.enableZoom===!1||this.state!==ct.NONE)return;e.preventDefault(),this.dispatchEvent(jh),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(iv)}function QA(e){if(this.enabled===!1)return;this._handleKeyDown(e)}function e1(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case Hi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=ct.TOUCH_ROTATE;break;case Hi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=ct.TOUCH_PAN;break;default:this.state=ct.NONE}break;case 2:switch(this.touches.TWO){case Hi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=ct.TOUCH_DOLLY_PAN;break;case Hi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=ct.TOUCH_DOLLY_ROTATE;break;default:this.state=ct.NONE}break;default:this.state=ct.NONE}if(this.state!==ct.NONE)this.dispatchEvent(jh)}function t1(e){switch(this._trackPointer(e),this.state){case ct.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case ct.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case ct.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case ct.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=ct.NONE}}function n1(e){if(this.enabled===!1)return;e.preventDefault()}function i1(e){if(e.key==="Control")this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0})}function r1(e){if(e.key==="Control")this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0})}class Kh extends cs{constructor(){super();this.name="RoomEnvironment",this.position.y=-3.5;let e=new Yi;e.deleteAttribute("uv");let t=new Ti({side:jt}),n=new Ti,i=new ds(16777215,900,28,2);i.position.set(0.418,16.199,0.3),this.add(i);let r=new pt(e,t);r.position.set(-0.757,13.219,0.717),r.scale.set(31.713,28.305,28.591),this.add(r);let s=new us(e,n,6),o=new at;o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-0.195,0),o.scale.set(2.328,7.905,4.651),o.updateMatrix(),s.setMatrixAt(0,o.matrix),o.position.set(-5.607,-0.754,-0.758),o.rotation.set(0,0.994,0),o.scale.set(1.97,1.534,3.955),o.updateMatrix(),s.setMatrixAt(1,o.matrix),o.position.set(6.167,0.857,7.803),o.rotation.set(0,0.561,0),o.scale.set(3.927,6.285,3.687),o.updateMatrix(),s.setMatrixAt(2,o.matrix),o.position.set(-2.017,0.018,6.124),o.rotation.set(0,0.333,0),o.scale.set(2.002,4.566,2.064),o.updateMatrix(),s.setMatrixAt(3,o.matrix),o.position.set(2.291,-0.756,-2.621),o.rotation.set(0,-0.286,0),o.scale.set(1.546,1.552,1.496),o.updateMatrix(),s.setMatrixAt(4,o.matrix),o.position.set(-2.193,-0.369,-5.547),o.rotation.set(0,0.516,0),o.scale.set(3.875,3.487,2.986),o.updateMatrix(),s.setMatrixAt(5,o.matrix),this.add(s);let a=new pt(e,xs(50));a.position.set(-16.116,14.37,8.208),a.scale.set(0.1,2.428,2.739),this.add(a);let c=new pt(e,xs(50));c.position.set(-16.109,18.021,-8.207),c.scale.set(0.1,2.425,2.751),this.add(c);let l=new pt(e,xs(17));l.position.set(14.904,12.198,-1.832),l.scale.set(0.15,4.265,6.331),this.add(l);let u=new pt(e,xs(43));u.position.set(-0.462,8.89,14.52),u.scale.set(4.38,5.441,0.088),this.add(u);let h=new pt(e,xs(20));h.position.set(3.235,11.486,-12.541),h.scale.set(2.5,2,0.1),this.add(h);let f=new pt(e,xs(100));f.position.set(0,20,0),f.scale.set(1,0.1,1),this.add(f)}dispose(){let e=new Set;this.traverse((t)=>{if(t.isMesh)e.add(t.geometry),e.add(t.material)});for(let t of e)t.dispose()}}function xs(e){return new oc({color:0,emissive:16777215,emissiveIntensity:e})}function rv(e,t,n=40,i=[e]){let r=e.getCenter(new N),s=Math.max(e.getSize(new N).length()/2,0.01),o=new N(1,0.65,1.25).normalize(),a=new N().crossVectors(new N(0,1,0),o).normalize(),c=new N().crossVectors(o,a),l=[];for(let A of i.length?i:[e])for(let E of[A.min.x,A.max.x])for(let y of[A.min.y,A.max.y])for(let w of[A.min.z,A.max.z])l.push(new N(E,y,w));let u=1/0,h=-1/0,f=1/0,d=-1/0;for(let A of l){let E=A.clone().sub(r),y=E.dot(a),w=E.dot(c);u=Math.min(u,y),h=Math.max(h,y),f=Math.min(f,w),d=Math.max(d,w)}r.addScaledVector(a,(u+h)/2),r.addScaledVector(c,(f+d)/2);let m=Math.tan(n*Math.PI/360),x=m*t,p=s;for(let A of l){let E=A.clone().sub(r),y=E.dot(o);p=Math.max(p,y+Math.abs(E.dot(a))*1.12/x,y+Math.abs(E.dot(c))*1.12/m)}let g=r.clone().addScaledVector(o,p);return{center:r,radius:s,distance:p,position:g}}function sv(e){let t=new kh({antialias:!0,alpha:!1});t.setPixelRatio(Math.min(devicePixelRatio,2)),t.setClearColor(1382930),t.toneMapping=Qs,t.toneMappingExposure=1.15,e.replaceChildren(t.domElement);let n=new cs,i=new Lt(40,1,0.01,1000),r=new Jh(i,t.domElement);r.enableDamping=!0;let s=new So(t),o=new Kh,a=s.fromScene(o,0.04);n.environment=a.texture,o.dispose(),s.dispose();let c=new ps(16773591,2.4);c.position.set(4,8,5),n.add(c),n.add(new uc(14806490,5065021,1.7));let l,u,h=[],f=!0,d=performance.now(),m=0,x=0,p=!1,g=(w)=>{let T=new Set,R=new Set,_=new Set;w.traverse((S)=>{let U=S;if(!U.isMesh)return;T.add(U.geometry);for(let C of Array.isArray(U.material)?U.material:[U.material]){R.add(C);for(let z of Object.values(C))if(z instanceof wt)_.add(z)}});for(let S of[...T,...R,..._])S.dispose()},A=()=>{if(!l)return;let w=new tn().setFromObject(l,!0),T=[];l.traverse((C)=>{if(C instanceof pt||C instanceof Xi||C instanceof hs){let z=new tn().setFromObject(C,!0);if(!z.isEmpty())T.push(z)}});let{center:R,radius:_,distance:S,position:U}=rv(w,i.aspect,i.fov,T);r.target.copy(R),i.position.copy(U),i.near=Math.max(_/1000,0.0001),i.far=S+_*100,r.minDistance=_*0.1,r.maxDistance=_*80,i.updateProjectionMatrix(),r.update()},E=new ResizeObserver(()=>{let{clientWidth:w,clientHeight:T}=e;if(!w||!T)return;t.setSize(w,T),i.aspect=w/T,i.updateProjectionMatrix()});E.observe(e);let y=(w)=>{if(p)return;let T=Math.min((w-d)/1000,0.1);if(d=w,f)u?.update(T);r.update(),t.render(n,i),m=requestAnimationFrame(y)};return m=requestAnimationFrame(y),{async load(w){let T=++x;Dl(w);let R=new mo;R.setURLModifier((F)=>{if(!F.startsWith("blob:")&&!F.startsWith("data:"))throw Error("External model resources are not loaded");return F});let _=await new Xh(R).parseAsync(Uint8Array.from(w).buffer,"");if(p||T!==x){g(_.scene);return}if(l)u?.stopAllAction(),u?.uncacheRoot(l),n.remove(l),g(l);l=_.scene,n.add(l),h=_.animations,u=new mc(l),f=!0;let{clientWidth:S,clientHeight:U}=e;t.setSize(S,U),i.aspect=S/U,A();let C=0,z=0,j=new Set;return l.traverse((F)=>{let H=F;if(!H.isMesh)return;z++,C+=(H.geometry.index?.count??H.geometry.attributes.position?.count??0)/3*(H.isInstancedMesh?H.count:1);for(let V of Array.isArray(H.material)?H.material:[H.material])j.add(V)}),{triangles:C,meshes:z,materials:j.size,clips:h.map((F)=>F.name)}},reset:A,wire(w){l?.traverse((T)=>{let R=T;if(R.isMesh){for(let _ of Array.isArray(R.material)?R.material:[R.material])if("wireframe"in _)_.wireframe=w}})},lighting(w){t.toneMappingExposure=w==="bright"?1.65:w==="soft"?0.85:1.15,c.intensity=w==="soft"?0.8:2.4},clip(w){if(u?.stopAllAction(),h[w])u?.clipAction(h[w]).play()},pause(w){f=!w},dispose(){if(p=!0,x++,cancelAnimationFrame(m),E.disconnect(),r.dispose(),l)g(l);a.dispose(),t.dispose(),e.replaceChildren()}}}var De=(e)=>document.getElementById(e),Ct=(e,t,n)=>{let i=document.createElement(e);if(t!==void 0)i.textContent=t;if(n)i.className=n;return i},Ao=[],ys=[],Cr=[],Sc="",vs,xn,wo=0,ov=0,To=!1,Eo=!1,ir=new Set,Qh=[],av=[],Rr=(e)=>`${e.collection}/${e.manifest.assetId}/${e.manifest.revisionId}`,cv=(e)=>{De("status").textContent=e},Ir=(e)=>cv(e instanceof Error?e.message:String(e)),Ro=(e,t,n=Qh)=>{let i=URL.createObjectURL(new Blob([Uint8Array.from(e)],{type:t}));return n.push(i),i};async function lv(e){let t=await fetch(e),n=await t.json();if(!t.ok)throw Error(n.error??"Request failed");return n}async function s1(e,t){if(e.local){let i=e.local.files[t];if(!i)throw Error("File unavailable");return i}if(e.loose&&t==="asset.glb")return e.loose;let n=await fetch(`/files/${Rr(e)}/${t}`);if(!n.ok)throw Error((await n.json()).error??"File unavailable");return new Uint8Array(await n.arrayBuffer())}function o1(e,t){if(e.local){if(t==="editable.zip")return Ro(Ol([e.local]),"application/zip");return Ro(e.local.files[t],t.endsWith(".js")?"text/javascript":"model/gltf-binary")}if(e.loose)return Ro(e.loose,"model/gltf-binary");return`/files/${Rr(e)}/${t}?download`}function uv(e,t){try{localStorage.setItem(e,t)}catch{}}function hv(e){try{return localStorage.getItem(e)}catch{return null}}function a1(){let e=De("collections");e.replaceChildren();for(let t of[...Ao,...Cr.length?[{id:"opened-files",label:"Opened files"}]:[]]){let n=Ct("button",t.label,Sc===t.id?"active":"");n.onclick=()=>void Mc(t.id).catch(Ir),e.append(n)}}async function Mc(e){let t=++ov;Sc=e,ir.clear(),a1(),cv("");let n=e==="opened-files"?Cr:(await lv(`/api/assets?collection=${encodeURIComponent(e)}`)).assets.map((i)=>({collection:e,manifest:i}));if(t!==ov)return;ys=n,uv("kiln.collection",e),De("collection-title").textContent=e==="opened-files"?"Opened files":Ao.find((i)=>i.id===e)?.label??e,De("collection-caption").textContent=e==="opened-files"?"Previewed in your browser. Your original files stay untouched.":"Saved revisions, editable source, and everything ready to use.",ef()}function c1(){let e=new Map;for(let t of ys){let n=t.manifest.assetId;e.set(n,[...e.get(n)??[],t])}return[...e.values()].map((t)=>(t.sort((n,i)=>i.manifest.createdAt.localeCompare(n.manifest.createdAt)||i.manifest.revisionId.localeCompare(n.manifest.revisionId)),t.find((n)=>n.manifest.revisionId===hv(`kiln.revision.${n.collection}.${n.manifest.assetId}`))??t[0]))}function ef(){for(let i of av.splice(0))URL.revokeObjectURL(i);let e=De("cards");e.replaceChildren();let t=De("search").value.toLowerCase(),n=c1().filter((i)=>`${i.manifest.name} ${i.manifest.tags.join(" ")}`.toLowerCase().includes(t));if(De("count").textContent=`${n.length} asset${n.length===1?"":"s"}`,De("export-selection").disabled=!ir.size,!n.length){let i=Ct("div",void 0,"empty");if(i.append(Ct("b",t?"No matching assets":"Your next idea belongs here."),Ct("p",t?"Try another name or tag.":"Save an asset with your agent, or open a GLB or editable bundle.")),!t)i.append(Ct("code",'kiln save asset.kiln.js --name "My asset"'));e.append(i);return}for(let i of n){let r=i.manifest,s=Ct("article",void 0,"card"),o=Ct("button",void 0,"card-open");o.setAttribute("aria-label",`View ${r.name}`),o.onclick=()=>void tf(i).catch(Ir);let a=Ct("div",void 0,"thumb");if(r.files["preview.png"]){let d=Ct("img");d.loading="lazy",d.alt=r.name,d.src=i.local?Ro(i.local.files["preview.png"],"image/png",av):`/files/${Rr(i)}/preview.png`,d.onerror=()=>{d.remove(),a.textContent="◇"},a.append(d)}else a.textContent="◇";let c=Ct("div",void 0,"card-content");c.append(Ct("span",r.name,"card-title"));let l=ys.filter((d)=>d.manifest.assetId===r.assetId),u=new Set(l.map((d)=>d.manifest.parentRevision)),h=l.filter((d)=>!u.has(d.manifest.revisionId));c.append(Ct("span",`${r.editable?"Editable source":"Source unavailable"} · ${l.length} revision${l.length===1?"":"s"}${h.length>1?` · ${h.length} branches`:""}`,"card-meta"));let f=Ct("div",void 0,"tags");for(let d of r.tags)f.append(Ct("span",d,"tag"));if(c.append(f),o.append(a,c),s.append(o),!i.loose){let d=Ct("input");d.type="checkbox",d.className="selection",d.checked=ir.has(Rr(i)),d.setAttribute("aria-label",`Select ${r.name}`),d.onchange=()=>{if(d.checked)ir.add(Rr(i));else ir.delete(Rr(i));De("export-selection").disabled=!ir.size},s.append(d)}e.append(s)}}async function tf(e){let t=++wo;vs=e,uv(`kiln.revision.${e.collection}.${e.manifest.assetId}`,e.manifest.revisionId);for(let o of Qh.splice(0))URL.revokeObjectURL(o);let n=De("detail");if(!n.open)n.showModal();De("asset-name").textContent=e.manifest.name;let i=De("revisions");i.replaceChildren();for(let o of ys.filter((a)=>a.manifest.assetId===e.manifest.assetId)){let a=Ct("option",`${new Date(o.manifest.createdAt).toLocaleString()} · ${o.manifest.description||o.manifest.revisionId.slice(0,10)}`);a.value=o.manifest.revisionId,a.selected=o.manifest.revisionId===e.manifest.revisionId,i.append(a)}i.onchange=()=>{let o=ys.find((a)=>a.manifest.assetId===e.manifest.assetId&&a.manifest.revisionId===i.value);if(o)tf(o).catch(Ir)},De("asset-description").textContent=e.manifest.description??e.manifest.brief??(e.manifest.editable?"Source travels with this revision. Download the editable bundle to continue elsewhere.":"This GLB has no saved Kiln source. You can view and use the model."),De("provenance").textContent=e.loose?"Standalone GLB. No source or build provenance supplied.":JSON.stringify(e.manifest,null,2);let r=De("downloads");r.replaceChildren();for(let[o,a]of[["asset.glb","Download GLB"],...e.manifest.editable?[["source.kiln.js","Download source"]]:[],...!e.loose?[["editable.zip",e.manifest.editable?"Download editable bundle":"Download asset bundle"]]:[]]){let c=Ct("a",a);c.href=o1(e,o),c.download=`${e.manifest.name.replace(/[^a-z0-9_-]/gi,"-")}${o==="asset.glb"?".glb":o==="source.kiln.js"?".kiln.js":".zip"}`,r.append(c)}De("refine").disabled=!e.manifest.editable,De("asset-stats").replaceChildren(),De("stage-status").textContent="Loading saved GLB…",To=!1,Eo=!1,De("wire").setAttribute("aria-pressed","false"),De("play").textContent="Pause";let s=De("animation");s.replaceChildren(new Option("Rest pose","")),De("play").disabled=!0;try{xn??=sv(De("stage"));let o=await s1(e,"asset.glb");if(t!==wo)return;let a=await xn.load(o);if(!a||t!==wo)return;xn.wire(!1),xn.lighting(De("lighting").value);for(let[c,l]of[[a.triangles.toLocaleString(),"triangles"],[a.meshes,"meshes"],[a.materials,"materials"],[`${(o.length/1024).toFixed(0)} KB`,"GLB"]]){let u=Ct("div");u.append(Ct("strong",String(c)),Ct("span",String(l))),De("asset-stats").append(u)}for(let c=0;c<a.clips.length;c++)s.append(new Option(a.clips[c],String(c)));De("stage-status").textContent=""}catch(o){if(t===wo)xn?.dispose(),xn=void 0,De("stage-status").textContent=`3D preview unavailable: ${o instanceof Error?o.message:o}. Downloads remain available.`}}async function fv(e){for(let t of e){if(t.bytes.length>mi)throw Error("File exceeds 64 MiB");if(t.name.toLowerCase().endsWith(".zip"))for(let n of e_(t.bytes)){for(let[i,r]of Object.entries(n.files))if(`sha256:${Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",Uint8Array.from(r)))).map((o)=>o.toString(16).padStart(2,"0")).join("")}`!==n.manifest.files[i]?.sha256)throw Error(`Bundle integrity failure: ${i}`);if(!Cr.some((i)=>i.manifest.revisionId===n.manifest.revisionId&&i.manifest.assetId===n.manifest.assetId))Cr.push({collection:"opened-files",manifest:n.manifest,local:n})}else{let n=`a_${crypto.randomUUID().replaceAll("-","")}`;Cr.push({collection:"opened-files",loose:t.bytes,manifest:{version:"kiln.asset.v1",assetId:n,revisionId:`r_${n}`,name:t.name.replace(/\.glb$/i,""),tags:[],createdAt:new Date().toISOString(),editable:!1,files:{}}})}}await Mc("opened-files")}De("open").onchange=async(e)=>{try{let t=Array.from(e.target.files??[]);if(t.some((n)=>n.size>mi))throw Error("File exceeds 64 MiB");await fv(await Promise.all(t.map(async(n)=>({name:n.name,bytes:new Uint8Array(await n.arrayBuffer())}))))}catch(t){Ir(t)}};De("refresh").onclick=()=>void Mc(Sc).catch(Ir);De("search").oninput=ef;De("close-detail").onclick=()=>De("detail").close();De("detail").addEventListener("close",()=>{wo++,xn?.dispose(),xn=void 0;for(let e of Qh.splice(0))URL.revokeObjectURL(e);ef()});De("frame").onclick=()=>xn?.reset();De("wire").onclick=()=>{To=!To,xn?.wire(To),De("wire").setAttribute("aria-pressed",String(To))};De("lighting").onchange=(e)=>xn?.lighting(e.target.value);De("animation").onchange=(e)=>{let t=e.target.value;xn?.clip(t===""?-1:Number(t)),De("play").disabled=t===""};De("play").onclick=()=>{Eo=!Eo,xn?.pause(Eo),De("play").textContent=Eo?"Play":"Pause"};De("refine").onclick=async()=>{if(!vs)return;let e=vs.manifest,t=vs.local?`Import the downloaded editable bundle using kiln import <bundle.zip>. Restore asset ${e.assetId}, revision ${e.revisionId}, using kiln_assets action=restore. Read its source with kiln_source, refine it with kiln_edit, review the result, and save a child revision with kiln_save. Requested change: `:`Use kiln_assets with action=restore, collection=${vs.collection}, assetId=${e.assetId}, revisionId=${e.revisionId}. Read the returned programRef with kiln_source, refine it with kiln_edit, review the result, and save with kiln_save using assetId=${e.assetId}, parentRevision=${e.revisionId}, collection=${vs.collection}. Requested change: `;try{await navigator.clipboard.writeText(t),De("refine").textContent="Instructions copied"}catch{De("provenance").textContent=t,De("provenance").parentElement?.setAttribute("open","")}};De("export-selection").onclick=()=>{try{let e=Ct("a");if(Sc==="opened-files")e.href=Ro(Ol(ys.filter((t)=>ir.has(Rr(t))).map((t)=>t.local)),"application/zip");else{let t=new URLSearchParams;for(let n of ir)t.append("revision",n);e.href=`/api/bundle?${t}`}e.download="kiln-assets.zip",e.click()}catch(e){Ir(e)}};async function l1(){Ao=(await lv("/api/collections")).collections;let e=hv("kiln.collection");if(await Mc(Ao.find((t)=>t.id===e)?.id??Ao[0]?.id??"project"),new URLSearchParams(location.search).has("open")){let t=await fetch("/api/standalone");if(!t.ok)throw Error("File unavailable");if(await fv([{name:t.headers.get("Content-Type")?.includes("zip")?"asset.zip":"asset.glb",bytes:new Uint8Array(await t.arrayBuffer())}]),Cr.length===1)await tf(Cr[0])}}l1().catch(Ir);
