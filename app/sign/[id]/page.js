'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

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
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signatureDate, setSignatureDate] = useState('');

  const canvasRef = useRef(null);
  const signatureSectionRef = useRef(null);
  const isDrawingRef = useRef(false);

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

      const existingSignature = activeContract?.clientSignature;
      if (existingSignature) {
        setSignerName(existingSignature.name || '');
        setSignatureDate(existingSignature.signedAt || '');
        setShowSignatureCanvas(true);
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

  useEffect(() => {
    if (!showSignatureCanvas) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');

    const setCanvasSize = () => {
      const ratio = window.devicePixelRatio || 1;
      const bounds = canvas.getBoundingClientRect();
      canvas.width = Math.floor(bounds.width * ratio);
      canvas.height = Math.floor(bounds.height * ratio);
      context.scale(ratio, ratio);
      context.lineJoin = 'round';
      context.lineCap = 'round';
      context.strokeStyle = '#0f172a';
      context.lineWidth = 2.5;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, [showSignatureCanvas]);

  const getCanvasPosition = (event) => {
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  };

  const startDrawing = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    const { x, y } = getCanvasPosition(event);

    isDrawingRef.current = true;
    context.beginPath();
    context.moveTo(x, y);
  };

  const drawSignature = (event) => {
    if (!isDrawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    const { x, y } = getCanvasPosition(event);

    context.lineTo(x, y);
    context.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const openSignatureCanvas = () => {
    setShowSignatureCanvas(true);

    window.requestAnimationFrame(() => {
      signatureSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const saveClientSignature = () => {
    const canvas = canvasRef.current;

    if (!signerName.trim() || !hasDrawn || !canvas || !id) {
      return;
    }

    const signedAt = new Date().toISOString();
    setSignatureDate(signedAt);

    const savedSharedRaw = window.localStorage.getItem(sharedContractsStorageKey);
    if (!savedSharedRaw) {
      return;
    }

    try {
      const sharedContracts = JSON.parse(savedSharedRaw);
      if (!sharedContracts[id]) {
        return;
      }

      sharedContracts[id] = {
        ...sharedContracts[id],
        clientSignature: {
          name: signerName.trim(),
          signedAt,
          imageDataUrl: canvas.toDataURL('image/png'),
        },
      };

      window.localStorage.setItem(sharedContractsStorageKey, JSON.stringify(sharedContracts));
      setContract(sharedContracts[id]);
    } catch {
      // No-op: avoid breaking signature flow if storage data is malformed.
    }
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
        </div>

        <section className="proposal-sign-card" aria-label="Accept proposal">
          <p className="proposal-kicker">Ready to proceed?</p>
          <h2>
            <span>LET&apos;S</span> go
          </h2>
          <p className="proposal-copy">
            Accept this proposal to kick things off. Your signature confirms the scope, timeline, and payment
            terms.
          </p>
          <button type="button" className="accept-proposal-btn" onClick={openSignatureCanvas}>
            Accept &amp; Sign Proposal
          </button>
        </section>

        {showSignatureCanvas ? (
          <section className="signature-canvas-card" ref={signatureSectionRef}>
            <p className="proposal-kicker">Accept &amp; sign</p>
            <h3>
              <span>SIGN</span> below
            </h3>
            <p className="small compact signature-intro">
              By signing, you agree to the scope, pricing, and payment terms outlined in this proposal.
            </p>

            <div className="field">
              <label htmlFor="signerName">Your full name</label>
              <input
                id="signerName"
                value={signerName}
                onChange={(event) => setSignerName(event.target.value)}
                placeholder={contract.form.clientName}
              />
            </div>

            <div className="field">
              <label htmlFor="signatureCanvas">Draw your signature</label>
              <canvas
                id="signatureCanvas"
                ref={canvasRef}
                className="signature-canvas"
                onPointerDown={startDrawing}
                onPointerMove={drawSignature}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
              />
            </div>

            <div className="button-row signature-canvas-actions">
              <button type="button" className="secondary" onClick={saveClientSignature}>
                Accept &amp; Sign
              </button>
              <button type="button" className="ghost" onClick={clearSignature}>
                Clear
              </button>
            </div>

            {!signerName.trim() || !hasDrawn ? (
              <p className="small">Enter your full name and draw your signature to complete signing.</p>
            ) : null}

            {signatureDate ? (
              <p className="small">Signed by {signerName} on {new Date(signatureDate).toLocaleString()}.</p>
            ) : null}
          </section>
        ) : null}

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
