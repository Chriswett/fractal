import { createContext } from "react";
import { RenderBridge } from "./RenderBridge";

export const RenderContext = createContext<RenderBridge | null>(null);
