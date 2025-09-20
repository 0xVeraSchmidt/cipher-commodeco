import { Shield, Lock, Database, Zap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
      {/* Animated Conveyor Belt */}
      <div className="relative overflow-hidden h-16 bg-gradient-to-r from-muted/20 to-secondary/20">
        <div className="absolute inset-0 flex items-center">
          <div className="conveyor-animation flex items-center space-x-8 text-4xl">
            🛢️ 🥇 🌾 🔶 🛢️ 🥇 🌾 🔶 🛢️ 🥇 🌾 🔶
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background"></div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gold">CommodiTrade</h3>
            <p className="text-sm text-muted-foreground">
              Revolutionary confidential commodity trading platform powered by blockchain technology.
            </p>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Military-grade encryption</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center space-x-2">
                <Lock className="h-3 w-3" />
                <span>Zero-knowledge trading</span>
              </li>
              <li className="flex items-center space-x-2">
                <Database className="h-3 w-3" />
                <span>Tokenized commodities</span>
              </li>
              <li className="flex items-center space-x-2">
                <Zap className="h-3 w-3" />
                <span>Instant settlement</span>
              </li>
            </ul>
          </div>

          {/* Markets */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Markets</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>🥇 Precious Metals</li>
              <li>🛢️ Energy Futures</li>
              <li>🌾 Agricultural Products</li>
              <li>🔶 Industrial Metals</li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Risk Disclosure</li>
              <li>Compliance</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 CommodiTrade. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-xs text-muted-foreground">Regulated by:</span>
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-1 bg-gold/10 rounded text-gold">CFTC</span>
                <span className="px-2 py-1 bg-gold/10 rounded text-gold">SEC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;