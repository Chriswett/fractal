import { RenderQualityHint, Scene } from "../../state/types";
import { applyColorProfile, rgbaToCss, sampleGradient } from "../../utils/color";
import { nextFrame } from "../../utils/async";
import { IFractalRenderer, RenderRequest, RenderStillRequest } from "../types";

type Point = { x: number; y: number };

type Segment = { a: Point; b: Point };

export class KochRenderer implements IFractalRenderer {
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

    const params = "depth" in scene.params ? scene.params : { depth: 4, variant: "curve" };
    const maxDepth = qualityHint === "interactive" ? Math.max(1, Math.round(params.depth * 0.6)) : params.depth;
    const passDepth = pass ? Math.max(1, Math.round(maxDepth * (pass.index + 1) / pass.count)) : maxDepth;

    let segments = createBaseSegments(canvas.width, canvas.height, params.variant ?? "curve");

    for (let d = 0; d < passDepth; d += 1) {
      const next: Segment[] = [];
      for (const seg of segments) {
        const dx = seg.b.x - seg.a.x;
        const dy = seg.b.y - seg.a.y;
        const p1 = seg.a;
        const p2 = { x: seg.a.x + dx / 3, y: seg.a.y + dy / 3 };
        const p3 = {
          x: seg.a.x + dx / 2 - (Math.sqrt(3) * dy) / 6,
          y: seg.a.y + dy / 2 + (Math.sqrt(3) * dx) / 6
        };
        const p4 = { x: seg.a.x + (2 * dx) / 3, y: seg.a.y + (2 * dy) / 3 };
        const p5 = seg.b;
        next.push({ a: p1, b: p2 });
        next.push({ a: p2, b: p3 });
        next.push({ a: p3, b: p4 });
        next.push({ a: p4, b: p5 });
      }
      segments = next;
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

    const minY = Math.min(...segments.map((seg) => Math.min(seg.a.y, seg.b.y)));
    const maxY = Math.max(...segments.map((seg) => Math.max(seg.a.y, seg.b.y)));
    const lineWidth = Math.max(1, canvas.width * 0.0018);

    for (const seg of segments) {
      const midpointY = (seg.a.y + seg.b.y) / 2;
      const t = (midpointY - minY) / Math.max(1, maxY - minY);
      const gradient = sampleGradient(scene.color.gradientStops, t);
      const adjusted = applyColorProfile(gradient, scene.color);

      ctx.strokeStyle = rgbaToCss(adjusted);
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(seg.a.x, seg.a.y);
      ctx.lineTo(seg.b.x, seg.b.y);
      ctx.stroke();
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

function createBaseSegments(width: number, height: number, variant: "curve" | "snowflake") {
  const padding = width * 0.1;
  if (variant === "snowflake") {
    const size = Math.min(width, height) * 0.5;
    const centerX = width / 2;
    const centerY = height / 2 + size * 0.2;
    const angle = -Math.PI / 2;
    const p1 = { x: centerX + Math.cos(angle) * size, y: centerY + Math.sin(angle) * size };
    const p2 = {
      x: centerX + Math.cos(angle + (2 * Math.PI) / 3) * size,
      y: centerY + Math.sin(angle + (2 * Math.PI) / 3) * size
    };
    const p3 = {
      x: centerX + Math.cos(angle + (4 * Math.PI) / 3) * size,
      y: centerY + Math.sin(angle + (4 * Math.PI) / 3) * size
    };
    return [
      { a: p1, b: p2 },
      { a: p2, b: p3 },
      { a: p3, b: p1 }
    ];
  }

  return [{ a: { x: padding, y: height / 2 }, b: { x: width - padding, y: height / 2 } }];
}
