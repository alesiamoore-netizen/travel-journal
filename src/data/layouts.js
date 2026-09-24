export const LAYOUT_CATEGORIES = ['Basic', 'Editorial', 'Grid', 'Maps']

export const LAYOUTS = [
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
      { type: 'image', grid: { x: 0, y: 0, w: 12, h: 13 } },
      { type: 'text',  grid: { x: 1, y: 13, w: 10, h: 3 } },
    ],
  },
  {
    id: 'title-page',
    name: 'Title Page',
    category: 'Basic',
    elements: [
      { type: 'text', grid: { x: 1, y: 5,  w: 10, h: 4 } },
      { type: 'text', grid: { x: 2, y: 10, w: 8,  h: 2 } },
    ],
  },
  {
    id: 'photo-left',
    name: 'Photo | Text',
    category: 'Editorial',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 6, h: 16 } },
      { type: 'text',  grid: { x: 7, y: 2,  w: 4, h: 12 } },
    ],
  },
  {
    id: 'text-photo',
    name: 'Text | Photo',
    category: 'Editorial',
    elements: [
      { type: 'text',  grid: { x: 1, y: 2,  w: 4, h: 12 } },
      { type: 'image', grid: { x: 6, y: 0,  w: 6, h: 16 } },
    ],
  },
  {
    id: 'hero-story',
    name: 'Hero + Story',
    category: 'Editorial',
    elements: [
      { type: 'image', grid: { x: 0, y: 0,  w: 12, h: 9 } },
      { type: 'text',  grid: { x: 1, y: 9,  w: 5,  h: 6 } },
      { type: 'text',  grid: { x: 6, y: 9,  w: 5,  h: 6 } },
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
]
