"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import UserMenu from "./UserMenu";

export default function Navbar() {
    const { data: session, status } = useSession();

    return (
        <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

                {/* Logo */}

                <Link
                    href="/"
                    className="flex items-center gap-3"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
                        🚗
                    </div>

                    <div>
                        <h1 className="text-lg font-bold text-gray-900">
                            Tata Motors AI
                        </h1>

                        <p className="text-xs text-gray-500">
                            RAG Assistant
                        </p>
                    </div>
                </Link>

                {/* Right Side */}

                <div className="flex items-center gap-4">

                    {status === "loading" && (
                        <span className="text-sm text-gray-500">
                            Loading...
                        </span>
                    )}

                    {status === "authenticated" && session?.user ? (
                        <>
                            <UserMenu user={session.user} />

                            <button
                                onClick={() => signOut()}
                                className="
                                    rounded-lg
                                    border
                                    border-red-300
                                    px-4
                                    py-2
                                    text-sm
                                    font-medium
                                    text-red-600
                                    transition
                                    hover:bg-red-50
                                "
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => signIn("google")}
                            className="
                                rounded-lg
                                bg-blue-600
                                px-5
                                py-2
                                text-sm
                                font-medium
                                text-white
                                transition
                                hover:bg-blue-700
                            "
                        >
                            Login with Google
                        </button>
                    )}

                </div>

            </div>
        </header>
    );
}