# Tries: When Generic Data Structures Aren't Enough

**Published**: November 3, 2025
**Author**: Learning series on data structures
**Word count**: ~780 words

## The Problem: String Operations Are Different

Hash tables excel at exact key lookups. Binary search trees provide ordered traversal. But strings present unique challenges:

- How do you efficiently find all words starting with "hel"?
- How do you autocomplete user input as they type?
- How do you check if "hello" is valid when you've already validated "help"?

Hash tables can't answer prefix queries without scanning every key. Search trees require string comparisons at every node. **We need a structure that exploits the sequential nature of strings**.

The answer? **Decompose strings into characters and share the work**.

## The Key Insight: Characters as Paths

Instead of storing complete strings at nodes, store **one character per edge**. Words become paths through a tree:

```
         ROOT
         /  \
        h    w
       /      \
      e        o
     / \        \
    l   r        r
   /     \        \
  l       e        l
 / \       \        \
o   p       r        d
[END]     [END]    [END]
```

This tree stores "hello", "help", "her", and "world". Notice how "hel" is traversed once, then branches. **Shared prefixes use shared nodes** — the core efficiency of tries.

## Architecture: Tree of Characters

A Trie (pronounced "try") consists of:

1. **Nodes**: Each represents a position in a word
2. **Edges**: Labeled with characters (a-z, or any alphabet)
3. **End-of-word markers**: Flags indicating complete words
4. **Root node**: Represents the empty string

```rust
struct TrieNode {
    children: HashMap<char, Box<TrieNode>>,  // Character → child
    is_end_of_word: bool,                    // Marks complete words
}
```

Unlike binary trees with 2 children, trie nodes can have up to 26 children (lowercase English). This branching enables character-level granularity.

## Operations: Exploiting Structure

### Insert: O(m) where m = word length

```
insert("test"):
1. Start at root
2. Follow/create edge 't'
3. Follow/create edge 'e'
4. Follow/create edge 's'
5. Follow/create edge 't'
6. Mark as end-of-word
```

**Key**: No string comparisons. Just follow character paths, reusing existing nodes.

### Search: O(m)

```
search("help"):
1. From root, follow 'h' → 'e' → 'l' → 'p'
2. Check if node is marked end-of-word
3. Return found/not found
```

**Fast failure**: Missing character means word doesn't exist.

### Autocomplete: O(m + k) where k = result characters

```
autocomplete("hel"):
1. Navigate to "hel" node (O(3))
2. DFS from that node to collect words
3. Return ["hello", "help", "helmet"]
```

Skip straight to the prefix subtree, then gather results.

## Memory Efficiency: Prefix Sharing

Store 1,000 words starting with "test":
- **Hash table**: 1,000 separate strings, repeating "test" 1,000 times
- **Trie**: One path for "test", then 1,000 branches

**Impact**: English dictionaries (470K words) compress from ~6MB to ~1.5MB due to shared prefixes ("un-", "pre-", "re-").

## Real-World Applications

**Autocomplete systems**: Every search engine, IDE, and smartphone keyboard. Google processes billions of prefix queries daily.

**Spell checkers**: Validate words and find neighbors by exploring similar paths.

**IP routing**: Longest prefix matching. "192.168.1.1" shares prefixes with "192.168.1.0/24".

**DNS lookups**: Domain names are hierarchical (com.google.www), fitting trie structure naturally.

## Tries vs Hash Tables

| Aspect | Trie | Hash Table |
|--------|------|------------|
| **Exact lookup** | O(m) | O(1) average |
| **Prefix search** | O(m) | O(n) - scan all |
| **Autocomplete** | O(m + k) | Not supported |
| **Memory (shared prefixes)** | Efficient | Inefficient |
| **Memory (random strings)** | Overhead | Compact |
| **Ordered traversal** | Yes | No |

**Use tries for**: Prefix queries, autocomplete, dictionaries with common prefixes.

**Use hash tables for**: Exact lookups only, random keys, memory constraints.

## Variants and Optimizations

**Compressed tries (Radix trees)**: Compress single-child chains. Store "hello" as root→"hello" instead of 5 nodes. Used in Git.

**Ternary search tries**: 3 children per node (less/equal/greater) instead of 26. Better memory for sparse alphabets.

**Suffix tries**: Store all text suffixes. Enables O(m) substring search.

## The Educational Takeaway

Tries teach us that **data structure choice depends on operation patterns**. Generic structures work broadly, but specialized structures win when exploiting problem-specific properties.

For strings, those properties are:
- Sequential character access
- Shared prefixes
- Prefix-based queries

Understanding tries reveals when problem structure demands specialized solutions rather than generic tools.

**Try it yourself**: Implement a trie, insert a dictionary, test autocomplete. Then try with a hash table. Feel the difference.

---

**Explore further**:
- Fredkin, E. (1960). "Trie memory"
- Redis sorted sets use tries for range queries
- Succinct tries (space-efficient representations)
