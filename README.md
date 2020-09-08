
# Rezzy: Zoom and Enhance for images on the web 🔎✨

Webcomic [Zoom and Enhance](https://www.youtube.com/watch?v=LhF_56SxrGk).

Sometimes the text in a web comic is a little too small to read comfortably.  
Zooming in normally makes the text blurry, so it's not much help.  

Rezzy is a browser extension that automatically enhances the resolution of images on the web,
using machine learning (powered by [waifu2x-converter-cpp][]).

![](promo.png)
<p align="center"><i>Image credit: <a href="https://www.sleeplessdomain.com/comic/chapter-1-cover">Sleepless Domain</a></i></p>


Machine learning is cool, but it's important to make it *accessible*, and get it into the hands of the masses.

**Bonus feature:** navigate any web comic with arrow keys

THIS EXTENSION IS NOT RELEASED YET

## Development Setup

- Install Git if you don't already have it.
- [Install Git Large File Storage][git lfs install] if you don't have it.
- [Clone the repo.][git clone]
- Install [Node.js][] if you don't have it, then open up a command prompt / terminal in the project directory.
- Install project dependencies with `npm install`
- For **Linux** (not needed on Windows), run the following:
  ```sh
  sudo apt-get update -y
  sudo apt-get install -y libopencv-core-dev libopencv-imgcodecs-dev
  sudo ldconfig -v
  sudo ln -s "$(pwd)/waifu2x-DeadSix27-win64_v531/models_rgb/" /usr/local/share/waifu2x-converter-cpp
  ```
- Start the superresolution server with `npm start`
- For **Firefox**, run `npx web-ext run` in the project directory
  - It will open a window with the extension temporarily installed.
  - When you make changes:
    - It will automatically reload the extension.
    - Reload pages you're testing on to get the updated content script.
- For **Chrome**, type `chrome://extensions` in the address bar
  - Turn on Developer mode
  - Click "Load unpacked" and select the root of this repository as the folder
  - When you make changes:
    - Click the Reload button in the Extensions page
    - Reload pages you're testing on to get the updated content script.

## Usage
- Visit a webcomic, such as [Paranatural](https://www.paranatural.net/comic/chapter-1)... well, maybe that's not the best example, at the beginning, but it works really well once the art gets better. [Kill Six Billion Demons](https://killsixbilliondemons.com/comic/kill-six-billion-demons-chapter-1/), [Sleepless Domain](https://www.sleeplessdomain.com/comic/chapter-1-cover)
- Click on the extension icon in the browser toolbar, and click the power button in the popup to enable the extension for the current site
- (Check the server logs to see if it's working - or, if you hear your computer's cooling fans whirring into motion, it's probably working.)
- Wait for it to buffer several pages before reading

[waifu2x-converter-cpp]: https://github.com/DeadSix27/waifu2x-converter-cpp
[Node.js]: https://nodejs.org/
[git lfs install]: https://help.github.com/en/github/managing-large-files/installing-git-large-file-storage
[git clone]: https://help.github.com/articles/cloning-a-repository/
