import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Link } from "wouter";
import { useAuth } from "../lib/auth";
import { 
  Leaf, 
  TrendingUp, 
  Trophy, 
  Users, 
  Globe,
  Recycle,
  Train,
  Lightbulb,
  Droplet,
  Rocket,
  Info
} from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { GrassBackground } from "@/components/grass-background";
import { CursorTrail } from '@/components/cursor-trail';
import { useOnScreen } from '@/hooks/use-on-screen';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import ErrorBoundary from '@/components/error-boundary';
import { HoverOrb } from "@/components/hover-orb";
import TextPressure from '@/components/text-pressure';

// Interactive Globe mesh
function GlobeMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState<[number, number] | null>(null);
  const [rotation, setRotation] = useState<[number, number]>([0, 0]);

  // Memoize texture loader to prevent reloading on every render
  const earthTexture = useMemo(() => {
    return new THREE.TextureLoader().load("https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg");
  }, []);

  // Auto-rotate when not dragging
  useFrame(() => {
    if (meshRef.current && !isDragging) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  // Mouse/touch drag handlers
  const handlePointerDown = (e: any) => {
    setIsDragging(true);
    setLastPos([e.clientX ?? e.touches?.[0]?.clientX, e.clientY ?? e.touches?.[0]?.clientY]);
    setRotation([
      meshRef.current?.rotation.y || 0,
      meshRef.current?.rotation.x || 0,
    ]);
  };
  const handlePointerUp = () => {
    setIsDragging(false);
    setLastPos(null);
  };
  const handlePointerMove = (e: any) => {
    if (isDragging && meshRef.current && lastPos) {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
      const dx = (clientX - lastPos[0]) * 0.01;
      const dy = (clientY - lastPos[1]) * 0.01;
      meshRef.current.rotation.y = rotation[0] + dx;
      meshRef.current.rotation.x = rotation[1] + dy;
    }
  };

  return (
    <mesh
      ref={meshRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        roughness={1}
        metalness={0}
        map={earthTexture}
      />
    </mesh>
  );
}

// 3D Globe component (renders Canvas)
function RotatingGlobe() {
  return (
    <div className="floating-globe">
      <Canvas
        style={{
          width: 180,
          height: 180,
          display: "block",
          cursor: "grab",
          background: "transparent",
        }}
        camera={{ position: [0, 0, 2.5], fov: 50 }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 2, 2]} intensity={1} />
        <pointLight position={[-2, -2, 2]} intensity={0.5} color="#10b981" />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <Stars radius={5} depth={10} count={50} factor={0.2} />
        <GlobeMesh />
      </Canvas>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const featuresRef = useRef<HTMLDivElement>(null);
  const isFeaturesVisible = useOnScreen(featuresRef);
  const isWebGLSupported = useWebGLSupport();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="relative">
      <CursorTrail />
      {/* Grass Background with Parallax */}
      <GrassBackground />

      {/* Hero Section */}
      <section className="relative flex justify-center pb-16 z-1">
        <HoverOrb />
        <div className="absolute inset-0 opacity-5 eco-bg-pattern"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10 pt-16">
          <TextPressure text="ECOTRACK+" />
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-row items-center justify-center gap-6 mt-8">
              <div className="flex flex-col justify-center title-container">
                <span className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-eco-primary to-eco-secondary leading-tight title-text">
                  Track Your Habits
                </span>
                <span className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-eco-primary to-eco-secondary leading-tight title-text">
                  Save the Planet
                </span>
              </div>
              <div className="flex items-center h-full">
                {isWebGLSupported ? <RotatingGlobe /> : <div>Could not load globe.</div>}
              </div>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto text-hover-glow">
              Join thousands of eco-warriors making a difference. Track your sustainable habits, earn rewards, and compete with friends while protecting our planet.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href={user ? "/dashboard" : "/register"}>
                <Button className="bg-eco-primary text-white px-8 py-4 rounded-full text-lg font-semibold button-glow transform hover:-translate-y-1 transition-all duration-200 min-w-48 fill-on-hover" style={{ ['--hover-fill-color']: 'black' } as any}>
                  <Rocket className="mr-2" />
                  Get Started
                </Button>
              </Link>
              <Button 
                onClick={scrollToFeatures}
                className="bg-black text-white px-8 py-4 rounded-full text-lg font-semibold button-glow transition-all duration-200 min-w-48 fill-on-hover"
                style={{ ['--hover-fill-color']: 'var(--eco-primary)' } as any}
              >
                <Info className="mr-2" />
                Learn More
              </Button>
            </div>
          </div>
          
          {/* Floating eco icons with enhanced animation */}
          <div className="absolute top-20 left-20 hidden lg:block" style={{animationDelay: '0s'}}>
            <div className="w-12 h-12 bg-eco-secondary rounded-full flex items-center justify-center shadow-lg pulse-glow">
              <Recycle className="text-white" />
            </div>
          </div>
          <div className="absolute top-40 right-20 hidden lg:block" style={{animationDelay: '1s'}}>
            <div className="w-12 h-12 bg-eco-primary rounded-full flex items-center justify-center shadow-lg pulse-glow">
              <Train className="text-white" />
            </div>
          </div>
          <div className="absolute bottom-40 left-32 hidden lg:block" style={{animationDelay: '2s'}}>
            <div className="w-12 h-12 bg-eco-sky rounded-full flex items-center justify-center shadow-lg pulse-glow">
              <Lightbulb className="text-white" />
            </div>
          </div>
          <div className="absolute bottom-20 right-32 hidden lg:block" style={{animationDelay: '3s'}}>
            <div className="w-12 h-12 bg-eco-earth rounded-full flex items-center justify-center shadow-lg pulse-glow">
              <Droplet className="text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        ref={featuresRef}
        className={`py-6 bg-background/95 dark:bg-background/95 relative z-10 backdrop-blur-sm mt-16 ${isFeaturesVisible ? 'float-in-on-scroll' : 'opacity-0'}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Left Column: Text Content */}
            <div className="md:w-1/3 text-left">
              <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-eco-primary to-eco-secondary mb-6 text-3d text-hover-glow">Why Choose EcoTrack+?</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-hover-glow">Discover how our platform makes sustainable<br />living fun, rewarding, and impactful.</p>
            </div>

            {/* Right Column: Carousel */}
            <div className="md:w-2/3">
              <Carousel opts={{ loop: true, dragFree: true, axis: 'x' }} className="w-full">
                <CarouselContent className="-ml-2">
                  {/* Feature Card 1 */}
                  <CarouselItem className="pl-2 basis-1/2">
                    <Card className="eco-gradient-primary shadow-lg card-enhanced border-none group h-80 w-80 overflow-hidden">
                      <CardContent className="p-8 text-center h-full relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 group-hover:-translate-y-8">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white/20 transition-transform duration-300 group-hover:rotate-360">
                            <TrendingUp className="text-white text-2xl" />
                          </div>
                          <h3 className="text-xl font-bold text-white">Track Progress</h3>
                        </div>
                        <div className="absolute bottom-8 left-0 right-0 px-8">
                          <p className="text-white/80 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">Monitor your daily eco-friendly activities and see your positive impact grow over time.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                  
                  {/* Feature Card 2 */}
                  <CarouselItem className="pl-2 basis-1/2">
                    <Card className="bg-gradient-to-br from-eco-secondary to-eco-primary shadow-lg card-enhanced border-none group h-80 w-80 overflow-hidden">
                      <CardContent className="p-8 text-center h-full relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 group-hover:-translate-y-8">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white/20 transition-transform duration-300 group-hover:rotate-360">
                            <Trophy className="text-white text-2xl" />
                          </div>
                          <h3 className="text-xl font-bold text-white">Earn Rewards</h3>
                        </div>
                        <div className="absolute bottom-8 left-0 right-0 px-8">
                          <p className="text-white/80 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">Collect eco-points and unlock amazing rewards, badges, and certificates for your efforts.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                  
                  {/* Feature Card 3 */}
                  <CarouselItem className="pl-2 basis-1/2">
                    <Card className="eco-gradient-sky shadow-lg card-enhanced border-none group h-80 w-80 overflow-hidden">
                      <CardContent className="p-8 text-center h-full relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 group-hover:-translate-y-8">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white/20 transition-transform duration-300 group-hover:rotate-360">
                            <Users className="text-white text-2xl" />
                          </div>
                          <h3 className="text-xl font-bold text-white">Join Community</h3>
                        </div>
                        <div className="absolute bottom-8 left-0 right-0 px-8">
                          <p className="text-white/80 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">Connect with like-minded eco-warriors and compete on the global leaderboard.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                  
                  {/* Feature Card 4 */}
                  <CarouselItem className="pl-2 basis-1/2">
                    <Card className="bg-gradient-to-br from-eco-earth to-eco-primary shadow-lg card-enhanced border-none group h-80 w-80 overflow-hidden">
                      <CardContent className="p-8 text-center h-full relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 group-hover:-translate-y-8">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white/20 transition-transform duration-300 group-hover:rotate-360">
                            <Globe className="text-white text-2xl" />
                          </div>
                          <h3 className="text-xl font-bold text-white">Save Planet</h3>
                        </div>
                        <div className="absolute bottom-8 left-0 right-0 px-8">
                          <p className="text-white/80 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">Make a real difference with every action you track and inspire others to join the movement.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-eco-forest text-white py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 eco-gradient-primary rounded-full flex items-center justify-center">
                  <Leaf className="text-white" />
                </div>
                <span className="text-xl font-bold">EcoTrack+</span>
              </div>
              <p className="text-eco-mint mb-4">Making sustainable living fun, rewarding, and impactful for everyone.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-eco-mint">
                <li><Link href="/dashboard"><a className="hover:text-white transition-colors duration-200">Habit Tracking</a></Link></li>
                <li><Link href="/rewards"><a className="hover:text-white transition-colors duration-200">Eco Rewards</a></Link></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-eco-mint">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Stay Updated</h4>
              <p className="text-eco-mint mb-4">Get eco-tips and updates delivered to your inbox.</p>
            </div>
          </div>
          <div className="border-t border-eco-primary/30 mt-8 pt-8 text-center text-eco-mint">
            <p>&copy; Made with 💚 for our planet.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
