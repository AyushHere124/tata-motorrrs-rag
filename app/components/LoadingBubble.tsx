"use client";

import Image from "next/image";

export default function LoadingBubble() {

    return (

        <div
            style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "10px",
                width: "100%",
            }}
        >

            <Image
                src="/assets/logo.png"
                alt="Tata Motors"
                width={42}
                height={42}
                className="logo"
            />

            <div className="message assistant">

                <div className="loader">

                    <span></span>

                    <span></span>

                    <span></span>

                </div>

            </div>

        </div>

    );

}