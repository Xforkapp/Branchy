"use client";

import { Home, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Page } from "@/components/app-shell";

interface BottomNavProps {
    activePage: Page;
    onNavigate: (page: Page) => void;
}

const navItems: { page: Page; icon: typeof Home; label: string }[] = [
    { page: "home", icon: Home, label: "Home" },
    { page: "editor", icon: PlusCircle, label: "Create" },
    { page: "profile", icon: User, label: "Profile" },
];

export function BottomNav({ activePage, onNavigate }: BottomNavProps) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl md:hidden">
            <div className="flex h-16 items-center justify-around">
                {navItems.map(({ page, icon: Icon, label }) => {
                    const isActive = activePage === page;
                    const isCreate = page === "editor";

                    return (
                        <button
                            key={page}
                            onClick={() => onNavigate(page)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 transition-colors",
                                isCreate ? "relative -mt-4" : "",
                                isActive && !isCreate
                                    ? "text-foreground"
                                    : !isCreate
                                        ? "text-muted-foreground"
                                        : ""
                            )}
                        >
                            {isCreate ? (
                                <div
                                    className={cn(
                                        "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all",
                                        "bg-primary text-primary-foreground",
                                        "hover:scale-105 hover:shadow-primary/25 active:scale-95"
                                    )}
                                >
                                    <Icon className="h-6 w-6" />
                                </div>
                            ) : (
                                <Icon
                                    className={cn(
                                        "h-5 w-5 transition-all",
                                        isActive ? "scale-110" : ""
                                    )}
                                />
                            )}
                            <span
                                className={cn(
                                    "text-[10px] font-medium",
                                    isCreate ? "mt-1" : ""
                                )}
                            >
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
