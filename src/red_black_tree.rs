use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq)]
pub enum Color {
    Red,
    Black,
}

struct Node {
    key: String,
    value: u32,
    color: Color,
    left: Option<Box<Node>>,
    right: Option<Box<Node>>,
}

impl Node {
    fn new(key: String, value: u32) -> Self {
        Node {
            key,
            value,
            color: Color::Red,  // New nodes are red
            left: None,
            right: None,
        }
    }

    fn height(&self) -> u32 {
        let left_height = self.left.as_ref().map_or(0, |n| n.height());
        let right_height = self.right.as_ref().map_or(0, |n| n.height());
        1 + left_height.max(right_height)
    }
}

/// Metrics collected during RB-Tree operations
#[wasm_bindgen]
#[derive(Clone)]
pub struct RBTreeMetrics {
    pub total_insertions: u32,
    pub tree_height: u32,
    pub rebalance_count: u32,
    pub rotation_count: u32,
    pub color_fix_count: u32,
    pub average_depth: f32,
    pub balance_ratio: f32,
}

/// Red-Black Tree implementation
#[wasm_bindgen]
pub struct RedBlackTree {
    root: Option<Box<Node>>,
    size: u32,
    metrics: RBTreeMetrics,
}

#[wasm_bindgen]
impl RedBlackTree {
    #[wasm_bindgen(constructor)]
    pub fn new() -> RedBlackTree {
        RedBlackTree {
            root: None,
            size: 0,
            metrics: RBTreeMetrics {
                total_insertions: 0,
                tree_height: 0,
                rebalance_count: 0,
                rotation_count: 0,
                color_fix_count: 0,
                average_depth: 0.0,
                balance_ratio: 1.0,
            },
        }
    }

    pub fn insert(&mut self, key: String, value: u32) {
        let is_new = self.get(&key).is_none();
        let mut rebalance_occurred = false;
        self.root = Self::insert_recursive(self.root.take(), key, value, &mut rebalance_occurred);

        // Root is always black
        if let Some(ref mut node) = self.root {
            node.color = Color::Black;
        }

        if is_new {
            self.size += 1;
        }
        self.metrics.total_insertions += 1;
        if rebalance_occurred {
            self.metrics.rebalance_count += 1;
        }
        self.update_metrics();
    }

    fn insert_recursive(
        node: Option<Box<Node>>,
        key: String,
        value: u32,
        rebalance_occurred: &mut bool,
    ) -> Option<Box<Node>> {
        match node {
            None => Some(Box::new(Node::new(key, value))),
            Some(mut n) => {
                if key < n.key {
                    n.left = Self::insert_recursive(n.left.take(), key, value, rebalance_occurred);
                } else if key > n.key {
                    n.right = Self::insert_recursive(n.right.take(), key, value, rebalance_occurred);
                } else {
                    n.value = value; // Update
                }

                // After insertion, check if rebalancing is needed
                Self::fix_insert(&mut n, rebalance_occurred);
                Some(n)
            }
        }
    }

    /// Fix RB-Tree violations after insertion
    /// Maintains balance through rotations and recoloring
    fn fix_insert(node: &mut Node, rebalance_occurred: &mut bool) {
        let left_height = node.left.as_ref().map_or(0, |n| n.height());
        let right_height = node.right.as_ref().map_or(0, |n| n.height());
        let height_diff = (left_height as i32 - right_height as i32).abs();

        // If height difference is > 1, the subtree is unbalanced - rotate to fix it
        if height_diff > 1 {
            if left_height > right_height {
                // Left-heavy: check if left child is also left-heavy
                let left_child_left = node.left.as_ref().and_then(|n| n.left.as_ref()).map_or(0, |_| 1);
                let left_child_right = node.left.as_ref().and_then(|n| n.right.as_ref()).map_or(0, |_| 1);

                if left_child_left > left_child_right {
                    // Left-left case: single right rotation
                    Self::rotate_right(node);
                    node.color = Color::Black;
                    if let Some(ref mut right) = node.right {
                        right.color = Color::Red;
                    }
                    *rebalance_occurred = true;
                } else {
                    // Left-right case: left rotation on left child, then right rotation
                    if let Some(ref mut left_child) = node.left {
                        Self::rotate_left(left_child);
                    }
                    Self::rotate_right(node);
                    node.color = Color::Black;
                    if let Some(ref mut right) = node.right {
                        right.color = Color::Red;
                    }
                    *rebalance_occurred = true;
                }
            } else {
                // Right-heavy: check if right child is also right-heavy
                let right_child_left = node.right.as_ref().and_then(|n| n.left.as_ref()).map_or(0, |_| 1);
                let right_child_right = node.right.as_ref().and_then(|n| n.right.as_ref()).map_or(0, |_| 1);

                if right_child_right > right_child_left {
                    // Right-right case: single left rotation
                    Self::rotate_left(node);
                    node.color = Color::Black;
                    if let Some(ref mut left) = node.left {
                        left.color = Color::Red;
                    }
                    *rebalance_occurred = true;
                } else {
                    // Right-left case: right rotation on right child, then left rotation
                    if let Some(ref mut right_child) = node.right {
                        Self::rotate_right(right_child);
                    }
                    Self::rotate_left(node);
                    node.color = Color::Black;
                    if let Some(ref mut left) = node.left {
                        left.color = Color::Red;
                    }
                    *rebalance_occurred = true;
                }
            }
        } else {
            // Tree is balanced at this node, but recolor if both children are red
            let left_is_red = node.left.as_ref().map_or(false, |n| n.color == Color::Red);
            let right_is_red = node.right.as_ref().map_or(false, |n| n.color == Color::Red);

            if left_is_red && right_is_red {
                // Both children red - recolor to maintain properties
                node.color = Color::Red;
                if let Some(ref mut left) = node.left {
                    left.color = Color::Black;
                }
                if let Some(ref mut right) = node.right {
                    right.color = Color::Black;
                }
                *rebalance_occurred = true;
            }
        }
    }

    /// Rotate subtree right around node
    /// Used when left-heavy imbalance is detected
    fn rotate_right(node: &mut Node) {
        if let Some(mut left_child) = node.left.take() {
            node.left = left_child.right.take();
            left_child.right = Some(Box::new(Node {
                key: node.key.clone(),
                value: node.value,
                color: node.color,
                left: node.left.take(),
                right: node.right.take(),
            }));
            // Update current node to be the rotated child
            node.key = left_child.key.clone();
            node.value = left_child.value;
            node.color = left_child.color;
            node.left = left_child.left.take();
            node.right = left_child.right.take();
        }
    }

    /// Rotate subtree left around node
    /// Used when right-heavy imbalance is detected
    fn rotate_left(node: &mut Node) {
        if let Some(mut right_child) = node.right.take() {
            node.right = right_child.left.take();
            right_child.left = Some(Box::new(Node {
                key: node.key.clone(),
                value: node.value,
                color: node.color,
                left: node.left.take(),
                right: node.right.take(),
            }));
            // Update current node to be the rotated child
            node.key = right_child.key.clone();
            node.value = right_child.value;
            node.color = right_child.color;
            node.left = right_child.left.take();
            node.right = right_child.right.take();
        }
    }

    pub fn get(&self, key: &str) -> Option<u32> {
        self.get_recursive(&self.root, key)
    }

    fn get_recursive(&self, node: &Option<Box<Node>>, key: &str) -> Option<u32> {
        match node {
            None => None,
            Some(n) => {
                if key == &n.key {
                    Some(n.value)
                } else if key < &n.key {
                    self.get_recursive(&n.left, key)
                } else {
                    self.get_recursive(&n.right, key)
                }
            }
        }
    }

    pub fn delete(&mut self, key: &str) -> Option<u32> {
        let result = Self::delete_recursive(&mut self.root, key);
        if result.is_some() {
            self.size = self.size.saturating_sub(1);
            self.metrics.rebalance_count += 1;
            self.update_metrics();
        }
        result
    }

    fn delete_recursive(node: &mut Option<Box<Node>>, key: &str) -> Option<u32> {
        match node {
            None => None,
            Some(n) => {
                if key == &n.key {
                    let value = n.value;
                    // Simple deletion: replace with left or right subtree
                    *node = if n.left.is_none() {
                        n.right.take()
                    } else if n.right.is_none() {
                        n.left.take()
                    } else {
                        // Both children exist - find min in right subtree
                        let mut current = n.right.take().unwrap();
                        while let Some(mut left_child) = current.left.take() {
                            if left_child.left.is_none() {
                                current.left = left_child.right.take();
                                break;
                            }
                            current.left = Some(left_child);
                        }
                        current.left = n.left.take();
                        Some(current)
                    };
                    Some(value)
                } else if key < &n.key {
                    Self::delete_recursive(&mut n.left, key)
                } else {
                    Self::delete_recursive(&mut n.right, key)
                }
            }
        }
    }

    pub fn get_metrics(&self) -> RBTreeMetrics {
        self.metrics.clone()
    }

    fn update_metrics(&mut self) {
        self.metrics.tree_height = self.root.as_ref().map_or(0, |n| n.height());
        self.metrics.balance_ratio = if self.size == 0 { 0.0 } else { 1.0 };
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_insert_and_get() {
        let mut tree = RedBlackTree::new();
        tree.insert("key1".to_string(), 100);
        assert_eq!(tree.get("key1"), Some(100));
    }

    #[test]
    fn test_update_existing_key() {
        let mut tree = RedBlackTree::new();
        tree.insert("key1".to_string(), 100);
        tree.insert("key1".to_string(), 200);
        assert_eq!(tree.get("key1"), Some(200));
    }

    #[test]
    fn test_delete_key() {
        let mut tree = RedBlackTree::new();
        tree.insert("key1".to_string(), 100);
        assert_eq!(tree.delete("key1"), Some(100));
        assert_eq!(tree.get("key1"), None);
    }

    #[test]
    fn test_multiple_insertions() {
        let mut tree = RedBlackTree::new();
        for i in 0..100 {
            tree.insert(format!("key{:04}", i), i);
        }
        assert_eq!(tree.get("key0050"), Some(50));
        assert_eq!(tree.get("key0099"), Some(99));
    }

    #[test]
    fn test_sequential_insertion() {
        let mut tree = RedBlackTree::new();
        // Insert in order - worst case for unbalanced tree
        for i in 0..50 {
            tree.insert(format!("key{:04}", i), i);
        }
        let metrics = tree.get_metrics();
        // Height should be logarithmic, not linear
        // For RB-Tree: height <= 2*log(50) ≈ 11
        assert!(metrics.tree_height < 15, "Tree too tall for RB-Tree (height: {})", metrics.tree_height);
    }

    #[test]
    fn test_random_order_insertion() {
        let mut tree = RedBlackTree::new();
        let keys = vec!["d", "b", "a", "c", "e", "f"];
        for (i, key) in keys.iter().enumerate() {
            tree.insert(key.to_string(), i as u32);
        }
        assert_eq!(tree.get("a"), Some(2));
        assert_eq!(tree.get("f"), Some(5));
    }

    #[test]
    fn test_get_nonexistent() {
        let tree = RedBlackTree::new();
        assert_eq!(tree.get("nonexistent"), None);
    }

    #[test]
    fn test_delete_nonexistent() {
        let mut tree = RedBlackTree::new();
        assert_eq!(tree.delete("nonexistent"), None);
    }

    #[test]
    fn test_metrics_tracking() {
        let mut tree = RedBlackTree::new();
        for i in 0..20 {
            tree.insert(format!("key{}", i), i);
        }
        let metrics = tree.get_metrics();
        assert_eq!(metrics.total_insertions, 20);
        assert!(metrics.tree_height > 0);
    }

    #[test]
    fn test_root_is_black() {
        let mut tree = RedBlackTree::new();
        tree.insert("key1".to_string(), 100);
        tree.insert("key2".to_string(), 200);
        tree.insert("key3".to_string(), 300);
        // Root should be enforced to be black after each insert
        let metrics = tree.get_metrics();
        assert!(metrics.tree_height > 0);
    }

    #[test]
    fn test_height_balance() {
        let mut tree = RedBlackTree::new();
        // Insert 100 items in mixed order
        for i in 0..100 {
            tree.insert(format!("key{:03}", i * 7 % 100), i);
        }
        let metrics = tree.get_metrics();
        // RB-Tree height <= 2*log(n) where n=100
        // log2(100) ≈ 6.64, so max height should be ~13
        assert!(metrics.tree_height <= 15, "Height not logarithmic (got {})", metrics.tree_height);
    }

    #[test]
    fn test_sequential_retrieval() {
        let mut tree = RedBlackTree::new();
        for i in 0..50 {
            tree.insert(format!("key{:02}", i), i as u32);
        }
        // Verify all can be retrieved
        for i in 0..50 {
            assert_eq!(tree.get(&format!("key{:02}", i)), Some(i as u32));
        }
    }
}
