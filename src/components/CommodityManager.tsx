import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingUp, TrendingDown, Lock } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useEthersSigner } from '@/hooks/useEthersSigner';
import { createCommodity, getAllCommoditySymbols, getCommodityInfo } from '@/lib/fhe-trading-utils';
import { Contract } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';

interface Commodity {
  symbol: string;
  name: string;
  price: number;
  isActive: boolean;
}

export default function CommodityManager() {
  const { address } = useAccount();
  const { getSigner } = useEthersSigner();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Form state for creating new commodity
  const [newCommodity, setNewCommodity] = useState({
    symbol: '',
    name: '',
    price: '',
    supply: ''
  });

  // Load commodities from contract
  const loadCommodities = async () => {
    if (!getSigner) return;
    
    setLoading(true);
    try {
      console.log('🔄 Loading commodities from contract...');
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const symbols = await getAllCommoditySymbols(contract);
      console.log('📊 Loaded symbols:', symbols);
      
      const commodityData: Commodity[] = [];
      for (const symbol of symbols) {
        try {
          const info = await getCommodityInfo(contract, symbol);
          commodityData.push({
            symbol: info.symbol,
            name: info.name,
            price: info.currentPrice,
            isActive: info.isActive
          });
        } catch (error) {
          console.error(`❌ Error loading ${symbol}:`, error);
        }
      }
      
      setCommodities(commodityData);
      console.log('✅ Commodities loaded successfully:', commodityData);
    } catch (error) {
      console.error('❌ Failed to load commodities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new commodity
  const handleCreateCommodity = async () => {
    if (!getSigner || !newCommodity.symbol || !newCommodity.name || !newCommodity.price || !newCommodity.supply) {
      alert('Please fill all fields');
      return;
    }

    setCreating(true);
    try {
      console.log('🔄 Creating new commodity...');
      const signer = await getSigner();
      
      const txHash = await createCommodity(
        signer,
        newCommodity.symbol.toUpperCase(),
        newCommodity.name,
        parseFloat(newCommodity.price),
        parseInt(newCommodity.supply)
      );
      
      console.log('✅ Commodity created successfully!');
      console.log('📊 Transaction hash:', txHash);
      
      // Reset form
      setNewCommodity({
        symbol: '',
        name: '',
        price: '',
        supply: ''
      });
      setShowCreateDialog(false);
      
      // Reload commodities
      await loadCommodities();
      
      alert('✅ Commodity created successfully!');
    } catch (error) {
      console.error('❌ Failed to create commodity:', error);
      alert('❌ Failed to create commodity: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // Load commodities on component mount
  React.useEffect(() => {
    loadCommodities();
  }, [getSigner]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🏭 Commodity Manager</h2>
          <p className="text-gray-600">Manage and trade encrypted commodity assets</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadCommodities}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Commodity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Commodity</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={newCommodity.symbol}
                    onChange={(e) => setNewCommodity({...newCommodity, symbol: e.target.value.toUpperCase()})}
                    placeholder="e.g., GOLD"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newCommodity.name}
                    onChange={(e) => setNewCommodity({...newCommodity, name: e.target.value})}
                    placeholder="e.g., Gold Futures"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newCommodity.price}
                    onChange={(e) => setNewCommodity({...newCommodity, price: e.target.value})}
                    placeholder="e.g., 1987.45"
                  />
                </div>
                <div>
                  <Label htmlFor="supply">Total Supply</Label>
                  <Input
                    id="supply"
                    type="number"
                    value={newCommodity.supply}
                    onChange={(e) => setNewCommodity({...newCommodity, supply: e.target.value})}
                    placeholder="e.g., 1000000"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateCommodity}
                    disabled={creating || !newCommodity.symbol || !newCommodity.name || !newCommodity.price || !newCommodity.supply}
                    className="flex-1"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Commodities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {commodities.map((commodity) => (
          <Card key={commodity.symbol} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {commodity.symbol === 'GOLD' && '🥇'}
                    {commodity.symbol === 'OIL' && '🛢️'}
                    {commodity.symbol === 'WHEAT' && '🌾'}
                    {commodity.symbol === 'COPPER' && '🔶'}
                    {!['GOLD', 'OIL', 'WHEAT', 'COPPER'].includes(commodity.symbol) && '📦'}
                  </span>
                  <span>{commodity.symbol}</span>
                </div>
                <Badge variant={commodity.isActive ? "default" : "secondary"}>
                  {commodity.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">{commodity.name}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">${commodity.price.toFixed(2)}</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-500">+0.62%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Badge variant="outline" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    FHE Encrypted
                  </Badge>
                  <div className="text-xs text-gray-500">
                    Volume: 24.5M
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {commodities.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-semibold mb-2">No Commodities Found</h3>
              <p className="text-sm">Create your first commodity to start trading</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading commodities...</p>
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      {!address && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="text-center py-4">
            <p className="text-yellow-800">
              Please connect your wallet to manage commodities
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
