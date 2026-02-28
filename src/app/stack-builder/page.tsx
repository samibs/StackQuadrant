import type { Metadata } from "next";
import { getToolsForStackBuilder } from "@/lib/db/queries";
import { StackBuilderClient } from "./stack-builder-client";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stack Builder — Build Your AI Tool Stack — StackQuadrant",
  description: "Combine AI developer tools into a custom stack. See compatibility scores, strengths, and gaps across your chosen toolset.",
  alternates: { canonical: "/stack-builder" },
};

export default async function StackBuilderPage() {
  const availableTools = await getToolsForStackBuilder();

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Stack Builder", href: "/stack-builder" }]} />
      <div style={{ padding: "var(--grid-gap) var(--grid-gap) 0" }}>
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Stack Builder" }]} />
      </div>
      <StackBuilderClient availableTools={availableTools} />
    </>
  );
}
