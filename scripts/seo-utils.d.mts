export function escapeXml(value: unknown): string;
export function validateSeoConfig(config: unknown): string[];
export function buildSitemap(config: { site: { url: string }; pages: Array<{ path: string; indexable?: boolean }> }): string;
export function buildLlms(config: { site: { name: string; url: string; llmsSummary: string }; pages: Array<{ path: string; indexable?: boolean; llmsLabel?: string; llmsNote?: string }> }): string;
