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
