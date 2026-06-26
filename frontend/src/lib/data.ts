export const stats = [
  { title: 'Total Orders', value: '12,500', change: '+11.4%', trend: 'up' },
  { title: 'High Risk Orders', value: '85', change: '-1.3%', trend: 'down' },
  { title: 'Blocked Orders', value: '22', change: '+2.1%', trend: 'up' },
  { title: 'Revenue Protected', value: '$15,450', change: '+8.2%', trend: 'up' },
];

export const fraudTrendData = [
  { name: 'Jan', fraud: 34, safe: 86 },
  { name: 'Feb', fraud: 46, safe: 92 },
  { name: 'Mar', fraud: 58, safe: 105 },
  { name: 'Apr', fraud: 49, safe: 98 },
  { name: 'May', fraud: 72, safe: 112 },
  { name: 'Jun', fraud: 64, safe: 101 },
];

export const riskLevels = [
  { name: 'High', value: 32, color: '#EF4444' },
  { name: 'Medium', value: 45, color: '#F59E0B' },
  { name: 'Low', value: 23, color: '#22C55E' },
];

export const alerts = [
  {
    id: 'AL-1001',
    title: 'High risk order detected',
    severity: 'High',
    status: 'New',
    date: 'Today, 10:24 AM',
    details: 'Multiple risky signals detected on order #9821.',
  },
  {
    id: 'AL-1002',
    title: 'Multiple failed payments',
    severity: 'Medium',
    status: 'Review',
    date: 'Today, 9:16 AM',
    details: '5 failed transactions from the same customer.',
  },
  {
    id: 'AL-1003',
    title: 'VPN detected',
    severity: 'Low',
    status: 'New',
    date: 'Today, 8:40 AM',
    details: 'Unusual VPN use from a new shipping address.',
  },
];

export const trustedLogs = [
  'Shopify',
  'WooCommerce',
  'Magento',
  'BigCommerce',
  'PrestaShop',
  'OpenCart',
];

export const integrations = [
  { name: 'Shopify', connected: true },
  { name: 'WooCommerce', connected: false },
  { name: 'Magento', connected: false },
  { name: 'BigCommerce', connected: true },
  { name: 'PrestaShop', connected: false },
  { name: 'OpenCart', connected: false },
];
