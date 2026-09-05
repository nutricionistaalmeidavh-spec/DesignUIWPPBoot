export function isCrmPreviewEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_CRM_PREVIEW_MODE === "true";
}
