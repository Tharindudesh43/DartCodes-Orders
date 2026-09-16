const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const CLASSIFY_TIMEOUT_MS = 3000;

async function classifyNote(note) {
  if (!note || !note.trim()) {
    return { category: null, confidence: null, isUncertain: true, topCandidate: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLASSIFY_TIMEOUT_MS);

  try {
    const response = await fetch(`${ML_SERVICE_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: note }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Classifier responded with status ${response.status}`);
    }

    const result = await response.json();
    return {
      category: result.category ?? null,
      confidence: result.confidence ?? null,
      isUncertain: Boolean(result.isUncertain),
      topCandidate: result.topCandidate ?? null,
    };
  } catch (err) {
    console.warn('classifyNote: falling back, classifier unreachable ->', err.message);
    return { category: null, confidence: null, isUncertain: true, topCandidate: null };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { classifyNote };
