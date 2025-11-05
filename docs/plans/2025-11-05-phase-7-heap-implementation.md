# Phase 7: Heap Implementation Plan

**6 Bite-Sized Tasks for Sequential Execution**

## Task 1: Core Heap Structure (1-2 hours)
**Objective**: Create Heap struct with array-based storage

Create `src/heap.rs`:
```rust
pub struct Heap<T: Ord + Clone> {
    items: Vec<T>,
    is_min_heap: bool,
    metrics: HeapMetrics,
}

#[wasm_bindgen]
pub struct HeapMetrics {
    pub total_insertions: u32,
    pub total_extractions: u32,
    pub total_percolations: u32,
    pub heap_size: u32,
    pub max_depth: u32,
}
```

Helper methods:
- `parent(index) -> usize` - Get parent index
- `left_child(index) -> usize` - Get left child index
- `right_child(index) -> usize` - Get right child index
- `is_min_heap() -> bool` - Check heap type

**Tests**: 3 unit tests (constructor, index math, empty heap)
**Acceptance**: Compiles, 3 tests passing

---

## Task 2: Insert and Peek (1.5 hours)
**Objective**: Implement insertion with percolation

Add methods:
- `insert(item)` - Add to end, percolate up
- `_percolate_up(index)` - Bubble up to correct position
- `peek() -> Option<&T>` - O(1) min/max access
- `is_empty() -> bool` - Check if empty

**Tests**: 4 unit tests
- Insert single item
- Insert multiple items (multiple percolations)
- Peek on heap
- Insert maintaining heap property

**Acceptance**: 7+ total tests passing, O(log n) insertion verified

---

## Task 3: Extract and Heapify (1.5 hours)
**Objective**: Implement deletion and heap building

Add methods:
- `extract() -> Option<T>` - Remove and return min/max
- `_percolate_down(index)` - Bubble down to correct position
- `heapify(vec) -> Self` - O(n) heap building
- `_compare(a, b) -> bool` - Handle min/max comparison

**Tests**: 4 unit tests
- Extract from single-item heap
- Extract from multi-item heap (percolation down)
- Heapify random array
- Heap property maintained after extraction

**Acceptance**: 11+ total tests passing, extraction O(log n)

---

## Task 4: WASM Bindings (30 minutes)
**Objective**: Expose Heap to JavaScript

- Generic `T` must be `u32` for WASM (simple integer heap)
- Add `#[wasm_bindgen]` wrapper: `HeapU32`
- Methods: `new(is_min)`, `insert`, `extract`, `peek`, `get_metrics`
- Update `src/lib.rs`
- Run `wasm-pack build --target web --release`

**Acceptance**: No warnings, WASM compiles, 11+ tests passing

---

## Task 5: JavaScript Implementation (1 hour)
**Objective**: Create JavaScript Heap

Create `web/Heap.js`:
- Generic Heap class with comparator
- Same percolation logic
- Benchmark functions for WASM/JS comparison

**Acceptance**: Syntax clean, benchmarks match WASM results

---

## Task 6: Benchmark Page and Blog (2 hours)
**Objective**: Interactive page and educational content

Create `web/benchmark-heap.html`:
- Min/Max heap selector
- Insert/extract operations
- Heap sort demonstration
- Percolation count visualization

Create `blog/heap-deep-dive.md` (800 words):
- Complete binary tree concept
- Heap property explanation
- Percolation algorithms with diagrams
- Heap sort algorithm walkthrough
- Priority queue applications

**Acceptance**: Page interactive, blog 800 words with examples

---

## Success Criteria
- 12+ unit tests passing
- O(1) peek, O(log n) insert/extract
- Heap sort working correctly
- WASM binary < 200KB
- All metrics tracking properly
