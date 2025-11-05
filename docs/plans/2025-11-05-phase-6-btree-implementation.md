# Phase 6: B-Tree Implementation Plan

**6 Bite-Sized Tasks for Sequential Execution**

## Task 1: Core B-Tree Structure (2-3 hours)
**Objective**: Create BNode and BTree structs

Create `src/btree.rs` with:
```rust
struct BNode<K, V> {
    keys: Vec<K>,
    values: Vec<V>,
    children: Vec<Box<BNode<K, V>>>,
    is_leaf: bool,
}

pub struct BTree<K, V> {
    root: Box<BNode<K, V>>,
    degree: usize,  // t parameter: min degree
    size: u32,
    metrics: BTreeMetrics,
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

**Tests**: 3 unit tests (constructor, basic structure, metrics init)
**Acceptance**: Compiles without warnings, 3 tests passing

---

## Task 2: Search and Insert Methods (2-3 hours)
**Objective**: Implement insert and search

Add methods:
- `insert(key, value)` - Handle node splitting if full
- `search(key) -> Option<V>` - Search through tree
- `_search_helper(node, key)` - Recursive search
- `_insert_non_full(node, key, value)` - Insert into non-full node
- `_split_child(parent, index)` - Split full child node

**Tests**: 6 unit tests
- Basic insert and search
- Insert into full node (triggers split)
- Multiple insertions with splits
- Search in tree with splits
- Metrics accuracy
- Non-existent key search

**Acceptance**: 9+ total tests passing, all insert/search operations correct

---

## Task 3: Delete and Range Operations (1-2 hours)
**Objective**: Implement delete and traversal

Add methods:
- `delete(key) -> bool` - Delete key from tree
- `_delete_from_node(node, key)` - Recursive deletion
- `_merge_children(parent, index)` - Merge underflowed children
- `_borrow_from_sibling(parent, index)` - Borrow from sibling
- `range_search(start_key, end_key) -> Vec<V>` - Range query

**Tests**: 4 unit tests
- Delete leaf node key
- Delete internal node key (with merging)
- Delete with borrowing from sibling
- Range search operation

**Acceptance**: 13+ total tests passing, deletion maintains tree invariants

---

## Task 4: WASM Bindings (30 minutes)
**Objective**: Expose B-Tree to JavaScript

- Add `#[wasm_bindgen]` to BTree and BTreeMetrics
- Add public methods: `new(degree)`, `insert`, `search`, `delete`, `get_metrics`
- Update `src/lib.rs`: `pub mod btree;` and `pub use btree::{BTree, BTreeMetrics};`
- Run `wasm-pack build --target web --release`

**Acceptance**: No warnings, WASM compiles, 13+ tests still passing

---

## Task 5: JavaScript Implementation (1 hour)
**Objective**: Create JavaScript B-Tree

Create `web/BTree.js`:
- BNode class with keys, values, children, isLeaf
- BTree class with identical algorithm
- Benchmark functions in `web/benchmark-wasm.js`

**Acceptance**: Syntax clean, benchmarks return consistent results

---

## Task 6: Benchmark Page and Blog (2 hours)
**Objective**: Interactive page and educational content

Create `web/benchmark-btree.html`:
- Branching factor selector (3, 5, 10, 20)
- Insertion pattern selector (sequential, random, reverse)
- Real-time metrics display
- Height comparison with binary tree

Create `blog/btree-deep-dive.md` (800 words):
- Why binary trees fail for disk I/O
- B-Tree multi-way branching concept
- Insertion with splitting visualization
- Real-world databases (SQLite, MongoDB)
- B+ vs B* variant comparisons

**Acceptance**: Page works without errors, blog is 800 words with examples

---

## Success Criteria
- 12+ unit tests passing
- WASM binary < 200KB
- Benchmark page interactive
- Blog post explains disk I/O optimization
- All code compiles without warnings
