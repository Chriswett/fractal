export type ActiveCanvasKind = "webgl" | "cpu";

export class RenderBridge {
  private activeCanvas: HTMLCanvasElement | null = null;
  private activeKind: ActiveCanvasKind = "webgl";

  setActiveCanvas(canvas: HTMLCanvasElement | null, kind: ActiveCanvasKind) {
    this.activeCanvas = canvas;
    this.activeKind = kind;
  }

  getActiveCanvas() {
    return this.activeCanvas;
  }

  getActiveKind() {
    return this.activeKind;
  }
}
