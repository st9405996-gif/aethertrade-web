# Content and SEO guide (content/seo.json)

Edit only `content/seo.json`. Then run `bun run build:site` (or the build command above). That regenerates `public/sitemap.xml` and `public/llms.txt`.

## Fields

- `site.url`: production origin, `https://aethertrade.cloud`.
- `site.description`: used for the Organization schema.
- `site.llmsSummary`: short factual summary for AI systems. Do not add claims the site does not make.
- `pages[].title`: page title. Fill for every page.
- `pages[].description`: meta description, 120 to 160 characters.
- `pages[].indexable`: `false` removes the page from the sitemap and llms.txt.
- `pages[].llmsLabel` and `llmsNote`: one line for llms.txt.

## Rules

- Use only facts about AETHER-TRADE that you confirm. Do not add customers, certifications or partnerships.
- Keep capability status labels honest (Available, In Development, Custom Build, Planned).
- Keep legal pages marked pending legal review until counsel signs off.

## Not in this file yet

- Page body text is still in the page components (`src/routes`). Changing body copy needs a code edit.
- Titles and descriptions inside route files are still the source for the browser `<title>`. Keep them in line with this file.
- A database-backed CMS (edit in browser, publish without a deploy) is not built. It needs a Supabase project and login.
