import { sleep } from "bun";

export const createPromisePool = <T>(props: {
  poolSize: number;
  throwOnFail?: boolean;
}) => {
  if (props.poolSize < 1) {
    throw new Error("Pool size must be at least 1 in size");
  }

  const queue = [] as {
    cb: (signal: AbortSignal) => T | Promise<T>;
    key: string;
  }[];
  let runningCount = 0;
  const results = [] as {
    result: T;
    key: string;
  }[];
  const errors = [] as {
    error: any;
    key: string;
  }[];

  let waitPromiseResolvers = null as null | {
    resolve: (params: {
      successful: {
        result: T;
        key: string;
      }[];
      failed: {
        error: any;
        key: string;
      }[];
    }) => void;
    reject: (err: any) => void;
  };

  let terminated = false;
  const terminate = () => {
    waitPromiseResolvers?.resolve({
      failed: errors,
      successful: results,
    });
    terminated = true;
  };

  const reject = (err: any) => {
    waitPromiseResolvers?.reject(err);
  };
  const abortController = new AbortController();

  const refresh = () => {
    if (!waitPromiseResolvers) {
      return;
    }

    if (runningCount == 0 && queue.length == 0) {
      terminate();
      return;
    }
    if (terminated) {
      return;
    }

    const emptySlots = props.poolSize - runningCount;
    if (emptySlots <= 0) {
      return;
    }

    for (let i = 0; i < emptySlots; i++) {
      if (runningCount == 0 && queue.length == 0) {
        terminate();
      }
      const call = queue.shift()!;
      if (!call) {
        break;
      }
      (async () => {
        try {
          runningCount += 1;
          const result = await call.cb(abortController.signal);
          results.push({
            result,
            key: call.key,
          });
        } catch (error) {
          console.error(error);
          if (props.throwOnFail) {
            reject(error);
            return;
          }
          errors.push({
            error: error,
            key: call.key,
          });
        } finally {
          runningCount -= 1;
          refresh();
        }
      })();
    }
  };

  const wait = () => {
    if (waitPromiseResolvers) {
      throw new Error("called `wait` more than once");
    }
    return new Promise<{
      successful: {
        result: T;
        key: string;
      }[];
      failed: {
        error: any;
        key: string;
      }[];
    }>((resolve, reject) => {
      waitPromiseResolvers = {
        resolve: resolve,
        reject: reject,
      };
      refresh();
    });
  };

  const pushToQueue = (props: {
    cb: (signal: AbortSignal) => T | Promise<T>;
    key: string;
  }) => {
    if (waitPromiseResolvers) {
      throw new Error("You cannot push to pool once you started waiting");
    }
    queue.push(props);
  };

  return {
    run: pushToQueue,
    wait,
    abort: () => {
      abortController.abort();
      terminated = true;
    },
  };
};

const pool = createPromisePool({
  poolSize: 10,
});

const startTime = Date.now();
for (let i = 0; i < 113; i++) {
  pool.run({
    key: String(i),
    cb: async () => {    
      console.log("running", i);
      await sleep(1e3)
      return i;
    },
  });
}

const results = await pool.wait();
console.log("ended at", Date.now() - startTime, results);
