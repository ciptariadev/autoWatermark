const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

const inputDir = "./raw";
const outputDir = "./processed";
const fontPath = "./fonts/font.fnt";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function addWatermark(inputPath, outputPath) {
  try {
    const [image, font] = await Promise.all([
      Jimp.read(inputPath),
      Jimp.loadFont(fontPath),
    ]);

    const watermarkLayer = new Jimp(image.getWidth(), image.getHeight());

    const watermarkText = "CiptariaAi";
    const textWidth = Jimp.measureText(font, watermarkText);
    const textHeight = Jimp.measureTextHeight(font, watermarkText);

    const x = (image.getWidth() - textWidth) / 2;
    const y = (image.getHeight() - textHeight) / 2;

    watermarkLayer.print(
      font,
      x,
      y,
      {
        text: watermarkText,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      },
      textWidth,
      textHeight
    );

    watermarkLayer.opacity(0.95);

    image.composite(watermarkLayer, 0, 0, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.4,
      opacityDest: 1,
    });

    await image.writeAsync(outputPath);
    console.log(`Processed: ${path.basename(inputPath)}`);
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error);
  }
}

const supportedFormats = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".webp",
];

// Add new recursive processing function
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
      await addWatermark(inputPath, outputPath);
    }
  }
}

// Replace the old directory reading code with new recursive processing
try {
  processDirectory(inputDir, outputDir);
} catch (err) {
  console.error("Error processing directory:", err);
}
