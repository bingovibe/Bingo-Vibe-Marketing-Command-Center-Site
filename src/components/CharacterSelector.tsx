
'use client'
import { useState, useEffect } from 'react'

export default function CharacterSelector() {
  const [characters, setCharacters] = useState([])
  const [selectedCharacter, setSelectedCharacter] = useState('')

  useEffect(() => {
    // Fetch characters from API
    fetch('/api/characters')
      .then(res => res.json())
      .then(data => setCharacters(data))
      .catch(err => console.error('Failed to fetch characters:', err))
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Select Brand Character</h3>
      <div className="space-y-3">
        {characters.map((character: any) => (
          <div
            key={character.id}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedCharacter === character.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedCharacter(character.id)}
          >
            <h4 className="font-medium text-gray-900">{character.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{character.description}</p>
            <p className="text-xs text-gray-500 mt-2">Target: {character.targetDemo}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
