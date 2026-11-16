import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Practical software for growing organizations",
  description:
    "Green Pastures Technology Group builds websites, connects systems, and automates everyday workflows for nonprofits and small businesses.",
};

const problems = [
  {
    title: "Event registration and check-in",
    body: "Replace spreadsheets and paper sign-in sheets with an online registration form, confirmation emails, and a simple check-in list for event day.",
  },
  {
    title: "Duplicate data entry",
    body: "When the same donor, customer, or order is typed into two systems, mistakes creep in. We connect the systems so each record is entered once and updated everywhere.",
  },
  {
    title: "One place to track requests",
    body: "Keep requests, documents, or inventory in a shared tool that staff can search, update, and report on, instead of scattered files and inboxes.",
  },
];

const services = [
  {
    title: "Websites and web apps",
    body: "A public site that explains what you do and makes it easy to get in touch, or an internal app for requests, sign-ups, or records.",
  },
  {
    title: "Workflow automation",
    body: "Automatic reminders, approvals, and notifications, so routine steps happen without someone having to remember them.",
  },
  {
    title: "System integrations",
    body: "Connecting the tools you already use, such as a donor database and a spreadsheet, so information moves between them on its own.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="band hero" aria-labelledby="hero-title">
        <div className="container">
          <h1 id="hero-title">Spend less time on manual work.</h1>
          <p className="lead">
            Green Pastures Technology Group builds websites, connects systems, and automates everyday workflows
            for nonprofits and small businesses.
          </p>
          <Link href="/contact" className="button on-dark">
            Start a conversation
          </Link>
          <Image
            src="/images/banner.png"
            width={2172}
            height={724}
            alt="Green Pastures Technology Group banner: a sunrise over a calm lake and green pastures, with the words Building What's Next."
            priority
            sizes="(max-width: 1100px) 100vw, 1100px"
            className="banner"
          />
        </div>
      </section>

      <section className="section" aria-labelledby="problems-title">
        <h2 id="problems-title">Problems we can help with</h2>
        <p className="section-intro">
          These are examples of the kind of work we take on.
        </p>
        <ul className="stack">
          {problems.map((item) => (
            <li key={item.title} className="item">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="services-title">
        <h2 id="services-title">What we build</h2>
        <div className="service-grid">
          {services.map((item) => (
            <article key={item.title} className="service">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="founder" className="section founder" aria-labelledby="founder-title">
        <h2 id="founder-title">Meet the founder</h2>
        <p>
          Jim Rieck is a software architect and engineering leader who has built and supported business-critical
          applications. He started Green Pastures to bring that experience to smaller teams that need practical
          software and a clear plan.
        </p>
      </section>

      <section className="section" aria-labelledby="how-title">
        <h2 id="how-title">How we work</h2>
        <p>
          We start by understanding how your work gets done today. Then we agree on scope, cost, and timeline
          before any work begins, so there are no surprises about cost or timing.
        </p>
        <p className="question">What&apos;s one process you wish were easier?</p>
        <Link href="/contact" className="button">
          Tell us about it
        </Link>
      </section>
    </>
  );
}
