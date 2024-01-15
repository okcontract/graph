export type NodeId = number | string;

export const ReferencesLeft = new Error("Cell has references");

/**
 * Graph is a generic implementation of a directed graph data structure in TypeScript.
 */
export class Graph<T extends NodeId> {
  private _adjacencyList: Map<T, T[]>;
  private _cache: Map<T, T[] | null>;
  private _dependencies: Map<T, T[]>;
  private _names: Map<T, string>;

  constructor() {
    this._adjacencyList = new Map<T, T[]>();
    this._cache = new Map<T, T[] | null>();
    this._dependencies = new Map<T, T[]>();
    this._names = new Map<T, string>();
  }

  get size() {
    return this._adjacencyList.size;
  }

  name(key: T) {
    return this._names.get(key);
  }

  get(key: T) {
    return this._adjacencyList.get(key);
  }

  predecessors(key: T) {
    return this._dependencies.get(key);
  }

  addNode(node: T): void {
    if (!this._adjacencyList.has(node)) {
      this._adjacencyList.set(node, []);
      this._dependencies.set(node, []);
    }
  }

  bless(node: T, name: string) {
    this._names.set(node, name);
  }

  private _check(node: T) {
    if (!this._adjacencyList.has(node))
      throw new Error(`Unknown node: ${node}`);
  }

  addEdge(node1: T, node2: T): void {
    this._check(node1);
    this._check(node2);
    this._adjacencyList.get(node1)!.push(node2);
    this._dependencies.get(node2)!.push(node1);
    // Invalidate the cache for the node and its dependencies
    this._invalidateCache(node1);
  }

  removeEdge(node1: T, node2: T): void {
    this._check(node1);
    this._check(node2);
    const adjList = this._adjacencyList.get(node1)!;
    const adjIndex = adjList.indexOf(node2);
    if (adjIndex !== -1) {
      adjList.splice(adjIndex, 1);
    }

    const deps = this._dependencies.get(node2)!;
    const depsIndex = deps.indexOf(node1);
    if (depsIndex !== -1) {
      deps.splice(depsIndex, 1);
    }
    // Invalidate the cache for the node and its dependencies
    this._invalidateCache(node1);
  }

  private _invalidateCache(node: T): void {
    // Clear cache for the node
    this._cache.delete(node);

    // Clear cache for all dependent nodes
    const dependents = this._dependencies.get(node);
    if (dependents) {
      for (const dependent of dependents) {
        this._cache.delete(dependent);
      }
    }
  }

  topologicalSort(): T[] | null {
    let stack: T[] = [];
    let visited = new Map<T, boolean>();
    let recursionStack = new Map<T, boolean>();

    for (let node of this._adjacencyList.keys()) {
      if (!visited.get(node)) {
        if (
          this._topologicalSortHelper(
            node,
            visited,
            recursionStack,
            stack,
            (n) => this._adjacencyList.get(n)
          )
        ) {
          console.log("Cycle detected! Topological sort not possible.");
          return null;
        }
      }
    }

    return stack; // .reverse();
  }

  /**
   * Topological sort of nodes reachable form a given node.
   * @param start is the node from which we start the graph exploration.
   * @returns The list of node reachable from start, including itself, topologically sorted,
   *          or null if a cycle is detected
   */
  partialTopologicalSort(
    start: T,
    option?: { next?: (node: T) => T[]; filter?: (a: T, b: T) => boolean }
  ): T[] | null {
    if (!this._cache.has(start)) {
      let stack: T[] = [];
      let visited = new Map<T, boolean>();
      let recursionStack = new Map<T, boolean>();
      const nextNodes =
        option?.next === undefined
          ? (n) => this._adjacencyList.get(n)
          : option.next;

      if (!visited.get(start)) {
        if (
          this._topologicalSortHelper(
            start,
            visited,
            recursionStack,
            stack,
            nextNodes,
            option?.filter ? { filter: option.filter } : undefined
          )
        ) {
          console.log("Cycle detected! Partial topological sort not possible.");
          this._cache.set(start, null);
        } else {
          this._cache.set(start, stack); //.reverse());
        }
      }
    }

    return this._cache.get(start) || null;
  }

  private _topologicalSortHelper(
    node: T,
    visited: Map<T, boolean>,
    recursionStack: Map<T, boolean>,
    stack: T[],
    next: (node: T) => T[],
    option?: {
      noFailOnLoop?: boolean;
      filter?: (a: T, b: T) => boolean;
    }
  ): boolean {
    const noFailOnLoop: boolean = option?.noFailOnLoop
      ? option.noFailOnLoop
      : false;
    visited.set(node, true);
    recursionStack.set(node, true);

    let neighbors = next(node);
    if (neighbors) {
      for (let nextNode of neighbors) {
        if (
          (!option?.filter || option.filter(node, nextNode)) &&
          !visited.get(nextNode) &&
          this._topologicalSortHelper(
            nextNode,
            visited,
            recursionStack,
            stack,
            next,
            option
          ) &&
          !noFailOnLoop
        ) {
          return true;
        } else if (recursionStack.get(nextNode) && !noFailOnLoop) {
          return true;
        }
      }
    }

    stack.push(node);
    recursionStack.set(node, false);
    return false;
  }

  /**
   * Topological sort of nodes reachable form a given set of node.
   * @param roots is the node from which we start the graph exploration.
   * @param option optional args :
   *   `next` allows to replace the successor function,
   *          default is to get all successors of the node in the graph
   *    `filter` allows to stop the graph exploration on node that
   *          do not satisfy the filter
   *    `includeRoots` allows to specify if provided roots must be added
   *          to the returned list.
   *          If set to false, they may still appear in the result if a
   *          root is the successor of another one.
   *          Default is true.
   * @returns The list of node reachable from start, including itself, topologically sorted,
   *          or null if a cycle is detected
   */
  partialTopologicalSortRootsSet(
    roots: T[],
    option?: {
      next?: (node: T) => T[];
      filter?: (a: T, b: T) => boolean;
      includeRoots?: boolean;
    }
  ): T[] | null {
    const includeRoots =
      option?.includeRoots === undefined ? true : option.includeRoots;
    const nextNodes =
      option?.next === undefined
        ? (n) => this._adjacencyList.get(n)
        : option.next;
    const starts = includeRoots
      ? roots
      : roots
          .flatMap((root) => nextNodes(root))
          .filter((id) => !roots.includes(id));
    let stack: T[] = [];
    let visited = new Map<T, boolean>();
    let recursionStack = new Map<T, boolean>();
    for (const start of starts) {
      if (
        !visited.get(start) &&
        !stack.includes(start) &&
        this._topologicalSortHelper(
          start,
          visited,
          recursionStack,
          stack,
          nextNodes,
          option?.filter ? { filter: option.filter } : undefined
        )
      ) {
        console.log("Cycle detected! Partial topological sort not possible.");
        return null;
      }
      visited.set(start, true);
    }

    return stack;
  }

  /**
   * Tells whether the given node can reach a node with the given property.
   * The node itself is not tested.
   * @param node : starting point
   * @param property the property to be tested
   * @param visited already visited nodes
   * @param tainted node for which the property  is known to be reachable
   * @param next    successors property
   * @param option  option to filter out some nodes
   * @returns  true if a node with the given prop is reachable, false otherwise
   */
  _reachablePropertyHelper(
    node: T,
    property: (node: T) => boolean,
    visited: Map<T, boolean>,
    tainted: Map<T, boolean>,
    next,
    option?: {
      filter?: (a: T, b: T) => boolean;
    }
  ): boolean {
    visited.set(node, true);
    let neighbors = next(node);
    if (neighbors) {
      for (let nextNode of neighbors) {
        if (!option?.filter || option.filter(node, nextNode)) {
          if (visited.get(nextNode)) {
            // node has already been seen
            if (tainted.get(nextNode)) {
              // child is tainted, property is reachable:
              // tainting current node and returning true
              tainted.set(node, true);
              return true;
            }
          } else if (property(nextNode)) {
            // property holds on this child node,
            // we will not visit its children,
            // the node and the whole path to reach it is tainted,
            // and we return true
            visited.set(nextNode, true);
            tainted.set(nextNode, true);
            tainted.set(node, true);
            return true;
          } else {
            const reachable = this._reachablePropertyHelper(
              nextNode,
              property,
              visited,
              tainted,
              next,
              option
            );
            if (reachable) {
              // tainting current node and bubble up the finding,
              tainted.set(node, true);
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  /**
   * Detect which roots has a reachable nodes with the given property.
   * The property is not tested on the node itself.
   * @param roots
   * @returns boolean
   */
  strictlyReachableProperty(
    roots: Iterable<T>,
    property: (node: T) => boolean,
    option?: { next?: (node: T) => T[]; filter?: (a: T, b: T) => boolean }
  ): Set<T> {
    const reachingRoots = new Set<T>();
    const visited = new Map<T, boolean>();
    const tainted = new Map<T, boolean>();

    const nextNodes =
      option?.next === undefined
        ? (n) => this._adjacencyList.get(n)
        : option.next;
    for (const root of roots) {
      if (
        this._reachablePropertyHelper(
          root,
          property,
          visited,
          tainted,
          nextNodes,
          option?.filter ? { filter: option.filter } : undefined
        )
      ) {
        reachingRoots.add(root);
      }
    }
    return reachingRoots;
  }

  /**
   * Reachable leaves from roots.
   * roots are not included in the result, even if they are leaves.
   * @param roots
   * @returns array of reachable leaves.
   */
  reachableLeaves(roots: Iterable<T>): Set<T> {
    let stack: T[] = [];
    let visited = new Map<T, boolean>();
    let recursionStack = new Map<T, boolean>();
    const starts = Array.from(roots).flatMap((root) => this.get(root) || []);
    for (const start of starts) {
      if (!stack.includes(start))
        this._topologicalSortHelper(
          start,
          visited,
          recursionStack,
          stack,
          (n) => this._adjacencyList.get(n),
          {
            noFailOnLoop: true,
          }
        );
    }

    return new Set(
      stack.filter((node) => {
        return this.get(node)!.length <= 0;
      })
    );
  }

  /**
   * delete a node.
   * @param node id
   * @param force removal of dependent sub-graph
   * @returns deleted nodes
   */
  delete(node: T) {
    this._check(node);

    // Get all the adjacent nodes
    const adjacentNodes = this._adjacencyList.get(node) || [];

    // Remove edges from the adjacency list
    this._adjacencyList.delete(node);
    for (const adjacentNode of adjacentNodes) {
      const nodeAdjacencyList = this._adjacencyList.get(adjacentNode) || [];
      const index = nodeAdjacencyList.indexOf(node);
      if (index !== -1) {
        nodeAdjacencyList.splice(index, 1);
      }
    }

    // Update _adjacencyList for nodes having an edge to the deleted node
    this._adjacencyList.forEach((value, key) => {
      const index = value.indexOf(node);
      if (index !== -1) {
        value.splice(index, 1);

        // Invalidate the cache for this node
        this._cache.delete(key);
      }
    });

    // Remove from dependencies
    this._dependencies.delete(node);
    this._dependencies.forEach((value, key) => {
      const index = value.indexOf(node);
      if (index !== -1) {
        value.splice(index, 1);
      }
    });

    // Clear from cache
    this._cache.delete(node);
  }

  /**
   * toDot
   * @returns graphviz source
   */
  toDot(
    types?: { [key: string]: T[] },
    styles: { [key: string]: string } = {},
    weak?: Graph<T>
  ): string {
    const label = (node: T) => `${this._names.get(node)} (${node})` || node;
    let dot = "digraph {\n";
    if (styles.title) {
      dot += `label="${styles.title}";\n`;
    }
    if (types) {
      for (const [k, sty] of Object.entries(styles)) {
        if (types?.[k]?.length)
          dot += `subgraph { node [${sty}]; ${types[k]
            .map((node) => `"${label(node)}"`)
            .join(";\n")}; }\n`;
      }
    }
    for (const [node, edges] of this._adjacencyList.entries()) {
      const nn = label(node);
      if (edges.length > 0) {
        for (const edge of edges) {
          dot += `  "${nn}" -> "${label(edge)}";\n`;
        }
      } else {
        dot += `  "${nn}";\n`;
      }
    }
    if (weak)
      for (const [node, edges] of weak._adjacencyList.entries()) {
        const nn = label(node);
        if (edges.length > 0) {
          for (const edge of edges) {
            dot += `  "${nn}" -> "${label(edge)}" [style="dashed"];\n`;
          }
        }
        // else {
        //   dot += `  "${nn}";\n`;
        // }
      }
    dot += "}\n";
    return dot;
  }
}
