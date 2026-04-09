'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const checklistItems = [
  'Privacy Policy and Terms pages published',
  'Email domain authenticated (SPF, DKIM, DMARC)',
  'API rate limiting in place for signing endpoints',
  'Error monitoring and alerts configured',
  'Daily database backup scheduled',
  'Signed PDF + audit trail bundle download verified',
];

function createToken() {
  return Math.random().toString(36).slice(2, 10);
}

function createContractFromForm(form) {
  return {
    id: `CM-${Math.floor(Math.random() * 9000) + 1000}`,
    client: form.clientName,
    amount: form.price,
    status: 'Draft',
    template: { ...form },
    shareToken: null,
    shareUrl: null,
    signedAt: null,
    signerIp: null,
    signatureImage: null,
    consentAccepted: false,
    events: [{ type: 'contract_created', at: new Date().toISOString() }],
    emailsDelivered: false,
    pdfReady: false,
  };
}

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

  const [contracts, setContracts] = useState(() => [createContractFromForm(form)]);
  const [activeId, setActiveId] = useState(() => contracts?.[0]?.id ?? null);
  const [shareLink, setShareLink] = useState('');

  const [signatureMode, setSignatureMode] = useState('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [consent, setConsent] = useState(false);
  const [ipAddress, setIpAddress] = useState('203.0.113.10 (demo)');
  const [isDark, setIsDark] = useState(false);

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  const activeContract = contracts.find((item) => item.id === activeId) ?? contracts[0] ?? null;

  const summary = useMemo(() => {
    const target = activeContract?.template ?? form;
    return `This Service Agreement is between ${target.businessName} (Provider) and ${target.clientName} (Client). Provider will deliver ${target.scope} between ${target.startDate} and ${target.endDate} for ${target.price}. ${target.terms}`;
  }, [activeContract, form]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    const styles = getComputedStyle(document.documentElement);
    context.strokeStyle = styles.getPropertyValue('--foreground').trim() || '#111827';
    context.fillStyle = styles.getPropertyValue('--card').trim() || '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, [isDark]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function saveDraft() {
    if (!activeContract) return;

    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === activeContract.id
          ? {
              ...contract,
              client: form.clientName,
              amount: form.price,
              template: { ...form },
              status: 'Draft',
              events: [...contract.events, { type: 'draft_saved', at: new Date().toISOString() }],
            }
          : contract,
      ),
    );
  }

  function createNewContract() {
    const next = createContractFromForm(form);
    setContracts((prev) => [next, ...prev]);
    setActiveId(next.id);
    setShareLink('');
    setConsent(false);
    setTypedSignature('');
    clearSignatureCanvas();
  }

  function generateShareLink() {
    if (!activeContract) return;

    const token = createToken();
    const generatedLink = `https://contractmaker.app/sign/${token}`;

    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === activeContract.id
          ? {
              ...contract,
              status: 'Sent',
              shareToken: token,
              shareUrl: generatedLink,
              events: [...contract.events, { type: 'contract_sent', at: new Date().toISOString() }],
            }
          : contract,
      ),
    );
    setShareLink(generatedLink);
  }

  function clearSignatureCanvas() {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    const styles = getComputedStyle(document.documentElement);
    context.fillStyle = styles.getPropertyValue('--card').trim() || '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  function beginDraw(event) {
    if (!canvasRef.current) return;
    isDrawing.current = true;
    draw(event);
  }

  function endDraw() {
    isDrawing.current = false;
    if (!canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    context.beginPath();
  }

  function draw(event) {
    if (!isDrawing.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);
  }

  function typedSignatureToImage(value) {
    const canvas = document.createElement('canvas');
    canvas.width = 440;
    canvas.height = 120;
    const context = canvas.getContext('2d');
    const styles = getComputedStyle(document.documentElement);
    context.fillStyle = styles.getPropertyValue('--card').trim() || '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = styles.getPropertyValue('--foreground').trim() || '#111827';
    context.font = '48px cursive';
    context.fillText(value, 20, 75);
    return canvas.toDataURL('image/png');
  }

  function signAsClient() {
    if (!activeContract || !consent) {
      return;
    }

    const signatureImage =
      signatureMode === 'draw'
        ? canvasRef.current?.toDataURL('image/png')
        : typedSignatureToImage(typedSignature.trim());

    if (!signatureImage || (signatureMode === 'type' && !typedSignature.trim())) {
      return;
    }

    const signedAt = new Date().toISOString();

    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === activeContract.id
          ? {
              ...contract,
              status: 'Signed',
              signedAt,
              signerIp: ipAddress,
              signatureImage,
              consentAccepted: true,
              pdfReady: true,
              emailsDelivered: true,
              events: [
                ...contract.events,
                { type: 'contract_viewed', at: signedAt },
                { type: 'signer_consented', at: signedAt },
                { type: 'signed_by_client', at: signedAt },
                { type: 'pdf_generated', at: signedAt },
                { type: 'emails_delivered', at: signedAt },
              ],
            }
          : contract,
      ),
    );
  }

  return (
    <main>
      <header className="hero">
        <div className="hero-row">
          <h1>Service Contract & Signature Builder</h1>
          <button className="secondary" type="button" onClick={() => setIsDark((prev) => !prev)}>
            {isDark ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
        <p>
          Expanded MVP through Phase 2 and Phase 3: build contracts, generate signing links,
          capture signatures, and track audit + delivery status.
        </p>
      </header>

      <section className="grid" aria-label="Builder and preview">
        <article className="card">
          <h2>Phase 1 — Contract Builder</h2>

          <div className="field">
            <label htmlFor="businessName">Business name</label>
            <input id="businessName" name="businessName" value={form.businessName} onChange={updateField} />
          </div>

          <div className="field">
            <label htmlFor="clientName">Client name</label>
            <input id="clientName" name="clientName" value={form.clientName} onChange={updateField} />
          </div>

          <div className="field">
            <label htmlFor="scope">Scope of work</label>
            <textarea id="scope" name="scope" rows="3" value={form.scope} onChange={updateField} />
          </div>

          <div className="field field-half">
            <div>
              <label htmlFor="price">Project price</label>
              <input id="price" name="price" value={form.price} onChange={updateField} />
            </div>
            <div>
              <label htmlFor="startDate">Start date</label>
              <input id="startDate" name="startDate" type="date" value={form.startDate} onChange={updateField} />
            </div>
            <div>
              <label htmlFor="endDate">End date</label>
              <input id="endDate" name="endDate" type="date" value={form.endDate} onChange={updateField} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="terms">Payment / legal terms</label>
            <textarea id="terms" name="terms" rows="4" value={form.terms} onChange={updateField} />
          </div>

          <div className="button-row">
            <button className="secondary" type="button" onClick={createNewContract}>
              New contract
            </button>
            <button className="primary" type="button" onClick={saveDraft}>
              Save draft
            </button>
            <button className="primary" type="button" onClick={generateShareLink}>
              Generate share link
            </button>
          </div>

          {shareLink ? <p className="small">Client link: {shareLink}</p> : null}
        </article>

        <article className="card">
          <h2>Live Contract Preview</h2>
          <div className="preview">
            <p className="kicker">Service Agreement Snapshot</p>
            <h3>
              {activeContract?.template.businessName ?? form.businessName} ×{' '}
              {activeContract?.template.clientName ?? form.clientName}
            </h3>
            <p>{summary}</p>
            <p className="small">Signatures: Provider ☐ &nbsp;&nbsp; Client ☑ when completed</p>
            {activeContract?.signedAt ? (
              <p className="small">
                Signed at {activeContract.signedAt} from IP {activeContract.signerIp}
              </p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid" aria-label="Signature and status" style={{ marginTop: '1rem' }}>
        <article className="card">
          <h2>Phase 2 — Client Signature Module</h2>
          <div className="field">
            <label htmlFor="activeContract">Select contract</label>
            <select
              id="activeContract"
              value={activeContract?.id ?? ''}
              onChange={(event) => setActiveId(event.target.value)}
            >
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.id} — {contract.client}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Signature mode</label>
            <div className="button-row">
              <button
                className={signatureMode === 'draw' ? 'primary' : 'secondary'}
                type="button"
                onClick={() => setSignatureMode('draw')}
              >
                Draw
              </button>
              <button
                className={signatureMode === 'type' ? 'primary' : 'secondary'}
                type="button"
                onClick={() => setSignatureMode('type')}
              >
                Type
              </button>
            </div>
          </div>

          {signatureMode === 'draw' ? (
            <div className="field">
              <label>Draw signature</label>
              <canvas
                ref={canvasRef}
                width="440"
                height="140"
                className="signature-canvas"
                onMouseDown={beginDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
              />
              <button className="secondary" type="button" onClick={clearSignatureCanvas}>
                Clear
              </button>
            </div>
          ) : (
            <div className="field">
              <label htmlFor="typedSignature">Type signature</label>
              <input
                id="typedSignature"
                name="typedSignature"
                value={typedSignature}
                onChange={(event) => setTypedSignature(event.target.value)}
                placeholder="Jane Client"
              />
              <div className="typed-preview">{typedSignature || 'Typed signature preview'}</div>
            </div>
          )}

          <div className="field">
            <label htmlFor="ipAddress">Signer IP (captured in backend in production)</label>
            <input id="ipAddress" value={ipAddress} onChange={(event) => setIpAddress(event.target.value)} />
          </div>

          <label className="checkbox-row">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            I agree to electronic signatures and confirm I reviewed this contract.
          </label>

          <div className="button-row" style={{ marginTop: '0.75rem' }}>
            <button className="primary" type="button" onClick={signAsClient}>
              Sign as client
            </button>
          </div>
        </article>

        <article className="card">
          <h2>Phase 3 — Delivery & Audit Timeline</h2>
          <p className="small">
            Completion automatically marks PDF ready and delivery emails sent for this MVP scaffold.
          </p>

          <ul className="timeline">
            {(activeContract?.events ?? []).map((event) => (
              <li key={`${event.type}-${event.at}`}>
                <span>{event.type}</span>
                <span className="small">{event.at}</span>
              </li>
            ))}
          </ul>

          <div className="stack" style={{ marginTop: '0.5rem' }}>
            <p>
              PDF status:{' '}
              <strong>{activeContract?.pdfReady ? 'Ready for download' : 'Pending signature completion'}</strong>
            </p>
            <p>
              Email status: <strong>{activeContract?.emailsDelivered ? 'Delivered' : 'Not yet sent'}</strong>
            </p>
            {activeContract?.signatureImage ? (
              <img src={activeContract.signatureImage} alt="Captured signature" className="signature-image" />
            ) : null}
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
              <th>PDF</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr key={contract.id}>
                <td>{contract.id}</td>
                <td>{contract.client}</td>
                <td>{contract.amount}</td>
                <td>
                  <StatusPill value={contract.status} />
                </td>
                <td>{contract.pdfReady ? 'Available' : 'Pending'}</td>
                <td>{contract.emailsDelivered ? 'Sent' : 'Pending'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2>Go-live Checklist</h2>
        <ul className="checklist">
          {checklistItems.map((item) => (
            <li key={item}>
              <input type="checkbox" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
