'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const sharedContractsStorageKey = 'contractmaker-shared-contracts-v1';

function decodeSharePayload(payload) {
  if (!payload || typeof window === 'undefined') {
    return null;
  }

  try {
    const binary = atob(payload);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
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
  const searchParams = useSearchParams();
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

    const sharedPayload = searchParams.get('data');
    const decodedContract = decodeSharePayload(sharedPayload);
    if (decodedContract?.id === id) {
      setContract(decodedContract);
      if (decodedContract.signatureFields) {
        setSignatureFields((prev) => ({
          ...prev,
          ...decodedContract.signatureFields,
        }));
      }
    }

    const savedSharedRaw = window.localStorage.getItem(sharedContractsStorageKey);

    if (!savedSharedRaw) {
      setLoading(false);
      return;
    }

    try {
      const sharedContracts = JSON.parse(savedSharedRaw);
      const activeContract = sharedContracts[id] || decodedContract || null;
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
  }, [id, searchParams]);

  const previewSections = useMemo(() => {
    if (!contract) {
      return [];
    }

    return [
      {
        title: 'Agreement',
        body: `${contract.form.agreementType} between ${contract.companyProfile.businessName} (Provider) and ${contract.form.clientName} (Client).`,
      },
      {
        title: 'Client contact',
        body: `${contract.form.clientEmail} | ${contract.form.clientAddress}`,
      },
      {
        title: 'Scope',
        body: contract.form.scope,
      },
      {
        title: 'Deliverables',
        body: contract.form.deliverables,
      },
      {
        title: 'Timeline',
        body: `${contract.form.startDate} through ${contract.form.endDate}`,
      },
      {
        title: 'Compensation',
        body: `${formatMoney(Number(contract.form.price || 0))}. Payment schedule: ${contract.form.paymentSchedule}`,
      },
      {
        title: 'Late fees',
        body: contract.form.lateFee,
      },
      {
        title: 'Revisions',
        body: contract.form.revisionRounds,
      },
      {
        title: 'Confidentiality',
        body: contract.form.confidentiality,
      },
      {
        title: 'Intellectual property',
        body: contract.form.intellectualProperty,
      },
      {
        title: 'Termination',
        body: contract.form.termination,
      },
      {
        title: 'Dispute resolution',
        body: contract.form.disputeResolution,
      },
      {
        title: 'Governing law',
        body: contract.form.governingLaw,
      },
      {
        title: 'Additional terms',
        body: contract.form.terms,
      },
    ];
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

  const hasProviderSignature = Boolean(signatureFields.providerName && signatureFields.providerDate);
  const hasClientSignature = Boolean(signatureFields.clientName && signatureFields.clientDate);

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
            <p key={section.title}>
              <span className="preview-title">{section.title}:</span> {section.body}
            </p>
          ))}
          <p className="small">
            Signatures: Provider {hasProviderSignature ? '☑' : '☐'} &nbsp;&nbsp; Client{' '}
            {hasClientSignature ? '☑' : '☐'}
          </p>
          {signatureFields.providerName ? (
            <p className="small compact">
              Provider: {signatureFields.providerName} ({signatureFields.providerDate || 'Date pending'})
            </p>
          ) : null}
          {signatureFields.clientName ? (
            <p className="small compact">
              Client: {signatureFields.clientName} ({signatureFields.clientDate || 'Date pending'})
            </p>
          ) : null}
          <p className="contract-footer">{contract.companyProfile.companyWebsite}</p>
        </div>

        <div className="signature-area">
          <p className="kicker">Online Signature Area</p>
          <p className="small compact">
            Enter legal names and signature dates. Data is saved automatically in this shared contract link.
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
                  placeholder={contract.companyProfile.businessName}
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
                  placeholder={contract.form.clientName}
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
