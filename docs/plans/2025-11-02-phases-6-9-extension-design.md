# Phases 6-9 Extension Design: Advanced Data Structures

**Date**: November 2, 2025
**Project**: wasm-data-structures
**Approach**: Modular Deep-Dive with Learning Focus
**Phases**: 6-9 (sequential, one structure per phase)

## Overview

This extension adds four advanced data structures to the benchmark project, building on the existing HashMap (separate chaining) and Binary Search Tree foundation. Each phase focuses on deep understanding of one alternative approach to data structure design.

**Educational goal**: Understand how different data structures solve similar problems with different trade-offs.

**Implementation pattern**: Each structure gets complete treatment in both Rust (WASM) and JavaScript, with structure-specific metrics, benchmarking, and educational content.

## Phase 6: Hash Table with Open Addressing

### Problem & Purpose
Current project uses **separate chaining** (buckets containing linked lists). Open addressing uses a different collision resolution strategy: probe the hash table itself to find empty slots.

**Learning goal**: Understand the trade-offs between collision strategies—separate chaining vs open addressing.

### Design Details

**Rust implementation** (`src/open_addressing.rs`):
- Fixed size hash table (e.g., 1024 slots)
- Linear probing: If slot occupied, try next slot, next+1, etc.
- Hash function: Same FNV-style as HashMap
- Public struct: `OpenAddressingHashTable`
- Methods: `insert(key, value) -> ()`, `get(key) -> Option<u32>`, `delete(key) -> Option<u32>`
- **Metrics struct** (`OpenAddressingMetrics`):
  - `total_insertions: u32`
  - `total_probes: u32` (critical: how many slots examined per insertion)
  - `max_probe_length: u32` (longest probe sequence)
  - `load_factor: f32` (size / capacity)
  - `clustering_factor: f32` (measure of primary/secondary clustering)
  - `tombstone_count: u32` (deleted entries marked as "tombstone", not removed)

**Key differences from HashMap**:
- Linear probing requires managing tombstones (deleted slots)
- Probe length directly impacts performance—visible as "clustering"
- Load factor is critical (once >0.75, performance degrades significantly)
- Must resize/rehash when capacity exceeded (vs HashMap just adds to chain)

**JavaScript implementation** (`web/OpenAddressingHashTable.js`):
- Identical algorithm to Rust version
- Same metrics collection
- Used for JS vs WASM comparison

### Benchmarking

**Benchmark metrics**:
- Insertion time vs load factor (visualize performance cliff at 0.75)
- Probe count distribution (show clustering growth)
- Comparison: separate chaining vs open addressing at same scale

**Benchmark page**: `web/benchmark-open-addressing.html`
- Interactive controls: adjust load factor, dataset size
- Visualizations: probe count histogram, clustering factor graph
- Real-time metrics display

### Educational Content

**Blog post**: `blog/open-addressing-deep-dive.md`
- Section 1: Collision resolution strategies (separate chaining vs open addressing)
- Section 2: Linear probing algorithm with step-by-step example
- Section 3: Clustering problem and why it matters
- Section 4: When to use open addressing (cache-friendly, predictable memory)
- Section 5: Performance vs separate chaining (graphs from benchmarks)
- Section 6: Tombstone strategy (why we can't just remove)

### Testing

**10+ unit tests** (`src/tests` for Rust, `web/tests` for JS):
1. Basic insert/get/delete operations
2. Collision handling (verify probing works)
3. Tombstone handling (delete doesn't corrupt table)
4. Metrics accuracy (probe count, load factor)
5. Resizing (table grows and rehashes correctly)
6. Edge cases (full table, all collisions, sequential keys)
7. Load factor impact on performance
8. Clustering detection

---

## Phase 7: Red-Black Tree

### Problem & Purpose
Current Binary Search Tree is unbalanced—worst case O(n) if keys inserted in order. Red-Black Tree self-balances using rotations, guaranteeing O(log n) height.

**Learning goal**: Understand self-balancing trees, tree rotations, and the properties that maintain balance.

### Design Details

**Rust implementation** (`src/red_black_tree.rs`):
- Node structure: value, color (Red/Black), left, right, parent
- Color property: Maintains balance invariants
  - 1. Root is black
  - 2. Leaves (None) are black
  - 3. Red node's children are black
  - 4. All paths to leaf have same black count
- Methods: `insert(key, value)`, `get(key)`, `delete(key)`
- Rebalancing: After insert/delete, perform color fixes and rotations
- Public struct: `RedBlackTree`
- **Metrics struct** (`RBTreeMetrics`):
  - `total_insertions: u32`
  - `tree_height: u32` (max depth)
  - `rebalance_count: u32` (rotations + color fixes)
  - `rotation_count: u32` (left and right rotations)
  - `color_fix_count: u32` (color rebalancing operations)
  - `average_depth: f32` (mean distance to leaf)
  - `balance_ratio: f32` (ratio of paths to leaves)

**Key differences from unbalanced BST**:
- Height guaranteed O(log n) vs O(n)
- Insertions trigger rebalancing—visible as rotation count
- Rotations are cheap but measurable
- Color invariants can be visualized

**JavaScript implementation** (`web/RedBlackTree.js`):
- Identical algorithm to Rust version
- Same metrics collection
- Visualization hints: can color nodes red/black in benchmark UI

### Benchmarking

**Benchmark metrics**:
- Insertion time (compare to unbalanced BST—much more consistent)
- Rebalance count vs insertion pattern (sequential, random, reverse)
- Tree height over time (stays log(n) vs linear growth of unbalanced tree)
- Rotation visualization (step through insertion showing rotations)

**Benchmark page**: `web/benchmark-red-black-tree.html`
- Side-by-side: RB-Tree vs unbalanced BST on same dataset
- Visualization: Tree structure with color coding
- Metrics: rotation count, rebalance operations
- Performance: insertion time vs dataset size

### Educational Content

**Blog post**: `blog/red-black-tree-deep-dive.md`
- Section 1: Balanced trees and why they matter (O(log n) guarantee)
- Section 2: Red-Black Tree properties (5 invariants)
- Section 3: Rotations (left, right, how they maintain structure)
- Section 4: Insertion algorithm with detailed example
- Section 5: Rebalancing cases (what triggers rotation, when color fixes work)
- Section 6: Performance analysis (rotations are cheap vs skewed trees)
- Section 7: Real-world example (Java TreeMap uses RB-Trees)

### Testing

**10+ unit tests**:
1. Basic insert/get/delete
2. Property maintenance (all 5 RB-Tree invariants)
3. Rotation correctness (structure preserved)
4. Color fix correctness
5. Height guarantee (verify height ≤ 2*log(n))
6. Metrics accuracy (rebalance count, rotation count)
7. Sequential insertions (verify no degeneration)
8. Deletions trigger rebalancing
9. Complex insertion patterns
10. Comparison benchmarks

---

## Phase 8: Skip List

### Problem & Purpose
RB-Trees are complex to implement and reason about. Skip Lists achieve same O(log n) performance guarantee using randomization instead of complex balancing.

**Learning goal**: Understand probabilistic data structures and how randomization can replace complex algorithms.

### Design Details

**Rust implementation** (`src/skip_list.rs`):
- Node structure: value, forward pointers (vec of next nodes at each level)
- Level assignment: Random (flip coins until tails—average height ~log(n))
- Methods: `insert(key, value)`, `get(key)`, `delete(key)`
- Search: Start at top level, move right until node > target, drop down
- Public struct: `SkipList`
- **Metrics struct** (`SkipListMetrics`):
  - `total_insertions: u32`
  - `max_level: u32` (highest level in current list)
  - `average_level: f32` (mean node level)
  - `comparisons_per_search: Vec<u32>` (track comparisons for each operation)
  - `total_forward_pointers: u32` (sum of all forward pointer counts)
  - `level_distribution: Vec<u32>` (histogram of node levels)

**Key differences from RB-Tree**:
- Probabilistic balance (randomness does the balancing)
- Simpler code (no rotation logic, no color invariants)
- Search is "zig-zag" pattern (right, then down)
- Different worst-case scenarios (rare, but possible to get unbalanced list)

**JavaScript implementation** (`web/SkipList.js`):
- Identical algorithm to Rust version
- Same metrics collection
- Visualization: show levels and forward pointers

### Benchmarking

**Benchmark metrics**:
- Insertion time (similar to RB-Tree, but variance higher due to randomness)
- Search time (verify O(log n) regardless of insertion order)
- Level distribution (verify matches theoretical distribution)
- Comparisons per operation (unique metric for skip lists)

**Benchmark page**: `web/benchmark-skip-list.html`
- Visualization: Skip list levels and forward pointers
- Metrics: level distribution histogram, comparisons per search
- Performance: insertion/search time vs RB-Tree side-by-side
- Randomness explorer: show different runs produce different structures

### Educational Content

**Blog post**: `blog/skip-list-deep-dive.md`
- Section 1: Randomized algorithms (why randomness works)
- Section 2: Skip List concept (layers of linked lists)
- Section 3: Level assignment (coin flips, probability)
- Section 4: Search algorithm (zig-zag traversal)
- Section 5: Insertion and deletion
- Section 6: Comparison to RB-Trees (simpler code, similar performance, different guarantees)
- Section 7: When to use (concurrent algorithms, priority queues, probabilistic advantage)
- Section 8: Probability analysis (expected height, search complexity)

### Testing

**10+ unit tests**:
1. Basic insert/get/delete
2. Level assignment randomness (verify distribution)
3. Forward pointers correct (can traverse at each level)
4. Search correctness (finds item regardless of level)
5. Metrics accuracy (level distribution, comparisons)
6. Level consistency (pointers maintain sorted order)
7. Edge cases (empty list, single item, all same level)
8. Multiple runs (different structures, same correctness)
9. Performance distribution (measure variance vs RB-Tree)
10. Concurrent patterns (insertion/deletion interleaved)

---

## Phase 9: Trie (Prefix Tree)

### Problem & Purpose
All previous structures optimize for key-value operations. Trie optimizes for **prefix operations**—find all keys starting with "ab", autocomplete, spell-checking.

**Learning goal**: Understand specialized index structures and when to use them for different problem domains.

### Design Details

**Rust implementation** (`src/trie.rs`):
- Node structure: children (HashMap/BTreeMap of char → Node), is_end (value at this node), value
- String keys only (unlike generic hash tables)
- Methods: `insert(key, value)`, `get(key)`, `delete(key)`, `get_all_with_prefix(prefix)`
- Prefix operations: Walk the trie following the prefix, then traverse subtree
- Public struct: `Trie`
- **Metrics struct** (`TrieMetrics`):
  - `total_insertions: u32`
  - `total_nodes: u32` (sum of all nodes)
  - `max_depth: u32` (longest key)
  - `average_depth: f32` (mean key length)
  - `branch_factor: f32` (average children per node)
  - `prefix_operation_count: u32` (how many prefix searches performed)
  - `nodes_visited_per_prefix: Vec<u32>` (distribution)

**Key differences from previous structures**:
- String-specific (character keys, not generic hashable keys)
- Prefix operations are native (not a workaround)
- Memory trade-off: uses more memory for common prefixes
- Different performance profile: exact match O(m) where m=key length

**JavaScript implementation** (`web/Trie.js`):
- Identical algorithm to Rust version
- Same metrics collection
- Can visualize trie structure

### Benchmarking

**Benchmark metrics**:
- Insertion time (per character of key, not per operation)
- Exact match lookup (O(m) where m=key length)
- Prefix match performance (find all keys starting with prefix)
- Memory usage comparison to HashMap
- Distribution-specific metrics (random words vs English dictionary)

**Benchmark page**: `web/benchmark-trie.html`
- Visualization: Trie structure (node graph)
- Metrics: node count, depth, branch factor
- Performance: insertion, exact match, prefix match (unique to trie)
- Use cases: demonstrate autocomplete, spell checking

### Educational Content

**Blog post**: `blog/trie-deep-dive.md`
- Section 1: Specialized data structures (not always generic hash tables)
- Section 2: Trie concept (tree of characters)
- Section 3: Prefix operations (the trie's superpower)
- Section 4: Insertion and exact match
- Section 5: Prefix search and traversal
- Section 6: Memory analysis (why tries use more memory, when it's worth it)
- Section 7: Real-world applications (autocomplete, spell check, IP routing, regex)
- Section 8: Variants (compressed tries, ternary search trees)

### Testing

**10+ unit tests**:
1. Basic insert/get/delete
2. String-specific operations (insertion, lookup)
3. Prefix operations (find all with prefix)
4. Metrics accuracy (node count, depth)
5. Empty prefix (find all keys)
6. No match cases
7. Partial key matches
8. Branch factor tracking
9. Memory characteristics
10. Real-world data (English dictionary, domain names)

---

## Cross-Cutting Concerns

### Unified Benchmark Comparison Page
After all 4 phases, create `web/benchmark-all-extended.html` that compares:
- All 6 structures (HashMap separate chaining, BST, Open Addressing, RB-Tree, Skip List, Trie)
- Same 10,000-item dataset
- Performance metrics (insertion, search, memory)
- When to use each structure
- Trade-offs visualization

### Unified Blog Post
`blog/data-structures-complete-guide.md` ties all 6 structures together:
- When to use each one
- Performance summary table
- Decision tree (is performance critical? need ordering? prefix operations?)
- Implementation complexity trade-offs

### Project Structure
```
src/
  ├── lib.rs (exports all structures)
  ├── hashmap.rs (existing, Phase 1)
  ├── bst.rs (existing, Phase 5)
  ├── open_addressing.rs (Phase 6)
  ├── red_black_tree.rs (Phase 7)
  ├── skip_list.rs (Phase 8)
  └── trie.rs (Phase 9)

web/
  ├── HashMap.js (existing)
  ├── BinarySearchTree.js (existing)
  ├── OpenAddressingHashTable.js
  ├── RedBlackTree.js
  ├── SkipList.js
  ├── Trie.js
  ├── benchmark.html (existing)
  ├── benchmark-open-addressing.html
  ├── benchmark-red-black-tree.html
  ├── benchmark-skip-list.html
  ├── benchmark-trie.html
  └── benchmark-all-extended.html

blog/
  ├── data-structures-showdown.md (existing, Phases 1-5)
  ├── open-addressing-deep-dive.md (Phase 6)
  ├── red-black-tree-deep-dive.md (Phase 7)
  ├── skip-list-deep-dive.md (Phase 8)
  ├── trie-deep-dive.md (Phase 9)
  └── data-structures-complete-guide.md (final summary)

docs/
  └── plans/
      ├── 2025-11-02-phase-1-hashmap-design.md (existing)
      ├── 2025-11-02-phases-2-5-implementation.md (existing)
      └── 2025-11-02-phases-6-9-extension-design.md (this file)
```

### Testing Strategy
- **Unit tests**: 10+ per structure (existing pattern)
- **Integration tests**: All 6 structures in same benchmark suite
- **Metrics validation**: Verify each structure's metrics match theoretical expectations
- **Performance regression**: Track if optimizations or changes break performance guarantees

### Git Workflow
- Branch: `phases-6-9-extension` (or use git worktree per phase)
- Commit per phase after complete implementation + tests + blog post
- Final commit: unified comparison pages and complete guide

---

## Success Criteria

**Per phase**:
- ✅ Rust implementation with 10+ tests passing
- ✅ JavaScript implementation mirroring Rust
- ✅ WASM compilation without warnings
- ✅ Interactive benchmark page with structure-specific metrics
- ✅ Deep-dive blog post (500-800 words) with educational examples
- ✅ All metrics verified against theoretical expectations
- ✅ Performance benchmarks at 100, 500, 1k, 5k, 10k items

**Overall project**:
- ✅ 6 data structures total (HashMap, BST, Open Addressing, RB-Tree, Skip List, Trie)
- ✅ 6 interactive benchmark pages (one per structure, one unified)
- ✅ 6 educational blog posts (one per new structure, one final guide)
- ✅ 60+ unit tests (10 per structure)
- ✅ Complete guide showing when to use each structure
- ✅ All code on GitHub with educational content

---

## Timeline Estimate

- **Phase 6** (Open Addressing): ~2-3 hours (simpler than RB-Tree)
- **Phase 7** (RB-Tree): ~4-5 hours (complex balancing logic)
- **Phase 8** (Skip List): ~2-3 hours (elegant but unfamiliar)
- **Phase 9** (Trie): ~2-3 hours (straightforward but different domain)
- **Final polish**: ~1-2 hours (unified page, complete guide)

**Total**: ~12-16 hours of focused work

---

## Next Steps

1. Validate this design document
2. Set up git worktree for Phase 6
3. Create implementation plan for Phase 6 (Open Addressing)
4. Execute Phase 6 with tests and blog post
5. Repeat for Phases 7-9
6. Create final unified comparison and guide
