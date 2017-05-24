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

1. When network width is smaller than network height, tooltip positioning is bad.
2. Make hover state on selected node element to look more like on design.
3. Arrows


##Attack Paths

Red Arrows, bolder and with a Number.


An attack path arrow is created when we get 'assetCompromised' event for a node.

But, the asset compromised event does NOT have a source, so it alone cannot be used to draw an arrow.

We need to assume that sometime before we got the 'assetCompromised' event, we already got a 'markNodeAsRed'. 
So an arrow already exists due to the 'markNodeAsRed' but it is not bold and does not have a Number.

The 'assetCompromised' event causes the arrow to become bold and the number to appear.

The number is simply the index (+1) of the 'assetCompromised' event in the list of 'assetCompromised's.


Also, attack arrows has on-hover tooltip. Note that other arrows do not have tooltip.


