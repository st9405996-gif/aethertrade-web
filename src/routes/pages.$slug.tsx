import { createFileRoute, notFound } from "@tanstack/react-router";
import { CmsPageRenderer } from "@/components/site/cms-page-renderer";
import { meta } from "@/components/site/blocks";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { cmsPagePath, isRoutableCmsPageSlug } from "@/lib/cms-page-routing";

export const Route = createFileRoute("/pages/$slug")({
  loader: async ({ params }) => {
    if (!isRoutableCmsPageSlug(params.slug)) throw notFound();

    const cmsPage = await getPublishedCmsPage({ data: { slug: params.slug } });
    if (!cmsPage) throw notFound();
    return cmsPage;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const description =
      loaderData.seoDescription || loaderData.body.replace(/\s+/g, " ").trim().slice(0, 160);
    return mergeCmsHead(meta(loaderData.seoTitle || loaderData.title, description), loaderData, {
      fallbackPath: cmsPagePath(loaderData.slug),
    });
  },
  component: CmsPageRoute,
});

function CmsPageRoute() {
  const page = Route.useLoaderData();
  return <CmsPageRenderer page={page} />;
}
