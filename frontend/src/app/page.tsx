'use client';

import { ArrowRight, Star, Users, FileText, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuthContext } from '../contexts/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated } = useAuthContext();

  const features = [
    {
      icon: FileText,
      title: 'Professional Templates',
      description: 'Choose from dozens of professionally designed templates',
    },
    {
      icon: Zap,
      title: 'Quick & Easy',
      description:
        'Build your resume in minutes with our intuitive form builder',
    },
    {
      icon: Users,
      title: 'ATS Friendly',
      description: 'All templates are optimized for Applicant Tracking Systems',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Build Your Resume Effortlessly
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create professional, ATS-friendly resumes in minutes with our
            easy-to-use builder and stunning templates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Button size="lg" asChild className="group">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/templates">Create New Resume</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild className="group">
                  <Link href="/templates">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/templates">View Templates</Link>
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">
                Resumes Created
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4.9</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center">
                <Star className="h-4 w-4 fill-current mr-1" />
                Rating
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground">Templates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Why Choose Our Resume Builder?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create a professional resume that gets you
              hired
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center p-6 hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Preview Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Professional Templates</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Choose from our collection of ATS-friendly resume templates
          </p>
          <Button size="lg" asChild className="group">
            <Link href="/templates">
              Browse All Templates
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Your Resume?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join thousands of professionals who have landed their dream jobs
            with our resume builder.
          </p>
          <Button size="lg" asChild className="group">
            <Link href="/templates">
              Start Building Now
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
