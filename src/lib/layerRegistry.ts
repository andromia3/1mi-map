// Layer registry to re-mount custom sources/layers after style switches
// Idempotent: checks for existing sources/layers by id

export type SourceDef = { id: string; type: string; options: any };
export type LayerDef = any; // Mapbox GL Layer specification (kept as any to avoid heavy types)

const sourceRegistry: SourceDef[] = [];
const layerRegistry: { def: LayerDef; beforeId?: string }[] = [];

export function registerSource(def: SourceDef) {
  if (!sourceRegistry.find((s) => s.id === def.id)) sourceRegistry.push(def);
}

export function registerLayer(def: LayerDef, beforeId?: string) {
  if (!layerRegistry.find((l) => l.def?.id === def?.id)) layerRegistry.push({ def, beforeId });
}

export function clearRegistry() {
  sourceRegistry.length = 0;
  layerRegistry.length = 0;
}

export function mountAll(map: any) {
  try {
    for (const s of sourceRegistry) {
      if (!map.getSource(s.id)) {
        map.addSource(s.id, s.options);
      }
    }
    for (const { def, beforeId } of layerRegistry) {
      if (!map.getLayer(def.id)) {
        try {
          map.addLayer(def, beforeId);
        } catch {}
      }
    }
  } catch {}
}


