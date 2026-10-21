// sketch.js


// Webcam and screenshot setup
let video; // Webcam feed
let snapshot; // Current frame used for processing
let screenshotImage; // Stored screenshot when in screenshot mode
let screenshotMode = false; // Toggle live video vs. screenshot

// Emoji on image/video
let happyEmoji, sadEmoji, angryEmoji, surprisedEmoji;
let faceExpressions = {}; // Global variable to hold expressions

// Processed images
let grayscaleImage;
let redChannelImage, greenChannelImage, blueChannelImage;
let yCbCrImage, hsvImage;
let thresholdedRedImage, thresholdedGreenImage, thresholdedBlueImage;
let thresholdedYCbCrImage, thresholdedHSVImage;

// Grid layout
let gridX = 60;
let gridY = 50;
let cellWidth = 160;
let cellHeight = 120;
let cellGap = 20;  // Gap between cells

// drawing the starting position for grid images
let gridXOffset = gridX + 200;
let gridYOffset = gridY - 40;

// starting position for the extra grid (extension) 
let extGridX = gridXOffset; 
let extGridY = gridYOffset + 4 * (cellHeight + cellGap) + 40;

// Sliders for thresholding
let redThresholdSlider, greenThresholdSlider, blueThresholdSlider;
let yCbCrThresholdSlider, hsvThresholdSlider;

// Face detection
let faceapi;
let faceDetections = [];
let faceBox = null;  // Bounding box from face detection

// for face detection ( e is back to normal )
let faceDisplayMode = 'e';

// Helper: return the top-left coordinate for cell at (row, col)
function getGridPos(row, col) {
  let x = gridXOffset + col * (cellWidth + cellGap);
  let y = gridYOffset + row * (cellHeight + cellGap);
  return { x, y };
}


//===========================LOAD IMAGES FOR EMOJI=============================


// load the images for emoji 
function preload() {
  // Replace the paths with the actual paths to your emoji image files.
  happyEmoji = loadImage('images/happy.png');
  sadEmoji = loadImage('images/sad.png');
  angryEmoji = loadImage('images/angryface.png');
  surprisedEmoji = loadImage('images/surprised.png');
}


//====================SET UP CANVAS==============================


// set up the canvas accordingly 
function setup() {
  
  createCanvas(1500, 800);
  
  pixelDensity(1);

  // Create webcam capture
  video = createCapture(VIDEO);
  video.size(160, 120);
  video.hide();

  // Initialize ml5 faceApi
  const faceOptions = {
    withLandmarks: true,
    withExpressions: true,
    withDescriptors: false
  };
  faceapi = ml5.faceApi(video.elt, faceOptions, modelReady);
    
  // red slider
  redThresholdSlider = createSlider(0, 255, 127);
  redThresholdSlider.position(20, height - 100);
    
  // green slider    
  greenThresholdSlider = createSlider(0, 255, 127);
  greenThresholdSlider.position(20, height - 70);
    
  // blue slider    
  blueThresholdSlider = createSlider(0, 255, 127);
  blueThresholdSlider.position(20, height - 40);
    
  // yCbCr slider
  yCbCrThresholdSlider = createSlider(0, 255, 127);
  yCbCrThresholdSlider.position(gridX + cellWidth, gridY + 5 * cellHeight + 20);
    
  // HSV slider    
  hsvThresholdSlider = createSlider(0, 255, 127);
  hsvThresholdSlider.position(gridX + 2 * cellWidth, gridY + 5 * cellHeight + 20);    
    
}


//=======================LIVE DETECTION================================


// for live detection
function modelReady() {
  // Start live detection (if not in screenshot mode)
  if (!screenshotMode) {
    faceapi.detect(video.elt, gotFaceResults);
  }
}


//=========================INSTRUCTIONS PANEL ==================================


// Instructions panel for users ( on the right of the canvas )
function drawInstructionsBoard() {
  let boardX = width - 490; // X-position for the instructions board
  let boardY = 10;          // Y-position
  let boardWidth = 300;
  let boardHeight = 670;    // Adjust as needed

  // Background
  noStroke();
  fill(255, 255, 143); // Soft white background
  rect(boardX, boardY, boardWidth, boardHeight, 20); // Rounded corners

  // Shadow Effect 
  push();
  fill(0, 50); // Light shadow
  rect(boardX + 5, boardY + 5, boardWidth, boardHeight, 20);
  pop();

  // Main Title
  fill(251, 236, 93); // Soft blue header
  noStroke();
  rect(boardX, boardY, boardWidth, 50, 20, 20, 0, 0); // Rounded only top corners
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(20);
  text("Image Processing Application", boardX + boardWidth / 2, boardY + 25);

  // Instrctions
  fill(50);
  textSize(13);
  textAlign(LEFT, TOP);
  let instructions = [
    "• Press 's' - Take Screenshot",
    "• Press 'l' - Resume Live Video",
    " ",
    "Facial Detection Filters",  
    "   • Press 'a' - A greyscale image.",
    "   • Press 'b' - A blurred image",
    "   • Press 'c' - A colour converted image(YCbCr)",  
    "   • Press 'd' - A pixelate image",
    "   • Press 'e' - Back to Original image",
  ];

  let instructionY = boardY + 60;
  for (let instr of instructions) {
    text(instr, boardX + 20, instructionY);
    instructionY += 24; // Spacing between instructions
  }

  // Sliders area
  textSize(15);
  fill(70, 130, 180);
  textAlign(CENTER, TOP);
  text("Threshold Sliders", boardX + boardWidth / 2, instructionY + 30);

  let sliderY = instructionY + 40;
  let sliderGap = 60;

  // Aline the slider     
  function createSliderBlock(slider, label, yPos) {
    fill(240); // Slider background
    rect(boardX + 15, yPos +20 , boardWidth - 30, 50, 10); // Background card

    fill(50);
    textSize(12);
    textAlign(LEFT, CENTER);
    text(label, boardX + 25, yPos +30);

    slider.position(boardX + 25, yPos + 50); // Align slider according to the position
    slider.style('width', `${boardWidth - 50}px`);
  }

  // Sliders names accordingly 
  createSliderBlock(redThresholdSlider, "Red Threshold", sliderY);
  createSliderBlock(greenThresholdSlider, "Green Threshold", sliderY + sliderGap);
  createSliderBlock(blueThresholdSlider, "Blue Threshold", sliderY + 2 * sliderGap);
  createSliderBlock(yCbCrThresholdSlider, "YCbCr Threshold", sliderY + 3 * sliderGap);
  createSliderBlock(hsvThresholdSlider, "HSV Threshold", sliderY + 4 * sliderGap);
}


//======================DRAW GRIDS AND IMAGES WITH FUNCTIONS======================================


function draw() {
  background(255); // White background for contrast

  // Draw the grid with labels below
  drawGrid();
  drawExtensionGrid();
    
  // Use live video if not in screenshot mode; otherwise use the stored screenshot
  if (!screenshotMode) {
    snapshot = video.get();
  } else {
    snapshot = screenshotImage;
  }

  // Process the current frame for other grid cells
  grayscaleImage = applyGrayscaleAndBrightness(snapshot);
  [redChannelImage, greenChannelImage, blueChannelImage] = splitColorChannels(snapshot);
  yCbCrImage = convertToYCbCr(snapshot);
  hsvImage = convertToHSV(snapshot);

  // ----- Row 1 -----
    
  // Row 1 has 2 columns (col indices 0 and 1)

  // Row 1, Col 1: Flipped webcam image
  let pos = getGridPos(0, 0);
  push();
  scale(-1, 1);
  // When flipping, adjust x by adding cellWidth so image appears in the right cell.
  image(snapshot, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
  pop();

  // Row 1, Col 2: Flipped greyscale image
  if (grayscaleImage) {
    pos = getGridPos(0, 1);
    push();
    scale(-1, 1);
    image(grayscaleImage, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
    pop();
  }

    
  // ----- Row 2 -----
    
  // Row 2 has 3 columns (col indices 0,1,2)
  // Row 2, Col 1: Flipped Red channel image
  pos = getGridPos(1, 0);
  if (redChannelImage) {
    push();
    scale(-1, 1);
    image(redChannelImage, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
    pop();
  }
  // Row 2, Col 2: Flipped Green channel image
  pos = getGridPos(1, 1);
  if (greenChannelImage) {
    push();
    scale(-1, 1);
    image(greenChannelImage, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
    pop();
  }
  // Row 2, Col 3: Flipped Blue channel image
  pos = getGridPos(1, 2);
  if (blueChannelImage) {
    push();
    scale(-1, 1);
    image(blueChannelImage, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
    pop();
  }

    
  // ----- Row 3: Thresholded images (R, G, B) -----
    
  thresholdedRedImage = applyThreshold(redChannelImage, redThresholdSlider.value());
  thresholdedGreenImage = applyThreshold(greenChannelImage, greenThresholdSlider.value());
  thresholdedBlueImage = applyThreshold(blueChannelImage, blueThresholdSlider.value());
  
  // Row 3, Col 1: Red threshold
  pos = getGridPos(2, 0);
  if (thresholdedRedImage) {
    push();
    scale(-1, 1);
    image(thresholdedRedImage, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
    pop();
  }
  // Row 3, Col 2: Green threshold
  pos = getGridPos(2, 1);
  if (thresholdedGreenImage) {
    push();
    scale(-1, 1);
    image(thresholdedGreenImage, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
    pop();
  }
  // Row 3, Col 3: Blue threshold
  pos = getGridPos(2, 2);
  if (thresholdedBlueImage) {
    push();
    scale(-1, 1);
    image(thresholdedBlueImage, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
    pop();
  }

    
  // ----- Row 4: Webcam image, YCbCr, HSV -----
    
  // Row 4, Col 1: Flipped webcam image (again)
  pos = getGridPos(3, 0);
  push();
  scale(-1, 1);
  image(snapshot, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
  pop();
  // Row 4, Col 2: Flipped YCbCr image
  pos = getGridPos(3, 1);
  if (yCbCrImage) {
    push();
    scale(-1, 1);
    image(yCbCrImage, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
    pop();
  }
  // Row 4, Col 3: Flipped HSV image
  pos = getGridPos(3, 2);
  if (hsvImage) {
    push();
    scale(-1, 1);
    image(hsvImage, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
    pop();
  }

    
  // ----- Row 5: Face detection and processed face images -----
    
  // Row 5, Col 1: Full feed with face transformation
  pos = getGridPos(4, 0);
  push();
  scale(-1, 1);
  let cellX = pos.x;
  let cellY = pos.y;
  let processedFeed = createGraphics(snapshot.width, snapshot.height);
  processedFeed.image(snapshot, 0, 0);
  if (faceBox) {
    let faceRegion = processedFeed.get(faceBox._x, faceBox._y, faceBox._width, faceBox._height);
    let processedFace;
    if (faceDisplayMode === 'a') {
      processedFace = applyGrayscaleAndBrightness(faceRegion);
    } else if (faceDisplayMode === 'b') {
      processedFace = applyBlur(faceRegion, 8);
    } else if (faceDisplayMode === 'c') {
      processedFace = convertToYCbCr(faceRegion);
    } else if (faceDisplayMode === 'd') {
      processedFace = pixelate(faceRegion, 10);
    } else {
      processedFace = faceRegion;
    }
    processedFeed.image(processedFace, faceBox._x, faceBox._y);
    if (faceDisplayMode === 'e') {
      processedFeed.noFill();
      processedFeed.stroke(0, 255, 0);
      processedFeed.strokeWeight(2);
      processedFeed.rect(faceBox._x, faceBox._y, faceBox._width, faceBox._height);
    }
  }
  image(processedFeed, -(cellX + cellWidth), cellY, cellWidth, cellHeight);
  pop();
  
  // Row 5, Col 2: Flipped thresholded YCbCr image
  pos = getGridPos(4, 1);
  thresholdedYCbCrImage = applyThresholdYCbCr(yCbCrImage, yCbCrThresholdSlider.value());
  if (thresholdedYCbCrImage) {
    push();
    scale(-1, 1);
    image(thresholdedYCbCrImage, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
    pop();
  }
  // Row 5, Col 3: Flipped thresholded HSV image
  pos = getGridPos(4, 2);
  thresholdedHSVImage = applyThresholdHSV(hsvImage, hsvThresholdSlider.value());
  if (thresholdedHSVImage) {
    push();
    scale(-1, 1);
    image(thresholdedHSVImage, -(pos.x + cellWidth), pos.y, cellWidth, cellHeight);
    pop();
  }

  // ----- Row 6 -----
    
  
  // Row 6, Col 1: Extension 1
  let extPos = { x: extGridX + 540, y: extGridY - 180 };
  push();
  // Translate the origin to the top-right corner of the cell, then flip horizontally.
  translate(extPos.x + cellWidth, extPos.y);
  scale(-1, 1);
  // Draw the flipped video feed into the cell.
  image(snapshot, 0, 0, cellWidth, cellHeight);

// If a face has been detected, overlay the emoji over the face.
if (faceBox) {
  // faceBox coordinates are from the original video.
  // When drawing with scale(-1,1) the x-coordinate should be flipped.
  let flippedFaceX = cellWidth - faceBox._x - faceBox._width;
  
  // Determine the dominant expression (using faceExpressions).
  let dominantExpression = null;
  let maxProb = 0;
  for (let exp in faceExpressions) {
    if (faceExpressions[exp] > maxProb) {
      maxProb = faceExpressions[exp];
      dominantExpression = exp;
    }
  }
  
  // Select the appropriate emoji.
  let emoji;
  if (dominantExpression === 'happy') {
    emoji = happyEmoji;
  } else if (dominantExpression === 'sad') {
    emoji = sadEmoji;
  } else if (dominantExpression === 'angry') {
    emoji = angryEmoji;
  } else if (dominantExpression === 'surprised') {
    emoji = surprisedEmoji;
  }
  
  // If an emoji is chosen, draw it covering the detected face.
  if (emoji) {
    image(emoji, flippedFaceX, faceBox._y, faceBox._width, faceBox._height);
  }
}
pop();


  // Row 6, Col 2: Extension 2
  extPos = { x: extGridX + 540, y: extGridY - 180 + cellHeight + cellGap };
  let kaleidoImage = applyKaleidoscope(snapshot, 8, frameCount * 0.01);
  push();
  scale(-1, 1);
  image(kaleidoImage, -(extPos.x + cellWidth), extPos.y, cellWidth, cellHeight);
  pop();


  drawInstructionsBoard();
}


//===================== KEYPRESS==============================================


// keypress function
function keyPressed() {
  let pressed = key.toLowerCase();
  if (pressed === 's') {
    if (!screenshotMode) {
      screenshotMode = true;
      screenshotImage = video.get();
    }
  }  
  else if (["a", "b", "c", "d", "e"].includes(pressed)) {
  faceDisplayMode = pressed;
  } 
  else if (pressed === 'l') {
  returnToLiveVideo(); // Return to the live video feed
  }      
}


//======================= RETURN TO LIVE VIDEO =========================


// when l is pressed it will return to live video
function returnToLiveVideo() {
  screenshotMode = false; // Disable screenshot mode to resume live video
  screenshotImage = null; // Clear the stored screenshot
}


//=============================FACE DETECTION===========================================


//face detection function with box on the detected face
function gotFaceResults(err, result) {
  if (err) {
    console.error(err);
    return;
  }
  if (!screenshotMode) {
    faceDetections = result;
    if (faceDetections && faceDetections.length > 0) {
      let face = faceDetections[0];
      faceBox = face.alignedRect._box;
      // Store the detected expressions
      faceExpressions = face.expressions;
    } else {
      faceBox = null;
      faceExpressions = {};
    }
    faceapi.detect(video.elt, gotFaceResults);
  }
}


// ==================== GRID IMAGE FUNCTION + EXTENSION =========================


// Creat kaleidoscope effect for extension 2
function applyKaleidoscope(img, segments = 8, rotation = 0) {
  let w = img.width;
  let h = img.height;
  
  // Create an off-screen graphics buffer.
  let pg = createGraphics(w, h);
  pg.imageMode(CENTER);
  pg.colorMode(HSB, 360, 100, 100, 255);
  
  // Calculate the angle between segments.
  let angleStep = TWO_PI / segments;
  
  // Center the coordinate system.
  pg.translate(w / 2, h / 2);
  
  // Create a wedge-shaped mask (same for every segment).
  let maskG = createGraphics(w, h);
  maskG.imageMode(CENTER);
  maskG.translate(w / 2, h / 2);
  maskG.noStroke();
  maskG.fill(255);
  maskG.arc(0, 0, w * 2, w * 2, -angleStep / 2, angleStep / 2, PIE);
  let wedgeMask = maskG.get();
  
  // Base hue rotates over time for dynamic colours.
  let baseHue = (frameCount * 0.5) % 360;
  
  // Loop through each segment.
  for (let i = 0; i < segments; i++) {
    pg.push();
    // Rotate by the segment's angle plus an optional global rotation.
    pg.rotate(i * angleStep + rotation);
    // Mirror every other segment.
    if (i % 2 === 0) {
      pg.scale(1, -1);
    }
    
    // Calculate a dynamic hue for this segment.
    let hueVal = (baseHue + i * (360 / segments)) % 360;
    
    // Create a tinted copy of the image.
    let tempG = createGraphics(w, h);
    tempG.imageMode(CENTER);
    tempG.colorMode(HSB, 360, 100, 100, 255);
    tempG.tint(hueVal, 80, 100, 255);
    tempG.image(img, w / 2, h / 2, w, h);
    let tintedSegment = tempG.get();
    
    // Apply the wedge mask.
    tintedSegment.mask(wedgeMask);
    
    // Draw the processed segment.
    pg.image(tintedSegment, 0, 0, w, h);
    pg.pop();
  }
  
  return pg;
}


// grayscale + 20% brightness 
function applyGrayscaleAndBrightness(img) {
  let newImage = createImage(img.width, img.height);
  img.loadPixels();
  newImage.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];
    let gray = floor(0.299 * r + 0.587 * g + 0.114 * b);
    newImage.pixels[i] = gray;
    newImage.pixels[i + 1] = gray;
    newImage.pixels[i + 2] = gray;
    newImage.pixels[i + 3] = 255;
  }
  newImage.updatePixels();
  return newImage;
}


// red , blue , green channel 
function splitColorChannels(img) {
  let redImage = createImage(img.width, img.height);
  let greenImage = createImage(img.width, img.height);
  let blueImage = createImage(img.width, img.height);
  img.loadPixels();
  redImage.loadPixels();
  greenImage.loadPixels();
  blueImage.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];
    let alpha = img.pixels[i + 3];
    redImage.pixels[i] = r;
    redImage.pixels[i + 1] = 0;
    redImage.pixels[i + 2] = 0;
    redImage.pixels[i + 3] = alpha;
    greenImage.pixels[i] = 0;
    greenImage.pixels[i + 1] = g;
    greenImage.pixels[i + 2] = 0;
    greenImage.pixels[i + 3] = alpha;
    blueImage.pixels[i] = 0;
    blueImage.pixels[i + 1] = 0;
    blueImage.pixels[i + 2] = b;
    blueImage.pixels[i + 3] = alpha;
  }
  redImage.updatePixels();
  greenImage.updatePixels();
  blueImage.updatePixels();
  return [redImage, greenImage, blueImage];
}


// colour space 1
function convertToYCbCr(img) {
  let newImage = createImage(img.width, img.height); // Create a new image with the same dimensions
  img.loadPixels(); // Load pixel data from the input image
  newImage.loadPixels(); // Load pixel data for the new image

  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];     // Red channel (0-255)
    let g = img.pixels[i + 1]; // Green channel (0-255)
    let b = img.pixels[i + 2]; // Blue channel (0-255)

    // YCbCr conversion formulas based on standard definitions
    let Y  = 0.299 * r + 0.587 * g + 0.114 * b; // Luma component
    let Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b; // Blue-difference chroma component
    let Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b; // Red-difference chroma component

    // Assign calculated Y, Cb, and Cr values to the new image's pixels
    newImage.pixels[i]     = Y;  // Store Y in the red channel
    newImage.pixels[i + 1] = Cb; // Store Cb in the green channel
    newImage.pixels[i + 2] = Cr; // Store Cr in the blue channel
    newImage.pixels[i + 3] = 255; // Fully opaque alpha
  }

  newImage.updatePixels(); // Update the pixel data of the new image
  return newImage; // Return the converted image
}


// colour space 2
function convertToHSV(img) {
  let newImage = createImage(img.width, img.height);
  img.loadPixels();
  newImage.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i] / 255;
    let g = img.pixels[i + 1] / 255;
    let b = img.pixels[i + 2] / 255;
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let delta = max - min;
    let h = 0, s = 0, v = max;
    if (delta !== 0) {
      s = delta / max;
      if (max === r) {
        h = (g - b) / delta + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / delta + 2;
      } else {
        h = (r - g) / delta + 4;
      }
      h *= 60;
    }
    newImage.pixels[i]     = h / 360 * 255;
    newImage.pixels[i + 1] = s * 255;
    newImage.pixels[i + 2] = v * 255;
    newImage.pixels[i + 3] = 255;
  }
  newImage.updatePixels();
  return newImage;
}


// red, blue , green Threshold
function applyThreshold(img, threshold) {
  let newImage = createImage(img.width, img.height);
  img.loadPixels();
  newImage.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];
    newImage.pixels[i]     = r > threshold ? 255 : 0;
    newImage.pixels[i + 1] = g > threshold ? 255 : 0;
    newImage.pixels[i + 2] = b > threshold ? 255 : 0;
    newImage.pixels[i + 3] = 255;
  }
  newImage.updatePixels();
  return newImage;
}


// YCbCr Threshold
function applyThresholdYCbCr(img, threshold) {
  let newImage = createImage(img.width, img.height);
  img.loadPixels();
  newImage.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let yValue = img.pixels[i];
    let bwValue = yValue > threshold ? 255 : 0;
    newImage.pixels[i]     = bwValue;
    newImage.pixels[i + 1] = bwValue;
    newImage.pixels[i + 2] = bwValue;
    newImage.pixels[i + 3] = 255;
  }
  newImage.updatePixels();
  return newImage;
}


// HSV Threshold 
function applyThresholdHSV(img, threshold) {
  let newImage = createImage(img.width, img.height);
  img.loadPixels();
  newImage.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let vValue = img.pixels[i + 2];
    let bwValue = vValue > threshold ? 255 : 0;
    newImage.pixels[i]     = bwValue;
    newImage.pixels[i + 1] = bwValue;
    newImage.pixels[i + 2] = bwValue;
    newImage.pixels[i + 3] = 255;
  }
  newImage.updatePixels();
  return newImage;
}


// function have blur effect on face ( for face detection )
function applyBlur(img, blurAmount) {
  let pg = createGraphics(img.width, img.height);
  pg.image(img, 0, 0);
  pg.filter(BLUR, blurAmount);
  return pg;
}


// fucntion to pixelate face ( for face detection )
function pixelate(img, pixelSize) {
  let w = img.width;
  let h = img.height;
  let pg = createGraphics(floor(w / pixelSize), floor(h / pixelSize));
  pg.noSmooth();
  pg.image(img, 0, 0, pg.width, pg.height);
  let pg2 = createGraphics(w, h);
  pg2.noSmooth();
  pg2.image(pg, 0, 0, w, h);
  return pg2;
}


// ============================================== DRAW GRID ===============================================================


// draw the 14 grids alike the 
function drawGrid() {
    
  let labels = [
    ["Webcam image", "Grayscale and brightness + 20%"],
    ["Red channel", "Green channel", "Blue channel"],
    ["Threshold image", "Threshold image", "Threshold image"],
    ["Webcam image (repeat)", "Colour space 1", "Colour space 2"],
    ["Face detection\nand replaced face images", 
     "Threshold image\nfrom colour space 1", 
     "Threshold image\nfrom colour space 2"] 
  ];

  let rows = 5; // Total rows
  let cols = 3; // Default columns
  let xOffset = gridX + 200; // Starting x for the grid
  let yOffset = gridY - 40; // Starting y for the grid

  let cellGap = 20;          // Gap between cells
  let labelMargin = 2;       // Gap between cell and label

  for (let row = 0; row < rows; row++) {
      
    // Row 0 has 2 columns, other rows have 3
    let columnsToDraw = (row === 0) ? 2 : cols;

    for (let col = 0; col < columnsToDraw; col++) { 
      let x = xOffset + col * (cellWidth + cellGap);
      let y = yOffset + row * (cellHeight + cellGap);

      // Draw the grid cell
      stroke(0);
      strokeWeight(1);
      noFill();
      rect(x, y, cellWidth, cellHeight);

      // Draw the label below the grid cell
      fill(0);
      noStroke();
      textAlign(CENTER, TOP);
      text(labels[row][col], x + cellWidth / 2, y + cellHeight + labelMargin);
    }
  }
}


// draw extra 2 grids for extension 1 and extension 2
function drawExtensionGrid() {
  let extLabels = ["Extension 1", "Extension 2"];
  // We'll draw two cells (one per extension) in a vertical column.
  for (let i = 0; i < extLabels.length; i++) {
    let x = extGridX + 540;
    let y = extGridY - 180 + i * (cellHeight + cellGap);
    
    stroke(0);
    strokeWeight(1);
    noFill();
    rect(x, y, cellWidth, cellHeight);
    
    fill(0);
    noStroke();
    textAlign(CENTER, TOP);
    text(extLabels[i], x + cellWidth/2, y + cellHeight + 1);
  }
}

