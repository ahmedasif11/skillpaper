'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, X } from 'lucide-react';
import { Project } from '../../types';

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

export function ProjectsForm({ data, onChange }: ProjectsFormProps) {
  const [projectsList, setProjectsList] = useState<Project[]>(data);
  const [newTechnology, setNewTechnology] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    setProjectsList(
      (data || []).map((project, index) => ({
        ...project,
        id: (project as any).id || `proj-${index}`,
        title: (project as any).title || project.name || '',
        technologies: Array.isArray(project.technologies)
          ? project.technologies
          : [],
      }))
    );
  }, [data]);

  const handleAddProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: '',
      description: '',
      technologies: [],
      link: '',
      startDate: '',
      endDate: '',
    };
    const updated = [...projectsList, newProject];
    setProjectsList(updated);
    onChange(updated);
  };

  const handleRemoveProject = (id: string) => {
    const updated = projectsList.filter((project) => project.id !== id);
    setProjectsList(updated);
    onChange(updated);
  };

  const handleProjectChange = (
    id: string,
    field: keyof Project,
    value: string | string[]
  ) => {
    const updated = projectsList.map((project) =>
      project.id === id ? { ...project, [field]: value } : project
    );
    setProjectsList(updated);
    onChange(updated);
  };

  const handleAddTechnology = (projectId: string) => {
    const tech = newTechnology[projectId]?.trim();
    if (!tech) return;

    const project = projectsList.find((p) => (p as any).id === projectId);
    if (project && !(project.technologies || []).includes(tech)) {
      const updatedTechnologies = [...(project.technologies || []), tech];
      handleProjectChange(projectId, 'technologies', updatedTechnologies);
    }
    setNewTechnology((prev) => ({ ...prev, [projectId]: '' }));
  };

  const handleRemoveTechnology = (projectId: string, tech: string) => {
    const project = projectsList.find((p) => p.id === projectId);
    if (project) {
      const updatedTechnologies = (project.technologies || []).filter(
        (t) => t !== tech
      );
      handleProjectChange(projectId, 'technologies', updatedTechnologies);
    }
  };

  const handleTechnologyKeyPress = (
    e: React.KeyboardEvent,
    projectId: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTechnology(projectId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        Showcase your personal projects, side projects, or significant academic
        projects that demonstrate your skills.
      </div>

      {projectsList.map((project, index) => (
        <Card key={project.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <h3 className="font-medium">Project {index + 1}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveProject(project.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project Title *</Label>
              <Input
                value={project.title}
                onChange={(e) =>
                  handleProjectChange(project.id, 'title', e.target.value)
                }
                placeholder="E-commerce Platform"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={project.description}
                onChange={(e) =>
                  handleProjectChange(project.id, 'description', e.target.value)
                }
                placeholder="Describe what the project does, your role, and key achievements..."
                className="min-h-[80px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Technologies Used</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(project.technologies || []).map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTechnology(project.id, tech)}
                  >
                    {tech}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTechnology[project.id] || ''}
                  onChange={(e) =>
                    setNewTechnology((prev) => ({
                      ...prev,
                      [project.id]: e.target.value,
                    }))
                  }
                  placeholder="Add technology (React, Node.js, etc.)"
                  onKeyPress={(e) => handleTechnologyKeyPress(e, project.id)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTechnology(project.id)}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Project Link</Label>
              <Input
                value={project.link || ''}
                onChange={(e) =>
                  handleProjectChange(project.id, 'link', e.target.value)
                }
                placeholder="https://github.com/username/project or https://project-demo.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  value={project.startDate}
                  onChange={(e) =>
                    handleProjectChange(project.id, 'startDate', e.target.value)
                  }
                  placeholder="Jan 2023"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  value={project.endDate}
                  onChange={(e) =>
                    handleProjectChange(project.id, 'endDate', e.target.value)
                  }
                  placeholder="Mar 2023"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={handleAddProject} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Project
      </Button>
    </div>
  );
}
