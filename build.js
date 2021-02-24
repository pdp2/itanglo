/* 
* This code should be executed using Deno.
* The command to do this is deno run --allow-read --allow-write build.js
*/
const decoder = new TextDecoder();
// read index file
const indexFile = await Deno.readFile('./src/index.html');
let indexContent = decoder.decode(indexFile);
// get includes and save in array
// Spread syntax converts to array because matchAll returns a RegExp String Iterator
const includeTagMatches = [...indexContent.matchAll(/<itanglo-include src="(.+)"><\/itanglo-include>/g)];
// loop through includes
includeTagMatches.forEach(async (match, index, array) => {
	// for each include read src attribute
	const [includeTag, src] = match;
	// read file using src attribute value
	const includeFile = await Deno.readFile(src);
	const includeContent = decoder.decode(includeFile);
	// replace include tag with file
	indexContent.replace(includeTag, includeContent);
	// on last iteration write index file in docs folder
	if (!array[index + 1]) {
		Deno.writeFile('./docs/index.html', indexContent);
	}
});

