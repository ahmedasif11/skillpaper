import React from 'react';
import { ResumeData, Template } from '../../types';
import { transformResumeDataForTemplate } from '../../lib/dataTransform';

interface ResumePreviewProps {
  data: Partial<ResumeData>;
  template?: Template | null;
}

export function ResumePreview({ data, template }: ResumePreviewProps) {
  const {
    personalInfo,
    education,
    experience,
    skills,
    projects,
    languages,
    certifications,
  } = data;

  if (!personalInfo) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>
          Start filling out your information to see a preview of your resume.
        </p>
      </div>
    );
  }

  // If we have a template with HTML, use it for preview
  if (template?.html) {
    try {
      // Transform data for template - pass template name for template-specific transformations
      const transformedData = transformResumeDataForTemplate(
        data,
        template.title
      );

      // Create a simple preview by replacing template variables
      let previewHtml = template.html;

      // Replace basic variables
      const replacements = {
        '{{name}}': transformedData.name || 'Your Name',
        '{{email}}': transformedData.email || '',
        '{{phone}}': transformedData.phone || '',
        '{{location}}': transformedData.location || '',
        '{{website}}': transformedData.website || '',
        '{{linkedin}}': transformedData.linkedin || '',
        '{{summary}}': transformedData.summary || '',
        '{{title}}': transformedData.title || '',
        '{{technicalSkills}}': transformedData.technicalSkills || '',
        '{{certifications}}': transformedData.certifications || '',
        '{{languagesString}}': transformedData.languagesString || '',
        '{{tools}}': transformedData.tools || '',
        '{{skills}}': transformedData.skills || '',
      };

      // Apply replacements
      Object.entries(replacements).forEach(([key, value]) => {
        previewHtml = previewHtml.replace(new RegExp(key, 'g'), value);
      });

      // Handle conditional sections - need to check for all types
      previewHtml = previewHtml.replace(
        /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
        (match, condition, content) => {
          const value = transformedData[condition];
          // Check if value exists and is truthy
          if (value !== undefined && value !== null && value !== '') {
            // If it's an array, check if it has items
            if (Array.isArray(value)) {
              if (value.length > 0) {
                return content;
              }
            } else {
              // For non-array values, check if they're truthy
              return content;
            }
          }
          return '';
        }
      );

      // Handle experience loop
      if (transformedData.experience && transformedData.experience.length > 0) {
        const experienceHtml = transformedData.experience
          .map((exp: any) => {
            let expHtml = `
            <div class="experience-item">
              <div class="job-title">${exp.position}, ${exp.company}</div>
              <div class="job-duration">${exp.duration}</div>
              ${
                exp.responsibilities
                  ? `
                <div class="job-responsibilities">
                  ${exp.responsibilities
                    .map(
                      (resp: string) =>
                        `<div class="responsibility-item">${resp}</div>`
                    )
                    .join('')}
                </div>
              `
                  : ''
              }
            </div>
          `;
            return expHtml;
          })
          .join('');

        previewHtml = previewHtml.replace(
          /\{\{#each\s+experience\}\}([\s\S]*?)\{\{\/each\}\}/g,
          experienceHtml
        );
      } else {
        // Remove experience section if no data
        previewHtml = previewHtml.replace(
          /\{\{#if experience\}\}([\s\S]*?)\{\{\/if\}\}/g,
          ''
        );
      }

      // Handle education loop
      if (transformedData.education && transformedData.education.length > 0) {
        const educationHtml = transformedData.education
          .map((edu: any) => {
            let eduHtml = `
            <div class="education-item">
              <div class="degree">${edu.degree}</div>
              <div class="institution">${edu.institution}</div>
              <div class="education-year">${edu.year}</div>
              ${
                edu.achievements
                  ? `
                <div class="education-achievements">
                  ${edu.achievements
                    .map(
                      (ach: string) =>
                        `<div class="achievement-item">${ach}</div>`
                    )
                    .join('')}
                </div>
              `
                  : ''
              }
            </div>
          `;
            return eduHtml;
          })
          .join('');

        previewHtml = previewHtml.replace(
          /\{\{#each\s+education\}\}([\s\S]*?)\{\{\/each\}\}/g,
          educationHtml
        );
      } else {
        // Remove education section if no data
        previewHtml = previewHtml.replace(
          /\{\{#if education\}\}([\s\S]*?)\{\{\/if\}\}/g,
          ''
        );
      }

      // Handle additional info loop
      if (
        transformedData.additionalInfo &&
        transformedData.additionalInfo.length > 0
      ) {
        const additionalInfoHtml = transformedData.additionalInfo
          .map((info: string) => `<div class="info-item">${info}</div>`)
          .join('');

        previewHtml = previewHtml.replace(
          /\{\{#each\s+additionalInfo\}\}([\s\S]*?)\{\{\/each\}\}/g,
          additionalInfoHtml
        );
      } else {
        // Remove additionalInfo section if no data
        previewHtml = previewHtml.replace(
          /\{\{#if additionalInfo\}\}([\s\S]*?)\{\{\/if\}\}/g,
          ''
        );
      }

      // Clean up any remaining unprocessed Handlebars tags
      previewHtml = previewHtml.replace(/\{\{[#\/]?\w+\}\}/g, '');

      // Inject styles to override template backgrounds and ensure consistent sizing
      const styleOverride = `
        <style>
          /* Force white background and remove all extra spacing */
          body, html { 
            background: #ffffff !important; 
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          /* Normalize font size across all templates - prevent Jacqueline template from having larger text */
          html {
            font-size: 10px !important;
          }
          
          /* Ensure body takes full width */
          body {
            box-sizing: border-box !important;
            font-size: 1rem !important;
          }
          
          /* Override template-specific containers to remove padding */
          .resume-container, .container { 
            background: #ffffff !important; 
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px 40px !important;
            min-height: auto !important;
            box-sizing: border-box !important;
          }
        </style>
      `;

      // Insert style override before closing head tag, or at beginning if no head
      if (previewHtml.includes('</head>')) {
        previewHtml = previewHtml.replace('</head>', `${styleOverride}</head>`);
      } else {
        previewHtml = styleOverride + previewHtml;
      }

      return (
        <iframe
          srcDoc={previewHtml}
          className="resume-preview-iframe"
          style={{
            width: '100%',
            height: '1122px',
            border: 'none',
            background: '#ffffff',
            display: 'block',
          }}
          title="Resume Preview"
        />
      );
    } catch (error) {
      console.error('Error rendering template preview:', error);
      // Fall back to simple preview
    }
  }

  // Fallback to simple preview if no template HTML
  return (
    <div className="bg-white dark:bg-gray-800 text-black dark:text-white p-6 min-h-[800px] shadow-sm font-sans text-sm leading-relaxed">
      {/* Header */}
      <div className="mb-6 pb-4 border-b-2 border-gray-900">
        <h1 className="text-3xl font-bold mb-2">
          {personalInfo.name || personalInfo.fullName || 'Your Name'}
        </h1>
        <div className="flex flex-wrap gap-4 text-gray-600">
          {personalInfo.email && (
            <div className="flex items-center gap-1">
              <span>{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div className="flex items-center gap-1">
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.location && (
            <div className="flex items-center gap-1">
              <span>{personalInfo.location}</span>
            </div>
          )}
          {personalInfo.website && (
            <div className="flex items-center gap-1">
              <span>{personalInfo.website}</span>
            </div>
          )}
          {personalInfo.linkedin && (
            <div className="flex items-center gap-1">
              <span>{personalInfo.linkedin}</span>
            </div>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      {personalInfo.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
            PROFESSIONAL SUMMARY
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {personalInfo.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 text-gray-900">
            PROFESSIONAL EXPERIENCE
          </h2>
          <div className="space-y-4">
            {experience.map((exp, index) => (
              <div key={exp.id || index}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {exp.position}
                  </h3>
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <span>
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                </div>
                <div className="mb-2">
                  <span className="font-medium text-gray-800">
                    {exp.company}
                  </span>
                  <span className="text-gray-600 ml-2">• {exp.location}</span>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 text-gray-900">EDUCATION</h2>
          <div className="space-y-3">
            {education.map((edu, index) => (
              <div key={edu.id || index}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {edu.degree} in {edu.field}
                  </h3>
                  <span className="text-gray-600 text-xs">
                    {edu.startDate} - {edu.endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800">{edu.institution}</span>
                  {edu.gpa && (
                    <span className="text-gray-600">GPA: {edu.gpa}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 text-gray-900">
            TECHNICAL SKILLS
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {skills.map((skill, index) => (
              <div key={skill.id || index} className="flex justify-between">
                <span className="text-gray-800">{skill.name || skill}</span>
                <span className="text-gray-600 text-xs">
                  {skill.level || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 text-gray-900">PROJECTS</h2>
          <div className="space-y-3">
            {projects.map((project, index) => (
              <div key={project.id || index}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {project.title || project.name}
                  </h3>
                  {(project.startDate || project.endDate) && (
                    <span className="text-gray-600 text-xs">
                      {project.startDate}{' '}
                      {project.endDate && `- ${project.endDate}`}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-1">{project.description}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="mb-1">
                    <span className="text-gray-600 text-xs">
                      Technologies: {project.technologies.join(', ')}
                    </span>
                  </div>
                )}
                {project.link && (
                  <div className="text-gray-600 text-xs">
                    Link: {project.link}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages and Certifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {languages && languages.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
              LANGUAGES
            </h2>
            <ul className="space-y-1">
              {languages.map((language, index) => (
                <li key={index} className="text-gray-700">
                  {typeof language === 'string'
                    ? language
                    : `${language.language} (${language.proficiency})`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {certifications && certifications.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
              CERTIFICATIONS
            </h2>
            <ul className="space-y-1">
              {certifications.map((cert, index) => (
                <li key={index} className="text-gray-700">
                  {typeof cert === 'string' ? cert : cert.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
