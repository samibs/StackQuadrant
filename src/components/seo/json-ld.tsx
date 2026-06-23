interface JsonLdProps {
  data: Record<string, unknown>;
}

// JSON.stringify already escapes </ embeddings safely for our payload shapes
// (we only pass plain serializable data — never user-supplied raw HTML). We
// still defensively escape `<` to avoid `</script>` breakouts if a field ever
// contains the literal "</script>" substring.
function safeStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeStringify(data) }}
    />
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stackquadrant.com";

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

export interface DimensionReview {
  dimension: string;
  score: number;
  evidence?: string | null;
  weight?: number | null;
}

export function buildSoftwareApplicationData(opts: {
  name: string;
  description: string;
  url: string;
  category: string;
  score: number | null;
  vendor: string | null;
  reviews?: DimensionReview[];
  reviewCount?: number;
}) {
  const { name, description, url, category, score, vendor, reviews, reviewCount } = opts;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: `${BASE_URL}${url}`,
    applicationCategory: category,
  };
  if (vendor) {
    data.author = { "@type": "Organization", name: vendor };
    data.publisher = { "@type": "Organization", name: vendor };
  }
  if (score !== null && score !== undefined) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: score,
      bestRating: 10,
      worstRating: 0,
      ratingCount: reviewCount ?? (reviews?.length ?? 1),
      reviewCount: reviewCount ?? (reviews?.length ?? 1),
    };
  }
  if (reviews && reviews.length > 0) {
    data.review = reviews.map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.score,
        bestRating: 10,
        worstRating: 0,
      },
      name: r.dimension,
      reviewBody: r.evidence || `${r.dimension} score: ${r.score}/10`,
      author: { "@type": "Organization", name: "StackQuadrant" },
    }));
  }
  return data;
}

export function SoftwareApplicationJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  category: string;
  score: number | null;
  vendor: string | null;
  reviews?: DimensionReview[];
  reviewCount?: number;
}) {
  return <JsonLd data={buildSoftwareApplicationData(opts)} />;
}

export function buildSoftwareSourceCodeData(opts: {
  name: string;
  description: string;
  url: string;
  codeRepository: string;
  programmingLanguage?: string | null;
  license?: string | null;
  score: number | null;
  category?: string | null;
  reviews?: DimensionReview[];
  stars?: number | null;
}) {
  const { name, description, url, codeRepository, programmingLanguage, license, score, category, reviews, stars } = opts;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name,
    description,
    url: `${BASE_URL}${url}`,
    codeRepository,
  };
  if (programmingLanguage) data.programmingLanguage = programmingLanguage;
  if (license) data.license = license;
  if (category) data.applicationCategory = category;
  if (stars !== null && stars !== undefined) {
    data.interactionStatistic = {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: stars,
    };
  }
  if (score !== null && score !== undefined) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: score,
      bestRating: 10,
      worstRating: 0,
      ratingCount: reviews?.length ?? 1,
      reviewCount: reviews?.length ?? 1,
    };
  }
  if (reviews && reviews.length > 0) {
    data.review = reviews.map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.score,
        bestRating: 10,
        worstRating: 0,
      },
      name: r.dimension,
      reviewBody: r.evidence || `${r.dimension} score: ${r.score}/10`,
      author: { "@type": "Organization", name: "StackQuadrant" },
    }));
  }
  return data;
}

export function SoftwareSourceCodeJsonLd(opts: Parameters<typeof buildSoftwareSourceCodeData>[0]) {
  return <JsonLd data={buildSoftwareSourceCodeData(opts)} />;
}

export interface BenchmarkObservation {
  toolName: string;
  toolUrl?: string;
  metric: string;
  unit: string;
  value: number | string;
  higherIsBetter: boolean;
}

export function buildBenchmarkDatasetData(opts: {
  title: string;
  description: string;
  url: string;
  methodology: string;
  category: string;
  observations: BenchmarkObservation[];
  variables: Array<{ name: string; unit: string; higherIsBetter: boolean }>;
}) {
  const { title, description, url, methodology, category, observations, variables } = opts;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: title,
    description,
    url: `${BASE_URL}${url}`,
    keywords: ["AI coding tools", category, "benchmark", "developer tools"],
    creator: { "@type": "Organization", name: "StackQuadrant", url: BASE_URL },
    publisher: { "@type": "Organization", name: "StackQuadrant", url: BASE_URL },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    measurementTechnique: methodology,
    variableMeasured: variables.map((v) => ({
      "@type": "PropertyValue",
      name: v.name,
      unitText: v.unit,
      description: v.higherIsBetter ? "Higher is better" : "Lower is better",
    })),
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "text/html",
      contentUrl: `${BASE_URL}${url}`,
    },
    hasPart: observations.map((o) => ({
      "@type": "Observation",
      observationAbout: {
        "@type": "SoftwareApplication",
        name: o.toolName,
        ...(o.toolUrl ? { url: `${BASE_URL}${o.toolUrl}` } : {}),
      },
      measuredProperty: o.metric,
      value: o.value,
      unitText: o.unit,
    })),
  };
}

export function BenchmarkDatasetJsonLd(opts: Parameters<typeof buildBenchmarkDatasetData>[0]) {
  return <JsonLd data={buildBenchmarkDatasetData(opts)} />;
}

export interface CollectionItem {
  name: string;
  url: string;
  description?: string;
  score?: number | null;
}

export function buildCollectionPageData(opts: {
  name: string;
  description: string;
  url: string;
  items: CollectionItem[];
  itemKind?: string;
}) {
  const { name, description, url, items, itemKind } = opts;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${BASE_URL}${url}`,
    isPartOf: { "@type": "WebSite", name: "StackQuadrant", url: BASE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}${it.url}`,
        name: it.name,
        ...(it.description ? { description: it.description } : {}),
        ...(itemKind && it.score !== undefined && it.score !== null
          ? {
              item: {
                "@type": itemKind,
                name: it.name,
                url: `${BASE_URL}${it.url}`,
                ...(it.description ? { description: it.description } : {}),
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: it.score,
                  bestRating: 10,
                  worstRating: 0,
                  ratingCount: 1,
                },
              },
            }
          : itemKind
            ? {
                item: {
                  "@type": itemKind,
                  name: it.name,
                  url: `${BASE_URL}${it.url}`,
                  ...(it.description ? { description: it.description } : {}),
                },
              }
            : {}),
      })),
    },
  };
}

export function CollectionPageJsonLd(opts: Parameters<typeof buildCollectionPageData>[0]) {
  return <JsonLd data={buildCollectionPageData(opts)} />;
}
