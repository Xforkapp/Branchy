"use client";

import { Smartphone } from "lucide-react";
import type { Page } from "@/components/app-shell";

interface PhonePreviewProps {
    activePage: Page;
}

const pageLabels: Record<Page, { title: string; description: string }> = {
    home: {
        title: "Home Feed",
        description: "Swipe through branching videos",
    },
    editor: {
        title: "Video Editor",
        description: "Create and edit branching paths",
    },
    profile: {
        title: "Profile",
        description: "Your videos and analytics",
    },
};

export function PhonePreview({ activePage }: PhonePreviewProps) {
    const { title, description } = pageLabels[activePage];

    return (
        <div className="hidden md:flex w-[420px] shrink-0 flex-col items-center justify-center border-l border-border bg-card/50 p-8">
            <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Preview
            </p>

            {/* Phone Frame */}
            <div className="relative w-full max-w-[280px] overflow-hidden rounded-[2.5rem] border-2 border-border bg-background shadow-2xl">
                {/* Aspect ratio container: 9:19.5 (modern phone) */}
                <div className="aspect-[9/19.5]">
                    {/* Status bar */}
                    <div className="flex h-12 items-center justify-center">
                        <div className="h-6 w-24 rounded-full bg-muted" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                            <Smartphone className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="mt-1 text-center text-xs text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground">
                Mobile Preview • {title}
            </p>
        </div>
    );
}
