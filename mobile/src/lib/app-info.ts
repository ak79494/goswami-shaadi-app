import { useEffect, useState } from 'react';

import { api } from './api';
import type { AppInfo } from './types';

/** Used until the server answers (and if it can't be reached), so About and Help always work. */
export const DEFAULT_APP_INFO: AppInfo = {
  companyName: 'GoswamiJodi',
  founderName: 'Arun Goswami',
  supportPhone: '7903508584',
  supportWhatsapp: '7903508584',
  supportEmail: 'support@goswamijodi.com',
  astroWhatsapp: '7903508584',
};

let cached: AppInfo | null = null;

export function useAppInfo(): AppInfo {
  const [info, setInfo] = useState<AppInfo>(cached ?? DEFAULT_APP_INFO);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    api
      .get<AppInfo>('/public/app-info')
      .then((res) => {
        cached = { ...DEFAULT_APP_INFO, ...res };
        if (alive) setInfo(cached);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return info;
}
