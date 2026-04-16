import type { Edge, Node } from "@xyflow/react";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { resolveLanguageModel } from "@/lib/ai-models";

const SYSTEM_PROMPT =
  "Tu es un Product Owner expert en Domain-Driven Design et en Event Storming. A partir d'un graphe de processus metier, tu rediges un backlog de cadrage exploitable par une equipe produit.";

type ExportRequest = {
  nodes?: unknown;
  edges?: unknown;
};

function validateGraphPayload(body: ExportRequest): { nodes: Node[]; edges: Edge[] } {
  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    throw new Error("The request body must include nodes and edges arrays.");
  }

  return {
    nodes: body.nodes as Node[],
    edges: body.edges as Edge[],
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExportRequest & { modelId?: unknown };
    const { nodes, edges } = validateGraphPayload(body);
    const selectedModelId =
      typeof body?.modelId === "string" ? body.modelId : undefined;

    if (nodes.length === 0) {
      return NextResponse.json(
        { error: "At least one node is required to export a backlog draft." },
        { status: 400 },
      );
    }

    const { model, selectedOptionId } = resolveLanguageModel(selectedModelId);

    const prompt = [
      "Analyse ce graphe Event Storming et genere un backlog de cadrage en Markdown.",
      "",
      "Consignes obligatoires :",
      "- Agis comme un Product Owner.",
      "- Regroupe les User Stories par Epic.",
      "- Utilise un Markdown lisible et reutilisable dans Jira, Azure DevOps, Confluence ou un outil equivalent.",
      "- Pour chaque Epic, ajoute un titre et une courte intention produit.",
      "- Pour chaque User Story, utilise le format : `- US-XX En tant que ... je veux ... afin de ...`.",
      "- Ajoute sous chaque User Story une section `Criteres d'acceptation` avec 2 a 4 criteres au format Gherkin/BDD (`Etant donne`, `Quand`, `Alors`).",
      "- Base-toi uniquement sur le graphe fourni. Si une hypothese est necessaire, indique-la brievement dans l'Epic concerne.",
      "- Ne renvoie que du Markdown.",
      "",
      "Graphe a analyser :",
      JSON.stringify({ nodes, edges }, null, 2),
    ].join("\n");

    const { text } = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt,
      temperature: 0.2,
    });

    const markdown = text.trim();

    if (!markdown) {
      throw new Error("Empty model response.");
    }

    return NextResponse.json({
      markdown,
      meta: {
        modelId: selectedOptionId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error.";

    return NextResponse.json(
      {
        error: "Failed to export backlog draft.",
        details: message,
      },
      { status: 500 },
    );
  }
}
