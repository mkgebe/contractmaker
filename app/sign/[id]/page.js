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
      setContract(sharedContracts[id] || null);
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
          <p className="small">Signatures: Provider ☐ &nbsp;&nbsp; Client ☐</p>
          <p className="contract-footer">{contract.companyProfile.companyWebsite}</p>
        </div>

        <Link href="/" className="sign-back-link">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
