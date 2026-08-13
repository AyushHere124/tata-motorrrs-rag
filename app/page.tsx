import Link from "next/link";

export default function Home() {
    return (
        <main className="landing-page">

            {/* =========================
          NAVBAR
      ========================== */}
            <nav className="navbar">

                <Link href="/" className="navbar-logo">
                    <img
                        src="/assets/Tata_Motors_Logo.png"
                        alt="Tata Motors"
                    />
                </Link>

                <div className="navbar-links">
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#mission">Mission</a>
                    <a href="#values">Values</a>
                    <a href="#products">Products</a>
                    <a href="#contact">Contact</a>

                    <Link href="/chat" className="navbar-chat">
                        Eloqwent
                    </Link>
                </div>

            </nav>


            {/* =========================
          HERO
      ========================== */}
            <section id="home" className="hero-section">

                <div className="hero-overlay" />

                <div className="hero-content">

          <span className="hero-label">
            TATA MOTORS · MOBILITY · INNOVATION
          </span>

                    <h1>
                        Driving the
                        <span>future of mobility.</span>
                    </h1>

                    <p>
                        Explore the story, vision and innovations of Tata Motors —
                        and discover a smarter way to explore its knowledge with
                        Eloqwent.
                    </p>

                    <div className="hero-actions">

                        <a href="#about" className="primary-button">
                            Explore Tata Motors
                        </a>

                        <Link href="/chat" className="secondary-button">
                            Meet Eloqwent →
                        </Link>

                    </div>

                </div>

                <div className="hero-scroll">
                    <span>Scroll to explore</span>
                    <div className="scroll-line" />
                </div>

            </section>


            {/* =========================
          ABOUT
      ========================== */}
            <section id="about" className="about-section">

        <span className="section-label">
          01 · About Tata Motors
        </span>

                <h2 className="section-title">
                    Engineering mobility for a changing world.
                </h2>

                <p className="section-description">
                    Tata Motors is one of India&apos;s leading automobile
                    manufacturers, with a diverse portfolio spanning passenger
                    vehicles, electric mobility and commercial vehicles.
                </p>

                <div className="cards-grid">

                    <div className="info-card">
                        <h3>Innovation</h3>
                        <p>
                            Building technologies and mobility solutions designed
                            for the future.
                        </p>
                    </div>

                    <div className="info-card">
                        <h3>Mobility</h3>
                        <p>
                            Creating vehicles and transportation solutions that
                            connect people and communities.
                        </p>
                    </div>

                    <div className="info-card">
                        <h3>Responsibility</h3>
                        <p>
                            Working towards sustainable mobility and responsible
                            growth.
                        </p>
                    </div>

                </div>

            </section>


            {/* =========================
          MISSION
      ========================== */}
            <section id="mission" className="mission-section">

        <span className="section-label">
          02 · Mission & Vision
        </span>

                <h2 className="section-title">
                    Shaping the future through purposeful mobility.
                </h2>

                <p className="section-description">
                    Tata Motors continues to focus on innovation, sustainable
                    mobility and creating products that address the evolving
                    needs of customers around the world.
                </p>

            </section>


            {/* =========================
          VALUES
      ========================== */}
            <section id="values" className="values-section">

        <span className="section-label">
          03 · Values
        </span>

                <h2 className="section-title">
                    Values that drive every journey.
                </h2>

                <div className="cards-grid">

                    <div className="info-card">
                        <h3>Integrity</h3>
                        <p>
                            Acting with honesty, transparency and accountability.
                        </p>
                    </div>

                    <div className="info-card">
                        <h3>Customer Focus</h3>
                        <p>
                            Understanding customers and creating meaningful
                            mobility experiences.
                        </p>
                    </div>

                    <div className="info-card">
                        <h3>Excellence</h3>
                        <p>
                            Continuously improving products, technologies and
                            experiences.
                        </p>
                    </div>

                </div>

            </section>


            {/* =========================
          PRODUCTS
      ========================== */}
            <section id="products" className="products-section">

        <span className="section-label">
          04 · Products
        </span>

                <h2 className="section-title">
                    Explore Tata Motors.
                </h2>

                <p className="section-description">
                    Discover Tata Motors&apos; vehicles, technologies and
                    mobility solutions through the official website.
                </p>

                <div className="hero-actions">

                    <a
                        href="https://www.tatamotors.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="primary-button"
                    >
                        Visit Official Website →
                    </a>

                </div>

            </section>


            {/* =========================
          ELOQWENT
      ========================== */}
            <section className="eloqwent-section">

                <div className="eloqwent-content">

          <span className="eyebrow">
            AI · KNOWLEDGE · RAG
          </span>

                    <h2>
                        Meet <span>Eloqwent.</span>
                    </h2>

                    <p>
                        Your intelligent Tata Motors knowledge assistant.
                        Ask questions, explore documents and discover
                        information through an AI-powered RAG experience.
                    </p>

                    <Link href="/chat" className="eloqwent-button">
                        Start Conversation →
                    </Link>

                </div>


                <div className="robot-container">

                    <div className="robot">

                        <div className="robot-eye left" />
                        <div className="robot-eye right" />

                        <div className="robot-body">
                            <div className="robot-core" />
                        </div>

                    </div>

                </div>

            </section>


            {/* =========================
          CONTACT
      ========================== */}
            <section id="contact" className="about-section">

        <span className="section-label">
          05 · Contact
        </span>

                <h2 className="section-title">
                    Let&apos;s connect.
                </h2>

                <p className="section-description">
                    Have a question or want to learn more? Get in touch
                    through the official Tata Motors channels.
                </p>

                <div className="hero-actions">

                    <a
                        href="mailto:customercare@tatamotors.com"
                        className="primary-button"
                    >
                        Email Us
                    </a>

                    <a
                        href="tel:18002098282"
                        className="secondary-button"
                    >
                        Call Tata Motors
                    </a>

                </div>

            </section>


            {/* =========================
          FOOTER
      ========================== */}
            <footer className="footer">

                <div className="footer-content">

                    <p>
                        © 2026 Tata Motors RAG · Eloqwent
                    </p>

                    <div className="footer-links">

                        <a href="#home">Home</a>

                        <a href="#about">About</a>

                        <Link href="/chat">
                            Eloqwent
                        </Link>

                        <a
                            href="https://www.tatamotors.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Tata Motors
                        </a>

                    </div>

                </div>

            </footer>

        </main>
    );
}