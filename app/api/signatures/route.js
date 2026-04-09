import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const signaturesDir = path.join(process.cwd(), 'data');
const signaturesFilePath = path.join(signaturesDir, 'signatures.json');

async function readSignatures() {
  try {
    const raw = await readFile(signaturesFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

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

    await mkdir(signaturesDir, { recursive: true });
    const signatures = await readSignatures();

    signatures[contractId] = {
      contractId,
      clientName,
      clientDate: clientDate || new Date().toISOString().slice(0, 10),
      signatureImage,
      savedAt: new Date().toISOString(),
    };

    await writeFile(signaturesFilePath, JSON.stringify(signatures, null, 2), 'utf8');

    return Response.json({ ok: true, signature: signatures[contractId] });
  } catch {
    return Response.json({ ok: false, message: 'Failed to save signature.' }, { status: 500 });
  }
}
