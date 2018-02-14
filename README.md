# Ideas for a Comic Reader

This isn't an app, just a collection of features that I'd want in a comic reader app.

### Web Comics AND Archive Files

Dynamically download web comics so you can read them offline.

Can also support comic book archive formats like `.cbr` and `.cbz`; that's much simpler to do.

It would preload pages of course.


### Super-Resolution

Normally you don't want to zoom in because it introduces blurriness and aliasing artifacts.
It can be hard to read text when it's too small, but zoomed in it's hard because of the blurriness!
And maybe web comics never look good on your fancy high DPI display.

With waifu2x (or similar technologies), pages can be enlarged intelligently. Intuitively.
(Using intuitive assumptions about the content. *An algorithm learns the ropes of the tropes of the ebbs and the flows of the lines.* It's pretty dope. It's pretty fine.)

Could use the [waifu2x-caffe](https://github.com/lltcggie/waifu2x-caffe) CLI.

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


### Other Feature Notes

* Could implement things modularly / as a pipeline so you could optionally just
super-rez-enhance existing comic book archives, or
convert web comics into offline super-rez'd comic book archives,
for use in a different reader app

* Would it be an RSS reader as well?
I was thinking it would just crawl the web pages,
maybe use clues like meta tags but mostly look for clearly labeled Next buttons etc.

* Would it be a browser? Could you favorite things?
I don't like scope creep, but it would be useful to be able to share a comic by the URL,
or to open the folder a comic book archive is in.
So maybe it could have an address bar? 😟
(Or just a menu option like Share / Open Containing Folder depending on what type it is?)
You'd also want to be able to jump to a page by the URL.

* It should definitely save your place automatically.
And you wouldn't want to lose it by simply navigating to some other place
(maybe to show someone a page that was particularly funny or interestingly designed)
so it could afford to be a bit smart about it (in some way).
(It could store just one bookmark and the current page you're viewing if it's earlier than that,
but what if someone tells you about a funny later page? or what if you accidentally hit the go-to-end/latest button?
It should probably also work then, right? I don't know how this should work.)

* Splitting pages up by frames could be useful for reading on mobile devices like phones and ereaders,
but it couldn't handle all page layouts (like, creative ones! y'know?),
and if it did them in the wrong order that would be confusing
and you might not be able to tell what happened.
(Although there are some interesting algorithms for detecting rectangles/quadrilaterals and such.
And you could probably check if a threshold of area of the image is covered by detected rectangles
and display the whole image (by default; it would be good to be able to override it) when not enough is covered.)

## Previous Work ("prior art")

For elementary OS:
* [This mockup by Daniel Foré for an XKCD-specific app](https://danrabbit.deviantart.com/art/XKCD-App-332444858) (2012)
* [xkcdV](https://launchpad.net/xkcdv) (2012)
* [eComics](https://github.com/Digi59404/eComics) (2013 (with a branch from 2015?))
* [Bookworm](https://babluboy.github.io/bookworm/) (active development; says it supports `.cbr` and `.cbz`)

For Linux in general, or other platforms, there are lots of options.

[SimpleComic](http://dancingtortoise.com/simplecomic/) looks nice for Mac.

I haven't tried any of these things out yet.

## Future Work (where should it happen?)

Comic book archive support could be added to the existing GUI for waifu2x-caffe.
All the options for configuring the algorithm are already there,
it would just be a matter of adding source and destination options.

Extracting web comics into offline archive files could be a separate tool,
and then RSS features for keeping those files up to date (and you up to date on the comics) could make more sense.

The navigation features would obviously have to be in a comic reader app,
but it doesn't have to be a *new* one. No need to reinvent the wheel here.

⁂

That said, having all this integrated into a comic reader could be really nice.
You don't want to have to think about all these different tools.
And the different tools might *all* have to support *streaming comic book archive files* for them to work nicely together,
that is, without agregious wait times.
And that's not an established thing... of value... like, probably no app has ever supported that.
So not being able to do it in a streaming fasion (super-rez-ing while preloading pages) for arbitrary reader apps
might make the splitting up / modularity less useful.

