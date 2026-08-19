// scripts/optimize-images.js
// Shrinks every JPEG under public/uploads/products/ to max 1024×1024 at
// mozjpeg quality 82, in place. Idempotent — safe to run repeatedly.
//
// Run with:   node scripts/optimize-images.js
// Reason:     source photos from generators/phones are often 2000–4000 px,
//             several MB each. Next.js still re-encodes them at request time
//             for each variant, but a smaller SOURCE means less CPU per
//             optimisation pass and faster cold hits. Also cuts the git
//             repo and VPS disk footprint.

const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const DIR = path.join(__dirname, "..", "public", "uploads", "products");
const MAX = 1024;
const QUALITY = 82;

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => /\.(jpe?g)$/i.test(f));
  if (files.length === 0) {
    console.log(`No JPEGs under ${DIR}`);
    return;
  }

  let totalBefore = 0;
  let totalAfter = 0;
  let touched = 0;
  let skipped = 0;

  for (const f of files) {
    const src = path.join(DIR, f);
    const before = fs.statSync(src).size;
    totalBefore += before;

    const meta = await sharp(src).metadata();
    const needsResize = (meta.width || 0) > MAX || (meta.height || 0) > MAX;

    // Skip if it's already small AND already a reasonable mozjpeg output.
    // Sharp doesn't expose "was this mozjpeg?", so use a size threshold: any
    // file under 90 KB at ≤1024×1024 is almost certainly already optimised.
    if (!needsResize && before < 90 * 1024) {
      totalAfter += before;
      skipped++;
      continue;
    }

    // Write to a sibling temp file, then rename — never rewrite in place, so
    // a crash mid-encode can't corrupt the source.
    const tmp = src + ".opt.tmp";
    await sharp(src)
      .rotate() // honour EXIF orientation
      .resize(MAX, MAX, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true, chromaSubsampling: "4:2:0" })
      .toFile(tmp);
    fs.renameSync(tmp, src);
    const after = fs.statSync(src).size;
    totalAfter += after;
    touched++;

    console.log(
      `  ${f.padEnd(38)} ${(before/1024).toFixed(0).padStart(6)} KB → ${(after/1024).toFixed(0).padStart(6)} KB` +
      (needsResize ? ` [${meta.width}×${meta.height}→≤${MAX}]` : ""),
    );
  }

  const savedMB = (totalBefore - totalAfter) / (1024 * 1024);
  console.log("");
  console.log(`Optimised ${touched} file(s), skipped ${skipped} already-small.`);
  console.log(`Total: ${(totalBefore/1024/1024).toFixed(1)} MB → ${(totalAfter/1024/1024).toFixed(1)} MB (saved ${savedMB.toFixed(1)} MB)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
