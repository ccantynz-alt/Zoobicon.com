import { test } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// Minimal stub that mimics the PostgresAgentStore's internal structure
// so we can test the race-condition fix without a real database.
//
// We replicate the relevant logic from store.ts inline so the test is
// self-contained and works even before the module is wired into the build.
// ---------------------------------------------------------------------------

class PostgresAgentStoreSimulatedBuggy {
  constructor(sql) {
    this.sql = sql;
    this.tablesCreated = false;
  }

  async ensureTables() {
    // BUGGY: no guard against concurrent calls — just checks the flag
    if (this.tablesCreated) return;
    await this.sql();          // simulate async table-creation work
    this.tablesCreated = true;
  }
}

class PostgresAgentStoreSimulatedFixed {
  constructor(sql) {
    this.sql = sql;
    this.tablesCreated = false;
    this.tablesCreating = null;
  }

  async ensureTables() {
    if (this.tablesCreated) return;

    if (this.tablesCreating) {
      await this.tablesCreating;
      return;
    }

    this.tablesCreating = this._createTables();
    try {
      await this.tablesCreating;
    } finally {
      this.tablesCreating = null;
    }
  }

  async _createTables() {
    await this.sql();
    this.tablesCreated = true;
  }
}

// ---------------------------------------------------------------------------
// Helper: build a sql stub that counts invocations and resolves after a tick
// ---------------------------------------------------------------------------
function makeSql() {
  let callCount = 0;
  const sql = () => {
    callCount++;
    return new Promise((resolve) => setImmediate(resolve));
  };
  sql.getCallCount = () => callCount;
  return sql;
}

// ---------------------------------------------------------------------------
// Test 1 — buggy implementation allows multiple concurrent table-creations
// ---------------------------------------------------------------------------
test("buggy implementation: concurrent ensureTables() calls execute sql multiple times", async () => {
  const sql = makeSql();
  const store = new PostgresAgentStoreSimulatedBuggy(sql);

  // Fire 5 concurrent calls before any has had a chance to complete
  await Promise.all([
    store.ensureTables(),
    store.ensureTables(),
    store.ensureTables(),
    store.ensureTables(),
    store.ensureTables(),
  ]);

  // With the bug, tablesCreated is still false at the time of every concurrent
  // call, so sql() gets called 5 times.
  // We assert this IS the case so the test documents the buggy behaviour.
  assert.equal(sql.getCallCount(), 5,
    "buggy: sql() should be called 5 times (once per concurrent caller)");
});

// ---------------------------------------------------------------------------
// Test 2 — fixed implementation deduplicates concurrent table-creation calls
// ---------------------------------------------------------------------------
test("fixed implementation: concurrent ensureTables() calls execute sql only once", async () => {
  const sql = makeSql();
  const store = new PostgresAgentStoreSimulatedFixed(sql);

  // Fire 5 concurrent calls before any has had a chance to complete
  await Promise.all([
    store.ensureTables(),
    store.ensureTables(),
    store.ensureTables(),
    store.ensureTables(),
    store.ensureTables(),
  ]);

  // With the fix, the in-flight promise is reused by all subsequent callers,
  // so sql() must have been called exactly once.
  assert.equal(sql.getCallCount(), 1,
    "fixed: sql() should be called exactly once regardless of concurrency");
});

// ---------------------------------------------------------------------------
// Test 3 — after the first call completes, a second call is a no-op
// ---------------------------------------------------------------------------
test("fixed implementation: second sequential call is a no-op", async () => {
  const sql = makeSql();
  const store = new PostgresAgentStoreSimulatedFixed(sql);

  await store.ensureTables();
  await store.ensureTables(); // should short-circuit via tablesCreated flag

  assert.equal(sql.getCallCount(), 1,
    "fixed: sql() should still be called exactly once after two sequential calls");
});

// ---------------------------------------------------------------------------
// Test 4 — tablesCreating is reset to null after completion (no memory leak)
// ---------------------------------------------------------------------------
test("fixed implementation: tablesCreating is null after ensureTables resolves", async () => {
  const sql = makeSql();
  const store = new PostgresAgentStoreSimulatedFixed(sql);

  await store.ensureTables();

  assert.equal(store.tablesCreating, null,
    "fixed: tablesCreating promise reference should be cleared after completion");
});