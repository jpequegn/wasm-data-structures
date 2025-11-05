# Phase 9: Graph Implementation Plan

**6 Bite-Sized Tasks for Sequential Execution**

## Task 1: Core Graph Structure (1.5 hours)
**Objective**: Create Graph with adjacency list representation

Create `src/graph.rs`:
```rust
pub struct Graph {
    adjacency_list: Vec<Vec<(usize, u32)>>,  // (neighbor_id, weight)
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

**Tests**: 3 unit tests (constructor, add edge, empty graph)
**Acceptance**: Compiles, 3 tests passing

---

## Task 2: DFS and BFS Traversal (2 hours)
**Objective**: Implement depth-first and breadth-first search

Add methods:
- `dfs(start) -> Vec<usize>` - Depth-first search
- `_dfs_helper(node, visited)` - Recursive DFS
- `bfs(start) -> Vec<usize>` - Breadth-first search
- `_bfs_helper(start)` - Queue-based BFS

**Tests**: 5 unit tests
- DFS on simple graph
- DFS visit order correctness
- BFS on simple graph
- BFS level-by-level order
- DFS/BFS on disconnected components

**Acceptance**: 8+ total tests passing, traversal order verified

---

## Task 3: Shortest Paths and Components (2 hours)
**Objective**: Implement Dijkstra and connected components

Add methods:
- `dijkstra(start) -> Vec<u32>` - Shortest paths to all vertices
- `_dijkstra_helper(start)` - Using priority queue
- `connected_components() -> Vec<Vec<usize>>` - Find components
- `is_connected(u, v) -> bool` - Check connectivity

**Tests**: 4 unit tests
- Dijkstra on simple graph
- Dijkstra distances correct
- Connected components detection
- Single component graph

**Acceptance**: 12+ total tests passing, Dijkstra gives correct shortest paths

---

## Task 4: WASM Bindings (30 minutes)
**Objective**: Expose Graph to JavaScript

- Add `#[wasm_bindgen]` to Graph and GraphMetrics
- Methods: `new(vertices)`, `add_edge`, `dfs`, `bfs`, `dijkstra`, `components`, `get_metrics`
- Update `src/lib.rs`
- Run `wasm-pack build --target web --release`

**Acceptance**: No warnings, WASM compiles, 12+ tests passing

---

## Task 5: JavaScript Implementation (1.5 hours)
**Objective**: Create JavaScript Graph

Create `web/Graph.js`:
- Adjacency list representation
- DFS and BFS traversal
- Dijkstra's algorithm
- Connected components detection
- Identical interface to WASM

**Acceptance**: Syntax clean, produces same results as WASM

---

## Task 6: Benchmark Page and Blog (2 hours)
**Objective**: Interactive page and educational content

Create `web/benchmark-graph.html`:
- Graph density selector (sparse, medium, dense)
- Traversal comparison (DFS vs BFS)
- Shortest path visualization
- Connected components display
- Algorithm timing comparison

Create `blog/graph-deep-dive.md` (900 words):
- Graph representation trade-offs
- DFS algorithm and applications
- BFS algorithm and applications
- Dijkstra's shortest path algorithm
- Time complexity analysis (O(V+E), O(V²))
- Real-world applications: GPS, social networks
- Example: Finding shortest route on map

**Acceptance**: Page interactive, blog 900 words with detailed examples

---

## Success Criteria
- 12+ unit tests passing
- DFS/BFS correct traversal order
- Dijkstra gives correct shortest paths
- Connected components correctly identified
- O(V+E) performance for DFS/BFS
- O((V+E) log V) for Dijkstra with heap
- WASM binary < 200KB
- All metrics tracking properly
