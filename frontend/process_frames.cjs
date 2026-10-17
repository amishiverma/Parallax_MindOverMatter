const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const framesDir = path.join(__dirname, 'public/frames');
const videoPath = path.join(__dirname, 'public/assets/videos/heropg1.mp4');
const tempDir = path.join('/tmp', 'redstring_raw_frames');

async function processFrames() {
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  // Extract clean pristine 1280x720 frames from source video if available
  if (fs.existsSync(videoPath)) {
    console.log("Extracting 300 pristine source frames (1280x720) from heropg1.mp4...");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    execSync(`ffmpeg -y -i "${videoPath}" -vf "fps=300/20.01" -frames:v 300 "${tempDir}/raw_%03d.png"`, { stdio: 'ignore' });
  }

  const sourceDir = fs.existsSync(tempDir) ? tempDir : framesDir;
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.png') || f.endsWith('.webp')).sort();
  console.log(`Processing ${files.length} frames with precision dual-stage framing...`);

  const meta = await sharp(path.join(sourceDir, files[0])).metadata();
  const W = meta.width;
  const H = meta.height;

  // Slim text-line crop (top 5.5% & bottom 5.5%)
  const topCut = Math.round(H * 0.055);
  const bottomCut = Math.round(H * 0.055);
  const slimH = H - topCut - bottomCut;

  // Soft feathered radial black smudge (NO hard edges)
  const smudgeSvg = Buffer.from(`
    <svg width="${W}" height="${slimH}">
      <defs>
        <radialGradient id="featherSmudge" cx="93%" cy="92%" r="13%">
          <stop offset="0%" stop-color="#000000" stop-opacity="1" />
          <stop offset="40%" stop-color="#000000" stop-opacity="0.85" />
          <stop offset="75%" stop-color="#000000" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${W}" height="${slimH}" fill="url(#featherSmudge)" />
    </svg>
  `);

  let count = 0;
  for (const file of files) {
    const frameNum = parseInt(file.match(/\d+/)[0], 10);
    const sourceFilePath = path.join(sourceDir, file);
    const paddedNum = frameNum.toString().padStart(3, '0');
    const targetFilePath = path.join(framesDir, `frame_${paddedNum}.webp`);

    let pipeline = sharp(sourceFilePath);

    if (frameNum <= 82) {
      // Frames 1-82: Tight inner crop (removes watermark naturally, NO smudge)
      const padX = Math.round(W * 0.07);
      const padY = Math.round(H * 0.07);
      pipeline = pipeline.extract({
        left: padX,
        top: padY,
        width: W - padX * 2,
        height: H - padY * 2
      }).resize(W, slimH);
    } else {
      // Frames 83+: Only crop slim text bars + add soft feathered black smudge
      pipeline = pipeline
        .extract({ left: 0, top: topCut, width: W, height: slimH })
        .composite([{ input: smudgeSvg, blend: 'over' }]);
    }

    const buffer = await pipeline
      .sharpen({ sigma: 0.8, m1: 0.5, m2: 0.3 })
      .webp({ quality: 92 })
      .toBuffer();

    fs.writeFileSync(targetFilePath, buffer);
    count++;
    if (count % 50 === 0 || count === files.length) {
      console.log(`Processed ${count}/${files.length} frames...`);
    }
  }

  // Clean temp dir
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log("Frames 001-082 cropped cleanly. Frames 083+ text stripped with feathered smudge.");
}

processFrames().catch(console.error);
