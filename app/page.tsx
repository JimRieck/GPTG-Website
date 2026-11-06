import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Image
        src="/images/banner.png"
        width={2172}
        height={724}
        alt="Green Pastures Technology Group banner: a sunrise over a calm lake and green pastures, with the words Building What's Next."
        priority
        sizes="(max-width: 1100px) 100vw, 1100px"
        className="banner"
      />

      <section className="hero">
        <h1>Green Pastures Technology Group</h1>
        <p className="lead">
          Practical technology services for growing businesses. We help you plan, build, and run the
          systems your team depends on, with clear communication and straightforward pricing.
        </p>
        <Link href="/contact" className="button">
          Start a conversation
        </Link>
      </section>

      <section className="cards">
        <article className="card">
          <h2>Who we are</h2>
          <p>
            Green Pastures Technology Group is a newly formed technology company focused on dependable,
            well-built solutions for small and mid-sized organizations.
          </p>
        </article>
        <article className="card">
          <h2>What we do</h2>
          <p>
            Website and web application development, systems integration, and ongoing technical support,
            tailored to the size and needs of your business.
          </p>
        </article>
        <article className="card">
          <h2>How we work</h2>
          <p>
            We start by understanding your goals, then propose a clear scope and timeline before any work
            begins. No surprises, and you always know where things stand.
          </p>
        </article>
      </section>

      <section className="narrow">
        <h2>Get in touch</h2>
        <p>
          Tell us about your project and we&apos;ll respond promptly. You can also reach us through our{" "}
          <Link href="/contact">contact form</Link>.
        </p>
      </section>
    </>
  );
}
