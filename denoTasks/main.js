const decoder = new TextDecoder();
const postContentDir = './content/posts/';
const viewsDir = './src/templates/views/';
const componentsDir = './src/templates/components/';

// Get posts content and store in JSON file
let posts = [];

for await (const dirEntry of Deno.readDir(postContentDir)) {
	const postFileData = await Deno.readFile(postContentDir + dirEntry.name);
	const postFileContent = decoder.decode(postFileData);
	const dateString = postFileContent.match(/data-published-date="(.+)"/)[1];
	const [year, month, day, h, m, s] = dateString.split('-');
	const timestamp = new Date(year, month -1, day, h, m, s).getTime(); // month is zero indexed
	const author = postFileContent.match(/data-author="(.+)"/)[1];
	const title = postFileContent.match(/<h2>(.+)<\/h2>/)[1];
	
	posts.push({timestamp, author, title, postFileContent});
}

Deno.writeTextFile('./posts.json', JSON.stringify(posts));

// Render views
for await (const dirEntry of Deno.readDir(viewsDir)) {
	console.log(dirEntry.name);

	const viewFiledata = await Deno.readFile(viewsDir + dirEntry.name);
	const viewFileContent = decoder.decode(viewFiledata);
	const components = await getComponents(viewFileContent);

	console.log(components);
}

async function getComponents(fileContent) {
	return new Promise(resolve => {
		let components = [];

		[...fileContent.matchAll(/<itanglo-([a-zA-Z-]+)\s*.*><\/itanglo-\1>/g)].forEach(async (componentMatch, matchIndex, matchArray) => {
			const componentName = componentMatch[1];
			const dataAttributes = [...componentMatch[0].matchAll(/data-([a-zA-Z]+)="([a-zA-Z\s]*)"/g)].map(dataAttrMatch => {
				return { 
					key: dataAttrMatch[1],
					value: dataAttrMatch[2]
				};
			});
	
			const componentFileData = await Deno.readFile(componentsDir + componentName + '.template.html');
			const componentFileContent = decoder.decode(componentFileData);
	
			components.push({
				name: componentName,
				content: componentFileContent,
				stringToReplace: componentMatch[0],
				dataAttributes
			});

			// last item in array
			if (!matchArray[matchIndex + 1]) {
				resolve(components);
			}
		});
	});
}