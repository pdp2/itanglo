/* 
* This code should be executed using Deno.
* The command to do this is deno run --allow-read --allow-write build.js
*/

const decoder = new TextDecoder();
// Cache include to avoid reading file again
let cachedIncludes = [];
let cachedCssFiles = [];

// TO DO: Pass argument to indicate env i.e. dev/prod
export default async function build() {
    // Populated when creating post files
    let excerpts = [];

    console.log('Starting build task. \n');

    // Build post files
    const postsFilePaths = await Deno.readDir('./src/posts');
    // Get dirEntry for each file in the posts directory
    for await (const dirEntry of postsFilePaths) {
        // Read file and decode
        const fileName = dirEntry.name;
        const postFile = await Deno.readFile(`./src/posts/${fileName}`);
        const postContent = decoder.decode(postFile);
        const excerptContent = postContent.match(/<article\s?\S+>[\s\S]*<\/article>/)[0];
        const excerptDate = postContent.match(/data-article-date="(\S+)"/)[1];

        excerpts.push({
            excerptDate,
            excerptContent
        });

        const postOutput = await parseIncludeTags(postContent);
        // Regex below removes number prefix from file
        const postTargetPath = `./docs/${fileName.replace(/^\d+-/, '')}`;
                
        await Deno.writeTextFile(postTargetPath, postOutput);
        
        console.log(`Created ${postTargetPath}. \n`);
    }

    // Build index page
    const indexFile = await Deno.readFile('./src/index.html');
    const indexTargetPath = './docs/index.html';
    const indexContent = decoder.decode(indexFile);
    let indexOutput = await parseIncludeTags(indexContent);

    // Sort excerpts so that most recent post appears on top
    excerpts.sort((a, b) => {
        const aTime = new Date(a.excerptDate).getTime();
        const bTime = new Date(b.excerptDate).getTime();

        if (aTime < bTime) {
            return 1; // sort b before a
        }

        if (aTime > bTime) {
            return -1; // leave a and b unchanged
        }

        // a and b are the same
        return 0;
    });
    // it is necessary to map the excerpts so the array contains only 
    // content strings because the join method is used in a few lines
    excerpts = excerpts.map(excerpt => excerpt.excerptContent);

    indexOutput = indexOutput.replace('{{excerpts}}', excerpts.join(''));

    await Deno.writeTextFile(indexTargetPath, indexOutput);

    console.log(`Created ${indexTargetPath}. \n`);

    // Build about page
    const aboutFile = await Deno.readFile('./src/about.html');
    const aboutTargetPath = './docs/about.html';
    const aboutContent = decoder.decode(aboutFile);
    let aboutOutput = await parseIncludeTags(aboutContent);

    await Deno.writeTextFile(aboutTargetPath, aboutOutput);

    console.log(`Created ${aboutTargetPath}. \n`);

    // Build CSS Styles
    const mainCssTargetPath = './docs/main.css';
    const mainCssFile = await Deno.readFile('./src/styles/main.css');
    const mainCssContent = decoder.decode(mainCssFile);
    const mainCssOutput = await parseCssImports(mainCssContent);

    await Deno.writeTextFile(mainCssTargetPath, mainCssOutput);

    console.log(`Created ${mainCssTargetPath}. \n`);
}

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
                console.log(`Getting include: ${cachedInclude.src} from cache. \n`);
                
                includeContent = cachedInclude.includeContent;
            }
            else {
                console.log(`Reading include: ${src} from file. \n`);
                
                const includeFile = await Deno.readFile(src);
                
                includeContent = decoder.decode(includeFile);
                cachedIncludes.push({ src, includeContent });
            }

            content = content.replace(includeTag, includeContent);
        }

        resolve(content);
    });
}

/**
 * Parses the content passed as the argument, checks for any CSS imports and replaces
 * them with the content from the file.
 * 
 * @method parseCssImports
 * @param {String} content
 * @returns {Promise} resolves with the updated content
 */
async function parseCssImports(content) {
    return new Promise(async (resolve) => {
        // Spread syntax converts to array because matchAll returns a RegExp String Iterator
        const importMatches = [...content.matchAll(/@import\s+'(\S+)';/g)];
        
        for (const match of importMatches) {
            const [importStatement, path] = match;
            const src = `./src/styles/${path}`;
            const cachedCssFile = cachedCssFiles.find(cssFile => cssFile.src === src);
            let cssFileContent;

            if (cachedCssFile) {
                console.log(`Getting import: ${cachedCssFile.src} from cache. \n`);
                
                cssFileContent = cachedCssFile.cssFileContent;
            }
            else {
                console.log(`Reading import: ${src} from file. \n`);
                
                const cssFile = await Deno.readFile(src);
                
                cssFileContent = decoder.decode(cssFile);
                cachedCssFiles.push({ src, cssFileContent });
            }

            content = content.replace(importStatement, cssFileContent);
        }

        resolve(content);
    });
}
