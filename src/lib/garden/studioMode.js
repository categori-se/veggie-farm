// Interface preference only: garden geometry and planting records are untouched.
export function normalizeStudioMode(value) {
  return value === "advanced" ? "advanced" : "simple";
}

export function studioModeTransition(state, value) {
  const studioMode = normalizeStudioMode(value);
  const advancedTool = ["parcel", "structures", "vegetation"].includes(state.activeTool);
  return {
    studioMode,
    activeTool: studioMode === "simple" && advancedTool ? "beds" : state.activeTool,
    drawMode: null,
    draftBedPoints: [],
    toolDrawerOpen: false,
    inspectorOpen: false
  };
}
