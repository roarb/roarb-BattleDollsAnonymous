import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, LayoutDashboard, Package, Camera, Trophy, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import logo from '../assets/WarDollies_Logo.png';

export function Login() {
  const { login } = useAuth();

  const features = [
    {
      title: "Accountability Mirror",
      desc: "Visual evidence of your poor life choices. Charts that show exactly how much unbuilt plastic is winning the war for your closet space.",
      icon: LayoutDashboard,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "The Digital Stash",
      desc: "Inventory your shame. We auto-fill MSRP so you can calculate exactly how many mortgage payments are currently sitting on sprues.",
      icon: Package,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      title: "Evidence of Progress",
      desc: "Before and after sliders. Because staring at a primed model for six months doesn't count as 'Work in Progress' without proof.",
      icon: Camera,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Validation Badges",
      desc: "Earn digital trophies for doing what you should've been doing anyway. Unlock 'Two Thin Coats' and feel a brief flash of self-worth.",
      icon: Trophy,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950/20 flex flex-col py-12 px-4 sm:px-6 lg:px-8 relative z-10 scroll-smooth">
      <div className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-12 lg:mb-0"
          >
            <div className="flex justify-center lg:justify-start mb-8">
              <img src={logo} alt="War Dollies Logo" className="h-32 w-auto drop-shadow-[0_0_25px_rgba(59,130,246,0.2)]" />
            </div>
            <h2 className="text-center lg:text-left text-xl font-medium text-blue-400 tracking-widest uppercase">
              War Dollies Anonymous
            </h2>
            <h1 className="mt-2 text-center lg:text-left text-5xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Admitting it<br />is the <span className="text-blue-500">first step.</span>
            </h1>
            <p className="mt-6 text-center lg:text-left text-lg text-zinc-400 max-w-lg mx-auto lg:mx-0">
              Your unpainted pile is judging you right now. The sprues are whispering. Let's pretend we're going to fix that together.
            </p>
            
            <div className="mt-10 hidden lg:flex items-center space-x-4 text-zinc-500 text-sm">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-8 w-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center`}>
                    <div className="h-4 w-4 rounded-full bg-blue-500/50" />
                  </div>
                ))}
              </div>
              <p>Join 2,400+ other addicts in denial</p>
            </div>
          </motion.div>

          {/* Login Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="sm:mx-auto sm:w-full sm:max-w-md lg:ml-auto"
          >
            <div className="bg-zinc-900/50 backdrop-blur-xl p-8 shadow-2xl rounded-2xl border border-zinc-800/50">
              <div className="mb-6 text-center">
                <p className="text-zinc-300 font-medium">Ready to confess?</p>
              </div>
              <button
                onClick={login}
                className="group w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-zinc-900 transition-all items-center"
              >
                <LogIn className="mr-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                Sign in with Google
              </button>
              
              <div className="mt-8 pt-6 border-t border-zinc-800/50 text-center">
                <button 
                  onClick={login}
                  className="text-sm text-zinc-500 hover:text-blue-400 transition-colors flex items-center justify-center mx-auto group"
                >
                  Create an account and accept your fate
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Teaser Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-24"
        >
          <div className="text-center mb-16">
            <h3 className="text-zinc-500 uppercase tracking-[0.3em] text-sm font-bold mb-4">The 12 Steps to Tabletop Ready</h3>
            <h2 className="text-3xl font-bold text-white">How we help you lie to yourself</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="group bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-2xl hover:border-zinc-700/50 transition-all hover:-translate-y-1 duration-300"
              >
                <div className={`h-12 w-12 ${feature.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer Teaser */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-24 text-center border-t border-zinc-800/30 pt-12"
        >
          <p className="text-zinc-500 italic text-sm">
            "I only bought it because it was a limited run." — Every user, immediately before logging their 50th relapse.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

