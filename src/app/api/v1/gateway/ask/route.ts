import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { collectErrors, validateString } from "@/lib/utils/validate";
import DOMPurify from "isomorphic-dompurify";
import { createHash } from "crypto";
import { TOOL_ANALYST_PROMPT, getMcpToolDefinitions, executeMcpTool } from "@/lib/mcp/server";
import { logAskQuery, calculateConfidence, getRegisteredSite } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  try {
    // Validate site ID
    const siteId = request.headers.get("x-site-id");
    if (!siteId) {
      return apiError("MISSING_SITE_ID", "X-Site-Id header is required", 400);
    }

    const site = await getRegisteredSite(siteId);
    if (!site || !site.active) {
      return apiError("INVALID_SITE", `Site '${siteId}' is not registered or inactive`, 403);
    }

    // Rate limit per site + IP
    const ip = getClientIp(request);
    const { success: rateLimitOk } = rateLimit(`gateway:ask:${siteId}:${ip}`, 20, 3600000);
    if (!rateLimitOk) {
      return apiError("RATE_LIMITED", "Too many requests. Try again later.", 429);
    }

    const body = await request.json();

    const errors = collectErrors(
      validateString(body.question, "question", { min: 2, max: 500 }),
    );
    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid input", 400, errors);
    }

    const question = DOMPurify.sanitize(body.question.trim());
    const context = body.context || {};

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return apiError("LLM_UNAVAILABLE", "AI service is not configured", 503);
    }

    // Use site-specific system prompt if available
    const systemPrompt = (site.mcpConfig as { systemPrompt?: string })?.systemPrompt || TOOL_ANALYST_PROMPT;
    const toolDefs = getMcpToolDefinitions();

    const messages: Array<{ role: string; content: unknown }> = [
      {
        role: "user",
        content: question + (context.toolSlug ? ` (Context: currently viewing tool "${context.toolSlug}")` : "") + (context.pageUrl ? ` (Page: ${context.pageUrl})` : ""),
      },
    ];

    let response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: systemPrompt,
        tools: toolDefs,
        messages,
      }),
    });

    if (!response.ok) {
      console.error("Claude API error:", response.status, await response.text());
      return apiError("LLM_UNAVAILABLE", "AI service temporarily unavailable", 503);
    }

    let result = await response.json();

    // Tool use loop
    let iterations = 0;
    while (result.stop_reason === "tool_use" && iterations < 5) {
      iterations++;
      const toolUseBlocks = result.content.filter((block: { type: string }) => block.type === "tool_use");
      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        try {
          const toolResult = await executeMcpTool(toolUse.name, toolUse.input || {});
          toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(toolResult).slice(0, 50000) });
        } catch (err) {
          toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify({ error: err instanceof Error ? err.message : "Tool execution failed" }), is_error: true });
        }
      }

      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: systemPrompt,
          tools: toolDefs,
          messages: [...messages, { role: "assistant", content: result.content }, { role: "user", content: toolResults }],
        }),
      });

      if (!response.ok) break;
      result = await response.json();
    }

    const textBlocks = result.content?.filter((block: { type: string }) => block.type === "text") || [];
    const rawText = textBlocks.map((b: { text: string }) => b.text).join("\n");

    // Calculate confidence
    const confidence = await calculateConfidence([]);

    // Log query with site context
    const ipHash = createHash("sha256").update(ip).digest("hex");
    const normalizedQuery = question.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
    logAskQuery({
      query: question,
      normalizedQuery,
      responseConfidence: confidence.level,
      toolsReferenced: [],
      ipHash,
      site: siteId,
    }).catch(err => console.error("Failed to log ask query:", err));

    return apiSuccess({
      answer: rawText,
      confidence: confidence.level,
      site: siteId,
    });
  } catch (err) {
    console.error("Gateway ask error:", err);
    return apiError("INTERNAL_ERROR", "Something went wrong", 500);
  }
}
