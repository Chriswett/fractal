import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { RenderContext } from "../../app/RenderContext";
import { actions, useStore } from "../../state/store";
import { RenderScheduler } from "../../engine/scheduler/RenderScheduler";
import { fractalRegistry } from "../../engine/registry";
import { FractalType, Scene } from "../../state/types";
import { panViewport, zoomViewport } from "../../utils/viewport";
import { IFractalRenderer } from "../../engine/types";

const webglTypes: FractalType[] = [
  "mandelbrot",
  "multibrot3",
  "tricorn",
  "burning-ship",
  "julia",
  "tricorn-julia",
  "burning-ship-julia",
  "newton-z3",
  "halley-z3",
  "newton-sin"
];

export function Canvas() {
  const renderBridge = useContext(RenderContext);
  const scene = useStore((state) => state.scene);
  const renderRequestId = useStore((state) => state.renderRequestId);
  const renderHint = useStore((state) => state.renderHint);
  const timelinePlaying = useStore((state) => state.ui.timelinePlaying);
  const scheduler = useMemo(() => new RenderScheduler(), []);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cpuCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene>(scene);
  const rendererRef = useRef<IFractalRenderer | null>(null);
  const rendererTypeRef = useRef<FractalType | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    if (rendererTypeRef.current !== scene.fractalType) {
      rendererRef.current?.destroy?.();
      rendererRef.current = fractalRegistry.get(scene.fractalType).createRenderer();
      rendererTypeRef.current = scene.fractalType;
    }
  }, [scene.fractalType]);

  const activeIsWebgl = webglTypes.includes(scene.fractalType);

  useEffect(() => {
    const activeCanvas = activeIsWebgl ? webglCanvasRef.current : cpuCanvasRef.current;
    renderBridge?.setActiveCanvas(activeCanvas, activeIsWebgl ? "webgl" : "cpu");
  }, [activeIsWebgl, renderBridge, renderRequestId]);

  useEffect(() => {
    const activeCanvas = activeIsWebgl ? webglCanvasRef.current : cpuCanvasRef.current;
    if (!activeCanvas) {
      return;
    }
    scheduler.render(sceneRef.current, activeCanvas, rendererRef.current, renderHint, timelinePlaying);
  }, [renderRequestId, renderHint, activeIsWebgl, scheduler, timelinePlaying]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      actions.triggerRender("final");
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    lastPointer.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !lastPointer.current) {
      return;
    }
    const dx = event.clientX - lastPointer.current.x;
    const dy = event.clientY - lastPointer.current.y;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    const nextViewport = panViewport(sceneRef.current.viewport, dx, dy);
    actions.updateViewport(nextViewport, "interactive");
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDragging(false);
    lastPointer.current = null;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const zoomFactor = Math.exp(-event.deltaY * 0.0012);
    const nextViewport = zoomViewport(sceneRef.current.viewport, zoomFactor, x, y, rect.width, rect.height);
    actions.updateViewport(nextViewport, "interactive");
  };

  return (
    <div
      ref={containerRef}
      className="canvas-stack"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      <canvas
        ref={webglCanvasRef}
        style={{ opacity: activeIsWebgl ? 1 : 0, pointerEvents: activeIsWebgl ? "auto" : "none" }}
      />
      <canvas
        ref={cpuCanvasRef}
        style={{ opacity: activeIsWebgl ? 0 : 1, pointerEvents: activeIsWebgl ? "none" : "auto" }}
      />
    </div>
  );
}
