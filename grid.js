export default class Grid {
    constructor(width, height, scale) {
        this.scale = 50;
        this.offsetX = 25;
        this.offsetY = 25;
        this.edges = [];
        this.nodes = [];
        this.scale = scale;
        this.height = height;
        this.width = width;
        this.nodeCount = this.height * this.width;
        // Horizontal
        for (var i = 0; i < this.height; i++) {
            for (var j = 1; j < this.width; j++) {
                this.edges.push({ start: i * this.width + (j - 1), end: i * this.width + j });
            }
        }
        // Vertical
        for (var i = 1; i < this.height; i++) {
            for (var j = 0; j < this.width; j++) {
                this.edges.push({ start: (i - 1) * this.width + j, end: i * this.width + j });
            }
        }
        for (var i = 0; i < this.height; i++) {
            for (var j = 0; j < this.width; j++) {
                this.nodes.push({ x: j * this.scale + this.offsetX, y: i * this.scale + this.offsetY });
            }
        }
    }
    getPos(nodeId) {
        return this.nodes[nodeId];
    }
    getDistance(nodeId1, nodeId2) {
        return Math.abs((nodeId1 % this.width) - (nodeId2 % this.width))
            + Math.abs((Math.floor(nodeId1 / this.width)) - (Math.floor(nodeId2 / this.width)));
    }
    getConnection(n1, n2) {
        const res = [];
        const i1 = Math.floor(n1 / this.width);
        const j1 = n1 % this.width;
        const i2 = Math.floor(n2 / this.width);
        const j2 = n2 % this.width;
        var start;
        var end;
        if (j1 < j2) {
            start = i1 * (this.width - 1) + j1;
            end = i1 * (this.width - 1) + j2;
        }
        else {
            start = i1 * (this.width - 1) + j2;
            end = i1 * (this.width - 1) + j1;
        }
        for (var k = start; k < end; k++) {
            res.push(this.edges[k]);
        }
        const offset = (this.width - 1) * this.height;
        if (i1 < i2) {
            start = offset + i1 * this.width + j2;
            end = offset + i2 * this.width + j2;
        }
        else {
            start = offset + i2 * this.width + j2;
            end = offset + i1 * this.width + j2;
        }
        for (var k = start; k < end; k += this.width) {
            res.push(this.edges[k]);
        }
        return res;
    }
    getNeighbors(nodeId) {
        const i = Math.floor(nodeId / this.width);
        const j = nodeId % this.width;
        var neighbors = [];
        if (j > 0) {
            // Left
            neighbors.push({ node: nodeId - 1, edge: i * (this.width - 1) + j - 1 });
        }
        if (j < this.width - 1) {
            // Right
            neighbors.push({ node: nodeId + 1, edge: i * (this.width - 1) + j });
        }
        if (i > 0) {
            // Up
            neighbors.push({ node: nodeId - this.width, edge: (this.width - 1) * this.height + (i - 1) * this.width + j });
        }
        if (i < this.height - 1) {
            // Down
            neighbors.push({ node: nodeId + this.width, edge: (this.width - 1) * this.height + i * this.width + j });
        }
        return neighbors;
    }
}
//# sourceMappingURL=grid.js.map