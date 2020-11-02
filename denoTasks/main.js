// get content data
// get all files in views dir
// read view file
// get components
// get component attributes
// pass data to components
// render components
// write file

const decoder = new TextDecoder();
const postContentDir = './content/posts/';
let posts = [];

for await (const dirEntry of Deno.readDir(postContentDir)) {
	console.log(dirEntry.name);

	const data = await Deno.readFile(postContentDir + dirEntry.name);
	const content = decoder.decode(data);
	const postDateString = content.match(/data-published-date="(.+)"/)[1];
	const [year, month, day, h, m, s] = postDateString.split('-');
	const timestamp = new Date(year, month -1, day, h, m, s).getTime(); // month is zero indexed
	const author = content.match(/data-author="(.+)"/)[1];
	const title = content.match(/<h2>(.+)<\/h2>/)[1];
	
	posts.push({timestamp, author, title, content});
}

console.log(posts);

Deno.writeTextFile('./posts.json', JSON.stringify(posts));