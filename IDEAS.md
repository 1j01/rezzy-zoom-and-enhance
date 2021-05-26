# Ideas for a Comic Reader

These are not planned features or to-dos.
This is not a roadmap.

This is a collection of notes on what I'd like to see in a comic reader.


### Web Comics AND Archive Files

Dynamically download web comics so you can read them offline.

Can also support comic book archive formats like `.cbr` and `.cbz`; that's much simpler to do.

It would preload pages of course, like any good photo viewer.


### Super-Resolution

Sometimes the text in a comic is too small, and it'd be nice to zoom in, but then everything becomes blurry. But that's because simple upscaling algorithms are used. It doesn't have to be that way.

Super-Resolution is a technique that uses neural networks to intelligently upscale content. There are networks already trained on thousands of comics, and they work great.


### Consistent Navigation

Web comics are terrible about this.
There are some basic agreed-upon conventions like clicking on the image to go to the next page,
but that's not always implemented, and even when it is, sometimes it's not consistent *within a comic* because the author is having to manually link it every time.
And obvious things like arrow keys are rarely implemented.

* Left and right arrow keys (obviously)
* Probably some big ol' buttons
* Sit back with a wireless mouse under a comfy blanket and use the right/left buttons to go forwards and back (and scroll up and down with mousewheel)
* Or ditto but with a gamepad
* Or ditto but with your phone

Adding *gamepad support* to any given webcomic would be objectively a waste of time (unless it includes game elements, as some sort of hybrid media), but adding it as a mode of navigation for *all comics* is a much more reasonable proposition.

See also: [Input Control](https://github.com/multiism/input-control)


### Other Feature Notes

* Could implement things modularly / as a pipeline so you could optionally just
super-rez-enhance existing comic book archives, or
convert web comics into offline super-rez'd comic book archives,
for use in a different reader app

* Would it be an RSS reader as well?
I was thinking it would just crawl the web pages,
maybe use clues like meta tags but mostly look for clearly labeled Next buttons etc.

* It should save your place automatically.
(And you shouldn't lose it by simply navigating someplace else, so 1. you should be able to go back, which implies a browser like experience (with either a browser extension or specialized browser), and 2. it should be clear to the user how the address is being saved automatically)

* Splitting pages up by frames could be useful for reading on mobile devices like phones and e-readers,
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

[This article](https://www.howtogeek.com/66060/how-to-read-webcomics-offline-in-comic-book-reader-format/)
describes how to convert webcomics to archives,
but only for webcomics that *happen* to name all the images consistently,
with a number being the only differing part between the file names.

## Project Scope

I don't know!

Browser extension?  
Plugin(s) to comic reading app(s)?  
App?  
Browser?  


Comic book archive support *could* be added to the existing GUI for waifu2x-caffe.
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
that is, without egregious wait times.
And that's not an established thing... of value... like, probably no app has ever supported that.
So not being able to do it in a streaming fashion (super-rez-ing while preloading pages) for arbitrary reader apps
might make the splitting up / modularity less useful.


