'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const sharedContractsStorageKey = 'contractmaker-shared-contracts-v1';

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

function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SignPage() {
  const params = useParams();
  const id = params?.id;
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signatureFields, setSignatureFields] = useState({
    providerName: '',
    providerDate: '',
    clientName: '',
    clientDate: '',
  });

  useEffect(() => {
    if (!id || typeof id !== 'string') {
      setContract(null);
      setLoading(false);
      return;
    }

    const savedSharedRaw = window.localStorage.getItem(sharedContractsStorageKey);

    if (!savedSharedRaw) {
      setLoading(false);
      return;
    }

    try {
      const sharedContracts = JSON.parse(savedSharedRaw);
      const activeContract = sharedContracts[id] || null;
      setContract(activeContract);

      if (activeContract?.signatureFields) {
        setSignatureFields((prev) => ({
          ...prev,
          ...activeContract.signatureFields,
        }));
      }
    } catch {
      setContract(null);
    }

    setLoading(false);
  }, [id]);

  const previewSections = useMemo(() => {
    if (!contract) {
      return [];
    }

    const legacyCustomSections = Array.isArray(contract.form.customFields)
      ? contract.form.customFields.map((field) => ({
          id: field.id,
          type: 'custom',
          title: field.title || '',
          body: field.body || '',
        }))
      : [];

    const sections =
      Array.isArray(contract.form.sectionOrder) && contract.form.sectionOrder.length > 0
        ? contract.form.sectionOrder
        : [...getDefaultSectionOrder(), ...legacyCustomSections];

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
            body: getSectionBody(section.id, contract.form, contract.companyProfile).trim(),
          };
        }

        return {
          id: section.id,
          title: (section.title || '').trim() || 'Custom field',
          body: (section.body || '').trim(),
        };
      })
      .filter((section) => section && section.body);
  }, [contract]);

  const updateSignatureField = (event) => {
    const { name, value } = event.target;

    setSignatureFields((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (id && typeof window !== 'undefined') {
        const savedSharedRaw = window.localStorage.getItem(sharedContractsStorageKey);

        if (savedSharedRaw) {
          try {
            const sharedContracts = JSON.parse(savedSharedRaw);
            if (sharedContracts[id]) {
              sharedContracts[id] = {
                ...sharedContracts[id],
                signatureFields: next,
              };
              window.localStorage.setItem(sharedContractsStorageKey, JSON.stringify(sharedContracts));
            }
          } catch {
            // No-op: keep signature data in-memory if parsing fails.
          }
        }
      }

      return next;
    });
  };

  const downloadPdf = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.print();
  };

  if (loading) {
    return (
      <main>
        <section className="card sign-wrapper">
          <p>Loading contract…</p>
        </section>
      </main>
    );
  }

  if (!contract) {
    return (
      <main>
        <section className="card sign-wrapper">
          <h1>Contract not found</h1>
          <p className="small">
            This share link is invalid, expired, or was created on a different browser/device.
          </p>
          <Link href="/" className="sign-back-link">
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="card sign-wrapper">
        <p className="kicker">Review & sign</p>
        <h1>{contract.form.templateName}</h1>
        <p className="small">
          {contract.contractId ? `Contract ID: ${contract.contractId} · ` : ''}
          Created {new Date(contract.createdAt).toLocaleString()}
        </p>

        <div className="button-row sign-actions">
          <button type="button" className="primary" onClick={downloadPdf}>
            Download PDF
          </button>
        </div>

        <div className="preview sign-preview">
          <div className="preview-head">
            <div>
              <h3>
                {contract.companyProfile.businessName} × {contract.form.clientName}
              </h3>
              <p className="small compact">
                {contract.companyProfile.companyEmail} · {contract.companyProfile.companyPhone}
                <br />
                {contract.companyProfile.companyAddress}
              </p>
            </div>
            {contract.companyProfile.logoDataUrl ? (
              <img src={contract.companyProfile.logoDataUrl} alt="Company logo" className="logo-preview right" />
            ) : null}
          </div>
          {previewSections.map((section) => (
            <p key={section.id}>
              <span className="preview-title">{section.title}:</span> {section.body}
            </p>
          ))}
          <p className="small">Signatures: Provider ☐ &nbsp;&nbsp; Client ☐</p>
          <p className="contract-footer">{contract.companyProfile.companyWebsite}</p>
        </div>

        <Link href="/" className="sign-back-link">
          Back to dashboard
        </Link>

        <Link href="/invoice" className="invoice-link-button">
          Go to Invoice
        </Link>
      </section>
    </main>
  );
}
