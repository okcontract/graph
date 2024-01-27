import { test, expect, describe } from "vitest";

import { Graph } from "./graph";

test("should add nodes correctly", () => {
  const graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  expect(graph.size).toBe(2);
});

test("should add edges correctly", () => {
  const graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addEdge("a", "b");
  expect(graph.get("a")).toEqual(["b"]);
});

test("should return topological sort correctly", () => {
  const graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addNode("c");
  graph.addEdge("a", "b");
  graph.addEdge("b", "c");
  graph.addEdge("a", "c");
  expect(graph.topologicalSort()).toEqual(["c", "b", "a"]);
});

test("should return null when cycle detected", () => {
  const graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addEdge("a", "b");
  graph.addEdge("b", "a");
  expect(graph.topologicalSort()).toBeNull();
});

test("should return partial topological sort correctly", () => {
  const graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addNode("c");
  graph.addEdge("a", "b");
  graph.addEdge("b", "c");
  const result = graph.partialTopologicalSort("a");
  expect(result).toEqual(["c", "b", "a"]);
});

test("should return partial topological sort correctly when starting from a middle node", () => {
  const graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addNode("c");
  graph.addEdge("a", "b");
  graph.addEdge("b", "c");
  const result = graph.partialTopologicalSort("b");
  expect(result).toEqual(["c", "b"]);
});

test("should return just the start node when it has no dependents", () => {
  const graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addNode("c");
  graph.addEdge("a", "b");
  graph.addEdge("b", "c");
  const result = graph.partialTopologicalSort("c");
  expect(result).toEqual(["c"]);
});

test("should return partial topological sort correctly for a set of root", () => {
  let graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addNode("c");
  graph.addNode("d");
  graph.addNode("e");
  graph.addEdge("a", "c");
  graph.addEdge("b", "c");
  graph.addEdge("b", "e");
  graph.addEdge("c", "d");

  let ts = graph.partialTopologicalSortRootsSet(["a", "b"]);
  expect(ts).toEqual(["d", "c", "a", "e", "b"]);
  graph.addEdge("e", "c");
  ts = graph.partialTopologicalSortRootsSet(["a", "b"]);
  expect(ts).toEqual(["d", "c", "a", "e", "b"]);
  ts = graph.partialTopologicalSortRootsSet(["b", "a"]);
  expect(ts).toEqual(["d", "c", "e", "b", "a"]);
  graph.removeEdge("e", "c");
  ts = graph.partialTopologicalSortRootsSet(["a", "b"]);
  expect(ts).toEqual(["d", "c", "a", "e", "b"]);
  graph.addEdge("c", "e");
  ts = graph.partialTopologicalSortRootsSet(["a", "b"]);
  expect(ts).toEqual(["d", "e", "c", "a", "b"]);
  // dependent root
  graph.addEdge("a", "b");
  ts = graph.partialTopologicalSortRootsSet(["a", "b"]);
  expect(ts).toEqual(["d", "e", "c", "b", "a"]);
  ts = graph.partialTopologicalSortRootsSet(["b", "a"]);
  expect(ts).toEqual(["d", "e", "c", "b", "a"]);
});

test("should return reachable leaves for a set of root", () => {
  let graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addNode("c");
  graph.addNode("d");
  graph.addNode("e");
  graph.addNode("f");
  graph.addNode("g");
  graph.addEdge("a", "c");
  graph.addEdge("b", "c");
  graph.addEdge("b", "e");
  graph.addEdge("c", "d");
  graph.addEdge("f", "g");
  /*
    a -- c--d
    b _/_e 

    f -- g
*/

  let ts = graph.reachableLeaves(new Set(["a", "b"]));
  expect(ts).toEqual(new Set(["d", "e"]));
  ts = graph.reachableLeaves(["a"]);
  expect(ts).toEqual(new Set(["d"]));

  graph.addEdge("e", "c");
  ts = graph.reachableLeaves(["a", "b"]);
  expect(ts).toEqual(new Set(["d"]));

  graph.removeEdge("e", "c");
  ts = graph.reachableLeaves(["a", "b"]);
  expect(ts).toEqual(new Set(["d", "e"]));

  graph.addEdge("c", "e");
  ts = graph.reachableLeaves(["a", "b"]);
  expect(ts).toEqual(new Set(["d", "e"]));

  graph.addEdge("b", "f");
  ts = graph.reachableLeaves(["b"]);
  expect(ts).toEqual(new Set(["d", "e", "g"]));

  graph.addEdge("g", "b");
  ts = graph.reachableLeaves(["b"]);
  expect(ts).toEqual(new Set(["d", "e"]));
});

test("should return null when cycle detected", () => {
  const graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addEdge("a", "b");
  graph.addEdge("b", "a");
  expect(graph.partialTopologicalSort("a")).toBeNull();
});

test("should cache results from partialTopologicalSort", () => {
  const graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addNode("c");
  graph.addEdge("a", "b");
  graph.addEdge("b", "c");

  // Call partialTopologicalSort for the first time
  const firstResult = graph.partialTopologicalSort("a");

  // Call partialTopologicalSort for the second time, expect the same result
  const secondResult = graph.partialTopologicalSort("a");

  expect(firstResult).toEqual(secondResult);
});

test("should invalidate cache when adding a new node and edge", () => {
  const graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addNode("c");
  graph.addEdge("a", "b"); // a depends on b
  graph.addEdge("b", "c"); // b depends on c

  // Call partialTopologicalSort for the first time
  const firstResult = graph.partialTopologicalSort("a");
  expect(firstResult).toEqual(["c", "b", "a"]); // eval order

  // Add a new node and edge and call partialTopologicalSort again
  graph.addNode("d");
  graph.addEdge("b", "d");
  const secondResult = graph.partialTopologicalSort("a");

  expect(secondResult).toEqual(["c", "d", "b", "a"]);
});

describe("Graph destroy method", () => {
  test("should remove the node and associated edges", () => {
    let graph = new Graph<string>();
    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addEdge("c", "a");

    expect(graph.partialTopologicalSort("c")).toEqual(["a", "c"]);
    // const deleted =
    graph.delete("c");
    expect(graph.partialTopologicalSort("c")).toEqual(["c"]); // c is free
  });

  test("should return the correct set of removed nodes", () => {
    let graph = new Graph<string>();
    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addNode("d");
    graph.addEdge("a", "b");
    graph.addEdge("b", "c");
    graph.addEdge("c", "d");

    let ts = graph.partialTopologicalSort("a");
    expect(ts).toEqual(["d", "c", "b", "a"]);
    graph.delete("b"); // no force
    expect(graph.get("a")).toEqual([]);
    ts = graph.partialTopologicalSort("a");
    expect(ts).toEqual(["a"]);
  });

  test("should handle removing a non-existing node", () => {
    let graph = new Graph<string>();
    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addNode("d");
    graph.addEdge("a", "b");
    graph.addEdge("b", "c");
    graph.addEdge("c", "d");

    expect(() => graph.delete("e")).toThrow("Unknown node: e");
  });
});

test("partialTopologicalSortRootsSet properly uses options", () => {
  let graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addNode("c");
  graph.addNode("d");
  graph.addNode("e");
  graph.addNode("f");
  graph.addNode("g");
  graph.addEdge("a", "c");
  graph.addEdge("b", "c");
  graph.addEdge("b", "e");
  graph.addEdge("c", "d");
  graph.addEdge("f", "g");
  /*
    a -- c--d
    b _/_e 

    f -- g
*/

  let ts = graph.partialTopologicalSortRootsSet(["a", "b"], {
    includeRoots: false,
  });
  expect(ts).toEqual(["d", "c", "e"]);

  ts = graph.partialTopologicalSortRootsSet(["a", "b"], {
    includeRoots: true,
  });
  expect(ts).toEqual(["d", "c", "a", "e", "b"]);

  ts = graph.partialTopologicalSortRootsSet(["a", "b"], {
    next: (id) => graph.predecessors(id),
  });
  expect(ts).toEqual(["a", "b"]);

  ts = graph.partialTopologicalSortRootsSet(["g"], {
    next: (id) => graph.predecessors(id),
    includeRoots: false,
  });
  expect(graph.predecessors("g")).toEqual(["f"]);
  expect(ts).toEqual(["f"]);

  ts = graph.partialTopologicalSortRootsSet(["d"], {
    next: (id) => graph.predecessors(id),
    includeRoots: false,
  });
  expect(ts).toEqual(["a", "b", "c"]);
});

test("should return reachable properties for a set of root", () => {
  let graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addNode("c");
  graph.addNode("d");
  graph.addNode("e");
  graph.addNode("f");
  graph.addNode("g");
  graph.addEdge("a", "c");
  graph.addEdge("b", "c");
  graph.addEdge("b", "e");
  graph.addEdge("c", "d");
  graph.addEdge("f", "g");
  /*
    a -- c--d
    b _/_e 

    f -- g
*/

  const property = (node) => {
    return node === "d";
  };
  let ts = graph.strictlyReachableProperty(new Set(["a", "b"]), property);
  expect(ts).toEqual(new Set(["a", "b"]));

  ts = graph.strictlyReachableProperty(["f"], property);
  expect(ts).toEqual(new Set([]));

  ts = graph.strictlyReachableProperty(["d"], property);
  expect(ts).toEqual(new Set([]));

  graph.addEdge("e", "c");
  ts = graph.strictlyReachableProperty(new Set(["a", "b"]), property);
  expect(ts).toEqual(new Set(["a", "b"]));

  graph.removeEdge("e", "c");
  graph.removeEdge("b", "c");
  ts = graph.strictlyReachableProperty(new Set(["a", "b"]), property);
  expect(ts).toEqual(new Set(["a"]));

  graph.addEdge("c", "e");
  ts = graph.strictlyReachableProperty(new Set(["a", "b"]), property);
  expect(ts).toEqual(new Set(["a"]));
});

test("Cells bug", () => {
  const graph = new Graph<string>();
  graph.addNode("a");
  graph.addNode("b");
  graph.addNode("m");
  graph.addNode("p");
  graph.addNode("mp");

  graph.addEdge("a", "m");
  graph.addEdge("b", "m");
  graph.addEdge("m", "p");
  graph.addEdge("p", "mp");
  /*
   a --
       \
         m --- p --- mp
       /      
   b --
  */
  const ts = graph.partialTopologicalSortRootsSet(["m", "p", "mp"], {
    includeRoots: false,
  });
  expect(ts).toEqual(["mp", "p"]);
});
