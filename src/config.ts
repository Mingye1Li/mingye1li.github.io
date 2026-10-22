/** Edit this file to personalise the site. No service or secret is needed. */
export const site = {
  name: 'mlii01',
  title: 'mlii01 | Developer & maker',
  description: 'Notes on code, systems, and the occasional experiment.',
  author: 'mlii01',
  role: 'Developer & maker',
  github: 'https://github.com/Mingye1Li',
  // Add your real details here; empty fields are not shown.
  email: '',
  linkedin: '',
  location: '',
  bio: [
    'I build things for the web and write about what I learn along the way. This is my corner of the internet: part notebook, part workshop, and a place for small experiments.',
    'I care about readable code, thoughtful interfaces, and understanding how things work. Explore the blog, browse the projects, or open the terminal and have a look around.',
  ],
  skills: {
    Languages: ['TypeScript', 'JavaScript', 'Python', 'SQL'],
    Frontend: ['Astro', 'Svelte', 'React', 'Vite', 'Tailwind CSS'],
    Backend: ['Node.js', 'REST', 'GraphQL'],
    Infra: ['Git', 'Docker', 'GitHub Actions', 'Redis', 'PostgreSQL'],
    Practices: ['Accessibility', 'Testing', 'Code Review', 'Performance'],
  },
  // Optional: { period: '2024 – now', role: '...', company: '...', description: '...' }
  experience: [] as { period: string; role: string; company: string; description: string }[],
  resume: { introduction: 'Coming soon.' },
};

export const navigation = [
  { name: '~/', key:'home', path: '/' },
  { name: '/about', key:'about', path: '/about/' },
  { name: '/blog', key:'blog', path: '/blog/' },
  { name: '/portfolio', key:'portfolio', path: '/portfolio/' },
  { name: '/resume', key:'resume', path: '/resume/' },
];
