import React, { createContext, useContext, useReducer } from 'react';
import {
  EcmExtractorState,
  EcmExtractorAction,
  ecmExtractorReducer,
  initialState,
} from './actions';

interface EcmExtractorContextType {
  state: EcmExtractorState;
  dispatch: React.Dispatch<EcmExtractorAction>;
}

const EcmExtractorContext = createContext<EcmExtractorContextType | undefined>(
  undefined
);

/**
 * Context provider for ECM Extractor state management
 */
export const EcmExtractorProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [state, dispatch] = useReducer(ecmExtractorReducer, initialState);

  return (
    <EcmExtractorContext.Provider value={{ state, dispatch }}>
      {children}
    </EcmExtractorContext.Provider>
  );
};

/**
 * Hook to use ECM Extractor context
 */
export const useEcmExtractor = () => {
  const context = useContext(EcmExtractorContext);
  if (context === undefined) {
    throw new Error(
      'useEcmExtractor must be used within an EcmExtractorProvider'
    );
  }
  return context;
};
