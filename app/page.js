'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Search, Loader2 } from 'lucide-react';

// Move initial state outside component
const initialState = {
  characters: [],
  newCharacter: '',
  newActor: '',
  actorResults: [],
  isSearching: false,
  selectedActor: null,
  selectedRace: '',
  characterDescription: '',
};

const raceOptions = [
  {value: 'elf', label: 'Elf', description: "Gods favorite children"},
  {value: 'human', label: 'Human', description: 'Gods second favorite creatures'},
  {value: 'dwarf', label: 'Dwarf', description: 'Irish People'},
  {value: 'hobbit', label: 'Hobbit', description: ''},
  {value: 'wizard', label: 'Wizard', description: ''},
  {value: 'other', label: 'Other', description: 'South Koreans'}
];

const FanCastingApp = () => {
  const [state, setState] = useState(initialState);
  
  useEffect(() => {
    try {
      const savedCastings = localStorage.getItem('lotrCastings');
      if (savedCastings) {
        setState(prev => ({
          ...prev,
          characters: JSON.parse(savedCastings)
        }));
      }
    } catch (error) {
      console.error('Error loading saved castings:', error);
    }
  }, []);

  const searchActor = async () => {
    if (!state.newActor) return;
    setState(prev => ({ ...prev, isSearching: true }));
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(state.newActor + ' actor')}&format=json&origin=*`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      const actorPromises = searchData.query.search.slice(0, 5).map(async (result) => {
        const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(result.title)}&prop=pageimages&format=json&pithumbsize=300&origin=*`;
        const imageResponse = await fetch(imageUrl);
        const imageData = await imageResponse.json();
        
        const pages = imageData.query.pages;
        const pageId = Object.keys(pages)[0];
        const thumbnail = pages[pageId].thumbnail;
        
        return {
          name: result.title,
          image: thumbnail ? thumbnail.source : '/api/placeholder/300/400',
          description: result.snippet.replace(/<\/?[^>]+(>|$)/g, "")
        };
      });

      const actorsWithImages = await Promise.all(actorPromises);
      setState(prev => ({ ...prev, actorResults: actorsWithImages }));
    } catch (error) {
      console.error('Error searching for actor:', error);
    }
    setState(prev => ({ ...prev, isSearching: false }));
  };

  const saveCastings = (updatedCastings) => {
    localStorage.setItem('lotrCastings', JSON.stringify(updatedCastings));
    setState(prev => ({ ...prev, characters: updatedCastings }));
  };

  const handleAddCharacter = () => {
    if (state.newCharacter && state.selectedActor && state.selectedRace) {
      const updatedCastings = [...state.characters, {
        id: Date.now(),
        character: state.newCharacter,
        actor: state.selectedActor.name,
        image: state.selectedActor.image,
        race: state.selectedRace,
        description: state.characterDescription
      }];
      saveCastings(updatedCastings);
      setState(prev => ({
        ...prev,
        newCharacter: '',
        newActor: '',
        selectedActor: null,
        selectedRace: '',
        characterDescription: '',
        actorResults: []
      }));
    }
  };

  const handleRemoveCharacter = (id) => {
    const updatedCastings = state.characters.filter(char => char.id !== id);
    saveCastings(updatedCastings);
  };

  const handleSelectActor = (actor) => {
    setState(prev => ({
      ...prev,
      selectedActor: actor,
      newActor: actor.name,
      actorResults: []
    }));
  };

  return (
    <div>
    <div className="min-h-screen bg-[#1A0F0F] bg-opacity-90 bg-[url('/texture-bg.png')] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-[#D4AF37] mb-2 tracking-wider">
            The People's Party of Middle-earth
          </h1>
          <div className="text-xl font-serif text-[#C0C0C0]">
            Lunatic castings
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-[#2A1F1D] p-6 rounded-lg border-4 border-[#463020] shadow-2xl mb-8">
          <div className="bg-[#1A1210] p-4 rounded border-2 border-[#634832]">
            <div className="text-[#D4AF37] font-serif text-xl mb-4">New Casting</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                type="text"
                placeholder="Character Name"
                value={state.newCharacter}
                onChange={(e) => setState(prev => ({ ...prev, newCharacter: e.target.value }))}
                className="bg-[#2A1F1D] border-2 border-[#634832] text-[#D4AF37]"
              />
              <Select 
                value={state.selectedRace} 
                onValueChange={(value) => setState(prev => ({ ...prev, selectedRace: value }))}
              >
                <SelectTrigger className="bg-[#2A1F1D] border-2 border-[#634832] text-[#D4AF37]">
                  <SelectValue placeholder="Select Race" />
                </SelectTrigger>
                <SelectContent>
                  {raceOptions.map(race => (
                    <SelectItem key={race.value} value={race.value}>
                      {race.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative mb-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search Actor"
                  value={state.newActor}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    newActor: e.target.value,
                    selectedActor: null
                  }))}
                  className="flex-1 bg-[#2A1F1D] border-2 border-[#634832] text-[#D4AF37]"
                />
                <Button 
                  onClick={searchActor}
                  disabled={state.isSearching || !state.newActor}
                  className="bg-[#634832] hover:bg-[#463020] text-[#D4AF37]"
                >
                  {state.isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {state.actorResults.length > 0 && (
                <div className="absolute w-full mt-2 z-10 bg-[#2A1F1D] border-2 border-[#634832] rounded shadow-2xl">
                  {state.actorResults.map((actor, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 hover:bg-[#1A1210] cursor-pointer border-b border-[#634832] last:border-b-0"
                      onClick={() => handleSelectActor(actor)}
                    >
                      <img
                        src={actor.image}
                        alt={actor.name}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-serif text-[#D4AF37]">{actor.name}</p>
                        <p className="text-sm text-[#C0C0C0]">{actor.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <textarea
              placeholder="Why would they be perfect for this role? (optional)"
              value={state.characterDescription}
              onChange={(e) => setState(prev => ({ ...prev, characterDescription: e.target.value }))}
              className="w-full h-24 mb-4 bg-[#2A1F1D] border-2 border-[#634832] text-[#D4AF37] rounded p-2"
            />
            <Button 
              onClick={handleAddCharacter}
              disabled={!state.newCharacter || !state.selectedActor || !state.selectedRace}
              className="w-full bg-[#634832] hover:bg-[#463020] text-[#D4AF37]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Archives
            </Button>
          </div>
        </div>

        {/* Characters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.characters.map((char) => (
            <div key={char.id} className="bg-[#2A1F1D] rounded-lg border-4 border-[#463020] shadow-xl overflow-hidden">
              <div className="bg-[#1A1210] px-4 py-2 flex justify-between items-center border-b-2 border-[#634832]">
                <div>
                  <h3 className="font-serif text-[#D4AF37]">{char.character}</h3>
                  <div className="text-sm text-[#C0C0C0]">
                    {raceOptions.find(r => r.value === char.race)?.label}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-[#2A1F1D] text-[#C0C0C0]"
                  onClick={() => handleRemoveCharacter(char.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <div className="relative mb-3">
                  <img
                    src={char.image}
                    alt={`${char.actor} as ${char.character}`}
                    className="w-full h-48 object-cover rounded border-2 border-[#634832]"
                  />
                </div>
                {char.description && (
                  <div className="mb-3 text-sm text-[#C0C0C0] italic">
                    "{char.description}"
                  </div>
                )}
                <div className="text-sm text-[#C0C0C0] font-serif">Portrayed by</div>
                <div className="text-[#D4AF37] font-serif">{char.actor}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    /</div>
  );
};

export default FanCastingApp;