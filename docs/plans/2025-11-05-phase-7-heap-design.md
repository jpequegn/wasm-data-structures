# Phase 7: Heap / Priority Queue Implementation Design

**Date**: November 5, 2025
**Project**: wasm-data-structures
**Phase**: 7 (Sequential after Phase 6: B-Tree)

## Overview

This phase implements **Binary Heaps**, complete and balanced binary trees optimized for priority queue operations.

**Educational goal**: Understand complete binary trees, heap property, and why heaps are ideal for priority queues and heap sort.

---

## Problem & Purpose

### Current State (Phase 6)
We implemented **B-Trees** for disk-optimized storage. Now we explore structure optimized for **fast min/max extraction**.

**Why Heaps?**
- Priority queues need efficient min/max access
- Heap guarantees O(1) access, O(log n) insert/delete
- Complete binary tree allows array storage (no pointers needed)
- Used in Dijkstra, heap sort, OS task scheduling

### Solution: Binary Heap
**Min/Max Heaps** maintain heap property:
- Parent ≤ children (min heap)
- Parent ≥ children (max heap)
- Complete binary tree (all levels filled except last)
- Array-based storage (implicit tree structure)

### Learning Goal
1. Complete binary trees vs general trees
2. Heap property and invariants
3. Percolation (bubble up/down)
4. Heap sort algorithm
5. Priority queue applications

---

## Design Details

### Rust Implementation (`src/heap.rs`)

```rust
pub struct Heap<T: Ord + Clone> {
    items: Vec<T>,
    is_min_heap: bool,
    metrics: HeapMetrics,
}

#[wasm_bindgen]
pub struct HeapMetrics {
    pub total_insertions: u32,
    pub total_deletions: u32,
    pub total_percolations: u32,
    pub heap_size: u32,
    pub max_depth: u32,
}
```

#### Key Methods

**`insert(item)`**
1. Add item to end of vector
2. Percolate up (swap with parent if violates heap property)
3. Update metrics

**`extract_min() / extract_max()`**
1. Return root (minimum/maximum)
2. Move last item to root
3. Percolate down
4. Update metrics

**`peek_min() / peek_max()`**
1. Return root without removing
2. O(1) operation

**`heapify(vec)`**
1. Convert arbitrary vector to heap
2. Percolate down from last non-leaf node
3. O(n) operation

---

### JavaScript Implementation (`web/Heap.js`)

Same algorithm with JavaScript arrays.

---

### Benchmarking Strategy

#### Scenarios
1. Build heap from random data
2. Extract all elements (priority queue drain)
3. Mixed insert/extract operations

#### Metrics
- Insertion count and time
- Extraction count and time
- Percolation count (rebalancing measure)
- Heap property violations (none = correct)

---

### Educational Content

#### Blog Post: `blog/heap-deep-dive.md` (800 words)

**Sections:**
1. **Problem**: Need fast min/max access
2. **Key insight**: Complete binary tree with heap property
3. **Array representation**: Index math for parent/child
4. **Percolation**: Bubble up and down operations
5. **Heap sort**: Using heap for sorting
6. **Priority queues**: Applications in real systems
7. **Min vs max heaps**: Trade-offs

---

## Timeline
- **Rust struct + percolation:** 1-2 hours
- **Insert/extract/heapify:** 1-2 hours
- **Unit tests (10+):** 1 hour
- **WASM bindings:** 30 minutes
- **JavaScript implementation:** 1 hour
- **Benchmark page:** 1 hour
- **Blog post:** 1 hour

**Total:** 8-11 hours

---

## Success Criteria

✅ Min and Max Heap implemented
✅ 10+ unit tests passing
✅ O(1) peek, O(log n) insert/delete
✅ Heap sort working
✅ All metrics tracking
✅ Blog post explains priority queues
