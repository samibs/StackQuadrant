import type { Metadata } from "next";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { getBlogPostBySlug } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — StackQuadrant Blog`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const tags = (post.tags || []) as string[];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "var(--space-5) var(--space-4)" }}>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]} />

      <article>
        <header style={{ marginBottom: "var(--space-5)" }}>
          <div className="flex items-center gap-[var(--space-2)]" style={{ marginBottom: "var(--space-2)" }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              padding: "2px 6px",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-muted)",
              textTransform: "uppercase",
            }}>
              {post.category}
            </span>
            {post.publishedAt && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", lineHeight: "1.3" }}>
            {post.title}
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)", marginTop: "var(--space-2)", lineHeight: "1.6" }}>
            {post.excerpt}
          </p>
        </header>

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--text-primary)",
            lineHeight: "1.8",
          }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
        />

        {tags.length > 0 && (
          <div style={{ marginTop: "var(--space-5)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border-default)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-2)" }}>
              Related Tools
            </div>
            <div className="flex flex-wrap gap-[var(--space-1)]">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tools/${tag}`}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    padding: "3px 8px",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--accent-primary)",
                    textDecoration: "none",
                  }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <div style={{ marginTop: "var(--space-5)", textAlign: "center" }}>
        <Link href="/blog" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-primary)" }}>
          &larr; Back to all articles
        </Link>
      </div>
    </div>
  );
}
