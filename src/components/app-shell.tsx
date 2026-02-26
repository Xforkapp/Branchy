"use client";

import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Sidebar } from "@/components/sidebar";
import { PhonePreview } from "@/components/phone-preview";
import { HomeView } from "@/components/views/home-view";
import { EditorView } from "@/components/views/editor-view";
import { ProfileView } from "@/components/views/profile-view";

export type Page = "home" | "editor" | "profile";

export function AppShell({ children }: { children: React.ReactNode }) {
    const [activePage, setActivePage] = useState<Page>("home");

    const renderView = () => {
        switch (activePage) {
            case "home":
                return <HomeView />;
            case "editor":
                return <EditorView />;
            case "profile":
                return <ProfileView />;
        }
    };

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
            {/* Desktop Sidebar */}
            <Sidebar activePage={activePage} onNavigate={setActivePage} />

            {/* Main Content Area */}
            <main className="relative flex flex-1 flex-col overflow-hidden">
                {/* Mobile: full-screen content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Main view area */}
                    <div className="flex flex-1 flex-col overflow-hidden">
                        {renderView()}
                    </div>

                    {/* Desktop: Phone Preview Pane */}
                    <PhonePreview activePage={activePage} />
                </div>

                {/* Mobile Bottom Navigation */}
                <BottomNav activePage={activePage} onNavigate={setActivePage} />
            </main>
        </div>
    );
}
