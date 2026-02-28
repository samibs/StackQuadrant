import { getPublishedTools } from "@/lib/db/queries";
import { MatrixClient } from "./matrix-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Capability Matrix — StackQuadrant",
  description: "Interactive comparison of AI coding tools across multiple dimensions",
};

export default async function MatrixPage() {
  let data;
  try {
    data = await getPublishedTools({ page: 1, pageSize: 100, sort: "-overallScore", search: "", category: "" });
  } catch {
    data = { tools: [], total: 0, page: 1, pageSize: 100 };
  }

  return <MatrixClient tools={data.tools} />;
}
