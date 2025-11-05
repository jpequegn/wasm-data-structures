# Phase 8: Union-Find (Disjoint Set) Implementation Design

**Date**: November 5, 2025
**Project**: wasm-data-structures
**Phase**: 8 (Sequential after Phase 7: Heap)

## Overview

This phase implements **Union-Find (Disjoint Set Union)**, a data structure for fast connectivity queries with path compression and union by rank.

**Educational goal**: Understand how to optimize for amortized O(1) operations, nearly-constant time amortization, and practical applications in graph connectivity.

---

## Problem & Purpose

### Current State (Phase 7)
We implemented **Heaps** for priority operations. Now we explore structures optimized for **connectivity and grouping**.

**The Problem**:
- Need to track connected components
- Need fast "are two elements connected?" queries
- Need fast "connect two components" operations
- Naive approach: O(n) for each query

### Solution: Union-Find
**Union-Find** uses optimizations:
- Path compression: Flatten tree on access
- Union by rank: Keep trees shallow
- Achieves nearly O(1) amortized time

### Learning Goal
1. Disjoint sets and union operations
2. Path compression optimization
3. Union by rank heuristic
4. Amortized complexity analysis
5. Applications: Kruskal's algorithm, network connectivity

---

## Design Details

### Rust Implementation (`src/union_find.rs`)

```rust
pub struct UnionFind {
    parent: Vec<usize>,        // Parent pointers
    rank: Vec<u32>,            // Rank for union by rank
    size: Vec<u32>,            // Component sizes
    component_count: u32,      // Number of components
    metrics: UnionFindMetrics,
}

#[wasm_bindgen]
pub struct UnionFindMetrics {
    pub total_unions: u32,
    pub total_finds: u32,
    pub total_compressions: u32,
    pub max_depth: u32,
    pub component_count: u32,
}
```

#### Key Methods

**`find(x) -> usize`**
1. Follow parent pointers to root
2. Path compression: Update pointers on path
3. Return root
4. Nearly O(1) amortized

**`union(x, y) -> bool`**
1. Find roots of x and y
2. Union by rank: Attach smaller tree under larger
3. Update component count
4. Return true if union happened

**`connected(x, y) -> bool`**
1. Return find(x) == find(y)
2. Checks if in same component

**`component_size(x) -> u32`**
1. Return size of x's component

---

### JavaScript Implementation (`web/UnionFind.js`)

Same algorithm with JavaScript arrays.

---

### Benchmarking Strategy

#### Scenarios
1. Sequential unions (building forest)
2. Random unions
3. Mixed union/find operations

#### Metrics
- Find operations and compression count
- Union operations and rank changes
- Max tree depth (shows compression effectiveness)
- Component count changes

---

### Educational Content

#### Blog Post: `blog/union-find-deep-dive.md` (800 words)

**Sections:**
1. **Problem**: Connectivity in dynamic graphs
2. **Naive approach**: O(n) per query
3. **Union-Find idea**: Forest of trees with root as representative
4. **Path compression**: Flatten on access
5. **Union by rank**: Keep trees shallow
6. **Amortized analysis**: Nearly O(1)
7. **Applications**: Kruskal's MST, LCA queries, social networks

---

## Timeline
- **Rust struct + find/union:** 1-2 hours
- **Path compression + rank:** 1 hour
- **Unit tests (10+):** 1 hour
- **WASM bindings:** 30 minutes
- **JavaScript implementation:** 1 hour
- **Benchmark page:** 1 hour
- **Blog post:** 1 hour

**Total:** 7-10 hours

---

## Success Criteria

✅ Union-Find implemented with optimizations
✅ 10+ unit tests passing
✅ Path compression working
✅ Union by rank working
✅ Nearly O(1) amortized performance verified
✅ Blog post explains optimization techniques
