const cropCanvas = document.getElementById('cropCanvas');
const cropCtx = cropCanvas.getContext('2d');

const previewCanvas = document.getElementById('previewCanvas');
const ctx = previewCanvas.getContext('2d');

const zoomSlider = document.getElementById('zoomSlider');
let baseScale = 1; // ✅ New global variable
let zoom = 1;      // ✅ Initial zoom multiplier

let fullImage = null;
let croppedImage = null;

let imgX = 0, imgY = 0;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;

// ✅ Define red circle dimensions
const radius = Math.min(cropCanvas.width, cropCanvas.height) / 2 - 2;
const centerX = cropCanvas.width / 2;
const centerY = cropCanvas.height / 2;

// ✅ Sync crop box to red circle — ONLY this part
cropBoxSize = radius * 2;
cropBoxX = centerX - radius;
cropBoxY = centerY - radius;

const templateImage = new Image();
templateImage.src = 'Assets/Alumni.png';
templateImage.onload = () => drawFinalCanvas();

zoomSlider.addEventListener('input', () => {
  zoom = baseScale * parseFloat(zoomSlider.value); // ✅ Apply multiplier
  drawCropCanvas();
});

document.getElementById('imageUpload').addEventListener('change', (e) => {
  const reader = new FileReader();
  reader.onload = function(event) {
    fullImage = new Image();
    fullImage.onload = () => {
      // ✅ Fit image inside canvas by default
      baseScale = cropCanvas.width / fullImage.width;

      zoomSlider.value = 1; // ✅ Slider starts at 1
      zoom = baseScale * parseFloat(zoomSlider.value); // ✅ Apply multiplier

      imgX = (cropCanvas.width - fullImage.width * zoom) / 2;
      imgY = (cropCanvas.height - fullImage.height * zoom) / 2;

      drawCropCanvas();
    };
    fullImage.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
});

function drawCropCanvas() {
  cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
  if (!fullImage) return;

  const scaledWidth = fullImage.width * zoom;
  const scaledHeight = fullImage.height * zoom;

  cropCtx.drawImage(fullImage, imgX, imgY, scaledWidth, scaledHeight);
  cropCtx.beginPath();
  cropCtx.arc(
  cropBoxX + cropBoxSize / 2,
  cropBoxY + cropBoxSize / 2,
  cropBoxSize / 2,
  0,
  Math.PI * 2
);

const radius = Math.min(cropCanvas.width, cropCanvas.height) / 2 - 2;
const centerX = cropCanvas.width / 2;
const centerY = cropCanvas.height / 2;

cropCtx.beginPath();
cropCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
cropCtx.strokeStyle = 'red';
cropCtx.lineWidth = 2;
cropCtx.stroke();

  updateLiveCrop();
}


function updateLiveCrop() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = cropBoxSize;
  tempCanvas.height = cropBoxSize;
  const tempCtx = tempCanvas.getContext('2d');

  const sx = (cropBoxX - imgX) / zoom;
  const sy = (cropBoxY - imgY) / zoom;
  const sw = cropBoxSize / zoom;
  const sh = cropBoxSize / zoom;

  tempCtx.drawImage(fullImage, sx, sy, sw, sh, 0, 0, cropBoxSize, cropBoxSize);

  croppedImage = new Image();
  croppedImage.onload = drawFinalCanvas;
  croppedImage.src = tempCanvas.toDataURL();
}

cropCanvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStartX = e.offsetX - imgX;
  dragStartY = e.offsetY - imgY;
  cropCanvas.style.cursor = 'grabbing';
});

cropCanvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    imgX = e.offsetX - dragStartX;
    imgY = e.offsetY - dragStartY;
    drawCropCanvas();
  }
});

cropCanvas.addEventListener('mouseup', () => {
  isDragging = false;
  cropCanvas.style.cursor = 'grab';
});

cropCanvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    const touch = e.touches[0];
    dragStartX = touch.clientX - imgX;
    dragStartY = touch.clientY - imgY;
  }
});

cropCanvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    const touch = e.touches[0];
    imgX = touch.clientX - dragStartX;
    imgY = touch.clientY - dragStartY;
    drawCropCanvas();
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!cropCanvas._lastDistance) {
      cropCanvas._lastDistance = distance;
    } else {
      const delta = distance - cropCanvas._lastDistance;
      zoom += delta * 0.005;
      zoom = Math.max(0.5 * baseScale, Math.min(5 * baseScale, zoom)); // ✅ Adjusted bounds
      zoomSlider.value = (zoom / baseScale).toFixed(2); // ✅ Sync slider
      cropCanvas._lastDistance = distance;
      drawCropCanvas();
    }
  }
}, { passive: false });

cropCanvas.addEventListener('touchend', () => {
  isDragging = false;
  cropCanvas._lastDistance = null;
});

document.getElementById('applyCropBtn').addEventListener('click', () => {
  updateLiveCrop();
});

const namePosition = { x: 400,y: 481.86, width: 440, height: 54 };

function drawFinalCanvas() {
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  if (templateImage.complete) {
    ctx.drawImage(templateImage, 0, 0, previewCanvas.width, previewCanvas.height);
  }

  // Name text
  let name = document.getElementById('nameInput').value;
  name = name.split(' ').slice(0, 5).join(' ');
  ctx.font = '700 50px Archivo-ExtraBold';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(name, namePosition.x, namePosition.y + namePosition.height - 4);
  ctx.textAlign = 'start';


  // Cropped image
  if (croppedImage && croppedImage.complete && fullImage) {
    const imageX = 279.89;
    const imageY = 199.63;
    const imageSize = 244.99;

    ctx.save();
    ctx.beginPath();
    ctx.arc(imageX + imageSize / 2, imageY + imageSize / 2, imageSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(croppedImage, imageX, imageY, imageSize, imageSize);
    ctx.restore();
    cropCtx.globalAlpha = 0.5;
    cropCtx.fillStyle = '#000';
    cropCtx.beginPath();
    cropCtx.rect(0, 0, cropCanvas.width, cropCanvas.height);
    cropCtx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    cropCtx.fill('evenodd');
    cropCtx.restore();
  }

  

  // Slider
  const bgImages = [
  'Assets/reception_-3.jpg',
  'Assets/reception_-4.jpg',
  'Assets/reception_-14.jpg'
];

let currentIndex = 0;
const bgSlider = document.querySelector('.background-slider');

function changeBackground() {
  bgSlider.style.backgroundImage = `url('${bgImages[currentIndex]}')`;
  currentIndex = (currentIndex + 1) % bgImages.length;
}

changeBackground(); // Initial load
setInterval(changeBackground, 5000); // Change every 5 seconds

  // Testimonial box
  const boxX = 74.35;
  const boxY = 662.72;
  const boxW = 656.08;
  const boxH = 283.65;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = 'rgba(2, 44, 94, 0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 16);
  ctx.fill();
  ctx.stroke();

  // Testimonial text
  let testimonial = document.getElementById('testimonialInput').value;
  ctx.font = '24px Archivo-ExtraBold';
  ctx.fillStyle = '#022C5E';
  wrapText(ctx, testimonial, boxX + 20, boxY + 40, boxW - 40, 32, boxH - 60);
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxHeight) {
  const words = text.split(' ');
  let line = '';
  let linesDrawn = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      if ((linesDrawn + 1) * lineHeight > maxHeight) break;
      context.fillText(line, x, y);
      line = words[i] + ' ';
      y += lineHeight;
      linesDrawn++;
    } else {
      line = testLine;
    }
  }

  if ((linesDrawn + 1) * lineHeight <= maxHeight) {
    context.fillText(line, x, y);
  }
}

// roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

// Live updates
document.getElementById('nameInput').addEventListener('input', drawFinalCanvas);
document.getElementById('testimonialInput').addEventListener('input', drawFinalCanvas);

// Download button
document.getElementById('downloadBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'custom-dp.png';
  link.href = previewCanvas.toDataURL();
  link.click();
});

// Initial render
drawFinalCanvas();