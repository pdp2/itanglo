import { v4 } from 'https://deno.land/std@0.88.0/uuid/mod.ts';
import ambrogio from './ambrogio.js';

const decoder = new TextDecoder();

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
    let existingPostsData;
    try {
      existingPostsData = await Deno.readFile('./posts.json');
    }
    catch(e) {
      console.log('Unable to read posts.json file, maybe it doesn\'t exist yet?');
    }

    const newPost = {
      id: v4.generate(),
      title,
      body
    };

    let posts = [];

    if (typeof existingPostsData === 'string') {
      posts = JSON.parse(decoder.decode(existingPostsData)).posts || [];
    }

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