let svgInput = document.querySelector('#svgInput').value;
let p5Output = document.querySelector('#p5Output');

document.querySelector('#convertBTN').addEventListener('click', () => {
  svg2p5();
});

document.querySelector('#svgInput').addEventListener('input', (e) => {
  document.querySelector('#hiddenTempDiv').innerHTML = e.target.value;
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
          value === 'none'
            ? (convertedStyles[i] += 'noFill()\n')
            : (convertedStyles[i] +=
                'fill(' + value.replace('rgb(', '').replace(')', '') + ')\n');
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

  let vertecies = '';
  points.forEach((point) => {
    vertecies += 'vertex(' + point + ')\n';
  });

  return 'beginShape()\n' + vertecies + 'endShape(CLOSE)\n';
};

const convertPolyline = (data) => {
  let points = data.attributes.points.value.split(' \t')[0];
  points = points.split(' ');

  let vertecies = '';
  points.forEach((point) => {
    vertecies += 'vertex(' + point + ')\n';
  });

  return 'beginShape()\n' + vertecies + 'endShape()\n';
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
    console.log(childrenGlobal[i].classList[0]);
    convertedp5Data += 'push()\n';
    convertedp5Data +=
      currentStyleList[
        styleClassList.indexOf('.' + childrenGlobal[i].classList[0])
      ] + '\n';
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
      default:
        break;
    }
    convertedp5Data += 'pop()\n';
  }
  p5Output.value = convertedp5Data;
};
