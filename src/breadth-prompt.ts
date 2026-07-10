import {
  validateModularKitContractV1,
  validateVfxIntentV1,
  type AssetScopeIntentV1,
  type ModularIntentV1,
  type ModularKitContractV1,
  type VfxIntentV1,
} from './contracts/breadth';

/**
 * Render only the resolved VFX recipe. This is intentionally not a noun catalog:
 * it communicates the trusted frame/runtime contract the model must satisfy.
 */
export function renderVfxBreadthPrompt(intent: VfxIntentV1): string {
  const result = validateVfxIntentV1(intent);
  if (!result.valid || !result.value) throw new TypeError('Cannot prompt from invalid VFX intent.');
  const value = result.value;
  const direction = value.facing.directionAxis ? `; direction=${value.facing.directionAxis}` : '';
  const lines = [
    `VFX contract: subtype=${value.subtype}; portability=${value.portability}; alpha=${value.transparency}; doubleSided=${value.doubleSided}.`,
    `Facing: source=${value.facing.source}; mode=${value.facing.mode}; normal=${value.facing.normalAxis ?? 'not-applicable'}${direction}.`,
    `Animation: playback=${value.animation.playback}; duration=${value.animation.durationSeconds}s; endpoint=${value.animation.endpointBehavior}; driver=${value.animation.driver}.`,
  ];
  if (value.animation.driver === 'clip') {
    lines.push(`Emit exact clip ${value.animation.clipName}; looping endpoints must match.`);
  }
  if (value.animation.driver === 'timeUniform') {
    lines.push(`Runtime sidecar must expose time uniform ${value.animation.timeUniformName}.`);
  }
  if (value.sidecar) {
    lines.push(
      `Attach nonportable ${value.sidecar.kind.toUpperCase()} sidecar ${value.sidecar.id}@${value.sidecar.version}; keep it distinct from the portable GLB fallback.`,
    );
  } else {
    lines.push('Use standard glTF PBR only; do not invent a runtime shader dependency.');
  }
  if (value.transparency !== 'opaque') {
    lines.push(
      `Every effect surface must carry real alpha data and final ${value.transparency.toUpperCase()} export metadata; opaque card rectangles fail.`,
    );
  }
  lines.push(
    'Stamp every effect-rendering node with vfx.effect.surface.<card|beam|trail|volume|core>; stamp opaque emitter/support geometry with vfx.support.* so alpha QA scopes only the effect surface.',
  );
  return lines.join('\n');
}

export function renderModularKitPrompt(contract: ModularKitContractV1): string {
  const result = validateModularKitContractV1(contract);
  if (!result.valid || !result.value)
    throw new TypeError('Cannot prompt from an invalid modular kit.');
  const value = result.value;
  const socketLines = value.sockets.map(
    (socket) =>
      `- ${socket.pieceId}/${socket.id}: type=${socket.type}; compatible=${socket.compatibleTypes.join(',')}; rotations=${socket.allowedRotationsDegrees.join(',')}deg`,
  );
  return [
    `Modular contract: units=${value.units}; grid=${value.grid.join('x')} m.`,
    'Stamp the exact socket frames and keep the named piece boundaries separable.',
    ...socketLines,
    'A declared pair must join with zero seam and zero overlap within the QA tolerance.',
  ].join('\n');
}

export function renderAssetScopePrompt(
  intent: AssetScopeIntentV1,
  modular?: ModularIntentV1,
): string {
  const explicit = intent.explicit ? 'explicit user/product requirement' : 'resolved default';
  const instruction: Record<AssetScopeIntentV1['scope'], string> = {
    single:
      'Return one reusable asset root; omit unrelated terrain, props, people, and scene dressing.',
    cluster:
      'Return one intentional reusable cluster; members may repeat but unrelated diorama dressing is out of scope.',
    modularSet: `Return separable compatible pieces on the trusted ${modular?.grid.join('x') ?? '1x1x1'} m grid; stamp each piece with semantic socket frames, reciprocal compatibleTypes, and explicit allowedRotationsDegrees so the assembled pair can be measured for zero seam and overlap. Do not encode the grid in arbitrary userData.`,
    packMember: 'Return only this pack member; shared pack context must not become extra geometry.',
  };
  return `Asset scope (${explicit}): ${intent.scope}. ${instruction[intent.scope]}`;
}
