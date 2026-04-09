'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const sharedContractsStorageKey = 'contractmaker-shared-contracts-v1';

function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SignPage({ params }) {
  const { id } = params;
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          <p className="small">Signatures: Provider ☐ &nbsp;&nbsp; Client ☐</p>
        </div>

        <Link href="/" className="sign-back-link">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
