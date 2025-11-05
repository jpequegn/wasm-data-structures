# Phase 9: Graph (DFS/BFS and Shortest Paths) Implementation Design

**Date**: November 5, 2025
**Project**: wasm-data-structures
**Phase**: 9 (Sequential after Phase 8: Union-Find)

## Overview

This phase implements **Graphs** with multiple representations and fundamental traversal/shortest-path algorithms.

**Educational goal**: Understand graph representations (adjacency list, matrix), traversal algorithms (DFS, BFS), and shortest-path algorithms (Dijkstra, Bellman-Ford).

---

## Problem & Purpose

### Current State (Phase 8)
We implemented **Union-Find** for connectivity. Now we extend to full **graph algorithms**.

**Why Graphs?**
- Model relationships and networks
- DFS/BFS fundamental to many algorithms
- Shortest paths solve routing, navigation
- Used in: Maps, social networks, compilers, flight booking

### Solution: Graph with Algorithms
**Graph** implementation includes:
- Adjacency list representation (memory-efficient)
- DFS (depth-first search)
- BFS (breadth-first search)
- Dijkstra's algorithm (weighted shortest path)
- Connected components detection

### Learning Goal
1. Graph representations and trade-offs
2. DFS and BFS traversal patterns
3. Shortest path algorithms
4. Time complexity analysis (O(V+E), O(V²))
5. Real-world graph applications

---

## Design Details

### Rust Implementation (`src/graph.rs`)

```rust
pub struct Graph {
    adjacency_list: Vec<Vec<(usize, u32)>>,  // (neighbor, weight)
    vertex_count: usize,
    edge_count: u32,
    metrics: GraphMetrics,
}

#[wasm_bindgen]
pub struct GraphMetrics {
    pub total_traversals: u32,
    pub total_searches: u32,
    pub vertex_count: u32,
    pub edge_count: u32,
    pub avg_degree: f32,
}
```

#### Key Methods

**`add_edge(from, to, weight)`**
1. Add edge to adjacency list
2. Update metrics

**`dfs(start) -> Vec<usize>`**
1. Depth-first search from start
2. Return visit order
3. Track metrics

**`bfs(start) -> Vec<usize>`**
1. Breadth-first search from start
2. Return visit order (shortest path order)
3. Track metrics

**`dijkstra(start) -> Vec<u32>`**
1. Find shortest paths from start to all vertices
2. Use priority queue
3. Return distances

**`connected_components() -> Vec<Vec<usize>>`**
1. Find all connected components
2. Use DFS

---

### JavaScript Implementation (`web/Graph.js`)

Same algorithms with JavaScript data structures.

---

### Benchmarking Strategy

#### Scenarios
1. Dense graph (many edges)
2. Sparse graph (few edges)
3. Shortest path finding

#### Metrics
- Traversal count (vertices visited)
- Distance calculations
- Algorithm time comparison

---

### Educational Content

#### Blog Post: `blog/graph-deep-dive.md` (900-1000 words)

**Sections:**
1. **Problem**: Modeling networks and relationships
2. **Representations**: Adjacency list vs matrix trade-offs
3. **DFS algorithm**: Stack-based recursive traversal
4. **BFS algorithm**: Queue-based level-by-level exploration
5. **Dijkstra's algorithm**: Greedy shortest-path finding
6. **Time complexity**: O(V+E) vs O(V²)
7. **Applications**: Maps, social networks, compilers, games
8. **Real-world examples**: GPS navigation, friendship graphs

---

## Timeline
- **Rust struct + DFS/BFS:** 2-3 hours
- **Dijkstra + components:** 1-2 hours
- **Unit tests (12+):** 1 hour
- **WASM bindings:** 30 minutes
- **JavaScript implementation:** 1.5 hours
- **Benchmark page:** 1.5 hours
- **Blog post:** 1 hour

**Total:** 10-13 hours

---

## Success Criteria

✅ Graph with adjacency list representation
✅ DFS and BFS implemented
✅ Dijkstra's shortest path algorithm
✅ 12+ unit tests passing
✅ Connected components detection
✅ Blog post explains traversal and shortest paths
✅ All code committed and merged
