// context/CollapseContext.js
'use client';

import { createContext, useState, useContext } from 'react';

const CollapseContext = createContext();

export const CollapseProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <CollapseContext.Provider value={{ isCollapsed, toggleCollapse }}>
      {children}
    </CollapseContext.Provider>
  );
};

export const useCollapse = () => {
  return useContext(CollapseContext);
};
