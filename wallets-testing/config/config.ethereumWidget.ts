import {
  NetworkConfig,
  NETWORKS_CONFIG,
} from '@lidofinance/wallets-testing-wallets';
import { configService } from './config.service';

export interface WidgetConfig {
  url: string;
  rpcUrlToMock: string;
  name: string;
  network: NetworkConfig;
  stakeContract: string;
  wrapContract?: {
    stETH: string;
    ETH: string;
  };
  withdrawalContract: string;
}

const ETHEREUM_WIDGET_CONFIG: WidgetConfig = {
  url: 'https://stake.lido.fi',
  rpcUrlToMock: '.*/api/rpc\\?chainId=1',
  name: 'ethereum',
  network: {
    ...NETWORKS_CONFIG.mainnet.ETHEREUM,
    rpcUrl: `https://lb.drpc.org/ogrpc?network=ethereum&dkey=${configService.get(
      'RPC_URL_TOKEN',
    )}`,
  },
  stakeContract: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  wrapContract: {
    stETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    ETH: '0xa88f0329C2c4ce51ba3fc619BBf44efE7120Dd0d',
  },
  withdrawalContract: '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1',
};

const HOODI_WIDGET_CONFIG: WidgetConfig = {
  url: 'https://stake-hoodi.testnet.fi',
  rpcUrlToMock: '',
  name: 'hoodi',
  network: {
    ...NETWORKS_CONFIG.testnet.ETHEREUM_HOODI,
    rpcUrl: `https://lb.drpc.org/ogrpc?network=hoodi&dkey=${configService.get(
      'RPC_URL_TOKEN',
    )}`,
  },
  stakeContract: '0x3508A952176b3c15387C97BE809eaffB1982176a',
  wrapContract: {
    stETH: '0x7E99eE3C66636DE415D2d7C880938F2f40f94De4',
    ETH: '0xf886BcC68b240316103fE8A12453Ce7831c2e835',
  },
  withdrawalContract: '0xfe56573178f1bcdf53F01A6E9977670dcBBD9186',
};

export const getWidgetConfig = {
  Ethereum: ETHEREUM_WIDGET_CONFIG,
  'Ethereum Hoodi': HOODI_WIDGET_CONFIG,
};

export const IS_SAFE_TESTING = String(process.env.GITHUB_WORKFLOW).includes(
  'Safe',
);
export const IS_MAINNET = String(process.env.SUITE).includes('mainnet');
