# WASM Data Structures: HashMap vs Tree vs LinkedList

A project exploring how different data structures perform when implemented in Rust/WASM vs JavaScript. Start with HashMap, add more structures, benchmark them all.

## Phase Overview

**Phase 1** (Current): HashMap with separate chaining in Rust
- [Design Document](docs/plans/2025-11-02-phase-1-hashmap-design.md)
- Implement insert, get, delete operations
- Collect metrics (collisions, chain length, load factor)
- Unit tests verify correctness

**Phase 2**: JavaScript HashMap + benchmark UI
- Implement same HashMap in JavaScript
- Simple web interface to run operations
- Measure time for insert/get/delete

**Phase 3**: Add more data structures
- Binary Search Tree
- Linked List (optional)
- Compare all implementations

**Phase 4**: Comprehensive benchmarking
- Vary dataset size (100 to 100,000 items)
- Vary key distribution (random, sequential, clustered)
- Generate performance reports

**Phase 5**: Documentation & findings
- Blog post: "Data Structures Under Load"
- Explain which structure wins when and why
- WASM advantage analysis

## Quick Start

### Build Rust HashMap

```bash
rustup target add wasm32-unknown-unknown
cargo build
cargo test
wasm-pack build --target web --release
```

### Run Tests

```bash
cargo test
```

Expected: All unit tests pass, metrics show collision_count > 0.

## Project Structure

```
├── src/
│   └── lib.rs                    # HashMap + metrics
├── web/
│   └── benchmark.html            # Phase 2 UI
├── docs/
│   └── plans/
│       └── 2025-11-02-phase-1-hashmap-design.md
├── Cargo.toml
└── README.md
```

## What You'll Learn

- Hash functions and collision resolution
- Rust ownership with dynamic data structures
- WASM bindings and JavaScript interop
- Benchmarking and metrics collection
- Data structure trade-offs in practice

## Resources

- [Design Document](docs/plans/2025-11-02-phase-1-hashmap-design.md) - Complete Phase 1 spec
- [Rust Book](https://doc.rust-lang.org/book/) - Rust fundamentals
- [wasm-bindgen Book](https://rustwasm.org/docs/wasm-bindgen/) - WASM/JS interop
- [Hash Table Fundamentals](https://en.wikipedia.org/wiki/Hash_table) - Theory background
