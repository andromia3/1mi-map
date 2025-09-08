// Lightweight grid-based clustering in a Web Worker (no external deps)
// Input: { points: [{ lng, lat, properties }], zoom: number }
// Output: { type:'FeatureCollection', features: [Feature] }

self.onmessage = (e) => {
  try {
    const { points, zoom } = e.data || {};
    if (!Array.isArray(points)) {
      // eslint-disable-next-line no-restricted-globals
      self.postMessage({ type: 'FeatureCollection', features: [] });
      return;
    }
    const z = typeof zoom === 'number' ? zoom : 12;
    // Cell size in degrees – coarser at low zoom, finer at high zoom
    const cell = 360 / (Math.pow(2, z) * 64);
    const buckets = new Map();
    for (const p of points) {
      if (!p || typeof p.lng !== 'number' || typeof p.lat !== 'number') continue;
      const gx = Math.floor(p.lng / cell);
      const gy = Math.floor(p.lat / cell);
      const key = gx + ':' + gy;
      let b = buckets.get(key);
      if (!b) { b = { count: 0, lngSum: 0, latSum: 0, sample: p }; buckets.set(key, b); }
      b.count += 1; b.lngSum += p.lng; b.latSum += p.lat; if (!b.sample && p) b.sample = p;
    }
    const features = [];
    for (const [, b] of buckets) {
      const count = b.count;
      const lng = b.lngSum / count;
      const lat = b.latSum / count;
      if (count > 1) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: { cluster: true, point_count: count },
        });
      } else {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: { ...(b.sample?.properties || {}), cluster: false },
        });
      }
    }
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ type: 'FeatureCollection', features });
  } catch (e) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ type: 'FeatureCollection', features: [] });
  }
};


