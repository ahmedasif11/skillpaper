import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface AchievementsFormProps {
  achievements: string[];
  onChange: (achievements: string[]) => void;
}

export function AchievementsForm({
  achievements,
  onChange,
}: AchievementsFormProps) {
  const [newAchievement, setNewAchievement] = useState('');

  const addAchievement = () => {
    if (newAchievement.trim()) {
      onChange([...achievements, newAchievement.trim()]);
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    onChange(achievements.filter((_, i) => i !== index));
  };

  const updateAchievement = (index: number, value: string) => {
    const updated = [...achievements];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Key Achievements</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Highlight your most significant accomplishments with quantifiable
          results
        </p>
      </div>

      {achievements.map((achievement, index) => (
        <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
          <Textarea
            value={achievement}
            onChange={(e) => updateAchievement(index, e.target.value)}
            placeholder="e.g., Increased platform engagement by 200% year-over-year through feature optimization"
            className="flex-1 min-h-[60px]"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => removeAchievement(index)}
            className="shrink-0"
            aria-label="Remove achievement"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row gap-2">
        <Textarea
          value={newAchievement}
          onChange={(e) => setNewAchievement(e.target.value)}
          placeholder="Add a new achievement..."
          className="flex-1 min-h-[60px]"
        />
        <Button
          type="button"
          variant="outline"
          onClick={addAchievement}
          disabled={!newAchievement.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

interface AdditionalInfoFormProps {
  additionalInfo: string[];
  onChange: (additionalInfo: string[]) => void;
}

export function AdditionalInfoForm({
  additionalInfo,
  onChange,
}: AdditionalInfoFormProps) {
  const [newInfo, setNewInfo] = useState('');

  const addInfo = () => {
    if (newInfo.trim()) {
      onChange([...additionalInfo, newInfo.trim()]);
      setNewInfo('');
    }
  };

  const removeInfo = (index: number) => {
    onChange(additionalInfo.filter((_, i) => i !== index));
  };

  const updateInfo = (index: number, value: string) => {
    const updated = [...additionalInfo];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Additional Information</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Add any other relevant information (e.g., availability, volunteer
          work, etc.)
        </p>
      </div>

      {additionalInfo.map((info, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Input
            value={info}
            onChange={(e) => updateInfo(index, e.target.value)}
            placeholder="e.g., Open to relocation"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeInfo(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <div className="flex space-x-2">
        <Input
          value={newInfo}
          onChange={(e) => setNewInfo(e.target.value)}
          placeholder="Add additional information..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={addInfo}
          disabled={!newInfo.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
