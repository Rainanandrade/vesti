export async function requestWithTimeout(input: string, init: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new Error('A conexão demorou mais que o esperado. Tente novamente.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
