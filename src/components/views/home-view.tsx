"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
    Heart,
    Share2,
    RotateCcw,
    Loader2,
    Play,
    Pause,
    Volume2,
    VolumeX,
    ChevronLeft,
} from "lucide-react";
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

    // ── Player controls state ──
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isSeeking, setIsSeeking] = useState(false);

    // ── Navigation history for back button ──
    const [history, setHistory] = useState<string[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const preloadRefs = useRef<HTMLVideoElement[]>([]);
    const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

                    const startNode = mapped.find((n) => n.variant === "start");
                    if (startNode) {
                        setCurrentNodeId(startNode.id);
                        setHasFlow(true);
                        setHistory([]);
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

    const currentNode = flowNodes.find((n) => n.id === currentNodeId);

    // ── Compute branches ──
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

    // ── Auto-hide controls ──
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = setTimeout(() => {
            if (!showBranch && !isEnding) setShowControls(false);
        }, 3000);
    }, [showBranch, isEnding]);

    useEffect(() => {
        resetControlsTimer();
        return () => {
            if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        };
    }, [currentNodeId, resetControlsTimer]);

    // ── Video time update ──
    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (!video || isSeeking) return;

        setProgress(video.currentTime);
        setDuration(video.duration || 0);

        const timeLeft = video.duration - video.currentTime;
        if (timeLeft <= 2 && branches.length > 0 && !showBranch) {
            setShowBranch(true);
        }
    }, [branches, showBranch, isSeeking]);

    const handleVideoEnded = useCallback(() => {
        if (branches.length > 0) {
            setShowBranch(true);
        }
        setIsPlaying(false);
    }, [branches]);

    const handleLoadedMetadata = useCallback(() => {
        const video = videoRef.current;
        if (video) {
            setDuration(video.duration || 0);
            setProgress(0);
            setIsPlaying(true);
        }
    }, []);

    // ── Player controls ──
    const togglePlayPause = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
        resetControlsTimer();
    }, [resetControlsTimer]);

    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(!isMuted);
        resetControlsTimer();
    }, [isMuted, resetControlsTimer]);

    const handleSeekStart = useCallback(() => {
        setIsSeeking(true);
    }, []);

    const handleSeek = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const video = videoRef.current;
            if (!video) return;
            const time = parseFloat(e.target.value);
            video.currentTime = time;
            setProgress(time);
            resetControlsTimer();
        },
        [resetControlsTimer]
    );

    const handleSeekEnd = useCallback(() => {
        setIsSeeking(false);
    }, []);

    // ── Branch selection with history ──
    const selectBranch = useCallback(
        (nodeId: string) => {
            setShowBranch(false);
            setFadeIn(false);
            if (currentNodeId) {
                setHistory((prev) => [...prev, currentNodeId]);
            }
            setTimeout(() => {
                setCurrentNodeId(nodeId);
                setFadeIn(true);
                setIsPlaying(true);
            }, 150);
        },
        [currentNodeId]
    );

    // ── Go back to previous branch ──
    const goBack = useCallback(() => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        setHistory((h) => h.slice(0, -1));
        setFadeIn(false);
        setShowBranch(false);
        setTimeout(() => {
            setCurrentNodeId(prev);
            setFadeIn(true);
            setIsPlaying(true);
        }, 150);
    }, [history]);

    // ── Restart ──
    const restart = useCallback(() => {
        const startNode = flowNodes.find((n) => n.variant === "start");
        if (startNode) {
            setFadeIn(false);
            setHistory([]);
            setTimeout(() => {
                setCurrentNodeId(startNode.id);
                setFadeIn(true);
                setIsPlaying(true);
            }, 150);
        }
    }, [flowNodes]);

    const toggleLike = useCallback(() => {
        setIsLiked((prev) => !prev);
        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    }, [isLiked]);

    const formatTime = (t: number) => {
        if (!t || isNaN(t)) return "0:00";
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    // ── Loading ──
    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // ── No flow ──
    if (!hasFlow) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background p-6 pb-20 text-center md:pb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                    <Play className="h-9 w-9 text-primary" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">No Stories Yet</h1>
                <p className="max-w-xs text-sm text-muted-foreground">
                    Create your first branching story in the Editor, generate videos,
                    and save to see it here!
                </p>
            </div>
        );
    }

    const videoUrl = currentNode?.videoUrl || DUMMY_VIDEO_URL;

    return (
        <div
            className="relative flex flex-1 overflow-hidden bg-black pb-16 md:pb-0"
            onClick={resetControlsTimer}
        >
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
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                onLoadedMetadata={handleLoadedMetadata}
            />

            {/* ── Gradient overlays ── */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />

            {/* ── Top bar: Back button + Now Playing ── */}
            <div
                className={cn(
                    "absolute inset-x-0 top-0 z-10 flex items-center gap-3 px-4 py-3 transition-opacity duration-300",
                    showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            >
                {history.length > 0 && (
                    <button
                        onClick={goBack}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
                    >
                        <ChevronLeft className="h-5 w-5 text-white" />
                    </button>
                )}
                <div className="flex flex-col">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-white/50">
                        Now Playing
                    </p>
                    <h2 className="text-sm font-bold text-white drop-shadow-lg">
                        {currentNode?.label || "Untitled"}
                    </h2>
                </div>
            </div>

            {/* ── Center play/pause tap area ── */}
            <button
                onClick={togglePlayPause}
                className="absolute inset-0 z-[5] flex items-center justify-center"
            >
                <div
                    className={cn(
                        "flex h-16 w-16 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition-all duration-300",
                        showControls && !isPlaying
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-75 pointer-events-none"
                    )}
                >
                    <Play className="h-7 w-7 text-white ml-1" />
                </div>
            </button>

            {/* ── Bottom controls: seek bar + play/pause + mute + time ── */}
            <div
                className={cn(
                    "absolute inset-x-0 bottom-16 z-10 flex flex-col gap-2 px-4 md:bottom-4 transition-opacity duration-300",
                    showControls && !showBranch && !isEnding
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                )}
            >
                {/* Seek bar */}
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={progress}
                    onMouseDown={handleSeekStart}
                    onTouchStart={handleSeekStart}
                    onChange={handleSeek}
                    onMouseUp={handleSeekEnd}
                    onTouchEnd={handleSeekEnd}
                    className="seek-bar h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white
                        [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
                        [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
                    style={{
                        background: duration
                            ? `linear-gradient(to right, white ${(progress / duration) * 100}%, rgba(255,255,255,0.2) ${(progress / duration) * 100}%)`
                            : undefined,
                    }}
                />

                {/* Controls row */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePlayPause();
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
                    >
                        {isPlaying ? (
                            <Pause className="h-4 w-4 text-white" />
                        ) : (
                            <Play className="h-4 w-4 text-white ml-0.5" />
                        )}
                    </button>

                    <span className="text-xs font-medium text-white/60 tabular-nums">
                        {formatTime(progress)} / {formatTime(duration)}
                    </span>

                    <div className="flex-1" />

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMute();
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
                    >
                        {isMuted ? (
                            <VolumeX className="h-4 w-4 text-white" />
                        ) : (
                            <Volume2 className="h-4 w-4 text-white" />
                        )}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            restart();
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
                    >
                        <RotateCcw className="h-4 w-4 text-white" />
                    </button>
                </div>
            </div>

            {/* ── Engagement buttons (right side) ── */}
            <div
                className={cn(
                    "absolute right-3 bottom-36 z-10 flex flex-col items-center gap-5 md:bottom-20 transition-opacity duration-300",
                    showControls && !showBranch ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            >
                <button onClick={toggleLike} className="group flex flex-col items-center gap-1">
                    <div
                        className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all active:scale-90",
                            isLiked && "bg-red-500/20"
                        )}
                    >
                        <Heart
                            className={cn(
                                "h-5 w-5 transition-colors",
                                isLiked ? "fill-red-500 text-red-500" : "text-white"
                            )}
                        />
                    </div>
                    <span className="text-[10px] font-medium text-white/70">{likeCount}</span>
                </button>

                <button className="group flex flex-col items-center gap-1">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all active:scale-90">
                        <Share2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-white/70">Share</span>
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
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20 backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20 group-hover:ring-white/40">
                                <span className="text-xl font-bold text-white">
                                    {String.fromCharCode(65 + idx)}
                                </span>
                            </div>
                            <h3 className="max-w-[80%] text-center text-base font-bold uppercase tracking-wider text-white drop-shadow-lg transition-all duration-300 group-hover:scale-105 md:text-lg">
                                {branch.branchLabel || branch.label}
                            </h3>
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
                    <div className="flex gap-3">
                        {history.length > 0 && (
                            <button
                                onClick={goBack}
                                className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Go Back
                            </button>
                        )}
                        <button
                            onClick={restart}
                            className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Watch Again
                        </button>
                    </div>
                </div>
            )}

            {/* ── Ending trigger ── */}
            {isEnding && !showBranch && (
                <EndingTrigger videoRef={videoRef} onEnd={() => setShowBranch(true)} />
            )}
        </div>
    );
}

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
