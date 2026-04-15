"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, AudioLines, Mic, MicOff } from "lucide-react";
import { clsx } from "clsx";
import {
  type Edge,
  type Node,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";
import { EventStormingBoard } from "@/components/event-storming-board";
import { JiraExportPanel } from "@/components/jira-export-panel";

const transcriptionPlaceholder = `Client: Nous voulons capturer les evenements metier au fil de l'atelier.

Facilitateur: Notez les irritants, les decisions critiques et les acteurs concernes.

IA Nexus: Je vais proposer une premiere modelisation Event Storming a partir de cette transcription.`;

const AUTO_ANALYZE_DELAY_MS = 10000;

type AnalyzeResponse = {
  nodes: Node[];
  edges: Edge[];
};

type ExportResponse = {
  markdown: string;
  error?: string;
  details?: string;
};

export function HomeScreen() {
  const [transcript, setTranscript] = useState(transcriptionPlaceholder);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);
  const [jiraMarkdown, setJiraMarkdown] = useState("");
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const transcriptRef = useRef(transcript);
  const lastAnalyzedTranscriptRef = useRef("");
  const shouldResumeListeningRef = useRef(false);
  const liveTranscriptBaseRef = useRef(transcriptionPlaceholder);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognitionApi =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionApi) {
      setIsSpeechSupported(false);
      return;
    }

    setIsSpeechSupported(true);

    const recognition = new SpeechRecognitionApi();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setRecognitionError(null);
      liveTranscriptBaseRef.current = transcriptRef.current;
    };

    recognition.onresult = (event) => {
      let finalTranscriptChunk = "";
      let interimTranscriptChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const chunk = result[0]?.transcript?.trim() ?? "";

        if (!chunk) {
          continue;
        }

        if (result.isFinal) {
          finalTranscriptChunk += `${chunk} `;
        } else {
          interimTranscriptChunk += `${chunk} `;
        }
      }

      if (finalTranscriptChunk) {
        const committedTranscript = [liveTranscriptBaseRef.current.trim(), finalTranscriptChunk.trim()]
          .filter(Boolean)
          .join("\n")
          .trim();

        liveTranscriptBaseRef.current = committedTranscript;
      }

      const displayTranscript = [
        liveTranscriptBaseRef.current.trim(),
        interimTranscriptChunk.trim(),
      ]
        .filter(Boolean)
        .join("\n")
        .trim();

      if (displayTranscript) {
        setTranscript(displayTranscript);
        queueAutoAnalyze(liveTranscriptBaseRef.current.trim() || displayTranscript);
      }
    };

    recognition.onerror = (event) => {
      setRecognitionError(`Transcription live indisponible (${event.error}).`);
      setIsListening(false);
      shouldResumeListeningRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);

      if (shouldResumeListeningRef.current) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldResumeListeningRef.current = false;
      if (silenceTimeoutRef.current) {
        window.clearTimeout(silenceTimeoutRef.current);
      }
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  function queueAutoAnalyze(nextTranscript: string) {
    if (typeof window === "undefined") {
      return;
    }

    if (silenceTimeoutRef.current) {
      window.clearTimeout(silenceTimeoutRef.current);
    }

    silenceTimeoutRef.current = window.setTimeout(() => {
      const normalizedTranscript = nextTranscript.trim();

      if (
        normalizedTranscript &&
        normalizedTranscript !== lastAnalyzedTranscriptRef.current &&
        !isAnalyzing
      ) {
        void handleAnalyze(normalizedTranscript);
      }
    }, AUTO_ANALYZE_DELAY_MS);
  }

  function handleToggleListening() {
    const recognition = recognitionRef.current;

    if (!recognition) {
      setRecognitionError("La transcription live n'est pas supportee sur ce navigateur.");
      return;
    }

    if (isListening) {
      shouldResumeListeningRef.current = false;
      recognition.stop();
      return;
    }

    shouldResumeListeningRef.current = true;
    recognition.start();
  }

  async function handleAnalyze(inputTranscript = transcriptRef.current) {
    const normalizedTranscript = inputTranscript.trim();

    if (!normalizedTranscript) {
      setErrorMessage("La transcription est vide. Ajoutez du contenu avant l'analyse.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: normalizedTranscript }),
      });

      const payload = (await response.json()) as AnalyzeResponse & {
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(payload.details || payload.error || "Analyse impossible.");
      }

      setNodes(payload.nodes ?? []);
      setEdges(payload.edges ?? []);
      lastAnalyzedTranscriptRef.current = normalizedTranscript;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleExport() {
    if (nodes.length === 0) {
      setExportErrorMessage("Generez d'abord un board avant de demander les tickets JIRA.");
      return;
    }

    setIsExportPanelOpen(true);
    setIsExporting(true);
    setExportErrorMessage(null);
    setIsCopied(false);

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nodes, edges }),
      });

      const payload = (await response.json()) as ExportResponse;

      if (!response.ok) {
        throw new Error(payload.details || payload.error || "Export impossible.");
      }

      setJiraMarkdown(payload.markdown ?? "");
    } catch (error) {
      setExportErrorMessage(
        error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
      );
      setJiraMarkdown("");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleCopyExport() {
    if (!jiraMarkdown) {
      return;
    }

    try {
      await navigator.clipboard.writeText(jiraMarkdown);
      setIsCopied(true);
    } catch {
      setExportErrorMessage("Impossible de copier automatiquement le contenu.");
    }
  }

  return (
    <>
      <main className="min-h-screen bg-background p-4 text-foreground md:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1800px] flex-col gap-4 lg:min-h-[calc(100vh-3rem)] lg:flex-row">
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex w-full flex-col rounded-[28px] border border-line bg-panel p-5 shadow-[0_18px_50px_rgba(20,32,51,0.08)] backdrop-blur md:p-6 lg:w-[30%]"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#6c7788]">
                  Nexus
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#102033]">
                  Transcription d&apos;atelier
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#5b6677]">
                  Demarrez l&apos;ecoute live pour retranscrire l&apos;atelier au fil de
                  la discussion, puis laissez Nexus analyser automatiquement les
                  temps de pause pour mettre a jour le board. Cela permet de garder
                  une trace exploitable des echanges sans interrompre le travail du
                  groupe.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <AudioLines className="h-6 w-6" />
              </div>
            </div>

            <label className="mb-3 text-sm font-medium text-[#304053]">
              Flux de transcription
            </label>
            <textarea
              className={clsx(
                "min-h-[320px] flex-1 resize-none rounded-[24px] border border-line-strong bg-panel-strong px-5 py-4 text-sm leading-7 text-[#162234] shadow-inner outline-none transition",
                "focus:border-accent focus:ring-4 focus:ring-accent-soft",
              )}
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
            />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleToggleListening}
                disabled={!isSpeechSupported}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                  isListening
                    ? "border-[#ffd7c2] bg-[#fff2ea] text-[#8a3d12]"
                    : "border-line bg-white/80 text-[#102033] hover:bg-[#f6f8fb]",
                  !isSpeechSupported && "cursor-not-allowed opacity-50",
                )}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4 text-accent" />
                )}
                {isListening ? "Arreter l'ecoute live" : "Demarrer l'ecoute live"}
              </button>
              <p className="text-sm text-[#667285]">
                {isListening
                  ? "Ecoute active. Analyse automatique apres 10 secondes de silence."
                  : isSpeechSupported
                    ? "Le micro alimente la transcription en direct."
                    : "La transcription live n'est pas supportee sur ce navigateur."}
              </p>
            </div>

            {errorMessage || exportErrorMessage || recognitionError ? (
              <div className="mt-5 flex items-start gap-3 rounded-[20px] border border-[#ffd7c2] bg-[#fff4ee] px-4 py-3 text-sm text-[#8a3d12]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{errorMessage || exportErrorMessage || recognitionError}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={isAnalyzing}
              className="mt-5 inline-flex items-center justify-center rounded-[22px] bg-[#102033] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#182b45] focus:outline-none focus:ring-4 focus:ring-[#d8e3f0] disabled:cursor-wait disabled:bg-[#7b8799]"
            >
              Analyser &amp; Modeliser
            </button>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
            className="relative flex min-h-[540px] w-full overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_22px_60px_rgba(20,32,51,0.08)] lg:w-[70%]"
          >
            <div className="whiteboard-dot-grid absolute inset-0" />
            <div className="whiteboard-fade absolute inset-0" />

            <div className="relative z-10 flex w-full flex-col">
              <div className="flex items-center justify-between border-b border-line bg-white/80 px-5 py-4 backdrop-blur md:px-6">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#778295]">
                    Event Storming Board
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#102033]">
                    Whiteboard de modelisation
                  </h2>
                </div>
                <div className="rounded-full border border-line bg-white/90 px-3 py-1 font-mono text-xs text-[#5d6a7d]">
                  {nodes.length > 0
                    ? `${nodes.length} noeuds / ${edges.length} liens`
                    : "React Flow"}
                </div>
              </div>

              <div className="relative flex flex-1 p-6">
                <EventStormingBoard
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={(changes) =>
                    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes))
                  }
                  onEdgesChange={(changes) =>
                    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges))
                  }
                  isLoading={isAnalyzing}
                  isExporting={isExporting}
                  canExport={nodes.length > 0}
                  onExport={handleExport}
                />
              </div>
            </div>
          </motion.section>
        </div>
      </main>
      <JiraExportPanel
        isOpen={isExportPanelOpen}
        markdown={jiraMarkdown}
        isLoading={isExporting}
        copied={isCopied}
        onClose={() => setIsExportPanelOpen(false)}
        onCopy={handleCopyExport}
      />
    </>
  );
}
