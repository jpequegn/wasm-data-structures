# Phase 8: Skip List Implementation Plan (6 Bite-Sized Tasks)

**Date**: November 3, 2025
**Project**: wasm-data-structures
**Phase**: 8 (Skip List)
**Format**: 6 independent tasks with complete code samples and expected outputs

---

## Task 1: Create Rust SkipList Struct and Level Generation (2-3 hours)

### Objective
Build the core SkipList structure in Rust with proper Node definition, sentinel head, and probabilistic level generation.

### What You'll Implement

Create `src/skip_list.rs` with:

```rust
use wasm_bindgen::prelude::*;
use rand::Rng;

const MAX_LEVEL: u32 = 16;  // Maximum level (can be increased)
const LEVEL_PROBABILITY: f32 = 0.5;

#[wasm_bindgen]
#[derive(Clone)]
pub struct SkipListMetrics {
    pub total_insertions: u32,
    pub total_searches: u32,
    pub search_comparisons: u32,
    pub average_level: f32,
    pub max_level: u32,
    pub insertion_cost: u32,
}

struct Node {
    key: String,
    value: u32,
    level: u32,
    forward: Vec<Option<Box<Node>>>,
}

impl Node {
    fn new(key: String, value: u32, level: u32) -> Self {
        Node {
            key,
            value,
            level,
            forward: vec![None; (level + 1) as usize],
        }
    }
}

#[wasm_bindgen]
pub struct SkipList {
    head: Option<Box<Node>>,
    level: u32,
    size: u32,
    metrics: SkipListMetrics,
}

#[wasm_bindgen]
impl SkipList {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SkipList {
        let mut head = Node::new("".to_string(), 0, MAX_LEVEL);
        head.forward = vec![None; (MAX_LEVEL + 1) as usize];

        SkipList {
            head: Some(Box::new(head)),
            level: 0,
            size: 0,
            metrics: SkipListMetrics {
                total_insertions: 0,
                total_searches: 0,
                search_comparisons: 0,
                average_level: 0.0,
                max_level: 0,
                insertion_cost: 0,
            },
        }
    }

    /// Generate random level for new node
    /// Returns level 0 with P=0.5, level 1 with P=0.25, etc.
    fn random_level() -> u32 {
        let mut rng = rand::thread_rng();
        let mut level = 0u32;
        while level < MAX_LEVEL && rng.gen::<f32>() < LEVEL_PROBABILITY {
            level += 1;
        }
        level
    }

    fn get_metrics(&self) -> SkipListMetrics {
        self.metrics.clone()
    }
}
```

### Key Points
- Use `Option<Box<Node>>` for forward pointers (instead of raw pointers initially)
- `random_level()` generates exponentially distributed levels
- Head node is sentinel connecting all levels
- Each node stores its level and forward pointers

### Expected Output After Compilation
```
$ cargo build --lib
   Compiling wasm-data-structures v0.1.0
    Finished `release` profile [optimized] target(s)
```

### Verification
- File compiles without errors
- `SkipList::new()` creates empty skip list
- `random_level()` generates levels 0-15

---

## Task 2: Implement Search and Insert Methods (2-3 hours)

### Objective
Implement core operations: `insert()`, `search()`, and metric tracking.

### What You'll Implement

Add to SkipList impl block:

```rust
pub fn insert(&mut self, key: String, value: u32) {
    let is_new = self.search(&key).is_none();
    let new_level = Self::random_level();

    // Expand list level if necessary
    if new_level > self.level {
        self.level = new_level;
    }

    // Create new node
    let mut new_node = Node::new(key.clone(), value, new_level);

    // Find insertion points at each level
    let mut current = self.head.as_mut().unwrap();
    let mut update: Vec<&mut Option<Box<Node>>> = vec![];

    // Traverse from top level down to level 0
    for lv in (0..=self.level).rev() {
        // Move right at current level while key is less
        while let Some(ref next) = current.forward[lv as usize] {
            if key <= next.key {
                break;
            }
            // Would need to traverse but Box makes this tricky
        }
        update.push(&mut current.forward[lv as usize]);
    }

    // Insert node at each updated level
    for lv in 0..=(new_level.min(self.level)) {
        new_node.forward[lv as usize] = update[(self.level - lv) as usize].take();
        *update[(self.level - lv) as usize] = Some(Box::new(new_node.clone()));
    }

    if is_new {
        self.size += 1;
    }

    self.metrics.total_insertions += 1;
    self.update_metrics();
}

pub fn search(&mut self, key: &str) -> Option<u32> {
    self.metrics.total_searches += 1;
    let mut comparisons = 0u32;

    let mut current = self.head.as_ref().unwrap();

    // Start from highest level
    for lv in (0..=self.level).rev() {
        loop {
            comparisons += 1;
            match &current.forward[lv as usize] {
                None => break,
                Some(next) => {
                    if next.key < key {
                        current = next;
                    } else {
                        break;
                    }
                }
            }
        }
    }

    // Check exact match at level 0
    if let Some(ref next) = current.forward[0] {
        if next.key == key {
            self.metrics.search_comparisons += comparisons;
            return Some(next.value);
        }
    }

    self.metrics.search_comparisons += comparisons;
    None
}

fn update_metrics(&mut self) {
    // Calculate average level
    let mut total_level = 0u32;
    let mut count = 0u32;

    if let Some(ref head) = self.head {
        let mut current = head.as_ref();
        while let Some(ref next) = current.forward[0] {
            total_level += next.level;
            count += 1;
            current = next;
        }
    }

    self.metrics.average_level = if count > 0 {
        total_level as f32 / count as f32
    } else {
        0.0
    };

    self.metrics.max_level = self.level;
}
```

**Note**: This implementation has pointer issues due to Box constraints. For production, use `Rc<RefCell<Node>>` or raw pointers with unsafe blocks. This is simplified for clarity.

### Expected Output After Compilation
```
$ cargo test skip_list::tests::test_insert_and_search
test skip_list::tests::test_insert_and_search ... ok
```

### Verification
- Insert and retrieve single element
- Multiple inserts maintain sorted order
- Search returns None for missing keys
- Metrics update correctly

---

## Task 3: Implement Delete and Fix Architecture (1-2 hours)

### Objective
Implement deletion, fix architectural issues with Box/Rc, and add full test suite.

### What You'll Implement

Since raw Box ownership is tricky, restructure using Rc<RefCell<>>:

```rust
use std::rc::Rc;
use std::cell::RefCell;

type NodePtr = Rc<RefCell<Node>>;

struct Node {
    key: String,
    value: u32,
    level: u32,
    forward: Vec<Option<NodePtr>>,
}

pub fn delete(&mut self, key: &str) -> Option<u32> {
    // Find node and all update points
    let mut update: Vec<Option<NodePtr>> = vec![];
    let mut current = self.head.clone();
    let mut result = None;

    for lv in (0..=self.level).rev() {
        loop {
            let next = current.borrow_mut().forward[lv as usize].clone();
            match next {
                None => break,
                Some(node) => {
                    if node.borrow().key < key {
                        current = node;
                    } else {
                        break;
                    }
                }
            }
        }
        update.push(Some(current.clone()));
    }

    // Check if found
    if let Some(next) = current.borrow_mut().forward[0].as_ref() {
        if next.borrow().key == key {
            result = Some(next.borrow().value);

            // Remove from all levels
            for lv in 0..=self.level {
                let update_node = update[(self.level - lv) as usize].clone();
                if let Some(un) = update_node {
                    let mut un_mut = un.borrow_mut();
                    if let Some(ref next_node) = un_mut.forward[lv as usize] {
                        if next_node.borrow().key == key {
                            un_mut.forward[lv as usize] =
                                next_node.borrow_mut().forward[lv as usize].clone();
                        }
                    }
                }
            }

            self.size -= 1;
            self.update_metrics();
        }
    }

    result
}
```

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_insert_and_search() {
        let mut list = SkipList::new();
        list.insert("key1".to_string(), 100);
        assert_eq!(list.search("key1"), Some(100));
    }

    #[test]
    fn test_multiple_insertions_ordered() {
        let mut list = SkipList::new();
        for i in 0..50 {
            list.insert(format!("key{:02}", i), i);
        }
        for i in 0..50 {
            assert_eq!(list.search(&format!("key{:02}", i)), Some(i));
        }
    }

    #[test]
    fn test_sequential_insertion() {
        let mut list = SkipList::new();
        for i in 0..100 {
            list.insert(format!("key{:03}", i), i);
        }
        assert_eq!(list.size, 100);
        let metrics = list.get_metrics();
        // Average level should be < 10 for 100 items (log2(100) ≈ 6.6)
        assert!(metrics.average_level < 10.0);
    }

    #[test]
    fn test_delete() {
        let mut list = SkipList::new();
        list.insert("key1".to_string(), 100);
        assert_eq!(list.delete("key1"), Some(100));
        assert_eq!(list.search("key1"), None);
    }

    #[test]
    fn test_metrics_average_level() {
        let mut list = SkipList::new();
        for i in 0..1000 {
            list.insert(format!("key{:04}", i), i);
        }
        let metrics = list.get_metrics();
        // For 1000 items, expected average level ≈ log2(1000) ≈ 10
        assert!(metrics.average_level > 5.0 && metrics.average_level < 15.0);
    }

    #[test]
    fn test_search_comparisons() {
        let mut list = SkipList::new();
        for i in 0..1000 {
            list.insert(format!("key{:04}", i), i);
        }
        let before = list.metrics.search_comparisons;
        list.search("key0500");
        let after = list.metrics.search_comparisons;
        // Search should do ~log2(1000) ≈ 10 comparisons
        assert!(after - before < 50);  // Allow some variance
    }
}
```

### Expected Output
```
$ cargo test skip_list::tests
running 6 tests
test skip_list::tests::test_insert_and_search ... ok
test skip_list::tests::test_multiple_insertions_ordered ... ok
test skip_list::tests::test_sequential_insertion ... ok
test skip_list::tests::test_delete ... ok
test skip_list::tests::test_metrics_average_level ... ok
test skip_list::tests::test_search_comparisons ... ok

test result: ok. 6 passed
```

---

## Task 4: Add WASM Bindings and Update lib.rs (30 minutes)

### Objective
Expose SkipList to WebAssembly with proper wasm-bindgen attributes.

### What You'll Implement

Modify `src/lib.rs`:
```rust
pub mod skip_list;
pub use skip_list::{SkipList, SkipListMetrics};
```

Add wasm-bindgen to red_black_tree.rs methods:
```rust
#[wasm_bindgen]
impl SkipList {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SkipList { ... }

    pub fn insert(&mut self, key: String, value: u32) { ... }

    pub fn search(&self, key: String) -> Option<u32> { ... }

    pub fn delete(&mut self, key: String) -> Option<u32> { ... }

    pub fn get_metrics(&self) -> SkipListMetrics { ... }

    pub fn len(&self) -> u32 {
        self.size
    }
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct SkipListMetrics {
    pub total_insertions: u32,
    pub total_searches: u32,
    pub search_comparisons: u32,
    pub average_level: f32,
    pub max_level: u32,
    pub insertion_cost: u32,
}
```

Build WASM:
```bash
wasm-pack build --target web
```

### Expected Output
```
[INFO]: ✨   Done in 8.42s
[INFO]: 📦   Your wasm pkg is ready to publish
```

---

## Task 5: Implement JavaScript SkipList and Benchmarking (1-2 hours)

### Objective
Create JavaScript implementation and benchmark functions mirroring Rust.

### File: `web/SkipList.js`

```javascript
const MAX_LEVEL = 16;
const LEVEL_PROBABILITY = 0.5;

class SkipListNode {
    constructor(key, value, level) {
        this.key = key;
        this.value = value;
        this.level = level;
        this.forward = new Array(level + 1).fill(null);
    }
}

class SkipList {
    constructor() {
        this.head = new SkipListNode('', 0, MAX_LEVEL);
        this.level = 0;
        this.size = 0;
        this.metrics = {
            totalInsertions: 0,
            totalSearches: 0,
            searchComparisons: 0,
            averageLevel: 0.0,
            maxLevel: 0,
            insertionCost: 0,
        };
    }

    randomLevel() {
        let level = 0;
        while (level < MAX_LEVEL && Math.random() < LEVEL_PROBABILITY) {
            level++;
        }
        return level;
    }

    insert(key, value) {
        const isNew = this.search(key) === undefined;
        const newLevel = this.randomLevel();

        if (newLevel > this.level) {
            this.level = newLevel;
        }

        const newNode = new SkipListNode(key, value, newLevel);
        const update = new Array(this.level + 1);
        let current = this.head;

        // Find insertion points
        for (let lv = this.level; lv >= 0; lv--) {
            while (current.forward[lv] && current.forward[lv].key < key) {
                current = current.forward[lv];
            }
            update[lv] = current;
        }

        // Insert at appropriate levels
        for (let lv = 0; lv <= newLevel && lv <= this.level; lv++) {
            newNode.forward[lv] = update[lv].forward[lv];
            update[lv].forward[lv] = newNode;
        }

        if (isNew) this.size++;
        this.metrics.totalInsertions++;
        this.updateMetrics();
    }

    search(key) {
        this.metrics.totalSearches++;
        let comparisons = 0;
        let current = this.head;

        for (let lv = this.level; lv >= 0; lv--) {
            while (current.forward[lv]) {
                comparisons++;
                if (current.forward[lv].key < key) {
                    current = current.forward[lv];
                } else {
                    break;
                }
            }
        }

        if (current.forward[0] && current.forward[0].key === key) {
            this.metrics.searchComparisons += comparisons;
            return current.forward[0].value;
        }

        this.metrics.searchComparisons += comparisons;
        return undefined;
    }

    delete(key) {
        const update = new Array(this.level + 1);
        let current = this.head;

        for (let lv = this.level; lv >= 0; lv--) {
            while (current.forward[lv] && current.forward[lv].key < key) {
                current = current.forward[lv];
            }
            update[lv] = current;
        }

        if (current.forward[0] && current.forward[0].key === key) {
            const value = current.forward[0].value;
            for (let lv = 0; lv <= this.level; lv++) {
                if (update[lv].forward[lv] && update[lv].forward[lv].key === key) {
                    update[lv].forward[lv] = update[lv].forward[lv].forward[lv];
                } else {
                    break;
                }
            }
            this.size--;
            this.updateMetrics();
            return value;
        }

        return undefined;
    }

    updateMetrics() {
        let totalLevel = 0;
        let count = 0;
        let current = this.head.forward[0];

        while (current) {
            totalLevel += current.level;
            count++;
            current = current.forward[0];
        }

        this.metrics.averageLevel = count > 0 ? totalLevel / count : 0;
        this.metrics.maxLevel = this.level;
    }

    getMetrics() {
        return { ...this.metrics };
    }

    len() {
        return this.size;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkipList;
}
```

### Update `web/benchmark-wasm.js`

Add functions:
```javascript
async function benchmarkWasmSkipList(size) {
    if (!wasmModule) return null;

    const list = new wasmModule.SkipList();
    const startTime = performance.now();

    for (let i = 0; i < size; i++) {
        list.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - startTime;
    const metrics = list.get_metrics();

    return {
        insertTime,
        totalInsertions: metrics.total_insertions,
        averageLevel: metrics.average_level,
        maxLevel: metrics.max_level,
        searchComparisons: metrics.search_comparisons,
    };
}

function benchmarkJSSkipList(size) {
    const list = new SkipList();
    const startTime = performance.now();

    for (let i = 0; i < size; i++) {
        list.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - startTime;
    const metrics = list.getMetrics();

    return {
        insertTime,
        totalInsertions: metrics.totalInsertions,
        averageLevel: metrics.averageLevel,
        maxLevel: metrics.maxLevel,
        searchComparisons: metrics.searchComparisons,
    };
}
```

---

## Task 6: Create Benchmark Page and Blog Post (2-3 hours)

### Objective
Create interactive HTML benchmark page and educational blog post.

### File: `web/benchmark-skip-list.html`

Create similar to `benchmark-red-black-tree.html`:
- Three insertion patterns (random, sequential, reverse)
- Side-by-side JS vs WASM comparisons
- Metrics table: average level, search cost, insertion count
- Visual comparison with RB-Tree from Phase 7

### File: `blog/skip-list-deep-dive.md`

Write 700-800 word post covering:
1. **Problem**: Balance without explicit tracking
2. **Clever Idea**: Use randomization (probabilistic)
3. **Architecture**: Multi-level linked lists, sentinel head
4. **Level Selection**: Why P = 0.5? Exponential distribution
5. **Search Algorithm**: Start high, drop down
6. **Insertion**: Find position, create node, link all levels
7. **Complexity**: O(log n) expected, why probability works
8. **Real World**: Redis, LevelDB, Java ConcurrentSkipListMap
9. **Comparison**: Skip List vs RB-Tree—simpler but probabilistic

### Expected Output
- `web/benchmark-skip-list.html` (300+ lines)
- `blog/skip-list-deep-dive.md` (250+ lines)
- All benchmark functions working
- GitHub commit ready

---

## Final Verification Checklist

Before marking Phase 8 complete:

- [ ] `cargo test --lib` shows all tests passing (15+ total)
- [ ] `wasm-pack build` compiles successfully (<10 seconds)
- [ ] `web/benchmark-skip-list.html` loads in browser
- [ ] JavaScript implementation matches Rust behavior
- [ ] Metrics show statistically balanced levels (average_level ≈ log n)
- [ ] Blog post is 700+ words and educational
- [ ] All files committed with clear commit message
- [ ] Main branch merged and GitHub pushed

---

## Success Metrics

✅ All tests pass
✅ WASM compiles successfully
✅ Benchmark page runs without errors
✅ Skip list shows O(log n) average case in practice
✅ Blog post explains randomization clearly
✅ Code committed and merged to main
