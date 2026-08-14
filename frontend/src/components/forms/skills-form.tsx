'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, X } from 'lucide-react';
import { Skill } from '../../types';

interface SkillsFormProps {
  hardSkills: Skill[];
  softSkills: Skill[];
  tools: Skill[];
  onHardSkillsChange: (skills: Skill[]) => void;
  onSoftSkillsChange: (skills: Skill[]) => void;
  onToolsChange: (skills: Skill[]) => void;
}

export function SkillsForm({
  hardSkills,
  softSkills,
  tools,
  onHardSkillsChange,
  onSoftSkillsChange,
  onToolsChange,
}: SkillsFormProps) {
  const skillLevels: Skill['level'][] = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert',
  ];

  const renderSkillSection = (
    title: string,
    skills: Skill[],
    onChange: (skills: Skill[]) => void,
    skillType: 'hard' | 'soft' | 'tool'
  ) => {
    const handleAddSkill = () => {
      const newSkill: Skill = {
        id: Date.now().toString(),
        name: '',
        level: 'Intermediate',
        category: skillType,
      };
      onChange([...skills, newSkill]);
    };

    const handleRemoveSkill = (id: string) => {
      onChange(skills.filter((skill) => skill.id !== id));
    };

    const handleSkillChange = (
      id: string,
      field: keyof Skill,
      value: string
    ) => {
      onChange(
        skills.map((skill) =>
          skill.id === id ? { ...skill, [field]: value } : skill
        )
      );
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {skills.length > 0 ? (
            skills.map((skill, index) => (
              <div key={skill.id} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-2">
                  <Input
                    value={skill.name}
                    onChange={(e) =>
                      handleSkillChange(skill.id, 'name', e.target.value)
                    }
                    placeholder={`${
                      skillType === 'hard'
                        ? 'e.g., JavaScript, Python'
                        : skillType === 'soft'
                        ? 'e.g., Leadership, Communication'
                        : 'e.g., Git, Docker, VS Code'
                    }`}
                  />
                  <Select
                    value={skill.level}
                    onValueChange={(value) =>
                      handleSkillChange(skill.id, 'level', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Proficiency Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="h-10 w-10 p-0 text-destructive hover:text-destructive mt-0.5"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSkill}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First {title.slice(0, title.length - 1)}
            </Button>
          )}
          {skills.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSkill}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another {title.slice(0, title.length - 1)}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        Add your technical and soft skills along with tools and technologies.
        Specify proficiency levels for each skill to help employers understand
        your expertise.
      </div>

      {renderSkillSection(
        'Hard Skills',
        hardSkills,
        onHardSkillsChange,
        'hard'
      )}

      {renderSkillSection(
        'Soft Skills',
        softSkills,
        onSoftSkillsChange,
        'soft'
      )}

      {renderSkillSection('Tools & Technologies', tools, onToolsChange, 'tool')}
    </div>
  );
}
