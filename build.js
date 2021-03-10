/* 
* This code should be executed using Deno.
* The command to do this is deno run --allow-read --allow-write build.js
*/

console.log('Starting build task. \n');

const decoder = new TextDecoder();
// Populated when creating post files
let excerpts = [];
// Cache include to avoid reading file again
let cachedIncludes = [];

// Build post files
const postsFilePaths = await Deno.readDir('./src/posts');
// Get dirEntry for each file in the posts directory
for await (const dirEntry of postsFilePaths) {
	// Read file and decode
	const fileName = dirEntry.name;
	const postFile = await Deno.readFile(`./src/posts/${fileName}`);
	const postContent = decoder.decode(postFile);
	const excerpt = postContent.match(/<article>[\s\S]*<\/article>/)[0];

	excerpts.push(excerpt);

	const postOutput = await parseIncludeTags(postContent);
	// Regex below removes number prefix from file
	const postTargetPath = `./docs/${fileName.replace(/^\d+-/, '')}`;
			
	await Deno.writeTextFile(postTargetPath, postOutput);
	
	console.log(`Created ${postTargetPath}. \n`);
}

// Build index page
const indexFile = await Deno.readFile('./src/index.html');
const indexTargetPath = './docs/index.html';
let indexContent = decoder.decode(indexFile);
let indexOutput = await parseIncludeTags(indexContent)

// Sort excerpts so that most recent post appears on top
excerpts = excerpts.reverse();

indexOutput = indexOutput.replace('{{excerpts}}', excerpts.join(''));

await Deno.writeTextFile(indexTargetPath, indexOutput);

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
	return new Promise(async (resolve) => {
		// Spread syntax converts to array because matchAll returns a RegExp String Iterator
		const includeTagMatches = [...content.matchAll(/<itanglo-include src="(.+)"><\/itanglo-include>/g)];
		
		for (const match of includeTagMatches) {
			const [includeTag, src] = match;
			const cachedInclude = cachedIncludes.find(include => include.src === src);
			let includeContent;

			if (cachedInclude) {
				console.log(`Getting include: ${cachedInclude.src} from include cache. \n`);
				
				includeContent = cachedInclude.includeContent;
			}
			else {
				console.log(`Reading include: ${src} from file. \n`);
				
				const includeFile = await Deno.readFile(src);
				
				includeContent = decoder.decode(includeFile);
				cachedIncludes.push({	src, includeContent });
			}

			content = content.replace(includeTag, includeContent);
		}

		resolve(content);
	});
}
