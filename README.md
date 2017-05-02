# Frontend readme

## Demo [dev branch]

http://xm-charts.bitballoon.com pwd: 444444

## Demo with "big brush"
http://xm-charts-small-brush.bitballoon.com pwd: 444444

## Prerequisites

* node >= 7
* [yarn](https://yarnpkg.com/en/docs/install) installed globally
* port 8087 available on your machine

### Frontend server (dev)

The frontend server is a webpack dev server that serves compiled files from memory.

```
>  yarn start 
```
This should start the server on port 8085 with webpack monitor
```
>  yarn dev 
```
This should start the server on port 8087.


### TODO List:

0. Make hover state on selected node element to look more like on design.
1. Update move on zoomed network grid - now broken if zoomed - move overs too early
2. Network should appear in the center of the page.
3. We have custom logic for icons - when they are sliver and when not.
