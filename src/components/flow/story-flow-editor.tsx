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
import { Save, Loader2, CheckCircle2, Plus, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { VideoNode, type VideoNodeData } from "@/components/flow/video-node";

const FLOW_ID = "default";
const MAX_NODES = 10;
const MAX_CHILDREN = 2; // 2-choice branching

const nodeTypes = { videoNode: VideoNode };

const EDGE_STYLE = {
    stroke: "oklch(0.7 0.15 250)",
    strokeWidth: 2,
};

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
        position: { x: 80, y: 280 },
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
        position: { x: 520, y: 280 },
        data: {
            label: "Scene B",
            prompt: "The hero takes the right path across the bridge...",
            variant: "scene",
            branchLabel: "橋を渡る",
            duration: 4,
        },
    },
    {
        id: "ending-a",
        type: "videoNode",
        position: { x: 80, y: 560 },
        data: {
            label: "Ending A",
            prompt: "The hero discovers a hidden treasure in the cave...",
            variant: "ending",
            branchLabel: "奥へ進む",
            duration: 4,
        },
    },
    {
        id: "ending-b",
        type: "videoNode",
        position: { x: 520, y: 560 },
        data: {
            label: "Ending B",
            prompt: "The hero crosses the bridge to a new land...",
            variant: "ending",
            branchLabel: "新天地へ",
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
        style: EDGE_STYLE,
    },
    {
        id: "start-b",
        source: "start",
        target: "scene-b",
        animated: true,
        style: EDGE_STYLE,
    },
    {
        id: "a-ending-a",
        source: "scene-a",
        target: "ending-a",
        animated: true,
        style: EDGE_STYLE,
    },
    {
        id: "b-ending-b",
        source: "scene-b",
        target: "ending-b",
        animated: true,
        style: EDGE_STYLE,
    },
];

const DUMMY_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

let nodeIdCounter = 10;

export function StoryFlowEditor() {
    const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // ── Helper: count children of a node ──
    const getChildCount = useCallback(
        (nodeId: string) => edges.filter((e) => e.source === nodeId).length,
        [edges]
    );

    // ── Handle video generation ──
    const handleGenerate = useCallback(
        (nodeId: string, prompt: string) => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === nodeId) {
                        return {
                            ...node,
                            data: { ...node.data, videoUrl: DUMMY_VIDEO_URL, prompt },
                        };
                    }
                    return node;
                })
            );
        },
        [setNodes]
    );

    // ── Handle data change (branchLabel, duration, etc.) ──
    const handleDataChange = useCallback(
        (nodeId: string, key: string, value: string | number) => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === nodeId) {
                        return { ...node, data: { ...node.data, [key]: value } };
                    }
                    return node;
                })
            );
        },
        [setNodes]
    );

    // ── Inject callbacks ──
    const nodesWithCallbacks = nodes.map((node) => ({
        ...node,
        data: {
            ...node.data,
            onGenerate: handleGenerate,
            onDataChange: handleDataChange,
        },
    }));

    // ── Load flow from IndexedDB ──
    useEffect(() => {
        const loadFlow = async () => {
            try {
                const saved = await db.flows.get(FLOW_ID);
                if (saved) {
                    const loadedNodes = JSON.parse(saved.nodes) as Node<VideoNodeData>[];
                    const loadedEdges = JSON.parse(saved.edges) as Edge[];
                    setNodes(loadedNodes);
                    setEdges(loadedEdges);
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
                // use defaults
            } finally {
                setIsLoaded(true);
            }
        };
        loadFlow();
    }, [setNodes, setEdges]);

    // ── Save flow ──
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
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

    // ── Add node (max 2 children, auto-connect) ──
    const handleAddNode = useCallback(() => {
        if (nodes.length >= MAX_NODES) {
            toast.error("ノード上限に達しました", {
                description: `無料版では最大 ${MAX_NODES} ノードまでです。`,
                icon: <AlertTriangle className="h-4 w-4" />,
            });
            return;
        }

        const selectedNode = nodes.find((n) => n.selected);
        if (!selectedNode) {
            toast.error("親ノードを選択してください", {
                description:
                    "ノードをクリックして選択してから「Add Node」を押してください。",
            });
            return;
        }

        if (selectedNode.data.variant === "ending") {
            toast.error("エンディングノードには分岐を追加できません", {
                description: "シーンまたはスタートノードを選択してください。",
            });
            return;
        }

        const childCount = getChildCount(selectedNode.id);
        if (childCount >= MAX_CHILDREN) {
            toast.error("分岐は最大2つまでです", {
                description: `「${selectedNode.data.label}」にはすでに${childCount}つの分岐があります。`,
                icon: <AlertTriangle className="h-4 w-4" />,
            });
            return;
        }

        const newId = `node-${nodeIdCounter++}`;
        const offsetX = childCount === 0 ? 0 : 440;

        const newNode: Node<VideoNodeData> = {
            id: newId,
            type: "videoNode",
            position: {
                x: selectedNode.position.x + offsetX,
                y: selectedNode.position.y + 280,
            },
            data: {
                label: `Scene ${newId.split("-")[1]}`,
                variant: "scene",
                duration: 4,
                branchLabel: "",
            },
        };

        const newEdge: Edge = {
            id: `${selectedNode.id}-${newId}`,
            source: selectedNode.id,
            target: newId,
            animated: true,
            style: EDGE_STYLE,
        };

        setNodes((nds) => [...nds, newNode]);
        setEdges((eds) => [...eds, newEdge]);

        toast.success("ノードを追加しました", {
            description: `${selectedNode.data.label} → ${newNode.data.label}（${nodes.length + 1}/${MAX_NODES}）`,
        });
    }, [nodes, edges, setNodes, setEdges, getChildCount]);

    // ── Delete selected node (not Start) ──
    const handleDeleteNode = useCallback(() => {
        const selectedNode = nodes.find((n) => n.selected);
        if (!selectedNode) {
            toast.error("削除するノードを選択してください");
            return;
        }

        if (selectedNode.data.variant === "start") {
            toast.error("スタートノードは削除できません");
            return;
        }

        // Also delete any descendant nodes (children connected via edges)
        const toDelete = new Set<string>();
        const collectDescendants = (nodeId: string) => {
            toDelete.add(nodeId);
            edges
                .filter((e) => e.source === nodeId)
                .forEach((e) => collectDescendants(e.target));
        };
        collectDescendants(selectedNode.id);

        const deletedCount = toDelete.size;

        setNodes((nds) => nds.filter((n) => !toDelete.has(n.id)));
        setEdges((eds) =>
            eds.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target))
        );

        toast.success("ノードを削除しました", {
            description:
                deletedCount > 1
                    ? `${selectedNode.data.label} と子ノード ${deletedCount - 1} 個を削除しました。`
                    : `${selectedNode.data.label} を削除しました。`,
        });
    }, [nodes, edges, setNodes, setEdges]);

    // ── Connect (enforce max 2 children) ──
    const onConnect: OnConnect = useCallback(
        (params) => {
            if (!params.source) return;
            const childCount = edges.filter((e) => e.source === params.source).length;
            if (childCount >= MAX_CHILDREN) {
                toast.error("分岐は最大2つまでです", {
                    description: "1つの続き動画、または2択の分岐のみ接続できます。",
                    icon: <AlertTriangle className="h-4 w-4" />,
                });
                return;
            }
            setEdges((eds) =>
                addEdge(
                    { ...params, animated: true, style: EDGE_STYLE },
                    eds
                )
            );
        },
        [edges, setEdges]
    );

    if (!isLoaded) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const selectedNode = nodes.find((n) => n.selected);
    const canAdd =
        selectedNode &&
        selectedNode.data.variant !== "ending" &&
        getChildCount(selectedNode.id) < MAX_CHILDREN &&
        nodes.length < MAX_NODES;

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
                <Controls className="!rounded-lg !border !border-border !bg-card !shadow-lg [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground [&>button:hover]:!bg-accent" />

                <Panel position="top-right">
                    <div className="flex items-center gap-2">
                        {/* Node counter */}
                        <div
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-lg ${nodes.length >= MAX_NODES
                                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                                    : "border-border bg-card text-muted-foreground"
                                }`}
                        >
                            {nodes.length >= MAX_NODES && (
                                <AlertTriangle className="h-3 w-3" />
                            )}
                            {nodes.length}/{MAX_NODES}
                        </div>

                        {/* Delete Node */}
                        <Button
                            onClick={handleDeleteNode}
                            size="sm"
                            variant="outline"
                            className="gap-1.5 shadow-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
                            disabled={!selectedNode || selectedNode.data.variant === "start"}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>

                        {/* Add Node */}
                        <Button
                            onClick={handleAddNode}
                            size="sm"
                            variant="outline"
                            className="gap-1.5 shadow-lg"
                            disabled={!canAdd}
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
                                    Save
                                </>
                            )}
                        </Button>
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}
