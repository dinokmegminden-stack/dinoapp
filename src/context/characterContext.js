import React, { createContext, useContext, useState } from 'react';
import { CHARACTERS } from '../constants/characters';

const CharacterContext = createContext(null);

export function CharacterProvider({ children }) {
  const [selectedCharacterId, setSelectedCharacterId] = useState(CHARACTERS[0].id);

  const selectedCharacter = CHARACTERS.find(c => c.id === selectedCharacterId) ?? CHARACTERS[0];

  return (
    <CharacterContext.Provider value={{ selectedCharacter, selectedCharacterId, setSelectedCharacterId }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const ctx = useContext(CharacterContext);
  if (!ctx) throw new Error('useCharacter must be used within CharacterProvider');
  return ctx;
}