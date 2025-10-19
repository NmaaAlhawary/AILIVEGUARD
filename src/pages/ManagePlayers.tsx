import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const defaultPlayers = [
  'Al-Dawsari', 'Al-Shehri', 'Al-Faraj', 'Al-Burayk', 'Otaif',
  'Al-Amri', 'Al-Bulaihi', 'Al-Shahrani', 'Al-Owais', 'Kanno', 'Al-Najei'
];

const defaultSubstitutes = ['Al-Hassan', 'Al-Ghamdi', 'Al-Dosari', 'Bahbri'];

const ManagePlayers = () => {
  const navigate = useNavigate();
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [substituteNames, setSubstituteNames] = useState<string[]>([]);

  useEffect(() => {
    const savedPlayers = localStorage.getItem('playerNames');
    const savedSubs = localStorage.getItem('substituteNames');
    
    setPlayerNames(savedPlayers ? JSON.parse(savedPlayers) : defaultPlayers);
    setSubstituteNames(savedSubs ? JSON.parse(savedSubs) : defaultSubstitutes);
  }, []);

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
    localStorage.setItem('playerNames', JSON.stringify(playerNames));
    localStorage.setItem('substituteNames', JSON.stringify(substituteNames));
    toast.success('Player names saved successfully!');
    navigate('/');
  };

  const handleReset = () => {
    setPlayerNames(defaultPlayers);
    setSubstituteNames(defaultSubstitutes);
    toast.info('Names reset to defaults');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              Manage Players
            </h1>
            <p className="text-muted-foreground">
              Update player and substitute names
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Field Players (11)</CardTitle>
              <CardDescription>Main team players on the field</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {playerNames.map((name, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`player-${index}`}>Player {index + 1}</Label>
                  <Input
                    id={`player-${index}`}
                    value={name}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    placeholder={`Player ${index + 1} name`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Substitutes (4)</CardTitle>
              <CardDescription>Bench players ready to substitute</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {substituteNames.map((name, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`sub-${index}`}>Substitute {index + 1}</Label>
                  <Input
                    id={`sub-${index}`}
                    value={name}
                    onChange={(e) => handleSubNameChange(index, e.target.value)}
                    placeholder={`Substitute ${index + 1} name`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mt-6 justify-end">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManagePlayers;
