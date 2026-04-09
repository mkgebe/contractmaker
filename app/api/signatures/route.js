const signaturesStore = globalThis.__contractmakerSignatures || {};
globalThis.__contractmakerSignatures = signaturesStore;

export async function POST(request) {
  try {
    const body = await request.json();
    const { contractId, clientName, clientDate, signatureImage } = body || {};

    if (!contractId || !clientName || !signatureImage) {
      return Response.json(
        { ok: false, message: 'contractId, clientName, and signatureImage are required.' },
        { status: 400 },
      );
    }

    signaturesStore[contractId] = {
      contractId,
      clientName,
      clientDate: clientDate || new Date().toISOString().slice(0, 10),
      signatureImage,
      savedAt: new Date().toISOString(),
    };

    return Response.json({ ok: true, signature: signaturesStore[contractId] });
  } catch {
    return Response.json({ ok: false, message: 'Failed to save signature.' }, { status: 500 });
  }
}
