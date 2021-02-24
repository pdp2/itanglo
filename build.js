/* 
* This code should be executed using Deno.
* The command to do this is deno run --allow-read --allow-write build.js
*/

console.log('Starting build task. \n');

const decoder = new TextDecoder();
const indexFile = await Deno.readFile('./src/index.html');
let indexContent = decoder.decode(indexFile);
// Spread syntax converts to array because matchAll returns a RegExp String Iterator
const includeTagMatches = [...indexContent.matchAll(/<itanglo-include src="(.+)"><\/itanglo-include>/g)];

includeTagMatches.forEach(async (match, index, array) => {
	const [includeTag, src] = match;
	const includeFile = await Deno.readFile(src);
	const includeContent = decoder.decode(includeFile);

	indexContent = indexContent.replace(includeTag, includeContent);
	
	// on last iteration write index file in docs folder
	if (!array[index + 1]) {
		const indexTargetPath = './docs/index.html';
		
		Deno.writeTextFile(indexTargetPath, indexContent);
		
		console.log(`Created ${indexTargetPath}. \n`);
	}
});