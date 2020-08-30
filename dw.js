/**
 * Gosper's Hack
 *
 * Iterates over all bit vectors of length n containing k ones.
 */
function* gosper(k, n) {
    var set = (1 << k) - 1;
    const limit = (1 << n);
    while (set < limit) {
        yield set;
        const c = set & -set;
        const r = set + c;
        set = Math.floor(((r ^ set) >> 2) / c) | r;
    }
}
/**
 * Iterates over all proper subsets of a bitvector.
 */
function properSubsets(X, callback) {
    var left = X;
    var right = 0;
    while (true) {
        // Find rightmost 1 in left
        var c = left & -left;
        // Remove that 1 from left
        left = left & ~c;
        // Call
        var set = left | right;
        callback(set);
        if (right !== 0) {
            properSubsets(right, (subRight) => {
                callback(left | subRight);
            });
        }
        if (left === 0)
            break;
        // Put that 1 back into right
        right = right | c;
    }
}
/**
 * Iterates over all proper subsets of a bitvector except 0.
 */
export function properNonzeroSubsets(X, callback) {
    properSubsets(X, (Y) => { if (Y !== 0)
        callback(Y); });
}
/** Computes <= of two numbers, where -1 means infinity */
function leq(x, y) {
    return (x <= y && x !== -1 || y === -1);
}
/** Computes a minimum over a function, where -1 means infinity */
function findMin(iterator, compute) {
    var m = -1;
    var mv = -1;
    iterator((v) => {
        const c = compute(v);
        if (!leq(m, c)) {
            m = c;
            mv = v;
        }
    });
    return { index: mv, minimum: m };
}
/**
 * Dreyfus-Wagner algorithm
 * Following Prömel, Steger:
 * The Steiner Problem - A tour through Graphs, Algorithms, and Complexity.
 */
export default function* computeSteiner(graph, terminals) {
    if (terminals.length > 32) {
        throw "Cannot handle more than 32 terminals";
    }
    if (terminals.length < 2) {
        throw "Cannot handle less than 2 terminals";
    }
    /** Distance between two nodes */
    const p = new Array(graph.nodes.length);
    for (var v = 0; v < graph.nodes.length; v++) {
        p[v] = new Array(graph.nodes.length);
        for (var w = 0; w < graph.nodes.length; w++) {
            p[v][w] = graph.getDistance(v, w);
        }
    }
    /** Index of a terminal if applicable, -1 otherwise */
    const terminalIndex = new Array(graph.nodes.length);
    for (var v = 0; v < graph.nodes.length; v++) {
        terminalIndex[v] = -1;
    }
    for (var t = 0; t < terminals.length; t++) {
        terminalIndex[terminals[t]] = t;
    }
    // sT for all subsets of the terminals
    // svT for all subsets of the terminals
    // sN for all subsets of the terminals union one nonterminal
    // svN for all subsets of the terminals union one nonterminal
    // b variants for backtracking
    const sT = Array(1 << terminals.length);
    const svT = Array(1 << terminals.length);
    const sN = Array(1 << terminals.length);
    const svN = Array(1 << terminals.length);
    const bT = Array(1 << terminals.length);
    const bvT = Array(1 << terminals.length);
    const bN = Array(1 << terminals.length);
    const bvN = Array(1 << terminals.length);
    for (var i = 0; i < 1 << terminals.length; i++) {
        sN[i] = Array(graph.nodes.length);
        svN[i] = Array(graph.nodes.length);
        bN[i] = Array(graph.nodes.length);
        bvN[i] = Array(graph.nodes.length);
    }
    const isIn = (X, v) => terminalIndex[v] !== -1 && (1 << terminalIndex[v] & X) !== 0;
    const set = function (arrayT, arrayN, X, v, res) {
        if (terminalIndex[v] == -1) {
            arrayN[X][v] = res;
        }
        else {
            arrayT[X | 1 << terminalIndex[v]] = res;
        }
    };
    const splitCall = function (f, X) {
        const rightmost1 = X & -X;
        X = X & ~rightmost1;
        const v = terminals[Math.log2(rightmost1)];
        return f(X, v);
    };
    const get1 = function (arrayT, arrayN, X) {
        return splitCall((X, v) => get(arrayT, arrayN, X, v), X);
    };
    const get = function (arrayT, arrayN, X, v) {
        if (terminalIndex[v] == -1) {
            return arrayN[X][v];
        }
        else {
            return arrayT[X | 1 << terminalIndex[v]];
        }
    };
    for (var x = 0; x < terminals.length; x++) {
        for (var v = 0; v < graph.nodes.length; v++) {
            set(sT, sN, 1 << x, v, p[terminals[x]][v]);
        }
    }
    var progress = 0;
    const totalProgress = Math.pow(2, terminals.length);
    for (var i = 2; i < terminals.length; i++) {
        for (const X of gosper(i, terminals.length)) {
            progress++;
            if (progress % 10 === 0) {
                yield progress / totalProgress * 100;
            }
            for (var v = 0; v < graph.nodes.length; v++) {
                if (isIn(X, v))
                    continue;
                const { index, minimum } = findMin((f) => properNonzeroSubsets(X, f), (subX) => get(sT, sN, subX, v) + get(sT, sN, X & ~subX, v));
                set(svT, svN, X, v, minimum);
                set(bvT, bvN, X, v, index);
            }
            for (var v = 0; v < graph.nodes.length; v++) {
                if (isIn(X, v))
                    continue;
                const { index, minimum } = findMin((f) => {
                    for (var w = 0; w < graph.nodes.length; w++) {
                        f(w);
                    }
                }, (w) => isIn(X, w) ? p[v][w] + get1(sT, sN, X) : p[v][w] + get(svT, svN, X, w));
                set(sT, sN, X, v, minimum);
                set(bT, bN, X, v, index);
            }
        }
        ;
    }
    const isSingleton = (X) => (X & ~(X & -X)) === 0;
    const connections = [];
    const backtrackBV = (X, v) => {
        var subX = get(bvT, bvN, X, v);
        backtrackB(subX, v);
        backtrackB(X & ~subX, v);
    };
    const backtrackB = (X, v) => {
        if (isSingleton(X)) {
            connections.push([terminals[Math.log2(X)], v]);
            return;
        }
        var w = get(bT, bN, X, v);
        connections.push([v, w]);
        if (isIn(X, w)) {
            backtrackB1(X);
        }
        else {
            backtrackBV(X, w);
        }
    };
    const backtrackB1 = (X) => splitCall(backtrackB, X);
    var X = (1 << terminals.length) - 1;
    backtrackB1(X);
    const res = [];
    connections.forEach((c) => {
        res.push(...graph.getConnection(c[0], c[1]));
    });
    console.log(connections);
    console.log(res);
    yield { cost: get1(sT, sN, (1 << terminals.length) - 1), solution: res };
}
/* Detailed backtracking:

  const isSingleton = (X : number) => (X & ~(X & - X)) === 0;

  const backtrackBV = (X, v) => {
    console.log(`BV X = ${X}; v = ${v}`);
    var subX = get(bvT, bvN, X, v);
    var cost = get(svT, svN, X, v);
    return {
      cost: cost,
      X: subX.toString(2),
      forX: backtrackB(subX, v),
      forComplement: backtrackB(X & ~subX, v)
    }
  }

  const backtrackB = (X, v) => {
    console.log(`B X = ${X}; v = ${v}`);
    if (isSingleton(X)){
      return `${terminals[Math.log2(X)]}--${v}`;
    }
    var w = get(bT, bN, X, v);
    var cost = get(sT, sN, X, v);
    console.log(w);
    console.log(isIn(X,w));
    if (isIn(X,w)){
      return {cost: cost, X: X.toString(2), v: v, w: w, b: backtrackB1(X)};
    } else {
      return {cost: cost, X: X.toString(2), v: v, w: w, b: backtrackBV(X, w)};
    }
  }
  console.log(`6: ${get(sT, sN, 4, 2)}`);

  const backtrackB1 = (X  : number) => splitCall(backtrackB, X);

  var X = (1 << terminals.length) - 1;
  return backtrackB1(X);

  //return get1(sT, sN, (1 << terminals.length) - 1);

*/
//# sourceMappingURL=dw.js.map