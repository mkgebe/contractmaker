import Link from 'next/link';

export default function InvoicePage() {
  return (
    <main>
      <section className="card sign-wrapper">
        <p className="kicker">Invoice</p>
        <h1>Invoice workspace</h1>
        <p className="small">
          This is your invoice section. You can extend this page to generate and send invoices after contract
          signing.
        </p>

        <Link href="/" className="sign-back-link">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
