import Ask from 'https://deno.land/x/ask/mod.ts';

const ask = new Ask();

const answers = await ask.prompt([
	{
		name: 'name',
		type: 'input',
		message: 'Please enter your name'
	},
	{
		name: 'arsenalFan',
		type: 'confirm',
		message: 'Are you an Arsenal fan?'
	}
]);

console.log(answers);