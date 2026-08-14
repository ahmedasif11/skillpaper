import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, X } from 'lucide-react';
import { AchievementsForm } from './achievements-form';

interface ExtrasFormProps {
  languages: string[];
  certifications: string[];
  achievements: string[];
  additionalInfo: string[];
  onLanguagesChange: (languages: string[]) => void;
  onCertificationsChange: (certifications: string[]) => void;
  onAchievementsChange: (achievements: string[]) => void;
  onAdditionalInfoChange: (info: string[]) => void;
}

export function ExtrasForm({
  languages,
  certifications,
  achievements,
  additionalInfo,
  onLanguagesChange,
  onCertificationsChange,
  onAchievementsChange,
  onAdditionalInfoChange,
}: ExtrasFormProps) {
  const languageLabels = (languages || []).map((item: any) =>
    typeof item === 'string' ? item : item?.language || String(item)
  );
  const certificationLabels = (certifications || []).map((item: any) =>
    typeof item === 'string' ? item : item?.name || String(item)
  );
  const [newLanguage, setNewLanguage] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newAdditional, setNewAdditional] = useState('');

  const handleAddLanguage = () => {
    const lang = newLanguage.trim();
    if (lang && !languageLabels.includes(lang)) {
      onLanguagesChange([...languageLabels, lang]);
    }
    setNewLanguage('');
  };

  const handleRemoveLanguage = (language: string) => {
    onLanguagesChange(languageLabels.filter((lang) => lang !== language));
  };

  const handleAddCertification = () => {
    const cert = newCertification.trim();
    if (cert && !certificationLabels.includes(cert)) {
      onCertificationsChange([...certificationLabels, cert]);
    }
    setNewCertification('');
  };

  const handleRemoveCertification = (certification: string) => {
    onCertificationsChange(
      certificationLabels.filter((cert) => cert !== certification)
    );
  };

  const handleLanguageKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLanguage();
    }
  };

  const handleCertificationKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCertification();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        Add additional information that might be relevant to your application,
        such as languages you speak, professional certifications, and
        achievements.
      </div>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <AchievementsForm
            achievements={achievements}
            onChange={onAchievementsChange}
          />
        </CardContent>
      </Card>

      {/* Languages Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Languages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Languages You Speak</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {languageLabels.map((language) => (
                <div
                  key={language}
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md"
                >
                  <span>{language}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLanguage(language)}
                    className="h-auto p-0 hover:bg-transparent hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="e.g., English (Native), Spanish (Conversational)"
                onKeyDown={handleLanguageKeyPress}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLanguage}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Include proficiency level (e.g., Native, Fluent, Conversational,
              Basic)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Certifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Certifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Professional Certifications</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {certificationLabels.map((certification) => (
                <div
                  key={certification}
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md"
                >
                  <span>{certification}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCertification(certification)}
                    className="h-auto p-0 hover:bg-transparent hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="e.g., AWS Certified Developer, PMP, Google Analytics Certified"
                onKeyDown={handleCertificationKeyPress}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCertification}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Include relevant professional certifications, licenses, or
              credentials
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">
                Additional Information
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                Add any other relevant information (e.g., availability,
                volunteer work, etc.)
              </p>
            </div>

            {additionalInfo.map((info, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={info}
                  onChange={(e) => {
                    const updated = [...additionalInfo];
                    updated[index] = e.target.value;
                    onAdditionalInfoChange(updated);
                  }}
                  placeholder="e.g., Open to relocation"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updated = additionalInfo.filter(
                      (_, i) => i !== index
                    );
                    onAdditionalInfoChange(updated);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Add additional information..."
                className="flex-1"
                value={newAdditional}
                onChange={(e) => setNewAdditional(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newAdditional.trim()) {
                    onAdditionalInfoChange([
                      ...additionalInfo,
                      newAdditional.trim(),
                    ]);
                    setNewAdditional('');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (newAdditional.trim()) {
                    onAdditionalInfoChange([
                      ...additionalInfo,
                      newAdditional.trim(),
                    ]);
                    setNewAdditional('');
                  }
                }}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Optional Sections</h4>
        <p className="text-sm text-muted-foreground">
          These sections are optional but can help strengthen your application.
          Only include information that is relevant to the positions you&apos;re
          applying for.
        </p>
      </div>
    </div>
  );
}
