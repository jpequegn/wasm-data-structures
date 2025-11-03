# Phase 7: Red-Black Tree Implementation Design

**Date**: November 3, 2025
**Project**: wasm-data-structures
**Approach**: Modular Deep-Dive with Learning Focus
**Phase**: 7 (Sequential after Phase 6: Open Addressing)

## Overview

This phase implements **Red-Black Tree (RB-Tree)**, a self-balancing binary search tree that maintains O(log n) height guarantee using color invariants rather than complex rebalancing algorithms.

**Educational goal**: Understand self-balancing trees, how rotations work, and how color properties maintain balance.

**Implementation pattern**: Rust (WASM) + JavaScript + Structure-specific metrics + Interactive benchmarks + Deep-dive blog post.

---

## Problem & Purpose

### Current State (Phase 5)
We implemented an **unbalanced Binary Search Tree**:
- Simple algorithm (just compare and recurse)
- Worst case: O(n) if keys inserted in order
- No protection against skewed trees

**Problem:** Insertion order determines performance. Sorted keys → linear tree → O(n) operations.

### Solution: Self-Balancing Trees
**Red-Black Trees** automatically rebalance after each insertion/deletion, guaranteeing:
- Height ≤ 2 * log(n)
- All operations O(log n) worst case
- Simpler than AVL trees (AVL requires exact balance)

### Learning Goal
Understand:
1. How color invariants replace complex rebalancing
2. Tree rotations (left, right)
3. Color fixes (recoloring without rotation)
4. When each strategy applies

---

## Design Details

### Rust Implementation (`src/red_black_tree.rs`)

#### Data Structures

```rust
pub struct RedBlackTree {
    root: Option<Box<Node>>,
    metrics: RBTreeMetrics,
}

struct Node {
    key: String,
    value: u32,
    color: Color,  // Red or Black
    left: Option<Box<Node>>,
    right: Option<Box<Node>>,
    parent: Option<*mut Node>,  // Raw pointer to parent (for rotations)
}

enum Color {
    Red,
    Black,
}

pub struct RBTreeMetrics {
    pub total_insertions: u32,
    pub tree_height: u32,
    pub rebalance_count: u32,
    pub rotation_count: u32,
    pub color_fix_count: u32,
    pub average_depth: f32,
    pub balance_ratio: f32,
}
```

#### Key Methods

**`insert(key, value)`**
1. Insert like regular BST (find leaf position)
2. Color new node RED
3. Call `fix_insert()` to restore invariants

**`fix_insert()` - Maintain RB-Tree Properties**
- If uncle is RED: recolor parent, uncle, grandparent
- If uncle is BLACK: rotate and recolor

**`delete(key)`**
1. Delete like regular BST
2. If node was BLACK, call `fix_delete()` (black-height violated)

**Rotations** - Move subtrees to rebalance
```
Left rotation:
  A              B
   \    →       / \
    B          A   C
   / \
  C   D

Right rotation:
    A            C
   /    →       / \
  C            B   A
   \
    B
```

#### Metrics Strategy

- **tree_height**: Calculate on each change (recursive max depth)
- **rebalance_count**: Increment on every rotation or color fix
- **rotation_count**: Track left/right rotations separately
- **color_fix_count**: Non-rotation rebalances
- **average_depth**: Sum all distances / node count
- **balance_ratio**: Max path length / min path length

#### RB-Tree Invariants (Educational Value)

1. **Root is black** - Consistency
2. **Nil/leaf is black** - Convention
3. **Red → black children** - Prevents long red chains
4. **Equal black-height** - All paths equally "dark"

These constraints force O(log n) height mathematically.

---

### JavaScript Implementation (`web/RedBlackTree.js`)

Identical algorithm to Rust:
- Same node structure (using objects with properties)
- Same rotation logic
- Same color fix strategy
- Same metrics collection

**Key difference:** JavaScript uses prototypal inheritance; Rust uses explicit struct methods.

---

### Benchmarking Strategy

#### Benchmark Scenarios

1. **Random insertion order** - Good case, no rebalancing needed
2. **Sequential insertion (1, 2, 3...)** - Worst case for unbalanced, triggers rebalancing
3. **Reverse order (n, n-1, 1)** - Another bad case

#### Metrics to Display

| Metric | Insight |
|--------|---------|
| **tree_height** | "Is height truly logarithmic?" (compare to sequential) |
| **rotation_count** | "How much work is rebalancing?" (count rotations) |
| **rebalance_count** | "Is it mostly rotations or color fixes?" (efficiency) |
| **insertion time vs rotation count** | "Rotations are cheap!" |
| **Compare to unbalanced BST** | "See the difference: height grows with rebalances" |

#### Benchmark Page: `web/benchmark-red-black-tree.html`

- Side-by-side comparison: RB-Tree vs unbalanced BST
- Three insertion patterns (random, sequential, reverse)
- Visualization: tree structure with color coding (red/black nodes)
- Real-time metrics during benchmark
- Performance graphs

---

### Educational Content

#### Blog Post: `blog/red-black-tree-deep-dive.md` (600-800 words)

**Sections:**
1. **Problem**: Why balance matters (O(n) worst case)
2. **Solution overview**: RB-Tree as self-balancing approach
3. **The 5 invariants**: What they mean, why they work
4. **Rotations**: Visual examples, left/right cases
5. **Insertion algorithm**: Step-by-step with examples
6. **Color fixes**: When and why
7. **Performance**: Guarantees, complexity analysis
8. **Real-world examples**: Java TreeMap, C++ map
9. **RB-Tree vs AVL**: Trade-offs

---

## Testing Strategy

### Unit Tests (10+)

1. Basic insert/get/delete operations
2. All 5 RB-Tree invariants maintained
3. Rotation correctness (structure preserved, order maintained)
4. Color fix correctness (no invariant violations)
5. Height guarantee (height ≤ 2*log(n))
6. Metrics accuracy
7. Sequential insertion (worst case still O(log n))
8. Deletions trigger rebalancing
9. Complex patterns
10. Comparison with unbalanced BST metrics

### Integration Tests

- Benchmark suite runs without errors
- WASM and JavaScript produce identical results
- Blog post examples run correctly

---

## File Structure

```
src/red_black_tree.rs
  - RedBlackTree struct
  - Node, Color enum
  - insert, get, delete
  - fix_insert, fix_delete
  - rotate_left, rotate_right
  - 10+ unit tests

web/RedBlackTree.js
  - Identical algorithm to Rust
  - Same metrics
  - JavaScript implementation

web/benchmark-red-black-tree.html
  - Interactive benchmark interface
  - Side-by-side comparisons
  - Color visualization

blog/red-black-tree-deep-dive.md
  - 600-800 word deep dive
  - Algorithm explanation
  - Real-world examples
```

---

## Success Criteria

✅ RedBlackTree implemented in Rust with wasm-bindgen
✅ 10+ unit tests passing
✅ JavaScript implementation mirrors Rust
✅ WASM module compiles without warnings
✅ Interactive benchmark page with comparisons
✅ Blog post explains invariants and rotations
✅ Metrics show rebalancing activity
✅ Height stays O(log n) even with sequential input
✅ All code committed and merged

---

## Timeline

- **Rust struct + rotations:** 2-3 hours
- **Insert/delete + fixes:** 2-3 hours
- **Unit tests (10+):** 1 hour
- **WASM bindings:** 30 minutes
- **JavaScript implementation:** 1 hour
- **Benchmark page + metrics:** 1 hour
- **Blog post:** 1 hour
- **Final verification:** 30 minutes

**Total:** 9-12 hours focused work

---

## Notes

1. **Parent pointers**: RB-Tree rotations need parent references. Use `Option<Rc<RefCell<Node>>>` or raw pointers carefully.

2. **Color fixes vs rotations**: Most cases need only recoloring (cheap). Rotations (more expensive) happen less often.

3. **Testing invariants**: Write helper functions to verify all 5 invariants after each operation.

4. **Visualization opportunity**: Could show tree structure + rotation count in benchmark page (advanced).

5. **Compare to Phase 5**: Use same BST from Phase 5 in benchmarks. Show how RB-Tree's height stays controlled.

---

## Next Steps After Phase 7

1. Verify Phase 7 complete (all tests passing, blog post written)
2. Merge to main branch
3. Create Phase 8 worktree (Skip List)
4. Continue phased progression (Phases 8-9 follow same pattern)
5. Final: Create unified comparison page showing all 6 structures
