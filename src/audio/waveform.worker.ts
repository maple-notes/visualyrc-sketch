self.onmessage = (
  event: MessageEvent<{ samples: Float32Array; id: string }>,
) => {
  const { samples, id } = event.data;
  const count = 1200,
    peaks = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = Math.floor((i * samples.length) / count),
      b = Math.floor(((i + 1) * samples.length) / count);
    let peak = 0;
    for (let j = a; j < b; j++) peak = Math.max(peak, Math.abs(samples[j]));
    peaks[i] = peak;
  }
  self.postMessage({ id, peaks }, { transfer: [peaks.buffer] });
};
