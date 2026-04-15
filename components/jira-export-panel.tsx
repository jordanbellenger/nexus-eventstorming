"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, FileText, X } from "lucide-react";

type JiraExportPanelProps = {
  isOpen: boolean;
  markdown: string;
  isLoading: boolean;
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
};

export function JiraExportPanel({
  isOpen,
  markdown,
  isLoading,
  copied,
  onClose,
  onCopy,
}: JiraExportPanelProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#0d1728]/20 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed top-0 right-0 z-50 flex h-screen w-full max-w-[680px] flex-col border-l border-white/70 bg-[#fbfcff]/96 shadow-[-24px_0_80px_rgba(20,32,51,0.16)] backdrop-blur"
          >
            <div className="flex items-start justify-between border-b border-line px-6 py-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#778295]">
                  Export Jira
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#102033]">
                  User Stories generees
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#5b6677]">
                  Backlog structure par Epic avec criteres d&apos;acceptation au
                  format BDD.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-line bg-white p-2 text-[#5d6a7d] transition hover:bg-[#f4f7fb]"
                aria-label="Fermer le panneau d'export"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4fb] px-3 py-1 font-mono text-xs text-[#4d5c70]">
                <FileText className="h-3.5 w-3.5" />
                Markdown export
              </div>
              <button
                type="button"
                onClick={onCopy}
                disabled={!markdown || isLoading}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-[#102033] transition hover:bg-[#f6f8fb] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copied ? <Check className="h-4 w-4 text-[#1d8f5a]" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copie" : "Copier dans le presse-papier"}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {isLoading ? (
                <div className="flex h-full min-h-[240px] items-center justify-center rounded-[28px] border border-line bg-white/70">
                  <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#d8e3f0] border-t-accent" />
                    <p className="mt-4 text-sm font-medium text-[#102033]">
                      Generation des tickets JIRA en cours...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-[28px] border border-line bg-white/78 p-5 shadow-[0_16px_40px_rgba(20,32,51,0.06)]">
                  <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-6 text-[#1a2739]">
                    {markdown}
                  </pre>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
