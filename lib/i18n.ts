export type AppLanguage = "fr" | "en";

export const DEFAULT_LANGUAGE: AppLanguage = "fr";

export const STORAGE_LANGUAGE_KEY = "nexus-language";

export const EXAMPLE_TRANSCRIPT: Record<AppLanguage, string> = {
  fr: `Lorsqu'une commande est payee, le systeme confirme immediatement le paiement et envoie l'information a la logistique pour preparer l'expedition. Si le stock est disponible, une reservation est creee et la commande passe au statut prete a expedier. Si le stock est insuffisant, le service client doit etre alerte pour prevenir le client et proposer soit un remboursement, soit une mise en attente.

Quand la commande est preparee, l'etiquette de transport est generee et le client recoit une notification d'expedition. Si le transporteur refuse le colis ou si la preparation echoue, la commande repasse en anomalie et une revue manuelle est lancee.

En cas d'annulation avant expedition, le paiement doit etre rembourse automatiquement et la reservation de stock doit etre liberee. Si l'annulation intervient apres expedition, alors une procedure de retour doit etre ouverte et suivie jusqu'a reception du colis.`,
  en: `When an order is paid, the system immediately confirms the payment and sends the information to logistics so the shipment can be prepared. If stock is available, a reservation is created and the order moves to the ready-to-ship status. If stock is insufficient, customer service must be alerted so they can contact the customer and propose either a refund or a backorder.

When the order is prepared, the shipping label is generated and the customer receives a shipping notification. If the carrier rejects the parcel or if preparation fails, the order moves back into an exception state and a manual review is triggered.

If the order is cancelled before shipping, the payment must be refunded automatically and the stock reservation must be released. If the cancellation happens after shipping, then a return workflow must be opened and tracked until the parcel is received.`,
};

export const UI_TEXT: Record<
  AppLanguage,
  {
    brand: string;
    workshopTitle: string;
    workshopIntro: string;
    languageLabel: string;
    languageFrench: string;
    languageEnglish: string;
    switchToDarkMode: string;
    switchToLightMode: string;
    modelLabel: string;
    transcriptLabel: string;
    loadExample: string;
    newSession: string;
    transcriptPlaceholder: string;
    startListening: string;
    stopListening: string;
    listeningActive: string;
    listeningReady: string;
    listeningUnsupported: string;
    analyze: string;
    boardBadge: string;
    boardTitle: string;
    exportBacklog: string;
    exportBuilding: string;
    boardEmptyTitle: string;
    boardEmptyBody: string;
    boardLoading: string;
    exportErrorNeedsBoard: string;
    analyzeEmptyTranscript: string;
    genericUnknownError: string;
    clipboardError: string;
    resetHint: string;
    exportPanelEyebrow: string;
    exportPanelTitle: string;
    exportPanelDescription: string;
    exportPanelChip: string;
    exportPanelCopy: string;
    exportPanelCopied: string;
    exportPanelLoading: string;
    exportPanelClose: string;
    generatedNodes: (nodes: number, edges: number) => string;
    speechError: (error: string) => string;
  }
> = {
  fr: {
    brand: "Nexus",
    workshopTitle: "Transcription d'atelier",
    workshopIntro:
      "Demarrez l'ecoute live pour retranscrire l'atelier au fil de la discussion, puis laissez Nexus analyser automatiquement les temps de pause pour mettre a jour le board. Cela permet de garder une trace exploitable des echanges sans interrompre le travail du groupe.",
    languageLabel: "Langue",
    languageFrench: "Francais",
    languageEnglish: "Anglais",
    switchToDarkMode: "Activer le mode sombre",
    switchToLightMode: "Activer le mode clair",
    modelLabel: "Modele IA",
    transcriptLabel: "Flux de transcription",
    loadExample: "Charger un exemple",
    newSession: "Nouvelle session",
    transcriptPlaceholder:
      "La transcription apparaitra ici pendant l'atelier. Vous pouvez aussi charger un exemple pour tester le board.",
    startListening: "Demarrer l'ecoute live",
    stopListening: "Arreter l'ecoute live",
    listeningActive:
      "Ecoute active. Analyse automatique apres 10 secondes de silence.",
    listeningReady: "Le micro alimente la transcription en direct.",
    listeningUnsupported:
      "La transcription live n'est pas supportee sur ce navigateur.",
    analyze: "Analyser & Modeliser",
    boardBadge: "React Flow",
    boardTitle: "Whiteboard de modelisation",
    exportBacklog: "Exporter le backlog",
    exportBuilding: "Preparation...",
    boardEmptyTitle: "Zone de board en attente",
    boardEmptyBody:
      "Lancez l'analyse pour projeter automatiquement les evenements, commandes et acteurs sur le whiteboard.",
    boardLoading: "Extraction des evenements metier en cours...",
    exportErrorNeedsBoard:
      "Generez d'abord un board avant de preparer l'export backlog.",
    analyzeEmptyTranscript:
      "La transcription est vide. Ajoutez du contenu avant l'analyse.",
    genericUnknownError: "Une erreur inconnue est survenue.",
    clipboardError: "Impossible de copier automatiquement le contenu.",
    resetHint: "Reinitialise la transcription, le board et l'export backlog.",
    exportPanelEyebrow: "Export de backlog",
    exportPanelTitle: "Backlog genere",
    exportPanelDescription:
      "Proposition de backlog structuree par Epic avec criteres d'acceptation au format BDD.",
    exportPanelChip: "Brouillon Markdown",
    exportPanelCopy: "Copier dans le presse-papier",
    exportPanelCopied: "Copie",
    exportPanelLoading: "Preparation du backlog en cours...",
    exportPanelClose: "Fermer le panneau d'export",
    generatedNodes: (nodes, edges) => `${nodes} noeuds / ${edges} liens`,
    speechError: (error) => `Transcription live indisponible (${error}).`,
  },
  en: {
    brand: "Nexus",
    workshopTitle: "Workshop transcript",
    workshopIntro:
      "Start live listening to capture the workshop as the conversation unfolds, then let Nexus automatically re-run the analysis during pauses to refresh the board. This keeps a usable trace of the discussion without interrupting the group.",
    languageLabel: "Language",
    languageFrench: "French",
    languageEnglish: "English",
    switchToDarkMode: "Switch to dark mode",
    switchToLightMode: "Switch to light mode",
    modelLabel: "LLM model",
    transcriptLabel: "Transcript stream",
    loadExample: "Load example",
    newSession: "New session",
    transcriptPlaceholder:
      "The transcript will appear here during the workshop. You can also load an example to test the board.",
    startListening: "Start live listening",
    stopListening: "Stop live listening",
    listeningActive: "Listening is active. Auto-analysis runs after 10 seconds of silence.",
    listeningReady: "The microphone feeds the transcript live.",
    listeningUnsupported: "Live transcription is not supported in this browser.",
    analyze: "Analyze & model",
    boardBadge: "React Flow",
    boardTitle: "Modeling whiteboard",
    exportBacklog: "Export backlog draft",
    exportBuilding: "Building...",
    boardEmptyTitle: "Board area is waiting",
    boardEmptyBody:
      "Run the analysis to project events, commands, and actors onto the whiteboard automatically.",
    boardLoading: "Extracting business events...",
    exportErrorNeedsBoard:
      "Generate a board first before exporting the backlog draft.",
    analyzeEmptyTranscript:
      "The transcript is empty. Add content before running the analysis.",
    genericUnknownError: "An unknown error occurred.",
    clipboardError: "Unable to copy the content automatically.",
    resetHint: "Resets the transcript, board, and backlog export.",
    exportPanelEyebrow: "Backlog export",
    exportPanelTitle: "Backlog draft",
    exportPanelDescription:
      "Structured backlog draft grouped by Epic, with BDD-style acceptance criteria.",
    exportPanelChip: "Markdown draft",
    exportPanelCopy: "Copy to clipboard",
    exportPanelCopied: "Copied",
    exportPanelLoading: "Building the backlog draft...",
    exportPanelClose: "Close export panel",
    generatedNodes: (nodes, edges) => `${nodes} nodes / ${edges} edges`,
    speechError: (error) => `Live transcription is unavailable (${error}).`,
  },
};
