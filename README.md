# svg2p5

## Simple tool for converting SVG to p5.js code

# WORK IN PROGRESS!!!

Currently it can convert:

- Circle to Ellipse
- Rect to Rect
- Line to Line
- Polygon to Shape (CLOSED)
- Polyline to Shape (OPEN)
- Path to shape [M,L,C,S,Z,H,V]

No support:

- Linear Gradient (SVG gradients work between two points, p5.js doesn't offer this function)

Styles that work:

- Fill/noFill
- Stroke/noStroke
- StrokeWeight
- StrokeCap (Square/Round)
- Alpha/Opacity on fill

## Demo

Live demo available [here](https://svg2p5js.wwstwd.studio/).
