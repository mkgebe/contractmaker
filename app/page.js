'use client';

import { useEffect, useMemo, useState } from 'react';

const starterContracts = [
  {
    id: 'CM-2401',
    client: 'Bright Lane Studio',
    clientEmail: 'accounts@brightlane.studio',
    amount: 2800,
    status: 'Draft',
    dueDate: '2026-04-30',
  },
  {
    id: 'CM-2402',
    client: 'Parker & Co.',
    clientEmail: 'legal@parkerco.com',
    amount: 1200,
    status: 'Sent',
    dueDate: '2026-04-18',
  },
  {
    id: 'CM-2403',
    client: 'Northview Agency',
    clientEmail: 'approvals@northviewagency.com',
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
  customFields: [],
  sectionOrder: [],
};

const defaultCompanyProfile = {
  businessName: 'Harbor Creative LLC',
  companyEmail: 'contracts@harborcreative.com',
  companyPhone: '(212) 555-0145',
  companyAddress: '21 Mercer Street, New York, NY 10013',
  companyWebsite: 'www.harborcreative.com',
  logoDataUrl: '',
};

const statusFlow = {
  Draft: 'Sent',
  Sent: 'Signed',
  Signed: 'Signed',
};

const templateStorageKey = 'contractmaker-templates-v1';
const profileStorageKey = 'contractmaker-company-profile-v1';
const contractsStorageKey = 'contractmaker-contracts-v1';
const sharedContractsStorageKey = 'contractmaker-shared-contracts-v1';
const signedContractsStorageKey = 'contractmaker-signed-contracts-v1';
const authStorageKey = 'contractmaker-auth-v1';
const demoCredentials = {
  email: 'admin@contractmaker.app',
  password: 'ContractMaker2026',
};

function createCustomField() {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'custom',
    title: '',
    body: '',
  };
}

const defaultSectionCatalog = [
  { id: 'agreement', title: 'Agreement' },
  { id: 'clientContact', title: 'Client contact' },
  { id: 'scope', title: 'Scope' },
  { id: 'deliverables', title: 'Deliverables' },
  { id: 'timeline', title: 'Timeline' },
  { id: 'compensation', title: 'Compensation' },
  { id: 'lateFees', title: 'Late fees' },
  { id: 'revisions', title: 'Revisions' },
  { id: 'confidentiality', title: 'Confidentiality' },
  { id: 'intellectualProperty', title: 'Intellectual property' },
  { id: 'termination', title: 'Termination' },
  { id: 'disputeResolution', title: 'Dispute resolution' },
  { id: 'governingLaw', title: 'Governing law' },
  { id: 'terms', title: 'Additional terms' },
];

const defaultSectionMap = Object.fromEntries(defaultSectionCatalog.map((section) => [section.id, section]));

function getDefaultSectionOrder() {
  return defaultSectionCatalog.map((section) => ({ id: section.id, type: 'default' }));
}

function getSectionBody(sectionId, form, companyProfile) {
  switch (sectionId) {
    case 'agreement':
      return `${form.agreementType} between ${companyProfile.businessName} (Provider) and ${form.clientName} (Client).`;
    case 'clientContact':
      return `${form.clientEmail} | ${form.clientAddress}`;
    case 'scope':
      return form.scope;
    case 'deliverables':
      return form.deliverables;
    case 'timeline':
      return `${form.startDate} through ${form.endDate}`;
    case 'compensation':
      return `${formatMoney(Number(form.price || 0))}. Payment schedule: ${form.paymentSchedule}`;
    case 'lateFees':
      return form.lateFee;
    case 'revisions':
      return form.revisionRounds;
    case 'confidentiality':
      return form.confidentiality;
    case 'intellectualProperty':
      return form.intellectualProperty;
    case 'termination':
      return form.termination;
    case 'disputeResolution':
      return form.disputeResolution;
    case 'governingLaw':
      return form.governingLaw;
    case 'terms':
      return form.terms;
    default:
      return '';
  }
}

function normalizeTemplate(template) {
  const customSectionsFromLegacy = Array.isArray(template.customFields)
    ? template.customFields.map((field) => ({
        id: field.id || createCustomField().id,
        type: 'custom',
        title: field.title || '',
        body: field.body || '',
      }))
    : [];

  const defaultSections = getDefaultSectionOrder();

  if (!Array.isArray(template.sectionOrder) || template.sectionOrder.length === 0) {
    return {
      ...template,
      customFields: customSectionsFromLegacy,
      sectionOrder: [...defaultSections, ...customSectionsFromLegacy],
    };
  }

  const normalizedOrder = template.sectionOrder
    .map((section) => {
      if (section?.type === 'custom') {
        return {
          id: section.id || createCustomField().id,
          type: 'custom',
          title: section.title || '',
          body: section.body || '',
        };
      }

      if (section?.type === 'default' && defaultSectionMap[section.id]) {
        return { id: section.id, type: 'default' };
      }

      return null;
    })
    .filter(Boolean);

  const hasDefaultSection = normalizedOrder.some((section) => section.type === 'default');
  return {
    ...template,
    customFields: normalizedOrder.filter((section) => section.type === 'custom'),
    sectionOrder: hasDefaultSection ? normalizedOrder : [...defaultSections, ...normalizedOrder],
  };
}

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
  const [form, setForm] = useState(normalizeTemplate(defaultTemplate));
  const [companyProfile, setCompanyProfile] = useState(defaultCompanyProfile);
  const [templates, setTemplates] = useState([
    { id: 'default-template', ...normalizeTemplate(defaultTemplate) },
  ]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('default-template');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [contracts, setContracts] = useState(starterContracts);
  const [signedContracts, setSignedContracts] = useState([]);
  const [selectedId, setSelectedId] = useState(starterContracts[0].id);
  const [activeTab, setActiveTab] = useState('contracts');
  const [banner, setBanner] = useState('Ready to craft your next contract.');
  const [shareLink, setShareLink] = useState('');
  const [defaultSectionToAdd, setDefaultSectionToAdd] = useState(defaultSectionCatalog[0].id);
  const [draggingSectionId, setDraggingSectionId] = useState('');
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [signatureFields, setSignatureFields] = useState({
    providerName: '',
    providerDate: '',
    clientName: '',
    clientDate: '',
  });

  const selectedContract = contracts.find((contract) => contract.id === selectedId);

  useEffect(() => {
    const savedAuthRaw = window.localStorage.getItem(authStorageKey);
    const savedTemplatesRaw = window.localStorage.getItem(templateStorageKey);
    const savedProfileRaw = window.localStorage.getItem(profileStorageKey);
    const savedContractsRaw = window.localStorage.getItem(contractsStorageKey);
    const savedSignedContractsRaw = window.localStorage.getItem(signedContractsStorageKey);

    if (savedAuthRaw) {
      try {
        const savedAuth = JSON.parse(savedAuthRaw);
        setIsAuthenticated(Boolean(savedAuth?.isAuthenticated));
      } catch {
        // Ignore malformed storage data.
      }
    }

    if (savedTemplatesRaw) {
      try {
        const savedTemplates = JSON.parse(savedTemplatesRaw);
        if (Array.isArray(savedTemplates) && savedTemplates.length > 0) {
          const normalizedTemplates = savedTemplates.map(normalizeTemplate);
          setTemplates(normalizedTemplates);
          setSelectedTemplateId(normalizedTemplates[0].id);
          setForm(normalizedTemplates[0]);
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

    if (savedContractsRaw) {
      try {
        const savedContracts = JSON.parse(savedContractsRaw);
        if (Array.isArray(savedContracts) && savedContracts.length > 0) {
          setContracts(savedContracts);
          setSelectedId(savedContracts[0].id);
        }
      } catch {
        // Ignore malformed storage data.
      }
    }

    if (savedSignedContractsRaw) {
      try {
        const signedArchive = JSON.parse(savedSignedContractsRaw);
        if (Array.isArray(signedArchive)) {
          setSignedContracts(signedArchive);
        }
      } catch {
        // Ignore malformed storage data.
      }
    }

    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      return;
    }
    window.localStorage.setItem(templateStorageKey, JSON.stringify(templates));
  }, [authReady, isAuthenticated, templates]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      return;
    }
    window.localStorage.setItem(profileStorageKey, JSON.stringify(companyProfile));
  }, [authReady, companyProfile, isAuthenticated]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      return;
    }
    window.localStorage.setItem(contractsStorageKey, JSON.stringify(contracts));
  }, [authReady, contracts, isAuthenticated]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      return;
    }
    window.localStorage.setItem(signedContractsStorageKey, JSON.stringify(signedContracts));
  }, [authReady, isAuthenticated, signedContracts]);

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

  const previewSections = useMemo(() => {
    const sections = Array.isArray(form.sectionOrder) ? form.sectionOrder : getDefaultSectionOrder();
    return sections
      .map((section) => {
        if (section.type === 'default') {
          const definition = defaultSectionMap[section.id];
          if (!definition) {
            return null;
          }
          return {
            id: section.id,
            title: definition.title,
            body: getSectionBody(section.id, form, companyProfile).trim(),
          };
        }

        if (section.type === 'custom') {
          return {
            id: section.id,
            title: (section.title || '').trim() || 'Custom field',
            body: (section.body || '').trim(),
          };
        }

        return null;
      })
      .filter((section) => section && section.body);
  }, [form, companyProfile]);

  const availableDefaultSections = useMemo(() => {
    const activeDefaultIds = new Set(
      (Array.isArray(form.sectionOrder) ? form.sectionOrder : [])
        .filter((section) => section.type === 'default')
        .map((section) => section.id),
    );
    return defaultSectionCatalog.filter((section) => !activeDefaultIds.has(section.id));
  }, [form.sectionOrder]);

  useEffect(() => {
    if (availableDefaultSections.length === 0) {
      setDefaultSectionToAdd('');
      return;
    }

    if (!availableDefaultSections.some((section) => section.id === defaultSectionToAdd)) {
      setDefaultSectionToAdd(availableDefaultSections[0].id);
    }
  }, [availableDefaultSections, defaultSectionToAdd]);

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
    const newTemplate = normalizeTemplate({
      ...form,
      id: templateId,
      templateName: nextName,
      customFields: (form.sectionOrder || []).filter((section) => section.type === 'custom'),
    });

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

    setForm(normalizeTemplate(template));
    setBanner(`Template "${template.templateName}" applied.`);
  }

  function addCustomField() {
    setForm((prev) => ({
      ...prev,
      sectionOrder: [...(Array.isArray(prev.sectionOrder) ? prev.sectionOrder : []), createCustomField()],
    }));
  }

  function updateCustomField(fieldId, key, value) {
    setForm((prev) => ({
      ...prev,
      sectionOrder: (Array.isArray(prev.sectionOrder) ? prev.sectionOrder : []).map((field) =>
        field.id === fieldId ? { ...field, [key]: value } : field,
      ),
    }));
  }

  function removeSection(fieldId) {
    setForm((prev) => ({
      ...prev,
      sectionOrder: (Array.isArray(prev.sectionOrder) ? prev.sectionOrder : []).filter(
        (field) => field.id !== fieldId,
      ),
    }));
  }

  function addDefaultSection() {
    if (!defaultSectionToAdd) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      sectionOrder: [
        ...(Array.isArray(prev.sectionOrder) ? prev.sectionOrder : []),
        { id: defaultSectionToAdd, type: 'default' },
      ],
    }));
    setBanner(`${defaultSectionMap[defaultSectionToAdd].title} added to the contract.`);
  }

  function moveSection(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }

    setForm((prev) => {
      const sections = Array.isArray(prev.sectionOrder) ? [...prev.sectionOrder] : [];
      const sourceIndex = sections.findIndex((section) => section.id === sourceId);
      const targetIndex = sections.findIndex((section) => section.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) {
        return prev;
      }
      const [moved] = sections.splice(sourceIndex, 1);
      sections.splice(targetIndex, 0, moved);
      return { ...prev, sectionOrder: sections };
    });
  }

  function moveSectionByStep(sectionId, step) {
    setForm((prev) => {
      const sections = Array.isArray(prev.sectionOrder) ? [...prev.sectionOrder] : [];
      const sourceIndex = sections.findIndex((section) => section.id === sectionId);
      const nextIndex = sourceIndex + step;
      if (sourceIndex < 0 || nextIndex < 0 || nextIndex >= sections.length) {
        return prev;
      }
      const [moved] = sections.splice(sourceIndex, 1);
      sections.splice(nextIndex, 0, moved);
      return { ...prev, sectionOrder: sections };
    });
  }

  function generateShareLink() {
    const slug = form.clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const signId = `${slug}-${Date.now().toString().slice(-6)}`;
    const nextLink = `${window.location.origin}/sign/${signId}`;

    const savedSharedRaw = window.localStorage.getItem(sharedContractsStorageKey);
    let sharedContracts = {};

    if (savedSharedRaw) {
      try {
        sharedContracts = JSON.parse(savedSharedRaw);
      } catch {
        // Ignore malformed storage data.
      }
    }

    sharedContracts[signId] = {
      id: signId,
      contractId: null,
      form,
      companyProfile,
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem(sharedContractsStorageKey, JSON.stringify(sharedContracts));
    setShareLink(nextLink);
    setBanner('Secure share link generated. Ready to send.');
  }

  function createContract() {
    const nextId = `CM-${2400 + contracts.length + 1}`;
    const slug = form.clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const signId = `${slug}-${Date.now().toString().slice(-6)}`;
    const nextContract = {
      id: nextId,
      client: form.clientName,
      clientEmail: form.clientEmail,
      amount: Number(form.price || 0),
      status: 'Draft',
      dueDate: form.endDate,
    };

    setContracts((prev) => [nextContract, ...prev]);
    setSelectedId(nextId);
    setShareLink(`${window.location.origin}/sign/${signId}`);

    const savedSharedRaw = window.localStorage.getItem(sharedContractsStorageKey);
    let sharedContracts = {};

    if (savedSharedRaw) {
      try {
        sharedContracts = JSON.parse(savedSharedRaw);
      } catch {
        // Ignore malformed storage data.
      }
    }

    sharedContracts[signId] = {
      id: signId,
      contractId: nextId,
      form,
      companyProfile,
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem(sharedContractsStorageKey, JSON.stringify(sharedContracts));
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

  function saveSignedContracts() {
    const completedContracts = contracts.filter((contract) => contract.status === 'Signed');
    if (completedContracts.length === 0) {
      setBanner('No signed contracts yet. Move one to Signed first.');
      return;
    }

    const archiveById = new Map(signedContracts.map((contract) => [contract.id, contract]));
    completedContracts.forEach((contract) => {
      if (!archiveById.has(contract.id)) {
        archiveById.set(contract.id, { ...contract, archivedAt: new Date().toISOString() });
      }
    });

    const nextArchive = Array.from(archiveById.values()).sort((a, b) => a.id.localeCompare(b.id));
    setSignedContracts(nextArchive);
    setActiveTab('signed');
    setBanner(`${completedContracts.length} signed contract(s) saved in your archive.`);
  }

  function sendSignedContractEmail(contract) {
    if (!contract.clientEmail) {
      setBanner(`No signer email found for ${contract.client}.`);
      return;
    }

    const subject = encodeURIComponent(`Signed contract ${contract.id} from ${companyProfile.businessName}`);
    const body = encodeURIComponent(
      `Hi ${contract.client},\n\nAttached is the signed contract ${contract.id} totaling ${formatMoney(contract.amount)}.\n\nThanks,\n${companyProfile.businessName}\n${companyProfile.companyEmail}`,
    );
    window.location.href = `mailto:${contract.clientEmail}?subject=${subject}&body=${body}`;
    setBanner(`Prepared email draft for ${contract.client}.`);
  }

  function sendAllSignedContracts() {
    if (signedContracts.length === 0) {
      setBanner('No archived signed contracts to email yet.');
      return;
    }

    const recipients = signedContracts.map((contract) => contract.clientEmail).filter(Boolean);
    if (recipients.length === 0) {
      setBanner('No signer email addresses are available for archived contracts.');
      return;
    }

    const subject = encodeURIComponent(`Signed contracts from ${companyProfile.businessName}`);
    const body = encodeURIComponent(
      `Hello,\n\nSharing signed contracts from our records:\n${signedContracts
        .map((contract) => `• ${contract.id} — ${contract.client} — ${formatMoney(contract.amount)}`)
        .join('\n')}\n\nBest,\n${companyProfile.businessName}\n${companyProfile.companyEmail}`,
    );
    window.location.href = `mailto:${recipients.join(',')}?subject=${subject}&body=${body}`;
    setBanner(`Prepared a bulk email draft for ${recipients.length} signer(s).`);
  }

  function updateLoginField(event) {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleLogin(event) {
    event.preventDefault();
    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;

    if (email === demoCredentials.email && password === demoCredentials.password) {
      setIsAuthenticated(true);
      setLoginError('');
      setLoginForm({ email: '', password: '' });
      window.localStorage.setItem(authStorageKey, JSON.stringify({ isAuthenticated: true }));
      return;
    }

    setLoginError('Incorrect email or password. Try the demo credentials shown below.');
  }

  function logout() {
    setIsAuthenticated(false);
    setLoginError('');
    setShareLink('');
    window.localStorage.removeItem(authStorageKey);
  }

  function updateSignatureField(event) {
    const { name, value } = event.target;
    setSignatureFields((prev) => ({ ...prev, [name]: value }));
  }

  if (!authReady) {
    return (
      <main className="auth-main">
        <section className="card auth-card">
          <h1>Loading Contractmaker…</h1>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="auth-main">
        <section className="card auth-card">
          <p className="eyebrow">Contractmaker Platform</p>
          <h1>Login required</h1>
          <p className="small">
            Sign in before accessing the contract builder and dashboard.
          </p>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="loginEmail">Email</label>
              <input
                id="loginEmail"
                name="email"
                type="email"
                autoComplete="username"
                value={loginForm.email}
                onChange={updateLoginField}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="loginPassword">Password</label>
              <input
                id="loginPassword"
                name="password"
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={updateLoginField}
                required
              />
            </div>
            <button className="primary full-width" type="submit">
              Login
            </button>
          </form>

          {loginError ? <p className="auth-error">{loginError}</p> : null}

          <div className="notice auth-help">
            <strong>Demo credentials</strong>
            <p className="small compact">
              Email: {demoCredentials.email}
              <br />
              Password: {demoCredentials.password}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <header className="hero">
        <div className="hero-top">
          <p className="eyebrow">Contractmaker Platform</p>
          <button className="ghost" type="button" onClick={logout}>
            Logout
          </button>
        </div>
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

          <div className="field section-editor-wrapper">
            <button
              className="ghost section-editor-toggle"
              type="button"
              onClick={() => setShowSectionEditor((prev) => !prev)}
            >
              {showSectionEditor ? 'Hide section editor' : 'Customize contract section order'}
            </button>

            {showSectionEditor ? (
              <div className="section-editor-panel">
                <p className="small">
                  Drag sections to place them anywhere in the contract. You can remove built-in sections and add them
                  back later.
                </p>
                <div className="section-add-controls">
                  <button className="ghost" type="button" onClick={addCustomField}>
                    Add custom field
                  </button>
                  <div className="section-add-default">
                    <select
                      value={defaultSectionToAdd}
                      onChange={(event) => setDefaultSectionToAdd(event.target.value)}
                      disabled={availableDefaultSections.length === 0}
                    >
                      {availableDefaultSections.length > 0 ? (
                        availableDefaultSections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.title}
                          </option>
                        ))
                      ) : (
                        <option value="">All built-in sections are already included</option>
                      )}
                    </select>
                    <button
                      className="ghost"
                      type="button"
                      onClick={addDefaultSection}
                      disabled={availableDefaultSections.length === 0}
                    >
                      Add built-in field
                    </button>
                  </div>
                </div>
                {Array.isArray(form.sectionOrder) && form.sectionOrder.length > 0 ? (
                  <div className="custom-fields-list">
                    {form.sectionOrder.map((section, index) => (
                      <div
                        key={section.id}
                        className="custom-field-card"
                        draggable
                        onDragStart={() => setDraggingSectionId(section.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          moveSection(draggingSectionId, section.id);
                          setDraggingSectionId('');
                        }}
                        onDragEnd={() => setDraggingSectionId('')}
                      >
                        <div className="section-card-head">
                          <p className="kicker">Position #{index + 1}</p>
                          <div className="section-actions">
                            <button className="ghost" type="button" onClick={() => moveSectionByStep(section.id, -1)}>
                              ↑
                            </button>
                            <button className="ghost" type="button" onClick={() => moveSectionByStep(section.id, 1)}>
                              ↓
                            </button>
                            <button className="ghost" type="button" onClick={() => removeSection(section.id)}>
                              Remove
                            </button>
                          </div>
                        </div>

                        {section.type === 'default' ? (
                          <p className="small section-default-name">{defaultSectionMap[section.id]?.title || section.id}</p>
                        ) : (
                          <>
                            <div className="field">
                              <label htmlFor={`customTitle-${section.id}`}>Field title</label>
                              <input
                                id={`customTitle-${section.id}`}
                                value={section.title}
                                onChange={(event) => updateCustomField(section.id, 'title', event.target.value)}
                                placeholder="e.g. Non-solicitation"
                              />
                            </div>
                            <div className="field">
                              <label htmlFor={`customBody-${section.id}`}>Field details</label>
                              <textarea
                                id={`customBody-${section.id}`}
                                rows="2"
                                value={section.body}
                                onChange={(event) => updateCustomField(section.id, 'body', event.target.value)}
                                placeholder="Describe this contract clause."
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="small">No sections in this contract. Add a built-in field or a custom field.</p>
                )}
              </div>
            ) : null}
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

          <div className="field two-col">
            <div>
              <label htmlFor="companyAddress">Company address</label>
              <input
                id="companyAddress"
                name="companyAddress"
                value={companyProfile.companyAddress}
                onChange={updateCompanyField}
              />
            </div>
            <div>
              <label htmlFor="companyWebsite">Company website</label>
              <input
                id="companyWebsite"
                name="companyWebsite"
                value={companyProfile.companyWebsite}
                onChange={updateCompanyField}
                placeholder="www.yourcompany.com"
              />
            </div>
          </div>

          <div className="preview">
            <p className="kicker">Live Contract Preview</p>
            <div className="preview-head">
              <div>
                <h3>
                  {companyProfile.businessName} × {form.clientName}
                </h3>
                <p className="small compact">
                  {companyProfile.companyEmail} · {companyProfile.companyPhone}
                  <br />
                  {companyProfile.companyAddress}
                </p>
              </div>
              {companyProfile.logoDataUrl ? (
                <img src={companyProfile.logoDataUrl} alt="Company logo" className="logo-preview right" />
              ) : null}
            </div>
            {previewSections.map((section) => (
              <p key={section.id}>
                <span className="preview-title">{section.title}:</span> {section.body}
              </p>
            ))}
            <div className="signature-area">
              <p className="kicker">Online Signature Area</p>
              <p className="small compact">
                Client and Document Owner can type their legal names and signature dates below.
              </p>
              <div className="signature-grid">
                <div className="signature-card">
                  <h4>Document Owner (Provider)</h4>
                  <div className="field">
                    <label htmlFor="providerName">Typed legal name</label>
                    <input
                      id="providerName"
                      name="providerName"
                      value={signatureFields.providerName}
                      onChange={updateSignatureField}
                      placeholder={companyProfile.businessName}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="providerDate">Signature date</label>
                    <input
                      id="providerDate"
                      name="providerDate"
                      type="date"
                      value={signatureFields.providerDate}
                      onChange={updateSignatureField}
                    />
                  </div>
                </div>

                <div className="signature-card">
                  <h4>Client</h4>
                  <div className="field">
                    <label htmlFor="clientSignName">Typed legal name</label>
                    <input
                      id="clientSignName"
                      name="clientName"
                      value={signatureFields.clientName}
                      onChange={updateSignatureField}
                      placeholder={form.clientName}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="clientDate">Signature date</label>
                    <input
                      id="clientDate"
                      name="clientDate"
                      type="date"
                      value={signatureFields.clientDate}
                      onChange={updateSignatureField}
                    />
                  </div>
                </div>
              </div>
            </div>
            <p className="contract-footer">{companyProfile.companyWebsite}</p>
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
        <div className="dashboard-tabs" role="tablist" aria-label="Dashboard tabs">
          <button
            className={`tab-button ${activeTab === 'contracts' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('contracts')}
            role="tab"
            aria-selected={activeTab === 'contracts'}
          >
            Contracts
          </button>
          <button
            className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('templates')}
            role="tab"
            aria-selected={activeTab === 'templates'}
          >
            Saved templates
          </button>
          <button
            className={`tab-button ${activeTab === 'signed' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('signed')}
            role="tab"
            aria-selected={activeTab === 'signed'}
          >
            Signed contracts
          </button>
        </div>

        {activeTab === 'contracts' ? (
          <>
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
          </>
        ) : null}

        {activeTab === 'templates' ? (
          <div className="tab-panel">
            <div className="dashboard-head">
              <div>
                <h2>Saved templates</h2>
                <p className="small">Quickly reuse previously saved contract templates.</p>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Template name</th>
                  <th>Agreement type</th>
                  <th>Client</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td>{template.templateName}</td>
                    <td>{template.agreementType}</td>
                    <td>{template.clientName}</td>
                    <td>{formatMoney(Number(template.price || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {activeTab === 'signed' ? (
          <div className="tab-panel">
            <div className="dashboard-head">
              <div>
                <h2>Signed contracts archive</h2>
                <p className="small">
                  Save all signed contracts and prepare emails to contract signers in one place.
                </p>
              </div>
              <div className="button-row compact">
                <button className="secondary" type="button" onClick={saveSignedContracts}>
                  Save all signed contracts
                </button>
                <button className="primary" type="button" onClick={sendAllSignedContracts}>
                  Email all signers
                </button>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Contract ID</th>
                  <th>Signer</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {signedContracts.length ? (
                  signedContracts.map((contract) => (
                    <tr key={contract.id}>
                      <td>{contract.id}</td>
                      <td>{contract.client}</td>
                      <td>{contract.clientEmail || '—'}</td>
                      <td>{formatMoney(contract.amount)}</td>
                      <td>
                        <button
                          className="ghost"
                          type="button"
                          onClick={() => sendSignedContractEmail(contract)}
                        >
                          Send email
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="small">
                      No archived signed contracts yet. Save signed contracts to populate this tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
