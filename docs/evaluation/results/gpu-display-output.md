# GPU display-output correction

On 2026-09-05, review of Astra's abyssal surveyor revealed completely white upper surfaces. This was a renderer defect, not a reason to darken the model's material.

The service configured ACES exposure but drew into ordinary unsigned-byte render targets. Three 0.185.1 treats those as intermediate targets: tone mapping is disabled and colors remain linear. Encoding those bytes directly as PNG both loses the display color conversion and clips highlights before they can be compressed.

Every service view now uses Three's public output-target path. Its half-float framebuffer preserves HDR values, followed by Three's ACES/exposure and linear-to-sRGB output pass into the final byte target. No private renderer flags, new artistic preset, or model-source change was needed. The default studio lighting values remain unchanged; it is still a bright rig, and artistic curation can make separate choices later.

The [hardware receipt](gpu-display-output-2026-09-05.json) records an actual NVIDIA GeForce RTX 3070 / D3D12 run, driver 32.0.16.1074. Nine known linear neutral/color patches matched an independent ACES and sRGB reference within one byte. Linear neutral values 1, 2 and 4 had all become 255 before the fix; afterward they produced 235, 246 and 252. A lower exposure also changed the actual pixel values as expected. A 270-pixel-wide target exercised non-aligned readback rows.

The same 636,504-byte abyssal-surveyor GLB and exact 768-pixel camera were rendered before and after, without source edits. Fully white pixels fell from 63,135 to zero out of 589,824. Visual review showed restored upper-shell shading, smoother metal highlights, and visible detail in the front aperture. The render-service source fingerprint changed, invalidating old capture-cache entries. Before/after PNGs and camera/hash receipts remain in `tmp/display-output-proof/`.

An additional legacy beauty request exposed an undefined camera function. A bounded sphere-fit perspective camera now restores that path; tests project a translated sphere at three scales to verify framing and depth. The HTTP endpoint returns both legacy views and beauty PNGs, and the host adapter now retains the returned beauty image instead of discarding it.

Validation: 35 provider-free render-service tests passed, actual GPU color-patch conformance passed, exact-camera and legacy/beauty HTTP paths succeeded, and the host adapter/cache regression tests and TypeScript check passed. Run `npm run conformance:display` from `render-service` for the optional hardware check. Earlier model-run PNGs remain historical evidence and were not regenerated or silently replaced; their receipts did not independently verify this display transform.
