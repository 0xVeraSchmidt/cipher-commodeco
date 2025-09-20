import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Zap, TrendingUp } from "lucide-react";
import logo from "@/assets/logo.png";

const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Cipher Commodeco" className="h-10 w-10 gold-glow" />
            <div>
              <h1 className="text-xl font-bold text-gold">Cipher Commodeco</h1>
              <p className="text-xs text-muted-foreground">FHE-Powered Trading</p>
            </div>
          </div>

          {/* Main Message */}
          <div className="hidden md:block text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Trade Commodities with <span className="text-gold">Privacy</span>
            </h2>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-1">
              <Zap className="h-4 w-4" />
              Encrypted until clearing • Zero market manipulation
              <TrendingUp className="h-4 w-4" />
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-3">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;