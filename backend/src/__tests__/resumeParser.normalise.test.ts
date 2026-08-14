import {
  computeConfidenceScore,
  validateAndNormalise,
} from '../services/resumeParser.normalise';

describe('resumeParser.normalise', () => {
  it('accepts a complete parsed resume and scores high confidence', () => {
    const data = validateAndNormalise({
      name: 'Ahmed Asif',
      email: 'ahmed@example.com',
      phone: '+92 300 1234567',
      summary: 'Full-stack developer',
      experience: [{ company: 'Tech', title: 'Engineer' }],
      education: [{ institution: 'Uni', degree: 'BSc' }],
      skills: ['TypeScript'],
    });
    expect(data.name).toBe('Ahmed Asif');
    expect(computeConfidenceScore(data)).toBe(100);
  });

  it('falls back to Unknown name when required fields are missing', () => {
    const data = validateAndNormalise({ email: 'not-an-email' });
    expect(data.name).toBe('Unknown');
    expect(computeConfidenceScore(data)).toBe(0);
  });

  it('drops invalid optional URLs instead of failing the parse', () => {
    const data = validateAndNormalise({
      name: 'Ada',
      projects: [
        { name: 'Site', description: 'A site', url: 'not-a-url' },
      ],
    });
    expect(data.projects?.[0].url).toBeUndefined();
  });
});
