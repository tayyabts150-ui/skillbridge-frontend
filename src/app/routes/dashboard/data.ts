export interface Career {
  name: string;
  description: string;
  match: number;
  tags: string[];
}

export const RECOMMENDED_CAREERS: Career[] = [
  {
    name: 'Full Stack Developer',
    description: 'Design and build complete web applications using modern frameworks.',
    match: 95,
    tags: ['Technology', 'Web'],
  },
  {
    name: 'UI/UX Designer',
    description: 'Create beautiful and intuitive user experiences for digital products.',
    match: 88,
    tags: ['Design', 'Creative'],
  },
  {
    name: 'Data Scientist',
    description: 'Analyze complex data sets to discover patterns and insights.',
    match: 82,
    tags: ['Analytics', 'Science'],
  },
  {
    name: 'Cybersecurity Analyst',
    description: 'Protect organizations from digital threats and security breaches.',
    match: 75,
    tags: ['Security', 'Tech'],
  },
];

export const PERSONALITY_TRAITS = [
  { name: 'Openness', percentage: 85, color: '#0f969c' },
  { name: 'Conscientiousness', percentage: 70, color: '#6da5c0' },
  { name: 'Extraversion', percentage: 60, color: '#294d61' },
  { name: 'Agreeableness', percentage: 90, color: '#0c7075' },
  { name: 'Neuroticism', percentage: 40, color: '#ef4444' },
];

export const USER_DATA = {
  name: 'John Doe',
  greeting: 'Welcome back',
  subtitle: 'Here are your recommended career paths based on your profile.',
};
