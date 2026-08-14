'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Plus, X } from 'lucide-react';
import { Experience } from '../../types';

interface ExperienceFormProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

export function ExperienceForm({ data, onChange }: ExperienceFormProps) {
  const [experienceList, setExperienceList] = useState<Experience[]>(
    data.length > 0
      ? data
      : [
          {
            id: '1',
            company: '',
            position: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            description: '',
            responsibilities: [],
          },
        ]
  );

  useEffect(() => {
    if (data && data.length > 0) {
      setExperienceList(
        data.map((exp, index) => ({
          ...exp,
          id: (exp as any).id || `exp-${index}`,
          position: (exp as any).position || (exp as any).title || '',
        })) as Experience[]
      );
    }
  }, [data]);

  const handleAddExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      responsibilities: [],
    };
    const updated = [...experienceList, newExperience];
    setExperienceList(updated);
    onChange(updated);
  };

  const handleRemoveExperience = (id: string) => {
    const updated = experienceList.filter((exp) => exp.id !== id);
    setExperienceList(updated);
    onChange(updated);
  };

  const handleExperienceChange = (
    id: string,
    field: keyof Experience,
    value: string | boolean | string[]
  ) => {
    const updated = experienceList.map((exp) =>
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    setExperienceList(updated);
    onChange(updated);
  };

  const handleAddResponsibility = (expId: string) => {
    const updated = experienceList.map((exp) =>
      exp.id === expId
        ? { ...exp, responsibilities: [...(exp.responsibilities || []), ''] }
        : exp
    );
    setExperienceList(updated);
    onChange(updated);
  };

  const handleRemoveResponsibility = (expId: string, index: number) => {
    const updated = experienceList.map((exp) =>
      exp.id === expId
        ? {
            ...exp,
            responsibilities:
              exp.responsibilities?.filter((_, i) => i !== index) || [],
          }
        : exp
    );
    setExperienceList(updated);
    onChange(updated);
  };

  const handleResponsibilityChange = (
    expId: string,
    index: number,
    value: string
  ) => {
    const updated = experienceList.map((exp) => {
      if (exp.id === expId) {
        const newResponsibilities = [...(exp.responsibilities || [])];
        newResponsibilities[index] = value;
        return { ...exp, responsibilities: newResponsibilities };
      }
      return exp;
    });
    setExperienceList(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {experienceList.map((experience, index) => (
        <Card key={experience.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <h3 className="font-medium">Experience {index + 1}</h3>
            {experienceList.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveExperience(experience.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company *</Label>
                <Input
                  value={experience.company}
                  onChange={(e) =>
                    handleExperienceChange(
                      experience.id,
                      'company',
                      e.target.value
                    )
                  }
                  placeholder="Google"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Position *</Label>
                <Input
                  value={experience.position}
                  onChange={(e) =>
                    handleExperienceChange(
                      experience.id,
                      'position',
                      e.target.value
                    )
                  }
                  placeholder="Software Engineer"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>
              <Input
                value={experience.location}
                onChange={(e) =>
                  handleExperienceChange(
                    experience.id,
                    'location',
                    e.target.value
                  )
                }
                placeholder="San Francisco, CA"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  value={experience.startDate}
                  onChange={(e) =>
                    handleExperienceChange(
                      experience.id,
                      'startDate',
                      e.target.value
                    )
                  }
                  placeholder="Jan 2022"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  value={experience.endDate}
                  onChange={(e) =>
                    handleExperienceChange(
                      experience.id,
                      'endDate',
                      e.target.value
                    )
                  }
                  placeholder="Dec 2023"
                  disabled={experience.current}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`current-${experience.id}`}
                checked={experience.current}
                onCheckedChange={(checked) =>
                  handleExperienceChange(
                    experience.id,
                    'current',
                    checked as boolean
                  )
                }
              />
              <Label htmlFor={`current-${experience.id}`}>
                I currently work here
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Job Description</Label>
              <Textarea
                value={experience.description}
                onChange={(e) =>
                  handleExperienceChange(
                    experience.id,
                    'description',
                    e.target.value
                  )
                }
                placeholder="Brief overview of your role..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Job Responsibilities *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddResponsibility(experience.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Point
                </Button>
              </div>
              <div className="space-y-2">
                {experience.responsibilities &&
                experience.responsibilities.length > 0 ? (
                  experience.responsibilities.map(
                    (responsibility, respIndex) => (
                      <div key={respIndex} className="flex gap-2">
                        <Input
                          value={responsibility}
                          onChange={(e) =>
                            handleResponsibilityChange(
                              experience.id,
                              respIndex,
                              e.target.value
                            )
                          }
                          placeholder={`Responsibility ${respIndex + 1}...`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveResponsibility(experience.id, respIndex)
                          }
                          className="h-10 w-10 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  )
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddResponsibility(experience.id)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Responsibility
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Add bullet points for your key responsibilities and
                achievements. Focus on quantifiable impact.
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={handleAddExperience}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Experience
      </Button>
    </div>
  );
}
