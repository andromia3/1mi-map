export type ZoomRamp = { [zoom: string]: number };

export type MapStyleConfig = {
  palette: {
    land: string;
    water: string;
    park: string;
    building: string;
    labelHalo: string;
  };
  parks: {
    opacity: number;
    minAreaM2: number;
    minZoom: number;
    tinyParksShowZoom: number;
  };
  roads: {
    motorwayWidth: ZoomRamp;
    primaryWidth: ZoomRamp;
    secondaryWidth: ZoomRamp;
    residentialOpacity: ZoomRamp;
  };
  labels: {
    haloWidth: number;
    poiTextSize: ZoomRamp;
  };
  transit: {
    minZoom: number;
    lineOpacity: ZoomRamp;
    classes: string[];
  };
  buildings3d: {
    minZoom: number;
    opacity: number;
    minHeight: number;
  };
  camera: {
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
  };
  fog: {
    range: [number, number];
    horizonBlend: number;
  };
};

export const DEFAULT_THEME: MapStyleConfig = {
  palette: {
    land: "#EDEDD5",
    water: "#18391A",
    park: "#275D2B",
    building: "#D8D8C8",
    labelHalo: "#FFFFFF",
  },
  parks: {
    opacity: 0.35,
    minAreaM2: 2500,
    minZoom: 11,
    tinyParksShowZoom: 13,
  },
  roads: {
    motorwayWidth: { "10": 1.6, "14": 5 },
    primaryWidth: { "10": 1.2, "14": 3.5 },
    secondaryWidth: { "10": 0.9, "14": 2.5 },
    residentialOpacity: { "10": 0.25, "14": 0.65 },
  },
  labels: {
    haloWidth: 1.2,
    poiTextSize: { "12": 10, "14": 11 },
  },
  transit: {
    minZoom: 10.5,
    lineOpacity: { "10": 0.15, "14": 0.35 },
    classes: ["rail", "subway"],
  },
  buildings3d: {
    minZoom: 13,
    opacity: 0.95,
    minHeight: 6,
  },
  camera: {
    center: [-0.1276, 51.5072],
    zoom: 12,
    pitch: 45,
    bearing: -17.6,
  },
  fog: {
    range: [0.2, 10],
    horizonBlend: 0.1,
  },
};


