
# Rezzy: Zoom and Enhance for images on the web 🔎✨

Webcomic [Zoom and Enhance](https://www.youtube.com/watch?v=LhF_56SxrGk).

Sometimes the text in a web comic is a little too small to read comfortably.  
Zooming in normally makes the text blurry, so it's not much help.  

Rezzy is a browser extension that automatically enhances the resolution of images on the web,
using machine learning.

Powered by [waifu2x-converter-cpp][]

Machine learning is cool, but it's important to make it *accessible*, and get it into the hands of the masses.

**Bonus feature:** navigate any web comic with arrow keys

THIS EXTENSION IS NOT RELEASED YET

## Development Setup

- Install Git if you don't already have it.
- [Install Git Large File Storage][git lfs install] if you don't have it.
- [Clone the repo.][git clone]
- Install [Node.js][] if you don't have it, then open up a command prompt / terminal in the project directory.
- Install project dependencies with `npm install`
- In Google Chrome, type `chrome://extensions` in the address bar
- Turn on Developer mode
- Click "Load unpacked" and select the root of this repository as the folder
- Start the superresolution server with `npm start`
- Visit a webcomic, such as [Paranatural](https://www.paranatural.net/comic/chapter-1)... well, maybe that's not the best example, at the begining, but it works really well once the art gets better. [Kill Six Billion Demons](https://killsixbilliondemons.com/comic/kill-six-billion-demons-chapter-1/), [Sleepless Domain](https://www.sleeplessdomain.com/comic/chapter-1-cover)
- Check the server logs to see if it's working
- Wait for it to buffer several pages before reading

[waifu2x-converter-cpp]: https://github.com/DeadSix27/waifu2x-converter-cpp
[Node.js]: https://nodejs.org/
[git lfs install]: https://help.github.com/en/github/managing-large-files/installing-git-large-file-storage
[git clone]: https://help.github.com/articles/cloning-a-repository/
