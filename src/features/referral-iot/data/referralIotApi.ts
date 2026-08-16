export interface ReferralData {
  referral_code: string;
  invited_count: number;
  reward_days_earned: number;
}

export interface IotDeviceItem {
  device_id: string;
  device_name: string;
  status: 'connected' | 'disconnected';
  streak_light_mode: 'breathing_fire' | 'solid_gold' | 'off';
}

export const fetchReferralDataApi = async (): Promise<ReferralData> => {
  return {
    referral_code: 'REF-SMART-88',
    invited_count: 4,
    reward_days_earned: 28
  };
};

export const fetchIotDevicesApi = async (): Promise<IotDeviceItem[]> => {
  return [
    {
      device_id: 'esp32-lamp-01',
      device_name: 'Đèn Học Thông Minh SmartLamp BLE',
      status: 'connected',
      streak_light_mode: 'breathing_fire'
    }
  ];
};
