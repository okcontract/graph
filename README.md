# graph, a directed graph library

Graph is a simple directed graph library written in TypeScript, that provides:

- Ability to add and remove node and edges
- (Partial) topological sort
- Cache paths for cases with (much) more reads than writes
- Export to graphviz `.dot` files

This library has no dependencies and the build artifact is 3.6kB (1.41kB gzipped).

# Walkthrough

```ts
import { Graph } from "@okcontract/graph";

// nodes are strings
let graph = new Graph<string>();

// add nodes and edges
graph.addNode("a");
graph.addNode("b");
graph.addNode("c");
graph.addNode("d");
graph.addEdge("a", "b");
graph.addEdge("b", "c");
graph.addEdge("c", "d");

// partial topological sort for node "a"
expect(graph.partialTopologicalSort("a")).toEqual(["d", "c", "b", "a"]);

// generate dot graph, with optional types and styles for each node type
console.log(
  graph.toDot(
    {
      string: ["a", "d"],
      number: ["b"],
      object: ["c"],
    },
    {
      string: "style=filled,fillcolor=aquamarine",
      number: "style=filled,fillcolor=gold",
      object: "style=filled,fillcolor=hotpink",
    }
  )
);
```

# About

`graph` is written by the team at [OKcontract](https://okcontract.com) and is released under the MIT license.

We aim for ease of use and correction. Chasing down any bug is our top priority.

Contributors are welcome, feel free to submit PRs directly for small changes. You can also reach out in our [Discord](https://discord.gg/Cun5aF7k) or contact us on [Twitter](https://x.com/okcontract) in advance for larger contributions.

This work is supported in part by a RFG grant from [Optimism](https://optimism.io).
