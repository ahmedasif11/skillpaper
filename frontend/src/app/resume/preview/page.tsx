'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Edit3, Save, Share2 } from 'lucide-react';
import { ResumePreview } from '@/components/cards/resume-preview';
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
  Template,
  PersonalInfo,
  Education,
  Experience,
  Skill,
  Project,
} from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import './resume-preview.css';

export default function ResumePreviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template');
  const resumeId = searchParams.get('id');
  const { isAuthenticated, user } = useAuthContext();

  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string>('personal');
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentResumeData, setCurrentResumeData] = useState<Partial<any>>({
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
    hardSkillsList: [],
    softSkillsList: [],
    toolsList: [],
    projects: [],
    languages: [],
    certifications: [],
    achievements: [],
    additionalInfo: [],
  });

  useEffect(() => {
    // Load resume data from localStorage
    const savedData = localStorage.getItem('resumeData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Ensure we have the proper structure
        setCurrentResumeData({
          personalInfo: parsedData.personalInfo || {
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
          education: parsedData.education || [],
          experience: parsedData.experience || [],
          hardSkillsList: parsedData.hardSkillsList || [],
          softSkillsList: parsedData.softSkillsList || [],
          toolsList: parsedData.toolsList || [],
          projects: parsedData.projects || [],
          languages: parsedData.languages || [],
          certifications: parsedData.certifications || [],
          achievements: parsedData.achievements || [],
          additionalInfo: parsedData.additionalInfo || [],
        });
      } catch (error) {
        console.error('Error parsing saved resume data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching template with ID:', templateId);

        if (templateId) {
          const response = await templatesAPI.getById(templateId);
          console.log('✅ Template fetched:', response.template?.name);

          if (response.template) {
            const transformedTemplate = transformBackendTemplate(
              response.template
            );
            setTemplate(transformedTemplate);
          } else {
            console.warn('⚠️ No template in response');
          }
        } else {
          console.warn('⚠️ No template ID provided');
          // Try to get template ID from localStorage if available
          const savedData = localStorage.getItem('resumeData');
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              if (parsed.templateId) {
                console.log(
                  '📦 Found template ID in localStorage:',
                  parsed.templateId
                );
                const response = await templatesAPI.getById(parsed.templateId);
                if (response.template) {
                  const transformedTemplate = transformBackendTemplate(
                    response.template
                  );
                  setTemplate(transformedTemplate);
                }
              }
            } catch (e) {
              console.error('Error parsing localStorage:', e);
            }
          }
        }
      } catch (err: any) {
        console.error('❌ Error fetching template:', err);
        console.error('Error details:', {
          message: err.message,
          status: err.status,
          templateId: templateId,
        });
        toast.error('Failed to load template. Using default preview.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  const handleDownloadPDF = async () => {
    try {
      if (!templateId) {
        toast.error('No template selected');
        return;
      }

      if (!isAuthenticated) {
        toast.error('Please log in to download your resume');
        router.push('/login');
        return;
      }

      // Validate required fields
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

      // Transform the data for the backend - pass template name for template-specific transformations
      const transformedData = transformResumeDataForTemplate(
        currentResumeData,
        template?.title
      );

      console.log('📄 Transformed data for backend:', transformedData);
      console.log('📄 Template ID:', templateId);

      toast.loading('Creating your resume...');

      // Create resume in backend
      const response = await resumesAPI.create({
        templateId: templateId,
        data: transformedData,
      });

      console.log('✅ Resume created:', response.resume);

      if (response.resume && response.resume._id) {
        toast.loading('Generating PDF...');

        // Download the PDF
        const pdfBlob = await resumesAPI.download(response.resume._id);

        console.log('📥 PDF downloaded, size:', pdfBlob.size);

        // Create download link
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
      console.error('❌ Error downloading PDF:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        details: error.details,
      });
      toast.dismiss();

      // More detailed error message
      if (error.status === 400) {
        const errorMsg =
          error.details?.message || error.message || 'Invalid resume data';
        toast.error(`${errorMsg}. Please check all required fields.`);
      } else if (error.status === 404) {
        toast.error('Template not found. Please refresh and try again.');
      } else if (error.status === 401) {
        toast.error('Please log in to download your resume');
        router.push('/login');
      } else {
        toast.error(
          error.message || 'Failed to download PDF. Please try again.'
        );
      }
    }
  };

  const handleSave = async () => {
    try {
      if (!isAuthenticated) {
        toast.error('Please log in to save your resume data');
        return;
      }

      // Save resume data to user profile for auto-fill in future
      await authAPI.updateProfile(currentResumeData);

      toast.success('Resume data saved successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save resume data. Please try again.');
    }
  };

  const handleShare = () => {
    // In a real app, this would generate a shareable link
    const shareData = {
      title: `${currentResumeData.personalInfo?.fullName}'s Resume`,
      text: 'Check out my resume',
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Resume link copied to clipboard!');
    }
  };

  const updateResumeData = (field: string, value: any) => {
    setCurrentResumeData((prev) => ({
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
    { key: 'extras', label: 'Languages & Certifications' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-white mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading preview...</p>
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
              asChild
              className="flex items-center space-x-2"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 text-foreground" />
                <span>Back to Dashboard</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Resume Preview</h1>
              <p className="text-muted-foreground">
                {template
                  ? `Using ${template.title} template`
                  : 'Resume Preview'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-2"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Data'}</span>
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Edit Form or Info */}
          <div className="space-y-6">
            {isEditing ? (
              <>
                {/* Section Navigation */}
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Resume Sections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
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
                          className="justify-start"
                        >
                          {section.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Edit Form */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
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
              <Card>
                <CardHeader>
                  <CardTitle>Resume Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Template
                    </h4>
                    <p>{template?.title || 'Unknown Template'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Last Updated
                    </h4>
                    <p>{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Sections Completed
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Personal Info</span>
                        <span className="text-green-600">✓</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Experience</span>
                        <span className="text-green-600">✓</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Education</span>
                        <span className="text-green-600">✓</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Skills</span>
                        <span className="text-green-600">✓</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Side - Resume Preview */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="border border-border rounded-xl overflow-hidden bg-white dark:bg-gray-900">
              <div className="px-6 pt-6 border-b border-border bg-background">
                <h3 className="text-lg font-semibold mb-4">Resume Preview</h3>
              </div>
              <div className="overflow-hidden">
                <ResumePreview data={currentResumeData} template={template} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
