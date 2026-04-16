"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AudioLines,
  FileText,
  Mic,
  MicOff,
  Moon,
  RotateCcw,
  Sun,
} from "lucide-react";
import { clsx } from "clsx";
import {
  type Edge,
  type Node,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";
import { BacklogExportPanel } from "@/components/backlog-export-panel";
import { EventStormingBoard } from "@/components/event-storming-board";
import {
  DEFAULT_MODEL_OPTION_ID,
  MODEL_OPTIONS,
} from "@/lib/ai-model-catalog";
import {
  DEFAULT_LANGUAGE,
  EXAMPLE_TRANSCRIPT,
  STORAGE_LANGUAGE_KEY,
  UI_TEXT,
  type AppLanguage,
} from "@/lib/i18n";
import {
  DEFAULT_THEME,
  STORAGE_THEME_KEY,
  type AppTheme,
} from "@/lib/theme";

const AUTO_ANALYZE_DELAY_MS = 10000;

type AnalyzeResponse = {
  nodes: Node[];
  edges: Edge[];
  meta?: {
    modelId?: string;
  };
};

type ExportResponse = {
  markdown: string;
  error?: string;
  details?: string;
  meta?: {
    modelId?: string;
  };
};

export function HomeScreen() {
  const [transcript, setTranscript] = useState("");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(
    null,
  );
  const [jiraMarkdown, setJiraMarkdown] = useState("");
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_OPTION_ID);
  const [language, setLanguage] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_THEME);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const transcriptRef = useRef(transcript);
  const lastAnalyzedTranscriptRef = useRef("");
  const shouldResumeListeningRef = useRef(false);
  const liveTranscriptBaseRef = useRef("");
  const t = UI_TEXT[language];
  const exampleTranscript = EXAMPLE_TRANSCRIPT[language];

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLanguage = window.localStorage.getItem(
      STORAGE_LANGUAGE_KEY,
    ) as AppLanguage | null;

    if (storedLanguage === "fr" || storedLanguage === "en") {
      setLanguage(storedLanguage);
      return;
    }

    setLanguage(
      window.navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en",
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedTheme = window.localStorage.getItem(
      STORAGE_THEME_KEY,
    ) as AppTheme | null;

    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      return;
    }

    setTheme(
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_LANGUAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

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
    recognition.lang = language === "fr" ? "fr-FR" : "en-US";
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
        const committedTranscript = [
          liveTranscriptBaseRef.current.trim(),
          finalTranscriptChunk.trim(),
        ]
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
      setRecognitionError(t.speechError(event.error));
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
  }, [language, t]);

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
      setRecognitionError(t.listeningUnsupported);
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

  function handleToggleTheme() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  function handleLoadExample() {
    setTranscript(exampleTranscript);
    transcriptRef.current = exampleTranscript;
    liveTranscriptBaseRef.current = exampleTranscript;
    lastAnalyzedTranscriptRef.current = "";
    setErrorMessage(null);
    setExportErrorMessage(null);
    setRecognitionError(null);
  }

  function handleResetSession() {
    shouldResumeListeningRef.current = false;

    if (silenceTimeoutRef.current) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    recognitionRef.current?.stop();
    setTranscript("");
    transcriptRef.current = "";
    liveTranscriptBaseRef.current = "";
    lastAnalyzedTranscriptRef.current = "";
    setNodes([]);
    setEdges([]);
    setJiraMarkdown("");
    setIsExportPanelOpen(false);
    setIsCopied(false);
    setErrorMessage(null);
    setExportErrorMessage(null);
    setRecognitionError(null);
    setIsListening(false);
  }

  async function handleAnalyze(inputTranscript = transcriptRef.current) {
    const normalizedTranscript = inputTranscript.trim();

    if (!normalizedTranscript) {
      setErrorMessage(t.analyzeEmptyTranscript);
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
        body: JSON.stringify({
          transcript: normalizedTranscript,
          modelId: selectedModelId,
          language,
        }),
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

      if (payload.meta?.modelId) {
        setSelectedModelId(payload.meta.modelId);
      }

      lastAnalyzedTranscriptRef.current = normalizedTranscript;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t.genericUnknownError,
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleExport() {
    if (nodes.length === 0) {
      setExportErrorMessage(t.exportErrorNeedsBoard);
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
        body: JSON.stringify({
          nodes,
          edges,
          modelId: selectedModelId,
          language,
        }),
      });

      const payload = (await response.json()) as ExportResponse;

      if (!response.ok) {
        throw new Error(payload.details || payload.error || "Export impossible.");
      }

      setJiraMarkdown(payload.markdown ?? "");

      if (payload.meta?.modelId) {
        setSelectedModelId(payload.meta.modelId);
      }
    } catch (error) {
      setExportErrorMessage(
        error instanceof Error ? error.message : t.genericUnknownError,
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
      setExportErrorMessage(t.clipboardError);
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
            className="flex w-full flex-col rounded-[28px] border border-line bg-panel p-5 shadow-[0_18px_50px_var(--shadow)] backdrop-blur md:p-6 lg:w-[30%]"
          >
            <div className="mb-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleTheme}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-panel-strong text-foreground transition hover:bg-[var(--surface-strong)]"
                aria-label={
                  theme === "light" ? t.switchToDarkMode : t.switchToLightMode
                }
                title={theme === "light" ? t.switchToDarkMode : t.switchToLightMode}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5 text-accent" />
                )}
              </button>

              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as AppLanguage)}
                aria-label={t.languageLabel}
                className="h-11 min-w-[132px] rounded-2xl border border-line bg-panel-strong px-4 text-sm font-medium text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
              >
                <option value="fr">{t.languageFrench}</option>
                <option value="en">{t.languageEnglish}</option>
              </select>
            </div>

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                  {t.brand}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                  {t.workshopTitle}
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
                  {t.workshopIntro}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <AudioLines className="h-6 w-6" />
              </div>
            </div>

            <label className="mb-3 text-sm font-medium text-[var(--muted-strong)]">
              {t.modelLabel}
            </label>
            <div className="mb-4">
              <select
                value={selectedModelId}
                onChange={(event) => setSelectedModelId(event.target.value)}
                className="w-full rounded-[18px] border border-line-strong bg-panel-strong px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm font-medium text-[var(--muted-strong)]">
                {t.transcriptLabel}
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadExample}
                  disabled={isAnalyzing || isExporting}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-line bg-panel-strong px-4 py-2 text-sm font-medium text-foreground transition hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText className="h-4 w-4 text-accent" />
                  {t.loadExample}
                </button>
                <button
                  type="button"
                  onClick={handleResetSession}
                  disabled={isAnalyzing || isExporting}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-line bg-panel-strong px-4 py-2 text-sm font-medium text-foreground transition hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4 text-[var(--muted)]" />
                  {t.newSession}
                </button>
              </div>
            </div>

            <textarea
              className={clsx(
                "min-h-[320px] flex-1 resize-none rounded-[24px] border border-line-strong bg-panel-strong px-5 py-4 text-sm leading-7 text-foreground shadow-inner outline-none transition",
                "focus:border-accent focus:ring-4 focus:ring-accent-soft",
              )}
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder={t.transcriptPlaceholder}
            />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleToggleListening}
                disabled={!isSpeechSupported}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                  isListening
                    ? "border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--danger)]"
                    : "border-line bg-panel-strong text-foreground hover:bg-[var(--surface-strong)]",
                  !isSpeechSupported && "cursor-not-allowed opacity-50",
                )}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4 text-accent" />
                )}
                {isListening ? t.stopListening : t.startListening}
              </button>

              <p className="text-sm text-[var(--muted)]">
                {isListening
                  ? t.listeningActive
                  : isSpeechSupported
                    ? t.listeningReady
                    : t.listeningUnsupported}
              </p>
            </div>

            {errorMessage || exportErrorMessage || recognitionError ? (
              <div className="mt-5 flex items-start gap-3 rounded-[20px] border border-[var(--danger-line)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{errorMessage || exportErrorMessage || recognitionError}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={isAnalyzing}
              className="mt-5 inline-flex items-center justify-center rounded-[22px] bg-foreground px-5 py-4 text-sm font-semibold text-background transition hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:cursor-wait disabled:opacity-50"
            >
              {t.analyze}
            </button>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
            className="relative flex min-h-[540px] w-full overflow-hidden rounded-[32px] border border-line bg-[var(--surface)] shadow-[0_22px_60px_var(--shadow)] lg:w-[70%]"
          >
            <div className="whiteboard-dot-grid absolute inset-0" />
            <div className="whiteboard-fade absolute inset-0" />

            <div className="relative z-10 flex w-full flex-col">
              <div className="flex items-center justify-between border-b border-line bg-panel px-5 py-4 backdrop-blur md:px-6">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                    Event Storming Board
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {t.boardTitle}
                  </h2>
                </div>
                <div className="rounded-full border border-line bg-panel-strong px-3 py-1 font-mono text-xs text-[var(--muted)]">
                  {nodes.length > 0
                    ? t.generatedNodes(nodes.length, edges.length)
                    : t.boardBadge}
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
                  exportLabel={t.exportBacklog}
                  exportLoadingLabel={t.exportBuilding}
                  emptyTitle={t.boardEmptyTitle}
                  emptyBody={t.boardEmptyBody}
                  loadingLabel={t.boardLoading}
                  onExport={handleExport}
                />
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      <BacklogExportPanel
        language={language}
        isOpen={isExportPanelOpen}
        markdown={jiraMarkdown}
        isLoading={isExporting}
        copied={isCopied}
        eyebrow={t.exportPanelEyebrow}
        title={t.exportPanelTitle}
        description={t.exportPanelDescription}
        chipLabel={t.exportPanelChip}
        copyLabel={t.exportPanelCopy}
        copiedLabel={t.exportPanelCopied}
        loadingLabel={t.exportPanelLoading}
        closeLabel={t.exportPanelClose}
        onClose={() => setIsExportPanelOpen(false)}
        onCopy={handleCopyExport}
      />
    </>
  );
}
