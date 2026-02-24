"use client";

import { Home, PlusCircle, User, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Page } from "@/components/app-shell";

interface SidebarProps {
    activePage: Page;
    onNavigate: (page: Page) => void;
}

const navItems: { page: Page; icon: typeof Home; label: string }[] = [
    { page: "home", icon: Home, label: "Home" },
    { page: "editor", icon: PlusCircle, label: "Create" },
    { page: "profile", icon: User, label: "Profile" },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
    return (
        <aside className="hidden md:flex h-full w-16 flex-col items-center border-r border-border bg-card py-6">
            {/* Logo */}
            <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Clapperboard className="h-5 w-5" />
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col items-center gap-2">
                {navItems.map(({ page, icon: Icon, label }) => {
                    const isActive = activePage === page;

                    return (
                        <button
                            key={page}
                            onClick={() => onNavigate(page)}
                            className={cn(
                                "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all",
                                isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                            title={label}
                        >
                            <Icon className="h-5 w-5" />

                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-x-[19px] -translate-y-1/2 rounded-r-full bg-primary" />
                            )}

                            {/* Tooltip */}
                            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                                {label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
