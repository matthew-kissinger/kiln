function Ms(e){let t=Object.values(e).filter((i)=>typeof i==="number");return Object.entries(e).filter(([i,r])=>t.indexOf(+i)===-1).map(([i,r])=>r)}function Cc(e,t="|"){return e.map((n)=>Lc(n)).join(t)}function ws(e,t){if(typeof t==="bigint")return t.toString();return t}class ff{constructor(e){this._getter=e,this._value=void 0}get value(){let e=this._getter;if(e!==void 0)this._value=e(),this._getter=void 0;return this._value}}function Lo(e){return new ff(e)}function df(e){return e===null||e===void 0}function No(e){let t=e.startsWith("^")?1:0,n=e.endsWith("$")?e.length-1:e.length;return e.slice(t,n)}function pf(e,t){let n=e/t,i=Math.round(n),r=4*Number.EPSILON*Math.max(Math.abs(n),1);if(Math.abs(n-i)<r)return 0;return n-i}function Pn(e,t,n){Object.defineProperty(e,t,{value:n,writable:!0,enumerable:!0,configurable:!0})}function Do(e){let t=Object.getOwnPropertyDescriptor(e,"shape");return t?.get?t.get.raw:t?.value}function hi(e){return Do(e._zod.def)??e._zod.def.shape}function mf(e,t,n){Object.defineProperty(e,t,{get(){let i=n();return Pn(this,t,i),i},enumerable:!0,configurable:!0})}function gf(e,t,n){if(t in e)Pn(e,t,n);else e[t]=n}function rr(e,t,n,i){let r=hi(t);for(let s of n){let o=Object.getOwnPropertyDescriptor(r,s);if(!o.enumerable)continue;if(o.get)mf(e,s,()=>{let a=t._zod.def.shape[s];return i?i(a,s):a});else gf(e,s,i?i(o.value,s):o.value)}}function yv(e,t){for(let n of Reflect.ownKeys(t)){let i=Object.getOwnPropertyDescriptor(t,n);if(!i.enumerable)continue;if(i.get)mf(e,n,()=>t[n]);else gf(e,n,i.value)}}function un(...e){let t={};for(let n of e){let i=Object.getOwnPropertyDescriptors(n);Object.assign(t,i)}return Object.defineProperties({},t)}function _f(e){return JSON.stringify(e)}function xf(e){return e.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")}var Pc="captureStackTrace"in Error?Error.captureStackTrace:(...e)=>{};function bs(e){return typeof e==="object"&&e!==null&&!Array.isArray(e)}var vf=Lo(()=>{if(on.jitless)return!1;if(typeof navigator<"u"&&navigator?.userAgent?.includes("Cloudflare"))return!1;try{return new Function(""),!0}catch(e){return!1}});function sr(e){if(bs(e)===!1)return!1;let t=e.constructor;if(t===void 0)return!0;if(typeof t!=="function")return!0;let n=t.prototype;if(bs(n)===!1)return!1;if(Object.prototype.hasOwnProperty.call(n,"isPrototypeOf")===!1)return!1;return!0}function Ic(e){if(sr(e))return{...e};if(Array.isArray(e))return[...e];if(e instanceof Map)return new Map(e);if(e instanceof Set)return new Set(e);return e}var yf=new Set(["string","number","symbol"]);function Ii(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function $n(e,t,n){let i=new e._zod.constr(t??e._zod.def);if(!t||n?.parent)i._zod.parent=e;return i}function Re(e){let t=e;if(!t)return{};if(typeof t==="string")return{error:()=>t};if(t?.message!==void 0){if(t?.error!==void 0)throw Error("Cannot specify both `message` and `error` params");t.error=t.message}if(delete t.message,typeof t.error==="string")return{...t,error:()=>t.error};return t}function Lc(e){if(typeof e==="bigint")return e.toString()+"n";if(typeof e==="string")return`"${e}"`;return`${e}`}function Sf(e){return Object.keys(e).filter((t)=>e[t]._zod.optin!==void 0&&e[t]._zod.optout==="optional")}var Oo=(()=>({safeint:[Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],int32:[-2147483648,2147483647],uint32:[0,4294967295],float32:[-340282346638528860000000000000000000000,340282346638528860000000000000000000000],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]}))(),Nc={int64:[BigInt("-9223372036854775808"),BigInt("9223372036854775807")],uint64:[BigInt(0),BigInt("18446744073709551615")]};function Sv(e,t){let n=e._zod.def,i=n.checks;if(i&&i.length>0)throw Error(".pick() cannot be used on object schemas containing refinements");let s={};return rr(s,e,Uo(e,t)),$n(e,un(n,{shape:s,checks:[]}))}function Uo(e,t){let n=hi(e),i=[];for(let r of Reflect.ownKeys(t)){if(!Object.getOwnPropertyDescriptor(n,r)?.enumerable)throw Error(`Unrecognized key: "${String(r)}"`);if(t[r])i.push(r)}return i}function bv(e,t){let n=e._zod.def,i=n.checks;if(i&&i.length>0)throw Error(".omit() cannot be used on object schemas containing refinements");let s=new Set(Uo(e,t)),o={};return rr(o,e,Reflect.ownKeys(hi(e)).filter((a)=>!s.has(a))),$n(e,un(n,{shape:o,checks:[]}))}function Mv(e,t){if(!sr(t))throw Error("Invalid input to extend: expected a plain object");let n=e._zod.def.checks;if(n&&n.length>0){let r=hi(e);for(let s of Reflect.ownKeys(t))if(Object.getOwnPropertyDescriptor(r,s)!==void 0)throw Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.")}return $n(e,un(e._zod.def,{shape:bf(e,t)}))}function bf(e,t){let n={};return rr(n,e,Reflect.ownKeys(hi(e))),yv(n,t),n}function wv(e,t){if(!sr(t))throw Error("Invalid input to safeExtend: expected a plain object");return $n(e,un(e._zod.def,{shape:bf(e,t)}))}function Tv(e,t){if(!t?._zod?.def)throw Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");if(e._zod.def.checks?.length)throw Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");let n={};rr(n,e,Reflect.ownKeys(hi(e))),rr(n,t,Reflect.ownKeys(hi(t)));let i=un(e._zod.def,{shape:n,get catchall(){return t._zod.def.catchall},checks:t._zod.def.checks??[]});return $n(e,i)}function Mf(e,t,n,i="partial"){let s=t._zod.def.checks;if(s&&s.length>0)throw Error(`.${i}() cannot be used on object schemas containing refinements`);let a=n?new Set(Uo(t,n)):void 0,c={};return rr(c,t,Reflect.ownKeys(hi(t)),e&&((l,u)=>a&&!a.has(u)?l:new e({type:"optional",innerType:l}))),$n(t,un(t._zod.def,{shape:c,checks:[]}))}function Ev(e,t,n){let i=n?new Set(Uo(t,n)):void 0,r={};return rr(r,t,Reflect.ownKeys(hi(t)),(s,o)=>i&&!i.has(o)?s:new e({type:"nonoptional",innerType:s})),$n(t,un(t._zod.def,{shape:r}))}function Zn(e,t=0){if(e.aborted===!0)return!0;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue!==!0)return!0;return!1}function wf(e,t=0){if(e.aborted===!0)return!0;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue===!1)return!0;return!1}function Li(e,t){return t.map((n)=>{var i;return(i=n).path??(i.path=[]),n.path.unshift(e),n})}function Ss(e){return typeof e==="string"?e:e?.message}function Dc(e,t,n){var i;for(let r=t;r<e.length;r++)(i=e[r]).schema??(i.schema=n)}function Xn(e,t,n){var i;let r=e.inst?._zod?.traits;if(r?.has("$ZodType"))if(r.has("$ZodCheck"))(i=e).schema??(i.schema=e.inst);else e.schema=e.inst;let s=e.schema!==e.inst?e.schema?._zod.def?.error:void 0,o=e.message?e.message:Ss(e.inst?._zod.def?.error?.(e))??Ss(s?.(e))??Ss(t?.error?.(e))??Ss(n.customError?.(e))??Ss(n.localeError?.(e))??"Invalid input",a={};for(let c of Object.keys(e)){if(c==="inst"||c==="schema"||c==="continue"||c==="input"||c==="__proto__")continue;a[c]=e[c]}if(a.path??(a.path=[]),a.message=o,t?.reportInput)a.input=e.input;return a}var Av=/[\uD800-\uDBFF]/;function Fo(e){let t=e.length;if(!Av.test(e))return t;let n=t;for(let i=0;i<t-1;i++)if((e.charCodeAt(i)&64512)===55296&&(e.charCodeAt(i+1)&64512)===56320)n--,i++;return n}function zo(e){if(Array.isArray(e))return"array";if(typeof e==="string")return"string";return"unknown"}function Tf(e){let t=typeof e;switch(t){case"number":return Number.isNaN(e)?"nan":"number";case"object":{if(e===null)return"null";if(Array.isArray(e))return"array";let n=e;if(n&&Object.getPrototypeOf(n)!==Object.prototype&&"constructor"in n&&n.constructor)return n.constructor.name}}return t}function or(...e){let[t,n,i]=e;if(typeof t==="string")return{message:t,code:"custom",input:n,inst:i};return{...t}}function Ef(e,t){for(let n in t){let i=Object.getOwnPropertyDescriptor(t,n);if(i.get)Object.defineProperty(e,n,{...i,enumerable:!1});else Rv(e,n,i.value)}}function fi(e,t,n,i=!0){return Object.defineProperty(e,t,{configurable:!0,writable:!0,enumerable:i,value:n}),n}function ko(e,t,n){return fi(e,t,n,!1)}function Af(e,t){for(let n in e){let i=e[n];Object.defineProperty(t,n,{configurable:!0,enumerable:!0,get(){return fi(this,n,i(this))},set(r){fi(this,n,r)}})}return t}function Rv(e,t,n){Object.defineProperty(e,t,{configurable:!0,get(){return this==null?n:fi(this,t,n.bind(this))},set(i){fi(this,t,i)}})}function Cv(e,t){let n=Object.getPrototypeOf(e);return t in n?void 0:n}var Rc,Pi=!1,Pv={configurable:!0,get(){Pi=!0;return}};function tt(e,t,n){let i=Object.getPrototypeOf(e._zod);if(t in i&&Rc!==e._zod){Rc=void 0;return}Rc=e._zod,Object.defineProperty(i,t,{configurable:!0,get(){Object.defineProperty(this,t,Pv);let r=Pi;Pi=!1;try{let s=n(this);if(Pi)delete this[t];else Object.defineProperty(this,t,{configurable:!0,writable:!0,value:s});return Pi=Pi||r,s}catch(s){throw delete this[t],Pi=Pi||r,s}},set(r){Object.defineProperty(this,t,{configurable:!0,writable:!0,value:r})}})}function Iv(e,t,n,i){let r=Cv(e,t);if(!r)return;Object.defineProperty(r,t,{configurable:!0,get(){let s={configurable:!0,writable:!0,enumerable:i,value:void 0};return Object.defineProperty(this,t,s),s.value=n(this),Object.defineProperty(this,t,s),s.value},set(s){Object.defineProperty(this,t,{configurable:!0,writable:!0,enumerable:i,value:s})}})}var Lv="~constantCatch";function Rf(e){let t=()=>e;return t[Lv]=!0,t}var Cf;var Oc={value:void 0,enumerable:!1},Pf="captureStackTrace"in Error?Error:null;function Nv(e){let t=Pf;if(t){let n=t.stackTraceLimit;if(typeof n==="number"){try{t.stackTraceLimit=0}catch{return Pf=null,new e}try{return new e}finally{t.stackTraceLimit=n}}}return new e}function j(e,t,n,i){let r={};function s(h){this.def=h,this.constr=f,this.traits=new Set}s.prototype=r;let o=n,a=o&&new WeakSet;function c(h,d){if(!h._zod){Oc.value=new s(d);try{Object.defineProperty(h,"_zod",Oc)}finally{Oc.value=void 0}}else if(h._zod.traits.has(e))return;if(h._zod.traits.add(e),t(h,d),a){let x=Object.getPrototypeOf(h),p=h._zod.constr.prototype,m=x;while(m&&m!==p)m=Object.getPrototypeOf(m);let E=m??x;if(!a.has(E))a.add(E),Ef(E,o)}let g=f.prototype;for(let x in g){if(!Object.prototype.hasOwnProperty.call(g,x))continue;if(!(x in h))h[x]=g[x].bind(h)}}let l=i?.Parent??Object;class u extends l{}Object.defineProperty(u,"name",{value:e});function f(h){let d=i?.Parent?Nv(u):this;c(d,h);let g=d._zod.deferred;if(g){for(let p of g)p();d._zod.deferred=void 0}let x=globalThis.__zod_globalConfig?.postProcessor;if(x)x(d);return d}return Object.defineProperty(f,"init",{value:c}),Object.defineProperty(f,Symbol.hasInstance,{value:(h)=>{if(i?.Parent&&h instanceof i.Parent)return!0;return h?._zod?.traits?.has(e)}}),Object.defineProperty(f,"name",{value:e}),f}class qn extends Error{constructor(){super("Encountered Promise during synchronous parse. Use .parseAsync() instead.")}}class Ts extends Error{constructor(e){super(`Encountered unidirectional transform during encode: ${e}`);this.name="ZodEncodeError"}}(Cf=globalThis).__zod_globalConfig??(Cf.__zod_globalConfig={});var on=globalThis.__zod_globalConfig;function hn(e){if(e)Object.assign(on,e);return on}function Dv(){let e=this._zod;return e.message??(e.message=JSON.stringify(e.def,ws,2)),e.message}function Ov(e){this._zod.message=e}var Uv={get:Dv,set:Ov,enumerable:!0,configurable:!0},Fc={value:void 0,enumerable:!1},If=new WeakSet([Object.prototype,Error.prototype]),Lf=(e,t)=>{e.name="$ZodError",Fc.value=t,Object.defineProperty(e,"issues",Fc),Fc.value=void 0,Object.defineProperty(e,"message",Uv);let n=Object.getPrototypeOf(e);if(!If.has(n))If.add(n),Object.defineProperty(n,"toString",{configurable:!0,enumerable:!1,get(){let i=()=>this.message;return Object.defineProperty(this,"toString",{value:i,configurable:!0,writable:!0}),i},set(i){Object.defineProperty(this,"toString",{value:i,configurable:!0,writable:!0})}})},Nf=j("$ZodError",Lf),v1=j("$ZodError",Lf,void 0,{Parent:Error});function Fv(e,t,n){if(!Object.prototype.hasOwnProperty.call(e,t))if(t==="__proto__")Object.defineProperty(e,t,{value:n(),writable:!0,enumerable:!0,configurable:!0});else e[t]=n();return e[t]}function Df(e,t=(n)=>n.message){let n={},i=[];for(let r of e.issues)if(r.path.length>0)Fv(n,r.path[0],()=>[]).push(t(r));else i.push(t(r));return{formErrors:i,fieldErrors:n}}function Of(e,t=(n)=>n.message){let n={_errors:[]},i=(r,s=[])=>{for(let o of r.issues)if(o.code==="invalid_union"&&o.errors.length)o.errors.map((a)=>i({issues:a},[...s,...o.path]));else if(o.code==="invalid_key")i({issues:o.issues},[...s,...o.path]);else if(o.code==="invalid_element")i({issues:o.issues},[...s,...o.path]);else{let a=[...s,...o.path];if(a.length===0)n._errors.push(t(o));else{let c=n,l=0;while(l<a.length){let u=a[l],f=l===a.length-1;if(u==="_errors"){if(f)c._errors.push(t(o));l++;continue}if(!Object.prototype.hasOwnProperty.call(c,u))Object.defineProperty(c,u,{value:{_errors:[]},enumerable:!0,writable:!0,configurable:!0});let h=c[u];if(f)h._errors.push(t(o));c=h,l++}}}};return i(e),n}function Bo(e,t){return{callee:t?.callee??e,Err:t?.Err}}var Go=(e)=>{let t=(n,i,r,s)=>{let o=r?{...r,async:!1}:{async:!1},a=n._zod.run({value:i,issues:[]},o);if(a instanceof Promise)throw new qn;if(a.issues.length){let c=new(s?.Err??e)(a.issues.map((l)=>Xn(l,o,hn())));throw Pc(c,s?.callee??t),c}return a.value};return t};var Ho=(e)=>{let t=async(n,i,r,s)=>{let o=r?{...r,async:!0}:{async:!0},a=n._zod.run({value:i,issues:[]},o);if(a instanceof Promise)a=await a;if(a.issues.length){let c=new(s?.Err??e)(a.issues.map((l)=>Xn(l,o,hn())));throw Pc(c,s?.callee??t),c}return a.value};return t};var Vo=(e)=>(t,n,i)=>{let r=i?{...i,async:!1}:{async:!1},s=t._zod.run({value:n,issues:[]},r);if(s instanceof Promise)throw new qn;return s.issues.length?Uf(e,s.issues,r):{success:!0,data:s.value}};function Uf(e,t,n){let i;return{success:!1,get error(){if(!i)i=new e(t.map((r)=>Xn(r,n,hn()))),t=void 0,n=void 0;return i},set error(r){i=r,t=void 0,n=void 0}}}var Wo=(e)=>async(t,n,i)=>{let r=i?{...i,async:!0}:{async:!0},s=t._zod.run({value:n,issues:[]},r);if(s instanceof Promise)s=await s;return s.issues.length?Uf(e,s.issues,r):{success:!0,data:s.value}};var zv=Symbol.for("zod.compile.invalid"),kv=Symbol.for("zod.compile.fallback"),zc=(e,t,n)=>{let i=e._zod.bag.validator;if(i!==void 0){if(i(t)!==zv)return!0;if(i.definite===!0&&n===void 0)return!1}return Bv(e,t,n)};function Bv(e,t,n){let i=n?{...n,async:!1,abortEarly:!0}:{async:!1,abortEarly:!0},r=e._zod.bag.fallbackRun,s;if(r)i[kv]=!0,s=r({value:t,issues:[]},i);else s=e._zod.run({value:t,issues:[]},i);if(s instanceof Promise)throw new qn;return s.issues.length===0}var kc=async(e,t,n)=>{let i=n?{...n,async:!0,abortEarly:!0}:{async:!0,abortEarly:!0},r=e._zod.run({value:t,issues:[]},i);if(r instanceof Promise)r=await r;return r.issues.length===0},Ff=(e)=>{let t=Go(e),n=(i,r,s,o)=>{let a=s?{...s,direction:"backward"}:{direction:"backward"};return t(i,r,a,Bo(n,o))};return n};var zf=(e)=>{let t=Go(e),n=(i,r,s,o)=>t(i,r,s,Bo(n,o));return n};var kf=(e)=>{let t=Ho(e),n=async(i,r,s,o)=>{let a=s?{...s,direction:"backward"}:{direction:"backward"};return await t(i,r,a,Bo(n,o))};return n};var Bf=(e)=>{let t=Ho(e),n=async(i,r,s,o)=>await t(i,r,s,Bo(n,o));return n};var Gf=(e)=>(t,n,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return Vo(e)(t,n,r)};var Hf=(e)=>(t,n,i)=>Vo(e)(t,n,i);var Vf=(e)=>async(t,n,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return Wo(e)(t,n,r)};var Wf=(e)=>async(t,n,i)=>Wo(e)(t,n,i);var $f=/^[cC][0-9a-z]{6,}$/,Zf=/^[0-9a-z]+$/,Xf=/^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/,qf=/^[0-9a-vA-V]{20}$/,Yf=/^[A-Za-z0-9]{27}$/,jf=/^[a-zA-Z0-9_-]{21}$/;function Kf(e){return new RegExp(`^[a-zA-Z0-9_-]{${e}}$`)}var Jf=/^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;var Qf=/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,Gc=(e)=>{if(!e)return/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`)};var ed=/^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;var Gv="^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$";function td(){return new RegExp(Gv,"u")}var nd=/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,id=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;var rd=/^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,sd=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,od=/^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,ad=/^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;var cd=/^https?$/,ld=/^\+[1-9]\d{6,14}$/;var ud="(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))";function Hv(e){return new RegExp(`^${e}$`)}var hd=Hv(ud);function Bc(e){return typeof e.precision==="number"?e.precision===-1?"(?:[01]\\d|2[0-3]):[0-5]\\d":e.precision===0?"(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d":`(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d\\.\\d{${e.precision}}`:e.seconds?"(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?":"(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?"}function fd(e){return new RegExp(`^${Bc(e)}$`)}function dd(e){let t=["Z"];if(e.offset)t.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");let n=`${Bc({precision:e.precision,seconds:!0})}(?:${t.join("|")})`,i=e.local?`${n}|${Bc({precision:e.precision})}`:n;return new RegExp(`^${ud}T(?:${i})$`)}var pd=/^[\s\S]{0,}$/;var Hc=/^-?\d+$/,Es=/^-?\d+(?:\.\d+)?$/,md=/^(?:true|false)$/i;var gd=/^[^A-Z]*$/,_d=/^[^a-z]*$/;var Vt=j("$ZodCheck",(e,t)=>{var n;e._zod??(e._zod={}),e._zod.def=t,(n=e._zod).onattach??(n.onattach=[])});var Vc=(e)=>{let t=e.value;return!df(t)&&t.length!==void 0},$o={number:"number",bigint:"bigint",object:"date"},Wc=j("$ZodCheckLessThan",(e,t)=>{Vt.init(e,t);let n=$o[typeof t.value];e._zod.check=(i)=>{if(t.inclusive?i.value<=t.value:i.value<t.value)return;i.issues.push({origin:$o[typeof i.value]??n,code:"too_big",maximum:typeof t.value==="object"?t.value.getTime():t.value,input:i.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),$c=j("$ZodCheckGreaterThan",(e,t)=>{Vt.init(e,t);let n=$o[typeof t.value];e._zod.check=(i)=>{if(t.inclusive?i.value>=t.value:i.value>t.value)return;i.issues.push({origin:$o[typeof i.value]??n,code:"too_small",minimum:typeof t.value==="object"?t.value.getTime():t.value,input:i.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),xd=j("$ZodCheckMultipleOf",(e,t)=>{Vt.init(e,t),e._zod.check=(n)=>{if(typeof n.value!==typeof t.value)throw Error("Cannot mix number and bigint in multiple_of check.");if(typeof n.value==="bigint"?t.value!==BigInt(0)&&n.value%t.value===BigInt(0):pf(n.value,t.value)===0)return;n.issues.push({origin:typeof n.value,code:"not_multiple_of",divisor:t.value,input:n.value,inst:e,continue:!t.abort})}}),vd=j("$ZodCheckNumberFormat",(e,t)=>{Vt.init(e,t),t.format=t.format||"float64";let n=t.format?.includes("int"),i=n?"int":"number",[r,s]=Oo[t.format];e._zod.check=(o)=>{let a=o.value;if(n){if(!Number.isInteger(a)){o.issues.push({expected:i,format:t.format,code:"invalid_type",continue:!1,input:a,inst:e});return}if(!Number.isSafeInteger(a)){if(a>0)o.issues.push({input:a,code:"too_big",maximum:Number.MAX_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:i,inclusive:!0,continue:!t.abort});else o.issues.push({input:a,code:"too_small",minimum:Number.MIN_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:i,inclusive:!0,continue:!t.abort});return}}if(a<r)o.issues.push({origin:"number",input:a,code:"too_small",minimum:r,inclusive:!0,inst:e,continue:!t.abort});if(a>s)o.issues.push({origin:"number",input:a,code:"too_big",maximum:s,inclusive:!0,inst:e,continue:!t.abort})}});var yd=j("$ZodCheckMaxLength",(e,t)=>{var n;Vt.init(e,t),(n=e._zod.def).when??(n.when=Vc),e._zod.check=(i)=>{let r=i.value,s=r.length;if((typeof r==="string"&&s>t.maximum?Fo(r):s)<=t.maximum)return;let a=zo(r);i.issues.push({origin:a,code:"too_big",maximum:t.maximum,inclusive:!0,input:r,inst:e,continue:!t.abort})}}),Sd=j("$ZodCheckMinLength",(e,t)=>{var n;Vt.init(e,t),(n=e._zod.def).when??(n.when=Vc),e._zod.check=(i)=>{let r=i.value,s=r.length;if((typeof r==="string"&&s>=t.minimum&&s<t.minimum*2?Fo(r):s)>=t.minimum)return;let a=zo(r);i.issues.push({origin:a,code:"too_small",minimum:t.minimum,inclusive:!0,input:r,inst:e,continue:!t.abort})}}),bd=j("$ZodCheckLengthEquals",(e,t)=>{var n;Vt.init(e,t),(n=e._zod.def).when??(n.when=Vc),e._zod.check=(i)=>{let r=i.value,s=r.length,o=typeof r==="string"&&s>=t.length&&s<=t.length*2?Fo(r):s;if(o===t.length)return;let a=zo(r),c=o>t.length;i.issues.push({origin:a,...c?{code:"too_big",maximum:t.length}:{code:"too_small",minimum:t.length},inclusive:!0,exact:!0,input:i.value,inst:e,continue:!t.abort})}}),Rs=j("$ZodCheckStringFormat",(e,t)=>{var n,i;if(Vt.init(e,t),t.pattern)(n=e._zod).check??(n.check=(r)=>{if(t.pattern.lastIndex=0,t.pattern.test(r.value))return;r.issues.push({origin:"string",code:"invalid_format",format:t.format,input:r.value,...t.pattern?{pattern:t.pattern.toString()}:{},inst:e,continue:!t.abort})});else(i=e._zod).check??(i.check=()=>{})}),Md=j("$ZodCheckRegex",(e,t)=>{Rs.init(e,t),e._zod.check=(n)=>{if(t.pattern.lastIndex=0,t.pattern.test(n.value))return;n.issues.push({origin:"string",code:"invalid_format",format:"regex",input:n.value,pattern:t.pattern.toString(),inst:e,continue:!t.abort})}}),wd=j("$ZodCheckLowerCase",(e,t)=>{t.pattern??(t.pattern=gd),Rs.init(e,t)}),Td=j("$ZodCheckUpperCase",(e,t)=>{t.pattern??(t.pattern=_d),Rs.init(e,t)}),Ed=j("$ZodCheckIncludes",(e,t)=>{Vt.init(e,t);let n=Ii(t.includes),i=new RegExp(typeof t.position==="number"?`^.{${t.position},}${n}`:n);t.pattern=i,e._zod.check=(r)=>{if(r.value.includes(t.includes,t.position))return;r.issues.push({origin:"string",code:"invalid_format",format:"includes",includes:t.includes,input:r.value,inst:e,continue:!t.abort})}}),Ad=j("$ZodCheckStartsWith",(e,t)=>{Vt.init(e,t);let n=new RegExp(`^${Ii(t.prefix)}.*`);t.pattern??(t.pattern=n),e._zod.check=(i)=>{if(i.value.startsWith(t.prefix))return;i.issues.push({origin:"string",code:"invalid_format",format:"starts_with",prefix:t.prefix,input:i.value,inst:e,continue:!t.abort})}}),Rd=j("$ZodCheckEndsWith",(e,t)=>{Vt.init(e,t);let n=new RegExp(`.*${Ii(t.suffix)}$`);t.pattern??(t.pattern=n),e._zod.check=(i)=>{if(i.value.endsWith(t.suffix))return;i.issues.push({origin:"string",code:"invalid_format",format:"ends_with",suffix:t.suffix,input:i.value,inst:e,continue:!t.abort})}});var Cd=j("$ZodCheckOverwrite",(e,t)=>{Vt.init(e,t),e._zod.check=(n)=>{n.value=t.tx(n.value)}});class Zc{constructor(e=[],t={}){this.content=[],this.indent=0,this.args=e,this.closed=t}indented(e){this.indent+=1;try{e(this)}finally{this.indent-=1}}write(e){if(typeof e==="function"){e(this,{execution:"sync"}),e(this,{execution:"async"});return}let n=e.split(`
`).filter((s)=>s),i=Math.min(...n.map((s)=>s.length-s.trimStart().length)),r=n.map((s)=>s.slice(i)).map((s)=>" ".repeat(this.indent*2)+s);for(let s of r)this.content.push(s)}compile(){let e=Function,t=this?.content??[""];return new e(...Object.keys(this.closed),`return function (${this.args.join(", ")}) {
${t.join(`
`)}
};`)(...Object.values(this.closed))}}var Id={major:4,minor:6,patch:4};var yt=j("$ZodType",(e,t)=>{var n;e??(e={}),e._zod.def=t,e._zod.bag=e._zod.bag||{},e._zod.version=Id;let i=e._zod.def.checks,r=e._zod.traits.has("$ZodCheck")?[e,...i??[]]:i?.length?[...i]:[];for(let s of r)for(let o of s._zod.onattach)o(e);if(r.length===0)(n=e._zod).deferred??(n.deferred=[]),e._zod.deferred?.push(()=>{e._zod.run=e._zod.parse});else{let s=(a,c,l)=>{if(a.memo)return a;let u=Zn(a),f;for(let h of c){if(h._zod.def.when){if(wf(a))continue;if(!h._zod.def.when(a))continue}else if(u)continue;let d=a.issues.length,g=h._zod.check(a);if(g instanceof Promise&&l?.async===!1)throw new qn;if(f||g instanceof Promise)f=(f??Promise.resolve()).then(async()=>{if(await g,a.issues.length===d)return;if(Dc(a.issues,d,e),!u)u=Zn(a,d)});else{if(a.issues.length===d)continue;if(Dc(a.issues,d,e),!u)u=Zn(a,d)}}if(f)return f.then(()=>a);return a},o=(a,c,l)=>{if(Zn(a))return a.aborted=!0,a;let u=s(c,r,l);if(u instanceof Promise){if(l.async===!1)throw new qn;return u.then((f)=>e._zod.parse(f,l))}return e._zod.parse(u,l)};e._zod.run=(a,c)=>{if(c.skipChecks)return e._zod.parse(a,c);if(c.direction==="backward"){let u=e._zod.parse({value:a.value,issues:[]},{...c,skipChecks:!0});if(u instanceof Promise)return u.then((f)=>o(f,a,c));return o(u,a,c)}let l=e._zod.parse(a,c);if(l instanceof Promise){if(c.async===!1)throw new qn;return l.then((u)=>s(u,r,c))}return s(l,r,c)}}},{get "~standard"(){return ko(this,"~standard",qc(this))},set "~standard"(e){fi(this,"~standard",e)}}),Hd=(e,t)=>e.issues.length?{issues:e.issues.map((n)=>Xn(n,t,hn()))}:{value:e.value};async function Vv(e,t){let n={async:!0};return Hd(await e._zod.run({value:t,issues:[]},n),n)}function qc(e){return{validate:(t)=>{let n={async:!1};try{let i=e._zod.run({value:t,issues:[]},n);if(!(i instanceof Promise))return Hd(i,n)}catch(i){}return Vv(e,t)},vendor:"zod",version:1}}var Yo=j("$ZodString",(e,t)=>{yt.init(e,t),e._zod.pattern=t.pattern??pd,e._zod.parse=(n,i)=>{if(t.coerce)try{n.value=String(n.value)}catch(r){}if(typeof n.value==="string")return n;return n.issues.push({expected:"string",code:"invalid_type",input:n.value,inst:e}),n}}),vt=j("$ZodStringFormat",(e,t)=>{Rs.init(e,t),Yo.init(e,t)}),Vd=j("$ZodGUID",(e,t)=>{t.pattern??(t.pattern=Qf),vt.init(e,t)}),Wd=j("$ZodUUID",(e,t)=>{if(t.version){let i={v1:1,v2:2,v3:3,v4:4,v5:5,v6:6,v7:7,v8:8}[t.version];if(i===void 0)throw Error(`Invalid UUID version: "${t.version}"`);t.pattern??(t.pattern=Gc(i))}else t.pattern??(t.pattern=Gc());vt.init(e,t)}),$d=j("$ZodEmail",(e,t)=>{t.pattern??(t.pattern=ed),vt.init(e,t)}),Zd=1,Xo=2;function Xd(e){try{if(typeof URL<"u"&&typeof URL.canParse==="function")return URL.canParse(e);return new URL(e),!0}catch{return!1}}function Wv(e,t){if(!("normalize"in t)&&!("hostname"in t)&&!("protocol"in t))return Xd(e)||Xo;return $v(e,t)}function $v(e,t){if(!t.normalize&&t.protocol?.source===cd.source&&!/^https?:\/\//i.test(e))return Zd;try{if(typeof URL<"u"){let n=URL;if(typeof n.parse==="function")return n.parse(e)??Xo}return new URL(e)}catch{return Xo}}var Zv=/[\t\n\r]/g;function Ld(e){return e.replace(Zv,"")}function Xv(e,t){return t.lastIndex=0,t.test(e.hostname)}function qv(e,t){return t.lastIndex=0,t.test(e.protocol.endsWith(":")?e.protocol.slice(0,-1):e.protocol)}var qd=j("$ZodURL",(e,t)=>{vt.init(e,t),e._zod.check=(n)=>{try{let i=n.value.trim(),r=Wv(i,t);if(r===Zd){n.issues.push({code:"invalid_format",format:"url",note:"Invalid URL format",input:n.value,inst:e,continue:!t.abort});return}if(r===Xo){n.issues.push({code:"invalid_format",format:"url",input:n.value,inst:e,continue:!t.abort});return}if(r===!0){n.value=Ld(i);return}if(t.hostname&&!Xv(r,t.hostname))n.issues.push({code:"invalid_format",format:"url",note:"Invalid hostname",pattern:t.hostname.source,input:n.value,inst:e,continue:!t.abort});if(t.protocol&&!qv(r,t.protocol))n.issues.push({code:"invalid_format",format:"url",note:"Invalid protocol",pattern:t.protocol.source,input:n.value,inst:e,continue:!t.abort});n.value=t.normalize?r.href:Ld(i);return}catch(i){n.issues.push({code:"invalid_format",format:"url",input:n.value,inst:e,continue:!t.abort})}}}),Yd=j("$ZodEmoji",(e,t)=>{t.pattern??(t.pattern=td()),vt.init(e,t)}),jd=j("$ZodNanoID",(e,t)=>{if(t.length!==void 0&&(!Number.isInteger(t.length)||t.length<1))throw Error(`Invalid nanoid length: ${t.length}`);t.pattern??(t.pattern=t.length===void 0?jf:Kf(t.length)),vt.init(e,t)}),Kd=j("$ZodCUID",(e,t)=>{t.pattern??(t.pattern=$f),vt.init(e,t)}),Jd=j("$ZodCUID2",(e,t)=>{t.pattern??(t.pattern=Zf),vt.init(e,t)}),Qd=j("$ZodULID",(e,t)=>{t.pattern??(t.pattern=Xf),vt.init(e,t)}),ep=j("$ZodXID",(e,t)=>{t.pattern??(t.pattern=qf),vt.init(e,t)}),tp=j("$ZodKSUID",(e,t)=>{t.pattern??(t.pattern=Yf),vt.init(e,t)}),np=j("$ZodISODateTime",(e,t)=>{t.pattern??(t.pattern=dd(t)),vt.init(e,t)}),ip=j("$ZodISODate",(e,t)=>{t.pattern??(t.pattern=hd),vt.init(e,t)}),rp=j("$ZodISOTime",(e,t)=>{t.pattern??(t.pattern=fd(t)),vt.init(e,t)}),sp=j("$ZodISODuration",(e,t)=>{t.pattern??(t.pattern=Jf),vt.init(e,t)}),op=j("$ZodIPv4",(e,t)=>{t.pattern??(t.pattern=nd),vt.init(e,t)}),Yv=/^[0-9a-fA-F:.]+$/;function ap(e){if(!Yv.test(e))return!1;return Xd(`http://[${e}]`)}var cp=j("$ZodIPv6",(e,t)=>{t.pattern??(t.pattern=id),vt.init(e,t),e._zod.check=(n)=>{if(!ap(n.value))n.issues.push({code:"invalid_format",format:"ipv6",input:n.value,inst:e,continue:!t.abort})}});var lp=j("$ZodCIDRv4",(e,t)=>{t.pattern??(t.pattern=rd),vt.init(e,t)});function jv(e){let t=e.split("/");if(t.length!==2)return!1;let[n,i]=t;if(!i)return!1;let r=Number(i);if(`${r}`!==i)return!1;if(r<0||r>128)return!1;return ap(n)}var up=j("$ZodCIDRv6",(e,t)=>{t.pattern??(t.pattern=sd),vt.init(e,t),e._zod.check=(n)=>{if(!jv(n.value))n.issues.push({code:"invalid_format",format:"cidrv6",input:n.value,inst:e,continue:!t.abort})}});function hp(e){if(e==="")return!0;if(/\s/.test(e))return!1;if(e.length%4!==0)return!1;try{return atob(e),!0}catch{return!1}}var Yc=/^[0-9a-zA-Z+/]*={0,2}$/,fp=j("$ZodBase64",(e,t)=>{t.pattern??(t.pattern=Yc),vt.init(e,t),e._zod.check=(n)=>{if(hp(n.value))return;n.issues.push({code:"invalid_format",format:"base64",input:n.value,inst:e,continue:!t.abort})}}),jo=/^[A-Za-z0-9_-]*$/;function Kv(e){if(!jo.test(e))return!1;let t=e.replace(/[-_]/g,(i)=>i==="-"?"+":"/"),n=t.padEnd(Math.ceil(t.length/4)*4,"=");return hp(n)}var dp=j("$ZodBase64URL",(e,t)=>{t.pattern??(t.pattern=jo),vt.init(e,t),e._zod.check=(n)=>{if(Kv(n.value))return;n.issues.push({code:"invalid_format",format:"base64url",input:n.value,inst:e,continue:!t.abort})}}),pp=j("$ZodE164",(e,t)=>{t.pattern??(t.pattern=ld),vt.init(e,t)});function Jv(e,t=null){try{let n=e.split(".");if(n.length!==3)return!1;let[i]=n;if(!i)return!1;let r=JSON.parse(atob(i));if("typ"in r&&r?.typ!=="JWT")return!1;if(!r.alg)return!1;if(t&&(!("alg"in r)||r.alg!==t))return!1;return!0}catch{return!1}}var mp=j("$ZodJWT",(e,t)=>{vt.init(e,t),e._zod.check=(n)=>{if(Jv(n.value,t.alg))return;n.issues.push({code:"invalid_format",format:"jwt",input:n.value,inst:e,continue:!t.abort})}});var jc=j("$ZodNumber",(e,t)=>{yt.init(e,t),e._zod.pattern=Es,e._zod.parse=(n,i)=>{if(t.coerce)try{n.value=Number(n.value)}catch(o){}let r=n.value;if(typeof r==="number"&&!Number.isNaN(r)&&Number.isFinite(r))return n;let s=typeof r==="number"?Number.isNaN(r)?"NaN":!Number.isFinite(r)?String(r):void 0:void 0;return n.issues.push({expected:"number",code:"invalid_type",input:r,inst:e,...s?{received:s}:{}}),n}}),gp=j("$ZodNumberFormat",(e,t)=>{vd.init(e,t),jc.init(e,t)}),_p=j("$ZodBoolean",(e,t)=>{yt.init(e,t),e._zod.pattern=md,e._zod.parse=(n,i)=>{if(t.coerce)try{n.value=Boolean(n.value)}catch(s){}let r=n.value;if(typeof r==="boolean")return n;return n.issues.push({expected:"boolean",code:"invalid_type",input:r,inst:e}),n}});var xp=j("$ZodUnknown",(e,t)=>{yt.init(e,t),e._zod.parse=(n)=>n}),vp=j("$ZodNever",(e,t)=>{yt.init(e,t),e._zod.parse=(n,i)=>(n.issues.push({expected:"never",code:"invalid_type",input:n.value,inst:e}),n)});function Nd(e,t,n){if(e.issues.length)t.issues.push(...Li(n,e.issues));t.value[n]=e.value}var yp=j("$ZodArray",(e,t)=>{yt.init(e,t);let n=on.memoizer;n?.attach(e),e._zod.parse=(i,r)=>{let s=i.value;if(!Array.isArray(s))return i.issues.push({expected:"array",code:"invalid_type",input:s,inst:e}),i;i.value=n?n.alloc(e,i,Array(s.length),r):Array(s.length);let o=[],a=r?.abortEarly;for(let c=0;c<s.length;c++){let l=s[c],u=t.element._zod.run({value:l,issues:[]},r);if(u instanceof Promise)o.push(u.then((f)=>Nd(f,i,c)));else if(Nd(u,i,c),a&&u.issues.length!==0&&Zn(u))break}if(o.length)return Promise.all(o).then(()=>i);return i}});function qo(e,t,n,i,r,s){let o=n in i,a=s==="optional";if(!o&&a&&r==="optional")return;if(e.issues.length){if(r!==void 0&&a&&!o)return;t.issues.push(...Li(n,e.issues))}if(!o&&r===void 0){if(!e.issues.length)t.issues.push({code:"invalid_type",expected:"nonoptional",input:void 0,path:[n]});return}if(e.value===void 0){if(o||r==="defaulted"&&!a)t.value[n]=void 0}else t.value[n]=e.value}var Qv=[];function Sp(e){let t=Object.keys(e.shape),n=Object.getOwnPropertySymbols(e.shape),i=n.length?n:Qv,r=i.length?[...t,...i]:t;for(let o of r)if(!e.shape?.[o]?._zod?.traits?.has("$ZodType"))throw Error(`Invalid element at key "${String(o)}": expected a Zod schema`);let s=Sf(e.shape);return{...e,allKeys:r,symbolKeys:i,keySet:new Set(t),numKeys:t.length,optionalKeys:new Set(s)}}function bp(e,t,n,i,r,s,o){let a=[],c=r.keySet,l=r.catchall._zod,u=l.def.type,{optin:f,optout:h}=l,d=0;for(let g in t){if(o&&n.issues.length!==d){if(Zn(n,d))break;d=n.issues.length}if(c.has(g))continue;if(g==="__proto__"){if(u==="never")a.push(g);continue}if(u==="never"){a.push(g);continue}let x=l.run({value:t[g],issues:[]},i);if(x instanceof Promise)e.push(x.then((p)=>qo(p,n,g,t,f,h)));else qo(x,n,g,t,f,h)}if(a.length)n.issues.push({code:"unrecognized_keys",keys:a,input:t,inst:s,continue:!0});if(!e.length)return n;return Promise.all(e).then(()=>n)}var ey=j("$ZodObject",(e,t)=>{yt.init(e,t);let n=Object.getOwnPropertyDescriptor(t,"shape"),i=n?.get?n.get.raw:t.shape??{};if(i){let l=()=>{let u={...i};return Object.defineProperty(t,"shape",{value:u}),l.raw=u,u};l.raw=i,Object.defineProperty(t,"shape",{get:l})}let r=Lo(()=>Sp(t));tt(e,"propValues",(l)=>{let u=l.def.shape,f={};for(let h in u){let d=u[h]._zod;if(d.values){if(!Object.prototype.hasOwnProperty.call(f,h))Pn(f,h,new Set);for(let g of d.values)f[h].add(g);if(d.optin!==void 0)f[h].add(void 0)}}return f});let s=bs,o=t.catchall,a,c=on.memoizer;c?.attach(e),e._zod.parse=(l,u)=>{a??(a=r.value);let f=l.value;if(!s(f))return l.issues.push({expected:"object",code:"invalid_type",input:f,inst:e}),l;l.value=c?c.alloc(e,l,{},u):{};let h=[],d=a.shape,g=u?.abortEarly,x=l.issues.length;for(let p of a.allKeys){if(g&&l.issues.length!==x){if(Zn(l,x))break;x=l.issues.length}if(p==="__proto__")continue;let m=d[p],E=m._zod.optin,R=m._zod.optout,S=m._zod.run({value:f[p],issues:[]},u);if(S instanceof Promise)h.push(S.then((b)=>qo(b,l,p,f,E,R)));else qo(S,l,p,f,E,R)}if(!o)return h.length?Promise.all(h).then(()=>l):l;return bp(h,f,l,u,r.value,e,g===!0)}}),Mp=j("$ZodObjectJIT",(e,t)=>{ey.init(e,t);let n=e._zod.parse,i=Lo(()=>Sp(t)),r=on.memoizer,s=(d)=>{let g=i.value,x=g.symbolKeys,p=new Zc(["payload","ctx"],{shape:d,inst:e,memo:r,syms:x}),m=(b)=>`shape[${b}]._zod.run({ value: input[${b}], issues: [] }, ctx)`,E=(b,T)=>`
          let ${b}_ab = false;
          for (let i = 0; i < ${b}.issues.length; i++) {
            const iss = ${b}.issues[i];
            iss.path = iss.path ? [${T}, ...iss.path] : [${T}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${b}_ab = true;
          }
          if (${b}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;p.write("const input = payload.value;");let R=Object.create(null),S=0;for(let b of g.allKeys)R[b]=`key_${S++}`;p.write(r?"const newResult = memo.alloc(inst, payload, {}, ctx);":"const newResult = {};");for(let b of g.allKeys){if(b==="__proto__")continue;let T=R[b],A=typeof b==="symbol"?`syms[${x.indexOf(b)}]`:_f(b),_=`${A} in input`,M=d[b],F=M?._zod?.optin,P=F!==void 0,O=M?._zod?.optout==="optional";if(p.write(`const ${T} = ${m(A)};`),P&&O){let K=F==="optional"?`${T}_present`:`${T}.value !== undefined || ${T}_present`;p.write(`
        const ${T}_present = ${_};
        if (!${T}.issues.length || ${T}_present) {
          if (${T}.issues.length) {${E(T,A)}
          }

          if (${K}) {
            newResult[${A}] = ${T}.value;
          }
        }

      `)}else if(!P)p.write(`
        const ${T}_present = ${_};
        if (${T}.issues.length) {${E(T,A)}
        }
        if (!${T}_present && !${T}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${A}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${T}_present) {
          newResult[${A}] = ${T}.value;
        }

      `);else if(p.write(`
        if (${T}.issues.length) {${E(T,A)}
        }
      `),F==="defaulted")p.write(`newResult[${A}] = ${T}.value;`);else p.write(`
        if (${T}.value !== undefined || ${_}) {
          newResult[${A}] = ${T}.value;
        }
      `)}return p.write("payload.value = newResult;"),p.write("return payload;"),p.compile()},o,a=bs,c=!on.jitless,u=c&&vf.value,f=t.catchall,h;e._zod.parse=(d,g)=>{h??(h=i.value);let x=d.value;if(!a(x))return d.issues.push({expected:"object",code:"invalid_type",input:x,inst:e}),d;if(c&&u&&g?.async===!1&&g.jitless!==!0){if(!o)o=s(t.shape);if(d=o(d,g),!f)return d;return bp([],x,d,g,h,e,g?.abortEarly===!0)}return n(d,g)}});function Dd(e,t,n,i){for(let s of e)if(s.issues.length===0)return t.value=s.value,t;let r=e.filter((s)=>!Zn(s));if(r.length===1)return t.value=r[0].value,r[0];return t.issues.push({code:"invalid_union",input:t.value,inst:n,errors:e.map((s)=>s.issues.map((o)=>Xn(o,i,hn())))}),t}var wp=j("$ZodUnion",(e,t)=>{yt.init(e,t),tt(e,"optin",(i)=>i.def.options.some((r)=>r._zod.optin==="defaulted")?"defaulted":i.def.options.some((r)=>r._zod.optin!==void 0)?"optional":void 0),tt(e,"optout",(i)=>i.def.options.some((r)=>r._zod.optout==="optional")?"optional":void 0),tt(e,"values",(i)=>{if(i.def.options.every((r)=>r._zod.values))return new Set(i.def.options.flatMap((r)=>Array.from(r._zod.values)));return}),tt(e,"pattern",(i)=>{if(i.def.options.every((r)=>r._zod.pattern)){let r=i.def.options.map((s)=>s._zod.pattern);return new RegExp(`^(${r.map((s)=>No(s.source)).join("|")})$`)}return});let n=t.options.length===1?t.options[0]._zod.run:null;e._zod.parse=(i,r)=>{if(n)return n(i,r);let s=!1,o=[];for(let a of t.options){let c=a._zod.run({value:i.value,issues:[]},r);if(c instanceof Promise)o.push(c),s=!0;else{if(c.issues.length===0)return c;o.push(c)}}if(!s)return Dd(o,i,e,r);return Promise.all(o).then((a)=>Dd(a,i,e,r))}});var Tp=j("$ZodIntersection",(e,t)=>{yt.init(e,t),e._zod.parse=(n,i)=>{let r=n.value,s=t.left._zod.run({value:r,issues:[]},i),o=t.right._zod.run({value:r,issues:[]},i);if(s instanceof Promise||o instanceof Promise)return Promise.all([s,o]).then(([c,l])=>Od(n,c,l));return Od(n,s,o)}});function Xc(e,t){if(e===t)return{valid:!0,data:e};if(e instanceof Date&&t instanceof Date&&+e===+t)return{valid:!0,data:e};if(sr(e)&&sr(t)){let n=Object.keys(t),i=Object.keys(e).filter((s)=>n.indexOf(s)!==-1),r={...e,...t};if(Object.prototype.hasOwnProperty.call(r,"__proto__"))delete r.__proto__;for(let s of i){if(s==="__proto__")continue;let o=Xc(e[s],t[s]);if(!o.valid)return{valid:!1,mergeErrorPath:[s,...o.mergeErrorPath]};r[s]=o.data}return{valid:!0,data:r}}if(Array.isArray(e)&&Array.isArray(t)){if(e.length!==t.length)return{valid:!1,mergeErrorPath:[]};let n=[];for(let i=0;i<e.length;i++){let r=e[i],s=t[i],o=Xc(r,s);if(!o.valid)return{valid:!1,mergeErrorPath:[i,...o.mergeErrorPath]};n.push(o.data)}return{valid:!0,data:n}}return{valid:!1,mergeErrorPath:[]}}function Od(e,t,n){let i=new Map,r,s=new Map,o=(l,u)=>{let f;if(l.code==="unrecognized_keys"&&!l.path?.length)r??(r=l),f=l.keys;else if(l.code==="invalid_key"&&l.origin==="record"&&l.path?.length===1){let h=String(l.path[0]);if(!s.has(h))s.set(h,l);f=[h]}else return!1;for(let h of f){if(!i.has(h))i.set(h,{});i.get(h)[u]=!0}return!0};for(let l of t.issues)if(!o(l,"l"))e.issues.push(l);for(let l of n.issues)if(!o(l,"r"))e.issues.push(l);let a=[...i].filter(([,l])=>l.l&&l.r).map(([l])=>l);if(a.length){let l=r?a.filter((u)=>r.keys.includes(u)):[];if(l.length)e.issues.push({...r,keys:l});for(let u of a)if(!l.includes(u)&&s.has(u))e.issues.push(s.get(u))}let c=Xc(t.value,n.value);if(!c.valid){if(Zn(e))return e;throw Error(`Unmergable intersection. Error path: ${JSON.stringify(c.mergeErrorPath)}`)}return e.value=c.data,e}var Ep=j("$ZodRecord",(e,t)=>{yt.init(e,t);let n=on.memoizer;n?.attach(e),e._zod.parse=(i,r)=>{let s=i.value;if(!sr(s))return i.issues.push({expected:"record",code:"invalid_type",input:s,inst:e}),i;let o=[],a=t.keyType._zod.values;if(a&&!t.partial){i.value=n?n.alloc(e,i,{},r):{};let c=new Set;for(let u of a)if(typeof u==="string"||typeof u==="number"||typeof u==="symbol"){if(c.add(typeof u==="number"?u.toString():u),u==="__proto__")continue;let f=t.keyType._zod.run({value:u,issues:[]},r);if(f instanceof Promise)throw Error("Async schemas not supported in object keys currently");if(f.issues.length){i.issues.push({code:"invalid_key",origin:"record",issues:f.issues.map((g)=>Xn(g,r,hn())),input:u,path:[u],inst:e});continue}let h=f.value;if(h==="__proto__")continue;let d=t.valueType._zod.run({value:s[u],issues:[]},r);if(d instanceof Promise)o.push(d.then((g)=>{if(g.issues.length)i.issues.push(...Li(u,g.issues));i.value[h]=g.value}));else{if(d.issues.length)i.issues.push(...Li(u,d.issues));i.value[h]=d.value}}let l;for(let u in s)if(!c.has(u))if(t.mode==="loose"){if(u==="__proto__")continue;i.value[u]=s[u]}else l=l??[],l.push(u);if(l&&l.length>0)i.issues.push({code:"unrecognized_keys",input:s,inst:e,keys:l,continue:!0})}else{i.value=n?n.alloc(e,i,{},r):{};let c;for(let l of Reflect.ownKeys(s)){if(l==="__proto__")continue;if(!Object.prototype.propertyIsEnumerable.call(s,l))continue;let u=t.keyType._zod.run({value:l,issues:[]},r);if(u instanceof Promise)throw Error("Async schemas not supported in object keys currently");if(typeof l==="string"&&Es.test(l)&&u.issues.length){let g=t.keyType._zod.run({value:Number(l),issues:[]},r);if(g instanceof Promise)throw Error("Async schemas not supported in object keys currently");if(g.issues.length===0)u=g}if(u.issues.length){if(t.mode==="loose")i.value[l]=s[l];else if(a)c=c??[],c.push(l);else i.issues.push({code:"invalid_key",origin:"record",issues:u.issues.map((g)=>Xn(g,r,hn())),input:l,path:[l],inst:e});continue}let h=u.value;if(h==="__proto__")continue;let d=t.valueType._zod.run({value:s[l],issues:[]},r);if(d instanceof Promise)o.push(d.then((g)=>{if(g.issues.length)i.issues.push(...Li(l,g.issues));i.value[h]=g.value}));else{if(d.issues.length)i.issues.push(...Li(l,d.issues));i.value[h]=d.value}}if(c&&c.length>0)i.issues.push({code:"unrecognized_keys",input:s,inst:e,keys:c,continue:!0})}if(o.length)return Promise.all(o).then(()=>i);return i}});var Ap=j("$ZodEnum",(e,t)=>{yt.init(e,t);let n=Ms(t.entries),i=new Set(n);e._zod.values=i,tt(e,"pattern",(r)=>{let s=Ms(r.def.entries).filter((o)=>yf.has(typeof o));return new RegExp(s.length?`^(${s.map((o)=>Ii(o.toString())).join("|")})$`:"^[^\\s\\S]$")}),e._zod.parse=(r,s)=>{let o=r.value;if(i.has(o))return r;return r.issues.push({code:"invalid_value",values:n,input:o,inst:e}),r}}),Rp=j("$ZodLiteral",(e,t)=>{yt.init(e,t);let n=new Set(t.values);e._zod.values=n,tt(e,"pattern",(i)=>{let r=i.def.values;return new RegExp(r.length?`^(${r.map((s)=>typeof s==="string"?Ii(s):s?Ii(s.toString()):String(s)).join("|")})$`:"^[^\\s\\S]$")}),e._zod.parse=(i,r)=>{let s=i.value;if(n.has(s))return i;return i.issues.push({code:"invalid_value",values:t.values,input:s,inst:e}),i}});var Cp=j("$ZodTransform",(e,t)=>{yt.init(e,t),e._zod.optin="optional",on.memoizer?.guard(e),e._zod.parse=(n,i)=>{if(i.direction==="backward")throw new Ts(e.constructor.name);let r=t.transform(n.value,n);if(i.async)return(r instanceof Promise?r:Promise.resolve(r)).then((o)=>(n.value=o,n));if(r instanceof Promise)throw new qn;return n.value=r,n}});function Ud(e,t){return e.value=t.issues.length?void 0:t.value,e}var Kc=j("$ZodOptional",(e,t)=>{yt.init(e,t),tt(e,"optin",(n)=>n.def.innerType._zod.optin==="defaulted"?"defaulted":"optional"),e._zod.optout="optional",tt(e,"values",(n)=>{let i=n.def.innerType._zod.values;return i?new Set([...i,void 0]):void 0}),tt(e,"pattern",(n)=>{let i=n.def.innerType._zod.pattern;return i?new RegExp(`^(${No(i.source)})?$`):void 0}),e._zod.parse=(n,i)=>{if(n.value===void 0){if(t.innerType._zod.optin!=="defaulted")return n;let r=t.innerType._zod.run({value:n.value,issues:[]},i);if(r instanceof Promise)return r.then((s)=>Ud(n,s));return Ud(n,r)}return t.innerType._zod.run(n,i)}}),Pp=j("$ZodExactOptional",(e,t)=>{Kc.init(e,t),tt(e,"values",(n)=>n.def.innerType._zod.values),tt(e,"pattern",(n)=>n.def.innerType._zod.pattern),e._zod.parse=(n,i)=>t.innerType._zod.run(n,i)}),Ip=j("$ZodNullable",(e,t)=>{yt.init(e,t),tt(e,"optin",(n)=>n.def.innerType._zod.optin),tt(e,"optout",(n)=>n.def.innerType._zod.optout),tt(e,"pattern",(n)=>{let i=n.def.innerType._zod.pattern;return i?new RegExp(`^(${No(i.source)}|null)$`):void 0}),tt(e,"values",(n)=>n.def.innerType._zod.values?new Set([...n.def.innerType._zod.values,null]):void 0),e._zod.parse=(n,i)=>{if(n.value===null)return n;return t.innerType._zod.run(n,i)}}),Lp=j("$ZodDefault",(e,t)=>{yt.init(e,t),e._zod.optin="defaulted",tt(e,"values",(n)=>n.def.innerType._zod.values),e._zod.parse=(n,i)=>{if(i.direction==="backward")return t.innerType._zod.run(n,i);if(n.value===void 0)return n.value=t.defaultValue,n;let r=t.innerType._zod.run(n,i);if(r instanceof Promise)return r.then((s)=>Fd(s,t));return Fd(r,t)}});function Fd(e,t){if(e.value===void 0)e.value=t.defaultValue;return e}var Np=j("$ZodPrefault",(e,t)=>{yt.init(e,t),e._zod.optin="defaulted",tt(e,"values",(n)=>n.def.innerType._zod.values),e._zod.parse=(n,i)=>{if(i.direction==="backward")return t.innerType._zod.run(n,i);if(n.value===void 0)n.value=t.defaultValue;return t.innerType._zod.run(n,i)}}),Dp=j("$ZodNonOptional",(e,t)=>{yt.init(e,t),tt(e,"values",(n)=>{let i=n.def.innerType._zod.values;return i?new Set([...i].filter((r)=>r!==void 0)):void 0}),e._zod.parse=(n,i)=>{let r=t.innerType._zod.run(n,i);if(r instanceof Promise)return r.then((s)=>zd(s,e));return zd(r,e)}});function zd(e,t){if(!e.issues.length&&e.value===void 0)e.issues.push({code:"invalid_type",expected:"nonoptional",input:e.value,inst:t});return e}function kd(e,t,n,i){if(!t.issues.length){if(e.value=t.value,t.memo)e.memo=!0;return e}return e.value=n.catchValue({...t,value:e.value,error:{issues:t.issues.map((r)=>Xn(r,i,hn()))},input:e.value}),e}var Op=j("$ZodCatch",(e,t)=>{yt.init(e,t),tt(e,"optin",(n)=>n.def.innerType._zod.optin==="defaulted"?"defaulted":"optional"),tt(e,"optout",(n)=>n.def.innerType._zod.optout),tt(e,"values",(n)=>n.def.innerType._zod.values),e._zod.parse=(n,i)=>{if(i.direction==="backward")return t.innerType._zod.run(n,i);let r=t.innerType._zod.run({value:n.value,issues:[]},i);if(r instanceof Promise)return r.then((s)=>kd(n,s,t,i));return kd(n,r,t,i)}});var Up=j("$ZodPipe",(e,t)=>{yt.init(e,t),tt(e,"values",(n)=>n.def.in._zod.values),tt(e,"optin",(n)=>n.def.in._zod.optin),tt(e,"optout",(n)=>n.def.out._zod.optout),tt(e,"propValues",(n)=>n.def.in._zod.propValues),e._zod.parse=(n,i)=>{if(i.direction==="backward"){let s=t.out._zod.run(n,i);if(s instanceof Promise)return s.then((o)=>Zo(o,t.in,i));return Zo(s,t.in,i)}let r=t.in._zod.run(n,i);if(r instanceof Promise)return r.then((s)=>Zo(s,t.out,i));return Zo(r,t.out,i)}});function Zo(e,t,n){if(e.issues.some((i)=>i.code!=="unrecognized_keys"))return e.aborted=!0,e;return t._zod.run({value:e.value,issues:e.issues},n)}var Fp=j("$ZodReadonly",(e,t)=>{yt.init(e,t),tt(e,"propValues",(n)=>n.def.innerType._zod.propValues),tt(e,"values",(n)=>n.def.innerType._zod.values),tt(e,"optin",(n)=>n.def.innerType?._zod?.optin),tt(e,"optout",(n)=>n.def.innerType?._zod?.optout),e._zod.parse=(n,i)=>{if(i.direction==="backward")return t.innerType._zod.run(n,i);let r=t.innerType._zod.run(n,i);if(r instanceof Promise)return r.then(Bd);return Bd(r)}});function Bd(e){if(!e.memo)e.value=Object.freeze(e.value);return e}var zp=j("$ZodCustom",(e,t)=>{Vt.init(e,t),yt.init(e,t),e._zod.parse=(n,i)=>n,e._zod.check=(n)=>{let i=n.value,r=t.fn(i);if(r instanceof Promise)return r.then((s)=>Gd(s,n,i,e));Gd(r,n,i,e);return}});function Gd(e,t,n,i){if(!e){let r={code:"custom",input:n,inst:i,path:[...i._zod.def.path??[]],continue:!i._zod.def.abort};if(i._zod.def.params)r.params=i._zod.def.params;t.issues.push(or(r))}}class Bp extends Error{constructor(){super("Cannot parse a reference cycle that closes through a transform");this.name="ZodCyclicError"}}var Qc="~memo",kp=[];function Gp(e){return e!==null&&typeof e==="object"}function Jc(e){return e.map((t)=>t.path?{...t,path:t.path.slice()}:{...t})}var Hp=new WeakMap,Cs=0,Qo=1,Ps=2;function ea(e,t,n){let i=Hp.get(e);if(i!==void 0)return i?Ps:Cs;if(t.has(e))return Ps;t.add(e);let r=Cs,s=(u)=>{if(r!==Ps&&u?._zod){let f=ea(u,t,n);if(f>r)r=f}},o=(u,f)=>{let h=Cs;for(let d of Reflect.ownKeys(u)){let g=Object.getOwnPropertyDescriptor(u,d);if(f&&!g.enumerable)continue;let x=g.get?Qo:g.value?._zod?ea(g.value,t,n):Cs;if(x>h)h=x}return h},a=(u)=>{if(u>r)r=u},c=e._zod.def,l=c.type;switch(l){case"object":{let u=Do(c);a(u?o(u,!0):Qo),s(c.catchall);break}case"array":s(c.element);break;case"tuple":for(let u of c.items)s(u);s(c.rest);break;case"record":case"map":s(c.keyType),s(c.valueType);break;case"set":s(c.valueType);break;case"union":for(let u of c.options)s(u);break;case"intersection":s(c.left),s(c.right);break;case"optional":case"nullable":case"default":case"prefault":case"catch":case"readonly":case"nonoptional":case"promise":case"success":s(c.innerType);break;case"pipe":s(c.in),s(c.out);break;case"function":s(c.input),s(c.output);break;case"lazy":{let u=c._cachedInner??(n?e._zod.innerType:void 0);a(u?ea(u,t,!1):Qo);break}case"template_literal":case"string":case"number":case"int":case"boolean":case"bigint":case"symbol":case"undefined":case"null":case"void":case"never":case"any":case"unknown":case"date":case"nan":case"enum":case"literal":case"file":case"transform":case"custom":break;default:for(let u in c){let f=Object.getOwnPropertyDescriptor(c,u);if(!f||f.get)continue;let h=f.value;if(!h||typeof h!=="object")continue;if(h._zod)s(h);else if(Array.isArray(h))for(let d of h)s(d)}}return t.delete(e),ty(e,r)}function ty(e,t){if(t!==Qo)Hp.set(e,t===Ps);return t}function ny(e,t){let n=e.buckets.get(t);if(!n)n=new WeakMap,e.buckets.set(t,n);return n}var Ko,Jo=[],iy={alloc(e,t,n){let i=Ko;if(!i)return n;Ko=void 0;let r={value:n,issues:null};return i.set(t.value,r),Jo.push(r),n},guard(e){var t;(t=e._zod).deferred??(t.deferred=[]),e._zod.deferred.push(()=>{let n=e._zod.parse,i=(r,s)=>{if(s.direction!=="backward"&&ry(s,r.value))throw new Bp;return n(r,s)};if(e._zod.parse=i,e._zod.run===n)e._zod.run=i})},attach(e){var t;let n,i=!1,r,s;(t=e._zod).deferred??(t.deferred=[]),e._zod.deferred.push(()=>{let o=e._zod.parse,a=(c,l)=>{if(n===void 0){let m=ea(e,new Set,!1);if(m===Cs){if(e._zod.parse=o,e._zod.run===a)e._zod.run=o;return o(c,l)}if(m===Ps||i)n=!0;else i=!0}let u=c.value;if(!Gp(u))return o(c,l);let f=l[Qc];if(!f)f={buckets:new WeakMap,backEdges:void 0},l[Qc]=f;let h;if(r===l)h=s;else h=ny(f,e),r=l,s=h;let d=h.get(u);if(d){if(c.value=d.value,d.issues){if(d.issues.length)c.issues.push(...Jc(d.issues))}else c.memo=!0,f.backEdges??(f.backEdges=new WeakSet),f.backEdges.add(d.value);return c}Ko=h;let g=Jo.length,x=o(c,l);Ko=void 0;let p=Jo.length>g?Jo.pop():void 0;if(x instanceof Promise)return x.then((m)=>{if(p)p.issues=m.issues.length?Jc(m.issues):kp;return m});if(p)p.issues=x.issues.length?Jc(x.issues):kp;return x};if(e._zod.parse=a,e._zod.run===o)e._zod.run=a})}};function Vp(){return iy}function ry(e,t){let n=e[Qc]?.backEdges;return n!==void 0&&Gp(t)&&n.has(t)}var sy=()=>{let e={string:{unit:"characters",verb:"to have"},file:{unit:"bytes",verb:"to have"},array:{unit:"items",verb:"to have"},set:{unit:"items",verb:"to have"},map:{unit:"entries",verb:"to have"}};function t(s){return e[s]??null}let n={regex:"input",email:"email address",url:"URL",emoji:"emoji",uuid:"UUID",uuidv4:"UUIDv4",uuidv6:"UUIDv6",nanoid:"nanoid",guid:"GUID",cuid:"cuid",cuid2:"cuid2",ulid:"ULID",xid:"XID",ksuid:"KSUID",datetime:"ISO datetime",date:"ISO date",time:"ISO time",duration:"ISO duration",ipv4:"IPv4 address",ipv6:"IPv6 address",mac:"MAC address",cidrv4:"IPv4 range",cidrv6:"IPv6 range",base64:"base64-encoded string",base64url:"base64url-encoded string",json_string:"JSON string",e164:"E.164 number",currency_code:"currency code",credit_card:"credit card number",iban:"IBAN",jwt:"JWT",template_literal:"input"},i={nan:"NaN"};function r(s,o){if(s==="number"&&typeof o==="number"&&!Number.isFinite(o))return String(o);return i[s]??s}return(s)=>{switch(s.code){case"invalid_type":{let o=r(s.expected),a=Tf(s.input),c=r(a,s.input);return`Invalid input: expected ${o}, received ${c}`}case"invalid_value":if(s.values.length===1)return`Invalid input: expected ${Lc(s.values[0])}`;return`Invalid option: expected one of ${Cc(s.values,"|")}`;case"too_big":{let o=s.exact?"exactly ":s.inclusive?"<=":"<",a=t(s.origin);if(a)return`Too big: expected ${s.origin??"value"} to have ${o}${s.maximum.toString()} ${a.unit??"elements"}`;return`Too big: expected ${s.origin??"value"} to be ${o}${s.maximum.toString()}`}case"too_small":{let o=s.exact?"exactly ":s.inclusive?">=":">",a=t(s.origin);if(a)return`Too small: expected ${s.origin} to have ${o}${s.minimum.toString()} ${a.unit}`;return`Too small: expected ${s.origin} to be ${o}${s.minimum.toString()}`}case"invalid_format":{let o=s;if(o.format==="starts_with")return`Invalid string: must start with "${o.prefix}"`;if(o.format==="ends_with")return`Invalid string: must end with "${o.suffix}"`;if(o.format==="includes")return`Invalid string: must include "${o.includes}"`;if(o.format==="regex")return`Invalid string: must match pattern ${o.pattern}`;return`Invalid ${n[o.format]??s.format}`}case"not_multiple_of":return`Invalid number: must be a multiple of ${s.divisor}`;case"unrecognized_keys":return`Unrecognized key${s.keys.length>1?"s":""}: ${Cc(s.keys,", ")}`;case"invalid_key":return`Invalid key in ${s.origin}`;case"invalid_union":if(s.options&&Array.isArray(s.options)&&s.options.length>0)return`Invalid discriminator value. Expected ${s.options.map((a)=>`'${a}'`).join(" | ")}`;if(s.inclusive===!1)return"Invalid input: more than one option matched";return"Invalid input";case"invalid_element":return`Invalid value in ${s.origin}`;default:return"Invalid input"}}};function el(){return{localeError:sy()}}var Wp;class $p{constructor(){this._map=new WeakMap,this._idmap=new Map}add(e,...t){let n=t[0];if(this._map.set(e,n),n&&typeof n==="object"&&"id"in n)this._idmap.set(n.id,e);return this}clear(){return this._map=new WeakMap,this._idmap=new Map,this}remove(e){let t=this._map.get(e);if(t&&typeof t==="object"&&"id"in t)this._idmap.delete(t.id);return this._map.delete(e),this}get(e){let t=e._zod.parent;if(t){let n={...this.get(t)??{}};delete n.id;let i={...n,...this._map.get(e)};return Object.keys(i).length?i:void 0}return this._map.get(e)}has(e){return this._map.has(e)}}function oy(){return new $p}(Wp=globalThis).__zod_globalRegistry??(Wp.__zod_globalRegistry=oy());var ar=globalThis.__zod_globalRegistry;function Zp(e){if(e.checks)e.checks=[...e.checks];return e}function Xp(e,t){return new e(Zp({type:"string",...Re(t)}))}function qp(e,t){return new e({type:"string",format:"email",check:"string_format",abort:!1,...Re(t)})}function Yp(e,t){return new e({type:"string",format:"guid",check:"string_format",abort:!1,...Re(t)})}function jp(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,...Re(t)})}function Kp(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v4",...Re(t)})}function Jp(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v6",...Re(t)})}function Qp(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v7",...Re(t)})}function em(e,t){return new e({type:"string",format:"url",check:"string_format",abort:!1,...Re(t)})}function tm(e,t){return new e({type:"string",format:"emoji",check:"string_format",abort:!1,...Re(t)})}function nm(e,t){return new e({type:"string",format:"nanoid",check:"string_format",abort:!1,...Re(t)})}function im(e,t){return new e({type:"string",format:"cuid",check:"string_format",abort:!1,...Re(t)})}function rm(e,t){return new e({type:"string",format:"cuid2",check:"string_format",abort:!1,...Re(t)})}function sm(e,t){return new e({type:"string",format:"ulid",check:"string_format",abort:!1,...Re(t)})}function om(e,t){return new e({type:"string",format:"xid",check:"string_format",abort:!1,...Re(t)})}function am(e,t){return new e({type:"string",format:"ksuid",check:"string_format",abort:!1,...Re(t)})}function cm(e,t){return new e({type:"string",format:"ipv4",check:"string_format",abort:!1,...Re(t)})}function lm(e,t){return new e({type:"string",format:"ipv6",check:"string_format",abort:!1,...Re(t)})}function um(e,t){return new e({type:"string",format:"cidrv4",check:"string_format",abort:!1,...Re(t)})}function hm(e,t){return new e({type:"string",format:"cidrv6",check:"string_format",abort:!1,...Re(t)})}function fm(e,t){return new e({type:"string",format:"base64",check:"string_format",abort:!1,...Re(t)})}function dm(e,t){return new e({type:"string",format:"base64url",check:"string_format",abort:!1,...Re(t)})}function pm(e,t){return new e({type:"string",format:"e164",check:"string_format",abort:!1,...Re(t)})}function mm(e,t){return new e({type:"string",format:"jwt",check:"string_format",abort:!1,...Re(t)})}function gm(e,t){return new e({type:"string",format:"datetime",check:"string_format",offset:!1,local:!1,precision:null,...Re(t)})}function _m(e,t){return new e({type:"string",format:"date",check:"string_format",...Re(t)})}function xm(e,t){return new e({type:"string",format:"time",check:"string_format",precision:null,...Re(t)})}function vm(e,t){return new e({type:"string",format:"duration",check:"string_format",...Re(t)})}function ym(e,t){return new e(Zp({type:"number",checks:[],...Re(t)}))}function Sm(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"safeint",...Re(t)})}function bm(e,t){return new e({type:"boolean",...Re(t)})}function Mm(e){return new e({type:"unknown"})}function wm(e,t){return new e({type:"never",...Re(t)})}function ta(e,t){return new Wc({check:"less_than",...Re(t),value:e,inclusive:!1})}function Is(e,t){return new Wc({check:"less_than",...Re(t),value:e,inclusive:!0})}function na(e,t){return new $c({check:"greater_than",...Re(t),value:e,inclusive:!1})}function Ls(e,t){return new $c({check:"greater_than",...Re(t),value:e,inclusive:!0})}function ia(e,t){return new xd({check:"multiple_of",...Re(t),value:e})}function ra(e,t){return new yd({check:"max_length",...Re(t),maximum:e})}function Lr(e,t){return new Sd({check:"min_length",...Re(t),minimum:e})}function sa(e,t){return new bd({check:"length_equals",...Re(t),length:e})}function tl(e,t){return new Md({check:"string_format",format:"regex",...Re(t),pattern:e})}function nl(e){return new wd({check:"string_format",format:"lowercase",...Re(e)})}function il(e){return new Td({check:"string_format",format:"uppercase",...Re(e)})}function rl(e,t){return new Ed({check:"string_format",format:"includes",...Re(t),includes:e})}function sl(e,t){return new Ad({check:"string_format",format:"starts_with",...Re(t),prefix:e})}function ol(e,t){return new Rd({check:"string_format",format:"ends_with",...Re(t),suffix:e})}function Ni(e){return new Cd({check:"overwrite",tx:e})}function al(e){return Ni((t)=>t.normalize(e))}function cl(){return Ni((e)=>e.trim())}function ll(){return Ni((e)=>e.toLowerCase())}function ul(){return Ni((e)=>e.toUpperCase())}function hl(){return Ni((e)=>xf(e))}function Tm(e,t,n){return new e({type:"array",element:t,...Re(n)})}function Em(e,t,n){return new e({type:"custom",check:"custom",fn:t,...Re(n)})}function Am(e,t){let n=ay((i)=>(i.addIssue=(r)=>{if(typeof r==="string")i.issues.push(or(r,i.value,n._zod.def));else{let s=r;if(s.fatal)s.continue=!1;if(s.code??(s.code="custom"),!("input"in s))s.input=i.value;s.inst??(s.inst=n),s.continue??(s.continue=!n._zod.def.abort),i.issues.push(or(s))}},e(i.value,i)),t);return n}function ay(e,t){let n=new Vt({check:"custom",...Re(t)});return n._zod.check=e,n}function Ns(e,...t){for(let n of t)for(let i of Reflect.ownKeys(n))if(Object.prototype.propertyIsEnumerable.call(n,i))Pn(e,i,n[i]);return e}function dl(e){let t=e?.target??"draft-2020-12";if(t==="draft-4")t="draft-04";if(t==="draft-7")t="draft-07";return{processors:e.processors??{},metadataRegistry:e?.metadata??ar,target:t,unrepresentable:e?.unrepresentable??"throw",override:e?.override??(()=>{}),io:e?.io??"output",counter:0,seen:new Map,sharedDefsExtractedFor:void 0,sharedEmitDoneFor:void 0,cycles:e?.cycles??"ref",reused:e?.reused??"inline",intersections:[],deferred:[],external:e?.external??void 0}}function di(e,t,n,i,r){let s=typeof t.unrepresentable==="function"?t.unrepresentable({zodSchema:e,path:i.path,message:r}):t.unrepresentable;if(s==="any")return!1;if(s===void 0||s==="throw")throw Error(r);return Object.assign(n,s),!0}function At(e,t,n={path:[],schemaPath:[]}){var i;let r=e._zod.def,s=t.seen.get(e);if(s){if(s.count++,n.schemaPath.includes(e))s.cycle=n.path;return s.schema}let o={schema:{},count:1,cycle:void 0,path:n.path};t.seen.set(e,o),t.sharedDefsExtractedFor=void 0,t.sharedEmitDoneFor=void 0;let a=e._zod.toJSONSchema?.();if(a)o.schema=a;else{let u={...n,schemaPath:[...n.schemaPath,e],path:n.path};if(e._zod.processJSONSchema)e._zod.processJSONSchema(t,o.schema,u);else{let h=o.schema,d=t.processors[r.type];if(!d)throw Error(`[toJSONSchema]: Non-representable type encountered: ${r.type}`);d(e,t,h,u)}let f=e._zod.parent;if(f){if(!o.ref)o.ref=f;At(f,t,u),t.seen.get(f).isParent=!0}}let c=t.metadataRegistry.get(e);if(c)Ns(o.schema,c);if(t.io==="input"&&Qt(e))delete o.schema.examples,delete o.schema.default;if(t.io==="input"&&"_prefault"in o.schema)(i=o.schema).default??(i.default=o.schema._prefault);return delete o.schema._prefault,t.seen.get(e).schema}function Rm(e){return e.replace(/~/g,"~0").replace(/\//g,"~1")}function pl(e,t){let n=e.seen.get(t);if(!n)throw Error("Unprocessed schema. This is a bug in Zod.");if(e.external&&e.sharedDefsExtractedFor===e.external)return;let i=new Map;for(let o of e.seen.entries()){let a=e.metadataRegistry.get(o[0])?.id;if(a){let c=i.get(a);if(c&&c!==o[0])throw Error(`Duplicate schema id "${a}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);i.set(a,o[0])}}let r=(o)=>{let a=e.target==="draft-2020-12"?"$defs":"definitions";if(e.external){let f=e.external.registry.get(o[0])?.id,h=e.external.uri??((g)=>g);if(f)return{ref:h(f)};let d=o[1].defId??o[1].schema.id??`schema${e.counter++}`;return o[1].defId=d,{defId:d,ref:`${h("__shared")}#/${a}/${Rm(d)}`}}let c="#",l=`${c}/${a}/`;if(o[1]===n&&!o[1].schema.id)return{ref:c};let u=o[1].schema.id??`__schema${e.counter++}`;return{defId:u,ref:l+Rm(u)}},s=(o)=>{if(o[1].schema.$ref)return;let a=o[1],{ref:c,defId:l}=r(o);if(a.def={...a.schema},l)a.defId=l;let u=a.schema;for(let f in u)delete u[f];u.$ref=c};if(e.cycles==="throw")for(let o of e.seen.entries()){let a=o[1];if(a.cycle)throw Error(`Cycle detected: #/${a.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`)}for(let o of e.seen.entries()){let a=o[1];if(t===o[0]){s(o);continue}if(e.external){let l=e.external.registry.get(o[0])?.id;if(t!==o[0]&&l){s(o);continue}}if(e.metadataRegistry.get(o[0])?.id){s(o);continue}if(a.cycle){s(o);continue}if(a.count>1){if(e.reused==="ref")s(o)}}if(e.external)e.sharedDefsExtractedFor=e.external}function Im(e){let t=e.anyOf;if(!Array.isArray(t)||t.length===0||e.type!==void 0)return;let n=[];for(let i of t){if(!i||typeof i!=="object")return;Im(i);let r=Object.keys(i);if(r.length!==1||r[0]!=="type")return;let s=i.type;for(let o of Array.isArray(s)?s:[s]){if(typeof o!=="string")return;if(!n.includes(o))n.push(o)}}delete e.anyOf,e.type=n.length===1?n[0]:n}var Lm=new Set(["type","properties","required","additionalProperties"]),Cm=["oneOf","anyOf"];function Pm(e){let t=e.additionalProperties;if(t===void 0||t===!1||typeof t!=="object"||t===null)return null;return Object.keys(t).length?t:null}function fl(e){let t=[];for(let s of e){if(typeof s!=="object"||s.type!=="object")return null;for(let o in s)if(!Lm.has(o))return null;t.push(s)}let n={},i=new Set;for(let s of t){for(let o in s.properties){if(Object.prototype.hasOwnProperty.call(n,o))continue;let a=[];for(let l of t){let u=l.properties?.[o]??Pm(l);if(u===null||u===void 0)continue;if(!a.some((f)=>JSON.stringify(f)===JSON.stringify(u)))a.push(u)}let c=a.length===1?a[0]:fl(a)??{allOf:a};Pn(n,o,c)}for(let o of s.required??[])i.add(o)}let r={type:"object",properties:n};if(i.size)r.required=[...i];if(t.every((s)=>s.additionalProperties===!1))r.additionalProperties=!1;else{let s=[];for(let o of t){let a=Pm(o);if(a&&!s.some((c)=>JSON.stringify(c)===JSON.stringify(a)))s.push(a)}if(s.length===1)r.additionalProperties=s[0];else if(s.length>1)r.additionalProperties={allOf:s}}return r}function cy(e){let t=e.allOf;if(!Array.isArray(t)||t.length<2)return;for(let r of Lm)if(r in e)return;let n=t.filter((r)=>Cm.some((s)=>Array.isArray(r[s]))),i=null;if(!n.length)i=fl(t);else{let r=n[0],s=Cm.find((c)=>Array.isArray(r[c]));if(Object.keys(r).length!==1)return;let o=t.filter((c)=>c!==r),a=r[s].map((c)=>fl([...o,c]));if(a.some((c)=>!c))return;i={[s]:a}}if(!i)return;delete e.allOf,Ns(e,i)}function ml(e,t){let n=e.seen.get(t);if(!n)throw Error("Unprocessed schema. This is a bug in Zod.");let i=(a)=>{let c=e.seen.get(a);if(c.ref===null)return;let l=c.def??c.schema,u={...l},f=c.ref;if(c.ref=null,f){i(f);let d=e.seen.get(f),g=d.schema;if(g.$ref&&(e.target==="draft-07"||e.target==="draft-04"||e.target==="openapi-3.0"))l.allOf=l.allOf??[],l.allOf.push(g);else Ns(l,g);if(Ns(l,u),a._zod.parent===f)for(let p in l){if(p==="$ref"||p==="allOf")continue;if(!(p in u))delete l[p]}if(g.$ref&&d.def)for(let p in l){if(p==="$ref"||p==="allOf")continue;if(p in d.def&&JSON.stringify(l[p])===JSON.stringify(d.def[p]))delete l[p]}}let h=a._zod.parent;if(h&&h!==f){i(h);let d=e.seen.get(h);if(d?.schema.$ref){if(l.$ref=d.schema.$ref,d.def)for(let g in l){if(g==="$ref"||g==="allOf")continue;if(g in d.def&&JSON.stringify(l[g])===JSON.stringify(d.def[g]))delete l[g]}}}e.override({zodSchema:a,jsonSchema:l,path:c.path??[]})};if(!e.external||e.sharedEmitDoneFor!==e.external){for(let a of[...e.seen.entries()].reverse())i(a[0]);if(e.target!=="openapi-3.0")for(let a of e.seen.entries())Im(a[1].def??a[1].schema);for(let a of e.deferred)a();if(e.intersections.length){let a=new Map;for(let c of e.seen.values())for(let l of[c.schema,c.def]){let u=l?.allOf;if(!Array.isArray(u))continue;let f=a.get(u);if(f)f.push(l);else a.set(u,[l])}for(let c of e.intersections)for(let l of a.get(c)??[])cy(l)}}let r={};if(e.target==="draft-2020-12")r.$schema="https://json-schema.org/draft/2020-12/schema";else if(e.target==="draft-07")r.$schema="http://json-schema.org/draft-07/schema#";else if(e.target==="draft-04")r.$schema="http://json-schema.org/draft-04/schema#";else if(e.target==="openapi-3.0");if(e.external?.uri){let a=e.external.registry.get(t)?.id;if(!a)throw Error("Schema is missing an `id` property");r.$id=e.external.uri(a)}Ns(r,n.defId?n.schema:n.def??n.schema);let s=e.metadataRegistry.get(t)?.id;if(s!==void 0&&r.id===s)delete r.id;let o=e.external?.defs??{};if(!e.external||e.sharedEmitDoneFor!==e.external)for(let a of e.seen.entries()){let c=a[1];if(c.def&&c.defId){if(c.def.id===c.defId)delete c.def.id;Pn(o,c.defId,c.def)}}if(e.external)e.sharedEmitDoneFor=e.external;if(e.external);else if(Object.keys(o).length>0)if(e.target==="draft-2020-12")r.$defs=o;else r.definitions=o;try{let a=JSON.parse(JSON.stringify(r));return Object.defineProperty(a,"~standard",{value:{...t["~standard"],jsonSchema:{input:Ds(t,"input",e.processors),output:Ds(t,"output",e.processors)}},enumerable:!1,writable:!1}),a}catch(a){throw Error("Error converting schema to JSON.")}}function Qt(e,t){let n=t??{seen:new Set};if(n.seen.has(e))return!1;n.seen.add(e);let i=e._zod.def;if(i.type==="transform")return!0;if(i.type==="array")return Qt(i.element,n);if(i.type==="set")return Qt(i.valueType,n);if(i.type==="lazy")return Qt(i.getter(),n);if(i.type==="promise"||i.type==="optional"||i.type==="nonoptional"||i.type==="nullable"||i.type==="readonly"||i.type==="default"||i.type==="prefault"||i.type==="catch")return Qt(i.innerType,n);if(i.type==="intersection")return Qt(i.left,n)||Qt(i.right,n);if(i.type==="record"||i.type==="map")return Qt(i.keyType,n)||Qt(i.valueType,n);if(i.type==="pipe"){if(e._zod.traits.has("$ZodCodec"))return!0;return Qt(i.in,n)||Qt(i.out,n)}if(i.type==="object"){for(let r in i.shape)if(Qt(i.shape[r],n))return!0;return!1}if(i.type==="union"){for(let r of i.options)if(Qt(r,n))return!0;return!1}if(i.type==="tuple"){for(let r of i.items)if(Qt(r,n))return!0;if(i.rest&&Qt(i.rest,n))return!0;return!1}return!1}var Nm=(e,t={})=>(n)=>{let i=dl({...n,processors:t});return At(e,i),pl(i,e),ml(i,e)},Ds=(e,t,n={})=>(i)=>{let{libraryOptions:r,target:s}=i??{},o=dl({...r??{},target:s,io:t,processors:n});return At(e,o),pl(o,e),ml(o,e)};var Nr=(e,t,n)=>{if(e[t]===void 0||n>e[t])e[t]=n},Dr=(e,t,n)=>{if(e[t]===void 0||n<e[t])e[t]=n},Dm=(e,t)=>{Nr(e,"minimum",t),Dr(e,"maximum",t)},zm=(e,t)=>{if(e.multipleOf??(e.multipleOf=[]),!e.multipleOf.includes(t))e.multipleOf.push(t)},km=(e,t)=>{e.patterns??(e.patterns=new Set),e.patterns.add(t)},Bm=(e,t)=>{e.mime=e.mime?e.mime.filter((n)=>t.includes(n)):[...t]},Gm=(e,t)=>{if(e.format=t,t.includes("int"))e.isInt=!0},Om=(e,t)=>Nr(e,"minimum",t.minimum),Um=(e,t)=>Dr(e,"maximum",t.maximum),Fm=(e)=>(t,n)=>{Gm(t,n.format);let[i,r]=e[n.format];Nr(t,"minimum",i),Dr(t,"maximum",r)},ly={greater_than:(e,t)=>Nr(e,t.inclusive?"minimum":"exclusiveMinimum",t.value),less_than:(e,t)=>Dr(e,t.inclusive?"maximum":"exclusiveMaximum",t.value),multiple_of:(e,t)=>zm(e,t.value),number_format:Fm(Oo),bigint_format:Fm(Nc),min_length:Om,max_length:Um,length_equals:(e,t)=>Dm(e,t.length),min_size:Om,max_size:Um,size_equals:(e,t)=>Dm(e,t.size),string_format:(e,t)=>{if(Gm(e,t.format),t.pattern)km(e,t.pattern);if(t.format==="base64"||t.format==="base64url")e.contentEncoding=t.format;if(t.local||t.precision===-1)e.laxFormat=!0},mime_type:(e,t)=>Bm(e,t.mime)};function Mn(e){let t={},n=e._zod.def,i=e._zod.traits.has("$ZodCheck")?[e,...n.checks??[]]:n.checks??[];for(let s of i)ly[s._zod.def.check]?.(t,s._zod.def);let r=e._zod.bag;if(r.minimum!==void 0)Nr(t,"minimum",r.minimum);if(r.exclusiveMinimum!==void 0)Nr(t,"exclusiveMinimum",r.exclusiveMinimum);if(r.maximum!==void 0)Dr(t,"maximum",r.maximum);if(r.exclusiveMaximum!==void 0)Dr(t,"exclusiveMaximum",r.exclusiveMaximum);if(r.multipleOf!==void 0)zm(t,r.multipleOf);if(r.format!==void 0){if(t.format??(t.format=r.format),r.format.includes("int"))t.isInt=!0}if(r.mime)Bm(t,r.mime);for(let s of r.patterns??[])km(t,s);return t}var uy={guid:"uuid",url:"uri",datetime:"date-time",json_string:"json-string",regex:""},hy=new Map([[Yc,od],[jo,ad]]),Hm=(e)=>hy.get(e)??e,Vm=(e,t,n,i)=>{let r=n;r.type="string";let{minimum:s,maximum:o,format:a,patterns:c,contentEncoding:l,laxFormat:u}=Mn(e);if(typeof s==="number")r.minLength=s;if(typeof o==="number")r.maxLength=o;if(a){if(r.format=uy[a]??a,r.format==="")delete r.format;if(a==="time"||u)delete r.format}if(l)r.contentEncoding=l;if(c&&c.size>0){let f=[...c].map(Hm);if(f.length===1)r.pattern=f[0].source;else if(f.length>1)r.allOf=[...f.map((h)=>({...t.target==="draft-07"||t.target==="draft-04"||t.target==="openapi-3.0"?{type:"string"}:{},pattern:h.source}))]}},Wm=(e,t,n,i)=>{let r=n,{minimum:s,maximum:o,multipleOf:a,exclusiveMaximum:c,exclusiveMinimum:l,isInt:u}=Mn(e);r.type=u?"integer":"number";let f=typeof l==="number"&&l>=(s??Number.NEGATIVE_INFINITY),h=typeof c==="number"&&c<=(o??Number.POSITIVE_INFINITY),d=t.target==="draft-04"||t.target==="openapi-3.0";if(f)if(d)r.minimum=l,r.exclusiveMinimum=!0;else r.exclusiveMinimum=l;else if(typeof s==="number")r.minimum=s;if(h)if(d)r.maximum=c,r.exclusiveMaximum=!0;else r.exclusiveMaximum=c;else if(typeof o==="number")r.maximum=o;if(a){let g=new Set;for(let m of a)if(Number.isFinite(m)&&m!==0)g.add(Math.abs(m));else di(e,t,r,i,`A multipleOf divisor of ${m} cannot be represented in JSON Schema`);let[x,...p]=g;if(x!==void 0)r.multipleOf=x;if(p.length)r.allOf=[...r.allOf??[],...p.map((m)=>({multipleOf:m}))]}},$m=(e,t,n,i)=>{n.type="boolean"};var Zm=(e,t,n,i)=>{n.not={}};var Xm=(e,t,n,i)=>{};var qm=(e,t,n,i)=>{let r=e._zod.def,s=Ms(r.entries);if(s.length===0){n.not={};return}if(s.every((o)=>typeof o==="number"))n.type="number";if(s.every((o)=>typeof o==="string"))n.type="string";n.enum=s},Ym=(e,t,n,i)=>{let r=e._zod.def;if(r.values.length===0){n.not={};return}let s=[];for(let o of r.values)if(o===void 0){if(di(e,t,n,i,"Literal `undefined` cannot be represented in JSON Schema"))return}else if(typeof o==="bigint"){if(di(e,t,n,i,"BigInt literals cannot be represented in JSON Schema"))return;s.push(Number(o))}else s.push(o);if(s.length===0);else if(s.length===1){let o=s[0];if(n.type=o===null?"null":typeof o,t.target==="draft-04"||t.target==="openapi-3.0")n.enum=[o];else n.const=o}else{if(s.every((o)=>typeof o==="number"))n.type="number";if(s.every((o)=>typeof o==="string"))n.type="string";if(s.every((o)=>typeof o==="boolean"))n.type="boolean";if(s.every((o)=>o===null))n.type="null";n.enum=s}};var jm=(e,t,n,i)=>{di(e,t,n,i,"Custom types cannot be represented in JSON Schema")};var Km=(e,t,n,i)=>{di(e,t,n,i,"Transforms cannot be represented in JSON Schema")};var Jm=(e,t,n,i)=>{let r=n,s=e._zod.def,{minimum:o,maximum:a}=Mn(e);if(typeof o==="number")r.minItems=o;if(typeof a==="number")r.maxItems=a;r.type="array",r.items=At(s.element,t,{...i,path:[...i.path,"items"]})};function oa(e){let t=e._zod.def;if(t.type==="pipe"&&t.in._zod.traits.has("$ZodTransform"))return oa(t.out);if(t.type==="catch")return oa(t.innerType);return e._zod.optin}var Qm=(e,t,n,i)=>{let r=n,s=e._zod.def,o=s.shape;if(Object.getOwnPropertySymbols(o).length&&di(e,t,r,i,"Symbol keys cannot be represented in JSON Schema"))return;r.type="object",r.properties={};for(let l in o)Pn(r.properties,l,At(o[l],t,{...i,path:[...i.path,"properties",l]}));let c=[];for(let l of Object.keys(o)){let u=s.shape[l];if(t.io==="input"?oa(u)===void 0:u._zod.optout===void 0)c.push(l)}if(c.length>0)r.required=c;if(s.catchall?._zod.def.type==="never")r.additionalProperties=!1;else if(!s.catchall){if(t.io==="output")r.additionalProperties=!1}else if(s.catchall)r.additionalProperties=At(s.catchall,t,{...i,path:[...i.path,"additionalProperties"]})},eg=(e,t,n,i)=>{let r=e._zod.def,s=r.inclusive===!1,o=r.options.map((a,c)=>At(a,t,{...i,path:[...i.path,s?"oneOf":"anyOf",c]}));if(s)n.oneOf=o;else n.anyOf=o},tg=(e,t,n,i)=>{let r=e._zod.def,s=At(r.left,t,{...i,path:[...i.path,"allOf",0]}),o=At(r.right,t,{...i,path:[...i.path,"allOf",1]}),a=(l)=>("allOf"in l)&&Object.keys(l).length===1,c=[...a(s)?s.allOf:[s],...a(o)?o.allOf:[o]];n.allOf=c,t.intersections.push(c)};function gl(e,t,n){if(t.$ref){if(n.has(t))return t;n.add(t);let g=e.get(t)?.def;if(!g)return t;let x=gl(e,g,n);return x===g?t:x}for(let g of["anyOf","oneOf"]){let x=t[g];if(!Array.isArray(x))continue;let p=x.map((m)=>gl(e,m,n));if(p.some((m,E)=>m!==x[E]))t={...t,[g]:p}}let i=Array.isArray(t.type)?t.type:[t.type],r=!i.includes("string")&&i.some((g)=>g==="number"||g==="integer"),s=t.enum??(t.const!==void 0?[t.const]:void 0);if(!r&&!s?.some((g)=>typeof g==="number"))return t;let{minimum:o,maximum:a,exclusiveMinimum:c,exclusiveMaximum:l,multipleOf:u,format:f,id:h,...d}=t;if(d.enum)d.enum=d.enum.map((g)=>typeof g==="number"?String(g):g);else if(typeof d.const==="number")d.const=String(d.const);if(!r)return d;if(d.type="string",!s)d.pattern=(i.includes("number")?Es:Hc).source;return d}var _l=new WeakMap;function fy(e){let t=new Map;for(let i of e.seen.values())if(i.def&&!t.has(i.schema))t.set(i.schema,i);let n=new Map;for(let i of _l.get(e)??[]){let r=e.seen.get(i),s=(r?.def??r?.schema)?.propertyNames;if(!s||s===!0||n.has(s))continue;let o=gl(t,s,new Set);if(o!==s)n.set(s,o)}if(!n.size)return;for(let i of e.seen.values())for(let r of[i.schema,i.def]){let s=r&&n.get(r.propertyNames);if(s)r.propertyNames=s}}var ng=(e,t,n,i)=>{let r=n,s=e._zod.def;r.type="object";let o=s.keyType,a=Mn(o).patterns;if(s.mode==="loose"&&a&&a.size>0){let u=At(s.valueType,t,{...i,path:[...i.path,"patternProperties","*"]});r.patternProperties={};for(let f of a)Pn(r.patternProperties,Hm(f).source,u)}else{if(t.target==="draft-07"||t.target==="draft-2020-12"){r.propertyNames=At(s.keyType,t,{...i,path:[...i.path,"propertyNames"]});let u=_l.get(t);if(!u)u=[],_l.set(t,u),t.deferred.push(()=>fy(t));u.push(e)}r.additionalProperties=At(s.valueType,t,{...i,path:[...i.path,"additionalProperties"]})}let c=o._zod.values,l=t.io==="input"&&oa(s.valueType)!==void 0;if(c&&!s.partial&&!l){let u=[...c].filter((f)=>typeof f==="string"||typeof f==="number");if(u.length>0)r.required=u.map(String)}},ig=(e,t,n,i)=>{let r=e._zod.def,s=At(r.innerType,t,i),o=t.seen.get(e);if(t.target==="openapi-3.0")o.ref=r.innerType,n.nullable=!0;else n.anyOf=[s,{type:"null"}]},rg=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType},xl=Symbol();function sg(e,t,n,i,r){let s=!1,o=JSON.stringify(e,(a,c)=>{if(typeof c!=="bigint")return c;return s=!0,null});if(!s)return JSON.parse(o);return di(t,n,i,r,"BigInt defaults cannot be represented in JSON Schema"),xl}var og=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType;let o=sg(r.defaultValue,e,t,n,i);if(o!==xl)n.default=o},ag=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);if(s.ref=r.innerType,t.io!=="input")return;let o=sg(r.defaultValue,e,t,n,i);if(o!==xl)n._prefault=o},cg=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType;let o;try{o=r.catchValue(void 0)}catch{di(e,t,n,i,"Dynamic catch values are not supported in JSON Schema");return}n.default=o},lg=(e,t,n,i)=>{let r=e._zod.def,s=r.in._zod.traits.has("$ZodTransform"),o=t.io==="input"?s?r.out:r.in:r.out;At(o,t,i);let a=t.seen.get(e);a.ref=o},ug=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType,n.readOnly=!0};var vl=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType};var hg=new WeakSet([Object.prototype,Error.prototype]);function aa(e,t,n){Object.defineProperty(e,t,{configurable:!0,enumerable:!1,get(){let i=n(this);return Object.defineProperty(this,t,{value:i,configurable:!0,writable:!0}),i},set(i){Object.defineProperty(this,t,{value:i,configurable:!0,writable:!0})}})}var yy=(e,t)=>{Nf.init(e,t),e.name="ZodError";let n=Object.getPrototypeOf(e);if(hg.has(n))return;hg.add(n),aa(n,"format",(i)=>(r)=>Of(i,r)),aa(n,"flatten",(i)=>(r)=>Df(i,r)),aa(n,"addIssue",(i)=>(r)=>{i.issues.push(r),i.message=JSON.stringify(i.issues,ws,2)}),aa(n,"addIssues",(i)=>(r)=>{i.issues.push(...r),i.message=JSON.stringify(i.issues,ws,2)}),Object.defineProperty(n,"isEmpty",{configurable:!0,enumerable:!1,get(){return this.issues.length===0}})};var fn=j("ZodError",yy,void 0,{Parent:Error});var fg=Go(fn),dg=Ho(fn),pg=Vo(fn),mg=Wo(fn),gg=Ff(fn),_g=zf(fn),xg=kf(fn),vg=Bf(fn),yg=Gf(fn),Sg=Hf(fn),bg=Vf(fn),Mg=Wf(fn);function by(){if(!on.localeError)hn(el())}function la(){if(!on.memoizer)hn({memoizer:Vp()})}var bt=j("ZodType",(e,t)=>(by(),yt.init(e,t),e.def=t,e.type=t.type,e),{check(...e){let t=this.def;return this.clone(un(t,{checks:[...t.checks??[],...e.map((n)=>typeof n==="function"?{_zod:{check:n,def:{check:"custom"},onattach:[]}}:n)]}),{parent:!0})},with(...e){return this.check(...e)},clone(e,t){return $n(this,e,t)},brand(){return this},register(e,t){return e.add(this,t),this},refine(e,t){return this.check(bS(e,t))},superRefine(e,t){return this.check(MS(e,t))},overwrite(e){return this.check(Ni(e))},optional(){return Eg(this)},exactOptional(){return lS(this)},nullable(){return Ag(this)},nullish(){return Eg(Ag(this))},nonoptional(e){return mS(this,e)},array(){return ua(this)},or(e){return nS([this,e])},and(e){return rS(this,e)},transform(e){return Rg(this,cS(e))},default(e){return fS(this,e)},prefault(e){return pS(this,e)},catch(e){return _S(this,e)},pipe(e){return Rg(this,e)},readonly(){return yS(this)},describe(e){let t=this.clone();return ar.add(t,{description:e}),t},meta(...e){if(e.length===0)return ar.get(this);let t=this.clone();return ar.add(t,e[0]),t},isOptional(){return this.safeParse(void 0).success},isNullable(){return this.safeParse(null).success},apply(e,...t){return t.length===0?e(this):e(this,...t)},get "~standard"(){return ko(this,"~standard",{...qc(this),jsonSchema:{input:Ds(this,"input"),output:Ds(this,"output")}})},set "~standard"(e){fi(this,"~standard",e)},parse:function e(t,n){return fg(this,t,n,{callee:e})},parseAsync:async function e(t,n){return await dg(this,t,n,{callee:e})},safeParse(e,t){return pg(this,e,t)},async safeParseAsync(e,t){return mg(this,e,t)},get spa(){return this?.safeParseAsync},set spa(e){fi(this,"spa",e)},validate(e,t){return zc(this,e,t)},validateAsync(e,t){return kc(this,e,t)},encode:function e(t,n){return gg(this,t,n,{callee:e})},decode:function e(t,n){return _g(this,t,n,{callee:e})},encodeAsync:async function e(t,n){return await xg(this,t,n,{callee:e})},decodeAsync:async function e(t,n){return await vg(this,t,n,{callee:e})},safeEncode(e,t){return yg(this,e,t)},safeDecode(e,t){return Sg(this,e,t)},async safeEncodeAsync(e,t){return bg(this,e,t)},async safeDecodeAsync(e,t){return Mg(this,e,t)},toJSONSchema(e){return Nm(this,{})(e)},get description(){return ar.get(this)?.description},get _def(){return this._zod.def}}),Cg=j("_ZodString",(e,t)=>{Yo.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Vm(e,n,i,r)},Af({format:(e)=>Mn(e).format??null,minLength:(e)=>Mn(e).minimum??null,maxLength:(e)=>Mn(e).maximum??null},{regex(...e){return this.check(tl(...e))},includes(...e){return this.check(rl(...e))},startsWith(...e){return this.check(sl(...e))},endsWith(...e){return this.check(ol(...e))},min(...e){return this.check(Lr(...e))},max(...e){return this.check(ra(...e))},length(...e){return this.check(sa(...e))},nonempty(...e){return this.check(Lr(1,...e))},lowercase(e){return this.check(nl(e))},uppercase(e){return this.check(il(e))},trim(){return this.check(cl())},normalize(...e){return this.check(al(...e))},toLowerCase(){return this.check(ll())},toUpperCase(){return this.check(ul())},slugify(){return this.check(hl())}})),My=j("ZodString",(e,t)=>{Yo.init(e,t),Cg.init(e,t)},{email(e){return this.check(qp(Ry,e))},url(e){return this.check(em(Py,e))},jwt(e){return this.check(mm($y,e))},emoji(e){return this.check(tm(Iy,e))},guid(e){return this.check(Yp(Cy,e))},uuid(e){return this.check(jp(ca,e))},uuidv4(e){return this.check(Kp(ca,e))},uuidv6(e){return this.check(Jp(ca,e))},uuidv7(e){return this.check(Qp(ca,e))},nanoid(e){return this.check(nm(Ly,e))},cuid(e){return this.check(im(Ny,e))},cuid2(e){return this.check(rm(Dy,e))},ulid(e){return this.check(sm(Oy,e))},base64(e){return this.check(fm(Hy,e))},base64url(e){return this.check(dm(Vy,e))},xid(e){return this.check(om(Uy,e))},ksuid(e){return this.check(am(Fy,e))},ipv4(e){return this.check(cm(zy,e))},ipv6(e){return this.check(lm(ky,e))},cidrv4(e){return this.check(um(By,e))},cidrv6(e){return this.check(hm(Gy,e))},e164(e){return this.check(pm(Wy,e))},datetime(e){return this.check(gm(wy,e))},date(e){return this.check(_m(Ty,e))},time(e){return this.check(xm(Ey,e))},duration(e){return this.check(vm(Ay,e))}});function Zt(e){return Xp(My,e)}var Mt=j("ZodStringFormat",(e,t)=>{vt.init(e,t),Cg.init(e,t)}),wy=j("ZodISODateTime",(e,t)=>{np.init(e,t),Mt.init(e,t)}),Ty=j("ZodISODate",(e,t)=>{ip.init(e,t),Mt.init(e,t)}),Ey=j("ZodISOTime",(e,t)=>{rp.init(e,t),Mt.init(e,t)}),Ay=j("ZodISODuration",(e,t)=>{sp.init(e,t),Mt.init(e,t)}),Ry=j("ZodEmail",(e,t)=>{$d.init(e,t),Mt.init(e,t)});var Cy=j("ZodGUID",(e,t)=>{Vd.init(e,t),Mt.init(e,t)});var ca=j("ZodUUID",(e,t)=>{Wd.init(e,t),Mt.init(e,t)});var Py=j("ZodURL",(e,t)=>{qd.init(e,t),Mt.init(e,t)});var Iy=j("ZodEmoji",(e,t)=>{Yd.init(e,t),Mt.init(e,t)});var Ly=j("ZodNanoID",(e,t)=>{jd.init(e,t),Mt.init(e,t)});var Ny=j("ZodCUID",(e,t)=>{Kd.init(e,t),Mt.init(e,t)});var Dy=j("ZodCUID2",(e,t)=>{Jd.init(e,t),Mt.init(e,t)});var Oy=j("ZodULID",(e,t)=>{Qd.init(e,t),Mt.init(e,t)});var Uy=j("ZodXID",(e,t)=>{ep.init(e,t),Mt.init(e,t)});var Fy=j("ZodKSUID",(e,t)=>{tp.init(e,t),Mt.init(e,t)});var zy=j("ZodIPv4",(e,t)=>{op.init(e,t),Mt.init(e,t)});var ky=j("ZodIPv6",(e,t)=>{cp.init(e,t),Mt.init(e,t)});var By=j("ZodCIDRv4",(e,t)=>{lp.init(e,t),Mt.init(e,t)});var Gy=j("ZodCIDRv6",(e,t)=>{up.init(e,t),Mt.init(e,t)});var Hy=j("ZodBase64",(e,t)=>{fp.init(e,t),Mt.init(e,t)});var Vy=j("ZodBase64URL",(e,t)=>{dp.init(e,t),Mt.init(e,t)});var Wy=j("ZodE164",(e,t)=>{pp.init(e,t),Mt.init(e,t)});var $y=j("ZodJWT",(e,t)=>{mp.init(e,t),Mt.init(e,t)});var Pg=j("ZodNumber",(e,t)=>{jc.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Wm(e,n,i,r),e.isFinite=!0},Af({minValue:(e)=>{let{minimum:t,exclusiveMinimum:n}=Mn(e);return Math.max(t??Number.NEGATIVE_INFINITY,n??Number.NEGATIVE_INFINITY)},maxValue:(e)=>{let{maximum:t,exclusiveMaximum:n}=Mn(e);return Math.min(t??Number.POSITIVE_INFINITY,n??Number.POSITIVE_INFINITY)},isInt:(e)=>{let{isInt:t,multipleOf:n}=Mn(e);return!!t||!!n?.some(Number.isSafeInteger)},format:(e)=>Mn(e).format??null},{gt(e,t){return this.check(na(e,t))},gte(e,t){return this.check(Ls(e,t))},min(e,t){return this.check(Ls(e,t))},lt(e,t){return this.check(ta(e,t))},lte(e,t){return this.check(Is(e,t))},max(e,t){return this.check(Is(e,t))},int(e){return this.check(wg(e))},safe(e){return this.check(wg(e))},positive(e){return this.check(na(0,e))},nonnegative(e){return this.check(Ls(0,e))},negative(e){return this.check(ta(0,e))},nonpositive(e){return this.check(Is(0,e))},multipleOf(e,t){return this.check(ia(e,t))},step(e,t){return this.check(ia(e,t))},finite(){return this}}));function Zy(e){return ym(Pg,e)}var Xy=j("ZodNumberFormat",(e,t)=>{gp.init(e,t),Pg.init(e,t)});function wg(e){return Sm(Xy,e)}var qy=j("ZodBoolean",(e,t)=>{_p.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>$m(e,n,i,r)});function Yy(e){return bm(qy,e)}var jy=j("ZodUnknown",(e,t)=>{xp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Xm(e,n,i,r)});function cr(){return Mm(jy)}var Ky=j("ZodNever",(e,t)=>{vp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Zm(e,n,i,r)});function Jy(e){return wm(Ky,e)}var Qy=j("ZodArray",(e,t)=>{la(),yp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Jm(e,n,i,r),e.element=t.element},{min(e,t){return this.check(Lr(e,t))},nonempty(e){return this.check(Lr(1,e))},max(e,t){return this.check(ra(e,t))},length(e,t){return this.check(sa(e,t))},unwrap(){return this.element}});function ua(e,t){return Tm(Qy,e,t)}var eS=j("ZodObject",(e,t)=>{la(),Mp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Qm(e,n,i,r),Iv(e,"shape",(n)=>n._zod.def.shape,!1)},{keyof(){return Lg(Object.keys(this._zod.def.shape))},catchall(e){return this.clone(un(this._zod.def,{catchall:e}))},passthrough(){return this.clone(un(this._zod.def,{catchall:cr()}))},loose(){return this.clone(un(this._zod.def,{catchall:cr()}))},strict(){return this.clone(un(this._zod.def,{catchall:Jy()}))},strip(){return this.clone(un(this._zod.def,{catchall:void 0}))},extend(e){return Mv(this,e)},safeExtend(e){return wv(this,e)},merge(e){return Tv(this,e)},pick(e){return Sv(this,e)},omit(e){return bv(this,e)},partial(...e){return Mf(Ng,this,e[0])},exactPartial(...e){return Mf(Dg,this,e[0],"exactPartial")},required(...e){return Ev(Og,this,e[0])}});function Os(e,t){let n={type:"object",shape:e??{},...Re(t)};return new eS(n)}var tS=j("ZodUnion",(e,t)=>{wp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>eg(e,n,i,r),e.options=t.options});function nS(e,t){return new tS({type:"union",options:e,...Re(t)})}var iS=j("ZodIntersection",(e,t)=>{Tp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>tg(e,n,i,r)});function rS(e,t){return new iS({type:"intersection",left:e,right:t})}var Tg=j("ZodRecord",(e,t)=>{la(),Ep.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>ng(e,n,i,r),e.keyType=t.keyType,e.valueType=t.valueType});function Ig(e,t,n){if(!t||!t._zod)return new Tg({type:"record",keyType:Zt(),valueType:e,...Re(t)});return new Tg({type:"record",keyType:e,valueType:t,...Re(n)})}var Sl=j("ZodEnum",(e,t)=>{Ap.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(i,r,s)=>qm(e,i,r,s),e.enum=t.entries,e.options=[...e._zod.values];let n=new Set(Object.keys(t.entries));e.extract=(i,r)=>{let s={};for(let o of i)if(n.has(o))s[o]=t.entries[o];else throw Error(`Key ${o} not found in enum`);return new Sl({...t,checks:[],...Re(r),entries:s})},e.exclude=(i,r)=>{let s={...t.entries};for(let o of i)if(n.has(o))delete s[o];else throw Error(`Key ${o} not found in enum`);return new Sl({...t,checks:[],...Re(r),entries:s})}});function Lg(e,t){let n=Array.isArray(e)?Object.fromEntries(e.map((i)=>[i,i])):e;return new Sl({type:"enum",entries:n,...Re(t)})}var sS=j("ZodLiteral",(e,t)=>{Rp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Ym(e,n,i,r),e.values=new Set(t.values),Object.defineProperty(e,"value",{get(){if(t.values.length>1)throw Error("This schema contains multiple valid literal values. Use `.values` instead.");return t.values[0]}})});function oS(e,t){return new sS({type:"literal",values:Array.isArray(e)?e:[e],...Re(t)})}var aS=j("ZodTransform",(e,t)=>{la(),Cp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Km(e,n,i,r),e._zod.parse=(n,i)=>{if(i.direction==="backward")throw new Ts(e.constructor.name);n.addIssue=(s)=>{if(typeof s==="string")n.issues.push(or(s,n.value,t));else{let o=s;if(o.fatal)o.continue=!1;if(o.code??(o.code="custom"),!("input"in o))o.input=n.value;o.inst??(o.inst=e),n.issues.push(or(o))}};let r=t.transform(n.value,n);if(r instanceof Promise)return r.then((s)=>(n.value=s,n));return n.value=r,n}});function cS(e){return new aS({type:"transform",transform:e})}var Ng=j("ZodOptional",(e,t)=>{Kc.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>vl(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function Eg(e){return new Ng({type:"optional",innerType:e})}var Dg=j("ZodExactOptional",(e,t)=>{Pp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>vl(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function lS(e){return new Dg({type:"optional",innerType:e})}var uS=j("ZodNullable",(e,t)=>{Ip.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>ig(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function Ag(e){return new uS({type:"nullable",innerType:e})}var hS=j("ZodDefault",(e,t)=>{Lp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>og(e,n,i,r),e.unwrap=()=>e._zod.def.innerType,e.removeDefault=e.unwrap});function fS(e,t){return new hS({type:"default",innerType:e,get defaultValue(){return typeof t==="function"?t():Ic(t)}})}var dS=j("ZodPrefault",(e,t)=>{Np.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>ag(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function pS(e,t){return new dS({type:"prefault",innerType:e,get defaultValue(){return typeof t==="function"?t():Ic(t)}})}var Og=j("ZodNonOptional",(e,t)=>{Dp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>rg(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function mS(e,t){return new Og({type:"nonoptional",innerType:e,...Re(t)})}var gS=j("ZodCatch",(e,t)=>{Op.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>cg(e,n,i,r),e.unwrap=()=>e._zod.def.innerType,e.removeCatch=e.unwrap});function _S(e,t){return new gS({type:"catch",innerType:e,catchValue:typeof t==="function"?t:Rf(t)})}var xS=j("ZodPipe",(e,t)=>{Up.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>lg(e,n,i,r),e.in=t.in,e.out=t.out});function Rg(e,t){return new xS({type:"pipe",in:e,out:t})}var vS=j("ZodReadonly",(e,t)=>{Fp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>ug(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function yS(e){return new vS({type:"readonly",innerType:e})}var SS=j("ZodCustom",(e,t)=>{zp.init(e,t),bt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>jm(e,n,i,r)});function bS(e,t={}){return Em(SS,e,t)}function MS(e,t){return Am(e,t)}/*!
fflate - fast JavaScript compression/decompression
<https://101arrowz.github.io/fflate>
Licensed under MIT. https://github.com/101arrowz/fflate/blob/master/LICENSE
version 0.8.2
*/var wt=Uint8Array,dn=Uint16Array,Ll=Int32Array,ha=new wt([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),fa=new wt([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),El=new wt([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Hg=function(e,t){var n=new dn(31);for(var i=0;i<31;++i)n[i]=t+=1<<e[i-1];var r=new Ll(n[30]);for(var i=1;i<30;++i)for(var s=n[i];s<n[i+1];++s)r[s]=s-n[i]<<5|i;return{b:n,r}},Vg=Hg(ha,2),{b:Wg,r:Al}=Vg;Wg[28]=258,Al[258]=28;var $g=Hg(fa,0),{b:TS,r:Ug}=$g,Rl=new dn(32768);for(je=0;je<32768;++je)Yn=(je&43690)>>1|(je&21845)<<1,Yn=(Yn&52428)>>2|(Yn&13107)<<2,Yn=(Yn&61680)>>4|(Yn&3855)<<4,Rl[je]=((Yn&65280)>>8|(Yn&255)<<8)>>1;var Yn,je,Kn=function(e,t,n){var i=e.length,r=0,s=new dn(t);for(;r<i;++r)if(e[r])++s[e[r]-1];var o=new dn(t);for(r=1;r<t;++r)o[r]=o[r-1]+s[r-1]<<1;var a;if(n){a=new dn(1<<t);var c=15-t;for(r=0;r<i;++r)if(e[r]){var l=r<<4|e[r],u=t-e[r],f=o[e[r]-1]++<<u;for(var h=f|(1<<u)-1;f<=h;++f)a[Rl[f]>>c]=l}}else{a=new dn(i);for(r=0;r<i;++r)if(e[r])a[r]=Rl[o[e[r]-1]++]>>15-e[r]}return a},Di=new wt(288);for(je=0;je<144;++je)Di[je]=8;var je;for(je=144;je<256;++je)Di[je]=9;var je;for(je=256;je<280;++je)Di[je]=7;var je;for(je=280;je<288;++je)Di[je]=8;var je,zs=new wt(32);for(je=0;je<32;++je)zs[je]=5;var je,ES=Kn(Di,9,0),AS=Kn(Di,9,1),RS=Kn(zs,5,0),CS=Kn(zs,5,1),bl=function(e){var t=e[0];for(var n=1;n<e.length;++n)if(e[n]>t)t=e[n];return t},Ln=function(e,t,n){var i=t/8|0;return(e[i]|e[i+1]<<8)>>(t&7)&n},Ml=function(e,t){var n=t/8|0;return(e[n]|e[n+1]<<8|e[n+2]<<16)>>(t&7)},Nl=function(e){return(e+7)/8|0},ks=function(e,t,n){if(t==null||t<0)t=0;if(n==null||n>e.length)n=e.length;return new wt(e.subarray(t,n))};var PS=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],en=function(e,t,n){var i=Error(t||PS[e]);if(i.code=e,Error.captureStackTrace)Error.captureStackTrace(i,en);if(!n)throw i;return i},IS=function(e,t,n,i){var r=e.length,s=i?i.length:0;if(!r||t.f&&!t.l)return n||new wt(0);var o=!n,a=o||t.i!=2,c=t.i;if(o)n=new wt(r*3);var l=function(we){var gt=n.length;if(we>gt){var ke=new wt(Math.max(gt*2,we));ke.set(n),n=ke}},u=t.f||0,f=t.p||0,h=t.b||0,{l:d,d:g,m:x,n:p}=t,m=r*8;do{if(!d){u=Ln(e,f,1);var E=Ln(e,f+1,3);if(f+=3,!E){var R=Nl(f)+4,S=e[R-4]|e[R-3]<<8,b=R+S;if(b>r){if(c)en(0);break}if(a)l(h+S);n.set(e.subarray(R,b),h),t.b=h+=S,t.p=f=b*8,t.f=u;continue}else if(E==1)d=AS,g=CS,x=9,p=5;else if(E==2){var T=Ln(e,f,31)+257,A=Ln(e,f+10,15)+4,_=T+Ln(e,f+5,31)+1;f+=14;var M=new wt(_),F=new wt(19);for(var P=0;P<A;++P)F[El[P]]=Ln(e,f+P*3,7);f+=A*3;var O=bl(F),K=(1<<O)-1,C=Kn(F,O,1);for(var P=0;P<_;){var G=C[Ln(e,f,K)];f+=G&15;var R=G>>4;if(R<16)M[P++]=R;else{var X=0,z=0;if(R==16)z=3+Ln(e,f,3),f+=2,X=M[P-1];else if(R==17)z=3+Ln(e,f,7),f+=3;else if(R==18)z=11+Ln(e,f,127),f+=7;while(z--)M[P++]=X}}var te=M.subarray(0,T),H=M.subarray(T);x=bl(te),p=bl(H),d=Kn(te,x,1),g=Kn(H,p,1)}else en(1);if(f>m){if(c)en(0);break}}if(a)l(h+131072);var Q=(1<<x)-1,ee=(1<<p)-1,Te=f;for(;;Te=f){var X=d[Ml(e,f)&Q],ve=X>>4;if(f+=X&15,f>m){if(c)en(0);break}if(!X)en(2);if(ve<256)n[h++]=ve;else if(ve==256){Te=f,d=null;break}else{var He=ve-254;if(ve>264){var P=ve-257,Me=ha[P];He=Ln(e,f,(1<<Me)-1)+Wg[P],f+=Me}var Z=g[Ml(e,f)&ee],re=Z>>4;if(!Z)en(3);f+=Z&15;var H=TS[re];if(re>3){var Me=fa[re];H+=Ml(e,f)&(1<<Me)-1,f+=Me}if(f>m){if(c)en(0);break}if(a)l(h+131072);var se=h+He;if(h<H){var Pe=s-H,Ie=Math.min(H,se);if(Pe+h<0)en(3);for(;h<Ie;++h)n[h]=i[Pe+h]}for(;h<se;++h)n[h]=n[h-H]}}if(t.l=d,t.p=Te,t.b=h,t.f=u,d)u=1,t.m=x,t.d=g,t.n=p}while(!u);return h!=n.length&&o?ks(n,0,h):n.subarray(0,h)},pi=function(e,t,n){n<<=t&7;var i=t/8|0;e[i]|=n,e[i+1]|=n>>8},Us=function(e,t,n){n<<=t&7;var i=t/8|0;e[i]|=n,e[i+1]|=n>>8,e[i+2]|=n>>16},wl=function(e,t){var n=[];for(var i=0;i<e.length;++i)if(e[i])n.push({s:i,f:e[i]});var r=n.length,s=n.slice();if(!r)return{t:Xg,l:0};if(r==1){var o=new wt(n[0].s+1);return o[n[0].s]=1,{t:o,l:1}}n.sort(function(b,T){return b.f-T.f}),n.push({s:-1,f:25001});var a=n[0],c=n[1],l=0,u=1,f=2;n[0]={s:-1,f:a.f+c.f,l:a,r:c};while(u!=r-1)a=n[n[l].f<n[f].f?l++:f++],c=n[l!=u&&n[l].f<n[f].f?l++:f++],n[u++]={s:-1,f:a.f+c.f,l:a,r:c};var h=s[0].s;for(var i=1;i<r;++i)if(s[i].s>h)h=s[i].s;var d=new dn(h+1),g=Cl(n[u-1],d,0);if(g>t){var i=0,x=0,p=g-t,m=1<<p;s.sort(function(T,A){return d[A.s]-d[T.s]||T.f-A.f});for(;i<r;++i){var E=s[i].s;if(d[E]>t)x+=m-(1<<g-d[E]),d[E]=t;else break}x>>=p;while(x>0){var R=s[i].s;if(d[R]<t)x-=1<<t-d[R]++-1;else++i}for(;i>=0&&x;--i){var S=s[i].s;if(d[S]==t)--d[S],++x}g=t}return{t:new wt(d),l:g}},Cl=function(e,t,n){return e.s==-1?Math.max(Cl(e.l,t,n+1),Cl(e.r,t,n+1)):t[e.s]=n},Fg=function(e){var t=e.length;while(t&&!e[--t]);var n=new dn(++t),i=0,r=e[0],s=1,o=function(c){n[i++]=c};for(var a=1;a<=t;++a)if(e[a]==r&&a!=t)++s;else{if(!r&&s>2){for(;s>138;s-=138)o(32754);if(s>2)o(s>10?s-11<<5|28690:s-3<<5|12305),s=0}else if(s>3){o(r),--s;for(;s>6;s-=6)o(8304);if(s>2)o(s-3<<5|8208),s=0}while(s--)o(r);s=1,r=e[a]}return{c:n.subarray(0,i),n:t}},Fs=function(e,t){var n=0;for(var i=0;i<t.length;++i)n+=e[i]*t[i];return n},Zg=function(e,t,n){var i=n.length,r=Nl(t+2);e[r]=i&255,e[r+1]=i>>8,e[r+2]=e[r]^255,e[r+3]=e[r+1]^255;for(var s=0;s<i;++s)e[r+s+4]=n[s];return(r+4+i)*8},zg=function(e,t,n,i,r,s,o,a,c,l,u){pi(t,u++,n),++r[256];var f=wl(r,15),{t:h,l:d}=f,g=wl(s,15),{t:x,l:p}=g,m=Fg(h),{c:E,n:R}=m,S=Fg(x),{c:b,n:T}=S,A=new dn(19);for(var _=0;_<E.length;++_)++A[E[_]&31];for(var _=0;_<b.length;++_)++A[b[_]&31];var M=wl(A,7),{t:F,l:P}=M,O=19;for(;O>4&&!F[El[O-1]];--O);var K=l+5<<3,C=Fs(r,Di)+Fs(s,zs)+o,G=Fs(r,h)+Fs(s,x)+o+14+3*O+Fs(A,F)+2*A[16]+3*A[17]+7*A[18];if(c>=0&&K<=C&&K<=G)return Zg(t,u,e.subarray(c,c+l));var X,z,te,H;if(pi(t,u,1+(G<C)),u+=2,G<C){X=Kn(h,d,0),z=h,te=Kn(x,p,0),H=x;var Q=Kn(F,P,0);pi(t,u,R-257),pi(t,u+5,T-1),pi(t,u+10,O-4),u+=14;for(var _=0;_<O;++_)pi(t,u+3*_,F[El[_]]);u+=3*O;var ee=[E,b];for(var Te=0;Te<2;++Te){var ve=ee[Te];for(var _=0;_<ve.length;++_){var He=ve[_]&31;if(pi(t,u,Q[He]),u+=F[He],He>15)pi(t,u,ve[_]>>5&127),u+=ve[_]>>12}}}else X=ES,z=Di,te=RS,H=zs;for(var _=0;_<a;++_){var Me=i[_];if(Me>255){var He=Me>>18&31;if(Us(t,u,X[He+257]),u+=z[He+257],He>7)pi(t,u,Me>>23&31),u+=ha[He];var Z=Me&31;if(Us(t,u,te[Z]),u+=H[Z],Z>3)Us(t,u,Me>>5&8191),u+=fa[Z]}else Us(t,u,X[Me]),u+=z[Me]}return Us(t,u,X[256]),u+z[256]},LS=new Ll([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),Xg=new wt(0),NS=function(e,t,n,i,r,s){var o=s.z||e.length,a=new wt(i+o+5*(1+Math.ceil(o/7000))+r),c=a.subarray(i,a.length-r),l=s.l,u=(s.r||0)&7;if(t){if(u)c[0]=s.r>>3;var f=LS[t-1],h=f>>13,d=f&8191,g=(1<<n)-1,x=s.p||new dn(32768),p=s.h||new dn(g+1),m=Math.ceil(n/3),E=2*m,R=function(Xe){return(e[Xe]^e[Xe+1]<<m^e[Xe+2]<<E)&g},S=new Ll(25000),b=new dn(288),T=new dn(32),A=0,_=0,M=s.i||0,F=0,P=s.w||0,O=0;for(;M+2<o;++M){var K=R(M),C=M&32767,G=p[K];if(x[C]=G,p[K]=C,P<=M){var X=o-M;if((A>7000||F>24576)&&(X>423||!l)){u=zg(e,c,0,S,b,T,_,F,O,M-O,u),F=A=_=0,O=M;for(var z=0;z<286;++z)b[z]=0;for(var z=0;z<30;++z)T[z]=0}var te=2,H=0,Q=d,ee=C-G&32767;if(X>2&&K==R(M-ee)){var Te=Math.min(h,X)-1,ve=Math.min(32767,M),He=Math.min(258,X);while(ee<=ve&&--Q&&C!=G){if(e[M+te]==e[M+te-ee]){var Me=0;for(;Me<He&&e[M+Me]==e[M+Me-ee];++Me);if(Me>te){if(te=Me,H=ee,Me>Te)break;var Z=Math.min(ee,Me-2),re=0;for(var z=0;z<Z;++z){var se=M-ee+z&32767,Pe=x[se],Ie=se-Pe&32767;if(Ie>re)re=Ie,G=se}}}C=G,G=x[C],ee+=C-G&32767}}if(H){S[F++]=268435456|Al[te]<<18|Ug[H];var we=Al[te]&31,gt=Ug[H]&31;_+=ha[we]+fa[gt],++b[257+we],++T[gt],P=M+te,++A}else S[F++]=e[M],++b[e[M]]}}for(M=Math.max(M,P);M<o;++M)S[F++]=e[M],++b[e[M]];if(u=zg(e,c,l,S,b,T,_,F,O,M-O,u),!l)s.r=u&7|c[u/8|0]<<3,u-=7,s.h=p,s.p=x,s.i=M,s.w=P}else{for(var M=s.w||0;M<o+l;M+=65535){var ke=M+65535;if(ke>=o)c[u/8|0]=l,ke=o;u=Zg(c,u+1,e.subarray(M,ke))}s.i=o}return ks(a,0,i+Nl(u)+r)},DS=function(){var e=new Int32Array(256);for(var t=0;t<256;++t){var n=t,i=9;while(--i)n=(n&1&&-306674912)^n>>>1;e[t]=n}return e}(),OS=function(){var e=-1;return{p:function(t){var n=e;for(var i=0;i<t.length;++i)n=DS[n&255^t[i]]^n>>>8;e=n},d:function(){return~e}}};var US=function(e,t,n,i,r){if(!r){if(r={l:1},t.dictionary){var s=t.dictionary.subarray(-32768),o=new wt(s.length+e.length);o.set(s),o.set(e,s.length),e=o,r.w=s.length}}return NS(e,t.level==null?6:t.level,t.mem==null?r.l?Math.ceil(Math.max(8,Math.min(13,Math.log(e.length)))*1.5):20:12+t.mem,n,i,r)},qg=function(e,t){var n={};for(var i in e)n[i]=e[i];for(var i in t)n[i]=t[i];return n};var jn=function(e,t){return e[t]|e[t+1]<<8},Nn=function(e,t){return(e[t]|e[t+1]<<8|e[t+2]<<16|e[t+3]<<24)>>>0},Tl=function(e,t){return Nn(e,t)+Nn(e,t+4)*4294967296},Wt=function(e,t,n){for(;n;++t)e[t]=n,n>>>=8};function FS(e,t){return US(e,t||{},0,0)}function zS(e,t){return IS(e,{i:2},t&&t.out,t&&t.dictionary)}var Yg=function(e,t,n,i){for(var r in e){var s=e[r],o=t+r,a=i;if(Array.isArray(s))a=qg(i,s[1]),s=s[0];if(s instanceof wt)n[o]=[s,a];else n[o+="/"]=[new wt(0),a],Yg(s,o,n,i)}},kg=typeof TextEncoder<"u"&&new TextEncoder,Pl=typeof TextDecoder<"u"&&new TextDecoder,kS=0;try{Pl.decode(Xg,{stream:!0}),kS=1}catch(e){}var BS=function(e){for(var t="",n=0;;){var i=e[n++],r=(i>127)+(i>223)+(i>239);if(n+r>e.length)return{s:t,r:ks(e,n-1)};if(!r)t+=String.fromCharCode(i);else if(r==3)i=((i&15)<<18|(e[n++]&63)<<12|(e[n++]&63)<<6|e[n++]&63)-65536,t+=String.fromCharCode(55296|i>>10,56320|i&1023);else if(r&1)t+=String.fromCharCode((i&31)<<6|e[n++]&63);else t+=String.fromCharCode((i&15)<<12|(e[n++]&63)<<6|e[n++]&63)}};function Bg(e,t){if(t){var n=new wt(e.length);for(var i=0;i<e.length;++i)n[i]=e.charCodeAt(i);return n}if(kg)return kg.encode(e);var r=e.length,s=new wt(e.length+(e.length>>1)),o=0,a=function(u){s[o++]=u};for(var i=0;i<r;++i){if(o+5>s.length){var c=new wt(o+8+(r-i<<1));c.set(s),s=c}var l=e.charCodeAt(i);if(l<128||t)a(l);else if(l<2048)a(192|l>>6),a(128|l&63);else if(l>55295&&l<57344)l=65536+(l&1047552)|e.charCodeAt(++i)&1023,a(240|l>>18),a(128|l>>12&63),a(128|l>>6&63),a(128|l&63);else a(224|l>>12),a(128|l>>6&63),a(128|l&63)}return ks(s,0,o)}function GS(e,t){if(t){var n="";for(var i=0;i<e.length;i+=16384)n+=String.fromCharCode.apply(null,e.subarray(i,i+16384));return n}else if(Pl)return Pl.decode(e);else{var r=BS(e),{s,r:n}=r;if(n.length)en(8);return s}}var HS=function(e,t){return t+30+jn(e,t+26)+jn(e,t+28)},VS=function(e,t,n){var i=jn(e,t+28),r=GS(e.subarray(t+46,t+46+i),!(jn(e,t+8)&2048)),s=t+46+i,o=Nn(e,t+20),a=n&&o==4294967295?WS(e,s):[o,Nn(e,t+24),Nn(e,t+42)],c=a[0],l=a[1],u=a[2];return[jn(e,t+10),c,l,r,s+jn(e,t+30)+jn(e,t+32),u]},WS=function(e,t){for(;jn(e,t)!=1;t+=4+jn(e,t+2));return[Tl(e,t+12),Tl(e,t+4),Tl(e,t+20)]},Il=function(e){var t=0;if(e)for(var n in e){var i=e[n].length;if(i>65535)en(9);t+=i+4}return t},Gg=function(e,t,n,i,r,s,o,a){var c=i.length,l=n.extra,u=a&&a.length,f=Il(l);if(Wt(e,t,o!=null?33639248:67324752),t+=4,o!=null)e[t++]=20,e[t++]=n.os;e[t]=20,t+=2,e[t++]=n.flag<<1|(s<0&&8),e[t++]=r&&8,e[t++]=n.compression&255,e[t++]=n.compression>>8;var h=new Date(n.mtime==null?Date.now():n.mtime),d=h.getFullYear()-1980;if(d<0||d>119)en(10);if(Wt(e,t,d<<25|h.getMonth()+1<<21|h.getDate()<<16|h.getHours()<<11|h.getMinutes()<<5|h.getSeconds()>>1),t+=4,s!=-1)Wt(e,t,n.crc),Wt(e,t+4,s<0?-s-2:s),Wt(e,t+8,n.size);if(Wt(e,t+12,c),Wt(e,t+14,f),t+=16,o!=null)Wt(e,t,u),Wt(e,t+6,n.attrs),Wt(e,t+10,o),t+=14;if(e.set(i,t),t+=c,f)for(var g in l){var x=l[g],p=x.length;Wt(e,t,+g),Wt(e,t+2,p),e.set(x,t+4),t+=4+p}if(u)e.set(a,t),t+=u;return t},$S=function(e,t,n,i,r){Wt(e,t,101010256),Wt(e,t+8,n),Wt(e,t+10,n),Wt(e,t+12,i),Wt(e,t+16,r)};function jg(e,t){if(!t)t={};var n={},i=[];Yg(e,"",n,t);var r=0,s=0;for(var o in n){var a=n[o],c=a[0],l=a[1],u=l.level==0?0:8,f=Bg(o),h=f.length,d=l.comment,g=d&&Bg(d),x=g&&g.length,p=Il(l.extra);if(h>65535)en(11);var m=u?FS(c,l):c,E=m.length,R=OS();R.p(c),i.push(qg(l,{size:c.length,crc:R.d(),c:m,f,m:g,u:h!=o.length||g&&d.length!=x,o:r,compression:u})),r+=30+h+p+E,s+=76+2*(h+p)+(x||0)+E}var S=new wt(s+22),b=r,T=s-r;for(var A=0;A<i.length;++A){var f=i[A];Gg(S,f.o,f,f.f,f.u,f.c.length);var _=30+f.f.length+Il(f.extra);S.set(f.c,f.o+_),Gg(S,r,f,f.f,f.u,f.c.length,f.o,f.m),r+=16+_+(f.m?f.m.length:0)}return $S(S,r,i.length,T,b),S}function Kg(e,t){var n={},i=e.length-22;for(;Nn(e,i)!=101010256;--i)if(!i||e.length-i>65558)en(13);var r=jn(e,i+8);if(!r)return{};var s=Nn(e,i+16),o=s==4294967295||r==65535;if(o){var a=Nn(e,i-12);if(o=Nn(e,a)==101075792,o)r=Nn(e,a+32),s=Nn(e,a+48)}var c=t&&t.filter;for(var l=0;l<r;++l){var u=VS(e,s,o),f=u[0],h=u[1],d=u[2],g=u[3],x=u[4],p=u[5],m=HS(e,p);if(s=x,!c||c({name:g,size:h,originalSize:d,compression:f}))if(!f)n[g]=ks(e,m,m+h);else if(f==8)n[g]=zS(e.subarray(m,m+h),{out:new wt(d)});else en(14,"unknown compression type "+f)}return n}var mi=67108864,Dl=Zt().regex(/^[a-z][a-z0-9_-]{0,79}$/),ZS=Zt().regex(/^sha256:[a-f0-9]{64}$/),Jg=Os({version:oS("kiln.asset.v1"),assetId:Dl,revisionId:Dl,parentRevision:Dl.optional(),name:Zt().min(1).max(200),tags:ua(Zt().max(80)).max(30),createdAt:Zt().datetime(),description:Zt().max(4000).optional(),brief:Zt().max(8000).optional(),attribution:Os({model:Zt().max(200).optional(),harness:Zt().max(200).optional(),author:Zt().max(200).optional()}).optional(),editable:Yy(),files:Ig(Zt(),Os({sha256:ZS,bytes:Zy().int().nonnegative().max(mi)})),build:Os({engine:Zt(),options:Ig(Zt(),cr()),warnings:ua(Zt()),integration:cr().optional(),qa:cr().optional(),dependencies:ua(cr()).optional(),rebuild:Lg(["engine-required","external-dependencies-required"])}).optional(),preview:Os({fidelity:cr().optional(),error:Zt().optional()}).optional()}),XS=new Set(["asset.glb","source.kiln.js","preview.png"]);function Qg(e){let t=Jg.parse(e.manifest),n=Object.keys(e.files);if(n.length!==Object.keys(t.files).length||!n.includes("asset.glb"))throw Error("Asset file inventory mismatch");let i=0;for(let r of n){if(!XS.has(r)||!t.files[r]||t.files[r].bytes!==e.files[r].length)throw Error("Invalid asset file inventory");i+=e.files[r].length}if(i>mi||t.editable!==n.includes("source.kiln.js"))throw Error("Invalid asset size or source inventory");if((e.files["source.kiln.js"]?.length??0)>1048576)throw Error("Source exceeds 1 MiB");Ol(e.files["asset.glb"])}function Ol(e){if(e.length<20||e.length>mi)throw Error("Invalid GLB size");let t=new DataView(e.buffer,e.byteOffset,e.byteLength);if(t.getUint32(0,!0)!==1179937895||t.getUint32(4,!0)!==2||t.getUint32(8,!0)!==e.length||t.getUint32(16,!0)!==1313821514)throw Error("Invalid GLB header");let n=20+t.getUint32(12,!0);if(n>e.length)throw Error("Invalid GLB JSON length");let i=JSON.parse(new TextDecoder().decode(e.subarray(20,n)));for(let r of[...i.buffers??[],...i.images??[]])if(r.uri&&!String(r.uri).startsWith("data:"))throw Error("GLB must embed its resources")}function Ul(e){if(!e.length||e.length>100)throw Error("Bundle requires 1..100 revisions");let t={},n=0;for(let i of e){Qg(i);let r=`${i.manifest.assetId}/${i.manifest.revisionId}/`;if(t[`${r}manifest.json`])throw Error("Duplicate bundle revision");t[`${r}manifest.json`]=new TextEncoder().encode(JSON.stringify(i.manifest,null,2));for(let[s,o]of Object.entries(i.files))t[r+s]=o}for(let i of Object.values(t))n+=i.length;if(n>mi)throw Error("Bundle exceeds 64 MiB");return jg(t,{level:0})}function e_(e){if(e.length>mi+1048576)throw Error("Bundle exceeds 64 MiB");let t=0,n=0,i=Kg(e,{filter:(o)=>{if(t+=o.originalSize,n++,t>mi||n>400||!/^[a-z][a-z0-9_-]{0,79}\/[a-z][a-z0-9_-]{0,79}\/(manifest\.json|asset\.glb|source\.kiln\.js|preview\.png)$/.test(o.name))throw Error("Unsafe or oversized asset bundle");return!0}}),r=[],s=new Set;for(let[o,a]of Object.entries(i)){if(!o.endsWith("/manifest.json"))continue;if(a.length>1048576)throw Error("Manifest exceeds 1 MiB");let c=Jg.parse(JSON.parse(new TextDecoder().decode(a))),l=`${c.assetId}/${c.revisionId}/`;if(o!==`${l}manifest.json`)throw Error("Bundle identity mismatch");let u={manifest:c,files:{}};s.add(o);for(let f of Object.keys(c.files)){if(!i[l+f])throw Error("Bundle file missing");u.files[f]=i[l+f],s.add(l+f)}Qg(u),r.push(u)}if(!r.length||s.size!==Object.keys(i).length)throw Error("Incomplete asset bundle");return r}var z_="186",Hi={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Vi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},k_=0,cu=1,B_=2;var Ks=1,G_=2,Qr=3,Wi=0,Yt=1,An=2,ni=0,Js=1,lu=2,uu=3,hu=4,H_=5;var es=100,V_=101,W_=102,$_=103,Z_=104,X_=200,q_=201,Y_=202,j_=203,K_=204,J_=205,Q_=206,e0=207,t0=208,n0=209,i0=210,r0=211,s0=212,o0=213,a0=214,c0=0,l0=1,u0=2,fu=3,h0=4,f0=5,d0=6,p0=7,m0=0,g0=1,_0=2,kn=0,du=1,pu=2,mu=3,Qs=4,gu=5,_u=6,xu=7;var ts=301,mr=302,Ga=303,Ha=304,eo=306,ns=1000,is=1001,Va=1002,Bn=1003,Wa=1004;var gr=1005;var Gt=1006,rs=1007;var ii=1008;var Gn=1009,x0=1010,v0=1011,to=1012,vu=1013,$i=1014,Mi=1015,ri=1016,yu=1017,Su=1018,ss=1020,y0=35902,S0=35899,b0=1021,M0=1022,si=1023,_r=1026,xr=1027,w0=1028,bu=1029,vr=1030,Mu=1031;var wu=1033,$a=33776,Za=33777,Xa=33778,qa=33779,Tu=35840,Eu=35841,Au=35842,Ru=35843,Cu=36196,Pu=37492,Iu=37496,Lu=37488,Nu=37489,Ya=37490,Du=37491,Ou=37808,Uu=37809,Fu=37810,zu=37811,ku=37812,Bu=37813,Gu=37814,Hu=37815,Vu=37816,Wu=37817,$u=37818,Zu=37819,Xu=37820,qu=37821,Yu=36492,ju=36494,Ku=36495,Ju=36283,Qu=36284,ja=36285,eh=36286;var th=2300,Ka=2301;var nh=0,no=1,os=2;var ih=0,T0=1,yr="",Zi="srgb",gn="srgb-linear",rh="linear",ft="srgb";var E0=512,A0=513,R0=514,Ja=515,C0=516,P0=517,Qa=518,I0=519;var sh="300 es",oh=2000;function qS(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function YS(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function jr(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function L0(){let e=jr("canvas");return e.style.display="block",e}var t_={},Kr=null;function js(...e){let t="THREE."+e.shift();if(Kr)Kr("log",t,...e);else console.log(t,...e)}function N0(e){let t=e[0];if(typeof t==="string"&&t.startsWith("TSL:")){let n=e[1];if(n&&n.isStackTrace)e[0]+=" "+n.getLocation();else e[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return e}function Ce(...e){e=N0(e);let t="THREE."+e.shift();if(Kr)Kr("warn",t,...e);else{let n=e[0];if(n&&n.isStackTrace)console.warn(n.getError(t));else console.warn(t,...e)}}function Ue(...e){e=N0(e);let t="THREE."+e.shift();if(Kr)Kr("error",t,...e);else{let n=e[0];if(n&&n.isStackTrace)console.error(n.getError(t));else console.error(t,...e)}}function dr(...e){let t=e.join(" ");if(t in t_)return;t_[t]=!0,Ce(...e)}function D0(e,t,n){return new Promise(function(i,r){function s(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:r();break;case e.TIMEOUT_EXPIRED:setTimeout(s,n);break;default:i()}}setTimeout(s,n)})}var O0={[0]:1,[2]:6,[4]:7,[3]:5,[1]:0,[6]:2,[7]:4,[5]:3};class Hn{addEventListener(e,t){if(this._listeners===void 0)this._listeners={};let n=this._listeners;if(n[e]===void 0)n[e]=[];if(n[e].indexOf(t)===-1)n[e].push(t)}hasEventListener(e,t){let n=this._listeners;if(n===void 0)return!1;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let i=n[e];if(i!==void 0){let r=i.indexOf(t);if(r!==-1)i.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let i=n.slice(0);for(let r=0,s=i.length;r<s;r++)i[r].call(this,e);e.target=null}}}var Xt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],n_=1234567,qs=Math.PI/180,pr=180/Math.PI;function zn(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Xt[e&255]+Xt[e>>8&255]+Xt[e>>16&255]+Xt[e>>24&255]+"-"+Xt[t&255]+Xt[t>>8&255]+"-"+Xt[t>>16&15|64]+Xt[t>>24&255]+"-"+Xt[n&63|128]+Xt[n>>8&255]+"-"+Xt[n>>16&255]+Xt[n>>24&255]+Xt[i&255]+Xt[i>>8&255]+Xt[i>>16&255]+Xt[i>>24&255]).toLowerCase()}function Ze(e,t,n){return Math.max(t,Math.min(n,e))}function ah(e,t){return(e%t+t)%t}function jS(e,t,n,i,r){return i+(e-t)*(r-i)/(n-t)}function KS(e,t,n){if(e!==t)return(n-e)/(t-e);else return 0}function Ys(e,t,n){return(1-n)*e+n*t}function JS(e,t,n,i){return Ys(e,t,1-Math.exp(-n*i))}function QS(e,t=1){return t-Math.abs(ah(e,t*2)-t)}function eb(e,t,n){if(e<=t)return 0;if(e>=n)return 1;return e=(e-t)/(n-t),e*e*(3-2*e)}function tb(e,t,n){if(e<=t)return 0;if(e>=n)return 1;return e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10)}function nb(e,t){return e+Math.floor(Math.random()*(t-e+1))}function ib(e,t){return e+Math.random()*(t-e)}function rb(e){return e*(0.5-Math.random())}function sb(e){if(e!==void 0)n_=e;let t=n_+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function ob(e){return e*qs}function ab(e){return e*pr}function cb(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function lb(e){return Math.pow(2,Math.ceil(Math.log(e)/Math.LN2))}function ub(e){return Math.pow(2,Math.floor(Math.log(e)/Math.LN2))}function hb(e,t,n,i,r){let{cos:s,sin:o}=Math,a=s(n/2),c=o(n/2),l=s((t+i)/2),u=o((t+i)/2),f=s((t-i)/2),h=o((t-i)/2),d=s((i-t)/2),g=o((i-t)/2);switch(r){case"XYX":e.set(a*u,c*f,c*h,a*l);break;case"YZY":e.set(c*h,a*u,c*f,a*l);break;case"ZXZ":e.set(c*f,c*h,a*u,a*l);break;case"XZX":e.set(a*u,c*g,c*d,a*l);break;case"YXY":e.set(c*d,a*u,c*g,a*l);break;case"ZYZ":e.set(c*g,c*d,a*u,a*l);break;default:Ce("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Fn(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error("THREE.MathUtils: Invalid component type.")}}function ot(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error("THREE.MathUtils: Invalid component type.")}}var io={DEG2RAD:qs,RAD2DEG:pr,generateUUID:zn,clamp:Ze,euclideanModulo:ah,mapLinear:jS,inverseLerp:KS,lerp:Ys,damp:JS,pingpong:QS,smoothstep:eb,smootherstep:tb,randInt:nb,randFloat:ib,randFloatSpread:rb,seededRandom:sb,degToRad:ob,radToDeg:ab,isPowerOfTwo:cb,ceilPowerOfTwo:lb,floorPowerOfTwo:ub,setQuaternionFromProperEuler:hb,normalize:ot,denormalize:Fn};class Ne{static{Ne.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ze(this.x,e.x,t.x),this.y=Ze(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ze(this.x,e,t),this.y=Ze(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ze(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ze(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,s=this.y-e.y;return this.x=r*n-s*i+e.x,this.y=r*i+s*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class kt{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,s,o){let a=n[i+0],c=n[i+1],l=n[i+2],u=n[i+3],f=r[s+0],h=r[s+1],d=r[s+2],g=r[s+3];if(u!==g||a!==f||c!==h||l!==d){let x=a*f+c*h+l*d+u*g;if(x<0)f=-f,h=-h,d=-d,g=-g,x=-x;let p=1-o;if(x<0.9995){let m=Math.acos(x),E=Math.sin(m);p=Math.sin(p*m)/E,o=Math.sin(o*m)/E,a=a*p+f*o,c=c*p+h*o,l=l*p+d*o,u=u*p+g*o}else{a=a*p+f*o,c=c*p+h*o,l=l*p+d*o,u=u*p+g*o;let m=1/Math.sqrt(a*a+c*c+l*l+u*u);a*=m,c*=m,l*=m,u*=m}}e[t]=a,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,r,s){let o=n[i],a=n[i+1],c=n[i+2],l=n[i+3],u=r[s],f=r[s+1],h=r[s+2],d=r[s+3];return e[t]=o*d+l*u+a*h-c*f,e[t+1]=a*d+l*f+c*u-o*h,e[t+2]=c*d+l*h+o*f-a*u,e[t+3]=l*d-o*u-a*f-c*h,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let{_x:n,_y:i,_z:r,_order:s}=e,{cos:o,sin:a}=Math,c=o(n/2),l=o(i/2),u=o(r/2),f=a(n/2),h=a(i/2),d=a(r/2);switch(s){case"XYZ":this._x=f*l*u+c*h*d,this._y=c*h*u-f*l*d,this._z=c*l*d+f*h*u,this._w=c*l*u-f*h*d;break;case"YXZ":this._x=f*l*u+c*h*d,this._y=c*h*u-f*l*d,this._z=c*l*d-f*h*u,this._w=c*l*u+f*h*d;break;case"ZXY":this._x=f*l*u-c*h*d,this._y=c*h*u+f*l*d,this._z=c*l*d+f*h*u,this._w=c*l*u-f*h*d;break;case"ZYX":this._x=f*l*u-c*h*d,this._y=c*h*u+f*l*d,this._z=c*l*d-f*h*u,this._w=c*l*u+f*h*d;break;case"YZX":this._x=f*l*u+c*h*d,this._y=c*h*u+f*l*d,this._z=c*l*d-f*h*u,this._w=c*l*u-f*h*d;break;case"XZY":this._x=f*l*u-c*h*d,this._y=c*h*u-f*l*d,this._z=c*l*d+f*h*u,this._w=c*l*u+f*h*d;break;default:Ce("Quaternion: .setFromEuler() encountered an unknown order: "+s)}if(t===!0)this._onChangeCallback();return this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],r=t[8],s=t[1],o=t[5],a=t[9],c=t[2],l=t[6],u=t[10],f=n+o+u;if(f>0){let h=0.5/Math.sqrt(f+1);this._w=0.25/h,this._x=(l-a)*h,this._y=(r-c)*h,this._z=(s-i)*h}else if(n>o&&n>u){let h=2*Math.sqrt(1+n-o-u);this._w=(l-a)/h,this._x=0.25*h,this._y=(i+s)/h,this._z=(r+c)/h}else if(o>u){let h=2*Math.sqrt(1+o-n-u);this._w=(r-c)/h,this._x=(i+s)/h,this._y=0.25*h,this._z=(a+l)/h}else{let h=2*Math.sqrt(1+u-n-o);this._w=(s-i)/h,this._x=(r+c)/h,this._y=(a+l)/h,this._z=0.25*h}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;if(n<0.00000001)if(n=0,Math.abs(e.x)>Math.abs(e.z))this._x=-e.y,this._y=e.x,this._z=0,this._w=n;else this._x=0,this._y=-e.z,this._z=e.y,this._w=n;else this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n;return this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ze(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();if(e===0)this._x=0,this._y=0,this._z=0,this._w=1;else e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e;return this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let{_x:n,_y:i,_z:r,_w:s}=e,{_x:o,_y:a,_z:c,_w:l}=t;return this._x=n*l+s*o+i*c-r*a,this._y=i*l+s*a+r*o-n*c,this._z=r*l+s*c+n*a-i*o,this._w=s*l-n*o-i*a-r*c,this._onChangeCallback(),this}slerp(e,t){let{_x:n,_y:i,_z:r,_w:s}=e,o=this.dot(e);if(o<0)n=-n,i=-i,r=-r,s=-s,o=-o;let a=1-t;if(o<0.9995){let c=Math.acos(o),l=Math.sin(c);a=Math.sin(a*c)/l,t=Math.sin(t*c)/l,this._x=this._x*a+n*t,this._y=this._y*a+i*t,this._z=this._z*a+r*t,this._w=this._w*a+s*t,this._onChangeCallback()}else this._x=this._x*a+n*t,this._y=this._y*a+i*t,this._z=this._z*a+r*t,this._w=this._w*a+s*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class U{static{U.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){if(n===void 0)n=this.z;return this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(i_.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(i_.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=e.elements,s=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*s,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*s,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*s,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,{x:r,y:s,z:o,w:a}=e,c=2*(s*i-o*n),l=2*(o*t-r*i),u=2*(r*n-s*t);return this.x=t+a*c+s*u-o*l,this.y=n+a*l+o*c-r*u,this.z=i+a*u+r*l-s*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ze(this.x,e.x,t.x),this.y=Ze(this.y,e.y,t.y),this.z=Ze(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ze(this.x,e,t),this.y=Ze(this.y,e,t),this.z=Ze(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ze(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let{x:n,y:i,z:r}=e,{x:s,y:o,z:a}=t;return this.x=i*a-r*o,this.y=r*s-n*a,this.z=n*o-i*s,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Fl.copy(this).projectOnVector(e),this.sub(Fl)}reflect(e){return this.sub(Fl.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ze(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}var Fl=new U,i_=new kt;class ze{static{ze.prototype.isMatrix3=!0}constructor(e,t,n,i,r,s,o,a,c){if(this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0)this.set(e,t,n,i,r,s,o,a,c)}set(e,t,n,i,r,s,o,a,c){let l=this.elements;return l[0]=e,l[1]=i,l[2]=o,l[3]=t,l[4]=r,l[5]=a,l[6]=n,l[7]=s,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,s=n[0],o=n[3],a=n[6],c=n[1],l=n[4],u=n[7],f=n[2],h=n[5],d=n[8],g=i[0],x=i[3],p=i[6],m=i[1],E=i[4],R=i[7],S=i[2],b=i[5],T=i[8];return r[0]=s*g+o*m+a*S,r[3]=s*x+o*E+a*b,r[6]=s*p+o*R+a*T,r[1]=c*g+l*m+u*S,r[4]=c*x+l*E+u*b,r[7]=c*p+l*R+u*T,r[2]=f*g+h*m+d*S,r[5]=f*x+h*E+d*b,r[8]=f*p+h*R+d*T,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],s=e[4],o=e[5],a=e[6],c=e[7],l=e[8];return t*s*l-t*o*c-n*r*l+n*o*a+i*r*c-i*s*a}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],s=e[4],o=e[5],a=e[6],c=e[7],l=e[8],u=l*s-o*c,f=o*a-l*r,h=c*r-s*a,d=t*u+n*f+i*h;if(d===0)return this.set(0,0,0,0,0,0,0,0,0);let g=1/d;return e[0]=u*g,e[1]=(i*c-l*n)*g,e[2]=(o*n-i*s)*g,e[3]=f*g,e[4]=(l*t-i*a)*g,e[5]=(i*r-o*t)*g,e[6]=h*g,e[7]=(n*a-c*t)*g,e[8]=(s*t-n*r)*g,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,s,o){let a=Math.cos(r),c=Math.sin(r);return this.set(n*a,n*c,-n*(a*s+c*o)+s+e,-i*c,i*a,-i*(-c*s+a*o)+o+t,0,0,1),this}scale(e,t){return dr("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(zl.makeScale(e,t)),this}rotate(e){return dr("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(zl.makeRotation(-e)),this}translate(e,t){return dr("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(zl.makeTranslation(e,t)),this}makeTranslation(e,t){if(e.isVector2)this.set(1,0,e.x,0,1,e.y,0,0,1);else this.set(1,0,e,0,1,t,0,0,1);return this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}var zl=new ze,r_=new ze().set(0.4123908,0.3575843,0.1804808,0.212639,0.7151687,0.0721923,0.0193308,0.1191948,0.9505322),s_=new ze().set(3.2409699,-1.5373832,-0.4986108,-0.9692436,1.8759675,0.0415551,0.0556301,-0.203977,1.0569715);function fb(){let e={enabled:!0,workingColorSpace:"srgb-linear",spaces:{},convert:function(r,s,o){if(this.enabled===!1||s===o||!s||!o)return r;if(this.spaces[s].transfer==="srgb")r.r=bi(r.r),r.g=bi(r.g),r.b=bi(r.b);if(this.spaces[s].primaries!==this.spaces[o].primaries)r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ);if(this.spaces[o].transfer==="srgb")r.r=Yr(r.r),r.g=Yr(r.g),r.b=Yr(r.b);return r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){if(r==="")return"linear";return this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return dr("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),e.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return dr("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),e.colorSpaceToWorking(r,s)}},t=[0.64,0.33,0.3,0.6,0.15,0.06],n=[0.2126,0.7152,0.0722],i=[0.3127,0.329];return e.define({["srgb-linear"]:{primaries:t,whitePoint:i,transfer:"linear",toXYZ:r_,fromXYZ:s_,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:"srgb"},outputColorSpaceConfig:{drawingBufferColorSpace:"srgb"}},["srgb"]:{primaries:t,whitePoint:i,transfer:"srgb",toXYZ:r_,fromXYZ:s_,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:"srgb"}}}),e}var $e=fb();function bi(e){return e<0.04045?e*0.0773993808:Math.pow(e*0.9478672986+0.0521327014,2.4)}function Yr(e){return e<0.0031308?e*12.92:1.055*Math.pow(e,0.41666)-0.055}var Or;class ch{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src))return e.src;if(typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{if(Or===void 0)Or=jr("canvas");Or.width=e.width,Or.height=e.height;let i=Or.getContext("2d");if(e instanceof ImageData)i.putImageData(e,0,0);else i.drawImage(e,0,0,e.width,e.height);n=Or}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=jr("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let s=0;s<r.length;s++)r[s]=bi(r[s]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)if(t instanceof Uint8Array||t instanceof Uint8ClampedArray)t[n]=Math.floor(bi(t[n]/255)*255);else t[n]=bi(t[n]);return{data:t,width:e.width,height:e.height}}else return Ce("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}var db=0;class ro{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:db++}),this.uuid=zn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;if(typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement)e.set(t.videoWidth,t.videoHeight,0);else if(typeof VideoFrame<"u"&&t instanceof VideoFrame)e.set(t.displayWidth,t.displayHeight,0);else if(t!==null)e.set(t.width,t.height,t.depth||0);else e.set(0,0,0);return e}set needsUpdate(e){if(e===!0)this.version++}toJSON(e){let t=e===void 0||typeof e==="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let s=0,o=i.length;s<o;s++)if(i[s].isDataTexture)r.push(kl(i[s].image));else r.push(kl(i[s]))}else r=kl(i);n.url=r}if(!t)e.images[this.uuid]=n;return n}}function kl(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap)return ch.getDataURL(e);else if(e.data)return{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name};else return Ce("Texture: Unable to serialize Texture."),{}}var pb=0,Bl=new U;class Tt extends Hn{constructor(e=Tt.DEFAULT_IMAGE,t=Tt.DEFAULT_MAPPING,n=1001,i=1001,r=1006,s=1008,o=1023,a=1009,c=Tt.DEFAULT_ANISOTROPY,l=""){super();this.isTexture=!0,Object.defineProperty(this,"id",{value:pb++}),this.uuid=zn(),this.name="",this.source=new ro(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=s,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=a,this.offset=new Ne(0,0),this.repeat=new Ne(1,1),this.center=new Ne(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ze,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=l,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=e&&e.depth&&e.depth>1?!0:!1,this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Bl).x}get height(){return this.source.getSize(Bl).y}get depth(){return this.source.getSize(Bl).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){Ce(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){Ce(`Texture.setValues(): property '${t}' does not exist.`);continue}if(i&&n&&(i.isVector2&&n.isVector2))i.copy(n);else if(i&&n&&(i.isVector3&&n.isVector3))i.copy(n);else if(i&&n&&(i.isMatrix3&&n.isMatrix3))i.copy(n);else this[t]=n}}toJSON(e){let t=e===void 0||typeof e==="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};if(Object.keys(this.userData).length>0)n.userData=this.userData;if(!t)e.textures[this.uuid]=n;return n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case 1000:e.x=e.x-Math.floor(e.x);break;case 1001:e.x=e.x<0?0:1;break;case 1002:if(Math.abs(Math.floor(e.x)%2)===1)e.x=Math.ceil(e.x)-e.x;else e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case 1000:e.y=e.y-Math.floor(e.y);break;case 1001:e.y=e.y<0?0:1;break;case 1002:if(Math.abs(Math.floor(e.y)%2)===1)e.y=Math.ceil(e.y)-e.y;else e.y=e.y-Math.floor(e.y);break}if(this.flipY)e.y=1-e.y;return e}set needsUpdate(e){if(e===!0)this.version++,this.source.needsUpdate=!0}set needsPMREMUpdate(e){if(e===!0)this.pmremVersion++}}Tt.DEFAULT_IMAGE=null;Tt.DEFAULT_MAPPING=300;Tt.DEFAULT_ANISOTROPY=1;class at{static{at.prototype.isVector4=!0}constructor(e=0,t=0,n=0,i=1){this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=this.w,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*i+s[12]*r,this.y=s[1]*t+s[5]*n+s[9]*i+s[13]*r,this.z=s[2]*t+s[6]*n+s[10]*i+s[14]*r,this.w=s[3]*t+s[7]*n+s[11]*i+s[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);if(t<0.0001)this.x=1,this.y=0,this.z=0;else this.x=e.x/t,this.y=e.y/t,this.z=e.z/t;return this}setAxisAngleFromRotationMatrix(e){let t,n,i,r,s=0.01,o=0.1,a=e.elements,c=a[0],l=a[4],u=a[8],f=a[1],h=a[5],d=a[9],g=a[2],x=a[6],p=a[10];if(Math.abs(l-f)<0.01&&Math.abs(u-g)<0.01&&Math.abs(d-x)<0.01){if(Math.abs(l+f)<0.1&&Math.abs(u+g)<0.1&&Math.abs(d+x)<0.1&&Math.abs(c+h+p-3)<0.1)return this.set(1,0,0,0),this;t=Math.PI;let E=(c+1)/2,R=(h+1)/2,S=(p+1)/2,b=(l+f)/4,T=(u+g)/4,A=(d+x)/4;if(E>R&&E>S)if(E<0.01)n=0,i=0.707106781,r=0.707106781;else n=Math.sqrt(E),i=b/n,r=T/n;else if(R>S)if(R<0.01)n=0.707106781,i=0,r=0.707106781;else i=Math.sqrt(R),n=b/i,r=A/i;else if(S<0.01)n=0.707106781,i=0.707106781,r=0;else r=Math.sqrt(S),n=T/r,i=A/r;return this.set(n,i,r,t),this}let m=Math.sqrt((x-d)*(x-d)+(u-g)*(u-g)+(f-l)*(f-l));if(Math.abs(m)<0.001)m=1;return this.x=(x-d)/m,this.y=(u-g)/m,this.z=(f-l)/m,this.w=Math.acos((c+h+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ze(this.x,e.x,t.x),this.y=Ze(this.y,e.y,t.y),this.z=Ze(this.z,e.z,t.z),this.w=Ze(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ze(this.x,e,t),this.y=Ze(this.y,e,t),this.z=Ze(this.z,e,t),this.w=Ze(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ze(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class lh extends Hn{constructor(e=1,t=1,n={}){super();n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new at(0,0,e,t),this.scissorTest=!1,this.viewport=new at(0,0,e,t),this.textures=[];let i={width:e,height:t,depth:n.depth},r=new Tt(i),s=n.count;for(let o=0;o<s;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:1006,generateMipmaps:!1,flipY:!1,internalFormat:null};if(e.mapping!==void 0)t.mapping=e.mapping;if(e.wrapS!==void 0)t.wrapS=e.wrapS;if(e.wrapT!==void 0)t.wrapT=e.wrapT;if(e.wrapR!==void 0)t.wrapR=e.wrapR;if(e.magFilter!==void 0)t.magFilter=e.magFilter;if(e.minFilter!==void 0)t.minFilter=e.minFilter;if(e.format!==void 0)t.format=e.format;if(e.type!==void 0)t.type=e.type;if(e.anisotropy!==void 0)t.anisotropy=e.anisotropy;if(e.colorSpace!==void 0)t.colorSpace=e.colorSpace;if(e.flipY!==void 0)t.flipY=e.flipY;if(e.generateMipmaps!==void 0)t.generateMipmaps=e.generateMipmaps;if(e.internalFormat!==void 0)t.internalFormat=e.internalFormat;for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){if(this._depthTexture!==null&&this._depthTexture.renderTarget===this)this._depthTexture.renderTarget=null;if(e!==null&&e.renderTarget===null)e.renderTarget=this;this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)if(this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isData3DTexture!==!0)this.textures[i].isArrayTexture=this.textures[i].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let i=Object.assign({},e.textures[t].image);this.textures[t].source=new ro(i)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class _n extends lh{constructor(e=1,t=1,n={}){super(e,t,n);this.isWebGLRenderTarget=!0}}class ec extends Tt{constructor(e=null,t=1,n=1,i=1){super(null);this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class uh extends Tt{constructor(e=null,t=1,n=1,i=1){super(null);this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}class Ge{static{Ge.prototype.isMatrix4=!0}constructor(e,t,n,i,r,s,o,a,c,l,u,f,h,d,g,x){if(this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0)this.set(e,t,n,i,r,s,o,a,c,l,u,f,h,d,g,x)}set(e,t,n,i,r,s,o,a,c,l,u,f,h,d,g,x){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=i,p[1]=r,p[5]=s,p[9]=o,p[13]=a,p[2]=c,p[6]=l,p[10]=u,p[14]=f,p[3]=h,p[7]=d,p[11]=g,p[15]=x,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ge().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){if(this.determinantAffine()===0)return e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this;return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,i=1/Ur.setFromMatrixColumn(e,0).length(),r=1/Ur.setFromMatrixColumn(e,1).length(),s=1/Ur.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*s,t[9]=n[9]*s,t[10]=n[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,{x:n,y:i,z:r}=e,s=Math.cos(n),o=Math.sin(n),a=Math.cos(i),c=Math.sin(i),l=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let f=s*l,h=s*u,d=o*l,g=o*u;t[0]=a*l,t[4]=-a*u,t[8]=c,t[1]=h+d*c,t[5]=f-g*c,t[9]=-o*a,t[2]=g-f*c,t[6]=d+h*c,t[10]=s*a}else if(e.order==="YXZ"){let f=a*l,h=a*u,d=c*l,g=c*u;t[0]=f+g*o,t[4]=d*o-h,t[8]=s*c,t[1]=s*u,t[5]=s*l,t[9]=-o,t[2]=h*o-d,t[6]=g+f*o,t[10]=s*a}else if(e.order==="ZXY"){let f=a*l,h=a*u,d=c*l,g=c*u;t[0]=f-g*o,t[4]=-s*u,t[8]=d+h*o,t[1]=h+d*o,t[5]=s*l,t[9]=g-f*o,t[2]=-s*c,t[6]=o,t[10]=s*a}else if(e.order==="ZYX"){let f=s*l,h=s*u,d=o*l,g=o*u;t[0]=a*l,t[4]=d*c-h,t[8]=f*c+g,t[1]=a*u,t[5]=g*c+f,t[9]=h*c-d,t[2]=-c,t[6]=o*a,t[10]=s*a}else if(e.order==="YZX"){let f=s*a,h=s*c,d=o*a,g=o*c;t[0]=a*l,t[4]=g-f*u,t[8]=d*u+h,t[1]=u,t[5]=s*l,t[9]=-o*l,t[2]=-c*l,t[6]=h*u+d,t[10]=f-g*u}else if(e.order==="XZY"){let f=s*a,h=s*c,d=o*a,g=o*c;t[0]=a*l,t[4]=-u,t[8]=c*l,t[1]=f*u+g,t[5]=s*l,t[9]=h*u-d,t[2]=d*u-h,t[6]=o*l,t[10]=g*u+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(mb,e,gb)}lookAt(e,t,n){let i=this.elements;if(pn.subVectors(e,t),pn.lengthSq()===0)pn.z=1;if(pn.normalize(),Oi.crossVectors(n,pn),Oi.lengthSq()===0){if(Math.abs(n.z)===1)pn.x+=0.0001;else pn.z+=0.0001;pn.normalize(),Oi.crossVectors(n,pn)}return Oi.normalize(),da.crossVectors(pn,Oi),i[0]=Oi.x,i[4]=da.x,i[8]=pn.x,i[1]=Oi.y,i[5]=da.y,i[9]=pn.y,i[2]=Oi.z,i[6]=da.z,i[10]=pn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,s=n[0],o=n[4],a=n[8],c=n[12],l=n[1],u=n[5],f=n[9],h=n[13],d=n[2],g=n[6],x=n[10],p=n[14],m=n[3],E=n[7],R=n[11],S=n[15],b=i[0],T=i[4],A=i[8],_=i[12],M=i[1],F=i[5],P=i[9],O=i[13],K=i[2],C=i[6],G=i[10],X=i[14],z=i[3],te=i[7],H=i[11],Q=i[15];return r[0]=s*b+o*M+a*K+c*z,r[4]=s*T+o*F+a*C+c*te,r[8]=s*A+o*P+a*G+c*H,r[12]=s*_+o*O+a*X+c*Q,r[1]=l*b+u*M+f*K+h*z,r[5]=l*T+u*F+f*C+h*te,r[9]=l*A+u*P+f*G+h*H,r[13]=l*_+u*O+f*X+h*Q,r[2]=d*b+g*M+x*K+p*z,r[6]=d*T+g*F+x*C+p*te,r[10]=d*A+g*P+x*G+p*H,r[14]=d*_+g*O+x*X+p*Q,r[3]=m*b+E*M+R*K+S*z,r[7]=m*T+E*F+R*C+S*te,r[11]=m*A+E*P+R*G+S*H,r[15]=m*_+E*O+R*X+S*Q,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],s=e[1],o=e[5],a=e[9],c=e[13],l=e[2],u=e[6],f=e[10],h=e[14],d=e[3],g=e[7],x=e[11],p=e[15],m=a*h-c*f,E=o*h-c*u,R=o*f-a*u,S=s*h-c*l,b=s*f-a*l,T=s*u-o*l;return t*(g*m-x*E+p*R)-n*(d*m-x*S+p*b)+i*(d*E-g*S+p*T)-r*(d*R-g*b+x*T)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[1],s=e[5],o=e[9],a=e[2],c=e[6],l=e[10];return t*(s*l-o*c)-n*(r*l-o*a)+i*(r*c-s*a)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;if(e.isVector3)i[12]=e.x,i[13]=e.y,i[14]=e.z;else i[12]=e,i[13]=t,i[14]=n;return this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],s=e[4],o=e[5],a=e[6],c=e[7],l=e[8],u=e[9],f=e[10],h=e[11],d=e[12],g=e[13],x=e[14],p=e[15],m=t*o-n*s,E=t*a-i*s,R=t*c-r*s,S=n*a-i*o,b=n*c-r*o,T=i*c-r*a,A=l*g-u*d,_=l*x-f*d,M=l*p-h*d,F=u*x-f*g,P=u*p-h*g,O=f*p-h*x,K=m*O-E*P+R*F+S*M-b*_+T*A;if(K===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/K;return e[0]=(o*O-a*P+c*F)*C,e[1]=(i*P-n*O-r*F)*C,e[2]=(g*T-x*b+p*S)*C,e[3]=(f*b-u*T-h*S)*C,e[4]=(a*M-s*O-c*_)*C,e[5]=(t*O-i*M+r*_)*C,e[6]=(x*R-d*T-p*E)*C,e[7]=(l*T-f*R+h*E)*C,e[8]=(s*P-o*M+c*A)*C,e[9]=(n*M-t*P-r*A)*C,e[10]=(d*b-g*R+p*m)*C,e[11]=(u*R-l*b-h*m)*C,e[12]=(o*_-s*F-a*A)*C,e[13]=(t*F-n*_+i*A)*C,e[14]=(g*E-d*S-x*m)*C,e[15]=(l*S-u*E+f*m)*C,this}scale(e){let t=this.elements,{x:n,y:i,z:r}=e;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){if(e.isVector3)this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1);else this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1);return this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),r=1-n,{x:s,y:o,z:a}=e,c=r*s,l=r*o;return this.set(c*s+n,c*o-i*a,c*a+i*o,0,c*o+i*a,l*o+n,l*a-i*s,0,c*a-i*o,l*a+i*s,r*a*a+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,s){return this.set(1,n,r,0,e,1,s,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,{_x:r,_y:s,_z:o,_w:a}=t,c=r+r,l=s+s,u=o+o,f=r*c,h=r*l,d=r*u,g=s*l,x=s*u,p=o*u,m=a*c,E=a*l,R=a*u,{x:S,y:b,z:T}=n;return i[0]=(1-(g+p))*S,i[1]=(h+R)*S,i[2]=(d-E)*S,i[3]=0,i[4]=(h-R)*b,i[5]=(1-(f+p))*b,i[6]=(x+m)*b,i[7]=0,i[8]=(d+E)*T,i[9]=(x-m)*T,i[10]=(1-(f+g))*T,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements;e.x=i[12],e.y=i[13],e.z=i[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let s=Ur.set(i[0],i[1],i[2]).length(),o=Ur.set(i[4],i[5],i[6]).length(),a=Ur.set(i[8],i[9],i[10]).length();if(r<0)s=-s;Dn.copy(this);let c=1/s,l=1/o,u=1/a;return Dn.elements[0]*=c,Dn.elements[1]*=c,Dn.elements[2]*=c,Dn.elements[4]*=l,Dn.elements[5]*=l,Dn.elements[6]*=l,Dn.elements[8]*=u,Dn.elements[9]*=u,Dn.elements[10]*=u,t.setFromRotationMatrix(Dn),n.x=s,n.y=o,n.z=a,this}makePerspective(e,t,n,i,r,s,o=2000,a=!1){let c=this.elements,l=2*r/(t-e),u=2*r/(n-i),f=(t+e)/(t-e),h=(n+i)/(n-i),d,g;if(a)d=r/(s-r),g=s*r/(s-r);else if(o===2000)d=-(s+r)/(s-r),g=-2*s*r/(s-r);else if(o===2001)d=-s/(s-r),g=-s*r/(s-r);else throw Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=l,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=u,c[9]=h,c[13]=0,c[2]=0,c[6]=0,c[10]=d,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,i,r,s,o=2000,a=!1){let c=this.elements,l=2/(t-e),u=2/(n-i),f=-(t+e)/(t-e),h=-(n+i)/(n-i),d,g;if(a)d=1/(s-r),g=s/(s-r);else if(o===2000)d=-2/(s-r),g=-(s+r)/(s-r);else if(o===2001)d=-1/(s-r),g=-r/(s-r);else throw Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=u,c[9]=0,c[13]=h,c[2]=0,c[6]=0,c[10]=d,c[14]=g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}var Ur=new U,Dn=new Ge,mb=new U(0,0,0),gb=new U(1,1,1),Oi=new U,da=new U,pn=new U,o_=new Ge,a_=new kt;class ti{constructor(e=0,t=0,n=0,i=ti.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,r=i[0],s=i[4],o=i[8],a=i[1],c=i[5],l=i[9],u=i[2],f=i[6],h=i[10];switch(t){case"XYZ":if(this._y=Math.asin(Ze(o,-1,1)),Math.abs(o)<0.9999999)this._x=Math.atan2(-l,h),this._z=Math.atan2(-s,r);else this._x=Math.atan2(f,c),this._z=0;break;case"YXZ":if(this._x=Math.asin(-Ze(l,-1,1)),Math.abs(l)<0.9999999)this._y=Math.atan2(o,h),this._z=Math.atan2(a,c);else this._y=Math.atan2(-u,r),this._z=0;break;case"ZXY":if(this._x=Math.asin(Ze(f,-1,1)),Math.abs(f)<0.9999999)this._y=Math.atan2(-u,h),this._z=Math.atan2(-s,c);else this._y=0,this._z=Math.atan2(a,r);break;case"ZYX":if(this._y=Math.asin(-Ze(u,-1,1)),Math.abs(u)<0.9999999)this._x=Math.atan2(f,h),this._z=Math.atan2(a,r);else this._x=0,this._z=Math.atan2(-s,c);break;case"YZX":if(this._z=Math.asin(Ze(a,-1,1)),Math.abs(a)<0.9999999)this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,r);else this._x=0,this._y=Math.atan2(o,h);break;case"XZY":if(this._z=Math.asin(-Ze(s,-1,1)),Math.abs(s)<0.9999999)this._x=Math.atan2(f,c),this._y=Math.atan2(o,r);else this._x=Math.atan2(-l,h),this._y=0;break;default:Ce("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}if(this._order=t,n===!0)this._onChangeCallback();return this}setFromQuaternion(e,t,n){return o_.makeRotationFromQuaternion(e),this.setFromRotationMatrix(o_,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return a_.setFromEuler(this),this.setFromQuaternion(a_,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){if(this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0)this._order=e[3];return this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ti.DEFAULT_ORDER="XYZ";class tc{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}var _b=0,c_=new U,Fr=new kt,gi=new Ge,pa=new U,Bs=new U,xb=new U,vb=new kt,l_=new U(1,0,0),u_=new U(0,1,0),h_=new U(0,0,1),f_={type:"added"},yb={type:"removed"},zr={type:"childadded",child:null},Gl={type:"childremoved",child:null};class ut extends Hn{constructor(){super();this.isObject3D=!0,Object.defineProperty(this,"id",{value:_b++}),this.uuid=zn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=ut.DEFAULT_UP.clone();let e=new U,t=new ti,n=new kt,i=new U(1,1,1);function r(){n.setFromEuler(t,!1)}function s(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Ge},normalMatrix:{value:new ze}}),this.matrix=new Ge,this.matrixWorld=new Ge,this.matrixAutoUpdate=ut.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=ut.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new tc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){if(this.matrixAutoUpdate)this.updateMatrix();this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Fr.setFromAxisAngle(e,t),this.quaternion.multiply(Fr),this}rotateOnWorldAxis(e,t){return Fr.setFromAxisAngle(e,t),this.quaternion.premultiply(Fr),this}rotateX(e){return this.rotateOnAxis(l_,e)}rotateY(e){return this.rotateOnAxis(u_,e)}rotateZ(e){return this.rotateOnAxis(h_,e)}translateOnAxis(e,t){return c_.copy(e).applyQuaternion(this.quaternion),this.position.add(c_.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(l_,e)}translateY(e){return this.translateOnAxis(u_,e)}translateZ(e){return this.translateOnAxis(h_,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(gi.copy(this.matrixWorld).invert())}lookAt(e,t,n){if(e.isVector3)pa.copy(e);else pa.set(e,t,n);let i=this.parent;if(this.updateWorldMatrix(!0,!1),Bs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight)gi.lookAt(Bs,pa,this.up);else gi.lookAt(pa,Bs,this.up);if(this.quaternion.setFromRotationMatrix(gi),i)gi.extractRotation(i.matrixWorld),Fr.setFromRotationMatrix(gi),this.quaternion.premultiply(Fr.invert())}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}if(e===this)return Ue("Object3D.add: object can't be added as a child of itself.",e),this;if(e&&e.isObject3D)e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(f_),zr.child=e,this.dispatchEvent(zr),zr.child=null;else Ue("Object3D.add: object not an instance of THREE.Object3D.",e);return this}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);if(t!==-1)e.parent=null,this.children.splice(t,1),e.dispatchEvent(yb),Gl.child=e,this.dispatchEvent(Gl),Gl.child=null;return this}removeFromParent(){let e=this.parent;if(e!==null)e.remove(this);return this}clear(){return this.remove(...this.children)}attach(e){if(this.updateWorldMatrix(!0,!1),gi.copy(this.matrixWorld).invert(),e.parent!==null)e.parent.updateWorldMatrix(!0,!1),gi.multiply(e.parent.matrixWorld);return e.applyMatrix4(gi),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(f_),zr.child=e,this.dispatchEvent(zr),zr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let s=this.children[n].getObjectByProperty(e,t);if(s!==void 0)return s}return}getObjectsByProperty(e,t,n=[]){if(this[e]===t)n.push(this);let i=this.children;for(let r=0,s=i.length;r<s;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Bs,e,xb),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Bs,vb,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;if(t!==null)e(t),t.traverseAncestors(e)}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let{x:t,y:n,z:i}=e,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*i,r[13]+=n-r[1]*t-r[5]*n-r[9]*i,r[14]+=i-r[2]*t-r[6]*n-r[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldNeedsUpdate||e){if(this.matrixWorldAutoUpdate===!0)if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);this.matrixWorldNeedsUpdate=!1,e=!0}let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let i=this.parent;if(e===!0&&i!==null)i.updateWorldMatrix(!0,!1);if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldNeedsUpdate||n){if(this.matrixWorldAutoUpdate===!0)if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);this.matrixWorldNeedsUpdate=!1,n=!0}if(t===!0){let r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==="string",n={};if(t)e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"};let i={};if(i.uuid=this.uuid,i.type=this.type,i.name=this.name,i.castShadow=this.castShadow,i.receiveShadow=this.receiveShadow,i.visible=this.visible,i.frustumCulled=this.frustumCulled,i.renderOrder=this.renderOrder,i.static=this.static,i.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0)i.userData=this.userData;if(i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null)i.pivot=this.pivot.toArray();if(this.morphTargetDictionary!==void 0)i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary);if(this.morphTargetInfluences!==void 0)i.morphTargetInfluences=this.morphTargetInfluences.slice();if(this.isInstancedMesh){if(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null)i.instanceColor=this.instanceColor.toJSON()}if(this.isBatchedMesh){if(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map((o)=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map((o)=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null)i.colorsTexture=this._colorsTexture.toJSON(e);if(this.boundingSphere!==null)i.boundingSphere=this.boundingSphere.toJSON();if(this.boundingBox!==null)i.boundingBox=this.boundingBox.toJSON()}function r(o,a){if(o[a.uuid]===void 0)o[a.uuid]=a.toJSON(e);return a.uuid}if(this.isScene){if(this.background){if(this.background.isColor)i.background=this.background.toJSON();else if(this.background.isTexture)i.background=this.background.toJSON(e).uuid}if(this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0)i.environment=this.environment.toJSON(e).uuid}else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let a=o.shapes;if(Array.isArray(a))for(let c=0,l=a.length;c<l;c++){let u=a[c];r(e.shapes,u)}else r(e.shapes,a)}}if(this.isSkinnedMesh){if(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0)r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid}if(this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let a=0,c=this.material.length;a<c;a++)o.push(r(e.materials,this.material[a]));i.material=o}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){let a=this.animations[o];i.animations.push(r(e.animations,a))}}if(t){let o=s(e.geometries),a=s(e.materials),c=s(e.textures),l=s(e.images),u=s(e.shapes),f=s(e.skeletons),h=s(e.animations),d=s(e.nodes);if(o.length>0)n.geometries=o;if(a.length>0)n.materials=a;if(c.length>0)n.textures=c;if(l.length>0)n.images=l;if(u.length>0)n.shapes=u;if(f.length>0)n.skeletons=f;if(h.length>0)n.animations=h;if(d.length>0)n.nodes=d}return n.object=i,n;function s(o){let a=[];for(let c in o){let l=o[c];delete l.metadata,a.push(l)}return a}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}ut.DEFAULT_UP=new U(0,1,0);ut.DEFAULT_MATRIX_AUTO_UPDATE=!0;ut.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Qn extends ut{constructor(){super();this.isGroup=!0,this.type="Group"}}var Sb={type:"move"};class so{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){if(this._hand===null)this._hand=new Qn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1};return this._hand}getTargetRaySpace(){if(this._targetRay===null)this._targetRay=new Qn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U;return this._targetRay}getGripSpace(){if(this._grip===null)this._grip=new Qn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U,this._grip.eventsEnabled=!1;return this._grip}dispatchEvent(e){if(this._targetRay!==null)this._targetRay.dispatchEvent(e);if(this._grip!==null)this._grip.dispatchEvent(e);if(this._hand!==null)this._hand.dispatchEvent(e);return this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){if(this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null)this._targetRay.visible=!1;if(this._grip!==null)this._grip.visible=!1;if(this._hand!==null)this._hand.visible=!1;return this}update(e,t,n){let i=null,r=null,s=null,o=this._targetRay,a=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){s=!0;for(let g of e.hand.values()){let x=t.getJointPose(g,n),p=this._getHandJoint(c,g);if(x!==null)p.matrix.fromArray(x.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=x.radius;p.visible=x!==null}let l=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=l.position.distanceTo(u.position),h=0.02,d=0.005;if(c.inputState.pinching&&f>h+d)c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this});else if(!c.inputState.pinching&&f<=h-d)c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this})}else if(a!==null&&e.gripSpace){if(r=t.getPose(e.gripSpace,n),r!==null){if(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity)a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity);else a.hasLinearVelocity=!1;if(r.angularVelocity)a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity);else a.hasAngularVelocity=!1;if(a.eventsEnabled)a.dispatchEvent({type:"gripUpdated",data:e,target:this})}}if(o!==null){if(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null)i=r;if(i!==null){if(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity)o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity);else o.hasLinearVelocity=!1;if(i.angularVelocity)o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity);else o.hasAngularVelocity=!1;this.dispatchEvent(Sb)}}}if(o!==null)o.visible=i!==null;if(a!==null)a.visible=r!==null;if(c!==null)c.visible=s!==null;return this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Qn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}var U0={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ui={h:0,s:0,l:0},ma={h:0,s:0,l:0};function Hl(e,t,n){if(n<0)n+=1;if(n>1)n-=1;if(n<0.16666666666666666)return e+(t-e)*6*n;if(n<0.5)return t;if(n<0.6666666666666666)return e+(t-e)*6*(0.6666666666666666-n);return e}class Oe{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;if(i&&i.isColor)this.copy(i);else if(typeof i==="number")this.setHex(i);else if(typeof i==="string")this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t="srgb"){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,$e.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=$e.workingColorSpace){return this.r=e,this.g=t,this.b=n,$e.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=$e.workingColorSpace){if(e=ah(e,1),t=Ze(t,0,1),n=Ze(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=0.5?n*(1+t):n+t-n*t,s=2*n-r;this.r=Hl(s,r,e+0.3333333333333333),this.g=Hl(s,r,e),this.b=Hl(s,r,e-0.3333333333333333)}return $e.colorSpaceToWorking(this,i),this}setStyle(e,t="srgb"){function n(r){if(r===void 0)return;if(parseFloat(r)<1)Ce("Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,s=i[1],o=i[2];switch(s){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Ce("Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=i[1],s=r.length;if(s===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);else if(s===6)return this.setHex(parseInt(r,16),t);else Ce("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t="srgb"){let n=U0[e.toLowerCase()];if(n!==void 0)this.setHex(n,t);else Ce("Color: Unknown color "+e);return this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=bi(e.r),this.g=bi(e.g),this.b=bi(e.b),this}copyLinearToSRGB(e){return this.r=Yr(e.r),this.g=Yr(e.g),this.b=Yr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e="srgb"){return $e.workingToColorSpace(qt.copy(this),e),Math.round(Ze(qt.r*255,0,255))*65536+Math.round(Ze(qt.g*255,0,255))*256+Math.round(Ze(qt.b*255,0,255))}getHexString(e="srgb"){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=$e.workingColorSpace){$e.workingToColorSpace(qt.copy(this),t);let{r:n,g:i,b:r}=qt,s=Math.max(n,i,r),o=Math.min(n,i,r),a,c,l=(o+s)/2;if(o===s)a=0,c=0;else{let u=s-o;switch(c=l<=0.5?u/(s+o):u/(2-s-o),s){case n:a=(i-r)/u+(i<r?6:0);break;case i:a=(r-n)/u+2;break;case r:a=(n-i)/u+4;break}a/=6}return e.h=a,e.s=c,e.l=l,e}getRGB(e,t=$e.workingColorSpace){return $e.workingToColorSpace(qt.copy(this),t),e.r=qt.r,e.g=qt.g,e.b=qt.b,e}getStyle(e="srgb"){$e.workingToColorSpace(qt.copy(this),e);let{r:t,g:n,b:i}=qt;if(e!=="srgb")return`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`;return`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(Ui),this.setHSL(Ui.h+e,Ui.s+t,Ui.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Ui),e.getHSL(ma);let n=Ys(Ui.h,ma.h,t),i=Ys(Ui.s,ma.s,t),r=Ys(Ui.l,ma.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}var qt=new Oe;Oe.NAMES=U0;class as extends ut{constructor(){super();if(this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ti,this.environmentIntensity=1,this.environmentRotation=new ti,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){if(super.copy(e,t),e.background!==null)this.background=e.background.clone();if(e.environment!==null)this.environment=e.environment.clone();if(e.fog!==null)this.fog=e.fog.clone();if(this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null)this.overrideMaterial=e.overrideMaterial.clone();return this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);if(this.fog!==null)t.object.fog=this.fog.toJSON();return t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}}var On=new U,_i=new U,Vl=new U,xi=new U,kr=new U,Br=new U,d_=new U,Wl=new U,$l=new U,Zl=new U,Xl=new at,ql=new at,Yl=new at;class En{constructor(e=new U,t=new U,n=new U){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),On.subVectors(e,t),i.cross(On);let r=i.lengthSq();if(r>0)return i.multiplyScalar(1/Math.sqrt(r));return i.set(0,0,0)}static getBarycoord(e,t,n,i,r){On.subVectors(i,t),_i.subVectors(n,t),Vl.subVectors(e,t);let s=On.dot(On),o=On.dot(_i),a=On.dot(Vl),c=_i.dot(_i),l=_i.dot(Vl),u=s*c-o*o;if(u===0)return r.set(0,0,0),null;let f=1/u,h=(c*a-o*l)*f,d=(s*l-o*a)*f;return r.set(1-h-d,d,h)}static containsPoint(e,t,n,i){if(this.getBarycoord(e,t,n,i,xi)===null)return!1;return xi.x>=0&&xi.y>=0&&xi.x+xi.y<=1}static getInterpolation(e,t,n,i,r,s,o,a){if(this.getBarycoord(e,t,n,i,xi)===null){if(a.x=0,a.y=0,"z"in a)a.z=0;if("w"in a)a.w=0;return null}return a.setScalar(0),a.addScaledVector(r,xi.x),a.addScaledVector(s,xi.y),a.addScaledVector(o,xi.z),a}static getInterpolatedAttribute(e,t,n,i,r,s){return Xl.setScalar(0),ql.setScalar(0),Yl.setScalar(0),Xl.fromBufferAttribute(e,t),ql.fromBufferAttribute(e,n),Yl.fromBufferAttribute(e,i),s.setScalar(0),s.addScaledVector(Xl,r.x),s.addScaledVector(ql,r.y),s.addScaledVector(Yl,r.z),s}static isFrontFacing(e,t,n,i){return On.subVectors(n,t),_i.subVectors(e,t),On.cross(_i).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return On.subVectors(this.c,this.b),_i.subVectors(this.a,this.b),On.cross(_i).length()*0.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(0.3333333333333333)}getNormal(e){return En.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return En.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,r){return En.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return En.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return En.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,r=this.c,s,o;kr.subVectors(i,n),Br.subVectors(r,n),Wl.subVectors(e,n);let a=kr.dot(Wl),c=Br.dot(Wl);if(a<=0&&c<=0)return t.copy(n);$l.subVectors(e,i);let l=kr.dot($l),u=Br.dot($l);if(l>=0&&u<=l)return t.copy(i);let f=a*u-l*c;if(f<=0&&a>=0&&l<=0)return s=a/(a-l),t.copy(n).addScaledVector(kr,s);Zl.subVectors(e,r);let h=kr.dot(Zl),d=Br.dot(Zl);if(d>=0&&h<=d)return t.copy(r);let g=h*c-a*d;if(g<=0&&c>=0&&d<=0)return o=c/(c-d),t.copy(n).addScaledVector(Br,o);let x=l*d-h*u;if(x<=0&&u-l>=0&&h-d>=0)return d_.subVectors(r,i),o=(u-l)/(u-l+(h-d)),t.copy(i).addScaledVector(d_,o);let p=1/(x+g+f);return s=g*p,o=f*p,t.copy(n).addScaledVector(kr,s).addScaledVector(Br,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class nn{constructor(e=new U(1/0,1/0,1/0),t=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Un.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Un.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Un.copy(t).multiplyScalar(0.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(0.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let s=0,o=r.count;s<o;s++){if(e.isMesh===!0)e.getVertexPosition(s,Un);else Un.fromBufferAttribute(r,s);Un.applyMatrix4(e.matrixWorld),this.expandByPoint(Un)}else{if(e.boundingBox!==void 0){if(e.boundingBox===null)e.computeBoundingBox();ga.copy(e.boundingBox)}else{if(n.boundingBox===null)n.computeBoundingBox();ga.copy(n.boundingBox)}ga.applyMatrix4(e.matrixWorld),this.union(ga)}}let i=e.children;for(let r=0,s=i.length;r<s;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Un),Un.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;if(e.normal.x>0)t=e.normal.x*this.min.x,n=e.normal.x*this.max.x;else t=e.normal.x*this.max.x,n=e.normal.x*this.min.x;if(e.normal.y>0)t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y;else t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y;if(e.normal.z>0)t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z;else t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z;return t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Gs),_a.subVectors(this.max,Gs),Gr.subVectors(e.a,Gs),Hr.subVectors(e.b,Gs),Vr.subVectors(e.c,Gs),Fi.subVectors(Hr,Gr),zi.subVectors(Vr,Hr),lr.subVectors(Gr,Vr);let t=[0,-Fi.z,Fi.y,0,-zi.z,zi.y,0,-lr.z,lr.y,Fi.z,0,-Fi.x,zi.z,0,-zi.x,lr.z,0,-lr.x,-Fi.y,Fi.x,0,-zi.y,zi.x,0,-lr.y,lr.x,0];if(!jl(t,Gr,Hr,Vr,_a))return!1;if(t=[1,0,0,0,1,0,0,0,1],!jl(t,Gr,Hr,Vr,_a))return!1;return xa.crossVectors(Fi,zi),t=[xa.x,xa.y,xa.z],jl(t,Gr,Hr,Vr,_a)}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Un).distanceTo(e)}getBoundingSphere(e){if(this.isEmpty())e.makeEmpty();else this.getCenter(e.center),e.radius=this.getSize(Un).length()*0.5;return e}intersect(e){if(this.min.max(e.min),this.max.min(e.max),this.isEmpty())this.makeEmpty();return this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){if(this.isEmpty())return this;return vi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),vi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),vi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),vi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),vi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),vi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),vi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),vi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(vi),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}var vi=[new U,new U,new U,new U,new U,new U,new U,new U],Un=new U,ga=new nn,Gr=new U,Hr=new U,Vr=new U,Fi=new U,zi=new U,lr=new U,Gs=new U,_a=new U,xa=new U,ur=new U;function jl(e,t,n,i,r){for(let s=0,o=e.length-3;s<=o;s+=3){ur.fromArray(e,s);let a=r.x*Math.abs(ur.x)+r.y*Math.abs(ur.y)+r.z*Math.abs(ur.z),c=t.dot(ur),l=n.dot(ur),u=i.dot(ur);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}var It=new U,va=new Ne,bb=0;class Bt extends Hn{constructor(e,t,n=!1){super();if(Array.isArray(e))throw TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:bb++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(e){if(e===!0)this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)va.fromBufferAttribute(this,t),va.applyMatrix3(e),this.setXY(t,va.x,va.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyMatrix3(e),this.setXYZ(t,It.x,It.y,It.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyMatrix4(e),this.setXYZ(t,It.x,It.y,It.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyNormalMatrix(e),this.setXYZ(t,It.x,It.y,It.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.transformDirection(e),this.setXYZ(t,It.x,It.y,It.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];if(this.normalized)n=Fn(n,this.array);return n}setComponent(e,t,n){if(this.normalized)n=ot(n,this.array);return this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];if(this.normalized)t=Fn(t,this.array);return t}setX(e,t){if(this.normalized)t=ot(t,this.array);return this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];if(this.normalized)t=Fn(t,this.array);return t}setY(e,t){if(this.normalized)t=ot(t,this.array);return this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];if(this.normalized)t=Fn(t,this.array);return t}setZ(e,t){if(this.normalized)t=ot(t,this.array);return this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];if(this.normalized)t=Fn(t,this.array);return t}setW(e,t){if(this.normalized)t=ot(t,this.array);return this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){if(e*=this.itemSize,this.normalized)t=ot(t,this.array),n=ot(n,this.array);return this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){if(e*=this.itemSize,this.normalized)t=ot(t,this.array),n=ot(n,this.array),i=ot(i,this.array);return this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){if(e*=this.itemSize,this.normalized)t=ot(t,this.array),n=ot(n,this.array),i=ot(i,this.array),r=ot(r,this.array);return this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class nc extends Bt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class ic extends Bt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class an extends Bt{constructor(e,t,n){super(new Float32Array(e),t,n)}}var Mb=new nn,Hs=new U,Kl=new U;class xn{constructor(e=new U,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;if(t!==void 0)n.copy(t);else Mb.setFromPoints(e).getCenter(n);let i=0;for(let r=0,s=e.length;r<s;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);if(t.copy(e),n>this.radius*this.radius)t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center);return t}getBoundingBox(e){if(this.isEmpty())return e.makeEmpty(),e;return e.set(this.center,this.center),e.expandByScalar(this.radius),e}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Hs.subVectors(e,this.center);let t=Hs.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=(n-this.radius)*0.5;this.center.addScaledVector(Hs,i/n),this.radius+=i}return this}union(e){if(e.isEmpty())return this;if(this.isEmpty())return this.copy(e),this;if(this.center.equals(e.center)===!0)this.radius=Math.max(this.radius,e.radius);else Kl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Hs.copy(e.center).add(Kl)),this.expandByPoint(Hs.copy(e.center).sub(Kl));return this}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}var wb=0,wn=new Ge,Jl=new ut,Wr=new U,mn=new nn,Vs=new nn,zt=new U;class jt extends Hn{constructor(){super();this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:wb++}),this.uuid=zn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){if(Array.isArray(e))this.index=new((qS(e))?ic:nc)(e,1);else this.index=e;return this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;if(t!==void 0)t.applyMatrix4(e),t.needsUpdate=!0;let n=this.attributes.normal;if(n!==void 0){let r=new ze().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;if(i!==void 0)i.transformDirection(e),i.needsUpdate=!0;if(this.boundingBox!==null)this.computeBoundingBox();if(this.boundingSphere!==null)this.computeBoundingSphere();return this._transformed=!0,this}applyQuaternion(e){return wn.makeRotationFromQuaternion(e),this.applyMatrix4(wn),this}rotateX(e){return wn.makeRotationX(e),this.applyMatrix4(wn),this}rotateY(e){return wn.makeRotationY(e),this.applyMatrix4(wn),this}rotateZ(e){return wn.makeRotationZ(e),this.applyMatrix4(wn),this}translate(e,t,n){return wn.makeTranslation(e,t,n),this.applyMatrix4(wn),this}scale(e,t,n){return wn.makeScale(e,t,n),this.applyMatrix4(wn),this}lookAt(e){return Jl.lookAt(e),Jl.updateMatrix(),this.applyMatrix4(Jl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Wr).negate(),this.translate(Wr.x,Wr.y,Wr.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let i=0,r=e.length;i<r;i++){let s=e[i];n.push(s.x,s.y,s.z||0)}this.setAttribute("position",new an(n,3))}else{let n=Math.min(e.length,t.count);for(let i=0;i<n;i++){let r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}if(e.length>t.count)Ce("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.");t.needsUpdate=!0}return this}computeBoundingBox(){if(this.boundingBox===null)this.boundingBox=new nn;let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ue("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let r=t[n];if(mn.setFromBufferAttribute(r),this.morphTargetsRelative)zt.addVectors(this.boundingBox.min,mn.min),this.boundingBox.expandByPoint(zt),zt.addVectors(this.boundingBox.max,mn.max),this.boundingBox.expandByPoint(zt);else this.boundingBox.expandByPoint(mn.min),this.boundingBox.expandByPoint(mn.max)}}else this.boundingBox.makeEmpty();if(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))Ue('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){if(this.boundingSphere===null)this.boundingSphere=new xn;let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ue("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new U,1/0);return}if(e){let n=this.boundingSphere.center;if(mn.setFromBufferAttribute(e),t)for(let r=0,s=t.length;r<s;r++){let o=t[r];if(Vs.setFromBufferAttribute(o),this.morphTargetsRelative)zt.addVectors(mn.min,Vs.min),mn.expandByPoint(zt),zt.addVectors(mn.max,Vs.max),mn.expandByPoint(zt);else mn.expandByPoint(Vs.min),mn.expandByPoint(Vs.max)}mn.getCenter(n);let i=0;for(let r=0,s=e.count;r<s;r++)zt.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(zt));if(t)for(let r=0,s=t.length;r<s;r++){let o=t[r],a=this.morphTargetsRelative;for(let c=0,l=o.count;c<l;c++){if(zt.fromBufferAttribute(o,c),a)Wr.fromBufferAttribute(e,c),zt.add(Wr);i=Math.max(i,n.distanceToSquared(zt))}}if(this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius))Ue('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Ue("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let{position:n,normal:i,uv:r}=t,s=this.getAttribute("tangent");if(s===void 0||s.count!==n.count)s=new Bt(new Float32Array(4*n.count),4),this.setAttribute("tangent",s);let o=[],a=[];for(let A=0;A<n.count;A++)o[A]=new U,a[A]=new U;let c=new U,l=new U,u=new U,f=new Ne,h=new Ne,d=new Ne,g=new U,x=new U;function p(A,_,M){c.fromBufferAttribute(n,A),l.fromBufferAttribute(n,_),u.fromBufferAttribute(n,M),f.fromBufferAttribute(r,A),h.fromBufferAttribute(r,_),d.fromBufferAttribute(r,M),l.sub(c),u.sub(c),h.sub(f),d.sub(f);let F=1/(h.x*d.y-d.x*h.y);if(!isFinite(F))return;g.copy(l).multiplyScalar(d.y).addScaledVector(u,-h.y).multiplyScalar(F),x.copy(u).multiplyScalar(h.x).addScaledVector(l,-d.x).multiplyScalar(F),o[A].add(g),o[_].add(g),o[M].add(g),a[A].add(x),a[_].add(x),a[M].add(x)}let m=this.groups;if(m.length===0)m=[{start:0,count:e.count}];for(let A=0,_=m.length;A<_;++A){let M=m[A],{start:F,count:P}=M;for(let O=F,K=F+P;O<K;O+=3)p(e.getX(O+0),e.getX(O+1),e.getX(O+2))}let E=new U,R=new U,S=new U,b=new U;function T(A){S.fromBufferAttribute(i,A),b.copy(S);let _=o[A];E.copy(_),E.sub(S.multiplyScalar(S.dot(_))).normalize(),R.crossVectors(b,_);let F=R.dot(a[A])<0?-1:1;s.setXYZW(A,E.x,E.y,E.z,F)}for(let A=0,_=m.length;A<_;++A){let M=m[A],{start:F,count:P}=M;for(let O=F,K=F+P;O<K;O+=3)T(e.getX(O+0)),T(e.getX(O+1)),T(e.getX(O+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new Bt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,h=n.count;f<h;f++)n.setXYZ(f,0,0,0);let i=new U,r=new U,s=new U,o=new U,a=new U,c=new U,l=new U,u=new U;if(e)for(let f=0,h=e.count;f<h;f+=3){let d=e.getX(f+0),g=e.getX(f+1),x=e.getX(f+2);i.fromBufferAttribute(t,d),r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,x),l.subVectors(s,r),u.subVectors(i,r),l.cross(u),o.fromBufferAttribute(n,d),a.fromBufferAttribute(n,g),c.fromBufferAttribute(n,x),o.add(l),a.add(l),c.add(l),n.setXYZ(d,o.x,o.y,o.z),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(x,c.x,c.y,c.z)}else for(let f=0,h=t.count;f<h;f+=3)i.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),s.fromBufferAttribute(t,f+2),l.subVectors(s,r),u.subVectors(i,r),l.cross(u),n.setXYZ(f+0,l.x,l.y,l.z),n.setXYZ(f+1,l.x,l.y,l.z),n.setXYZ(f+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)zt.fromBufferAttribute(e,t),zt.normalize(),e.setXYZ(t,zt.x,zt.y,zt.z)}toNonIndexed(){function e(o,a){let{array:c,itemSize:l,normalized:u}=o,f=new c.constructor(a.length*l),h=0,d=0;for(let g=0,x=a.length;g<x;g++){if(o.isInterleavedBufferAttribute)h=a[g]*o.data.stride+o.offset;else h=a[g]*l;for(let p=0;p<l;p++)f[d++]=c[h++]}return new Bt(f,l,u)}if(this.index===null)return Ce("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new jt,n=this.index.array,i=this.attributes;for(let o in i){let a=i[o],c=e(a,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let a=[],c=r[o];for(let l=0,u=c.length;l<u;l++){let f=c[l],h=e(f,n);a.push(h)}t.morphAttributes[o]=a}t.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;for(let o=0,a=s.length;o<a;o++){let c=s[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0)e.userData=this.userData;if(this.parameters!==void 0&&this._transformed!==!0){let a=this.parameters;for(let c in a)if(a[c]!==void 0)e[c]=a[c];return e}e.data={attributes:{}};let t=this.index;if(t!==null)e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)};let n=this.attributes;for(let a in n){let c=n[a];e.data.attributes[a]=c.toJSON(e.data)}let i={},r=!1;for(let a in this.morphAttributes){let c=this.morphAttributes[a],l=[];for(let u=0,f=c.length;u<f;u++){let h=c[u];l.push(h.toJSON(e.data))}if(l.length>0)i[a]=l,r=!0}if(r)e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;if(s.length>0)e.data.groups=JSON.parse(JSON.stringify(s));let o=this.boundingSphere;if(o!==null)e.data.boundingSphere=o.toJSON();return e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;if(n!==null)this.setIndex(n.clone());let i=e.attributes;for(let c in i){let l=i[c];this.setAttribute(c,l.clone(t))}let r=e.morphAttributes;for(let c in r){let l=[],u=r[c];for(let f=0,h=u.length;f<h;f++)l.push(u[f].clone(t));this.morphAttributes[c]=l}this.morphTargetsRelative=e.morphTargetsRelative;let s=e.groups;for(let c=0,l=s.length;c<l;c++){let u=s[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;if(o!==null)this.boundingBox=o.clone();let a=e.boundingSphere;if(a!==null)this.boundingSphere=a.clone();return this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class oo{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=35044,this.updateRanges=[],this.version=0,this.uuid=zn()}onUploadCallback(){}set needsUpdate(e){if(e===!0)this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,r=this.stride;i<r;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){if(e.arrayBuffers===void 0)e.arrayBuffers={};if(this.array.buffer._uuid===void 0)this.array.buffer._uuid=zn();if(e.arrayBuffers[this.array.buffer._uuid]===void 0)e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer;let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){if(e.arrayBuffers===void 0)e.arrayBuffers={};if(this.array.buffer._uuid===void 0)this.array.buffer._uuid=zn();if(e.arrayBuffers[this.array.buffer._uuid]===void 0)e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}}var tn=new U;class cs{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)tn.fromBufferAttribute(this,t),tn.applyMatrix4(e),this.setXYZ(t,tn.x,tn.y,tn.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)tn.fromBufferAttribute(this,t),tn.applyNormalMatrix(e),this.setXYZ(t,tn.x,tn.y,tn.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)tn.fromBufferAttribute(this,t),tn.transformDirection(e),this.setXYZ(t,tn.x,tn.y,tn.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];if(this.normalized)n=Fn(n,this.array);return n}setComponent(e,t,n){if(this.normalized)n=ot(n,this.array);return this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){if(this.normalized)t=ot(t,this.array);return this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){if(this.normalized)t=ot(t,this.array);return this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){if(this.normalized)t=ot(t,this.array);return this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){if(this.normalized)t=ot(t,this.array);return this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];if(this.normalized)t=Fn(t,this.array);return t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];if(this.normalized)t=Fn(t,this.array);return t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];if(this.normalized)t=Fn(t,this.array);return t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];if(this.normalized)t=Fn(t,this.array);return t}setXY(e,t,n){if(e=e*this.data.stride+this.offset,this.normalized)t=ot(t,this.array),n=ot(n,this.array);return this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){if(e=e*this.data.stride+this.offset,this.normalized)t=ot(t,this.array),n=ot(n,this.array),i=ot(i,this.array);return this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,r){if(e=e*this.data.stride+this.offset,this.normalized)t=ot(t,this.array),n=ot(n,this.array),i=ot(i,this.array),r=ot(r,this.array);return this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=r,this}clone(e){if(e===void 0){js("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return new Bt(new this.array.constructor(t),this.itemSize,this.normalized)}else{if(e.interleavedBuffers===void 0)e.interleavedBuffers={};if(e.interleavedBuffers[this.data.uuid]===void 0)e.interleavedBuffers[this.data.uuid]=this.data.clone(e);return new cs(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}}toJSON(e){if(e===void 0){js("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else{if(e.interleavedBuffers===void 0)e.interleavedBuffers={};if(e.interleavedBuffers[this.data.uuid]===void 0)e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e);return{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}}var Ql=new U,Tb=new U,Eb=new ze;class Tn{constructor(e=new U(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=Ql.subVectors(n,t).cross(Tb.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let i=e.delta(Ql),r=this.normal.dot(i);if(r===0){if(this.distanceToPoint(e.start)===0)return t.copy(e.start);return null}let s=-(e.start.dot(this.normal)+this.constant)/r;if(n===!0&&(s<0||s>1))return null;return t.copy(e.start).addScaledVector(i,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Eb.getNormalMatrix(e),i=this.coplanarPoint(Ql).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}var Ab=0;class cn extends Hn{constructor(){super();this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ab++}),this.uuid=zn(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Oe(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){if(this._alphaTest>0!==e>0)this.version++;this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e===void 0)return;for(let t in e){let n=e[t];if(n===void 0){Ce(`Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){Ce(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}if(i&&i.isColor)i.set(n);else if(i&&i.isVector2&&(n&&n.isVector2)||i&&i.isEuler&&(n&&n.isEuler)||i&&i.isVector3&&(n&&n.isVector3))i.copy(n);else this[t]=n}}toJSON(e){let t=e===void 0||typeof e==="string";if(t)e={textures:{},images:{}};let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};if(n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor)n.color=this.color.getHex();if(this.roughness!==void 0)n.roughness=this.roughness;if(this.metalness!==void 0)n.metalness=this.metalness;if(this.sheen!==void 0)n.sheen=this.sheen;if(this.sheenColor&&this.sheenColor.isColor)n.sheenColor=this.sheenColor.getHex();if(this.sheenRoughness!==void 0)n.sheenRoughness=this.sheenRoughness;if(this.emissive&&this.emissive.isColor)n.emissive=this.emissive.getHex();if(this.emissiveIntensity!==void 0)n.emissiveIntensity=this.emissiveIntensity;if(this.specular&&this.specular.isColor)n.specular=this.specular.getHex();if(this.specularIntensity!==void 0)n.specularIntensity=this.specularIntensity;if(this.specularColor&&this.specularColor.isColor)n.specularColor=this.specularColor.getHex();if(this.shininess!==void 0)n.shininess=this.shininess;if(this.clearcoat!==void 0)n.clearcoat=this.clearcoat;if(this.clearcoatRoughness!==void 0)n.clearcoatRoughness=this.clearcoatRoughness;if(this.clearcoatMap&&this.clearcoatMap.isTexture)n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid;if(this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture)n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid;if(this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture)n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray();if(this.sheenColorMap&&this.sheenColorMap.isTexture)n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid;if(this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture)n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid;if(this.dispersion!==void 0)n.dispersion=this.dispersion;if(this.retroreflectivity!==void 0)n.retroreflectivity=this.retroreflectivity;if(this.iridescence!==void 0)n.iridescence=this.iridescence;if(this.iridescenceIOR!==void 0)n.iridescenceIOR=this.iridescenceIOR;if(this.iridescenceThicknessRange!==void 0)n.iridescenceThicknessRange=this.iridescenceThicknessRange;if(this.iridescenceMap&&this.iridescenceMap.isTexture)n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid;if(this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture)n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid;if(this.anisotropy!==void 0)n.anisotropy=this.anisotropy;if(this.anisotropyRotation!==void 0)n.anisotropyRotation=this.anisotropyRotation;if(this.anisotropyMap&&this.anisotropyMap.isTexture)n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid;if(this.map&&this.map.isTexture)n.map=this.map.toJSON(e).uuid;if(this.matcap&&this.matcap.isTexture)n.matcap=this.matcap.toJSON(e).uuid;if(this.alphaMap&&this.alphaMap.isTexture)n.alphaMap=this.alphaMap.toJSON(e).uuid;if(this.lightMap&&this.lightMap.isTexture)n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity;if(this.aoMap&&this.aoMap.isTexture)n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity;if(this.bumpMap&&this.bumpMap.isTexture)n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale;if(this.normalMap&&this.normalMap.isTexture)n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray();if(this.displacementMap&&this.displacementMap.isTexture)n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias;if(this.roughnessMap&&this.roughnessMap.isTexture)n.roughnessMap=this.roughnessMap.toJSON(e).uuid;if(this.metalnessMap&&this.metalnessMap.isTexture)n.metalnessMap=this.metalnessMap.toJSON(e).uuid;if(this.emissiveMap&&this.emissiveMap.isTexture)n.emissiveMap=this.emissiveMap.toJSON(e).uuid;if(this.specularMap&&this.specularMap.isTexture)n.specularMap=this.specularMap.toJSON(e).uuid;if(this.specularIntensityMap&&this.specularIntensityMap.isTexture)n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid;if(this.specularColorMap&&this.specularColorMap.isTexture)n.specularColorMap=this.specularColorMap.toJSON(e).uuid;if(this.envMap&&this.envMap.isTexture){if(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0)n.combine=this.combine}if(this.envMapRotation!==void 0)n.envMapRotation=this.envMapRotation.toArray();if(this.envMapIntensity!==void 0)n.envMapIntensity=this.envMapIntensity;if(this.reflectivity!==void 0)n.reflectivity=this.reflectivity;if(this.refractionRatio!==void 0)n.refractionRatio=this.refractionRatio;if(this.gradientMap&&this.gradientMap.isTexture)n.gradientMap=this.gradientMap.toJSON(e).uuid;if(this.transmission!==void 0)n.transmission=this.transmission;if(this.transmissionMap&&this.transmissionMap.isTexture)n.transmissionMap=this.transmissionMap.toJSON(e).uuid;if(this.thickness!==void 0)n.thickness=this.thickness;if(this.thicknessMap&&this.thicknessMap.isTexture)n.thicknessMap=this.thicknessMap.toJSON(e).uuid;if(this.attenuationDistance!==void 0)n.attenuationDistance=this.attenuationDistance;if(this.attenuationColor!==void 0)n.attenuationColor=this.attenuationColor.getHex();if(this.size!==void 0)n.size=this.size;if(this.sizeAttenuation!==void 0)n.sizeAttenuation=this.sizeAttenuation;if(Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0)n.clippingPlanes=this.clippingPlanes.map((r)=>r.toJSON());if(this.rotation!==void 0)n.rotation=this.rotation;if(this.depthPacking!==void 0)n.depthPacking=this.depthPacking;if(this.linewidth!==void 0)n.linewidth=this.linewidth;if(this.linecap!==void 0)n.linecap=this.linecap;if(this.linejoin!==void 0)n.linejoin=this.linejoin;if(this.dashSize!==void 0)n.dashSize=this.dashSize;if(this.gapSize!==void 0)n.gapSize=this.gapSize;if(this.scale!==void 0)n.scale=this.scale;if(this.wireframe!==void 0)n.wireframe=this.wireframe;if(this.wireframeLinewidth!==void 0)n.wireframeLinewidth=this.wireframeLinewidth;if(this.wireframeLinecap!==void 0)n.wireframeLinecap=this.wireframeLinecap;if(this.wireframeLinejoin!==void 0)n.wireframeLinejoin=this.wireframeLinejoin;if(this.flatShading!==void 0)n.flatShading=this.flatShading;if(this.fog!==void 0)n.fog=this.fog;if(Object.keys(this.userData).length>0)n.userData=this.userData;function i(r){let s=[];for(let o in r){let a=r[o];delete a.metadata,s.push(a)}return s}if(t){let r=i(e.textures),s=i(e.images);if(r.length>0)n.textures=r;if(s.length>0)n.images=s}return n}fromJSON(e,t){if(e.uuid!==void 0)this.uuid=e.uuid;if(e.name!==void 0)this.name=e.name;if(e.color!==void 0&&this.color!==void 0)this.color.setHex(e.color);if(e.roughness!==void 0)this.roughness=e.roughness;if(e.metalness!==void 0)this.metalness=e.metalness;if(e.sheen!==void 0)this.sheen=e.sheen;if(e.sheenColor!==void 0)this.sheenColor=new Oe().setHex(e.sheenColor);if(e.sheenRoughness!==void 0)this.sheenRoughness=e.sheenRoughness;if(e.emissive!==void 0&&this.emissive!==void 0)this.emissive.setHex(e.emissive);if(e.specular!==void 0&&this.specular!==void 0)this.specular.setHex(e.specular);if(e.specularIntensity!==void 0)this.specularIntensity=e.specularIntensity;if(e.specularColor!==void 0&&this.specularColor!==void 0)this.specularColor.setHex(e.specularColor);if(e.shininess!==void 0)this.shininess=e.shininess;if(e.clearcoat!==void 0)this.clearcoat=e.clearcoat;if(e.clearcoatRoughness!==void 0)this.clearcoatRoughness=e.clearcoatRoughness;if(e.dispersion!==void 0)this.dispersion=e.dispersion;if(e.retroreflectivity!==void 0)this.retroreflectivity=e.retroreflectivity;if(e.iridescence!==void 0)this.iridescence=e.iridescence;if(e.iridescenceIOR!==void 0)this.iridescenceIOR=e.iridescenceIOR;if(e.iridescenceThicknessRange!==void 0)this.iridescenceThicknessRange=e.iridescenceThicknessRange;if(e.transmission!==void 0)this.transmission=e.transmission;if(e.thickness!==void 0)this.thickness=e.thickness;if(e.attenuationDistance!==void 0)this.attenuationDistance=e.attenuationDistance;if(e.attenuationColor!==void 0&&this.attenuationColor!==void 0)this.attenuationColor.setHex(e.attenuationColor);if(e.anisotropy!==void 0)this.anisotropy=e.anisotropy;if(e.anisotropyRotation!==void 0)this.anisotropyRotation=e.anisotropyRotation;if(e.fog!==void 0)this.fog=e.fog;if(e.flatShading!==void 0)this.flatShading=e.flatShading;if(e.blending!==void 0)this.blending=e.blending;if(e.combine!==void 0)this.combine=e.combine;if(e.side!==void 0)this.side=e.side;if(e.shadowSide!==void 0)this.shadowSide=e.shadowSide;if(e.opacity!==void 0)this.opacity=e.opacity;if(e.transparent!==void 0)this.transparent=e.transparent;if(e.alphaTest!==void 0)this.alphaTest=e.alphaTest;if(e.alphaHash!==void 0)this.alphaHash=e.alphaHash;if(e.depthFunc!==void 0)this.depthFunc=e.depthFunc;if(e.depthTest!==void 0)this.depthTest=e.depthTest;if(e.depthWrite!==void 0)this.depthWrite=e.depthWrite;if(e.colorWrite!==void 0)this.colorWrite=e.colorWrite;if(e.clippingPlanes!==void 0)this.clippingPlanes=e.clippingPlanes.map((n)=>new Tn().fromJSON(n));if(e.clipIntersection!==void 0)this.clipIntersection=e.clipIntersection;if(e.clipShadows!==void 0)this.clipShadows=e.clipShadows;if(e.depthPacking!==void 0)this.depthPacking=e.depthPacking;if(e.blendSrc!==void 0)this.blendSrc=e.blendSrc;if(e.blendDst!==void 0)this.blendDst=e.blendDst;if(e.blendEquation!==void 0)this.blendEquation=e.blendEquation;if(e.blendSrcAlpha!==void 0)this.blendSrcAlpha=e.blendSrcAlpha;if(e.blendDstAlpha!==void 0)this.blendDstAlpha=e.blendDstAlpha;if(e.blendEquationAlpha!==void 0)this.blendEquationAlpha=e.blendEquationAlpha;if(e.blendColor!==void 0&&this.blendColor!==void 0)this.blendColor.setHex(e.blendColor);if(e.blendAlpha!==void 0)this.blendAlpha=e.blendAlpha;if(e.stencilWriteMask!==void 0)this.stencilWriteMask=e.stencilWriteMask;if(e.stencilFunc!==void 0)this.stencilFunc=e.stencilFunc;if(e.stencilRef!==void 0)this.stencilRef=e.stencilRef;if(e.stencilFuncMask!==void 0)this.stencilFuncMask=e.stencilFuncMask;if(e.stencilFail!==void 0)this.stencilFail=e.stencilFail;if(e.stencilZFail!==void 0)this.stencilZFail=e.stencilZFail;if(e.stencilZPass!==void 0)this.stencilZPass=e.stencilZPass;if(e.stencilWrite!==void 0)this.stencilWrite=e.stencilWrite;if(e.wireframe!==void 0)this.wireframe=e.wireframe;if(e.wireframeLinewidth!==void 0)this.wireframeLinewidth=e.wireframeLinewidth;if(e.wireframeLinecap!==void 0)this.wireframeLinecap=e.wireframeLinecap;if(e.wireframeLinejoin!==void 0)this.wireframeLinejoin=e.wireframeLinejoin;if(e.rotation!==void 0)this.rotation=e.rotation;if(e.linewidth!==void 0)this.linewidth=e.linewidth;if(e.linecap!==void 0)this.linecap=e.linecap;if(e.linejoin!==void 0)this.linejoin=e.linejoin;if(e.dashSize!==void 0)this.dashSize=e.dashSize;if(e.gapSize!==void 0)this.gapSize=e.gapSize;if(e.scale!==void 0)this.scale=e.scale;if(e.polygonOffset!==void 0)this.polygonOffset=e.polygonOffset;if(e.polygonOffsetFactor!==void 0)this.polygonOffsetFactor=e.polygonOffsetFactor;if(e.polygonOffsetUnits!==void 0)this.polygonOffsetUnits=e.polygonOffsetUnits;if(e.dithering!==void 0)this.dithering=e.dithering;if(e.alphaToCoverage!==void 0)this.alphaToCoverage=e.alphaToCoverage;if(e.premultipliedAlpha!==void 0)this.premultipliedAlpha=e.premultipliedAlpha;if(e.forceSinglePass!==void 0)this.forceSinglePass=e.forceSinglePass;if(e.allowOverride!==void 0)this.allowOverride=e.allowOverride;if(e.visible!==void 0)this.visible=e.visible;if(e.toneMapped!==void 0)this.toneMapped=e.toneMapped;if(e.userData!==void 0)this.userData=e.userData;if(e.vertexColors!==void 0)if(typeof e.vertexColors==="number")this.vertexColors=e.vertexColors>0;else this.vertexColors=e.vertexColors;if(e.size!==void 0)this.size=e.size;if(e.sizeAttenuation!==void 0)this.sizeAttenuation=e.sizeAttenuation;if(e.map!==void 0)this.map=t[e.map]||null;if(e.matcap!==void 0)this.matcap=t[e.matcap]||null;if(e.alphaMap!==void 0)this.alphaMap=t[e.alphaMap]||null;if(e.bumpMap!==void 0)this.bumpMap=t[e.bumpMap]||null;if(e.bumpScale!==void 0)this.bumpScale=e.bumpScale;if(e.normalMap!==void 0)this.normalMap=t[e.normalMap]||null;if(e.normalMapType!==void 0)this.normalMapType=e.normalMapType;if(e.normalScale!==void 0){let n=e.normalScale;if(Array.isArray(n)===!1)n=[n,n];this.normalScale=new Ne().fromArray(n)}if(e.displacementMap!==void 0)this.displacementMap=t[e.displacementMap]||null;if(e.displacementScale!==void 0)this.displacementScale=e.displacementScale;if(e.displacementBias!==void 0)this.displacementBias=e.displacementBias;if(e.roughnessMap!==void 0)this.roughnessMap=t[e.roughnessMap]||null;if(e.metalnessMap!==void 0)this.metalnessMap=t[e.metalnessMap]||null;if(e.emissiveMap!==void 0)this.emissiveMap=t[e.emissiveMap]||null;if(e.emissiveIntensity!==void 0)this.emissiveIntensity=e.emissiveIntensity;if(e.specularMap!==void 0)this.specularMap=t[e.specularMap]||null;if(e.specularIntensityMap!==void 0)this.specularIntensityMap=t[e.specularIntensityMap]||null;if(e.specularColorMap!==void 0)this.specularColorMap=t[e.specularColorMap]||null;if(e.envMap!==void 0)this.envMap=t[e.envMap]||null;if(e.envMapRotation!==void 0)this.envMapRotation.fromArray(e.envMapRotation);if(e.envMapIntensity!==void 0)this.envMapIntensity=e.envMapIntensity;if(e.reflectivity!==void 0)this.reflectivity=e.reflectivity;if(e.refractionRatio!==void 0)this.refractionRatio=e.refractionRatio;if(e.lightMap!==void 0)this.lightMap=t[e.lightMap]||null;if(e.lightMapIntensity!==void 0)this.lightMapIntensity=e.lightMapIntensity;if(e.aoMap!==void 0)this.aoMap=t[e.aoMap]||null;if(e.aoMapIntensity!==void 0)this.aoMapIntensity=e.aoMapIntensity;if(e.gradientMap!==void 0)this.gradientMap=t[e.gradientMap]||null;if(e.clearcoatMap!==void 0)this.clearcoatMap=t[e.clearcoatMap]||null;if(e.clearcoatRoughnessMap!==void 0)this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null;if(e.clearcoatNormalMap!==void 0)this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null;if(e.clearcoatNormalScale!==void 0)this.clearcoatNormalScale=new Ne().fromArray(e.clearcoatNormalScale);if(e.iridescenceMap!==void 0)this.iridescenceMap=t[e.iridescenceMap]||null;if(e.iridescenceThicknessMap!==void 0)this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null;if(e.transmissionMap!==void 0)this.transmissionMap=t[e.transmissionMap]||null;if(e.thicknessMap!==void 0)this.thicknessMap=t[e.thicknessMap]||null;if(e.anisotropyMap!==void 0)this.anisotropyMap=t[e.anisotropyMap]||null;if(e.sheenColorMap!==void 0)this.sheenColorMap=t[e.sheenColorMap]||null;if(e.sheenRoughnessMap!==void 0)this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null;return this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){if(e===!0)this.version++}}var yi=new U,eu=new U,ya=new U,Sa=new U;class Xi{constructor(e=new U,t=new U(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,yi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);if(n<0)return t.copy(this.origin);return t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=yi.subVectors(e,this.origin).dot(this.direction);if(t<0)return this.origin.distanceToSquared(e);return yi.copy(this.origin).addScaledVector(this.direction,t),yi.distanceToSquared(e)}distanceSqToSegment(e,t,n,i){eu.copy(e).add(t).multiplyScalar(0.5),ya.copy(t).sub(e).normalize(),Sa.copy(this.origin).sub(eu);let r=e.distanceTo(t)*0.5,s=-this.direction.dot(ya),o=Sa.dot(this.direction),a=-Sa.dot(ya),c=Sa.lengthSq(),l=Math.abs(1-s*s),u,f,h,d;if(l>0)if(u=s*a-o,f=s*o-a,d=r*l,u>=0)if(f>=-d)if(f<=d){let g=1/l;u*=g,f*=g,h=u*(u+s*f+2*o)+f*(s*u+f+2*a)+c}else f=r,u=Math.max(0,-(s*f+o)),h=-u*u+f*(f+2*a)+c;else f=-r,u=Math.max(0,-(s*f+o)),h=-u*u+f*(f+2*a)+c;else if(f<=-d)u=Math.max(0,-(-s*r+o)),f=u>0?-r:Math.min(Math.max(-r,-a),r),h=-u*u+f*(f+2*a)+c;else if(f<=d)u=0,f=Math.min(Math.max(-r,-a),r),h=f*(f+2*a)+c;else u=Math.max(0,-(s*r+o)),f=u>0?r:Math.min(Math.max(-r,-a),r),h=-u*u+f*(f+2*a)+c;else f=s>0?-r:r,u=Math.max(0,-(s*f+o)),h=-u*u+f*(f+2*a)+c;if(n)n.copy(this.origin).addScaledVector(this.direction,u);if(i)i.copy(eu).addScaledVector(ya,f);return h}intersectSphere(e,t){if(e.radius<0)return null;yi.subVectors(e.center,this.origin);let n=yi.dot(this.direction),i=yi.dot(yi)-n*n,r=e.radius*e.radius;if(i>r)return null;let s=Math.sqrt(r-i),o=n-s,a=n+s;if(a<0)return null;if(o<0)return this.at(a,t);return this.at(o,t)}intersectsSphere(e){if(e.radius<0)return!1;return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0){if(e.distanceToPoint(this.origin)===0)return 0;return null}let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);if(n===null)return null;return this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);if(t===0)return!0;if(e.normal.dot(this.direction)*t<0)return!0;return!1}intersectBox(e,t){let n,i,r,s,o,a,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,f=this.origin;if(c>=0)n=(e.min.x-f.x)*c,i=(e.max.x-f.x)*c;else n=(e.max.x-f.x)*c,i=(e.min.x-f.x)*c;if(l>=0)r=(e.min.y-f.y)*l,s=(e.max.y-f.y)*l;else r=(e.max.y-f.y)*l,s=(e.min.y-f.y)*l;if(n>s||r>i)return null;if(r>n||isNaN(n))n=r;if(s<i||isNaN(i))i=s;if(u>=0)o=(e.min.z-f.z)*u,a=(e.max.z-f.z)*u;else o=(e.max.z-f.z)*u,a=(e.min.z-f.z)*u;if(n>a||o>i)return null;if(o>n||n!==n)n=o;if(a<i||i!==i)i=a;if(i<0)return null;return this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,yi)!==null}intersectTriangle(e,t,n,i,r){let s=this.origin,o=this.direction,{x:a,y:c,z:l}=o,u=e.x-s.x,f=e.y-s.y,h=e.z-s.z,d=t.x-s.x,g=t.y-s.y,x=t.z-s.z,p=n.x-s.x,m=n.y-s.y,E=n.z-s.z,R=Math.abs(a),S=Math.abs(c),b=Math.abs(l),T,A,_,M,F,P,O,K,C,G,X,z;if(R>=S&&R>=b)if(_=a,P=u,C=d,z=p,a>=0)T=c,A=l,M=f,F=h,O=g,K=x,G=m,X=E;else T=l,A=c,M=h,F=f,O=x,K=g,G=E,X=m;else if(S>=b)if(_=c,P=f,C=g,z=m,c>=0)T=l,A=a,M=h,F=u,O=x,K=d,G=E,X=p;else T=a,A=l,M=u,F=h,O=d,K=x,G=p,X=E;else if(_=l,P=h,C=x,z=E,l>=0)T=a,A=c,M=u,F=f,O=d,K=g,G=p,X=m;else T=c,A=a,M=f,F=u,O=g,K=d,G=m,X=p;if(_===0)return null;let te=T/_,H=A/_,Q=1/_,ee=M-te*P,Te=F-H*P,ve=O-te*C,He=K-H*C,Me=G-te*z,Z=X-H*z,re=Me*He-Z*ve,se=ee*Z-Te*Me,Pe=ve*Te-He*ee;if(i){if(re<0||se<0||Pe<0)return null}else if((re<0||se<0||Pe<0)&&(re>0||se>0||Pe>0))return null;let Ie=re+se+Pe;if(Ie===0)return null;let we=Q*(re*P+se*C+Pe*z);if(Ie>0?we<0:we>0)return null;return this.at(we/Ie,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class oi extends cn{constructor(e){super();this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Oe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ti,this.combine=0,this.reflectivity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}var p_=new Ge,hr=new Xi,ba=new xn,m_=new U,Ma=new U,wa=new U,Ta=new U,tu=new U,Ea=new U,g_=new U,Aa=new U;class mt extends ut{constructor(e=new jt,t=new oi){super();this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){if(super.copy(e,t),e.morphTargetInfluences!==void 0)this.morphTargetInfluences=e.morphTargetInfluences.slice();if(e.morphTargetDictionary!==void 0)this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary);return this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,s=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let o=this.morphTargetInfluences;if(r&&o){Ea.set(0,0,0);for(let a=0,c=r.length;a<c;a++){let l=o[a],u=r[a];if(l===0)continue;if(tu.fromBufferAttribute(u,e),s)Ea.addScaledVector(tu,l);else Ea.addScaledVector(tu.sub(t),l)}t.add(Ea)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,i=this.material,r=this.matrixWorld;if(i===void 0)return;if(n.boundingSphere===null)n.computeBoundingSphere();if(ba.copy(n.boundingSphere),ba.applyMatrix4(r),hr.copy(e.ray).recast(e.near),ba.containsPoint(hr.origin)===!1){if(hr.intersectSphere(ba,m_)===null)return;if(hr.origin.distanceToSquared(m_)>(e.far-e.near)**2)return}if(p_.copy(r).invert(),hr.copy(e.ray).applyMatrix4(p_),n.boundingBox!==null){if(hr.intersectsBox(n.boundingBox)===!1)return}this._computeIntersections(e,t,hr)}_computeIntersections(e,t,n){let i,r=this.geometry,s=this.material,o=r.index,a=r.attributes.position,c=r.attributes.uv,l=r.attributes.uv1,u=r.attributes.normal,{groups:f,drawRange:h}=r;if(o!==null)if(Array.isArray(s))for(let d=0,g=f.length;d<g;d++){let x=f[d],p=s[x.materialIndex],m=Math.max(x.start,h.start),E=Math.min(o.count,Math.min(x.start+x.count,h.start+h.count));for(let R=m,S=E;R<S;R+=3){let b=o.getX(R),T=o.getX(R+1),A=o.getX(R+2);if(i=Ra(this,p,e,n,c,l,u,b,T,A),i)i.faceIndex=Math.floor(R/3),i.face.materialIndex=x.materialIndex,t.push(i)}}else{let d=Math.max(0,h.start),g=Math.min(o.count,h.start+h.count);for(let x=d,p=g;x<p;x+=3){let m=o.getX(x),E=o.getX(x+1),R=o.getX(x+2);if(i=Ra(this,s,e,n,c,l,u,m,E,R),i)i.faceIndex=Math.floor(x/3),t.push(i)}}else if(a!==void 0)if(Array.isArray(s))for(let d=0,g=f.length;d<g;d++){let x=f[d],p=s[x.materialIndex],m=Math.max(x.start,h.start),E=Math.min(a.count,Math.min(x.start+x.count,h.start+h.count));for(let R=m,S=E;R<S;R+=3){let b=R,T=R+1,A=R+2;if(i=Ra(this,p,e,n,c,l,u,b,T,A),i)i.faceIndex=Math.floor(R/3),i.face.materialIndex=x.materialIndex,t.push(i)}}else{let d=Math.max(0,h.start),g=Math.min(a.count,h.start+h.count);for(let x=d,p=g;x<p;x+=3){let m=x,E=x+1,R=x+2;if(i=Ra(this,s,e,n,c,l,u,m,E,R),i)i.faceIndex=Math.floor(x/3),t.push(i)}}}}function Rb(e,t,n,i,r,s,o,a){let c;if(t.side===1)c=i.intersectTriangle(o,s,r,!0,a);else c=i.intersectTriangle(r,s,o,t.side===0,a);if(c===null)return null;Aa.copy(a),Aa.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(Aa);if(l<n.near||l>n.far)return null;return{distance:l,point:Aa.clone(),object:e}}function Ra(e,t,n,i,r,s,o,a,c,l){e.getVertexPosition(a,Ma),e.getVertexPosition(c,wa),e.getVertexPosition(l,Ta);let u=Rb(e,t,n,i,Ma,wa,Ta,g_);if(u){let f=new U;if(En.getBarycoord(g_,Ma,wa,Ta,f),r)u.uv=En.getInterpolatedAttribute(r,a,c,l,f,new Ne);if(s)u.uv1=En.getInterpolatedAttribute(s,a,c,l,f,new Ne);if(o){if(u.normal=En.getInterpolatedAttribute(o,a,c,l,f,new U),u.normal.dot(i.direction)>0)u.normal.multiplyScalar(-1)}let h={a,b:c,c:l,normal:new U,materialIndex:0};En.getNormal(Ma,wa,Ta,h.normal),u.face=h,u.barycoord=f}return u}var Ws=new at,__=new at,x_=new at,Cb=new at,v_=new Ge,Ca=new U,nu=new xn,y_=new Ge,iu=new Xi;class rc extends mt{constructor(e,t){super(e,t);this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode="attached",this.bindMatrix=new Ge,this.bindMatrixInverse=new Ge,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;if(this.boundingBox===null)this.boundingBox=new nn;this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Ca),this.boundingBox.expandByPoint(Ca)}computeBoundingSphere(){let e=this.geometry;if(this.boundingSphere===null)this.boundingSphere=new xn;this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Ca),this.boundingSphere.expandByPoint(Ca)}copy(e,t){if(super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null)this.boundingBox=e.boundingBox.clone();if(e.boundingSphere!==null)this.boundingSphere=e.boundingSphere.clone();return this}raycast(e,t){let n=this.material,i=this.matrixWorld;if(n===void 0)return;if(this.boundingSphere===null)this.computeBoundingSphere();if(nu.copy(this.boundingSphere),nu.applyMatrix4(i),e.ray.intersectsSphere(nu)===!1)return;if(y_.copy(i).invert(),iu.copy(e.ray).applyMatrix4(y_),this.boundingBox!==null){if(iu.intersectsBox(this.boundingBox)===!1)return}this._computeIntersections(e,t,iu)}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){if(this.skeleton=e,t===void 0)this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld;this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new at,t=this.geometry.attributes.skinWeight;for(let n=0,i=t.count;n<i;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();if(r!==1/0)e.multiplyScalar(r);else e.set(1,0,0,0);t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){if(super.updateMatrixWorld(e),this.bindMode==="attached")this.bindMatrixInverse.copy(this.matrixWorld).invert();else if(this.bindMode==="detached")this.bindMatrixInverse.copy(this.bindMatrix).invert();else Ce("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,i=this.geometry;if(__.fromBufferAttribute(i.attributes.skinIndex,e),x_.fromBufferAttribute(i.attributes.skinWeight,e),t.isVector4)Ws.copy(t),t.set(0,0,0,0);else Ws.set(...t,1),t.set(0,0,0);Ws.applyMatrix4(this.bindMatrix);for(let r=0;r<4;r++){let s=x_.getComponent(r);if(s!==0){let o=__.getComponent(r);v_.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),t.addScaledVector(Cb.copy(Ws).applyMatrix4(v_),s)}}if(t.isVector4)t.w=Ws.w;return t.applyMatrix4(this.bindMatrixInverse)}}class ao extends ut{constructor(){super();this.isBone=!0,this.type="Bone"}}class co extends Tt{constructor(e=null,t=1,n=1,i,r,s,o,a,c=1003,l=1003,u,f){super(null,s,o,a,c,l,i,r,u,f);this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}var S_=new Ge,Pb=new Ge;class lo{constructor(e=[],t=[]){this.uuid=zn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){Ce("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new Ge)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let n=new Ge;if(this.bones[e])n.copy(this.bones[e].matrixWorld).invert();this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];if(n)n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];if(n){if(n.parent&&n.parent.isBone)n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld);else n.matrix.copy(n.matrixWorld);n.matrix.decompose(n.position,n.quaternion,n.scale)}}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let r=0,s=e.length;r<s;r++){let o=e[r]?e[r].matrixWorld:Pb;S_.multiplyMatrices(o,t[r]),S_.toArray(n,r*16)}if(i!==null)i.needsUpdate=!0}clone(){return new lo(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new co(t,e,e,1023,1015);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let i=this.bones[t];if(i.name===e)return i}return}dispose(){if(this.boneTexture!==null)this.boneTexture.dispose(),this.boneTexture=null}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,i=e.bones.length;n<i;n++){let r=e.bones[n],s=t[r];if(s===void 0)Ce("Skeleton: No bone found with UUID:",r),s=new ao;this.bones.push(s),this.boneInverses.push(new Ge().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let i=0,r=t.length;i<r;i++){let s=t[i];e.bones.push(s.uuid);let o=n[i];e.boneInverses.push(o.toArray())}return e}}class Gi extends Bt{constructor(e,t,n,i=1){super(e,t,n);this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}var $r=new Ge,b_=new Ge,Pa=[],M_=new nn,Ib=new Ge,$s=new mt,Zs=new xn;class ls extends mt{constructor(e,t,n){super(e,t);this.isInstancedMesh=!0,this.instanceMatrix=new Gi(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,Ib)}computeBoundingBox(){let e=this.geometry,t=this.count;if(this.boundingBox===null)this.boundingBox=new nn;if(e.boundingBox===null)e.computeBoundingBox();this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,$r),M_.copy(e.boundingBox).applyMatrix4($r),this.boundingBox.union(M_)}computeBoundingSphere(){let e=this.geometry,t=this.count;if(this.boundingSphere===null)this.boundingSphere=new xn;if(e.boundingSphere===null)e.computeBoundingSphere();this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,$r),Zs.copy(e.boundingSphere).applyMatrix4($r),this.boundingSphere.union(Zs)}copy(e,t){if(super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null)this.morphTexture=e.morphTexture.clone();if(e.instanceColor!==null)this.instanceColor=e.instanceColor.clone();if(this.count=e.count,e.boundingBox!==null)this.boundingBox=e.boundingBox.clone();if(e.boundingSphere!==null)this.boundingSphere=e.boundingSphere.clone();return this}getColorAt(e,t){if(this.instanceColor===null)return t.setRGB(1,1,1);else return t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,s=e*r+1;for(let o=0;o<n.length;o++)n[o]=i[s+o]}raycast(e,t){let n=this.matrixWorld,i=this.count;if($s.geometry=this.geometry,$s.material=this.material,$s.material===void 0)return;if(this.boundingSphere===null)this.computeBoundingSphere();if(Zs.copy(this.boundingSphere),Zs.applyMatrix4(n),e.ray.intersectsSphere(Zs)===!1)return;for(let r=0;r<i;r++){this.getMatrixAt(r,$r),b_.multiplyMatrices(n,$r),$s.matrixWorld=b_,$s.raycast(e,Pa);for(let s=0,o=Pa.length;s<o;s++){let a=Pa[s];a.instanceId=r,a.object=this,t.push(a)}Pa.length=0}}setColorAt(e,t){if(this.instanceColor===null)this.instanceColor=new Gi(new Float32Array(this.instanceMatrix.count*3).fill(1),3);return t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,i=n.length+1;if(this.morphTexture===null)this.morphTexture=new co(new Float32Array(i*this.count),i,this.count,1028,1015);let r=this.morphTexture.source.data.data,s=0;for(let c=0;c<n.length;c++)s+=n[c];let o=this.geometry.morphTargetsRelative?1:1-s,a=i*e;return r[a]=o,r.set(n,a+1),this}updateMorphTargets(){}dispose(){if(super.dispose(),this.morphTexture!==null)this.morphTexture.dispose(),this.morphTexture=null}}var fr=new xn,Lb=new Ne(0.5,0.5),Ia=new U;class uo{constructor(e=new Tn,t=new Tn,n=new Tn,i=new Tn,r=new Tn,s=new Tn){this.planes=[e,t,n,i,r,s]}set(e,t,n,i,r,s){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(s),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=2000,n=!1){let i=this.planes,r=e.elements,s=r[0],o=r[1],a=r[2],c=r[3],l=r[4],u=r[5],f=r[6],h=r[7],d=r[8],g=r[9],x=r[10],p=r[11],m=r[12],E=r[13],R=r[14],S=r[15];if(i[0].setComponents(c-s,h-l,p-d,S-m).normalize(),i[1].setComponents(c+s,h+l,p+d,S+m).normalize(),i[2].setComponents(c+o,h+u,p+g,S+E).normalize(),i[3].setComponents(c-o,h-u,p-g,S-E).normalize(),n)i[4].setComponents(a,f,x,R).normalize(),i[5].setComponents(c-a,h-f,p-x,S-R).normalize();else if(i[4].setComponents(c-a,h-f,p-x,S-R).normalize(),t===2000)i[5].setComponents(c+a,h+f,p+x,S+R).normalize();else if(t===2001)i[5].setComponents(a,f,x,R).normalize();else throw Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0){if(e.boundingSphere===null)e.computeBoundingSphere();fr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld)}else{let t=e.geometry;if(t.boundingSphere===null)t.computeBoundingSphere();fr.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(fr)}intersectsSprite(e){fr.center.set(0,0,0);let t=Lb.distanceTo(e.center);return fr.radius=0.7071067811865476+t,fr.applyMatrix4(e.matrixWorld),this.intersectsSphere(fr)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(Ia.x=i.normal.x>0?e.max.x:e.min.x,Ia.y=i.normal.y>0?e.max.y:e.min.y,Ia.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(Ia)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class ho extends cn{constructor(e){super();this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Oe(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}var ka=new U,Ba=new U,w_=new Ge,Xs=new Xi,La=new xn,ru=new U,T_=new U;class qi extends ut{constructor(e=new jt,t=new ho){super();this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let i=1,r=t.count;i<r;i++)ka.fromBufferAttribute(t,i-1),Ba.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=ka.distanceTo(Ba);e.setAttribute("lineDistance",new an(n,1))}else Ce("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Line.threshold,s=n.drawRange;if(n.boundingSphere===null)n.computeBoundingSphere();if(La.copy(n.boundingSphere),La.applyMatrix4(i),La.radius+=r,e.ray.intersectsSphere(La)===!1)return;w_.copy(i).invert(),Xs.copy(e.ray).applyMatrix4(w_);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),a=o*o,c=this.isLineSegments?2:1,l=n.index,f=n.attributes.position;if(l!==null){let h=Math.max(0,s.start),d=Math.min(l.count,s.start+s.count);for(let g=h,x=d-1;g<x;g+=c){let p=l.getX(g),m=l.getX(g+1),E=Na(this,e,Xs,a,p,m,g);if(E)t.push(E)}if(this.isLineLoop){let g=l.getX(d-1),x=l.getX(h),p=Na(this,e,Xs,a,g,x,d-1);if(p)t.push(p)}}else{let h=Math.max(0,s.start),d=Math.min(f.count,s.start+s.count);for(let g=h,x=d-1;g<x;g+=c){let p=Na(this,e,Xs,a,g,g+1,g);if(p)t.push(p)}if(this.isLineLoop){let g=Na(this,e,Xs,a,d-1,h,d-1);if(g)t.push(g)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function Na(e,t,n,i,r,s,o){let a=e.geometry.attributes.position;if(ka.fromBufferAttribute(a,r),Ba.fromBufferAttribute(a,s),n.distanceSqToSegment(ka,Ba,ru,T_)>i)return;ru.applyMatrix4(e.matrixWorld);let l=t.ray.origin.distanceTo(ru);if(l<t.near||l>t.far)return;return{distance:l,point:T_.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var E_=new U,A_=new U;class sc extends qi{constructor(e,t){super(e,t);this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let i=0,r=t.count;i<r;i+=2)E_.fromBufferAttribute(t,i),A_.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+E_.distanceTo(A_);e.setAttribute("lineDistance",new an(n,1))}else Ce("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class oc extends qi{constructor(e,t){super(e,t);this.isLineLoop=!0,this.type="LineLoop"}}class fo extends cn{constructor(e){super();this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Oe(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}var R_=new Ge,au=new Xi,Da=new xn,Oa=new U;class us extends ut{constructor(e=new jt,t=new fo){super();this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Points.threshold,s=n.drawRange;if(n.boundingSphere===null)n.computeBoundingSphere();if(Da.copy(n.boundingSphere),Da.applyMatrix4(i),Da.radius+=r,e.ray.intersectsSphere(Da)===!1)return;R_.copy(i).invert(),au.copy(e.ray).applyMatrix4(R_);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),a=o*o,c=n.index,u=n.attributes.position;if(c!==null){let f=Math.max(0,s.start),h=Math.min(c.count,s.start+s.count);for(let d=f,g=h;d<g;d++){let x=c.getX(d);Oa.fromBufferAttribute(u,x),C_(Oa,x,a,i,e,t,this)}}else{let f=Math.max(0,s.start),h=Math.min(u.count,s.start+s.count);for(let d=f,g=h;d<g;d++)Oa.fromBufferAttribute(u,d),C_(Oa,d,a,i,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function C_(e,t,n,i,r,s,o){let a=au.distanceSqToPoint(e);if(a<n){let c=new U;au.closestPointToPoint(e,c),c.applyMatrix4(i);let l=r.ray.origin.distanceTo(c);if(l<r.near||l>r.far)return;s.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class ac extends Tt{constructor(e=[],t=301,n,i,r,s,o,a,c,l){super(e,t,n,i,r,s,o,a,c,l);this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Sr extends Tt{constructor(e,t,n=1014,i,r,s,o=1003,a=1003,c,l=1026,u=1){if(l!==1026&&l!==1027)throw Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:e,height:t,depth:u};super(f,i,r,s,o,a,l,n,c);this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new ro(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}}class hh extends Sr{constructor(e,t=1014,n=301,i,r,s=1003,o=1003,a,c=1026){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,i,r,s,o,a,c);this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class cc extends Tt{constructor(e=null){super();this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Yi extends jt{constructor(e=1,t=1,n=1,i=1,r=1,s=1){super();this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:s};let o=this;i=Math.floor(i),r=Math.floor(r),s=Math.floor(s);let a=[],c=[],l=[],u=[],f=0,h=0;d("z","y","x",-1,-1,n,t,e,s,r,0),d("z","y","x",1,-1,n,t,-e,s,r,1),d("x","z","y",1,1,e,n,t,i,s,2),d("x","z","y",1,-1,e,n,-t,i,s,3),d("x","y","z",1,-1,e,t,n,i,r,4),d("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(a),this.setAttribute("position",new an(c,3)),this.setAttribute("normal",new an(l,3)),this.setAttribute("uv",new an(u,2));function d(g,x,p,m,E,R,S,b,T,A,_){let M=R/T,F=S/A,P=R/2,O=S/2,K=b/2,C=T+1,G=A+1,X=0,z=0,te=new U;for(let H=0;H<G;H++){let Q=H*F-O;for(let ee=0;ee<C;ee++){let Te=ee*M-P;te[g]=Te*m,te[x]=Q*E,te[p]=K,c.push(te.x,te.y,te.z),te[g]=0,te[x]=0,te[p]=b>0?1:-1,l.push(te.x,te.y,te.z),u.push(ee/T),u.push(1-H/A),X+=1}}for(let H=0;H<A;H++)for(let Q=0;Q<T;Q++){let ee=f+Q+C*H,Te=f+Q+C*(H+1),ve=f+(Q+1)+C*(H+1),He=f+(Q+1)+C*H;a.push(ee,Te,He),a.push(Te,ve,He),z+=6}o.addGroup(h,z,_),h+=z,f+=X}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Yi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class po extends jt{constructor(e=1,t=1,n=1,i=1){super();this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let r=e/2,s=t/2,o=Math.floor(n),a=Math.floor(i),c=o+1,l=a+1,u=e/o,f=t/a,h=[],d=[],g=[],x=[];for(let p=0;p<l;p++){let m=p*f-s;for(let E=0;E<c;E++){let R=E*u-r;d.push(R,-m,0),g.push(0,0,1),x.push(E/o),x.push(1-p/a)}}for(let p=0;p<a;p++)for(let m=0;m<o;m++){let E=m+c*p,R=m+c*(p+1),S=m+1+c*(p+1),b=m+1+c*p;h.push(E,R,b),h.push(R,S,b)}this.setIndex(h),this.setAttribute("position",new an(d,3)),this.setAttribute("normal",new an(g,3)),this.setAttribute("uv",new an(x,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new po(e.width,e.height,e.widthSegments,e.heightSegments)}}function br(e){let t={};for(let n in e){t[n]={};for(let i in e[n]){let r=e[n][i];if(P_(r))if(r.isRenderTargetTexture)Ce("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[n][i]=null;else t[n][i]=r.clone();else if(Array.isArray(r))if(P_(r[0])){let s=[];for(let o=0,a=r.length;o<a;o++)s[o]=r[o].clone();t[n][i]=s}else t[n][i]=r.slice();else t[n][i]=r}}return t}function Kt(e){let t={};for(let n=0;n<e.length;n++){let i=br(e[n]);for(let r in i)t[r]=i[r]}return t}function P_(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Nb(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function fh(e){let t=e.getRenderTarget();if(t===null)return e.outputColorSpace;if(t.isXRRenderTarget===!0)return t.texture.colorSpace;return $e.workingColorSpace}var F0={clone:br,merge:Kt},Db=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Ob=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Rn extends cn{constructor(e){super();if(this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Db,this.fragmentShader=Ob,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0)this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=br(e.uniforms),this.uniformsGroups=Nb(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let s=this.uniforms[i].value;if(s&&s.isTexture)t.uniforms[i]={type:"t",value:s.toJSON(e).uuid};else if(s&&s.isColor)t.uniforms[i]={type:"c",value:s.getHex()};else if(s&&s.isVector2)t.uniforms[i]={type:"v2",value:s.toArray()};else if(s&&s.isVector3)t.uniforms[i]={type:"v3",value:s.toArray()};else if(s&&s.isVector4)t.uniforms[i]={type:"v4",value:s.toArray()};else if(s&&s.isMatrix3)t.uniforms[i]={type:"m3",value:s.toArray()};else if(s&&s.isMatrix4)t.uniforms[i]={type:"m4",value:s.toArray()};else t.uniforms[i]={value:s}}if(Object.keys(this.defines).length>0)t.defines=this.defines;t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)if(this.extensions[i]===!0)n[i]=!0;if(Object.keys(n).length>0)t.extensions=n;return t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let i=e.uniforms[n];switch(this.uniforms[n]={},i.type){case"t":this.uniforms[n].value=t[i.value]||null;break;case"c":this.uniforms[n].value=new Oe().setHex(i.value);break;case"v2":this.uniforms[n].value=new Ne().fromArray(i.value);break;case"v3":this.uniforms[n].value=new U().fromArray(i.value);break;case"v4":this.uniforms[n].value=new at().fromArray(i.value);break;case"m3":this.uniforms[n].value=new ze().fromArray(i.value);break;case"m4":this.uniforms[n].value=new Ge().fromArray(i.value);break;default:this.uniforms[n].value=i.value}}if(e.defines!==void 0)this.defines=e.defines;if(e.vertexShader!==void 0)this.vertexShader=e.vertexShader;if(e.fragmentShader!==void 0)this.fragmentShader=e.fragmentShader;if(e.glslVersion!==void 0)this.glslVersion=e.glslVersion;if(e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];if(e.lights!==void 0)this.lights=e.lights;if(e.clipping!==void 0)this.clipping=e.clipping;return this}}class dh extends Rn{constructor(e){super(e);this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class wi extends cn{constructor(e){super();this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Oe(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Oe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new Ne(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ti,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class vn extends wi{constructor(e){super();this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new Ne(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Ze(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+0.4*t)/(1-0.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Oe(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Oe(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Oe(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){if(this._anisotropy>0!==e>0)this.version++;this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){if(this._clearcoat>0!==e>0)this.version++;this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){if(this._iridescence>0!==e>0)this.version++;this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){if(this._dispersion>0!==e>0)this.version++;this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){if(this._retroreflectivity>0!==e>0)this.version++;this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){if(this._sheen>0!==e>0)this.version++;this._sheen=e}get transmission(){return this._transmission}set transmission(e){if(this._transmission>0!==e>0)this.version++;this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}class lc extends cn{constructor(e){super();this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Oe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Oe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new Ne(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ti,this.combine=0,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class ph extends cn{constructor(e){super();this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class mh extends cn{constructor(e){super();this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}function Bi(e,t){if(!e||e.constructor===t)return e;if(typeof t.BYTES_PER_ELEMENT==="number")return new t(e);return Array.prototype.slice.call(e)}function za(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}function Ub(e){function t(r,s){return e[r]-e[s]}let n=e.length,i=Array(n);for(let r=0;r!==n;++r)i[r]=r;return i.sort(t),i}function I_(e,t,n){let i=e.length,r=new e.constructor(i);for(let s=0,o=0;o!==i;++s){let a=n[s]*t;for(let c=0;c!==t;++c)r[o++]=e[a+c]}return r}function Fb(e,t,n,i){let r=1,s=e[0];while(s!==void 0&&s[i]===void 0)s=e[r++];if(s===void 0)return;let o=s[i];if(o===void 0)return;if(Array.isArray(o))do{if(o=s[i],o!==void 0)t.push(s.time),n.push(...o);s=e[r++]}while(s!==void 0);else if(o.toArray!==void 0)do{if(o=s[i],o!==void 0)t.push(s.time),o.toArray(n,n.length);s=e[r++]}while(s!==void 0);else do{if(o=s[i],o!==void 0)t.push(s.time),n.push(o);s=e[r++]}while(s!==void 0)}class Ti{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],r=t[n-1];e:{t:{let s;n:{i:if(!(e<i)){for(let o=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=t[++n],e<i)break t}s=t.length;break n}if(!(e>=r)){let o=t[1];if(e<o)n=2,r=o;for(let a=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(i=r,r=t[--n-1],e>=r)break t}s=n,n=0;break n}break e}while(n<s){let o=n+s>>>1;if(e<t[o])s=o;else n=o+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let s=0;s!==i;++s)t[s]=n[r+s];return t}interpolate_(){throw Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}}class gh extends Ti{constructor(e,t,n,i){super(e,t,n,i);this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:2400,endingEnd:2400}}intervalChanged_(e,t,n){let i=this.parameterPositions,r=e-2,s=e+1,o=i[r],a=i[s];if(o===void 0)switch(this.getSettings_().endingStart){case 2401:r=e,o=2*t-n;break;case 2402:r=i.length-2,o=t+i[r]-i[r+1];break;default:r=e,o=n}if(a===void 0)switch(this.getSettings_().endingEnd){case 2401:s=e,a=2*n-t;break;case 2402:s=1,a=n+i[1]-i[0];break;default:s=e-1,a=t}let c=(n-t)*0.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(a-n),this._offsetPrev=r*l,this._offsetNext=s*l}interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,c=a-o,l=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,h=this._weightNext,d=(n-t)/(i-t),g=d*d,x=g*d,p=-f*x+2*f*g-f*d,m=(1+f)*x+(-1.5-2*f)*g+(-0.5+f)*d+1,E=(-1-h)*x+(1.5+h)*g+0.5*d,R=h*x-h*g;for(let S=0;S!==o;++S)r[S]=p*s[l+S]+m*s[c+S]+E*s[a+S]+R*s[u+S];return r}}class uc extends Ti{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,c=a-o,l=(n-t)/(i-t),u=1-l;for(let f=0;f!==o;++f)r[f]=s[c+f]*u+s[a+f]*l;return r}}class _h extends Ti{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}}class xh extends Ti{interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,c=a-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let d=(n-t)/(i-t),g=1-d;for(let x=0;x!==o;++x)r[x]=s[c+x]*g+s[a+x]*d;return r}let f=o*2,h=e-1;for(let d=0;d!==o;++d){let g=s[c+d],x=s[a+d],p=h*f+d*2,m=u[p],E=u[p+1],R=e*f+d*2,S=l[R],b=l[R+1],T=kb(n,t,m,S,i);r[d]=z0(T,g,E,b,x)}return r}}function z0(e,t,n,i,r){let s=1-e;return s*s*s*t+3*s*s*e*n+3*s*e*e*i+e*e*e*r}function zb(e,t,n,i,r){let s=1-e;return 3*s*s*(n-t)+6*s*e*(i-n)+3*e*e*(r-i)}function kb(e,t,n,i,r){let s=(e-t)/(r-t);for(let o=0;o<8;o++){let a=z0(s,t,n,i,r)-e;if(Math.abs(a)<0.0000000001)break;let c=zb(s,t,n,i,r);if(Math.abs(c)<0.0000000001)break;s=Math.max(0,Math.min(1,s-a/c))}return s}class yn{constructor(e,t,n,i){if(e===void 0)throw Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Bi(t,this.TimeBufferType),this.values=Bi(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Bi(e.times,Array),values:Bi(e.values,Array)};let i=e.getInterpolation();if(i!==e.DefaultInterpolation)n.interpolation=i;if(za(e.settings))n.settings={inTangents:Bi(e.settings.inTangents,Array),outTangents:Bi(e.settings.outTangents,Array)}}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new _h(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new uc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new gh(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new xh(this.times,this.values,this.getValueSize(),e);if(this.settings)t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents;return t}setInterpolation(e){let t;switch(e){case 2300:t=this.InterpolantFactoryMethodDiscrete;break;case 2301:t=this.InterpolantFactoryMethodLinear;break;case 2302:t=this.InterpolantFactoryMethodSmooth;break;case 2303:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(n);return Ce("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return 2300;case this.InterpolantFactoryMethodLinear:return 2301;case this.InterpolantFactoryMethodSmooth:return 2302;case this.InterpolantFactoryMethodBezier:return 2303}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e;if(za(this.settings))L_(this.settings.inTangents,e),L_(this.settings.outTangents,e)}return this}trim(e,t){let n=this.times,i=n.length,r=0,s=i-1;while(r!==i&&n[r]<e)++r;while(s!==-1&&n[s]>t)--s;if(++s,r!==0||s!==i){if(r>=s)s=Math.max(s,1),r=s-1;let o=this.getValueSize();this.times=n.slice(r,s),this.values=this.values.slice(r*o,s*o)}return this}validate(){let e=!0,t=this.getValueSize();if(t-Math.floor(t)!==0)Ue("KeyframeTrack: Invalid value size in track.",this),e=!1;let n=this.times,i=this.values,r=n.length;if(r===0)Ue("KeyframeTrack: Track is empty.",this),e=!1;let s=null;for(let o=0;o!==r;o++){let a=n[o];if(typeof a==="number"&&isNaN(a)){Ue("KeyframeTrack: Time is not a valid number.",this,o,a),e=!1;break}if(s!==null&&s>a){Ue("KeyframeTrack: Out of order keys.",this,o,a,s),e=!1;break}s=a}if(i!==void 0){if(YS(i))for(let o=0,a=i.length;o!==a;++o){let c=i[o];if(isNaN(c)){Ue("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===2302,r=e.length-1,s=1;for(let o=1;o<r;++o){let a=!1,c=e[o],l=e[o+1];if(c!==l&&(o!==1||c!==e[0]))if(!i){let u=o*n,f=u-n,h=u+n;for(let d=0;d!==n;++d){let g=t[u+d];if(g!==t[f+d]||g!==t[h+d]){a=!0;break}}}else a=!0;if(a){if(o!==s){e[s]=e[o];let u=o*n,f=s*n;for(let h=0;h!==n;++h)t[f+h]=t[u+h]}++s}}if(r>0){e[s]=e[r];for(let o=r*n,a=s*n,c=0;c!==n;++c)t[a+c]=t[o+c];++s}if(s!==e.length)this.times=e.slice(0,s),this.values=t.slice(0,s*n);else this.times=e,this.values=t;return this}clone(){let e=this.times.slice(),t=this.values.slice(),i=new this.constructor(this.name,e,t);if(i.createInterpolant=this.createInterpolant,za(this.settings))i.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()};return i}}function L_(e,t){for(let n=0,i=e.length;n!==i;n+=2)e[n]*=t}yn.prototype.ValueTypeName="";yn.prototype.TimeBufferType=Float32Array;yn.prototype.ValueBufferType=Float32Array;yn.prototype.DefaultInterpolation=2301;class ji extends yn{constructor(e,t,n){super(e,t,n)}}ji.prototype.ValueTypeName="bool";ji.prototype.ValueBufferType=Array;ji.prototype.DefaultInterpolation=2300;ji.prototype.InterpolantFactoryMethodLinear=void 0;ji.prototype.InterpolantFactoryMethodSmooth=void 0;class hc extends yn{constructor(e,t,n,i){super(e,t,n,i)}}hc.prototype.ValueTypeName="color";class Ki extends yn{constructor(e,t,n,i){super(e,t,n,i)}}Ki.prototype.ValueTypeName="number";class vh extends Ti{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=(n-t)/(i-t),c=e*o;for(let l=c+o;c!==l;c+=4)kt.slerpFlat(r,0,s,c-o,s,c,a);return r}}class Ji extends yn{constructor(e,t,n,i){super(e,t,n,i)}InterpolantFactoryMethodLinear(e){return new vh(this.times,this.values,this.getValueSize(),e)}}Ji.prototype.ValueTypeName="quaternion";Ji.prototype.InterpolantFactoryMethodSmooth=void 0;class Qi extends yn{constructor(e,t,n){super(e,t,n)}}Qi.prototype.ValueTypeName="string";Qi.prototype.ValueBufferType=Array;Qi.prototype.DefaultInterpolation=2300;Qi.prototype.InterpolantFactoryMethodLinear=void 0;Qi.prototype.InterpolantFactoryMethodSmooth=void 0;class Mr extends yn{constructor(e,t,n,i){super(e,t,n,i)}}Mr.prototype.ValueTypeName="vector";class Jr{constructor(e="",t=-1,n=[],i=2500){if(this.name=e,this.tracks=n,this.duration=t,this.blendMode=i,this.uuid=zn(),this.userData={},this.duration<0)this.resetDuration()}static parse(e){let t=[],n=e.tracks,i=1/(e.fps||1);for(let s=0,o=n.length;s!==o;++s)t.push(Gb(n[s]).scale(i));let r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){let t=[],n=e.tracks,i={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,s=n.length;r!==s;++r)t.push(yn.toJSON(n[r]));return i}static CreateFromMorphTargetSequence(e,t,n,i){let r=t.length,s=[];for(let o=0;o<r;o++){let a=[],c=[];a.push((o+r-1)%r,o,(o+1)%r),c.push(0,1,0);let l=Ub(a);if(a=I_(a,1,l),c=I_(c,1,l),!i&&a[0]===0)a.push(r),c.push(c[0]);s.push(new Ki(".morphTargetInfluences["+t[o].name+"]",a,c).scale(1/n))}return new this(e,-1,s)}static findByName(e,t){let n=e;if(!Array.isArray(e)){let i=e;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===t)return n[i];return null}static CreateClipsFromMorphTargetSequences(e,t,n){let i={},r=/^([\w-]*?)([\d]+)$/;for(let o=0,a=e.length;o<a;o++){let c=e[o],l=c.name.match(r);if(l&&l.length>1){let u=l[1],f=i[u];if(!f)i[u]=f=[];f.push(c)}}let s=[];for(let o in i)s.push(this.CreateFromMorphTargetSequence(o,i[o],t,n));return s}resetDuration(){let e=this.tracks,t=0;for(let n=0,i=e.length;n!==i;++n){let r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let n=0;n<this.tracks.length;n++)e.push(this.tracks[n].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}}function Bb(e){switch(e.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Ki;case"vector":case"vector2":case"vector3":case"vector4":return Mr;case"color":return hc;case"quaternion":return Ji;case"bool":case"boolean":return ji;case"string":return Qi}throw Error("THREE.KeyframeTrack: Unsupported typeName: "+e)}function Gb(e){if(e.type===void 0)throw Error("THREE.KeyframeTrack: track type undefined, can not parse");let t=Bb(e.type);if(e.times===void 0){let i=[],r=[];Fb(e.keys,i,r,"value"),e.times=i,e.values=r}let n;if(t.parse!==void 0)n=t.parse(e);else n=new t(e.name,e.times,e.values,e.interpolation);if(za(e.settings))n.settings={inTangents:Bi(e.settings.inTangents,Float32Array),outTangents:Bi(e.settings.outTangents,Float32Array)};return n}var ei={enabled:!1,files:{},add:function(e,t){if(this.enabled===!1)return;if(N_(e))return;this.files[e]=t},get:function(e){if(this.enabled===!1)return;if(N_(e))return;return this.files[e]},remove:function(e){delete this.files[e]},clear:function(){this.files={}}};function N_(e){try{let t=e.slice(e.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch(t){return!1}}class mo{constructor(e,t,n){let i=this,r=!1,s=0,o=0,a=void 0,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(l){if(o++,r===!1){if(i.onStart!==void 0)i.onStart(l,s,o)}r=!0},this.itemEnd=function(l){if(s++,i.onProgress!==void 0)i.onProgress(l,s,o);if(s===o){if(r=!1,i.onLoad!==void 0)i.onLoad()}},this.itemError=function(l){if(i.onError!==void 0)i.onError(l)},this.resolveURL=function(l){if(l=l.normalize("NFC"),a)return a(l);return l},this.setURLModifier=function(l){return a=l,this},this.addHandler=function(l,u){return c.push(l,u),this},this.removeHandler=function(l){let u=c.indexOf(l);if(u!==-1)c.splice(u,2);return this},this.getHandler=function(l){for(let u=0,f=c.length;u<f;u+=2){let h=c[u],d=c[u+1];if(h.global)h.lastIndex=0;if(h.test(l))return d}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){if(!this._abortController)this._abortController=new AbortController;return this._abortController}}var k0=new mo;class Ei{constructor(e){if(this.manager=e!==void 0?e:k0,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}Ei.DEFAULT_MATERIAL_NAME="__DEFAULT";var Si={};class B0 extends Error{constructor(e,t){super(e);this.response=t}}class go extends Ei{constructor(e){super(e);this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,i){if(e===void 0)e="";if(this.path!==void 0)e=this.path+e;e=this.manager.resolveURL(e);let r=ei.get(`file:${e}`);if(r!==void 0){this.manager.itemStart(e),setTimeout(()=>{if(t)t(r);this.manager.itemEnd(e)},0);return}if(Si[e]!==void 0){Si[e].push({onLoad:t,onProgress:n,onError:i});return}Si[e]=[],Si[e].push({onLoad:t,onProgress:n,onError:i});let s=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any==="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,a=this.responseType;fetch(s).then((c)=>{if(c.status===200||c.status===0){if(c.status===0)Ce("FileLoader: HTTP Status 0 received.");if(typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let l=Si[e],u=c.body.getReader(),f=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),h=f?parseInt(f):0,d=h!==0,g=0,x=new ReadableStream({start(p){m();function m(){u.read().then(({done:E,value:R})=>{if(E)p.close();else{g+=R.byteLength;let S=new ProgressEvent("progress",{lengthComputable:d,loaded:g,total:h});for(let b=0,T=l.length;b<T;b++){let A=l[b];if(A.onProgress)A.onProgress(S)}p.enqueue(R),m()}},(E)=>{p.error(E)})}}});return new Response(x)}else throw new B0(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then((c)=>{switch(a){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then((l)=>new DOMParser().parseFromString(l,o));case"json":return c.json();default:if(o==="")return c.text();else{let u=/charset="?([^;"\s]*)"?/i.exec(o),f=u&&u[1]?u[1].toLowerCase():void 0,h=new TextDecoder(f);return c.arrayBuffer().then((d)=>h.decode(d))}}}).then((c)=>{ei.add(`file:${e}`,c);let l=Si[e];delete Si[e];for(let u=0,f=l.length;u<f;u++){let h=l[u];if(h.onLoad)h.onLoad(c)}}).catch((c)=>{let l=Si[e];if(l===void 0)throw this.manager.itemError(e),c;delete Si[e];for(let u=0,f=l.length;u<f;u++){let h=l[u];if(h.onError)h.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}var Zr=new WeakMap;class yh extends Ei{constructor(e){super(e)}load(e,t,n,i){if(this.path!==void 0)e=this.path+e;e=this.manager.resolveURL(e);let r=this,s=ei.get(`image:${e}`);if(s!==void 0){if(s.complete===!0)r.manager.itemStart(e),setTimeout(function(){if(t)t(s);r.manager.itemEnd(e)},0);else{let u=Zr.get(s);if(u===void 0)u=[],Zr.set(s,u);u.push({onLoad:t,onError:i})}return s}let o=jr("img");function a(){if(l(),t)t(this);let u=Zr.get(this)||[];for(let f=0;f<u.length;f++){let h=u[f];if(h.onLoad)h.onLoad(this)}Zr.delete(this),r.manager.itemEnd(e)}function c(u){if(l(),i)i(u);ei.remove(`image:${e}`);let f=Zr.get(this)||[];for(let h=0;h<f.length;h++){let d=f[h];if(d.onError)d.onError(u)}Zr.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function l(){o.removeEventListener("load",a,!1),o.removeEventListener("error",c,!1)}if(o.addEventListener("load",a,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"){if(this.crossOrigin!==void 0)o.crossOrigin=this.crossOrigin}return ei.add(`image:${e}`,o),r.manager.itemStart(e),o.src=e,o}}class fc extends Ei{constructor(e){super(e)}load(e,t,n,i){let r=new Tt,s=new yh(this.manager);return s.setCrossOrigin(this.crossOrigin),s.setPath(this.path),s.load(e,function(o){if(r.image=o,r.needsUpdate=!0,t!==void 0)t(r)},n,i),r}}class hs extends ut{constructor(e,t=1){super();this.isLight=!0,this.type="Light",this.color=new Oe(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}class dc extends hs{constructor(e,t,n){super(e,n);this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ut.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Oe(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}}var su=new Ge,D_=new U,O_=new U;class _o{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ne(512,512),this.mapType=1009,this.map=null,this.mapPass=null,this.matrix=new Ge,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new uo,this._frameExtents=new Ne(1,1),this._viewportCount=1,this._viewports=[new at(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;D_.setFromMatrixPosition(e.matrixWorld),t.position.copy(D_),O_.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(O_),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,i){su.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(su,e.coordinateSystem,e.reversedDepth);let r=this._frameExtents,s=i?i.z/r.x:1,o=i?i.w/r.y:1,a=i?i.x/r.x:0,c=i?i.y/r.y:0;if(e.coordinateSystem===2001||e.reversedDepth)t.set(0.5*s,0,0,0.5*s+a,0,0.5*o,0,0.5*o+c,0,0,1,0,0,0,0,1);else t.set(0.5*s,0,0,0.5*s+a,0,0.5*o,0,0.5*o+c,0,0,0.5,0.5,0,0,0,1);t.multiply(su)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){if(this.map)this.map.dispose();if(this.mapPass)this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}var Ua=new U,Fa=new kt,Jn=new U;class pc extends ut{constructor(){super();this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ge,this.projectionMatrix=new Ge,this.projectionMatrixInverse=new Ge,this.coordinateSystem=2000,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){if(super.updateMatrixWorld(e),this.matrixWorld.decompose(Ua,Fa,Jn),Jn.x===1&&Jn.y===1&&Jn.z===1)this.matrixWorldInverse.copy(this.matrixWorld).invert();else this.matrixWorldInverse.compose(Ua,Fa,Jn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){if(super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Ua,Fa,Jn),Jn.x===1&&Jn.y===1&&Jn.z===1)this.matrixWorldInverse.copy(this.matrixWorld).invert();else this.matrixWorldInverse.compose(Ua,Fa,Jn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}var ki=new U,U_=new Ne,F_=new Ne;class Dt extends pc{constructor(e=50,t=1,n=0.1,i=2000){super();this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=0.5*this.getFilmHeight()/e;this.fov=pr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(qs*0.5*this.fov);return 0.5*this.getFilmHeight()/e}getEffectiveFOV(){return pr*2*Math.atan(Math.tan(qs*0.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ki.set(-1,-1,0.5).applyMatrix4(this.projectionMatrixInverse),t.set(ki.x,ki.y).multiplyScalar(-e/ki.z),ki.set(1,1,0.5).applyMatrix4(this.projectionMatrixInverse),n.set(ki.x,ki.y).multiplyScalar(-e/ki.z)}getViewSize(e,t){return this.getViewBounds(e,U_,F_),t.subVectors(F_,U_)}setViewOffset(e,t,n,i,r,s){if(this.aspect=e/t,this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(qs*0.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-0.5*i,s=this.view;if(this.view!==null&&this.view.enabled){let{fullWidth:a,fullHeight:c}=s;r+=s.offsetX*i/a,t-=s.offsetY*n/c,i*=s.width/a,n*=s.height/c}let o=this.filmOffset;if(o!==0)r+=e*o/this.getFilmWidth();this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);if(t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null)t.object.view=Object.assign({},this.view);return t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class G0 extends _o{constructor(){super(new Dt(50,1,0.5,500));this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=pr*2*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;if(n!==t.fov||i!==t.aspect||r!==t.far)t.fov=n,t.aspect=i,t.far=r,t.updateProjectionMatrix();super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this.aspect=e.aspect,this}toJSON(){let e=super.toJSON();return e.focus=this.focus,e.aspect=this.aspect,e}}class mc extends hs{constructor(e,t,n=0,i=Math.PI/3,r=0,s=2){super(e,t);this.isSpotLight=!0,this.type="SpotLight",this.position.copy(ut.DEFAULT_UP),this.updateMatrix(),this.target=new ut,this.distance=n,this.angle=i,this.penumbra=r,this.decay=s,this.map=null,this.shadow=new G0}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);if(t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture)t.object.map=this.map.toJSON(e).uuid;return t.object.shadow=this.shadow.toJSON(),t}}class H0 extends _o{constructor(){super(new Dt(90,1,0.5,500));this.isPointLightShadow=!0}}class fs extends hs{constructor(e,t,n=0,i=2){super(e,t);this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new H0}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}}class wr extends pc{constructor(e=-1,t=1,n=1,i=-1,r=0.1,s=2000){super();this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,s){if(this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-e,s=n+e,o=i+t,a=i-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,l=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,s=r+c*this.view.width,o-=l*this.view.offsetY,a=o-l*this.view.height}this.projectionMatrix.makeOrthographic(r,s,o,a,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);if(t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null)t.object.view=Object.assign({},this.view);return t}}class V0 extends _o{constructor(){super(new wr(-5,5,5,-5,0.5,500));this.isDirectionalLightShadow=!0}}class ds extends hs{constructor(e,t){super(e,t);this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ut.DEFAULT_UP),this.updateMatrix(),this.target=new ut,this.shadow=new V0}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}}class er{static extractUrlBase(e){let t=e.lastIndexOf("/");if(t===-1)return"./";return e.slice(0,t+1)}static resolveURL(e,t){if(typeof e!=="string"||e==="")return"";if(/^https?:\/\//i.test(t)&&/^\//.test(e))t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1");if(/^(https?:)?\/\//i.test(e))return e;if(/^data:.*,.*$/i.test(e))return e;if(/^blob:.*$/i.test(e))return e;return t+e}}var ou=new WeakMap;class gc extends Ei{constructor(e){super(e);if(this.isImageBitmapLoader=!0,typeof createImageBitmap>"u")Ce("ImageBitmapLoader: createImageBitmap() not supported.");if(typeof fetch>"u")Ce("ImageBitmapLoader: fetch() not supported.");this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,i){if(e===void 0)e="";if(this.path!==void 0)e=this.path+e;e=this.manager.resolveURL(e);let r=this,s=ei.get(`image-bitmap:${e}`);if(s!==void 0){if(r.manager.itemStart(e),s.then){s.then((c)=>{if(ou.has(s)===!0){if(i)i(ou.get(s));r.manager.itemError(e),r.manager.itemEnd(e)}else{if(t)t(c);r.manager.itemEnd(e)}});return}setTimeout(function(){if(t)t(s);r.manager.itemEnd(e)},0);return}let o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader,o.signal=typeof AbortSignal.any==="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let a=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign({},r.options,{colorSpaceConversion:"none"}))}).then(function(c){if(ei.add(`image-bitmap:${e}`,c),t)t(c);return r.manager.itemEnd(e),c}).catch(function(c){if(i)i(c);ou.set(a,c),ei.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});ei.add(`image-bitmap:${e}`,a),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}var Xr=-90,qr=1;class Sh extends ut{constructor(e,t,n){super();this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new Dt(Xr,qr,e,t);i.layers=this.layers,this.add(i);let r=new Dt(Xr,qr,e,t);r.layers=this.layers,this.add(r);let s=new Dt(Xr,qr,e,t);s.layers=this.layers,this.add(s);let o=new Dt(Xr,qr,e,t);o.layers=this.layers,this.add(o);let a=new Dt(Xr,qr,e,t);a.layers=this.layers,this.add(a);let c=new Dt(Xr,qr,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,r,s,o,a]=t;for(let c of t)this.remove(c);if(e===2000)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),a.up.set(0,1,0),a.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),a.up.set(0,-1,0),a.lookAt(0,0,-1);else throw Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){if(this.parent===null)this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;if(this.coordinateSystem!==e.coordinateSystem)this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem();let[r,s,o,a,c,l]=this.children,u=e.getRenderTarget(),f=e.getActiveCubeFace(),h=e.getActiveMipmapLevel(),d=e.xr.enabled;e.xr.enabled=!1;let g=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let x=!1;if(e.isWebGLRenderer===!0)x=e.state.buffers.depth.getReversed();else x=e.reversedDepthBuffer;if(e.setRenderTarget(n,0,i),x&&e.autoClear===!1)e.clearDepth();if(e.render(t,r),e.setRenderTarget(n,1,i),x&&e.autoClear===!1)e.clearDepth();if(e.render(t,s),e.setRenderTarget(n,2,i),x&&e.autoClear===!1)e.clearDepth();if(e.render(t,o),e.setRenderTarget(n,3,i),x&&e.autoClear===!1)e.clearDepth();if(e.render(t,a),e.setRenderTarget(n,4,i),x&&e.autoClear===!1)e.clearDepth();if(e.render(t,c),n.texture.generateMipmaps=g,e.setRenderTarget(n,5,i),x&&e.autoClear===!1)e.clearDepth();e.render(t,l),e.setRenderTarget(u,f,h),e.xr.enabled=d,n.texture.needsPMREMUpdate=!0}}class bh extends Dt{constructor(e=[]){super();this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class Mh{constructor(e,t,n){this.binding=e,this.valueSize=n;let i,r,s;switch(t){case"quaternion":i=this._slerp,r=this._slerpAdditive,s=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case"string":case"bool":i=this._select,r=this._select,s=this._setAdditiveIdentityOther,this.buffer=Array(n*5);break;default:i=this._lerp,r=this._lerpAdditive,s=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=i,this._mixBufferRegionAdditive=r,this._setIdentity=s,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(e,t){let n=this.buffer,i=this.valueSize,r=e*i+i,s=this.cumulativeWeight;if(s===0){for(let o=0;o!==i;++o)n[r+o]=n[o];s=t}else{s+=t;let o=t/s;this._mixBufferRegion(n,r,0,o,i)}this.cumulativeWeight=s}accumulateAdditive(e){let t=this.buffer,n=this.valueSize,i=n*this._addIndex;if(this.cumulativeWeightAdditive===0)this._setIdentity();this._mixBufferRegionAdditive(t,i,0,e,n),this.cumulativeWeightAdditive+=e}apply(e){let t=this.valueSize,n=this.buffer,i=e*t+t,r=this.cumulativeWeight,s=this.cumulativeWeightAdditive,o=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,r<1){let a=t*this._origIndex;this._mixBufferRegion(n,i,a,1-r,t)}if(s>0)this._mixBufferRegionAdditive(n,i,this._addIndex*t,1,t);for(let a=t,c=t+t;a!==c;++a)if(n[a]!==n[a+t]){o.setValue(n,i);break}}saveOriginalState(){let e=this.binding,t=this.buffer,n=this.valueSize,i=n*this._origIndex;e.getValue(t,i);for(let r=n,s=i;r!==s;++r)t[r]=t[i+r%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){let e=this.valueSize*3;this.binding.setValue(this.buffer,e)}_setAdditiveIdentityNumeric(){let e=this._addIndex*this.valueSize,t=e+this.valueSize;for(let n=e;n<t;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){let e=this._origIndex*this.valueSize,t=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[t+n]=this.buffer[e+n]}_select(e,t,n,i,r){if(i>=0.5)for(let s=0;s!==r;++s)e[t+s]=e[n+s]}_slerp(e,t,n,i){kt.slerpFlat(e,t,e,t,e,n,i)}_slerpAdditive(e,t,n,i,r){let s=this._workIndex*r;kt.multiplyQuaternionsFlat(e,s,e,t,e,n),kt.slerpFlat(e,t,e,t,e,s,i)}_lerp(e,t,n,i,r){let s=1-i;for(let o=0;o!==r;++o){let a=t+o;e[a]=e[a]*s+e[n+o]*i}}_lerpAdditive(e,t,n,i,r){for(let s=0;s!==r;++s){let o=t+s;e[o]=e[o]+e[n+s]*i}}}var wh="\\[\\]\\.:\\/",Hb=new RegExp("["+wh+"]","g"),Th="[^"+wh+"]",Vb="[^"+wh.replace("\\.","")+"]",Wb=/((?:WC+[\/:])*)/.source.replace("WC",Th),$b=/(WCOD+)?/.source.replace("WCOD",Vb),Zb=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Th),Xb=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Th),qb=new RegExp("^"+Wb+$b+Zb+Xb+"$"),Yb=["material","materials","bones","map"];class W0{constructor(e,t,n){let i=n||et.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];if(i!==void 0)i.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}}class et{constructor(e,t,n){this.path=t,this.parsedPath=n||et.parseTrackName(t),this.node=et.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){if(!(e&&e.isAnimationObjectGroup))return new et(e,t,n);else return new et.Composite(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Hb,"")}static parseTrackName(e){let t=qb.exec(e);if(t===null)throw Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);if(Yb.indexOf(r)!==-1)n.nodeName=n.nodeName.substring(0,i),n.objectName=r}if(n.propertyName===null||n.propertyName.length===0)throw Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let s=0;s<r.length;s++){let o=r[s];if(o.name===t||o.uuid===t)return o;let a=n(o.children);if(a)return a}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,{objectName:n,propertyName:i,propertyIndex:r}=t;if(!e)e=et.findNode(this.rootNode,t.nodeName),this.node=e;if(this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Ce("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){Ue("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Ue("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Ue("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let l=0;l<e.length;l++)if(e[l].name===c){c=l;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Ue("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Ue("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Ue("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){Ue("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let s=e[i];if(s===void 0){let c=t.nodeName;Ue("PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e);return}let o=this.Versioning.None;if(this.targetObject=e,e.isMaterial===!0)o=this.Versioning.NeedsUpdate;else if(e.isObject3D===!0)o=this.Versioning.MatrixWorldNeedsUpdate;let a=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){Ue("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Ue("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}if(e.morphTargetDictionary[r]!==void 0)r=e.morphTargetDictionary[r]}a=this.BindingType.ArrayElement,this.resolvedProperty=s,this.propertyIndex=r}else if(s.fromArray!==void 0&&s.toArray!==void 0)a=this.BindingType.HasFromToArray,this.resolvedProperty=s;else if(Array.isArray(s))a=this.BindingType.EntireArray,this.resolvedProperty=s;else this.propertyName=i;this.getValue=this.GetterByBindingType[a],this.setValue=this.SetterByBindingTypeAndVersioning[a][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}et.Composite=W0;et.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};et.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};et.prototype.GetterByBindingType=[et.prototype._getValue_direct,et.prototype._getValue_array,et.prototype._getValue_arrayElement,et.prototype._getValue_toArray];et.prototype.SetterByBindingTypeAndVersioning=[[et.prototype._setValue_direct,et.prototype._setValue_direct_setNeedsUpdate,et.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[et.prototype._setValue_array,et.prototype._setValue_array_setNeedsUpdate,et.prototype._setValue_array_setMatrixWorldNeedsUpdate],[et.prototype._setValue_arrayElement,et.prototype._setValue_arrayElement_setNeedsUpdate,et.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[et.prototype._setValue_fromArray,et.prototype._setValue_fromArray_setNeedsUpdate,et.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class Eh{constructor(e,t,n=null,i=t.blendMode){this._mixer=e,this._clip=t,this._localRoot=n,this.blendMode=i;let r=t.tracks,s=r.length,o=Array(s),a={endingStart:2400,endingEnd:2400};for(let c=0;c!==s;++c){let l=r[c].createInterpolant(null);o[c]=l,l.settings=a}this._interpolantSettings=a,this._interpolants=o,this._propertyBindings=Array(s),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._restoreTimeScale=null,this._weightInterpolant=null,this.loop=2201,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(e){return this._startTime=e,this}setLoop(e,t){return this.loop=e,this.repetitions=t,this}setEffectiveWeight(e){return this.weight=e,this._effectiveWeight=this.enabled?e:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(e){return this._scheduleFading(e,0,1)}fadeOut(e){return this._scheduleFading(e,1,0)}crossFadeFrom(e,t,n=!1){if(e.fadeOut(t),this.fadeIn(t),n===!0){let i=this._clip.duration,r=e._clip.duration,s=r/i,o=i/r;e._restoreTimeScale=e.timeScale,this._restoreTimeScale=this.timeScale,e.warp(1,s,t),this.warp(o,1,t)}return this}crossFadeTo(e,t,n=!1){return e.crossFadeFrom(this,t,n)}stopFading(){let e=this._weightInterpolant;if(e!==null)this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(e);return this}setEffectiveTimeScale(e){return this.timeScale=e,this._effectiveTimeScale=this.paused?0:e,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(e){return this.timeScale=this._clip.duration/e,this.stopWarping()}syncWith(e){return this.time=e.time,this.timeScale=e.timeScale,this.stopWarping()}halt(e){return this.warp(this._effectiveTimeScale,0,e)}warp(e,t,n){let i=this._mixer,r=i.time,s=this.timeScale,o=this._timeScaleInterpolant;if(o===null)o=i._lendControlInterpolant(),this._timeScaleInterpolant=o;let a=o.parameterPositions,c=o.sampleValues;return a[0]=r,a[1]=r+n,c[0]=e/s,c[1]=t/s,this}stopWarping(){let e=this._timeScaleInterpolant;if(e!==null)this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(e);return this._restoreTimeScale=null,this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(e,t,n,i){if(!this.enabled){this._updateWeight(e);return}let r=this._startTime;if(r!==null){let a=(e-r)*n;if(a<0||n===0)t=0;else this._startTime=null,t=n*a}t*=this._updateTimeScale(e);let s=this._updateTime(t),o=this._updateWeight(e);if(o>0){let a=this._interpolants,c=this._propertyBindings;switch(this.blendMode){case 2501:for(let l=0,u=a.length;l!==u;++l)a[l].evaluate(s),c[l].accumulateAdditive(o);break;case 2500:default:for(let l=0,u=a.length;l!==u;++l)a[l].evaluate(s),c[l].accumulate(i,o)}}}_updateWeight(e){let t=0;if(this.enabled){t=this.weight;let n=this._weightInterpolant;if(n!==null){let i=n.evaluate(e)[0];if(t*=i,e>n.parameterPositions[1]){if(this.stopFading(),i===0)this.enabled=!1}}}return this._effectiveWeight=t,t}_updateTimeScale(e){let t=0;if(!this.paused){t=this.timeScale;let n=this._timeScaleInterpolant;if(n!==null){let i=n.evaluate(e)[0];if(t*=i,e>n.parameterPositions[1]){if(t===0)this.paused=!0;else{if(this._restoreTimeScale!==null)t=this._restoreTimeScale;this.timeScale=t}this.stopWarping()}}}return this._effectiveTimeScale=t,t}_updateTime(e){let t=this._clip.duration,n=this.loop,i=this.time+e,r=this._loopCount,s=n===2202;if(e===0){if(r===-1)return i;return s&&(r&1)===1?t-i:i}if(n===2200){if(r===-1)this._loopCount=0,this._setEndings(!0,!0,!1);e:{if(i>=t)i=t;else if(i<0)i=0;else{this.time=i;break e}if(this.clampWhenFinished)this.paused=!0;else this.enabled=!1;this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:e<0?-1:1})}}else{if(r===-1)if(e>=0)r=0,this._setEndings(!0,this.repetitions===0,s);else this._setEndings(this.repetitions===0,!0,s);if(i>=t||i<0){let o=Math.floor(i/t);i-=t*o,r+=Math.abs(o);let a=this.repetitions-r;if(a<=0){if(this.clampWhenFinished)this.paused=!0;else this.enabled=!1;i=e>0?t:0,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:e>0?1:-1})}else{if(a===1){let c=e<0;this._setEndings(c,!c,s)}else this._setEndings(!1,!1,s);this._loopCount=r,this.time=i,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:o})}}else this._loopCount=r,this.time=i;if(s&&(r&1)===1)return t-i}return i}_setEndings(e,t,n){let i=this._interpolantSettings;if(n)i.endingStart=2401,i.endingEnd=2401;else{if(e)i.endingStart=this.zeroSlopeAtStart?2401:2400;else i.endingStart=2402;if(t)i.endingEnd=this.zeroSlopeAtEnd?2401:2400;else i.endingEnd=2402}}_scheduleFading(e,t,n){let i=this._mixer,r=i.time,s=this._weightInterpolant;if(s===null)s=i._lendControlInterpolant(),this._weightInterpolant=s;let o=s.parameterPositions,a=s.sampleValues;return o[0]=r,a[0]=t,o[1]=r+e,a[1]=n,this}}var jb=new Float32Array(1);class _c extends Hn{constructor(e){super();if(this._root=e,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1,typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}_bindAction(e,t){let n=e._localRoot||this._root,i=e._clip.tracks,r=i.length,{_propertyBindings:s,_interpolants:o}=e,a=n.uuid,c=this._bindingsByRootAndName,l=c[a];if(l===void 0)l={},c[a]=l;for(let u=0;u!==r;++u){let f=i[u],h=f.name,d=l[h];if(d!==void 0)++d.referenceCount,s[u]=d;else{if(d=s[u],d!==void 0){if(d._cacheIndex===null)++d.referenceCount,this._addInactiveBinding(d,a,h);continue}let g=t&&t._propertyBindings[u].binding.parsedPath;d=new Mh(et.create(n,h,g),f.ValueTypeName,f.getValueSize()),++d.referenceCount,this._addInactiveBinding(d,a,h),s[u]=d}o[u].resultBuffer=d.buffer}}_activateAction(e){if(!this._isActiveAction(e)){if(e._cacheIndex===null){let n=(e._localRoot||this._root).uuid,i=e._clip.uuid,r=this._actionsByClip[i];this._bindAction(e,r&&r.knownActions[0]),this._addInactiveAction(e,i,n)}let t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){let r=t[n];if(r.useCount++===0)this._lendBinding(r),r.saveOriginalState()}this._lendAction(e)}}_deactivateAction(e){if(this._isActiveAction(e)){let t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){let r=t[n];if(--r.useCount===0)r.restoreOriginalState(),this._takeBackBinding(r)}this._takeBackAction(e)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;let e=this;this.stats={actions:{get total(){return e._actions.length},get inUse(){return e._nActiveActions}},bindings:{get total(){return e._bindings.length},get inUse(){return e._nActiveBindings}},controlInterpolants:{get total(){return e._controlInterpolants.length},get inUse(){return e._nActiveControlInterpolants}}}}_isActiveAction(e){let t=e._cacheIndex;return t!==null&&t<this._nActiveActions}_addInactiveAction(e,t,n){let i=this._actions,r=this._actionsByClip,s=r[t];if(s===void 0)s={knownActions:[e],actionByRoot:{}},e._byClipCacheIndex=0,r[t]=s;else{let o=s.knownActions;e._byClipCacheIndex=o.length,o.push(e)}e._cacheIndex=i.length,i.push(e),s.actionByRoot[n]=e}_removeInactiveAction(e){let t=this._actions,n=t[t.length-1],i=e._cacheIndex;n._cacheIndex=i,t[i]=n,t.pop(),e._cacheIndex=null;let r=e._clip.uuid,s=this._actionsByClip,o=s[r],a=o.knownActions,c=a[a.length-1],l=e._byClipCacheIndex;c._byClipCacheIndex=l,a[l]=c,a.pop(),e._byClipCacheIndex=null;let u=o.actionByRoot,f=(e._localRoot||this._root).uuid;if(delete u[f],a.length===0)delete s[r];this._removeInactiveBindingsForAction(e)}_removeInactiveBindingsForAction(e){let t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){let r=t[n];if(--r.referenceCount===0)this._removeInactiveBinding(r)}}_lendAction(e){let t=this._actions,n=e._cacheIndex,i=this._nActiveActions++,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_takeBackAction(e){let t=this._actions,n=e._cacheIndex,i=--this._nActiveActions,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_addInactiveBinding(e,t,n){let i=this._bindingsByRootAndName,r=this._bindings,s=i[t];if(s===void 0)s={},i[t]=s;s[n]=e,e._cacheIndex=r.length,r.push(e)}_removeInactiveBinding(e){let t=this._bindings,n=e.binding,i=n.rootNode.uuid,r=n.path,s=this._bindingsByRootAndName,o=s[i],a=t[t.length-1],c=e._cacheIndex;if(a._cacheIndex=c,t[c]=a,t.pop(),delete o[r],Object.keys(o).length===0)delete s[i]}_lendBinding(e){let t=this._bindings,n=e._cacheIndex,i=this._nActiveBindings++,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_takeBackBinding(e){let t=this._bindings,n=e._cacheIndex,i=--this._nActiveBindings,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_lendControlInterpolant(){let e=this._controlInterpolants,t=this._nActiveControlInterpolants++,n=e[t];if(n===void 0)n=new uc(new Float32Array(2),new Float32Array(2),1,jb),n.__cacheIndex=t,e[t]=n;return n}_takeBackControlInterpolant(e){let t=this._controlInterpolants,n=e.__cacheIndex,i=--this._nActiveControlInterpolants,r=t[i];e.__cacheIndex=i,t[i]=e,r.__cacheIndex=n,t[n]=r}clipAction(e,t,n){let i=t||this._root,r=i.uuid,s=typeof e==="string"?Jr.findByName(i,e):e,o=s!==null?s.uuid:e,a=this._actionsByClip[o],c=null;if(n===void 0)if(s!==null)n=s.blendMode;else n=2500;if(a!==void 0){let u=a.actionByRoot[r];if(u!==void 0&&u.blendMode===n)return u;if(c=a.knownActions[0],s===null)s=c._clip}if(s===null)return null;let l=new Eh(this,s,t,n);return this._bindAction(l,c),this._addInactiveAction(l,o,r),l}existingAction(e,t){let n=t||this._root,i=n.uuid,r=typeof e==="string"?Jr.findByName(n,e):e,s=r?r.uuid:e,o=this._actionsByClip[s];if(o!==void 0)return o.actionByRoot[i]||null;return null}stopAllAction(){let e=this._actions,t=this._nActiveActions;for(let n=t-1;n>=0;--n)e[n].stop();return this}update(e){e*=this.timeScale;let t=this._actions,n=this._nActiveActions,i=this.time+=e,r=Math.sign(e),s=this._accuIndex^=1;for(let c=0;c!==n;++c)t[c]._update(i,e,r,s);let o=this._bindings,a=this._nActiveBindings;for(let c=0;c!==a;++c)o[c].apply(s);return this}setTime(e){this.time=0;for(let t=0;t<this._actions.length;t++)this._actions[t].time=0;return this.update(e)}getRoot(){return this._root}uncacheClip(e){let t=this._actions,n=e.uuid,i=this._actionsByClip,r=i[n];if(r!==void 0){let s=r.knownActions;for(let o=0,a=s.length;o!==a;++o){let c=s[o];this._deactivateAction(c);let l=c._cacheIndex,u=t[t.length-1];c._cacheIndex=null,c._byClipCacheIndex=null,u._cacheIndex=l,t[l]=u,t.pop(),this._removeInactiveBindingsForAction(c)}delete i[n]}}uncacheRoot(e){let t=e.uuid,n=this._actionsByClip;for(let s in n){let o=n[s].actionByRoot,a=o[t];if(a!==void 0)this._deactivateAction(a),this._removeInactiveAction(a)}let i=this._bindingsByRootAndName,r=i[t];if(r!==void 0)for(let s in r){let o=r[s];o.restoreOriginalState(),this._removeInactiveBinding(o)}}uncacheAction(e,t){let n=this.existingAction(e,t);if(n!==null)this._deactivateAction(n),this._removeInactiveAction(n)}}class xo{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Ze(this.phi,0.000001,Math.PI-0.000001),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){if(this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0)this.theta=0,this.phi=0;else this.theta=Math.atan2(e,n),this.phi=Math.acos(Ze(t/this.radius,-1,1));return this}clone(){return new this.constructor().copy(this)}}class Ah{static{Ah.prototype.isMatrix2=!0}constructor(e,t,n,i){if(this.elements=[1,0,0,1],e!==void 0)this.set(e,t,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,i){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=i,this}}class xc extends Hn{constructor(e,t=null){super();this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(this.domElement!==null)this.disconnect();this.domElement=e}disconnect(){}dispose(){}update(){}}function Rh(e,t,n,i){let r=Kb(i);switch(n){case 1021:return e*t;case 1028:return e*t/r.components*r.byteLength;case 1029:return e*t/r.components*r.byteLength;case 1030:return e*t*2/r.components*r.byteLength;case 1031:return e*t*2/r.components*r.byteLength;case 1022:return e*t*3/r.components*r.byteLength;case 1023:return e*t*4/r.components*r.byteLength;case 1033:return e*t*4/r.components*r.byteLength;case 33776:case 33777:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case 33778:case 33779:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case 35841:case 35843:return Math.max(e,16)*Math.max(t,8)/4;case 35840:case 35842:return Math.max(e,8)*Math.max(t,8)/2;case 36196:case 37492:case 37488:case 37489:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case 37496:case 37490:case 37491:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case 37808:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case 37809:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case 37810:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case 37811:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case 37812:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case 37813:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case 37814:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case 37815:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case 37816:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case 37817:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case 37818:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case 37819:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case 37820:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case 37821:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case 36492:case 36494:case 36495:return Math.ceil(e/4)*Math.ceil(t/4)*16;case 36283:case 36284:return Math.ceil(e/4)*Math.ceil(t/4)*8;case 36285:case 36286:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function Kb(e){switch(e){case 1009:case 1010:return{byteLength:1,components:1};case 1012:case 1011:case 1016:return{byteLength:2,components:1};case 1017:case 1018:return{byteLength:2,components:4};case 1014:case 1013:case 1015:return{byteLength:4,components:1};case 35902:case 35899:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}if(typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));if(typeof window<"u")if(window.__THREE__)Ce("WARNING: Multiple instances of Three.js being imported.");else window.__THREE__="186";function fx(){let e=null,t=!1,n=null,i=null;function r(s,o){i=e.requestAnimationFrame(r),n(s,o)}return{start:function(){if(t===!0)return;if(n===null)return;if(e===null)return;i=e.requestAnimationFrame(r),t=!0},stop:function(){if(e!==null)e.cancelAnimationFrame(i);t=!1},setAnimationLoop:function(s){n=s},setContext:function(s){e=s}}}function Jb(e){let t=new WeakMap;function n(a,c){let{array:l,usage:u}=a,f=l.byteLength,h=e.createBuffer();e.bindBuffer(c,h),e.bufferData(c,l,u),a.onUploadCallback();let d;if(l instanceof Float32Array)d=e.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)d=e.HALF_FLOAT;else if(l instanceof Uint16Array)if(a.isFloat16BufferAttribute)d=e.HALF_FLOAT;else d=e.UNSIGNED_SHORT;else if(l instanceof Int16Array)d=e.SHORT;else if(l instanceof Uint32Array)d=e.UNSIGNED_INT;else if(l instanceof Int32Array)d=e.INT;else if(l instanceof Int8Array)d=e.BYTE;else if(l instanceof Uint8Array)d=e.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)d=e.UNSIGNED_BYTE;else throw Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:h,type:d,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:f}}function i(a,c,l){let{array:u,updateRanges:f}=c;if(e.bindBuffer(l,a),f.length===0)e.bufferSubData(l,0,u);else{f.sort((d,g)=>d.start-g.start);let h=0;for(let d=1;d<f.length;d++){let g=f[h],x=f[d];if(x.start<=g.start+g.count+1)g.count=Math.max(g.count,x.start+x.count-g.start);else++h,f[h]=x}f.length=h+1;for(let d=0,g=f.length;d<g;d++){let x=f[d];e.bufferSubData(l,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(a){if(a.isInterleavedBufferAttribute)a=a.data;return t.get(a)}function s(a){if(a.isInterleavedBufferAttribute)a=a.data;let c=t.get(a);if(c)e.deleteBuffer(c.buffer),t.delete(a)}function o(a,c){if(a.isInterleavedBufferAttribute)a=a.data;if(a.isGLBufferAttribute){let u=t.get(a);if(!u||u.version<a.version)t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=t.get(a);if(l===void 0)t.set(a,n(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,a,c),l.version=a.version}}return{get:r,remove:s,update:o}}var Qb=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,eM=`#ifdef USE_ALPHAHASH
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
#endif`,tM=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,nM=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,iM=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,rM=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,sM=`#ifdef USE_AOMAP
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
#endif`,oM=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,aM=`#ifdef USE_BATCHING
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
#endif`,cM=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,lM=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,uM=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,hM=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,fM=`#ifdef USE_IRIDESCENCE
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
#endif`,dM=`#ifdef USE_BUMPMAP
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
#endif`,pM=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,mM=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,gM=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,_M=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,xM=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,vM=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,yM=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,SM=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,bM=`#define PI 3.141592653589793
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
} // validated`,MM=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,wM=`vec3 transformedNormal = objectNormal;
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
#endif`,TM=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,EM=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,AM=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,RM=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,CM="gl_FragColor = linearToOutputTexel( gl_FragColor );",PM=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,IM=`#ifdef USE_ENVMAP
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
#endif`,LM=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,NM=`#ifdef USE_ENVMAP
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
#endif`,DM=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,OM=`#ifdef USE_ENVMAP
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
#endif`,UM=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,FM=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,zM=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,kM=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,BM=`#ifdef USE_GRADIENTMAP
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
}`,GM=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,HM=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,VM=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,WM=`uniform bool receiveShadow;
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
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
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
#include <lightprobes_pars_fragment>`,$M=`#ifdef USE_ENVMAP
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
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
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
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,ZM=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,XM=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,qM=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,YM=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,jM=`PhysicalMaterial material;
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
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
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
#endif`,KM=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
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
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
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
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
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
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
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
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
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
}`,JM=`
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
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
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
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
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
#endif`,QM=`#if defined( RE_IndirectDiffuse )
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
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,ew=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,tw=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,nw=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,iw=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,rw=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,sw=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,ow=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,aw=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,cw=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,lw=`#if defined( USE_POINTS_UV )
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
#endif`,uw=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,hw=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,fw=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,dw=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,pw=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,mw=`#ifdef USE_MORPHTARGETS
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
#endif`,gw=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,_w=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,xw=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,vw=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,yw=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Sw=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,bw=`#ifdef USE_NORMALMAP
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
#endif`,Mw=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,ww=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Tw=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Ew=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Aw=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Rw=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Cw=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Pw=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Iw=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Lw=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Nw=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Dw=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Ow=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
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
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
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
#endif`,Uw=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
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
#endif`,Fw=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
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
#endif`,zw=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
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
}`,kw=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Bw=`#ifdef USE_SKINNING
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
#endif`,Gw=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Hw=`#ifdef USE_SKINNING
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
#endif`,Vw=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Ww=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,$w=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Zw=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Xw=`#ifdef USE_TRANSMISSION
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
#endif`,qw=`#ifdef USE_TRANSMISSION
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
#endif`,Yw=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,jw=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Kw=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`;var Jw=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Qw=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,eT=`uniform sampler2D t2D;
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
}`,tT=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,nT=`#ifdef ENVMAP_TYPE_CUBE
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
}`,iT=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,rT=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,sT=`#include <common>
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
}`,oT=`#if DEPTH_PACKING == 3200
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
}`,aT=`#define DISTANCE
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
}`,cT=`#define DISTANCE
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
}`,lT=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,uT=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,hT=`uniform float scale;
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
}`,fT=`uniform vec3 diffuse;
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
}`,dT=`#include <common>
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
}`,pT=`uniform vec3 diffuse;
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
}`,mT=`#define LAMBERT
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
}`,gT=`#define LAMBERT
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
}`,_T=`#define MATCAP
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
}`,xT=`#define MATCAP
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
}`,vT=`#define NORMAL
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
}`,yT=`#define NORMAL
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
}`,ST=`#define PHONG
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
}`,bT=`#define PHONG
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
}`,MT=`#define STANDARD
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
}`,wT=`#define STANDARD
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
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
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
}`,TT=`#define TOON
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
}`,ET=`#define TOON
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
}`,AT=`uniform float size;
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
}`,RT=`uniform vec3 diffuse;
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
}`,CT=`#include <common>
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
}`,PT=`uniform vec3 color;
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
}`,IT=`uniform float rotation;
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
}`,LT=`uniform vec3 diffuse;
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
}`,We={alphahash_fragment:Qb,alphahash_pars_fragment:eM,alphamap_fragment:tM,alphamap_pars_fragment:nM,alphatest_fragment:iM,alphatest_pars_fragment:rM,aomap_fragment:sM,aomap_pars_fragment:oM,batching_pars_vertex:aM,batching_vertex:cM,begin_vertex:lM,beginnormal_vertex:uM,bsdfs:hM,iridescence_fragment:fM,bumpmap_pars_fragment:dM,clipping_planes_fragment:pM,clipping_planes_pars_fragment:mM,clipping_planes_pars_vertex:gM,clipping_planes_vertex:_M,color_fragment:xM,color_pars_fragment:vM,color_pars_vertex:yM,color_vertex:SM,common:bM,cube_uv_reflection_fragment:MM,defaultnormal_vertex:wM,displacementmap_pars_vertex:TM,displacementmap_vertex:EM,emissivemap_fragment:AM,emissivemap_pars_fragment:RM,colorspace_fragment:CM,colorspace_pars_fragment:PM,envmap_fragment:IM,envmap_common_pars_fragment:LM,envmap_pars_fragment:NM,envmap_pars_vertex:DM,envmap_physical_pars_fragment:$M,envmap_vertex:OM,fog_vertex:UM,fog_pars_vertex:FM,fog_fragment:zM,fog_pars_fragment:kM,gradientmap_pars_fragment:BM,lightmap_pars_fragment:GM,lights_lambert_fragment:HM,lights_lambert_pars_fragment:VM,lights_pars_begin:WM,lights_toon_fragment:ZM,lights_toon_pars_fragment:XM,lights_phong_fragment:qM,lights_phong_pars_fragment:YM,lights_physical_fragment:jM,lights_physical_pars_fragment:KM,lights_fragment_begin:JM,lights_fragment_maps:QM,lights_fragment_end:ew,lightprobes_pars_fragment:tw,logdepthbuf_fragment:nw,logdepthbuf_pars_fragment:iw,logdepthbuf_pars_vertex:rw,logdepthbuf_vertex:sw,map_fragment:ow,map_pars_fragment:aw,map_particle_fragment:cw,map_particle_pars_fragment:lw,metalnessmap_fragment:uw,metalnessmap_pars_fragment:hw,morphinstance_vertex:fw,morphcolor_vertex:dw,morphnormal_vertex:pw,morphtarget_pars_vertex:mw,morphtarget_vertex:gw,normal_fragment_begin:_w,normal_fragment_maps:xw,normal_pars_fragment:vw,normal_pars_vertex:yw,normal_vertex:Sw,normalmap_pars_fragment:bw,clearcoat_normal_fragment_begin:Mw,clearcoat_normal_fragment_maps:ww,clearcoat_pars_fragment:Tw,iridescence_pars_fragment:Ew,opaque_fragment:Aw,packing:Rw,premultiplied_alpha_fragment:Cw,project_vertex:Pw,dithering_fragment:Iw,dithering_pars_fragment:Lw,roughnessmap_fragment:Nw,roughnessmap_pars_fragment:Dw,shadowmap_pars_fragment:Ow,shadowmap_pars_vertex:Uw,shadowmap_vertex:Fw,shadowmask_pars_fragment:zw,skinbase_vertex:kw,skinning_pars_vertex:Bw,skinning_vertex:Gw,skinnormal_vertex:Hw,specularmap_fragment:Vw,specularmap_pars_fragment:Ww,tonemapping_fragment:$w,tonemapping_pars_fragment:Zw,transmission_fragment:Xw,transmission_pars_fragment:qw,uv_pars_fragment:Yw,uv_pars_vertex:jw,uv_vertex:Kw,worldpos_vertex:Jw,background_vert:Qw,background_frag:eT,backgroundCube_vert:tT,backgroundCube_frag:nT,cube_vert:iT,cube_frag:rT,depth_vert:sT,depth_frag:oT,distance_vert:aT,distance_frag:cT,equirect_vert:lT,equirect_frag:uT,linedashed_vert:hT,linedashed_frag:fT,meshbasic_vert:dT,meshbasic_frag:pT,meshlambert_vert:mT,meshlambert_frag:gT,meshmatcap_vert:_T,meshmatcap_frag:xT,meshnormal_vert:vT,meshnormal_frag:yT,meshphong_vert:ST,meshphong_frag:bT,meshphysical_vert:MT,meshphysical_frag:wT,meshtoon_vert:TT,meshtoon_frag:ET,points_vert:AT,points_frag:RT,shadow_vert:CT,shadow_frag:PT,sprite_vert:IT,sprite_frag:LT},fe={common:{diffuse:{value:new Oe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ze},alphaMap:{value:null},alphaMapTransform:{value:new ze},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ze}},envmap:{envMap:{value:null},envMapRotation:{value:new ze},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:0.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ze}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ze}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ze},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ze},normalScale:{value:new Ne(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ze},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ze}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ze}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ze}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:0.00025},fogNear:{value:1},fogFar:{value:2000},fogColor:{value:new Oe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new U},probesMax:{value:new U},probesResolution:{value:new U}},points:{diffuse:{value:new Oe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ze},alphaTest:{value:0},uvTransform:{value:new ze}},sprite:{diffuse:{value:new Oe(16777215)},opacity:{value:1},center:{value:new Ne(0.5,0.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ze},alphaMap:{value:null},alphaMapTransform:{value:new ze},alphaTest:{value:0}}},ci={basic:{uniforms:Kt([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.fog]),vertexShader:We.meshbasic_vert,fragmentShader:We.meshbasic_frag},lambert:{uniforms:Kt([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,fe.lights,{emissive:{value:new Oe(0)},envMapIntensity:{value:1}}]),vertexShader:We.meshlambert_vert,fragmentShader:We.meshlambert_frag},phong:{uniforms:Kt([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,fe.lights,{emissive:{value:new Oe(0)},specular:{value:new Oe(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:We.meshphong_vert,fragmentShader:We.meshphong_frag},standard:{uniforms:Kt([fe.common,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.roughnessmap,fe.metalnessmap,fe.fog,fe.lights,{emissive:{value:new Oe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:We.meshphysical_vert,fragmentShader:We.meshphysical_frag},toon:{uniforms:Kt([fe.common,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.gradientmap,fe.fog,fe.lights,{emissive:{value:new Oe(0)}}]),vertexShader:We.meshtoon_vert,fragmentShader:We.meshtoon_frag},matcap:{uniforms:Kt([fe.common,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,{matcap:{value:null}}]),vertexShader:We.meshmatcap_vert,fragmentShader:We.meshmatcap_frag},points:{uniforms:Kt([fe.points,fe.fog]),vertexShader:We.points_vert,fragmentShader:We.points_frag},dashed:{uniforms:Kt([fe.common,fe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:We.linedashed_vert,fragmentShader:We.linedashed_frag},depth:{uniforms:Kt([fe.common,fe.displacementmap]),vertexShader:We.depth_vert,fragmentShader:We.depth_frag},normal:{uniforms:Kt([fe.common,fe.bumpmap,fe.normalmap,fe.displacementmap,{opacity:{value:1}}]),vertexShader:We.meshnormal_vert,fragmentShader:We.meshnormal_frag},sprite:{uniforms:Kt([fe.sprite,fe.fog]),vertexShader:We.sprite_vert,fragmentShader:We.sprite_frag},background:{uniforms:{uvTransform:{value:new ze},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:We.background_vert,fragmentShader:We.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ze}},vertexShader:We.backgroundCube_vert,fragmentShader:We.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:We.cube_vert,fragmentShader:We.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:We.equirect_vert,fragmentShader:We.equirect_frag},distance:{uniforms:Kt([fe.common,fe.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1000}}]),vertexShader:We.distance_vert,fragmentShader:We.distance_frag},shadow:{uniforms:Kt([fe.lights,fe.fog,{color:{value:new Oe(0)},opacity:{value:1}}]),vertexShader:We.shadow_vert,fragmentShader:We.shadow_frag}};ci.physical={uniforms:Kt([ci.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ze},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ze},clearcoatNormalScale:{value:new Ne(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ze},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ze},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ze},sheen:{value:0},sheenColor:{value:new Oe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ze},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ze},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ze},transmissionSamplerSize:{value:new Ne},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ze},attenuationDistance:{value:0},attenuationColor:{value:new Oe(0)},specularColor:{value:new Oe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ze},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ze},anisotropyVector:{value:new Ne},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ze}}]),vertexShader:We.meshphysical_vert,fragmentShader:We.meshphysical_frag};var vc={r:0,b:0,g:0},NT=new Ge,dx=new ze;dx.set(-1,0,0,0,1,0,0,0,1);function DT(e,t,n,i,r,s){let o=new Oe(0),a=r===!0?0:1,c,l,u=null,f=0,h=null;function d(E){let R=E.isScene===!0?E.background:null;if(R&&R.isTexture){let S=E.backgroundBlurriness>0;R=t.get(R,S)}return R}function g(E){let R=!1,S=d(E);if(S===null)p(o,a);else if(S&&S.isColor)p(S,1),R=!0;let b=e.xr.getEnvironmentBlendMode();if(b==="additive")n.buffers.color.setClear(0,0,0,1,s);else if(b==="alpha-blend")n.buffers.color.setClear(0,0,0,0,s);if(e.autoClear||R)n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil)}function x(E,R){let S=d(R);if(S&&(S.isCubeTexture||S.mapping===eo)){if(l===void 0)l=new mt(new Yi(1,1,1),new Rn({name:"BackgroundCubeMaterial",uniforms:br(ci.backgroundCube.uniforms),vertexShader:ci.backgroundCube.vertexShader,fragmentShader:ci.backgroundCube.fragmentShader,side:Yt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(b,T,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l);if(l.material.uniforms.envMap.value=S,l.material.uniforms.backgroundBlurriness.value=R.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=R.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(NT.makeRotationFromEuler(R.backgroundRotation)).transpose(),S.isCubeTexture&&S.isRenderTargetTexture===!1)l.material.uniforms.backgroundRotation.value.premultiply(dx);if(l.material.toneMapped=$e.getTransfer(S.colorSpace)!==ft,u!==S||f!==S.version||h!==e.toneMapping)l.material.needsUpdate=!0,u=S,f=S.version,h=e.toneMapping;l.layers.enableAll(),E.unshift(l,l.geometry,l.material,0,0,null)}else if(S&&S.isTexture){if(c===void 0)c=new mt(new po(2,2),new Rn({name:"BackgroundMaterial",uniforms:br(ci.background.uniforms),vertexShader:ci.background.vertexShader,fragmentShader:ci.background.fragmentShader,side:Wi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c);if(c.material.uniforms.t2D.value=S,c.material.uniforms.backgroundIntensity.value=R.backgroundIntensity,c.material.toneMapped=$e.getTransfer(S.colorSpace)!==ft,S.matrixAutoUpdate===!0)S.updateMatrix();if(c.material.uniforms.uvTransform.value.copy(S.matrix),u!==S||f!==S.version||h!==e.toneMapping)c.material.needsUpdate=!0,u=S,f=S.version,h=e.toneMapping;c.layers.enableAll(),E.unshift(c,c.geometry,c.material,0,0,null)}}function p(E,R){E.getRGB(vc,fh(e)),n.buffers.color.setClear(vc.r,vc.g,vc.b,R,s)}function m(){if(l!==void 0)l.geometry.dispose(),l.material.dispose(),l=void 0;if(c!==void 0)c.geometry.dispose(),c.material.dispose(),c=void 0}return{getClearColor:function(){return o},setClearColor:function(E,R=1){o.set(E),a=R,p(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(E){a=E,p(o,a)},render:g,addToRenderList:x,dispose:m}}function OT(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},r=h(null),s=r,o=!1;function a(P,O,K,C,G){let X=!1,z=f(P,C,K,O);if(s!==z)s=z,l(s.object);if(X=d(P,C,K,G),X)g(P,C,K,G);if(G!==null)t.update(G,e.ELEMENT_ARRAY_BUFFER);if(X||o){if(o=!1,S(P,O,K,C),G!==null)e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(G).buffer)}}function c(){return e.createVertexArray()}function l(P){return e.bindVertexArray(P)}function u(P){return e.deleteVertexArray(P)}function f(P,O,K,C){let G=C.wireframe===!0,X=i[O.id];if(X===void 0)X={},i[O.id]=X;let z=P.isInstancedMesh===!0?P.id:0,te=X[z];if(te===void 0)te={},X[z]=te;let H=te[K.id];if(H===void 0)H={},te[K.id]=H;let Q=H[G];if(Q===void 0)Q=h(c()),H[G]=Q;return Q}function h(P){let O=[],K=[],C=[];for(let G=0;G<n;G++)O[G]=0,K[G]=0,C[G]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:K,attributeDivisors:C,object:P,attributes:{},index:null}}function d(P,O,K,C){let G=s.attributes,X=O.attributes,z=0,te=K.getAttributes();for(let H in te)if(te[H].location>=0){let ee=G[H],Te=X[H];if(Te===void 0){if(H==="instanceMatrix"&&P.instanceMatrix)Te=P.instanceMatrix;if(H==="instanceColor"&&P.instanceColor)Te=P.instanceColor}if(ee===void 0)return!0;if(ee.attribute!==Te)return!0;if(Te&&ee.data!==Te.data)return!0;z++}if(s.attributesNum!==z)return!0;if(s.index!==C)return!0;return!1}function g(P,O,K,C){let G={},X=O.attributes,z=0,te=K.getAttributes();for(let H in te)if(te[H].location>=0){let ee=X[H];if(ee===void 0){if(H==="instanceMatrix"&&P.instanceMatrix)ee=P.instanceMatrix;if(H==="instanceColor"&&P.instanceColor)ee=P.instanceColor}let Te={};if(Te.attribute=ee,ee&&ee.data)Te.data=ee.data;G[H]=Te,z++}s.attributes=G,s.attributesNum=z,s.index=C}function x(){let P=s.newAttributes;for(let O=0,K=P.length;O<K;O++)P[O]=0}function p(P){m(P,0)}function m(P,O){let K=s.newAttributes,C=s.enabledAttributes,G=s.attributeDivisors;if(K[P]=1,C[P]===0)e.enableVertexAttribArray(P),C[P]=1;if(G[P]!==O)e.vertexAttribDivisor(P,O),G[P]=O}function E(){let P=s.newAttributes,O=s.enabledAttributes;for(let K=0,C=O.length;K<C;K++)if(O[K]!==P[K])e.disableVertexAttribArray(K),O[K]=0}function R(P,O,K,C,G,X,z){if(z===!0)e.vertexAttribIPointer(P,O,K,G,X);else e.vertexAttribPointer(P,O,K,C,G,X)}function S(P,O,K,C){x();let G=C.attributes,X=K.getAttributes(),z=O.defaultAttributeValues;for(let te in X){let H=X[te];if(H.location>=0){let Q=G[te];if(Q===void 0){if(te==="instanceMatrix"&&P.instanceMatrix)Q=P.instanceMatrix;if(te==="instanceColor"&&P.instanceColor)Q=P.instanceColor}if(Q!==void 0){let ee=Q.normalized,Te=Q.itemSize,ve=t.get(Q);if(ve===void 0)continue;let{buffer:He,type:Me,bytesPerElement:Z}=ve,re=Me===e.INT||Me===e.UNSIGNED_INT||Q.gpuType===vu;if(Q.isInterleavedBufferAttribute){let se=Q.data,Pe=se.stride,Ie=Q.offset;if(se.isInstancedInterleavedBuffer){for(let we=0;we<H.locationSize;we++)m(H.location+we,se.meshPerAttribute);if(P.isInstancedMesh!==!0&&C._maxInstanceCount===void 0)C._maxInstanceCount=se.meshPerAttribute*se.count}else for(let we=0;we<H.locationSize;we++)p(H.location+we);e.bindBuffer(e.ARRAY_BUFFER,He);for(let we=0;we<H.locationSize;we++)R(H.location+we,Te/H.locationSize,Me,ee,Pe*Z,(Ie+Te/H.locationSize*we)*Z,re)}else{if(Q.isInstancedBufferAttribute){for(let se=0;se<H.locationSize;se++)m(H.location+se,Q.meshPerAttribute);if(P.isInstancedMesh!==!0&&C._maxInstanceCount===void 0)C._maxInstanceCount=Q.meshPerAttribute*Q.count}else for(let se=0;se<H.locationSize;se++)p(H.location+se);e.bindBuffer(e.ARRAY_BUFFER,He);for(let se=0;se<H.locationSize;se++)R(H.location+se,Te/H.locationSize,Me,ee,Te*Z,Te/H.locationSize*se*Z,re)}}else if(z!==void 0){let ee=z[te];if(ee!==void 0)switch(ee.length){case 2:e.vertexAttrib2fv(H.location,ee);break;case 3:e.vertexAttrib3fv(H.location,ee);break;case 4:e.vertexAttrib4fv(H.location,ee);break;default:e.vertexAttrib1fv(H.location,ee)}}}}E()}function b(){M();for(let P in i){let O=i[P];for(let K in O){let C=O[K];for(let G in C){let X=C[G];for(let z in X)u(X[z].object),delete X[z];delete C[G]}}delete i[P]}}function T(P){if(i[P.id]===void 0)return;let O=i[P.id];for(let K in O){let C=O[K];for(let G in C){let X=C[G];for(let z in X)u(X[z].object),delete X[z];delete C[G]}}delete i[P.id]}function A(P){for(let O in i){let K=i[O];for(let C in K){let G=K[C];if(G[P.id]===void 0)continue;let X=G[P.id];for(let z in X)u(X[z].object),delete X[z];delete G[P.id]}}}function _(P){for(let O in i){let K=i[O],C=P.isInstancedMesh===!0?P.id:0,G=K[C];if(G===void 0)continue;for(let X in G){let z=G[X];for(let te in z)u(z[te].object),delete z[te];delete G[X]}if(delete K[C],Object.keys(K).length===0)delete i[O]}}function M(){if(F(),o=!0,s===r)return;s=r,l(s.object)}function F(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:M,resetDefaultState:F,dispose:b,releaseStatesOfGeometry:T,releaseStatesOfObject:_,releaseStatesOfProgram:A,initAttributes:x,enableAttribute:p,disableUnusedAttributes:E}}function UT(e,t,n){let i;function r(c){i=c}function s(c,l){e.drawArrays(i,c,l),n.update(l,i,1)}function o(c,l,u){if(u===0)return;e.drawArraysInstanced(i,c,l,u),n.update(l,i,u)}function a(c,l,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,l,0,u);let h=0;for(let d=0;d<u;d++)h+=l[d];n.update(h,i,1)}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a}function FT(e,t,n,i){let r;function s(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===!0){let A=t.get("EXT_texture_filter_anisotropic");r=e.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(A){if(A!==si&&i.convert(A)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))return!1;return!0}function a(A){let _=A===ri&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));if(A!==Gn&&A!==Mi&&!_&&i.convert(A)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))return!1;return!0}function c(A){if(A==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";A="mediump"}if(A==="mediump"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0)return"mediump"}return"lowp"}let l=n.precision!==void 0?n.precision:"highp",u=c(l);if(u!==l)Ce("WebGLRenderer:",l,"not supported, using",u,"instead."),l=u;let f=n.logarithmicDepthBuffer===!0,h=n.reversedDepthBuffer===!0&&t.has("EXT_clip_control");if(n.reversedDepthBuffer===!0&&h===!1)Ce("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let d=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),g=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=e.getParameter(e.MAX_TEXTURE_SIZE),p=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),m=e.getParameter(e.MAX_VERTEX_ATTRIBS),E=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),R=e.getParameter(e.MAX_VARYING_VECTORS),S=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),b=e.getParameter(e.MAX_SAMPLES),T=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:h,maxTextures:d,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:E,maxVaryings:R,maxFragmentUniforms:S,maxSamples:b,samples:T}}function zT(e){let t=this,n=null,i=0,r=!1,s=!1,o=new Tn,a=new ze,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,h){let d=f.length!==0||h||i!==0||r;return r=h,i=f.length,d},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,h){n=u(f,h,0)},this.setState=function(f,h,d){let{clippingPlanes:g,clipIntersection:x,clipShadows:p}=f,m=e.get(f);if(!r||g===null||g.length===0||s&&!p)if(s)u(null);else l();else{let E=s?0:i,R=E*4,S=m.clippingState||null;c.value=S,S=u(g,h,R,d);for(let b=0;b!==R;++b)S[b]=n[b];m.clippingState=S,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=E}};function l(){if(c.value!==n)c.value=n,c.needsUpdate=i>0;t.numPlanes=i,t.numIntersection=0}function u(f,h,d,g){let x=f!==null?f.length:0,p=null;if(x!==0){if(p=c.value,g!==!0||p===null){let m=d+x*4,E=h.matrixWorldInverse;if(a.getNormalMatrix(E),p===null||p.length<m)p=new Float32Array(m);for(let R=0,S=d;R!==x;++R,S+=4)o.copy(f[R]).applyMatrix4(E,a),o.normal.toArray(p,S),p[S+3]=o.constant}c.value=p,c.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,p}}var ms=4,kT=6,BT=20,GT=256,vo=new wr,$0=new Oe,Ch=null,Ph=0,Ih=0,Lh=!1,HT=new U,Tr=new U;class Mo{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=0.1,i=100,r={}){let{size:s=256,position:o=HT}=r;Ch=this._renderer.getRenderTarget(),Ph=this._renderer.getActiveCubeFace(),Ih=this._renderer.getActiveMipmapLevel(),Lh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);let a=this._allocateTargets();if(a.depthBuffer=!0,this._sceneToCubeUV(e,n,i,a,o),t>0)this._blur(a,0,0,t);return this._applyPMREM(a),this._cleanup(a),a}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){if(this._cubemapMaterial===null)this._cubemapMaterial=q0(),this._compileMaterial(this._cubemapMaterial)}compileEquirectangularShader(){if(this._equirectMaterial===null)this._equirectMaterial=X0(),this._compileMaterial(this._equirectMaterial)}dispose(){if(this._dispose(),this._cubemapMaterial!==null)this._cubemapMaterial.dispose();if(this._equirectMaterial!==null)this._equirectMaterial.dispose();if(this._backgroundBox!==null)this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){if(this._blurMaterial!==null)this._blurMaterial.dispose();if(this._ggxMaterial!==null)this._ggxMaterial.dispose();if(this._pingPongRenderTarget!==null)this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Ch,Ph,Ih),this._renderer.xr.enabled=Lh,e.scissorTest=!1,ps(e,0,0,e.width,e.height)}_fromTexture(e,t){if(e.mapping===ts||e.mapping===mr)this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width);else this._setSize(e.image.width/4);Ch=this._renderer.getRenderTarget(),Ph=this._renderer.getActiveCubeFace(),Ih=this._renderer.getActiveMipmapLevel(),Lh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Gt,minFilter:Gt,generateMipmaps:!1,type:ri,format:si,colorSpace:gn,depthBuffer:!1},i=Z0(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){if(this._pingPongRenderTarget!==null)this._dispose();this._pingPongRenderTarget=Z0(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=VT(r)),this._blurMaterial=$T(r,e,t),this._ggxMaterial=WT(r,e,t)}return i}_compileMaterial(e){let t=new mt(new jt,e);this._renderer.compile(t,vo)}_sceneToCubeUV(e,t,n,i,r){let a=new Dt(90,1,t,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],u=this._renderer,{autoClear:f,toneMapping:h}=u;if(u.getClearColor($0),u.toneMapping=kn,u.autoClear=!1,u.state.buffers.depth.getReversed())u.setRenderTarget(i),u.clearDepth(),u.setRenderTarget(null);if(this._backgroundBox===null)this._backgroundBox=new mt(new Yi,new oi({name:"PMREM.Background",side:Yt,depthWrite:!1,depthTest:!1}));let g=this._backgroundBox,x=g.material,p=!1,m=e.background;if(m){if(m.isColor)x.color.copy(m),e.background=null,p=!0}else x.color.copy($0),p=!0;for(let E=0;E<6;E++){let R=E%3;if(R===0)a.up.set(0,c[E],0),a.position.set(r.x,r.y,r.z),a.lookAt(r.x+l[E],r.y,r.z);else if(R===1)a.up.set(0,0,c[E]),a.position.set(r.x,r.y,r.z),a.lookAt(r.x,r.y+l[E],r.z);else a.up.set(0,c[E],0),a.position.set(r.x,r.y,r.z),a.lookAt(r.x,r.y,r.z+l[E]);let S=this._cubeSize;if(ps(i,R*S,E>2?S:0,S,S),u.setRenderTarget(i),p)u.render(g,a);u.render(e,a)}u.toneMapping=h,u.autoClear=f,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===ts||e.mapping===mr;if(i){if(this._cubemapMaterial===null)this._cubemapMaterial=q0();this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1}else if(this._equirectMaterial===null)this._equirectMaterial=X0();let r=i?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=r;let o=r.uniforms;o.envMap.value=e;let a=this._cubeSize;ps(t,0,0,3*a,2*a),n.setRenderTarget(t),n.render(s,vo)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let i=this._lodMeshes.length;for(let r=1;r<i;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){let i=this._renderer,r=this._pingPongRenderTarget,s=this._ggxMaterial,o=this._lodMeshes[n];o.material=s;let a=s.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l),f=c*1.25,h=u*f,{_lodMax:d}=this,g=this._sizeLods[n],x=3*g*(n>d-ms?n-d+ms:0),p=4*(this._cubeSize-g);a.envMap.value=e.texture,a.roughness.value=h,a.mipInt.value=d-t,ps(r,x,p,3*g,2*g),i.setRenderTarget(r),i.render(o,vo),a.envMap.value=r.texture,a.roughness.value=0,a.mipInt.value=d-n,ps(e,x,p,3*g,2*g),i.setRenderTarget(e),i.render(o,vo)}_blur(e,t,n,i){let r=this._pingPongRenderTarget,s=Math.min(i,Math.PI)/Math.SQRT2;this._blurPass(e,r,t,n,s),this._blurPass(r,e,n,n,s)}_blurPass(e,t,n,i,r){let s=this._renderer,o=this._blurMaterial,a=this._lodMeshes[i];a.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=r,c.mipInt.value=this._lodMax-n;let l=this._sizeLods[i],u=3*l*(i>this._lodMax-ms?i-this._lodMax+ms:0),f=4*(this._cubeSize-l);ps(t,u,f,3*l,2*l),s.setRenderTarget(t),s.render(a,vo)}}function VT(e){let t=[],n=[],i=e,r=e-ms+1+kT;for(let s=0;s<r;s++){let o=Math.pow(2,i);t.push(o);let a=1/(o-2),c=-a,l=1+a,u=[c,c,l,c,l,l,c,c,l,l,c,l],f=6,h=6,d=3,g=new Float32Array(d*h*f),x=new Float32Array(d*h*f);for(let m=0;m<f;m++){let E=m%3*2/3-1,R=m>2?0:-1,S=[E,R,0,E+0.6666666666666666,R,0,E+0.6666666666666666,R+1,0,E,R,0,E+0.6666666666666666,R+1,0,E,R+1,0];g.set(S,d*h*m);for(let b=0;b<h;b++){let T=u[b*2]*2-1,A=u[b*2+1]*2-1;if(m===0)Tr.set(1,A,T);else if(m===1)Tr.set(-T,1,-A);else if(m===2)Tr.set(-T,A,1);else if(m===3)Tr.set(-1,A,-T);else if(m===4)Tr.set(-T,-1,A);else Tr.set(T,A,-1);Tr.toArray(x,(m*h+b)*d)}}let p=new jt;if(p.setAttribute("position",new Bt(g,d)),p.setAttribute("outputDirection",new Bt(x,d)),n.push(new mt(p,null)),i>ms)i--}return{lodMeshes:n,sizeLods:t}}function Z0(e,t,n){let i=new _n(e,t,n);return i.texture.mapping=eo,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function ps(e,t,n,i,r){e.viewport.set(t,n,i,r),e.scissor.set(t,n,i,r)}function WT(e,t,n){return new Rn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:GT,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Sc(),fragmentShader:`

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
		`,blending:ni,depthTest:!1,depthWrite:!1})}function $T(e,t,n){return new Rn({name:"SphericalGaussianBlur",defines:{SAMPLES:BT,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Sc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:ni,depthTest:!1,depthWrite:!1})}function X0(){return new Rn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Sc(),fragmentShader:`

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
		`,blending:ni,depthTest:!1,depthWrite:!1})}function q0(){return new Rn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Sc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ni,depthTest:!1,depthWrite:!1})}function Sc(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class Fh extends _n{constructor(e=1,t={}){super(e,e,t);this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new ac(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new Yi(5,5,5),r=new Rn({name:"CubemapFromEquirect",uniforms:br(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Yt,blending:ni});r.uniforms.tEquirect.value=t;let s=new mt(i,r),o=t.minFilter;if(t.minFilter===ii)t.minFilter=Gt;return new Sh(1,10,this).update(e,s),t.minFilter=o,s.geometry.dispose(),s.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){let r=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,n,i);e.setRenderTarget(r)}}function ZT(e){let t=new WeakMap,n=new WeakMap,i=null;function r(h,d=!1){if(h===null||h===void 0)return null;if(d)return o(h);return s(h)}function s(h){if(h&&h.isTexture){let d=h.mapping;if(d===Ga||d===Ha)if(t.has(h)){let g=t.get(h).texture;return a(g,h.mapping)}else{let g=h.image;if(g&&g.height>0){let x=new Fh(g.height);return x.fromEquirectangularTexture(e,h),t.set(h,x),h.addEventListener("dispose",l),a(x.texture,h.mapping)}else return null}}return h}function o(h){if(h&&h.isTexture){let d=h.mapping,g=d===Ga||d===Ha,x=d===ts||d===mr;if(g||x){let p=n.get(h),m=p!==void 0?p.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==m){if(i===null)i=new Mo(e);return p=g?i.fromEquirectangular(h,p):i.fromCubemap(h,p),p.texture.pmremVersion=h.pmremVersion,n.set(h,p),p.texture}else if(p!==void 0)return p.texture;else{let E=h.image;if(g&&E&&E.height>0||x&&E&&c(E)){if(i===null)i=new Mo(e);return p=g?i.fromEquirectangular(h):i.fromCubemap(h),p.texture.pmremVersion=h.pmremVersion,n.set(h,p),h.addEventListener("dispose",u),p.texture}else return null}}}return h}function a(h,d){if(d===Ga)h.mapping=ts;else if(d===Ha)h.mapping=mr;return h}function c(h){let d=0,g=6;for(let x=0;x<g;x++)if(h[x]!==void 0)d++;return d===g}function l(h){let d=h.target;d.removeEventListener("dispose",l);let g=t.get(d);if(g!==void 0)t.delete(d),g.dispose()}function u(h){let d=h.target;d.removeEventListener("dispose",u);let g=n.get(d);if(g!==void 0)n.delete(d),g.dispose()}function f(){if(t=new WeakMap,n=new WeakMap,i!==null)i.dispose(),i=null}return{get:r,dispose:f}}function XT(e){let t={};function n(i){if(t[i]!==void 0)return t[i];let r=e.getExtension(i);return t[i]=r,r}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){let r=n(i);if(r===null)dr("WebGLRenderer: "+i+" extension not supported.");return r}}}function qT(e,t,n,i){let r={},s=new WeakMap;function o(f){let h=f.target;if(h.index!==null)t.remove(h.index);for(let g in h.attributes)t.remove(h.attributes[g]);h.removeEventListener("dispose",o),delete r[h.id];let d=s.get(h);if(d)t.remove(d),s.delete(h);if(i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0)delete h._maxInstanceCount;n.memory.geometries--}function a(f,h){if(r[h.id]===!0)return h;return h.addEventListener("dispose",o),r[h.id]=!0,n.memory.geometries++,h}function c(f){let h=f.attributes;for(let d in h)t.update(h[d],e.ARRAY_BUFFER)}function l(f){let h=[],d=f.index,g=f.attributes.position,x=0;if(g===void 0)return;if(d!==null){let E=d.array;x=d.version;for(let R=0,S=E.length;R<S;R+=3){let b=E[R+0],T=E[R+1],A=E[R+2];h.push(b,T,T,A,A,b)}}else{let E=g.array;x=g.version;for(let R=0,S=E.length/3-1;R<S;R+=3){let b=R+0,T=R+1,A=R+2;h.push(b,T,T,A,A,b)}}let p=new(g.count>=65535?ic:nc)(h,1);p.version=x;let m=s.get(f);if(m)t.remove(m);s.set(f,p)}function u(f){let h=s.get(f);if(h){let d=f.index;if(d!==null){if(h.version<d.version)l(f)}}else l(f);return s.get(f)}return{get:a,update:c,getWireframeAttribute:u}}function YT(e,t,n){let i;function r(f){i=f}let s,o;function a(f){s=f.type,o=f.bytesPerElement}function c(f,h){e.drawElements(i,h,s,f*o),n.update(h,i,1)}function l(f,h,d){if(d===0)return;e.drawElementsInstanced(i,h,s,f*o,d),n.update(h,i,d)}function u(f,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,h,0,s,f,0,d);let x=0;for(let p=0;p<d;p++)x+=h[p];n.update(x,i,1)}this.setMode=r,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function jT(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(n.calls++,o){case e.TRIANGLES:n.triangles+=a*(s/3);break;case e.LINES:n.lines+=a*(s/2);break;case e.LINE_STRIP:n.lines+=a*(s-1);break;case e.LINE_LOOP:n.lines+=a*s;break;case e.POINTS:n.points+=a*s;break;default:Ue("WebGLInfo: Unknown draw mode:",o);break}}function r(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:r,update:i}}function KT(e,t,n){let i=new WeakMap,r=new at;function s(o,a,c){let l=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,f=u!==void 0?u.length:0,h=i.get(a);if(h===void 0||h.count!==f){let M=function(){A.dispose(),i.delete(a),a.removeEventListener("dispose",M)};if(h!==void 0)h.texture.dispose();let d=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,x=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],m=a.morphAttributes.normal||[],E=a.morphAttributes.color||[],R=0;if(d===!0)R=1;if(g===!0)R=2;if(x===!0)R=3;let S=a.attributes.position.count*R,b=1;if(S>t.maxTextureSize)b=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize;let T=new Float32Array(S*b*4*f),A=new ec(T,S,b,f);A.type=Mi,A.needsUpdate=!0;let _=R*4;for(let F=0;F<f;F++){let P=p[F],O=m[F],K=E[F],C=S*b*4*F;for(let G=0;G<P.count;G++){let X=G*_;if(d===!0)r.fromBufferAttribute(P,G),T[C+X+0]=r.x,T[C+X+1]=r.y,T[C+X+2]=r.z,T[C+X+3]=0;if(g===!0)r.fromBufferAttribute(O,G),T[C+X+4]=r.x,T[C+X+5]=r.y,T[C+X+6]=r.z,T[C+X+7]=0;if(x===!0)r.fromBufferAttribute(K,G),T[C+X+8]=r.x,T[C+X+9]=r.y,T[C+X+10]=r.z,T[C+X+11]=K.itemSize===4?r.w:1}}h={count:f,texture:A,size:new Ne(S,b)},i.set(a,h),a.addEventListener("dispose",M)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(e,"morphTexture",o.morphTexture,n);else{let d=0;for(let x=0;x<l.length;x++)d+=l[x];let g=a.morphTargetsRelative?1:1-d;c.getUniforms().setValue(e,"morphTargetBaseInfluence",g),c.getUniforms().setValue(e,"morphTargetInfluences",l)}c.getUniforms().setValue(e,"morphTargetsTexture",h.texture,n),c.getUniforms().setValue(e,"morphTargetsTextureSize",h.size)}return{update:s}}function JT(e,t,n,i,r){let s=new WeakMap;function o(l){let u=r.render.frame,f=l.geometry,h=t.get(l,f);if(s.get(h)!==u)t.update(h),s.set(h,u);if(l.isInstancedMesh){if(l.hasEventListener("dispose",c)===!1)l.addEventListener("dispose",c);if(s.get(l)!==u){if(n.update(l.instanceMatrix,e.ARRAY_BUFFER),l.instanceColor!==null)n.update(l.instanceColor,e.ARRAY_BUFFER);s.set(l,u)}}if(l.isSkinnedMesh){let d=l.skeleton;if(s.get(d)!==u)d.update(),s.set(d,u)}return h}function a(){s=new WeakMap}function c(l){let u=l.target;if(u.removeEventListener("dispose",c),i.releaseStatesOfObject(u),n.remove(u.instanceMatrix),u.instanceColor!==null)n.remove(u.instanceColor)}return{update:o,dispose:a}}var QT={[du]:"LINEAR_TONE_MAPPING",[pu]:"REINHARD_TONE_MAPPING",[mu]:"CINEON_TONE_MAPPING",[Qs]:"ACES_FILMIC_TONE_MAPPING",[_u]:"AGX_TONE_MAPPING",[xu]:"NEUTRAL_TONE_MAPPING",[gu]:"CUSTOM_TONE_MAPPING"};function eE(e,t,n,i,r,s){let o=new _n(t,n,{type:e,depthBuffer:r,stencilBuffer:s,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,c=null,l=new jt;l.setAttribute("position",new an([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new an([0,2,0,0,2,0],2));let u=new dh({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),f=new mt(l,u),h=new wr(-1,1,1,-1,0,1),d=null,g=null,x=!1,p,m=null,E=[],R=!1;this.setSize=function(S,b){if(o.setSize(S,b),a!==null)a.setSize(S,b);if(c!==null)c.setSize(S,b);for(let T=0;T<E.length;T++){let A=E[T];if(A.setSize)A.setSize(S,b)}},this.setEffects=function(S){E=S,R=E.length>0&&E[0].isRenderPass===!0;let{width:b,height:T}=o;if(E.length>0&&a===null)a=new _n(b,T,{type:ri,depthBuffer:!1,stencilBuffer:!1}),c=new _n(b,T,{type:ri,depthBuffer:!1,stencilBuffer:!1});for(let A=0;A<E.length;A++){let _=E[A];if(_.setSize)_.setSize(b,T)}},this.begin=function(S,b){if(x)return!1;if(S.toneMapping===kn&&E.length===0)return!1;if(m=b,b!==null){let{width:T,height:A}=b;if(o.width!==T||o.height!==A)this.setSize(T,A)}if(R===!1)S.setRenderTarget(o);return p=S.toneMapping,S.toneMapping=kn,!0},this.hasRenderPass=function(){return R},this.end=function(S,b){S.toneMapping=p,x=!0;let T=o,A=a;for(let _=0;_<E.length;_++){let M=E[_];if(M.enabled===!1)continue;if(M.render(S,A,T,b),M.needsSwap!==!1)T=A,A=A===a?c:a}if(d!==S.outputColorSpace||g!==S.toneMapping){if(d=S.outputColorSpace,g=S.toneMapping,u.defines={},$e.getTransfer(d)===ft)u.defines.SRGB_TRANSFER="";let _=QT[g];if(_)u.defines[_]="";u.needsUpdate=!0}u.uniforms.tDiffuse.value=T.texture,S.setRenderTarget(m),S.render(f,h),m=null,x=!1},this.isCompositing=function(){return x},this.dispose=function(){if(o.dispose(),a!==null)a.dispose();if(c!==null)c.dispose();l.dispose(),u.dispose()}}var px=new Tt,Oh=new Sr(1,1),mx=new ec,gx=new uh,_x=new ac,Y0=[],j0=[],K0=new Float32Array(16),J0=new Float32Array(9),Q0=new Float32Array(4);function gs(e,t,n){let i=e[0];if(i<=0||i>0)return e;let r=t*n,s=Y0[r];if(s===void 0)s=new Float32Array(r),Y0[r]=s;if(t!==0){i.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=n,e[o].toArray(s,a)}return s}function Ot(e,t){if(e.length!==t.length)return!1;for(let n=0,i=e.length;n<i;n++)if(e[n]!==t[n])return!1;return!0}function Ut(e,t){for(let n=0,i=t.length;n<i;n++)e[n]=t[n]}function bc(e,t){let n=j0[t];if(n===void 0)n=new Int32Array(t),j0[t]=n;for(let i=0;i!==t;++i)n[i]=e.allocateTextureUnit();return n}function tE(e,t){let n=this.cache;if(n[0]===t)return;e.uniform1f(this.addr,t),n[0]=t}function nE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y)e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y}else{if(Ot(n,t))return;e.uniform2fv(this.addr,t),Ut(n,t)}}function iE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z}else if(t.r!==void 0){if(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b}else{if(Ot(n,t))return;e.uniform3fv(this.addr,t),Ut(n,t)}}function rE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w}else{if(Ot(n,t))return;e.uniform4fv(this.addr,t),Ut(n,t)}}function sE(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(Ot(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Ut(n,t)}else{if(Ot(n,i))return;Q0.set(i),e.uniformMatrix2fv(this.addr,!1,Q0),Ut(n,i)}}function oE(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(Ot(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Ut(n,t)}else{if(Ot(n,i))return;J0.set(i),e.uniformMatrix3fv(this.addr,!1,J0),Ut(n,i)}}function aE(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(Ot(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Ut(n,t)}else{if(Ot(n,i))return;K0.set(i),e.uniformMatrix4fv(this.addr,!1,K0),Ut(n,i)}}function cE(e,t){let n=this.cache;if(n[0]===t)return;e.uniform1i(this.addr,t),n[0]=t}function lE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y)e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y}else{if(Ot(n,t))return;e.uniform2iv(this.addr,t),Ut(n,t)}}function uE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z}else{if(Ot(n,t))return;e.uniform3iv(this.addr,t),Ut(n,t)}}function hE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w}else{if(Ot(n,t))return;e.uniform4iv(this.addr,t),Ut(n,t)}}function fE(e,t){let n=this.cache;if(n[0]===t)return;e.uniform1ui(this.addr,t),n[0]=t}function dE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y)e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y}else{if(Ot(n,t))return;e.uniform2uiv(this.addr,t),Ut(n,t)}}function pE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z}else{if(Ot(n,t))return;e.uniform3uiv(this.addr,t),Ut(n,t)}}function mE(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w}else{if(Ot(n,t))return;e.uniform4uiv(this.addr,t),Ut(n,t)}}function gE(e,t,n){let i=this.cache,r=n.allocateTextureUnit();if(i[0]!==r)e.uniform1i(this.addr,r),i[0]=r;let s;if(this.type===e.SAMPLER_2D_SHADOW)Oh.compareFunction=n.isReversedDepthBuffer()?Qa:Ja,s=Oh;else s=px;n.setTexture2D(t||s,r)}function _E(e,t,n){let i=this.cache,r=n.allocateTextureUnit();if(i[0]!==r)e.uniform1i(this.addr,r),i[0]=r;n.setTexture3D(t||gx,r)}function xE(e,t,n){let i=this.cache,r=n.allocateTextureUnit();if(i[0]!==r)e.uniform1i(this.addr,r),i[0]=r;n.setTextureCube(t||_x,r)}function vE(e,t,n){let i=this.cache,r=n.allocateTextureUnit();if(i[0]!==r)e.uniform1i(this.addr,r),i[0]=r;n.setTexture2DArray(t||mx,r)}function yE(e){switch(e){case 5126:return tE;case 35664:return nE;case 35665:return iE;case 35666:return rE;case 35674:return sE;case 35675:return oE;case 35676:return aE;case 5124:case 35670:return cE;case 35667:case 35671:return lE;case 35668:case 35672:return uE;case 35669:case 35673:return hE;case 5125:return fE;case 36294:return dE;case 36295:return pE;case 36296:return mE;case 35678:case 36198:case 36298:case 36306:case 35682:return gE;case 35679:case 36299:case 36307:return _E;case 35680:case 36300:case 36308:case 36293:return xE;case 36289:case 36303:case 36311:case 36292:return vE}}function SE(e,t){e.uniform1fv(this.addr,t)}function bE(e,t){let n=gs(t,this.size,2);e.uniform2fv(this.addr,n)}function ME(e,t){let n=gs(t,this.size,3);e.uniform3fv(this.addr,n)}function wE(e,t){let n=gs(t,this.size,4);e.uniform4fv(this.addr,n)}function TE(e,t){let n=gs(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function EE(e,t){let n=gs(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function AE(e,t){let n=gs(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function RE(e,t){e.uniform1iv(this.addr,t)}function CE(e,t){e.uniform2iv(this.addr,t)}function PE(e,t){e.uniform3iv(this.addr,t)}function IE(e,t){e.uniform4iv(this.addr,t)}function LE(e,t){e.uniform1uiv(this.addr,t)}function NE(e,t){e.uniform2uiv(this.addr,t)}function DE(e,t){e.uniform3uiv(this.addr,t)}function OE(e,t){e.uniform4uiv(this.addr,t)}function UE(e,t,n){let i=this.cache,r=t.length,s=bc(n,r);if(!Ot(i,s))e.uniform1iv(this.addr,s),Ut(i,s);let o;if(this.type===e.SAMPLER_2D_SHADOW)o=Oh;else o=px;for(let a=0;a!==r;++a)n.setTexture2D(t[a]||o,s[a])}function FE(e,t,n){let i=this.cache,r=t.length,s=bc(n,r);if(!Ot(i,s))e.uniform1iv(this.addr,s),Ut(i,s);for(let o=0;o!==r;++o)n.setTexture3D(t[o]||gx,s[o])}function zE(e,t,n){let i=this.cache,r=t.length,s=bc(n,r);if(!Ot(i,s))e.uniform1iv(this.addr,s),Ut(i,s);for(let o=0;o!==r;++o)n.setTextureCube(t[o]||_x,s[o])}function kE(e,t,n){let i=this.cache,r=t.length,s=bc(n,r);if(!Ot(i,s))e.uniform1iv(this.addr,s),Ut(i,s);for(let o=0;o!==r;++o)n.setTexture2DArray(t[o]||mx,s[o])}function BE(e){switch(e){case 5126:return SE;case 35664:return bE;case 35665:return ME;case 35666:return wE;case 35674:return TE;case 35675:return EE;case 35676:return AE;case 5124:case 35670:return RE;case 35667:case 35671:return CE;case 35668:case 35672:return PE;case 35669:case 35673:return IE;case 5125:return LE;case 36294:return NE;case 36295:return DE;case 36296:return OE;case 35678:case 36198:case 36298:case 36306:case 35682:return UE;case 35679:case 36299:case 36307:return FE;case 35680:case 36300:case 36308:case 36293:return zE;case 36289:case 36303:case 36311:case 36292:return kE}}class xx{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=yE(t.type)}}class vx{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=BE(t.type)}}class yx{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let r=0,s=i.length;r!==s;++r){let o=i[r];o.setValue(e,t[o.id],n)}}}var Nh=/(\w+)(\])?(\[|\.)?/g;function ex(e,t){e.seq.push(t),e.map[t.id]=t}function GE(e,t,n){let i=e.name,r=i.length;Nh.lastIndex=0;while(!0){let s=Nh.exec(i),o=Nh.lastIndex,a=s[1],c=s[2]==="]",l=s[3];if(c)a=a|0;if(l===void 0||l==="["&&o+2===r){ex(n,l===void 0?new xx(a,e,t):new vx(a,e,t));break}else{let f=n.map[a];if(f===void 0)f=new yx(a),ex(n,f);n=f}}}class bo{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let o=e.getActiveUniform(t,s),a=e.getUniformLocation(t,o.name);GE(o,a,this)}let i=[],r=[];for(let s of this.seq)if(s.type===e.SAMPLER_2D_SHADOW||s.type===e.SAMPLER_CUBE_SHADOW||s.type===e.SAMPLER_2D_ARRAY_SHADOW)i.push(s);else r.push(s);if(i.length>0)this.seq=i.concat(r)}setValue(e,t,n,i){let r=this.map[t];if(r!==void 0)r.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];if(i!==void 0)this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,s=t.length;r!==s;++r){let o=t[r],a=n[o.id];if(a.needsUpdate!==!1)o.setValue(e,a.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,r=e.length;i!==r;++i){let s=e[i];if(s.id in t)n.push(s)}return n}}function tx(e,t,n){let i=e.createShader(t);return e.shaderSource(i,n),e.compileShader(i),i}var HE=37297,VE=0;function WE(e,t){let n=e.split(`
`),i=[],r=Math.max(t-6,0),s=Math.min(t+6,n.length);for(let o=r;o<s;o++){let a=o+1;i.push(`${a===t?">":" "} ${a}: ${n[o]}`)}return i.join(`
`)}var nx=new ze;function $E(e){$e._getMatrix(nx,$e.workingColorSpace,e);let t=`mat3( ${nx.elements.map((n)=>n.toFixed(4))} )`;switch($e.getTransfer(e)){case rh:return[t,"LinearTransferOETF"];case ft:return[t,"sRGBTransferOETF"];default:return Ce("WebGLProgram: Unsupported color space: ",e),[t,"LinearTransferOETF"]}}function ix(e,t,n){let i=e.getShaderParameter(t,e.COMPILE_STATUS),s=(e.getShaderInfoLog(t)||"").trim();if(i&&s==="")return"";let o=/ERROR: 0:(\d+)/.exec(s);if(o){let a=parseInt(o[1]);return n.toUpperCase()+`

`+s+`

`+WE(e.getShaderSource(t),a)}else return s}function ZE(e,t){let n=$E(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,"}"].join(`
`)}var XE={[du]:"Linear",[pu]:"Reinhard",[mu]:"Cineon",[Qs]:"ACESFilmic",[_u]:"AgX",[xu]:"Neutral",[gu]:"Custom"};function qE(e,t){let n=XE[t];if(n===void 0)return Ce("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }";return"vec3 "+e+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}var yc=new U;function YE(){$e.getLuminanceCoefficients(yc);let e=yc.x.toFixed(4),t=yc.y.toFixed(4),n=yc.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${n} );`,"\treturn dot( weights, rgb );","}"].join(`
`)}function jE(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(So).join(`
`)}function KE(e){let t=[];for(let n in e){let i=e[n];if(i===!1)continue;t.push("#define "+n+" "+i)}return t.join(`
`)}function JE(e,t){let n={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let s=e.getActiveAttrib(t,r),o=s.name,a=1;if(s.type===e.FLOAT_MAT2)a=2;if(s.type===e.FLOAT_MAT3)a=3;if(s.type===e.FLOAT_MAT4)a=4;n[o]={type:s.type,location:e.getAttribLocation(t,o),locationSize:a}}return n}function So(e){return e!==""}function rx(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function sx(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var QE=/^[ \t]*#include +<([\w\d./]+)>/gm;function Uh(e){return e.replace(QE,tA)}var eA=new Map;function tA(e,t){let n=We[t];if(n===void 0){let i=eA.get(t);if(i!==void 0)n=We[i],Ce('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Uh(n)}var nA=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ox(e){return e.replace(nA,iA)}function iA(e,t,n,i){let r="";for(let s=parseInt(t);s<parseInt(n);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function ax(e){let t=`precision ${e.precision} float;
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
#define LOW_PRECISION`;return t}var rA={[Ks]:"SHADOWMAP_TYPE_PCF",[Qr]:"SHADOWMAP_TYPE_VSM"};function sA(e){return rA[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var oA={[ts]:"ENVMAP_TYPE_CUBE",[mr]:"ENVMAP_TYPE_CUBE",[eo]:"ENVMAP_TYPE_CUBE_UV"};function aA(e){if(e.envMap===!1)return"ENVMAP_TYPE_CUBE";return oA[e.envMapMode]||"ENVMAP_TYPE_CUBE"}var cA={[mr]:"ENVMAP_MODE_REFRACTION"};function lA(e){if(e.envMap===!1)return"ENVMAP_MODE_REFLECTION";return cA[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}var uA={[m0]:"ENVMAP_BLENDING_MULTIPLY",[g0]:"ENVMAP_BLENDING_MIX",[_0]:"ENVMAP_BLENDING_ADD"};function hA(e){if(e.envMap===!1)return"ENVMAP_BLENDING_NONE";return uA[e.combine]||"ENVMAP_BLENDING_NONE"}function fA(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,n),112)),texelHeight:i,maxMip:n}}function dA(e,t,n,i){let r=e.getContext(),{defines:s,vertexShader:o,fragmentShader:a}=n,c=sA(n),l=aA(n),u=lA(n),f=hA(n),h=fA(n),d=jE(n),g=KE(s),x=r.createProgram(),p,m,E=n.glslVersion?"#version "+n.glslVersion+`
`:"";if(n.isRawShaderMaterial){if(p=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,g].filter(So).join(`
`),p.length>0)p+=`
`;if(m=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,g].filter(So).join(`
`),m.length>0)m+=`
`}else p=[ax(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,g,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+u:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","\tattribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","\tattribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","\tuniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","\tattribute vec2 uv1;","#endif","#ifdef USE_UV2","\tattribute vec2 uv2;","#endif","#ifdef USE_UV3","\tattribute vec2 uv3;","#endif","#ifdef USE_TANGENT","\tattribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","\tattribute vec4 color;","#elif defined( USE_COLOR )","\tattribute vec3 color;","#endif","#ifdef USE_SKINNING","\tattribute vec4 skinIndex;","\tattribute vec4 skinWeight;","#endif",`
`].filter(So).join(`
`),m=[ax(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,g,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+l:"",n.envMap?"#define "+u:"",n.envMap?"#define "+f:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.retroreflection?"#define USE_RETROREFLECTION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==kn?"#define TONE_MAPPING":"",n.toneMapping!==kn?We.tonemapping_pars_fragment:"",n.toneMapping!==kn?qE("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",We.colorspace_pars_fragment,ZE("linearToOutputTexel",n.outputColorSpace),YE(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(So).join(`
`);if(o=Uh(o),o=rx(o,n),o=sx(o,n),a=Uh(a),a=rx(a,n),a=sx(a,n),o=ox(o),a=ox(a),n.isRawShaderMaterial!==!0)E=`#version 300 es
`,p=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",n.glslVersion===sh?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===sh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m;let R=E+p+o,S=E+m+a,b=tx(r,r.VERTEX_SHADER,R),T=tx(r,r.FRAGMENT_SHADER,S);if(r.attachShader(x,b),r.attachShader(x,T),n.index0AttributeName!==void 0)r.bindAttribLocation(x,0,n.index0AttributeName);else if(n.hasPositionAttribute===!0)r.bindAttribLocation(x,0,"position");r.linkProgram(x);function A(P){if(e.debug.checkShaderErrors){let O=r.getProgramInfoLog(x)||"",K=r.getShaderInfoLog(b)||"",C=r.getShaderInfoLog(T)||"",G=O.trim(),X=K.trim(),z=C.trim(),te=!0,H=!0;if(r.getProgramParameter(x,r.LINK_STATUS)===!1)if(te=!1,typeof e.debug.onShaderError==="function")e.debug.onShaderError(r,x,b,T);else{let Q=ix(r,b,"vertex"),ee=ix(r,T,"fragment");Ue("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(x,r.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+G+`
`+Q+`
`+ee)}else if(G!=="")Ce("WebGLProgram: Program Info Log:",G);else if(X===""||z==="")H=!1;if(H)P.diagnostics={runnable:te,programLog:G,vertexShader:{log:X,prefix:p},fragmentShader:{log:z,prefix:m}}}r.deleteShader(b),r.deleteShader(T),_=new bo(r,x),M=JE(r,x)}let _;this.getUniforms=function(){if(_===void 0)A(this);return _};let M;this.getAttributes=function(){if(M===void 0)A(this);return M};let F=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){if(F===!1)F=r.getProgramParameter(x,HE);return F},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(x),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=VE++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=b,this.fragmentShader=T,this}var pA=0;class Sx{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let i=this._getShaderCacheForMaterial(e);if(i.has(t)===!1)i.add(t),t.usedTimes++;if(i.has(n)===!1)i.add(n),n.usedTimes++;return this}remove(e){let t=this.materialCache.get(e);for(let n of t)if(n.usedTimes--,n.usedTimes===0)this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);if(n===void 0)n=new Set,t.set(e,n);return n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);if(n===void 0)n=new bx(e),t.set(e,n);return n}}class bx{constructor(e){this.id=pA++,this.code=e,this.usedTimes=0}}function mA(e){return e===vr||e===Ya||e===ja}function gA(e,t,n,i,r,s){let o=new tc,a=new Sx,c=new Set,l=[],u=new Map,{logarithmicDepthBuffer:f,precision:h}=i,d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(_){if(c.add(_),_===0)return"uv";return`uv${_}`}function x(_,M,F,P,O,K){let C=P.fog,G=O.geometry,X=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?P.environment:null,z=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,te=t.get(_.envMap||X,z),H=!!te&&te.mapping===eo?te.image.height:null,Q=d[_.type];if(_.precision!==null){if(h=i.getMaxPrecision(_.precision),h!==_.precision)Ce("WebGLProgram.getParameters:",_.precision,"not supported, using",h,"instead.")}let ee=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,Te=ee!==void 0?ee.length:0,ve=0;if(G.morphAttributes.position!==void 0)ve=1;if(G.morphAttributes.normal!==void 0)ve=2;if(G.morphAttributes.color!==void 0)ve=3;let He,Me,Z,re;if(Q){let dt=ci[Q];He=dt.vertexShader,Me=dt.fragmentShader}else{He=_.vertexShader,Me=_.fragmentShader;let dt=a.getVertexShaderStage(_),it=a.getFragmentShaderStage(_);a.update(_,dt,it),Z=dt.id,re=it.id}let se=e.getRenderTarget(),Pe=e.state.buffers.depth.getReversed(),Ie=O.isInstancedMesh===!0,we=O.isBatchedMesh===!0,gt=!!_.map,ke=!!_.matcap,Xe=!!te,st=!!_.aoMap,Ke=!!_.lightMap,Ht=!!_.bumpMap&&_.wireframe===!1,_t=!!_.normalMap,rn=!!_.displacementMap,Lt=!!_.emissiveMap,Nt=!!_.metalnessMap,L=!!_.roughnessMap,sn=_.anisotropy>0,nt=_.clearcoat>0,St=_.dispersion>0,w=_.retroreflectivity>0,v=_.iridescence>0,I=_.sheen>0,V=_.transmission>0,ie=sn&&!!_.anisotropyMap,ae=nt&&!!_.clearcoatMap,ue=nt&&!!_.clearcoatNormalMap,q=nt&&!!_.clearcoatRoughnessMap,J=v&&!!_.iridescenceMap,ge=v&&!!_.iridescenceThicknessMap,Ae=I&&!!_.sheenColorMap,he=I&&!!_.sheenRoughnessMap,oe=!!_.specularMap,Le=!!_.specularColorMap,De=!!_.specularIntensityMap,Qe=V&&!!_.transmissionMap,D=V&&!!_.thicknessMap,ce=!!_.gradientMap,Y=!!_.alphaMap,le=_.alphaTest>0,_e=!!_.alphaHash,ne=!!_.extensions,de=kn;if(_.toneMapped){if(se===null||se.isXRRenderTarget===!0)de=e.toneMapping}let Be={shaderID:Q,shaderType:_.type,shaderName:_.name,vertexShader:He,fragmentShader:Me,defines:_.defines,customVertexShaderID:Z,customFragmentShaderID:re,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:h,batching:we,batchingColor:we&&O._colorsTexture!==null,instancing:Ie,instancingColor:Ie&&O.instanceColor!==null,instancingMorph:Ie&&O.morphTexture!==null,outputColorSpace:se===null?e.outputColorSpace:se.isXRRenderTarget===!0?se.texture.colorSpace:$e.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:gt,matcap:ke,envMap:Xe,envMapMode:Xe&&te.mapping,envMapCubeUVHeight:H,aoMap:st,lightMap:Ke,bumpMap:Ht,normalMap:_t,displacementMap:rn,emissiveMap:Lt,normalMapObjectSpace:_t&&_.normalMapType===T0,normalMapTangentSpace:_t&&_.normalMapType===ih,packedNormalMap:_t&&_.normalMapType===ih&&mA(_.normalMap.format),metalnessMap:Nt,roughnessMap:L,anisotropy:sn,anisotropyMap:ie,clearcoat:nt,clearcoatMap:ae,clearcoatNormalMap:ue,clearcoatRoughnessMap:q,dispersion:St,retroreflection:w,iridescence:v,iridescenceMap:J,iridescenceThicknessMap:ge,sheen:I,sheenColorMap:Ae,sheenRoughnessMap:he,specularMap:oe,specularColorMap:Le,specularIntensityMap:De,transmission:V,transmissionMap:Qe,thicknessMap:D,gradientMap:ce,opaque:_.transparent===!1&&_.blending===Js&&_.alphaToCoverage===!1,alphaMap:Y,alphaTest:le,alphaHash:_e,combine:_.combine,mapUv:gt&&g(_.map.channel),aoMapUv:st&&g(_.aoMap.channel),lightMapUv:Ke&&g(_.lightMap.channel),bumpMapUv:Ht&&g(_.bumpMap.channel),normalMapUv:_t&&g(_.normalMap.channel),displacementMapUv:rn&&g(_.displacementMap.channel),emissiveMapUv:Lt&&g(_.emissiveMap.channel),metalnessMapUv:Nt&&g(_.metalnessMap.channel),roughnessMapUv:L&&g(_.roughnessMap.channel),anisotropyMapUv:ie&&g(_.anisotropyMap.channel),clearcoatMapUv:ae&&g(_.clearcoatMap.channel),clearcoatNormalMapUv:ue&&g(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:q&&g(_.clearcoatRoughnessMap.channel),iridescenceMapUv:J&&g(_.iridescenceMap.channel),iridescenceThicknessMapUv:ge&&g(_.iridescenceThicknessMap.channel),sheenColorMapUv:Ae&&g(_.sheenColorMap.channel),sheenRoughnessMapUv:he&&g(_.sheenRoughnessMap.channel),specularMapUv:oe&&g(_.specularMap.channel),specularColorMapUv:Le&&g(_.specularColorMap.channel),specularIntensityMapUv:De&&g(_.specularIntensityMap.channel),transmissionMapUv:Qe&&g(_.transmissionMap.channel),thicknessMapUv:D&&g(_.thicknessMap.channel),alphaMapUv:Y&&g(_.alphaMap.channel),vertexTangents:!!G.attributes.tangent&&(_t||sn),vertexNormals:!!G.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!G.attributes.uv&&(gt||Y),fog:!!C,useFog:_.fog===!0,fogExp2:!!C&&C.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||G.attributes.normal===void 0&&_t===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:Pe,skinning:O.isSkinnedMesh===!0,hasPositionAttribute:G.attributes.position!==void 0,morphTargets:G.morphAttributes.position!==void 0,morphNormals:G.morphAttributes.normal!==void 0,morphColors:G.morphAttributes.color!==void 0,morphTargetsCount:Te,morphTextureStride:ve,numSunLights:M.sun.length,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numSunLightShadows:M.sunShadowMap.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numLightProbeGrids:K.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:_.dithering,shadowMapEnabled:e.shadowMap.enabled&&F.length>0,shadowMapType:e.shadowMap.type,toneMapping:de,decodeVideoTexture:gt&&_.map.isVideoTexture===!0&&$e.getTransfer(_.map.colorSpace)===ft,decodeVideoTextureEmissive:Lt&&_.emissiveMap.isVideoTexture===!0&&$e.getTransfer(_.emissiveMap.colorSpace)===ft,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===An,flipSided:_.side===Yt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:ne&&_.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ne&&_.extensions.multiDraw===!0||we)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Be.vertexUv1s=c.has(1),Be.vertexUv2s=c.has(2),Be.vertexUv3s=c.has(3),c.clear(),Be}function p(_){let M=[];if(_.shaderID)M.push(_.shaderID);else M.push(_.customVertexShaderID),M.push(_.customFragmentShaderID);if(_.defines!==void 0)for(let F in _.defines)M.push(F),M.push(_.defines[F]);if(_.isRawShaderMaterial===!1)m(M,_),E(M,_),M.push(e.outputColorSpace);return M.push(_.customProgramCacheKey),M.join()}function m(_,M){_.push(M.precision),_.push(M.outputColorSpace),_.push(M.envMapMode),_.push(M.envMapCubeUVHeight),_.push(M.mapUv),_.push(M.alphaMapUv),_.push(M.lightMapUv),_.push(M.aoMapUv),_.push(M.bumpMapUv),_.push(M.normalMapUv),_.push(M.displacementMapUv),_.push(M.emissiveMapUv),_.push(M.metalnessMapUv),_.push(M.roughnessMapUv),_.push(M.anisotropyMapUv),_.push(M.clearcoatMapUv),_.push(M.clearcoatNormalMapUv),_.push(M.clearcoatRoughnessMapUv),_.push(M.iridescenceMapUv),_.push(M.iridescenceThicknessMapUv),_.push(M.sheenColorMapUv),_.push(M.sheenRoughnessMapUv),_.push(M.specularMapUv),_.push(M.specularColorMapUv),_.push(M.specularIntensityMapUv),_.push(M.transmissionMapUv),_.push(M.thicknessMapUv),_.push(M.combine),_.push(M.fogExp2),_.push(M.sizeAttenuation),_.push(M.morphTargetsCount),_.push(M.morphAttributeCount),_.push(M.numSunLights),_.push(M.numDirLights),_.push(M.numPointLights),_.push(M.numSpotLights),_.push(M.numSpotLightMaps),_.push(M.numHemiLights),_.push(M.numRectAreaLights),_.push(M.numSunLightShadows),_.push(M.numDirLightShadows),_.push(M.numPointLightShadows),_.push(M.numSpotLightShadows),_.push(M.numSpotLightShadowsWithMaps),_.push(M.numLightProbes),_.push(M.shadowMapType),_.push(M.toneMapping),_.push(M.numClippingPlanes),_.push(M.numClipIntersection),_.push(M.depthPacking)}function E(_,M){if(o.disableAll(),M.instancing)o.enable(0);if(M.instancingColor)o.enable(1);if(M.instancingMorph)o.enable(2);if(M.matcap)o.enable(3);if(M.envMap)o.enable(4);if(M.normalMapObjectSpace)o.enable(5);if(M.normalMapTangentSpace)o.enable(6);if(M.clearcoat)o.enable(7);if(M.iridescence)o.enable(8);if(M.alphaTest)o.enable(9);if(M.vertexColors)o.enable(10);if(M.vertexAlphas)o.enable(11);if(M.vertexUv1s)o.enable(12);if(M.vertexUv2s)o.enable(13);if(M.vertexUv3s)o.enable(14);if(M.vertexTangents)o.enable(15);if(M.anisotropy)o.enable(16);if(M.alphaHash)o.enable(17);if(M.batching)o.enable(18);if(M.dispersion)o.enable(19);if(M.retroreflection)o.enable(24);if(M.batchingColor)o.enable(20);if(M.gradientMap)o.enable(21);if(M.packedNormalMap)o.enable(22);if(M.vertexNormals)o.enable(23);if(_.push(o.mask),o.disableAll(),M.fog)o.enable(0);if(M.useFog)o.enable(1);if(M.flatShading)o.enable(2);if(M.logarithmicDepthBuffer)o.enable(3);if(M.reversedDepthBuffer)o.enable(4);if(M.skinning)o.enable(5);if(M.morphTargets)o.enable(6);if(M.morphNormals)o.enable(7);if(M.morphColors)o.enable(8);if(M.premultipliedAlpha)o.enable(9);if(M.shadowMapEnabled)o.enable(10);if(M.doubleSided)o.enable(11);if(M.flipSided)o.enable(12);if(M.useDepthPacking)o.enable(13);if(M.dithering)o.enable(14);if(M.transmission)o.enable(15);if(M.sheen)o.enable(16);if(M.opaque)o.enable(17);if(M.pointsUvs)o.enable(18);if(M.decodeVideoTexture)o.enable(19);if(M.decodeVideoTextureEmissive)o.enable(20);if(M.alphaToCoverage)o.enable(21);if(M.numLightProbeGrids>0)o.enable(22);if(M.hasPositionAttribute)o.enable(23);_.push(o.mask)}function R(_){let M=d[_.type],F;if(M){let P=ci[M];F=F0.clone(P.uniforms)}else F=_.uniforms;return F}function S(_,M){let F=u.get(M);if(F!==void 0)++F.usedTimes;else F=new dA(e,M,_,r),l.push(F),u.set(M,F);return F}function b(_){if(--_.usedTimes===0){let M=l.indexOf(_);l[M]=l[l.length-1],l.pop(),u.delete(_.cacheKey),_.destroy()}}function T(_){a.remove(_)}function A(){a.dispose()}return{getParameters:x,getProgramCacheKey:p,getUniforms:R,acquireProgram:S,releaseProgram:b,releaseShaderCache:T,programs:l,dispose:A}}function _A(){let e=new WeakMap;function t(o){return e.has(o)}function n(o){let a=e.get(o);if(a===void 0)a={},e.set(o,a);return a}function i(o){e.delete(o)}function r(o,a,c){e.get(o)[a]=c}function s(){e=new WeakMap}return{has:t,get:n,remove:i,update:r,dispose:s}}function xA(e,t){if(e.groupOrder!==t.groupOrder)return e.groupOrder-t.groupOrder;else if(e.renderOrder!==t.renderOrder)return e.renderOrder-t.renderOrder;else if(e.material.id!==t.material.id)return e.material.id-t.material.id;else if(e.materialVariant!==t.materialVariant)return e.materialVariant-t.materialVariant;else if(e.z!==t.z)return e.z-t.z;else return e.id-t.id}function cx(e,t){if(e.groupOrder!==t.groupOrder)return e.groupOrder-t.groupOrder;else if(e.renderOrder!==t.renderOrder)return e.renderOrder-t.renderOrder;else if(e.z!==t.z)return t.z-e.z;else return e.id-t.id}function lx(){let e=[],t=0,n=[],i=[],r=[];function s(){t=0,n.length=0,i.length=0,r.length=0}function o(h){let d=0;if(h.isInstancedMesh)d+=2;if(h.isSkinnedMesh)d+=1;return d}function a(h,d,g,x,p,m){let E=e[t];if(E===void 0)E={id:h.id,object:h,geometry:d,material:g,materialVariant:o(h),groupOrder:x,renderOrder:h.renderOrder,z:p,group:m},e[t]=E;else E.id=h.id,E.object=h,E.geometry=d,E.material=g,E.materialVariant=o(h),E.groupOrder=x,E.renderOrder=h.renderOrder,E.z=p,E.group=m;return t++,E}function c(h,d,g,x,p,m,E){if(E.reversedDepth===!0)p=-p;let R=a(h,d,g,x,p,m);if(g.transmission>0)i.push(R);else if(g.transparent===!0)r.push(R);else n.push(R)}function l(h,d,g,x,p,m){let E=a(h,d,g,x,p,m);if(g.transmission>0)i.unshift(E);else if(g.transparent===!0)r.unshift(E);else n.unshift(E)}function u(h,d){if(n.length>1)n.sort(h||xA);if(i.length>1)i.sort(d||cx);if(r.length>1)r.sort(d||cx)}function f(){for(let h=t,d=e.length;h<d;h++){let g=e[h];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:n,transmissive:i,transparent:r,init:s,push:c,unshift:l,finish:f,sort:u}}function vA(){let e=new WeakMap;function t(i,r){let s=e.get(i),o;if(s===void 0)o=new lx,e.set(i,[o]);else if(r>=s.length)o=new lx,s.push(o);else o=s[r];return o}function n(){e=new WeakMap}return{get:t,dispose:n}}function yA(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={direction:new U,color:new Oe};break;case"SpotLight":n={position:new U,direction:new U,color:new Oe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new U,color:new Oe,distance:0,decay:0};break;case"HemisphereLight":n={direction:new U,skyColor:new Oe,groundColor:new Oe};break;case"RectAreaLight":n={color:new Oe,position:new U,halfWidth:new U,halfHeight:new U};break}return e[t.id]=n,n}}}function SA(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ne};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ne};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ne,shadowCameraNear:1,shadowCameraFar:1000};break}return e[t.id]=n,n}}}var bA=0;function MA(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function wA(e){let t=new yA,n=SA(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new U);let r=new U,s=new Ge,o=new Ge;function a(l){let u=0,f=0,h=0;for(let O=0;O<9;O++)i.probe[O].set(0,0,0);let d=0,g=0,x=0,p=0,m=0,E=0,R=0,S=0,b=0,T=0,A=0,_=0,M=0,F=0;l.sort(MA);for(let O=0,K=l.length;O<K;O++){let C=l[O],{color:G,intensity:X,distance:z}=C,te=null;if(C.shadow&&C.shadow.map)if(C.shadow.map.texture.format===vr)te=C.shadow.map.texture;else te=C.shadow.map.depthTexture||C.shadow.map.texture;if(C.isAmbientLight)u+=G.r*X,f+=G.g*X,h+=G.b*X;else if(C.isLightProbe){for(let H=0;H<9;H++)i.probe[H].addScaledVector(C.sh.coefficients[H],X);F++}else if(C.isSunLight){let H=t.get(C);if(H.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){let Q=C.shadow,ee=n.get(C);ee.shadowIntensity=Q.intensity,ee.shadowBias=Q.bias,ee.shadowNormalBias=Q.normalBias,ee.shadowRadius=Q.radius,ee.shadowMapSize.copy(Q.mapSize).multiply(Q.getFrameExtents()),i.sunShadow[g]=ee,i.sunShadowMap[g]=te;let Te=Q.getViewportCount();for(let ve=0;ve<Te;ve++)i.sunShadowMatrix[x+ve]=Q.getMatrix(ve),i.sunShadowCascade[x+ve]=Q._cascadeData[ve];x+=Te,g++}i.sun[d]=H,d++}else if(C.isDirectionalLight){let H=t.get(C);if(H.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){let Q=C.shadow,ee=n.get(C);ee.shadowIntensity=Q.intensity,ee.shadowBias=Q.bias,ee.shadowNormalBias=Q.normalBias,ee.shadowRadius=Q.radius,ee.shadowMapSize=Q.mapSize,i.directionalShadow[p]=ee,i.directionalShadowMap[p]=te,i.directionalShadowMatrix[p]=C.shadow.matrix,b++}i.directional[p]=H,p++}else if(C.isSpotLight){let H=t.get(C);H.position.setFromMatrixPosition(C.matrixWorld),H.color.copy(G).multiplyScalar(X),H.distance=z,H.coneCos=Math.cos(C.angle),H.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),H.decay=C.decay,i.spot[E]=H;let Q=C.shadow;if(C.map){if(i.spotLightMap[_]=C.map,_++,Q.updateMatrices(C),C.castShadow)M++}if(i.spotLightMatrix[E]=Q.matrix,C.castShadow){let ee=n.get(C);ee.shadowIntensity=Q.intensity,ee.shadowBias=Q.bias,ee.shadowNormalBias=Q.normalBias,ee.shadowRadius=Q.radius,ee.shadowMapSize=Q.mapSize,i.spotShadow[E]=ee,i.spotShadowMap[E]=te,A++}E++}else if(C.isRectAreaLight){let H=t.get(C);H.color.copy(G).multiplyScalar(X),H.halfWidth.set(C.width*0.5,0,0),H.halfHeight.set(0,C.height*0.5,0),i.rectArea[R]=H,R++}else if(C.isPointLight){let H=t.get(C);if(H.color.copy(C.color).multiplyScalar(C.intensity),H.distance=C.distance,H.decay=C.decay,C.castShadow){let Q=C.shadow,ee=n.get(C);ee.shadowIntensity=Q.intensity,ee.shadowBias=Q.bias,ee.shadowNormalBias=Q.normalBias,ee.shadowRadius=Q.radius,ee.shadowMapSize=Q.mapSize,ee.shadowCameraNear=Q.camera.near,ee.shadowCameraFar=Q.camera.far,i.pointShadow[m]=ee,i.pointShadowMap[m]=te,i.pointShadowMatrix[m]=C.shadow.matrix,T++}i.point[m]=H,m++}else if(C.isHemisphereLight){let H=t.get(C);H.skyColor.copy(C.color).multiplyScalar(X),H.groundColor.copy(C.groundColor).multiplyScalar(X),i.hemi[S]=H,S++}}if(R>0)if(e.has("OES_texture_float_linear")===!0)i.rectAreaLTC1=fe.LTC_FLOAT_1,i.rectAreaLTC2=fe.LTC_FLOAT_2;else i.rectAreaLTC1=fe.LTC_HALF_1,i.rectAreaLTC2=fe.LTC_HALF_2;i.ambient[0]=u,i.ambient[1]=f,i.ambient[2]=h;let P=i.hash;if(P.sunLength!==d||P.directionalLength!==p||P.pointLength!==m||P.spotLength!==E||P.rectAreaLength!==R||P.hemiLength!==S||P.numSunShadows!==g||P.numDirectionalShadows!==b||P.numPointShadows!==T||P.numSpotShadows!==A||P.numSpotMaps!==_||P.numLightProbes!==F)i.sun.length=d,i.directional.length=p,i.spot.length=E,i.rectArea.length=R,i.point.length=m,i.hemi.length=S,i.sunShadow.length=g,i.sunShadowMap.length=g,i.sunShadowMatrix.length=x,i.sunShadowCascade.length=x,i.directionalShadow.length=b,i.directionalShadowMap.length=b,i.directionalShadowMatrix.length=b,i.pointShadow.length=T,i.pointShadowMap.length=T,i.pointShadowMatrix.length=T,i.spotShadow.length=A,i.spotShadowMap.length=A,i.spotLightMatrix.length=A+_-M,i.spotLightMap.length=_,i.numSpotLightShadowsWithMaps=M,i.numLightProbes=F,P.sunLength=d,P.directionalLength=p,P.pointLength=m,P.spotLength=E,P.rectAreaLength=R,P.hemiLength=S,P.numSunShadows=g,P.numDirectionalShadows=b,P.numPointShadows=T,P.numSpotShadows=A,P.numSpotMaps=_,P.numLightProbes=F,i.version=bA++}function c(l,u){let f=0,h=0,d=0,g=0,x=0,p=0,m=u.matrixWorldInverse;for(let E=0,R=l.length;E<R;E++){let S=l[E];if(S.isSunLight){let b=i.sun[f];b.direction.setFromMatrixPosition(S.matrixWorld),b.direction.transformDirection(m),f++}else if(S.isDirectionalLight){let b=i.directional[h];b.direction.setFromMatrixPosition(S.matrixWorld),r.setFromMatrixPosition(S.target.matrixWorld),b.direction.sub(r),b.direction.transformDirection(m),h++}else if(S.isSpotLight){let b=i.spot[g];b.position.setFromMatrixPosition(S.matrixWorld),b.position.applyMatrix4(m),b.direction.setFromMatrixPosition(S.matrixWorld),r.setFromMatrixPosition(S.target.matrixWorld),b.direction.sub(r),b.direction.transformDirection(m),g++}else if(S.isRectAreaLight){let b=i.rectArea[x];b.position.setFromMatrixPosition(S.matrixWorld),b.position.applyMatrix4(m),o.identity(),s.copy(S.matrixWorld),s.premultiply(m),o.extractRotation(s),b.halfWidth.set(S.width*0.5,0,0),b.halfHeight.set(0,S.height*0.5,0),b.halfWidth.applyMatrix4(o),b.halfHeight.applyMatrix4(o),x++}else if(S.isPointLight){let b=i.point[d];b.position.setFromMatrixPosition(S.matrixWorld),b.position.applyMatrix4(m),d++}else if(S.isHemisphereLight){let b=i.hemi[p];b.direction.setFromMatrixPosition(S.matrixWorld),b.direction.transformDirection(m),p++}}}return{setup:a,setupView:c,state:i}}function ux(e){let t=new wA(e),n=[],i=[],r=[];function s(h){f.camera=h,n.length=0,i.length=0,r.length=0}function o(h){n.push(h)}function a(h){i.push(h)}function c(h){r.push(h)}function l(){t.setup(n)}function u(h){t.setupView(n,h)}let f={lightsArray:n,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:f,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:a,pushLightProbeGrid:c}}function TA(e){let t=new WeakMap;function n(r,s=0){let o=t.get(r),a;if(o===void 0)a=new ux(e),t.set(r,[a]);else if(s>=o.length)a=new ux(e),o.push(a);else a=o[s];return a}function i(){t=new WeakMap}return{get:n,dispose:i}}var EA=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,AA=`uniform sampler2D shadow_pass;
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
}`,RA=[new U(1,0,0),new U(-1,0,0),new U(0,1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1)],CA=[new U(0,-1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1),new U(0,-1,0),new U(0,-1,0)],hx=new Ge,yo=new U,Dh=new U;function PA(e,t,n){let i=new uo,r=new Ne,s=new Ne,o=new at,a=new ph,c=new mh,l={},u=n.maxTextureSize,f={[Wi]:Yt,[Yt]:Wi,[An]:An},h=new Rn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ne},radius:{value:4}},vertexShader:EA,fragmentShader:AA}),d=h.clone();d.defines.HORIZONTAL_PASS=1;let g=new jt;g.setAttribute("position",new Bt(new Float32Array([-1,-1,0.5,3,-1,0.5,-1,3,0.5]),3));let x=new mt(g,h),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ks;let m=this.type;this.render=function(T,A,_){if(p.enabled===!1)return;if(p.autoUpdate===!1&&p.needsUpdate===!1)return;if(T.length===0)return;if(this.type===G_)Ce("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Ks;let M=e.getRenderTarget(),F=e.getActiveCubeFace(),P=e.getActiveMipmapLevel(),O=e.state;if(O.setBlending(ni),O.buffers.depth.getReversed()===!0)O.buffers.color.setClear(0,0,0,0);else O.buffers.color.setClear(1,1,1,1);O.buffers.depth.setTest(!0),O.setScissorTest(!1);let K=m!==this.type;if(K)A.traverse(function(C){if(C.material)if(Array.isArray(C.material))C.material.forEach((G)=>G.needsUpdate=!0);else C.material.needsUpdate=!0});for(let C=0,G=T.length;C<G;C++){let X=T[C],z=X.shadow;if(z===void 0){Ce("WebGLShadowMap:",X,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;r.copy(z.mapSize);let te=z.getFrameExtents();if(r.multiply(te),s.copy(z.mapSize),r.x>u||r.y>u){if(r.x>u)s.x=Math.floor(u/te.x),r.x=s.x*te.x,z.mapSize.x=s.x;if(r.y>u)s.y=Math.floor(u/te.y),r.y=s.y*te.y,z.mapSize.y=s.y}let H=e.state.buffers.depth.getReversed();if(z.camera._reversedDepth=H,z.map===null||K===!0){if(z.map!==null){if(z.map.depthTexture!==null)z.map.depthTexture.dispose(),z.map.depthTexture=null;z.map.dispose()}if(this.type===Qr){if(X.isPointLight){Ce("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}z.map=new _n(r.x,r.y,{format:vr,type:ri,minFilter:Gt,magFilter:Gt,generateMipmaps:!1}),z.map.texture.name=X.name+".shadowMap",z.map.depthTexture=new Sr(r.x,r.y,Mi),z.map.depthTexture.name=X.name+".shadowMapDepth",z.map.depthTexture.format=_r,z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=Bn,z.map.depthTexture.magFilter=Bn}else{if(X.isPointLight)z.map=new Fh(r.x),z.map.depthTexture=new hh(r.x,$i);else z.map=new _n(r.x,r.y),z.map.depthTexture=new Sr(r.x,r.y,$i);if(z.map.depthTexture.name=X.name+".shadowMap",z.map.depthTexture.format=_r,this.type===Ks)z.map.depthTexture.compareFunction=H?Qa:Ja,z.map.depthTexture.minFilter=Gt,z.map.depthTexture.magFilter=Gt;else z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=Bn,z.map.depthTexture.magFilter=Bn}z.camera.updateProjectionMatrix()}if(z.map.isWebGLCubeRenderTarget!==!0&&(z.map.width!==r.x||z.map.height!==r.y))z.map.setSize(r.x,r.y);let Q=z.map.isWebGLCubeRenderTarget?6:z.getViewportCount();if(X.isPointLight!==!0)z.updateMatrices(X,_);for(let ee=0;ee<Q;ee++){let Te=z.getCamera(ee);if(X.isPointLight){let{camera:ve,matrix:He}=z,Me=X.distance||ve.far;if(Me!==ve.far)ve.far=Me,ve.updateProjectionMatrix();yo.setFromMatrixPosition(X.matrixWorld),ve.position.copy(yo),Dh.copy(ve.position),Dh.add(RA[ee]),ve.up.copy(CA[ee]),ve.lookAt(Dh),ve.updateMatrixWorld(),He.makeTranslation(-yo.x,-yo.y,-yo.z),hx.multiplyMatrices(ve.projectionMatrix,ve.matrixWorldInverse),z._frustum.setFromProjectionMatrix(hx,ve.coordinateSystem,ve.reversedDepth)}if(z.map.isWebGLCubeRenderTarget)e.setRenderTarget(z.map,ee),e.clear();else{if(ee===0)e.setRenderTarget(z.map),e.clear();let ve=z.getViewport(ee);o.set(s.x*ve.x,s.y*ve.y,s.x*ve.z,s.y*ve.w),O.viewport(o)}i=z.getFrustum(ee),S(A,_,Te,X,this.type)}if(z.isPointLightShadow!==!0&&this.type===Qr)E(z,_);z.needsUpdate=!1}m=this.type,p.needsUpdate=!1,e.setRenderTarget(M,F,P)};function E(T,A){let _=t.update(x);if(h.defines.VSM_SAMPLES!==T.blurSamples)h.defines.VSM_SAMPLES=T.blurSamples,d.defines.VSM_SAMPLES=T.blurSamples,h.needsUpdate=!0,d.needsUpdate=!0;if(T.mapPass===null)T.mapPass=new _n(r.x,r.y,{format:vr,type:ri});else if(T.mapPass.width!==T.map.width||T.mapPass.height!==T.map.height)T.mapPass.setSize(T.map.width,T.map.height);h.uniforms.shadow_pass.value=T.map.depthTexture,h.uniforms.resolution.value.set(T.map.width,T.map.height),h.uniforms.radius.value=T.radius,e.setRenderTarget(T.mapPass),e.clear(),e.renderBufferDirect(A,null,_,h,x,null),d.uniforms.shadow_pass.value=T.mapPass.texture,d.uniforms.resolution.value.set(T.map.width,T.map.height),d.uniforms.radius.value=T.radius,e.setRenderTarget(T.map),e.clear(),e.renderBufferDirect(A,null,_,d,x,null)}function R(T,A,_,M){let F=null,P=_.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(P!==void 0)F=P;else if(F=_.isPointLight===!0?c:a,e.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){let O=F.uuid,K=A.uuid,C=l[O];if(C===void 0)C={},l[O]=C;let G=C[K];if(G===void 0)G=F.clone(),C[K]=G,A.addEventListener("dispose",b);F=G}if(F.visible=A.visible,F.wireframe=A.wireframe,M===Qr)F.side=A.shadowSide!==null?A.shadowSide:A.side;else F.side=A.shadowSide!==null?A.shadowSide:f[A.side];if(F.alphaMap=A.alphaMap,F.alphaTest=A.alphaToCoverage===!0?0.5:A.alphaTest,F.map=A.map,F.clipShadows=A.clipShadows,F.clippingPlanes=A.clippingPlanes,F.clipIntersection=A.clipIntersection,F.displacementMap=A.displacementMap,F.displacementScale=A.displacementScale,F.displacementBias=A.displacementBias,F.wireframeLinewidth=A.wireframeLinewidth,F.linewidth=A.linewidth,_.isPointLight===!0&&F.isMeshDistanceMaterial===!0){let O=e.properties.get(F);O.light=_}return F}function S(T,A,_,M,F){if(T.visible===!1)return;if(T.layers.test(A.layers)&&(T.isMesh||T.isLine||T.isPoints)){if((T.castShadow||T.receiveShadow&&F===Qr)&&(!T.frustumCulled||T.intersectsFrustum(i))){T.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,T.matrixWorld);let K=t.update(T),C=T.material;if(Array.isArray(C)){let G=K.groups;for(let X=0,z=G.length;X<z;X++){let te=G[X],H=C[te.materialIndex];if(H&&H.visible){let Q=R(T,H,M,F);T.onBeforeShadow(e,T,A,_,K,Q,te),e.renderBufferDirect(_,null,K,Q,T,te),T.onAfterShadow(e,T,A,_,K,Q,te)}}}else if(C.visible){let G=R(T,C,M,F);T.onBeforeShadow(e,T,A,_,K,G,null),e.renderBufferDirect(_,null,K,G,T,null),T.onAfterShadow(e,T,A,_,K,G,null)}}}let O=T.children;for(let K=0,C=O.length;K<C;K++)S(O[K],A,_,M,F)}function b(T){T.target.removeEventListener("dispose",b);for(let _ in l){let M=l[_],F=T.target.uuid;if(F in M)M[F].dispose(),delete M[F]}}}function IA(e,t){function n(){let D=!1,ce=new at,Y=null,le=new at(0,0,0,0);return{setMask:function(_e){if(Y!==_e&&!D)e.colorMask(_e,_e,_e,_e),Y=_e},setLocked:function(_e){D=_e},setClear:function(_e,ne,de,Be,dt){if(dt===!0)_e*=Be,ne*=Be,de*=Be;if(ce.set(_e,ne,de,Be),le.equals(ce)===!1)e.clearColor(_e,ne,de,Be),le.copy(ce)},reset:function(){D=!1,Y=null,le.set(-1,0,0,0)}}}function i(){let D=!1,ce=!1,Y=null,le=null,_e=null;return{setReversed:function(ne){if(ce!==ne){let de=t.get("EXT_clip_control");if(ne)de.clipControlEXT(de.LOWER_LEFT_EXT,de.ZERO_TO_ONE_EXT);else de.clipControlEXT(de.LOWER_LEFT_EXT,de.NEGATIVE_ONE_TO_ONE_EXT);ce=ne;let Be=_e;_e=null,this.setClear(Be)}},getReversed:function(){return ce},setTest:function(ne){if(ne)se(e.DEPTH_TEST);else Pe(e.DEPTH_TEST)},setMask:function(ne){if(Y!==ne&&!D)e.depthMask(ne),Y=ne},setFunc:function(ne){if(ce)ne=O0[ne];if(le!==ne){switch(ne){case c0:e.depthFunc(e.NEVER);break;case l0:e.depthFunc(e.ALWAYS);break;case u0:e.depthFunc(e.LESS);break;case fu:e.depthFunc(e.LEQUAL);break;case h0:e.depthFunc(e.EQUAL);break;case f0:e.depthFunc(e.GEQUAL);break;case d0:e.depthFunc(e.GREATER);break;case p0:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}le=ne}},setLocked:function(ne){D=ne},setClear:function(ne){if(_e!==ne){if(_e=ne,ce)ne=1-ne;e.clearDepth(ne)}},reset:function(){D=!1,Y=null,le=null,_e=null,ce=!1}}}function r(){let D=!1,ce=null,Y=null,le=null,_e=null,ne=null,de=null,Be=null,dt=null;return{setTest:function(it){if(!D)if(it)se(e.STENCIL_TEST);else Pe(e.STENCIL_TEST)},setMask:function(it){if(ce!==it&&!D)e.stencilMask(it),ce=it},setFunc:function(it,Vn,ui){if(Y!==it||le!==Vn||_e!==ui)e.stencilFunc(it,Vn,ui),Y=it,le=Vn,_e=ui},setOp:function(it,Vn,ui){if(ne!==it||de!==Vn||Be!==ui)e.stencilOp(it,Vn,ui),ne=it,de=Vn,Be=ui},setLocked:function(it){D=it},setClear:function(it){if(dt!==it)e.clearStencil(it),dt=it},reset:function(){D=!1,ce=null,Y=null,le=null,_e=null,ne=null,de=null,Be=null,dt=null}}}let s=new n,o=new i,a=new r,c=new WeakMap,l=new WeakMap,u={},f={},h={},d=new WeakMap,g=[],x=null,p=!1,m=null,E=null,R=null,S=null,b=null,T=null,A=null,_=new Oe(0,0,0),M=0,F=!1,P=null,O=null,K=null,C=null,G=null,X=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),z=!1,te=0,H=e.getParameter(e.VERSION);if(H.indexOf("WebGL")!==-1)te=parseFloat(/^WebGL (\d)/.exec(H)[1]),z=te>=1;else if(H.indexOf("OpenGL ES")!==-1)te=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),z=te>=2;let Q=null,ee={},Te=e.getParameter(e.SCISSOR_BOX),ve=e.getParameter(e.VIEWPORT),He=new at().fromArray(Te),Me=new at().fromArray(ve);function Z(D,ce,Y,le){let _e=new Uint8Array(4),ne=e.createTexture();e.bindTexture(D,ne),e.texParameteri(D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(D,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let de=0;de<Y;de++)if(D===e.TEXTURE_3D||D===e.TEXTURE_2D_ARRAY)e.texImage3D(ce,0,e.RGBA,1,1,le,0,e.RGBA,e.UNSIGNED_BYTE,_e);else e.texImage2D(ce+de,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,_e);return ne}let re={};re[e.TEXTURE_2D]=Z(e.TEXTURE_2D,e.TEXTURE_2D,1),re[e.TEXTURE_CUBE_MAP]=Z(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),re[e.TEXTURE_2D_ARRAY]=Z(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),re[e.TEXTURE_3D]=Z(e.TEXTURE_3D,e.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),se(e.DEPTH_TEST),o.setFunc(fu),Ht(!1),_t(cu),se(e.CULL_FACE),st(ni);function se(D){if(u[D]!==!0)e.enable(D),u[D]=!0}function Pe(D){if(u[D]!==!1)e.disable(D),u[D]=!1}function Ie(D,ce){if(h[D]!==ce){if(e.bindFramebuffer(D,ce),h[D]=ce,D===e.DRAW_FRAMEBUFFER)h[e.FRAMEBUFFER]=ce;if(D===e.FRAMEBUFFER)h[e.DRAW_FRAMEBUFFER]=ce;return!0}return!1}function we(D,ce){let Y=g,le=!1;if(D){if(Y=d.get(ce),Y===void 0)Y=[],d.set(ce,Y);let _e=D.textures;if(Y.length!==_e.length||Y[0]!==e.COLOR_ATTACHMENT0){for(let ne=0,de=_e.length;ne<de;ne++)Y[ne]=e.COLOR_ATTACHMENT0+ne;Y.length=_e.length,le=!0}}else if(Y[0]!==e.BACK)Y[0]=e.BACK,le=!0;if(le)e.drawBuffers(Y)}function gt(D){if(x!==D)return e.useProgram(D),x=D,!0;return!1}let ke={[es]:e.FUNC_ADD,[V_]:e.FUNC_SUBTRACT,[W_]:e.FUNC_REVERSE_SUBTRACT};ke[$_]=e.MIN,ke[Z_]=e.MAX;let Xe={[X_]:e.ZERO,[q_]:e.ONE,[Y_]:e.SRC_COLOR,[K_]:e.SRC_ALPHA,[i0]:e.SRC_ALPHA_SATURATE,[t0]:e.DST_COLOR,[Q_]:e.DST_ALPHA,[j_]:e.ONE_MINUS_SRC_COLOR,[J_]:e.ONE_MINUS_SRC_ALPHA,[n0]:e.ONE_MINUS_DST_COLOR,[e0]:e.ONE_MINUS_DST_ALPHA,[r0]:e.CONSTANT_COLOR,[s0]:e.ONE_MINUS_CONSTANT_COLOR,[o0]:e.CONSTANT_ALPHA,[a0]:e.ONE_MINUS_CONSTANT_ALPHA};function st(D,ce,Y,le,_e,ne,de,Be,dt,it){if(D===ni){if(p===!0)Pe(e.BLEND),p=!1;return}if(p===!1)se(e.BLEND),p=!0;if(D!==H_){if(D!==m||it!==F){if(E!==es||b!==es)e.blendEquation(e.FUNC_ADD),E=es,b=es;if(it)switch(D){case Js:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case lu:e.blendFunc(e.ONE,e.ONE);break;case uu:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case hu:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:Ue("WebGLState: Invalid blending: ",D);break}else switch(D){case Js:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case lu:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case uu:Ue("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case hu:Ue("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ue("WebGLState: Invalid blending: ",D);break}R=null,S=null,T=null,A=null,_.set(0,0,0),M=0,m=D,F=it}return}if(_e=_e||ce,ne=ne||Y,de=de||le,ce!==E||_e!==b)e.blendEquationSeparate(ke[ce],ke[_e]),E=ce,b=_e;if(Y!==R||le!==S||ne!==T||de!==A)e.blendFuncSeparate(Xe[Y],Xe[le],Xe[ne],Xe[de]),R=Y,S=le,T=ne,A=de;if(Be.equals(_)===!1||dt!==M)e.blendColor(Be.r,Be.g,Be.b,dt),_.copy(Be),M=dt;m=D,F=!1}function Ke(D,ce){D.side===An?Pe(e.CULL_FACE):se(e.CULL_FACE);let Y=D.side===Yt;if(ce)Y=!Y;Ht(Y),D.blending===Js&&D.transparent===!1?st(ni):st(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),o.setFunc(D.depthFunc),o.setTest(D.depthTest),o.setMask(D.depthWrite),s.setMask(D.colorWrite);let le=D.stencilWrite;if(a.setTest(le),le)a.setMask(D.stencilWriteMask),a.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),a.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass);Lt(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?se(e.SAMPLE_ALPHA_TO_COVERAGE):Pe(e.SAMPLE_ALPHA_TO_COVERAGE)}function Ht(D){if(P!==D){if(D)e.frontFace(e.CW);else e.frontFace(e.CCW);P=D}}function _t(D){if(D!==k_){if(se(e.CULL_FACE),D!==O)if(D===cu)e.cullFace(e.BACK);else if(D===B_)e.cullFace(e.FRONT);else e.cullFace(e.FRONT_AND_BACK)}else Pe(e.CULL_FACE);O=D}function rn(D){if(D!==K){if(z)e.lineWidth(D);K=D}}function Lt(D,ce,Y){if(D){if(se(e.POLYGON_OFFSET_FILL),C!==ce||G!==Y){if(C=ce,G=Y,o.getReversed())ce=-ce;e.polygonOffset(ce,Y)}}else Pe(e.POLYGON_OFFSET_FILL)}function Nt(D){if(D)se(e.SCISSOR_TEST);else Pe(e.SCISSOR_TEST)}function L(D){if(D===void 0)D=e.TEXTURE0+X-1;if(Q!==D)e.activeTexture(D),Q=D}function sn(D,ce,Y){if(Y===void 0)if(Q===null)Y=e.TEXTURE0+X-1;else Y=Q;let le=ee[Y];if(le===void 0)le={type:void 0,texture:void 0},ee[Y]=le;if(le.type!==D||le.texture!==ce){if(Q!==Y)e.activeTexture(Y),Q=Y;e.bindTexture(D,ce||re[D]),le.type=D,le.texture=ce}}function nt(){let D=ee[Q];if(D!==void 0&&D.type!==void 0)e.bindTexture(D.type,null),D.type=void 0,D.texture=void 0}function St(){try{e.compressedTexImage2D(...arguments)}catch(D){Ue("WebGLState:",D)}}function w(){try{e.compressedTexImage3D(...arguments)}catch(D){Ue("WebGLState:",D)}}function v(){try{e.texSubImage2D(...arguments)}catch(D){Ue("WebGLState:",D)}}function I(){try{e.texSubImage3D(...arguments)}catch(D){Ue("WebGLState:",D)}}function V(){try{e.compressedTexSubImage2D(...arguments)}catch(D){Ue("WebGLState:",D)}}function ie(){try{e.compressedTexSubImage3D(...arguments)}catch(D){Ue("WebGLState:",D)}}function ae(){try{e.texStorage2D(...arguments)}catch(D){Ue("WebGLState:",D)}}function ue(){try{e.texStorage3D(...arguments)}catch(D){Ue("WebGLState:",D)}}function q(){try{e.texImage2D(...arguments)}catch(D){Ue("WebGLState:",D)}}function J(){try{e.texImage3D(...arguments)}catch(D){Ue("WebGLState:",D)}}function ge(D){if(f[D]!==void 0)return f[D];else return e.getParameter(D)}function Ae(D,ce){if(f[D]!==ce)e.pixelStorei(D,ce),f[D]=ce}function he(D){if(He.equals(D)===!1)e.scissor(D.x,D.y,D.z,D.w),He.copy(D)}function oe(D){if(Me.equals(D)===!1)e.viewport(D.x,D.y,D.z,D.w),Me.copy(D)}function Le(D,ce){let Y=l.get(ce);if(Y===void 0)Y=new WeakMap,l.set(ce,Y);let le=Y.get(D);if(le===void 0)le=e.getUniformBlockIndex(ce,D.name),Y.set(D,le)}function De(D,ce){let le=l.get(ce).get(D);if(c.get(ce)!==le)e.uniformBlockBinding(ce,le,D.__bindingPointIndex),c.set(ce,le)}function Qe(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},f={},Q=null,ee={},h={},d=new WeakMap,g=[],x=null,p=!1,m=null,E=null,R=null,S=null,b=null,T=null,A=null,_=new Oe(0,0,0),M=0,F=!1,P=null,O=null,K=null,C=null,G=null,He.set(0,0,e.canvas.width,e.canvas.height),Me.set(0,0,e.canvas.width,e.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:se,disable:Pe,bindFramebuffer:Ie,drawBuffers:we,useProgram:gt,setBlending:st,setMaterial:Ke,setFlipSided:Ht,setCullFace:_t,setLineWidth:rn,setPolygonOffset:Lt,setScissorTest:Nt,activeTexture:L,bindTexture:sn,unbindTexture:nt,compressedTexImage2D:St,compressedTexImage3D:w,texImage2D:q,texImage3D:J,pixelStorei:Ae,getParameter:ge,updateUBOMapping:Le,uniformBlockBinding:De,texStorage2D:ae,texStorage3D:ue,texSubImage2D:v,texSubImage3D:I,compressedTexSubImage2D:V,compressedTexSubImage3D:ie,scissor:he,viewport:oe,reset:Qe}}function LA(e,t,n,i,r,s,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Ne,u=new WeakMap,f=new Set,h,d=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch(w){}function x(w,v){return g?new OffscreenCanvas(w,v):jr("canvas")}function p(w,v,I){let V=1,ie=St(w);if(ie.width>I||ie.height>I)V=I/Math.max(ie.width,ie.height);if(V<1)if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&w instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&w instanceof ImageBitmap||typeof VideoFrame<"u"&&w instanceof VideoFrame){let ae=Math.floor(V*ie.width),ue=Math.floor(V*ie.height);if(h===void 0)h=x(ae,ue);let q=v?x(ae,ue):h;return q.width=ae,q.height=ue,q.getContext("2d").drawImage(w,0,0,ae,ue),Ce("WebGLRenderer: Texture has been resized from ("+ie.width+"x"+ie.height+") to ("+ae+"x"+ue+")."),q}else{if("data"in w)Ce("WebGLRenderer: Image in DataTexture is too big ("+ie.width+"x"+ie.height+").");return w}return w}function m(w){return w.generateMipmaps}function E(w){e.generateMipmap(w)}function R(w){if(w.isWebGLCubeRenderTarget)return e.TEXTURE_CUBE_MAP;if(w.isWebGL3DRenderTarget)return e.TEXTURE_3D;if(w.isWebGLArrayRenderTarget||w.isCompressedArrayTexture)return e.TEXTURE_2D_ARRAY;return e.TEXTURE_2D}function S(w,v,I,V,ie,ae=!1){if(w!==null){if(e[w]!==void 0)return e[w];Ce("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+w+"'")}let ue;if(V){if(ue=t.get("EXT_texture_norm16"),!ue)Ce("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension")}let q=v;if(v===e.RED){if(I===e.FLOAT)q=e.R32F;if(I===e.HALF_FLOAT)q=e.R16F;if(I===e.UNSIGNED_BYTE)q=e.R8;if(I===e.UNSIGNED_SHORT&&ue)q=ue.R16_EXT;if(I===e.SHORT&&ue)q=ue.R16_SNORM_EXT}if(v===e.RED_INTEGER){if(I===e.UNSIGNED_BYTE)q=e.R8UI;if(I===e.UNSIGNED_SHORT)q=e.R16UI;if(I===e.UNSIGNED_INT)q=e.R32UI;if(I===e.BYTE)q=e.R8I;if(I===e.SHORT)q=e.R16I;if(I===e.INT)q=e.R32I}if(v===e.RG){if(I===e.FLOAT)q=e.RG32F;if(I===e.HALF_FLOAT)q=e.RG16F;if(I===e.UNSIGNED_BYTE)q=e.RG8;if(I===e.UNSIGNED_SHORT&&ue)q=ue.RG16_EXT;if(I===e.SHORT&&ue)q=ue.RG16_SNORM_EXT}if(v===e.RG_INTEGER){if(I===e.UNSIGNED_BYTE)q=e.RG8UI;if(I===e.UNSIGNED_SHORT)q=e.RG16UI;if(I===e.UNSIGNED_INT)q=e.RG32UI;if(I===e.BYTE)q=e.RG8I;if(I===e.SHORT)q=e.RG16I;if(I===e.INT)q=e.RG32I}if(v===e.RGB_INTEGER){if(I===e.UNSIGNED_BYTE)q=e.RGB8UI;if(I===e.UNSIGNED_SHORT)q=e.RGB16UI;if(I===e.UNSIGNED_INT)q=e.RGB32UI;if(I===e.BYTE)q=e.RGB8I;if(I===e.SHORT)q=e.RGB16I;if(I===e.INT)q=e.RGB32I}if(v===e.RGBA_INTEGER){if(I===e.UNSIGNED_BYTE)q=e.RGBA8UI;if(I===e.UNSIGNED_SHORT)q=e.RGBA16UI;if(I===e.UNSIGNED_INT)q=e.RGBA32UI;if(I===e.BYTE)q=e.RGBA8I;if(I===e.SHORT)q=e.RGBA16I;if(I===e.INT)q=e.RGBA32I}if(v===e.RGB){if(I===e.UNSIGNED_SHORT&&ue)q=ue.RGB16_EXT;if(I===e.SHORT&&ue)q=ue.RGB16_SNORM_EXT;if(I===e.UNSIGNED_INT_5_9_9_9_REV)q=e.RGB9_E5;if(I===e.UNSIGNED_INT_10F_11F_11F_REV)q=e.R11F_G11F_B10F}if(v===e.RGBA){let J=ae?rh:$e.getTransfer(ie);if(I===e.FLOAT)q=e.RGBA32F;if(I===e.HALF_FLOAT)q=e.RGBA16F;if(I===e.UNSIGNED_BYTE)q=J===ft?e.SRGB8_ALPHA8:e.RGBA8;if(I===e.UNSIGNED_SHORT&&ue)q=ue.RGBA16_EXT;if(I===e.SHORT&&ue)q=ue.RGBA16_SNORM_EXT;if(I===e.UNSIGNED_SHORT_4_4_4_4)q=e.RGBA4;if(I===e.UNSIGNED_SHORT_5_5_5_1)q=e.RGB5_A1}if(q===e.R16F||q===e.R32F||q===e.RG16F||q===e.RG32F||q===e.RGBA16F||q===e.RGBA32F)t.get("EXT_color_buffer_float");return q}function b(w,v){let I;if(w){if(v===null||v===$i||v===ss)I=e.DEPTH24_STENCIL8;else if(v===Mi)I=e.DEPTH32F_STENCIL8;else if(v===to)I=e.DEPTH24_STENCIL8,Ce("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")}else if(v===null||v===$i||v===ss)I=e.DEPTH_COMPONENT24;else if(v===Mi)I=e.DEPTH_COMPONENT32F;else if(v===to)I=e.DEPTH_COMPONENT16;return I}function T(w,v){if(m(w)===!0||w.isFramebufferTexture&&w.minFilter!==Bn&&w.minFilter!==Gt)return Math.log2(Math.max(v.width,v.height))+1;else if(w.mipmaps!==void 0&&w.mipmaps.length>0)return w.mipmaps.length;else if(w.isCompressedTexture&&Array.isArray(w.image))return v.mipmaps.length;else return 1}function A(w){let v=w.target;if(v.removeEventListener("dispose",A),M(v),v.isVideoTexture)u.delete(v);if(v.isHTMLTexture)f.delete(v)}function _(w){let v=w.target;v.removeEventListener("dispose",_),P(v)}function M(w){let v=i.get(w);if(v.__webglInit===void 0)return;let I=w.source,V=d.get(I);if(V){let ie=V[v.__cacheKey];if(ie.usedTimes--,ie.usedTimes===0)F(w);if(Object.keys(V).length===0)d.delete(I)}i.remove(w)}function F(w){let v=i.get(w);e.deleteTexture(v.__webglTexture);let I=w.source,V=d.get(I);delete V[v.__cacheKey],o.memory.textures--}function P(w){let v=i.get(w);if(w.depthTexture)w.depthTexture.dispose(),i.remove(w.depthTexture);if(w.isWebGLCubeRenderTarget)for(let V=0;V<6;V++){if(Array.isArray(v.__webglFramebuffer[V]))for(let ie=0;ie<v.__webglFramebuffer[V].length;ie++)e.deleteFramebuffer(v.__webglFramebuffer[V][ie]);else e.deleteFramebuffer(v.__webglFramebuffer[V]);if(v.__webglDepthbuffer)e.deleteRenderbuffer(v.__webglDepthbuffer[V])}else{if(Array.isArray(v.__webglFramebuffer))for(let V=0;V<v.__webglFramebuffer.length;V++)e.deleteFramebuffer(v.__webglFramebuffer[V]);else e.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer)e.deleteRenderbuffer(v.__webglDepthbuffer);if(v.__webglMultisampledFramebuffer)e.deleteFramebuffer(v.__webglMultisampledFramebuffer);if(v.__webglColorRenderbuffer){for(let V=0;V<v.__webglColorRenderbuffer.length;V++)if(v.__webglColorRenderbuffer[V])e.deleteRenderbuffer(v.__webglColorRenderbuffer[V])}if(v.__webglDepthRenderbuffer)e.deleteRenderbuffer(v.__webglDepthRenderbuffer)}let I=w.textures;for(let V=0,ie=I.length;V<ie;V++){let ae=i.get(I[V]);if(ae.__webglTexture)e.deleteTexture(ae.__webglTexture),o.memory.textures--;i.remove(I[V])}i.remove(w)}let O=0;function K(){O=0}function C(){return O}function G(w){O=w}function X(){let w=O;if(w>=r.maxTextures)Ce("WebGLTextures: Trying to use "+(w+1)+" texture units while this GPU supports only "+r.maxTextures);return O+=1,w}function z(w){let v=[];return v.push(w.wrapS),v.push(w.wrapT),v.push(w.wrapR||0),v.push(w.magFilter),v.push(w.minFilter),v.push(w.anisotropy),v.push(w.internalFormat),v.push(w.format),v.push(w.type),v.push(w.generateMipmaps),v.push(w.premultiplyAlpha),v.push(w.flipY),v.push(w.unpackAlignment),v.push(w.colorSpace),v.join()}function te(w,v){let I=i.get(w);if(w.isVideoTexture)sn(w);if(w.isRenderTargetTexture===!1&&w.isExternalTexture!==!0&&w.version>0&&I.__version!==w.version){let V=w.image;if(V===null)Ce("WebGLRenderer: Texture marked for update but no image data found.");else if(V.complete===!1)Ce("WebGLRenderer: Texture marked for update but image is incomplete");else{Pe(I,w,v);return}}else if(w.isExternalTexture)I.__webglTexture=w.sourceTexture?w.sourceTexture:null;n.bindTexture(e.TEXTURE_2D,I.__webglTexture,e.TEXTURE0+v)}function H(w,v){let I=i.get(w);if(w.isRenderTargetTexture===!1&&w.version>0&&I.__version!==w.version){Pe(I,w,v);return}else if(w.isExternalTexture)I.__webglTexture=w.sourceTexture?w.sourceTexture:null;n.bindTexture(e.TEXTURE_2D_ARRAY,I.__webglTexture,e.TEXTURE0+v)}function Q(w,v){let I=i.get(w);if(w.isRenderTargetTexture===!1&&w.version>0&&I.__version!==w.version){Pe(I,w,v);return}n.bindTexture(e.TEXTURE_3D,I.__webglTexture,e.TEXTURE0+v)}function ee(w,v){let I=i.get(w);if(w.isCubeDepthTexture!==!0&&w.version>0&&I.__version!==w.version){Ie(I,w,v);return}n.bindTexture(e.TEXTURE_CUBE_MAP,I.__webglTexture,e.TEXTURE0+v)}let Te={[ns]:e.REPEAT,[is]:e.CLAMP_TO_EDGE,[Va]:e.MIRRORED_REPEAT},ve={[Bn]:e.NEAREST,[Wa]:e.NEAREST_MIPMAP_NEAREST,[gr]:e.NEAREST_MIPMAP_LINEAR,[Gt]:e.LINEAR,[rs]:e.LINEAR_MIPMAP_NEAREST,[ii]:e.LINEAR_MIPMAP_LINEAR},He={[E0]:e.NEVER,[I0]:e.ALWAYS,[A0]:e.LESS,[Ja]:e.LEQUAL,[R0]:e.EQUAL,[Qa]:e.GEQUAL,[C0]:e.GREATER,[P0]:e.NOTEQUAL};function Me(w,v){if(v.type===Mi&&t.has("OES_texture_float_linear")===!1&&(v.magFilter===Gt||v.magFilter===rs||v.magFilter===gr||v.magFilter===ii||v.minFilter===Gt||v.minFilter===rs||v.minFilter===gr||v.minFilter===ii))Ce("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.");if(e.texParameteri(w,e.TEXTURE_WRAP_S,Te[v.wrapS]),e.texParameteri(w,e.TEXTURE_WRAP_T,Te[v.wrapT]),w===e.TEXTURE_3D||w===e.TEXTURE_2D_ARRAY)e.texParameteri(w,e.TEXTURE_WRAP_R,Te[v.wrapR]);if(e.texParameteri(w,e.TEXTURE_MAG_FILTER,ve[v.magFilter]),e.texParameteri(w,e.TEXTURE_MIN_FILTER,ve[v.minFilter]),v.compareFunction)e.texParameteri(w,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(w,e.TEXTURE_COMPARE_FUNC,He[v.compareFunction]);if(t.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===Bn)return;if(v.minFilter!==gr&&v.minFilter!==ii)return;if(v.type===Mi&&t.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||i.get(v).__currentAnisotropy){let I=t.get("EXT_texture_filter_anisotropic");e.texParameterf(w,I.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,r.getMaxAnisotropy())),i.get(v).__currentAnisotropy=v.anisotropy}}}function Z(w,v){let I=!1;if(w.__webglInit===void 0)w.__webglInit=!0,v.addEventListener("dispose",A);let V=v.source,ie=d.get(V);if(ie===void 0)ie={},d.set(V,ie);let ae=z(v);if(ae!==w.__cacheKey){if(ie[ae]===void 0)ie[ae]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,I=!0;ie[ae].usedTimes++;let ue=ie[w.__cacheKey];if(ue!==void 0){if(ie[w.__cacheKey].usedTimes--,ue.usedTimes===0)F(v)}w.__cacheKey=ae,w.__webglTexture=ie[ae].texture}return I}function re(w,v,I){return Math.floor(Math.floor(w/I)/v)}function se(w,v,I,V){let ae=w.updateRanges;if(ae.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,v.width,v.height,I,V,v.data);else{ae.sort((Ae,he)=>Ae.start-he.start);let ue=0;for(let Ae=1;Ae<ae.length;Ae++){let he=ae[ue],oe=ae[Ae],Le=he.start+he.count,De=re(oe.start,v.width,4),Qe=re(he.start,v.width,4);if(oe.start<=Le+1&&De===Qe&&re(oe.start+oe.count-1,v.width,4)===De)he.count=Math.max(he.count,oe.start+oe.count-he.start);else++ue,ae[ue]=oe}ae.length=ue+1;let q=n.getParameter(e.UNPACK_ROW_LENGTH),J=n.getParameter(e.UNPACK_SKIP_PIXELS),ge=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,v.width);for(let Ae=0,he=ae.length;Ae<he;Ae++){let oe=ae[Ae],Le=Math.floor(oe.start/4),De=Math.ceil(oe.count/4),Qe=Le%v.width,D=Math.floor(Le/v.width),ce=De,Y=1;n.pixelStorei(e.UNPACK_SKIP_PIXELS,Qe),n.pixelStorei(e.UNPACK_SKIP_ROWS,D),n.texSubImage2D(e.TEXTURE_2D,0,Qe,D,ce,1,I,V,v.data)}w.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,q),n.pixelStorei(e.UNPACK_SKIP_PIXELS,J),n.pixelStorei(e.UNPACK_SKIP_ROWS,ge)}}function Pe(w,v,I){let V=e.TEXTURE_2D;if(v.isDataArrayTexture||v.isCompressedArrayTexture)V=e.TEXTURE_2D_ARRAY;if(v.isData3DTexture)V=e.TEXTURE_3D;let ie=Z(w,v),ae=v.source;n.bindTexture(V,w.__webglTexture,e.TEXTURE0+I);let ue=i.get(ae);if(ae.version!==ue.__version||ie===!0){if(n.activeTexture(e.TEXTURE0+I),(typeof ImageBitmap<"u"&&v.image instanceof ImageBitmap)===!1){let Y=$e.getPrimaries($e.workingColorSpace),le=v.colorSpace===yr?null:$e.getPrimaries(v.colorSpace),_e=v.colorSpace===yr||Y===le?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,_e)}n.pixelStorei(e.UNPACK_ALIGNMENT,v.unpackAlignment);let J=p(v.image,!1,r.maxTextureSize);J=nt(v,J);let ge=s.convert(v.format,v.colorSpace),Ae=s.convert(v.type),he=S(v.internalFormat,ge,Ae,v.normalized,v.colorSpace,v.isVideoTexture);Me(V,v);let oe,Le=v.mipmaps,De=v.isVideoTexture!==!0,Qe=ue.__version===void 0||ie===!0,D=ae.dataReady,ce=T(v,J);if(v.isDepthTexture){if(he=b(v.format===xr,v.type),Qe)if(De)n.texStorage2D(e.TEXTURE_2D,1,he,J.width,J.height);else n.texImage2D(e.TEXTURE_2D,0,he,J.width,J.height,0,ge,Ae,null)}else if(v.isDataTexture)if(Le.length>0){if(De&&Qe)n.texStorage2D(e.TEXTURE_2D,ce,he,Le[0].width,Le[0].height);for(let Y=0,le=Le.length;Y<le;Y++)if(oe=Le[Y],De){if(D)n.texSubImage2D(e.TEXTURE_2D,Y,0,0,oe.width,oe.height,ge,Ae,oe.data)}else n.texImage2D(e.TEXTURE_2D,Y,he,oe.width,oe.height,0,ge,Ae,oe.data);v.generateMipmaps=!1}else if(De){if(Qe)n.texStorage2D(e.TEXTURE_2D,ce,he,J.width,J.height);if(D)se(v,J,ge,Ae)}else n.texImage2D(e.TEXTURE_2D,0,he,J.width,J.height,0,ge,Ae,J.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){if(De&&Qe)n.texStorage3D(e.TEXTURE_2D_ARRAY,ce,he,Le[0].width,Le[0].height,J.depth);for(let Y=0,le=Le.length;Y<le;Y++)if(oe=Le[Y],v.format!==si)if(ge!==null)if(De){if(D)if(v.layerUpdates.size>0){let _e=Rh(oe.width,oe.height,v.format,v.type);for(let ne of v.layerUpdates){let de=oe.data.subarray(ne*_e/oe.data.BYTES_PER_ELEMENT,(ne+1)*_e/oe.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Y,0,0,ne,oe.width,oe.height,1,ge,de)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Y,0,0,0,oe.width,oe.height,J.depth,ge,oe.data)}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,Y,he,oe.width,oe.height,J.depth,0,oe.data,0,0);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(De){if(D)n.texSubImage3D(e.TEXTURE_2D_ARRAY,Y,0,0,0,oe.width,oe.height,J.depth,ge,Ae,oe.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,Y,he,oe.width,oe.height,J.depth,0,ge,Ae,oe.data);if(v.layerUpdates.size>0)v.clearLayerUpdates()}else{if(De&&Qe)n.texStorage2D(e.TEXTURE_2D,ce,he,Le[0].width,Le[0].height);for(let Y=0,le=Le.length;Y<le;Y++)if(oe=Le[Y],v.format!==si)if(ge!==null)if(De){if(D)n.compressedTexSubImage2D(e.TEXTURE_2D,Y,0,0,oe.width,oe.height,ge,oe.data)}else n.compressedTexImage2D(e.TEXTURE_2D,Y,he,oe.width,oe.height,0,oe.data);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(De){if(D)n.texSubImage2D(e.TEXTURE_2D,Y,0,0,oe.width,oe.height,ge,Ae,oe.data)}else n.texImage2D(e.TEXTURE_2D,Y,he,oe.width,oe.height,0,ge,Ae,oe.data)}else if(v.isDataArrayTexture)if(De){if(Qe)n.texStorage3D(e.TEXTURE_2D_ARRAY,ce,he,J.width,J.height,J.depth);if(D)if(v.layerUpdates.size>0){let Y=Rh(J.width,J.height,v.format,v.type);for(let le of v.layerUpdates){let _e=J.data.subarray(le*Y/J.data.BYTES_PER_ELEMENT,(le+1)*Y/J.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,le,J.width,J.height,1,ge,Ae,_e)}v.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,J.width,J.height,J.depth,ge,Ae,J.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,he,J.width,J.height,J.depth,0,ge,Ae,J.data);else if(v.isData3DTexture)if(De){if(Qe)n.texStorage3D(e.TEXTURE_3D,ce,he,J.width,J.height,J.depth);if(D)n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,J.width,J.height,J.depth,ge,Ae,J.data)}else n.texImage3D(e.TEXTURE_3D,0,he,J.width,J.height,J.depth,0,ge,Ae,J.data);else if(v.isFramebufferTexture){if(Qe)if(De)n.texStorage2D(e.TEXTURE_2D,ce,he,J.width,J.height);else{let Y=J.width,le=J.height;for(let _e=0;_e<ce;_e++)n.texImage2D(e.TEXTURE_2D,_e,he,Y,le,0,ge,Ae,null),Y>>=1,le>>=1}}else if(v.isHTMLTexture){if("texElementImage2D"in e){let Y=e.canvas;if(!Y.hasAttribute("layoutsubtree"))Y.setAttribute("layoutsubtree","true");if(J.parentNode!==Y){Y.appendChild(J),f.add(v),Y.onpaint=(le)=>{let _e=le.changedElements;for(let ne of f)if(_e.includes(ne.image))ne.needsUpdate=!0},Y.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,J);else{let{RGBA:_e,RGBA:ne,UNSIGNED_BYTE:de}=e;e.texElementImage2D(e.TEXTURE_2D,0,_e,ne,de,J)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(Le.length>0){if(De&&Qe){let Y=St(Le[0]);n.texStorage2D(e.TEXTURE_2D,ce,he,Y.width,Y.height)}for(let Y=0,le=Le.length;Y<le;Y++)if(oe=Le[Y],De){if(D)n.texSubImage2D(e.TEXTURE_2D,Y,0,0,ge,Ae,oe)}else n.texImage2D(e.TEXTURE_2D,Y,he,ge,Ae,oe);v.generateMipmaps=!1}else if(De){if(Qe){let Y=St(J);n.texStorage2D(e.TEXTURE_2D,ce,he,Y.width,Y.height)}if(D)n.texSubImage2D(e.TEXTURE_2D,0,0,0,ge,Ae,J)}else n.texImage2D(e.TEXTURE_2D,0,he,ge,Ae,J);if(m(v))E(V);if(ue.__version=ae.version,v.onUpdate)v.onUpdate(v)}w.__version=v.version}function Ie(w,v,I){if(v.image.length!==6)return;let V=Z(w,v),ie=v.source;n.bindTexture(e.TEXTURE_CUBE_MAP,w.__webglTexture,e.TEXTURE0+I);let ae=i.get(ie);if(ie.version!==ae.__version||V===!0){n.activeTexture(e.TEXTURE0+I);let ue=$e.getPrimaries($e.workingColorSpace),q=v.colorSpace===yr?null:$e.getPrimaries(v.colorSpace),J=v.colorSpace===yr||ue===q?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,J);let ge=v.isCompressedTexture||v.image[0].isCompressedTexture,Ae=v.image[0]&&v.image[0].isDataTexture,he=[];for(let ne=0;ne<6;ne++){if(!ge&&!Ae)he[ne]=p(v.image[ne],!0,r.maxCubemapSize);else he[ne]=Ae?v.image[ne].image:v.image[ne];he[ne]=nt(v,he[ne])}let oe=he[0],Le=s.convert(v.format,v.colorSpace),De=s.convert(v.type),Qe=S(v.internalFormat,Le,De,v.normalized,v.colorSpace),D=v.isVideoTexture!==!0,ce=ae.__version===void 0||V===!0,Y=ie.dataReady,le=T(v,oe);Me(e.TEXTURE_CUBE_MAP,v);let _e;if(ge){if(D&&ce)n.texStorage2D(e.TEXTURE_CUBE_MAP,le,Qe,oe.width,oe.height);for(let ne=0;ne<6;ne++){_e=he[ne].mipmaps;for(let de=0;de<_e.length;de++){let Be=_e[de];if(v.format!==si)if(Le!==null)if(D){if(Y)n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,de,0,0,Be.width,Be.height,Le,Be.data)}else n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,de,Qe,Be.width,Be.height,0,Be.data);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()");else if(D){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,de,0,0,Be.width,Be.height,Le,De,Be.data)}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,de,Qe,Be.width,Be.height,0,Le,De,Be.data)}}}else{if(_e=v.mipmaps,D&&ce){if(_e.length>0)le++;let ne=St(he[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,le,Qe,ne.width,ne.height)}for(let ne=0;ne<6;ne++)if(Ae){if(D){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,he[ne].width,he[ne].height,Le,De,he[ne].data)}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,Qe,he[ne].width,he[ne].height,0,Le,De,he[ne].data);for(let de=0;de<_e.length;de++){let dt=_e[de].image[ne].image;if(D){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,de+1,0,0,dt.width,dt.height,Le,De,dt.data)}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,de+1,Qe,dt.width,dt.height,0,Le,De,dt.data)}}else{if(D){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,Le,De,he[ne])}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,Qe,Le,De,he[ne]);for(let de=0;de<_e.length;de++){let Be=_e[de];if(D){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,de+1,0,0,Le,De,Be.image[ne])}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,de+1,Qe,Le,De,Be.image[ne])}}}if(m(v))E(e.TEXTURE_CUBE_MAP);if(ae.__version=ie.version,v.onUpdate)v.onUpdate(v)}w.__version=v.version}function we(w,v,I,V,ie,ae){let ue=s.convert(I.format,I.colorSpace),q=s.convert(I.type),J=S(I.internalFormat,ue,q,I.normalized,I.colorSpace),ge=i.get(v),Ae=i.get(I);if(Ae.__renderTarget=v,!ge.__hasExternalTextures){let he=Math.max(1,v.width>>ae),oe=Math.max(1,v.height>>ae);if(ie===e.TEXTURE_3D||ie===e.TEXTURE_2D_ARRAY)n.texImage3D(ie,ae,J,he,oe,v.depth,0,ue,q,null);else n.texImage2D(ie,ae,J,he,oe,0,ue,q,null)}if(n.bindFramebuffer(e.FRAMEBUFFER,w),L(v))a.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,V,ie,Ae.__webglTexture,0,Nt(v));else if(ie===e.TEXTURE_2D||ie>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&ie<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)e.framebufferTexture2D(e.FRAMEBUFFER,V,ie,Ae.__webglTexture,ae);n.bindFramebuffer(e.FRAMEBUFFER,null)}function gt(w,v,I){if(e.bindRenderbuffer(e.RENDERBUFFER,w),v.depthBuffer){let V=v.depthTexture,ie=V&&V.isDepthTexture?V.type:null,ae=b(v.stencilBuffer,ie),ue=v.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(L(v))a.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Nt(v),ae,v.width,v.height);else if(I)e.renderbufferStorageMultisample(e.RENDERBUFFER,Nt(v),ae,v.width,v.height);else e.renderbufferStorage(e.RENDERBUFFER,ae,v.width,v.height);e.framebufferRenderbuffer(e.FRAMEBUFFER,ue,e.RENDERBUFFER,w)}else{let V=v.textures;for(let ie=0;ie<V.length;ie++){let ae=V[ie],ue=s.convert(ae.format,ae.colorSpace),q=s.convert(ae.type),J=S(ae.internalFormat,ue,q,ae.normalized,ae.colorSpace);if(L(v))a.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Nt(v),J,v.width,v.height);else if(I)e.renderbufferStorageMultisample(e.RENDERBUFFER,Nt(v),J,v.width,v.height);else e.renderbufferStorage(e.RENDERBUFFER,J,v.width,v.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function ke(w,v,I){let V=v.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,w),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let ie=i.get(v.depthTexture);if(ie.__renderTarget=v,!ie.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0;if(V){if(ie.__webglInit===void 0)ie.__webglInit=!0,v.depthTexture.addEventListener("dispose",A);if(ie.__webglTexture===void 0){ie.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,ie.__webglTexture),Me(e.TEXTURE_CUBE_MAP,v.depthTexture);let ge=s.convert(v.depthTexture.format),Ae=s.convert(v.depthTexture.type),he;if(v.depthTexture.format===_r)he=e.DEPTH_COMPONENT24;else if(v.depthTexture.format===xr)he=e.DEPTH24_STENCIL8;for(let oe=0;oe<6;oe++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,he,v.width,v.height,0,ge,Ae,null)}}else te(v.depthTexture,0);let ae=ie.__webglTexture,ue=Nt(v),q=V?e.TEXTURE_CUBE_MAP_POSITIVE_X+I:e.TEXTURE_2D,J=v.depthTexture.format===xr?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(v.depthTexture.format===_r)if(L(v))a.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,J,q,ae,0,ue);else e.framebufferTexture2D(e.FRAMEBUFFER,J,q,ae,0);else if(v.depthTexture.format===xr)if(L(v))a.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,J,q,ae,0,ue);else e.framebufferTexture2D(e.FRAMEBUFFER,J,q,ae,0);else throw Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Xe(w){let v=i.get(w),I=w.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==w.depthTexture){let V=w.depthTexture;if(v.__depthDisposeCallback)v.__depthDisposeCallback();if(V){let ie=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,V.removeEventListener("dispose",ie)};V.addEventListener("dispose",ie),v.__depthDisposeCallback=ie}v.__boundDepthTexture=V}if(w.depthTexture&&!v.__autoAllocateDepthBuffer)if(I)for(let V=0;V<6;V++)ke(v.__webglFramebuffer[V],w,V);else{let V=w.texture.mipmaps;if(V&&V.length>0)ke(v.__webglFramebuffer[0],w,0);else ke(v.__webglFramebuffer,w,0)}else if(I){v.__webglDepthbuffer=[];for(let V=0;V<6;V++)if(n.bindFramebuffer(e.FRAMEBUFFER,v.__webglFramebuffer[V]),v.__webglDepthbuffer[V]===void 0)v.__webglDepthbuffer[V]=e.createRenderbuffer(),gt(v.__webglDepthbuffer[V],w,!1);else{let ie=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ae=v.__webglDepthbuffer[V];e.bindRenderbuffer(e.RENDERBUFFER,ae),e.framebufferRenderbuffer(e.FRAMEBUFFER,ie,e.RENDERBUFFER,ae)}}else{let V=w.texture.mipmaps;if(V&&V.length>0)n.bindFramebuffer(e.FRAMEBUFFER,v.__webglFramebuffer[0]);else n.bindFramebuffer(e.FRAMEBUFFER,v.__webglFramebuffer);if(v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=e.createRenderbuffer(),gt(v.__webglDepthbuffer,w,!1);else{let ie=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ae=v.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,ae),e.framebufferRenderbuffer(e.FRAMEBUFFER,ie,e.RENDERBUFFER,ae)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function st(w,v,I){let V=i.get(w);if(v!==void 0)we(V.__webglFramebuffer,w,w.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0);if(I!==void 0)Xe(w)}function Ke(w){let v=w.texture,I=i.get(w),V=i.get(v);w.addEventListener("dispose",_);let ie=w.textures,ae=w.isWebGLCubeRenderTarget===!0,ue=ie.length>1;if(!ue){if(V.__webglTexture===void 0)V.__webglTexture=e.createTexture();V.__version=v.version,o.memory.textures++}if(ae){I.__webglFramebuffer=[];for(let q=0;q<6;q++)if(v.mipmaps&&v.mipmaps.length>0){I.__webglFramebuffer[q]=[];for(let J=0;J<v.mipmaps.length;J++)I.__webglFramebuffer[q][J]=e.createFramebuffer()}else I.__webglFramebuffer[q]=e.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){I.__webglFramebuffer=[];for(let q=0;q<v.mipmaps.length;q++)I.__webglFramebuffer[q]=e.createFramebuffer()}else I.__webglFramebuffer=e.createFramebuffer();if(ue)for(let q=0,J=ie.length;q<J;q++){let ge=i.get(ie[q]);if(ge.__webglTexture===void 0)ge.__webglTexture=e.createTexture(),o.memory.textures++}if(w.samples>0&&L(w)===!1){I.__webglMultisampledFramebuffer=e.createFramebuffer(),I.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,I.__webglMultisampledFramebuffer);for(let q=0;q<ie.length;q++){let J=ie[q];I.__webglColorRenderbuffer[q]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,I.__webglColorRenderbuffer[q]);let ge=s.convert(J.format,J.colorSpace),Ae=s.convert(J.type),he=S(J.internalFormat,ge,Ae,J.normalized,J.colorSpace,w.isXRRenderTarget===!0),oe=Nt(w);e.renderbufferStorageMultisample(e.RENDERBUFFER,oe,he,w.width,w.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+q,e.RENDERBUFFER,I.__webglColorRenderbuffer[q])}if(e.bindRenderbuffer(e.RENDERBUFFER,null),w.depthBuffer)I.__webglDepthRenderbuffer=e.createRenderbuffer(),gt(I.__webglDepthRenderbuffer,w,!0);n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(ae){n.bindTexture(e.TEXTURE_CUBE_MAP,V.__webglTexture),Me(e.TEXTURE_CUBE_MAP,v);for(let q=0;q<6;q++)if(v.mipmaps&&v.mipmaps.length>0)for(let J=0;J<v.mipmaps.length;J++)we(I.__webglFramebuffer[q][J],w,v,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+q,J);else we(I.__webglFramebuffer[q],w,v,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+q,0);if(m(v))E(e.TEXTURE_CUBE_MAP);n.unbindTexture()}else if(ue){for(let q=0,J=ie.length;q<J;q++){let ge=ie[q],Ae=i.get(ge),he=e.TEXTURE_2D;if(w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)he=w.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY;if(n.bindTexture(he,Ae.__webglTexture),Me(he,ge),we(I.__webglFramebuffer,w,ge,e.COLOR_ATTACHMENT0+q,he,0),m(ge))E(he)}n.unbindTexture()}else{let q=e.TEXTURE_2D;if(w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)q=w.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY;if(n.bindTexture(q,V.__webglTexture),Me(q,v),v.mipmaps&&v.mipmaps.length>0)for(let J=0;J<v.mipmaps.length;J++)we(I.__webglFramebuffer[J],w,v,e.COLOR_ATTACHMENT0,q,J);else we(I.__webglFramebuffer,w,v,e.COLOR_ATTACHMENT0,q,0);if(m(v))E(q);n.unbindTexture()}if(w.depthBuffer)Xe(w)}function Ht(w){let v=w.textures;for(let I=0,V=v.length;I<V;I++){let ie=v[I];if(m(ie)){let ae=R(w),ue=i.get(ie).__webglTexture;n.bindTexture(ae,ue),E(ae),n.unbindTexture()}}}let _t=[],rn=[];function Lt(w){if(w.samples>0){if(L(w)===!1){let{textures:v,width:I,height:V}=w,ie=e.COLOR_BUFFER_BIT,ae=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ue=i.get(w),q=v.length>1;if(q)for(let ge=0;ge<v.length;ge++)n.bindFramebuffer(e.FRAMEBUFFER,ue.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ge,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,ue.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ge,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,ue.__webglMultisampledFramebuffer);let J=w.texture.mipmaps;if(J&&J.length>0)n.bindFramebuffer(e.DRAW_FRAMEBUFFER,ue.__webglFramebuffer[0]);else n.bindFramebuffer(e.DRAW_FRAMEBUFFER,ue.__webglFramebuffer);for(let ge=0;ge<v.length;ge++){if(w.resolveDepthBuffer){if(w.depthBuffer)ie|=e.DEPTH_BUFFER_BIT;if(w.stencilBuffer&&w.resolveStencilBuffer)ie|=e.STENCIL_BUFFER_BIT}if(q){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,ue.__webglColorRenderbuffer[ge]);let Ae=i.get(v[ge]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,Ae,0)}if(e.blitFramebuffer(0,0,I,V,0,0,I,V,ie,e.NEAREST),c===!0){if(_t.length=0,rn.length=0,_t.push(e.COLOR_ATTACHMENT0+ge),w.depthBuffer&&w.storeMultisampledDepthBuffer===!1)_t.push(ae),rn.push(ae),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,rn);e.invalidateFramebuffer(e.READ_FRAMEBUFFER,_t)}}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),q)for(let ge=0;ge<v.length;ge++){n.bindFramebuffer(e.FRAMEBUFFER,ue.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ge,e.RENDERBUFFER,ue.__webglColorRenderbuffer[ge]);let Ae=i.get(v[ge]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,ue.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ge,e.TEXTURE_2D,Ae,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,ue.__webglMultisampledFramebuffer)}else if(w.depthBuffer&&w.storeMultisampledDepthBuffer===!1&&c){let v=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[v])}}}function Nt(w){return Math.min(r.maxSamples,w.samples)}function L(w){let v=i.get(w);return w.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function sn(w){let v=o.render.frame;if(u.get(w)!==v)u.set(w,v),w.update()}function nt(w,v){let{colorSpace:I,format:V,type:ie}=w;if(w.isCompressedTexture===!0||w.isVideoTexture===!0)return v;if(I!==gn&&I!==yr)if($e.getTransfer(I)===ft){if(V!==si||ie!==Gn)Ce("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.")}else Ue("WebGLTextures: Unsupported texture color space:",I);return v}function St(w){if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement)l.width=w.naturalWidth||w.width,l.height=w.naturalHeight||w.height;else if(typeof VideoFrame<"u"&&w instanceof VideoFrame)l.width=w.displayWidth,l.height=w.displayHeight;else l.width=w.width,l.height=w.height;return l}this.allocateTextureUnit=X,this.resetTextureUnits=K,this.getTextureUnits=C,this.setTextureUnits=G,this.setTexture2D=te,this.setTexture2DArray=H,this.setTexture3D=Q,this.setTextureCube=ee,this.rebindTextures=st,this.setupRenderTarget=Ke,this.updateRenderTargetMipmap=Ht,this.updateMultisampleRenderTarget=Lt,this.setupDepthRenderbuffer=Xe,this.setupFrameBufferTexture=we,this.useMultisampledRTT=L,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function NA(e,t){function n(i,r=yr){let s,o=$e.getTransfer(r);if(i===Gn)return e.UNSIGNED_BYTE;if(i===yu)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Su)return e.UNSIGNED_SHORT_5_5_5_1;if(i===y0)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===S0)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===x0)return e.BYTE;if(i===v0)return e.SHORT;if(i===to)return e.UNSIGNED_SHORT;if(i===vu)return e.INT;if(i===$i)return e.UNSIGNED_INT;if(i===Mi)return e.FLOAT;if(i===ri)return e.HALF_FLOAT;if(i===b0)return e.ALPHA;if(i===M0)return e.RGB;if(i===si)return e.RGBA;if(i===_r)return e.DEPTH_COMPONENT;if(i===xr)return e.DEPTH_STENCIL;if(i===w0)return e.RED;if(i===bu)return e.RED_INTEGER;if(i===vr)return e.RG;if(i===Mu)return e.RG_INTEGER;if(i===wu)return e.RGBA_INTEGER;if(i===$a||i===Za||i===Xa||i===qa)if(o===ft)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===$a)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Za)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Xa)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===qa)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===$a)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Za)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Xa)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===qa)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Tu||i===Eu||i===Au||i===Ru)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Tu)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Eu)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Au)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Ru)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Cu||i===Pu||i===Iu||i===Lu||i===Nu||i===Ya||i===Du)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Cu||i===Pu)return o===ft?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Iu)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===Lu)return s.COMPRESSED_R11_EAC;if(i===Nu)return s.COMPRESSED_SIGNED_R11_EAC;if(i===Ya)return s.COMPRESSED_RG11_EAC;if(i===Du)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Ou||i===Uu||i===Fu||i===zu||i===ku||i===Bu||i===Gu||i===Hu||i===Vu||i===Wu||i===$u||i===Zu||i===Xu||i===qu)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Ou)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Uu)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Fu)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===zu)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===ku)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Bu)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Gu)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Hu)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Vu)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Wu)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===$u)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Zu)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Xu)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===qu)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Yu||i===ju||i===Ku)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(i===Yu)return o===ft?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===ju)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Ku)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Ju||i===Qu||i===ja||i===eh)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(i===Ju)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Qu)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===ja)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===eh)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;if(i===ss)return e.UNSIGNED_INT_24_8;return e[i]!==void 0?e[i]:null}return{convert:n}}var DA=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,OA=`
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

}`;class Mx{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new cc(e.texture);if(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)this.depthNear=e.depthNear,this.depthFar=e.depthFar;this.texture=n}}getMesh(e){if(this.texture!==null){if(this.mesh===null){let t=e.cameras[0].viewport,n=new Rn({vertexShader:DA,fragmentShader:OA,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new mt(new po(20,20),n)}}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class wx extends Hn{constructor(e,t){super();let n=this,i=null,r=1,s=null,o="local-floor",a=1,c=null,l=null,u=null,f=null,h=null,d=null,g=typeof XRWebGLBinding<"u",x=new Mx,p={},m=t.getContextAttributes(),E=null,R=null,S=[],b=[],T=new Ne,A=null,_=null,M=new Dt;M.viewport=new at;let F=new Dt;F.viewport=new at;let P=[M,F],O=new bh,K=null,C=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let re=S[Z];if(re===void 0)re=new so,S[Z]=re;return re.getTargetRaySpace()},this.getControllerGrip=function(Z){let re=S[Z];if(re===void 0)re=new so,S[Z]=re;return re.getGripSpace()},this.getHand=function(Z){let re=S[Z];if(re===void 0)re=new so,S[Z]=re;return re.getHandSpace()};function G(Z){let re=b.indexOf(Z.inputSource);if(re===-1)return;let se=S[re];if(se!==void 0)se.update(Z.inputSource,Z.frame,c||s),se.dispatchEvent({type:Z.type,data:Z.inputSource})}function X(){i.removeEventListener("select",G),i.removeEventListener("selectstart",G),i.removeEventListener("selectend",G),i.removeEventListener("squeeze",G),i.removeEventListener("squeezestart",G),i.removeEventListener("squeezeend",G),i.removeEventListener("end",X),i.removeEventListener("inputsourceschange",z);for(let Z=0;Z<S.length;Z++){let re=b[Z];if(re===null)continue;b[Z]=null,S[Z].disconnect(re)}K=null,C=null,x.reset();for(let Z in p)delete p[Z];if(e.setRenderTarget(E),h=null,f=null,u=null,i=null,R=null,Me.stop(),n.isPresenting=!1,e.setPixelRatio(A),e.setSize(T.width,T.height,!1),_!==null){let Z=_.camera;Z.fov=_.fov,Z.zoom=_.zoom,Z.updateProjectionMatrix(),_=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){if(r=Z,n.isPresenting===!0)Ce("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){if(o=Z,n.isPresenting===!0)Ce("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||s},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return f!==null?f:h},this.getBinding=function(){if(u===null&&g)u=new XRWebGLBinding(i,t);return u},this.getFrame=function(){return d},this.getSession=function(){return i},this.setSession=async function(Z){if(i=Z,i!==null){if(E=e.getRenderTarget(),i.addEventListener("select",G),i.addEventListener("selectstart",G),i.addEventListener("selectend",G),i.addEventListener("squeeze",G),i.addEventListener("squeezestart",G),i.addEventListener("squeezeend",G),i.addEventListener("end",X),i.addEventListener("inputsourceschange",z),m.xrCompatible!==!0)await t.makeXRCompatible();if(A=e.getPixelRatio(),e.getSize(T),!(g&&("createProjectionLayer"in XRWebGLBinding.prototype))){let se={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};h=new XRWebGLLayer(i,t,se),i.updateRenderState({baseLayer:h}),e.setPixelRatio(1),e.setSize(h.framebufferWidth,h.framebufferHeight,!1),R=new _n(h.framebufferWidth,h.framebufferHeight,{format:si,type:Gn,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{let se=null,Pe=null,Ie=null;if(m.depth)Ie=m.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,se=m.stencil?xr:_r,Pe=m.stencil?ss:$i;let we={colorFormat:t.RGBA8,depthFormat:Ie,scaleFactor:r};u=this.getBinding(),f=u.createProjectionLayer(we),i.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),R=new _n(f.textureWidth,f.textureHeight,{format:si,type:Gn,depthTexture:new Sr(f.textureWidth,f.textureHeight,Pe,void 0,void 0,void 0,void 0,void 0,void 0,se),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}R.isXRRenderTarget=!0,this.setFoveation(a),c=null,s=await i.requestReferenceSpace(o),Me.setContext(i),Me.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function z(Z){for(let re=0;re<Z.removed.length;re++){let se=Z.removed[re],Pe=b.indexOf(se);if(Pe>=0)b[Pe]=null,S[Pe].disconnect(se)}for(let re=0;re<Z.added.length;re++){let se=Z.added[re],Pe=b.indexOf(se);if(Pe===-1){for(let we=0;we<S.length;we++)if(we>=b.length){b.push(se),Pe=we;break}else if(b[we]===null){b[we]=se,Pe=we;break}if(Pe===-1)break}let Ie=S[Pe];if(Ie)Ie.connect(se)}}let te=new U,H=new U;function Q(Z,re,se){te.setFromMatrixPosition(re.matrixWorld),H.setFromMatrixPosition(se.matrixWorld);let Pe=te.distanceTo(H),Ie=re.projectionMatrix.elements,we=se.projectionMatrix.elements,gt=Ie[14]/(Ie[10]-1),ke=Ie[14]/(Ie[10]+1),Xe=(Ie[9]+1)/Ie[5],st=(Ie[9]-1)/Ie[5],Ke=(Ie[8]-1)/Ie[0],Ht=(we[8]+1)/we[0],_t=gt*Ke,rn=gt*Ht,Lt=Pe/(-Ke+Ht),Nt=Lt*-Ke;if(re.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(Nt),Z.translateZ(Lt),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),Ie[10]===-1)Z.projectionMatrix.copy(re.projectionMatrix),Z.projectionMatrixInverse.copy(re.projectionMatrixInverse);else{let L=gt+Lt,sn=ke+Lt,nt=_t-Nt,St=rn+(Pe-Nt),w=Xe*ke/sn*L,v=st*ke/sn*L;Z.projectionMatrix.makePerspective(nt,St,w,v,L,sn),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function ee(Z,re){if(re===null)Z.matrixWorld.copy(Z.matrix);else Z.matrixWorld.multiplyMatrices(re.matrixWorld,Z.matrix);Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(i===null)return;let{near:re,far:se}=Z;if(x.texture!==null){if(x.depthNear>0)re=x.depthNear;if(x.depthFar>0)se=x.depthFar}if(O.near=F.near=M.near=re,O.far=F.far=M.far=se,K!==O.near||C!==O.far)i.updateRenderState({depthNear:O.near,depthFar:O.far}),K=O.near,C=O.far;O.layers.mask=Z.layers.mask|6,M.layers.mask=O.layers.mask&-5,F.layers.mask=O.layers.mask&-3;let Pe=Z.parent,Ie=O.cameras;ee(O,Pe);for(let we=0;we<Ie.length;we++)ee(Ie[we],Pe);if(Ie.length===2)Q(O,M,F);else O.projectionMatrix.copy(M.projectionMatrix);if(_===null&&Z.isPerspectiveCamera)_={camera:Z,fov:Z.fov,zoom:Z.zoom};Te(Z,O,Pe)};function Te(Z,re,se){if(se===null)Z.matrix.copy(re.matrixWorld);else Z.matrix.copy(se.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(re.matrixWorld);if(Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(re.projectionMatrix),Z.projectionMatrixInverse.copy(re.projectionMatrixInverse),Z.isPerspectiveCamera)Z.fov=pr*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1}this.getCamera=function(){return O},this.getFoveation=function(){if(f===null&&h===null)return;return a},this.setFoveation=function(Z){if(a=Z,f!==null)f.fixedFoveation=Z;if(h!==null&&h.fixedFoveation!==void 0)h.fixedFoveation=Z},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(O)},this.getCameraTexture=function(Z){return p[Z]};let ve=null;function He(Z,re){if(l=re.getViewerPose(c||s),d=re,l!==null){let se=l.views;if(h!==null)e.setRenderTargetFramebuffer(R,h.framebuffer),e.setRenderTarget(R);let Pe=!1;if(se.length!==O.cameras.length)O.cameras.length=0,Pe=!0;for(let ke=0;ke<se.length;ke++){let Xe=se[ke],st=null;if(h!==null)st=h.getViewport(Xe);else{let Ht=u.getViewSubImage(f,Xe);if(st=Ht.viewport,ke===0)e.setRenderTargetTextures(R,Ht.colorTexture,Ht.depthStencilTexture),e.setRenderTarget(R)}let Ke=P[ke];if(Ke===void 0)Ke=new Dt,Ke.layers.enable(ke),Ke.viewport=new at,P[ke]=Ke;if(Ke.matrix.fromArray(Xe.transform.matrix),Ke.matrix.decompose(Ke.position,Ke.quaternion,Ke.scale),Ke.projectionMatrix.fromArray(Xe.projectionMatrix),Ke.projectionMatrixInverse.copy(Ke.projectionMatrix).invert(),Ke.viewport.set(st.x,st.y,st.width,st.height),ke===0)O.matrix.copy(Ke.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale);if(Pe===!0)O.cameras.push(Ke)}let Ie=i.enabledFeatures;if(Ie&&Ie.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&g){u=n.getBinding();let ke=u.getDepthInformation(se[0]);if(ke&&ke.isValid&&ke.texture)x.init(ke,i.renderState)}if(Ie&&Ie.includes("camera-access")&&g){e.state.unbindTexture(),u=n.getBinding();for(let ke=0;ke<se.length;ke++){let Xe=se[ke].camera;if(Xe){let st=p[Xe];if(!st)st=new cc,p[Xe]=st;let Ke=u.getCameraImage(Xe);st.sourceTexture=Ke}}}}for(let se=0;se<S.length;se++){let Pe=b[se],Ie=S[se];if(Pe!==null&&Ie!==void 0)Ie.update(Pe,re,c||s)}if(ve)ve(Z,re);if(re.detectedPlanes)n.dispatchEvent({type:"planesdetected",data:re});d=null}let Me=new fx;Me.setAnimationLoop(He),this.setAnimationLoop=function(Z){ve=Z},this.dispose=function(){}}}var UA=new Ge,Tx=new ze;Tx.set(-1,0,0,0,1,0,0,0,1);function FA(e,t){function n(p,m){if(p.matrixAutoUpdate===!0)p.updateMatrix();m.value.copy(p.matrix)}function i(p,m){if(m.color.getRGB(p.fogColor.value,fh(e)),m.isFog)p.fogNear.value=m.near,p.fogFar.value=m.far;else if(m.isFogExp2)p.fogDensity.value=m.density}function r(p,m,E,R,S){if(m.isNodeMaterial)m.uniformsNeedUpdate=!1;else if(m.isMeshBasicMaterial)s(p,m);else if(m.isMeshLambertMaterial){if(s(p,m),m.envMap)p.envMapIntensity.value=m.envMapIntensity}else if(m.isMeshToonMaterial)s(p,m),f(p,m);else if(m.isMeshPhongMaterial){if(s(p,m),u(p,m),m.envMap)p.envMapIntensity.value=m.envMapIntensity}else if(m.isMeshStandardMaterial){if(s(p,m),h(p,m),m.isMeshPhysicalMaterial)d(p,m,S)}else if(m.isMeshMatcapMaterial)s(p,m),g(p,m);else if(m.isMeshDepthMaterial)s(p,m);else if(m.isMeshDistanceMaterial)s(p,m),x(p,m);else if(m.isMeshNormalMaterial)s(p,m);else if(m.isLineBasicMaterial){if(o(p,m),m.isLineDashedMaterial)a(p,m)}else if(m.isPointsMaterial)c(p,m,E,R);else if(m.isSpriteMaterial)l(p,m);else if(m.isShadowMaterial)p.color.value.copy(m.color),p.opacity.value=m.opacity;else if(m.isShaderMaterial)m.uniformsNeedUpdate=!1}function s(p,m){if(p.opacity.value=m.opacity,m.color)p.diffuse.value.copy(m.color);if(m.emissive)p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity);if(m.map)p.map.value=m.map,n(m.map,p.mapTransform);if(m.alphaMap)p.alphaMap.value=m.alphaMap,n(m.alphaMap,p.alphaMapTransform);if(m.bumpMap){if(p.bumpMap.value=m.bumpMap,n(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===Yt)p.bumpScale.value*=-1}if(m.normalMap){if(p.normalMap.value=m.normalMap,n(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===Yt)p.normalScale.value.negate()}if(m.displacementMap)p.displacementMap.value=m.displacementMap,n(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias;if(m.emissiveMap)p.emissiveMap.value=m.emissiveMap,n(m.emissiveMap,p.emissiveMapTransform);if(m.specularMap)p.specularMap.value=m.specularMap,n(m.specularMap,p.specularMapTransform);if(m.alphaTest>0)p.alphaTest.value=m.alphaTest;let E=t.get(m),{envMap:R,envMapRotation:S}=E;if(R){if(p.envMap.value=R,p.envMapRotation.value.setFromMatrix4(UA.makeRotationFromEuler(S)).transpose(),R.isCubeTexture&&R.isRenderTargetTexture===!1)p.envMapRotation.value.premultiply(Tx);p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio}if(m.lightMap)p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,n(m.lightMap,p.lightMapTransform);if(m.aoMap)p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,n(m.aoMap,p.aoMapTransform)}function o(p,m){if(p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map)p.map.value=m.map,n(m.map,p.mapTransform)}function a(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function c(p,m,E,R){if(p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*E,p.scale.value=R*0.5,m.map)p.map.value=m.map,n(m.map,p.uvTransform);if(m.alphaMap)p.alphaMap.value=m.alphaMap,n(m.alphaMap,p.alphaMapTransform);if(m.alphaTest>0)p.alphaTest.value=m.alphaTest}function l(p,m){if(p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map)p.map.value=m.map,n(m.map,p.mapTransform);if(m.alphaMap)p.alphaMap.value=m.alphaMap,n(m.alphaMap,p.alphaMapTransform);if(m.alphaTest>0)p.alphaTest.value=m.alphaTest}function u(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,0.0001)}function f(p,m){if(m.gradientMap)p.gradientMap.value=m.gradientMap}function h(p,m){if(p.metalness.value=m.metalness,m.metalnessMap)p.metalnessMap.value=m.metalnessMap,n(m.metalnessMap,p.metalnessMapTransform);if(p.roughness.value=m.roughness,m.roughnessMap)p.roughnessMap.value=m.roughnessMap,n(m.roughnessMap,p.roughnessMapTransform);if(m.envMap)p.envMapIntensity.value=m.envMapIntensity}function d(p,m,E){if(p.ior.value=m.ior,m.sheen>0){if(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap)p.sheenColorMap.value=m.sheenColorMap,n(m.sheenColorMap,p.sheenColorMapTransform);if(m.sheenRoughnessMap)p.sheenRoughnessMap.value=m.sheenRoughnessMap,n(m.sheenRoughnessMap,p.sheenRoughnessMapTransform)}if(m.clearcoat>0){if(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap)p.clearcoatMap.value=m.clearcoatMap,n(m.clearcoatMap,p.clearcoatMapTransform);if(m.clearcoatRoughnessMap)p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,n(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform);if(m.clearcoatNormalMap){if(p.clearcoatNormalMap.value=m.clearcoatNormalMap,n(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Yt)p.clearcoatNormalScale.value.negate()}}if(m.dispersion>0)p.dispersion.value=m.dispersion;if(m.retroreflectivity>0)p.retroreflectivity.value=m.retroreflectivity;if(m.iridescence>0){if(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap)p.iridescenceMap.value=m.iridescenceMap,n(m.iridescenceMap,p.iridescenceMapTransform);if(m.iridescenceThicknessMap)p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,n(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform)}if(m.transmission>0){if(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=E.texture,p.transmissionSamplerSize.value.set(E.width,E.height),m.transmissionMap)p.transmissionMap.value=m.transmissionMap,n(m.transmissionMap,p.transmissionMapTransform);if(p.thickness.value=m.thickness,m.thicknessMap)p.thicknessMap.value=m.thicknessMap,n(m.thicknessMap,p.thicknessMapTransform);p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)}if(m.anisotropy>0){if(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap)p.anisotropyMap.value=m.anisotropyMap,n(m.anisotropyMap,p.anisotropyMapTransform)}if(p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap)p.specularColorMap.value=m.specularColorMap,n(m.specularColorMap,p.specularColorMapTransform);if(m.specularIntensityMap)p.specularIntensityMap.value=m.specularIntensityMap,n(m.specularIntensityMap,p.specularIntensityMapTransform)}function g(p,m){if(m.matcap)p.matcap.value=m.matcap}function x(p,m){let E=t.get(m).light;p.referencePosition.value.setFromMatrixPosition(E.matrixWorld),p.nearDistance.value=E.shadow.camera.near,p.farDistance.value=E.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function zA(e,t,n,i){let r={},s={},o=[],a=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(S,b){let T=b.program;i.uniformBlockBinding(S,T)}function l(S,b){let T=r[S.id];if(T===void 0)p(S),T=u(S),r[S.id]=T,S.addEventListener("dispose",E);let A=b.program;i.updateUBOMapping(S,A);let _=t.render.frame;if(s[S.id]!==_)h(S),s[S.id]=_}function u(S){let b=f();S.__bindingPointIndex=b;let T=e.createBuffer(),{__size:A,usage:_}=S;return e.bindBuffer(e.UNIFORM_BUFFER,T),e.bufferData(e.UNIFORM_BUFFER,A,_),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,b,T),T}function f(){for(let S=0;S<a;S++)if(o.indexOf(S)===-1)return o.push(S),S;return Ue("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(S){let b=r[S.id],{uniforms:T,__cache:A}=S;e.bindBuffer(e.UNIFORM_BUFFER,b);for(let _=0,M=T.length;_<M;_++){let F=T[_];if(Array.isArray(F))for(let P=0,O=F.length;P<O;P++)d(F[P],_,P,A);else d(F,_,0,A)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function d(S,b,T,A){if(x(S,b,T,A)===!0){let{__offset:_,value:M}=S;if(Array.isArray(M)){let F=0;for(let P=0;P<M.length;P++){let O=M[P],K=m(O);if(g(O,S.__data,F),typeof O!=="number"&&typeof O!=="boolean"&&!O.isMatrix3&&!ArrayBuffer.isView(O))F+=K.storage/Float32Array.BYTES_PER_ELEMENT}}else g(M,S.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,_,S.__data)}}function g(S,b,T){if(typeof S==="number"||typeof S==="boolean")b[0]=S;else if(S.isMatrix3)b[0]=S.elements[0],b[1]=S.elements[1],b[2]=S.elements[2],b[3]=0,b[4]=S.elements[3],b[5]=S.elements[4],b[6]=S.elements[5],b[7]=0,b[8]=S.elements[6],b[9]=S.elements[7],b[10]=S.elements[8],b[11]=0;else if(ArrayBuffer.isView(S))b.set(new S.constructor(S.buffer,S.byteOffset,b.length));else S.toArray(b,T)}function x(S,b,T,A){let _=S.value,M=b+"_"+T;if(A[M]===void 0){if(typeof _==="number"||typeof _==="boolean")A[M]=_;else if(ArrayBuffer.isView(_))A[M]=_.slice();else A[M]=_.clone();return!0}else{let F=A[M];if(typeof _==="number"||typeof _==="boolean"){if(F!==_)return A[M]=_,!0}else if(ArrayBuffer.isView(_))return!0;else if(F.equals(_)===!1)return F.copy(_),!0}return!1}function p(S){let b=S.uniforms,T=0,A=16;for(let M=0,F=b.length;M<F;M++){let P=Array.isArray(b[M])?b[M]:[b[M]];for(let O=0,K=P.length;O<K;O++){let C=P[O],G=Array.isArray(C.value)?C.value:[C.value];for(let X=0,z=G.length;X<z;X++){let te=G[X],H=m(te),Q=T%A,ee=Q%H.boundary,Te=Q+ee;if(T+=ee,Te!==0&&A-Te<H.storage)T+=A-Te;C.__data=new Float32Array(H.storage/Float32Array.BYTES_PER_ELEMENT),C.__offset=T,T+=H.storage}}}let _=T%A;if(_>0)T+=A-_;return S.__size=T,S.__cache={},this}function m(S){let b={boundary:0,storage:0};if(typeof S==="number"||typeof S==="boolean")b.boundary=4,b.storage=4;else if(S.isVector2)b.boundary=8,b.storage=8;else if(S.isVector3||S.isColor)b.boundary=16,b.storage=12;else if(S.isVector4)b.boundary=16,b.storage=16;else if(S.isMatrix3)b.boundary=48,b.storage=48;else if(S.isMatrix4)b.boundary=64,b.storage=64;else if(S.isTexture)Ce("WebGLRenderer: Texture samplers can not be part of an uniforms group.");else if(ArrayBuffer.isView(S))b.boundary=16,b.storage=S.byteLength;else Ce("WebGLRenderer: Unsupported uniform value type.",S);return b}function E(S){let b=S.target;b.removeEventListener("dispose",E);let T=o.indexOf(b.__bindingPointIndex);o.splice(T,1),e.deleteBuffer(r[b.id]),delete r[b.id],delete s[b.id]}function R(){for(let S in r)e.deleteBuffer(r[S]);o=[],r={},s={}}return{bind:c,update:l,dispose:R}}var kA=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),ai=null;function BA(){if(ai===null)ai=new co(kA,16,16,vr,ri),ai.name="DFG_LUT",ai.minFilter=Gt,ai.magFilter=Gt,ai.wrapS=is,ai.wrapT=is,ai.generateMipmaps=!1,ai.needsUpdate=!0;return ai}class zh{constructor(e={}){let{canvas:t=L0(),context:n=null,depth:i=!0,stencil:r=!1,alpha:s=!1,antialias:o=!1,premultipliedAlpha:a=!0,preserveDrawingBuffer:c=!1,powerPreference:l="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:f=!1,outputBufferType:h=Gn}=e;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=s;let g=h,x=new Set([wu,Mu,bu]),p=new Set([Gn,$i,to,ss,yu,Su]),m=new Uint32Array(4),E=new Int32Array(4),R=new U,S=null,b=null,T=[],A=[],_=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=kn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let M=this,F=!1,P=null,O=null,K=null,C=null;this._outputColorSpace=Zi;let G=0,X=0,z=null,te=-1,H=null,Q=new at,ee=new at,Te=null,ve=new Oe(0),He=0,{width:Me,height:Z}=t,re=1,se=null,Pe=null,Ie=new at(0,0,Me,Z),we=new at(0,0,Me,Z),gt=!1,ke=new uo,Xe=!1,st=!1,Ke=new Ge,Ht=new U,_t=new at,rn={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Lt=!1;function Nt(){return z===null?re:1}let L=n;function sn(y,N){return t.getContext(y,N)}let nt,St,w,v,I,V,ie,ae,ue,q,J,ge,Ae,he,oe,Le,De,Qe,D,ce,Y,le,_e;try{let y={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:a,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if("setAttribute"in t)t.setAttribute("data-engine",`three.js r${z_}`);if(t.addEventListener("webglcontextlost",Be,!1),t.addEventListener("webglcontextrestored",dt,!1),t.addEventListener("webglcontextcreationerror",it,!1),L===null){if(L=sn("webgl2",y),L===null)if(sn("webgl2"))throw Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.");else throw Error("THREE.WebGLRenderer: Error creating WebGL context.")}ne()}catch(y){throw t.removeEventListener("webglcontextlost",Be,!1),t.removeEventListener("webglcontextrestored",dt,!1),t.removeEventListener("webglcontextcreationerror",it,!1),Ue("WebGLRenderer: "+y.message),y}function ne(){if(nt=new XT(L),nt.init(),Y=new NA(L,nt),St=new FT(L,nt,e,Y),w=new IA(L,nt),St.reversedDepthBuffer&&f)w.buffers.depth.setReversed(!0);O=L.createFramebuffer(),K=L.createFramebuffer(),C=L.createFramebuffer(),v=new jT(L),I=new _A,V=new LA(L,nt,w,I,St,Y,v),ie=new ZT(M),ae=new Jb(L),le=new OT(L,ae),ue=new qT(L,ae,v,le),q=new JT(L,ue,ae,le,v),Qe=new KT(L,St,V),oe=new zT(I),J=new gA(M,ie,nt,St,le,oe),ge=new FA(M,I),Ae=new vA,he=new TA(nt),De=new DT(M,ie,w,q,d,a),Le=new PA(M,q,St),_e=new zA(L,v,St,w),D=new UT(L,nt,v),ce=new YT(L,nt,v),v.programs=J.programs,M.capabilities=St,M.extensions=nt,M.properties=I,M.renderLists=Ae,M.shadowMap=Le,M.state=w,M.info=v}if(g!==Gn)_=new eE(g,t.width,t.height,o,i,r);let de=new wx(M,L);this.xr=de,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){let y=nt.get("WEBGL_lose_context");if(y)y.loseContext()},this.forceContextRestore=function(){let y=nt.get("WEBGL_lose_context");if(y)y.restoreContext()},this.getPixelRatio=function(){return re},this.setPixelRatio=function(y){if(y===void 0)return;re=y,this.setSize(Me,Z,!1)},this.getSize=function(y){return y.set(Me,Z)},this.setSize=function(y,N,W=!0){if(de.isPresenting){Ce("WebGLRenderer: Can't change size while VR device is presenting.");return}if(Me=y,Z=N,t.width=Math.floor(y*re),t.height=Math.floor(N*re),W===!0)t.style.width=y+"px",t.style.height=N+"px";if(_!==null)_.setSize(t.width,t.height);this.setViewport(0,0,y,N)},this.getDrawingBufferSize=function(y){return y.set(Me*re,Z*re).floor()},this.setDrawingBufferSize=function(y,N,W){Me=y,Z=N,re=W,t.width=Math.floor(y*W),t.height=Math.floor(N*W),this.setViewport(0,0,y,N)},this.setEffects=function(y){if(g===Gn){Ue("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(y){for(let N=0;N<y.length;N++)if(y[N].isOutputPass===!0){Ce("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}_.setEffects(y||[])},this.getCurrentViewport=function(y){return y.copy(Q)},this.getViewport=function(y){return y.copy(Ie)},this.setViewport=function(y,N,W,k){if(y.isVector4)Ie.set(y.x,y.y,y.z,y.w);else Ie.set(y,N,W,k);w.viewport(Q.copy(Ie).multiplyScalar(re).round())},this.getScissor=function(y){return y.copy(we)},this.setScissor=function(y,N,W,k){if(y.isVector4)we.set(y.x,y.y,y.z,y.w);else we.set(y,N,W,k);w.scissor(ee.copy(we).multiplyScalar(re).round())},this.getScissorTest=function(){return gt},this.setScissorTest=function(y){w.setScissorTest(gt=y)},this.setOpaqueSort=function(y){se=y},this.setTransparentSort=function(y){Pe=y},this.getClearColor=function(y){return y.copy(De.getClearColor())},this.setClearColor=function(){De.setClearColor(...arguments)},this.getClearAlpha=function(){return De.getClearAlpha()},this.setClearAlpha=function(){De.setClearAlpha(...arguments)},this.clear=function(y=!0,N=!0,W=!0){let k=0;if(y){let B=!1;if(z!==null){let me=z.texture.format;B=x.has(me)}if(B){let me=z.texture.type,ye=p.has(me),pe=De.getClearColor(),Se=De.getClearAlpha(),{r:Ee,g:Ve,b:Ye}=pe;if(ye)m[0]=Ee,m[1]=Ve,m[2]=Ye,m[3]=Se,L.clearBufferuiv(L.COLOR,0,m);else E[0]=Ee,E[1]=Ve,E[2]=Ye,E[3]=Se,L.clearBufferiv(L.COLOR,0,E)}else k|=L.COLOR_BUFFER_BIT}if(N)k|=L.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0);if(W)k|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295);if(k!==0)L.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(y){y.setRenderer(this),P=y},this.dispose=function(){t.removeEventListener("webglcontextlost",Be,!1),t.removeEventListener("webglcontextrestored",dt,!1),t.removeEventListener("webglcontextcreationerror",it,!1),De.dispose(),Ae.dispose(),he.dispose(),I.dispose(),ie.dispose(),q.dispose(),le.dispose(),_e.dispose(),J.dispose(),de.dispose(),de.removeEventListener("sessionstart",nf),de.removeEventListener("sessionend",rf),ir.stop()};function Be(y){y.preventDefault(),js("WebGLRenderer: Context Lost."),F=!0}function dt(){js("WebGLRenderer: Context Restored."),F=!1;let y=v.autoReset,N=Le.enabled,W=Le.autoUpdate,k=Le.needsUpdate,B=Le.type;ne(),v.autoReset=y,Le.enabled=N,Le.autoUpdate=W,Le.needsUpdate=k,Le.type=B}function it(y){Ue("WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function Vn(y){let N=y.target;N.removeEventListener("dispose",Vn),ui(N)}function ui(y){pv(y),I.remove(y)}function pv(y){let N=I.get(y).programs;if(N!==void 0){if(N.forEach(function(W){J.releaseProgram(W)}),y.isShaderMaterial)J.releaseShaderCache(y)}}this.renderBufferDirect=function(y,N,W,k,B,me){if(N===null)N=rn;let ye=B.isMesh&&B.matrixWorld.determinantAffine()<0,pe=_v(y,N,W,k,B);w.setMaterial(k,ye);let Se=W.index,Ee=1;if(k.wireframe===!0){if(Se=ue.getWireframeAttribute(W),Se===void 0)return;Ee=2}let Ve=W.drawRange,Ye=W.attributes.position,be=Ve.start*Ee,rt=(Ve.start+Ve.count)*Ee;if(me!==null)be=Math.max(be,me.start*Ee),rt=Math.min(rt,(me.start+me.count)*Ee);if(Se!==null)be=Math.max(be,0),rt=Math.min(rt,Se.count);else if(Ye!==void 0&&Ye!==null)be=Math.max(be,0),rt=Math.min(rt,Ye.count);let Pt=rt-be;if(Pt<0||Pt===1/0)return;le.setup(B,k,pe,W,Se);let xt,ht=D;if(Se!==null)xt=ae.get(Se),ht=ce,ht.setIndex(xt);if(B.isMesh)if(k.wireframe===!0)w.setLineWidth(k.wireframeLinewidth*Nt()),ht.setMode(L.LINES);else ht.setMode(L.TRIANGLES);else if(B.isLine){let $t=k.linewidth;if($t===void 0)$t=1;if(w.setLineWidth($t*Nt()),B.isLineSegments)ht.setMode(L.LINES);else if(B.isLineLoop)ht.setMode(L.LINE_LOOP);else ht.setMode(L.LINE_STRIP)}else if(B.isPoints)ht.setMode(L.POINTS);else if(B.isSprite)ht.setMode(L.TRIANGLES);if(B.isBatchedMesh)if(!nt.get("WEBGL_multi_draw")){let{_multiDrawStarts:$t,_multiDrawCounts:xe,_multiDrawCount:Jt}=B,Je=Se?ae.get(Se).bytesPerElement:1,bn=I.get(k).currentProgram.getUniforms();for(let Wn=0;Wn<Jt;Wn++)bn.setValue(L,"_gl_DrawID",Wn),ht.render($t[Wn]/Je,xe[Wn])}else ht.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else if(B.isInstancedMesh)ht.renderInstances(be,Pt,B.count);else if(W.isInstancedBufferGeometry){let $t=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,xe=Math.min(W.instanceCount,$t);ht.renderInstances(be,Pt,xe)}else ht.render(be,Pt)};function tf(y,N,W,k){if(P!==null&&y.isNodeMaterial)P.setObject(k,y);if(Xe===!0)oe.setState(y,W,!1);if(y.transparent===!0&&y.side===An&&y.forceSinglePass===!1)y.side=Yt,y.needsUpdate=!0,Io(y,N,k),y.side=Wi,y.needsUpdate=!0,Io(y,N,k),y.side=An;else Io(y,N,k)}this.compile=function(y,N,W=null){if(W===null)W=y;if(P!==null)P.renderStart(y,N,W);if(b=he.get(W),b.init(N),A.push(b),W.traverseVisible(function(B){if(B.isLight&&B.layers.test(N.layers)){if(b.pushLight(B),B.castShadow)b.pushShadow(B)}}),y!==W)y.traverseVisible(function(B){if(B.isLight&&B.layers.test(N.layers)){if(b.pushLight(B),B.castShadow)b.pushShadow(B)}});if(b.setupLights(),P!==null)P.updateLights(b.state.lightsArray);if(st=this.localClippingEnabled,Xe=oe.init(this.clippingPlanes,st),Xe===!0)oe.setGlobalState(this.clippingPlanes,N);if(P!==null)Le.render(b.state.shadowsArray,W,N);let k=new Set;if(y.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let me=B.material;if(me)if(Array.isArray(me))for(let ye=0;ye<me.length;ye++){let pe=me[ye];tf(pe,W,N,B),k.add(pe)}else tf(me,W,N,B),k.add(me)}),b=A.pop(),P!==null)P.renderEnd();return k},this.compileAsync=function(y,N,W=null){let k=this.compile(y,N,W);return new Promise((B)=>{function me(){if(k.forEach(function(ye){let Se=I.get(ye).currentProgram;if(Se===void 0||Se.isReady())k.delete(ye)}),k.size===0){B(y);return}setTimeout(me,10)}if(nt.get("KHR_parallel_shader_compile")!==null)me();else setTimeout(me,10)})};let Ec=null;function mv(y){if(Ec)Ec(y)}function nf(){ir.stop()}function rf(){ir.start()}let ir=new fx;if(ir.setAnimationLoop(mv),typeof self<"u")ir.setContext(self);this.setAnimationLoop=function(y){Ec=y,de.setAnimationLoop(y),y===null?ir.stop():ir.start()},de.addEventListener("sessionstart",nf),de.addEventListener("sessionend",rf),this.render=function(y,N){if(N!==void 0&&N.isCamera!==!0){Ue("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(F===!0)return;if(P!==null)P.renderStart(y,N);let W=de.enabled===!0&&de.isPresenting===!0,k=_!==null&&(z===null||W)&&_.begin(M,z);if(y.matrixWorldAutoUpdate===!0)y.updateMatrixWorld();if(N.parent===null&&N.matrixWorldAutoUpdate===!0)N.updateMatrixWorld();if(de.enabled===!0&&de.isPresenting===!0&&(_===null||_.isCompositing()===!1)){if(de.cameraAutoUpdate===!0)de.updateCamera(N);N=de.getCamera()}if(y.isScene===!0)y.onBeforeRender(M,y,N,z);if(b=he.get(y,A.length),b.init(N),b.state.textureUnits=V.getTextureUnits(),A.push(b),Ke.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),ke.setFromProjectionMatrix(Ke,oh,N.reversedDepth),st=this.localClippingEnabled,Xe=oe.init(this.clippingPlanes,st),S=Ae.get(y,T.length),S.init(),T.push(S),de.enabled===!0&&de.isPresenting===!0){let ye=M.xr.getDepthSensingMesh();if(ye!==null)Ac(ye,N,-1/0,M.sortObjects)}if(Ac(y,N,0,M.sortObjects),S.finish(),P!==null)P.updateLights(b.state.lightsArray);if(M.sortObjects===!0)S.sort(se,Pe);if(Lt=de.enabled===!1||de.isPresenting===!1||de.hasDepthSensing()===!1,Lt)De.addToRenderList(S,y);if(this.info.render.frame++,this.info.autoReset===!0)this.info.reset();if(Xe===!0)oe.beginShadows();let B=b.state.shadowsArray;if(Le.render(B,y,N),Xe===!0)oe.endShadows();if((k&&_.hasRenderPass())===!1){let ye=S.opaque,pe=S.transmissive;if(b.setupLights(),N.isArrayCamera){let Se=N.cameras;if(pe.length>0)for(let Ee=0,Ve=Se.length;Ee<Ve;Ee++){let Ye=Se[Ee];of(ye,pe,y,Ye)}if(Lt)De.render(y);for(let Ee=0,Ve=Se.length;Ee<Ve;Ee++){let Ye=Se[Ee];sf(S,y,Ye,Ye.viewport)}}else{if(pe.length>0)of(ye,pe,y,N);if(Lt)De.render(y);sf(S,y,N)}}if(z!==null&&X===0)V.updateMultisampleRenderTarget(z),V.updateRenderTargetMipmap(z);if(k)_.end(M);if(y.isScene===!0)y.onAfterRender(M,y,N);if(le.resetDefaultState(),te=-1,H=null,A.pop(),A.length>0){if(b=A[A.length-1],V.setTextureUnits(b.state.textureUnits),Xe===!0)oe.setGlobalState(M.clippingPlanes,b.state.camera)}else b=null;if(T.pop(),T.length>0)S=T[T.length-1];else S=null;if(P!==null)P.renderEnd()};function Ac(y,N,W,k){if(y.visible===!1)return;if(y.layers.test(N.layers)){if(y.isGroup)W=y.renderOrder;else if(y.isLOD){if(y.autoUpdate===!0)y.update(N)}else if(y.isLightProbeGrid)b.pushLightProbeGrid(y);else if(y.isLight){if(b.pushLight(y),y.castShadow)b.pushShadow(y)}else if(y.isSprite){if(!y.frustumCulled||y.intersectsFrustum(ke)){if(k)_t.setFromMatrixPosition(y.matrixWorld).applyMatrix4(Ke);let ye=q.update(y),pe=y.material;if(pe.visible)S.push(y,ye,pe,W,_t.z,null,N)}}else if(y.isMesh||y.isLine||y.isPoints){if(!y.frustumCulled||y.intersectsFrustum(ke)){let ye=q.update(y),pe=y.material;if(k){if(y.boundingSphere!==void 0){if(y.boundingSphere===null)y.computeBoundingSphere();_t.copy(y.boundingSphere.center)}else{if(ye.boundingSphere===null)ye.computeBoundingSphere();_t.copy(ye.boundingSphere.center)}_t.applyMatrix4(y.matrixWorld).applyMatrix4(Ke)}if(Array.isArray(pe)){let Se=ye.groups;for(let Ee=0,Ve=Se.length;Ee<Ve;Ee++){let Ye=Se[Ee],be=pe[Ye.materialIndex];if(be&&be.visible)S.push(y,ye,be,W,_t.z,Ye,N)}}else if(pe.visible)S.push(y,ye,pe,W,_t.z,null,N)}}}let me=y.children;for(let ye=0,pe=me.length;ye<pe;ye++)Ac(me[ye],N,W,k)}function sf(y,N,W,k){let{opaque:B,transmissive:me,transparent:ye}=y;if(b.setupLightsView(W),Xe===!0)oe.setGlobalState(M.clippingPlanes,W);if(k)w.viewport(Q.copy(k));if(B.length>0)Po(B,N,W);if(me.length>0)Po(me,N,W);if(ye.length>0)Po(ye,N,W);w.buffers.depth.setTest(!0),w.buffers.depth.setMask(!0),w.buffers.color.setMask(!0),w.setPolygonOffset(!1)}function of(y,N,W,k){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[k.id]===void 0){let be=nt.has("EXT_color_buffer_half_float")||nt.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[k.id]=new _n(1,1,{generateMipmaps:!0,type:be?ri:Gn,minFilter:ii,samples:Math.max(4,St.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:$e.workingColorSpace})}let me=b.state.transmissionRenderTarget[k.id],ye=k.viewport||Q;me.setSize(ye.z*M.transmissionResolutionScale,ye.w*M.transmissionResolutionScale);let pe=M.getRenderTarget(),Se=M.getActiveCubeFace(),Ee=M.getActiveMipmapLevel();if(M.setRenderTarget(me),M.getClearColor(ve),He=M.getClearAlpha(),He<1)M.setClearColor(16777215,0.5);if(M.clear(),Lt)De.render(W);let Ve=M.toneMapping;M.toneMapping=kn;let Ye=k.viewport;if(k.viewport!==void 0)k.viewport=void 0;if(b.setupLightsView(k),Xe===!0)oe.setGlobalState(M.clippingPlanes,k);if(Po(y,W,k),V.updateMultisampleRenderTarget(me),V.updateRenderTargetMipmap(me),nt.has("WEBGL_multisampled_render_to_texture")===!1){let be=!1;for(let rt=0,Pt=N.length;rt<Pt;rt++){let xt=N[rt],{object:ht,geometry:$t,material:xe,group:Jt}=xt;if(xe.side===An&&ht.layers.test(k.layers)){let Je=xe.side;xe.side=Yt,xe.needsUpdate=!0,af(ht,W,k,$t,xe,Jt),xe.side=Je,xe.needsUpdate=!0,be=!0}}if(be===!0)V.updateMultisampleRenderTarget(me),V.updateRenderTargetMipmap(me)}if(M.setRenderTarget(pe,Se,Ee),M.setClearColor(ve,He),Ye!==void 0)k.viewport=Ye;M.toneMapping=Ve}function Po(y,N,W){let k=N.isScene===!0?N.overrideMaterial:null;for(let B=0,me=y.length;B<me;B++){let ye=y[B],{object:pe,geometry:Se,group:Ee}=ye,Ve=ye.material;if(Ve.allowOverride===!0&&k!==null)Ve=k;if(pe.layers.test(W.layers))af(pe,N,W,Se,Ve,Ee)}}function af(y,N,W,k,B,me){if(P!==null&&B.isNodeMaterial)P.setObject(y,B);if(y.onBeforeRender(M,N,W,k,B,me),y.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),B.onBeforeRender(M,N,W,k,y,me),B.transparent===!0&&B.side===An&&B.forceSinglePass===!1)B.side=Yt,B.needsUpdate=!0,M.renderBufferDirect(W,N,k,B,y,me),B.side=Wi,B.needsUpdate=!0,M.renderBufferDirect(W,N,k,B,y,me),B.side=An;else M.renderBufferDirect(W,N,k,B,y,me);y.onAfterRender(M,N,W,k,B,me)}function Io(y,N,W){if(N.isScene!==!0)N=rn;let k=I.get(y),B=b.state.lights,me=b.state.shadowsArray,ye=B.state.version,pe=J.getParameters(y,B.state,me,N,W,b.state.lightProbeGridArray),Se=J.getProgramCacheKey(pe),Ee=k.programs;k.environment=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?N.environment:null,k.fog=N.fog;let Ve=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap;if(k.envMap=ie.get(y.envMap||k.environment,Ve),k.envMapRotation=k.environment!==null&&y.envMap===null?N.environmentRotation:y.envMapRotation,Ee===void 0)y.addEventListener("dispose",Vn),Ee=new Map,k.programs=Ee;let Ye=Ee.get(Se);if(Ye!==void 0){if(k.currentProgram===Ye&&k.lightsStateVersion===ye)return lf(y,pe),Ye}else{if(pe.uniforms=J.getUniforms(y),P!==null&&y.isNodeMaterial)P.build(y,W,pe);y.onBeforeCompile(pe,M),Ye=J.acquireProgram(pe,Se),Ee.set(Se,Ye),k.uniforms=pe.uniforms}let be=k.uniforms;if(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)be.clippingPlanes=oe.uniform;if(lf(y,pe),k.needsLights=vv(y),k.lightsStateVersion=ye,k.needsLights)be.ambientLightColor.value=B.state.ambient,be.lightProbe.value=B.state.probe,be.sunLights.value=B.state.sun,be.sunLightShadows.value=B.state.sunShadow,be.directionalLights.value=B.state.directional,be.directionalLightShadows.value=B.state.directionalShadow,be.spotLights.value=B.state.spot,be.spotLightShadows.value=B.state.spotShadow,be.rectAreaLights.value=B.state.rectArea,be.ltc_1.value=B.state.rectAreaLTC1,be.ltc_2.value=B.state.rectAreaLTC2,be.pointLights.value=B.state.point,be.pointLightShadows.value=B.state.pointShadow,be.hemisphereLights.value=B.state.hemi,be.sunShadowMatrix.value=B.state.sunShadowMatrix,be.sunShadowCascade.value=B.state.sunShadowCascade,be.directionalShadowMatrix.value=B.state.directionalShadowMatrix,be.spotLightMatrix.value=B.state.spotLightMatrix,be.spotLightMap.value=B.state.spotLightMap,be.pointShadowMatrix.value=B.state.pointShadowMatrix;return k.lightProbeGrid=b.state.lightProbeGridArray.length>0,k.currentProgram=Ye,k.uniformsList=null,Ye}function cf(y){if(y.uniformsList===null){let N=y.currentProgram.getUniforms();y.uniformsList=bo.seqWithValue(N.seq,y.uniforms)}return y.uniformsList}function lf(y,N){let W=I.get(y);W.outputColorSpace=N.outputColorSpace,W.batching=N.batching,W.batchingColor=N.batchingColor,W.instancing=N.instancing,W.instancingColor=N.instancingColor,W.instancingMorph=N.instancingMorph,W.skinning=N.skinning,W.morphTargets=N.morphTargets,W.morphNormals=N.morphNormals,W.morphColors=N.morphColors,W.morphTargetsCount=N.morphTargetsCount,W.numClippingPlanes=N.numClippingPlanes,W.numIntersection=N.numClipIntersection,W.vertexAlphas=N.vertexAlphas,W.vertexTangents=N.vertexTangents,W.toneMapping=N.toneMapping}function gv(y,N){if(y.length===0)return null;if(y.length===1)return y[0].texture!==null?y[0]:null;R.setFromMatrixPosition(N.matrixWorld);for(let W=0,k=y.length;W<k;W++){let B=y[W];if(B.texture!==null&&B.boundingBox.containsPoint(R))return B}return null}function _v(y,N,W,k,B){if(N.isScene!==!0)N=rn;V.resetTextureUnits();let me=N.fog,ye=k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial?N.environment:null,pe=z===null?M.outputColorSpace:z.isXRRenderTarget===!0?z.texture.colorSpace:$e.workingColorSpace,Se=k.isMeshStandardMaterial||k.isMeshLambertMaterial&&!k.envMap||k.isMeshPhongMaterial&&!k.envMap,Ee=ie.get(k.envMap||ye,Se),Ve=k.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Ye=!!W.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),be=!!W.morphAttributes.position,rt=!!W.morphAttributes.normal,Pt=!!W.morphAttributes.color,xt=kn;if(k.toneMapped){if(z===null||z.isXRRenderTarget===!0)xt=M.toneMapping}let ht=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,$t=ht!==void 0?ht.length:0,xe=I.get(k),Jt=b.state.lights;if(Xe===!0){if(st===!0||y!==H){let pt=y===H&&k.id===te;oe.setState(k,y,pt)}}let Je=!1;if(k.version===xe.__version){if(xe.needsLights&&xe.lightsStateVersion!==Jt.state.version)Je=!0;else if(xe.outputColorSpace!==pe)Je=!0;else if(B.isBatchedMesh&&xe.batching===!1)Je=!0;else if(!B.isBatchedMesh&&xe.batching===!0)Je=!0;else if(B.isBatchedMesh&&xe.batchingColor===!0&&B._colorsTexture===null)Je=!0;else if(B.isBatchedMesh&&xe.batchingColor===!1&&B._colorsTexture!==null)Je=!0;else if(B.isInstancedMesh&&xe.instancing===!1)Je=!0;else if(!B.isInstancedMesh&&xe.instancing===!0)Je=!0;else if(B.isSkinnedMesh&&xe.skinning===!1)Je=!0;else if(!B.isSkinnedMesh&&xe.skinning===!0)Je=!0;else if(B.isInstancedMesh&&xe.instancingColor===!0&&B.instanceColor===null)Je=!0;else if(B.isInstancedMesh&&xe.instancingColor===!1&&B.instanceColor!==null)Je=!0;else if(B.isInstancedMesh&&xe.instancingMorph===!0&&B.morphTexture===null)Je=!0;else if(B.isInstancedMesh&&xe.instancingMorph===!1&&B.morphTexture!==null)Je=!0;else if(xe.envMap!==Ee)Je=!0;else if(k.fog===!0&&xe.fog!==me)Je=!0;else if(xe.numClippingPlanes!==void 0&&(xe.numClippingPlanes!==oe.numPlanes||xe.numIntersection!==oe.numIntersection))Je=!0;else if(xe.vertexAlphas!==Ve)Je=!0;else if(xe.vertexTangents!==Ye)Je=!0;else if(xe.morphTargets!==be)Je=!0;else if(xe.morphNormals!==rt)Je=!0;else if(xe.morphColors!==Pt)Je=!0;else if(xe.toneMapping!==xt)Je=!0;else if(xe.morphTargetsCount!==$t)Je=!0;else if(!!xe.lightProbeGrid!==b.state.lightProbeGridArray.length>0)Je=!0}else Je=!0,xe.__version=k.version;let bn=xe.currentProgram;if(Je===!0){if(bn=Io(k,N,B),P&&k.isNodeMaterial)P.onUpdateProgram(k,bn,xe)}let Wn=!1,Ai=!1,Pr=!1,lt=bn.getUniforms(),Et=xe.uniforms;if(w.useProgram(bn.program))Wn=!0,Ai=!0,Pr=!0;if(k.id!==te)te=k.id,Ai=!0;if(xe.needsLights){let pt=gv(b.state.lightProbeGridArray,B);if(xe.lightProbeGrid!==pt)xe.lightProbeGrid=pt,Ai=!0}if(Wn||H!==y){if(w.buffers.depth.getReversed()&&y.reversedDepth!==!0)y._reversedDepth=!0,y.updateProjectionMatrix();lt.setValue(L,"projectionMatrix",y.projectionMatrix),lt.setValue(L,"viewMatrix",y.matrixWorldInverse);let Ci=lt.map.cameraPosition;if(Ci!==void 0)Ci.setValue(L,Ht.setFromMatrixPosition(y.matrixWorld));if(St.logarithmicDepthBuffer)lt.setValue(L,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2));if(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)lt.setValue(L,"isOrthographic",y.isOrthographicCamera===!0);if(H!==y)H=y,Ai=!0,Pr=!0}if(xe.needsLights){if(Jt.state.sunShadowMap.length>0)lt.setValue(L,"sunShadowMap",Jt.state.sunShadowMap,V);if(Jt.state.directionalShadowMap.length>0)lt.setValue(L,"directionalShadowMap",Jt.state.directionalShadowMap,V);if(Jt.state.spotShadowMap.length>0)lt.setValue(L,"spotShadowMap",Jt.state.spotShadowMap,V);if(Jt.state.pointShadowMap.length>0)lt.setValue(L,"pointShadowMap",Jt.state.pointShadowMap,V)}if(B.isSkinnedMesh){lt.setOptional(L,B,"bindMatrix"),lt.setOptional(L,B,"bindMatrixInverse");let pt=B.skeleton;if(pt){if(pt.boneTexture===null)pt.computeBoneTexture();lt.setValue(L,"boneTexture",pt.boneTexture,V)}}if(B.isBatchedMesh){if(lt.setOptional(L,B,"batchingTexture"),lt.setValue(L,"batchingTexture",B._matricesTexture,V),lt.setOptional(L,B,"batchingIdTexture"),lt.setValue(L,"batchingIdTexture",B._indirectTexture,V),lt.setOptional(L,B,"batchingColorTexture"),B._colorsTexture!==null)lt.setValue(L,"batchingColorTexture",B._colorsTexture,V)}let Ri=W.morphAttributes;if(Ri.position!==void 0||Ri.normal!==void 0||Ri.color!==void 0)Qe.update(B,W,bn);if(Ai||xe.receiveShadow!==B.receiveShadow)xe.receiveShadow=B.receiveShadow,lt.setValue(L,"receiveShadow",B.receiveShadow);if((k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial)&&k.envMap===null&&N.environment!==null)Et.envMapIntensity.value=N.environmentIntensity;if(Et.dfgLUT!==void 0)Et.dfgLUT.value=BA();if(Ai){if(lt.setValue(L,"toneMappingExposure",M.toneMappingExposure),xe.needsLights)xv(Et,Pr);if(me&&k.fog===!0)ge.refreshFogUniforms(Et,me);if(ge.refreshMaterialUniforms(Et,k,re,Z,b.state.transmissionRenderTarget[y.id]),xe.needsLights&&xe.lightProbeGrid){let pt=xe.lightProbeGrid;Et.probesSH.value=pt.texture,Et.probesMin.value.copy(pt.boundingBox.min),Et.probesMax.value.copy(pt.boundingBox.max),Et.probesResolution.value.copy(pt.resolution)}bo.upload(L,cf(xe),Et,V)}if(k.isShaderMaterial&&k.uniformsNeedUpdate===!0)bo.upload(L,cf(xe),Et,V),k.uniformsNeedUpdate=!1;if(k.isSpriteMaterial)lt.setValue(L,"center",B.center);if(lt.setValue(L,"modelViewMatrix",B.modelViewMatrix),lt.setValue(L,"normalMatrix",B.normalMatrix),lt.setValue(L,"modelMatrix",B.matrixWorld),k.uniformsGroups!==void 0){let pt=k.uniformsGroups;for(let Ci=0,Ir=pt.length;Ci<Ir;Ci++){let hf=pt[Ci];_e.update(hf,bn),_e.bind(hf,bn)}}return bn}function xv(y,N){y.ambientLightColor.needsUpdate=N,y.lightProbe.needsUpdate=N,y.sunLights.needsUpdate=N,y.sunLightShadows.needsUpdate=N,y.directionalLights.needsUpdate=N,y.directionalLightShadows.needsUpdate=N,y.pointLights.needsUpdate=N,y.pointLightShadows.needsUpdate=N,y.spotLights.needsUpdate=N,y.spotLightShadows.needsUpdate=N,y.rectAreaLights.needsUpdate=N,y.hemisphereLights.needsUpdate=N}function vv(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return G},this.getActiveMipmapLevel=function(){return X},this.getRenderTarget=function(){return z},this.setRenderTargetTextures=function(y,N,W){let k=I.get(y);if(k.__autoAllocateDepthBuffer=y.resolveDepthBuffer===!1,k.__autoAllocateDepthBuffer===!1)k.__useRenderToTexture=!1;I.get(y.texture).__webglTexture=N,I.get(y.depthTexture).__webglTexture=k.__autoAllocateDepthBuffer?void 0:W,k.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(y,N){let W=I.get(y);W.__webglFramebuffer=N,W.__useDefaultFramebuffer=N===void 0},this.setRenderTarget=function(y,N=0,W=0){z=y,G=N,X=W;let k=null,B=!1,me=!1;if(y){let pe=I.get(y);if(pe.__useDefaultFramebuffer!==void 0){w.bindFramebuffer(L.FRAMEBUFFER,pe.__webglFramebuffer),Q.copy(y.viewport),ee.copy(y.scissor),Te=y.scissorTest,w.viewport(Q),w.scissor(ee),w.setScissorTest(Te),te=-1;return}else if(pe.__webglFramebuffer===void 0)V.setupRenderTarget(y);else if(pe.__hasExternalTextures)V.rebindTextures(y,I.get(y.texture).__webglTexture,I.get(y.depthTexture).__webglTexture);else if(y.depthBuffer){let Ve=y.depthTexture;if(pe.__boundDepthTexture!==Ve){if(Ve!==null&&I.has(Ve)&&(y.width!==Ve.image.width||y.height!==Ve.image.height))throw Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");V.setupDepthRenderbuffer(y)}}let Se=y.texture;if(Se.isData3DTexture||Se.isDataArrayTexture||Se.isCompressedArrayTexture)me=!0;let Ee=I.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget){if(Array.isArray(Ee[N]))k=Ee[N][W];else k=Ee[N];B=!0}else if(y.samples>0&&V.useMultisampledRTT(y)===!1)k=I.get(y).__webglMultisampledFramebuffer;else if(Array.isArray(Ee))k=Ee[W];else k=Ee;Q.copy(y.viewport),ee.copy(y.scissor),Te=y.scissorTest}else Q.copy(Ie).multiplyScalar(re).floor(),ee.copy(we).multiplyScalar(re).floor(),Te=gt;if(W!==0)k=O;if(w.bindFramebuffer(L.FRAMEBUFFER,k))w.drawBuffers(y,k);if(w.viewport(Q),w.scissor(ee),w.setScissorTest(Te),B){let pe=I.get(y.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+N,pe.__webglTexture,W)}else if(me){let pe=N;for(let Se=0;Se<y.textures.length;Se++){let Ee=I.get(y.textures[Se]);L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0+Se,Ee.__webglTexture,W,pe)}}else if(y!==null&&W!==0){let pe=I.get(y.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,pe.__webglTexture,W)}te=-1};function uf(y){let N=I.get(y);if(N.__readFormat!==y.format||N.__readType!==y.type)N.__readFormat=y.format,N.__readType=y.type,N.__formatReadable=St.textureFormatReadable(y.format),N.__typeReadable=St.textureTypeReadable(y.type);return N}if(this.readRenderTargetPixels=function(y,N,W,k,B,me,ye,pe=0){if(!(y&&y.isWebGLRenderTarget)){Ue("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Se=I.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&ye!==void 0)Se=Se[ye];if(Se){w.bindFramebuffer(L.FRAMEBUFFER,Se);try{let Ee=y.textures[pe],{format:Ve,type:Ye}=Ee;if(y.textures.length>1)L.readBuffer(L.COLOR_ATTACHMENT0+pe);let be=uf(Ee);if(be.__formatReadable===!1){Ue("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(be.__typeReadable===!1){Ue("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}if(N>=0&&N<=y.width-k&&(W>=0&&W<=y.height-B))L.readPixels(N,W,k,B,Y.convert(Ve),Y.convert(Ye),me)}finally{let Ee=z!==null?I.get(z).__webglFramebuffer:null;w.bindFramebuffer(L.FRAMEBUFFER,Ee)}}},this.readRenderTargetPixelsAsync=async function(y,N,W,k,B,me,ye,pe=0){if(!(y&&y.isWebGLRenderTarget))throw Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Se=I.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&ye!==void 0)Se=Se[ye];if(Se)if(N>=0&&N<=y.width-k&&(W>=0&&W<=y.height-B)){w.bindFramebuffer(L.FRAMEBUFFER,Se);let Ee=y.textures[pe],{format:Ve,type:Ye}=Ee;if(y.textures.length>1)L.readBuffer(L.COLOR_ATTACHMENT0+pe);let be=uf(Ee);if(be.__formatReadable===!1)throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(be.__typeReadable===!1)throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let rt=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,rt),L.bufferData(L.PIXEL_PACK_BUFFER,me.byteLength,L.STREAM_READ),L.readPixels(N,W,k,B,Y.convert(Ve),Y.convert(Ye),0),L.bindBuffer(L.PIXEL_PACK_BUFFER,null);let Pt=z!==null?I.get(z).__webglFramebuffer:null;w.bindFramebuffer(L.FRAMEBUFFER,Pt);let xt=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await D0(L,xt,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,rt),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,me),L.bindBuffer(L.PIXEL_PACK_BUFFER,null),L.deleteBuffer(rt),L.deleteSync(xt),me}else throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(y,N=null,W=0){let k=Math.pow(2,-W),B=Math.floor(y.image.width*k),me=Math.floor(y.image.height*k),ye=N!==null?N.x:0,pe=N!==null?N.y:0;V.setTexture2D(y,0),L.copyTexSubImage2D(L.TEXTURE_2D,W,0,0,ye,pe,B,me),w.unbindTexture()},this.copyTextureToTexture=function(y,N,W=null,k=null,B=0,me=0){let ye,pe,Se,Ee,Ve,Ye,be,rt,Pt,xt=y.isCompressedTexture?y.mipmaps[me]:y.image;if(W!==null)ye=W.max.x-W.min.x,pe=W.max.y-W.min.y,Se=W.isBox3?W.max.z-W.min.z:1,Ee=W.min.x,Ve=W.min.y,Ye=W.isBox3?W.min.z:0;else{let Et=Math.pow(2,-B);if(ye=Math.floor(xt.width*Et),pe=Math.floor(xt.height*Et),y.isDataArrayTexture)Se=xt.depth;else if(y.isData3DTexture)Se=Math.floor(xt.depth*Et);else Se=1;Ee=0,Ve=0,Ye=0}if(k!==null)be=k.x,rt=k.y,Pt=k.z;else be=0,rt=0,Pt=0;let ht=Y.convert(N.format),$t=Y.convert(N.type),xe;if(N.isData3DTexture)V.setTexture3D(N,0),xe=L.TEXTURE_3D;else if(N.isDataArrayTexture||N.isCompressedArrayTexture)V.setTexture2DArray(N,0),xe=L.TEXTURE_2D_ARRAY;else V.setTexture2D(N,0),xe=L.TEXTURE_2D;w.activeTexture(L.TEXTURE0),w.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,N.flipY),w.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),w.pixelStorei(L.UNPACK_ALIGNMENT,N.unpackAlignment);let Jt=w.getParameter(L.UNPACK_ROW_LENGTH),Je=w.getParameter(L.UNPACK_IMAGE_HEIGHT),bn=w.getParameter(L.UNPACK_SKIP_PIXELS),Wn=w.getParameter(L.UNPACK_SKIP_ROWS),Ai=w.getParameter(L.UNPACK_SKIP_IMAGES);w.pixelStorei(L.UNPACK_ROW_LENGTH,xt.width),w.pixelStorei(L.UNPACK_IMAGE_HEIGHT,xt.height),w.pixelStorei(L.UNPACK_SKIP_PIXELS,Ee),w.pixelStorei(L.UNPACK_SKIP_ROWS,Ve),w.pixelStorei(L.UNPACK_SKIP_IMAGES,Ye);let Pr=y.isDataArrayTexture||y.isData3DTexture,lt=N.isDataArrayTexture||N.isData3DTexture;if(y.isDepthTexture){let Et=I.get(y),Ri=I.get(N),pt=I.get(Et.__renderTarget),Ci=I.get(Ri.__renderTarget);w.bindFramebuffer(L.READ_FRAMEBUFFER,pt.__webglFramebuffer),w.bindFramebuffer(L.DRAW_FRAMEBUFFER,Ci.__webglFramebuffer);for(let Ir=0;Ir<Se;Ir++){if(Pr)L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,I.get(y).__webglTexture,B,Ye+Ir),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,I.get(N).__webglTexture,me,Pt+Ir);L.blitFramebuffer(Ee,Ve,ye,pe,be,rt,ye,pe,L.DEPTH_BUFFER_BIT,L.NEAREST)}w.bindFramebuffer(L.READ_FRAMEBUFFER,null),w.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(B!==0||y.isRenderTargetTexture||I.has(y)){let Et=I.get(y),Ri=I.get(N);w.bindFramebuffer(L.READ_FRAMEBUFFER,K),w.bindFramebuffer(L.DRAW_FRAMEBUFFER,C);for(let pt=0;pt<Se;pt++){if(Pr)L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Et.__webglTexture,B,Ye+pt);else L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,Et.__webglTexture,B);if(lt)L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Ri.__webglTexture,me,Pt+pt);else L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,Ri.__webglTexture,me);if(B!==0)L.blitFramebuffer(Ee,Ve,ye,pe,be,rt,ye,pe,L.COLOR_BUFFER_BIT,L.NEAREST);else if(lt)L.copyTexSubImage3D(xe,me,be,rt,Pt+pt,Ee,Ve,ye,pe);else L.copyTexSubImage2D(xe,me,be,rt,Ee,Ve,ye,pe)}w.bindFramebuffer(L.READ_FRAMEBUFFER,null),w.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(lt)if(y.isDataTexture||y.isData3DTexture)L.texSubImage3D(xe,me,be,rt,Pt,ye,pe,Se,ht,$t,xt.data);else if(N.isCompressedArrayTexture)L.compressedTexSubImage3D(xe,me,be,rt,Pt,ye,pe,Se,ht,xt.data);else L.texSubImage3D(xe,me,be,rt,Pt,ye,pe,Se,ht,$t,xt);else if(y.isDataTexture)L.texSubImage2D(L.TEXTURE_2D,me,be,rt,ye,pe,ht,$t,xt.data);else if(y.isCompressedTexture)L.compressedTexSubImage2D(L.TEXTURE_2D,me,be,rt,xt.width,xt.height,ht,xt.data);else L.texSubImage2D(L.TEXTURE_2D,me,be,rt,ye,pe,ht,$t,xt);if(w.pixelStorei(L.UNPACK_ROW_LENGTH,Jt),w.pixelStorei(L.UNPACK_IMAGE_HEIGHT,Je),w.pixelStorei(L.UNPACK_SKIP_PIXELS,bn),w.pixelStorei(L.UNPACK_SKIP_ROWS,Wn),w.pixelStorei(L.UNPACK_SKIP_IMAGES,Ai),me===0&&N.generateMipmaps)L.generateMipmap(xe);w.unbindTexture()},this.initRenderTarget=function(y){if(I.get(y).__webglFramebuffer===void 0)V.setupRenderTarget(y)},this.initTexture=function(y){if(y.isCubeTexture)V.setTextureCube(y,0);else if(y.isData3DTexture)V.setTexture3D(y,0);else if(y.isDataArrayTexture||y.isCompressedArrayTexture)V.setTexture2DArray(y,0);else V.setTexture2D(y,0);w.unbindTexture()},this.resetState=function(){G=0,X=0,z=null,w.reset(),le.reset()},typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return oh}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=$e._getDrawingBufferColorSpace(e),t.unpackColorSpace=$e._getUnpackColorSpace()}}function kh(e,t){if(t===nh)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),e;if(t===os||t===no){let n=e.getIndex();if(n===null){let s=[],o=e.getAttribute("position");if(o!==void 0){for(let a=0;a<o.count;a++)s.push(a);e.setIndex(s),n=e.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),e}let i=n.count-2,r=[];if(t===os)for(let s=1;s<=i;s++)r.push(n.getX(0)),r.push(n.getX(s)),r.push(n.getX(s+1));else for(let s=0;s<i;s++)if(s%2===0)r.push(n.getX(s)),r.push(n.getX(s+1)),r.push(n.getX(s+2));else r.push(n.getX(s+2)),r.push(n.getX(s+1)),r.push(n.getX(s));if(r.length/3!==i)console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");return e.setIndex(r),e.clearGroups(),e}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",t),e}function Ex(e){let t=new Map,n=new Map,i=e.clone();return Ax(e,i,function(r,s){t.set(s,r),n.set(r,s)}),i.traverse(function(r){if(!r.isSkinnedMesh)return;let s=r,o=t.get(r),a=o.skeleton.bones;s.skeleton=o.skeleton.clone(),s.bindMatrix.copy(o.bindMatrix),s.skeleton.bones=a.map(function(c){return n.get(c)}),s.bind(s.skeleton,s.bindMatrix)}),i}function Ax(e,t,n){n(e,t);for(let i=0;i<e.children.length;i++)Ax(e.children[i],t.children[i],n)}class Zh extends Ei{constructor(e){super(e);this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Ox(t)}),this.register(function(t){return new Ux(t)}),this.register(function(t){return new $x(t)}),this.register(function(t){return new Zx(t)}),this.register(function(t){return new Xx(t)}),this.register(function(t){return new zx(t)}),this.register(function(t){return new kx(t)}),this.register(function(t){return new Bx(t)}),this.register(function(t){return new Gx(t)}),this.register(function(t){return new Dx(t)}),this.register(function(t){return new Hx(t)}),this.register(function(t){return new Fx(t)}),this.register(function(t){return new Wx(t)}),this.register(function(t){return new Vx(t)}),this.register(function(t){return new Lx(t)}),this.register(function(t){return new Vh(t,qe.EXT_MESHOPT_COMPRESSION)}),this.register(function(t){return new Vh(t,qe.KHR_MESHOPT_COMPRESSION)}),this.register(function(t){return new qx(t)})}load(e,t,n,i){let r=this,s;if(this.resourcePath!=="")s=this.resourcePath;else if(this.path!==""){let c=er.extractUrlBase(e);s=er.resolveURL(c,this.path)}else s=er.extractUrlBase(e);this.manager.itemStart(e);let o=function(c){if(i)i(c);else console.error(c);r.manager.itemError(e),r.manager.itemEnd(e)},a=new go(this.manager);a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(c){try{r.parse(c,s,function(l){t(l),r.manager.itemEnd(e)},o)}catch(l){o(l)}},n,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){if(this.pluginCallbacks.indexOf(e)===-1)this.pluginCallbacks.push(e);return this}unregister(e){if(this.pluginCallbacks.indexOf(e)!==-1)this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1);return this}parse(e,t,n,i){let r,s={},o={},a=new TextDecoder;if(typeof e==="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(a.decode(new Uint8Array(e,0,4))===Yx){try{s[qe.KHR_BINARY_GLTF]=new jx(e)}catch(u){if(i)i(u);return}r=JSON.parse(s[qe.KHR_BINARY_GLTF].content)}else r=JSON.parse(a.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){if(i)i(Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let c=new tv(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let l=0;l<this.pluginCallbacks.length;l++){let u=this.pluginCallbacks[l](c);if(!u.name)console.error("THREE.GLTFLoader: Invalid plugin found: missing name");o[u.name]=u,s[u.name]=!0}if(r.extensionsUsed)for(let l=0;l<r.extensionsUsed.length;++l){let u=r.extensionsUsed[l],f=r.extensionsRequired||[];switch(u){case qe.KHR_MATERIALS_UNLIT:s[u]=new Nx;break;case qe.KHR_DRACO_MESH_COMPRESSION:s[u]=new Kx(r,this.dracoLoader);break;case qe.KHR_TEXTURE_TRANSFORM:s[u]=new Jx;break;case qe.KHR_MESH_QUANTIZATION:s[u]=new Qx;break;default:if(f.indexOf(u)>=0&&o[u]===void 0)console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(s),c.setPlugins(o),c.parse(n,i)}parseAsync(e,t){let n=this;return new Promise(function(i,r){n.parse(e,t,i,r)})}}function HA(){let e={};return{get:function(t){return e[t]},add:function(t,n){e[t]=n},remove:function(t){delete e[t]},removeAll:function(){e={}}}}function Rt(e,t,n){let i=e.json.materials[t];if(i.extensions&&i.extensions[n])return i.extensions[n];return null}var qe={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class Lx{constructor(e){this.parser=e,this.name=qe.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let n=0,i=t.length;n<i;n++){let r=t[n];if(r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0)e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,n="light:"+e,i=t.cache.get(n);if(i)return i;let r=t.json,a=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e],c,l=new Oe(16777215);if(a.color!==void 0)l.setRGB(a.color[0],a.color[1],a.color[2],gn);let u=a.range!==void 0?a.range:0;switch(a.type){case"directional":c=new ds(l),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new fs(l),c.distance=u;break;case"spot":c=new mc(l),c.distance=u,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,c.angle=a.spot.outerConeAngle,c.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}if(c.position.set(0,0,0),li(c,a),a.intensity!==void 0)c.intensity=a.intensity;return c.name=t.createUniqueName(a.name||"light_"+e),i=Promise.resolve(c),t.cache.add(n,i),i}getDependency(e,t){if(e!=="light")return;return this._loadLight(t)}createNodeAttachment(e){let t=this,n=this.parser,r=n.json.nodes[e],o=(r.extensions&&r.extensions[this.name]||{}).light;if(o===void 0)return null;return this._loadLight(o).then(function(a){return n._getNodeRef(t.cache,o,a)})}}class Nx{constructor(){this.name=qe.KHR_MATERIALS_UNLIT}getMaterialType(){return oi}extendParams(e,t,n){let i=[];e.color=new Oe(1,1,1),e.opacity=1;let r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){let s=r.baseColorFactor;e.color.setRGB(s[0],s[1],s[2],gn),e.opacity=s[3]}if(r.baseColorTexture!==void 0)i.push(n.assignTexture(e,"map",r.baseColorTexture,Zi))}return Promise.all(i)}}class Dx{constructor(e){this.parser=e,this.name=qe.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();if(n.emissiveStrength!==void 0)t.emissiveIntensity=n.emissiveStrength;return Promise.resolve()}}class Ox{constructor(e){this.parser=e,this.name=qe.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?vn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(n.clearcoatFactor!==void 0)t.clearcoat=n.clearcoatFactor;if(n.clearcoatTexture!==void 0)i.push(this.parser.assignTexture(t,"clearcoatMap",n.clearcoatTexture));if(n.clearcoatRoughnessFactor!==void 0)t.clearcoatRoughness=n.clearcoatRoughnessFactor;if(n.clearcoatRoughnessTexture!==void 0)i.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",n.clearcoatRoughnessTexture));if(n.clearcoatNormalTexture!==void 0){if(i.push(this.parser.assignTexture(t,"clearcoatNormalMap",n.clearcoatNormalTexture)),n.clearcoatNormalTexture.scale!==void 0){let r=n.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new Ne(r,r)}}return Promise.all(i)}}class Ux{constructor(e){this.parser=e,this.name=qe.KHR_MATERIALS_DISPERSION}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?vn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();return t.dispersion=n.dispersion!==void 0?n.dispersion:0,Promise.resolve()}}class Fx{constructor(e){this.parser=e,this.name=qe.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?vn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(n.iridescenceFactor!==void 0)t.iridescence=n.iridescenceFactor;if(n.iridescenceTexture!==void 0)i.push(this.parser.assignTexture(t,"iridescenceMap",n.iridescenceTexture));if(n.iridescenceIor!==void 0)t.iridescenceIOR=n.iridescenceIor;if(t.iridescenceThicknessRange===void 0)t.iridescenceThicknessRange=[100,400];if(n.iridescenceThicknessMinimum!==void 0)t.iridescenceThicknessRange[0]=n.iridescenceThicknessMinimum;if(n.iridescenceThicknessMaximum!==void 0)t.iridescenceThicknessRange[1]=n.iridescenceThicknessMaximum;if(n.iridescenceThicknessTexture!==void 0)i.push(this.parser.assignTexture(t,"iridescenceThicknessMap",n.iridescenceThicknessTexture));return Promise.all(i)}}class zx{constructor(e){this.parser=e,this.name=qe.KHR_MATERIALS_SHEEN}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?vn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(t.sheenColor=new Oe(0,0,0),t.sheenRoughness=0,t.sheen=1,n.sheenColorFactor!==void 0){let r=n.sheenColorFactor;t.sheenColor.setRGB(r[0],r[1],r[2],gn)}if(n.sheenRoughnessFactor!==void 0)t.sheenRoughness=n.sheenRoughnessFactor;if(n.sheenColorTexture!==void 0)i.push(this.parser.assignTexture(t,"sheenColorMap",n.sheenColorTexture,Zi));if(n.sheenRoughnessTexture!==void 0)i.push(this.parser.assignTexture(t,"sheenRoughnessMap",n.sheenRoughnessTexture));return Promise.all(i)}}class kx{constructor(e){this.parser=e,this.name=qe.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?vn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(n.transmissionFactor!==void 0)t.transmission=n.transmissionFactor;if(n.transmissionTexture!==void 0)i.push(this.parser.assignTexture(t,"transmissionMap",n.transmissionTexture));return Promise.all(i)}}class Bx{constructor(e){this.parser=e,this.name=qe.KHR_MATERIALS_VOLUME}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?vn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(t.thickness=n.thicknessFactor!==void 0?n.thicknessFactor:0,n.thicknessTexture!==void 0)i.push(this.parser.assignTexture(t,"thicknessMap",n.thicknessTexture));t.attenuationDistance=n.attenuationDistance||1/0;let r=n.attenuationColor||[1,1,1];return t.attenuationColor=new Oe().setRGB(r[0],r[1],r[2],gn),Promise.all(i)}}class Gx{constructor(e){this.parser=e,this.name=qe.KHR_MATERIALS_IOR}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?vn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();if(t.ior=n.ior!==void 0?n.ior:1.5,t.ior===0)t.ior=1000;return Promise.resolve()}}class Hx{constructor(e){this.parser=e,this.name=qe.KHR_MATERIALS_SPECULAR}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?vn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(t.specularIntensity=n.specularFactor!==void 0?n.specularFactor:1,n.specularTexture!==void 0)i.push(this.parser.assignTexture(t,"specularIntensityMap",n.specularTexture));let r=n.specularColorFactor||[1,1,1];if(t.specularColor=new Oe().setRGB(r[0],r[1],r[2],gn),n.specularColorTexture!==void 0)i.push(this.parser.assignTexture(t,"specularColorMap",n.specularColorTexture,Zi));return Promise.all(i)}}class Vx{constructor(e){this.parser=e,this.name=qe.EXT_MATERIALS_BUMP}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?vn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(t.bumpScale=n.bumpFactor!==void 0?n.bumpFactor:1,n.bumpTexture!==void 0)i.push(this.parser.assignTexture(t,"bumpMap",n.bumpTexture));return Promise.all(i)}}class Wx{constructor(e){this.parser=e,this.name=qe.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?vn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(n.anisotropyStrength!==void 0)t.anisotropy=n.anisotropyStrength;if(n.anisotropyRotation!==void 0)t.anisotropyRotation=n.anisotropyRotation;if(n.anisotropyTexture!==void 0)i.push(this.parser.assignTexture(t,"anisotropyMap",n.anisotropyTexture));return Promise.all(i)}}class $x{constructor(e){this.parser=e,this.name=qe.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,n=t.json,i=n.textures[e];if(!i.extensions||!i.extensions[this.name])return null;let r=i.extensions[this.name],s=t.options.ktx2Loader;if(!s)if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");else return null;return t.loadTextureImage(e,r.source,s)}}class Zx{constructor(e){this.parser=e,this.name=qe.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;let s=r.extensions[t],o=i.images[s.source],a=n.textureLoader;if(o.uri){let c=n.options.manager.getHandler(o.uri);if(c!==null)a=c}return n.loadTextureImage(e,s.source,a)}}class Xx{constructor(e){this.parser=e,this.name=qe.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;let s=r.extensions[t],o=i.images[s.source],a=n.textureLoader;if(o.uri){let c=n.options.manager.getHandler(o.uri);if(c!==null)a=c}return n.loadTextureImage(e,s.source,a)}}class Vh{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){let t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){let i=n.extensions[this.name],r=this.parser.getDependency("buffer",i.buffer),s=this.parser.options.meshoptDecoder;if(!s||!s.supported)if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");else return null;return r.then(function(o){let a=i.byteOffset||0,c=i.byteLength||0,{count:l,byteStride:u}=i,f=new Uint8Array(o,a,c);if(s.decodeGltfBufferAsync)return s.decodeGltfBufferAsync(l,u,f,i.mode,i.filter).then(function(h){return h.buffer});else return s.ready.then(function(){let h=new ArrayBuffer(l*u);return s.decodeGltfBuffer(new Uint8Array(h),l,u,f,i.mode,i.filter),h})})}else return null}}class qx{constructor(e){this.name=qe.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;let i=t.meshes[n.mesh];for(let c of i.primitives)if(c.mode!==Cn.TRIANGLES&&c.mode!==Cn.TRIANGLE_STRIP&&c.mode!==Cn.TRIANGLE_FAN&&c.mode!==void 0)return null;let s=n.extensions[this.name].attributes,o=[],a={};for(let c in s)o.push(this.parser.getDependency("accessor",s[c]).then((l)=>(a[c]=l,a[c])));if(o.length<1)return null;return o.push(this.parser.createNodeMesh(e)),Promise.all(o).then((c)=>{let l=c.pop(),u=l.isGroup?l.children:[l],f=c[0].count,h=[];for(let d of u){let g=new Ge,x=new U,p=new kt,m=new U(1,1,1),E=new ls(d.geometry,d.material,f);for(let S=0;S<f;S++){if(a.TRANSLATION)x.fromBufferAttribute(a.TRANSLATION,S);if(a.ROTATION)p.fromBufferAttribute(a.ROTATION,S);if(a.SCALE)m.fromBufferAttribute(a.SCALE,S);E.setMatrixAt(S,g.compose(x,p,m))}let R=null;for(let S in a)if(S==="_COLOR_0"){let b=a[S];E.instanceColor=new Gi(b.array,b.itemSize,b.normalized)}else if(S!=="TRANSLATION"&&S!=="ROTATION"&&S!=="SCALE"){if(R===null){let T=E.geometry;R=new jt,R.name=T.name;for(let A in T.attributes)R.setAttribute(A,T.attributes[A]);for(let A in T.morphAttributes)R.morphAttributes[A]=T.morphAttributes[A];if(T.index!==null)R.setIndex(T.index);R.morphTargetsRelative=T.morphTargetsRelative;for(let A of T.groups)R.addGroup(A.start,A.count,A.materialIndex);if(T.boundingBox!==null)R.boundingBox=T.boundingBox.clone();if(T.boundingSphere!==null)R.boundingSphere=T.boundingSphere.clone();R.drawRange.start=T.drawRange.start,R.drawRange.count=T.drawRange.count,R.userData=Object.assign({},T.userData),E.geometry=R}let b=a[S];R.setAttribute(S,new Gi(b.array,b.itemSize,b.normalized))}ut.prototype.copy.call(E,d),this.parser.assignFinalMaterial(E),h.push(E)}if(l.isGroup)return l.clear(),l.add(...h),l;return h[0]})}}var Yx="glTF",wo=12,Rx={JSON:1313821514,BIN:5130562};class jx{constructor(e){this.name=qe.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,wo),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Yx)throw Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");else if(this.header.version<2)throw Error("THREE.GLTFLoader: Legacy binary file detected.");let i=this.header.length-wo,r=new DataView(e,wo),s=0;while(s<i){let o=r.getUint32(s,!0);s+=4;let a=r.getUint32(s,!0);if(s+=4,a===Rx.JSON){let c=new Uint8Array(e,wo+s,o);this.content=n.decode(c)}else if(a===Rx.BIN){let c=wo+s;this.body=e.slice(c,c+o)}s+=o}if(this.content===null)throw Error("THREE.GLTFLoader: JSON content not found.")}}class Kx{constructor(e,t){if(!t)throw Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=qe.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let n=this.json,i=this.dracoLoader,r=e.extensions[this.name].bufferView,s=e.extensions[this.name].attributes,o={},a={},c={};for(let l in s){let u=Wh[l]||l.toLowerCase();o[u]=s[l]}for(let l in e.attributes){let u=Wh[l]||l.toLowerCase();if(s[l]!==void 0){let f=n.accessors[e.attributes[l]],h=_s[f.componentType];c[u]=h.name,a[u]=f.normalized===!0}}return t.getDependency("bufferView",r).then(function(l){return new Promise(function(u,f){i.decodeDracoFile(l,function(h){for(let d in h.attributes){let g=h.attributes[d],x=a[d];if(x!==void 0)g.normalized=x}u(h)},o,c,gn,f)})})}}class Jx{constructor(){this.name=qe.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){if((t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0)return e;if(e=e.clone(),t.texCoord!==void 0)e.channel=t.texCoord;if(t.offset!==void 0)e.offset.fromArray(t.offset);if(t.rotation!==void 0)e.rotation=t.rotation;if(t.scale!==void 0)e.repeat.fromArray(t.scale);if(t.rotation!==void 0){let n=Math.cos(e.rotation),i=Math.sin(e.rotation);e.matrix.set(e.repeat.x*n,e.repeat.y*i,e.offset.x,-e.repeat.x*i,e.repeat.y*n,e.offset.y,0,0,1),e.matrixAutoUpdate=!1}return e.needsUpdate=!0,e}}class Qx{constructor(){this.name=qe.KHR_MESH_QUANTIZATION}}class Xh extends Ti{constructor(e,t,n,i){super(e,t,n,i)}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i*3+i;for(let s=0;s!==i;s++)t[s]=n[r+s];return t}interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=o*2,c=o*3,l=i-t,u=(n-t)/l,f=u*u,h=f*u,d=e*c,g=d-c,x=-2*h+3*f,p=h-f,m=1-x,E=p-f+u;for(let R=0;R!==o;R++){let S=s[g+R+o],b=s[g+R+a]*l,T=s[d+R+o],A=s[d+R]*l;r[R]=m*S+E*b+x*T+p*A}return r}}var VA=new kt;class ev extends Xh{interpolate_(e,t,n,i){let r=super.interpolate_(e,t,n,i);return VA.fromArray(r).normalize().toArray(r),r}}var Cn={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},_s={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Cx={9728:Bn,9729:Gt,9984:Wa,9985:rs,9986:gr,9987:ii},Px={33071:is,33648:Va,10497:ns},Bh={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Wh={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},tr={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},WA={CUBICSPLINE:void 0,LINEAR:Ka,STEP:th},Gh={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function $A(e){if(e.DefaultMaterial===void 0)e.DefaultMaterial=new wi({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Wi});return e.DefaultMaterial}function Er(e,t,n){for(let i in n.extensions)if(e[i]===void 0)t.userData.gltfExtensions=t.userData.gltfExtensions||{},t.userData.gltfExtensions[i]=n.extensions[i]}function li(e,t){if(t.extras!==void 0)if(typeof t.extras==="object")Object.assign(e.userData,t.extras);else console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+t.extras)}function ZA(e,t,n){let i=!1,r=!1,s=!1;for(let l=0,u=t.length;l<u;l++){let f=t[l];if(f.POSITION!==void 0)i=!0;if(f.NORMAL!==void 0)r=!0;if(f.COLOR_0!==void 0)s=!0;if(i&&r&&s)break}if(!i&&!r&&!s)return Promise.resolve(e);let o=[],a=[],c=[];for(let l=0,u=t.length;l<u;l++){let f=t[l];if(i){let h=f.POSITION!==void 0?n.getDependency("accessor",f.POSITION):e.attributes.position;o.push(h)}if(r){let h=f.NORMAL!==void 0?n.getDependency("accessor",f.NORMAL):e.attributes.normal;a.push(h)}if(s){let h=f.COLOR_0!==void 0?n.getDependency("accessor",f.COLOR_0):e.attributes.color;c.push(h)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c)]).then(function(l){let u=l[0],f=l[1],h=l[2];if(i)e.morphAttributes.position=u;if(r)e.morphAttributes.normal=f;if(s)e.morphAttributes.color=h;return e.morphTargetsRelative=!0,e})}function XA(e,t){if(e.updateMorphTargets(),t.weights!==void 0)for(let n=0,i=t.weights.length;n<i;n++)e.morphTargetInfluences[n]=t.weights[n];if(t.extras&&Array.isArray(t.extras.targetNames)){let n=t.extras.targetNames;if(e.morphTargetInfluences.length===n.length){e.morphTargetDictionary={};for(let i=0,r=n.length;i<r;i++)e.morphTargetDictionary[n[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function qA(e){let t,n=e.extensions&&e.extensions[qe.KHR_DRACO_MESH_COMPRESSION];if(n)t="draco:"+n.bufferView+":"+n.indices+":"+Hh(n.attributes);else t=e.indices+":"+Hh(e.attributes)+":"+e.mode;if(e.targets!==void 0)for(let i=0,r=e.targets.length;i<r;i++)t+=":"+Hh(e.targets[i]);return t}function Hh(e){let t="",n=Object.keys(e).sort();for(let i=0,r=n.length;i<r;i++)t+=n[i]+":"+e[n[i]]+";";return t}function $h(e){switch(e){case Int8Array:return 0.007874015748031496;case Uint8Array:return 0.00392156862745098;case Int16Array:return 0.00003051850947599719;case Uint16Array:return 0.000015259021896696422;default:throw Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function YA(e){if(e.search(/\.jpe?g($|\?)/i)>0||e.search(/^data\:image\/jpeg/)===0)return"image/jpeg";if(e.search(/\.webp($|\?)/i)>0||e.search(/^data\:image\/webp/)===0)return"image/webp";if(e.search(/\.ktx2($|\?)/i)>0||e.search(/^data\:image\/ktx2/)===0)return"image/ktx2";return"image/png"}var jA=new Ge;class tv{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new HA,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,r=!1,s=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){let o=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(o)===!0;let a=o.match(/Version\/(\d+)/);i=n&&a?parseInt(a[1],10):-1,r=o.indexOf("Firefox")>-1,s=r?o.match(/Firefox\/([0-9]+)\./)[1]:-1}if(typeof createImageBitmap>"u"||n&&i<17||r&&s<98)this.textureLoader=new fc(this.options.manager);else this.textureLoader=new gc(this.options.manager);if(this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new go(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials")this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let n=this,i=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(s){return s._markDefs&&s._markDefs()}),Promise.all(this._invokeAll(function(s){return s.beforeRoot&&s.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(s){let o={scene:s[0][i.scene||0],scenes:s[0],animations:s[1],cameras:s[2],asset:i.asset,parser:n,userData:{}};return Er(r,o,i),li(o,i),Promise.all(n._invokeAll(function(a){return a.afterRoot&&a.afterRoot(o)})).then(function(){for(let a of o.scenes)a.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let i=0,r=t.length;i<r;i++){let s=t[i].joints;for(let o=0,a=s.length;o<a;o++)e[s[o]].isBone=!0}for(let i=0,r=e.length;i<r;i++){let s=e[i];if(s.mesh!==void 0){if(this._addNodeRef(this.meshCache,s.mesh),s.skin!==void 0)n[s.mesh].isSkinnedMesh=!0}if(s.camera!==void 0)this._addNodeRef(this.cameraCache,s.camera)}}_addNodeRef(e,t){if(t===void 0)return;if(e.refs[t]===void 0)e.refs[t]=e.uses[t]=0;e.refs[t]++}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;let i=n.clone(),r=(s,o)=>{let a=this.associations.get(s);if(a!=null)this.associations.set(o,a);for(let[c,l]of s.children.entries())r(l,o.children[c])};return r(n,i),i.name+="_instance_"+e.uses[t]++,i}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){let i=e(t[n]);if(i)return i}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let n=[];for(let i=0;i<t.length;i++){let r=e(t[i]);if(r)n.push(r)}return n}getDependency(e,t){let n=e+":"+t,i=this.cache.get(n);if(!i){switch(e){case"scene":i=this.loadScene(t);break;case"node":i=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":i=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":i=this.loadAccessor(t);break;case"bufferView":i=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":i=this.loadBuffer(t);break;case"material":i=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":i=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":i=this.loadSkin(t);break;case"animation":i=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":i=this.loadCamera(t);break;default:if(i=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!i)throw Error("Unknown type: "+e);break}this.cache.add(n,i)}return i}getDependencies(e){let t=this.cache.get(e);if(!t){let n=this,i=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(i.map(function(r,s){return n.getDependency(e,s)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[qe.KHR_BINARY_GLTF].body);let i=this.options;return new Promise(function(r,s){n.load(er.resolveURL(t.uri,i.path),r,void 0,function(){s(Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){let i=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+i)})}loadAccessor(e){let t=this,n=this.json,i=this.json.accessors[e];if(i.bufferView===void 0&&i.sparse===void 0){let s=Bh[i.type],o=_s[i.componentType],a=i.normalized===!0,c=new o(i.count*s);return Promise.resolve(new Bt(c,s,a))}let r=[];if(i.bufferView!==void 0)r.push(this.getDependency("bufferView",i.bufferView));else r.push(null);if(i.sparse!==void 0)r.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",i.sparse.values.bufferView));return Promise.all(r).then(function(s){let o=s[0],a=Bh[i.type],c=_s[i.componentType],l=c.BYTES_PER_ELEMENT,u=l*a,f=i.byteOffset||0,h=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,d=i.normalized===!0,g,x;if(h&&h!==u){let p=Math.floor(f/h),m="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+p+":"+i.count,E=t.cache.get(m);if(!E)g=new c(o,p*h,i.count*h/l),E=new oo(g,h/l),t.cache.add(m,E);x=new cs(E,a,f%h/l,d)}else{if(o===null)g=new c(i.count*a);else g=new c(o,f,i.count*a);x=new Bt(g,a,d)}if(i.sparse!==void 0){let p=Bh.SCALAR,m=_s[i.sparse.indices.componentType],E=i.sparse.indices.byteOffset||0,R=i.sparse.values.byteOffset||0,S=new m(s[1],E,i.sparse.count*p),b=new c(s[2],R,i.sparse.count*a);if(o!==null)x=new Bt(x.array.slice(),x.itemSize,x.normalized);x.normalized=!1;for(let T=0,A=S.length;T<A;T++){let _=S[T];if(x.setX(_,b[T*a]),a>=2)x.setY(_,b[T*a+1]);if(a>=3)x.setZ(_,b[T*a+2]);if(a>=4)x.setW(_,b[T*a+3]);if(a>=5)throw Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}x.normalized=d}return x})}loadTexture(e){let t=this.json,n=this.options,r=t.textures[e].source,s=t.images[r],o=this.textureLoader;if(s.uri){let a=n.manager.getHandler(s.uri);if(a!==null)o=a}return this.loadTextureImage(e,r,o)}loadTextureImage(e,t,n){let i=this,r=this.json,s=r.textures[e],o=r.images[t],a=(o.uri||o.bufferView)+":"+s.sampler;if(this.textureCache[a])return this.textureCache[a];let c=this.loadImageSource(t,n).then(function(l){if(l.flipY=!1,l.name=s.name||o.name||"",l.name===""&&typeof o.uri==="string"&&o.uri.startsWith("data:image/")===!1)l.name=o.uri;let f=(r.samplers||{})[s.sampler]||{};return l.magFilter=Cx[f.magFilter]||Gt,l.minFilter=Cx[f.minFilter]||ii,l.wrapS=Px[f.wrapS]||ns,l.wrapT=Px[f.wrapT]||ns,l.generateMipmaps=!l.isCompressedTexture&&l.minFilter!==Bn&&l.minFilter!==Gt,i.associations.set(l,{textures:e}),l}).catch(function(){return null});return this.textureCache[a]=c,c}loadImageSource(e,t){let n=this,i=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then((u)=>u.clone());let s=i.images[e],o=self.URL||self.webkitURL,a=s.uri||"",c=!1;if(s.bufferView!==void 0)a=n.getDependency("bufferView",s.bufferView).then(function(u){c=!0;let f=new Blob([u],{type:s.mimeType});return a=o.createObjectURL(f),a});else if(s.uri===void 0)throw Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let l=Promise.resolve(a).then(function(u){return new Promise(function(f,h){let d=f;if(t.isImageBitmapLoader===!0)d=function(g){let x=new Tt(g);x.needsUpdate=!0,f(x)};t.load(er.resolveURL(u,r.path),d,void 0,h)})}).then(function(u){if(c===!0)o.revokeObjectURL(a);return li(u,s),u.userData.mimeType=s.mimeType||YA(s.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",a),u});return this.sourceCache[e]=l,l}assignTexture(e,t,n,i){let r=this;return this.getDependency("texture",n.index).then(function(s){if(!s)return null;if(n.texCoord!==void 0&&n.texCoord>0)s=s.clone(),s.channel=n.texCoord;if(r.extensions[qe.KHR_TEXTURE_TRANSFORM]){let o=n.extensions!==void 0?n.extensions[qe.KHR_TEXTURE_TRANSFORM]:void 0;if(o){let a=r.associations.get(s);s=r.extensions[qe.KHR_TEXTURE_TRANSFORM].extendTexture(s,o),r.associations.set(s,a)}}if(i!==void 0)s.colorSpace=i;return e[t]=s,s})}assignFinalMaterial(e){let{geometry:t,material:n}=e,i=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,s=t.attributes.normal===void 0;if(e.isPoints){let o="PointsMaterial:"+n.uuid,a=this.cache.get(o);if(!a)a=new fo,cn.prototype.copy.call(a,n),a.color.copy(n.color),a.map=n.map,a.sizeAttenuation=!1,this.cache.add(o,a);n=a}else if(e.isLine){let o="LineBasicMaterial:"+n.uuid,a=this.cache.get(o);if(!a)a=new ho,cn.prototype.copy.call(a,n),a.color.copy(n.color),a.map=n.map,this.cache.add(o,a);n=a}if(i||r||s){let o="ClonedMaterial:"+n.uuid+":";if(i)o+="derivative-tangents:";if(r)o+="vertex-colors:";if(s)o+="flat-shading:";let a=this.cache.get(o);if(!a){if(a=n.clone(),r)a.vertexColors=!0;if(s)a.flatShading=!0;if(i){if(a.normalScale)a.normalScale.y*=-1;if(a.clearcoatNormalScale)a.clearcoatNormalScale.y*=-1}this.cache.add(o,a),this.associations.set(a,this.associations.get(n))}n=a}e.material=n}getMaterialType(){return wi}loadMaterial(e){let t=this,n=this.json,i=this.extensions,r=n.materials[e],s,o={},a=r.extensions||{},c=[];if(a[qe.KHR_MATERIALS_UNLIT]){let u=i[qe.KHR_MATERIALS_UNLIT];s=u.getMaterialType(),c.push(u.extendParams(o,r,t))}else{let u=r.pbrMetallicRoughness||{};if(o.color=new Oe(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){let f=u.baseColorFactor;o.color.setRGB(f[0],f[1],f[2],gn),o.opacity=f[3]}if(u.baseColorTexture!==void 0)c.push(t.assignTexture(o,"map",u.baseColorTexture,Zi));if(o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0)c.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture));s=this._invokeOne(function(f){return f.getMaterialType&&f.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(f){return f.extendMaterialParams&&f.extendMaterialParams(e,o)})))}if(r.doubleSided===!0)o.side=An;let l=r.alphaMode||Gh.OPAQUE;if(l===Gh.BLEND)o.transparent=!0,o.depthWrite=!1;else if(o.transparent=!1,l===Gh.MASK)o.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:0.5;if(r.normalTexture!==void 0&&s!==oi){if(c.push(t.assignTexture(o,"normalMap",r.normalTexture)),o.normalScale=new Ne(1,1),r.normalTexture.scale!==void 0){let u=r.normalTexture.scale;o.normalScale.set(u,u)}}if(r.occlusionTexture!==void 0&&s!==oi){if(c.push(t.assignTexture(o,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0)o.aoMapIntensity=r.occlusionTexture.strength}if(r.emissiveFactor!==void 0&&s!==oi){let u=r.emissiveFactor;o.emissive=new Oe().setRGB(u[0],u[1],u[2],gn)}if(r.emissiveTexture!==void 0&&s!==oi)c.push(t.assignTexture(o,"emissiveMap",r.emissiveTexture,Zi));return Promise.all(c).then(function(){let u=new s(o);if(r.name)u.name=r.name;if(li(u,r),t.associations.set(u,{materials:e}),r.extensions)Er(i,u,r);return u})}createUniqueName(e){let t=et.sanitizeNodeName(e||"");if(t in this.nodeNamesUsed)return t+"_"+ ++this.nodeNamesUsed[t];else return this.nodeNamesUsed[t]=0,t}loadGeometries(e){let t=this,n=this.extensions,i=this.primitiveCache;function r(o){return n[qe.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(a){return Ix(a,o,t)})}let s=[];for(let o=0,a=e.length;o<a;o++){let c=e[o],l=qA(c),u=i[l];if(u)s.push(u.promise);else{let f;if(c.extensions&&c.extensions[qe.KHR_DRACO_MESH_COMPRESSION])f=r(c);else f=Ix(new jt,c,t);if(c.mode===Cn.TRIANGLE_STRIP)f=f.then((h)=>kh(h,no));else if(c.mode===Cn.TRIANGLE_FAN)f=f.then((h)=>kh(h,os));i[l]={primitive:c,promise:f},s.push(f)}}return Promise.all(s)}loadMesh(e){let t=this,n=this.json,i=this.extensions,r=n.meshes[e],s=r.primitives,o=[];for(let a=0,c=s.length;a<c;a++){let l=s[a].material===void 0?$A(this.cache):this.getDependency("material",s[a].material);o.push(l)}return o.push(t.loadGeometries(s)),Promise.all(o).then(async function(a){let c=a.slice(0,a.length-1),l=a[a.length-1],u=[];for(let h=0,d=l.length;h<d;h++){let g=l[h],x=s[h],p,m=c[h];if(x.mode===Cn.TRIANGLES||x.mode===Cn.TRIANGLE_STRIP||x.mode===Cn.TRIANGLE_FAN||x.mode===void 0){let E=r.isSkinnedMesh===!0,R=g.hasAttribute("skinIndex")&&g.hasAttribute("skinWeight");if(E&&R===!1)console.warn("THREE.GLTFLoader: Missing skinIndex or skinWeight attributes. Skinning disabled.");if(p=E&&R?new rc(g,m):new mt(g,m),p.isSkinnedMesh===!0)p.normalizeSkinWeights()}else if(x.mode===Cn.LINES)p=new sc(g,m);else if(x.mode===Cn.LINE_STRIP)p=new qi(g,m);else if(x.mode===Cn.LINE_LOOP)p=new oc(g,m);else if(x.mode===Cn.POINTS)p=new us(g,m);else throw Error("THREE.GLTFLoader: Primitive mode unsupported: "+x.mode);if(Object.keys(p.geometry.morphAttributes).length>0)XA(p,r);if(p.name=t.createUniqueName(r.name||"mesh_"+e),li(p,r),x.extensions)Er(i,p,x);t.assignFinalMaterial(p),u.push(p)}for(let h=0,d=u.length;h<d;h++)t.associations.set(u[h],{meshes:e,primitives:h});if(u.length===1){if(r.extensions)Er(i,u[0],r);return u[0]}let f=new Qn;if(r.extensions)Er(i,f,r);t.associations.set(f,{meshes:e});for(let h=0,d=u.length;h<d;h++)f.add(u[h]);return f})}loadCamera(e){let t,n=this.json.cameras[e],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}if(n.type==="perspective")t=new Dt(io.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2000000);else if(n.type==="orthographic")t=new wr(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar);if(n.name)t.name=this.createUniqueName(n.name);return li(t,n),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],n=[];for(let i=0,r=t.joints.length;i<r;i++)n.push(this._loadNodeShallow(t.joints[i]));if(t.inverseBindMatrices!==void 0)n.push(this.getDependency("accessor",t.inverseBindMatrices));else n.push(null);return Promise.all(n).then(function(i){let r=i.pop(),s=i,o=[],a=[];for(let c=0,l=s.length;c<l;c++){let u=s[c];if(u){o.push(u);let f=new Ge;if(r!==null)f.fromArray(r.array,c*16);a.push(f)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new lo(o,a)})}loadAnimation(e){let t=this.json,n=this,i=t.animations[e],r=i.name?i.name:"animation_"+e,s=[],o=[],a=[],c=[],l=[];for(let u=0,f=i.channels.length;u<f;u++){let h=i.channels[u],d=i.samplers[h.sampler],g=h.target,x=g.node,p=i.parameters!==void 0?i.parameters[d.input]:d.input,m=i.parameters!==void 0?i.parameters[d.output]:d.output;if(g.node===void 0)continue;s.push(this.getDependency("node",x)),o.push(this.getDependency("accessor",p)),a.push(this.getDependency("accessor",m)),c.push(d),l.push(g)}return Promise.all([Promise.all(s),Promise.all(o),Promise.all(a),Promise.all(c),Promise.all(l)]).then(function(u){let f=u[0],h=u[1],d=u[2],g=u[3],x=u[4],p=[];for(let E=0,R=f.length;E<R;E++){let S=f[E],b=h[E],T=d[E],A=g[E],_=x[E];if(S===void 0)continue;if(S.updateMatrix)S.updateMatrix();let M=n._createAnimationTracks(S,b,T,A,_);if(M)for(let F=0;F<M.length;F++)p.push(M[F])}let m=new Jr(r,void 0,p);return li(m,i),m})}createNodeMesh(e){let t=this.json,n=this,i=t.nodes[e];if(i.mesh===void 0)return null;return n.getDependency("mesh",i.mesh).then(function(r){let s=n._getNodeRef(n.meshCache,i.mesh,r);if(i.weights!==void 0)s.traverse(function(o){if(!o.isMesh)return;for(let a=0,c=i.weights.length;a<c;a++)o.morphTargetInfluences[a]=i.weights[a]});return s})}loadNode(e){let t=this.json,n=this,i=t.nodes[e],r=n._loadNodeShallow(e),s=[],o=i.children||[];for(let c=0,l=o.length;c<l;c++)s.push(n.getDependency("node",o[c]));let a=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([r,Promise.all(s),a]).then(function(c){let l=c[0],u=c[1],f=c[2];if(f!==null)l.traverse(function(h){if(!h.isSkinnedMesh)return;h.bind(f,jA)});for(let h=0,d=u.length;h<d;h++)l.add(u[h]);if(l.userData.pivot!==void 0&&u.length>0){let h=l.userData.pivot,d=u[0];l.pivot=new U().fromArray(h),l.position.x-=h[0],l.position.y-=h[1],l.position.z-=h[2],d.position.set(0,0,0),delete l.userData.pivot}return l})}_loadNodeShallow(e){let t=this.json,n=this.extensions,i=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let r=t.nodes[e],s=r.name?i.createUniqueName(r.name):"",o=[],a=i._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});if(a)o.push(a);if(r.camera!==void 0)o.push(i.getDependency("camera",r.camera).then(function(c){return i._getNodeRef(i.cameraCache,r.camera,c)}));return i._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let l;if(r.isBone===!0)l=new ao;else if(c.length>1)l=new Qn;else if(c.length===1)l=c[0];else l=new ut;if(l!==c[0])for(let u=0,f=c.length;u<f;u++)l.add(c[u]);if(r.name)l.userData.name=r.name,l.name=s;if(li(l,r),r.extensions)Er(n,l,r);if(r.matrix!==void 0){let u=new Ge;u.fromArray(r.matrix),l.applyMatrix4(u)}else{if(r.translation!==void 0)l.position.fromArray(r.translation);if(r.rotation!==void 0)l.quaternion.fromArray(r.rotation);if(r.scale!==void 0)l.scale.fromArray(r.scale)}if(!i.associations.has(l))i.associations.set(l,{});else if(r.mesh!==void 0&&i.meshCache.refs[r.mesh]>1){let u=i.associations.get(l);i.associations.set(l,{...u})}return i.associations.get(l).nodes=e,l}),this.nodeCache[e]}loadScene(e){let t=this.extensions,n=this.json.scenes[e],i=this,r=new Qn;if(n.name)r.name=i.createUniqueName(n.name);if(li(r,n),n.extensions)Er(t,r,n);let s=n.nodes||[],o=[];for(let a=0,c=s.length;a<c;a++)o.push(i.getDependency("node",s[a]));return Promise.all(o).then(function(a){for(let l=0,u=a.length;l<u;l++){let f=a[l];if(f.parent!==null)r.add(Ex(f));else r.add(f)}let c=(l)=>{let u=new Map;for(let[f,h]of i.associations)if(f instanceof cn||f instanceof Tt)u.set(f,h);return l.traverse((f)=>{let h=i.associations.get(f);if(h!=null)u.set(f,h)}),u};return i.associations=c(r),r})}_createAnimationTracks(e,t,n,i,r){let s=[],o=e.name?e.name:e.uuid,a=[];function c(h){if(h.morphTargetInfluences)a.push(h.name?h.name:h.uuid)}if(tr[r.path]===tr.weights){if(c(e),e.isGroup)e.children.forEach(c)}else a.push(o);let l;switch(tr[r.path]){case tr.weights:l=Ki;break;case tr.rotation:l=Ji;break;case tr.translation:case tr.scale:l=Mr;break;default:switch(n.itemSize){case 1:l=Ki;break;case 2:case 3:default:l=Mr;break}break}let u=i.interpolation!==void 0?WA[i.interpolation]:Ka,f=this._getArrayFromAccessor(n);for(let h=0,d=a.length;h<d;h++){let g=new l(a[h]+"."+tr[r.path],t.array,f,u);if(i.interpolation==="CUBICSPLINE")this._createCubicSplineTrackInterpolant(g);s.push(g)}return s}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let n=$h(t.constructor),i=new Float32Array(t.length);for(let r=0,s=t.length;r<s;r++)i[r]=t[r]*n;t=i}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){return new(this instanceof Ji?ev:Xh)(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function KA(e,t,n){let i=t.attributes,r=new nn;if(i.POSITION!==void 0){let a=n.json.accessors[i.POSITION],{min:c,max:l}=a;if(c!==void 0&&l!==void 0){if(r.set(new U(c[0],c[1],c[2]),new U(l[0],l[1],l[2])),a.normalized){let u=$h(_s[a.componentType]);r.min.multiplyScalar(u),r.max.multiplyScalar(u)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let s=t.targets;if(s!==void 0){let a=new U,c=new U;for(let l=0,u=s.length;l<u;l++){let f=s[l];if(f.POSITION!==void 0){let h=n.json.accessors[f.POSITION],{min:d,max:g}=h;if(d!==void 0&&g!==void 0){if(c.setX(Math.max(Math.abs(d[0]),Math.abs(g[0]))),c.setY(Math.max(Math.abs(d[1]),Math.abs(g[1]))),c.setZ(Math.max(Math.abs(d[2]),Math.abs(g[2]))),h.normalized){let x=$h(_s[h.componentType]);c.multiplyScalar(x)}a.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}r.expandByVector(a)}e.boundingBox=r;let o=new xn;r.getCenter(o.center),o.radius=r.min.distanceTo(r.max)/2,e.boundingSphere=o}function Ix(e,t,n){let i=t.attributes,r=[];function s(o,a){return n.getDependency("accessor",o).then(function(c){e.setAttribute(a,c)})}for(let o in i){let a=Wh[o]||o.toLowerCase();if(a in e.attributes)continue;r.push(s(i[o],a))}if(t.indices!==void 0&&!e.index){let o=n.getDependency("accessor",t.indices).then(function(a){e.setIndex(a)});r.push(o)}if($e.workingColorSpace!==gn&&"COLOR_0"in i)console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${$e.workingColorSpace}" not supported.`);return li(e,t),KA(e,t,n),Promise.all(r).then(function(){return t.targets!==void 0?ZA(e,t.targets,n):e})}var nv={type:"change"},Yh={type:"start"},rv={type:"end"},Mc=new Xi,iv=new Tn,JA=Math.cos(70*io.DEG2RAD),Ft=new U,ln=2*Math.PI,ct={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},qh=0.000001;class jh extends xc{constructor(e,t=null){super(e,t);if(this.state=ct.NONE,this.target=new U,this.cursor=new U,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=0.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Hi.ROTATE,MIDDLE:Hi.DOLLY,RIGHT:Hi.PAN},this.touches={ONE:Vi.ROTATE,TWO:Vi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new U,this._lastQuaternion=new kt,this._lastTargetPosition=new U,this._quat=new kt().setFromUnitVectors(e.up,new U(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new xo,this._sphericalDelta=new xo,this._scale=1,this._panOffset=new U,this._rotateStart=new Ne,this._rotateEnd=new Ne,this._rotateDelta=new Ne,this._panStart=new Ne,this._panEnd=new Ne,this._panDelta=new Ne,this._dollyStart=new Ne,this._dollyEnd=new Ne,this._dollyDelta=new Ne,this._dollyDirection=new U,this._mouse=new Ne,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=e1.bind(this),this._onPointerDown=QA.bind(this),this._onPointerUp=t1.bind(this),this._onContextMenu=c1.bind(this),this._onMouseWheel=r1.bind(this),this._onKeyDown=s1.bind(this),this._onTouchStart=o1.bind(this),this._onTouchMove=a1.bind(this),this._onMouseDown=n1.bind(this),this._onMouseMove=i1.bind(this),this._interceptControlDown=l1.bind(this),this._interceptControlUp=u1.bind(this),this.domElement!==null)this.connect(this.domElement);this.update()}set cursorStyle(e){if(this._cursorStyle=e,e==="grab")this.domElement.style.cursor="grab";else this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=ct.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){if(this._domElementKeyEvents!==null)this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(nv),this.update(),this.state=ct.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;if(Ft.copy(t).sub(this.target),Ft.applyQuaternion(this._quat),this._spherical.setFromVector3(Ft),this.autoRotate&&this.state===ct.NONE)this._rotateLeft(this._getAutoRotationAngle(e));if(this.enableDamping)this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor;else this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi;let n=this.minAzimuthAngle,i=this.maxAzimuthAngle;if(isFinite(n)&&isFinite(i)){if(n<-Math.PI)n+=ln;else if(n>Math.PI)n-=ln;if(i<-Math.PI)i+=ln;else if(i>Math.PI)i-=ln;if(n<=i)this._spherical.theta=Math.max(n,Math.min(i,this._spherical.theta));else this._spherical.theta=this._spherical.theta>(n+i)/2?Math.max(n,this._spherical.theta):Math.min(i,this._spherical.theta)}if(this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0)this.target.addScaledVector(this._panOffset,this.dampingFactor);else this.target.add(this._panOffset);this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let s=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=s!=this._spherical.radius}if(Ft.setFromSpherical(this._spherical),Ft.applyQuaternion(this._quatInverse),t.copy(this.target).add(Ft),this.object.lookAt(this.target),this.enableDamping===!0)this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor);else this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0);if(this.zoomToCursor&&this._performCursorZoom){let s=null;if(this.object.isPerspectiveCamera){let o=Ft.length();s=this._clampDistance(o*this._scale);let a=o-s;this.object.position.addScaledVector(this._dollyDirection,a),this.object.updateMatrixWorld(),r=!!a}else if(this.object.isOrthographicCamera){let o=new U(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=a!==this.object.zoom;let c=new U(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),s=Ft.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;if(s!==null)if(this.screenSpacePanning)this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(s).add(this.object.position);else if(Mc.origin.copy(this.object.position),Mc.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Mc.direction))<JA)this.object.lookAt(this.target);else iv.setFromNormalAndCoplanarPoint(this.object.up,this.target),Mc.intersectPlane(iv,this.target)}else if(this.object.isOrthographicCamera){let s=this.object.zoom;if(this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),s!==this.object.zoom)this.object.updateProjectionMatrix(),r=!0}if(this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>qh||8*(1-this._lastQuaternion.dot(this.object.quaternion))>qh||this._lastTargetPosition.distanceToSquared(this.target)>qh)return this.dispatchEvent(nv),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0;return!1}_getAutoRotationAngle(e){if(e!==null)return ln/60*this.autoRotateSpeed*e;else return ln/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*0.01);return Math.pow(0.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Ft.setFromMatrixColumn(t,0),Ft.multiplyScalar(-e),this._panOffset.add(Ft)}_panUp(e,t){if(this.screenSpacePanning===!0)Ft.setFromMatrixColumn(t,1);else Ft.setFromMatrixColumn(t,0),Ft.crossVectors(this.object.up,Ft);Ft.multiplyScalar(e),this._panOffset.add(Ft)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let i=this.object.position;Ft.copy(i).sub(this.target);let r=Ft.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else if(this.object.isOrthographicCamera)this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix);else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1}_dollyOut(e){if(this.object.isPerspectiveCamera||this.object.isOrthographicCamera)this._scale/=e;else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1}_dollyIn(e){if(this.object.isPerspectiveCamera||this.object.isOrthographicCamera)this._scale*=e;else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),i=e-n.left,r=t-n.top,{width:s,height:o}=n;this._mouse.x=i/s*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(ln*this._rotateDelta.x/t.clientHeight),this._rotateUp(ln*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){if(this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0)this._dollyOut(this._getZoomScale(this._dollyDelta.y));else if(this._dollyDelta.y<0)this._dollyIn(this._getZoomScale(this._dollyDelta.y));this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){if(this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0)this._dollyIn(this._getZoomScale(e.deltaY));else if(e.deltaY>0)this._dollyOut(this._getZoomScale(e.deltaY));this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate)this._rotateUp(ln*this.keyRotateSpeed/this.domElement.clientHeight)}else if(this.enablePan)this._pan(0,this.keyPanSpeed);t=!0;break;case this.keys.BOTTOM:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate)this._rotateUp(-ln*this.keyRotateSpeed/this.domElement.clientHeight)}else if(this.enablePan)this._pan(0,-this.keyPanSpeed);t=!0;break;case this.keys.LEFT:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate)this._rotateLeft(ln*this.keyRotateSpeed/this.domElement.clientHeight)}else if(this.enablePan)this._pan(this.keyPanSpeed,0);t=!0;break;case this.keys.RIGHT:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate)this._rotateLeft(-ln*this.keyRotateSpeed/this.domElement.clientHeight)}else if(this.enablePan)this._pan(-this.keyPanSpeed,0);t=!0;break}if(t)e.preventDefault(),this.update()}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=0.5*(e.pageX+t.x),i=0.5*(e.pageY+t.y);this._rotateStart.set(n,i)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=0.5*(e.pageX+t.x),i=0.5*(e.pageY+t.y);this._panStart.set(n,i)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){if(this.enableZoom)this._handleTouchStartDolly(e);if(this.enablePan)this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){if(this.enableZoom)this._handleTouchStartDolly(e);if(this.enableRotate)this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),i=0.5*(e.pageX+n.x),r=0.5*(e.pageY+n.y);this._rotateEnd.set(i,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(ln*this._rotateDelta.x/t.clientHeight),this._rotateUp(ln*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=0.5*(e.pageX+t.x),i=0.5*(e.pageY+t.y);this._panEnd.set(n,i)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let s=(e.pageX+t.x)*0.5,o=(e.pageY+t.y)*0.5;this._updateZoomParameters(s,o)}_handleTouchMoveDollyPan(e){if(this.enableZoom)this._handleTouchMoveDolly(e);if(this.enablePan)this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){if(this.enableZoom)this._handleTouchMoveDolly(e);if(this.enableRotate)this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];if(t===void 0)t=new Ne,this._pointerPositions[e.pointerId]=t;t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}if(e.ctrlKey&&!this._controlActive)n.deltaY*=10;return n}}function QA(e){if(this.enabled===!1)return;if(this._pointers.length===0)this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp);if(this._isTrackingPointer(e))return;if(this._addPointer(e),e.pointerType==="touch")this._onTouchStart(e);else this._onMouseDown(e);if(this._cursorStyle==="grab")this.domElement.style.cursor="grabbing"}function e1(e){if(this.enabled===!1)return;if(e.pointerType==="touch")this._onTouchMove(e);else this._onMouseMove(e)}function t1(e){switch(this._removePointer(e),this._pointers.length){case 0:if(this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(rv),this.state=ct.NONE,this._cursorStyle==="grab")this.domElement.style.cursor="grab";break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y});break}}function n1(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Hi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=ct.DOLLY;break;case Hi.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=ct.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=ct.ROTATE}break;case Hi.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=ct.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=ct.PAN}break;default:this.state=ct.NONE}if(this.state!==ct.NONE)this.dispatchEvent(Yh)}function i1(e){switch(this.state){case ct.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case ct.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case ct.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e);break}}function r1(e){if(this.enabled===!1||this.enableZoom===!1||this.state!==ct.NONE)return;e.preventDefault(),this.dispatchEvent(Yh),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(rv)}function s1(e){if(this.enabled===!1)return;this._handleKeyDown(e)}function o1(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case Vi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=ct.TOUCH_ROTATE;break;case Vi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=ct.TOUCH_PAN;break;default:this.state=ct.NONE}break;case 2:switch(this.touches.TWO){case Vi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=ct.TOUCH_DOLLY_PAN;break;case Vi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=ct.TOUCH_DOLLY_ROTATE;break;default:this.state=ct.NONE}break;default:this.state=ct.NONE}if(this.state!==ct.NONE)this.dispatchEvent(Yh)}function a1(e){switch(this._trackPointer(e),this.state){case ct.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case ct.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case ct.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case ct.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=ct.NONE}}function c1(e){if(this.enabled===!1)return;e.preventDefault()}function l1(e){if(e.key==="Control")this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0})}function u1(e){if(e.key==="Control")this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0})}class Kh extends as{constructor(){super();this.name="RoomEnvironment",this.position.y=-3.5;let e=new Yi;e.deleteAttribute("uv");let t=new wi({side:Yt}),n=new wi,i=new fs(16777215,900,28,2);i.position.set(0.418,16.199,0.3),this.add(i);let r=new mt(e,t);r.position.set(-0.757,13.219,0.717),r.scale.set(31.713,28.305,28.591),this.add(r);let s=new ls(e,n,6),o=new ut;o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-0.195,0),o.scale.set(2.328,7.905,4.651),o.updateMatrix(),s.setMatrixAt(0,o.matrix),o.position.set(-5.607,-0.754,-0.758),o.rotation.set(0,0.994,0),o.scale.set(1.97,1.534,3.955),o.updateMatrix(),s.setMatrixAt(1,o.matrix),o.position.set(6.167,0.857,7.803),o.rotation.set(0,0.561,0),o.scale.set(3.927,6.285,3.687),o.updateMatrix(),s.setMatrixAt(2,o.matrix),o.position.set(-2.017,0.018,6.124),o.rotation.set(0,0.333,0),o.scale.set(2.002,4.566,2.064),o.updateMatrix(),s.setMatrixAt(3,o.matrix),o.position.set(2.291,-0.756,-2.621),o.rotation.set(0,-0.286,0),o.scale.set(1.546,1.552,1.496),o.updateMatrix(),s.setMatrixAt(4,o.matrix),o.position.set(-2.193,-0.369,-5.547),o.rotation.set(0,0.516,0),o.scale.set(3.875,3.487,2.986),o.updateMatrix(),s.setMatrixAt(5,o.matrix),this.add(s);let a=new mt(e,xs(50));a.position.set(-16.116,14.37,8.208),a.scale.set(0.1,2.428,2.739),this.add(a);let c=new mt(e,xs(50));c.position.set(-16.109,18.021,-8.207),c.scale.set(0.1,2.425,2.751),this.add(c);let l=new mt(e,xs(17));l.position.set(14.904,12.198,-1.832),l.scale.set(0.15,4.265,6.331),this.add(l);let u=new mt(e,xs(43));u.position.set(-0.462,8.89,14.52),u.scale.set(4.38,5.441,0.088),this.add(u);let f=new mt(e,xs(20));f.position.set(3.235,11.486,-12.541),f.scale.set(2.5,2,0.1),this.add(f);let h=new mt(e,xs(100));h.position.set(0,20,0),h.scale.set(1,0.1,1),this.add(h)}dispose(){let e=new Set;this.traverse((t)=>{if(t.isMesh)e.add(t.geometry),e.add(t.material)});for(let t of e)t.dispose()}}function xs(e){return new lc({color:0,emissive:16777215,emissiveIntensity:e})}function sv(e,t,n=40,i=[e]){let r=e.getCenter(new U),s=Math.max(e.getSize(new U).length()/2,0.01),o=new U(1,0.65,1.25).normalize(),a=new U().crossVectors(new U(0,1,0),o).normalize(),c=new U().crossVectors(o,a),l=[];for(let E of i.length?i:[e])for(let R of[E.min.x,E.max.x])for(let S of[E.min.y,E.max.y])for(let b of[E.min.z,E.max.z])l.push(new U(R,S,b));let u=1/0,f=-1/0,h=1/0,d=-1/0;for(let E of l){let R=E.clone().sub(r),S=R.dot(a),b=R.dot(c);u=Math.min(u,S),f=Math.max(f,S),h=Math.min(h,b),d=Math.max(d,b)}r.addScaledVector(a,(u+f)/2),r.addScaledVector(c,(h+d)/2);let g=Math.tan(n*Math.PI/360),x=g*t,p=s;for(let E of l){let R=E.clone().sub(r),S=R.dot(o);p=Math.max(p,S+Math.abs(R.dot(a))*1.12/x,S+Math.abs(R.dot(c))*1.12/g)}let m=r.clone().addScaledVector(o,p);return{center:r,radius:s,distance:p,position:m}}function ov(e){let t=new zh({antialias:!0,alpha:!1});t.setPixelRatio(Math.min(devicePixelRatio,2)),t.setClearColor(1382930),t.toneMapping=Qs,t.toneMappingExposure=1.15,e.replaceChildren(t.domElement);let n=new as,i=new Dt(40,1,0.01,1000),r=new jh(i,t.domElement);r.enableDamping=!0;let s=new Mo(t),o=new Kh,a=s.fromScene(o,0.04);n.environment=a.texture,o.dispose(),s.dispose();let c=new ds(16773591,2.4);c.position.set(4,8,5),n.add(c),n.add(new dc(14806490,5065021,1.7));let l,u,f=[],h=!0,d=performance.now(),g=0,x=0,p=!1,m=(b)=>{let T=new Set,A=new Set,_=new Set;b.traverse((M)=>{let F=M;if(!F.isMesh)return;T.add(F.geometry);for(let P of Array.isArray(F.material)?F.material:[F.material]){A.add(P);for(let O of Object.values(P))if(O instanceof Tt)_.add(O)}});for(let M of[...T,...A,..._])M.dispose()},E=()=>{if(!l)return;let b=new nn().setFromObject(l,!0),T=[];l.traverse((P)=>{if(P instanceof mt||P instanceof qi||P instanceof us){let O=new nn().setFromObject(P,!0);if(!O.isEmpty())T.push(O)}});let{center:A,radius:_,distance:M,position:F}=sv(b,i.aspect,i.fov,T);r.target.copy(A),i.position.copy(F),i.near=Math.max(_/1000,0.0001),i.far=M+_*100,r.minDistance=_*0.1,r.maxDistance=_*80,i.updateProjectionMatrix(),r.update()},R=new ResizeObserver(()=>{let{clientWidth:b,clientHeight:T}=e;if(!b||!T)return;t.setSize(b,T),i.aspect=b/T,i.updateProjectionMatrix()});R.observe(e);let S=(b)=>{if(p)return;let T=Math.min((b-d)/1000,0.1);if(d=b,h)u?.update(T);r.update(),t.render(n,i),g=requestAnimationFrame(S)};return g=requestAnimationFrame(S),{async load(b){let T=++x;Ol(b);let A=new mo;A.setURLModifier((C)=>{if(!C.startsWith("blob:")&&!C.startsWith("data:"))throw Error("External model resources are not loaded");return C});let _=await new Zh(A).parseAsync(Uint8Array.from(b).buffer,"");if(p||T!==x){m(_.scene);return}if(l)u?.stopAllAction(),u?.uncacheRoot(l),n.remove(l),m(l);l=_.scene,n.add(l),f=_.animations,u=new _c(l),h=!0;let{clientWidth:M,clientHeight:F}=e;t.setSize(M,F),i.aspect=M/F,E();let P=0,O=0,K=new Set;return l.traverse((C)=>{let G=C;if(!G.isMesh)return;O++,P+=(G.geometry.index?.count??G.geometry.attributes.position?.count??0)/3*(G.isInstancedMesh?G.count:1);for(let X of Array.isArray(G.material)?G.material:[G.material])K.add(X)}),{triangles:P,meshes:O,materials:K.size,clips:f.map((C)=>C.name)}},reset:E,wire(b){l?.traverse((T)=>{let A=T;if(A.isMesh){for(let _ of Array.isArray(A.material)?A.material:[A.material])if("wireframe"in _)_.wireframe=b}})},lighting(b){t.toneMappingExposure=b==="bright"?1.65:b==="soft"?0.85:1.15,c.intensity=b==="soft"?0.8:2.4},clip(b){if(u?.stopAllAction(),f[b])u?.clipAction(f[b]).play()},pause(b){h=!b},dispose(){if(p=!0,x++,cancelAnimationFrame(g),R.disconnect(),r.dispose(),l)m(l);a.dispose(),t.dispose(),e.replaceChildren()}}}var Fe=(e)=>document.getElementById(e),Ct=(e,t,n)=>{let i=document.createElement(e);if(t!==void 0)i.textContent=t;if(n)i.className=n;return i},Ro=[],ys=[],Rr=[],wc="",vs,Sn,To=0,av=0,Eo=!1,Ao=!1,nr=new Set,Jh=[],cv=[],Ar=(e)=>`${e.collection}/${e.manifest.assetId}/${e.manifest.revisionId}`,lv=(e)=>{Fe("status").textContent=e},Cr=(e)=>lv(e instanceof Error?e.message:String(e)),Co=(e,t,n=Jh)=>{let i=URL.createObjectURL(new Blob([Uint8Array.from(e)],{type:t}));return n.push(i),i};async function uv(e){let t=await fetch(e),n=await t.json();if(!t.ok)throw Error(n.error??"Request failed");return n}async function h1(e,t){if(e.local){let i=e.local.files[t];if(!i)throw Error("File unavailable");return i}if(e.loose&&t==="asset.glb")return e.loose;let n=await fetch(`/files/${Ar(e)}/${t}`);if(!n.ok)throw Error((await n.json()).error??"File unavailable");return new Uint8Array(await n.arrayBuffer())}function f1(e,t){if(e.local){if(t==="editable.zip")return Co(Ul([e.local]),"application/zip");return Co(e.local.files[t],t.endsWith(".js")?"text/javascript":"model/gltf-binary")}if(e.loose)return Co(e.loose,"model/gltf-binary");return`/files/${Ar(e)}/${t}?download`}function hv(e,t){try{localStorage.setItem(e,t)}catch{}}function fv(e){try{return localStorage.getItem(e)}catch{return null}}function d1(){let e=Fe("collections");e.replaceChildren();for(let t of[...Ro,...Rr.length?[{id:"opened-files",label:"Opened files"}]:[]]){let n=Ct("button",t.label,wc===t.id?"active":"");n.onclick=()=>void Tc(t.id).catch(Cr),e.append(n)}}async function Tc(e){let t=++av;wc=e,nr.clear(),d1(),lv("");let n=e==="opened-files"?Rr:(await uv(`/api/assets?collection=${encodeURIComponent(e)}`)).assets.map((i)=>({collection:e,manifest:i}));if(t!==av)return;ys=n,hv("kiln.collection",e),Fe("collection-title").textContent=e==="opened-files"?"Opened files":Ro.find((i)=>i.id===e)?.label??e,Fe("collection-caption").textContent=e==="opened-files"?"Previewed in your browser. Your original files stay untouched.":"Saved revisions, editable source, and everything ready to use.",Qh()}function p1(){let e=new Map;for(let t of ys){let n=t.manifest.assetId;e.set(n,[...e.get(n)??[],t])}return[...e.values()].map((t)=>(t.sort((n,i)=>i.manifest.createdAt.localeCompare(n.manifest.createdAt)||i.manifest.revisionId.localeCompare(n.manifest.revisionId)),t.find((n)=>n.manifest.revisionId===fv(`kiln.revision.${n.collection}.${n.manifest.assetId}`))??t[0]))}function Qh(){for(let i of cv.splice(0))URL.revokeObjectURL(i);let e=Fe("cards");e.replaceChildren();let t=Fe("search").value.toLowerCase(),n=p1().filter((i)=>`${i.manifest.name} ${i.manifest.tags.join(" ")}`.toLowerCase().includes(t));if(Fe("count").textContent=`${n.length} asset${n.length===1?"":"s"}`,Fe("export-selection").disabled=!nr.size,!n.length){let i=Ct("div",void 0,"empty");if(i.append(Ct("b",t?"No matching assets":"Your next idea belongs here."),Ct("p",t?"Try another name or tag.":"Save an asset with your agent, or open a GLB or editable bundle.")),!t)i.append(Ct("code",'kiln save asset.kiln.js --name "My asset"'));e.append(i);return}for(let i of n){let r=i.manifest,s=Ct("article",void 0,"card"),o=Ct("button",void 0,"card-open");o.setAttribute("aria-label",`View ${r.name}`),o.onclick=()=>void ef(i).catch(Cr);let a=Ct("div",void 0,"thumb");if(r.files["preview.png"]){let d=Ct("img");d.loading="lazy",d.alt=r.name,d.src=i.local?Co(i.local.files["preview.png"],"image/png",cv):`/files/${Ar(i)}/preview.png`,d.onerror=()=>{d.remove(),a.textContent="◇"},a.append(d)}else a.textContent="◇";let c=Ct("div",void 0,"card-content");c.append(Ct("span",r.name,"card-title"));let l=ys.filter((d)=>d.manifest.assetId===r.assetId),u=new Set(l.map((d)=>d.manifest.parentRevision)),f=l.filter((d)=>!u.has(d.manifest.revisionId));c.append(Ct("span",`${r.editable?"Editable source":"Source unavailable"} · ${l.length} revision${l.length===1?"":"s"}${f.length>1?` · ${f.length} branches`:""}`,"card-meta"));let h=Ct("div",void 0,"tags");for(let d of r.tags)h.append(Ct("span",d,"tag"));if(c.append(h),o.append(a,c),s.append(o),!i.loose){let d=Ct("input");d.type="checkbox",d.className="selection",d.checked=nr.has(Ar(i)),d.setAttribute("aria-label",`Select ${r.name}`),d.onchange=()=>{if(d.checked)nr.add(Ar(i));else nr.delete(Ar(i));Fe("export-selection").disabled=!nr.size},s.append(d)}e.append(s)}}async function ef(e){let t=++To;vs=e,hv(`kiln.revision.${e.collection}.${e.manifest.assetId}`,e.manifest.revisionId);for(let o of Jh.splice(0))URL.revokeObjectURL(o);let n=Fe("detail");if(!n.open)n.showModal();Fe("asset-name").textContent=e.manifest.name;let i=Fe("revisions");i.replaceChildren();for(let o of ys.filter((a)=>a.manifest.assetId===e.manifest.assetId)){let a=Ct("option",`${new Date(o.manifest.createdAt).toLocaleString()} · ${o.manifest.description||o.manifest.revisionId.slice(0,10)}`);a.value=o.manifest.revisionId,a.selected=o.manifest.revisionId===e.manifest.revisionId,i.append(a)}i.onchange=()=>{let o=ys.find((a)=>a.manifest.assetId===e.manifest.assetId&&a.manifest.revisionId===i.value);if(o)ef(o).catch(Cr)},Fe("asset-description").textContent=e.manifest.description??e.manifest.brief??(e.manifest.editable?"Source travels with this revision. Download the editable bundle to continue elsewhere.":"This GLB has no saved Kiln source. You can view and use the model."),Fe("provenance").textContent=e.loose?"Standalone GLB. No source or build provenance supplied.":JSON.stringify(e.manifest,null,2);let r=Fe("downloads");r.replaceChildren();for(let[o,a]of[["asset.glb","Download GLB"],...e.manifest.editable?[["source.kiln.js","Download source"]]:[],...!e.loose?[["editable.zip",e.manifest.editable?"Download editable bundle":"Download asset bundle"]]:[]]){let c=Ct("a",a);c.href=f1(e,o),c.download=`${e.manifest.name.replace(/[^a-z0-9_-]/gi,"-")}${o==="asset.glb"?".glb":o==="source.kiln.js"?".kiln.js":".zip"}`,r.append(c)}Fe("refine").disabled=!e.manifest.editable,Fe("asset-stats").replaceChildren(),Fe("stage-status").textContent="Loading saved GLB…",Eo=!1,Ao=!1,Fe("wire").setAttribute("aria-pressed","false"),Fe("play").textContent="Pause";let s=Fe("animation");s.replaceChildren(new Option("Rest pose","")),Fe("play").disabled=!0;try{Sn??=ov(Fe("stage"));let o=await h1(e,"asset.glb");if(t!==To)return;let a=await Sn.load(o);if(!a||t!==To)return;Sn.wire(!1),Sn.lighting(Fe("lighting").value);for(let[c,l]of[[a.triangles.toLocaleString(),"triangles"],[a.meshes,"meshes"],[a.materials,"materials"],[`${(o.length/1024).toFixed(0)} KB`,"GLB"]]){let u=Ct("div");u.append(Ct("strong",String(c)),Ct("span",String(l))),Fe("asset-stats").append(u)}for(let c=0;c<a.clips.length;c++)s.append(new Option(a.clips[c],String(c)));Fe("stage-status").textContent=""}catch(o){if(t===To)Sn?.dispose(),Sn=void 0,Fe("stage-status").textContent=`3D preview unavailable: ${o instanceof Error?o.message:o}. Downloads remain available.`}}async function dv(e){for(let t of e){if(t.bytes.length>mi)throw Error("File exceeds 64 MiB");if(t.name.toLowerCase().endsWith(".zip"))for(let n of e_(t.bytes)){for(let[i,r]of Object.entries(n.files))if(`sha256:${Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",Uint8Array.from(r)))).map((o)=>o.toString(16).padStart(2,"0")).join("")}`!==n.manifest.files[i]?.sha256)throw Error(`Bundle integrity failure: ${i}`);if(!Rr.some((i)=>i.manifest.revisionId===n.manifest.revisionId&&i.manifest.assetId===n.manifest.assetId))Rr.push({collection:"opened-files",manifest:n.manifest,local:n})}else{let n=`a_${crypto.randomUUID().replaceAll("-","")}`;Rr.push({collection:"opened-files",loose:t.bytes,manifest:{version:"kiln.asset.v1",assetId:n,revisionId:`r_${n}`,name:t.name.replace(/\.glb$/i,""),tags:[],createdAt:new Date().toISOString(),editable:!1,files:{}}})}}await Tc("opened-files")}Fe("open").onchange=async(e)=>{try{let t=Array.from(e.target.files??[]);if(t.some((n)=>n.size>mi))throw Error("File exceeds 64 MiB");await dv(await Promise.all(t.map(async(n)=>({name:n.name,bytes:new Uint8Array(await n.arrayBuffer())}))))}catch(t){Cr(t)}};Fe("refresh").onclick=()=>void Tc(wc).catch(Cr);Fe("search").oninput=Qh;Fe("close-detail").onclick=()=>Fe("detail").close();Fe("detail").addEventListener("close",()=>{To++,Sn?.dispose(),Sn=void 0;for(let e of Jh.splice(0))URL.revokeObjectURL(e);Qh()});Fe("frame").onclick=()=>Sn?.reset();Fe("wire").onclick=()=>{Eo=!Eo,Sn?.wire(Eo),Fe("wire").setAttribute("aria-pressed",String(Eo))};Fe("lighting").onchange=(e)=>Sn?.lighting(e.target.value);Fe("animation").onchange=(e)=>{let t=e.target.value;Sn?.clip(t===""?-1:Number(t)),Fe("play").disabled=t===""};Fe("play").onclick=()=>{Ao=!Ao,Sn?.pause(Ao),Fe("play").textContent=Ao?"Play":"Pause"};Fe("refine").onclick=async()=>{if(!vs)return;let e=vs.manifest,t=vs.local?`Import the downloaded editable bundle using kiln import <bundle.zip>. Restore asset ${e.assetId}, revision ${e.revisionId}, using kiln_assets action=restore. Read its source with kiln_source, refine it with kiln_edit, review the result, and save a child revision with kiln_save. Requested change: `:`Use kiln_assets with action=restore, collection=${vs.collection}, assetId=${e.assetId}, revisionId=${e.revisionId}. Read the returned programRef with kiln_source, refine it with kiln_edit, review the result, and save with kiln_save using assetId=${e.assetId}, parentRevision=${e.revisionId}, collection=${vs.collection}. Requested change: `;try{await navigator.clipboard.writeText(t),Fe("refine").textContent="Instructions copied"}catch{Fe("provenance").textContent=t,Fe("provenance").parentElement?.setAttribute("open","")}};Fe("export-selection").onclick=()=>{try{let e=Ct("a");if(wc==="opened-files")e.href=Co(Ul(ys.filter((t)=>nr.has(Ar(t))).map((t)=>t.local)),"application/zip");else{let t=new URLSearchParams;for(let n of nr)t.append("revision",n);e.href=`/api/bundle?${t}`}e.download="kiln-assets.zip",e.click()}catch(e){Cr(e)}};async function m1(){Ro=(await uv("/api/collections")).collections;let e=fv("kiln.collection");if(await Tc(Ro.find((t)=>t.id===e)?.id??Ro[0]?.id??"project"),new URLSearchParams(location.search).has("open")){let t=await fetch("/api/standalone");if(!t.ok)throw Error("File unavailable");if(await dv([{name:t.headers.get("Content-Type")?.includes("zip")?"asset.zip":"asset.glb",bytes:new Uint8Array(await t.arrayBuffer())}]),Rr.length===1)await ef(Rr[0])}}m1().catch(Cr);
