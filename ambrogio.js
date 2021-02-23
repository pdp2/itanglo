import { serve } from 'https://deno.land/std@0.87.0/http/server.ts';

let routes = {};

export default {
	async listen(port) {
		const server = serve({ port });

		console.log(`Ambrogio says: Listening on ${port} \n`);

		for await (const req of server) {
			const { method, url: path } = req;

			console.log(`Ambrogio says: ${new Date().toGMTString()} ${method} ${path} \n`);

			const route = this.getRoute(method, path)

			if (route){
				if (typeof route.handler === 'function') {
					route.handler(req);
				}
				else {
					req.respond({
						status: 500,
						body: 'A handler function has not been set for this route.'
					});
				}
			}
			else {
				try {
					const fileData = await Deno.readFile(`.${path}`);
					const headers = new Headers();

					if (path.indexOf('.css') > 1) {
						headers.append('Content-Type', 'text/css; charset=utf-8')
					}

					if (path.indexOf('.js') > -1) {
						headers.append('Content-Type', 'application/javascript');
					}
	
					req.respond({ 
						status: 200,
						headers,
						body: fileData 
					});
				}
				catch (e) {
					console.log(e, '\n');

					if (e.name.indexOf('NotFound') > -1) {
						req.respond({
							status: 404,
							body: 'Sorry, couldn\'t find that file.'
						});
					}
					else {
						req.respond({
							status: 500,
							body: 'Sorry, something went wrong.'
						});
					}
				}
			}
		}
	},
	get(path, handler) {
		if (!routes.get) {
			routes.get = [];
		}

		routes.get.push({
			path,
			handler
		});
	},
	post(path, handler) {
		if (!routes.post) {
			routes.post = [];
		}

		routes.post.push({
			path,
			handler
		})
	},
	getRoute(method, path) {
		method = method.toLowerCase();

		if (routes[method]) {
			return routes[method].find(route => route.path === path);
		}
		else {
			return null;
		}
	}
};