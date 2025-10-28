import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useCreateOrder } from "@/lib/contract";
import { useZamaInstance } from "@/hooks/useZamaInstance";
import { usePriceManager } from "@/hooks/usePriceManager";
import { useAccount } from "wagmi";

const orderSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  price: z.string().min(1, "Price is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Price must be a positive number"
  ),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  type: "buy" | "sell";
  commodity: {
    symbol: string;
    name: string;
    price: number;
    icon: string;
  };
}

const OrderForm = ({ type, commodity }: OrderFormProps) => {
  const { toast } = useToast();
  const { createOrder, isPending, error } = useCreateOrder();
  const { instance, isLoading: fheLoading } = useZamaInstance();
  const { getPrice } = usePriceManager();
  const { address } = useAccount();
  
  // Debug logging
  console.log('OrderForm Debug:', {
    instance: !!instance,
    fheLoading,
    instanceMethods: instance ? Object.keys(instance) : null
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      amount: "",
      price: commodity.price > 0 ? commodity.price.toFixed(2) : "",
    },
  });

  // Update price when commodity changes or price manager updates
  useEffect(() => {
    const priceData = getPrice(commodity.symbol);
    const currentPrice = priceData?.currentPrice || commodity.price;
    if (currentPrice > 0) {
      setValue("price", currentPrice.toFixed(2));
    }
  }, [commodity.symbol, commodity.price, getPrice, setValue]);

  const onSubmit = async (data: OrderFormData) => {
    if (!instance || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to place orders.",
        variant: "destructive",
      });
      return;
    }

    try {
      const amount = Number(data.amount);
      const price = Number(data.price);
      const isBuy = type === "buy";
      
      // Ensure price is a valid number
      if (isNaN(price) || price <= 0) {
        throw new Error('Invalid price format');
      }
      
      // Create encrypted order on blockchain using FHE
      await createOrder(commodity.symbol, amount, price, isBuy);
      
      const orderValue = amount * price;
      
      toast({
        title: `${type === "buy" ? "Buy" : "Sell"} Order Placed`,
        description: `${data.amount} units of ${commodity.symbol} ($${orderValue.toLocaleString()})`,
      });
      
      reset();
    } catch (error) {
      console.error('Order submission error:', error);
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Unable to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isBuy = type === "buy";
  const isDisabled = isPending || fheLoading || !instance || !address;

  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle className={isBuy ? "text-success" : "text-destructive"}>
          {isBuy ? "Buy" : "Sell"} Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${type}-amount`}>Amount</Label>
            <Input
              id={`${type}-amount`}
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amount")}
              className="font-mono"
              disabled={isDisabled}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${type}-price`}>Price (USD)</Label>
            <Input
              id={`${type}-price`}
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("price")}
              className="font-mono"
              disabled={isDisabled}
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Market</Label>
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
              <span className="text-lg">{commodity.icon}</span>
              <span className="text-sm font-medium">{commodity.symbol}</span>
            </div>
          </div>

          {fheLoading && (
            <div className="text-sm text-muted-foreground text-center">
              Initializing FHE encryption...
            </div>
          )}

          {!instance && !fheLoading && (
            <div className="text-sm text-destructive text-center">
              FHE encryption service unavailable
            </div>
          )}

          <Button 
            type="submit"
            className={`w-full ${
              isBuy 
                ? "bg-success hover:bg-success/90 text-success-foreground" 
                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            }`}
            disabled={isDisabled}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Encrypting & Submitting...
              </>
            ) : (
              `Place ${isBuy ? "Buy" : "Sell"} Order`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;