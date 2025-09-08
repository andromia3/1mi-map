export type ZoomRamp = { [zoom: string]: number };

export type MapStyleConfig = {
  palette: { land: string; water: string; park: string; building: string; labelHalo: string };
  parks: { opacity: number; minAreaM2: number; minZoom: number; tinyParksShowZoom: number };
  roads: { motorwayWidth: ZoomRamp; primaryWidth: ZoomRamp; secondaryWidth: ZoomRamp; residentialOpacity: ZoomRamp };
  labels: { haloWidth: number; poiTextSize: ZoomRamp };
  transit: { minZoom: number; lineOpacity: ZoomRamp; classes: string[] };
  buildings3d: { minZoom: number; opacity: number; minHeight: number };
  camera: { center: [number, number]; zoom: number; pitch: number; bearing: number };
  fog: { range: [number, number]; horizonBlend: number };
};

export const DEFAULT_THEME: MapStyleConfig = {
  palette: { land: '#EDEDD5', water: '#18391A', park: '#275D2B', building: '#D8D8C8', labelHalo: '#FFFFFF' },
  parks: { opacity: 0.35, minAreaM2: 20000, minZoom: 11, tinyParksShowZoom: 13 },
  roads: {
    motorwayWidth: { '10': 1.6, '14': 3.2 },
    primaryWidth: { '10': 1.2, '14': 2.2 },
    secondaryWidth: { '10': 0.8, '14': 1.6 },
    residentialOpacity: { '10': 0.2, '14': 0.6 },
  },
  labels: { haloWidth: 1.2, poiTextSize: { '10': 9, '14': 11 } },
  transit: { minZoom: 10.5, lineOpacity: { '10': 0.25, '14': 0.6 }, classes: ['rail', 'subway'] },
  buildings3d: { minZoom: 13, opacity: 0.95, minHeight: 6 },
  camera: { center: [-0.1276, 51.5074], zoom: 11.5, pitch: 60, bearing: -18 },
  fog: { range: [0.8, 10], horizonBlend: 0.02 },
};

export const NIGHT_THEME: MapStyleConfig = {
  palette: { land: '#0E1114', water: '#0B2A33', park: '#123A1B', building: '#9AA0A6', labelHalo: '#0B0F14' },
  parks: { opacity: 0.35, minAreaM2: 20000, minZoom: 11, tinyParksShowZoom: 13 },
  roads: {
    motorwayWidth: { '10': 1.6, '14': 3.2 },
    primaryWidth: { '10': 1.2, '14': 2.2 },
    secondaryWidth: { '10': 0.8, '14': 1.6 },
    residentialOpacity: { '10': 0.25, '14': 0.65 },
  },
  labels: { haloWidth: 1.2, poiTextSize: { '10': 9, '14': 11 } },
  transit: { minZoom: 10.5, lineOpacity: { '10': 0.3, '14': 0.7 }, classes: ['rail', 'subway'] },
  buildings3d: { minZoom: 13, opacity: 0.95, minHeight: 6 },
  camera: { center: [-0.1276, 51.5074], zoom: 11.5, pitch: 60, bearing: -18 },
  fog: { range: [0.8, 10], horizonBlend: 0.02 },
};

export const STYLE_URLS = {
  default: 'mapbox://styles/mapbox/light-v11',
  night: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
} as const;

export type StyleKey = keyof typeof STYLE_URLS;


