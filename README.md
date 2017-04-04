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

1. Add jump to exact time.
2. Add play functionality.
3. Add x scale value (days years) in right bottom corner.

Questions: 
1. What are doing circles with triangles and squares inside, when to display them?
2. Where can I find custom button icons? May be you can share me the designs tool?
3. What is the logic of switching data from % to gigabytes (shield button)?
4. What triangle below toggle button is doing?
5. What triangle near circle near gigabytes is doing?

