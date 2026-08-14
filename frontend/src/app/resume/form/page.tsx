'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Save, Eye, X } from 'lucide-react';
import { ProgressIndicator } from '@/components/common/progress-indicator';
import { PersonalInfoForm } from '@/components/forms/personal-info-form';
import { EducationForm } from '@/components/forms/education-form';
import { ExperienceForm } from '@/components/forms/experience-form';
import { SkillsForm } from '@/components/forms/skills-form';
import { ProjectsForm } from '@/components/forms/projects-form';
import { ExtrasForm } from '@/components/forms/extras-form';
import { ScaledResumePreview } from '@/components/cards/scaled-resume-preview';
import { templatesAPI, authAPI, resumesAPI } from '@/lib/api';
import { transformBackendTemplate } from '@/lib/templateTransform';
import { transformResumeDataForTemplate } from '@/lib/dataTransform';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  hydrateFormFromStoredData,
  createEmptyResumeFormData,
  getTemplateIdFromResume,
  isPersistedResumeId,
} from '@/lib/hydrateResumeForm';
import { Template, FormStep, PersonalInfo } from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/loading-spinner';

function ResumeFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateIdParam = searchParams.get('template');
  const resumeId = searchParams.get('id');
  const { isAuthenticated } = useAuthContext();

  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const [showPreview, setShowPreview] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [resolvedTemplateId, setResolvedTemplateId] = useState<string | null>(
    templateIdParam
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<any>(createEmptyResumeFormData());

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
    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        let nextTemplateId = templateIdParam;
        let hydratedFromResume = false;

        if (isPersistedResumeId(resumeId)) {
          try {
            const response = await resumesAPI.getById(resumeId!);
            const resume = response.resume || response;
            if (resume?.data) {
              setResumeData(hydrateFormFromStoredData(resume.data));
              hydratedFromResume = true;
            }
            const fromResume = getTemplateIdFromResume(resume);
            if (fromResume) nextTemplateId = fromResume;
          } catch (err) {
            console.error('Error loading resume:', err);
            toast.error('Could not load that resume. Starting a blank form.');
          }
        }

        if (nextTemplateId) {
          const response = await templatesAPI.getById(nextTemplateId);
          if (response.template) {
            setTemplate(transformBackendTemplate(response.template));
            setResolvedTemplateId(nextTemplateId);
          } else {
            setLoadError('Template not found.');
          }
        } else if (!hydratedFromResume) {
          setLoadError(
            'No template selected. Choose a template from the gallery to start building.'
          );
        }

        if (!hydratedFromResume && isAuthenticated) {
          try {
            const profileResponse = await authAPI.getProfile();
            if (profileResponse.user?.profileData) {
              setResumeData(
                hydrateFormFromStoredData(profileResponse.user.profileData)
              );
            }
          } catch {
            // Profile autofill is optional
          }
        }
      } catch (err) {
        console.error('Error fetching template:', err);
        setLoadError('Failed to load the builder. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [templateIdParam, resumeId, isAuthenticated]);

  useEffect(() => {
    if (mobilePreviewOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [mobilePreviewOpen]);

  const persistDraft = (showToast = true) => {
    const dataToSave = {
      ...resumeData,
      templateId: resolvedTemplateId,
      templateName: template?.title,
    };
    localStorage.setItem('resumeData', JSON.stringify(dataToSave));
    if (showToast) toast.success('Draft saved on this device');
  };

  const validatePersonal = () => {
    const info = resumeData.personalInfo || {};
    const missing: string[] = [];
    if (!info.name?.trim()) missing.push('Name');
    if (!info.email?.trim()) missing.push('Email');
    if (!info.phone?.trim()) missing.push('Phone');
    if (!info.summary?.trim()) missing.push('Professional summary');
    return missing;
  };

  const handleNext = () => {
    if (currentStep === 'personal') {
      const missing = validatePersonal();
      if (missing.length) {
        toast.error(`Please fill in: ${missing.join(', ')}`);
        return;
      }
    }
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const handleSubmit = async () => {
    const missing = validatePersonal();
    if (missing.length) {
      setCurrentStep('personal');
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return;
    }

    persistDraft(false);

    if (isPersistedResumeId(resumeId) && isAuthenticated) {
      try {
        const transformedData = transformResumeDataForTemplate(
          resumeData,
          template?.title
        );
        await resumesAPI.update(resumeId!, transformedData);
        toast.success('Resume updated');
      } catch (err) {
        console.error(err);
        toast.error('Could not update the saved resume. Draft is still local.');
      }
    }

    const nextId = resumeId || `resume-${Date.now()}`;
    const query = new URLSearchParams();
    if (resolvedTemplateId) query.set('template', resolvedTemplateId);
    query.set('id', nextId);
    router.push(`/resume/preview?${query.toString()}`);
  };

  const updateResumeData = (field: string, value: any) => {
    setResumeData((prev: any) => ({
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
      <div className="py-16">
        <LoadingSpinner size="lg" text="Loading builder..." />
      </div>
    );
  }

  if (loadError && !template) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Can&apos;t open this builder</h1>
          <p className="text-muted-foreground">{loadError}</p>
          <Button asChild>
            <Link href="/templates">Browse templates</Link>
          </Button>
        </div>
      </div>
    );
  }

  const previewPanel = (
    <Card>
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-hidden">
        <div className="border border-border rounded-lg overflow-hidden bg-white">
          <ScaledResumePreview data={resumeData} template={template} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-background pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/templates">
                <ArrowLeft className="h-4 w-4 text-foreground" />
                <span className="hidden sm:inline">Back to Templates</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="hidden lg:inline-flex"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => persistDraft()}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            </div>
          </div>
          {template && (
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold truncate">
                Building with {template.title}
              </h1>
              <p className="text-muted-foreground text-sm line-clamp-2">
                {template.description}
              </p>
            </div>
          )}
        </div>

        <div className="mb-6 sm:mb-8">
          <ProgressIndicator
            steps={steps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
        </div>

        <div
          className={`grid gap-8 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}
        >
          <div className="space-y-6 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStepIndex].label}</CardTitle>
              </CardHeader>
              <CardContent>{renderCurrentForm()}</CardContent>
            </Card>

            <div className="hidden sm:flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 text-foreground" />
                Previous
              </Button>
              {currentStepIndex === steps.length - 1 ? (
                <Button onClick={handleSubmit}>
                  Complete Resume
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {showPreview && (
            <div className="hidden lg:block lg:sticky lg:top-24 lg:h-fit min-w-0">
              {previewPanel}
            </div>
          )}
        </div>
      </div>

      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-safe">
        <div className="px-4 py-3 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setMobilePreviewOpen(true)}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          {currentStepIndex === 0 ? (
            <Button className="flex-1" onClick={handleNext}>
              Next
            </Button>
          ) : currentStepIndex === steps.length - 1 ? (
            <Button className="flex-1" onClick={handleSubmit}>
              Complete
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handlePrevious}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleNext}>
                Next
              </Button>
            </>
          )}
        </div>
      </div>

      {mobilePreviewOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 h-14 border-b border-border">
            <h2 className="font-semibold">Live preview</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobilePreviewOpen(false)}
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
            {previewPanel}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResumeFormPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="py-16">
          <LoadingSpinner text="Loading form..." />
        </div>
      }
    >
      <ResumeFormPage />
    </Suspense>
  );
}
