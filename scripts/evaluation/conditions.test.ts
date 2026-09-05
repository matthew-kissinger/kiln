import { expect, test } from 'bun:test';
import { createConditionRegistry, assertConditionSource } from './conditions';

test('A/B deny new helper access through aliases but permit raw THREE and harmless strings', () => {
  expect(() => assertConditionSource('const f = meshGeo; f({positions:[]});', 'A')).toThrow('condition-policy');
  expect(() => assertConditionSource('const f = parametricSurface;', 'B')).toThrow('condition-policy');
  expect(() => assertConditionSource('const s="meshGeo"; const g=new THREE.BufferGeometry();', 'B')).not.toThrow();
  expect(() => assertConditionSource('meshGeo({positions:[]});', 'C')).not.toThrow();
});
test('A hides progressive lookup and advanced camera fields; B retains them', async () => {
  const a = createConditionRegistry('A');
  const b = createConditionRegistry('B');
  const discovery = a.find((d) => d.name === 'kiln_list_primitives')!;
  expect(discovery.inputSchema.safeParse({query:'holes'}).success).toBe(false);
  const output = await b.find((d) => d.name === 'kiln_list_primitives')!.run({name:'meshGeo'});
  expect((output as {total:number}).total).toBe(0);
  const render = a.find((d) => d.name === 'kiln_render')!;
  expect(render.inputSchema.safeParse({code:'x',capture:{version:'kiln.capture.v1',shots:[{}]}}).success).toBe(false);
});
test('all conditions preserve public source-reference tool names and C exposes new helpers', async () => {
  const rows = ['A','B','C'].map((condition) => createConditionRegistry(condition as 'A'|'B'|'C'));
  expect(rows[0]!.map((d)=>d.name)).toEqual(rows[2]!.map((d)=>d.name));
  const output = await rows[2]!.find((d)=>d.name==='kiln_list_primitives')!.run({name:'meshGeo'});
  expect((output as {total:number}).total).toBe(1);
});

test('reference edits cannot bypass the disabled-helper policy at evaluation', async () => {
  const definitions=createConditionRegistry('B');
  const code="const meta={name:'Box',category:'prop'};function build(){const r=createRoot('Box');createPart('Body',boxGeo(1,1,1),gameMaterial('#887766'),{parent:r});return r;}";
  const render=definitions.find((entry)=>entry.name==='kiln_render')!;
  const first=await render.run({code,capture:{preset:'1x1'}}) as {ok:boolean;programRef:string};
  expect(first.ok).toBe(true);
  const edited=await definitions.find((entry)=>entry.name==='kiln_edit')!.run({programRef:first.programRef,edits:[{oldString:'boxGeo(1,1,1)',newString:'meshGeo({positions:[0,0,0,1,0,0,0,1,0]})'}],capture:{preset:'1x1'}}) as {ok:boolean;programRef:string;render:{ok:boolean;error:string}};
  expect(edited.ok).toBe(true);
  expect(edited.render.ok).toBe(false);
  expect(JSON.stringify(edited)).toContain('condition-policy');
  expect(edited.programRef).not.toBe(first.programRef);
});

test('B grouped lookup preserves requested order without advertising disabled helpers', async () => {
 const lookup=createConditionRegistry('B').find(d=>d.name==='kiln_list_primitives')!;
 const result=await lookup.run({names:['sphereGeo','boxGeo']}) as {primitives:Array<{name:string}>};
 expect(result.primitives.map(x=>x.name)).toEqual(['sphereGeo','boxGeo']);
 await expect(lookup.run({names:['boxGeo','meshGeo']})).rejects.toThrow('Unknown');
});
