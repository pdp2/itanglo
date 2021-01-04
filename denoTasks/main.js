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

// Declare views
const views = [{
	name: 'index',
	srcPath: viewsDir + 'index.template.html',
	finalPath: './index.html'
}, {
	name: 'post',
	srcPath: viewsDir + 'post.template.html',
	finalPath: './posts/',
	repeatForData: posts.map(post => {
		return {post}
	})
}];

// Render views
views.forEach(async view => {
	const viewFiledata = await Deno.readFile(view.srcPath);
	const viewFileContent = decoder.decode(viewFiledata);
	const components = await getComponents(viewFileContent);
	
	if (view.repeatForData) {
		console.log('View: \n\n', view);

		view.repeatForData.forEach(dataItem => {
			let finalHtml = viewFileContent;

			components.forEach(component => {
				console.log('Component: \n\n', component);
				let componentContent = component.content;

				if (component.dataAttributes.length) {
					component.dataAttributes.forEach(attr => {
						if (dataItem[attr.value]) {
							const interpolationRegExp = /{{(.+)}}/g;
							const interpolationMatches = [...componentContent.matchAll(interpolationRegExp)]
							
							interpolationMatches.forEach(interpolationMatch => {
								const interpolationInstance = {
									stringToReplace: interpolationMatch[0],
									value: interpolationMatch[1]
								};

								const valueToInterpolate = interpolationInstance.value.split('.').reduce((acc, currentVal) => {
									return acc[currentVal];
								}, dataItem);

								componentContent = componentContent.replace(interpolationInstance.stringToReplace, valueToInterpolate);
							});
						}
					});
				}

				finalHtml = finalHtml.replace(component.stringToReplace, componentContent);
			});

			console.log('Final HTML: \n\n', finalHtml);
		});
	}
});

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