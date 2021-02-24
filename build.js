const decoder = new TextDecoder();
const postsSrc = './src/posts/';
const componentsDir = './src/components/';

// build index page

const indexPageFile = await Deno.readFile('./src/pages/index.html');
const indexContent = decoder.decode(indexPageFile);
const indexComponents = await getComponents(indexContent, { 
	basePath: '../', 
	posts: [
		{
			title: 'Test 1',
			body: 'Body for 1.'
		},
		{
			title: 'Test 2',
			body: 'Body for 2.'
		},
		{
			title: 'Test 1',
			body: 'Body for 3.'
		}
	]
});

let indexHtml = indexContent;

indexComponents.regular.forEach(component => { 
	indexHtml = indexHtml.replace(component.strToReplace, component.content);
});

if (indexComponents.withLoop.length) {
	let loopComponentContent = '';
	// can use the first one as the string to replace should be the same for all
	let loopComponentStrToReplace = indexComponents.withLoop[0].strToReplace;
	
	indexComponents.withLoop.forEach(component => {
		loopComponentContent += component.content;
	});
	
	indexHtml = indexHtml.replace(loopComponentStrToReplace, loopComponentContent);
}

Deno.writeTextFile('./docs/index.html', indexHtml);

// end of build index page

// build new post page

const newPostFile = await Deno.readFile('./src/pages/new-post.html');
const newPostContent = decoder.decode(newPostFile);
const newPostComponents = await getComponents(newPostContent, { basePath: '../' });
let newPostHtml = newPostContent;

newPostComponents.regular.forEach(component => {
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

	components.regular.forEach(component => {
		finalHTML = finalHTML.replace(component.strToReplace, component.content);
	});

	Deno.writeTextFile('./posts/' + post.path, finalHTML);
});

async function getComponents(postContent, data) {
	return new Promise(resolve => {
		let components = {
			regular: [],
			withLoop: []
		};
		
		const componentRegExp = /<(itanglo-[a-zA-Z-]+)\s*.*><\/\1>/g;
		const componentMatches = [...postContent.matchAll(componentRegExp)];
		
		componentMatches.forEach(async (match, matchIndex, matchArray) => {
			const [strToReplace, componentName] = match;
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
				});
			}

			const loopRegExp = /data-for="([a-zA-Z0-9]+)\sin\s([a-zA-Z0-9]+)"/;
			const loopMatch = strToReplace.match(loopRegExp);
				
			if (loopMatch) {
				const [ ,,dataKey ] = loopMatch;
				const loopData = data[dataKey]

				loopData.forEach(item => {
					let loopComponentFileContent = componentFileContent;
					const interpolationRegExp = /{{(.+)}}/g;
					const interpolationMatches = [...loopComponentFileContent.matchAll(interpolationRegExp)]
					
					interpolationMatches.forEach(match => {
						const [ strToReplace, key ] = match;
						const value = item[key];

						if (value) {
							loopComponentFileContent = loopComponentFileContent.replace(strToReplace, value);
						}
					});

					components.withLoop.push({
						name: componentName,
						content: loopComponentFileContent,
						strToReplace
					});
				});

			}
			else {
				components.regular.push({
					name: componentName,
					content: componentFileContent,
					strToReplace
				});
			}
	
			// last item in array
			if (!matchArray[matchIndex + 1]) {
				resolve(components);
			}
		});
	});
}