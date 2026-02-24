"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Film, Sparkles, Play, Flag, Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type VideoNodeData = {
    label: string;
    prompt?: string;
    variant?: "start" | "scene" | "ending";
    videoUrl?: string;
    branchLabel?: string;   // Choice text shown to viewers (e.g. "Enter the forest")
    duration?: 4 | 8;       // Video generation length in seconds
    onGenerate?: (nodeId: string, prompt: string) => void;
    onDataChange?: (nodeId: string, key: string, value: string | number) => void;
};

type VideoNodeType = Node<VideoNodeData, "videoNode">;

const variantConfig = {
    start: {
        icon: Play,
        accent: "text-emerald-400",
        accentBg: "bg-emerald-400/10",
        ring: "ring-emerald-400/20",
    },
    scene: {
        icon: Film,
        accent: "text-blue-400",
        accentBg: "bg-blue-400/10",
        ring: "ring-blue-400/20",
    },
    ending: {
        icon: Flag,
        accent: "text-amber-400",
        accentBg: "bg-amber-400/10",
        ring: "ring-amber-400/20",
    },
};

const DUMMY_VIDEO_URL =
    "https://www.w3schools.com/html/mov_bbb.mp4";

function VideoNodeComponent({ id, data, selected }: NodeProps<VideoNodeType>) {
    const [prompt, setPrompt] = useState(data.prompt || "");
    const [branchLabel, setBranchLabel] = useState(data.branchLabel || "");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(!!data.videoUrl);
    const variant = data.variant || "scene";
    const duration = data.duration || 4;
    const config = variantConfig[variant];
    const Icon = config.icon;

    const handleGenerate = async () => {
        const lumaKey = localStorage.getItem("branchy_api_luma");
        const runwayKey = localStorage.getItem("branchy_api_runway");

        if (!lumaKey && !runwayKey) {
            toast.error("APIキーを設定してください", {
                description:
                    "Profile → ⚙️ Settings から Luma AI または Runway の API キーを入力してください。",
            });
            return;
        }

        if (!prompt.trim()) {
            toast.error("プロンプトを入力してください", {
                description: "動画を生成するにはシーンの説明が必要です。",
            });
            return;
        }

        setIsGenerating(true);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        data.onGenerate?.(id, prompt);
        setIsGenerating(false);
        setIsGenerated(true);

        toast.success("動画が生成されました！", {
            description: `${data.label} — ${duration}秒のシーンが完成しました。`,
        });
    };

    const handleDurationChange = (newDuration: 4 | 8) => {
        data.onDataChange?.(id, "duration", newDuration);
    };

    const handleBranchLabelChange = (value: string) => {
        setBranchLabel(value);
        data.onDataChange?.(id, "branchLabel", value);
    };

    const hasVideo = data.videoUrl || isGenerated;

    return (
        <div className="group">
            {/* Target Handle (top) */}
            {variant !== "start" && (
                <Handle
                    type="target"
                    position={Position.Top}
                    className="!h-3 !w-3 !rounded-full !border-2 !border-muted-foreground/40 !bg-background transition-colors group-hover:!border-primary"
                />
            )}

            <Card
                className={cn(
                    "w-[260px] border-border/60 bg-card/95 shadow-xl backdrop-blur-sm transition-all",
                    selected && "ring-2 ring-primary"
                )}
            >
                <CardContent className="p-0">
                    {/* Thumbnail / Video area */}
                    <div
                        className={cn(
                            "relative flex h-28 items-center justify-center overflow-hidden rounded-t-lg",
                            hasVideo ? "bg-black" : config.accentBg
                        )}
                    >
                        {hasVideo ? (
                            <>
                                <video
                                    src={data.videoUrl || DUMMY_VIDEO_URL}
                                    className="h-full w-full object-cover"
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                />
                                <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-medium text-emerald-400">
                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                    Generated
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-xl bg-background/60",
                                        config.ring,
                                        "ring-1"
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5", config.accent)} />
                                </div>
                                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                    {variant === "start"
                                        ? "Start"
                                        : variant === "ending"
                                            ? "Ending"
                                            : "Scene"}
                                </span>
                            </div>
                        )}

                        {/* Duration badge (top-right) */}
                        <div className="absolute top-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white/80">
                            {duration}s
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2.5 p-3">
                        {/* Title + Duration toggle row */}
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold tracking-tight">
                                {data.label}
                            </h3>

                            {/* 4s / 8s Toggle */}
                            <div className="flex h-6 overflow-hidden rounded-md border border-border bg-muted/50 text-[10px] font-medium">
                                <button
                                    onClick={() => handleDurationChange(4)}
                                    className={cn(
                                        "px-2 transition-all",
                                        duration === 4
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    4s
                                </button>
                                <button
                                    onClick={() => handleDurationChange(8)}
                                    className={cn(
                                        "px-2 transition-all",
                                        duration === 8
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    8s
                                </button>
                            </div>
                        </div>

                        {/* Branch label (choice text for viewers) — not shown on Start */}
                        {variant !== "start" && (
                            <div className="flex items-center gap-1.5">
                                <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <Input
                                    value={branchLabel}
                                    onChange={(e) => handleBranchLabelChange(e.target.value)}
                                    placeholder="Choice text (e.g. 森に入る)"
                                    className="h-7 text-[11px]"
                                />
                            </div>
                        )}

                        {/* Prompt input */}
                        <Input
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe this scene..."
                            className="h-8 text-xs"
                        />

                        {/* Generate button */}
                        <Button
                            size="sm"
                            className="h-7 w-full gap-1.5 text-xs"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Generating...
                                </>
                            ) : hasVideo ? (
                                <>
                                    <Sparkles className="h-3 w-3" />
                                    Regenerate
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3 w-3" />
                                    Generate Video
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Source Handle (bottom) */}
            {variant !== "ending" && (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="!h-3 !w-3 !rounded-full !border-2 !border-muted-foreground/40 !bg-background transition-colors group-hover:!border-primary"
                />
            )}
        </div>
    );
}

export const VideoNode = memo(VideoNodeComponent);
