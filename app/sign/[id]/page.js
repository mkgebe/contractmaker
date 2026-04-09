'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const sharedContractsStorageKey = 'contractmaker-shared-contracts-v1';

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

    return [
      `${contract.form.agreementType} between ${contract.companyProfile.businessName} (Provider) and ${contract.form.clientName} (Client).`,
      `Client contact: ${contract.form.clientEmail} | ${contract.form.clientAddress}`,
      `Scope: ${contract.form.scope}`,
      `Deliverables: ${contract.form.deliverables}`,
      `Timeline: ${contract.form.startDate} through ${contract.form.endDate}`,
      `Compensation: ${formatMoney(Number(contract.form.price || 0))}. Payment schedule: ${contract.form.paymentSchedule}`,
      `Late fees: ${contract.form.lateFee}`,
      `Revisions: ${contract.form.revisionRounds}`,
      `Confidentiality: ${contract.form.confidentiality}`,
      `Intellectual property: ${contract.form.intellectualProperty}`,
      `Termination: ${contract.form.termination}`,
      `Dispute resolution: ${contract.form.disputeResolution}`,
      `Governing law: ${contract.form.governingLaw}`,
      `Additional terms: ${contract.form.terms}`,
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
          {contract.companyProfile.logoDataUrl ? (
            <img src={contract.companyProfile.logoDataUrl} alt="Company logo" className="logo-preview" />
          ) : null}
          <h3>
            {contract.companyProfile.businessName} × {contract.form.clientName}
          </h3>
          <p className="small compact">
            {contract.companyProfile.companyEmail} · {contract.companyProfile.companyPhone}
            <br />
            {contract.companyProfile.companyAddress}
          </p>
          {previewSections.map((section) => (
            <p key={section}>{section}</p>
          ))}

          <div className="signature-area">
            <p className="kicker">Digital Signature Section</p>
            <p className="small compact">
              Add typed legal names and signature dates for both parties to complete the contract digitally.
            </p>
            <div className="signature-grid">
              <div className="signature-card">
                <h4>Provider signature</h4>
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
                <h4>Client signature</h4>
                <div className="field">
                  <label htmlFor="clientName">Typed legal name</label>
                  <input
                    id="clientName"
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
