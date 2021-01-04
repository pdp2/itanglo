const decoder = new TextDecoder();
const postsSrc = './src/posts/';
const componentsDir = './src/components/';

let postContent = [];

// Get post content from post src files
for await (const dirEntry of Deno.readDir(postsSrc)) {
	const postFileData = await Deno.readFile(postsSrc + dirEntry.name);
	const postFileContent = decoder.decode(postFileData);

	postContent.push({
		path: dirEntry.name,
		content: postFileContent
	});
}

// Find references to components in post content and render components if they exist
postContent.forEach(async post => {
	const data = { basePath: '../' };
	const components = await getComponents(post.content, data);
	let finalHTML = post.content;

	components.forEach(component => {
		finalHTML = finalHTML.replace(component.strToReplace, component.content);
	});

	Deno.writeTextFile('./posts/' + post.path, finalHTML);
});

async function getComponents(postContent, data) {
	return new Promise(resolve => {
		let components = [];
		
		const componentRegExp = /<(itanglo-[a-zA-Z-]+)\s*.*><\/\1>/g;
		const matches = [...postContent.matchAll(componentRegExp)];
		
		matches.forEach(async (match, matchIndex, matchArray) => {
			const [strToReplace, componentName]  = match;
			const componentFileData = await Deno.readFile(componentsDir + componentName + '.template.html');
			let componentFileContent = decoder.decode(componentFileData);

			if (data) {
				const interpolationRegExp = /{{(.+)}}/g;
				const interpolationMatches = [...componentFileContent.matchAll(interpolationRegExp)]
				
				interpolationMatches.forEach(match => {
					const [ strToReplace, key ] = match;
					const value = data[key];

					if (value) {
						componentFileContent = componentFileContent.replace(strToReplace, value);
					}
				})
			}
	
			components.push({
				name: componentName,
				content: componentFileContent,
				strToReplace
			});

			// last item in array
			if (!matchArray[matchIndex + 1]) {
				resolve(components);
			}
		});
	});
}