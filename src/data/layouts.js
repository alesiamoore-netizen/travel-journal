export const LAYOUT_CATEGORIES = ['Basic', 'Editorial', 'Grid', 'Text', 'Maps', 'Timeline', 'Shapes', 'Day', 'Food', 'Nature', 'Transit', 'Lodging', 'City', 'Beach', 'Shopping', 'Museum', 'Diary']

// Categories that are themed "quick start" templates (icon + placeholder content),
// as opposed to the blank structural layouts above. Shown alongside the structural
// categories in the same Layouts picker.
export const TEMPLATE_CATEGORIES = ['Day', 'Food', 'Nature', 'Transit', 'Lodging', 'City', 'Beach', 'Shopping', 'Museum', 'Diary']

function doc(text) {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

export const LAYOUTS = [
  // ─── BASIC ─────────────────────────────────────────────────
  {
    id: 'blank',
    name: 'Blank',
    category: 'Basic',
    elements: [],
  },
  {
    id: 'full-photo',
    name: 'Full Photo',
    category: 'Basic',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 12, h: 16 } },
    ],
  },
  {
    id: 'photo-caption',
    name: 'Photo + Caption',
    category: 'Basic',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 12, h: 13 } },
      { type: 'text',  grid: { x: 1, y: 13, w: 10, h: 3  }, data: { textStyle: 'caption', fontSize: 10, color: '#888888' } },
    ],
  },
  {
    id: 'photo-caption-top',
    name: 'Caption + Photo',
    category: 'Basic',
    elements: [
      { type: 'text',  grid: { x: 1, y: 0,  w: 10, h: 3  }, data: { textStyle: 'caption', fontSize: 10, color: '#888888' } },
      { type: 'image', grid: { x: 0, y: 3,  w: 12, h: 13 } },
    ],
  },
  {
    id: 'title-page',
    name: 'Title Page',
    category: 'Basic',
    elements: [
      { type: 'text', grid: { x: 1, y: 5,  w: 10, h: 4 }, data: { textStyle: 'heading', fontSize: 42, color: '#1a1a1a' } },
      { type: 'text', grid: { x: 2, y: 10, w: 8,  h: 2 }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
    ],
  },
  {
    id: 'full-text',
    name: 'Full Text',
    category: 'Basic',
    elements: [
      { type: 'text', grid: { x: 1, y: 1, w: 10, h: 14 } },
    ],
  },
  {
    id: 'chapter-divider',
    name: 'Chapter Divider',
    category: 'Basic',
    elements: [
      { type: 'divider', grid: { x: 2, y: 5,  w: 8,  h: 1  }, data: { style: 'ornate', color: 'accent' } },
      { type: 'text',    grid: { x: 1, y: 6,  w: 10, h: 4  }, data: { textStyle: 'heading', fontSize: 36, color: '#1a1a1a' } },
      { type: 'text',    grid: { x: 2, y: 10, w: 8,  h: 2  }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'divider', grid: { x: 2, y: 12, w: 8,  h: 1  }, data: { style: 'ornate', color: 'accent' } },
    ],
  },

  // ─── EDITORIAL ─────────────────────────────────────────────
  {
    id: 'photo-left',
    name: 'Photo | Text',
    category: 'Editorial',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 6, h: 16 } },
      { type: 'text',  grid: { x: 7, y: 2, w: 4, h: 12 } },
    ],
  },
  {
    id: 'text-photo',
    name: 'Text | Photo',
    category: 'Editorial',
    elements: [
      { type: 'text',  grid: { x: 1, y: 2, w: 4, h: 12 } },
      { type: 'image', grid: { x: 6, y: 0, w: 6, h: 16 } },
    ],
  },
  {
    id: 'hero-story',
    name: 'Hero + Story',
    category: 'Editorial',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 12, h: 9 } },
      { type: 'text',  grid: { x: 1, y: 9, w: 5,  h: 6 } },
      { type: 'text',  grid: { x: 6, y: 9, w: 5,  h: 6 } },
    ],
  },
  {
    id: 'magazine',
    name: 'Magazine',
    category: 'Editorial',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 7, h: 16 } },
      { type: 'text',  grid: { x: 7, y: 1,  w: 5, h: 5  } },
      { type: 'image', grid: { x: 7, y: 6,  w: 5, h: 5  } },
      { type: 'text',  grid: { x: 7, y: 11, w: 5, h: 4  } },
    ],
  },
  {
    id: 'photos-story',
    name: 'Photos + Story',
    category: 'Editorial',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 6,  h: 10 } },
      { type: 'image', grid: { x: 6, y: 0,  w: 6,  h: 10 } },
      { type: 'text',  grid: { x: 1, y: 10, w: 10, h: 5  } },
    ],
  },
  {
    id: 'day-journal',
    name: 'Day Journal',
    category: 'Editorial',
    elements: [
      { type: 'text',  grid: { x: 0, y: 0,  w: 12, h: 2  }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'image', grid: { x: 0, y: 2,  w: 6,  h: 8  } },
      { type: 'text',  grid: { x: 6, y: 2,  w: 6,  h: 8  }, data: { textStyle: 'body', fontSize: 13 } },
      { type: 'text',  grid: { x: 0, y: 10, w: 12, h: 6  }, data: { textStyle: 'body', fontSize: 15 } },
    ],
  },
  {
    id: 'photo-essay',
    name: 'Photo Essay',
    category: 'Editorial',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 8, h: 10 } },
      { type: 'text',  grid: { x: 8, y: 0,  w: 4, h: 10 } },
      { type: 'image', grid: { x: 0, y: 10, w: 4, h: 6  } },
      { type: 'image', grid: { x: 4, y: 10, w: 4, h: 6  } },
      { type: 'text',  grid: { x: 8, y: 10, w: 4, h: 6  } },
    ],
  },
  {
    id: 'long-story',
    name: 'Long Story',
    category: 'Editorial',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 5, h: 7  } },
      { type: 'text',  grid: { x: 5, y: 0,  w: 7, h: 5  } },
      { type: 'text',  grid: { x: 0, y: 7,  w: 7, h: 9  } },
      { type: 'image', grid: { x: 7, y: 5,  w: 5, h: 11 } },
    ],
  },
  {
    id: 'story-bottom-photo',
    name: 'Story + Photo',
    category: 'Editorial',
    elements: [
      { type: 'text',  grid: { x: 1, y: 1, w: 10, h: 8 } },
      { type: 'image', grid: { x: 0, y: 9, w: 12, h: 7 } },
    ],
  },
  {
    id: 'text-three-photos-bottom',
    name: 'Story + 3 Photos',
    category: 'Editorial',
    elements: [
      { type: 'text',  grid: { x: 1, y: 0, w: 10, h: 9 } },
      { type: 'image', grid: { x: 0, y: 9, w: 4,  h: 7 } },
      { type: 'image', grid: { x: 4, y: 9, w: 4,  h: 7 } },
      { type: 'image', grid: { x: 8, y: 9, w: 4,  h: 7 } },
    ],
  },
  {
    id: 'text-two-photos-bottom',
    name: 'Story + 2 Photos',
    category: 'Editorial',
    elements: [
      { type: 'text',  grid: { x: 1, y: 0, w: 10, h: 9  } },
      { type: 'image', grid: { x: 0, y: 9, w: 6,  h: 7  } },
      { type: 'image', grid: { x: 6, y: 9, w: 6,  h: 7  } },
    ],
  },
  {
    id: 'heading-two-col',
    name: 'Heading + 2 Columns',
    category: 'Editorial',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 3  }, data: { textStyle: 'heading', fontSize: 30, color: '#1a1a1a' } },
      { type: 'text', grid: { x: 0, y: 3, w: 6,  h: 13 }, data: { textStyle: 'body', fontSize: 14 } },
      { type: 'text', grid: { x: 6, y: 3, w: 6,  h: 13 }, data: { textStyle: 'body', fontSize: 14 } },
    ],
  },
  {
    id: 'two-col-photo-below',
    name: '2 Columns + Photo',
    category: 'Editorial',
    elements: [
      { type: 'text',  grid: { x: 0, y: 0, w: 6,  h: 9 }, data: { textStyle: 'body', fontSize: 14 } },
      { type: 'text',  grid: { x: 6, y: 0, w: 6,  h: 9 }, data: { textStyle: 'body', fontSize: 14 } },
      { type: 'image', grid: { x: 0, y: 9, w: 12, h: 7 } },
    ],
  },
  {
    id: 'text-wide-photo-col',
    name: 'Story + Photo Side',
    category: 'Editorial',
    elements: [
      { type: 'text',  grid: { x: 0, y: 0, w: 7, h: 16 }, data: { textStyle: 'body', fontSize: 14 } },
      { type: 'image', grid: { x: 7, y: 0, w: 5, h: 16 } },
    ],
  },
  {
    id: 'day-three-photos',
    name: 'Day + 3 Photos',
    category: 'Editorial',
    elements: [
      { type: 'text',  grid: { x: 0, y: 0,  w: 12, h: 2  }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'image', grid: { x: 0, y: 2,  w: 4,  h: 6  } },
      { type: 'image', grid: { x: 4, y: 2,  w: 4,  h: 6  } },
      { type: 'image', grid: { x: 8, y: 2,  w: 4,  h: 6  } },
      { type: 'text',  grid: { x: 1, y: 8,  w: 10, h: 8  }, data: { textStyle: 'body', fontSize: 14 } },
    ],
  },
  {
    id: 'photo-inset-story',
    name: 'Story + Photo Inset',
    category: 'Editorial',
    elements: [
      { type: 'text',  grid: { x: 0, y: 0,  w: 12, h: 3  }, data: { textStyle: 'heading', fontSize: 28, color: '#1a1a1a' } },
      { type: 'image', grid: { x: 7, y: 3,  w: 5,  h: 6  } },
      { type: 'text',  grid: { x: 0, y: 3,  w: 7,  h: 12 }, data: { textStyle: 'body', fontSize: 14 } },
      { type: 'text',  grid: { x: 7, y: 9,  w: 5,  h: 7  }, data: { textStyle: 'body', fontSize: 14 } },
    ],
  },

  // ─── GRID ──────────────────────────────────────────────────
  {
    id: 'two-photos',
    name: 'Two Photos',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 6, h: 16 } },
      { type: 'image', grid: { x: 6, y: 0, w: 6, h: 16 } },
    ],
  },
  {
    id: 'four-grid',
    name: 'Four Photos',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 6, h: 8 } },
      { type: 'image', grid: { x: 6, y: 0, w: 6, h: 8 } },
      { type: 'image', grid: { x: 0, y: 8, w: 6, h: 8 } },
      { type: 'image', grid: { x: 6, y: 8, w: 6, h: 8 } },
    ],
  },
  {
    id: 'feature-split',
    name: 'Feature Split',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 8,  h: 16 } },
      { type: 'image', grid: { x: 8, y: 0, w: 4,  h: 8  } },
      { type: 'image', grid: { x: 8, y: 8, w: 4,  h: 8  } },
    ],
  },
  {
    id: 'feature-split-left',
    name: 'Split Left',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 4, h: 8  } },
      { type: 'image', grid: { x: 0, y: 8, w: 4, h: 8  } },
      { type: 'image', grid: { x: 4, y: 0, w: 8, h: 16 } },
    ],
  },
  {
    id: 'three-stack',
    name: 'Three Stack',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 12, h: 6 } },
      { type: 'image', grid: { x: 0, y: 6,  w: 6,  h: 10 } },
      { type: 'image', grid: { x: 6, y: 6,  w: 6,  h: 10 } },
    ],
  },
  {
    id: 'three-col',
    name: 'Three Column',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 4, h: 16 } },
      { type: 'image', grid: { x: 4, y: 0, w: 4, h: 16 } },
      { type: 'image', grid: { x: 8, y: 0, w: 4, h: 16 } },
    ],
  },
  {
    id: 'mosaic',
    name: 'Photo Mosaic',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 7, h: 9  } },
      { type: 'image', grid: { x: 7, y: 0,  w: 5, h: 4  } },
      { type: 'image', grid: { x: 7, y: 4,  w: 5, h: 5  } },
      { type: 'image', grid: { x: 0, y: 9,  w: 4, h: 7  } },
      { type: 'image', grid: { x: 4, y: 9,  w: 8, h: 7  } },
    ],
  },
  {
    id: 'six-grid',
    name: 'Six Photos',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 4, h: 8 } },
      { type: 'image', grid: { x: 4, y: 0, w: 4, h: 8 } },
      { type: 'image', grid: { x: 8, y: 0, w: 4, h: 8 } },
      { type: 'image', grid: { x: 0, y: 8, w: 4, h: 8 } },
      { type: 'image', grid: { x: 4, y: 8, w: 4, h: 8 } },
      { type: 'image', grid: { x: 8, y: 8, w: 4, h: 8 } },
    ],
  },
  {
    id: 'banner-grid',
    name: 'Banner + Grid',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 12, h: 7 } },
      { type: 'image', grid: { x: 0, y: 7, w: 6,  h: 5 } },
      { type: 'image', grid: { x: 6, y: 7, w: 6,  h: 5 } },
      { type: 'text',  grid: { x: 1, y: 12, w: 10, h: 4 } },
    ],
  },

  // ─── GRID (photo combination additions) ───────────────────
  {
    id: 'large-three-strip',
    name: 'Feature + 3 Strip',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 12, h: 10 } },
      { type: 'image', grid: { x: 0, y: 10, w: 4, h: 6  } },
      { type: 'image', grid: { x: 4, y: 10, w: 4, h: 6  } },
      { type: 'image', grid: { x: 8, y: 10, w: 4, h: 6  } },
    ],
  },
  {
    id: 'three-across-caption',
    name: '3 Portrait + Caption',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 4,  h: 13 } },
      { type: 'image', grid: { x: 4, y: 0, w: 4,  h: 13 } },
      { type: 'image', grid: { x: 8, y: 0, w: 4,  h: 13 } },
      { type: 'text',  grid: { x: 1, y: 13, w: 10, h: 3 }, data: { textStyle: 'caption', fontSize: 10, color: '#888888' } },
    ],
  },
  {
    id: 'five-mosaic-v2',
    name: 'Five Photos',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 4, h: 7 } },
      { type: 'image', grid: { x: 4, y: 0,  w: 4, h: 7 } },
      { type: 'image', grid: { x: 8, y: 0,  w: 4, h: 7 } },
      { type: 'image', grid: { x: 0, y: 7,  w: 6, h: 9 } },
      { type: 'image', grid: { x: 6, y: 7,  w: 6, h: 9 } },
    ],
  },
  {
    id: 'feature-left-strip',
    name: 'Feature + Right Strip',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 7, h: 16 } },
      { type: 'image', grid: { x: 7, y: 0, w: 5, h: 5  } },
      { type: 'image', grid: { x: 7, y: 5, w: 5, h: 5  } },
      { type: 'image', grid: { x: 7, y: 10, w: 5, h: 6 } },
    ],
  },
  {
    id: 'pair-text',
    name: 'Photo Pair + Caption',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 6, h: 12 } },
      { type: 'image', grid: { x: 6, y: 0,  w: 6, h: 12 } },
      { type: 'text',  grid: { x: 1, y: 12, w: 10, h: 4 }, data: { textStyle: 'caption', fontSize: 10, color: '#888888' } },
    ],
  },
  {
    id: 'stagger-four',
    name: 'Staggered Four',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 7, h: 8 } },
      { type: 'image', grid: { x: 7, y: 0,  w: 5, h: 5 } },
      { type: 'image', grid: { x: 7, y: 5,  w: 5, h: 5 } },
      { type: 'image', grid: { x: 0, y: 8,  w: 7, h: 8 } },
    ],
  },
  {
    id: 'four-landscape',
    name: 'Four Landscape',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 12, h: 4 } },
      { type: 'image', grid: { x: 0, y: 4,  w: 12, h: 4 } },
      { type: 'image', grid: { x: 0, y: 8,  w: 12, h: 4 } },
      { type: 'image', grid: { x: 0, y: 12, w: 12, h: 4 } },
    ],
  },
  {
    id: 'banner-trio',
    name: 'Banner + Trio',
    category: 'Grid',
    elements: [
      { type: 'text',  grid: { x: 0, y: 0,  w: 12, h: 2  }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'image', grid: { x: 0, y: 2,  w: 12, h: 7  } },
      { type: 'image', grid: { x: 0, y: 9,  w: 4,  h: 7  } },
      { type: 'image', grid: { x: 4, y: 9,  w: 4,  h: 7  } },
      { type: 'image', grid: { x: 8, y: 9,  w: 4,  h: 7  } },
    ],
  },

  // ─── GRID (square-format additions) ────────────────────────
  {
    id: 'square-2x2',
    name: 'Square 2×2',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 6, h: 7 } },
      { type: 'image', grid: { x: 6, y: 0, w: 6, h: 7 } },
      { type: 'image', grid: { x: 0, y: 7, w: 6, h: 7 } },
      { type: 'image', grid: { x: 6, y: 7, w: 6, h: 7 } },
      { type: 'text',  grid: { x: 1, y: 14, w: 10, h: 2 }, data: { textStyle: 'caption', fontSize: 10, color: '#888888' } },
    ],
  },
  {
    id: 'square-3x3',
    name: 'Square 3×3',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 4, h: 5 } },
      { type: 'image', grid: { x: 4, y: 0, w: 4, h: 5 } },
      { type: 'image', grid: { x: 8, y: 0, w: 4, h: 5 } },
      { type: 'image', grid: { x: 0, y: 5, w: 4, h: 5 } },
      { type: 'image', grid: { x: 4, y: 5, w: 4, h: 5 } },
      { type: 'image', grid: { x: 8, y: 5, w: 4, h: 5 } },
      { type: 'image', grid: { x: 0, y: 10, w: 4, h: 5 } },
      { type: 'image', grid: { x: 4, y: 10, w: 4, h: 5 } },
      { type: 'image', grid: { x: 8, y: 10, w: 4, h: 5 } },
      { type: 'text',  grid: { x: 1, y: 15, w: 10, h: 1 }, data: { textStyle: 'caption', fontSize: 9, color: '#888888' } },
    ],
  },
  {
    id: 'contact-sheet',
    name: 'Contact Sheet',
    category: 'Grid',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 3, h: 4 } },
      { type: 'image', grid: { x: 3, y: 0, w: 3, h: 4 } },
      { type: 'image', grid: { x: 6, y: 0, w: 3, h: 4 } },
      { type: 'image', grid: { x: 9, y: 0, w: 3, h: 4 } },
      { type: 'image', grid: { x: 0, y: 4, w: 3, h: 4 } },
      { type: 'image', grid: { x: 3, y: 4, w: 3, h: 4 } },
      { type: 'image', grid: { x: 6, y: 4, w: 3, h: 4 } },
      { type: 'image', grid: { x: 9, y: 4, w: 3, h: 4 } },
      { type: 'image', grid: { x: 0, y: 8, w: 3, h: 4 } },
      { type: 'image', grid: { x: 3, y: 8, w: 3, h: 4 } },
      { type: 'image', grid: { x: 6, y: 8, w: 3, h: 4 } },
      { type: 'image', grid: { x: 9, y: 8, w: 3, h: 4 } },
      { type: 'text',  grid: { x: 0, y: 12, w: 12, h: 4 }, data: { textStyle: 'caption', fontSize: 9, color: '#888888' } },
    ],
  },

  // ─── TEXT ──────────────────────────────────────────────────
  {
    id: 'chapter-opener',
    name: 'Chapter Opener',
    category: 'Text',
    elements: [
      { type: 'text', grid: { x: 0, y: 3, w: 12, h: 6 }, data: { textStyle: 'heading', fontSize: 48, color: '#1a1a1a' } },
      { type: 'text', grid: { x: 2, y: 11, w: 8, h: 3 }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
    ],
  },
  {
    id: 'journal-entry',
    name: 'Journal Entry',
    category: 'Text',
    elements: [
      { type: 'text', grid: { x: 1, y: 0,  w: 10, h: 2  }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'text', grid: { x: 1, y: 2,  w: 10, h: 13 }, data: { textStyle: 'body', fontSize: 15, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'two-column-text',
    name: 'Two Columns',
    category: 'Text',
    elements: [
      { type: 'text', grid: { x: 0,  y: 0, w: 6, h: 16 }, data: { textStyle: 'body', fontSize: 14 } },
      { type: 'text', grid: { x: 6,  y: 0, w: 6, h: 16 }, data: { textStyle: 'body', fontSize: 14 } },
    ],
  },
  {
    id: 'itinerary',
    name: 'Itinerary',
    category: 'Text',
    elements: [
      { type: 'text', grid: { x: 0, y: 0,  w: 12, h: 3  }, data: { textStyle: 'heading', fontSize: 32, color: '#1a1a1a' } },
      { type: 'text', grid: { x: 0, y: 3,  w: 6,  h: 13 }, data: { textStyle: 'body', fontSize: 13 } },
      { type: 'text', grid: { x: 6, y: 3,  w: 6,  h: 13 }, data: { textStyle: 'body', fontSize: 13 } },
    ],
  },
  {
    id: 'quote-photo',
    name: 'Quote + Photo',
    category: 'Text',
    elements: [
      { type: 'text',  grid: { x: 1, y: 1, w: 10, h: 7 }, data: { textStyle: 'pullquote', fontSize: 26, color: '#3a3a3a' } },
      { type: 'image', grid: { x: 0, y: 8, w: 12, h: 8 } },
    ],
  },
  {
    id: 'pull-quote-story',
    name: 'Pull Quote + Story',
    category: 'Text',
    elements: [
      { type: 'text', grid: { x: 1, y: 0, w: 10, h: 5  }, data: { textStyle: 'pullquote', fontSize: 22, color: '#c0813a' } },
      { type: 'divider', grid: { x: 2, y: 5, w: 8, h: 1 } },
      { type: 'text', grid: { x: 1, y: 6, w: 10, h: 10 }, data: { textStyle: 'body', fontSize: 14 } },
    ],
  },
  {
    id: 'dear-diary',
    name: 'Dear Diary',
    category: 'Text',
    elements: [
      { type: 'text', grid: { x: 1, y: 0,  w: 10, h: 2  }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'text', grid: { x: 1, y: 2,  w: 10, h: 3  }, data: { textStyle: 'heading', fontSize: 30, color: '#1a1a1a' } },
      { type: 'text', grid: { x: 0, y: 5,  w: 6,  h: 11 }, data: { textStyle: 'body', fontSize: 14 } },
      { type: 'text', grid: { x: 6, y: 5,  w: 6,  h: 11 }, data: { textStyle: 'body', fontSize: 14 } },
    ],
  },

  // ─── MAPS ──────────────────────────────────────────────────
  {
    id: 'map-story',
    name: 'Map + Story',
    category: 'Maps',
    elements: [
      { type: 'map',  grid: { x: 0, y: 0, w: 12, h: 9 } },
      { type: 'text', grid: { x: 1, y: 9, w: 10, h: 6 } },
    ],
  },
  {
    id: 'map-sidebar',
    name: 'Map Sidebar',
    category: 'Maps',
    elements: [
      { type: 'text', grid: { x: 0, y: 1, w: 5, h: 13 } },
      { type: 'map',  grid: { x: 5, y: 0, w: 7, h: 9  } },
      { type: 'text', grid: { x: 5, y: 9, w: 7, h: 6  } },
    ],
  },
  {
    id: 'map-photos',
    name: 'Map + Photos',
    category: 'Maps',
    elements: [
      { type: 'map',   grid: { x: 0, y: 0, w: 12, h: 8 } },
      { type: 'image', grid: { x: 0, y: 8, w: 6,  h: 8 } },
      { type: 'image', grid: { x: 6, y: 8, w: 6,  h: 8 } },
    ],
  },
  {
    id: 'full-map',
    name: 'Full Map',
    category: 'Maps',
    elements: [
      { type: 'map', grid: { x: 0, y: 0, w: 12, h: 16 } },
    ],
  },

  // ─── TIMELINE ──────────────────────────────────────────────
  {
    id: 'two-days',
    name: 'Two Days',
    category: 'Timeline',
    elements: [
      { type: 'text',    grid: { x: 0, y: 0,  w: 12, h: 2 }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'image',   grid: { x: 0, y: 2,  w: 12, h: 5 } },
      { type: 'text',    grid: { x: 1, y: 7,  w: 10, h: 2 }, data: { textStyle: 'body', fontSize: 13 } },
      { type: 'divider', grid: { x: 0, y: 9,  w: 12, h: 1 } },
      { type: 'text',    grid: { x: 0, y: 10, w: 12, h: 2 }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'image',   grid: { x: 0, y: 12, w: 12, h: 4 } },
    ],
  },
  {
    id: 'timeline-3',
    name: 'Three Entries',
    category: 'Timeline',
    elements: [
      { type: 'text',    grid: { x: 0, y: 0,  w: 12, h: 2 }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'text',    grid: { x: 1, y: 2,  w: 11, h: 3 }, data: { textStyle: 'body', fontSize: 13 } },
      { type: 'divider', grid: { x: 0, y: 5,  w: 12, h: 1 } },
      { type: 'text',    grid: { x: 0, y: 6,  w: 12, h: 2 }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'text',    grid: { x: 1, y: 8,  w: 11, h: 3 }, data: { textStyle: 'body', fontSize: 13 } },
      { type: 'divider', grid: { x: 0, y: 11, w: 12, h: 1 } },
      { type: 'text',    grid: { x: 0, y: 12, w: 12, h: 2 }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'text',    grid: { x: 1, y: 14, w: 11, h: 2 }, data: { textStyle: 'body', fontSize: 13 } },
    ],
  },
  {
    id: 'timeline-photo-alt',
    name: 'Photo Journey',
    category: 'Timeline',
    elements: [
      { type: 'text',    grid: { x: 0, y: 0,  w: 5,  h: 2 }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'image',   grid: { x: 0, y: 2,  w: 5,  h: 6 } },
      { type: 'text',    grid: { x: 5, y: 0,  w: 7,  h: 8 }, data: { textStyle: 'body', fontSize: 13 } },
      { type: 'divider', grid: { x: 0, y: 8,  w: 12, h: 1 } },
      { type: 'text',    grid: { x: 7, y: 9,  w: 5,  h: 2 }, data: { textStyle: 'dateline', fontSize: 11, color: '#c0813a' } },
      { type: 'text',    grid: { x: 0, y: 9,  w: 7,  h: 6 }, data: { textStyle: 'body', fontSize: 13 } },
      { type: 'image',   grid: { x: 7, y: 11, w: 5,  h: 5 } },
    ],
  },
  {
    id: 'highlights',
    name: 'Trip Highlights',
    category: 'Timeline',
    elements: [
      { type: 'text',    grid: { x: 0, y: 0,  w: 12, h: 3 }, data: { textStyle: 'heading', fontSize: 28, color: '#1a1a1a' } },
      { type: 'divider', grid: { x: 0, y: 3,  w: 12, h: 1 } },
      { type: 'image',   grid: { x: 0, y: 4,  w: 4,  h: 5 } },
      { type: 'text',    grid: { x: 4, y: 4,  w: 8,  h: 2 }, data: { textStyle: 'dateline', fontSize: 10, color: '#c0813a' } },
      { type: 'text',    grid: { x: 4, y: 6,  w: 8,  h: 3 }, data: { textStyle: 'body', fontSize: 12 } },
      { type: 'divider', grid: { x: 0, y: 9,  w: 12, h: 1 } },
      { type: 'image',   grid: { x: 8, y: 10, w: 4,  h: 5 } },
      { type: 'text',    grid: { x: 0, y: 10, w: 8,  h: 2 }, data: { textStyle: 'dateline', fontSize: 10, color: '#c0813a' } },
      { type: 'text',    grid: { x: 0, y: 12, w: 8,  h: 3 }, data: { textStyle: 'body', fontSize: 12 } },
    ],
  },

  // ─── SHAPES ────────────────────────────────────────────────
  {
    id: 'diamond-grid-4',
    name: 'Diamond Grid',
    category: 'Shapes',
    elements: [
      { type: 'image', grid: { x: 1,  y: 0,  w: 4, h: 5 }, data: { clipShape: 'diamond' } },
      { type: 'image', grid: { x: 5,  y: 0,  w: 4, h: 5 }, data: { clipShape: 'diamond' } },
      { type: 'image', grid: { x: -1, y: 4,  w: 4, h: 5 }, data: { clipShape: 'diamond' } },
      { type: 'image', grid: { x: 3,  y: 4,  w: 4, h: 5 }, data: { clipShape: 'diamond' } },
      { type: 'image', grid: { x: 7,  y: 4,  w: 4, h: 5 }, data: { clipShape: 'diamond' } },
      { type: 'image', grid: { x: 1,  y: 8,  w: 4, h: 5 }, data: { clipShape: 'diamond' } },
      { type: 'image', grid: { x: 5,  y: 8,  w: 4, h: 5 }, data: { clipShape: 'diamond' } },
      { type: 'text',  grid: { x: 2,  y: 13, w: 8, h: 3 }, data: { textStyle: 'caption', fontSize: 10, color: '#888888' } },
    ],
  },
  {
    id: 'circle-inset',
    name: 'Photo + Circle Inset',
    category: 'Shapes',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 12, h: 12 } },
      { type: 'image', grid: { x: 7, y: 8,  w: 5,  h: 6  }, data: { clipShape: 'circle' } },
      { type: 'text',  grid: { x: 0, y: 12, w: 7,  h: 4  } },
    ],
  },
  {
    id: 'circle-trio',
    name: 'Three Circles',
    category: 'Shapes',
    elements: [
      { type: 'image', grid: { x: 0, y: 3,  w: 4, h: 5 }, data: { clipShape: 'circle' } },
      { type: 'image', grid: { x: 4, y: 1,  w: 4, h: 5 }, data: { clipShape: 'circle' } },
      { type: 'image', grid: { x: 8, y: 3,  w: 4, h: 5 }, data: { clipShape: 'circle' } },
      { type: 'text',  grid: { x: 1, y: 9,  w: 10, h: 4 }, data: { textStyle: 'heading', fontSize: 22, color: '#1a1a1a' } },
      { type: 'text',  grid: { x: 2, y: 13, w: 8,  h: 3 }, data: { textStyle: 'body', fontSize: 11 } },
    ],
  },
  {
    id: 'oval-feature',
    name: 'Oval Feature',
    category: 'Shapes',
    elements: [
      { type: 'image', grid: { x: 1, y: 1,  w: 10, h: 9 }, data: { clipShape: 'oval' } },
      { type: 'text',  grid: { x: 1, y: 10, w: 10, h: 3 }, data: { textStyle: 'heading', fontSize: 24, color: '#1a1a1a' } },
      { type: 'text',  grid: { x: 2, y: 13, w: 8,  h: 3 }, data: { textStyle: 'caption', fontSize: 10, color: '#888888' } },
    ],
  },
  {
    id: 'diamond-2-text',
    name: 'Two Diamonds + Text',
    category: 'Shapes',
    elements: [
      { type: 'image', grid: { x: 0, y: 1,  w: 5, h: 7 }, data: { clipShape: 'diamond' } },
      { type: 'image', grid: { x: 5, y: 4,  w: 5, h: 7 }, data: { clipShape: 'diamond' } },
      { type: 'text',  grid: { x: 0, y: 9,  w: 12, h: 4 }, data: { textStyle: 'heading', fontSize: 22, color: '#1a1a1a' } },
      { type: 'text',  grid: { x: 1, y: 13, w: 10, h: 3 }, data: { textStyle: 'body', fontSize: 11 } },
    ],
  },
  {
    id: 'hex-cluster',
    name: 'Hexagon Cluster',
    category: 'Shapes',
    elements: [
      { type: 'image', grid: { x: 2,  y: 0,  w: 4, h: 5 }, data: { clipShape: 'hexagon' } },
      { type: 'image', grid: { x: 6,  y: 0,  w: 4, h: 5 }, data: { clipShape: 'hexagon' } },
      { type: 'image', grid: { x: 4,  y: 5,  w: 4, h: 5 }, data: { clipShape: 'hexagon' } },
      { type: 'text',  grid: { x: 1,  y: 10, w: 10, h: 3 }, data: { textStyle: 'heading', fontSize: 22, color: '#1a1a1a' } },
      { type: 'text',  grid: { x: 2,  y: 13, w: 8,  h: 3 }, data: { textStyle: 'caption', fontSize: 10, color: '#888888' } },
    ],
  },

  // ─── DAY ───────────────────────────────────────────────────
  {
    id: 'day', name: 'Day Summary', category: 'Day', icon: '🌅',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 12, h: 9 }, data: { fit: 'cover' } },
      { type: 'sticker', grid: { x: 9, y: 0, w: 3, h: 3 }, data: { stickerId: 'sun', color: '#f2b134', rotation: 15, opacity: 0.9 } },
      { type: 'text', grid: { x: 0, y: 9, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Day Summary'), fontFamily: 'Georgia', fontSize: 28, color: '#1a1a1a' } },
      { type: 'divider', grid: { x: 1, y: 11, w: 10, h: 1 }, data: { style: 'wave', color: 'accent' } },
      { type: 'text', grid: { x: 0, y: 12, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Location · Date'), fontFamily: 'Georgia', fontSize: 11, color: '#c0813a' } },
      { type: 'text', grid: { x: 0, y: 13, w: 12, h: 3 }, data: { textStyle: 'body', content: doc('Reflections on the day…'), fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
    ],
  },

  // ─── FOOD ──────────────────────────────────────────────────
  {
    id: 'restaurant', name: 'Restaurant', category: 'Food', icon: '🍽️',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Restaurant Name'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'text', grid: { x: 0, y: 2, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Location · Cuisine'), fontFamily: 'Georgia', fontSize: 11, color: '#c0813a' } },
      { type: 'image', grid: { x: 0, y: 3, w: 7, h: 9 }, data: { fit: 'cover', rotation: -2 } },
      { type: 'image', grid: { x: 7, y: 3, w: 5, h: 4 }, data: { fit: 'cover', rotation: 3, shadow: 'soft' } },
      { type: 'sticker', grid: { x: 8, y: 7, w: 4, h: 2 }, data: { stickerId: 'ticket', color: '#c0813a', rotation: -6, opacity: 0.9 } },
      { type: 'text', grid: { x: 0, y: 12, w: 12, h: 4 }, data: { textStyle: 'body', content: doc('What I ordered… how it tasted… would I come back?'), fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'cafe', name: 'Coffee Stop', category: 'Food', icon: '☕',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Coffee Stop'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'image', grid: { x: 3, y: 2, w: 6, h: 7 }, data: { fit: 'cover', clipShape: 'circle' } },
      { type: 'sticker', grid: { x: 7, y: 7, w: 2, h: 2 }, data: { stickerId: 'heart', color: '#c0813a', rotation: 10, opacity: 0.85 } },
      { type: 'text', grid: { x: 0, y: 9, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Café · What I ordered'), fontFamily: 'Georgia', fontSize: 11, color: '#c0813a' } },
      { type: 'divider', grid: { x: 2, y: 10, w: 8, h: 1 }, data: { style: 'dotted', color: 'accent' } },
      { type: 'text', grid: { x: 1, y: 11, w: 10, h: 4 }, data: { textStyle: 'body', content: doc('The vibe, the drink, would I go back?'), fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'market', name: 'Market Find', category: 'Shopping', icon: '🛍️',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Market Find'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'sticker', grid: { x: 2, y: 0, w: 4, h: 2 }, data: { stickerId: 'tape', color: '#c0813a', rotation: -4, opacity: 0.9 } },
      { type: 'image', grid: { x: 0, y: 2, w: 5, h: 6 }, data: { fit: 'cover', clipShape: 'diamond', rotation: -4 } },
      { type: 'image', grid: { x: 6, y: 3, w: 5, h: 6 }, data: { fit: 'cover', clipShape: 'diamond', rotation: 4 } },
      { type: 'text', grid: { x: 1, y: 10, w: 10, h: 5 }, data: { textStyle: 'body', content: doc('What I bought, haggling stories, the vendor…'), fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
    ],
  },

  // ─── NATURE ────────────────────────────────────────────────
  {
    id: 'hike', name: 'Hike / Walk', category: 'Nature', icon: '🥾',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Trail Name'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'map', grid: { x: 0, y: 2, w: 12, h: 7 }, data: { tileStyle: 'voyager', showRoute: true, showPins: true, mode: 'route' } },
      { type: 'sticker', grid: { x: 9, y: 2, w: 3, h: 3 }, data: { stickerId: 'compass', color: '#ffffff', rotation: -10, opacity: 0.95 } },
      { type: 'divider', grid: { x: 0, y: 9, w: 12, h: 1 }, data: { style: 'line', color: 'accent' } },
      { type: 'text', grid: { x: 0, y: 10, w: 12, h: 6 }, data: { textStyle: 'body', content: doc('Distance · Elevation · Highlights…'), fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'sunset', name: 'Sunrise / Sunset', category: 'Nature', icon: '🌇',
    elements: [
      { type: 'image', grid: { x: 0, y: 0, w: 12, h: 10 }, data: { fit: 'cover' } },
      { type: 'sticker', grid: { x: 0, y: 7, w: 3, h: 3 }, data: { stickerId: 'sun', color: '#f2764e', rotation: -20, opacity: 0.85 } },
      { type: 'weather', grid: { x: 0, y: 10, w: 5, h: 4 }, data: {} },
      { type: 'text', grid: { x: 5, y: 10, w: 7, h: 4 }, data: { textStyle: 'body', content: doc('Colors in the sky, how it felt to watch…'), fontFamily: 'Georgia', fontSize: 12, color: '#2c2c2c' } },
    ],
  },

  // ─── TRANSIT ───────────────────────────────────────────────
  {
    id: 'transit', name: 'Transit', category: 'Transit', icon: '✈️',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Getting There'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'map', grid: { x: 0, y: 2, w: 12, h: 8 }, data: { tileStyle: 'minimal', mode: 'route', showRoute: true, showPins: true } },
      { type: 'sticker', grid: { x: 5, y: 4, w: 3, h: 3 }, data: { stickerId: 'plane', color: '#ffffff', rotation: 20, opacity: 0.9 } },
      { type: 'text', grid: { x: 0, y: 10, w: 6, h: 6 }, data: { textStyle: 'body', content: doc('From → To\nDeparture · Arrival\nNotes…'), fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
      { type: 'image', grid: { x: 6, y: 10, w: 6, h: 6 }, data: { fit: 'cover', clipShape: 'oval' } },
    ],
  },
  {
    id: 'flight', name: 'Flight Details', category: 'Transit', icon: '🎫',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Flight Details'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'sticker', grid: { x: 5, y: 0, w: 2, h: 2 }, data: { stickerId: 'plane', color: '#c0813a', rotation: -15, opacity: 0.9 } },
      { type: 'keepsake', grid: { x: 0, y: 2, w: 6, h: 6 }, data: { label: 'Boarding pass', hint: 'Tape or glue here', style: 'dashed', borderColor: 'accent' } },
      { type: 'text', grid: { x: 6, y: 2, w: 6, h: 6 }, data: { textStyle: 'body', content: doc('Flight number\nSeat\nDeparture → Arrival'), fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
      { type: 'map', grid: { x: 0, y: 8, w: 12, h: 8 }, data: { tileStyle: 'minimal', mode: 'route', showRoute: true, showPins: true } },
    ],
  },

  // ─── LODGING ───────────────────────────────────────────────
  {
    id: 'hotel', name: 'Where We Stayed', category: 'Lodging', icon: '🛎️',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Where We Stayed'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'image', grid: { x: 0, y: 2, w: 12, h: 9 }, data: { fit: 'cover' } },
      { type: 'image', grid: { x: 8, y: 7, w: 4, h: 4 }, data: { fit: 'cover', clipShape: 'circle', borderStyle: 'thick' } },
      { type: 'text', grid: { x: 0, y: 11, w: 12, h: 5 }, data: { textStyle: 'body', content: doc('Name\nAddress\nWhat we liked…'), fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'view-from-room', name: 'View From the Room', category: 'Lodging', icon: '🪟',
    elements: [
      { type: 'text', grid: { x: 1, y: 0, w: 10, h: 2 }, data: { textStyle: 'heading', content: doc('The View'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'image', grid: { x: 1, y: 2, w: 10, h: 11 }, data: { fit: 'cover', clipShape: 'arch', shadow: 'soft' } },
      { type: 'text', grid: { x: 1, y: 13, w: 10, h: 3 }, data: { textStyle: 'caption', content: doc('The view from our window…'), fontFamily: 'Georgia', fontSize: 10, color: '#888888' } },
    ],
  },

  // ─── CITY ──────────────────────────────────────────────────
  {
    id: 'city-walk', name: 'City Walk', category: 'City', icon: '🚶',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('City Walk'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'map', grid: { x: 0, y: 2, w: 12, h: 7 }, data: { tileStyle: 'voyager', mode: 'route', showRoute: true, showPins: true } },
      { type: 'sticker', grid: { x: 0, y: 2, w: 2, h: 3 }, data: { stickerId: 'pin', color: '#ffffff', rotation: -8, opacity: 0.95 } },
      { type: 'text', grid: { x: 0, y: 9, w: 12, h: 2 }, data: { textStyle: 'caption', content: doc('Highlights along the way…'), fontFamily: 'Georgia', fontSize: 10, color: '#888888' } },
      { type: 'image', grid: { x: 0, y: 11, w: 4, h: 5 }, data: { fit: 'cover', clipShape: 'hexagon', rotation: -4 } },
      { type: 'image', grid: { x: 4, y: 11, w: 4, h: 5 }, data: { fit: 'cover', clipShape: 'hexagon' } },
      { type: 'image', grid: { x: 8, y: 11, w: 4, h: 5 }, data: { fit: 'cover', clipShape: 'hexagon', rotation: 4 } },
    ],
  },
  {
    id: 'landmark', name: 'Landmark Visit', category: 'City', icon: '🏛️',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Landmark Name'), fontFamily: 'Georgia', fontSize: 28, color: '#1a1a1a' } },
      { type: 'image', grid: { x: 1, y: 2, w: 10, h: 9 }, data: { fit: 'cover', clipShape: 'arch' } },
      { type: 'sticker', grid: { x: 9, y: 1, w: 3, h: 3 }, data: { stickerId: 'stamp', color: '#c0813a', rotation: 12, opacity: 0.9 } },
      { type: 'text', grid: { x: 1, y: 11, w: 10, h: 5 }, data: { textStyle: 'body', content: doc('History, why it mattered, what stood out…'), fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
    ],
  },

  // ─── BEACH ─────────────────────────────────────────────────
  {
    id: 'beach', name: 'Beach Day', category: 'Beach', icon: '🏖️',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Beach Day'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'image', grid: { x: 0, y: 2, w: 12, h: 8 }, data: { fit: 'cover' } },
      { type: 'sticker', grid: { x: 0, y: 8, w: 2, h: 2 }, data: { stickerId: 'star', color: '#f2b134', rotation: -15, opacity: 0.85 } },
      { type: 'divider', grid: { x: 0, y: 10, w: 12, h: 1 }, data: { style: 'wave', color: 'accent' } },
      { type: 'weather', grid: { x: 0, y: 11, w: 5, h: 4 }, data: {} },
      { type: 'text', grid: { x: 5, y: 11, w: 7, h: 4 }, data: { textStyle: 'body', content: doc('Water temp, sand, sunburn count…'), fontFamily: 'Georgia', fontSize: 12, color: '#2c2c2c' } },
    ],
  },

  // ─── MUSEUM ────────────────────────────────────────────────
  {
    id: 'museum', name: 'Museum / Gallery', category: 'Museum', icon: '🖼️',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Museum / Gallery'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'text', grid: { x: 0, y: 2, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Name · Exhibit'), fontFamily: 'Georgia', fontSize: 11, color: '#c0813a' } },
      { type: 'image', grid: { x: 0, y: 3, w: 8, h: 9 }, data: { fit: 'cover' } },
      { type: 'image', grid: { x: 7, y: 8, w: 4, h: 4 }, data: { fit: 'cover', clipShape: 'diamond', borderStyle: 'thick', rotation: 5 } },
      { type: 'text', grid: { x: 0, y: 12, w: 12, h: 4 }, data: { textStyle: 'body', content: doc('Favorite piece, what I learned…'), fontFamily: 'Georgia', fontSize: 12, color: '#2c2c2c' } },
    ],
  },

  // ─── DIARY ─────────────────────────────────────────────────
  {
    id: 'freewrite', name: 'Free Write', category: 'Diary', icon: '✍️',
    elements: [
      { type: 'text', grid: { x: 1, y: 0, w: 10, h: 2 }, data: { textStyle: 'heading', content: doc('Free Write'), fontFamily: 'Georgia', fontSize: 30, color: '#1a1a1a' } },
      { type: 'divider', grid: { x: 3, y: 2, w: 6, h: 1 }, data: { style: 'ornate', color: 'accent' } },
      { type: 'text', grid: { x: 1, y: 3, w: 10, h: 1 }, data: { textStyle: 'dateline', content: doc('Location · Date'), fontFamily: 'Georgia', fontSize: 11, color: '#c0813a' } },
      { type: 'text', grid: { x: 1, y: 4, w: 10, h: 11 }, data: { textStyle: 'body', content: doc('Just write…'), fontFamily: 'Georgia', fontSize: 15, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'gratitude', name: 'Grateful For', category: 'Diary', icon: '🙏',
    elements: [
      { type: 'text', grid: { x: 1, y: 0, w: 8, h: 2 }, data: { textStyle: 'heading', content: doc('Grateful For…'), fontFamily: 'Georgia', fontSize: 28, color: '#1a1a1a' } },
      { type: 'sticker', grid: { x: 9, y: 0, w: 2, h: 2 }, data: { stickerId: 'heart', color: '#c0813a', rotation: 12, opacity: 0.85 } },
      { type: 'divider', grid: { x: 2, y: 2, w: 8, h: 1 }, data: { style: 'ornate', color: 'accent' } },
      { type: 'text', grid: { x: 1, y: 3, w: 10, h: 3 }, data: { textStyle: 'body', content: doc('1.'), fontFamily: 'Georgia', fontSize: 14, color: '#2c2c2c' } },
      { type: 'text', grid: { x: 1, y: 6, w: 10, h: 3 }, data: { textStyle: 'body', content: doc('2.'), fontFamily: 'Georgia', fontSize: 14, color: '#2c2c2c' } },
      { type: 'text', grid: { x: 1, y: 9, w: 10, h: 3 }, data: { textStyle: 'body', content: doc('3.'), fontFamily: 'Georgia', fontSize: 14, color: '#2c2c2c' } },
      { type: 'text', grid: { x: 1, y: 12, w: 10, h: 3 }, data: { textStyle: 'caption', content: doc("Today's small joy…"), fontFamily: 'Georgia', fontSize: 11, color: '#888888' } },
    ],
  },
]

// ─── Daily (Photo-a-Day) ────────────────────────────────────────────────────
// Not part of LAYOUT_CATEGORIES / the generic Layouts picker — reached only through the
// dedicated "Daily Style" control on a `pageKind: 'daily-entry'` page. Every element carries
// an explicit `role` so `convertDailyLayout` can map content across variants without loss.
// Literal default colors (no $token refs) — Photo-a-Day styling is intentionally plain,
// per the "lightweight" decision for this feature; only Monthly Spreads uses tokens.
// Every layout includes a `caption` role so caption content always has a destination on
// every daily-to-daily conversion, with no exceptions.
export const DAILY_LAYOUTS = [
  {
    id: 'daily-photo-story', name: "Today's Photo", icon: '📸',
    elements: [
      { type: 'image', role: 'photo', grid: { x: 0, y: 0, w: 12, h: 10 } },
      { type: 'text', role: 'caption', grid: { x: 1, y: 10, w: 10, h: 1 }, data: { textStyle: 'caption', content: doc(''), fontFamily: 'Georgia', fontSize: 11, color: '#888888' } },
      { type: 'text', role: 'heading', grid: { x: 1, y: 11, w: 10, h: 2 }, data: { textStyle: 'heading', content: doc('Today'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'text', role: 'body', grid: { x: 1, y: 13, w: 10, h: 3 }, data: { textStyle: 'body', content: doc('Notes from today…'), fontFamily: 'Georgia', fontSize: 14, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'daily-photo-story-wide', name: "Today's Photo", icon: '📸',
    elements: [
      { type: 'image', role: 'photo', grid: { x: 0, y: 0, w: 12, h: 6 } },
      { type: 'text', role: 'caption', grid: { x: 1, y: 6, w: 10, h: 1 }, data: { textStyle: 'caption', content: doc(''), fontFamily: 'Georgia', fontSize: 10, color: '#888888' } },
      { type: 'text', role: 'heading', grid: { x: 1, y: 7, w: 10, h: 1 }, data: { textStyle: 'heading', content: doc('Today'), fontFamily: 'Georgia', fontSize: 20, color: '#1a1a1a' } },
      { type: 'text', role: 'body', grid: { x: 1, y: 8, w: 10, h: 2 }, data: { textStyle: 'body', content: doc('Notes from today…'), fontFamily: 'Georgia', fontSize: 12, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'daily-collage-4', name: 'Today in Photos', icon: '🖼️',
    elements: [
      { type: 'collage', role: 'photos', grid: { x: 0, y: 0, w: 12, h: 10 }, data: { columns: 2, gap: 6, borderRadius: 4 } },
      { type: 'text', role: 'caption', grid: { x: 1, y: 10, w: 10, h: 1 }, data: { textStyle: 'caption', content: doc(''), fontFamily: 'Georgia', fontSize: 11, color: '#888888' } },
      { type: 'text', role: 'heading', grid: { x: 1, y: 11, w: 10, h: 2 }, data: { textStyle: 'heading', content: doc('Today'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'text', role: 'body', grid: { x: 1, y: 13, w: 10, h: 3 }, data: { textStyle: 'body', content: doc('Notes from today…'), fontFamily: 'Georgia', fontSize: 14, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'daily-collage-4-wide', name: 'Today in Photos', icon: '🖼️',
    elements: [
      { type: 'collage', role: 'photos', grid: { x: 0, y: 0, w: 12, h: 6 }, data: { columns: 2, gap: 5, borderRadius: 4 } },
      { type: 'text', role: 'caption', grid: { x: 1, y: 6, w: 10, h: 1 }, data: { textStyle: 'caption', content: doc(''), fontFamily: 'Georgia', fontSize: 10, color: '#888888' } },
      { type: 'text', role: 'heading', grid: { x: 1, y: 7, w: 10, h: 1 }, data: { textStyle: 'heading', content: doc('Today'), fontFamily: 'Georgia', fontSize: 20, color: '#1a1a1a' } },
      { type: 'text', role: 'body', grid: { x: 1, y: 8, w: 10, h: 2 }, data: { textStyle: 'body', content: doc('Notes from today…'), fontFamily: 'Georgia', fontSize: 12, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'daily-text-focus', name: "Today's Journal", icon: '✍️',
    elements: [
      { type: 'text', role: 'heading', grid: { x: 1, y: 1, w: 10, h: 2 }, data: { textStyle: 'heading', content: doc('Today'), fontFamily: 'Georgia', fontSize: 30, color: '#1a1a1a' } },
      { type: 'text', role: 'caption', grid: { x: 1, y: 3, w: 10, h: 1 }, data: { textStyle: 'caption', content: doc(''), fontFamily: 'Georgia', fontSize: 11, color: '#888888' } },
      { type: 'text', role: 'body', grid: { x: 1, y: 4, w: 10, h: 12 }, data: { textStyle: 'body', content: doc('Just write…'), fontFamily: 'Georgia', fontSize: 15, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'daily-text-focus-wide', name: "Today's Journal", icon: '✍️',
    elements: [
      { type: 'text', role: 'heading', grid: { x: 1, y: 0, w: 10, h: 1 }, data: { textStyle: 'heading', content: doc('Today'), fontFamily: 'Georgia', fontSize: 22, color: '#1a1a1a' } },
      { type: 'text', role: 'caption', grid: { x: 1, y: 1, w: 10, h: 1 }, data: { textStyle: 'caption', content: doc(''), fontFamily: 'Georgia', fontSize: 10, color: '#888888' } },
      { type: 'text', role: 'body', grid: { x: 1, y: 2, w: 10, h: 8 }, data: { textStyle: 'body', content: doc('Just write…'), fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'daily-mood-weather', name: 'Mood & Weather', icon: '🌤️',
    elements: [
      { type: 'weather', role: 'weather', grid: { x: 0, y: 0, w: 6, h: 4 } },
      { type: 'text', role: 'moodNote', grid: { x: 6, y: 0, w: 6, h: 4 }, data: { textStyle: 'body', content: doc('Feeling…'), fontFamily: 'Georgia', fontSize: 14, color: '#2c2c2c' } },
      { type: 'image', role: 'photo', grid: { x: 0, y: 4, w: 12, h: 8 } },
      { type: 'text', role: 'caption', grid: { x: 1, y: 12, w: 10, h: 1 }, data: { textStyle: 'caption', content: doc(''), fontFamily: 'Georgia', fontSize: 11, color: '#888888' } },
      { type: 'text', role: 'body', grid: { x: 1, y: 13, w: 10, h: 3 }, data: { textStyle: 'body', content: doc('Notes from today…'), fontFamily: 'Georgia', fontSize: 14, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'daily-mood-weather-wide', name: 'Mood & Weather', icon: '🌤️',
    elements: [
      { type: 'weather', role: 'weather', grid: { x: 0, y: 0, w: 6, h: 2 } },
      { type: 'text', role: 'moodNote', grid: { x: 6, y: 0, w: 6, h: 2 }, data: { textStyle: 'body', content: doc('Feeling…'), fontFamily: 'Georgia', fontSize: 12, color: '#2c2c2c' } },
      { type: 'image', role: 'photo', grid: { x: 0, y: 2, w: 12, h: 5 } },
      { type: 'text', role: 'caption', grid: { x: 1, y: 7, w: 10, h: 1 }, data: { textStyle: 'caption', content: doc(''), fontFamily: 'Georgia', fontSize: 10, color: '#888888' } },
      { type: 'text', role: 'body', grid: { x: 1, y: 8, w: 10, h: 2 }, data: { textStyle: 'body', content: doc('Notes from today…'), fontFamily: 'Georgia', fontSize: 12, color: '#2c2c2c' } },
    ],
  },
]

// ─── Monthly (Monthly Two-Page Spreads) ────────────────────────────────────
// Not part of LAYOUT_CATEGORIES / the generic Layouts picker — reached only through the
// dedicated Monthly Spreads preset and the "insert month spread" prompt in trip journals.
// `$token` refs (resolved via resolveThemedElements against a synthetic per-month token
// set, exactly like Backpacking's mechanism) drive the few decorative fields that should
// track the month's seasonal palette — headings and dividers. Photo/body content stays literal.
export const MONTHLY_LAYOUTS = [
  {
    id: 'month-spread-left', name: 'Month Overview', icon: '🗓️', group: 'Monthly',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Month'), fontFamily: 'Georgia', fontSize: 30, color: '$accent' } },
      { type: 'image', grid: { x: 0, y: 2, w: 12, h: 8 } },
      { type: 'text', grid: { x: 1, y: 10, w: 10, h: 6 }, data: { textStyle: 'body', content: doc('Highlights this month…'), fontFamily: 'Georgia', fontSize: 14, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'month-spread-left-wide', name: 'Month Overview', icon: '🗓️', group: 'Monthly',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 1 }, data: { textStyle: 'heading', content: doc('Month'), fontFamily: 'Georgia', fontSize: 22, color: '$accent' } },
      { type: 'image', grid: { x: 0, y: 1, w: 12, h: 6 } },
      { type: 'text', grid: { x: 1, y: 7, w: 10, h: 3 }, data: { textStyle: 'body', content: doc('Highlights this month…'), fontFamily: 'Georgia', fontSize: 12, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'month-spread-right', name: 'Notes & Memories', icon: '🗓️', group: 'Monthly',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Notes & Memories'), fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'divider', grid: { x: 1, y: 2, w: 10, h: 1 }, data: { style: 'line', color: '$accentSecondary' } },
      { type: 'collage', grid: { x: 0, y: 3, w: 12, h: 7 }, data: { columns: 2, gap: 6, borderRadius: 4 } },
      { type: 'text', grid: { x: 1, y: 10, w: 10, h: 6 }, data: { textStyle: 'body', content: doc('Favorite memory, place, reflection…'), fontFamily: 'Georgia', fontSize: 14, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'month-spread-right-wide', name: 'Notes & Memories', icon: '🗓️', group: 'Monthly',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 1 }, data: { textStyle: 'heading', content: doc('Notes & Memories'), fontFamily: 'Georgia', fontSize: 18, color: '#1a1a1a' } },
      { type: 'divider', grid: { x: 1, y: 1, w: 10, h: 1 }, data: { style: 'line', color: '$accentSecondary' } },
      { type: 'collage', grid: { x: 0, y: 2, w: 12, h: 5 }, data: { columns: 2, gap: 5, borderRadius: 4 } },
      { type: 'text', grid: { x: 1, y: 7, w: 10, h: 3 }, data: { textStyle: 'body', content: doc('Favorite memory, place, reflection…'), fontFamily: 'Georgia', fontSize: 12, color: '#2c2c2c' } },
    ],
  },
]

// ─── Photo-a-Day cover (created atomically at journal creation, never via the generic
// Layouts picker — see decision 6/7 in the architecture plan) ─────────────────────────
export const PHOTO_A_DAY_COVER_LAYOUT = {
  id: 'photo-a-day-cover', name: 'Photo-a-Day Cover', icon: '📖',
  elements: [
    { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
      title: '', subtitle: '', titleAlign: 'center', titleFont: 'Georgia, serif',
      overlayColor: '#00000055', titleColor: '#ffffff', subtitleColor: '#ffffffcc',
    } },
  ],
}
