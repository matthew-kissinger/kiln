# Optional agent dependencies and runtime roles

The intended package boundary is one official Kiln installation with optional
capabilities. Ordinary CLI/MCP authoring does not need Strands or a model runtime
inside Kiln. The external harness supplies its model. The native Strands entry
adds its own agent loop and selected provider adapter; the registry still owns
tool schemas and implementations. Bun builds and tests the project; the committed
CLI/MCP bundles execute with Node. These are distinct responsibilities, not a
requirement that every end user install both runtimes.

The end-user Node range is still under qualification. Exact maintainer pins remain
unchanged at this checkpoint. Strands 1.17.0 requires Node 22+, independently of
what the core CLI/MCP floor proves to be. A Node 20 core feasibility probe is not
qualification of Strands or the renderer. Current [Strands setup guidance](https://strandsagents.com/docs/user-guide/sdk/quickstart/typescript/)
and [Vercel adapter documentation](https://strandsagents.com/docs/user-guide/sdk/model-providers/vercel/)
agree with the installed SDK's separate provider packages.

## Reproduced installation defect and implementation

An isolated npm 12.0.2 install outside the repository contained these direct
dependencies: Strands 1.17.0, OpenRouter adapter 2.10.0, AI provider specification
3.0.16 and Zod 4.6.4. It installed 136 packages with lifecycle scripts disabled.
The source-derived Kiln provider bundle initially failed at module import because
`@anthropic-ai/sdk` was missing, even though the requested provider was OpenRouter.
The failure came from Kiln's eager import of all native adapters.

Factories now import the selected adapter asynchronously. Known constructed models
retain their prompt-cache capability in a weak map; externally constructed native
models are checked against the available real adapter classes. Unavailable optional
classes are not a reason to fail an unrelated provider. Other import errors still
surface. Native cache points and OpenRouter's top-level directive retain their
different wire formats.

The same isolated install then constructed `VercelModel`, produced a plain system
prompt, and recorded zero fetch calls with fetch replaced by a rejecting recorder.
Selecting the absent native Anthropic adapter still failed with
`ERR_MODULE_NOT_FOUND`. There was no model substitution or paid inference. A
separate regression builds the provider bundle and runs Node with resolution hooks
that reject unselected optional providers; OpenRouter construction and prompt
shaping pass. The combined provider/isolation/wire group passed 38 tests with 131
assertions, including real adapter request formatting with mocked transports.

The OpenRouter adapter moved from ordinary dependencies to an optional peer plus
development dependency. Strands' advertised minimum moved from unqualified 1.4.0
to the exercised 1.17.0. Bun's lock update changed no installed package versions.
Async callers were updated in CLI generation, native generation, composer loops,
tests and the local thinking experiment. The migration guide names the affected APIs.

The isolated receipt is retained under
`C:/Users/Mattm/AppData/Local/Temp/kiln-agent-deps-ac0e507366b34c3588ac1f1f43e4dd52/`.
It contains the lockfile, source-derived bundle and probe. The bundle SHA-256 is
`9d6faf03d307321bc2e3bd5ce5bdee0bbbf61e0ebed8bfebfa1fb072287b83fa`.
This is provider-construction evidence, not a complete installed Kiln generation run.

## Remaining qualification

The SDK itself includes Bedrock runtime as an ordinary dependency. Optional Strands
does keep that closure out of core-only consumers, but an OpenRouter Strands install
cannot currently be described as containing no AWS libraries. Also, the OpenRouter
2.x dependency family and Strands' AI provider v3 contract must remain compatible;
unrelated latest major versions are not interchangeable.

Remaining work includes the end-user engine range and release-pin separation,
fresh complete package installs without agent dependencies, native generation's
neutral/program-reference cutover, optional-provider diagnostics, platform checks
and the authorized live trace campaign. A separate agent package is not required
by the defect reproduced here; selective imports and optional peer metadata address
it without imposing another installation on ordinary CLI/MCP users. Revisit a split
only if independent release cadence or incompatible runtime constraints justify it.
