export default class Honeycomb {
    constructor(width, height, scale) {
        this.offsetX = 25;
        this.offsetY = 25;
        this.edges = [];
        this.nodes = [];
        this.neighbors = [];
        this.scale = scale;
        this.height = height;
        this.width = width;
        this.nodeCount = this.height * this.width;
        // Nodes
        for (var i = 0; i < this.height; i++) {
            for (var j = 0; j < this.width; j++) {
                var x = j * Math.sqrt(3) * 0.5 * this.scale + this.offsetX;
                var y = i * 1.5 * this.scale + this.offsetY;
                if ((i + j) % 2 == 0) {
                    y += 0.5 * this.scale;
                }
                this.nodes.push({ x, y });
            }
        }
        // Horizontal Edges
        for (var i = 0; i < this.height; i++) {
            for (var j = 0; j < this.width - 1; j++) {
                if ((i + j) % 2 == 0) {
                    this.edges.push({ start: i * this.width + j, end: i * this.width + j + 1 });
                }
                else {
                    this.edges.push({ start: i * this.width + j, end: i * this.width + j + 1 });
                }
            }
        }
        // Vertical edges
        for (var i = 0; i < this.height - 1; i++) {
            for (var j = 0; j < this.width; j++) {
                if ((i + j) % 2 == 0) {
                    this.edges.push({ start: i * this.width + j, end: (i + 1) * this.width + j });
                }
            }
        }
        // Neighbors
        for (var n = 0; n < this.nodes.length; n++) {
            this.neighbors[n] = [];
        }
        for (var e = 0; e < this.edges.length; e++) {
            this.neighbors[this.edges[e].start].push({ node: this.edges[e].end, edge: e });
            this.neighbors[this.edges[e].end].push({ node: this.edges[e].start, edge: e });
        }
    }
    getPos(nodeId) {
        return this.nodes[nodeId];
    }
    getDistance(nodeId1, nodeId2) {
        const c = this.getConnection(nodeId1, nodeId2);
        return c.length;
    }
    getConnection(n1, n2) {
        if (n1 === n2)
            return [];
        const i1 = Math.floor(n1 / this.width);
        const j1 = n1 % this.width;
        const i2 = Math.floor(n2 / this.width);
        const j2 = n2 % this.width;
        if (i1 > i2)
            return this.getConnection(n2, n1);
        if (i1 == i2 && j1 > j2)
            return this.getConnection(n2, n1);
        if (i1 == i2) {
            const c = this.getConnection(n1 + 1, n2);
            c.push(this.edges[(this.width - 1) * i1 + j1]);
            return c;
        }
        const riseStripe1 = Math.floor((j1 + i1) / 2);
        const riseStripe2 = Math.floor((j2 + i2) / 2);
        const fallStripe1 = Math.ceil((j1 - i1) / 2);
        const fallStripe2 = Math.ceil((j2 - i2) / 2);
        if (fallStripe1 <= fallStripe2) {
            if ((i1 + j1) % 2 == 0) {
                const c = this.getConnection(n1 + this.width, n2);
                c.push(this.edges[(this.width - 1) * this.height + Math.floor((i1 * this.width + j1) / 2)]);
                return c;
            }
            else {
                const c = this.getConnection(n1 + 1, n2);
                c.push(this.edges[(this.width - 1) * i1 + j1]);
                return c;
            }
        }
        if (riseStripe1 >= riseStripe2) {
            if ((i1 + j1) % 2 == 0) {
                const c = this.getConnection(n1 + this.width, n2);
                c.push(this.edges[(this.width - 1) * this.height + Math.floor((i1 * this.width + j1) / 2)]);
                return c;
            }
            else {
                const c = this.getConnection(n1 - 1, n2);
                c.push(this.edges[(this.width - 1) * i1 + j1 - 1]);
                return c;
            }
        }
        if ((i1 + j1) % 2 == 0) {
            const c = this.getConnection(n1 + this.width, n2);
            c.push(this.edges[(this.width - 1) * this.height + Math.floor((i1 * this.width + j1) / 2)]);
            return c;
        }
        else {
            if (j1 !== 0) {
                const c = this.getConnection(n1 - 1, n2);
                c.push(this.edges[(this.width - 1) * i1 + j1 - 1]);
                return c;
            }
            else {
                const c = this.getConnection(n1 + 1, n2);
                c.push(this.edges[(this.width - 1) * i1 + j1]);
                return c;
            }
        }
    }
    getNeighbors(nodeId) {
        return this.neighbors[nodeId];
    }
}
//# sourceMappingURL=honeycomb.js.map