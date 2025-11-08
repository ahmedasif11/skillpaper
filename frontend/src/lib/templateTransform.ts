// Utility function to transform backend template to frontend format
export function transformBackendTemplate(backendTemplate: any) {
  return {
    id: backendTemplate._id,
    title: backendTemplate.name,
    description:
      backendTemplate.description ||
      'Professional template designed for backend developers and tech professionals',
    category: backendTemplate.category || 'Professional',
    thumbnail: backendTemplate.preview || '/templates/default-template.svg',
    isPro: false,
    html: backendTemplate.html, // Include HTML for preview
    isActive: backendTemplate.isActive !== false,
  };
}

// Transform array of backend templates
export function transformBackendTemplates(backendTemplates: any[]) {
  return backendTemplates.map(transformBackendTemplate);
}
