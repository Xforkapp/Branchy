"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { StoryFlowEditor } from "@/components/flow/story-flow-editor";

export function EditorView() {
    return (
        <div className="flex flex-1 flex-col overflow-hidden pb-16 md:pb-0">
            <ReactFlowProvider>
                <StoryFlowEditor />
            </ReactFlowProvider>
        </div>
    );
}
