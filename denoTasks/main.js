const decoder = new TextDecoder();
const postContentDir = './content/posts/';
const viewsDir = './src/templates/views/';

// Get posts content and store in JSON file
let posts = [];

for await (const dirEntry of Deno.readDir(postContentDir)) {
	const data = await Deno.readFile(postContentDir + dirEntry.name);
	const content = decoder.decode(data);
	const dateString = content.match(/data-published-date="(.+)"/)[1];
	const [year, month, day, h, m, s] = dateString.split('-');
	const timestamp = new Date(year, month -1, day, h, m, s).getTime(); // month is zero indexed
	const author = content.match(/data-author="(.+)"/)[1];
	const title = content.match(/<h2>(.+)<\/h2>/)[1];
	
	posts.push({timestamp, author, title, content});
}

Deno.writeTextFile('./posts.json', JSON.stringify(posts));

// Render views
for await (const dirEntry of Deno.readDir(viewsDir)) {
	console.log(dirEntry.name);

	const data = await Deno.readFile(viewsDir + dirEntry.name);
	const content = decoder.decode(data);
	const componentList = [...content.matchAll(/<itanglo-(.+).*><\/itanglo-\1>/g)].map(item => item[1]);
	
	console.log(componentList);
}