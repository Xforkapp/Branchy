"use client";

import { User, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ApiConfigDialog } from "@/components/api-config-dialog";

const PLACEHOLDER_ITEMS = Array.from({ length: 9 }, (_, i) => i);

export function ProfileView() {
    return (
        <div className="flex flex-1 flex-col overflow-y-auto pb-20 md:pb-0">
            {/* Header: Settings button */}
            <div className="flex items-center justify-end p-4">
                <ApiConfigDialog>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Settings className="h-5 w-5" />
                    </Button>
                </ApiConfigDialog>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col items-center px-6 pb-6">
                {/* Avatar */}
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-chart-2/30 to-chart-4/20 ring-2 ring-border">
                    <User className="h-11 w-11 text-chart-2" />
                </div>

                {/* Name & Bio */}
                <h1 className="mt-4 text-xl font-bold tracking-tight">Ryo Takada</h1>
                <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
                    Interactive storyteller crafting branching narratives. Building the
                    future of choose-your-own-adventure video.
                </p>

                {/* Stats row */}
                <div className="mt-5 flex gap-8">
                    {[
                        { value: "12", label: "Works" },
                        { value: "48", label: "Likes" },
                        { value: "1.2K", label: "Views" },
                    ].map(({ value, label }) => (
                        <div key={label} className="flex flex-col items-center">
                            <span className="text-lg font-semibold">{value}</span>
                            <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs: Works / Likes */}
            <Tabs defaultValue="works" className="flex flex-1 flex-col px-4">
                <TabsList className="mx-auto grid w-full max-w-sm grid-cols-2">
                    <TabsTrigger value="works">Works</TabsTrigger>
                    <TabsTrigger value="likes">Likes</TabsTrigger>
                </TabsList>

                <TabsContent value="works" className="mt-4 flex-1">
                    <div className="grid grid-cols-3 gap-1">
                        {PLACEHOLDER_ITEMS.map((i) => (
                            <div
                                key={i}
                                className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-lg bg-muted transition-all hover:ring-2 hover:ring-primary/50"
                            >
                                {/* Shimmer placeholder */}
                                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/5" />
                                <div className="absolute bottom-2 left-2 right-2">
                                    <div className="h-2 w-3/4 rounded-full bg-muted-foreground/10" />
                                    <div className="mt-1 h-2 w-1/2 rounded-full bg-muted-foreground/10" />
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="likes" className="mt-4 flex-1">
                    <div className="grid grid-cols-3 gap-1">
                        {PLACEHOLDER_ITEMS.slice(0, 6).map((i) => (
                            <div
                                key={i}
                                className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-lg bg-muted transition-all hover:ring-2 hover:ring-primary/50"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-muted to-chart-1/5" />
                                <div className="absolute bottom-2 left-2 right-2">
                                    <div className="h-2 w-3/4 rounded-full bg-muted-foreground/10" />
                                    <div className="mt-1 h-2 w-1/2 rounded-full bg-muted-foreground/10" />
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
