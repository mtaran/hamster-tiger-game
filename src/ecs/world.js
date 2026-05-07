// Tiny Entity-Component-System.
//
// Entities are integer IDs. Components are plain objects keyed by a
// string name on the World. Systems are functions invoked each tick
// with (world, dt, ctx).
//
// Queries iterate over the smallest component map among the requested
// names, so adding components used by few entities keeps queries fast
// without any indexing machinery.

export class World {
  constructor() {
    this._nextId = 1;
    this._alive = new Set();
    this._components = new Map(); // name -> Map<id, data>
    this._systems = [];
    this._toRemove = new Set();
    this.resources = {}; // arbitrary shared state (input, rng, etc.)
  }

  createEntity(components = {}) {
    const id = this._nextId++;
    this._alive.add(id);
    for (const [name, data] of Object.entries(components)) {
      this.addComponent(id, name, data);
    }
    return id;
  }

  destroyEntity(id) {
    // Defer destruction until end of tick to avoid invalidating
    // queries that callers are iterating.
    this._toRemove.add(id);
  }

  isAlive(id) {
    return this._alive.has(id) && !this._toRemove.has(id);
  }

  addComponent(id, name, data) {
    if (!this._alive.has(id)) {
      throw new Error(`addComponent on dead entity ${id}`);
    }
    let store = this._components.get(name);
    if (!store) {
      store = new Map();
      this._components.set(name, store);
    }
    store.set(id, data);
    return data;
  }

  removeComponent(id, name) {
    const store = this._components.get(name);
    if (store) store.delete(id);
  }

  getComponent(id, name) {
    const store = this._components.get(name);
    return store ? store.get(id) : undefined;
  }

  hasComponent(id, name) {
    const store = this._components.get(name);
    return store ? store.has(id) : false;
  }

  // Yields { id, ...components } for each entity that has all named components.
  *query(...names) {
    if (names.length === 0) return;
    let smallest = this._components.get(names[0]);
    if (!smallest) return;
    for (let i = 1; i < names.length; i++) {
      const s = this._components.get(names[i]);
      if (!s) return;
      if (s.size < smallest.size) smallest = s;
    }
    outer: for (const id of smallest.keys()) {
      const out = { id };
      for (const name of names) {
        const store = this._components.get(name);
        const data = store && store.get(id);
        if (data === undefined) continue outer;
        out[name] = data;
      }
      yield out;
    }
  }

  // Returns the first matching entity, or undefined.
  queryFirst(...names) {
    for (const e of this.query(...names)) return e;
    return undefined;
  }

  addSystem(fn) {
    this._systems.push(fn);
    return fn;
  }

  step(dt, ctx) {
    for (const sys of this._systems) sys(this, dt, ctx);
    if (this._toRemove.size > 0) {
      for (const id of this._toRemove) {
        for (const store of this._components.values()) store.delete(id);
        this._alive.delete(id);
      }
      this._toRemove.clear();
    }
  }
}
