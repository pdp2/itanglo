const decoder = new TextDecoder();
const postsSrc = './src/posts/';
const componentsDir = './src/components/';

// build index page

const indexPageFile = await Deno.readFile('./src/pages/index.html');
const indexContent = decoder.decode(indexPageFile);
const indexComponents = await getComponents(indexContent, { basePath: '../' });
let indexHtml = indexContent;

indexComponents.forEach(component => {
	indexHtml = indexHtml.replace(component.strToReplace, component.content);
});

Deno.writeTextFile('./docs/index.html', indexHtml);

// end of build index page

// build new post page

const newPostFile = await Deno.readFile('./src/pages/new-post.html');
const newPostContent = decoder.decode(newPostFile);
const newPostComponents = await getComponents(newPostContent, { basePath: '../' });
let newPostHtml = newPostContent;

newPostComponents.forEach(component => {
	newPostHtml = newPostHtml.replace(component.strToReplace, component.content);
});

Deno.writeTextFile('./docs/new-post.html', newPostHtml);

// end of build new post page

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