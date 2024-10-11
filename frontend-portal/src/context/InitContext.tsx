"use client"
import React, { createContext, useState, ReactNode, useContext } from 'react';

interface InitContextType {
  org: any;
  boards: any;
}

const InitContext = createContext<InitContextType | undefined>(undefined);

export const InitContextProvider = ({ children, initMetadata }: { children: ReactNode }) => {
  const org = initMetadata.org;
  const boards = initMetadata.boards;

  return (
    <InitContext.Provider value={{ org, boards }}>
      {children}
    </InitContext.Provider>
  );
};

export const useInit = () => {
  const context = useContext(InitContext)
  if (context === undefined) {
    throw new Error('useInit must be used within an AuthProvider');
  }
  return context;
};
