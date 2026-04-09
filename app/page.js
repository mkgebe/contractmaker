'use client';

import { useMemo, useState } from 'react';

const starterContracts = [
  { id: 'CM-2401', client: 'Bright Lane Studio', amount: '$2,800', status: 'Draft' },
  { id: 'CM-2402', client: 'Parker & Co.', amount: '$1,200', status: 'Sent' },
  { id: 'CM-2403', client: 'Northview Agency', amount: '$4,500', status: 'Signed' },
];

function StatusPill({ value }) {
  const kind = value.toLowerCase();
  return <span className={`status ${kind}`}>{value}</span>;
}

export default function HomePage() {
  const [form, setForm] = useState({
    businessName: 'Harbor Creative LLC',
    clientName: 'Acme Design',
    scope: 'Website redesign with 5 custom pages and SEO setup.',
    price: '$3,000',
    startDate: '2026-04-15',
    endDate: '2026-05-20',
    terms:
      'Client agrees to 50% upfront and 50% at delivery. Two rounds of revisions are included. Extra revisions billed at $95/hr.',
  });

  const summary = useMemo(
    () =>
      `This Service Agreement is between ${form.businessName} (Provider) and ${form.clientName} (Client). Provider will deliver ${form.scope} between ${form.startDate} and ${form.endDate} for ${form.price}. ${form.terms}`,
    [form],
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <main>
      <header className="hero">
        <h1>Service Contract & Signature Builder</h1>
        <p>
          Starter MVP for your branded contract workflow: draft, send, and track signatures in one
          place.
        </p>
      </header>

      <section className="grid" aria-label="Builder and preview">
        <article className="card">
          <h2>Contract Builder</h2>

          <div className="field">
            <label htmlFor="businessName">Business name</label>
            <input
              id="businessName"
              name="businessName"
              value={form.businessName}
              onChange={updateField}
            />
          </div>

          <div className="field">
            <label htmlFor="clientName">Client name</label>
            <input id="clientName" name="clientName" value={form.clientName} onChange={updateField} />
          </div>

          <div className="field">
            <label htmlFor="scope">Scope of work</label>
            <textarea id="scope" name="scope" rows="3" value={form.scope} onChange={updateField} />
          </div>

          <div className="field">
            <label htmlFor="price">Project price</label>
            <input id="price" name="price" value={form.price} onChange={updateField} />
          </div>

          <div className="field">
            <label htmlFor="startDate">Start date</label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={updateField}
            />
          </div>

          <div className="field">
            <label htmlFor="endDate">End date</label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={updateField}
            />
          </div>

          <div className="field">
            <label htmlFor="terms">Payment / legal terms</label>
            <textarea id="terms" name="terms" rows="4" value={form.terms} onChange={updateField} />
          </div>

          <div className="button-row">
            <button className="primary" type="button">
              Save draft
            </button>
            <button className="secondary" type="button">
              Generate share link
            </button>
          </div>
        </article>

        <article className="card">
          <h2>Live Contract Preview</h2>
          <div className="preview">
            <p className="kicker">Service Agreement Snapshot</p>
            <h3>
              {form.businessName} × {form.clientName}
            </h3>
            <p>{summary}</p>
            <p className="small">Signatures: Provider ☐ &nbsp;&nbsp; Client ☐</p>
          </div>
        </article>
      </section>

      <section className="card" style={{ marginTop: '1rem' }} aria-label="Contracts dashboard">
        <h2>Contracts Dashboard</h2>
        <p className="small">Statuses: Draft → Sent → Signed</p>
        <table className="table">
          <thead>
            <tr>
              <th>Contract ID</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {starterContracts.map((contract) => (
              <tr key={contract.id}>
                <td>{contract.id}</td>
                <td>{contract.client}</td>
                <td>{contract.amount}</td>
                <td>
                  <StatusPill value={contract.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
