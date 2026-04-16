import sdk from '@farcaster/frame-sdk';
import { SwitchChainError, fromHex, getAddress, numberToHex } from 'viem';
import { ChainNotConfiguredError, createConnector } from 'wagmi';

frameConnector.type = 'frameConnector' as const;

function getEthProvider() {
  try {
    return sdk?.wallet?.ethProvider ?? null;
  } catch {
    return null;
  }
}

export function frameConnector() {
  let connected = true;

  return createConnector<typeof sdk.wallet.ethProvider>((config) => ({
    id: 'farcaster',
    name: 'Farcaster Wallet',
    type: frameConnector.type,

    async setup() {
      const provider = getEthProvider();
      if (!provider) return;
      this.connect({ chainId: config.chains[0].id }).catch(() => {});
    },
    async connect({ chainId } = {}) {
      const provider = getEthProvider();
      if (!provider) throw new Error('Farcaster SDK not available');

      try {
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        });

        let currentChainId = await this.getChainId();
        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain!({ chainId });
          currentChainId = chain.id;
        }

        connected = true;

        return {
          accounts: accounts.map((x) => getAddress(x)),
          chainId: currentChainId,
        };
      } catch {
        connected = false;
        throw new Error('Farcaster wallet not available');
      }
    },
    async disconnect() {
      connected = false;
    },
    async getAccounts() {
      if (!connected) throw new Error('Not connected');
      const provider = getEthProvider();
      if (!provider) return [];

      try {
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        });
        return accounts.map((x) => getAddress(x));
      } catch {
        return [];
      }
    },
    async getChainId() {
      const provider = getEthProvider();
      if (!provider) return config.chains[0].id;

      try {
        const hexChainId = await provider.request({ method: 'eth_chainId' });
        return fromHex(hexChainId, 'number');
      } catch {
        return config.chains[0].id;
      }
    },
    async isAuthorized() {
      if (!connected) return false;
      const provider = getEthProvider();
      if (!provider) return false;

      try {
        const accounts = await this.getAccounts();
        return !!accounts.length;
      } catch {
        return false;
      }
    },
    async switchChain({ chainId }) {
      const provider = getEthProvider();
      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());

      if (provider) {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: numberToHex(chainId) }],
        });
      }
      return chain;
    },
    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.onDisconnect();
      else
        config.emitter.emit('change', {
          accounts: accounts.map((x) => getAddress(x)),
        });
    },
    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit('change', { chainId });
    },
    async onDisconnect() {
      config.emitter.emit('disconnect');
      connected = false;
    },
    async getProvider() {
      return sdk.wallet.ethProvider;
    },
  }));
}