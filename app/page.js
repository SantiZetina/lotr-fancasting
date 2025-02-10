'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search, Loader2 } from 'lucide-react';

// Move initial state outside component
const initialState = {
  characters: [],
  newCharacter: '',
  newActor: '',
  actorResults: [],
  isSearching: false,
  selectedActor: null
};

const FanCastingApp = () => {
  // Use a single state object to ensure consistency
  const [state, setState] = useState(initialState);
  
  useEffect(() => {
    // Load saved castings after component mounts
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
    if (state.newCharacter && state.selectedActor) {
      const updatedCastings = [...state.characters, {
        id: Date.now(),
        character: state.newCharacter,
        actor: state.selectedActor.name,
        image: state.selectedActor.image
      }];
      saveCastings(updatedCastings);
      setState(prev => ({
        ...prev,
        newCharacter: '',
        newActor: '',
        selectedActor: null,
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Lord of the Rings Fan Casting</h1>
      
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Character Name"
            value={state.newCharacter}
            onChange={(e) => setState(prev => ({ ...prev, newCharacter: e.target.value }))}
            className="flex-1"
          />
          <div className="flex-1 relative">
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
              />
              <Button 
                onClick={searchActor}
                disabled={state.isSearching || !state.newActor}
              >
                {state.isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {state.actorResults.length > 0 && (
              <Card className="absolute w-full mt-1 z-10">
                <CardContent className="p-2">
                  {state.actorResults.map((actor, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded"
                      onClick={() => handleSelectActor(actor)}
                    >
                      <img
                        src={actor.image}
                        alt={actor.name}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{actor.name}</p>
                        <p className="text-sm text-gray-500">{actor.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
          <Button 
            onClick={handleAddCharacter}
            disabled={!state.newCharacter || !state.selectedActor}
            className="whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Casting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.characters.map((char) => (
          <Card key={char.id} className="relative">
            <CardContent className="pt-6">
              <img
                src={char.image}
                alt={`${char.actor} as ${char.character}`}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="font-bold text-lg">{char.character}</h3>
              <p className="text-gray-600">Played by: {char.actor}</p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => handleRemoveCharacter(char.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FanCastingApp;