// src/data/sampleTemplates.ts
export const sampleTemplates = [
  {
    name: 'Jacqueline Thompson Professional',
    preview: '/templates/default-template.svg',
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>{{name}} - Resume</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8" />
    <meta property="twitter:card" content="summary_large_image" />

    <style>
      /* Reset and base styles */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html {
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        line-height: 1.4;
      }

      body {
        color: #191818;
        background: #fbfaf9;
        font-weight: 400;
        -webkit-font-smoothing: antialiased;
      }

       /* Resume container - Full width */
       .resume-container {
         width: 100%;
         min-height: 100vh;
         margin: 0;
         background: #ffffff;
         position: relative;
         padding: 20px;
         padding-bottom: 60px;
         overflow: visible;
       }

       /* Page size definition for print */
       @page {
         size: A4;
         margin: 40px 0 60px 0;
       }

      /* Header section */
      .header {
        text-align: center;
        margin-bottom: 30px;
        position: relative;
      }

        .name {
          font-size: 28px;
          font-weight: 700;
          color: #000;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

      .contact-info {
        font-size: 9px;
        color: #646464;
        margin-bottom: 5px;
        line-height: 140%;
      }

      .website {
        font-size: 9px;
        color: #646464;
        line-height: 140%;
      }

      /* Section dividers */
      .section-divider {
        height: 1px;
        background-color: #000;
        margin: 20px 0;
        width: 100%;
      }

      /* Section headers */
      .section-title {
        font-size: 11px;
        font-weight: 700;
        color: #000;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 15px;
        line-height: normal;
      }

      /* Skills section */
      .skills-section {
        margin-bottom: 20px;
        padding-top: 20px;
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-before: auto;
        break-before: auto;
      }

      .skills-container {
        display: flex;
        gap: 30px;
        margin-bottom: 15px;
      }

      .skills-column {
        flex: 1;
        min-width: 0;
      }

      .skills-subtitle {
        font-size: 9px;
        font-weight: 700;
        color: #000;
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        line-height: normal;
      }

      .skills-content {
        font-size: 9px;
        color: #646464;
        line-height: 140%;
      }

      /* Summary section */
      .summary {
        font-size: 9px;
        color: #646464;
        line-height: 140%;
        margin-bottom: 20px;
      }

       /* Experience section */
       .experience-section {
         margin-bottom: 20px;
         padding-top: 20px;
         page-break-inside: auto;
         break-inside: auto;
         page-break-before: auto;
         break-before: auto;
       }

       .experience-item {
         margin-bottom: 20px;
         position: relative;
         page-break-inside: avoid;
         break-inside: avoid;
         page-break-before: auto;
         break-before: auto;
         padding-top: 0;
       }

       .experience-item:first-child {
         padding-top: 0;
       }

       .experience-item:last-child {
         margin-bottom: 30px;
       }

      .job-title {
        font-size: 9px;
        font-weight: 700;
        color: #000;
        margin-bottom: 5px;
        line-height: normal;
      }

      .job-duration {
        font-size: 9px;
        font-weight: 400;
        color: #646464;
        position: absolute;
        right: 0;
        top: 0;
        line-height: 140%;
      }

      .job-responsibilities {
        margin-left: 15px;
        margin-top: 8px;
      }

      .responsibility-item {
        font-size: 9px;
        color: #646464;
        margin-bottom: 3px;
        position: relative;
        line-height: 140%;
      }

      .responsibility-item::before {
        content: '';
        position: absolute;
        left: -12px;
        top: 6px;
        width: 3px;
        height: 3px;
        background-color: #8055a2;
        border-radius: 50%;
      }

       /* Education section */
       .education-section {
         margin-bottom: 20px;
         padding-top: 20px;
         page-break-inside: avoid;
         break-inside: avoid;
         page-break-before: auto;
         break-before: auto;
       }

       .education-item {
         margin-bottom: 15px;
         position: relative;
         page-break-inside: avoid;
         break-inside: avoid;
       }

       .education-item:last-child {
         margin-bottom: 20px;
       }

      .degree {
        font-size: 9px;
        font-weight: 700;
        color: #000;
        margin-bottom: 3px;
        line-height: normal;
      }

      .institution {
        font-size: 9px;
        color: #646464;
        margin-bottom: 8px;
        line-height: 140%;
      }

      .education-year {
        font-size: 9px;
        font-weight: 400;
        color: #646464;
        position: absolute;
        right: 0;
        top: 0;
        line-height: 140%;
      }

      .education-achievements {
        margin-left: 15px;
        margin-top: 5px;
      }

      .achievement-item {
        font-size: 9px;
        color: #646464;
        margin-bottom: 3px;
        position: relative;
        line-height: 140%;
      }

      .achievement-item::before {
        content: '';
        position: absolute;
        left: -12px;
        top: 6px;
        width: 3px;
        height: 3px;
        background-color: #8055a2;
        border-radius: 50%;
      }

      /* Certifications section */
      .certifications-section {
        margin-bottom: 20px;
        padding-top: 20px;
        page-break-inside: auto;
        break-inside: auto;
        page-break-before: auto;
        break-before: auto;
      }

      .certifications-content {
        font-size: 9px;
        color: #646464;
        line-height: 140%;
        margin-bottom: 20px;
      }

      /* Languages section */
      .languages-section {
        margin-bottom: 20px;
        padding-top: 20px;
        page-break-inside: auto;
        break-inside: auto;
        page-break-before: auto;
        break-before: auto;
      }

      .languages-content {
        font-size: 9px;
        color: #646464;
        line-height: 140%;
        margin-bottom: 20px;
      }

      /* Projects section */
      .projects-section {
        margin-bottom: 20px;
        padding-top: 20px;
        page-break-inside: auto;
        break-inside: auto;
        page-break-before: auto;
        break-before: auto;
      }

      .projects-content {
        font-size: 9px;
        color: #646464;
        line-height: 140%;
        margin-bottom: 20px;
      }

      /* Additional information section */
      .additional-info {
        margin-bottom: 40px;
        padding-top: 20px;
        page-break-inside: auto;
        break-inside: auto;
        page-break-before: auto;
        break-before: auto;
      }

      .info-content {
        margin-left: 15px;
      }

      .info-item {
        font-size: 9px;
        color: #646464;
        margin-bottom: 5px;
        position: relative;
        line-height: 140%;
      }

      .info-item::before {
        content: '';
        position: absolute;
        left: -12px;
        top: 6px;
        width: 3px;
        height: 3px;
        background-color: #8055a2;
        border-radius: 50%;
      }

      .info-label {
        font-weight: 700;
        color: #000;
      }

       /* Print styles */
       @media print {
         body {
           margin: 0;
           padding: 0;
           background: #ffffff;
           -webkit-print-color-adjust: exact;
           color-adjust: exact;
         }
         
         .resume-container {
           width: 100%;
           min-height: auto;
           margin: 0;
           padding: 20px;
           padding-top: 20px;
           padding-bottom: 60px;
           background: #ffffff;
         }
         
         .section-divider {
           background-color: #000 !important;
         }
         
         .name {
           color: #000 !important;
         }
         
         .section-title {
           color: #000 !important;
         }
         
         .skills-subtitle {
           color: #000 !important;
         }
         
         .responsibility-item::before,
         .achievement-item::before,
         .info-item::before {
          background-color: #8055a2 !important;
        }
        
         /* Page break control */
         .section-title {
           page-break-after: avoid;
           break-after: avoid;
         }
         
         .experience-section {
           page-break-inside: auto;
           break-inside: auto;
           page-break-before: auto;
           break-before: auto;
           padding-top: 20px;
         }
         
         .certifications-section,
         .languages-section,
         .projects-section,
         .education-section,
         .skills-section,
         .additional-info {
           page-break-inside: auto;
           break-inside: auto;
           page-break-before: auto;
           break-before: auto;
           padding-top: 20px;
         }
         
         .experience-item,
         .education-item {
           page-break-inside: avoid;
           break-inside: avoid;
           margin-bottom: 15px;
         }
         
         .experience-item:last-child,
         .education-item:last-child {
           margin-bottom: 0;
         }
         
         /* Force page breaks if needed */
         .force-page-break {
           page-break-before: always;
           break-before: page;
         }
       }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .resume-container {
          width: 100%;
          padding: 20px;
        }
        
        .job-duration,
        .education-year {
          position: static;
          display: block;
          margin-top: 5px;
        }
      }
    </style>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div class="resume-container">
      <!-- Header -->
      <div class="header">
        <div class="name">{{name}}</div>
        <div class="contact-info">{{location}} • {{phone}} • {{email}}</div>
        {{#if website}}<div class="website">{{website}}</div>{{/if}}
      </div>
      <div class="section-divider"></div>

      <!-- Summary -->
      {{#if summary}}
      <div class="section-title">SUMMARY</div>
      <div class="summary">{{summary}}</div>
      <div class="section-divider"></div>
      {{/if}}

      <!-- Skills -->
      {{#if skills}}
      <div class="skills-section">
        <div class="section-title">SKILLS</div>
        <div class="skills-container">
          {{#if softSkills}}
          <div class="skills-column">
            <div class="skills-subtitle">Soft Skills</div>
            <div class="skills-content">{{softSkills}}</div>
          </div>
          {{/if}}
          {{#if technicalSkills}}
          <div class="skills-column">
            <div class="skills-subtitle">Technical Skills</div>
            <div class="skills-content">{{technicalSkills}}</div>
          </div>
          {{/if}}
        </div>
        <div class="section-divider"></div>
      </div>
      {{/if}}

      <!-- Work Experience -->
      {{#if experience}}
      <div class="experience-section">
        <div class="section-title">WORK EXPERIENCE</div>
        {{#each experience}}
        <div class="experience-item">
          <div class="job-title">{{this.position}}, {{this.company}}</div>
          <div class="job-duration">{{this.duration}}</div>
          {{#if this.responsibilities}}
          <div class="job-responsibilities">
            {{#each this.responsibilities}}
            <div class="responsibility-item">{{this}}</div>
            {{/each}}
          </div>
          {{/if}}
        </div>
        {{/each}}
      </div>
      <div class="section-divider"></div>
      {{/if}}

       <!-- Education -->
       {{#if education}}
       <div class="education-section">
         <div class="section-title">EDUCATION</div>
         {{#each education}}
         <div class="education-item">
           <div class="degree">{{this.degree}}</div>
           <div class="institution">{{this.institution}}</div>
           <div class="education-year">{{this.year}}</div>
           {{#if this.achievements}}
           <div class="education-achievements">
             {{#each this.achievements}}
             <div class="achievement-item">{{this}}</div>
             {{/each}}
           </div>
           {{/if}}
         </div>
         {{/each}}
       </div>
       <div class="section-divider"></div>
       {{/if}}

      <!-- Certifications -->
      {{#if certifications}}
      <div class="certifications-section">
        <div class="section-title">CERTIFICATIONS</div>
        <div class="certifications-content">{{certifications}}</div>
        <div class="section-divider"></div>
      </div>
      {{/if}}

      <!-- Languages -->
      {{#if languagesString}}
      <div class="languages-section">
        <div class="section-title">LANGUAGES</div>
        <div class="languages-content">{{languagesString}}</div>
        <div class="section-divider"></div>
      </div>
      {{/if}}

      <!-- Projects -->
      {{#if projects}}
      <div class="projects-section">
        <div class="section-title">PROJECTS</div>
        <div class="projects-content">{{projects}}</div>
        <div class="section-divider"></div>
      </div>
      {{/if}}

      <!-- Additional Information -->
      {{#if additionalInfo}}
      <div class="additional-info">
        <div class="section-title">ADDITIONAL INFORMATION</div>
        <div class="info-content">
          {{#each additionalInfo}}
          <div class="info-item">{{this}}</div>
          {{/each}}
        </div>
      </div>
      {{/if}}
    </div>
  </body>
</html>`,
  },
  {
    name: 'ATS-Friendly Professional',
    preview: '/templates/default-template.svg',
    html: `<!DOCTYPE html>
<!--
ATS-friendly Resume Template (Single-Column Optimized)
Upgraded to match best practices from top-performing resumes:
- Clear section hierarchy with bold job/company names.
- Right-aligned dates and locations for better scan.
- Grouped skills: Technical Skills, Certifications, Languages, Tools.
- Improved spacing, line-height, and readability.
- ATS-safe HTML tags with semantic structure.
- Achievement-focused bullet point examples included.

Usage: Replace EXAMPLE content with your details. Export to PDF via browser print dialog.
-->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Resume — {{name}}</title>
  <style>
    :root{
      --text:#111;
      --muted:#555;
      --accent:#0b66c3;
      --max-width:860px;
      --base-font:16px;
    }
    *{box-sizing:border-box}
    body{
      margin:0 auto;
      padding:32px 24px;
      max-width:var(--max-width);
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
      color:var(--text);
      font-size:var(--base-font);
      line-height:1.6;
      background:#fff;
    }
    .skip-link{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden}
    .skip-link:focus{position:static;left:0;top:0;width:auto;height:auto;padding:8px;background:#000;color:#fff;z-index:999}

    header{margin-bottom:24px;text-align:center}
    h1{font-size:2rem;margin:0}
    h1 small{font-size:1rem;color:var(--muted);display:block;margin-top:4px}
    .title{font-weight:600;color:var(--muted);margin-top:6px}
    .tagline{margin-top:8px;font-size:1rem;color:var(--accent);font-weight:500}
    .contact{list-style:none;padding:0;margin:10px 0 0;display:flex;flex-wrap:wrap;gap:16px;justify-content:center}
    .contact li{font-size:0.95rem}
    .contact a{color:var(--accent);text-decoration:none}
    .contact a:focus{outline:3px solid #222;outline-offset:2px}

    section{margin-top:32px;padding-top:16px;border-top:1px solid #ddd}
    h2{font-size:1.25rem;margin:0 0 12px;font-weight:700}
    h3{font-size:1rem;margin:0;font-weight:600}
    .meta{display:flex;justify-content:space-between;font-style:italic;color:var(--muted);font-size:0.95rem;margin:4px 0 8px}

    ul{margin:8px 0 0 1.25rem;padding:0}
    li{margin-bottom:6px}
    .job{margin-bottom:20px}
    .job-company{font-weight:700}

    .skills-columns{display:grid;grid-template-columns:1fr 1fr;gap:8px}

    footer{text-align:center;font-size:0.85rem;color:var(--muted)}

    @media print{
      :root{--base-font:11pt}
      body{padding:0;margin:0}
      @page{size:auto;margin:0.75in}
      .skip-link{display:none}
      section,article{page-break-inside:avoid}
      h2{border-bottom:1px solid #000}
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <header>
    <h1>{{name}}</h1>
    <div class="title">{{title}}</div>
    <div class="tagline">{{tagline}}</div>
    <ul class="contact">
      <li><a href="mailto:{{email}}">{{email}}</a></li>
      <li><a href="tel:{{phone}}">{{phone}}</a></li>
      <li>{{location}}</li>
      {{#if website}}<li><a href="{{website}}">{{website}}</a></li>{{/if}}
      {{#if linkedin}}<li><a href="{{linkedin}}">{{linkedin}}</a></li>{{/if}}
    </ul>
  </header>

  <main id="main">
    {{#if summary}}
    <section>
      <h2>Professional Summary</h2>
      <p>{{summary}}</p>
    </section>
    {{/if}}

    {{#if achievements}}
    <section>
      <h2>Key Achievements</h2>
      <ul>
        {{#each achievements}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
    </section>
    {{/if}}

    {{#if skills}}
    <section>
      <h2>Skills</h2>
      <div class="skills-columns">
        <ul>
          {{#if technicalSkills}}
          <li><strong>Technical Skills:</strong> {{technicalSkills}}</li>
          {{/if}}
          {{#if softSkills}}
          <li><strong>Soft Skills:</strong> {{softSkills}}</li>
          {{/if}}
        </ul>
        <ul>
          {{#if languagesString}}
          <li><strong>Languages:</strong> {{languagesString}}</li>
          {{/if}}
          {{#if tools}}
          <li><strong>Tools:</strong> {{tools}}</li>
          {{/if}}
        </ul>
      </div>
    </section>
    {{/if}}

    {{#if experience}}
    <section>
      <h2>Work Experience</h2>
      {{#each experience}}
      <article class="job">
        <h3><span class="job-company">{{company}}</span> — {{position}}</h3>
        <div class="meta"><span>{{location}}</span><span>{{duration}}</span></div>
        {{#if responsibilities}}
        <ul>
          {{#each responsibilities}}
          <li>{{this}}</li>
          {{/each}}
        </ul>
        {{/if}}
      </article>
      {{/each}}
    </section>
    {{/if}}

    {{#if education}}
    <section>
      <h2>Education</h2>
      {{#each education}}
      <h3>{{degree}} — {{institution}}</h3>
      <div class="meta"><span>{{location}}</span><span>{{year}}</span></div>
      {{#if achievements}}
      <ul>
        {{#each achievements}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
      {{/if}}
      {{/each}}
    </section>
    {{/if}}

    {{#if certifications}}
    <section>
      <h2>Certifications</h2>
      <ul>
        {{#each certifications}}
        <li>{{name}} — {{issuer}} ({{date}})</li>
        {{/each}}
      </ul>
    </section>
    {{/if}}

    {{#if projects}}
    <section>
      <h2>Projects</h2>
      <ul>
        {{#each projects}}
        <li><strong>{{name}}</strong> — {{description}} {{#if url}}<a href="{{url}}">{{url}}</a>{{/if}}</li>
        {{/each}}
      </ul>
    </section>
    {{/if}}

    {{#if languages}}
    <section>
      <h2>Languages</h2>
      <ul>
        {{#each languages}}
        <li>{{language}} — {{proficiency}}</li>
        {{/each}}
      </ul>
    </section>
    {{/if}}

    {{#if additionalInfo}}
    <section>
      <h2>Additional Information</h2>
      <ul>
        {{#each additionalInfo}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
    </section>
    {{/if}}
  </main>

  <footer style="margin-top:24px">
    <p>© <span id="year">2025</span> {{name}}</p>
  </footer>
</body>
</html>`,
  },
  {
    name: 'Professional Backend Developer',
    preview: '/templates/default-template.svg',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #fff;
        }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .name { font-size: 2.8em; font-weight: 700; margin-bottom: 10px; }
        .title { font-size: 1.3em; opacity: 0.9; margin-bottom: 20px; }
        .contact-info { 
            display: flex; 
            justify-content: center; 
            flex-wrap: wrap; 
            gap: 20px; 
            font-size: 1.1em;
        }
        .contact-item { display: flex; align-items: center; gap: 8px; }
        .section { margin: 30px 0; }
        .section-title { 
            font-size: 1.5em; 
            color: #667eea; 
            border-bottom: 3px solid #667eea; 
            padding-bottom: 8px; 
            margin-bottom: 20px;
            font-weight: 600;
        }
        .experience-item, .education-item, .project-item { 
            margin-bottom: 25px; 
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .item-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 10px;
            flex-wrap: wrap;
        }
        .item-title { font-size: 1.2em; font-weight: 600; color: #333; }
        .item-company { font-size: 1.1em; color: #667eea; font-weight: 500; }
        .item-duration { 
            color: #666; 
            font-size: 0.95em; 
            font-style: italic;
            background: #e9ecef;
            padding: 4px 8px;
            border-radius: 4px;
        }
        .item-description { margin-top: 10px; line-height: 1.7; }
        .skills-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
        }
        .skill-category { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .skill-category-title { 
            font-weight: 600; 
            color: #667eea; 
            margin-bottom: 8px;
            font-size: 1.1em;
        }
        .skill-list { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px; 
        }
        .skill-tag { 
            background: #667eea; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 0.9em;
            font-weight: 500;
        }
        .summary { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #667eea;
            font-size: 1.1em;
            line-height: 1.7;
        }
        .projects-grid { 
            display: grid; 
            gap: 20px; 
        }
        .project-tech { 
            margin-top: 8px; 
            font-size: 0.9em; 
            color: #666; 
        }
        .project-links { 
            margin-top: 10px; 
        }
        .project-link { 
            color: #667eea; 
            text-decoration: none; 
            margin-right: 15px;
            font-weight: 500;
        }
        .project-link:hover { text-decoration: underline; }
        @media print {
            .container { max-width: none; padding: 0; }
            .header { border-radius: 0; }
            .experience-item, .education-item, .project-item, .skill-category, .summary { 
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="name">{{name}}</h1>
            <div class="title">{{title}}</div>
            <div class="contact-info">
                <div class="contact-item">📧 {{email}}</div>
                <div class="contact-item">📱 {{phone}}</div>
                {{#if location}}<div class="contact-item">📍 {{location}}</div>{{/if}}
                {{#if website}}<div class="contact-item">🌐 {{website}}</div>{{/if}}
                {{#if linkedin}}<div class="contact-item">💼 {{linkedin}}</div>{{/if}}
                {{#if github}}<div class="contact-item">💻 {{github}}</div>{{/if}}
            </div>
        </div>

        {{#if summary}}
        <div class="section">
            <h2 class="section-title">Professional Summary</h2>
            <div class="summary">{{summary}}</div>
        </div>
        {{/if}}

        {{#if experience}}
        <div class="section">
            <h2 class="section-title">Professional Experience</h2>
            {{#each experience}}
            <div class="experience-item">
                <div class="item-header">
                    <div>
                        <div class="item-title">{{position}}</div>
                        <div class="item-company">{{company}}</div>
                    </div>
                    <div class="item-duration">{{duration}}</div>
                </div>
                <div class="item-description">{{description}}</div>
                {{#if achievements}}
                <div style="margin-top: 10px;">
                    <strong>Key Achievements:</strong>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        {{#each achievements}}
                        <li>{{this}}</li>
                        {{/each}}
                    </ul>
                </div>
                {{/if}}
                {{#if technologies}}
                <div style="margin-top: 10px;">
                    <strong>Technologies:</strong> {{technologies}}
                </div>
                {{/if}}
            </div>
            {{/each}}
        </div>
        {{/if}}

        {{#if education}}
        <div class="section">
            <h2 class="section-title">Education</h2>
            {{#each education}}
            <div class="education-item">
                <div class="item-header">
                    <div>
                        <div class="item-title">{{degree}} in {{field}}</div>
                        <div class="item-company">{{institution}}</div>
                    </div>
                    <div class="item-duration">{{year}}</div>
                </div>
                {{#if gpa}}<div style="margin-top: 8px;"><strong>GPA:</strong> {{gpa}}</div>{{/if}}
                {{#if achievements}}
                <div style="margin-top: 10px;">
                    <strong>Achievements:</strong>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        {{#each achievements}}
                        <li>{{this}}</li>
                        {{/each}}
                    </ul>
                </div>
                {{/if}}
            </div>
            {{/each}}
        </div>
        {{/if}}

        {{#if skills}}
        <div class="section">
            <h2 class="section-title">Skills</h2>
            <div class="skills-grid">
                {{#each skills}}
                <div class="skill-category">
                    <div class="skill-category-title">{{category}}</div>
                    <div class="skill-list">
                        {{#each items}}
                        <span class="skill-tag">{{this}}</span>
                        {{/each}}
                    </div>
                </div>
                {{/each}}
            </div>
        </div>
        {{/if}}

        {{#if technicalSkills}}
        <div class="section">
            <h2 class="section-title">Technical Skills</h2>
            <div class="summary">{{technicalSkills}}</div>
        </div>
        {{/if}}

        {{#if softSkills}}
        <div class="section">
            <h2 class="section-title">Soft Skills</h2>
            <div class="summary">{{softSkills}}</div>
        </div>
        {{/if}}

        {{#if projects}}
        <div class="section">
            <h2 class="section-title">Projects</h2>
            <div class="projects-grid">
                {{#each projects}}
                <div class="project-item">
                    <div class="item-header">
                        <div class="item-title">{{name}}</div>
                        {{#if startDate}}<div class="item-duration">{{startDate}} - {{endDate}}</div>{{/if}}
                    </div>
                    <div class="item-description">{{description}}</div>
                    {{#if technologies}}
                    <div class="project-tech"><strong>Technologies:</strong> {{technologies}}</div>
                    {{/if}}
                    {{#if url}}
                    <div class="project-links">
                        {{#if url}}<a href="{{url}}" class="project-link">Live Demo</a>{{/if}}
                        {{#if github}}<a href="{{github}}" class="project-link">GitHub</a>{{/if}}
                    </div>
                    {{/if}}
                </div>
                {{/each}}
            </div>
        </div>
        {{/if}}

        {{#if certifications}}
        <div class="section">
            <h2 class="section-title">Certifications</h2>
            {{#each certifications}}
            <div class="experience-item">
                <div class="item-header">
                    <div>
                        <div class="item-title">{{name}}</div>
                        <div class="item-company">{{issuer}}</div>
                    </div>
                    <div class="item-duration">{{date}}</div>
                </div>
                {{#if credentialId}}<div style="margin-top: 5px;"><strong>Credential ID:</strong> {{credentialId}}</div>{{/if}}
                {{#if url}}<div style="margin-top: 5px;"><a href="{{url}}" class="project-link">View Credential</a></div>{{/if}}
            </div>
            {{/each}}
        </div>
        {{/if}}

        {{#if languages}}
        <div class="section">
            <h2 class="section-title">Languages</h2>
            <div class="skills-grid">
                {{#each languages}}
                <div class="skill-category">
                    <div class="skill-category-title">{{language}}</div>
                    <div style="color: #666; font-size: 0.9em;">{{proficiency}}</div>
                    {{#if certification}}<div style="color: #667eea; font-size: 0.85em; margin-top: 2px;">{{certification}}</div>{{/if}}
                </div>
                {{/each}}
            </div>
        </div>
        {{/if}}
    </div>
</body>
</html>`,
  },
];
