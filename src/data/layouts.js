export const LAYOUT_CATEGORIES = ['Basic', 'Editorial', 'Grid', 'Text', 'Maps', 'Timeline', 'Shapes']

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
]
