import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Home, Save, Upload, X, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  FIELD_PHOTOS_KEY,
  SUB_PHOTOS_KEY,
  PhotoMap,
  getInitials,
  loadPhotos,
  readPhotoFile,
  savePhotos,
} from '@/utils/playerPhotos';
import { getDefaultPhoto } from '@/utils/defaultPhotos';

const defaultPlayers = [
  'Ter Stegen', 'Araujo', 'Christensen', 'Kounde',
  'Balde', 'De Jong', 'Gavi', 'Pedri',
  'Raphinha', 'Lewandowski', 'Ferran Torres'
];

const defaultSubstitutes = ['Inaki Pena', 'Fermin Lopez', 'Joao Felix', 'Yamal', 'Ansu Fati'];

interface PhotoPickerProps {
  id: string;
  name: string;
  photo?: string;
  onSelect: (file: File | undefined) => void;
  onRemove: () => void;
}

const PhotoPicker = ({ id, name, photo, onSelect, onRemove }: PhotoPickerProps) => {
  const shown = photo ?? getDefaultPhoto(name);
  return (
  <div className="relative shrink-0">
    <label
      htmlFor={id}
      className="group flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-muted transition-colors hover:border-status-fit"
      title="Upload a photo"
    >
      {shown ? (
        <img src={shown} alt={name} className="h-full w-full object-cover" />
      ) : name ? (
        <span className="text-xs font-bold text-muted-foreground group-hover:hidden">
          {getInitials(name)}
        </span>
      ) : null}
      <Upload
        className={cn(
          'h-4 w-4 text-muted-foreground',
          shown ? 'hidden' : 'hidden group-hover:block'
        )}
      />
    </label>
    <input
      id={id}
      type="file"
      accept="image/*"
      className="sr-only"
      onChange={(e) => {
        onSelect(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
    {photo && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove photo for ${name}`}
        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
      >
        <X className="h-3 w-3" />
      </button>
    )}
  </div>
  );
};

const ManagePlayers = () => {
  const navigate = useNavigate();
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [substituteNames, setSubstituteNames] = useState<string[]>([]);
  const [playerPhotos, setPlayerPhotos] = useState<PhotoMap>({});
  const [substitutePhotos, setSubstitutePhotos] = useState<PhotoMap>({});

  useEffect(() => {
    const savedPlayers = localStorage.getItem('playerNames');
    const savedSubs = localStorage.getItem('substituteNames');
    
    setPlayerNames(savedPlayers ? JSON.parse(savedPlayers) : defaultPlayers);
    setSubstituteNames(savedSubs ? JSON.parse(savedSubs) : defaultSubstitutes);
    setPlayerPhotos(loadPhotos(FIELD_PHOTOS_KEY));
    setSubstitutePhotos(loadPhotos(SUB_PHOTOS_KEY));
  }, []);

  const handlePhotoChange = async (
    index: number,
    file: File | undefined,
    setPhotos: (updater: (prev: PhotoMap) => PhotoMap) => void
  ) => {
    if (!file) return;
    try {
      const photo = await readPhotoFile(file);
      setPhotos(prev => ({ ...prev, [index]: photo }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not use that image');
    }
  };

  const addSubstitute = () => {
    setSubstituteNames(prev => [...prev, '']);
  };

  // Removing a row shifts every later row down, so the photos must shift too
  // or they end up attached to the wrong player.
  const removeSubstitute = (index: number) => {
    setSubstituteNames(prev => prev.filter((_, i) => i !== index));
    setSubstitutePhotos(prev => {
      const next: PhotoMap = {};
      Object.keys(prev)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach(key => {
          if (key === index) return;
          next[key > index ? key - 1 : key] = prev[key];
        });
      return next;
    });
  };

  const removePhoto = (index: number, setPhotos: (updater: (prev: PhotoMap) => PhotoMap) => void) => {
    setPhotos(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handlePlayerNameChange = (index: number, value: string) => {
    const updated = [...playerNames];
    updated[index] = value;
    setPlayerNames(updated);
  };

  const handleSubNameChange = (index: number, value: string) => {
    const updated = [...substituteNames];
    updated[index] = value;
    setSubstituteNames(updated);
  };

  const handleSave = () => {
    const namedSubs = substituteNames
      .map((name, index) => ({ name: name.trim(), photo: substitutePhotos[index] }))
      .filter(sub => sub.name);

    const subPhotos: PhotoMap = {};
    namedSubs.forEach((sub, index) => {
      if (sub.photo) subPhotos[index] = sub.photo;
    });

    try {
      localStorage.setItem('playerNames', JSON.stringify(playerNames));
      localStorage.setItem('substituteNames', JSON.stringify(namedSubs.map(sub => sub.name)));
      savePhotos(FIELD_PHOTOS_KEY, playerPhotos);
      savePhotos(SUB_PHOTOS_KEY, subPhotos);
    } catch {
      toast.error('Not enough browser storage for these photos. Try removing a few.');
      return;
    }

    toast.success(`Saved 11 players and ${namedSubs.length} substitutes`);
    navigate('/');
  };

  const handleReset = () => {
    setPlayerNames(defaultPlayers);
    setSubstituteNames(defaultSubstitutes);
    setPlayerPhotos({});
    setSubstitutePhotos({});
    toast.info('Names and photos reset to defaults');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-status-fit">
              Manage Players
            </h1>
            <p className="text-muted-foreground">
              Update names and photos
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Field Players (11)</CardTitle>
              <CardDescription>Eleven on the pitch, as the rules require</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {playerNames.map((name, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`player-${index}`}>Player {index + 1}</Label>
                  <div className="flex items-center gap-3">
                    <PhotoPicker
                      id={`player-photo-${index}`}
                      name={name}
                      photo={playerPhotos[index]}
                      onSelect={(file) => handlePhotoChange(index, file, setPlayerPhotos)}
                      onRemove={() => removePhoto(index, setPlayerPhotos)}
                    />
                    <Input
                      id={`player-${index}`}
                      value={name}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      placeholder={`Player ${index + 1} name`}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Substitutes ({substituteNames.length})</CardTitle>
              <CardDescription>Add or remove bench players</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {substituteNames.map((name, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`sub-${index}`}>Substitute {index + 1}</Label>
                  <div className="flex items-center gap-3">
                    <PhotoPicker
                      id={`sub-photo-${index}`}
                      name={name}
                      photo={substitutePhotos[index]}
                      onSelect={(file) => handlePhotoChange(index, file, setSubstitutePhotos)}
                      onRemove={() => removePhoto(index, setSubstitutePhotos)}
                    />
                    <Input
                      id={`sub-${index}`}
                      value={name}
                      onChange={(e) => handleSubNameChange(index, e.target.value)}
                      placeholder={`Substitute ${index + 1} name`}
                      autoFocus={name === '' && index === substituteNames.length - 1}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubstitute(index)}
                      aria-label={`Remove substitute ${index + 1}`}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {substituteNames.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No substitutes on the bench yet.
                </p>
              )}

              <Button variant="outline" onClick={addSubstitute} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Substitute
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mt-6 justify-end">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-status-fit hover:bg-status-fit/90 text-white">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManagePlayers;
