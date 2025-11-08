'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Save, Eye } from 'lucide-react';
import { ProgressIndicator } from '@/components/common/progress-indicator';
import { PersonalInfoForm } from '@/components/forms/personal-info-form';
import { EducationForm } from '@/components/forms/education-form';
import { ExperienceForm } from '@/components/forms/experience-form';
import { SkillsForm } from '@/components/forms/skills-form';
import { ProjectsForm } from '@/components/forms/projects-form';
import { ExtrasForm } from '@/components/forms/extras-form';
import { ResumePreview } from '@/components/cards/resume-preview';
import { templatesAPI, authAPI } from '@/lib/api';
import { transformBackendTemplate } from '@/lib/templateTransform';
import { transformResumeDataForTemplate } from '@/lib/dataTransform';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Template,
  FormStep,
  PersonalInfo,
  Education,
  Experience,
  Skill,
  Project,
} from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ResumeFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template');
  const resumeId = searchParams.get('id');
  const { isAuthenticated } = useAuthContext();

  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const [showPreview, setShowPreview] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeData, setResumeData] = useState<Partial<any>>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      title: '',
      tagline: '',
      website: '',
      linkedin: '',
    },
    education: [],
    experience: [],
    skills: [],
    projects: [],
    languages: [],
    certifications: [],
    achievements: [],
    technicalSkills: '',
    softSkills: '',
    tools: '',
    additionalInfo: [],
  });

  const steps: { key: FormStep; label: string }[] = [
    { key: 'personal', label: 'Personal Info' },
    { key: 'education', label: 'Education' },
    { key: 'experience', label: 'Experience' },
    { key: 'skills', label: 'Skills' },
    { key: 'projects', label: 'Projects' },
    { key: 'extras', label: 'Extras' },
  ];

  const currentStepIndex = steps.findIndex((step) => step.key === currentStep);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        if (templateId) {
          const response = await templatesAPI.getById(templateId);
          if (response.template) {
            const transformedTemplate = transformBackendTemplate(
              response.template
            );
            setTemplate(transformedTemplate);
          }
        }
      } catch (err) {
        console.error('Error fetching template:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  // Load user profile data for auto-fill
  useEffect(() => {
    const loadProfileData = async () => {
      if (isAuthenticated) {
        try {
          const response = await authAPI.getProfile();
          if (response.user && response.user.profileData) {
            const profileData = response.user.profileData;

            // Pre-populate form with profile data
            setResumeData({
              personalInfo: {
                name: profileData.name || profileData.personalInfo?.name || '',
                email:
                  profileData.email || profileData.personalInfo?.email || '',
                phone:
                  profileData.phone || profileData.personalInfo?.phone || '',
                location:
                  profileData.location ||
                  profileData.personalInfo?.location ||
                  '',
                summary:
                  profileData.summary ||
                  profileData.personalInfo?.summary ||
                  '',
                title:
                  profileData.title || profileData.personalInfo?.title || '',
                tagline:
                  profileData.tagline ||
                  profileData.personalInfo?.tagline ||
                  '',
                website:
                  profileData.website ||
                  profileData.personalInfo?.website ||
                  '',
                linkedin:
                  profileData.linkedin ||
                  profileData.personalInfo?.linkedin ||
                  '',
              },
              education: profileData.education || [],
              experience: profileData.experience || [],
              hardSkillsList:
                profileData.hardSkillsList ||
                profileData.skills?.hardSkills ||
                [],
              softSkillsList:
                profileData.softSkillsList ||
                profileData.skills?.softSkills ||
                [],
              toolsList:
                profileData.toolsList || profileData.skills?.tools || [],
              projects: profileData.projects || [],
              languages: profileData.languages || [],
              certifications: profileData.certifications || [],
              achievements: profileData.achievements || [],
              additionalInfo: profileData.additionalInfo || [],
            });
          }
        } catch (error) {
          console.error('Error loading profile data:', error);
          // Don't show error to user - they can still fill form manually
        }
      }
    };

    loadProfileData();
  }, [isAuthenticated]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const handleSubmit = () => {
    // Store the original data structure with template ID in localStorage for the preview page
    const dataToSave = {
      ...resumeData,
      templateId: templateId,
      templateName: template?.title,
    };
    localStorage.setItem('resumeData', JSON.stringify(dataToSave));

    // Create a new resume ID if this is a new resume
    const newResumeId = resumeId || `resume-${Date.now()}`;
    router.push(`/resume/preview?template=${templateId}&id=${newResumeId}`);
  };

  const updateResumeData = (field: string, value: any) => {
    setResumeData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderCurrentForm = () => {
    switch (currentStep) {
      case 'personal':
        return (
          <PersonalInfoForm
            data={resumeData.personalInfo as PersonalInfo}
            onChange={(data) => updateResumeData('personalInfo', data)}
          />
        );
      case 'education':
        return (
          <EducationForm
            data={resumeData.education || []}
            onChange={(data) => updateResumeData('education', data)}
          />
        );
      case 'experience':
        return (
          <ExperienceForm
            data={resumeData.experience || []}
            onChange={(data) => updateResumeData('experience', data)}
          />
        );
      case 'skills':
        return (
          <SkillsForm
            hardSkills={resumeData.hardSkillsList || []}
            softSkills={resumeData.softSkillsList || []}
            tools={resumeData.toolsList || []}
            onHardSkillsChange={(data) =>
              updateResumeData('hardSkillsList', data)
            }
            onSoftSkillsChange={(data) =>
              updateResumeData('softSkillsList', data)
            }
            onToolsChange={(data) => updateResumeData('toolsList', data)}
          />
        );
      case 'projects':
        return (
          <ProjectsForm
            data={resumeData.projects || []}
            onChange={(data) => updateResumeData('projects', data)}
          />
        );
      case 'extras':
        return (
          <ExtrasForm
            languages={resumeData.languages || []}
            certifications={resumeData.certifications || []}
            achievements={resumeData.achievements || []}
            additionalInfo={resumeData.additionalInfo || []}
            onLanguagesChange={(data) => updateResumeData('languages', data)}
            onCertificationsChange={(data) =>
              updateResumeData('certifications', data)
            }
            onAchievementsChange={(data) =>
              updateResumeData('achievements', data)
            }
            onAdditionalInfoChange={(data) =>
              updateResumeData('additionalInfo', data)
            }
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-white mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading template...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="flex items-center space-x-2"
            >
              <Link href="/templates">
                <ArrowLeft className="h-4 w-4 text-foreground" />
                <span>Back to Templates</span>
              </Link>
            </Button>
            {template && (
              <div>
                <h1 className="text-2xl font-semibold">
                  Building with {template.title}
                </h1>
                <p className="text-muted-foreground">{template.description}</p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="hidden lg:flex"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Draft saved!')}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator
            steps={steps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStepIndex].label}</CardTitle>
              </CardHeader>
              <CardContent>{renderCurrentForm()}</CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4 text-foreground" />
                <span>Previous</span>
              </Button>

              {currentStepIndex === steps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  className="flex items-center space-x-2"
                >
                  <span>Complete Resume</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="lg:sticky lg:top-8 lg:h-fit">
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <ResumePreview data={resumeData} template={template} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
