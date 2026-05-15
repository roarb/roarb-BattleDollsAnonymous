import React, { useState } from 'react';
import { Mail, Github, Twitter, Lightbulb, Palette, X, Skull, PaintBucket, Coins } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [confession, setConfession] = useState('');

  const handleVenmoRedirect = (amount: number | string, note: string) => {
    const encodedNote = encodeURIComponent(note || 'Relapse Jar');
    const venmoUrl = `venmo://paycharge?txn=pay&recipients=Robert-Hoehn-8&amount=${amount}&note=${encodedNote}`;
    const webFallback = `https://venmo.com/u/Robert-Hoehn-8`;

    // Try deep link
    window.location.href = venmoUrl;

    // Fallback
    setTimeout(() => {
      window.open(webFallback, '_blank');
    }, 500);
  };

  return (
    <>
      <footer className="mt-auto py-8 border-t border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Creator & Contact */}
            <div>
              <h3 className="text-white font-medium mb-3">War Dollies Anonymous</h3>
              <p className="text-sm mb-4">
                Built by Rob Hoehn.<br />
                Manage your pile of shame and conquer the tabletop.
              </p>
              <div className="flex space-x-4 mb-6">
                <a href="mailto:rhoehn24@gmail.com" className="text-zinc-500 hover:text-blue-400 transition-colors" title="Contact Creator">
                  <Mail className="h-5 w-5" />
                  <span className="sr-only">Email</span>
                </a>
                <a href="mailto:rhoehn24@gmail.com?subject=Feature%20Request%20-%20Battle%20Dolls%20Anonymous" className="text-zinc-500 hover:text-blue-400 transition-colors" title="Feature Requests">
                  <Lightbulb className="h-5 w-5" />
                  <span className="sr-only">Feature Requests</span>
                </a>
                <a href="https://x.com/DolliesWarAnon" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-blue-400 transition-colors" title="Twitter / X">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </a>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/20 rounded-lg text-sm font-medium"
              >
                <Palette className="w-4 h-4" />
                <span>The Relapse Jar</span>
              </button>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-medium mb-3">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:rhoehn24@gmail.com?subject=Bug%20Report%20-%20Battle%20Dolls%20Anonymous" className="hover:text-white transition-colors">
                    Report a Bug
                  </a>
                </li>
                <li>
                  <a href="mailto:rhoehn24@gmail.com?subject=Feature%20Request%20-%20Battle%20Dolls%20Anonymous" className="hover:text-white transition-colors">
                    Suggest a Feature
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Disclaimer */}
            <div>
              <h3 className="text-white font-medium mb-3">Disclaimer</h3>
              <p className="text-xs leading-relaxed text-zinc-500">
                This application is an unofficial hobby tracking and list building tool. It is not affiliated with, endorsed, sponsored, or specifically approved by Games Workshop Limited.
                Warhammer, Warhammer 40,000, Age of Sigmar, and any associated logos, names, factions, and creatures are trademarks or registered trademarks of Games Workshop Limited. All rights reserved to their respective owners.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-800/50 flex flex-col sm:flex-row justify-between items-center text-xs">
            <p>&copy; {currentYear} Rob Hoehn. All rights reserved.</p>
            <p className="mt-2 sm:mt-0 text-zinc-500">
              "Only in death does duty end... but the pile of shame grows forever."
            </p>
          </div>
        </div>
      </footer>

      {/* Relapse Jar Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-500/10 border-2 border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4">
                <PaintBucket className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">The Relapse Jar</h2>
              <p className="text-zinc-400 text-sm">
                It happens to the best of us: "Just one more box" turns into a 2,000 pt army. Pay your penance to help keep these servers running!
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleVenmoRedirect(5, "Relapse Jar - A Pot of Wash")}
                className="w-full relative group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/50 p-4 rounded-xl flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium group-hover:text-blue-400 transition-colors">The Standard Penance</div>
                    <div className="text-zinc-500 text-xs">Buy the dev a pot of Nuln Oil ($5)</div>
                  </div>
                </div>
                <div className="text-zinc-300 font-medium">$5</div>
              </button>

              <button
                onClick={() => handleVenmoRedirect(20, "Heavy Relapse - A Combat Patrol")}
                className="w-full relative group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/50 p-4 rounded-xl flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
                    <Skull className="w-5 h-5 group-hover:animate-pulse" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium group-hover:text-red-400 transition-colors">The Heavy Relapse</div>
                    <div className="text-zinc-500 text-xs">You bought the big box, didn't you? ($20)</div>
                  </div>
                </div>
                <div className="text-zinc-300 font-medium">$20</div>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-white mb-3">Custom Confession</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={confession}
                  onChange={(e) => setConfession(e.target.value)}
                  placeholder="What did you buy?"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex space-x-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input
                      type="number"
                      min="1"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 pl-7 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    disabled={!customAmount}
                    onClick={() => handleVenmoRedirect(customAmount, `Relapse Confession: ${confession || 'Anonymous Plastic Crack'}`)}
                    className="flex-none px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Confess & Pay
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[10px] text-zinc-600">
                You will be redirected to the Venmo app (or website). Thank you for supporting War Dollies Anonymous!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
