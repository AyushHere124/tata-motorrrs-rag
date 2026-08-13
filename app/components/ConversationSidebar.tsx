"use client";

interface Conversation {
    id: string;
    title: string;
    updatedAt: string;
}

interface ConversationSidebarProps {
    conversations: Conversation[];
    activeConversationId?: string;
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    onDeleteConversation: (id: string) => void;
}

export default function ConversationSidebar({
                                                conversations,
                                                activeConversationId,
                                                onSelectConversation,
                                                onNewChat,
                                                onDeleteConversation,
                                            }: ConversationSidebarProps) {

    return (
        <aside
            className="
                flex
                h-full
                w-80
                flex-col
                border-r
                bg-white
            "
        >
            {/* Header */}

            <div className="border-b p-4">

                <h2 className="text-xl font-bold text-gray-900">
                    Chats
                </h2>

                <button
                    onClick={onNewChat}
                    className="
                        mt-4
                        w-full
                        rounded-lg
                        bg-blue-600
                        px-4
                        py-2
                        font-medium
                        text-white
                        transition
                        hover:bg-blue-700
                    "
                >
                    + New Chat
                </button>

            </div>

            {/* Search */}

            <div className="border-b p-4">

                <input
                    type="text"
                    placeholder="Search chats..."
                    className="
                        w-full
                        rounded-lg
                        border
                        border-gray-300
                        px-3
                        py-2
                        text-sm
                        outline-none
                        focus:border-blue-500
                    "
                />

            </div>

            {/* Conversation List */}

            <div className="flex-1 overflow-y-auto">

                {conversations.length === 0 ? (

                    <div className="p-6 text-center text-sm text-gray-500">
                        No conversations yet.
                    </div>

                ) : (

                    conversations.map((conversation) => (

                        <div
                            key={conversation.id}
                            className={`
                                group
                                border-b
                                transition
                                ${
                                activeConversationId === conversation.id
                                    ? "bg-blue-50"
                                    : "hover:bg-gray-50"
                            }
                            `}
                        >

                            <button
                                onClick={() =>
                                    onSelectConversation(conversation.id)
                                }
                                className="
                                    flex
                                    w-full
                                    flex-col
                                    items-start
                                    gap-1
                                    px-4
                                    py-3
                                    text-left
                                "
                            >

                                <span
                                    className="
                                        line-clamp-1
                                        text-sm
                                        font-semibold
                                        text-gray-900
                                    "
                                >
                                    {conversation.title}
                                </span>

                                <span
                                    className="
                                        text-xs
                                        text-gray-500
                                    "
                                >
                                    {conversation.updatedAt}
                                </span>

                            </button>

                            <div className="px-4 pb-3">

                                <button
                                    onClick={() =>
                                        onDeleteConversation(
                                            conversation.id
                                        )
                                    }
                                    className="
                                        text-xs
                                        text-red-500
                                        opacity-0
                                        transition
                                        group-hover:opacity-100
                                    "
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    ))

                )}

            </div>

        </aside>
    );
}