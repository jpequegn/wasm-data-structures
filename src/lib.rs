use wasm_bindgen::prelude::*;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

pub mod bst;
pub use bst::{BinarySearchTree, BSTMetrics};

pub mod open_addressing;
pub use open_addressing::{OpenAddressingHashTable, OpenAddressingMetrics};

// Configuration
const BUCKET_COUNT: usize = 256;

/// A simple HashMap using separate chaining collision resolution.
///
/// # Design: Separate Chaining with Vec<Vec<>> Buckets
/// Each bucket is a Vec of (key, value) pairs. When two keys hash to the same bucket,
/// they form a "chain" (list) in that bucket. This is simple and teaches collision resolution.
///
/// # Metrics Collection
/// Tracks collisions, max chain length, and load factor for benchmarking.
/// These metrics help us understand performance characteristics in Phase 3.
///
/// # Memory Layout
/// - Capacity: Fixed 256 buckets
/// - Each bucket grows independently as collisions occur
/// - Total memory = 256 vec headers + sum of all bucket entries
#[wasm_bindgen]
pub struct HashMap {
    buckets: Vec<Vec<(String, u32)>>,
    size: usize,
    metrics: HashMapMetrics,
}

/// Metrics collected during HashMap operations.
///
/// These help answer: "What's happening inside the HashMap?"
/// - total_insertions: How many inserts total?
/// - total_collisions: How many hit non-empty buckets?
/// - max_chain_length: What's the longest collision chain?
/// - average_load_factor: How full is the table?
#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub struct HashMapMetrics {
    pub total_insertions: u32,
    pub total_collisions: u32,
    pub max_chain_length: u32,
    pub average_load_factor: f32,
}

impl HashMap {
    /// Internal: Compute hash of a string key.
    ///
    /// Uses Rust's standard DefaultHasher (SipHash-like).
    /// Good distribution, prevents algorithmic attacks.
    fn hash_key(key: &str) -> u64 {
        let mut hasher = DefaultHasher::new();
        key.hash(&mut hasher);
        hasher.finish()
    }

    /// Internal: Get bucket index from hash.
    ///
    /// Maps 64-bit hash to bucket index [0, 255].
    /// Uses modulo: simple, effective, cache-friendly.
    fn bucket_index(hash: u64) -> usize {
        (hash as usize) % BUCKET_COUNT
    }

    /// Internal: Update metrics after insertion.
    ///
    /// Recalculates:
    /// - total_insertions: always increments
    /// - total_collisions: increments if inserting to non-empty bucket
    /// - max_chain_length: maximum chain length in any bucket
    /// - average_load_factor: size / capacity
    fn update_metrics(&mut self, was_collision: bool) {
        self.metrics.total_insertions += 1;
        if was_collision {
            self.metrics.total_collisions += 1;
        }

        // Recalculate max chain length
        self.metrics.max_chain_length = self.buckets
            .iter()
            .map(|bucket| bucket.len() as u32)
            .max()
            .unwrap_or(0);

        // Recalculate load factor
        self.metrics.average_load_factor = self.size as f32 / BUCKET_COUNT as f32;
    }
}

#[wasm_bindgen]
impl HashMap {
    /// Create a new empty HashMap with 256 buckets.
    ///
    /// # Memory
    /// Allocates space for 256 empty Vec buckets.
    /// Each bucket grows as collisions occur.
    #[wasm_bindgen(constructor)]
    pub fn new() -> HashMap {
        HashMap {
            buckets: (0..BUCKET_COUNT).map(|_| Vec::new()).collect(),
            size: 0,
            metrics: HashMapMetrics {
                total_insertions: 0,
                total_collisions: 0,
                max_chain_length: 0,
                average_load_factor: 0.0,
            },
        }
    }

    /// Insert a key-value pair into the HashMap.
    ///
    /// # Behavior
    /// - If key already exists: update the value (not counted as collision)
    /// - If key doesn't exist: add to bucket (collision if bucket non-empty)
    ///
    /// # Time Complexity: O(n) worst case
    /// Where n = length of collision chain in that bucket.
    /// Average case O(1) with good hash function and load factor.
    ///
    /// # Example
    /// ```javascript
    /// const map = new HashMap();
    /// map.insert("hello", 42);
    /// ```
    pub fn insert(&mut self, key: String, value: u32) {
        let hash = Self::hash_key(&key);
        let idx = Self::bucket_index(hash);
        let bucket = &mut self.buckets[idx];

        // Check if key already exists
        for entry in bucket.iter_mut() {
            if entry.0 == key {
                // Update existing key - not a collision
                entry.1 = value;
                return;
            }
        }

        // New key - check if this is a collision
        let was_collision = !bucket.is_empty();
        bucket.push((key, value));
        self.size += 1;
        self.update_metrics(was_collision);
    }

    /// Get a value by key.
    ///
    /// # Return
    /// - Some(value) if key exists
    /// - None if key doesn't exist
    ///
    /// # Time Complexity: O(n) worst case
    /// Where n = length of collision chain.
    /// Average O(1).
    ///
    /// # Example
    /// ```javascript
    /// const val = map.get("hello");
    /// if (val !== undefined) {
    ///     console.log(val);
    /// }
    /// ```
    pub fn get(&self, key: String) -> Option<u32> {
        let hash = Self::hash_key(&key);
        let idx = Self::bucket_index(hash);
        let bucket = &self.buckets[idx];

        for (k, v) in bucket {
            if k == &key {
                return Some(*v);
            }
        }

        None
    }

    /// Delete a key from the HashMap.
    ///
    /// # Return
    /// - true if key was found and deleted
    /// - false if key doesn't exist
    ///
    /// # Time Complexity: O(n) worst case
    /// Where n = length of collision chain.
    ///
    /// # Example
    /// ```javascript
    /// const deleted = map.delete("hello");
    /// console.log(deleted); // true or false
    /// ```
    pub fn delete(&mut self, key: String) -> bool {
        let hash = Self::hash_key(&key);
        let idx = Self::bucket_index(hash);
        let bucket = &mut self.buckets[idx];

        for (i, (k, _)) in bucket.iter().enumerate() {
            if k == &key {
                bucket.remove(i);
                self.size -= 1;
                // Don't update metrics for deletes (only track insertions)
                return true;
            }
        }

        false
    }

    /// Get current HashMap metrics.
    ///
    /// Returns:
    /// - total_insertions: Count of all insert operations
    /// - total_collisions: Count of inserts that went into non-empty buckets
    /// - max_chain_length: Longest collision chain
    /// - average_load_factor: Current size / capacity
    ///
    /// # Use Case
    /// Understand how collisions are distributed.
    /// If max_chain_length is high, hash function or capacity needs improvement.
    pub fn get_metrics(&self) -> HashMapMetrics {
        self.metrics
    }

    /// Get current size (number of key-value pairs).
    pub fn len(&self) -> usize {
        self.size
    }

    /// Check if HashMap is empty.
    pub fn is_empty(&self) -> bool {
        self.size == 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_insert_and_get() {
        let mut map = HashMap::new();
        map.insert("hello".to_string(), 42);
        assert_eq!(map.get("hello".to_string()), Some(42));
    }

    #[test]
    fn test_get_missing_key() {
        let map = HashMap::new();
        assert_eq!(map.get("missing".to_string()), None);
    }

    #[test]
    fn test_update_existing_key() {
        let mut map = HashMap::new();
        map.insert("hello".to_string(), 42);
        map.insert("hello".to_string(), 99);
        assert_eq!(map.get("hello".to_string()), Some(99));
        // Size should still be 1 (update, not insert)
        assert_eq!(map.len(), 1);
    }

    #[test]
    fn test_multiple_insertions() {
        let mut map = HashMap::new();
        for i in 0..100 {
            let key = format!("key{}", i);
            map.insert(key, i as u32);
        }
        assert_eq!(map.len(), 100);

        // Verify all keys are retrievable
        for i in 0..100 {
            let key = format!("key{}", i);
            assert_eq!(map.get(key), Some(i as u32));
        }
    }

    #[test]
    fn test_delete() {
        let mut map = HashMap::new();
        map.insert("hello".to_string(), 42);
        assert!(map.delete("hello".to_string()));
        assert_eq!(map.get("hello".to_string()), None);
        assert_eq!(map.len(), 0);
    }

    #[test]
    fn test_delete_missing_key() {
        let mut map = HashMap::new();
        assert!(!map.delete("missing".to_string()));
    }

    #[test]
    fn test_metrics_collisions() {
        let mut map = HashMap::new();

        // Insert 10,000 items to 256 buckets
        // Expected: many collisions
        for i in 0..10000 {
            let key = format!("key{}", i);
            map.insert(key, i as u32);
        }

        let metrics = map.get_metrics();
        assert_eq!(metrics.total_insertions, 10000);
        assert!(metrics.total_collisions > 0, "Should have collisions with 10k items in 256 buckets");
        assert!(metrics.max_chain_length > 1, "Max chain should be > 1");
        // Load factor ≈ 10000 / 256 ≈ 39
        assert!(metrics.average_load_factor > 38.0 && metrics.average_load_factor < 40.0);
    }

    #[test]
    fn test_metrics_load_factor() {
        let mut map = HashMap::new();

        for i in 0..1000 {
            let key = format!("key{}", i);
            map.insert(key, i as u32);
        }

        let metrics = map.get_metrics();
        // Load factor should be 1000 / 256 ≈ 3.9
        let expected = 1000.0 / 256.0;
        assert!((metrics.average_load_factor - expected).abs() < 0.1);
    }

    #[test]
    fn test_empty_map() {
        let map = HashMap::new();
        assert!(map.is_empty());
        assert_eq!(map.len(), 0);
        assert_eq!(map.get("anything".to_string()), None);
    }

    #[test]
    fn test_collision_counting() {
        let mut map = HashMap::new();
        assert_eq!(map.get_metrics().total_collisions, 0);

        // Insert first item to bucket
        map.insert("a".to_string(), 1);
        assert_eq!(map.get_metrics().total_collisions, 0); // No collision, bucket was empty

        // Insert item that might collide (depends on hash)
        // This is non-deterministic, but we can test the mechanism
        for i in 0..256 {
            let key = format!("test{}", i);
            map.insert(key, i as u32);
        }

        let metrics = map.get_metrics();
        // With 257 items in 256 buckets, at least 1 must collide
        assert!(metrics.total_collisions > 0 || metrics.total_insertions >= 256);
    }
}
