'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Plus, X } from 'lucide-react';
import { Education } from '../../types';

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

export function EducationForm({ data, onChange }: EducationFormProps) {
  const [educationList, setEducationList] = useState<Education[]>(
    data.length > 0
      ? data
      : [
          {
            id: '1',
            institution: '',
            degree: '',
            field: '',
            startDate: '',
            endDate: '',
            gpa: '',
          },
        ]
  );

  useEffect(() => {
    if (data && data.length > 0) {
      setEducationList(
        data.map((edu, index) => ({
          ...edu,
          id: (edu as any).id || `edu-${index}`,
        })) as Education[]
      );
    }
  }, [data]);

  const handleAddEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
    };
    const updated = [...educationList, newEducation];
    setEducationList(updated);
    onChange(updated);
  };

  const handleRemoveEducation = (id: string) => {
    const updated = educationList.filter((edu) => edu.id !== id);
    setEducationList(updated);
    onChange(updated);
  };

  const handleEducationChange = (
    id: string,
    field: keyof Education,
    value: string
  ) => {
    const updated = educationList.map((edu) =>
      edu.id === id ? { ...edu, [field]: value } : edu
    );
    setEducationList(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {educationList.map((education, index) => (
        <Card key={education.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <h3 className="font-medium">Education {index + 1}</h3>
            {educationList.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveEducation(education.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Institution *</Label>
                <Input
                  value={education.institution}
                  onChange={(e) =>
                    handleEducationChange(
                      education.id,
                      'institution',
                      e.target.value
                    )
                  }
                  placeholder="Stanford University"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Degree *</Label>
                <Input
                  value={education.degree}
                  onChange={(e) =>
                    handleEducationChange(
                      education.id,
                      'degree',
                      e.target.value
                    )
                  }
                  placeholder="Bachelor of Science"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Field of Study *</Label>
                <Input
                  value={education.field}
                  onChange={(e) =>
                    handleEducationChange(education.id, 'field', e.target.value)
                  }
                  placeholder="Computer Science"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>GPA</Label>
                <Input
                  value={education.gpa || ''}
                  onChange={(e) =>
                    handleEducationChange(education.id, 'gpa', e.target.value)
                  }
                  placeholder="3.8"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  value={education.startDate}
                  onChange={(e) =>
                    handleEducationChange(
                      education.id,
                      'startDate',
                      e.target.value
                    )
                  }
                  placeholder="2018"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  value={education.endDate}
                  onChange={(e) =>
                    handleEducationChange(
                      education.id,
                      'endDate',
                      e.target.value
                    )
                  }
                  placeholder="2022"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={handleAddEducation} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Another Education
      </Button>
    </div>
  );
}
