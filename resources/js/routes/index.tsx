import { createFileRoute, Link } from "@tanstack/react-router";
import { healthApi, authApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Code2, 
  Database, 
  Globe, 
  Smartphone, 
  Zap, 
  Shield, 
  MessageCircle, 
  CheckCircle2,
  Palette,
  TestTube,
  Rocket,
  Github,
  ExternalLink,
  ArrowRight
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const healthCheck = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
  });

  const { data: userData } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authApi.getUser,
    retry: false,
  });

  const isAuthenticated = !!userData?.user;

  const techStack = {
    frontend: [
      { name: "React 19", description: "Latest React with concurrent features", icon: Code2 },
      { name: "TanStack Router", description: "Type-safe file-based routing", icon: ArrowRight },
      { name: "TanStack Query", description: "Powerful data synchronization", icon: Database },
      { name: "TypeScript", description: "Type-safe JavaScript", icon: Code2 },
    ],
    styling: [
      { name: "TailwindCSS v4", description: "Utility-first CSS framework", icon: Palette },
      { name: "Radix UI", description: "Beautiful, accessible components", icon: Globe },
    ],
    backend: [
      { name: "Laravel 12", description: "Modern PHP framework", icon: Code2 },
      { name: "Inertia.js", description: "SPA without APIs", icon: Zap },
      { name: "Laravel Reverb", description: "Real-time WebSocket server", icon: MessageCircle },
      { name: "SQLite", description: "Lightweight database", icon: Database },
    ],
    features: [
      { name: "PWA Support", description: "Progressive Web App capabilities", icon: Smartphone },
      { name: "Authentication", description: "Modern auth with Laravel Sanctum", icon: Shield },
      { name: "Real-time Chat", description: "WebSocket-powered messaging", icon: MessageCircle },
      { name: "Testing Ready", description: "Pest PHP testing framework", icon: TestTube },
    ]
  };

  const keyFeatures = [
    "Type-safe end-to-end development",
    "File-based routing with full type safety",
    "Real-time chat with WebSocket support", 
    "Offline-first todos with sync",
    "Progressive Web App (PWA) support",
    "Modern authentication system",
    "Database migrations with Laravel",
    "TailwindCSS for rapid UI development",
    "Radix UI component library",
    "Dark/light theme support"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <PWAInstallPrompt />
        
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Laravel TanStack
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              A modern, full-stack TypeScript starter kit that combines the best technologies for building 
              scalable web applications with type safety, performance, and developer experience.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <a href="https://github.com/your-username/tanstack-router-laravel" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
            {isAuthenticated ? (
              <Button asChild variant="outline" size="lg">
                <Link to="/dashboard">
                  <Rocket className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="lg">
                <Link to="/auth/register">
                  <Rocket className="mr-2 h-4 w-4" />
                  Get Started
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* API Status */}
        <Card className="mb-12 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              API Status
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Real-time connection status to the backend API
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  healthCheck.data ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="font-medium">
                {healthCheck.isLoading
                  ? "Checking connection..."
                  : healthCheck.data
                    ? "✅ Connected to backend API"
                    : "❌ Backend API unavailable"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Technology Stack</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with modern tools and frameworks to ensure type safety, performance, and excellent developer experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Frontend */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-blue-500" />
                  Frontend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {techStack.frontend.map((tech) => (
                  <div key={tech.name} className="flex items-start gap-3">
                    <tech.icon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{tech.name}</h4>
                      <p className="text-sm text-muted-foreground">{tech.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Backend */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-500" />
                  Backend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {techStack.backend.map((tech) => (
                  <div key={tech.name} className="flex items-start gap-3">
                    <tech.icon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{tech.name}</h4>
                      <p className="text-sm text-muted-foreground">{tech.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Styling */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-500" />
                  Styling & UI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {techStack.styling.map((tech) => (
                  <div key={tech.name} className="flex items-start gap-3">
                    <tech.icon className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{tech.name}</h4>
                      <p className="text-sm text-muted-foreground">{tech.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Key Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {techStack.features.map((tech) => (
                  <div key={tech.name} className="flex items-start gap-3">
                    <tech.icon className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{tech.name}</h4>
                      <p className="text-sm text-muted-foreground">{tech.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Key Features List */}
        <Card className="mb-16 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              What's Included
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Everything you need to build modern web applications
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {keyFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card className="mb-16 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-500" />
              Quick Start
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Get up and running in minutes
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm space-y-2">
              <div className="text-muted-foreground"># Install dependencies</div>
              <div>composer install && npm install</div>
              <div className="text-muted-foreground"># Set up environment</div>
              <div>cp .env.example .env && php artisan key:generate</div>
              <div className="text-muted-foreground"># Start development</div>
              <div>composer dev</div>
            </div>
          </CardContent>
        </Card>

        {/* Try the Demo */}
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold">Try the Demo</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline">
              <Link to="/todos">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Todo App
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/chat">
                <MessageCircle className="mr-2 h-4 w-4" />
                Real-time Chat
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/install-pwa">
                <Smartphone className="mr-2 h-4 w-4" />
                PWA Features
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
