import Header from "@/components/Header";
import TradingInterface from "@/components/TradingInterface";
import CommodityManager from "@/components/CommodityManager";
import PriceTicker from "@/components/PriceTicker";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PriceTicker />
      <div className="container mx-auto px-4 py-8">
        <CommodityManager />
      </div>
      <TradingInterface />
      <Footer />
    </div>
  );
};

export default Index;
