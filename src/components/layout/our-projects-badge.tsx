"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface OwnedRepo {
  name: string;
  slug: string;
  githubStars: number | null;
  githubForks: number | null;
  language: string | null;
  description: string;
}

export function OurProjectsBadge() {
  const [repos, setRepos] = useState<OwnedRepo[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/v1/repos?owner=samibs&pageSize=10")
      .then((r) => r.json())
      .then((data) => {
        if (data.data?.repos) {
          setRepos(data.data.repos.map((r: Record<string, unknown>) => ({
            name: typeof r.name === "string" ? r.name.split("/").pop() || r.name : String(r.name),
            slug: r.slug,
            githubStars: r.githubStars,
            githubForks: r.githubForks,
            language: r.language,
            description: typeof r.description === "string" ? r.description.slice(0, 80) : "",
          })));
        }
      })
      .catch(() => {});
  }, []);

  if (repos.length === 0) return null;

  return (
    <div
      className="our-projects-badge"
      style={{
        position: "fixed",
        right: 0,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 45,
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <AnimatePresence mode="wait">
        {!expanded ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
            style={{
              background: "var(--bg-surface)",
              borderLeft: "2px solid var(--accent-owned)",
              borderTop: "1px solid var(--border-default)",
              borderBottom: "1px solid var(--border-default)",
              borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)",
              padding: "12px 6px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--accent-owned)",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              OUR PROJECTS
            </span>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--accent-owned)",
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "auto" }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              background: "var(--bg-surface)",
              borderLeft: "2px solid var(--accent-owned)",
              borderTop: "1px solid var(--border-default)",
              borderBottom: "1px solid var(--border-default)",
              borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)",
              padding: "12px",
              minWidth: "200px",
              maxWidth: "240px",
              boxShadow: "-4px 0 12px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--accent-owned)",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--accent-owned)",
                  flexShrink: 0,
                }}
              />
              OUR PROJECTS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {repos.map((repo) => (
                <Link
                  key={repo.slug}
                  href={`/repos/${repo.slug}`}
                  className="no-underline"
                  style={{
                    display: "block",
                    padding: "8px",
                    background: "var(--bg-owned)",
                    border: "1px solid var(--accent-owned-dim)",
                    borderRadius: "var(--radius-sm)",
                    transition: "border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-owned)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-owned-dim)";
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--accent-owned)",
                      marginBottom: "4px",
                    }}
                  >
                    {repo.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {repo.githubStars != null && (
                      <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                        <span style={{ color: "var(--accent-owned)" }}>&#9733;</span>
                        {repo.githubStars.toLocaleString()}
                      </span>
                    )}
                    {repo.language && (
                      <span>{repo.language}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
