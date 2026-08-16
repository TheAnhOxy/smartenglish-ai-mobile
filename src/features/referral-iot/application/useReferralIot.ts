import { useQuery } from '@tanstack/react-query';
import { fetchReferralDataApi, fetchIotDevicesApi } from '../data/referralIotApi';

export const useReferralQuery = () => {
  return useQuery({
    queryKey: ['referral-data'],
    queryFn: fetchReferralDataApi
  });
};

export const useIotDevicesQuery = () => {
  return useQuery({
    queryKey: ['iot-devices'],
    queryFn: fetchIotDevicesApi
  });
};
