const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

const inputDir = "./raw";
const outputDir = "./processed";
const fontPath = "./fonts/font.fnt";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function addWatermarkPattern(inputPath, outputPath) {
  try {
    const [image, font] = await Promise.all([
      Jimp.read(inputPath),
      Jimp.loadFont(fontPath),
    ]);

    const watermarkLayer = new Jimp(image.getWidth(), image.getHeight());
    const watermarkText = "CiptariaAi";
    const textWidth = Jimp.measureText(font, watermarkText);
    const textHeight = Jimp.measureTextHeight(font, watermarkText);

    // Adjust spacing for denser pattern
    const spacingX = textWidth * 1.5; // Reduced from 2 to 1.5
    const spacingY = textHeight * 1.2; // Reduced from 2 to 1.2

    // Calculate dimensions for rotated pattern
    const angle = -15; // Tilt angle in degrees
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    // Expand pattern area to account for rotation
    const expandedWidth = image.getWidth() * 1.5;
    const expandedHeight = image.getHeight() * 1.5;

    // Create tilted repeating pattern
    for (let y = -expandedHeight / 2; y < expandedHeight; y += spacingY) {
      for (let x = -expandedWidth / 2; x < expandedWidth; x += spacingX) {
        // Apply rotation transformation
        const rotX = x * cos - y * sin;
        const rotY = x * sin + y * cos;

        watermarkLayer.print(
          font,
          Math.round(rotX + image.getWidth() / 2),
          Math.round(rotY + image.getHeight() / 2),
          {
            text: watermarkText,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
          },
          textWidth,
          textHeight
        );
      }
    }

    // Apply opacity to watermark layer
    watermarkLayer.opacity(0.95);

    // Composite watermark onto original image
    image.composite(watermarkLayer, 0, 0, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
      opacityDest: 1,
    });

    await image.writeAsync(outputPath);
    console.log(`Processed: ${path.basename(inputPath)}`);
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error);
  }
}

// Supported formats array
const supportedFormats = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".webp",
];

// Recursive directory processing function
async function processDirectory(inputDir, outputDir, relativePath = "") {
  const currentInputDir = path.join(inputDir, relativePath);
  const currentOutputDir = path.join(outputDir, relativePath);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(currentOutputDir)) {
    fs.mkdirSync(currentOutputDir, { recursive: true });
  }

  const files = fs.readdirSync(currentInputDir);

  for (const file of files) {
    const inputPath = path.join(currentInputDir, file);
    const stat = fs.statSync(inputPath);

    if (stat.isDirectory()) {
      // Recursively process subdirectories
      await processDirectory(
        inputDir,
        outputDir,
        path.join(relativePath, file)
      );
    } else if (supportedFormats.includes(path.extname(file).toLowerCase())) {
      // Process image files
      const outputPath = path.join(currentOutputDir, file);
      await addWatermarkPattern(inputPath, outputPath);
    }
  }
}

// Start processing
try {
  processDirectory(inputDir, outputDir);
} catch (err) {
  console.error("Error processing directory:", err);
}
