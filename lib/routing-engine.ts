export interface RouteNode {
  id: string
  neighbors: string[]
  latency?: number
}

interface GraphNode {
  id: string
  latency: number
}

// Dijkstra's algorithm for shortest path routing
export function findShortestPath(
  graph: Record<string, RouteNode>,
  source: string,
  target: string
): string[] {
  if (source === target) return [source]
  if (!graph[source] || !graph[target]) return []

  const distances: Record<string, number> = {}
  const previous: Record<string, string | null> = {}
  const unvisited = new Set(Object.keys(graph))

  // Initialize distances
  for (const node of Object.keys(graph)) {
    distances[node] = Infinity
    previous[node] = null
  }
  distances[source] = 0

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let current = ''
    let minDist = Infinity

    for (const node of unvisited) {
      if (distances[node] < minDist) {
        minDist = distances[node]
        current = node
      }
    }

    if (!current || minDist === Infinity) break

    unvisited.delete(current)

    // Update distances to neighbors
    for (const neighbor of graph[current].neighbors) {
      if (unvisited.has(neighbor)) {
        const neighborLatency = graph[neighbor].latency || 10
        const alt = distances[current] + neighborLatency
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt
          previous[neighbor] = current
        }
      }
    }
  }

  // Reconstruct path
  if (previous[target] === null && target !== source) {
    return [] // No path found
  }

  const path: string[] = []
  let current: string | null = target

  while (current !== null) {
    path.unshift(current)
    current = previous[current] || null
  }

  return path
}

// Find alternative paths (K-shortest paths for redundancy)
export function findAlternativePaths(
  graph: Record<string, RouteNode>,
  source: string,
  target: string,
  k: number = 3
): string[][] {
  const paths: string[][] = []
  let modifiedGraph = JSON.parse(JSON.stringify(graph)) as Record<string, RouteNode>

  for (let i = 0; i < k; i++) {
    const path = findShortestPath(modifiedGraph, source, target)
    if (path.length === 0) break

    paths.push(path)

    // Remove edges in this path to find alternative paths
    for (let j = 0; j < path.length - 1; j++) {
      const current = path[j]
      const next = path[j + 1]
      
      if (modifiedGraph[current].neighbors.includes(next)) {
        modifiedGraph[current].neighbors = modifiedGraph[current].neighbors.filter(
          (n) => n !== next
        )
      }
    }
  }

  return paths
}

// Calculate route quality score
export function calculateRouteQuality(
  graph: Record<string, RouteNode>,
  path: string[]
): number {
  if (path.length < 2) return 100

  let totalLatency = 0
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i]
    const next = path[i + 1]
    if (graph[current]) {
      totalLatency += graph[current].latency || 10
    }
  }

  // Quality: lower latency = higher quality
  const avgLatency = totalLatency / (path.length - 1)
  const hops = path.length - 1

  // Base quality calculation
  let quality = 100
  quality -= avgLatency * 0.5 // Latency penalty
  quality -= hops * 5 // Hop penalty
  quality += 20 // Base bonus

  return Math.max(1, Math.min(100, quality))
}

// Find most secure path (considers node trust scores)
export function findSecurePath(
  graph: Record<string, RouteNode>,
  source: string,
  target: string,
  nodeTrust: Record<string, number>
): string[] {
  if (source === target) return [source]
  if (!graph[source] || !graph[target]) return []

  const distances: Record<string, number> = {}
  const previous: Record<string, string | null> = {}
  const unvisited = new Set(Object.keys(graph))

  // Initialize: use inverse of trust (lower trust = higher cost)
  for (const node of Object.keys(graph)) {
    const trustScore = nodeTrust[node] || 50
    distances[node] = 100 / (trustScore + 1) // Lower trust = higher distance
    previous[node] = null
  }
  distances[source] = 0

  while (unvisited.size > 0) {
    let current = ''
    let minDist = Infinity

    for (const node of unvisited) {
      if (distances[node] < minDist) {
        minDist = distances[node]
        current = node
      }
    }

    if (!current || minDist === Infinity) break

    unvisited.delete(current)

    for (const neighbor of graph[current].neighbors) {
      if (unvisited.has(neighbor)) {
        const trustScore = nodeTrust[neighbor] || 50
        const cost = 100 / (trustScore + 1)
        const alt = distances[current] + cost

        if (alt < distances[neighbor]) {
          distances[neighbor] = alt
          previous[neighbor] = current
        }
      }
    }
  }

  // Reconstruct path
  if (previous[target] === null && target !== source) {
    return []
  }

  const path: string[] = []
  let current: string | null = target

  while (current !== null) {
    path.unshift(current)
    current = previous[current] || null
  }

  return path
}

// Load balance: distribute traffic across multiple paths
export function selectPathWithLoadBalance(
  paths: string[][],
  pathLoadCounts: Record<string, number>
): string[] {
  if (paths.length === 0) return []

  // Select path with lowest load
  let selectedPath = paths[0]
  let minLoad = Infinity

  for (const path of paths) {
    const pathKey = path.join('-')
    const load = pathLoadCounts[pathKey] || 0

    if (load < minLoad) {
      minLoad = load
      selectedPath = path
    }
  }

  return selectedPath
}

// Trace route visualization
export function traceRoute(path: string[]): Array<{ hop: number; nodeId: string }> {
  return path.map((nodeId, hop) => ({ hop, nodeId }))
}
