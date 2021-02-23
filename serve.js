import { serve } from 'https://deno.land/std@0.87.0/http/server.ts';
import { v4 } from 'https://deno.land/std@0.88.0/uuid/mod.ts';
import ambrogio from './ambrogio.js';

ambrogio.listen(1234);

ambrogio.get('/', async (req) => {
  const fileData = await Deno.readFile('./docs/index.html');
  req.respond({ status: 200, body: fileData });
});

ambrogio.get('/new-post', async (req) => {
  const fileData = await Deno.readFile('./docs/new-post.html');
  req.respond({ status: 200, body: fileData });
});

ambrogio.post('/post', async (req) => {
  const bodyData = await Deno.readAll(req.body);
  const { title, body } = JSON.parse(decoder.decode(bodyData));
  
  if (title) {
    const existingPostsData = await Deno.readFile('./posts.json');
    const newPost = {
      id: v4.generate(),
      title,
      body
    };

    let posts = JSON.parse(decoder.decode(existingPostsData)).posts || [];

    posts.push(newPost);

    const postsJSON = JSON.stringify({ posts });

    Deno.writeTextFile('./posts.json', postsJSON);

    req.respond({
      status: 200,
      body: newPost.id
    });
  }
  else {
    req.respond({
      status: 400,
      body: 'A title is required to create a new post.'
    })
  }
});

const decoder = new TextDecoder();
const port = 8084;
const server = serve({ port });

console.log(`http://localhost:${port} \n`);

for await (const req of server) {

  console.log(`${req.method}: ${req.url} \n`);
  if (req.method === 'POST') {

    if (req.url === '/new-post') {
       
    }
  }
  else {
    req.respond({ body: 'Sorry that request type is not supported.' });
  }
}