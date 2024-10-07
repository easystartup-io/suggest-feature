import React, { createContext, useState, ReactNode, useContext } from 'react';

interface InitContextType {
  org: any;
  boards: any;
}

const InitContext = createContext<InitContextType | undefined>(undefined);

export const InitContextProvider = ({ children }: { children: ReactNode }) => {
  const [org, setOrg] = useState(null);
  const [boards, setBoards] = useState(null);

  return (
    <InitContext.Provider value={{ org, setOrg, boards, setBoards }}>
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
