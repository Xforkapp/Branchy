"use client";

import { useState, useEffect } from "react";
import { User, Settings, KeyRound, Palette, Bell, Shield, ChevronRight, Moon, Sun } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiConfigDialog } from "@/components/api-config-dialog";
import { toast } from "sonner";

interface UserProfile {
    name: string;
    bio: string;
}

const PROFILE_KEY = "branchy_user_profile";

export function ProfileView() {
    const [profile, setProfile] = useState<UserProfile>({
        name: "Ryo Takada",
        bio: "Interactive storyteller crafting branching narratives.",
    });
    const [editName, setEditName] = useState("");
    const [editBio, setEditBio] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    // Load profile from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(PROFILE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as UserProfile;
                setProfile(parsed);
            } catch { /* ignore */ }
        }
    }, []);

    const startEditing = () => {
        setEditName(profile.name);
        setEditBio(profile.bio);
        setIsEditing(true);
    };

    const saveProfile = () => {
        const updated = { name: editName.trim() || "User", bio: editBio.trim() };
        setProfile(updated);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
        setIsEditing(false);
        toast.success("プロフィールを保存しました");
    };

    return (
        <div className="flex flex-1 flex-col overflow-y-auto pb-20 md:pb-0">
            {/* Profile Info */}
            <div className="flex flex-col items-center px-6 pt-8 pb-6">
                {/* Avatar */}
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-chart-2/30 to-chart-4/20 ring-2 ring-border">
                    <User className="h-11 w-11 text-chart-2" />
                </div>

                {/* Name & Bio */}
                {isEditing ? (
                    <div className="mt-4 flex w-full max-w-xs flex-col gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Display Name</Label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Your name"
                                className="text-center"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Bio</Label>
                            <Input
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                placeholder="Short bio..."
                                className="text-center"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </Button>
                            <Button size="sm" className="flex-1" onClick={saveProfile}>
                                Save
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h1 className="mt-4 text-xl font-bold tracking-tight">
                            {profile.name}
                        </h1>
                        <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
                            {profile.bio}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={startEditing}
                        >
                            Edit Profile
                        </Button>
                    </>
                )}

                {/* Stats */}
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

            {/* Tabs: Works / Settings */}
            <Tabs defaultValue="works" className="flex flex-1 flex-col px-4">
                <TabsList className="mx-auto grid w-full max-w-sm grid-cols-2">
                    <TabsTrigger value="works">Works</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="works" className="mt-4 flex-1">
                    <div className="grid grid-cols-3 gap-1">
                        {Array.from({ length: 9 }, (_, i) => (
                            <div
                                key={i}
                                className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-lg bg-muted transition-all hover:ring-2 hover:ring-primary/50"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/5" />
                                <div className="absolute bottom-2 left-2 right-2">
                                    <div className="h-2 w-3/4 rounded-full bg-muted-foreground/10" />
                                    <div className="mt-1 h-2 w-1/2 rounded-full bg-muted-foreground/10" />
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="mt-4 flex-1">
                    <div className="space-y-1">
                        {/* API Keys */}
                        <ApiConfigDialog>
                            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                    <KeyRound className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">API Keys</p>
                                    <p className="text-xs text-muted-foreground">
                                        Luma AI, Runway の設定
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </ApiConfigDialog>

                        {/* Theme (display only for now) */}
                        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-chart-4/10">
                                <Palette className="h-4 w-4 text-chart-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Appearance</p>
                                <p className="text-xs text-muted-foreground">
                                    Dark Mode
                                </p>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                                <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                        </button>

                        {/* Notifications (placeholder) */}
                        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-chart-2/10">
                                <Bell className="h-4 w-4 text-chart-2" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Notifications</p>
                                <p className="text-xs text-muted-foreground">
                                    通知・お知らせの設定
                                </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>

                        {/* Privacy (placeholder) */}
                        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-chart-1/10">
                                <Shield className="h-4 w-4 text-chart-1" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Privacy</p>
                                <p className="text-xs text-muted-foreground">
                                    プライバシー・セキュリティ
                                </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* App info */}
                    <div className="mt-8 flex flex-col items-center gap-1 pb-8 text-center">
                        <p className="text-xs font-medium text-muted-foreground">
                            Branchy v1.0.0
                        </p>
                        <p className="text-[11px] text-muted-foreground/60">
                            Interactive Branching Video Platform
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
