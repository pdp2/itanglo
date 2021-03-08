/* 
* This code should be executed using Deno.
* The command to do this is deno run --allow-read --allow-write build.js
*/

console.log('Starting build task. \n');

const decoder = new TextDecoder();
// Populated when creating post files
let excerpts = [];

// Build post files
const postsFilePaths = await Deno.readDir('./src/posts');
// Get dirEntry for each file in the posts directory
for await (const dirEntry of postsFilePaths) {
	// Read file and decode
	const filePath = dirEntry.name;
	const postFile = await Deno.readFile(`./src/posts/${filePath}`);
	const postContent = decoder.decode(postFile);
	const excerpt = postContent.match(/<article>[\s\S]*<\/article>/)[0];

	excerpts.push(excerpt);

	const postOutput = await parseIncludeTags(postContent);
	const postTargetPath = `./docs/${filePath}`;
			
	Deno.writeTextFile(postTargetPath, postOutput);
	
	console.log(`Created ${postTargetPath}. \n`);
}

// Build index page
const indexFile = await Deno.readFile('./src/index.html');
const indexTargetPath = './docs/index.html';
let indexContent = decoder.decode(indexFile);
let indexOutput = await parseIncludeTags(indexContent)

indexOutput = indexOutput.replace('{{excerpts}}', excerpts.join(''));

Deno.writeTextFile(indexTargetPath, indexOutput);

console.log(`Created ${indexTargetPath}. \n`);

/**
 * Parses the content passed as the argument, checks for any include tags and replaces
 * them with the content from the include file.
 * 
 * @method parseIncludeTags
 * @param {String} content
 * @returns {Promise} resolves with the updated content
 */
async function parseIncludeTags(content) {
	return new Promise((resolve, reject) => {
		// Spread syntax converts to array because matchAll returns a RegExp String Iterator
		const includeTagMatches = [...content.matchAll(/<itanglo-include src="(.+)"><\/itanglo-include>/g)];
	
		includeTagMatches.forEach(async (match, index, array) => {
			const [includeTag, src] = match;
			
			try {
				const includeFile = await Deno.readFile(src);
				const includeContent = decoder.decode(includeFile);
		
				content = content.replace(includeTag, includeContent);
				
				// on last iteration write index file in docs folder
				if (!array[index + 1]) {
					resolve(content);
				}
			}
			catch (e) {
				console.log(error);

				reject(e);
			}
		});
	});
}
