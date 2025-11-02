# Phase 1 Design: HashMap with Separate Chaining

**Date**: 2025-11-02
**Status**: Design validated, ready for implementation
**Scope**: Single HashMap implementation in Rust/WASM with metrics collection

---

## Overview

Phase 1 deliverable: A Rust HashMap using separate chaining collision resolution that compiles to WebAssembly, with instrumentation for metrics collection (collisions, chain length, load factor).

**Why this approach**:
- Pragmatic (Vec-based, not manual LinkedList)
- Benchmark-ready (metrics collection built-in)
- WASM-friendly (straightforward wasm-bindgen interface)
- Sets foundation for Phase 2 (JavaScript equivalent) and Phase 3 (performance comparison)

---

## Design Decisions

### 1. Data Structure: Separate Chaining with Vec<Vec<>> Buckets

**Choice**: Vec<Vec<(String, u32)>> for bucket storage

**Rationale**:
- Simpler than manual LinkedList management
- Rust Vec is well-supported in wasm-bindgen
- Clear collision visualization (each bucket is a Vec of collisions)
- Good cache locality compared to pointer-based chains

**Structure**:
```rust
pub struct HashMap {
    buckets: Vec<Vec<(String, u32)>>,  // buckets[i] = chain of (key, value) pairs
    size: usize,                        // Total entries stored
    capacity: usize,                    // Number of buckets = 256 (fixed)
}
```

**Memory Layout**:
- Fixed 256 buckets allocated at creation
- Each bucket grows independently as collisions occur
- Total memory = 256 × vec_header + sum of all bucket allocations
- Load factor = size / 256

### 2. Hash Function

**Choice**: Rust's `std::collections::hash_map::DefaultHasher`

**Rationale**:
- Industry standard, good distribution
- Prevents algorithmic attacks (SipHash-like)
- No additional dependencies
- Well-tested in stdlib

**Implementation**:
```rust
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

fn hash_key(key: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    key.hash(&mut hasher);
    hasher.finish()
}

fn bucket_index(hash: u64, capacity: usize) -> usize {
    (hash as usize) % capacity
}
```

### 3. Key & Value Types

**Choice**: String keys, u32 values

**Rationale**:
- Realistic (word→count, ID→count)
- Teaches string handling in WASM/FFI
- u32 values keep it simple (no complex types yet)

### 4. Capacity

**Choice**: Fixed 256 buckets

**Rationale**:
- 256 = 2^8, good balance (not too sparse, not too packed)
- 10,000 insertions → ~39 entries per bucket on average
- Will show meaningful collision behavior
- Manageable for manual testing

### 5. Operations: Minimal Set

**Insert(key: String, value: u32)**
- Hash the key
- Get bucket index = hash % 256
- Search bucket for existing key
  - If found: update value (not a collision count)
  - If not found: push (key, value) to bucket, increment collision counter if bucket was non-empty
- Update size

**Get(key: String) → Option<u32>**
- Hash the key
- Get bucket at index
- Linear search through bucket for matching key
- Return value if found, None otherwise

**Delete(key: String) → bool**
- Hash the key
- Get bucket at index
- Search for key in bucket
- If found: remove, return true, update size
- Else: return false

**Error Handling**:
- Unwrap string operations (fail loud if encoding is bad)
- Phase 1 learning exercise, not production-grade

### 6. Metrics Collection

**Metrics Struct**:
```rust
pub struct HashMapMetrics {
    pub total_insertions: u32,      // Count of all insert operations
    pub total_collisions: u32,      // Count of inserts into non-empty bucket
    pub max_chain_length: u32,      // Longest chain in any bucket
    pub average_load_factor: f32,   // size / capacity
}
```

**Collection Strategy**:
- Update after every insert operation
- collision += 1 when inserting into bucket with existing entries
- max_chain_length = max(all bucket lengths)
- average_load_factor = (float)size / 256.0

**Why metrics**:
- Understand collision distribution
- Compare with Phase 2 JavaScript version
- Diagnose performance in Phase 3
- Teach relationship between load factor and collision rate

---

## WASM Interface

**Public API via wasm-bindgen**:

```rust
#[wasm_bindgen]
pub struct HashMap { ... }

#[wasm_bindgen]
impl HashMap {
    #[wasm_bindgen(constructor)]
    pub fn new() -> HashMap {
        // Initialize 256 empty buckets
    }

    pub fn insert(&mut self, key: String, value: u32) {
        // Hash, find bucket, insert or update
    }

    pub fn get(&self, key: String) -> Option<u32> {
        // Hash, find bucket, search
    }

    pub fn delete(&mut self, key: String) -> bool {
        // Hash, find bucket, remove if found
    }

    pub fn get_metrics(&self) -> HashMapMetrics {
        // Return current metrics
    }
}

#[wasm_bindgen]
pub struct HashMapMetrics {
    pub total_insertions: u32,
    pub total_collisions: u32,
    pub max_chain_length: u32,
    pub average_load_factor: f32,
}
```

**JavaScript Usage** (Phase 2):
```javascript
import init, { HashMap, HashMapMetrics } from './pkg/wasm_data_structures.js';

await init();
const map = new HashMap();

// Insert 10k items
for (let i = 0; i < 10000; i++) {
    map.insert(`key${i}`, i);
}

// Get metrics
const metrics = map.get_metrics();
console.log(`Collisions: ${metrics.total_collisions}`);
console.log(`Max chain: ${metrics.max_chain_length}`);
```

---

## Testing Strategy

**Unit Tests** (in src/lib.rs):

**1. Correctness Tests**
- Insert string, get it back ✓
- Insert multiple, retrieve all ✓
- Update existing key (value changes) ✓
- Delete from map (confirm removal) ✓
- Get non-existent key (returns None) ✓

**2. Metrics Tests**
- 10,000 insertions to 256 buckets → total_collisions > 0 ✓
- max_chain_length > 0 ✓
- average_load_factor ≈ 10000/256 ≈ 39 ✓

**3. Edge Cases**
- Empty map queries (returns None)
- Delete from empty map (returns false)
- Collision chains (pick keys that hash to same bucket)

**Run Tests**:
```bash
cargo test
```

**Expected Results**:
- All tests pass
- Metrics show collision_count > 0
- Max chain length correlates with collisions
- Load factor increases linearly with insertions

---

## Project Structure

```
wasm-data-structures/
├── src/
│   ├── lib.rs                      # HashMap + metrics structs
│   └── tests.rs (in lib.rs)        # Unit tests inline
├── web/
│   ├── benchmark.html              # Placeholder (Phase 2)
│   └── index.html                  # Placeholder (Phase 2)
├── docs/
│   └── plans/
│       └── 2025-11-02-phase-1-hashmap-design.md  # This file
├── Cargo.toml                      # Rust project manifest
├── .gitignore                      # Git ignore rules
└── README.md                       # Project overview
```

---

## Success Criteria

Phase 1 is complete when:

✅ HashMap compiles without warnings
✅ wasm-pack builds to WASM successfully
✅ All 12+ unit tests pass
✅ Metrics are collected and accessible
✅ 10,000 insertions work correctly
✅ Collision count > 0 (proves collision resolution working)
✅ Code is well-commented with physics/algorithm explanations
✅ Design document is committed to git

---

## Dependencies

**Rust**:
- `wasm-bindgen` (0.2) - JavaScript ↔ Rust FFI
- `wasm-bindgen-test` (0.3) - WASM-compatible tests
- Standard library only (no external crates for HashMap logic)

**Why minimal**:
- Learning exercise (understand implementation, not just use lib)
- WASM binary size (keep it small)
- Full control over implementation details

---

## Learning Outcomes

By completing Phase 1, you will understand:

1. **Hash Functions**: How to distribute keys across buckets
2. **Collision Resolution**: Separate chaining trade-offs (simple vs other methods)
3. **Rust Ownership**: Managing Vec<Vec<>> without manual memory management
4. **WASM Bindings**: How wasm-bindgen automatically creates JS interface
5. **Metrics Collection**: Instrumenting code to understand performance
6. **Testing in WASM**: Writing unit tests for compiled WASM code

---

## Timeline

**Estimated**: 1-2 days of focused work

- Day 1: Implement HashMap, add basic operations (insert, get, delete)
- Day 1: Write comprehensive tests
- Day 2: Add metrics collection, ensure all tests pass
- Day 2: Build WASM, verify JavaScript can call methods

---

## Next Steps (Phases 2-5)

- **Phase 2**: Implement same HashMap in JavaScript, create basic benchmark UI
- **Phase 3**: Add Binary Search Tree, Linked List
- **Phase 4**: Comprehensive benchmarking (vary dataset size, operations, measure time)
- **Phase 5**: Documentation and blog post explaining findings

---

## Questions & Open Decisions

None—design is fully specified and validated.

Status: Ready for implementation.
