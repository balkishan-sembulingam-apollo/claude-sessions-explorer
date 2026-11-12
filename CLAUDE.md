# Project instructions for AI agents

## Don't run builds/typechecks proactively

Do NOT run `npm run build`, `vite build`, or `tsc -b` after making code changes unless
the user explicitly asks for a build/typecheck, or something is actually stalled/broken
and you need to diagnose it. Just make the edit and move on. The user runs the dev
server themselves and will report errors if any come up.
