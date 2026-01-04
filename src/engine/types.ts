import { RenderQualityHint, Scene } from "../state/types";

export type RenderPass = {
  index: number;
  count: number;
  tileSize: number;
  resolutionScale: number;
};

export type RenderRequest = {
  scene: Scene;
  canvas: HTMLCanvasElement;
  pass: RenderPass;
  jobId: number;
  qualityHint: RenderQualityHint;
  signal: AbortSignal;
};

export type RenderStillRequest = {
  scene: Scene;
  canvas: HTMLCanvasElement;
  qualityHint: RenderQualityHint;
};

export interface IFractalRenderer {
  render(request: RenderRequest): Promise<void>;
  renderStill(request: RenderStillRequest): Promise<void>;
  destroy?: () => void;
}
