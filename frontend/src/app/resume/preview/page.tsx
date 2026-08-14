'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Download,
  Edit3,
  Save,
  Share2,
  MoreHorizontal,
  Check,
  Circle,
} from 'lucide-react';
import { ScaledResumePreview } from '@/components/cards/scaled-resume-preview';
import { PersonalInfoForm } from '@/components/forms/personal-info-form';
import { EducationForm } from '@/components/forms/education-form';
import { ExperienceForm } from '@/components/forms/experience-form';
import { SkillsForm } from '@/components/forms/skills-form';
import { ProjectsForm } from '@/components/forms/projects-form';
import { ExtrasForm } from '@/components/forms/extras-form';
import { templatesAPI, resumesAPI, authAPI } from '@/lib/api';
import { transformBackendTemplate } from '@/lib/templateTransform';
import { transformResumeDataForTemplate } from '@/lib/dataTransform';
import {
  hydrateFormFromStoredData,
  createEmptyResumeFormData,
  getTemplateIdFromResume,
  isPersistedResumeId,
} from '@/lib/hydrateResumeForm';
import { Template, PersonalInfo } from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LoadingSpinner from '@/components/common/loading-spinner';
import './resume-preview.css';

function ResumePreviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateIdParam = searchParams.get('template');
  const resumeId = searchParams.get('id');
  const { isAuthenticated } = useAuthContext();

  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string>('personal');
  const [template, setTemplate] = useState<Template | null>(null);
  const [resolvedTemplateId, setResolvedTemplateId] = useState<string | null>(
    templateIdParam
  );
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [persistedId, setPersistedId] = useState<string | null>(
    isPersistedResumeId(resumeId) ? resumeId : null
  );

  const [currentResumeData, setCurrentResumeData] = useState<any>(
    createEmptyResumeFormData()
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let nextTemplateId = templateIdParam;
        let loadedFromApi = false;

        if (isPersistedResumeId(resumeId)) {
          try {
            const response = await resumesAPI.getById(resumeId!);
            const resume = response.resume || response;
            if (resume?.data) {
              setCurrentResumeData(hydrateFormFromStoredData(resume.data));
              loadedFromApi = true;
              setPersistedId(resume._id || resumeId);
              setUpdatedAt(resume.updatedAt || resume.createdAt || null);
            }
            const fromResume = getTemplateIdFromResume(resume);
            if (fromResume) nextTemplateId = fromResume;
          } catch (err) {
            console.error('Error loading resume:', err);
          }
        }

        if (!loadedFromApi) {
          const savedData = localStorage.getItem('resumeData');
          if (savedData) {
            const parsed = JSON.parse(savedData);
            setCurrentResumeData(hydrateFormFromStoredData(parsed));
            if (!nextTemplateId && parsed.templateId) {
              nextTemplateId = parsed.templateId;
            }
          }
        }

        if (nextTemplateId) {
          const response = await templatesAPI.getById(nextTemplateId);
          if (response.template) {
            setTemplate(transformBackendTemplate(response.template));
            setResolvedTemplateId(nextTemplateId);
          }
        }
      } catch (err) {
        console.error('Error loading preview:', err);
        toast.error('Failed to load preview data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [templateIdParam, resumeId]);

  const handleDownloadPDF = async () => {
    try {
      if (!resolvedTemplateId) {
        toast.error('No template selected');
        return;
      }

      if (!isAuthenticated) {
        toast.error('Please log in to download your resume');
        router.push('/login');
        return;
      }

      const requiredFields = [];
      if (!currentResumeData.personalInfo?.name) requiredFields.push('Name');
      if (!currentResumeData.personalInfo?.email) requiredFields.push('Email');
      if (!currentResumeData.personalInfo?.phone) requiredFields.push('Phone');
      if (!currentResumeData.personalInfo?.summary)
        requiredFields.push('Professional Summary');

      if (requiredFields.length > 0) {
        toast.error(
          `Please fill in required fields: ${requiredFields.join(', ')}`
        );
        return;
      }

      const transformedData = transformResumeDataForTemplate(
        currentResumeData,
        template?.title
      );

      setDownloading(true);
      toast.loading('Creating your resume...');

      const response = await resumesAPI.create({
        templateId: resolvedTemplateId,
        data: transformedData,
      });

      if (response.resume && response.resume._id) {
        setPersistedId(response.resume._id);
        toast.loading('Generating PDF...');
        const pdfBlob = await resumesAPI.download(response.resume._id);
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${transformedData.name || 'resume'}-resume.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success('PDF downloaded successfully!');
      } else {
        throw new Error('Resume creation failed - no resume ID returned');
      }
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.dismiss();
      if (error.status === 400) {
        toast.error(
          `${error.details?.message || error.message || 'Invalid resume data'}. Please check all required fields.`
        );
      } else if (error.status === 404) {
        toast.error('Template not found. Please refresh and try again.');
      } else if (error.status === 401) {
        toast.error('Please log in to download your resume');
        router.push('/login');
      } else {
        toast.error(error.message || 'Failed to download PDF. Please try again.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!isAuthenticated) {
        toast.error('Please log in to save your resume data');
        return;
      }
      await authAPI.updateProfile(currentResumeData);
      if (isPersistedResumeId(persistedId)) {
        const transformedData = transformResumeDataForTemplate(
          currentResumeData,
          template?.title
        );
        await resumesAPI.update(persistedId!, transformedData);
      }
      localStorage.setItem(
        'resumeData',
        JSON.stringify({
          ...currentResumeData,
          templateId: resolvedTemplateId,
          templateName: template?.title,
        })
      );
      toast.success('Resume data saved successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save resume data. Please try again.');
    }
  };

  const handleShare = async () => {
    const name = currentResumeData.personalInfo?.name || 'My';
    if (!isAuthenticated) {
      toast.error('Sign in to create a public share link');
      router.push('/login');
      return;
    }
    if (!isPersistedResumeId(persistedId)) {
      toast.error('Download the PDF once to save this resume, then share it.');
      return;
    }
    try {
      setSharing(true);
      const response = await resumesAPI.share(persistedId!, 30);
      const publicUrl = response.shareToken
        ? `${window.location.origin}/resume/public/${response.shareToken}`
        : response.shareUrl;
      if (navigator.share) {
        await navigator.share({
          title: `${name}'s Resume`,
          text: 'Check out my resume',
          url: publicUrl,
        });
      } else {
        await navigator.clipboard.writeText(publicUrl);
        toast.success('Public share link copied to clipboard');
      }
    } catch (error) {
      console.error(error);
      toast.error('Could not create a share link');
    } finally {
      setSharing(false);
    }
  };

  const updateResumeData = (field: string, value: any) => {
    setCurrentResumeData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderEditForm = () => {
    switch (editingSection) {
      case 'personal':
        return (
          <PersonalInfoForm
            data={currentResumeData.personalInfo as PersonalInfo}
            onChange={(data) => updateResumeData('personalInfo', data)}
          />
        );
      case 'education':
        return (
          <EducationForm
            data={currentResumeData.education || []}
            onChange={(data) => updateResumeData('education', data)}
          />
        );
      case 'experience':
        return (
          <ExperienceForm
            data={currentResumeData.experience || []}
            onChange={(data) => updateResumeData('experience', data)}
          />
        );
      case 'skills':
        return (
          <SkillsForm
            hardSkills={currentResumeData.hardSkillsList || []}
            softSkills={currentResumeData.softSkillsList || []}
            tools={currentResumeData.toolsList || []}
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
            data={currentResumeData.projects || []}
            onChange={(data) => updateResumeData('projects', data)}
          />
        );
      case 'extras':
        return (
          <ExtrasForm
            languages={currentResumeData.languages || []}
            certifications={currentResumeData.certifications || []}
            achievements={currentResumeData.achievements || []}
            additionalInfo={currentResumeData.additionalInfo || []}
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

  const sections = [
    { key: 'personal', label: 'Personal Info' },
    { key: 'education', label: 'Education' },
    { key: 'experience', label: 'Experience' },
    { key: 'skills', label: 'Skills' },
    { key: 'projects', label: 'Projects' },
    { key: 'extras', label: 'Extras' },
  ];

  const sectionStatus = [
    {
      label: 'Personal Info',
      done: Boolean(currentResumeData.personalInfo?.name),
    },
    {
      label: 'Experience',
      done: (currentResumeData.experience || []).length > 0,
    },
    {
      label: 'Education',
      done: (currentResumeData.education || []).length > 0,
    },
    {
      label: 'Skills',
      done:
        (currentResumeData.hardSkillsList || []).length > 0 ||
        (currentResumeData.softSkillsList || []).length > 0,
    },
    {
      label: 'Projects',
      done: (currentResumeData.projects || []).length > 0,
    },
  ];

  const editHref = resolvedTemplateId
    ? `/resume/form?template=${resolvedTemplateId}${persistedId ? `&id=${persistedId}` : resumeId ? `&id=${resumeId}` : ''}`
    : `/resume/form${resumeId ? `?id=${resumeId}` : ''}`;

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner size="lg" text="Loading preview..." />
      </div>
    );
  }

  const hasData = Boolean(currentResumeData.personalInfo?.name || template);

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 text-foreground" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold">
                Resume Preview
              </h1>
              <p className="text-muted-foreground text-sm truncate">
                {template
                  ? `Using ${template.title}`
                  : 'Preview your resume'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              className="flex-1 sm:flex-none"
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Downloading…' : 'Download PDF'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[60]">
                <DropdownMenuItem onClick={handleShare} disabled={sharing}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share public link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEditing(!isEditing)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  {isEditing ? 'Close editor' : 'Edit data'}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={editHref}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Open builder
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {!hasData && (
          <Card className="mb-6">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                No resume data found. Open a resume from the dashboard or start
                from a template.
              </p>
              <Button asChild>
                <Link href="/templates">Browse templates</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-8">
          <div className="order-2 lg:order-1 space-y-6 min-w-0">
            {isEditing ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Resume Sections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sections.map((section) => (
                        <Button
                          key={section.key}
                          variant={
                            editingSection === section.key
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => setEditingSection(section.key)}
                          className="justify-start whitespace-normal h-auto py-2"
                        >
                          {section.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle>
                        Edit{' '}
                        {sections.find((s) => s.key === editingSection)?.label}
                      </CardTitle>
                      <Button onClick={handleSave} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>{renderEditForm()}</CardContent>
                </Card>
              </>
            ) : (
              <Card className="hidden lg:block">
                <CardHeader>
                  <CardTitle>Resume Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h2 className="font-medium text-sm text-muted-foreground mb-1">
                      Template
                    </h2>
                    <p>{template?.title || 'Unknown template'}</p>
                  </div>
                  {updatedAt && (
                    <div>
                      <h2 className="font-medium text-sm text-muted-foreground mb-1">
                        Last updated
                      </h2>
                      <p>{new Date(updatedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <h2 className="font-medium text-sm text-muted-foreground mb-2">
                      Sections
                    </h2>
                    <div className="space-y-2">
                      {sectionStatus.map((section) => (
                        <div
                          key={section.label}
                          className="flex justify-between text-sm items-center"
                        >
                          <span>{section.label}</span>
                          {section.done ? (
                            <Check
                              className="h-4 w-4 text-primary"
                              aria-label="Complete"
                            />
                          ) : (
                            <Circle
                              className="h-4 w-4 text-muted-foreground"
                              aria-label="Incomplete"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-24 lg:h-fit min-w-0 overflow-x-hidden">
            <div className="border border-border rounded-xl overflow-hidden bg-muted/30">
              <div className="px-4 sm:px-6 py-4 border-b border-border bg-card">
                <h2 className="text-lg font-semibold">Resume Preview</h2>
              </div>
              <div className="p-2 sm:p-4 overflow-x-hidden">
                <ScaledResumePreview
                  data={currentResumeData}
                  template={template}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResumePreviewPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="py-16">
          <LoadingSpinner text="Loading preview..." />
        </div>
      }
    >
      <ResumePreviewPage />
    </Suspense>
  );
}
