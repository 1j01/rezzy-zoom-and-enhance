<!-- # Super Comics -->
<!-- # SuperComics -->
<!-- # Project Super -->
<!-- # Super-Evolution -->
<!-- 
Mango
Probably taken
Well there's a publishing company and an Android app manga reader
http://mango.leetsoft.net

Mangomics
That's a weird name
Definitely not taken
Well...
Well there's some*one* who's taken the name, but no comic reader called that for sure
(Well unless you count that person; they probably read comics 'ha,ha')
-->
# Comic Reader

An idea for a desktop comic reader app.
For both web comics AND archive files.

Basically there's just two killer features that it needs:


### Super-Resolution

Normally you don't want to zoom in because it introduces blurriness and aliasing artifacts.
It can be hard to read text when it's too small, but zoomed in it's hard because of the blurriness!
And maybe web comics never look good on your fancy high DPI display.

With waifu2x (or similar technologies), pages can be enlarged intelligently. Intuitively.
(Using intuitive assumptions about the content. *An algorithm learns the ropes of the tropes of the ebbs and the flows of the lines.* It's pretty dope. It's pretty fine.)

We can use the [waifu2x-caffe](https://github.com/lltcggie/waifu2x-caffe) CLI.

Zoom and enhance, baby.


### Consistent Navigation

Web comics are terrible about this.
There are some basic agreed-upon conventions like clicking on the image to go to the next page,
but that's not always implemented, and even when it is, sometimes it's not consistent *within a comic* because the author is having to manually link it every time.
And obvious things like arrow keys are rarely implemented.

* Left and right arrow keys (obviously)
* Probably some big ol' buttons
* Sit back with a wireless mouse under a comfy blanket and use the buttons to go forwards and back (and scroll up and down)
* Or ditto but with a gamepad
* Or ditto but with your phone

<!--
There's also the possibility of special navigation controls that it would basically not make sense of one webcomic to implement,
like using a mouse, especially a wireless one under a really comfy blanket, as a sort of slideshow presentation remote, using the mouse buttons to go forwards and back
Also could support actual presentation remotes if that's really something a lot of people have access to (at home or where they're reading comics)
Or allow using your phone as a remote!
-->

<!-- ### Web Comics AND Archive Files -->
<!-- 
* Web comics!
* Also formats like `.cbr` and `.cbz`
* Preload pages
-->


### Other Feature Notes

Preloading and offline support.
That's maybe a third killer feature, just that it could transform webcomics into offline comics.maybe that could be implemented separately so it could be used with other clients (with standard comic book archive formats)

<!--
Also can support reading existing/traditional/offline comic book formats (.cbr file, .cbz, .pdf, etc..) 
Like I said above somewhere I think, it could be generating a cbr or cbz as a temporary it optionally separate step which you could use with another reader program
It could also transform existing files into higher resolution archives for the superresolution step
Maybe it should be some kind of streaming
Some kind of modular system of transforms, a bit? Just for the one or two things?
Just as a sane way of handling inputs and outputs so it can be extended in the future, that is, *find* some sane way
-->

* Could implement things modularly / as a pipeline so you could instead use it to just
super-resolution enhance comic book archives, or
super-resolution enhance web comics into comic book archives,
for use in a different reader app

* Would this be an RSS reader as well?
I was thinking it would just crawl the web pages,
maybe use clues like meta tags but mostly look for clearly labeled Next buttons etc.

* Would it be a browser? Could you favorite things?
I don't want scope creep, but it would be useful to be able to share a comic by the URL,
or to open the folder a comic book archive is in.
So maybe it could have an address bar? 😟
(Or just a menu option like Share / Open Containing Folder depending on what type it is?)
You'd also want to be able to jump to a page by the URL.

<!--
Also could support interactive XKCDs and maybe even superrez them
Like, transform the images on request, ha! Like intercept HTTP to
Hm but HTTPS, does that matter? I don't think so if it's done with like a 'browser extension' type/level of API (nw has chrome APIs, dunno what electron might have in that department ...or WebKitWebView)
-->

* Definitely save your place automatically.
And you wouldn't want to lose it by simply navigating to some other place
(for instance to show someone a page that was particularly funny or interestingly designed)
so it could afford to be a bit smart about it in some way.
(It could store just one bookmark and the current page you're viewing if it's earlier than that,
but what if someone tells you about a funny later page? or what if you accidentally hit the go-to-end/latest button?
It should probably also work then, right? I don't know how this should work.)

* Splitting pages up by frames could be useful for reading on mobile devices like phones and ereaders,
but it couldn't handle all formats, and if it did them in the wrong order that would be confusing
and you might not be able to tell what happened.
(Although there are some interesting algorithms for this sort of thing, detecting rectangles/quadrilaterals and scuh.
And you could probably check if a threshold of area of the image is covered by detected rectangles
and display the whole image (by default, I suppose, I suppose you should be able to override it) when not enough is covered)

## Previous Work ("Prior Art")

For elementary OS:
* [This mockup by Daniel Foré for an XKCD-specific app](https://danrabbit.deviantart.com/art/XKCD-App-332444858) (2012)
* [xkcdV](https://launchpad.net/xkcdv) (2012)
* [eComics](https://github.com/Digi59404/eComics) (2013 (with a branch from 2015?))
* [Bookworm](https://babluboy.github.io/bookworm/) (active development; says it supports `.cbr` and `.cbz`)

For Linux in general, or other platforms, there are lots of options.

[SimpleComic](http://dancingtortoise.com/simplecomic/) looks nice for Mac.

I haven't tried any of these things out yet.

## This is just an idea

This is currently just an idea (or a set of ideas), and the solution doesn't necessarily need to be an app.
You should never presume that an app is the solution.
These features could be added to an existing app,
and the super-resolution feature could be a separate tool or added to the existing GUI for waifu2x-caffe
(comic book archive support that is; it obviously supports super-resolution given that that's what it is).
I know the start of this readme says that it's an app and basically presumes that it should be an app,
but... I'll update that later.
