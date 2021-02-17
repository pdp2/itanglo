import { serve } from "https://deno.land/std@0.87.0/http/server.ts";

const decoder = new TextDecoder();
const port = 8084;
const server = serve({ port });

console.log(`http://localhost:${port} \n`);

for await (const req of server) {

  console.log(`${req.method}: ${req.url} \n`);

  if (req.method === 'GET') {
    if (req.url === '/') {
      const fileData = await Deno.readFile('./new-post.html');
      req.respond({ status: 200, body: fileData });
    }
    else {
      const fileData = await Deno.readFile(`.${req.url}`);
      const headers = new Headers();

      if (fileData) {
        if (req.url.indexOf('.css') > 1) {
          headers.append('Content-Type', 'text/css; charset=utf-8')
        }

        req.respond({ 
          status: 200,
          headers,
          body: fileData 
        });
      }
      else {
        req.respond({ 
          status: 404,
          body: '404 Not found' 
        });
      }

    }
  }
  else {
    req.respond({ body: 'Sorry that request type is not supported.' });
  }
}