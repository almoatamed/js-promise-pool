import { sleep } from "bun";
import { createPromisePool } from ".";

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
