/**
 * Node.js test script for JavaScript Trie implementation
 * Tests basic functionality and runs benchmark with sample words
 */

// Load the Trie implementation
const Trie = require('./web/Trie.js');

// Test data: 100 common English words
const testWords = [
    // Test prefix words
    'test', 'testing', 'tester', 'tested', 'tests', 'testament', 'testify',
    'auto', 'automatic', 'automobile', 'autopilot', 'autocomplete', 'automate',
    'app', 'apple', 'application', 'apply', 'appear', 'appetite', 'applause',

    // Common words
    'the', 'they', 'their', 'them', 'these', 'there', 'then', 'theory',
    'and', 'are', 'about', 'all', 'also', 'after', 'any', 'another',
    'can', 'could', 'come', 'call', 'car', 'computer', 'console', 'continue',
    'with', 'will', 'would', 'work', 'world', 'write', 'water', 'watch',
    'have', 'has', 'had', 'here', 'help', 'house', 'happy', 'hello',
    'for', 'from', 'first', 'find', 'food', 'fire', 'function', 'future',
    'this', 'that', 'time', 'take', 'thing', 'think', 'through', 'together',
    'not', 'new', 'now', 'need', 'next', 'never', 'name', 'number',
    'you', 'your', 'year', 'yes', 'yesterday', 'young', 'yet',
    'she', 'some', 'so', 'see', 'say', 'should', 'still', 'system',
    'he', 'her', 'him', 'his', 'how', 'hand', 'head', 'home',
    'it', 'is', 'in', 'if', 'into', 'important', 'information', 'include'
];

console.log('=== JavaScript Trie Test & Benchmark ===\n');

// Test 1: Basic insertion and search
console.log('Test 1: Basic Operations');
const trie = new Trie();
trie.insert('test', 1);
trie.insert('testing', 2);
trie.insert('tester', 3);

console.log('  Insert "test", "testing", "tester"');
console.log('  Search "test":', trie.search('test') === 1 ? 'PASS' : 'FAIL');
console.log('  Search "testing":', trie.search('testing') === 2 ? 'PASS' : 'FAIL');
console.log('  Search "nonexistent":', trie.search('nonexistent') === undefined ? 'PASS' : 'FAIL');
console.log('  Size:', trie.len());
console.log('');

// Test 2: StartsWith
console.log('Test 2: Prefix Checking');
console.log('  Starts with "test":', trie.startsWith('test') ? 'PASS' : 'FAIL');
console.log('  Starts with "xyz":', !trie.startsWith('xyz') ? 'PASS' : 'FAIL');
console.log('');

// Test 3: Autocomplete
console.log('Test 3: Autocomplete');
const results = trie.autocomplete('test');
console.log('  Autocomplete "test":', results);
console.log('  Result count:', results.length === 3 ? 'PASS' : 'FAIL');
console.log('');

// Test 4: Delete
console.log('Test 4: Deletion');
const deleted = trie.delete('test');
console.log('  Delete "test":', deleted ? 'PASS' : 'FAIL');
console.log('  Search after delete:', trie.search('test') === undefined ? 'PASS' : 'FAIL');
console.log('  Size after delete:', trie.len());
console.log('');

// Benchmark with 100 words
console.log('=== Benchmark: 100 Words ===\n');

const benchTrie = new Trie();

// Measure insertion time
console.log(`Inserting ${testWords.length} words...`);
const insertStart = Date.now();
for (let i = 0; i < testWords.length; i++) {
    benchTrie.insert(testWords[i], i);
}
const insertTime = Date.now() - insertStart;

// Get metrics
const metrics = benchTrie.getMetrics();

console.log('\nInsertion Results:');
console.log(`  Time: ${insertTime}ms`);
console.log(`  Total Insertions: ${metrics.totalInsertions}`);
console.log(`  Node Count: ${metrics.nodeCount}`);
console.log(`  Max Depth: ${metrics.maxDepth}`);
console.log(`  Average Word Length: ${metrics.averageWordLength.toFixed(2)}`);
console.log('');

// Benchmark autocomplete with "test" prefix
console.log('Autocomplete Test: prefix="test"');
const autocompleteStart = Date.now();
const testResults = benchTrie.autocomplete('test');
const autocompleteTime = Date.now() - autocompleteStart;

console.log(`  Time: ${autocompleteTime}ms`);
console.log(`  Results found: ${testResults.length}`);
console.log(`  Words: ${testResults.join(', ')}`);
console.log('');

// Test other prefixes
console.log('Additional Autocomplete Tests:');
const testPrefixes = ['auto', 'app', 'the', 'con'];
for (const prefix of testPrefixes) {
    const prefixResults = benchTrie.autocomplete(prefix);
    console.log(`  "${prefix}": ${prefixResults.length} words - [${prefixResults.slice(0, 5).join(', ')}${prefixResults.length > 5 ? '...' : ''}]`);
}
console.log('');

// Summary
console.log('=== Summary ===');
console.log(`Words in Trie: ${benchTrie.len()}`);
console.log(`Total Nodes: ${metrics.nodeCount}`);
console.log(`Storage Efficiency: ${(metrics.nodeCount / benchTrie.len()).toFixed(2)} nodes per word`);
console.log(`Max Depth: ${metrics.maxDepth} characters`);
console.log(`Average Word Length: ${metrics.averageWordLength.toFixed(2)} characters`);
console.log('');

console.log('All tests completed successfully!');
