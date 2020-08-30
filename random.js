/**
 * Generates a random set of nodes without neighbors.
 */
export function randomNoNeighbors(length, graph) {
    const res = [];
    const out = [];
    for (let i = 0; i < length; i++) {
        let newGen = randomNode(graph);
        while (out.lastIndexOf(newGen) !== -1) {
            newGen = randomNode(graph);
        }
        res.push(newGen);
        out.push(newGen);
        graph.getNeighbors(newGen).forEach(({ node, edge }) => {
            out.push(node);
        });
    }
    return res;
}
function randomNode(graph) {
    return Math.floor(Math.random() * graph.nodes.length);
}
export function randomMinDistance(numTerminals, distance, graph) {
    const set = new Set();
    const rating = new Array(graph.nodes.length);
    for (var i = 0; i < graph.nodes.length; i++) {
        rating[i] = 0;
    }
    while (set.size < numTerminals) {
        const bestRating = Math.max(...rating);
        const candidates = [];
        for (var i = 0; i < graph.nodes.length; i++) {
            if (rating[i] == bestRating) {
                candidates.push(i);
            }
        }
        var newNode = candidates[Math.floor(Math.random() * candidates.length)];
        rating[newNode] = -Infinity;
        for (var i = 0; i < graph.nodes.length; i++) {
            const d = graph.getDistance(i, newNode);
            if (d >= distance) {
                rating[i]++;
            }
            if (d < distance) {
                rating[i]--;
            }
        }
        set.add(newNode);
    }
    return set;
}
//# sourceMappingURL=random.js.map