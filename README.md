
# MVP Superrez Comic Reader

Webcomic [Zoom and Enhance](https://www.youtube.com/watch?v=LhF_56SxrGk)

Built with:
- [waifu2x-converter-cpp][]
- [Electron][]
- [Electron Forge][]

The project's form factor is not set in stone.  
It's currently an incredibly lackluster web browser (based on an [electron browser example][]), but will likely become a browser extension (with a native counterpart that you have to install).

## Development Setup

- [Install Git Large File Storage][git lfs install] if you don't have it.
- [Clone the repo.][git clone]
- Install [Node.js][] if you don't have it, then open up a command prompt / terminal in the project directory.
- Install project dependencies with `npm i`
- Start the electron app with `npm start`

[electron-debug][] and [devtron][] are included, so you can use <kbd>Ctrl+R</kbd> to reload and <kbd>F12</kbd>/<kbd>Ctrl+Shift+I</kbd> to open the devtools, and there's a Devtron tab with tools specific to Electron, such as an IPC message inspector.

You can build for production with `npm run make`

[waifu2x-converter-cpp]: https://github.com/DeadSix27/waifu2x-converter-cpp
[Node.js]: https://nodejs.org/
[Electron]: https://electronjs.org/
[Electron Forge]: https://www.electronforge.io/
[electron browser example]: https://github.com/hokein/electron-sample-apps/tree/master/webview/browser
[electron-debug]: https://github.com/sindresorhus/electron-debug
[devtron]: https://electronjs.org/devtron
[git lfs install]: https://help.github.com/en/github/managing-large-files/installing-git-large-file-storage
[git clone]: https://help.github.com/articles/cloning-a-repository/
