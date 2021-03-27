/* 
* This code should be executed using Deno.
* The command to do this is deno run --allow-read --allow-write watch.js
*/

import build from './build.js';

const dirToWatch = './src';
const watcher = Deno.watchFs(dirToWatch);

let waiting;

console.log(`Watching "${dirToWatch}" directory... \n`);

for await (const event of watcher) {
   // throttle events as multiple are fired when a file is changed
   if (!waiting) {
      waiting = true;
      setTimeout(() => {
         console.log(`${event.kind} ${event.paths.join(', ')} \n`);
         build();
         waiting = false;
      }, 1000);
   }
}