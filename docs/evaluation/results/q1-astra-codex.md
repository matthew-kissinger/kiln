# Q1: Astra through Codex

Completed 5 September 2026 with Codex 0.153.3 and `gpt-6-astra`, high reasoning. One fresh ephemeral native CLI session; no continuation or alternate model. Elapsed approximately 8 minutes 24 seconds; 18 Kiln calls, 22 rendered cells delivered in seven PNG sheets/detail images. The observer enforced 30 calls, 48 cells and a 15-minute deadline.

The tested tarball SHA-256 was `d186bd20f87abe8a1d705eec9a3e0c43320a5e79fed64ed8b69bf922357ab888`. It was installed with npm in a fresh external runtime; the installed `kiln-init` generated a separate workspace and the full author/refine/QA skills. The model received only the Q1 prompt, asymmetric research-hull brief and installed workspace instructions. Ten observed shell commands read project instructions, installed skill references or its own outputs; no engine implementation, gallery or another run was read.

Evidence lives at `C:/Users/Mattm/X/kiln-cleanrooms/q1-astra-final2-20260905/evidence/`. `setup.json` binds installed bundle/skill and prompt hashes. `mcp/transcript.jsonl` preserves full arguments and text responses, and `mcp/images/` retains delivered PNG bytes and hashes. `independent-verification.json` records checks performed after the model finished. `codex.jsonl` and `codex.stderr.log` preserve the native harness record.

## Result

The model authored RV Tern: an approximately 8 m vessel with curved chine hull, raised narrow bow, broad transom, port wheelhouse, open starboard deck and tracked stern sampling crane. Independent visual review found the asymmetric plan, bow/stern distinction and crane/railings readable. The final whole-asset view is `mcp/images/016-0.png`; attachment detail is `017-0.png`; the three animation phases are `018-0.png`. Some long view labels truncate and the tight top view approaches its label area.

Source revisions:

- Original: `sha256:6fb756d6f62075d27ca0bde6ad85bb1247a551042abf4dea9c504cb5fe70aa3e`.
- Offset-only edit: `sha256:0bae9f19caad2539e0b4dc932438b73b7e48ef870a9c90b808dfb6d69474aa03`.
- Final: `sha256:a0e702f76ca06c736997982394c7a388b23053a552c1a3e3975da49515a7d430`.

A bounded literal source query located `serviceOffset`. Independent byte comparison proves the offset-only revision changes exactly `const serviceOffset = 0.10;` to `const serviceOffset = 0.25;`. A separate targeted edit corrected two deck-shell winding expressions after visual review. Subsequent render/inspect/edit calls used references rather than resending source.

The final source hash matches its reference. The exported GLB contains 24,306 triangles and is 385,012 bytes; SHA-256 `0d433e81ac5bbb7841b7171eefc370f1d30c76cf01b23127cb5faaa7c96b6ed8`. Independent GLB parsing verifies `ServiceMotion` at 0, 0.5 and 1 seconds, X translations approximately -2.6, -2.2 and -2.6 m, with unchanged Y/Z. The joint retains 25 descendants, including ServiceAssembly, footplate and cable guide. This supports sampled attachment motion, not collision clearance or engineering suitability.

## Findings and limits

The first render request used strings for numeric camera coordinates. It failed before a revision existed; the model corrected the coordinates and submitted again. The union-schema error misleadingly described the advanced capture keys as unrecognized instead of pointing to the numeric type errors. This is an actionable diagnostic improvement, not a failure of explicit camera support.

All seven MCP PNG responses reported faithful GPU materials and matching camera receipts. The optional CLI export sheet hit HTTP 401 and fell back to CPU: the evaluation wrapper mapped the local service token only for MCP, while the CLI shell lacked the expected token variable. The model disclosed the fallback rather than treating that sheet as material evidence. After completion, an independent correctly configured GPU export of the exact final reference succeeded and produced byte-identical GLB data; its sheet is `reverified.png`. That rerun is independent verification, not model-observed evidence. Future evaluation launchers must map the renderer token for the entire child environment.

Native usage reported 795,229 input tokens, of which 697,344 were cached, and 10,243 output tokens, with 1,795 reasoning output tokens reported separately. These are harness-reported cumulative counts, not source bytes or a cost estimate.
