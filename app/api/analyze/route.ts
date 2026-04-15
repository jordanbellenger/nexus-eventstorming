import Anthropic from "@anthropic-ai/sdk";
import type { Edge, Node } from "@xyflow/react";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT =
  "Tu es un expert en Domain-Driven Design (DDD) et en Event Storming. Ton but est d'analyser une transcription de réunion et d'en extraire le processus métier.";

type AnalyzeResponse = {
  nodes: Node[];
  edges: Edge[];
};

function extractTextContent(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function extractJsonPayload(rawText: string): AnalyzeResponse {
  const candidate = rawText.trim();

  if (!candidate) {
    throw new Error("Empty model response.");
  }

  try {
    return validateAnalyzeResponse(JSON.parse(candidate));
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("No JSON object found in model response.");
    }

    return validateAnalyzeResponse(JSON.parse(candidate.slice(start, end + 1)));
  }
}

function validateAnalyzeResponse(payload: unknown): AnalyzeResponse {
  if (!payload || typeof payload !== "object") {
    throw new Error("Model payload must be an object.");
  }

  const candidate = payload as Partial<AnalyzeResponse>;

  if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) {
    throw new Error("Model payload must contain nodes and edges arrays.");
  }

  return {
    nodes: candidate.nodes as Node[],
    edges: candidate.edges as Edge[],
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
    const body = (await request.json()) as { transcript?: unknown };
    const transcript =
      typeof body?.transcript === "string" ? body.transcript.trim() : "";

    if (!transcript) {
      return NextResponse.json(
        { error: "The request body must include a non-empty transcript." },
        { status: 400 },
      );
    }

    const prompt = [
      "Analyse la transcription suivante et construis un board Event Storming.",
      "",
      "Extrais les elements selon les codes couleurs suivants :",
      "- Domain Events (evenements passes, ex: 'Commande Validee') -> Couleur : Orange",
      "- Commands (actions utilisateur, ex: 'Payer la commande') -> Couleur : Bleu",
      "- Actors (utilisateurs/systemes) -> Couleur : Jaune",
      "",
      "Format de sortie obligatoire :",
      "- Renvoyer UNIQUEMENT un objet JSON.",
      "- L'objet JSON doit contenir exactement deux tableaux racine : `nodes` et `edges`.",
      "- Les tableaux doivent etre parfaitement compatibles avec @xyflow/react.",
      "- Assigner des coordonnees `x` et `y` logiques aux noeuds pour un affichage de gauche a droite selon le flux chronologique.",
      "- Ajouter la couleur de fond correspondante dans `data.style` pour chaque noeud.",
      "- Ne rien inclure avant ou apres le JSON.",
      "",
      "Transcription :",
      transcript,
    ].join("\n");

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      system: SYSTEM_PROMPT,
      max_tokens: 4096,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = extractTextContent(response);
    const parsed = extractJsonPayload(rawText);

    return NextResponse.json(parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error.";

    return NextResponse.json(
      {
        error: "Failed to analyze transcript.",
        details: message,
      },
      { status: 500 },
    );
  }
}
