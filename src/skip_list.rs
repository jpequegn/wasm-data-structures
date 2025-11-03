use wasm_bindgen::prelude::*;
use rand::Rng;
use std::rc::Rc;
use std::cell::RefCell;

const MAX_LEVEL: usize = 16;
const LEVEL_PROBABILITY: f32 = 0.5;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct SkipListMetrics {
    pub total_insertions: u32,
    pub total_searches: u32,
    pub search_comparisons: u32,
    pub average_level: f32,
    pub max_level: u32,
    pub insertion_cost: u32,
}

type NodePtr = Rc<RefCell<Node>>;

struct Node {
    key: String,
    value: u32,
    level: usize,
    forward: Vec<Option<NodePtr>>,
}

impl Node {
    fn new(key: String, value: u32, level: usize) -> Self {
        Node {
            key,
            value,
            level,
            forward: vec![None; level + 1],
        }
    }
}

#[wasm_bindgen]
pub struct SkipList {
    head: NodePtr,
    level: usize,
    size: u32,
    metrics: SkipListMetrics,
}

#[wasm_bindgen]
impl SkipList {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SkipList {
        let head = Rc::new(RefCell::new(Node::new("".to_string(), 0, MAX_LEVEL)));

        SkipList {
            head,
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
    fn random_level() -> usize {
        let mut rng = rand::thread_rng();
        let mut level = 0;
        while level < MAX_LEVEL && rng.gen::<f32>() < LEVEL_PROBABILITY {
            level += 1;
        }
        level
    }

    /// Search for a key in the skip list
    /// Returns Some(value) if found, None otherwise
    pub fn search(&mut self, key: &str) -> Option<u32> {
        self.metrics.total_searches += 1;
        let mut comparisons = 0u32;

        let mut current = self.head.clone();

        // Start from highest level and work down
        for lv in (0..=self.level).rev() {
            loop {
                let next = current.borrow().forward[lv].clone();
                match next {
                    None => break,
                    Some(next_node) => {
                        comparisons += 1;
                        let next_key = next_node.borrow().key.clone();
                        if next_key.as_str() < &key {
                            current = next_node.clone();
                        } else {
                            break;
                        }
                    }
                }
            }
        }

        // Check exact match at level 0
        self.metrics.search_comparisons += comparisons;
        let next_at_zero = current.borrow().forward[0].clone();
        if let Some(next_node) = next_at_zero {
            let node_key = next_node.borrow().key.clone();
            if node_key.as_str() == key {
                return Some(next_node.borrow().value);
            }
        }

        None
    }

    /// Insert a key-value pair into the skip list
    /// If key exists, update the value
    pub fn insert(&mut self, key: String, value: u32) {
        let is_new = self.search(&key).is_none();
        let new_level = Self::random_level();

        // Expand list level if necessary
        if new_level > self.level {
            self.level = new_level;
        }

        // Find insertion points at each level
        let mut update: Vec<NodePtr> = Vec::with_capacity(self.level + 1);
        let mut current = self.head.clone();

        for lv in (0..=self.level).rev() {
            loop {
                let next = current.borrow().forward[lv].clone();
                match next {
                    None => break,
                    Some(next_node) => {
                        let next_key = next_node.borrow().key.clone();
                        if next_key.as_str() < &key {
                            current = next_node.clone();
                        } else {
                            break;
                        }
                    }
                }
            }
            update.push(current.clone());
        }

        // Reverse update array so indices match levels
        update.reverse();

        // Check if we need to update existing node
        if !is_new {
            // Find the node and update its value
            let next_at_zero = update[0].borrow().forward[0].clone();
            if let Some(existing_node) = next_at_zero {
                let existing_key = existing_node.borrow().key.clone();
                if existing_key.as_str() == &key {
                    existing_node.borrow_mut().value = value;
                    self.metrics.total_insertions += 1;
                    return;
                }
            }
        }

        // Create new node
        let new_node = Rc::new(RefCell::new(Node::new(key.clone(), value, new_level)));

        // Link node at each level
        for lv in 0..=new_level.min(self.level) {
            let next_at_lv = update[lv].borrow_mut().forward[lv].take();
            new_node.borrow_mut().forward[lv] = next_at_lv;
            update[lv].borrow_mut().forward[lv] = Some(new_node.clone());
        }

        if is_new {
            self.size += 1;
        }

        self.metrics.total_insertions += 1;
        self.metrics.insertion_cost = new_level as u32;
        self.update_metrics();
    }

    /// Delete a key from the skip list
    /// Returns Some(value) if found and deleted, None if key doesn't exist
    pub fn delete(&mut self, key: &str) -> Option<u32> {
        // Find node and all update points
        let mut update: Vec<NodePtr> = Vec::with_capacity(self.level + 1);
        let mut current = self.head.clone();

        // Traverse from top level down, tracking update points
        for lv in (0..=self.level).rev() {
            loop {
                let next = current.borrow().forward[lv].clone();
                match next {
                    None => break,
                    Some(next_node) => {
                        let next_key = next_node.borrow().key.clone();
                        if next_key.as_str() < key {
                            current = next_node.clone();
                        } else {
                            break;
                        }
                    }
                }
            }
            update.push(current.clone());
        }

        // Reverse update array so indices match levels
        update.reverse();

        // Check if key exists at level 0
        let next_at_zero = update[0].borrow().forward[0].clone();
        if let Some(node_to_delete) = next_at_zero {
            let node_key = node_to_delete.borrow().key.clone();
            if node_key.as_str() == key {
                let deleted_value = node_to_delete.borrow().value;

                // Remove node from all levels it appears in
                for lv in 0..=self.level {
                    let update_node = &update[lv];
                    let next_at_lv = update_node.borrow().forward[lv].clone();

                    if let Some(ref next_node) = next_at_lv {
                        if next_node.borrow().key.as_str() == key {
                            // Link around the deleted node
                            let deleted_forward = next_node.borrow_mut().forward[lv].take();
                            update_node.borrow_mut().forward[lv] = deleted_forward;
                        }
                    }
                }

                // Decrement size
                self.size -= 1;

                // Update metrics
                self.update_metrics();

                return Some(deleted_value);
            }
        }

        None
    }

    fn update_metrics(&mut self) {
        // Calculate average level by traversing bottom level
        let mut total_level = 0u32;
        let mut count = 0u32;

        let mut current = self.head.clone();
        loop {
            let next_opt = current.borrow().forward[0].clone();
            match next_opt {
                None => break,
                Some(next_node) => {
                    total_level += next_node.borrow().level as u32;
                    count += 1;
                    current = next_node;
                }
            }
        }

        self.metrics.average_level = if count > 0 {
            total_level as f32 / count as f32
        } else {
            0.0
        };

        self.metrics.max_level = self.level as u32;
    }

    pub fn get_metrics(&self) -> SkipListMetrics {
        self.metrics.clone()
    }

    pub fn len(&self) -> u32 {
        self.size
    }

    pub fn is_empty(&self) -> bool {
        self.size == 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_insert_and_search_single() {
        let mut list = SkipList::new();
        list.insert("key1".to_string(), 100);
        assert_eq!(list.search("key1"), Some(100));
        assert_eq!(list.len(), 1);
    }

    #[test]
    fn test_insert_multiple_ordered() {
        let mut list = SkipList::new();
        for i in 0..50 {
            list.insert(format!("key{:02}", i), i);
        }

        // Verify all keys are searchable
        for i in 0..50 {
            assert_eq!(list.search(&format!("key{:02}", i)), Some(i));
        }
        assert_eq!(list.len(), 50);
    }

    #[test]
    fn test_search_returns_correct_values() {
        let mut list = SkipList::new();
        list.insert("apple".to_string(), 1);
        list.insert("banana".to_string(), 2);
        list.insert("cherry".to_string(), 3);

        assert_eq!(list.search("apple"), Some(1));
        assert_eq!(list.search("banana"), Some(2));
        assert_eq!(list.search("cherry"), Some(3));
    }

    #[test]
    fn test_search_nonexistent() {
        let mut list = SkipList::new();
        list.insert("key1".to_string(), 100);
        assert_eq!(list.search("key2"), None);
        assert_eq!(list.search("nonexistent"), None);
    }

    #[test]
    fn test_sequential_insertion_with_levels() {
        let mut list = SkipList::new();
        for i in 0..100 {
            list.insert(format!("key{:03}", i), i);
        }

        assert_eq!(list.len(), 100);
        let metrics = list.get_metrics();
        // Average level should be reasonable (< 10 for 100 items)
        // log2(100) ≈ 6.6, so average should be around that
        assert!(metrics.average_level < 10.0, "Average level {} should be < 10", metrics.average_level);
    }

    #[test]
    fn test_search_comparisons_logarithmic() {
        let mut list = SkipList::new();

        // Insert 1000 items
        for i in 0..1000 {
            list.insert(format!("key{:04}", i), i);
        }

        // Reset comparisons counter
        list.metrics.search_comparisons = 0;
        list.metrics.total_searches = 0;

        // Search for a middle element
        list.search("key0500");

        // For 1000 items, expected comparisons ≈ log2(1000) ≈ 10
        // Allow generous margin (< 50 comparisons)
        let comparisons_per_search = list.metrics.search_comparisons / list.metrics.total_searches.max(1);
        assert!(comparisons_per_search < 50, "Comparisons {} should be logarithmic", comparisons_per_search);
    }

    #[test]
    fn test_multiple_insertions_with_metrics() {
        let mut list = SkipList::new();

        for i in 0..50 {
            list.insert(format!("key{}", i), i);
        }

        let metrics = list.get_metrics();
        assert_eq!(metrics.total_insertions, 50);
        assert!(metrics.average_level > 0.0);
        assert!(metrics.max_level <= MAX_LEVEL as u32);
    }

    #[test]
    fn test_update_existing_key() {
        let mut list = SkipList::new();

        list.insert("key1".to_string(), 100);
        assert_eq!(list.len(), 1);

        // Update same key with new value
        list.insert("key1".to_string(), 200);
        assert_eq!(list.len(), 1); // Size shouldn't change
        assert_eq!(list.search("key1"), Some(200)); // Value should update
    }

    #[test]
    fn test_random_insertions() {
        let mut list = SkipList::new();

        // Insert in non-sequential order
        let keys = vec!["zebra", "alpha", "middle", "beta", "zulu", "alpha-2"];
        for (i, key) in keys.iter().enumerate() {
            list.insert(key.to_string(), i as u32);
        }

        // All should be searchable
        for (i, key) in keys.iter().enumerate() {
            assert_eq!(list.search(key), Some(i as u32));
        }
    }

    #[test]
    fn test_level_distribution() {
        let mut list = SkipList::new();

        // Insert 1000 items
        for i in 0..1000 {
            list.insert(format!("key{:04}", i), i);
        }

        let metrics = list.get_metrics();
        // For 1000 items with P=0.5:
        // Expected average level with geometric distribution is around 1
        // (each node has 50% chance to be at level 0, 25% at level 1, etc.)
        // But actual average should be between 0.5 and 3.0 for random distribution
        assert!(metrics.average_level >= 0.5 && metrics.average_level <= 3.0,
                "Average level {} should be between 0.5-3.0", metrics.average_level);
    }

    // ========== NEW DELETE TESTS ==========

    #[test]
    fn test_delete_single_item() {
        let mut list = SkipList::new();
        list.insert("only".to_string(), 42);

        assert_eq!(list.len(), 1);
        assert_eq!(list.delete("only"), Some(42));
        assert_eq!(list.len(), 0);
        assert!(list.is_empty());
        assert_eq!(list.search("only"), None);
    }

    #[test]
    fn test_delete_multiple_items() {
        let mut list = SkipList::new();

        // Insert 10 items
        for i in 0..10 {
            list.insert(format!("key{}", i), i);
        }

        // Delete items 2, 5, 7
        assert_eq!(list.delete("key2"), Some(2));
        assert_eq!(list.delete("key5"), Some(5));
        assert_eq!(list.delete("key7"), Some(7));

        assert_eq!(list.len(), 7);

        // Verify deleted items are gone
        assert_eq!(list.search("key2"), None);
        assert_eq!(list.search("key5"), None);
        assert_eq!(list.search("key7"), None);

        // Verify remaining items still exist
        assert_eq!(list.search("key0"), Some(0));
        assert_eq!(list.search("key1"), Some(1));
        assert_eq!(list.search("key3"), Some(3));
        assert_eq!(list.search("key4"), Some(4));
        assert_eq!(list.search("key6"), Some(6));
        assert_eq!(list.search("key8"), Some(8));
        assert_eq!(list.search("key9"), Some(9));
    }

    #[test]
    fn test_delete_nonexistent_key() {
        let mut list = SkipList::new();
        list.insert("key1".to_string(), 100);

        assert_eq!(list.delete("nonexistent"), None);
        assert_eq!(list.len(), 1); // Size unchanged
        assert_eq!(list.search("key1"), Some(100)); // Original still there
    }

    #[test]
    fn test_delete_and_reinsert() {
        let mut list = SkipList::new();

        list.insert("key1".to_string(), 100);
        assert_eq!(list.delete("key1"), Some(100));
        assert_eq!(list.search("key1"), None);

        // Re-insert same key with different value
        list.insert("key1".to_string(), 200);
        assert_eq!(list.search("key1"), Some(200));
        assert_eq!(list.len(), 1);
    }

    #[test]
    fn test_delete_maintains_order() {
        let mut list = SkipList::new();

        // Insert in order
        for i in 0..20 {
            list.insert(format!("key{:02}", i), i);
        }

        // Delete every other item
        for i in (0..20).step_by(2) {
            list.delete(&format!("key{:02}", i));
        }

        assert_eq!(list.len(), 10);

        // Verify remaining items (odd indices) are still searchable in order
        for i in (1..20).step_by(2) {
            assert_eq!(list.search(&format!("key{:02}", i)), Some(i),
                      "key{:02} should still exist", i);
        }
    }

    #[test]
    fn test_size_tracking_with_deletes() {
        let mut list = SkipList::new();

        assert_eq!(list.len(), 0);

        list.insert("a".to_string(), 1);
        assert_eq!(list.len(), 1);

        list.insert("b".to_string(), 2);
        assert_eq!(list.len(), 2);

        list.insert("c".to_string(), 3);
        assert_eq!(list.len(), 3);

        list.delete("b");
        assert_eq!(list.len(), 2);

        list.delete("a");
        assert_eq!(list.len(), 1);

        list.delete("c");
        assert_eq!(list.len(), 0);
        assert!(list.is_empty());
    }

    #[test]
    fn test_metrics_after_deletes() {
        let mut list = SkipList::new();

        // Insert 100 items
        for i in 0..100 {
            list.insert(format!("key{:03}", i), i);
        }

        let metrics_before = list.get_metrics();
        assert_eq!(list.len(), 100);

        // Delete 50 items
        for i in (0..100).step_by(2) {
            list.delete(&format!("key{:03}", i));
        }

        let metrics_after = list.get_metrics();
        assert_eq!(list.len(), 50);

        // Metrics should still be valid
        assert!(metrics_after.average_level > 0.0);
        assert!(metrics_after.max_level <= MAX_LEVEL as u32);
        assert_eq!(metrics_after.total_insertions, metrics_before.total_insertions); // Insertions don't decrease
    }

    #[test]
    fn test_sequential_insert_delete() {
        let mut list = SkipList::new();

        // Insert 100 items
        for i in 0..100 {
            list.insert(format!("key{:03}", i), i);
        }
        assert_eq!(list.len(), 100);

        // Delete first 50 items
        for i in 0..50 {
            assert_eq!(list.delete(&format!("key{:03}", i)), Some(i));
        }
        assert_eq!(list.len(), 50);

        // Verify deleted items are gone
        for i in 0..50 {
            assert_eq!(list.search(&format!("key{:03}", i)), None);
        }

        // Verify remaining items still exist
        for i in 50..100 {
            assert_eq!(list.search(&format!("key{:03}", i)), Some(i));
        }
    }

    #[test]
    fn test_delete_half_of_list() {
        let mut list = SkipList::new();

        // Insert 100 items
        for i in 0..100 {
            list.insert(format!("item{:03}", i), i);
        }

        // Delete every other item (50 total)
        for i in (0..100).step_by(2) {
            list.delete(&format!("item{:03}", i));
        }

        assert_eq!(list.len(), 50);

        // Verify pattern: even indices gone, odd indices remain
        for i in 0..100 {
            if i % 2 == 0 {
                assert_eq!(list.search(&format!("item{:03}", i)), None,
                          "item{:03} should be deleted", i);
            } else {
                assert_eq!(list.search(&format!("item{:03}", i)), Some(i),
                          "item{:03} should exist", i);
            }
        }
    }

    #[test]
    fn test_empty_list_operations() {
        let mut list = SkipList::new();

        // Delete from empty list
        assert_eq!(list.delete("anything"), None);
        assert_eq!(list.len(), 0);
        assert!(list.is_empty());

        // Search in empty list
        assert_eq!(list.search("anything"), None);
    }

    #[test]
    fn test_interleaved_operations() {
        let mut list = SkipList::new();

        // Insert, delete, insert, delete pattern
        list.insert("a".to_string(), 1);
        assert_eq!(list.len(), 1);

        list.insert("b".to_string(), 2);
        assert_eq!(list.len(), 2);

        list.delete("a");
        assert_eq!(list.len(), 1);

        list.insert("c".to_string(), 3);
        assert_eq!(list.len(), 2);

        list.insert("d".to_string(), 4);
        assert_eq!(list.len(), 3);

        list.delete("b");
        assert_eq!(list.len(), 2);

        list.delete("d");
        assert_eq!(list.len(), 1);

        // Only "c" should remain
        assert_eq!(list.search("a"), None);
        assert_eq!(list.search("b"), None);
        assert_eq!(list.search("c"), Some(3));
        assert_eq!(list.search("d"), None);
    }
}
