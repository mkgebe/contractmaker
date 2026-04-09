'use client';

import { useEffect, useMemo, useState } from 'react';

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

const defaultTemplate = {
  templateName: 'Comprehensive Services Agreement',
  agreementType: 'Service Agreement',
  clientName: 'Acme Design',
  clientEmail: 'hello@acmedesign.com',
  clientAddress: '15 Hudson Street, New York, NY 10013',
  scope:
    'Provider will deliver website redesign, 5 custom pages, SEO setup, analytics integration, and launch support.',
  deliverables: 'Design mockups, approved final files, CMS implementation, and launch checklist.',
  paymentSchedule: '50% deposit at signing, 25% at midpoint, 25% upon delivery.',
  price: '3000',
  lateFee: '1.5% monthly late fee after 7 days overdue.',
  startDate: '2026-04-15',
  endDate: '2026-05-20',
  revisionRounds: 'Two rounds of revisions included. Additional revisions billed at $95/hr.',
  confidentiality:
    'Both parties agree to protect confidential information and not disclose private project materials.',
  termination: 'Either party may terminate with 14 days written notice. Fees for completed work remain due.',
  intellectualProperty:
    'Final deliverables transfer to the Client after full payment. Provider retains rights to process materials and portfolio display.',
  governingLaw: 'State of New York',
  disputeResolution: 'Good-faith mediation followed by binding arbitration if unresolved.',
  terms: 'Client agrees to communication response times within 2 business days to avoid delivery delays.',
};

const defaultCompanyProfile = {
  businessName: 'Harbor Creative LLC',
  companyEmail: 'contracts@harborcreative.com',
  companyPhone: '(212) 555-0145',
  companyAddress: '21 Mercer Street, New York, NY 10013',
  logoDataUrl: '',
};

const statusFlow = {
  Draft: 'Sent',
  Sent: 'Signed',
  Signed: 'Signed',
};

const templateStorageKey = 'contractmaker-templates-v1';
const profileStorageKey = 'contractmaker-company-profile-v1';

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
  const [form, setForm] = useState(defaultTemplate);
  const [companyProfile, setCompanyProfile] = useState(defaultCompanyProfile);
  const [templates, setTemplates] = useState([{ id: 'default-template', ...defaultTemplate }]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('default-template');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [contracts, setContracts] = useState(starterContracts);
  const [selectedId, setSelectedId] = useState(starterContracts[0].id);
  const [banner, setBanner] = useState('Ready to craft your next contract.');
  const [shareLink, setShareLink] = useState('');

  const selectedContract = contracts.find((contract) => contract.id === selectedId);

  useEffect(() => {
    const savedTemplatesRaw = window.localStorage.getItem(templateStorageKey);
    const savedProfileRaw = window.localStorage.getItem(profileStorageKey);

    if (savedTemplatesRaw) {
      try {
        const savedTemplates = JSON.parse(savedTemplatesRaw);
        if (Array.isArray(savedTemplates) && savedTemplates.length > 0) {
          setTemplates(savedTemplates);
          setSelectedTemplateId(savedTemplates[0].id);
          setForm(savedTemplates[0]);
        }
      } catch {
        // Ignore malformed storage data.
      }
    }

    if (savedProfileRaw) {
      try {
        const savedProfile = JSON.parse(savedProfileRaw);
        setCompanyProfile((prev) => ({ ...prev, ...savedProfile }));
      } catch {
        // Ignore malformed storage data.
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(templateStorageKey, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    window.localStorage.setItem(profileStorageKey, JSON.stringify(companyProfile));
  }, [companyProfile]);

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

  const previewSections = useMemo(
    () => [
      `${form.agreementType} between ${companyProfile.businessName} (Provider) and ${form.clientName} (Client).`,
      `Client contact: ${form.clientEmail} | ${form.clientAddress}`,
      `Scope: ${form.scope}`,
      `Deliverables: ${form.deliverables}`,
      `Timeline: ${form.startDate} through ${form.endDate}`,
      `Compensation: ${formatMoney(Number(form.price || 0))}. Payment schedule: ${form.paymentSchedule}`,
      `Late fees: ${form.lateFee}`,
      `Revisions: ${form.revisionRounds}`,
      `Confidentiality: ${form.confidentiality}`,
      `Intellectual property: ${form.intellectualProperty}`,
      `Termination: ${form.termination}`,
      `Dispute resolution: ${form.disputeResolution}`,
      `Governing law: ${form.governingLaw}`,
      `Additional terms: ${form.terms}`,
    ],
    [form, companyProfile.businessName],
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateCompanyField(event) {
    const { name, value } = event.target;
    setCompanyProfile((prev) => ({ ...prev, [name]: value }));
  }

  function handleLogoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCompanyProfile((prev) => ({ ...prev, logoDataUrl: String(reader.result || '') }));
      setBanner(`Logo "${file.name}" added to your company profile.`);
    };
    reader.readAsDataURL(file);
  }

  function saveDraft() {
    setBanner(`Draft for ${form.clientName} saved at ${new Date().toLocaleTimeString()}.`);
  }

  function saveTemplate() {
    const nextName = newTemplateName.trim() || form.templateName.trim() || 'Untitled Template';
    const templateId = `tpl-${Date.now()}`;
    const newTemplate = {
      ...form,
      id: templateId,
      templateName: nextName,
    };

    setTemplates((prev) => [newTemplate, ...prev]);
    setSelectedTemplateId(templateId);
    setForm(newTemplate);
    setNewTemplateName('');
    setBanner(`Template "${nextName}" saved. You can reuse it anytime.`);
  }

  function applyTemplate(event) {
    const templateId = event.target.value;
    setSelectedTemplateId(templateId);

    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setForm(template);
    setBanner(`Template "${template.templateName}" applied.`);
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
          Build complete legal-ready templates, save reusable versions, add your brand profile, and
          track deal progress from one dashboard.
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
          <h2>Template Builder</h2>
          <p className="small">Create comprehensive contracts and save reusable templates.</p>

          <div className="field">
            <label htmlFor="templatePicker">Use saved template</label>
            <select id="templatePicker" value={selectedTemplateId} onChange={applyTemplate}>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.templateName}
                </option>
              ))}
            </select>
          </div>

          <div className="field two-col">
            <div>
              <label htmlFor="newTemplateName">New template name</label>
              <input
                id="newTemplateName"
                value={newTemplateName}
                onChange={(event) => setNewTemplateName(event.target.value)}
                placeholder="e.g. Monthly Retainer Template"
              />
            </div>
            <div className="align-end">
              <button className="secondary full-width" type="button" onClick={saveTemplate}>
                Save as template
              </button>
            </div>
          </div>

          <div className="field two-col">
            <div>
              <label htmlFor="templateName">Template title</label>
              <input
                id="templateName"
                name="templateName"
                value={form.templateName}
                onChange={updateField}
              />
            </div>
            <div>
              <label htmlFor="agreementType">Agreement type</label>
              <input
                id="agreementType"
                name="agreementType"
                value={form.agreementType}
                onChange={updateField}
              />
            </div>
          </div>

          <div className="field two-col">
            <div>
              <label htmlFor="clientName">Client legal name</label>
              <input id="clientName" name="clientName" value={form.clientName} onChange={updateField} />
            </div>
            <div>
              <label htmlFor="clientEmail">Client email</label>
              <input id="clientEmail" name="clientEmail" value={form.clientEmail} onChange={updateField} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="clientAddress">Client address</label>
            <input
              id="clientAddress"
              name="clientAddress"
              value={form.clientAddress}
              onChange={updateField}
            />
          </div>

          <div className="field">
            <label htmlFor="scope">Scope of work</label>
            <textarea id="scope" name="scope" rows="3" value={form.scope} onChange={updateField} />
          </div>

          <div className="field">
            <label htmlFor="deliverables">Deliverables</label>
            <textarea
              id="deliverables"
              name="deliverables"
              rows="3"
              value={form.deliverables}
              onChange={updateField}
            />
          </div>

          <div className="field two-col">
            <div>
              <label htmlFor="price">Contract value (USD)</label>
              <input id="price" name="price" inputMode="numeric" value={form.price} onChange={updateField} />
            </div>
            <div>
              <label htmlFor="paymentSchedule">Payment schedule</label>
              <input
                id="paymentSchedule"
                name="paymentSchedule"
                value={form.paymentSchedule}
                onChange={updateField}
              />
            </div>
          </div>

          <div className="field two-col">
            <div>
              <label htmlFor="lateFee">Late fee clause</label>
              <input id="lateFee" name="lateFee" value={form.lateFee} onChange={updateField} />
            </div>
            <div>
              <label htmlFor="revisionRounds">Revision clause</label>
              <input
                id="revisionRounds"
                name="revisionRounds"
                value={form.revisionRounds}
                onChange={updateField}
              />
            </div>
          </div>

          <div className="field two-col">
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
            <label htmlFor="confidentiality">Confidentiality</label>
            <textarea
              id="confidentiality"
              name="confidentiality"
              rows="2"
              value={form.confidentiality}
              onChange={updateField}
            />
          </div>

          <div className="field">
            <label htmlFor="intellectualProperty">Intellectual property</label>
            <textarea
              id="intellectualProperty"
              name="intellectualProperty"
              rows="2"
              value={form.intellectualProperty}
              onChange={updateField}
            />
          </div>

          <div className="field two-col">
            <div>
              <label htmlFor="termination">Termination clause</label>
              <textarea
                id="termination"
                name="termination"
                rows="2"
                value={form.termination}
                onChange={updateField}
              />
            </div>
            <div>
              <label htmlFor="disputeResolution">Dispute resolution</label>
              <textarea
                id="disputeResolution"
                name="disputeResolution"
                rows="2"
                value={form.disputeResolution}
                onChange={updateField}
              />
            </div>
          </div>

          <div className="field two-col">
            <div>
              <label htmlFor="governingLaw">Governing law</label>
              <input
                id="governingLaw"
                name="governingLaw"
                value={form.governingLaw}
                onChange={updateField}
              />
            </div>
            <div>
              <label htmlFor="terms">Additional terms</label>
              <input id="terms" name="terms" value={form.terms} onChange={updateField} />
            </div>
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
          <h2>Brand Profile & Preview</h2>

          <div className="field two-col">
            <div>
              <label htmlFor="businessName">Company name</label>
              <input
                id="businessName"
                name="businessName"
                value={companyProfile.businessName}
                onChange={updateCompanyField}
              />
            </div>
            <div>
              <label htmlFor="companyEmail">Company email</label>
              <input
                id="companyEmail"
                name="companyEmail"
                value={companyProfile.companyEmail}
                onChange={updateCompanyField}
              />
            </div>
          </div>

          <div className="field two-col">
            <div>
              <label htmlFor="companyPhone">Company phone</label>
              <input
                id="companyPhone"
                name="companyPhone"
                value={companyProfile.companyPhone}
                onChange={updateCompanyField}
              />
            </div>
            <div>
              <label htmlFor="companyLogo">Company logo</label>
              <input id="companyLogo" type="file" accept="image/*" onChange={handleLogoUpload} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="companyAddress">Company address</label>
            <input
              id="companyAddress"
              name="companyAddress"
              value={companyProfile.companyAddress}
              onChange={updateCompanyField}
            />
          </div>

          <div className="preview">
            <p className="kicker">Live Contract Preview</p>
            {companyProfile.logoDataUrl ? (
              <img src={companyProfile.logoDataUrl} alt="Company logo" className="logo-preview" />
            ) : null}
            <h3>
              {companyProfile.businessName} × {form.clientName}
            </h3>
            <p className="small compact">
              {companyProfile.companyEmail} · {companyProfile.companyPhone}
              <br />
              {companyProfile.companyAddress}
            </p>
            {previewSections.map((section) => (
              <p key={section}>{section}</p>
            ))}
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
