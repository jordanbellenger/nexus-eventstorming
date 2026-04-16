"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { LoaderCircle, Sparkles, Workflow } from "lucide-react";

type EventStormingBoardProps = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  isLoading: boolean;
  isExporting: boolean;
  canExport: boolean;
  exportLabel: string;
  exportLoadingLabel: string;
  emptyTitle: string;
  emptyBody: string;
  loadingLabel: string;
  onExport: () => void;
};

function EventStormingBoardCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  isLoading,
  isExporting,
  canExport,
  exportLabel,
  exportLoadingLabel,
  emptyTitle,
  emptyBody,
  loadingLabel,
  onExport,
}: EventStormingBoardProps) {
  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-[28px] border border-line-strong bg-[var(--surface)]">
      <button
        type="button"
        onClick={onExport}
        disabled={!canExport || isLoading || isExporting}
        className="absolute top-4 right-4 z-20 inline-flex items-center gap-2 rounded-full border border-line bg-panel-strong px-4 py-2 text-sm font-semibold text-foreground shadow-[0_10px_30px_var(--shadow)] transition hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4 text-accent" />
        {isExporting ? exportLoadingLabel : exportLabel}
      </button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable
        elementsSelectable
        panOnDrag
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { stroke: "#7b8799", strokeWidth: 1.5 },
        }}
      >
        <Background
          id="whiteboard-grid"
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1.2}
          color="var(--board-dot)"
        />
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(node) =>
            String(
              (node.data as { style?: { background?: string } } | undefined)?.style
                ?.background || "#ffffff",
            )
          }
          className="!border"
        />
      </ReactFlow>

      {nodes.length === 0 && !isLoading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-panel-strong text-accent shadow-[0_10px_30px_var(--shadow)]">
              <Workflow className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-foreground">
              {emptyTitle}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {emptyBody}
            </p>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--overlay)] backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-full border border-line bg-panel-strong px-5 py-3 text-sm font-medium text-foreground shadow-[0_14px_30px_var(--shadow)]">
            <LoaderCircle className="h-4 w-4 animate-spin text-accent" />
            <span>{loadingLabel}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function EventStormingBoard(props: EventStormingBoardProps) {
  return (
    <ReactFlowProvider>
      <EventStormingBoardCanvas {...props} />
    </ReactFlowProvider>
  );
}
