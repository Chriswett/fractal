import { Scene } from "../state/types";
import { getSavedScenes, saveScene } from "./presetsDb";

const LAST_SCENE_ID = "last-scene";

export async function saveLastScene(scene: Scene) {
  await saveScene({ ...scene, id: LAST_SCENE_ID });
}

export async function loadLastScene(): Promise<Scene | null> {
  const scenes = await getSavedScenes();
  return scenes.find((item) => item.id === LAST_SCENE_ID) ?? null;
}
