# How to access Web Extensions API (browser.*) in an ES Module?

I'm trying to upgrade my Web Extension to Manifest V3, and using ES Modules for the background script (now a Service Worker) for code sharing, like so:
```json
{
	"manifest_version": 3,
	"background": {
		"service_worker": "src/background.js",
		"type": "module"
	},
	...
}
```
But now I get an error:
```
Uncaught ReferenceError: browser is not defined
```
`browser` is the namespace for all the Web Extension APIs, so how can I access this? Is there something I need to import instead?

Maybe I'm relying on the [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) and Chrome doesn't provide `browser` at all. Is there a way to use webextension-polyfill from within an ES Module? Or is the polyfill not doing much anymore and I should just do `const browser = globalThis.browser || globalThis.chrome`?