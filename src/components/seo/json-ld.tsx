interface JsonLdProps {
  data: Record<string, unknown>;
}

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
const CONTENT_LICENSE_URL = process.env.NEXT_PUBLIC_CONTENT_LICENSE_URL;

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

function editorialReview(score: number | null, dimensions?: DimensionReview[]) {
  if (score === null || score === undefined) return undefined;
  const dimensionSummary = (dimensions ?? [])
    .map((dimension) => `${dimension.dimension}: ${dimension.score}/10`)
    .join("; ");
  return {
    "@type": "Review",
    name: "StackQuadrant editorial evaluation",
    reviewRating: {
      "@type": "Rating",
      ratingValue: score,
      bestRating: 10,
      worstRating: 0,
    },
    ...(dimensionSummary ? { reviewBody: `Dimension scores — ${dimensionSummary}` } : {}),
    author: { "@type": "Organization", name: "StackQuadrant", url: BASE_URL },
  };
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
  const { name, description, url, category, score, vendor, reviews } = opts;
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
  const review = editorialReview(score, reviews);
  if (review) data.review = review;
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
  const review = editorialReview(score, reviews);
  if (review) data.review = review;
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
    ...(CONTENT_LICENSE_URL ? { license: CONTENT_LICENSE_URL } : {}),
    isAccessibleForFree: true,
    measurementTechnique: methodology,
    variableMeasured: variables.map((variable) => ({
      "@type": "PropertyValue",
      name: variable.name,
      unitText: variable.unit,
      description: variable.higherIsBetter ? "Higher is better" : "Lower is better",
    })),
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "text/html",
      contentUrl: `${BASE_URL}${url}`,
    },
    hasPart: observations.map((observation) => ({
      "@type": "Observation",
      observationAbout: {
        "@type": "SoftwareApplication",
        name: observation.toolName,
        ...(observation.toolUrl ? { url: `${BASE_URL}${observation.toolUrl}` } : {}),
      },
      measuredProperty: observation.metric,
      value: observation.value,
      unitText: observation.unit,
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
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${BASE_URL}${item.url}`,
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(itemKind
          ? {
              item: {
                "@type": itemKind,
                name: item.name,
                url: `${BASE_URL}${item.url}`,
                ...(item.description ? { description: item.description } : {}),
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
