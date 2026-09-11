var Th;function q(e,t,n){function i(a,c){if(!a._zod)Object.defineProperty(a,"_zod",{value:{def:c,constr:o,traits:new Set},enumerable:!1});if(a._zod.traits.has(e))return;a._zod.traits.add(e),t(a,c);let l=o.prototype,u=Object.keys(l);for(let f=0;f<u.length;f++){let h=u[f];if(!(h in a))a[h]=l[h].bind(a)}}let r=n?.Parent??Object;class s extends r{}Object.defineProperty(s,"name",{value:e});function o(a){var c;let l=n?.Parent?new s:this;i(l,a),(c=l._zod).deferred??(c.deferred=[]);for(let u of l._zod.deferred)u();return l}return Object.defineProperty(o,"init",{value:i}),Object.defineProperty(o,Symbol.hasInstance,{value:(a)=>{if(n?.Parent&&a instanceof n.Parent)return!0;return a?._zod?.traits?.has(e)}}),Object.defineProperty(o,"name",{value:e}),o}var dE=Symbol("zod_brand");class ii extends Error{constructor(){super("Encountered Promise during synchronous parse. Use .parseAsync() instead.")}}class ds extends Error{constructor(e){super(`Encountered unidirectional transform during encode: ${e}`);this.name="ZodEncodeError"}}(Th=globalThis).__zod_globalConfig??(Th.__zod_globalConfig={});var Er=globalThis.__zod_globalConfig;function Tn(e){if(e)Object.assign(Er,e);return Er}function yo(e){let t=Object.values(e).filter((i)=>typeof i==="number");return Object.entries(e).filter(([i,r])=>t.indexOf(+i)===-1).map(([i,r])=>r)}function ms(e,t){if(typeof t==="bigint")return t.toString();return t}function bo(e){return{get value(){{let n=e();return Object.defineProperty(this,"value",{value:n}),n}throw Error("cached value already set")}}}function So(e){return e===null||e===void 0}function Mo(e){let t=e.startsWith("^")?1:0,n=e.endsWith("$")?e.length-1:e.length;return e.slice(t,n)}function Ah(e,t){let n=e/t,i=Math.round(n),r=Number.EPSILON*Math.max(Math.abs(n),1);if(Math.abs(n-i)<r)return 0;return n-i}var Eh=Symbol("evaluating");function it(e,t,n){let i=void 0;Object.defineProperty(e,t,{get(){if(i===Eh)return;if(i===void 0)i=Eh,i=n();return i},set(r){Object.defineProperty(e,t,{value:r})},configurable:!0})}function Ji(e,t,n){Object.defineProperty(e,t,{value:n,writable:!0,enumerable:!0,configurable:!0})}function bi(...e){let t={};for(let n of e){let i=Object.getOwnPropertyDescriptors(n);Object.assign(t,i)}return Object.defineProperties({},t)}function sc(e){return JSON.stringify(e)}function Rh(e){return e.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")}var oc="captureStackTrace"in Error?Error.captureStackTrace:(...e)=>{};function ps(e){return typeof e==="object"&&e!==null&&!Array.isArray(e)}var Ch=bo(()=>{if(Er.jitless)return!1;if(typeof navigator<"u"&&navigator?.userAgent?.includes("Cloudflare"))return!1;try{return new Function(""),!0}catch(e){return!1}});function Ki(e){if(ps(e)===!1)return!1;let t=e.constructor;if(t===void 0)return!0;if(typeof t!=="function")return!0;let n=t.prototype;if(ps(n)===!1)return!1;if(Object.prototype.hasOwnProperty.call(n,"isPrototypeOf")===!1)return!1;return!0}function ac(e){if(Ki(e))return{...e};if(Array.isArray(e))return[...e];if(e instanceof Map)return new Map(e);if(e instanceof Set)return new Set(e);return e}var Ih=new Set(["string","number","symbol"]);function Si(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Gn(e,t,n){let i=new e._zod.constr(t??e._zod.def);if(!t||n?.parent)i._zod.parent=e;return i}function Te(e){let t=e;if(!t)return{};if(typeof t==="string")return{error:()=>t};if(t?.message!==void 0){if(t?.error!==void 0)throw Error("Cannot specify both `message` and `error` params");t.error=t.message}if(delete t.message,typeof t.error==="string")return{...t,error:()=>t.error};return t}function Ph(e){return Object.keys(e).filter((t)=>e[t]._zod.optin==="optional"&&e[t]._zod.optout==="optional")}var Lh={safeint:[Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],int32:[-2147483648,2147483647],uint32:[0,4294967295],float32:[-340282346638528860000000000000000000000,340282346638528860000000000000000000000],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]};function Q0(e,t){let n=e._zod.def,i=n.checks;if(i&&i.length>0)throw Error(".pick() cannot be used on object schemas containing refinements");let s=bi(e._zod.def,{get shape(){let o={};for(let a in t){if(!(a in n.shape))throw Error(`Unrecognized key: "${a}"`);if(!t[a])continue;o[a]=n.shape[a]}return Ji(this,"shape",o),o},checks:[]});return Gn(e,s)}function ex(e,t){let n=e._zod.def,i=n.checks;if(i&&i.length>0)throw Error(".omit() cannot be used on object schemas containing refinements");let s=bi(e._zod.def,{get shape(){let o={...e._zod.def.shape};for(let a in t){if(!(a in n.shape))throw Error(`Unrecognized key: "${a}"`);if(!t[a])continue;delete o[a]}return Ji(this,"shape",o),o},checks:[]});return Gn(e,s)}function tx(e,t){if(!Ki(t))throw Error("Invalid input to extend: expected a plain object");let n=e._zod.def.checks;if(n&&n.length>0){let s=e._zod.def.shape;for(let o in t)if(Object.getOwnPropertyDescriptor(s,o)!==void 0)throw Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.")}let r=bi(e._zod.def,{get shape(){let s={...e._zod.def.shape,...t};return Ji(this,"shape",s),s}});return Gn(e,r)}function nx(e,t){if(!Ki(t))throw Error("Invalid input to safeExtend: expected a plain object");let n=bi(e._zod.def,{get shape(){let i={...e._zod.def.shape,...t};return Ji(this,"shape",i),i}});return Gn(e,n)}function ix(e,t){if(e._zod.def.checks?.length)throw Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");let n=bi(e._zod.def,{get shape(){let i={...e._zod.def.shape,...t._zod.def.shape};return Ji(this,"shape",i),i},get catchall(){return t._zod.def.catchall},checks:t._zod.def.checks??[]});return Gn(e,n)}function rx(e,t,n){let r=t._zod.def.checks;if(r&&r.length>0)throw Error(".partial() cannot be used on object schemas containing refinements");let o=bi(t._zod.def,{get shape(){let a=t._zod.def.shape,c={...a};if(n)for(let l in n){if(!(l in a))throw Error(`Unrecognized key: "${l}"`);if(!n[l])continue;c[l]=e?new e({type:"optional",innerType:a[l]}):a[l]}else for(let l in a)c[l]=e?new e({type:"optional",innerType:a[l]}):a[l];return Ji(this,"shape",c),c},checks:[]});return Gn(t,o)}function sx(e,t,n){let i=bi(t._zod.def,{get shape(){let r=t._zod.def.shape,s={...r};if(n)for(let o in n){if(!(o in s))throw Error(`Unrecognized key: "${o}"`);if(!n[o])continue;s[o]=new e({type:"nonoptional",innerType:r[o]})}else for(let o in r)s[o]=new e({type:"nonoptional",innerType:r[o]});return Ji(this,"shape",s),s}});return Gn(t,i)}function Qi(e,t=0){if(e.aborted===!0)return!0;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue!==!0)return!0;return!1}function Nh(e,t=0){if(e.aborted===!0)return!0;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue===!1)return!0;return!1}function Mi(e,t){return t.map((n)=>{var i;return(i=n).path??(i.path=[]),n.path.unshift(e),n})}function vo(e){return typeof e==="string"?e:e?.message}function En(e,t,n){let i=e.message?e.message:vo(e.inst?._zod.def?.error?.(e))??vo(t?.error?.(e))??vo(n.customError?.(e))??vo(n.localeError?.(e))??"Invalid input",{inst:r,continue:s,input:o,...a}=e;if(a.path??(a.path=[]),a.message=i,t?.reportInput)a.input=o;return a}function wo(e){if(Array.isArray(e))return"array";if(typeof e==="string")return"string";return"unknown"}function er(...e){let[t,n,i]=e;if(typeof t==="string")return{message:t,code:"custom",input:n,inst:i};return{...t}}var Dh=(e,t)=>{e.name="$ZodError",Object.defineProperty(e,"_zod",{value:e._zod,enumerable:!1}),Object.defineProperty(e,"issues",{value:t,enumerable:!1}),e.message=JSON.stringify(t,ms,2),Object.defineProperty(e,"toString",{value:()=>e.message,enumerable:!1})},To=q("$ZodError",Dh),cc=q("$ZodError",Dh,{Parent:Error});function Uh(e,t=(n)=>n.message){let n={},i=[];for(let r of e.issues)if(r.path.length>0)n[r.path[0]]=n[r.path[0]]||[],n[r.path[0]].push(t(r));else i.push(t(r));return{formErrors:i,fieldErrors:n}}function Oh(e,t=(n)=>n.message){let n={_errors:[]},i=(r,s=[])=>{for(let o of r.issues)if(o.code==="invalid_union"&&o.errors.length)o.errors.map((a)=>i({issues:a},[...s,...o.path]));else if(o.code==="invalid_key")i({issues:o.issues},[...s,...o.path]);else if(o.code==="invalid_element")i({issues:o.issues},[...s,...o.path]);else{let a=[...s,...o.path];if(a.length===0)n._errors.push(t(o));else{let c=n,l=0;while(l<a.length){let u=a[l];if(l!==a.length-1)c[u]=c[u]||{_errors:[]};else c[u]=c[u]||{_errors:[]},c[u]._errors.push(t(o));c=c[u],l++}}}};return i(e),n}var Eo=(e)=>(t,n,i,r)=>{let s=i?{...i,async:!1}:{async:!1},o=t._zod.run({value:n,issues:[]},s);if(o instanceof Promise)throw new ii;if(o.issues.length){let a=new(r?.Err??e)(o.issues.map((c)=>En(c,s,Tn())));throw oc(a,r?.callee),a}return o.value};var Ao=(e)=>async(t,n,i,r)=>{let s=i?{...i,async:!0}:{async:!0},o=t._zod.run({value:n,issues:[]},s);if(o instanceof Promise)o=await o;if(o.issues.length){let a=new(r?.Err??e)(o.issues.map((c)=>En(c,s,Tn())));throw oc(a,r?.callee),a}return o.value};var gs=(e)=>(t,n,i)=>{let r=i?{...i,async:!1}:{async:!1},s=t._zod.run({value:n,issues:[]},r);if(s instanceof Promise)throw new ii;return s.issues.length?{success:!1,error:new(e??To)(s.issues.map((o)=>En(o,r,Tn())))}:{success:!0,data:s.value}},Fh=gs(cc),_s=(e)=>async(t,n,i)=>{let r=i?{...i,async:!0}:{async:!0},s=t._zod.run({value:n,issues:[]},r);if(s instanceof Promise)s=await s;return s.issues.length?{success:!1,error:new e(s.issues.map((o)=>En(o,r,Tn())))}:{success:!0,data:s.value}},zh=_s(cc),kh=(e)=>(t,n,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return Eo(e)(t,n,r)};var Bh=(e)=>(t,n,i)=>Eo(e)(t,n,i);var Gh=(e)=>async(t,n,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return Ao(e)(t,n,r)};var Hh=(e)=>async(t,n,i)=>Ao(e)(t,n,i);var Vh=(e)=>(t,n,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return gs(e)(t,n,r)};var Wh=(e)=>(t,n,i)=>gs(e)(t,n,i);var $h=(e)=>async(t,n,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return _s(e)(t,n,r)};var Zh=(e)=>async(t,n,i)=>_s(e)(t,n,i);var Xh=/^[cC][0-9a-z]{6,}$/,qh=/^[0-9a-z]+$/,Yh=/^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,jh=/^[0-9a-vA-V]{20}$/,Jh=/^[A-Za-z0-9]{27}$/,Kh=/^[a-zA-Z0-9_-]{21}$/,Qh=/^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;var ef=/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,lc=(e)=>{if(!e)return/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`)};var tf=/^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;var ax="^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";function nf(){return new RegExp(ax,"u")}var rf=/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,sf=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;var of=/^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,af=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,cf=/^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,uc=/^[A-Za-z0-9_-]*$/;var lf=/^https?$/,uf=/^\+[1-9]\d{6,14}$/,hf="(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))",ff=new RegExp(`^${hf}$`);function df(e){return typeof e.precision==="number"?e.precision===-1?"(?:[01]\\d|2[0-3]):[0-5]\\d":e.precision===0?"(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d":`(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d\\.\\d{${e.precision}}`:"(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?"}function pf(e){return new RegExp(`^${df(e)}$`)}function mf(e){let t=df({precision:e.precision}),n=["Z"];if(e.local)n.push("");if(e.offset)n.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");let i=`${t}(?:${n.join("|")})`;return new RegExp(`^${hf}T(?:${i})$`)}var gf=(e)=>{let t=e?`[\\s\\S]{${e?.minimum??0},${e?.maximum??""}}`:"[\\s\\S]*";return new RegExp(`^${t}$`)};var _f=/^-?\d+$/,hc=/^-?\d+(?:\.\d+)?$/,xf=/^(?:true|false)$/i;var vf=/^[^A-Z]*$/,yf=/^[^a-z]*$/;var Vt=q("$ZodCheck",(e,t)=>{var n;e._zod??(e._zod={}),e._zod.def=t,(n=e._zod).onattach??(n.onattach=[])}),bf={number:"number",bigint:"bigint",object:"date"},fc=q("$ZodCheckLessThan",(e,t)=>{Vt.init(e,t);let n=bf[typeof t.value];e._zod.onattach.push((i)=>{let r=i._zod.bag,s=(t.inclusive?r.maximum:r.exclusiveMaximum)??Number.POSITIVE_INFINITY;if(t.value<s)if(t.inclusive)r.maximum=t.value;else r.exclusiveMaximum=t.value}),e._zod.check=(i)=>{if(t.inclusive?i.value<=t.value:i.value<t.value)return;i.issues.push({origin:n,code:"too_big",maximum:typeof t.value==="object"?t.value.getTime():t.value,input:i.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),dc=q("$ZodCheckGreaterThan",(e,t)=>{Vt.init(e,t);let n=bf[typeof t.value];e._zod.onattach.push((i)=>{let r=i._zod.bag,s=(t.inclusive?r.minimum:r.exclusiveMinimum)??Number.NEGATIVE_INFINITY;if(t.value>s)if(t.inclusive)r.minimum=t.value;else r.exclusiveMinimum=t.value}),e._zod.check=(i)=>{if(t.inclusive?i.value>=t.value:i.value>t.value)return;i.issues.push({origin:n,code:"too_small",minimum:typeof t.value==="object"?t.value.getTime():t.value,input:i.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),Sf=q("$ZodCheckMultipleOf",(e,t)=>{Vt.init(e,t),e._zod.onattach.push((n)=>{var i;(i=n._zod.bag).multipleOf??(i.multipleOf=t.value)}),e._zod.check=(n)=>{if(typeof n.value!==typeof t.value)throw Error("Cannot mix number and bigint in multiple_of check.");if(typeof n.value==="bigint"?n.value%t.value===BigInt(0):Ah(n.value,t.value)===0)return;n.issues.push({origin:typeof n.value,code:"not_multiple_of",divisor:t.value,input:n.value,inst:e,continue:!t.abort})}}),Mf=q("$ZodCheckNumberFormat",(e,t)=>{Vt.init(e,t),t.format=t.format||"float64";let n=t.format?.includes("int"),i=n?"int":"number",[r,s]=Lh[t.format];e._zod.onattach.push((o)=>{let a=o._zod.bag;if(a.format=t.format,a.minimum=r,a.maximum=s,n)a.pattern=_f}),e._zod.check=(o)=>{let a=o.value;if(n){if(!Number.isInteger(a)){o.issues.push({expected:i,format:t.format,code:"invalid_type",continue:!1,input:a,inst:e});return}if(!Number.isSafeInteger(a)){if(a>0)o.issues.push({input:a,code:"too_big",maximum:Number.MAX_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:i,inclusive:!0,continue:!t.abort});else o.issues.push({input:a,code:"too_small",minimum:Number.MIN_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:i,inclusive:!0,continue:!t.abort});return}}if(a<r)o.issues.push({origin:"number",input:a,code:"too_small",minimum:r,inclusive:!0,inst:e,continue:!t.abort});if(a>s)o.issues.push({origin:"number",input:a,code:"too_big",maximum:s,inclusive:!0,inst:e,continue:!t.abort})}});var wf=q("$ZodCheckMaxLength",(e,t)=>{var n;Vt.init(e,t),(n=e._zod.def).when??(n.when=(i)=>{let r=i.value;return!So(r)&&r.length!==void 0}),e._zod.onattach.push((i)=>{let r=i._zod.bag.maximum??Number.POSITIVE_INFINITY;if(t.maximum<r)i._zod.bag.maximum=t.maximum}),e._zod.check=(i)=>{let r=i.value;if(r.length<=t.maximum)return;let o=wo(r);i.issues.push({origin:o,code:"too_big",maximum:t.maximum,inclusive:!0,input:r,inst:e,continue:!t.abort})}}),Tf=q("$ZodCheckMinLength",(e,t)=>{var n;Vt.init(e,t),(n=e._zod.def).when??(n.when=(i)=>{let r=i.value;return!So(r)&&r.length!==void 0}),e._zod.onattach.push((i)=>{let r=i._zod.bag.minimum??Number.NEGATIVE_INFINITY;if(t.minimum>r)i._zod.bag.minimum=t.minimum}),e._zod.check=(i)=>{let r=i.value;if(r.length>=t.minimum)return;let o=wo(r);i.issues.push({origin:o,code:"too_small",minimum:t.minimum,inclusive:!0,input:r,inst:e,continue:!t.abort})}}),Ef=q("$ZodCheckLengthEquals",(e,t)=>{var n;Vt.init(e,t),(n=e._zod.def).when??(n.when=(i)=>{let r=i.value;return!So(r)&&r.length!==void 0}),e._zod.onattach.push((i)=>{let r=i._zod.bag;r.minimum=t.length,r.maximum=t.length,r.length=t.length}),e._zod.check=(i)=>{let r=i.value,s=r.length;if(s===t.length)return;let o=wo(r),a=s>t.length;i.issues.push({origin:o,...a?{code:"too_big",maximum:t.length}:{code:"too_small",minimum:t.length},inclusive:!0,exact:!0,input:i.value,inst:e,continue:!t.abort})}}),xs=q("$ZodCheckStringFormat",(e,t)=>{var n,i;if(Vt.init(e,t),e._zod.onattach.push((r)=>{let s=r._zod.bag;if(s.format=t.format,t.pattern)s.patterns??(s.patterns=new Set),s.patterns.add(t.pattern)}),t.pattern)(n=e._zod).check??(n.check=(r)=>{if(t.pattern.lastIndex=0,t.pattern.test(r.value))return;r.issues.push({origin:"string",code:"invalid_format",format:t.format,input:r.value,...t.pattern?{pattern:t.pattern.toString()}:{},inst:e,continue:!t.abort})});else(i=e._zod).check??(i.check=()=>{})}),Af=q("$ZodCheckRegex",(e,t)=>{xs.init(e,t),e._zod.check=(n)=>{if(t.pattern.lastIndex=0,t.pattern.test(n.value))return;n.issues.push({origin:"string",code:"invalid_format",format:"regex",input:n.value,pattern:t.pattern.toString(),inst:e,continue:!t.abort})}}),Rf=q("$ZodCheckLowerCase",(e,t)=>{t.pattern??(t.pattern=vf),xs.init(e,t)}),Cf=q("$ZodCheckUpperCase",(e,t)=>{t.pattern??(t.pattern=yf),xs.init(e,t)}),If=q("$ZodCheckIncludes",(e,t)=>{Vt.init(e,t);let n=Si(t.includes),i=new RegExp(typeof t.position==="number"?`^.{${t.position}}${n}`:n);t.pattern=i,e._zod.onattach.push((r)=>{let s=r._zod.bag;s.patterns??(s.patterns=new Set),s.patterns.add(i)}),e._zod.check=(r)=>{if(r.value.includes(t.includes,t.position))return;r.issues.push({origin:"string",code:"invalid_format",format:"includes",includes:t.includes,input:r.value,inst:e,continue:!t.abort})}}),Pf=q("$ZodCheckStartsWith",(e,t)=>{Vt.init(e,t);let n=new RegExp(`^${Si(t.prefix)}.*`);t.pattern??(t.pattern=n),e._zod.onattach.push((i)=>{let r=i._zod.bag;r.patterns??(r.patterns=new Set),r.patterns.add(n)}),e._zod.check=(i)=>{if(i.value.startsWith(t.prefix))return;i.issues.push({origin:"string",code:"invalid_format",format:"starts_with",prefix:t.prefix,input:i.value,inst:e,continue:!t.abort})}}),Lf=q("$ZodCheckEndsWith",(e,t)=>{Vt.init(e,t);let n=new RegExp(`.*${Si(t.suffix)}$`);t.pattern??(t.pattern=n),e._zod.onattach.push((i)=>{let r=i._zod.bag;r.patterns??(r.patterns=new Set),r.patterns.add(n)}),e._zod.check=(i)=>{if(i.value.endsWith(t.suffix))return;i.issues.push({origin:"string",code:"invalid_format",format:"ends_with",suffix:t.suffix,input:i.value,inst:e,continue:!t.abort})}});var Nf=q("$ZodCheckOverwrite",(e,t)=>{Vt.init(e,t),e._zod.check=(n)=>{n.value=t.tx(n.value)}});class pc{constructor(e=[]){if(this.content=[],this.indent=0,this)this.args=e}indented(e){this.indent+=1,e(this),this.indent-=1}write(e){if(typeof e==="function"){e(this,{execution:"sync"}),e(this,{execution:"async"});return}let n=e.split(`
`).filter((s)=>s),i=Math.min(...n.map((s)=>s.length-s.trimStart().length)),r=n.map((s)=>s.slice(i)).map((s)=>" ".repeat(this.indent*2)+s);for(let s of r)this.content.push(s)}compile(){let e=Function,t=this?.args,i=[...(this?.content??[""]).map((r)=>`  ${r}`)];return new e(...t,i.join(`
`))}}var Uf={major:4,minor:4,patch:3};var xt=q("$ZodType",(e,t)=>{var n;e??(e={}),e._zod.def=t,e._zod.bag=e._zod.bag||{},e._zod.version=Uf;let i=[...e._zod.def.checks??[]];if(e._zod.traits.has("$ZodCheck"))i.unshift(e);for(let r of i)for(let s of r._zod.onattach)s(e);if(i.length===0)(n=e._zod).deferred??(n.deferred=[]),e._zod.deferred?.push(()=>{e._zod.run=e._zod.parse});else{let r=(o,a,c)=>{let l=Qi(o),u;for(let f of a){if(f._zod.def.when){if(Nh(o))continue;if(!f._zod.def.when(o))continue}else if(l)continue;let h=o.issues.length,d=f._zod.check(o);if(d instanceof Promise&&c?.async===!1)throw new ii;if(u||d instanceof Promise)u=(u??Promise.resolve()).then(async()=>{if(await d,o.issues.length===h)return;if(!l)l=Qi(o,h)});else{if(o.issues.length===h)continue;if(!l)l=Qi(o,h)}}if(u)return u.then(()=>o);return o},s=(o,a,c)=>{if(Qi(o))return o.aborted=!0,o;let l=r(a,i,c);if(l instanceof Promise){if(c.async===!1)throw new ii;return l.then((u)=>e._zod.parse(u,c))}return e._zod.parse(l,c)};e._zod.run=(o,a)=>{if(a.skipChecks)return e._zod.parse(o,a);if(a.direction==="backward"){let l=e._zod.parse({value:o.value,issues:[]},{...a,skipChecks:!0});if(l instanceof Promise)return l.then((u)=>s(u,o,a));return s(l,o,a)}let c=e._zod.parse(o,a);if(c instanceof Promise){if(a.async===!1)throw new ii;return c.then((l)=>r(l,i,a))}return r(c,i,a)}}it(e,"~standard",()=>({validate:(r)=>{try{let s=Fh(e,r);return s.success?{value:s.data}:{issues:s.error?.issues}}catch(s){return zh(e,r).then((o)=>o.success?{value:o.data}:{issues:o.error?.issues})}},vendor:"zod",version:1}))}),Po=q("$ZodString",(e,t)=>{xt.init(e,t),e._zod.pattern=[...e?._zod.bag?.patterns??[]].pop()??gf(e._zod.bag),e._zod.parse=(n,i)=>{if(t.coerce)try{n.value=String(n.value)}catch(r){}if(typeof n.value==="string")return n;return n.issues.push({expected:"string",code:"invalid_type",input:n.value,inst:e}),n}}),_t=q("$ZodStringFormat",(e,t)=>{xs.init(e,t),Po.init(e,t)}),Wf=q("$ZodGUID",(e,t)=>{t.pattern??(t.pattern=ef),_t.init(e,t)}),$f=q("$ZodUUID",(e,t)=>{if(t.version){let i={v1:1,v2:2,v3:3,v4:4,v5:5,v6:6,v7:7,v8:8}[t.version];if(i===void 0)throw Error(`Invalid UUID version: "${t.version}"`);t.pattern??(t.pattern=lc(i))}else t.pattern??(t.pattern=lc());_t.init(e,t)}),Zf=q("$ZodEmail",(e,t)=>{t.pattern??(t.pattern=tf),_t.init(e,t)}),Xf=q("$ZodURL",(e,t)=>{_t.init(e,t),e._zod.check=(n)=>{try{let i=n.value.trim();if(!t.normalize&&t.protocol?.source===lf.source){if(!/^https?:\/\//i.test(i)){n.issues.push({code:"invalid_format",format:"url",note:"Invalid URL format",input:n.value,inst:e,continue:!t.abort});return}}let r=new URL(i);if(t.hostname){if(t.hostname.lastIndex=0,!t.hostname.test(r.hostname))n.issues.push({code:"invalid_format",format:"url",note:"Invalid hostname",pattern:t.hostname.source,input:n.value,inst:e,continue:!t.abort})}if(t.protocol){if(t.protocol.lastIndex=0,!t.protocol.test(r.protocol.endsWith(":")?r.protocol.slice(0,-1):r.protocol))n.issues.push({code:"invalid_format",format:"url",note:"Invalid protocol",pattern:t.protocol.source,input:n.value,inst:e,continue:!t.abort})}if(t.normalize)n.value=r.href;else n.value=i;return}catch(i){n.issues.push({code:"invalid_format",format:"url",input:n.value,inst:e,continue:!t.abort})}}}),qf=q("$ZodEmoji",(e,t)=>{t.pattern??(t.pattern=nf()),_t.init(e,t)}),Yf=q("$ZodNanoID",(e,t)=>{t.pattern??(t.pattern=Kh),_t.init(e,t)}),jf=q("$ZodCUID",(e,t)=>{t.pattern??(t.pattern=Xh),_t.init(e,t)}),Jf=q("$ZodCUID2",(e,t)=>{t.pattern??(t.pattern=qh),_t.init(e,t)}),Kf=q("$ZodULID",(e,t)=>{t.pattern??(t.pattern=Yh),_t.init(e,t)}),Qf=q("$ZodXID",(e,t)=>{t.pattern??(t.pattern=jh),_t.init(e,t)}),ed=q("$ZodKSUID",(e,t)=>{t.pattern??(t.pattern=Jh),_t.init(e,t)}),td=q("$ZodISODateTime",(e,t)=>{t.pattern??(t.pattern=mf(t)),_t.init(e,t)}),nd=q("$ZodISODate",(e,t)=>{t.pattern??(t.pattern=ff),_t.init(e,t)}),id=q("$ZodISOTime",(e,t)=>{t.pattern??(t.pattern=pf(t)),_t.init(e,t)}),rd=q("$ZodISODuration",(e,t)=>{t.pattern??(t.pattern=Qh),_t.init(e,t)}),sd=q("$ZodIPv4",(e,t)=>{t.pattern??(t.pattern=rf),_t.init(e,t),e._zod.bag.format="ipv4"}),od=q("$ZodIPv6",(e,t)=>{t.pattern??(t.pattern=sf),_t.init(e,t),e._zod.bag.format="ipv6",e._zod.check=(n)=>{try{new URL(`http://[${n.value}]`)}catch{n.issues.push({code:"invalid_format",format:"ipv6",input:n.value,inst:e,continue:!t.abort})}}});var ad=q("$ZodCIDRv4",(e,t)=>{t.pattern??(t.pattern=of),_t.init(e,t)}),cd=q("$ZodCIDRv6",(e,t)=>{t.pattern??(t.pattern=af),_t.init(e,t),e._zod.check=(n)=>{let i=n.value.split("/");try{if(i.length!==2)throw Error();let[r,s]=i;if(!s)throw Error();let o=Number(s);if(`${o}`!==s)throw Error();if(o<0||o>128)throw Error();new URL(`http://[${r}]`)}catch{n.issues.push({code:"invalid_format",format:"cidrv6",input:n.value,inst:e,continue:!t.abort})}}});function ld(e){if(e==="")return!0;if(/\s/.test(e))return!1;if(e.length%4!==0)return!1;try{return atob(e),!0}catch{return!1}}var ud=q("$ZodBase64",(e,t)=>{t.pattern??(t.pattern=cf),_t.init(e,t),e._zod.bag.contentEncoding="base64",e._zod.check=(n)=>{if(ld(n.value))return;n.issues.push({code:"invalid_format",format:"base64",input:n.value,inst:e,continue:!t.abort})}});function cx(e){if(!uc.test(e))return!1;let t=e.replace(/[-_]/g,(i)=>i==="-"?"+":"/"),n=t.padEnd(Math.ceil(t.length/4)*4,"=");return ld(n)}var hd=q("$ZodBase64URL",(e,t)=>{t.pattern??(t.pattern=uc),_t.init(e,t),e._zod.bag.contentEncoding="base64url",e._zod.check=(n)=>{if(cx(n.value))return;n.issues.push({code:"invalid_format",format:"base64url",input:n.value,inst:e,continue:!t.abort})}}),fd=q("$ZodE164",(e,t)=>{t.pattern??(t.pattern=uf),_t.init(e,t)});function lx(e,t=null){try{let n=e.split(".");if(n.length!==3)return!1;let[i]=n;if(!i)return!1;let r=JSON.parse(atob(i));if("typ"in r&&r?.typ!=="JWT")return!1;if(!r.alg)return!1;if(t&&(!("alg"in r)||r.alg!==t))return!1;return!0}catch{return!1}}var dd=q("$ZodJWT",(e,t)=>{_t.init(e,t),e._zod.check=(n)=>{if(lx(n.value,t.alg))return;n.issues.push({code:"invalid_format",format:"jwt",input:n.value,inst:e,continue:!t.abort})}});var gc=q("$ZodNumber",(e,t)=>{xt.init(e,t),e._zod.pattern=e._zod.bag.pattern??hc,e._zod.parse=(n,i)=>{if(t.coerce)try{n.value=Number(n.value)}catch(o){}let r=n.value;if(typeof r==="number"&&!Number.isNaN(r)&&Number.isFinite(r))return n;let s=typeof r==="number"?Number.isNaN(r)?"NaN":!Number.isFinite(r)?"Infinity":void 0:void 0;return n.issues.push({expected:"number",code:"invalid_type",input:r,inst:e,...s?{received:s}:{}}),n}}),pd=q("$ZodNumberFormat",(e,t)=>{Mf.init(e,t),gc.init(e,t)}),md=q("$ZodBoolean",(e,t)=>{xt.init(e,t),e._zod.pattern=xf,e._zod.parse=(n,i)=>{if(t.coerce)try{n.value=Boolean(n.value)}catch(s){}let r=n.value;if(typeof r==="boolean")return n;return n.issues.push({expected:"boolean",code:"invalid_type",input:r,inst:e}),n}});var gd=q("$ZodUnknown",(e,t)=>{xt.init(e,t),e._zod.parse=(n)=>n}),_d=q("$ZodNever",(e,t)=>{xt.init(e,t),e._zod.parse=(n,i)=>(n.issues.push({expected:"never",code:"invalid_type",input:n.value,inst:e}),n)});function Of(e,t,n){if(e.issues.length)t.issues.push(...Mi(n,e.issues));t.value[n]=e.value}var xd=q("$ZodArray",(e,t)=>{xt.init(e,t),e._zod.parse=(n,i)=>{let r=n.value;if(!Array.isArray(r))return n.issues.push({expected:"array",code:"invalid_type",input:r,inst:e}),n;n.value=Array(r.length);let s=[];for(let o=0;o<r.length;o++){let a=r[o],c=t.element._zod.run({value:a,issues:[]},i);if(c instanceof Promise)s.push(c.then((l)=>Of(l,n,o)));else Of(c,n,o)}if(s.length)return Promise.all(s).then(()=>n);return n}});function Io(e,t,n,i,r,s){let o=n in i;if(e.issues.length){if(r&&s&&!o)return;t.issues.push(...Mi(n,e.issues))}if(!o&&!r){if(!e.issues.length)t.issues.push({code:"invalid_type",expected:"nonoptional",input:void 0,path:[n]});return}if(e.value===void 0){if(o)t.value[n]=void 0}else t.value[n]=e.value}function vd(e){let t=Object.keys(e.shape);for(let i of t)if(!e.shape?.[i]?._zod?.traits?.has("$ZodType"))throw Error(`Invalid element at key "${i}": expected a Zod schema`);let n=Ph(e.shape);return{...e,keys:t,keySet:new Set(t),numKeys:t.length,optionalKeys:new Set(n)}}function yd(e,t,n,i,r,s){let o=[],a=r.keySet,c=r.catchall._zod,l=c.def.type,u=c.optin==="optional",f=c.optout==="optional";for(let h in t){if(h==="__proto__")continue;if(a.has(h))continue;if(l==="never"){o.push(h);continue}let d=c.run({value:t[h],issues:[]},i);if(d instanceof Promise)e.push(d.then((g)=>Io(g,n,h,t,u,f)));else Io(d,n,h,t,u,f)}if(o.length)n.issues.push({code:"unrecognized_keys",keys:o,input:t,inst:s});if(!e.length)return n;return Promise.all(e).then(()=>n)}var ux=q("$ZodObject",(e,t)=>{if(xt.init(e,t),!Object.getOwnPropertyDescriptor(t,"shape")?.get){let a=t.shape;Object.defineProperty(t,"shape",{get:()=>{let c={...a};return Object.defineProperty(t,"shape",{value:c}),c}})}let i=bo(()=>vd(t));it(e._zod,"propValues",()=>{let a=t.shape,c={};for(let l in a){let u=a[l]._zod;if(u.values){c[l]??(c[l]=new Set);for(let f of u.values)c[l].add(f)}}return c});let r=ps,s=t.catchall,o;e._zod.parse=(a,c)=>{o??(o=i.value);let l=a.value;if(!r(l))return a.issues.push({expected:"object",code:"invalid_type",input:l,inst:e}),a;a.value={};let u=[],f=o.shape;for(let h of o.keys){let d=f[h],g=d._zod.optin==="optional",y=d._zod.optout==="optional",p=d._zod.run({value:l[h],issues:[]},c);if(p instanceof Promise)u.push(p.then((m)=>Io(m,a,h,l,g,y)));else Io(p,a,h,l,g,y)}if(!s)return u.length?Promise.all(u).then(()=>a):a;return yd(u,l,a,c,i.value,e)}}),bd=q("$ZodObjectJIT",(e,t)=>{ux.init(e,t);let n=e._zod.parse,i=bo(()=>vd(t)),r=(h)=>{let d=new pc(["shape","payload","ctx"]),g=i.value,y=(T)=>{let v=sc(T);return`shape[${v}]._zod.run({ value: input[${v}], issues: [] }, ctx)`};d.write("const input = payload.value;");let p=Object.create(null),m=0;for(let T of g.keys)p[T]=`key_${m++}`;d.write("const newResult = {};");for(let T of g.keys){let v=p[T],w=sc(T),E=h[T],R=E?._zod?.optin==="optional",_=E?._zod?.optout==="optional";if(d.write(`const ${v} = ${y(T)};`),R&&_)d.write(`
        if (${v}.issues.length) {
          if (${w} in input) {
            payload.issues = payload.issues.concat(${v}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${w}, ...iss.path] : [${w}]
            })));
          }
        }
        
        if (${v}.value === undefined) {
          if (${w} in input) {
            newResult[${w}] = undefined;
          }
        } else {
          newResult[${w}] = ${v}.value;
        }
        
      `);else if(!R)d.write(`
        const ${v}_present = ${w} in input;
        if (${v}.issues.length) {
          payload.issues = payload.issues.concat(${v}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${w}, ...iss.path] : [${w}]
          })));
        }
        if (!${v}_present && !${v}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${w}]
          });
        }

        if (${v}_present) {
          if (${v}.value === undefined) {
            newResult[${w}] = undefined;
          } else {
            newResult[${w}] = ${v}.value;
          }
        }

      `);else d.write(`
        if (${v}.issues.length) {
          payload.issues = payload.issues.concat(${v}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${w}, ...iss.path] : [${w}]
          })));
        }
        
        if (${v}.value === undefined) {
          if (${w} in input) {
            newResult[${w}] = undefined;
          }
        } else {
          newResult[${w}] = ${v}.value;
        }
        
      `)}d.write("payload.value = newResult;"),d.write("return payload;");let A=d.compile();return(T,v)=>A(h,T,v)},s,o=ps,a=!Er.jitless,l=a&&Ch.value,u=t.catchall,f;e._zod.parse=(h,d)=>{f??(f=i.value);let g=h.value;if(!o(g))return h.issues.push({expected:"object",code:"invalid_type",input:g,inst:e}),h;if(a&&l&&d?.async===!1&&d.jitless!==!0){if(!s)s=r(t.shape);if(h=s(h,d),!u)return h;return yd([],g,h,d,f,e)}return n(h,d)}});function Ff(e,t,n,i){for(let s of e)if(s.issues.length===0)return t.value=s.value,t;let r=e.filter((s)=>!Qi(s));if(r.length===1)return t.value=r[0].value,r[0];return t.issues.push({code:"invalid_union",input:t.value,inst:n,errors:e.map((s)=>s.issues.map((o)=>En(o,i,Tn())))}),t}var Sd=q("$ZodUnion",(e,t)=>{xt.init(e,t),it(e._zod,"optin",()=>t.options.some((i)=>i._zod.optin==="optional")?"optional":void 0),it(e._zod,"optout",()=>t.options.some((i)=>i._zod.optout==="optional")?"optional":void 0),it(e._zod,"values",()=>{if(t.options.every((i)=>i._zod.values))return new Set(t.options.flatMap((i)=>Array.from(i._zod.values)));return}),it(e._zod,"pattern",()=>{if(t.options.every((i)=>i._zod.pattern)){let i=t.options.map((r)=>r._zod.pattern);return new RegExp(`^(${i.map((r)=>Mo(r.source)).join("|")})$`)}return});let n=t.options.length===1?t.options[0]._zod.run:null;e._zod.parse=(i,r)=>{if(n)return n(i,r);let s=!1,o=[];for(let a of t.options){let c=a._zod.run({value:i.value,issues:[]},r);if(c instanceof Promise)o.push(c),s=!0;else{if(c.issues.length===0)return c;o.push(c)}}if(!s)return Ff(o,i,e,r);return Promise.all(o).then((a)=>Ff(a,i,e,r))}});var Md=q("$ZodIntersection",(e,t)=>{xt.init(e,t),e._zod.parse=(n,i)=>{let r=n.value,s=t.left._zod.run({value:r,issues:[]},i),o=t.right._zod.run({value:r,issues:[]},i);if(s instanceof Promise||o instanceof Promise)return Promise.all([s,o]).then(([c,l])=>zf(n,c,l));return zf(n,s,o)}});function mc(e,t){if(e===t)return{valid:!0,data:e};if(e instanceof Date&&t instanceof Date&&+e===+t)return{valid:!0,data:e};if(Ki(e)&&Ki(t)){let n=Object.keys(t),i=Object.keys(e).filter((s)=>n.indexOf(s)!==-1),r={...e,...t};for(let s of i){let o=mc(e[s],t[s]);if(!o.valid)return{valid:!1,mergeErrorPath:[s,...o.mergeErrorPath]};r[s]=o.data}return{valid:!0,data:r}}if(Array.isArray(e)&&Array.isArray(t)){if(e.length!==t.length)return{valid:!1,mergeErrorPath:[]};let n=[];for(let i=0;i<e.length;i++){let r=e[i],s=t[i],o=mc(r,s);if(!o.valid)return{valid:!1,mergeErrorPath:[i,...o.mergeErrorPath]};n.push(o.data)}return{valid:!0,data:n}}return{valid:!1,mergeErrorPath:[]}}function zf(e,t,n){let i=new Map,r;for(let a of t.issues)if(a.code==="unrecognized_keys"){r??(r=a);for(let c of a.keys){if(!i.has(c))i.set(c,{});i.get(c).l=!0}}else e.issues.push(a);for(let a of n.issues)if(a.code==="unrecognized_keys")for(let c of a.keys){if(!i.has(c))i.set(c,{});i.get(c).r=!0}else e.issues.push(a);let s=[...i].filter(([,a])=>a.l&&a.r).map(([a])=>a);if(s.length&&r)e.issues.push({...r,keys:s});if(Qi(e))return e;let o=mc(t.value,n.value);if(!o.valid)throw Error(`Unmergable intersection. Error path: ${JSON.stringify(o.mergeErrorPath)}`);return e.value=o.data,e}var wd=q("$ZodRecord",(e,t)=>{xt.init(e,t),e._zod.parse=(n,i)=>{let r=n.value;if(!Ki(r))return n.issues.push({expected:"record",code:"invalid_type",input:r,inst:e}),n;let s=[],o=t.keyType._zod.values;if(o){n.value={};let a=new Set;for(let l of o)if(typeof l==="string"||typeof l==="number"||typeof l==="symbol"){a.add(typeof l==="number"?l.toString():l);let u=t.keyType._zod.run({value:l,issues:[]},i);if(u instanceof Promise)throw Error("Async schemas not supported in object keys currently");if(u.issues.length){n.issues.push({code:"invalid_key",origin:"record",issues:u.issues.map((d)=>En(d,i,Tn())),input:l,path:[l],inst:e});continue}let f=u.value,h=t.valueType._zod.run({value:r[l],issues:[]},i);if(h instanceof Promise)s.push(h.then((d)=>{if(d.issues.length)n.issues.push(...Mi(l,d.issues));n.value[f]=d.value}));else{if(h.issues.length)n.issues.push(...Mi(l,h.issues));n.value[f]=h.value}}let c;for(let l in r)if(!a.has(l))c=c??[],c.push(l);if(c&&c.length>0)n.issues.push({code:"unrecognized_keys",input:r,inst:e,keys:c})}else{n.value={};for(let a of Reflect.ownKeys(r)){if(a==="__proto__")continue;if(!Object.prototype.propertyIsEnumerable.call(r,a))continue;let c=t.keyType._zod.run({value:a,issues:[]},i);if(c instanceof Promise)throw Error("Async schemas not supported in object keys currently");if(typeof a==="string"&&hc.test(a)&&c.issues.length){let f=t.keyType._zod.run({value:Number(a),issues:[]},i);if(f instanceof Promise)throw Error("Async schemas not supported in object keys currently");if(f.issues.length===0)c=f}if(c.issues.length){if(t.mode==="loose")n.value[a]=r[a];else n.issues.push({code:"invalid_key",origin:"record",issues:c.issues.map((f)=>En(f,i,Tn())),input:a,path:[a],inst:e});continue}let u=t.valueType._zod.run({value:r[a],issues:[]},i);if(u instanceof Promise)s.push(u.then((f)=>{if(f.issues.length)n.issues.push(...Mi(a,f.issues));n.value[c.value]=f.value}));else{if(u.issues.length)n.issues.push(...Mi(a,u.issues));n.value[c.value]=u.value}}}if(s.length)return Promise.all(s).then(()=>n);return n}});var Td=q("$ZodEnum",(e,t)=>{xt.init(e,t);let n=yo(t.entries),i=new Set(n);e._zod.values=i,e._zod.pattern=new RegExp(`^(${n.filter((r)=>Ih.has(typeof r)).map((r)=>typeof r==="string"?Si(r):r.toString()).join("|")})$`),e._zod.parse=(r,s)=>{let o=r.value;if(i.has(o))return r;return r.issues.push({code:"invalid_value",values:n,input:o,inst:e}),r}}),Ed=q("$ZodLiteral",(e,t)=>{if(xt.init(e,t),t.values.length===0)throw Error("Cannot create literal schema with no valid values");let n=new Set(t.values);e._zod.values=n,e._zod.pattern=new RegExp(`^(${t.values.map((i)=>typeof i==="string"?Si(i):i?Si(i.toString()):String(i)).join("|")})$`),e._zod.parse=(i,r)=>{let s=i.value;if(n.has(s))return i;return i.issues.push({code:"invalid_value",values:t.values,input:s,inst:e}),i}});var Ad=q("$ZodTransform",(e,t)=>{xt.init(e,t),e._zod.optin="optional",e._zod.parse=(n,i)=>{if(i.direction==="backward")throw new ds(e.constructor.name);let r=t.transform(n.value,n);if(i.async)return(r instanceof Promise?r:Promise.resolve(r)).then((o)=>(n.value=o,n.fallback=!0,n));if(r instanceof Promise)throw new ii;return n.value=r,n.fallback=!0,n}});function kf(e,t){if(t===void 0&&(e.issues.length||e.fallback))return{issues:[],value:void 0};return e}var _c=q("$ZodOptional",(e,t)=>{xt.init(e,t),e._zod.optin="optional",e._zod.optout="optional",it(e._zod,"values",()=>t.innerType._zod.values?new Set([...t.innerType._zod.values,void 0]):void 0),it(e._zod,"pattern",()=>{let n=t.innerType._zod.pattern;return n?new RegExp(`^(${Mo(n.source)})?$`):void 0}),e._zod.parse=(n,i)=>{if(t.innerType._zod.optin==="optional"){let r=n.value,s=t.innerType._zod.run(n,i);if(s instanceof Promise)return s.then((o)=>kf(o,r));return kf(s,r)}if(n.value===void 0)return n;return t.innerType._zod.run(n,i)}}),Rd=q("$ZodExactOptional",(e,t)=>{_c.init(e,t),it(e._zod,"values",()=>t.innerType._zod.values),it(e._zod,"pattern",()=>t.innerType._zod.pattern),e._zod.parse=(n,i)=>t.innerType._zod.run(n,i)}),Cd=q("$ZodNullable",(e,t)=>{xt.init(e,t),it(e._zod,"optin",()=>t.innerType._zod.optin),it(e._zod,"optout",()=>t.innerType._zod.optout),it(e._zod,"pattern",()=>{let n=t.innerType._zod.pattern;return n?new RegExp(`^(${Mo(n.source)}|null)$`):void 0}),it(e._zod,"values",()=>t.innerType._zod.values?new Set([...t.innerType._zod.values,null]):void 0),e._zod.parse=(n,i)=>{if(n.value===null)return n;return t.innerType._zod.run(n,i)}}),Id=q("$ZodDefault",(e,t)=>{xt.init(e,t),e._zod.optin="optional",it(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(n,i)=>{if(i.direction==="backward")return t.innerType._zod.run(n,i);if(n.value===void 0)return n.value=t.defaultValue,n;let r=t.innerType._zod.run(n,i);if(r instanceof Promise)return r.then((s)=>Bf(s,t));return Bf(r,t)}});function Bf(e,t){if(e.value===void 0)e.value=t.defaultValue;return e}var Pd=q("$ZodPrefault",(e,t)=>{xt.init(e,t),e._zod.optin="optional",it(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(n,i)=>{if(i.direction==="backward")return t.innerType._zod.run(n,i);if(n.value===void 0)n.value=t.defaultValue;return t.innerType._zod.run(n,i)}}),Ld=q("$ZodNonOptional",(e,t)=>{xt.init(e,t),it(e._zod,"values",()=>{let n=t.innerType._zod.values;return n?new Set([...n].filter((i)=>i!==void 0)):void 0}),e._zod.parse=(n,i)=>{let r=t.innerType._zod.run(n,i);if(r instanceof Promise)return r.then((s)=>Gf(s,e));return Gf(r,e)}});function Gf(e,t){if(!e.issues.length&&e.value===void 0)e.issues.push({code:"invalid_type",expected:"nonoptional",input:e.value,inst:t});return e}var Nd=q("$ZodCatch",(e,t)=>{xt.init(e,t),e._zod.optin="optional",it(e._zod,"optout",()=>t.innerType._zod.optout),it(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(n,i)=>{if(i.direction==="backward")return t.innerType._zod.run(n,i);let r=t.innerType._zod.run(n,i);if(r instanceof Promise)return r.then((s)=>{if(n.value=s.value,s.issues.length)n.value=t.catchValue({...n,error:{issues:s.issues.map((o)=>En(o,i,Tn()))},input:n.value}),n.issues=[],n.fallback=!0;return n});if(n.value=r.value,r.issues.length)n.value=t.catchValue({...n,error:{issues:r.issues.map((s)=>En(s,i,Tn()))},input:n.value}),n.issues=[],n.fallback=!0;return n}});var Dd=q("$ZodPipe",(e,t)=>{xt.init(e,t),it(e._zod,"values",()=>t.in._zod.values),it(e._zod,"optin",()=>t.in._zod.optin),it(e._zod,"optout",()=>t.out._zod.optout),it(e._zod,"propValues",()=>t.in._zod.propValues),e._zod.parse=(n,i)=>{if(i.direction==="backward"){let s=t.out._zod.run(n,i);if(s instanceof Promise)return s.then((o)=>Co(o,t.in,i));return Co(s,t.in,i)}let r=t.in._zod.run(n,i);if(r instanceof Promise)return r.then((s)=>Co(s,t.out,i));return Co(r,t.out,i)}});function Co(e,t,n){if(e.issues.length)return e.aborted=!0,e;return t._zod.run({value:e.value,issues:e.issues,fallback:e.fallback},n)}var Ud=q("$ZodReadonly",(e,t)=>{xt.init(e,t),it(e._zod,"propValues",()=>t.innerType._zod.propValues),it(e._zod,"values",()=>t.innerType._zod.values),it(e._zod,"optin",()=>t.innerType?._zod?.optin),it(e._zod,"optout",()=>t.innerType?._zod?.optout),e._zod.parse=(n,i)=>{if(i.direction==="backward")return t.innerType._zod.run(n,i);let r=t.innerType._zod.run(n,i);if(r instanceof Promise)return r.then(Hf);return Hf(r)}});function Hf(e){return e.value=Object.freeze(e.value),e}var Od=q("$ZodCustom",(e,t)=>{Vt.init(e,t),xt.init(e,t),e._zod.parse=(n,i)=>n,e._zod.check=(n)=>{let i=n.value,r=t.fn(i);if(r instanceof Promise)return r.then((s)=>Vf(s,n,i,e));Vf(r,n,i,e);return}});function Vf(e,t,n,i){if(!e){let r={code:"custom",input:n,inst:i,path:[...i._zod.def.path??[]],continue:!i._zod.def.abort};if(i._zod.def.params)r.params=i._zod.def.params;t.issues.push(er(r))}}var Fd,DE=Symbol("ZodOutput"),UE=Symbol("ZodInput");class zd{constructor(){this._map=new WeakMap,this._idmap=new Map}add(e,...t){let n=t[0];if(this._map.set(e,n),n&&typeof n==="object"&&"id"in n)this._idmap.set(n.id,e);return this}clear(){return this._map=new WeakMap,this._idmap=new Map,this}remove(e){let t=this._map.get(e);if(t&&typeof t==="object"&&"id"in t)this._idmap.delete(t.id);return this._map.delete(e),this}get(e){let t=e._zod.parent;if(t){let n={...this.get(t)??{}};delete n.id;let i={...n,...this._map.get(e)};return Object.keys(i).length?i:void 0}return this._map.get(e)}has(e){return this._map.has(e)}}function hx(){return new zd}(Fd=globalThis).__zod_globalRegistry??(Fd.__zod_globalRegistry=hx());var tr=globalThis.__zod_globalRegistry;function kd(e,t){return new e({type:"string",...Te(t)})}function Bd(e,t){return new e({type:"string",format:"email",check:"string_format",abort:!1,...Te(t)})}function xc(e,t){return new e({type:"string",format:"guid",check:"string_format",abort:!1,...Te(t)})}function Gd(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,...Te(t)})}function Hd(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v4",...Te(t)})}function Vd(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v6",...Te(t)})}function Wd(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v7",...Te(t)})}function $d(e,t){return new e({type:"string",format:"url",check:"string_format",abort:!1,...Te(t)})}function Zd(e,t){return new e({type:"string",format:"emoji",check:"string_format",abort:!1,...Te(t)})}function Xd(e,t){return new e({type:"string",format:"nanoid",check:"string_format",abort:!1,...Te(t)})}function qd(e,t){return new e({type:"string",format:"cuid",check:"string_format",abort:!1,...Te(t)})}function Yd(e,t){return new e({type:"string",format:"cuid2",check:"string_format",abort:!1,...Te(t)})}function jd(e,t){return new e({type:"string",format:"ulid",check:"string_format",abort:!1,...Te(t)})}function Jd(e,t){return new e({type:"string",format:"xid",check:"string_format",abort:!1,...Te(t)})}function Kd(e,t){return new e({type:"string",format:"ksuid",check:"string_format",abort:!1,...Te(t)})}function Qd(e,t){return new e({type:"string",format:"ipv4",check:"string_format",abort:!1,...Te(t)})}function ep(e,t){return new e({type:"string",format:"ipv6",check:"string_format",abort:!1,...Te(t)})}function tp(e,t){return new e({type:"string",format:"cidrv4",check:"string_format",abort:!1,...Te(t)})}function np(e,t){return new e({type:"string",format:"cidrv6",check:"string_format",abort:!1,...Te(t)})}function ip(e,t){return new e({type:"string",format:"base64",check:"string_format",abort:!1,...Te(t)})}function rp(e,t){return new e({type:"string",format:"base64url",check:"string_format",abort:!1,...Te(t)})}function sp(e,t){return new e({type:"string",format:"e164",check:"string_format",abort:!1,...Te(t)})}function op(e,t){return new e({type:"string",format:"jwt",check:"string_format",abort:!1,...Te(t)})}function ap(e,t){return new e({type:"string",format:"datetime",check:"string_format",offset:!1,local:!1,precision:null,...Te(t)})}function cp(e,t){return new e({type:"string",format:"date",check:"string_format",...Te(t)})}function lp(e,t){return new e({type:"string",format:"time",check:"string_format",precision:null,...Te(t)})}function up(e,t){return new e({type:"string",format:"duration",check:"string_format",...Te(t)})}function hp(e,t){return new e({type:"number",checks:[],...Te(t)})}function fp(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"safeint",...Te(t)})}function dp(e,t){return new e({type:"boolean",...Te(t)})}function pp(e){return new e({type:"unknown"})}function mp(e,t){return new e({type:"never",...Te(t)})}function Lo(e,t){return new fc({check:"less_than",...Te(t),value:e,inclusive:!1})}function vs(e,t){return new fc({check:"less_than",...Te(t),value:e,inclusive:!0})}function No(e,t){return new dc({check:"greater_than",...Te(t),value:e,inclusive:!1})}function ys(e,t){return new dc({check:"greater_than",...Te(t),value:e,inclusive:!0})}function Do(e,t){return new Sf({check:"multiple_of",...Te(t),value:e})}function Uo(e,t){return new wf({check:"max_length",...Te(t),maximum:e})}function Ar(e,t){return new Tf({check:"min_length",...Te(t),minimum:e})}function Oo(e,t){return new Ef({check:"length_equals",...Te(t),length:e})}function vc(e,t){return new Af({check:"string_format",format:"regex",...Te(t),pattern:e})}function yc(e){return new Rf({check:"string_format",format:"lowercase",...Te(e)})}function bc(e){return new Cf({check:"string_format",format:"uppercase",...Te(e)})}function Sc(e,t){return new If({check:"string_format",format:"includes",...Te(t),includes:e})}function Mc(e,t){return new Pf({check:"string_format",format:"starts_with",...Te(t),prefix:e})}function wc(e,t){return new Lf({check:"string_format",format:"ends_with",...Te(t),suffix:e})}function Ti(e){return new Nf({check:"overwrite",tx:e})}function Tc(e){return Ti((t)=>t.normalize(e))}function Ec(){return Ti((e)=>e.trim())}function Ac(){return Ti((e)=>e.toLowerCase())}function Rc(){return Ti((e)=>e.toUpperCase())}function Cc(){return Ti((e)=>Rh(e))}function gp(e,t,n){return new e({type:"array",element:t,...Te(n)})}function _p(e,t,n){return new e({type:"custom",check:"custom",fn:t,...Te(n)})}function xp(e,t){let n=fx((i)=>(i.addIssue=(r)=>{if(typeof r==="string")i.issues.push(er(r,i.value,n._zod.def));else{let s=r;if(s.fatal)s.continue=!1;s.code??(s.code="custom"),s.input??(s.input=i.value),s.inst??(s.inst=n),s.continue??(s.continue=!n._zod.def.abort),i.issues.push(er(s))}},e(i.value,i)),t);return n}function fx(e,t){let n=new Vt({check:"custom",...Te(t)});return n._zod.check=e,n}function Ic(e){let t=e?.target??"draft-2020-12";if(t==="draft-4")t="draft-04";if(t==="draft-7")t="draft-07";return{processors:e.processors??{},metadataRegistry:e?.metadata??tr,target:t,unrepresentable:e?.unrepresentable??"throw",override:e?.override??(()=>{}),io:e?.io??"output",counter:0,seen:new Map,cycles:e?.cycles??"ref",reused:e?.reused??"inline",external:e?.external??void 0}}function At(e,t,n={path:[],schemaPath:[]}){var i;let r=e._zod.def,s=t.seen.get(e);if(s){if(s.count++,n.schemaPath.includes(e))s.cycle=n.path;return s.schema}let o={schema:{},count:1,cycle:void 0,path:n.path};t.seen.set(e,o);let a=e._zod.toJSONSchema?.();if(a)o.schema=a;else{let u={...n,schemaPath:[...n.schemaPath,e],path:n.path};if(e._zod.processJSONSchema)e._zod.processJSONSchema(t,o.schema,u);else{let h=o.schema,d=t.processors[r.type];if(!d)throw Error(`[toJSONSchema]: Non-representable type encountered: ${r.type}`);d(e,t,h,u)}let f=e._zod.parent;if(f){if(!o.ref)o.ref=f;At(f,t,u),t.seen.get(f).isParent=!0}}let c=t.metadataRegistry.get(e);if(c)Object.assign(o.schema,c);if(t.io==="input"&&Jt(e))delete o.schema.examples,delete o.schema.default;if(t.io==="input"&&"_prefault"in o.schema)(i=o.schema).default??(i.default=o.schema._prefault);return delete o.schema._prefault,t.seen.get(e).schema}function Pc(e,t){let n=e.seen.get(t);if(!n)throw Error("Unprocessed schema. This is a bug in Zod.");let i=new Map;for(let o of e.seen.entries()){let a=e.metadataRegistry.get(o[0])?.id;if(a){let c=i.get(a);if(c&&c!==o[0])throw Error(`Duplicate schema id "${a}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);i.set(a,o[0])}}let r=(o)=>{let a=e.target==="draft-2020-12"?"$defs":"definitions";if(e.external){let f=e.external.registry.get(o[0])?.id,h=e.external.uri??((g)=>g);if(f)return{ref:h(f)};let d=o[1].defId??o[1].schema.id??`schema${e.counter++}`;return o[1].defId=d,{defId:d,ref:`${h("__shared")}#/${a}/${d}`}}if(o[1]===n)return{ref:"#"};let l=`${"#"}/${a}/`,u=o[1].schema.id??`__schema${e.counter++}`;return{defId:u,ref:l+u}},s=(o)=>{if(o[1].schema.$ref)return;let a=o[1],{ref:c,defId:l}=r(o);if(a.def={...a.schema},l)a.defId=l;let u=a.schema;for(let f in u)delete u[f];u.$ref=c};if(e.cycles==="throw")for(let o of e.seen.entries()){let a=o[1];if(a.cycle)throw Error(`Cycle detected: #/${a.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`)}for(let o of e.seen.entries()){let a=o[1];if(t===o[0]){s(o);continue}if(e.external){let l=e.external.registry.get(o[0])?.id;if(t!==o[0]&&l){s(o);continue}}if(e.metadataRegistry.get(o[0])?.id){s(o);continue}if(a.cycle){s(o);continue}if(a.count>1){if(e.reused==="ref"){s(o);continue}}}}function Lc(e,t){let n=e.seen.get(t);if(!n)throw Error("Unprocessed schema. This is a bug in Zod.");let i=(a)=>{let c=e.seen.get(a);if(c.ref===null)return;let l=c.def??c.schema,u={...l},f=c.ref;if(c.ref=null,f){i(f);let d=e.seen.get(f),g=d.schema;if(g.$ref&&(e.target==="draft-07"||e.target==="draft-04"||e.target==="openapi-3.0"))l.allOf=l.allOf??[],l.allOf.push(g);else Object.assign(l,g);if(Object.assign(l,u),a._zod.parent===f)for(let p in l){if(p==="$ref"||p==="allOf")continue;if(!(p in u))delete l[p]}if(g.$ref&&d.def)for(let p in l){if(p==="$ref"||p==="allOf")continue;if(p in d.def&&JSON.stringify(l[p])===JSON.stringify(d.def[p]))delete l[p]}}let h=a._zod.parent;if(h&&h!==f){i(h);let d=e.seen.get(h);if(d?.schema.$ref){if(l.$ref=d.schema.$ref,d.def)for(let g in l){if(g==="$ref"||g==="allOf")continue;if(g in d.def&&JSON.stringify(l[g])===JSON.stringify(d.def[g]))delete l[g]}}}e.override({zodSchema:a,jsonSchema:l,path:c.path??[]})};for(let a of[...e.seen.entries()].reverse())i(a[0]);let r={};if(e.target==="draft-2020-12")r.$schema="https://json-schema.org/draft/2020-12/schema";else if(e.target==="draft-07")r.$schema="http://json-schema.org/draft-07/schema#";else if(e.target==="draft-04")r.$schema="http://json-schema.org/draft-04/schema#";else if(e.target==="openapi-3.0");if(e.external?.uri){let a=e.external.registry.get(t)?.id;if(!a)throw Error("Schema is missing an `id` property");r.$id=e.external.uri(a)}Object.assign(r,n.def??n.schema);let s=e.metadataRegistry.get(t)?.id;if(s!==void 0&&r.id===s)delete r.id;let o=e.external?.defs??{};for(let a of e.seen.entries()){let c=a[1];if(c.def&&c.defId){if(c.def.id===c.defId)delete c.def.id;o[c.defId]=c.def}}if(e.external);else if(Object.keys(o).length>0)if(e.target==="draft-2020-12")r.$defs=o;else r.definitions=o;try{let a=JSON.parse(JSON.stringify(r));return Object.defineProperty(a,"~standard",{value:{...t["~standard"],jsonSchema:{input:bs(t,"input",e.processors),output:bs(t,"output",e.processors)}},enumerable:!1,writable:!1}),a}catch(a){throw Error("Error converting schema to JSON.")}}function Jt(e,t){let n=t??{seen:new Set};if(n.seen.has(e))return!1;n.seen.add(e);let i=e._zod.def;if(i.type==="transform")return!0;if(i.type==="array")return Jt(i.element,n);if(i.type==="set")return Jt(i.valueType,n);if(i.type==="lazy")return Jt(i.getter(),n);if(i.type==="promise"||i.type==="optional"||i.type==="nonoptional"||i.type==="nullable"||i.type==="readonly"||i.type==="default"||i.type==="prefault")return Jt(i.innerType,n);if(i.type==="intersection")return Jt(i.left,n)||Jt(i.right,n);if(i.type==="record"||i.type==="map")return Jt(i.keyType,n)||Jt(i.valueType,n);if(i.type==="pipe"){if(e._zod.traits.has("$ZodCodec"))return!0;return Jt(i.in,n)||Jt(i.out,n)}if(i.type==="object"){for(let r in i.shape)if(Jt(i.shape[r],n))return!0;return!1}if(i.type==="union"){for(let r of i.options)if(Jt(r,n))return!0;return!1}if(i.type==="tuple"){for(let r of i.items)if(Jt(r,n))return!0;if(i.rest&&Jt(i.rest,n))return!0;return!1}return!1}var vp=(e,t={})=>(n)=>{let i=Ic({...n,processors:t});return At(e,i),Pc(i,e),Lc(i,e)},bs=(e,t,n={})=>(i)=>{let{libraryOptions:r,target:s}=i??{},o=Ic({...r??{},target:s,io:t,processors:n});return At(e,o),Pc(o,e),Lc(o,e)};var dx={guid:"uuid",url:"uri",datetime:"date-time",json_string:"json-string",regex:""},yp=(e,t,n,i)=>{let r=n;r.type="string";let{minimum:s,maximum:o,format:a,patterns:c,contentEncoding:l}=e._zod.bag;if(typeof s==="number")r.minLength=s;if(typeof o==="number")r.maxLength=o;if(a){if(r.format=dx[a]??a,r.format==="")delete r.format;if(a==="time")delete r.format}if(l)r.contentEncoding=l;if(c&&c.size>0){let u=[...c];if(u.length===1)r.pattern=u[0].source;else if(u.length>1)r.allOf=[...u.map((f)=>({...t.target==="draft-07"||t.target==="draft-04"||t.target==="openapi-3.0"?{type:"string"}:{},pattern:f.source}))]}},bp=(e,t,n,i)=>{let r=n,{minimum:s,maximum:o,format:a,multipleOf:c,exclusiveMaximum:l,exclusiveMinimum:u}=e._zod.bag;if(typeof a==="string"&&a.includes("int"))r.type="integer";else r.type="number";let f=typeof u==="number"&&u>=(s??Number.NEGATIVE_INFINITY),h=typeof l==="number"&&l<=(o??Number.POSITIVE_INFINITY),d=t.target==="draft-04"||t.target==="openapi-3.0";if(f)if(d)r.minimum=u,r.exclusiveMinimum=!0;else r.exclusiveMinimum=u;else if(typeof s==="number")r.minimum=s;if(h)if(d)r.maximum=l,r.exclusiveMaximum=!0;else r.exclusiveMaximum=l;else if(typeof o==="number")r.maximum=o;if(typeof c==="number")r.multipleOf=c},Sp=(e,t,n,i)=>{n.type="boolean"};var Mp=(e,t,n,i)=>{n.not={}};var wp=(e,t,n,i)=>{};var Tp=(e,t,n,i)=>{let r=e._zod.def,s=yo(r.entries);if(s.every((o)=>typeof o==="number"))n.type="number";if(s.every((o)=>typeof o==="string"))n.type="string";n.enum=s},Ep=(e,t,n,i)=>{let r=e._zod.def,s=[];for(let o of r.values)if(o===void 0){if(t.unrepresentable==="throw")throw Error("Literal `undefined` cannot be represented in JSON Schema")}else if(typeof o==="bigint")if(t.unrepresentable==="throw")throw Error("BigInt literals cannot be represented in JSON Schema");else s.push(Number(o));else s.push(o);if(s.length===0);else if(s.length===1){let o=s[0];if(n.type=o===null?"null":typeof o,t.target==="draft-04"||t.target==="openapi-3.0")n.enum=[o];else n.const=o}else{if(s.every((o)=>typeof o==="number"))n.type="number";if(s.every((o)=>typeof o==="string"))n.type="string";if(s.every((o)=>typeof o==="boolean"))n.type="boolean";if(s.every((o)=>o===null))n.type="null";n.enum=s}};var Ap=(e,t,n,i)=>{if(t.unrepresentable==="throw")throw Error("Custom types cannot be represented in JSON Schema")};var Rp=(e,t,n,i)=>{if(t.unrepresentable==="throw")throw Error("Transforms cannot be represented in JSON Schema")};var Cp=(e,t,n,i)=>{let r=n,s=e._zod.def,{minimum:o,maximum:a}=e._zod.bag;if(typeof o==="number")r.minItems=o;if(typeof a==="number")r.maxItems=a;r.type="array",r.items=At(s.element,t,{...i,path:[...i.path,"items"]})},Ip=(e,t,n,i)=>{let r=n,s=e._zod.def;r.type="object",r.properties={};let o=s.shape;for(let l in o)r.properties[l]=At(o[l],t,{...i,path:[...i.path,"properties",l]});let a=new Set(Object.keys(o)),c=new Set([...a].filter((l)=>{let u=s.shape[l]._zod;if(t.io==="input")return u.optin===void 0;else return u.optout===void 0}));if(c.size>0)r.required=Array.from(c);if(s.catchall?._zod.def.type==="never")r.additionalProperties=!1;else if(!s.catchall){if(t.io==="output")r.additionalProperties=!1}else if(s.catchall)r.additionalProperties=At(s.catchall,t,{...i,path:[...i.path,"additionalProperties"]})},Pp=(e,t,n,i)=>{let r=e._zod.def,s=r.inclusive===!1,o=r.options.map((a,c)=>At(a,t,{...i,path:[...i.path,s?"oneOf":"anyOf",c]}));if(s)n.oneOf=o;else n.anyOf=o},Lp=(e,t,n,i)=>{let r=e._zod.def,s=At(r.left,t,{...i,path:[...i.path,"allOf",0]}),o=At(r.right,t,{...i,path:[...i.path,"allOf",1]}),a=(l)=>("allOf"in l)&&Object.keys(l).length===1,c=[...a(s)?s.allOf:[s],...a(o)?o.allOf:[o]];n.allOf=c};var Np=(e,t,n,i)=>{let r=n,s=e._zod.def;r.type="object";let o=s.keyType,c=o._zod.bag?.patterns;if(s.mode==="loose"&&c&&c.size>0){let u=At(s.valueType,t,{...i,path:[...i.path,"patternProperties","*"]});r.patternProperties={};for(let f of c)r.patternProperties[f.source]=u}else{if(t.target==="draft-07"||t.target==="draft-2020-12")r.propertyNames=At(s.keyType,t,{...i,path:[...i.path,"propertyNames"]});r.additionalProperties=At(s.valueType,t,{...i,path:[...i.path,"additionalProperties"]})}let l=o._zod.values;if(l){let u=[...l].filter((f)=>typeof f==="string"||typeof f==="number");if(u.length>0)r.required=u}},Dp=(e,t,n,i)=>{let r=e._zod.def,s=At(r.innerType,t,i),o=t.seen.get(e);if(t.target==="openapi-3.0")o.ref=r.innerType,n.nullable=!0;else n.anyOf=[s,{type:"null"}]},Up=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType},Op=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType,n.default=JSON.parse(JSON.stringify(r.defaultValue))},Fp=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);if(s.ref=r.innerType,t.io==="input")n._prefault=JSON.parse(JSON.stringify(r.defaultValue))},zp=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType;let o;try{o=r.catchValue(void 0)}catch{throw Error("Dynamic catch values are not supported in JSON Schema")}n.default=o},kp=(e,t,n,i)=>{let r=e._zod.def,s=r.in._zod.traits.has("$ZodTransform"),o=t.io==="input"?s?r.out:r.in:r.out;At(o,t,i);let a=t.seen.get(e);a.ref=o},Bp=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType,n.readOnly=!0};var Nc=(e,t,n,i)=>{let r=e._zod.def;At(r.innerType,t,i);let s=t.seen.get(e);s.ref=r.innerType};var yx=q("ZodISODateTime",(e,t)=>{td.init(e,t),vt.init(e,t)});function Gp(e){return ap(yx,e)}var bx=q("ZodISODate",(e,t)=>{nd.init(e,t),vt.init(e,t)});function Hp(e){return cp(bx,e)}var Sx=q("ZodISOTime",(e,t)=>{id.init(e,t),vt.init(e,t)});function Vp(e){return lp(Sx,e)}var Mx=q("ZodISODuration",(e,t)=>{rd.init(e,t),vt.init(e,t)});function Wp(e){return up(Mx,e)}var Ex=(e,t)=>{To.init(e,t),e.name="ZodError",Object.defineProperties(e,{format:{value:(n)=>Oh(e,n)},flatten:{value:(n)=>Uh(e,n)},addIssue:{value:(n)=>{e.issues.push(n),e.message=JSON.stringify(e.issues,ms,2)}},addIssues:{value:(n)=>{e.issues.push(...n),e.message=JSON.stringify(e.issues,ms,2)}},isEmpty:{get(){return e.issues.length===0}}})};var an=q("ZodError",Ex,{Parent:Error});var $p=Eo(an),Zp=Ao(an),Xp=gs(an),qp=_s(an),Yp=kh(an),jp=Bh(an),Jp=Gh(an),Kp=Hh(an),Qp=Vh(an),em=Wh(an),tm=$h(an),nm=Zh(an);var im=new WeakMap;function Ss(e,t,n){let i=Object.getPrototypeOf(e),r=im.get(i);if(!r)r=new Set,im.set(i,r);if(r.has(t))return;r.add(t);for(let s in n){let o=n[s];Object.defineProperty(i,s,{configurable:!0,enumerable:!1,get(){let a=o.bind(this);return Object.defineProperty(this,s,{configurable:!0,writable:!0,enumerable:!0,value:a}),a},set(a){Object.defineProperty(this,s,{configurable:!0,writable:!0,enumerable:!0,value:a})}})}}var yt=q("ZodType",(e,t)=>(xt.init(e,t),Object.assign(e["~standard"],{jsonSchema:{input:bs(e,"input"),output:bs(e,"output")}}),e.toJSONSchema=vp(e,{}),e.def=t,e.type=t.type,Object.defineProperty(e,"_def",{value:t}),e.parse=(n,i)=>$p(e,n,i,{callee:e.parse}),e.safeParse=(n,i)=>Xp(e,n,i),e.parseAsync=async(n,i)=>Zp(e,n,i,{callee:e.parseAsync}),e.safeParseAsync=async(n,i)=>qp(e,n,i),e.spa=e.safeParseAsync,e.encode=(n,i)=>Yp(e,n,i),e.decode=(n,i)=>jp(e,n,i),e.encodeAsync=async(n,i)=>Jp(e,n,i),e.decodeAsync=async(n,i)=>Kp(e,n,i),e.safeEncode=(n,i)=>Qp(e,n,i),e.safeDecode=(n,i)=>em(e,n,i),e.safeEncodeAsync=async(n,i)=>tm(e,n,i),e.safeDecodeAsync=async(n,i)=>nm(e,n,i),Ss(e,"ZodType",{check(...n){let i=this.def;return this.clone(bi(i,{checks:[...i.checks??[],...n.map((r)=>typeof r==="function"?{_zod:{check:r,def:{check:"custom"},onattach:[]}}:r)]}),{parent:!0})},with(...n){return this.check(...n)},clone(n,i){return Gn(this,n,i)},brand(){return this},register(n,i){return n.add(this,i),this},refine(n,i){return this.check(Mv(n,i))},superRefine(n,i){return this.check(wv(n,i))},overwrite(n){return this.check(Ti(n))},optional(){return am(this)},exactOptional(){return uv(this)},nullable(){return cm(this)},nullish(){return am(cm(this))},nonoptional(n){return gv(this,n)},array(){return ko(this)},or(n){return nv([this,n])},and(n){return rv(this,n)},transform(n){return lm(this,cv(n))},default(n){return dv(this,n)},prefault(n){return mv(this,n)},catch(n){return xv(this,n)},pipe(n){return lm(this,n)},readonly(){return bv(this)},describe(n){let i=this.clone();return tr.add(i,{description:n}),i},meta(...n){if(n.length===0)return tr.get(this);let i=this.clone();return tr.add(i,n[0]),i},isOptional(){return this.safeParse(void 0).success},isNullable(){return this.safeParse(null).success},apply(n){return n(this)}}),Object.defineProperty(e,"description",{get(){return tr.get(e)?.description},configurable:!0}),e)),um=q("_ZodString",(e,t)=>{Po.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(i,r,s)=>yp(e,i,r,s);let n=e._zod.bag;e.format=n.format??null,e.minLength=n.minimum??null,e.maxLength=n.maximum??null,Ss(e,"_ZodString",{regex(...i){return this.check(vc(...i))},includes(...i){return this.check(Sc(...i))},startsWith(...i){return this.check(Mc(...i))},endsWith(...i){return this.check(wc(...i))},min(...i){return this.check(Ar(...i))},max(...i){return this.check(Uo(...i))},length(...i){return this.check(Oo(...i))},nonempty(...i){return this.check(Ar(1,...i))},lowercase(i){return this.check(yc(i))},uppercase(i){return this.check(bc(i))},trim(){return this.check(Ec())},normalize(...i){return this.check(Tc(...i))},toLowerCase(){return this.check(Ac())},toUpperCase(){return this.check(Rc())},slugify(){return this.check(Cc())}})}),Rx=q("ZodString",(e,t)=>{Po.init(e,t),um.init(e,t),e.email=(n)=>e.check(Bd(Cx,n)),e.url=(n)=>e.check($d(Ix,n)),e.jwt=(n)=>e.check(op($x,n)),e.emoji=(n)=>e.check(Zd(Px,n)),e.guid=(n)=>e.check(xc(rm,n)),e.uuid=(n)=>e.check(Gd(zo,n)),e.uuidv4=(n)=>e.check(Hd(zo,n)),e.uuidv6=(n)=>e.check(Vd(zo,n)),e.uuidv7=(n)=>e.check(Wd(zo,n)),e.nanoid=(n)=>e.check(Xd(Lx,n)),e.guid=(n)=>e.check(xc(rm,n)),e.cuid=(n)=>e.check(qd(Nx,n)),e.cuid2=(n)=>e.check(Yd(Dx,n)),e.ulid=(n)=>e.check(jd(Ux,n)),e.base64=(n)=>e.check(ip(Hx,n)),e.base64url=(n)=>e.check(rp(Vx,n)),e.xid=(n)=>e.check(Jd(Ox,n)),e.ksuid=(n)=>e.check(Kd(Fx,n)),e.ipv4=(n)=>e.check(Qd(zx,n)),e.ipv6=(n)=>e.check(ep(kx,n)),e.cidrv4=(n)=>e.check(tp(Bx,n)),e.cidrv6=(n)=>e.check(np(Gx,n)),e.e164=(n)=>e.check(sp(Wx,n)),e.datetime=(n)=>e.check(Gp(n)),e.date=(n)=>e.check(Hp(n)),e.time=(n)=>e.check(Vp(n)),e.duration=(n)=>e.check(Wp(n))});function Zt(e){return kd(Rx,e)}var vt=q("ZodStringFormat",(e,t)=>{_t.init(e,t),um.init(e,t)}),Cx=q("ZodEmail",(e,t)=>{Zf.init(e,t),vt.init(e,t)});var rm=q("ZodGUID",(e,t)=>{Wf.init(e,t),vt.init(e,t)});var zo=q("ZodUUID",(e,t)=>{$f.init(e,t),vt.init(e,t)});var Ix=q("ZodURL",(e,t)=>{Xf.init(e,t),vt.init(e,t)});var Px=q("ZodEmoji",(e,t)=>{qf.init(e,t),vt.init(e,t)});var Lx=q("ZodNanoID",(e,t)=>{Yf.init(e,t),vt.init(e,t)});var Nx=q("ZodCUID",(e,t)=>{jf.init(e,t),vt.init(e,t)});var Dx=q("ZodCUID2",(e,t)=>{Jf.init(e,t),vt.init(e,t)});var Ux=q("ZodULID",(e,t)=>{Kf.init(e,t),vt.init(e,t)});var Ox=q("ZodXID",(e,t)=>{Qf.init(e,t),vt.init(e,t)});var Fx=q("ZodKSUID",(e,t)=>{ed.init(e,t),vt.init(e,t)});var zx=q("ZodIPv4",(e,t)=>{sd.init(e,t),vt.init(e,t)});var kx=q("ZodIPv6",(e,t)=>{od.init(e,t),vt.init(e,t)});var Bx=q("ZodCIDRv4",(e,t)=>{ad.init(e,t),vt.init(e,t)});var Gx=q("ZodCIDRv6",(e,t)=>{cd.init(e,t),vt.init(e,t)});var Hx=q("ZodBase64",(e,t)=>{ud.init(e,t),vt.init(e,t)});var Vx=q("ZodBase64URL",(e,t)=>{hd.init(e,t),vt.init(e,t)});var Wx=q("ZodE164",(e,t)=>{fd.init(e,t),vt.init(e,t)});var $x=q("ZodJWT",(e,t)=>{dd.init(e,t),vt.init(e,t)});var hm=q("ZodNumber",(e,t)=>{gc.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(i,r,s)=>bp(e,i,r,s),Ss(e,"ZodNumber",{gt(i,r){return this.check(No(i,r))},gte(i,r){return this.check(ys(i,r))},min(i,r){return this.check(ys(i,r))},lt(i,r){return this.check(Lo(i,r))},lte(i,r){return this.check(vs(i,r))},max(i,r){return this.check(vs(i,r))},int(i){return this.check(sm(i))},safe(i){return this.check(sm(i))},positive(i){return this.check(No(0,i))},nonnegative(i){return this.check(ys(0,i))},negative(i){return this.check(Lo(0,i))},nonpositive(i){return this.check(vs(0,i))},multipleOf(i,r){return this.check(Do(i,r))},step(i,r){return this.check(Do(i,r))},finite(){return this}});let n=e._zod.bag;e.minValue=Math.max(n.minimum??Number.NEGATIVE_INFINITY,n.exclusiveMinimum??Number.NEGATIVE_INFINITY)??null,e.maxValue=Math.min(n.maximum??Number.POSITIVE_INFINITY,n.exclusiveMaximum??Number.POSITIVE_INFINITY)??null,e.isInt=(n.format??"").includes("int")||Number.isSafeInteger(n.multipleOf??0.5),e.isFinite=!0,e.format=n.format??null});function Zx(e){return hp(hm,e)}var Xx=q("ZodNumberFormat",(e,t)=>{pd.init(e,t),hm.init(e,t)});function sm(e){return fp(Xx,e)}var qx=q("ZodBoolean",(e,t)=>{md.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Sp(e,n,i,r)});function Yx(e){return dp(qx,e)}var jx=q("ZodUnknown",(e,t)=>{gd.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>wp(e,n,i,r)});function nr(){return pp(jx)}var Jx=q("ZodNever",(e,t)=>{_d.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Mp(e,n,i,r)});function Kx(e){return mp(Jx,e)}var Qx=q("ZodArray",(e,t)=>{xd.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Cp(e,n,i,r),e.element=t.element,Ss(e,"ZodArray",{min(n,i){return this.check(Ar(n,i))},nonempty(n){return this.check(Ar(1,n))},max(n,i){return this.check(Uo(n,i))},length(n,i){return this.check(Oo(n,i))},unwrap(){return this.element}})});function ko(e,t){return gp(Qx,e,t)}var ev=q("ZodObject",(e,t)=>{bd.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Ip(e,n,i,r),it(e,"shape",()=>t.shape),Ss(e,"ZodObject",{keyof(){return dm(Object.keys(this._zod.def.shape))},catchall(n){return this.clone({...this._zod.def,catchall:n})},passthrough(){return this.clone({...this._zod.def,catchall:nr()})},loose(){return this.clone({...this._zod.def,catchall:nr()})},strict(){return this.clone({...this._zod.def,catchall:Kx()})},strip(){return this.clone({...this._zod.def,catchall:void 0})},extend(n){return tx(this,n)},safeExtend(n){return nx(this,n)},merge(n){return ix(this,n)},pick(n){return Q0(this,n)},omit(n){return ex(this,n)},partial(...n){return rx(pm,this,n[0])},required(...n){return sx(mm,this,n[0])}})});function Ms(e,t){let n={type:"object",shape:e??{},...Te(t)};return new ev(n)}var tv=q("ZodUnion",(e,t)=>{Sd.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Pp(e,n,i,r),e.options=t.options});function nv(e,t){return new tv({type:"union",options:e,...Te(t)})}var iv=q("ZodIntersection",(e,t)=>{Md.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Lp(e,n,i,r)});function rv(e,t){return new iv({type:"intersection",left:e,right:t})}var om=q("ZodRecord",(e,t)=>{wd.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Np(e,n,i,r),e.keyType=t.keyType,e.valueType=t.valueType});function fm(e,t,n){if(!t||!t._zod)return new om({type:"record",keyType:Zt(),valueType:e,...Te(t)});return new om({type:"record",keyType:e,valueType:t,...Te(n)})}var Dc=q("ZodEnum",(e,t)=>{Td.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(i,r,s)=>Tp(e,i,r,s),e.enum=t.entries,e.options=Object.values(t.entries);let n=new Set(Object.keys(t.entries));e.extract=(i,r)=>{let s={};for(let o of i)if(n.has(o))s[o]=t.entries[o];else throw Error(`Key ${o} not found in enum`);return new Dc({...t,checks:[],...Te(r),entries:s})},e.exclude=(i,r)=>{let s={...t.entries};for(let o of i)if(n.has(o))delete s[o];else throw Error(`Key ${o} not found in enum`);return new Dc({...t,checks:[],...Te(r),entries:s})}});function dm(e,t){let n=Array.isArray(e)?Object.fromEntries(e.map((i)=>[i,i])):e;return new Dc({type:"enum",entries:n,...Te(t)})}var sv=q("ZodLiteral",(e,t)=>{Ed.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Ep(e,n,i,r),e.values=new Set(t.values),Object.defineProperty(e,"value",{get(){if(t.values.length>1)throw Error("This schema contains multiple valid literal values. Use `.values` instead.");return t.values[0]}})});function ov(e,t){return new sv({type:"literal",values:Array.isArray(e)?e:[e],...Te(t)})}var av=q("ZodTransform",(e,t)=>{Ad.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Rp(e,n,i,r),e._zod.parse=(n,i)=>{if(i.direction==="backward")throw new ds(e.constructor.name);n.addIssue=(s)=>{if(typeof s==="string")n.issues.push(er(s,n.value,t));else{let o=s;if(o.fatal)o.continue=!1;o.code??(o.code="custom"),o.input??(o.input=n.value),o.inst??(o.inst=e),n.issues.push(er(o))}};let r=t.transform(n.value,n);if(r instanceof Promise)return r.then((s)=>(n.value=s,n.fallback=!0,n));return n.value=r,n.fallback=!0,n}});function cv(e){return new av({type:"transform",transform:e})}var pm=q("ZodOptional",(e,t)=>{_c.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Nc(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function am(e){return new pm({type:"optional",innerType:e})}var lv=q("ZodExactOptional",(e,t)=>{Rd.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Nc(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function uv(e){return new lv({type:"optional",innerType:e})}var hv=q("ZodNullable",(e,t)=>{Cd.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Dp(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function cm(e){return new hv({type:"nullable",innerType:e})}var fv=q("ZodDefault",(e,t)=>{Id.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Op(e,n,i,r),e.unwrap=()=>e._zod.def.innerType,e.removeDefault=e.unwrap});function dv(e,t){return new fv({type:"default",innerType:e,get defaultValue(){return typeof t==="function"?t():ac(t)}})}var pv=q("ZodPrefault",(e,t)=>{Pd.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Fp(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function mv(e,t){return new pv({type:"prefault",innerType:e,get defaultValue(){return typeof t==="function"?t():ac(t)}})}var mm=q("ZodNonOptional",(e,t)=>{Ld.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Up(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function gv(e,t){return new mm({type:"nonoptional",innerType:e,...Te(t)})}var _v=q("ZodCatch",(e,t)=>{Nd.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>zp(e,n,i,r),e.unwrap=()=>e._zod.def.innerType,e.removeCatch=e.unwrap});function xv(e,t){return new _v({type:"catch",innerType:e,catchValue:typeof t==="function"?t:()=>t})}var vv=q("ZodPipe",(e,t)=>{Dd.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>kp(e,n,i,r),e.in=t.in,e.out=t.out});function lm(e,t){return new vv({type:"pipe",in:e,out:t})}var yv=q("ZodReadonly",(e,t)=>{Ud.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Bp(e,n,i,r),e.unwrap=()=>e._zod.def.innerType});function bv(e){return new yv({type:"readonly",innerType:e})}var Sv=q("ZodCustom",(e,t)=>{Od.init(e,t),yt.init(e,t),e._zod.processJSONSchema=(n,i,r)=>Ap(e,n,i,r)});function Mv(e,t={}){return _p(Sv,e,t)}function wv(e,t){return xp(e,t)}/*!
fflate - fast JavaScript compression/decompression
<https://101arrowz.github.io/fflate>
Licensed under MIT. https://github.com/101arrowz/fflate/blob/master/LICENSE
version 0.8.2
*/var bt=Uint8Array,cn=Uint16Array,$c=Int32Array,Bo=new bt([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),Go=new bt([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),kc=new bt([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Sm=function(e,t){var n=new cn(31);for(var i=0;i<31;++i)n[i]=t+=1<<e[i-1];var r=new $c(n[30]);for(var i=1;i<30;++i)for(var s=n[i];s<n[i+1];++s)r[s]=s-n[i]<<5|i;return{b:n,r}},Mm=Sm(Bo,2),{b:wm,r:Bc}=Mm;wm[28]=258,Bc[258]=28;var Tm=Sm(Go,0),{b:Ev,r:gm}=Tm,Gc=new cn(32768);for(je=0;je<32768;++je)Hn=(je&43690)>>1|(je&21845)<<1,Hn=(Hn&52428)>>2|(Hn&13107)<<2,Hn=(Hn&61680)>>4|(Hn&3855)<<4,Gc[je]=((Hn&65280)>>8|(Hn&255)<<8)>>1;var Hn,je,Wn=function(e,t,n){var i=e.length,r=0,s=new cn(t);for(;r<i;++r)if(e[r])++s[e[r]-1];var o=new cn(t);for(r=1;r<t;++r)o[r]=o[r-1]+s[r-1]<<1;var a;if(n){a=new cn(1<<t);var c=15-t;for(r=0;r<i;++r)if(e[r]){var l=r<<4|e[r],u=t-e[r],f=o[e[r]-1]++<<u;for(var h=f|(1<<u)-1;f<=h;++f)a[Gc[f]>>c]=l}}else{a=new cn(i);for(r=0;r<i;++r)if(e[r])a[r]=Gc[o[e[r]-1]++]>>15-e[r]}return a},Ei=new bt(288);for(je=0;je<144;++je)Ei[je]=8;var je;for(je=144;je<256;++je)Ei[je]=9;var je;for(je=256;je<280;++je)Ei[je]=7;var je;for(je=280;je<288;++je)Ei[je]=8;var je,Es=new bt(32);for(je=0;je<32;++je)Es[je]=5;var je,Av=Wn(Ei,9,0),Rv=Wn(Ei,9,1),Cv=Wn(Es,5,0),Iv=Wn(Es,5,1),Uc=function(e){var t=e[0];for(var n=1;n<e.length;++n)if(e[n]>t)t=e[n];return t},An=function(e,t,n){var i=t/8|0;return(e[i]|e[i+1]<<8)>>(t&7)&n},Oc=function(e,t){var n=t/8|0;return(e[n]|e[n+1]<<8|e[n+2]<<16)>>(t&7)},Zc=function(e){return(e+7)/8|0},As=function(e,t,n){if(t==null||t<0)t=0;if(n==null||n>e.length)n=e.length;return new bt(e.subarray(t,n))};var Pv=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],Kt=function(e,t,n){var i=Error(t||Pv[e]);if(i.code=e,Error.captureStackTrace)Error.captureStackTrace(i,Kt);if(!n)throw i;return i},Lv=function(e,t,n,i){var r=e.length,s=i?i.length:0;if(!r||t.f&&!t.l)return n||new bt(0);var o=!n,a=o||t.i!=2,c=t.i;if(o)n=new bt(r*3);var l=function(Oe){var ke=n.length;if(Oe>ke){var Ke=new bt(Math.max(ke*2,Oe));Ke.set(n),n=Ke}},u=t.f||0,f=t.p||0,h=t.b||0,{l:d,d:g,m:y,n:p}=t,m=r*8;do{if(!d){u=An(e,f,1);var A=An(e,f+1,3);if(f+=3,!A){var T=Zc(f)+4,v=e[T-4]|e[T-3]<<8,w=T+v;if(w>r){if(c)Kt(0);break}if(a)l(h+v);n.set(e.subarray(T,w),h),t.b=h+=v,t.p=f=w*8,t.f=u;continue}else if(A==1)d=Rv,g=Iv,y=9,p=5;else if(A==2){var E=An(e,f,31)+257,R=An(e,f+10,15)+4,_=E+An(e,f+5,31)+1;f+=14;var S=new bt(_),F=new bt(19);for(var C=0;C<R;++C)F[kc[C]]=An(e,f+C*3,7);f+=R*3;var z=Uc(F),J=(1<<z)-1,O=Wn(F,z,1);for(var C=0;C<_;){var H=O[An(e,f,J)];f+=H&15;var T=H>>4;if(T<16)S[C++]=T;else{var V=0,U=0;if(T==16)U=3+An(e,f,3),f+=2,V=S[C-1];else if(T==17)U=3+An(e,f,7),f+=3;else if(T==18)U=11+An(e,f,127),f+=7;while(U--)S[C++]=V}}var K=S.subarray(0,E),Q=S.subarray(E);y=Uc(K),p=Uc(Q),d=Wn(K,y,1),g=Wn(Q,p,1)}else Kt(1);if(f>m){if(c)Kt(0);break}}if(a)l(h+131072);var se=(1<<y)-1,me=(1<<p)-1,_e=f;for(;;_e=f){var V=d[Oc(e,f)&se],qe=V>>4;if(f+=V&15,f>m){if(c)Kt(0);break}if(!V)Kt(2);if(qe<256)n[h++]=qe;else if(qe==256){_e=f,d=null;break}else{var Ge=qe-254;if(qe>264){var C=qe-257,Z=Bo[C];Ge=An(e,f,(1<<Z)-1)+wm[C],f+=Z}var ne=g[Oc(e,f)&me],fe=ne>>4;if(!ne)Kt(3);f+=ne&15;var Q=Ev[fe];if(fe>3){var Z=Go[fe];Q+=Oc(e,f)&(1<<Z)-1,f+=Z}if(f>m){if(c)Kt(0);break}if(a)l(h+131072);var de=h+Ge;if(h<Q){var Re=s-Q,Ze=Math.min(Q,de);if(Re+h<0)Kt(3);for(;h<Ze;++h)n[h]=i[Re+h]}for(;h<de;++h)n[h]=n[h-Q]}}if(t.l=d,t.p=_e,t.b=h,t.f=u,d)u=1,t.m=y,t.d=g,t.n=p}while(!u);return h!=n.length&&o?As(n,0,h):n.subarray(0,h)},ri=function(e,t,n){n<<=t&7;var i=t/8|0;e[i]|=n,e[i+1]|=n>>8},ws=function(e,t,n){n<<=t&7;var i=t/8|0;e[i]|=n,e[i+1]|=n>>8,e[i+2]|=n>>16},Fc=function(e,t){var n=[];for(var i=0;i<e.length;++i)if(e[i])n.push({s:i,f:e[i]});var r=n.length,s=n.slice();if(!r)return{t:Am,l:0};if(r==1){var o=new bt(n[0].s+1);return o[n[0].s]=1,{t:o,l:1}}n.sort(function(w,E){return w.f-E.f}),n.push({s:-1,f:25001});var a=n[0],c=n[1],l=0,u=1,f=2;n[0]={s:-1,f:a.f+c.f,l:a,r:c};while(u!=r-1)a=n[n[l].f<n[f].f?l++:f++],c=n[l!=u&&n[l].f<n[f].f?l++:f++],n[u++]={s:-1,f:a.f+c.f,l:a,r:c};var h=s[0].s;for(var i=1;i<r;++i)if(s[i].s>h)h=s[i].s;var d=new cn(h+1),g=Hc(n[u-1],d,0);if(g>t){var i=0,y=0,p=g-t,m=1<<p;s.sort(function(E,R){return d[R.s]-d[E.s]||E.f-R.f});for(;i<r;++i){var A=s[i].s;if(d[A]>t)y+=m-(1<<g-d[A]),d[A]=t;else break}y>>=p;while(y>0){var T=s[i].s;if(d[T]<t)y-=1<<t-d[T]++-1;else++i}for(;i>=0&&y;--i){var v=s[i].s;if(d[v]==t)--d[v],++y}g=t}return{t:new bt(d),l:g}},Hc=function(e,t,n){return e.s==-1?Math.max(Hc(e.l,t,n+1),Hc(e.r,t,n+1)):t[e.s]=n},_m=function(e){var t=e.length;while(t&&!e[--t]);var n=new cn(++t),i=0,r=e[0],s=1,o=function(c){n[i++]=c};for(var a=1;a<=t;++a)if(e[a]==r&&a!=t)++s;else{if(!r&&s>2){for(;s>138;s-=138)o(32754);if(s>2)o(s>10?s-11<<5|28690:s-3<<5|12305),s=0}else if(s>3){o(r),--s;for(;s>6;s-=6)o(8304);if(s>2)o(s-3<<5|8208),s=0}while(s--)o(r);s=1,r=e[a]}return{c:n.subarray(0,i),n:t}},Ts=function(e,t){var n=0;for(var i=0;i<t.length;++i)n+=e[i]*t[i];return n},Em=function(e,t,n){var i=n.length,r=Zc(t+2);e[r]=i&255,e[r+1]=i>>8,e[r+2]=e[r]^255,e[r+3]=e[r+1]^255;for(var s=0;s<i;++s)e[r+s+4]=n[s];return(r+4+i)*8},xm=function(e,t,n,i,r,s,o,a,c,l,u){ri(t,u++,n),++r[256];var f=Fc(r,15),{t:h,l:d}=f,g=Fc(s,15),{t:y,l:p}=g,m=_m(h),{c:A,n:T}=m,v=_m(y),{c:w,n:E}=v,R=new cn(19);for(var _=0;_<A.length;++_)++R[A[_]&31];for(var _=0;_<w.length;++_)++R[w[_]&31];var S=Fc(R,7),{t:F,l:C}=S,z=19;for(;z>4&&!F[kc[z-1]];--z);var J=l+5<<3,O=Ts(r,Ei)+Ts(s,Es)+o,H=Ts(r,h)+Ts(s,y)+o+14+3*z+Ts(R,F)+2*R[16]+3*R[17]+7*R[18];if(c>=0&&J<=O&&J<=H)return Em(t,u,e.subarray(c,c+l));var V,U,K,Q;if(ri(t,u,1+(H<O)),u+=2,H<O){V=Wn(h,d,0),U=h,K=Wn(y,p,0),Q=y;var se=Wn(F,C,0);ri(t,u,T-257),ri(t,u+5,E-1),ri(t,u+10,z-4),u+=14;for(var _=0;_<z;++_)ri(t,u+3*_,F[kc[_]]);u+=3*z;var me=[A,w];for(var _e=0;_e<2;++_e){var qe=me[_e];for(var _=0;_<qe.length;++_){var Ge=qe[_]&31;if(ri(t,u,se[Ge]),u+=F[Ge],Ge>15)ri(t,u,qe[_]>>5&127),u+=qe[_]>>12}}}else V=Av,U=Ei,K=Cv,Q=Es;for(var _=0;_<a;++_){var Z=i[_];if(Z>255){var Ge=Z>>18&31;if(ws(t,u,V[Ge+257]),u+=U[Ge+257],Ge>7)ri(t,u,Z>>23&31),u+=Bo[Ge];var ne=Z&31;if(ws(t,u,K[ne]),u+=Q[ne],ne>3)ws(t,u,Z>>5&8191),u+=Go[ne]}else ws(t,u,V[Z]),u+=U[Z]}return ws(t,u,V[256]),u+U[256]},Nv=new $c([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),Am=new bt(0),Dv=function(e,t,n,i,r,s){var o=s.z||e.length,a=new bt(i+o+5*(1+Math.ceil(o/7000))+r),c=a.subarray(i,a.length-r),l=s.l,u=(s.r||0)&7;if(t){if(u)c[0]=s.r>>3;var f=Nv[t-1],h=f>>13,d=f&8191,g=(1<<n)-1,y=s.p||new cn(32768),p=s.h||new cn(g+1),m=Math.ceil(n/3),A=2*m,T=function(Ye){return(e[Ye]^e[Ye+1]<<m^e[Ye+2]<<A)&g},v=new $c(25000),w=new cn(288),E=new cn(32),R=0,_=0,S=s.i||0,F=0,C=s.w||0,z=0;for(;S+2<o;++S){var J=T(S),O=S&32767,H=p[J];if(y[O]=H,p[J]=O,C<=S){var V=o-S;if((R>7000||F>24576)&&(V>423||!l)){u=xm(e,c,0,v,w,E,_,F,z,S-z,u),F=R=_=0,z=S;for(var U=0;U<286;++U)w[U]=0;for(var U=0;U<30;++U)E[U]=0}var K=2,Q=0,se=d,me=O-H&32767;if(V>2&&J==T(S-me)){var _e=Math.min(h,V)-1,qe=Math.min(32767,S),Ge=Math.min(258,V);while(me<=qe&&--se&&O!=H){if(e[S+K]==e[S+K-me]){var Z=0;for(;Z<Ge&&e[S+Z]==e[S+Z-me];++Z);if(Z>K){if(K=Z,Q=me,Z>_e)break;var ne=Math.min(me,Z-2),fe=0;for(var U=0;U<ne;++U){var de=S-me+U&32767,Re=y[de],Ze=de-Re&32767;if(Ze>fe)fe=Ze,H=de}}}O=H,H=y[O],me+=O-H&32767}}if(Q){v[F++]=268435456|Bc[K]<<18|gm[Q];var Oe=Bc[K]&31,ke=gm[Q]&31;_+=Bo[Oe]+Go[ke],++w[257+Oe],++E[ke],C=S+K,++R}else v[F++]=e[S],++w[e[S]]}}for(S=Math.max(S,C);S<o;++S)v[F++]=e[S],++w[e[S]];if(u=xm(e,c,l,v,w,E,_,F,z,S-z,u),!l)s.r=u&7|c[u/8|0]<<3,u-=7,s.h=p,s.p=y,s.i=S,s.w=C}else{for(var S=s.w||0;S<o+l;S+=65535){var Ke=S+65535;if(Ke>=o)c[u/8|0]=l,Ke=o;u=Em(c,u+1,e.subarray(S,Ke))}s.i=o}return As(a,0,i+Zc(u)+r)},Uv=function(){var e=new Int32Array(256);for(var t=0;t<256;++t){var n=t,i=9;while(--i)n=(n&1&&-306674912)^n>>>1;e[t]=n}return e}(),Ov=function(){var e=-1;return{p:function(t){var n=e;for(var i=0;i<t.length;++i)n=Uv[n&255^t[i]]^n>>>8;e=n},d:function(){return~e}}};var Fv=function(e,t,n,i,r){if(!r){if(r={l:1},t.dictionary){var s=t.dictionary.subarray(-32768),o=new bt(s.length+e.length);o.set(s),o.set(e,s.length),e=o,r.w=s.length}}return Dv(e,t.level==null?6:t.level,t.mem==null?r.l?Math.ceil(Math.max(8,Math.min(13,Math.log(e.length)))*1.5):20:12+t.mem,n,i,r)},Rm=function(e,t){var n={};for(var i in e)n[i]=e[i];for(var i in t)n[i]=t[i];return n};var Vn=function(e,t){return e[t]|e[t+1]<<8},Rn=function(e,t){return(e[t]|e[t+1]<<8|e[t+2]<<16|e[t+3]<<24)>>>0},zc=function(e,t){return Rn(e,t)+Rn(e,t+4)*4294967296},Wt=function(e,t,n){for(;n;++t)e[t]=n,n>>>=8};function zv(e,t){return Fv(e,t||{},0,0)}function kv(e,t){return Lv(e,{i:2},t&&t.out,t&&t.dictionary)}var Cm=function(e,t,n,i){for(var r in e){var s=e[r],o=t+r,a=i;if(Array.isArray(s))a=Rm(i,s[1]),s=s[0];if(s instanceof bt)n[o]=[s,a];else n[o+="/"]=[new bt(0),a],Cm(s,o,n,i)}},vm=typeof TextEncoder<"u"&&new TextEncoder,Vc=typeof TextDecoder<"u"&&new TextDecoder,Bv=0;try{Vc.decode(Am,{stream:!0}),Bv=1}catch(e){}var Gv=function(e){for(var t="",n=0;;){var i=e[n++],r=(i>127)+(i>223)+(i>239);if(n+r>e.length)return{s:t,r:As(e,n-1)};if(!r)t+=String.fromCharCode(i);else if(r==3)i=((i&15)<<18|(e[n++]&63)<<12|(e[n++]&63)<<6|e[n++]&63)-65536,t+=String.fromCharCode(55296|i>>10,56320|i&1023);else if(r&1)t+=String.fromCharCode((i&31)<<6|e[n++]&63);else t+=String.fromCharCode((i&15)<<12|(e[n++]&63)<<6|e[n++]&63)}};function ym(e,t){if(t){var n=new bt(e.length);for(var i=0;i<e.length;++i)n[i]=e.charCodeAt(i);return n}if(vm)return vm.encode(e);var r=e.length,s=new bt(e.length+(e.length>>1)),o=0,a=function(u){s[o++]=u};for(var i=0;i<r;++i){if(o+5>s.length){var c=new bt(o+8+(r-i<<1));c.set(s),s=c}var l=e.charCodeAt(i);if(l<128||t)a(l);else if(l<2048)a(192|l>>6),a(128|l&63);else if(l>55295&&l<57344)l=65536+(l&1047552)|e.charCodeAt(++i)&1023,a(240|l>>18),a(128|l>>12&63),a(128|l>>6&63),a(128|l&63);else a(224|l>>12),a(128|l>>6&63),a(128|l&63)}return As(s,0,o)}function Hv(e,t){if(t){var n="";for(var i=0;i<e.length;i+=16384)n+=String.fromCharCode.apply(null,e.subarray(i,i+16384));return n}else if(Vc)return Vc.decode(e);else{var r=Gv(e),{s,r:n}=r;if(n.length)Kt(8);return s}}var Vv=function(e,t){return t+30+Vn(e,t+26)+Vn(e,t+28)},Wv=function(e,t,n){var i=Vn(e,t+28),r=Hv(e.subarray(t+46,t+46+i),!(Vn(e,t+8)&2048)),s=t+46+i,o=Rn(e,t+20),a=n&&o==4294967295?$v(e,s):[o,Rn(e,t+24),Rn(e,t+42)],c=a[0],l=a[1],u=a[2];return[Vn(e,t+10),c,l,r,s+Vn(e,t+30)+Vn(e,t+32),u]},$v=function(e,t){for(;Vn(e,t)!=1;t+=4+Vn(e,t+2));return[zc(e,t+12),zc(e,t+4),zc(e,t+20)]},Wc=function(e){var t=0;if(e)for(var n in e){var i=e[n].length;if(i>65535)Kt(9);t+=i+4}return t},bm=function(e,t,n,i,r,s,o,a){var c=i.length,l=n.extra,u=a&&a.length,f=Wc(l);if(Wt(e,t,o!=null?33639248:67324752),t+=4,o!=null)e[t++]=20,e[t++]=n.os;e[t]=20,t+=2,e[t++]=n.flag<<1|(s<0&&8),e[t++]=r&&8,e[t++]=n.compression&255,e[t++]=n.compression>>8;var h=new Date(n.mtime==null?Date.now():n.mtime),d=h.getFullYear()-1980;if(d<0||d>119)Kt(10);if(Wt(e,t,d<<25|h.getMonth()+1<<21|h.getDate()<<16|h.getHours()<<11|h.getMinutes()<<5|h.getSeconds()>>1),t+=4,s!=-1)Wt(e,t,n.crc),Wt(e,t+4,s<0?-s-2:s),Wt(e,t+8,n.size);if(Wt(e,t+12,c),Wt(e,t+14,f),t+=16,o!=null)Wt(e,t,u),Wt(e,t+6,n.attrs),Wt(e,t+10,o),t+=14;if(e.set(i,t),t+=c,f)for(var g in l){var y=l[g],p=y.length;Wt(e,t,+g),Wt(e,t+2,p),e.set(y,t+4),t+=4+p}if(u)e.set(a,t),t+=u;return t},Zv=function(e,t,n,i,r){Wt(e,t,101010256),Wt(e,t+8,n),Wt(e,t+10,n),Wt(e,t+12,i),Wt(e,t+16,r)};function Im(e,t){if(!t)t={};var n={},i=[];Cm(e,"",n,t);var r=0,s=0;for(var o in n){var a=n[o],c=a[0],l=a[1],u=l.level==0?0:8,f=ym(o),h=f.length,d=l.comment,g=d&&ym(d),y=g&&g.length,p=Wc(l.extra);if(h>65535)Kt(11);var m=u?zv(c,l):c,A=m.length,T=Ov();T.p(c),i.push(Rm(l,{size:c.length,crc:T.d(),c:m,f,m:g,u:h!=o.length||g&&d.length!=y,o:r,compression:u})),r+=30+h+p+A,s+=76+2*(h+p)+(y||0)+A}var v=new bt(s+22),w=r,E=s-r;for(var R=0;R<i.length;++R){var f=i[R];bm(v,f.o,f,f.f,f.u,f.c.length);var _=30+f.f.length+Wc(f.extra);v.set(f.c,f.o+_),bm(v,r,f,f.f,f.u,f.c.length,f.o,f.m),r+=16+_+(f.m?f.m.length:0)}return Zv(v,r,i.length,E,w),v}function Pm(e,t){var n={},i=e.length-22;for(;Rn(e,i)!=101010256;--i)if(!i||e.length-i>65558)Kt(13);var r=Vn(e,i+8);if(!r)return{};var s=Rn(e,i+16),o=s==4294967295||r==65535;if(o){var a=Rn(e,i-12);if(o=Rn(e,a)==101075792,o)r=Rn(e,a+32),s=Rn(e,a+48)}var c=t&&t.filter;for(var l=0;l<r;++l){var u=Wv(e,s,o),f=u[0],h=u[1],d=u[2],g=u[3],y=u[4],p=u[5],m=Vv(e,p);if(s=y,!c||c({name:g,size:h,originalSize:d,compression:f}))if(!f)n[g]=As(e,m,m+h);else if(f==8)n[g]=kv(e.subarray(m,m+h),{out:new bt(d)});else Kt(14,"unknown compression type "+f)}return n}var si=67108864,Xc=Zt().regex(/^[a-z][a-z0-9_-]{0,79}$/),Xv=Zt().regex(/^sha256:[a-f0-9]{64}$/),Lm=Ms({version:ov("kiln.asset.v1"),assetId:Xc,revisionId:Xc,parentRevision:Xc.optional(),name:Zt().min(1).max(200),tags:ko(Zt().max(80)).max(30),createdAt:Zt().datetime(),description:Zt().max(4000).optional(),brief:Zt().max(8000).optional(),attribution:Ms({model:Zt().max(200).optional(),harness:Zt().max(200).optional(),author:Zt().max(200).optional()}).optional(),editable:Yx(),files:fm(Zt(),Ms({sha256:Xv,bytes:Zx().int().nonnegative().max(si)})),build:Ms({engine:Zt(),options:fm(Zt(),nr()),warnings:ko(Zt()),integration:nr().optional(),qa:nr().optional(),dependencies:ko(nr()).optional(),rebuild:dm(["engine-required","external-dependencies-required"])}).optional(),preview:Ms({fidelity:nr().optional(),error:Zt().optional()}).optional()}),qv=new Set(["asset.glb","source.kiln.js","preview.png"]);function Nm(e){let t=Lm.parse(e.manifest),n=Object.keys(e.files);if(n.length!==Object.keys(t.files).length||!n.includes("asset.glb"))throw Error("Asset file inventory mismatch");let i=0;for(let r of n){if(!qv.has(r)||!t.files[r]||t.files[r].bytes!==e.files[r].length)throw Error("Invalid asset file inventory");i+=e.files[r].length}if(i>si||t.editable!==n.includes("source.kiln.js"))throw Error("Invalid asset size or source inventory");if((e.files["source.kiln.js"]?.length??0)>1048576)throw Error("Source exceeds 1 MiB");qc(e.files["asset.glb"])}function qc(e){if(e.length<20||e.length>si)throw Error("Invalid GLB size");let t=new DataView(e.buffer,e.byteOffset,e.byteLength);if(t.getUint32(0,!0)!==1179937895||t.getUint32(4,!0)!==2||t.getUint32(8,!0)!==e.length||t.getUint32(16,!0)!==1313821514)throw Error("Invalid GLB header");let n=20+t.getUint32(12,!0);if(n>e.length)throw Error("Invalid GLB JSON length");let i=JSON.parse(new TextDecoder().decode(e.subarray(20,n)));for(let r of[...i.buffers??[],...i.images??[]])if(r.uri&&!String(r.uri).startsWith("data:"))throw Error("GLB must embed its resources")}function Yc(e){if(!e.length||e.length>100)throw Error("Bundle requires 1..100 revisions");let t={},n=0;for(let i of e){Nm(i);let r=`${i.manifest.assetId}/${i.manifest.revisionId}/`;if(t[`${r}manifest.json`])throw Error("Duplicate bundle revision");t[`${r}manifest.json`]=new TextEncoder().encode(JSON.stringify(i.manifest,null,2));for(let[s,o]of Object.entries(i.files))t[r+s]=o}for(let i of Object.values(t))n+=i.length;if(n>si)throw Error("Bundle exceeds 64 MiB");return Im(t,{level:0})}function Dm(e){if(e.length>si+1048576)throw Error("Bundle exceeds 64 MiB");let t=0,n=0,i=Pm(e,{filter:(o)=>{if(t+=o.originalSize,n++,t>si||n>400||!/^[a-z][a-z0-9_-]{0,79}\/[a-z][a-z0-9_-]{0,79}\/(manifest\.json|asset\.glb|source\.kiln\.js|preview\.png)$/.test(o.name))throw Error("Unsafe or oversized asset bundle");return!0}}),r=[],s=new Set;for(let[o,a]of Object.entries(i)){if(!o.endsWith("/manifest.json"))continue;if(a.length>1048576)throw Error("Manifest exceeds 1 MiB");let c=Lm.parse(JSON.parse(new TextDecoder().decode(a))),l=`${c.assetId}/${c.revisionId}/`;if(o!==`${l}manifest.json`)throw Error("Bundle identity mismatch");let u={manifest:c,files:{}};s.add(o);for(let f of Object.keys(c.files)){if(!i[l+f])throw Error("Bundle file missing");u.files[f]=i[l+f],s.add(l+f)}Nm(u),r.push(u)}if(!r.length||s.size!==Object.keys(i).length)throw Error("Incomplete asset bundle");return r}var _g="185",Ni={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Di={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},xg=0,Ml=1,vg=2;var ks=1,yg=2,Zr=3,Ui=0,Yt=1,bn=2,Yn=0,Bs=1,wl=2,Tl=3,El=4,bg=5;var Xr=100,Sg=101,Mg=102,wg=103,Tg=104,Eg=200,Ag=201,Rg=202,Cg=203,Ig=204,Pg=205,Lg=206,Ng=207,Dg=208,Ug=209,Og=210,Fg=211,zg=212,kg=213,Bg=214,Gg=0,Hg=1,Vg=2,Al=3,Wg=4,$g=5,Zg=6,Xg=7,qg=0,Yg=1,jg=2,Un=0,Rl=1,Cl=2,Il=3,Gs=4,Pl=5,Ll=6,Nl=7;var qr=301,ur=302,ga=303,_a=304,Hs=306,Yr=1000,jr=1001,xa=1002,On=1003,va=1004;var hr=1005;var Gt=1006,Jr=1007;var jn=1008;var Fn=1009,Jg=1010,Kg=1011,Vs=1012,Dl=1013,Oi=1014,di=1015,pi=1016,Ul=1017,Ol=1018,Kr=1020,Qg=35902,e_=35899,t_=1021,n_=1022,Jn=1023,fr=1026,dr=1027,i_=1028,Fl=1029,pr=1030,zl=1031;var kl=1033,ya=33776,ba=33777,Sa=33778,Ma=33779,Bl=35840,Gl=35841,Hl=35842,Vl=35843,Wl=36196,$l=37492,Zl=37496,Xl=37488,ql=37489,wa=37490,Yl=37491,jl=37808,Jl=37809,Kl=37810,Ql=37811,eu=37812,tu=37813,nu=37814,iu=37815,ru=37816,su=37817,ou=37818,au=37819,cu=37820,lu=37821,uu=36492,hu=36494,fu=36495,du=36283,pu=36284,Ta=36285,mu=36286;var gu=2300,Ea=2301;var _u=0,Ws=1,Qr=2;var xu=0,r_=1,mr="",Fi="srgb",hn="srgb-linear",vu="linear",ht="srgb";var s_=512,o_=513,a_=514,Aa=515,c_=516,l_=517,Ra=518,u_=519;var yu="300 es",bu=2000;function Yv(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function jv(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Vr(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function h_(){let e=Vr("canvas");return e.style.display="block",e}var Um={},Wr=null;function zs(...e){let t="THREE."+e.shift();if(Wr)Wr("log",t,...e);else console.log(t,...e)}function f_(e){let t=e[0];if(typeof t==="string"&&t.startsWith("TSL:")){let n=e[1];if(n&&n.isStackTrace)e[0]+=" "+n.getLocation();else e[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return e}function Me(...e){e=f_(e);let t="THREE."+e.shift();if(Wr)Wr("warn",t,...e);else{let n=e[0];if(n&&n.isStackTrace)console.warn(n.getError(t));else console.warn(t,...e)}}function Ne(...e){e=f_(e);let t="THREE."+e.shift();if(Wr)Wr("error",t,...e);else{let n=e[0];if(n&&n.isStackTrace)console.error(n.getError(t));else console.error(t,...e)}}function ar(...e){let t=e.join(" ");if(t in Um)return;Um[t]=!0,Me(...e)}function d_(e,t,n){return new Promise(function(i,r){function s(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:r();break;case e.TIMEOUT_EXPIRED:setTimeout(s,n);break;default:i()}}setTimeout(s,n)})}var p_={[0]:1,[2]:6,[4]:7,[3]:5,[1]:0,[6]:2,[7]:4,[5]:3};class zn{addEventListener(e,t){if(this._listeners===void 0)this._listeners={};let n=this._listeners;if(n[e]===void 0)n[e]=[];if(n[e].indexOf(t)===-1)n[e].push(t)}hasEventListener(e,t){let n=this._listeners;if(n===void 0)return!1;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let i=n[e];if(i!==void 0){let r=i.indexOf(t);if(r!==-1)i.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let i=n.slice(0);for(let r=0,s=i.length;r<s;r++)i[r].call(this,e);e.target=null}}}var Xt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Om=1234567,Os=Math.PI/180,cr=180/Math.PI;function Dn(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Xt[e&255]+Xt[e>>8&255]+Xt[e>>16&255]+Xt[e>>24&255]+"-"+Xt[t&255]+Xt[t>>8&255]+"-"+Xt[t>>16&15|64]+Xt[t>>24&255]+"-"+Xt[n&63|128]+Xt[n>>8&255]+"-"+Xt[n>>16&255]+Xt[n>>24&255]+Xt[i&255]+Xt[i>>8&255]+Xt[i>>16&255]+Xt[i>>24&255]).toLowerCase()}function $e(e,t,n){return Math.max(t,Math.min(n,e))}function Su(e,t){return(e%t+t)%t}function Jv(e,t,n,i,r){return i+(e-t)*(r-i)/(n-t)}function Kv(e,t,n){if(e!==t)return(n-e)/(t-e);else return 0}function Fs(e,t,n){return(1-n)*e+n*t}function Qv(e,t,n,i){return Fs(e,t,1-Math.exp(-n*i))}function ey(e,t=1){return t-Math.abs(Su(e,t*2)-t)}function ty(e,t,n){if(e<=t)return 0;if(e>=n)return 1;return e=(e-t)/(n-t),e*e*(3-2*e)}function ny(e,t,n){if(e<=t)return 0;if(e>=n)return 1;return e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10)}function iy(e,t){return e+Math.floor(Math.random()*(t-e+1))}function ry(e,t){return e+Math.random()*(t-e)}function sy(e){return e*(0.5-Math.random())}function oy(e){if(e!==void 0)Om=e;let t=Om+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function ay(e){return e*Os}function cy(e){return e*cr}function ly(e){return(e&e-1)===0&&e!==0}function uy(e){return Math.pow(2,Math.ceil(Math.log(e)/Math.LN2))}function hy(e){return Math.pow(2,Math.floor(Math.log(e)/Math.LN2))}function fy(e,t,n,i,r){let{cos:s,sin:o}=Math,a=s(n/2),c=o(n/2),l=s((t+i)/2),u=o((t+i)/2),f=s((t-i)/2),h=o((t-i)/2),d=s((i-t)/2),g=o((i-t)/2);switch(r){case"XYX":e.set(a*u,c*f,c*h,a*l);break;case"YZY":e.set(c*h,a*u,c*f,a*l);break;case"ZXZ":e.set(c*f,c*h,a*u,a*l);break;case"XZX":e.set(a*u,c*g,c*d,a*l);break;case"YXY":e.set(c*d,a*u,c*g,a*l);break;case"ZYZ":e.set(c*g,c*d,a*u,a*l);break;default:Me("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Nn(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error("THREE.MathUtils: Invalid component type.")}}function rt(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error("THREE.MathUtils: Invalid component type.")}}var $s={DEG2RAD:Os,RAD2DEG:cr,generateUUID:Dn,clamp:$e,euclideanModulo:Su,mapLinear:Jv,inverseLerp:Kv,lerp:Fs,damp:Qv,pingpong:ey,smoothstep:ty,smootherstep:ny,randInt:iy,randFloat:ry,randFloatSpread:sy,seededRandom:oy,degToRad:ay,radToDeg:cy,isPowerOfTwo:ly,ceilPowerOfTwo:uy,floorPowerOfTwo:hy,setQuaternionFromProperEuler:fy,normalize:rt,denormalize:Nn};class Ie{static{Ie.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=$e(this.x,e.x,t.x),this.y=$e(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=$e(this.x,e,t),this.y=$e(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar($e(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos($e(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,s=this.y-e.y;return this.x=r*n-s*i+e.x,this.y=r*i+s*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Bt{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,s,o){let a=n[i+0],c=n[i+1],l=n[i+2],u=n[i+3],f=r[s+0],h=r[s+1],d=r[s+2],g=r[s+3];if(u!==g||a!==f||c!==h||l!==d){let y=a*f+c*h+l*d+u*g;if(y<0)f=-f,h=-h,d=-d,g=-g,y=-y;let p=1-o;if(y<0.9995){let m=Math.acos(y),A=Math.sin(m);p=Math.sin(p*m)/A,o=Math.sin(o*m)/A,a=a*p+f*o,c=c*p+h*o,l=l*p+d*o,u=u*p+g*o}else{a=a*p+f*o,c=c*p+h*o,l=l*p+d*o,u=u*p+g*o;let m=1/Math.sqrt(a*a+c*c+l*l+u*u);a*=m,c*=m,l*=m,u*=m}}e[t]=a,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,r,s){let o=n[i],a=n[i+1],c=n[i+2],l=n[i+3],u=r[s],f=r[s+1],h=r[s+2],d=r[s+3];return e[t]=o*d+l*u+a*h-c*f,e[t+1]=a*d+l*f+c*u-o*h,e[t+2]=c*d+l*h+o*f-a*u,e[t+3]=l*d-o*u-a*f-c*h,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let{_x:n,_y:i,_z:r,_order:s}=e,{cos:o,sin:a}=Math,c=o(n/2),l=o(i/2),u=o(r/2),f=a(n/2),h=a(i/2),d=a(r/2);switch(s){case"XYZ":this._x=f*l*u+c*h*d,this._y=c*h*u-f*l*d,this._z=c*l*d+f*h*u,this._w=c*l*u-f*h*d;break;case"YXZ":this._x=f*l*u+c*h*d,this._y=c*h*u-f*l*d,this._z=c*l*d-f*h*u,this._w=c*l*u+f*h*d;break;case"ZXY":this._x=f*l*u-c*h*d,this._y=c*h*u+f*l*d,this._z=c*l*d+f*h*u,this._w=c*l*u-f*h*d;break;case"ZYX":this._x=f*l*u-c*h*d,this._y=c*h*u+f*l*d,this._z=c*l*d-f*h*u,this._w=c*l*u+f*h*d;break;case"YZX":this._x=f*l*u+c*h*d,this._y=c*h*u+f*l*d,this._z=c*l*d-f*h*u,this._w=c*l*u-f*h*d;break;case"XZY":this._x=f*l*u-c*h*d,this._y=c*h*u-f*l*d,this._z=c*l*d+f*h*u,this._w=c*l*u+f*h*d;break;default:Me("Quaternion: .setFromEuler() encountered an unknown order: "+s)}if(t===!0)this._onChangeCallback();return this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],r=t[8],s=t[1],o=t[5],a=t[9],c=t[2],l=t[6],u=t[10],f=n+o+u;if(f>0){let h=0.5/Math.sqrt(f+1);this._w=0.25/h,this._x=(l-a)*h,this._y=(r-c)*h,this._z=(s-i)*h}else if(n>o&&n>u){let h=2*Math.sqrt(1+n-o-u);this._w=(l-a)/h,this._x=0.25*h,this._y=(i+s)/h,this._z=(r+c)/h}else if(o>u){let h=2*Math.sqrt(1+o-n-u);this._w=(r-c)/h,this._x=(i+s)/h,this._y=0.25*h,this._z=(a+l)/h}else{let h=2*Math.sqrt(1+u-n-o);this._w=(s-i)/h,this._x=(r+c)/h,this._y=(a+l)/h,this._z=0.25*h}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;if(n<0.00000001)if(n=0,Math.abs(e.x)>Math.abs(e.z))this._x=-e.y,this._y=e.x,this._z=0,this._w=n;else this._x=0,this._y=-e.z,this._z=e.y,this._w=n;else this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n;return this.normalize()}angleTo(e){return 2*Math.acos(Math.abs($e(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();if(e===0)this._x=0,this._y=0,this._z=0,this._w=1;else e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e;return this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let{_x:n,_y:i,_z:r,_w:s}=e,{_x:o,_y:a,_z:c,_w:l}=t;return this._x=n*l+s*o+i*c-r*a,this._y=i*l+s*a+r*o-n*c,this._z=r*l+s*c+n*a-i*o,this._w=s*l-n*o-i*a-r*c,this._onChangeCallback(),this}slerp(e,t){let{_x:n,_y:i,_z:r,_w:s}=e,o=this.dot(e);if(o<0)n=-n,i=-i,r=-r,s=-s,o=-o;let a=1-t;if(o<0.9995){let c=Math.acos(o),l=Math.sin(c);a=Math.sin(a*c)/l,t=Math.sin(t*c)/l,this._x=this._x*a+n*t,this._y=this._y*a+i*t,this._z=this._z*a+r*t,this._w=this._w*a+s*t,this._onChangeCallback()}else this._x=this._x*a+n*t,this._y=this._y*a+i*t,this._z=this._z*a+r*t,this._w=this._w*a+s*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class N{static{N.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){if(n===void 0)n=this.z;return this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Fm.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Fm.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=e.elements,s=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*s,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*s,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*s,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,{x:r,y:s,z:o,w:a}=e,c=2*(s*i-o*n),l=2*(o*t-r*i),u=2*(r*n-s*t);return this.x=t+a*c+s*u-o*l,this.y=n+a*l+o*c-r*u,this.z=i+a*u+r*l-s*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=$e(this.x,e.x,t.x),this.y=$e(this.y,e.y,t.y),this.z=$e(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=$e(this.x,e,t),this.y=$e(this.y,e,t),this.z=$e(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar($e(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let{x:n,y:i,z:r}=e,{x:s,y:o,z:a}=t;return this.x=i*a-r*o,this.y=r*s-n*a,this.z=n*o-i*s,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return jc.copy(this).projectOnVector(e),this.sub(jc)}reflect(e){return this.sub(jc.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos($e(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}var jc=new N,Fm=new Bt;class Ue{static{Ue.prototype.isMatrix3=!0}constructor(e,t,n,i,r,s,o,a,c){if(this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0)this.set(e,t,n,i,r,s,o,a,c)}set(e,t,n,i,r,s,o,a,c){let l=this.elements;return l[0]=e,l[1]=i,l[2]=o,l[3]=t,l[4]=r,l[5]=a,l[6]=n,l[7]=s,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,s=n[0],o=n[3],a=n[6],c=n[1],l=n[4],u=n[7],f=n[2],h=n[5],d=n[8],g=i[0],y=i[3],p=i[6],m=i[1],A=i[4],T=i[7],v=i[2],w=i[5],E=i[8];return r[0]=s*g+o*m+a*v,r[3]=s*y+o*A+a*w,r[6]=s*p+o*T+a*E,r[1]=c*g+l*m+u*v,r[4]=c*y+l*A+u*w,r[7]=c*p+l*T+u*E,r[2]=f*g+h*m+d*v,r[5]=f*y+h*A+d*w,r[8]=f*p+h*T+d*E,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],s=e[4],o=e[5],a=e[6],c=e[7],l=e[8];return t*s*l-t*o*c-n*r*l+n*o*a+i*r*c-i*s*a}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],s=e[4],o=e[5],a=e[6],c=e[7],l=e[8],u=l*s-o*c,f=o*a-l*r,h=c*r-s*a,d=t*u+n*f+i*h;if(d===0)return this.set(0,0,0,0,0,0,0,0,0);let g=1/d;return e[0]=u*g,e[1]=(i*c-l*n)*g,e[2]=(o*n-i*s)*g,e[3]=f*g,e[4]=(l*t-i*a)*g,e[5]=(i*r-o*t)*g,e[6]=h*g,e[7]=(n*a-c*t)*g,e[8]=(s*t-n*r)*g,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,s,o){let a=Math.cos(r),c=Math.sin(r);return this.set(n*a,n*c,-n*(a*s+c*o)+s+e,-i*c,i*a,-i*(-c*s+a*o)+o+t,0,0,1),this}scale(e,t){return ar("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Jc.makeScale(e,t)),this}rotate(e){return ar("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Jc.makeRotation(-e)),this}translate(e,t){return ar("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Jc.makeTranslation(e,t)),this}makeTranslation(e,t){if(e.isVector2)this.set(1,0,e.x,0,1,e.y,0,0,1);else this.set(1,0,e,0,1,t,0,0,1);return this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}var Jc=new Ue,zm=new Ue().set(0.4123908,0.3575843,0.1804808,0.212639,0.7151687,0.0721923,0.0193308,0.1191948,0.9505322),km=new Ue().set(3.2409699,-1.5373832,-0.4986108,-0.9692436,1.8759675,0.0415551,0.0556301,-0.203977,1.0569715);function dy(){let e={enabled:!0,workingColorSpace:"srgb-linear",spaces:{},convert:function(r,s,o){if(this.enabled===!1||s===o||!s||!o)return r;if(this.spaces[s].transfer==="srgb")r.r=fi(r.r),r.g=fi(r.g),r.b=fi(r.b);if(this.spaces[s].primaries!==this.spaces[o].primaries)r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ);if(this.spaces[o].transfer==="srgb")r.r=Hr(r.r),r.g=Hr(r.g),r.b=Hr(r.b);return r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){if(r==="")return"linear";return this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return ar("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),e.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return ar("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),e.colorSpaceToWorking(r,s)}},t=[0.64,0.33,0.3,0.6,0.15,0.06],n=[0.2126,0.7152,0.0722],i=[0.3127,0.329];return e.define({["srgb-linear"]:{primaries:t,whitePoint:i,transfer:"linear",toXYZ:zm,fromXYZ:km,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:"srgb"},outputColorSpaceConfig:{drawingBufferColorSpace:"srgb"}},["srgb"]:{primaries:t,whitePoint:i,transfer:"srgb",toXYZ:zm,fromXYZ:km,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:"srgb"}}}),e}var We=dy();function fi(e){return e<0.04045?e*0.0773993808:Math.pow(e*0.9478672986+0.0521327014,2.4)}function Hr(e){return e<0.0031308?e*12.92:1.055*Math.pow(e,0.41666)-0.055}var Rr;class Mu{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src))return e.src;if(typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{if(Rr===void 0)Rr=Vr("canvas");Rr.width=e.width,Rr.height=e.height;let i=Rr.getContext("2d");if(e instanceof ImageData)i.putImageData(e,0,0);else i.drawImage(e,0,0,e.width,e.height);n=Rr}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Vr("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let s=0;s<r.length;s++)r[s]=fi(r[s]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)if(t instanceof Uint8Array||t instanceof Uint8ClampedArray)t[n]=Math.floor(fi(t[n]/255)*255);else t[n]=fi(t[n]);return{data:t,width:e.width,height:e.height}}else return Me("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}var py=0;class Zs{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:py++}),this.uuid=Dn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;if(typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement)e.set(t.videoWidth,t.videoHeight,0);else if(typeof VideoFrame<"u"&&t instanceof VideoFrame)e.set(t.displayWidth,t.displayHeight,0);else if(t!==null)e.set(t.width,t.height,t.depth||0);else e.set(0,0,0);return e}set needsUpdate(e){if(e===!0)this.version++}toJSON(e){let t=e===void 0||typeof e==="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let s=0,o=i.length;s<o;s++)if(i[s].isDataTexture)r.push(Kc(i[s].image));else r.push(Kc(i[s]))}else r=Kc(i);n.url=r}if(!t)e.images[this.uuid]=n;return n}}function Kc(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap)return Mu.getDataURL(e);else if(e.data)return{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name};else return Me("Texture: Unable to serialize Texture."),{}}var my=0,Qc=new N;class wt extends zn{constructor(e=wt.DEFAULT_IMAGE,t=wt.DEFAULT_MAPPING,n=1001,i=1001,r=1006,s=1008,o=1023,a=1009,c=wt.DEFAULT_ANISOTROPY,l=""){super();this.isTexture=!0,Object.defineProperty(this,"id",{value:my++}),this.uuid=Dn(),this.name="",this.source=new Zs(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=s,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=a,this.offset=new Ie(0,0),this.repeat=new Ie(1,1),this.center=new Ie(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ue,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=l,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=e&&e.depth&&e.depth>1?!0:!1,this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Qc).x}get height(){return this.source.getSize(Qc).y}get depth(){return this.source.getSize(Qc).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){Me(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){Me(`Texture.setValues(): property '${t}' does not exist.`);continue}if(i&&n&&(i.isVector2&&n.isVector2))i.copy(n);else if(i&&n&&(i.isVector3&&n.isVector3))i.copy(n);else if(i&&n&&(i.isMatrix3&&n.isMatrix3))i.copy(n);else this[t]=n}}toJSON(e){let t=e===void 0||typeof e==="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};if(Object.keys(this.userData).length>0)n.userData=this.userData;if(!t)e.textures[this.uuid]=n;return n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case 1000:e.x=e.x-Math.floor(e.x);break;case 1001:e.x=e.x<0?0:1;break;case 1002:if(Math.abs(Math.floor(e.x)%2)===1)e.x=Math.ceil(e.x)-e.x;else e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case 1000:e.y=e.y-Math.floor(e.y);break;case 1001:e.y=e.y<0?0:1;break;case 1002:if(Math.abs(Math.floor(e.y)%2)===1)e.y=Math.ceil(e.y)-e.y;else e.y=e.y-Math.floor(e.y);break}if(this.flipY)e.y=1-e.y;return e}set needsUpdate(e){if(e===!0)this.version++,this.source.needsUpdate=!0}set needsPMREMUpdate(e){if(e===!0)this.pmremVersion++}}wt.DEFAULT_IMAGE=null;wt.DEFAULT_MAPPING=300;wt.DEFAULT_ANISOTROPY=1;class st{static{st.prototype.isVector4=!0}constructor(e=0,t=0,n=0,i=1){this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=this.w,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*i+s[12]*r,this.y=s[1]*t+s[5]*n+s[9]*i+s[13]*r,this.z=s[2]*t+s[6]*n+s[10]*i+s[14]*r,this.w=s[3]*t+s[7]*n+s[11]*i+s[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);if(t<0.0001)this.x=1,this.y=0,this.z=0;else this.x=e.x/t,this.y=e.y/t,this.z=e.z/t;return this}setAxisAngleFromRotationMatrix(e){let t,n,i,r,s=0.01,o=0.1,a=e.elements,c=a[0],l=a[4],u=a[8],f=a[1],h=a[5],d=a[9],g=a[2],y=a[6],p=a[10];if(Math.abs(l-f)<0.01&&Math.abs(u-g)<0.01&&Math.abs(d-y)<0.01){if(Math.abs(l+f)<0.1&&Math.abs(u+g)<0.1&&Math.abs(d+y)<0.1&&Math.abs(c+h+p-3)<0.1)return this.set(1,0,0,0),this;t=Math.PI;let A=(c+1)/2,T=(h+1)/2,v=(p+1)/2,w=(l+f)/4,E=(u+g)/4,R=(d+y)/4;if(A>T&&A>v)if(A<0.01)n=0,i=0.707106781,r=0.707106781;else n=Math.sqrt(A),i=w/n,r=E/n;else if(T>v)if(T<0.01)n=0.707106781,i=0,r=0.707106781;else i=Math.sqrt(T),n=w/i,r=R/i;else if(v<0.01)n=0.707106781,i=0.707106781,r=0;else r=Math.sqrt(v),n=E/r,i=R/r;return this.set(n,i,r,t),this}let m=Math.sqrt((y-d)*(y-d)+(u-g)*(u-g)+(f-l)*(f-l));if(Math.abs(m)<0.001)m=1;return this.x=(y-d)/m,this.y=(u-g)/m,this.z=(f-l)/m,this.w=Math.acos((c+h+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=$e(this.x,e.x,t.x),this.y=$e(this.y,e.y,t.y),this.z=$e(this.z,e.z,t.z),this.w=$e(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=$e(this.x,e,t),this.y=$e(this.y,e,t),this.z=$e(this.z,e,t),this.w=$e(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar($e(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class wu extends zn{constructor(e=1,t=1,n={}){super();n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new st(0,0,e,t),this.scissorTest=!1,this.viewport=new st(0,0,e,t),this.textures=[];let i={width:e,height:t,depth:n.depth},r=new wt(i),s=n.count;for(let o=0;o<s;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:1006,generateMipmaps:!1,flipY:!1,internalFormat:null};if(e.mapping!==void 0)t.mapping=e.mapping;if(e.wrapS!==void 0)t.wrapS=e.wrapS;if(e.wrapT!==void 0)t.wrapT=e.wrapT;if(e.wrapR!==void 0)t.wrapR=e.wrapR;if(e.magFilter!==void 0)t.magFilter=e.magFilter;if(e.minFilter!==void 0)t.minFilter=e.minFilter;if(e.format!==void 0)t.format=e.format;if(e.type!==void 0)t.type=e.type;if(e.anisotropy!==void 0)t.anisotropy=e.anisotropy;if(e.colorSpace!==void 0)t.colorSpace=e.colorSpace;if(e.flipY!==void 0)t.flipY=e.flipY;if(e.generateMipmaps!==void 0)t.generateMipmaps=e.generateMipmaps;if(e.internalFormat!==void 0)t.internalFormat=e.internalFormat;for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){if(this._depthTexture!==null)this._depthTexture.renderTarget=null;if(e!==null)e.renderTarget=this;this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)if(this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isData3DTexture!==!0)this.textures[i].isArrayTexture=this.textures[i].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let i=Object.assign({},e.textures[t].image);this.textures[t].source=new Zs(i)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null)this.depthTexture=e.depthTexture.clone();return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Sn extends wu{constructor(e=1,t=1,n={}){super(e,t,n);this.isWebGLRenderTarget=!0}}class Ca extends wt{constructor(e=null,t=1,n=1,i=1){super(null);this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Tu extends wt{constructor(e=null,t=1,n=1,i=1){super(null);this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class ze{static{ze.prototype.isMatrix4=!0}constructor(e,t,n,i,r,s,o,a,c,l,u,f,h,d,g,y){if(this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0)this.set(e,t,n,i,r,s,o,a,c,l,u,f,h,d,g,y)}set(e,t,n,i,r,s,o,a,c,l,u,f,h,d,g,y){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=i,p[1]=r,p[5]=s,p[9]=o,p[13]=a,p[2]=c,p[6]=l,p[10]=u,p[14]=f,p[3]=h,p[7]=d,p[11]=g,p[15]=y,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ze().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){if(this.determinantAffine()===0)return e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this;return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,i=1/Cr.setFromMatrixColumn(e,0).length(),r=1/Cr.setFromMatrixColumn(e,1).length(),s=1/Cr.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*s,t[9]=n[9]*s,t[10]=n[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,{x:n,y:i,z:r}=e,s=Math.cos(n),o=Math.sin(n),a=Math.cos(i),c=Math.sin(i),l=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let f=s*l,h=s*u,d=o*l,g=o*u;t[0]=a*l,t[4]=-a*u,t[8]=c,t[1]=h+d*c,t[5]=f-g*c,t[9]=-o*a,t[2]=g-f*c,t[6]=d+h*c,t[10]=s*a}else if(e.order==="YXZ"){let f=a*l,h=a*u,d=c*l,g=c*u;t[0]=f+g*o,t[4]=d*o-h,t[8]=s*c,t[1]=s*u,t[5]=s*l,t[9]=-o,t[2]=h*o-d,t[6]=g+f*o,t[10]=s*a}else if(e.order==="ZXY"){let f=a*l,h=a*u,d=c*l,g=c*u;t[0]=f-g*o,t[4]=-s*u,t[8]=d+h*o,t[1]=h+d*o,t[5]=s*l,t[9]=g-f*o,t[2]=-s*c,t[6]=o,t[10]=s*a}else if(e.order==="ZYX"){let f=s*l,h=s*u,d=o*l,g=o*u;t[0]=a*l,t[4]=d*c-h,t[8]=f*c+g,t[1]=a*u,t[5]=g*c+f,t[9]=h*c-d,t[2]=-c,t[6]=o*a,t[10]=s*a}else if(e.order==="YZX"){let f=s*a,h=s*c,d=o*a,g=o*c;t[0]=a*l,t[4]=g-f*u,t[8]=d*u+h,t[1]=u,t[5]=s*l,t[9]=-o*l,t[2]=-c*l,t[6]=h*u+d,t[10]=f-g*u}else if(e.order==="XZY"){let f=s*a,h=s*c,d=o*a,g=o*c;t[0]=a*l,t[4]=-u,t[8]=c*l,t[1]=f*u+g,t[5]=s*l,t[9]=h*u-d,t[2]=d*u-h,t[6]=o*l,t[10]=g*u+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(gy,e,_y)}lookAt(e,t,n){let i=this.elements;if(ln.subVectors(e,t),ln.lengthSq()===0)ln.z=1;if(ln.normalize(),Ai.crossVectors(n,ln),Ai.lengthSq()===0){if(Math.abs(n.z)===1)ln.x+=0.0001;else ln.z+=0.0001;ln.normalize(),Ai.crossVectors(n,ln)}return Ai.normalize(),Ho.crossVectors(ln,Ai),i[0]=Ai.x,i[4]=Ho.x,i[8]=ln.x,i[1]=Ai.y,i[5]=Ho.y,i[9]=ln.y,i[2]=Ai.z,i[6]=Ho.z,i[10]=ln.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,s=n[0],o=n[4],a=n[8],c=n[12],l=n[1],u=n[5],f=n[9],h=n[13],d=n[2],g=n[6],y=n[10],p=n[14],m=n[3],A=n[7],T=n[11],v=n[15],w=i[0],E=i[4],R=i[8],_=i[12],S=i[1],F=i[5],C=i[9],z=i[13],J=i[2],O=i[6],H=i[10],V=i[14],U=i[3],K=i[7],Q=i[11],se=i[15];return r[0]=s*w+o*S+a*J+c*U,r[4]=s*E+o*F+a*O+c*K,r[8]=s*R+o*C+a*H+c*Q,r[12]=s*_+o*z+a*V+c*se,r[1]=l*w+u*S+f*J+h*U,r[5]=l*E+u*F+f*O+h*K,r[9]=l*R+u*C+f*H+h*Q,r[13]=l*_+u*z+f*V+h*se,r[2]=d*w+g*S+y*J+p*U,r[6]=d*E+g*F+y*O+p*K,r[10]=d*R+g*C+y*H+p*Q,r[14]=d*_+g*z+y*V+p*se,r[3]=m*w+A*S+T*J+v*U,r[7]=m*E+A*F+T*O+v*K,r[11]=m*R+A*C+T*H+v*Q,r[15]=m*_+A*z+T*V+v*se,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],s=e[1],o=e[5],a=e[9],c=e[13],l=e[2],u=e[6],f=e[10],h=e[14],d=e[3],g=e[7],y=e[11],p=e[15],m=a*h-c*f,A=o*h-c*u,T=o*f-a*u,v=s*h-c*l,w=s*f-a*l,E=s*u-o*l;return t*(g*m-y*A+p*T)-n*(d*m-y*v+p*w)+i*(d*A-g*v+p*E)-r*(d*T-g*w+y*E)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[1],s=e[5],o=e[9],a=e[2],c=e[6],l=e[10];return t*(s*l-o*c)-n*(r*l-o*a)+i*(r*c-s*a)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;if(e.isVector3)i[12]=e.x,i[13]=e.y,i[14]=e.z;else i[12]=e,i[13]=t,i[14]=n;return this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],s=e[4],o=e[5],a=e[6],c=e[7],l=e[8],u=e[9],f=e[10],h=e[11],d=e[12],g=e[13],y=e[14],p=e[15],m=t*o-n*s,A=t*a-i*s,T=t*c-r*s,v=n*a-i*o,w=n*c-r*o,E=i*c-r*a,R=l*g-u*d,_=l*y-f*d,S=l*p-h*d,F=u*y-f*g,C=u*p-h*g,z=f*p-h*y,J=m*z-A*C+T*F+v*S-w*_+E*R;if(J===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let O=1/J;return e[0]=(o*z-a*C+c*F)*O,e[1]=(i*C-n*z-r*F)*O,e[2]=(g*E-y*w+p*v)*O,e[3]=(f*w-u*E-h*v)*O,e[4]=(a*S-s*z-c*_)*O,e[5]=(t*z-i*S+r*_)*O,e[6]=(y*T-d*E-p*A)*O,e[7]=(l*E-f*T+h*A)*O,e[8]=(s*C-o*S+c*R)*O,e[9]=(n*S-t*C-r*R)*O,e[10]=(d*w-g*T+p*m)*O,e[11]=(u*T-l*w-h*m)*O,e[12]=(o*_-s*F-a*R)*O,e[13]=(t*F-n*_+i*R)*O,e[14]=(g*A-d*v-y*m)*O,e[15]=(l*v-u*A+f*m)*O,this}scale(e){let t=this.elements,{x:n,y:i,z:r}=e;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){if(e.isVector3)this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1);else this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1);return this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),r=1-n,{x:s,y:o,z:a}=e,c=r*s,l=r*o;return this.set(c*s+n,c*o-i*a,c*a+i*o,0,c*o+i*a,l*o+n,l*a-i*s,0,c*a-i*o,l*a+i*s,r*a*a+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,s){return this.set(1,n,r,0,e,1,s,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,{_x:r,_y:s,_z:o,_w:a}=t,c=r+r,l=s+s,u=o+o,f=r*c,h=r*l,d=r*u,g=s*l,y=s*u,p=o*u,m=a*c,A=a*l,T=a*u,{x:v,y:w,z:E}=n;return i[0]=(1-(g+p))*v,i[1]=(h+T)*v,i[2]=(d-A)*v,i[3]=0,i[4]=(h-T)*w,i[5]=(1-(f+p))*w,i[6]=(y+m)*w,i[7]=0,i[8]=(d+A)*E,i[9]=(y-m)*E,i[10]=(1-(f+g))*E,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements;e.x=i[12],e.y=i[13],e.z=i[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let s=Cr.set(i[0],i[1],i[2]).length(),o=Cr.set(i[4],i[5],i[6]).length(),a=Cr.set(i[8],i[9],i[10]).length();if(r<0)s=-s;Cn.copy(this);let c=1/s,l=1/o,u=1/a;return Cn.elements[0]*=c,Cn.elements[1]*=c,Cn.elements[2]*=c,Cn.elements[4]*=l,Cn.elements[5]*=l,Cn.elements[6]*=l,Cn.elements[8]*=u,Cn.elements[9]*=u,Cn.elements[10]*=u,t.setFromRotationMatrix(Cn),n.x=s,n.y=o,n.z=a,this}makePerspective(e,t,n,i,r,s,o=2000,a=!1){let c=this.elements,l=2*r/(t-e),u=2*r/(n-i),f=(t+e)/(t-e),h=(n+i)/(n-i),d,g;if(a)d=r/(s-r),g=s*r/(s-r);else if(o===2000)d=-(s+r)/(s-r),g=-2*s*r/(s-r);else if(o===2001)d=-s/(s-r),g=-s*r/(s-r);else throw Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=l,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=u,c[9]=h,c[13]=0,c[2]=0,c[6]=0,c[10]=d,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,i,r,s,o=2000,a=!1){let c=this.elements,l=2/(t-e),u=2/(n-i),f=-(t+e)/(t-e),h=-(n+i)/(n-i),d,g;if(a)d=1/(s-r),g=s/(s-r);else if(o===2000)d=-2/(s-r),g=-(s+r)/(s-r);else if(o===2001)d=-1/(s-r),g=-r/(s-r);else throw Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=u,c[9]=0,c[13]=h,c[2]=0,c[6]=0,c[10]=d,c[14]=g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}var Cr=new N,Cn=new ze,gy=new N(0,0,0),_y=new N(1,1,1),Ai=new N,Ho=new N,ln=new N,Bm=new ze,Gm=new Bt;class qn{constructor(e=0,t=0,n=0,i=qn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,r=i[0],s=i[4],o=i[8],a=i[1],c=i[5],l=i[9],u=i[2],f=i[6],h=i[10];switch(t){case"XYZ":if(this._y=Math.asin($e(o,-1,1)),Math.abs(o)<0.9999999)this._x=Math.atan2(-l,h),this._z=Math.atan2(-s,r);else this._x=Math.atan2(f,c),this._z=0;break;case"YXZ":if(this._x=Math.asin(-$e(l,-1,1)),Math.abs(l)<0.9999999)this._y=Math.atan2(o,h),this._z=Math.atan2(a,c);else this._y=Math.atan2(-u,r),this._z=0;break;case"ZXY":if(this._x=Math.asin($e(f,-1,1)),Math.abs(f)<0.9999999)this._y=Math.atan2(-u,h),this._z=Math.atan2(-s,c);else this._y=0,this._z=Math.atan2(a,r);break;case"ZYX":if(this._y=Math.asin(-$e(u,-1,1)),Math.abs(u)<0.9999999)this._x=Math.atan2(f,h),this._z=Math.atan2(a,r);else this._x=0,this._z=Math.atan2(-s,c);break;case"YZX":if(this._z=Math.asin($e(a,-1,1)),Math.abs(a)<0.9999999)this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,r);else this._x=0,this._y=Math.atan2(o,h);break;case"XZY":if(this._z=Math.asin(-$e(s,-1,1)),Math.abs(s)<0.9999999)this._x=Math.atan2(f,c),this._y=Math.atan2(o,r);else this._x=Math.atan2(-l,h),this._y=0;break;default:Me("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}if(this._order=t,n===!0)this._onChangeCallback();return this}setFromQuaternion(e,t,n){return Bm.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Bm,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Gm.setFromEuler(this),this.setFromQuaternion(Gm,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){if(this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0)this._order=e[3];return this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}qn.DEFAULT_ORDER="XYZ";class Ia{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}var xy=0,Hm=new N,Ir=new Bt,oi=new ze,Vo=new N,Rs=new N,vy=new N,yy=new Bt,Vm=new N(1,0,0),Wm=new N(0,1,0),$m=new N(0,0,1),Zm={type:"added"},by={type:"removed"},Pr={type:"childadded",child:null},el={type:"childremoved",child:null};class at extends zn{constructor(){super();this.isObject3D=!0,Object.defineProperty(this,"id",{value:xy++}),this.uuid=Dn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=at.DEFAULT_UP.clone();let e=new N,t=new qn,n=new Bt,i=new N(1,1,1);function r(){n.setFromEuler(t,!1)}function s(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new ze},normalMatrix:{value:new Ue}}),this.matrix=new ze,this.matrixWorld=new ze,this.matrixAutoUpdate=at.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=at.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ia,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){if(this.matrixAutoUpdate)this.updateMatrix();this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ir.setFromAxisAngle(e,t),this.quaternion.multiply(Ir),this}rotateOnWorldAxis(e,t){return Ir.setFromAxisAngle(e,t),this.quaternion.premultiply(Ir),this}rotateX(e){return this.rotateOnAxis(Vm,e)}rotateY(e){return this.rotateOnAxis(Wm,e)}rotateZ(e){return this.rotateOnAxis($m,e)}translateOnAxis(e,t){return Hm.copy(e).applyQuaternion(this.quaternion),this.position.add(Hm.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Vm,e)}translateY(e){return this.translateOnAxis(Wm,e)}translateZ(e){return this.translateOnAxis($m,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(oi.copy(this.matrixWorld).invert())}lookAt(e,t,n){if(e.isVector3)Vo.copy(e);else Vo.set(e,t,n);let i=this.parent;if(this.updateWorldMatrix(!0,!1),Rs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight)oi.lookAt(Rs,Vo,this.up);else oi.lookAt(Vo,Rs,this.up);if(this.quaternion.setFromRotationMatrix(oi),i)oi.extractRotation(i.matrixWorld),Ir.setFromRotationMatrix(oi),this.quaternion.premultiply(Ir.invert())}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}if(e===this)return Ne("Object3D.add: object can't be added as a child of itself.",e),this;if(e&&e.isObject3D)e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Zm),Pr.child=e,this.dispatchEvent(Pr),Pr.child=null;else Ne("Object3D.add: object not an instance of THREE.Object3D.",e);return this}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);if(t!==-1)e.parent=null,this.children.splice(t,1),e.dispatchEvent(by),el.child=e,this.dispatchEvent(el),el.child=null;return this}removeFromParent(){let e=this.parent;if(e!==null)e.remove(this);return this}clear(){return this.remove(...this.children)}attach(e){if(this.updateWorldMatrix(!0,!1),oi.copy(this.matrixWorld).invert(),e.parent!==null)e.parent.updateWorldMatrix(!0,!1),oi.multiply(e.parent.matrixWorld);return e.applyMatrix4(oi),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Zm),Pr.child=e,this.dispatchEvent(Pr),Pr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let s=this.children[n].getObjectByProperty(e,t);if(s!==void 0)return s}return}getObjectsByProperty(e,t,n=[]){if(this[e]===t)n.push(this);let i=this.children;for(let r=0,s=i.length;r<s;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Rs,e,vy),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Rs,yy,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;if(t!==null)e(t),t.traverseAncestors(e)}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let{x:t,y:n,z:i}=e,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*i,r[13]+=n-r[1]*t-r[5]*n-r[9]*i,r[14]+=i-r[2]*t-r[6]*n-r[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldNeedsUpdate||e){if(this.matrixWorldAutoUpdate===!0)if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);this.matrixWorldNeedsUpdate=!1,e=!0}let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let i=this.parent;if(e===!0&&i!==null)i.updateWorldMatrix(!0,!1);if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldNeedsUpdate||n){if(this.matrixWorldAutoUpdate===!0)if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);this.matrixWorldNeedsUpdate=!1,n=!0}if(t===!0){let r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==="string",n={};if(t)e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"};let i={};if(i.uuid=this.uuid,i.type=this.type,this.name!=="")i.name=this.name;if(this.castShadow===!0)i.castShadow=!0;if(this.receiveShadow===!0)i.receiveShadow=!0;if(this.visible===!1)i.visible=!1;if(this.frustumCulled===!1)i.frustumCulled=!1;if(this.renderOrder!==0)i.renderOrder=this.renderOrder;if(this.static!==!1)i.static=this.static;if(Object.keys(this.userData).length>0)i.userData=this.userData;if(i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null)i.pivot=this.pivot.toArray();if(this.matrixAutoUpdate===!1)i.matrixAutoUpdate=!1;if(this.morphTargetDictionary!==void 0)i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary);if(this.morphTargetInfluences!==void 0)i.morphTargetInfluences=this.morphTargetInfluences.slice();if(this.isInstancedMesh){if(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null)i.instanceColor=this.instanceColor.toJSON()}if(this.isBatchedMesh){if(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map((o)=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map((o)=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null)i.colorsTexture=this._colorsTexture.toJSON(e);if(this.boundingSphere!==null)i.boundingSphere=this.boundingSphere.toJSON();if(this.boundingBox!==null)i.boundingBox=this.boundingBox.toJSON()}function r(o,a){if(o[a.uuid]===void 0)o[a.uuid]=a.toJSON(e);return a.uuid}if(this.isScene){if(this.background){if(this.background.isColor)i.background=this.background.toJSON();else if(this.background.isTexture)i.background=this.background.toJSON(e).uuid}if(this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0)i.environment=this.environment.toJSON(e).uuid}else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let a=o.shapes;if(Array.isArray(a))for(let c=0,l=a.length;c<l;c++){let u=a[c];r(e.shapes,u)}else r(e.shapes,a)}}if(this.isSkinnedMesh){if(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0)r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid}if(this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let a=0,c=this.material.length;a<c;a++)o.push(r(e.materials,this.material[a]));i.material=o}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){let a=this.animations[o];i.animations.push(r(e.animations,a))}}if(t){let o=s(e.geometries),a=s(e.materials),c=s(e.textures),l=s(e.images),u=s(e.shapes),f=s(e.skeletons),h=s(e.animations),d=s(e.nodes);if(o.length>0)n.geometries=o;if(a.length>0)n.materials=a;if(c.length>0)n.textures=c;if(l.length>0)n.images=l;if(u.length>0)n.shapes=u;if(f.length>0)n.skeletons=f;if(h.length>0)n.animations=h;if(d.length>0)n.nodes=d}return n.object=i,n;function s(o){let a=[];for(let c in o){let l=o[c];delete l.metadata,a.push(l)}return a}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}}at.DEFAULT_UP=new N(0,1,0);at.DEFAULT_MATRIX_AUTO_UPDATE=!0;at.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Zn extends at{constructor(){super();this.isGroup=!0,this.type="Group"}}var Sy={type:"move"};class Xs{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){if(this._hand===null)this._hand=new Zn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1};return this._hand}getTargetRaySpace(){if(this._targetRay===null)this._targetRay=new Zn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new N,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new N;return this._targetRay}getGripSpace(){if(this._grip===null)this._grip=new Zn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new N,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new N,this._grip.eventsEnabled=!1;return this._grip}dispatchEvent(e){if(this._targetRay!==null)this._targetRay.dispatchEvent(e);if(this._grip!==null)this._grip.dispatchEvent(e);if(this._hand!==null)this._hand.dispatchEvent(e);return this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){if(this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null)this._targetRay.visible=!1;if(this._grip!==null)this._grip.visible=!1;if(this._hand!==null)this._hand.visible=!1;return this}update(e,t,n){let i=null,r=null,s=null,o=this._targetRay,a=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){s=!0;for(let g of e.hand.values()){let y=t.getJointPose(g,n),p=this._getHandJoint(c,g);if(y!==null)p.matrix.fromArray(y.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=y.radius;p.visible=y!==null}let l=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=l.position.distanceTo(u.position),h=0.02,d=0.005;if(c.inputState.pinching&&f>h+d)c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this});else if(!c.inputState.pinching&&f<=h-d)c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this})}else if(a!==null&&e.gripSpace){if(r=t.getPose(e.gripSpace,n),r!==null){if(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity)a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity);else a.hasLinearVelocity=!1;if(r.angularVelocity)a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity);else a.hasAngularVelocity=!1;if(a.eventsEnabled)a.dispatchEvent({type:"gripUpdated",data:e,target:this})}}if(o!==null){if(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null)i=r;if(i!==null){if(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity)o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity);else o.hasLinearVelocity=!1;if(i.angularVelocity)o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity);else o.hasAngularVelocity=!1;this.dispatchEvent(Sy)}}}if(o!==null)o.visible=i!==null;if(a!==null)a.visible=r!==null;if(c!==null)c.visible=s!==null;return this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Zn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}var m_={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ri={h:0,s:0,l:0},Wo={h:0,s:0,l:0};function tl(e,t,n){if(n<0)n+=1;if(n>1)n-=1;if(n<0.16666666666666666)return e+(t-e)*6*n;if(n<0.5)return t;if(n<0.6666666666666666)return e+(t-e)*6*(0.6666666666666666-n);return e}class Le{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;if(i&&i.isColor)this.copy(i);else if(typeof i==="number")this.setHex(i);else if(typeof i==="string")this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t="srgb"){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,We.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=We.workingColorSpace){return this.r=e,this.g=t,this.b=n,We.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=We.workingColorSpace){if(e=Su(e,1),t=$e(t,0,1),n=$e(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=0.5?n*(1+t):n+t-n*t,s=2*n-r;this.r=tl(s,r,e+0.3333333333333333),this.g=tl(s,r,e),this.b=tl(s,r,e-0.3333333333333333)}return We.colorSpaceToWorking(this,i),this}setStyle(e,t="srgb"){function n(r){if(r===void 0)return;if(parseFloat(r)<1)Me("Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,s=i[1],o=i[2];switch(s){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Me("Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=i[1],s=r.length;if(s===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);else if(s===6)return this.setHex(parseInt(r,16),t);else Me("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t="srgb"){let n=m_[e.toLowerCase()];if(n!==void 0)this.setHex(n,t);else Me("Color: Unknown color "+e);return this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=fi(e.r),this.g=fi(e.g),this.b=fi(e.b),this}copyLinearToSRGB(e){return this.r=Hr(e.r),this.g=Hr(e.g),this.b=Hr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e="srgb"){return We.workingToColorSpace(qt.copy(this),e),Math.round($e(qt.r*255,0,255))*65536+Math.round($e(qt.g*255,0,255))*256+Math.round($e(qt.b*255,0,255))}getHexString(e="srgb"){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=We.workingColorSpace){We.workingToColorSpace(qt.copy(this),t);let{r:n,g:i,b:r}=qt,s=Math.max(n,i,r),o=Math.min(n,i,r),a,c,l=(o+s)/2;if(o===s)a=0,c=0;else{let u=s-o;switch(c=l<=0.5?u/(s+o):u/(2-s-o),s){case n:a=(i-r)/u+(i<r?6:0);break;case i:a=(r-n)/u+2;break;case r:a=(n-i)/u+4;break}a/=6}return e.h=a,e.s=c,e.l=l,e}getRGB(e,t=We.workingColorSpace){return We.workingToColorSpace(qt.copy(this),t),e.r=qt.r,e.g=qt.g,e.b=qt.b,e}getStyle(e="srgb"){We.workingToColorSpace(qt.copy(this),e);let{r:t,g:n,b:i}=qt;if(e!=="srgb")return`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`;return`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(Ri),this.setHSL(Ri.h+e,Ri.s+t,Ri.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Ri),e.getHSL(Wo);let n=Fs(Ri.h,Wo.h,t),i=Fs(Ri.s,Wo.s,t),r=Fs(Ri.l,Wo.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}var qt=new Le;Le.NAMES=m_;class es extends at{constructor(){super();if(this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new qn,this.environmentIntensity=1,this.environmentRotation=new qn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){if(super.copy(e,t),e.background!==null)this.background=e.background.clone();if(e.environment!==null)this.environment=e.environment.clone();if(e.fog!==null)this.fog=e.fog.clone();if(this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null)this.overrideMaterial=e.overrideMaterial.clone();return this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);if(this.fog!==null)t.object.fog=this.fog.toJSON();if(this.backgroundBlurriness>0)t.object.backgroundBlurriness=this.backgroundBlurriness;if(this.backgroundIntensity!==1)t.object.backgroundIntensity=this.backgroundIntensity;if(t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1)t.object.environmentIntensity=this.environmentIntensity;return t.object.environmentRotation=this.environmentRotation.toArray(),t}}var In=new N,ai=new N,nl=new N,ci=new N,Lr=new N,Nr=new N,Xm=new N,il=new N,rl=new N,sl=new N,ol=new st,al=new st,cl=new st;class yn{constructor(e=new N,t=new N,n=new N){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),In.subVectors(e,t),i.cross(In);let r=i.lengthSq();if(r>0)return i.multiplyScalar(1/Math.sqrt(r));return i.set(0,0,0)}static getBarycoord(e,t,n,i,r){In.subVectors(i,t),ai.subVectors(n,t),nl.subVectors(e,t);let s=In.dot(In),o=In.dot(ai),a=In.dot(nl),c=ai.dot(ai),l=ai.dot(nl),u=s*c-o*o;if(u===0)return r.set(0,0,0),null;let f=1/u,h=(c*a-o*l)*f,d=(s*l-o*a)*f;return r.set(1-h-d,d,h)}static containsPoint(e,t,n,i){if(this.getBarycoord(e,t,n,i,ci)===null)return!1;return ci.x>=0&&ci.y>=0&&ci.x+ci.y<=1}static getInterpolation(e,t,n,i,r,s,o,a){if(this.getBarycoord(e,t,n,i,ci)===null){if(a.x=0,a.y=0,"z"in a)a.z=0;if("w"in a)a.w=0;return null}return a.setScalar(0),a.addScaledVector(r,ci.x),a.addScaledVector(s,ci.y),a.addScaledVector(o,ci.z),a}static getInterpolatedAttribute(e,t,n,i,r,s){return ol.setScalar(0),al.setScalar(0),cl.setScalar(0),ol.fromBufferAttribute(e,t),al.fromBufferAttribute(e,n),cl.fromBufferAttribute(e,i),s.setScalar(0),s.addScaledVector(ol,r.x),s.addScaledVector(al,r.y),s.addScaledVector(cl,r.z),s}static isFrontFacing(e,t,n,i){return In.subVectors(n,t),ai.subVectors(e,t),In.cross(ai).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return In.subVectors(this.c,this.b),ai.subVectors(this.a,this.b),In.cross(ai).length()*0.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(0.3333333333333333)}getNormal(e){return yn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return yn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,r){return yn.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return yn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return yn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,r=this.c,s,o;Lr.subVectors(i,n),Nr.subVectors(r,n),il.subVectors(e,n);let a=Lr.dot(il),c=Nr.dot(il);if(a<=0&&c<=0)return t.copy(n);rl.subVectors(e,i);let l=Lr.dot(rl),u=Nr.dot(rl);if(l>=0&&u<=l)return t.copy(i);let f=a*u-l*c;if(f<=0&&a>=0&&l<=0)return s=a/(a-l),t.copy(n).addScaledVector(Lr,s);sl.subVectors(e,r);let h=Lr.dot(sl),d=Nr.dot(sl);if(d>=0&&h<=d)return t.copy(r);let g=h*c-a*d;if(g<=0&&c>=0&&d<=0)return o=c/(c-d),t.copy(n).addScaledVector(Nr,o);let y=l*d-h*u;if(y<=0&&u-l>=0&&h-d>=0)return Xm.subVectors(r,i),o=(u-l)/(u-l+(h-d)),t.copy(i).addScaledVector(Xm,o);let p=1/(y+g+f);return s=g*p,o=f*p,t.copy(n).addScaledVector(Lr,s).addScaledVector(Nr,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class en{constructor(e=new N(1/0,1/0,1/0),t=new N(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Pn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Pn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Pn.copy(t).multiplyScalar(0.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(0.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let s=0,o=r.count;s<o;s++){if(e.isMesh===!0)e.getVertexPosition(s,Pn);else Pn.fromBufferAttribute(r,s);Pn.applyMatrix4(e.matrixWorld),this.expandByPoint(Pn)}else{if(e.boundingBox!==void 0){if(e.boundingBox===null)e.computeBoundingBox();$o.copy(e.boundingBox)}else{if(n.boundingBox===null)n.computeBoundingBox();$o.copy(n.boundingBox)}$o.applyMatrix4(e.matrixWorld),this.union($o)}}let i=e.children;for(let r=0,s=i.length;r<s;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Pn),Pn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;if(e.normal.x>0)t=e.normal.x*this.min.x,n=e.normal.x*this.max.x;else t=e.normal.x*this.max.x,n=e.normal.x*this.min.x;if(e.normal.y>0)t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y;else t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y;if(e.normal.z>0)t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z;else t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z;return t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Cs),Zo.subVectors(this.max,Cs),Dr.subVectors(e.a,Cs),Ur.subVectors(e.b,Cs),Or.subVectors(e.c,Cs),Ci.subVectors(Ur,Dr),Ii.subVectors(Or,Ur),ir.subVectors(Dr,Or);let t=[0,-Ci.z,Ci.y,0,-Ii.z,Ii.y,0,-ir.z,ir.y,Ci.z,0,-Ci.x,Ii.z,0,-Ii.x,ir.z,0,-ir.x,-Ci.y,Ci.x,0,-Ii.y,Ii.x,0,-ir.y,ir.x,0];if(!ll(t,Dr,Ur,Or,Zo))return!1;if(t=[1,0,0,0,1,0,0,0,1],!ll(t,Dr,Ur,Or,Zo))return!1;return Xo.crossVectors(Ci,Ii),t=[Xo.x,Xo.y,Xo.z],ll(t,Dr,Ur,Or,Zo)}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Pn).distanceTo(e)}getBoundingSphere(e){if(this.isEmpty())e.makeEmpty();else this.getCenter(e.center),e.radius=this.getSize(Pn).length()*0.5;return e}intersect(e){if(this.min.max(e.min),this.max.min(e.max),this.isEmpty())this.makeEmpty();return this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){if(this.isEmpty())return this;return li[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),li[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),li[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),li[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),li[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),li[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),li[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),li[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(li),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}var li=[new N,new N,new N,new N,new N,new N,new N,new N],Pn=new N,$o=new en,Dr=new N,Ur=new N,Or=new N,Ci=new N,Ii=new N,ir=new N,Cs=new N,Zo=new N,Xo=new N,rr=new N;function ll(e,t,n,i,r){for(let s=0,o=e.length-3;s<=o;s+=3){rr.fromArray(e,s);let a=r.x*Math.abs(rr.x)+r.y*Math.abs(rr.y)+r.z*Math.abs(rr.z),c=t.dot(rr),l=n.dot(rr),u=i.dot(rr);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}var It=new N,qo=new Ie,My=0;class Nt extends zn{constructor(e,t,n=!1){super();if(Array.isArray(e))throw TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:My++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(e){if(e===!0)this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)qo.fromBufferAttribute(this,t),qo.applyMatrix3(e),this.setXY(t,qo.x,qo.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyMatrix3(e),this.setXYZ(t,It.x,It.y,It.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyMatrix4(e),this.setXYZ(t,It.x,It.y,It.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyNormalMatrix(e),this.setXYZ(t,It.x,It.y,It.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.transformDirection(e),this.setXYZ(t,It.x,It.y,It.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];if(this.normalized)n=Nn(n,this.array);return n}setComponent(e,t,n){if(this.normalized)n=rt(n,this.array);return this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];if(this.normalized)t=Nn(t,this.array);return t}setX(e,t){if(this.normalized)t=rt(t,this.array);return this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];if(this.normalized)t=Nn(t,this.array);return t}setY(e,t){if(this.normalized)t=rt(t,this.array);return this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];if(this.normalized)t=Nn(t,this.array);return t}setZ(e,t){if(this.normalized)t=rt(t,this.array);return this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];if(this.normalized)t=Nn(t,this.array);return t}setW(e,t){if(this.normalized)t=rt(t,this.array);return this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){if(e*=this.itemSize,this.normalized)t=rt(t,this.array),n=rt(n,this.array);return this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){if(e*=this.itemSize,this.normalized)t=rt(t,this.array),n=rt(n,this.array),i=rt(i,this.array);return this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){if(e*=this.itemSize,this.normalized)t=rt(t,this.array),n=rt(n,this.array),i=rt(i,this.array),r=rt(r,this.array);return this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};if(this.name!=="")e.name=this.name;if(this.usage!==35044)e.usage=this.usage;return e}dispose(){this.dispatchEvent({type:"dispose"})}}class Pa extends Nt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class La extends Nt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class nn extends Nt{constructor(e,t,n){super(new Float32Array(e),t,n)}}var wy=new en,Is=new N,ul=new N;class fn{constructor(e=new N,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;if(t!==void 0)n.copy(t);else wy.setFromPoints(e).getCenter(n);let i=0;for(let r=0,s=e.length;r<s;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);if(t.copy(e),n>this.radius*this.radius)t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center);return t}getBoundingBox(e){if(this.isEmpty())return e.makeEmpty(),e;return e.set(this.center,this.center),e.expandByScalar(this.radius),e}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Is.subVectors(e,this.center);let t=Is.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=(n-this.radius)*0.5;this.center.addScaledVector(Is,i/n),this.radius+=i}return this}union(e){if(e.isEmpty())return this;if(this.isEmpty())return this.copy(e),this;if(this.center.equals(e.center)===!0)this.radius=Math.max(this.radius,e.radius);else ul.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Is.copy(e.center).add(ul)),this.expandByPoint(Is.copy(e.center).sub(ul));return this}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}var Ty=0,vn=new ze,hl=new at,Fr=new N,un=new en,Ps=new en,kt=new N;class tn extends zn{constructor(){super();this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ty++}),this.uuid=Dn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){if(Array.isArray(e))this.index=new((Yv(e))?La:Pa)(e,1);else this.index=e;return this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;if(t!==void 0)t.applyMatrix4(e),t.needsUpdate=!0;let n=this.attributes.normal;if(n!==void 0){let r=new Ue().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;if(i!==void 0)i.transformDirection(e),i.needsUpdate=!0;if(this.boundingBox!==null)this.computeBoundingBox();if(this.boundingSphere!==null)this.computeBoundingSphere();return this._transformed=!0,this}applyQuaternion(e){return vn.makeRotationFromQuaternion(e),this.applyMatrix4(vn),this}rotateX(e){return vn.makeRotationX(e),this.applyMatrix4(vn),this}rotateY(e){return vn.makeRotationY(e),this.applyMatrix4(vn),this}rotateZ(e){return vn.makeRotationZ(e),this.applyMatrix4(vn),this}translate(e,t,n){return vn.makeTranslation(e,t,n),this.applyMatrix4(vn),this}scale(e,t,n){return vn.makeScale(e,t,n),this.applyMatrix4(vn),this}lookAt(e){return hl.lookAt(e),hl.updateMatrix(),this.applyMatrix4(hl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Fr).negate(),this.translate(Fr.x,Fr.y,Fr.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let i=0,r=e.length;i<r;i++){let s=e[i];n.push(s.x,s.y,s.z||0)}this.setAttribute("position",new nn(n,3))}else{let n=Math.min(e.length,t.count);for(let i=0;i<n;i++){let r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}if(e.length>t.count)Me("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.");t.needsUpdate=!0}return this}computeBoundingBox(){if(this.boundingBox===null)this.boundingBox=new en;let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ne("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new N(-1/0,-1/0,-1/0),new N(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let r=t[n];if(un.setFromBufferAttribute(r),this.morphTargetsRelative)kt.addVectors(this.boundingBox.min,un.min),this.boundingBox.expandByPoint(kt),kt.addVectors(this.boundingBox.max,un.max),this.boundingBox.expandByPoint(kt);else this.boundingBox.expandByPoint(un.min),this.boundingBox.expandByPoint(un.max)}}else this.boundingBox.makeEmpty();if(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))Ne('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){if(this.boundingSphere===null)this.boundingSphere=new fn;let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ne("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new N,1/0);return}if(e){let n=this.boundingSphere.center;if(un.setFromBufferAttribute(e),t)for(let r=0,s=t.length;r<s;r++){let o=t[r];if(Ps.setFromBufferAttribute(o),this.morphTargetsRelative)kt.addVectors(un.min,Ps.min),un.expandByPoint(kt),kt.addVectors(un.max,Ps.max),un.expandByPoint(kt);else un.expandByPoint(Ps.min),un.expandByPoint(Ps.max)}un.getCenter(n);let i=0;for(let r=0,s=e.count;r<s;r++)kt.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(kt));if(t)for(let r=0,s=t.length;r<s;r++){let o=t[r],a=this.morphTargetsRelative;for(let c=0,l=o.count;c<l;c++){if(kt.fromBufferAttribute(o,c),a)Fr.fromBufferAttribute(e,c),kt.add(Fr);i=Math.max(i,n.distanceToSquared(kt))}}if(this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius))Ne('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Ne("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let{position:n,normal:i,uv:r}=t,s=this.getAttribute("tangent");if(s===void 0||s.count!==n.count)s=new Nt(new Float32Array(4*n.count),4),this.setAttribute("tangent",s);let o=[],a=[];for(let R=0;R<n.count;R++)o[R]=new N,a[R]=new N;let c=new N,l=new N,u=new N,f=new Ie,h=new Ie,d=new Ie,g=new N,y=new N;function p(R,_,S){c.fromBufferAttribute(n,R),l.fromBufferAttribute(n,_),u.fromBufferAttribute(n,S),f.fromBufferAttribute(r,R),h.fromBufferAttribute(r,_),d.fromBufferAttribute(r,S),l.sub(c),u.sub(c),h.sub(f),d.sub(f);let F=1/(h.x*d.y-d.x*h.y);if(!isFinite(F))return;g.copy(l).multiplyScalar(d.y).addScaledVector(u,-h.y).multiplyScalar(F),y.copy(u).multiplyScalar(h.x).addScaledVector(l,-d.x).multiplyScalar(F),o[R].add(g),o[_].add(g),o[S].add(g),a[R].add(y),a[_].add(y),a[S].add(y)}let m=this.groups;if(m.length===0)m=[{start:0,count:e.count}];for(let R=0,_=m.length;R<_;++R){let S=m[R],{start:F,count:C}=S;for(let z=F,J=F+C;z<J;z+=3)p(e.getX(z+0),e.getX(z+1),e.getX(z+2))}let A=new N,T=new N,v=new N,w=new N;function E(R){v.fromBufferAttribute(i,R),w.copy(v);let _=o[R];A.copy(_),A.sub(v.multiplyScalar(v.dot(_))).normalize(),T.crossVectors(w,_);let F=T.dot(a[R])<0?-1:1;s.setXYZW(R,A.x,A.y,A.z,F)}for(let R=0,_=m.length;R<_;++R){let S=m[R],{start:F,count:C}=S;for(let z=F,J=F+C;z<J;z+=3)E(e.getX(z+0)),E(e.getX(z+1)),E(e.getX(z+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new Nt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,h=n.count;f<h;f++)n.setXYZ(f,0,0,0);let i=new N,r=new N,s=new N,o=new N,a=new N,c=new N,l=new N,u=new N;if(e)for(let f=0,h=e.count;f<h;f+=3){let d=e.getX(f+0),g=e.getX(f+1),y=e.getX(f+2);i.fromBufferAttribute(t,d),r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,y),l.subVectors(s,r),u.subVectors(i,r),l.cross(u),o.fromBufferAttribute(n,d),a.fromBufferAttribute(n,g),c.fromBufferAttribute(n,y),o.add(l),a.add(l),c.add(l),n.setXYZ(d,o.x,o.y,o.z),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(y,c.x,c.y,c.z)}else for(let f=0,h=t.count;f<h;f+=3)i.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),s.fromBufferAttribute(t,f+2),l.subVectors(s,r),u.subVectors(i,r),l.cross(u),n.setXYZ(f+0,l.x,l.y,l.z),n.setXYZ(f+1,l.x,l.y,l.z),n.setXYZ(f+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)kt.fromBufferAttribute(e,t),kt.normalize(),e.setXYZ(t,kt.x,kt.y,kt.z)}toNonIndexed(){function e(o,a){let{array:c,itemSize:l,normalized:u}=o,f=new c.constructor(a.length*l),h=0,d=0;for(let g=0,y=a.length;g<y;g++){if(o.isInterleavedBufferAttribute)h=a[g]*o.data.stride+o.offset;else h=a[g]*l;for(let p=0;p<l;p++)f[d++]=c[h++]}return new Nt(f,l,u)}if(this.index===null)return Me("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new tn,n=this.index.array,i=this.attributes;for(let o in i){let a=i[o],c=e(a,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let a=[],c=r[o];for(let l=0,u=c.length;l<u;l++){let f=c[l],h=e(f,n);a.push(h)}t.morphAttributes[o]=a}t.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;for(let o=0,a=s.length;o<a;o++){let c=s[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!=="")e.name=this.name;if(Object.keys(this.userData).length>0)e.userData=this.userData;if(this.parameters!==void 0&&this._transformed!==!0){let a=this.parameters;for(let c in a)if(a[c]!==void 0)e[c]=a[c];return e}e.data={attributes:{}};let t=this.index;if(t!==null)e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)};let n=this.attributes;for(let a in n){let c=n[a];e.data.attributes[a]=c.toJSON(e.data)}let i={},r=!1;for(let a in this.morphAttributes){let c=this.morphAttributes[a],l=[];for(let u=0,f=c.length;u<f;u++){let h=c[u];l.push(h.toJSON(e.data))}if(l.length>0)i[a]=l,r=!0}if(r)e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;if(s.length>0)e.data.groups=JSON.parse(JSON.stringify(s));let o=this.boundingSphere;if(o!==null)e.data.boundingSphere=o.toJSON();return e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;if(n!==null)this.setIndex(n.clone());let i=e.attributes;for(let c in i){let l=i[c];this.setAttribute(c,l.clone(t))}let r=e.morphAttributes;for(let c in r){let l=[],u=r[c];for(let f=0,h=u.length;f<h;f++)l.push(u[f].clone(t));this.morphAttributes[c]=l}this.morphTargetsRelative=e.morphTargetsRelative;let s=e.groups;for(let c=0,l=s.length;c<l;c++){let u=s[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;if(o!==null)this.boundingBox=o.clone();let a=e.boundingSphere;if(a!==null)this.boundingSphere=a.clone();return this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class qs{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=35044,this.updateRanges=[],this.version=0,this.uuid=Dn()}onUploadCallback(){}set needsUpdate(e){if(e===!0)this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,r=this.stride;i<r;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){if(e.arrayBuffers===void 0)e.arrayBuffers={};if(this.array.buffer._uuid===void 0)this.array.buffer._uuid=Dn();if(e.arrayBuffers[this.array.buffer._uuid]===void 0)e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer;let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){if(e.arrayBuffers===void 0)e.arrayBuffers={};if(this.array.buffer._uuid===void 0)this.array.buffer._uuid=Dn();if(e.arrayBuffers[this.array.buffer._uuid]===void 0)e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer));return{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}var Qt=new N;class ts{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Qt.fromBufferAttribute(this,t),Qt.applyMatrix4(e),this.setXYZ(t,Qt.x,Qt.y,Qt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Qt.fromBufferAttribute(this,t),Qt.applyNormalMatrix(e),this.setXYZ(t,Qt.x,Qt.y,Qt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Qt.fromBufferAttribute(this,t),Qt.transformDirection(e),this.setXYZ(t,Qt.x,Qt.y,Qt.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];if(this.normalized)n=Nn(n,this.array);return n}setComponent(e,t,n){if(this.normalized)n=rt(n,this.array);return this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){if(this.normalized)t=rt(t,this.array);return this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){if(this.normalized)t=rt(t,this.array);return this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){if(this.normalized)t=rt(t,this.array);return this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){if(this.normalized)t=rt(t,this.array);return this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];if(this.normalized)t=Nn(t,this.array);return t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];if(this.normalized)t=Nn(t,this.array);return t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];if(this.normalized)t=Nn(t,this.array);return t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];if(this.normalized)t=Nn(t,this.array);return t}setXY(e,t,n){if(e=e*this.data.stride+this.offset,this.normalized)t=rt(t,this.array),n=rt(n,this.array);return this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){if(e=e*this.data.stride+this.offset,this.normalized)t=rt(t,this.array),n=rt(n,this.array),i=rt(i,this.array);return this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,r){if(e=e*this.data.stride+this.offset,this.normalized)t=rt(t,this.array),n=rt(n,this.array),i=rt(i,this.array),r=rt(r,this.array);return this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=r,this}clone(e){if(e===void 0){zs("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return new Nt(new this.array.constructor(t),this.itemSize,this.normalized)}else{if(e.interleavedBuffers===void 0)e.interleavedBuffers={};if(e.interleavedBuffers[this.data.uuid]===void 0)e.interleavedBuffers[this.data.uuid]=this.data.clone(e);return new ts(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}}toJSON(e){if(e===void 0){zs("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else{if(e.interleavedBuffers===void 0)e.interleavedBuffers={};if(e.interleavedBuffers[this.data.uuid]===void 0)e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e);return{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}}var Ey=0;class rn extends zn{constructor(){super();this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ey++}),this.uuid=Dn(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Le(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){if(this._alphaTest>0!==e>0)this.version++;this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e===void 0)return;for(let t in e){let n=e[t];if(n===void 0){Me(`Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){Me(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}if(i&&i.isColor)i.set(n);else if(i&&i.isVector2&&(n&&n.isVector2)||i&&i.isEuler&&(n&&n.isEuler)||i&&i.isVector3&&(n&&n.isVector3))i.copy(n);else this[t]=n}}toJSON(e){let t=e===void 0||typeof e==="string";if(t)e={textures:{},images:{}};let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};if(n.uuid=this.uuid,n.type=this.type,this.name!=="")n.name=this.name;if(this.color&&this.color.isColor)n.color=this.color.getHex();if(this.roughness!==void 0)n.roughness=this.roughness;if(this.metalness!==void 0)n.metalness=this.metalness;if(this.sheen!==void 0)n.sheen=this.sheen;if(this.sheenColor&&this.sheenColor.isColor)n.sheenColor=this.sheenColor.getHex();if(this.sheenRoughness!==void 0)n.sheenRoughness=this.sheenRoughness;if(this.emissive&&this.emissive.isColor)n.emissive=this.emissive.getHex();if(this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1)n.emissiveIntensity=this.emissiveIntensity;if(this.specular&&this.specular.isColor)n.specular=this.specular.getHex();if(this.specularIntensity!==void 0)n.specularIntensity=this.specularIntensity;if(this.specularColor&&this.specularColor.isColor)n.specularColor=this.specularColor.getHex();if(this.shininess!==void 0)n.shininess=this.shininess;if(this.clearcoat!==void 0)n.clearcoat=this.clearcoat;if(this.clearcoatRoughness!==void 0)n.clearcoatRoughness=this.clearcoatRoughness;if(this.clearcoatMap&&this.clearcoatMap.isTexture)n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid;if(this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture)n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid;if(this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture)n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray();if(this.sheenColorMap&&this.sheenColorMap.isTexture)n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid;if(this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture)n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid;if(this.dispersion!==void 0)n.dispersion=this.dispersion;if(this.iridescence!==void 0)n.iridescence=this.iridescence;if(this.iridescenceIOR!==void 0)n.iridescenceIOR=this.iridescenceIOR;if(this.iridescenceThicknessRange!==void 0)n.iridescenceThicknessRange=this.iridescenceThicknessRange;if(this.iridescenceMap&&this.iridescenceMap.isTexture)n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid;if(this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture)n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid;if(this.anisotropy!==void 0)n.anisotropy=this.anisotropy;if(this.anisotropyRotation!==void 0)n.anisotropyRotation=this.anisotropyRotation;if(this.anisotropyMap&&this.anisotropyMap.isTexture)n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid;if(this.map&&this.map.isTexture)n.map=this.map.toJSON(e).uuid;if(this.matcap&&this.matcap.isTexture)n.matcap=this.matcap.toJSON(e).uuid;if(this.alphaMap&&this.alphaMap.isTexture)n.alphaMap=this.alphaMap.toJSON(e).uuid;if(this.lightMap&&this.lightMap.isTexture)n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity;if(this.aoMap&&this.aoMap.isTexture)n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity;if(this.bumpMap&&this.bumpMap.isTexture)n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale;if(this.normalMap&&this.normalMap.isTexture)n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray();if(this.displacementMap&&this.displacementMap.isTexture)n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias;if(this.roughnessMap&&this.roughnessMap.isTexture)n.roughnessMap=this.roughnessMap.toJSON(e).uuid;if(this.metalnessMap&&this.metalnessMap.isTexture)n.metalnessMap=this.metalnessMap.toJSON(e).uuid;if(this.emissiveMap&&this.emissiveMap.isTexture)n.emissiveMap=this.emissiveMap.toJSON(e).uuid;if(this.specularMap&&this.specularMap.isTexture)n.specularMap=this.specularMap.toJSON(e).uuid;if(this.specularIntensityMap&&this.specularIntensityMap.isTexture)n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid;if(this.specularColorMap&&this.specularColorMap.isTexture)n.specularColorMap=this.specularColorMap.toJSON(e).uuid;if(this.envMap&&this.envMap.isTexture){if(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0)n.combine=this.combine}if(this.envMapRotation!==void 0)n.envMapRotation=this.envMapRotation.toArray();if(this.envMapIntensity!==void 0)n.envMapIntensity=this.envMapIntensity;if(this.reflectivity!==void 0)n.reflectivity=this.reflectivity;if(this.refractionRatio!==void 0)n.refractionRatio=this.refractionRatio;if(this.gradientMap&&this.gradientMap.isTexture)n.gradientMap=this.gradientMap.toJSON(e).uuid;if(this.transmission!==void 0)n.transmission=this.transmission;if(this.transmissionMap&&this.transmissionMap.isTexture)n.transmissionMap=this.transmissionMap.toJSON(e).uuid;if(this.thickness!==void 0)n.thickness=this.thickness;if(this.thicknessMap&&this.thicknessMap.isTexture)n.thicknessMap=this.thicknessMap.toJSON(e).uuid;if(this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0)n.attenuationDistance=this.attenuationDistance;if(this.attenuationColor!==void 0)n.attenuationColor=this.attenuationColor.getHex();if(this.size!==void 0)n.size=this.size;if(this.shadowSide!==null)n.shadowSide=this.shadowSide;if(this.sizeAttenuation!==void 0)n.sizeAttenuation=this.sizeAttenuation;if(this.blending!==1)n.blending=this.blending;if(this.side!==0)n.side=this.side;if(this.vertexColors===!0)n.vertexColors=!0;if(this.opacity<1)n.opacity=this.opacity;if(this.transparent===!0)n.transparent=!0;if(this.blendSrc!==204)n.blendSrc=this.blendSrc;if(this.blendDst!==205)n.blendDst=this.blendDst;if(this.blendEquation!==100)n.blendEquation=this.blendEquation;if(this.blendSrcAlpha!==null)n.blendSrcAlpha=this.blendSrcAlpha;if(this.blendDstAlpha!==null)n.blendDstAlpha=this.blendDstAlpha;if(this.blendEquationAlpha!==null)n.blendEquationAlpha=this.blendEquationAlpha;if(this.blendColor&&this.blendColor.isColor)n.blendColor=this.blendColor.getHex();if(this.blendAlpha!==0)n.blendAlpha=this.blendAlpha;if(this.depthFunc!==3)n.depthFunc=this.depthFunc;if(this.depthTest===!1)n.depthTest=this.depthTest;if(this.depthWrite===!1)n.depthWrite=this.depthWrite;if(this.colorWrite===!1)n.colorWrite=this.colorWrite;if(this.stencilWriteMask!==255)n.stencilWriteMask=this.stencilWriteMask;if(this.stencilFunc!==519)n.stencilFunc=this.stencilFunc;if(this.stencilRef!==0)n.stencilRef=this.stencilRef;if(this.stencilFuncMask!==255)n.stencilFuncMask=this.stencilFuncMask;if(this.stencilFail!==7680)n.stencilFail=this.stencilFail;if(this.stencilZFail!==7680)n.stencilZFail=this.stencilZFail;if(this.stencilZPass!==7680)n.stencilZPass=this.stencilZPass;if(this.stencilWrite===!0)n.stencilWrite=this.stencilWrite;if(this.rotation!==void 0&&this.rotation!==0)n.rotation=this.rotation;if(this.polygonOffset===!0)n.polygonOffset=!0;if(this.polygonOffsetFactor!==0)n.polygonOffsetFactor=this.polygonOffsetFactor;if(this.polygonOffsetUnits!==0)n.polygonOffsetUnits=this.polygonOffsetUnits;if(this.linewidth!==void 0&&this.linewidth!==1)n.linewidth=this.linewidth;if(this.dashSize!==void 0)n.dashSize=this.dashSize;if(this.gapSize!==void 0)n.gapSize=this.gapSize;if(this.scale!==void 0)n.scale=this.scale;if(this.dithering===!0)n.dithering=!0;if(this.alphaTest>0)n.alphaTest=this.alphaTest;if(this.alphaHash===!0)n.alphaHash=!0;if(this.alphaToCoverage===!0)n.alphaToCoverage=!0;if(this.premultipliedAlpha===!0)n.premultipliedAlpha=!0;if(this.forceSinglePass===!0)n.forceSinglePass=!0;if(this.allowOverride===!1)n.allowOverride=!1;if(this.wireframe===!0)n.wireframe=!0;if(this.wireframeLinewidth>1)n.wireframeLinewidth=this.wireframeLinewidth;if(this.wireframeLinecap!=="round")n.wireframeLinecap=this.wireframeLinecap;if(this.wireframeLinejoin!=="round")n.wireframeLinejoin=this.wireframeLinejoin;if(this.flatShading===!0)n.flatShading=!0;if(this.visible===!1)n.visible=!1;if(this.toneMapped===!1)n.toneMapped=!1;if(this.fog===!1)n.fog=!1;if(Object.keys(this.userData).length>0)n.userData=this.userData;function i(r){let s=[];for(let o in r){let a=r[o];delete a.metadata,s.push(a)}return s}if(t){let r=i(e.textures),s=i(e.images);if(r.length>0)n.textures=r;if(s.length>0)n.images=s}return n}fromJSON(e,t){if(e.uuid!==void 0)this.uuid=e.uuid;if(e.name!==void 0)this.name=e.name;if(e.color!==void 0&&this.color!==void 0)this.color.setHex(e.color);if(e.roughness!==void 0)this.roughness=e.roughness;if(e.metalness!==void 0)this.metalness=e.metalness;if(e.sheen!==void 0)this.sheen=e.sheen;if(e.sheenColor!==void 0)this.sheenColor=new Le().setHex(e.sheenColor);if(e.sheenRoughness!==void 0)this.sheenRoughness=e.sheenRoughness;if(e.emissive!==void 0&&this.emissive!==void 0)this.emissive.setHex(e.emissive);if(e.specular!==void 0&&this.specular!==void 0)this.specular.setHex(e.specular);if(e.specularIntensity!==void 0)this.specularIntensity=e.specularIntensity;if(e.specularColor!==void 0&&this.specularColor!==void 0)this.specularColor.setHex(e.specularColor);if(e.shininess!==void 0)this.shininess=e.shininess;if(e.clearcoat!==void 0)this.clearcoat=e.clearcoat;if(e.clearcoatRoughness!==void 0)this.clearcoatRoughness=e.clearcoatRoughness;if(e.dispersion!==void 0)this.dispersion=e.dispersion;if(e.iridescence!==void 0)this.iridescence=e.iridescence;if(e.iridescenceIOR!==void 0)this.iridescenceIOR=e.iridescenceIOR;if(e.iridescenceThicknessRange!==void 0)this.iridescenceThicknessRange=e.iridescenceThicknessRange;if(e.transmission!==void 0)this.transmission=e.transmission;if(e.thickness!==void 0)this.thickness=e.thickness;if(e.attenuationDistance!==void 0)this.attenuationDistance=e.attenuationDistance;if(e.attenuationColor!==void 0&&this.attenuationColor!==void 0)this.attenuationColor.setHex(e.attenuationColor);if(e.anisotropy!==void 0)this.anisotropy=e.anisotropy;if(e.anisotropyRotation!==void 0)this.anisotropyRotation=e.anisotropyRotation;if(e.fog!==void 0)this.fog=e.fog;if(e.flatShading!==void 0)this.flatShading=e.flatShading;if(e.blending!==void 0)this.blending=e.blending;if(e.combine!==void 0)this.combine=e.combine;if(e.side!==void 0)this.side=e.side;if(e.shadowSide!==void 0)this.shadowSide=e.shadowSide;if(e.opacity!==void 0)this.opacity=e.opacity;if(e.transparent!==void 0)this.transparent=e.transparent;if(e.alphaTest!==void 0)this.alphaTest=e.alphaTest;if(e.alphaHash!==void 0)this.alphaHash=e.alphaHash;if(e.depthFunc!==void 0)this.depthFunc=e.depthFunc;if(e.depthTest!==void 0)this.depthTest=e.depthTest;if(e.depthWrite!==void 0)this.depthWrite=e.depthWrite;if(e.colorWrite!==void 0)this.colorWrite=e.colorWrite;if(e.blendSrc!==void 0)this.blendSrc=e.blendSrc;if(e.blendDst!==void 0)this.blendDst=e.blendDst;if(e.blendEquation!==void 0)this.blendEquation=e.blendEquation;if(e.blendSrcAlpha!==void 0)this.blendSrcAlpha=e.blendSrcAlpha;if(e.blendDstAlpha!==void 0)this.blendDstAlpha=e.blendDstAlpha;if(e.blendEquationAlpha!==void 0)this.blendEquationAlpha=e.blendEquationAlpha;if(e.blendColor!==void 0&&this.blendColor!==void 0)this.blendColor.setHex(e.blendColor);if(e.blendAlpha!==void 0)this.blendAlpha=e.blendAlpha;if(e.stencilWriteMask!==void 0)this.stencilWriteMask=e.stencilWriteMask;if(e.stencilFunc!==void 0)this.stencilFunc=e.stencilFunc;if(e.stencilRef!==void 0)this.stencilRef=e.stencilRef;if(e.stencilFuncMask!==void 0)this.stencilFuncMask=e.stencilFuncMask;if(e.stencilFail!==void 0)this.stencilFail=e.stencilFail;if(e.stencilZFail!==void 0)this.stencilZFail=e.stencilZFail;if(e.stencilZPass!==void 0)this.stencilZPass=e.stencilZPass;if(e.stencilWrite!==void 0)this.stencilWrite=e.stencilWrite;if(e.wireframe!==void 0)this.wireframe=e.wireframe;if(e.wireframeLinewidth!==void 0)this.wireframeLinewidth=e.wireframeLinewidth;if(e.wireframeLinecap!==void 0)this.wireframeLinecap=e.wireframeLinecap;if(e.wireframeLinejoin!==void 0)this.wireframeLinejoin=e.wireframeLinejoin;if(e.rotation!==void 0)this.rotation=e.rotation;if(e.linewidth!==void 0)this.linewidth=e.linewidth;if(e.dashSize!==void 0)this.dashSize=e.dashSize;if(e.gapSize!==void 0)this.gapSize=e.gapSize;if(e.scale!==void 0)this.scale=e.scale;if(e.polygonOffset!==void 0)this.polygonOffset=e.polygonOffset;if(e.polygonOffsetFactor!==void 0)this.polygonOffsetFactor=e.polygonOffsetFactor;if(e.polygonOffsetUnits!==void 0)this.polygonOffsetUnits=e.polygonOffsetUnits;if(e.dithering!==void 0)this.dithering=e.dithering;if(e.alphaToCoverage!==void 0)this.alphaToCoverage=e.alphaToCoverage;if(e.premultipliedAlpha!==void 0)this.premultipliedAlpha=e.premultipliedAlpha;if(e.forceSinglePass!==void 0)this.forceSinglePass=e.forceSinglePass;if(e.allowOverride!==void 0)this.allowOverride=e.allowOverride;if(e.visible!==void 0)this.visible=e.visible;if(e.toneMapped!==void 0)this.toneMapped=e.toneMapped;if(e.userData!==void 0)this.userData=e.userData;if(e.vertexColors!==void 0)if(typeof e.vertexColors==="number")this.vertexColors=e.vertexColors>0;else this.vertexColors=e.vertexColors;if(e.size!==void 0)this.size=e.size;if(e.sizeAttenuation!==void 0)this.sizeAttenuation=e.sizeAttenuation;if(e.map!==void 0)this.map=t[e.map]||null;if(e.matcap!==void 0)this.matcap=t[e.matcap]||null;if(e.alphaMap!==void 0)this.alphaMap=t[e.alphaMap]||null;if(e.bumpMap!==void 0)this.bumpMap=t[e.bumpMap]||null;if(e.bumpScale!==void 0)this.bumpScale=e.bumpScale;if(e.normalMap!==void 0)this.normalMap=t[e.normalMap]||null;if(e.normalMapType!==void 0)this.normalMapType=e.normalMapType;if(e.normalScale!==void 0){let n=e.normalScale;if(Array.isArray(n)===!1)n=[n,n];this.normalScale=new Ie().fromArray(n)}if(e.displacementMap!==void 0)this.displacementMap=t[e.displacementMap]||null;if(e.displacementScale!==void 0)this.displacementScale=e.displacementScale;if(e.displacementBias!==void 0)this.displacementBias=e.displacementBias;if(e.roughnessMap!==void 0)this.roughnessMap=t[e.roughnessMap]||null;if(e.metalnessMap!==void 0)this.metalnessMap=t[e.metalnessMap]||null;if(e.emissiveMap!==void 0)this.emissiveMap=t[e.emissiveMap]||null;if(e.emissiveIntensity!==void 0)this.emissiveIntensity=e.emissiveIntensity;if(e.specularMap!==void 0)this.specularMap=t[e.specularMap]||null;if(e.specularIntensityMap!==void 0)this.specularIntensityMap=t[e.specularIntensityMap]||null;if(e.specularColorMap!==void 0)this.specularColorMap=t[e.specularColorMap]||null;if(e.envMap!==void 0)this.envMap=t[e.envMap]||null;if(e.envMapRotation!==void 0)this.envMapRotation.fromArray(e.envMapRotation);if(e.envMapIntensity!==void 0)this.envMapIntensity=e.envMapIntensity;if(e.reflectivity!==void 0)this.reflectivity=e.reflectivity;if(e.refractionRatio!==void 0)this.refractionRatio=e.refractionRatio;if(e.lightMap!==void 0)this.lightMap=t[e.lightMap]||null;if(e.lightMapIntensity!==void 0)this.lightMapIntensity=e.lightMapIntensity;if(e.aoMap!==void 0)this.aoMap=t[e.aoMap]||null;if(e.aoMapIntensity!==void 0)this.aoMapIntensity=e.aoMapIntensity;if(e.gradientMap!==void 0)this.gradientMap=t[e.gradientMap]||null;if(e.clearcoatMap!==void 0)this.clearcoatMap=t[e.clearcoatMap]||null;if(e.clearcoatRoughnessMap!==void 0)this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null;if(e.clearcoatNormalMap!==void 0)this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null;if(e.clearcoatNormalScale!==void 0)this.clearcoatNormalScale=new Ie().fromArray(e.clearcoatNormalScale);if(e.iridescenceMap!==void 0)this.iridescenceMap=t[e.iridescenceMap]||null;if(e.iridescenceThicknessMap!==void 0)this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null;if(e.transmissionMap!==void 0)this.transmissionMap=t[e.transmissionMap]||null;if(e.thicknessMap!==void 0)this.thicknessMap=t[e.thicknessMap]||null;if(e.anisotropyMap!==void 0)this.anisotropyMap=t[e.anisotropyMap]||null;if(e.sheenColorMap!==void 0)this.sheenColorMap=t[e.sheenColorMap]||null;if(e.sheenRoughnessMap!==void 0)this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null;return this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){if(e===!0)this.version++}}var ui=new N,fl=new N,Yo=new N,Pi=new N,dl=new N,jo=new N,pl=new N;class zi{constructor(e=new N,t=new N(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ui)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);if(n<0)return t.copy(this.origin);return t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ui.subVectors(e,this.origin).dot(this.direction);if(t<0)return this.origin.distanceToSquared(e);return ui.copy(this.origin).addScaledVector(this.direction,t),ui.distanceToSquared(e)}distanceSqToSegment(e,t,n,i){fl.copy(e).add(t).multiplyScalar(0.5),Yo.copy(t).sub(e).normalize(),Pi.copy(this.origin).sub(fl);let r=e.distanceTo(t)*0.5,s=-this.direction.dot(Yo),o=Pi.dot(this.direction),a=-Pi.dot(Yo),c=Pi.lengthSq(),l=Math.abs(1-s*s),u,f,h,d;if(l>0)if(u=s*a-o,f=s*o-a,d=r*l,u>=0)if(f>=-d)if(f<=d){let g=1/l;u*=g,f*=g,h=u*(u+s*f+2*o)+f*(s*u+f+2*a)+c}else f=r,u=Math.max(0,-(s*f+o)),h=-u*u+f*(f+2*a)+c;else f=-r,u=Math.max(0,-(s*f+o)),h=-u*u+f*(f+2*a)+c;else if(f<=-d)u=Math.max(0,-(-s*r+o)),f=u>0?-r:Math.min(Math.max(-r,-a),r),h=-u*u+f*(f+2*a)+c;else if(f<=d)u=0,f=Math.min(Math.max(-r,-a),r),h=f*(f+2*a)+c;else u=Math.max(0,-(s*r+o)),f=u>0?r:Math.min(Math.max(-r,-a),r),h=-u*u+f*(f+2*a)+c;else f=s>0?-r:r,u=Math.max(0,-(s*f+o)),h=-u*u+f*(f+2*a)+c;if(n)n.copy(this.origin).addScaledVector(this.direction,u);if(i)i.copy(fl).addScaledVector(Yo,f);return h}intersectSphere(e,t){ui.subVectors(e.center,this.origin);let n=ui.dot(this.direction),i=ui.dot(ui)-n*n,r=e.radius*e.radius;if(i>r)return null;let s=Math.sqrt(r-i),o=n-s,a=n+s;if(a<0)return null;if(o<0)return this.at(a,t);return this.at(o,t)}intersectsSphere(e){if(e.radius<0)return!1;return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0){if(e.distanceToPoint(this.origin)===0)return 0;return null}let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);if(n===null)return null;return this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);if(t===0)return!0;if(e.normal.dot(this.direction)*t<0)return!0;return!1}intersectBox(e,t){let n,i,r,s,o,a,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,f=this.origin;if(c>=0)n=(e.min.x-f.x)*c,i=(e.max.x-f.x)*c;else n=(e.max.x-f.x)*c,i=(e.min.x-f.x)*c;if(l>=0)r=(e.min.y-f.y)*l,s=(e.max.y-f.y)*l;else r=(e.max.y-f.y)*l,s=(e.min.y-f.y)*l;if(n>s||r>i)return null;if(r>n||isNaN(n))n=r;if(s<i||isNaN(i))i=s;if(u>=0)o=(e.min.z-f.z)*u,a=(e.max.z-f.z)*u;else o=(e.max.z-f.z)*u,a=(e.min.z-f.z)*u;if(n>a||o>i)return null;if(o>n||n!==n)n=o;if(a<i||i!==i)i=a;if(i<0)return null;return this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,ui)!==null}intersectTriangle(e,t,n,i,r){dl.subVectors(t,e),jo.subVectors(n,e),pl.crossVectors(dl,jo);let s=this.direction.dot(pl),o;if(s>0){if(i)return null;o=1}else if(s<0)o=-1,s=-s;else return null;Pi.subVectors(this.origin,e);let a=o*this.direction.dot(jo.crossVectors(Pi,jo));if(a<0)return null;let c=o*this.direction.dot(dl.cross(Pi));if(c<0)return null;if(a+c>s)return null;let l=-o*Pi.dot(pl);if(l<0)return null;return this.at(l/s,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Kn extends rn{constructor(e){super();this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qn,this.combine=0,this.reflectivity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}var qm=new ze,sr=new zi,Jo=new fn,Ym=new N,Ko=new N,Qo=new N,ea=new N,ml=new N,ta=new N,jm=new N,na=new N;class pt extends at{constructor(e=new tn,t=new Kn){super();this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){if(super.copy(e,t),e.morphTargetInfluences!==void 0)this.morphTargetInfluences=e.morphTargetInfluences.slice();if(e.morphTargetDictionary!==void 0)this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary);return this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,s=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let o=this.morphTargetInfluences;if(r&&o){ta.set(0,0,0);for(let a=0,c=r.length;a<c;a++){let l=o[a],u=r[a];if(l===0)continue;if(ml.fromBufferAttribute(u,e),s)ta.addScaledVector(ml,l);else ta.addScaledVector(ml.sub(t),l)}t.add(ta)}return t}raycast(e,t){let n=this.geometry,i=this.material,r=this.matrixWorld;if(i===void 0)return;if(n.boundingSphere===null)n.computeBoundingSphere();if(Jo.copy(n.boundingSphere),Jo.applyMatrix4(r),sr.copy(e.ray).recast(e.near),Jo.containsPoint(sr.origin)===!1){if(sr.intersectSphere(Jo,Ym)===null)return;if(sr.origin.distanceToSquared(Ym)>(e.far-e.near)**2)return}if(qm.copy(r).invert(),sr.copy(e.ray).applyMatrix4(qm),n.boundingBox!==null){if(sr.intersectsBox(n.boundingBox)===!1)return}this._computeIntersections(e,t,sr)}_computeIntersections(e,t,n){let i,r=this.geometry,s=this.material,o=r.index,a=r.attributes.position,c=r.attributes.uv,l=r.attributes.uv1,u=r.attributes.normal,{groups:f,drawRange:h}=r;if(o!==null)if(Array.isArray(s))for(let d=0,g=f.length;d<g;d++){let y=f[d],p=s[y.materialIndex],m=Math.max(y.start,h.start),A=Math.min(o.count,Math.min(y.start+y.count,h.start+h.count));for(let T=m,v=A;T<v;T+=3){let w=o.getX(T),E=o.getX(T+1),R=o.getX(T+2);if(i=ia(this,p,e,n,c,l,u,w,E,R),i)i.faceIndex=Math.floor(T/3),i.face.materialIndex=y.materialIndex,t.push(i)}}else{let d=Math.max(0,h.start),g=Math.min(o.count,h.start+h.count);for(let y=d,p=g;y<p;y+=3){let m=o.getX(y),A=o.getX(y+1),T=o.getX(y+2);if(i=ia(this,s,e,n,c,l,u,m,A,T),i)i.faceIndex=Math.floor(y/3),t.push(i)}}else if(a!==void 0)if(Array.isArray(s))for(let d=0,g=f.length;d<g;d++){let y=f[d],p=s[y.materialIndex],m=Math.max(y.start,h.start),A=Math.min(a.count,Math.min(y.start+y.count,h.start+h.count));for(let T=m,v=A;T<v;T+=3){let w=T,E=T+1,R=T+2;if(i=ia(this,p,e,n,c,l,u,w,E,R),i)i.faceIndex=Math.floor(T/3),i.face.materialIndex=y.materialIndex,t.push(i)}}else{let d=Math.max(0,h.start),g=Math.min(a.count,h.start+h.count);for(let y=d,p=g;y<p;y+=3){let m=y,A=y+1,T=y+2;if(i=ia(this,s,e,n,c,l,u,m,A,T),i)i.faceIndex=Math.floor(y/3),t.push(i)}}}}function Ay(e,t,n,i,r,s,o,a){let c;if(t.side===1)c=i.intersectTriangle(o,s,r,!0,a);else c=i.intersectTriangle(r,s,o,t.side===0,a);if(c===null)return null;na.copy(a),na.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(na);if(l<n.near||l>n.far)return null;return{distance:l,point:na.clone(),object:e}}function ia(e,t,n,i,r,s,o,a,c,l){e.getVertexPosition(a,Ko),e.getVertexPosition(c,Qo),e.getVertexPosition(l,ea);let u=Ay(e,t,n,i,Ko,Qo,ea,jm);if(u){let f=new N;if(yn.getBarycoord(jm,Ko,Qo,ea,f),r)u.uv=yn.getInterpolatedAttribute(r,a,c,l,f,new Ie);if(s)u.uv1=yn.getInterpolatedAttribute(s,a,c,l,f,new Ie);if(o){if(u.normal=yn.getInterpolatedAttribute(o,a,c,l,f,new N),u.normal.dot(i.direction)>0)u.normal.multiplyScalar(-1)}let h={a,b:c,c:l,normal:new N,materialIndex:0};yn.getNormal(Ko,Qo,ea,h.normal),u.face=h,u.barycoord=f}return u}var Ls=new st,Jm=new st,Km=new st,Ry=new st,Qm=new ze,ra=new N,gl=new fn,eg=new ze,_l=new zi;class Na extends pt{constructor(e,t){super(e,t);this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode="attached",this.bindMatrix=new ze,this.bindMatrixInverse=new ze,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;if(this.boundingBox===null)this.boundingBox=new en;this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,ra),this.boundingBox.expandByPoint(ra)}computeBoundingSphere(){let e=this.geometry;if(this.boundingSphere===null)this.boundingSphere=new fn;this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,ra),this.boundingSphere.expandByPoint(ra)}copy(e,t){if(super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null)this.boundingBox=e.boundingBox.clone();if(e.boundingSphere!==null)this.boundingSphere=e.boundingSphere.clone();return this}raycast(e,t){let n=this.material,i=this.matrixWorld;if(n===void 0)return;if(this.boundingSphere===null)this.computeBoundingSphere();if(gl.copy(this.boundingSphere),gl.applyMatrix4(i),e.ray.intersectsSphere(gl)===!1)return;if(eg.copy(i).invert(),_l.copy(e.ray).applyMatrix4(eg),this.boundingBox!==null){if(_l.intersectsBox(this.boundingBox)===!1)return}this._computeIntersections(e,t,_l)}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){if(this.skeleton=e,t===void 0)this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld;this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new st,t=this.geometry.attributes.skinWeight;for(let n=0,i=t.count;n<i;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();if(r!==1/0)e.multiplyScalar(r);else e.set(1,0,0,0);t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){if(super.updateMatrixWorld(e),this.bindMode==="attached")this.bindMatrixInverse.copy(this.matrixWorld).invert();else if(this.bindMode==="detached")this.bindMatrixInverse.copy(this.bindMatrix).invert();else Me("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,i=this.geometry;if(Jm.fromBufferAttribute(i.attributes.skinIndex,e),Km.fromBufferAttribute(i.attributes.skinWeight,e),t.isVector4)Ls.copy(t),t.set(0,0,0,0);else Ls.set(...t,1),t.set(0,0,0);Ls.applyMatrix4(this.bindMatrix);for(let r=0;r<4;r++){let s=Km.getComponent(r);if(s!==0){let o=Jm.getComponent(r);Qm.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),t.addScaledVector(Ry.copy(Ls).applyMatrix4(Qm),s)}}if(t.isVector4)t.w=Ls.w;return t.applyMatrix4(this.bindMatrixInverse)}}class Ys extends at{constructor(){super();this.isBone=!0,this.type="Bone"}}class js extends wt{constructor(e=null,t=1,n=1,i,r,s,o,a,c=1003,l=1003,u,f){super(null,s,o,a,c,l,i,r,u,f);this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}var tg=new ze,Cy=new ze;class Js{constructor(e=[],t=[]){this.uuid=Dn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){Me("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new ze)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let n=new ze;if(this.bones[e])n.copy(this.bones[e].matrixWorld).invert();this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];if(n)n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];if(n){if(n.parent&&n.parent.isBone)n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld);else n.matrix.copy(n.matrixWorld);n.matrix.decompose(n.position,n.quaternion,n.scale)}}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let r=0,s=e.length;r<s;r++){let o=e[r]?e[r].matrixWorld:Cy;tg.multiplyMatrices(o,t[r]),tg.toArray(n,r*16)}if(i!==null)i.needsUpdate=!0}clone(){return new Js(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new js(t,e,e,1023,1015);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let i=this.bones[t];if(i.name===e)return i}return}dispose(){if(this.boneTexture!==null)this.boneTexture.dispose(),this.boneTexture=null}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,i=e.bones.length;n<i;n++){let r=e.bones[n],s=t[r];if(s===void 0)Me("Skeleton: No bone found with UUID:",r),s=new Ys;this.bones.push(s),this.boneInverses.push(new ze().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let i=0,r=t.length;i<r;i++){let s=t[i];e.bones.push(s.uuid);let o=n[i];e.boneInverses.push(o.toArray())}return e}}class lr extends Nt{constructor(e,t,n,i=1){super(e,t,n);this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}var zr=new ze,ng=new ze,sa=[],ig=new en,Iy=new ze,Ns=new pt,Ds=new fn;class ns extends pt{constructor(e,t,n){super(e,t);this.isInstancedMesh=!0,this.instanceMatrix=new lr(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,Iy)}computeBoundingBox(){let e=this.geometry,t=this.count;if(this.boundingBox===null)this.boundingBox=new en;if(e.boundingBox===null)e.computeBoundingBox();this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,zr),ig.copy(e.boundingBox).applyMatrix4(zr),this.boundingBox.union(ig)}computeBoundingSphere(){let e=this.geometry,t=this.count;if(this.boundingSphere===null)this.boundingSphere=new fn;if(e.boundingSphere===null)e.computeBoundingSphere();this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,zr),Ds.copy(e.boundingSphere).applyMatrix4(zr),this.boundingSphere.union(Ds)}copy(e,t){if(super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null)this.morphTexture=e.morphTexture.clone();if(e.instanceColor!==null)this.instanceColor=e.instanceColor.clone();if(this.count=e.count,e.boundingBox!==null)this.boundingBox=e.boundingBox.clone();if(e.boundingSphere!==null)this.boundingSphere=e.boundingSphere.clone();return this}getColorAt(e,t){if(this.instanceColor===null)return t.setRGB(1,1,1);else return t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,s=e*r+1;for(let o=0;o<n.length;o++)n[o]=i[s+o]}raycast(e,t){let n=this.matrixWorld,i=this.count;if(Ns.geometry=this.geometry,Ns.material=this.material,Ns.material===void 0)return;if(this.boundingSphere===null)this.computeBoundingSphere();if(Ds.copy(this.boundingSphere),Ds.applyMatrix4(n),e.ray.intersectsSphere(Ds)===!1)return;for(let r=0;r<i;r++){this.getMatrixAt(r,zr),ng.multiplyMatrices(n,zr),Ns.matrixWorld=ng,Ns.raycast(e,sa);for(let s=0,o=sa.length;s<o;s++){let a=sa[s];a.instanceId=r,a.object=this,t.push(a)}sa.length=0}}setColorAt(e,t){if(this.instanceColor===null)this.instanceColor=new lr(new Float32Array(this.instanceMatrix.count*3).fill(1),3);return t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,i=n.length+1;if(this.morphTexture===null)this.morphTexture=new js(new Float32Array(i*this.count),i,this.count,1028,1015);let r=this.morphTexture.source.data.data,s=0;for(let c=0;c<n.length;c++)s+=n[c];let o=this.geometry.morphTargetsRelative?1:1-s,a=i*e;return r[a]=o,r.set(n,a+1),this}updateMorphTargets(){}dispose(){if(this.dispatchEvent({type:"dispose"}),this.morphTexture!==null)this.morphTexture.dispose(),this.morphTexture=null}}var xl=new N,Py=new N,Ly=new Ue;class Ln{constructor(e=new N(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=xl.subVectors(n,t).cross(Py.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let i=e.delta(xl),r=this.normal.dot(i);if(r===0){if(this.distanceToPoint(e.start)===0)return t.copy(e.start);return null}let s=-(e.start.dot(this.normal)+this.constant)/r;if(n===!0&&(s<0||s>1))return null;return t.copy(e.start).addScaledVector(i,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Ly.getNormalMatrix(e),i=this.coplanarPoint(xl).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}var or=new fn,Ny=new Ie(0.5,0.5),oa=new N;class Ks{constructor(e=new Ln,t=new Ln,n=new Ln,i=new Ln,r=new Ln,s=new Ln){this.planes=[e,t,n,i,r,s]}set(e,t,n,i,r,s){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(s),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=2000,n=!1){let i=this.planes,r=e.elements,s=r[0],o=r[1],a=r[2],c=r[3],l=r[4],u=r[5],f=r[6],h=r[7],d=r[8],g=r[9],y=r[10],p=r[11],m=r[12],A=r[13],T=r[14],v=r[15];if(i[0].setComponents(c-s,h-l,p-d,v-m).normalize(),i[1].setComponents(c+s,h+l,p+d,v+m).normalize(),i[2].setComponents(c+o,h+u,p+g,v+A).normalize(),i[3].setComponents(c-o,h-u,p-g,v-A).normalize(),n)i[4].setComponents(a,f,y,T).normalize(),i[5].setComponents(c-a,h-f,p-y,v-T).normalize();else if(i[4].setComponents(c-a,h-f,p-y,v-T).normalize(),t===2000)i[5].setComponents(c+a,h+f,p+y,v+T).normalize();else if(t===2001)i[5].setComponents(a,f,y,T).normalize();else throw Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0){if(e.boundingSphere===null)e.computeBoundingSphere();or.copy(e.boundingSphere).applyMatrix4(e.matrixWorld)}else{let t=e.geometry;if(t.boundingSphere===null)t.computeBoundingSphere();or.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(or)}intersectsSprite(e){or.center.set(0,0,0);let t=Ny.distanceTo(e.center);return or.radius=0.7071067811865476+t,or.applyMatrix4(e.matrixWorld),this.intersectsSphere(or)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(oa.x=i.normal.x>0?e.max.x:e.min.x,oa.y=i.normal.y>0?e.max.y:e.min.y,oa.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(oa)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Qs extends rn{constructor(e){super();this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Le(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}var pa=new N,ma=new N,rg=new ze,Us=new zi,aa=new fn,vl=new N,sg=new N;class ki extends at{constructor(e=new tn,t=new Qs){super();this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let i=1,r=t.count;i<r;i++)pa.fromBufferAttribute(t,i-1),ma.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=pa.distanceTo(ma);e.setAttribute("lineDistance",new nn(n,1))}else Me("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Line.threshold,s=n.drawRange;if(n.boundingSphere===null)n.computeBoundingSphere();if(aa.copy(n.boundingSphere),aa.applyMatrix4(i),aa.radius+=r,e.ray.intersectsSphere(aa)===!1)return;rg.copy(i).invert(),Us.copy(e.ray).applyMatrix4(rg);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),a=o*o,c=this.isLineSegments?2:1,l=n.index,f=n.attributes.position;if(l!==null){let h=Math.max(0,s.start),d=Math.min(l.count,s.start+s.count);for(let g=h,y=d-1;g<y;g+=c){let p=l.getX(g),m=l.getX(g+1),A=ca(this,e,Us,a,p,m,g);if(A)t.push(A)}if(this.isLineLoop){let g=l.getX(d-1),y=l.getX(h),p=ca(this,e,Us,a,g,y,d-1);if(p)t.push(p)}}else{let h=Math.max(0,s.start),d=Math.min(f.count,s.start+s.count);for(let g=h,y=d-1;g<y;g+=c){let p=ca(this,e,Us,a,g,g+1,g);if(p)t.push(p)}if(this.isLineLoop){let g=ca(this,e,Us,a,d-1,h,d-1);if(g)t.push(g)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function ca(e,t,n,i,r,s,o){let a=e.geometry.attributes.position;if(pa.fromBufferAttribute(a,r),ma.fromBufferAttribute(a,s),n.distanceSqToSegment(pa,ma,vl,sg)>i)return;vl.applyMatrix4(e.matrixWorld);let l=t.ray.origin.distanceTo(vl);if(l<t.near||l>t.far)return;return{distance:l,point:sg.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var og=new N,ag=new N;class Da extends ki{constructor(e,t){super(e,t);this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let i=0,r=t.count;i<r;i+=2)og.fromBufferAttribute(t,i),ag.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+og.distanceTo(ag);e.setAttribute("lineDistance",new nn(n,1))}else Me("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Ua extends ki{constructor(e,t){super(e,t);this.isLineLoop=!0,this.type="LineLoop"}}class eo extends rn{constructor(e){super();this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Le(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}var cg=new ze,Sl=new zi,la=new fn,ua=new N;class is extends at{constructor(e=new tn,t=new eo){super();this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Points.threshold,s=n.drawRange;if(n.boundingSphere===null)n.computeBoundingSphere();if(la.copy(n.boundingSphere),la.applyMatrix4(i),la.radius+=r,e.ray.intersectsSphere(la)===!1)return;cg.copy(i).invert(),Sl.copy(e.ray).applyMatrix4(cg);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),a=o*o,c=n.index,u=n.attributes.position;if(c!==null){let f=Math.max(0,s.start),h=Math.min(c.count,s.start+s.count);for(let d=f,g=h;d<g;d++){let y=c.getX(d);ua.fromBufferAttribute(u,y),lg(ua,y,a,i,e,t,this)}}else{let f=Math.max(0,s.start),h=Math.min(u.count,s.start+s.count);for(let d=f,g=h;d<g;d++)ua.fromBufferAttribute(u,d),lg(ua,d,a,i,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function lg(e,t,n,i,r,s,o){let a=Sl.distanceSqToPoint(e);if(a<n){let c=new N;Sl.closestPointToPoint(e,c),c.applyMatrix4(i);let l=r.ray.origin.distanceTo(c);if(l<r.near||l>r.far)return;s.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class Oa extends wt{constructor(e=[],t=301,n,i,r,s,o,a,c,l){super(e,t,n,i,r,s,o,a,c,l);this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Bi extends wt{constructor(e,t,n=1014,i,r,s,o=1003,a=1003,c,l=1026,u=1){if(l!==1026&&l!==1027)throw Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:e,height:t,depth:u};super(f,i,r,s,o,a,l,n,c);this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Zs(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);if(this.compareFunction!==null)t.compareFunction=this.compareFunction;return t}}class Eu extends Bi{constructor(e,t=1014,n=301,i,r,s=1003,o=1003,a,c=1026){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,i,r,s,o,a,c);this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class Fa extends wt{constructor(e=null){super();this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Gi extends tn{constructor(e=1,t=1,n=1,i=1,r=1,s=1){super();this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:s};let o=this;i=Math.floor(i),r=Math.floor(r),s=Math.floor(s);let a=[],c=[],l=[],u=[],f=0,h=0;d("z","y","x",-1,-1,n,t,e,s,r,0),d("z","y","x",1,-1,n,t,-e,s,r,1),d("x","z","y",1,1,e,n,t,i,s,2),d("x","z","y",1,-1,e,n,-t,i,s,3),d("x","y","z",1,-1,e,t,n,i,r,4),d("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(a),this.setAttribute("position",new nn(c,3)),this.setAttribute("normal",new nn(l,3)),this.setAttribute("uv",new nn(u,2));function d(g,y,p,m,A,T,v,w,E,R,_){let S=T/E,F=v/R,C=T/2,z=v/2,J=w/2,O=E+1,H=R+1,V=0,U=0,K=new N;for(let Q=0;Q<H;Q++){let se=Q*F-z;for(let me=0;me<O;me++){let _e=me*S-C;K[g]=_e*m,K[y]=se*A,K[p]=J,c.push(K.x,K.y,K.z),K[g]=0,K[y]=0,K[p]=w>0?1:-1,l.push(K.x,K.y,K.z),u.push(me/E),u.push(1-Q/R),V+=1}}for(let Q=0;Q<R;Q++)for(let se=0;se<E;se++){let me=f+se+O*Q,_e=f+se+O*(Q+1),qe=f+(se+1)+O*(Q+1),Ge=f+(se+1)+O*Q;a.push(me,_e,Ge),a.push(_e,qe,Ge),U+=6}o.addGroup(h,U,_),h+=U,f+=V}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Gi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class to extends tn{constructor(e=1,t=1,n=1,i=1){super();this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let r=e/2,s=t/2,o=Math.floor(n),a=Math.floor(i),c=o+1,l=a+1,u=e/o,f=t/a,h=[],d=[],g=[],y=[];for(let p=0;p<l;p++){let m=p*f-s;for(let A=0;A<c;A++){let T=A*u-r;d.push(T,-m,0),g.push(0,0,1),y.push(A/o),y.push(1-p/a)}}for(let p=0;p<a;p++)for(let m=0;m<o;m++){let A=m+c*p,T=m+c*(p+1),v=m+1+c*(p+1),w=m+1+c*p;h.push(A,T,w),h.push(T,v,w)}this.setIndex(h),this.setAttribute("position",new nn(d,3)),this.setAttribute("normal",new nn(g,3)),this.setAttribute("uv",new nn(y,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new to(e.width,e.height,e.widthSegments,e.heightSegments)}}function gr(e){let t={};for(let n in e){t[n]={};for(let i in e[n]){let r=e[n][i];if(ug(r))if(r.isRenderTargetTexture)Me("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[n][i]=null;else t[n][i]=r.clone();else if(Array.isArray(r))if(ug(r[0])){let s=[];for(let o=0,a=r.length;o<a;o++)s[o]=r[o].clone();t[n][i]=s}else t[n][i]=r.slice();else t[n][i]=r}}return t}function jt(e){let t={};for(let n=0;n<e.length;n++){let i=gr(e[n]);for(let r in i)t[r]=i[r]}return t}function ug(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Dy(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Au(e){let t=e.getRenderTarget();if(t===null)return e.outputColorSpace;if(t.isXRRenderTarget===!0)return t.texture.colorSpace;return We.workingColorSpace}var g_={clone:gr,merge:jt},Uy=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Oy=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Mn extends rn{constructor(e){super();if(this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Uy,this.fragmentShader=Oy,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0)this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=gr(e.uniforms),this.uniformsGroups=Dy(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let s=this.uniforms[i].value;if(s&&s.isTexture)t.uniforms[i]={type:"t",value:s.toJSON(e).uuid};else if(s&&s.isColor)t.uniforms[i]={type:"c",value:s.getHex()};else if(s&&s.isVector2)t.uniforms[i]={type:"v2",value:s.toArray()};else if(s&&s.isVector3)t.uniforms[i]={type:"v3",value:s.toArray()};else if(s&&s.isVector4)t.uniforms[i]={type:"v4",value:s.toArray()};else if(s&&s.isMatrix3)t.uniforms[i]={type:"m3",value:s.toArray()};else if(s&&s.isMatrix4)t.uniforms[i]={type:"m4",value:s.toArray()};else t.uniforms[i]={value:s}}if(Object.keys(this.defines).length>0)t.defines=this.defines;t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)if(this.extensions[i]===!0)n[i]=!0;if(Object.keys(n).length>0)t.extensions=n;return t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let i=e.uniforms[n];switch(this.uniforms[n]={},i.type){case"t":this.uniforms[n].value=t[i.value]||null;break;case"c":this.uniforms[n].value=new Le().setHex(i.value);break;case"v2":this.uniforms[n].value=new Ie().fromArray(i.value);break;case"v3":this.uniforms[n].value=new N().fromArray(i.value);break;case"v4":this.uniforms[n].value=new st().fromArray(i.value);break;case"m3":this.uniforms[n].value=new Ue().fromArray(i.value);break;case"m4":this.uniforms[n].value=new ze().fromArray(i.value);break;default:this.uniforms[n].value=i.value}}if(e.defines!==void 0)this.defines=e.defines;if(e.vertexShader!==void 0)this.vertexShader=e.vertexShader;if(e.fragmentShader!==void 0)this.fragmentShader=e.fragmentShader;if(e.glslVersion!==void 0)this.glslVersion=e.glslVersion;if(e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];if(e.lights!==void 0)this.lights=e.lights;if(e.clipping!==void 0)this.clipping=e.clipping;return this}}class Ru extends Mn{constructor(e){super(e);this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class mi extends rn{constructor(e){super();this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Le(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new Ie(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class dn extends mi{constructor(e){super();this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new Ie(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return $e(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+0.4*t)/(1-0.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Le(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Le(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Le(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){if(this._anisotropy>0!==e>0)this.version++;this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){if(this._clearcoat>0!==e>0)this.version++;this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){if(this._iridescence>0!==e>0)this.version++;this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){if(this._dispersion>0!==e>0)this.version++;this._dispersion=e}get sheen(){return this._sheen}set sheen(e){if(this._sheen>0!==e>0)this.version++;this._sheen=e}get transmission(){return this._transmission}set transmission(e){if(this._transmission>0!==e>0)this.version++;this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}class za extends rn{constructor(e){super();this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new Ie(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qn,this.combine=0,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Cu extends rn{constructor(e){super();this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Iu extends rn{constructor(e){super();this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}function ha(e,t){if(!e||e.constructor===t)return e;if(typeof t.BYTES_PER_ELEMENT==="number")return new t(e);return Array.prototype.slice.call(e)}function Fy(e){function t(r,s){return e[r]-e[s]}let n=e.length,i=Array(n);for(let r=0;r!==n;++r)i[r]=r;return i.sort(t),i}function hg(e,t,n){let i=e.length,r=new e.constructor(i);for(let s=0,o=0;o!==i;++s){let a=n[s]*t;for(let c=0;c!==t;++c)r[o++]=e[a+c]}return r}function zy(e,t,n,i){let r=1,s=e[0];while(s!==void 0&&s[i]===void 0)s=e[r++];if(s===void 0)return;let o=s[i];if(o===void 0)return;if(Array.isArray(o))do{if(o=s[i],o!==void 0)t.push(s.time),n.push(...o);s=e[r++]}while(s!==void 0);else if(o.toArray!==void 0)do{if(o=s[i],o!==void 0)t.push(s.time),o.toArray(n,n.length);s=e[r++]}while(s!==void 0);else do{if(o=s[i],o!==void 0)t.push(s.time),n.push(o);s=e[r++]}while(s!==void 0)}class gi{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],r=t[n-1];e:{t:{let s;n:{i:if(!(e<i)){for(let o=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=t[++n],e<i)break t}s=t.length;break n}if(!(e>=r)){let o=t[1];if(e<o)n=2,r=o;for(let a=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(i=r,r=t[--n-1],e>=r)break t}s=n,n=0;break n}break e}while(n<s){let o=n+s>>>1;if(e<t[o])s=o;else n=o+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let s=0;s!==i;++s)t[s]=n[r+s];return t}interpolate_(){throw Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}}class Pu extends gi{constructor(e,t,n,i){super(e,t,n,i);this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:2400,endingEnd:2400}}intervalChanged_(e,t,n){let i=this.parameterPositions,r=e-2,s=e+1,o=i[r],a=i[s];if(o===void 0)switch(this.getSettings_().endingStart){case 2401:r=e,o=2*t-n;break;case 2402:r=i.length-2,o=t+i[r]-i[r+1];break;default:r=e,o=n}if(a===void 0)switch(this.getSettings_().endingEnd){case 2401:s=e,a=2*n-t;break;case 2402:s=1,a=n+i[1]-i[0];break;default:s=e-1,a=t}let c=(n-t)*0.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(a-n),this._offsetPrev=r*l,this._offsetNext=s*l}interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,c=a-o,l=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,h=this._weightNext,d=(n-t)/(i-t),g=d*d,y=g*d,p=-f*y+2*f*g-f*d,m=(1+f)*y+(-1.5-2*f)*g+(-0.5+f)*d+1,A=(-1-h)*y+(1.5+h)*g+0.5*d,T=h*y-h*g;for(let v=0;v!==o;++v)r[v]=p*s[l+v]+m*s[c+v]+A*s[a+v]+T*s[u+v];return r}}class ka extends gi{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,c=a-o,l=(n-t)/(i-t),u=1-l;for(let f=0;f!==o;++f)r[f]=s[c+f]*u+s[a+f]*l;return r}}class Lu extends gi{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}}class Nu extends gi{interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,c=a-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let d=(n-t)/(i-t),g=1-d;for(let y=0;y!==o;++y)r[y]=s[c+y]*g+s[a+y]*d;return r}let f=o*2,h=e-1;for(let d=0;d!==o;++d){let g=s[c+d],y=s[a+d],p=h*f+d*2,m=u[p],A=u[p+1],T=e*f+d*2,v=l[T],w=l[T+1],E=(n-t)/(i-t),R,_,S,F,C;for(let z=0;z<8;z++){R=E*E,_=R*E,S=1-E,F=S*S,C=F*S;let O=C*t+3*F*E*m+3*S*R*v+_*i-n;if(Math.abs(O)<0.0000000001)break;let H=3*F*(m-t)+6*S*E*(v-m)+3*R*(i-v);if(Math.abs(H)<0.0000000001)break;E=E-O/H,E=Math.max(0,Math.min(1,E))}r[d]=C*g+3*F*E*A+3*S*R*w+_*y}return r}}class pn{constructor(e,t,n,i){if(e===void 0)throw Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=ha(t,this.TimeBufferType),this.values=ha(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:ha(e.times,Array),values:ha(e.values,Array)};let i=e.getInterpolation();if(i!==e.DefaultInterpolation)n.interpolation=i}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Lu(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new ka(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Pu(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Nu(this.times,this.values,this.getValueSize(),e);if(this.settings)t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents;return t}setInterpolation(e){let t;switch(e){case 2300:t=this.InterpolantFactoryMethodDiscrete;break;case 2301:t=this.InterpolantFactoryMethodLinear;break;case 2302:t=this.InterpolantFactoryMethodSmooth;break;case 2303:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(n);return Me("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return 2300;case this.InterpolantFactoryMethodLinear:return 2301;case this.InterpolantFactoryMethodSmooth:return 2302;case this.InterpolantFactoryMethodBezier:return 2303}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){let n=this.times,i=n.length,r=0,s=i-1;while(r!==i&&n[r]<e)++r;while(s!==-1&&n[s]>t)--s;if(++s,r!==0||s!==i){if(r>=s)s=Math.max(s,1),r=s-1;let o=this.getValueSize();this.times=n.slice(r,s),this.values=this.values.slice(r*o,s*o)}return this}validate(){let e=!0,t=this.getValueSize();if(t-Math.floor(t)!==0)Ne("KeyframeTrack: Invalid value size in track.",this),e=!1;let n=this.times,i=this.values,r=n.length;if(r===0)Ne("KeyframeTrack: Track is empty.",this),e=!1;let s=null;for(let o=0;o!==r;o++){let a=n[o];if(typeof a==="number"&&isNaN(a)){Ne("KeyframeTrack: Time is not a valid number.",this,o,a),e=!1;break}if(s!==null&&s>a){Ne("KeyframeTrack: Out of order keys.",this,o,a,s),e=!1;break}s=a}if(i!==void 0){if(jv(i))for(let o=0,a=i.length;o!==a;++o){let c=i[o];if(isNaN(c)){Ne("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===2302,r=e.length-1,s=1;for(let o=1;o<r;++o){let a=!1,c=e[o],l=e[o+1];if(c!==l&&(o!==1||c!==e[0]))if(!i){let u=o*n,f=u-n,h=u+n;for(let d=0;d!==n;++d){let g=t[u+d];if(g!==t[f+d]||g!==t[h+d]){a=!0;break}}}else a=!0;if(a){if(o!==s){e[s]=e[o];let u=o*n,f=s*n;for(let h=0;h!==n;++h)t[f+h]=t[u+h]}++s}}if(r>0){e[s]=e[r];for(let o=r*n,a=s*n,c=0;c!==n;++c)t[a+c]=t[o+c];++s}if(s!==e.length)this.times=e.slice(0,s),this.values=t.slice(0,s*n);else this.times=e,this.values=t;return this}clone(){let e=this.times.slice(),t=this.values.slice(),i=new this.constructor(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}}pn.prototype.ValueTypeName="";pn.prototype.TimeBufferType=Float32Array;pn.prototype.ValueBufferType=Float32Array;pn.prototype.DefaultInterpolation=2301;class Hi extends pn{constructor(e,t,n){super(e,t,n)}}Hi.prototype.ValueTypeName="bool";Hi.prototype.ValueBufferType=Array;Hi.prototype.DefaultInterpolation=2300;Hi.prototype.InterpolantFactoryMethodLinear=void 0;Hi.prototype.InterpolantFactoryMethodSmooth=void 0;class Ba extends pn{constructor(e,t,n,i){super(e,t,n,i)}}Ba.prototype.ValueTypeName="color";class Vi extends pn{constructor(e,t,n,i){super(e,t,n,i)}}Vi.prototype.ValueTypeName="number";class Du extends gi{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=(n-t)/(i-t),c=e*o;for(let l=c+o;c!==l;c+=4)Bt.slerpFlat(r,0,s,c-o,s,c,a);return r}}class Wi extends pn{constructor(e,t,n,i){super(e,t,n,i)}InterpolantFactoryMethodLinear(e){return new Du(this.times,this.values,this.getValueSize(),e)}}Wi.prototype.ValueTypeName="quaternion";Wi.prototype.InterpolantFactoryMethodSmooth=void 0;class $i extends pn{constructor(e,t,n){super(e,t,n)}}$i.prototype.ValueTypeName="string";$i.prototype.ValueBufferType=Array;$i.prototype.DefaultInterpolation=2300;$i.prototype.InterpolantFactoryMethodLinear=void 0;$i.prototype.InterpolantFactoryMethodSmooth=void 0;class _r extends pn{constructor(e,t,n,i){super(e,t,n,i)}}_r.prototype.ValueTypeName="vector";class $r{constructor(e="",t=-1,n=[],i=2500){if(this.name=e,this.tracks=n,this.duration=t,this.blendMode=i,this.uuid=Dn(),this.userData={},this.duration<0)this.resetDuration()}static parse(e){let t=[],n=e.tracks,i=1/(e.fps||1);for(let s=0,o=n.length;s!==o;++s)t.push(By(n[s]).scale(i));let r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){let t=[],n=e.tracks,i={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,s=n.length;r!==s;++r)t.push(pn.toJSON(n[r]));return i}static CreateFromMorphTargetSequence(e,t,n,i){let r=t.length,s=[];for(let o=0;o<r;o++){let a=[],c=[];a.push((o+r-1)%r,o,(o+1)%r),c.push(0,1,0);let l=Fy(a);if(a=hg(a,1,l),c=hg(c,1,l),!i&&a[0]===0)a.push(r),c.push(c[0]);s.push(new Vi(".morphTargetInfluences["+t[o].name+"]",a,c).scale(1/n))}return new this(e,-1,s)}static findByName(e,t){let n=e;if(!Array.isArray(e)){let i=e;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===t)return n[i];return null}static CreateClipsFromMorphTargetSequences(e,t,n){let i={},r=/^([\w-]*?)([\d]+)$/;for(let o=0,a=e.length;o<a;o++){let c=e[o],l=c.name.match(r);if(l&&l.length>1){let u=l[1],f=i[u];if(!f)i[u]=f=[];f.push(c)}}let s=[];for(let o in i)s.push(this.CreateFromMorphTargetSequence(o,i[o],t,n));return s}resetDuration(){let e=this.tracks,t=0;for(let n=0,i=e.length;n!==i;++n){let r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let n=0;n<this.tracks.length;n++)e.push(this.tracks[n].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}}function ky(e){switch(e.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Vi;case"vector":case"vector2":case"vector3":case"vector4":return _r;case"color":return Ba;case"quaternion":return Wi;case"bool":case"boolean":return Hi;case"string":return $i}throw Error("THREE.KeyframeTrack: Unsupported typeName: "+e)}function By(e){if(e.type===void 0)throw Error("THREE.KeyframeTrack: track type undefined, can not parse");let t=ky(e.type);if(e.times===void 0){let n=[],i=[];zy(e.keys,n,i,"value"),e.times=n,e.values=i}if(t.parse!==void 0)return t.parse(e);else return new t(e.name,e.times,e.values,e.interpolation)}var Xn={enabled:!1,files:{},add:function(e,t){if(this.enabled===!1)return;if(fg(e))return;this.files[e]=t},get:function(e){if(this.enabled===!1)return;if(fg(e))return;return this.files[e]},remove:function(e){delete this.files[e]},clear:function(){this.files={}}};function fg(e){try{let t=e.slice(e.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch(t){return!1}}class no{constructor(e,t,n){let i=this,r=!1,s=0,o=0,a=void 0,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(l){if(o++,r===!1){if(i.onStart!==void 0)i.onStart(l,s,o)}r=!0},this.itemEnd=function(l){if(s++,i.onProgress!==void 0)i.onProgress(l,s,o);if(s===o){if(r=!1,i.onLoad!==void 0)i.onLoad()}},this.itemError=function(l){if(i.onError!==void 0)i.onError(l)},this.resolveURL=function(l){if(l=l.normalize("NFC"),a)return a(l);return l},this.setURLModifier=function(l){return a=l,this},this.addHandler=function(l,u){return c.push(l,u),this},this.removeHandler=function(l){let u=c.indexOf(l);if(u!==-1)c.splice(u,2);return this},this.getHandler=function(l){for(let u=0,f=c.length;u<f;u+=2){let h=c[u],d=c[u+1];if(h.global)h.lastIndex=0;if(h.test(l))return d}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){if(!this._abortController)this._abortController=new AbortController;return this._abortController}}var __=new no;class _i{constructor(e){if(this.manager=e!==void 0?e:__,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}_i.DEFAULT_MATERIAL_NAME="__DEFAULT";var hi={};class x_ extends Error{constructor(e,t){super(e);this.response=t}}class io extends _i{constructor(e){super(e);this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,i){if(e===void 0)e="";if(this.path!==void 0)e=this.path+e;e=this.manager.resolveURL(e);let r=Xn.get(`file:${e}`);if(r!==void 0){this.manager.itemStart(e),setTimeout(()=>{if(t)t(r);this.manager.itemEnd(e)},0);return}if(hi[e]!==void 0){hi[e].push({onLoad:t,onProgress:n,onError:i});return}hi[e]=[],hi[e].push({onLoad:t,onProgress:n,onError:i});let s=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any==="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,a=this.responseType;fetch(s).then((c)=>{if(c.status===200||c.status===0){if(c.status===0)Me("FileLoader: HTTP Status 0 received.");if(typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let l=hi[e],u=c.body.getReader(),f=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),h=f?parseInt(f):0,d=h!==0,g=0,y=new ReadableStream({start(p){m();function m(){u.read().then(({done:A,value:T})=>{if(A)p.close();else{g+=T.byteLength;let v=new ProgressEvent("progress",{lengthComputable:d,loaded:g,total:h});for(let w=0,E=l.length;w<E;w++){let R=l[w];if(R.onProgress)R.onProgress(v)}p.enqueue(T),m()}},(A)=>{p.error(A)})}}});return new Response(y)}else throw new x_(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then((c)=>{switch(a){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then((l)=>new DOMParser().parseFromString(l,o));case"json":return c.json();default:if(o==="")return c.text();else{let u=/charset="?([^;"\s]*)"?/i.exec(o),f=u&&u[1]?u[1].toLowerCase():void 0,h=new TextDecoder(f);return c.arrayBuffer().then((d)=>h.decode(d))}}}).then((c)=>{Xn.add(`file:${e}`,c);let l=hi[e];delete hi[e];for(let u=0,f=l.length;u<f;u++){let h=l[u];if(h.onLoad)h.onLoad(c)}}).catch((c)=>{let l=hi[e];if(l===void 0)throw this.manager.itemError(e),c;delete hi[e];for(let u=0,f=l.length;u<f;u++){let h=l[u];if(h.onError)h.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}var kr=new WeakMap;class Uu extends _i{constructor(e){super(e)}load(e,t,n,i){if(this.path!==void 0)e=this.path+e;e=this.manager.resolveURL(e);let r=this,s=Xn.get(`image:${e}`);if(s!==void 0){if(s.complete===!0)r.manager.itemStart(e),setTimeout(function(){if(t)t(s);r.manager.itemEnd(e)},0);else{let u=kr.get(s);if(u===void 0)u=[],kr.set(s,u);u.push({onLoad:t,onError:i})}return s}let o=Vr("img");function a(){if(l(),t)t(this);let u=kr.get(this)||[];for(let f=0;f<u.length;f++){let h=u[f];if(h.onLoad)h.onLoad(this)}kr.delete(this),r.manager.itemEnd(e)}function c(u){if(l(),i)i(u);Xn.remove(`image:${e}`);let f=kr.get(this)||[];for(let h=0;h<f.length;h++){let d=f[h];if(d.onError)d.onError(u)}kr.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function l(){o.removeEventListener("load",a,!1),o.removeEventListener("error",c,!1)}if(o.addEventListener("load",a,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"){if(this.crossOrigin!==void 0)o.crossOrigin=this.crossOrigin}return Xn.add(`image:${e}`,o),r.manager.itemStart(e),o.src=e,o}}class Ga extends _i{constructor(e){super(e)}load(e,t,n,i){let r=new wt,s=new Uu(this.manager);return s.setCrossOrigin(this.crossOrigin),s.setPath(this.path),s.load(e,function(o){if(r.image=o,r.needsUpdate=!0,t!==void 0)t(r)},n,i),r}}class rs extends at{constructor(e,t=1){super();this.isLight=!0,this.type="Light",this.color=new Le(e),this.intensity=t}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}class Ha extends rs{constructor(e,t,n){super(e,n);this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(at.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Le(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}}var yl=new ze,dg=new N,pg=new N;class Va{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ie(512,512),this.mapType=1009,this.map=null,this.mapPass=null,this.matrix=new ze,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ks,this._frameExtents=new Ie(1,1),this._viewportCount=1,this._viewports=[new st(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;if(dg.setFromMatrixPosition(e.matrixWorld),t.position.copy(dg),pg.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(pg),t.updateMatrixWorld(),yl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(yl,t.coordinateSystem,t.reversedDepth),t.coordinateSystem===2001||t.reversedDepth)n.set(0.5,0,0,0.5,0,0.5,0,0.5,0,0,1,0,0,0,0,1);else n.set(0.5,0,0,0.5,0,0.5,0,0.5,0,0,0.5,0.5,0,0,0,1);n.multiply(yl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){if(this.map)this.map.dispose();if(this.mapPass)this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};if(this.intensity!==1)e.intensity=this.intensity;if(this.bias!==0)e.bias=this.bias;if(this.normalBias!==0)e.normalBias=this.normalBias;if(this.radius!==1)e.radius=this.radius;if(this.mapSize.x!==512||this.mapSize.y!==512)e.mapSize=this.mapSize.toArray();return e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}var fa=new N,da=new Bt,$n=new N;class Wa extends at{constructor(){super();this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ze,this.projectionMatrix=new ze,this.projectionMatrixInverse=new ze,this.coordinateSystem=2000,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){if(super.updateMatrixWorld(e),this.matrixWorld.decompose(fa,da,$n),$n.x===1&&$n.y===1&&$n.z===1)this.matrixWorldInverse.copy(this.matrixWorld).invert();else this.matrixWorldInverse.compose(fa,da,$n.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){if(super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(fa,da,$n),$n.x===1&&$n.y===1&&$n.z===1)this.matrixWorldInverse.copy(this.matrixWorld).invert();else this.matrixWorldInverse.compose(fa,da,$n.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}var Li=new N,mg=new Ie,gg=new Ie;class Lt extends Wa{constructor(e=50,t=1,n=0.1,i=2000){super();this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=0.5*this.getFilmHeight()/e;this.fov=cr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Os*0.5*this.fov);return 0.5*this.getFilmHeight()/e}getEffectiveFOV(){return cr*2*Math.atan(Math.tan(Os*0.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Li.set(-1,-1,0.5).applyMatrix4(this.projectionMatrixInverse),t.set(Li.x,Li.y).multiplyScalar(-e/Li.z),Li.set(1,1,0.5).applyMatrix4(this.projectionMatrixInverse),n.set(Li.x,Li.y).multiplyScalar(-e/Li.z)}getViewSize(e,t){return this.getViewBounds(e,mg,gg),t.subVectors(gg,mg)}setViewOffset(e,t,n,i,r,s){if(this.aspect=e/t,this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Os*0.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-0.5*i,s=this.view;if(this.view!==null&&this.view.enabled){let{fullWidth:a,fullHeight:c}=s;r+=s.offsetX*i/a,t-=s.offsetY*n/c,i*=s.width/a,n*=s.height/c}let o=this.filmOffset;if(o!==0)r+=e*o/this.getFilmWidth();this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);if(t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null)t.object.view=Object.assign({},this.view);return t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class v_ extends Va{constructor(){super(new Lt(50,1,0.5,500));this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=cr*2*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;if(n!==t.fov||i!==t.aspect||r!==t.far)t.fov=n,t.aspect=i,t.far=r,t.updateProjectionMatrix();super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class $a extends rs{constructor(e,t,n=0,i=Math.PI/3,r=0,s=2){super(e,t);this.isSpotLight=!0,this.type="SpotLight",this.position.copy(at.DEFAULT_UP),this.updateMatrix(),this.target=new at,this.distance=n,this.angle=i,this.penumbra=r,this.decay=s,this.map=null,this.shadow=new v_}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);if(t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture)t.object.map=this.map.toJSON(e).uuid;return t.object.shadow=this.shadow.toJSON(),t}}class y_ extends Va{constructor(){super(new Lt(90,1,0.5,500));this.isPointLightShadow=!0}}class ss extends rs{constructor(e,t,n=0,i=2){super(e,t);this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new y_}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}}class xr extends Wa{constructor(e=-1,t=1,n=1,i=-1,r=0.1,s=2000){super();this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,s){if(this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-e,s=n+e,o=i+t,a=i-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,l=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,s=r+c*this.view.width,o-=l*this.view.offsetY,a=o-l*this.view.height}this.projectionMatrix.makeOrthographic(r,s,o,a,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);if(t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null)t.object.view=Object.assign({},this.view);return t}}class b_ extends Va{constructor(){super(new xr(-5,5,5,-5,0.5,500));this.isDirectionalLightShadow=!0}}class os extends rs{constructor(e,t){super(e,t);this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(at.DEFAULT_UP),this.updateMatrix(),this.target=new at,this.shadow=new b_}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}}class Zi{static extractUrlBase(e){let t=e.lastIndexOf("/");if(t===-1)return"./";return e.slice(0,t+1)}static resolveURL(e,t){if(typeof e!=="string"||e==="")return"";if(/^https?:\/\//i.test(t)&&/^\//.test(e))t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1");if(/^(https?:)?\/\//i.test(e))return e;if(/^data:.*,.*$/i.test(e))return e;if(/^blob:.*$/i.test(e))return e;return t+e}}var bl=new WeakMap;class Za extends _i{constructor(e){super(e);if(this.isImageBitmapLoader=!0,typeof createImageBitmap>"u")Me("ImageBitmapLoader: createImageBitmap() not supported.");if(typeof fetch>"u")Me("ImageBitmapLoader: fetch() not supported.");this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,i){if(e===void 0)e="";if(this.path!==void 0)e=this.path+e;e=this.manager.resolveURL(e);let r=this,s=Xn.get(`image-bitmap:${e}`);if(s!==void 0){if(r.manager.itemStart(e),s.then){s.then((c)=>{if(bl.has(s)===!0){if(i)i(bl.get(s));r.manager.itemError(e),r.manager.itemEnd(e)}else{if(t)t(c);r.manager.itemEnd(e)}});return}setTimeout(function(){if(t)t(s);r.manager.itemEnd(e)},0);return}let o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader,o.signal=typeof AbortSignal.any==="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let a=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(c){if(Xn.add(`image-bitmap:${e}`,c),t)t(c);r.manager.itemEnd(e)}).catch(function(c){if(i)i(c);bl.set(a,c),Xn.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});Xn.add(`image-bitmap:${e}`,a),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}var Br=-90,Gr=1;class Ou extends at{constructor(e,t,n){super();this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new Lt(Br,Gr,e,t);i.layers=this.layers,this.add(i);let r=new Lt(Br,Gr,e,t);r.layers=this.layers,this.add(r);let s=new Lt(Br,Gr,e,t);s.layers=this.layers,this.add(s);let o=new Lt(Br,Gr,e,t);o.layers=this.layers,this.add(o);let a=new Lt(Br,Gr,e,t);a.layers=this.layers,this.add(a);let c=new Lt(Br,Gr,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,r,s,o,a]=t;for(let c of t)this.remove(c);if(e===2000)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),a.up.set(0,1,0),a.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),a.up.set(0,-1,0),a.lookAt(0,0,-1);else throw Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){if(this.parent===null)this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;if(this.coordinateSystem!==e.coordinateSystem)this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem();let[r,s,o,a,c,l]=this.children,u=e.getRenderTarget(),f=e.getActiveCubeFace(),h=e.getActiveMipmapLevel(),d=e.xr.enabled;e.xr.enabled=!1;let g=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let y=!1;if(e.isWebGLRenderer===!0)y=e.state.buffers.depth.getReversed();else y=e.reversedDepthBuffer;if(e.setRenderTarget(n,0,i),y&&e.autoClear===!1)e.clearDepth();if(e.render(t,r),e.setRenderTarget(n,1,i),y&&e.autoClear===!1)e.clearDepth();if(e.render(t,s),e.setRenderTarget(n,2,i),y&&e.autoClear===!1)e.clearDepth();if(e.render(t,o),e.setRenderTarget(n,3,i),y&&e.autoClear===!1)e.clearDepth();if(e.render(t,a),e.setRenderTarget(n,4,i),y&&e.autoClear===!1)e.clearDepth();if(e.render(t,c),n.texture.generateMipmaps=g,e.setRenderTarget(n,5,i),y&&e.autoClear===!1)e.clearDepth();e.render(t,l),e.setRenderTarget(u,f,h),e.xr.enabled=d,n.texture.needsPMREMUpdate=!0}}class Fu extends Lt{constructor(e=[]){super();this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class zu{constructor(e,t,n){this.binding=e,this.valueSize=n;let i,r,s;switch(t){case"quaternion":i=this._slerp,r=this._slerpAdditive,s=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case"string":case"bool":i=this._select,r=this._select,s=this._setAdditiveIdentityOther,this.buffer=Array(n*5);break;default:i=this._lerp,r=this._lerpAdditive,s=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=i,this._mixBufferRegionAdditive=r,this._setIdentity=s,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(e,t){let n=this.buffer,i=this.valueSize,r=e*i+i,s=this.cumulativeWeight;if(s===0){for(let o=0;o!==i;++o)n[r+o]=n[o];s=t}else{s+=t;let o=t/s;this._mixBufferRegion(n,r,0,o,i)}this.cumulativeWeight=s}accumulateAdditive(e){let t=this.buffer,n=this.valueSize,i=n*this._addIndex;if(this.cumulativeWeightAdditive===0)this._setIdentity();this._mixBufferRegionAdditive(t,i,0,e,n),this.cumulativeWeightAdditive+=e}apply(e){let t=this.valueSize,n=this.buffer,i=e*t+t,r=this.cumulativeWeight,s=this.cumulativeWeightAdditive,o=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,r<1){let a=t*this._origIndex;this._mixBufferRegion(n,i,a,1-r,t)}if(s>0)this._mixBufferRegionAdditive(n,i,this._addIndex*t,1,t);for(let a=t,c=t+t;a!==c;++a)if(n[a]!==n[a+t]){o.setValue(n,i);break}}saveOriginalState(){let e=this.binding,t=this.buffer,n=this.valueSize,i=n*this._origIndex;e.getValue(t,i);for(let r=n,s=i;r!==s;++r)t[r]=t[i+r%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){let e=this.valueSize*3;this.binding.setValue(this.buffer,e)}_setAdditiveIdentityNumeric(){let e=this._addIndex*this.valueSize,t=e+this.valueSize;for(let n=e;n<t;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){let e=this._origIndex*this.valueSize,t=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[t+n]=this.buffer[e+n]}_select(e,t,n,i,r){if(i>=0.5)for(let s=0;s!==r;++s)e[t+s]=e[n+s]}_slerp(e,t,n,i){Bt.slerpFlat(e,t,e,t,e,n,i)}_slerpAdditive(e,t,n,i,r){let s=this._workIndex*r;Bt.multiplyQuaternionsFlat(e,s,e,t,e,n),Bt.slerpFlat(e,t,e,t,e,s,i)}_lerp(e,t,n,i,r){let s=1-i;for(let o=0;o!==r;++o){let a=t+o;e[a]=e[a]*s+e[n+o]*i}}_lerpAdditive(e,t,n,i,r){for(let s=0;s!==r;++s){let o=t+s;e[o]=e[o]+e[n+s]*i}}}var ku="\\[\\]\\.:\\/",Gy=new RegExp("["+ku+"]","g"),Bu="[^"+ku+"]",Hy="[^"+ku.replace("\\.","")+"]",Vy=/((?:WC+[\/:])*)/.source.replace("WC",Bu),Wy=/(WCOD+)?/.source.replace("WCOD",Hy),$y=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Bu),Zy=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Bu),Xy=new RegExp("^"+Vy+Wy+$y+Zy+"$"),qy=["material","materials","bones","map"];class S_{constructor(e,t,n){let i=n||tt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];if(i!==void 0)i.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}}class tt{constructor(e,t,n){this.path=t,this.parsedPath=n||tt.parseTrackName(t),this.node=tt.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){if(!(e&&e.isAnimationObjectGroup))return new tt(e,t,n);else return new tt.Composite(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Gy,"")}static parseTrackName(e){let t=Xy.exec(e);if(t===null)throw Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);if(qy.indexOf(r)!==-1)n.nodeName=n.nodeName.substring(0,i),n.objectName=r}if(n.propertyName===null||n.propertyName.length===0)throw Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let s=0;s<r.length;s++){let o=r[s];if(o.name===t||o.uuid===t)return o;let a=n(o.children);if(a)return a}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,{objectName:n,propertyName:i,propertyIndex:r}=t;if(!e)e=tt.findNode(this.rootNode,t.nodeName),this.node=e;if(this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Me("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){Ne("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Ne("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Ne("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let l=0;l<e.length;l++)if(e[l].name===c){c=l;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Ne("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Ne("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Ne("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){Ne("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let s=e[i];if(s===void 0){let c=t.nodeName;Ne("PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e);return}let o=this.Versioning.None;if(this.targetObject=e,e.isMaterial===!0)o=this.Versioning.NeedsUpdate;else if(e.isObject3D===!0)o=this.Versioning.MatrixWorldNeedsUpdate;let a=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){Ne("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Ne("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}if(e.morphTargetDictionary[r]!==void 0)r=e.morphTargetDictionary[r]}a=this.BindingType.ArrayElement,this.resolvedProperty=s,this.propertyIndex=r}else if(s.fromArray!==void 0&&s.toArray!==void 0)a=this.BindingType.HasFromToArray,this.resolvedProperty=s;else if(Array.isArray(s))a=this.BindingType.EntireArray,this.resolvedProperty=s;else this.propertyName=i;this.getValue=this.GetterByBindingType[a],this.setValue=this.SetterByBindingTypeAndVersioning[a][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}tt.Composite=S_;tt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};tt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};tt.prototype.GetterByBindingType=[tt.prototype._getValue_direct,tt.prototype._getValue_array,tt.prototype._getValue_arrayElement,tt.prototype._getValue_toArray];tt.prototype.SetterByBindingTypeAndVersioning=[[tt.prototype._setValue_direct,tt.prototype._setValue_direct_setNeedsUpdate,tt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[tt.prototype._setValue_array,tt.prototype._setValue_array_setNeedsUpdate,tt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[tt.prototype._setValue_arrayElement,tt.prototype._setValue_arrayElement_setNeedsUpdate,tt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[tt.prototype._setValue_fromArray,tt.prototype._setValue_fromArray_setNeedsUpdate,tt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class Gu{constructor(e,t,n=null,i=t.blendMode){this._mixer=e,this._clip=t,this._localRoot=n,this.blendMode=i;let r=t.tracks,s=r.length,o=Array(s),a={endingStart:2400,endingEnd:2400};for(let c=0;c!==s;++c){let l=r[c].createInterpolant(null);o[c]=l,l.settings=a}this._interpolantSettings=a,this._interpolants=o,this._propertyBindings=Array(s),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._restoreTimeScale=null,this._weightInterpolant=null,this.loop=2201,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(e){return this._startTime=e,this}setLoop(e,t){return this.loop=e,this.repetitions=t,this}setEffectiveWeight(e){return this.weight=e,this._effectiveWeight=this.enabled?e:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(e){return this._scheduleFading(e,0,1)}fadeOut(e){return this._scheduleFading(e,1,0)}crossFadeFrom(e,t,n=!1){if(e.fadeOut(t),this.fadeIn(t),n===!0){let i=this._clip.duration,r=e._clip.duration,s=r/i,o=i/r;e._restoreTimeScale=e.timeScale,this._restoreTimeScale=this.timeScale,e.warp(1,s,t),this.warp(o,1,t)}return this}crossFadeTo(e,t,n=!1){return e.crossFadeFrom(this,t,n)}stopFading(){let e=this._weightInterpolant;if(e!==null)this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(e);return this}setEffectiveTimeScale(e){return this.timeScale=e,this._effectiveTimeScale=this.paused?0:e,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(e){return this.timeScale=this._clip.duration/e,this.stopWarping()}syncWith(e){return this.time=e.time,this.timeScale=e.timeScale,this.stopWarping()}halt(e){return this.warp(this._effectiveTimeScale,0,e)}warp(e,t,n){let i=this._mixer,r=i.time,s=this.timeScale,o=this._timeScaleInterpolant;if(o===null)o=i._lendControlInterpolant(),this._timeScaleInterpolant=o;let a=o.parameterPositions,c=o.sampleValues;return a[0]=r,a[1]=r+n,c[0]=e/s,c[1]=t/s,this}stopWarping(){let e=this._timeScaleInterpolant;if(e!==null)this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(e);return this._restoreTimeScale=null,this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(e,t,n,i){if(!this.enabled){this._updateWeight(e);return}let r=this._startTime;if(r!==null){let a=(e-r)*n;if(a<0||n===0)t=0;else this._startTime=null,t=n*a}t*=this._updateTimeScale(e);let s=this._updateTime(t),o=this._updateWeight(e);if(o>0){let a=this._interpolants,c=this._propertyBindings;switch(this.blendMode){case 2501:for(let l=0,u=a.length;l!==u;++l)a[l].evaluate(s),c[l].accumulateAdditive(o);break;case 2500:default:for(let l=0,u=a.length;l!==u;++l)a[l].evaluate(s),c[l].accumulate(i,o)}}}_updateWeight(e){let t=0;if(this.enabled){t=this.weight;let n=this._weightInterpolant;if(n!==null){let i=n.evaluate(e)[0];if(t*=i,e>n.parameterPositions[1]){if(this.stopFading(),i===0)this.enabled=!1}}}return this._effectiveWeight=t,t}_updateTimeScale(e){let t=0;if(!this.paused){t=this.timeScale;let n=this._timeScaleInterpolant;if(n!==null){let i=n.evaluate(e)[0];if(t*=i,e>n.parameterPositions[1]){if(t===0)this.paused=!0;else{if(this._restoreTimeScale!==null)t=this._restoreTimeScale;this.timeScale=t}this.stopWarping()}}}return this._effectiveTimeScale=t,t}_updateTime(e){let t=this._clip.duration,n=this.loop,i=this.time+e,r=this._loopCount,s=n===2202;if(e===0){if(r===-1)return i;return s&&(r&1)===1?t-i:i}if(n===2200){if(r===-1)this._loopCount=0,this._setEndings(!0,!0,!1);e:{if(i>=t)i=t;else if(i<0)i=0;else{this.time=i;break e}if(this.clampWhenFinished)this.paused=!0;else this.enabled=!1;this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:e<0?-1:1})}}else{if(r===-1)if(e>=0)r=0,this._setEndings(!0,this.repetitions===0,s);else this._setEndings(this.repetitions===0,!0,s);if(i>=t||i<0){let o=Math.floor(i/t);i-=t*o,r+=Math.abs(o);let a=this.repetitions-r;if(a<=0){if(this.clampWhenFinished)this.paused=!0;else this.enabled=!1;i=e>0?t:0,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:e>0?1:-1})}else{if(a===1){let c=e<0;this._setEndings(c,!c,s)}else this._setEndings(!1,!1,s);this._loopCount=r,this.time=i,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:o})}}else this._loopCount=r,this.time=i;if(s&&(r&1)===1)return t-i}return i}_setEndings(e,t,n){let i=this._interpolantSettings;if(n)i.endingStart=2401,i.endingEnd=2401;else{if(e)i.endingStart=this.zeroSlopeAtStart?2401:2400;else i.endingStart=2402;if(t)i.endingEnd=this.zeroSlopeAtEnd?2401:2400;else i.endingEnd=2402}}_scheduleFading(e,t,n){let i=this._mixer,r=i.time,s=this._weightInterpolant;if(s===null)s=i._lendControlInterpolant(),this._weightInterpolant=s;let o=s.parameterPositions,a=s.sampleValues;return o[0]=r,a[0]=t,o[1]=r+e,a[1]=n,this}}var Yy=new Float32Array(1);class Xa extends zn{constructor(e){super();if(this._root=e,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1,typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}_bindAction(e,t){let n=e._localRoot||this._root,i=e._clip.tracks,r=i.length,{_propertyBindings:s,_interpolants:o}=e,a=n.uuid,c=this._bindingsByRootAndName,l=c[a];if(l===void 0)l={},c[a]=l;for(let u=0;u!==r;++u){let f=i[u],h=f.name,d=l[h];if(d!==void 0)++d.referenceCount,s[u]=d;else{if(d=s[u],d!==void 0){if(d._cacheIndex===null)++d.referenceCount,this._addInactiveBinding(d,a,h);continue}let g=t&&t._propertyBindings[u].binding.parsedPath;d=new zu(tt.create(n,h,g),f.ValueTypeName,f.getValueSize()),++d.referenceCount,this._addInactiveBinding(d,a,h),s[u]=d}o[u].resultBuffer=d.buffer}}_activateAction(e){if(!this._isActiveAction(e)){if(e._cacheIndex===null){let n=(e._localRoot||this._root).uuid,i=e._clip.uuid,r=this._actionsByClip[i];this._bindAction(e,r&&r.knownActions[0]),this._addInactiveAction(e,i,n)}let t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){let r=t[n];if(r.useCount++===0)this._lendBinding(r),r.saveOriginalState()}this._lendAction(e)}}_deactivateAction(e){if(this._isActiveAction(e)){let t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){let r=t[n];if(--r.useCount===0)r.restoreOriginalState(),this._takeBackBinding(r)}this._takeBackAction(e)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;let e=this;this.stats={actions:{get total(){return e._actions.length},get inUse(){return e._nActiveActions}},bindings:{get total(){return e._bindings.length},get inUse(){return e._nActiveBindings}},controlInterpolants:{get total(){return e._controlInterpolants.length},get inUse(){return e._nActiveControlInterpolants}}}}_isActiveAction(e){let t=e._cacheIndex;return t!==null&&t<this._nActiveActions}_addInactiveAction(e,t,n){let i=this._actions,r=this._actionsByClip,s=r[t];if(s===void 0)s={knownActions:[e],actionByRoot:{}},e._byClipCacheIndex=0,r[t]=s;else{let o=s.knownActions;e._byClipCacheIndex=o.length,o.push(e)}e._cacheIndex=i.length,i.push(e),s.actionByRoot[n]=e}_removeInactiveAction(e){let t=this._actions,n=t[t.length-1],i=e._cacheIndex;n._cacheIndex=i,t[i]=n,t.pop(),e._cacheIndex=null;let r=e._clip.uuid,s=this._actionsByClip,o=s[r],a=o.knownActions,c=a[a.length-1],l=e._byClipCacheIndex;c._byClipCacheIndex=l,a[l]=c,a.pop(),e._byClipCacheIndex=null;let u=o.actionByRoot,f=(e._localRoot||this._root).uuid;if(delete u[f],a.length===0)delete s[r];this._removeInactiveBindingsForAction(e)}_removeInactiveBindingsForAction(e){let t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){let r=t[n];if(--r.referenceCount===0)this._removeInactiveBinding(r)}}_lendAction(e){let t=this._actions,n=e._cacheIndex,i=this._nActiveActions++,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_takeBackAction(e){let t=this._actions,n=e._cacheIndex,i=--this._nActiveActions,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_addInactiveBinding(e,t,n){let i=this._bindingsByRootAndName,r=this._bindings,s=i[t];if(s===void 0)s={},i[t]=s;s[n]=e,e._cacheIndex=r.length,r.push(e)}_removeInactiveBinding(e){let t=this._bindings,n=e.binding,i=n.rootNode.uuid,r=n.path,s=this._bindingsByRootAndName,o=s[i],a=t[t.length-1],c=e._cacheIndex;if(a._cacheIndex=c,t[c]=a,t.pop(),delete o[r],Object.keys(o).length===0)delete s[i]}_lendBinding(e){let t=this._bindings,n=e._cacheIndex,i=this._nActiveBindings++,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_takeBackBinding(e){let t=this._bindings,n=e._cacheIndex,i=--this._nActiveBindings,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_lendControlInterpolant(){let e=this._controlInterpolants,t=this._nActiveControlInterpolants++,n=e[t];if(n===void 0)n=new ka(new Float32Array(2),new Float32Array(2),1,Yy),n.__cacheIndex=t,e[t]=n;return n}_takeBackControlInterpolant(e){let t=this._controlInterpolants,n=e.__cacheIndex,i=--this._nActiveControlInterpolants,r=t[i];e.__cacheIndex=i,t[i]=e,r.__cacheIndex=n,t[n]=r}clipAction(e,t,n){let i=t||this._root,r=i.uuid,s=typeof e==="string"?$r.findByName(i,e):e,o=s!==null?s.uuid:e,a=this._actionsByClip[o],c=null;if(n===void 0)if(s!==null)n=s.blendMode;else n=2500;if(a!==void 0){let u=a.actionByRoot[r];if(u!==void 0&&u.blendMode===n)return u;if(c=a.knownActions[0],s===null)s=c._clip}if(s===null)return null;let l=new Gu(this,s,t,n);return this._bindAction(l,c),this._addInactiveAction(l,o,r),l}existingAction(e,t){let n=t||this._root,i=n.uuid,r=typeof e==="string"?$r.findByName(n,e):e,s=r?r.uuid:e,o=this._actionsByClip[s];if(o!==void 0)return o.actionByRoot[i]||null;return null}stopAllAction(){let e=this._actions,t=this._nActiveActions;for(let n=t-1;n>=0;--n)e[n].stop();return this}update(e){e*=this.timeScale;let t=this._actions,n=this._nActiveActions,i=this.time+=e,r=Math.sign(e),s=this._accuIndex^=1;for(let c=0;c!==n;++c)t[c]._update(i,e,r,s);let o=this._bindings,a=this._nActiveBindings;for(let c=0;c!==a;++c)o[c].apply(s);return this}setTime(e){this.time=0;for(let t=0;t<this._actions.length;t++)this._actions[t].time=0;return this.update(e)}getRoot(){return this._root}uncacheClip(e){let t=this._actions,n=e.uuid,i=this._actionsByClip,r=i[n];if(r!==void 0){let s=r.knownActions;for(let o=0,a=s.length;o!==a;++o){let c=s[o];this._deactivateAction(c);let l=c._cacheIndex,u=t[t.length-1];c._cacheIndex=null,c._byClipCacheIndex=null,u._cacheIndex=l,t[l]=u,t.pop(),this._removeInactiveBindingsForAction(c)}delete i[n]}}uncacheRoot(e){let t=e.uuid,n=this._actionsByClip;for(let s in n){let o=n[s].actionByRoot,a=o[t];if(a!==void 0)this._deactivateAction(a),this._removeInactiveAction(a)}let i=this._bindingsByRootAndName,r=i[t];if(r!==void 0)for(let s in r){let o=r[s];o.restoreOriginalState(),this._removeInactiveBinding(o)}}uncacheAction(e,t){let n=this.existingAction(e,t);if(n!==null)this._deactivateAction(n),this._removeInactiveAction(n)}}class ro{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=$e(this.phi,0.000001,Math.PI-0.000001),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){if(this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0)this.theta=0,this.phi=0;else this.theta=Math.atan2(e,n),this.phi=Math.acos($e(t/this.radius,-1,1));return this}clone(){return new this.constructor().copy(this)}}class Hu{static{Hu.prototype.isMatrix2=!0}constructor(e,t,n,i){if(this.elements=[1,0,0,1],e!==void 0)this.set(e,t,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,i){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=i,this}}class qa extends zn{constructor(e,t=null){super();this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){Me("Controls: connect() now requires an element.");return}if(this.domElement!==null)this.disconnect();this.domElement=e}disconnect(){}dispose(){}update(){}}function Vu(e,t,n,i){let r=jy(i);switch(n){case 1021:return e*t;case 1028:return e*t/r.components*r.byteLength;case 1029:return e*t/r.components*r.byteLength;case 1030:return e*t*2/r.components*r.byteLength;case 1031:return e*t*2/r.components*r.byteLength;case 1022:return e*t*3/r.components*r.byteLength;case 1023:return e*t*4/r.components*r.byteLength;case 1033:return e*t*4/r.components*r.byteLength;case 33776:case 33777:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case 33778:case 33779:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case 35841:case 35843:return Math.max(e,16)*Math.max(t,8)/4;case 35840:case 35842:return Math.max(e,8)*Math.max(t,8)/2;case 36196:case 37492:case 37488:case 37489:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case 37496:case 37490:case 37491:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case 37808:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case 37809:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case 37810:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case 37811:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case 37812:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case 37813:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case 37814:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case 37815:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case 37816:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case 37817:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case 37818:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case 37819:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case 37820:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case 37821:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case 36492:case 36494:case 36495:return Math.ceil(e/4)*Math.ceil(t/4)*16;case 36283:case 36284:return Math.ceil(e/4)*Math.ceil(t/4)*8;case 36285:case 36286:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function jy(e){switch(e){case 1009:case 1010:return{byteLength:1,components:1};case 1012:case 1011:case 1016:return{byteLength:2,components:1};case 1017:case 1018:return{byteLength:2,components:4};case 1014:case 1013:case 1015:return{byteLength:4,components:1};case 35902:case 35899:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}if(typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}}));if(typeof window<"u")if(window.__THREE__)Me("WARNING: Multiple instances of Three.js being imported.");else window.__THREE__="185";function $_(){let e=null,t=!1,n=null,i=null;function r(s,o){n(s,o),i=e.requestAnimationFrame(r)}return{start:function(){if(t===!0)return;if(n===null)return;if(e===null)return;i=e.requestAnimationFrame(r),t=!0},stop:function(){if(e!==null)e.cancelAnimationFrame(i);t=!1},setAnimationLoop:function(s){n=s},setContext:function(s){e=s}}}function Jy(e){let t=new WeakMap;function n(a,c){let{array:l,usage:u}=a,f=l.byteLength,h=e.createBuffer();e.bindBuffer(c,h),e.bufferData(c,l,u),a.onUploadCallback();let d;if(l instanceof Float32Array)d=e.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)d=e.HALF_FLOAT;else if(l instanceof Uint16Array)if(a.isFloat16BufferAttribute)d=e.HALF_FLOAT;else d=e.UNSIGNED_SHORT;else if(l instanceof Int16Array)d=e.SHORT;else if(l instanceof Uint32Array)d=e.UNSIGNED_INT;else if(l instanceof Int32Array)d=e.INT;else if(l instanceof Int8Array)d=e.BYTE;else if(l instanceof Uint8Array)d=e.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)d=e.UNSIGNED_BYTE;else throw Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:h,type:d,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:f}}function i(a,c,l){let{array:u,updateRanges:f}=c;if(e.bindBuffer(l,a),f.length===0)e.bufferSubData(l,0,u);else{f.sort((d,g)=>d.start-g.start);let h=0;for(let d=1;d<f.length;d++){let g=f[h],y=f[d];if(y.start<=g.start+g.count+1)g.count=Math.max(g.count,y.start+y.count-g.start);else++h,f[h]=y}f.length=h+1;for(let d=0,g=f.length;d<g;d++){let y=f[d];e.bufferSubData(l,y.start*u.BYTES_PER_ELEMENT,u,y.start,y.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(a){if(a.isInterleavedBufferAttribute)a=a.data;return t.get(a)}function s(a){if(a.isInterleavedBufferAttribute)a=a.data;let c=t.get(a);if(c)e.deleteBuffer(c.buffer),t.delete(a)}function o(a,c){if(a.isInterleavedBufferAttribute)a=a.data;if(a.isGLBufferAttribute){let u=t.get(a);if(!u||u.version<a.version)t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=t.get(a);if(l===void 0)t.set(a,n(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,a,c),l.version=a.version}}return{get:r,remove:s,update:o}}var Ky=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Qy=`#ifdef USE_ALPHAHASH
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
#endif`,eb=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,tb=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,nb=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ib=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,rb=`#ifdef USE_AOMAP
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
#endif`,sb=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ob=`#ifdef USE_BATCHING
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
#endif`,ab=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,cb=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,lb=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,ub=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,hb=`#ifdef USE_IRIDESCENCE
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
#endif`,fb=`#ifdef USE_BUMPMAP
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
#endif`,db=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,pb=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,mb=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,gb=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,_b=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,xb=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,vb=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,yb=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,bb=`#define PI 3.141592653589793
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
} // validated`,Sb=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Mb=`vec3 transformedNormal = objectNormal;
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
#endif`,wb=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Tb=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Eb=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ab=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Rb="gl_FragColor = linearToOutputTexel( gl_FragColor );",Cb=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ib=`#ifdef USE_ENVMAP
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
#endif`,Pb=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Lb=`#ifdef USE_ENVMAP
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
#endif`,Nb=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Db=`#ifdef USE_ENVMAP
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
#endif`,Ub=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Ob=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Fb=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,zb=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,kb=`#ifdef USE_GRADIENTMAP
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
}`,Bb=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Gb=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Hb=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Vb=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Wb=`#ifdef USE_ENVMAP
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
#endif`,$b=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Zb=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Xb=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,qb=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Yb=`PhysicalMaterial material;
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
#endif`,jb=`uniform sampler2D dfgLUT;
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
}`,Jb=`
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
#endif`,Kb=`#if defined( RE_IndirectDiffuse )
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
#endif`,Qb=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,eS=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,tS=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,nS=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,iS=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,rS=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,sS=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,oS=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,aS=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,cS=`#if defined( USE_POINTS_UV )
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
#endif`,lS=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,uS=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,hS=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,fS=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,dS=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,pS=`#ifdef USE_MORPHTARGETS
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
#endif`,mS=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,gS=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,_S=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,xS=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,vS=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,yS=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,bS=`#ifdef USE_NORMALMAP
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
#endif`,SS=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,MS=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,wS=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,TS=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,ES=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,AS=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,RS=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,CS=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,IS=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,PS=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,LS=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,NS=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,DS=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,US=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,OS=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,FS=`float getShadowMask() {
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
}`,zS=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,kS=`#ifdef USE_SKINNING
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
#endif`,BS=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,GS=`#ifdef USE_SKINNING
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
#endif`,HS=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,VS=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,WS=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,$S=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,ZS=`#ifdef USE_TRANSMISSION
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
#endif`,XS=`#ifdef USE_TRANSMISSION
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
#endif`,qS=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,YS=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,jS=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,JS=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,KS=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,QS=`uniform sampler2D t2D;
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
}`,eM=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,tM=`#ifdef ENVMAP_TYPE_CUBE
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
}`,nM=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,iM=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,rM=`#include <common>
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
}`,sM=`#if DEPTH_PACKING == 3200
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
}`,oM=`#define DISTANCE
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
}`;var aM=`#define DISTANCE
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
}`,cM=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,lM=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,uM=`uniform float scale;
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
}`,hM=`uniform vec3 diffuse;
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
}`,fM=`#include <common>
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
}`,dM=`uniform vec3 diffuse;
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
}`,pM=`#define LAMBERT
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
}`,mM=`#define LAMBERT
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
}`,gM=`#define MATCAP
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
}`,_M=`#define MATCAP
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
}`,xM=`#define NORMAL
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
}`,vM=`#define NORMAL
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
}`,yM=`#define PHONG
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
}`,bM=`#define PHONG
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
}`,SM=`#define STANDARD
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
}`,MM=`#define STANDARD
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
}`,wM=`#define TOON
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
}`,TM=`#define TOON
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
}`,EM=`uniform float size;
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
}`,AM=`uniform vec3 diffuse;
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
}`,RM=`#include <common>
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
}`,CM=`uniform vec3 color;
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
}`,IM=`uniform float rotation;
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
}`,PM=`uniform vec3 diffuse;
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
}`,He={alphahash_fragment:Ky,alphahash_pars_fragment:Qy,alphamap_fragment:eb,alphamap_pars_fragment:tb,alphatest_fragment:nb,alphatest_pars_fragment:ib,aomap_fragment:rb,aomap_pars_fragment:sb,batching_pars_vertex:ob,batching_vertex:ab,begin_vertex:cb,beginnormal_vertex:lb,bsdfs:ub,iridescence_fragment:hb,bumpmap_pars_fragment:fb,clipping_planes_fragment:db,clipping_planes_pars_fragment:pb,clipping_planes_pars_vertex:mb,clipping_planes_vertex:gb,color_fragment:_b,color_pars_fragment:xb,color_pars_vertex:vb,color_vertex:yb,common:bb,cube_uv_reflection_fragment:Sb,defaultnormal_vertex:Mb,displacementmap_pars_vertex:wb,displacementmap_vertex:Tb,emissivemap_fragment:Eb,emissivemap_pars_fragment:Ab,colorspace_fragment:Rb,colorspace_pars_fragment:Cb,envmap_fragment:Ib,envmap_common_pars_fragment:Pb,envmap_pars_fragment:Lb,envmap_pars_vertex:Nb,envmap_physical_pars_fragment:Wb,envmap_vertex:Db,fog_vertex:Ub,fog_pars_vertex:Ob,fog_fragment:Fb,fog_pars_fragment:zb,gradientmap_pars_fragment:kb,lightmap_pars_fragment:Bb,lights_lambert_fragment:Gb,lights_lambert_pars_fragment:Hb,lights_pars_begin:Vb,lights_toon_fragment:$b,lights_toon_pars_fragment:Zb,lights_phong_fragment:Xb,lights_phong_pars_fragment:qb,lights_physical_fragment:Yb,lights_physical_pars_fragment:jb,lights_fragment_begin:Jb,lights_fragment_maps:Kb,lights_fragment_end:Qb,lightprobes_pars_fragment:eS,logdepthbuf_fragment:tS,logdepthbuf_pars_fragment:nS,logdepthbuf_pars_vertex:iS,logdepthbuf_vertex:rS,map_fragment:sS,map_pars_fragment:oS,map_particle_fragment:aS,map_particle_pars_fragment:cS,metalnessmap_fragment:lS,metalnessmap_pars_fragment:uS,morphinstance_vertex:hS,morphcolor_vertex:fS,morphnormal_vertex:dS,morphtarget_pars_vertex:pS,morphtarget_vertex:mS,normal_fragment_begin:gS,normal_fragment_maps:_S,normal_pars_fragment:xS,normal_pars_vertex:vS,normal_vertex:yS,normalmap_pars_fragment:bS,clearcoat_normal_fragment_begin:SS,clearcoat_normal_fragment_maps:MS,clearcoat_pars_fragment:wS,iridescence_pars_fragment:TS,opaque_fragment:ES,packing:AS,premultiplied_alpha_fragment:RS,project_vertex:CS,dithering_fragment:IS,dithering_pars_fragment:PS,roughnessmap_fragment:LS,roughnessmap_pars_fragment:NS,shadowmap_pars_fragment:DS,shadowmap_pars_vertex:US,shadowmap_vertex:OS,shadowmask_pars_fragment:FS,skinbase_vertex:zS,skinning_pars_vertex:kS,skinning_vertex:BS,skinnormal_vertex:GS,specularmap_fragment:HS,specularmap_pars_fragment:VS,tonemapping_fragment:WS,tonemapping_pars_fragment:$S,transmission_fragment:ZS,transmission_pars_fragment:XS,uv_pars_fragment:qS,uv_pars_vertex:YS,uv_vertex:jS,worldpos_vertex:JS,background_vert:KS,background_frag:QS,backgroundCube_vert:eM,backgroundCube_frag:tM,cube_vert:nM,cube_frag:iM,depth_vert:rM,depth_frag:sM,distance_vert:oM,distance_frag:aM,equirect_vert:cM,equirect_frag:lM,linedashed_vert:uM,linedashed_frag:hM,meshbasic_vert:fM,meshbasic_frag:dM,meshlambert_vert:pM,meshlambert_frag:mM,meshmatcap_vert:gM,meshmatcap_frag:_M,meshnormal_vert:xM,meshnormal_frag:vM,meshphong_vert:yM,meshphong_frag:bM,meshphysical_vert:SM,meshphysical_frag:MM,meshtoon_vert:wM,meshtoon_frag:TM,points_vert:EM,points_frag:AM,shadow_vert:RM,shadow_frag:CM,sprite_vert:IM,sprite_frag:PM},he={common:{diffuse:{value:new Le(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ue}},envmap:{envMap:{value:null},envMapRotation:{value:new Ue},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:0.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ue}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ue}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ue},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ue},normalScale:{value:new Ie(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ue},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ue}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ue}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ue}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:0.00025},fogNear:{value:1},fogFar:{value:2000},fogColor:{value:new Le(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new N},probesMax:{value:new N},probesResolution:{value:new N}},points:{diffuse:{value:new Le(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0},uvTransform:{value:new Ue}},sprite:{diffuse:{value:new Le(16777215)},opacity:{value:1},center:{value:new Ie(0.5,0.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}}},ei={basic:{uniforms:jt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.fog]),vertexShader:He.meshbasic_vert,fragmentShader:He.meshbasic_frag},lambert:{uniforms:jt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Le(0)},envMapIntensity:{value:1}}]),vertexShader:He.meshlambert_vert,fragmentShader:He.meshlambert_frag},phong:{uniforms:jt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Le(0)},specular:{value:new Le(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:He.meshphong_vert,fragmentShader:He.meshphong_frag},standard:{uniforms:jt([he.common,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.roughnessmap,he.metalnessmap,he.fog,he.lights,{emissive:{value:new Le(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag},toon:{uniforms:jt([he.common,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.gradientmap,he.fog,he.lights,{emissive:{value:new Le(0)}}]),vertexShader:He.meshtoon_vert,fragmentShader:He.meshtoon_frag},matcap:{uniforms:jt([he.common,he.bumpmap,he.normalmap,he.displacementmap,he.fog,{matcap:{value:null}}]),vertexShader:He.meshmatcap_vert,fragmentShader:He.meshmatcap_frag},points:{uniforms:jt([he.points,he.fog]),vertexShader:He.points_vert,fragmentShader:He.points_frag},dashed:{uniforms:jt([he.common,he.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:He.linedashed_vert,fragmentShader:He.linedashed_frag},depth:{uniforms:jt([he.common,he.displacementmap]),vertexShader:He.depth_vert,fragmentShader:He.depth_frag},normal:{uniforms:jt([he.common,he.bumpmap,he.normalmap,he.displacementmap,{opacity:{value:1}}]),vertexShader:He.meshnormal_vert,fragmentShader:He.meshnormal_frag},sprite:{uniforms:jt([he.sprite,he.fog]),vertexShader:He.sprite_vert,fragmentShader:He.sprite_frag},background:{uniforms:{uvTransform:{value:new Ue},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:He.background_vert,fragmentShader:He.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ue}},vertexShader:He.backgroundCube_vert,fragmentShader:He.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:He.cube_vert,fragmentShader:He.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:He.equirect_vert,fragmentShader:He.equirect_frag},distance:{uniforms:jt([he.common,he.displacementmap,{referencePosition:{value:new N},nearDistance:{value:1},farDistance:{value:1000}}]),vertexShader:He.distance_vert,fragmentShader:He.distance_frag},shadow:{uniforms:jt([he.lights,he.fog,{color:{value:new Le(0)},opacity:{value:1}}]),vertexShader:He.shadow_vert,fragmentShader:He.shadow_frag}};ei.physical={uniforms:jt([ei.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ue},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ue},clearcoatNormalScale:{value:new Ie(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ue},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ue},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ue},sheen:{value:0},sheenColor:{value:new Le(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ue},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ue},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ue},transmissionSamplerSize:{value:new Ie},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ue},attenuationDistance:{value:0},attenuationColor:{value:new Le(0)},specularColor:{value:new Le(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ue},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ue},anisotropyVector:{value:new Ie},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ue}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag};var Ya={r:0,b:0,g:0},LM=new ze,Z_=new Ue;Z_.set(-1,0,0,0,1,0,0,0,1);function NM(e,t,n,i,r,s){let o=new Le(0),a=r===!0?0:1,c,l,u=null,f=0,h=null;function d(A){let T=A.isScene===!0?A.background:null;if(T&&T.isTexture){let v=A.backgroundBlurriness>0;T=t.get(T,v)}return T}function g(A){let T=!1,v=d(A);if(v===null)p(o,a);else if(v&&v.isColor)p(v,1),T=!0;let w=e.xr.getEnvironmentBlendMode();if(w==="additive")n.buffers.color.setClear(0,0,0,1,s);else if(w==="alpha-blend")n.buffers.color.setClear(0,0,0,0,s);if(e.autoClear||T)n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil)}function y(A,T){let v=d(T);if(v&&(v.isCubeTexture||v.mapping===Hs)){if(l===void 0)l=new pt(new Gi(1,1,1),new Mn({name:"BackgroundCubeMaterial",uniforms:gr(ei.backgroundCube.uniforms),vertexShader:ei.backgroundCube.vertexShader,fragmentShader:ei.backgroundCube.fragmentShader,side:Yt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(w,E,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l);if(l.material.uniforms.envMap.value=v,l.material.uniforms.backgroundBlurriness.value=T.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(LM.makeRotationFromEuler(T.backgroundRotation)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1)l.material.uniforms.backgroundRotation.value.premultiply(Z_);if(l.material.toneMapped=We.getTransfer(v.colorSpace)!==ht,u!==v||f!==v.version||h!==e.toneMapping)l.material.needsUpdate=!0,u=v,f=v.version,h=e.toneMapping;l.layers.enableAll(),A.unshift(l,l.geometry,l.material,0,0,null)}else if(v&&v.isTexture){if(c===void 0)c=new pt(new to(2,2),new Mn({name:"BackgroundMaterial",uniforms:gr(ei.background.uniforms),vertexShader:ei.background.vertexShader,fragmentShader:ei.background.fragmentShader,side:Ui,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c);if(c.material.uniforms.t2D.value=v,c.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,c.material.toneMapped=We.getTransfer(v.colorSpace)!==ht,v.matrixAutoUpdate===!0)v.updateMatrix();if(c.material.uniforms.uvTransform.value.copy(v.matrix),u!==v||f!==v.version||h!==e.toneMapping)c.material.needsUpdate=!0,u=v,f=v.version,h=e.toneMapping;c.layers.enableAll(),A.unshift(c,c.geometry,c.material,0,0,null)}}function p(A,T){A.getRGB(Ya,Au(e)),n.buffers.color.setClear(Ya.r,Ya.g,Ya.b,T,s)}function m(){if(l!==void 0)l.geometry.dispose(),l.material.dispose(),l=void 0;if(c!==void 0)c.geometry.dispose(),c.material.dispose(),c=void 0}return{getClearColor:function(){return o},setClearColor:function(A,T=1){o.set(A),a=T,p(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(A){a=A,p(o,a)},render:g,addToRenderList:y,dispose:m}}function DM(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},r=h(null),s=r,o=!1;function a(C,z,J,O,H){let V=!1,U=f(C,O,J,z);if(s!==U)s=U,l(s.object);if(V=d(C,O,J,H),V)g(C,O,J,H);if(H!==null)t.update(H,e.ELEMENT_ARRAY_BUFFER);if(V||o){if(o=!1,v(C,z,J,O),H!==null)e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(H).buffer)}}function c(){return e.createVertexArray()}function l(C){return e.bindVertexArray(C)}function u(C){return e.deleteVertexArray(C)}function f(C,z,J,O){let H=O.wireframe===!0,V=i[z.id];if(V===void 0)V={},i[z.id]=V;let U=C.isInstancedMesh===!0?C.id:0,K=V[U];if(K===void 0)K={},V[U]=K;let Q=K[J.id];if(Q===void 0)Q={},K[J.id]=Q;let se=Q[H];if(se===void 0)se=h(c()),Q[H]=se;return se}function h(C){let z=[],J=[],O=[];for(let H=0;H<n;H++)z[H]=0,J[H]=0,O[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:z,enabledAttributes:J,attributeDivisors:O,object:C,attributes:{},index:null}}function d(C,z,J,O){let H=s.attributes,V=z.attributes,U=0,K=J.getAttributes();for(let Q in K)if(K[Q].location>=0){let me=H[Q],_e=V[Q];if(_e===void 0){if(Q==="instanceMatrix"&&C.instanceMatrix)_e=C.instanceMatrix;if(Q==="instanceColor"&&C.instanceColor)_e=C.instanceColor}if(me===void 0)return!0;if(me.attribute!==_e)return!0;if(_e&&me.data!==_e.data)return!0;U++}if(s.attributesNum!==U)return!0;if(s.index!==O)return!0;return!1}function g(C,z,J,O){let H={},V=z.attributes,U=0,K=J.getAttributes();for(let Q in K)if(K[Q].location>=0){let me=V[Q];if(me===void 0){if(Q==="instanceMatrix"&&C.instanceMatrix)me=C.instanceMatrix;if(Q==="instanceColor"&&C.instanceColor)me=C.instanceColor}let _e={};if(_e.attribute=me,me&&me.data)_e.data=me.data;H[Q]=_e,U++}s.attributes=H,s.attributesNum=U,s.index=O}function y(){let C=s.newAttributes;for(let z=0,J=C.length;z<J;z++)C[z]=0}function p(C){m(C,0)}function m(C,z){let J=s.newAttributes,O=s.enabledAttributes,H=s.attributeDivisors;if(J[C]=1,O[C]===0)e.enableVertexAttribArray(C),O[C]=1;if(H[C]!==z)e.vertexAttribDivisor(C,z),H[C]=z}function A(){let C=s.newAttributes,z=s.enabledAttributes;for(let J=0,O=z.length;J<O;J++)if(z[J]!==C[J])e.disableVertexAttribArray(J),z[J]=0}function T(C,z,J,O,H,V,U){if(U===!0)e.vertexAttribIPointer(C,z,J,H,V);else e.vertexAttribPointer(C,z,J,O,H,V)}function v(C,z,J,O){y();let H=O.attributes,V=J.getAttributes(),U=z.defaultAttributeValues;for(let K in V){let Q=V[K];if(Q.location>=0){let se=H[K];if(se===void 0){if(K==="instanceMatrix"&&C.instanceMatrix)se=C.instanceMatrix;if(K==="instanceColor"&&C.instanceColor)se=C.instanceColor}if(se!==void 0){let me=se.normalized,_e=se.itemSize,qe=t.get(se);if(qe===void 0)continue;let{buffer:Ge,type:Z,bytesPerElement:ne}=qe,fe=Z===e.INT||Z===e.UNSIGNED_INT||se.gpuType===Dl;if(se.isInterleavedBufferAttribute){let de=se.data,Re=de.stride,Ze=se.offset;if(de.isInstancedInterleavedBuffer){for(let Oe=0;Oe<Q.locationSize;Oe++)m(Q.location+Oe,de.meshPerAttribute);if(C.isInstancedMesh!==!0&&O._maxInstanceCount===void 0)O._maxInstanceCount=de.meshPerAttribute*de.count}else for(let Oe=0;Oe<Q.locationSize;Oe++)p(Q.location+Oe);e.bindBuffer(e.ARRAY_BUFFER,Ge);for(let Oe=0;Oe<Q.locationSize;Oe++)T(Q.location+Oe,_e/Q.locationSize,Z,me,Re*ne,(Ze+_e/Q.locationSize*Oe)*ne,fe)}else{if(se.isInstancedBufferAttribute){for(let de=0;de<Q.locationSize;de++)m(Q.location+de,se.meshPerAttribute);if(C.isInstancedMesh!==!0&&O._maxInstanceCount===void 0)O._maxInstanceCount=se.meshPerAttribute*se.count}else for(let de=0;de<Q.locationSize;de++)p(Q.location+de);e.bindBuffer(e.ARRAY_BUFFER,Ge);for(let de=0;de<Q.locationSize;de++)T(Q.location+de,_e/Q.locationSize,Z,me,_e*ne,_e/Q.locationSize*de*ne,fe)}}else if(U!==void 0){let me=U[K];if(me!==void 0)switch(me.length){case 2:e.vertexAttrib2fv(Q.location,me);break;case 3:e.vertexAttrib3fv(Q.location,me);break;case 4:e.vertexAttrib4fv(Q.location,me);break;default:e.vertexAttrib1fv(Q.location,me)}}}}A()}function w(){S();for(let C in i){let z=i[C];for(let J in z){let O=z[J];for(let H in O){let V=O[H];for(let U in V)u(V[U].object),delete V[U];delete O[H]}}delete i[C]}}function E(C){if(i[C.id]===void 0)return;let z=i[C.id];for(let J in z){let O=z[J];for(let H in O){let V=O[H];for(let U in V)u(V[U].object),delete V[U];delete O[H]}}delete i[C.id]}function R(C){for(let z in i){let J=i[z];for(let O in J){let H=J[O];if(H[C.id]===void 0)continue;let V=H[C.id];for(let U in V)u(V[U].object),delete V[U];delete H[C.id]}}}function _(C){for(let z in i){let J=i[z],O=C.isInstancedMesh===!0?C.id:0,H=J[O];if(H===void 0)continue;for(let V in H){let U=H[V];for(let K in U)u(U[K].object),delete U[K];delete H[V]}if(delete J[O],Object.keys(J).length===0)delete i[z]}}function S(){if(F(),o=!0,s===r)return;s=r,l(s.object)}function F(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:S,resetDefaultState:F,dispose:w,releaseStatesOfGeometry:E,releaseStatesOfObject:_,releaseStatesOfProgram:R,initAttributes:y,enableAttribute:p,disableUnusedAttributes:A}}function UM(e,t,n){let i;function r(c){i=c}function s(c,l){e.drawArrays(i,c,l),n.update(l,i,1)}function o(c,l,u){if(u===0)return;e.drawArraysInstanced(i,c,l,u),n.update(l,i,u)}function a(c,l,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,l,0,u);let h=0;for(let d=0;d<u;d++)h+=l[d];n.update(h,i,1)}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a}function OM(e,t,n,i){let r;function s(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===!0){let R=t.get("EXT_texture_filter_anisotropic");r=e.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(R){if(R!==Jn&&i.convert(R)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))return!1;return!0}function a(R){let _=R===pi&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));if(R!==Fn&&i.convert(R)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==di&&!_)return!1;return!0}function c(R){if(R==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";R="mediump"}if(R==="mediump"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0)return"mediump"}return"lowp"}let l=n.precision!==void 0?n.precision:"highp",u=c(l);if(u!==l)Me("WebGLRenderer:",l,"not supported, using",u,"instead."),l=u;let f=n.logarithmicDepthBuffer===!0,h=n.reversedDepthBuffer===!0&&t.has("EXT_clip_control");if(n.reversedDepthBuffer===!0&&h===!1)Me("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let d=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),g=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=e.getParameter(e.MAX_TEXTURE_SIZE),p=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),m=e.getParameter(e.MAX_VERTEX_ATTRIBS),A=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),T=e.getParameter(e.MAX_VARYING_VECTORS),v=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),w=e.getParameter(e.MAX_SAMPLES),E=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:h,maxTextures:d,maxVertexTextures:g,maxTextureSize:y,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:A,maxVaryings:T,maxFragmentUniforms:v,maxSamples:w,samples:E}}function FM(e){let t=this,n=null,i=0,r=!1,s=!1,o=new Ln,a=new Ue,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,h){let d=f.length!==0||h||i!==0||r;return r=h,i=f.length,d},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,h){n=u(f,h,0)},this.setState=function(f,h,d){let{clippingPlanes:g,clipIntersection:y,clipShadows:p}=f,m=e.get(f);if(!r||g===null||g.length===0||s&&!p)if(s)u(null);else l();else{let A=s?0:i,T=A*4,v=m.clippingState||null;c.value=v,v=u(g,h,T,d);for(let w=0;w!==T;++w)v[w]=n[w];m.clippingState=v,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=A}};function l(){if(c.value!==n)c.value=n,c.needsUpdate=i>0;t.numPlanes=i,t.numIntersection=0}function u(f,h,d,g){let y=f!==null?f.length:0,p=null;if(y!==0){if(p=c.value,g!==!0||p===null){let m=d+y*4,A=h.matrixWorldInverse;if(a.getNormalMatrix(A),p===null||p.length<m)p=new Float32Array(m);for(let T=0,v=d;T!==y;++T,v+=4)o.copy(f[T]).applyMatrix4(A,a),o.normal.toArray(p,v),p[v+3]=o.constant}c.value=p,c.needsUpdate=!0}return t.numPlanes=y,t.numIntersection=0,p}}var Xi=4,M_=[0.125,0.215,0.35,0.446,0.526,0.582],vr=20,zM=256,so=new xr,w_=new Le,Wu=null,$u=0,Zu=0,Xu=!1,kM=new N;class lo{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=0.1,i=100,r={}){let{size:s=256,position:o=kM}=r;Wu=this._renderer.getRenderTarget(),$u=this._renderer.getActiveCubeFace(),Zu=this._renderer.getActiveMipmapLevel(),Xu=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);let a=this._allocateTargets();if(a.depthBuffer=!0,this._sceneToCubeUV(e,n,i,a,o),t>0)this._blur(a,0,0,t);return this._applyPMREM(a),this._cleanup(a),a}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){if(this._cubemapMaterial===null)this._cubemapMaterial=A_(),this._compileMaterial(this._cubemapMaterial)}compileEquirectangularShader(){if(this._equirectMaterial===null)this._equirectMaterial=E_(),this._compileMaterial(this._equirectMaterial)}dispose(){if(this._dispose(),this._cubemapMaterial!==null)this._cubemapMaterial.dispose();if(this._equirectMaterial!==null)this._equirectMaterial.dispose();if(this._backgroundBox!==null)this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){if(this._blurMaterial!==null)this._blurMaterial.dispose();if(this._ggxMaterial!==null)this._ggxMaterial.dispose();if(this._pingPongRenderTarget!==null)this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Wu,$u,Zu),this._renderer.xr.enabled=Xu,e.scissorTest=!1,as(e,0,0,e.width,e.height)}_fromTexture(e,t){if(e.mapping===qr||e.mapping===ur)this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width);else this._setSize(e.image.width/4);Wu=this._renderer.getRenderTarget(),$u=this._renderer.getActiveCubeFace(),Zu=this._renderer.getActiveMipmapLevel(),Xu=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Gt,minFilter:Gt,generateMipmaps:!1,type:pi,format:Jn,colorSpace:hn,depthBuffer:!1},i=T_(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){if(this._pingPongRenderTarget!==null)this._dispose();this._pingPongRenderTarget=T_(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=BM(r)),this._blurMaterial=HM(r,e,t),this._ggxMaterial=GM(r,e,t)}return i}_compileMaterial(e){let t=new pt(new tn,e);this._renderer.compile(t,so)}_sceneToCubeUV(e,t,n,i,r){let a=new Lt(90,1,t,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],u=this._renderer,{autoClear:f,toneMapping:h}=u;if(u.getClearColor(w_),u.toneMapping=Un,u.autoClear=!1,u.state.buffers.depth.getReversed())u.setRenderTarget(i),u.clearDepth(),u.setRenderTarget(null);if(this._backgroundBox===null)this._backgroundBox=new pt(new Gi,new Kn({name:"PMREM.Background",side:Yt,depthWrite:!1,depthTest:!1}));let g=this._backgroundBox,y=g.material,p=!1,m=e.background;if(m){if(m.isColor)y.color.copy(m),e.background=null,p=!0}else y.color.copy(w_),p=!0;for(let A=0;A<6;A++){let T=A%3;if(T===0)a.up.set(0,c[A],0),a.position.set(r.x,r.y,r.z),a.lookAt(r.x+l[A],r.y,r.z);else if(T===1)a.up.set(0,0,c[A]),a.position.set(r.x,r.y,r.z),a.lookAt(r.x,r.y+l[A],r.z);else a.up.set(0,c[A],0),a.position.set(r.x,r.y,r.z),a.lookAt(r.x,r.y,r.z+l[A]);let v=this._cubeSize;if(as(i,T*v,A>2?v:0,v,v),u.setRenderTarget(i),p)u.render(g,a);u.render(e,a)}u.toneMapping=h,u.autoClear=f,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===qr||e.mapping===ur;if(i){if(this._cubemapMaterial===null)this._cubemapMaterial=A_();this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1}else if(this._equirectMaterial===null)this._equirectMaterial=E_();let r=i?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=r;let o=r.uniforms;o.envMap.value=e;let a=this._cubeSize;as(t,0,0,3*a,2*a),n.setRenderTarget(t),n.render(s,so)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let i=this._lodMeshes.length;for(let r=1;r<i;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){let i=this._renderer,r=this._pingPongRenderTarget,s=this._ggxMaterial,o=this._lodMeshes[n];o.material=s;let a=s.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l),f=0+c*1.25,h=u*f,{_lodMax:d}=this,g=this._sizeLods[n],y=3*g*(n>d-Xi?n-d+Xi:0),p=4*(this._cubeSize-g);a.envMap.value=e.texture,a.roughness.value=h,a.mipInt.value=d-t,as(r,y,p,3*g,2*g),i.setRenderTarget(r),i.render(o,so),a.envMap.value=r.texture,a.roughness.value=0,a.mipInt.value=d-n,as(e,y,p,3*g,2*g),i.setRenderTarget(e),i.render(o,so)}_blur(e,t,n,i,r){let s=this._pingPongRenderTarget;this._halfBlur(e,s,t,n,i,"latitudinal",r),this._halfBlur(s,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,s,o){let a=this._renderer,c=this._blurMaterial;if(s!=="latitudinal"&&s!=="longitudinal")Ne("blur direction must be either latitudinal or longitudinal!");let l=3,u=this._lodMeshes[i];u.material=c;let f=c.uniforms,h=this._sizeLods[n]-1,d=isFinite(r)?Math.PI/(2*h):2*Math.PI/(2*vr-1),g=r/d,y=isFinite(r)?1+Math.floor(l*g):vr;if(y>vr)Me(`sigmaRadians, ${r}, is too large and will clip, as it requested ${y} samples when the maximum is set to ${vr}`);let p=[],m=0;for(let E=0;E<vr;++E){let R=E/g,_=Math.exp(-R*R/2);if(p.push(_),E===0)m+=_;else if(E<y)m+=2*_}for(let E=0;E<p.length;E++)p[E]=p[E]/m;if(f.envMap.value=e.texture,f.samples.value=y,f.weights.value=p,f.latitudinal.value=s==="latitudinal",o)f.poleAxis.value=o;let{_lodMax:A}=this;f.dTheta.value=d,f.mipInt.value=A-n;let T=this._sizeLods[i],v=3*T*(i>A-Xi?i-A+Xi:0),w=4*(this._cubeSize-T);as(t,v,w,3*T,2*T),a.setRenderTarget(t),a.render(u,so)}}function BM(e){let t=[],n=[],i=[],r=e,s=e-Xi+1+M_.length;for(let o=0;o<s;o++){let a=Math.pow(2,r);t.push(a);let c=1/a;if(o>e-Xi)c=M_[o-e+Xi-1];else if(o===0)c=0;n.push(c);let l=1/(a-2),u=-l,f=1+l,h=[u,u,f,u,f,f,u,u,f,f,u,f],d=6,g=6,y=3,p=2,m=1,A=new Float32Array(y*g*d),T=new Float32Array(p*g*d),v=new Float32Array(m*g*d);for(let E=0;E<d;E++){let R=E%3*2/3-1,_=E>2?0:-1,S=[R,_,0,R+0.6666666666666666,_,0,R+0.6666666666666666,_+1,0,R,_,0,R+0.6666666666666666,_+1,0,R,_+1,0];A.set(S,y*g*E),T.set(h,p*g*E);let F=[E,E,E,E,E,E];v.set(F,m*g*E)}let w=new tn;if(w.setAttribute("position",new Nt(A,y)),w.setAttribute("uv",new Nt(T,p)),w.setAttribute("faceIndex",new Nt(v,m)),i.push(new pt(w,null)),r>Xi)r--}return{lodMeshes:i,sizeLods:t,sigmas:n}}function T_(e,t,n){let i=new Sn(e,t,n);return i.texture.mapping=Hs,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function as(e,t,n,i,r){e.viewport.set(t,n,i,r),e.scissor.set(t,n,i,r)}function GM(e,t,n){return new Mn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:zM,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Ja(),fragmentShader:`

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
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function HM(e,t,n){let i=new Float32Array(vr),r=new N(0,1,0);return new Mn({name:"SphericalGaussianBlur",defines:{n:vr,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Ja(),fragmentShader:`

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
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function E_(){return new Mn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ja(),fragmentShader:`

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
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function A_(){return new Mn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ja(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function Ja(){return`

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
	`}class Ku extends Sn{constructor(e=1,t={}){super(e,e,t);this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new Oa(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new Gi(5,5,5),r=new Mn({name:"CubemapFromEquirect",uniforms:gr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Yt,blending:Yn});r.uniforms.tEquirect.value=t;let s=new pt(i,r),o=t.minFilter;if(t.minFilter===jn)t.minFilter=Gt;return new Ou(1,10,this).update(e,s),t.minFilter=o,s.geometry.dispose(),s.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){let r=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,n,i);e.setRenderTarget(r)}}function VM(e){let t=new WeakMap,n=new WeakMap,i=null;function r(h,d=!1){if(h===null||h===void 0)return null;if(d)return o(h);return s(h)}function s(h){if(h&&h.isTexture){let d=h.mapping;if(d===ga||d===_a)if(t.has(h)){let g=t.get(h).texture;return a(g,h.mapping)}else{let g=h.image;if(g&&g.height>0){let y=new Ku(g.height);return y.fromEquirectangularTexture(e,h),t.set(h,y),h.addEventListener("dispose",l),a(y.texture,h.mapping)}else return null}}return h}function o(h){if(h&&h.isTexture){let d=h.mapping,g=d===ga||d===_a,y=d===qr||d===ur;if(g||y){let p=n.get(h),m=p!==void 0?p.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==m){if(i===null)i=new lo(e);return p=g?i.fromEquirectangular(h,p):i.fromCubemap(h,p),p.texture.pmremVersion=h.pmremVersion,n.set(h,p),p.texture}else if(p!==void 0)return p.texture;else{let A=h.image;if(g&&A&&A.height>0||y&&A&&c(A)){if(i===null)i=new lo(e);return p=g?i.fromEquirectangular(h):i.fromCubemap(h),p.texture.pmremVersion=h.pmremVersion,n.set(h,p),h.addEventListener("dispose",u),p.texture}else return null}}}return h}function a(h,d){if(d===ga)h.mapping=qr;else if(d===_a)h.mapping=ur;return h}function c(h){let d=0,g=6;for(let y=0;y<g;y++)if(h[y]!==void 0)d++;return d===g}function l(h){let d=h.target;d.removeEventListener("dispose",l);let g=t.get(d);if(g!==void 0)t.delete(d),g.dispose()}function u(h){let d=h.target;d.removeEventListener("dispose",u);let g=n.get(d);if(g!==void 0)n.delete(d),g.dispose()}function f(){if(t=new WeakMap,n=new WeakMap,i!==null)i.dispose(),i=null}return{get:r,dispose:f}}function WM(e){let t={};function n(i){if(t[i]!==void 0)return t[i];let r=e.getExtension(i);return t[i]=r,r}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){let r=n(i);if(r===null)ar("WebGLRenderer: "+i+" extension not supported.");return r}}}function $M(e,t,n,i){let r={},s=new WeakMap;function o(f){let h=f.target;if(h.index!==null)t.remove(h.index);for(let g in h.attributes)t.remove(h.attributes[g]);h.removeEventListener("dispose",o),delete r[h.id];let d=s.get(h);if(d)t.remove(d),s.delete(h);if(i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0)delete h._maxInstanceCount;n.memory.geometries--}function a(f,h){if(r[h.id]===!0)return h;return h.addEventListener("dispose",o),r[h.id]=!0,n.memory.geometries++,h}function c(f){let h=f.attributes;for(let d in h)t.update(h[d],e.ARRAY_BUFFER)}function l(f){let h=[],d=f.index,g=f.attributes.position,y=0;if(g===void 0)return;if(d!==null){let A=d.array;y=d.version;for(let T=0,v=A.length;T<v;T+=3){let w=A[T+0],E=A[T+1],R=A[T+2];h.push(w,E,E,R,R,w)}}else{let A=g.array;y=g.version;for(let T=0,v=A.length/3-1;T<v;T+=3){let w=T+0,E=T+1,R=T+2;h.push(w,E,E,R,R,w)}}let p=new(g.count>=65535?La:Pa)(h,1);p.version=y;let m=s.get(f);if(m)t.remove(m);s.set(f,p)}function u(f){let h=s.get(f);if(h){let d=f.index;if(d!==null){if(h.version<d.version)l(f)}}else l(f);return s.get(f)}return{get:a,update:c,getWireframeAttribute:u}}function ZM(e,t,n){let i;function r(f){i=f}let s,o;function a(f){s=f.type,o=f.bytesPerElement}function c(f,h){e.drawElements(i,h,s,f*o),n.update(h,i,1)}function l(f,h,d){if(d===0)return;e.drawElementsInstanced(i,h,s,f*o,d),n.update(h,i,d)}function u(f,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,h,0,s,f,0,d);let y=0;for(let p=0;p<d;p++)y+=h[p];n.update(y,i,1)}this.setMode=r,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function XM(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(n.calls++,o){case e.TRIANGLES:n.triangles+=a*(s/3);break;case e.LINES:n.lines+=a*(s/2);break;case e.LINE_STRIP:n.lines+=a*(s-1);break;case e.LINE_LOOP:n.lines+=a*s;break;case e.POINTS:n.points+=a*s;break;default:Ne("WebGLInfo: Unknown draw mode:",o);break}}function r(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:r,update:i}}function qM(e,t,n){let i=new WeakMap,r=new st;function s(o,a,c){let l=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,f=u!==void 0?u.length:0,h=i.get(a);if(h===void 0||h.count!==f){let S=function(){R.dispose(),i.delete(a),a.removeEventListener("dispose",S)};if(h!==void 0)h.texture.dispose();let d=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,y=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],m=a.morphAttributes.normal||[],A=a.morphAttributes.color||[],T=0;if(d===!0)T=1;if(g===!0)T=2;if(y===!0)T=3;let v=a.attributes.position.count*T,w=1;if(v>t.maxTextureSize)w=Math.ceil(v/t.maxTextureSize),v=t.maxTextureSize;let E=new Float32Array(v*w*4*f),R=new Ca(E,v,w,f);R.type=di,R.needsUpdate=!0;let _=T*4;for(let F=0;F<f;F++){let C=p[F],z=m[F],J=A[F],O=v*w*4*F;for(let H=0;H<C.count;H++){let V=H*_;if(d===!0)r.fromBufferAttribute(C,H),E[O+V+0]=r.x,E[O+V+1]=r.y,E[O+V+2]=r.z,E[O+V+3]=0;if(g===!0)r.fromBufferAttribute(z,H),E[O+V+4]=r.x,E[O+V+5]=r.y,E[O+V+6]=r.z,E[O+V+7]=0;if(y===!0)r.fromBufferAttribute(J,H),E[O+V+8]=r.x,E[O+V+9]=r.y,E[O+V+10]=r.z,E[O+V+11]=J.itemSize===4?r.w:1}}h={count:f,texture:R,size:new Ie(v,w)},i.set(a,h),a.addEventListener("dispose",S)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(e,"morphTexture",o.morphTexture,n);else{let d=0;for(let y=0;y<l.length;y++)d+=l[y];let g=a.morphTargetsRelative?1:1-d;c.getUniforms().setValue(e,"morphTargetBaseInfluence",g),c.getUniforms().setValue(e,"morphTargetInfluences",l)}c.getUniforms().setValue(e,"morphTargetsTexture",h.texture,n),c.getUniforms().setValue(e,"morphTargetsTextureSize",h.size)}return{update:s}}function YM(e,t,n,i,r){let s=new WeakMap;function o(l){let u=r.render.frame,f=l.geometry,h=t.get(l,f);if(s.get(h)!==u)t.update(h),s.set(h,u);if(l.isInstancedMesh){if(l.hasEventListener("dispose",c)===!1)l.addEventListener("dispose",c);if(s.get(l)!==u){if(n.update(l.instanceMatrix,e.ARRAY_BUFFER),l.instanceColor!==null)n.update(l.instanceColor,e.ARRAY_BUFFER);s.set(l,u)}}if(l.isSkinnedMesh){let d=l.skeleton;if(s.get(d)!==u)d.update(),s.set(d,u)}return h}function a(){s=new WeakMap}function c(l){let u=l.target;if(u.removeEventListener("dispose",c),i.releaseStatesOfObject(u),n.remove(u.instanceMatrix),u.instanceColor!==null)n.remove(u.instanceColor)}return{update:o,dispose:a}}var jM={[Rl]:"LINEAR_TONE_MAPPING",[Cl]:"REINHARD_TONE_MAPPING",[Il]:"CINEON_TONE_MAPPING",[Gs]:"ACES_FILMIC_TONE_MAPPING",[Ll]:"AGX_TONE_MAPPING",[Nl]:"NEUTRAL_TONE_MAPPING",[Pl]:"CUSTOM_TONE_MAPPING"};function JM(e,t,n,i,r,s){let o=new Sn(t,n,{type:e,depthBuffer:r,stencilBuffer:s,samples:i?4:0,depthTexture:r?new Bi(t,n):void 0}),a=new Sn(t,n,{type:pi,depthBuffer:!1,stencilBuffer:!1}),c=new tn;c.setAttribute("position",new nn([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new nn([0,2,0,0,2,0],2));let l=new Ru({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),u=new pt(c,l),f=new xr(-1,1,1,-1,0,1),h=null,d=null,g=!1,y,p=null,m=[],A=!1;this.setSize=function(T,v){o.setSize(T,v),a.setSize(T,v);for(let w=0;w<m.length;w++){let E=m[w];if(E.setSize)E.setSize(T,v)}},this.setEffects=function(T){m=T,A=m.length>0&&m[0].isRenderPass===!0;let{width:v,height:w}=o;for(let E=0;E<m.length;E++){let R=m[E];if(R.setSize)R.setSize(v,w)}},this.begin=function(T,v){if(g)return!1;if(T.toneMapping===Un&&m.length===0)return!1;if(p=v,v!==null){let{width:w,height:E}=v;if(o.width!==w||o.height!==E)this.setSize(w,E)}if(A===!1)T.setRenderTarget(o);return y=T.toneMapping,T.toneMapping=Un,!0},this.hasRenderPass=function(){return A},this.end=function(T,v){T.toneMapping=y,g=!0;let w=o,E=a;for(let R=0;R<m.length;R++){let _=m[R];if(_.enabled===!1)continue;if(_.render(T,E,w,v),_.needsSwap!==!1){let S=w;w=E,E=S}}if(h!==T.outputColorSpace||d!==T.toneMapping){if(h=T.outputColorSpace,d=T.toneMapping,l.defines={},We.getTransfer(h)===ht)l.defines.SRGB_TRANSFER="";let R=jM[d];if(R)l.defines[R]="";l.needsUpdate=!0}l.uniforms.tDiffuse.value=w.texture,T.setRenderTarget(p),T.render(u,f),p=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){if(o.depthTexture)o.depthTexture.dispose();o.dispose(),a.dispose(),c.dispose(),l.dispose()}}var X_=new wt,ju=new Bi(1,1),q_=new Ca,Y_=new Tu,j_=new Oa,R_=[],C_=[],I_=new Float32Array(16),P_=new Float32Array(9),L_=new Float32Array(4);function cs(e,t,n){let i=e[0];if(i<=0||i>0)return e;let r=t*n,s=R_[r];if(s===void 0)s=new Float32Array(r),R_[r]=s;if(t!==0){i.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=n,e[o].toArray(s,a)}return s}function Dt(e,t){if(e.length!==t.length)return!1;for(let n=0,i=e.length;n<i;n++)if(e[n]!==t[n])return!1;return!0}function Ut(e,t){for(let n=0,i=t.length;n<i;n++)e[n]=t[n]}function Ka(e,t){let n=C_[t];if(n===void 0)n=new Int32Array(t),C_[t]=n;for(let i=0;i!==t;++i)n[i]=e.allocateTextureUnit();return n}function KM(e,t){let n=this.cache;if(n[0]===t)return;e.uniform1f(this.addr,t),n[0]=t}function QM(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y)e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y}else{if(Dt(n,t))return;e.uniform2fv(this.addr,t),Ut(n,t)}}function ew(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z}else if(t.r!==void 0){if(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b}else{if(Dt(n,t))return;e.uniform3fv(this.addr,t),Ut(n,t)}}function tw(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w}else{if(Dt(n,t))return;e.uniform4fv(this.addr,t),Ut(n,t)}}function nw(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(Dt(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Ut(n,t)}else{if(Dt(n,i))return;L_.set(i),e.uniformMatrix2fv(this.addr,!1,L_),Ut(n,i)}}function iw(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(Dt(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Ut(n,t)}else{if(Dt(n,i))return;P_.set(i),e.uniformMatrix3fv(this.addr,!1,P_),Ut(n,i)}}function rw(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(Dt(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Ut(n,t)}else{if(Dt(n,i))return;I_.set(i),e.uniformMatrix4fv(this.addr,!1,I_),Ut(n,i)}}function sw(e,t){let n=this.cache;if(n[0]===t)return;e.uniform1i(this.addr,t),n[0]=t}function ow(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y)e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y}else{if(Dt(n,t))return;e.uniform2iv(this.addr,t),Ut(n,t)}}function aw(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z}else{if(Dt(n,t))return;e.uniform3iv(this.addr,t),Ut(n,t)}}function cw(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w}else{if(Dt(n,t))return;e.uniform4iv(this.addr,t),Ut(n,t)}}function lw(e,t){let n=this.cache;if(n[0]===t)return;e.uniform1ui(this.addr,t),n[0]=t}function uw(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y)e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y}else{if(Dt(n,t))return;e.uniform2uiv(this.addr,t),Ut(n,t)}}function hw(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z}else{if(Dt(n,t))return;e.uniform3uiv(this.addr,t),Ut(n,t)}}function fw(e,t){let n=this.cache;if(t.x!==void 0){if(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w}else{if(Dt(n,t))return;e.uniform4uiv(this.addr,t),Ut(n,t)}}function dw(e,t,n){let i=this.cache,r=n.allocateTextureUnit();if(i[0]!==r)e.uniform1i(this.addr,r),i[0]=r;let s;if(this.type===e.SAMPLER_2D_SHADOW)ju.compareFunction=n.isReversedDepthBuffer()?Ra:Aa,s=ju;else s=X_;n.setTexture2D(t||s,r)}function pw(e,t,n){let i=this.cache,r=n.allocateTextureUnit();if(i[0]!==r)e.uniform1i(this.addr,r),i[0]=r;n.setTexture3D(t||Y_,r)}function mw(e,t,n){let i=this.cache,r=n.allocateTextureUnit();if(i[0]!==r)e.uniform1i(this.addr,r),i[0]=r;n.setTextureCube(t||j_,r)}function gw(e,t,n){let i=this.cache,r=n.allocateTextureUnit();if(i[0]!==r)e.uniform1i(this.addr,r),i[0]=r;n.setTexture2DArray(t||q_,r)}function _w(e){switch(e){case 5126:return KM;case 35664:return QM;case 35665:return ew;case 35666:return tw;case 35674:return nw;case 35675:return iw;case 35676:return rw;case 5124:case 35670:return sw;case 35667:case 35671:return ow;case 35668:case 35672:return aw;case 35669:case 35673:return cw;case 5125:return lw;case 36294:return uw;case 36295:return hw;case 36296:return fw;case 35678:case 36198:case 36298:case 36306:case 35682:return dw;case 35679:case 36299:case 36307:return pw;case 35680:case 36300:case 36308:case 36293:return mw;case 36289:case 36303:case 36311:case 36292:return gw}}function xw(e,t){e.uniform1fv(this.addr,t)}function vw(e,t){let n=cs(t,this.size,2);e.uniform2fv(this.addr,n)}function yw(e,t){let n=cs(t,this.size,3);e.uniform3fv(this.addr,n)}function bw(e,t){let n=cs(t,this.size,4);e.uniform4fv(this.addr,n)}function Sw(e,t){let n=cs(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Mw(e,t){let n=cs(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function ww(e,t){let n=cs(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Tw(e,t){e.uniform1iv(this.addr,t)}function Ew(e,t){e.uniform2iv(this.addr,t)}function Aw(e,t){e.uniform3iv(this.addr,t)}function Rw(e,t){e.uniform4iv(this.addr,t)}function Cw(e,t){e.uniform1uiv(this.addr,t)}function Iw(e,t){e.uniform2uiv(this.addr,t)}function Pw(e,t){e.uniform3uiv(this.addr,t)}function Lw(e,t){e.uniform4uiv(this.addr,t)}function Nw(e,t,n){let i=this.cache,r=t.length,s=Ka(n,r);if(!Dt(i,s))e.uniform1iv(this.addr,s),Ut(i,s);let o;if(this.type===e.SAMPLER_2D_SHADOW)o=ju;else o=X_;for(let a=0;a!==r;++a)n.setTexture2D(t[a]||o,s[a])}function Dw(e,t,n){let i=this.cache,r=t.length,s=Ka(n,r);if(!Dt(i,s))e.uniform1iv(this.addr,s),Ut(i,s);for(let o=0;o!==r;++o)n.setTexture3D(t[o]||Y_,s[o])}function Uw(e,t,n){let i=this.cache,r=t.length,s=Ka(n,r);if(!Dt(i,s))e.uniform1iv(this.addr,s),Ut(i,s);for(let o=0;o!==r;++o)n.setTextureCube(t[o]||j_,s[o])}function Ow(e,t,n){let i=this.cache,r=t.length,s=Ka(n,r);if(!Dt(i,s))e.uniform1iv(this.addr,s),Ut(i,s);for(let o=0;o!==r;++o)n.setTexture2DArray(t[o]||q_,s[o])}function Fw(e){switch(e){case 5126:return xw;case 35664:return vw;case 35665:return yw;case 35666:return bw;case 35674:return Sw;case 35675:return Mw;case 35676:return ww;case 5124:case 35670:return Tw;case 35667:case 35671:return Ew;case 35668:case 35672:return Aw;case 35669:case 35673:return Rw;case 5125:return Cw;case 36294:return Iw;case 36295:return Pw;case 36296:return Lw;case 35678:case 36198:case 36298:case 36306:case 35682:return Nw;case 35679:case 36299:case 36307:return Dw;case 35680:case 36300:case 36308:case 36293:return Uw;case 36289:case 36303:case 36311:case 36292:return Ow}}class J_{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=_w(t.type)}}class K_{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Fw(t.type)}}class Q_{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let r=0,s=i.length;r!==s;++r){let o=i[r];o.setValue(e,t[o.id],n)}}}var qu=/(\w+)(\])?(\[|\.)?/g;function N_(e,t){e.seq.push(t),e.map[t.id]=t}function zw(e,t,n){let i=e.name,r=i.length;qu.lastIndex=0;while(!0){let s=qu.exec(i),o=qu.lastIndex,a=s[1],c=s[2]==="]",l=s[3];if(c)a=a|0;if(l===void 0||l==="["&&o+2===r){N_(n,l===void 0?new J_(a,e,t):new K_(a,e,t));break}else{let f=n.map[a];if(f===void 0)f=new Q_(a),N_(n,f);n=f}}}class co{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let o=e.getActiveUniform(t,s),a=e.getUniformLocation(t,o.name);zw(o,a,this)}let i=[],r=[];for(let s of this.seq)if(s.type===e.SAMPLER_2D_SHADOW||s.type===e.SAMPLER_CUBE_SHADOW||s.type===e.SAMPLER_2D_ARRAY_SHADOW)i.push(s);else r.push(s);if(i.length>0)this.seq=i.concat(r)}setValue(e,t,n,i){let r=this.map[t];if(r!==void 0)r.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];if(i!==void 0)this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,s=t.length;r!==s;++r){let o=t[r],a=n[o.id];if(a.needsUpdate!==!1)o.setValue(e,a.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,r=e.length;i!==r;++i){let s=e[i];if(s.id in t)n.push(s)}return n}}function D_(e,t,n){let i=e.createShader(t);return e.shaderSource(i,n),e.compileShader(i),i}var kw=37297,Bw=0;function Gw(e,t){let n=e.split(`
`),i=[],r=Math.max(t-6,0),s=Math.min(t+6,n.length);for(let o=r;o<s;o++){let a=o+1;i.push(`${a===t?">":" "} ${a}: ${n[o]}`)}return i.join(`
`)}var U_=new Ue;function Hw(e){We._getMatrix(U_,We.workingColorSpace,e);let t=`mat3( ${U_.elements.map((n)=>n.toFixed(4))} )`;switch(We.getTransfer(e)){case vu:return[t,"LinearTransferOETF"];case ht:return[t,"sRGBTransferOETF"];default:return Me("WebGLProgram: Unsupported color space: ",e),[t,"LinearTransferOETF"]}}function O_(e,t,n){let i=e.getShaderParameter(t,e.COMPILE_STATUS),s=(e.getShaderInfoLog(t)||"").trim();if(i&&s==="")return"";let o=/ERROR: 0:(\d+)/.exec(s);if(o){let a=parseInt(o[1]);return n.toUpperCase()+`

`+s+`

`+Gw(e.getShaderSource(t),a)}else return s}function Vw(e,t){let n=Hw(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,"}"].join(`
`)}var Ww={[Rl]:"Linear",[Cl]:"Reinhard",[Il]:"Cineon",[Gs]:"ACESFilmic",[Ll]:"AgX",[Nl]:"Neutral",[Pl]:"Custom"};function $w(e,t){let n=Ww[t];if(n===void 0)return Me("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }";return"vec3 "+e+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}var ja=new N;function Zw(){We.getLuminanceCoefficients(ja);let e=ja.x.toFixed(4),t=ja.y.toFixed(4),n=ja.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${n} );`,"\treturn dot( weights, rgb );","}"].join(`
`)}function Xw(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ao).join(`
`)}function qw(e){let t=[];for(let n in e){let i=e[n];if(i===!1)continue;t.push("#define "+n+" "+i)}return t.join(`
`)}function Yw(e,t){let n={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let s=e.getActiveAttrib(t,r),o=s.name,a=1;if(s.type===e.FLOAT_MAT2)a=2;if(s.type===e.FLOAT_MAT3)a=3;if(s.type===e.FLOAT_MAT4)a=4;n[o]={type:s.type,location:e.getAttribLocation(t,o),locationSize:a}}return n}function ao(e){return e!==""}function F_(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function z_(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var jw=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ju(e){return e.replace(jw,Kw)}var Jw=new Map;function Kw(e,t){let n=He[t];if(n===void 0){let i=Jw.get(t);if(i!==void 0)n=He[i],Me('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Ju(n)}var Qw=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function k_(e){return e.replace(Qw,eT)}function eT(e,t,n,i){let r="";for(let s=parseInt(t);s<parseInt(n);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function B_(e){let t=`precision ${e.precision} float;
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
#define LOW_PRECISION`;return t}var tT={[ks]:"SHADOWMAP_TYPE_PCF",[Zr]:"SHADOWMAP_TYPE_VSM"};function nT(e){return tT[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var iT={[qr]:"ENVMAP_TYPE_CUBE",[ur]:"ENVMAP_TYPE_CUBE",[Hs]:"ENVMAP_TYPE_CUBE_UV"};function rT(e){if(e.envMap===!1)return"ENVMAP_TYPE_CUBE";return iT[e.envMapMode]||"ENVMAP_TYPE_CUBE"}var sT={[ur]:"ENVMAP_MODE_REFRACTION"};function oT(e){if(e.envMap===!1)return"ENVMAP_MODE_REFLECTION";return sT[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}var aT={[qg]:"ENVMAP_BLENDING_MULTIPLY",[Yg]:"ENVMAP_BLENDING_MIX",[jg]:"ENVMAP_BLENDING_ADD"};function cT(e){if(e.envMap===!1)return"ENVMAP_BLENDING_NONE";return aT[e.combine]||"ENVMAP_BLENDING_NONE"}function lT(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,n),112)),texelHeight:i,maxMip:n}}function uT(e,t,n,i){let r=e.getContext(),{defines:s,vertexShader:o,fragmentShader:a}=n,c=nT(n),l=rT(n),u=oT(n),f=cT(n),h=lT(n),d=Xw(n),g=qw(s),y=r.createProgram(),p,m,A=n.glslVersion?"#version "+n.glslVersion+`
`:"";if(n.isRawShaderMaterial){if(p=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,g].filter(ao).join(`
`),p.length>0)p+=`
`;if(m=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,g].filter(ao).join(`
`),m.length>0)m+=`
`}else p=[B_(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,g,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+u:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","\tattribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","\tattribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","\tuniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","\tattribute vec2 uv1;","#endif","#ifdef USE_UV2","\tattribute vec2 uv2;","#endif","#ifdef USE_UV3","\tattribute vec2 uv3;","#endif","#ifdef USE_TANGENT","\tattribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","\tattribute vec4 color;","#elif defined( USE_COLOR )","\tattribute vec3 color;","#endif","#ifdef USE_SKINNING","\tattribute vec4 skinIndex;","\tattribute vec4 skinWeight;","#endif",`
`].filter(ao).join(`
`),m=[B_(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,g,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+l:"",n.envMap?"#define "+u:"",n.envMap?"#define "+f:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==Un?"#define TONE_MAPPING":"",n.toneMapping!==Un?He.tonemapping_pars_fragment:"",n.toneMapping!==Un?$w("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",He.colorspace_pars_fragment,Vw("linearToOutputTexel",n.outputColorSpace),Zw(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(ao).join(`
`);if(o=Ju(o),o=F_(o,n),o=z_(o,n),a=Ju(a),a=F_(a,n),a=z_(a,n),o=k_(o),a=k_(a),n.isRawShaderMaterial!==!0)A=`#version 300 es
`,p=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",n.glslVersion===yu?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===yu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m;let T=A+p+o,v=A+m+a,w=D_(r,r.VERTEX_SHADER,T),E=D_(r,r.FRAGMENT_SHADER,v);if(r.attachShader(y,w),r.attachShader(y,E),n.index0AttributeName!==void 0)r.bindAttribLocation(y,0,n.index0AttributeName);else if(n.hasPositionAttribute===!0)r.bindAttribLocation(y,0,"position");r.linkProgram(y);function R(C){if(e.debug.checkShaderErrors){let z=r.getProgramInfoLog(y)||"",J=r.getShaderInfoLog(w)||"",O=r.getShaderInfoLog(E)||"",H=z.trim(),V=J.trim(),U=O.trim(),K=!0,Q=!0;if(r.getProgramParameter(y,r.LINK_STATUS)===!1)if(K=!1,typeof e.debug.onShaderError==="function")e.debug.onShaderError(r,y,w,E);else{let se=O_(r,w,"vertex"),me=O_(r,E,"fragment");Ne("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(y,r.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+H+`
`+se+`
`+me)}else if(H!=="")Me("WebGLProgram: Program Info Log:",H);else if(V===""||U==="")Q=!1;if(Q)C.diagnostics={runnable:K,programLog:H,vertexShader:{log:V,prefix:p},fragmentShader:{log:U,prefix:m}}}r.deleteShader(w),r.deleteShader(E),_=new co(r,y),S=Yw(r,y)}let _;this.getUniforms=function(){if(_===void 0)R(this);return _};let S;this.getAttributes=function(){if(S===void 0)R(this);return S};let F=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){if(F===!1)F=r.getProgramParameter(y,kw);return F},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(y),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=Bw++,this.cacheKey=t,this.usedTimes=1,this.program=y,this.vertexShader=w,this.fragmentShader=E,this}var hT=0;class e0{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let i=this._getShaderCacheForMaterial(e);if(i.has(t)===!1)i.add(t),t.usedTimes++;if(i.has(n)===!1)i.add(n),n.usedTimes++;return this}remove(e){let t=this.materialCache.get(e);for(let n of t)if(n.usedTimes--,n.usedTimes===0)this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);if(n===void 0)n=new Set,t.set(e,n);return n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);if(n===void 0)n=new t0(e),t.set(e,n);return n}}class t0{constructor(e){this.id=hT++,this.code=e,this.usedTimes=0}}function fT(e){return e===pr||e===wa||e===Ta}function dT(e,t,n,i,r,s){let o=new Ia,a=new e0,c=new Set,l=[],u=new Map,{logarithmicDepthBuffer:f,precision:h}=i,d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(_){if(c.add(_),_===0)return"uv";return`uv${_}`}function y(_,S,F,C,z,J){let O=C.fog,H=z.geometry,V=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?C.environment:null,U=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,K=t.get(_.envMap||V,U),Q=!!K&&K.mapping===Hs?K.image.height:null,se=d[_.type];if(_.precision!==null){if(h=i.getMaxPrecision(_.precision),h!==_.precision)Me("WebGLProgram.getParameters:",_.precision,"not supported, using",h,"instead.")}let me=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,_e=me!==void 0?me.length:0,qe=0;if(H.morphAttributes.position!==void 0)qe=1;if(H.morphAttributes.normal!==void 0)qe=2;if(H.morphAttributes.color!==void 0)qe=3;let Ge,Z,ne,fe;if(se){let Fe=ei[se];Ge=Fe.vertexShader,Z=Fe.fragmentShader}else{Ge=_.vertexShader,Z=_.fragmentShader;let Fe=a.getVertexShaderStage(_),St=a.getFragmentShaderStage(_);a.update(_,Fe,St),ne=Fe.id,fe=St.id}let de=e.getRenderTarget(),Re=e.state.buffers.depth.getReversed(),Ze=z.isInstancedMesh===!0,Oe=z.isBatchedMesh===!0,ke=!!_.map,Ke=!!_.matcap,Ye=!!K,Je=!!_.aoMap,Ft=!!_.lightMap,gn=!!_.bumpMap&&_.wireframe===!1,mt=!!_.normalMap,Ht=!!_.displacementMap,zt=!!_.emissiveMap,Pt=!!_.metalnessMap,L=!!_.roughnessMap,_n=_.anisotropy>0,nt=_.clearcoat>0,gt=_.dispersion>0,M=_.iridescence>0,x=_.sheen>0,I=_.transmission>0,W=_n&&!!_.anisotropyMap,te=nt&&!!_.clearcoatMap,ie=nt&&!!_.clearcoatNormalMap,le=nt&&!!_.clearcoatRoughnessMap,X=M&&!!_.iridescenceMap,j=M&&!!_.iridescenceThicknessMap,xe=x&&!!_.sheenColorMap,we=x&&!!_.sheenRoughnessMap,ue=!!_.specularMap,re=!!_.specularColorMap,Ce=!!_.specularIntensityMap,Pe=I&&!!_.transmissionMap,et=I&&!!_.thicknessMap,P=!!_.gradientMap,oe=!!_.alphaMap,Y=_.alphaTest>0,ae=!!_.alphaHash,ve=!!_.extensions,ee=Un;if(_.toneMapped){if(de===null||de.isXRRenderTarget===!0)ee=e.toneMapping}let ce={shaderID:se,shaderType:_.type,shaderName:_.name,vertexShader:Ge,fragmentShader:Z,defines:_.defines,customVertexShaderID:ne,customFragmentShaderID:fe,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:h,batching:Oe,batchingColor:Oe&&z._colorsTexture!==null,instancing:Ze,instancingColor:Ze&&z.instanceColor!==null,instancingMorph:Ze&&z.morphTexture!==null,outputColorSpace:de===null?e.outputColorSpace:de.isXRRenderTarget===!0?de.texture.colorSpace:We.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:ke,matcap:Ke,envMap:Ye,envMapMode:Ye&&K.mapping,envMapCubeUVHeight:Q,aoMap:Je,lightMap:Ft,bumpMap:gn,normalMap:mt,displacementMap:Ht,emissiveMap:zt,normalMapObjectSpace:mt&&_.normalMapType===r_,normalMapTangentSpace:mt&&_.normalMapType===xu,packedNormalMap:mt&&_.normalMapType===xu&&fT(_.normalMap.format),metalnessMap:Pt,roughnessMap:L,anisotropy:_n,anisotropyMap:W,clearcoat:nt,clearcoatMap:te,clearcoatNormalMap:ie,clearcoatRoughnessMap:le,dispersion:gt,iridescence:M,iridescenceMap:X,iridescenceThicknessMap:j,sheen:x,sheenColorMap:xe,sheenRoughnessMap:we,specularMap:ue,specularColorMap:re,specularIntensityMap:Ce,transmission:I,transmissionMap:Pe,thicknessMap:et,gradientMap:P,opaque:_.transparent===!1&&_.blending===Bs&&_.alphaToCoverage===!1,alphaMap:oe,alphaTest:Y,alphaHash:ae,combine:_.combine,mapUv:ke&&g(_.map.channel),aoMapUv:Je&&g(_.aoMap.channel),lightMapUv:Ft&&g(_.lightMap.channel),bumpMapUv:gn&&g(_.bumpMap.channel),normalMapUv:mt&&g(_.normalMap.channel),displacementMapUv:Ht&&g(_.displacementMap.channel),emissiveMapUv:zt&&g(_.emissiveMap.channel),metalnessMapUv:Pt&&g(_.metalnessMap.channel),roughnessMapUv:L&&g(_.roughnessMap.channel),anisotropyMapUv:W&&g(_.anisotropyMap.channel),clearcoatMapUv:te&&g(_.clearcoatMap.channel),clearcoatNormalMapUv:ie&&g(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:le&&g(_.clearcoatRoughnessMap.channel),iridescenceMapUv:X&&g(_.iridescenceMap.channel),iridescenceThicknessMapUv:j&&g(_.iridescenceThicknessMap.channel),sheenColorMapUv:xe&&g(_.sheenColorMap.channel),sheenRoughnessMapUv:we&&g(_.sheenRoughnessMap.channel),specularMapUv:ue&&g(_.specularMap.channel),specularColorMapUv:re&&g(_.specularColorMap.channel),specularIntensityMapUv:Ce&&g(_.specularIntensityMap.channel),transmissionMapUv:Pe&&g(_.transmissionMap.channel),thicknessMapUv:et&&g(_.thicknessMap.channel),alphaMapUv:oe&&g(_.alphaMap.channel),vertexTangents:!!H.attributes.tangent&&(mt||_n),vertexNormals:!!H.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,pointsUvs:z.isPoints===!0&&!!H.attributes.uv&&(ke||oe),fog:!!O,useFog:_.fog===!0,fogExp2:!!O&&O.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||H.attributes.normal===void 0&&mt===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:Re,skinning:z.isSkinnedMesh===!0,hasPositionAttribute:H.attributes.position!==void 0,morphTargets:H.morphAttributes.position!==void 0,morphNormals:H.morphAttributes.normal!==void 0,morphColors:H.morphAttributes.color!==void 0,morphTargetsCount:_e,morphTextureStride:qe,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numLightProbeGrids:J.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:_.dithering,shadowMapEnabled:e.shadowMap.enabled&&F.length>0,shadowMapType:e.shadowMap.type,toneMapping:ee,decodeVideoTexture:ke&&_.map.isVideoTexture===!0&&We.getTransfer(_.map.colorSpace)===ht,decodeVideoTextureEmissive:zt&&_.emissiveMap.isVideoTexture===!0&&We.getTransfer(_.emissiveMap.colorSpace)===ht,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===bn,flipSided:_.side===Yt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:ve&&_.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ve&&_.extensions.multiDraw===!0||Oe)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return ce.vertexUv1s=c.has(1),ce.vertexUv2s=c.has(2),ce.vertexUv3s=c.has(3),c.clear(),ce}function p(_){let S=[];if(_.shaderID)S.push(_.shaderID);else S.push(_.customVertexShaderID),S.push(_.customFragmentShaderID);if(_.defines!==void 0)for(let F in _.defines)S.push(F),S.push(_.defines[F]);if(_.isRawShaderMaterial===!1)m(S,_),A(S,_),S.push(e.outputColorSpace);return S.push(_.customProgramCacheKey),S.join()}function m(_,S){_.push(S.precision),_.push(S.outputColorSpace),_.push(S.envMapMode),_.push(S.envMapCubeUVHeight),_.push(S.mapUv),_.push(S.alphaMapUv),_.push(S.lightMapUv),_.push(S.aoMapUv),_.push(S.bumpMapUv),_.push(S.normalMapUv),_.push(S.displacementMapUv),_.push(S.emissiveMapUv),_.push(S.metalnessMapUv),_.push(S.roughnessMapUv),_.push(S.anisotropyMapUv),_.push(S.clearcoatMapUv),_.push(S.clearcoatNormalMapUv),_.push(S.clearcoatRoughnessMapUv),_.push(S.iridescenceMapUv),_.push(S.iridescenceThicknessMapUv),_.push(S.sheenColorMapUv),_.push(S.sheenRoughnessMapUv),_.push(S.specularMapUv),_.push(S.specularColorMapUv),_.push(S.specularIntensityMapUv),_.push(S.transmissionMapUv),_.push(S.thicknessMapUv),_.push(S.combine),_.push(S.fogExp2),_.push(S.sizeAttenuation),_.push(S.morphTargetsCount),_.push(S.morphAttributeCount),_.push(S.numDirLights),_.push(S.numPointLights),_.push(S.numSpotLights),_.push(S.numSpotLightMaps),_.push(S.numHemiLights),_.push(S.numRectAreaLights),_.push(S.numDirLightShadows),_.push(S.numPointLightShadows),_.push(S.numSpotLightShadows),_.push(S.numSpotLightShadowsWithMaps),_.push(S.numLightProbes),_.push(S.shadowMapType),_.push(S.toneMapping),_.push(S.numClippingPlanes),_.push(S.numClipIntersection),_.push(S.depthPacking)}function A(_,S){if(o.disableAll(),S.instancing)o.enable(0);if(S.instancingColor)o.enable(1);if(S.instancingMorph)o.enable(2);if(S.matcap)o.enable(3);if(S.envMap)o.enable(4);if(S.normalMapObjectSpace)o.enable(5);if(S.normalMapTangentSpace)o.enable(6);if(S.clearcoat)o.enable(7);if(S.iridescence)o.enable(8);if(S.alphaTest)o.enable(9);if(S.vertexColors)o.enable(10);if(S.vertexAlphas)o.enable(11);if(S.vertexUv1s)o.enable(12);if(S.vertexUv2s)o.enable(13);if(S.vertexUv3s)o.enable(14);if(S.vertexTangents)o.enable(15);if(S.anisotropy)o.enable(16);if(S.alphaHash)o.enable(17);if(S.batching)o.enable(18);if(S.dispersion)o.enable(19);if(S.batchingColor)o.enable(20);if(S.gradientMap)o.enable(21);if(S.packedNormalMap)o.enable(22);if(S.vertexNormals)o.enable(23);if(_.push(o.mask),o.disableAll(),S.fog)o.enable(0);if(S.useFog)o.enable(1);if(S.flatShading)o.enable(2);if(S.logarithmicDepthBuffer)o.enable(3);if(S.reversedDepthBuffer)o.enable(4);if(S.skinning)o.enable(5);if(S.morphTargets)o.enable(6);if(S.morphNormals)o.enable(7);if(S.morphColors)o.enable(8);if(S.premultipliedAlpha)o.enable(9);if(S.shadowMapEnabled)o.enable(10);if(S.doubleSided)o.enable(11);if(S.flipSided)o.enable(12);if(S.useDepthPacking)o.enable(13);if(S.dithering)o.enable(14);if(S.transmission)o.enable(15);if(S.sheen)o.enable(16);if(S.opaque)o.enable(17);if(S.pointsUvs)o.enable(18);if(S.decodeVideoTexture)o.enable(19);if(S.decodeVideoTextureEmissive)o.enable(20);if(S.alphaToCoverage)o.enable(21);if(S.numLightProbeGrids>0)o.enable(22);if(S.hasPositionAttribute)o.enable(23);_.push(o.mask)}function T(_){let S=d[_.type],F;if(S){let C=ei[S];F=g_.clone(C.uniforms)}else F=_.uniforms;return F}function v(_,S){let F=u.get(S);if(F!==void 0)++F.usedTimes;else F=new uT(e,S,_,r),l.push(F),u.set(S,F);return F}function w(_){if(--_.usedTimes===0){let S=l.indexOf(_);l[S]=l[l.length-1],l.pop(),u.delete(_.cacheKey),_.destroy()}}function E(_){a.remove(_)}function R(){a.dispose()}return{getParameters:y,getProgramCacheKey:p,getUniforms:T,acquireProgram:v,releaseProgram:w,releaseShaderCache:E,programs:l,dispose:R}}function pT(){let e=new WeakMap;function t(o){return e.has(o)}function n(o){let a=e.get(o);if(a===void 0)a={},e.set(o,a);return a}function i(o){e.delete(o)}function r(o,a,c){e.get(o)[a]=c}function s(){e=new WeakMap}return{has:t,get:n,remove:i,update:r,dispose:s}}function mT(e,t){if(e.groupOrder!==t.groupOrder)return e.groupOrder-t.groupOrder;else if(e.renderOrder!==t.renderOrder)return e.renderOrder-t.renderOrder;else if(e.material.id!==t.material.id)return e.material.id-t.material.id;else if(e.materialVariant!==t.materialVariant)return e.materialVariant-t.materialVariant;else if(e.z!==t.z)return e.z-t.z;else return e.id-t.id}function G_(e,t){if(e.groupOrder!==t.groupOrder)return e.groupOrder-t.groupOrder;else if(e.renderOrder!==t.renderOrder)return e.renderOrder-t.renderOrder;else if(e.z!==t.z)return t.z-e.z;else return e.id-t.id}function H_(){let e=[],t=0,n=[],i=[],r=[];function s(){t=0,n.length=0,i.length=0,r.length=0}function o(h){let d=0;if(h.isInstancedMesh)d+=2;if(h.isSkinnedMesh)d+=1;return d}function a(h,d,g,y,p,m){let A=e[t];if(A===void 0)A={id:h.id,object:h,geometry:d,material:g,materialVariant:o(h),groupOrder:y,renderOrder:h.renderOrder,z:p,group:m},e[t]=A;else A.id=h.id,A.object=h,A.geometry=d,A.material=g,A.materialVariant=o(h),A.groupOrder=y,A.renderOrder=h.renderOrder,A.z=p,A.group=m;return t++,A}function c(h,d,g,y,p,m){let A=a(h,d,g,y,p,m);if(g.transmission>0)i.push(A);else if(g.transparent===!0)r.push(A);else n.push(A)}function l(h,d,g,y,p,m){let A=a(h,d,g,y,p,m);if(g.transmission>0)i.unshift(A);else if(g.transparent===!0)r.unshift(A);else n.unshift(A)}function u(h,d,g){if(n.length>1)n.sort(h||mT);if(i.length>1)i.sort(d||G_);if(r.length>1)r.sort(d||G_);if(g)n.reverse(),i.reverse(),r.reverse()}function f(){for(let h=t,d=e.length;h<d;h++){let g=e[h];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:n,transmissive:i,transparent:r,init:s,push:c,unshift:l,finish:f,sort:u}}function gT(){let e=new WeakMap;function t(i,r){let s=e.get(i),o;if(s===void 0)o=new H_,e.set(i,[o]);else if(r>=s.length)o=new H_,s.push(o);else o=s[r];return o}function n(){e=new WeakMap}return{get:t,dispose:n}}function _T(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"DirectionalLight":n={direction:new N,color:new Le};break;case"SpotLight":n={position:new N,direction:new N,color:new Le,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new N,color:new Le,distance:0,decay:0};break;case"HemisphereLight":n={direction:new N,skyColor:new Le,groundColor:new Le};break;case"RectAreaLight":n={color:new Le,position:new N,halfWidth:new N,halfHeight:new N};break}return e[t.id]=n,n}}}function xT(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ie};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ie};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ie,shadowCameraNear:1,shadowCameraFar:1000};break}return e[t.id]=n,n}}}var vT=0;function yT(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function bT(e){let t=new _T,n=xT(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new N);let r=new N,s=new ze,o=new ze;function a(l){let u=0,f=0,h=0;for(let S=0;S<9;S++)i.probe[S].set(0,0,0);let d=0,g=0,y=0,p=0,m=0,A=0,T=0,v=0,w=0,E=0,R=0;l.sort(yT);for(let S=0,F=l.length;S<F;S++){let C=l[S],{color:z,intensity:J,distance:O}=C,H=null;if(C.shadow&&C.shadow.map)if(C.shadow.map.texture.format===pr)H=C.shadow.map.texture;else H=C.shadow.map.depthTexture||C.shadow.map.texture;if(C.isAmbientLight)u+=z.r*J,f+=z.g*J,h+=z.b*J;else if(C.isLightProbe){for(let V=0;V<9;V++)i.probe[V].addScaledVector(C.sh.coefficients[V],J);R++}else if(C.isDirectionalLight){let V=t.get(C);if(V.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){let U=C.shadow,K=n.get(C);K.shadowIntensity=U.intensity,K.shadowBias=U.bias,K.shadowNormalBias=U.normalBias,K.shadowRadius=U.radius,K.shadowMapSize=U.mapSize,i.directionalShadow[d]=K,i.directionalShadowMap[d]=H,i.directionalShadowMatrix[d]=C.shadow.matrix,A++}i.directional[d]=V,d++}else if(C.isSpotLight){let V=t.get(C);V.position.setFromMatrixPosition(C.matrixWorld),V.color.copy(z).multiplyScalar(J),V.distance=O,V.coneCos=Math.cos(C.angle),V.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),V.decay=C.decay,i.spot[y]=V;let U=C.shadow;if(C.map){if(i.spotLightMap[w]=C.map,w++,U.updateMatrices(C),C.castShadow)E++}if(i.spotLightMatrix[y]=U.matrix,C.castShadow){let K=n.get(C);K.shadowIntensity=U.intensity,K.shadowBias=U.bias,K.shadowNormalBias=U.normalBias,K.shadowRadius=U.radius,K.shadowMapSize=U.mapSize,i.spotShadow[y]=K,i.spotShadowMap[y]=H,v++}y++}else if(C.isRectAreaLight){let V=t.get(C);V.color.copy(z).multiplyScalar(J),V.halfWidth.set(C.width*0.5,0,0),V.halfHeight.set(0,C.height*0.5,0),i.rectArea[p]=V,p++}else if(C.isPointLight){let V=t.get(C);if(V.color.copy(C.color).multiplyScalar(C.intensity),V.distance=C.distance,V.decay=C.decay,C.castShadow){let U=C.shadow,K=n.get(C);K.shadowIntensity=U.intensity,K.shadowBias=U.bias,K.shadowNormalBias=U.normalBias,K.shadowRadius=U.radius,K.shadowMapSize=U.mapSize,K.shadowCameraNear=U.camera.near,K.shadowCameraFar=U.camera.far,i.pointShadow[g]=K,i.pointShadowMap[g]=H,i.pointShadowMatrix[g]=C.shadow.matrix,T++}i.point[g]=V,g++}else if(C.isHemisphereLight){let V=t.get(C);V.skyColor.copy(C.color).multiplyScalar(J),V.groundColor.copy(C.groundColor).multiplyScalar(J),i.hemi[m]=V,m++}}if(p>0)if(e.has("OES_texture_float_linear")===!0)i.rectAreaLTC1=he.LTC_FLOAT_1,i.rectAreaLTC2=he.LTC_FLOAT_2;else i.rectAreaLTC1=he.LTC_HALF_1,i.rectAreaLTC2=he.LTC_HALF_2;i.ambient[0]=u,i.ambient[1]=f,i.ambient[2]=h;let _=i.hash;if(_.directionalLength!==d||_.pointLength!==g||_.spotLength!==y||_.rectAreaLength!==p||_.hemiLength!==m||_.numDirectionalShadows!==A||_.numPointShadows!==T||_.numSpotShadows!==v||_.numSpotMaps!==w||_.numLightProbes!==R)i.directional.length=d,i.spot.length=y,i.rectArea.length=p,i.point.length=g,i.hemi.length=m,i.directionalShadow.length=A,i.directionalShadowMap.length=A,i.pointShadow.length=T,i.pointShadowMap.length=T,i.spotShadow.length=v,i.spotShadowMap.length=v,i.directionalShadowMatrix.length=A,i.pointShadowMatrix.length=T,i.spotLightMatrix.length=v+w-E,i.spotLightMap.length=w,i.numSpotLightShadowsWithMaps=E,i.numLightProbes=R,_.directionalLength=d,_.pointLength=g,_.spotLength=y,_.rectAreaLength=p,_.hemiLength=m,_.numDirectionalShadows=A,_.numPointShadows=T,_.numSpotShadows=v,_.numSpotMaps=w,_.numLightProbes=R,i.version=vT++}function c(l,u){let f=0,h=0,d=0,g=0,y=0,p=u.matrixWorldInverse;for(let m=0,A=l.length;m<A;m++){let T=l[m];if(T.isDirectionalLight){let v=i.directional[f];v.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),v.direction.sub(r),v.direction.transformDirection(p),f++}else if(T.isSpotLight){let v=i.spot[d];v.position.setFromMatrixPosition(T.matrixWorld),v.position.applyMatrix4(p),v.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),v.direction.sub(r),v.direction.transformDirection(p),d++}else if(T.isRectAreaLight){let v=i.rectArea[g];v.position.setFromMatrixPosition(T.matrixWorld),v.position.applyMatrix4(p),o.identity(),s.copy(T.matrixWorld),s.premultiply(p),o.extractRotation(s),v.halfWidth.set(T.width*0.5,0,0),v.halfHeight.set(0,T.height*0.5,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),g++}else if(T.isPointLight){let v=i.point[h];v.position.setFromMatrixPosition(T.matrixWorld),v.position.applyMatrix4(p),h++}else if(T.isHemisphereLight){let v=i.hemi[y];v.direction.setFromMatrixPosition(T.matrixWorld),v.direction.transformDirection(p),y++}}}return{setup:a,setupView:c,state:i}}function V_(e){let t=new bT(e),n=[],i=[],r=[];function s(h){f.camera=h,n.length=0,i.length=0,r.length=0}function o(h){n.push(h)}function a(h){i.push(h)}function c(h){r.push(h)}function l(){t.setup(n)}function u(h){t.setupView(n,h)}let f={lightsArray:n,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:f,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:a,pushLightProbeGrid:c}}function ST(e){let t=new WeakMap;function n(r,s=0){let o=t.get(r),a;if(o===void 0)a=new V_(e),t.set(r,[a]);else if(s>=o.length)a=new V_(e),o.push(a);else a=o[s];return a}function i(){t=new WeakMap}return{get:n,dispose:i}}var MT=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,wT=`uniform sampler2D shadow_pass;
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
}`,TT=[new N(1,0,0),new N(-1,0,0),new N(0,1,0),new N(0,-1,0),new N(0,0,1),new N(0,0,-1)],ET=[new N(0,-1,0),new N(0,-1,0),new N(0,0,1),new N(0,0,-1),new N(0,-1,0),new N(0,-1,0)],W_=new ze,oo=new N,Yu=new N;function AT(e,t,n){let i=new Ks,r=new Ie,s=new Ie,o=new st,a=new Cu,c=new Iu,l={},u=n.maxTextureSize,f={[Ui]:Yt,[Yt]:Ui,[bn]:bn},h=new Mn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ie},radius:{value:4}},vertexShader:MT,fragmentShader:wT}),d=h.clone();d.defines.HORIZONTAL_PASS=1;let g=new tn;g.setAttribute("position",new Nt(new Float32Array([-1,-1,0.5,3,-1,0.5,-1,3,0.5]),3));let y=new pt(g,h),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ks;let m=this.type;this.render=function(E,R,_){if(p.enabled===!1)return;if(p.autoUpdate===!1&&p.needsUpdate===!1)return;if(E.length===0)return;if(this.type===yg)Me("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=ks;let S=e.getRenderTarget(),F=e.getActiveCubeFace(),C=e.getActiveMipmapLevel(),z=e.state;if(z.setBlending(Yn),z.buffers.depth.getReversed()===!0)z.buffers.color.setClear(0,0,0,0);else z.buffers.color.setClear(1,1,1,1);z.buffers.depth.setTest(!0),z.setScissorTest(!1);let J=m!==this.type;if(J)R.traverse(function(O){if(O.material)if(Array.isArray(O.material))O.material.forEach((H)=>H.needsUpdate=!0);else O.material.needsUpdate=!0});for(let O=0,H=E.length;O<H;O++){let V=E[O],U=V.shadow;if(U===void 0){Me("WebGLShadowMap:",V,"has no shadow.");continue}if(U.autoUpdate===!1&&U.needsUpdate===!1)continue;r.copy(U.mapSize);let K=U.getFrameExtents();if(r.multiply(K),s.copy(U.mapSize),r.x>u||r.y>u){if(r.x>u)s.x=Math.floor(u/K.x),r.x=s.x*K.x,U.mapSize.x=s.x;if(r.y>u)s.y=Math.floor(u/K.y),r.y=s.y*K.y,U.mapSize.y=s.y}let Q=e.state.buffers.depth.getReversed();if(U.camera._reversedDepth=Q,U.map===null||J===!0){if(U.map!==null){if(U.map.depthTexture!==null)U.map.depthTexture.dispose(),U.map.depthTexture=null;U.map.dispose()}if(this.type===Zr){if(V.isPointLight){Me("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}U.map=new Sn(r.x,r.y,{format:pr,type:pi,minFilter:Gt,magFilter:Gt,generateMipmaps:!1}),U.map.texture.name=V.name+".shadowMap",U.map.depthTexture=new Bi(r.x,r.y,di),U.map.depthTexture.name=V.name+".shadowMapDepth",U.map.depthTexture.format=fr,U.map.depthTexture.compareFunction=null,U.map.depthTexture.minFilter=On,U.map.depthTexture.magFilter=On}else{if(V.isPointLight)U.map=new Ku(r.x),U.map.depthTexture=new Eu(r.x,Oi);else U.map=new Sn(r.x,r.y),U.map.depthTexture=new Bi(r.x,r.y,Oi);if(U.map.depthTexture.name=V.name+".shadowMap",U.map.depthTexture.format=fr,this.type===ks)U.map.depthTexture.compareFunction=Q?Ra:Aa,U.map.depthTexture.minFilter=Gt,U.map.depthTexture.magFilter=Gt;else U.map.depthTexture.compareFunction=null,U.map.depthTexture.minFilter=On,U.map.depthTexture.magFilter=On}U.camera.updateProjectionMatrix()}let se=U.map.isWebGLCubeRenderTarget?6:1;for(let me=0;me<se;me++){if(U.map.isWebGLCubeRenderTarget)e.setRenderTarget(U.map,me),e.clear();else{if(me===0)e.setRenderTarget(U.map),e.clear();let _e=U.getViewport(me);o.set(s.x*_e.x,s.y*_e.y,s.x*_e.z,s.y*_e.w),z.viewport(o)}if(V.isPointLight){let{camera:_e,matrix:qe}=U,Ge=V.distance||_e.far;if(Ge!==_e.far)_e.far=Ge,_e.updateProjectionMatrix();oo.setFromMatrixPosition(V.matrixWorld),_e.position.copy(oo),Yu.copy(_e.position),Yu.add(TT[me]),_e.up.copy(ET[me]),_e.lookAt(Yu),_e.updateMatrixWorld(),qe.makeTranslation(-oo.x,-oo.y,-oo.z),W_.multiplyMatrices(_e.projectionMatrix,_e.matrixWorldInverse),U._frustum.setFromProjectionMatrix(W_,_e.coordinateSystem,_e.reversedDepth)}else U.updateMatrices(V);i=U.getFrustum(),v(R,_,U.camera,V,this.type)}if(U.isPointLightShadow!==!0&&this.type===Zr)A(U,_);U.needsUpdate=!1}m=this.type,p.needsUpdate=!1,e.setRenderTarget(S,F,C)};function A(E,R){let _=t.update(y);if(h.defines.VSM_SAMPLES!==E.blurSamples)h.defines.VSM_SAMPLES=E.blurSamples,d.defines.VSM_SAMPLES=E.blurSamples,h.needsUpdate=!0,d.needsUpdate=!0;if(E.mapPass===null)E.mapPass=new Sn(r.x,r.y,{format:pr,type:pi});h.uniforms.shadow_pass.value=E.map.depthTexture,h.uniforms.resolution.value=E.mapSize,h.uniforms.radius.value=E.radius,e.setRenderTarget(E.mapPass),e.clear(),e.renderBufferDirect(R,null,_,h,y,null),d.uniforms.shadow_pass.value=E.mapPass.texture,d.uniforms.resolution.value=E.mapSize,d.uniforms.radius.value=E.radius,e.setRenderTarget(E.map),e.clear(),e.renderBufferDirect(R,null,_,d,y,null)}function T(E,R,_,S){let F=null,C=_.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(C!==void 0)F=C;else if(F=_.isPointLight===!0?c:a,e.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){let z=F.uuid,J=R.uuid,O=l[z];if(O===void 0)O={},l[z]=O;let H=O[J];if(H===void 0)H=F.clone(),O[J]=H,R.addEventListener("dispose",w);F=H}if(F.visible=R.visible,F.wireframe=R.wireframe,S===Zr)F.side=R.shadowSide!==null?R.shadowSide:R.side;else F.side=R.shadowSide!==null?R.shadowSide:f[R.side];if(F.alphaMap=R.alphaMap,F.alphaTest=R.alphaToCoverage===!0?0.5:R.alphaTest,F.map=R.map,F.clipShadows=R.clipShadows,F.clippingPlanes=R.clippingPlanes,F.clipIntersection=R.clipIntersection,F.displacementMap=R.displacementMap,F.displacementScale=R.displacementScale,F.displacementBias=R.displacementBias,F.wireframeLinewidth=R.wireframeLinewidth,F.linewidth=R.linewidth,_.isPointLight===!0&&F.isMeshDistanceMaterial===!0){let z=e.properties.get(F);z.light=_}return F}function v(E,R,_,S,F){if(E.visible===!1)return;if(E.layers.test(R.layers)&&(E.isMesh||E.isLine||E.isPoints)){if((E.castShadow||E.receiveShadow&&F===Zr)&&(!E.frustumCulled||i.intersectsObject(E))){E.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,E.matrixWorld);let J=t.update(E),O=E.material;if(Array.isArray(O)){let H=J.groups;for(let V=0,U=H.length;V<U;V++){let K=H[V],Q=O[K.materialIndex];if(Q&&Q.visible){let se=T(E,Q,S,F);E.onBeforeShadow(e,E,R,_,J,se,K),e.renderBufferDirect(_,null,J,se,E,K),E.onAfterShadow(e,E,R,_,J,se,K)}}}else if(O.visible){let H=T(E,O,S,F);E.onBeforeShadow(e,E,R,_,J,H,null),e.renderBufferDirect(_,null,J,H,E,null),E.onAfterShadow(e,E,R,_,J,H,null)}}}let z=E.children;for(let J=0,O=z.length;J<O;J++)v(z[J],R,_,S,F)}function w(E){E.target.removeEventListener("dispose",w);for(let _ in l){let S=l[_],F=E.target.uuid;if(F in S)S[F].dispose(),delete S[F]}}}function RT(e,t){function n(){let P=!1,oe=new st,Y=null,ae=new st(0,0,0,0);return{setMask:function(ve){if(Y!==ve&&!P)e.colorMask(ve,ve,ve,ve),Y=ve},setLocked:function(ve){P=ve},setClear:function(ve,ee,ce,Fe,St){if(St===!0)ve*=Fe,ee*=Fe,ce*=Fe;if(oe.set(ve,ee,ce,Fe),ae.equals(oe)===!1)e.clearColor(ve,ee,ce,Fe),ae.copy(oe)},reset:function(){P=!1,Y=null,ae.set(-1,0,0,0)}}}function i(){let P=!1,oe=!1,Y=null,ae=null,ve=null;return{setReversed:function(ee){if(oe!==ee){let ce=t.get("EXT_clip_control");if(ee)ce.clipControlEXT(ce.LOWER_LEFT_EXT,ce.ZERO_TO_ONE_EXT);else ce.clipControlEXT(ce.LOWER_LEFT_EXT,ce.NEGATIVE_ONE_TO_ONE_EXT);oe=ee;let Fe=ve;ve=null,this.setClear(Fe)}},getReversed:function(){return oe},setTest:function(ee){if(ee)de(e.DEPTH_TEST);else Re(e.DEPTH_TEST)},setMask:function(ee){if(Y!==ee&&!P)e.depthMask(ee),Y=ee},setFunc:function(ee){if(oe)ee=p_[ee];if(ae!==ee){switch(ee){case Gg:e.depthFunc(e.NEVER);break;case Hg:e.depthFunc(e.ALWAYS);break;case Vg:e.depthFunc(e.LESS);break;case Al:e.depthFunc(e.LEQUAL);break;case Wg:e.depthFunc(e.EQUAL);break;case $g:e.depthFunc(e.GEQUAL);break;case Zg:e.depthFunc(e.GREATER);break;case Xg:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}ae=ee}},setLocked:function(ee){P=ee},setClear:function(ee){if(ve!==ee){if(ve=ee,oe)ee=1-ee;e.clearDepth(ee)}},reset:function(){P=!1,Y=null,ae=null,ve=null,oe=!1}}}function r(){let P=!1,oe=null,Y=null,ae=null,ve=null,ee=null,ce=null,Fe=null,St=null;return{setTest:function(ft){if(!P)if(ft)de(e.STENCIL_TEST);else Re(e.STENCIL_TEST)},setMask:function(ft){if(oe!==ft&&!P)e.stencilMask(ft),oe=ft},setFunc:function(ft,kn,ni){if(Y!==ft||ae!==kn||ve!==ni)e.stencilFunc(ft,kn,ni),Y=ft,ae=kn,ve=ni},setOp:function(ft,kn,ni){if(ee!==ft||ce!==kn||Fe!==ni)e.stencilOp(ft,kn,ni),ee=ft,ce=kn,Fe=ni},setLocked:function(ft){P=ft},setClear:function(ft){if(St!==ft)e.clearStencil(ft),St=ft},reset:function(){P=!1,oe=null,Y=null,ae=null,ve=null,ee=null,ce=null,Fe=null,St=null}}}let s=new n,o=new i,a=new r,c=new WeakMap,l=new WeakMap,u={},f={},h={},d=new WeakMap,g=[],y=null,p=!1,m=null,A=null,T=null,v=null,w=null,E=null,R=null,_=new Le(0,0,0),S=0,F=!1,C=null,z=null,J=null,O=null,H=null,V=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),U=!1,K=0,Q=e.getParameter(e.VERSION);if(Q.indexOf("WebGL")!==-1)K=parseFloat(/^WebGL (\d)/.exec(Q)[1]),U=K>=1;else if(Q.indexOf("OpenGL ES")!==-1)K=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),U=K>=2;let se=null,me={},_e=e.getParameter(e.SCISSOR_BOX),qe=e.getParameter(e.VIEWPORT),Ge=new st().fromArray(_e),Z=new st().fromArray(qe);function ne(P,oe,Y,ae){let ve=new Uint8Array(4),ee=e.createTexture();e.bindTexture(P,ee),e.texParameteri(P,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(P,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let ce=0;ce<Y;ce++)if(P===e.TEXTURE_3D||P===e.TEXTURE_2D_ARRAY)e.texImage3D(oe,0,e.RGBA,1,1,ae,0,e.RGBA,e.UNSIGNED_BYTE,ve);else e.texImage2D(oe+ce,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,ve);return ee}let fe={};fe[e.TEXTURE_2D]=ne(e.TEXTURE_2D,e.TEXTURE_2D,1),fe[e.TEXTURE_CUBE_MAP]=ne(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),fe[e.TEXTURE_2D_ARRAY]=ne(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),fe[e.TEXTURE_3D]=ne(e.TEXTURE_3D,e.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),de(e.DEPTH_TEST),o.setFunc(Al),gn(!1),mt(Ml),de(e.CULL_FACE),Je(Yn);function de(P){if(u[P]!==!0)e.enable(P),u[P]=!0}function Re(P){if(u[P]!==!1)e.disable(P),u[P]=!1}function Ze(P,oe){if(h[P]!==oe){if(e.bindFramebuffer(P,oe),h[P]=oe,P===e.DRAW_FRAMEBUFFER)h[e.FRAMEBUFFER]=oe;if(P===e.FRAMEBUFFER)h[e.DRAW_FRAMEBUFFER]=oe;return!0}return!1}function Oe(P,oe){let Y=g,ae=!1;if(P){if(Y=d.get(oe),Y===void 0)Y=[],d.set(oe,Y);let ve=P.textures;if(Y.length!==ve.length||Y[0]!==e.COLOR_ATTACHMENT0){for(let ee=0,ce=ve.length;ee<ce;ee++)Y[ee]=e.COLOR_ATTACHMENT0+ee;Y.length=ve.length,ae=!0}}else if(Y[0]!==e.BACK)Y[0]=e.BACK,ae=!0;if(ae)e.drawBuffers(Y)}function ke(P){if(y!==P)return e.useProgram(P),y=P,!0;return!1}let Ke={[Xr]:e.FUNC_ADD,[Sg]:e.FUNC_SUBTRACT,[Mg]:e.FUNC_REVERSE_SUBTRACT};Ke[wg]=e.MIN,Ke[Tg]=e.MAX;let Ye={[Eg]:e.ZERO,[Ag]:e.ONE,[Rg]:e.SRC_COLOR,[Ig]:e.SRC_ALPHA,[Og]:e.SRC_ALPHA_SATURATE,[Dg]:e.DST_COLOR,[Lg]:e.DST_ALPHA,[Cg]:e.ONE_MINUS_SRC_COLOR,[Pg]:e.ONE_MINUS_SRC_ALPHA,[Ug]:e.ONE_MINUS_DST_COLOR,[Ng]:e.ONE_MINUS_DST_ALPHA,[Fg]:e.CONSTANT_COLOR,[zg]:e.ONE_MINUS_CONSTANT_COLOR,[kg]:e.CONSTANT_ALPHA,[Bg]:e.ONE_MINUS_CONSTANT_ALPHA};function Je(P,oe,Y,ae,ve,ee,ce,Fe,St,ft){if(P===Yn){if(p===!0)Re(e.BLEND),p=!1;return}if(p===!1)de(e.BLEND),p=!0;if(P!==bg){if(P!==m||ft!==F){if(A!==Xr||w!==Xr)e.blendEquation(e.FUNC_ADD),A=Xr,w=Xr;if(ft)switch(P){case Bs:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case wl:e.blendFunc(e.ONE,e.ONE);break;case Tl:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case El:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:Ne("WebGLState: Invalid blending: ",P);break}else switch(P){case Bs:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case wl:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case Tl:Ne("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case El:Ne("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ne("WebGLState: Invalid blending: ",P);break}T=null,v=null,E=null,R=null,_.set(0,0,0),S=0,m=P,F=ft}return}if(ve=ve||oe,ee=ee||Y,ce=ce||ae,oe!==A||ve!==w)e.blendEquationSeparate(Ke[oe],Ke[ve]),A=oe,w=ve;if(Y!==T||ae!==v||ee!==E||ce!==R)e.blendFuncSeparate(Ye[Y],Ye[ae],Ye[ee],Ye[ce]),T=Y,v=ae,E=ee,R=ce;if(Fe.equals(_)===!1||St!==S)e.blendColor(Fe.r,Fe.g,Fe.b,St),_.copy(Fe),S=St;m=P,F=!1}function Ft(P,oe){P.side===bn?Re(e.CULL_FACE):de(e.CULL_FACE);let Y=P.side===Yt;if(oe)Y=!Y;gn(Y),P.blending===Bs&&P.transparent===!1?Je(Yn):Je(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),o.setFunc(P.depthFunc),o.setTest(P.depthTest),o.setMask(P.depthWrite),s.setMask(P.colorWrite);let ae=P.stencilWrite;if(a.setTest(ae),ae)a.setMask(P.stencilWriteMask),a.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),a.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass);zt(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?de(e.SAMPLE_ALPHA_TO_COVERAGE):Re(e.SAMPLE_ALPHA_TO_COVERAGE)}function gn(P){if(C!==P){if(P)e.frontFace(e.CW);else e.frontFace(e.CCW);C=P}}function mt(P){if(P!==xg){if(de(e.CULL_FACE),P!==z)if(P===Ml)e.cullFace(e.BACK);else if(P===vg)e.cullFace(e.FRONT);else e.cullFace(e.FRONT_AND_BACK)}else Re(e.CULL_FACE);z=P}function Ht(P){if(P!==J){if(U)e.lineWidth(P);J=P}}function zt(P,oe,Y){if(P){if(de(e.POLYGON_OFFSET_FILL),O!==oe||H!==Y){if(O=oe,H=Y,o.getReversed())oe=-oe;e.polygonOffset(oe,Y)}}else Re(e.POLYGON_OFFSET_FILL)}function Pt(P){if(P)de(e.SCISSOR_TEST);else Re(e.SCISSOR_TEST)}function L(P){if(P===void 0)P=e.TEXTURE0+V-1;if(se!==P)e.activeTexture(P),se=P}function _n(P,oe,Y){if(Y===void 0)if(se===null)Y=e.TEXTURE0+V-1;else Y=se;let ae=me[Y];if(ae===void 0)ae={type:void 0,texture:void 0},me[Y]=ae;if(ae.type!==P||ae.texture!==oe){if(se!==Y)e.activeTexture(Y),se=Y;e.bindTexture(P,oe||fe[P]),ae.type=P,ae.texture=oe}}function nt(){let P=me[se];if(P!==void 0&&P.type!==void 0)e.bindTexture(P.type,null),P.type=void 0,P.texture=void 0}function gt(){try{e.compressedTexImage2D(...arguments)}catch(P){Ne("WebGLState:",P)}}function M(){try{e.compressedTexImage3D(...arguments)}catch(P){Ne("WebGLState:",P)}}function x(){try{e.texSubImage2D(...arguments)}catch(P){Ne("WebGLState:",P)}}function I(){try{e.texSubImage3D(...arguments)}catch(P){Ne("WebGLState:",P)}}function W(){try{e.compressedTexSubImage2D(...arguments)}catch(P){Ne("WebGLState:",P)}}function te(){try{e.compressedTexSubImage3D(...arguments)}catch(P){Ne("WebGLState:",P)}}function ie(){try{e.texStorage2D(...arguments)}catch(P){Ne("WebGLState:",P)}}function le(){try{e.texStorage3D(...arguments)}catch(P){Ne("WebGLState:",P)}}function X(){try{e.texImage2D(...arguments)}catch(P){Ne("WebGLState:",P)}}function j(){try{e.texImage3D(...arguments)}catch(P){Ne("WebGLState:",P)}}function xe(P){if(f[P]!==void 0)return f[P];else return e.getParameter(P)}function we(P,oe){if(f[P]!==oe)e.pixelStorei(P,oe),f[P]=oe}function ue(P){if(Ge.equals(P)===!1)e.scissor(P.x,P.y,P.z,P.w),Ge.copy(P)}function re(P){if(Z.equals(P)===!1)e.viewport(P.x,P.y,P.z,P.w),Z.copy(P)}function Ce(P,oe){let Y=l.get(oe);if(Y===void 0)Y=new WeakMap,l.set(oe,Y);let ae=Y.get(P);if(ae===void 0)ae=e.getUniformBlockIndex(oe,P.name),Y.set(P,ae)}function Pe(P,oe){let ae=l.get(oe).get(P);if(c.get(oe)!==ae)e.uniformBlockBinding(oe,ae,P.__bindingPointIndex),c.set(oe,ae)}function et(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},f={},se=null,me={},h={},d=new WeakMap,g=[],y=null,p=!1,m=null,A=null,T=null,v=null,w=null,E=null,R=null,_=new Le(0,0,0),S=0,F=!1,C=null,z=null,J=null,O=null,H=null,Ge.set(0,0,e.canvas.width,e.canvas.height),Z.set(0,0,e.canvas.width,e.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:de,disable:Re,bindFramebuffer:Ze,drawBuffers:Oe,useProgram:ke,setBlending:Je,setMaterial:Ft,setFlipSided:gn,setCullFace:mt,setLineWidth:Ht,setPolygonOffset:zt,setScissorTest:Pt,activeTexture:L,bindTexture:_n,unbindTexture:nt,compressedTexImage2D:gt,compressedTexImage3D:M,texImage2D:X,texImage3D:j,pixelStorei:we,getParameter:xe,updateUBOMapping:Ce,uniformBlockBinding:Pe,texStorage2D:ie,texStorage3D:le,texSubImage2D:x,texSubImage3D:I,compressedTexSubImage2D:W,compressedTexSubImage3D:te,scissor:ue,viewport:re,reset:et}}function CT(e,t,n,i,r,s,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Ie,u=new WeakMap,f=new Set,h,d=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch(M){}function y(M,x){return g?new OffscreenCanvas(M,x):Vr("canvas")}function p(M,x,I){let W=1,te=gt(M);if(te.width>I||te.height>I)W=I/Math.max(te.width,te.height);if(W<1)if(typeof HTMLImageElement<"u"&&M instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&M instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&M instanceof ImageBitmap||typeof VideoFrame<"u"&&M instanceof VideoFrame){let ie=Math.floor(W*te.width),le=Math.floor(W*te.height);if(h===void 0)h=y(ie,le);let X=x?y(ie,le):h;return X.width=ie,X.height=le,X.getContext("2d").drawImage(M,0,0,ie,le),Me("WebGLRenderer: Texture has been resized from ("+te.width+"x"+te.height+") to ("+ie+"x"+le+")."),X}else{if("data"in M)Me("WebGLRenderer: Image in DataTexture is too big ("+te.width+"x"+te.height+").");return M}return M}function m(M){return M.generateMipmaps}function A(M){e.generateMipmap(M)}function T(M){if(M.isWebGLCubeRenderTarget)return e.TEXTURE_CUBE_MAP;if(M.isWebGL3DRenderTarget)return e.TEXTURE_3D;if(M.isWebGLArrayRenderTarget||M.isCompressedArrayTexture)return e.TEXTURE_2D_ARRAY;return e.TEXTURE_2D}function v(M,x,I,W,te,ie=!1){if(M!==null){if(e[M]!==void 0)return e[M];Me("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+M+"'")}let le;if(W){if(le=t.get("EXT_texture_norm16"),!le)Me("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension")}let X=x;if(x===e.RED){if(I===e.FLOAT)X=e.R32F;if(I===e.HALF_FLOAT)X=e.R16F;if(I===e.UNSIGNED_BYTE)X=e.R8;if(I===e.UNSIGNED_SHORT&&le)X=le.R16_EXT;if(I===e.SHORT&&le)X=le.R16_SNORM_EXT}if(x===e.RED_INTEGER){if(I===e.UNSIGNED_BYTE)X=e.R8UI;if(I===e.UNSIGNED_SHORT)X=e.R16UI;if(I===e.UNSIGNED_INT)X=e.R32UI;if(I===e.BYTE)X=e.R8I;if(I===e.SHORT)X=e.R16I;if(I===e.INT)X=e.R32I}if(x===e.RG){if(I===e.FLOAT)X=e.RG32F;if(I===e.HALF_FLOAT)X=e.RG16F;if(I===e.UNSIGNED_BYTE)X=e.RG8;if(I===e.UNSIGNED_SHORT&&le)X=le.RG16_EXT;if(I===e.SHORT&&le)X=le.RG16_SNORM_EXT}if(x===e.RG_INTEGER){if(I===e.UNSIGNED_BYTE)X=e.RG8UI;if(I===e.UNSIGNED_SHORT)X=e.RG16UI;if(I===e.UNSIGNED_INT)X=e.RG32UI;if(I===e.BYTE)X=e.RG8I;if(I===e.SHORT)X=e.RG16I;if(I===e.INT)X=e.RG32I}if(x===e.RGB_INTEGER){if(I===e.UNSIGNED_BYTE)X=e.RGB8UI;if(I===e.UNSIGNED_SHORT)X=e.RGB16UI;if(I===e.UNSIGNED_INT)X=e.RGB32UI;if(I===e.BYTE)X=e.RGB8I;if(I===e.SHORT)X=e.RGB16I;if(I===e.INT)X=e.RGB32I}if(x===e.RGBA_INTEGER){if(I===e.UNSIGNED_BYTE)X=e.RGBA8UI;if(I===e.UNSIGNED_SHORT)X=e.RGBA16UI;if(I===e.UNSIGNED_INT)X=e.RGBA32UI;if(I===e.BYTE)X=e.RGBA8I;if(I===e.SHORT)X=e.RGBA16I;if(I===e.INT)X=e.RGBA32I}if(x===e.RGB){if(I===e.UNSIGNED_SHORT&&le)X=le.RGB16_EXT;if(I===e.SHORT&&le)X=le.RGB16_SNORM_EXT;if(I===e.UNSIGNED_INT_5_9_9_9_REV)X=e.RGB9_E5;if(I===e.UNSIGNED_INT_10F_11F_11F_REV)X=e.R11F_G11F_B10F}if(x===e.RGBA){let j=ie?vu:We.getTransfer(te);if(I===e.FLOAT)X=e.RGBA32F;if(I===e.HALF_FLOAT)X=e.RGBA16F;if(I===e.UNSIGNED_BYTE)X=j===ht?e.SRGB8_ALPHA8:e.RGBA8;if(I===e.UNSIGNED_SHORT&&le)X=le.RGBA16_EXT;if(I===e.SHORT&&le)X=le.RGBA16_SNORM_EXT;if(I===e.UNSIGNED_SHORT_4_4_4_4)X=e.RGBA4;if(I===e.UNSIGNED_SHORT_5_5_5_1)X=e.RGB5_A1}if(X===e.R16F||X===e.R32F||X===e.RG16F||X===e.RG32F||X===e.RGBA16F||X===e.RGBA32F)t.get("EXT_color_buffer_float");return X}function w(M,x){let I;if(M){if(x===null||x===Oi||x===Kr)I=e.DEPTH24_STENCIL8;else if(x===di)I=e.DEPTH32F_STENCIL8;else if(x===Vs)I=e.DEPTH24_STENCIL8,Me("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")}else if(x===null||x===Oi||x===Kr)I=e.DEPTH_COMPONENT24;else if(x===di)I=e.DEPTH_COMPONENT32F;else if(x===Vs)I=e.DEPTH_COMPONENT16;return I}function E(M,x){if(m(M)===!0||M.isFramebufferTexture&&M.minFilter!==On&&M.minFilter!==Gt)return Math.log2(Math.max(x.width,x.height))+1;else if(M.mipmaps!==void 0&&M.mipmaps.length>0)return M.mipmaps.length;else if(M.isCompressedTexture&&Array.isArray(M.image))return x.mipmaps.length;else return 1}function R(M){let x=M.target;if(x.removeEventListener("dispose",R),S(x),x.isVideoTexture)u.delete(x);if(x.isHTMLTexture)f.delete(x)}function _(M){let x=M.target;x.removeEventListener("dispose",_),C(x)}function S(M){let x=i.get(M);if(x.__webglInit===void 0)return;let I=M.source,W=d.get(I);if(W){let te=W[x.__cacheKey];if(te.usedTimes--,te.usedTimes===0)F(M);if(Object.keys(W).length===0)d.delete(I)}i.remove(M)}function F(M){let x=i.get(M);e.deleteTexture(x.__webglTexture);let I=M.source,W=d.get(I);delete W[x.__cacheKey],o.memory.textures--}function C(M){let x=i.get(M);if(M.depthTexture)M.depthTexture.dispose(),i.remove(M.depthTexture);if(M.isWebGLCubeRenderTarget)for(let W=0;W<6;W++){if(Array.isArray(x.__webglFramebuffer[W]))for(let te=0;te<x.__webglFramebuffer[W].length;te++)e.deleteFramebuffer(x.__webglFramebuffer[W][te]);else e.deleteFramebuffer(x.__webglFramebuffer[W]);if(x.__webglDepthbuffer)e.deleteRenderbuffer(x.__webglDepthbuffer[W])}else{if(Array.isArray(x.__webglFramebuffer))for(let W=0;W<x.__webglFramebuffer.length;W++)e.deleteFramebuffer(x.__webglFramebuffer[W]);else e.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer)e.deleteRenderbuffer(x.__webglDepthbuffer);if(x.__webglMultisampledFramebuffer)e.deleteFramebuffer(x.__webglMultisampledFramebuffer);if(x.__webglColorRenderbuffer){for(let W=0;W<x.__webglColorRenderbuffer.length;W++)if(x.__webglColorRenderbuffer[W])e.deleteRenderbuffer(x.__webglColorRenderbuffer[W])}if(x.__webglDepthRenderbuffer)e.deleteRenderbuffer(x.__webglDepthRenderbuffer)}let I=M.textures;for(let W=0,te=I.length;W<te;W++){let ie=i.get(I[W]);if(ie.__webglTexture)e.deleteTexture(ie.__webglTexture),o.memory.textures--;i.remove(I[W])}i.remove(M)}let z=0;function J(){z=0}function O(){return z}function H(M){z=M}function V(){let M=z;if(M>=r.maxTextures)Me("WebGLTextures: Trying to use "+M+" texture units while this GPU supports only "+r.maxTextures);return z+=1,M}function U(M){let x=[];return x.push(M.wrapS),x.push(M.wrapT),x.push(M.wrapR||0),x.push(M.magFilter),x.push(M.minFilter),x.push(M.anisotropy),x.push(M.internalFormat),x.push(M.format),x.push(M.type),x.push(M.generateMipmaps),x.push(M.premultiplyAlpha),x.push(M.flipY),x.push(M.unpackAlignment),x.push(M.colorSpace),x.join()}function K(M,x){let I=i.get(M);if(M.isVideoTexture)_n(M);if(M.isRenderTargetTexture===!1&&M.isExternalTexture!==!0&&M.version>0&&I.__version!==M.version){let W=M.image;if(W===null)Me("WebGLRenderer: Texture marked for update but no image data found.");else if(W.complete===!1)Me("WebGLRenderer: Texture marked for update but image is incomplete");else{Re(I,M,x);return}}else if(M.isExternalTexture)I.__webglTexture=M.sourceTexture?M.sourceTexture:null;n.bindTexture(e.TEXTURE_2D,I.__webglTexture,e.TEXTURE0+x)}function Q(M,x){let I=i.get(M);if(M.isRenderTargetTexture===!1&&M.version>0&&I.__version!==M.version){Re(I,M,x);return}else if(M.isExternalTexture)I.__webglTexture=M.sourceTexture?M.sourceTexture:null;n.bindTexture(e.TEXTURE_2D_ARRAY,I.__webglTexture,e.TEXTURE0+x)}function se(M,x){let I=i.get(M);if(M.isRenderTargetTexture===!1&&M.version>0&&I.__version!==M.version){Re(I,M,x);return}n.bindTexture(e.TEXTURE_3D,I.__webglTexture,e.TEXTURE0+x)}function me(M,x){let I=i.get(M);if(M.isCubeDepthTexture!==!0&&M.version>0&&I.__version!==M.version){Ze(I,M,x);return}n.bindTexture(e.TEXTURE_CUBE_MAP,I.__webglTexture,e.TEXTURE0+x)}let _e={[Yr]:e.REPEAT,[jr]:e.CLAMP_TO_EDGE,[xa]:e.MIRRORED_REPEAT},qe={[On]:e.NEAREST,[va]:e.NEAREST_MIPMAP_NEAREST,[hr]:e.NEAREST_MIPMAP_LINEAR,[Gt]:e.LINEAR,[Jr]:e.LINEAR_MIPMAP_NEAREST,[jn]:e.LINEAR_MIPMAP_LINEAR},Ge={[s_]:e.NEVER,[u_]:e.ALWAYS,[o_]:e.LESS,[Aa]:e.LEQUAL,[a_]:e.EQUAL,[Ra]:e.GEQUAL,[c_]:e.GREATER,[l_]:e.NOTEQUAL};function Z(M,x){if(x.type===di&&t.has("OES_texture_float_linear")===!1&&(x.magFilter===Gt||x.magFilter===Jr||x.magFilter===hr||x.magFilter===jn||x.minFilter===Gt||x.minFilter===Jr||x.minFilter===hr||x.minFilter===jn))Me("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.");if(e.texParameteri(M,e.TEXTURE_WRAP_S,_e[x.wrapS]),e.texParameteri(M,e.TEXTURE_WRAP_T,_e[x.wrapT]),M===e.TEXTURE_3D||M===e.TEXTURE_2D_ARRAY)e.texParameteri(M,e.TEXTURE_WRAP_R,_e[x.wrapR]);if(e.texParameteri(M,e.TEXTURE_MAG_FILTER,qe[x.magFilter]),e.texParameteri(M,e.TEXTURE_MIN_FILTER,qe[x.minFilter]),x.compareFunction)e.texParameteri(M,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(M,e.TEXTURE_COMPARE_FUNC,Ge[x.compareFunction]);if(t.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===On)return;if(x.minFilter!==hr&&x.minFilter!==jn)return;if(x.type===di&&t.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||i.get(x).__currentAnisotropy){let I=t.get("EXT_texture_filter_anisotropic");e.texParameterf(M,I.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,r.getMaxAnisotropy())),i.get(x).__currentAnisotropy=x.anisotropy}}}function ne(M,x){let I=!1;if(M.__webglInit===void 0)M.__webglInit=!0,x.addEventListener("dispose",R);let W=x.source,te=d.get(W);if(te===void 0)te={},d.set(W,te);let ie=U(x);if(ie!==M.__cacheKey){if(te[ie]===void 0)te[ie]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,I=!0;te[ie].usedTimes++;let le=te[M.__cacheKey];if(le!==void 0){if(te[M.__cacheKey].usedTimes--,le.usedTimes===0)F(x)}M.__cacheKey=ie,M.__webglTexture=te[ie].texture}return I}function fe(M,x,I){return Math.floor(Math.floor(M/I)/x)}function de(M,x,I,W){let ie=M.updateRanges;if(ie.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,x.width,x.height,I,W,x.data);else{ie.sort((we,ue)=>we.start-ue.start);let le=0;for(let we=1;we<ie.length;we++){let ue=ie[le],re=ie[we],Ce=ue.start+ue.count,Pe=fe(re.start,x.width,4),et=fe(ue.start,x.width,4);if(re.start<=Ce+1&&Pe===et&&fe(re.start+re.count-1,x.width,4)===Pe)ue.count=Math.max(ue.count,re.start+re.count-ue.start);else++le,ie[le]=re}ie.length=le+1;let X=n.getParameter(e.UNPACK_ROW_LENGTH),j=n.getParameter(e.UNPACK_SKIP_PIXELS),xe=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,x.width);for(let we=0,ue=ie.length;we<ue;we++){let re=ie[we],Ce=Math.floor(re.start/4),Pe=Math.ceil(re.count/4),et=Ce%x.width,P=Math.floor(Ce/x.width),oe=Pe,Y=1;n.pixelStorei(e.UNPACK_SKIP_PIXELS,et),n.pixelStorei(e.UNPACK_SKIP_ROWS,P),n.texSubImage2D(e.TEXTURE_2D,0,et,P,oe,1,I,W,x.data)}M.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,X),n.pixelStorei(e.UNPACK_SKIP_PIXELS,j),n.pixelStorei(e.UNPACK_SKIP_ROWS,xe)}}function Re(M,x,I){let W=e.TEXTURE_2D;if(x.isDataArrayTexture||x.isCompressedArrayTexture)W=e.TEXTURE_2D_ARRAY;if(x.isData3DTexture)W=e.TEXTURE_3D;let te=ne(M,x),ie=x.source;n.bindTexture(W,M.__webglTexture,e.TEXTURE0+I);let le=i.get(ie);if(ie.version!==le.__version||te===!0){if(n.activeTexture(e.TEXTURE0+I),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){let Y=We.getPrimaries(We.workingColorSpace),ae=x.colorSpace===mr?null:We.getPrimaries(x.colorSpace),ve=x.colorSpace===mr||Y===ae?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,x.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,ve)}n.pixelStorei(e.UNPACK_ALIGNMENT,x.unpackAlignment);let j=p(x.image,!1,r.maxTextureSize);j=nt(x,j);let xe=s.convert(x.format,x.colorSpace),we=s.convert(x.type),ue=v(x.internalFormat,xe,we,x.normalized,x.colorSpace,x.isVideoTexture);Z(W,x);let re,Ce=x.mipmaps,Pe=x.isVideoTexture!==!0,et=le.__version===void 0||te===!0,P=ie.dataReady,oe=E(x,j);if(x.isDepthTexture){if(ue=w(x.format===dr,x.type),et)if(Pe)n.texStorage2D(e.TEXTURE_2D,1,ue,j.width,j.height);else n.texImage2D(e.TEXTURE_2D,0,ue,j.width,j.height,0,xe,we,null)}else if(x.isDataTexture)if(Ce.length>0){if(Pe&&et)n.texStorage2D(e.TEXTURE_2D,oe,ue,Ce[0].width,Ce[0].height);for(let Y=0,ae=Ce.length;Y<ae;Y++)if(re=Ce[Y],Pe){if(P)n.texSubImage2D(e.TEXTURE_2D,Y,0,0,re.width,re.height,xe,we,re.data)}else n.texImage2D(e.TEXTURE_2D,Y,ue,re.width,re.height,0,xe,we,re.data);x.generateMipmaps=!1}else if(Pe){if(et)n.texStorage2D(e.TEXTURE_2D,oe,ue,j.width,j.height);if(P)de(x,j,xe,we)}else n.texImage2D(e.TEXTURE_2D,0,ue,j.width,j.height,0,xe,we,j.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){if(Pe&&et)n.texStorage3D(e.TEXTURE_2D_ARRAY,oe,ue,Ce[0].width,Ce[0].height,j.depth);for(let Y=0,ae=Ce.length;Y<ae;Y++)if(re=Ce[Y],x.format!==Jn)if(xe!==null)if(Pe){if(P)if(x.layerUpdates.size>0){let ve=Vu(re.width,re.height,x.format,x.type);for(let ee of x.layerUpdates){let ce=re.data.subarray(ee*ve/re.data.BYTES_PER_ELEMENT,(ee+1)*ve/re.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Y,0,0,ee,re.width,re.height,1,xe,ce)}x.clearLayerUpdates()}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Y,0,0,0,re.width,re.height,j.depth,xe,re.data)}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,Y,ue,re.width,re.height,j.depth,0,re.data,0,0);else Me("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(Pe){if(P)n.texSubImage3D(e.TEXTURE_2D_ARRAY,Y,0,0,0,re.width,re.height,j.depth,xe,we,re.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,Y,ue,re.width,re.height,j.depth,0,xe,we,re.data)}else{if(Pe&&et)n.texStorage2D(e.TEXTURE_2D,oe,ue,Ce[0].width,Ce[0].height);for(let Y=0,ae=Ce.length;Y<ae;Y++)if(re=Ce[Y],x.format!==Jn)if(xe!==null)if(Pe){if(P)n.compressedTexSubImage2D(e.TEXTURE_2D,Y,0,0,re.width,re.height,xe,re.data)}else n.compressedTexImage2D(e.TEXTURE_2D,Y,ue,re.width,re.height,0,re.data);else Me("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(Pe){if(P)n.texSubImage2D(e.TEXTURE_2D,Y,0,0,re.width,re.height,xe,we,re.data)}else n.texImage2D(e.TEXTURE_2D,Y,ue,re.width,re.height,0,xe,we,re.data)}else if(x.isDataArrayTexture)if(Pe){if(et)n.texStorage3D(e.TEXTURE_2D_ARRAY,oe,ue,j.width,j.height,j.depth);if(P)if(x.layerUpdates.size>0){let Y=Vu(j.width,j.height,x.format,x.type);for(let ae of x.layerUpdates){let ve=j.data.subarray(ae*Y/j.data.BYTES_PER_ELEMENT,(ae+1)*Y/j.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,ae,j.width,j.height,1,xe,we,ve)}x.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,j.width,j.height,j.depth,xe,we,j.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,ue,j.width,j.height,j.depth,0,xe,we,j.data);else if(x.isData3DTexture)if(Pe){if(et)n.texStorage3D(e.TEXTURE_3D,oe,ue,j.width,j.height,j.depth);if(P)n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,j.width,j.height,j.depth,xe,we,j.data)}else n.texImage3D(e.TEXTURE_3D,0,ue,j.width,j.height,j.depth,0,xe,we,j.data);else if(x.isFramebufferTexture){if(et)if(Pe)n.texStorage2D(e.TEXTURE_2D,oe,ue,j.width,j.height);else{let Y=j.width,ae=j.height;for(let ve=0;ve<oe;ve++)n.texImage2D(e.TEXTURE_2D,ve,ue,Y,ae,0,xe,we,null),Y>>=1,ae>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in e){let Y=e.canvas;if(!Y.hasAttribute("layoutsubtree"))Y.setAttribute("layoutsubtree","true");if(j.parentNode!==Y){Y.appendChild(j),f.add(x),Y.onpaint=(ae)=>{let ve=ae.changedElements;for(let ee of f)if(ve.includes(ee.image))ee.needsUpdate=!0},Y.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,j);else{let{RGBA:ve,RGBA:ee,UNSIGNED_BYTE:ce}=e;e.texElementImage2D(e.TEXTURE_2D,0,ve,ee,ce,j)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(Ce.length>0){if(Pe&&et){let Y=gt(Ce[0]);n.texStorage2D(e.TEXTURE_2D,oe,ue,Y.width,Y.height)}for(let Y=0,ae=Ce.length;Y<ae;Y++)if(re=Ce[Y],Pe){if(P)n.texSubImage2D(e.TEXTURE_2D,Y,0,0,xe,we,re)}else n.texImage2D(e.TEXTURE_2D,Y,ue,xe,we,re);x.generateMipmaps=!1}else if(Pe){if(et){let Y=gt(j);n.texStorage2D(e.TEXTURE_2D,oe,ue,Y.width,Y.height)}if(P)n.texSubImage2D(e.TEXTURE_2D,0,0,0,xe,we,j)}else n.texImage2D(e.TEXTURE_2D,0,ue,xe,we,j);if(m(x))A(W);if(le.__version=ie.version,x.onUpdate)x.onUpdate(x)}M.__version=x.version}function Ze(M,x,I){if(x.image.length!==6)return;let W=ne(M,x),te=x.source;n.bindTexture(e.TEXTURE_CUBE_MAP,M.__webglTexture,e.TEXTURE0+I);let ie=i.get(te);if(te.version!==ie.__version||W===!0){n.activeTexture(e.TEXTURE0+I);let le=We.getPrimaries(We.workingColorSpace),X=x.colorSpace===mr?null:We.getPrimaries(x.colorSpace),j=x.colorSpace===mr||le===X?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,x.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,x.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,j);let xe=x.isCompressedTexture||x.image[0].isCompressedTexture,we=x.image[0]&&x.image[0].isDataTexture,ue=[];for(let ee=0;ee<6;ee++){if(!xe&&!we)ue[ee]=p(x.image[ee],!0,r.maxCubemapSize);else ue[ee]=we?x.image[ee].image:x.image[ee];ue[ee]=nt(x,ue[ee])}let re=ue[0],Ce=s.convert(x.format,x.colorSpace),Pe=s.convert(x.type),et=v(x.internalFormat,Ce,Pe,x.normalized,x.colorSpace),P=x.isVideoTexture!==!0,oe=ie.__version===void 0||W===!0,Y=te.dataReady,ae=E(x,re);Z(e.TEXTURE_CUBE_MAP,x);let ve;if(xe){if(P&&oe)n.texStorage2D(e.TEXTURE_CUBE_MAP,ae,et,re.width,re.height);for(let ee=0;ee<6;ee++){ve=ue[ee].mipmaps;for(let ce=0;ce<ve.length;ce++){let Fe=ve[ce];if(x.format!==Jn)if(Ce!==null)if(P){if(Y)n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce,0,0,Fe.width,Fe.height,Ce,Fe.data)}else n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce,et,Fe.width,Fe.height,0,Fe.data);else Me("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()");else if(P){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce,0,0,Fe.width,Fe.height,Ce,Pe,Fe.data)}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce,et,Fe.width,Fe.height,0,Ce,Pe,Fe.data)}}}else{if(ve=x.mipmaps,P&&oe){if(ve.length>0)ae++;let ee=gt(ue[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,ae,et,ee.width,ee.height)}for(let ee=0;ee<6;ee++)if(we){if(P){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,ue[ee].width,ue[ee].height,Ce,Pe,ue[ee].data)}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,et,ue[ee].width,ue[ee].height,0,Ce,Pe,ue[ee].data);for(let ce=0;ce<ve.length;ce++){let St=ve[ce].image[ee].image;if(P){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce+1,0,0,St.width,St.height,Ce,Pe,St.data)}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce+1,et,St.width,St.height,0,Ce,Pe,St.data)}}else{if(P){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,Ce,Pe,ue[ee])}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,et,Ce,Pe,ue[ee]);for(let ce=0;ce<ve.length;ce++){let Fe=ve[ce];if(P){if(Y)n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce+1,0,0,Ce,Pe,Fe.image[ee])}else n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ce+1,et,Ce,Pe,Fe.image[ee])}}}if(m(x))A(e.TEXTURE_CUBE_MAP);if(ie.__version=te.version,x.onUpdate)x.onUpdate(x)}M.__version=x.version}function Oe(M,x,I,W,te,ie){let le=s.convert(I.format,I.colorSpace),X=s.convert(I.type),j=v(I.internalFormat,le,X,I.normalized,I.colorSpace),xe=i.get(x),we=i.get(I);if(we.__renderTarget=x,!xe.__hasExternalTextures){let ue=Math.max(1,x.width>>ie),re=Math.max(1,x.height>>ie);if(te===e.TEXTURE_3D||te===e.TEXTURE_2D_ARRAY)n.texImage3D(te,ie,j,ue,re,x.depth,0,le,X,null);else n.texImage2D(te,ie,j,ue,re,0,le,X,null)}if(n.bindFramebuffer(e.FRAMEBUFFER,M),L(x))a.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,W,te,we.__webglTexture,0,Pt(x));else if(te===e.TEXTURE_2D||te>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&te<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)e.framebufferTexture2D(e.FRAMEBUFFER,W,te,we.__webglTexture,ie);n.bindFramebuffer(e.FRAMEBUFFER,null)}function ke(M,x,I){if(e.bindRenderbuffer(e.RENDERBUFFER,M),x.depthBuffer){let W=x.depthTexture,te=W&&W.isDepthTexture?W.type:null,ie=w(x.stencilBuffer,te),le=x.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(L(x))a.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Pt(x),ie,x.width,x.height);else if(I)e.renderbufferStorageMultisample(e.RENDERBUFFER,Pt(x),ie,x.width,x.height);else e.renderbufferStorage(e.RENDERBUFFER,ie,x.width,x.height);e.framebufferRenderbuffer(e.FRAMEBUFFER,le,e.RENDERBUFFER,M)}else{let W=x.textures;for(let te=0;te<W.length;te++){let ie=W[te],le=s.convert(ie.format,ie.colorSpace),X=s.convert(ie.type),j=v(ie.internalFormat,le,X,ie.normalized,ie.colorSpace);if(L(x))a.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Pt(x),j,x.width,x.height);else if(I)e.renderbufferStorageMultisample(e.RENDERBUFFER,Pt(x),j,x.width,x.height);else e.renderbufferStorage(e.RENDERBUFFER,j,x.width,x.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Ke(M,x,I){let W=x.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,M),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let te=i.get(x.depthTexture);if(te.__renderTarget=x,!te.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0;if(W){if(te.__webglInit===void 0)te.__webglInit=!0,x.depthTexture.addEventListener("dispose",R);if(te.__webglTexture===void 0){te.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,te.__webglTexture),Z(e.TEXTURE_CUBE_MAP,x.depthTexture);let xe=s.convert(x.depthTexture.format),we=s.convert(x.depthTexture.type),ue;if(x.depthTexture.format===fr)ue=e.DEPTH_COMPONENT24;else if(x.depthTexture.format===dr)ue=e.DEPTH24_STENCIL8;for(let re=0;re<6;re++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+re,0,ue,x.width,x.height,0,xe,we,null)}}else K(x.depthTexture,0);let ie=te.__webglTexture,le=Pt(x),X=W?e.TEXTURE_CUBE_MAP_POSITIVE_X+I:e.TEXTURE_2D,j=x.depthTexture.format===dr?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(x.depthTexture.format===fr)if(L(x))a.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,j,X,ie,0,le);else e.framebufferTexture2D(e.FRAMEBUFFER,j,X,ie,0);else if(x.depthTexture.format===dr)if(L(x))a.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,j,X,ie,0,le);else e.framebufferTexture2D(e.FRAMEBUFFER,j,X,ie,0);else throw Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ye(M){let x=i.get(M),I=M.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==M.depthTexture){let W=M.depthTexture;if(x.__depthDisposeCallback)x.__depthDisposeCallback();if(W){let te=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,W.removeEventListener("dispose",te)};W.addEventListener("dispose",te),x.__depthDisposeCallback=te}x.__boundDepthTexture=W}if(M.depthTexture&&!x.__autoAllocateDepthBuffer)if(I)for(let W=0;W<6;W++)Ke(x.__webglFramebuffer[W],M,W);else{let W=M.texture.mipmaps;if(W&&W.length>0)Ke(x.__webglFramebuffer[0],M,0);else Ke(x.__webglFramebuffer,M,0)}else if(I){x.__webglDepthbuffer=[];for(let W=0;W<6;W++)if(n.bindFramebuffer(e.FRAMEBUFFER,x.__webglFramebuffer[W]),x.__webglDepthbuffer[W]===void 0)x.__webglDepthbuffer[W]=e.createRenderbuffer(),ke(x.__webglDepthbuffer[W],M,!1);else{let te=M.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ie=x.__webglDepthbuffer[W];e.bindRenderbuffer(e.RENDERBUFFER,ie),e.framebufferRenderbuffer(e.FRAMEBUFFER,te,e.RENDERBUFFER,ie)}}else{let W=M.texture.mipmaps;if(W&&W.length>0)n.bindFramebuffer(e.FRAMEBUFFER,x.__webglFramebuffer[0]);else n.bindFramebuffer(e.FRAMEBUFFER,x.__webglFramebuffer);if(x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=e.createRenderbuffer(),ke(x.__webglDepthbuffer,M,!1);else{let te=M.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ie=x.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,ie),e.framebufferRenderbuffer(e.FRAMEBUFFER,te,e.RENDERBUFFER,ie)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function Je(M,x,I){let W=i.get(M);if(x!==void 0)Oe(W.__webglFramebuffer,M,M.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0);if(I!==void 0)Ye(M)}function Ft(M){let x=M.texture,I=i.get(M),W=i.get(x);M.addEventListener("dispose",_);let te=M.textures,ie=M.isWebGLCubeRenderTarget===!0,le=te.length>1;if(!le){if(W.__webglTexture===void 0)W.__webglTexture=e.createTexture();W.__version=x.version,o.memory.textures++}if(ie){I.__webglFramebuffer=[];for(let X=0;X<6;X++)if(x.mipmaps&&x.mipmaps.length>0){I.__webglFramebuffer[X]=[];for(let j=0;j<x.mipmaps.length;j++)I.__webglFramebuffer[X][j]=e.createFramebuffer()}else I.__webglFramebuffer[X]=e.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){I.__webglFramebuffer=[];for(let X=0;X<x.mipmaps.length;X++)I.__webglFramebuffer[X]=e.createFramebuffer()}else I.__webglFramebuffer=e.createFramebuffer();if(le)for(let X=0,j=te.length;X<j;X++){let xe=i.get(te[X]);if(xe.__webglTexture===void 0)xe.__webglTexture=e.createTexture(),o.memory.textures++}if(M.samples>0&&L(M)===!1){I.__webglMultisampledFramebuffer=e.createFramebuffer(),I.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,I.__webglMultisampledFramebuffer);for(let X=0;X<te.length;X++){let j=te[X];I.__webglColorRenderbuffer[X]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,I.__webglColorRenderbuffer[X]);let xe=s.convert(j.format,j.colorSpace),we=s.convert(j.type),ue=v(j.internalFormat,xe,we,j.normalized,j.colorSpace,M.isXRRenderTarget===!0),re=Pt(M);e.renderbufferStorageMultisample(e.RENDERBUFFER,re,ue,M.width,M.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+X,e.RENDERBUFFER,I.__webglColorRenderbuffer[X])}if(e.bindRenderbuffer(e.RENDERBUFFER,null),M.depthBuffer)I.__webglDepthRenderbuffer=e.createRenderbuffer(),ke(I.__webglDepthRenderbuffer,M,!0);n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(ie){n.bindTexture(e.TEXTURE_CUBE_MAP,W.__webglTexture),Z(e.TEXTURE_CUBE_MAP,x);for(let X=0;X<6;X++)if(x.mipmaps&&x.mipmaps.length>0)for(let j=0;j<x.mipmaps.length;j++)Oe(I.__webglFramebuffer[X][j],M,x,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+X,j);else Oe(I.__webglFramebuffer[X],M,x,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+X,0);if(m(x))A(e.TEXTURE_CUBE_MAP);n.unbindTexture()}else if(le){for(let X=0,j=te.length;X<j;X++){let xe=te[X],we=i.get(xe),ue=e.TEXTURE_2D;if(M.isWebGL3DRenderTarget||M.isWebGLArrayRenderTarget)ue=M.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY;if(n.bindTexture(ue,we.__webglTexture),Z(ue,xe),Oe(I.__webglFramebuffer,M,xe,e.COLOR_ATTACHMENT0+X,ue,0),m(xe))A(ue)}n.unbindTexture()}else{let X=e.TEXTURE_2D;if(M.isWebGL3DRenderTarget||M.isWebGLArrayRenderTarget)X=M.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY;if(n.bindTexture(X,W.__webglTexture),Z(X,x),x.mipmaps&&x.mipmaps.length>0)for(let j=0;j<x.mipmaps.length;j++)Oe(I.__webglFramebuffer[j],M,x,e.COLOR_ATTACHMENT0,X,j);else Oe(I.__webglFramebuffer,M,x,e.COLOR_ATTACHMENT0,X,0);if(m(x))A(X);n.unbindTexture()}if(M.depthBuffer)Ye(M)}function gn(M){let x=M.textures;for(let I=0,W=x.length;I<W;I++){let te=x[I];if(m(te)){let ie=T(M),le=i.get(te).__webglTexture;n.bindTexture(ie,le),A(ie),n.unbindTexture()}}}let mt=[],Ht=[];function zt(M){if(M.samples>0){if(L(M)===!1){let{textures:x,width:I,height:W}=M,te=e.COLOR_BUFFER_BIT,ie=M.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,le=i.get(M),X=x.length>1;if(X)for(let xe=0;xe<x.length;xe++)n.bindFramebuffer(e.FRAMEBUFFER,le.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+xe,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,le.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+xe,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,le.__webglMultisampledFramebuffer);let j=M.texture.mipmaps;if(j&&j.length>0)n.bindFramebuffer(e.DRAW_FRAMEBUFFER,le.__webglFramebuffer[0]);else n.bindFramebuffer(e.DRAW_FRAMEBUFFER,le.__webglFramebuffer);for(let xe=0;xe<x.length;xe++){if(M.resolveDepthBuffer){if(M.depthBuffer)te|=e.DEPTH_BUFFER_BIT;if(M.stencilBuffer&&M.resolveStencilBuffer)te|=e.STENCIL_BUFFER_BIT}if(X){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,le.__webglColorRenderbuffer[xe]);let we=i.get(x[xe]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,we,0)}if(e.blitFramebuffer(0,0,I,W,0,0,I,W,te,e.NEAREST),c===!0){if(mt.length=0,Ht.length=0,mt.push(e.COLOR_ATTACHMENT0+xe),M.depthBuffer&&M.resolveDepthBuffer===!1)mt.push(ie),Ht.push(ie),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,Ht);e.invalidateFramebuffer(e.READ_FRAMEBUFFER,mt)}}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),X)for(let xe=0;xe<x.length;xe++){n.bindFramebuffer(e.FRAMEBUFFER,le.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+xe,e.RENDERBUFFER,le.__webglColorRenderbuffer[xe]);let we=i.get(x[xe]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,le.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+xe,e.TEXTURE_2D,we,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,le.__webglMultisampledFramebuffer)}else if(M.depthBuffer&&M.resolveDepthBuffer===!1&&c){let x=M.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[x])}}}function Pt(M){return Math.min(r.maxSamples,M.samples)}function L(M){let x=i.get(M);return M.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function _n(M){let x=o.render.frame;if(u.get(M)!==x)u.set(M,x),M.update()}function nt(M,x){let{colorSpace:I,format:W,type:te}=M;if(M.isCompressedTexture===!0||M.isVideoTexture===!0)return x;if(I!==hn&&I!==mr)if(We.getTransfer(I)===ht){if(W!==Jn||te!==Fn)Me("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.")}else Ne("WebGLTextures: Unsupported texture color space:",I);return x}function gt(M){if(typeof HTMLImageElement<"u"&&M instanceof HTMLImageElement)l.width=M.naturalWidth||M.width,l.height=M.naturalHeight||M.height;else if(typeof VideoFrame<"u"&&M instanceof VideoFrame)l.width=M.displayWidth,l.height=M.displayHeight;else l.width=M.width,l.height=M.height;return l}this.allocateTextureUnit=V,this.resetTextureUnits=J,this.getTextureUnits=O,this.setTextureUnits=H,this.setTexture2D=K,this.setTexture2DArray=Q,this.setTexture3D=se,this.setTextureCube=me,this.rebindTextures=Je,this.setupRenderTarget=Ft,this.updateRenderTargetMipmap=gn,this.updateMultisampleRenderTarget=zt,this.setupDepthRenderbuffer=Ye,this.setupFrameBufferTexture=Oe,this.useMultisampledRTT=L,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function IT(e,t){function n(i,r=mr){let s,o=We.getTransfer(r);if(i===Fn)return e.UNSIGNED_BYTE;if(i===Ul)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Ol)return e.UNSIGNED_SHORT_5_5_5_1;if(i===Qg)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===e_)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===Jg)return e.BYTE;if(i===Kg)return e.SHORT;if(i===Vs)return e.UNSIGNED_SHORT;if(i===Dl)return e.INT;if(i===Oi)return e.UNSIGNED_INT;if(i===di)return e.FLOAT;if(i===pi)return e.HALF_FLOAT;if(i===t_)return e.ALPHA;if(i===n_)return e.RGB;if(i===Jn)return e.RGBA;if(i===fr)return e.DEPTH_COMPONENT;if(i===dr)return e.DEPTH_STENCIL;if(i===i_)return e.RED;if(i===Fl)return e.RED_INTEGER;if(i===pr)return e.RG;if(i===zl)return e.RG_INTEGER;if(i===kl)return e.RGBA_INTEGER;if(i===ya||i===ba||i===Sa||i===Ma)if(o===ht)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===ya)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ba)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Sa)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Ma)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===ya)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ba)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Sa)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Ma)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Bl||i===Gl||i===Hl||i===Vl)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Bl)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Gl)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Hl)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Vl)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Wl||i===$l||i===Zl||i===Xl||i===ql||i===wa||i===Yl)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Wl||i===$l)return o===ht?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Zl)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===Xl)return s.COMPRESSED_R11_EAC;if(i===ql)return s.COMPRESSED_SIGNED_R11_EAC;if(i===wa)return s.COMPRESSED_RG11_EAC;if(i===Yl)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===jl||i===Jl||i===Kl||i===Ql||i===eu||i===tu||i===nu||i===iu||i===ru||i===su||i===ou||i===au||i===cu||i===lu)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(i===jl)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Jl)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Kl)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Ql)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===eu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===tu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===nu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===iu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===ru)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===su)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ou)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===au)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===cu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===lu)return o===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===uu||i===hu||i===fu)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(i===uu)return o===ht?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===hu)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===fu)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===du||i===pu||i===Ta||i===mu)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(i===du)return s.COMPRESSED_RED_RGTC1_EXT;if(i===pu)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ta)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===mu)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;if(i===Kr)return e.UNSIGNED_INT_24_8;return e[i]!==void 0?e[i]:null}return{convert:n}}var PT=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,LT=`
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

}`;class n0{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Fa(e.texture);if(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)this.depthNear=e.depthNear,this.depthFar=e.depthFar;this.texture=n}}getMesh(e){if(this.texture!==null){if(this.mesh===null){let t=e.cameras[0].viewport,n=new Mn({vertexShader:PT,fragmentShader:LT,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new pt(new to(20,20),n)}}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class i0 extends zn{constructor(e,t){super();let n=this,i=null,r=1,s=null,o="local-floor",a=1,c=null,l=null,u=null,f=null,h=null,d=null,g=typeof XRWebGLBinding<"u",y=new n0,p={},m=t.getContextAttributes(),A=null,T=null,v=[],w=[],E=new Ie,R=null,_=new Lt;_.viewport=new st;let S=new Lt;S.viewport=new st;let F=[_,S],C=new Fu,z=null,J=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let ne=v[Z];if(ne===void 0)ne=new Xs,v[Z]=ne;return ne.getTargetRaySpace()},this.getControllerGrip=function(Z){let ne=v[Z];if(ne===void 0)ne=new Xs,v[Z]=ne;return ne.getGripSpace()},this.getHand=function(Z){let ne=v[Z];if(ne===void 0)ne=new Xs,v[Z]=ne;return ne.getHandSpace()};function O(Z){let ne=w.indexOf(Z.inputSource);if(ne===-1)return;let fe=v[ne];if(fe!==void 0)fe.update(Z.inputSource,Z.frame,c||s),fe.dispatchEvent({type:Z.type,data:Z.inputSource})}function H(){i.removeEventListener("select",O),i.removeEventListener("selectstart",O),i.removeEventListener("selectend",O),i.removeEventListener("squeeze",O),i.removeEventListener("squeezestart",O),i.removeEventListener("squeezeend",O),i.removeEventListener("end",H),i.removeEventListener("inputsourceschange",V);for(let Z=0;Z<v.length;Z++){let ne=w[Z];if(ne===null)continue;w[Z]=null,v[Z].disconnect(ne)}z=null,J=null,y.reset();for(let Z in p)delete p[Z];e.setRenderTarget(A),h=null,f=null,u=null,i=null,T=null,Ge.stop(),n.isPresenting=!1,e.setPixelRatio(R),e.setSize(E.width,E.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){if(r=Z,n.isPresenting===!0)Me("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){if(o=Z,n.isPresenting===!0)Me("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||s},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return f!==null?f:h},this.getBinding=function(){if(u===null&&g)u=new XRWebGLBinding(i,t);return u},this.getFrame=function(){return d},this.getSession=function(){return i},this.setSession=async function(Z){if(i=Z,i!==null){if(A=e.getRenderTarget(),i.addEventListener("select",O),i.addEventListener("selectstart",O),i.addEventListener("selectend",O),i.addEventListener("squeeze",O),i.addEventListener("squeezestart",O),i.addEventListener("squeezeend",O),i.addEventListener("end",H),i.addEventListener("inputsourceschange",V),m.xrCompatible!==!0)await t.makeXRCompatible();if(R=e.getPixelRatio(),e.getSize(E),!(g&&("createProjectionLayer"in XRWebGLBinding.prototype))){let fe={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};h=new XRWebGLLayer(i,t,fe),i.updateRenderState({baseLayer:h}),e.setPixelRatio(1),e.setSize(h.framebufferWidth,h.framebufferHeight,!1),T=new Sn(h.framebufferWidth,h.framebufferHeight,{format:Jn,type:Fn,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}else{let fe=null,de=null,Re=null;if(m.depth)Re=m.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,fe=m.stencil?dr:fr,de=m.stencil?Kr:Oi;let Ze={colorFormat:t.RGBA8,depthFormat:Re,scaleFactor:r};u=this.getBinding(),f=u.createProjectionLayer(Ze),i.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),T=new Sn(f.textureWidth,f.textureHeight,{format:Jn,type:Fn,depthTexture:new Bi(f.textureWidth,f.textureHeight,de,void 0,void 0,void 0,void 0,void 0,void 0,fe),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}T.isXRRenderTarget=!0,this.setFoveation(a),c=null,s=await i.requestReferenceSpace(o),Ge.setContext(i),Ge.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return y.getDepthTexture()};function V(Z){for(let ne=0;ne<Z.removed.length;ne++){let fe=Z.removed[ne],de=w.indexOf(fe);if(de>=0)w[de]=null,v[de].disconnect(fe)}for(let ne=0;ne<Z.added.length;ne++){let fe=Z.added[ne],de=w.indexOf(fe);if(de===-1){for(let Ze=0;Ze<v.length;Ze++)if(Ze>=w.length){w.push(fe),de=Ze;break}else if(w[Ze]===null){w[Ze]=fe,de=Ze;break}if(de===-1)break}let Re=v[de];if(Re)Re.connect(fe)}}let U=new N,K=new N;function Q(Z,ne,fe){U.setFromMatrixPosition(ne.matrixWorld),K.setFromMatrixPosition(fe.matrixWorld);let de=U.distanceTo(K),Re=ne.projectionMatrix.elements,Ze=fe.projectionMatrix.elements,Oe=Re[14]/(Re[10]-1),ke=Re[14]/(Re[10]+1),Ke=(Re[9]+1)/Re[5],Ye=(Re[9]-1)/Re[5],Je=(Re[8]-1)/Re[0],Ft=(Ze[8]+1)/Ze[0],gn=Oe*Je,mt=Oe*Ft,Ht=de/(-Je+Ft),zt=Ht*-Je;if(ne.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(zt),Z.translateZ(Ht),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),Re[10]===-1)Z.projectionMatrix.copy(ne.projectionMatrix),Z.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{let Pt=Oe+Ht,L=ke+Ht,_n=gn-zt,nt=mt+(de-zt),gt=Ke*ke/L*Pt,M=Ye*ke/L*Pt;Z.projectionMatrix.makePerspective(_n,nt,gt,M,Pt,L),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function se(Z,ne){if(ne===null)Z.matrixWorld.copy(Z.matrix);else Z.matrixWorld.multiplyMatrices(ne.matrixWorld,Z.matrix);Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(i===null)return;let{near:ne,far:fe}=Z;if(y.texture!==null){if(y.depthNear>0)ne=y.depthNear;if(y.depthFar>0)fe=y.depthFar}if(C.near=S.near=_.near=ne,C.far=S.far=_.far=fe,z!==C.near||J!==C.far)i.updateRenderState({depthNear:C.near,depthFar:C.far}),z=C.near,J=C.far;C.layers.mask=Z.layers.mask|6,_.layers.mask=C.layers.mask&-5,S.layers.mask=C.layers.mask&-3;let de=Z.parent,Re=C.cameras;se(C,de);for(let Ze=0;Ze<Re.length;Ze++)se(Re[Ze],de);if(Re.length===2)Q(C,_,S);else C.projectionMatrix.copy(_.projectionMatrix);me(Z,C,de)};function me(Z,ne,fe){if(fe===null)Z.matrix.copy(ne.matrixWorld);else Z.matrix.copy(fe.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(ne.matrixWorld);if(Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(ne.projectionMatrix),Z.projectionMatrixInverse.copy(ne.projectionMatrixInverse),Z.isPerspectiveCamera)Z.fov=cr*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1}this.getCamera=function(){return C},this.getFoveation=function(){if(f===null&&h===null)return;return a},this.setFoveation=function(Z){if(a=Z,f!==null)f.fixedFoveation=Z;if(h!==null&&h.fixedFoveation!==void 0)h.fixedFoveation=Z},this.hasDepthSensing=function(){return y.texture!==null},this.getDepthSensingMesh=function(){return y.getMesh(C)},this.getCameraTexture=function(Z){return p[Z]};let _e=null;function qe(Z,ne){if(l=ne.getViewerPose(c||s),d=ne,l!==null){let fe=l.views;if(h!==null)e.setRenderTargetFramebuffer(T,h.framebuffer),e.setRenderTarget(T);let de=!1;if(fe.length!==C.cameras.length)C.cameras.length=0,de=!0;for(let ke=0;ke<fe.length;ke++){let Ke=fe[ke],Ye=null;if(h!==null)Ye=h.getViewport(Ke);else{let Ft=u.getViewSubImage(f,Ke);if(Ye=Ft.viewport,ke===0)e.setRenderTargetTextures(T,Ft.colorTexture,Ft.depthStencilTexture),e.setRenderTarget(T)}let Je=F[ke];if(Je===void 0)Je=new Lt,Je.layers.enable(ke),Je.viewport=new st,F[ke]=Je;if(Je.matrix.fromArray(Ke.transform.matrix),Je.matrix.decompose(Je.position,Je.quaternion,Je.scale),Je.projectionMatrix.fromArray(Ke.projectionMatrix),Je.projectionMatrixInverse.copy(Je.projectionMatrix).invert(),Je.viewport.set(Ye.x,Ye.y,Ye.width,Ye.height),ke===0)C.matrix.copy(Je.matrix),C.matrix.decompose(C.position,C.quaternion,C.scale);if(de===!0)C.cameras.push(Je)}let Re=i.enabledFeatures;if(Re&&Re.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&g){u=n.getBinding();let ke=u.getDepthInformation(fe[0]);if(ke&&ke.isValid&&ke.texture)y.init(ke,i.renderState)}if(Re&&Re.includes("camera-access")&&g){e.state.unbindTexture(),u=n.getBinding();for(let ke=0;ke<fe.length;ke++){let Ke=fe[ke].camera;if(Ke){let Ye=p[Ke];if(!Ye)Ye=new Fa,p[Ke]=Ye;let Je=u.getCameraImage(Ke);Ye.sourceTexture=Je}}}}for(let fe=0;fe<v.length;fe++){let de=w[fe],Re=v[fe];if(de!==null&&Re!==void 0)Re.update(de,ne,c||s)}if(_e)_e(Z,ne);if(ne.detectedPlanes)n.dispatchEvent({type:"planesdetected",data:ne});d=null}let Ge=new $_;Ge.setAnimationLoop(qe),this.setAnimationLoop=function(Z){_e=Z},this.dispose=function(){}}}var NT=new ze,r0=new Ue;r0.set(-1,0,0,0,1,0,0,0,1);function DT(e,t){function n(p,m){if(p.matrixAutoUpdate===!0)p.updateMatrix();m.value.copy(p.matrix)}function i(p,m){if(m.color.getRGB(p.fogColor.value,Au(e)),m.isFog)p.fogNear.value=m.near,p.fogFar.value=m.far;else if(m.isFogExp2)p.fogDensity.value=m.density}function r(p,m,A,T,v){if(m.isNodeMaterial)m.uniformsNeedUpdate=!1;else if(m.isMeshBasicMaterial)s(p,m);else if(m.isMeshLambertMaterial){if(s(p,m),m.envMap)p.envMapIntensity.value=m.envMapIntensity}else if(m.isMeshToonMaterial)s(p,m),f(p,m);else if(m.isMeshPhongMaterial){if(s(p,m),u(p,m),m.envMap)p.envMapIntensity.value=m.envMapIntensity}else if(m.isMeshStandardMaterial){if(s(p,m),h(p,m),m.isMeshPhysicalMaterial)d(p,m,v)}else if(m.isMeshMatcapMaterial)s(p,m),g(p,m);else if(m.isMeshDepthMaterial)s(p,m);else if(m.isMeshDistanceMaterial)s(p,m),y(p,m);else if(m.isMeshNormalMaterial)s(p,m);else if(m.isLineBasicMaterial){if(o(p,m),m.isLineDashedMaterial)a(p,m)}else if(m.isPointsMaterial)c(p,m,A,T);else if(m.isSpriteMaterial)l(p,m);else if(m.isShadowMaterial)p.color.value.copy(m.color),p.opacity.value=m.opacity;else if(m.isShaderMaterial)m.uniformsNeedUpdate=!1}function s(p,m){if(p.opacity.value=m.opacity,m.color)p.diffuse.value.copy(m.color);if(m.emissive)p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity);if(m.map)p.map.value=m.map,n(m.map,p.mapTransform);if(m.alphaMap)p.alphaMap.value=m.alphaMap,n(m.alphaMap,p.alphaMapTransform);if(m.bumpMap){if(p.bumpMap.value=m.bumpMap,n(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===Yt)p.bumpScale.value*=-1}if(m.normalMap){if(p.normalMap.value=m.normalMap,n(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===Yt)p.normalScale.value.negate()}if(m.displacementMap)p.displacementMap.value=m.displacementMap,n(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias;if(m.emissiveMap)p.emissiveMap.value=m.emissiveMap,n(m.emissiveMap,p.emissiveMapTransform);if(m.specularMap)p.specularMap.value=m.specularMap,n(m.specularMap,p.specularMapTransform);if(m.alphaTest>0)p.alphaTest.value=m.alphaTest;let A=t.get(m),{envMap:T,envMapRotation:v}=A;if(T){if(p.envMap.value=T,p.envMapRotation.value.setFromMatrix4(NT.makeRotationFromEuler(v)).transpose(),T.isCubeTexture&&T.isRenderTargetTexture===!1)p.envMapRotation.value.premultiply(r0);p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio}if(m.lightMap)p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,n(m.lightMap,p.lightMapTransform);if(m.aoMap)p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,n(m.aoMap,p.aoMapTransform)}function o(p,m){if(p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map)p.map.value=m.map,n(m.map,p.mapTransform)}function a(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function c(p,m,A,T){if(p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*A,p.scale.value=T*0.5,m.map)p.map.value=m.map,n(m.map,p.uvTransform);if(m.alphaMap)p.alphaMap.value=m.alphaMap,n(m.alphaMap,p.alphaMapTransform);if(m.alphaTest>0)p.alphaTest.value=m.alphaTest}function l(p,m){if(p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map)p.map.value=m.map,n(m.map,p.mapTransform);if(m.alphaMap)p.alphaMap.value=m.alphaMap,n(m.alphaMap,p.alphaMapTransform);if(m.alphaTest>0)p.alphaTest.value=m.alphaTest}function u(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,0.0001)}function f(p,m){if(m.gradientMap)p.gradientMap.value=m.gradientMap}function h(p,m){if(p.metalness.value=m.metalness,m.metalnessMap)p.metalnessMap.value=m.metalnessMap,n(m.metalnessMap,p.metalnessMapTransform);if(p.roughness.value=m.roughness,m.roughnessMap)p.roughnessMap.value=m.roughnessMap,n(m.roughnessMap,p.roughnessMapTransform);if(m.envMap)p.envMapIntensity.value=m.envMapIntensity}function d(p,m,A){if(p.ior.value=m.ior,m.sheen>0){if(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap)p.sheenColorMap.value=m.sheenColorMap,n(m.sheenColorMap,p.sheenColorMapTransform);if(m.sheenRoughnessMap)p.sheenRoughnessMap.value=m.sheenRoughnessMap,n(m.sheenRoughnessMap,p.sheenRoughnessMapTransform)}if(m.clearcoat>0){if(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap)p.clearcoatMap.value=m.clearcoatMap,n(m.clearcoatMap,p.clearcoatMapTransform);if(m.clearcoatRoughnessMap)p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,n(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform);if(m.clearcoatNormalMap){if(p.clearcoatNormalMap.value=m.clearcoatNormalMap,n(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Yt)p.clearcoatNormalScale.value.negate()}}if(m.dispersion>0)p.dispersion.value=m.dispersion;if(m.iridescence>0){if(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap)p.iridescenceMap.value=m.iridescenceMap,n(m.iridescenceMap,p.iridescenceMapTransform);if(m.iridescenceThicknessMap)p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,n(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform)}if(m.transmission>0){if(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=A.texture,p.transmissionSamplerSize.value.set(A.width,A.height),m.transmissionMap)p.transmissionMap.value=m.transmissionMap,n(m.transmissionMap,p.transmissionMapTransform);if(p.thickness.value=m.thickness,m.thicknessMap)p.thicknessMap.value=m.thicknessMap,n(m.thicknessMap,p.thicknessMapTransform);p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)}if(m.anisotropy>0){if(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap)p.anisotropyMap.value=m.anisotropyMap,n(m.anisotropyMap,p.anisotropyMapTransform)}if(p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap)p.specularColorMap.value=m.specularColorMap,n(m.specularColorMap,p.specularColorMapTransform);if(m.specularIntensityMap)p.specularIntensityMap.value=m.specularIntensityMap,n(m.specularIntensityMap,p.specularIntensityMapTransform)}function g(p,m){if(m.matcap)p.matcap.value=m.matcap}function y(p,m){let A=t.get(m).light;p.referencePosition.value.setFromMatrixPosition(A.matrixWorld),p.nearDistance.value=A.shadow.camera.near,p.farDistance.value=A.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function UT(e,t,n,i){let r={},s={},o=[],a=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(v,w){let E=w.program;i.uniformBlockBinding(v,E)}function l(v,w){let E=r[v.id];if(E===void 0)p(v),E=u(v),r[v.id]=E,v.addEventListener("dispose",A);let R=w.program;i.updateUBOMapping(v,R);let _=t.render.frame;if(s[v.id]!==_)h(v),s[v.id]=_}function u(v){let w=f();v.__bindingPointIndex=w;let E=e.createBuffer(),{__size:R,usage:_}=v;return e.bindBuffer(e.UNIFORM_BUFFER,E),e.bufferData(e.UNIFORM_BUFFER,R,_),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,w,E),E}function f(){for(let v=0;v<a;v++)if(o.indexOf(v)===-1)return o.push(v),v;return Ne("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(v){let w=r[v.id],{uniforms:E,__cache:R}=v;e.bindBuffer(e.UNIFORM_BUFFER,w);for(let _=0,S=E.length;_<S;_++){let F=E[_];if(Array.isArray(F))for(let C=0,z=F.length;C<z;C++)d(F[C],_,C,R);else d(F,_,0,R)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function d(v,w,E,R){if(y(v,w,E,R)===!0){let{__offset:_,value:S}=v;if(Array.isArray(S)){let F=0;for(let C=0;C<S.length;C++){let z=S[C],J=m(z);if(g(z,v.__data,F),typeof z!=="number"&&typeof z!=="boolean"&&!z.isMatrix3&&!ArrayBuffer.isView(z))F+=J.storage/Float32Array.BYTES_PER_ELEMENT}}else g(S,v.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,_,v.__data)}}function g(v,w,E){if(typeof v==="number"||typeof v==="boolean")w[0]=v;else if(v.isMatrix3)w[0]=v.elements[0],w[1]=v.elements[1],w[2]=v.elements[2],w[3]=0,w[4]=v.elements[3],w[5]=v.elements[4],w[6]=v.elements[5],w[7]=0,w[8]=v.elements[6],w[9]=v.elements[7],w[10]=v.elements[8],w[11]=0;else if(ArrayBuffer.isView(v))w.set(new v.constructor(v.buffer,v.byteOffset,w.length));else v.toArray(w,E)}function y(v,w,E,R){let _=v.value,S=w+"_"+E;if(R[S]===void 0){if(typeof _==="number"||typeof _==="boolean")R[S]=_;else if(ArrayBuffer.isView(_))R[S]=_.slice();else R[S]=_.clone();return!0}else{let F=R[S];if(typeof _==="number"||typeof _==="boolean"){if(F!==_)return R[S]=_,!0}else if(ArrayBuffer.isView(_))return!0;else if(F.equals(_)===!1)return F.copy(_),!0}return!1}function p(v){let w=v.uniforms,E=0,R=16;for(let S=0,F=w.length;S<F;S++){let C=Array.isArray(w[S])?w[S]:[w[S]];for(let z=0,J=C.length;z<J;z++){let O=C[z],H=Array.isArray(O.value)?O.value:[O.value];for(let V=0,U=H.length;V<U;V++){let K=H[V],Q=m(K),se=E%R,me=se%Q.boundary,_e=se+me;if(E+=me,_e!==0&&R-_e<Q.storage)E+=R-_e;O.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=E,E+=Q.storage}}}let _=E%R;if(_>0)E+=R-_;return v.__size=E,v.__cache={},this}function m(v){let w={boundary:0,storage:0};if(typeof v==="number"||typeof v==="boolean")w.boundary=4,w.storage=4;else if(v.isVector2)w.boundary=8,w.storage=8;else if(v.isVector3||v.isColor)w.boundary=16,w.storage=12;else if(v.isVector4)w.boundary=16,w.storage=16;else if(v.isMatrix3)w.boundary=48,w.storage=48;else if(v.isMatrix4)w.boundary=64,w.storage=64;else if(v.isTexture)Me("WebGLRenderer: Texture samplers can not be part of an uniforms group.");else if(ArrayBuffer.isView(v))w.boundary=16,w.storage=v.byteLength;else Me("WebGLRenderer: Unsupported uniform value type.",v);return w}function A(v){let w=v.target;w.removeEventListener("dispose",A);let E=o.indexOf(w.__bindingPointIndex);o.splice(E,1),e.deleteBuffer(r[w.id]),delete r[w.id],delete s[w.id]}function T(){for(let v in r)e.deleteBuffer(r[v]);o=[],r={},s={}}return{bind:c,update:l,dispose:T}}var OT=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Qn=null;function FT(){if(Qn===null)Qn=new js(OT,16,16,pr,pi),Qn.name="DFG_LUT",Qn.minFilter=Gt,Qn.magFilter=Gt,Qn.wrapS=jr,Qn.wrapT=jr,Qn.generateMipmaps=!1,Qn.needsUpdate=!0;return Qn}class Qu{constructor(e={}){let{canvas:t=h_(),context:n=null,depth:i=!0,stencil:r=!1,alpha:s=!1,antialias:o=!1,premultipliedAlpha:a=!0,preserveDrawingBuffer:c=!1,powerPreference:l="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:f=!1,outputBufferType:h=Fn}=e;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=s;let g=h,y=new Set([kl,zl,Fl]),p=new Set([Fn,Oi,Vs,Kr,Ul,Ol]),m=new Uint32Array(4),A=new Int32Array(4),T=new N,v=null,w=null,E=[],R=[],_=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Un,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let S=this,F=!1,C=null,z=null,J=null,O=null;this._outputColorSpace=Fi;let H=0,V=0,U=null,K=-1,Q=null,se=new st,me=new st,_e=null,qe=new Le(0),Ge=0,{width:Z,height:ne}=t,fe=1,de=null,Re=null,Ze=new st(0,0,Z,ne),Oe=new st(0,0,Z,ne),ke=!1,Ke=new Ks,Ye=!1,Je=!1,Ft=new ze,gn=new N,mt=new st,Ht={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},zt=!1;function Pt(){return U===null?fe:1}let L=n;function _n(b,D){return t.getContext(b,D)}try{let b={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:a,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if("setAttribute"in t)t.setAttribute("data-engine",`three.js r${_g}`);if(t.addEventListener("webglcontextlost",Fe,!1),t.addEventListener("webglcontextrestored",St,!1),t.addEventListener("webglcontextcreationerror",ft,!1),L===null){if(L=_n("webgl2",b),L===null)if(_n("webgl2"))throw Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.");else throw Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(b){throw Ne("WebGLRenderer: "+b.message),b}let nt,gt,M,x,I,W,te,ie,le,X,j,xe,we,ue,re,Ce,Pe,et,P,oe,Y,ae,ve;function ee(){if(nt=new WM(L),nt.init(),Y=new IT(L,nt),gt=new OM(L,nt,e,Y),M=new RT(L,nt),gt.reversedDepthBuffer&&f)M.buffers.depth.setReversed(!0);z=L.createFramebuffer(),J=L.createFramebuffer(),O=L.createFramebuffer(),x=new XM(L),I=new pT,W=new CT(L,nt,M,I,gt,Y,x),te=new VM(S),ie=new Jy(L),ae=new DM(L,ie),le=new $M(L,ie,x,ae),X=new YM(L,le,ie,ae,x),et=new qM(L,gt,W),re=new FM(I),j=new dT(S,te,nt,gt,ae,re),xe=new DT(S,I),we=new gT,ue=new ST(nt),Pe=new NM(S,te,M,X,d,a),Ce=new AT(S,X,gt),ve=new UT(L,x,gt,M),P=new UM(L,nt,x),oe=new ZM(L,nt,x),x.programs=j.programs,S.capabilities=gt,S.extensions=nt,S.properties=I,S.renderLists=we,S.shadowMap=Ce,S.state=M,S.info=x}if(ee(),g!==Fn)_=new JM(g,t.width,t.height,o,i,r);let ce=new i0(S,L);this.xr=ce,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){let b=nt.get("WEBGL_lose_context");if(b)b.loseContext()},this.forceContextRestore=function(){let b=nt.get("WEBGL_lose_context");if(b)b.restoreContext()},this.getPixelRatio=function(){return fe},this.setPixelRatio=function(b){if(b===void 0)return;fe=b,this.setSize(Z,ne,!1)},this.getSize=function(b){return b.set(Z,ne)},this.setSize=function(b,D,G=!0){if(ce.isPresenting){Me("WebGLRenderer: Can't change size while VR device is presenting.");return}if(Z=b,ne=D,t.width=Math.floor(b*fe),t.height=Math.floor(D*fe),G===!0)t.style.width=b+"px",t.style.height=D+"px";if(_!==null)_.setSize(t.width,t.height);this.setViewport(0,0,b,D)},this.getDrawingBufferSize=function(b){return b.set(Z*fe,ne*fe).floor()},this.setDrawingBufferSize=function(b,D,G){Z=b,ne=D,fe=G,t.width=Math.floor(b*G),t.height=Math.floor(D*G),this.setViewport(0,0,b,D)},this.setEffects=function(b){if(g===Fn){Ne("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let D=0;D<b.length;D++)if(b[D].isOutputPass===!0){Me("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}_.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(se)},this.getViewport=function(b){return b.copy(Ze)},this.setViewport=function(b,D,G,k){if(b.isVector4)Ze.set(b.x,b.y,b.z,b.w);else Ze.set(b,D,G,k);M.viewport(se.copy(Ze).multiplyScalar(fe).round())},this.getScissor=function(b){return b.copy(Oe)},this.setScissor=function(b,D,G,k){if(b.isVector4)Oe.set(b.x,b.y,b.z,b.w);else Oe.set(b,D,G,k);M.scissor(me.copy(Oe).multiplyScalar(fe).round())},this.getScissorTest=function(){return ke},this.setScissorTest=function(b){M.setScissorTest(ke=b)},this.setOpaqueSort=function(b){de=b},this.setTransparentSort=function(b){Re=b},this.getClearColor=function(b){return b.copy(Pe.getClearColor())},this.setClearColor=function(){Pe.setClearColor(...arguments)},this.getClearAlpha=function(){return Pe.getClearAlpha()},this.setClearAlpha=function(){Pe.setClearAlpha(...arguments)},this.clear=function(b=!0,D=!0,G=!0){let k=0;if(b){let B=!1;if(U!==null){let ge=U.texture.format;B=y.has(ge)}if(B){let ge=U.texture.type,be=p.has(ge),pe=Pe.getClearColor(),Se=Pe.getClearAlpha(),{r:Ee,g:Be,b:Ve}=pe;if(be)m[0]=Ee,m[1]=Be,m[2]=Ve,m[3]=Se,L.clearBufferuiv(L.COLOR,0,m);else A[0]=Ee,A[1]=Be,A[2]=Ve,A[3]=Se,L.clearBufferiv(L.COLOR,0,A)}else k|=L.COLOR_BUFFER_BIT}if(D)k|=L.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0);if(G)k|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295);if(k!==0)L.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),C=b},this.dispose=function(){t.removeEventListener("webglcontextlost",Fe,!1),t.removeEventListener("webglcontextrestored",St,!1),t.removeEventListener("webglcontextcreationerror",ft,!1),Pe.dispose(),we.dispose(),ue.dispose(),I.dispose(),te.dispose(),X.dispose(),ae.dispose(),ve.dispose(),j.dispose(),ce.dispose(),ce.removeEventListener("sessionstart",_h),ce.removeEventListener("sessionend",xh),ji.stop()};function Fe(b){b.preventDefault(),zs("WebGLRenderer: Context Lost."),F=!0}function St(){zs("WebGLRenderer: Context Restored."),F=!1;let b=x.autoReset,D=Ce.enabled,G=Ce.autoUpdate,k=Ce.needsUpdate,B=Ce.type;ee(),x.autoReset=b,Ce.enabled=D,Ce.autoUpdate=G,Ce.needsUpdate=k,Ce.type=B}function ft(b){Ne("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function kn(b){let D=b.target;D.removeEventListener("dispose",kn),ni(D)}function ni(b){X0(b),I.remove(b)}function X0(b){let D=I.get(b).programs;if(D!==void 0){if(D.forEach(function(G){j.releaseProgram(G)}),b.isShaderMaterial)j.releaseShaderCache(b)}}this.renderBufferDirect=function(b,D,G,k,B,ge){if(D===null)D=Ht;let be=B.isMesh&&B.matrixWorld.determinantAffine()<0,pe=j0(b,D,G,k,B);M.setMaterial(k,be);let Se=G.index,Ee=1;if(k.wireframe===!0){if(Se=le.getWireframeAttribute(G),Se===void 0)return;Ee=2}let Be=G.drawRange,Ve=G.attributes.position,Ae=Be.start*Ee,ot=(Be.start+Be.count)*Ee;if(ge!==null)Ae=Math.max(Ae,ge.start*Ee),ot=Math.min(ot,(ge.start+ge.count)*Ee);if(Se!==null)Ae=Math.max(Ae,0),ot=Math.min(ot,Se.count);else if(Ve!==void 0&&Ve!==null)Ae=Math.max(Ae,0),ot=Math.min(ot,Ve.count);let Tt=ot-Ae;if(Tt<0||Tt===1/0)return;ae.setup(B,k,pe,G,Se);let Mt,lt=P;if(Se!==null)Mt=ie.get(Se),lt=oe,lt.setIndex(Mt);if(B.isMesh)if(k.wireframe===!0)M.setLineWidth(k.wireframeLinewidth*Pt()),lt.setMode(L.LINES);else lt.setMode(L.TRIANGLES);else if(B.isLine){let $t=k.linewidth;if($t===void 0)$t=1;if(M.setLineWidth($t*Pt()),B.isLineSegments)lt.setMode(L.LINES);else if(B.isLineLoop)lt.setMode(L.LINE_LOOP);else lt.setMode(L.LINE_STRIP)}else if(B.isPoints)lt.setMode(L.POINTS);else if(B.isSprite)lt.setMode(L.TRIANGLES);if(B.isBatchedMesh)if(!nt.get("WEBGL_multi_draw")){let{_multiDrawStarts:$t,_multiDrawCounts:ye,_multiDrawCount:on}=B,Qe=Se?ie.get(Se).bytesPerElement:1,xn=I.get(k).currentProgram.getUniforms();for(let Bn=0;Bn<on;Bn++)xn.setValue(L,"_gl_DrawID",Bn),lt.render($t[Bn]/Qe,ye[Bn])}else lt.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else if(B.isInstancedMesh)lt.renderInstances(Ae,Tt,B.count);else if(G.isInstancedBufferGeometry){let $t=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,ye=Math.min(G.instanceCount,$t);lt.renderInstances(Ae,Tt,ye)}else lt.render(Ae,Tt)};function gh(b,D,G){if(b.transparent===!0&&b.side===bn&&b.forceSinglePass===!1)b.side=Yt,b.needsUpdate=!0,xo(b,D,G),b.side=Ui,b.needsUpdate=!0,xo(b,D,G),b.side=bn;else xo(b,D,G)}this.compile=function(b,D,G=null){if(G===null)G=b;if(w=ue.get(G),w.init(D),R.push(w),G.traverseVisible(function(B){if(B.isLight&&B.layers.test(D.layers)){if(w.pushLight(B),B.castShadow)w.pushShadow(B)}}),b!==G)b.traverseVisible(function(B){if(B.isLight&&B.layers.test(D.layers)){if(w.pushLight(B),B.castShadow)w.pushShadow(B)}});w.setupLights();let k=new Set;return b.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let ge=B.material;if(ge)if(Array.isArray(ge))for(let be=0;be<ge.length;be++){let pe=ge[be];gh(pe,G,B),k.add(pe)}else gh(ge,G,B),k.add(ge)}),w=R.pop(),k},this.compileAsync=function(b,D,G=null){let k=this.compile(b,D,G);return new Promise((B)=>{function ge(){if(k.forEach(function(be){if(I.get(be).currentProgram.isReady())k.delete(be)}),k.size===0){B(b);return}setTimeout(ge,10)}if(nt.get("KHR_parallel_shader_compile")!==null)ge();else setTimeout(ge,10)})};let nc=null;function q0(b){if(nc)nc(b)}function _h(){ji.stop()}function xh(){ji.start()}let ji=new $_;if(ji.setAnimationLoop(q0),typeof self<"u")ji.setContext(self);this.setAnimationLoop=function(b){nc=b,ce.setAnimationLoop(b),b===null?ji.stop():ji.start()},ce.addEventListener("sessionstart",_h),ce.addEventListener("sessionend",xh),this.render=function(b,D){if(D!==void 0&&D.isCamera!==!0){Ne("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(F===!0)return;if(C!==null)C.renderStart(b,D);let G=ce.enabled===!0&&ce.isPresenting===!0,k=_!==null&&(U===null||G)&&_.begin(S,U);if(b.matrixWorldAutoUpdate===!0)b.updateMatrixWorld();if(D.parent===null&&D.matrixWorldAutoUpdate===!0)D.updateMatrixWorld();if(ce.enabled===!0&&ce.isPresenting===!0&&(_===null||_.isCompositing()===!1)){if(ce.cameraAutoUpdate===!0)ce.updateCamera(D);D=ce.getCamera()}if(b.isScene===!0)b.onBeforeRender(S,b,D,U);if(w=ue.get(b,R.length),w.init(D),w.state.textureUnits=W.getTextureUnits(),R.push(w),Ft.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),Ke.setFromProjectionMatrix(Ft,bu,D.reversedDepth),Je=this.localClippingEnabled,Ye=re.init(this.clippingPlanes,Je),v=we.get(b,E.length),v.init(),E.push(v),ce.enabled===!0&&ce.isPresenting===!0){let be=S.xr.getDepthSensingMesh();if(be!==null)ic(be,D,-1/0,S.sortObjects)}if(ic(b,D,0,S.sortObjects),v.finish(),S.sortObjects===!0)v.sort(de,Re,D.reversedDepth);if(zt=ce.enabled===!1||ce.isPresenting===!1||ce.hasDepthSensing()===!1,zt)Pe.addToRenderList(v,b);if(this.info.render.frame++,this.info.autoReset===!0)this.info.reset();if(Ye===!0)re.beginShadows();let B=w.state.shadowsArray;if(Ce.render(B,b,D),Ye===!0)re.endShadows();if((k&&_.hasRenderPass())===!1){let be=v.opaque,pe=v.transmissive;if(w.setupLights(),D.isArrayCamera){let Se=D.cameras;if(pe.length>0)for(let Ee=0,Be=Se.length;Ee<Be;Ee++){let Ve=Se[Ee];yh(be,pe,b,Ve)}if(zt)Pe.render(b);for(let Ee=0,Be=Se.length;Ee<Be;Ee++){let Ve=Se[Ee];vh(v,b,Ve,Ve.viewport)}}else{if(pe.length>0)yh(be,pe,b,D);if(zt)Pe.render(b);vh(v,b,D)}}if(U!==null&&V===0)W.updateMultisampleRenderTarget(U),W.updateRenderTargetMipmap(U);if(k)_.end(S);if(b.isScene===!0)b.onAfterRender(S,b,D);if(ae.resetDefaultState(),K=-1,Q=null,R.pop(),R.length>0){if(w=R[R.length-1],W.setTextureUnits(w.state.textureUnits),Ye===!0)re.setGlobalState(S.clippingPlanes,w.state.camera)}else w=null;if(E.pop(),E.length>0)v=E[E.length-1];else v=null;if(C!==null)C.renderEnd()};function ic(b,D,G,k){if(b.visible===!1)return;if(b.layers.test(D.layers)){if(b.isGroup)G=b.renderOrder;else if(b.isLOD){if(b.autoUpdate===!0)b.update(D)}else if(b.isLightProbeGrid)w.pushLightProbeGrid(b);else if(b.isLight){if(w.pushLight(b),b.castShadow)w.pushShadow(b)}else if(b.isSprite){if(!b.frustumCulled||Ke.intersectsSprite(b)){if(k)mt.setFromMatrixPosition(b.matrixWorld).applyMatrix4(Ft);let be=X.update(b),pe=b.material;if(pe.visible)v.push(b,be,pe,G,mt.z,null)}}else if(b.isMesh||b.isLine||b.isPoints){if(!b.frustumCulled||Ke.intersectsObject(b)){let be=X.update(b),pe=b.material;if(k){if(b.boundingSphere!==void 0){if(b.boundingSphere===null)b.computeBoundingSphere();mt.copy(b.boundingSphere.center)}else{if(be.boundingSphere===null)be.computeBoundingSphere();mt.copy(be.boundingSphere.center)}mt.applyMatrix4(b.matrixWorld).applyMatrix4(Ft)}if(Array.isArray(pe)){let Se=be.groups;for(let Ee=0,Be=Se.length;Ee<Be;Ee++){let Ve=Se[Ee],Ae=pe[Ve.materialIndex];if(Ae&&Ae.visible)v.push(b,be,Ae,G,mt.z,Ve)}}else if(pe.visible)v.push(b,be,pe,G,mt.z,null)}}}let ge=b.children;for(let be=0,pe=ge.length;be<pe;be++)ic(ge[be],D,G,k)}function vh(b,D,G,k){let{opaque:B,transmissive:ge,transparent:be}=b;if(w.setupLightsView(G),Ye===!0)re.setGlobalState(S.clippingPlanes,G);if(k)M.viewport(se.copy(k));if(B.length>0)_o(B,D,G);if(ge.length>0)_o(ge,D,G);if(be.length>0)_o(be,D,G);M.buffers.depth.setTest(!0),M.buffers.depth.setMask(!0),M.buffers.color.setMask(!0),M.setPolygonOffset(!1)}function yh(b,D,G,k){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[k.id]===void 0){let Ae=nt.has("EXT_color_buffer_half_float")||nt.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[k.id]=new Sn(1,1,{generateMipmaps:!0,type:Ae?pi:Fn,minFilter:jn,samples:Math.max(4,gt.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:We.workingColorSpace})}let ge=w.state.transmissionRenderTarget[k.id],be=k.viewport||se;ge.setSize(be.z*S.transmissionResolutionScale,be.w*S.transmissionResolutionScale);let pe=S.getRenderTarget(),Se=S.getActiveCubeFace(),Ee=S.getActiveMipmapLevel();if(S.setRenderTarget(ge),S.getClearColor(qe),Ge=S.getClearAlpha(),Ge<1)S.setClearColor(16777215,0.5);if(S.clear(),zt)Pe.render(G);let Be=S.toneMapping;S.toneMapping=Un;let Ve=k.viewport;if(k.viewport!==void 0)k.viewport=void 0;if(w.setupLightsView(k),Ye===!0)re.setGlobalState(S.clippingPlanes,k);if(_o(b,G,k),W.updateMultisampleRenderTarget(ge),W.updateRenderTargetMipmap(ge),nt.has("WEBGL_multisampled_render_to_texture")===!1){let Ae=!1;for(let ot=0,Tt=D.length;ot<Tt;ot++){let Mt=D[ot],{object:lt,geometry:$t,material:ye,group:on}=Mt;if(ye.side===bn&&lt.layers.test(k.layers)){let Qe=ye.side;ye.side=Yt,ye.needsUpdate=!0,bh(lt,G,k,$t,ye,on),ye.side=Qe,ye.needsUpdate=!0,Ae=!0}}if(Ae===!0)W.updateMultisampleRenderTarget(ge),W.updateRenderTargetMipmap(ge)}if(S.setRenderTarget(pe,Se,Ee),S.setClearColor(qe,Ge),Ve!==void 0)k.viewport=Ve;S.toneMapping=Be}function _o(b,D,G){let k=D.isScene===!0?D.overrideMaterial:null;for(let B=0,ge=b.length;B<ge;B++){let be=b[B],{object:pe,geometry:Se,group:Ee}=be,Be=be.material;if(Be.allowOverride===!0&&k!==null)Be=k;if(pe.layers.test(G.layers))bh(pe,D,G,Se,Be,Ee)}}function bh(b,D,G,k,B,ge){if(b.onBeforeRender(S,D,G,k,B,ge),b.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),B.onBeforeRender(S,D,G,k,b,ge),B.transparent===!0&&B.side===bn&&B.forceSinglePass===!1)B.side=Yt,B.needsUpdate=!0,S.renderBufferDirect(G,D,k,B,b,ge),B.side=Ui,B.needsUpdate=!0,S.renderBufferDirect(G,D,k,B,b,ge),B.side=bn;else S.renderBufferDirect(G,D,k,B,b,ge);b.onAfterRender(S,D,G,k,B,ge)}function xo(b,D,G){if(D.isScene!==!0)D=Ht;let k=I.get(b),B=w.state.lights,ge=w.state.shadowsArray,be=B.state.version,pe=j.getParameters(b,B.state,ge,D,G,w.state.lightProbeGridArray),Se=j.getProgramCacheKey(pe),Ee=k.programs;k.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?D.environment:null,k.fog=D.fog;let Be=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;if(k.envMap=te.get(b.envMap||k.environment,Be),k.envMapRotation=k.environment!==null&&b.envMap===null?D.environmentRotation:b.envMapRotation,Ee===void 0)b.addEventListener("dispose",kn),Ee=new Map,k.programs=Ee;let Ve=Ee.get(Se);if(Ve!==void 0){if(k.currentProgram===Ve&&k.lightsStateVersion===be)return Mh(b,pe),Ve}else{if(pe.uniforms=j.getUniforms(b),C!==null&&b.isNodeMaterial)C.build(b,G,pe);b.onBeforeCompile(pe,S),Ve=j.acquireProgram(pe,Se),Ee.set(Se,Ve),k.uniforms=pe.uniforms}let Ae=k.uniforms;if(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)Ae.clippingPlanes=re.uniform;if(Mh(b,pe),k.needsLights=K0(b),k.lightsStateVersion=be,k.needsLights)Ae.ambientLightColor.value=B.state.ambient,Ae.lightProbe.value=B.state.probe,Ae.directionalLights.value=B.state.directional,Ae.directionalLightShadows.value=B.state.directionalShadow,Ae.spotLights.value=B.state.spot,Ae.spotLightShadows.value=B.state.spotShadow,Ae.rectAreaLights.value=B.state.rectArea,Ae.ltc_1.value=B.state.rectAreaLTC1,Ae.ltc_2.value=B.state.rectAreaLTC2,Ae.pointLights.value=B.state.point,Ae.pointLightShadows.value=B.state.pointShadow,Ae.hemisphereLights.value=B.state.hemi,Ae.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Ae.spotLightMatrix.value=B.state.spotLightMatrix,Ae.spotLightMap.value=B.state.spotLightMap,Ae.pointShadowMatrix.value=B.state.pointShadowMatrix;return k.lightProbeGrid=w.state.lightProbeGridArray.length>0,k.currentProgram=Ve,k.uniformsList=null,Ve}function Sh(b){if(b.uniformsList===null){let D=b.currentProgram.getUniforms();b.uniformsList=co.seqWithValue(D.seq,b.uniforms)}return b.uniformsList}function Mh(b,D){let G=I.get(b);G.outputColorSpace=D.outputColorSpace,G.batching=D.batching,G.batchingColor=D.batchingColor,G.instancing=D.instancing,G.instancingColor=D.instancingColor,G.instancingMorph=D.instancingMorph,G.skinning=D.skinning,G.morphTargets=D.morphTargets,G.morphNormals=D.morphNormals,G.morphColors=D.morphColors,G.morphTargetsCount=D.morphTargetsCount,G.numClippingPlanes=D.numClippingPlanes,G.numIntersection=D.numClipIntersection,G.vertexAlphas=D.vertexAlphas,G.vertexTangents=D.vertexTangents,G.toneMapping=D.toneMapping}function Y0(b,D){if(b.length===0)return null;if(b.length===1)return b[0].texture!==null?b[0]:null;T.setFromMatrixPosition(D.matrixWorld);for(let G=0,k=b.length;G<k;G++){let B=b[G];if(B.texture!==null&&B.boundingBox.containsPoint(T))return B}return null}function j0(b,D,G,k,B){if(D.isScene!==!0)D=Ht;W.resetTextureUnits();let ge=D.fog,be=k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial?D.environment:null,pe=U===null?S.outputColorSpace:U.isXRRenderTarget===!0?U.texture.colorSpace:We.workingColorSpace,Se=k.isMeshStandardMaterial||k.isMeshLambertMaterial&&!k.envMap||k.isMeshPhongMaterial&&!k.envMap,Ee=te.get(k.envMap||be,Se),Be=k.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Ve=!!G.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),Ae=!!G.morphAttributes.position,ot=!!G.morphAttributes.normal,Tt=!!G.morphAttributes.color,Mt=Un;if(k.toneMapped){if(U===null||U.isXRRenderTarget===!0)Mt=S.toneMapping}let lt=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,$t=lt!==void 0?lt.length:0,ye=I.get(k),on=w.state.lights;if(Ye===!0){if(Je===!0||b!==Q){let dt=b===Q&&k.id===K;re.setState(k,b,dt)}}let Qe=!1;if(k.version===ye.__version){if(ye.needsLights&&ye.lightsStateVersion!==on.state.version)Qe=!0;else if(ye.outputColorSpace!==pe)Qe=!0;else if(B.isBatchedMesh&&ye.batching===!1)Qe=!0;else if(!B.isBatchedMesh&&ye.batching===!0)Qe=!0;else if(B.isBatchedMesh&&ye.batchingColor===!0&&B.colorTexture===null)Qe=!0;else if(B.isBatchedMesh&&ye.batchingColor===!1&&B.colorTexture!==null)Qe=!0;else if(B.isInstancedMesh&&ye.instancing===!1)Qe=!0;else if(!B.isInstancedMesh&&ye.instancing===!0)Qe=!0;else if(B.isSkinnedMesh&&ye.skinning===!1)Qe=!0;else if(!B.isSkinnedMesh&&ye.skinning===!0)Qe=!0;else if(B.isInstancedMesh&&ye.instancingColor===!0&&B.instanceColor===null)Qe=!0;else if(B.isInstancedMesh&&ye.instancingColor===!1&&B.instanceColor!==null)Qe=!0;else if(B.isInstancedMesh&&ye.instancingMorph===!0&&B.morphTexture===null)Qe=!0;else if(B.isInstancedMesh&&ye.instancingMorph===!1&&B.morphTexture!==null)Qe=!0;else if(ye.envMap!==Ee)Qe=!0;else if(k.fog===!0&&ye.fog!==ge)Qe=!0;else if(ye.numClippingPlanes!==void 0&&(ye.numClippingPlanes!==re.numPlanes||ye.numIntersection!==re.numIntersection))Qe=!0;else if(ye.vertexAlphas!==Be)Qe=!0;else if(ye.vertexTangents!==Ve)Qe=!0;else if(ye.morphTargets!==Ae)Qe=!0;else if(ye.morphNormals!==ot)Qe=!0;else if(ye.morphColors!==Tt)Qe=!0;else if(ye.toneMapping!==Mt)Qe=!0;else if(ye.morphTargetsCount!==$t)Qe=!0;else if(!!ye.lightProbeGrid!==w.state.lightProbeGridArray.length>0)Qe=!0}else Qe=!0,ye.__version=k.version;let xn=ye.currentProgram;if(Qe===!0){if(xn=xo(k,D,B),C&&k.isNodeMaterial)C.onUpdateProgram(k,xn,ye)}let Bn=!1,xi=!1,wr=!1,ut=xn.getUniforms(),Et=ye.uniforms;if(M.useProgram(xn.program))Bn=!0,xi=!0,wr=!0;if(k.id!==K)K=k.id,xi=!0;if(ye.needsLights){let dt=Y0(w.state.lightProbeGridArray,B);if(ye.lightProbeGrid!==dt)ye.lightProbeGrid=dt,xi=!0}if(Bn||Q!==b){if(M.buffers.depth.getReversed()&&b.reversedDepth!==!0)b._reversedDepth=!0,b.updateProjectionMatrix();ut.setValue(L,"projectionMatrix",b.projectionMatrix),ut.setValue(L,"viewMatrix",b.matrixWorldInverse);let yi=ut.map.cameraPosition;if(yi!==void 0)yi.setValue(L,gn.setFromMatrixPosition(b.matrixWorld));if(gt.logarithmicDepthBuffer)ut.setValue(L,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2));if(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)ut.setValue(L,"isOrthographic",b.isOrthographicCamera===!0);if(Q!==b)Q=b,xi=!0,wr=!0}if(ye.needsLights){if(on.state.directionalShadowMap.length>0)ut.setValue(L,"directionalShadowMap",on.state.directionalShadowMap,W);if(on.state.spotShadowMap.length>0)ut.setValue(L,"spotShadowMap",on.state.spotShadowMap,W);if(on.state.pointShadowMap.length>0)ut.setValue(L,"pointShadowMap",on.state.pointShadowMap,W)}if(B.isSkinnedMesh){ut.setOptional(L,B,"bindMatrix"),ut.setOptional(L,B,"bindMatrixInverse");let dt=B.skeleton;if(dt){if(dt.boneTexture===null)dt.computeBoneTexture();ut.setValue(L,"boneTexture",dt.boneTexture,W)}}if(B.isBatchedMesh){if(ut.setOptional(L,B,"batchingTexture"),ut.setValue(L,"batchingTexture",B._matricesTexture,W),ut.setOptional(L,B,"batchingIdTexture"),ut.setValue(L,"batchingIdTexture",B._indirectTexture,W),ut.setOptional(L,B,"batchingColorTexture"),B._colorsTexture!==null)ut.setValue(L,"batchingColorTexture",B._colorsTexture,W)}let vi=G.morphAttributes;if(vi.position!==void 0||vi.normal!==void 0||vi.color!==void 0)et.update(B,G,xn);if(xi||ye.receiveShadow!==B.receiveShadow)ye.receiveShadow=B.receiveShadow,ut.setValue(L,"receiveShadow",B.receiveShadow);if((k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial)&&k.envMap===null&&D.environment!==null)Et.envMapIntensity.value=D.environmentIntensity;if(Et.dfgLUT!==void 0)Et.dfgLUT.value=FT();if(xi){if(ut.setValue(L,"toneMappingExposure",S.toneMappingExposure),ye.needsLights)J0(Et,wr);if(ge&&k.fog===!0)xe.refreshFogUniforms(Et,ge);if(xe.refreshMaterialUniforms(Et,k,fe,ne,w.state.transmissionRenderTarget[b.id]),ye.needsLights&&ye.lightProbeGrid){let dt=ye.lightProbeGrid;Et.probesSH.value=dt.texture,Et.probesMin.value.copy(dt.boundingBox.min),Et.probesMax.value.copy(dt.boundingBox.max),Et.probesResolution.value.copy(dt.resolution)}co.upload(L,Sh(ye),Et,W)}if(k.isShaderMaterial&&k.uniformsNeedUpdate===!0)co.upload(L,Sh(ye),Et,W),k.uniformsNeedUpdate=!1;if(k.isSpriteMaterial)ut.setValue(L,"center",B.center);if(ut.setValue(L,"modelViewMatrix",B.modelViewMatrix),ut.setValue(L,"normalMatrix",B.normalMatrix),ut.setValue(L,"modelMatrix",B.matrixWorld),k.uniformsGroups!==void 0){let dt=k.uniformsGroups;for(let yi=0,Tr=dt.length;yi<Tr;yi++){let wh=dt[yi];ve.update(wh,xn),ve.bind(wh,xn)}}return xn}function J0(b,D){b.ambientLightColor.needsUpdate=D,b.lightProbe.needsUpdate=D,b.directionalLights.needsUpdate=D,b.directionalLightShadows.needsUpdate=D,b.pointLights.needsUpdate=D,b.pointLightShadows.needsUpdate=D,b.spotLights.needsUpdate=D,b.spotLightShadows.needsUpdate=D,b.rectAreaLights.needsUpdate=D,b.hemisphereLights.needsUpdate=D}function K0(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}if(this.getActiveCubeFace=function(){return H},this.getActiveMipmapLevel=function(){return V},this.getRenderTarget=function(){return U},this.setRenderTargetTextures=function(b,D,G){let k=I.get(b);if(k.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,k.__autoAllocateDepthBuffer===!1)k.__useRenderToTexture=!1;I.get(b.texture).__webglTexture=D,I.get(b.depthTexture).__webglTexture=k.__autoAllocateDepthBuffer?void 0:G,k.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,D){let G=I.get(b);G.__webglFramebuffer=D,G.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(b,D=0,G=0){U=b,H=D,V=G;let k=null,B=!1,ge=!1;if(b){let pe=I.get(b);if(pe.__useDefaultFramebuffer!==void 0){M.bindFramebuffer(L.FRAMEBUFFER,pe.__webglFramebuffer),se.copy(b.viewport),me.copy(b.scissor),_e=b.scissorTest,M.viewport(se),M.scissor(me),M.setScissorTest(_e),K=-1;return}else if(pe.__webglFramebuffer===void 0)W.setupRenderTarget(b);else if(pe.__hasExternalTextures)W.rebindTextures(b,I.get(b.texture).__webglTexture,I.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){let Be=b.depthTexture;if(pe.__boundDepthTexture!==Be){if(Be!==null&&I.has(Be)&&(b.width!==Be.image.width||b.height!==Be.image.height))throw Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");W.setupDepthRenderbuffer(b)}}let Se=b.texture;if(Se.isData3DTexture||Se.isDataArrayTexture||Se.isCompressedArrayTexture)ge=!0;let Ee=I.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget){if(Array.isArray(Ee[D]))k=Ee[D][G];else k=Ee[D];B=!0}else if(b.samples>0&&W.useMultisampledRTT(b)===!1)k=I.get(b).__webglMultisampledFramebuffer;else if(Array.isArray(Ee))k=Ee[G];else k=Ee;se.copy(b.viewport),me.copy(b.scissor),_e=b.scissorTest}else se.copy(Ze).multiplyScalar(fe).floor(),me.copy(Oe).multiplyScalar(fe).floor(),_e=ke;if(G!==0)k=z;if(M.bindFramebuffer(L.FRAMEBUFFER,k))M.drawBuffers(b,k);if(M.viewport(se),M.scissor(me),M.setScissorTest(_e),B){let pe=I.get(b.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+D,pe.__webglTexture,G)}else if(ge){let pe=D;for(let Se=0;Se<b.textures.length;Se++){let Ee=I.get(b.textures[Se]);L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0+Se,Ee.__webglTexture,G,pe)}}else if(b!==null&&G!==0){let pe=I.get(b.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,pe.__webglTexture,G)}K=-1},this.readRenderTargetPixels=function(b,D,G,k,B,ge,be,pe=0){if(!(b&&b.isWebGLRenderTarget)){Ne("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Se=I.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&be!==void 0)Se=Se[be];if(Se){M.bindFramebuffer(L.FRAMEBUFFER,Se);try{let Ee=b.textures[pe],{format:Be,type:Ve}=Ee;if(b.textures.length>1)L.readBuffer(L.COLOR_ATTACHMENT0+pe);if(!gt.textureFormatReadable(Be)){Ne("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!gt.textureTypeReadable(Ve)){Ne("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}if(D>=0&&D<=b.width-k&&(G>=0&&G<=b.height-B))L.readPixels(D,G,k,B,Y.convert(Be),Y.convert(Ve),ge)}finally{let Ee=U!==null?I.get(U).__webglFramebuffer:null;M.bindFramebuffer(L.FRAMEBUFFER,Ee)}}},this.readRenderTargetPixelsAsync=async function(b,D,G,k,B,ge,be,pe=0){if(!(b&&b.isWebGLRenderTarget))throw Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Se=I.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&be!==void 0)Se=Se[be];if(Se)if(D>=0&&D<=b.width-k&&(G>=0&&G<=b.height-B)){M.bindFramebuffer(L.FRAMEBUFFER,Se);let Ee=b.textures[pe],{format:Be,type:Ve}=Ee;if(b.textures.length>1)L.readBuffer(L.COLOR_ATTACHMENT0+pe);if(!gt.textureFormatReadable(Be))throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!gt.textureTypeReadable(Ve))throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ae=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,Ae),L.bufferData(L.PIXEL_PACK_BUFFER,ge.byteLength,L.STREAM_READ),L.readPixels(D,G,k,B,Y.convert(Be),Y.convert(Ve),0);let ot=U!==null?I.get(U).__webglFramebuffer:null;M.bindFramebuffer(L.FRAMEBUFFER,ot);let Tt=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await d_(L,Tt,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,Ae),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,ge),L.deleteBuffer(Ae),L.deleteSync(Tt),ge}else throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,D=null,G=0){let k=Math.pow(2,-G),B=Math.floor(b.image.width*k),ge=Math.floor(b.image.height*k),be=D!==null?D.x:0,pe=D!==null?D.y:0;W.setTexture2D(b,0),L.copyTexSubImage2D(L.TEXTURE_2D,G,0,0,be,pe,B,ge),M.unbindTexture()},this.copyTextureToTexture=function(b,D,G=null,k=null,B=0,ge=0){let be,pe,Se,Ee,Be,Ve,Ae,ot,Tt,Mt=b.isCompressedTexture?b.mipmaps[ge]:b.image;if(G!==null)be=G.max.x-G.min.x,pe=G.max.y-G.min.y,Se=G.isBox3?G.max.z-G.min.z:1,Ee=G.min.x,Be=G.min.y,Ve=G.isBox3?G.min.z:0;else{let Et=Math.pow(2,-B);if(be=Math.floor(Mt.width*Et),pe=Math.floor(Mt.height*Et),b.isDataArrayTexture)Se=Mt.depth;else if(b.isData3DTexture)Se=Math.floor(Mt.depth*Et);else Se=1;Ee=0,Be=0,Ve=0}if(k!==null)Ae=k.x,ot=k.y,Tt=k.z;else Ae=0,ot=0,Tt=0;let lt=Y.convert(D.format),$t=Y.convert(D.type),ye;if(D.isData3DTexture)W.setTexture3D(D,0),ye=L.TEXTURE_3D;else if(D.isDataArrayTexture||D.isCompressedArrayTexture)W.setTexture2DArray(D,0),ye=L.TEXTURE_2D_ARRAY;else W.setTexture2D(D,0),ye=L.TEXTURE_2D;M.activeTexture(L.TEXTURE0),M.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,D.flipY),M.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),M.pixelStorei(L.UNPACK_ALIGNMENT,D.unpackAlignment);let on=M.getParameter(L.UNPACK_ROW_LENGTH),Qe=M.getParameter(L.UNPACK_IMAGE_HEIGHT),xn=M.getParameter(L.UNPACK_SKIP_PIXELS),Bn=M.getParameter(L.UNPACK_SKIP_ROWS),xi=M.getParameter(L.UNPACK_SKIP_IMAGES);M.pixelStorei(L.UNPACK_ROW_LENGTH,Mt.width),M.pixelStorei(L.UNPACK_IMAGE_HEIGHT,Mt.height),M.pixelStorei(L.UNPACK_SKIP_PIXELS,Ee),M.pixelStorei(L.UNPACK_SKIP_ROWS,Be),M.pixelStorei(L.UNPACK_SKIP_IMAGES,Ve);let wr=b.isDataArrayTexture||b.isData3DTexture,ut=D.isDataArrayTexture||D.isData3DTexture;if(b.isDepthTexture){let Et=I.get(b),vi=I.get(D),dt=I.get(Et.__renderTarget),yi=I.get(vi.__renderTarget);M.bindFramebuffer(L.READ_FRAMEBUFFER,dt.__webglFramebuffer),M.bindFramebuffer(L.DRAW_FRAMEBUFFER,yi.__webglFramebuffer);for(let Tr=0;Tr<Se;Tr++){if(wr)L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,I.get(b).__webglTexture,B,Ve+Tr),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,I.get(D).__webglTexture,ge,Tt+Tr);L.blitFramebuffer(Ee,Be,be,pe,Ae,ot,be,pe,L.DEPTH_BUFFER_BIT,L.NEAREST)}M.bindFramebuffer(L.READ_FRAMEBUFFER,null),M.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(B!==0||b.isRenderTargetTexture||I.has(b)){let Et=I.get(b),vi=I.get(D);M.bindFramebuffer(L.READ_FRAMEBUFFER,J),M.bindFramebuffer(L.DRAW_FRAMEBUFFER,O);for(let dt=0;dt<Se;dt++){if(wr)L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Et.__webglTexture,B,Ve+dt);else L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,Et.__webglTexture,B);if(ut)L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,vi.__webglTexture,ge,Tt+dt);else L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,vi.__webglTexture,ge);if(B!==0)L.blitFramebuffer(Ee,Be,be,pe,Ae,ot,be,pe,L.COLOR_BUFFER_BIT,L.NEAREST);else if(ut)L.copyTexSubImage3D(ye,ge,Ae,ot,Tt+dt,Ee,Be,be,pe);else L.copyTexSubImage2D(ye,ge,Ae,ot,Ee,Be,be,pe)}M.bindFramebuffer(L.READ_FRAMEBUFFER,null),M.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(ut)if(b.isDataTexture||b.isData3DTexture)L.texSubImage3D(ye,ge,Ae,ot,Tt,be,pe,Se,lt,$t,Mt.data);else if(D.isCompressedArrayTexture)L.compressedTexSubImage3D(ye,ge,Ae,ot,Tt,be,pe,Se,lt,Mt.data);else L.texSubImage3D(ye,ge,Ae,ot,Tt,be,pe,Se,lt,$t,Mt);else if(b.isDataTexture)L.texSubImage2D(L.TEXTURE_2D,ge,Ae,ot,be,pe,lt,$t,Mt.data);else if(b.isCompressedTexture)L.compressedTexSubImage2D(L.TEXTURE_2D,ge,Ae,ot,Mt.width,Mt.height,lt,Mt.data);else L.texSubImage2D(L.TEXTURE_2D,ge,Ae,ot,be,pe,lt,$t,Mt);if(M.pixelStorei(L.UNPACK_ROW_LENGTH,on),M.pixelStorei(L.UNPACK_IMAGE_HEIGHT,Qe),M.pixelStorei(L.UNPACK_SKIP_PIXELS,xn),M.pixelStorei(L.UNPACK_SKIP_ROWS,Bn),M.pixelStorei(L.UNPACK_SKIP_IMAGES,xi),ge===0&&D.generateMipmaps)L.generateMipmap(ye);M.unbindTexture()},this.initRenderTarget=function(b){if(I.get(b).__webglFramebuffer===void 0)W.setupRenderTarget(b)},this.initTexture=function(b){if(b.isCubeTexture)W.setTextureCube(b,0);else if(b.isData3DTexture)W.setTexture3D(b,0);else if(b.isDataArrayTexture||b.isCompressedArrayTexture)W.setTexture2DArray(b,0);else W.setTexture2D(b,0);M.unbindTexture()},this.resetState=function(){H=0,V=0,U=null,M.reset(),ae.reset()},typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return bu}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=We._getDrawingBufferColorSpace(e),t.unpackColorSpace=We._getUnpackColorSpace()}}function eh(e,t){if(t===_u)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),e;if(t===Qr||t===Ws){let n=e.getIndex();if(n===null){let o=[],a=e.getAttribute("position");if(a!==void 0){for(let c=0;c<a.count;c++)o.push(c);e.setIndex(o),n=e.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),e}let i=n.count-2,r=[];if(t===Qr)for(let o=1;o<=i;o++)r.push(n.getX(0)),r.push(n.getX(o)),r.push(n.getX(o+1));else for(let o=0;o<i;o++)if(o%2===0)r.push(n.getX(o)),r.push(n.getX(o+1)),r.push(n.getX(o+2));else r.push(n.getX(o+2)),r.push(n.getX(o+1)),r.push(n.getX(o));if(r.length/3!==i)console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let s=e.clone();return s.setIndex(r),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",t),e}function s0(e){let t=new Map,n=new Map,i=e.clone();return o0(e,i,function(r,s){t.set(s,r),n.set(r,s)}),i.traverse(function(r){if(!r.isSkinnedMesh)return;let s=r,o=t.get(r),a=o.skeleton.bones;s.skeleton=o.skeleton.clone(),s.bindMatrix.copy(o.bindMatrix),s.skeleton.bones=a.map(function(c){return n.get(c)}),s.bind(s.skeleton,s.bindMatrix)}),i}function o0(e,t,n){n(e,t);for(let i=0;i<e.children.length;i++)o0(e.children[i],t.children[i],n)}class ah extends _i{constructor(e){super(e);this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new p0(t)}),this.register(function(t){return new m0(t)}),this.register(function(t){return new w0(t)}),this.register(function(t){return new T0(t)}),this.register(function(t){return new E0(t)}),this.register(function(t){return new _0(t)}),this.register(function(t){return new x0(t)}),this.register(function(t){return new v0(t)}),this.register(function(t){return new y0(t)}),this.register(function(t){return new d0(t)}),this.register(function(t){return new b0(t)}),this.register(function(t){return new g0(t)}),this.register(function(t){return new M0(t)}),this.register(function(t){return new S0(t)}),this.register(function(t){return new h0(t)}),this.register(function(t){return new rh(t,Xe.EXT_MESHOPT_COMPRESSION)}),this.register(function(t){return new rh(t,Xe.KHR_MESHOPT_COMPRESSION)}),this.register(function(t){return new A0(t)})}load(e,t,n,i){let r=this,s;if(this.resourcePath!=="")s=this.resourcePath;else if(this.path!==""){let c=Zi.extractUrlBase(e);s=Zi.resolveURL(c,this.path)}else s=Zi.extractUrlBase(e);this.manager.itemStart(e);let o=function(c){if(i)i(c);else console.error(c);r.manager.itemError(e),r.manager.itemEnd(e)},a=new io(this.manager);a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(c){try{r.parse(c,s,function(l){t(l),r.manager.itemEnd(e)},o)}catch(l){o(l)}},n,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){if(this.pluginCallbacks.indexOf(e)===-1)this.pluginCallbacks.push(e);return this}unregister(e){if(this.pluginCallbacks.indexOf(e)!==-1)this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1);return this}parse(e,t,n,i){let r,s={},o={},a=new TextDecoder;if(typeof e==="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(a.decode(new Uint8Array(e,0,4))===R0){try{s[Xe.KHR_BINARY_GLTF]=new C0(e)}catch(u){if(i)i(u);return}r=JSON.parse(s[Xe.KHR_BINARY_GLTF].content)}else r=JSON.parse(a.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){if(i)i(Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let c=new D0(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let l=0;l<this.pluginCallbacks.length;l++){let u=this.pluginCallbacks[l](c);if(!u.name)console.error("THREE.GLTFLoader: Invalid plugin found: missing name");o[u.name]=u,s[u.name]=!0}if(r.extensionsUsed)for(let l=0;l<r.extensionsUsed.length;++l){let u=r.extensionsUsed[l],f=r.extensionsRequired||[];switch(u){case Xe.KHR_MATERIALS_UNLIT:s[u]=new f0;break;case Xe.KHR_DRACO_MESH_COMPRESSION:s[u]=new I0(r,this.dracoLoader);break;case Xe.KHR_TEXTURE_TRANSFORM:s[u]=new P0;break;case Xe.KHR_MESH_QUANTIZATION:s[u]=new L0;break;default:if(f.indexOf(u)>=0&&o[u]===void 0)console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(s),c.setPlugins(o),c.parse(n,i)}parseAsync(e,t){let n=this;return new Promise(function(i,r){n.parse(e,t,i,r)})}}function kT(){let e={};return{get:function(t){return e[t]},add:function(t,n){e[t]=n},remove:function(t){delete e[t]},removeAll:function(){e={}}}}function Rt(e,t,n){let i=e.json.materials[t];if(i.extensions&&i.extensions[n])return i.extensions[n];return null}var Xe={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class h0{constructor(e){this.parser=e,this.name=Xe.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let n=0,i=t.length;n<i;n++){let r=t[n];if(r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0)e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,n="light:"+e,i=t.cache.get(n);if(i)return i;let r=t.json,a=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e],c,l=new Le(16777215);if(a.color!==void 0)l.setRGB(a.color[0],a.color[1],a.color[2],hn);let u=a.range!==void 0?a.range:0;switch(a.type){case"directional":c=new os(l),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new ss(l),c.distance=u;break;case"spot":c=new $a(l),c.distance=u,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,c.angle=a.spot.outerConeAngle,c.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}if(c.position.set(0,0,0),ti(c,a),a.intensity!==void 0)c.intensity=a.intensity;return c.name=t.createUniqueName(a.name||"light_"+e),i=Promise.resolve(c),t.cache.add(n,i),i}getDependency(e,t){if(e!=="light")return;return this._loadLight(t)}createNodeAttachment(e){let t=this,n=this.parser,r=n.json.nodes[e],o=(r.extensions&&r.extensions[this.name]||{}).light;if(o===void 0)return null;return this._loadLight(o).then(function(a){return n._getNodeRef(t.cache,o,a)})}}class f0{constructor(){this.name=Xe.KHR_MATERIALS_UNLIT}getMaterialType(){return Kn}extendParams(e,t,n){let i=[];e.color=new Le(1,1,1),e.opacity=1;let r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){let s=r.baseColorFactor;e.color.setRGB(s[0],s[1],s[2],hn),e.opacity=s[3]}if(r.baseColorTexture!==void 0)i.push(n.assignTexture(e,"map",r.baseColorTexture,Fi))}return Promise.all(i)}}class d0{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();if(n.emissiveStrength!==void 0)t.emissiveIntensity=n.emissiveStrength;return Promise.resolve()}}class p0{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?dn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(n.clearcoatFactor!==void 0)t.clearcoat=n.clearcoatFactor;if(n.clearcoatTexture!==void 0)i.push(this.parser.assignTexture(t,"clearcoatMap",n.clearcoatTexture));if(n.clearcoatRoughnessFactor!==void 0)t.clearcoatRoughness=n.clearcoatRoughnessFactor;if(n.clearcoatRoughnessTexture!==void 0)i.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",n.clearcoatRoughnessTexture));if(n.clearcoatNormalTexture!==void 0){if(i.push(this.parser.assignTexture(t,"clearcoatNormalMap",n.clearcoatNormalTexture)),n.clearcoatNormalTexture.scale!==void 0){let r=n.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new Ie(r,r)}}return Promise.all(i)}}class m0{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_DISPERSION}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?dn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();return t.dispersion=n.dispersion!==void 0?n.dispersion:0,Promise.resolve()}}class g0{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?dn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(n.iridescenceFactor!==void 0)t.iridescence=n.iridescenceFactor;if(n.iridescenceTexture!==void 0)i.push(this.parser.assignTexture(t,"iridescenceMap",n.iridescenceTexture));if(n.iridescenceIor!==void 0)t.iridescenceIOR=n.iridescenceIor;if(t.iridescenceThicknessRange===void 0)t.iridescenceThicknessRange=[100,400];if(n.iridescenceThicknessMinimum!==void 0)t.iridescenceThicknessRange[0]=n.iridescenceThicknessMinimum;if(n.iridescenceThicknessMaximum!==void 0)t.iridescenceThicknessRange[1]=n.iridescenceThicknessMaximum;if(n.iridescenceThicknessTexture!==void 0)i.push(this.parser.assignTexture(t,"iridescenceThicknessMap",n.iridescenceThicknessTexture));return Promise.all(i)}}class _0{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_SHEEN}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?dn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(t.sheenColor=new Le(0,0,0),t.sheenRoughness=0,t.sheen=1,n.sheenColorFactor!==void 0){let r=n.sheenColorFactor;t.sheenColor.setRGB(r[0],r[1],r[2],hn)}if(n.sheenRoughnessFactor!==void 0)t.sheenRoughness=n.sheenRoughnessFactor;if(n.sheenColorTexture!==void 0)i.push(this.parser.assignTexture(t,"sheenColorMap",n.sheenColorTexture,Fi));if(n.sheenRoughnessTexture!==void 0)i.push(this.parser.assignTexture(t,"sheenRoughnessMap",n.sheenRoughnessTexture));return Promise.all(i)}}class x0{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?dn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(n.transmissionFactor!==void 0)t.transmission=n.transmissionFactor;if(n.transmissionTexture!==void 0)i.push(this.parser.assignTexture(t,"transmissionMap",n.transmissionTexture));return Promise.all(i)}}class v0{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_VOLUME}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?dn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(t.thickness=n.thicknessFactor!==void 0?n.thicknessFactor:0,n.thicknessTexture!==void 0)i.push(this.parser.assignTexture(t,"thicknessMap",n.thicknessTexture));t.attenuationDistance=n.attenuationDistance||1/0;let r=n.attenuationColor||[1,1,1];return t.attenuationColor=new Le().setRGB(r[0],r[1],r[2],hn),Promise.all(i)}}class y0{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_IOR}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?dn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();if(t.ior=n.ior!==void 0?n.ior:1.5,t.ior===0)t.ior=1000;return Promise.resolve()}}class b0{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_SPECULAR}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?dn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(t.specularIntensity=n.specularFactor!==void 0?n.specularFactor:1,n.specularTexture!==void 0)i.push(this.parser.assignTexture(t,"specularIntensityMap",n.specularTexture));let r=n.specularColorFactor||[1,1,1];if(t.specularColor=new Le().setRGB(r[0],r[1],r[2],hn),n.specularColorTexture!==void 0)i.push(this.parser.assignTexture(t,"specularColorMap",n.specularColorTexture,Fi));return Promise.all(i)}}class S0{constructor(e){this.parser=e,this.name=Xe.EXT_MATERIALS_BUMP}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?dn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(t.bumpScale=n.bumpFactor!==void 0?n.bumpFactor:1,n.bumpTexture!==void 0)i.push(this.parser.assignTexture(t,"bumpMap",n.bumpTexture));return Promise.all(i)}}class M0{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?dn:null}extendMaterialParams(e,t){let n=Rt(this.parser,e,this.name);if(n===null)return Promise.resolve();let i=[];if(n.anisotropyStrength!==void 0)t.anisotropy=n.anisotropyStrength;if(n.anisotropyRotation!==void 0)t.anisotropyRotation=n.anisotropyRotation;if(n.anisotropyTexture!==void 0)i.push(this.parser.assignTexture(t,"anisotropyMap",n.anisotropyTexture));return Promise.all(i)}}class w0{constructor(e){this.parser=e,this.name=Xe.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,n=t.json,i=n.textures[e];if(!i.extensions||!i.extensions[this.name])return null;let r=i.extensions[this.name],s=t.options.ktx2Loader;if(!s)if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");else return null;return t.loadTextureImage(e,r.source,s)}}class T0{constructor(e){this.parser=e,this.name=Xe.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;let s=r.extensions[t],o=i.images[s.source],a=n.textureLoader;if(o.uri){let c=n.options.manager.getHandler(o.uri);if(c!==null)a=c}return n.loadTextureImage(e,s.source,a)}}class E0{constructor(e){this.parser=e,this.name=Xe.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;let s=r.extensions[t],o=i.images[s.source],a=n.textureLoader;if(o.uri){let c=n.options.manager.getHandler(o.uri);if(c!==null)a=c}return n.loadTextureImage(e,s.source,a)}}class rh{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){let t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){let i=n.extensions[this.name],r=this.parser.getDependency("buffer",i.buffer),s=this.parser.options.meshoptDecoder;if(!s||!s.supported)if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");else return null;return r.then(function(o){let a=i.byteOffset||0,c=i.byteLength||0,{count:l,byteStride:u}=i,f=new Uint8Array(o,a,c);if(s.decodeGltfBufferAsync)return s.decodeGltfBufferAsync(l,u,f,i.mode,i.filter).then(function(h){return h.buffer});else return s.ready.then(function(){let h=new ArrayBuffer(l*u);return s.decodeGltfBuffer(new Uint8Array(h),l,u,f,i.mode,i.filter),h})})}else return null}}class A0{constructor(e){this.name=Xe.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;let i=t.meshes[n.mesh];for(let c of i.primitives)if(c.mode!==wn.TRIANGLES&&c.mode!==wn.TRIANGLE_STRIP&&c.mode!==wn.TRIANGLE_FAN&&c.mode!==void 0)return null;let s=n.extensions[this.name].attributes,o=[],a={};for(let c in s)o.push(this.parser.getDependency("accessor",s[c]).then((l)=>(a[c]=l,a[c])));if(o.length<1)return null;return o.push(this.parser.createNodeMesh(e)),Promise.all(o).then((c)=>{let l=c.pop(),u=l.isGroup?l.children:[l],f=c[0].count,h=[];for(let d of u){let g=new ze,y=new N,p=new Bt,m=new N(1,1,1),A=new ns(d.geometry,d.material,f);for(let T=0;T<f;T++){if(a.TRANSLATION)y.fromBufferAttribute(a.TRANSLATION,T);if(a.ROTATION)p.fromBufferAttribute(a.ROTATION,T);if(a.SCALE)m.fromBufferAttribute(a.SCALE,T);A.setMatrixAt(T,g.compose(y,p,m))}for(let T in a)if(T==="_COLOR_0"){let v=a[T];A.instanceColor=new lr(v.array,v.itemSize,v.normalized)}else if(T!=="TRANSLATION"&&T!=="ROTATION"&&T!=="SCALE")d.geometry.setAttribute(T,a[T]);at.prototype.copy.call(A,d),this.parser.assignFinalMaterial(A),h.push(A)}if(l.isGroup)return l.clear(),l.add(...h),l;return h[0]})}}var R0="glTF",uo=12,a0={JSON:1313821514,BIN:5130562};class C0{constructor(e){this.name=Xe.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,uo),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==R0)throw Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");else if(this.header.version<2)throw Error("THREE.GLTFLoader: Legacy binary file detected.");let i=this.header.length-uo,r=new DataView(e,uo),s=0;while(s<i){let o=r.getUint32(s,!0);s+=4;let a=r.getUint32(s,!0);if(s+=4,a===a0.JSON){let c=new Uint8Array(e,uo+s,o);this.content=n.decode(c)}else if(a===a0.BIN){let c=uo+s;this.body=e.slice(c,c+o)}s+=o}if(this.content===null)throw Error("THREE.GLTFLoader: JSON content not found.")}}class I0{constructor(e,t){if(!t)throw Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Xe.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let n=this.json,i=this.dracoLoader,r=e.extensions[this.name].bufferView,s=e.extensions[this.name].attributes,o={},a={},c={};for(let l in s){let u=sh[l]||l.toLowerCase();o[u]=s[l]}for(let l in e.attributes){let u=sh[l]||l.toLowerCase();if(s[l]!==void 0){let f=n.accessors[e.attributes[l]],h=ls[f.componentType];c[u]=h.name,a[u]=f.normalized===!0}}return t.getDependency("bufferView",r).then(function(l){return new Promise(function(u,f){i.decodeDracoFile(l,function(h){for(let d in h.attributes){let g=h.attributes[d],y=a[d];if(y!==void 0)g.normalized=y}u(h)},o,c,hn,f)})})}}class P0{constructor(){this.name=Xe.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){if((t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0)return e;if(e=e.clone(),t.texCoord!==void 0)e.channel=t.texCoord;if(t.offset!==void 0)e.offset.fromArray(t.offset);if(t.rotation!==void 0)e.rotation=t.rotation;if(t.scale!==void 0)e.repeat.fromArray(t.scale);return e.needsUpdate=!0,e}}class L0{constructor(){this.name=Xe.KHR_MESH_QUANTIZATION}}class ch extends gi{constructor(e,t,n,i){super(e,t,n,i)}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i*3+i;for(let s=0;s!==i;s++)t[s]=n[r+s];return t}interpolate_(e,t,n,i){let r=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=o*2,c=o*3,l=i-t,u=(n-t)/l,f=u*u,h=f*u,d=e*c,g=d-c,y=-2*h+3*f,p=h-f,m=1-y,A=p-f+u;for(let T=0;T!==o;T++){let v=s[g+T+o],w=s[g+T+a]*l,E=s[d+T+o],R=s[d+T]*l;r[T]=m*v+A*w+y*E+p*R}return r}}var BT=new Bt;class N0 extends ch{interpolate_(e,t,n,i){let r=super.interpolate_(e,t,n,i);return BT.fromArray(r).normalize().toArray(r),r}}var wn={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},ls={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},c0={9728:On,9729:Gt,9984:va,9985:Jr,9986:hr,9987:jn},l0={33071:jr,33648:xa,10497:Yr},th={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},sh={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},qi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},GT={CUBICSPLINE:void 0,LINEAR:Ea,STEP:gu},nh={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function HT(e){if(e.DefaultMaterial===void 0)e.DefaultMaterial=new mi({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Ui});return e.DefaultMaterial}function yr(e,t,n){for(let i in n.extensions)if(e[i]===void 0)t.userData.gltfExtensions=t.userData.gltfExtensions||{},t.userData.gltfExtensions[i]=n.extensions[i]}function ti(e,t){if(t.extras!==void 0)if(typeof t.extras==="object")Object.assign(e.userData,t.extras);else console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+t.extras)}function VT(e,t,n){let i=!1,r=!1,s=!1;for(let l=0,u=t.length;l<u;l++){let f=t[l];if(f.POSITION!==void 0)i=!0;if(f.NORMAL!==void 0)r=!0;if(f.COLOR_0!==void 0)s=!0;if(i&&r&&s)break}if(!i&&!r&&!s)return Promise.resolve(e);let o=[],a=[],c=[];for(let l=0,u=t.length;l<u;l++){let f=t[l];if(i){let h=f.POSITION!==void 0?n.getDependency("accessor",f.POSITION):e.attributes.position;o.push(h)}if(r){let h=f.NORMAL!==void 0?n.getDependency("accessor",f.NORMAL):e.attributes.normal;a.push(h)}if(s){let h=f.COLOR_0!==void 0?n.getDependency("accessor",f.COLOR_0):e.attributes.color;c.push(h)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c)]).then(function(l){let u=l[0],f=l[1],h=l[2];if(i)e.morphAttributes.position=u;if(r)e.morphAttributes.normal=f;if(s)e.morphAttributes.color=h;return e.morphTargetsRelative=!0,e})}function WT(e,t){if(e.updateMorphTargets(),t.weights!==void 0)for(let n=0,i=t.weights.length;n<i;n++)e.morphTargetInfluences[n]=t.weights[n];if(t.extras&&Array.isArray(t.extras.targetNames)){let n=t.extras.targetNames;if(e.morphTargetInfluences.length===n.length){e.morphTargetDictionary={};for(let i=0,r=n.length;i<r;i++)e.morphTargetDictionary[n[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function $T(e){let t,n=e.extensions&&e.extensions[Xe.KHR_DRACO_MESH_COMPRESSION];if(n)t="draco:"+n.bufferView+":"+n.indices+":"+ih(n.attributes);else t=e.indices+":"+ih(e.attributes)+":"+e.mode;if(e.targets!==void 0)for(let i=0,r=e.targets.length;i<r;i++)t+=":"+ih(e.targets[i]);return t}function ih(e){let t="",n=Object.keys(e).sort();for(let i=0,r=n.length;i<r;i++)t+=n[i]+":"+e[n[i]]+";";return t}function oh(e){switch(e){case Int8Array:return 0.007874015748031496;case Uint8Array:return 0.00392156862745098;case Int16Array:return 0.00003051850947599719;case Uint16Array:return 0.000015259021896696422;default:throw Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function ZT(e){if(e.search(/\.jpe?g($|\?)/i)>0||e.search(/^data\:image\/jpeg/)===0)return"image/jpeg";if(e.search(/\.webp($|\?)/i)>0||e.search(/^data\:image\/webp/)===0)return"image/webp";if(e.search(/\.ktx2($|\?)/i)>0||e.search(/^data\:image\/ktx2/)===0)return"image/ktx2";return"image/png"}var XT=new ze;class D0{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new kT,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,r=!1,s=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){let o=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(o)===!0;let a=o.match(/Version\/(\d+)/);i=n&&a?parseInt(a[1],10):-1,r=o.indexOf("Firefox")>-1,s=r?o.match(/Firefox\/([0-9]+)\./)[1]:-1}if(typeof createImageBitmap>"u"||n&&i<17||r&&s<98)this.textureLoader=new Ga(this.options.manager);else this.textureLoader=new Za(this.options.manager);if(this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new io(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials")this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let n=this,i=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(s){return s._markDefs&&s._markDefs()}),Promise.all(this._invokeAll(function(s){return s.beforeRoot&&s.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(s){let o={scene:s[0][i.scene||0],scenes:s[0],animations:s[1],cameras:s[2],asset:i.asset,parser:n,userData:{}};return yr(r,o,i),ti(o,i),Promise.all(n._invokeAll(function(a){return a.afterRoot&&a.afterRoot(o)})).then(function(){for(let a of o.scenes)a.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let i=0,r=t.length;i<r;i++){let s=t[i].joints;for(let o=0,a=s.length;o<a;o++)e[s[o]].isBone=!0}for(let i=0,r=e.length;i<r;i++){let s=e[i];if(s.mesh!==void 0){if(this._addNodeRef(this.meshCache,s.mesh),s.skin!==void 0)n[s.mesh].isSkinnedMesh=!0}if(s.camera!==void 0)this._addNodeRef(this.cameraCache,s.camera)}}_addNodeRef(e,t){if(t===void 0)return;if(e.refs[t]===void 0)e.refs[t]=e.uses[t]=0;e.refs[t]++}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;let i=n.clone(),r=(s,o)=>{let a=this.associations.get(s);if(a!=null)this.associations.set(o,a);for(let[c,l]of s.children.entries())r(l,o.children[c])};return r(n,i),i.name+="_instance_"+e.uses[t]++,i}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){let i=e(t[n]);if(i)return i}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let n=[];for(let i=0;i<t.length;i++){let r=e(t[i]);if(r)n.push(r)}return n}getDependency(e,t){let n=e+":"+t,i=this.cache.get(n);if(!i){switch(e){case"scene":i=this.loadScene(t);break;case"node":i=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":i=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":i=this.loadAccessor(t);break;case"bufferView":i=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":i=this.loadBuffer(t);break;case"material":i=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":i=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":i=this.loadSkin(t);break;case"animation":i=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":i=this.loadCamera(t);break;default:if(i=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!i)throw Error("Unknown type: "+e);break}this.cache.add(n,i)}return i}getDependencies(e){let t=this.cache.get(e);if(!t){let n=this,i=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(i.map(function(r,s){return n.getDependency(e,s)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[Xe.KHR_BINARY_GLTF].body);let i=this.options;return new Promise(function(r,s){n.load(Zi.resolveURL(t.uri,i.path),r,void 0,function(){s(Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){let i=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+i)})}loadAccessor(e){let t=this,n=this.json,i=this.json.accessors[e];if(i.bufferView===void 0&&i.sparse===void 0){let s=th[i.type],o=ls[i.componentType],a=i.normalized===!0,c=new o(i.count*s);return Promise.resolve(new Nt(c,s,a))}let r=[];if(i.bufferView!==void 0)r.push(this.getDependency("bufferView",i.bufferView));else r.push(null);if(i.sparse!==void 0)r.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",i.sparse.values.bufferView));return Promise.all(r).then(function(s){let o=s[0],a=th[i.type],c=ls[i.componentType],l=c.BYTES_PER_ELEMENT,u=l*a,f=i.byteOffset||0,h=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,d=i.normalized===!0,g,y;if(h&&h!==u){let p=Math.floor(f/h),m="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+p+":"+i.count,A=t.cache.get(m);if(!A)g=new c(o,p*h,i.count*h/l),A=new qs(g,h/l),t.cache.add(m,A);y=new ts(A,a,f%h/l,d)}else{if(o===null)g=new c(i.count*a);else g=new c(o,f,i.count*a);y=new Nt(g,a,d)}if(i.sparse!==void 0){let p=th.SCALAR,m=ls[i.sparse.indices.componentType],A=i.sparse.indices.byteOffset||0,T=i.sparse.values.byteOffset||0,v=new m(s[1],A,i.sparse.count*p),w=new c(s[2],T,i.sparse.count*a);if(o!==null)y=new Nt(y.array.slice(),y.itemSize,y.normalized);y.normalized=!1;for(let E=0,R=v.length;E<R;E++){let _=v[E];if(y.setX(_,w[E*a]),a>=2)y.setY(_,w[E*a+1]);if(a>=3)y.setZ(_,w[E*a+2]);if(a>=4)y.setW(_,w[E*a+3]);if(a>=5)throw Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}y.normalized=d}return y})}loadTexture(e){let t=this.json,n=this.options,r=t.textures[e].source,s=t.images[r],o=this.textureLoader;if(s.uri){let a=n.manager.getHandler(s.uri);if(a!==null)o=a}return this.loadTextureImage(e,r,o)}loadTextureImage(e,t,n){let i=this,r=this.json,s=r.textures[e],o=r.images[t],a=(o.uri||o.bufferView)+":"+s.sampler;if(this.textureCache[a])return this.textureCache[a];let c=this.loadImageSource(t,n).then(function(l){if(l.flipY=!1,l.name=s.name||o.name||"",l.name===""&&typeof o.uri==="string"&&o.uri.startsWith("data:image/")===!1)l.name=o.uri;let f=(r.samplers||{})[s.sampler]||{};return l.magFilter=c0[f.magFilter]||Gt,l.minFilter=c0[f.minFilter]||jn,l.wrapS=l0[f.wrapS]||Yr,l.wrapT=l0[f.wrapT]||Yr,l.generateMipmaps=!l.isCompressedTexture&&l.minFilter!==On&&l.minFilter!==Gt,i.associations.set(l,{textures:e}),l}).catch(function(){return null});return this.textureCache[a]=c,c}loadImageSource(e,t){let n=this,i=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then((u)=>u.clone());let s=i.images[e],o=self.URL||self.webkitURL,a=s.uri||"",c=!1;if(s.bufferView!==void 0)a=n.getDependency("bufferView",s.bufferView).then(function(u){c=!0;let f=new Blob([u],{type:s.mimeType});return a=o.createObjectURL(f),a});else if(s.uri===void 0)throw Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let l=Promise.resolve(a).then(function(u){return new Promise(function(f,h){let d=f;if(t.isImageBitmapLoader===!0)d=function(g){let y=new wt(g);y.needsUpdate=!0,f(y)};t.load(Zi.resolveURL(u,r.path),d,void 0,h)})}).then(function(u){if(c===!0)o.revokeObjectURL(a);return ti(u,s),u.userData.mimeType=s.mimeType||ZT(s.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",a),u});return this.sourceCache[e]=l,l}assignTexture(e,t,n,i){let r=this;return this.getDependency("texture",n.index).then(function(s){if(!s)return null;if(n.texCoord!==void 0&&n.texCoord>0)s=s.clone(),s.channel=n.texCoord;if(r.extensions[Xe.KHR_TEXTURE_TRANSFORM]){let o=n.extensions!==void 0?n.extensions[Xe.KHR_TEXTURE_TRANSFORM]:void 0;if(o){let a=r.associations.get(s);s=r.extensions[Xe.KHR_TEXTURE_TRANSFORM].extendTexture(s,o),r.associations.set(s,a)}}if(i!==void 0)s.colorSpace=i;return e[t]=s,s})}assignFinalMaterial(e){let{geometry:t,material:n}=e,i=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,s=t.attributes.normal===void 0;if(e.isPoints){let o="PointsMaterial:"+n.uuid,a=this.cache.get(o);if(!a)a=new eo,rn.prototype.copy.call(a,n),a.color.copy(n.color),a.map=n.map,a.sizeAttenuation=!1,this.cache.add(o,a);n=a}else if(e.isLine){let o="LineBasicMaterial:"+n.uuid,a=this.cache.get(o);if(!a)a=new Qs,rn.prototype.copy.call(a,n),a.color.copy(n.color),a.map=n.map,this.cache.add(o,a);n=a}if(i||r||s){let o="ClonedMaterial:"+n.uuid+":";if(i)o+="derivative-tangents:";if(r)o+="vertex-colors:";if(s)o+="flat-shading:";let a=this.cache.get(o);if(!a){if(a=n.clone(),r)a.vertexColors=!0;if(s)a.flatShading=!0;if(i){if(a.normalScale)a.normalScale.y*=-1;if(a.clearcoatNormalScale)a.clearcoatNormalScale.y*=-1}this.cache.add(o,a),this.associations.set(a,this.associations.get(n))}n=a}e.material=n}getMaterialType(){return mi}loadMaterial(e){let t=this,n=this.json,i=this.extensions,r=n.materials[e],s,o={},a=r.extensions||{},c=[];if(a[Xe.KHR_MATERIALS_UNLIT]){let u=i[Xe.KHR_MATERIALS_UNLIT];s=u.getMaterialType(),c.push(u.extendParams(o,r,t))}else{let u=r.pbrMetallicRoughness||{};if(o.color=new Le(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){let f=u.baseColorFactor;o.color.setRGB(f[0],f[1],f[2],hn),o.opacity=f[3]}if(u.baseColorTexture!==void 0)c.push(t.assignTexture(o,"map",u.baseColorTexture,Fi));if(o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0)c.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture));s=this._invokeOne(function(f){return f.getMaterialType&&f.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(f){return f.extendMaterialParams&&f.extendMaterialParams(e,o)})))}if(r.doubleSided===!0)o.side=bn;let l=r.alphaMode||nh.OPAQUE;if(l===nh.BLEND)o.transparent=!0,o.depthWrite=!1;else if(o.transparent=!1,l===nh.MASK)o.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:0.5;if(r.normalTexture!==void 0&&s!==Kn){if(c.push(t.assignTexture(o,"normalMap",r.normalTexture)),o.normalScale=new Ie(1,1),r.normalTexture.scale!==void 0){let u=r.normalTexture.scale;o.normalScale.set(u,u)}}if(r.occlusionTexture!==void 0&&s!==Kn){if(c.push(t.assignTexture(o,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0)o.aoMapIntensity=r.occlusionTexture.strength}if(r.emissiveFactor!==void 0&&s!==Kn){let u=r.emissiveFactor;o.emissive=new Le().setRGB(u[0],u[1],u[2],hn)}if(r.emissiveTexture!==void 0&&s!==Kn)c.push(t.assignTexture(o,"emissiveMap",r.emissiveTexture,Fi));return Promise.all(c).then(function(){let u=new s(o);if(r.name)u.name=r.name;if(ti(u,r),t.associations.set(u,{materials:e}),r.extensions)yr(i,u,r);return u})}createUniqueName(e){let t=tt.sanitizeNodeName(e||"");if(t in this.nodeNamesUsed)return t+"_"+ ++this.nodeNamesUsed[t];else return this.nodeNamesUsed[t]=0,t}loadGeometries(e){let t=this,n=this.extensions,i=this.primitiveCache;function r(o){return n[Xe.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(a){return u0(a,o,t)})}let s=[];for(let o=0,a=e.length;o<a;o++){let c=e[o],l=$T(c),u=i[l];if(u)s.push(u.promise);else{let f;if(c.extensions&&c.extensions[Xe.KHR_DRACO_MESH_COMPRESSION])f=r(c);else f=u0(new tn,c,t);i[l]={primitive:c,promise:f},s.push(f)}}return Promise.all(s)}loadMesh(e){let t=this,n=this.json,i=this.extensions,r=n.meshes[e],s=r.primitives,o=[];for(let a=0,c=s.length;a<c;a++){let l=s[a].material===void 0?HT(this.cache):this.getDependency("material",s[a].material);o.push(l)}return o.push(t.loadGeometries(s)),Promise.all(o).then(function(a){let c=a.slice(0,a.length-1),l=a[a.length-1],u=[];for(let h=0,d=l.length;h<d;h++){let g=l[h],y=s[h],p,m=c[h];if(y.mode===wn.TRIANGLES||y.mode===wn.TRIANGLE_STRIP||y.mode===wn.TRIANGLE_FAN||y.mode===void 0){if(p=r.isSkinnedMesh===!0?new Na(g,m):new pt(g,m),p.isSkinnedMesh===!0)p.normalizeSkinWeights();if(y.mode===wn.TRIANGLE_STRIP)p.geometry=eh(p.geometry,Ws);else if(y.mode===wn.TRIANGLE_FAN)p.geometry=eh(p.geometry,Qr)}else if(y.mode===wn.LINES)p=new Da(g,m);else if(y.mode===wn.LINE_STRIP)p=new ki(g,m);else if(y.mode===wn.LINE_LOOP)p=new Ua(g,m);else if(y.mode===wn.POINTS)p=new is(g,m);else throw Error("THREE.GLTFLoader: Primitive mode unsupported: "+y.mode);if(Object.keys(p.geometry.morphAttributes).length>0)WT(p,r);if(p.name=t.createUniqueName(r.name||"mesh_"+e),ti(p,r),y.extensions)yr(i,p,y);t.assignFinalMaterial(p),u.push(p)}for(let h=0,d=u.length;h<d;h++)t.associations.set(u[h],{meshes:e,primitives:h});if(u.length===1){if(r.extensions)yr(i,u[0],r);return u[0]}let f=new Zn;if(r.extensions)yr(i,f,r);t.associations.set(f,{meshes:e});for(let h=0,d=u.length;h<d;h++)f.add(u[h]);return f})}loadCamera(e){let t,n=this.json.cameras[e],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}if(n.type==="perspective")t=new Lt($s.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2000000);else if(n.type==="orthographic")t=new xr(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar);if(n.name)t.name=this.createUniqueName(n.name);return ti(t,n),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],n=[];for(let i=0,r=t.joints.length;i<r;i++)n.push(this._loadNodeShallow(t.joints[i]));if(t.inverseBindMatrices!==void 0)n.push(this.getDependency("accessor",t.inverseBindMatrices));else n.push(null);return Promise.all(n).then(function(i){let r=i.pop(),s=i,o=[],a=[];for(let c=0,l=s.length;c<l;c++){let u=s[c];if(u){o.push(u);let f=new ze;if(r!==null)f.fromArray(r.array,c*16);a.push(f)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new Js(o,a)})}loadAnimation(e){let t=this.json,n=this,i=t.animations[e],r=i.name?i.name:"animation_"+e,s=[],o=[],a=[],c=[],l=[];for(let u=0,f=i.channels.length;u<f;u++){let h=i.channels[u],d=i.samplers[h.sampler],g=h.target,y=g.node,p=i.parameters!==void 0?i.parameters[d.input]:d.input,m=i.parameters!==void 0?i.parameters[d.output]:d.output;if(g.node===void 0)continue;s.push(this.getDependency("node",y)),o.push(this.getDependency("accessor",p)),a.push(this.getDependency("accessor",m)),c.push(d),l.push(g)}return Promise.all([Promise.all(s),Promise.all(o),Promise.all(a),Promise.all(c),Promise.all(l)]).then(function(u){let f=u[0],h=u[1],d=u[2],g=u[3],y=u[4],p=[];for(let A=0,T=f.length;A<T;A++){let v=f[A],w=h[A],E=d[A],R=g[A],_=y[A];if(v===void 0)continue;if(v.updateMatrix)v.updateMatrix();let S=n._createAnimationTracks(v,w,E,R,_);if(S)for(let F=0;F<S.length;F++)p.push(S[F])}let m=new $r(r,void 0,p);return ti(m,i),m})}createNodeMesh(e){let t=this.json,n=this,i=t.nodes[e];if(i.mesh===void 0)return null;return n.getDependency("mesh",i.mesh).then(function(r){let s=n._getNodeRef(n.meshCache,i.mesh,r);if(i.weights!==void 0)s.traverse(function(o){if(!o.isMesh)return;for(let a=0,c=i.weights.length;a<c;a++)o.morphTargetInfluences[a]=i.weights[a]});return s})}loadNode(e){let t=this.json,n=this,i=t.nodes[e],r=n._loadNodeShallow(e),s=[],o=i.children||[];for(let c=0,l=o.length;c<l;c++)s.push(n.getDependency("node",o[c]));let a=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([r,Promise.all(s),a]).then(function(c){let l=c[0],u=c[1],f=c[2];if(f!==null)l.traverse(function(h){if(!h.isSkinnedMesh)return;h.bind(f,XT)});for(let h=0,d=u.length;h<d;h++)l.add(u[h]);if(l.userData.pivot!==void 0&&u.length>0){let h=l.userData.pivot,d=u[0];l.pivot=new N().fromArray(h),l.position.x-=h[0],l.position.y-=h[1],l.position.z-=h[2],d.position.set(0,0,0),delete l.userData.pivot}return l})}_loadNodeShallow(e){let t=this.json,n=this.extensions,i=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let r=t.nodes[e],s=r.name?i.createUniqueName(r.name):"",o=[],a=i._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});if(a)o.push(a);if(r.camera!==void 0)o.push(i.getDependency("camera",r.camera).then(function(c){return i._getNodeRef(i.cameraCache,r.camera,c)}));return i._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let l;if(r.isBone===!0)l=new Ys;else if(c.length>1)l=new Zn;else if(c.length===1)l=c[0];else l=new at;if(l!==c[0])for(let u=0,f=c.length;u<f;u++)l.add(c[u]);if(r.name)l.userData.name=r.name,l.name=s;if(ti(l,r),r.extensions)yr(n,l,r);if(r.matrix!==void 0){let u=new ze;u.fromArray(r.matrix),l.applyMatrix4(u)}else{if(r.translation!==void 0)l.position.fromArray(r.translation);if(r.rotation!==void 0)l.quaternion.fromArray(r.rotation);if(r.scale!==void 0)l.scale.fromArray(r.scale)}if(!i.associations.has(l))i.associations.set(l,{});else if(r.mesh!==void 0&&i.meshCache.refs[r.mesh]>1){let u=i.associations.get(l);i.associations.set(l,{...u})}return i.associations.get(l).nodes=e,l}),this.nodeCache[e]}loadScene(e){let t=this.extensions,n=this.json.scenes[e],i=this,r=new Zn;if(n.name)r.name=i.createUniqueName(n.name);if(ti(r,n),n.extensions)yr(t,r,n);let s=n.nodes||[],o=[];for(let a=0,c=s.length;a<c;a++)o.push(i.getDependency("node",s[a]));return Promise.all(o).then(function(a){for(let l=0,u=a.length;l<u;l++){let f=a[l];if(f.parent!==null)r.add(s0(f));else r.add(f)}let c=(l)=>{let u=new Map;for(let[f,h]of i.associations)if(f instanceof rn||f instanceof wt)u.set(f,h);return l.traverse((f)=>{let h=i.associations.get(f);if(h!=null)u.set(f,h)}),u};return i.associations=c(r),r})}_createAnimationTracks(e,t,n,i,r){let s=[],o=e.name?e.name:e.uuid,a=[];function c(h){if(h.morphTargetInfluences)a.push(h.name?h.name:h.uuid)}if(qi[r.path]===qi.weights){if(c(e),e.isGroup)e.children.forEach(c)}else a.push(o);let l;switch(qi[r.path]){case qi.weights:l=Vi;break;case qi.rotation:l=Wi;break;case qi.translation:case qi.scale:l=_r;break;default:switch(n.itemSize){case 1:l=Vi;break;case 2:case 3:default:l=_r;break}break}let u=i.interpolation!==void 0?GT[i.interpolation]:Ea,f=this._getArrayFromAccessor(n);for(let h=0,d=a.length;h<d;h++){let g=new l(a[h]+"."+qi[r.path],t.array,f,u);if(i.interpolation==="CUBICSPLINE")this._createCubicSplineTrackInterpolant(g);s.push(g)}return s}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let n=oh(t.constructor),i=new Float32Array(t.length);for(let r=0,s=t.length;r<s;r++)i[r]=t[r]*n;t=i}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){return new(this instanceof Wi?N0:ch)(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function qT(e,t,n){let i=t.attributes,r=new en;if(i.POSITION!==void 0){let a=n.json.accessors[i.POSITION],{min:c,max:l}=a;if(c!==void 0&&l!==void 0){if(r.set(new N(c[0],c[1],c[2]),new N(l[0],l[1],l[2])),a.normalized){let u=oh(ls[a.componentType]);r.min.multiplyScalar(u),r.max.multiplyScalar(u)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let s=t.targets;if(s!==void 0){let a=new N,c=new N;for(let l=0,u=s.length;l<u;l++){let f=s[l];if(f.POSITION!==void 0){let h=n.json.accessors[f.POSITION],{min:d,max:g}=h;if(d!==void 0&&g!==void 0){if(c.setX(Math.max(Math.abs(d[0]),Math.abs(g[0]))),c.setY(Math.max(Math.abs(d[1]),Math.abs(g[1]))),c.setZ(Math.max(Math.abs(d[2]),Math.abs(g[2]))),h.normalized){let y=oh(ls[h.componentType]);c.multiplyScalar(y)}a.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}r.expandByVector(a)}e.boundingBox=r;let o=new fn;r.getCenter(o.center),o.radius=r.min.distanceTo(r.max)/2,e.boundingSphere=o}function u0(e,t,n){let i=t.attributes,r=[];function s(o,a){return n.getDependency("accessor",o).then(function(c){e.setAttribute(a,c)})}for(let o in i){let a=sh[o]||o.toLowerCase();if(a in e.attributes)continue;r.push(s(i[o],a))}if(t.indices!==void 0&&!e.index){let o=n.getDependency("accessor",t.indices).then(function(a){e.setIndex(a)});r.push(o)}if(We.workingColorSpace!==hn&&"COLOR_0"in i)console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${We.workingColorSpace}" not supported.`);return ti(e,t),qT(e,t,n),Promise.all(r).then(function(){return t.targets!==void 0?VT(e,t.targets,n):e})}var U0={type:"change"},uh={type:"start"},F0={type:"end"},Qa=new zi,O0=new Ln,YT=Math.cos(70*$s.DEG2RAD),Ot=new N,sn=2*Math.PI,ct={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},lh=0.000001;class hh extends qa{constructor(e,t=null){super(e,t);if(this.state=ct.NONE,this.target=new N,this.cursor=new N,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=0.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Ni.ROTATE,MIDDLE:Ni.DOLLY,RIGHT:Ni.PAN},this.touches={ONE:Di.ROTATE,TWO:Di.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new N,this._lastQuaternion=new Bt,this._lastTargetPosition=new N,this._quat=new Bt().setFromUnitVectors(e.up,new N(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new ro,this._sphericalDelta=new ro,this._scale=1,this._panOffset=new N,this._rotateStart=new Ie,this._rotateEnd=new Ie,this._rotateDelta=new Ie,this._panStart=new Ie,this._panEnd=new Ie,this._panDelta=new Ie,this._dollyStart=new Ie,this._dollyEnd=new Ie,this._dollyDelta=new Ie,this._dollyDirection=new N,this._mouse=new Ie,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=JT.bind(this),this._onPointerDown=jT.bind(this),this._onPointerUp=KT.bind(this),this._onContextMenu=sE.bind(this),this._onMouseWheel=tE.bind(this),this._onKeyDown=nE.bind(this),this._onTouchStart=iE.bind(this),this._onTouchMove=rE.bind(this),this._onMouseDown=QT.bind(this),this._onMouseMove=eE.bind(this),this._interceptControlDown=oE.bind(this),this._interceptControlUp=aE.bind(this),this.domElement!==null)this.connect(this.domElement);this.update()}set cursorStyle(e){if(this._cursorStyle=e,e==="grab")this.domElement.style.cursor="grab";else this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction=""}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){if(this._domElementKeyEvents!==null)this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(U0),this.update(),this.state=ct.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;if(Ot.copy(t).sub(this.target),Ot.applyQuaternion(this._quat),this._spherical.setFromVector3(Ot),this.autoRotate&&this.state===ct.NONE)this._rotateLeft(this._getAutoRotationAngle(e));if(this.enableDamping)this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor;else this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi;let n=this.minAzimuthAngle,i=this.maxAzimuthAngle;if(isFinite(n)&&isFinite(i)){if(n<-Math.PI)n+=sn;else if(n>Math.PI)n-=sn;if(i<-Math.PI)i+=sn;else if(i>Math.PI)i-=sn;if(n<=i)this._spherical.theta=Math.max(n,Math.min(i,this._spherical.theta));else this._spherical.theta=this._spherical.theta>(n+i)/2?Math.max(n,this._spherical.theta):Math.min(i,this._spherical.theta)}if(this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0)this.target.addScaledVector(this._panOffset,this.dampingFactor);else this.target.add(this._panOffset);this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let s=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=s!=this._spherical.radius}if(Ot.setFromSpherical(this._spherical),Ot.applyQuaternion(this._quatInverse),t.copy(this.target).add(Ot),this.object.lookAt(this.target),this.enableDamping===!0)this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor);else this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0);if(this.zoomToCursor&&this._performCursorZoom){let s=null;if(this.object.isPerspectiveCamera){let o=Ot.length();s=this._clampDistance(o*this._scale);let a=o-s;this.object.position.addScaledVector(this._dollyDirection,a),this.object.updateMatrixWorld(),r=!!a}else if(this.object.isOrthographicCamera){let o=new N(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=a!==this.object.zoom;let c=new N(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),s=Ot.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;if(s!==null)if(this.screenSpacePanning)this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(s).add(this.object.position);else if(Qa.origin.copy(this.object.position),Qa.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Qa.direction))<YT)this.object.lookAt(this.target);else O0.setFromNormalAndCoplanarPoint(this.object.up,this.target),Qa.intersectPlane(O0,this.target)}else if(this.object.isOrthographicCamera){let s=this.object.zoom;if(this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),s!==this.object.zoom)this.object.updateProjectionMatrix(),r=!0}if(this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>lh||8*(1-this._lastQuaternion.dot(this.object.quaternion))>lh||this._lastTargetPosition.distanceToSquared(this.target)>lh)return this.dispatchEvent(U0),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0;return!1}_getAutoRotationAngle(e){if(e!==null)return sn/60*this.autoRotateSpeed*e;else return sn/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*0.01);return Math.pow(0.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Ot.setFromMatrixColumn(t,0),Ot.multiplyScalar(-e),this._panOffset.add(Ot)}_panUp(e,t){if(this.screenSpacePanning===!0)Ot.setFromMatrixColumn(t,1);else Ot.setFromMatrixColumn(t,0),Ot.crossVectors(this.object.up,Ot);Ot.multiplyScalar(e),this._panOffset.add(Ot)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let i=this.object.position;Ot.copy(i).sub(this.target);let r=Ot.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else if(this.object.isOrthographicCamera)this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix);else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1}_dollyOut(e){if(this.object.isPerspectiveCamera||this.object.isOrthographicCamera)this._scale/=e;else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1}_dollyIn(e){if(this.object.isPerspectiveCamera||this.object.isOrthographicCamera)this._scale*=e;else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),i=e-n.left,r=t-n.top,{width:s,height:o}=n;this._mouse.x=i/s*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(sn*this._rotateDelta.x/t.clientHeight),this._rotateUp(sn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){if(this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0)this._dollyOut(this._getZoomScale(this._dollyDelta.y));else if(this._dollyDelta.y<0)this._dollyIn(this._getZoomScale(this._dollyDelta.y));this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){if(this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0)this._dollyIn(this._getZoomScale(e.deltaY));else if(e.deltaY>0)this._dollyOut(this._getZoomScale(e.deltaY));this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate)this._rotateUp(sn*this.keyRotateSpeed/this.domElement.clientHeight)}else if(this.enablePan)this._pan(0,this.keyPanSpeed);t=!0;break;case this.keys.BOTTOM:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate)this._rotateUp(-sn*this.keyRotateSpeed/this.domElement.clientHeight)}else if(this.enablePan)this._pan(0,-this.keyPanSpeed);t=!0;break;case this.keys.LEFT:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate)this._rotateLeft(sn*this.keyRotateSpeed/this.domElement.clientHeight)}else if(this.enablePan)this._pan(this.keyPanSpeed,0);t=!0;break;case this.keys.RIGHT:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate)this._rotateLeft(-sn*this.keyRotateSpeed/this.domElement.clientHeight)}else if(this.enablePan)this._pan(-this.keyPanSpeed,0);t=!0;break}if(t)e.preventDefault(),this.update()}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=0.5*(e.pageX+t.x),i=0.5*(e.pageY+t.y);this._rotateStart.set(n,i)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=0.5*(e.pageX+t.x),i=0.5*(e.pageY+t.y);this._panStart.set(n,i)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){if(this.enableZoom)this._handleTouchStartDolly(e);if(this.enablePan)this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){if(this.enableZoom)this._handleTouchStartDolly(e);if(this.enableRotate)this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),i=0.5*(e.pageX+n.x),r=0.5*(e.pageY+n.y);this._rotateEnd.set(i,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(sn*this._rotateDelta.x/t.clientHeight),this._rotateUp(sn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=0.5*(e.pageX+t.x),i=0.5*(e.pageY+t.y);this._panEnd.set(n,i)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let s=(e.pageX+t.x)*0.5,o=(e.pageY+t.y)*0.5;this._updateZoomParameters(s,o)}_handleTouchMoveDollyPan(e){if(this.enableZoom)this._handleTouchMoveDolly(e);if(this.enablePan)this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){if(this.enableZoom)this._handleTouchMoveDolly(e);if(this.enableRotate)this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];if(t===void 0)t=new Ie,this._pointerPositions[e.pointerId]=t;t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}if(e.ctrlKey&&!this._controlActive)n.deltaY*=10;return n}}function jT(e){if(this.enabled===!1)return;if(this._pointers.length===0)this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp);if(this._isTrackingPointer(e))return;if(this._addPointer(e),e.pointerType==="touch")this._onTouchStart(e);else this._onMouseDown(e);if(this._cursorStyle==="grab")this.domElement.style.cursor="grabbing"}function JT(e){if(this.enabled===!1)return;if(e.pointerType==="touch")this._onTouchMove(e);else this._onMouseMove(e)}function KT(e){switch(this._removePointer(e),this._pointers.length){case 0:if(this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(F0),this.state=ct.NONE,this._cursorStyle==="grab")this.domElement.style.cursor="grab";break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y});break}}function QT(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Ni.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=ct.DOLLY;break;case Ni.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=ct.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=ct.ROTATE}break;case Ni.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=ct.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=ct.PAN}break;default:this.state=ct.NONE}if(this.state!==ct.NONE)this.dispatchEvent(uh)}function eE(e){switch(this.state){case ct.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case ct.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case ct.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e);break}}function tE(e){if(this.enabled===!1||this.enableZoom===!1||this.state!==ct.NONE)return;e.preventDefault(),this.dispatchEvent(uh),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(F0)}function nE(e){if(this.enabled===!1)return;this._handleKeyDown(e)}function iE(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case Di.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=ct.TOUCH_ROTATE;break;case Di.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=ct.TOUCH_PAN;break;default:this.state=ct.NONE}break;case 2:switch(this.touches.TWO){case Di.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=ct.TOUCH_DOLLY_PAN;break;case Di.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=ct.TOUCH_DOLLY_ROTATE;break;default:this.state=ct.NONE}break;default:this.state=ct.NONE}if(this.state!==ct.NONE)this.dispatchEvent(uh)}function rE(e){switch(this._trackPointer(e),this.state){case ct.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case ct.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case ct.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case ct.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=ct.NONE}}function sE(e){if(this.enabled===!1)return;e.preventDefault()}function oE(e){if(e.key==="Control")this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0})}function aE(e){if(e.key==="Control")this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0})}class fh extends es{constructor(){super();this.name="RoomEnvironment",this.position.y=-3.5;let e=new Gi;e.deleteAttribute("uv");let t=new mi({side:Yt}),n=new mi,i=new ss(16777215,900,28,2);i.position.set(0.418,16.199,0.3),this.add(i);let r=new pt(e,t);r.position.set(-0.757,13.219,0.717),r.scale.set(31.713,28.305,28.591),this.add(r);let s=new ns(e,n,6),o=new at;o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-0.195,0),o.scale.set(2.328,7.905,4.651),o.updateMatrix(),s.setMatrixAt(0,o.matrix),o.position.set(-5.607,-0.754,-0.758),o.rotation.set(0,0.994,0),o.scale.set(1.97,1.534,3.955),o.updateMatrix(),s.setMatrixAt(1,o.matrix),o.position.set(6.167,0.857,7.803),o.rotation.set(0,0.561,0),o.scale.set(3.927,6.285,3.687),o.updateMatrix(),s.setMatrixAt(2,o.matrix),o.position.set(-2.017,0.018,6.124),o.rotation.set(0,0.333,0),o.scale.set(2.002,4.566,2.064),o.updateMatrix(),s.setMatrixAt(3,o.matrix),o.position.set(2.291,-0.756,-2.621),o.rotation.set(0,-0.286,0),o.scale.set(1.546,1.552,1.496),o.updateMatrix(),s.setMatrixAt(4,o.matrix),o.position.set(-2.193,-0.369,-5.547),o.rotation.set(0,0.516,0),o.scale.set(3.875,3.487,2.986),o.updateMatrix(),s.setMatrixAt(5,o.matrix),this.add(s);let a=new pt(e,us(50));a.position.set(-16.116,14.37,8.208),a.scale.set(0.1,2.428,2.739),this.add(a);let c=new pt(e,us(50));c.position.set(-16.109,18.021,-8.207),c.scale.set(0.1,2.425,2.751),this.add(c);let l=new pt(e,us(17));l.position.set(14.904,12.198,-1.832),l.scale.set(0.15,4.265,6.331),this.add(l);let u=new pt(e,us(43));u.position.set(-0.462,8.89,14.52),u.scale.set(4.38,5.441,0.088),this.add(u);let f=new pt(e,us(20));f.position.set(3.235,11.486,-12.541),f.scale.set(2.5,2,0.1),this.add(f);let h=new pt(e,us(100));h.position.set(0,20,0),h.scale.set(1,0.1,1),this.add(h)}dispose(){let e=new Set;this.traverse((t)=>{if(t.isMesh)e.add(t.geometry),e.add(t.material)});for(let t of e)t.dispose()}}function us(e){return new za({color:0,emissive:16777215,emissiveIntensity:e})}function z0(e,t,n=40,i=[e]){let r=e.getCenter(new N),s=Math.max(e.getSize(new N).length()/2,0.01),o=new N(1,0.65,1.25).normalize(),a=new N().crossVectors(new N(0,1,0),o).normalize(),c=new N().crossVectors(o,a),l=[];for(let A of i.length?i:[e])for(let T of[A.min.x,A.max.x])for(let v of[A.min.y,A.max.y])for(let w of[A.min.z,A.max.z])l.push(new N(T,v,w));let u=1/0,f=-1/0,h=1/0,d=-1/0;for(let A of l){let T=A.clone().sub(r),v=T.dot(a),w=T.dot(c);u=Math.min(u,v),f=Math.max(f,v),h=Math.min(h,w),d=Math.max(d,w)}r.addScaledVector(a,(u+f)/2),r.addScaledVector(c,(h+d)/2);let g=Math.tan(n*Math.PI/360),y=g*t,p=s;for(let A of l){let T=A.clone().sub(r),v=T.dot(o);p=Math.max(p,v+Math.abs(T.dot(a))*1.12/y,v+Math.abs(T.dot(c))*1.12/g)}let m=r.clone().addScaledVector(o,p);return{center:r,radius:s,distance:p,position:m}}function k0(e){let t=new Qu({antialias:!0,alpha:!1});t.setPixelRatio(Math.min(devicePixelRatio,2)),t.setClearColor(1382930),t.toneMapping=Gs,t.toneMappingExposure=1.15,e.replaceChildren(t.domElement);let n=new es,i=new Lt(40,1,0.01,1000),r=new hh(i,t.domElement);r.enableDamping=!0;let s=new lo(t),o=new fh,a=s.fromScene(o,0.04);n.environment=a.texture,o.dispose(),s.dispose();let c=new os(16773591,2.4);c.position.set(4,8,5),n.add(c),n.add(new Ha(14806490,5065021,1.7));let l,u,f=[],h=!0,d=performance.now(),g=0,y=0,p=!1,m=(w)=>{let E=new Set,R=new Set,_=new Set;w.traverse((S)=>{let F=S;if(!F.isMesh)return;E.add(F.geometry);for(let C of Array.isArray(F.material)?F.material:[F.material]){R.add(C);for(let z of Object.values(C))if(z instanceof wt)_.add(z)}});for(let S of[...E,...R,..._])S.dispose()},A=()=>{if(!l)return;let w=new en().setFromObject(l,!0),E=[];l.traverse((C)=>{if(C instanceof pt||C instanceof ki||C instanceof is){let z=new en().setFromObject(C,!0);if(!z.isEmpty())E.push(z)}});let{center:R,radius:_,distance:S,position:F}=z0(w,i.aspect,i.fov,E);r.target.copy(R),i.position.copy(F),i.near=Math.max(_/1000,0.0001),i.far=S+_*100,r.minDistance=_*0.1,r.maxDistance=_*80,i.updateProjectionMatrix(),r.update()},T=new ResizeObserver(()=>{let{clientWidth:w,clientHeight:E}=e;if(!w||!E)return;t.setSize(w,E),i.aspect=w/E,i.updateProjectionMatrix()});T.observe(e);let v=(w)=>{if(p)return;let E=Math.min((w-d)/1000,0.1);if(d=w,h)u?.update(E);r.update(),t.render(n,i),g=requestAnimationFrame(v)};return g=requestAnimationFrame(v),{async load(w){let E=++y;qc(w);let R=new no;R.setURLModifier((O)=>{if(!O.startsWith("blob:")&&!O.startsWith("data:"))throw Error("External model resources are not loaded");return O});let _=await new ah(R).parseAsync(Uint8Array.from(w).buffer,"");if(p||E!==y){m(_.scene);return}if(l)u?.stopAllAction(),u?.uncacheRoot(l),n.remove(l),m(l);l=_.scene,n.add(l),f=_.animations,u=new Xa(l),h=!0;let{clientWidth:S,clientHeight:F}=e;t.setSize(S,F),i.aspect=S/F,A();let C=0,z=0,J=new Set;return l.traverse((O)=>{let H=O;if(!H.isMesh)return;z++,C+=(H.geometry.index?.count??H.geometry.attributes.position?.count??0)/3*(H.isInstancedMesh?H.count:1);for(let V of Array.isArray(H.material)?H.material:[H.material])J.add(V)}),{triangles:C,meshes:z,materials:J.size,clips:f.map((O)=>O.name)}},reset:A,wire(w){l?.traverse((E)=>{let R=E;if(R.isMesh){for(let _ of Array.isArray(R.material)?R.material:[R.material])if("wireframe"in _)_.wireframe=w}})},lighting(w){t.toneMappingExposure=w==="bright"?1.65:w==="soft"?0.85:1.15,c.intensity=w==="soft"?0.8:2.4},clip(w){if(u?.stopAllAction(),f[w])u?.clipAction(f[w]).play()},pause(w){h=!w},dispose(){if(p=!0,y++,cancelAnimationFrame(g),T.disconnect(),r.dispose(),l)m(l);a.dispose(),t.dispose(),e.replaceChildren()}}}var De=(e)=>document.getElementById(e),Ct=(e,t,n)=>{let i=document.createElement(e);if(t!==void 0)i.textContent=t;if(n)i.className=n;return i},mo=[],fs=[],Sr=[],ec="",hs,mn,ho=0,B0=0,fo=!1,po=!1,Yi=new Set,dh=[],G0=[],br=(e)=>`${e.collection}/${e.manifest.assetId}/${e.manifest.revisionId}`,H0=(e)=>{De("status").textContent=e},Mr=(e)=>H0(e instanceof Error?e.message:String(e)),go=(e,t,n=dh)=>{let i=URL.createObjectURL(new Blob([Uint8Array.from(e)],{type:t}));return n.push(i),i};async function V0(e){let t=await fetch(e),n=await t.json();if(!t.ok)throw Error(n.error??"Request failed");return n}async function cE(e,t){if(e.local){let i=e.local.files[t];if(!i)throw Error("File unavailable");return i}if(e.loose&&t==="asset.glb")return e.loose;let n=await fetch(`/files/${br(e)}/${t}`);if(!n.ok)throw Error((await n.json()).error??"File unavailable");return new Uint8Array(await n.arrayBuffer())}function lE(e,t){if(e.local){if(t==="editable.zip")return go(Yc([e.local]),"application/zip");return go(e.local.files[t],t.endsWith(".js")?"text/javascript":"model/gltf-binary")}if(e.loose)return go(e.loose,"model/gltf-binary");return`/files/${br(e)}/${t}?download`}function W0(e,t){try{localStorage.setItem(e,t)}catch{}}function $0(e){try{return localStorage.getItem(e)}catch{return null}}function uE(){let e=De("collections");e.replaceChildren();for(let t of[...mo,...Sr.length?[{id:"opened-files",label:"Opened files"}]:[]]){let n=Ct("button",t.label,ec===t.id?"active":"");n.onclick=()=>void tc(t.id).catch(Mr),e.append(n)}}async function tc(e){let t=++B0;ec=e,Yi.clear(),uE(),H0("");let n=e==="opened-files"?Sr:(await V0(`/api/assets?collection=${encodeURIComponent(e)}`)).assets.map((i)=>({collection:e,manifest:i}));if(t!==B0)return;fs=n,W0("kiln.collection",e),De("collection-title").textContent=e==="opened-files"?"Opened files":mo.find((i)=>i.id===e)?.label??e,De("collection-caption").textContent=e==="opened-files"?"Previewed in your browser. Your original files stay untouched.":"Saved revisions, editable source, and everything ready to use.",ph()}function hE(){let e=new Map;for(let t of fs){let n=t.manifest.assetId;e.set(n,[...e.get(n)??[],t])}return[...e.values()].map((t)=>(t.sort((n,i)=>i.manifest.createdAt.localeCompare(n.manifest.createdAt)||i.manifest.revisionId.localeCompare(n.manifest.revisionId)),t.find((n)=>n.manifest.revisionId===$0(`kiln.revision.${n.collection}.${n.manifest.assetId}`))??t[0]))}function ph(){for(let i of G0.splice(0))URL.revokeObjectURL(i);let e=De("cards");e.replaceChildren();let t=De("search").value.toLowerCase(),n=hE().filter((i)=>`${i.manifest.name} ${i.manifest.tags.join(" ")}`.toLowerCase().includes(t));if(De("count").textContent=`${n.length} asset${n.length===1?"":"s"}`,De("export-selection").disabled=!Yi.size,!n.length){let i=Ct("div",void 0,"empty");if(i.append(Ct("b",t?"No matching assets":"Your next idea belongs here."),Ct("p",t?"Try another name or tag.":"Save an asset with your agent, or open a GLB or editable bundle.")),!t)i.append(Ct("code",'kiln save asset.kiln.js --name "My asset"'));e.append(i);return}for(let i of n){let r=i.manifest,s=Ct("article",void 0,"card"),o=Ct("button",void 0,"card-open");o.setAttribute("aria-label",`View ${r.name}`),o.onclick=()=>void mh(i).catch(Mr);let a=Ct("div",void 0,"thumb");if(r.files["preview.png"]){let d=Ct("img");d.loading="lazy",d.alt=r.name,d.src=i.local?go(i.local.files["preview.png"],"image/png",G0):`/files/${br(i)}/preview.png`,d.onerror=()=>{d.remove(),a.textContent="◇"},a.append(d)}else a.textContent="◇";let c=Ct("div",void 0,"card-content");c.append(Ct("span",r.name,"card-title"));let l=fs.filter((d)=>d.manifest.assetId===r.assetId),u=new Set(l.map((d)=>d.manifest.parentRevision)),f=l.filter((d)=>!u.has(d.manifest.revisionId));c.append(Ct("span",`${r.editable?"Editable source":"Source unavailable"} · ${l.length} revision${l.length===1?"":"s"}${f.length>1?` · ${f.length} branches`:""}`,"card-meta"));let h=Ct("div",void 0,"tags");for(let d of r.tags)h.append(Ct("span",d,"tag"));if(c.append(h),o.append(a,c),s.append(o),!i.loose){let d=Ct("input");d.type="checkbox",d.className="selection",d.checked=Yi.has(br(i)),d.setAttribute("aria-label",`Select ${r.name}`),d.onchange=()=>{if(d.checked)Yi.add(br(i));else Yi.delete(br(i));De("export-selection").disabled=!Yi.size},s.append(d)}e.append(s)}}async function mh(e){let t=++ho;hs=e,W0(`kiln.revision.${e.collection}.${e.manifest.assetId}`,e.manifest.revisionId);for(let o of dh.splice(0))URL.revokeObjectURL(o);let n=De("detail");if(!n.open)n.showModal();De("asset-name").textContent=e.manifest.name;let i=De("revisions");i.replaceChildren();for(let o of fs.filter((a)=>a.manifest.assetId===e.manifest.assetId)){let a=Ct("option",`${new Date(o.manifest.createdAt).toLocaleString()} · ${o.manifest.description||o.manifest.revisionId.slice(0,10)}`);a.value=o.manifest.revisionId,a.selected=o.manifest.revisionId===e.manifest.revisionId,i.append(a)}i.onchange=()=>{let o=fs.find((a)=>a.manifest.assetId===e.manifest.assetId&&a.manifest.revisionId===i.value);if(o)mh(o).catch(Mr)},De("asset-description").textContent=e.manifest.description??e.manifest.brief??(e.manifest.editable?"Source travels with this revision. Download the editable bundle to continue elsewhere.":"This GLB has no saved Kiln source. You can view and use the model."),De("provenance").textContent=e.loose?"Standalone GLB. No source or build provenance supplied.":JSON.stringify(e.manifest,null,2);let r=De("downloads");r.replaceChildren();for(let[o,a]of[["asset.glb","Download GLB"],...e.manifest.editable?[["source.kiln.js","Download source"]]:[],...!e.loose?[["editable.zip",e.manifest.editable?"Download editable bundle":"Download asset bundle"]]:[]]){let c=Ct("a",a);c.href=lE(e,o),c.download=`${e.manifest.name.replace(/[^a-z0-9_-]/gi,"-")}${o==="asset.glb"?".glb":o==="source.kiln.js"?".kiln.js":".zip"}`,r.append(c)}De("refine").disabled=!e.manifest.editable,De("asset-stats").replaceChildren(),De("stage-status").textContent="Loading saved GLB…",fo=!1,po=!1,De("wire").setAttribute("aria-pressed","false"),De("play").textContent="Pause";let s=De("animation");s.replaceChildren(new Option("Rest pose","")),De("play").disabled=!0;try{mn??=k0(De("stage"));let o=await cE(e,"asset.glb");if(t!==ho)return;let a=await mn.load(o);if(!a||t!==ho)return;mn.wire(!1),mn.lighting(De("lighting").value);for(let[c,l]of[[a.triangles.toLocaleString(),"triangles"],[a.meshes,"meshes"],[a.materials,"materials"],[`${(o.length/1024).toFixed(0)} KB`,"GLB"]]){let u=Ct("div");u.append(Ct("strong",String(c)),Ct("span",String(l))),De("asset-stats").append(u)}for(let c=0;c<a.clips.length;c++)s.append(new Option(a.clips[c],String(c)));De("stage-status").textContent=""}catch(o){if(t===ho)mn?.dispose(),mn=void 0,De("stage-status").textContent=`3D preview unavailable: ${o instanceof Error?o.message:o}. Downloads remain available.`}}async function Z0(e){for(let t of e){if(t.bytes.length>si)throw Error("File exceeds 64 MiB");if(t.name.toLowerCase().endsWith(".zip"))for(let n of Dm(t.bytes)){for(let[i,r]of Object.entries(n.files))if(`sha256:${Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",Uint8Array.from(r)))).map((o)=>o.toString(16).padStart(2,"0")).join("")}`!==n.manifest.files[i]?.sha256)throw Error(`Bundle integrity failure: ${i}`);if(!Sr.some((i)=>i.manifest.revisionId===n.manifest.revisionId&&i.manifest.assetId===n.manifest.assetId))Sr.push({collection:"opened-files",manifest:n.manifest,local:n})}else{let n=`a_${crypto.randomUUID().replaceAll("-","")}`;Sr.push({collection:"opened-files",loose:t.bytes,manifest:{version:"kiln.asset.v1",assetId:n,revisionId:`r_${n}`,name:t.name.replace(/\.glb$/i,""),tags:[],createdAt:new Date().toISOString(),editable:!1,files:{}}})}}await tc("opened-files")}De("open").onchange=async(e)=>{try{let t=Array.from(e.target.files??[]);if(t.some((n)=>n.size>si))throw Error("File exceeds 64 MiB");await Z0(await Promise.all(t.map(async(n)=>({name:n.name,bytes:new Uint8Array(await n.arrayBuffer())}))))}catch(t){Mr(t)}};De("refresh").onclick=()=>void tc(ec).catch(Mr);De("search").oninput=ph;De("close-detail").onclick=()=>De("detail").close();De("detail").addEventListener("close",()=>{ho++,mn?.dispose(),mn=void 0;for(let e of dh.splice(0))URL.revokeObjectURL(e);ph()});De("frame").onclick=()=>mn?.reset();De("wire").onclick=()=>{fo=!fo,mn?.wire(fo),De("wire").setAttribute("aria-pressed",String(fo))};De("lighting").onchange=(e)=>mn?.lighting(e.target.value);De("animation").onchange=(e)=>{let t=e.target.value;mn?.clip(t===""?-1:Number(t)),De("play").disabled=t===""};De("play").onclick=()=>{po=!po,mn?.pause(po),De("play").textContent=po?"Play":"Pause"};De("refine").onclick=async()=>{if(!hs)return;let e=hs.manifest,t=hs.local?`Import the downloaded editable bundle using kiln import <bundle.zip>. Restore asset ${e.assetId}, revision ${e.revisionId}, using kiln_assets action=restore. Read its source with kiln_source, refine it with kiln_edit, review the result, and save a child revision with kiln_save. Requested change: `:`Use kiln_assets with action=restore, collection=${hs.collection}, assetId=${e.assetId}, revisionId=${e.revisionId}. Read the returned programRef with kiln_source, refine it with kiln_edit, review the result, and save with kiln_save using assetId=${e.assetId}, parentRevision=${e.revisionId}, collection=${hs.collection}. Requested change: `;try{await navigator.clipboard.writeText(t),De("refine").textContent="Instructions copied"}catch{De("provenance").textContent=t,De("provenance").parentElement?.setAttribute("open","")}};De("export-selection").onclick=()=>{try{let e=Ct("a");if(ec==="opened-files")e.href=go(Yc(fs.filter((t)=>Yi.has(br(t))).map((t)=>t.local)),"application/zip");else{let t=new URLSearchParams;for(let n of Yi)t.append("revision",n);e.href=`/api/bundle?${t}`}e.download="kiln-assets.zip",e.click()}catch(e){Mr(e)}};async function fE(){mo=(await V0("/api/collections")).collections;let e=$0("kiln.collection");if(await tc(mo.find((t)=>t.id===e)?.id??mo[0]?.id??"project"),new URLSearchParams(location.search).has("open")){let t=await fetch("/api/standalone");if(!t.ok)throw Error("File unavailable");if(await Z0([{name:t.headers.get("Content-Type")?.includes("zip")?"asset.zip":"asset.glb",bytes:new Uint8Array(await t.arrayBuffer())}]),Sr.length===1)await mh(Sr[0])}}fE().catch(Mr);
