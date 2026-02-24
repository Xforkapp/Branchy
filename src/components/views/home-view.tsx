"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Heart, Share2, RotateCcw, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import type { VideoNodeData } from "@/components/flow/video-node";
import type { Node, Edge } from "@xyflow/react";

const DUMMY_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

interface FlowNode {
    id: string;
    label: string;
    videoUrl?: string;
    variant?: string;
    branchLabel?: string;
}

interface BranchChoice {
    id: string;
    label: string;
    branchLabel?: string;
    videoUrl?: string;
}

export function HomeView() {
    const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);
    const [flowEdges, setFlowEdges] = useState<Edge[]>([]);
    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasFlow, setHasFlow] = useState(false);
    const [showBranch, setShowBranch] = useState(false);
    const [branches, setBranches] = useState<BranchChoice[]>([]);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(128);
    const [isEnding, setIsEnding] = useState(false);
    const [fadeIn, setFadeIn] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const preloadRefs = useRef<HTMLVideoElement[]>([]);

    // ── Load flow from IndexedDB ──
    useEffect(() => {
        const loadFlow = async () => {
            try {
                const saved = await db.flows.get("default");
                if (saved) {
                    const nodes = JSON.parse(saved.nodes) as Node<VideoNodeData>[];
                    const edges = JSON.parse(saved.edges) as Edge[];

                    const mapped: FlowNode[] = nodes.map((n) => ({
                        id: n.id,
                        label: n.data.label,
                        videoUrl: n.data.videoUrl,
                        variant: n.data.variant,
                        branchLabel: n.data.branchLabel,
                    }));

                    setFlowNodes(mapped);
                    setFlowEdges(edges);

                    // Find start node
                    const startNode = mapped.find((n) => n.variant === "start");
                    if (startNode) {
                        setCurrentNodeId(startNode.id);
                        setHasFlow(true);
                    }
                }
            } catch {
                // No saved flow
            } finally {
                setIsLoading(false);
                setTimeout(() => setFadeIn(true), 100);
            }
        };
        loadFlow();
    }, []);

    // ── Get current node ──
    const currentNode = flowNodes.find((n) => n.id === currentNodeId);

    // ── Compute branch choices when current node changes ──
    useEffect(() => {
        if (!currentNodeId || flowEdges.length === 0) return;

        const childEdges = flowEdges.filter((e) => e.source === currentNodeId);
        const choices: BranchChoice[] = childEdges
            .map((e) => {
                const targetNode = flowNodes.find((n) => n.id === e.target);
                if (!targetNode) return null;
                return {
                    id: targetNode.id,
                    label: targetNode.label,
                    branchLabel: targetNode.branchLabel,
                    videoUrl: targetNode.videoUrl,
                };
            })
            .filter(Boolean) as BranchChoice[];

        setBranches(choices);
        setShowBranch(false);
        setIsEnding(choices.length === 0);
    }, [currentNodeId, flowEdges, flowNodes]);

    // ── Preload branch videos ──
    useEffect(() => {
        preloadRefs.current = [];
        branches.forEach((b) => {
            const url = b.videoUrl || DUMMY_VIDEO_URL;
            const vid = document.createElement("video");
            vid.src = url;
            vid.preload = "auto";
            vid.muted = true;
            preloadRefs.current.push(vid);
        });
    }, [branches]);

    // ── Handle video time update — show branches near end ──
    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (!video || branches.length === 0) return;

        const timeLeft = video.duration - video.currentTime;
        if (timeLeft <= 2 && !showBranch) {
            setShowBranch(true);
        }
    }, [branches, showBranch]);

    // ── Handle video ended ──
    const handleVideoEnded = useCallback(() => {
        if (branches.length > 0) {
            setShowBranch(true);
        }
    }, [branches]);

    // ── Select a branch ──
    const selectBranch = useCallback((nodeId: string) => {
        setShowBranch(false);
        setFadeIn(false);
        setTimeout(() => {
            setCurrentNodeId(nodeId);
            setFadeIn(true);
        }, 150);
    }, []);

    // ── Restart from beginning ──
    const restart = useCallback(() => {
        const startNode = flowNodes.find((n) => n.variant === "start");
        if (startNode) {
            setFadeIn(false);
            setTimeout(() => {
                setCurrentNodeId(startNode.id);
                setFadeIn(true);
            }, 150);
        }
    }, [flowNodes]);

    // ── Like toggle ──
    const toggleLike = useCallback(() => {
        setIsLiked((prev) => !prev);
        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    }, [isLiked]);

    // ── Loading state ──
    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // ── No flow saved yet ──
    if (!hasFlow) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background p-6 pb-20 text-center md:pb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                    <Play className="h-9 w-9 text-primary" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">
                    No Stories Yet
                </h1>
                <p className="max-w-xs text-sm text-muted-foreground">
                    Create your first branching story in the Editor, generate videos,
                    and save to see it here!
                </p>
            </div>
        );
    }

    const videoUrl = currentNode?.videoUrl || DUMMY_VIDEO_URL;

    return (
        <div className="relative flex flex-1 overflow-hidden bg-black pb-16 md:pb-0">
            {/* ── Full-screen Video ── */}
            <video
                ref={videoRef}
                key={currentNodeId}
                src={videoUrl}
                className={cn(
                    "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
                    fadeIn ? "opacity-100" : "opacity-0"
                )}
                autoPlay
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
            />

            {/* ── Gradient overlays ── */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />

            {/* ── Current node label ── */}
            <div className="absolute left-4 bottom-20 z-10 md:bottom-6">
                <p className="text-xs font-medium uppercase tracking-widest text-white/60">
                    Now Playing
                </p>
                <h2 className="mt-1 text-lg font-bold text-white drop-shadow-lg">
                    {currentNode?.label || "Untitled"}
                </h2>
            </div>

            {/* ── Engagement buttons (right side) ── */}
            <div className="absolute right-3 bottom-24 z-10 flex flex-col items-center gap-5 md:bottom-10">
                {/* Like */}
                <button
                    onClick={toggleLike}
                    className="group flex flex-col items-center gap-1"
                >
                    <div
                        className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all active:scale-90",
                            isLiked && "bg-red-500/20"
                        )}
                    >
                        <Heart
                            className={cn(
                                "h-5 w-5 transition-colors",
                                isLiked
                                    ? "fill-red-500 text-red-500"
                                    : "text-white"
                            )}
                        />
                    </div>
                    <span className="text-[10px] font-medium text-white/70">
                        {likeCount}
                    </span>
                </button>

                {/* Share */}
                <button className="group flex flex-col items-center gap-1">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all active:scale-90">
                        <Share2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-white/70">
                        Share
                    </span>
                </button>
            </div>

            {/* ── Split Branch Overlay ── */}
            {showBranch && branches.length > 0 && (
                <div className="absolute inset-0 z-20 flex animate-in fade-in duration-300">
                    {branches.map((branch, idx) => (
                        <button
                            key={branch.id}
                            onClick={() => selectBranch(branch.id)}
                            className={cn(
                                "group relative flex flex-1 flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm transition-all duration-300",
                                "hover:bg-black/20 hover:backdrop-blur-none",
                                idx < branches.length - 1 && "border-r border-white/10"
                            )}
                        >
                            {/* Choice indicator */}
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20 backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20 group-hover:ring-white/40">
                                <span className="text-xl font-bold text-white">
                                    {String.fromCharCode(65 + idx)}
                                </span>
                            </div>

                            {/* Label */}
                            <h3 className="max-w-[80%] text-center text-base font-bold uppercase tracking-wider text-white drop-shadow-lg transition-all duration-300 group-hover:scale-105 md:text-lg">
                                {branch.branchLabel || branch.label}
                            </h3>

                            {/* Tap hint */}
                            <p className="text-[11px] font-medium text-white/40 transition-all group-hover:text-white/60">
                                Tap to choose
                            </p>
                        </button>
                    ))}
                </div>
            )}

            {/* ── Ending overlay ── */}
            {isEnding && showBranch && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                        The End
                    </h2>
                    <p className="max-w-xs text-center text-sm text-white/60">
                        You've reached the end of this story branch.
                    </p>
                    <button
                        onClick={restart}
                        className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Watch Again
                    </button>
                </div>
            )}

            {/* ── Ending trigger (when no branches) ── */}
            {isEnding && !showBranch && (
                <EndingTrigger videoRef={videoRef} onEnd={() => setShowBranch(true)} />
            )}
        </div>
    );
}

/** Helper: triggers ending overlay when video ends (for ending nodes) */
function EndingTrigger({
    videoRef,
    onEnd,
}: {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    onEnd: () => void;
}) {
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handler = () => onEnd();
        video.addEventListener("ended", handler);
        return () => video.removeEventListener("ended", handler);
    }, [videoRef, onEnd]);

    return null;
}
