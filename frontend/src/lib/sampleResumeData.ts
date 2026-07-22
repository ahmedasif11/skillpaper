/** Demo resume used to render template gallery / detail thumbnails. */
export const SAMPLE_RESUME_DATA = {
  personalInfo: {
    name: 'Alex Morgan',
    email: 'alex.morgan@email.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    title: 'Senior Software Engineer',
    tagline: 'Building scalable systems | Backend & Cloud',
    website: 'alexmorgan.dev',
    linkedin: 'linkedin.com/in/alexmorgan',
    github: 'github.com/alexmorgan',
    summary:
      'Results-driven software engineer with 8+ years of experience designing and shipping scalable backend systems, APIs, and cloud infrastructure for high-growth products.',
  },
  experience: [
    {
      company: 'Northstar Labs',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: 'Jan 2021',
      endDate: 'Present',
      current: true,
      duration: 'Jan 2021 - Present',
      description:
        'Own core platform services, payment APIs, and reliability for a high-growth B2B product.',
      technologies: 'Node.js, TypeScript, AWS, Kafka, PostgreSQL',
      responsibilities: [
        'Led migration of monolith services to event-driven microservices, cutting p95 latency by 40%.',
        'Designed and owned payment and billing APIs serving 2M+ monthly transactions.',
        'Mentored a team of 4 engineers and improved on-call incident response time by 30%.',
      ],
      achievements: [
        'Led migration of monolith services to event-driven microservices, cutting p95 latency by 40%.',
        'Designed and owned payment and billing APIs serving 2M+ monthly transactions.',
      ],
    },
    {
      company: 'Brightwave Inc.',
      position: 'Software Engineer',
      location: 'Remote',
      startDate: 'Jun 2018',
      endDate: 'Dec 2020',
      duration: 'Jun 2018 - Dec 2020',
      description:
        'Built APIs and developer tooling for the core product platform serving millions of users.',
      technologies: 'Node.js, GraphQL, Docker, CI/CD',
      responsibilities: [
        'Built REST and GraphQL APIs in Node.js and TypeScript for the core product platform.',
        'Improved CI/CD pipelines and reduced average deploy time from 45 to 12 minutes.',
      ],
      achievements: [
        'Built REST and GraphQL APIs in Node.js and TypeScript for the core product platform.',
      ],
    },
  ],
  education: [
    {
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      location: 'Berkeley, CA',
      year: '2014 - 2018',
      gpa: '3.8',
      achievements: ['Dean’s List', 'Senior Capstone: Distributed Job Scheduler'],
    },
  ],
  hardSkillsList: [
    { id: '1', name: 'Node.js', level: 'Expert' as const, category: 'hard' as const },
    { id: '2', name: 'TypeScript', level: 'Expert' as const, category: 'hard' as const },
    { id: '3', name: 'PostgreSQL', level: 'Advanced' as const, category: 'hard' as const },
    { id: '4', name: 'AWS', level: 'Advanced' as const, category: 'hard' as const },
  ],
  softSkillsList: [
    { id: '5', name: 'Leadership', level: 'Advanced' as const, category: 'soft' as const },
    { id: '6', name: 'Mentoring', level: 'Advanced' as const, category: 'soft' as const },
  ],
  toolsList: [
    { id: '7', name: 'Docker', level: 'Advanced' as const, category: 'tool' as const },
    { id: '8', name: 'Kubernetes', level: 'Intermediate' as const, category: 'tool' as const },
  ],
  skills: [
    {
      category: 'Languages & Frameworks',
      items: ['TypeScript', 'Node.js', 'Python', 'Express'],
    },
    {
      category: 'Infrastructure',
      items: ['AWS', 'Docker', 'PostgreSQL', 'Redis'],
    },
  ],
  projects: [
    {
      name: 'Pulse Analytics',
      description:
        'Real-time analytics pipeline processing 50k events/sec with Kafka and ClickHouse.',
      technologies: ['Kafka', 'ClickHouse', 'TypeScript'],
      url: 'https://pulsean.example.com',
      github: 'https://github.com/alexmorgan/pulse',
      startDate: '2022',
      endDate: '2023',
    },
  ],
  certifications: [
    {
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2023',
    },
  ],
  languages: [
    { language: 'English', proficiency: 'Native' as const },
    { language: 'Spanish', proficiency: 'Intermediate' as const },
  ],
  achievements: [
    'Increased platform engagement by 200% year-over-year through feature optimization',
    'Open-sourced an internal job-queue library adopted by 3 product teams',
  ],
  additionalInfo: ['Open to relocation', 'Available for remote collaboration'],
};
