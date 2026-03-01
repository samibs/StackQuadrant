import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogPosts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — StackQuadrant",
  description: "Insights on AI coding tools, evaluation methodology, and the evolving developer tools landscape.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <div className="wide-container" style={{ maxWidth: "900px", margin: "0 auto", padding: "var(--space-5) var(--space-4)" }}>
      <div style={{ marginBottom: "var(--space-5)" }}>
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
          Blog
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>
          Insights on AI coding tools, methodology updates, and market analysis
        </p>
      </div>

      {posts.length === 0 ? (
        <div style={{
          padding: "var(--space-6)",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          color: "var(--text-muted)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
        }}>
          No articles published yet. Check back soon.
        </div>
      ) : (
        <div className="flex flex-col blog-post-list" style={{ gap: "var(--space-4)" }}>
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="no-underline"
              style={{
                display: "block",
                padding: "var(--space-4)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
              }}
            >
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
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                    {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
              <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>
                {post.title}
              </h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                {post.excerpt}
              </p>
              {post.tags && (post.tags as string[]).length > 0 && (
                <div className="flex flex-wrap gap-1" style={{ marginTop: "var(--space-2)" }}>
                  {(post.tags as string[]).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        padding: "1px 5px",
                        border: "1px solid var(--border-default)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
