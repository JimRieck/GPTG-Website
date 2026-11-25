import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Plan, build, and modernize software",
  description:
    "Green Pastures Technology Group helps small businesses and nonprofits plan new software projects, build applications from the ground up, and modernize the systems they rely on.",
};

const services = [
  {
    title: "Project Roadmaps",
    body: "Have an idea or a business problem and need a plan? We clarify what the software needs to do, evaluate build-versus-buy options, and lay out what to tackle first, what it may cost, and what decisions come next.",
  },
  {
    title: "New Software Development",
    body: "Need an application you can't get off the shelf? We design and build new software around how your team works, from the first usable release through deployment. Examples include customer portals, internal tools, and web applications.",
  },
  {
    title: "Modernization",
    body: "Have software that still does important work but is harder to maintain or extend? We help move on-premises applications to the cloud, update legacy software in phases, and add AI where it solves a specific problem, such as reviewing documents or summarizing information for staff.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="band hero" aria-labelledby="hero-title">
        <div className="container hero-inner">
          <div className="hero-text">
            <h1 id="hero-title">Plan your next software project. Build it or modernize what you have.</h1>
            <p className="lead">
              Green Pastures Technology Group helps small businesses and nonprofits turn software ideas into practical
              roadmaps, build applications from the ground up, and modernize the systems they rely on.
            </p>
            <Link href="/contact" className="button on-dark">
              Talk about your project
            </Link>
          </div>
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

      <section className="section" aria-labelledby="help-title">
        <h2 id="help-title">How we can help</h2>
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
          Jim Rieck is a hands-on software architect and engineering leader. He has built business-critical
          applications, led engineering teams, and moved legacy workloads to Azure. He started Green Pastures to bring
          that experience to small businesses and nonprofits that need practical software and a clear plan.
        </p>
      </section>

      <section className="section" aria-labelledby="how-title">
        <h2 id="how-title">How we work</h2>
        <p>
          We start by understanding the business problem and the systems you already have. Then we agree on scope,
          cost, and timeline before any implementation begins.
        </p>
        <Link href="/contact" className="button">
          Talk about your project
        </Link>
      </section>
    </>
  );
}
