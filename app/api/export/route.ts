import Anthropic from "@anthropic-ai/sdk";
import type { Edge, Node } from "@xyflow/react";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT =
  "Tu es un Product Owner expert en Domain-Driven Design et en Event Storming. A partir d'un graphe de processus metier, tu rediges un backlog de User Stories actionnable pour Jira.";

type ExportRequest = {
  nodes?: unknown;
  edges?: unknown;
};

function extractTextContent(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

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
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as ExportRequest;
    const { nodes, edges } = validateGraphPayload(body);

    if (nodes.length === 0) {
      return NextResponse.json(
        { error: "At least one node is required to generate Jira tickets." },
        { status: 400 },
      );
    }

    const prompt = [
      "Analyse ce graphe Event Storming et genere un backlog Jira en Markdown.",
      "",
      "Consignes obligatoires :",
      "- Agis comme un Product Owner.",
      "- Regroupe les User Stories par Epic.",
      "- Utilise un Markdown lisible et directement exploitable dans Jira ou Confluence.",
      "- Pour chaque Epic, ajoute un titre et une courte intention produit.",
      "- Pour chaque User Story, utilise le format : `- US-XX En tant que ... je veux ... afin de ...`.",
      "- Ajoute sous chaque User Story une section `Criteres d'acceptation` avec 2 a 4 criteres au format Gherkin/BDD (`Etant donne`, `Quand`, `Alors`).",
      "- Base-toi uniquement sur le graphe fourni. Si une hypothese est necessaire, indique-la brievement dans l'Epic concerne.",
      "- Ne renvoie que du Markdown.",
      "",
      "Graphe a analyser :",
      JSON.stringify({ nodes, edges }, null, 2),
    ].join("\n");

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      system: SYSTEM_PROMPT,
      max_tokens: 4096,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const markdown = extractTextContent(response);

    if (!markdown) {
      throw new Error("Empty model response.");
    }

    return NextResponse.json({ markdown });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error.";

    return NextResponse.json(
      {
        error: "Failed to export Jira tickets.",
        details: message,
      },
      { status: 500 },
    );
  }
}
