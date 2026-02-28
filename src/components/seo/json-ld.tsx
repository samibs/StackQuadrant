interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://stackquadrant.dev";

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "StackQuadrant",
        url: BASE_URL,
        description: "Data-driven evaluations of AI coding tools, stacks, and workflows.",
        sameAs: ["https://github.com/samibs/StackQuadrant"],
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "StackQuadrant",
        url: BASE_URL,
        description: "AI Developer Tool Intelligence Platform",
        potentialAction: {
          "@type": "SearchAction",
          target: `${BASE_URL}/matrix?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; href: string }> }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${BASE_URL}${item.href}`,
        })),
      }}
    />
  );
}

export function SoftwareApplicationJsonLd({
  name,
  description,
  url,
  category,
  score,
  vendor,
}: {
  name: string;
  description: string;
  url: string;
  category: string;
  score: number | null;
  vendor: string | null;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name,
        description,
        url: `${BASE_URL}${url}`,
        applicationCategory: category,
        ...(vendor && { author: { "@type": "Organization", name: vendor } }),
        ...(score && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: score,
            bestRating: 10,
            worstRating: 0,
            ratingCount: 6,
          },
        }),
      }}
    />
  );
}
