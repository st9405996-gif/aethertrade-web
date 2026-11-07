/**
 * Build-time switch for the browser-only admin demo and its sign-in previews.
 * `__ADMIN_DEMO__` is injected by vite.config.ts from the build environment variable
 * VITE_ENABLE_ADMIN_DEMO, so production builds compile the admin code out entirely.
 * Dev preview always keeps the demo.
 */
export const adminDemoEnabled: boolean = import.meta.env.DEV || __ADMIN_DEMO__;
