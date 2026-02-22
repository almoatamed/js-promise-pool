# Promise Pool

A TypeScript promise pool implementation that allows you to control the concurrency of async operations.

## Installation

```bash
bun install "js-kt-promise-pool"
```

## Features

- Control the maximum number of concurrent async operations
- Handle both successful and failed operations separately
- Support for aborting all operations
- Type-safe with TypeScript
- Simple and intuitive API

## Usage

```typescript
import { sleep } from "bun";
import { createPromisePool } from "js-kt-promise-pool";

// Create a pool with maximum 10 concurrent operations
const pool = createPromisePool({
  poolSize: 10,
});

// Add tasks to the pool
for (let i = 0; i < 113; i++) {
  pool.run({
    key: String(i),
    cb: async () => {    
      console.log("running", i);
      await sleep(1000); // Simulate async work
      return i;
    },
  });
}

// Wait for all tasks to complete
const results = await pool.wait();
console.log("Results:", results);
```

## API

### `createPromisePool<T>(options)`

Creates a new promise pool.

**Parameters:**
- `options.poolSize` (number): Maximum number of concurrent operations (must be >= 1)
- `options.throwOnFail` (boolean, optional): If true, the pool will reject on first error. If false (default), errors are collected separately.

**Returns:** A pool object with the following methods:

### `pool.run(task)`

Adds a task to the pool queue.

**Parameters:**
- `task.key` (string): Unique identifier for the task
- `task.cb` (function): Async function that receives an `AbortSignal` and returns a value

### `pool.wait()`

Starts executing the queued tasks and waits for all to complete.

**Returns:** Promise that resolves with:
```typescript
{
  successful: { result: T; key: string }[];
  failed: { error: any; key: string }[];
}
```

### `pool.abort()`

Aborts all running tasks and prevents new tasks from starting.

## Example with Error Handling

```typescript
import { createPromisePool } from "js-kt-promise-pool";

const pool = createPromisePool({
  poolSize: 5,
  throwOnFail: false, // Collect errors instead of throwing
});

// Add some tasks that might fail
pool.run({
  key: "task1",
  cb: async () => {
    return "success";
  },
});

pool.run({
  key: "task2",
  cb: async () => {
    throw new Error("Something went wrong");
  },
});

const { successful, failed } = await pool.wait();

console.log("Successful tasks:", successful);
console.log("Failed tasks:", failed);
```

## License

This package is open source and available under the [MIT License](LICENSE).