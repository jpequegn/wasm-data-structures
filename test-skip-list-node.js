#!/usr/bin/env node

/**
 * Node.js test script for Skip List implementation
 * Run with: node test-skip-list-node.js
 */

const SkipList = require('./web/SkipList.js');

console.log('Skip List Test Suite (Node.js)\n');
console.log('='.repeat(50));

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passCount++;
    return true;
  } else {
    console.log(`✗ ${message}`);
    failCount++;
    return false;
  }
}

function testSection(name) {
  console.log(`\n${name}`);
  console.log('-'.repeat(50));
}

// Test 1: Basic insertion and search
testSection('Test 1: Basic Insertion and Search');
const list1 = new SkipList();
list1.insert('key1', 100);
assert(list1.search('key1') === 100, 'Should find inserted key');
assert(list1.search('key2') === undefined, 'Should not find non-existent key');
assert(list1.len() === 1, 'Size should be 1');

// Test 2: Multiple insertions
testSection('Test 2: Multiple Insertions');
const list2 = new SkipList();
for (let i = 0; i < 50; i++) {
  list2.insert(`key${i}`, i);
}
assert(list2.len() === 50, 'Size should be 50');

let allFound = true;
for (let i = 0; i < 50; i++) {
  if (list2.search(`key${i}`) !== i) {
    allFound = false;
    break;
  }
}
assert(allFound, 'Should find all 50 keys');

// Test 3: Update existing key
testSection('Test 3: Update Existing Key');
const list3 = new SkipList();
list3.insert('key1', 100);
list3.insert('key1', 200);
assert(list3.search('key1') === 200, 'Should have updated value');
assert(list3.len() === 1, 'Size should still be 1');

// Test 4: Deletion
testSection('Test 4: Deletion');
const list4 = new SkipList();
list4.insert('key1', 100);
list4.insert('key2', 200);
list4.insert('key3', 300);
assert(list4.delete('key2') === 200, 'Should return deleted value');
assert(list4.search('key2') === undefined, 'Should not find deleted key');
assert(list4.len() === 2, 'Size should be 2 after deletion');
assert(list4.delete('nonexistent') === undefined, 'Should return undefined for non-existent key');

// Test 5: Large insertion and metrics
testSection('Test 5: Large Insertion and Metrics (1000 items)');
const list5 = new SkipList();
const startTime = Date.now();
for (let i = 0; i < 1000; i++) {
  list5.insert(`key${i}`, i);
}
const insertTime = Date.now() - startTime;

assert(list5.len() === 1000, 'Size should be 1000');
const metrics = list5.getMetrics();

console.log('\nMetrics for 1000 insertions:');
console.log(`  - Total Insertions: ${metrics.totalInsertions}`);
console.log(`  - Average Level: ${metrics.averageLevel.toFixed(2)}`);
console.log(`  - Max Level: ${metrics.maxLevel}`);
console.log(`  - Total Searches: ${metrics.totalSearches}`);
console.log(`  - Insert Time: ${insertTime}ms`);

// For skip list with P=0.5, expected average level is 1/(1-P) = 2
// Max level should grow with log2(n), so for 1000 items ~= 10
assert(metrics.averageLevel > 0.5 && metrics.averageLevel < 3.0,
       `Average level should be ~1-2, got ${metrics.averageLevel.toFixed(2)}`);
assert(metrics.maxLevel >= 5 && metrics.maxLevel <= 16,
       `Max level should be 5-16 for 1000 items, got ${metrics.maxLevel}`);

// Test 6: Verify sorted order
testSection('Test 6: Verify Sorted Order');
const list6 = new SkipList();
const keys = ['delta', 'alpha', 'charlie', 'bravo', 'echo'];
const values = [4, 1, 3, 2, 5];
for (let i = 0; i < keys.length; i++) {
  list6.insert(keys[i], values[i]);
}
assert(list6.search('alpha') === 1, 'Should find alpha');
assert(list6.search('bravo') === 2, 'Should find bravo');
assert(list6.search('charlie') === 3, 'Should find charlie');
assert(list6.search('delta') === 4, 'Should find delta');
assert(list6.search('echo') === 5, 'Should find echo');

// Test 7: Performance test
testSection('Test 7: Performance Test (5000 items)');
const list7 = new SkipList();
const perfStart = Date.now();
for (let i = 0; i < 5000; i++) {
  list7.insert(`key${i}`, i);
}
const perfInsertTime = Date.now() - perfStart;

// Test search performance
const searchStart = Date.now();
for (let i = 0; i < 100; i++) {
  list7.search(`key${Math.floor(Math.random() * 5000)}`);
}
const searchTime = Date.now() - searchStart;

const finalMetrics = list7.getMetrics();
console.log('\nPerformance for 5000 insertions:');
console.log(`  - Insert Time: ${perfInsertTime}ms (${(perfInsertTime / 5000).toFixed(3)}ms per item)`);
console.log(`  - Search Time (100 searches): ${searchTime}ms (${(searchTime / 100).toFixed(3)}ms per search)`);
console.log(`  - Average Level: ${finalMetrics.averageLevel.toFixed(2)}`);
console.log(`  - Max Level: ${finalMetrics.maxLevel}`);
if (finalMetrics.totalSearches > 0) {
  console.log(`  - Avg Search Comparisons: ${(finalMetrics.searchComparisons / finalMetrics.totalSearches).toFixed(2)}`);
}

assert(perfInsertTime < 5000, 'Should complete 5000 insertions in < 5 seconds');
assert(finalMetrics.averageLevel > 0.5 && finalMetrics.averageLevel < 3.0,
       `Average level should be ~1-2, got ${finalMetrics.averageLevel.toFixed(2)}`);
assert(finalMetrics.maxLevel >= 8 && finalMetrics.maxLevel <= 16,
       `Max level should be 8-16 for 5000 items (log2(5000)≈12.3), got ${finalMetrics.maxLevel}`);

// Test 8: Empty list operations
testSection('Test 8: Empty List Operations');
const list8 = new SkipList();
assert(list8.isEmpty(), 'New list should be empty');
assert(list8.len() === 0, 'Size should be 0');
assert(list8.search('key1') === undefined, 'Search on empty list should return undefined');
assert(list8.delete('key1') === undefined, 'Delete on empty list should return undefined');

// Test 9: Sequential vs random insertion
testSection('Test 9: Sequential Insertion Pattern');
const list9 = new SkipList();
for (let i = 0; i < 100; i++) {
  list9.insert(`key${String(i).padStart(3, '0')}`, i);
}
const metrics9 = list9.getMetrics();
console.log(`  Sequential 100 items - Average Level: ${metrics9.averageLevel.toFixed(2)}, Max Level: ${metrics9.maxLevel}`);
assert(list9.len() === 100, 'Should have 100 items');

// Test 10: Verify probabilistic balance
testSection('Test 10: Verify Probabilistic Level Distribution');
const list10 = new SkipList();
for (let i = 0; i < 10000; i++) {
  list10.insert(`key${i}`, i);
}
const metrics10 = list10.getMetrics();
console.log(`  10000 items - Average Level: ${metrics10.averageLevel.toFixed(2)}, Max Level: ${metrics10.maxLevel}`);
// With P=0.5, average should be very close to 1.0
assert(metrics10.averageLevel > 0.7 && metrics10.averageLevel < 1.5,
       `Average level should be ~1.0 for large list, got ${metrics10.averageLevel.toFixed(2)}`);
// Max level should be around log2(10000) ≈ 13.3
assert(metrics10.maxLevel >= 10 && metrics10.maxLevel <= 16,
       `Max level should be 10-16, got ${metrics10.maxLevel}`);

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Test Results: ${passCount} passed, ${failCount} failed`);
if (failCount === 0) {
  console.log('✓ All tests passed!');
  console.log('\nKey Insights:');
  console.log('  - Skip lists use probabilistic balancing (no rotations needed)');
  console.log('  - Average node level ≈ 1 with P=0.5 (half at level 0, quarter at level 1, etc.)');
  console.log('  - Max level grows as log2(n) for efficient O(log n) search');
  console.log('  - Simpler to implement than red-black trees but uses more memory');
  process.exit(0);
} else {
  console.log('✗ Some tests failed');
  process.exit(1);
}
