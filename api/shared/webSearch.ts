/**
 * DuckDuckGo Instant Answer API — bepul, kalitsiz.
 * Faqat qisqa faktlar uchun ishlaydi (Wikipedia abstract).
 */

interface DDGResult {
  Abstract?: string;
  AbstractText?: string;
  AbstractSource?: string;
  AbstractURL?: string;
  Answer?: string;
  AnswerType?: string;
  Definition?: string;
  RelatedTopics?: { Text?: string }[];
}

export async function webSearch(query: string): Promise<string> {
  try {
    const url = new URL('https://api.duckduckgo.com/');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('no_html', '1');
    url.searchParams.set('skip_disambig', '1');

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'KOSMOS-AI/1.0' },
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return '';

    const data = (await res.json()) as DDGResult;
    const parts: string[] = [];

    if (data.AbstractText) {
      parts.push(
        `${data.AbstractText}${data.AbstractSource ? ` [${data.AbstractSource}]` : ''}`,
      );
    }
    if (data.Answer) {
      parts.push(`Javob: ${data.Answer}`);
    }
    if (data.Definition) {
      parts.push(`Ta'rif: ${data.Definition}`);
    }

    return parts.join('\n').slice(0, 500);
  } catch {
    return '';
  }
}