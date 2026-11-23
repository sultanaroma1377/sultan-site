import { scannedOrderNumber } from './review-rules';

/** Serial processing keeps the scanner accepting input while a dispatch is saving. */
export function createDispatchScanner(dispatch: (number: string) => Promise<void>, onError: (error: unknown) => void, delay = 200) {
  let buffer = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending = Promise.resolve();
  const flush = () => {
    clearTimeout(timer);
    const text = buffer; buffer = '';
    const lines = text.match(/Order:\s*[^\s]+/gi);
    const numbers = lines ? lines.map(scannedOrderNumber) : [scannedOrderNumber(text)];
    for (const number of numbers) {
      if (!number) continue;
      pending = pending.then(() => dispatch(number)).catch(onError);
    }
    return pending;
  };
  return {
    feed(text: string) { buffer += text; clearTimeout(timer); timer = setTimeout(flush, delay); },
    flush,
    dispose() { clearTimeout(timer); buffer = ''; },
  };
}