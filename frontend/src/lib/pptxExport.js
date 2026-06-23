import pptxgen from 'pptxgenjs';

/**
 * Canvas-coordinate-aware PowerPoint export engine.
 * 
 * Maps from canvas units (960×540) to PowerPoint inches (10″×5.625″).
 * This gives pixel-perfect correspondence between what the user sees 
 * on the canvas and what appears in the exported PPTX.
 * 
 * Scale factors:
 *   X: 10 / 960 = 0.010417 inches per canvas unit
 *   Y: 5.625 / 540 = 0.010417 inches per canvas unit (same, since 16:9)
 */
const PPTX_W = 10;      // inches
const PPTX_H = 5.625;   // inches
const CANVAS_W = 960;
const CANVAS_H = 540;
const SCALE = PPTX_W / CANVAS_W;  // ~0.01042

function toInches(canvasVal) {
  return canvasVal * SCALE;
}

/**
 * Export slides from the canvas editor state to a PPTX file.
 * 
 * @param {Array} slides - Array of slide objects from useSlideEditor state.
 * @param {Object} theme - Theme object from slideThemes.js (used for fallback colors).
 * @param {string} fileName - Output filename.
 */
export async function exportSlidesToPPTX(slides, theme, fileName = 'Presentation.pptx') {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 — but we override below
  pptx.defineLayout({ name: 'CANVAS_16_9', width: PPTX_W, height: PPTX_H });
  pptx.layout = 'CANVAS_16_9';

  for (const slideData of slides) {
    const slide = pptx.addSlide();
    
    // Background
    const bgColor = slideData.backgroundColor || theme?.bg || '0f0f0f';
    slide.background = { color: bgColor };

    for (const el of slideData.elements) {
      const x = toInches(el.x || 0);
      const y = toInches(el.y || 0);
      const w = toInches(el.width || 100);
      const h = toInches(el.height || 50);
      const rotate = el.rotation || 0;

      switch (el.type) {
        case 'text': {
          slide.addText(el.text || '', {
            x,
            y,
            w,
            h,
            rotate,
            fontSize: Math.round((el.fontSize || 20) * 0.75), // px to pt approximation
            fontFace: (el.fontFamily || 'Inter, sans-serif').split(',')[0].trim(),
            color: el.fill || theme?.body || 'c8cdc9',
            bold: (el.fontStyle || '').includes('bold'),
            italic: (el.fontStyle || '').includes('italic'),
            align: el.textAlign || 'left',
            valign: 'top',
            transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
            wrap: true,
          });
          break;
        }

        case 'rect': {
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y,
            w,
            h,
            rotate,
            fill: { color: el.fill || '333333' },
            line: el.stroke ? { color: el.stroke, width: el.strokeWidth || 1 } : undefined,
            rectRadius: el.cornerRadius ? toInches(el.cornerRadius) : undefined,
            transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
          });
          break;
        }

        case 'circle': {
          slide.addShape(pptx.ShapeType.ellipse, {
            x,
            y,
            w,
            h,
            rotate,
            fill: { color: el.fill || '333333' },
            line: el.stroke ? { color: el.stroke, width: el.strokeWidth || 1 } : undefined,
            transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
          });
          break;
        }

        case 'line': {
          slide.addShape(pptx.ShapeType.line, {
            x,
            y,
            w: toInches(el.width || 300),
            h: 0,
            line: { color: el.stroke || 'c8cdc9', width: el.strokeWidth || 2 },
            transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
          });
          break;
        }

        case 'image': {
          if (el.src) {
            const isBase64 = el.src.startsWith('data:');
            slide.addImage({
              ...(isBase64 ? { data: el.src } : { path: el.src }),
              x,
              y,
              w,
              h,
              rotate,
              transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
            });
          }
          break;
        }

        default:
          console.warn(`Unsupported element type for PPTX export: ${el.type}`);
      }
    }
  }

  return pptx.writeFile({ fileName });
}

/**
 * Legacy export function — kept for backward compatibility.
 * @deprecated Use exportSlidesToPPTX instead.
 */
export async function exportToPPTX(slidesData, fileName = 'Presentation.pptx') {
  let pptx = new pptxgen();

  pptx.defineSlideMaster({
    title: 'DEFAULT_MASTER',
    background: { color: 'FFFFFF' },
    slideNumber: { x: '95%', y: '95%' }
  });

  if (!Array.isArray(slidesData)) {
    throw new Error('slidesData must be an array of slide objects');
  }

  for (const slideData of slidesData) {
    const masterOpt = slideData.masterName ? { masterName: slideData.masterName } : { masterName: 'DEFAULT_MASTER' };
    let slide = pptx.addSlide(masterOpt);

    if (slideData.backgroundColor) {
      slide.background = { color: slideData.backgroundColor };
    }
    
    if (slideData.speakerNotes) {
      slide.addNotes(slideData.speakerNotes);
    }
    
    if (slideData.addSlideNumbers) {
      slide.slideNumber = { x: '95%', y: '95%' };
    }

    if (Array.isArray(slideData.elements)) {
      for (const element of slideData.elements) {
        if (!element || !element.type) continue;

        const options = element.options || {};

        switch (element.type) {
          case 'text': {
            if (element.content !== undefined) {
              slide.addText(element.content, options);
            }
            break;
          }
          case 'chart': {
            if (element.chartType && Array.isArray(element.dataSets) && element.dataSets.length > 0) {
              const type = pptx.ChartType[element.chartType];
              if (!type) break;
              const data = element.dataSets.map(dataset => ({
                name: dataset.name || 'Series',
                labels: element.dataLabels || [],
                values: dataset.values || []
              }));
              slide.addChart(type, data, options);
            }
            break;
          }
          case 'shape': {
            if (element.shapeType) {
              const type = pptx.ShapeType[element.shapeType];
              if (!type) break;
              slide.addShape(type, options);
            }
            break;
          }
          case 'image': {
            if (element.src) {
              const isBase64 = String(element.src).startsWith('data:');
              const imageOpts = isBase64 ? { data: element.src, ...options } : { path: element.src, ...options };
              slide.addImage(imageOpts);
            }
            break;
          }
          case 'table': {
            if (Array.isArray(element.rows) && element.rows.length > 0) {
              slide.addTable(element.rows, options);
            }
            break;
          }
          default:
            break;
        }
      }
    }
  }

  return pptx.writeFile({ fileName });
}
