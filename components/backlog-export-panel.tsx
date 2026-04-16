"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, FileText, X } from "lucide-react";
import type { AppLanguage } from "@/lib/i18n";

type BacklogExportPanelProps = {
  language: AppLanguage;
  isOpen: boolean;
  markdown: string;
  isLoading: boolean;
  copied: boolean;
  eyebrow: string;
  title: string;
  description: string;
  chipLabel: string;
  copyLabel: string;
  copiedLabel: string;
  loadingLabel: string;
  closeLabel: string;
  onClose: () => void;
  onCopy: () => void;
};

export function BacklogExportPanel({
  language,
  isOpen,
  markdown,
  isLoading,
  copied,
  eyebrow,
  title,
  description,
  chipLabel,
  copyLabel,
  copiedLabel,
  loadingLabel,
  closeLabel,
  onClose,
  onCopy,
}: BacklogExportPanelProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#0d1728]/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed top-0 right-0 z-50 flex h-screen w-full max-w-[680px] flex-col border-l border-line bg-panel-strong shadow-[-24px_0_80px_var(--shadow)] backdrop-blur"
          >
            <div className="flex items-start justify-between border-b border-line px-6 py-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                  {eyebrow}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                  {title}
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">
                  {description}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-line bg-[var(--surface)] p-2 text-[var(--muted)] transition hover:bg-[var(--surface-strong)]"
                aria-label={closeLabel}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 font-mono text-xs text-[var(--muted-strong)]">
                <FileText className="h-3.5 w-3.5" />
                {chipLabel}
              </div>

              <button
                type="button"
                onClick={onCopy}
                disabled={!markdown || isLoading}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-[var(--surface)] px-4 py-2 text-sm font-medium text-foreground transition hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-[var(--success)]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? copiedLabel : copyLabel}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {isLoading ? (
                <div className="flex h-full min-h-[240px] items-center justify-center rounded-[28px] border border-line bg-[var(--surface)]">
                  <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#d8e3f0] border-t-accent" />
                    <p className="mt-4 text-sm font-medium text-foreground">
                      {loadingLabel}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-[28px] border border-line bg-[var(--surface)] p-5 shadow-[0_16px_40px_var(--shadow)]">
                  <pre
                    className="whitespace-pre-wrap break-words font-mono text-[13px] leading-6 text-foreground"
                    lang={language}
                  >
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
