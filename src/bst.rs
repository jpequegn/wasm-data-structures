use std::cmp::Ordering;
use wasm_bindgen::prelude::*;

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
                        let is_new =
                            Self::insert_recursive(&mut n.left, key, value, depth + 1, metrics);
                        if is_new {
                            metrics.max_depth = metrics.max_depth.max(depth + 1);
                        }
                        is_new
                    }
                    Ordering::Greater => {
                        let is_new =
                            Self::insert_recursive(&mut n.right, key, value, depth + 1, metrics);
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

    fn delete_recursive(node: &mut Option<Box<Node>>, key: &str, metrics: &mut BSTMetrics) -> bool {
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
            self.metrics.average_depth =
                (self.metrics.total_comparisons as f32) / (self.size as f32);
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

#[cfg(test)]
mod tests {
    use super::*;

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

    #[test]
    fn test_bst_delete() {
        let mut tree = BinarySearchTree::new();
        tree.insert("hello".to_string(), 42);
        assert!(tree.delete("hello".to_string()));
        assert_eq!(tree.get("hello".to_string()), None);
    }

    #[test]
    fn test_bst_update() {
        let mut tree = BinarySearchTree::new();
        tree.insert("hello".to_string(), 42);
        tree.insert("hello".to_string(), 99);
        assert_eq!(tree.get("hello".to_string()), Some(99));
        assert_eq!(tree.len(), 1);
    }
}
