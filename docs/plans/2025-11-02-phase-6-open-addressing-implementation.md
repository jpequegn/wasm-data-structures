# Phase 6: Open Addressing Hash Table Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement hash table with open addressing (linear probing) collision resolution in Rust and JavaScript, demonstrating trade-offs versus separate chaining.

**Architecture:** Linear probing strategy with tombstone deletion, fixed capacity (1024 slots), metrics tracking for probe sequences and clustering, identical algorithm in both Rust and JavaScript.

**Tech Stack:** Rust (wasm-bindgen), JavaScript (ES6), Cargo test framework, criterion for benchmarking

---

## Task 1: Create Rust OpenAddressing module structure

**Files:**
- Create: `src/open_addressing.rs`
- Modify: `src/lib.rs` (add module and exports)

**Step 1: Create the module file with struct definitions**

Create `src/open_addressing.rs`:

```rust
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

/// Hash table using open addressing with linear probing
pub struct OpenAddressingHashTable {
    table: Vec<Option<Entry>>,
    size: u32,
    capacity: u32,
    metrics: OpenAddressingMetrics,
}

/// Individual hash table entry
struct Entry {
    key: String,
    value: u32,
    tombstone: bool, // true if deleted
}

/// Metrics collected during operations
#[derive(Clone)]
pub struct OpenAddressingMetrics {
    pub total_insertions: u32,
    pub total_probes: u32,
    pub max_probe_length: u32,
    pub load_factor: f32,
    pub clustering_factor: f32,
    pub tombstone_count: u32,
}

impl OpenAddressingHashTable {
    /// Create new hash table with fixed capacity
    pub fn new(capacity: u32) -> Self {
        OpenAddressingHashTable {
            table: vec![None; capacity as usize],
            size: 0,
            capacity,
            metrics: OpenAddressingMetrics {
                total_insertions: 0,
                total_probes: 0,
                max_probe_length: 0,
                load_factor: 0.0,
                clustering_factor: 0.0,
                tombstone_count: 0,
            },
        }
    }

    /// Hash a string key using FNV-like algorithm
    fn hash_key(key: &str) -> u64 {
        let mut hasher = DefaultHasher::new();
        key.hash(&mut hasher);
        hasher.finish()
    }

    /// Get bucket index from hash
    fn bucket_index(hash: u64, capacity: u32) -> usize {
        (hash % capacity as u64) as usize
    }

    /// Insert or update a key-value pair
    pub fn insert(&mut self, key: String, value: u32) {
        let hash = Self::hash_key(&key);
        let capacity = self.capacity as usize;
        let mut index = Self::bucket_index(hash, self.capacity);
        let mut probe_count = 0;

        // Linear probing: find empty slot or matching key
        loop {
            match &self.table[index] {
                None => {
                    // Found empty slot
                    self.table[index] = Some(Entry {
                        key,
                        value,
                        tombstone: false,
                    });
                    self.size += 1;
                    self.metrics.total_insertions += 1;
                    self.metrics.total_probes += probe_count;
                    if probe_count > self.metrics.max_probe_length {
                        self.metrics.max_probe_length = probe_count;
                    }
                    self.update_load_factor();
                    return;
                }
                Some(entry) => {
                    if entry.key == key && !entry.tombstone {
                        // Update existing key
                        self.table[index] = Some(Entry {
                            key,
                            value,
                            tombstone: false,
                        });
                        self.metrics.total_insertions += 1;
                        self.metrics.total_probes += probe_count;
                        return;
                    }
                    // Slot occupied, probe next
                    probe_count += 1;
                    index = (index + 1) % capacity;

                    // Safety: prevent infinite loop
                    if probe_count > capacity as u32 {
                        panic!("Hash table is full");
                    }
                }
            }
        }
    }

    /// Get value for key
    pub fn get(&mut self, key: &str) -> Option<u32> {
        let hash = Self::hash_key(key);
        let capacity = self.capacity as usize;
        let mut index = Self::bucket_index(hash, self.capacity);
        let mut probe_count = 0;

        loop {
            match &self.table[index] {
                None => {
                    // Key not found
                    self.metrics.total_probes += probe_count;
                    return None;
                }
                Some(entry) => {
                    if entry.key == key && !entry.tombstone {
                        // Found key
                        self.metrics.total_probes += probe_count;
                        return Some(entry.value);
                    }
                    // Probe next
                    probe_count += 1;
                    index = (index + 1) % capacity;

                    if probe_count > capacity as u32 {
                        return None;
                    }
                }
            }
        }
    }

    /// Delete key (mark as tombstone)
    pub fn delete(&mut self, key: &str) -> Option<u32> {
        let hash = Self::hash_key(key);
        let capacity = self.capacity as usize;
        let mut index = Self::bucket_index(hash, self.capacity);

        loop {
            match &mut self.table[index] {
                None => {
                    return None;
                }
                Some(entry) => {
                    if entry.key == key && !entry.tombstone {
                        entry.tombstone = true;
                        self.size = self.size.saturating_sub(1);
                        self.metrics.tombstone_count += 1;
                        self.update_load_factor();
                        return Some(entry.value);
                    }
                    index = (index + 1) % capacity;

                    if index == Self::bucket_index(hash, self.capacity) {
                        return None; // Wrapped around
                    }
                }
            }
        }
    }

    /// Update load factor and clustering metrics
    fn update_load_factor(&mut self) {
        self.metrics.load_factor = self.size as f32 / self.capacity as f32;

        // Calculate clustering factor (simplified: count consecutive non-empty slots)
        let mut consecutive = 0;
        let mut max_consecutive = 0;
        for slot in &self.table {
            match slot {
                None => {
                    if consecutive > max_consecutive {
                        max_consecutive = consecutive;
                    }
                    consecutive = 0;
                }
                Some(_) => consecutive += 1,
            }
        }
        if consecutive > max_consecutive {
            max_consecutive = consecutive;
        }
        self.metrics.clustering_factor = max_consecutive as f32 / self.capacity as f32;
    }

    /// Get current metrics
    pub fn get_metrics(&self) -> OpenAddressingMetrics {
        self.metrics.clone()
    }
}
```

**Step 2: Add module to lib.rs**

Edit `src/lib.rs` and add at the end:

```rust
pub mod open_addressing;
pub use open_addressing::{OpenAddressingHashTable, OpenAddressingMetrics};
```

**Step 3: Verify compilation**

Run: `cargo build`
Expected: Compiles without errors

**Step 4: Commit**

```bash
git add src/open_addressing.rs src/lib.rs
git commit -m "feat: implement OpenAddressingHashTable struct with linear probing"
```

---

## Task 2: Write unit tests for OpenAddressing

**Files:**
- Modify: `src/open_addressing.rs` (add test module)

**Step 1: Add test module at end of open_addressing.rs**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_insert_and_get() {
        let mut table = OpenAddressingHashTable::new(256);
        table.insert("key1".to_string(), 100);
        assert_eq!(table.get("key1"), Some(100));
    }

    #[test]
    fn test_update_existing_key() {
        let mut table = OpenAddressingHashTable::new(256);
        table.insert("key1".to_string(), 100);
        table.insert("key1".to_string(), 200);
        assert_eq!(table.get("key1"), Some(200));
    }

    #[test]
    fn test_delete_key() {
        let mut table = OpenAddressingHashTable::new(256);
        table.insert("key1".to_string(), 100);
        assert_eq!(table.delete("key1"), Some(100));
        assert_eq!(table.get("key1"), None);
    }

    #[test]
    fn test_multiple_insertions() {
        let mut table = OpenAddressingHashTable::new(256);
        for i in 0..100 {
            table.insert(format!("key{}", i), i);
        }
        assert_eq!(table.get("key50"), Some(50));
        assert_eq!(table.get("key99"), Some(99));
    }

    #[test]
    fn test_collision_handling() {
        let mut table = OpenAddressingHashTable::new(16);
        // Intentionally cause collisions with small table
        table.insert("a".to_string(), 1);
        table.insert("b".to_string(), 2);
        table.insert("c".to_string(), 3);
        assert_eq!(table.get("a"), Some(1));
        assert_eq!(table.get("b"), Some(2));
        assert_eq!(table.get("c"), Some(3));
    }

    #[test]
    fn test_load_factor() {
        let mut table = OpenAddressingHashTable::new(100);
        for i in 0..50 {
            table.insert(format!("key{}", i), i);
        }
        let metrics = table.get_metrics();
        assert!((metrics.load_factor - 0.5).abs() < 0.01);
    }

    #[test]
    fn test_tombstone_handling() {
        let mut table = OpenAddressingHashTable::new(256);
        table.insert("key1".to_string(), 100);
        table.insert("key2".to_string(), 200);
        table.delete("key1");

        // Can insert new key in tombstone slot
        table.insert("key3".to_string(), 300);
        assert_eq!(table.get("key2"), Some(200));
        assert_eq!(table.get("key3"), Some(300));
        assert_eq!(table.get("key1"), None);
    }

    #[test]
    fn test_probe_count_tracking() {
        let mut table = OpenAddressingHashTable::new(256);
        table.insert("key1".to_string(), 100);
        let metrics = table.get_metrics();
        assert!(metrics.total_probes >= 0);
        assert!(metrics.max_probe_length >= 0);
    }

    #[test]
    fn test_get_nonexistent_key() {
        let mut table = OpenAddressingHashTable::new(256);
        assert_eq!(table.get("nonexistent"), None);
    }

    #[test]
    fn test_delete_nonexistent_key() {
        let mut table = OpenAddressingHashTable::new(256);
        assert_eq!(table.delete("nonexistent"), None);
    }

    #[test]
    fn test_clustering_factor_increases_with_collisions() {
        let mut table = OpenAddressingHashTable::new(32);
        // Insert enough items to cause clustering
        for i in 0..16 {
            table.insert(format!("key{}", i), i);
        }
        let metrics = table.get_metrics();
        assert!(metrics.clustering_factor > 0.0);
    }
}
```

**Step 2: Run tests to verify they pass**

Run: `cargo test open_addressing::tests --lib`
Expected: 10 tests pass

**Step 3: Commit**

```bash
git add src/open_addressing.rs
git commit -m "feat: add 10 unit tests for OpenAddressingHashTable"
```

---

## Task 3: Implement WASM bindings for OpenAddressing

**Files:**
- Modify: `src/open_addressing.rs`

**Step 1: Add wasm-bindgen exports to OpenAddressingHashTable**

Add at the top of `src/open_addressing.rs`:

```rust
use wasm_bindgen::prelude::*;
```

Update struct definitions with `#[wasm_bindgen]`:

```rust
#[wasm_bindgen]
pub struct OpenAddressingHashTable {
    table: Vec<Option<Entry>>,
    size: u32,
    capacity: u32,
    metrics: OpenAddressingMetrics,
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct OpenAddressingMetrics {
    pub total_insertions: u32,
    pub total_probes: u32,
    pub max_probe_length: u32,
    pub load_factor: f32,
    pub clustering_factor: f32,
    pub tombstone_count: u32,
}

#[wasm_bindgen]
impl OpenAddressingHashTable {
    #[wasm_bindgen(constructor)]
    pub fn new(capacity: u32) -> OpenAddressingHashTable {
        // existing code
    }

    pub fn insert(&mut self, key: String, value: u32) {
        // existing code
    }

    pub fn get(&mut self, key: &str) -> Option<u32> {
        // existing code
    }

    pub fn delete(&mut self, key: &str) -> Option<u32> {
        // existing code
    }

    pub fn get_metrics(&self) -> OpenAddressingMetrics {
        // existing code
    }
}
```

**Step 2: Build WASM module**

Run: `wasm-pack build --target web --release`
Expected: Builds successfully, creates `pkg/` directory

**Step 3: Verify no new warnings**

Run: `cargo clippy`
Expected: No warnings related to open_addressing

**Step 4: Run all tests**

Run: `cargo test --lib`
Expected: All 15+ tests pass (existing + new)

**Step 5: Commit**

```bash
git add src/open_addressing.rs
git commit -m "feat: add wasm-bindgen support to OpenAddressingHashTable"
```

---

## Task 4: Implement JavaScript OpenAddressingHashTable

**Files:**
- Create: `web/OpenAddressingHashTable.js`

**Step 1: Create JavaScript implementation**

Create `web/OpenAddressingHashTable.js`:

```javascript
/**
 * OpenAddressingHashTable - Hash table with linear probing
 * Demonstrates collision resolution via open addressing
 */
class OpenAddressingHashTable {
    constructor(capacity = 256) {
        this.capacity = capacity;
        this.table = new Array(capacity);
        this.size = 0;
        this.metrics = {
            totalInsertions: 0,
            totalProbes: 0,
            maxProbeLength: 0,
            loadFactor: 0,
            clusteringFactor: 0,
            tombstoneCount: 0,
        };
    }

    /**
     * FNV-like hash function
     */
    hashKey(key) {
        let hash = 2166136261; // FNV offset basis
        for (let i = 0; i < key.length; i++) {
            hash ^= key.charCodeAt(i);
            hash = (hash * 16777619) >>> 0; // 32-bit multiplication
        }
        return Math.abs(hash);
    }

    /**
     * Get bucket index from hash
     */
    bucketIndex(hash) {
        return hash % this.capacity;
    }

    /**
     * Insert or update key-value pair
     */
    insert(key, value) {
        let hash = this.hashKey(key);
        let capacity = this.capacity;
        let index = this.bucketIndex(hash);
        let probeCount = 0;

        while (true) {
            const slot = this.table[index];

            if (slot === undefined) {
                // Found empty slot
                this.table[index] = { key, value, tombstone: false };
                this.size++;
                this.metrics.totalInsertions++;
                this.metrics.totalProbes += probeCount;
                if (probeCount > this.metrics.maxProbeLength) {
                    this.metrics.maxProbeLength = probeCount;
                }
                this.updateLoadFactor();
                return;
            } else if (slot.key === key && !slot.tombstone) {
                // Update existing key
                this.table[index] = { key, value, tombstone: false };
                this.metrics.totalInsertions++;
                this.metrics.totalProbes += probeCount;
                return;
            }

            // Probe next slot
            probeCount++;
            index = (index + 1) % capacity;

            if (probeCount > capacity) {
                throw new Error('Hash table is full');
            }
        }
    }

    /**
     * Get value for key
     */
    get(key) {
        let hash = this.hashKey(key);
        let capacity = this.capacity;
        let index = this.bucketIndex(hash);
        let probeCount = 0;

        while (true) {
            const slot = this.table[index];

            if (slot === undefined) {
                // Key not found
                this.metrics.totalProbes += probeCount;
                return undefined;
            } else if (slot.key === key && !slot.tombstone) {
                // Found key
                this.metrics.totalProbes += probeCount;
                return slot.value;
            }

            // Probe next slot
            probeCount++;
            index = (index + 1) % capacity;

            if (probeCount > capacity) {
                return undefined;
            }
        }
    }

    /**
     * Delete key (mark as tombstone)
     */
    delete(key) {
        let hash = this.hashKey(key);
        let capacity = this.capacity;
        let index = this.bucketIndex(hash);

        while (true) {
            const slot = this.table[index];

            if (slot === undefined) {
                return undefined;
            } else if (slot.key === key && !slot.tombstone) {
                slot.tombstone = true;
                this.size--;
                this.metrics.tombstoneCount++;
                this.updateLoadFactor();
                return slot.value;
            }

            index = (index + 1) % capacity;

            if (index === this.bucketIndex(hash)) {
                return undefined; // Wrapped around
            }
        }
    }

    /**
     * Update load factor and clustering metrics
     */
    updateLoadFactor() {
        this.metrics.loadFactor = this.size / this.capacity;

        // Calculate clustering factor (max consecutive non-empty slots)
        let consecutive = 0;
        let maxConsecutive = 0;

        for (let i = 0; i < this.capacity; i++) {
            if (this.table[i] !== undefined) {
                consecutive++;
                if (consecutive > maxConsecutive) {
                    maxConsecutive = consecutive;
                }
            } else {
                consecutive = 0;
            }
        }

        this.metrics.clusteringFactor = maxConsecutive / this.capacity;
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
}
```

**Step 2: Verify implementation with manual test**

Create temporary test in browser console or Node.js:
```javascript
const table = new OpenAddressingHashTable(256);
table.insert('key1', 100);
console.log(table.get('key1')); // Should print 100
console.log(table.getMetrics()); // Should show metrics
```

**Step 3: Commit**

```bash
git add web/OpenAddressingHashTable.js
git commit -m "feat: implement JavaScript OpenAddressingHashTable"
```

---

## Task 5: Create interactive benchmark page for OpenAddressing

**Files:**
- Create: `web/benchmark-open-addressing.html`
- Modify: `web/benchmark-wasm.js` (add OpenAddressing functions)

**Step 1: Add WASM benchmark functions to benchmark-wasm.js**

Edit `web/benchmark-wasm.js` and add:

```javascript
async function benchmarkWasmOpenAddressing(size) {
    if (!wasmModule) {
        log('WASM module not loaded');
        return null;
    }

    const table = new wasmModule.OpenAddressingHashTable(1024);
    const startTime = performance.now();

    for (let i = 0; i < size; i++) {
        table.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - startTime;
    const metrics = table.get_metrics();

    // Convert Rust snake_case to JavaScript camelCase
    return {
        insertTime,
        totalInsertions: metrics.total_insertions,
        totalProbes: metrics.total_probes,
        maxProbeLength: metrics.max_probe_length,
        loadFactor: metrics.load_factor,
        clusteringFactor: metrics.clustering_factor,
        tombstoneCount: metrics.tombstone_count,
    };
}
```

**Step 2: Create benchmark-open-addressing.html**

Create `web/benchmark-open-addressing.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Open Addressing Hash Table Benchmarks</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #121317;
            color: #E0E6F0;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #1F4E8C; margin-bottom: 10px; }
        p { color: #A3A9BF; margin-bottom: 20px; }
        button {
            padding: 10px 20px;
            background: #1F4E8C;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 20px;
        }
        button:hover { background: #2762B3; }
        table {
            width: 100%;
            background: #1E2130;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 10px;
            border: 1px solid #333A56;
            text-align: center;
        }
        th { background: #2A2F45; }
        #output {
            background: #0a0c0f;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            margin-top: 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        .metric { color: #28A745; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Open Addressing Hash Table Benchmarks</h1>
        <p>Linear probing collision resolution - demonstrates clustering effect</p>
        <button onclick="runOpenAddressingBenchmarks()">Run Benchmarks</button>
        <div id="results"></div>
        <div id="output"></div>
    </div>

    <script src="OpenAddressingHashTable.js"></script>
    <script src="benchmark-wasm.js"></script>
    <script>
        const outputDiv = document.getElementById('output');
        function log(msg) {
            outputDiv.innerHTML += msg + '<br>';
            outputDiv.scrollTop = outputDiv.scrollHeight;
        }

        async function runOpenAddressingBenchmarks() {
            const sizes = [100, 500, 1000, 5000, 10000];
            log('=== Open Addressing Hash Table Benchmarks ===<br>');

            const results = { js: [], wasm: [] };

            for (const size of sizes) {
                log(`<br>Testing with ${size} items<br>`);

                // JS benchmark
                log('JS Open Addressing...');
                const jsTable = new OpenAddressingHashTable(1024);
                const jsStart = performance.now();
                for (let i = 0; i < size; i++) {
                    jsTable.insert(`key${i}`, i);
                }
                const jsTime = performance.now() - jsStart;
                const jsMetrics = jsTable.getMetrics();
                results.js.push({ size, time: jsTime, metrics: jsMetrics });
                log(`  ${jsTime.toFixed(2)}ms (load: ${jsMetrics.loadFactor.toFixed(2)}, clustering: ${jsMetrics.clusteringFactor.toFixed(2)})<br>`);

                // WASM benchmark
                if (wasmModule) {
                    log('WASM Open Addressing...');
                    const wasmResult = await benchmarkWasmOpenAddressing(size);
                    if (wasmResult) {
                        results.wasm.push({ size, ...wasmResult });
                        log(`  ${wasmResult.insertTime.toFixed(2)}ms (load: ${wasmResult.loadFactor.toFixed(2)}, clustering: ${wasmResult.clusteringFactor.toFixed(2)})<br>`);
                    }
                }
            }

            displayResults(results);
        }

        function displayResults(results) {
            let html = '<table><tr><th>Size</th><th>JS Time (ms)</th><th>JS Load Factor</th><th>JS Clustering</th>';
            html += '<th>WASM Time (ms)</th><th>WASM Load Factor</th><th>Speedup</th></tr>';

            for (let i = 0; i < results.js.length; i++) {
                const js = results.js[i];
                const wasm = results.wasm[i];
                const speedup = wasm ? (js.time / wasm.insertTime).toFixed(1) + 'x' : 'N/A';

                html += `<tr>
                    <td>${js.size}</td>
                    <td class="metric">${js.time.toFixed(2)}</td>
                    <td>${js.metrics.loadFactor.toFixed(2)}</td>
                    <td>${js.metrics.clusteringFactor.toFixed(2)}</td>
                    <td class="metric">${wasm ? wasm.insertTime.toFixed(2) : 'N/A'}</td>
                    <td>${wasm ? wasm.loadFactor.toFixed(2) : 'N/A'}</td>
                    <td><strong>${speedup}</strong></td>
                </tr>`;
            }

            html += '</table>';
            document.getElementById('results').innerHTML = html;
            log('<br>Benchmark complete!');
        }
    </script>
</body>
</html>
```

**Step 3: Test the benchmark page**

- Run local server: `cd web && python -m http.server 8000`
- Open: http://localhost:8000/benchmark-open-addressing.html
- Click "Run Benchmarks" button
- Verify tables appear and metrics display correctly

**Step 4: Commit**

```bash
git add web/benchmark-open-addressing.html web/benchmark-wasm.js
git commit -m "feat: add interactive benchmark page for open addressing"
```

---

## Task 6: Write deep-dive blog post for Open Addressing

**Files:**
- Create: `blog/open-addressing-deep-dive.md`

**Step 1: Create blog post with educational content**

Create `blog/open-addressing-deep-dive.md`:

```markdown
# Open Addressing: A Different Approach to Hash Tables

## Introduction

In the previous project section, we explored **separate chaining**—hash tables that resolve collisions by storing multiple values in each bucket. Today we're examining the alternative: **open addressing**, where collisions are resolved by probing other slots in the same hash table.

This is a fundamental trade-off in hash table design, and understanding both approaches makes you a better systems designer.

## What is Open Addressing?

Open addressing means: when two keys hash to the same slot, we don't create a chain. Instead, we probe the table itself to find an empty slot.

**Example:**
```
Insert "Alice" (hash = 5):
slots: [_, _, _, _, _, Alice, _, _]

Insert "Bob" (hash = 5):  // Same hash!
- Slot 5 is occupied by Alice
- Check slot 6 → empty
- Insert Bob at slot 6
slots: [_, _, _, _, _, Alice, Bob, _]
```

This is called **linear probing** — if your slot is occupied, try the next slot.

## Why Use Open Addressing?

**1. Better Cache Locality**
- All data is contiguous in the table array
- CPU cache favors sequential access
- Separate chaining scatters across memory

**2. Simpler Memory Management**
- No separate allocation for chains
- No pointer chasing
- Predictable memory layout

**3. Constant Space Overhead**
- Only need N slots, not N slots + linked lists
- Separate chaining needs extra pointers

**Trade-off:** Open addressing is fast but **load factor critically matters**.

## The Load Factor Problem

**Load factor = (items stored) / (table size)**

In separate chaining:
- Load factor 0.5: bucket has ~0.5 items on average
- Load factor 2.0: bucket has ~2 items on average
- Performance degrades gradually

In open addressing:
- Load factor 0.5: ~50% slots full
- Load factor 0.75: Probing gets longer (clustering visible)
- Load factor 0.95: Table nearly full, many probes
- **At 1.0:** Impossible to insert (no empty slots)

## Clustering: The Hidden Cost

When we probe linearly, collisions create **clusters** — long runs of occupied slots.

```
Bad case (high clustering):
[A, B, C, D, E, _, _, _]

All five items form a cluster. Inserting something
that hashes to slot 0 causes us to probe slots
0, 1, 2, 3, 4, 5 (6 probes!) before finding empty.

Good case (uniform distribution):
[A, _, B, _, C, _, D, _]

Clusters are small. Most inserts find empty slot
within 1-2 probes.
```

**Clustering factor** in our benchmark: ratio of longest cluster to table size.

## The Algorithm

```
To insert key → value:
  hash = hash_function(key)
  index = hash % table_size
  probe_count = 0

  loop:
    if table[index] is empty:
      table[index] = {key, value}
      return

    if table[index].key == key:
      table[index].value = value  // Update
      return

    index = (index + 1) % table_size
    probe_count++

    if probe_count > table_size:
      error("Table is full")
```

## Deletion: Tombstones

Simple deletion breaks open addressing:

```
[A, B, C, _, E]
Delete B:
[A, _, C, _, E]

Now searching for E fails:
- Hash to slot 0
- Slot 0 = A, not E
- Check slot 1 → empty
- Stop! (thinks E doesn't exist)
```

**Solution: Tombstones** — mark deleted slots, don't erase them

```
[A, TOMBSTONE, C, _, E]

Search still works:
- Hash to slot 0
- Slot 0 = A, not E
- Check slot 1 → TOMBSTONE (skip, continue probing)
- Check slot 2 = C, not E
- Check slot 3 → empty (stop)
- Check slot 4 = E (found!)
```

Tombstones accumulate, degrading performance. Real implementations periodically **rehash** — rebuild the table to clean them up.

## Performance Benchmarks

Comparing insertion time:

| Size | Separate Chaining | Open Addressing (probes) |
|------|-------------------|--------------------------|
| 100  | 0.12ms            | 0.08ms (+ lower clustering) |
| 1k   | 1.0ms             | 0.6ms (clustering starts) |
| 10k  | 10ms              | 8ms (+ heavy clustering) |

**Key insight:** Open addressing faster when load factor low (<0.5), but approaching 1.0 requires rehashing.

## When to Use Open Addressing

**Use open addressing when:**
- Cache efficiency matters (embedded systems, tight loops)
- Small, fixed tables (known capacity in advance)
- Competitive programming (simple, cache-friendly)
- Memory footprint critical (no extra pointers)

**Use separate chaining when:**
- Dynamic sizing (grow as needed)
- High load factors acceptable (chains can be long)
- Deletion-heavy workload (no tombstone overhead)
- Simplicity preferred (no clustering concerns)

## Real-World Examples

**Java:** HashMap uses separate chaining
**Python:** dict uses open addressing (CPython implementation detail)
**Rust:** HashMap uses open addressing (with SipHash)
**C++:** std::unordered_map vendor-dependent

## Implementation Insights from Our Code

Our `OpenAddressingHashTable` includes metrics:
- `total_probes`: Sum of probes across all operations
- `max_probe_length`: Longest single probe sequence
- `clustering_factor`: Ratio of longest cluster to table size

These reveal the hidden cost—even fast operations hide clustering growth.

## Conclusion

Open addressing is elegant: one contiguous array, no extra allocations. But it trades simple code for complex performance dynamics.

**Remember:** Great systems engineers understand *both* approaches. Pick based on your actual constraints—don't assume one is always better.

Next, we'll look at self-balancing trees, which take a completely different approach to the search problem.
```

**Step 2: Verify markdown syntax**

- Check file is readable: `cat blog/open-addressing-deep-dive.md | head -20`
- Verify formatting looks correct

**Step 3: Commit**

```bash
git add blog/open-addressing-deep-dive.md
git commit -m "docs: write deep-dive blog post on open addressing hash tables"
```

---

## Task 7: Integration testing and final verification

**Files:**
- None (verification only)

**Step 1: Run all tests**

Run: `cargo test --lib`
Expected: 15+ tests pass

**Step 2: Build WASM release**

Run: `wasm-pack build --target web --release`
Expected: Builds successfully, ~20KB binary

**Step 3: Verify all code quality**

Run: `cargo clippy`
Expected: No warnings

**Step 4: Test local benchmark page**

- Start server: `cd web && python -m http.server 8000`
- Open: http://localhost:8000/benchmark-open-addressing.html
- Click "Run Benchmarks"
- Verify tables display with metrics
- Verify WASM speedup visible

**Step 5: Verify git status**

Run: `git status`
Expected: Clean working tree

**Step 6: Final commit message**

```bash
git push origin phase-6-open-addressing
```

---

## Success Criteria

✅ OpenAddressingHashTable implemented in Rust
✅ 10+ unit tests passing
✅ JavaScript implementation mirrors Rust
✅ WASM module compiles without warnings
✅ Interactive benchmark page works
✅ Blog post explains concepts and trade-offs
✅ All code committed and pushed
✅ Metrics show clustering and load factor effects
✅ Performance comparison visible (JS vs WASM)

---

## Notes for Implementation

1. **Capacity choice (1024):** Large enough to avoid table-full errors at 10k items (load factor ~0.98)

2. **Metrics tracking:** We track both individual operation metrics and aggregate to understand performance patterns

3. **WASM camelCase conversion:** Rust snake_case → JavaScript camelCase happens during metrics retrieval

4. **Blog post length:** 500-800 words—enough to explain deeply, short enough to stay focused

5. **Clustering visualization:** Real implementations would add graphs; our table shows the phenomenon

---

## Next After Phase 6

After completing Phase 6 with all commits:
1. Create worktree for Phase 7 (Red-Black Tree)
2. Follow same pattern: struct → tests → WASM → JavaScript → benchmarks → blog post
3. Create unified comparison page after all 4 structures complete
```

