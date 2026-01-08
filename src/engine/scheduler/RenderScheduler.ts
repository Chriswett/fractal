import { RenderQualityHint, Scene } from "../../state/types";
import { IFractalRenderer, RenderPass } from "../types";

const FINAL_DEBOUNCE_MS = 200;

export class RenderScheduler {
  private activeJobId = 0;
  private abortController: AbortController | null = null;
  private finalTimer: number | null = null;

  render(
    scene: Scene,
    canvas: HTMLCanvasElement | null,
    renderer: IFractalRenderer | null,
    hint: RenderQualityHint,
    suppressFinal: boolean = false
  ) {
    if (!canvas || !renderer) {
      return;
    }

    if (this.finalTimer) {
      window.clearTimeout(this.finalTimer);
      this.finalTimer = null;
    }

    if (hint === "interactive") {
      this.startRender(scene, canvas, renderer, "interactive");
      if (!suppressFinal) {
        this.finalTimer = window.setTimeout(() => {
          this.startRender(scene, canvas, renderer, "final");
        }, FINAL_DEBOUNCE_MS);
      }
    } else {
      this.startRender(scene, canvas, renderer, "final");
    }
  }

  private async startRender(
    scene: Scene,
    canvas: HTMLCanvasElement,
    renderer: IFractalRenderer,
    hint: RenderQualityHint
  ) {
    this.activeJobId += 1;
    const jobId = this.activeJobId;

    if (this.abortController) {
      this.abortController.abort();
    }
    const controller = new AbortController();
    this.abortController = controller;

    const tileSizes = scene.render.progressive.enabled
      ? scene.render.progressive.tileSizes
      : [1];
    const sortedTiles = (tileSizes.length ? tileSizes : [1]).slice().sort((a, b) => b - a);
    const passTiles = hint === "interactive" ? [sortedTiles[0]] : sortedTiles;

    const baseScale = Math.max(1, scene.render.resolutionScale || 1);
    const resolutionScale = Math.max(1, baseScale);

    const passes: RenderPass[] = passTiles.map((tileSize, index) => ({
      index,
      count: passTiles.length,
      tileSize,
      resolutionScale
    }));

    for (const pass of passes) {
      if (controller.signal.aborted || jobId !== this.activeJobId) {
        return;
      }
      await renderer.render({
        scene,
        canvas,
        pass,
        jobId,
        qualityHint: hint,
        signal: controller.signal
      });
    }
  }
}
