import { RenderQualityHint, Scene } from "../../state/types";
import { applyColorProfile, rgbaToCss, sampleGradient } from "../../utils/color";
import { nextFrame } from "../../utils/async";
import { IFractalRenderer, RenderRequest, RenderStillRequest } from "../types";

type Point = { x: number; y: number };

type Triangle = { a: Point; b: Point; c: Point };

export class SierpinskiRenderer implements IFractalRenderer {
  async render(request: RenderRequest) {
    await this.renderScene(request.scene, request.canvas, request.pass, request.qualityHint, request.signal);
  }

  async renderStill(request: RenderStillRequest) {
    await this.renderScene(request.scene, request.canvas, null, request.qualityHint, null);
  }

  private async renderScene(
    scene: Scene,
    canvas: HTMLCanvasElement,
    pass: { index: number; count: number; resolutionScale: number } | null,
    qualityHint: RenderQualityHint,
    signal: AbortSignal | null
  ) {
    if (signal?.aborted) {
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      return;
    }

    this.resizeCanvas(canvas, scene, pass?.resolutionScale);

    const params = "depth" in scene.params ? scene.params : { depth: 4 };
    const maxDepth = qualityHint === "interactive" ? Math.max(1, Math.round(params.depth * 0.6)) : params.depth;
    const passDepth = pass ? Math.max(1, Math.round(maxDepth * (pass.index + 1) / pass.count)) : maxDepth;

    const padding = canvas.width * 0.08;
    const base: Triangle = {
      a: { x: canvas.width / 2, y: padding },
      b: { x: padding, y: canvas.height - padding },
      c: { x: canvas.width - padding, y: canvas.height - padding }
    };

    let triangles: Triangle[] = [base];
    for (let d = 0; d < passDepth; d += 1) {
      const next: Triangle[] = [];
      for (const tri of triangles) {
        const ab = midpoint(tri.a, tri.b);
        const bc = midpoint(tri.b, tri.c);
        const ca = midpoint(tri.c, tri.a);
        next.push({ a: tri.a, b: ab, c: ca });
        next.push({ a: ab, b: tri.b, c: bc });
        next.push({ a: ca, b: bc, c: tri.c });
      }
      triangles = next;
      if (signal?.aborted) {
        return;
      }
      await nextFrame();
    }

    if (signal?.aborted) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0b0f12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const minY = base.a.y;
    const maxY = base.b.y;

    for (const tri of triangles) {
      const centroidY = (tri.a.y + tri.b.y + tri.c.y) / 3;
      const t = (centroidY - minY) / Math.max(1, (maxY - minY));
      const gradient = sampleGradient(scene.color.gradientStops, t);
      const adjusted = applyColorProfile(gradient, scene.color);

      ctx.fillStyle = rgbaToCss(adjusted);
      ctx.beginPath();
      ctx.moveTo(tri.a.x, tri.a.y);
      ctx.lineTo(tri.b.x, tri.b.y);
      ctx.lineTo(tri.c.x, tri.c.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  private resizeCanvas(canvas: HTMLCanvasElement, scene: Scene, resolutionScale?: number) {
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.max(1, resolutionScale ?? scene.render.resolutionScale);
    const clientWidth = canvas.clientWidth || canvas.width || 1;
    const clientHeight = canvas.clientHeight || canvas.height || 1;
    const width = Math.max(1, Math.floor(clientWidth * dpr / scale));
    const height = Math.max(1, Math.floor(clientHeight * dpr / scale));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
