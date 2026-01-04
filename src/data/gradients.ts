import { GradientStop } from "../state/types";

export type NamedGradient = {
  id: string;
  name: string;
  stops: GradientStop[];
};

export const gradients: NamedGradient[] = [
  {
    id: "ember",
    name: "Ember",
    stops: [
      { t: 0, color: { r: 0.02, g: 0.03, b: 0.05, a: 1 } },
      { t: 0.35, color: { r: 0.12, g: 0.4, b: 0.48, a: 1 } },
      { t: 0.7, color: { r: 0.96, g: 0.82, b: 0.52, a: 1 } },
      { t: 1, color: { r: 0.92, g: 0.28, b: 0.12, a: 1 } }
    ]
  },
  {
    id: "nocturne",
    name: "Nocturne",
    stops: [
      { t: 0, color: { r: 0.03, g: 0.05, b: 0.12, a: 1 } },
      { t: 0.4, color: { r: 0.2, g: 0.27, b: 0.5, a: 1 } },
      { t: 0.7, color: { r: 0.62, g: 0.5, b: 0.86, a: 1 } },
      { t: 1, color: { r: 0.9, g: 0.85, b: 0.98, a: 1 } }
    ]
  },
  {
    id: "sage",
    name: "Sage",
    stops: [
      { t: 0, color: { r: 0.02, g: 0.06, b: 0.08, a: 1 } },
      { t: 0.5, color: { r: 0.2, g: 0.5, b: 0.42, a: 1 } },
      { t: 1, color: { r: 0.9, g: 0.92, b: 0.78, a: 1 } }
    ]
  },
  {
    id: "solar",
    name: "Solar",
    stops: [
      { t: 0, color: { r: 0.04, g: 0.02, b: 0.04, a: 1 } },
      { t: 0.4, color: { r: 0.35, g: 0.1, b: 0.12, a: 1 } },
      { t: 0.75, color: { r: 0.98, g: 0.58, b: 0.08, a: 1 } },
      { t: 1, color: { r: 0.98, g: 0.9, b: 0.62, a: 1 } }
    ]
  }
];
