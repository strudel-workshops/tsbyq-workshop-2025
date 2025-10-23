/**
 * Actions for ECM Extractor state management
 */

export interface ImageData {
  id: string;
  page: number;
  format: string;
  data: string; // base64 data URI
}

export interface EcmExtractorState {
  uploadedFile: File | null;
  fileName: string;
  extractedMarkdown: string;
  editedMarkdown: string;
  images: ImageData[];
  ecmResults: unknown;
  isLoading: boolean;
  error: string | null;
}

export type EcmExtractorAction =
  | { type: 'SET_UPLOADED_FILE'; payload: File }
  | { type: 'SET_EXTRACTED_MARKDOWN'; payload: string }
  | { type: 'SET_EDITED_MARKDOWN'; payload: string }
  | { type: 'SET_IMAGES'; payload: ImageData[] }
  | {
      type: 'SET_MARKDOWN_AND_IMAGES';
      payload: { markdown: string; images: ImageData[] };
    }
  | { type: 'SET_ECM_RESULTS'; payload: unknown }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

export const initialState: EcmExtractorState = {
  uploadedFile: null,
  fileName: '',
  extractedMarkdown: '',
  editedMarkdown: '',
  images: [],
  ecmResults: null,
  isLoading: false,
  error: null,
};

export function ecmExtractorReducer(
  state: EcmExtractorState,
  action: EcmExtractorAction
): EcmExtractorState {
  switch (action.type) {
    case 'SET_UPLOADED_FILE':
      return {
        ...state,
        uploadedFile: action.payload,
        fileName: action.payload.name,
        error: null,
      };
    case 'SET_EXTRACTED_MARKDOWN':
      return {
        ...state,
        extractedMarkdown: action.payload,
        editedMarkdown: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_EDITED_MARKDOWN':
      return {
        ...state,
        editedMarkdown: action.payload,
      };
    case 'SET_IMAGES':
      return {
        ...state,
        images: action.payload,
      };
    case 'SET_MARKDOWN_AND_IMAGES':
      return {
        ...state,
        extractedMarkdown: action.payload.markdown,
        editedMarkdown: action.payload.markdown,
        images: action.payload.images,
        isLoading: false,
        error: null,
      };
    case 'SET_ECM_RESULTS':
      return {
        ...state,
        ecmResults: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Action creators
export const setUploadedFile = (file: File): EcmExtractorAction => ({
  type: 'SET_UPLOADED_FILE',
  payload: file,
});

export const setExtractedMarkdown = (markdown: string): EcmExtractorAction => ({
  type: 'SET_EXTRACTED_MARKDOWN',
  payload: markdown,
});

export const setEditedMarkdown = (markdown: string): EcmExtractorAction => ({
  type: 'SET_EDITED_MARKDOWN',
  payload: markdown,
});

export const setEcmResults = (results: unknown): EcmExtractorAction => ({
  type: 'SET_ECM_RESULTS',
  payload: results,
});

export const setLoading = (loading: boolean): EcmExtractorAction => ({
  type: 'SET_LOADING',
  payload: loading,
});

export const setError = (error: string): EcmExtractorAction => ({
  type: 'SET_ERROR',
  payload: error,
});

export const clearError = (): EcmExtractorAction => ({
  type: 'CLEAR_ERROR',
});

export const resetState = (): EcmExtractorAction => ({
  type: 'RESET_STATE',
});

export const setImages = (images: ImageData[]): EcmExtractorAction => ({
  type: 'SET_IMAGES',
  payload: images,
});

export const setMarkdownAndImages = (
  markdown: string,
  images: ImageData[]
): EcmExtractorAction => ({
  type: 'SET_MARKDOWN_AND_IMAGES',
  payload: { markdown, images },
});
