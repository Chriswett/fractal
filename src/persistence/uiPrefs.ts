import { UiPreferences } from "../state/types";

const KEY = "fraktaler-ui";

export function loadUiPreferences(): Partial<UiPreferences> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Partial<UiPreferences>;
  } catch {
    return {};
  }
}

export function saveUiPreferences(prefs: UiPreferences) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}
