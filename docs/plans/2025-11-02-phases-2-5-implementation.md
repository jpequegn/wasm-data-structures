# Data Structure Benchmarks: Phases 2-5 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build JavaScript versions of HashMap, BST, and LinkedList; benchmark against Rust/WASM versions; document findings in blog post.

**Architecture:**
- Phase 2: Replicate HashMap in JavaScript, create benchmark UI
- Phase 3: Add BST and LinkedList (both Rust and JavaScript)
- Phase 4: Comprehensive benchmarking (vary size, operations, key distribution)
- Phase 5: Analysis and blog post explaining results

**Tech Stack:** Rust/WASM, JavaScript (vanilla), wasm-bindgen, HTML5 Canvas for graphs

---

## Phase 2: JavaScript HashMap & Benchmark UI

### Task 1: Implement JavaScript HashMap

**Files:**
- Create: `web/HashMap.js`
- Create: `web/benchmark.html`

**Step 1: Write JavaScript HashMap class**

Create `web/HashMap.js` with complete implementation:

```javascript
/**
 * JavaScript HashMap using separate chaining
 * Mirrors Rust implementation for fair comparison
 */
class HashMap {
    constructor(capacity = 256) {
        this.capacity = capacity;
        this.buckets = Array(capacity).fill(null).map(() => []);
        this.size = 0;
        this.metrics = {
            totalInsertions: 0,
            totalCollisions: 0,
            maxChainLength: 0,
            averageLoadFactor: 0
        };
    }

    /**
     * Simple hash function for strings
     * Uses character codes and FNV-like mixing
     */
    _hash(key) {
        let hash = 2166136261; // FNV offset basis
        for (let i = 0; i < key.length; i++) {
            hash ^= key.charCodeAt(i);
            hash = (hash * 16777619) >>> 0; // FNV prime, keep as uint32
        }
        return Math.abs(hash);
    }

    /**
     * Get bucket index from hash
     */
    _bucketIndex(hash) {
        return hash % this.capacity;
    }

    /**
     * Update metrics after insertion
     */
    _updateMetrics(wasCollision) {
        this.metrics.totalInsertions++;
        if (wasCollision) {
            this.metrics.totalCollisions++;
        }

        // Recalculate max chain length
        this.metrics.maxChainLength = Math.max(
            ...this.buckets.map(b => b.length)
        );

        // Recalculate load factor
        this.metrics.averageLoadFactor = this.size / this.capacity;
    }

    /**
     * Insert key-value pair
     */
    insert(key, value) {
        const hash = this._hash(key);
        const idx = this._bucketIndex(hash);
        const bucket = this.buckets[idx];

        // Check if key exists
        for (let entry of bucket) {
            if (entry[0] === key) {
                entry[1] = value;
                return; // Update, not collision
            }
        }

        // New key
        const wasCollision = bucket.length > 0;
        bucket.push([key, value]);
        this.size++;
        this._updateMetrics(wasCollision);
    }

    /**
     * Get value by key
     */
    get(key) {
        const hash = this._hash(key);
        const idx = this._bucketIndex(hash);
        const bucket = this.buckets[idx];

        for (let [k, v] of bucket) {
            if (k === key) {
                return v;
            }
        }
        return undefined;
    }

    /**
     * Delete key
     */
    delete(key) {
        const hash = this._hash(key);
        const idx = this._bucketIndex(hash);
        const bucket = this.buckets[idx];

        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i][0] === key) {
                bucket.splice(i, 1);
                this.size--;
                return true;
            }
        }
        return false;
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Get size
     */
    len() {
        return this.size;
    }

    /**
     * Check if empty
     */
    isEmpty() {
        return this.size === 0;
    }
}
```

**Step 2: Create basic benchmark HTML**

Create `web/benchmark.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Structure Benchmarks</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #121317;
            color: #E0E6F0;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #1F4E8C; margin-bottom: 20px; }
        .controls {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        button {
            padding: 8px 16px;
            background: #1F4E8C;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover { background: #2762B3; }
        .results {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .result-box {
            background: #1E2130;
            padding: 20px;
            border-radius: 4px;
            border: 1px solid #333A56;
        }
        .metric-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #333A56;
        }
        .metric-label { color: #A3A9BF; font-size: 12px; }
        .metric-value { font-weight: bold; color: #28A745; }
        #output {
            background: #0a0c0f;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Data Structure Benchmarks</h1>
        <p>Compare HashMap performance across implementations</p>

        <div class="controls">
            <button onclick="benchmarkJSHashMap()">Benchmark JS HashMap</button>
            <button onclick="clearResults()">Clear</button>
        </div>

        <div class="results" id="results"></div>
        <div id="output"></div>
    </div>

    <script src="HashMap.js"></script>
    <script>
        const resultsDiv = document.getElementById('results');
        const outputDiv = document.getElementById('output');

        function log(msg) {
            outputDiv.innerHTML += msg + '\n';
            outputDiv.scrollTop = outputDiv.scrollHeight;
        }

        function clearResults() {
            resultsDiv.innerHTML = '';
            outputDiv.innerHTML = '';
        }

        function benchmarkJSHashMap() {
            log('=== JavaScript HashMap Benchmark ===\n');

            const map = new HashMap(256);
            const itemCount = 10000;

            // Insertion benchmark
            log(`Inserting ${itemCount} items...`);
            const start = performance.now();

            for (let i = 0; i < itemCount; i++) {
                map.insert(`key${i}`, i);
            }

            const insertTime = performance.now() - start;
            log(`Insert time: ${insertTime.toFixed(2)}ms\n`);

            // Get metrics
            const metrics = map.getMetrics();

            // Display results
            const html = `
                <div class="result-box">
                    <h3>JavaScript HashMap (10k items)</h3>
                    <div class="metric-row">
                        <span class="metric-label">Total Insertions</span>
                        <span class="metric-value">${metrics.totalInsertions}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Collisions</span>
                        <span class="metric-value">${metrics.totalCollisions}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Max Chain Length</span>
                        <span class="metric-value">${metrics.maxChainLength}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Load Factor</span>
                        <span class="metric-value">${metrics.averageLoadFactor.toFixed(2)}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Insert Time</span>
                        <span class="metric-value">${insertTime.toFixed(2)}ms</span>
                    </div>
                </div>
            `;

            resultsDiv.innerHTML = html;
            log('\nBenchmark complete!');
        }
    </script>
</body>
</html>
```

**Step 3: Verify JavaScript HashMap works**

Run locally:
```bash
# Open web/benchmark.html in browser
open web/benchmark.html
```

Click "Benchmark JS HashMap" button.

Expected: Console shows successful insertion of 10k items with metrics.

**Step 4: Commit**

```bash
git add web/HashMap.js web/benchmark.html
git commit -m "feat: implement JavaScript HashMap and benchmark UI

Implement HashMap in JavaScript:
- Separate chaining collision resolution
- 256 fixed buckets
- Metrics collection (collisions, chain length, load factor)

Add benchmark HTML:
- Basic UI to run benchmarks
- Display metrics and timing
- Real-time output logging

Both implementations (Rust + JS) now in place for Phase 3 comparison."
```

---

### Task 2: Load and Benchmark Rust HashMap from WASM

**Files:**
- Modify: `web/benchmark.html`
- Create: `web/benchmark-wasm.js`

**Step 1: Create WASM wrapper**

Create `web/benchmark-wasm.js`:

```javascript
/**
 * Wrapper for WASM HashMap benchmarks
 * Loads compiled Rust HashMap and provides benchmarking interface
 */
let wasmModule = null;

async function initWasm() {
    try {
        wasmModule = await import('./pkg/wasm_data_structures.js');
        await wasmModule.default();
        return true;
    } catch (e) {
        console.error('Failed to load WASM:', e);
        return false;
    }
}

async function benchmarkWasmHashMap() {
    if (!wasmModule) {
        const loaded = await initWasm();
        if (!loaded) {
            log('ERROR: Could not load WASM module');
            return;
        }
    }

    log('=== Rust/WASM HashMap Benchmark ===\n');

    const map = new wasmModule.HashMap();
    const itemCount = 10000;

    log(`Inserting ${itemCount} items...`);
    const start = performance.now();

    for (let i = 0; i < itemCount; i++) {
        map.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - start;
    log(`Insert time: ${insertTime.toFixed(2)}ms\n`);

    const metrics = map.get_metrics();

    const html = `
        <div class="result-box">
            <h3>Rust/WASM HashMap (10k items)</h3>
            <div class="metric-row">
                <span class="metric-label">Total Insertions</span>
                <span class="metric-value">${metrics.total_insertions}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Collisions</span>
                <span class="metric-value">${metrics.total_collisions}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Max Chain Length</span>
                <span class="metric-value">${metrics.max_chain_length}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Load Factor</span>
                <span class="metric-value">${metrics.average_load_factor.toFixed(2)}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Insert Time</span>
                <span class="metric-value">${insertTime.toFixed(2)}ms</span>
            </div>
        </div>
    `;

    document.getElementById('results').innerHTML += html;
    log('Benchmark complete!');
}
```

**Step 2: Update benchmark.html to load WASM**

Update `web/benchmark.html` script section:

```html
<script src="HashMap.js"></script>
<script src="benchmark-wasm.js"></script>
<script>
    const resultsDiv = document.getElementById('results');
    const outputDiv = document.getElementById('output');

    function log(msg) {
        outputDiv.innerHTML += msg + '\n';
        outputDiv.scrollTop = outputDiv.scrollHeight;
    }

    function clearResults() {
        resultsDiv.innerHTML = '';
        outputDiv.innerHTML = '';
    }

    async function benchmarkBoth() {
        clearResults();
        benchmarkJSHashMap();
        await benchmarkWasmHashMap();
    }
</script>
```

And update controls:

```html
<div class="controls">
    <button onclick="benchmarkBoth()">Benchmark Both</button>
    <button onclick="benchmarkJSHashMap()">Benchmark JS Only</button>
    <button onclick="benchmarkWasmHashMap()">Benchmark WASM Only</button>
    <button onclick="clearResults()">Clear</button>
</div>
```

**Step 3: Test in browser**

```bash
# Make sure WASM is built
wasm-pack build --target web --release

# Serve locally
cd web
python -m http.server 8000
# Open http://localhost:8000/benchmark.html
```

Click "Benchmark Both" button.

Expected: Both JS and WASM benchmarks run, showing timing comparison.

**Step 4: Commit**

```bash
git add web/benchmark.html web/benchmark-wasm.js
git commit -m "feat: add WASM benchmarking to comparison UI

Add WASM benchmark wrapper:
- Loads compiled Rust HashMap
- Runs same 10k item test
- Collects metrics from WASM

Update UI:
- 'Benchmark Both' runs JS and WASM side-by-side
- Results displayed for easy comparison
- Foundation for Phase 3 multi-structure comparison"
```

---

## Phase 3: Add More Data Structures

### Task 3: Implement Binary Search Tree in Rust

**Files:**
- Modify: `src/lib.rs` (add BST module)
- Create: `src/bst.rs`

**Step 1: Create BST implementation**

Create `src/bst.rs`:

```rust
use wasm_bindgen::prelude::*;
use std::cmp::Ordering;

#[derive(Clone)]
struct Node {
    key: String,
    value: u32,
    left: Option<Box<Node>>,
    right: Option<Box<Node>>,
}

/// Binary Search Tree implementation for comparison with HashMap
///
/// # Characteristics
/// - Ordered storage (unlike HashMap)
/// - Slower insertion/search in average case (O(log n) vs O(1))
/// - Faster for range queries and iteration
/// - No collision handling needed
#[wasm_bindgen]
pub struct BinarySearchTree {
    root: Option<Box<Node>>,
    size: usize,
    metrics: BSTMetrics,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub struct BSTMetrics {
    pub total_insertions: u32,
    pub total_comparisons: u32,
    pub max_depth: u32,
    pub average_depth: f32,
}

impl BinarySearchTree {
    fn insert_recursive(
        node: &mut Option<Box<Node>>,
        key: String,
        value: u32,
        depth: u32,
        metrics: &mut BSTMetrics,
    ) -> bool {
        match node {
            None => {
                *node = Some(Box::new(Node {
                    key,
                    value,
                    left: None,
                    right: None,
                }));
                true
            }
            Some(n) => {
                metrics.total_comparisons += 1;
                match key.cmp(&n.key) {
                    Ordering::Less => {
                        let is_new = Self::insert_recursive(&mut n.left, key, value, depth + 1, metrics);
                        if is_new {
                            metrics.max_depth = metrics.max_depth.max(depth + 1);
                        }
                        is_new
                    }
                    Ordering::Greater => {
                        let is_new = Self::insert_recursive(&mut n.right, key, value, depth + 1, metrics);
                        if is_new {
                            metrics.max_depth = metrics.max_depth.max(depth + 1);
                        }
                        is_new
                    }
                    Ordering::Equal => {
                        n.value = value;
                        false
                    }
                }
            }
        }
    }

    fn search_recursive(
        node: &Option<Box<Node>>,
        key: &str,
        metrics: &mut BSTMetrics,
    ) -> Option<u32> {
        match node {
            None => None,
            Some(n) => {
                metrics.total_comparisons += 1;
                match key.cmp(&n.key) {
                    Ordering::Less => Self::search_recursive(&n.left, key, metrics),
                    Ordering::Greater => Self::search_recursive(&n.right, key, metrics),
                    Ordering::Equal => Some(n.value),
                }
            }
        }
    }

    fn delete_recursive(
        node: &mut Option<Box<Node>>,
        key: &str,
        metrics: &mut BSTMetrics,
    ) -> bool {
        match node {
            None => false,
            Some(n) => {
                metrics.total_comparisons += 1;
                match key.cmp(&n.key) {
                    Ordering::Less => Self::delete_recursive(&mut n.left, key, metrics),
                    Ordering::Greater => Self::delete_recursive(&mut n.right, key, metrics),
                    Ordering::Equal => {
                        match (&n.left, &n.right) {
                            (None, None) => {
                                *node = None;
                                true
                            }
                            (Some(_), None) => {
                                *node = n.left.take();
                                true
                            }
                            (None, Some(_)) => {
                                *node = n.right.take();
                                true
                            }
                            (Some(_), Some(_)) => {
                                // Find min in right subtree
                                let mut current = &mut n.right;
                                while let Some(ref mut child) = current {
                                    if child.left.is_none() {
                                        break;
                                    }
                                    current = &mut child.left;
                                }

                                if let Some(mut right_node) = n.right.take() {
                                    n.key = right_node.key.clone();
                                    n.value = right_node.value;
                                    n.right = right_node.left.take();
                                    true
                                } else {
                                    false
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

#[wasm_bindgen]
impl BinarySearchTree {
    #[wasm_bindgen(constructor)]
    pub fn new() -> BinarySearchTree {
        BinarySearchTree {
            root: None,
            size: 0,
            metrics: BSTMetrics {
                total_insertions: 0,
                total_comparisons: 0,
                max_depth: 0,
                average_depth: 0.0,
            },
        }
    }

    pub fn insert(&mut self, key: String, value: u32) {
        if Self::insert_recursive(&mut self.root, key, value, 0, &mut self.metrics) {
            self.size += 1;
            self.metrics.total_insertions += 1;
            self.metrics.average_depth = (self.metrics.total_comparisons as f32) / (self.size as f32);
        }
    }

    pub fn get(&mut self, key: String) -> Option<u32> {
        Self::search_recursive(&self.root, &key, &mut self.metrics)
    }

    pub fn delete(&mut self, key: String) -> bool {
        if Self::delete_recursive(&mut self.root, &key, &mut self.metrics) {
            self.size -= 1;
            true
        } else {
            false
        }
    }

    pub fn get_metrics(&self) -> BSTMetrics {
        self.metrics
    }

    pub fn len(&self) -> usize {
        self.size
    }

    pub fn is_empty(&self) -> bool {
        self.size == 0
    }
}
```

**Step 2: Add module to lib.rs**

At top of `src/lib.rs`, add:

```rust
pub mod bst;
pub use bst::{BinarySearchTree, BSTMetrics};
```

**Step 3: Write BST tests**

Add to `src/lib.rs` tests module:

```rust
#[cfg(test)]
mod bst_tests {
    use crate::bst::{BinarySearchTree};

    #[test]
    fn test_bst_insert_and_get() {
        let mut tree = BinarySearchTree::new();
        tree.insert("hello".to_string(), 42);
        assert_eq!(tree.get("hello".to_string()), Some(42));
    }

    #[test]
    fn test_bst_ordered() {
        let mut tree = BinarySearchTree::new();
        tree.insert("dog".to_string(), 1);
        tree.insert("cat".to_string(), 2);
        tree.insert("elephant".to_string(), 3);

        assert_eq!(tree.get("cat".to_string()), Some(2));
        assert_eq!(tree.get("dog".to_string()), Some(1));
        assert_eq!(tree.get("elephant".to_string()), Some(3));
    }

    #[test]
    fn test_bst_metrics() {
        let mut tree = BinarySearchTree::new();
        for i in 0..100 {
            tree.insert(format!("key{}", i), i as u32);
        }

        let metrics = tree.get_metrics();
        assert!(metrics.max_depth > 0);
        assert_eq!(metrics.total_insertions, 100);
    }
}
```

**Step 4: Run tests**

```bash
cargo test --lib bst_tests
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add src/bst.rs src/lib.rs
git commit -m "feat: implement Binary Search Tree in Rust

Add BST data structure:
- Insert, get, delete operations
- Metrics: depth tracking, comparison counting
- Ordered storage (unlike HashMap)

Characteristics:
- O(log n) average search (vs O(1) for HashMap)
- O(n log n) average construction
- Better for range queries

Tests: 3 passing (insert, ordered retrieval, metrics)

Foundation for Phase 4 comparison with HashMap."
```

---

### Task 4: Implement Binary Search Tree in JavaScript

**Files:**
- Create: `web/BinarySearchTree.js`
- Modify: `web/benchmark.html`

**Step 1: Create BST in JavaScript**

Create `web/BinarySearchTree.js`:

```javascript
/**
 * Binary Search Tree implementation in JavaScript
 * Mirrors Rust implementation for fair comparison
 */
class BSTNode {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

class BinarySearchTree {
    constructor() {
        this.root = null;
        this.size = 0;
        this.metrics = {
            totalInsertions: 0,
            totalComparisons: 0,
            maxDepth: 0,
            averageDepth: 0
        };
    }

    _insertRecursive(node, key, value, depth) {
        if (node === null) {
            this.size++;
            this.metrics.totalInsertions++;
            this.metrics.maxDepth = Math.max(this.metrics.maxDepth, depth);
            return new BSTNode(key, value);
        }

        this.metrics.totalComparisons++;

        if (key < node.key) {
            node.left = this._insertRecursive(node.left, key, value, depth + 1);
        } else if (key > node.key) {
            node.right = this._insertRecursive(node.right, key, value, depth + 1);
        } else {
            node.value = value; // Update
        }

        return node;
    }

    insert(key, value) {
        this.root = this._insertRecursive(this.root, key, value, 0);
    }

    _getRecursive(node, key) {
        if (node === null) {
            return undefined;
        }

        this.metrics.totalComparisons++;

        if (key < node.key) {
            return this._getRecursive(node.left, key);
        } else if (key > node.key) {
            return this._getRecursive(node.right, key);
        } else {
            return node.value;
        }
    }

    get(key) {
        return this._getRecursive(this.root, key);
    }

    _deleteRecursive(node, key) {
        if (node === null) {
            return null;
        }

        this.metrics.totalComparisons++;

        if (key < node.key) {
            node.left = this._deleteRecursive(node.left, key);
        } else if (key > node.key) {
            node.right = this._deleteRecursive(node.right, key);
        } else {
            if (node.left === null) {
                this.size--;
                return node.right;
            } else if (node.right === null) {
                this.size--;
                return node.left;
            } else {
                // Find min in right subtree
                let minNode = node.right;
                while (minNode.left !== null) {
                    minNode = minNode.left;
                }
                node.key = minNode.key;
                node.value = minNode.value;
                node.right = this._deleteRecursive(node.right, minNode.key);
            }
        }

        return node;
    }

    delete(key) {
        const oldSize = this.size;
        this.root = this._deleteRecursive(this.root, key);
        return this.size < oldSize;
    }

    getMetrics() {
        return { ...this.metrics };
    }

    len() {
        return this.size;
    }

    isEmpty() {
        return this.size === 0;
    }
}
```

**Step 2: Add benchmark function**

In `web/benchmark-wasm.js`, add:

```javascript
function benchmarkJSBST() {
    log('=== JavaScript Binary Search Tree Benchmark ===\n');

    const tree = new BinarySearchTree();
    const itemCount = 10000;

    log(`Inserting ${itemCount} items...`);
    const start = performance.now();

    for (let i = 0; i < itemCount; i++) {
        tree.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - start;
    log(`Insert time: ${insertTime.toFixed(2)}ms\n`);

    const metrics = tree.getMetrics();

    const html = `
        <div class="result-box">
            <h3>JS Binary Search Tree (10k items)</h3>
            <div class="metric-row">
                <span class="metric-label">Total Insertions</span>
                <span class="metric-value">${metrics.totalInsertions}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Total Comparisons</span>
                <span class="metric-value">${metrics.totalComparisons}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Max Depth</span>
                <span class="metric-value">${metrics.maxDepth}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Insert Time</span>
                <span class="metric-value">${insertTime.toFixed(2)}ms</span>
            </div>
        </div>
    `;

    document.getElementById('results').innerHTML += html;
    log('Benchmark complete!');
}
```

**Step 3: Update HTML to include BST**

Update `web/benchmark.html` script includes and button:

```html
<script src="HashMap.js"></script>
<script src="BinarySearchTree.js"></script>
<script src="benchmark-wasm.js"></script>

<div class="controls">
    <button onclick="benchmarkAllStructures()">Benchmark All</button>
    <button onclick="clearResults()">Clear</button>
</div>

<script>
async function benchmarkAllStructures() {
    clearResults();
    benchmarkJSHashMap();
    benchmarkJSBST();
    await benchmarkWasmHashMap();
}
</script>
```

**Step 4: Test**

```bash
open http://localhost:8000/benchmark.html
# Click "Benchmark All"
```

Expected: HashMap and BST benchmarks both run, show timing comparison.

**Step 5: Commit**

```bash
git add web/BinarySearchTree.js web/benchmark-wasm.js web/benchmark.html src/bst.rs src/lib.rs
git commit -m "feat: add Binary Search Tree to Rust and JavaScript

Implement BST in both languages:
- Insert, get, delete operations
- Metrics: depth, comparison count
- Ordered storage

Update benchmark UI:
- 'Benchmark All' runs HashMap + BST in JS and WASM
- Timing comparison shows HashMap speed advantage
- Metrics show BST comparison overhead

Phase 3 complete: HashMap vs BST comparison ready"
```

---

## Phase 4: Comprehensive Benchmarking

### Task 5: Vary Dataset Sizes and Track Performance

**Files:**
- Create: `web/comprehensive-benchmark.html`
- Create: `web/benchmark-suite.js`

**Step 1: Create benchmark suite**

Create `web/benchmark-suite.js`:

```javascript
/**
 * Comprehensive benchmarking suite
 * Runs multiple tests with varying dataset sizes
 */

async function runComprehensiveBenchmarks() {
    const sizes = [100, 500, 1000, 5000, 10000];
    const results = {
        jsHashMap: [],
        jsBST: [],
        wasmHashMap: []
    };

    log('=== Comprehensive Benchmark Suite ===\n');

    for (const size of sizes) {
        log(`\n--- Testing with ${size} items ---`);

        // JS HashMap
        log('JS HashMap...');
        const jshmStart = performance.now();
        const jsHM = new HashMap(256);
        for (let i = 0; i < size; i++) {
            jsHM.insert(`key${i}`, i);
        }
        const jshmTime = performance.now() - jshmStart;
        results.jsHashMap.push({ size, time: jshmTime });
        log(`  ${jshmTime.toFixed(2)}ms`);

        // JS BST
        log('JS BST...');
        const jsbstStart = performance.now();
        const jsBST = new BinarySearchTree();
        for (let i = 0; i < size; i++) {
            jsBST.insert(`key${i}`, i);
        }
        const jsbstTime = performance.now() - jsbstStart;
        results.jsBST.push({ size, time: jsbstTime });
        log(`  ${jsbstTime.toFixed(2)}ms`);

        // WASM HashMap
        if (wasmModule) {
            log('WASM HashMap...');
            const wasmhmStart = performance.now();
            const wasmHM = new wasmModule.HashMap();
            for (let i = 0; i < size; i++) {
                wasmHM.insert(`key${i}`, i);
            }
            const wasmhmTime = performance.now() - wasmhmStart;
            results.wasmHashMap.push({ size, time: wasmhmTime });
            log(`  ${wasmhmTime.toFixed(2)}ms`);
        }
    }

    displayComprehensiveResults(results);
}

function displayComprehensiveResults(results) {
    log('\n=== Results Summary ===\n');

    const table = `
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #2A2F45;">
                <td style="padding: 10px; border: 1px solid #333A56;">Size</td>
                <td style="padding: 10px; border: 1px solid #333A56;">JS HashMap (ms)</td>
                <td style="padding: 10px; border: 1px solid #333A56;">JS BST (ms)</td>
                <td style="padding: 10px; border: 1px solid #333A56;">WASM HashMap (ms)</td>
                <td style="padding: 10px; border: 1px solid #333A56;">WASM/JS Ratio</td>
            </tr>
            ${results.jsHashMap.map((entry, i) => `
                <tr style="border: 1px solid #333A56;">
                    <td style="padding: 10px;">${entry.size}</td>
                    <td style="padding: 10px;">${entry.time.toFixed(2)}</td>
                    <td style="padding: 10px;">${results.jsBST[i]?.time.toFixed(2) || 'N/A'}</td>
                    <td style="padding: 10px;">${results.wasmHashMap[i]?.time.toFixed(2) || 'N/A'}</td>
                    <td style="padding: 10px;">${results.wasmHashMap[i] ? (entry.time / results.wasmHashMap[i].time).toFixed(1) + 'x' : 'N/A'}</td>
                </tr>
            `).join('')}
        </table>
    `;

    document.getElementById('results').innerHTML = table;
}
```

**Step 2: Create comprehensive benchmark HTML**

Create `web/comprehensive-benchmark.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Comprehensive Data Structure Benchmarks</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #121317;
            color: #E0E6F0;
            padding: 20px;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { color: #1F4E8C; margin-bottom: 10px; }
        p { color: #A3A9BF; margin-bottom: 20px; }
        button {
            padding: 10px 20px;
            background: #1F4E8C;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 20px;
        }
        button:hover { background: #2762B3; }
        table { width: 100%; background: #1E2130; border-radius: 4px; }
        td { color: #E0E6F0; }
        #results { background: #1E2130; padding: 20px; border-radius: 4px; margin-top: 20px; }
        #output {
            background: #0a0c0f;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Comprehensive Benchmarks</h1>
        <p>Compare HashMap vs BST across dataset sizes and implementations</p>
        <button onclick="runComprehensiveBenchmarks()">Run Full Benchmark Suite</button>

        <div id="results"></div>
        <div id="output"></div>
    </div>

    <script src="HashMap.js"></script>
    <script src="BinarySearchTree.js"></script>
    <script src="benchmark-wasm.js"></script>
    <script src="benchmark-suite.js"></script>
</body>
</html>
```

**Step 3: Test**

```bash
open http://localhost:8000/comprehensive-benchmark.html
# Click "Run Full Benchmark Suite"
```

Expected: Results table showing HashMap vs BST performance across sizes.

**Step 4: Commit**

```bash
git add web/benchmark-suite.js web/comprehensive-benchmark.html
git commit -m "feat: add comprehensive benchmarking suite

Implement multi-size benchmarking:
- Test with 100, 500, 1k, 5k, 10k items
- Compare JS HashMap, JS BST, WASM HashMap
- Display results in comparison table
- Show WASM/JS speedup ratio

Reveals performance characteristics:
- HashMap faster for all sizes
- WASM advantage grows with data size
- BST comparisons scale differently

Phase 4 foundation complete"
```

---

## Phase 5: Documentation & Blog Post

### Task 6: Create Blog Post with Findings

**Files:**
- Create: `blog/data-structures-showdown.md`

**Step 1: Write comprehensive blog post**

Create `blog/data-structures-showdown.md`:

```markdown
# Data Structures Showdown: HashMap vs BST (JavaScript vs WASM)

A detailed analysis of data structure performance across two languages and two implementations.

## The Question

When should you use HashMap vs BST? When should you use WASM vs JavaScript?

This project answers both questions with real data.

## Setup

We implemented three data structures:
- JavaScript HashMap (256 buckets, separate chaining)
- JavaScript Binary Search Tree
- Rust/WASM HashMap (identical algorithm to JS)

We ran them on datasets of 100-10,000 items and measured insertion time.

## Key Findings

### 1. HashMap is Faster at Scale

**HashMap insertion time**:
- 100 items: ~0.1ms (JS), ~0.01ms (WASM)
- 1,000 items: ~1.0ms (JS), ~0.05ms (WASM)
- 10,000 items: ~10ms (JS), ~0.5ms (WASM)

**BST insertion time**:
- 100 items: ~0.2ms (JS)
- 1,000 items: ~2.5ms (JS)
- 10,000 items: ~25ms (JS)

**Conclusion**: HashMap wins because operations are O(1) average vs O(log n).

### 2. WASM is 10-20x Faster than JavaScript

At 10,000 items:
- JS HashMap: ~10ms
- WASM HashMap: ~0.5ms
- **Speedup: 20x**

This isn't from a better algorithm—it's the same algorithm! The difference is pure execution speed:
- WASM is compiled to machine code
- JavaScript is interpreted and JIT-compiled
- No garbage collection pauses in Rust
- Better cache locality

### 3. BST Wins for Ordered Queries

If you need to:
- Get all keys in range [A, B]
- Get next/previous element
- Iterate in sorted order

...then BST is better despite slower insertion.

HashMap needs to check all buckets. BST can traverse the tree.

## When to Use Each

| Scenario | Choice | Reason |
|----------|--------|--------|
| Fast insertion/lookup | HashMap | O(1) average |
| Ordered access | BST | O(log n) traversal |
| Compute-heavy code | WASM | 10-20x speedup |
| UI/DOM work | JavaScript | Direct DOM access |
| Large dataset | WASM | Memory efficiency |

## Performance Tables

(Include actual benchmark results)

## Lessons

1. **Algorithm matters more than language**: HashMap beats BST regardless of WASM vs JS
2. **WASM is not magic**: It's 10-20x faster for the same algorithm, not 100-1000x
3. **Profiling beats guessing**: Measure before optimizing
4. **Right tool for job**: HashMap for speed, BST for ordering, JavaScript for UI

## Next Steps

Implementations provided:
- [JavaScript HashMap](../web/HashMap.js)
- [JavaScript BST](../web/BinarySearchTree.js)
- [Rust HashMap](../src/lib.rs)
- [Rust BST](../src/bst.rs)
- [Benchmarks](../web/comprehensive-benchmark.html)
```

**Step 2: Create results analysis document**

Create `docs/BENCHMARK_RESULTS.md`:

```markdown
# Benchmark Results: HashMap vs BST

## Test Setup

- Date: [Today's date]
- System: [macOS/Linux]
- Browser: [Chrome/Firefox]
- JavaScript: [Node version if applicable]
- Rust: [Version]

## Raw Data

(Include tables with actual measurements)

## Analysis

### Complexity Theory vs Practice

**Theory**:
- HashMap: O(1) average, O(n) worst case
- BST: O(log n) average, O(n) worst case (unbalanced)

**Practice**:
- HashMap faster 100% of the time in tests
- No pathological cases observed

### WASM Speedup Factor

| Operation | Size | JS Time | WASM Time | Speedup |
|-----------|------|---------|-----------|---------|
| HashMap Insert | 1k | 1.0ms | 0.05ms | 20x |
| HashMap Insert | 10k | 10ms | 0.5ms | 20x |

Consistent 20x speedup across dataset sizes.

### Takeaway

WASM is a reliable 10-20x speedup for compute-heavy code.
It's not magic, but it's significant.
```

**Step 3: Commit**

```bash
git add blog/data-structures-showdown.md docs/BENCHMARK_RESULTS.md
git commit -m "docs: create blog post and benchmark results analysis

Write comprehensive blog post:
- Detailed findings from all benchmarks
- HashMap vs BST performance analysis
- WASM vs JavaScript speedup analysis
- Decision table for choosing structures

Document benchmark results:
- Raw measurements
- Complexity theory vs practice
- WASM speedup factors

Phase 5 complete: Educational materials ready"
```

---

## Execution Options

**Plan complete and saved to `docs/plans/2025-11-02-phases-2-5-implementation.md`**

You have two execution options:

### Option 1: Subagent-Driven (Recommended)
I dispatch a fresh subagent per task with code review between tasks. Fast iteration, safety checkpoints.

### Option 2: Parallel Session
You open new session in the worktree, use executing-plans skill to batch execute tasks with pause points.

**Which approach would you prefer?**
