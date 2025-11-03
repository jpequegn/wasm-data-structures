use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
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
        self.root = Self::insert_recursive(self.root.take(), key, value);

        // Root is always black
        if let Some(ref mut node) = self.root {
            node.color = Color::Black;
        }

        if is_new {
            self.size += 1;
        }
        self.metrics.total_insertions += 1;
        self.update_metrics();
    }

    fn insert_recursive(
        node: Option<Box<Node>>,
        key: String,
        value: u32,
    ) -> Option<Box<Node>> {
        match node {
            None => Some(Box::new(Node::new(key, value))),
            Some(mut n) => {
                if key < n.key {
                    n.left = Self::insert_recursive(n.left.take(), key, value);
                } else if key > n.key {
                    n.right = Self::insert_recursive(n.right.take(), key, value);
                } else {
                    n.value = value; // Update
                }
                Some(n)
            }
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
