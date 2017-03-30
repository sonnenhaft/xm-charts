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

1. Add x scale value (days years) in right bottom corner.
2. Rotate toggle button after toggling
3. Create and add 4 new buttons for playing.
4. Create zoom indicator.
5. Create time indicator.

After new req, apply actions for 2 left buttons:
1. Create circles with: triangle and circle, weird circle, triangle.
2. For button with shield apply switch to data instead of time
3. For second button apply unknown action.
