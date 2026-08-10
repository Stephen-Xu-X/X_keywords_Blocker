# Contributing

Keep changes focused on the userscript and its documentation. Before opening a pull request:

1. Run `npm run check`.
2. Test on a disposable X account or with a duplicate keyword so no unintended terms are added.
3. Do not include cookies, authorization values copied from a browser session, screenshots containing private data, or account identifiers.

X internal endpoints are not a stable public API. Changes to request paths, required headers, response formats, or rate limits should be documented in the README and covered by a safe, non-mutating reproduction where possible.
