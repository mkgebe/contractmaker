'use client';

import { useMemo, useState } from 'react';

const starterContracts = [
  {
    id: 'CM-2401',
    client: 'Bright Lane Studio',
    amount: 2800,
    status: 'Draft',
    dueDate: '2026-04-30',
  },
  {
    id: 'CM-2402',
    client: 'Parker & Co.',
    amount: 1200,
    status: 'Sent',
    dueDate: '2026-04-18',
  },
  {
    id: 'CM-2403',
    client: 'Northview Agency',
    amount: 4500,
    status: 'Signed',
    dueDate: '2026-04-26',
  },
];

const statusFlow = {
  Draft: 'Sent',
  Sent: 'Signed',
  Signed: 'Signed',
};

function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatusPill({ value }) {
  return <span className={`status ${value.toLowerCase()}`}>{value}</span>;
}

export default function HomePage() {
  const [form, setForm] = useState({
    businessName: 'Harbor Creative LLC',
    clientName: 'Acme Design',
    scope: 'Website redesign with 5 custom pages and SEO setup.',
    price: '3000',
    startDate: '2026-04-15',
    endDate: '2026-05-20',
    terms:
      'Client agrees to 50% upfront and 50% at delivery. Two rounds of revisions are included. Extra revisions billed at $95/hr.',
  });

  const [contracts, setContracts] = useState(starterContracts);
  const [selectedId, setSelectedId] = useState(starterContracts[0].id);
  const [banner, setBanner] = useState('Ready to craft your next contract.');
  const [shareLink, setShareLink] = useState('');

  const selectedContract = contracts.find((contract) => contract.id === selectedId);

  const stats = useMemo(() => {
    const signedTotal = contracts
      .filter((item) => item.status === 'Signed')
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      total: contracts.length,
      draft: contracts.filter((item) => item.status === 'Draft').length,
      pending: contracts.filter((item) => item.status === 'Sent').length,
      signedValue: formatMoney(signedTotal),
    };
  }, [contracts]);

  const previewSummary = useMemo(
    () =>
      `This Service Agreement is between ${form.businessName} (Provider) and ${form.clientName} (Client). Provider will deliver ${form.scope} between ${form.startDate} and ${form.endDate} for ${formatMoney(Number(form.price || 0))}. ${form.terms}`,
    [form],
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function saveDraft() {
    setBanner(`Draft for ${form.clientName} saved at ${new Date().toLocaleTimeString()}.`);
  }

  function generateShareLink() {
    const slug = form.clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const nextLink = `https://contractmaker-xi.vercel.app/sign/${slug}-${Date.now().toString().slice(-6)}`;
    setShareLink(nextLink);
    setBanner('Secure share link generated. Ready to send.');
  }

  function createContract() {
    const nextId = `CM-${2400 + contracts.length + 1}`;
    const nextContract = {
      id: nextId,
      client: form.clientName,
      amount: Number(form.price || 0),
      status: 'Draft',
      dueDate: form.endDate,
    };

    setContracts((prev) => [nextContract, ...prev]);
    setSelectedId(nextId);
    setBanner(`New contract ${nextId} created for ${form.clientName}.`);
  }

  function progressStatus() {
    if (!selectedContract) {
      return;
    }

    const nextStatus = statusFlow[selectedContract.status];
    setContracts((prev) =>
      prev.map((item) => (item.id === selectedContract.id ? { ...item, status: nextStatus } : item)),
    );

    setBanner(`${selectedContract.id} moved to ${nextStatus}.`);
  }

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Contractmaker Platform</p>
        <h1>Design-forward contracts, generated in minutes.</h1>
        <p>
          Build polished service agreements, share secure signature links, and track deal progress
          from one dashboard.
        </p>
      </header>

      <section className="stats" aria-label="Contract performance">
        <article className="card stat-card">
          <p>Total contracts</p>
          <h3>{stats.total}</h3>
        </article>
        <article className="card stat-card">
          <p>Drafts</p>
          <h3>{stats.draft}</h3>
        </article>
        <article className="card stat-card">
          <p>Pending signatures</p>
          <h3>{stats.pending}</h3>
        </article>
        <article className="card stat-card highlight">
          <p>Signed value</p>
          <h3>{stats.signedValue}</h3>
        </article>
      </section>

      <section className="grid" aria-label="Builder and preview">
        <article className="card">
          <h2>Contract Builder</h2>
          <p className="small">Craft the agreement and instantly preview the final language.</p>

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

          <div className="field two-col">
            <div>
              <label htmlFor="price">Project fee (USD)</label>
              <input
                id="price"
                name="price"
                inputMode="numeric"
                value={form.price}
                onChange={updateField}
              />
            </div>
            <div>
              <label htmlFor="endDate">Delivery date</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={updateField}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="startDate">Kickoff date</label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={updateField}
            />
          </div>

          <div className="field">
            <label htmlFor="terms">Payment / legal terms</label>
            <textarea id="terms" name="terms" rows="4" value={form.terms} onChange={updateField} />
          </div>

          <div className="button-row">
            <button className="primary" type="button" onClick={saveDraft}>
              Save draft
            </button>
            <button className="secondary" type="button" onClick={generateShareLink}>
              Generate share link
            </button>
          </div>

          <div className="button-row compact">
            <button className="ghost" type="button" onClick={createContract}>
              Add to dashboard
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
            <p>{previewSummary}</p>
            <p className="small">Signatures: Provider ☐ &nbsp;&nbsp; Client ☐</p>
          </div>

          <div className="notice" role="status">
            <strong>Status:</strong> {banner}
          </div>

          {shareLink ? (
            <div className="share-box">
              <p className="small">Share link</p>
              <a href={shareLink}>{shareLink}</a>
            </div>
          ) : null}
        </article>
      </section>

      <section className="card dashboard" aria-label="Contracts dashboard">
        <div className="dashboard-head">
          <div>
            <h2>Contracts Dashboard</h2>
            <p className="small">Move selected contracts from Draft → Sent → Signed in one click.</p>
          </div>
          <button className="primary" type="button" onClick={progressStatus}>
            Advance selected status
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th aria-label="Select contract" />
              <th>Contract ID</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Due date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr key={contract.id} className={selectedId === contract.id ? 'active-row' : ''}>
                <td>
                  <input
                    type="radio"
                    name="selectedContract"
                    checked={selectedId === contract.id}
                    onChange={() => setSelectedId(contract.id)}
                    aria-label={`Select ${contract.id}`}
                  />
                </td>
                <td>{contract.id}</td>
                <td>{contract.client}</td>
                <td>{formatMoney(contract.amount)}</td>
                <td>{contract.dueDate}</td>
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
