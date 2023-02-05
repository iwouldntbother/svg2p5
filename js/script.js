let svgInput = document.querySelector('#svgInput').value;
let p5Output = document.querySelector('#p5Output');

document.querySelector('#convertBTN').addEventListener('click', () => {
  svg2p5();
});

document.querySelector('#svgInput').addEventListener('input', (e) => {
  document.querySelector('#hiddenTempDiv').innerHTML = e.target.value;
  let svgCont = document.getElementById('svgCont');
  svgCont.innerHTML = e.target.value;
});

const hasChildren = (el) => {
  if (el.childElementCount > 0) {
    return true;
  } else {
    return false;
  }
};

let childrenGlobal = [];
let allStyles;
let styleClassList = [];

const convertStyle = () => {
  let currentStyles = [];
  let convertedStyles = [];

  for (let i = 0; i < allStyles.sheet.rules.length; i++) {
    currentStyles[i] = [];
    convertedStyles[i] = '';
    styleClassList[i] = allStyles.sheet.rules[i].selectorText;
    if (!allStyles.sheet.rules[i].cssText.includes('stroke')) {
      convertedStyles[i] += 'noStroke()\n';
    }

    let opacityValue;
    if (allStyles.sheet.rules[i].cssText.includes('opacity')) {
      opacityValue = allStyles.sheet.rules[i].style['opacity'];
    }

    for (let j = 0; j < allStyles.sheet.rules[i].style.length; j++) {
      currentStyles[i][j] = { name: '', value: '' };
      currentStyles[i][j].name = allStyles.sheet.rules[i].style[j];
      currentStyles[i][j].value =
        allStyles.sheet.rules[i].style[allStyles.sheet.rules[i].style[j]];

      let name = allStyles.sheet.rules[i].style[j];
      let value =
        allStyles.sheet.rules[i].style[allStyles.sheet.rules[i].style[j]];

      switch (name) {
        case 'fill':
          if (value === 'none') {
            convertedStyles[i] += 'noFill()\n';
          } else if (opacityValue) {
            convertedStyles[i] += `fill('rgba(${value
              .replace('rgb(', '')
              .replace(')', '')},${opacityValue})')\n`;
          } else {
            convertedStyles[i] += `fill(${value
              .replace('rgb(', '')
              .replace(')', '')})\n`;
          }
          break;
        case 'stroke':
          value === 'none'
            ? (convertedStyles[i] += 'noStroke()\n')
            : (convertedStyles[i] +=
                'stroke(' + value.replace('rgb(', '').replace(')', '') + ')\n');
          break;
        case 'stroke-width':
          convertedStyles[i] += 'strokeWeight(' + value + ')\n';
          break;
        case 'stroke-linecap':
          value === 'round'
            ? (convertedStyles[i] += 'strokeCap(ROUND)\n')
            : 'strokeCap(SQUARE)\n';
          break;
        default:
          break;
      }
    }
  }
  // console.log(convertedStyles);
  return convertedStyles;
};

const getChildren = (el) => {
  if (hasChildren(el)) {
    for (let i = 0; i < el.childElementCount; i++) {
      if (el.children[i].localName === 'style') {
        allStyles = el.children[i];
        continue;
      }
      childrenGlobal.push(el.children[i]);
      getChildren(el.children[i]);
    }
  }
};

const convertPath = (data) => {
  let d = data.attributes.d.value;
  // Convert path to absolute values
  let relD = Snap.path.toAbsolute(d);
  let shapeString = 'beginShape()\n';

  // Pre format data for certain points
  for (let i = 0; i < relD.length; i++) {
    if (relD[i][0] === 'V') {
      relD[i][2] = relD[i][1];
      relD[i][1] = relD[i - 1][relD[i - 1].length - 2];
    } else if (relD[i][0] === 'H') {
      relD[i][2] = relD[i - 1][relD[i - 1].length - 1];
    } else if (relD[i][0] === 'S') {
      relD[i][6] = relD[i][4];
      relD[i][5] = relD[i][3];
      relD[i][4] = relD[i][2];
      relD[i][3] = relD[i][1];
      relD[i][1] = 2 * relD[i - 1][5] - relD[i - 1][3];
      relD[i][2] = 2 * relD[i - 1][6] - relD[i - 1][4];
    }
  }

  // Convert each svg path type to p5 vertices
  for (let i = 0; i < relD.length; i++) {
    switch (relD[i][0]) {
      case 'M':
        shapeString += `vertex(${relD[i][1]},${relD[i][2]})\n`;
        break;
      case 'L':
        shapeString += `vertex(${relD[i][1]},${relD[i][2]})\n`;
        break;
      case 'C':
        shapeString += `bezierVertex(${relD[i][1]},${relD[i][2]},${relD[i][3]},${relD[i][4]},${relD[i][5]},${relD[i][6]})\n`;
        break;
      case 'S':
        shapeString += `bezierVertex(
        ${relD[i][1]},
        ${relD[i][2]},
        ${relD[i][3]},
        ${relD[i][4]},
        ${relD[i][5]},
        ${relD[i][6]})\n`;
        break;
      case 'H':
        shapeString += `vertex(${relD[i][1]},${relD[i][2]})\n`;
        break;
      case 'V':
        shapeString += `vertex(${relD[i][1]},${relD[i][2]})\n`;
        break;
      case 'Z':
        shapeString += 'endShape(CLOSE)\n';
        break;
      default:
        break;
    }
  }
  // End shape without close if 'Z' svg tag isn't present
  if (shapeString.includes('endShape')) {
    return shapeString;
  } else {
    return (shapeString += 'endShape()\n');
  }
};

const convertLine = (data) => {
  let x1 = data.attributes.x1.value;
  let y1 = data.attributes.y1.value;
  let x2 = data.attributes.x2.value;
  let y2 = data.attributes.y2.value;

  return 'line(' + x1 + ', ' + y1 + ', ' + x2 + ', ' + y2 + ')\n';
};

const convertPolygon = (data) => {
  let points = data.attributes.points.value.split(' \t')[0];
  points = points.split(' ');

  let vertices = '';
  points.forEach((point) => {
    vertices += 'vertex(' + point + ')\n';
  });

  return 'beginShape()\n' + vertices + 'endShape(CLOSE)\n';
};

const convertPolyline = (data) => {
  let points = data.attributes.points.value.split(' \t')[0];
  points = points.split(' ');

  let vertices = '';
  points.forEach((point) => {
    vertices += 'vertex(' + point + ')\n';
  });

  return 'beginShape()\n' + vertices + 'endShape()\n';
};

const convertRect = (data) => {
  let x = data.attributes.x.value;
  let y = data.attributes.y.value;
  let w = data.attributes.width.value;
  let h = data.attributes.height.value;

  return 'rect(' + x + ', ' + y + ', ' + w + ', ' + h + ')\n';
};

const convertCircle = (data) => {
  let x = data.attributes.cx.value;
  let y = data.attributes.cy.value;
  let r = data.attributes.r.value * 2;

  return 'ellipse(' + x + ', ' + y + ', ' + r + ')\n';
};

const svg2p5 = () => {
  let parentEl = document.getElementById('hiddenTempDiv');

  childrenGlobal = [];
  getChildren(parentEl);

  let toRemove = [];
  for (let i = 0; i < childrenGlobal.length; i++) {
    if (
      childrenGlobal[i].localName === 'svg' ||
      childrenGlobal[i].nodeName === 'g'
    ) {
      // childrenGlobal.splice(i, 1);
      toRemove.push(i);
    }
  }

  // console.log(toRemove);

  for (let i = 0; i < toRemove.length; i++) {
    childrenGlobal.splice(toRemove[i] - i, 1);
  }

  // console.log(childrenGlobal);
  // console.log(allStyles.sheet.rules);

  let currentStyleList = convertStyle();

  console.log(currentStyleList);
  console.log(styleClassList);

  let convertedp5Data = '';

  for (let i = 0; i < childrenGlobal.length; i++) {
    // console.log(childrenGlobal[i].classList[0]);
    convertedp5Data += 'push()\n';
    if (childrenGlobal[i].classList[0]) {
      convertedp5Data +=
        currentStyleList[
          styleClassList.indexOf('.' + childrenGlobal[i].classList[0])
        ] + '\n';
    }
    switch (childrenGlobal[i].localName) {
      case 'rect':
        convertedp5Data += convertRect(childrenGlobal[i]);
        break;
      case 'circle':
        convertedp5Data += convertCircle(childrenGlobal[i]);
        break;
      case 'polyline':
        convertedp5Data += convertPolyline(childrenGlobal[i]);
        break;
      case 'polygon':
        convertedp5Data += convertPolygon(childrenGlobal[i]);
        break;
      case 'line':
        convertedp5Data += convertLine(childrenGlobal[i]);
        break;
      case 'path':
        convertedp5Data += convertPath(childrenGlobal[i]);
      default:
        break;
    }
    convertedp5Data += 'pop()\n';
  }
  p5Output.value = convertedp5Data;
  loadp5(450, 450, convertedp5Data);
};

const loadp5 = (width, height, draw) => {
  let visHolder = document.getElementById('p5Vis');

  let script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.5.0/p5.min.js';

  visHolder.contentWindow.document.body.appendChild(script);

  let p5code = document.createElement('script');
  p5code.innerHTML = `function setup() {\ncreateCanvas(${width},${height});\n}\n function draw() {\nbackground(255);\n${draw}\n}`;

  visHolder.contentWindow.document.body.appendChild(p5code);

  let test = document.createElement('h1');
  test.innerHTML = 'test text';
  // visHolder.contentWindow.document.body.appendChild(test);

  // document.getElementById('p5Vis').innerHTML +=
  //   '<html><body><script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.5.0/p5.min.js"></script>';
  // document.getElementById(
  //   'p5Vis'
  // ).innerHTML += `<script>function setup() {createCanvas(${width},${height});} function draw(){background(255);${draw}}</script>`;
  // document.getElementById('p5Vis').innerHTML += '</body></html>';
};
