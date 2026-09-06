// Domain types are shared across the apps via the `@sushi/types` workspace
// package (the single source of truth). This barrel re-exports them so existing
// `./types` / `../types` imports keep working unchanged.
//
// It is a TYPE-ONLY re-export: esbuild/Vite erase it entirely at build time, so
// the deployed bundle never depends on the workspace package (Railway builds
// each app standalone). Local `tsc` resolves `@sushi/types` via the tsconfig
// `paths` mapping.
export type * from '@sushi/types';
