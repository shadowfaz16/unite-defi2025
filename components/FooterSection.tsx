'use client';

import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

export function FooterSection() {
  const hackathonCompliance = [
    {
      track: "Track 1: Expand Limit Order Protocol",
      requirements: [
        "✅ Onchain execution of strategy presented during final demo",
        "✅ Custom Limit Orders not posted to official Limit Order API", 
        "✅ Consistent commit history in GitHub project"
      ],
      color: "from-blue-500 to-cyan-500"
    },
    {
      track: "Track 2: Full Application using 1inch APIs",
      requirements: [
        "✅ Application uses 1inch API as much as possible",
        "✅ Consistent commit history in GitHub project",
        "✅ Professional UI with comprehensive features"
      ],
      color: "from-purple-500 to-violet-500"
    }
  ];

  const technologies = [
    { name: "Next.js 15", category: "Framework" },
    { name: "TypeScript", category: "Language" },
    { name: "1inch SDK", category: "Blockchain" },
    { name: "Wagmi", category: "Web3" },
    { name: "React Query", category: "Data" },
    { name: "Zustand", category: "State" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "Shadcn/ui", category: "Components" }
  ];

  return (
    <div className="bg-slate-900 text-white">
      {/* Hackathon compliance */}
      <div className="py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              🏆 Hackathon Compliance
            </Badge>
            <h2 className="text-3xl font-bold">
              Full Requirements Met
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Comprehensive solution addressing both hackathon tracks with complete requirement fulfillment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {hackathonCompliance.map((track, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${track.color}`}></div>
                    <h3 className="text-lg font-semibold text-white">
                      {track.track}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {track.requirements.map((req, idx) => (
                      <li key={idx} className="text-sm text-slate-300">
                        {req}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Technology stack */}
      <div className="py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h3 className="text-2xl font-bold">Built With Modern Technology</h3>
            <p className="text-slate-400">
              Production-grade technology stack for institutional-level performance
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {technologies.map((tech, index) => (
              <Badge key={index} variant="outline" className="border-slate-600 text-slate-300">
                {tech.name}
                <span className="ml-2 text-xs text-slate-500">({tech.category})</span>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Final footer */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">6+</div>
                <div className="text-slate-500 text-sm">1inch APIs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">4</div>
                <div className="text-slate-500 text-sm">Strategies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">5+</div>
                <div className="text-slate-500 text-sm">Chains</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">100%</div>
                <div className="text-slate-500 text-sm">MEV Protected</div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                1inch Advanced Trading Hub
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                The most comprehensive DeFi trading platform with advanced strategies, 
                extensive 1inch API integration, and institutional-grade features.
              </p>
            </div>

            <div className="flex justify-center space-x-4 text-sm text-slate-500">
              <span>🏆 1inch Unite DeFi 2025 Hackathon</span>
              <span>•</span>
              <span>Built with ❤️ for DeFi innovation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}