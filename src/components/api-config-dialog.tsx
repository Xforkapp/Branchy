"use client";

import { useState, useEffect } from "react";
import { KeyRound, Eye, EyeOff, Check, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_PROVIDERS = [
    {
        id: "luma",
        name: "Luma AI",
        description: "Dream Machine — cinematic video generation",
        storageKey: "branchy_api_luma",
    },
    {
        id: "runway",
        name: "Runway",
        description: "Gen-3 Alpha — creative video synthesis",
        storageKey: "branchy_api_runway",
    },
] as const;

function maskKey(key: string): string {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

interface ApiConfigDialogProps {
    children: React.ReactNode;
}

export function ApiConfigDialog({ children }: ApiConfigDialogProps) {
    const [open, setOpen] = useState(false);
    const [keys, setKeys] = useState<Record<string, string>>({});
    const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(
        {}
    );
    const [saved, setSaved] = useState(false);

    // Load keys from localStorage when dialog opens
    useEffect(() => {
        if (open) {
            const loadedKeys: Record<string, string> = {};
            API_PROVIDERS.forEach((provider) => {
                const stored = localStorage.getItem(provider.storageKey);
                if (stored) {
                    loadedKeys[provider.id] = stored;
                }
            });
            setKeys(loadedKeys);
            setVisibleFields({});
            setSaved(false);
        }
    }, [open]);

    const handleSave = () => {
        API_PROVIDERS.forEach((provider) => {
            const value = keys[provider.id];
            if (value && value.trim()) {
                localStorage.setItem(provider.storageKey, value.trim());
            }
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleClear = (providerId: string) => {
        const provider = API_PROVIDERS.find((p) => p.id === providerId);
        if (provider) {
            localStorage.removeItem(provider.storageKey);
            setKeys((prev) => {
                const next = { ...prev };
                delete next[providerId];
                return next;
            });
        }
    };

    const toggleVisibility = (providerId: string) => {
        setVisibleFields((prev) => ({
            ...prev,
            [providerId]: !prev[providerId],
        }));
    };

    const getDisplayValue = (providerId: string) => {
        const value = keys[providerId] || "";
        if (!value) return "";
        if (visibleFields[providerId]) return value;
        return maskKey(value);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        API Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Connect your own API keys to enable AI video generation. Your keys
                        are stored locally in your browser.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-2 space-y-5">
                    {API_PROVIDERS.map((provider) => {
                        const hasKey = !!keys[provider.id];
                        const isVisible = visibleFields[provider.id];

                        return (
                            <div key={provider.id} className="space-y-2">
                                <Label
                                    htmlFor={provider.id}
                                    className="text-sm font-medium"
                                >
                                    {provider.name}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {provider.description}
                                </p>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            id={provider.id}
                                            type={isVisible ? "text" : "password"}
                                            placeholder={`Enter ${provider.name} API key`}
                                            value={
                                                isVisible ? keys[provider.id] || "" : hasKey ? getDisplayValue(provider.id) : ""
                                            }
                                            onChange={(e) =>
                                                setKeys((prev) => ({
                                                    ...prev,
                                                    [provider.id]: e.target.value,
                                                }))
                                            }
                                            className="pr-10 font-mono text-sm"
                                        />
                                        {hasKey && (
                                            <button
                                                type="button"
                                                onClick={() => toggleVisibility(provider.id)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {isVisible ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    {hasKey && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleClear(provider.id)}
                                            className="shrink-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="min-w-[80px]">
                        {saved ? (
                            <span className="flex items-center gap-1.5">
                                <Check className="h-4 w-4" />
                                Saved
                            </span>
                        ) : (
                            "Save"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
