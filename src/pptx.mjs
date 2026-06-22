import PptxGenJS from "pptxgenjs";

const EMU_PER_INCH = 914400;
const DECK_WIDTH_IN = 13.333; // 16:9 default canvas width

/**
 * Build a blank PowerPoint with one full-bleed slide per GIF. The deck's slide
 * size matches the aspect ratio of the first GIF so nothing is letterboxed.
 * PowerPoint plays animated GIFs during a slideshow.
 *
 * @param {Array<{ path: string, width: number, height: number }>} gifs
 * @param {string} out  output .pptx path
 * @returns {Promise<string>} out
 */
export async function buildDeck(gifs, out) {
  if (gifs.length === 0) throw new Error("no GIFs to assemble");

  const aspect = gifs[0].width / gifs[0].height;
  const slideW = DECK_WIDTH_IN;
  const slideH = +(slideW / aspect).toFixed(3);

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "DECK", width: slideW, height: slideH });
  pptx.layout = "DECK";

  for (const gif of gifs) {
    const slide = pptx.addSlide();
    // Contain the GIF within the slide, centred — preserves each scene's own
    // aspect ratio even if it differs from the deck's.
    const g = gif.width / gif.height;
    let w = slideW;
    let h = slideW / g;
    if (h > slideH) {
      h = slideH;
      w = slideH * g;
    }
    slide.addImage({
      path: gif.path,
      x: (slideW - w) / 2,
      y: (slideH - h) / 2,
      w,
      h,
    });
  }

  await pptx.writeFile({ fileName: out });
  return out;
}

export { EMU_PER_INCH };
