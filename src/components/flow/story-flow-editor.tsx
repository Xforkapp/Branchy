"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    Panel,
    useNodesState,
    useEdgesState,
    addEdge,
    BackgroundVariant,
    type Edge,
    type Node,
    type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Save, Loader2, CheckCircle2, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { VideoNode, type VideoNodeData } from "@/components/flow/video-node";

const FLOW_ID = "default";
const MAX_NODES = 10;

const nodeTypes = { videoNode: VideoNode };

const defaultNodes: Node<VideoNodeData>[] = [
    {
        id: "start",
        type: "videoNode",
        position: { x: 300, y: 0 },
        data: {
            label: "Start Node",
            prompt: "A hero stands at a crossroads in a dark forest...",
            variant: "start",
            duration: 4,
        },
    },
    {
        id: "scene-a",
        type: "videoNode",
        position: { x: 80, y: 300 },
        data: {
            label: "Scene A",
            prompt: "The hero chooses the left path into the cave...",
            variant: "scene",
            branchLabel: "洞窟に入る",
            duration: 4,
        },
    },
    {
        id: "scene-b",
        type: "videoNode",
        position: { x: 520, y: 300 },
        data: {
            label: "Scene B",
            prompt: "The hero takes the right path across the bridge...",
            variant: "scene",
            branchLabel: "橋を渡る",
            duration: 4,
        },
    },
    {
        id: "ending",
        type: "videoNode",
        position: { x: 300, y: 600 },
        data: {
            label: "Ending Node",
            prompt: "The paths converge at the ancient temple...",
            variant: "ending",
            branchLabel: "神殿へ向かう",
            duration: 4,
        },
    },
];

const defaultEdges: Edge[] = [
    {
        id: "start-a",
        source: "start",
        target: "scene-a",
        animated: true,
        style: { stroke: "oklch(0.7 0.15 250)", strokeWidth: 2 },
    },
    {
        id: "start-b",
        source: "start",
        target: "scene-b",
        animated: true,
        style: { stroke: "oklch(0.7 0.15 250)", strokeWidth: 2 },
    },
    {
        id: "a-ending",
        source: "scene-a",
        target: "ending",
        animated: true,
        style: { stroke: "oklch(0.7 0.15 250)", strokeWidth: 2 },
    },
    {
        id: "b-ending",
        source: "scene-b",
        target: "ending",
        animated: true,
        style: { stroke: "oklch(0.7 0.15 250)", strokeWidth: 2 },
    },
];

const DUMMY_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

let nodeIdCounter = 5;

export function StoryFlowEditor() {
    const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // ── Handle video generation for a specific node ──
    const handleGenerate = useCallback(
        (nodeId: string, prompt: string) => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === nodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                videoUrl: DUMMY_VIDEO_URL,
                                prompt,
                            },
                        };
                    }
                    return node;
                })
            );
        },
        [setNodes]
    );

    // ── Handle data change from node (branchLabel, duration, etc.) ──
    const handleDataChange = useCallback(
        (nodeId: string, key: string, value: string | number) => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === nodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                [key]: value,
                            },
                        };
                    }
                    return node;
                })
            );
        },
        [setNodes]
    );

    // ── Inject callbacks into every node's data ──
    const nodesWithCallbacks = nodes.map((node) => ({
        ...node,
        data: {
            ...node.data,
            onGenerate: handleGenerate,
            onDataChange: handleDataChange,
        },
    }));

    // ── Load flow from IndexedDB on mount ──
    useEffect(() => {
        const loadFlow = async () => {
            try {
                const saved = await db.flows.get(FLOW_ID);
                if (saved) {
                    const loadedNodes = JSON.parse(saved.nodes) as Node<VideoNodeData>[];
                    const loadedEdges = JSON.parse(saved.edges) as Edge[];
                    setNodes(loadedNodes);
                    setEdges(loadedEdges);
                    // Update counter to avoid ID collisions
                    const maxId = loadedNodes.reduce((max, n) => {
                        const num = parseInt(n.id.replace(/\D/g, ""), 10);
                        return isNaN(num) ? max : Math.max(max, num);
                    }, 0);
                    nodeIdCounter = maxId + 1;
                    toast.info("フローを復元しました", {
                        description: "前回保存した状態を読み込みました。",
                    });
                }
            } catch {
                // First time or error — use defaults
            } finally {
                setIsLoaded(true);
            }
        };
        loadFlow();
    }, [setNodes, setEdges]);

    // ── Save flow to IndexedDB ──
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            // Strip callbacks before serializing
            const cleanNodes = nodes.map(({ data, ...rest }) => {
                const { onGenerate, onDataChange, ...cleanData } = data;
                return { ...rest, data: cleanData };
            });

            await db.flows.put({
                id: FLOW_ID,
                nodes: JSON.stringify(cleanNodes),
                edges: JSON.stringify(edges),
                updatedAt: Date.now(),
            });

            toast.success("フローを保存しました！", {
                description: `${nodes.length}/${MAX_NODES} ノード・${edges.length} エッジ`,
            });
        } catch {
            toast.error("保存に失敗しました");
        } finally {
            setTimeout(() => setIsSaving(false), 800);
        }
    }, [nodes, edges]);

    // ── Add new node (with limit check) ──
    const handleAddNode = useCallback(() => {
        if (nodes.length >= MAX_NODES) {
            toast.error("ノード上限に達しました", {
                description: `無料版では最大 ${MAX_NODES} ノードまでです。プランをアップグレードしてください。`,
                icon: <AlertTriangle className="h-4 w-4" />,
            });
            return;
        }

        const newId = `node-${nodeIdCounter++}`;
        const newNode: Node<VideoNodeData> = {
            id: newId,
            type: "videoNode",
            position: {
                x: 200 + Math.random() * 200,
                y: 150 + Math.random() * 200,
            },
            data: {
                label: `Scene ${newId.split("-")[1]}`,
                variant: "scene",
                duration: 4,
                branchLabel: "",
            },
        };

        setNodes((nds) => [...nds, newNode]);
        toast.success("ノードを追加しました", {
            description: `${nodes.length + 1}/${MAX_NODES}`,
        });
    }, [nodes.length, setNodes]);

    // ── Connect with limit check ──
    const onConnect: OnConnect = useCallback(
        (params) => {
            // Check if adding a connection would logically imply adding more nodes than allowed
            // For now, we just allow connecting existing nodes
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        animated: true,
                        style: { stroke: "oklch(0.7 0.15 250)", strokeWidth: 2 },
                    },
                    eds
                )
            );
        },
        [setEdges]
    );

    if (!isLoaded) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ReactFlow
                nodes={nodesWithCallbacks}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                proOptions={{ hideAttribution: true }}
                className="bg-background"
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="oklch(0.4 0.01 286)"
                />
                <Controls
                    className="!rounded-lg !border !border-border !bg-card !shadow-lg [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground [&>button:hover]:!bg-accent"
                />

                {/* Top-right panel: node counter + Save + Add */}
                <Panel position="top-right">
                    <div className="flex items-center gap-2">
                        {/* Node counter */}
                        <div
                            className={cn(
                                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-lg",
                                nodes.length >= MAX_NODES
                                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                                    : "border-border bg-card text-muted-foreground"
                            )}
                        >
                            {nodes.length >= MAX_NODES && (
                                <AlertTriangle className="h-3 w-3" />
                            )}
                            {nodes.length}/{MAX_NODES} nodes
                        </div>

                        {/* Add Node */}
                        <Button
                            onClick={handleAddNode}
                            size="sm"
                            variant="outline"
                            className="gap-1.5 shadow-lg"
                            disabled={nodes.length >= MAX_NODES}
                        >
                            <Plus className="h-4 w-4" />
                            Add Node
                        </Button>

                        {/* Save */}
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            size="sm"
                            className="gap-2 shadow-lg"
                        >
                            {isSaving ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Flow
                                </>
                            )}
                        </Button>
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}
