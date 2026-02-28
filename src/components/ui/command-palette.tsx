"use client";

import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchItem {
  id: string;
  name: string;
  type: "tool" | "quadrant" | "benchmark" | "stack" | "repo" | "showcase";
  slug: string;
  category?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let searchCache: { items: SearchItem[]; fetchedAt: number } | null = null;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SearchItem[]>(searchCache?.items || []);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) return;
    const cacheValid = searchCache && (Date.now() - searchCache.fetchedAt) < CACHE_TTL_MS;
    if (cacheValid && searchCache) {
      setItems(searchCache.items);
      return;
    }
    fetch("/api/v1/search")
      .then((res) => res.json())
      .then((data) => {
        const fetched = data.data || [];
        searchCache = { items: fetched, fetchedAt: Date.now() };
        setItems(fetched);
      })
      .catch(() => {});
  }, [open]);

  const navigate = (item: SearchItem) => {
    const paths: Record<string, string> = {
      tool: `/tools/${item.slug}`,
      quadrant: `/quadrants/${item.slug}`,
      benchmark: `/benchmarks/${item.slug}`,
      stack: `/stacks/${item.slug}`,
      repo: `/repos/${item.slug}`,
      showcase: `/showcase/${item.slug}`,
    };
    router.push(paths[item.type]);
    setOpen(false);
  };

  const typeIcons: Record<string, string> = {
    tool: "\u2692",
    quadrant: "\u25A6",
    benchmark: "\u23F1",
    stack: "\u2630",
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 90vw)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
        }}
      >
        <Command label="Search StackQuadrant" shouldFilter={true}>
          <Command.Input
            placeholder="Search tools, quadrants, benchmarks, stacks..."
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--border-default)",
              outline: "none",
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              color: "var(--text-primary)",
            }}
          />
          <Command.List
            style={{
              maxHeight: "320px",
              overflow: "auto",
              padding: "var(--space-1)",
            }}
          >
            <Command.Empty
              style={{
                padding: "24px",
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              No results found
            </Command.Empty>

            {["tool", "quadrant", "benchmark", "stack"].map((type) => {
              const filtered = items.filter((i) => i.type === type);
              if (filtered.length === 0) return null;
              return (
                <Command.Group
                  key={type}
                  heading={type.charAt(0).toUpperCase() + type.slice(1) + "s"}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    padding: "8px 8px 4px",
                  }}
                >
                  {filtered.map((item) => (
                    <Command.Item
                      key={`${item.type}-${item.id}`}
                      value={`${item.name} ${item.category || ""}`}
                      onSelect={() => navigate(item)}
                      className="cursor-pointer"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        fontFamily: "var(--font-sans)",
                        fontSize: "13px",
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ opacity: 0.5 }}>{typeIcons[item.type]}</span>
                      {item.name}
                      {item.category && (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
                          {item.category}
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
