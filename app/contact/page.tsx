import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact us",
  description: "Contact Green Pastures Technology Group about your project.",
};

export default function ContactPage() {
  return (
    <section className="narrow">
      <h1>Contact us</h1>
      <p>
        Fill out the form below and we&apos;ll get back to you. Fields marked <em>*</em> are required.
      </p>
      <ContactForm />
    </section>
  );
}
