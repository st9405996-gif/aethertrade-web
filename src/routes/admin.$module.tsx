import { createFileRoute, notFound } from "@tanstack/react-router";
import { AdminWorkspaceRoute } from "@/components/admin/admin-lazy";
import { modules, type ModuleId } from "@/lib/workspace-model";
export const Route = createFileRoute("/admin/$module")({
  loader: ({ params }) => {
    const entry = modules.find((m) => m[0] === params.module);
    if (!entry) throw notFound();
    return { title: entry[1] };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || "Unavailable"} — AETHER-TRADE Admin` },
      {
        name: "description",
        content: `AETHER-TRADE administrator workspace for managing ${loaderData?.title || "website content and operations"}.`,
      },
      { property: "og:title", content: `${loaderData?.title || "Unavailable"} — AETHER-TRADE` },
      {
        property: "og:description",
        content: "Authenticated administrator workspace. No public indexing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminModule,
});
function AdminModule() {
  const { module } = Route.useParams();
  return <AdminWorkspaceRoute key={module} module={module as ModuleId} />;
}
