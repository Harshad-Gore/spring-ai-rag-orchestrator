import { useReducer, useCallback } from 'react'
import { DEFAULT_THEME } from '../lib/slideThemes.js'

// ─── Constants ────────────────────────────────────────────────────
export const CANVAS_W = 960
export const CANVAS_H = 540
const MAX_HISTORY = 40

let _idCounter = 0
export function uid(prefix = 'el') {
  return `${prefix}-${Date.now()}-${++_idCounter}`
}

// ─── Blank element factories ──────────────────────────────────────
export function createTextElement(overrides = {}) {
  return {
    id: uid('txt'),
    type: 'text',
    x: 60,
    y: 60,
    width: 400,
    height: 48,
    rotation: 0,
    text: 'Double-click to edit',
    fontSize: 20,
    fontFamily: 'Inter, sans-serif',
    fontStyle: '',
    textAlign: 'left',
    fill: 'c8cdc9',
    opacity: 1,
    zIndex: 0,
    ...overrides,
  }
}

export function createRectElement(overrides = {}) {
  return {
    id: uid('rect'),
    type: 'rect',
    x: 200,
    y: 150,
    width: 200,
    height: 120,
    rotation: 0,
    fill: '333333',
    stroke: '',
    strokeWidth: 0,
    cornerRadius: 8,
    opacity: 1,
    zIndex: 0,
    ...overrides,
  }
}

export function createCircleElement(overrides = {}) {
  return {
    id: uid('circ'),
    type: 'circle',
    x: 480,
    y: 270,
    width: 120,
    height: 120,
    rotation: 0,
    fill: '333333',
    stroke: '',
    strokeWidth: 0,
    opacity: 1,
    zIndex: 0,
    ...overrides,
  }
}

export function createImageElement(src, overrides = {}) {
  return {
    id: uid('img'),
    type: 'image',
    x: 200,
    y: 100,
    width: 300,
    height: 200,
    rotation: 0,
    src,
    opacity: 1,
    zIndex: 0,
    ...overrides,
  }
}

export function createLineElement(overrides = {}) {
  return {
    id: uid('line'),
    type: 'line',
    x: 100,
    y: 270,
    width: 300,
    height: 0,
    rotation: 0,
    stroke: 'c8cdc9',
    strokeWidth: 2,
    opacity: 1,
    zIndex: 0,
    ...overrides,
  }
}

// ─── Default slide ────────────────────────────────────────────────
export function createSlide(overrides = {}) {
  return {
    id: uid('slide'),
    title: 'Untitled Slide',
    backgroundColor: '',
    elements: [],
    ...overrides,
  }
}

// ─── Reducer ──────────────────────────────────────────────────────
const initialState = {
  slides: [],
  activeSlideId: null,
  selectedElementId: null,
  themeKey: DEFAULT_THEME,
  zoom: 1,
  history: { past: [], future: [] },
  hasStarted: false,
}

function pushHistory(state) {
  const snapshot = {
    slides: JSON.parse(JSON.stringify(state.slides)),
    activeSlideId: state.activeSlideId,
    selectedElementId: state.selectedElementId,
  }
  const past = [...state.history.past, snapshot].slice(-MAX_HISTORY)
  return { past, future: [] }
}

function reducer(state, action) {
  switch (action.type) {
    // ── Slides ─────────────────────────────────────────────
    case 'ADD_SLIDE': {
      const history = pushHistory(state)
      const newSlide = createSlide(action.payload)
      const slides = [...state.slides, newSlide]
      return { ...state, slides, activeSlideId: newSlide.id, selectedElementId: null, history, hasStarted: true }
    }
    case 'INSERT_SLIDE_AT': {
      const history = pushHistory(state)
      const newSlide = createSlide(action.payload.slide)
      const slides = [...state.slides]
      slides.splice(action.payload.index, 0, newSlide)
      return { ...state, slides, activeSlideId: newSlide.id, selectedElementId: null, history, hasStarted: true }
    }
    case 'DUPLICATE_SLIDE': {
      const history = pushHistory(state)
      const idx = state.slides.findIndex(s => s.id === action.payload)
      if (idx === -1) return state
      const dupe = {
        ...JSON.parse(JSON.stringify(state.slides[idx])),
        id: uid('slide'),
        title: state.slides[idx].title + ' (copy)',
      }
      dupe.elements = dupe.elements.map(el => ({ ...el, id: uid(el.type) }))
      const slides = [...state.slides]
      slides.splice(idx + 1, 0, dupe)
      return { ...state, slides, activeSlideId: dupe.id, selectedElementId: null, history }
    }
    case 'DELETE_SLIDE': {
      const history = pushHistory(state)
      const slides = state.slides.filter(s => s.id !== action.payload)
      let activeSlideId = state.activeSlideId
      if (activeSlideId === action.payload) {
        activeSlideId = slides.length > 0 ? slides[0].id : null
      }
      return { ...state, slides, activeSlideId, selectedElementId: null, history }
    }
    case 'REORDER_SLIDES': {
      const history = pushHistory(state)
      return { ...state, slides: action.payload, history }
    }
    case 'SET_ACTIVE_SLIDE':
      return { ...state, activeSlideId: action.payload, selectedElementId: null }
    case 'UPDATE_SLIDE_BG': {
      const history = pushHistory(state)
      const slides = state.slides.map(s =>
        s.id === state.activeSlideId ? { ...s, backgroundColor: action.payload } : s
      )
      return { ...state, slides, history }
    }
    case 'UPDATE_ALL_SLIDES_BG': {
      const history = pushHistory(state)
      const slides = state.slides.map(s => ({ ...s, backgroundColor: action.payload }))
      return { ...state, slides, history }
    }
    case 'UPDATE_SLIDE_TITLE': {
      const slides = state.slides.map(s =>
        s.id === action.payload.id ? { ...s, title: action.payload.title } : s
      )
      return { ...state, slides }
    }

    // ── Elements ───────────────────────────────────────────
    case 'ADD_ELEMENT': {
      const history = pushHistory(state)
      const slides = state.slides.map(s =>
        s.id === state.activeSlideId
          ? { ...s, elements: [...s.elements, action.payload] }
          : s
      )
      return { ...state, slides, selectedElementId: action.payload.id, history }
    }
    case 'UPDATE_ELEMENT': {
      const history = action.skipHistory ? state.history : pushHistory(state)
      const slides = state.slides.map(s =>
        s.id === state.activeSlideId
          ? {
              ...s,
              elements: s.elements.map(el =>
                el.id === action.payload.id ? { ...el, ...action.payload.updates } : el
              ),
            }
          : s
      )
      return { ...state, slides, history }
    }
    case 'DELETE_ELEMENT': {
      const history = pushHistory(state)
      const slides = state.slides.map(s =>
        s.id === state.activeSlideId
          ? { ...s, elements: s.elements.filter(el => el.id !== action.payload) }
          : s
      )
      return {
        ...state,
        slides,
        selectedElementId: state.selectedElementId === action.payload ? null : state.selectedElementId,
        history,
      }
    }
    case 'SELECT_ELEMENT':
      return { ...state, selectedElementId: action.payload }
    case 'BRING_TO_FRONT': {
      const history = pushHistory(state)
      const slides = state.slides.map(s => {
        if (s.id !== state.activeSlideId) return s
        const els = [...s.elements]
        const idx = els.findIndex(el => el.id === action.payload)
        if (idx === -1 || idx === els.length - 1) return s
        const [el] = els.splice(idx, 1)
        els.push(el)
        return { ...s, elements: els }
      })
      return { ...state, slides, history }
    }
    case 'SEND_TO_BACK': {
      const history = pushHistory(state)
      const slides = state.slides.map(s => {
        if (s.id !== state.activeSlideId) return s
        const els = [...s.elements]
        const idx = els.findIndex(el => el.id === action.payload)
        if (idx <= 0) return s
        const [el] = els.splice(idx, 1)
        els.unshift(el)
        return { ...s, elements: els }
      })
      return { ...state, slides, history }
    }

    // ── Theme & Zoom ──────────────────────────────────────
    case 'SET_THEME':
      return { ...state, themeKey: action.payload }
    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.3, Math.min(2, action.payload)) }

    // ── AI Load ───────────────────────────────────────────
    case 'LOAD_AI_SLIDES': {
      const slides = action.payload
      return {
        ...state,
        slides,
        activeSlideId: slides.length > 0 ? slides[0].id : null,
        selectedElementId: null,
        history: { past: [], future: [] },
        hasStarted: true,
      }
    }
    case 'START_BLANK': {
      const slide = createSlide({ title: 'Title Slide' })
      return {
        ...state,
        slides: [slide],
        activeSlideId: slide.id,
        selectedElementId: null,
        history: { past: [], future: [] },
        hasStarted: true,
      }
    }

    // ── Undo / Redo ───────────────────────────────────────
    case 'UNDO': {
      if (state.history.past.length === 0) return state
      const prev = state.history.past[state.history.past.length - 1]
      const currentSnapshot = {
        slides: JSON.parse(JSON.stringify(state.slides)),
        activeSlideId: state.activeSlideId,
        selectedElementId: state.selectedElementId,
      }
      return {
        ...state,
        slides: prev.slides,
        activeSlideId: prev.activeSlideId,
        selectedElementId: prev.selectedElementId,
        history: {
          past: state.history.past.slice(0, -1),
          future: [currentSnapshot, ...state.history.future],
        },
      }
    }
    case 'REDO': {
      if (state.history.future.length === 0) return state
      const next = state.history.future[0]
      const currentSnapshot = {
        slides: JSON.parse(JSON.stringify(state.slides)),
        activeSlideId: state.activeSlideId,
        selectedElementId: state.selectedElementId,
      }
      return {
        ...state,
        slides: next.slides,
        activeSlideId: next.activeSlideId,
        selectedElementId: next.selectedElementId,
        history: {
          past: [...state.history.past, currentSnapshot],
          future: state.history.future.slice(1),
        },
      }
    }

    default:
      return state
  }
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useSlideEditor() {
  // Force Vite HMR reload
  const [state, dispatch] = useReducer(reducer, initialState)

  const activeSlide = state.slides.find(s => s.id === state.activeSlideId) || null
  const selectedElement = activeSlide?.elements.find(el => el.id === state.selectedElementId) || null

  const canUndo = state.history.past.length > 0
  const canRedo = state.history.future.length > 0

  // Memoized dispatchers
  const addSlide = useCallback((overrides) => dispatch({ type: 'ADD_SLIDE', payload: overrides }), [])
  const deleteSlide = useCallback((id) => dispatch({ type: 'DELETE_SLIDE', payload: id }), [])
  const duplicateSlide = useCallback((id) => dispatch({ type: 'DUPLICATE_SLIDE', payload: id }), [])
  const setActiveSlide = useCallback((id) => dispatch({ type: 'SET_ACTIVE_SLIDE', payload: id }), [])
  const reorderSlides = useCallback((slides) => dispatch({ type: 'REORDER_SLIDES', payload: slides }), [])
  const updateSlideBg = useCallback((color) => dispatch({ type: 'UPDATE_SLIDE_BG', payload: color }), [])
  const updateAllSlidesBg = useCallback((color) => dispatch({ type: 'UPDATE_ALL_SLIDES_BG', payload: color }), [])
  const updateSlideTitle = useCallback((id, title) => dispatch({ type: 'UPDATE_SLIDE_TITLE', payload: { id, title } }), [])

  const addElement = useCallback((element) => dispatch({ type: 'ADD_ELEMENT', payload: element }), [])
  const updateElement = useCallback((id, updates, skipHistory = false) =>
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id, updates }, skipHistory }), [])
  const deleteElement = useCallback((id) => dispatch({ type: 'DELETE_ELEMENT', payload: id }), [])
  const selectElement = useCallback((id) => dispatch({ type: 'SELECT_ELEMENT', payload: id }), [])
  const bringToFront = useCallback((id) => dispatch({ type: 'BRING_TO_FRONT', payload: id }), [])
  const sendToBack = useCallback((id) => dispatch({ type: 'SEND_TO_BACK', payload: id }), [])

  const setTheme = useCallback((key) => dispatch({ type: 'SET_THEME', payload: key }), [])
  const setZoom = useCallback((z) => dispatch({ type: 'SET_ZOOM', payload: z }), [])
  const loadAiSlides = useCallback((slides) => dispatch({ type: 'LOAD_AI_SLIDES', payload: slides }), [])
  const startBlank = useCallback(() => dispatch({ type: 'START_BLANK' }), [])

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), [])
  const redo = useCallback(() => dispatch({ type: 'REDO' }), [])

  return {
    state,
    activeSlide,
    selectedElement,
    canUndo,
    canRedo,
    addSlide,
    deleteSlide,
    duplicateSlide,
    setActiveSlide,
    reorderSlides,
    updateSlideBg,
    updateAllSlidesBg,
    updateSlideTitle,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    bringToFront,
    sendToBack,
    setTheme,
    setZoom,
    loadAiSlides,
    startBlank,
    undo,
    redo,
  }
}
