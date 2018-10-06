const { noop } = require('ramda-extension');

/**
 * Because browserSync only uses Connect and not Express or any other framework,
 * we need to gather the response body ourselves. Because `res.end` is called under the hood
 * to send the response to the client, we intercept the call and instead use `forceEnd`
 * in the SSR server middleware instead.
 */
const responseCaptureMiddleware = (req, res, next) => {
	if (req.url === '/') {
		res.useForce = true;
		res.body = '';

		res.forceWriteHead = res.writeHead;
		res.writeHead = noop;

		res.forceSetHeader = res.setHeader;
		res.setHeader = noop;

		res.forceWrite = res.write;
		res.write = noop;

		res.forceEnd = res.end;

		res.end = data => {
			if (!res.body) {
				res.body = data;
			}

			next();
		};
	}

	next();
};

module.exports = responseCaptureMiddleware;