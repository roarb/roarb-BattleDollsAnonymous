import React from 'react';
import { X, Info, Package, PenTool, SprayCan, Paintbrush, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import progressSteps from '../assets/tutorial/progress_steps.png';

interface HobbyPhaseGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HobbyPhaseGuide({ isOpen, onClose }: HobbyPhaseGuideProps) {

  const phases = [
    {
      title: "1. Unbuilt (The Pile of Shame)",
      icon: <Package className="w-5 h-5 text-red-400" />,
      color: "border-red-500/30 bg-red-500/10",
      description: "Still in shrink wrap, resting on sprues, or sitting in a bits box. These are your raw materials waiting for inspiration."
    },
    {
      title: "2. Assembled",
      icon: <PenTool className="w-5 h-5 text-orange-400" />,
      color: "border-orange-500/30 bg-orange-500/10",
      description: "Clipped, cleaned, and glued. The model is fully built and ready to hit the painting desk."
    },
    {
      title: "3. Primed",
      icon: <SprayCan className="w-5 h-5 text-yellow-400" />,
      color: "border-yellow-500/30 bg-yellow-500/10",
      description: "Hit with the rattle can or airbrush. The base coat is down, and you are officially committed to getting paint on plastic."
    },
    {
      title: "4. Basic Paint",
      icon: <Paintbrush className="w-5 h-5 text-blue-400" />,
      color: "border-blue-500/30 bg-blue-500/10",
      description: "Three colors and a based model. It looks great from three feet away and is fully legal for your weekend games or tournaments."
    },
    {
      title: "5. Completed - Tabletop and Show Ready",
      icon: <Trophy className="w-5 h-5 text-emerald-400" />,
      color: "border-emerald-500/30 bg-emerald-500/10",
      description: "Washes, edge highlights, decals, and extra details. You've gone the extra mile. This is the ultimate goal for your recovery."
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mr-4">
                <Info className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Hobby Phase Guide</h2>
                <p className="text-zinc-400 text-sm">Understand the lifecycle of your plastic addiction.</p>
              </div>
            </div>

            <div className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800/50 shadow-inner mb-8">
              <img
                src={progressSteps}
                alt="Hobby Progress Steps"
                className="w-full h-auto object-cover"
              />
            </div>

            {/* New 5-Stage Layout */}
            <div className="space-y-3">
              {phases.map((phase, index) => (
                <div key={index} className="flex items-start p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  <div className={`p-2 rounded-lg border mr-4 flex-shrink-0 ${phase.color}`}>
                    {phase.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base mb-1">
                      {phase.title}
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {phase.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
              <button
                onClick={onClose}
                className="px-8 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all border border-zinc-700"
              >
                Got it, back to the grind
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}