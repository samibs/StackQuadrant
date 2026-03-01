import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { collectErrors, validateString } from "@/lib/utils/validate";
import DOMPurify from "isomorphic-dompurify";
import { TOOL_ANALYST_PROMPT, getMcpToolDefinitions, executeMcpTool } from "@/lib/mcp/server";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20/hour/IP
    const ip = getClientIp(request);
    const { success: rateLimitOk } = rateLimit(`widget:ask:${ip}`, 20, 3600000);
    if (!rateLimitOk) {
      return apiError("RATE_LIMITED", "Too many requests. Try again later.", 429);
    }

    const body = await request.json();

    // Validate
    const errors = collectErrors(
      validateString(body.question, "question", { min: 2, max: 500 }),
    );
    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid input", 400, errors);
    }

    const question = DOMPurify.sanitize(body.question.trim());
    const context = body.context || {};

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return apiError("LLM_UNAVAILABLE", "AI service is not configured", 503);
    }

    // Get MCP tool definitions for Claude
    const toolDefs = getMcpToolDefinitions();

    // Call Claude API with tools
    const messages: Array<{ role: string; content: unknown }> = [
      {
        role: "user",
        content: question + (context.toolSlug ? ` (Context: currently viewing tool "${context.toolSlug}")` : "") + (context.pageUrl ? ` (Page: ${context.pageUrl})` : ""),
      },
    ];

    // Make the initial Claude API call
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
        system: TOOL_ANALYST_PROMPT,
        tools: toolDefs,
        messages,
      }),
    });

    if (!response.ok) {
      console.error("Claude API error:", response.status, await response.text());
      return apiError("LLM_UNAVAILABLE", "AI service temporarily unavailable", 503);
    }

    let result = await response.json();

    // Tool use loop - process up to 5 tool calls
    let iterations = 0;
    while (result.stop_reason === "tool_use" && iterations < 5) {
      iterations++;

      // Find tool use blocks
      const toolUseBlocks = result.content.filter((block: { type: string }) => block.type === "tool_use");

      // Execute each tool
      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        try {
          const toolResult = await executeMcpTool(toolUse.name, toolUse.input || {});
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(toolResult).slice(0, 50000), // Truncate large results
          });
        } catch (err) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify({ error: err instanceof Error ? err.message : "Tool execution failed" }),
            is_error: true,
          });
        }
      }

      // Continue conversation with tool results
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: TOOL_ANALYST_PROMPT,
          tools: toolDefs,
          messages: [
            ...messages,
            { role: "assistant", content: result.content },
            { role: "user", content: toolResults },
          ],
        }),
      });

      if (!response.ok) {
        console.error("Claude API error in tool loop:", response.status);
        break;
      }

      result = await response.json();
    }

    // Extract text response
    const textBlocks = result.content?.filter((block: { type: string }) => block.type === "text") || [];
    const rawText = textBlocks.map((b: { text: string }) => b.text).join("\n");

    // Parse the response into structured format
    const structured = parseAskResponse(rawText);

    return apiSuccess(structured);
  } catch (err) {
    console.error("Widget ask error:", err);
    return apiError("INTERNAL_ERROR", "Something went wrong", 500);
  }
}

// Parse Claude's text response into our structured AskResponse format
function parseAskResponse(text: string) {
  // Try to extract structured data from the response
  // Claude is instructed to use a specific format, but we handle free-form too

  const lines = text.split("\n").filter(l => l.trim());

  // Extract recommendation
  let toolName = "";
  let toolSlug = "";
  let quadrant = "";
  let confidence: "high" | "medium" | "low" = "medium";
  const rationale: string[] = [];
  const alternatives: Array<{ toolSlug: string; toolName: string; reason: string }> = [];
  const sources: string[] = [];

  let section = "";
  for (const line of lines) {
    const lower = line.toLowerCase().trim();

    if (lower.startsWith("recommendation:") || lower.startsWith("**recommendation")) {
      section = "recommendation";
      const match = line.match(/:\s*(.+)/);
      if (match) {
        toolName = match[1].replace(/\*\*/g, "").trim();
        toolSlug = toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
    } else if (lower.startsWith("quadrant:") || lower.includes("quadrant:")) {
      const match = line.match(/quadrant:\s*(.+)/i);
      if (match) quadrant = match[1].replace(/\*\*/g, "").trim();
    } else if (lower.startsWith("confidence:") || lower.includes("confidence:")) {
      if (lower.includes("high")) confidence = "high";
      else if (lower.includes("low")) confidence = "low";
      else confidence = "medium";
    } else if (lower.startsWith("rationale") || lower.startsWith("**rationale")) {
      section = "rationale";
    } else if (lower.startsWith("alternative") || lower.startsWith("**alternative")) {
      section = "alternatives";
    } else if (lower.startsWith("source") || lower.startsWith("**source") || lower.startsWith("data source")) {
      section = "sources";
    } else if (line.trim().startsWith("-") || line.trim().startsWith("•") || line.trim().match(/^\d+\./)) {
      const content = line.trim().replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, "").trim();
      if (section === "rationale" && content) {
        rationale.push(content);
      } else if (section === "alternatives" && content) {
        const altMatch = content.match(/\*?\*?([^*:—–-]+)\*?\*?\s*[—–:-]\s*(.+)/);
        if (altMatch) {
          const altName = altMatch[1].trim();
          alternatives.push({
            toolSlug: altName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            toolName: altName,
            reason: altMatch[2].trim(),
          });
        }
      } else if (section === "sources" && content) {
        sources.push(content);
      } else if (!section && content) {
        // Unstructured bullets go to rationale
        rationale.push(content);
      }
    }
  }

  // If we couldn't parse structured data, return the raw text as rationale
  if (!toolName && rationale.length === 0) {
    return {
      recommendation: { toolSlug: "", toolName: "See analysis below", quadrant: "", confidence: "medium" },
      rationale: [text.slice(0, 1000)],
      alternatives: [],
      confidence: "medium" as const,
      sources: ["dimension_scores"],
    };
  }

  return {
    recommendation: { toolSlug, toolName: toolName || "See analysis", quadrant, confidence },
    rationale: rationale.slice(0, 6),
    alternatives: alternatives.slice(0, 4),
    confidence,
    sources: sources.length > 0 ? sources : ["dimension_scores", "quadrant_position"],
  };
}
