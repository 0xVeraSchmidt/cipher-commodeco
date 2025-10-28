import { useState, useEffect, useRef } from 'react';
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/bundle';

// 全局缓存，避免重复初始化
let globalInstance: FhevmInstance | null = null;
let globalInitPromise: Promise<FhevmInstance> | null = null;
let isInitializing = false;

export function useZamaInstance() {
  const [instance, setInstance] = useState<FhevmInstance | null>(globalInstance);
  const [isLoading, setIsLoading] = useState(!globalInstance);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // 如果已经有全局实例，直接使用
    if (globalInstance) {
      setInstance(globalInstance);
      setIsLoading(false);
      return;
    }

    // 如果正在初始化，等待完成
    if (globalInitPromise) {
      globalInitPromise.then((inst) => {
        if (mountedRef.current) {
          setInstance(inst);
          setIsLoading(false);
        }
      }).catch((err) => {
        if (mountedRef.current) {
          setError(`Failed to initialize encryption service: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      });
      return;
    }

    // 开始初始化
    const initZama = async () => {
      if (isInitializing) return;
      
      isInitializing = true;
      setIsLoading(true);
      setError(null);

      try {
        console.log('🚀 Starting FHE initialization process...');

        // 检查CDN脚本是否加载
        if (typeof window !== 'undefined' && !window.relayerSDK) {
          console.warn('⚠️ FHE SDK CDN script not loaded, waiting...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (!window.relayerSDK) {
            throw new Error('FHE SDK CDN script not loaded. Please check network connection.');
          }
        }

        console.log('🔄 Step 1: Initializing FHE SDK...');
        console.log('📊 SDK available:', !!window.relayerSDK);
        console.log('📊 initSDK function:', typeof window.relayerSDK?.initSDK);
        
        try {
          await initSDK();
          console.log('✅ Step 1 completed: FHE SDK initialized successfully');
        } catch (initError) {
          console.warn('⚠️ FHE SDK initialization failed, trying alternative approach:', initError);
          // Try to continue without explicit initSDK call
          console.log('🔄 Attempting to create instance directly...');
        }

        console.log('🔄 Step 2: Creating FHE instance with Sepolia config...');
        console.log('📊 SepoliaConfig:', SepoliaConfig);
        
        const zamaInstance = await createInstance(SepoliaConfig);
        console.log('✅ Step 2 completed: FHE instance created successfully');
        console.log('📊 Instance methods:', Object.keys(zamaInstance || {}));

        // 设置全局实例
        globalInstance = zamaInstance;
        
        if (mountedRef.current) {
          setInstance(zamaInstance);
          console.log('🎉 FHE initialization completed successfully!');
          console.log('📊 Instance ready for encryption/decryption operations');
        }
      } catch (err) {
        console.error('❌ FHE initialization failed at step:', err);
        console.error('📊 Error details:', {
          name: err?.name,
          message: err?.message,
          stack: err?.stack
        });
        
        if (mountedRef.current) {
          setError(`Failed to initialize encryption service: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } finally {
        isInitializing = false;
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    globalInitPromise = initZama();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { instance, isLoading, error };
}
