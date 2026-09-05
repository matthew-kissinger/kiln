# What the production system did, and why

Kiln was a commercial text-to-3D product. It is shut down. This document records what the hosted
system looked like, because several decisions still visible in this repo only make sense against
that background -- and because the reasoning is the interesting part.

Nothing here is required to use the engine. It is history.

## The shape of it

```
Browser / SDK / MCP client
        |
   CloudFront -> ALB -> ECS Fargate API (Bun, Hono)
        |
   Bedrock AgentCore Runtime  (the generation loop; a BYO TypeScript container)
        |
   this engine (vendored)  ->  GLB + six-view sheet
        |
   private S3 artifacts, DynamoDB state, Cognito identity
```

An `AgentCore Gateway` projected a subset of the product API as hosted MCP tools. A separate
Cloudflare Durable Objects tier handled realtime presence. A private GPU render service ran on
RunPod serverless, outside the AWS release identity.

## Decisions that outlived the product

These are still in the code and still correct.

### The render port owns its own degrade

`captureViewsViaPort` -- in the engine, not the host -- owns the deadline, PNG decode and count
validation, grid composition, and a never-throw fallback to the CPU rasterizer. The host adapter
deliberately just builds a request, POSTs it, and maps the response; its thrown errors are
*intentional*, because the shell catches them.

This was the right call in production and it is the right call here. It means a renderer is
swappable without correctness depending on which one ran, and it is why adding a local GPU adapter
was a small change rather than a risky one.

### The GPU is a view producer, never gate evidence

`QaContext` is image-free by construction, so a QA rule cannot structurally read a render buffer.
Deterministic gates see geometry only.

The reason: GPU output varies by driver and adapter. If a gate could read pixels, gate results would
vary by hardware, and a passing build on one machine would fail on another. Keeping the expensive,
non-deterministic eye out of the judge path is what makes the gates trustworthy.

### Two injection seams, two deadlines

The port is injected twice. Once after the loop, for the artifact sheet -- nothing waits on it, so a
long deadline (120s in production) is correct. Once inside `kiln_render`, for the grid the model
actually looks at -- that one blocks the agent mid-thought, so it got 6s.

Collapsing those onto one value breaks one of the two jobs. In production, using the post-loop
deadline in-loop would have stalled every first render of a session, because serverless GPU cold
resume measured 14-43 seconds.

### Conditional GPU routing

Originally the GPU ran only *after* the loop. That meant the model authored materials it could never
see: it wrote `pbrMaterial(...)`, then checked its work against a flat-shaded image that cannot show
whether the result reads as wet stone or as plastic.

Routing GPU renders into the loop fixed that, conditionally -- `sceneNeedsPbrShading` checks bound
textures and `metalness > 0`, and nothing else. Material *type* is deliberately not consulted,
because `gameMaterial` and `pbrMaterial` both construct a `MeshStandardMaterial` and are
indistinguishable after construction. Roughness is not a signal either, since `gameMaterial` sets it
by default.

## Decisions that were product-specific, and are reversed here

### Raw tools were never exposed over MCP

The product had an explicit "External Access Boundary": never expose raw `kiln_render`,
`kiln_screenshot`, `scene_place`, transcripts, storage keys, or provider keys to external callers.
The hosted MCP surface was a five-tool progressive-discovery facade
(`status` / `operations.search` / `operations.describe` / `operations.execute` / `resources.get`)
over the product API, where a generate call dispatched into the AgentCore runtime and returned a
finished artifact.

That existed because the product had tenancy, billing, quotas, and per-caller scopes to protect, and
because the paid operation catalog was too large to put in a model's context.

**This repo does the opposite.** There is no tenancy and no billing, the tool set is small, and
exposing the raw registry over MCP is the entire point: your agent becomes the author. The
progressive-discovery pattern was a good answer to a problem this repo does not have.

### The CPU rasterizer was a constraint, not a preference

`src/views/raster.ts` exists because the production agent runtime container had no GPU and no
browser: it shipped with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, Playwright is unsupported under Bun
on Windows, and `headless-gl` is WebGL1 while three >= r163 requires WebGL2. So: a dependency-free
scanline z-buffer rasterizer, flat lambert, base color only.

It turned out to be worth keeping for reasons that had nothing to do with the original constraint --
it is deterministic, it needs no install, and it is sufficient for silhouette, proportion,
orientation, and contact. But it was never chosen as the better renderer, and this repo does not
pretend otherwise.

### Quotas, spend reservations, and approval envelopes

The product metered real money per call: durable fenced ownership, caller-scoped idempotency, spend
reservations, provider-usage checkpoints, and recovery-safe settlement. None of that ships here.

Call budgets *do* ship, because bounding an agent loop's calls is a genuine engineering concern
independent of billing.

### The vendored tarball seam

The engine reached the product as a committed tarball refreshed by a `sync:engine` script, rather
than a path link, because `file:../kiln` hits a Windows `EPERM` copying native dependencies across
two private repositories. With one public repo and normal package resolution, that machinery is
unnecessary.
