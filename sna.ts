/*
 * All modeling and programming by Ben Vermeulen (b.vermeulen@uni-hohenheim.de)
 * The software is licensed under the Creative Commons BY-NC-SA 4.0.
 * You are allowed to share and adapt but credits have to be given.
 */

module CBD {

    export class GraphNode {
        ID: number;
        label: string;
        centrality: number = 0; // number of times the node is on a shortest path
        weight: number = 0; // not used
        tag: any;
    }

    export class GraphEdge {
        n1: number;
        n2: number;
        weight: number = 0;
    }

    export class NodeInfo {
        n: GraphNode = null;
        distance: number = Number.MAX_SAFE_INTEGER;
        prev: NodeInfo = null;
        checked: boolean = false;
    }

    export class MyGraph {
        
        nodes: Array<GraphNode> = new Array<GraphNode>();
        edges: Array<GraphEdge> = new Array<GraphEdge>();

        addNode(ID: number, label: string, weight: number, tag: any) {
            var n = new GraphNode();
            n.ID = ID;
            n.label = label;
            n.weight = weight;
            n.tag = tag;
            this.nodes.push(n);
        }

        addEdge(n1ID: number, n2ID: number, weight: number) {
            var e = new GraphEdge();
            e.n1 = n1ID;
            e.n2 = n2ID;
            e.weight = weight;
            this.edges.push(e);
        }

        // Dijkstra
        constructShortestPaths(sourceID: number): Array<NodeInfo> {
            var vertexSet = new Array<NodeInfo>();
            for(var node of this.nodes)
            {
                var ni = new NodeInfo();
                ni.n = node;
                ni.prev = null;
                vertexSet.push(ni);
            }
            vertexSet.find(zz => zz.n.ID == sourceID).distance = 0;

            var fvs = vertexSet.filter(zz => !zz.checked);
            while (fvs.length > 0) {
                
                var u = fvs[0];
                var uminval = fvs[0].distance;
                for (var ni of fvs) // could be multiple, just starting from first/ last is fine
                {
                    if (ni.distance < uminval) {
                        u = ni;
                        uminval = ni.distance;
                    }
                }
                u.checked = true;

                for (var v of fvs)
                {
                    if (v.n.ID == u.n.ID) continue;

                    // is adjacent to u?
                    var le = this.edges.filter(zz => (zz.n1 == u.n.ID && zz.n2 == v.n.ID) || (zz.n2 == u.n.ID && zz.n1 == v.n.ID));
                    if (le.length == 0) continue;

                    // Edge e = le.Argmin(zz => zz.weight);
                    var dist = u.distance + 1; // no weight at the moment, otherwise use e.weight instead of +1
                    if (dist < v.distance) {
                        // can get to v faster through u
                        v.distance = dist;
                        v.prev = u;
                    }
                }

                fvs = vertexSet.filter(zz => !zz.checked);
            }
            return vertexSet;
        }

        setNodeDegreeCentrality() {
            this.nodes.forEach(zz => zz.centrality = 0);
            for (var node of this.nodes) {
                node.centrality = this.edges.filter(zz => zz.n1 == node.ID || zz.n2 == node.ID).length;
            }
        }

        setNodeBetweennessCentrality() {
            this.nodes.forEach(zz => zz.centrality = 0);
            for (var node of this.nodes) {
                var lni = this.constructShortestPaths(node.ID);
                for (var ni of lni) {
                    var _n = ni;
                    do {
                        _n.n.centrality++;
                        _n = _n.prev;
                    } while (_n != null);
                }
            }
        }
    }
}