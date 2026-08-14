'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Save, Eye, X, Import } from 'lucide-react';
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
import { ImportModal } from '@/components/resume-import/ImportModal';
import {
  clearPendingImport,
  getPendingImport,
} from '@/lib/pendingImport';
import { Template, FormStep, PersonalInfo } from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/loading-spinner';

function ResumeFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateIdParam = searchParams.get('template');
  const resumeId = searchParams.get('id');
  const { isAuthenticated, loading: authLoading } = useAuthContext();

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
  const [importOpen, setImportOpen] = useState(false);
  const [importedFrom, setImportedFrom] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [pendingImportId, setPendingImportId] = useState<string | null>(null);
  const [formEpoch, setFormEpoch] = useState(0);
  const importAppliedRef = React.useRef(false);

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
    if (authLoading) return;
    let cancelled = false;

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
            if (resume?.data && !cancelled && !importAppliedRef.current) {
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
          if (cancelled) return;
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

        if (
          !hydratedFromResume &&
          isAuthenticated &&
          !importAppliedRef.current
        ) {
          try {
            const profileResponse = await authAPI.getProfile();
            if (
              profileResponse.user?.profileData &&
              !cancelled &&
              !importAppliedRef.current
            ) {
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
        if (!cancelled) {
          setLoadError('Failed to load the builder. Please try again.');
        }
      } finally {
        if (cancelled) return;
        setLoading(false);
        const pending = getPendingImport();
        if (pending && isAuthenticated && !importAppliedRef.current) {
          setPendingImportId(pending.id);
          setImportOpen(true);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [templateIdParam, resumeId, isAuthenticated, authLoading]);

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

  const handleImportApply = (
    formData: any,
    meta: { id: string; label: string }
  ) => {
    importAppliedRef.current = true;
    const nextData = {
      ...formData,
      templateId: resolvedTemplateId,
      templateName: template?.title,
      sourceUploadedResumeId: meta.id,
    };
    setResumeData(nextData);
    setImportedFrom(meta);
    setShowPreview(true);
    setFormEpoch((value) => value + 1);
    setCurrentStep('personal');
    localStorage.setItem('resumeData', JSON.stringify(nextData));
    clearPendingImport();
    setPendingImportId(null);
  };

  const handleClearImport = () => {
    importAppliedRef.current = false;
    setResumeData({
      ...createEmptyResumeFormData(),
      templateId: resolvedTemplateId,
      templateName: template?.title,
    });
    setImportedFrom(null);
    setFormEpoch((value) => value + 1);
    toast.info('Form data cleared.');
  };

  const openImportModal = () => {
    if (!isAuthenticated) {
      toast.error('Sign in to import from an uploaded resume.');
      router.push('/login');
      return;
    }
    setImportOpen(true);
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
              <Button variant="outline" size="sm" onClick={openImportModal}>
                <Import className="h-4 w-4 mr-2" />
                Import from Resume
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

        {importedFrom && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm">
              Form filled from “{importedFrom.label}”. Review and edit any field
              before saving.
            </p>
            <Button variant="outline" size="sm" onClick={handleClearImport}>
              Clear import
            </Button>
          </div>
        )}

        <div
          className={`grid gap-8 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}
        >
          <div className="space-y-6 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStepIndex].label}</CardTitle>
              </CardHeader>
              <CardContent key={formEpoch}>{renderCurrentForm()}</CardContent>
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

      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onApply={handleImportApply}
        initialResumeId={pendingImportId}
      />
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
