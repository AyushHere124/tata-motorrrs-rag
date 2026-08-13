"use client";

import { Session } from "next-auth";
import { useMemo } from "react";

interface UserMenuProps {
    user: Session["user"];
}

export default function UserMenu({ user }: UserMenuProps) {

    const initials = useMemo(() =>{

        if (!user?.name) return "U";

        return user.name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase();

    }, [user?.name]);

    return (
        <div className="flex items-center gap-3">

            {/* Avatar */}

            {user?.image ? (
                <img
                    src={user.image}
                    alt={user.name ?? "User"}
                    className="
                        h-11
                        w-11
                        rounded-full
                        border
                        border-gray-300
                        object-cover
                    "
                />
            ) : (
                <div
                    className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-full
                        bg-blue-600
                        text-sm
                        font-bold
                        text-white
                    "
                >
                    {initials}
                </div>
            )}

            {/* User Info */}

            <div className="hidden sm:block">

                <p className="text-sm font-semibold text-gray-900">
                    {user?.name ?? "User"}
                </p>

                <p className="text-xs text-gray-500">
                    {user?.email ?? ""}
                </p>

            </div>

        </div>
    );
}