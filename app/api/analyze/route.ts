import type { Edge, Node } from "@xyflow/react";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveLanguageModel } from "@/lib/ai-models";

const SYSTEM_PROMPT =
  "Tu es un expert en Domain-Driven Design (DDD) et en Event Storming. Ton but est d'analyser une transcription de réunion et d'en extraire le processus métier.";

const nodeSchema = z.object({
  id: z.string(),
  type: z.string().nullable(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string(),
    style: z.object({
      background: z.string(),
      color: z.string(),
      border: z.string(),
    }),
  }),
  draggable: z.boolean(),
});

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().nullable(),
  animated: z.boolean(),
  label: z.string().nullable(),
});

const analyzeResponseSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

type AnalyzeResponse = {
  nodes: Node[];
  edges: Edge[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      transcript?: unknown;
      modelId?: unknown;
    };
    const transcript =
      typeof body?.transcript === "string" ? body.transcript.trim() : "";
    const selectedModelId =
      typeof body?.modelId === "string" ? body.modelId : undefined;

    if (!transcript) {
      return NextResponse.json(
        { error: "The request body must include a non-empty transcript." },
        { status: 400 },
      );
    }

    const { model, selectedOptionId } = resolveLanguageModel(selectedModelId);

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
      "- Utiliser `data.label` pour le texte affiche sur le noeud.",
      "- Marquer les noeuds comme deplacables si pertinent.",
      "",
      "Transcription :",
      transcript,
    ].join("\n");

    const { object } = await generateObject({
      model,
      system: SYSTEM_PROMPT,
      prompt,
      temperature: 0,
      schema: analyzeResponseSchema,
    });

    const response: AnalyzeResponse = {
      nodes: object.nodes as Node[],
      edges: object.edges as Edge[],
    };

    return NextResponse.json({
      ...response,
      meta: {
        modelId: selectedOptionId,
      },
    });
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
