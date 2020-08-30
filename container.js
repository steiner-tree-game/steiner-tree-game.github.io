export default class Container {
    constructor() {
        this.items = [];
    }
    add(item) {
        this.items.push(item);
    }
    filter(callback) {
        for (var i = 0; i < this.items.length; i++) {
            if (!callback(this.items[i])) {
                if (i + 1 == this.items.length) {
                    this.items.pop();
                }
                else {
                    this.items[i] = this.items.pop();
                }
            }
        }
    }
    size() {
        return this.items.length;
    }
    forEach(callback) {
        for (var i = 0; i < this.items.length; i++) {
            callback(this.items[i]);
        }
    }
}
//# sourceMappingURL=container.js.map