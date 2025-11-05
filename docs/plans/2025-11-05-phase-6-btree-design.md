# Phase 6: B-Tree Implementation Design

**Date**: November 5, 2025
**Project**: wasm-data-structures
**Phase**: 6 (Sequential after Phase 5: Trie)

## Overview

This phase implements **B-Trees**, self-balancing trees optimized for disk I/O patterns. B-Trees are the foundation of modern databases and file systems.

**Educational goal**: Understand how data structures adapt to hardware constraints, why databases use B-Trees instead of binary trees, and how multi-way branching improves performance.

**Implementation pattern**: Rust (WASM) + JavaScript + Structure-specific metrics + Interactive benchmarks + Deep-dive blog post.

---

## Problem & Purpose

### Current State (Phase 5)
We implemented **Tries**, optimizing for string operations. But what about structures that optimize for disk access patterns?

**The Problem with Binary Trees**:
- Each node access = potential disk I/O
- Binary trees are "tall" (height = log₂(n))
- Many node accesses = many disk operations
- Disk I/O is 10,000x slower than memory access

### Solution: B-Trees
**B-Trees** reduce tree height by allowing multiple keys per node:
- All keys in range at one node (reduces height)
- Height = logₘ(n) where m = branching factor
- Fewer node accesses = fewer disk operations
- Optimal for database indices, file systems

### Learning Goal
Understand:
1. Multi-way trees vs binary trees
2. B-Tree invariants (balanced, ordered, degree constraints)
3. Insertion with node splitting
4. Deletion with merging/borrowing
5. Why databases choose B-Trees

---

## Design Details

### Rust Implementation (`src/btree.rs`)

#### Data Structures

```rust
pub struct BTree<K, V> {
    root: Box<BNode<K, V>>,
    degree: usize,          // min degree (branching factor)
    size: u32,
    metrics: BTreeMetrics,
}

struct BNode<K, V> {
    keys: Vec<K>,           // Sorted keys
    values: Vec<V>,         // Parallel values
    children: Vec<Box<BNode<K, V>>>,  // Child pointers (internal nodes)
    is_leaf: bool,          // Is this a leaf node?
}

#[wasm_bindgen]
pub struct BTreeMetrics {
    pub total_insertions: u32,
    pub total_searches: u32,
    pub total_splits: u32,
    pub max_height: u32,
    pub avg_node_size: f32,
    pub node_count: u32,
}
```

#### Key Methods

**`insert(key, value)`**
1. Find position to insert
2. If leaf is full (has 2t-1 keys), split before inserting
3. Recursively handle full children
4. Insert key-value pair maintaining order

**`search(key)`**
1. Start at root
2. Find child with key or smaller key
3. If found, return value
4. Otherwise search recursively in child

**`delete(key)`**
1. Find key in tree
2. If in leaf, remove directly
3. If in internal node, borrow from sibling or merge
4. Recursively handle underflow

**`split_child(parent, index)`**
1. Create new node with half the keys
2. Move middle key to parent
3. Update child pointers
4. Adjust parent keys

#### Metrics Strategy

- **total_insertions**: Count insert operations
- **total_searches**: Count search operations
- **total_splits**: Count node splits (shows rebalancing)
- **max_height**: Tree height (should be small even for large n)
- **avg_node_size**: Average keys per node
- **node_count**: Total nodes in tree

---

### JavaScript Implementation (`web/BTree.js`)

Identical algorithm to Rust with JavaScript objects/arrays.

---

### Benchmarking Strategy

#### Scenarios
1. Sequential insertion (shows splitting behavior)
2. Random insertion order
3. Mixed insert/search/delete workloads

#### Metrics to Display
- Tree height (should be log₂₀(n) vs log₂(n) for binary tree)
- Node count (fewer nodes than binary tree)
- Split count (shows rebalancing frequency)
- Search path length

#### Benchmark Page: `web/benchmark-btree.html`
- Branching factor selector (3, 5, 10, 20)
- Insertion pattern selector
- Tree statistics visualization
- Height comparison vs binary tree

---

### Educational Content

#### Blog Post: `blog/btree-deep-dive.md` (800-900 words)

**Sections:**
1. **Problem**: Why binary trees fail for disk storage
2. **Key insight**: Multi-way branching reduces height
3. **Architecture**: Nodes with k keys, k+1 children
4. **B-Tree invariants**: All leaves at same depth, balanced
5. **Operations**: Insert/search/delete with splitting/merging
6. **Real-world use**: Databases (B+ variant), file systems (NTFS, ext4)
7. **Variants**: B+ trees (keys in leaves), B* trees (fuller nodes)

---

## Testing Strategy

### Unit Tests (12+)
1. Basic insert/search
2. Node splitting on full nodes
3. Multiple insertions with splitting
4. Deletion with merging
5. Deletion with borrowing
6. Search in complex tree
7. In-order traversal
8. Large dataset (1000+ elements)
9. Metrics accuracy
10. Different branching factors
11. Leaf vs internal node operations
12. Empty tree operations

---

## Timeline
- **Rust struct + node structure:** 1-2 hours
- **Insert/search/split methods:** 2-3 hours
- **Delete with merging:** 1-2 hours
- **Unit tests (12+):** 1 hour
- **WASM bindings:** 30 minutes
- **JavaScript implementation:** 1 hour
- **Benchmark page:** 1 hour
- **Blog post:** 1 hour

**Total:** 10-14 hours

---

## Success Criteria

✅ B-Tree implemented in Rust with wasm-bindgen
✅ 12+ unit tests passing
✅ JavaScript implementation mirrors Rust
✅ WASM module compiles without warnings
✅ Interactive benchmark page
✅ Blog post explains multi-way trees
✅ All code committed and merged
