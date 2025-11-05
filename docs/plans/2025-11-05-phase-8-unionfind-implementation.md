# Phase 8: Union-Find Implementation Plan

**6 Bite-Sized Tasks for Sequential Execution**

## Task 1: Core Union-Find Structure (1.5 hours)
**Objective**: Create UnionFind struct with parent tracking

Create `src/union_find.rs`:
```rust
pub struct UnionFind {
    parent: Vec<usize>,
    rank: Vec<u32>,
    size: Vec<u32>,
    component_count: u32,
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

**Tests**: 3 unit tests (constructor, initialization, basic structure)
**Acceptance**: Compiles, 3 tests passing

---

## Task 2: Find with Path Compression (1.5 hours)
**Objective**: Implement find with path compression optimization

Add methods:
- `find(x) -> usize` - Find root with path compression
- `_find_recursive(x) -> usize` - Recursive helper
- `_compress_path(x)` - Flatten tree on access
- `is_root(x) -> bool` - Check if x is root

**Tests**: 4 unit tests
- Find on single element
- Find on chain (shows compression)
- Multiple finds (compression effectiveness)
- Path remains valid after compression

**Acceptance**: 7+ total tests passing, nearly O(1) amortized

---

## Task 3: Union by Rank (1.5 hours)
**Objective**: Implement union with rank optimization

Add methods:
- `union(x, y) -> bool` - Union with rank heuristic
- `_union_by_rank(root_x, root_y)` - Rank-aware union
- `component_size(x) -> u32` - Size of x's component
- `component_count() -> u32` - Total components

**Tests**: 4 unit tests
- Union two separate components
- Union already-connected elements
- Rank increases correctly
- Component count decreases on union

**Acceptance**: 11+ total tests passing, union maintains shallow trees

---

## Task 4: WASM Bindings (30 minutes)
**Objective**: Expose UnionFind to JavaScript

- Add `#[wasm_bindgen]` to UnionFind and UnionFindMetrics
- Methods: `new(n)`, `find`, `union`, `connected`, `component_size`, `get_metrics`
- Update `src/lib.rs`
- Run `wasm-pack build --target web --release`

**Acceptance**: No warnings, WASM compiles, 11+ tests passing

---

## Task 5: JavaScript Implementation (1 hour)
**Objective**: Create JavaScript UnionFind

Create `web/UnionFind.js`:
- Same parent/rank arrays
- Path compression in find
- Union by rank
- Identical interface to WASM

**Acceptance**: Syntax clean, produces same results as WASM

---

## Task 6: Benchmark Page and Blog (2 hours)
**Objective**: Interactive page and educational content

Create `web/benchmark-unionfind.html`:
- Union sequence visualization
- Find operation tracking
- Compression effectiveness chart
- Component count over time

Create `blog/union-find-deep-dive.md` (800 words):
- Dynamic connectivity problem
- Naive vs optimized approaches
- Path compression technique
- Union by rank heuristic
- Amortized complexity analysis
- Applications: Kruskal's algorithm, social networks

**Acceptance**: Page interactive, blog 800 words

---

## Success Criteria
- 12+ unit tests passing
- Path compression reduces depth
- Union by rank keeps trees shallow
- Nearly O(1) amortized performance
- WASM binary < 200KB
- All metrics tracking properly
