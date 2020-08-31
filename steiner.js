import Grid from "./grid.js";
import Honeycomb from "./honeycomb.js";
import Container from "./container.js";
import computeSteiner from "./dw.js";
import { randomMinDistance } from "./random.js";
var canvas = document.querySelector('canvas'), controls = document.querySelector('#controls'), ctx = canvas.getContext('2d'), colors = ['#f35d4f', '#f36849', '#c0d988', '#6ddaf1', '#f1e85b'];
var scale = 1;
const unitWidth = 500;
const unitHeight = 550;
const resize = function () {
    scale = Math.min(window.innerWidth / unitWidth, window.innerHeight / unitHeight);
    canvas.width = unitWidth * scale;
    canvas.height = unitHeight * scale;
    canvas.style.left = (window.innerWidth - canvas.width) / 2 + 'px';
    canvas.style.top = (window.innerHeight - canvas.height) / 2 + 'px';
    controls.setAttribute("style", `width: ${unitWidth}px;height: ${50}px;zoom:${scale};`);
    controls.style.left = (window.innerWidth - canvas.width) / 2 / scale + 'px';
    controls.style.top = ((window.innerHeight - canvas.height) / 2 / scale + 500) + 'px';
};
resize();
window.addEventListener('resize', resize);
var drops;
var radios;
var particles;
var graph;
var terminals;
var cost;
var progress;
var solution;
var activeEdges;
var computation;
var showSolution = false;
var won = false;
function newGame(hashStr) {
    clearInterval(computation);
    won = false;
    drops = new Container();
    radios = new Container();
    particles = new Container();
    activeEdges = new Set();
    cost = NaN;
    solution = new Set();
    showSolution = false;
    const hash = hashStr.split("-");
    const type = hash.shift();
    var numTerminals;
    switch (type) {
        case "gridS":
            graph = new Grid(10, 10, 50);
            numTerminals = 10;
            break;
        case "gridL":
            graph = new Grid(12, 12, 40);
            numTerminals = 12;
            break;
        case "honeycombS":
            graph = new Honeycomb(11, 7, 45);
            numTerminals = 10;
            break;
        case "honeycombL":
            graph = new Honeycomb(15, 9, 35);
            numTerminals = 12;
            break;
        default: throw "Unknown graph";
    }
    if (hash.length === 0) {
        //terminals = new Set(randomNoNeighbors(numTerminals, graph));
        terminals = randomMinDistance(numTerminals, 4, graph);
    }
    else {
        terminals = new Set(hash.map((i) => parseInt(i)));
    }
    currentHash = `#${type}-${Array.from(terminals).join('-')}`;
    window.location.hash = currentHash;
    computation = setInterval(compute, 10);
    const steinerProcess = computeSteiner(graph, Array.from(terminals));
    function compute() {
        const res = steinerProcess.next().value;
        console.log(res);
        if (res.solution) { // Solution found
            cost = res.cost;
            solution = res.solution;
            clearInterval(computation);
        }
        else { // Progress reported
            progress = res;
        }
    }
}
var currentHash = window.location.hash;
if (currentHash === "") {
    newGame("gridS");
}
else {
    newGame(currentHash.substring(1));
}
function onHashChange() {
    if (currentHash !== window.location.hash) {
        newGame(window.location.hash.substring(1));
    }
}
window.addEventListener('hashchange', onHashChange);
document.querySelector('#new-game-honeycombS').onclick = function () {
    newGame("honeycombS");
};
document.querySelector('#new-game-honeycombL').onclick = function () {
    newGame("honeycombL");
};
document.querySelector('#new-game-gridS').onclick = function () {
    newGame("gridS");
};
document.querySelector('#new-game-gridL').onclick = function () {
    newGame("gridL");
};
document.querySelector('#solution').onclick = function () {
    showSolution = !showSolution;
};
function Particle() {
    this.x = 0;
    this.y = 0;
    this.rad = Math.round(Math.random() * 1) + 1;
    this.rgba = colors[Math.round(Math.random() * 3)];
    this.vx = Math.round(Math.random() * 3) - 1.5;
    this.vy = Math.round(Math.random() * 3) - 1.5;
    this.angle = 0;
    this.goalX = 0;
    this.goalY = 0;
    this.goalNode = null;
    this.currentEdge = null;
}
function Drop(x, y) {
    this.x = x;
    this.y = y;
    this.rad = Math.round(Math.random() * 1) + 1;
    this.rgba = colors[Math.round(Math.random() * 3)];
    this.vx = Math.round(Math.random() * 3) - 1.5;
    this.vy = Math.round(Math.random() * 3) - 1.5;
    this.lifetime = 160;
}
function Radio(x, y, lifetime) {
    this.x = x;
    this.y = y;
    this.lifetime = lifetime;
}
function exploreConnected(currentNode, network) {
    network.add(currentNode);
    graph.getNeighbors(currentNode).forEach(({ node, edge }) => {
        if (activeEdges.has(graph.edges[edge]) && !network.has(node)) {
            exploreConnected(node, network);
        }
    });
    return network;
}
function checkWon() {
    const network = exploreConnected(Array.from(terminals)[0], new Set());
    const connected = Array.from(terminals).every((t) => network.has(t));
    won = connected && (activeEdges.size <= cost);
}
var removeMode = null;
function mouseMoveListener(setMode, e) {
    const rect = canvas.getBoundingClientRect();
    var x = (e.clientX - rect.left) / scale;
    var y = (e.clientY - rect.top) / scale;
    var minEdge = null;
    var minDistance = 9999999999;
    var threshold = 10;
    graph.edges.forEach((edge) => {
        var startX = graph.getPos(edge.start).x;
        var startY = graph.getPos(edge.start).y;
        var endX = graph.getPos(edge.end).x;
        var endY = graph.getPos(edge.end).y;
        var midX = (startX + endX) / 2;
        var midY = (startY + endY) / 2;
        var distance = Math.sqrt((midX - x) * (midX - x) + (midY - y) * (midY - y));
        if (distance <= minDistance) {
            if (distance <= minDistance - threshold) {
                minEdge = edge;
            }
            else {
                minEdge = null;
            }
            minDistance = distance;
        }
    });
    if (minEdge !== null) {
        if (setMode) {
            removeMode = activeEdges.has(minEdge);
        }
        if (removeMode) {
            activeEdges.delete(minEdge);
        }
        else {
            activeEdges.add(minEdge);
        }
        checkWon();
    }
}
const mouseMoveListenerMode = (e) => mouseMoveListener(false, e);
window.addEventListener('mouseup', (e) => {
    canvas.removeEventListener('mousemove', mouseMoveListenerMode);
});
canvas.addEventListener('mousedown', (e) => {
    mouseMoveListener(true, e);
    canvas.addEventListener('mousemove', mouseMoveListenerMode);
});
var lastTimestamp = window.performance.now();
function draw(timestamp) {
    const timeDiff = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    if (showSolution) {
        solution.forEach((edge) => {
            ctx.strokeStyle = 'rgba(200,50,50,0.8)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(graph.getPos(edge.start).x * scale, graph.getPos(edge.start).y * scale);
            ctx.lineTo(graph.getPos(edge.end).x * scale, graph.getPos(edge.end).y * scale);
            ctx.stroke();
        });
    }
    activeEdges.forEach((edge) => {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(graph.getPos(edge.start).x * scale, graph.getPos(edge.start).y * scale);
        ctx.lineTo(graph.getPos(edge.end).x * scale, graph.getPos(edge.end).y * scale);
        ctx.stroke();
    });
    const radioLifetime = 10000;
    ctx.globalCompositeOperation = 'source-over';
    for (var i = 0; i < graph.nodes.length; i++) {
        if (terminals.has(i)) {
            graph.getNeighbors(i).forEach(({ node, edge }) => {
                var e = graph.edges[edge];
                if (activeEdges.has(e) && Math.random() < 0.02 && particles.size() < activeEdges.size) {
                    const p = new Particle;
                    p.currentEdge = e;
                    p.angle = null;
                    p.x = graph.getPos(i).x;
                    p.y = graph.getPos(i).y;
                    p.goalX = graph.getPos(node).x;
                    p.goalY = graph.getPos(node).y;
                    p.goalNode = node;
                    particles.add(p);
                }
            });
            if (won && Math.random() < 0.002) {
                radios.add(new Radio(graph.getPos(i).x, graph.getPos(i).y, radioLifetime));
            }
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(graph.nodes[i].x * scale, graph.nodes[i].y * scale, 10 * scale, 0, Math.PI * 2, true);
            ctx.fill();
            ctx.closePath();
        }
        else {
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(graph.nodes[i].x * scale, graph.nodes[i].y * scale, 2 * scale, 0, Math.PI * 2, true);
            ctx.fill();
            ctx.closePath();
        }
    }
    drops.forEach((d) => {
        var factor = 1;
        ctx.fillStyle = d.rgba;
        ctx.strokeStyle = d.rgba;
        ctx.beginPath();
        ctx.arc(d.x * scale, d.y * scale, d.rad * factor * scale, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();
        d.lifetime -= timeDiff;
    });
    drops.filter((d) => d.lifetime > 0);
    radios.forEach((d) => {
        ctx.strokeStyle = `rgba(255,255,255,${d.lifetime / radioLifetime})`;
        ctx.beginPath();
        ctx.arc(d.x * scale, d.y * scale, (radioLifetime - d.lifetime) / 10 * scale, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.closePath();
        d.lifetime -= timeDiff;
    });
    radios.filter((d) => d.lifetime > 0);
    if (won) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `${50 * scale}px Arial`;
        const txt = "YOU WON!";
        const txtWidth = ctx.measureText(txt).width;
        ctx.fillText(txt, 250 * scale - txtWidth / 2, 250 * scale);
    }
    particles.forEach((p) => {
        var factor = 2;
        if (Math.random() > 0.5) {
            drops.add(new Drop(p.x, p.y));
        }
        ctx.fillStyle = p.rgba;
        ctx.strokeStyle = p.rgba;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x * scale, p.y * scale, p.rad * factor * scale, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();
        // ctx.beginPath();
        // ctx.arc(p.x * scale, p.y * scale, (p.rad+5)*factor * scale, 0, Math.PI*2, true);
        // ctx.stroke();
        // ctx.closePath();
        if (p.angle === null) {
            p.angle = Math.atan2(p.goalY - p.y, p.goalX - p.x);
            p.vx = Math.cos(p.angle);
            p.vy = Math.sin(p.angle);
        }
        if ((p.goalY - p.y) * p.vy + (p.goalX - p.x) * p.vx < 0) {
            var neighbors = graph.getNeighbors(p.goalNode)
                .filter((n) => graph.edges[n.edge] != p.currentEdge && activeEdges.has(graph.edges[n.edge]));
            if (neighbors.length === 0) {
                p.currentEdge = null;
            }
            else {
                const n = neighbors[Math.floor(Math.random() * neighbors.length)];
                p.goalNode = n.node;
                p.currentEdge = graph.edges[n.edge];
                p.goalX = graph.getPos(p.goalNode).x;
                p.goalY = graph.getPos(p.goalNode).y;
                var angle = Math.atan2(p.goalY - p.y, p.goalX - p.x);
                p.vx = Math.cos(angle);
                p.vy = Math.sin(angle);
            }
        }
        p.x += p.vx * timeDiff / 16;
        p.y += p.vy * timeDiff / 16;
    });
    particles.filter((p) => p.currentEdge !== null && activeEdges.has(p.currentEdge));
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `${15 * scale}px Arial`;
    ctx.fillText('Connect all dots with the given number of lines!', 15 * scale, 505 * scale);
    if (!isNaN(cost)) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `${30 * scale}px Arial`;
        ctx.fillText(`${cost - activeEdges.size}`, 440 * scale, 530 * scale);
    }
    else {
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#FFFFFF";
        ctx.moveTo(460 * scale, 510 * scale);
        ctx.beginPath();
        ctx.lineTo(460 * scale + 20 * scale, 510 * scale);
        ctx.arc(460 * scale, 510 * scale, 20 * scale, 0, progress / 100 * Math.PI * 2, true);
        ctx.lineTo(460 * scale, 510 * scale);
        ctx.fill();
        ctx.closePath();
    }
}
const requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
(function loop(timestamp) {
    draw(timestamp);
    requestAnimFrame(loop);
})();
//# sourceMappingURL=steiner.js.map