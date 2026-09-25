export function graphStats(graph) {
  return {
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    nodeTypes: graph.nodeTypes.length,
    edgeTypes: graph.edgeTypes.length,
    plants: graph.nodes.filter((node) => node.type === "plant").length,
    pests: graph.nodes.filter((node) => node.type === "pest").length,
    diseases: graph.nodes.filter((node) => node.type === "disease").length,
    sources: graph.nodes.filter((node) => node.type === "source").length
  };
}

export function nodeIndex(graph) {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

export function edgeIndex(graph) {
  const outgoing = new Map();
  const incoming = new Map();
  for (const edge of graph.edges) {
    if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
    if (!incoming.has(edge.to)) incoming.set(edge.to, []);
    outgoing.get(edge.from).push(edge);
    incoming.get(edge.to).push(edge);
  }
  return {
    outgoing,
    incoming
  };
}

export function getNode(graph, id) {
  return nodeIndex(graph).get(id);
}

export function outgoingEdges(graph, id, relationship) {
  return graph.edges.filter((edge) => edge.from === id && (!relationship || edge.relationship === relationship));
}

export function incomingEdges(graph, id, relationship) {
  return graph.edges.filter((edge) => edge.to === id && (!relationship || edge.relationship === relationship));
}

export function hasEdge(graph, from, relationship, to) {
  return graph.edges.some((edge) => edge.from === from && edge.relationship === relationship && edge.to === to);
}

export function neighborhood(graph, id) {
  const index = nodeIndex(graph);
  return graph.edges
    .filter((edge) => edge.from === id || edge.to === id)
    .map((edge) => ({
      from: index.get(edge.from)?.name ?? edge.from,
      relationship: edge.relationship,
      to: index.get(edge.to)?.name ?? edge.to,
      confidence: edge.confidence ?? "",
      note: edge.note ?? ""
    }));
}

export function queryPlants(graph, criteria) {
  const plants = graph.nodes.filter((node) => node.type === "plant");

  return plants
    .map((plant) => {
      const checks = [];

      if (criteria.category) {
        checks.push({
          label: `category is ${criteria.category}`,
          ok: plant.attributes.category === criteria.category
        });
      }

      if (criteria.toleratesPartialShade) {
        checks.push({
          label: "tolerates partial shade",
          ok: hasEdge(graph, plant.id, "tolerates_light", "light:partial-shade")
        });
      }

      if (criteria.germinatesBelowF != null) {
        checks.push({
          label: `germinates below ${criteria.germinatesBelowF}F`,
          ok: (plant.attributes.germination?.soilTemperatureMinF ?? Infinity) < criteria.germinatesBelowF
        });
      }

      if (criteria.improvesNitrogen) {
        checks.push({
          label: "improves nitrogen",
          ok: hasEdge(graph, plant.id, "improves_soil_property", "soil:nitrogen")
        });
      }

      if (criteria.predecessorFor) {
        checks.push({
          label: `predecessor for ${criteria.predecessorFor}`,
          ok: hasEdge(graph, plant.id, "good_predecessor_for", criteria.predecessorFor)
        });
      }

      if (criteria.usdaZone) {
        checks.push({
          label: `suitable for ${criteria.usdaZone}`,
          ok: hasEdge(graph, plant.id, "suitable_for_zone", criteria.usdaZone)
        });
      }

      const passed = checks.filter((check) => check.ok);
      return {
        id: plant.id,
        plant: plant.name,
        path: plant.path,
        family: plant.attributes.family,
        season: plant.attributes.season,
        soilTemperatureMinF: plant.attributes.germination?.soilTemperatureMinF ?? "",
        shadeTolerance: plant.attributes.shadeTolerance ?? "",
        nitrogenFixing: plant.attributes.nitrogenFixing ? "Yes" : "No",
        score: `${passed.length}/${checks.length}`,
        matched: passed.map((check) => check.label).join("; "),
        passes: passed.length === checks.length
      };
    })
    .filter((result) => result.passes)
    .sort((a, b) => a.plant.localeCompare(b.plant));
}

export function relationshipRows(graph, relationship) {
  const index = nodeIndex(graph);
  return graph.edges
    .filter((edge) => !relationship || edge.relationship === relationship)
    .map((edge) => ({
      from: index.get(edge.from)?.name ?? edge.from,
      relationship: edge.relationship,
      to: index.get(edge.to)?.name ?? edge.to,
      confidence: edge.confidence ?? "",
      sourceIds: (edge.sourceIds ?? []).join(", "),
      note: edge.note ?? ""
    }));
}
