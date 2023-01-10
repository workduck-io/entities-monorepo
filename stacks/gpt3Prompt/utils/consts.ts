export const Categories = [
  {
    id: 1,
    name: 'LinkedIn',
  },
  {
    id: 2,
    name: 'Gmail',
  },
  {
    id: 3,
    name: 'Content',
  },
  {
    id: 4,
    name: 'Finance',
  },
  {
    id: 5,
    name: 'Food',
  },
  {
    id: 6,
    name: 'Health',
  },
  {
    id: 7,
    name: 'Lifestyle',
  },
  {
    id: 8,
    name: 'News',
  },
  {
    id: 9,
    name: 'Productivity',
  },
  {
    id: 10,
    name: 'Shopping',
  },
];

export const PromptProviders = [
  {
    actionGroupId: 'OPENAI',
    authConfig: {
      authURL: 'https://beta.openai.com/account/api-keys',
    },
    icon: 'https://cdn.workduck.io/assets/openai.svg',
    name: 'OpenAI',
    description:
      'Some of the things you can do with OpenAI technologies include - Build intelligent chatbots or virtual assistants that can understand and respond to natural language input. Develop intelligent systems that can process and analyze large amounts of data to make predictions or recommendations. Use machine learning algorithms to build intelligent systems that can perform tasks like image or speech recognition. Explore and research the capabilities and limitations of artificial intelligence and machine learning. Overall, there are many potential applications for OpenAI technologies, ranging from commercial to research and educational.',
  },
];

export const defaultGPT3Props = {
  model: 'text-davinci-003',
  max_tokens: 150,
  temperature: 0.7,
  iterations: 3,
  top_p: 1,
};
